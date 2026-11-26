// A* charges 10 for an axial step and 14 for a diagonal step.
function unobstructedCost(dx, dy) {
  return 10 * Math.max(dx, dy) + 4 * Math.min(dx, dy);
}

function findApproachPath(start, target, range, pathTo) {
  const candidates = [];
  for (let x = target.x - range; x <= target.x + range; x++) {
    for (let y = target.y - range; y <= target.y + range; y++) {
      const dx = x - start.x,
        dy = y - start.y;
      const cost = unobstructedCost(Math.abs(dx), Math.abs(dy));
      const deviation = Math.abs(dx * (target.y - start.y) - dy * (target.x - start.x));
      candidates.push({ x, y, cost, deviation });
    }
  }
  candidates.sort((a, b) => a.cost - b.cost || a.deviation - b.deviation);

  let best = null,
    bestCost = Infinity;
  for (const candidate of candidates) {
    if (candidate.cost >= bestCost) break;
    const route = pathTo({ x: candidate.x, y: candidate.y });
    if (route == null) continue;
    let previous = start,
      cost = 0;
    for (const step of route) {
      cost += step.x !== previous.x && step.y !== previous.y ? 14 : 10;
      previous = step;
    }
    if (cost < bestCost) {
      best = route;
      bestCost = cost;
    }
  }
  return best;
}

// singleplayer/mobile/view-scale.js
var VIEW_MODES = Object.freeze(["near", "standard", "far"]);
var VIEW_KEY = "backmir.mobile.worldView.v1";
var scales = { near: 1, standard: 0.85, far: 0.75 };
var validViewMode = (mode) => (VIEW_MODES.includes(mode) ? mode : "standard");
function readViewMode() {
  try {
    return validViewMode(localStorage.getItem(VIEW_KEY));
  } catch {
    return "standard";
  }
}
function writeViewMode(mode) {
  mode = validViewMode(mode);
  try {
    localStorage.setItem(VIEW_KEY, mode);
  } catch {}
  return mode;
}
function worldViewScale(mode, { w, h }) {
  return Math.max(scales[validViewMode(mode)], w / (48 * 44), h / (32 * 42));
}
var text = {
  "zh-CN": {
    view: "\u89C6\u91CE\u8DDD\u79BB",
    near: "\u8FD1",
    standard: "\u6807\u51C6",
    far: "\u8FDC",
  },
  en: { view: "World view", near: "Near", standard: "Standard", far: "Far" },
  es: { view: "Vista del mundo", near: "Cerca", standard: "Normal", far: "Lejos" },
};
var viewText = (locale, key) => (text[locale] || text.en)[key];

// public/healing-target.js
function healingTarget(me, actors, id) {
  return (
    actors.find(
      (a) =>
        a.id === id &&
        a.kind === "monster" &&
        a.friendly &&
        !a.dead &&
        a.master === me.id &&
        a.map === me.map,
    ) || me
  );
}

// singleplayer/mobile/controller.js
var directions = ["Up", "UpRight", "Right", "DownRight", "Down", "DownLeft", "Left", "UpLeft"];
var delta = [
  [0, -1],
  [1, -1],
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
];
var distance = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
function joystickDirection(x, y, deadZone = 14, previous = null, hysteresis = Math.PI / 24) {
  if (Math.hypot(x, y) < deadZone) return null;
  const angle = Math.atan2((y * 48) / 32, x),
    sector = Math.PI / 4;
  if (previous !== null && previous !== void 0) {
    const center = (previous - 2) * sector;
    let d = Math.abs(angle - center) % (2 * Math.PI);
    if (d > Math.PI) d = 2 * Math.PI - d;
    if (d <= sector / 2 + hysteresis) return previous;
  }
  return (Math.round(angle / sector) + 2 + 8) % 8;
}
var groups = {
  passive: [
    "Fencing",
    "HeavyStrike",
    "FatalSword",
    "MPEater",
    "Hemorrhage",
    "SpiritSword",
    "Slaying",
    "Focus",
    "Meditation",
    "Steadfast",
    "Berserker",
    "SkyCleaver",
  ],
  toggle: ["Thrusting", "HalfMoon", "WhirlwindSlash", "CrossHalfMoon", "DoubleSlash"],
  armed: ["TwinDrakeBlade", "FlamingSword", "CounterAttack", "MentalState", "BlazingSword"],
  self: [
    "Poisoning",
    "ProtectionField",
    "Rage",
    "Fury",
    "Repulsion",
    "EnergyRepulsor",
    "Mirroring",
    "FlameField",
    "MagicBooster",
    "UltimateEnhancer",
    "SummonHolyDeva",
    "EnergyShield",
    "Teleport",
    "Healing",
    "SummonSpiritServant",
    "Hiding",
    "SummonSkeleton",
    "SummonShinsu",
    "MagicShield",
    "ThunderStorm",
    "LionRoar",
    "SoulShield",
    "BlessedArmour",
    "MassHealing",
    "MassHiding",
    "AdvancedSummon",
    "BeastArmour",
    "SummonTiger",
    "SummonMoonSpirit",
    "BloodDragon",
    "DiamondBody",
    "Abyss",
    "InnateQi",
  ],
  ground: [
    "Hydra",
    "FireBang",
    "IceStorm",
    "IceFlame",
    "MeteorStrike",
    "FireWall",
    "PoisonCloud",
    "DragonFlame",
    "Blizzard",
    "ExplosiveTrap",
    "Portal",
    "HealingCircle",
    "Blink",
    "TrapHexagon",
    "Curse",
    "Plague",
  ],
  direction: [
    "FlashSlash",
    "ShoulderDash",
    "BackStep",
    "TwinDrakeBladeDash",
    "BladeAvalanche",
    "HellFire",
    "Lightning",
  ],
  pet: ["PetEnhancer"],
  unavailable: ["FastMove", "Reincarnation"],
  target: [
    "FireBall",
    "GreatFireBall",
    "ThunderBolt",
    "SoulFireBall",
    "FlameDisruptor",
    "FrostCrunch",
    "ChainThunder",
    "GhostBurn",
    "ElectricShock",
    "Purification",
    "Entrapment",
    "HolyDeva",
    "Vampirism",
    "TurnUndead",
    "SoulReaper",
    "Revelation",
    "Hallucination",
  ],
};
var targetableGroundSpells = /* @__PURE__ */ new Set([
  "FireBang",
  "IceStorm",
  "IceFlame",
  "MeteorStrike",
  "FireWall",
  "PoisonCloud",
  "DragonFlame",
  "Blizzard",
  "Curse",
  "Plague",
]);
function spellMode(spell) {
  return Object.keys(groups).find((k) => groups[k].includes(spell));
}
var primarySpells = [
  "FireBall",
  "GreatFireBall",
  "ThunderBolt",
  "FlameDisruptor",
  "FrostCrunch",
  "ChainThunder",
  "SoulFireBall",
  "GhostBurn",
];
function primaryAttackChoices(me) {
  return primarySpells.filter((spell) => me?.skills?.some((skill) => skill.Spell === spell));
}
var MobileController = class {
  constructor(bridge) {
    this.b = bridge;
    this.reasons = /* @__PURE__ */ new Set();
    this.busy = false;
    this.epoch = 0;
    this.target = 0;
    this.healTarget = 0;
    this.manualTarget = false;
    this.path = [];
    this.joystick = null;
    this.attacking = false;
    this.force = false;
    this.run = true;
    this.interaction = 0;
    this.aim = null;
    this.journey = null;
    this.retryAt = 0;
    this.snapshotKey = "";
    this.mapGoal = null;
  }
  clear({ target = false, journey = true, preserveAttack = false } = {}) {
    this.epoch++;
    this.pendingCast = null;
    this.healTarget = 0;
    this.path = [];
    this.joystick = null;
    if (!preserveAttack || target) this.attacking = false;
    this.force = false;
    this.interaction = 0;
    this.aim = null;
    this.retryAt = 0;
    this.mapGoal = null;
    if (target) {
      this.target = 0;
      this.manualTarget = false;
    }
    if (journey) this.journey = null;
    this.b.changed?.();
  }
  inactive() {
    const s = this.b.state();
    return this.reasons.size > 0 || !s?.me || s.stage !== "Game" || s.me.dead;
  }
  blocked(combat = false) {
    return (
      this.inactive() ||
      (this.b.panel() &&
        !(combat && this.b.inspectionCombatHud && this.b.continueInspectionAttack?.()))
    );
  }
  snapshot() {
    const s = this.b.state(),
      key = JSON.stringify([s?.epoch, s?.account?.id, s?.me?.id, s?.stage]);
    if (key !== this.snapshotKey) {
      this.clear({ target: true });
      this.snapshotKey = key;
    }
    if (s?.me?.dead) this.clear({ target: true });
    if (this.map !== s?.me?.map) {
      this.clear({ target: true, journey: false });
      this.map = s?.me?.map;
    }
    if (this.target && !this.candidates().some((a) => a.id === this.target)) {
      this.target = 0;
      this.manualTarget = false;
      if (this.attacking || (this.force && this.attackSkill(s.me))) {
        this.attacking = false;
        this.force = false;
        this.path = [];
      }
    }
    if (this.healTarget && healingTarget(s.me, s.actors, this.healTarget) === s.me)
      this.healTarget = 0;
    this.ensureTarget();
    this.b.changed?.();
  }
  candidates() {
    const s = this.b.state();
    return !s?.me
      ? []
      : (s.actors || [])
          .filter(
            (a) =>
              a.kind === "monster" &&
              !a.dead &&
              !a.friendly &&
              a.ai < 50 &&
              distance(s.me, a) <= 12 &&
              (!this.b.visible || this.b.visible(a)),
          )
          .sort((a, b) => distance(s.me, a) - distance(s.me, b) || a.id - b.id);
  }
  ensureTarget() {
    if (this.blocked(true)) return;
    const list = this.candidates();
    if ((this.manualTarget || this.attacking) && list.some((a) => a.id === this.target)) return;
    this.target = list[0]?.id || 0;
    this.manualTarget = false;
    this.b.changed?.();
  }
  select(id) {
    if (this.blocked() || !this.candidates().some((a) => a.id === id)) return;
    this.clear();
    this.target = id;
    this.manualTarget = true;
    this.b.changed?.();
  }
  selectPet(id) {
    const s = this.b.state();
    if (this.blocked() || healingTarget(s.me, s.actors, id) === s.me) return;
    if (this.healTarget === id) {
      this.healTarget = 0;
      this.b.changed?.();
      return;
    }
    this.clear({ preserveAttack: true });
    this.healTarget = id;
    this.b.message("healPet");
    this.b.changed?.();
  }
  cycle() {
    const list = this.candidates();
    if (list.length)
      this.select(list[(list.findIndex((a) => a.id === this.target) + 1) % list.length].id);
  }
  attack() {
    if (this.blocked(true)) return;
    if (this.force) {
      this.clear();
      return;
    }
    this.ensureTarget();
    if (!this.target) {
      if (this.mapGoal) this.clear();
      this.b.message("selectTarget");
      return;
    }
    const active = this.attacking;
    this.clear();
    this.attacking = !active;
    this.b.changed?.();
  }
  forceAttack() {
    if (this.blocked(true)) return;
    if (this.attackSkill(this.b.state().me)) {
      this.ensureTarget();
      if (!this.target) {
        this.b.message("selectTarget");
        return;
      }
    }
    this.clear();
    this.force = true;
  }
  move(goal) {
    if (this.blocked()) return;
    this.clear();
    const s = this.b.state();
    if (!Number.isInteger(goal?.x) || !Number.isInteger(goal?.y)) {
      this.b.message("blocked");
      return;
    }
    const target = { x: goal.x, y: goal.y };
    if (!distance(target, s.me)) return;
    this.path = this.b.path(target) || [];
    if (!this.path.length) {
      this.b.message("blocked");
      return;
    }
    this.mapGoal = { ...target, map: s.me.map, ownerId: s.me.id, ownerEpoch: s.epoch, failures: 0 };
  }
  retryMapGoal() {
    if (!this.mapGoal) return;
    this.path = [];
    this.retryAt = this.b.now() + 300;
    if (++this.mapGoal.failures >= 20) {
      this.mapGoal = null;
      this.b.message("blocked");
    }
  }
  interact(id) {
    if (this.blocked()) return;
    this.clear();
    this.interaction = id;
  }
  pickup() {
    const s = this.b.state(),
      a = s.actors
        .filter(
          (a2) =>
            a2.kind === "item" &&
            (!this.b.groundVisible || this.b.groundVisible(a2)) &&
            distance(a2, s.me) <= 2,
        )
        .sort((a2, b) => distance(a2, s.me) - distance(b, s.me))[0];
    if (a) this.interact(a.id);
    else if (!this.b.precisePickup?.()) this.send("PickUp");
    else this.b.noLoot?.();
  }
  steer(dir) {
    if (this.blocked()) return;
    if (this.joystick !== null && dir !== null) {
      this.joystick = dir;
      return;
    }
    this.clear();
    this.joystick = dir;
  }
  inspectPanel() {
    this.joystick = null;
    this.aim = null;
    this.interaction = 0;
  }
  release() {
    this.epoch++;
    this.joystick = null;
    this.path = [];
    this.mapGoal = null;
  }
  routeNear(target, range) {
    const route = findApproachPath(this.b.state().me, target, range, (goal) => this.b.path(goal));
    if (!route) return false;
    this.path = route;
    return true;
  }
  async send(type, data = {}) {
    return this.b.command(type, data);
  }
  async cast(spell, loc) {
    if (this.blocked(true)) return;
    this.ensureTarget();
    const mode = spellMode(spell),
      s = this.b.state(),
      m = s.me,
      skill = m.skills.find((s2) => s2.Spell === spell);
    if (!skill) return;
    if (this.mapGoal) this.clear();
    if (!mode || mode === "passive" || mode === "unavailable") {
      this.b.message(mode === "passive" ? "passive" : "unsupportedSkill");
      return;
    }
    const target =
      spell === "Healing"
        ? healingTarget(m, s.actors, this.healTarget)
        : mode === "self"
          ? m
          : mode === "pet"
            ? s.actors.find(
                (a) => a.kind === "monster" && a.friendly && !a.dead && a.master === m.id,
              )
            : s.actors.find((a) => a.id === this.target && !a.dead);
    if ((mode === "target" || mode === "pet") && !target) {
      this.b.message("selectTarget");
      return;
    }
    if (
      !loc &&
      target &&
      targetableGroundSpells.has(spell) &&
      distance(m, target) <= skill.Info?.Range
    )
      loc = { x: target.x, y: target.y };
    if (!loc && spell !== "Hydra" && (mode === "ground" || mode === "direction")) {
      this.clear();
      this.aim = spell;
      this.b.message("aim");
      return;
    }
    const queueManualSpell =
      m.job === "Wizard" &&
      (m.assist?.autoMagic === true || m.assist?.autoShield === true) &&
      mode !== "toggle" &&
      mode !== "armed";
    if (mode !== "toggle" && mode !== "armed" && (skill.CastTime || 0) > s.time) {
      this.b.message("cooldown");
      return;
    }
    if (mode !== "toggle" && mode !== "armed" && m.mp < this.b.cost(skill)) {
      this.b.message("mana");
      return;
    }
    if (
      mode !== "toggle" &&
      mode !== "armed" &&
      !queueManualSpell &&
      (this.b.ready("spellReadyIn") > 0 || this.b.ready("actionReadyIn") > 0)
    ) {
      this.pendingCast = { spell, loc, epoch: this.epoch, until: this.b.now() + 2500 };
      this.wake(
        Math.min(200, Math.max(this.b.ready("spellReadyIn"), this.b.ready("actionReadyIn"))),
      );
      return;
    }
    const keepAttack =
        mode === "toggle" || mode === "armed" || (mode === "self" && spell !== "Teleport"),
      combat = { attacking: this.attacking, force: this.force },
      healTarget = spell === "Healing" ? this.healTarget : 0;
    this.clear();
    if (keepAttack) Object.assign(this, combat);
    this.healTarget = healTarget;
    this.b.changed?.();
    this.b.preload(spell);
    if (mode === "toggle" || mode === "armed") {
      await this.send("SpellToggle", {
        Spell: spell,
        CanUse: mode === "armed" || !m.attackModes[spell[0].toLowerCase() + spell.slice(1)],
      });
      return;
    }
    const point =
      spell === "Hydra"
        ? loc || target || m
        : mode === "self" || mode === "target" || mode === "pet"
          ? target
          : loc;
    const dir = distance(m, point) ? this.b.direction(point.x - m.x, point.y - m.y) : m.dir;
    await this.send("Magic", {
      Spell: spell,
      Direction: directions[dir],
      AutoPlace: spell === "Hydra" && !loc,
      Queue: queueManualSpell,
      TargetID:
        spell === "Hydra" && !loc
          ? target?.id || 0
          : mode === "target" || mode === "self" || mode === "pet"
            ? target.id
            : 0,
      Location: { X: point.x, Y: point.y },
      ObjectID: m.id,
    });
  }
  travel(dest) {
    if (this.reasons.size) return;
    this.clear({ target: true });
    this.journey = dest;
    this.b.closePanels();
  }
  async travelStep() {
    const dest = this.journey,
      s = this.b.state(),
      m = s.me,
      w = this.b.adventure();
    if (!dest) return;
    if (dest.via) {
      const n = w.npcs.find((n2) => n2.id === dest.via.npc);
      if (!n || n.map !== m.map) dest.via = null;
      else {
        const p = { x: n.at[0], y: n.at[1] };
        if (distance(m, p) > 3) {
          this.routeNear(p, 3);
          return;
        }
        const epoch = this.epoch;
        await this.send("CallNPC", { ObjectID: n.id, Key: dest.via.key });
        if (epoch === this.epoch && this.journey === dest) dest.via = null;
        return;
      }
    }
    if (m.map === dest.map) {
      if (dest.npc) {
        const a = s.actors.find((a2) => a2.id === dest.npc);
        if (a) {
          this.journey = null;
          this.interaction = a.id;
        } else this.routeNear(dest, 3);
      } else {
        this.journey = null;
        this.routeNear(dest, 2);
      }
      return;
    }
    if (
      [1007, 1008].includes(dest.map) &&
      ![1007, 1008].includes(m.map) &&
      ![...m.inventory, ...m.questInventory].some((i) => i?.id === 9505 && i.count > 0)
    ) {
      this.journey = null;
      this.b.say(this.b.t("quest.templeScroll"));
      return;
    }
    const queue = [{ map: m.map, first: null }],
      seen = /* @__PURE__ */ new Set([m.map]);
    for (const current of queue) {
      const region = w.maps.find((r) => r.id === current.map),
        npcs = w.npcs
          .filter((n) => n.map === current.map)
          .flatMap((n) =>
            Object.entries(n.sections || {}).flatMap(([key, lines]) => {
              const move = lines.find((l) => l.startsWith("MOVE ")),
                required = n.travelRequirements?.[key];
              if (!move || (required && !m.completedQuests.includes(required))) return [];
              const to = w.maps.find((r) => r.file === move.split(/\s+/)[1]);
              return to ? [{ to: to.id, at: n.at, npc: n.id, key }] : [];
            }),
          );
      const dynamic =
        current.map === m.map
          ? (m.dynamicPortals || []).map((p) => ({ to: p.MapIndex, at: [p.Source.x, p.Source.y] }))
          : [];
      for (const edge of [...(region?.portals || []), ...dynamic, ...npcs]) {
        if (
          (edge.requiresQuest && !m.completedQuests.includes(edge.requiresQuest)) ||
          seen.has(edge.to)
        )
          continue;
        const first = current.first || edge;
        if (edge.to === dest.map) {
          const p = { x: first.at[0], y: first.at[1] };
          if (first.npc && distance(m, p) <= 3)
            await this.send("CallNPC", { ObjectID: first.npc, Key: first.key });
          else if (first.npc) this.routeNear(p, 3);
          else this.path = this.b.path(p) || [];
          return;
        }
        seen.add(edge.to);
        queue.push({ map: edge.to, first });
      }
    }
    this.journey = null;
    this.b.say(this.b.t("quest.routeLocked"));
  }
  // The host polls every 32 ms; also run the next step the moment the last one
  // ends, so held movement does not stand still on every tile.
  wake(ms) {
    if (!(ms >= 0) || this.wakeTimer) return;
    this.wakeTimer = setTimeout(
      () => {
        this.wakeTimer = 0;
        void this.tick();
      },
      Math.max(0, ms) + 1,
    );
  }
  attackSkill(me) {
    const spell = this.b.primaryAttackSpell?.(me);
    if (primarySpells.includes(spell)) return me.skills.find((skill) => skill.Spell === spell);
    if (me.job === "Taoist" && me.assist?.autoMagic)
      return me.skills.find((skill) => skill.Spell === "SoulFireBall");
  }
  async castPrimary(s, skill, target) {
    const m = s.me;
    const wait = Math.max(this.b.ready("spellReadyIn"), this.b.ready("actionReadyIn"));
    const queue = m.job === "Wizard" && (m.assist?.autoMagic || m.assist?.autoShield);
    if (
      !target ||
      distance(m, target) > skill.Info?.Range ||
      skill.CastTime > s.time ||
      wait > (queue ? 250 : 0) ||
      m.mp < this.b.cost(skill)
    )
      return;
    const dir = this.b.direction(target.x - m.x, target.y - m.y);
    this.retryAt = this.b.now() + 350;
    this.b.preload(skill.Spell);
    await this.send("Magic", {
      Spell: skill.Spell,
      Direction: directions[dir],
      TargetID: target.id,
      Location: { X: target.x, Y: target.y },
      ObjectID: m.id,
      Queue: !!queue,
    });
  }
  async attackInReach(me, target) {
    if (
      !target ||
      distance(me, target) > 1 ||
      this.b.ready("attackReadyIn") !== 0 ||
      this.b.ready("actionReadyIn") !== 0
    )
      return;
    await this.send("Attack", {
      Direction: directions[this.b.direction(target.x - me.x, target.y - me.y)],
      Spell: this.b.melee(),
      TargetID: target.id,
    });
  }
  async tick() {
    if (this.busy || this.inactive() || !this.b.worldReady() || this.b.now() < this.retryAt) return;
    const panel = this.b.panel();
    if (panel && !this.b.continueInspectionAttack?.()) return;
    this.busy = true;
    try {
      const s = this.b.state(),
        m = s.me;
      const skill = this.attackSkill(m);
      const target =
        (this.attacking || (this.force && skill)) &&
        s.actors.find(
          (a2) => a2.id === this.target && a2.kind === "monster" && !a2.dead && !a2.friendly,
        );
      if (this.pendingCast && (!panel || this.b.inspectionCombatHud)) {
        const intent = this.pendingCast;
        if (intent.epoch !== this.epoch || this.b.now() > intent.until) {
          this.pendingCast = null;
        } else {
          const wait = Math.max(this.b.ready("spellReadyIn"), this.b.ready("actionReadyIn"));
          if (wait > 0) {
            this.wake(Math.min(200, wait));
            return;
          }
          this.pendingCast = null;
          await this.cast(intent.spell, intent.loc);
          return;
        }
      }
      if (panel && !this.b.inspectionCombatHud) {
        if (skill) await this.castPrimary(s, skill, target);
        else await this.attackInReach(m, target);
        return;
      }
      if (
        this.mapGoal &&
        (this.mapGoal.map !== m.map ||
          this.mapGoal.ownerId !== m.id ||
          this.mapGoal.ownerEpoch !== s.epoch ||
          distance(m, this.mapGoal) === 0)
      ) {
        this.mapGoal = null;
        this.path = [];
      }
      const a = s.actors.find(
        (a2) => a2.id === this.interaction && (!this.b.groundVisible || this.b.groundVisible(a2)),
      );
      if (this.interaction && !a) this.interaction = 0;
      if (skill && (this.attacking || this.force)) {
        await this.castPrimary(s, skill, target);
        return;
      }
      if (this.force) {
        if (this.b.ready("actionReadyIn") === 0 && this.b.ready("attackReadyIn") === 0)
          await this.send("Attack", {
            Force: true,
            Direction: directions[m.dir],
            Spell: this.b.melee(),
          });
        return;
      }
      if (this.joystick !== null) {
        const wait = this.b.ready("actionReadyIn");
        if (wait > 0) {
          this.wake(wait);
          return;
        }
        const start = { ...m },
          dir = this.joystick;
        const epoch = this.epoch;
        await this.send(this.run ? "Run" : "Walk", { Direction: directions[dir] });
        if (
          this.run &&
          epoch === this.epoch &&
          distance(start, this.b.state().me) === 0 &&
          this.b.ready("actionReadyIn") === 0 &&
          this.joystick === dir
        )
          await this.send("Walk", { Direction: directions[dir] });
        if (epoch === this.epoch && this.joystick !== null) {
          const moved = distance(start, this.b.state().me);
          if (!moved && this.b.ready("actionReadyIn") > 0)
            this.wake(Math.max(20, this.b.ready("actionReadyIn")));
          else if (!moved) this.retryAt = this.b.now() + 120;
          else this.wake(this.b.ready("actionReadyIn"));
        }
        return;
      }
      if (!this.path.length && a && distance(m, a) > (a.kind === "npc" ? 3 : 0))
        this.routeNear(a, a.kind === "npc" ? 3 : 0);
      if (!this.path.length && target && distance(m, target) > 1) this.routeNear(target, 1);
      if (!this.path.length && this.journey) await this.travelStep();
      if (!this.path.length && this.mapGoal) {
        this.path = this.b.path({ x: this.mapGoal.x, y: this.mapGoal.y }) || [];
        if (!this.path.length) {
          this.retryMapGoal();
          return;
        }
      }
      if (this.path.length) {
        const wait = this.b.ready("actionReadyIn");
        if (wait > 0) {
          this.wake(wait);
          return;
        }
        const route = this.path,
          epoch = this.epoch,
          dest = route[0];
        if (distance(m, dest) !== 1) {
          if (this.mapGoal) this.retryMapGoal();
          else this.path = this.b.path(route.at(-1)) || [];
          return;
        }
        const dir = this.b.direction(dest.x - m.x, dest.y - m.y),
          canRun =
            this.run &&
            route.length > 1 &&
            this.b.direction(route[1].x - dest.x, route[1].y - dest.y) === dir,
          start = { ...m };
        await this.send(canRun ? "Run" : "Walk", { Direction: directions[dir] });
        if (epoch !== this.epoch) return;
        if (
          canRun &&
          distance(start, this.b.state().me) === 0 &&
          this.b.ready("actionReadyIn") === 0
        )
          await this.send("Walk", { Direction: directions[dir] });
        if (epoch !== this.epoch) return;
        const moved = distance(start, this.b.state().me);
        if (!moved && this.b.ready("actionReadyIn") > 0) {
          this.wake(Math.max(20, this.b.ready("actionReadyIn")));
          return;
        }
        if (moved) {
          this.path.splice(0, moved);
          if (this.mapGoal) {
            this.mapGoal.failures = 0;
            if (distance(this.b.state().me, this.mapGoal) === 0) this.mapGoal = null;
          }
        } else if (this.mapGoal) this.retryMapGoal();
        else {
          this.path = [];
          this.retryAt = this.b.now() + 300;
        }
        return;
      }
      if (a && distance(m, a) <= (a.kind === "npc" ? 3 : 0)) {
        this.interaction = 0;
        if (a.kind === "npc") {
          this.b.npc(a.id);
          await this.send("CallNPC", { ObjectID: a.id, Key: "[@main]" });
        } else await this.send("PickUp", this.b.pickupData?.(a) || {});
        return;
      }
      await this.attackInReach(m, target);
    } finally {
      this.busy = false;
    }
  }
};

// singleplayer/mobile/command-gate.js
var MobileCommandGate = class {
  constructor({ allowed, stamp }) {
    this.allowed = allowed;
    this.stamp = stamp;
    this.pending = null;
    this.queued = false;
  }
  async execute(type, data, dispatch, automatic = false) {
    if (!this.allowed(type)) return false;
    if (this.pending) {
      if (automatic || this.queued) return false;
      this.queued = true;
      const stamp = this.stamp();
      try {
        await this.pending;
      } catch {
      } finally {
        this.queued = false;
      }
      if (stamp !== this.stamp() || !this.allowed(type) || this.pending) return false;
    }
    const request = Promise.resolve().then(dispatch);
    this.pending = request;
    try {
      return await request;
    } finally {
      if (this.pending === request) this.pending = null;
    }
  }
};

// singleplayer/mobile/touch-click-guard.js
var guards = /* @__PURE__ */ new WeakMap();
function touchClickGuard(element, now = () => performance.now()) {
  const doc = element.ownerDocument;
  if (!doc) return () => {};
  let guard = guards.get(doc);
  if (guard) return guard;
  let suppressUntil = 0,
    lastRelease = null;
  const consumed = /* @__PURE__ */ new Map(),
    activeTouches = /* @__PURE__ */ new Set();
  const pointerId = (e) => (Number.isFinite(e.pointerId) && e.pointerId >= 0 ? e.pointerId : null);
  const prune = () => {
    for (const [id, until] of consumed) if (now() >= until) consumed.delete(id);
  };
  doc.addEventListener(
    "pointerdown",
    (e) => {
      suppressUntil = 0;
      prune();
      const id = pointerId(e);
      if (id !== null) consumed.delete(id);
      if (e.pointerType === "touch") activeTouches.add(id);
      else lastRelease = null;
    },
    true,
  );
  const released = (e) => {
    activeTouches.delete(pointerId(e));
    suppressUntil = 0;
    lastRelease = null;
  };
  doc.addEventListener("pointerup", released, true);
  doc.addEventListener("pointercancel", released, true);
  const blockCompatibilityClick = (e) => {
    if (!(e.detail > 0 || e.pointerType === "touch")) return;
    prune();
    const id = pointerId(e);
    const until =
      e.pointerType === "touch" && id !== null
        ? consumed.get(id) || 0
        : Math.max(suppressUntil, activeTouches.size ? lastRelease?.until || 0 : 0);
    if (now() < until) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  };
  doc.addEventListener("click", blockCompatibilityClick, true);
  doc.addEventListener("dblclick", blockCompatibilityClick, true);
  guard = (e) => {
    suppressUntil = now() + 750;
    const id = pointerId(e);
    if (id !== null) consumed.set(id, suppressUntil);
    lastRelease = { until: suppressUntil };
  };
  guards.set(doc, guard);
  return guard;
}

// singleplayer/mobile/touch-button.js
function bindTouchActivation(el, action, now = () => performance.now()) {
  let press = null,
    suppressClickUntil = 0;
  const suppressDocumentClick = touchClickGuard(el, now);
  el.addEventListener("pointerdown", (e) => {
    suppressClickUntil = 0;
    if (e.pointerType === "touch" && press === null && !el.disabled)
      press = { id: e.pointerId, x: e.clientX, y: e.clientY };
  });
  el.addEventListener("pointerup", (e) => {
    if (e.pointerId !== press?.id) return;
    const start = press;
    press = null;
    suppressClickUntil = now() + 750;
    suppressDocumentClick(e);
    e.preventDefault();
    const r = el.getBoundingClientRect();
    if (
      !el.disabled &&
      Math.hypot(e.clientX - start.x, e.clientY - start.y) <= 14 &&
      e.clientX >= r.left &&
      e.clientX <= r.right &&
      e.clientY >= r.top &&
      e.clientY <= r.bottom
    )
      action(e);
  });
  el.addEventListener("pointercancel", (e) => {
    if (e.pointerId === press?.id) {
      press = null;
      suppressClickUntil = now() + 750;
      suppressDocumentClick(e);
    }
  });
  el.onclick = (e) => {
    if (now() < suppressClickUntil && (e.detail > 0 || e.pointerType === "touch")) {
      e.preventDefault();
      return;
    }
    if (!el.disabled) action(e);
  };
}

// singleplayer/mobile/tap-sequence.js
var TapSequence = class {
  constructor(now = () => performance.now()) {
    this.now = now;
    this.last = null;
  }
  reset() {
    this.last = null;
  }
  tap(key, x, y) {
    const now = this.now(),
      last = this.last;
    if (
      last &&
      last.key === key &&
      now - last.at <= 340 &&
      Math.hypot(x - last.x, y - last.y) <= 22
    ) {
      this.last = null;
      return "double";
    }
    this.last = { key, x, y, at: now };
    return "single";
  }
};
function bindPanelTaps(root, resolve, activate, now = () => performance.now()) {
  let press = null,
    suppressUntil = 0;
  const sequence = new TapSequence(now),
    suppressDocumentClick = touchClickGuard(root, now);
  root.addEventListener(
    "pointerdown",
    (e) => {
      suppressUntil = 0;
      if (e.pointerType !== "touch") return;
      const item = resolve(e.target);
      if (item) press = { id: e.pointerId, x: e.clientX, y: e.clientY, key: item.key };
    },
    true,
  );
  root.addEventListener(
    "pointerup",
    (e) => {
      if (e.pointerId !== press?.id) return;
      const start = press;
      press = null;
      suppressUntil = now() + 750;
      suppressDocumentClick(e);
      const item = resolve(e.target);
      e.preventDefault();
      e.stopImmediatePropagation();
      if (item?.key === start.key && Math.hypot(e.clientX - start.x, e.clientY - start.y) <= 14)
        activate(item, sequence.tap(item.key, e.clientX, e.clientY), e);
      else sequence.reset();
    },
    true,
  );
  root.addEventListener(
    "pointercancel",
    (e) => {
      if (e.pointerId === press?.id) {
        press = null;
        sequence.reset();
        suppressUntil = now() + 750;
        suppressDocumentClick(e);
      }
    },
    true,
  );
  root.addEventListener(
    "click",
    (e) => {
      const item = resolve(e.target);
      if (!item) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (now() < suppressUntil && e.detail !== 0) return;
      activate(item, sequence.tap(item.key, e.clientX, e.clientY), e);
    },
    true,
  );
  root.addEventListener(
    "dblclick",
    (e) => {
      if (resolve(e.target)) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    },
    true,
  );
  return sequence;
}

// singleplayer/mobile/strings.js

var text2 = {
  "zh-CN": {
    "compare": "对比身上",
    "compareBack": "返回详情",
    "compareSlot": "对比部位",
    "compareSelected": "选中装备",
    "compareWorn": "身上装备",
    "compareEmpty": "此位置未穿戴装备。",
    "healPet": "已选中召唤物，点击治愈术治疗。",
    "forgeHint": "点击装备或材料格选择物品，查看结果和费用。",
    "sellHint": "点击背包物品，选择出售。",
    "repairHint": "点击背包物品，选择修理。",
    "force": "原地攻击",
    "attack": "攻击",
    "stop": "停止",
    "target": "切目标",
    "pickup": "拾取",
    "menu": "菜单",
    "bag": "背包",
    "skills": "技能",
    "items": "道具",
    "character": "人物",
    "quests": "任务",
    "map": "地图",
    "forge": "锻造",
    "workshop": "暗金工坊",
    "assist": "辅助",
    "system": "系统",
    "close": "关闭",
    "back": "返回",
    "cancel": "取消",
    "confirm": "确认",
    "use": "使用 / 装备",
    "remove": "卸下",
    "store": "存入",
    "withdraw": "取出",
    "sell": "出售",
    "repair": "修理",
    "bind": "绑定快捷栏",
    "clear": "清除绑定",
    "split": "拆分",
    "move": "移动位置",
    "drop": "丢弃",
    "dropConfirm": "确认丢弃此物品？",
    "quantity": "数量",
    "chooseSlot": "选择快捷栏位置",
    "chooseItem": "选择物品",
    "chooseDestination": "点击背包目标格",
    "empty": "空",
    "selectTarget": "附近没有可锁定的怪物。",
    "blocked": "此处无法到达。",
    "passive": "此技能为被动技能。",
    "unsupportedSkill": "此技能暂不能主动施放。",
    "aim": "点击场景中的位置施放；取消可退出瞄准。",
    "cooldown": "技能尚未冷却。",
    "mana": "魔法不足。",
    "resume": "继续游戏",
    "paused": "游戏已暂停",
    "rotate": "请横屏后继续战斗。竖屏可创建角色和管理存档。",
    "resumeHint": "已停止移动与攻击，点击继续后恢复。",
    "pauseError": "暂停状态同步失败，请重试。",
    "tapHint": "左手摇杆移动；默认锁定近处怪物，点击怪物可切换。",
    "panelHint": "打开面板会停止操作，世界仍在运行。",
    "switchDesktop": "切换为 PC 操作",
    "fullscreen": "全屏",
    "fullscreenUnavailable": "当前浏览器不支持全屏，请使用横屏。",
    "run": "跑",
    "walk": "走",
    "purchase": "购买",
    "buy10": "购买 ×10",
    "buy100": "购买 100 个",
    "details": "详情",
    "loadError": "移动操作加载失败，请联网刷新。",
    "saveFirst": "保存成功后将重新载入。",
    "confirmClear": "清空此格",
    "active": "攻击中",
    "pet": "宠物",
    "rest": "休息",
    "recall": "召回",
    "dismiss": "解散",
    "petTarget": "攻击目标",
    "mount": "坐骑",
    "saved": "已保存",
    "startLandscape": "角色已保留，请横屏后点击进入。",
    "startForeground": "游戏窗口还没激活：轻点一下屏幕，再点“进入游戏”。"
  },
  "en": {
    "compare": "Compare worn",
    "compareBack": "Item details",
    "compareSlot": "Comparison slot",
    "compareSelected": "Selected item",
    "compareWorn": "Worn item",
    "compareEmpty": "Nothing is worn in this slot.",
    "healPet": "Summon selected. Tap Healing to heal it.",
    "forgeHint": "Tap an equipment or material slot to choose an item and see its result and cost.",
    "sellHint": "Tap an item in your bag, then Sell.",
    "repairHint": "Tap an item in your bag, then Repair.",
    "force": "Attack in place",
    "attack": "Attack",
    "stop": "Stop",
    "target": "Target",
    "pickup": "Pick up",
    "menu": "Menu",
    "bag": "Bag",
    "skills": "Skills",
    "items": "Items",
    "character": "Character",
    "quests": "Quests",
    "map": "Map",
    "forge": "Forge",
    "workshop": "Darkforged Workshop",
    "assist": "Assist",
    "system": "System",
    "close": "Close",
    "back": "Back",
    "cancel": "Cancel",
    "confirm": "Confirm",
    "use": "Use / Equip",
    "remove": "Unequip",
    "store": "Store",
    "withdraw": "Withdraw",
    "sell": "Sell",
    "repair": "Repair",
    "bind": "Bind shortcut",
    "clear": "Clear binding",
    "split": "Split",
    "move": "Move slot",
    "drop": "Drop",
    "dropConfirm": "Drop this item?",
    "quantity": "Quantity",
    "chooseSlot": "Choose a shortcut slot",
    "chooseItem": "Choose an item",
    "chooseDestination": "Tap the destination in your bag",
    "empty": "Empty",
    "selectTarget": "No nearby monster to target.",
    "blocked": "Cannot reach this position.",
    "passive": "This is a passive skill.",
    "unsupportedSkill": "This skill cannot be cast actively.",
    "aim": "Tap a world position to cast, or cancel aiming.",
    "cooldown": "Skill is cooling down.",
    "mana": "Not enough MP.",
    "resume": "Resume",
    "paused": "Game paused",
    "rotate": "Rotate to landscape to fight. Create characters and manage saves in portrait.",
    "resumeHint": "Movement and attacks stopped. Tap Resume to continue.",
    "pauseError": "Could not synchronize pause. Please retry.",
    "tapHint": "Move with the left stick. A nearby monster is targeted; tap another to switch.",
    "panelHint": "Controls stop while panels are open. The world keeps running.",
    "switchDesktop": "Switch to PC controls",
    "fullscreen": "Fullscreen",
    "fullscreenUnavailable": "Fullscreen is unavailable. Use landscape orientation.",
    "run": "Run",
    "walk": "Walk",
    "purchase": "Buy",
    "buy10": "Buy ×10",
    "buy100": "Buy 100",
    "details": "Details",
    "loadError": "Mobile controls could not load. Reconnect and refresh.",
    "saveFirst": "The page reloads after saving.",
    "confirmClear": "Clear this slot",
    "active": "Attacking",
    "pet": "Pets",
    "rest": "Rest",
    "recall": "Recall",
    "dismiss": "Dismiss",
    "petTarget": "Attack target",
    "mount": "Mount",
    "saved": "Saved",
    "startLandscape": "Character saved. Rotate to landscape, then Enter.",
    "startForeground": "The game window is not active yet. Tap the screen once, then tap Enter."
  },
  "es": {
    "compare": "Comparar equipo",
    "compareBack": "Ver objeto",
    "compareSlot": "Casilla a comparar",
    "compareSelected": "Objeto elegido",
    "compareWorn": "Equipo actual",
    "compareEmpty": "No hay equipo en esta casilla.",
    "healPet": "Invocación seleccionada. Toca Curación para curarla.",
    "forgeHint": "Toca una casilla de equipo o material para elegir un objeto y ver el resultado y el coste.",
    "sellHint": "Toca un objeto de la mochila y Vender.",
    "repairHint": "Toca un objeto de la mochila y Reparar.",
    "force": "Atacar sin moverse",
    "attack": "Atacar",
    "stop": "Parar",
    "target": "Objetivo",
    "pickup": "Recoger",
    "menu": "Menú",
    "bag": "Mochila",
    "skills": "Habilidades",
    "items": "Objetos",
    "character": "Personaje",
    "quests": "Misiones",
    "map": "Mapa",
    "forge": "Forja",
    "workshop": "Taller de Forjanegra",
    "assist": "Asistencia",
    "system": "Sistema",
    "close": "Cerrar",
    "back": "Volver",
    "cancel": "Cancelar",
    "confirm": "Confirmar",
    "use": "Usar / Equipar",
    "remove": "Desequipar",
    "store": "Guardar",
    "withdraw": "Retirar",
    "sell": "Vender",
    "repair": "Reparar",
    "bind": "Asignar acceso",
    "clear": "Quitar asignación",
    "split": "Dividir",
    "move": "Mover casilla",
    "drop": "Soltar",
    "dropConfirm": "¿Soltar este objeto?",
    "quantity": "Cantidad",
    "chooseSlot": "Elige una casilla de acceso",
    "chooseItem": "Elige un objeto",
    "chooseDestination": "Toca la casilla de destino en la mochila",
    "empty": "Vacía",
    "selectTarget": "No hay monstruos cercanos para seleccionar.",
    "blocked": "No se puede llegar a ese lugar.",
    "passive": "Esta habilidad es pasiva.",
    "unsupportedSkill": "Esta habilidad no se puede lanzar activamente.",
    "aim": "Toca una posición para lanzar o cancela.",
    "cooldown": "La habilidad se está recargando.",
    "mana": "No hay suficiente PM.",
    "resume": "Continuar",
    "paused": "Juego en pausa",
    "rotate": "Gira la pantalla para combatir. En vertical puedes crear personajes y gestionar partidas.",
    "resumeHint": "Movimiento y ataques detenidos. Pulsa Continuar.",
    "pauseError": "No se pudo sincronizar la pausa. Inténtalo de nuevo.",
    "tapHint": "Muévete con el control izquierdo. Se elige un monstruo cercano; toca otro para cambiar.",
    "panelHint": "Los controles se detienen con paneles abiertos. El mundo sigue activo.",
    "switchDesktop": "Cambiar a controles de PC",
    "fullscreen": "Pantalla completa",
    "fullscreenUnavailable": "Pantalla completa no disponible. Usa orientación horizontal.",
    "run": "Correr",
    "walk": "Caminar",
    "purchase": "Comprar",
    "buy10": "Comprar ×10",
    "buy100": "Comprar 100",
    "details": "Detalles",
    "loadError": "No se pudieron cargar los controles. Conéctate y recarga.",
    "saveFirst": "La página se recargará después de guardar.",
    "confirmClear": "Vaciar esta casilla",
    "active": "Atacando",
    "pet": "Mascotas",
    "rest": "Descansar",
    "recall": "Llamar",
    "dismiss": "Liberar",
    "petTarget": "Atacar objetivo",
    "mount": "Montura",
    "saved": "Guardado",
    "startLandscape": "Personaje guardado. Gira la pantalla y pulsa Entrar.",
    "startForeground": "La ventana del juego aún no está activa. Toca la pantalla una vez y pulsa Entrar."
  }
}
;


var mobileText = (locale, key) => (text2[locale] || text2.en)[key] || text2.en[key] || key;
var novice = {
  "zh-CN": {
    "novice.controls":
      "\u5DE6\u4FA7\u6447\u6746\u79FB\u52A8 \xB7 \u653B\u51FB\u952E\u6218\u6597 \xB7 \u62FE\u53D6\u952E\u6361\u4E1C\u897F \xB7 \u80CC\u5305\u548C\u4EFB\u52A1\u5728\u201C\u83DC\u5355\u201D\u91CC",
    "novice.unlock":
      "\u51FB\u8D255\u53EA\u9E21\u540E\u4EA4\u4ED8\u521D\u8BD5\u8EAB\u624B\uFF0C\u83B7\u5F97\u672C\u804C\u4E1A\u5165\u95E8\u6280\u80FD\u4E66\u548C\u7EA2\u84DD\u836F\u3002\u6253\u5F00\u80CC\u5305\uFF0C\u70B9\u6280\u80FD\u4E66\uFF0C\u518D\u70B9\u201C\u4F7F\u7528\u201D\u5B66\u4E60\u3002",
    "novice.skill":
      "\u5DF2\u5B66\u4F1A{{skill}}\uFF1A\u70B9\u53F3\u4E0B\u89D2\u7684\u6280\u80FD\u952E\u65BD\u653E\u3002\u8840\u84DD\u4E0D\u8DB3\u65F6\u70B9\u836F\u74F6\u559D\u836F\u3002",
    "novice.blessing":
      "\u6BDB\u6BDB\u7684\u795D\u798F\u5DF2\u653E\u5165\u80CC\u5305\uFF1A\u6253\u5F00\u80CC\u5305\u70B9\u5B83\uFF0C\u518D\u70B9\u201C\u4F7F\u7528\u201D\u88C5\u5907\uFF0C\u83B7\u5F97\u52A0\u6210\u3002",
    "novice.bookReady":
      "\u6280\u80FD\u4E66\u5DF2\u653E\u5165\u80CC\u5305\uFF1A\u6253\u5F00\u80CC\u5305\uFF0C\u70B9\u6280\u80FD\u4E66\uFF0C\u518D\u70B9\u201C\u4F7F\u7528\u201D\u5B66\u4E60\u3002",
    "novice.quest.201":
      "\u70B9\u653B\u51FB\u952E\u4F1A\u81EA\u52A8\u6253\u6700\u8FD1\u7684\u602A\uFF1B\u51FB\u8D255\u53EA\u9E21\u540E\uFF0C\u6309\u63D0\u793A\u56DE\u6765\u4EA4\u4ED8\u3002",
    "novice.quest.203":
      "\u730E\u9E7F\u540E\u8BB0\u5F97\u62FE\u53D6\u9E7F\u8089\uFF1A\u9760\u8FD1\u6389\u843D\u70B9\u201C\u62FE\u53D6\u201D\uFF0C\u6216\u76F4\u63A5\u70B9\u5730\u4E0A\u7684\u7269\u54C1\u3002\u9700\u89815\u4EFD\u3002",
    "novice.quest.208":
      "\u51FB\u8D25\u534A\u517D\u6218\u58EB\u540E\u70B9\u201C\u62FE\u53D6\u201D\u6361\u9F99\u9633\u8349\uFF0C\u4EA4\u7ED9\u5C0F\u8D29\u53EF\u83B7\u5F971\u5F20\u56DE\u57CE\u5377\uFF0C\u7559\u7740\u53E4\u5893\u56DE\u7A0B\u7528\u3002",
    "novice.returnReady":
      "\u80CC\u5305\u4E2D\u6709\u56DE\u57CE\u5377\u3002\u6536\u9F50\u874E\u5C3E\u540E\u53EF\u76F4\u63A5\u4F7F\u7528\uFF0C\u4E5F\u53EF\u5728\u80CC\u5305\u91CC\u70B9\u5B83\u518D\u70B9\u201C\u4F7F\u7528\u201D\uFF1B\u5B83\u8FD4\u56DE\u9A7B\u7559\u57CE\u9547\u3002",
  },
  en: {
    "novice.controls":
      "Left stick to move \xB7 Attack to fight \xB7 Pick up for loot \xB7 Bag and quests are in Menu",
    "novice.unlock":
      "Turn in First Steps after defeating 5 Hens to receive your first class skill book and potions. Open your bag, tap the book, then tap Use to learn it.",
    "novice.skill":
      "Learned {{skill}}: tap its skill button at the bottom right. Tap a potion when health or mana is low.",
    "novice.blessing":
      "Maomao\u2019s Blessing is in your bag. Open the bag, tap it, then tap Use to equip it and activate its bonuses.",
    "novice.bookReady":
      "Your skill book is in the bag. Open the bag, tap the book, then tap Use to learn it.",
    "novice.quest.201":
      "Attack fights the nearest monster. Defeat 5 chickens, then follow the prompt back to turn in the quest.",
    "novice.quest.203":
      "Pick up the venison after hunting deer: move near the drop and tap Pick up, or tap the item. You need 5 pieces.",
    "novice.quest.208":
      "Defeat Omas and tap Pick up for the Longyang Grass. Turn it in to the Peddler for a Town Scroll; keep it for your return from the tomb.",
    "novice.returnReady":
      "You have a Town Scroll. Use it once you have the tail, or tap it in the bag and tap Use. It returns you to your home town.",
  },
  es: {
    "novice.controls":
      "Joystick izquierdo para moverte \xB7 Atacar para luchar \xB7 Recoger para el bot\xEDn \xB7 Mochila y misiones en el Men\xFA",
    "novice.unlock":
      "Entrega Primeros pasos tras derrotar a 5 gallinas para recibir tu primer libro de habilidad y pociones. Abre la mochila, toca el libro y luego Usar para aprender.",
    "novice.skill":
      "Has aprendido {{skill}}: toca su bot\xF3n de habilidad abajo a la derecha. Toca una poci\xF3n si te falta salud o man\xE1.",
    "novice.blessing":
      "La bendici\xF3n de Maomao est\xE1 en tu mochila. Abre la mochila, t\xF3cala y pulsa Usar para equiparla y activar sus bonificaciones.",
    "novice.bookReady":
      "El libro est\xE1 en la mochila. Abre la mochila, toca el libro y pulsa Usar para aprender.",
    "novice.quest.201":
      "Atacar lucha contra el monstruo m\xE1s cercano. Derrota a 5 gallinas y sigue la indicaci\xF3n para entregar la misi\xF3n.",
    "novice.quest.203":
      "Recoge la carne despu\xE9s de cazar ciervos: ac\xE9rcate y pulsa Recoger, o toca el objeto. Necesitas 5 piezas.",
    "novice.quest.208":
      "Derrota a los Oma y pulsa Recoger para la hierba Longyang. Entr\xE9gasela al vendedor ambulante para recibir un pergamino de regreso; gu\xE1rdalo para volver de la tumba.",
    "novice.returnReady":
      "Tienes un pergamino de regreso. \xDAsalo al tener la cola, o t\xF3calo en la mochila y pulsa Usar. Volver\xE1s a la localidad donde resides.",
  },
};
var tombInstructions = {
  "zh-CN":
    "\u4ECE\u65B0\u624B\u6751\u6216\u6BD4\u5947\u9A7F\u7AD9\u4F20\u9001\u5230\u53E4\u5893\u5165\u53E3\u9644\u8FD1\uFF0C\u518D\u8FDB\u5165\u53E4\u5893\u4E00\u5C42\u3002\u51FB\u8D25\u874E\u5B50\uFF0C\u62FE\u53D6\u874E\u5C3E\u540E\u4EA4\u7ED9\u5C0F\u8D29\u3002\u6253\u5F00\u80CC\u5305\uFF0C\u70B9\u56DE\u57CE\u5377\uFF0C\u518D\u70B9\u201C\u4F7F\u7528\u201D\u8FD4\u56DE\u9A7B\u7559\u57CE\u9547\u540E\u5BFB\u627E\u5C0F\u8D29\uFF1B\u6751\u5E84\u836F\u5E97\u53EF\u8D2D\u4E70\u66F4\u591A\u56DE\u57CE\u5377\u3002",
  en: "Use the village or Bichon station to reach the tomb entrance, then enter Floor 1. Defeat a scorpion, pick up its tail and bring it to the Peddler. Open your bag, tap a Town Scroll, then tap Use to return to your home town and visit the Peddler. More scrolls are sold at the village potion shop.",
  es: "Usa la estaci\xF3n de la aldea o de Bichon para llegar a la entrada de la tumba y entra al primer piso. Derrota a un escorpi\xF3n, recoge su cola y ll\xE9vasela al vendedor. Abre la mochila, toca un pergamino de regreso y pulsa Usar para volver a tu localidad y buscar al vendedor. Puedes comprar m\xE1s en la tienda de pociones de la aldea.",
};
var mobileNovice = (locale, key, params = {}) => {
  const pack = novice[locale] || novice.en;
  const v =
    key === "quest.201.description" || key === "quest.201.objective"
      ? pack["novice.unlock"]
      : key === "quest.207.description"
        ? tombInstructions[locale] || tombInstructions.en
        : pack[key];
  return v === void 0 ? void 0 : v.replace(/\{\{(\w+)\}\}/g, (_, k) => params[k] ?? "");
};

// singleplayer/mobile/v2/text.js

var text3 = {
  "zh-CN": {
    "shortcutSettings": "快捷栏设置",
    "quickItems": "物品 · 6槽",
    "quickSkills": "技能 · 8槽",
    "currentBinding": "当前绑定",
    "unbound": "未绑定",
    "outOfStock": "暂无库存",
    "quantityCount": "库存 ×{{n}}",
    "clearBinding": "清空此槽",
    "replaceItemHint": "点下方物品替换此槽；战斗中请用固定设置按钮编辑。左右滑动可查看全部6槽。",
    "replaceSkillHint": "点下方技能绑定此键。第1页为1–4，第2页为5–8；战斗中单击已绑定技能照常施法。",
    "noQuickItems": "背包中没有可快捷绑定的物品。支持药品、卷轴、技能书、扩包券和藏宝图；材料与装备不能绑定。",
    "noQuickSkills": "尚未学会可主动使用的技能。被动或暂不可施放的技能不占快捷键。",
    "quickBarHint": "物品快捷栏 · 左右滑动查看6槽 · 设置按钮编辑",
    "chooseSkill": "选择技能",
    "chooseSlotHint": "选择目标槽，再点“确认绑定”：{{name}}",
    "assignSelected": "确认绑定",
    "itemCannotBind": "此物品不能绑定快捷栏；材料与装备请在原版背包中使用。",
    "skillCannotBind": "被动或暂不可施放的技能不能放到战斗快捷键。",
    "bindingChanged": "物品或技能已变化，请重新选择。",
    "roleShort": "角色",
    "menuShort": "菜单",
    "holdForce": "按住原地",
    "switchTarget": "换目标",
    "pageLabel": "技能页",
    "tabRole": "角色",
    "tabBag": "背包",
    "tabSkills": "技能",
    "tabQuests": "任务",
    "tabMap": "地图",
    "all": "全部",
    "equipment": "装备",
    "potion": "药品",
    "material": "材料",
    "quest": "任务",
    "sort": "整理",
    "equip": "装备",
    "useItem": "使用",
    "learn": "学习",
    "open": "打开",
    "compare": "对比身上",
    "quick": "快捷栏",
    "more": "更多",
    "compareTitle": "对比",
    "wearing": "身上",
    "inBag": "背包中",
    "equipReplace": "装备（替换身上）",
    "chooseSide": "对比哪一边",
    "left": "左",
    "right": "右",
    "nothingWorn": "这个位置目前没有装备。",
    "unequip": "卸下",
    "toggleMount": "上马 / 下马",
    "fullPanel": "完整面板",
    "keyStats": "主要属性",
    "allStats": "全部属性",
    "noItem": "点一个物品查看详情。",
    "noSkill": "点一个技能查看说明。",
    "assignTo": "放到哪个技能键：点一个位置",
    "page1": "第1页",
    "page2": "第2页",
    "onKey": "在{{key}}号键",
    "notPlaced": "未放置",
    "passiveTag": "被动",
    "takeOff": "取下",
    "skillType_toggle": "开关",
    "skillType_armed": "开关",
    "skillType_target": "目标",
    "skillType_ground": "地面",
    "skillType_direction": "方向",
    "skillType_self": "自身",
    "skillType_pet": "宠物",
    "skillType_passive": "被动",
    "skillType_unavailable": "不可用",
    "cancelAim": "拖回这里取消",
    "buyCount": "购买 {{n}} 个",
    "total": "合计 {{gold}} 金币",
    "max": "最多",
    "price": "单价",
    "primaryAttack": "主攻击键",
    "normalAttack": "普通攻击",
    "settings": "操作设置",
    "hand": "左右手",
    "handRight": "右手攻击",
    "handLeft": "左手攻击",
    "size": "按钮大小",
    "small": "小",
    "medium": "中",
    "large": "大",
    "opacity": "界面透明度",
    "turn": "竖握时画面方向",
    "turnRight": "顶部朝右",
    "turnLeft": "顶部朝左",
    "vibrate": "受击震动",
    "on": "开",
    "off": "关",
    "uiVersion": "界面版本",
    "uiNew": "使用新版界面",
    "uiOld": "旧版",
    "uiOldSwitch": "切换到旧版界面",
    "switchPC": "切换为电脑操作",
    "fullscreen": "全屏",
    "leaderboard": "排行榜",
    "activity": "活动",
    "pet": "宠物",
    "mount": "坐骑",
    "forge": "锻造",
    "assist": "辅助",
    "system": "存档与系统",
    "saves": "存档 / 云存档",
    "bagUsed": "{{used}}/{{total}}",
    "goldLabel": "{{gold}} 金币",
    "fullscreenHint": "点这里回到全屏横屏",
    "shopHint": "点一个商品查看详情和购买。",
    "chooseQuick": "选择放到 {{n}} 号快捷栏的物品",
    "rotateNotice": "画面已横向显示：把手机横过来即可。",
    "holdForceTip": "按住攻击键可原地攻击，不追击。",
    "showTips": "提示 ▾",
    "hideTips": "收起提示 ▴",
    "setAfter": "装备后：{{name}} {{count}}/{{total}}",
    "setOn": "{{n}}件效果将激活",
    "setOff": "{{n}}件效果将失去"
  },
  "en": {
    "shortcutSettings": "Shortcut settings",
    "quickItems": "Items · 6 slots",
    "quickSkills": "Skills · 8 slots",
    "currentBinding": "Current binding",
    "unbound": "Unbound",
    "outOfStock": "Out of stock",
    "quantityCount": "In bag ×{{n}}",
    "clearBinding": "Clear slot",
    "replaceItemHint": "Tap an item below to replace this slot. Use the settings button to edit; swipe the battle item bar for all 6 slots.",
    "replaceSkillHint": "Tap a skill below to assign it. Page 1 has keys 1–4; page 2 has 5–8. Tapping a bound battle skill still casts it.",
    "noQuickItems": "No bindable items in your bag. Potions, scrolls, skill books, bag expansions and treasure maps are supported; materials and gear are not.",
    "noQuickSkills": "No active skills learned yet. Passive and currently unsupported skills do not occupy battle keys.",
    "quickBarHint": "Items · Swipe for 6 slots · Settings to edit",
    "chooseSkill": "Choose skill",
    "chooseSlotHint": "Select a destination, then Confirm binding: {{name}}",
    "assignSelected": "Confirm binding",
    "itemCannotBind": "This item cannot be bound. Manage materials and gear in the original bag.",
    "skillCannotBind": "Passive and unsupported skills cannot be placed on battle keys.",
    "bindingChanged": "The item or skill changed. Please choose again.",
    "roleShort": "Hero",
    "menuShort": "Menu",
    "holdForce": "Hold: in place",
    "switchTarget": "Target",
    "pageLabel": "Skill page",
    "tabRole": "Character",
    "tabBag": "Bag",
    "tabSkills": "Skills",
    "tabQuests": "Quests",
    "tabMap": "Map",
    "all": "All",
    "equipment": "Gear",
    "potion": "Potions",
    "material": "Materials",
    "quest": "Quest",
    "sort": "Sort",
    "equip": "Equip",
    "useItem": "Use",
    "learn": "Learn",
    "open": "Open",
    "compare": "Compare",
    "quick": "Quick slot",
    "more": "More",
    "compareTitle": "Compare",
    "wearing": "Wearing",
    "inBag": "In bag",
    "equipReplace": "Equip (replace)",
    "chooseSide": "Compare with",
    "left": "Left",
    "right": "Right",
    "nothingWorn": "Nothing is equipped in this slot.",
    "unequip": "Unequip",
    "toggleMount": "Mount / Dismount",
    "fullPanel": "Full panel",
    "keyStats": "Key stats",
    "allStats": "All stats",
    "noItem": "Tap an item to see its details.",
    "noSkill": "Tap a skill to see what it does.",
    "assignTo": "Tap a button position for this skill",
    "page1": "Page 1",
    "page2": "Page 2",
    "onKey": "On button {{key}}",
    "notPlaced": "Not placed",
    "passiveTag": "Passive",
    "takeOff": "Remove",
    "skillType_toggle": "On/off",
    "skillType_armed": "On/off",
    "skillType_target": "Target",
    "skillType_ground": "Ground",
    "skillType_direction": "Direction",
    "skillType_self": "Self",
    "skillType_pet": "Pet",
    "skillType_passive": "Passive",
    "skillType_unavailable": "Unavailable",
    "cancelAim": "Drag back here to cancel",
    "buyCount": "Buy {{n}}",
    "total": "Total {{gold}} gold",
    "max": "Max",
    "price": "Price",
    "primaryAttack": "Main attack button",
    "normalAttack": "Basic attack",
    "settings": "Control settings",
    "hand": "Hands",
    "handRight": "Attack on the right",
    "handLeft": "Attack on the left",
    "size": "Button size",
    "small": "S",
    "medium": "M",
    "large": "L",
    "opacity": "HUD opacity",
    "turn": "When held upright",
    "turnRight": "Top to the right",
    "turnLeft": "Top to the left",
    "vibrate": "Vibrate when hit",
    "on": "On",
    "off": "Off",
    "uiVersion": "Interface",
    "uiNew": "Use new interface",
    "uiOld": "Classic mobile",
    "uiOldSwitch": "Use the previous mobile interface",
    "switchPC": "Switch to PC controls",
    "fullscreen": "Fullscreen",
    "leaderboard": "Ranking",
    "activity": "Events",
    "pet": "Pet",
    "mount": "Mount",
    "forge": "Forge",
    "assist": "Assist",
    "system": "Saves & system",
    "saves": "Saves / Cloud",
    "bagUsed": "{{used}}/{{total}}",
    "goldLabel": "{{gold}} gold",
    "fullscreenHint": "Tap to return to fullscreen landscape",
    "shopHint": "Tap an item to see details and buy.",
    "chooseQuick": "Choose an item for quick slot {{n}}",
    "rotateNotice": "The game is shown sideways: turn your phone.",
    "holdForceTip": "Hold the attack button to attack in place without chasing.",
    "showTips": "Hints ▾",
    "hideTips": "Hide hints ▴",
    "setAfter": "After equipping: {{name}} {{count}}/{{total}}",
    "setOn": "{{n}}-piece bonus switches on",
    "setOff": "{{n}}-piece bonus switches off"
  },
  "es": {
    "shortcutSettings": "Ajustar accesos rápidos",
    "quickItems": "Objetos · 6 casillas",
    "quickSkills": "Habilidades · 8 casillas",
    "currentBinding": "Vínculo actual",
    "unbound": "Sin asignar",
    "outOfStock": "Sin existencias",
    "quantityCount": "En mochila ×{{n}}",
    "clearBinding": "Vaciar casilla",
    "replaceItemHint": "Toca un objeto para reemplazar esta casilla. Usa el botón de ajustes para editar; desliza la barra de objetos para ver las 6 casillas.",
    "replaceSkillHint": "Toca una habilidad para asignarla. La página 1 usa 1–4 y la 2 usa 5–8. Tocar una habilidad asignada sigue lanzándola.",
    "noQuickItems": "No hay objetos compatibles. Se admiten pociones, pergaminos, libros, ampliaciones y mapas del tesoro; no materiales ni equipo.",
    "noQuickSkills": "Aún no conoces habilidades activas. Las pasivas o no disponibles no ocupan accesos de combate.",
    "quickBarHint": "Objetos · Desliza para ver 6 · Ajustes para editar",
    "chooseSkill": "Elegir habilidad",
    "chooseSlotHint": "Elige una casilla y confirma: {{name}}",
    "assignSelected": "Confirmar vínculo",
    "itemCannotBind": "Este objeto no puede asignarse. Gestiona materiales y equipo en la mochila original.",
    "skillCannotBind": "Las habilidades pasivas o no disponibles no se asignan a botones de combate.",
    "bindingChanged": "El objeto o habilidad cambió. Elige de nuevo.",
    "roleShort": "Héroe",
    "menuShort": "Menú",
    "holdForce": "Mantén: sin moverte",
    "switchTarget": "Objetivo",
    "pageLabel": "Página de habilidades",
    "tabRole": "Personaje",
    "tabBag": "Mochila",
    "tabSkills": "Habilidades",
    "tabQuests": "Misiones",
    "tabMap": "Mapa",
    "all": "Todo",
    "equipment": "Equipo",
    "potion": "Pociones",
    "material": "Materiales",
    "quest": "Misión",
    "sort": "Ordenar",
    "equip": "Equipar",
    "useItem": "Usar",
    "learn": "Aprender",
    "open": "Abrir",
    "compare": "Comparar",
    "quick": "Acceso rápido",
    "more": "Más",
    "compareTitle": "Comparar",
    "wearing": "Equipado",
    "inBag": "En la mochila",
    "equipReplace": "Equipar (reemplazar)",
    "chooseSide": "Comparar con",
    "left": "Izq.",
    "right": "Der.",
    "nothingWorn": "No hay nada equipado en esta ranura.",
    "unequip": "Quitar",
    "toggleMount": "Montar / Desmontar",
    "fullPanel": "Panel completo",
    "keyStats": "Atributos clave",
    "allStats": "Todos los atributos",
    "noItem": "Toca un objeto para ver sus detalles.",
    "noSkill": "Toca una habilidad para ver qué hace.",
    "assignTo": "Toca una posición para esta habilidad",
    "page1": "Página 1",
    "page2": "Página 2",
    "onKey": "En el botón {{key}}",
    "notPlaced": "Sin colocar",
    "passiveTag": "Pasiva",
    "takeOff": "Quitar",
    "skillType_toggle": "Activable",
    "skillType_armed": "Activable",
    "skillType_target": "Objetivo",
    "skillType_ground": "Suelo",
    "skillType_direction": "Dirección",
    "skillType_self": "Propia",
    "skillType_pet": "Mascota",
    "skillType_passive": "Pasiva",
    "skillType_unavailable": "No disponible",
    "cancelAim": "Arrastra aquí para cancelar",
    "buyCount": "Comprar {{n}}",
    "total": "Total {{gold}} oro",
    "max": "Máx.",
    "price": "Precio",
    "primaryAttack": "Botón de ataque principal",
    "normalAttack": "Ataque básico",
    "settings": "Controles",
    "hand": "Manos",
    "handRight": "Atacar a la derecha",
    "handLeft": "Atacar a la izquierda",
    "size": "Tamaño de botones",
    "small": "P",
    "medium": "M",
    "large": "G",
    "opacity": "Opacidad de la interfaz",
    "turn": "En vertical",
    "turnRight": "Arriba a la derecha",
    "turnLeft": "Arriba a la izquierda",
    "vibrate": "Vibrar al recibir golpes",
    "on": "Sí",
    "off": "No",
    "uiVersion": "Interfaz",
    "uiNew": "Usar la interfaz nueva",
    "uiOld": "Móvil anterior",
    "uiOldSwitch": "Usar la interfaz móvil anterior",
    "switchPC": "Cambiar a controles de PC",
    "fullscreen": "Pantalla completa",
    "leaderboard": "Clasificación",
    "activity": "Eventos",
    "pet": "Mascota",
    "mount": "Montura",
    "forge": "Forja",
    "assist": "Asistente",
    "system": "Partidas y sistema",
    "saves": "Partidas / Nube",
    "bagUsed": "{{used}}/{{total}}",
    "goldLabel": "{{gold}} oro",
    "fullscreenHint": "Toca para volver a pantalla completa",
    "shopHint": "Toca un artículo para ver detalles y comprar.",
    "chooseQuick": "Elige un objeto para el acceso rápido {{n}}",
    "rotateNotice": "El juego se muestra de lado: gira el teléfono.",
    "holdForceTip": "Mantén pulsado el botón de ataque para atacar sin moverte.",
    "showTips": "Consejos ▾",
    "hideTips": "Ocultar consejos ▴",
    "setAfter": "Al equipar: {{name}} {{count}}/{{total}}",
    "setOn": "se activa la bonificación de {{n}} piezas",
    "setOff": "se pierde la bonificación de {{n}} piezas"
  }
}
;


function m2Text(locale, key, params = {}, fallback = (k) => k) {
  const pack = text3[locale] || text3.en,
    v = pack[key] ?? text3.en[key];
  return v === void 0 ? fallback(key) : v.replace(/\{\{(\w+)\}\}/g, (_, k) => params[k] ?? "");
}

// singleplayer/mobile/v2/turn.js
function createTurn({ isGame, onChange, direction = () => "right" }) {
  const root = document.documentElement;
  let turned = false,
    dir = direction();
  const portrait = () => innerHeight > innerWidth;
  const typing = () => {
    const a = document.activeElement;
    return (
      !!a &&
      !!a.matches &&
      a.matches(
        'input:not([type=checkbox]):not([type=radio]):not([type=range]),textarea,select,[contenteditable="true"]',
      )
    );
  };
  function apply() {
    const want = portrait() && isGame() && !typing(),
      nextDir = direction();
    root.style.setProperty("--turn-w", Math.round(innerHeight) + "px");
    root.style.setProperty("--turn-h", Math.round(innerWidth) + "px");
    if (want === turned && nextDir === dir) return false;
    turned = want;
    dir = nextDir;
    if (turned) root.dataset.turned = dir;
    else delete root.dataset.turned;
    onChange?.(turned);
    return true;
  }
  function size() {
    const v = globalThis.visualViewport;
    return turned
      ? { w: Math.round(innerHeight), h: Math.round(innerWidth) }
      : { w: Math.round(v?.width || innerWidth), h: Math.round(v?.height || innerHeight) };
  }
  function toLocal(x, y) {
    if (!turned) return { x, y };
    return dir === "right" ? { x: y, y: innerWidth - x } : { x: innerHeight - y, y: x };
  }
  function localRect(el) {
    const r = el.getBoundingClientRect();
    if (!turned) return { left: r.left, top: r.top, width: r.width, height: r.height };
    return dir === "right"
      ? { left: r.top, top: innerWidth - r.right, width: r.height, height: r.width }
      : { left: innerHeight - r.bottom, top: r.left, width: r.height, height: r.width };
  }
  document.addEventListener(
    "click",
    (e) => {
      if (
        !turned ||
        e.m2Replay ||
        !(e.target instanceof HTMLCanvasElement) ||
        e.target.id === "world"
      )
        return;
      const c = e.target,
        lr = localRect(c),
        lp = toLocal(e.clientX, e.clientY),
        fx = (lp.x - lr.left) / lr.width,
        fy = (lp.y - lr.top) / lr.height,
        r = c.getBoundingClientRect();
      e.stopImmediatePropagation();
      e.preventDefault();
      const replay = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        clientX: r.left + fx * r.width,
        clientY: r.top + fy * r.height,
      });
      replay.m2Replay = true;
      c.dispatchEvent(replay);
    },
    true,
  );
  for (const ev of ["focusin", "focusout"])
    document.addEventListener(ev, () => setTimeout(apply, 0));
  return {
    apply,
    size,
    toLocal,
    localRect,
    get turned() {
      return turned;
    },
    get dir() {
      return dir;
    },
  };
}
var canLock = () => !!(document.fullscreenEnabled && globalThis.screen?.orientation?.lock);
function wantsLock() {
  return canLock() && !document.fullscreenElement;
}
function lockLandscape() {
  if (!canLock()) return Promise.resolve(false);
  const start = document.fullscreenElement
    ? Promise.resolve()
    : document.documentElement.requestFullscreen({ navigationUI: "hide" });
  return start
    .then(() => screen.orientation.lock("landscape"))
    .then(
      () => true,
      () => false,
    );
}

// singleplayer/mobile/icons.js
var base = new URL("../assets/mobile-v2/", import.meta.url);
var iconURL = (name) => new URL(name + ".webp", base).href;
function iconEl(name, fallback = "", cls = "m2-ic") {
  const box = document.createElement("i");
  box.className = cls;
  box.textContent = fallback;
  box.setAttribute("aria-hidden", "true");
  const img = new Image();
  img.alt = "";
  img.decoding = "async";
  img.draggable = false;
  img.onload = () => {
    box.textContent = "";
    box.classList.add("img");
    box.append(img);
  };
  img.src = iconURL(name);
  return box;
}

// singleplayer/mobile/v2/input.js
function bindSkillGesture(
  node,
  {
    skill,
    point,
    mode,
    showAim,
    hideAim,
    cancelAt,
    cast,
    empty,
    consume = () => {},
    allowed = () => true,
    claim = () => {},
    release = () => {},
  },
) {
  let start = null,
    aiming = false;
  const reset = () => {
    start = null;
    aiming = false;
    node.classList.remove("drag");
    hideAim();
    release();
  };
  const cancel = () => {
    if (start) reset();
  };
  node.addEventListener("pointerdown", (e) => {
    if (start || !allowed()) return;
    start = { id: e.pointerId, p: point(e), skill: skill() };
    aiming = false;
    claim();
    try {
      node.setPointerCapture(e.pointerId);
    } catch {}
    e.preventDefault();
  });
  node.addEventListener("pointermove", (e) => {
    if (!start || e.pointerId !== start.id || !start.skill) return;
    const p = point(e),
      kind = mode(start.skill.Spell);
    if (
      !aiming &&
      Math.hypot(p.x - start.p.x, p.y - start.p.y) > 18 &&
      (kind === "ground" || kind === "direction")
    ) {
      aiming = true;
      node.classList.add("drag");
    }
    if (aiming) showAim(p, node);
  });
  const finish = (e) => {
    if (!start || e.pointerId !== start.id) return;
    const saved = start,
      dragged = aiming,
      p = point(e);
    reset();
    consume(e);
    e.preventDefault();
    if (e.type !== "pointerup") return;
    if (dragged) {
      if (!cancelAt(p, node)) cast(saved.skill, p);
    } else if (saved.skill) cast(saved.skill);
    else empty();
  };
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
    node.addEventListener(type, finish);
  return cancel;
}
function bindHoldAttack(
  node,
  {
    tap,
    force,
    stop,
    consume = () => {},
    allowed = () => true,
    schedule = setTimeout,
    unschedule = clearTimeout,
    delay = 450,
  },
) {
  let id = null,
    timer = null,
    forcing = false;
  const reset = () => {
    id = null;
    if (timer !== null) unschedule(timer);
    timer = null;
    if (forcing) {
      forcing = false;
      stop();
    }
  };
  node.addEventListener("pointerdown", (e) => {
    if (id !== null || !allowed()) return;
    id = e.pointerId;
    const owner = id;
    timer = schedule(() => {
      timer = null;
      if (id !== owner) return;
      forcing = true;
      force();
    }, delay);
    try {
      node.setPointerCapture(e.pointerId);
    } catch {}
    e.preventDefault();
  });
  const finish = (e) => {
    if (e.pointerId !== id) return;
    const held = forcing;
    reset();
    consume(e);
    e.preventDefault();
    if (!held && e.type === "pointerup") tap();
  };
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
    node.addEventListener(type, finish);
  return reset;
}
function stickPosition(point, { w, h }, zone, radius = 56) {
  const x = Math.max(radius + 8, Math.min(w - radius - 8, point.x)),
    y = Math.max(radius + 8, Math.min(h - radius - 8, point.y));
  return { origin: { x, y }, left: x - zone.left, top: y - zone.top };
}
var placementInsets = (insets, hand) =>
  hand === "left" ? { ...insets, l: insets.r, r: insets.l } : insets;
var DEFAULT_ATTACK_SIZE = 62;
function skillArcRadius(attack, skill, compactRadius, gap = 3) {
  const adjacent = (skill + gap) / (2 * Math.sin((16 * Math.PI) / 180));
  const innerClearance =
    attack / 2 + 25 + Math.sqrt(Math.max(0, ((skill + 44) / 2 + gap) ** 2 - (attack / 2 - 5) ** 2));
  return Math.ceil(Math.max(compactRadius, adjacent, innerClearance)) + 4;
}
function compactHudLayout({ w, h, insets, attack, skill, arcRadius }) {
  const slot = 44,
    gap = 4,
    gearSpace = 48;
  const left = insets.l + Math.min(148, Math.max(92, Math.round(w * 0.15))) + gearSpace;
  const right = w - insets.r - 24 - attack / 2 - arcRadius - skill / 2 - 10;
  const available = Math.max(slot, Math.floor(right - left)),
    full = 6 * (slot + gap) - gap;
  const count = Math.min(6, Math.max(1, Math.floor((available - 16) / (slot + gap))));
  const width = available >= full ? full : Math.min(available, count * (slot + gap) + 16);
  return {
    count: available >= full ? 6 : count,
    belt: {
      left: Math.round(left + (available - width) / 2),
      top: h - insets.b - slot - 12,
      width,
      height: slot,
    },
  };
}
var sideNavigation = (map, width = 144) => ({
  left: Math.round(map.left + map.width - width),
  top: Math.round(map.top + map.height + 4),
  width,
  height: 48,
});
function minimapCanvasLimit({ top, chrome, arcTop, base: base2, left, width = 144, circles = [] }) {
  let cap = Math.min(base2, Math.floor(arcTop - top - chrome - 4 - 48 - 3));
  for (const c of circles) {
    const dx = Math.max(left - c.x, c.x - left - width, 0),
      reach = c.r + 3;
    if (dx >= reach) continue;
    const clearBottom = c.y - Math.sqrt(reach * reach - dx * dx);
    cap = Math.min(cap, Math.floor(clearBottom - top - chrome - 4 - 48) - 1);
  }
  return Math.max(32, cap);
}
function combatTouchBounds(rects, { w, h, hand = "right" }, padding = 8) {
  const left = Math.max(0, Math.min(...rects.map((r) => r.left)) - padding),
    right = Math.min(w, Math.max(...rects.map((r) => r.left + r.width)) + padding),
    top = Math.max(0, Math.min(...rects.map((r) => r.top)) - padding);
  return { left: hand === "left" ? 0 : left, top, right: hand === "left" ? right : w, bottom: h };
}
var inCombatTouchBounds = (p, r) =>
  !!r && p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom;
function targetCyclePosition({ w, h, insets, attack, skill, radius }) {
  const ay = h - insets.b - 20 - attack / 2;
  const upperBottom = ay - radius * Math.sin((84 * Math.PI) / 180) + skill / 2;
  return { left: w - insets.r - 46, top: Math.round((upperBottom + ay - attack / 2 - 44) / 2) };
}

// Keep navigation clear of combat circles and existing HUD panels on small screens.
function fitSideNavigation(preferred, { width, height, insets, circles, obstacles }) {
  const margin = 4;
  const bounds = [...obstacles, ...circles.map((c) => ({ left: c.x - c.r, top: c.y - c.r, width: c.r * 2, height: c.r * 2 }))];
  const xs = [preferred.left, insets.l + 8, width - insets.r - preferred.width - 8],
    ys = [preferred.top, insets.t + 8, height - insets.b - preferred.height - 8];
  for (const b of bounds) {
    xs.push(b.left - preferred.width - margin, b.left + b.width + margin);
    ys.push(b.top - preferred.height - margin, b.top + b.height + margin);
  }
  const valid = (b) => {
    if (b.left < insets.l || b.top < insets.t || b.left + b.width > width - insets.r || b.top + b.height > height - insets.b) return false;
    if (obstacles.some((o) => b.left < o.left + o.width + margin && b.left + b.width > o.left - margin && b.top < o.top + o.height + margin && b.top + b.height > o.top - margin)) return false;
    return !circles.some((c) => Math.hypot(Math.max(b.left - c.x, c.x - b.left - b.width, 0), Math.max(b.top - c.y, c.y - b.top - b.height, 0)) < c.r + margin);
  };
  if (valid(preferred)) return preferred;
  let best = null, score = Infinity;
  for (const x of xs) for (const y of ys) {
    const box = { ...preferred, left: Math.round(x), top: Math.round(y) },
      distance = (box.left - preferred.left) ** 2 + (box.top - preferred.top) ** 2;
    if (distance < score && valid(box)) { best = box; score = distance; }
  }
  return best || preferred;
}

// singleplayer/mobile/v2/view-state.js
function sheetStateKey(sheet, me, itemMode) {
  const role =
    sheet.tab === "role"
      ? [
          me.name,
          me.job,
          me.gender,
          me.level,
          me.hp,
          me.maxHP,
          me.mp,
          me.maxMP,
          me.stats,
          me.mountUid,
        ]
      : null;
  return JSON.stringify([
    sheet.tab,
    sheet.sel,
    sheet.filter,
    sheet.compare,
    me.inventory.map((i) => i && [i.uid, i.count, i.currentDura]),
    me.equipment.map((i) => i && [i.uid, i.currentDura]),
    me.skills.map((s) => [s.Spell, s.Key, s.Level]),
    me.gold,
    itemMode,
    role,
  ]);
}
var guideProgress = (text4) =>
  (String(text4 || "").match(/\b\d+\s*\/\s*\d+\b/g) || [])
    .map((value) => value.replace(/\s/g, ""))
    .join(" \xB7 ");
function targetMarkerState(actors, id, project, { w, h }, scale = 0.85) {
  const actor = actors?.find((a) => a.id === id && a.kind === "monster" && !a.dead);
  if (!actor || typeof project !== "function") return null;
  const point = project(actor);
  if (!point || ![point.x, point.y].every(Number.isFinite)) return null;
  const x = point.x * scale,
    y = point.y * scale,
    top =
      (Number.isFinite(point.headY) ? point.headY : point.y - 48) * scale -
      (actor.friendly ? 40 : 16),
    width = 80;
  if (x < width / 2 + 4 || x > w - width / 2 - 4 || top < 4 || y > h - 8 || y <= top) return null;
  return {
    id: actor.id,
    left: x - width / 2,
    top,
    width,
    height: y - top + 8,
    friend: !!actor.friendly,
    health: actor.friendly
      ? `${Math.max(0, Math.trunc(actor.hp || 0))} / ${Math.max(0, Math.trunc(actor.maxHP || 0))}`
      : "",
    percent: Math.max(0, Math.min(100, actor.maxHP ? (actor.hp * 100) / actor.maxHP : 0)),
  };
}

// singleplayer/core/item-hotkeys.ts
var quickItemTypes = ["Potion", "Scroll", "Book", "BagExpansion", "TreasureMap"];
function isTeleportRing(def) {
  return def?.Type === "Ring" && def.Unique?.split(",").some((flag) => flag.trim() === "Teleport");
}

// singleplayer/mobile/v2/quick-bindings.js
var ITEM_QUICK_KEYS = 6;
var SKILL_QUICK_KEYS = 8;
function quickItemChoices(me, itemDef) {
  const groups2 = /* @__PURE__ */ new Map(),
    rings = [];
  for (const [slot, item] of (me?.inventory || []).entries()) {
    if (!item || !(item.count > 0)) continue;
    const def = itemDef(item.id);
    if (isTeleportRing(def)) {
      rings.push({ item, count: 1, bagSlot: slot });
      continue;
    }
    if (!quickItemTypes.includes(def?.Type)) continue;
    const group = groups2.get(item.id);
    if (group) group.count += item.count;
    else groups2.set(item.id, { item, count: item.count });
  }
  return [...groups2.values(), ...rings];
}
function quickSkillChoices(me) {
  return (me?.skills || []).filter((s) => {
    const mode = spellMode(s.Spell);
    return mode && mode !== "passive" && mode !== "unavailable";
  });
}
function quickBindingRequest(state, owner, kind, key, candidate, itemDef) {
  const me = state?.me;
  if (state?.stage !== "Game" || !me || me.id !== owner.id || state.epoch !== owner.epoch)
    return null;
  if (kind === "item") {
    if (!Number.isInteger(key) || key < 0 || key >= ITEM_QUICK_KEYS) return null;
    if (candidate === null) return { type: "BindItemHotkey", data: { Key: key, UniqueID: null } };
    const current = me.inventory.find(
      (i) => i?.uid === candidate.uid && i.id === candidate.id && i.count > 0,
    );
    if (
      !current ||
      (!quickItemTypes.includes(itemDef(current.id)?.Type) && !isTeleportRing(itemDef(current.id)))
    )
      return null;
    return { type: "BindItemHotkey", data: { Key: key, UniqueID: current.uid } };
  }
  if (kind !== "skill" || !Number.isInteger(key) || key < 1 || key > SKILL_QUICK_KEYS) return null;
  const skill =
    candidate === null
      ? me.skills.find((s) => s.Key === key)
      : quickSkillChoices(me).find((s) => s.Spell === candidate.Spell);
  return skill
    ? {
        type: "MagicKey",
        data: { Spell: skill.Spell, Key: candidate === null ? 0 : key, OldKey: skill.Key || 0 },
      }
    : null;
}

// singleplayer/mobile/v2/m2.js
function pickupPosition({ attack, skill, radius }) {
  const circles = [
    [0, 0, attack / 2],
    ...[180, 148, 116, 84].map((deg) => [
      Math.round(radius * Math.cos((deg * Math.PI) / 180)),
      Math.round(-radius * Math.sin((deg * Math.PI) / 180)),
      skill / 2,
    ]),
  ];
  let best = { x: 0, y: 0, gap: -Infinity };
  for (let x = Math.ceil(-radius * 0.5); x <= Math.floor(-radius * 0.25); x++)
    for (let y = Math.ceil(-radius * 0.6); y <= Math.floor(-radius * 0.25); y++) {
      const gap = Math.min(...circles.map(([cx, cy, r]) => Math.hypot(x - cx, y - cy) - r - 22));
      if (gap > best.gap) best = { x, y, gap };
    }
  return best;
}
var PREFS = "backmir.m2.prefs";
var loadPrefs = () => {
  let p = {};
  try {
    p = JSON.parse(localStorage.getItem(PREFS) || "{}") || {};
  } catch {}
  return { hand: "right", size: "m", alpha: 1, turn: "right", vibrate: true, ...p };
};
var savePrefs = (p) => {
  try {
    localStorage.setItem(PREFS, JSON.stringify(p));
  } catch {}
};
var MOBILE_UI_CHOICE = "default-m2-20261031";
function rememberMobileUI(mode) {
  try {
    localStorage.setItem("backmir.mobileUI", mode);
    localStorage.setItem("backmir.mobileUI.choice", MOBILE_UI_CHOICE);
  } catch {}
}
function mobileUIMode() {
  const q = new URL(location.href).searchParams.get("ui");
  if (q === "m1" || q === "m2") {
    rememberMobileUI(q);
    return q;
  }
  let mode, choice;
  try {
    mode = localStorage.getItem("backmir.mobileUI");
    choice = localStorage.getItem("backmir.mobileUI.choice");
  } catch {}
  if (mode === "m1" && choice === MOBILE_UI_CHOICE) return "m1";
  rememberMobileUI("m2");
  return "m2";
}
function mobileUIHref(mode) {
  rememberMobileUI(mode);
  const url = new URL(location.href);
  url.searchParams.set("ui", mode);
  return url.href;
}
function installV2(ctx, hooks) {
  const { b, controller, button, dialog, closeDetail, inventoryDetail, bindSlots, petMenu } = ctx;
  const v1t = (k) => mobileText(b.locale, k),
    t = (k, p) => m2Text(b.locale, k, p, v1t),
    $ = (s) => document.querySelector(s);
  const doc = document.documentElement;
  doc.dataset.ui = "m2";
  const prefs = loadPrefs();
  const scale = () => ctx.viewScale?.() ?? 0.85;
  const game = () => b.state()?.stage === "Game";
  let W = innerWidth,
    H = innerHeight,
    sheet = null,
    hub = null,
    cooldowns = /* @__PURE__ */ new Map(),
    lastHP = null,
    beltSlots = 4,
    bindingEditor = null;
  const turn = createTurn({
    isGame: game,
    direction: () => prefs.turn,
    onChange: () => ctx.layout(),
  });
  const el = (tag, cls, text4) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text4 !== void 0) e.textContent = text4;
    return e;
  };
  const icon = iconEl;
  const ui = el("div", "m2");
  ui.id = "m2";
  document.body.append(ui);
  const suppressClick = touchClickGuard(ui),
    consumeTouch = (e) => {
      if (e.pointerType === "touch") suppressClick(e);
    };
  const skillGestures = [];
  let skillOwner = null,
    cancelAttack = () => {};
  const cancelGestures = () => {
    for (const cancel of skillGestures) cancel();
    cancelAttack();
  };
  ui.innerHTML = `<div class="m2-hud"><div class="m2-combat-zone" aria-hidden="true"></div>
  <div class="m2-vit"><div class="m2-face"><b></b><i></i></div><div class="m2-bars"><div class="m2-nm"></div><div class="m2-bar hp"><u></u><em></em></div><div class="m2-bar mp"><u></u><em></em></div></div></div>
  <div class="m2-target-marker" hidden aria-hidden="true"><i class="m2-target-pointer"></i><div class="m2-bar hp"><u></u><em></em></div><i class="m2-target-ring"></i></div>
  <div class="m2-zone"><div class="m2-stick" hidden><i></i></div></div>
  <div class="m2-belt-wrap"><div class="m2-belt"></div></div>
  <nav class="m2-nav"></nav>
  <div class="m2-arrow" hidden></div>
  <div class="m2-aim" hidden><div class="m2-range"></div><div class="m2-reticle"></div><div class="m2-cancel"></div></div>
  <div class="m2-exp"><u></u></div>
 </div>
 <div class="m2-sheet" hidden role="dialog"></div>
 <div class="m2-hub" hidden role="dialog"></div>
 <button class="m2-relock" hidden></button>`;
  ui.querySelector(".m2-bars").append(ctx.petPortraits);
  const hud = ui.querySelector(".m2-hud"),
    zone = ui.querySelector(".m2-zone"),
    stick = ui.querySelector(".m2-stick"),
    belt = ui.querySelector(".m2-belt"),
    arrow = ui.querySelector(".m2-arrow"),
    aimEl = ui.querySelector(".m2-aim"),
    sheetEl = ui.querySelector(".m2-sheet"),
    hubEl = ui.querySelector(".m2-hub"),
    relock = ui.querySelector(".m2-relock");
  const nav = ui.querySelector(".m2-nav");
  nav.setAttribute("aria-label", v1t("menu"));
  const navButton = (cls, pic, label, short, fn) => {
    const node = button("", fn, nav, { className: "m2-navbtn " + cls });
    node.append(icon(pic, ""), el("small", "", short));
    node.setAttribute("aria-label", label);
    node.title = label;
    return node;
  };
  const roleBtn = navButton("m2-rolebtn", "character", t("tabRole"), t("roleShort"), () =>
    openSheet("role"),
  );
  const bagBtn = navButton("m2-bagbtn", "bag", t("tabBag"), t("tabBag"), () => openSheet("bag"));
  const bagCount = el("em", "m2-bagcount");
  bagBtn.append(bagCount);
  const mountBtn = navButton("m2-mountbtn", "mount", v1t("mount"), v1t("mount"), () => {
    controller.clear();
    b.command("ToggleMount");
  });
  const menuBtn = navButton("m2-menu", "menu", v1t("menu"), t("menuShort"), () => openHub());
  const loot = button("", () => controller.pickup(), hud, { className: "m2-loot" }),
    lootCount = el("i", "m2-loot-count");
  loot.append(icon("loot", "\u25C6"), lootCount);
  lootCount.hidden = true;
  loot.setAttribute("aria-label", v1t("pickup"));
  const cycle = button("", () => controller.cycle(), hud, { className: "m2-cyc" });
  cycle.append(icon("target", "\u25CE"));
  cycle.setAttribute("aria-label", t("switchTarget"));
  const attack = el("button", "m2-atk");
  attack.type = "button";
  attack.append(icon("attack", "\u2694\uFE0E", "m2-ic m2-atki"));
  attack.setAttribute("aria-label", v1t("attack") + " \xB7 " + t("holdForce"));
  hud.append(attack);
  relock.textContent = t("fullscreenHint");
  relock.onclick = () => lockLandscape().then(() => refreshRelock());
  if (navigator.maxTouchPoints > 0) ui.classList.add("touch");
  function applyPrefs() {
    doc.dataset.m2Hand = prefs.hand;
    doc.style.setProperty("--m2-k", { s: 0.9, m: 1, l: 1.12 }[prefs.size] || 1);
    doc.style.setProperty("--m2-alpha", String(prefs.alpha));
  }
  applyPrefs();
  const settings = button("\u2699", () => openBindings(), hud, { className: "m2-bind-settings" });
  settings.setAttribute("aria-label", t("shortcutSettings"));
  const beltWrap = belt.parentElement;
  function updateBeltHints() {
    beltWrap.toggleAttribute("data-more-left", belt.scrollLeft > 1);
    beltWrap.toggleAttribute(
      "data-more-right",
      belt.scrollWidth - belt.clientWidth - belt.scrollLeft > 1,
    );
  }
  belt.addEventListener("scroll", updateBeltHints, { passive: true });
  new ResizeObserver(updateBeltHints).observe(belt);
  const combatZone = ui.querySelector(".m2-combat-zone");
  let combatBounds = null;
  for (const type of ["pointerdown", "pointerup", "pointermove", "click", "contextmenu"])
    combatZone.addEventListener(type, (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (type === "pointerup") consumeTouch(e);
    });
  const skillButtons = [];
  const probe = el("div");
  probe.style.cssText =
    "position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)";
  document.body.append(probe);
  function insets() {
    const c = getComputedStyle(probe),
      v = {
        t: parseFloat(c.paddingTop) || 0,
        r: parseFloat(c.paddingRight) || 0,
        b: parseFloat(c.paddingBottom) || 0,
        l: parseFloat(c.paddingLeft) || 0,
      };
    const s2 = !turn.turned
      ? v
      : turn.dir === "right"
        ? { t: v.r, r: v.b, b: v.l, l: v.t }
        : { t: v.l, r: v.t, b: v.r, l: v.b };
    for (const [k2, n] of Object.entries(s2))
      doc.style.setProperty("--m2-s" + k2, Math.round(n) + "px");
    return s2;
  }
  function place() {
    const safe = insets(),
      ins = placementInsets(safe, prefs.hand),
      k = Number(getComputedStyle(doc).getPropertyValue("--m2-k")) || 1,
      small = H < 380 || W < 720;
    const atk = Math.round(DEFAULT_ATTACK_SIZE * k),
      sk = Math.round((small ? 50 : 52) * k),
      r = skillArcRadius(atk, sk, Math.round((small ? 88 : 96) * k));
    const flip = prefs.hand === "left",
      at = (x, w) => Math.round(flip ? W - x - w : x);
    const ax = W - ins.r - 24 - atk / 2,
      ay = H - ins.b - 20 - atk / 2;
    attack.style.cssText = `width:${atk}px;height:${atk}px;left:${at(ax - atk / 2, atk)}px;top:${Math.round(ay - atk / 2)}px`;
    const outerRadius = r + sk + Math.round(8 * k);
    skillButtons.forEach((b2, i) => {
      const a = ((180 - (i % 4) * 30) * Math.PI) / 180;
      const radius = i < 4 ? r : outerRadius;
      const cx = ax + radius * Math.cos(a);
      b2.style.cssText = `width:${sk}px;height:${sk}px;left:${at(cx - sk / 2, sk)}px;top:${Math.round(ay - radius * Math.sin(a) - sk / 2)}px`;
    });
    const bottom = compactHudLayout({
      w: W,
      h: H,
      insets: ins,
      scale: k,
      attack: atk,
      skill: sk,
      arcRadius: outerRadius,
    });
    beltSlots = bottom.count;
    beltWrap.style.cssText = `left:${at(bottom.belt.left, bottom.belt.width)}px;top:${bottom.belt.top}px;width:${bottom.belt.width}px;height:${bottom.belt.height}px`;
    const pickup = pickupPosition({ attack: atk, skill: sk, radius: r });
    loot.style.cssText = `left:${at(Math.round(ax + pickup.x - 22), 44)}px;top:${Math.round(ay + pickup.y - 22)}px;width:44px;height:44px`;
    settings.style.cssText = `left:${at(bottom.belt.left - 48, 44)}px;top:${bottom.belt.top + bottom.belt.height - 44}px;width:44px;height:44px`;
    const pos = targetCyclePosition({ w: W, h: H, insets: ins, attack: atk, skill: sk, radius: r });
    cycle.style.cssText = `left:${at(pos.left, 44)}px;top:${pos.top}px;width:44px;height:44px`;
    updateBeltHints();
    const rects = [attack, cycle, loot, ...skillButtons].map((n) => ({
      left: parseFloat(n.style.left),
      top: parseFloat(n.style.top),
      width: parseFloat(n.style.width) || 44,
      height: parseFloat(n.style.height) || 44,
    }));
    combatBounds = combatTouchBounds(rects, { w: W, h: H, hand: prefs.hand });
    combatZone.style.cssText = `left:${combatBounds.left}px;top:${combatBounds.top}px;width:${combatBounds.right - combatBounds.left}px;height:${combatBounds.bottom - combatBounds.top}px`;
    arcTop = ay - outerRadius - sk / 2;
    fitCard();
    placeTray();
    placeZone();
    beltStamp = "";
  }
  let arcTop = Infinity;
  function fitCard() {
    for (const sel of ["#novice-guide", "#quest-tracker"]) {
      const card = $(sel);
      if (!card) continue;
      if (prefs.hand !== "left") {
        card.style.removeProperty("max-height");
        continue;
      }
      const r = turn.localRect(card);
      if (!r.height) continue;
      card.style.maxHeight = Math.max(48, Math.round(arcTop - r.top - 8)) + "px";
    }
  }
  const trayIcons = [
    ["#hud-leaderboard", "ranking"],
    [".forge-launch", "forge"],
    ["#assist-launch", "assist"],
    ["#dx-equipment-launch", "workshop"],
    ["#dx-loot-filter", "loot-filter"],
    ["#minimap .map-expand", "map"],
  ];
  const pics = {};
  function pictureButtons() {
    for (const [sel, name] of trayIcons) {
      const node = $(sel);
      if (!node) continue;
      if (!pics[name]) {
        pics[name] = new Image();
        pics[name].decoding = "async";
        pics[name].onload = () => {
          pics[name].ok = true;
          pictureButtons();
        };
        pics[name].src = iconURL(name);
      }
      if (!pics[name].ok || node.querySelector(":scope>.m2-pic")) continue;
      node.setAttribute("aria-label", node.textContent.trim() || node.title || name);
      const img = pics[name].cloneNode();
      img.alt = "";
      img.className = "m2-pic";
      img.draggable = false;
      node.append(img);
      node.classList.add("m2-pictured");
    }
  }
  let navigationLayoutKey = "", navigationLayout = null;
  function placeTray() {
    const mm = $("#minimap"),
      canvas = mm?.querySelector("canvas");
    if (!mm) return;
    let r = turn.localRect(mm);
    if (!r.width || !r.height) return;
    if (canvas) {
      const c = turn.localRect(canvas),
        circles = [attack, cycle, loot, ...skillButtons]
          .filter((n) => !n.hidden)
          .map((n) => {
            const b2 = turn.localRect(n);
            return { x: b2.left + b2.width / 2, y: b2.top + b2.height / 2, r: b2.width / 2 };
          }),
        cap = minimapCanvasLimit({
          top: r.top,
          chrome: r.height - c.height,
          arcTop,
          base: 52,
          left: sideNavigation(r, 192).left,
          width: 192,
          circles,
        }),
        value = cap + "px";
      if (canvas.style.maxHeight !== value) {
        canvas.style.maxHeight = value;
        r = turn.localRect(mm);
      }
    }
    const preferred = sideNavigation(r, 192),
      circles = [attack, cycle, loot, ...skillButtons].filter((n) => !n.hidden).map((node) => {
        const c = turn.localRect(node);
        return { x: c.left + c.width / 2, y: c.top + c.height / 2, r: c.width / 2 };
      }),
      obstacles = [mm, $(".m2-vit"), $("#buff-effects"), $("#novice-guide"), $("#quest-tracker")]
        .filter((n) => n && n.getClientRects().length && getComputedStyle(n).display !== "none")
        .map((n) => turn.localRect(n)),
      options = { width: W, height: H, insets: insets(), circles, obstacles },
      key = JSON.stringify([preferred, options]);
    if (key !== navigationLayoutKey) {
      navigationLayoutKey = key;
      navigationLayout = fitSideNavigation(preferred, options);
    }
    const box = navigationLayout;
    nav.style.cssText = `left:${box.left}px;top:${box.top}px;width:${box.width}px;height:${box.height}px`;
    doc.setAttribute("data-m2-notray", "");
  }
  function placeZone() {
    const flip = prefs.hand === "left",
      w = Math.round(W * 0.42),
      x0 = flip ? W - w : 0,
      x1 = flip ? W : w;
    let top = Math.round(H * 0.38);
    for (const sel of [
      "#novice-guide",
      "#quest-tracker",
      "#minimap",
      "#utility-actions",
      "#m2 .m2-nav",
    ]) {
      const node = $(sel);
      if (!node || node.offsetParent === null || getComputedStyle(node).display === "none")
        continue;
      const r = turn.localRect(node);
      if (!r.height || r.left >= x1 || r.left + r.width <= x0) continue;
      top = Math.max(top, Math.round(r.top + r.height + 8));
    }
    top = Math.min(top, H - 130);
    zone.style.cssText = (flip ? "right:0;left:auto;" : "left:0;") + `width:${w}px;top:${top}px`;
  }
  const vit = {
    face: ui.querySelector(".m2-face b"),
    lv: ui.querySelector(".m2-face i"),
    nm: ui.querySelector(".m2-nm"),
    hp: ui.querySelector(".m2-vit .hp"),
    mp: ui.querySelector(".m2-vit .mp"),
  };
  const tgt = ui.querySelector(".m2-target-marker"),
    exp = ui.querySelector(".m2-exp u");
  const bar = (node, v, max, label) => {
    node.querySelector("u").style.width =
      Math.max(0, Math.min(100, max ? (v * 100) / max : 0)) + "%";
    node.querySelector("em").textContent = label;
  };
  let beltStamp = "",
    skillStamp = "";
  function renderBelt() {
    const s = b.state(),
      items = b.quickItems(),
      stamp = JSON.stringify([
        beltSlots,
        items.map((i) => i && [i.uid, i.id, i.count]),
        s.me.inventory.filter(Boolean).length,
        s.me.inventory.length,
      ]);
    if (stamp === beltStamp) return;
    beltStamp = stamp;
    const scroll = belt.scrollLeft;
    belt.replaceChildren();
    belt.setAttribute("aria-label", t("quickBarHint"));
    belt.title = t("quickBarHint");
    for (let k = 0; k < ITEM_QUICK_KEYS; k++) {
      const item = items[k],
        slot = el("button", "m2-slot");
      slot.type = "button";
      slot.dataset.key = k;
      slot.setAttribute("aria-label", k + 1 + " \xB7 " + (item ? b.itemName(item) : v1t("empty")));
      if (item) {
        const c = el("canvas");
        c.width = 36;
        c.height = 36;
        slot.append(c);
        drawItem(c, item);
        if (s.me.ringHotkeys?.[k]) slot.append(el("em", "", "\u2194"));
        else if (item.count > 1) slot.append(el("em", "", String(item.count)));
      } else slot.append(el("small", "", "+"));
      slot.classList.toggle("depleted", !!item && !item.count);
      belt.append(slot);
    }
    belt.scrollLeft = scroll;
    updateBeltHints();
    const used = s.me.inventory.filter(Boolean).length;
    bagCount.textContent = String(used);
    bagBtn.title = t("tabBag") + " \xB7 " + t("bagUsed", { used, total: s.me.inventory.length });
  }
  function drawItem(c, item) {
    try {
      b.itemIcon ? b.itemIcon(c, item) : b.icon(c, item.id);
    } catch {}
  }
  let beltPress = null;
  function useBeltSlot(key) {
    if (key !== void 0 && b.quickItems()[key]?.count > 0)
      b.command("UseItemHotkey", { Key: Number(key) });
  }
  belt.addEventListener("pointerdown", (e) => {
    if (beltPress || e.button !== 0) return;
    const point = turn.toLocal(e.clientX, e.clientY);
    beltPress = {
      id: e.pointerId,
      key: e.target.closest(".m2-slot")?.dataset.key,
      point,
      scroll: belt.scrollLeft,
      dragged: false,
    };
    belt.setPointerCapture(e.pointerId);
  });
  belt.addEventListener("pointermove", (e) => {
    if (beltPress?.id !== e.pointerId) return;
    const point = turn.toLocal(e.clientX, e.clientY),
      dx = point.x - beltPress.point.x;
    if (Math.hypot(dx, point.y - beltPress.point.y) > 8) beltPress.dragged = true;
    if (beltPress.dragged) belt.scrollLeft = beltPress.scroll - dx;
  });
  belt.addEventListener("pointerup", (e) => {
    if (beltPress?.id !== e.pointerId) return;
    const press = beltPress;
    beltPress = null;
    consumeTouch(e);
    e.preventDefault();
    if (!press.dragged) useBeltSlot(press.key);
  });
  for (const type of ["pointercancel", "lostpointercapture"])
    belt.addEventListener(type, (e) => {
      if (beltPress?.id === e.pointerId) beltPress = null;
    });
  belt.addEventListener("click", (e) => {
    if (e.detail === 0) useBeltSlot(e.target.closest(".m2-slot")?.dataset.key);
    e.preventDefault();
  });
  function pickQuick(k) {
    openBindings("item", k);
  }
  function openBindings(
    kind = prefs.quickTab === "skill" ? "skill" : "item",
    key = kind === "skill" ? 1 : 0,
    pending = null,
  ) {
    closeHub();
    closeSheet();
    const state = b.state();
    if (!state?.me) return;
    const body = dialog(t("shortcutSettings"));
    body.parentElement.classList.add("mobile-shortcuts");
    body.classList.add("m2-bindings");
    bindingEditor = {
      body,
      kind,
      key,
      pending,
      owner: { id: state.me.id, epoch: state.epoch },
      stamp: "",
    };
    renderBindings();
    refreshVisibility();
  }
  function openBindingSlots(spell, uid) {
    const me = b.state()?.me;
    if (!me) return;
    if (spell) {
      const skill = quickSkillChoices(me).find((s) => s.Spell === spell);
      if (!skill) {
        note(t("skillCannotBind"));
        return;
      }
      const key =
        skill.Key ||
        Array.from({ length: 8 }, (_, i) => i + 1).find(
          (k) => !me.skills.some((s) => s.Key === k),
        ) ||
        1;
      openBindings("skill", key, skill);
    } else {
      const item = me.inventory.find((i) => i?.uid === uid);
      if (
        !item ||
        !quickItemChoices(me, (id) => b.itemDef(id)).some((x) => x.item.id === item.id)
      ) {
        note(t("itemCannotBind"));
        return;
      }
      const keys = me.itemHotkeys || Array(6).fill(null),
        existing = me.ringHotkeys?.findIndex((pair) => pair?.teleport.uid === item.uid) ?? -1,
        assigned = existing >= 0 ? existing : keys.indexOf(item.id),
        empty = keys.findIndex((id, k) => id === null && !me.ringHotkeys?.[k]);
      openBindings("item", assigned >= 0 ? assigned : empty >= 0 ? empty : 0, item);
    }
  }
  async function commitBinding(candidate) {
    const edit = bindingEditor;
    if (!edit?.body.isConnected || edit.busy) return;
    const request = quickBindingRequest(
      b.state(),
      edit.owner,
      edit.kind,
      edit.key,
      candidate,
      (id) => b.itemDef(id),
    );
    if (!request) {
      edit.stamp = "";
      renderBindings();
      return;
    }
    edit.busy = true;
    edit.stamp = "";
    renderBindings();
    try {
      const result =
        edit.kind === "item" && candidate
          ? await b.bindQuickItem(edit.key, candidate.uid)
          : await b.command(request.type, request.data);
      if (bindingEditor !== edit || !edit.body.isConnected) return;
      if (result === false) {
        edit.busy = false;
        edit.stamp = "";
        renderBindings();
        return;
      }
      bindingEditor = null;
      closeDetail();
      refreshVisibility();
    } catch (error) {
      if (bindingEditor === edit && edit.body.isConnected) {
        edit.busy = false;
        edit.stamp = "";
        renderBindings();
        note(error?.message || t("bindingChanged"));
      }
    }
  }
  function renderBindings() {
    const edit = bindingEditor;
    if (!edit) return;
    if (!edit.body.isConnected) {
      bindingEditor = null;
      return;
    }
    const state = b.state(),
      me = state?.me;
    if (state?.stage !== "Game" || me?.id !== edit.owner.id || state.epoch !== edit.owner.epoch) {
      bindingEditor = null;
      closeDetail();
      return;
    }
    if (
      edit.pending &&
      !quickBindingRequest(state, edit.owner, edit.kind, edit.key, edit.pending, (id) =>
        b.itemDef(id),
      )
    ) {
      edit.pending = null;
      note(t("bindingChanged"));
    }
    const stamp = JSON.stringify([
      edit.kind,
      edit.key,
      edit.pending,
      edit.busy,
      me.itemHotkeys,
      me.ringHotkeys,
      me.inventory.map((i) => i && [i.uid, i.id, i.count]),
      me.skills.map((s) => [s.Spell, s.Key]),
    ]);
    if (stamp === edit.stamp) return;
    edit.stamp = stamp;
    const body = edit.body,
      oldScroll = body.querySelector(".m2-bind-grid")?.scrollTop || 0;
    body.replaceChildren();
    const tabs2 = el("nav", "m2-bind-tabs");
    for (const [kind, label2, first] of [
      ["item", "quickItems", 0],
      ["skill", "quickSkills", 1],
    ]) {
      const tab = button(
        t(label2),
        () => {
          prefs.quickTab = kind;
          savePrefs(prefs);
          edit.kind = kind;
          edit.key = first;
          edit.pending = null;
          edit.stamp = "";
          renderBindings();
        },
        tabs2,
      );
      tab.dataset.quickKind = kind;
      tab.setAttribute("aria-pressed", String(edit.kind === kind));
    }
    body.append(tabs2);
    const itemMode = edit.kind === "item",
      slots = el("nav", "m2-bind-slots" + (itemMode ? "" : " skills")),
      items = b.quickItems();
    slots.setAttribute("aria-label", t(itemMode ? "quickItems" : "quickSkills"));
    for (
      let index = itemMode ? 0 : 1;
      index < (itemMode ? ITEM_QUICK_KEYS : SKILL_QUICK_KEYS + 1);
      index++
    ) {
      const current2 = itemMode ? items[index] : me.skills.find((s) => s.Key === index),
        slot = button(
          "",
          () => {
            edit.key = index;
            edit.stamp = "";
            renderBindings();
          },
          slots,
        );
      slot.dataset.quickKey = String(index);
      slot.setAttribute("aria-pressed", String(edit.key === index));
      slot.setAttribute(
        "aria-label",
        String(itemMode ? index + 1 : index) +
          " \xB7 " +
          (current2
            ? itemMode
              ? b.itemName(current2)
              : b.skillName(current2.Spell)
            : t("unbound")),
      );
      if (current2) {
        const c = el("canvas");
        c.width = 32;
        c.height = 32;
        slot.append(c);
        if (itemMode) drawItem(c, current2);
        else b.skillIcon(c, current2.Spell);
      } else slot.append(el("span", "", "+"));
      slot.append(el("small", "", String(itemMode ? index + 1 : index)));
    }
    body.append(slots);
    const current = itemMode ? items[edit.key] : me.skills.find((s) => s.Key === edit.key),
      summary = el("div", "m2-bind-current"),
      label = el("div");
    label.append(
      el("small", "", t("currentBinding")),
      el(
        "b",
        "",
        current ? (itemMode ? b.itemName(current) : b.skillName(current.Spell)) : t("unbound"),
      ),
    );
    if (itemMode && current)
      label.append(
        el(
          "small",
          "",
          current.count > 0 ? t("quantityCount", { n: current.count }) : t("outOfStock"),
        ),
      );
    summary.append(label);
    const clear = button(t("clearBinding"), () => commitBinding(null), summary);
    clear.disabled = !current;
    clear.dataset.quickClear = "";
    body.append(
      summary,
      el(
        "p",
        "m2-bind-hint",
        edit.pending
          ? t("chooseSlotHint", {
              name: itemMode ? b.itemName(edit.pending) : b.skillName(edit.pending.Spell),
            })
          : t(itemMode ? "replaceItemHint" : "replaceSkillHint"),
      ),
    );
    const grid = el("div", "m2-bind-grid"),
      choices = itemMode ? quickItemChoices(me, (id) => b.itemDef(id)) : quickSkillChoices(me);
    if (edit.pending) {
      const confirm = button(t("assignSelected"), () => commitBinding(edit.pending), grid, {
        className: "m2-bind-confirm",
      });
      confirm.dataset.bindConfirm = "";
      body.append(grid);
      if (edit.busy)
        body.querySelectorAll("button").forEach((n) => {
          n.disabled = true;
        });
      return;
    }
    if (!choices.length)
      grid.append(el("p", "m2-bind-empty", t(itemMode ? "noQuickItems" : "noQuickSkills")));
    for (const choice of choices) {
      const candidate = itemMode ? choice.item : choice,
        on =
          current &&
          (itemMode
            ? choice.bagSlot === void 0
              ? current.id === candidate.id
              : me.ringHotkeys?.[edit.key]?.teleport.uid === candidate.uid
            : current.Spell === candidate.Spell),
        pick = button("", () => commitBinding(candidate), grid, {
          className: "m2-bind-choice" + (on ? " on" : ""),
        });
      pick.dataset.bindCandidate = String(itemMode ? candidate.uid : candidate.Spell);
      pick.setAttribute(
        "aria-label",
        itemMode ? b.itemName(candidate) : b.skillName(candidate.Spell),
      );
      const c = el("canvas");
      c.width = 36;
      c.height = 36;
      pick.append(c);
      if (itemMode) drawItem(c, candidate);
      else b.skillIcon(c, candidate.Spell);
      pick.append(el("span", "", itemMode ? b.itemName(candidate) : b.skillName(candidate.Spell)));
      pick.append(
        el(
          "small",
          "",
          itemMode
            ? choice.bagSlot === void 0
              ? "\xD7" + choice.count
              : "\u2194 #" + (choice.bagSlot + 1)
            : candidate.Key
              ? t("onKey", { key: candidate.Key })
              : t("notPlaced"),
        ),
      );
    }
    body.append(grid);
    grid.scrollTop = oldScroll;
    if (edit.busy)
      body.querySelectorAll("button").forEach((n) => {
        n.disabled = true;
      });
  }
  for (let i = 0; i < 8; i++) {
    const s = el("button", "m2-sk");
    s.type = "button";
    s.innerHTML = '<canvas width="36" height="36"></canvas><b></b><i></i>';
    hud.append(s);
    skillButtons.push(s);
    skillGesture(s, i);
  }
  const skillAt = (i) => {
    const key = i + 1;
    return b.state()?.me?.skills.find((s) => s.Key === key);
  };
  function renderSkills() {
    const s = b.state(), me = s.me;
    const stamp = JSON.stringify(me.skills.map((x) => [x.Spell, x.Key]));
    if (stamp !== skillStamp) {
      skillStamp = stamp;
      skillButtons.forEach((node, i) => {
        const sk = skillAt(i);
        node.dataset.spell = sk?.Spell || "";
        node.classList.toggle("empty", !sk);
        const c = node.querySelector("canvas");
        c.getContext("2d").clearRect(0, 0, 36, 36);
        if (sk) b.skillIcon(c, sk.Spell);
        node.querySelector("b").textContent = sk ? "" : "+";
        node.setAttribute(
          "aria-label",
          sk ? b.skillName(sk.Spell) : v1t("skills") + " " + (i + 1),
        );
      });
    }
    skillButtons.forEach((node, i) => {
      const sk = skillAt(i);
      if (!sk) {
        node.style.removeProperty("--cd");
        node.querySelector("i").textContent = "";
        node.classList.remove("on", "lowmp");
        return;
      }
      const left = Math.max(0, (sk.CastTime || 0) - s.time);
      let total = cooldowns.get(sk.Spell);
      if (left > 0 && (!total || total.until !== sk.CastTime))
        cooldowns.set(sk.Spell, (total = { until: sk.CastTime, len: left }));
      node.style.setProperty(
        "--cd",
        left > 0 && total ? String(Math.min(1, left / total.len)) : "0",
      );
      node.querySelector("i").textContent = left > 0 ? String(Math.ceil(left / 1e3)) : "";
      const mode = spellMode(sk.Spell),
        key = sk.Spell[0].toLowerCase() + sk.Spell.slice(1);
      node.classList.toggle(
        "on",
        (mode === "toggle" || mode === "armed") && !!me.attackModes?.[key],
      );
      let cost = 0;
      try {
        cost = b.cost(sk);
      } catch {}
      node.classList.toggle("lowmp", cost > me.mp);
    });
  }
  function skillGesture(node, i) {
    skillGestures.push(
      bindSkillGesture(node, {
        skill: () => skillAt(i),
        point: (e) => turn.toLocal(e.clientX, e.clientY),
        mode: spellMode,
        allowed: () => !controller.blocked(true) && skillOwner === null,
        claim: () => {
          skillOwner = node;
        },
        release: () => {
          if (skillOwner === node) skillOwner = null;
        },
        showAim: (p, n) => {
          aimEl.hidden = false;
          showAim(p, n);
        },
        hideAim: () => {
          aimEl.hidden = true;
        },
        cancelAt: (p, n) => nearButton(p, n) || inCancel(p),
        cast: (sk, p) => {
          controller.cast(sk.Spell, p ? b.goal({ x: p.x / scale(), y: p.y / scale() }) : void 0);
          buzz(p ? 10 : 8);
        },
        empty: () => {},
        consume: consumeTouch,
      }),
    );
    node.addEventListener("click", (e) => {
      if (e.detail === 0) {
        const sk = skillAt(i);
        if (sk) controller.cast(sk.Spell);
      }
    });
  }
  const player = () => {
    const me = b.state().me,
      p = me && b.actorPoint?.(me);
    return p ? { x: p.x * scale(), y: p.y * scale() } : { x: W / 2, y: H / 2 - 19 * scale() };
  };
  function showAim(p, node) {
    const c = player(),
      rx = 7 * 48 * scale(),
      ry = 7 * 32 * scale(),
      range = aimEl.querySelector(".m2-range"),
      ret = aimEl.querySelector(".m2-reticle"),
      cancel = aimEl.querySelector(".m2-cancel");
    range.style.cssText = `left:${c.x - rx}px;top:${c.y - ry}px;width:${rx * 2}px;height:${ry * 2}px`;
    ret.style.cssText = `left:${p.x}px;top:${p.y}px`;
    cancel.textContent = t("cancelAim");
    aimEl.classList.toggle("cancelling", nearButton(p, node) || inCancel(p));
  }
  const nearButton = (p, node) => {
    const r = turn.localRect(node);
    return Math.hypot(p.x - (r.left + r.width / 2), p.y - (r.top + r.height / 2)) < r.width * 0.75;
  };
  const inCancel = (p) => p.y < 70 && Math.abs(p.x - W / 2) < 120;
  cancelAttack = bindHoldAttack(attack, {
    allowed: () => !controller.blocked(true),
    consume: consumeTouch,
    tap: () => {
      controller.attack();
      buzz(8);
      if (!prefs.forceTip) {
        prefs.forceTip = 1;
        savePrefs(prefs);
        note(t("holdForceTip"));
      }
    },
    force: () => {
      controller.forceAttack();
      attack.classList.toggle("force", controller.force);
      buzz(20);
    },
    stop: () => {
      attack.classList.remove("force");
      controller.clear();
    },
  });
  attack.addEventListener("click", (e) => {
    if (e.detail === 0) controller.attack();
  });
  attack.addEventListener("contextmenu", (e) => e.preventDefault());
  {
    let id = null,
      origin = null,
      moved = false,
      t0 = 0;
    const R = 56;
    zone.addEventListener("pointerdown", (e) => {
      if (id !== null || controller.blocked()) return;
      id = e.pointerId;
      moved = false;
      t0 = performance.now();
      const p = turn.toLocal(e.clientX, e.clientY);
      const pos = stickPosition(p, { w: W, h: H }, turn.localRect(zone), R);
      origin = pos.origin;
      stick.style.left = pos.left + "px";
      stick.style.top = pos.top + "px";
      stick.hidden = false;
      stick.querySelector("i").style.transform = "";
      try {
        zone.setPointerCapture(e.pointerId);
      } catch {}
      e.preventDefault();
    });
    zone.addEventListener("pointermove", (e) => {
      if (e.pointerId !== id) return;
      const p = turn.toLocal(e.clientX, e.clientY),
        x = p.x - origin.x,
        y = p.y - origin.y,
        len = Math.hypot(x, y);
      if (len > 10) moved = true;
      const f = Math.min(1, R / (len || 1));
      stick.querySelector("i").style.transform = `translate(${x * f}px,${y * f}px)`;
      const dir = joystickDirection(x, y, 14, controller.joystick);
      controller.run = len > R * 0.6;
      if (dir === null) {
        if (controller.joystick !== null) controller.release();
        arrow.hidden = true;
        return;
      }
      if (controller.joystick !== dir) controller.steer(dir);
      showArrow(dir);
    });
    const end = (e) => {
      if (e.pointerId !== id) return;
      id = null;
      consumeTouch(e);
      stick.hidden = true;
      arrow.hidden = true;
      controller.release();
      controller.run = true;
      if (!moved && e.type === "pointerup" && performance.now() - t0 < 350) {
        const p = turn.toLocal(e.clientX, e.clientY);
        worldTap(p);
      }
    };
    zone.addEventListener("pointerup", end);
    zone.addEventListener("pointercancel", end);
    zone.addEventListener("lostpointercapture", end);
  }
  function showArrow(dir) {
    const [dx, dy] = delta[dir],
      c = player(),
      a = (Math.atan2(dy * 32, dx * 48) * 180) / Math.PI;
    arrow.style.cssText = `left:${c.x}px;top:${c.y + 18}px;transform:translate(-50%,-50%) rotate(${a}deg)`;
    arrow.hidden = false;
  }
  function worldTap(p) {
    if (controller.blocked() || inCombatTouchBounds(p, combatBounds)) return;
    const point = { x: p.x / scale(), y: p.y / scale() },
      goal = b.goal(point),
      actor = b.hit(point),
      me = b.state().me;
    if (controller.aim) {
      controller.cast(controller.aim, goal);
      return;
    }
    if (actor?.kind === "monster" && actor.friendly && actor.master === me.id && !actor.dead)
      controller.selectPet(actor.id);
    else if (actor?.kind === "monster" && !actor.friendly && !actor.dead)
      controller.select(actor.id);
    else if (actor?.kind === "npc" || actor?.kind === "item") controller.interact(actor.id);
    else controller.move(goal);
  }
  const buzz = (ms) => {
    if (prefs.vibrate)
      try {
        navigator.vibrate?.(ms);
      } catch {}
  };
  let markerActorId = 0;
  function updateTargetMarker() {
    const state =
      game() && !hud.hidden
        ? targetMarkerState(
            b.state().actors,
            controller.healTarget || controller.target,
            b.actorPoint,
            { w: W, h: H },
            scale(),
          )
        : null;
    if (!state) {
      if (!tgt.hidden) tgt.hidden = true;
      markerActorId = 0;
      return;
    }
    markerActorId = state.id;
    if (tgt.hidden) tgt.hidden = false;
    for (const key of ["left", "top", "width", "height"]) {
      const value = Math.round(state[key] * 100) / 100 + "px";
      if (tgt.style[key] !== value) tgt.style[key] = value;
    }
    if (tgt.classList.contains("friend") !== state.friend)
      tgt.classList.toggle("friend", state.friend);
    const hpText = tgt.querySelector("em");
    if (hpText.textContent !== state.health) hpText.textContent = state.health;
    const fill = tgt.querySelector("u"),
      width = Math.round(state.percent * 100) / 100 + "%";
    if (fill.style.width !== width) fill.style.width = width;
  }
  function updateHUD() {
    const s = b.state(),
      me = s.me;
    const mounted = !!me.mountUid;
    mountBtn.disabled = me.dead || (!mounted && !me.inventory.some((item) => item && b.itemDef(item.id)?.Type === "Mount"));
    if (mountBtn.getAttribute("aria-pressed") !== String(mounted)) {
      mountBtn.setAttribute("aria-pressed", String(mounted));
      mountBtn.style.color = mounted ? "#ffd45c" : "";
    }
    const buffs = $("#buff-effects");
    if (buffs && buffs.parentElement !== ui.querySelector(".m2-vit"))
      ui.querySelector(".m2-vit").append(buffs);
    {
      const key =
        { Warrior: "face-warrior", Wizard: "face-wizard", Taoist: "face-taoist" }[me.job] ||
        "face-unknown";
      if (vit.face.dataset.k !== key) {
        vit.face.dataset.k = key;
        vit.face.replaceChildren(icon(key, "", "m2-facei"));
      }
    }
    vit.lv.textContent = me.level;
    vit.nm.textContent = me.name;
    bar(vit.hp, me.hp, me.maxHP, me.hp + " / " + me.maxHP);
    bar(vit.mp, me.mp, me.maxMP, me.mp + " / " + me.maxMP);
    vit.hp.classList.toggle("low", me.hp <= me.maxHP * 0.3);
    exp.style.width = Math.max(0, Math.min(100, me.nextXP ? (me.xp * 100) / me.nextXP : 0)) + "%";
    if (lastHP !== null && me.hp < lastHP - Math.max(1, me.maxHP * 0.04)) buzz(25);
    lastHP = me.hp;
    updateTargetMarker();
    const near = s.actors.filter(
      (x) =>
        x.kind === "item" &&
        (!b.groundVisible || b.groundVisible(x)) &&
        Math.max(Math.abs(x.x - me.x), Math.abs(x.y - me.y)) <= 2,
    ).length;
    loot.hidden = !near;
    lootCount.textContent = near > 1 ? String(near) : "";
    lootCount.hidden = near <= 1;
    attack.classList.toggle("on", !!(controller.attacking || controller.force));
    ctx.decoratePrimaryAttack(attack, v1t("attack") + " \xB7 " + t("holdForce"));
    renderBelt();
    renderSkills();
    guideCard();
    fitCard();
    pictureButtons();
    placeTray();
    placeZone();
    watchLoot();
    const lowHP = me.hp <= me.maxHP * 0.3;
    for (const slot of belt.querySelectorAll(".m2-slot[data-key]")) {
      const item = b.quickItems()[Number(slot.dataset.key)];
      const def = item && b.itemDef?.(item.id);
      slot.classList.toggle(
        "warn",
        lowHP &&
          !!def &&
          def.Type === "Potion" &&
          /HP|生命|Health/i.test(JSON.stringify(def.Stats || {}) + def.Name),
      );
    }
  }
  function refreshRelock() {
    relock.hidden = !(
      game() &&
      wantsLock() &&
      !turn.turned &&
      innerWidth > innerHeight &&
      !sheet &&
      !hub &&
      !shownWindows().length
    );
  }
  const tabs = [
    ["role", "tabRole"],
    ["bag", "tabBag"],
    ["skills", "tabSkills"],
    ["quests", "tabQuests"],
    ["map", "tabMap"],
  ];
  function fitNativePanel(panel) {
    if (!panel?.isConnected) return;
    const keepHud =
      b.inspectionCombatHud &&
      ["win-bag", "win-character", "win-monster-affixes", "win-forge"].includes(panel.id) &&
      ctx.continueInspectionAttack();
    const available = keepHud ? Math.min(W - 24, Math.max(260, W - 220)) : W - 24;
    const width = panel.offsetWidth || parseFloat(getComputedStyle(panel).width) || 356,
      scale2 = Math.min(1, available / width);
    for (const [key, value] of [
      ["--classic-scale", String(scale2)],
      ["--classic-height", Math.max(120, (H - 24) / scale2) + "px"],
    ])
      if (panel.style.getPropertyValue(key) !== value) panel.style.setProperty(key, value);
  }
  function decorateNativePanel(panel) {
    if (!panel?.isConnected) return;
    fitNativePanel(panel);
  }
  function openNativePanel(tab) {
    const name = tab === "role" ? "character" : tab,
      id = "win-" + name;
    const preserveAttack =
      b.preserveInspectionAttack &&
      ((tab === "map" && b.preserveMapAttack !== false) ||
        ["role", "skills", "quests"].includes(tab) ||
        (tab === "bag" && b.itemMode() === "use"));
    closeDetail();
    closeHub();
    closeSheet();
    if (preserveAttack) controller.inspectPanel();
    else controller.clear();
    const existing = $("#" + id);
    if (existing) {
      existing.classList.add("m2-full", "m2-native", "mobile-classic");
      $("#windows").append(existing);
      decorateNativePanel(existing);
      refreshVisibility();
      return;
    }
    fullPanel = id;
    b.open(name);
  }
  function openSheet(tab, sel = null, { keepWindows = false } = {}) {
    if (["role", "bag", "skills", "quests", "map"].includes(tab)) {
      openNativePanel(tab);
      return;
    }
    closeHub();
    closeDetail();
    controller.clear();
    const keep = keepWindows || (tab === "bag" && !!$("#win-shop,#win-storage,#win-forge"));
    if (!keep)
      $("#windows")
        .querySelectorAll(".window")
        .forEach((w) => w.querySelector(".close")?.click());
    sheet = { tab, sel, filter: sheet?.tab === tab ? sheet.filter : "all", stamp: "", keep };
    renderSheet(true);
  }
  function closeSheet() {
    if (!sheet) return;
    sheet = null;
    sheetEl.hidden = true;
    sheetEl.replaceChildren();
    const bag = $("#win-bag");
    if (bag && !bag.classList.contains("m2-full") && !$("#win-shop,#win-storage"))
      bag.querySelector(".close")?.click();
    refreshVisibility();
  }
  function sheetFrame() {
    sheetEl.hidden = false;
    sheetEl.replaceChildren();
    const head = el("div", "m2-tabs");
    for (const [key, label] of tabs)
      button(t(label), () => openSheet(key), head, {
        className: "m2-tab" + (sheet.tab === key ? " on" : ""),
      });
    if (b.equipmentTitle?.())
      button(
        b.equipmentTitle(),
        () => {
          closeSheet();
          b.equipment();
        },
        head,
        { className: "m2-tab" },
      );
    const trade = $("#win-shop,#win-storage,#win-forge");
    if (trade)
      button(
        trade.querySelector("h2")?.textContent || "",
        () => {
          sheet = null;
          sheetEl.hidden = true;
          sheetEl.replaceChildren();
          refreshVisibility();
        },
        head,
        { className: "m2-tab m2-back" },
      );
    const me = b.state().me;
    head.append(
      el("div", "m2-gold", t("goldLabel", { gold: Number(me.gold || 0).toLocaleString(b.locale) })),
    );
    button("\u2715", closeSheet, head, { className: "m2-x" }).setAttribute(
      "aria-label",
      v1t("close"),
    );
    const body = el("div", "m2-body");
    sheetEl.append(head, body);
    return body;
  }
  function renderSheet(force) {
    if (!sheet || !game()) {
      closeSheet();
      return;
    }
    const me = b.state().me,
      stamp = sheetStateKey(sheet, me, b.itemMode?.());
    if (!force && stamp === sheet.stamp) return;
    sheet.stamp = stamp;
    const scroll = sheetEl.querySelector(".m2-grid,.m2-slist")?.scrollTop || 0;
    const body = sheetFrame();
    if (sheet.tab === "bag") bagView(body);
    else if (sheet.tab === "role") roleView(body);
    else skillsView(body);
    const again = sheetEl.querySelector(".m2-grid,.m2-slist");
    if (again) again.scrollTop = scroll;
    refreshVisibility();
  }
  const equipType = (def) => def && b.equipSlots && def.Type in b.equipSlots;
  const category = (def) =>
    !def
      ? "material"
      : equipType(def)
        ? "equipment"
        : def.Type === "Potion"
          ? "potion"
          : ["Quest"].includes(def.Type)
            ? "quest"
            : "material";
  const colorCache = /* @__PURE__ */ new Map();
  function itemColor(item) {
    const key =
      item.uid +
      ":" +
      (item.added ? JSON.stringify(item.added) : "") +
      (item.dx ? JSON.stringify(item.dx) : "");
    if (colorCache.has(key)) return colorCache.get(key);
    let c = "";
    try {
      c = (b.itemText(item).match(/<b[^>]*color:\s*([^;"']+)/) || [])[1] || "";
    } catch {}
    colorCache.set(key, c);
    return c;
  }
  function cell(item, onTap, selected) {
    const node = el("button", "m2-cell" + (item ? " it" : "") + (selected ? " sel" : ""));
    node.type = "button";
    if (item) {
      const c = el("canvas");
      c.width = 36;
      c.height = 36;
      node.append(c);
      drawItem(c, item);
      if (item.count > 1) node.append(el("em", "", String(item.count)));
      const col = itemColor(item);
      if (col) node.style.setProperty("--c", col);
      node.setAttribute("aria-label", b.itemName(item));
    }
    if (onTap) {
      node.onclick = onTap;
    }
    return node;
  }
  function tipPane(parent, item) {
    const tip = el("div", "m2-tip");
    tip.innerHTML = b.itemText(item);
    parent.append(tip);
    requestAnimationFrame(() => {
      if (tip.scrollHeight > tip.clientHeight + 8) tip.classList.add("two");
    });
    return tip;
  }
  function bagView(body) {
    const me = b.state().me,
      left = el("div", "m2-left"),
      right = el("div", "m2-right");
    body.append(left, right);
    const chips = el("div", "m2-chips");
    for (const f of ["all", "equipment", "potion", "material", "quest"])
      button(
        t(f),
        () => {
          sheet.filter = f;
          renderSheet(true);
        },
        chips,
        { className: "m2-chip" + (sheet.filter === f ? " on" : "") },
      );
    left.append(chips);
    const grid = el("div", "m2-grid");
    left.append(grid);
    const list =
      sheet.filter === "quest"
        ? (me.questInventory || []).map((item2, slot) => ({ item: item2, slot, type: "quest" }))
        : me.inventory.map((item2, slot) => ({ item: item2, slot, type: "inventory" }));
    for (const { item: item2, slot, type } of list) {
      if (
        sheet.filter !== "all" &&
        sheet.filter !== "quest" &&
        (!item2 || category(b.itemDef?.(item2.id)) !== sheet.filter)
      )
        continue;
      if (sheet.filter === "quest" && !item2) continue;
      grid.append(
        cell(
          item2,
          item2
            ? () => {
                sheet.sel = { uid: item2.uid, type };
                renderSheet(true);
              }
            : null,
          item2 && sheet.sel?.uid === item2.uid,
        ),
      );
    }
    const foot = el("div", "m2-foot");
    foot.append(
      el(
        "span",
        "",
        t("bagUsed", { used: me.inventory.filter(Boolean).length, total: me.inventory.length }),
      ),
    );
    const fb = el("span", "m2-seg");
    button(
      t("fullPanel"),
      () => {
        closeSheet();
        fullPanel = "win-bag";
        b.open("bag");
      },
      fb,
      { className: "m2-chip" },
    );
    button(t("sort"), () => b.command("SortInventory", {}), fb, { className: "m2-chip" });
    foot.append(fb);
    left.append(foot);
    const found =
      sheet.sel &&
      (sheet.sel.type === "quest" ? me.questInventory : me.inventory).findIndex(
        (i) => i?.uid === sheet.sel.uid,
      );
    if (!sheet.sel || found < 0) {
      right.append(el("p", "m2-empty", t("noItem")));
      return;
    }
    const item = (sheet.sel.type === "quest" ? me.questInventory : me.inventory)[found];
    if (sheet.compare) {
      compareView(body, item, found);
      return;
    }
    tipPane(right, item);
    if (sheet.sel.type === "quest") return;
    const def = b.itemDef?.(item.id),
      acts = el("div", "m2-acts"),
      mode = b.itemMode?.();
    right.append(acts);
    const act = (label, fn, cls = "m2-btn2") =>
      button(
        label,
        async () => {
          if (!b.state().me.inventory.some((i) => i?.uid === item.uid)) return;
          await fn();
        },
        acts,
        { className: cls },
      );
    if (mode === "store")
      act(v1t("store"), () => b.transfer("StoreItem", found, item.uid), "m2-btn");
    else if (mode === "sell") act(v1t("sell"), () => inventoryDetail(found, "inventory"), "m2-btn");
    else if (mode === "repair" || mode === "specialRepair")
      act(
        v1t("repair"),
        () => b.command(mode === "repair" ? "RepairItem" : "SRepairItem", { UniqueID: item.uid }),
        "m2-btn",
      );
    else if (equipType(def)) act(t("equip"), () => b.use(item), "m2-btn");
    else if (
      def &&
      !["Quest", "Material", "ForgeMaterial", "Ore", "Meat", "DxEssence", "Rune", "Gem"].includes(
        def.Type,
      )
    )
      act(def.Type === "Book" ? t("learn") : t("useItem"), () => b.use(item), "m2-btn");
    if (b.shareEquipment && b.shareable?.(item))
      act(b.t("share.equipment"), () =>
        b.shareEquipment(item.uid, me.id),
      ).dataset.mobileShareEquipment = String(item.uid);
    if (equipType(def)) {
      if (b.compare)
        act(t("compare"), () => {
          closeSheet();
          b.compare(item.uid);
        });
      else
        act(t("compare"), () => {
          sheet.compare = { side: 0 };
          renderSheet(true);
        });
    }
    act(t("quick"), () => bindSlots(null, item.uid));
    act("\xB7\xB7\xB7", () => inventoryDetail(found, "inventory")).setAttribute(
      "aria-label",
      t("more"),
    );
  }
  function setSummary(equipment, slot, item) {
    if (!b.setStates || slot === void 0) return "";
    const after = [...equipment];
    after[slot] = item;
    let before = [],
      now = [];
    try {
      before = b.setStates(equipment);
      now = b.setStates(after);
    } catch {
      return "";
    }
    const ids = new Set([...before, ...now].map((x) => x.id)),
      parts = [];
    for (const id of ids) {
      const a = before.find((x) => x.id === id),
        c = now.find((x) => x.id === id),
        from = a?.count || 0,
        to = c?.count || 0,
        set = c || a,
        total = set.total || set.members?.reduce((n, m) => n + m.count, 0) || 0;
      if (from === to) continue;
      const on = set.effects.filter((e) => e.count > from && e.count <= to).map((e) => e.count),
        off = set.effects.filter((e) => e.count <= from && e.count > to).map((e) => e.count);
      let name = id;
      try {
        name = b.setName?.(id) || id;
      } catch {}
      parts.push(
        t("setAfter", { name, count: to, total }) +
          (on.length ? " \xB7 " + t("setOn", { n: [...new Set(on)].join("/") }) : "") +
          (off.length ? " \xB7 " + t("setOff", { n: [...new Set(off)].join("/") }) : ""),
      );
    }
    return parts.join("\uFF1B");
  }
  function wornFor(def) {
    if (!def || !b.equipSlots) return [];
    let base2 = def.DreamType === 6 ? 14 : b.equipSlots[def.Type];
    if (base2 === void 0) return [];
    return ["Ring", "Bracelet"].includes(def.Type) ? [base2, base2 + 1] : [base2];
  }
  function compareView(body, item, slot) {
    body.replaceChildren();
    body.classList.add("cmp");
    const me = b.state().me,
      def = b.itemDef?.(item.id),
      slots = wornFor(def),
      side = Math.min(sheet.compare.side || 0, slots.length - 1),
      worn = me.equipment[slots[side]];
    const cols = el("div", "m2-cmpcols");
    body.append(cols);
    const a = el("div", "m2-cmpcol"),
      c = el("div", "m2-cmpcol");
    cols.append(a, c);
    const ah = el("div", "m2-cmphd", t("wearing"));
    a.append(ah);
    if (slots.length > 1) {
      const seg = el("span", "m2-seg");
      slots.forEach((s2, i) =>
        button(
          b.t("character.slot." + s2),
          () => {
            sheet.compare.side = i;
            renderSheet(true);
          },
          seg,
          { className: "m2-chip" + (i === side ? " on" : "") },
        ),
      );
      ah.append(seg);
    }
    if (worn) tipPane(a, worn);
    else a.append(el("p", "m2-empty", t("nothingWorn")));
    c.append(el("div", "m2-cmphd", t("inBag")));
    tipPane(c, item);
    const barEl = el("div", "m2-cmpbar");
    body.append(barEl);
    button(
      v1t("back"),
      () => {
        sheet.compare = null;
        renderSheet(true);
      },
      barEl,
      { className: "m2-btn2" },
    );
    barEl.append(el("span", "m2-grow m2-note", setSummary(me.equipment, slots[side], item)));
    button(
      t("equipReplace"),
      async () => {
        await b.use(item);
        sheet.compare = null;
        renderSheet(true);
      },
      barEl,
      { className: "m2-btn" },
    );
  }
  const dollLeft = [0, 1, 5, 7],
    dollRight = [2, 4, 6, 8],
    dollBottom = [3, 9, 10, 11, 12, 13, 14];
  function roleView(body) {
    const me = b.state().me,
      left = el("div", "m2-doll"),
      right = el("div", "m2-right m2-stats");
    body.append(left, right);
    const art = el("div", "m2-art");
    art.style.backgroundImage = `url(${new URL("assets/entry/" + me.job + "-" + me.gender + ".webp", document.baseURI).href})`;
    left.append(art);
    const colL = el("div", "m2-col l"),
      colR = el("div", "m2-col r"),
      row = el("div", "m2-row");
    left.append(colL, colR, row);
    const slotCell = (i, parent) => {
      const item =
        i === 13
          ? me.inventory.find((x) => x?.uid === me.mountUid) || me.equipment[13]
          : me.equipment[i];
      const wrap = el("div", "m2-eq");
      const node = cell(
        item,
        () => {
          sheet.sel = { slot: i };
          renderSheet(true);
        },
        sheet.sel?.slot === i,
      );
      wrap.append(node, el("small", "", b.t("character.slot." + i)));
      parent.append(wrap);
    };
    dollLeft.forEach((i) => slotCell(i, colL));
    dollRight.forEach((i) => slotCell(i, colR));
    dollBottom.forEach((i) => slotCell(i, row));
    if (sheet.sel?.slot !== void 0) {
      const i = sheet.sel.slot,
        item =
          i === 13
            ? me.inventory.find((x) => x?.uid === me.mountUid) || me.equipment[13]
            : me.equipment[i];
      if (item) {
        tipPane(right, item);
        const acts2 = el("div", "m2-acts");
        right.append(acts2);
        if (i === 13)
          button(t("toggleMount"), () => b.command("ToggleMount"), acts2, { className: "m2-btn" });
        else
          button(
            t("unequip"),
            () => {
              const to = b.freeSlot(item);
              if (to >= 0)
                b.command("RemoveItem", { Grid: "Inventory", UniqueID: item.uid, To: to });
            },
            acts2,
            { className: "m2-btn" },
          );
        if (b.shareEquipment && b.shareable?.(item))
          button(b.t("share.equipment"), () => b.shareEquipment(item.uid, me.id), acts2, {
            className: "m2-btn2",
          }).dataset.mobileShareEquipment = String(item.uid);
        if (b.shareCharacter)
          button(b.t("share.character"), () => b.shareCharacter(me.id), acts2, {
            className: "m2-btn2",
          }).dataset.mobileShareCharacter = "";
        button(
          v1t("back"),
          () => {
            sheet.sel = null;
            renderSheet(true);
          },
          acts2,
          { className: "m2-btn2" },
        );
        return;
      }
    }
    const st = me.stats || {},
      range = (k) => (st["Min" + k] || 0) + "\u2013" + (st["Max" + k] || 0),
      atk = { Warrior: "DC", Wizard: "MC", Taoist: "SC" }[me.job] || "DC";
    const keys = el("div", "m2-keys");
    right.append(el("h3", "", t("keyStats")), keys);
    for (const [label, value] of [
      [b.t("character." + atk), range(atk)],
      ["HP", me.hp + " / " + me.maxHP],
      [b.t("character.AC"), range("AC")],
      [b.t("character.MAC"), range("MAC")],
    ]) {
      const kv = el("div", "m2-kv");
      kv.append(el("small", "", label), el("b", "", value));
      keys.append(kv);
    }
    const list = el("div", "m2-statlist");
    right.append(list);
    for (const [k, u] of [
      ["Accuracy"],
      ["Agility"],
      ["PhysicalDodgePercent", "%"],
      ["MagicDodgePercent", "%"],
      ["Luck"],
      ["AttackSpeed"],
      ["CastSpeed"],
      ["HandWeight"],
      ["NativeMoveSpeed"],
    ]) {
      list.append(el("span", "", b.t("character." + k)), el("span", "", (st[k] || 0) + (u || "")));
    }
    const acts = el("div", "m2-acts");
    right.append(acts);
    if (b.shareCharacter)
      button(b.t("share.character"), () => b.shareCharacter(me.id), acts, {
        className: "m2-btn2",
      }).dataset.mobileShareCharacter = "";
    button(
      t("fullPanel"),
      () => {
        closeSheet();
        fullPanel = "win-character";
        b.open("character");
      },
      acts,
      { className: "m2-btn2" },
    );
  }
  function skillsView(body) {
    const me = b.state().me,
      left = el("div", "m2-left"),
      right = el("div", "m2-right");
    body.append(left, right);
    const list = el("div", "m2-slist");
    left.append(list);
    if (!me.skills.length) list.append(el("p", "m2-empty", t("noSkill")));
    for (const sk of me.skills) {
      const mode2 = spellMode(sk.Spell) || "unavailable";
      const row = button(
        "",
        () => {
          sheet.sel = { spell: sk.Spell };
          renderSheet(true);
        },
        list,
        { className: "m2-srow" + (sheet.sel?.spell === sk.Spell ? " sel" : "") },
      );
      const c = el("canvas");
      c.width = 36;
      c.height = 36;
      b.skillIcon(c, sk.Spell);
      const icon2 = el("span", "m2-si");
      icon2.append(c);
      const nm = el("span", "m2-sn", b.skillName(sk.Spell) + " Lv." + (sk.Level ?? ""));
      nm.append(el("small", "", t("skillType_" + mode2)));
      row.append(
        icon2,
        nm,
        el(
          "span",
          "m2-key" + (sk.Key ? "" : " none"),
          sk.Key
            ? t("onKey", { key: sk.Key })
            : mode2 === "passive"
              ? t("passiveTag")
              : t("notPlaced"),
        ),
      );
    }
    const sel = sheet.sel?.spell && me.skills.find((s) => s.Spell === sheet.sel.spell);
    if (!sel) {
      right.append(el("p", "m2-empty", t("noSkill")));
      return;
    }
    const detail = el("div", "m2-tip m2-skilltip");
    right.append(detail);
    try {
      b.skillDetails(sel.Spell, detail);
    } catch {
      detail.textContent = b.skillName(sel.Spell);
    }
    const mode = spellMode(sel.Spell);
    if (mode === "passive" || mode === "unavailable" || !mode) return;
    right.append(el("div", "m2-note", t("assignTo")));
    const grid = el("div", "m2-assign");
    right.append(grid);
    for (let key = 1; key <= 8; key++) {
      const on = me.skills.find((s) => s.Key === key);
      const n = button(
        "",
        async () => {
          await b.command("MagicKey", { Spell: sel.Spell, Key: key, OldKey: sel.Key || 0 });
        },
        grid,
        { className: "m2-slotkey" + (on ? " used" : "") + (sel.Key === key ? " mine" : "") },
      );
      if (on) {
        const c = el("canvas");
        c.width = 36;
        c.height = 36;
        try {
          b.skillIcon(c, on.Spell);
        } catch {}
        n.append(c);
      }
      n.append(el("small", "", String(key)));
      n.setAttribute(
        "aria-label",
        v1t("skills") + " " + key +
          (on ? " \xB7 " + b.skillName(on.Spell) : ""),
      );
    }
    const acts = el("div", "m2-acts");
    right.append(acts);
    if (sel.Key)
      button(
        t("takeOff"),
        () => b.command("MagicKey", { Spell: sel.Spell, Key: 0, OldKey: sel.Key }),
        acts,
        { className: "m2-btn2" },
      );
  }
  function openHub(view = "tiles") {
    closeSheet();
    closeDetail();
    if (b.preserveInspectionAttack) controller.inspectPanel();
    else controller.clear();
    hub = { view };
    renderHub();
  }
  function closeHub() {
    if (!hub) return;
    hub = null;
    hubEl.hidden = true;
    hubEl.replaceChildren();
    refreshVisibility();
  }
  function renderHub() {
    hubEl.hidden = false;
    hubEl.replaceChildren();
    const me = b.state().me;
    const hd = el("div", "m2-hubhd");
    hd.append(
      el("b", "", hub.view === "settings" ? t("settings") : v1t("menu")),
      el("span", "", me.name + " \xB7 Lv." + me.level),
    );
    button("\u2715", closeHub, hd, { className: "m2-x" });
    hubEl.append(hd);
    if (hub.view === "settings") {
      settingsView();
      return;
    }
    const tiles = el("div", "m2-tiles");
    hubEl.append(tiles);
    const tile = (label, sub, fn, name) => {
      const n = button("", fn, tiles, { className: "m2-tile" });
      n.append(icon(name, "\u25C6"), el("span", "", label));
      if (sub) n.append(el("small", "", sub));
    };
    tile(
      t("tabBag"),
      t("bagUsed", { used: me.inventory.filter(Boolean).length, total: me.inventory.length }),
      () => openSheet("bag"),
      "bag",
    );
    tile(t("tabRole"), "", () => openSheet("role"), "character");
    tile(t("tabSkills"), "", () => openSheet("skills"), "skills");
    tile(t("shortcutSettings"), "", () => openBindings(), "belt");
    tile(t("tabQuests"), "", () => openSheet("quests"), "quests");
    tile(t("tabMap"), "", () => openSheet("map"), "map");
    tile(
      b.forgeTitle?.() || t("forge"),
      "",
      () => {
        closeHub();
        b.open("forge");
      },
      "forge",
    );
    tile(
      t("assist"),
      "",
      () => {
        closeHub();
        b.open("assist");
      },
      "assist",
    );
    const autoBattle = $("#auto-battle-launch");
    if (autoBattle)
      tile(
        autoBattle.textContent,
        "",
        () => {
          closeHub();
          autoBattle.click();
        },
        "attack",
      );
    tile(
      t("pet"),
      "",
      () => {
        closeHub();
        petMenu();
      },
      "pet",
    );
    if (
      b.monsterDetails &&
      b
        .state()
        .actors.some(
          (a) => a.id === controller.target && a.monsterAffixes?.length && !a.friendly && !a.dead,
        )
    )
      tile(
        { "zh-CN": "\u602A\u7269\u8BCD\u7F00", en: "Monster modifiers", es: "Modificadores" }[
          b.locale
        ] || "Monster modifiers",
        "",
        () => {
          closeHub();
          b.monsterDetails(controller.target);
        },
        "target",
      );
    tile(
      t("mount"),
      "",
      () => {
        closeHub();
        b.command("ToggleMount");
      },
      "mount",
    );
    const board = $("#hud-leaderboard");
    if (board)
      tile(
        t("leaderboard"),
        "",
        () => {
          closeHub();
          board.click();
        },
        "ranking",
      );
    if (b.equipmentTitle?.())
      tile(
        b.equipmentTitle(),
        "",
        () => {
          closeHub();
          b.equipment();
        },
        "workshop",
      );
    tile(
      v1t("force"),
      "",
      () => {
        closeHub();
        controller.forceAttack();
      },
      "force",
    );
    const sys = el("div", "m2-sysrow");
    hubEl.append(sys);
    button(
      t("settings"),
      () => {
        hub.view = "settings";
        renderHub();
      },
      sys,
      { className: "m2-btn2" },
    ).prepend(icon("settings", ""));
    button(
      t("system"),
      () => {
        closeHub();
        b.open("system");
      },
      sys,
      { className: "m2-btn2" },
    ).prepend(icon("system", ""));
    if (document.fullscreenEnabled)
      button(
        t("fullscreen"),
        () => {
          lockLandscape().then((ok) => {
            if (!ok) document.documentElement.requestFullscreen?.().catch(() => {});
          });
        },
        sys,
        { className: "m2-btn2" },
      ).prepend(icon("fullscreen", ""));
    button(
      t("switchPC"),
      async () => {
        await b.manageSave();
        try {
          localStorage.setItem("backmir.controls", "desktop");
        } catch {}
        const u = new URL(location.href);
        u.searchParams.set("controls", "desktop");
        u.searchParams.delete("ui");
        location.assign(u);
      },
      sys,
      { className: "m2-btn2" },
    );
  }
  function settingsView() {
    const box = el("div", "m2-settings");
    hubEl.append(box);
    b.audioSettings?.(box);
    const seg = (label, key, options) => {
      const row2 = el("div", "m2-setrow");
      row2.append(el("span", "", label));
      const g2 = el("span", "m2-seg");
      for (const [v, l] of options)
        button(
          l,
          () => {
            prefs[key] = v;
            savePrefs(prefs);
            applyPrefs();
            ctx.layout();
            turn.apply();
            renderHub();
          },
          g2,
          { className: "m2-chip" + (prefs[key] === v ? " on" : "") },
        );
      row2.append(g2);
      box.append(row2);
    };
    if (primaryAttackChoices(b.state().me).length) {
      const row2 = el("label", "m2-setrow");
      row2.append(el("span", "", t("primaryAttack")), ctx.primaryAttackSetting());
      box.append(row2);
    }
    seg(t("hand"), "hand", [
      ["right", t("handRight")],
      ["left", t("handLeft")],
    ]);
    {
      const row2 = el("div", "m2-setrow");
      row2.append(el("span", "", viewText(b.locale, "view")));
      const group = el("span", "m2-seg");
      for (const mode of VIEW_MODES) {
        const node = button(
          viewText(b.locale, mode),
          () => {
            ctx.setViewMode(mode);
            renderHub();
          },
          group,
          { className: "m2-chip" + (ctx.viewMode() === mode ? " on" : "") },
        );
        node.dataset.worldView = mode;
        node.setAttribute("aria-pressed", String(ctx.viewMode() === mode));
      }
      row2.append(group);
      box.append(row2);
    }
    seg(t("size"), "size", [
      ["s", t("small")],
      ["m", t("medium")],
      ["l", t("large")],
    ]);
    seg(t("opacity"), "alpha", [
      [1, "100%"],
      [0.8, "80%"],
      [0.6, "60%"],
    ]);
    seg(t("turn"), "turn", [
      ["right", t("turnRight")],
      ["left", t("turnLeft")],
    ]);
    if ("vibrate" in navigator)
      seg(t("vibrate"), "vibrate", [
        [true, t("on")],
        [false, t("off")],
      ]);
    const row = el("div", "m2-setrow");
    row.append(el("span", "", t("uiVersion")));
    const g = el("span", "m2-seg");
    button(
      t("uiOldSwitch"),
      async () => {
        await b.manageSave();
        location.assign(mobileUIHref("m1"));
      },
      g,
      { className: "m2-chip" },
    );
    row.append(g);
    box.append(row);
    const back = el("div", "m2-sysrow");
    hubEl.append(back);
    button(
      v1t("back"),
      () => {
        hub.view = "tiles";
        renderHub();
      },
      back,
      { className: "m2-btn2" },
    );
  }
  function refreshVisibility() {
    const windows = shownWindows().length > 0,
      g = game();
    const blocked = !g || !!sheet || !!hub || !!bindingEditor?.body.isConnected;
    const inspection =
      g &&
      !sheet &&
      !bindingEditor?.body.isConnected &&
      !$("#win-map,#win-skills,#win-quests") &&
      (windows || hub) &&
      b.inspectionCombatHud &&
      ctx.continueInspectionAttack();
    doc.toggleAttribute("data-m2-combat-inspection", !!inspection);
    hud.hidden = (blocked || windows) && !inspection;
    if (hud.hidden) cancelGestures();
    doc.toggleAttribute("data-m2-sheet", !!sheet || !!hub);
    refreshRelock();
  }
  const shownWindows = () =>
    [...$("#windows").querySelectorAll(".window")].filter(
      (w) =>
        !(
          ["win-bag", "win-character", "win-skills"].includes(w.id) &&
          !w.classList.contains("m2-full")
        ),
    );
  new MutationObserver(() => {
    if (hub && shownWindows().length) closeHub();
    if (sheet && !sheet.keep && shownWindows().length) closeSheet();
    if (sheet?.keep && !$("#win-shop,#win-storage,#win-forge,#win-bag")) closeSheet();
    refreshVisibility();
  }).observe($("#windows"), { childList: true });
  let fullPanel = null;
  document.addEventListener(
    "click",
    (e) => {
      if (e.target.closest?.("#enter-role,#confirm-create,.create-actions button"))
        void lockLandscape().then(() =>
          setTimeout(() => {
            ctx.layout();
            refreshRelock();
          }, 300),
        );
    },
    true,
  );
  document.addEventListener("fullscreenchange", () =>
    setTimeout(() => {
      ctx.layout();
      refreshRelock();
    }, 200),
  );
  const baseShop = hooks.shop;
  hooks.shop = (node, html, buy) => {
    const holder = document.createElement("div");
    holder.innerHTML = html || "";
    const name = holder.querySelector("b")?.textContent || "",
      priceText = holder.querySelector(".shop-price")?.textContent || "",
      price = Number((priceText.match(/[\d,.]+/) || ["0"])[0].replace(/[,.](?=\d{3}\b)/g, "")) || 0;
    node.classList.add("m2-shoprow");
    const label = el("span", "m2-shopname", name),
      cost = el("span", "m2-price", priceText);
    node.append(label, cost);
    node.onclick = () => purchase(name, html, price, buy, node.dataset.mobileBulk === "true");
  };
  function purchase(name, html, price, buy, bulk) {
    const body = dialog(name);
    body.classList.add("m2-buy");
    const tip = el("div", "m2-tip");
    tip.innerHTML = html;
    tip.lastElementChild?.remove();
    body.append(tip);
    let n = 1;
    const gold = () => b.state().me.gold,
      most = () => Math.max(1, Math.min(bulk ? 999 : 1, price ? Math.floor(gold() / price) : 999));
    const step = el("div", "m2-step"),
      val = el("span", "m2-val", "1");
    const total = el("div", "m2-note");
    const go = el("div");
    const refresh = () => {
      val.textContent = String(n);
      total.textContent = price ? t("total", { gold: (n * price).toLocaleString(b.locale) }) : "";
      buyBtn.textContent = t("buyCount", { n });
    };
    if (bulk) {
      button(
        "\u2212",
        () => {
          n = Math.max(1, n - 1);
          refresh();
        },
        step,
      );
      step.append(val);
      button(
        "+",
        () => {
          n = Math.min(most(), n + 1);
          refresh();
        },
        step,
      );
      body.append(step);
      const q = el("div", "m2-qchips");
      for (const [value, label] of [
        [1, "\xD71"],
        [10, "\xD710"],
        [20, "\xD720"],
        [100, "\xD7100"],
        [0, t("max")],
      ]) {
        const preset = button(
          label,
          () => {
            n = Math.min(value || most(), most());
            refresh();
          },
          q,
          { className: "m2-chip" },
        );
        if (value === 100) preset.disabled = most() < 100;
      }
      body.append(q);
    }
    body.append(total, go);
    const buyBtn = button(
      "",
      async () => {
        if (buyBtn.disabled) return;
        buyBtn.disabled = true;
        closeDetail();
        await buy({ shiftKey: false, purchaseCount: n });
      },
      go,
      { className: "m2-btn" },
    );
    refresh();
  }
  void baseShop;
  function guideCard() {
    doc.toggleAttribute("data-m2-fighting", !!(controller.attacking || controller.force));
    for (const selector of ["#novice-guide", "#quest-tracker"]) {
      const card = $(selector),
        summary = card?.querySelector("summary");
      if (!summary) continue;
      if (!card.dataset.m2Compact) {
        card.dataset.m2Compact = "1";
        card.open = false;
        card.addEventListener("toggle", () => {
          placeZone();
          fitCard();
        });
      }
      let label = summary.querySelector(".m2-guide-title");
      if (!label) {
        const full = summary.textContent.trim(),
          prefix = b.t(selector === "#novice-guide" ? "novice.title" : "quest.track.title");
        label = el(
          "span",
          "m2-guide-title",
          full.startsWith(prefix) ? full.slice(prefix.length).replace(/^[ ·:：]+/, "") : full,
        );
        label.title = full;
        summary.replaceChildren(label);
      }
      let progress = summary.querySelector(".m2-guide-progress");
      if (!progress) {
        progress = el("span", "m2-guide-progress");
        summary.append(progress);
      }
      const counts = guideProgress(
        card.querySelector(".quest-track-progress")?.textContent ||
          card.querySelector(":scope>p")?.textContent,
      );
      if (progress.textContent !== counts) progress.textContent = counts;
      progress.hidden = !counts;
      progress.title = counts;
    }
  }
  let lastNpc = 0;
  {
    const cb = controller.b,
      orig = cb.npc;
    cb.npc = (id) => {
      lastNpc = id;
      orig?.(id);
    };
  }
  function npcHeader(panel) {
    const s = b.state(),
      me = s?.me;
    if (!me) return;
    let a = s.actors.find((x) => x.id === lastNpc && x.kind === "npc");
    if (!a || Math.max(Math.abs(a.x - me.x), Math.abs(a.y - me.y)) > 4)
      a = s.actors
        .filter((x) => x.kind === "npc")
        .sort(
          (p, q) =>
            Math.max(Math.abs(p.x - me.x), Math.abs(p.y - me.y)) -
            Math.max(Math.abs(q.x - me.x), Math.abs(q.y - me.y)),
        )[0];
    if (!a || panel.querySelector(".m2-npchd")) return;
    const name = b.actorName ? b.actorName(a) : a.name,
      hd = el("div", "m2-npchd");
    const face = el("span", "m2-npcface");
    face.append(icon("npc", ""));
    hd.append(face, el("b", "", name));
    panel.querySelector("h2")?.after(hd);
  }
  const toasts = el("div", "m2-toasts");
  ui.append(toasts);
  let seen = null,
    seenKey = "";
  function watchLoot() {
    const s = b.state(),
      me = s.me,
      key = s.epoch + ":" + me.id,
      now = /* @__PURE__ */ new Map();
    for (const i of [...me.inventory, ...(me.questInventory || [])]) if (i) now.set(i.uid, i);
    if (key !== seenKey || !seen) {
      seen = now;
      seenKey = key;
      return;
    }
    if (sheet || $("#win-shop,#win-storage,#win-npc,#win-forge")) {
      seen = now;
      return;
    }
    for (const [uid, i] of now) {
      const old = seen.get(uid),
        gained = old ? (i.count || 1) - (old.count || 1) : i.count || 1;
      if (gained > 0) toast(i, gained);
    }
    seen = now;
  }
  const notes = el("div", "m2-notes");
  ui.append(notes);
  function note(msg) {
    const node = el("div", "m2-toast note");
    node.append(el("b", "", msg));
    notes.replaceChildren(node);
    setTimeout(() => node.remove(), 4200);
  }
  function toast(item, n) {
    const node = el("div", "m2-toast");
    const col = itemColor(item);
    if (col) node.style.setProperty("--c", col);
    node.append(el("b", "", b.itemName(item)), el("span", "", n > 1 ? " \xD7" + n : ""));
    toasts.prepend(node);
    while (toasts.children.length > 3) toasts.lastChild.remove();
    setTimeout(() => node.remove(), 3200);
  }
  const baseUpdate = hooks.update,
    basePanel = hooks.panelOpen,
    baseMarkers = hooks.positionMarkers;
  hooks.update = () => {
    baseUpdate();
    if (!game()) {
      if (sheet) closeSheet();
      if (hub) closeHub();
      refreshVisibility();
      turn.apply();
      return;
    }
    turn.apply();
    renderBindings();
    updateHUD();
    if (sheet) renderSheet(false);
    for (const panel of $("#windows").querySelectorAll(".m2-native")) decorateNativePanel(panel);
    refreshVisibility();
  };
  hooks.panelOpen = (panel) => {
    const id = panel?.id;
    if (
      [
        "win-bag",
        "win-character",
        "win-skills",
        "win-quests",
        "win-map",
        "win-forge",
        "win-monster-affixes",
      ].includes(id)
    ) {
      panel.classList.add("m2-full", "m2-native", "mobile-classic");
      fullPanel = null;
      queueMicrotask(() => decorateNativePanel(panel));
    }
    if (id !== "win-bag") {
      closeHub();
      if (!(sheet?.keep && ["win-shop", "win-storage", "win-forge", "win-npc"].includes(id)))
        closeSheet();
    }
    basePanel(panel);
    if (id === "win-npc") npcHeader(panel);
    if (
      !panel.classList.contains("m2-native") &&
      ["win-quests", "win-map"].includes(id) &&
      !panel.querySelector(".m2-wintabs")
    ) {
      const nav2 = el("div", "m2-wintabs");
      for (const [key, label] of tabs)
        button(
          t(label),
          () => {
            if (key === id.slice(4)) return;
            panel.querySelector(".close")?.click();
            openSheet(key);
          },
          nav2,
          { className: "m2-tab" + (key === id.slice(4) ? " on" : "") },
        );
      panel.querySelector("h2")?.after(nav2);
    }
    if (["win-shop", "win-storage", "win-forge"].includes(id)) {
      const own = [...panel.querySelectorAll("button")].find(
        (x) =>
          !x.classList.contains("m2-shoprow") &&
          x.textContent.replace(/\s/g, "") === t("tabBag").replace(/\s/g, ""),
      );
      if (own)
        own.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          openSheet("bag");
        };
    }
    refreshVisibility();
  };
  hooks.positionMarkers = (markers, camera) => {
    const factor = scale();
    for (const m of markers.children) {
      const x = (Number(m.dataset.x) * 48 + 24 - camera.x) * factor,
        y = (Number(m.dataset.y) * 32 + 16 - camera.y) * factor,
        hidden = x < 0 || x > W - 44 || y < 48 || y > H - 110;
      if (m.hidden !== hidden) m.hidden = hidden;
      if (hidden) continue;
      const left = x + "px",
        top = y + "px";
      if (m.style.left !== left) m.style.left = left;
      if (m.style.top !== top) m.style.top = top;
    }
    updateTargetMarker();
  };
  void baseMarkers;
  hooks.gamePoint = (e) => {
    if (!turn.turned) return null;
    const p = turn.toLocal(e.clientX, e.clientY);
    return { x: p.x / scale(), y: p.y / scale() };
  };
  hooks.canStart = () => !document.hidden && ctx.inForeground();
  hooks.startMessage = () => v1t("startForeground");
  hooks.ownsTargetBar = (id) =>
    id === markerActorId &&
    id === (controller.healTarget || controller.target) &&
    !tgt.hidden &&
    !hud.hidden;
  const baseDiag = hooks.diagnostics;
  hooks.diagnostics = () => ({
    ...baseDiag(),
    ui: "m2",
    turned: turn.turned,
    sheet: sheet?.tab || null,
    hub: !!hub,
    belt: beltSlots,
  });
  return {
    rotates: true,
    blocksWorldPoint: (e) => inCombatTouchBounds(turn.toLocal(e.clientX, e.clientY), combatBounds),
    size: () => {
      const s = turn.size();
      W = s.w;
      H = s.h;
      return s;
    },
    afterLayout: () => {
      turn.apply();
      const s = turn.size();
      W = s.w;
      H = s.h;
      place();
      if (game()) updateHUD();
      refreshVisibility();
    },
    inspectingMenu: () => !!hub && !sheet && !bindingEditor?.body.isConnected,
    blocking: () => !!sheet || !!hub || !!bindingEditor?.body.isConnected,
    openSheet,
    closeSheet,
    openHub,
    openBindingSlots,
  };
}

// singleplayer/mobile/equipment-comparison.js
function inspectedItem(me, { ownerId, uid, type, slot }) {
  if (!me || me.id !== ownerId) return null;
  const list =
    type === "equipment" && slot === 13
      ? [me.inventory?.find((i) => i?.uid === me.mountUid) || me.equipment?.[13]]
      : type === "equipment"
        ? me.equipment
        : type === "storage"
          ? me.storage
          : type === "inventory"
            ? me.inventory
            : null;
  return list?.find((item) => item?.uid === uid) || null;
}
function comparisonSlots(def, equipSlots) {
  if (!def || !Number.isInteger(equipSlots?.[def.Type])) return [];
  if (def.DreamType === 6) return [14];
  const first = equipSlots[def.Type];
  return def.Type === "Ring" || def.Type === "Bracelet" ? [first, first + 1] : [first];
}
function equipmentComparison(me, selection, { itemDef, equipSlots, preferredSlot } = {}) {
  const item = inspectedItem(me, selection);
  if (!item) return null;
  const slots = comparisonSlots(itemDef(item.id), equipSlots);
  if (!slots.length) return null;
  const slot = slots.includes(preferredSlot)
    ? preferredSlot
    : selection.type === "equipment" && slots.includes(selection.slot)
      ? selection.slot
      : slots[0];
  const worn =
    slot === 13
      ? me.inventory?.find((i) => i?.uid === me.mountUid) || me.equipment?.[13]
      : me.equipment?.[slot];
  return { item, slots, slot, worn: worn || null };
}

// singleplayer/mobile/entry.js
async function mountMobile(b) {
  const dom = b.hudDOM || {
    text: (el, value) => {
      value = String(value ?? "");
      if (el && el.textContent !== value) el.textContent = value;
    },
    property: (el, key, value) => {
      if (el && el[key] !== value) el[key] = value;
    },
    attribute: (el, key, value) => {
      value = String(value);
      if (el && el.getAttribute(key) !== value) el.setAttribute(key, value);
    },
    style: (el, key, value) => {
      if (!el) return;
      const previous = key.startsWith("--") ? el.style.getPropertyValue(key) : el.style[key];
      if (previous === value) return;
      if (key.startsWith("--")) el.style.setProperty(key, value);
      else el.style[key] = value;
    },
    classToggle: (el, key, value) => {
      if (el && el.classList.contains(key) !== !!value) el.classList.toggle(key, !!value);
    },
  };
  const viewportMeta = document.querySelector("meta[name=viewport]");
  if (viewportMeta && !viewportMeta.content.includes("viewport-fit"))
    viewportMeta.content += ",viewport-fit=cover";
  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = new URL("./mobile.3b183706ccfe.css", import.meta.url).href;
  await new Promise((resolve, reject) => {
    css.onload = resolve;
    css.onerror = () => reject(Error(mobileText(b.locale, "loadError")));
    document.head.append(css);
  });
  const $ = (s) => document.querySelector(s),
    t = (k) => mobileText(b.locale, k),
    root = document.createElement("div");
  root.id = "mobile-root";
  document.body.append(root);
  const m2 = mobileUIMode() === "m2";
  let ext = null;
  let viewMode = readViewMode(),
    viewScale = 0.85;
  const setViewMode = (mode) => {
    viewMode = writeViewMode(mode);
    controller.clear();
    layout();
  };
  let pauseGeneration = 0,
    pauseChain = Promise.resolve(),
    management = 0,
    portrait = false,
    resumeRequired = false,
    paused = false,
    detail = null,
    moveUid = null,
    stickPointer = null,
    worldPointer = null,
    barStamp = "",
    lastPanel = false,
    refreshing = false,
    inspectorRefresh = null;
  const nativePanels = () => [...$("#windows").querySelectorAll(".window")];
  const combatInspection = (panel) =>
    [
      "win-character",
      "win-monster-affixes",
      "win-forge",
      "win-map",
      "win-skills",
      "win-quests",
    ].includes(panel.id) ||
    (panel.id === "win-bag" && b.itemMode() === "use");
  function continueInspectionAttack() {
    if (
      !b.preserveInspectionAttack ||
      (ext?.blocking() && !ext?.inspectingMenu()) ||
      (detail && !detail.classList.contains("mobile-inspector"))
    )
      return false;
    const panels = nativePanels();
    return (panels.length > 0 || ext?.inspectingMenu()) && panels.every(combatInspection);
  }
  const attackPrefKey = (me) =>
    "backmir.primaryAttack." +
    (me.cloudId ||
      JSON.stringify([new URL("../", import.meta.url).pathname, me.id, me.name, me.job]));
  let attackPref = {};
  function primaryAttackSpell(me) {
    if (!me) return "";
    const key = attackPrefKey(me);
    if (key !== attackPref.key) {
      let spell = "";
      try {
        spell = localStorage.getItem(key) || "";
      } catch {}
      attackPref = { key, spell };
    }
    return attackPref.spell;
  }
  function primaryAttackSetting() {
    const localeText = (key2) => m2Text(b.locale, key2);
    const me = b.state().me,
      choices = primaryAttackChoices(me),
      select = document.createElement("select");
    select.dataset.primaryAttackSetting = "";
    for (const spell of ["", ...choices]) {
      const option = document.createElement("option");
      option.value = spell;
      option.textContent = spell ? b.skillName(spell) : localeText("normalAttack");
      select.append(option);
    }
    select.value = choices.includes(primaryAttackSpell(me)) ? primaryAttackSpell(me) : "";
    const key = attackPrefKey(me);
    select.addEventListener("change", () => {
      const current = b.state()?.me;
      if (
        !current ||
        attackPrefKey(current) !== key ||
        (select.value && !primaryAttackChoices(current).includes(select.value))
      )
        return;
      attackPref = { key, spell: select.value };
      try {
        if (select.value) localStorage.setItem(key, select.value);
        else localStorage.removeItem(key);
      } catch {}
      controller.clear();
    });
    return select;
  }
  function decoratePrimaryAttack(node, label) {
    const spell = controller.attackSkill(b.state().me)?.Spell || "";
    if (node.dataset.primarySpell !== spell) {
      node.dataset.primarySpell = spell;
      const icon = node.querySelector(".mobile-ic,.m2-atki");
      let canvas2 = node.querySelector(".mobile-primary-icon");
      if (spell && !canvas2) {
        canvas2 = document.createElement("canvas");
        canvas2.width = 40;
        canvas2.height = 40;
        canvas2.className = "mobile-primary-icon";
        node.append(canvas2);
      }
      if (canvas2) {
        canvas2.hidden = !spell;
        if (spell) b.skillIcon(canvas2, spell);
      }
      icon.hidden = !!spell;
    }
    dom.attribute(node, "aria-label", spell ? label + " \xB7 " + b.skillName(spell) : label);
  }
  const controller = new MobileController({
    ...b,
    inspectionCombatHud: m2 && b.inspectionCombatHud,
    primaryAttackSpell,
    command: (type, data) => gate.execute(type, data, () => b.dispatch(type, data), true),
    panel: () => !!detail || !!$("#windows .window") || !!ext?.blocking(),
    continueInspectionAttack,
    message: (k) => b.say(t(k)),
    changed: () => {
      b.selected(controller.healTarget || controller.target);
    },
  });
  const gate = new MobileCommandGate({
    allowed: (type) =>
      !management &&
      (!controller.reasons.size || type === "LogOut") &&
      !!b.state()?.me &&
      (!b.state().me.dead || ["LogOut", "TownRevive"].includes(type)),
    stamp: () =>
      JSON.stringify([b.state()?.epoch, b.state()?.me?.id, b.state()?.me?.map, controller.epoch]),
  });
  const button = (label, action, parent, attrs = {}) => {
    const el = document.createElement("button");
    el.type = "button";
    el.textContent = label;
    Object.assign(el, attrs);
    bindTouchActivation(el, action);
    if (parent) parent.append(el);
    return el;
  };
  root.innerHTML =
    '<div class="mobile-top"><div class="mobile-status"><div class="mobile-vitals"></div><div class="mobile-pet-portraits" hidden></div></div><button data-menu></button></div><div class="mobile-battle"><div class="mobile-stick" role="group"><i></i></div><div class="mobile-bars"><div data-items></div><div data-skills></div></div><div class="mobile-actions"></div><button class="mobile-aim" hidden></button></div><div class="mobile-pause" hidden><div><h2></h2><p></p><button></button><button data-manage></button></div></div>';
  const battle = root.querySelector(".mobile-battle"),
    vitals = root.querySelector(".mobile-vitals"),
    actions = root.querySelector(".mobile-actions"),
    pause = root.querySelector(".mobile-pause"),
    stick = root.querySelector(".mobile-stick"),
    aim = root.querySelector(".mobile-aim");
  {
    const m = root.querySelector("[data-menu]");
    m.append(iconEl("menu", "\u2261", "mobile-ic"));
    m.setAttribute("aria-label", t("menu"));
  }
  root.querySelector("[data-menu]").onclick = menu;
  const mountButton = button("", () => {
    controller.clear();
    b.command("ToggleMount");
  }, root.querySelector(".mobile-top"));
  mountButton.dataset.action = "mount";
  mountButton.append(iconEl("mount", "", "mobile-ic"));
  mountButton.setAttribute("aria-label", t("mount"));
  const targetButton = button("", () => controller.cycle(), actions),
    attackButton = button("", () => controller.attack(), actions, { className: "mobile-attack" }),
    pickButton = button("", () => controller.pickup(), actions);
  for (const [node, name, mark, label] of [
    [targetButton, "target", "\u25CE", "target"],
    [attackButton, "attack", "\u2694\uFE0E", "attack"],
    [pickButton, "loot", "\u25C6", "pickup"],
  ]) {
    node.append(iconEl(name, mark, "mobile-ic"));
    node.setAttribute("aria-label", t(label));
  }
  targetButton.dataset.action = "target";
  attackButton.dataset.action = "attack";
  pickButton.dataset.action = "pickup";
  aim.textContent = t("cancel");
  aim.onclick = () => controller.clear();
  function closeDetail() {
    inspectorRefresh = null;
    detail?.remove();
    detail = null;
    moveUid = null;
  }
  function dialog(title, inspectX, { preserveAttack = false } = {}) {
    closeDetail();
    if (inspectX !== void 0 && b.preserveInspectionAttack) pauseForPanel();
    else controller.clear({ preserveAttack });
    detail = document.createElement("section");
    detail.className = "mobile-dialog" + (inspectX === void 0 ? "" : " mobile-inspector");
    if (inspectX !== void 0) detail.dataset.side = inspectX < innerWidth / 2 ? "right" : "left";
    detail.setAttribute("role", "dialog");
    detail.setAttribute("aria-label", title);
    const h = document.createElement("h2");
    h.textContent = title;
    detail.append(h);
    button(
      t("close"),
      () => {
        panelTaps.reset();
        closeDetail();
      },
      detail,
      { className: "mobile-close" },
    );
    const body = document.createElement("div");
    body.className = "mobile-dialog-body";
    detail.append(body);
    root.append(detail);
    return body;
  }
  function quantity(body, max = 9999, initial = 1) {
    const label = document.createElement("label");
    label.textContent = t("quantity");
    const input = document.createElement("input");
    input.type = "number";
    input.inputMode = "numeric";
    input.min = "1";
    input.max = String(max);
    input.value = String(initial);
    label.append(input);
    body.append(label);
    return () => {
      const n = Number(input.value);
      return Number.isInteger(n) && n >= 1 && n <= max ? n : null;
    };
  }
  function menu() {
    const body = dialog(t("menu"), void 0, { preserveAttack: b.preserveInspectionAttack });
    if (
      b.monsterDetails &&
      b
        .state()
        .actors.some(
          (a) => a.id === controller.target && a.monsterAffixes?.length && !a.friendly && !a.dead,
        )
    )
      button(
        { "zh-CN": "\u602A\u7269\u8BCD\u7F00", en: "Monster modifiers", es: "Modificadores" }[
          b.locale
        ] || "Monster modifiers",
        () => {
          closeDetail();
          b.monsterDetails(controller.target);
        },
        body,
      );
    if (b.equipmentTitle?.())
      button(
        b.equipmentTitle(),
        () => {
          closeDetail();
          b.equipment();
        },
        body,
      );
    const links = ["bag", "character", "skills", "quests", "map", "forge", "assist", "system"];
    for (const name of links)
      button(
        name === "forge" ? b.forgeTitle?.() || t(name) : t(name),
        () => {
          closeDetail();
          b.open(name);
          $("#win-" + name)?.parentElement.append($("#win-" + name));
        },
        body,
      );
    if (b.shareCharacter) {
      const owner = b.state()?.me?.id;
      button(
        b.t("share.character"),
        () => {
          closeDetail();
          b.shareCharacter(owner);
        },
        body,
      ).dataset.mobileShareCharacter = "";
    }
    button(
      viewText(b.locale, "view") + " \xB7 " + viewText(b.locale, viewMode),
      () => {
        const p = dialog(viewText(b.locale, "view"));
        for (const mode of VIEW_MODES) {
          const node = button(
            viewText(b.locale, mode),
            () => {
              setViewMode(mode);
              closeDetail();
            },
            p,
          );
          node.dataset.worldView = mode;
          node.setAttribute("aria-pressed", String(mode === viewMode));
        }
      },
      body,
    );
    if (primaryAttackChoices(b.state().me).length) {
      const label = document.createElement("label");
      label.textContent = m2Text(b.locale, "primaryAttack");
      label.append(primaryAttackSetting());
      body.append(label);
    }
    button(
      m2Text(b.locale, "uiNew"),
      async () => {
        await b.manageSave();
        location.assign(mobileUIHref("m2"));
      },
      body,
    );
    button(t("pet"), petMenu, body);
    button(
      t("force"),
      () => {
        closeDetail();
        controller.forceAttack();
      },
      body,
    );
    button(
      t(controller.run ? "walk" : "run"),
      () => {
        controller.run = !controller.run;
        closeDetail();
      },
      body,
    );
    button(t("mount"), () => b.command("ToggleMount"), body);
    button(
      t("fullscreen"),
      async () => {
        try {
          if (document.documentElement.requestFullscreen)
            await document.documentElement.requestFullscreen();
          else b.say(t("fullscreenUnavailable"));
        } catch {
          b.say(t("fullscreenUnavailable"));
        }
      },
      body,
    );
    button(
      t("switchDesktop"),
      async () => {
        await b.manageSave();
        try {
          localStorage.setItem("backmir.controls", "desktop");
        } catch {}
        const u = new URL(location.href);
        u.searchParams.set("controls", "desktop");
        location.assign(u);
      },
      body,
    );
    const note = document.createElement("p");
    note.textContent = t("panelHint");
    body.append(note);
  }
  function petMenu() {
    const p = dialog(t("pet")),
      info = document.createElement("div");
    info.className = "mobile-pet-info";
    p.append(info);
    let stamp = "";
    const render = () => {
      const s = b.state(),
        pets =
          s?.actors?.filter(
            (a) => a.kind === "monster" && a.friendly && a.master === s.me.id && !a.dead,
          ) || [],
        key = JSON.stringify(pets.map((a) => [a.id, b.actorName(a), a.hp, a.maxHP]));
      if (key === stamp) return;
      stamp = key;
      info.replaceChildren();
      for (const a of pets) {
        const row = document.createElement("div");
        row.className = "mobile-pet-row";
        const name = document.createElement("b"),
          hp = document.createElement("span");
        name.textContent = b.actorName(a);
        hp.textContent = `HP ${a.hp} / ${a.maxHP}`;
        row.append(name, hp);
        info.append(row);
      }
      if (!pets.length) info.textContent = t("pet") + " \u2014";
    };
    render();
    inspectorRefresh = render;
    for (const mode of ["rest", "recall", "dismiss", "target"])
      button(
        t(mode === "target" ? "petTarget" : mode),
        async () => {
          if (mode === "dismiss") {
            const q = dialog(t("dismiss"));
            button(
              t("confirm"),
              async () => {
                await b.command("PetControl", { Mode: mode });
                closeDetail();
              },
              q,
            );
            return;
          }
          await b.command("PetControl", { Mode: mode, Target: controller.target });
        },
        p,
      );
  }
  function bindSlots(spell, uid) {
    if (m2 && ext?.openBindingSlots) {
      ext.openBindingSlots(spell, uid);
      return;
    }
    const body = dialog(t("chooseSlot"));
    for (let i = 0; i < (spell ? 8 : 6); i++)
      button(
        String(i + 1),
        async () => {
          if (spell) await b.command("MagicKey", { Spell: spell, Key: i + 1 });
          else await b.bindQuickItem(i, uid);
          closeDetail();
        },
        body,
      );
    if (spell)
      button(
        t("clear"),
        async () => {
          await b.command("MagicKey", { Spell: spell, Key: 0 });
          closeDetail();
        },
        body,
      );
  }
  function inventoryDetail(slot, type, x) {
    const s = b.state(),
      item =
        type === "equipment"
          ? slot === 13
            ? s.me.inventory.find((i) => i?.uid === s.me.mountUid) || s.me.equipment[slot]
            : s.me.equipment[slot]
          : type === "storage"
            ? s.me.storage[slot]
            : s.me.inventory[slot];
    if (!item) return;
    const uid = item.uid,
      owner = s.me.id,
      selection = { uid, ownerId: owner, type, slot },
      body = dialog(b.itemName(item), x),
      panel = body.parentElement;
    panel.classList.add("mobile-item-inspector");
    body.classList.add("mobile-inspector-content");
    const info = document.createElement("div"),
      footer = document.createElement("footer");
    info.className = "mobile-inspector-info";
    footer.className = "mobile-inspector-actions";
    body.append(info, footer);
    const header = document.createElement("header"),
      toolbar = document.createElement("div");
    header.className = "mobile-inspector-header";
    toolbar.className = "mobile-inspector-header-actions";
    const close = panel.querySelector(".mobile-close"),
      heading = panel.querySelector("h2");
    panel.insertBefore(header, body);
    header.append(heading, toolbar);
    toolbar.append(close);
    const current = () => inspectedItem(b.state()?.me, selection),
      exists = () => !!current();
    let comparing = false,
      preferredSlot = null,
      stamp = "",
      compareButton;
    const view = () =>
      equipmentComparison(b.state()?.me, selection, {
        itemDef: (id) => b.itemDef(id),
        equipSlots: b.equipSlots,
        preferredSlot,
      });
    const render = () => {
      const selected = current();
      if (!selected) {
        closeDetail();
        return;
      }
      const compared = comparing ? view() : null;
      if (comparing && !compared) {
        closeDetail();
        return;
      }
      const next = JSON.stringify([selected, compared?.slot, compared?.worn, comparing]);
      if (next === stamp) return;
      stamp = next;
      info.replaceChildren();
      panel.classList.toggle("mobile-comparing", comparing);
      if (compareButton) compareButton.textContent = t(comparing ? "compareBack" : "compare");
      if (!compared) {
        info.innerHTML = b.itemText(selected);
        return;
      }
      if (compared.slots.length > 1) {
        const choices = document.createElement("nav");
        choices.className = "mobile-comparison-slots";
        choices.setAttribute("aria-label", t("compareSlot"));
        for (const index of compared.slots) {
          const option = button(
            b.t("character.slot." + index),
            () => {
              if (!exists()) {
                closeDetail();
                return;
              }
              preferredSlot = index;
              stamp = "";
              render();
            },
            choices,
          );
          option.dataset.compareSlot = String(index);
          option.setAttribute("aria-pressed", String(index === compared.slot));
        }
        info.append(choices);
      }
      const cards = document.createElement("div");
      cards.className = "mobile-comparison-cards";
      for (const [which, label, gear] of [
        ["selected", t("compareSelected"), compared.item],
        [
          "worn",
          t("compareWorn") + " \xB7 " + b.t("character.slot." + compared.slot),
          compared.worn,
        ],
      ]) {
        const card = document.createElement("section"),
          heading2 = document.createElement("h3");
        card.className = "mobile-comparison-card";
        card.dataset.comparisonCard = which;
        heading2.textContent = label;
        card.append(heading2);
        if (gear) {
          card.dataset.itemUid = String(gear.uid);
          const content = document.createElement("div");
          content.innerHTML = b.itemText(gear);
          card.append(content);
        } else {
          const empty = document.createElement("p");
          empty.textContent = t("compareEmpty");
          card.append(empty);
        }
        cards.append(card);
      }
      info.append(cards);
    };
    if (type !== "storage" && b.shareEquipment && b.shareable?.(item)) {
      const share = button(
        b.t("share.equipment"),
        () => {
          panelTaps.reset();
          if (!exists()) {
            closeDetail();
            return;
          }
          closeDetail();
          return b.shareEquipment(uid, owner);
        },
        null,
        { className: "mobile-inspector-share" },
      );
      share.dataset.mobileShareEquipment = String(uid);
      toolbar.insertBefore(share, close);
    }
    if (b.lockable?.(item) && !(type === "storage" && b.sharedStorageActive?.())) {
      const lockButton = button(
        b.t(b.locked(item) ? "manage.unlock" : "manage.lock"),
        async () => {
          panelTaps.reset();
          const selected = current();
          if (!selected) {
            closeDetail();
            return;
          }
          await b.command("SetEquipmentLock", { UniqueID: uid, Locked: !b.locked(selected) });
          closeDetail();
        },
        null,
      );
      toolbar.insertBefore(lockButton, close);
    }
    if (view()) {
      compareButton = button(
        t("compare"),
        () => {
          panelTaps.reset();
          if (!exists()) {
            closeDetail();
            return;
          }
          comparing = !comparing;
          stamp = "";
          render();
        },
        footer,
      );
      compareButton.dataset.mobileCompare = "";
    }
    const action = (label, fn) =>
      button(
        t(label),
        async () => {
          panelTaps.reset();
          if (!exists()) {
            closeDetail();
            return;
          }
          await fn();
          closeDetail();
        },
        footer,
      );
    if (type === "equipment") {
      if (slot === 13) action("mount", () => b.command("ToggleMount"));
      else
        action("remove", () =>
          b.command("RemoveItem", { Grid: "Inventory", UniqueID: uid, To: b.freeSlot(item) }),
        );
    } else if (type === "storage") action("withdraw", () => b.transfer("TakeBackItem", slot, uid));
    else {
      action("use", () => b.use(current(), preferredSlot ?? (comparing ? view()?.slot : void 0)));
      if (b.itemMode() === "store") action("store", () => b.transfer("StoreItem", slot, uid));
      if (["repair", "specialRepair"].includes(b.itemMode()))
        action("repair", () =>
          b.command(b.itemMode() === "repair" ? "RepairItem" : "SRepairItem", { UniqueID: uid }),
        );
      if (b.itemMode() === "sell") {
        const count = quantity(footer, item.count);
        action("sell", () => {
          const n = count();
          return n && b.command("SellItem", { UniqueID: uid, Count: n });
        });
      }
      if (item.count > 1)
        button(
          t("split"),
          () => {
            panelTaps.reset();
            if (!exists()) {
              closeDetail();
              return;
            }
            const p = dialog(t("split")),
              count = quantity(p, item.count - 1);
            button(
              t("confirm"),
              async () => {
                const n = count();
                if (n && exists()) {
                  await b.command("SplitItem", { UniqueID: uid, Count: n });
                  closeDetail();
                }
              },
              p,
            );
          },
          footer,
        );
      button(
        t("drop"),
        () => {
          panelTaps.reset();
          if (!exists()) {
            closeDetail();
            return;
          }
          const p = dialog(t("dropConfirm")),
            count = quantity(p, item.count, item.count);
          button(
            t("confirm"),
            async () => {
              const n = count();
              if (n && exists()) {
                await b.command("DropItem", { UniqueID: uid, Count: n });
                closeDetail();
              }
            },
            p,
          );
        },
        footer,
      );
    }
    render();
    inspectorRefresh = () => {
      if (detail === panel) render();
    };
  }
  function forgePicker(slot) {
    const body = dialog(t("chooseItem"));
    button(
      t("confirmClear"),
      () => {
        closeDetail();
        b.clearForge(slot);
      },
      body,
    );
    for (const item of b.forgeItems(slot))
      button(
        b.itemName(item),
        () => {
          const p = dialog(b.itemName(item));
          p.innerHTML = b.itemText(item);
          button(
            t("confirm"),
            () => {
              closeDetail();
              b.placeForge(item.uid, slot);
            },
            p,
          );
        },
        body,
      );
  }
  function resolveTap(target) {
    const el = target.closest?.(
      "[data-inventory-slot],[data-storage-slot],[data-equipment-slot],[data-bind],.forge-target,[data-forge-material],[data-cube-slot],#win-skills [data-cast],#win-skills [data-icon],#win-skills .skill-card",
    );
    if (!el || el.disabled) return null;
    const state = b.state(),
      scope = `${state?.epoch}:${state?.me?.id}`;
    for (const [attr, type, list] of [
      ["inventorySlot", "inventory", "inventory"],
      ["storageSlot", "storage", "storage"],
      ["equipmentSlot", "equipment", "equipment"],
    ])
      if (attr in el.dataset) {
        const slot = Number(el.dataset[attr]),
          item =
            type === "equipment" && slot === 13
              ? state.me.inventory.find((i) => i?.uid === state.me.mountUid) ||
                state.me.equipment[slot]
              : state?.me?.[list]?.[slot];
        return {
          key: `${scope}:${type}:${type === "inventory" ? b.itemMode() + ":" : ""}${item?.uid ?? "empty" + slot}`,
          type,
          slot,
          uid: item?.uid,
          el,
        };
      }
    if (el.dataset.bind)
      return { key: scope + ":bind:" + el.dataset.bind, type: "bind", spell: el.dataset.bind, el };
    if (
      el.closest("#win-skills") &&
      (el.dataset.cast || el.dataset.icon || el.matches(".skill-card"))
    ) {
      const spell =
        el.dataset.cast || el.dataset.icon || el.querySelector("[data-cast]")?.dataset.cast;
      return { key: scope + ":skill:" + spell, type: "skill", spell, el };
    }
    return {
      key:
        scope +
        ":forge:" +
        el.className +
        ":" +
        el.dataset.forgeMaterial +
        ":" +
        el.dataset.cubeSlot,
      type: "forge",
      el,
    };
  }
  const panelTaps = bindPanelTaps($("#windows"), resolveTap, (item, kind, event) => {
    const { type, slot, uid, spell, el } = item;
    if (type === "bind") {
      bindSlots(spell);
      return;
    }
    if (type === "forge") {
      forgePicker(el);
      return;
    }
    if (type === "skill") {
      if (kind === "double") {
        if (["passive", "unavailable"].includes(spellMode(spell))) return;
        b.closePanels();
        closeDetail();
        controller.cast(spell);
      } else {
        const body = dialog(b.skillName(spell), event.clientX);
        b.skillDetails(spell, body);
        if (!["passive", "unavailable"].includes(spellMode(spell)))
          button(t("bind"), () => bindSlots(spell), body);
      }
      return;
    }
    if (type === "inventory" && moveUid) {
      const moving = moveUid;
      moveUid = null;
      const from = b.state().me.inventory.findIndex((i) => i?.uid === moving);
      if (from >= 0)
        b.command("MoveItem", { Grid: "Inventory", From: from, To: slot, UniqueID: moving });
      return;
    }
    if (kind === "double") {
      closeDetail();
      const me = b.state().me,
        current =
          type === "equipment" && slot === 13
            ? me.inventory.find((i) => i?.uid === me.mountUid) || me.equipment[slot]
            : (type === "inventory"
                ? me.inventory
                : type === "equipment"
                  ? me.equipment
                  : me.storage)[slot];
      if (current?.uid !== uid || !current) return;
      if (type === "inventory") {
        if (b.itemMode() === "store") b.transfer("StoreItem", slot, uid);
        else if (b.itemMode() === "use") b.use(current);
        else if (
          b.itemMode() === "sell" &&
          current.count === 1 &&
          Number.isInteger(b.equipSlots?.[b.itemDef?.(current.id)?.Type])
        )
          b.command("SellItem", { UniqueID: uid, Count: 1 });
        else inventoryDetail(slot, type, event.clientX);
      } else if (type === "storage") b.transfer("TakeBackItem", slot, uid);
      else if (slot === 13) b.command("ToggleMount");
      else b.command("RemoveItem", { Grid: "Inventory", UniqueID: uid, To: b.freeSlot(item) });
    } else inventoryDetail(slot, type, event.clientX);
  });
  const releaseStick = (e) => {
    if (e && e.pointerId !== stickPointer) return;
    stickPointer = null;
    stick.querySelector("i").style.transform = "";
    controller.release();
  };
  function pauseForPanel() {
    const panels = nativePanels();
    const preserveAttack =
      b.preserveInspectionAttack &&
      panels.length > 0 &&
      panels.every(
        (panel) =>
          (panel.id === "win-map" && b.preserveMapAttack !== false) || combatInspection(panel),
      );
    if (preserveAttack) {
      controller.inspectPanel();
      stickPointer = null;
      stick.querySelector("i").style.transform = "";
    } else {
      controller.clear();
      releaseStick();
    }
  }
  const steer = (e) => {
    if (e.pointerId !== stickPointer) return;
    const r = stick.getBoundingClientRect(),
      x = e.clientX - r.left - r.width / 2,
      y = e.clientY - r.top - r.height / 2,
      length = Math.hypot(x, y),
      factor = Math.min(1, 36 / (length || 1));
    stick.querySelector("i").style.transform = `translate(${x * factor}px,${y * factor}px)`;
    const dir = joystickDirection(x, y, 14, controller.joystick);
    if (controller.joystick !== dir) controller.steer(dir);
  };
  stick.onpointerdown = (e) => {
    if (stickPointer !== null || controller.blocked()) return;
    e.preventDefault();
    stickPointer = e.pointerId;
    stick.setPointerCapture(e.pointerId);
    steer(e);
  };
  stick.onpointermove = steer;
  stick.onpointerup = releaseStick;
  stick.onpointercancel = releaseStick;
  stick.onlostpointercapture = releaseStick;
  const petPortraits = root.querySelector(".mobile-pet-portraits");
  petPortraits.setAttribute("role", "group");
  petPortraits.setAttribute("aria-label", t("pet"));
  const petCards = /* @__PURE__ */ new Map();
  function renderPetPortraits(s) {
    const pets =
      s?.stage === "Game" && s.me && !s.me.dead
        ? s.actors.filter(
            (a) =>
              a.kind === "monster" &&
              a.friendly &&
              !a.dead &&
              a.master === s.me.id &&
              a.map === s.me.map,
          )
        : [];
    const ids = new Set(pets.map((a) => a.id));
    for (const [id, card] of petCards)
      if (!ids.has(id)) {
        card.button.remove();
        petCards.delete(id);
      }
    for (const pet of pets) {
      let card = petCards.get(pet.id);
      const name = b.actorName(pet);
      if (!card) {
        const node = button("", () => controller.selectPet(pet.id), petPortraits, {
          className: "mobile-pet-portrait",
        });
        node.dataset.petId = pet.id;
        node.innerHTML =
          '<span class="mobile-pet-portrait-fallback"></span><b></b><span class="mobile-pet-health"><i></i></span>';
        card = {
          button: node,
          fallback: node.querySelector(".mobile-pet-portrait-fallback"),
          level: node.querySelector("b"),
          hp: node.querySelector("i"),
        };
        petCards.set(pet.id, card);
      }
      if (card.art !== pet.art) {
        card.art = pet.art;
        card.canvas?.remove();
        const icon = document.createElement("canvas");
        icon.width = 30;
        icon.height = 27;
        icon.hidden = true;
        card.fallback.hidden = false;
        card.button.insertBefore(icon, card.fallback);
        card.canvas = icon;
        void b
          .petPortrait(icon, pet)
          .then((ok) => {
            if (ok && card.canvas === icon) {
              icon.hidden = false;
              card.fallback.hidden = true;
            }
          })
          .catch(() => {});
      }
      const level = "Lv." + Number(pet.special?.petLevel ?? 0);
      const label = name + " \xB7 " + level + " \xB7 HP " + pet.hp + "/" + pet.maxHP;
      dom.text(card.fallback, name.slice(0, 1));
      dom.text(card.level, level);
      dom.style(card.hp, "width", Math.min(100, (100 * pet.hp) / (pet.maxHP || 1)) + "%");
      dom.attribute(card.button, "aria-label", label);
      dom.property(card.button, "title", label);
      dom.attribute(card.button, "aria-pressed", String(controller.healTarget === pet.id));
    }
    dom.property(petPortraits, "hidden", !pets.length);
  }
  const canvas = b.canvas;
  canvas.setAttribute("aria-label", t("tapHint"));
  canvas.onpointerdown = (e) => {
    if (controller.blocked() || worldPointer) return;
    if (ext?.blocksWorldPoint?.(e)) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    worldPointer = { id: e.pointerId, x: e.clientX, y: e.clientY };
    canvas.setPointerCapture(e.pointerId);
  };
  canvas.onpointerup = (e) => {
    if (e.pointerId !== worldPointer?.id) return;
    const p = worldPointer;
    worldPointer = null;
    if (
      Math.hypot(e.clientX - p.x, e.clientY - p.y) > 14 ||
      controller.blocked() ||
      ext?.blocksWorldPoint?.(e)
    )
      return;
    const point = b.point(e),
      goal = b.goal(point),
      actor = b.hit(point);
    if (controller.aim) {
      controller.cast(controller.aim, goal);
      return;
    }
    if (
      actor?.kind === "monster" &&
      actor.friendly &&
      actor.master === b.state().me.id &&
      !actor.dead
    )
      controller.selectPet(actor.id);
    else if (actor?.kind === "monster" && !actor.friendly && !actor.dead)
      controller.select(actor.id);
    else if (actor?.kind === "npc" || actor?.kind === "item") controller.interact(actor.id);
    else controller.move(goal);
  };
  canvas.onpointercancel = () => {
    worldPointer = null;
    controller.clear();
  };
  canvas.onlostpointercapture = () => {
    worldPointer = null;
  };
  const inForeground = () => document.documentElement.dataset.gameForeground !== "false";
  const backgroundBlocked = () => document.hidden && document.documentElement.dataset.pauseOnFocusLoss !== "false";
  function autoResume() {
    if (
      inForeground() &&
      !portrait &&
      !management &&
      !controller.reasons.has("error") &&
      controller.reasons.has("background")
    )
      void resume();
  }
  function updatePause() {
    const s = b.state(),
      game = s?.stage === "Game";
    dom.property(
      pause,
      "hidden",
      !game || (!portrait && !resumeRequired && !controller.reasons.has("error")),
    );
    dom.text(pause.querySelector("h2"), t("paused"));
    dom.text(
      pause.querySelector("p"),
      t(controller.reasons.has("error") ? "pauseError" : portrait ? "rotate" : "resumeHint"),
    );
    const resume2 = pause.querySelector("button");
    dom.text(resume2, t("resume"));
    dom.property(resume2, "disabled", portrait || document.hidden || !inForeground());
  }
  function queuePause() {
    const wanted = controller.reasons.size > 0;
    pauseChain = pauseChain
      .catch(() => {})
      .then(async () => {
        await b.pause(wanted);
        paused = wanted;
      })
      .catch((e) => {
        controller.reasons.add("error");
        b.say(e.message);
        updatePause();
      });
    return pauseChain;
  }
  function suspend(reason) {
    pauseGeneration++;
    controller.clear();
    releaseStick();
    worldPointer = null;
    controller.reasons.add(reason);
    resumeRequired = true;
    controller.reasons.add("resume");
    updatePause();
    return queuePause();
  }
  async function resume() {
    if (portrait || backgroundBlocked() || !inForeground() || refreshing) return;
    refreshing = true;
    const ticket = pauseGeneration;
    const button2 = pause.querySelector("button");
    dom.property(button2, "disabled", true);
    try {
      controller.clear();
      await pauseChain;
      await b.refresh();
      if (ticket !== pauseGeneration || portrait || backgroundBlocked() || !inForeground()) return;
      controller.reasons.delete("error");
      controller.reasons.delete("resume");
      controller.reasons.delete("hidden");
      controller.reasons.delete("blur");
      controller.reasons.delete("background");
      await b.pause(false);
      if (ticket !== pauseGeneration || portrait || backgroundBlocked() || !inForeground()) {
        await queuePause();
        return;
      }
      paused = false;
      resumeRequired = false;
      updatePause();
    } catch (e) {
      controller.reasons.add("error");
      b.say(e.message);
      updatePause();
    } finally {
      refreshing = false;
      dom.property(button2, "disabled", portrait || backgroundBlocked() || !inForeground());
      autoResume();
    }
  }
  pause.querySelector("button").onclick = resume;
  pause.querySelector("[data-manage]").textContent = t("system");
  pause.querySelector("[data-manage]").onclick = () => {
    b.open("system");
    dom.classToggle(pause, "behind-panels", true);
  };
  function skillPages() {
    const bar = root.querySelector("[data-skills]"),
      bound = [...bar.querySelectorAll("[data-skill-key]")].filter((e) => e.dataset.spell),
      pages = Math.max(1, Math.ceil(bound.length / 4));
    let page = Number(bar.dataset.page || 0);
    if (page >= pages) page = 0;
    bar.dataset.page = String(page);
    const positions = [
      [42, 108],
      [12, 58],
      [46, 12],
      [100, 0],
    ];
    for (const el of bar.querySelectorAll("[data-skill-key]")) {
      const index = bound.indexOf(el),
        visible = bound.length
          ? index >= page * 4 && index < (page + 1) * 4
          : el.dataset.skillKey === "1";
      dom.property(el, "hidden", !visible);
      if (visible) {
        const [x, y] = positions[bound.length ? index % 4 : 0];
        dom.style(el, "left", x + "px");
        dom.style(el, "top", y + "px");
      }
    }
    const toggle = bar.querySelector(".mobile-skill-page");
    if (toggle) {
      dom.property(toggle, "hidden", pages < 2);
      dom.text(toggle, page + 1 + "/" + pages);
      dom.attribute(toggle, "aria-label", t("skills") + " " + (page + 1) + "/" + pages);
    }
    const items = root.querySelector("[data-items]"),
      used = [...items.querySelectorAll("[data-item-key]")].filter(
        (e) => e.dataset.filled === "true",
      ),
      itemPages = Math.max(1, Math.ceil(used.length / 3));
    let itemPage = Number(items.dataset.page || 0);
    if (itemPage >= itemPages) itemPage = 0;
    items.dataset.page = String(itemPage);
    for (const el of items.querySelectorAll("[data-item-key]")) {
      const i = used.indexOf(el);
      dom.property(
        el,
        "hidden",
        used.length ? i < itemPage * 3 || i >= (itemPage + 1) * 3 : el.dataset.itemKey !== "0",
      );
    }
    const itemToggle = items.querySelector(".mobile-item-page");
    if (itemToggle) {
      dom.property(itemToggle, "hidden", itemPages < 2);
      dom.text(itemToggle, itemPage + 1 + "/" + itemPages);
    }
  }
  function classicLayout() {
    for (const panel of $("#windows").querySelectorAll(".mobile-classic")) {
      const width = panel.id === "win-character" ? 555 : panel.id === "win-skills" ? 504 : 356;
      const scale = Math.min(
        0.82,
        (innerWidth - 24) / width,
        panel.id === "win-character" ? (innerHeight - 24) / 464 : 0.82,
      );
      dom.style(panel, "--classic-scale", String(scale));
      dom.style(panel, "--classic-height", (innerHeight - 24) / scale + "px");
    }
  }
  function layout() {
    skillPages();
    classicLayout();
    const v = globalThis.visualViewport,
      size = ext?.size(),
      width = size ? size.w : Math.round(v?.width || innerWidth),
      height = size ? size.h : Math.round(v?.height || innerHeight);
    dom.style(root, "--mobile-width", width + "px");
    dom.style(root, "--mobile-height", height + "px");
    dom.style(document.documentElement, "--mobile-width", width + "px");
    dom.style(document.documentElement, "--mobile-height", height + "px");
    const next = !ext?.rotates && innerHeight > innerWidth;
    if (next !== portrait) {
      portrait = next;
      if (portrait) suspend("portrait");
      else {
        controller.reasons.delete("portrait");
        updatePause();
      }
    }
    viewScale = worldViewScale(viewMode, { w: width, h: height });
    dom.style(document.documentElement, "--mobile-world-scale", String(viewScale));
    b.viewport(width, height, viewScale);
    ext?.afterLayout();
    return { w: Math.round(width / viewScale), h: Math.round(height / viewScale) };
  }
  function update() {
    controller.snapshot();
    inspectorRefresh?.();
    const s = b.state(),
      game = s?.stage === "Game";
    renderPetPortraits(s);
    const mounted = !!s?.me?.mountUid;
    dom.property(mountButton, "disabled", !game || s.me.dead || (!mounted && !s.me.inventory.some((item) => item && b.itemDef(item.id)?.Type === "Mount")));
    dom.attribute(mountButton, "aria-pressed", String(mounted));
    dom.style(mountButton, "color", mounted ? "#ffd45c" : "");
    const hasPanel = !!$("#windows .window");
    if (hasPanel && !lastPanel) pauseForPanel();
    lastPanel = hasPanel;
    dom.property(battle, "hidden", !game || hasPanel);
    dom.property(root.querySelector(".mobile-top"), "hidden", !game || hasPanel);
    if (!hasPanel) dom.classToggle(pause, "behind-panels", false);
    if (!game) {
      closeDetail();
      barStamp = "";
    } else {
      dom.text(
        vitals,
        `${s.me.name} \xB7 Lv.${s.me.level}   HP ${s.me.hp}/${s.me.maxHP}   MP ${s.me.mp}/${s.me.maxMP}`,
      );
      if (!m2)
        decoratePrimaryAttack(
          attackButton,
          t(controller.attacking || controller.force ? "stop" : "attack"),
        );
      dom.attribute(attackButton, "aria-pressed", String(controller.attacking || controller.force));
      dom.property(aim, "hidden", !controller.aim);
      const stamp = JSON.stringify([
        s.me.itemHotkeys,
        s.me.ringHotkeys,
        b.quickItems().map((i) => i && [i.id, i.count]),
        s.me.skills.map((s2) => [s2.Spell, s2.Key]),
      ]);
      if (stamp !== barStamp) {
        barStamp = stamp;
        const items = root.querySelector("[data-items]"),
          skills = root.querySelector("[data-skills]");
        items.replaceChildren();
        skills.replaceChildren();
        b.quickItems().forEach((item, key) => {
          const el = button(
            "",
            () => (item ? b.command("UseItemHotkey", { Key: key }) : showItems()),
            items,
          );
          el.dataset.itemKey = key;
          el.dataset.filled = String(!!item);
          el.setAttribute("aria-label", `${key + 1} \xB7 ${item ? b.itemName(item) : t("empty")}`);
          el.innerHTML = '<canvas width="36" height="36"></canvas><small></small>';
          if (item)
            b.itemIcon
              ? b.itemIcon(el.querySelector("canvas"), item)
              : b.icon(el.querySelector("canvas"), item.id);
          el.querySelector("small").textContent = item?.count || "";
          if (!item) el.textContent = "+";
        });
        button(
          "",
          () => {
            items.dataset.page = String(Number(items.dataset.page || 0) ? 0 : 1);
            skillPages();
          },
          items,
          { className: "mobile-item-page" },
        );
        for (let key = 1; key <= 8; key++) {
          const skill = s.me.skills.find((s2) => s2.Key === key);
          const el = button(
            "",
            () => (skill ? controller.cast(skill.Spell) : b.open("skills")),
            skills,
          );
          el.dataset.skillKey = key;
          el.dataset.spell = skill?.Spell || "";
          el.setAttribute("aria-label", skill ? b.skillName(skill.Spell) : `${t("skills")} ${key}`);
          el.innerHTML = '<canvas width="36" height="36"></canvas><small></small><span></span>';
          if (skill) b.skillIcon(el.querySelector("canvas"), skill.Spell);
          el.querySelector("small").textContent = skill ? key : "";
          if (!skill) el.querySelector("small").textContent = "+";
        }
        button(
          "",
          () => {
            skills.dataset.page = String(Number(skills.dataset.page || 0) ? 0 : 1);
            skillPages();
          },
          skills,
          { className: "mobile-skill-page" },
        );
        skillPages();
      }
      for (const el of root.querySelectorAll("[data-skill-key]")) {
        const skill = s.me.skills.find((s2) => s2.Spell === el.dataset.spell),
          seconds = Math.max(0, Math.ceil(((skill?.CastTime || 0) - s.time) / 1e3));
        dom.text(el.querySelector("span"), seconds ? seconds + "s" : "");
      }
    }
    updatePause();
  }
  function showItems() {
    const body = dialog(t("items"));
    b.quickItems().forEach((item, key) => {
      button(
        `${key + 1} \xB7 ${item ? b.itemName(item) : t("empty")}`,
        () => {
          const p = dialog(t("chooseItem"));
          button(
            t("clear"),
            async () => {
              await b.command("BindItemHotkey", { Key: key, UniqueID: null });
              closeDetail();
            },
            p,
          );
          for (const i of b.state().me.inventory.filter(Boolean))
            button(
              b.itemName(i),
              async () => {
                await b.bindQuickItem(key, i.uid);
                closeDetail();
              },
              p,
            );
        },
        body,
      );
    });
  }
  button(t("items"), showItems, root.querySelector(".mobile-top"));
  document.addEventListener("game-foreground", (e) => {
    if (!e.detail) suspend("background");
    else autoResume();
  });
  if (!inForeground()) suspend("background");
  window.addEventListener("resize", layout);
  globalThis.visualViewport?.addEventListener("resize", layout);
  $("#windows").addEventListener("pointerdown", pauseForPanel, true);
  function panelTabs() {
    const host = $("#windows"),
      wins = [...host.children].filter((w) =>
        ["win-bag", "win-storage", "win-shop", "win-forge"].includes(w.id),
      );
    for (const w of wins) {
      const targets = wins
        .filter((target) => target !== w)
        .map((target) => ({ id: target.id, label: target.querySelector("h2").textContent }));
      if (w.id !== "win-bag" && !wins.some((target) => target.id === "win-bag"))
        targets.push({ id: "win-bag", label: t("bag") });
      let nav = w.querySelector(".mobile-panel-tabs");
      if (!targets.length) {
        nav?.remove();
        continue;
      }
      if (!nav) {
        nav = document.createElement("nav");
        nav.className = "mobile-panel-tabs";
        w.querySelector("h2").after(nav);
      }
      const stamp = targets.map((target) => target.id + ":" + target.label).join();
      if (nav.dataset.stamp === stamp) continue;
      nav.dataset.stamp = stamp;
      nav.replaceChildren();
      for (const target of targets)
        button(
          target.label,
          () => {
            const current = $("#" + target.id);
            if (current) host.append(current);
            else if (target.id === "win-bag") b.open("bag");
          },
          nav,
        );
    }
  }
  const observer = new MutationObserver(() => {
    panelTabs();
    const hasPanel = !!$("#windows .window");
    if (hasPanel && !lastPanel) pauseForPanel();
    lastPanel = hasPanel;
    const game = b.state()?.stage === "Game";
    dom.property(battle, "hidden", !game || hasPanel);
    dom.property(root.querySelector(".mobile-top"), "hidden", !game || hasPanel);
    if (!hasPanel) {
      dom.classToggle(pause, "behind-panels", false);
      if (detail?.classList.contains("mobile-inspector")) closeDetail();
    }
  });
  observer.observe($("#windows"), { childList: true });
  async function cacheMobile() {
    if (!navigator.serviceWorker || !globalThis.caches) return;
    await navigator.serviceWorker.ready;
    const r = await fetch("./offline-manifest.json");
    if (!r.ok) return;
    const manifest = await r.json(),
      cache = await caches.open(manifest.cache);
    for (const url of [import.meta.url, css.href]) {
      if (!(await cache.match(url, { ignoreSearch: true }))) {
        const response = await fetch(url);
        if (response.ok) await cache.put(url, response);
      }
    }
  }
  cacheMobile().catch(() => {});
  const hooks = {
    controller,
    layout,
    update,
    positionMarkers: (markers, camera) => {
      for (const el of markers.children) {
        const x = (Number(el.dataset.x) * 48 + 24 - camera.x) * 0.85,
          y = (Number(el.dataset.y) * 32 + 16 - camera.y) * 0.85;
        dom.property(el, "hidden", x < 0 || x > innerWidth - 44 || y < 48 || y > innerHeight - 110);
        dom.style(el, "left", x + "px");
        dom.style(el, "top", y + "px");
      }
    },
    clear: (opts) => controller.clear(opts),
    tick: () => controller.tick(),
    travel: (dest) => controller.travel(dest),
    move: (g) => {
      b.closePanels();
      closeDetail();
      controller.move(g);
    },
    cast: (s) => {
      b.closePanels();
      closeDetail();
      return controller.cast(s);
    },
    forgeHint: () => t("forgeHint"),
    chooseItem: () => t("chooseItem"),
    canStart: () => !portrait && !document.hidden && inForeground(),
    startMessage: () => t(portrait ? "startLandscape" : "startForeground"),
    noviceText: (key, value, params) => mobileNovice(b.locale, key, params) ?? value,
    messageText: (message) =>
      message === b.t("ui.4beb500b4769")
        ? t("sellHint")
        : message === b.t("ui.b874476c7e7a")
          ? t("repairHint")
          : message,
    showTip: (html) => {
      dialog(t("details")).innerHTML = html;
    },
    tip: (el, html) => {
      el.dataset.mobileTooltip = html;
    },
    panelOpen: (panel) => {
      pauseForPanel();
      if (["win-bag", "win-character", "win-skills"].includes(panel?.id)) {
        panel.classList.add("mobile-classic");
        classicLayout();
      }
    },
    shop: (el, html, buy) => {
      el.onclick = () => {
        const p = dialog(t("purchase"));
        p.innerHTML = html;
        p.lastElementChild?.remove();
        const count = el.dataset.mobileBulk === "true" ? quantity(p, 999) : () => 1;
        button(
          t("purchase"),
          async () => {
            const n = count();
            if (!n) return;
            closeDetail();
            await buy({ shiftKey: false, purchaseCount: n });
          },
          p,
        );
        if (el.dataset.mobileBulk === "true") {
          button(
            t("buy10"),
            async () => {
              closeDetail();
              await buy({ shiftKey: true });
            },
            p,
          );
          button(
            t("buy100"),
            async () => {
              closeDetail();
              await buy({ purchaseCount: 100 });
            },
            p,
          );
        }
      };
    },
    execute: (type, data, dispatch) => gate.execute(type, data, dispatch),
    manage: async (route, data, dispatch) => {
      if (route === "start" && (portrait || document.hidden || !inForeground()))
        throw Error(t(portrait ? "startLandscape" : "startForeground"));
      management++;
      const ticket = pauseGeneration;
      controller.clear({ target: true });
      try {
        if (gate.pending) await gate.pending;
        await pauseChain;
        const result = await dispatch();
        if (
          ["start", "create", "cloud/restore", "cloud/rollback", "cloud/merge", "entry"].includes(
            route,
          )
        ) {
          if (route === "start") {
            if (ticket !== pauseGeneration || portrait || document.hidden || !inForeground())
              await suspend("resume");
            else {
              controller.reasons.clear();
              resumeRequired = false;
              paused = false;
            }
          } else if (controller.reasons.size) await b.pause(true);
        }
        return result;
      } finally {
        management--;
        updatePause();
        autoResume();
      }
    },
    diagnostics: () => ({
      mode: "mobile",
      worldView: viewMode,
      worldScale: viewScale,
      target: controller.target,
      attacking: controller.attacking,
      force: controller.force,
      path: controller.path.length,
      joystick: controller.joystick,
      reasons: [...controller.reasons],
      paused,
      pending: !!gate.pending,
      queued: gate.queued,
      management,
    }),
  };
  if (m2)
    ext = installV2(
      {
        petPortraits,
        continueInspectionAttack,
        primaryAttackSetting,
        decoratePrimaryAttack,
        b,
        root,
        controller,
        gate,
        t,
        button,
        dialog,
        closeDetail,
        inventoryDetail,
        bindSlots,
        petMenu,
        layout: () => layout(),
        viewMode: () => viewMode,
        viewScale: () => viewScale,
        setViewMode,
        inForeground,
      },
      hooks,
    );
  layout();
  hooks.update();
  panelTabs();
  return hooks;
}


export { mountMobile };

