import { communityMessages, communityPath } from "./community-i18n.mjs";
import { conversionMessages } from "./account-conversion-i18n.mjs";
import { registrationAttribution } from "./account-attribution.mjs";
import { publishAccountChange } from "./account-session.mjs";
let sdkPromise;
function loadSDK(locale) {
  return (sdkPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://accounts.google.com/gsi/client?hl=" + encodeURIComponent(locale);
    const timer = setTimeout(() => script.onerror(), 15000);
    script.onload = () => {
      clearTimeout(timer);
      resolve();
    };
    script.onerror = () => {
      clearTimeout(timer);
      script.remove();
      sdkPromise = null;
      reject(Error(communityMessages(locale).googleFailed));
    };
    document.head.append(script);
  }));
}
export function bindGoogleSignIn({
  host,
  button,
  consent,
  locale,
  source,
  track = () => {},
  show = () => {},
  onSuccess = () => {},
  enabled = true,
  autoPrepare = true,
  load = () => loadSDK(locale),
  provider = () => window.google,
  setTimer = setTimeout,
  clearTimer = clearTimeout,
  request,
} = {}) {
  const m = communityMessages(locale);
  let ready = false,
    loading = false,
    disposed = false,
    expiry;
  const api =
    request ||
    async function (path, data) {
      let response;
      try {
        response = await fetch(path, {
          method: data ? "POST" : "GET",
          credentials: "same-origin",
          cache: "no-store",
          headers: {
            "X-Backmir-Language": locale,
            ...(data ? { "Content-Type": "application/json", "X-Backmir-Community": "1" } : {}),
          },
          body: data ? JSON.stringify(data) : undefined,
          signal: AbortSignal.timeout(15000),
        });
      } catch {
        throw Error(m.network);
      }
      let value;
      try {
        value = await response.json();
      } catch {
        throw Error(m.unavailable);
      }
      if (!response.ok) throw Error(value.error || m.unavailable);
      return value;
    };
  function reset() {
    ready = false;
    host.replaceChildren();
    button.hidden = false;
    button.disabled = !enabled;
  }
  async function prepare() {
    if (!enabled || disposed || loading || ready) return;
    if (!consent.checked) {
      show(m.needConsent);
      consent.focus?.();
      return;
    }
    loading = true;
    button.disabled = true;
    button.hidden = true;
    show(m.working);
    let stage = "sdk";
    try {
      await load();
      if (disposed) return;
      if (!consent.checked) {
        show(m.needConsent);
        reset();
        return;
      }
      stage = "challenge";
      const challenge = await api("/Game/api/account/google/challenge");
      if (disposed) return;
      provider().accounts.id.initialize({
        client_id: challenge.clientId,
        nonce: challenge.nonce,
        auto_select: false,
        callback: async (credential) => {
          if (disposed) return;
          clearTimer(expiry);
          host.inert = true;
          try {
            if (!consent.checked) throw Error(m.needConsent);
            const response = await api("/Game/api/account/google", {
              credential: credential.credential,
              consent: true,
              ...registrationAttribution(),
            });
            track(response.isNewAccount ? "sign_up" : "login", { method: "google", source }, true);
            publishAccountChange(response.user);
            onSuccess(response.user);
          } catch (error) {
            if (disposed) return;
            track("auth_error", { method: "google", source, stage: "credential" }, true);
            show(error.message);
            reset();
          }
        },
      });
      provider().accounts.id.renderButton(host, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        locale,
        width: Math.min(320, Math.max(200, host.parentElement?.clientWidth || 320)),
        click_listener: () => track("auth_start", { method: "google", source }, true),
      });
      ready = true;
      host.inert = !consent.checked;
      show("");
      expiry = setTimer(() => {
        if (!disposed) reset();
      }, 290000);
    } catch (error) {
      if (disposed) return;
      track("auth_error", { method: "google", source, stage }, true);
      show(error.message || m.googleFailed);
      reset();
    } finally {
      loading = false;
      button.disabled = !enabled;
    }
  }
  const change = () => {
    host.inert = !consent.checked;
    button.disabled = !enabled || loading;
    if (consent.checked && autoPrepare) prepare();
  };
  host.inert = !consent.checked;
  button.disabled = !enabled;
  consent.addEventListener("change", change);
  button.addEventListener("click", prepare);
  return {
    prepare,
    refresh() {
      host.inert = !consent.checked;
      button.disabled = !enabled || loading;
    },
    dispose() {
      disposed = true;
      clearTimer(expiry);
      consent.removeEventListener("change", change);
      button.removeEventListener("click", prepare);
      host.replaceChildren();
    },
  };
}
export function mountGoogleSignIn(container, { locale, source, track, onSuccess, show }) {
  const m = communityMessages(locale),
    c = conversionMessages(locale),
    doc = container.ownerDocument;
  container.addEventListener("keydown", (event) => {
    if (event.code !== "Escape") event.stopPropagation();
  });
  const lead = doc.createElement("p");
  lead.textContent = c.lead;
  const label = doc.createElement("label");
  label.className = "game-signin-consent";
  const consent = doc.createElement("input");
  consent.type = "checkbox";
  label.append(consent, doc.createTextNode(m.consent));
  const links = doc.createElement("p");
  for (const [path, title] of [
    ["/Game/privacy/", m.privacy],
    ["/Game/terms/", m.terms],
  ]) {
    const a = doc.createElement("a");
    a.href = communityPath(path, locale);
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = title;
    links.append(a, doc.createTextNode(" · "));
  }
  const hint = doc.createElement("p");
  hint.textContent = c.hint;
  const host = doc.createElement("div");
  host.className = "game-google-button";
  const button = doc.createElement("button");
  button.type = "button";
  button.textContent = m.retry;
  button.hidden = true;
  container.append(lead, label, links, hint, host, button);
  return bindGoogleSignIn({ host, button, consent, locale, source, track, onSuccess, show });
}

