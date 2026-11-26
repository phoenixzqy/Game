import { communityMessages, communityPath } from "./community-i18n.mjs";
import { bindGoogleSignIn } from "./google-signin.mjs";
import { emailFormMarkup, bindEmailSignIn } from "./email-signin.mjs";

const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
export function accountLoginMarkup(locale, { emailEnabled = true, googleEnabled = true } = {}) {
  const m = communityMessages(locale),
    t = (key) => escape(m[key]),
    p = (path) => communityPath(path, locale);
  return `<div class="account-login" data-account-login><label class="consent game-signin-consent"><input type="checkbox" data-auth-consent>${t("consent")}</label><p class="account-terms"><a href="${p("/Game/privacy/")}" target="_blank" rel="noopener">${t("privacy")}</a> · <a href="${p("/Game/terms/")}" target="_blank" rel="noopener">${t("terms")}</a></p>${emailEnabled ? emailFormMarkup(locale) : ""}${googleEnabled ? `<div class="account-google">${emailEnabled ? `<p class="auth-divider">${t("or")}</p>` : ""}<button type="button" data-google-start>${t("continueGoogle")}</button><div data-google-button></div><p data-google-status role="status" aria-live="polite"></p></div>` : ""}${!emailEnabled && !googleEnabled ? `<p>${t("unavailable")}</p>` : ""}</div>`;
}
export function bindAccountLogin(container, { locale, source, track, onSuccess } = {}) {
  const consent = container.querySelector("[data-auth-consent]"),
    form = container.querySelector("[data-email-form]"),
    host = container.querySelector("[data-google-button]"),
    controllers = [];
  if (form) controllers.push(bindEmailSignIn({ form, consent, locale, source, track, onSuccess }));
  if (host) {
    const status = container.querySelector("[data-google-status]");
    controllers.push(
      bindGoogleSignIn({
        host,
        button: container.querySelector("[data-google-start]"),
        consent,
        locale,
        source,
        track,
        onSuccess,
        autoPrepare: false,
        show: (value) => (status.textContent = value),
      }),
    );
  }
  const stopKeys = (event) => {
    if (event.code !== "Escape") event.stopPropagation();
  };
  container.addEventListener("keydown", stopKeys);
  container.addEventListener("keyup", stopKeys);
  return {
    refresh() {
      controllers.forEach((c) => c.refresh?.());
    },
    dispose() {
      controllers.forEach((c) => c.dispose());
      container.removeEventListener("keydown", stopKeys);
      container.removeEventListener("keyup", stopKeys);
    },
  };
}
export function mountAccountLogin(container, options) {
  container.innerHTML = accountLoginMarkup(options.locale, options);
  return bindAccountLogin(container, options);
}
export function mountEmailBinding(container, { user, locale, onSuccess = () => {} }) {
  const m = communityMessages(locale);
  container.replaceChildren();
  container.innerHTML = `${user.emailLoginAddress ? `<p class="email-bound-address">${escape(m.loginEmail)}: ${escape(user.emailLoginAddress)}</p>` : ""}<details class="email-binding"><summary>${escape(user.emailLoginAddress ? m.changeEmail : m.bindEmail)}</summary><p>${escape(m.bindEmailHint)}</p>${emailFormMarkup(locale, { binding: true })}</details>`;
  const stop = (event) => {
    if (event.code !== "Escape") event.stopPropagation();
  };
  container.addEventListener("keydown", stop);
  container.addEventListener("keyup", stop);
  const controller = bindEmailSignIn({
    form: container.querySelector("[data-email-form]"),
    locale,
    accountId: user.id,
    onSuccess,
  });
  return {
    refresh: () => controller.refresh(),
    dispose() {
      controller.dispose();
      container.removeEventListener("keydown", stop);
      container.removeEventListener("keyup", stop);
    },
  };
}

