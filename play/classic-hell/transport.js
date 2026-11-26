// singleplayer/transport.ts
import { i18n } from "./i18n.js";

import { watchForeground } from "/Game/site-assets/game-preferences.mjs";

// singleplayer/transport.ts
var worker = new Worker(new URL("./worker.js", import.meta.url), {
  type: "module",
});
function displayError(detail) {
  if (
    typeof detail === "string" &&
    /^(Failed to fetch|Load failed|NetworkError when attempting to fetch resource\.?)$/i.test(
      detail,
    )
  )
    detail = { $text: "transport.resourcesUnavailable" };
  const error = new Error();
  Object.defineProperty(error, "code", {
    value: typeof detail === "string" ? detail : detail?.$text,
  });
  Object.defineProperty(error, "message", { get: () => i18n.text(detail), configurable: true });
  return error;
}
var id = 0;
var pending = /* @__PURE__ */ new Map();
var stoppedError;
function stopWorker(error) {
  stoppedError = error;
  for (const p of pending.values()) {
    clearTimeout(p.timer);
    p.reject(error);
  }
  pending.clear();
  worker.terminate();
  globalThis.backmirStartup?.fail(error);
}
worker.onmessage = async (e) => {
  if (e.data.notification) {
    await i18n.ready;
    document.dispatchEvent(new CustomEvent("save-error", { detail: i18n.text(e.data.error) }));
    return;
  }
  const p = pending.get(e.data.id);
  if (!p) return;
  pending.delete(e.data.id);
  clearTimeout(p.timer);
  if (e.data.error !== void 0)
    p.reject(displayError(e.data.error || { $text: "transport.failed" }));
  else if (e.data.result === void 0)
    p.reject(displayError({ $text: "transport.incomplete", params: { route: p.route } }));
  else p.resolve(e.data.result);
};
worker.onerror = (e) => {
  stopWorker(displayError(e.message || { $text: "transport.resourcesUnavailable" }));
};
worker.onmessageerror = () => stopWorker(displayError({ $text: "transport.resourcesUnavailable" }));
function request(route, data, after = -1) {
  return new Promise((resolve, reject) => {
    if (stoppedError) {
      reject(stoppedError);
      return;
    }
    const seq = ++id;
    const timer =
      route === "init"
        ? setTimeout(
            () => stopWorker(displayError({ $text: "transport.resourcesUnavailable" })),
            2e4,
          )
        : void 0;
    pending.set(seq, { route, resolve, reject, timer });
    try {
      worker.postMessage({ id: seq, route, data, after });
    } catch (error) {
      clearTimeout(timer);
      pending.delete(seq);
      reject(error);
    }
  });
}
var unlock;
var lock = new Promise((resolve, reject) => {
  if (!navigator.locks) {
    reject(displayError({ $text: "transport.lockUnsupported" }));
    return;
  }
  navigator.locks
    .request("backmir-classic-hell-writer", { ifAvailable: true }, async (acquired) => {
      if (!acquired) {
        reject(displayError({ $text: "transport.alreadyOpen" }));
        return;
      }
      resolve();
      await new Promise((r) => (unlock = r));
    })
    .catch(reject);
});
var ready = lock.then(() => request("init"));
ready.catch(() => {});
async function localAPI(route, data, after = -1) {
  await ready;
  return request(route, data, after);
}
watchForeground(document, window, (active) => {
  document.documentElement.dataset.gameForeground = String(active);
  localAPI("foreground", { active }).catch((e) =>
    document.dispatchEvent(new CustomEvent("save-error", { detail: e.message })),
  );
  document.dispatchEvent(new CustomEvent("game-foreground", { detail: active }));
});
if ("serviceWorker" in navigator)
  i18n.ready
    .then(() =>
      navigator.serviceWorker.register("./sw.js?lang=" + encodeURIComponent(i18n.locale), {
        updateViaCache: "none",
      }),
    )
    .catch(console.error);
export { localAPI };

