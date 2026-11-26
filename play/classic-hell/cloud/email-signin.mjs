import { communityMessages, translateError } from "./community-i18n.mjs";
import { registrationAttribution } from "./account-attribution.mjs";
import { publishAccountChange } from "./account-session.mjs";

const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
export function emailFormMarkup(locale, { binding = false } = {}) {
  const m = communityMessages(locale),
    t = (key) => escape(m[key]);
  return `<form class="email-signin" data-email-form novalidate><label>${t("email")}<input name="email" type="email" autocomplete="email" inputmode="email" autocapitalize="none" spellcheck="false" required maxlength="254"></label><div class="email-code-row"><label>${t("code")}<input name="code" type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{8}" minlength="8" maxlength="8" placeholder="${t("codePlaceholder")}" required></label><button type="button" data-email-send>${t("sendCode")}</button></div><button type="submit" class="button email-submit" data-email-verify>${t(binding ? "bindEmail" : "verify")}</button><p class="email-status" data-email-status role="status" aria-live="polite"></p></form>`;
}

export function bindEmailSignIn({
  form,
  consent,
  locale = "zh-CN",
  source = "other",
  accountId = null,
  track = () => {},
  onSuccess = () => {},
  request,
  publish = publishAccountChange,
  attribution = registrationAttribution,
  now = Date.now,
  setTimer = setTimeout,
  clearTimer = clearTimeout,
} = {}) {
  const m = communityMessages(locale),
    email = form.elements.namedItem("email"),
    code = form.elements.namedItem("code"),
    send = form.querySelector("[data-email-send]"),
    verify = form.querySelector("[data-email-verify]"),
    status = form.querySelector("[data-email-status]");
  let busy = false,
    disposed = false,
    sentTo = "",
    deadline = 0,
    timer;
  const api =
    request ||
    async function (path, data) {
      let response;
      try {
        response = await fetch(path, {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            "X-Backmir-Community": "1",
            "X-Backmir-Language": locale,
          },
          body: JSON.stringify(data),
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
      if (!response.ok) {
        const error = Error(value.error || m.unavailable);
        error.retryAfter = Number(response.headers.get("Retry-After")) || 0;
        throw error;
      }
      return value;
    };
  const address = () => email.value.trim().toLowerCase(),
    allowed = () => !!accountId || !!consent?.checked;
  function render() {
    if (disposed) return;
    clearTimer(timer);
    const remaining = Math.max(0, Math.ceil((deadline - now()) / 1000));
    send.disabled = busy || remaining > 0;
    verify.disabled = busy;
    email.disabled = busy;
    code.disabled = busy;
    send.textContent = remaining
      ? m.resendIn.replace("{seconds}", String(remaining))
      : sentTo
        ? m.resendCode
        : m.sendCode;
    verify.textContent = busy ? m.working : accountId ? m.bindEmail : m.verify;
    form.setAttribute("aria-busy", String(busy));
    if (remaining) timer = setTimer(render, Math.min(1000, deadline - now()));
  }
  function requireConsent() {
    if (!allowed()) {
      status.textContent = m.needConsent;
      consent?.focus();
      return false;
    }
    return true;
  }
  function requireEmail() {
    const value = address();
    if (
      value.length > 254 ||
      !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/i.test(value) ||
      !email.reportValidity()
    ) {
      status.textContent = translateError("请填写有效邮箱", locale);
      email.focus();
      return false;
    }
    return true;
  }
  function requireCode() {
    if (!/^[0-9]{8}$/.test(code.value.trim()) || !code.reportValidity()) {
      status.textContent = translateError("请输入 8 位数字验证码", locale);
      code.focus();
      return false;
    }
    return true;
  }
  async function sendCode(event) {
    event?.preventDefault();
    if (disposed || busy || deadline > now() || !requireConsent() || !requireEmail()) return;
    busy = true;
    status.textContent = m.working;
    render();
    if (!accountId) track("auth_start", { method: "email", source }, true);
    try {
      const value = await api(accountId ? "/Game/api/account/email/bind/code" : "/Game/api/account/code", {
        email: address(),
        locale,
        ...(accountId ? { accountId } : {}),
      });
      if (disposed) return;
      sentTo = address();
      deadline = now() + Math.max(1, Number(value.retryAfter) || 60) * 1000;
      code.value = "";
      status.textContent =
        typeof value.message === "string" && value.message.trim() ? value.message : m.codeSent;
      code.disabled = false;
      code.focus();
    } catch (error) {
      if (disposed) return;
      if (error.retryAfter) deadline = now() + error.retryAfter * 1000;
      status.textContent = error.message || m.unavailable;
      if (!accountId) track("auth_error", { method: "email", source, stage: "email_send" }, true);
    } finally {
      busy = false;
      render();
    }
  }
  async function verifyCode(event) {
    event?.preventDefault();
    if (disposed || busy || !requireConsent() || !requireEmail()) return;
    if (!sentTo || address() !== sentTo) {
      status.textContent = m.sendCodeFirst;
      send.focus();
      return;
    }
    if (!requireCode()) return;
    busy = true;
    status.textContent = m.working;
    render();
    try {
      const value = await api(
        accountId ? "/Game/api/account/email/bind/verify" : "/Game/api/account/verify",
        {
          email: sentTo,
          code: code.value.trim(),
          locale,
          ...(accountId ? { accountId } : { consent: true, ...attribution() }),
        },
      );
      if (!value.user || (accountId && value.user.id !== accountId)) throw Error(m.accountChanged);
      publish(value.user);
      if (disposed) return;
      if (!accountId)
        track(value.isNewAccount ? "sign_up" : "login", { method: "email", source }, true);
      status.textContent = accountId ? m.emailBound : m.signedIn;
      onSuccess(value.user, value);
    } catch (error) {
      if (disposed) return;
      status.textContent = error.message || m.unavailable;
      if (!accountId) track("auth_error", { method: "email", source, stage: "email_verify" }, true);
    } finally {
      busy = false;
      render();
    }
  }
  const changeEmail = () => {
    if (address() !== sentTo) {
      code.value = "";
      status.textContent = "";
    }
    render();
  };
  send.addEventListener("click", sendCode);
  form.addEventListener("submit", verifyCode);
  email.addEventListener("input", changeEmail);
  consent?.addEventListener("change", render);
  render();
  return {
    sendCode,
    verifyCode,
    refresh: render,
    dispose() {
      disposed = true;
      clearTimer(timer);
      send.removeEventListener("click", sendCode);
      form.removeEventListener("submit", verifyCode);
      email.removeEventListener("input", changeEmail);
      consent?.removeEventListener("change", render);
    },
  };
}

