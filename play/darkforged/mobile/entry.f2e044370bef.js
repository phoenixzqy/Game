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
var distance = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
function joystickDirection(x, y, deadZone = 14) {
  if (Math.hypot(x, y) < deadZone) return null;
  return (Math.round(Math.atan2(y, x) / (Math.PI / 4)) + 2 + 8) % 8;
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
    "Poisoning",
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
function spellMode(spell) {
  return Object.keys(groups).find((k) => groups[k].includes(spell));
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
  }
  clear({ target = false, journey = true } = {}) {
    this.epoch++;
    this.healTarget = 0;
    this.path = [];
    this.joystick = null;
    this.attacking = false;
    this.force = false;
    this.interaction = 0;
    this.aim = null;
    this.retryAt = 0;
    if (target) {
      this.target = 0;
      this.manualTarget = false;
    }
    if (journey) this.journey = null;
    this.b.changed?.();
  }
  blocked() {
    const s = this.b.state();
    return this.reasons.size > 0 || !s?.me || s.stage !== "Game" || s.me.dead || this.b.panel();
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
      if (this.attacking) {
        this.attacking = false;
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
    if (this.blocked()) return;
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
    this.clear();
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
    if (this.blocked()) return;
    if (this.force) {
      this.clear();
      return;
    }
    this.ensureTarget();
    if (!this.target) {
      this.b.message("selectTarget");
      return;
    }
    const active = this.attacking;
    this.clear();
    this.attacking = !active;
    this.b.changed?.();
  }
  forceAttack() {
    if (this.blocked()) return;
    this.clear();
    this.force = true;
  }
  move(goal) {
    if (this.blocked()) return;
    this.clear();
    this.path = this.b.path(goal) || [];
    if (!this.path.length && distance(goal, this.b.state().me)) this.b.message("blocked");
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
    this.clear();
    this.joystick = dir;
  }
  release() {
    this.epoch++;
    this.joystick = null;
    this.path = [];
  }
  routeNear(a, range) {
    const m = this.b.state().me,
      list = [];
    for (let dx = -range; dx <= range; dx++)
      for (let dy = -range; dy <= range; dy++) list.push({ x: a.x + dx, y: a.y + dy });
    list.sort((a2, b) => distance(m, a2) - distance(m, b));
    for (const p of list) {
      const path = this.b.path(p);
      if (path !== null) {
        this.path = path;
        return true;
      }
    }
    return false;
  }
  async send(type, data = {}) {
    return this.b.command(type, data);
  }
  async cast(spell, loc) {
    if (this.blocked()) return;
    this.ensureTarget();
    const mode = spellMode(spell),
      s = this.b.state(),
      m = s.me,
      skill = m.skills.find((s2) => s2.Spell === spell);
    if (!skill) return;
    if (!mode || mode === "passive" || mode === "unavailable") {
      this.b.message(mode === "passive" ? "passive" : "unsupportedSkill");
      return;
    }
    if (mode === "ground" || mode === "direction") {
      if (!loc) {
        this.clear();
        this.aim = spell;
        this.b.message("aim");
        return;
      }
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
      mode !== "toggle" &&
      mode !== "armed" &&
      (this.b.ready("spellReadyIn") > 0 ||
        this.b.ready("actionReadyIn") > 0 ||
        (skill.CastTime || 0) > s.time)
    ) {
      this.b.message("cooldown");
      return;
    }
    if (mode !== "toggle" && mode !== "armed" && m.mp < this.b.cost(skill)) {
      this.b.message("mana");
      return;
    }
    const healTarget = spell === "Healing" ? this.healTarget : 0;
    this.clear();
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
    const point = mode === "self" || mode === "target" || mode === "pet" ? target : loc;
    const dir = distance(m, point) ? this.b.direction(point.x - m.x, point.y - m.y) : m.dir;
    await this.send("Magic", {
      Spell: spell,
      Direction: directions[dir],
      TargetID: mode === "target" || mode === "self" || mode === "pet" ? target.id : 0,
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
  async tick() {
    if (this.busy || this.blocked() || !this.b.worldReady() || this.b.now() < this.retryAt) return;
    this.busy = true;
    try {
      const s = this.b.state(),
        m = s.me;
      let a = s.actors.find(
          (a2) => a2.id === this.interaction && (!this.b.groundVisible || this.b.groundVisible(a2)),
        ),
        target = this.attacking && s.actors.find((a2) => a2.id === this.target && !a2.dead);
      if (this.interaction && !a) this.interaction = 0;
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
        if (this.b.ready("actionReadyIn") > 0) return;
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
        this.retryAt = this.b.now() + 80;
        return;
      }
      if (!this.path.length && a && distance(m, a) > (a.kind === "npc" ? 3 : 0))
        this.routeNear(a, a.kind === "npc" ? 3 : 0);
      if (!this.path.length && target && distance(m, target) > 1) this.routeNear(target, 1);
      if (!this.path.length && this.journey) await this.travelStep();
      if (this.path.length) {
        if (this.b.ready("actionReadyIn") > 0) return;
        const route = this.path,
          epoch = this.epoch,
          dest = route[0];
        if (distance(m, dest) !== 1) {
          this.path = this.b.path(route.at(-1)) || [];
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
        if (moved) this.path.splice(0, moved);
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
      if (
        target &&
        distance(m, target) <= 1 &&
        this.b.ready("attackReadyIn") === 0 &&
        this.b.ready("actionReadyIn") === 0
      )
        await this.send("Attack", {
          Direction: directions[this.b.direction(target.x - m.x, target.y - m.y)],
          Spell: this.b.melee(),
          TargetID: target.id,
        });
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
      id !== null
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

var text = {
  "zh-CN": {
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
    "startLandscape": "角色已保留，请横屏后点击进入。"
  },
  "en": {
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
    "startLandscape": "Character saved. Rotate to landscape, then Enter."
  },
  "es": {
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
    "startLandscape": "Personaje guardado. Gira la pantalla y pulsa Entrar."
  }
}
;


var mobileText = (locale, key) => (text[locale] || text.en)[key] || text.en[key] || key;

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
  css.href = new URL("./mobile.903487d0d26a.css", import.meta.url).href;
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
    refreshing = false;
  const controller = new MobileController({
    ...b,
    command: (type, data) => gate.execute(type, data, () => b.dispatch(type, data), true),
    panel: () => !!detail || !!$("#windows .window"),
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
    '<div class="mobile-top"><div class="mobile-vitals"></div><button data-menu></button></div><div class="mobile-battle"><div class="mobile-stick" role="group"><i></i></div><div class="mobile-bars"><div data-items></div><div data-skills></div></div><div class="mobile-actions"></div><button class="mobile-aim" hidden></button></div><div class="mobile-pause" hidden><div><h2></h2><p></p><button></button><button data-manage></button></div></div>';
  const battle = root.querySelector(".mobile-battle"),
    vitals = root.querySelector(".mobile-vitals"),
    actions = root.querySelector(".mobile-actions"),
    pause = root.querySelector(".mobile-pause"),
    stick = root.querySelector(".mobile-stick"),
    aim = root.querySelector(".mobile-aim");
  root.querySelector("[data-menu]").textContent = t("menu");
  root.querySelector("[data-menu]").onclick = menu;
  const targetButton = button(t("target"), () => controller.cycle(), actions),
    attackButton = button(t("attack"), () => controller.attack(), actions, {
      className: "mobile-attack",
    }),
    pickButton = button(t("pickup"), () => controller.pickup(), actions);
  targetButton.dataset.action = "target";
  attackButton.dataset.action = "attack";
  pickButton.dataset.action = "pickup";
  aim.textContent = t("cancel");
  aim.onclick = () => controller.clear();
  function closeDetail() {
    detail?.remove();
    detail = null;
    moveUid = null;
  }
  function dialog(title, inspectX) {
    closeDetail();
    controller.clear();
    detail = document.createElement("section");
    detail.className = "mobile-dialog" + (inspectX === void 0 ? "" : " mobile-inspector");
    if (inspectX !== void 0) detail.dataset.side = inspectX < innerWidth / 2 ? "right" : "left";
    detail.setAttribute("role", "dialog");
    detail.setAttribute("aria-label", title);
    const h = document.createElement("h2");
    h.textContent = title;
    detail.append(h);
    button(t("close"), closeDetail, detail, { className: "mobile-close" });
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
    const body = dialog(t("menu"));
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
    button(
      t("pet"),
      () => {
        const p = dialog(t("pet"));
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
      },
      body,
    );
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
  function bindSlots(spell, uid) {
    const body = dialog(t("chooseSlot"));
    for (let i = 0; i < (spell ? 8 : 6); i++)
      button(
        String(i + 1),
        async () => {
          await b.command(
            spell ? "MagicKey" : "BindItemHotkey",
            spell ? { Spell: spell, Key: i + 1 } : { UniqueID: uid, Key: i },
          );
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
      body = dialog(b.itemName(item), x);
    body.insertAdjacentHTML("beforeend", b.itemText(item));
    const exists = () => {
      const me = b.state()?.me;
      if (me?.id !== owner) return false;
      const list =
        type === "equipment" && slot === 13
          ? [me.inventory.find((i) => i?.uid === me.mountUid) || me.equipment[13]]
          : type === "equipment"
            ? me.equipment
            : type === "storage"
              ? me.storage
              : me.inventory;
      return list.some((i) => i?.uid === uid);
    };
    if (b.favoriteEligible?.(item)) {
      button(
        b.favoriteLabel(item),
        async () => {
          panelTaps.reset();
          if (!exists()) {
            closeDetail();
            return;
          }
          await b.favorite(uid);
          closeDetail();
        },
        body,
      );
      button(
        b.compareLabel(),
        () => {
          panelTaps.reset();
          if (exists()) {
            closeDetail();
            b.compare(uid);
          }
        },
        body,
      );
    }
    const action = (label, fn) =>
      button(
        t(label),
        async () => {
          if (!exists()) {
            closeDetail();
            return;
          }
          await fn();
          closeDetail();
        },
        body,
      );
    if (type === "equipment") {
      if (slot === 13) button(t("mount"), () => b.command("ToggleMount"), body);
      else
        action("remove", () =>
          b.command("RemoveItem", {
            Grid: "Inventory",
            UniqueID: uid,
            To: b.state().me.inventory.findIndex((i) => !i),
          }),
        );
    } else if (type === "storage") action("withdraw", () => b.transfer("TakeBackItem", slot, uid));
    else {
      action("use", () => b.use(item));
      if (b.itemMode() === "store") action("store", () => b.transfer("StoreItem", slot, uid));
      if (["repair", "specialRepair"].includes(b.itemMode()))
        action("repair", () =>
          b.command(b.itemMode() === "repair" ? "RepairItem" : "SRepairItem", { UniqueID: uid }),
        );
      if (b.itemMode() === "sell") {
        const count = quantity(body, item.count);
        action("sell", () => {
          const n = count();
          return n && b.command("SellItem", { UniqueID: uid, Count: n });
        });
      }
      button(t("bind"), () => bindSlots(null, uid), body);
      button(
        t("move"),
        () => {
          closeDetail();
          moveUid = uid;
          b.say(t("chooseDestination"));
        },
        body,
      );
      if (item.count > 1)
        button(
          t("split"),
          () => {
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
          body,
        );
      button(
        t("drop"),
        () => {
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
        body,
      );
    }
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
          key: `${scope}:${type}:${item?.uid ?? "empty" + slot}`,
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
        else inventoryDetail(slot, type, event.clientX);
      } else if (type === "storage") b.transfer("TakeBackItem", slot, uid);
      else if (slot === 13) b.command("ToggleMount");
      else
        b.command("RemoveItem", {
          Grid: "Inventory",
          UniqueID: uid,
          To: me.inventory.findIndex((i) => !i),
        });
    } else inventoryDetail(slot, type, event.clientX);
  });
  const releaseStick = (e) => {
    if (e && e.pointerId !== stickPointer) return;
    stickPointer = null;
    stick.querySelector("i").style.transform = "";
    controller.release();
  };
  const steer = (e) => {
    if (e.pointerId !== stickPointer) return;
    const r = stick.getBoundingClientRect(),
      x = e.clientX - r.left - r.width / 2,
      y = e.clientY - r.top - r.height / 2,
      length = Math.hypot(x, y),
      factor = Math.min(1, 36 / (length || 1));
    stick.querySelector("i").style.transform = `translate(${x * factor}px,${y * factor}px)`;
    const dir = joystickDirection(x, y);
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
  const canvas = b.canvas;
  canvas.setAttribute("aria-label", t("tapHint"));
  canvas.onpointerdown = (e) => {
    if (controller.blocked() || worldPointer) return;
    e.preventDefault();
    worldPointer = { id: e.pointerId, x: e.clientX, y: e.clientY };
    canvas.setPointerCapture(e.pointerId);
  };
  canvas.onpointerup = (e) => {
    if (e.pointerId !== worldPointer?.id) return;
    const p = worldPointer;
    worldPointer = null;
    if (Math.hypot(e.clientX - p.x, e.clientY - p.y) > 14 || controller.blocked()) return;
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
    if (portrait || document.hidden || !inForeground() || refreshing) return;
    refreshing = true;
    const ticket = pauseGeneration;
    const button2 = pause.querySelector("button");
    dom.property(button2, "disabled", true);
    try {
      controller.clear();
      await pauseChain;
      await b.refresh();
      if (ticket !== pauseGeneration || portrait || document.hidden || !inForeground()) return;
      controller.reasons.delete("error");
      controller.reasons.delete("resume");
      controller.reasons.delete("hidden");
      controller.reasons.delete("blur");
      controller.reasons.delete("background");
      await b.pause(false);
      if (ticket !== pauseGeneration || portrait || document.hidden || !inForeground()) {
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
      dom.property(button2, "disabled", portrait || document.hidden || !inForeground());
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
      width = Math.round(v?.width || innerWidth),
      height = Math.round(v?.height || innerHeight);
    dom.style(root, "--mobile-width", width + "px");
    dom.style(root, "--mobile-height", height + "px");
    dom.style(document.documentElement, "--mobile-width", width + "px");
    dom.style(document.documentElement, "--mobile-height", height + "px");
    const next = innerHeight > innerWidth;
    if (next !== portrait) {
      portrait = next;
      if (portrait) suspend("portrait");
      else {
        controller.reasons.delete("portrait");
        updatePause();
      }
    }
    b.viewport(width, height, 0.85);
    return { w: Math.round(width / 0.85), h: Math.round(height / 0.85) };
  }
  function update() {
    controller.snapshot();
    const s = b.state(),
      game = s?.stage === "Game";
    const hasPanel = !!$("#windows .window");
    if (hasPanel && !lastPanel) controller.clear();
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
      dom.text(attackButton, t(controller.attacking || controller.force ? "stop" : "attack"));
      dom.attribute(attackButton, "aria-pressed", String(controller.attacking || controller.force));
      dom.property(aim, "hidden", !controller.aim);
      const stamp = JSON.stringify([
        s.me.itemHotkeys,
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
          if (item) b.icon(el.querySelector("canvas"), item);
          el.querySelector("small").textContent = item?.count || "";
          if (!item) el.textContent = t("items");
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
          if (!skill) el.querySelector("small").textContent = t("skills");
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
                await b.command("BindItemHotkey", { Key: key, UniqueID: i.uid });
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
  $("#windows").addEventListener(
    "pointerdown",
    () => {
      controller.clear();
      releaseStick();
    },
    true,
  );
  function panelTabs() {
    const wins = [...$("#windows").children].filter((w) =>
      ["win-bag", "win-storage", "win-shop", "win-forge"].includes(w.id),
    );
    if (wins.length < 2) return;
    for (const w of wins) {
      let nav = w.querySelector(".mobile-panel-tabs");
      if (!nav) {
        nav = document.createElement("nav");
        nav.className = "mobile-panel-tabs";
        w.querySelector("h2").after(nav);
      }
      const stamp = wins.map((w2) => w2.id).join();
      if (nav.dataset.stamp === stamp) continue;
      nav.dataset.stamp = stamp;
      nav.replaceChildren();
      for (const target of wins)
        if (target !== w)
          button(
            target.querySelector("h2").textContent,
            () => target.parentElement.append(target),
            nav,
          );
    }
  }
  const observer = new MutationObserver(() => {
    panelTabs();
    const hasPanel = !!$("#windows .window");
    if (hasPanel && !lastPanel) controller.clear();
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
  layout();
  update();
  panelTabs();
  return {
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
    canStart: () => !portrait && !document.hidden,
    startMessage: () => t("startLandscape"),
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
      controller.clear();
      releaseStick();
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
        button(
          t("purchase"),
          async () => {
            closeDetail();
            await buy({ shiftKey: false });
          },
          p,
        );
        if (el.dataset.mobileBulk === "true")
          button(
            t("buy10"),
            async () => {
              closeDetail();
              await buy({ shiftKey: true });
            },
            p,
          );
      };
    },
    execute: (type, data, dispatch) => gate.execute(type, data, dispatch),
    manage: async (route, data, dispatch) => {
      if (route === "start" && (portrait || document.hidden || !inForeground()))
        throw Error(t("startLandscape"));
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
}


export { mountMobile };

