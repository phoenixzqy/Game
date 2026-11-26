import { accountSession, publishAccountChange } from "./account-session.mjs";
import { mountAccountLogin, mountEmailBinding } from "./account-login.mjs";

const languages = ["zh-CN", "en", "es"];
const copy = {
  "zh-CN": {
    working: "正在处理…",
    unavailable: "暂时无法确认账号状态，请重试。",
    network: "网络连接失败，请重试。",
    saved: "昵称已更新。",
    signedOut: "已退出共享站点账号。",
    changed: "账号已变化，请重新核对。",
  },
  en: {
    working: "Working…",
    unavailable: "Account status is unavailable. Try again.",
    network: "Connection failed. Try again.",
    saved: "Display name updated.",
    signedOut: "Signed out of the shared site account.",
    changed: "The account changed. Check again.",
  },
  es: {
    working: "Procesando…",
    unavailable: "No se puede comprobar la cuenta. Reintenta.",
    network: "Falló la conexión. Reintenta.",
    saved: "Nombre actualizado.",
    signedOut: "Se cerró la sesión de la cuenta compartida.",
    changed: "La cuenta ha cambiado. Compruébala de nuevo.",
  },
};

/** Only this game's play entry can be used as the authentication destination. */
export function darkforgedReturnPath(search = "", locale = "zh-CN") {
  let selected = languages.includes(locale) ? locale : "zh-CN";
  try {
    const next = new URLSearchParams(search).get("next");
    if (next?.startsWith("/Game/play/darkforged/") && !/[\\\r\n]/.test(next)) {
      const url = new URL(next, "https://darkforged.invalid");
      if (
        url.origin === "https://darkforged.invalid" &&
        url.pathname === "/Game/play/darkforged/" &&
        languages.includes(url.searchParams.get("lang"))
      )
        selected = url.searchParams.get("lang");
    }
  } catch {
    /* A malformed destination falls back to this game's entry. */
  }
  return "/Game/play/darkforged/?lang=" + selected;
}

/** Shared account identity, with no gameplay, save, community or ranking calls. */
export function mountDarkforgedAccount({
  doc = globalThis.document,
  win = globalThis.window,
  session = accountSession,
  publish = publishAccountChange,
  loginMount = mountAccountLogin,
  emailMount = mountEmailBinding,
  fetcher = (...args) => globalThis.fetch(...args),
} = {}) {
  const locale = languages.includes(doc.documentElement.lang) ? doc.documentElement.lang : "zh-CN",
    m = copy[locale],
    $ = (selector) => doc.querySelector(selector),
    $$ = (selector) => [...doc.querySelectorAll(selector)],
    next = darkforgedReturnPath(win.location.search, locale);
  let disposed = false,
    busy = false,
    login = null,
    email = null,
    loginStamp = "",
    emailStamp = "",
    pendingLoginCleanup = null;
  const show = (text) => {
    const status = $("[data-account-status]") || $("#community-status");
    if (status) status.textContent = text;
  };
  const disable = () => {
    for (const button of $$("#profile-form button,[data-logout],[data-logout-all]"))
      button.disabled = busy || session.state.status !== "member";
  };
  const clearEmail = () => {
    email?.dispose?.();
    email = null;
    emailStamp = "";
    $("[data-email-binding]")?.replaceChildren();
  };
  const clearLogin = () => {
    pendingLoginCleanup = null;
    const previous = login;
    login = null;
    loginStamp = "";
    previous?.dispose?.();
  };
  const render = (state) => {
    if (disposed) return;
    const user = state.user || null;
    for (const el of $$("[data-auth-guest]")) el.hidden = !!user;
    for (const el of $$("[data-auth-member]")) el.hidden = !user;
    for (const el of $$("[data-account-name]")) el.textContent = user?.nickname || "";
    for (const el of $$("[data-account-email]")) {
      el.hidden = !user || !!user.emailLoginAddress;
      el.textContent = user && !user.emailLoginAddress ? user.email || "" : "";
    }
    if (user && $("#nickname") && doc.activeElement !== $("#nickname"))
      $("#nickname").value = user.nickname;
    const loginHost = $("[data-account-login]") || $("#account-login");
    const stamp =
      state.status === "guest"
        ? [state.emailLoginAvailable === true, state.googleAvailable === true].join(":")
        : "";
    if (loginHost && stamp && (stamp !== loginStamp || pendingLoginCleanup)) {
      clearLogin();
      loginStamp = stamp;
      let mounted;
      mounted = loginMount(loginHost, {
        locale,
        source: "darkforged_account",
        track: () => {},
        emailEnabled: state.emailLoginAvailable === true,
        googleEnabled: state.googleAvailable === true,
        onSuccess: (account) => {
          if (
            !disposed &&
            login === mounted &&
            session.state.status === "member" &&
            session.state.user?.id === (account?.id || session.state.user?.id)
          )
            win.location.assign(next);
        },
      });
      login = mounted;
    } else if (user && login) {
      // Email verification publishes the shared session synchronously, then checks
      // its own disposed state before onSuccess. Let that same stack finish before
      // removing the form; a remount or account change invalidates this cleanup.
      const cleanup = { instance: login, owner: user.id };
      pendingLoginCleanup = cleanup;
      queueMicrotask(() => {
        if (
          !disposed &&
          pendingLoginCleanup === cleanup &&
          login === cleanup.instance &&
          session.state.user?.id === cleanup.owner
        )
          clearLogin();
      });
    }
    const emailHost = $("[data-email-binding]"),
      key =
        state.status === "member" && state.emailLoginAvailable === true && user
          ? user.id + ":" + (user.emailLoginAddress || "")
          : "";
    if (emailHost && key !== emailStamp) {
      clearEmail();
      emailStamp = key;
      if (key)
        email = emailMount(emailHost, {
          user,
          locale,
          onSuccess: (account) => {
            if (!disposed && session.state.user?.id === account.id) publish(account);
          },
        });
    }
    disable();
    if (state.status === "unavailable") show(m.unavailable);
  };
  async function request(path, data) {
    let response;
    try {
      response = await fetcher(path, {
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
    let result;
    try {
      result = await response.json();
    } catch {
      throw Error(m.unavailable);
    }
    if (!response.ok) throw Error(result.error || m.unavailable);
    return result;
  }
  const profile = $("#profile-form");
  const saveProfile = async (event) => {
    event.preventDefault();
    if (
      disposed ||
      busy ||
      session.state.status !== "member" ||
      profile.reportValidity?.() === false
    )
      return;
    const owner = session.state.user.id;
    busy = true;
    disable();
    show(m.working);
    try {
      await request("/Game/api/account/profile", { nickname: $("#nickname").value.trim() });
      if (disposed) return;
      if (session.state.user?.id !== owner) throw Error(m.changed);
      const refreshed = await session.refresh({ force: true });
      if (refreshed.status !== "member" || refreshed.user?.id !== owner) throw Error(m.changed);
      publish(refreshed.user);
      show(m.saved);
    } catch (error) {
      if (!disposed) show(error.message);
    } finally {
      busy = false;
      if (!disposed) disable();
    }
  };
  profile?.addEventListener("submit", saveProfile);
  const logout = async (event) => {
    const button = event.target.closest("[data-logout],[data-logout-all]");
    if (!button || disposed || busy || session.state.status !== "member") return;
    busy = true;
    disable();
    show(m.working);
    try {
      await request(
        button.hasAttribute("data-logout-all") ? "/Game/api/account/logout-all" : "/Game/api/account/logout",
        {},
      );
      if (disposed) return;
      // Refresh the real shared session before broadcasting. An account changed
      // in another tab must not be replaced with a guessed signed-out state.
      const refreshed = await session.refresh({ force: true });
      if (refreshed.status === "unavailable") throw Error(m.unavailable);
      publish(refreshed.user || null);
      show(refreshed.user ? m.changed : m.signedOut);
    } catch (error) {
      if (!disposed) show(error.message);
    } finally {
      busy = false;
      if (!disposed) disable();
    }
  };
  doc.addEventListener("click", logout);
  for (const link of $$("[data-return-game]")) link.href = next;
  const unsubscribe = session.subscribe(render);
  session.refresh();
  return {
    dispose() {
      disposed = true;
      unsubscribe();
      clearLogin();
      clearEmail();
      profile?.removeEventListener("submit", saveProfile);
      doc.removeEventListener("click", logout);
    },
  };
}

if (typeof document !== "undefined" && document.querySelector("#profile-form"))
  mountDarkforgedAccount();

