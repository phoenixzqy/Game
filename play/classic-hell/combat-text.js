import { i18n } from "./i18n.js";
// Display native DamageIndicator packets. HP differences are never invented as hits.
export class CombatText {
  constructor(root) {
    this.root = root;
    this.active = [];
    this.history = [];
  }
  add(packet, actor, now, isPlayer = false) {
    if (!actor) return;
    const text =
      packet.Type === "HeavyStrike"
        ? i18n.t("skill.heavy.hit") + " " + packet.Damage
        : packet.Type === "SpiritLevelUp"
          ? i18n.t("skill.spirit.levelUp", { level: packet.Level })
          : packet.Type === "Miss"
            ? i18n.ui("miss")
            : packet.Type === "Blocked"
              ? i18n.ui("blocked")
              : packet.Type === "Critical"
                ? i18n.ui("critical")
                : packet.Damage > 0
                  ? "+" + packet.Damage
                  : String(packet.Damage);
    const color = ["Miss", "Blocked"].includes(packet.Type)
      ? "#ddd"
      : ["Critical", "HeavyStrike", "SpiritLevelUp"].includes(packet.Type)
        ? "#ff9f42"
        : packet.Damage > 0
          ? "#88f18b"
          : isPlayer
            ? "#ff7272"
            : "#ffe99b";
    const node = document.createElement("span");
    node.className = "damage-number";
    node.textContent = text;
    node.style.color = color;
    node.dataset.object = actor.id;
    if (packet.ElementalTypes?.length && packet.Damage < 0) {
      const hues = {
        10005: "#7edbff",
        10006: "#ff9b54",
        10007: "#ffe9a6",
        10008: "#b983cf",
        10009: "#c3a0ff",
      };
      node.dataset.elements = packet.ElementalTypes.join(",");
      node.style.textShadow =
        "0 0 6px " +
        (packet.ElementalTypes.length === 1 ? hues[packet.ElementalTypes[0]] : "#cbeaff");
    }
    this.root.append(node);
    const lane = this.active.filter((f) => f.id === actor.id && now - f.at < 350).length;
    this.active.push({
      node,
      id: actor.id,
      x: actor.x * 48 + 24,
      y: actor.y * 32 - 68 - lane * 22,
      at: now,
    });
    this.history.push({
      type: packet.Type,
      amount: packet.Damage,
      object: actor.id,
      text,
      at: now,
      ...(packet.ElementalTypes ? { elements: [...packet.ElementalTypes] } : {}),
    });
    if (this.history.length > 200) this.history.shift();
  }
  draw(now, camera) {
    this.active = this.active.filter((f) => {
      const elapsed = now - f.at;
      if (elapsed > 1200) {
        f.node.remove();
        return false;
      }
      f.node.style.transform = `translate(${f.x - camera.x}px,${f.y - camera.y - elapsed * 0.05}px) translateX(-50%)`;
      f.node.style.opacity = String(Math.min(1, (1200 - elapsed) / 350));
      return true;
    });
  }
  clear() {
    for (const f of this.active) f.node.remove();
    this.active = [];
  }
}

