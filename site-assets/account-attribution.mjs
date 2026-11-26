// Account-side attribution only; no account identifiers or email are sent to GA.
const KEY = "backmir-first-source-v1",
  TTL = 90 * 86400000;
function sourceOf(href, referrer) {
  const url = new URL(href),
    utm = url.searchParams.get("utm_source");
  if (utm && /^[a-z0-9][a-z0-9_-]{0,63}$/i.test(utm)) return "utm:" + utm.toLowerCase();
  if (!referrer) return "direct";
  try {
    const ref = new URL(referrer);
    if (
      !["https:", "http:"].includes(ref.protocol) ||
      ref.origin === url.origin ||
      ref.hostname === "accounts.google.com"
    )
      return null;
    if (/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}$/.test(ref.hostname))
      return "referral:" + ref.hostname;
  } catch {}
  return null;
}
export function captureFirstSource({ href, referrer = "", storage, now = Date.now() }) {
  try {
    const old = JSON.parse(storage?.getItem(KEY) || "null");
    if (
      old &&
      Number.isFinite(old.at) &&
      now >= old.at &&
      now - old.at < TTL &&
      (old.source === null || typeof old.source === "string")
    )
      return old.source;
  } catch {}
  const source = sourceOf(href, referrer);
  try {
    storage?.setItem(KEY, JSON.stringify({ source, at: now }));
  } catch {}
  return source;
}
let firstSource = null;
if (typeof window !== "undefined") {
  let storage;
  try {
    storage = window.localStorage;
  } catch {}
  firstSource = captureFirstSource({
    href: window.location.href,
    referrer: document.referrer,
    storage,
  });
}
export const registrationAttribution = () => ({ firstSource });
export function createGameLanguageReporter({
  fetcher = (...args) => globalThis.fetch(...args),
  now = () => Date.now(),
  visible = () => !document.hidden,
} = {}) {
  let user = null,
    playing = false,
    language = null,
    busy = false,
    lastKey = "",
    lastAt = 0,
    attemptKey = "",
    attemptAt = -Infinity;
  async function send() {
    if (!user || !playing || !visible() || !["zh-CN", "en", "es"].includes(language) || busy)
      return;
    const key = user + ":" + language,
      t = now();
    if ((key === lastKey && t - lastAt < 300000) || (key === attemptKey && t - attemptAt < 60000))
      return;
    busy = true;
    attemptKey = key;
    attemptAt = t;
    const accountId = user,
      selected = language;
    try {
      const response = await fetcher("/Game/api/account/game-language", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        signal: AbortSignal.timeout(6000),
        headers: {
          "Content-Type": "application/json",
          "X-Backmir-Community": "1",
          "X-Backmir-Language": selected,
        },
        body: JSON.stringify({ accountId, language: selected }),
      });
      if (response.ok) {
        lastKey = key;
        lastAt = t;
      }
    } catch {
      /* Offline or blocked telemetry must not affect local saves or gameplay. */
    } finally {
      busy = false;
      if (user && user + ":" + language !== key) void send();
    }
  }
  return {
    setUser(value) {
      user = value;
      void send();
    },
    observe(active, locale) {
      playing = active;
      language = locale;
      void send();
    },
  };
}

