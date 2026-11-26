// All three games share credentials and request budgets on this browser origin.
export const CONFIG_KEY = 'backmir-gist-config-v1';
export const INDEX_FILE = 'backmir-index.json';
export const GIST_DESCRIPTION = 'BackMir cloud saves';
const API = 'https://api.github.com';
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const games = new Set(['classic', 'classic-hell', 'darkforged']);
export const saveFile = game => {
  if (!games.has(game)) throw new GistError('invalid');
  return `backmir-${game}.json`;
};
export class GistError extends Error {
  constructor(code, until = 0, status = 0) { super(code); this.code = code; this.until = until; this.status = status; }
}
function pauseRequests(value, code, until) {
  if (until >= (value.until || 0)) {
    value.until = until;
    value.untilCode = code;
  }
}
function readJSON(storage, key, fallback) {
  const text = storage.getItem(key);
  if (!text) return fallback;
  try { return JSON.parse(text); } catch { throw new GistError('storage'); }
}
export class GistClient {
  constructor({ storage = globalThis.localStorage, fetcher = globalThis.fetch.bind(globalThis),
    now = () => Date.now(), locks = globalThis.navigator?.locks } = {}) {
    Object.assign(this, { storage, fetcher, now, locks });
  }
  config() { return readJSON(this.storage, CONFIG_KEY, {}); }
  get waiting() {
    if (!this.budgetScope || this.budgetScope.revision !== this.config().revision) return null;
    const value = readJSON(this.storage, this.budgetScope.key, {});
    return value.until > this.now() ? { code: value.untilCode || 'cooldown', until: value.until } : null;
  }
  configure(token, gistId = '', auto = true) {
    token = token.trim(); gistId = gistId.trim();
    if (!/^[A-Za-z0-9_]+$/.test(token) || (gistId && !/^[a-f0-9]{5,64}$/i.test(gistId)))
      throw new GistError('invalid');
    const old = this.config();
    const value = { token, gistId: gistId || (old.token === token ? old.gistId : '') || '',
      auto, revision: crypto.randomUUID() };
    this.storage.setItem(CONFIG_KEY, JSON.stringify(value));
    return value;
  }
  forget() { this.storage.removeItem(CONFIG_KEY); }
  setAuto(auto) {
    const value = this.config();
    this.storage.setItem(CONFIG_KEY, JSON.stringify({ ...value, auto }));
  }
  assertAccount(account) {
    const current = this.config();
    if (current.token !== account.token || current.revision !== account.revision)
      throw new GistError('changed');
  }
  async exclusive(action) {
    const account = this.config();
    if (!account.token) throw new GistError('token');
    if (!this.locks) throw new GistError('unsupported');
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(account.token));
    const id = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
    this.budgetScope = { revision: account.revision, key: 'backmir-gist-rate-v1:' + id };
    return this.locks.request('backmir-gist:' + id, async () => {
      this.assertAccount(account);
      return action(this.config(), 'backmir-gist-rate-v1:' + id);
    });
  }
  rememberGist(account, gistId) {
    this.assertAccount(account);
    if (!/^[a-f0-9]{5,64}$/i.test(gistId || '')) throw new GistError('invalid');
    const current = this.config();
    this.storage.setItem(CONFIG_KEY, JSON.stringify({ ...current, gistId }));
    account.gistId = gistId;
  }
  budget(key, write, account) {
    const now = this.now(), value = readJSON(this.storage, key, {});
    value.requests = (value.requests || []).filter(t => t > now - HOUR);
    value.writes = (value.writes || []).filter(t => t > now - HOUR);
    if (value.suspended === account.revision) throw new GistError('permission');
    if (value.until > now) throw new GistError(value.untilCode || 'cooldown', value.until);
    value.until = 0;
    delete value.untilCode;
    let until = 0;
    const minute = value.requests.filter(t => t > now - MINUTE);
    if (minute.length >= 12) until = Math.max(until, minute[0] + MINUTE);
    if (value.requests.length >= 480) until = Math.max(until, value.requests[0] + HOUR);
    if (write && value.writes.length) until = Math.max(until, value.writes.at(-1) + 10_000);
    if (write && value.writes.length >= 360) until = Math.max(until, value.writes[0] + HOUR);
    if (until > now) throw new GistError('throttle', until);
    value.requests.push(now);
    if (write) value.writes.push(now);
    // Reserve before sending, including failed and timed-out requests.
    this.storage.setItem(key, JSON.stringify(value));
    return value;
  }
  async request(account, key, route, { method = 'GET', body, raw = false } = {}) {
    this.assertAccount(account);
    const url = new URL(raw ? route : API + route);
    if ((!raw && (url.origin !== API || !url.pathname.startsWith('/gists'))) ||
      (raw && (url.protocol !== 'https:' || url.hostname !== 'gist.githubusercontent.com')))
      throw new GistError('invalid');
    const value = this.budget(key, method !== 'GET', account);
    let response;
    try {
      response = await this.fetcher(url.href, {
        method, credentials: 'omit', cache: 'no-store', redirect: 'error',
        headers: raw ? {} : { Authorization: 'Bearer ' + account.token,
          Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28',
          ...(body ? { 'Content-Type': 'application/json' } : {}) },
        body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(20_000),
      });
    } catch (error) {
      const code = error?.name === 'TimeoutError' ? 'timeout' : 'network';
      value.failures = (value.failures || 0) + 1;
      pauseRequests(value, code, this.now() + Math.min(HOUR, MINUTE * 2 ** Math.min(value.failures - 1, 6)));
      this.storage.setItem(key, JSON.stringify(value));
      throw new GistError(code, value.until);
    }
    const remaining = response.headers.get('x-ratelimit-remaining');
    const reset = Number(response.headers.get('x-ratelimit-reset')) * 1000;
    if (remaining !== null && Number(remaining) <= 25)
      pauseRequests(value, 'quota', reset > this.now() ? reset + 1000 : this.now() + HOUR);
    let result;
    try {
      const content = await response.text();
      if (raw && response.ok) result = content;
      else { try { result = JSON.parse(content); } catch { result = {}; } }
    } catch {
      value.failures = (value.failures || 0) + 1;
      pauseRequests(value, 'network', this.now() + Math.min(HOUR, MINUTE * 2 ** Math.min(value.failures - 1, 6)));
      this.storage.setItem(key, JSON.stringify(value));
      throw new GistError('network', value.until);
    }
    const retry = response.headers.get('retry-after');
    const rateLimited = response.status === 429 || (response.status === 403 &&
      (remaining === '0' || retry !== null || /rate limit/i.test(result.message || '')));
    if (rateLimited) {
      value.failures = (value.failures || 0) + 1;
      const retryAt = retry === null ? 0 : /^\d+$/.test(retry)
        ? this.now() + Number(retry) * 1000 : Date.parse(retry);
      pauseRequests(value, 'rate', Math.max(value.until || 0, retryAt || 0,
        this.now() + Math.min(HOUR, MINUTE * 2 ** Math.min(value.failures - 1, 6))));
    } else if (response.status === 401 || response.status === 403) value.suspended = account.revision;
    else if (response.ok) value.failures = 0;
    else if (response.status >= 500) {
      value.failures = (value.failures || 0) + 1;
      pauseRequests(value, 'server', this.now() + Math.min(HOUR, MINUTE * 2 ** Math.min(value.failures - 1, 6)));
    }
    this.storage.setItem(key, JSON.stringify(value));
    this.assertAccount(account);
    if (rateLimited) throw new GistError('rate', value.until, response.status);
    if (!response.ok) throw new GistError(({ 401: 'permission', 403: 'permission', 404: 'missing',
      422: 'invalid' })[response.status] || (response.status >= 500 ? 'server' : 'http'), value.until, response.status);
    return result;
  }
  async discover(account, key) {
    if (account.gistId) return account.gistId;
    // Discover once, then persist the ID. Never poll the player's Gist list.
    for (let page = 1; page <= 5; page++) {
      const list = await this.request(account, key, `/gists?per_page=100&page=${page}`);
      if (!Array.isArray(list)) throw new GistError('invalid');
      const found = list.find(g => g.description === GIST_DESCRIPTION && g.files?.[INDEX_FILE]);
      if (found) { this.rememberGist(account, found.id); return found.id; }
      if (list.length < 100) return null;
    }
    throw new GistError('chooseGist');
  }
  upload(game, saveJson, { automatic = false } = {}) {
    const filename = saveFile(game);
    if (typeof saveJson !== 'string' || !saveJson.length || saveJson.length > 1_500_000)
      throw new GistError('invalid');
    return this.exclusive(async (account, key) => {
      if (automatic && this.config().auto === false) throw new GistError('changed');
      const id = await this.discover(account, key);
      if (automatic && this.config().auto === false) throw new GistError('changed');
      const files = { [filename]: { content: saveJson } };
      const result = await this.request(account, key, id ? `/gists/${id}` : '/gists', {
        method: id ? 'PATCH' : 'POST',
        body: id ? { files } : { description: GIST_DESCRIPTION, public: false,
          files: { ...files, [INDEX_FILE]: { content: JSON.stringify({ format: 'backmir-gist-save', version: 1 }) } } },
      });
      this.rememberGist(account, result.id);
      return result;
    });
  }
  download(game) {
    const filename = saveFile(game);
    return this.exclusive(async (account, key) => {
      const id = await this.discover(account, key);
      if (!id) throw new GistError('noSave');
      const gist = await this.request(account, key, `/gists/${id}`);
      const file = gist.files?.[filename];
      if (!file) throw new GistError('noSave');
      const content = file.truncated ? await this.request(account, key, file.raw_url, { raw: true }) : file.content;
      if (typeof content !== 'string' || !content.length || content.length > 1_500_000)
        throw new GistError('invalid');
      return { saveJson: content, updatedAt: gist.updated_at };
    });
  }
}
