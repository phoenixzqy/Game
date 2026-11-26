// Low-cardinality observations, not proof of an APK. Never transmit the raw UA.
// Kept self-contained so the public HTML bootstrap can inline the same detector.
export function analyticsContext(win, doc) {
  let ua = "",
    display = "unknown",
    environment = "unknown",
    evidence = "none",
    entry = "direct";
  try {
    ua = String(win.navigator?.userAgent || "");
  } catch {}
  if (
    /MicroMessenger|\bQQ\/|FBAN|FBAV|Instagram|BytedanceWebview|musical_ly|TikTok|Line\//i.test(ua)
  ) {
    environment = "known_in_app";
    evidence = "app_marker";
  } else if (/Android/i.test(ua) && /(?:;\s*wv\b|\bVersion\/4\.0.*\bChrome\/)/i.test(ua)) {
    environment = "android_webview";
    evidence = "webview_marker";
  } else if (
    /(?:Chrome|CriOS|Firefox|FxiOS|Edg|OPR|SamsungBrowser)\//i.test(ua) ||
    /Version\/.*Safari\//i.test(ua)
  ) {
    environment = "browser_like";
    evidence = "browser_marker";
  }
  try {
    display =
      win.navigator?.standalone === true || win.matchMedia?.("(display-mode: standalone)").matches
        ? "standalone"
        : win.matchMedia?.("(display-mode: minimal-ui)").matches
          ? "minimal_ui"
          : win.matchMedia?.("(display-mode: fullscreen)").matches || doc?.fullscreenElement
            ? "fullscreen"
            : "browser";
  } catch {}
  const group = (path) => {
    path = path.replace(/^\/(en|es)(?=\/)/, "");
    return path === "/"
      ? "home"
      : path.startsWith("/Game/play/")
        ? "game"
        : path.startsWith("/Game/community/")
          ? "community"
          : /^\/(?:guide|games\/[^/]+\/guides)\//.test(path)
            ? "guide"
            : path.startsWith("/Game/leaderboard/")
              ? "leaderboard"
              : path.startsWith("/Game/account/")
                ? "account"
                : "other_internal";
  };
  try {
    if (doc?.referrer) {
      const ref = new URL(doc.referrer),
        url = new URL(win.location.href);
      entry = ref.origin === url.origin ? group(ref.pathname) : "external";
    }
    if (win.backmirEmbed) entry = "home_embed";
  } catch {}
  let game = "site";
  try {
    game = /(?<=^\/Game)\/(?:play|games)\/classic-hell(?:\/|$)/.test(
      win.location.pathname?.replace(/^\/(en|es)(?=\/)/, ""),
    )
      ? "classic-hell"
      : win.location.pathname?.startsWith("/Game/play/darkforged/")
        ? "darkforged"
        : win.location.pathname?.startsWith("/Game/play/")
          ? "classic"
          : "site";
  } catch {}
  return {
    game_id: game,
    client_environment: environment,
    environment_evidence: evidence,
    display_mode: display,
    entry_point: entry,
  };
}
// Keep only bounded public campaign labels. Internal links never set campaigns.
export function acquisitionConfig(win, doc) {
  let location = "",
    referrer = "";
  const campaign = {};
  try {
    const url = new URL(win.location.href);
    location = url.origin + url.pathname;
    let external = true;
    try {
      const ref = new URL(doc?.referrer);
      external = ref.origin !== url.origin;
      if (["http:", "https:"].includes(ref.protocol)) referrer = ref.origin + ref.pathname;
    } catch {}
    const source = url.searchParams.get("utm_source");
    if (
      external &&
      source &&
      !["backup_prompt", "cloud_panel", "account_link", "other"].includes(source) &&
      /^[a-z0-9][a-z0-9_.-]{0,79}$/i.test(source)
    ) {
      for (const [query, key] of [
        ["utm_source", "campaign_source"],
        ["utm_medium", "campaign_medium"],
        ["utm_campaign", "campaign_name"],
      ]) {
        const value = url.searchParams.get(query);
        if (value && /^[a-z0-9][a-z0-9_.-]{0,79}$/i.test(value)) campaign[key] = value;
      }
    }
  } catch {}
  return { page_location: location, page_referrer: referrer, ...campaign };
}
export const contextValues = {
  game_id: ["classic", "darkforged", "classic-hell", "site"],
  client_environment: ["browser_like", "android_webview", "known_in_app", "unknown"],
  environment_evidence: ["browser_marker", "webview_marker", "app_marker", "none"],
  display_mode: ["browser", "standalone", "minimal_ui", "fullscreen", "unknown"],
  entry_point: [
    "direct",
    "external",
    "home",
    "home_embed",
    "game",
    "community",
    "guide",
    "leaderboard",
    "account",
    "other_internal",
    "backup_prompt",
    "cloud_panel",
    "account_link",
    "other",
  ],
};

