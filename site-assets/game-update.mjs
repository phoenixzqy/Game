// A static, cache-bypassed release record works on both Pages and local hosting.
const games = ["classic-hell", "darkforged", "classic"];
const game =
  games.find(
    (name) =>
      name !== "classic" && location.pathname.includes("/Game/play/" + name + "/"),
  ) || "classic";
const siteRoot = new URL("../", import.meta.url);
const root =
  game === "classic" ? siteRoot : new URL("play/" + game + "/", siteRoot);
const currentCache = document.querySelector(
  'meta[name="backmir-cache"]',
)?.content;
const currentBuild = document.querySelector(
  'meta[name="dream-build"]',
)?.content;
const currentVersion =
  document.querySelector('meta[name="dream-version"]')?.content || "—";
let locale = document.documentElement.lang || "zh-CN",
  registration,
  checking,
  started = false,
  dismissed,
  publishedCache;
let state = { status: "checking", latest: null, cache: null };
const subscribers = new Set();
const labels = () =>
  /^zh/i.test(locale)
    ? {
        current: "当前版本",
        latest: "最新版本",
        checking: "正在检查…",
        ready: "发现新版本，可保存进度后更新。",
        same: "已是最新版",
        unavailable: "暂时无法检查，请联网后重试",
        update: "保存并更新",
        later: "稍后",
        failed: "更新未完成，进度已保留。请联网后重试。",
        unsupported: "此浏览器不支持离线更新",
        timeout: "更新下载超时，请重试",
      }
    : /^es/i.test(locale)
      ? {
          current: "Versión actual",
          latest: "Última versión",
          checking: "Comprobando…",
          ready: "Hay una actualización. Guarda el progreso para aplicarla.",
          same: "Ya está actualizado",
          unavailable: "No se pudo comprobar. Reintenta con conexión.",
          update: "Guardar y actualizar",
          later: "Más tarde",
          failed:
            "Actualización incompleta. El progreso se conserva. Reintenta con conexión.",
          unsupported: "Este navegador no admite actualizaciones sin conexión",
          timeout: "La descarga tardó demasiado. Reintenta.",
        }
      : {
          current: "Current version",
          latest: "Latest version",
          checking: "Checking…",
          ready: "A new version is available. Save your progress to update.",
          same: "Up to date",
          unavailable: "Unable to check. Retry when online.",
          update: "Save and update",
          later: "Later",
          failed:
            "Update incomplete. Your progress is retained. Connect and retry.",
          unsupported: "This browser cannot update offline files",
          timeout: "Update download timed out. Please retry.",
        };
function publish(next) {
  state = { ...state, ...next };
  for (const subscriber of subscribers) subscriber();
  if (state.status === "available" && state.cache !== dismissed) showNotice();
}
function showNotice() {
  if (document.getElementById("game-update-notice")) return;
  const box = document.createElement("aside"),
    message = document.createElement("p"),
    update = document.createElement("button"),
    later = document.createElement("button");
  const copy = labels();
  box.id = "game-update-notice";
  box.setAttribute("role", "status");
  box.style.cssText =
    "position:fixed;bottom:max(18px,env(safe-area-inset-bottom));right:12px;left:auto;z-index:99999;box-sizing:border-box;width:min(380px,calc(100% - 24px));padding:16px;background:#29291ff5;color:#fff;border:1px solid #bda46d;font:15px/1.5 system-ui";
  message.textContent = copy.ready;
  update.textContent = copy.update;
  update.dataset.applyGameUpdate = "";
  later.textContent = copy.later;
  for (const button of [update, later])
    button.style.cssText = "min-height:44px;padding:8px 12px;margin-right:8px";
  update.onclick = () =>
    document.dispatchEvent(
      new CustomEvent("backmir-update-request", { cancelable: true }),
    );
  later.onclick = () => {
    dismissed = state.cache;
    box.remove();
  };
  box.append(message, update, later);
  document.body.append(box);
}
function workerCache(worker) {
  if (!worker) return Promise.resolve(null);
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    const done = (value) => {
      clearTimeout(timer);
      channel.port1.close();
      channel.port2.close();
      resolve(value);
    };
    const timer = setTimeout(() => done(null), 1500);
    channel.port1.onmessage = (event) => done(event.data?.cache || null);
    worker.postMessage({ type: "GET_CACHE_VERSION" }, [channel.port2]);
  });
}
async function offer(worker) {
  const cache = await workerCache(worker);
  if (publishedCache && cache !== publishedCache) return;
  if (cache && currentCache && cache !== currentCache)
    publish({ status: "available", cache });
}
async function register() {
  if (!navigator.serviceWorker) return null;
  const sw = new URL("sw.js", root);
  sw.searchParams.set("lang", locale);
  const reg = await navigator.serviceWorker.register(sw, {
    scope: root.href,
    updateViaCache: "none",
  });
  if (registration !== reg) {
    registration = reg;
    reg.addEventListener("updatefound", () => {
      const worker = reg.installing;
      worker?.addEventListener("statechange", () => {
        if (["installed", "activated"].includes(worker.state))
          void offer(worker);
      });
    });
  }
  void offer(reg.waiting || reg.active);
  return reg;
}
export function checkGameUpdate() {
  if (checking) return checking;
  checking = (async () => {
    const controller = new AbortController(),
      timer = setTimeout(() => controller.abort(), 8000);
    try {
      const url = new URL("/Game/api/game-version.json", location.origin);
      url.searchParams.set("t", String(Date.now()));
      const response = await fetch(url, {
        cache: "no-store",
        credentials: "omit",
        signal: controller.signal,
      });
      if (!response.ok) throw Error("Release HTTP " + response.status);
      const info = (await response.json()).games?.[game];
      if (
        !info ||
        typeof info.version !== "string" ||
        !/^[a-f0-9]{16}$/.test(info.build) ||
        !info.cache?.startsWith("backmir-" + game + "-")
      )
        throw Error("Invalid release record");
      publishedCache = info.cache;
      publish({
        latest: info.version,
        cache: info.cache,
        status:
          info.cache === currentCache && info.build === currentBuild
            ? "current"
            : "available",
      });
    } catch {
      if (state.status !== "available") publish({ status: "unavailable" });
    } finally {
      clearTimeout(timer);
    }
    try {
      const reg = await register();
      await reg?.update();
    } catch {
      /* Offline play keeps its installed worker. */
    }
  })().finally(() => {
    checking = null;
  });
  return checking;
}
export function installGameUpdates(language, actions) {
  locale = language || locale;
  if (started) return;
  started = true;
  let applying = false;
  document.addEventListener("backmir-update-request", async (event) => {
    event.preventDefault();
    if (applying) return;
    applying = true;
    const button = document.querySelector("[data-apply-game-update]");
    if (button) button.disabled = true;
    let saved = false;
    try {
      await actions.save();
      saved = true;
      await applyGameUpdate(locale);
    } catch (error) {
      actions.error(error, saved);
    } finally {
      applying = false;
      if (button) button.disabled = false;
    }
  });
  const pin = () => {
    if (currentCache)
      navigator.serviceWorker?.controller?.postMessage({
        type: "PIN_GAME_CACHE",
        cache: currentCache,
      });
  };
  pin();
  navigator.serviceWorker?.addEventListener("controllerchange", () => {
    pin();
    void offer(navigator.serviceWorker.controller);
  });
  navigator.serviceWorker?.addEventListener("message", (event) => {
    if (event.data?.type === "GAME_UPDATE_READY")
      void offer(navigator.serviceWorker.controller);
  });
  window.addEventListener("online", checkGameUpdate);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) void checkGameUpdate();
  });
  window.addEventListener("focus", () => {
    if (!document.hidden) void checkGameUpdate();
  });
  setInterval(
    () => {
      if (!document.hidden) void checkGameUpdate();
    },
    5 * 60 * 1000,
  );
  void checkGameUpdate();
}
export function mountUpdateStatus(rootElement, language) {
  locale = language || locale;
  const box = rootElement.querySelector("#game-version"),
    button = rootElement.querySelector("#force-update");
  if (!box || !button) return;
  const current = document.createElement("div"),
    latest = document.createElement("strong"),
    status = document.createElement("div");
  box.replaceChildren(current, latest, status);
  box.style.cssText = "line-height:1.6;white-space:normal";
  status.setAttribute("role", "status");
  const render = () => {
    const copy = labels();
    current.textContent =
      copy.current + "：" + currentVersion + " · " + (currentBuild || "—");
    latest.textContent =
      copy.latest +
      "：" +
      (state.latest || (state.status === "checking" ? copy.checking : "—"));
    status.textContent =
      copy[
        {
          available: "ready",
          current: "same",
          checking: "checking",
          unavailable: "unavailable",
        }[state.status]
      ];
    button.textContent = copy.update;
    button.dataset.updateAvailable = String(state.status === "available");
  };
  subscribers.add(render);
  const observer = new MutationObserver(() => {
    if (!box.isConnected) {
      subscribers.delete(render);
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  render();
  void checkGameUpdate();
}
function installed(worker) {
  if (!worker) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const done = (error) => {
      clearTimeout(timer);
      worker.removeEventListener("statechange", changed);
      error ? reject(error) : resolve();
    };
    const changed = () => {
      if (["installed", "activated"].includes(worker.state)) done();
      if (worker.state === "redundant") done(Error(labels().failed));
    };
    const timer = setTimeout(() => done(Error(labels().timeout)), 60000);
    worker.addEventListener("statechange", changed);
    changed();
  });
}
export async function applyGameUpdate(language) {
  locale = language || locale;
  if (!navigator.serviceWorker) throw Error(labels().unsupported);
  await checkGameUpdate();
  const reg = await register();
  await reg.update();
  await installed(reg.installing);
  if (reg.waiting) {
    const worker = reg.waiting;
    worker.postMessage({ type: "ACTIVATE_UPDATE" });
    await new Promise((resolve, reject) => {
      const changed = () => {
        if (worker.state === "activated") done();
        else if (worker.state === "redundant") done(Error(labels().failed));
      };
      const done = (error) => {
        clearTimeout(timer);
        worker.removeEventListener("statechange", changed);
        error ? reject(error) : resolve();
      };
      const timer = setTimeout(() => done(Error(labels().timeout)), 20000);
      worker.addEventListener("statechange", changed);
      changed();
    });
  }
  await installed(reg.active);
  const cache = await workerCache(reg.active);
  // Do not claim completion when a published release failed to install.
  if (!cache || (state.cache && cache !== state.cache))
    throw Error(labels().failed);
  const url = new URL(game === "classic" ? "play/" : "./", root);
  for (const [key, value] of new URL(location.href).searchParams)
    url.searchParams.set(key, value);
  url.searchParams.set("lang", locale);
  location.replace(url);
}
