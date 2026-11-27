import { GistClient, CONFIG_KEY, GistError } from './gist-client.mjs';
export const GIST_AUTO_INTERVAL = 60_000;

const messages = {
  'zh-CN': {
    title: 'GitHub 云存档', token: 'GitHub Token', gist: 'Gist ID（可选，留空自动查找或创建）',
    help: '在 GitHub 设置 → Developer settings → Personal access tokens 创建 token：classic 勾选 gist，或 fine-grained 开启 Gists 读写。无需仓库权限。Token 保存在此浏览器，直到删除或替换。',
    save: '保存 / 替换 Token', forget: '删除 Token', auto: '自动备份（每 1 分钟检查，进度变化时上传）',
    countdown: '将在 {seconds} 秒后自动同步', autoOff: '自动同步已关闭', autoOffline: '离线，联网后自动同步',
    autoHidden: '后台等待中，返回游戏后自动同步', autoPaused: '自动同步已暂停，请检查上方错误提示', autoWaiting: '等待启动同步',
    sync: '立即同步', backup: '下载本地备份', local: '本地存档时间（UTC）', cloud: '云端存档时间（UTC）',
    policy: '每次启动自动同步，按 UTC 进度时间选择最新存档并覆盖较旧的一方。时间相同则不覆盖。',
    empty: '暂无角色', ready: '已保存 Token', tokenMissing: '请输入并保存自己的 GitHub Token。',
    busy: '处理中…', uploaded: '云端备份成功', restored: '云存档已恢复，请选择角色继续游戏。',
    unchanged: '存档已同步，无需覆盖', noLocal: '本地和云端均无存档',
    deleted: '已删除此浏览器保存的 Token', last: '上次备份', retry: '下次可重试',
    errors: { token: '请先保存 Token', invalid: 'Token、Gist ID 或存档格式不正确', storage: '浏览器无法保存设置',
      permission: 'Token 无效、已过期或缺少 Gists 读写权限；请更新后重新保存', network: '网络请求失败，稍后重试',
      rate: 'GitHub 已返回限流，等待限额恢复后重试', throttle: '已达到本地请求频率上限，等待后重试',
      quota: 'GitHub API 剩余额度不足，等待额度恢复', cooldown: '请求仍在等待期，请稍后重试',
      timeout: 'GitHub 请求超时，等待后重试', server: 'GitHub 服务暂时出错，等待后重试', http: 'GitHub 请求失败，请稍后重试',
      missing: 'Gist 不存在或此 Token 无权访问，请检查 Gist ID',
      noSave: '尚无此游戏的云存档，请先备份', changed: '设置已更改，请重试',
      unsupported: '请使用支持 Web Locks 的现代浏览器，并通过 HTTPS 或 localhost 打开游戏',
      chooseGist: 'Gist 较多，自动查找已停止，请填写已有云存档的 Gist ID' },
  },
  en: {
    title: 'GitHub cloud saves', token: 'GitHub Token', gist: 'Gist ID (optional; discover or create automatically)',
    help: 'Create a token in GitHub Settings → Developer settings → Personal access tokens: select gist for classic tokens, or Gists read/write for fine-grained tokens. No repository permission needed. This browser keeps the token until you delete or replace it.',
    save: 'Save / replace token', forget: 'Delete token', auto: 'Auto backup (check every minute; upload changed progress)',
    countdown: 'Automatic sync in {seconds} seconds', autoOff: 'Automatic sync is off', autoOffline: 'Offline; automatic sync resumes online',
    autoHidden: 'Waiting in background; automatic sync resumes when visible', autoPaused: 'Automatic sync paused; check the error above', autoWaiting: 'Waiting for startup sync',
    sync: 'Sync now', backup: 'Download local backup', local: 'Local save time (UTC)', cloud: 'Cloud save time (UTC)',
    policy: 'Every startup syncs automatically. The newest UTC progress timestamp replaces the older save. Equal timestamps leave both saves unchanged.',
    empty: 'No characters', ready: 'Token saved', tokenMissing: 'Enter and save your own GitHub token.', busy: 'Working…',
    uploaded: 'Cloud backup complete', restored: 'Cloud save restored. Select a character to continue.',
    unchanged: 'Saves synchronized; no replacement needed', noLocal: 'No local or cloud save',
    deleted: 'Token deleted from this browser', last: 'Last backup', retry: 'Retry after',
    errors: { token: 'Save a token first', invalid: 'Invalid token, Gist ID or save format', storage: 'Browser could not save settings',
      permission: 'Token invalid, expired or missing Gists read/write permission; update and save it again', network: 'Network request failed; retry later',
      rate: 'GitHub returned a rate limit; waiting before retry', throttle: 'Local request frequency limit reached; waiting before retry',
      quota: 'GitHub API quota is low; waiting for it to reset', cooldown: 'Requests are still in a waiting period; retry later',
      timeout: 'GitHub request timed out; waiting before retry', server: 'GitHub service error; waiting before retry', http: 'GitHub request failed; retry later',
      missing: 'Gist missing or inaccessible; check the Gist ID',
      noSave: 'No cloud save for this game yet; back it up first', changed: 'Settings changed; retry',
      unsupported: 'Use a modern browser with Web Locks on HTTPS or localhost', chooseGist: 'Too many Gists to discover automatically; enter the cloud Gist ID' },
  },
  es: {
    title: 'Partidas en GitHub', token: 'Token de GitHub', gist: 'Gist ID (opcional; buscar o crear automáticamente)',
    help: 'Crea un token en GitHub Settings → Developer settings → Personal access tokens: gist para classic, o Gists con lectura/escritura para fine-grained. No requiere permisos de repositorio. El navegador guarda el token hasta que lo borres o reemplaces.',
    save: 'Guardar / reemplazar token', forget: 'Borrar token', auto: 'Copia automática (comprobar cada minuto; subir solo cambios)',
    countdown: 'Sincronización automática en {seconds} segundos', autoOff: 'Sincronización automática desactivada', autoOffline: 'Sin conexión; se sincronizará al reconectar',
    autoHidden: 'En segundo plano; se sincronizará al volver', autoPaused: 'Sincronización pausada; revisa el error anterior', autoWaiting: 'Esperando la sincronización inicial',
    sync: 'Sincronizar ahora', backup: 'Descargar copia local', local: 'Fecha local (UTC)', cloud: 'Fecha en la nube (UTC)',
    policy: 'Cada inicio sincroniza automáticamente. La fecha UTC de progreso más reciente reemplaza la partida anterior. Fechas iguales no cambian las partidas.',
    empty: 'Sin personajes', ready: 'Token guardado', tokenMissing: 'Introduce y guarda tu token de GitHub.', busy: 'Procesando…',
    uploaded: 'Copia completada', restored: 'Partida restaurada. Selecciona un personaje.', unchanged: 'Partidas sincronizadas; sin cambios',
    noLocal: 'Sin partida local ni en la nube', deleted: 'Token borrado del navegador', last: 'Última copia', retry: 'Reintentar después de',
    errors: { token: 'Guarda un token primero', invalid: 'Token, Gist ID o partida no válidos', storage: 'No se pudo guardar la configuración',
      permission: 'Token no válido, caducado o sin permisos Gists; actualízalo y guárdalo', network: 'Error de red; reintenta más tarde',
      rate: 'GitHub ha limitado las solicitudes; esperando para reintentar', throttle: 'Límite local de frecuencia alcanzado; esperando para reintentar',
      quota: 'Cuota de GitHub API baja; esperando su renovación', cooldown: 'Solicitudes en espera; reintenta más tarde',
      timeout: 'Tiempo de espera de GitHub agotado; esperando para reintentar', server: 'Error del servicio de GitHub; esperando para reintentar', http: 'Solicitud a GitHub fallida; reintenta más tarde',
      missing: 'Gist inexistente o inaccesible; comprueba su ID', noSave: 'No hay partida de este juego en la nube', changed: 'Configuración cambiada; reintenta',
      unsupported: 'Usa un navegador moderno con Web Locks en HTTPS o localhost', chooseGist: 'Demasiados Gists; introduce el ID de la partida' },
  },
};
export const gistCloudMessages = locale => messages[locale] || messages.en;

// Compare native progress time, never export/checkpoint time or Gist updated_at.
export function gistSaveTime(saveJson) {
  const save = JSON.parse(saveJson), snapshot = save.snapshot;
  if (!snapshot || !Array.isArray(snapshot.roles)) throw new GistError('invalid');
  const value = snapshot.sync?.lastProgressAt ?? snapshot.lastSaved;
  const populated = snapshot.roles.length || snapshot.sharedStorage?.some(Boolean) ||
    Object.keys(snapshot.sync?.tombstones || {}).length;
  if (value == null && !populated) return null;
  if (typeof value !== 'string' || !/(Z|[+-]\d{2}:\d{2})$/i.test(value) || !Number.isFinite(Date.parse(value)))
    throw new GistError('invalid');
  return Date.parse(value);
}

// One controller lives with the game; opening/closing a window does not start timers.
export function createGistCloud({ game, prepare, preview, restore, onSyncState = () => {}, client = new GistClient() }) {
  const listeners = new Set(), recordKey = 'backmir-gist-backup-v1:' + game;
  const scope = config => config.revision + ':' + config.gistId;
  let busy = false, syncing = false, started = false, disposed = false, task = null;
  let status = { code: client.config().token ? 'ready' : 'tokenMissing' };
  let autoAttemptAt = -Infinity;
  let retryAt = 0, suspendedRevision = null, syncedScope = null, localTime = null, cloudTime = null;
  const emit = (code, until = 0, httpStatus = 0) => { status = { code, until, httpStatus }; for (const fn of listeners) fn(); };
  const record = () => { try { return JSON.parse(client.storage.getItem(recordKey)) || {}; } catch { return {}; } };
  const valid = config => { if (disposed) throw new GistError('changed'); client.assertAccount(config); };
  function remember(config, time, uploaded = false) {
    valid(config);
    const current = client.config();
    syncedScope = scope(current); cloudTime = time;
    client.storage.setItem(recordKey, JSON.stringify({ revision: current.revision, gistId: current.gistId,
      time, at: uploaded ? Date.now() : record().at || 0 }));
  }
  function run(action, reconcile = false) {
    if (task) return task;
    autoAttemptAt = Date.now();
    busy = true; syncing = reconcile; emit('busy');
    if (reconcile) onSyncState(true, status);
    task = (async () => {
      try { await action(); return true; }
      catch (error) {
        const code = error.code || 'invalid';
        retryAt = error.until || Date.now() + 60_000;
        if (['permission', 'invalid', 'missing', 'storage', 'unsupported', 'chooseGist'].includes(code))
          suspendedRevision = client.config().revision;
        emit(code, error.until || 0, error.status || 0);
        return false;
      } finally {
        autoAttemptAt = Date.now();
        busy = false; syncing = false; task = null;
        if (reconcile) onSyncState(false, status);
        for (const fn of listeners) fn();
      }
    })();
    return task;
  }
  async function write(config, saveJson, time, automatic) {
    await client.upload(game, saveJson, { automatic }); valid(config);
    remember(config, time, true); retryAt = 0; emit('uploaded');
  }
  function sync() {
    started = true;
    if (!client.config().token) { emit('tokenMissing'); return Promise.resolve(false); }
    if (navigator.onLine === false) { emit('network'); return Promise.resolve(false); }
    return run(async () => {
      syncedScope = null;
      const config = client.config();
      let remote = null;
      try { remote = await client.download(game); }
      catch (error) { if (error.code !== 'noSave') throw error; }
      valid(config);
      if (remote) { await preview(remote.saveJson); valid(config); }
      cloudTime = remote ? gistSaveTime(remote.saveJson) : null;
      // Read local progress after the network wait, including progress made offline.
      const saveJson = await prepare(); valid(config);
      localTime = gistSaveTime(saveJson);
      if (cloudTime !== null && (localTime === null || cloudTime > localTime)) {
        await restore(remote.saveJson); valid(config);
        localTime = cloudTime;
        remember(config, cloudTime); emit('restored');
      } else if (localTime !== null && (cloudTime === null || localTime > cloudTime)) {
        await write(config, saveJson, localTime, false);
      } else {
        remember(config, localTime); emit(localTime === null ? 'noLocal' : 'unchanged');
      }
      retryAt = 0; suspendedRevision = null;
    }, true);
  }
  async function upload(automatic = false) {
    const config = client.config();
    if (automatic && (Date.now() - autoAttemptAt < GIST_AUTO_INTERVAL || !started || !config.token || config.auto === false || Date.now() < Math.max(retryAt, client.waiting?.until || 0) || suspendedRevision === config.revision)) return;
    // A failed startup read must never let a stale local save overwrite the cloud.
    if (syncedScope !== scope(config)) return sync();
    return run(async () => {
      if (!config.token) throw new GistError('token');
      const saveJson = await prepare(); valid(config);
      localTime = gistSaveTime(saveJson);
      if (localTime === null || (cloudTime !== null && localTime <= cloudTime)) { emit(localTime === null ? 'noLocal' : 'unchanged'); return; }
      await write(config, saveJson, localTime, automatic);
    });
  }
  function reset() {
    syncedScope = null; localTime = cloudTime = null; retryAt = 0; suspendedRevision = null;
    emit(client.config().token ? 'ready' : 'tokenMissing');
  }
  async function syncChangedSettings() {
    reset();
    if (task) await task;
    if (started && client.config().token && !disposed) await sync();
  }
  const storageChanged = event => {
    if ((event.key === CONFIG_KEY || event.key === null) && syncedScope !== scope(client.config()))
      void syncChangedSettings();
  };
  globalThis.addEventListener('storage', storageChanged);
  async function tick() {
    const config = client.config();
    if (!started || disposed || busy || !config.token || config.auto === false || document.visibilityState !== 'visible' ||
      navigator.onLine === false || Date.now() < Math.max(retryAt, client.waiting?.until || 0) || Date.now() - autoAttemptAt < GIST_AUTO_INTERVAL || suspendedRevision === config.revision) return;
    if (syncedScope !== scope(config)) await sync();
    else if (config.auto !== false) await upload(true);
  }
  function countdown() {
    const config = client.config();
    if (busy) return { code: 'busy' };
    if (!config.token) return { code: 'tokenMissing' };
    if (config.auto === false) return { code: 'autoOff' };
    if (suspendedRevision === config.revision) return { code: 'autoPaused' };
    if (navigator.onLine === false) return { code: 'autoOffline' };
    if (document.visibilityState !== 'visible') return { code: 'autoHidden' };
    if (!started) return { code: 'autoWaiting' };
    const waiting = client.waiting;
    return { code: 'countdown', seconds: Math.max(0, Math.ceil((Math.max(autoAttemptAt + GIST_AUTO_INTERVAL, retryAt, waiting?.until || 0) - Date.now()) / 1000)),
      ...(waiting ? { reason: waiting.code } : {}) };
  }
  // One game-owned timer drives both the deadline and any open countdown UI.
  const timer = setInterval(() => {
    void tick();
    for (const fn of listeners) fn();
  }, 1000);
  const online = () => void tick();
  globalThis.addEventListener('online', online);
  const pagehide = event => { if (!event.persisted) dispose(); };
  globalThis.addEventListener('pagehide', pagehide);
  function dispose() {
    disposed = true; clearInterval(timer); listeners.clear();
    globalThis.removeEventListener('storage', storageChanged);
    globalThis.removeEventListener('online', online);
    globalThis.removeEventListener('pagehide', pagehide);
  }
  function mount(host, { locale }) {
    const m = gistCloudMessages(locale);
    const root = document.createElement('section'); root.className = 'gist-cloud-panel';
    const node = (tag, text, parent = root) => { const el = document.createElement(tag); if (text) el.textContent = text; parent.append(el); return el; };
    node('p', m.help); node('p', m.policy);
    const token = node('input', '', node('label', m.token)); token.type = 'password'; token.autocomplete = 'off'; token.spellcheck = false; token.dataset.gistToken = '';
    const gist = node('input', '', node('label', m.gist)); gist.autocomplete = 'off'; gist.spellcheck = false; gist.dataset.gistId = '';
    const config = client.config(); token.value = config.token || ''; gist.value = config.gistId || '';
    const actions = node('div'); actions.className = 'gist-cloud-actions';
    const button = (key, action, parent = actions) => { const el = node('button', m[key], parent); el.type = 'button'; el.dataset.gistAction = key; el.onclick = action; return el; };
    const settingsAction = action => { try { action(); void syncChangedSettings(); } catch (error) { emit(error.code || 'storage'); } };
    button('save', () => settingsAction(() => {
      const old = client.config();
      client.configure(token.value, token.value.trim() !== old.token && gist.value === old.gistId ? '' : gist.value, auto.checked);
    }));
    button('forget', () => { client.forget(); token.value = ''; gist.value = ''; reset(); emit('deleted'); });
    const autoLabel = node('label'); autoLabel.className = 'gist-cloud-auto';
    const auto = node('input', '', autoLabel); auto.type = 'checkbox'; auto.checked = config.auto !== false;
    node('span', m.auto, autoLabel);
    auto.onchange = () => { try { client.setAuto(auto.checked); void tick(); } catch (error) { emit(error.code || 'storage'); } };
    const statusEl = node('p'); statusEl.setAttribute('role', 'status'); statusEl.dataset.gistStatus = '';
    const countdownEl = node('p'); countdownEl.dataset.gistCountdown = '';
    const lastEl = node('p');
    const localEl = node('p'); localEl.dataset.gistLocal = '';
    const cloudEl = node('p'); cloudEl.dataset.gistCloud = '';
    const transfer = node('div'); transfer.className = 'gist-cloud-actions';
    const syncButton = button('sync', () => void sync(), transfer);
    button('backup', () => void run(async () => {
      const blob = new Blob([await prepare()], { type: 'application/json' }), url = URL.createObjectURL(blob);
      const a = node('a'); a.href = url; a.download = `backmir-${game}-backup.json`; a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000); emit('ready');
    }), transfer);
    let active = true, renderedRevision = config.revision, renderedId = config.gistId;
    function refresh() {
      if (!active) return;
      const current = client.config();
      statusEl.textContent = (m[status.code] || m.errors[status.code] || m.errors.network) +
        (status.httpStatus ? ` (HTTP ${status.httpStatus})` : '') +
        (status.until ? ` · ${m.retry}: ${new Date(status.until).toLocaleString(locale)}` : '');
      const schedule = countdown();
      countdownEl.textContent = m[schedule.code].replace('{seconds}', schedule.seconds ?? '') +
        (schedule.reason ? ` · ${m.errors[schedule.reason] || m.errors.cooldown}` : '');
      const last = record(); lastEl.textContent = last.at && last.revision === current.revision ? `${m.last}: ${new Date(last.at).toLocaleString(locale)}` : '';
      localEl.textContent = `${m.local}: ${localTime === null ? m.empty : new Date(localTime).toISOString()}`;
      cloudEl.textContent = `${m.cloud}: ${cloudTime === null ? m.empty : new Date(cloudTime).toISOString()}`;
      if (current.revision !== renderedRevision) {
        token.value = current.token || ''; gist.value = current.gistId || '';
      } else if (current.gistId !== renderedId) gist.value = current.gistId || '';
      renderedRevision = current.revision; renderedId = current.gistId;
      auto.checked = current.auto !== false;
      root.querySelectorAll('button').forEach(el => { el.disabled = busy; });
      syncButton.disabled = busy || !current.token;
    }
    listeners.add(refresh); host.replaceChildren(root); refresh();
    return { refresh, dispose: () => { active = false; listeners.delete(refresh); } };
  }
  return { mount, sync, upload, tick, dispose, get countdown() { return countdown(); }, get syncing() { return syncing; }, get status() { return status; } };
}
