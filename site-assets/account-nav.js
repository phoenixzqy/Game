// Account navigation never reads or uploads game saves.
(async () => {
  const { accountSession } = await import("./account-session.mjs");
  function renderAccountNavigation() {
    const { status, user } = accountSession.state,
      lang = document.documentElement.lang,
      code = ["en", "es"].includes(lang) ? lang : "zh-CN",
      prefix = "/Game"+(code === "zh-CN" ? "" : "/" + code);
    const labels =
      code === "en"
        ? ["Community", "Sign in / Register", "Check account"]
        : code === "es"
          ? ["Comunidad", "Entrar / Registrarse", "Comprobar cuenta"]
          : ["玩家社区", "登录 / 注册", "查看账号状态"];
    const sectionPath = (a, path) =>
      prefix +
      path +
      (/^[a-z][a-z0-9-]{1,30}$/.test(a.dataset.gameContext || "")
        ? "?game=" + encodeURIComponent(a.dataset.gameContext)
        : "");
    document.querySelectorAll("[data-leaderboard-icon]").forEach((el) => {
      const label =
        code === "en"
          ? "Level leaderboard"
          : code === "es"
            ? "Clasificación de niveles"
            : "等级排行榜";
      el.title = label;
      el.setAttribute("aria-label", label);
    });
    document.querySelectorAll("[data-leaderboard-link]").forEach((a) => {
      a.textContent = code === "en" ? "Leaderboard" : code === "es" ? "Clasificación" : "排行榜";
      a.href = sectionPath(a, "/leaderboard/");
    });
    document.querySelectorAll("[data-community-link]").forEach((a) => {
      a.textContent = labels[0];
      a.href = sectionPath(a, "/community/");
    });
    document.querySelectorAll("[data-account-link]").forEach((a) => {
      a.textContent =
        status === "member" ? user.nickname : status === "guest" ? labels[1] : labels[2];
      // The site login is shared; the account page and return game keep their owner.
      const path = a.dataset.accountPath || "/Game/account/";
      a.href =
        prefix +
        (/^\/(?:games\/[a-z][a-z0-9-]{1,30}\/)?account\/$/.test(path) ? path : "/account/");
    });
  }
  accountSession.subscribe(renderAccountNavigation);
  new MutationObserver(renderAccountNavigation).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["lang"],
  });
})().catch(() => {});

