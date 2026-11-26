import { analyticsContext, acquisitionConfig } from "./analytics-context.mjs";
// Only public post metadata enters analytics. GA4 owns visitor deduplication and
// foreground engagement timing; do not add a second pageview or duration timer.
export function installCommunityAnalytics(win = window, doc = document) {
  const el = doc.querySelector("script[data-community-analytics]");
  if (!el || win.backmirCommunityAnalyticsStarted || win.location.origin !== "")
    return false;
  const { postId, category, measurementId } = el.dataset;
  if (
    !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(postId || "") ||
    !["guide", "help", "gear", "feedback"].includes(category) ||
    !/^G-[A-Z0-9]+$/.test(measurementId || "")
  )
    return false;
  const path = "/Game/community/posts/" + postId + "/";
  if (!["", "/Game/en", "/Game/es"].some((prefix) => win.location.pathname === prefix + path)) return false;
  let excluded = false;
  try {
    excluded = new URL(win.location.href).searchParams.get("analytics") === "off";
    if (excluded) win.sessionStorage.setItem("backmir.analyticsExcluded", "1");
    excluded = excluded || win.sessionStorage.getItem("backmir.analyticsExcluded") === "1";
  } catch {}
  if (excluded) {
    win.backmirAnalyticsDisabled = true;
    return false;
  }
  win.backmirCommunityAnalyticsStarted = true;
  win.dataLayer = win.dataLayer || [];
  win.gtag = function () {
    win.dataLayer.push(arguments);
  };
  let referrer = "";
  try {
    const u = new URL(doc.referrer);
    referrer = u.origin + u.pathname;
  } catch {}
  // A fixed title prevents player-written titles or names from entering GA.
  // All locale/filter/reply-page variants aggregate under one public post URL.
  win.gtag("js", new Date());
  win.gtag("config", measurementId, {
    ...acquisitionConfig(win, doc),
    ...analyticsContext(win, doc),
    page_location: "" + path,
    page_title: "Community post " + postId,
    page_referrer: referrer,
    content_group: "community_" + category,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
  const tag = doc.createElement("script");
  tag.async = true;
  tag.src = "https://www.googletagmanager.com/gtag/js?id=" + measurementId;
  doc.head.append(tag);
  return true;
}
if (typeof window !== "undefined") installCommunityAnalytics();

