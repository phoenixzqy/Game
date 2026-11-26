// Collection navigation never reads or modifies a save.
(function installCollectionNavigation(doc, win, copy) {
  function render() {
    const code = Object.hasOwn(copy, doc.documentElement.lang) ? doc.documentElement.lang : "zh-CN",
      t = copy[code],
      prefix = "/Game"+(code === "zh-CN" ? "" : "/" + code);
    function links(parent, kind) {
      if (!parent || (kind === "menu" && parent.closest(".compact-system"))) return;
      let box = parent.querySelector("[data-collection-navigation]");
      if (box?.dataset.language === code) return;
      if (!box) {
        box = doc.createElement("aside");
        box.className = "collection-navigation collection-" + kind;
        box.dataset.collectionNavigation = "";
        parent.append(box);
      }
      box.dataset.language = code;
      box.replaceChildren();
      const note = doc.createElement("p");
      note.textContent = t.note;
      box.append(note);
      const nav = doc.createElement("nav");
      nav.setAttribute("aria-label", t.aria);
      for (const [key, url] of [
        ["directory", "/Game/games/"],
        ["site", "/Game/games/darkforged/"],
        ["guide", "/Game/games/darkforged/guides/"],
      ]) {
        const a = doc.createElement("a");
        a.href = prefix + url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = t[key];
        nav.append(a);
      }
      box.append(nav);
    }
    links(doc.querySelector("#entry"), "entry");
    links(doc.querySelector("#win-system .body"), "menu");
  }
  render();
  new win.MutationObserver(render).observe(doc.body, { childList: true, subtree: true });
  new win.MutationObserver(render).observe(doc.documentElement, {
    attributes: true,
    attributeFilter: ["lang"],
  });
})(document, window, {
  "zh-CN": {
    name: "暗金纪元 Darkforged",
    short: "暗金纪元",
    note: "暗金纪元是独立游戏；本地角色与原版及其他游戏不互通。登录后使用本游戏专属云存档，服务状态以云面板为准。",
    directory: "游戏目录 ↗",
    site: "本游戏介绍 ↗",
    guide: "本游戏攻略 ↗",
    aria: "暗金纪元网站导航（新页打开）",
  },
  en: {
    name: "Darkforged",
    short: "Darkforged",
    note: "Darkforged is an independent game. Local saves do not transfer to Classic or other games. Sign in for Darkforged cloud saves; see the cloud panel for service availability.",
    directory: "Game collection ↗",
    site: "Darkforged overview ↗",
    guide: "Darkforged guide ↗",
    aria: "Darkforged website links (open a new tab)",
  },
  es: {
    name: "Darkforged",
    short: "Darkforged",
    note: "Darkforged es un juego independiente. Las partidas locales no se transfieren a Classic ni a otros juegos. Inicia sesión para las partidas en la nube de Darkforged; consulta su disponibilidad en el panel.",
    directory: "Colección de juegos ↗",
    site: "Acerca de Darkforged ↗",
    guide: "Guía de Darkforged ↗",
    aria: "Enlaces de Darkforged (se abren en otra pestaña)",
  },
});

