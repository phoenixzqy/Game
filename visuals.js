// public/spell-effects.js
var SpellEffects = class {
  constructor(bindings, draw, missing) {
    this.bindings = bindings;
    this.drawFrame = draw;
    this.missing = missing;
    this.active = [];
  }
  trigger(spell, caster, target, now) {
    const b = this.bindings[spell];
    if (!b || !Object.keys(b.phases).length) {
      if (spell !== "None") this.missing.add("spell-effect:" + spell);
      return;
    }
    const distance = Math.max(Math.abs(caster.x - target.x), Math.abs(caster.y - target.y));
    const travel = b.phases.way ? Math.min(900, Math.max(160, distance * 65)) : 0;
    this.active.push({ b, caster: { ...caster }, target: { ...target }, at: now, travel });
  }
  draw(now) {
    this.active = this.active.filter((e) => {
      const t = now - e.at,
        life = Math.max(
          1200 + e.travel,
          ...Object.values(e.b.phases).map((f) => (f.delayMs ?? 0) + (f.durationMs ?? 0)),
        );
      if (t > life) return false;
      const paint = (phase, at, duration, x, y, dir = 0) => {
        const f = e.b.phases[phase];
        at = f?.delayMs ?? at;
        duration = f?.durationMs ?? duration;
        if (!f || t < at || t >= at + duration) return;
        const n = Math.min(f.count - 1, Math.floor(((t - at) / duration) * f.count));
        const index = f.start + (f.directions > 1 ? dir * f.stride : 0) + n;
        if (!f.blankFrames?.includes(index)) this.drawFrame(e.b.pack, index, x * 48, y * 32, true);
      };
      const self = e.b.phases.self,
        dx = e.target.x - e.caster.x,
        dy = e.target.y - e.caster.y;
      const selfDir =
        self?.aim === "target" && (dx || dy)
          ? (Math.round((Math.atan2(dx, -dy) * self.directions) / (2 * Math.PI)) +
              self.directions) %
            self.directions
          : (e.caster.dir || 0) * (self?.directions === 16 ? 2 : 1);
      paint("self", 0, 550, e.caster.x, e.caster.y, selfDir);
      if (e.travel) {
        const p = Math.max(0, Math.min(1, (t - 200) / e.travel)),
          dx2 = e.target.x - e.caster.x,
          dy2 = e.target.y - e.caster.y;
        const directions = e.b.phases.way.directions || 1;
        const dir =
          (Math.round((Math.atan2(dx2, -dy2) * directions) / (2 * Math.PI)) + directions) %
          directions;
        paint("way", 200, e.travel, e.caster.x + dx2 * p, e.caster.y + dy2 * p, dir);
      }
      const dest = e.b.phases.dest,
        anchor = dest?.aim === "caster" ? e.caster : e.target;
      paint(
        "dest",
        200 + e.travel,
        650,
        anchor.x,
        anchor.y,
        dest?.aim === "caster" ? e.caster.dir || 0 : 0,
      );
      return true;
    });
  }
  persistent(actor, now, position) {
    const b = this.bindings[actor.spell],
      f = b?.phases.persistent || b?.phases.dest;
    if (!f) return;
    const at = position || { x: actor.x * 48, y: actor.y * 32 };
    this.drawFrame(
      b.pack,
      f.start + (Math.floor(now / (f.frameMs ?? 130)) % f.count),
      at.x,
      at.y,
      true,
    );
  }
  clear() {
    this.active = [];
  }
};

// singleplayer/ui/visuals.js
var groups = {
  slash: ["TwinDrakeBlade", "CrossHalfMoon", "BladeAvalanche", "CounterAttack", "ShoulderDash"],
  force: ["Repulsion", "EnergyRepulsor", "Entrapment", "LionRoar"],
  aura: [
    "Fury",
    "Rage",
    "ProtectionField",
    "MagicBooster",
    "UltimateEnhancer",
    "PetEnhancer",
    "EnergyShield",
  ],
  light: ["Lightning", "ElectricShock", "TurnUndead", "Revelation", "Purification"],
  drain: ["Vampirism"],
  flame: ["HellFire", "FlameField", "FlameDisruptor"],
  frost: ["Blizzard", "FrostCrunch", "IceStorm"],
  meteor: ["MeteorStrike"],
  poison: ["Curse", "Plague", "PoisonCloud", "Hallucination"],
  heal: ["HealingCircle", "MassHealing"],
  rune: [
    "TrapHexagon",
    "Teleport",
    "Blink",
    "Mirroring",
    "SummonHolyDeva",
    "MassHiding",
    "SoulShield",
  ],
};
var kind = new Map(Object.entries(groups).flatMap(([k, spells]) => spells.map((s) => [s, k])));
var supplementalSpells = [...kind.keys()];
var palette = {
  drain: "#e875b5",
  slash: "#ffe09c",
  force: "#eedda0",
  aura: "#ff9e3d",
  light: "#c4deff",
  flame: "#ff7638",
  frost: "#8bd9ff",
  meteor: "#ff9b48",
  poison: "#a8d44f",
  heal: "#95f5a4",
  rune: "#ceafff",
};
function paintSkillIcon(canvas, spell, label) {
  const c = canvas.getContext("2d"),
    colour = palette[kind.get(spell) || "rune"];
  c.clearRect(0, 0, 36, 36);
  c.fillStyle = "#17120f";
  c.fillRect(1, 1, 34, 34);
  const gradient = c.createRadialGradient(18, 15, 1, 18, 18, 22);
  gradient.addColorStop(0, colour + "88");
  gradient.addColorStop(1, "#15100d");
  c.fillStyle = gradient;
  c.fillRect(3, 3, 30, 30);
  c.strokeStyle = "#9a7950";
  c.lineWidth = 1;
  c.strokeRect(1.5, 1.5, 33, 33);
  c.strokeStyle = colour;
  c.beginPath();
  c.moveTo(18, 4);
  c.lineTo(30, 18);
  c.lineTo(18, 31);
  c.lineTo(6, 18);
  c.closePath();
  c.globalAlpha = 0.35;
  c.stroke();
  c.globalAlpha = 1;
  c.font = "bold 14px SimSun,serif";
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.lineWidth = 3;
  c.strokeStyle = "#100b06";
  const text = Array.from(label).slice(0, 2).join("");
  c.strokeText(text, 18, 19);
  c.fillStyle = "#fff1c9";
  c.fillText(text, 18, 19);
  canvas.setAttribute("aria-label", label);
  canvas.dataset.artwork = "singleplayer-vector";
}
var SinglePlayerEffects = class extends SpellEffects {
  constructor(bindings, draw, missing, context) {
    super(bindings, draw, missing);
    this.context = context;
    this.vector = [];
  }
  trigger(spell, caster, target, now) {
    if (this.bindings[spell] && Object.keys(this.bindings[spell].phases).length)
      return super.trigger(spell, caster, target, now);
    if (!kind.has(spell)) return super.trigger(spell, caster, target, now);
    this.vector.push({
      spell,
      caster: { ...caster },
      target: { ...target },
      at: now,
    });
  }
  draw(now) {
    super.draw(now);
    this.vector = this.vector.filter((e) => {
      const t = (now - e.at) / 900;
      if (t > 1) return false;
      this.paint(e.spell, e.caster, e.target, t, false);
      return true;
    });
  }
  persistent(actor, now, position) {
    if (this.bindings[actor.spell]?.phases.persistent || this.bindings[actor.spell]?.phases.dest)
      return super.persistent(actor, now, position);
    if (kind.has(actor.spell)) {
      const at = position ? { ...actor, x: position.x / 48, y: position.y / 32 } : actor;
      this.paint(actor.spell, at, at, (now % 1800) / 1800, true);
    }
  }
  paint(spell, caster, target, t, persistent) {
    const c = this.context,
      k = kind.get(spell),
      colour = palette[k],
      self = ["aura", "force", "slash"].includes(k),
      at = self ? caster : target,
      x = at.x * 48 + 24,
      y = at.y * 32 - 6;
    c.save();
    c.translate(x, y);
    c.globalCompositeOperation = "lighter";
    c.strokeStyle = colour;
    c.fillStyle = colour;
    c.lineWidth = 2;
    c.globalAlpha = persistent ? 0.65 : Math.sin(Math.PI * t) * 0.9;
    c.shadowColor = colour;
    c.shadowBlur = 6;
    const ring = (rx, ry) => {
      c.beginPath();
      c.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      c.stroke();
    };
    if (k === "slash") {
      c.rotate(((caster.dir || 0) / 4) * Math.PI);
      for (let i = 0; i < (spell === "TwinDrakeBlade" ? 2 : 3); i++) {
        c.beginPath();
        c.ellipse(
          0,
          0,
          36 + t * 42 + i * 7,
          20 + i * 4,
          0,
          -Math.PI * 0.8 + t * 0.4,
          Math.PI * 0.25 + t,
        );
        c.stroke();
      }
    } else if (k === "frost" || k === "meteor") {
      const count = k === "meteor" ? 8 : 22;
      for (let i = 0; i < count; i++) {
        const p = (t + i * 0.137) % 1,
          px = Math.sin(i * 31) * 85 + p * 18,
          py = -125 + p * 155 + Math.cos(i * 13) * 24;
        c.beginPath();
        c.moveTo(px, py);
        c.lineTo(px - 10, py - 22);
        c.lineWidth = k === "meteor" ? 4 : 1;
        c.stroke();
        if (k === "frost") {
          c.beginPath();
          c.moveTo(px - 4, py - 4);
          c.lineTo(px + 4, py + 4);
          c.stroke();
        }
      }
      if (k === "meteor") ring(15 + t * 52, 6 + t * 22);
    } else if (k === "light") {
      c.beginPath();
      c.moveTo(0, -150);
      for (let i = 1; i < 8; i++) c.lineTo(Math.sin(i * 7 + t * 8) * 15, -150 + i * 20);
      c.lineTo(0, 0);
      c.stroke();
      ring(20 + t * 22, 8 + t * 8);
    } else if (k === "flame") {
      for (let i = 0; i < 9; i++) {
        c.beginPath();
        const px = Math.sin(i * 8) * 45;
        c.moveTo(px, 8);
        c.quadraticCurveTo(px + 28, -25, px + Math.sin(t * 8 + i) * 10, -35 - t * 50);
        c.lineWidth = 2 + (i % 3);
        c.stroke();
      }
      ring(30 + t * 35, 12 + t * 14);
    } else if (k === "poison") {
      for (let i = 0; i < 12; i++) {
        const a = i * 2.399 + t,
          p = 20 + (i % 4) * 14;
        c.globalAlpha = persistent ? 0.2 : 0.3 * Math.sin(Math.PI * t);
        c.beginPath();
        c.ellipse(Math.cos(a) * p, Math.sin(a) * p * 0.45 - 10 - t * 12, 15, 8, 0, 0, Math.PI * 2);
        c.fill();
      }
    } else if (k === "heal") {
      ring(65, 28);
      ring(70, 31);
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4,
          px = Math.cos(a) * 50,
          py = Math.sin(a) * 20 - ((t + i * 0.17) % 1) * 35;
        c.beginPath();
        c.moveTo(px - 4, py);
        c.lineTo(px + 4, py);
        c.moveTo(px, py - 4);
        c.lineTo(px, py + 4);
        c.stroke();
      }
    } else if (k === "drain") {
      const dx = (caster.x - target.x) * 48,
        dy = (caster.y - target.y) * 32;
      for (let i = 0; i < 10; i++) {
        const p = (t + i * 0.1) % 1;
        c.beginPath();
        c.arc(dx * p, dy * p - 25 - Math.sin(p * Math.PI) * 20, 2, 0, Math.PI * 2);
        c.fill();
      }
    } else if (k === "force") {
      for (let i = 0; i < 3; i++)
        ring(12 + ((t + i * 0.22) % 1) * 100, 5 + ((t + i * 0.22) % 1) * 42);
    } else {
      const radius = k === "aura" ? 26 : 45;
      ring(radius + t * 10, 12 + t * 5);
      c.beginPath();
      for (let i = 0; i <= 6; i++) {
        const angle = (i * Math.PI) / 3 + t * 0.3,
          px = Math.cos(angle) * radius,
          py = Math.sin(angle) * radius * 0.45;
        i ? c.lineTo(px, py) : c.moveTo(px, py);
      }
      c.stroke();
      for (let i = 0; i < 5; i++) {
        const a = i * 1.256 + t * 3;
        c.beginPath();
        c.moveTo(Math.cos(a) * radius, Math.sin(a) * 12);
        c.lineTo(Math.cos(a) * radius, Math.sin(a) * 12 - 20 - 30 * t);
        c.stroke();
      }
    }
    c.restore();
  }
  clear() {
    super.clear();
    this.vector = [];
  }
};
export { SinglePlayerEffects, paintSkillIcon, supplementalSpells };

