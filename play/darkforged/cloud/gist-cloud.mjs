import { GistClient, CONFIG_KEY, GistError } from './gist-client.mjs';
import { progressFingerprint } from './auto-cloud-save.mjs';

const messages = {
  'zh-CN': {
    title: 'GitHub 云存档', token: 'GitHub Token', gist: 'Gist ID（可选，留空自动查找或创建）',
    help: '在 GitHub 设置 → Developer settings → Personal access tokens 创建 token：classic 勾选 gist，或 fine-grained 开启 Gists 读写。无需仓库权限。Token 保存在此浏览器，直到删除或替换。',
    save: '保存 / 替换 Token', forget: '删除 Token', auto: '自动备份（进度变化时上传，最多每 10 秒一次）',
    upload: '立即备份', download: '读取云存档', restore: '恢复云存档并覆盖本地', backup: '下载本地备份',
    confirm: '将退出当前角色并用云存档覆盖本地角色，是否继续？', local: '本地角色', cloud: '云端角色',
    empty: '暂无角色', ready: '已保存 Token', tokenMissing: '请输入并保存自己的 GitHub Token。',
    busy: '处理中…', uploaded: '云端备份成功', restored: '云存档已恢复，请选择角色继续游戏。',
    unchanged: '进度未变化，无需上传', noLocal: '暂无本地角色可备份', loaded: '已读取云存档，请核对角色后恢复。',
    deleted: '已删除此浏览器保存的 Token', last: '上次备份', retry: '下次可重试',
    errors: { token: '请先保存 Token', invalid: 'Token、Gist ID 或存档格式不正确', storage: '浏览器无法保存设置',
      permission: 'Token 无效、已过期或缺少 Gists 读写权限；请更新后重新保存', network: '网络请求失败，稍后重试',
      rate: '请求过于频繁，已暂停 GitHub 请求', missing: 'Gist 不存在或此 Token 无权访问，请检查 Gist ID',
      noSave: '尚无此游戏的云存档，请先备份', changed: '设置已更改，请重试',
      unsupported: '请使用支持 Web Locks 的现代浏览器，并通过 HTTPS 或 localhost 打开游戏',
      chooseGist: 'Gist 较多，自动查找已停止，请填写已有云存档的 Gist ID' },
  },
  en: {
    title: 'GitHub cloud saves', token: 'GitHub Token', gist: 'Gist ID (optional; discover or create automatically)',
    help: 'Create a token in GitHub Settings → Developer settings → Personal access tokens: select gist for classic tokens, or Gists read/write for fine-grained tokens. No repository permission needed. This browser keeps the token until you delete or replace it.',
    save: 'Save / replace token', forget: 'Delete token', auto: 'Auto backup (changed progress only, at most once every 10 seconds)',
    upload: 'Back up now', download: 'Read cloud save', restore: 'Restore cloud save and replace local characters', backup: 'Download local backup',
    confirm: 'Log out and replace your local characters with this cloud save?', local: 'Local characters', cloud: 'Cloud characters',
    empty: 'No characters', ready: 'Token saved', tokenMissing: 'Enter and save your own GitHub token.', busy: 'Working…',
    uploaded: 'Cloud backup complete', restored: 'Cloud save restored. Select a character to continue.',
    unchanged: 'Progress unchanged; no upload needed', noLocal: 'No local characters to back up', loaded: 'Cloud save loaded. Check the characters before restoring.',
    deleted: 'Token deleted from this browser', last: 'Last backup', retry: 'Retry after',
    errors: { token: 'Save a token first', invalid: 'Invalid token, Gist ID or save format', storage: 'Browser could not save settings',
      permission: 'Token invalid, expired or missing Gists read/write permission; update and save it again', network: 'Network request failed; retry later',
      rate: 'GitHub requests paused to respect rate limits', missing: 'Gist missing or inaccessible; check the Gist ID',
      noSave: 'No cloud save for this game yet; back it up first', changed: 'Settings changed; retry',
      unsupported: 'Use a modern browser with Web Locks on HTTPS or localhost', chooseGist: 'Too many Gists to discover automatically; enter the cloud Gist ID' },
  },
  es: {
    title: 'Partidas en GitHub', token: 'Token de GitHub', gist: 'Gist ID (opcional; buscar o crear automáticamente)',
    help: 'Crea un token en GitHub Settings → Developer settings → Personal access tokens: gist para classic, o Gists con lectura/escritura para fine-grained. No requiere permisos de repositorio. El navegador guarda el token hasta que lo borres o reemplaces.',
    save: 'Guardar / reemplazar token', forget: 'Borrar token', auto: 'Copia automática (solo cambios, como máximo cada 10 segundos)',
    upload: 'Crear copia ahora', download: 'Leer partida en la nube', restore: 'Restaurar y reemplazar personajes locales', backup: 'Descargar copia local',
    confirm: '¿Salir y reemplazar los personajes locales con esta partida?', local: 'Personajes locales', cloud: 'Personajes en la nube',
    empty: 'Sin personajes', ready: 'Token guardado', tokenMissing: 'Introduce y guarda tu token de GitHub.', busy: 'Procesando…',
    uploaded: 'Copia completada', restored: 'Partida restaurada. Selecciona un personaje.', unchanged: 'Sin cambios; no es necesario subir',
    noLocal: 'No hay personajes locales', loaded: 'Partida leída. Revisa los personajes antes de restaurar.', deleted: 'Token borrado del navegador', last: 'Última copia', retry: 'Reintentar después de',
    errors: { token: 'Guarda un token primero', invalid: 'Token, Gist ID o partida no válidos', storage: 'No se pudo guardar la configuración',
      permission: 'Token no válido, caducado o sin permisos Gists; actualízalo y guárdalo', network: 'Error de red; reintenta más tarde', rate: 'Solicitudes pausadas por el límite de GitHub',
      missing: 'Gist inexistente o inaccesible; comprueba su ID', noSave: 'No hay partida de este juego en la nube', changed: 'Configuración cambiada; reintenta',
      unsupported: 'Usa un navegador moderno con Web Locks en HTTPS o localhost', chooseGist: 'Demasiados Gists; introduce el ID de la partida' },
  },
};
export const gistCloudMessages = locale => messages[locale] || messages.en;

// One controller lives with the game; opening/closing a window does not start timers.
export function createGistCloud({ game, prepare, preview, restore, client = new GistClient() }) {
  const listeners = new Set(), recordKey = 'backmir-gist-backup-v1:' + game;
  let busy = false, status = { code: client.config().token ? 'ready' : 'tokenMissing' }, remote = null, retryAt = 0, suspendedRevision = null;
  const emit = (code, until = 0) => { status = { code, until }; for (const fn of listeners) fn(); };
  const record = () => { try { return JSON.parse(client.storage.getItem(recordKey)) || {}; } catch { return {}; } };
  const valid = config => client.assertAccount(config);
  async function run(action) {
    if (busy) return;
    busy = true; emit('busy');
    try { await action(); }
    catch (error) {
      const code = error.code || 'invalid';
      retryAt = error.until || 0;
      if (code === 'permission') suspendedRevision = client.config().revision;
      emit(code, retryAt);
    } finally { busy = false; for (const fn of listeners) fn(); }
  }
  async function upload(automatic = false) {
    const config = client.config();
    if (automatic && (!config.token || config.auto === false || Date.now() < retryAt || suspendedRevision === config.revision)) return;
    await run(async () => {
      if (!config.token) throw new GistError('token');
      const saveJson = await prepare(); valid(config);
      const save = JSON.parse(saveJson);
      if (!save.snapshot?.roles?.length) { emit('noLocal'); return; }
      const fingerprint = progressFingerprint(save);
      const last = record();
      if (last.revision === config.revision && last.gistId === config.gistId && last.fingerprint === fingerprint) {
        emit('unchanged'); return;
      }
      await client.upload(game, saveJson, { automatic }); valid(config);
      client.storage.setItem(recordKey, JSON.stringify({ revision: config.revision,
        gistId: client.config().gistId, fingerprint, at: Date.now() }));
      retryAt = 0; emit('uploaded');
    });
  }
  async function download() {
    await run(async () => {
      const config = client.config();
      const value = await client.download(game);
      const summary = await preview(value.saveJson); valid(config);
      remote = { ...value, summary, revision: config.revision }; emit('loaded');
    });
  }
  async function restoreRemote() {
    await run(async () => {
      const config = client.config();
      if (!remote || remote.revision !== config.revision) throw new GistError('changed');
      await restore(remote.saveJson); valid(config);
      // A restore should not immediately rewrite the exact downloaded progress.
      client.storage.setItem(recordKey, JSON.stringify({ revision: config.revision, gistId: config.gistId,
        fingerprint: progressFingerprint(JSON.parse(remote.saveJson)), at: record().at || 0 }));
      emit('restored');
    });
  }
  function reset() { remote = null; retryAt = 0; suspendedRevision = null; emit(client.config().token ? 'ready' : 'tokenMissing'); }
  const storageChanged = event => { if (event.key === CONFIG_KEY || event.key === null) reset(); };
  globalThis.addEventListener('storage', storageChanged);
  const timer = setInterval(() => {
    if (document.visibilityState === 'visible' && navigator.onLine !== false) void upload(true);
  }, 10_000);
  const pagehide = event => { if (!event.persisted) dispose(); };
  globalThis.addEventListener('pagehide', pagehide);
  function dispose() {
    clearInterval(timer); listeners.clear();
    globalThis.removeEventListener('storage', storageChanged);
    globalThis.removeEventListener('pagehide', pagehide);
  }
  function mount(host, { locale, jobs }) {
    const m = gistCloudMessages(locale);
    const root = document.createElement('section'); root.className = 'gist-cloud-panel';
    const node = (tag, text, parent = root) => { const el = document.createElement(tag); if (text) el.textContent = text; parent.append(el); return el; };
    node('p', m.help);
    const token = node('input', '', node('label', m.token)); token.type = 'password'; token.autocomplete = 'off'; token.spellcheck = false; token.dataset.gistToken = '';
    const gist = node('input', '', node('label', m.gist)); gist.autocomplete = 'off'; gist.spellcheck = false; gist.dataset.gistId = '';
    const config = client.config(); token.value = config.token || ''; gist.value = config.gistId || '';
    const actions = node('div'); actions.className = 'gist-cloud-actions';
    const button = (key, action, parent = actions) => { const el = node('button', m[key], parent); el.type = 'button'; el.dataset.gistAction = key; el.onclick = action; return el; };
    const settingsAction = action => { try { action(); reset(); } catch (error) { emit(error.code || 'storage'); } };
    button('save', () => settingsAction(() => {
      const old = client.config();
      client.configure(token.value, token.value.trim() !== old.token && gist.value === old.gistId ? '' : gist.value, auto.checked);
    }));
    button('forget', () => { settingsAction(() => { client.forget(); token.value = ''; gist.value = ''; }); emit('deleted'); });
    const autoLabel = node('label'); autoLabel.className = 'gist-cloud-auto';
    const auto = node('input', '', autoLabel); auto.type = 'checkbox'; auto.checked = config.auto !== false;
    node('span', m.auto, autoLabel); auto.onchange = () => settingsAction(() => client.setAuto(auto.checked));
    const statusEl = node('p'); statusEl.setAttribute('role', 'status'); statusEl.dataset.gistStatus = '';
    const lastEl = node('p');
    node('h3', m.local); const localEl = node('p'); localEl.dataset.gistLocal = '';
    node('h3', m.cloud); const cloudEl = node('p'); cloudEl.dataset.gistCloud = '';
    const transfer = node('div'); transfer.className = 'gist-cloud-actions';
    const up = button('upload', () => void upload(), transfer);
    const down = button('download', () => void download(), transfer);
    const restoreButton = button('restore', () => { if (globalThis.confirm(m.confirm)) void restoreRemote(); }, transfer);
    button('backup', () => void run(async () => {
      const blob = new Blob([await prepare()], { type: 'application/json' }), url = URL.createObjectURL(blob);
      const a = node('a'); a.href = url; a.download = `backmir-${game}-backup.json`; a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000); emit('ready');
    }), transfer);
    const summary = value => value?.roles?.length ? value.roles.map(r => `${r.name} · ${jobs?.[r.job]?.name || r.job} · Lv.${r.level}`).join('\n') : m.empty;
    let active = true, renderedRevision = config.revision, renderedId = config.gistId;
    function refresh() {
      if (!active) return;
      const current = client.config();
      statusEl.textContent = (m[status.code] || m.errors[status.code] || m.errors.network) +
        (status.until ? ` · ${m.retry}: ${new Date(status.until).toLocaleString(locale)}` : '');
      const last = record(); lastEl.textContent = last.at && last.revision === current.revision ? `${m.last}: ${new Date(last.at).toLocaleString(locale)}` : '';
      cloudEl.textContent = summary(remote?.summary);
      if (current.revision !== renderedRevision) {
        token.value = current.token || ''; gist.value = current.gistId || '';
      } else if (current.gistId !== renderedId) gist.value = current.gistId || '';
      renderedRevision = current.revision; renderedId = current.gistId;
      auto.checked = current.auto !== false;
      root.querySelectorAll('button').forEach(el => { el.disabled = busy; });
      up.disabled = down.disabled = busy || !current.token;
      restoreButton.disabled = busy || !remote || remote.revision !== current.revision;
    }
    const refreshLocal = async () => { try { const value = await preview(await prepare()); if (active) localEl.textContent = summary(value); } catch { if (active) localEl.textContent = m.errors.invalid; } };
    listeners.add(refresh); host.replaceChildren(root); refresh(); void refreshLocal();
    return { refresh, dispose: () => { active = false; listeners.delete(refresh); } };
  }
  return { mount, upload, download, restoreRemote, dispose };
}
