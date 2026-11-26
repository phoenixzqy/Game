// singleplayer/transport.ts
import { i18n } from "/Game/i18n.js";

// singleplayer/foreground.ts
function watchForeground(doc, win, changed) {
  let focused = doc.hasFocus(),
    shown = true,
    previous;
  const publish = () => {
    const active = shown && focused && !doc.hidden;
    if (active !== previous) {
      previous = active;
      changed(active);
    }
  };
  win.addEventListener("blur", () => {
    focused = false;
    publish();
  });
  win.addEventListener("focus", () => {
    focused = true;
    publish();
  });
  doc.addEventListener("visibilitychange", () => {
    focused = doc.hasFocus();
    publish();
  });
  win.addEventListener("pagehide", () => {
    shown = false;
    publish();
  });
  win.addEventListener("pageshow", () => {
    shown = true;
    focused = doc.hasFocus();
    publish();
  });
  publish();
}

// singleplayer/transport.ts
var worker = new Worker(new URL("/Game/worker.js", import.meta.url), {
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
worker.onmessage = async (e) => {
  if (e.data.notification) {
    await i18n.ready;
    document.dispatchEvent(new CustomEvent("save-error", { detail: i18n.text(e.data.error) }));
    return;
  }
  const p = pending.get(e.data.id);
  if (!p) return;
  pending.delete(e.data.id);
  if (e.data.error !== void 0)
    p.reject(displayError(e.data.error || { $text: "transport.failed" }));
  else if (e.data.result === void 0)
    p.reject(displayError({ $text: "transport.incomplete", params: { route: p.route } }));
  else p.resolve(e.data.result);
};
worker.onerror = (e) => {
  for (const p of pending.values()) p.reject(Error(e.message));
  pending.clear();
};
function request(route, data, after = -1) {
  return new Promise((resolve, reject) => {
    const seq = ++id;
    pending.set(seq, { route, resolve, reject });
    worker.postMessage({ id: seq, route, data, after });
  });
}
var unlock;
var lock = new Promise((resolve, reject) => {
  if (!navigator.locks) {
    reject(displayError({ $text: "transport.lockUnsupported" }));
    return;
  }
  navigator.locks
    .request("dream-mir-save-writer", { ifAvailable: true }, async (acquired) => {
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
const syncHomeForeground = (active) => {
  active = active && window.backmirEmbed?.active !== false;
  document.documentElement.dataset.gameForeground = String(active);
  localAPI("foreground", { active }).catch((e) =>
    document.dispatchEvent(new CustomEvent("save-error", { detail: e.message })),
  );
  document.dispatchEvent(new CustomEvent("game-foreground", { detail: active }));
};
watchForeground(document, window, syncHomeForeground);
document.addEventListener("home-embed-state", () =>
  syncHomeForeground(!document.hidden && document.hasFocus()),
);
if ("serviceWorker" in navigator)
  i18n.ready
    .then(() =>
      navigator.serviceWorker.register("./sw.js?lang=" + encodeURIComponent(i18n.locale), {
        updateViaCache: "none",
      }),
    )
    .catch(console.error);
export { localAPI };

