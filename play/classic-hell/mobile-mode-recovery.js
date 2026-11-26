// Hardware detection deliberately ignores the chosen control mode. A phone
// using PC controls must retain a visible route back to touch controls.
export function isMobileHardware({
  touchPoints = 0,
  touchEvents = false,
  coarse = false,
  hover = true,
  shortestSide = Infinity,
  uaMobile = false,
  userAgent = "",
} = {}) {
  return (
    (touchPoints > 0 || touchEvents) &&
    ((touchPoints > 1 && shortestSide <= 1024 && !/Windows/i.test(userAgent)) ||
      (coarse && !hover && shortestSide <= 900) ||
      uaMobile === true ||
      /Android|iPhone|iPad|iPod/i.test(userAgent))
  );
}
export function mobileHardware(win = window) {
  return isMobileHardware({
    touchPoints: win.navigator.maxTouchPoints,
    touchEvents: "ontouchstart" in win,
    coarse: win.matchMedia("(pointer: coarse)").matches,
    hover: win.matchMedia("(hover: hover)").matches,
    shortestSide: Math.min(win.screen.width, win.screen.height),
    uaMobile: win.navigator.userAgentData?.mobile,
    userAgent: win.navigator.userAgent,
  });
}
// The homepage embeds a playable game too; returning stays within that frame.
export function recoveryAllowed(mode, win = window) {
  return mode === "desktop" && mobileHardware(win);
}
export function mobileRecoveryURL(href, storage) {
  try {
    storage?.setItem("backmir.controls", "mobile");
    storage?.setItem("backmir.mobileUI", "m2");
  } catch {}
  const url = new URL(href);
  url.searchParams.set("controls", "mobile");
  url.searchParams.set("ui", "m2");
  return url.href;
}
const messages = {
  "zh-CN": { label: "切回手机版", busy: "切换中…" },
  en: { label: "Back to mobile", busy: "Switching…" },
  es: { label: "Volver al móvil", busy: "Cambiando…" },
};
export function mountMobileModeRecovery({
  mode,
  locale = "zh-CN",
  save,
  clear = () => {},
  onError = () => {},
  win = window,
  doc = document,
} = {}) {
  if (!recoveryAllowed(mode, win) || doc.getElementById("mobile-mode-recovery")) return null;
  const text = messages[locale.startsWith("zh") ? "zh-CN" : locale.startsWith("es") ? "es" : "en"],
    button = doc.createElement("button");
  button.type = "button";
  button.id = "mobile-mode-recovery";
  button.textContent = text.label;
  button.setAttribute("aria-label", text.label);
  button.style.cssText =
    "position:fixed;left:max(8px,env(safe-area-inset-left));bottom:max(8px,env(safe-area-inset-bottom));z-index:100002;box-sizing:border-box;min-height:44px;min-width:112px;padding:7px 12px;border:1px solid #9c8658;border-radius:5px;background:rgba(19,24,16,.92);color:#f0e0b6;font:13px/1.4 system-ui,sans-serif;touch-action:manipulation;cursor:pointer";
  button.addEventListener("pointerdown", (e) => e.stopPropagation());
  button.onclick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (button.disabled) return;
    button.disabled = true;
    button.textContent = text.busy;
    try {
      clear();
      await save();
      clear();
      let storage;
      try {
        storage = win.localStorage;
      } catch {}
      win.location.assign(mobileRecoveryURL(win.location.href, storage));
    } catch (error) {
      button.disabled = false;
      button.textContent = text.label;
      onError(error);
    }
  };
  doc.body.append(button);
  return button;
}

