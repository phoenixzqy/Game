const notices = {
  "zh-CN": {
    title: "难度加强版 · 休闲玩家谨慎尝试",
    body: "地狱版成长更慢、装备更难获得。无烟花，不沿用原版的额外爆率加成，并取消多项经验与便利加成，适合愿意长期积累、挑战高难度的玩家。",
    shared: "新增角色间80格共享仓库，仅可存入装备和技能书，方便不同角色开荒。",
    advice: "偏好轻松成长、快速成型的玩家，建议选择原版。",
    rules: "查看规则",
    directory: "游戏目录",
  },
  en: {
    title: "Higher difficulty · Casual players, choose carefully",
    body: "Hell has slower progression and harder-to-find equipment. There are no fireworks, no extra Classic drop-rate boosts, and many Classic experience and convenience bonuses are removed. It is intended for players who enjoy long-term progression and a tougher challenge.",
    shared:
      "New: an 80-slot shared stash for characters in the same Hell save. Equipment and skill books only, to help new characters get started.",
    advice: "For a more relaxed experience and faster character growth, choose Classic.",
    rules: "Read the rules",
    directory: "Game directory",
  },
  es: {
    title: "Mayor dificultad · Piénsalo si buscas jugar de forma casual",
    body: "Hell ofrece un progreso más lento y equipo más difícil de conseguir. No hay fuegos artificiales ni bonificaciones adicionales de botín de Clásico, y se eliminan muchas ayudas y bonificaciones de experiencia. Está pensado para quienes disfrutan acumulando recursos a largo plazo y buscan un reto mayor.",
    shared:
      "Nuevo almacén compartido de 80 espacios entre personajes de una misma partida de Hell. Solo admite equipo y libros de habilidades para ayudar a los personajes nuevos.",
    advice: "Si prefieres una experiencia relajada y progresar rápido, elige Clásico.",
    rules: "Ver las reglas",
    directory: "Juegos",
  },
};
const title = "旧境传说-梦回地狱";
function render() {
  const locale =
      new URL(location.href).searchParams.get("lang") || document.documentElement.lang || "zh-CN",
    key = notices[locale] ? locale : "zh-CN",
    n = notices[key];
  if (document.title !== title) document.title = title;
  const createHeading = document.querySelector("#new-character h2");
  if (createHeading) createHeading.dataset.hellCaution = n.title;
  const displayTitle = key === "zh-CN" ? title : "BackMir · Hell";
  const heading = document.querySelector("#entry h1");
  if (heading && heading.textContent !== displayTitle) heading.textContent = displayTitle;
  for (const parent of [
    document.querySelector("#entry"),
    document.querySelector("#win-system .body"),
  ]) {
    if (!parent) continue;
    let box = parent.querySelector("[data-hell-identity]");
    if (box?.dataset.locale === key) continue;
    if (!box) {
      box = document.createElement(parent.id === "entry" ? "aside" : "details");
      box.dataset.hellIdentity = "";
      box.style.cssText =
        "font:12px/1.5 system-ui;padding:10px;color:#e7bb96;background:#281713;border:1px solid #864839;max-width:440px";
      if (parent.id === "entry") parent.insertBefore(box, parent.querySelector(".entry-actions"));
      else parent.append(box);
    }
    box.dataset.locale = key;
    box.setAttribute("aria-label", n.title);
    box.replaceChildren();
    const strong = document.createElement(box.tagName === "DETAILS" ? "summary" : "strong");
    strong.textContent = n.title;
    box.append(strong);
    for (const text of [n.body, n.shared, n.advice]) {
      const p = document.createElement("p");
      p.style.margin = "6px 0";
      p.textContent = text;
      box.append(p);
    }
    for (const [label, path] of [
      [n.rules, "/Game/games/classic-hell/guides/"],
      [n.directory, "/Game/games/"],
    ]) {
      const a = document.createElement("a");
      a.textContent = label;
      a.href = (key === "zh-CN" ? "" : "/" + key) + path;
      a.target = "_blank";
      a.rel = "noopener";
      a.style.marginRight = "12px";
      box.append(a);
    }
  }
}
render();
new MutationObserver(render).observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ["lang"],
});

