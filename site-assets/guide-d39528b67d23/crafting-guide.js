// Read-only guide calculators; they never access a game save.
for (const form of document.querySelectorAll("[data-craft-stars]")) {
  const update = () => {
    const total = Number(form.elements.quality.value),
      thresholds = form.elements.equipment.selectedOptions[0].dataset.thresholds
        .split(",")
        .filter(Boolean)
        .map(Number);
    form.querySelector("output").textContent =
      !Number.isFinite(total) || total < 0
        ? "请输入有效的非负材料总品质"
        : thresholds.length
          ? "预计制作 " +
            thresholds.filter((n) => total >= n).length +
            " 点极品属性（最多5点，具体属性随机分配）"
          : "护符不产生制作星级";
  };
  form.addEventListener("input", update);
  form.addEventListener("submit", (e) => e.preventDefault());
  update();
}
for (const form of document.querySelectorAll("[data-craft-quality]")) {
  const update = () => {
    const level = Number(form.elements.level.value),
      total = Number(form.elements.quality.value),
      count = Number(form.elements.count.value),
      out = form.querySelector("output");
    if (
      !Number.isInteger(level) ||
      level < 4 ||
      level > 9 ||
      !Number.isInteger(count) ||
      count < 1 ||
      count > 5 ||
      !Number.isFinite(total) ||
      total < count ||
      total > count * 19
    ) {
      out.textContent = "请填4–9级、1–5份金矿，并核对总品质在份数至19×份数之间。";
      return;
    }
    const ratio = Math.min(1, 0.4 + 0.2 * (level - 4)),
      quality = Math.max(1, Math.floor(total * ratio));
    out.textContent = `成品品质 ${quality} · 品质率 ${Math.round(ratio * 100)}% · 费用 ${count * 12000} 金币 · 经验 1${quality >= 25 ? " · 满足25品质交付条件" : " · 未达到25品质交付条件"}`;
  };
  form.addEventListener("input", update);
  form.addEventListener("submit", (e) => e.preventDefault());
  update();
}

