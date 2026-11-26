// Deliberately conservative: a narrow desktop window is still a desktop.
export function chooseControlMode({
  override,
  preference,
  coarse,
  hover,
  touchPoints,
  shortestSide,
}) {
  if (override === "desktop" || override === "mobile") return override;
  if (preference === "desktop" || preference === "mobile") return preference;
  return coarse && !hover && touchPoints > 0 && shortestSide <= 900 ? "mobile" : "desktop";
}
export function browserControlMode() {
  let preference;
  try {
    preference = localStorage.getItem("backmir.controls");
  } catch {}
  return chooseControlMode({
    override: new URL(location.href).searchParams.get("controls"),
    preference,
    coarse: matchMedia("(pointer: coarse)").matches,
    hover: matchMedia("(hover: hover)").matches,
    touchPoints: navigator.maxTouchPoints,
    shortestSide: Math.min(screen.width, screen.height),
  });
}

