import { analyticsContext, acquisitionConfig } from "./analytics-context.mjs";
// Bounded conversion events only: never accept player text, account IDs or URLs.
const sources = new Set(["backup_prompt", "cloud_panel", "account_link", "other"]);
export const funnelSource = (value) => (sources.has(value) ? value : "other");
export function createAccountFunnel({ send = () => {}, locale = () => "zh-CN" } = {}) {
  const seen = new Set();
  return (event, values = {}, once = false) => {
    if (
      ![
        "backup_prompt_view",
        "backup_prompt_click",
        "backup_prompt_dismiss",
        "account_view",
        "auth_start",
        "auth_error",
        "sign_up",
        "login",
        "first_cloud_saved",
      ].includes(event)
    )
      return;
    const params = { language: ["zh-CN", "en", "es"].includes(locale()) ? locale() : "zh-CN" };
    if (values.entry_point || values.source)
      params.entry_point = funnelSource(values.entry_point || values.source);
    if (["google", "email"].includes(values.method)) params.method = values.method;
    if (
      [
        "sdk",
        "challenge",
        "credential",
        "cancelled",
        "popup",
        "email_send",
        "email_verify",
      ].includes(values.stage)
    )
      params.stage = values.stage;
    if (["quest", "playtime"].includes(values.trigger)) params.trigger = values.trigger;
    const key = event + JSON.stringify(params);
    if (once && seen.has(key)) return;
    seen.add(key);
    try {
      send(event, params);
    } catch {
      /* Measurement must never interrupt login or saving. */
    }
  };
}
export function browserAccountFunnel({
  win = window,
  locale = () => win.document?.documentElement?.lang || "zh-CN",
} = {}) {
  return createAccountFunnel({
    locale,
    send: (name, params) => {
      if (
        win.location.origin === "" &&
        !win.backmirAnalyticsDisabled &&
        win.navigator.onLine !== false &&
        typeof win.gtag === "function"
      )
        win.gtag("event", name, { ...analyticsContext(win, win.document), ...params });
    },
  });
}
export function installAccountAnalytics(win = window, doc = document) {
  const el = doc.querySelector("script[data-account-analytics]");
  if (
    !el ||
    win.location.origin !== "" ||
    !/(?<=^\/Game)\/(?:en\/|es\/)?account\/$/.test(win.location.pathname) ||
    win.backmirAccountAnalyticsStarted
  )
    return false;
  const id = el.dataset.measurementId;
  if (!/^G-[A-Z0-9]+$/.test(id || "")) return false;
  let excluded = new URL(win.location.href).searchParams.get("analytics") === "off";
  try {
    if (excluded) win.sessionStorage.setItem("backmir.analyticsExcluded", "1");
    excluded = excluded || win.sessionStorage.getItem("backmir.analyticsExcluded") === "1";
  } catch {}
  if (excluded) {
    win.backmirAnalyticsDisabled = true;
    return false;
  }
  win.backmirAccountAnalyticsStarted = true;
  win.dataLayer = win.dataLayer || [];
  win.gtag = function () {
    win.dataLayer.push(arguments);
  };
  win.gtag("js", new Date());
  win.gtag("config", id, {
    ...acquisitionConfig(win, doc),
    ...analyticsContext(win, doc),
    page_title: "Backmir account",
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
  const script = doc.createElement("script");
  script.async = true;
  script.src = "https://www.googletagmanager.com/gtag/js?id=" + id;
  doc.head.append(script);
  return true;
}

