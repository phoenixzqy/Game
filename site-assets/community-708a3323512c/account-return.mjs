// Account language links preserve the selected public discussion/leaderboard
// or game entry. This helper never reads game state or account identifiers.
export function localizedAccountReturn(value, locale = "zh-CN") {
  const lang = ["zh-CN", "en", "es"].includes(locale) ? locale : "zh-CN",
    prefix = "/Game"+(lang === "zh-CN" ? "" : "/" + lang);
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\r\n]/.test(value)
  )
    return prefix + "/community/";
  try {
    const url = new URL(value, "https://backmir.invalid"),
      path = url.pathname.replace(/^\/(?:en|es)(?=\/)/, "");
    if (
      url.origin !== "https://backmir.invalid" ||
      !/(?<=^\/Game)\/(?:community|play|leaderboard)\//.test(path)
    )
      return prefix + "/community/";
    url.pathname = path.startsWith("/Game/play/") ? path : prefix + path;
    if (path.startsWith("/Game/play/")) url.searchParams.set("lang", lang);
    return url.pathname + url.search + url.hash;
  } catch {
    return prefix + "/community/";
  }
}

