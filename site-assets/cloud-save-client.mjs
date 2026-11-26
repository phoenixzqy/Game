import { cloudBaseline, semanticSnapshot } from "./save-sync.mjs";
// localStorage mirrors are compatibility hints. The account's IndexedDB snapshot
// and baseline, committed in one transaction, are authoritative for protocol 2.
export class CloudSaveClient {
  constructor({
    fetcher = globalThis.fetch.bind(globalThis),
    storage = globalThis.localStorage,
    onUpload = () => {},
    commit = async () => {},
    context = () => undefined,
  } = {}) {
    this.fetcher = fetcher;
    this.storage = storage;
    this.onUpload = onUpload;
    this.commit = commit;
    this.context = context;
    this.bases = new Map();
    this.pending = new Map();
  }
  key(user) {
    return "backmir-cloud-base-v1:" + user;
  }
  base(user) {
    if (!this.bases.has(user)) {
      let value = null;
      try {
        value = JSON.parse(this.storage.getItem(this.key(user)));
      } catch {}
      this.bases.set(user, Number.isSafeInteger(value) && value >= 0 ? value : null);
    }
    return this.bases.get(user);
  }
  hydrate(user, sync) {
    this.bases.set(user, sync?.ownerId === user && sync?.protocol === 2 ? sync.baseRevision : null);
  }
  remember(user, revision) {
    try {
      this.storage.setItem(this.key(user), JSON.stringify(revision));
    } catch {}
    this.bases.set(user, revision);
  }
  forget(user) {
    this.storage.removeItem(this.key(user));
    this.bases.set(user, null);
  }
  forgetAll() {
    for (let i = this.storage.length - 1; i >= 0; i--) {
      const key = this.storage.key(i);
      if (key?.startsWith("backmir-cloud-base-v1:") && !key.endsWith(":backup"))
        this.storage.removeItem(key);
    }
    this.bases.clear();
  }
  backupBase(user) {
    try {
      const value = JSON.parse(this.storage.getItem(this.key(user) + ":backup"));
      return Number.isSafeInteger(value) && value >= 0 ? value : null;
    } catch {
      return null;
    }
  }
  rememberBackup(user, revision) {
    this.storage.setItem(this.key(user) + ":backup", JSON.stringify(revision));
  }
  progress(user) {
    try {
      const value = JSON.parse(this.storage.getItem(this.key(user) + ":progress"));
      return value?.revision === this.base(user) ? value.roles : {};
    } catch {
      return {};
    }
  }
  rememberProgress(user, saveJson) {
    try {
      this.storage.setItem(
        this.key(user) + ":progress",
        JSON.stringify({ revision: this.base(user), roles: semanticSnapshot(saveJson) }),
      );
    } catch {
      /* Missing hints only require another safe read. */
    }
  }
  async request(user, query = "", data) {
    const response = await this.fetcher("/Game/api/account/saves" + query, {
      method: data ? "POST" : "GET",
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        "X-Backmir-Account": user,
        "X-Backmir-Community": "1",
        "Content-Type": "application/json",
      },
      body: data ? JSON.stringify(data) : undefined,
      signal: AbortSignal.timeout(12000),
    });
    const result = await response.json();
    if (!response.ok) {
      const error = Error(
        result.errorCode ||
          { 401: "auth", 403: "auth", 409: "conflict", 429: "rateLimited" }[response.status] ||
          "unavailable",
      );
      error.status = response.status;
      throw error;
    }
    return result;
  }
  list(user) {
    this.base(user);
    return this.request(user);
  }
  read(user, revision) {
    return this.request(user, "?revision=" + revision);
  }
  readRecovery(user, id) {
    return this.request(user, "?recovery=" + encodeURIComponent(id));
  }
  protect(user, saveJson, headRevision) {
    return this.request(user, "", {
      action: "protect",
      baseRevision: headRevision,
      requestId: crypto.randomUUID(),
      saveJson,
    });
  }
  pendingKey(user) {
    return "backmir-cloud-request-v2:" + user;
  }
  readPending(user) {
    if (!this.pending.has(user)) {
      let value = null;
      try {
        value = JSON.parse(this.storage.getItem(this.pendingKey(user)));
      } catch {}
      this.pending.set(user, value);
    }
    return this.pending.get(user);
  }
  keepPending(user, value) {
    try {
      if (value) this.storage.setItem(this.pendingKey(user), JSON.stringify(value));
      else this.storage.removeItem(this.pendingKey(user));
    } catch {
      throw Error("storage");
    }
    this.pending.set(user, value);
  }
  async finishUpload(user, pending) {
    const context = this.context(user);
    const result = await this.request(user, "", pending);
    // Even if gameplay has advanced, only this captured payload is acknowledged.
    await this.commit(
      user,
      {
        baseRevision: result.revision,
        baseRoles: semanticSnapshot(pending.saveJson),
        serverConfirmedAt: result.createdAt || 0,
      },
      context,
    );
    this.remember(user, result.revision);
    this.rememberProgress(user, pending.saveJson);
    this.keepPending(user, null);
    try {
      this.onUpload(user, result);
    } catch {}
    return result;
  }
  async resumePending(user) {
    const pending = this.readPending(user);
    if (!pending) return null;
    try {
      return await this.finishUpload(user, pending);
    } catch (error) {
      if (
        ["conflict", "upgradeRequired", "invalid", "accountChanged", "missing"].includes(
          error.message,
        )
      )
        this.keepPending(user, null);
      if (error.message === "conflict") return null;
      throw error;
    }
  }
  async upload(user, saveJson, headRevision, { protectionId } = {}) {
    const base = this.base(user);
    if (base === null && headRevision !== 0) throw Error("firstLoad");
    if ((base ?? 0) !== headRevision) throw Error("conflict");
    let pending = this.readPending(user);
    if (pending && (pending.baseRevision !== (base ?? 0) || pending.saveJson !== saveJson)) {
      await this.resumePending(user);
      if (this.base(user) !== base) throw Error("conflict");
      pending = null;
    }
    pending ||= {
      baseRevision: base ?? 0,
      requestId: crypto.randomUUID(),
      saveJson,
      ...(protectionId ? { protectionId } : {}),
    };
    this.keepPending(user, pending);
    try {
      return await this.finishUpload(user, pending);
    } catch (error) {
      if (
        ["conflict", "upgradeRequired", "invalid", "accountChanged", "size"].includes(error.message)
      )
        this.keepPending(user, null);
      throw error;
    }
  }
}

