const key = "backmir.pause-on-focus-loss";
const changed = "backmir-pause-preference";
let fallback = true;

export function pauseOnFocusLoss() {
  try {
    const stored = localStorage.getItem(key);
    return stored === null ? fallback : stored !== "false";
  } catch {
    return fallback;
  }
}

export function setPauseOnFocusLoss(enabled) {
  localStorage.setItem(key, String(!!enabled));
  fallback = !!enabled;
  window.dispatchEvent(new Event(changed));
}

export function watchForeground(doc, win, changedState) {
  let focused = doc.hasFocus(),
    shown = true,
    previous;
  const publish = () => {
    const pause = pauseOnFocusLoss();
    doc.documentElement.dataset.pauseOnFocusLoss = String(pause);
    const active = shown && (!pause || (focused && !doc.hidden));
    if (active !== previous) {
      previous = active;
      changedState(active);
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
  win.addEventListener(changed, publish);
  win.addEventListener("storage", (event) => {
    if (event.key === key || event.key === null) publish();
  });
  publish();
}

export function mountPausePreference(root, locale, onError) {
  const labels = /^zh/i.test(locale)
    ? ["失去焦点时自动暂停", "关闭后继续战斗；手机系统仍可能暂停后台页面。"]
    : /^es/i.test(locale)
      ? [
          "Pausar al perder el foco",
          "Al desactivar, el combate continúa. El sistema móvil puede suspender la página.",
        ]
      : [
          "Pause when focus is lost",
          "When off, combat continues. Mobile systems may still suspend background pages.",
        ];
  const label = document.createElement("label"),
    input = document.createElement("input"),
    text = document.createElement("span");
  label.id = "pause-on-focus-loss-setting";
  label.style.cssText =
    "display:flex;align-items:center;gap:10px;margin:10px 0;white-space:normal";
  label.title = labels[1];
  input.type = "checkbox";
  input.id = "pause-on-focus-loss";
  input.style.cssText = "width:20px;height:20px;flex-shrink:0;margin:0";
  text.textContent = labels[0];
  const sync = () => {
    input.checked = pauseOnFocusLoss();
    const hint = root.querySelector("[data-focus-preference-hint]");
    if (hint) hint.textContent = labels[1];
  };
  input.onchange = () => {
    try {
      setPauseOnFocusLoss(input.checked);
    } catch (error) {
      sync();
      onError?.(error);
    }
  };
  // Use the DOM signal so listeners disappear with a closed settings window.
  const abort = new AbortController();
  const observer = new MutationObserver(() => {
    if (!label.isConnected) {
      abort.abort();
      observer.disconnect();
    }
  });
  window.addEventListener(changed, sync, { signal: abort.signal });
  window.addEventListener("storage", sync, { signal: abort.signal });
  label.append(input, text);
  root.append(label);
  observer.observe(document.body, { childList: true, subtree: true });
  sync();
}
