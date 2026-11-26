// games/darkforged/singleplayer/ui/viewport-range.ts
function viewportActorRange(width, height) {
  const w = Number(width),
    h = Number(height);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return 24;
  return Math.max(
    24,
    Math.min(
      26,
      Math.ceil(Math.max(Math.min(w, 1920) / 96 + 2, (Math.min(h, 1080) / 2 + 90) / 32 + 6)),
    ),
  );
}

// games/darkforged/singleplayer/core/dream-combat-timing.ts
function dreamAttackDelay(stats2) {
  return Math.max(600, 1100 - 50 * (stats2.AttackSpeed || 0));
}
function dreamCastDelay(stats2) {
  return Math.max(600, 1500 - 90 * (stats2.CastSpeed || 0));
}

// games/darkforged/singleplayer/core/hydra-balance.ts
var hydraLevel = (level) => Math.min(7, Math.max(0, Math.trunc(level)));
function hydraStats(d, level) {
  const row = d.HydraRanks?.[hydraLevel(level)];
  if (!row) throw Error("Missing Hydra rank configuration");
  return row;
}

// games/darkforged/singleplayer/core/text.ts
var message = (key, params = {}) => ({ $text: key, params });
var entityText = (kind, id, field = "name") => ({ $entity: kind, id: String(id), field });
var LocalizedError = class extends Error {
  detail;
  constructor(detail) {
    super(detail.$text);
    this.name = "LocalizedError";
    this.detail = detail;
  }
};
function errorText(error) {
  return error instanceof LocalizedError ||
    (error instanceof Error && "detail" in error && typeof error.detail?.$text === "string")
    ? error.detail
    : error instanceof Error
      ? error.message
      : String(error);
}

// games/darkforged/singleplayer/core/dream-skills.ts
function poisoningDamage(level, stats2) {
  return (
    Math.max(
      1,
      Math.floor(4 * level + Math.max(0, ((stats2.MinSC || 0) + (stats2.MaxSC || 0)) / 2) * 0.2),
    ) + Math.max(0, stats2.AffixPoisonDamage || 0)
  );
}
function skillCost(d, level, stats2 = {}) {
  let cost = d.DreamSkill
    ? d.DreamSkill.costBase + Math.max(0, level - 1) * d.DreamSkill.costStep
    : d.BaseCost + level * d.LevelCost;
  if (["Teleport", "Blink"].includes(d.Spell))
    cost += Math.trunc((cost * (stats2.TeleportManaPenaltyPercent || 0)) / 100);
  return Math.max(0, Math.trunc(cost * (1 + (stats2.ManaPenaltyPercent || 0) / 100)));
}
function effectiveSkillLevel(s, d, stats2) {
  if (!d.DreamSkill || s.temporary) return s.Level;
  const level =
    s.Level +
    Math.max(0, Math.trunc(stats2["SkillLevel:" + d.Spell] || 0)) +
    Math.max(0, Math.trunc(stats2["ElementLevel:" + d.DreamSkill.element] || 0));
  return d.Spell === "Hydra" ? hydraLevel(level) : level;
}
function dreamBasicPower(d, level, rng, high2 = true) {
  if (d.Spell === "Hydra") return hydraStats(d, level).power;
  const raw = d.DreamRaw,
    l = Math.min(10, Math.max(0, level));
  if (raw?.MultiBase) {
    const pick = (base, bonus) =>
      Number(raw[base] || 0) +
      (rng && raw[bonus] ? rng.next(Number(raw[bonus]) + 1) : high2 ? Number(raw[bonus] || 0) : 0);
    const mp = pick("MPowerBase", "MPowerBonus");
    return (
      Math.trunc(Math.fround(Math.fround(mp * (l + 2)) * 0.5)) + pick("PowerBase", "PowerBonus")
    );
  }
  const n = d.DreamSkill;
  return Math.max(0, Math.floor(n.powerBase + n.powerStep * l));
}
function dreamCoefficient(d, level) {
  if (d.Spell === "Hydra") return hydraStats(d, level).mcPercent / 100;
  const raw = d.DreamRaw,
    l = Math.min(10, Math.max(0, level));
  return raw?.MultiBase
    ? Math.max(0, (raw.MultiBase + (l + 1) * (raw.MultiBonus || 0)) / 100)
    : Math.max(0, d.DreamSkill.coefficient + d.DreamSkill.coefficientStep * l);
}
function bookNextRank(d, book, learned, roleLevel) {
  const next = learned + 1,
    lo = Number(book.DreamBookMin || 1),
    hi = Number(book.DreamBookMax || 3);
  if (next < lo)
    throw new LocalizedError(
      message("core.dream-skills.bookNextRank.3f898de048", {
        p0: entityText("skills", d.Spell),
        p1: lo - 1,
      }),
    );
  if (next > hi)
    throw new LocalizedError(
      message("core.dream-skills.bookNextRank.b42eb4fe14", { p0: lo, p1: hi }),
    );
  const row = d.DreamRanks?.[next - 1];
  if (!row) throw new LocalizedError(message("core.dream-skills.bookNextRank.d7dd7a4828"));
  if (roleLevel < row.LvReq)
    throw new LocalizedError(
      message("core.dream-skills.bookNextRank.564a7fbe79", { p0: row.LvReq }),
    );
  return next;
}
function dreamPassiveStats(d, level) {
  const l = Math.min(level, d.DreamRanks?.length || 3);
  switch (d.Spell) {
    case "Fencing":
      return { Accuracy: [0, 3, 5, 8][l], MinDC: [0, 3, 5, 7][l], MaxDC: [0, 3, 5, 7][l] };
    case "SpiritSword":
      return { Accuracy: l, Agility: Math.max(0, l - 1) };
    // 3.11 CanStruck 0x175489..0x1754b7 reads rank Increase; rank >=3 uses row 3.
    case "Steadfast":
      return {
        NoFlinchPercent:
          level > 0 ? Number(d.DreamRanks?.[Math.min(3, level) - 1]?.Increase || 0) : 0,
      };
    case "Berserker":
      return { MinDCRatePercent: 10 + 5 * l, MaxDCRatePercent: 15 + 5 * l, Accuracy: 1 + l };
    default:
      return {};
  }
}

// games/darkforged/singleplayer/core/rules.ts
var Random = class {
  seed = Array(56).fill(0);
  i = 0;
  j = 21;
  constructor(value = 1) {
    let mj = 161803398 - Math.abs(value === -2147483648 ? 2147483647 : value);
    this.seed[55] = mj;
    let mk = 1;
    for (let n = 1; n < 55; n++) {
      const ii = (21 * n) % 55;
      this.seed[ii] = mk;
      mk = (mj - mk) | 0;
      if (mk < 0) mk += 2147483647;
      mj = this.seed[ii];
    }
    for (let k = 1; k < 5; k++)
      for (let n = 1; n < 56; n++) {
        this.seed[n] = (this.seed[n] - this.seed[1 + ((n + 30) % 55)]) | 0;
        if (this.seed[n] < 0) this.seed[n] += 2147483647;
      }
  }
  sample() {
    if (++this.i >= 56) this.i = 1;
    if (++this.j >= 56) this.j = 1;
    let n = (this.seed[this.i] - this.seed[this.j]) | 0;
    if (n === 2147483647) n--;
    if (n < 0) n += 2147483647;
    this.seed[this.i] = n;
    return n;
  }
  next(max, min = 0) {
    if (!Number.isInteger(max) || max < min) throw Error("Invalid random bounds");
    return min + Math.floor((this.sample() / 2147483647) * (max - min));
  }
  export() {
    return { seed: [...this.seed], i: this.i, j: this.j };
  }
  restore(s) {
    this.seed = [...s.seed];
    this.i = s.i;
    this.j = s.j;
  }
};
var f = Math.fround;
function baseStat(s, job, level) {
  if (!s.Gain) return s.Base;
  let v;
  if (s.FormulaType === "Health")
    v = f(
      s.Base +
        f(f(f(level / s.Gain) + s.GainRate) + (job === "Warrior" ? f(level / 20) : 0)) * level,
    );
  else if (s.FormulaType === "Mana")
    v =
      job === "Wizard"
        ? f(f(s.Base + f(f(f(f(level / s.Gain) + 2) * f(2.2)) * level)) + f(level * s.GainRate))
        : job === "Taoist"
          ? f(f(s.Base + f(f(f(level / s.Gain) * f(2.2)) * level)) + f(level * s.GainRate))
          : f(f(s.Base + f(level * s.Gain)) + f(level * s.GainRate));
  else
    v =
      s.FormulaType === "Weight"
        ? f(s.Base + f(f(level / s.Gain) * level))
        : f(s.Base + f(level / s.Gain));
  return Math.trunc(Math.min(s.Max > 0 ? s.Max : 2147483647, v));
}
var attackDelay = (level, stats2, nativeDream = false) =>
  nativeDream
    ? dreamAttackDelay(stats2)
    : Math.max(550, 1400 - ((stats2.AttackSpeed || 0) * 60 + Math.min(370, level * 14)));
function attackPower(stats2, kind, rng) {
  const min = Math.max(0, stats2["Min" + kind] || 0),
    max = Math.max(min, stats2["Max" + kind] || 0),
    luck = stats2.Luck || 0;
  const curse = (n) => Math.floor(n * (1 - Math.min(100, stats2.NativeCursePercent || 0) / 100));
  if (
    luck > 0 &&
    (stats2.NativeLuckFormula ? rng.next(100) < Math.min(80, luck * 8) : luck > rng.next(10))
  )
    return curse(max);
  if (luck < 0 && luck < -rng.next(stats2.NativeLuckFormula ? 10 - luck : 10)) return curse(min);
  return curse(rng.next(max + 1, min));
}
function roundEven(n) {
  const lo = Math.floor(n),
    part = n - lo;
  return part === 0.5 ? lo + (lo % 2) : Math.round(n);
}
function magicPower(s, level, rng) {
  if (s.DreamSkill) return dreamBasicPower(s, level);
  const mp =
      s.MPowerBonus > 0 ? rng.next(s.MPowerBase + s.MPowerBonus, s.MPowerBase) : s.MPowerBase,
    base = s.PowerBonus > 0 ? rng.next(s.PowerBase + s.PowerBonus, s.PowerBase) : s.PowerBase;
  return roundEven(f(f(f(mp / 4) * (level + 1)) + base));
}
var magicDamage = (s, level, power, rng) =>
  s.DreamSkill
    ? Math.trunc(
        Math.fround(
          Math.fround(power + dreamBasicPower(s, level, rng)) *
            Math.fround(dreamCoefficient(s, level)),
        ),
      )
    : Math.trunc(
        f((power + magicPower(s, level, rng)) * f(s.MultiplierBase + f(level * s.MultiplierBonus))),
      );
function matchesClass(required, job) {
  return (
    required === "None" ||
    required === job ||
    required === "WarWizTao" ||
    required.split(", ").includes(job) ||
    ({ Warrior: "War", Wizard: "Wiz", Taoist: "Tao" }[job] &&
      required.includes({ Warrior: "War", Wizard: "Wiz", Taoist: "Tao" }[job]))
  );
}
var equipmentTypes = /* @__PURE__ */ new Set([
  "Weapon",
  "Armour",
  "Helmet",
  "Necklace",
  "Bracelet",
  "Ring",
  "Belt",
  "Boots",
  "Stone",
]);
var slots = {
  Weapon: [0],
  Armour: [1],
  Helmet: [2],
  Talisman: [3],
  Necklace: [4],
  Bracelet: [5, 6],
  Ring: [7, 8],
  Amulet: [9],
  Belt: [10],
  Boots: [11],
  Stone: [12],
  Mount: [13],
};
function itemSlots(def) {
  return def.DreamType === 6 ? [14] : slots[def.Type];
}
function price(item, def) {
  let p = def.Price;
  if (def.Durability > 0) {
    p = Math.trunc(f(item.maxDura * f(f(def.Price / 2) / def.Durability)));
    const r = item.maxDura ? f(item.currentDura / item.maxDura) : 0;
    p = Math.floor(f(f(f(p / 2) + f(f(p / 2) * r)) + f(def.Price / 2)));
  }
  return Math.trunc(f(p * f(f(Object.keys(item.added).length * f(0.1)) + 1))) * item.count;
}
function affixes(item, def, rng, early) {
  const s = def.RandomStats || {};
  const binomial = (n, p) => {
    let v = 0;
    for (let i = 0; i < n; i++) if (rng.next(p) === 0) v++;
    return v;
  };
  if (s.MaxDuraChance > 0 && rng.next(s.MaxDuraChance) === 0) {
    const add2 = binomial(s.MaxDuraMaxStat, s.MaxDuraStatChance) * 1e3;
    item.maxDura = Math.min(65535, item.maxDura + add2);
    item.currentDura = item.maxDura;
  }
  const keys2 = {
    MaxAc: "MaxAC",
    MaxMac: "MaxMAC",
    MaxDc: "MaxDC",
    MaxMc: "MaxMC",
    MaxSc: "MaxSC",
    Accuracy: "Accuracy",
    Agility: "Agility",
    Hp: "HP",
    Mp: "MP",
    Strong: "Strong",
    MagicResist: "MagicResist",
    PoisonResist: "PoisonResist",
    HpRecov: "HealthRecovery",
    MpRecov: "SpellRecovery",
    PoisonRecov: "PoisonRecovery",
    CriticalRate: "CriticalRate",
    CriticalDamage: "CriticalDamage",
    Freeze: "Freezing",
    PoisonAttack: "PoisonAttack",
    AttackSpeed: "AttackSpeed",
    Luck: "Luck",
  };
  const quality = early?.qualityProfiles?.[String(def.Grade)];
  const budget = quality || early;
  if (
    early &&
    budget &&
    equipmentTypes.has(def.Type) &&
    early.profiles.includes(def.RandomStatsId) &&
    (quality ||
      (!early.qualityProfiles &&
        def.RequiredType === "Level" &&
        def.RequiredAmount <= early.maxRequiredLevel))
  ) {
    if (rng.next(100) >= budget.exceptionalPercent) return;
    const combat = /* @__PURE__ */ new Set(["MaxAC", "MaxMAC", "MaxDC", "MaxMC", "MaxSC"]);
    const pool = Object.entries(keys2)
      .filter(([prefix]) => s[prefix + "Chance"] > 0)
      .map(([, key]) => ({
        key,
        weight: ["MaxDC", "MaxMC", "MaxSC"].includes(key) ? 3 : 1,
        min: 1,
        max: combat.has(key) ? budget.totalPointWeights.length : 1,
      }));
    pool.push(
      { key: "KillHP", weight: 2, min: early.killHP[0], max: early.killHP[1] },
      { key: "KillMP", weight: 2, min: early.killMP[0], max: early.killMP[1] },
    );
    let total = 1,
      roll = rng.next(budget.totalPointWeights.reduce((sum, weight) => sum + weight, 0));
    while (total < budget.totalPointWeights.length && roll >= budget.totalPointWeights[total - 1])
      roll -= budget.totalPointWeights[total++ - 1];
    const countRoll = rng.next(100);
    let count = Math.min(
      total,
      countRoll < early.thirdAffixPercent
        ? 3
        : countRoll < early.thirdAffixPercent + early.secondAffixPercent
          ? 2
          : 1,
    );
    const options = [];
    const choose = (at, picked) => {
      if (picked.length === count) {
        if (
          picked.reduce((sum, p) => sum + p.min, 0) <= total &&
          picked.reduce((sum, p) => sum + p.max, 0) >= total
        )
          options.push({ stats: picked, weight: picked.reduce((w, p) => w * p.weight, 1) });
        return;
      }
      for (let i = at; i < pool.length; i++) choose(i + 1, [...picked, pool[i]]);
    };
    while (count > 0 && !options.length) {
      choose(0, []);
      if (!options.length) count--;
    }
    if (!options.length) return;
    roll = rng.next(options.reduce((sum, option) => sum + option.weight, 0));
    let index = 0;
    while (roll >= options[index].weight) roll -= options[index++].weight;
    const selected = options[index].stats;
    let remaining = total;
    for (let i = 0; i < selected.length; i++) {
      const stat = selected[i],
        rest = selected.slice(i + 1);
      const min = Math.max(stat.min, remaining - rest.reduce((sum, p) => sum + p.max, 0));
      const max = Math.min(stat.max, remaining - rest.reduce((sum, p) => sum + p.min, 0));
      const value = min === max ? min : rng.next(max + 1, min);
      item.added[stat.key] = value;
      remaining -= value;
    }
    return;
  }
  for (const [prefix, key] of Object.entries(keys2))
    if (s[prefix + "Chance"] > 0 && rng.next(s[prefix + "Chance"]) === 0)
      item.added[key] = binomial(s[prefix + "MaxStat"] - 1, s[prefix + "StatChance"]) + 1;
}
function isSupportedBook(def, rules) {
  if (!rules.adaptations.dreamRuntime || def.Type !== "Book") return true;
  const skill = rules.skills.find((s) => s.Spell === def.Spell);
  if (!skill?.DreamSkill) return false;
  const job = skill.DreamRaw?.Job;
  return job === void 0 || def.RequiredClass === ["Warrior", "Wizard", "Taoist"][job];
}
function attemptDrop(d, defs, rules, rng) {
  const def = d.item === null ? void 0 : defs.get(d.item);
  if (def && !isSupportedBook(def, rules)) return null;
  const mult =
      d.dropMultiplierMode === "fixed"
        ? 1
        : d.gold > 0
          ? rules.multipliers.goldDropChanceMultiplier
          : def && equipmentTypes.has(def.Type) && !d.quest
            ? rules.multipliers.equipmentDropMultiplier
            : 1,
    rate = Math.max(1, Math.trunc(d.chance));
  if (
    d.chancePercent !== void 0
      ? rng.next(1e4) >= Math.min(100, d.chancePercent * mult) * 100
      : mult === 1
        ? rng.next(rate) !== 0
        : (rng.sample() / 2147483647) * rate >= mult
  )
    return null;
  if (d.gold)
    return {
      gold: Math.min(
        4294967295,
        rng.next(d.gold + Math.floor(d.gold / 2), Math.floor(d.gold / 2)) *
          rules.multipliers.goldAmountMultiplier,
      ),
      items: [],
    };
  if (d.item !== null) return { gold: 0, items: def ? [{ id: def.Index, quest: d.quest }] : [] };
  let gold = 0,
    items = [];
  if (d.group) {
    for (const child of d.group.items) {
      const r = attemptDrop(child, defs, rules, rng);
      if (r) {
        gold += r.gold;
        items.push(...r.items);
        if (d.group.first) break;
      }
    }
    if (d.group.random && items.length) items = [items[rng.next(items.length)]];
  }
  return { gold, items };
}

// games/darkforged/singleplayer/core/bag-compartments.ts
var STORAGE_PAGE_SLOTS = 80;
var STORAGE_PAGE_PRICES = [0, 5e5, 1e6];
function equipmentCapacity(r, rules) {
  const c = rules.adaptations.bagExpansion;
  return c.baseSlots + (r.bagExpansionRows || 0) * c.columns;
}
function carriedCapacity(r, rules) {
  return equipmentCapacity(r, rules) * (r.bagLayoutVersion === 1 ? 2 : 1);
}
function isBagEquipment(d) {
  return !!itemSlots(d)?.length;
}
function bagRange(r, rules, d) {
  const n = equipmentCapacity(r, rules);
  return r.bagLayoutVersion !== 1
    ? [0, r.inventory.length]
    : isBagEquipment(d)
      ? [0, n]
      : [n, 2 * n];
}
function bagSlotAccepts(r, rules, d, index) {
  const [start, end] = bagRange(r, rules, d);
  return index >= start && index < end;
}
function normalizeBagCompartments(r, rules, defs) {
  const n = equipmentCapacity(r, rules),
    source = r.inventory;
  if (
    r.bagLayoutVersion === 1 &&
    source.length === 2 * n &&
    source.every((i, k) => !i || (!!defs.get(i.id) && bagSlotAccepts(r, rules, defs.get(i.id), k)))
  )
    return;
  const target = Array(2 * n).fill(null),
    pending = [];
  for (let k = 0; k < source.length; k++) {
    const i = source[k];
    if (!i) continue;
    const d = defs.get(i.id);
    if (!d) throw new LocalizedError(message("storage.inventory"));
    const start = isBagEquipment(d) ? 0 : n,
      end = start + n;
    if (k >= start && k < end && !target[k]) target[k] = i;
    else pending.push(i);
  }
  const overflow = [];
  for (const i of pending) {
    const d = defs.get(i.id),
      start = isBagEquipment(d) ? 0 : n,
      k = target.findIndex((v, k2) => !v && k2 >= start && k2 < start + n);
    if (k < 0) overflow.push(i);
    else target[k] = i;
  }
  for (const i of overflow) {
    const old = source.indexOf(i),
      k = old >= 0 && old < target.length && !target[old] ? old : target.findIndex((v) => !v);
    if (k < 0) throw new LocalizedError(message("storage.inventory"));
    target[k] = i;
  }
  r.inventory = target;
  r.bagLayoutVersion = 1;
}
function unlockStoragePage(r, page) {
  const current = r.storagePages || 1;
  if (!Number.isSafeInteger(page) || page !== current + 1 || page > 3)
    throw new LocalizedError(message("storage.unlockOrder"));
  const price2 = STORAGE_PAGE_PRICES[page - 1];
  if (r.gold < price2) throw new LocalizedError(message("storage.unlockGold", { gold: price2 }));
  r.gold -= price2;
  r.storage.push(...Array(STORAGE_PAGE_SLOTS).fill(null));
  r.storagePages = page;
}
function inheritStorageCapacity(incoming, previous) {
  for (const r of incoming) {
    const old = previous.find(
      (p) =>
        (r.cloudId && p.cloudId === r.cloudId) ||
        (!r.cloudId && !p.cloudId && p.id === r.id && p.name === r.name && p.job === r.job),
    );
    const pages = Math.max(r.storagePages || 1, old?.storagePages || 1);
    if (pages > (r.storagePages || 1)) {
      r.storage.push(...Array(pages * STORAGE_PAGE_SLOTS - r.storage.length).fill(null));
      r.storagePages = pages;
    }
  }
}

// games/darkforged/singleplayer/core/item-hotkeys.ts
var quickItemTypes = ["Potion", "Scroll", "Book", "BagExpansion", "TreasureMap"];
function migrateItemHotkeys(r, defs) {
  r.itemHotkeys ??= Array.from({ length: 6 }, (_, key) => {
    const item = r.inventory[key];
    return item && quickItemTypes.includes(defs.get(item.id)?.Type || "") ? item.id : null;
  });
}
function isTeleportRing(def) {
  return def?.Type === "Ring" && def.Unique?.split(",").some((flag) => flag.trim() === "Teleport");
}
function nextQuickRing(role, binding) {
  const worn = role.equipment[binding.slot];
  if (!worn) return;
  const matches = (ref) => worn.uid === ref.uid && worn.id === ref.id;
  const next = matches(binding.teleport)
    ? binding.original
    : matches(binding.original)
      ? binding.teleport
      : null;
  if (next) return role.inventory.find((item) => item?.uid === next.uid && item.id === next.id);
}
function remapRingHotkeys(role, local, shared) {
  if (!Array.isArray(role.ringHotkeys)) return;
  role.ringHotkeys = role.ringHotkeys.map((binding) => {
    if (!binding) return null;
    const lookup = (uid) => local.get(uid) ?? shared?.get(uid);
    const teleport = lookup(binding.teleport?.uid),
      original = lookup(binding.original?.uid);
    if (teleport === void 0 || original === void 0) return null;
    return {
      ...binding,
      teleport: { ...binding.teleport, uid: teleport },
      original: { ...binding.original, uid: original },
    };
  });
}

// games/darkforged/singleplayer/core/shared-storage.ts
var SHARED_STORAGE_SLOTS = 80;
var sharedStorageGame = (rules) => "darkforged";
var hasSharedStorage = (rules) => rules.adaptations.sharedStorage?.enabled === true;
function canShareItem(item, def, rules) {
  if (
    !hasSharedStorage(rules) ||
    !def ||
    item.bound ||
    item.noSharedStorage ||
    [
      rules.adaptations.blessingTalisman?.itemId,
      rules.adaptations.starterTalisman?.itemId,
      rules.adaptations.testTalisman?.itemId,
      rules.adaptations.combatTestTalisman?.itemId,
    ].includes(def.Index)
  )
    return false;
  if (/(?:^|,\s*)(?:DontTrade|DontStore)(?:,|$)/i.test(def.Bind || "")) return false;
  return (
    !!itemSlots(def)?.length ||
    (def.Type === "Book" &&
      !!def.Spell &&
      def.Spell !== "None" &&
      rules.skills.some((s) => s.Spell === def.Spell))
  );
}
function starterItem(item, rules) {
  if (hasSharedStorage(rules)) item.noSharedStorage = true;
  return item;
}

// games/darkforged/singleplayer/core/sun-potion.ts
var SUN_POTION_COOLDOWN_MS = 4e3;
function isSunPotion(d) {
  return d.Type === "Potion" && d.Shape === 1 && [670, 671, 21231].includes(d.Index);
}
function sunPotionRemaining(r, now) {
  return Math.max(0, Math.min(SUN_POTION_COOLDOWN_MS, (r.sunPotionAt || 0) - now));
}

// games/darkforged/singleplayer/core/towns.ts
function residence(r, rules) {
  const cfg = rules.adaptations.towns;
  const town = cfg?.settlements.find((t) => t.id === (r.homeTown || cfg.default));
  if (town) return town;
  const home = rules.world.maps.find((m) => m.start);
  return {
    id: cfg?.default || "village",
    name: "\u65B0\u624B\u6751",
    map: home.id,
    at: home.center,
    radius: 4,
    npcIds: [],
  };
}
function moveToBichon(g, r) {
  const town = residence({ homeTown: "bichon" }, g.rules);
  r.map = town.map;
  [r.x, r.y] = town.at;
  r.target = 0;
  g.npc = 0;
  g.initializeMap(r.map);
  g.bringPets(r);
}
function unlockArrivalWaypoints(r, rules) {
  const added = [];
  for (const w of rules.adaptations.towns?.waypoints || []) {
    if (!w.unlockOnArrival || r.unlockedWaypoints?.includes(w.id)) continue;
    if (r.map !== w.map && !(w.arrivalQuest && r.completedQuests.includes(w.arrivalQuest)))
      continue;
    (r.unlockedWaypoints ??= []).push(w.id);
    added.push(w.id);
  }
  return added;
}
function waypointAction(g, r, n, key) {
  const waypoints = g.rules.adaptations.towns?.waypoints || [];
  const returning = waypoints.find((w2) => w2.npcId === n.id && key === "@waypointreturn-" + w2.id);
  const outbound = waypoints.find(
    (w2) => w2.stationIds.includes(n.id) && key === "@waypoint-" + w2.id,
  );
  const w = returning || outbound;
  if (!w) return false;
  g.requireNPC(r);
  if (!returning && !r.unlockedWaypoints?.includes(w.id))
    throw new LocalizedError(message("npc.waypointLocked", { map: entityText("maps", w.map) }));
  const destination = returning ? w.returnMap : w.map,
    at = returning ? w.returnAt : w.at;
  if (returning && !r.unlockedWaypoints?.includes(w.id)) {
    (r.unlockedWaypoints ??= []).push(w.id);
    g.say(message("npc.waypointUnlocked", { map: entityText("maps", w.map) }));
  }
  r.target = 0;
  r.map = destination;
  r.x = at[0];
  r.y = at[1];
  g.npc = 0;
  g.emit("NPCResponse", { NPCID: n.id, Page: [] });
  return true;
}
function waypointPage(g, r, n) {
  return (g.rules.adaptations.towns?.waypoints || []).flatMap((w) => {
    const params = { map: entityText("maps", w.map) };
    if (w.npcId === n.id)
      return [
        message(w.unlockOnArrival ? "npc.waypointArrivalIntro" : "npc.waypointIntro", params),
        {
          $dialogue: [{ label: message("npc.waypointReturn"), action: "@waypointreturn-" + w.id }],
        },
      ];
    if (!w.stationIds.includes(n.id)) return [];
    return r.unlockedWaypoints?.includes(w.id)
      ? [
          {
            $dialogue: [
              { label: message("npc.waypointTravel", params), action: "@waypoint-" + w.id },
            ],
          },
        ]
      : [message(w.unlockOnArrival ? "npc.waypointArrivalLocked" : "npc.waypointLocked", params)];
  });
}

// games/darkforged/singleplayer/core/item-cooldowns.ts
var SNOW_COOLDOWN_MS = 8e3;
function isSnowPotion(d) {
  return (
    d.Type === "Potion" &&
    (d.Index === 20260 || d.DreamOriginalId === 260 || d.DreamName === "\u4E07\u5E74\u96EA\u971C")
  );
}
function itemCooldownRemaining(r, d, now) {
  return isSnowPotion(d)
    ? Math.max(0, Math.min(SNOW_COOLDOWN_MS, (r.itemCooldowns?.snow || 0) - now))
    : 0;
}
function startItemCooldown(r, d, now) {
  if (isSnowPotion(d)) (r.itemCooldowns ??= {}).snow = now + SNOW_COOLDOWN_MS;
}

// games/darkforged/singleplayer/core/weapon-growth.ts
var weaponGrowthRule = { cap: 10, experiencePerLevel: 7e4 };
function weaponGrowthStats(i, d) {
  if (d.Type !== "Weapon" || (i.maxDura > 0 && !i.currentDura)) return {};
  const level = Math.min(weaponGrowthRule.cap, i.weaponGrowth?.level || 0);
  return { Luck: Math.floor(level / 3), WeakSpotPercent: level * 2 };
}
function gainWeaponGrowth(g, r, xp) {
  const item = r.equipment[0];
  if (
    !g.rules.adaptations.dreamRuntime ||
    !item ||
    g.defs.get(item.id)?.Type !== "Weapon" ||
    (item.maxDura > 0 && !item.currentDura) ||
    xp <= 0
  )
    return;
  const growth = (item.weaponGrowth ??= { level: 0, xp: 0 });
  if (growth.level >= weaponGrowthRule.cap) return;
  const before = growth.level;
  growth.xp += Math.floor(xp);
  while (
    growth.level < weaponGrowthRule.cap &&
    growth.xp >= (growth.level + 1) * weaponGrowthRule.experiencePerLevel
  ) {
    growth.xp -= (growth.level + 1) * weaponGrowthRule.experiencePerLevel;
    growth.level++;
  }
  if (growth.level === weaponGrowthRule.cap) growth.xp = 0;
  if (growth.level !== before) {
    g.refresh(r);
    g.say(
      message("core.weapon-growth.gainWeaponGrowth.8021f12fab", {
        p0: growth.level,
        p1: Math.floor(growth.level / 3),
        p2: growth.level * 2,
      }),
    );
  }
}

// games/darkforged/singleplayer/core/item-quality.ts
var qualityKeys = /* @__PURE__ */ new Set([
  "MaxDC",
  "MaxMC",
  "MaxSC",
  "MaxAC",
  "MaxMAC",
  "Luck",
  "Accuracy",
  "Agility",
]);
var dreamQualities = [
  { name: message("quality.0"), color: "#ffffff", guideColor: "#002060" },
  { name: message("quality.1"), color: "#42d976", guideColor: "#00b050" },
  { name: message("quality.2"), color: "#acc769", guideColor: "#76923c" },
  { name: message("quality.3"), color: "#66ffff", guideColor: "#66ffff" },
  { name: message("quality.4"), color: "#6699ff", guideColor: "#0033cc" },
  { name: message("quality.5"), color: "#ff7474", guideColor: "#ff0000" },
  { name: message("quality.6"), color: "#9999ff", guideColor: "#000099" },
  { name: message("quality.7"), color: "#ffff66", guideColor: "#ffff66" },
  { name: message("quality.8"), color: "#ff66ff", guideColor: "#ff00ff" },
];
function exceptionalPoints(item) {
  if (item?.added.GemTier) return item.added.GemTier === 2 ? 4 : 1;
  return Object.entries(item?.added || {}).reduce(
    (sum, [key, value]) =>
      sum + (qualityKeys.has(key) && Number.isFinite(value) ? Math.max(0, value) : 0),
    0,
  );
}
function dreamSetStates(equipment, defs) {
  const sets = /* @__PURE__ */ new Map();
  for (const i of equipment)
    if (i) for (const s of defs.get(i.id)?.DreamSets || []) sets.set(s.id, s);
  return [...sets.values()].map((s) => {
    const valid = equipment.filter((i) => !!i && (!i.maxDura || i.currentDura > 0));
    const count = s.members.reduce(
      (n, m) => n + Math.min(m.count, valid.filter((i) => m.items.includes(i.id)).length),
      0,
    );
    return { ...s, count, total: s.members.reduce((n, m) => n + m.count, 0) };
  });
}

// games/darkforged/singleplayer/core/equipment-management.ts
function equipmentLocked(item) {
  return item?.locked === true || item?.dxFavorite === true;
}
function equipmentLockable(item, def) {
  return !!item && !!def && def.StackSize === 1 && !!itemSlots(def)?.length && item.count === 1;
}
function assertEquipmentDisposable(item) {
  if (equipmentLocked(item)) throw new LocalizedError(message("manage.protected"));
}
function setEquipmentLock(g, r, data) {
  if (!Number.isSafeInteger(data.UniqueID) || typeof data.Locked !== "boolean")
    throw new LocalizedError(message("manage.invalidItem"));
  const item = [...r.inventory, ...r.equipment, ...r.storage].find((i) => i?.uid === data.UniqueID);
  if (!equipmentLockable(item, g.defs.get(item?.id ?? -1)))
    throw new LocalizedError(message("manage.invalidItem"));
  if (g.rules.adaptations.diablo?.enabled) {
    if (data.Locked) item.dxFavorite = true;
    else delete item.dxFavorite;
    delete item.locked;
  } else if (data.Locked) item.locked = true;
  else delete item.locked;
}
var saleQualities = (dark) =>
  dark
    ? ["normal", "magic", "rare", "set", "legendary"]
    : Array.from({ length: 9 }, (_, i) => "q" + i);
function saleQuality(item, dark) {
  return dark
    ? String(item.dx?.rarity || "normal")
    : "q" + Math.min(8, Math.floor(exceptionalPoints(item)));
}
function saleSpecial(item, def) {
  const dx = item.dx;
  return !!(
    item.affixes?.length ||
    item.handmade ||
    item.bound ||
    item.potential ||
    item.potentialOptions?.length ||
    item.gemCount ||
    item.added.GemTier ||
    item.weaponGrowth?.level ||
    item.weaponGrowth?.xp ||
    def.BossAccessory ||
    def.DreamSets?.length ||
    (def.Unique && def.Unique !== "None") ||
    ["set", "legendary"].includes(dx?.rarity || "") ||
    dx?.sockets ||
    dx?.runes?.length ||
    dx?.affixes?.length ||
    dx?.runeword
  );
}
function bulkSaleSelection(r, defs, filter, dark = false) {
  const valid = saleQualities(dark);
  if (
    !filter ||
    !Array.isArray(filter.qualities) ||
    filter.qualities.some((q) => !valid.includes(q)) ||
    typeof filter.includeSpecial !== "boolean"
  )
    throw new LocalizedError(message("manage.invalidFilter"));
  const worn = new Set(r.equipment.filter(Boolean).map((i) => i.uid));
  if (r.mountUid) worn.add(r.mountUid);
  const rows = r.inventory
    .filter((i) => !!i)
    .filter((item) => {
      const d = defs.get(item.id);
      return (
        equipmentLockable(item, d) &&
        !equipmentLocked(item) &&
        !worn.has(item.uid) &&
        !d.Bind.includes("DontSell") &&
        filter.qualities.includes(saleQuality(item, dark)) &&
        (filter.includeSpecial || !saleSpecial(item, d))
      );
    })
    .sort((a, b) => a.uid - b.uid)
    .map((item) => ({
      item,
      gold: Math.trunc(price(item, defs.get(item.id)) / 2),
      special: saleSpecial(item, defs.get(item.id)),
    }));
  return {
    rows,
    total: rows.reduce((n, row) => n + row.gold, 0),
    expected: JSON.stringify(rows.map(({ item, gold }) => [item, gold])),
  };
}
function sellEquipmentBatch(g, r, data) {
  const npc = g.requireNPC(r);
  if (npc.id !== data.NPCID || !g.rules.adaptations.universalSaleRoles.includes(npc.role))
    throw new LocalizedError(message("manage.shopRequired"));
  const quote = bulkSaleSelection(r, g.defs, data.Filter, !!g.rules.adaptations.diablo?.enabled);
  if (!quote.rows.length || quote.expected !== data.Expected)
    throw new LocalizedError(message("manage.saleChanged"));
  if (!Number.isSafeInteger(quote.total) || !Number.isSafeInteger(r.gold + quote.total))
    throw new LocalizedError(message("manage.invalidFilter"));
  const backup = structuredClone(r),
    nextId = g.nextId,
    packets = g.packets.slice(),
    cursor = g.cursor;
  try {
    for (const { item } of quote.rows)
      g.command("SellItem", { UniqueID: item.uid, Count: item.count });
  } catch (error) {
    Object.assign(r, backup);
    if (backup.buyback === void 0) delete r.buyback;
    g.nextId = nextId;
    g.packets = packets;
    g.cursor = cursor;
    throw error;
  }
  g.say(message("manage.sold", { count: quote.rows.length, gold: quote.total }));
}

// games/darkforged/singleplayer/core/challenges.ts
function enterChallenge(g, r, id) {
  const c = g.rules.adaptations.guideChallenges?.find((c2) => c2.id === id);
  const entrance = g.requireNPC(r),
    altar = g.rules.adaptations.lateContent?.fireAltar,
    altarEntry =
      !!altar &&
      id === altar.challenge &&
      entrance.id === altar.npcId &&
      r.level >= altar.level &&
      r.lateQuests?.altar?.stage === 3;
  if (!c || r.dead || (entrance.id !== 9420 && !altarEntry))
    throw new LocalizedError(message("core.challenges.enterChallenge.924500cc7e"));
  if (r.challengeRun || r.trialRun || r.treasureRun)
    throw new LocalizedError(message("core.challenges.enterChallenge.381831c37b"));
  if (g.count(r, c.ticket) < 1)
    throw new LocalizedError(
      message("core.challenges.enterChallenge.3ac3294db7", { p0: entityText("items", c.ticket) }),
    );
  const region = g.region(c.map),
    geo = g.geometry.get(c.map),
    [x, y] = region.center;
  if (!geo || geo.solid[y * geo.width + x])
    throw new LocalizedError(message("core.challenges.enterChallenge.9c11bd7a83"));
  g.maps[c.map] = { actors: [], respawns: {} };
  g.events = g.events.filter((e) => e.map !== c.map);
  g.consume(r, c.ticket, 1);
  r.map = c.map;
  r.x = x;
  r.y = y;
  r.target = 0;
  g.npc = 0;
  const state2 = (r.challengeRewards ??= {
    sequence: 0,
    poCompletions: 0,
    pending: [],
    claimed: [],
  });
  r.challengeRun = {
    runId: r.id + ":" + ++state2.sequence,
    id,
    map: c.map,
    wave: 0,
    started: false,
    cleared: false,
    deadline: g.time + c.minutes * 6e4,
    nextWaveAt: 0,
  };
  g.initializeMap(c.map);
  g.bringPets(r);
  g.emit("NPCResponse", { NPCID: 9420, Page: [] });
  g.emit("MapChanged", { MapIndex: c.map });
  g.say(
    message("core.challenges.enterChallenge.c380a5cf44", {
      p0: entityText("maps", region.id),
      p1: c.minutes,
    }),
  );
}
function leaveChallenge(g, r, message2 = message("challenge.left"), autoReturn = false) {
  const run = r.challengeRun;
  if (!run) return;
  if (r.dead) {
    r.dead = false;
    r.hp = Math.max(1, r.maxHP);
    r.mp = r.maxMP;
    r.buffs = [];
  }
  const challenge = g.rules.adaptations.guideChallenges?.find((c) => c.id === run.id);
  if (autoReturn && challenge?.ticketName.endsWith("\u85CF\u5B9D\u56FE")) moveToBichon(g, r);
  else {
    const home = g.rules.world.maps.find((m) => m.start);
    r.map = home.id;
    [r.x, r.y] = home.center;
    r.target = 0;
    g.npc = 0;
    g.initializeMap(r.map);
    g.bringPets(r);
  }
  g.clearExitedInstance(r, run.map);
  delete r.challengeRun;
  g.emit("MapChanged", { MapIndex: r.map });
  g.emit("NPCResponse", { NPCID: 0, Page: [] });
  g.say(message2);
}
function startChallenge(g, r) {
  const run = r.challengeRun,
    n = g.requireNPC(r);
  if (!run || run.map !== r.map || n.role !== "challenge")
    throw new LocalizedError(message("core.challenges.startChallenge.26f7fd3f6c"));
  if (run.started) throw new LocalizedError(message("core.challenges.startChallenge.555f8fcc3b"));
  run.started = true;
  run.nextWaveAt = g.time + 1e3;
  g.emit("NPCResponse", { NPCID: n.id, Page: [] });
  g.say(message("core.challenges.startChallenge.4a37e8bec3"));
}
function maybeSealPoCompletion(g, r) {
  const run = r.challengeRun,
    c = g.rules.adaptations.guideChallenges?.find((c2) => c2.id === "po");
  if (
    !run ||
    !c ||
    run.id !== "po" ||
    run.map !== r.map ||
    !run.started ||
    run.cleared ||
    run.branch ||
    run.wave < c.waves.length ||
    g.time >= run.deadline ||
    g.map(run.map).actors.some((a) => a.kind === "monster" && !a.friendly && !a.dead)
  )
    return false;
  sealChallengeRewards(g, r);
  run.branch = "choice";
  run.nextWaveAt = 0;
  g.say(message("late.poChoice"));
  return true;
}
function challengeTick(g, r) {
  const run = r.challengeRun;
  if (!run) return;
  if (r.map !== run.map) {
    g.clearExitedInstance(r, run.map);
    delete r.challengeRun;
    return;
  }
  if (g.time >= (run.cleared && run.returnAt !== void 0 ? run.returnAt : run.deadline)) {
    leaveChallenge(g, r, message(run.cleared ? "challenge.complete" : "challenge.timeout"), true);
    return;
  }
  if (!run.started || run.cleared || r.dead) return;
  const c = g.rules.adaptations.guideChallenges.find((c2) => c2.id === run.id),
    map2 = g.map(run.map);
  for (const row of c.waves.flat().filter((row2) => row2.at)) {
    const def = [...g.monsters.values()].find((m) => m.Name === row.monster);
    for (const a of map2.actors.filter(
      (a2) =>
        a2.definition === def?.Index &&
        !a2.dead &&
        a2.special?.challenge === run.map &&
        !a2.special.challengeAnchored,
    )) {
      const [x, y] = row.at;
      if (g.walkable(run.map, x, y, a.id)) {
        a.x = x;
        a.y = y;
        a.special.challengeAnchored = true;
      }
    }
  }
  if (map2.actors.some((a) => a.kind === "monster" && !a.friendly && !a.dead)) return;
  if (!run.nextWaveAt) {
    run.nextWaveAt = g.time + (run.wave < c.waves.length ? 2e3 : 0);
    if (run.wave < c.waves.length) return;
  }
  if (g.time < run.nextWaveAt) return;
  if (maybeSealPoCompletion(g, r)) return;
  if (run.branch === "choice") return;
  const wave = c.waves[run.wave];
  const rows = wave || [{ monster: c.chest, count: 1 }];
  let cursor = 0;
  const pending = [],
    reserved = /* @__PURE__ */ new Set();
  for (const row of rows)
    for (let n = 0; n < row.count; n++) {
      const def = [...g.monsters.values()].find((m) => m.Name === row.monster);
      if (!def)
        throw new LocalizedError(
          message("core.challenges.challengeTick.380afbda2e", { p0: row.monster }),
        );
      let at;
      const points = row.at ? [row.at] : c.spawnPoints;
      for (let tries = 0; tries < points.length && !at; tries++) {
        const p = points[row.at ? 0 : cursor++ % points.length],
          key = p.join(",");
        if (!reserved.has(key) && g.walkable(r.map, p[0], p[1])) {
          at = { x: p[0], y: p[1] };
          reserved.add(key);
        }
      }
      if (!at) {
        run.nextWaveAt = g.time + 1e3;
        return;
      }
      pending.push({ def, at, anchored: !!row.at });
    }
  for (const { def, at, anchored } of pending) {
    const actor = g.newMonster(def, r.map, at);
    actor.special = { ...actor.special, challenge: run.map, challengeAnchored: anchored };
    map2.actors.push(actor);
  }
  run.nextWaveAt = 0;
  if (wave) {
    run.wave++;
    g.say(
      message("core.challenges.challengeTick.12497496fc", { p0: run.wave, p1: c.waves.length }),
    );
  } else {
    run.cleared = true;
    sealChallengeRewards(g, r);
    deliverChallengeRewards(g, r);
    run.returnAt = g.time + c.returnDelay;
    g.say(
      message("core.challenges.challengeTick.3a4c97432a", { p0: Math.ceil(c.returnDelay / 1e3) }),
    );
  }
}
function rewardState(r) {
  return (r.challengeRewards ??= { sequence: 0, poCompletions: 0, pending: [], claimed: [] });
}
function sealChallengeRewards(g, r) {
  const run = r.challengeRun;
  if (!run || run.id !== "po" || run.rewardSealed) return;
  const state2 = rewardState(r);
  run.runId ??= r.id + ":" + ++state2.sequence;
  if (state2.pending.some((p) => p.runId === run.runId) || state2.claimed.includes(run.runId)) {
    run.rewardSealed = true;
    return;
  }
  const sword = state2.poCompletions === 0 || g.rng.next(1e4) < 2e3,
    medal = g.rng.next(1e4) < 1e3,
    items = [];
  if (sword) items.push(g.newItem(20828, 1, true, void 0, r));
  if (medal)
    items.push(
      g.newItem({ Warrior: 20864, Wizard: 20865, Taoist: 20866 }[r.job], 1, true, void 0, r),
    );
  state2.poCompletions++;
  run.rewardSealed = true;
  if (items.length) state2.pending.push({ runId: run.runId, items });
  else state2.claimed.push(run.runId);
}
function deliverChallengeRewards(g, r) {
  const state2 = rewardState(r);
  for (const receipt2 of [...state2.pending]) {
    const draft = {
      ...r,
      inventory: structuredClone(r.inventory),
      questInventory: structuredClone(r.questInventory),
    };
    let okay = true;
    for (const item of receipt2.items)
      if (!g.give(draft, structuredClone(item), false)) {
        okay = false;
        break;
      }
    if (!okay) break;
    r.inventory = draft.inventory;
    r.questInventory = draft.questInventory;
    state2.pending = state2.pending.filter((p) => p.runId !== receipt2.runId);
    if (!state2.claimed.includes(receipt2.runId)) state2.claimed.push(receipt2.runId);
    g.say(message("late.rewardClaimed"));
  }
}
function claimChallengeRewards(g, r) {
  const n = g.requireNPC(r);
  if (n.id !== 9420 && !(n.role === "challenge" && r.challengeRun))
    throw new LocalizedError(message("late.claimNpc"));
  deliverChallengeRewards(g, r);
}
function challengeChoice(g, r, choice) {
  const run = r.challengeRun,
    n = g.requireNPC(r);
  if (
    !run ||
    run.id !== "po" ||
    run.map !== r.map ||
    run.branch !== "choice" ||
    n.role !== "challenge" ||
    r.dead
  )
    throw new LocalizedError(message("late.poUnavailable"));
  if (choice === "evil") {
    const cfg = g.rules.adaptations.lateContent?.evilDragon;
    if (!cfg || g.count(r, cfg.heart) < 1) throw new LocalizedError(message("late.needHeart"));
    const def = [...g.monsters.values()].find((d) => d.Name === cfg.monster);
    const spot = g.freeNear(r.map, { x: r.x + 3, y: r.y }, 8);
    if (!def || !spot) throw new LocalizedError(message("late.landing"));
    const boss = g.newMonster(def, r.map, spot);
    boss.special = { ...boss.special, challenge: run.map, evilDragon: true };
    if (!g.consume(r, cfg.heart, 1)) throw new LocalizedError(message("late.needHeart"));
    g.map(r.map).actors.push(boss);
    run.branch = "evil";
    run.nextWaveAt = 0;
    g.say(message("late.evilSummoned"));
  } else {
    run.branch = "settle";
    run.nextWaveAt = 0;
    challengeTick(g, r);
  }
  g.emit("NPCResponse", { NPCID: n.id, Page: [] });
}
function challengeRewardPage(r, npcId) {
  const lines = [];
  if (r.challengeRun?.branch === "choice")
    lines.push(
      { $dialogue: [{ label: message("late.evilChoice"), action: "@late-evil-dragon" }] },
      { $dialogue: [{ label: message("late.settleChoice"), action: "@late-po-settle" }] },
    );
  if (r.challengeRewards?.pending.length)
    lines.push({ $dialogue: [{ label: message("late.claimChoice"), action: "@challengeclaim" }] });
  return lines;
}

// games/darkforged/singleplayer/core/darkforged-favorite.ts
function dxFavoriteEligible(item, def) {
  return !!def && def.StackSize === 1 && !!itemSlots(def) && item.count === 1;
}
function dxFavoriteProtected(g, item) {
  return !!g.rules.adaptations.diablo?.enabled && equipmentLocked(item);
}
function assertDxDisposable(g, item) {
  if (dxFavoriteProtected(g, item))
    throw new LocalizedError(message("dx.favorite.error.protected"));
}
function dxFavorite(g, r, data) {
  if (!g.rules.adaptations.diablo?.enabled)
    throw new LocalizedError(message("dx.favorite.error.unavailable"));
  const uid = data.UniqueID;
  if (
    typeof uid !== "number" ||
    !Number.isSafeInteger(uid) ||
    uid < 0 ||
    typeof data.Favorite !== "boolean"
  )
    throw new LocalizedError(message("dx.favorite.error.target"));
  const item = [...r.inventory, ...r.equipment, ...r.storage].find((i) => i?.uid === uid);
  if (!item || !dxFavoriteEligible(item, g.defs.get(item.id)))
    throw new LocalizedError(message("dx.favorite.error.target"));
  if (data.Favorite) item.dxFavorite = true;
  else delete item.dxFavorite;
  delete item.locked;
}

// games/darkforged/singleplayer/core/late-quests.ts
function fail(key) {
  throw new LocalizedError(message("late." + key));
}
var state = (r) => (r.lateQuests ??= {});
function checkNpc(g, r, id) {
  if (r.dead || g.requireNPC(r).id !== id) fail("wrongNpc");
}
function checkLevel(r, level) {
  if (r.level < level) throw new LocalizedError(message("late.level", { level }));
}
function trade(g, r, inputs, outputs) {
  const draft = {
    ...r,
    inventory: structuredClone(r.inventory),
    questInventory: structuredClone(r.questInventory),
  };
  for (const row of inputs) if (!g.consume(draft, row.item, row.count)) fail("missing");
  for (const row of outputs)
    if (!g.give(draft, g.newItem(row.item, row.count), false)) fail("full");
  r.inventory = draft.inventory;
  r.questInventory = draft.questInventory;
}
function lateItemDeficit(g, r, id, map2) {
  const cfg = g.rules.adaptations.lateContent;
  if (!cfg) return 0;
  const p = cfg.sevenPearls;
  if (
    p &&
    r.level >= p.level &&
    r.lateQuests?.pearls?.active &&
    p.materials.some((v) => v.item === id && v.mapIds?.includes(map2))
  )
    return Math.max(0, 1 - g.count(r, id));
  const a = cfg.fireAltar;
  if (a && r.level >= a.level && r.lateQuests?.altar?.stage === 1 && a.spiritItems.includes(id))
    return Math.max(0, 1 - g.count(r, id));
  const b = cfg.bloodCycle;
  if (b && r.level >= b.level) {
    const stage = r.lateQuests?.blood?.stage || 0,
      source = b.stages[stage === 2 ? 1 : 0];
    if (source?.item === id && source.map === map2) return Math.max(0, 1 - g.count(r, id));
  }
  return 0;
}
function originalMonster(d) {
  return Number(d.DreamOriginalId ?? d.OriginalId ?? /^GuideNative(\d+)$/.exec(d.Name)?.[1]);
}
function lateMonsterDrop(g, r, a, d) {
  const cfg = g.rules.adaptations.lateContent;
  if (!cfg || a.friendly || a.special?.trialFloor || a.special?.bossMinion) return;
  const native = originalMonster(d),
    sources = [];
  const altar = cfg.fireAltar;
  if (altar && r.level >= altar.level && r.lateQuests?.altar?.stage === 1)
    sources.push(...altar.sourceDrops);
  const blood = cfg.bloodCycle;
  if (blood && r.level >= blood.level) {
    const phase = r.lateQuests?.blood?.stage || 0;
    sources.push(blood.stages[phase === 2 ? 1 : 0]);
  }
  for (const row of sources) {
    if (
      !row ||
      native !== row.monsterOriginalId ||
      (row.map !== void 0 && row.map !== a.map) ||
      (row.mapIds && !row.mapIds.includes(a.map)) ||
      g.count(r, row.item) >= 1
    )
      continue;
    if (g.rng.next(row.chance) !== 0) continue;
    const item = g.newItem(row.item);
    if (!g.insert(r.questInventory, item, 0)) continue;
    g.emit("GainedQuestItem", { Item: { ItemIndex: row.item, Count: 1 } });
    if (blood?.stages[0].item === row.item) {
      const s = state(r);
      s.blood ??= { stage: 0, cycles: 0 };
      if (s.blood.stage === 0) s.blood.stage = 1;
    }
  }
}
function lateAction(g, r, key) {
  const cfg = g.rules.adaptations.lateContent;
  if (!cfg) fail("unavailable");
  const p = cfg.sevenPearls,
    a = cfg.fireAltar,
    b = cfg.bloodCycle,
    t = cfg.secretTicket;
  if (key === "@late-pearls" || key === "@late-pearls-exchange") {
    if (!p) fail("unavailable");
    checkNpc(g, r, p.npcId);
    checkLevel(r, p.level);
    const s = state(r);
    s.pearls ??= { active: false, exchanges: 0 };
    if (key === "@late-pearls-exchange") {
      if (!s.pearls.active) fail("acceptFirst");
      trade(
        g,
        r,
        p.materials.map((v) => ({ item: v.item, count: 1 })),
        p.rewards,
      );
      s.pearls.exchanges++;
      g.say(message("late.pearlsExchanged", { count: s.pearls.exchanges }));
    } else s.pearls.active = true;
  } else if (key === "@late-altar" || key === "@late-altar-submit" || key === "@late-altar-enter") {
    if (!a) fail("unavailable");
    checkNpc(g, r, a.npcId);
    checkLevel(r, a.level);
    const s = state(r);
    s.altar ??= { stage: 0 };
    if (key === "@late-altar") {
      if (s.altar.stage === 0) s.altar.stage = 1;
    } else if (key === "@late-altar-submit") {
      if (s.altar.stage === 1) {
        trade(
          g,
          r,
          a.spiritItems.map((item) => ({ item, count: 1 })),
          [],
        );
        s.altar.stage = 2;
      } else if (s.altar.stage === 2) {
        trade(g, r, [{ item: a.talisman, count: 1 }], []);
        s.altar.stage = 3;
      } else fail("noSubmission");
    } else {
      if (s.altar.stage !== 3) fail("altarLocked");
      enterChallenge(g, r, a.challenge);
      return;
    }
  } else if (key === "@late-blood" || key === "@late-blood-submit") {
    if (!b) fail("unavailable");
    checkNpc(g, r, b.npcId);
    checkLevel(r, b.level);
    const s = state(r);
    s.blood ??= { stage: 0, cycles: 0 };
    if (key === "@late-blood-submit") {
      const phase = s.blood.stage;
      if (phase !== 1 && phase !== 2) fail("noSubmission");
      trade(g, r, [{ item: b.stages[phase - 1].item, count: 1 }], []);
      if (phase === 1) s.blood.stage = 2;
      else {
        s.blood.stage = 0;
        s.blood.cycles++;
        r.gold += b.gold;
        g.gainXP(r, b.experience);
        g.say(message("late.bloodComplete", { count: s.blood.cycles }));
      }
    }
  } else if (key.startsWith("@late-secret-")) {
    if (!t) fail("unavailable");
    checkNpc(g, r, t.npcId);
    const dest = t.shortcuts.find((v) => v.map === Number(key.slice(13)));
    if (!dest || !r.completedQuests.includes(dest.requiresQuest)) fail("secretLocked");
    const geo = g.geometry.get(dest.map);
    if (!geo) fail("landing");
    g.initializeMap(dest.map);
    const landing = g.freeNear(dest.map, { x: dest.x, y: dest.y }, 3);
    if (!landing) fail("landing");
    if (!g.consume(r, t.item, 1)) fail("missing");
    r.map = dest.map;
    r.x = landing.x;
    r.y = landing.y;
    r.target = 0;
    g.npc = 0;
    g.initializeMap(r.map);
    g.bringPets(r);
    g.emit("MapChanged", { MapIndex: r.map });
    g.emit("NPCResponse", { NPCID: 0, Page: [] });
    return;
  } else if (key === "@late-scarlet-sword") {
    const s = cfg.scarletSword;
    if (!s) fail("unavailable");
    checkNpc(g, r, s.npcId);
    g.emit("ScarletSwordOptions", { Materials: s.materials, Result: s.result });
    return;
  } else fail("unavailable");
  const n = g.requireNPC(r);
  g.emit("NPCResponse", { NPCID: n.id, Page: lateNpcPage(g, r, n) });
}
function exchangeScarletSword(g, r, selected) {
  const cfg = g.rules.adaptations.lateContent?.scarletSword;
  if (!cfg) fail("unavailable");
  checkNpc(g, r, cfg.npcId);
  if (!Array.isArray(selected) || new Set(selected).size !== selected.length)
    fail("selectEquipment");
  const material = cfg.materials.filter((row) => g.defs.get(row.item)?.Type === "Weapon"),
    chosen = [];
  for (const row of material) {
    const items = selected
      .map((uid) => r.inventory.find((i) => i?.uid === uid))
      .filter((i) => !!i && i.id === row.item);
    if (
      items.length !== row.count ||
      items.some(
        (i) => i.bound || i.locked || i.count !== 1 || r.equipment.some((e) => e?.uid === i.uid),
      )
    )
      fail("selectEquipment");
    chosen.push(...items);
  }
  if (chosen.length !== selected.length) fail("selectEquipment");
  chosen.forEach((item) => assertDxDisposable(g, item));
  const draft = {
    ...r,
    inventory: structuredClone(r.inventory),
    questInventory: structuredClone(r.questInventory),
  };
  for (const item of chosen)
    draft.inventory[draft.inventory.findIndex((i) => i?.uid === item.uid)] = null;
  for (const row of cfg.materials.filter((row2) => !material.includes(row2)))
    if (!g.consume(draft, row.item, row.count)) fail("missing");
  if (!g.give(draft, g.newItem(cfg.result, 1, true, void 0, r), false)) fail("full");
  r.inventory = draft.inventory;
  r.questInventory = draft.questInventory;
  g.say(message("late.scarletComplete"));
}
function lateQuestRows(g, r) {
  const cfg = g.rules.adaptations.lateContent;
  if (!cfg) return [];
  const rows = [];
  const source = (s) =>
    (s.mapIds || [s.map]).filter(Number.isInteger).map((map2) => {
      const d = [...g.monsters.values()].find((d2) => originalMonster(d2) === s.monsterOriginalId);
      return {
        map: map2,
        monster: d?.Name || "GuideNative" + s.monsterOriginalId,
        monsterId: d?.Index || 0,
      };
    });
  if (cfg.sevenPearls && r.level >= cfg.sevenPearls.level) {
    const p = cfg.sevenPearls;
    rows.push({
      id: "pearls",
      title: message("late.pearlsTitle"),
      description: message(
        r.lateQuests?.pearls?.active ? "late.pearlsCollect" : "late.pearlsAccept",
      ),
      npcId: p.npcId,
      stage: 1,
      cycles: r.lateQuests?.pearls?.exchanges || 0,
      active: !!r.lateQuests?.pearls?.active,
      items: p.materials.map((s) => ({
        item: s.item,
        need: 1,
        have: g.count(r, s.item),
        sources: source(s),
      })),
    });
  }
  if (cfg.fireAltar && r.level >= cfg.fireAltar.level) {
    const a = cfg.fireAltar,
      stage = r.lateQuests?.altar?.stage || 0;
    rows.push({
      id: "altar",
      title: message("late.altarTitle"),
      description: message("late.altarStage" + stage),
      npcId: a.npcId,
      stage,
      cycles: 0,
      active: stage > 0,
      items: (stage === 2 ? [a.talisman] : stage === 3 ? [] : a.spiritItems).map((item) => ({
        item,
        need: 1,
        have: g.count(r, item),
        sources: a.sourceDrops
          .filter((s) => s.item === item)
          .flatMap((s) => {
            if (s.mapIds || s.map) return source(s);
            return g.rules.world.maps
              .filter((m) =>
                m.spawns.some(
                  (p) =>
                    p.monster ===
                    [...g.monsters.values()].find((d) => originalMonster(d) === s.monsterOriginalId)
                      ?.Name,
                ),
              )
              .map((m) => {
                const d = [...g.monsters.values()].find(
                  (d2) => originalMonster(d2) === s.monsterOriginalId,
                );
                return { map: m.id, monster: d?.Name || "", monsterId: d?.Index || 0 };
              });
          }),
      })),
    });
  }
  if (cfg.bloodCycle && r.level >= cfg.bloodCycle.level) {
    const b = cfg.bloodCycle,
      stage = r.lateQuests?.blood?.stage || 0,
      s = b.stages[stage === 2 ? 1 : 0];
    rows.push({
      id: "blood",
      title: message("late.bloodTitle"),
      description: message("late.bloodStage" + stage),
      npcId: b.npcId,
      stage,
      cycles: r.lateQuests?.blood?.cycles || 0,
      active: true,
      items: [{ item: s.item, need: 1, have: g.count(r, s.item), sources: source(s) }],
    });
  }
  return rows;
}
function lateNpcPage(g, r, n) {
  const cfg = g.rules.adaptations.lateContent;
  if (!cfg) return [];
  const page = [];
  for (const entry of [cfg.sevenPearls, cfg.fireAltar, cfg.bloodCycle])
    if (entry?.npcId === n.id && r.level < entry.level)
      page.push(message("late.requiredLevel", { level: entry.level }));
  const action = (key, act) => ({ $dialogue: [{ label: message("late." + key), action: act }] });
  for (const row of lateQuestRows(g, r).filter((row2) => row2.npcId === n.id)) {
    page.push(row.title, row.description, message("late.cycles", { count: row.cycles }));
    for (const item of row.items) {
      page.push(
        message("late.itemCount", {
          item: entityText("items", item.item),
          have: Math.min(item.need, item.have),
          need: item.need,
        }),
      );
      for (const s of item.sources)
        page.push(
          message("late.source", {
            map: entityText("maps", s.map),
            monster: entityText("monsters", s.monsterId),
          }),
        );
    }
    if (row.id === "pearls")
      page.push(action("pearlsStart", "@late-pearls"), action("exchange", "@late-pearls-exchange"));
    if (row.id === "altar")
      page.push(
        action(
          row.stage === 3 ? "altarEnter" : row.stage === 0 ? "altarStart" : "submit",
          row.stage === 3
            ? "@late-altar-enter"
            : row.stage === 0
              ? "@late-altar"
              : "@late-altar-submit",
        ),
      );
    if (row.id === "blood")
      page.push(
        action("bloodStatus", "@late-blood"),
        ...(row.stage === 1 || row.stage === 2 ? [action("submit", "@late-blood-submit")] : []),
      );
  }
  if (n.id === cfg.secretTicket?.npcId) {
    for (const dest of cfg.secretTicket.shortcuts)
      if (r.completedQuests.includes(dest.requiresQuest))
        page.push({
          $dialogue: [
            {
              label: message("late.shortcut", { map: entityText("maps", dest.map) }),
              action: "@late-secret-" + dest.map,
            },
          ],
        });
  }
  if (n.id === cfg.scarletSword?.npcId) page.push(action("scarletSelect", "@late-scarlet-sword"));
  return page;
}

// games/darkforged/singleplayer/core/summon-items.ts
function useSummonItem(g, r, item) {
  const cfg = g.rules.adaptations.lateContent?.bagua;
  if (!cfg || item.id !== cfg.item) return false;
  if (
    r.dead ||
    item.count <= 0 ||
    r.map !== cfg.map ||
    Math.abs(r.x - cfg.x) > cfg.range ||
    Math.abs(r.y - cfg.y) > cfg.range
  )
    throw new LocalizedError(message("late.baguaLocation"));
  const map2 = g.map(r.map);
  if (
    map2.actors.filter(
      (a) => a.kind === "monster" && !a.dead && a.special?.lateSummonBagua === true,
    ).length >= cfg.maxAlive
  )
    throw new LocalizedError(message("late.baguaAlive"));
  const def = [...g.monsters.values()].find((d) => d.Name === cfg.monster),
    spot = g.freeNear(r.map, { x: r.x, y: r.y }, 3);
  if (!def || !spot) throw new LocalizedError(message("late.landing"));
  const boss = g.newMonster(def, r.map, spot);
  boss.special = { ...boss.special, lateSummonBagua: true, summonedBy: r.id };
  map2.actors.push(boss);
  if (--item.count === 0) r.inventory[r.inventory.findIndex((i) => i?.uid === item.uid)] = null;
  g.say(message("late.baguaSummoned"));
  return true;
}

// games/darkforged/singleplayer/core/boss-rewards.ts
function bossRewardProfile(rules, a) {
  const profile = rules.adaptations.bossRewards?.entries[String(a.definition)];
  if (
    !rules.adaptations.dreamRuntime ||
    !profile?.maps.includes(a.map) ||
    a.kind !== "monster" ||
    a.friendly ||
    a.master !== void 0 ||
    a.special?.bossMinion ||
    a.special?.trialFloor !== void 0 ||
    a.special?.trialBoss ||
    a.special?.challenge !== void 0
  )
    return;
  return profile;
}
function monsterDropTable(rules, d, a) {
  const profile = rules.adaptations.bossRewards?.entries[String(d.Index)];
  if (profile?.maps.includes(a.map) && !bossRewardProfile(rules, a)) return d.Drops;
  return d.MapDrops?.[String(a.map)] ?? d.Drops;
}
function ensureBossEquipment(g, a, d, owner, items) {
  const profile = bossRewardProfile(g.rules, a);
  if (
    !profile ||
    items.some((i) => {
      const type = g.defs.get(i.id)?.Type;
      return type && (equipmentTypes.has(type) || type === "Talisman" || type === "Amulet");
    })
  )
    return;
  const pool = profile.fallback.filter((row) => row.weight > 0 && g.defs.has(row.item));
  if (!pool.length) return;
  let roll = g.rng.next(pool.reduce((sum, row) => sum + row.weight, 0));
  for (const row of pool) {
    if (roll < row.weight) {
      items.push(g.newItem(row.item, 1, true, d, owner, Number(a.special?.magicAdd || 0)));
      return;
    }
    roll -= row.weight;
  }
}

// Every companion level costs 100 XP. Preserve earned levels when loading old saves.
function spiritNextXP(cfg, level) {
  return level >= cfg.cap ? 0 : 100;
}
function migrateSpiritProgress(r, cfg) {
  const p = r.spiritProgress;
  if (!p || p.curveVersion === 4) return;
  let level = p.level, xp = p.xp;
  while (level < cfg.cap && xp >= 100) { xp -= 100; level++; }
  r.spiritProgress = { level, xp: level >= cfg.cap ? 0 : xp, curveVersion: 4 };
}

// games/darkforged/singleplayer/core/monster-display.ts
function monsterDisplayName(actor, rules) {
  const sacred = actor.special?.nativeBeastArmourRank
    ? rules.monsters.find((m) => m.DreamOriginalId === 82)
    : void 0;
  let base = entityText("monsters", sacred?.Index ?? actor.definition);
  affix: for (const group of Object.values(
    rules.adaptations.dreamRuntime?.monsterAffixModel?.groups || {},
  )) {
    for (const [tier, affix] of Object.entries(group.Affixes))
      if (actor.name.startsWith(affix.Name + " \xB7 ")) {
        base = message("monster.affixedName", {
          affix: entityText("monsterAffixes", group.ID + "." + tier),
          name: base,
        });
        break affix;
      }
  }
  if (
    actor.definition === rules.adaptations.noviceProgression?.spiritMonster ||
    (actor.friendly && actor.master !== void 0 && typeof actor.special?.petLevel === "number")
  )
    return message("skill.spirit.name", {
      name: base,
      level: Number(actor.special?.petLevel || 0),
    });
  return base;
}

// games/darkforged/localization/bindings/dialogue.json

var dialogue_default = {
  "3/@main/1": {
    "sourceHash": "09f968048935849d733005e21edf78c82101364bb4b81af6c93debfcd8fe8174",
    "parts": [
      {
        "label": {
          "$text": "dialogue.a0c1410b6e06",
          "params": {}
        },
        "action": "@claimblessing"
      }
    ]
  },
  "3/@main/2": {
    "sourceHash": "b2ecbb9f2e7b78a0c42d8cd60ec3283ef63c9802d64a7075cf0166f5df9370a7",
    "parts": [
      {
        "label": {
          "$text": "dialogue.15e1746d778b",
          "params": {}
        }
      }
    ]
  },
  "3/@main/3": {
    "sourceHash": "6bdd6210292f9f4adb38d3d889c21bbd639c91cd7340207127346d03607dff15",
    "parts": [
      {
        "label": {
          "$text": "dialogue.6bdd6210292f",
          "params": {}
        }
      }
    ]
  },
  "3/@main/4": {
    "sourceHash": "b0b3ab71f1cf29ea3e3aa0f986d8fe55b6a1e39bbd236ce247980643d971b4d3",
    "parts": [
      {
        "label": {
          "$text": "dialogue.ce0531a50885",
          "params": {}
        },
        "action": "@settlevillage"
      }
    ]
  },
  "3/@main/5": {
    "sourceHash": "4fc38e1fef5651a62abe99bd78dd37d20b47c5f3c090bd04027d6d9b7b53ada4",
    "parts": [
      {
        "label": {
          "$text": "dialogue.3fd47edce45b",
          "params": {}
        },
        "action": "@Exit"
      }
    ]
  },
  "3/quests/0": {
    "sourceHash": "43974ed74066b207c30ffd0fed5146762e6c60745ac977004bc14507c7c42b50",
    "parts": [
      {
        "label": "201"
      }
    ]
  },
  "3/quests/1": {
    "sourceHash": "a9053667ce85eb4ab01456c7510f43d4967c745e33f9c9daa69389eb8c1bf8b1",
    "parts": [
      {
        "label": "-201"
      }
    ]
  },
  "3/quests/2": {
    "sourceHash": "c17edaae86e4016a583e098582f6dbf3eccade8ef83747df9ba617ded9d31309",
    "parts": [
      {
        "label": "202"
      }
    ]
  },
  "3/@claimblessing/1": {
    "sourceHash": "d12a476cf78c4d3ecd7db3403a9d6c6e3b6e753f141e9b8fb0c05b47a19d639b",
    "parts": [
      {
        "label": {
          "$text": "dialogue.d12a476cf78c",
          "params": {}
        }
      }
    ]
  },
  "3/@cityintro/1": {
    "sourceHash": "e8e18ad7da59897b956d32962845bc2a1ea6c18e5d3866980f52148f9f8528c1",
    "parts": [
      {
        "label": {
          "$text": "dialogue.e8e18ad7da59",
          "params": {}
        }
      }
    ]
  },
  "3/@cityintro/2": {
    "sourceHash": "0c35b08af5cbefbb63e81f133dc6169e8fb0e5f53c21c6378b42894dd67218a4",
    "parts": [
      {
        "label": {
          "$text": "dialogue.0c35b08af5cb",
          "params": {}
        }
      }
    ]
  },
  "3/@cityintro/3": {
    "sourceHash": "36756f4cf4cf4702487fdce5b3a1daa090b8a7c15c969f1362843085f3407fe7",
    "parts": [
      {
        "label": {
          "$text": "dialogue.3b74b2af3326",
          "params": {}
        },
        "action": "@TravelBichonLord"
      }
    ]
  },
  "3/@cityintro/4": {
    "sourceHash": "26cd8481dd432f7d8ad13299eb69d5f946cabe3f6b670b0d3c0404f7c6741ffb",
    "parts": [
      {
        "label": {
          "$text": "dialogue.572cf45ba436",
          "params": {}
        },
        "action": "@Main"
      }
    ]
  },
  "3/@travelbichonlord/0": {
    "sourceHash": "0870d04c58d3d2aa8f6f20aeccdd9d64aae59796afd58f5acec0b4440247ac9c",
    "parts": [
      {
        "label": "MOVE map021 341 191"
      }
    ]
  },
  "7/@main/1": {
    "sourceHash": "3b96da93a2003333ff0ae3a1d52ef5d0336c3820b773ec21721c57ba1d55b24e",
    "parts": [
      {
        "label": {
          "$text": "dialogue.3b96da93a200",
          "params": {}
        }
      }
    ]
  },
  "7/@main/2": {
    "sourceHash": "92101a688b6f6553bd4a72b93473848133c66ec285079fe626e3e6c975b9555f",
    "parts": [
      {
        "label": {
          "$text": "dialogue.60bad305fba2",
          "params": {}
        },
        "action": "@Sell"
      }
    ]
  },
  "7/@main/3": {
    "sourceHash": "d8a143f05fa292b01455a8f37ed78ed252ed78428ac68879eade5bd4714cc454",
    "parts": [
      {
        "label": {
          "$text": "dialogue.ae8ad2c31530",
          "params": {}
        },
        "action": "@BuyBack"
      }
    ]
  },
  "7/@main/4": {
    "sourceHash": "4fc38e1fef5651a62abe99bd78dd37d20b47c5f3c090bd04027d6d9b7b53ada4",
    "parts": [
      {
        "label": {
          "$text": "dialogue.3fd47edce45b",
          "params": {}
        },
        "action": "@Exit"
      }
    ]
  },
  "7/@sell/1": {
    "sourceHash": "4b65118372cc598a89f9dd0fd04031bb6b8920044d7d3869640a0929c81b1917",
    "parts": [
      {
        "label": {
          "$text": "dialogue.4b65118372cc",
          "params": {}
        }
      }
    ]
  },
  "7/@sell/2": {
    "sourceHash": "88ead46d5169bbaab6bbefdb6253d63a22cdd32a2166f5b25c4b0bb0b58eed28",
    "parts": [
      {
        "label": {
          "$text": "dialogue.ae8ad2c31530",
          "params": {}
        },
        "action": "@BuyBack"
      },
      {
        "label": " "
      },
      {
        "label": {
          "$text": "dialogue.572cf45ba436",
          "params": {}
        },
        "action": "@Main"
      }
    ]
  },
  "7/types/0": {
    "sourceHash": "e629fa6598d732768f7c726b4b621285f9c3b85303900aa912017db7617d8bdb",
    "parts": [
      {
        "label": "15"
      }
    ]
  },
  "7/quests/0": {
    "sourceHash": "aa525c063b3cb3824877d70f266d539a8ae0d7fec9a3ba1d32d7649e387ae514",
    "parts": [
      {
        "label": "-202"
      }
    ]
  },
  "7/quests/1": {
    "sourceHash": "4621c1d55fa4e86ce0dae4288302641baac86dd53f76227c892df9d300682d41",
    "parts": [
      {
        "label": "203"
      }
    ]
  },
  "7/quests/2": {
    "sourceHash": "fcafb6fe013581d605a7675bc43e27443b5710929082bd36f33d7d53417cdde0",
    "parts": [
      {
        "label": "-203"
      }
    ]
  },
  "7/@buyback/1": {
    "sourceHash": "faa0a1069e720ffbfc76efbc524ae34c15a6fb068e22ab59dc2cddb9a0355d3e",
    "parts": [
      {
        "label": {
          "$text": "dialogue.faa0a1069e72",
          "params": {}
        }
      }
    ]
  },
  "7/@buyback/2": {
    "sourceHash": "26cd8481dd432f7d8ad13299eb69d5f946cabe3f6b670b0d3c0404f7c6741ffb",
    "parts": [
      {
        "label": {
          "$text": "dialogue.572cf45ba436",
          "params": {}
        },
        "action": "@Main"
      }
    ]
  },
  "5/@main/1": {
    "sourceHash": "b2ecbb9f2e7b78a0c42d8cd60ec3283ef63c9802d64a7075cf0166f5df9370a7",
    "parts": [
      {
        "label": {
          "$text": "dialogue.15e1746d778b",
          "params": {}
        }
      }
    ]
  },
  "5/@main/2": {
    "sourceHash": "78c885c6ae2c9334121471b47874e888a2150a7af371074adc90ed18c669677d",
    "parts": [
      {
        "label": {
          "$text": "dialogue.a706c11abf60",
          "params": {}
        },
        "action": "@BuySellNew"
      }
    ]
  },
  "5/@main/3": {
    "sourceHash": "e5da075c03fc73c69e2b9eef6f6121eefed9b8419b54dd853d174c41f01c5caf",
    "parts": [
      {
        "label": {
          "$text": "dialogue.afc94bd34d17",
          "params": {}
        },
        "action": "@Repair"
      }
    ]
  },
  "5/@main/4": {
    "sourceHash": "92101a688b6f6553bd4a72b93473848133c66ec285079fe626e3e6c975b9555f",
    "parts": [
      {
        "label": {
          "$text": "dialogue.60bad305fba2",
          "params": {}
        },
        "action": "@Sell"
      }
    ]
  },
  "5/@main/5": {
    "sourceHash": "d8a143f05fa292b01455a8f37ed78ed252ed78428ac68879eade5bd4714cc454",
    "parts": [
      {
        "label": {
          "$text": "dialogue.ae8ad2c31530",
          "params": {}
        },
        "action": "@BuyBack"
      }
    ]
  },
  "5/@main/6": {
    "sourceHash": "4fc38e1fef5651a62abe99bd78dd37d20b47c5f3c090bd04027d6d9b7b53ada4",
    "parts": [
      {
        "label": {
          "$text": "dialogue.3fd47edce45b",
          "params": {}
        },
        "action": "@Exit"
      }
    ]
  },
  "5/@buysellnew/1": {
    "sourceHash": "8ef05470f14b2f13671cf729228282e0b4621a7eb9000cc9d7439111d77c9646",
    "parts": [
      {
        "label": {
          "$text": "dialogue.8ef05470f14b",
          "params": {}
        }
      }
    ]
  },
  "5/@buysellnew/2": {
    "sourceHash": "57ca8b28e8d2e5ff3fac2646046b06a28fdb62ef8709bc5ebcb668f436f7aafd",
    "parts": [
      {
        "label": {
          "$text": "dialogue.75502e005678",
          "params": {}
        },
        "action": "@BuyBack"
      },
      {
        "label": " "
      },
      {
        "label": {
          "$text": "dialogue.572cf45ba436",
          "params": {}
        },
        "action": "@Main"
      }
    ]
  },
  "5/@buyback/1": {
    "sourceHash": "963dadb76e3052a76aa82f5a42ccbf521df67b851b616786da02818217ee5779",
    "parts": [
      {
        "label": {
          "$text": "dialogue.963dadb76e30",
          "params": {}
        }
      }
    ]
  },
  "5/@buyback/2": {
    "sourceHash": "26cd8481dd432f7d8ad13299eb69d5f946cabe3f6b670b0d3c0404f7c6741ffb",
    "parts": [
      {
        "label": {
          "$text": "dialogue.572cf45ba436",
          "params": {}
        },
        "action": "@Main"
      }
    ]
  },
  "5/@repair/1": {
    "sourceHash": "64f39db7f455c85102fbfdeb98681be17305d2b553a3339088280e7f15390b34",
    "parts": [
      {
        "label": {
          "$text": "dialogue.64f39db7f455",
          "params": {}
        }
      }
    ]
  },
  "5/@repair/2": {
    "sourceHash": "26cd8481dd432f7d8ad13299eb69d5f946cabe3f6b670b0d3c0404f7c6741ffb",
    "parts": [
      {
        "label": {
          "$text": "dialogue.572cf45ba436",
          "params": {}
        },
        "action": "@Main"
      }
    ]
  },
  "5/types/0": {
    "sourceHash": "6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b",
    "parts": [
      {
        "label": "1"
      }
    ]
  },
  "5/types/1": {
    "sourceHash": "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
    "parts": [
      {
        "label": "14"
      }
    ]
  },
  "5/trade/0": {
    "sourceHash": "9bcdec263f0f50bbcc6655dfa2dd3420a9c1fb3110225e88e70ed070f5d69664",
    "parts": [
      {
        "label": "WoodenSword"
      }
    ]
  },
  "5/trade/1": {
    "sourceHash": "5679daa7c55dde153a0e3f2e5d7c5318f149fa10716a7d874fa97e46639426a3",
    "parts": [
      {
        "label": "Dagger"
      }
    ]
  },
  "5/trade/2": {
    "sourceHash": "9765090b94410bf6b7f6fc236f4152873eed0a5f623ec0d2b158a939ad8517d8",
    "parts": [
      {
        "label": "EbonySword"
      }
    ]
  },
  "5/trade/3": {
    "sourceHash": "3898f55c28f627711a584cbfe83d1c7e20c0e50924fdc617b198b8c808d6ff66",
    "parts": [
      {
        "label": "BronzeSword"
      }
    ]
  },
  "5/trade/4": {
    "sourceHash": "6e491069f1e8e3ea3dfaf347de37808a19869dd74708e700316016c9c4e29286",
    "parts": [
      {
        "label": "IronSword"
      }
    ]
  },
  "5/trade/5": {
    "sourceHash": "70d0953078eb50f71edb71ba5c03ced22387a2067372abf5174b29020b937312",
    "parts": [
      {
        "label": "PickAxe"
      }
    ]
  },
  "5/quests/0": {
    "sourceHash": "fc56dbc6d4652b315b86b71c8d688c1ccdea9c5f1fd07763d2659fde2e2fc49a",
    "parts": [
      {
        "label": "204"
      }
    ]
  },
  "5/quests/1": {
    "sourceHash": "0e21761903647050a9b9b1252065bb75a1e5177b7e434319e0f28cf3fa05d4e4",
    "parts": [
      {
        "label": "-204"
      }
    ]
  },
  "5/quests/2": {
    "sourceHash": "f8809aff4d69bece79dabe35be0c708b890d7eafb841f121330667b77d2e2590",
    "parts": [
      {
        "label": "205"
      }
    ]
  },
  "5/quests/3": {
    "sourceHash": "5cf4e26bd3d87da5e03f80a43a64f1220a1f4ba9e1d6348caea83c06353c3f39",
    "parts": [
      {
        "label": "206"
      }
    ]
  },
  "5/quests/4": {
    "sourceHash": "a942b0f2a638f49778cdace2b2903926c1dc506d57ba38d1c551281adfc6ad54",
    "parts": [
      {
        "label": "-238"
      }
    ]
  },
  "5/@sell/1": {
    "sourceHash": "4b65118372cc598a89f9dd0fd04031bb6b8920044d7d3869640a0929c81b1917",
    "parts": [
      {
        "label": {
          "$text": "dialogue.4b65118372cc",
          "params": {}
        }
      }
    ]
  },
  "5/@sell/2": {
    "sourceHash": "88ead46d5169bbaab6bbefdb6253d63a22cdd32a2166f5b25c4b0bb0b58eed28",
    "parts": [
      {
        "label": {
          "$text": "dialogue.ae8ad2c31530",
          "params": {}
        },
        "action": "@BuyBack"
      },
      {
        "label": " "
      },
      {
        "label": {
          "$text": "dialogue.572cf45ba436",
          "params": {}
        },
        "action": "@Main"
      }
    ]
  },
  "28/@main/1": {
    "sourceHash": "b2ecbb9f2e7b78a0c42d8cd60ec3283ef63c9802d64a7075cf0166f5df9370a7",
    "parts": [
      {
        "label": {
          "$text": "dialogue.15e1746d778b",
          "params": {}
        }
      }
    ]
  },
  "28/@main/2": {
    "sourceHash": "78c885c6ae2c9334121471b47874e888a2150a7af371074adc90ed18c669677d",
    "parts": [
      {
        "label": {
          "$text": "dialogue.a706c11abf60",
          "params": {}
        },
        "action": "@BuySellNew"
      }
    ]
  },
  "28/@main/3": {
    "sourceHash": "92101a688b6f6553bd4a72b93473848133c66ec285079fe626e3e6c975b9555f",
    "parts": [
      {
        "label": {
          "$text": "dialogue.60bad305fba2",
          "params": {}
        },
        "action": "@Sell"
      }
    ]
  },
  "28/@main/4": {
    "sourceHash": "d8a143f05fa292b01455a8f37ed78ed252ed78428ac68879eade5bd4714cc454",
    "parts": [
      {
        "label": {
          "$text": "dialogue.ae8ad2c31530",
          "params": {}
        },
        "action": "@BuyBack"
      }
    ]
  },
  "28/@main/5": {
    "sourceHash": "4fc38e1fef5651a62abe99bd78dd37d20b47c5f3c090bd04027d6d9b7b53ada4",
    "parts": [
      {
        "label": {
          "$text": "dialogue.3fd47edce45b",
          "params": {}
        },
        "action": "@Exit"
      }
    ]
  },
  "28/@buysellnew/1": {
    "sourceHash": "0bd195d36df65ec70479aa0ae0c66dc9ce9efa6030541d33e371607ea7db4470",
    "parts": [
      {
        "label": {
          "$text": "dialogue.0bd195d36df6",
          "params": {}
        }
      }
    ]
  },
  "28/@buysellnew/2": {
    "sourceHash": "57ca8b28e8d2e5ff3fac2646046b06a28fdb62ef8709bc5ebcb668f436f7aafd",
    "parts": [
      {
        "label": {
          "$text": "dialogue.75502e005678",
          "params": {}
        },
        "action": "@BuyBack"
      },
      {
        "label": " "
      },
      {
        "label": {
          "$text": "dialogue.572cf45ba436",
          "params": {}
        },
        "action": "@Main"
      }
    ]
  },
  "28/@buyback/1": {
    "sourceHash": "963dadb76e3052a76aa82f5a42ccbf521df67b851b616786da02818217ee5779",
    "parts": [
      {
        "label": {
          "$text": "dialogue.963dadb76e30",
          "params": {}
        }
      }
    ]
  },
  "28/@buyback/2": {
    "sourceHash": "26cd8481dd432f7d8ad13299eb69d5f946cabe3f6b670b0d3c0404f7c6741ffb",
    "parts": [
      {
        "label": {
          "$text": "dialogue.572cf45ba436",
          "params": {}
        },
        "action": "@Main"
      }
    ]
  },
  "28/types/0": {
    "sourceHash": "3fdba35f04dc8c462986c992bcf875546257113072a909c162f7e470e581e278",
    "parts": [
      {
        "label": "13"
      }
    ]
  },
  "28/trade/0": {
    "sourceHash": "1ef9cf0745ce3b11923834b1743c18ee472eb0b0d1bf9f76800ed706ad5e9530",
    "parts": [
      {
        "label": "(HP)DrugSmall"
      }
    ]
  },
  "28/trade/1": {
    "sourceHash": "1b9cf06dc44c4c2a525c797bc37b8baccb522eda50f0d3ecdb8ec8059943ba02",
    "parts": [
      {
        "label": "(MP)DrugSmall"
      }
    ]
  },
  "28/trade/2": {
    "sourceHash": "c2db97c341802c5d28065ee9ef6055a43ab00ec88bf6e6d282910d0cae6e4485",
    "parts": [
      {
        "label": "(HP)DrugMedium"
      }
    ]
  },
  "28/trade/3": {
    "sourceHash": "e06efa76f80d501e24798090651ad8490a2bc58a634e5ab3dbe97cee388da95a",
    "parts": [
      {
        "label": "(MP)DrugMedium"
      }
    ]
  },
  "28/@sell/1": {
    "sourceHash": "4b65118372cc598a89f9dd0fd04031bb6b8920044d7d3869640a0929c81b1917",
    "parts": [
      {
        "label": {
          "$text": "dialogue.4b65118372cc",
          "params": {}
        }
      }
    ]
  },
  "28/@sell/2": {
    "sourceHash": "88ead46d5169bbaab6bbefdb6253d63a22cdd32a2166f5b25c4b0bb0b58eed28",
    "parts": [
      {
        "label": {
          "$text": "dialogue.ae8ad2c31530",
          "params": {}
        },
        "action": "@BuyBack"
      },
      {
        "label": " "
      },
      {
        "label": {
          "$text": "dialogue.572cf45ba436",
          "params": {}
        },
        "action": "@Main"
      }
    ]
  },
  "31/@main/1": {
    "sourceHash": "b2ecbb9f2e7b78a0c42d8cd60ec3283ef63c9802d64a7075cf0166f5df9370a7",
    "parts": [
      {
        "label": {
          "$text": "dialogue.15e1746d778b",
          "params": {}
        }
      }
    ]
  },
  "31/@main/2": {
    "sourceHash": "081f65a72486886420f7831ab2f33ce0777ae3c84399c01de8f545a660397bdf",
    "parts": [
      {
        "label": {
          "$text": "dialogue.d355cf8ce6f4",
          "params": {}
        },
        "action": "@Storage"
      }
    ]
  },
  "31/@main/3": {
    "sourceHash": "4fc38e1fef5651a62abe99bd78dd37d20b47c5f3c090bd04027d6d9b7b53ada4",
    "parts": [
      {
        "label": {
          "$text": "dialogue.3fd47edce45b",
          "params": {}
        },
        "action": "@Exit"
      }
    ]
  },
  "31/@storage/1": {
    "sourceHash": "29d42de3b54db524c12fe27e8bc78bbf5105d4767f4358a26f443f46d5964b20",
    "parts": [
      {
        "label": {
          "$text": "dialogue.29d42de3b54d",
          "params": {}
        }
      }
    ]
  },
  "31/@storage/2": {
    "sourceHash": "26cd8481dd432f7d8ad13299eb69d5f946cabe3f6b670b0d3c0404f7c6741ffb",
    "parts": [
      {
        "label": {
          "$text": "dialogue.572cf45ba436",
          "params": {}
        },
        "action": "@Main"
      }
    ]
  },
  "9001/@main/1": {
    "sourceHash": "dbc41e896ee84be53a447be4bc19dc50ad050b2b62d40a81c81069391bc46d86",
    "parts": [
      {
        "label": {
          "$text": "dialogue.dbc41e896ee8",
          "params": {}
        }
      }
    ]
  },
  "9001/@main/2": {
    "sourceHash": "17500c9830267595c668a9c8b0d82b4b97910123743b311b6dfa2870c50679e5",
    "parts": [
      {
        "label": {
          "$text": "dialogue.311194be9347",
          "params": {}
        },
        "action": "@TravelBichonLord"
      }
    ]
  },
  "9001/@main/3": {
    "sourceHash": "acf6f6b746bb7f43792c145beaaea986db6a93c0690edf7f00ba5588ef4f9082",
    "parts": [
      {
        "label": {
          "$text": "dialogue.b3f5ef55cd4d",
          "params": {}
        },
        "action": "@TravelTombEntrance"
      }
    ]
  },
  "9001/@main/4": {
    "sourceHash": "dba80639b9289d69d127350b82c28110d93e700483d43ec563404647bdcd44f9",
    "parts": [
      {
        "label": {
          "$text": "dialogue.8c898ebbcc3b",
          "params": {}
        },
        "action": "@TravelMineEntrance"
      }
    ]
  },
  "9001/@main/5": {
    "sourceHash": "b0b3ab71f1cf29ea3e3aa0f986d8fe55b6a1e39bbd236ce247980643d971b4d3",
    "parts": [
      {
        "label": {
          "$text": "dialogue.ce0531a50885",
          "params": {}
        },
        "action": "@settlevillage"
      }
    ]
  },
  "9001/@main/6": {
    "sourceHash": "4fc38e1fef5651a62abe99bd78dd37d20b47c5f3c090bd04027d6d9b7b53ada4",
    "parts": [
      {
        "label": {
          "$text": "dialogue.3fd47edce45b",
          "params": {}
        },
        "action": "@Exit"
      }
    ]
  },
  "9001/@traveltombentrance/0": {
    "sourceHash": "ea35f51fbdb11b58fbbaad93e9d3ca447ba8558dd2e0b49f9bf5d4112428af53",
    "parts": [
      {
        "label": "MOVE map021 145 43"
      }
    ]
  },
  "9001/@travelmineentrance/0": {
    "sourceHash": "0faba9df4b397bac58eee96241d6324fad0be6bdab278bf923aa79a37e6bf745",
    "parts": [
      {
        "label": "MOVE map021 662 221"
      }
    ]
  },
  "9001/@travelbichonlord/0": {
    "sourceHash": "0870d04c58d3d2aa8f6f20aeccdd9d64aae59796afd58f5acec0b4440247ac9c",
    "parts": [
      {
        "label": "MOVE map021 341 191"
      }
    ]
  },
  "9001/@cityintro/1": {
    "sourceHash": "e8e18ad7da59897b956d32962845bc2a1ea6c18e5d3866980f52148f9f8528c1",
    "parts": [
      {
        "label": {
          "$text": "dialogue.e8e18ad7da59",
          "params": {}
        }
      }
    ]
  },
  "9001/@cityintro/2": {
    "sourceHash": "0c35b08af5cbefbb63e81f133dc6169e8fb0e5f53c21c6378b42894dd67218a4",
    "parts": [
      {
        "label": {
          "$text": "dialogue.0c35b08af5cb",
          "params": {}
        }
      }
    ]
  },
  "9001/@cityintro/3": {
    "sourceHash": "36756f4cf4cf4702487fdce5b3a1daa090b8a7c15c969f1362843085f3407fe7",
    "parts": [
      {
        "label": {
          "$text": "dialogue.3b74b2af3326",
          "params": {}
        },
        "action": "@TravelBichonLord"
      }
    ]
  },
  "9001/@cityintro/4": {
    "sourceHash": "26cd8481dd432f7d8ad13299eb69d5f946cabe3f6b670b0d3c0404f7c6741ffb",
    "parts": [
      {
        "label": {
          "$text": "dialogue.572cf45ba436",
          "params": {}
        },
        "action": "@Main"
      }
    ]
  },
  "9002/@main/1": {
    "sourceHash": "aa7e7aee1eac0d8ffc1d74f7f8efe30845e392abdae061a601beb6dd34aae7b3",
    "parts": [
      {
        "label": {
          "$text": "dialogue.aa7e7aee1eac",
          "params": {}
        }
      }
    ]
  },
  "9002/@main/2": {
    "sourceHash": "acdc21086999c5806f1793ebb46f89c63fe3a35bbc07dc56e519373005e3e03c",
    "parts": [
      {
        "label": {
          "$text": "dialogue.9e274f611287",
          "params": {}
        },
        "action": "@BuyNew"
      }
    ]
  },
  "9002/@main/3": {
    "sourceHash": "92101a688b6f6553bd4a72b93473848133c66ec285079fe626e3e6c975b9555f",
    "parts": [
      {
        "label": {
          "$text": "dialogue.60bad305fba2",
          "params": {}
        },
        "action": "@Sell"
      }
    ]
  },
  "9002/@main/4": {
    "sourceHash": "d8a143f05fa292b01455a8f37ed78ed252ed78428ac68879eade5bd4714cc454",
    "parts": [
      {
        "label": {
          "$text": "dialogue.ae8ad2c31530",
          "params": {}
        },
        "action": "@BuyBack"
      }
    ]
  },
  "9002/@main/5": {
    "sourceHash": "4fc38e1fef5651a62abe99bd78dd37d20b47c5f3c090bd04027d6d9b7b53ada4",
    "parts": [
      {
        "label": {
          "$text": "dialogue.3fd47edce45b",
          "params": {}
        },
        "action": "@Exit"
      }
    ]
  },
  "9002/@buynew/1": {
    "sourceHash": "706669fc8bf957a9b481b338903fe39b983925d19914224be498d53fe6b3173b",
    "parts": [
      {
        "label": {
          "$text": "dialogue.706669fc8bf9",
          "params": {}
        }
      }
    ]
  },
  "9002/@buynew/2": {
    "sourceHash": "26cd8481dd432f7d8ad13299eb69d5f946cabe3f6b670b0d3c0404f7c6741ffb",
    "parts": [
      {
        "label": {
          "$text": "dialogue.572cf45ba436",
          "params": {}
        },
        "action": "@Main"
      }
    ]
  },
  "9002/trade/0": {
    "sourceHash": "191211a674c02cabb9bfda71dc017c4f2a6e09e4d18ea239752d7e405ce86929",
    "parts": [
      {
        "label": "TownTeleport"
      }
    ]
  },
  "9002/trade/1": {
    "sourceHash": "ba2e51d6a86fb4fccffe58f2db5aaa03cb5196a7d133de3d6f1f449275a9d39d",
    "parts": [
      {
        "label": "RandomTeleport"
      }
    ]
  },
  "9002/@sell/1": {
    "sourceHash": "4b65118372cc598a89f9dd0fd04031bb6b8920044d7d3869640a0929c81b1917",
    "parts": [
      {
        "label": {
          "$text": "dialogue.4b65118372cc",
          "params": {}
        }
      }
    ]
  },
  "9002/@sell/2": {
    "sourceHash": "88ead46d5169bbaab6bbefdb6253d63a22cdd32a2166f5b25c4b0bb0b58eed28",
    "parts": [
      {
        "label": {
          "$text": "dialogue.ae8ad2c31530",
          "params": {}
        },
        "action": "@BuyBack"
      },
      {
        "label": " "
      },
      {
        "label": {
          "$text": "dialogue.572cf45ba436",
          "params": {}
        },
        "action": "@Main"
      }
    ]
  },
  "9002/@buyback/1": {
    "sourceHash": "faa0a1069e720ffbfc76efbc524ae34c15a6fb068e22ab59dc2cddb9a0355d3e",
    "parts": [
      {
        "label": {
          "$text": "dialogue.faa0a1069e72",
          "params": {}
        }
      }
    ]
  },
  "9002/@buyback/2": {
    "sourceHash": "26cd8481dd432f7d8ad13299eb69d5f946cabe3f6b670b0d3c0404f7c6741ffb",
    "parts": [
      {
        "label": {
          "$text": "dialogue.572cf45ba436",
          "params": {}
        },
        "action": "@Main"
      }
    ]
  },
  "9003/@main/1": {
    "sourceHash": "c82d79e16d462e10f301223a2be89d9b7068fc57403ba5d4d55c96771322a247",
    "parts": [
      {
        "label": {
          "$text": "dialogue.c82d79e16d46",
          "params": {}
        }
      }
    ]
  },
  "9003/@main/2": {
    "sourceHash": "970f59a48d4fc28ab100362413a983118557649be26b19a653b7692c5c86522e",
    "parts": [
      {
        "label": {
          "$text": "dialogue.98bbeafbc555",
          "params": {}
        },
        "action": "@ClaimTestTalisman"
      }
    ]
  },
  "9003/@main/3": {
    "sourceHash": "b78ecc4248a3269c49358aeb3b8e2fd8fced28a0a8ae4a6650ad42d5b05de98a",
    "parts": [
      {
        "label": {
          "$text": "dialogue.46b98c125f4b",
          "params": {}
        },
        "action": "@BuyNew"
      }
    ]
  },
  "9003/@main/4": {
    "sourceHash": "39764caa77ac157404b7289994f68be66495929172376272a806d367d396543c",
    "parts": [
      {
        "label": {
          "$text": "dialogue.7345ed45ce93",
          "params": {}
        },
        "action": "@Exit"
      }
    ]
  },
  "9003/@claimtesttalisman/1": {
    "sourceHash": "98bbeafbc555393b3421dc5b6849e01bdb2b617df6794be4bf5e71ca073ab4ba",
    "parts": [
      {
        "label": {
          "$text": "dialogue.98bbeafbc555",
          "params": {}
        }
      }
    ]
  },
  "9003/@buynew/1": {
    "sourceHash": "f525a5b2a7188d5eb207df530b48e8d5f0b95579c9f6d3fcd514e165d09115f7",
    "parts": [
      {
        "label": {
          "$text": "dialogue.f525a5b2a718",
          "params": {}
        }
      }
    ]
  },
  "9004/@main/1": {
    "sourceHash": "64407aa012c262da3fc1bdf5428d91673add919d64f6fc8e17f55fc041907661",
    "parts": [
      {
        "label": {
          "$text": "dialogue.64407aa012c2",
          "params": {}
        }
      }
    ]
  },
  "9004/@main/2": {
    "sourceHash": "4fc38e1fef5651a62abe99bd78dd37d20b47c5f3c090bd04027d6d9b7b53ada4",
    "parts": [
      {
        "label": {
          "$text": "dialogue.3fd47edce45b",
          "params": {}
        },
        "action": "@Exit"
      }
    ]
  },
  "9004/quests/0": {
    "sourceHash": "9134e9e471f25dea64d6a0e7c0403c6e70a57c6d522b9f41aaa7f6bb2f415d3b",
    "parts": [
      {
        "label": "-206"
      }
    ]
  },
  "9004/quests/1": {
    "sourceHash": "8ae4c23b80d1e7c8ff79e515fe791ebd68190bae842dda7af193db125f700452",
    "parts": [
      {
        "label": "238"
      }
    ]
  },
  "9401/@main/1": {
    "sourceHash": "61651548b42c99b0598963128fca3ccf46b7b888f03d70155c28dfb3d7fdb689",
    "parts": [
      {
        "label": {
          "$text": "dialogue.61651548b42c",
          "params": {}
        }
      }
    ]
  },
  "9401/@main/2": {
    "sourceHash": "4fc38e1fef5651a62abe99bd78dd37d20b47c5f3c090bd04027d6d9b7b53ada4",
    "parts": [
      {
        "label": {
          "$text": "dialogue.3fd47edce45b",
          "params": {}
        },
        "action": "@Exit"
      }
    ]
  },
  "9401/quests/0": {
    "sourceHash": "935312b4cc19b1359bbec5dfb2f9cffd6739a4ec87b6686e218d37eb651b1a6b",
    "parts": [
      {
        "label": "-205"
      }
    ]
  },
  "9402/@main/1": {
    "sourceHash": "61651548b42c99b0598963128fca3ccf46b7b888f03d70155c28dfb3d7fdb689",
    "parts": [
      {
        "label": {
          "$text": "dialogue.61651548b42c",
          "params": {}
        }
      }
    ]
  },
  "9402/@main/2": {
    "sourceHash": "ef7cb0d1a9b026388b02a60913efe36bca506c7af0d5b9d4b3184422ed1886a9",
    "parts": [
      {
        "label": {
          "$text": "dialogue.27548583936a",
          "params": {}
        },
        "action": "@BuyNew"
      }
    ]
  },
  "9402/@main/3": {
    "sourceHash": "4fc38e1fef5651a62abe99bd78dd37d20b47c5f3c090bd04027d6d9b7b53ada4",
    "parts": [
      {
        "label": {
          "$text": "dialogue.3fd47edce45b",
          "params": {}
        },
        "action": "@Exit"
      }
    ]
  },
  "9402/quests/0": {
    "sourceHash": "8df66f64b57424391d363fd6b811fed3c430c77597da265025728bd637bad804",
    "parts": [
      {
        "label": "208"
      }
    ]
  },
  "9402/quests/1": {
    "sourceHash": "ecd3b5ab00c24de6e65e7b86778743ef428fdcb838b7c22abdb8aeb4b29002b9",
    "parts": [
      {
        "label": "-208"
      }
    ]
  },
  "9402/quests/2": {
    "sourceHash": "968076be2e38cf897d4d6cea3faca9c037e1a4e3b4b7744fb2533e07751bd30a",
    "parts": [
      {
        "label": "207"
      }
    ]
  },
  "9402/quests/3": {
    "sourceHash": "22b4b191c2992acafc9cdbb591dced692298809cba8af11a2e2bf059f94b7520",
    "parts": [
      {
        "label": "-207"
      }
    ]
  },
  "9402/quests/4": {
    "sourceHash": "83f814f7a92e365cbd79f9addceed185761a8d38a06a2d4350bb1fe4b7632b34",
    "parts": [
      {
        "label": "209"
      }
    ]
  },
  "9402/@buynew/1": {
    "sourceHash": "afaff407126559cb096f354bf04f654751cff96e8fcb1943885983862e3f9722",
    "parts": [
      {
        "label": {
          "$text": "dialogue.afaff4071265",
          "params": {}
        }
      }
    ]
  },
  "9402/@buynew/2": {
    "sourceHash": "26cd8481dd432f7d8ad13299eb69d5f946cabe3f6b670b0d3c0404f7c6741ffb",
    "parts": [
      {
        "label": {
          "$text": "dialogue.572cf45ba436",
          "params": {}
        },
        "action": "@Main"
      }
    ]
  },
  "9403/@main/1": {
    "sourceHash": "61651548b42c99b0598963128fca3ccf46b7b888f03d70155c28dfb3d7fdb689",
    "parts": [
      {
        "label": {
          "$text": "dialogue.61651548b42c",
          "params": {}
        }
      }
    ]
  },
  "9403/@main/2": {
    "sourceHash": "34e397ff5280e1dcd6b2d991dd2fbf33c7339479a553f89a77f316dcd3da1e60",
    "parts": [
      {
        "label": {
          "$text": "dialogue.7b7954f84ec9",
          "params": {}
        },
        "action": "@travel1005"
      }
    ]
  },
  "9403/@main/3": {
    "sourceHash": "4fc38e1fef5651a62abe99bd78dd37d20b47c5f3c090bd04027d6d9b7b53ada4",
    "parts": [
      {
        "label": {
          "$text": "dialogue.3fd47edce45b",
          "params": {}
        },
        "action": "@Exit"
      }
    ]
  },
  "9403/@travel1005/0": {
    "sourceHash": "dc4c11fcb945e655a217e8dbe7dfc05e8a1850f4aefb096f63373c49e9f61362",
    "parts": [
      {
        "label": "MOVE ky 12 50"
      }
    ]
  },
  "9403/quests/0": {
    "sourceHash": "19b4e3f27a9758eb3301e353e3e16e343481b422f9521ec6b8d8a73eebc6097b",
    "parts": [
      {
        "label": "-209"
      }
    ]
  },
  "9403/quests/1": {
    "sourceHash": "d29d53701d3c859e29e1b90028eec1ca8e2f29439198b6e036c60951fb458aa1",
    "parts": [
      {
        "label": "210"
      }
    ]
  },
  "9403/quests/2": {
    "sourceHash": "4ac650b523ecdc879feeed12c1dd4d3f0ac904a0106a6383a7580735a5989b54",
    "parts": [
      {
        "label": "-210"
      }
    ]
  },
  "9403/quests/3": {
    "sourceHash": "093434a3ee9e0a010bb2c2aae06c2614dd24894062a1caf26718a01e175569b8",
    "parts": [
      {
        "label": "211"
      }
    ]
  },
  "9403/quests/4": {
    "sourceHash": "a0c3df4de3b5fc23ab886dd0a09d2430d1f2243025a0354319f7220787bfde7f",
    "parts": [
      {
        "label": "-211"
      }
    ]
  },
  "9403/quests/5": {
    "sourceHash": "fa2b7af0a811b9acde602aacb78e3638e8506dfead5fe6c3425b10b526f94bdd",
    "parts": [
      {
        "label": "212"
      }
    ]
  },
  "9403/quests/6": {
    "sourceHash": "aa1564414d74c379e699ff85296f2d84bd57710203d1084c61affab3605d8747",
    "parts": [
      {
        "label": "-212"
      }
    ]
  },
  "9403/quests/7": {
    "sourceHash": "d48ff4b2f68a10fd7c86f185a6ccede0dc0f2c48538d697cb33b6ada3f1e85db",
    "parts": [
      {
        "label": "213"
      }
    ]
  },
  "9404/@main/1": {
    "sourceHash": "61651548b42c99b0598963128fca3ccf46b7b888f03d70155c28dfb3d7fdb689",
    "parts": [
      {
        "label": {
          "$text": "dialogue.61651548b42c",
          "params": {}
        }
      }
    ]
  },
  "9404/@main/2": {
    "sourceHash": "4fc38e1fef5651a62abe99bd78dd37d20b47c5f3c090bd04027d6d9b7b53ada4",
    "parts": [
      {
        "label": {
          "$text": "dialogue.3fd47edce45b",
          "params": {}
        },
        "action": "@Exit"
      }
    ]
  },
  "9404/quests/0": {
    "sourceHash": "a51a44b8e64e405bf8ff0368256f4dbdb4539b490e8ede10f590c736f330d8af",
    "parts": [
      {
        "label": "-217"
      }
    ]
  },
  "9404/quests/1": {
    "sourceHash": "79bf08685d3138f9b109c3546780f056bc954fd69377b84a2cf23622e464897b",
    "parts": [
      {
        "label": "239"
      }
    ]
  },
  "9405/@main/1": {
    "sourceHash": "62b3dd6b30e63b2526b39c62ceef8fea14f3afe97c4b1401eb11f895257c82db",
    "parts": [
      {
        "label": {
          "$text": "dialogue.62b3dd6b30e6",
          "params": {}
        }
      }
    ]
  },
  "9405/@main/2": {
    "sourceHash": "7d43e50c08450a3a1bd1804691fbe95b0a15d1a109a4422cf0bd33cf5c11cea8",
    "parts": [
      {
        "label": {
          "$text": "dialogue.a1557ec3b077",
          "params": {}
        },
        "action": "@buynew"
      },
      {
        "label": "　"
      },
      {
        "label": {
          "$text": "dialogue.fb28ba14091d",
          "params": {}
        },
        "action": "@sell"
      },
      {
        "label": "　"
      },
      {
        "label": {
          "$text": "dialogue.298c082ebd17",
          "params": {}
        },
        "action": "@buyback"
      }
    ]
  },
  "9405/@main/3": {
    "sourceHash": "f681bcd8458666645830f0922f1b76504b3bfd218ad47787a823f4753095f63b",
    "parts": [
      {
        "label": {
          "$text": "dialogue.f23a52442ec2",
          "params": {}
        },
        "action": "@woomaexchange"
      }
    ]
  },
  "9405/@main/4": {
    "sourceHash": "4fc38e1fef5651a62abe99bd78dd37d20b47c5f3c090bd04027d6d9b7b53ada4",
    "parts": [
      {
        "label": {
          "$text": "dialogue.3fd47edce45b",
          "params": {}
        },
        "action": "@Exit"
      }
    ]
  },
  "9405/@buynew/1": {
    "sourceHash": "b075e8d77730ad9ea96db3158d71a2d3d89105b42acdc787fcb6a8afa3012fe6",
    "parts": [
      {
        "label": {
          "$text": "dialogue.b075e8d77730",
          "params": {}
        }
      }
    ]
  },
  "9405/@sell/1": {
    "sourceHash": "d47b38d952506eccb4557c2c9a1b2050b84cd28a76dc791a03114e65dad72544",
    "parts": [
      {
        "label": {
          "$text": "dialogue.d47b38d95250",
          "params": {}
        }
      }
    ]
  },
  "9405/@buyback/1": {
    "sourceHash": "f9679f231d3ff8ccfe942e2c127e49bbe23cd0fae717a117f50dcaf5a892e3d2",
    "parts": [
      {
        "label": {
          "$text": "dialogue.f9679f231d3f",
          "params": {}
        }
      }
    ]
  },
  "9405/quests/0": {
    "sourceHash": "802b906a18591ead8a6dd809b262ace4c65c16e89764c40ae326cfcff811e10c",
    "parts": [
      {
        "label": "214"
      }
    ]
  },
  "9405/quests/1": {
    "sourceHash": "c10d0d1936500bceeb4e4a29276f8038b91965a51e59c7cba532a02e9daa5bc3",
    "parts": [
      {
        "label": "-214"
      }
    ]
  },
  "9406/@main/1": {
    "sourceHash": "61651548b42c99b0598963128fca3ccf46b7b888f03d70155c28dfb3d7fdb689",
    "parts": [
      {
        "label": {
          "$text": "dialogue.61651548b42c",
          "params": {}
        }
      }
    ]
  },
  "9406/@main/2": {
    "sourceHash": "3bacd419fdf013d41c582c7dad9e660462182a5cbd4625a74798cad7b28d515d",
    "parts": [
      {
        "label": {
          "$text": "dialogue.e36930e05b78",
          "params": {}
        },
        "action": "@travel1109"
      }
    ]
  },
  "9406/@main/3": {
    "sourceHash": "590901f0d203b687a48525bf94a39f9f940d7ffc5bb11d4bbdc2a877d004c186",
    "parts": [
      {
        "label": {
          "$text": "dialogue.5de2e76db8b1",
          "params": {}
        },
        "action": "@travel1114"
      }
    ]
  },
  "9406/@main/4": {
    "sourceHash": "d2aecc56dd91057492642dcebfd4473b69c5e016b506df70dfb0ba1b823faa06",
    "parts": [
      {
        "label": {
          "$text": "dialogue.b6851c6036f6",
          "params": {}
        },
        "action": "@settlebichon"
      }
    ]
  },
  "9406/@main/5": {
    "sourceHash": "4fc38e1fef5651a62abe99bd78dd37d20b47c5f3c090bd04027d6d9b7b53ada4",
    "parts": [
      {
        "label": {
          "$text": "dialogue.3fd47edce45b",
          "params": {}
        },
        "action": "@Exit"
      }
    ]
  },
  "9406/@travel1109/0": {
    "sourceHash": "a44bf2af385e49ef91e662361cc1c526efa54aa425f2d877ed968b2f29cf4ac0",
    "parts": [
      {
        "label": "MOVE hg 12 42"
      }
    ]
  },
  "9406/@travel1114/0": {
    "sourceHash": "4d0c9510a9df89fa727b977e957053d903b8a8b476886b649fb60dc08358ca9e",
    "parts": [
      {
        "label": "MOVE zy 48 61"
      }
    ]
  },
  "9406/quests/0": {
    "sourceHash": "e9049c3b8c76852aff73c12296f39e6d37f2988c52784d20abcb137c4c89331f",
    "parts": [
      {
        "label": "-213"
      }
    ]
  },
  "9406/quests/1": {
    "sourceHash": "d86580a57f7bf542e85202283cb845953c9d28f80a8e651db08b2fc0b2d6a731",
    "parts": [
      {
        "label": "215"
      }
    ]
  },
  "9406/quests/2": {
    "sourceHash": "22f1c1c58c1f3c8cd6d229c6671cb4cff247b3401bed44e6acbe7507cad8d05c",
    "parts": [
      {
        "label": "-215"
      }
    ]
  },
  "9406/quests/3": {
    "sourceHash": "0f4121d0ef1df4c86854c7ebb47ae1c93de8aec8f944035eeaa6495dd71a0678",
    "parts": [
      {
        "label": "216"
      }
    ]
  },
  "9406/quests/4": {
    "sourceHash": "25452604b871ce1f200304a3c490b04b260075527877ba173f41c23537280297",
    "parts": [
      {
        "label": "-216"
      }
    ]
  },
  "9406/quests/5": {
    "sourceHash": "16badfc6202cb3f8889e0f2779b19218af4cbb736e56acadce8148aba9a7a9f8",
    "parts": [
      {
        "label": "217"
      }
    ]
  },
  "9406/quests/6": {
    "sourceHash": "7d1a0b60d68a1efc2e01df13132034d669b2ce5b05c8bf6d4ae6322e810c5659",
    "parts": [
      {
        "label": "-239"
      }
    ]
  },
  "9406/quests/7": {
    "sourceHash": "5966abd0cbfc86f98a186531b2b4ee5f6e910120ce13222f98207203dfc9a9a2",
    "parts": [
      {
        "label": "218"
      }
    ]
  },
  "9406/quests/8": {
    "sourceHash": "f85ac9f571ef591346b7450aefdf802ad57586daaead1fbc662e82c307d5d133",
    "parts": [
      {
        "label": "-218"
      }
    ]
  },
  "9406/quests/9": {
    "sourceHash": "314f04b30f62e0056bd059354a5536fb2e302107eed143b5fa2aa0bbba07f608",
    "parts": [
      {
        "label": "219"
      }
    ]
  },
  "9406/quests/10": {
    "sourceHash": "c90f3efcd20509ab40c59b485b55982da87865553dc3b70b6198d4fb38d42f17",
    "parts": [
      {
        "label": "-219"
      }
    ]
  },
  "9406/quests/11": {
    "sourceHash": "36790ecd55c2030dc553685bef719df653f413a20cdad1bfd1dc934c76686ddd",
    "parts": [
      {
        "label": "220"
      }
    ]
  },
  "9406/quests/12": {
    "sourceHash": "3008f39af79d3b8cde28f1a05d95ad8c1ce866ff993c23916147d0d2f0a331cc",
    "parts": [
      {
        "label": "-220"
      }
    ]
  },
  "9406/quests/13": {
    "sourceHash": "67e9c3acebb154a282f326d4ff1951cd1f342e58e74d562b556b517da5e56132",
    "parts": [
      {
        "label": "221"
      }
    ]
  },
  "9406/quests/14": {
    "sourceHash": "26de96058f0b0b5b58b5f1281e6ff0be11a31ed3df54e95a44028a66cb2122f0",
    "parts": [
      {
        "label": "-221"
      }
    ]
  },
  "9406/quests/15": {
    "sourceHash": "9b871512327c09ce91dd649b3f96a63b7408ef267c8cc5710114e629730cb61f",
    "parts": [
      {
        "label": "222"
      }
    ]
  },
  "9406/quests/16": {
    "sourceHash": "0d4bbfca8a3ebdde723c9bf1f8d48d8d755347c507cb6d6c1637bfd29cadd50e",
    "parts": [
      {
        "label": "-222"
      }
    ]
  },
  "9406/quests/17": {
    "sourceHash": "56f4da26ed956730309fa1488611ee0f13b0ac95ebb1bc9b5d210e31ff70e79c",
    "parts": [
      {
        "label": "223"
      }
    ]
  },
  "9407/@main/1": {
    "sourceHash": "61651548b42c99b0598963128fca3ccf46b7b888f03d70155c28dfb3d7fdb689",
    "parts": [
      {
        "label": {
          "$text": "dialogue.61651548b42c",
          "params": {}
        }
      }
    ]
  },
  "9407/@main/2": {
    "sourceHash": "4fc38e1fef5651a62abe99bd78dd37d20b47c5f3c090bd04027d6d9b7b53ada4",
    "parts": [
      {
        "label": {
          "$text": "dialogue.3fd47edce45b",
          "params": {}
        },
        "action": "@Exit"
      }
    ]
  },
  "9407/quests/0": {
    "sourceHash": "75a5a000432b2330a2792a6a08c45448b137e44b7a4dc6fc3000bba9c492f256",
    "parts": [
      {
        "label": "-223"
      }
    ]
  },
  "9407/quests/1": {
    "sourceHash": "84a5092e4a5b6fe968fd523fb2fc917dbffae44105f82b6b94c8ed5b9a800223",
    "parts": [
      {
        "label": "224"
      }
    ]
  },
  "9407/quests/2": {
    "sourceHash": "2fda8cfa60105996f9c8db02dd2eae724b46ed6108eeb9660bbdc2e45904e7e1",
    "parts": [
      {
        "label": "-224"
      }
    ]
  },
  "9407/quests/3": {
    "sourceHash": "0e6523810856a138a75dec70a9cf3778a5c70b83ac915f22c33f05db97cb3e68",
    "parts": [
      {
        "label": "225"
      }
    ]
  },
  "9407/quests/4": {
    "sourceHash": "1b1ae1176868f93001ab2311bd5c2ec89999384cb1bfa62386864e61e0545469",
    "parts": [
      {
        "label": "-225"
      }
    ]
  },
  "9407/quests/5": {
    "sourceHash": "8f1f64db81c40ea10e1e9080c9ae60a7acb8925968c431ee16784dea9841c66f",
    "parts": [
      {
        "label": "226"
      }
    ]
  },
  "9407/quests/6": {
    "sourceHash": "337d64a24dc4793d517d943ded4fac1c91b857e7c9cc1e8d73562c8690a861bb",
    "parts": [
      {
        "label": "-226"
      }
    ]
  },
  "9407/quests/7": {
    "sourceHash": "dfe62e836a0a6f2633422230c81287700a56e2639652c73f264e6562220c207a",
    "parts": [
      {
        "label": "227"
      }
    ]
  },
  "9408/@main/1": {
    "sourceHash": "61651548b42c99b0598963128fca3ccf46b7b888f03d70155c28dfb3d7fdb689",
    "parts": [
      {
        "label": {
          "$text": "dialogue.61651548b42c",
          "params": {}
        }
      }
    ]
  },
  "9408/@main/2": {
    "sourceHash": "4fc38e1fef5651a62abe99bd78dd37d20b47c5f3c090bd04027d6d9b7b53ada4",
    "parts": [
      {
        "label": {
          "$text": "dialogue.3fd47edce45b",
          "params": {}
        },
        "action": "@Exit"
      }
    ]
  },
  "9408/quests/0": {
    "sourceHash": "8776fef47ccface17a36e1fc5c167a153f3b1c405c4013823da8bdb310a56d49",
    "parts": [
      {
        "label": "-227"
      }
    ]
  },
  "9408/quests/1": {
    "sourceHash": "9d693eeee1d1899cbc50b6d45df953d3835acf28ee869879b45565fccc814765",
    "parts": [
      {
        "label": "228"
      }
    ]
  },
  "9409/@main/1": {
    "sourceHash": "a381164b208e33ba8100913e320a2ac8371244ecfcef5cabbb4a002dcc24e6ae",
    "parts": [
      {
        "label": {
          "$text": "dialogue.a381164b208e",
          "params": {}
        }
      }
    ]
  },
  "9409/@main/2": {
    "sourceHash": "61651548b42c99b0598963128fca3ccf46b7b888f03d70155c28dfb3d7fdb689",
    "parts": [
      {
        "label": {
          "$text": "dialogue.61651548b42c",
          "params": {}
        }
      }
    ]
  },
  "9409/@main/3": {
    "sourceHash": "d5e06094dba2e352db4defb505f28205865574229f9830951b48ae1ee375479b",
    "parts": [
      {
        "label": {
          "$text": "dialogue.e44df89eb8c7",
          "params": {}
        },
        "action": "@travel1001"
      }
    ]
  },
  "9409/@main/4": {
    "sourceHash": "a548f722d262717f9e692a51412c15ac850b92c1c537d8133ecdd41284b1414c",
    "parts": [
      {
        "label": {
          "$text": "dialogue.717997f80f77",
          "params": {}
        },
        "action": "@travel1115"
      }
    ]
  },
  "9409/@main/5": {
    "sourceHash": "4fc38e1fef5651a62abe99bd78dd37d20b47c5f3c090bd04027d6d9b7b53ada4",
    "parts": [
      {
        "label": {
          "$text": "dialogue.3fd47edce45b",
          "params": {}
        },
        "action": "@Exit"
      }
    ]
  },
  "9409/@travel1001/0": {
    "sourceHash": "9449f31102d300dcb8254b61abedfc10c0875aca44c9d7dd372b6230fd0facbf",
    "parts": [
      {
        "label": "MOVE map021 341 190"
      }
    ]
  },
  "9409/@travel1115/0": {
    "sourceHash": "a00063b375ecdfe80f9ee08bab8ccf4c85df2cb78121d1a143666d780d407418",
    "parts": [
      {
        "label": "MOVE mj1 29 60"
      }
    ]
  },
  "9409/quests/0": {
    "sourceHash": "8cd8197c9089e01903ffcec36563debe9a493e1332521aef3ca9bca9ac08b6ca",
    "parts": [
      {
        "label": "-228"
      }
    ]
  },
  "9409/quests/1": {
    "sourceHash": "a0eaec5a55dc2f5b2ba523018adc485ff620b9d83509b9f37186a7716e438d21",
    "parts": [
      {
        "label": "230"
      }
    ]
  },
  "9409/quests/2": {
    "sourceHash": "126cce0d8b58a64d79fb1624c5571b31cfe83c2498653cfb93cdfe95e2404cee",
    "parts": [
      {
        "label": "-230"
      }
    ]
  },
  "9409/quests/3": {
    "sourceHash": "138d9e809e386a7b800791d1f664f56d1c55f3d1ba411b950862729bc486c5ce",
    "parts": [
      {
        "label": "231"
      }
    ]
  },
  "9410/@main/1": {
    "sourceHash": "61651548b42c99b0598963128fca3ccf46b7b888f03d70155c28dfb3d7fdb689",
    "parts": [
      {
        "label": {
          "$text": "dialogue.61651548b42c",
          "params": {}
        }
      }
    ]
  },
  "9410/@main/2": {
    "sourceHash": "bfc0a1e0550ecdbf9472429bab423653da372a1d35dc69cdc179cdee3123eb3c",
    "parts": [
      {
        "label": {
          "$text": "dialogue.8e63a9228e8b",
          "params": {}
        },
        "action": "@travel1116"
      }
    ]
  },
  "9410/@main/3": {
    "sourceHash": "4fc38e1fef5651a62abe99bd78dd37d20b47c5f3c090bd04027d6d9b7b53ada4",
    "parts": [
      {
        "label": {
          "$text": "dialogue.3fd47edce45b",
          "params": {}
        },
        "action": "@Exit"
      }
    ]
  },
  "9410/@travel1116/0": {
    "sourceHash": "b1efc32cd7db5c442d7f2552c26e2163d6f5a72b0e88f1643b3af34db4be00fd",
    "parts": [
      {
        "label": "MOVE mj2 28 41"
      }
    ]
  },
  "9410/quests/0": {
    "sourceHash": "17a4ddfaa7feb24aaa75ed28faf854fc2743238581c0fbe7ea40110d4e6ee8c5",
    "parts": [
      {
        "label": "-231"
      }
    ]
  },
  "9410/quests/1": {
    "sourceHash": "835d5e8314340ab852a2f979ab4cd53e994dbe38366afb6eed84fe4957b980c8",
    "parts": [
      {
        "label": "232"
      }
    ]
  },
  "9411/@main/1": {
    "sourceHash": "61651548b42c99b0598963128fca3ccf46b7b888f03d70155c28dfb3d7fdb689",
    "parts": [
      {
        "label": {
          "$text": "dialogue.61651548b42c",
          "params": {}
        }
      }
    ]
  },
  "9411/@main/2": {
    "sourceHash": "a548f722d262717f9e692a51412c15ac850b92c1c537d8133ecdd41284b1414c",
    "parts": [
      {
        "label": {
          "$text": "dialogue.717997f80f77",
          "params": {}
        },
        "action": "@travel1115"
      }
    ]
  },
  "9411/@main/3": {
    "sourceHash": "e24c207442b0537a18c3fa97a04cc08fd557d8958839181216dfe9da692a4b63",
    "parts": [
      {
        "label": {
          "$text": "dialogue.1812589b216b",
          "params": {}
        },
        "action": "@travel1120"
      }
    ]
  },
  "9411/@main/4": {
    "sourceHash": "4fc38e1fef5651a62abe99bd78dd37d20b47c5f3c090bd04027d6d9b7b53ada4",
    "parts": [
      {
        "label": {
          "$text": "dialogue.3fd47edce45b",
          "params": {}
        },
        "action": "@Exit"
      }
    ]
  },
  "9411/@travel1115/0": {
    "sourceHash": "a00063b375ecdfe80f9ee08bab8ccf4c85df2cb78121d1a143666d780d407418",
    "parts": [
      {
        "label": "MOVE mj1 29 60"
      }
    ]
  },
  "9411/@travel1120/0": {
    "sourceHash": "e2c8595a7cdc728a2de1985fe5a32bbb11b5996d904ae9987575b646efdad30b",
    "parts": [
      {
        "label": "MOVE map048 270 250"
      }
    ]
  },
  "9411/quests/0": {
    "sourceHash": "8c03ce1f899a39ccbcff85766584c23c6126c89984969265c9762f160c4a4d34",
    "parts": [
      {
        "label": "-232"
      }
    ]
  },
  "9411/quests/1": {
    "sourceHash": "c0509a487a18b003ba05e505419ebb63e57a29158073e381f57160b5c5b86426",
    "parts": [
      {
        "label": "233"
      }
    ]
  },
  "9411/quests/2": {
    "sourceHash": "027f8d43baaa718e4a652be9364c903b5ea06357692c66d9ee4445343f5c00a9",
    "parts": [
      {
        "label": "-233"
      }
    ]
  },
  "9411/quests/3": {
    "sourceHash": "9a049b03f6fc40bfcf2f136320359257ed4af8513f71aa6fef47f17059bbae23",
    "parts": [
      {
        "label": "236"
      }
    ]
  },
  "9411/quests/4": {
    "sourceHash": "4cf0289b111c33226ea0dd82b9bfb879b7e428f007d52c72340403bfbfa8f3f1",
    "parts": [
      {
        "label": "-236"
      }
    ]
  },
  "9411/quests/5": {
    "sourceHash": "114bd151f8fb0c58642d2170da4ae7d7c57977260ac2cc8905306cab6b2acabc",
    "parts": [
      {
        "label": "234"
      }
    ]
  },
  "9411/quests/6": {
    "sourceHash": "e2ccdf65d18462260bbe47a14372d5925f98bdad54508dd323f316398db4b437",
    "parts": [
      {
        "label": "-234"
      }
    ]
  },
  "9411/quests/7": {
    "sourceHash": "0a2d643bfd24a028cd236e76575d828424ccffbfa47392bd09d8ca9dc85e2f8d",
    "parts": [
      {
        "label": "235"
      }
    ]
  },
  "9412/@main/1": {
    "sourceHash": "61651548b42c99b0598963128fca3ccf46b7b888f03d70155c28dfb3d7fdb689",
    "parts": [
      {
        "label": {
          "$text": "dialogue.61651548b42c",
          "params": {}
        }
      }
    ]
  },
  "9412/@main/2": {
    "sourceHash": "5c9efa06ac0eb3c54c7c443f9dee0155b2bbbe10813f6a6b222db4a8dadd5cc9",
    "parts": [
      {
        "label": {
          "$text": "dialogue.235ee58b4003",
          "params": {}
        },
        "action": "@travel1110"
      }
    ]
  },
  "9412/@main/3": {
    "sourceHash": "4fc38e1fef5651a62abe99bd78dd37d20b47c5f3c090bd04027d6d9b7b53ada4",
    "parts": [
      {
        "label": {
          "$text": "dialogue.3fd47edce45b",
          "params": {}
        },
        "action": "@Exit"
      }
    ]
  },
  "9412/@travel1110/0": {
    "sourceHash": "00668ca4fd543eb5e654cbbc5c816875abf653e39747dc679f4f73376962cd36",
    "parts": [
      {
        "label": "MOVE map034 42 218"
      }
    ]
  },
  "9412/quests/0": {
    "sourceHash": "901177cacf76eae299415136ef0cdc1c0ef2770178dda9b18d9caecf8534377c",
    "parts": [
      {
        "label": "-235"
      }
    ]
  },
  "9413/@main/1": {
    "sourceHash": "61651548b42c99b0598963128fca3ccf46b7b888f03d70155c28dfb3d7fdb689",
    "parts": [
      {
        "label": {
          "$text": "dialogue.61651548b42c",
          "params": {}
        }
      }
    ]
  },
  "9413/@main/2": {
    "sourceHash": "d5e06094dba2e352db4defb505f28205865574229f9830951b48ae1ee375479b",
    "parts": [
      {
        "label": {
          "$text": "dialogue.e44df89eb8c7",
          "params": {}
        },
        "action": "@travel1001"
      }
    ]
  },
  "9413/@main/3": {
    "sourceHash": "4fc38e1fef5651a62abe99bd78dd37d20b47c5f3c090bd04027d6d9b7b53ada4",
    "parts": [
      {
        "label": {
          "$text": "dialogue.3fd47edce45b",
          "params": {}
        },
        "action": "@Exit"
      }
    ]
  },
  "9413/@travel1001/0": {
    "sourceHash": "9449f31102d300dcb8254b61abedfc10c0875aca44c9d7dd372b6230fd0facbf",
    "parts": [
      {
        "label": "MOVE map021 341 190"
      }
    ]
  },
  "9419/@main/1": {
    "sourceHash": "4da7219aba4758416df82d032c4cdee26594ba603ac8b379656e074a26a3a818",
    "parts": [
      {
        "label": {
          "$text": "dialogue.4da7219aba47",
          "params": {}
        }
      }
    ]
  },
  "9419/@main/2": {
    "sourceHash": "acdc21086999c5806f1793ebb46f89c63fe3a35bbc07dc56e519373005e3e03c",
    "parts": [
      {
        "label": {
          "$text": "dialogue.9e274f611287",
          "params": {}
        },
        "action": "@BuyNew"
      }
    ]
  },
  "9419/@main/3": {
    "sourceHash": "92101a688b6f6553bd4a72b93473848133c66ec285079fe626e3e6c975b9555f",
    "parts": [
      {
        "label": {
          "$text": "dialogue.60bad305fba2",
          "params": {}
        },
        "action": "@Sell"
      }
    ]
  },
  "9419/@main/4": {
    "sourceHash": "d8a143f05fa292b01455a8f37ed78ed252ed78428ac68879eade5bd4714cc454",
    "parts": [
      {
        "label": {
          "$text": "dialogue.ae8ad2c31530",
          "params": {}
        },
        "action": "@BuyBack"
      }
    ]
  },
  "9419/@main/5": {
    "sourceHash": "4fc38e1fef5651a62abe99bd78dd37d20b47c5f3c090bd04027d6d9b7b53ada4",
    "parts": [
      {
        "label": {
          "$text": "dialogue.3fd47edce45b",
          "params": {}
        },
        "action": "@Exit"
      }
    ]
  },
  "9419/@buynew/1": {
    "sourceHash": "0669d489e82b9fd108e3c9778054eaa8b53ca09a169ecb12c03993583f039564",
    "parts": [
      {
        "label": {
          "$text": "dialogue.0669d489e82b",
          "params": {}
        }
      }
    ]
  },
  "9419/@buynew/2": {
    "sourceHash": "26cd8481dd432f7d8ad13299eb69d5f946cabe3f6b670b0d3c0404f7c6741ffb",
    "parts": [
      {
        "label": {
          "$text": "dialogue.572cf45ba436",
          "params": {}
        },
        "action": "@Main"
      }
    ]
  },
  "9419/trade/0": {
    "sourceHash": "191211a674c02cabb9bfda71dc017c4f2a6e09e4d18ea239752d7e405ce86929",
    "parts": [
      {
        "label": "TownTeleport"
      }
    ]
  },
  "9419/trade/1": {
    "sourceHash": "ba2e51d6a86fb4fccffe58f2db5aaa03cb5196a7d133de3d6f1f449275a9d39d",
    "parts": [
      {
        "label": "RandomTeleport"
      }
    ]
  },
  "9419/@sell/1": {
    "sourceHash": "4b65118372cc598a89f9dd0fd04031bb6b8920044d7d3869640a0929c81b1917",
    "parts": [
      {
        "label": {
          "$text": "dialogue.4b65118372cc",
          "params": {}
        }
      }
    ]
  },
  "9419/@sell/2": {
    "sourceHash": "88ead46d5169bbaab6bbefdb6253d63a22cdd32a2166f5b25c4b0bb0b58eed28",
    "parts": [
      {
        "label": {
          "$text": "dialogue.ae8ad2c31530",
          "params": {}
        },
        "action": "@BuyBack"
      },
      {
        "label": " "
      },
      {
        "label": {
          "$text": "dialogue.572cf45ba436",
          "params": {}
        },
        "action": "@Main"
      }
    ]
  },
  "9419/@buyback/1": {
    "sourceHash": "faa0a1069e720ffbfc76efbc524ae34c15a6fb068e22ab59dc2cddb9a0355d3e",
    "parts": [
      {
        "label": {
          "$text": "dialogue.faa0a1069e72",
          "params": {}
        }
      }
    ]
  },
  "9419/@buyback/2": {
    "sourceHash": "26cd8481dd432f7d8ad13299eb69d5f946cabe3f6b670b0d3c0404f7c6741ffb",
    "parts": [
      {
        "label": {
          "$text": "dialogue.572cf45ba436",
          "params": {}
        },
        "action": "@Main"
      }
    ]
  },
  "9421/@main/1": {
    "sourceHash": "e779e90d7a6743509d0188ec47d5345182d46304f85e7e919686aef08110da62",
    "parts": [
      {
        "label": {
          "$text": "dialogue.36f62a64756c",
          "params": {}
        }
      }
    ]
  },
  "9421/@main/2": {
    "sourceHash": "081f65a72486886420f7831ab2f33ce0777ae3c84399c01de8f545a660397bdf",
    "parts": [
      {
        "label": {
          "$text": "dialogue.d355cf8ce6f4",
          "params": {}
        },
        "action": "@Storage"
      }
    ]
  },
  "9421/@main/3": {
    "sourceHash": "4fc38e1fef5651a62abe99bd78dd37d20b47c5f3c090bd04027d6d9b7b53ada4",
    "parts": [
      {
        "label": {
          "$text": "dialogue.3fd47edce45b",
          "params": {}
        },
        "action": "@Exit"
      }
    ]
  },
  "9421/@storage/1": {
    "sourceHash": "29d42de3b54db524c12fe27e8bc78bbf5105d4767f4358a26f443f46d5964b20",
    "parts": [
      {
        "label": {
          "$text": "dialogue.29d42de3b54d",
          "params": {}
        }
      }
    ]
  },
  "9421/@storage/2": {
    "sourceHash": "26cd8481dd432f7d8ad13299eb69d5f946cabe3f6b670b0d3c0404f7c6741ffb",
    "parts": [
      {
        "label": {
          "$text": "dialogue.572cf45ba436",
          "params": {}
        },
        "action": "@Main"
      }
    ]
  },
  "9414/@main/1": {
    "sourceHash": "61651548b42c99b0598963128fca3ccf46b7b888f03d70155c28dfb3d7fdb689",
    "parts": [
      {
        "label": {
          "$text": "dialogue.61651548b42c",
          "params": {}
        }
      }
    ]
  },
  "9414/@main/2": {
    "sourceHash": "dde91409a8f286634474a9182ce6c03a23f946ca28a5fd398e110988df58f219",
    "parts": [
      {
        "label": {
          "$text": "dialogue.2b2c85c80e3c",
          "params": {}
        },
        "action": "@travel1117"
      }
    ]
  },
  "9414/@main/3": {
    "sourceHash": "4fc38e1fef5651a62abe99bd78dd37d20b47c5f3c090bd04027d6d9b7b53ada4",
    "parts": [
      {
        "label": {
          "$text": "dialogue.3fd47edce45b",
          "params": {}
        },
        "action": "@Exit"
      }
    ]
  },
  "9414/@travel1117/0": {
    "sourceHash": "f011e4e03e04fd663869aec93cac5c19c8a84b8a50022cfa4b54b65c285f474d",
    "parts": [
      {
        "label": "MOVE mj3 50 50"
      }
    ]
  },
  "9415/@main/1": {
    "sourceHash": "61651548b42c99b0598963128fca3ccf46b7b888f03d70155c28dfb3d7fdb689",
    "parts": [
      {
        "label": {
          "$text": "dialogue.61651548b42c",
          "params": {}
        }
      }
    ]
  },
  "9415/@main/2": {
    "sourceHash": "f5a8fb6b78ca03fa65e9499a045d3f65b1cb4d7f4426e86fa44042b867862043",
    "parts": [
      {
        "label": {
          "$text": "dialogue.46ce012a1625",
          "params": {}
        },
        "action": "@travel1118"
      }
    ]
  },
  "9415/@main/3": {
    "sourceHash": "4fc38e1fef5651a62abe99bd78dd37d20b47c5f3c090bd04027d6d9b7b53ada4",
    "parts": [
      {
        "label": {
          "$text": "dialogue.3fd47edce45b",
          "params": {}
        },
        "action": "@Exit"
      }
    ]
  },
  "9415/@travel1118/0": {
    "sourceHash": "da01d000dbefa73eca42cab1a055a19ece4566249e96a577e8511868a51a3403",
    "parts": [
      {
        "label": "MOVE mj4 50 50"
      }
    ]
  },
  "9416/@main/1": {
    "sourceHash": "61651548b42c99b0598963128fca3ccf46b7b888f03d70155c28dfb3d7fdb689",
    "parts": [
      {
        "label": {
          "$text": "dialogue.61651548b42c",
          "params": {}
        }
      }
    ]
  },
  "9416/@main/2": {
    "sourceHash": "dde91409a8f286634474a9182ce6c03a23f946ca28a5fd398e110988df58f219",
    "parts": [
      {
        "label": {
          "$text": "dialogue.2b2c85c80e3c",
          "params": {}
        },
        "action": "@travel1117"
      }
    ]
  },
  "9416/@main/3": {
    "sourceHash": "4fc38e1fef5651a62abe99bd78dd37d20b47c5f3c090bd04027d6d9b7b53ada4",
    "parts": [
      {
        "label": {
          "$text": "dialogue.3fd47edce45b",
          "params": {}
        },
        "action": "@Exit"
      }
    ]
  },
  "9416/@travel1117/0": {
    "sourceHash": "f011e4e03e04fd663869aec93cac5c19c8a84b8a50022cfa4b54b65c285f474d",
    "parts": [
      {
        "label": "MOVE mj3 50 50"
      }
    ]
  },
  "9416/quests/0": {
    "sourceHash": "f0bc318fb8965cad8d73d578cd03c63b7987dc6a79b906aada091e1b6a13443f",
    "parts": [
      {
        "label": "237"
      }
    ]
  },
  "9417/@main/1": {
    "sourceHash": "61651548b42c99b0598963128fca3ccf46b7b888f03d70155c28dfb3d7fdb689",
    "parts": [
      {
        "label": {
          "$text": "dialogue.61651548b42c",
          "params": {}
        }
      }
    ]
  },
  "9417/@main/2": {
    "sourceHash": "1932e3b6e4be93140a001144e1ef7024b879c78c5d62ca8d3a56f65250f0f50e",
    "parts": [
      {
        "label": {
          "$text": "dialogue.847c2aa3f780",
          "params": {}
        },
        "action": "@travel1119"
      }
    ]
  },
  "9417/@main/3": {
    "sourceHash": "4fc38e1fef5651a62abe99bd78dd37d20b47c5f3c090bd04027d6d9b7b53ada4",
    "parts": [
      {
        "label": {
          "$text": "dialogue.3fd47edce45b",
          "params": {}
        },
        "action": "@Exit"
      }
    ]
  },
  "9417/@travel1119/0": {
    "sourceHash": "ec4dd9a6f23eb6daea84ac49fdb5d903aa4a97f8d665e710f7b1188e312a14df",
    "parts": [
      {
        "label": "MOVE map047 50 50"
      }
    ]
  },
  "9417/quests/0": {
    "sourceHash": "766221c3c3d4575ad8de334e2195ae8c5dc56008853fb786e9916390b6b8f901",
    "parts": [
      {
        "label": "-237"
      }
    ]
  },
  "9418/@main/1": {
    "sourceHash": "61651548b42c99b0598963128fca3ccf46b7b888f03d70155c28dfb3d7fdb689",
    "parts": [
      {
        "label": {
          "$text": "dialogue.61651548b42c",
          "params": {}
        }
      }
    ]
  },
  "9418/@main/2": {
    "sourceHash": "f5a8fb6b78ca03fa65e9499a045d3f65b1cb4d7f4426e86fa44042b867862043",
    "parts": [
      {
        "label": {
          "$text": "dialogue.46ce012a1625",
          "params": {}
        },
        "action": "@travel1118"
      }
    ]
  },
  "9418/@main/3": {
    "sourceHash": "4fc38e1fef5651a62abe99bd78dd37d20b47c5f3c090bd04027d6d9b7b53ada4",
    "parts": [
      {
        "label": {
          "$text": "dialogue.3fd47edce45b",
          "params": {}
        },
        "action": "@Exit"
      }
    ]
  },
  "9418/@travel1118/0": {
    "sourceHash": "da01d000dbefa73eca42cab1a055a19ece4566249e96a577e8511868a51a3403",
    "parts": [
      {
        "label": "MOVE mj4 50 50"
      }
    ]
  },
  "9420/@main/0": {
    "sourceHash": "c42687f9217f7b20e55dec6fa578d8b5daa00d9a862b33cb41536df087d3e66a",
    "parts": [
      {
        "label": {
          "$text": "dialogue.c42687f9217f",
          "params": {}
        }
      }
    ]
  },
  "9430/@main/0": {
    "sourceHash": "f3b26277bffa4aea22d39e9c6be284db4d47393ebd37396ca33e8592f8f78276",
    "parts": [
      {
        "label": {
          "$text": "dialogue.f3b26277bffa",
          "params": {}
        }
      }
    ]
  },
  "9430/@main/1": {
    "sourceHash": "9e589b2072d837ae44982fa9082f5ef8e6cb1412cbe9f7fcc93dc37cb9c66277",
    "parts": [
      {
        "label": {
          "$text": "dialogue.b55e53cfa123",
          "params": {}
        },
        "action": "@challengestart"
      }
    ]
  },
  "9430/@main/2": {
    "sourceHash": "eedcb8769d3379b3f8414f24ef52ef658c3cabbab1c44f0659d20cd121eb454b",
    "parts": [
      {
        "label": {
          "$text": "dialogue.853141529a9f",
          "params": {}
        },
        "action": "@challengeleave"
      }
    ]
  },
  "9431/@main/0": {
    "sourceHash": "f3b26277bffa4aea22d39e9c6be284db4d47393ebd37396ca33e8592f8f78276",
    "parts": [
      {
        "label": {
          "$text": "dialogue.f3b26277bffa",
          "params": {}
        }
      }
    ]
  },
  "9431/@main/1": {
    "sourceHash": "9e589b2072d837ae44982fa9082f5ef8e6cb1412cbe9f7fcc93dc37cb9c66277",
    "parts": [
      {
        "label": {
          "$text": "dialogue.b55e53cfa123",
          "params": {}
        },
        "action": "@challengestart"
      }
    ]
  },
  "9431/@main/2": {
    "sourceHash": "eedcb8769d3379b3f8414f24ef52ef658c3cabbab1c44f0659d20cd121eb454b",
    "parts": [
      {
        "label": {
          "$text": "dialogue.853141529a9f",
          "params": {}
        },
        "action": "@challengeleave"
      }
    ]
  },
  "9432/@main/0": {
    "sourceHash": "f3b26277bffa4aea22d39e9c6be284db4d47393ebd37396ca33e8592f8f78276",
    "parts": [
      {
        "label": {
          "$text": "dialogue.f3b26277bffa",
          "params": {}
        }
      }
    ]
  },
  "9432/@main/1": {
    "sourceHash": "9e589b2072d837ae44982fa9082f5ef8e6cb1412cbe9f7fcc93dc37cb9c66277",
    "parts": [
      {
        "label": {
          "$text": "dialogue.b55e53cfa123",
          "params": {}
        },
        "action": "@challengestart"
      }
    ]
  },
  "9432/@main/2": {
    "sourceHash": "eedcb8769d3379b3f8414f24ef52ef658c3cabbab1c44f0659d20cd121eb454b",
    "parts": [
      {
        "label": {
          "$text": "dialogue.853141529a9f",
          "params": {}
        },
        "action": "@challengeleave"
      }
    ]
  },
  "9433/@main/0": {
    "sourceHash": "148dad4a49e45e15e18012c6c8057794a4f3769357e45a6b0a082f98d8798097",
    "parts": [
      {
        "label": {
          "$text": "dialogue.148dad4a49e4",
          "params": {}
        }
      }
    ]
  },
  "9433/@main/1": {
    "sourceHash": "9e589b2072d837ae44982fa9082f5ef8e6cb1412cbe9f7fcc93dc37cb9c66277",
    "parts": [
      {
        "label": {
          "$text": "dialogue.b55e53cfa123",
          "params": {}
        },
        "action": "@challengestart"
      }
    ]
  },
  "9433/@main/2": {
    "sourceHash": "eedcb8769d3379b3f8414f24ef52ef658c3cabbab1c44f0659d20cd121eb454b",
    "parts": [
      {
        "label": {
          "$text": "dialogue.853141529a9f",
          "params": {}
        },
        "action": "@challengeleave"
      }
    ]
  },
  "9434/@main/0": {
    "sourceHash": "148dad4a49e45e15e18012c6c8057794a4f3769357e45a6b0a082f98d8798097",
    "parts": [
      {
        "label": {
          "$text": "dialogue.148dad4a49e4",
          "params": {}
        }
      }
    ]
  },
  "9434/@main/1": {
    "sourceHash": "9e589b2072d837ae44982fa9082f5ef8e6cb1412cbe9f7fcc93dc37cb9c66277",
    "parts": [
      {
        "label": {
          "$text": "dialogue.b55e53cfa123",
          "params": {}
        },
        "action": "@challengestart"
      }
    ]
  },
  "9434/@main/2": {
    "sourceHash": "eedcb8769d3379b3f8414f24ef52ef658c3cabbab1c44f0659d20cd121eb454b",
    "parts": [
      {
        "label": {
          "$text": "dialogue.853141529a9f",
          "params": {}
        },
        "action": "@challengeleave"
      }
    ]
  },
  "9435/@main/0": {
    "sourceHash": "570bd0b3bde38f09f96a03b53fade6343646c7a960dd44ab5ca68833ce7fc76a",
    "parts": [
      {
        "label": {
          "$text": "dialogue.570bd0b3bde3",
          "params": {}
        }
      }
    ]
  },
  "9435/@main/1": {
    "sourceHash": "9e589b2072d837ae44982fa9082f5ef8e6cb1412cbe9f7fcc93dc37cb9c66277",
    "parts": [
      {
        "label": {
          "$text": "dialogue.b55e53cfa123",
          "params": {}
        },
        "action": "@challengestart"
      }
    ]
  },
  "9435/@main/2": {
    "sourceHash": "eedcb8769d3379b3f8414f24ef52ef658c3cabbab1c44f0659d20cd121eb454b",
    "parts": [
      {
        "label": {
          "$text": "dialogue.853141529a9f",
          "params": {}
        },
        "action": "@challengeleave"
      }
    ]
  },
  "9436/@main/0": {
    "sourceHash": "9ddd318299d5e25756df819193ff89576d12794bd122de4abbf081398dc70685",
    "parts": [
      {
        "label": {
          "$text": "dialogue.9ddd318299d5",
          "params": {}
        }
      }
    ]
  },
  "9436/@main/1": {
    "sourceHash": "9e589b2072d837ae44982fa9082f5ef8e6cb1412cbe9f7fcc93dc37cb9c66277",
    "parts": [
      {
        "label": {
          "$text": "dialogue.b55e53cfa123",
          "params": {}
        },
        "action": "@challengestart"
      }
    ]
  },
  "9436/@main/2": {
    "sourceHash": "eedcb8769d3379b3f8414f24ef52ef658c3cabbab1c44f0659d20cd121eb454b",
    "parts": [
      {
        "label": {
          "$text": "dialogue.853141529a9f",
          "params": {}
        },
        "action": "@challengeleave"
      }
    ]
  },
  "9437/@main/0": {
    "sourceHash": "9ddd318299d5e25756df819193ff89576d12794bd122de4abbf081398dc70685",
    "parts": [
      {
        "label": {
          "$text": "dialogue.9ddd318299d5",
          "params": {}
        }
      }
    ]
  },
  "9437/@main/1": {
    "sourceHash": "9e589b2072d837ae44982fa9082f5ef8e6cb1412cbe9f7fcc93dc37cb9c66277",
    "parts": [
      {
        "label": {
          "$text": "dialogue.b55e53cfa123",
          "params": {}
        },
        "action": "@challengestart"
      }
    ]
  },
  "9437/@main/2": {
    "sourceHash": "eedcb8769d3379b3f8414f24ef52ef658c3cabbab1c44f0659d20cd121eb454b",
    "parts": [
      {
        "label": {
          "$text": "dialogue.853141529a9f",
          "params": {}
        },
        "action": "@challengeleave"
      }
    ]
  },
  "9438/@main/0": {
    "sourceHash": "f3b26277bffa4aea22d39e9c6be284db4d47393ebd37396ca33e8592f8f78276",
    "parts": [
      {
        "label": {
          "$text": "dialogue.f3b26277bffa",
          "params": {}
        }
      }
    ]
  },
  "9438/@main/1": {
    "sourceHash": "9e589b2072d837ae44982fa9082f5ef8e6cb1412cbe9f7fcc93dc37cb9c66277",
    "parts": [
      {
        "label": {
          "$text": "dialogue.b55e53cfa123",
          "params": {}
        },
        "action": "@challengestart"
      }
    ]
  },
  "9438/@main/2": {
    "sourceHash": "eedcb8769d3379b3f8414f24ef52ef658c3cabbab1c44f0659d20cd121eb454b",
    "parts": [
      {
        "label": {
          "$text": "dialogue.853141529a9f",
          "params": {}
        },
        "action": "@challengeleave"
      }
    ]
  },
  "9439/@main/0": {
    "sourceHash": "570bd0b3bde38f09f96a03b53fade6343646c7a960dd44ab5ca68833ce7fc76a",
    "parts": [
      {
        "label": {
          "$text": "dialogue.570bd0b3bde3",
          "params": {}
        }
      }
    ]
  },
  "9439/@main/1": {
    "sourceHash": "9e589b2072d837ae44982fa9082f5ef8e6cb1412cbe9f7fcc93dc37cb9c66277",
    "parts": [
      {
        "label": {
          "$text": "dialogue.b55e53cfa123",
          "params": {}
        },
        "action": "@challengestart"
      }
    ]
  },
  "9439/@main/2": {
    "sourceHash": "eedcb8769d3379b3f8414f24ef52ef658c3cabbab1c44f0659d20cd121eb454b",
    "parts": [
      {
        "label": {
          "$text": "dialogue.853141529a9f",
          "params": {}
        },
        "action": "@challengeleave"
      }
    ]
  },
  "9460/@main/1": {
    "sourceHash": "97d7566d68cc0e575ccc0bb8e6f85083c9db019f39da1cc4c1900bbb77253ae0",
    "parts": [
      {
        "label": {
          "$text": "dialogue.97d7566d68cc",
          "params": {}
        }
      }
    ]
  },
  "9460/@main/2": {
    "sourceHash": "75ef52e8a08542f28e9ee1f5f14d2dc14cc07968c10b7c73ffb58e43eb73b2d6",
    "parts": [
      {
        "label": {
          "$text": "dialogue.b01f8e94272c",
          "params": {}
        },
        "action": "@BuySellNew"
      }
    ]
  },
  "9460/@main/3": {
    "sourceHash": "92101a688b6f6553bd4a72b93473848133c66ec285079fe626e3e6c975b9555f",
    "parts": [
      {
        "label": {
          "$text": "dialogue.60bad305fba2",
          "params": {}
        },
        "action": "@Sell"
      }
    ]
  },
  "9460/@main/4": {
    "sourceHash": "8b0a1b737d2b97ebb7fd04d9ac7327dd6f95e39eac74ca0d88d6fa1919843dea",
    "parts": [
      {
        "label": {
          "$text": "dialogue.2383b468ca90",
          "params": {}
        },
        "action": "@BuyBack"
      }
    ]
  },
  "9460/@main/5": {
    "sourceHash": "4fc38e1fef5651a62abe99bd78dd37d20b47c5f3c090bd04027d6d9b7b53ada4",
    "parts": [
      {
        "label": {
          "$text": "dialogue.3fd47edce45b",
          "params": {}
        },
        "action": "@Exit"
      }
    ]
  },
  "9460/@buysellnew/1": {
    "sourceHash": "8ebecfbd41fdc4943c6b93170cd946cbb7ea88b3f8059a31581fac16e73af072",
    "parts": [
      {
        "label": {
          "$text": "dialogue.8ebecfbd41fd",
          "params": {}
        }
      }
    ]
  },
  "9460/@buysellnew/2": {
    "sourceHash": "26cd8481dd432f7d8ad13299eb69d5f946cabe3f6b670b0d3c0404f7c6741ffb",
    "parts": [
      {
        "label": {
          "$text": "dialogue.572cf45ba436",
          "params": {}
        },
        "action": "@Main"
      }
    ]
  },
  "9460/@sell/1": {
    "sourceHash": "8bf5522987de7217f28b12d08c418e8d811319a9b53bfa818b2077ec583ae354",
    "parts": [
      {
        "label": {
          "$text": "dialogue.8bf5522987de",
          "params": {}
        }
      }
    ]
  },
  "9460/@sell/2": {
    "sourceHash": "26cd8481dd432f7d8ad13299eb69d5f946cabe3f6b670b0d3c0404f7c6741ffb",
    "parts": [
      {
        "label": {
          "$text": "dialogue.572cf45ba436",
          "params": {}
        },
        "action": "@Main"
      }
    ]
  },
  "9460/@buyback/1": {
    "sourceHash": "c38c7d87db3bb47c8bad27d692c99891fd84b17cb6146f44ad54b8f546343a59",
    "parts": [
      {
        "label": {
          "$text": "dialogue.c38c7d87db3b",
          "params": {}
        }
      }
    ]
  },
  "9460/@buyback/2": {
    "sourceHash": "26cd8481dd432f7d8ad13299eb69d5f946cabe3f6b670b0d3c0404f7c6741ffb",
    "parts": [
      {
        "label": {
          "$text": "dialogue.572cf45ba436",
          "params": {}
        },
        "action": "@Main"
      }
    ]
  },
  "9451/@main/0": {
    "sourceHash": "1597cd20eef190a0a4c9515a9b06f3b0b0ebc7bf3c529774d6cc7a3011c66766",
    "parts": [
      {
        "label": {
          "$text": "dialogue.1597cd20eef1",
          "params": {}
        }
      }
    ]
  },
  "9451/@main/1": {
    "sourceHash": "5cd922548d88b4350d76e3dedb59a68b9abdf0126bad1d4da4667f1f1ef5d18f",
    "parts": [
      {
        "label": {
          "$text": "dialogue.e378e8fd4c47",
          "params": {}
        },
        "action": "@triallearn"
      }
    ]
  },
  "9451/@main/2": {
    "sourceHash": "66b58478f01b1c8a0bce4b712471298bc1412a2bcf76a515733ea154ee31515b",
    "parts": [
      {
        "label": {
          "$text": "dialogue.c778d340054b",
          "params": {}
        },
        "action": "@trialenter"
      }
    ]
  },
  "9451/@main/3": {
    "sourceHash": "4dd806a88227440d889a38138815d2be04dddcc97372537a85a6a00951b10203",
    "parts": [
      {
        "label": {
          "$text": "dialogue.89bf9e919175",
          "params": {}
        },
        "action": "@trialnext"
      }
    ]
  },
  "9451/@main/4": {
    "sourceHash": "6d180bb70d39026025ade0d5690ac5e794d4b158362d4301a300055465331802",
    "parts": [
      {
        "label": {
          "$text": "dialogue.a996223fd674",
          "params": {}
        },
        "action": "@trialtitle"
      }
    ]
  },
  "9451/@main/5": {
    "sourceHash": "c3f96f6c1777c755ef751003cc2e66e3de172b4e8f3f13799f1ca2ab2ca6fc95",
    "parts": [
      {
        "label": {
          "$text": "dialogue.9fa196f123d5",
          "params": {}
        },
        "action": "@trialleave"
      }
    ]
  },
  "9452/@main/0": {
    "sourceHash": "1597cd20eef190a0a4c9515a9b06f3b0b0ebc7bf3c529774d6cc7a3011c66766",
    "parts": [
      {
        "label": {
          "$text": "dialogue.1597cd20eef1",
          "params": {}
        }
      }
    ]
  },
  "9452/@main/1": {
    "sourceHash": "5cd922548d88b4350d76e3dedb59a68b9abdf0126bad1d4da4667f1f1ef5d18f",
    "parts": [
      {
        "label": {
          "$text": "dialogue.e378e8fd4c47",
          "params": {}
        },
        "action": "@triallearn"
      }
    ]
  },
  "9452/@main/2": {
    "sourceHash": "66b58478f01b1c8a0bce4b712471298bc1412a2bcf76a515733ea154ee31515b",
    "parts": [
      {
        "label": {
          "$text": "dialogue.c778d340054b",
          "params": {}
        },
        "action": "@trialenter"
      }
    ]
  },
  "9452/@main/3": {
    "sourceHash": "4dd806a88227440d889a38138815d2be04dddcc97372537a85a6a00951b10203",
    "parts": [
      {
        "label": {
          "$text": "dialogue.89bf9e919175",
          "params": {}
        },
        "action": "@trialnext"
      }
    ]
  },
  "9452/@main/4": {
    "sourceHash": "6d180bb70d39026025ade0d5690ac5e794d4b158362d4301a300055465331802",
    "parts": [
      {
        "label": {
          "$text": "dialogue.a996223fd674",
          "params": {}
        },
        "action": "@trialtitle"
      }
    ]
  },
  "9452/@main/5": {
    "sourceHash": "c3f96f6c1777c755ef751003cc2e66e3de172b4e8f3f13799f1ca2ab2ca6fc95",
    "parts": [
      {
        "label": {
          "$text": "dialogue.9fa196f123d5",
          "params": {}
        },
        "action": "@trialleave"
      }
    ]
  },
  "9450/@main/0": {
    "sourceHash": "9219108f8599e530718bca690e25e7c5ad699f23562d32ab00470011040d47b3",
    "parts": [
      {
        "label": {
          "$text": "dialogue.9219108f8599",
          "params": {}
        }
      }
    ]
  },
  "9450/@main/1": {
    "sourceHash": "5ead24df03af2c110efc96395d21cf6f1780631ab99e70d057160a3c05e7005a",
    "parts": [
      {
        "label": {
          "$text": "dialogue.d64a0af2eca2",
          "params": {}
        },
        "action": "@craftlearn"
      }
    ]
  },
  "9450/@main/2": {
    "sourceHash": "90db9e11b14e7c43edabf06abab4786068118c5332d02aa2563d6aee3bb13e70",
    "parts": [
      {
        "label": {
          "$text": "dialogue.ec728d41cb33",
          "params": {}
        },
        "action": "@craftgraduate"
      }
    ]
  },
  "9450/@main/3": {
    "sourceHash": "a4f85c6b8084c29650a2b8a2466746eef3f4d905a8d290fe7d2a0facbac4f91f",
    "parts": [
      {
        "label": {
          "$text": "dialogue.0c72f76d37ac",
          "params": {}
        },
        "action": "@craftopen"
      }
    ]
  },
  "9450/@main/4": {
    "sourceHash": "e5da075c03fc73c69e2b9eef6f6121eefed9b8419b54dd853d174c41f01c5caf",
    "parts": [
      {
        "label": {
          "$text": "dialogue.afc94bd34d17",
          "params": {}
        },
        "action": "@Repair"
      }
    ]
  },
  "9450/@main/5": {
    "sourceHash": "4fc38e1fef5651a62abe99bd78dd37d20b47c5f3c090bd04027d6d9b7b53ada4",
    "parts": [
      {
        "label": {
          "$text": "dialogue.3fd47edce45b",
          "params": {}
        },
        "action": "@Exit"
      }
    ]
  },
  "9450/@repair/1": {
    "sourceHash": "f2d82802be03391b999d3a381c55e1f31ae8891863843ed59c6e92288e0cc1be",
    "parts": [
      {
        "label": {
          "$text": "dialogue.f2d82802be03",
          "params": {}
        }
      }
    ]
  },
  "9450/@repair/2": {
    "sourceHash": "26cd8481dd432f7d8ad13299eb69d5f946cabe3f6b670b0d3c0404f7c6741ffb",
    "parts": [
      {
        "label": {
          "$text": "dialogue.572cf45ba436",
          "params": {}
        },
        "action": "@Main"
      }
    ]
  },
  "9461/@main/1": {
    "sourceHash": "f7c4fc782d0bbe309a5f928ec0e09586cb21b98f7283e6604fd832a639ef799b",
    "parts": [
      {
        "label": {
          "$text": "dialogue.f7c4fc782d0b",
          "params": {}
        }
      }
    ]
  },
  "9461/@main/2": {
    "sourceHash": "081f65a72486886420f7831ab2f33ce0777ae3c84399c01de8f545a660397bdf",
    "parts": [
      {
        "label": {
          "$text": "dialogue.d355cf8ce6f4",
          "params": {}
        },
        "action": "@Storage"
      }
    ]
  },
  "9461/@main/3": {
    "sourceHash": "4fc38e1fef5651a62abe99bd78dd37d20b47c5f3c090bd04027d6d9b7b53ada4",
    "parts": [
      {
        "label": {
          "$text": "dialogue.3fd47edce45b",
          "params": {}
        },
        "action": "@Exit"
      }
    ]
  },
  "9461/@storage/1": {
    "sourceHash": "29d42de3b54db524c12fe27e8bc78bbf5105d4767f4358a26f443f46d5964b20",
    "parts": [
      {
        "label": {
          "$text": "dialogue.29d42de3b54d",
          "params": {}
        }
      }
    ]
  },
  "9461/@storage/2": {
    "sourceHash": "26cd8481dd432f7d8ad13299eb69d5f946cabe3f6b670b0d3c0404f7c6741ffb",
    "parts": [
      {
        "label": {
          "$text": "dialogue.572cf45ba436",
          "params": {}
        },
        "action": "@Main"
      }
    ]
  },
  "9462/@main/1": {
    "sourceHash": "3090308fe372eaee6ef34f3d206e2a6ad66da2a1c6d4835c1c9ec5fd51148217",
    "parts": [
      {
        "label": {
          "$text": "dialogue.3090308fe372",
          "params": {}
        }
      }
    ]
  },
  "9462/@main/2": {
    "sourceHash": "46753cb88716730529ccbb79ca70889db7aaa0696981973104da3ba44671269a",
    "parts": [
      {
        "label": {
          "$text": "dialogue.d4399b894905",
          "params": {}
        },
        "action": "@TravelVillage"
      }
    ]
  },
  "9462/@main/3": {
    "sourceHash": "acf6f6b746bb7f43792c145beaaea986db6a93c0690edf7f00ba5588ef4f9082",
    "parts": [
      {
        "label": {
          "$text": "dialogue.b3f5ef55cd4d",
          "params": {}
        },
        "action": "@TravelTombEntrance"
      }
    ]
  },
  "9462/@main/4": {
    "sourceHash": "dba80639b9289d69d127350b82c28110d93e700483d43ec563404647bdcd44f9",
    "parts": [
      {
        "label": {
          "$text": "dialogue.8c898ebbcc3b",
          "params": {}
        },
        "action": "@TravelMineEntrance"
      }
    ]
  },
  "9462/@main/5": {
    "sourceHash": "47b2997b7fa43f5bd04eeab347f69a4d857935684abd8e8531e329dfd51ed1a9",
    "parts": [
      {
        "label": {
          "$text": "dialogue.ccc49ff0aafb",
          "params": {}
        },
        "action": "@PalaceGuide"
      }
    ]
  },
  "9462/@main/6": {
    "sourceHash": "d2aecc56dd91057492642dcebfd4473b69c5e016b506df70dfb0ba1b823faa06",
    "parts": [
      {
        "label": {
          "$text": "dialogue.b6851c6036f6",
          "params": {}
        },
        "action": "@settlebichon"
      }
    ]
  },
  "9462/@main/7": {
    "sourceHash": "4fc38e1fef5651a62abe99bd78dd37d20b47c5f3c090bd04027d6d9b7b53ada4",
    "parts": [
      {
        "label": {
          "$text": "dialogue.3fd47edce45b",
          "params": {}
        },
        "action": "@Exit"
      }
    ]
  },
  "9462/@traveltombentrance/0": {
    "sourceHash": "ea35f51fbdb11b58fbbaad93e9d3ca447ba8558dd2e0b49f9bf5d4112428af53",
    "parts": [
      {
        "label": "MOVE map021 145 43"
      }
    ]
  },
  "9462/@travelmineentrance/0": {
    "sourceHash": "0faba9df4b397bac58eee96241d6324fad0be6bdab278bf923aa79a37e6bf745",
    "parts": [
      {
        "label": "MOVE map021 662 221"
      }
    ]
  },
  "9462/@travelbichonlord/0": {
    "sourceHash": "0870d04c58d3d2aa8f6f20aeccdd9d64aae59796afd58f5acec0b4440247ac9c",
    "parts": [
      {
        "label": "MOVE map021 341 191"
      }
    ]
  },
  "9462/@travelvillage/0": {
    "sourceHash": "4c71f12f531d33e05164fbb6b92895bb41d7f9f1171ffcd885dc49c5cb652b2b",
    "parts": [
      {
        "label": "MOVE map021 282 612"
      }
    ]
  },
  "9462/@palaceguide/1": {
    "sourceHash": "9df6f9869c43cd9a4dfd9b2b1f9637a1f3da283aa02971e9138a8c3e487ebb0b",
    "parts": [
      {
        "label": {
          "$text": "dialogue.9df6f9869c43",
          "params": {}
        }
      }
    ]
  },
  "9462/@palaceguide/2": {
    "sourceHash": "8341988df813497e9e984aed67be20749755546d1f5457b3dab8c1a1f2637407",
    "parts": [
      {
        "label": {
          "$text": "dialogue.8341988df813",
          "params": {}
        }
      }
    ]
  },
  "9462/@palaceguide/3": {
    "sourceHash": "8fe6da74abcc2ec5f992a807ef2072be6d7e6e8b33b58ece14d14a8ee511782c",
    "parts": [
      {
        "label": {
          "$text": "dialogue.56fa7f8e5a67",
          "params": {}
        },
        "action": "@TravelBichonLord"
      }
    ]
  },
  "9462/@palaceguide/4": {
    "sourceHash": "26cd8481dd432f7d8ad13299eb69d5f946cabe3f6b670b0d3c0404f7c6741ffb",
    "parts": [
      {
        "label": {
          "$text": "dialogue.572cf45ba436",
          "params": {}
        },
        "action": "@Main"
      }
    ]
  }
}
;

// games/darkforged/singleplayer/core/dialogue.ts
function dialogueLine(npc, section, index, username) {
  const binding = dialogue_default[npc + "/" + section + "/" + index];
  if (!binding) throw Error("Missing dialogue binding " + npc + "/" + section + "/" + index);
  return {
    $dialogue: binding.parts.map((part) => ({
      ...part,
      label:
        typeof part.label === "object" && "$text" in part.label
          ? message(part.label.$text, { username })
          : part.label,
    })),
  };
}

// games/darkforged/singleplayer/core/novice-progression.ts
function retireHeavyStrike(r) {
  const old = r.skills.findIndex((s) => s.Spell === "HeavyStrike"),
    next = r.skills.findIndex((s) => s.Spell === "Slaying" && !s.temporary);
  if (next < 0) return false;
  if (r.special) {
    delete r.special.heavyHits;
    delete r.special.heavyHitAt;
  }
  if (old < 0) return false;
  const skill = r.skills[next];
  r.skills = r.skills.filter((s) => s.Spell !== "HeavyStrike" && s !== skill);
  r.skills.splice(Math.min(old, r.skills.length), 0, skill);
  return true;
}
function grantNoviceSkill(g, r) {
  const cfg = g.rules.adaptations.noviceProgression;
  if (!cfg) return false;
  let changed = retireHeavyStrike(r);
  const grants = [];
  if ([cfg.quest, 203, 204].some((q) => r.completedQuests.includes(q)))
    grants.push([cfg.spellByJob[r.job], cfg.firstBookByJob?.[r.job]]);
  if (cfg.secondQuest && r.completedQuests.includes(cfg.secondQuest))
    grants.push([cfg.secondSpellByJob?.[r.job] || "", cfg.secondBookByJob?.[r.job]]);
  for (const [spell, id] of grants) {
    if (!spell || !id || r.noviceBooks?.includes(spell)) continue;
    const known = r.skills.some(
      (s) =>
        (s.Spell === spell || (spell === "HeavyStrike" && s.Spell === "Slaying")) && !s.temporary,
    );
    const held = [...r.inventory, ...r.storage].some((i) => i?.id === id);
    if (!known && !held) {
      if (!g.give(r, starterItem(g.newItem(id), g.rules))) continue;
      g.say(message("skill.starter.bookReceived", { skill: entityText("skills", spell) }));
      changed = true;
    }
    (r.noviceBooks ??= []).push(spell);
  }
  return changed;
}
function noviceHeavyHit(g, r) {
  const cfg = g.rules.adaptations.noviceProgression?.heavyStrike;
  if (!cfg || r.job !== "Warrior" || !g.skill(r, "HeavyStrike") || g.skill(r, "Slaying"))
    return false;
  const s = (r.special ??= {});
  const count =
    g.time - Number(s.heavyHitAt ?? -Infinity) > cfg.resetMs ? 0 : Number(s.heavyHits || 0);
  s.heavyHitAt = g.time;
  s.heavyHits = count + 1;
  if (Number(s.heavyHits) < cfg.hits) return false;
  s.heavyHits = 0;
  return true;
}
function isSpirit(g, a) {
  return a.definition === g.rules.adaptations.noviceProgression?.spiritMonster && a.friendly;
}
function petInheritance(g, a) {
  if (!a.friendly || !a.master || !a.special?.dreamPet || a.special?.dreamTamed) return;
  const def = g.monsters.get(a.definition);
  return g.rules.adaptations.noviceProgression?.petInheritance[
    isSpirit(g, a) ? "SpiritServant" : String(def?.DreamOriginalId)
  ];
}
function applyPetDefence(g, a) {
  const p = petInheritance(g, a),
    owner = g.roles.find((r) => r.id === a.master);
  if (!p || !owner) return;
  const sc = Math.max(0, ((owner.stats.MinSC || 0) + (owner.stats.MaxSC || 0)) / 2);
  for (const k of ["MinAC", "MaxAC"]) a.stats[k] = (a.stats[k] || 0) + Math.floor(sc * p.ac);
  for (const k of ["MinMAC", "MaxMAC"]) a.stats[k] = (a.stats[k] || 0) + Math.floor(sc * p.mac);
  a.stats.HP = (a.stats.HP || 0) + Math.floor(sc * p.hp);
  if (isSpirit(g, a)) {
    a.stats.HP += owner.level * 5;
    a.stats.MinDC += Math.floor(owner.level / 5);
    a.stats.MaxDC += Math.floor(owner.level / 4);
    for (const k of ["MinAC", "MaxAC", "MinMAC", "MaxMAC"])
      a.stats[k] += Math.floor(owner.level / 10);
  }
}
function petAggro(g, source, target) {
  if (target.kind !== "monster" || target.friendly) return false;
  const owner =
    source.friendly && source.master
      ? g.roles.find((r) => r.id === source.master && !r.dead && r.map === target.map)
      : void 0;
  if (owner) {
    target.special ??= {};
    target.special.frontPet = source.id;
    target.special.frontPetUntil = g.time + 2500;
    target.target = source.id;
    return true;
  }
  const pet = g.actor(Number(target.special?.frontPet));
  if (
    source.kind === "player" &&
    pet &&
    !pet.dead &&
    pet.friendly &&
    pet.master === source.id &&
    pet.map === target.map &&
    Number(target.special?.frontPetUntil) > g.time &&
    Math.max(Math.abs(pet.x - target.x), Math.abs(pet.y - target.y)) <= 8
  ) {
    target.target = pet.id;
    return true;
  }
  return false;
}
function spiritGrowth(g, r) {
  const cfg = g.rules.adaptations.noviceProgression.spiritGrowth;
  migrateSpiritProgress(r, cfg);
  const progress = (r.spiritProgress ??= { level: 0, xp: 0, curveVersion: 4 });
  return { cfg, progress };
}
function shareSpiritExperience(g, r, xp, near2 = r) {
  if (r.dead || r.map !== near2.map || xp <= 0 || !Number.isFinite(xp)) return;
  const companions = g
    .map(r.map)
    .actors.filter(
      (a) =>
        isSpirit(g, a) &&
        a.master === r.id &&
        !a.dead &&
        Math.max(Math.abs(a.x - near2.x), Math.abs(a.y - near2.y)) <= 16,
    );
  if (!companions.length) return;
  const { cfg, progress } = spiritGrowth(g, r),
    before = progress.level;
  if (progress.level >= cfg.cap) return;
  progress.xp += Math.trunc(xp);
  while (progress.level < cfg.cap && progress.xp >= spiritNextXP(cfg, progress.level)) {
    progress.xp -= spiritNextXP(cfg, progress.level);
    progress.level++;
  }
  if (progress.level >= cfg.cap) progress.xp = 0;
  for (const pet of companions) {
    pet.special ??= {};
    Object.assign(pet.special, {
      petLevel: progress.level,
      petXP: progress.xp,
      maxPetLevel: cfg.cap,
    });
    if (progress.level !== before) {
      g.refreshActor(pet);
      g.emit("SpiritLevelUp", { ObjectID: pet.id, Level: progress.level });
    }
  }
  if (progress.level !== before) g.say(message("skill.spirit.levelUp", { level: progress.level }));
}
var PET_RECOVERY_INTERVAL = 5e3;
var PET_COMBAT_GRACE = 1e4;
function isOwnedCompanion(a) {
  return a.kind === "monster" && a.friendly && !!a.master && !!a.special?.dreamPet;
}
function noteCompanionCombat(a, time) {
  if (isOwnedCompanion(a) && !a.dead) a.special.petCombatAt = time;
}
function recoverCompanion(g, a) {
  if (!isOwnedCompanion(a) || a.dead || a.hp >= a.maxHP) return;
  const p = a.special;
  const due = p.petRegenAt ?? p.spiritRegenAt ?? p.tamedRegenAt;
  if (due === void 0) {
    p.petRegenAt = g.time + PET_RECOVERY_INTERVAL;
    return;
  }
  if (g.time < Number(due)) return;
  p.petRegenAt = g.time + PET_RECOVERY_INTERVAL;
  const fighting = g.time - Number(p.petCombatAt ?? -Infinity) < PET_COMBAT_GRACE;
  const healed = Math.min(
    a.maxHP - a.hp,
    Math.max(1, Math.floor(a.maxHP * (fighting ? 0.01 : 0.03))),
  );
  a.hp += healed;
  g.emit("DamageIndicator", { ObjectID: a.id, Type: "Heal", Damage: healed });
}
function shareCompanionExperience(g, r, enemy2, xp) {
  if (r.job !== "Taoist" && r.job !== "Wizard") return;
  if (!Number.isFinite(xp) || xp <= 0) return;
  for (const pet of g.map(r.map).actors) {
    if (
      !isOwnedCompanion(pet) ||
      pet.master !== r.id ||
      pet.map !== enemy2.map ||
      pet.dead ||
      isSpirit(g, pet) ||
      !!pet.special?.dreamTamed !== (r.job === "Wizard") ||
      Math.max(Math.abs(pet.x - enemy2.x), Math.abs(pet.y - enemy2.y)) > 16
    )
      continue;
    const p = pet.special,
      level = Number(p.petLevel || 0),
      cap = Number(p.maxPetLevel || 0);
    if (level >= cap) continue;
    p.petXP = Number(p.petXP || 0) + xp;
    while (
      Number(p.petLevel || 0) < cap &&
      Number(p.petXP) >= 100
    ) {
      p.petXP = Number(p.petXP) - 100;
      p.petLevel = Number(p.petLevel || 0) + 1;
    }
    if (p.petLevel !== level) g.refreshActor(pet);
  }
}

// games/darkforged/singleplayer/core/affix-progression.ts
function effectiveAffixGrade(def) {
  return Number(def.AffixGenerationGrade ?? def.DreamGrade) || 0;
}
function auxiliaryAffixSlot(def) {
  return (
    (def.Type === "Bracelet" && def.DreamType === 4) ||
    (def.Type === "Stone" && [6, 16].includes(Number(def.DreamType))) ||
    (def.Type === "Talisman" && def.AffixPoolType === 6) ||
    (def.Type === "Amulet" && def.DreamType === 17 && def.AffixPoolType === 6)
  );
}
function supportsWearableJob(def, job) {
  const required = def.RequiredClass;
  return (
    required === "None" ||
    required === "WarWizTao" ||
    required === job ||
    required.split(", ").includes(job) ||
    required.includes({ Warrior: "War", Wizard: "Wiz", Taoist: "Tao" }[job])
  );
}
var protectedAffixTypes = /* @__PURE__ */ new Set([19, 1001, 43]);
function rareReplacementIndex(item, table) {
  const rows = item.affixes || [],
    prefixes = rows.filter((a) => table[a.group]?.Prefix).length;
  const prefix = rows.findIndex((a) => table[a.group]?.Prefix && !protectedAffixTypes.has(a.type));
  if (prefix >= 0) return prefix;
  return prefixes < 3
    ? rows.findIndex((a) => !table[a.group]?.Prefix && !protectedAffixTypes.has(a.type))
    : -1;
}
function rareChannelTargets(def) {
  if (
    effectiveAffixGrade(def) < 5 ||
    effectiveAffixGrade(def) > 7 ||
    def.AffixChannelsEnabled !== true
  )
    return { speed: 0, luck: 0 };
  return auxiliaryAffixSlot(def)
    ? { speed: 0.1, luck: 0.05 }
    : def.Type === "Ring" && def.DreamType === 5
      ? { speed: 0, luck: 0.05 }
      : { speed: 0, luck: 0 };
}
var generationContexts = /* @__PURE__ */ new WeakMap();
function markNaturalAffixGeneration(item, magicFind) {
  generationContexts.set(item, { magicFind });
}
function markAffixPointDistribution(item, pointWeights) {
  generationContexts.set(item, { pointWeights });
}
function takeNaturalAffixGeneration(item) {
  const value = generationContexts.get(item);
  generationContexts.delete(item);
  return value;
}
function applyRareChannel(item, def, rng, table, effectiveQ) {
  const targets = rareChannelTargets(def),
    index = rareReplacementIndex(item, table);
  if (index < 0 || !(targets.speed + targets.luck)) return;
  if (effectiveQ + 1e-10 < targets.speed + targets.luck)
    throw new Error(
      `Affix channel capacity ${def.Index}: q=${effectiveQ} < ${targets.speed + targets.luck}`,
    );
  const speed = Math.round((1e4 * targets.speed) / effectiveQ),
    luck = Math.round((1e4 * targets.luck) / effectiveQ),
    ticket = rng.next(1e4);
  let id = 0;
  if (ticket < speed) {
    const dc = def.Stats.MaxDC || 0,
      mc = def.Stats.MaxMC || 0,
      sc = def.Stats.MaxSC || 0;
    const warrior = def.RequiredClass === "Warrior" || dc > Math.max(mc, sc),
      caster = ["Wizard", "Taoist"].includes(def.RequiredClass) || Math.max(mc, sc) > dc;
    id =
      def.AffixSpeedKind === "attack"
        ? 1030
        : def.AffixSpeedKind === "cast"
          ? 1031
          : warrior
            ? 1030
            : caster
              ? 1031
              : rng.next(2) === 0
                ? 1030
                : 1031;
  } else if (ticket < speed + luck) id = 1032;
  if (!id) return;
  const group = table[id];
  if (!group) throw new Error(`Missing controlled affix ${id}`);
  const row = group.Affixes["1"];
  if (
    item.affixes.some((a) => a.type === group.Type || (id !== 1032 && [19, 1001].includes(a.type)))
  )
    return;
  item.affixes[index] = {
    group: id,
    tier: "1",
    name: row.Name,
    type: group.Type,
    low: 1,
    high: 1,
    rate: 100,
    duration: 0,
    revealed: true,
    text: group.Format.replaceAll("{val}", "1"),
  };
}

// games/darkforged/singleplayer/core/affixes.ts
var spells = [
  "IceStorm",
  "FrostCrunch",
  "IceFlame",
  "FlamingSword",
  "BlazingSword",
  "FireBall",
  "GreatFireBall",
  "FireBang",
  "FireWall",
  "FlameDisruptor",
  "MeteorStrike",
  "DragonFlame",
  "ThunderBolt",
  "Poisoning",
  "PoisonCloud",
  "ThunderStorm",
  "SoulFireBall",
];
var stats = {
  12: "ElementLevel:4",
  15: "ElementLevel:5",
  18: "ElementLevel:1",
  17: "ElementLevel:3",
  16: "ElementLevel:2",
  19: "AttackSpeed",
  40: "MagicFind",
  43: "Luck",
  44: "DreamCritPercent",
  45: "DreamCritDamagePercent",
  63: "NativeKillXPPercent",
  64: "MagicDodgePercent",
  65: "PoisonDodgePercent",
  66: "PoisonRecoveryPercent",
  67: "StoneDodgePercent",
  68: "StoneRecoveryPercent",
  69: "FreezeDodgePercent",
  70: "FreezeRecoveryPercent",
  71: "HP",
  72: "PetLevel:AdvancedSummon",
  73: "PetLevel:SummonTiger",
  74: "PetLevel:SummonMoonSpirit",
  75: "HPRecoveryPercent",
  76: "MPRecoveryPercent",
  77: "NoFlinchPercent",
  78: "Light",
  82: "PetCritPercent",
  83: "PetCritDamagePercent",
};
for (let n = 0; n < spells.length; n++) {
  stats[23 + n] = "SkillLevel:" + spells[n];
  stats[46 + n] = "SkillDamage:" + spells[n];
}
function affixStats(item, job) {
  const out = {};
  for (const a of item.affixes || []) {
    if (!a.revealed || (job && classAffixJobs[a.group] && classAffixJobs[a.group] !== job))
      continue;
    if (a.type === 1009) {
      for (const key2 of ["StoneRecoveryPercent", "FreezeRecoveryPercent"])
        out[key2] = (out[key2] || 0) + a.low;
      continue;
    }
    const key = stats[a.type];
    if (key && !key.startsWith("SkillDamage:")) out[key] = (out[key] || 0) + a.low;
  }
  return out;
}
stats[1033] = "SkillLevel:Hydra";
stats[1001] = "CastSpeed";
stats[1002] = "KillXP";
Object.assign(stats, {
  1003: "NativeMoveSpeed",
  1004: "DreamCritPercent",
  1005: "DreamCritDamagePercent",
  1006: "HPRatePercent",
  1007: "NativePhysicalAbsorbPercent",
  1008: "NativeMagicAbsorbPercent",
  1010: "AffixDamagePercent",
});
var classAffixJobs = {
  1020: "Warrior",
  1021: "Warrior",
  1022: "Warrior",
  1023: "Wizard",
  1024: "Wizard",
  1025: "Wizard",
  1026: "Taoist",
  1027: "Taoist",
  1028: "Warrior",
  1029: "Warrior",
};
Object.assign(stats, {
  1020: "AffixLifeOnHit",
  1021: "AffixLifeDrainPercent",
  1023: "AffixManaOnHit",
  1024: "AffixManaDrainPercent",
  1026: "AffixPoisonDamage",
  1027: "AffixSummonDamage",
});
var h5AffixTypes = /* @__PURE__ */ new Set([
  1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009, 1010, 1020, 1021, 1022, 1023, 1024, 1025,
  1026, 1027, 1028, 1029, 1030, 1031, 1032, 1033,
]);
function equipmentSupportsAffixJob(def, job) {
  if (["Warrior", "Wizard", "Taoist"].includes(def.RequiredClass)) return def.RequiredClass === job;
  const dc = def.Stats.MaxDC || 0,
    mc = def.Stats.MaxMC || 0,
    sc = def.Stats.MaxSC || 0;
  if (dc === mc && mc === sc) return true;
  if (Number(def.DreamType) === 9) {
    if (mc || sc) return job === "Wizard" ? mc >= sc : job === "Taoist" && sc >= mc;
    return job === "Warrior";
  }
  return job === "Warrior"
    ? dc >= Math.max(mc, sc)
    : job === "Wizard"
      ? mc >= Math.max(dc, sc)
      : sc >= Math.max(dc, mc);
}
function migrateItemAffixes(item, def, table) {
  for (const affix of item.affixes || []) {
    affix.revealed = true;
    const group = table?.[String(affix.group)],
      old = group?.LegacyRanges?.[affix.tier],
      row = group?.Affixes[affix.tier];
    if (
      group &&
      old &&
      row &&
      affix.type === group.Type &&
      affix.low === old.low &&
      affix.high === old.high
    ) {
      affix.low = row.LowValue;
      affix.high = row.HighValue;
      affix.text = group.Format.replaceAll("{val}", String(affix.low))
        .replaceAll("{vallow}", String(affix.low))
        .replaceAll("{valhigh}", String(affix.high))
        .replaceAll("{dura}", String(affix.duration))
        .replaceAll("%%", "%");
    }
  }
  if (item.specialVersion === 1 || def.DreamOriginalId === void 0) return;
  for (const [key, group, type, text] of [
    ["KillXP", 1002, 1002, "\u51FB\u6740\u989D\u5916\u7ECF\u9A8C"],
    ["MagicFind", 32, 40, "\u6781\u54C1\u6389\u843D"],
  ]) {
    const value = item.added[key];
    if (!(value > 0)) continue;
    item.affixes ??= [];
    item.affixes.push({
      group,
      tier: "legacy",
      name: "\u4F20\u627F",
      type,
      low: value,
      high: value,
      rate: 100,
      duration: 0,
      revealed: true,
      text: text + " +" + value,
    });
    delete item.added[key];
  }
  item.specialVersion = 1;
}
function weighted(pool, rng) {
  let n = rng.next(pool.reduce((v, a) => v + a.Weight, 0));
  for (const a of pool) {
    if (n < a.Weight) return a;
    n -= a.Weight;
  }
  return pool[pool.length - 1];
}
function eligibleAffixTiers(group, grade) {
  const choices = Object.entries(group.Affixes)
    .filter(([, a]) => a.Grade <= grade && a.Weight > 0)
    .map(([tier, a]) => ({ ...a, tier }));
  if (group.Progressive) {
    const highest2 = Math.max(0, ...choices.map((a) => a.Grade));
    return choices.filter((a) => a.Grade === highest2);
  }
  if (grade < 5) return choices;
  const highest = Math.max(0, ...choices.map((a) => a.Grade));
  const floor = Math.min(highest, Math.max(grade - 2, highest - 1));
  return choices.filter((a) => a.Grade >= floor);
}
function affixCandidates(def, table) {
  const grade = effectiveAffixGrade(def),
    exclusiveWarrior =
      equipmentSupportsAffixJob(def, "Warrior") &&
      !equipmentSupportsAffixJob(def, "Wizard") &&
      !equipmentSupportsAffixJob(def, "Taoist");
  return Object.values(table)
    .filter(
      (a) =>
        !a.ControlledChannel &&
        a.Weight > 0 &&
        (!a.AuxiliaryOnly || auxiliaryAffixSlot(def)) &&
        (!a.WearableJob || supportsWearableJob(def, a.WearableJob)) &&
        (!a.EquipmentJob || equipmentSupportsAffixJob(def, a.EquipmentJob)) &&
        (!a.ExcludeEquipmentJob || !equipmentSupportsAffixJob(def, a.ExcludeEquipmentJob)) &&
        (a.MaxRequiredLevel === void 0 ||
          (def.RequiredType === "Level" && def.RequiredAmount <= a.MaxRequiredLevel)) &&
        !a.ExcludedNames?.includes(String(def.DreamName || def.Name)) &&
        Object.values(a.Poses).includes(Number(def.AffixPoolType ?? def.DreamType)) &&
        Object.values(a.Affixes).some((v) => v.Weight > 0 && v.Grade <= grade),
    )
    .map((a) => {
      const override = !a.GradeOverridesExclusiveWarrior || exclusiveWarrior;
      return {
        ...a,
        Weight: override ? (a.WeightByEquipmentGrade?.[grade] ?? a.Weight) : a.Weight,
        RollChancePercent: override
          ? (a.RollChanceByEquipmentGrade?.[grade] ?? a.RollChancePercent)
          : a.RollChancePercent,
      };
    });
}
function rareReplaceableProbability(def, table, count) {
  if (count <= 0) return 0;
  const candidates = affixCandidates(def, table),
    prefixes = candidates.filter((a) => a.Prefix);
  if (!candidates.some((a) => !a.Prefix && (a.RollChancePercent ?? 100) === 100))
    throw new Error(`No guaranteed suffix in affix pool ${def.Index}`);
  let allProtected = 0;
  const draw = (pool, remaining) => {
    if (!remaining) return 1;
    if (
      !pool.length ||
      remaining >
        new Set(pool.filter((a) => protectedAffixTypes.has(a.Type)).map((a) => a.Type)).size
    )
      return 0;
    const total = pool.reduce((n, a) => n + a.Weight, 0);
    return pool
      .filter((a) => protectedAffixTypes.has(a.Type))
      .reduce(
        (n, a) =>
          n +
          ((0.5 * a.Weight) / total) *
            draw(
              pool.filter((b) => b.Type !== a.Type),
              remaining - 1,
            ),
        0,
      );
  };
  const enumerate = (index, pool, probability) => {
    if (index === prefixes.length) {
      allProtected += probability * draw(pool, Math.min(6, count));
      return;
    }
    const a = prefixes[index],
      chance = (a.RollChancePercent ?? 100) / 100;
    if (chance > 0) enumerate(index + 1, [...pool, a], probability * chance);
    if (chance < 1) enumerate(index + 1, pool, probability * (1 - chance));
  };
  enumerate(0, [], 1);
  return 1 - allProtected;
}
function rollAffixes(item, def, rng, table, count, rareQ) {
  const grade = effectiveAffixGrade(def);
  if (!(grade > 0) || count <= 0) return;
  const groups = affixCandidates(def, table).filter(
    (a) => a.RollChancePercent === void 0 || rng.next(100) < a.RollChancePercent,
  );
  item.affixes = [];
  const sides = { prefix: 0, suffix: 0 };
  const limit = Math.min(6, count);
  for (let n = 0; n < limit && groups.length; n++) {
    let prefix = sides.prefix >= 3 ? false : sides.suffix >= 3 ? true : rng.next(2) !== 0;
    if (sides[prefix ? "prefix" : "suffix"] >= 3) break;
    let available = groups.filter((a2) => a2.Prefix === prefix);
    if (!available.length) {
      prefix = !prefix;
      if (sides[prefix ? "prefix" : "suffix"] >= 3) break;
      available = groups.filter((a2) => a2.Prefix === prefix);
    }
    if (!available.length) break;
    const group = weighted(available, rng),
      choices = eligibleAffixTiers(group, grade);
    if (!choices.length) break;
    const a = weighted(choices, rng);
    sides[group.Prefix ? "prefix" : "suffix"]++;
    const low2 = group.Range
        ? a.LowValue
        : rng.next(
            a.HighValue + 1,
            grade >= 5 ? Math.ceil((a.LowValue + a.HighValue) / 2) : a.LowValue,
          ),
      high2 = group.Range ? a.HighValue : low2;
    item.affixes.push({
      group: group.ID,
      tier: a.tier,
      name: a.Name,
      type: group.Type,
      low: low2,
      high: high2,
      rate: group.Rate,
      duration: a.Dura,
      revealed: true,
      text: group.Format.replaceAll("{val}", String(low2))
        .replaceAll("{vallow}", String(low2))
        .replaceAll("{valhigh}", String(high2))
        .replaceAll("{dura}", String(a.Dura))
        .replaceAll("%%", "%"),
    });
    for (let i = groups.length - 1; i >= 0; i--)
      if (groups[i].Type === group.Type) groups.splice(i, 1);
  }
  if (
    def.AffixChannelsEnabled === true &&
    (rareQ !== void 0 || Object.values(table).some((a) => a.ControlledChannel))
  ) {
    for (const id of [1030, 1031, 1032])
      if (!table[id]?.ControlledChannel) throw new Error(`Missing controlled affix ${id}`);
    applyRareChannel(item, def, rng, table, rareQ ?? rareReplaceableProbability(def, table, count));
  }
}
function equippedAffixes(r) {
  return r.equipment.flatMap((i) =>
    i && (!i.maxDura || i.currentDura > 0) ? (i.affixes || []).filter((a) => a.revealed) : [],
  );
}
function affixRoll(g, a) {
  return g.rng.next(a.high + 1, a.low);
}
function affixDefence(r) {
  const rows = equippedAffixes(r).filter((a) => a.type === 11);
  r.stats.NativeDefencePercentLow = rows.reduce((n, a) => n + a.low, 0);
  r.stats.NativeDefencePercentHigh = rows.reduce((n, a) => n + a.high, 0);
}
function affixRangeExtra(g, r, type) {
  return equippedAffixes(r)
    .filter((a) => a.type === type)
    .reduce((n, a) => n + affixRoll(g, a) - a.low, 0);
}
function affixOutgoing(g, source, target, raw, spell, defence) {
  if (defence === "None") return raw;
  const owner =
    source.kind === "player"
      ? source
      : source.friendly
        ? g.roles.find((r) => r.id === source.master)
        : void 0;
  if (!owner) return raw;
  if (source.kind !== "player") {
    if (g.rng.next(100) < (owner.stats.PetCritPercent || 0))
      raw *= 1.25 + (owner.stats.PetCritDamagePercent || 0) / 100;
    if (owner.job === "Taoist" && source.special?.dreamPet && !source.special?.dreamTamed)
      raw += Math.max(0, owner.stats.AffixSummonDamage || 0);
    return Math.floor(raw);
  }
  const d = g.rules.skills.find((d2) => d2.Spell === spell),
    physical = defence.startsWith("AC");
  for (const a of equippedAffixes(owner)) {
    if (a.type >= 46 && a.type <= 62 && spells[a.type - 46] === spell) {
      raw *= 1 + affixRoll(g, a) / 100;
      continue;
    }
    if (
      ![10, 41, 42, 81, 85].includes(a.type) ||
      ([81, 85].includes(a.type) && g.rng.next(100) >= a.rate)
    )
      continue;
    if (
      (a.type === 10 && !physical) ||
      (a.type === 41 && (physical || (d?.DreamOriginalId || 0) >= 56)) ||
      (a.type === 42 && (physical || (d?.DreamOriginalId || 0) < 56)) ||
      (a.type === 85 && !target.buffs.some((b) => b.type === "Slow" || b.type === "Frozen"))
    )
      continue;
    if (a.type === 81) raw += affixRoll(g, a);
    else raw *= 1 + affixRoll(g, a) / 100;
  }
  return Math.floor(
    (raw *
      (100 + (owner.stats.QualitySetDamagePercent || 0) + (owner.stats.AffixDamagePercent || 0))) /
      100,
  );
}


function affixIncoming(g, r, amount, defence) {
  for (const a of equippedAffixes(r))
    if (
      ((a.type === 79 && defence.startsWith("AC")) ||
        (a.type === 80 && defence.startsWith("MAC"))) &&
      g.rng.next(100) < a.rate
    )
      amount = Math.floor(amount * (1 - affixRoll(g, a) / 100));
  return amount;
}
function affixAfterHit(g, source, target, amount, defence, spell) {
  if (defence === "None" || amount <= 0) return;
  if (target.kind === "player") {
    const r2 = target;
    for (const a of equippedAffixes(r2))
      if (a.type === 13)
        r2.mp = Math.min(r2.maxMP, r2.mp + Math.floor((amount * affixRoll(g, a)) / 100));
  }
  if (source.kind !== "player") return;
  const r = source;
  if (
    defence.startsWith("AC") &&
    !target.dead &&
    r.stats.NativeParalysisPercent &&
    g.rng.next(100) < r.stats.NativeParalysisPercent
  )
    g.buff(target, "Paralysis", 2e3, 0, {}, r.id);
  for (const a of equippedAffixes(r)) {
    if (
      ![9, 20, 84].includes(a.type) ||
      (a.type === 20 && g.rules.adaptations.dreamRuntime) ||
      g.rng.next(100) >= a.rate
    )
      continue;
    if (a.type === 20 && defence.startsWith("AC"))
      r.hp = Math.min(r.maxHP, r.hp + Math.floor((amount * affixRoll(g, a)) / 100));
    if (a.type === 9 && defence.startsWith("AC") && !target.dead) {
      g.buff(target, "Green", a.duration * 1e3, affixRoll(g, a), {}, r.id);
      g.buff(target, "Red", a.duration * 1e3, 0, {}, r.id);
    }
    if (a.type === 84 && spell === "FlameDisruptor" && !target.dead)
      g.buff(
        target,
        "NativeBurn",
        a.duration * 1e3,
        Math.floor((amount * affixRoll(g, a)) / 100),
        {},
        r.id,
      );
  }
}
var manaRecoveryWindows = /* @__PURE__ */ new WeakMap();
function recoverManaBudget(g, r, amount) {
  let window = manaRecoveryWindows.get(r);
  if (!window || g.time < window.at || g.time - window.at >= 600) {
    window = { at: g.time, used: 0 };
    manaRecoveryWindows.set(r, window);
  }
  const actual = Math.max(
    0,
    Math.min(Math.floor(amount), 8 + Math.floor(r.maxMP * 0.02) - window.used, r.maxMP - r.mp),
  );
  window.used += actual;
  return actual;
}
function nativeLifeSteal(g, source, target, damage, defence) {
  if (
    !g.rules.adaptations.dreamRuntime ||
    source.kind !== "player" ||
    source.dead ||
    target.kind !== "monster" ||
    target.friendly ||
    defence === "None" ||
    damage <= 0
  )
    return;
  const r = source;
  let rate =
    (r.stats.NativeLifeDrainPercent || 0) +
    (r.stats.HPDrainRatePercent || 0) +
    equippedAffixes(r)
      .filter((a) => a.type === 20)
      .reduce((n, a) => n + affixRoll(g, a), 0);
  if (r.job !== "Warrior") rate = Math.min(12, rate);
  if (distance(source, target) > 1) rate = Math.trunc(rate / 2);
  else {
    const step2 = vectors[source.dir];
    if (!step2 || target.x !== source.x + step2[0] || target.y !== source.y + step2[1]) rate = 0;
  }
  const physicalWarrior = r.job === "Warrior" && defence.startsWith("AC");
  const flat = physicalWarrior ? Math.max(0, r.stats.AffixLifeOnHit || 0) : 0;
  const extraRate = physicalWarrior ? Math.max(0, r.stats.AffixLifeDrainPercent || 0) : 0;
  const heal = flat + Math.floor((damage * Math.max(0, rate + extraRate)) / 100);
  r.hp = Math.min(r.maxHP, r.hp + heal);
}
function affixManaOnHit(g, source, target, damage, defence) {
  if (
    !g.rules.adaptations.dreamRuntime ||
    source.kind !== "player" ||
    source.dead ||
    target.kind !== "monster" ||
    target.friendly ||
    defence === "None" ||
    damage <= 0
  )
    return;
  const r = source;
  if (r.job !== "Wizard") return;
  const flat = Math.min(8, r.stats.AffixManaOnHit || 0),
    rate = Math.min(4, r.stats.AffixManaDrainPercent || 0);
  r.mp += recoverManaBudget(g, r, Math.min(damage, flat + Math.floor((damage * rate) / 100)));
}
function affixKill(g, r) {
  for (const a of equippedAffixes(r))
    if (a.type === 14) r.mp = Math.min(r.maxMP, r.mp + affixRoll(g, a));
}
function potentialStats(item, def) {
  const out = {};
  for (const [k, v] of Object.entries(item.potential?.stats || {})) {
    if (k === "\u653B\u51FB\u589E\u5F3A")
      for (const s of ["MinDC", "MaxDC", "MinMC", "MaxMC", "MinSC", "MaxSC"])
        out[s] = Math.floor(((def.Stats[s] || 0) * v) / 100);
    else if (k === "\u9632\u5FA1\u589E\u5F3A")
      for (const s of ["MinAC", "MaxAC", "MinMAC", "MaxMAC"])
        out[s] = Math.floor(((def.Stats[s] || 0) * v) / 100);
    else {
      const key = {
        "\u66B4\u51FB\u6982\u7387": "DreamCritPercent",
        "\u66B4\u51FB\u4E0A\u9650": "DreamCritDamagePercent",
        "\u5438\u6536\u751F\u547D": "HPDrainRatePercent",
        "\u653B\u51FB\u901F\u5EA6": "AttackSpeed",
        "\u9632\u540E\u4EF0": "NoFlinchPercent",
        "\u9EBB\u75F9\u6982\u7387": "NativeParalysisPercent",
        "\u4E2D\u6BD2\u6062\u590D": "PoisonRecoveryPercent",
        "\u77F3\u5316\u6062\u590D": "StoneRecoveryPercent",
      };
      if (key[k]) out[key[k]] = (out[key[k]] || 0) + v;
    }
  }
  return out;
}

// games/darkforged/singleplayer/core/native-ability.ts
function nativeAbility(g, a, kind) {
  const value = attackPower(a.stats, kind, g.rng);
  if (
    a.kind !== "player" ||
    !g.rules.adaptations.dreamRuntime ||
    !["DC", "MC", "SC"].includes(kind)
  )
    return value;
  const s = a.stats,
    r = a;
  const chance =
    (s.CriticalRate || 0) * g.rules.constants.CriticalRateWeight +
    (s.GemCriticalRatePercent || 0) +
    (s.DreamCritPercent || 0) +
    (s.NativeCriticalPoints || 0) +
    affixRangeExtra(g, r, 44);
  if (chance <= 0 || g.rng.next(100) >= Math.min(100, chance)) return value;
  const extra = Math.min(
    2,
    Math.max(0, ((s.DreamCritDamagePercent || 0) + affixRangeExtra(g, r, 45)) / 100),
  );
  const factor = Math.max(
    Math.fround(Math.fround(1.2) + Math.fround(extra)),
    s.GemCriticalRatePercent ? 1.5 : 0,
  );
  return Math.trunc(Math.fround(value * factor));
}

// games/darkforged/singleplayer/core/boss-loot.ts
function hasBossLootBudget(monster, rules) {
  return monster.IsBoss || rules.adaptations.bossLoot.monsters.includes(monster.Name);
}
function hasUnrestrictedNativeLoot(monster, rules) {
  const profile = rules.adaptations.bossBehaviors?.entries[String(monster.Index)];
  return (
    hasBossLootBudget(monster, rules) ||
    (!!profile && !profile.helper) ||
    monster.GuideRank === "elite" ||
    ["elite", "swift", "captain"].includes(String(monster.AdventureKind)) ||
    isChallengeChest(monster, rules)
  );
}
function isChallengeChest(monster, rules) {
  return !!rules.adaptations.guideChallenges?.some((c) => c.chest === monster?.Name);
}
function selectBossLoot(items, defs, rules, rng) {
  const limits = rules.adaptations.bossLoot;
  const grades = ["Common", "Rare", "Legendary", "Mythical", "Heroic"];
  const pools = { equipment: [], books: [], potions: [], materials: [] };
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = rng.next(i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  for (const item of shuffled) {
    const type = defs.get(item.id).Type;
    if (type === "Quest") continue;
    pools[
      equipmentTypes.has(type)
        ? "equipment"
        : type === "Book"
          ? "books"
          : type === "Potion"
            ? "potions"
            : "materials"
    ].push(item);
  }
  pools.equipment.sort(
    (a, b) =>
      grades.indexOf(String(defs.get(b.id).Grade)) - grades.indexOf(String(defs.get(a.id).Grade)) ||
      exceptionalPoints(b) - exceptionalPoints(a),
  );
  pools.books.sort((a, b) => defs.get(b.id).RequiredAmount - defs.get(a.id).RequiredAmount);
  pools.materials.sort((a, b) => (b.added.GemTier || 0) - (a.added.GemTier || 0));
  const distinct = (pool) => {
    const seen = /* @__PURE__ */ new Set();
    return pool.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  };
  return [
    ...pools.equipment.slice(0, limits.equipment),
    ...distinct(pools.books).slice(0, limits.books),
    ...distinct(pools.potions).slice(0, limits.potions),
    ...distinct(pools.materials).slice(0, limits.materials),
  ];
}

// games/darkforged/singleplayer/core/monster-rank.ts
function monsterRank(def, rules) {
  if (!def) return "normal";
  if (def.DreamOriginalId === 27 || def.DreamOriginalId === 44) return "elite";
  if (hasBossLootBudget(def, rules)) return "boss";
  if (def.GuideRank === "elite" || def.AdventureKind === "elite" || def.AdventureKind === "swift")
    return "elite";
  return "normal";
}

// games/darkforged/singleplayer/core/boss-respawns.ts
function bossSpawnKey(region, index) {
  const s = region.spawns[index];
  return JSON.stringify([region.id, index, s.monster, ...s.at]);
}
function persistentBossSpawn(g, region, index) {
  const r = g.me,
    s = region.spawns[index];
  if (
    !r ||
    !s ||
    g.rules.adaptations.guideChallenges?.some((c) => c.map === region.id) ||
    g.rules.adaptations.adventure.mapIds.includes(region.id) ||
    g.rules.adaptations.trial?.map === region.id
  )
    return;
  const d = g.rules.monsters.find((d2) => d2.Name === s.monster),
    profile = d && g.rules.adaptations.bossBehaviors?.entries[String(d.Index)];
  if (
    !d ||
    !(
      s.boss ||
      s.native?.boss ||
      monsterRank(d, g.rules) !== "normal" ||
      (profile && !profile.helper)
    )
  )
    return;
  const key = bossSpawnKey(region, index),
    records = (g.bossRespawns[r.id] ??= {});
  if (!records[key]) {
    const map2 = g.map(region.id);
    records[key] = {
      nextAt: map2.respawns[index] ?? g.time,
      available: map2.actors.filter((a) => a.spawn === index && !a.dead && !a.friendly).length,
    };
  }
  return records[key];
}
function recordBossDeath(g, a) {
  if (
    a.spawn === void 0 ||
    a.friendly ||
    a.special?.bossMinion ||
    (a.ai === 25 && Number(a.special?.revivals) < Number(a.special?.lives))
  )
    return;
  const region = g.region(a.map),
    s = region.spawns[a.spawn],
    record = persistentBossSpawn(g, region, a.spawn);
  if (!record) return;
  record.available = Math.max(0, record.available - 1);
  if (!s.native && s.respawnPhaseSeconds === void 0)
    record.nextAt = g.time + Math.max(1e3, s.respawnMinutes * 6e4);
}

// games/darkforged/singleplayer/core/mounts.ts
function mountedItem(g, r) {
  return r.mountUid
    ? r.inventory.find((i) => i && i.uid === r.mountUid && g.defs.get(i.id)?.Type === "Mount")
    : void 0;
}
function mountSpeed(g, r) {
  const i = mountedItem(g, r);
  return i ? Number(g.defs.get(i.id).DreamMountSpeed || 0) : 0;
}
function toggleMount(g, r, uid) {
  if (r.dead) throw new LocalizedError(message("core.mounts.toggleMount.01807ce390"));
  if (r.mountUid && (!uid || uid === r.mountUid)) {
    delete r.mountUid;
    g.say(message("core.mounts.toggleMount.ea50da7868"));
    return;
  }
  const i = r.inventory.find(
    (i2) => i2 && (uid ? i2.uid === uid : g.defs.get(i2.id)?.Type === "Mount"),
  );
  if (!i || g.defs.get(i.id)?.Type !== "Mount")
    throw new LocalizedError(message("core.mounts.toggleMount.3827072b6d"));
  r.mountUid = i.uid;
  r.target = 0;
  g.say(message("core.mounts.toggleMount.18e1be6798", { p0: entityText("items", i.id) }));
}
function mountVoucher(g, r, uid) {
  const voucher = r.inventory.find((i2) => i2?.uid === uid),
    pool = g.rules.items.filter(
      (d2) =>
        d2.Type === "Mount" && Number(d2.DreamMountSpeed) <= 3 && Number(d2.DreamMountSpeed) >= 2,
    );
  if (!voucher || g.defs.get(voucher.id)?.Type !== "MountVoucher" || !pool.length)
    throw new LocalizedError(message("core.mounts.mountVoucher.1f2e357b01"));
  if (voucher.count > 1 && !r.inventory.some((i2) => !i2))
    throw new LocalizedError(message("core.mounts.mountVoucher.a5eb332e68"));
  const d = pool[g.rng.next(pool.length)],
    i = g.newItem(d.Index);
  i.bound = true;
  voucher.count--;
  if (!voucher.count) r.inventory[r.inventory.indexOf(voucher)] = null;
  if (!g.give(r, i, false))
    throw new LocalizedError(message("core.mounts.mountVoucher.f4f8709c7f"));
  g.say(message("core.mounts.mountVoucher.552bba3d4a", { p0: entityText("items", d.Index) }));
}

// games/darkforged/singleplayer/core/boss-config.ts
function bossProfile(g, a) {
  if (a.friendly) return;
  const cfg = g.rules.adaptations.bossBehaviors;
  const entry = cfg?.entries[String(a.definition)];
  return entry ? cfg.profiles[entry.profile] : void 0;
}
function monsterCombatProfile(g, a) {
  if (a.friendly) return;
  return (
    bossProfile(g, a) ??
    g.rules.adaptations.monsterCombat?.byNativeId[
      String(g.monsters.get(a.definition)?.DreamOriginalId)
    ]
  );
}
function activeBossHealthBranches(g, a) {
  return (monsterCombatProfile(g, a)?.healthBranches ?? []).filter(
    (b) =>
      (b.hpAtMostPercent === void 0 || a.hp <= (a.maxHP * b.hpAtMostPercent) / 100) &&
      (b.hpBelow === void 0 || a.hp < b.hpBelow) &&
      (b.hpBelowPercent === void 0 || a.hp < (a.maxHP * b.hpBelowPercent) / 100),
  );
}
function applyBossHealthStats(g, a) {
  const revivals = monsterCombatProfile(g, a)?.revivals;
  if (revivals)
    for (const step2 of revivals.statMultipliers.slice(0, Number(a.special?.nativeRevivals || 0)))
      for (const [key, value] of Object.entries(step2))
        a.stats[key] = Math.floor((a.stats[key] || 0) * value);
  const ability = a.buffs.find((b) => b.type === "DreamBossAbility" && b.until > g.time);
  if (ability)
    for (const [key, value] of Object.entries(ability.stats))
      a.stats[key] = Math.floor((a.stats[key] || 0) * value);
  for (const branch of activeBossHealthBranches(g, a)) {
    for (const [key, value] of Object.entries(branch.multiply ?? {}))
      a.stats[key] = Math.floor((a.stats[key] || 0) * value);
    for (const [key, value] of Object.entries(branch.add ?? {}))
      a.stats[key] = (a.stats[key] || 0) + value;
  }
}

// games/darkforged/singleplayer/core/monster-affixes.ts
function weighted2(g, rows) {
  let n = g.rng.next(rows.reduce((sum, r) => sum + r.Weight, 0));
  for (const r of rows) {
    if (n < r.Weight) return r;
    n -= r.Weight;
  }
  return rows[rows.length - 1];
}
function initializeMonsterAffixes(g, a, d) {
  const cfg = g.rules.adaptations.dreamRuntime?.monsterAffixModel;
  if (
    !cfg ||
    a.spawn === void 0 ||
    a.map === g.rules.world.maps.find((m) => m.start).id ||
    d.Experience <= 0 ||
    g.rng.next(100) >= cfg.chancePercent
  )
    return;
  const tier = Math.max(0, Math.min(7, Math.floor(d.Level / 10))),
    groups = Object.values(cfg.groups).filter(
      (row) =>
        row.Weight > 0 &&
        Object.values(row.Affixes).some((v2) => v2.Weight > 0 && v2.Grade <= tier),
    );
  if (!groups.length) return;
  const group = weighted2(g, groups),
    v = weighted2(
      g,
      Object.values(group.Affixes).filter((v2) => v2.Weight > 0 && v2.Grade <= tier),
    ),
    s = a.special;
  s.nativeAffixType = group.Type;
  s.nativeAffixLow = v.LowValue;
  s.nativeAffixHigh = v.HighValue;
  s.nativeAffixRate = group.Rate;
  s.nativeAffixDuration = v.Dura;
  s.affixDrop = v.AffixDrop;
  s.magicAdd = v.MagicAdd;
  s.dropAdd = v.DropAdd;
  s.expAdd = v.ExpAdd;
  s.nativeAffixRegenAt = g.time + 5e3;
  a.name = v.Name + " \xB7 " + a.name;
  if (group.Type === 10003) {
    const ratio = 1 + g.rng.next(v.HighValue + 1, v.LowValue) / 100;
    for (const key of ["MinAC", "MaxAC", "MinMAC", "MaxMAC"])
      a.stats[key] = Math.floor((a.stats[key] || 0) * ratio);
  }
}
function monsterAffixDamage(g, source, raw, defence, spell) {
  const s = source.special;
  if (source.friendly || source.kind !== "monster" || !s?.nativeAffixType || defence === "None")
    return raw;
  const type = Number(s.nativeAffixType),
    value = g.rng.next(Number(s.nativeAffixHigh) + 1, Number(s.nativeAffixLow));
  if (type === 10002 && defence.startsWith("AC")) return Math.floor(raw * (1 + value / 100));
  const element = g.rules.skills.find((d) => d.Spell === spell)?.DreamSkill?.element;
  if (element && { 10005: 4, 10006: 5, 10007: 2, 10008: 3, 10009: 1 }[type] === element)
    return Math.floor(raw * (1 + value / 100));
  return raw;
}
function monsterAffixHit(g, source, target, amount, defence) {
  const s = source.special;
  if (source.friendly || target.dead || !s || amount <= 0 || defence === "None") return;
  if (s.nativeAffixType === 10001 && g.rng.next(100) < Number(s.nativeAffixRate)) {
    g.buff(
      target,
      "Green",
      Number(s.nativeAffixDuration) * 1e3,
      g.rng.next(Number(s.nativeAffixHigh) + 1, Number(s.nativeAffixLow)),
      {},
      source.id,
    );
  }
}
function monsterAffixTick(g, a) {
  const s = a.special;
  if (a.dead || a.friendly || s?.nativeAffixType !== 10011 || g.time < Number(s.nativeAffixRegenAt))
    return;
  s.nativeAffixRegenAt = g.time + 5e3;
  if (!a.buffs.some((b) => b.type === "Green" || b.type === "DreamPoisonArmour"))
    a.hp = Math.min(a.maxHP, a.hp + Math.ceil((a.maxHP * Number(s.nativeAffixLow)) / 100));
}

// games/darkforged/singleplayer/core/dream-magic.ts
var terrainBlockedProjectiles = /* @__PURE__ */ new Set([
  "FireBall",
  "GreatFireBall",
  "SoulFireBall",
]);
function canReachDreamSpell(g, r, spell, target) {
  return !terrainBlockedProjectiles.has(spell) || hydraSight(g, r.map, r, target);
}
var summonIds = {
  SummonSpiritServant: -1,
  SummonSkeleton: 29,
  SummonShinsu: 14,
  AdvancedSummon: 62,
  SummonTiger: 99,
  SummonMoonSpirit: 144,
};
var dreamToggles = /* @__PURE__ */ new Set([
  "Thrusting",
  "HalfMoon",
  "WhirlwindSlash",
  "FlamingSword",
  "BlazingSword",
]);
function toggleDream(g, r, d, level, on) {
  const key = d.Spell[0].toLowerCase() + d.Spell.slice(1),
    s = g.skill(r, d.Spell).s;
  if (on && ["FlamingSword", "BlazingSword"].includes(d.Spell)) {
    if (g.time < s.CastTime)
      throw new LocalizedError(message("core.dream-magic.toggleDream.427a35f43e"));
    const cost = skillCost(d, level, r.stats);
    if (r.mp < cost) throw new LocalizedError(message("core.dream-magic.toggleDream.26f1ab23c0"));
    r.mp -= cost;
    s.CastTime = g.time + d.DreamSkill.cooldown;
  }
  if (on && ["FlamingSword", "BlazingSword"].includes(d.Spell)) {
    r.special ??= {};
    r.special["readyUntil:" + d.Spell] = g.time + (d.Spell === "FlamingSword" ? 6e3 : 1e4);
  }
  if (on && d.Spell === "WhirlwindSlash") r.attackModes.halfMoon = false;
  if (on && d.Spell === "HalfMoon") r.attackModes.whirlwindSlash = false;
  r.attackModes[key] = on;
  g.emit("SpellToggle", { ObjectID: r.id, Spell: d.Spell, CanUse: on });
}
function enemies(g, r) {
  return g
    .map(r.map)
    .actors.filter((a) => a.kind === "monster" && !a.dead && !a.friendly && targetableMonster(a));
}
function pets(g, r) {
  return Object.values(g.maps)
    .flatMap((m) => m.actors)
    .filter((a) => a.master === r.id && a.friendly && !a.dead);
}
function dreamTameLevel(d) {
  if (d.IsBoss || d.GuideRank === "elite") return null;
  const name = String(d.DreamName || d.Name),
    hp = d.Stats.HP || 0;
  if (name === "\u534A\u517D\u52C7\u58EB") return hp >= 900 ? 36 : 23;
  if (name === "\u5DE8\u578B\u591A\u89D2\u866B") return hp >= 900 ? 33 : null;
  const levels = {
    "\u9E7F": 4,
    "\u591A\u94A9\u732B": 8,
    "\u9489\u8019\u732B": 8,
    "\u534A\u517D\u6218\u58EB": 17,
    "\u534A\u517D\u4EBA\u6218\u58EB": 17,
    "\u6C83\u739B\u6218\u58EB": 28,
    "\u6C83\u739B\u52C7\u58EB": 28,
    "\u6C83\u739B\u6218\u5C06": 28,
    "\u706B\u7130\u6C83\u739B": 28,
    "\u9ED1\u91CE\u732A": 28,
    "\u7EA2\u91CE\u732A": 28,
    "\u8708\u86A3": 28,
    "\u94B3\u866B": 28,
    "\u8DF3\u8DF3\u8702": 28,
    "\u5DE8\u578B\u8815\u866B": 28,
    "\u9ED1\u8272\u6076\u86C6": 28,
    "\u725B\u5934\u9B54": 39,
    "\u9ED1\u9537\u8718\u86DB": 43,
    "\u9ED1\u9102\u8718\u86DB": 43,
    "\u9ED1\u72D0": 58,
    "\u7D20\u72D0": 58,
    "\u8D64\u72D0": 58,
    "\u51B0\u7532\u866B": 63,
    "\u96EA\u72FC": 63,
    "\u5BD2\u51B0\u96EA\u4EBA": 63,
    "\u5BD2\u51B0\u6218\u58EB": 63,
  };
  return levels[name] ?? null;
}
function summonDream(g, r, d, l) {
  const learned = g.skill(r, d.Spell).s.Level,
    stage = d.Spell === "SummonTiger" && learned >= 4 ? learned - 3 : Math.min(3, learned);
  const id = d.Spell === "SummonTiger" && learned >= 4 ? 116 : summonIds[d.Spell];
  const spirit = d.Spell === "SummonSpiritServant";
  const def = g.rules.monsters.find((m) =>
    spirit
      ? m.Index === g.rules.adaptations.noviceProgression?.spiritMonster
      : m.DreamOriginalId === id,
  );
  if (!def) throw new LocalizedError(message("core.dream-magic.summonDream.b6561f1b76"));
  const family = spirit || d.Spell === "SummonSkeleton" ? 1 : 2,
    count = spirit ? 1 : stage >= 3 ? 2 : 1;
  const old = pets(g, r).filter((a) => a.definition === def.Index);
  const growth = spirit ? spiritGrowth(g, r) : null;
  const initial = spirit
      ? growth.progress.level
      : Math.min(
          7,
          stage +
            Math.max(0, l - learned) +
            (id === 116 ? 3 : 0) +
            (r.stats["PetLevel:" + d.Spell] || 0),
        ),
    cap = spirit ? growth.cfg.cap : Math.min(7, initial + 2);
  for (const a of old) {
    a.special.petLevel = Math.max(initial, Number(a.special.petLevel || 0));
    a.special.maxPetLevel = cap;
    if (growth) a.special.petXP = growth.progress.xp;
    g.refreshActor(a);
  }
  for (const a of old.slice(count)) {
    a.dead = true;
    a.hp = 0;
    a.expires = g.time;
  }
  g.bringPets(r);
  for (let i = Math.min(old.length, count); i < count; i++) {
    const spot = g.freeNear(r.map, r, 3);
    if (!spot) break;
    const a = g.newMonster(def, r.map, spot);
    a.friendly = true;
    a.master = r.id;
    a.special = {
      ...a.special,
      dreamPet: true,
      dreamFamily: family,
      petLevel: initial,
      maxPetLevel: cap,
      ...(growth ? { petXP: growth.progress.xp } : {}),
    };
    g.refreshActor(a);
    a.hp = a.maxHP;
    a.actionAt = g.time + (id === 29 ? 1500 : 500);
    g.map(r.map).actors.push(a);
    g.emit("ObjectShow", { ObjectID: a.id, Duration: id === 29 ? 1500 : 500 });
  }
}
function castDream(g, r, d, data) {
  const skill = g.skill(r, d.Spell),
    l = skill.level,
    n = d.DreamSkill,
    spell = d.Spell;
  if (n.passive) {
    g.say(message("core.dream-magic.castDream.2c29d4452a"));
    return;
  }
  if (dreamToggles.has(spell)) {
    toggleDream(g, r, d, l, true);
    return;
  }
  if (g.time < Math.max(r.spellAt, r.actionAt, skill.s.CastTime)) return;
  const cost = skillCost(d, l, r.stats);
  if (r.mp < cost) throw new LocalizedError(message("core.dream-magic.castDream.26f1ab23c0"));
  let target = spell === "Poisoning" ? r : g.actor(Number(data.TargetID));
  const loc = { x: Number(data.Location?.X ?? r.x), y: Number(data.Location?.Y ?? r.y) };
  if (!Number.isFinite(loc.x) || !Number.isFinite(loc.y))
    throw new LocalizedError(message("core.dream-magic.castDream.a817ce95ed"));
  const center = target ?? loc;
  if (target?.map !== void 0 && target.map !== r.map)
    throw new LocalizedError(message("core.dream-magic.castDream.0640ca6a3a"));
  if (distance(r, center) > d.Range)
    throw new LocalizedError(message("core.dream-magic.castDream.8ec455055d"));
  const enemy2 = () => {
    if (
      !target ||
      target.dead ||
      target.friendly ||
      target.kind !== "monster" ||
      !targetableMonster(target)
    )
      throw new LocalizedError(message("core.dream-magic.castDream.ac7b618ae7"));
    return target;
  };
  const power = (kind = "MC") => magicDamage(d, l, nativeAbility(g, r, kind), g.rng);
  const hit = (a, value, delay = 500, defence = "MAC") => {
    const e = g.schedule("hit", delay, r, a, value, defence, spell);
    e.level = l;
    if (["MeteorStrike", "IceFlame", "FireBang", "IceStorm"].includes(spell))
      e.location = { x: center.x, y: center.y };
    return e;
  };
  const area = (at, radius, value, delay = 500, defence = "MAC") => {
    for (const a of enemies(g, r).filter((a2) => distance(a2, at) <= radius))
      hit(a, value, delay, defence);
  };
  let action;
  switch (spell) {
    case "FireBall":
    case "GreatFireBall":
    case "ThunderBolt":
    case "SoulFireBall":
    case "FlameDisruptor":
    case "FrostCrunch": {
      const a = enemy2();
      if (!canReachDreamSpell(g, r, spell, a))
        throw new LocalizedError(message("skill.projectileObstructed"));
      action = () => hit(a, power(spell === "SoulFireBall" ? "SC" : "MC") *
        (spell === "SoulFireBall" && skill.s.Level >= 4 ? 2 : 1));
      break;
    }
    case "FireBang":
    case "IceStorm":
    case "IceFlame":
      action = () => area(center, 1, power());
      break;
    case "ChainThunder": {
      const a = enemy2();
      action = () => {
        const targets = [a];
        while (targets.length < Math.max(2, l + 1)) {
          const previous = targets[targets.length - 1],
            next = enemies(g, r)
              .filter(
                (b) =>
                  !targets.includes(b) && distance(b, previous) <= Math.min(4, skill.s.Level + 1),
              )
              .sort((b, c) => distance(b, previous) - distance(c, previous) || b.id - c.id)[0];
          if (!next) break;
          targets.push(next);
        }
        for (const [i, b] of targets.entries())
          hit(b, Math.trunc(power() * Math.max(0.25, 0.8 ** i)), 900 + i * 300);
        g.emit("SpellChain", {
          Spell: spell,
          Segments: targets.map((b, i) => ({
            From: { x: (i ? targets[i - 1] : r).x, y: (i ? targets[i - 1] : r).y },
            To: { x: b.x, y: b.y },
            Delay: i * 300,
          })),
        });
      };
      break;
    }
    case "ThunderStorm":
      action = () => {
        for (const a of enemies(g, r).filter((a2) => distance(a2, r) <= 2))
          hit(a, Math.floor(power() / (distance(a, r) > 1 ? 2 : 1)));
      };
      break;
    case "MeteorStrike":
      action = () => {
        for (const a of enemies(g, r).filter((a2) => distance(a2, center) <= 1))
          for (let i = 0; i < 3; i++) {
            const e = hit(a, power(), 2500 + i * 700);
            delete e.location;
          }
      };
      break;
    case "FireWall":
    case "PoisonCloud":
    case "DragonFlame":
      action = () => {
        const isPoison = spell === "PoisonCloud",
          isFire = spell === "FireWall";
        const duration = isFire
          ? Math.min(
              (nativeAbility(g, r, "MC") + 3 * l) * 500,
              [0, 8e3, 12e3, 15e3, 18e3, 21e3, 24e3][l] ?? 25e3,
            )
          : isPoison
            ? 3e3 + nativeAbility(g, r, "SC") * 100
            : 3e3;
        const e = g.schedule("magic", isFire ? 0 : isPoison ? 800 : 300, r, r, 0, "None", spell);
        e.durationMs = duration;
        e.level = l;
        e.location = { x: center.x, y: center.y };
      };
      break;
    case "Healing": {
      const a =
        target && !target.dead && (target.id === r.id || target.master === r.id) ? target : r;
      action = () => g.schedule("heal", 500, r, a, power("SC"), "None", spell);
      break;
    }
    case "MassHealing":
      action = () => {
        for (const a of [r, ...pets(g, r)].filter(
          (a2) => a2.map === r.map && distance(a2, center) <= 1,
        ))
          g.schedule("heal", 500, r, a, power("SC"), "None", spell);
      };
      break;
    case "Poisoning": {
      action = () => {
        const duration = (20 + l * 7 + nativeAbility(g, r, "SC") * 2) * 1e3;
        for (const a of enemies(g, r).filter((a) => distance(r, a) <= d.Range)) {
          const b = g.buff(a, "Green", duration, poisoningDamage(l, r.stats), {}, r.id, spell);
          if (b) b.interval = 1e3;
          g.buff(a, "DreamPoisonArmour", duration, Math.min(100, 4 * l), {}, r.id, spell);
        }
      };
      break;
    }
    case "GhostBurn": {
      const a = enemy2();
      action = () =>
        g.buff(
          a,
          "GhostBurn",
          5e3 + 3e3 * l + Math.trunc(nativeAbility(g, r, "SC") / 10),
          0,
          { MinDCRatePercent: -(3 + 2 * l), MaxDCRatePercent: -(3 + 2 * l) },
          r.id,
          spell,
        );
      break;
    }
    case "Hiding":
      action = () => g.buff(r, "Hiding", (8 * l + nativeAbility(g, r, "SC")) * 500 + 500);
      break;
    case "BlessedArmour":
      action = () => {
        const sc = nativeAbility(g, r, "SC"),
          duration = sc < 70 ? sc * 8e3 : sc * 3e3 + 35e4;
        for (const a of [r, ...pets(g, r)].filter(
          (a2) => a2.map === r.map && distance(a2, center) <= 1,
        )) {
          const value = a.id === r.id ? 2 * l * (1 + Math.trunc((r.level - 1) / 10)) : 2 * l;
          g.buff(
            a,
            "BlessedArmour",
            duration,
            0,
            { MinAC: value, MaxAC: value, MinMAC: value, MaxMAC: value },
            r.id,
            spell,
          );
        }
      };
      break;
    case "MagicShield":
      action = () =>
        g.buff(r, "MagicShield", (5 + nativeAbility(g, r, "MC")) * 1e3, l, {}, r.id, spell);
      break;
    case "BloodDragon":
      action = () =>
        g.buff(
          r,
          spell,
          l >= 3 ? 3e5 : (nativeAbility(g, r, "DC") + 25 * l) * 200,
          0,
          {
            DreamCritPercent: Math.min(3, l) * 10,
            DreamCritDamagePercent: Math.min(3, l) * 6,
            AttackSpeed: Math.min(3, l) + 1,
          },
          r.id,
          spell,
        );
      break;
    case "DiamondBody": {
      const rank = Math.min(6, l),
        v = Math.min(3, rank);
      action = () =>
        g.buff(
          r,
          spell,
          l >= 3 ? 3e5 : nativeAbility(g, r, "DC") * 400 + l * 5e3,
          rank,
          {
            MinAC: v * 8,
            MaxAC: v * 8,
            MinMAC: v * 8,
            MaxMAC: v * 8,
            NoFlinchPercent: 7 * v,
            HPRatePercent: [0, 0, 0, 0, 20, 40, 70][rank],
            PotionHealingPercent: [0, 0, 0, 0, 10, 15, 20][rank],
          },
          r.id,
          spell,
        );
      break;
    }
    case "Abyss": {
      const rank = Math.min(6, l);
      action = () =>
        g.buff(
          r,
          spell,
          (l + 5) * 3e3,
          rank,
          {
            DreamMagicDamagePercent: 3 + rank,
            ManaPenaltyPercent: [0, 6, 7, 8, 9, 10, 12][rank],
            DreamCritPercent: rank >= 4 ? [10, 15, 25][rank - 4] : 0,
          },
          r.id,
          spell,
        );
      break;
    }
    case "InnateQi":
      action = () =>
        g.buff(
          r,
          spell,
          nativeAbility(g, r, "SC") * 500 + Math.min(l, 3) * 5e3,
          Math.min(6, l),
          { SpiritDamagePercent: 10 * Math.min(6, l) },
          r.id,
          spell,
        );
      break;
    case "BeastArmour": {
      const pet = pets(g, r).find(
        (a) =>
          g.monsters.get(a.definition)?.DreamOriginalId === 62 && !a.special?.nativeBeastArmourRank,
      );
      if (!pet) throw new LocalizedError(message("core.dream-magic.castDream.019bf7dc80"));
      action = () => {
        pet.special ??= {};
        pet.special.nativeBeastArmourRank = l;
        pet.art = g.rules.monsters.find((m) => m.DreamOriginalId === 82)?.Image || pet.art;
        pet.name = "\u5723\u517D";
        g.refreshActor(pet);
        g.emit("ObjectShow", { ObjectID: pet.id, Duration: 500 });
      };
      break;
    }
    case "SummonSpiritServant":
    case "SummonSkeleton":
    case "SummonShinsu":
    case "AdvancedSummon":
    case "SummonTiger":
    case "SummonMoonSpirit":
      if (!g.freeNear(r.map, r, 3))
        throw new LocalizedError(message("core.dream-magic.castDream.b60b3b41b5"));
      action = () => summonDream(g, r, d, l);
      break;
    case "LionRoar":
      action = () => {
        for (const a of enemies(g, r).filter(
          (a2) =>
            distance(a2, r) <= Math.min(4, l + 1) &&
            g.monsters.get(a2.definition).Level <= r.level - 2,
        ))
          g.buff(a, "LRParalysis", l * 2e3, 0, {}, r.id, spell);
      };
      break;
    case "FlashSlash":
      action = () => {
        const dir = direction(r, center),
          [dx, dy] = vectors[dir],
          geom = g.geometry.get(r.map);
        r.dir = dir;
        for (let step2 = 0; step2 < l + 1; step2++) {
          const x = r.x + dx,
            y = r.y + dy;
          if (
            x < 0 ||
            y < 0 ||
            x >= geom.width ||
            y >= geom.height ||
            geom.solid[y * geom.width + x] ||
            g
              .map(r.map)
              .actors.some(
                (a) => !a.dead && (a.kind === "npc" || a.friendly) && a.x === x && a.y === y,
              )
          )
            break;
          r.x = x;
          r.y = y;
          for (const a of enemies(g, r).filter((a2) => a2.x === x && a2.y === y))
            hit(a, Math.trunc(nativeAbility(g, r, "DC") * (l + 4) * 0.5), 500, "AC");
        }
      };
      break;
    case "ElectricShock": {
      const a = enemy2(),
        def = g.monsters.get(a.definition);
      const required = dreamTameLevel(def);
      if (required === null || a.special?.elite || a.special?.nativeAffixType)
        throw new LocalizedError(message("core.dream-magic.castDream.2a0a3eb47b"));
      if (required > r.level)
        throw new LocalizedError(
          message("core.dream-magic.castDream.8e84096164", { p0: required }),
        );
      if (r.level - def.Level < 3)
        throw new LocalizedError(message("core.dream-magic.castDream.fcd380a876"));
      if (pets(g, r).filter((pet) => (pet.special?.dreamTamed || pet.special?.tameUntil)).length >= (l === 1 ? 1 : 3))
        throw new LocalizedError(message("core.dream-magic.castDream.b245cda302"));
      action = () => {
        const divisor = Math.max(1, Math.trunc((70 - nativeAbility(g, r, "MC")) / 10));
        if (g.rng.next(divisor) !== 0) {
          g.say(message("core.dream-magic.castDream.0b855f3c9e"));
          return;
        }
        if (a.spawn !== void 0) {
          g.map(a.map).respawns[a.spawn] =
            g.time + g.region(a.map).spawns[a.spawn].respawnMinutes * 6e4;
          a.spawn = void 0;
        }
        a.friendly = true;
        a.master = r.id;
        a.target = 0;
        a.buffs = [];
        a.special = {
          ...a.special,
          dreamPet: true,
          dreamTamed: true,
          petLevel: 0,
          maxPetLevel: 3,
          tameUntil: 0,
        };
        g.refreshActor(a);
        g.say(
          message("core.dream-magic.castDream.76b2142e79", {
            p0: entityText("monsters", a.definition),
          }),
        );
      };
      break;
    }
    default:
      throw new LocalizedError(message("core.dream-magic.castDream.fa2913ca98", { p0: spell }));
  }
  const interval = dreamCastDelay(r.stats);
  action();
  r.mp -= cost;
  skill.s.CastTime = g.time + n.cooldown;
  r.spellAt = g.time + interval;
  r.actionAt = g.time + Math.min(600, interval);
  g.emit("Magic", {
    ObjectID: r.id,
    Spell: spell,
    Cast: true,
    Direction: dirs[r.dir],
    Target: { x: center.x, y: center.y },
    TargetID: target?.id || 0,
  });
}


function completeDream(g, r, target, e) {
  if (e.spell === "FireWall" || e.spell === "PoisonCloud" || e.spell === "DragonFlame") {
    createField(g, r, e);
    return;
  }
  const learned = g.skill(r, e.spell || "")?.s.Level || 1;
  const weight = Number(g.monsters.get(target.definition)?.DreamRaw?.Weight || 0);
  if (
    ["FrostCrunch", "IceFlame"].includes(e.spell || "") &&
    !r.dead &&
    !target.dead &&
    target.hp > 0 &&
    !(weight & 128) &&
    target.special?.nativeAffixType !== 10009 &&
    !target.buffs.some((b) => b.type === "Slow" && b.until > g.time) &&
    g.rng.next(100) < Math.min(100, 20 * learned)
  ) {
    const applied = g.buff(
      target,
      "Slow",
      learned * 1e3 + nativeAbility(g, r, "MC") * 200,
      0,
      {},
      r.id,
      e.spell,
    );
    if (applied) {
      target.buffs = target.buffs.filter((b) => b.type !== "DreamFrost");
      target.buffs.push({ ...applied, type: "DreamFrost", value: 50, stats: {} });
    }
  }
}

// games/darkforged/singleplayer/core/magic.ts
var implementedSpells = /* @__PURE__ */ new Set([
  "Hydra",
  "Steadfast",
  "Berserker",
  "BlazingSword",
  "SkyCleaver",
  "BloodDragon",
  "DiamondBody",
  "WhirlwindSlash",
  "FlashSlash",
  "IceFlame",
  "DragonFlame",
  "Abyss",
  "ChainThunder",
  "AdvancedSummon",
  "BeastArmour",
  "InnateQi",
  "SummonTiger",
  "SummonMoonSpirit",
  "GhostBurn",
  "Fencing",
  "SpiritSword",
  "Slaying",
  "Thrusting",
  "HalfMoon",
  "CrossHalfMoon",
  "FlamingSword",
  "TwinDrakeBlade",
  "FireBall",
  "GreatFireBall",
  "ThunderBolt",
  "SoulFireBall",
  "Healing",
  "Poisoning",
  "MagicShield",
  "ProtectionField",
  "Rage",
  "MagicBooster",
  "Purification",
  "Hiding",
  "SummonSkeleton",
  "SummonShinsu",
  "SummonHolyDeva",
  "FireBang",
  "IceStorm",
  "HellFire",
  "Lightning",
  "ThunderStorm",
  "FlameField",
  "FireWall",
  "SoulShield",
  "BlessedArmour",
  "MassHealing",
  "MassHiding",
  "Blink",
  "Teleport",
  "FlameDisruptor",
  "FrostCrunch",
  "Vampirism",
  "TurnUndead",
  "Fury",
  "Repulsion",
  "EnergyRepulsor",
  "LionRoar",
  "Revelation",
  "PetEnhancer",
  "UltimateEnhancer",
  "EnergyShield",
  "BladeAvalanche",
  "Entrapment",
  "Blizzard",
  "MeteorStrike",
  "PoisonCloud",
  "HealingCircle",
  "Curse",
  "Plague",
  "TrapHexagon",
  "Hallucination",
  "CounterAttack",
  "ShoulderDash",
  "ElectricShock",
  "Mirroring",
]);
var settlementTraining = /* @__PURE__ */ new Set([
  "FireBall",
  "GreatFireBall",
  "ThunderBolt",
  "SoulFireBall",
  "FlameDisruptor",
  "FrostCrunch",
  "Vampirism",
  "Healing",
  "Poisoning",
  "MagicShield",
  "Fury",
  "MagicBooster",
  "Hiding",
  "PetEnhancer",
  "TurnUndead",
  "Revelation",
  "Entrapment",
  "Hallucination",
  "ElectricShock",
  "FireWall",
  "HealingCircle",
  "Purification",
  "Blink",
  "Teleport",
]);
function toggleMagic(g, r, spell, on) {
  if (on && mountedItem(g, r))
    throw new LocalizedError(message("core.magic.toggleMagic.5c12d1da76"));
  const magic = g.skill(r, spell);
  if (!magic) throw new LocalizedError(message("core.magic.toggleMagic.446bba28f3"));
  if (magic.d.DreamSkill) {
    toggleDream(g, r, magic.d, magic.level, on);
    return;
  }
  if (
    ![
      "Thrusting",
      "HalfMoon",
      "CrossHalfMoon",
      "FlamingSword",
      "TwinDrakeBlade",
      "CounterAttack",
    ].includes(spell)
  )
    throw new LocalizedError(message("core.magic.toggleMagic.ffd64a746c"));
  const key = spell[0].toLowerCase() + spell.slice(1);
  if (on && ["FlamingSword", "TwinDrakeBlade", "CounterAttack"].includes(spell)) {
    const cost = magic.d.BaseCost + magic.s.Level * magic.d.LevelCost;
    if (r.mp < cost || (spell === "CounterAttack" && r.mp === cost))
      throw new LocalizedError(message("core.magic.toggleMagic.26f1ab23c0"));
    if (g.time < magic.s.CastTime)
      throw new LocalizedError(message("core.magic.toggleMagic.427a35f43e"));
    r.mp -= cost;
    magic.s.CastTime =
      g.time +
      (spell === "CounterAttack"
        ? 7e3
        : spell === "FlamingSword"
          ? 1e4
          : magic.d.DelayBase - magic.s.Level * magic.d.DelayReduction);
  }
  r.attackModes[key] = on;
  if (on && spell === "CounterAttack") {
    const v = 11 + magic.s.Level * 3;
    g.buff(r, spell, 7e3, 0, { MinAC: v, MaxAC: v, MinMAC: v, MaxMAC: v });
  }
  g.emit("SpellToggle", { ObjectID: r.id, Spell: spell, CanUse: on });
}
function counterAttack(g, r, target) {
  const magic = g.skill(r, "CounterAttack");
  if (!magic || !r.attackModes.counterAttack || g.time >= magic.s.CastTime) return;
  let raw = attackPower(r.stats, "DC", g.rng);
  if (g.rng.next(100) <= (r.stats.Accuracy || 0)) raw *= 2;
  const damage = magicDamage(magic.d, magic.s.Level, raw, g.rng);
  if (distance(r, target) > 1 || g.rng.next(10) > magic.s.Level + 6) return;
  r.dir = (target.dir + 4) % 8;
  r.attackModes.counterAttack = false;
  g.schedule("hit", Math.max(0, r.attackAt - g.time), r, target, damage, "AC", "CounterAttack");
  g.emit("Magic", {
    ObjectID: r.id,
    Spell: "CounterAttack",
    Cast: true,
    Direction: dirs[r.dir],
    Target: target,
    TargetID: target.id,
  });
  g.levelSkill(r, magic.s);
}
function push(g, source, target, dir, cells) {
  if (
    target.kind !== "monster" ||
    !g.monsters.get(target.definition)?.CanPush ||
    isChallengeChest(g.monsters.get(target.definition), g.rules) ||
    !targetableMonster(target) ||
    dir < 0 ||
    dir > 7 ||
    target.dead
  )
    return 0;
  const [dx, dy] = vectors[dir];
  let moved = 0;
  while (moved < cells && g.walkable(target.map, target.x + dx, target.y + dy, target.id)) {
    target.x += dx;
    target.y += dy;
    moved++;
  }
  if (moved) {
    target.dir = (dir + 4) % 8;
    target.actionAt = g.time + 300 * moved;
    target.moveAt = g.time + 500 * moved;
    g.emit("ObjectPushed", {
      ObjectID: target.id,
      Direction: dirs[target.dir],
      Location: { X: target.x, Y: target.y },
    });
  }
  return moved;
}
function completeMagic(g, r, target, e) {
  if (g.skill(r, e.spell || "")?.d.DreamSkill) {
    completeDream(g, r, target, e);
    return;
  }
  const level = e.level || 0,
    def = g.monsters.get(target.definition);
  switch (e.spell) {
    case "Blink": {
      const at = e.location;
      if (!g.walkable(r.map, at.x, at.y, r.id) || g.rng.next(4) >= level + 1) return;
      r.x = at.x;
      r.y = at.y;
      g.buff(r, "TemporalFlux", 3e4, 0, { TeleportManaPenaltyPercent: 30 });
      break;
    }
    case "Teleport": {
      const home = g.rules.world.maps.find((m) => m.start),
        geom = g.geometry.get(home.id);
      const sx = Math.trunc(geom.width / (level + 1)),
        sy = Math.trunc(geom.height / (level + 1));
      let found = false;
      for (let i = 0; i < 200; i++) {
        const x = home.center[0] + g.rng.next(sx, -sx),
          y = home.center[1] + g.rng.next(sy, -sy);
        if (g.walkable(home.id, x, y, r.id)) {
          r.map = home.id;
          r.x = x;
          r.y = y;
          g.initializeMap(r.map);
          g.bringPets(r);
          found = true;
          break;
        }
      }
      if (!found) return;
      g.buff(r, "TemporalFlux", 3e4, 0, { TeleportManaPenaltyPercent: 30 });
      break;
    }
    case "Purification":
      if (!(target.id === r.id || target.friendly) || g.rng.next(4) > level) return;
      target.buffs = target.buffs.filter(
        (b) =>
          ![
            "Green",
            "Red",
            "Slow",
            "Paralysis",
            "Frozen",
            "Curse",
            "Plague",
            "Stun",
            "LRParalysis",
            "Trap",
            "DelayedExplosion",
            "Bleeding",
            "Hallucination",
          ].includes(b.type),
      );
      g.refreshActor(target);
      break;
    case "SummonSkeleton":
    case "SummonShinsu":
    case "SummonHolyDeva": {
      const name =
          g.rules.monsterSettings[
            e.spell === "SummonSkeleton"
              ? "SkeletonName"
              : e.spell === "SummonShinsu"
                ? "ShinsuName"
                : "AngelName"
          ],
        def2 = g.rules.monsters.find((d) => d.Name === name),
        spot = g.freeNear(r.map, r, 3);
      if (!def2 || !spot) return;
      const old = Object.values(g.maps)
        .flatMap((m) => m.actors)
        .find((a) => a.master === r.id && a.definition === def2.Index && !a.dead);
      if (old) {
        g.bringPets(r);
        old.x = spot.x;
        old.y = spot.y;
        return;
      }
      const pet = g.newMonster(def2, r.map, spot);
      pet.friendly = true;
      pet.master = r.id;
      pet.special.petLevel = level;
      pet.special.maxPetLevel = e.spell === "SummonSkeleton" ? 4 + level : 1 + level * 2;
      g.refreshActor(pet);
      pet.hp = pet.maxHP;
      pet.actionAt = g.time + 1e3;
      g.map(r.map).actors.push(pet);
      break;
    }
    case "Mirroring": {
      const existing = g
        .map(r.map)
        .actors.find((a2) => a2.ai === 55 && a2.master === r.id && !a2.dead);
      if (existing) {
        g.die(existing, r);
        return;
      }
      const def2 = g.rules.monsters.find((m) => m.Name === g.rules.monsterSettings.CloneName),
        spot = g.freeNear(r.map, r, 2);
      if (!def2 || !spot) return;
      const a = g.newMonster(def2, r.map, spot);
      a.friendly = true;
      a.master = r.id;
      a.actionAt = g.time + 1e3;
      g.map(r.map).actors.push(a);
      break;
    }
    case "ElectricShock": {
      if (!def || target.friendly) return;
      if (g.rng.next(4 - level) > 0) {
        if (g.rng.next(2) === 0) {
          const skill = g.skill(r, "ElectricShock")?.s;
          if (skill) g.levelSkill(r, skill);
        }
        return;
      }
      const shockSkill = g.skill(r, "ElectricShock")?.s;
      if (shockSkill) g.levelSkill(r, shockSkill);
      if (g.rng.next(2) > 0) {
        g.buff(target, "Shock", (level * 5 + 10) * 1e3);
        target.target = 0;
        return;
      }
      if (def.Level > r.level + 2 || !def.CanTame) return;
      const pets2 = Object.values(g.maps)
        .flatMap((m) => m.actors)
        .filter((a) => a.friendly && a.master === r.id && !a.dead &&
          (a.special?.tameUntil || a.special?.dreamTamed));
      if (
        def.IsBoss &&
        pets2.filter((a) => g.monsters.get(a.definition)?.IsBoss).length >=
          g.rules.constants.MaxBossTames
      )
        return;
      if (g.rng.next(r.level + 20 + level * 5) <= def.Level + 10) {
        if (g.rng.next(5) > 0) {
          g.buff(target, "TameRage", (g.rng.next(20) + 10) * 1e3);
          target.target = 0;
        }
        return;
      }
      if (pets2.length >= level + 2) return;
      const hp = Math.trunc((target.stats.HP || 0) / 100),
        rate = hp <= 2 ? 2 : hp * 2;
      if (g.rng.next(rate) !== 0) return;
      if (target.spawn !== void 0) {
        g.map(target.map).respawns[target.spawn] =
          g.time + g.region(target.map).spawns[target.spawn].respawnMinutes * 6e4;
        target.spawn = void 0;
      }
      target.friendly = true;
      target.master = r.id;
      target.target = 0;
      target.buffs = [];
      target.special ??= {};
      target.special.petLevel = 0;
      target.special.maxPetLevel = 1 + level * 2;
      target.special.tameUntil = g.time + 36e5;
      g.refreshActor(target);
      g.say(
        message("core.magic.completeMagic.76b2142e79", {
          p0: entityText("monsters", target.definition),
        }),
      );
      break;
    }
    case "FireWall":
    case "Blizzard":
    case "MeteorStrike":
    case "PoisonCloud":
    case "HealingCircle":
      createField(g, r, e);
      break;
    case "TrapHexagon":
      for (const a of g
        .map(r.map)
        .actors.filter(
          (a2) =>
            a2.kind === "monster" &&
            !a2.dead &&
            !a2.friendly &&
            distance(a2, e.location) <= 1 &&
            g.monsters.get(a2.definition).Level <= r.level + 2,
        )) {
        g.buff(a, "Trap", e.damage);
        a.target = 0;
      }
      break;
    case "Curse":
      for (const a of g
        .map(r.map)
        .actors.filter(
          (a2) =>
            a2.kind === "monster" && !a2.dead && !a2.friendly && distance(a2, e.location) <= 3,
        ))
        if (g.rng.next(10) < 4) {
          g.buff(a, "Slow", e.damage * 1e3);
          const value = 1 + (level + 1) * 2;
          g.buff(a, "Curse", e.damage * 1e3, 0, {
            MaxDCRatePercent: -value,
            MaxMCRatePercent: -value,
            MaxSCRatePercent: -value,
          });
        }
      break;
    case "Plague":
      for (const a of g
        .map(r.map)
        .actors.filter(
          (a2) =>
            a2.kind === "monster" && !a2.dead && !a2.friendly && distance(a2, e.location) <= 1,
        )) {
        const chance = g.rng.next(15),
          type =
            chance < 3 ? "Slow" : chance < 5 ? "Frozen" : chance < 10 ? e.effect?.type : void 0;
        if (type) {
          const value =
            type === "Red" ? Math.trunc(e.damage / 15) + level + 1 : e.damage + (level + 1) * 2;
          g.buff(a, type, ((level + 1) * 2 + Math.trunc(e.damage / 10)) * 1e3, value);
        }
        g.damage(r, a, (r.stats.MaxSC || 0) * 2, "MAC", e.spell);
      }
      break;
    case "Hallucination":
      if (
        !def ||
        target.friendly ||
        distance(r, target) > 7 ||
        g.rng.next(r.level + 20 + level * 5) <= def.Level + 10
      )
        return;
      g.buff(target, "Hallucination", (g.rng.next(20) + 10) * 1e3);
      target.target = 0;
      break;
    case "FrostCrunch":
      if (!def || r.level + 10 < def.Level) return;
      if (g.rng.next(20) <= level) g.buff(target, "Slow", (5 + g.rng.next(5)) * 1e3);
      if (g.rng.next(40) <= level)
        g.buff(target, "Frozen", (5 + g.rng.next(r.stats.Freezing || 0)) * 1e3);
      break;
    case "LionRoar":
      for (const a of g
        .map(r.map)
        .actors.filter(
          (a2) =>
            a2.kind === "monster" &&
            !a2.dead &&
            !a2.friendly &&
            distance(a2, e.location) <= 2 &&
            g.monsters.get(a2.definition).Level <= r.level + 3,
        ))
        g.buff(a, "LRParalysis", (level + 2) * 1e3);
      break;
    case "Entrapment": {
      if (
        !def ||
        target.friendly ||
        distance(r, target) > 7 ||
        def.Level >= r.level + 5 + g.rng.next(8)
      )
        return;
      const dir = (r.dir + 4) % 8,
        dx = Math.abs(r.x - target.x),
        dy = Math.abs(r.y - target.y);
      const cells =
        dir % 2 ? Math.min(dx, dy) : Math.max(0, dir === 0 || dir === 4 ? dy - 2 : dx - 2);
      if (g.rng.next(30) >= (level + 1) * 3 + r.level - def.Level + 9) return;
      g.buff(target, "Paralysis", roundEven((level + 1) * 0.8) * 1e3);
      if (!push(g, r, target, dir, cells)) return;
      break;
    }
    case "Revelation":
      if (g.rng.next(4) > level || target.buffs.some((b) => b.type === "Revelation")) return;
      g.buff(target, "Revelation", e.damage * 1e3);
      break;
  }
  if (e.trainSpell && e.trainSpell !== "ElectricShock") {
    const skill = g.skill(r, e.trainSpell)?.s;
    if (skill) g.levelSkill(r, skill);
  }
}


function castMagic(g, r, data) {
  if (mountedItem(g, r)) throw new LocalizedError(message("core.magic.castMagic.5c12d1da76"));
  const spell = String(data.Spell),
    magic = g.skill(r, spell);
  if (!magic) throw new LocalizedError(message("core.magic.castMagic.446bba28f3"));
  if (spell === "Hydra") {
    castHydra(g, r, data);
    return;
  }
  if (magic.d.DreamSkill) {
    castDream(g, r, magic.d, data);
    return;
  }
  if (g.rules.adaptations.disabledSpells[spell])
    throw Error(g.rules.adaptations.disabledSpells[spell]);
  if (!implementedSpells.has(spell))
    throw new LocalizedError(message("core.magic.castMagic.fe001409a7"));
  if (["Fencing", "SpiritSword", "Slaying"].includes(spell)) {
    g.say(message("core.magic.castMagic.eaa7e33280"));
    return;
  }
  const { d, s } = magic,
    level = s.Level;
  if (g.time < Math.max(r.spellAt, r.actionAt, s.CastTime)) return;
  let cost = d.BaseCost + level * d.LevelCost;
  if (["Teleport", "Blink"].includes(spell) && r.stats.TeleportManaPenaltyPercent > 0)
    cost += Math.trunc((cost * r.stats.TeleportManaPenaltyPercent) / 100);
  if (r.stats.ManaPenaltyPercent > 0) cost += Math.trunc((cost * r.stats.ManaPenaltyPercent) / 100);
  if (spell === "Plague") cost = (r.stats.MaxSC || 0) + (r.stats.MinSC || 0);
  if (r.mp < cost) throw new LocalizedError(message("core.magic.castMagic.26f1ab23c0"));
  let target = spell === "Poisoning" ? r : g.actor(Number(data.TargetID));
  const loc = {
    x: Number(data.Location?.X ?? r.x),
    y: Number(data.Location?.Y ?? r.y),
  };
  if (d.Range && distance(r, target ?? loc) > d.Range)
    throw new LocalizedError(message("core.magic.castMagic.8ec455055d"));
  const enemies2 = () =>
    g.map(r.map).actors.filter((a) => a.kind === "monster" && !a.dead && !a.friendly);
  const requireEnemy = () => {
    if (
      !target ||
      target.dead ||
      target.map !== r.map ||
      target.friendly ||
      target.kind !== "monster"
    )
      throw new LocalizedError(message("core.magic.castMagic.ac7b618ae7"));
    return target;
  };
  const reagent = (shape, count) => {
    const item = [...r.equipment, ...r.inventory].find(
      (i) =>
        i &&
        g.defs.get(i.id)?.Type === "Amulet" &&
        g.defs.get(i.id)?.DreamType !== 17 &&
        g.defs.get(i.id)?.Shape === shape &&
        i.count >= count,
    );
    if (!item)
      throw new LocalizedError(
        shape === 0
          ? message("core.magic.castMagic.e588610336")
          : message("core.magic.castMagic.63a4d58a68"),
      );
    return () => {
      item.count -= count;
      for (const grid of [r.equipment, r.inventory])
        for (let i = 0; i < grid.length; i++) if (grid[i] === item && !item.count) grid[i] = null;
    };
  };
  let action;
  const power = (kind) => magicDamage(d, level, attackPower(r.stats, kind, g.rng), g.rng);
  switch (spell) {
    case "Mirroring":
      action = () => {
        if (!g.map(r.map).actors.some((a) => a.ai === 55 && a.master === r.id && !a.dead))
          g.levelSkill(r, s);
        g.schedule("magic", 500, r, r, 0, "None", spell);
      };
      break;
    case "ElectricShock": {
      const enemy2 = requireEnemy();
      action = () => {
        const e = g.schedule("magic", 500, r, enemy2, 0, "None", spell);
        e.level = level;
      };
      break;
    }
    case "CounterAttack":
      toggleMagic(g, r, spell, true);
      return;
    case "ShoulderDash":
      action = () => {
        const dir2 = dirs.indexOf(data.Direction) >= 0 ? dirs.indexOf(data.Direction) : r.dir,
          [dx, dy] = vectors[dir2],
          length = g.rng.next(2) + level + 2;
        let pushed,
          moved = 0;
        for (let i = 0; i < length; i++) {
          const next = { ...r, x: r.x + dx, y: r.y + dy };
          if (g.safe(next)) break;
          if (i === 0)
            pushed = enemies2().find(
              (a) =>
                a.x === next.x && a.y === next.y && g.monsters.get(a.definition).Level < r.level,
            );
          if (pushed && !push(g, r, pushed, dir2, 1)) break;
          if (!g.walkable(r.map, next.x, next.y, r.id)) break;
          r.x = next.x;
          r.y = next.y;
          r.dir = dir2;
          moved++;
          g.emit("ObjectDash", {
            ObjectID: r.id,
            Direction: dirs[dir2],
            Location: { X: r.x, Y: r.y },
          });
        }
        if (moved) g.levelSkill(r, s);
        if (moved && pushed) g.damage(r, pushed, magicDamage(d, level, 0, g.rng), "None", spell);
        if (!moved) g.say(message("core.magic.castMagic.4033afec75"));
      };
      break;
    case "Blizzard":
    case "MeteorStrike":
    case "PoisonCloud":
    case "HealingCircle": {
      const center = target ?? loc;
      const consume = spell === "PoisonCloud" ? reagent(0, 5) : () => {},
        poison = spell === "PoisonCloud" ? reagent(1, 5) : () => {};
      action = () => {
        consume();
        poison();
        const e = g.schedule(
          "magic",
          spell === "HealingCircle"
            ? 1700
            : spell === "PoisonCloud"
              ? 500 + distance(r, center) * 50
              : 500,
          r,
          r,
          power(["PoisonCloud", "HealingCircle"].includes(spell) ? "SC" : "MC"),
          "None",
          spell,
        );
        e.location = { x: center.x, y: center.y };
        e.level = level;
        if (spell === "PoisonCloud")
          e.effect = {
            type: "Green",
            duration: 12e3,
            value: g.rng.next(r.stats.PoisonAttack || 0),
            stats: {},
          };
        if (["Blizzard", "MeteorStrike"].includes(spell)) r.attackModes.channel = true;
      };
      break;
    }
    case "Curse":
    case "Plague":
    case "TrapHexagon": {
      const center = target ?? loc,
        consume = reagent(0, 1);
      if (
        spell === "TrapHexagon" &&
        !enemies2().some(
          (a) => distance(a, center) <= 1 && g.monsters.get(a.definition).Level <= r.level + 2,
        )
      )
        throw new LocalizedError(message("core.magic.castMagic.ea367d54b7"));
      const powder =
        spell === "Plague"
          ? [...r.equipment, ...r.inventory].find(
              (i) =>
                i &&
                g.defs.get(i.id)?.Type === "Amulet" &&
                g.defs.get(i.id)?.DreamType !== 17 &&
                [1, 2].includes(g.defs.get(i.id).Shape),
            )
          : void 0;
      const poisonConsume = powder ? reagent(g.defs.get(powder.id).Shape, 1) : () => {};
      action = () => {
        consume();
        poisonConsume();
        if (spell === "Curse" && g.rng.next(10 - (level + 1) * 2) > 2) return;
        const e = g.schedule(
          "magic",
          spell === "TrapHexagon" ? 500 : 500 + distance(r, center) * 50,
          r,
          r,
          spell === "TrapHexagon" ? (level * 5 + 10) * 1e3 : power("SC"),
          "None",
          spell,
        );
        e.location = { x: center.x, y: center.y };
        e.level = level;
        if (powder)
          e.effect = {
            type: g.defs.get(powder.id).Shape === 1 ? "Green" : "Red",
            duration: 0,
            value: 0,
            stats: {},
          };
      };
      break;
    }
    case "Hallucination": {
      const enemy2 = requireEnemy(),
        consume = reagent(0, 1);
      action = () => {
        consume();
        const e = g.schedule("magic", 500 + distance(r, enemy2) * 50, r, enemy2, 0, "None", spell);
        e.level = level;
      };
      break;
    }
    case "FireBall":
    case "GreatFireBall":
    case "ThunderBolt":
    case "SoulFireBall": {
      const enemy2 = requireEnemy();
      action = () => {
        let damage = power(spell === "SoulFireBall" ? "SC" : "MC") *
          (spell === "SoulFireBall" && level >= 4 ? 2 : 1);
        if (spell === "ThunderBolt" && g.monsters.get(enemy2.definition)?.Undead)
          damage = Math.trunc(damage * 1.5);
        const e = g.schedule(
          "hit",
          spell === "ThunderBolt" ? 500 : distance(r, enemy2) * 50 + 500,
          r,
          enemy2,
          damage,
          "MAC",
          spell,
        );
        e.location = { x: enemy2.x, y: enemy2.y };
      };
      break;
    }
    case "FlameDisruptor":
    case "FrostCrunch":
    case "Vampirism": {
      const enemy2 = requireEnemy();
      action = () => {
        let damage = power("MC");
        if (spell === "FlameDisruptor" && !g.monsters.get(enemy2.definition)?.Undead)
          damage = Math.trunc(damage * 1.5);
        const e = g.schedule(
          "hit",
          spell === "FrostCrunch" ? 500 + distance(r, enemy2) * 50 : 500,
          r,
          enemy2,
          damage,
          "MAC",
          spell,
        );
        e.level = level;
        if (spell !== "Vampirism") e.location = { x: enemy2.x, y: enemy2.y };
      };
      break;
    }
    case "TurnUndead": {
      const enemy2 = requireEnemy(),
        def = g.monsters.get(enemy2.definition);
      if (!def.Undead) throw new LocalizedError(message("core.magic.castMagic.4c5437b4ae"));
      action = () => {
        if (
          g.rng.next(2) + r.level - 1 <= def.Level ||
          g.rng.next(100) >= ((level + 1) << 3) + r.level - def.Level + 15
        )
          enemy2.target = r.id;
        else g.schedule("kill", 500, r, enemy2, 0, "None", spell);
      };
      break;
    }
    case "Fury":
      action = () => g.deferBuff(r, r, spell, 6e4 + level * 1e4, 0, { AttackSpeed: 4 });
      break;
    case "Repulsion":
    case "EnergyRepulsor":
      action = () => {
        let result = false;
        for (const enemy2 of enemies2().filter((a) => distance(a, r) <= 1)) {
          const enemyLevel = g.monsters.get(enemy2.definition).Level;
          if (enemyLevel >= r.level || g.rng.next(20) >= 6 + level * 3 + r.level - enemyLevel)
            continue;
          result =
            push(g, r, enemy2, direction(r, enemy2), 1 + Math.max(0, level - 1) + g.rng.next(2)) >
              0 || result;
        }
        if (result) g.levelSkill(r, s);
      };
      break;
    case "LionRoar":
      action = () => {
        const e = g.schedule("magic", 500, r, r, 0, "None", spell);
        e.level = level;
        e.location = { x: r.x, y: r.y };
      };
      break;
    case "Entrapment": {
      const enemy2 = requireEnemy();
      action = () => {
        const e = g.schedule("magic", 500, r, enemy2, 0, "None", spell);
        e.level = level;
      };
      break;
    }
    case "Revelation": {
      if (!target || target.dead || !["monster", "player"].includes(target.kind))
        throw new LocalizedError(message("core.magic.castMagic.3337a45d3e"));
      const recipient = target;
      action = () => {
        const e = g.schedule(
          "magic",
          500,
          r,
          recipient,
          attackPower(r.stats, "SC", g.rng) + magicPower(d, level, g.rng),
          "None",
          spell,
        );
        e.level = level;
      };
      break;
    }
    case "PetEnhancer": {
      if (!target || target.dead || !target.friendly || target.kind !== "monster")
        throw new LocalizedError(message("core.magic.castMagic.b8a1fd496b"));
      const pet = target,
        petLevel = g.monsters.get(pet.definition).Level;
      action = () =>
        g.deferBuff(
          r,
          pet,
          spell,
          (attackPower(r.stats, "SC", g.rng) + magicPower(d, level, g.rng)) * 1e3,
          0,
          {
            MinDC: 2 + petLevel * 2,
            MaxDC: 2 + petLevel * 2,
            MinAC: 4 + petLevel,
            MaxAC: 4 + petLevel,
          },
        );
      break;
    }
    case "UltimateEnhancer": {
      const ally = target && !target.dead && (target.friendly || target.id === r.id) ? target : r,
        consume = reagent(0, 1);
      action = () => {
        consume();
        const key =
          ally.kind !== "player" || ally.job === "Warrior"
            ? "MaxDC"
            : ally.job === "Wizard"
              ? "MaxMC"
              : "MaxSC";
        g.buff(ally, spell, (attackPower(r.stats, "SC", g.rng) * 4 + (level + 1) * 50) * 1e3, 0, {
          [key]: (r.stats.MaxSC || 0) >= 5 ? Math.min(8, Math.trunc(r.stats.MaxSC / 5)) : 1,
        });
      };
      break;
    }
    case "EnergyShield":
      action = () => {
        const chance = Math.max(2, 10 - (Math.trunc((r.stats.Luck || 0) / 3) + level + 1));
        const value = roundEven(
          (attackPower(r.stats, "SC", g.rng) / 4) * (level + 1) + d.PowerBase,
        );
        g.buff(r, spell, (30 + 50 * level) * 1e3, 0, {
          EnergyShieldPercent: roundEven(100 / chance),
          EnergyShieldHPGain: value,
        });
      };
      break;
    case "BladeAvalanche":
      action = () => {
        let raw = attackPower(r.stats, "DC", g.rng);
        if (g.rng.next(100) <= 1 + (r.stats.Luck || 0)) raw *= 2;
        const damage = magicDamage(d, level, raw, g.rng),
          dir2 = dirs.indexOf(data.Direction) >= 0 ? dirs.indexOf(data.Direction) : r.dir;
        for (const offset of [-1, 0, 1]) {
          const side = vectors[(dir2 + offset + 8) % 8],
            forward = vectors[dir2];
          for (let j = 0; j < 3; j++)
            for (const enemy2 of enemies2().filter(
              (a) =>
                a.x === r.x + side[0] + forward[0] * j && a.y === r.y + side[1] + forward[1] * j,
            ))
              g.damage(r, enemy2, j <= 1 ? damage : Math.trunc(damage * 0.6), "MAC", spell);
        }
      };
      break;
    case "Healing": {
      const ally = target && !target.dead && (target.id === r.id || target.friendly) ? target : r;
      target = ally;
      action = () =>
        g.schedule(
          "heal",
          500,
          r,
          ally,
          magicDamage(d, level, attackPower(r.stats, "SC", g.rng) * 2, g.rng) + r.level,
          "None",
          spell,
        );
      break;
    }
    case "MagicShield":
      action = () => {
        if (r.buffs.some((b) => b.type === "MagicShield")) return;
        const duration = roundEven(
          ((attackPower(r.stats, "MC", g.rng) + 15) / 4) * (level + 1) +
            (d.PowerBonus > 0 ? g.rng.next(d.PowerBase + d.PowerBonus, d.PowerBase) : d.PowerBase),
        );
        g.deferBuff(r, r, spell, duration * 1e3, level);
      };
      break;
    case "ProtectionField":
      action = () => {
        const n = roundEven((r.stats.MaxAC || 0) * (0.2 + 0.03 * level));
        g.buff(r, spell, (45 + 15 * level) * 1e3, 0, { MinAC: n, MaxAC: n });
      };
      break;
    case "Rage":
      action = () => {
        const n = roundEven((r.stats.MaxDC || 0) * (0.12 + 0.03 * level));
        g.buff(r, spell, (18 + 6 * level) * 1e3, 0, { MinDC: n, MaxDC: n });
      };
      break;
    case "MagicBooster":
      action = () =>
        g.deferBuff(r, r, spell, 6e4, 0, {
          MinMC: 6 + level * 6,
          MaxMC: 6 + level * 6,
          ManaPenaltyPercent: 6 + level,
        });
      break;
    case "Purification": {
      const ally = target && (target.id === r.id || target.friendly) ? target : r;
      action = () => {
        const e = g.schedule("magic", 500, r, ally, 0, "None", spell);
        e.level = level;
      };
      break;
    }
    case "Hiding": {
      const consume = reagent(0, 1);
      action = () => {
        consume();
        g.deferBuff(r, r, "Hiding", (attackPower(r.stats, "SC", g.rng) + (level + 1) * 5) * 1e3);
      };
      break;
    }
    case "Poisoning": {
      const targets = enemies2().filter((a) => targetableMonster(a) && distance(r, a) <= (d.Range || 7)),
        poison = [...r.equipment, ...r.inventory].find(
          (i) =>
            i &&
            g.defs.get(i.id)?.Type === "Amulet" &&
            g.defs.get(i.id)?.DreamType !== 17 &&
            [1, 2].includes(g.defs.get(i.id).Shape),
        );
      const shape = poison ? g.defs.get(poison.id).Shape : 1;
      action = () => {
        const n = power("SC");
        for (const enemy2 of targets) g.deferBuff(
          r,
          enemy2,
          shape === 1 ? "Green" : "Red",
          (n * 2 + (level + 1) * 7) * 2e3,
          Math.trunc(n / 15) + level + 1 + g.rng.next(r.stats.PoisonAttack || 0),
          {},
          500,
          2e3,
          spell,
        );
      };
      break;
    }
    case "SummonSkeleton":
    case "SummonShinsu":
    case "SummonHolyDeva": {
      const name =
        g.rules.monsterSettings[
          spell === "SummonSkeleton"
            ? "SkeletonName"
            : spell === "SummonShinsu"
              ? "ShinsuName"
              : "AngelName"
        ];
      const existing = Object.values(g.maps)
        .flatMap((m) => m.actors)
        .find((a) => a.master === r.id && a.name === name && !a.dead);
      const consume = existing
        ? () => {}
        : reagent(0, spell === "SummonSkeleton" ? 1 : spell === "SummonShinsu" ? 5 : 2);
      action = () => {
        if (!existing) g.levelSkill(r, s);
        consume();
        const e = g.schedule(
          "magic",
          !existing && spell === "SummonHolyDeva" ? 1500 : 500,
          r,
          r,
          0,
          "None",
          spell,
        );
        e.level = level;
      };
      break;
    }
    case "FireBang":
    case "IceStorm": {
      const center = target ?? loc;
      action = () => {
        const damage = power("MC");
        for (const a of enemies2().filter((a2) => distance(a2, center) <= 1))
          g.schedule("hit", 500, r, a, damage, "MAC", spell);
      };
      break;
    }
    case "HellFire":
    case "Lightning": {
      action = () => {
        const damage = power("MC"),
          range = spell === "HellFire" ? 4 : 8,
          dd = Number.isInteger(dirs.indexOf(data.Direction))
            ? dirs.indexOf(data.Direction)
            : r.dir;
        for (const a of enemies2()) {
          const delta = (direction(r, a) - dd + 8) % 8;
          if (
            distance(r, a) <= range &&
            (delta === 0 || (spell === "HellFire" && level === 3 && [1, 7].includes(delta)))
          )
            g.schedule("hit", 500, r, a, damage, "MAC", spell);
        }
      };
      break;
    }
    case "ThunderStorm":
    case "FlameField": {
      action = () => {
        const damage = power("MC");
        for (const a of enemies2().filter((a2) => distance(a2, r) <= 2))
          g.schedule(
            "hit",
            500,
            r,
            a,
            spell === "ThunderStorm" && !g.monsters.get(a.definition)?.Undead
              ? Math.trunc(damage / 10)
              : damage,
            "MAC",
            spell,
          );
      };
      break;
    }
    case "SoulShield":
    case "BlessedArmour": {
      const consume = reagent(0, 1),
        center = target ?? loc;
      action = () => {
        consume();
        const duration = attackPower(r.stats, "SC", g.rng) * 4 + (level + 1) * 50;
        for (const ally of [r, ...g.map(r.map).actors.filter((a) => a.friendly && !a.dead)].filter(
          (a) => distance(a, center) <= 3,
        )) {
          const lev = ally.kind === "player" ? ally.level : g.monsters.get(ally.definition).Level;
          g.deferBuff(
            r,
            ally,
            spell,
            duration * 1e3,
            0,
            {
              [spell === "SoulShield" ? "MaxMAC" : "MaxAC"]: Math.trunc(lev / 7) + 4,
            },
            distance(r, center) * 50 + 500,
          );
        }
      };
      break;
    }
    case "MassHealing": {
      const center = target ?? loc;
      action = () => {
        const value = power("SC");
        for (const ally of [r, ...g.map(r.map).actors.filter((a) => a.friendly && !a.dead)].filter(
          (a) => distance(a, center) <= 1,
        ))
          g.schedule("heal", 500, r, ally, value, "None", spell);
      };
      break;
    }
    case "MassHiding": {
      reagent(0, 1);
      const center = target ?? loc;
      action = () => {
        const duration = Math.trunc(attackPower(r.stats, "SC", g.rng) / 2) + (level + 1) * 2;
        for (const ally of [r, ...g.map(r.map).actors.filter((a) => a.friendly && !a.dead)].filter(
          (a) => distance(a, center) <= 1,
        ))
          g.deferBuff(r, ally, "Hiding", duration * 1e3, 0, {}, distance(r, center) * 50 + 500);
      };
      break;
    }
    case "Blink":
      if (!g.walkable(r.map, loc.x, loc.y, r.id))
        throw new LocalizedError(message("core.magic.castMagic.758eaa2d29"));
      action = () => {
        const e = g.schedule("magic", 200, r, r, 0, "None", spell);
        e.level = level;
        e.location = { ...loc };
      };
      break;
    case "Teleport":
      if (!g.geometry.has(g.rules.world.maps.find((m) => m.start).id))
        throw new LocalizedError(message("core.magic.castMagic.be0f3f005d"));
      action = () => {
        const e = g.schedule("magic", 200, r, r, 0, "None", spell);
        e.level = level;
      };
      break;
    case "FireWall": {
      const center = target ?? loc;
      action = () => {
        const e = g.schedule("magic", 500, r, r, power("MC"), "None", spell);
        e.level = level;
        e.location = { x: center.x, y: center.y };
      };
      break;
    }
    default:
      throw new LocalizedError(message("core.magic.castMagic.26a8666f16"));
  }
  const firstEvent = g.nextOrder;
  action();
  if (settlementTraining.has(spell))
    for (const e of g.events.filter((e2) => e2.order >= firstEvent)) e.trainSpell = spell;
  r.mp -= cost;
  r.actionAt = g.time + 600;
  r.attackAt = g.time + 600;
  r.spellAt = g.time + (spell === "FlameField" ? 2500 : 1800);
  r.regenAt = g.time + 1e4;
  s.CastTime = g.time + d.DelayBase - level * d.DelayReduction;
  const dir = dirs.indexOf(data.Direction);
  if (dir >= 0) r.dir = dir;
  if (
    !settlementTraining.has(spell) &&
    ![
      "Repulsion",
      "EnergyRepulsor",
      "ShoulderDash",
      "SummonSkeleton",
      "SummonShinsu",
      "SummonHolyDeva",
      "Mirroring",
    ].includes(spell)
  )
    g.levelSkill(r, s);
  g.emit("Magic", {
    ObjectID: r.id,
    Spell: spell,
    Cast: true,
    Direction: dirs[r.dir],
    Target: target ?? loc,
    TargetID: target?.id || 0,
  });
}

// games/darkforged/singleplayer/core/assist.ts
var AUTO_MAGIC_SPELLS = ["FlameDisruptor", "ThunderBolt", "GreatFireBall", "FireBall"];
function assistSettings(value) {
  const percent = (v, fallback) =>
    typeof v === "number" && Number.isFinite(v)
      ? Math.max(1, Math.min(99, Math.round(v)))
      : fallback;
  return {
    hpEnabled: value?.hpEnabled === true,
    hpPercent: percent(value?.hpPercent, 70),
    mpEnabled: value?.mpEnabled === true,
    mpPercent: percent(value?.mpPercent, 30),
    flamingSword: value?.flamingSword === true,
    blazingSword: value?.blazingSword === true,
    autoMagic: value?.autoMagic === true,
    autoShield: value?.autoShield === true,
    autoMagicSpell: AUTO_MAGIC_SPELLS.includes(value?.autoMagicSpell || "")
      ? value.autoMagicSpell
      : "auto",
  };
}
var timers = /* @__PURE__ */ new WeakMap();
var manualCasts = /* @__PURE__ */ new WeakMap();
function clearManualCast(r) {
  manualCasts.delete(r);
}
function castManualMagic(g, r, data) {
  manualCasts.delete(r);
  const skill =
    data.Queue === true &&
    r.job === "Wizard" &&
    (r.assist?.autoMagic || r.assist?.autoShield) &&
    g.skill(r, String(data.Spell));
  if (
    skill &&
    !skill.d.DreamSkill?.passive &&
    g.time >= skill.s.CastTime &&
    skill.d.Spell !== "MagicShield"
  )
    tryAutomaticShield(g, r, Number(data.TargetID) || 0);
  if (
    skill &&
    !skill.d.DreamSkill?.passive &&
    g.time >= skill.s.CastTime &&
    g.time < Math.max(r.spellAt, r.actionAt)
  ) {
    manualCasts.set(r, {
      map: r.map,
      x: r.x,
      y: r.y,
      expires: g.time + 3e3,
      data: { ...data, Queue: false },
    });
    return;
  }
  castMagic(g, r, { ...data, Queue: false });
}
function processManualCast(g, r) {
  const pending = manualCasts.get(r);
  if (!pending) return false;
  if (
    r.dead ||
    r.map !== pending.map ||
    r.x !== pending.x ||
    r.y !== pending.y ||
    mountedItem(g, r) ||
    g.time > pending.expires
  ) {
    manualCasts.delete(r);
    return false;
  }
  if (g.time < Math.max(r.spellAt, r.actionAt)) return true;
  manualCasts.delete(r);
  const id = Number(pending.data.TargetID) || 0;
  const target = id ? g.actor(id) : void 0;
  if (id && (!target || target.dead || target.map !== r.map) && !pending.data.AutoPlace)
    return false;
  try {
    castMagic(g, r, pending.data);
  } catch (error) {
    g.say(errorText(error));
  }
  return true;
}
var swordSkills = [
  ["blazingSword", "BlazingSword"],
  ["flamingSword", "FlamingSword"],
];
function prepareSword(g, r, spell) {
  const magic = g.skill(r, spell);
  if (!magic || g.time < magic.s.CastTime) return false;
  const cost = magic.d.DreamSkill
    ? skillCost(magic.d, magic.level, r.stats)
    : magic.d.BaseCost + magic.s.Level * magic.d.LevelCost;
  if (r.mp < cost) return false;
  toggleMagic(g, r, spell, true);
  return true;
}
function automaticMeleeSpell(g, r, requested) {
  if (r.job !== "Warrior" || g.safe(r)) return requested;
  if (swordSkills.some(([, spell]) => spell === requested)) return requested;
  for (const [key, spell] of swordSkills) if (r.attackModes[key]) return spell;
  for (const [key, spell] of swordSkills)
    if (r.assist?.[key] && prepareSword(g, r, spell) && r.attackModes[key]) return spell;
  return requested;
}
function tryAutomaticShield(g, r, targetId = 0) {
  if (
    r.job !== "Wizard" ||
    !r.assist?.autoShield ||
    r.dead ||
    mountedItem(g, r) ||
    g.safe(r) ||
    g.time < Math.max(r.spellAt, r.actionAt) ||
    r.buffs.some((b) => b.type === "MagicShield" && b.until > g.time)
  )
    return false;
  const shield = g.skill(r, "MagicShield");
  if (!shield || g.time < shield.s.CastTime || r.mp < skillCost(shield.d, shield.level, r.stats))
    return false;
  const moving = g.time < Number(r.special?.assistMoveUntil || 0);
  const threatened = g.map(r.map).actors.some((a) => {
    if (a.kind !== "monster" || a.dead || a.friendly || !targetableMonster(a) || distance(r, a) > 6)
      return false;
    if (a.target === r.id) return true;
    return (!moving || a.id === targetId || a.id === r.target) && hydraSight(g, r.map, r, a);
  });
  if (!threatened) return false;
  castMagic(g, r, {
    Spell: "MagicShield",
    TargetID: r.id,
    Location: { X: r.x, Y: r.y },
    Direction: dirs[r.dir],
  });
  return true;
}
function assistTick(g, r) {
  if (tryAutomaticShield(g, r) || processManualCast(g, r) || processHydraRequest(g, r)) return;
  if (r.dead || !r.assist) return;
  const cfg = assistSettings(r.assist);
  let next = timers.get(r);
  if (!next) {
    next = { hp: 0, mp: 0 };
    timers.set(r, next);
  }
  migrateItemHotkeys(r, g.defs);
  for (const [kind, key, enabled2, percent, max, pending, stat] of [
    ["hp", 0, cfg.hpEnabled, cfg.hpPercent, r.maxHP, r.potHP, "HP"],
    ["mp", 1, cfg.mpEnabled, cfg.mpPercent, r.maxMP, r.potMP, "MP"],
  ]) {
    if (
      !enabled2 ||
      max <= 0 ||
      r[kind] * 100 >= max * percent ||
      pending > 0 ||
      g.time < next[kind]
    )
      continue;
    const item = r.inventory.find((i) => i?.id === r.itemHotkeys?.[key]);
    if (!item) continue;
    const def = g.defs.get(item.id);
    if (def?.Type !== "Potion" || ![0, 1].includes(def.Shape) || !(def.Stats[stat] > 0)) continue;
    next[kind] = g.time + 1e3;
    try {
      g.checkUse(r, def);
    } catch {
      continue;
    }
    g.useItem(r, item.uid);
  }
  if (mountedItem(g, r)) return;
  if (
    (r.job === "Wizard" || r.job === "Taoist") &&
    cfg.autoMagic &&
    !g.safe(r) &&
    g.time >= Math.max(r.actionAt, r.spellAt, Number(r.special?.assistMoveUntil || 0))
  ) {
    const targets = g
      .map(r.map)
      .actors.filter(
        (a) =>
          a.kind === "monster" &&
          !a.dead &&
          !a.friendly &&
          targetableMonster(a) &&
          distance(r, a) <= 6,
      );
    targets.sort(
      (a, b) =>
        Number(b.id === r.target) - Number(a.id === r.target) ||
        distance(r, a) - distance(r, b) ||
        a.id - b.id,
    );
    if (targets.length) {
      const spell =
        r.job === "Taoist"
          ? "SoulFireBall"
          : cfg.autoMagicSpell === "auto"
            ? AUTO_MAGIC_SPELLS.find((s) => g.skill(r, s))
            : cfg.autoMagicSpell;
      const magic = spell ? g.skill(r, spell) : void 0;
      if (magic && g.time >= magic.s.CastTime && r.mp >= skillCost(magic.d, magic.level, r.stats)) {
        const target = targets.find(
          (a) => distance(r, a) <= magic.d.Range && canReachDreamSpell(g, r, magic.d.Spell, a),
        );
        if (target) {
          if (r.job === "Taoist") g.focusMonster(r, target.id);
          castMagic(g, r, {
            Spell: magic.d.Spell,
            TargetID: target.id,
            Location: { X: target.x, Y: target.y },
            Direction: dirs[r.dir],
          });
          return;
        }
      }
    }
  }
}

// games/darkforged/singleplayer/core/dream-combat.ts
function attackDream(g, r, target, spell, aim) {
  if (!g.rules.skills.some((d) => d.DreamSkill)) return false;
  if (target) spell = automaticMeleeSpell(g, r, spell);
  let chosen = g.skill(r, spell);
  if (spell !== "None" && !chosen?.d.DreamSkill) return false;
  const interval = attackDelay(r.level, r.stats, true);
  r.dir = direction(r, aim || target);
  r.attackAt = g.time + interval;
  r.actionAt = g.time + Math.min(550, interval);
  r.regenAt = g.time + 1e4;
  const raw = nativeAbility(g, r, "DC"),
    all = g
      .map(r.map)
      .actors.filter(
        (a) =>
          a.kind === "monster" &&
          !a.friendly &&
          !a.dead &&
          a.special?.visible !== false &&
          !a.special?.stoned,
      );
  const key = spell[0].toLowerCase() + spell.slice(1);
  if (
    spell === "Slaying" ||
    (["FlamingSword", "BlazingSword", "HalfMoon", "WhirlwindSlash", "Thrusting"].includes(spell) &&
      !r.attackModes[key])
  )
    spell = "None";
  const send = (a, value, defence = "AC", sp = spell) =>
    a ? g.schedule("hit", 350, r, a, Math.trunc(value), defence, sp) : void 0;
  let processed = false,
    shown = spell;
  if (chosen && ["HalfMoon", "WhirlwindSlash"].includes(spell)) {
    const cost = skillCost(chosen.d, chosen.level, r.stats);
    if (r.mp < cost) spell = "None";
    else r.mp -= cost;
  }
  if (chosen && ["FlamingSword", "BlazingSword"].includes(spell)) {
    const damage = Math.trunc(
      Math.fround(raw * Math.fround(dreamCoefficient(chosen.d, chosen.level))),
    );
    send(target, damage);
    r.attackModes[key] = false;
    processed = true;
    if (spell === "BlazingSword")
      for (const a of all) {
        const dist = distance(r, a);
        if (a !== target && direction(r, a) === r.dir && dist >= 2 && dist <= 5)
          send(a, Math.trunc(Math.fround(damage * Math.fround(1 - (dist - 1) * 0.1))));
      }
  } else if (chosen && ["HalfMoon", "WhirlwindSlash"].includes(spell)) {
    for (const a of all) {
      const delta = (direction(r, a) - r.dir + 8) % 8;
      if (distance(r, a) !== 1 || (spell === "HalfMoon" && ![7, 0, 1, 2, 3].includes(delta)))
        continue;
      const e = send(
        a,
        a === target
          ? raw
          : Math.trunc(Math.fround(raw * Math.fround(dreamCoefficient(chosen.d, chosen.level)))),
        a === target ? "AC" : "ACNoArmor",
      );
      if (
        e &&
        spell === "WhirlwindSlash" &&
        a !== target &&
        g.monsters.get(a.definition).Level <= r.level &&
        g.rng.next(100) < Math.min(100, chosen.level * 2)
      )
        e.effect = {
          type: "NativeWhirlwindStun",
          duration: 1800 + g.rng.next(Math.max(1, chosen.level * 100)),
          value: 0,
          stats: {},
        };
    }
    processed = true;
  }
  const slaying = g.skill(r, "Slaying"),
    cleave = g.skill(r, "SkyCleaver");
  const slayChance = slaying ? 20 : 0,
    cleaveChance = cleave ? Math.min(20, 6 + 2 * cleave.level) : 0;
  const proc = slayChance + cleaveChance > 0 ? g.rng.next(100) : 100;
  if (slaying && proc < slayChance) {
    send(target, Math.trunc(((r.stats.MaxDC || 0) * (14 + slaying.level)) / 10), "AC", "Slaying");
    if (!["FlamingSword", "BlazingSword"].includes(spell)) shown = "Slaying";
    processed = true;
  } else if (cleave && proc < slayChance + cleaveChance) {
    const damage = Math.trunc(
      Math.fround(
        nativeAbility(g, r, "DC") * Math.fround(dreamCoefficient(cleave.d, cleave.level)),
      ),
    );
    for (const a of all) {
      const dist = distance(r, a);
      if (direction(r, a) === r.dir && dist >= 1 && dist <= 3)
        send(
          a,
          Math.trunc(Math.fround(damage * Math.fround(1 - (dist - 1) * 0.1))),
          "AC",
          "SkyCleaver",
        );
    }
    if (!["FlamingSword", "BlazingSword"].includes(spell)) shown = "SkyCleaver";
    processed = true;
  }
  if (!processed) {
    send(target, raw, "AC", "None");
    if (chosen && spell === "Thrusting") {
      const cost = skillCost(chosen.d, chosen.level, r.stats);
      if (r.mp >= cost) {
        r.mp -= cost;
        const [dx, dy] = vectors[r.dir];
        for (const a of all)
          if (a.x === r.x + dx * 2 && a.y === r.y + dy * 2)
            send(
              a,
              Math.trunc(Math.fround(raw * Math.fround(dreamCoefficient(chosen.d, chosen.level)))),
              "ACNoArmor",
              "Thrusting",
            );
      }
    }
  }
  r.attackModes.slaying = false;
  g.emit("ObjectAttack", { ObjectID: r.id, Direction: dirs[r.dir], Spell: shown });
  return true;
}
function moonSpiritAttackPower(g, source, raw) {
  if (!source.special?.dreamPet || g.monsters.get(source.definition)?.DreamOriginalId !== 144)
    return raw;
  const owner = g.roles.find((r) => r.id === source.master),
    skill = owner && g.skill(owner, "SummonMoonSpirit");
  if (!owner || !skill) return raw;
  const cost = skill.level * 5;
  if (owner.mp <= cost) return 0;
  owner.mp -= cost;
  const sc = Math.trunc(nativeAbility(g, owner, "SC") / 2);
  return (
    raw +
    Math.max(
      Math.trunc(sc * (0.6 + 0.3 * skill.level)),
      Math.trunc(sc * 2 * (petInheritance(g, source)?.attack || 0) + 1e-9),
    )
  );
}
function dreamOutgoing(g, source, target, raw, spell) {
  if (source.special?.dreamPet && source.master) {
    const owner = g.roles.find((r) => r.id === source.master);
    const native = g.monsters.get(source.definition)?.DreamOriginalId;
    if (owner && !source.special?.dreamTamed && native !== 144) {
      const inheritance = petInheritance(g, source);
      if (inheritance) {
        const state3 = native === 99 ? 27 : [14, 62].includes(Number(native) || 0) ? 24 : 0;
        const enhancement = state3
          ? Math.max(0, owner.stats["NativeState:" + state3] || 0) * 0.0625
          : 0;
        const sc = nativeAbility(g, owner, "SC"),
          enhancedSC = native === 99 ? Math.trunc(Math.fround(sc / 1.2)) : sc;
        return raw + Math.trunc(sc * inheritance.attack + enhancedSC * enhancement + 1e-9);
      }
      if (native === 99 || native === 62) {
        const skill = g.skill(owner, native === 99 ? "SummonTiger" : "AdvancedSummon");
        if (skill) {
          const rank = skill.s.Level,
            sc = nativeAbility(g, owner, "SC");
          const inherited =
            native === 99 ? Math.trunc(Math.fround(Math.fround(sc) / Math.fround(1.2))) : sc;
          const base = Math.fround(
            native === 99 ? Math.min(0.5, 0.2 + rank / 10) : Math.min(0.9, 0.3 + rank / 5),
          );
          const enhancement = Math.max(
            0,
            Math.trunc(owner.stats["NativeState:" + (native === 99 ? 27 : 24)] || 0),
          );
          const factor = Math.fround(base + Math.fround(Math.fround(enhancement) * 0.0625));
          raw += Math.trunc(Math.fround(inherited * factor));
        }
      } else if (native === 14 || native === 29) {
        const skill = g.skill(owner, "SummonShinsu");
        if (skill) {
          const base = Math.fround(
            Math.min(native === 14 ? 0.5 : 1, (native === 14 ? 0.2 : 0.3) + skill.s.Level / 10),
          );
          const extra =
            native === 14 ? Math.max(0, owner.stats["NativeState:24"] || 0) * 0.0625 : 0;
          raw += Math.trunc(Math.fround(nativeAbility(g, owner, "SC") * Math.fround(base + extra)));
        }
      }
    }
  }
  if (source.kind !== "player") return raw;
  const kind = source.job === "Wizard" ? "MC" : source.job === "Taoist" ? "SC" : "DC";
  raw *= 1 + (source.stats["Native" + kind + "DamagePercent"] || 0) / 100;
  const state2 = { FlamingSword: 22, IceStorm: 23, BlazingSword: 25, FlameDisruptor: 26 }[
    spell || ""
  ];
  if (state2) raw *= 1 + (source.stats["NativeState:" + state2] || 0) / 10;
  const d = g.rules.skills.find((d2) => d2.Spell === spell);
  if (d?.DreamSkill) {
    if (d.DreamOriginalId >= 29 && d.DreamOriginalId <= 45)
      raw *= 1 + (source.stats.DreamMagicDamagePercent || 0) / 100;
    if (
      d.DreamSkill.element === 5 &&
      target.buffs.some((b) => b.until > g.time && (b.type === "DreamFrost" || b.type === "Frozen"))
    )
      raw *= 1.5;
    if (d.DreamSkill.element === 2) raw *= 1 + (source.stats.SpiritDamagePercent || 0) / 100;
    raw *= 1 + (source.stats["SkillDamage:" + d.Spell] || 0) / 100;
  }
  return Math.floor(raw);
}
function dreamIncoming(g, target, amount, defence) {
  if (defence === "None" || target.kind !== "player" || amount <= 0) return amount;
  const r = target,
    shield = r.buffs.find((b) => b.type === "MagicShield");
  if (shield && g.skill(r, "MagicShield")?.d.DreamSkill) {
    const l = Math.min(10, g.skill(r, "MagicShield").level),
      v = Math.min(3, l),
      factor = Math.fround(0.17),
      base = Math.fround(v * factor),
      reduction = Math.min(
        Math.fround(base + Math.fround(nativeAbility(g, r, "MC") / 1024)),
        Math.fround(base + factor),
      );
    const absorbed = Math.trunc(Math.fround(Math.fround(amount * reduction) + 1));
    amount = Math.max(0, amount - absorbed);
    if (absorbed > 0 && g.time > shield.until - 3e3) {
      r.buffs = r.buffs.filter((b) => b !== shield);
      g.refreshActor(r);
    }
  }
  const qi = r.buffs.find((b) => b.type === "InnateQi");
  if (qi) {
    const rank = g.skill(r, "InnateQi")?.level || qi.value;
    amount = Math.trunc(amount * (1 - Math.min(90, Math.max(0, rank - 3) * 6) / 100));
  }
  const diamond = r.buffs.find((b) => b.type === "DiamondBody");
  if (diamond) {
    const rank = g.skill(r, "DiamondBody")?.level || diamond.value,
      v = Math.min(3, rank);
    if (g.rng.next(5) < rank) amount = Math.trunc(Math.fround(amount * Math.fround(1 - v * 0.05)));
  }
  if (shield && r.buffs.includes(shield)) {
    const learned = g.skill(r, "MagicShield")?.s.Level || 0;
    if (learned > 3) {
      amount = Math.min(amount, Math.trunc(r.maxHP * Math.max(0.05, 0.55 - (learned - 3) * 0.05)));
      if (g.rng.next(120) < (learned - 3) * 10 && r.hp / r.maxHP < 0.4) amount = 0;
    }
  }
  return amount;
}
function queueNativeRecovery(g, r, total, steps) {
  const rows = (r.nativeRecovery ??= []);
  const chunk = Math.trunc(total / steps);
  if (chunk > 0 && rows.length < 4)
    rows.push({ remaining: Math.trunc(total), chunk, next: g.time + 1e3 });
}
function queueNativeHealing(g, a, total) {
  const rows = (a.nativeHealing ??= []);
  if (total > 0 && rows.length < 4)
    rows.push({
      remaining: Math.trunc(total),
      chunk: Math.max(1, Math.trunc(total / 5)),
      next: g.time + 1e3,
    });
}
function recoverNative(g, r) {
  if (r.dead) {
    if (r.nativeRecovery) r.nativeRecovery = [];
    if (r.nativeHealing) r.nativeHealing = [];
    return;
  }
  for (const key of ["nativeRecovery", "nativeHealing"]) {
    if (!r[key]?.length) continue;
    for (const row of r[key] || [])
      if (g.time >= row.next) {
        const amount = Math.min(row.remaining, row.chunk);
        row.remaining -= amount;
        row.next = g.time + 1e3;
        r.hp = Math.min(r.maxHP, r.hp + amount);
      }
    r[key] = r[key]?.filter((row) => row.remaining > 0);
  }
}
function dreamAfterHit(g, source, target, amount, defence, raw = amount, spell) {
  if (target.kind !== "player" || defence === "None" || target.dead) return;
  const r = target,
    qi = r.buffs.find((b) => b.type === "InnateQi"),
    diamond = r.buffs.find((b) => b.type === "DiamondBody");
  if (qi) {
    const rank = g.skill(r, "InnateQi")?.level || qi.value;
    queueNativeRecovery(g, r, Math.trunc((amount * rank) / 10), rank >= 6 ? 2 : rank >= 4 ? 3 : 4);
  }
  if (spell === "DiamondReflect" || spell === "NativeReflect") return;
  if (diamond && !source.dead) {
    const rank = g.skill(r, "DiamondBody")?.level || diamond.value,
      v = Math.min(3, rank);
    if (g.rng.next(15) < rank)
      g.schedule(
        "hit",
        500,
        r,
        source,
        Math.trunc(Math.fround(raw * Math.fround(0.35 + 0.1 * v))),
        "AC",
        "DiamondReflect",
      );
  }
  if (r.stats.NativeReflectPercent && !source.dead)
    g.schedule(
      "hit",
      500,
      r,
      source,
      Math.trunc((raw * r.stats.NativeReflectPercent) / 100) + 1,
      "ACBypass",
      "NativeReflect",
    );
}


function tickDreamBuff(g, a, b) {
  if (b.type !== "DragonFlame" || a.kind !== "player") return;
  const r = a,
    skill = g.skill(r, "DragonFlame");
  if (!skill) return;
  for (const target of g
    .map(a.map)
    .actors.filter((m) => m.kind === "monster" && !m.friendly && !m.dead && distance(m, a) <= 2))
    g.damage(
      a,
      target,
      magicDamage(skill.d, b.value, nativeAbility(g, a, "MC"), g.rng),
      "MAC",
      "DragonFlame",
    );
}

// games/darkforged/singleplayer/core/monsters.ts
function initializeMonster(g, a, d) {
  const s = (a.special = { stage: monsterCombatProfile(g, a)?.healthStages?.count ?? 7 });
  const boss = monsterCombatProfile(g, a);
  if (boss?.regeneration?.initialDelayMs !== void 0)
    s.bossRegenAt = g.time + boss.regeneration.initialDelayMs;
  if (boss?.burrow || (!boss && [14, 24].includes(d.AI)))
    Object.assign(s, { visible: false, visibleAt: 0 });
  if (boss?.stone || (!boss && [15, 17].includes(d.AI))) Object.assign(s, { stoned: true });
  if (d.AI === 25) Object.assign(s, { lives: g.rng.next(3), revivals: 0 });
  if (d.AI === 2) Object.assign(s, { runAway: g.rng.next(7) === 0 });
}
var visibleMonster = (a) => a.special?.visible !== false;
var targetableMonster = (a) => visibleMonster(a) && !a.special?.stoned;
var moveSpeed = (g, a) =>
  a.special?.madUntil && Number(a.special.madUntil) > g.time
    ? (monsterCombatProfile(g, a)?.healthStages?.moveMs ?? 400)
    : Math.max(0, (g.monsters.get(a.definition)?.MoveSpeed || 0) - (a.special?.runAway ? 300 : 0));
var attackSpeed = (g, a) =>
  a.special?.madUntil && Number(a.special.madUntil) > g.time
    ? (monsterCombatProfile(g, a)?.healthStages?.attackMs ?? 500)
    : Math.floor(
        g.monsters.get(a.definition).AttackSpeed /
          (1 + (a.special?.nativeAffixType === 10010 ? Number(a.special.nativeAffixLow) / 10 : 0)),
      );
function bossHealthInterval(g, a, base, attack) {
  for (const branch of activeBossHealthBranches(g, a))
    base = attack
      ? (branch.attackIntervalMs ?? base) - (branch.attackIntervalReductionMs ?? 0)
      : (branch.moveIntervalMs ?? base);
  return base;
}
var slow = (g, a, base) =>
  g.monsters.get(a.definition)?.DreamRaw
    ? base + (a.buffs.some((b) => b.type === "Slow" && b.until > g.time) ? 600 : 0)
    : Number(a.special?.slowTicks) > 0
      ? Math.min(3500, base + Number(a.special?.slowTicks) * 100)
      : base;
function monsterActionCost(g, a, attack) {
  const raw = g.monsters.get(a.definition)?.DreamRaw;
  if (!raw) return 300;
  if (!attack)
    return Math.trunc(
      Math.fround((600 - Math.min(10, raw.MoveSpeed || 0) * 50) * Math.fround(1.2)),
    );
  const id = Number(g.monsters.get(a.definition)?.DreamOriginalId),
    frames = id === 80 ? 8 : [104, 136, 144].includes(id || 0) ? 10 : 6;
  return Math.max(50, (140 - (raw.AtkSpeed || 0) * 5) * (frames + 2) + 50);
}
var monsterMoveSpeed = (g, a) =>
  slow(
    g,
    a,
    Math.max(
      isSpirit(g, a) || g.monsters.get(a.definition)?.DreamRaw ? 0 : 400,
      bossHealthInterval(g, a, moveSpeed(g, a), false) -
        (a.special?.dreamPet ? Number(a.special.petLevel || 0) * 50 : 0) -
        (a.friendly &&
        !g.monsters.get(a.definition)?.DreamRaw &&
        ([18, 23, 38].includes(a.ai || 0) || !!a.special?.dreamPet)
          ? Number((a.special?.dreamPet ? a.special.petLevel : a.special?.maxPetLevel) || 0) * 130
          : 0),
    ),
  );
var monsterAttackSpeed = (g, a) =>
  slow(
    g,
    a,
    Math.max(
      g.monsters.get(a.definition)?.DreamRaw ? 0 : 400,
      (a.special?.dreamPet
        ? Math.max(
            200,
            bossHealthInterval(g, a, attackSpeed(g, a), true) -
              Number(a.special.petLevel || 0) * 50,
          )
        : bossHealthInterval(g, a, attackSpeed(g, a), true)) -
        (a.friendly &&
        !g.monsters.get(a.definition)?.DreamRaw &&
        ([18, 23, 38].includes(a.ai || 0) || !!a.special?.dreamPet)
          ? Number((a.special?.dreamPet ? a.special.petLevel : a.special?.maxPetLevel) || 0) * 70
          : 0),
    ),
  );
function prepareMonster(g, a, r) {
  if (isChallengeChest(g.monsters.get(a.definition), g.rules)) {
    a.target = 0;
    return false;
  }
  if (prepareDragonTotem(g, a)) return false;
  monsterAffixTick(g, a);
  const s = a.special || (a.special = {}),
    d = g.monsters.get(a.definition);
  if (a.friendly && s.tameUntil && g.time >= Number(s.tameUntil)) {
    a.friendly = false;
    a.master = void 0;
    a.target = 0;
    s.tameUntil = 0;
    g.say(
      message("core.monsters.prepareMonster.074787788c", {
        p0: entityText("monsters", a.definition),
      }),
    );
  }
  if (!a.dead && d.AI === 55 && a.master && g.time >= Number(s.mpAt || 0)) {
    const owner = g.actor(a.master);
    s.mpAt = g.time + 1e3;
    if (owner) {
      if (!owner.dead) owner.mp = Math.max(0, owner.mp - 10);
      if (owner.mp <= 0) {
        g.die(a, owner);
        return false;
      }
    }
  }
  if (a.dead) {
    if (d.AI === 25 && Number(s.revivals) < Number(s.lives) && g.time >= Number(s.reviveAt)) {
      s.revivals = Number(s.revivals) + 1;
      a.dead = false;
      a.expires = void 0;
      a.hp = Math.trunc((a.maxHP * (100 - 25 * Number(s.revivals))) / 100);
      a.actionAt = g.time + 300;
      g.emit("ObjectRevived", { ObjectID: a.id, Effect: true });
    } else return false;
  }
  const enemies2 = [r, ...g.map(a.map).actors.filter((m) => m.friendly)].filter(
    (m) => !m.dead && m.map === a.map && !g.safe(m),
  );
  const boss = monsterCombatProfile(g, a),
    burrow = boss?.burrow,
    stone = boss?.stone;
  if (burrow || (!boss && [14, 24].includes(d.AI))) {
    if ((burrow?.restoreHP || (!boss && d.AI === 14)) && !s.visible) a.hp = a.maxHP;
    if (g.time >= Number(s.visibleAt || 0)) {
      s.visibleAt = g.time + (burrow?.scanMs ?? 2e3);
      const near2 = enemies2.some(
        (m) =>
          distance(a, m) <=
          (s.visible ? (burrow?.hideRange ?? (d.AI === 14 ? 7 : 3)) : (burrow?.emergeRange ?? 3)),
      );
      if (!s.visible && near2) {
        s.visible = true;
        a.actionAt = g.time + (burrow?.emergeDelayMs ?? 2e3);
        g.emit("ObjectShow", { ObjectID: a.id });
      } else if ((burrow || d.AI === 14) && s.visible && !near2) {
        s.visible = false;
        s.visibleAt = g.time + (burrow?.hideDelayMs ?? 3e3);
        if (!burrow || burrow.restoreHP) a.hp = a.maxHP;
        g.emit("ObjectHide", { ObjectID: a.id });
      }
    }
    if (!s.visible) return false;
  }
  if ((stone || (!boss && [15, 17].includes(d.AI))) && s.stoned) {
    if (g.time >= a.actionAt && enemies2.some((m) => distance(a, m) <= (stone?.wakeRange ?? 2))) {
      for (const m of g
        .map(a.map)
        .actors.filter(
          (m2) =>
            (!!monsterCombatProfile(g, m2)?.stone ||
              (!monsterCombatProfile(g, m2) && [15, 17].includes(m2.ai || 0))) &&
            !m2.dead &&
            distance(m2, a) <= (stone?.groupRange ?? 14),
        )) {
        if (!m.special?.stoned) continue;
        m.special.stoned = false;
        m.actionAt = g.time + (stone?.wakeDelayMs ?? 1e3);
        g.emit("ObjectShow", { ObjectID: m.id });
      }
    }
    if (s.stoned) return false;
  }
  if (d.AI === 18 && (!d.DreamOriginalId || d.DreamOriginalId === 14) && g.time >= a.actionAt) {
    if (a.target) s.modeUntil = g.time + 3e4;
    const active2 = Number(s.modeUntil || 0) > g.time;
    if (active2 !== !!s.mode) {
      s.mode = active2;
      a.art = d.DreamOriginalId === 14 ? d.Image : active2 ? "Shinsu1" : "Shinsu";
      a.actionAt = g.time + 1e3;
      g.emit(active2 ? "ObjectShow" : "ObjectHide", { ObjectID: a.id });
    }
  }
  prepareDreamBoss(g, a, r);
  if (!boss && [11, 17].includes(d.AI) && a.maxHP >= 7) {
    const stage = Math.trunc(a.hp / Math.trunc(a.maxHP / 7));
    if (stage < Number(s.stage ?? 7)) {
      if (d.AI === 11) s.madUntil = g.time + 8e3;
      else {
        const count = Math.min(
          8,
          40 - g.map(a.map).actors.filter((m) => m.master === a.id && !m.dead).length,
        );
        for (let i = 0; i < count; i++) {
          const name = g.rules.monsterSettings["Zuma" + (g.rng.next(7) + 1)],
            def = g.rules.monsters.find((m) => m.Name === name);
          if (!def) continue;
          const spot = g.freeNear(a.map, a, 3);
          if (!spot) continue;
          const slave = g.newMonster(def, a.map, spot);
          slave.master = a.id;
          slave.target = a.target;
          slave.actionAt = g.time + 2e3;
          g.map(a.map).actors.push(slave);
        }
      }
    }
    s.stage = Math.min(Number(s.stage ?? 7), stage);
  }
  if (!boss && d.AI === 11 && g.time >= Number(s.teleAt || 0)) {
    s.teleAt = g.time + 1e4;
    const blocked = vectors.filter(
      ([dx, dy]) => !g.walkable(a.map, a.x + dx, a.y + dy, a.id),
    ).length;
    if (blocked >= 5)
      for (let i = 0; i < 100; i++) {
        const x = a.x + g.rng.next(5, -4),
          y = a.y + g.rng.next(5, -4);
        if (g.walkable(a.map, x, y, a.id)) {
          a.x = x;
          a.y = y;
          a.target = 0;
          g.emit("ObjectTeleportIn", { ObjectID: a.id });
          break;
        }
      }
  }
  return true;
}
function tamedFoxAttack(g, a, target) {
  if (
    !a.friendly ||
    !a.master ||
    !a.special?.dreamTamed ||
    target.friendly ||
    target.dead ||
    target.kind !== "monster" ||
    target.map !== a.map ||
    !targetableMonster(target)
  )
    return;
  const native = g.monsters.get(a.definition)?.DreamOriginalId;
  if (native !== 94 && native !== 95 && native !== 96) return;
  const profile = g.rules.adaptations.monsterCombat?.byNativeId[native];
  const action = profile?.attacks[0],
    hit = action?.hits[0],
    visual = action?.visual ?? profile?.visual;
  if (!profile || !action || !hit || hit.shape !== "target" || !visual) return;
  const range = action.range ?? profile.range;
  return {
    range,
    minimumDistance: action.minimumDistance ?? 0,
    visual,
    hit,
    power: native === 96 ? "DC" : "MC",
    actionMs: action.actionMs ?? profile.actionMs,
    hitDelayMs: action.hitDelayMs ?? profile.hitDelayMs,
  };
}
function monsterRange(a, target, g) {
  const fox = g && tamedFoxAttack(g, a, target);
  if (fox) return hydraSight(g, a.map, a, target) ? fox.range : 1;
  if (a.ai === 8 || a.ai === 38 || a.ai === 55) return 6;
  if (a.ai === 18) {
    const x = Math.abs(a.x - target.x),
      y = Math.abs(a.y - target.y);
    return (x <= 1 && y <= 1) || x === y || x % 2 === y % 2 ? 2 : 0;
  }
  if (a.ai === 14) return 7;
  if (a.ai === 26) {
    const x = Math.abs(a.x - target.x),
      y = Math.abs(a.y - target.y);
    return x === 0 || y === 0 || x === y ? 6 : 0;
  }
  return 1;
}
function rangedMovement(g, a, target) {
  const s = a.special || (a.special = {});
  if (a.ai === 2 && s.runAway) {
    flee(g, a, target);
    return true;
  }
  const boss = monsterCombatProfile(g, a),
    retreat = boss?.retreat;
  if (
    (retreat || (!boss && a.ai === 8)) &&
    g.time >= a.attackAt &&
    g.time >= Number(s.fearUntil || 0)
  ) {
    s.fearUntil = g.time + (retreat?.intervalMs ?? 5e3);
    if (distance(a, target) >= (retreat?.range ?? 6)) g.stepTowards(a, target);
    else flee(g, a, target);
    return true;
  }
  return false;
}
function flee(g, a, target) {
  if (g.time < a.moveAt) return;
  let dir = direction(target, a);
  if (dir < 0) dir = a.dir;
  if (g.move(a, dir)) return;
  const sign = g.rng.next(2) ? -1 : 1;
  for (let i = 1; i < 8; i++) if (g.move(a, (dir + sign * i + 8) % 8)) return;
}
function attackMonster(g, a, target) {
  noteCompanionCombat(a, g.time);
  const fox = tamedFoxAttack(g, a, target);
  if (fox) {
    const dist = distance(a, target);
    if (
      dist > fox.range ||
      dist < fox.minimumDistance ||
      !hydraSight(g, a.map, a, target) ||
      g.time < Number(a.special.foxAttackAt ?? a.special.redFoxAttackAt ?? 0)
    )
      return;
    a.special.foxAttackAt = g.time + 7e3;
    a.dir = Math.max(0, direction(a, target));
    a.actionAt = g.time + fox.actionMs;
    a.attackAt = a.actionAt + monsterAttackSpeed(g, a);
    g.emit("ObjectRangeAttack", {
      ObjectID: a.id,
      Direction: dirs[a.dir],
      TargetID: target.id,
      Spell: fox.visual,
      Duration: fox.actionMs,
    });
    g.schedule(
      "hit",
      fox.hitDelayMs,
      a,
      target,
      Math.floor(attackPower(a.stats, fox.power, g.rng) * fox.hit.scale),
      fox.hit.defence,
      fox.visual,
    );
    return;
  }
  if (isSpirit(g, a)) {
    a.dir = direction(a, target);
    a.attackAt = g.time + monsterAttackSpeed(g, a);
    a.actionAt = g.time + 600;
    g.emit("ObjectRangeAttack", {
      ObjectID: a.id,
      Direction: dirs[a.dir],
      TargetID: target.id,
      Spell: "SoulFireBall",
      Duration: 600,
    });
    g.schedule(
      "hit",
      500,
      a,
      target,
      attackPower(a.stats, "DC", g.rng),
      "MAC",
      "SpiritServantBolt",
    );
    return;
  }
  if (attackDreamBoss(g, a, target)) return;
  const native = g.monsters.get(a.definition)?.DreamOriginalId;
  const shinsuBreath =
    a.ai === 18 && (native === 14 ? "ShinsuFire" : native === 62 ? "AncientShinsuFire" : "");
  if (a.ai === 18 && !a.special?.mode && !a.special?.dreamPet) return;
  a.dir = direction(a, target);
  if (a.dir < 0) a.dir = 0;
  a.attackAt = g.time + monsterAttackSpeed(g, a);
  a.actionAt = g.time + monsterActionCost(g, a, true);
  if (g.monsters.get(a.definition)?.DreamRaw) a.attackAt = a.actionAt + monsterAttackSpeed(g, a);
  g.emit(
    a.ai === 55
      ? "Magic"
      : shinsuBreath || [8, 26, 38].includes(a.ai || 0)
        ? "ObjectRangeAttack"
        : "ObjectAttack",
    {
      ObjectID: a.id,
      Direction: dirs[a.dir],
      TargetID: target.id,
      Location: { X: a.x, Y: a.y },
      Spell: a.ai === 55 ? "ThunderBolt" : shinsuBreath || "None",
      Cast: a.ai === 55,
      Target: target,
    },
  );
  const raw = moonSpiritAttackPower(g, a, attackPower(a.stats, a.ai === 55 ? "MC" : "DC", g.rng));
  const targets = a.friendly
    ? g.map(a.map).actors.filter((m) => m.kind === "monster" && !m.friendly && targetableMonster(m))
    : [g.me, ...g.map(a.map).actors.filter((m) => m.friendly)];
  if (a.ai === 14) {
    for (const m of targets.filter((m2) => m2 && !m2.dead && distance(m2, a) <= 7))
      g.schedule("hit", 500, a, m, raw, "MAC", "EvilCentipede");
  } else if (a.ai === 26 || a.ai === 18) {
    const [dx, dy] = vectors[a.dir];
    for (let i = 1; i <= (a.ai === 18 ? 2 : 6); i++)
      for (const m of targets.filter(
        (m2) => m2 && !m2.dead && m2.x === a.x + dx * i && m2.y === a.y + dy * i,
      ))
        g.schedule(
          "hit",
          (a.ai === 18 ? 500 : 300) + i * 50,
          a,
          m,
          raw,
          // ShenShouMonster::AttackTarget uses IsMagicAttackMode (native Weight bit0).
          a.ai === 18
            ? Number(g.monsters.get(a.definition)?.DreamRaw?.Weight || 0) & 1
              ? "MAC"
              : "ACAgility"
            : "MACAgility",
        );
  } else
    g.schedule(
      "hit",
      a.ai === 8 ? 500 + distance(a, target) * 50 : [38, 55].includes(a.ai || 0) ? 500 : 300,
      a,
      target,
      raw,
      [38, 55].includes(a.ai || 0)
        ? "MAC"
        : [7, 10, 11, 17].includes(a.ai || 0)
          ? "MACAgility"
          : "ACAgility",
      a.ai === 7 ? "CaveMaggot" : void 0,
    );
}

// games/darkforged/singleplayer/core/hydra.ts
var HYDRA_RANGE = 6;
function hydraSight(g, map2, from, to) {
  const geom = g.geometry.get(map2);
  if (!geom) return false;
  let x = from.x,
    y = from.y;
  const dx = Math.abs(to.x - x),
    dy = Math.abs(to.y - y),
    sx = x < to.x ? 1 : -1,
    sy = y < to.y ? 1 : -1;
  let err = dx - dy;
  for (let n = 0; n < 64; n++) {
    if (x < 0 || y < 0 || x >= geom.width || y >= geom.height || geom.solid[y * geom.width + x])
      return false;
    if (x === to.x && y === to.y) return true;
    const e = err * 2;
    if (e > -dy) {
      err -= dy;
      x += sx;
    }
    if (e < dx) {
      err += dx;
      y += sy;
    }
  }
  return false;
}
function enemy(a) {
  return a.kind === "monster" && !a.dead && !a.friendly && targetableMonster(a);
}
var queuedHydras = /* @__PURE__ */ new WeakMap();
function processHydraRequest(g, r) {
  const pending = queuedHydras.get(r);
  if (!pending) return false;
  if (r.dead || r.map !== pending.map || g.time > pending.until) {
    queuedHydras.delete(r);
    return false;
  }
  if (g.time < Math.max(r.spellAt, r.actionAt)) return true;
  queuedHydras.delete(r);
  try {
    castHydra(g, r, { ...pending.data, Queue: false });
  } catch (error) {
    g.say(errorText(error));
  }
  return true;
}
function castHydra(g, r, data) {
  const sk = g.skill(r, "Hydra");
  if (!sk || r.job !== "Wizard" || r.dead || mountedItem(g, r)) return;
  if (g.time < sk.s.CastTime) return;
  const cost = skillCost(sk.d, sk.level, r.stats);
  if (r.mp < cost) throw new LocalizedError(message("core.magic.castMagic.26f1ab23c0"));
  if (g.time < Math.max(r.spellAt, r.actionAt)) {
    if (data.Queue === true && r.assist?.autoMagic)
      queuedHydras.set(r, { map: r.map, until: g.time + 3e3, data: { ...data } });
    return;
  }
  queuedHydras.delete(r);
  const selected = g.actor(Number(data.TargetID));
  const target =
    selected && selected.map === r.map && enemy(selected) && distance(r, selected) <= sk.d.Range
      ? selected
      : void 0;
  const [dx, dy] = vectors[r.dir];
  let center = target ?? { x: r.x + dx * 2, y: r.y + dy * 2 };
  if (data.AutoPlace !== true && data.Location) {
    const p = { x: Number(data.Location.X), y: Number(data.Location.Y) };
    if (!Number.isInteger(p.x) || !Number.isInteger(p.y) || distance(r, p) > sk.d.Range)
      throw new LocalizedError(message("core.dream-magic.castDream.8ec455055d"));
    center = p;
  }
  const candidates = [];
  for (let y = center.y - 2; y <= center.y + 2; y++)
    for (let x = center.x - 2; x <= center.x + 2; x++) candidates.push({ x, y });
  candidates.sort(
    (a2, b) =>
      distance(a2, center) - distance(b, center) ||
      distance(a2, r) - distance(b, r) ||
      a2.y - b.y ||
      a2.x - b.x,
  );
  const spot = candidates.find(
    (p) =>
      distance(r, p) <= sk.d.Range &&
      g.walkable(r.map, p.x, p.y, r.id) &&
      hydraSight(g, r.map, r, p),
  );
  if (!spot) throw new LocalizedError(message("core.dream-magic.castDream.b60b3b41b5"));
  for (const map2 of Object.values(g.maps))
    map2.actors = map2.actors.filter((a2) => !(a2.spell === "Hydra" && a2.target === r.id));
  const level = hydraLevel(sk.level),
    balance = hydraStats(sk.d, level);
  const a = {
    id: g.nextId++,
    kind: "spell",
    name: "Hydra",
    spell: "Hydra",
    map: r.map,
    ...spot,
    dir: r.dir,
    hp: 1,
    maxHP: 1,
    dead: false,
    stats: {
      interval: balance.intervalMs,
      level,
      preferred: target?.id || 0,
      born: g.time,
      shots: 0,
    },
    buffs: [],
    show: true,
    actionAt: 0,
    attackAt: g.time + 500,
    moveAt: 0,
    target: r.id,
    expires: g.time + balance.durationMs,
  };
  g.map(r.map).actors.push(a);
  const delay = dreamCastDelay(r.stats);
  r.mp -= cost;
  sk.s.CastTime = g.time + sk.d.DreamSkill.cooldown;
  r.spellAt = g.time + delay;
  r.actionAt = g.time + Math.min(600, delay);
  g.emit("Magic", {
    ObjectID: r.id,
    Spell: "Hydra",
    Cast: true,
    Direction: dirs[r.dir],
    Target: spot,
    TargetID: 0,
  });
}
function processHydra(g, a) {
  const r = g.actor(a.target);
  if (!r || r.kind !== "player" || r.dead || r.map !== a.map) {
    a.expires = g.time;
    return;
  }
  if (a.dead || g.time >= (a.expires ?? 0) || g.time < a.attackAt) return;
  const targets = g
    .map(a.map)
    .actors.filter((t) => enemy(t) && distance(a, t) <= HYDRA_RANGE && hydraSight(g, a.map, a, t));
  targets.sort(
    (x, y) =>
      Number(y.id === a.stats.preferred) - Number(x.id === a.stats.preferred) ||
      distance(a, x) - distance(a, y) ||
      x.id - y.id,
  );
  const target = targets[0];
  if (!target) {
    a.attackAt = g.time + 150;
    return;
  }
  const sk = g.skill(r, "Hydra");
  if (!sk) {
    a.expires = g.time;
    return;
  }
  a.attackAt = g.time + a.stats.interval;
  a.dir = direction(a, target);
  const head = a.stats.shots++ % 3;
  const travel = Math.min(900, Math.max(160, distance(a, target) * 65));
  g.schedule(
    "hit",
    200 + travel,
    r,
    target,
    magicDamage(sk.d, a.stats.level, nativeAbility(g, r, "MC"), g.rng),
    "MAC",
    "Hydra",
  );
  g.emit("HydraShot", {
    ObjectID: a.id,
    Head: head,
    From: { x: a.x, y: a.y },
    Target: { x: target.x, y: target.y },
    TargetID: target.id,
    Spell: "FireBall",
    Direction: dirs[a.dir],
  });
}

// games/darkforged/singleplayer/core/fields.ts
function createField(g, r, e) {
  const spell = e.spell,
    level = e.level || 0,
    native = !!g.skill(r, spell)?.d.DreamSkill,
    center = e.location;
  const fire = spell === "FireWall",
    large = spell === "Blizzard" || spell === "MeteorStrike" || spell === "DragonFlame",
    radius = large ? 2 : 1;
  const duration =
    e.durationMs ??
    (native && fire
      ? Math.min(
          (nativeAbility(g, r, "MC") + 3 * level) * 500,
          [0, 8e3, 12e3, 15e3, 18e3, 21e3, 24e3][level] ?? 25e3,
        )
      : native && spell === "PoisonCloud"
        ? 3e3 + nativeAbility(g, r, "SC") * 100
        : spell === "DragonFlame"
          ? 3e3
          : fire
            ? (10 + Math.trunc(e.damage / 2)) * 1e3
            : large
              ? 3e3
              : spell === "PoisonCloud"
                ? 6e3
                : 1e4 + level * 5e3);
  const interval =
    spell === "DragonFlame"
      ? 1e3
      : fire
        ? native
          ? 1e3
          : 2e3
        : large
          ? 440
          : spell === "PoisonCloud"
            ? 1e3
            : 400;
  const geom = g.geometry.get(r.map);
  let show = true;
  for (let y = center.y - radius; y <= center.y + radius; y++)
    for (let x = center.x - radius; x <= center.x + radius; x++) {
      if (fire && Math.abs(x - center.x) + Math.abs(y - center.y) > 1) continue;
      if (x < 0 || y < 0 || x >= geom.width || y >= geom.height || geom.solid[y * geom.width + x])
        continue;
      const existing = g
        .map(r.map)
        .actors.find(
          (a) =>
            a.spell === spell &&
            a.x === x &&
            a.y === y &&
            !a.dead &&
            (a.expires ?? Infinity) > g.time,
        );
      if (existing) {
        if (fire || spell === "PoisonCloud" || spell === "DragonFlame") {
          existing.expires = g.time + duration;
          existing.target = r.id;
        }
        continue;
      }
      g.map(r.map).actors.push({
        id: g.nextId++,
        kind: "spell",
        name: spell,
        spell,
        map: r.map,
        x,
        y,
        dir: 0,
        hp: 1,
        maxHP: 1,
        dead: false,
        stats: {
          power: e.damage,
          interval,
          bonus: e.effect?.value || 0,
          centerX: center.x,
          centerY: center.y,
        },
        buffs: [],
        show: fire || show,
        actionAt: 0,
        attackAt:
          (fire || spell === "PoisonCloud" || spell === "DragonFlame") && native
            ? (Math.floor(g.time / 1e3) + 1) * 1e3
            : g.time + (fire ? 0 : large ? 800 : interval),
        moveAt: 0,
        target: r.id,
        expires: g.time + duration,
      });
      show = false;
    }
}
function processField(g, a) {
  if (a.spell === "Hydra") {
    processHydra(g, a);
    return;
  }
  if (a.dead || g.time < a.attackAt || g.time >= (a.expires ?? Infinity)) return;
  a.attackAt = g.time + (a.stats.interval || 2e3);
  if (["NativeDragonFireWall", "NativeBossIceField"].includes(a.spell || "")) {
    const source2 = g.actor(a.target);
    if (!source2 || source2.dead || source2.map !== a.map) {
      a.expires = g.time;
      return;
    }
    for (const target of [
      g.me,
      ...g.map(a.map).actors.filter((m) => m.friendly && m.master),
    ].filter((m) => m && !m.dead && m.map === a.map && !g.safe(m) && distance(m, a) === 0)) {
      const value = g.rng.next(Math.max(a.stats.MinDC + 1, a.stats.MaxDC), a.stats.MinDC);
      g.schedule("hit", a.stats.hitDelayMs, source2, target, value, "MAC", a.spell);
    }
    return;
  }
  const source = g.actor(a.target);
  if (!source || source.dead || source.map !== a.map) {
    a.expires = g.time;
    return;
  }
  if (["Blizzard", "MeteorStrike"].includes(a.spell) && !source.attackModes.channel) return;
  const enemies2 = g
    .map(a.map)
    .actors.filter(
      (m) =>
        m.kind === "monster" &&
        !m.dead &&
        !m.friendly &&
        targetableMonster(m) &&
        distance(m, a) === 0,
    );
  if (
    a.spell === "HealingCircle" &&
    distance(source, a) === 0 &&
    !source.healHP &&
    source.hp < source.maxHP
  )
    source.healHP += 25;
  for (const target of enemies2) {
    const dynamic = ["FireWall", "PoisonCloud", "DragonFlame"].includes(a.spell);
    const skill = dynamic ? g.skill(source, a.spell) : void 0;
    if (dynamic && !skill) continue;
    let power = skill
      ? magicDamage(
          skill.d,
          skill.level,
          nativeAbility(g, source, a.spell === "PoisonCloud" ? "SC" : "MC"),
          g.rng,
        )
      : a.stats.power || 0;
    if (skill?.d.DreamSkill && ["FireWall", "PoisonCloud", "DragonFlame"].includes(a.spell)) {
      if (a.spell === "PoisonCloud") {
        const divisor = [1, 2, 1.5, 1.2][skill.level] ?? 1;
        power = Math.trunc(power / divisor);
      }
      const e = g.schedule("hit", 500, source, target, power, "MAC", a.spell);
      if (a.spell === "PoisonCloud") {
        e.level = skill.level;
        e.effect = { type: "NativeFieldPoison", duration: 0, value: 0, stats: {} };
      }
      continue;
    }
    g.damage(source, target, power, "MAC", a.spell);
    if (target.dead) continue;
    if (a.spell === "PoisonCloud") {
      g.buff(
        target,
        "Green",
        12e3,
        Math.trunc(((source.stats.MinSC || 0) + (source.stats.MaxSC || 0)) / 2) +
          (a.stats.bonus || 0),
        {},
        source.id,
      );
    } else if (a.spell === "HealingCircle") g.buff(target, "Slow", (5 + g.rng.next(5)) * 1e3);
    else if (a.spell === "Blizzard" && g.rng.next(8) === 0)
      g.buff(target, "Slow", (5 + g.rng.next(source.stats.Freezing || 0)) * 2e3);
  }
}
function createBossGroundFire(g, source, center, c) {
  const spell = c.spell ?? "NativeDragonFireWall";
  const geom = g.geometry.get(source.map),
    base = g.monsters.get(source.definition).Stats;
  for (let y = center.y - c.radius; y <= center.y + c.radius; y++)
    for (let x = center.x - c.radius; x <= center.x + c.radius; x++) {
      if (x < 0 || y < 0 || x >= geom.width || y >= geom.height || geom.solid[y * geom.width + x])
        continue;
      const existing = g
        .map(source.map)
        .actors.find(
          (a) =>
            a.spell === spell && a.x === x && a.y === y && !a.dead && (a.expires ?? 0) > g.time,
        );
      if (existing) {
        existing.expires = g.time + c.delayMs + c.durationMs;
        existing.target = source.id;
        continue;
      }
      g.map(source.map).actors.push({
        id: g.nextId++,
        kind: "spell",
        name:
          spell === "NativeBossIceField" ? "\u51B0\u6676\u9886\u57DF" : "\u706B\u9F99\u5730\u706B",
        spell,
        map: source.map,
        x,
        y,
        dir: 0,
        hp: 1,
        maxHP: 1,
        dead: false,
        stats: {
          MinDC: Math.trunc(Math.fround((base.MinDC || 0) * c.damageScale)),
          MaxDC: Math.trunc(Math.fround((base.MaxDC || 0) * c.damageScale)),
          interval: c.intervalMs,
          hitDelayMs: c.hitDelayMs,
        },
        buffs: [],
        show: spell === "NativeBossIceField",
        actionAt: 0,
        attackAt: g.time + c.delayMs,
        moveAt: 0,
        target: source.id,
        expires: g.time + c.delayMs + c.durationMs,
      });
    }
}
function resolveNativeFieldHit(g, source, target, dealt, e) {
  if (
    e.spell !== "PoisonCloud" ||
    e.effect?.type !== "NativeFieldPoison" ||
    source.kind !== "player" ||
    source.dead ||
    target.dead ||
    dealt <= 0
  )
    return;
  if (g.rng.next(Math.max(1, 8 - (e.level || 1))) !== 0) return;
  const duration = 5e3 + nativeAbility(g, source, "SC") * 200;
  const value = Math.trunc(nativeAbility(g, source, "SC") / 4);
  g.buff(target, "Green", duration, value, {}, source.id, "PoisonCloud");
}

// games/darkforged/singleplayer/core/native-death.ts
function nativeDeathSource(g, a, spell) {
  return (
    ["NativeDeathBurst", "NativeDeathPoison"].includes(spell || "") &&
    !!g.rules.adaptations.monsterCombat?.deathBursts?.[
      String(g.monsters.get(a.definition)?.DreamOriginalId)
    ]
  );
}
function nativeDeathBurst(g, a) {
  const c =
    g.rules.adaptations.monsterCombat?.deathBursts?.[
      String(g.monsters.get(a.definition)?.DreamOriginalId)
    ];
  if (!c || a.friendly || a.special?.deathBurstDone) return;
  (a.special ??= {}).deathBurstDone = true;
  const targets = [
    g.me,
    ...g.map(a.map).actors.filter((m) => m.kind === "monster" && m.friendly && m.master),
  ].filter((m) => m && !m.dead && m.map === a.map && distance(a, m) <= c.radius && !g.safe(m));
  for (const target of targets) {
    const raw = c.targetHPDivisor
      ? Math.trunc(target.hp / c.targetHPDivisor)
      : Math.trunc(Math.fround(Number(a.special.lastReceivedDamage || 0) * c.lastDamageScale));
    const defence = g.monsters.get(a.definition)?.DreamMagicAttack ? "MAC" : "ACAgility";
    g.schedule("deathHit", c.delayMs, a, target, raw, defence, "NativeDeathBurst");
    if (c.poison) {
      g.buff(target, "Green", c.poison.durationMs, c.poison.value, {}, a.id, "NativeDeathPoison");
      a.expires = Math.max(a.expires || 0, g.time + c.poison.durationMs + 1e3);
    }
  }
}

// games/darkforged/singleplayer/core/potion-recovery.ts
var active = /* @__PURE__ */ new WeakMap();
function recovery(r) {
  let value = active.get(r);
  if (!value) {
    value = { hp: { at: 0, doses: [] }, mp: { at: 0, doses: [] } };
    active.set(r, value);
  }
  return value;
}
function potionRecoveryStatus(r, now) {
  const queues = active.get(r);
  if (r.dead || !queues) return [];
  return ["hp", "mp"].flatMap((kind) => {
    const q = queues[kind],
      dose = q.doses[0],
      pending = kind === "hp" ? r.potHP : r.potMP;
    if (!dose || !pending || r[kind] >= (kind === "hp" ? r.maxHP : r.maxMP)) return [];
    return [
      {
        kind,
        remainingMs: Math.max(0, q.at + (4 - dose.tick) * 1e3 - now),
        queuedBottles: q.doses.length - 1,
      },
    ];
  });
}
function queuePotion(r, hp, mp, now) {
  const queues = recovery(r);
  for (const [kind, value, pending] of [
    ["hp", hp, "potHP"],
    ["mp", mp, "potMP"],
  ]) {
    const q = queues[kind];
    if (!r[pending]) q.doses = [];
    const amount = Math.min(65535 - r[pending], Math.max(0, Math.floor(value)));
    if (!amount) continue;
    if (!q.doses.length) q.at = now + 1e3;
    q.doses.push({ amount, tick: 0 });
    r[pending] += amount;
  }
}
function recoverPotions(r, now) {
  const queues = recovery(r);
  for (const [kind, pending, max] of [
    ["hp", "potHP", "maxHP"],
    ["mp", "potMP", "maxMP"],
  ]) {
    const q = queues[kind];
    if (r.dead || r[kind] >= r[max] || !r[pending]) {
      q.doses = [];
      r[pending] = 0;
      continue;
    }
    if (!q.doses.length) {
      q.doses.push({ amount: r[pending], tick: 0 });
      q.at = now + 1e3;
    }
    while (q.doses.length && now >= q.at) {
      const dose = q.doses[0],
        portion =
          Math.floor((dose.amount * (dose.tick + 1)) / 5) -
          Math.floor((dose.amount * dose.tick) / 5);
      r[kind] = Math.min(r[max], r[kind] + portion);
      r[pending] -= portion;
      dose.tick++;
      q.at += 1e3;
      if (dose.tick === 5) q.doses.shift();
      if (r[kind] >= r[max]) {
        q.doses = [];
        r[pending] = 0;
        break;
      }
    }
  }
}

// games/darkforged/singleplayer/core/loot-volume.ts
function recoveryPotion(def) {
  return def.Type === "Potion" && ((def.Stats.HP || 0) > 0 || (def.Stats.MP || 0) > 0);
}
function selectNativeLoot(items, defs, rng, policy, boss, gold, needed = () => false) {
  if (boss) return { items: [...items], gold, burst: false };
  const quotas = /* @__PURE__ */ new Map(),
    protectedSet = /* @__PURE__ */ new Set();
  for (const item of items) {
    if (!quotas.has(item.id)) {
      const value = needed(item.id);
      quotas.set(
        item.id,
        value === true ? Infinity : value === false ? 0 : Math.max(0, Math.floor(value)),
      );
    }
    const left = quotas.get(item.id);
    if (left > 0) {
      protectedSet.add(item);
      quotas.set(item.id, left - item.count);
    }
  }
  const required = (i) => protectedSet.has(i);
  const burst = !boss && rng.next(100) < policy.ordinaryBurstPercent;
  const potions = items.filter((i) => recoveryPotion(defs.get(i.id)) && !required(i)),
    other = items.filter((i) => !recoveryPotion(defs.get(i.id)) || required(i));
  const potionLimit = boss
    ? policy.bossMaxPotions
    : burst
      ? policy.burstMaxPotions
      : policy.ordinaryMaxPotions;
  if (potions.length && rng.next(100) < policy.potionChancePercent) {
    for (let n = 0; n < potionLimit && potions.length; n++)
      other.push(...potions.splice(rng.next(potions.length), 1));
  }
  const score = (i) =>
    required(i)
      ? 100
      : equipmentTypes.has(defs.get(i.id).Type)
        ? 50 +
          exceptionalPoints(i) * 2 +
          (i.affixes?.length ? 10 : 0) +
          Math.min(7, Number(defs.get(i.id).DreamGrade) || 0)
        : defs.get(i.id).Type === "Book"
          ? 40
          : recoveryPotion(defs.get(i.id))
            ? 0
            : 10;
  const limit = (burst ? policy.ordinaryBurstMax : policy.ordinaryMax) - (gold > 0 ? 1 : 0);
  other.sort((a, b) => score(b) - score(a));
  const protectedItems = other.filter((i) => required(i)),
    regular = other.filter((i) => !required(i));
  return {
    items: [...protectedItems, ...regular.slice(0, Math.max(0, limit - protectedItems.length))],
    gold,
    burst,
  };
}

// games/darkforged/singleplayer/core/affix-drop.ts
function rollExceptionalAffixes(item, def, rng, cfg) {
  const natural = takeNaturalAffixGeneration(item),
    grade = effectiveAffixGrade(def);
  const p = cfg.affixDropPolicy?.linkedExceptional,
    stars = Math.min(8, Math.floor(exceptionalPoints(item)));
  if (!p || !cfg.affixes || stars < 1 || item.added.GemTier || item.affixes?.length || !(grade > 0))
    return;
  const chances = p.chanceByEquipmentGrade?.[String(grade)] ?? p.chanceByStars;
  if (rng.next(100) >= chances[stars]) return;
  const weights =
    p.highStarCounts && stars >= p.highStarCounts.minStars
      ? p.highStarCounts.countWeights
      : p.countWeights;
  let roll = rng.next(weights.reduce((a, b) => a + b, 0)),
    count = 1;
  while (count < weights.length && roll >= weights[count - 1]) roll -= weights[count++ - 1];
  const targets = rareChannelTargets(def),
    calibration =
      targets.speed + targets.luck
        ? affixSourceCalibration(def, cfg, natural ?? { stars })
        : void 0;
  rollAffixes(item, def, rng, cfg.affixes, count, calibration?.normalizer);
}
var opportunityCache = /* @__PURE__ */ new WeakMap();
function affixOpportunityQ(def, cfg, source) {
  let cache = opportunityCache.get(cfg);
  if (!cache) {
    cache = /* @__PURE__ */ new Map();
    opportunityCache.set(cfg, cache);
  }
  const grade = effectiveAffixGrade(def),
    key = JSON.stringify([
      def.Index,
      grade,
      def.RequiredClass,
      def.Stats,
      def.Type,
      def.DreamType,
      def.AffixPoolType,
      source,
    ]);
  const cached = cache.get(key);
  if (cached !== void 0) return cached;
  const p = cfg.affixDropPolicy.linkedExceptional,
    chances = p.chanceByEquipmentGrade?.[String(grade)] ?? p.chanceByStars;
  const atStars = (stars) => {
    if (stars < 1) return 0;
    const weights =
        p.highStarCounts && stars >= p.highStarCounts.minStars
          ? p.highStarCounts.countWeights
          : p.countWeights,
      total = weights.reduce((n, v) => n + v, 0);
    return (
      (chances[Math.min(8, stars)] / 100) *
      weights.reduce(
        (sum, weight, index) =>
          sum + (weight / total) * rareReplaceableProbability(def, cfg.affixes, index + 1),
        0,
      )
    );
  };
  let q = 0;
  if ("stars" in source) q = atStars(source.stars);
  else if ("pointWeights" in source) {
    const total = Object.values(source.pointWeights).reduce((n, v) => n + v, 0);
    q = Object.entries(source.pointWeights).reduce(
      (sum, [stars, weight]) => sum + (weight / total) * atStars(Number(stars)),
      0,
    );
  } else {
    const sum = cfg.pointWeights.reduce((n, v) => n + v, 0),
      buckets = cfg.pointWeights.map(() => 0);
    for (let value = 0; value < 32768; value++) {
      let roll = value % sum,
        index = 0;
      while (roll >= cfg.pointWeights[index]) roll -= cfg.pointWeights[index++];
      buckets[index]++;
    }
    const exceptional =
      Math.max(
        0,
        Math.min(
          100,
          Math.floor(
            (100 * Math.max(0, source.magicFind)) / (Math.max(0, source.magicFind) + 250),
          ) + (cfg.exceptionalGradeBonusPercent?.[String(grade)] || 0),
        ),
      ) / 100;
    q =
      exceptional * buckets.reduce((sum2, n, index) => sum2 + (n / 32768) * atStars(index + 1), 0);
  }
  cache.set(key, q);
  return q;
}
function affixSourceCalibration(def, cfg, source) {
  const targets = rareChannelTargets(def),
    q = affixOpportunityQ(def, cfg, source),
    required = targets.speed + targets.luck;
  const constrained = q + 1e-10 < required;
  if (constrained && "magicFind" in source)
    throw new Error(`Natural affix capacity ${def.Index}: q=${q} < ${required}`);
  const normalizer = constrained ? 1 : q || 1;
  const tickets = {
    speed: Math.round((1e4 * targets.speed) / normalizer),
    luck: Math.round((1e4 * targets.luck) / normalizer),
  };
  return {
    q,
    normalizer,
    mode: constrained ? "conditional-capacity" : "whole-source",
    requestedFinal: targets,
    conditionalBasisPoints: tickets,
    expectedFinal: { speed: (q * tickets.speed) / 1e4, luck: (q * tickets.luck) / 1e4 },
    limitation: constrained
      ? "Original source point distribution has insufficient replaceable outcomes; original zero-star and count rules are preserved."
      : void 0,
  };
}

// games/darkforged/singleplayer/core/crafting.ts
function craftingState(r) {
  return (r.crafting ??= { stage: 0, skills: {} });
}
function craftingLearn(g, r, graduate = false) {
  const cfg = g.rules.adaptations.forge;
  if (g.requireNPC(r).id !== cfg.artisanNpc)
    throw new LocalizedError(message("core.crafting.craftingLearn.d0a0d01e8a"));
  const state2 = craftingState(r);
  if (r.level < 35) throw new LocalizedError(message("core.crafting.craftingLearn.a68010b921"));
  if (state2.stage >= (graduate ? 2 : 1))
    throw new LocalizedError(message("core.crafting.craftingLearn.788eae4b6b"));
  if (graduate && state2.stage !== 1)
    throw new LocalizedError(message("core.crafting.craftingLearn.efd1179990"));
  const name = graduate ? "\u91D1\u952D" : "\u94DC\u77FF",
    quality = graduate ? 25 : 14;
  const i = r.inventory.find(
    (i2) => i2 && g.defs.get(i2.id)?.DreamName === name && (i2.materialQuality || 0) >= quality,
  );
  if (!i)
    throw new LocalizedError(
      message("core.crafting.craftingLearn.04c8734c45", {
        p0: quality,
        p1: entityText("items", g.rules.items.find((d) => d.DreamName === name).Index),
      }),
    );
  if (graduate) {
    const stone = g.rules.items.find((d) => d.DreamName === "\u6F5C\u80FD\u77F3\u2461");
    if (
      i.count > 1 &&
      !r.inventory.some((i2) => !i2) &&
      !r.inventory.some((i2) => i2?.id === stone.Index)
    )
      throw new LocalizedError(message("core.crafting.craftingLearn.f4f8709c7f"));
  }
  if (--i.count === 0) r.inventory[r.inventory.indexOf(i)] = null;
  state2.stage = graduate ? 2 : 1;
  if (graduate)
    g.give(
      r,
      g.newItem(g.rules.items.find((d) => d.DreamName === "\u6F5C\u80FD\u77F3\u2461").Index, 2),
      false,
    );
  for (const key of graduate ? ["equipment"] : ["ore", "wood", "gem", "cloth"])
    state2.skills[key] = { level: 1, xp: 0 };
  g.say(
    graduate
      ? message("core.crafting.craftingLearn.d6de453710")
      : message("core.crafting.craftingLearn.546f3b03b3"),
  );
}
function craftLevel(r, skill) {
  return craftingState(r).skills[skill]?.level || 0;
}
function craftXP(g, r, skill, amount = 1) {
  if (skill === "talent") return;
  const s = craftingState(r).skills[skill];
  if (!s) return;
  s.xp += amount;
  settleCraftXP(g, r, skill, true);
}
function settleCraftXP(g, r, skill, announce = false) {
  const s = r.crafting?.skills[skill];
  if (!s || skill === "talent") return;
  const crafting = g.rules.adaptations.forge.crafting;
  const table = crafting.experienceBySkill?.[skill] ?? crafting.experience;
  while (s.level < (skill === "equipment" ? 10 : 9) && s.xp >= table[s.level - 1]) {
    s.xp -= table[s.level - 1];
    s.level++;
    if (announce) g.say(message("core.crafting.craftXP.6339b79af5", { p0: s.level }));
  }
}
function materialOutputQuality(r, recipe, inputs) {
  const level = craftLevel(r, recipe.skill),
    req = recipe.level || 1;
  if (recipe.processing)
    return Math.max(
      1,
      Math.floor(
        inputs.reduce((s, i) => s + (i.materialQuality || 1) * i.count, 0) *
          Math.min(1, 0.4 + 0.2 * (level - req)),
      ),
    );
  if (recipe.refining)
    return (
      Math.min(20, 8 + Math.max(0, level - req) * 4) +
      Math.floor((inputs.reduce((s, i) => s + exceptionalPoints(i), 0) * 10) / inputs.length)
    );
  return 0;
}
function craftStars(g, output, inputs) {
  const d = g.defs.get(output.id),
    name = String(d.DreamName || d.Name),
    total = inputs.reduce((n, i) => n + (i.materialQuality || 0) * i.count, 0);
  if (d.Type === "Amulet") return 0;
  const thresholds =
    d.Type === "Weapon"
      ? d.RequiredAmount <= 60
        ? [121, 161, 201, 321, 401]
        : [106, 141, 176, 281, 351]
      : d.Type === "Helmet"
        ? name.includes("\u5357\u74DC")
          ? [91, 121, 151, 241, 301]
          : [76, 101, 126, 201, 251]
        : d.Type === "Armour"
          ? [106, 141, 176, 281, 351]
          : ["Bracelet", "Necklace", "Ring"].includes(d.Type)
            ? [151, 201, 251, 401, 501]
            : name.includes("\u738B\u77F3")
              ? [121, 161, 201, 321, 401]
              : name.includes("\u4EA1\u9B42\u68FA")
                ? [101, 121, 151, 241, 301]
                : [76, 101, 151, 201, 251];
  return thresholds.filter((n) => total >= n).length;
}

// games/darkforged/singleplayer/core/darkforged.ts
var rarities = ["normal", "magic", "rare", "set", "legendary"];
var powerStats = [
  "DxChainLightningChance",
  "DxChainLightningPercent",
  "DxExecutePercent",
  "DxSpellEchoChance",
  "DxPlague",
  "DxBerserkPercent",
  "DxFreezeChance",
  "DxPetDamagePercent",
  "DxCorpseExplosionPercent",
  "DxSecondWindPercent",
  "DxBossDamagePercent",
  "DxFrenzy",
  "DxLifeOnKillPercent",
  "DxEliteDamagePercent",
  "DxShockwaveChance",
  "DxShockwavePercent",
  "DxCleavePercent",
  "DxCullPercent",
  "DxIgniteChance",
  "DxIgnitePercent",
  "DxManaShieldPercent",
  "DxDamageReductionPercent",
  "DxStaticChance",
  "DxStaticPercent",
  "DxCheatDeathPercent",
  "DxManaOnKillPercent",
];
var powerSet = new Set(powerStats);
var percentStats = /* @__PURE__ */ new Set([
  "AffixDamagePercent",
  "DreamCritPercent",
  "DreamCritDamagePercent",
  "HPRatePercent",
  "HPDrainRatePercent",
  "HPRecoveryPercent",
  "MPRecoveryPercent",
  "ItemDropRatePercent",
  "NativeKillXPPercent",
  "NativePhysicalAbsorbPercent",
  "NativeMagicAbsorbPercent",
  "NativeReflectPercent",
  "PhysicalDodgePercent",
  "MagicDodgePercent",
  "NoFlinchPercent",
  "PotionHealingPercent",
  "MagicFind",
  ...powerStats.filter((k) => k.endsWith("Percent") || k.endsWith("Chance")),
]);
function dxRarity(item) {
  return item?.dx?.rarity || "normal";
}
function dxEligible(cfg, def) {
  return (
    cfg.eligibleTypes.includes(def.Type) &&
    !cfg.excludedDreamTypes.includes(Number(def.DreamType)) &&
    def.StackSize <= 1 &&
    !def.BossRelic &&
    !def.BossAccessory
  );
}
var add = (out, stats2, sign = 1) => {
  for (const [k, v] of Object.entries(stats2 || {}))
    if (Number.isFinite(v)) out[k] = (out[k] || 0) + sign * v;
  return out;
};
var affixIndex = /* @__PURE__ */ new WeakMap();
function affixDef(cfg, id) {
  let m = affixIndex.get(cfg);
  if (!m) {
    m = new Map(cfg.affixes.map((a) => [a.id, a]));
    affixIndex.set(cfg, m);
  }
  return m.get(id);
}
function runeDef(cfg, id) {
  return cfg.runes.find((r) => r.id === id);
}
function socketGroup(def) {
  return def.Type === "Weapon" ? "weapon" : "armour";
}
function dxRuneword(cfg, item, def) {
  const dx = item.dx;
  if (!dx || dx.rarity !== "normal" || !dx.sockets || dx.runes?.length !== dx.sockets)
    return void 0;
  const keys2 = dx.runes.map((id) => runeDef(cfg, id)?.key);
  return cfg.runewords.find(
    (w) =>
      w.types.includes(def.Type) &&
      w.runes.length === keys2.length &&
      w.runes.every((k, i) => k === keys2[i]),
  );
}
function rawDxItemStats(cfg, item, def) {
  const dx = item.dx,
    out = {};
  if (!cfg || !dx) return out;
  add(out, dx.fixed);
  for (const a of dx.affixes) {
    const d = affixDef(cfg, a.id);
    if (d) out[d.stat] = (out[d.stat] || 0) + a.value;
  }
  for (const id of dx.runes || []) {
    const rune = runeDef(cfg, id);
    if (rune) add(out, socketGroup(def) === "weapon" ? rune.weapon : rune.armour);
  }
  add(out, dxRuneword(cfg, item, def)?.stats);
  return out;
}
function dxItemStats(cfg, item, def) {
  const out = rawDxItemStats(cfg, item, def);
  delete out.DxRequirementReduction;
  return out;
}
function dxLevelRequirement(cfg, item, def) {
  const base = def.RequiredType === "Level" ? def.RequiredAmount : 0,
    dx = item.dx;
  if (!cfg?.enabled || !dx) return { original: base, reduction: 0, required: base };
  let level = 0;
  for (const a of dx.affixes) {
    const family = affixDef(cfg, a.id),
      tier = family?.tiers[a.tier];
    if (tier && family.stat !== "DxRequirementReduction") level = Math.max(level, tier[0]);
  }
  if (dx.legendary)
    level = Math.max(level, cfg.legendaries.find((l) => l.id === dx.legendary)?.minIlvl || 0);
  if (dx.set) level = Math.max(level, cfg.sets.find((s) => s.id === dx.set)?.minIlvl || 0);
  for (const id of dx.runes || []) level = Math.max(level, runeDef(cfg, id)?.minIlvl || 0);
  const original = Math.max(1, base, Math.floor(level * cfg.requirementFromAffixLevel));
  const reduction = Math.max(
    0,
    Math.floor(rawDxItemStats(cfg, item, def).DxRequirementReduction || 0),
  );
  return { original, reduction, required: Math.max(1, original - reduction) };
}
function dxRequiredLevel(cfg, item, def) {
  return dxLevelRequirement(cfg, item, def).required;
}
function broken(item) {
  return item.maxDura > 0 && item.currentDura === 0;
}
function dxSetStates(cfg, equipment) {
  if (!cfg) return [];
  return cfg.sets
    .map((set) => {
      const pieces = new Set(
        equipment.flatMap((i) =>
          i && !broken(i) && i.dx?.set === set.id && i.dx.piece ? [i.dx.piece] : [],
        ),
      );
      return { set, count: pieces.size, pieces };
    })
    .filter((s) => s.count > 0);
}
function dxSetBonusStats(cfg, equipment) {
  const out = {};
  for (const { set, count } of dxSetStates(cfg, equipment))
    for (const b of set.bonuses) if (count >= b.count) add(out, b.stats);
  delete out.DxRequirementReduction;
  return out;
}
function capPowers(cfg, stats2) {
  for (const [k, cap] of Object.entries(cfg.powerCaps))
    if (stats2[k] !== void 0) stats2[k] = Math.min(cap, Math.max(0, stats2[k]));
}

// games/darkforged/singleplayer/core/darkforged-tutorial.ts
var actions = ["compared", "equipped", "salvaged", "enchanted", "reequipped"];
var blank = () => ({
  v: 1,
  claimed: false,
  compared: false,
  equipped: false,
  salvaged: false,
  enchanted: false,
  reequipped: false,
  hidden: false,
});
var enabled = (g) => !!g.rules.adaptations.diablo?.enabled;
function fail2(key) {
  throw new LocalizedError(message("dx.tutorial.error." + key));
}
function requireEdition(g) {
  if (!enabled(g)) fail2("unavailable");
}
function receipt(g, r) {
  return enabled(g) && r.dxTutorial?.claimed ? r.dxTutorial : void 0;
}
function blueWeapon(g, item) {
  const def = g.defs.get(item.id),
    cfg = g.rules.adaptations.diablo;
  return (
    !!cfg?.enabled &&
    !!def &&
    def.Type === "Weapon" &&
    dxEligible(cfg, def) &&
    item.count === 1 &&
    item.dx?.rarity === "magic"
  );
}
function validDxTutorialProgress(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const p = value,
    keys2 = ["v", "claimed", ...actions, "hidden"];
  return (
    p.v === 1 &&
    Object.keys(p).every((k) => keys2.includes(k)) &&
    ["claimed", ...actions, "hidden"].every((k) => typeof p[k] === "boolean") &&
    (p.claimed || actions.every((k) => !p[k])) &&
    (!p.reequipped || (p.enchanted && p.equipped))
  );
}
function dxTutorialClaim(g, r) {
  requireEdition(g);
  if (r.dxTutorial?.claimed) return false;
  if (!r.completedQuests.includes(201)) fail2("quest");
  const npc = g.requireNPC(r),
    cfg = g.rules.adaptations.diablo;
  if (!(cfg.salvageNpcRoles || []).includes(npc.role)) fail2("smith");
  if (!Number.isSafeInteger(r.gold + 300)) fail2("gold");
  const def = g.defs.get(221);
  if (!def || def.Type !== "Weapon" || !dxEligible(cfg, def)) fail2("unavailable");
  const family = r.job === "Wizard" ? "p_mc" : r.job === "Taoist" ? "p_sc" : "p_dc";
  const affix = cfg.affixes.find((a) => a.id === family);
  if (!affix || !affix.slots.includes("Weapon") || affix.tiers[0]?.[0] !== 1) fail2("unavailable");
  const backup = structuredClone({
      inventory: r.inventory,
      gold: r.gold,
      dxTutorial: r.dxTutorial,
    }),
    rng = g.rng.export(),
    nextId = g.nextId;
  try {
    for (const value of [2, 1]) {
      const item = g.newItem(def.Index);
      item.dx = { v: 1, rarity: "magic", ilvl: 1, affixes: [{ id: family, tier: 0, value }] };
      g.checkUse(r, def, item);
      if (r.level < dxRequiredLevel(cfg, item, def)) fail2("target");
      if (!g.give(r, item, false)) fail2("space");
    }
    r.gold += 300;
    r.dxTutorial = { ...blank(), claimed: true };
  } catch (error) {
    r.inventory = backup.inventory;
    r.gold = backup.gold;
    if (backup.dxTutorial === void 0) delete r.dxTutorial;
    else r.dxTutorial = backup.dxTutorial;
    g.rng.restore(rng);
    g.nextId = nextId;
    throw error;
  }
  g.say(message("dx.tutorial.granted"));
  return true;
}
function dxTutorialCompare(g, r, uid) {
  requireEdition(g);
  const p = receipt(g, r);
  if (!p) fail2("unclaimed");
  const item = r.inventory.find((i) => i?.uid === uid);
  if (!item || !blueWeapon(g, item)) fail2("target");
  const def = g.defs.get(item.id),
    cfg = g.rules.adaptations.diablo;
  g.checkUse(r, def, item);
  if (r.level < dxRequiredLevel(cfg, item, def)) fail2("target");
  p.compared = true;
}
function dxTutorialVisibility(g, r, hidden) {
  requireEdition(g);
  (r.dxTutorial ??= blank()).hidden = hidden;
}
function dxTutorialEquipped(g, r, item) {
  const p = receipt(g, r);
  if (!p || !r.equipment.includes(item) || !blueWeapon(g, item)) return;
  p.equipped = true;
  if (p.enchanted && item.dx.enchanted !== void 0) p.reequipped = true;
}
function dxTutorialSalvaged(g, r, items) {
  const p = receipt(g, r),
    cfg = g.rules.adaptations.diablo;
  if (
    p &&
    cfg &&
    items.some(
      (i) =>
        i.dx?.rarity === "magic" &&
        i.count === 1 &&
        !!g.defs.get(i.id) &&
        dxEligible(cfg, g.defs.get(i.id)),
    )
  )
    p.salvaged = true;
}
function dxTutorialEnchanted(g, r, item) {
  const p = receipt(g, r);
  if (p && r.inventory.includes(item) && blueWeapon(g, item) && item.dx.enchanted !== void 0)
    p.enchanted = true;
}

// games/darkforged/singleplayer/core/darkforged-engine.ts
function dxConfig(rules) {
  const c = rules.adaptations.diablo;
  return c?.enabled ? c : void 0;
}
function weighted3(rows, weight, rng) {
  const total = rows.reduce((n, r) => n + Math.max(0, weight(r)), 0);
  if (total <= 0) return void 0;
  let roll = rng.next(total);
  for (const r of rows) {
    const w = Math.max(0, weight(r));
    if (roll < w) return r;
    roll -= w;
  }
  return rows[rows.length - 1];
}
var between = (rng, [lo, hi]) => rng.next(Math.max(lo, hi) + 1, Math.min(lo, hi));
function dxRollProperty(cfg, stat, range, rng) {
  const policy = cfg.primaryAttributeRoll;
  if (!policy?.stats.includes(stat)) return between(rng, range);
  const lo = Math.min(...range),
    hi = Math.max(...range);
  return weighted3(
    Array.from({ length: hi - lo + 1 }, (_, i) => lo + i),
    (value) => (hi - value + 1) ** policy.valueWeightPower,
    rng,
  );
}
function rollRanges(cfg, stats2, rng) {
  return Object.fromEntries(
    Object.entries(stats2).map(([k, range]) => [k, dxRollProperty(cfg, k, range, rng)]),
  );
}
function baseSupportsJob(def, job) {
  return !job || (supportsWearableJob(def, job) && equipmentSupportsAffixJob(def, job));
}
function dxSourceTier(g, d, a) {
  if (!d) return "other";
  const elite =
    d.GuideRank === "elite" || ["elite", "swift", "captain"].includes(String(d.AdventureKind));
  if (elite) return "elite";
  const registered = g.rules.adaptations.bossBehaviors?.entries?.[String(d.Index)];
  if (d.IsBoss || (registered && !registered.helper) || a?.special?.trialBoss) return "boss";
  return "ordinary";
}
function dxItemLevel(cfg, d, source) {
  if (!d) return cfg.itemLevel.nonMonster;
  const bonus =
    source === "boss" ? cfg.itemLevel.bossBonus : source === "elite" ? cfg.itemLevel.eliteBonus : 0;
  return Math.max(1, Math.min(cfg.itemLevel.max, Math.floor(Number(d.Level) || 1) + bonus));
}
function dxRollRarity(cfg, rng, source, magicFind) {
  const base = cfg.rarity.sources[source],
    extra = Math.max(0, Math.floor(magicFind) - cfg.rarity.magicFindBaseline);
  for (const kind of ["legendary", "set", "rare", "magic"]) {
    const k = cfg.rarity.magicFindDiminish[kind],
      effective = k > 0 ? Math.floor((extra * k) / (extra + k)) : extra;
    if (base[kind] > 0 && rng.next(1e4) < Math.floor((base[kind] * (100 + effective)) / 100))
      return kind;
  }
  return base.minimum || "normal";
}
function dxAffixCandidates(cfg, def, ilvl) {
  return cfg.affixes.filter(
    (a) =>
      a.slots.includes(def.Type) &&
      a.tiers.some((t) => t[0] <= ilvl) &&
      (!a.equipmentJob || equipmentSupportsAffixJob(def, a.equipmentJob)) &&
      (!a.excludeEquipmentJob || !equipmentSupportsAffixJob(def, a.excludeEquipmentJob)),
  );
}
function affixWeight(a, def) {
  return Math.round(a.weight * (a.slotWeights?.[def.Type] ?? 1));
}
function casterBase(def) {
  return (
    !equipmentSupportsAffixJob(def, "Warrior") &&
    (equipmentSupportsAffixJob(def, "Wizard") || equipmentSupportsAffixJob(def, "Taoist"))
  );
}
var unlockedTiers = (a, ilvl) =>
  a.tiers
    .map((t, i) => ({ t, i }))
    .filter((x) => x.t[0] <= ilvl)
    .slice(-3);
var primaryPolicy = (cfg, a) =>
  cfg.primaryAttributeRoll?.stats.includes(a.stat) ? cfg.primaryAttributeRoll : void 0;
function affixValueRange(cfg, a, pick, def) {
  return (def && primaryPolicy(cfg, a)?.slotRanges[def.Type]?.[pick.i]) || [pick.t[1], pick.t[2]];
}
function scaleAffixValue(a, value, def) {
  return a.casterScale !== void 0 && def && casterBase(def)
    ? Math.max(1, Math.round(value * a.casterScale))
    : value;
}
function dxRollAffix(cfg, a, ilvl, rng, def) {
  const allowed = unlockedTiers(a, ilvl);
  const rolledTier = weighted3(
    allowed.map((x, n) => ({ ...x, w: n + 1 })),
    (x) => x.w,
    rng,
  );
  const pick =
    primaryPolicy(cfg, a)?.tierSelection === "highest" ? allowed[allowed.length - 1] : rolledTier;
  const value = dxRollProperty(cfg, a.stat, affixValueRange(cfg, a, pick, def), rng);
  return { id: a.id, tier: pick.i, value: scaleAffixValue(a, value, def) };
}
function affixRanges(cfg, def, ilvl, pool) {
  const stats2 = /* @__PURE__ */ new Map();
  for (const affix of pool) {
    if (affixWeight(affix, def) <= 0) continue;
    const tiers = unlockedTiers(affix, ilvl),
      values = stats2.get(affix.stat) || [];
    for (const tier of primaryPolicy(cfg, affix)?.tierSelection === "highest"
      ? tiers.slice(-1)
      : tiers) {
      const [a, b] = affixValueRange(cfg, affix, tier, def).map((n) =>
        scaleAffixValue(affix, n, def),
      );
      values.push([Math.min(a, b), Math.max(a, b)]);
    }
    if (values.length) stats2.set(affix.stat, values);
  }
  return [...stats2].map(([stat, values]) => {
    const ranges = [];
    for (const [lo, hi] of values.sort((a, b) => a[0] - b[0])) {
      const last2 = ranges.at(-1);
      if (last2 && lo <= last2[1] + 1) last2[1] = Math.max(last2[1], hi);
      else ranges.push([lo, hi]);
    }
    return { stat, ranges };
  });
}
function unusedAffixes(cfg, def, dx, affixes2 = dx.affixes) {
  const used = /* @__PURE__ */ new Set([
    ...affixes2.map((a) => affixDef(cfg, a.id)?.stat),
    ...Object.keys(dx.fixed || {}),
  ]);
  return dxAffixCandidates(cfg, def, dx.ilvl).filter((a) => !used.has(a.stat));
}
function dxAddAffixes(cfg, def, dx, rng, count, maxPerSide) {
  const pool = unusedAffixes(cfg, def, dx);
  const sides = { prefix: 0, suffix: 0 };
  for (const a of dx.affixes) {
    const s = affixDef(cfg, a.id)?.side;
    if (s) sides[s]++;
  }
  for (let n = 0; n < count; n++) {
    let side =
      sides.prefix >= maxPerSide
        ? "suffix"
        : sides.suffix >= maxPerSide
          ? "prefix"
          : rng.next(2)
            ? "prefix"
            : "suffix";
    if (sides[side] >= maxPerSide) break;
    let available = pool.filter((a) => a.side === side);
    if (!available.length) {
      side = side === "prefix" ? "suffix" : "prefix";
      if (sides[side] >= maxPerSide) break;
      available = pool.filter((a) => a.side === side);
    }
    const family = weighted3(available, (a) => affixWeight(a, def), rng);
    if (!family) break;
    dx.affixes.push(dxRollAffix(cfg, family, dx.ilvl, rng, def));
    sides[side]++;
    for (let i = pool.length - 1; i >= 0; i--) if (pool[i].stat === family.stat) pool.splice(i, 1);
  }
}
function countFrom(weights, rng) {
  const i = weighted3(
    weights.map((w, n) => ({ w, n })),
    (x) => x.w,
    rng,
  );
  return (i?.n ?? 0) + 1;
}
function dxMaxSockets(cfg, def, ilvl) {
  return cfg.sockets.types[def.Type]?.ilvl.filter((n) => n <= ilvl).length || 0;
}
function dxGenerate(g, item, def, ctx, forced) {
  const cfg = dxConfig(g.rules);
  if (!cfg || !dxEligible(cfg, def)) return;
  const rng = g.rng,
    dx = { v: 1, rarity: "normal", ilvl: ctx.ilvl, affixes: [] };
  let rarity = forced ?? dxRollRarity(cfg, rng, ctx.source, ctx.magicFind);
  if (
    !forced &&
    ctx.source === "boss" &&
    rarity === "magic" &&
    g.rules.adaptations.forge?.recipes.some(
      (recipe) =>
        recipe.mode === "craft" &&
        recipe.refining &&
        recipe.skill !== "gem" &&
        recipe.inputs.some((input) => input.item === def.Index),
    ) &&
    rng.next(4) === 0
  )
    rarity = "normal";
  if (rarity === "legendary") {
    const choice = weighted3(
      cfg.legendaries.filter(
        (l) => l.slot === def.Type && l.minIlvl <= ctx.ilvl && baseSupportsJob(def, l.job),
      ),
      (l) => l.weight,
      rng,
    );
    if (choice) {
      dx.legendary = choice.id;
      dx.fixed = rollRanges(cfg, choice.stats, rng);
    } else rarity = "rare";
  }
  if (rarity === "set") {
    const pieces = cfg.sets
      .filter((s) => s.minIlvl <= ctx.ilvl && baseSupportsJob(def, s.job))
      .flatMap((s) => s.pieces.filter((p) => p.slot === def.Type).map((p) => ({ s, p })));
    const choice = pieces.length ? pieces[rng.next(pieces.length)] : void 0;
    if (choice) {
      dx.set = choice.s.id;
      dx.piece = choice.p.id;
      dx.fixed = rollRanges(cfg, choice.p.stats, rng);
    } else rarity = "rare";
  }
  dx.rarity = rarity;
  if (rarity === "magic" || rarity === "rare" || rarity === "legendary") {
    const c = cfg.affixCounts[rarity];
    dxAddAffixes(cfg, def, dx, rng, countFrom(c.weights, rng), c.maxPerSide);
  }
  if (rarity === "rare")
    dx.rareName = [rng.next(cfg.rareNames.first), rng.next(cfg.rareNames.second)];
  if (rarity === "magic" && !dx.affixes.length) dx.rarity = "normal";
  const max = dxMaxSockets(cfg, def, ctx.ilvl);
  if (max && rng.next(1e4) < (cfg.sockets.chanceByRarity[dx.rarity] || 0))
    dx.sockets = rng.next(max + 1, 1);
  item.dx = dx;
}
function dxNaturalItem(g, item, def, monster, actor, magicFind) {
  const cfg = dxConfig(g.rules);
  if (!cfg || !dxEligible(cfg, def)) return false;
  const source = dxSourceTier(g, monster, actor);
  dxGenerate(g, item, def, { source, ilvl: dxItemLevel(cfg, monster, source), magicFind });
  return true;
}
function dxCheckRequirement(g, r, item, def) {
  const cfg = dxConfig(g.rules);
  if (!cfg || !item.dx) return;
  const need = dxRequiredLevel(cfg, item, def);
  if (r.level < need) throw new LocalizedError(message("dx.error.level", { level: need }));
}
var procDepth = 0;
function monsterTier(g, target) {
  const d = g.monsters.get(target.definition);
  return d ? dxSourceTier(g, d, target) : "ordinary";
}
function dxNearbyMonsters(g, center, range, exclude) {
  return g
    .map(center.map)
    .actors.filter(
      (a) =>
        a !== exclude &&
        a.kind === "monster" &&
        !a.dead &&
        !a.friendly &&
        distance(a, center) <= range,
    )
    .sort((a, b) => distance(a, center) - distance(b, center) || a.id - b.id);
}
function dxOutgoing(g, source, target, raw, spell, defence) {
  if (
    !dxConfig(g.rules) ||
    defence === "None" ||
    target.kind !== "monster" ||
    target.friendly ||
    raw <= 0
  )
    return raw;
  if (source.kind !== "player") {
    const owner =
        source.friendly && source.master ? g.roles.find((r2) => r2.id === source.master) : void 0,
      pct2 = owner?.stats.DxPetDamagePercent || 0;
    return pct2 > 0 ? Math.floor((raw * (100 + pct2)) / 100) : raw;
  }
  const r = source,
    s = r.stats;
  let pct = 0;
  if (s.DxEliteDamagePercent || s.DxBossDamagePercent) {
    const tier = monsterTier(g, target);
    if (tier === "elite" || tier === "boss") pct += s.DxEliteDamagePercent || 0;
    if (tier === "boss") pct += s.DxBossDamagePercent || 0;
  }
  if (s.DxExecutePercent && target.maxHP > 0 && target.hp * 100 < target.maxHP * 30)
    pct += s.DxExecutePercent;
  if (s.DxBerserkPercent && r.maxHP > 0 && r.hp * 2 < r.maxHP) pct += s.DxBerserkPercent;
  if (
    s.DxSpellEchoChance &&
    spell &&
    procDepth === 0 &&
    defence.startsWith("MAC") &&
    g.rng.next(100) < s.DxSpellEchoChance
  ) {
    pct += 100;
    g.emit("DxProc", { Kind: "echo", ObjectID: target.id });
  }
  return pct ? Math.floor((raw * (100 + pct)) / 100) : raw;
}
function secondWind(g, cfg, r) {
  const pct = r.stats.DxSecondWindPercent || 0;
  if (!pct || r.dead || r.hp <= 0 || r.hp * 100 >= r.maxHP * 30) return;
  r.dxCooldowns ??= {};
  if (g.time < (r.dxCooldowns.secondWind ?? 0)) return;
  r.dxCooldowns.secondWind = g.time + cfg.secondWindCooldownMs;
  const heal = Math.floor((r.maxHP * pct) / 100);
  r.hp = Math.min(r.maxHP, r.hp + heal);
  g.emit("DxProc", { Kind: "secondWind", ObjectID: r.id, Value: heal });
  g.say(message("dx.secondWind", { value: heal }));
}
function dxAfterHit(g, source, target, amount, defence) {
  const cfg = dxConfig(g.rules);
  if (!cfg || defence === "None" || amount <= 0) return;
  if (target.kind === "player") secondWind(g, cfg, target);
  if (
    source.kind !== "player" ||
    source.dead ||
    target.kind !== "monster" ||
    target.friendly ||
    procDepth > 0
  )
    return;
  const r = source,
    s = r.stats;
  if (!target.dead && s.DxFreezeChance && g.rng.next(100) < s.DxFreezeChance) {
    if (g.buff(target, "Frozen", cfg.freezeDurationMs, 0, {}, r.id))
      g.emit("DxProc", { Kind: "freeze", ObjectID: target.id });
  }
  if (
    s.DxChainLightningChance &&
    s.DxChainLightningPercent &&
    g.rng.next(100) < s.DxChainLightningChance
  ) {
    const damage = Math.max(1, Math.floor((amount * s.DxChainLightningPercent) / 100)),
      hits = dxNearbyMonsters(g, target, cfg.chainLightning.range, target).slice(
        0,
        cfg.chainLightning.targets,
      );
    procDepth++;
    try {
      for (const m of hits) g.damage(r, m, damage, "None");
    } finally {
      procDepth--;
    }
    g.emit("DxProc", { Kind: "chain", ObjectID: target.id, Targets: hits.map((m) => m.id) });
  }
  if (s.DxCleavePercent) {
    const damage = Math.max(1, Math.floor((amount * s.DxCleavePercent) / 100)),
      hits = dxNearbyMonsters(g, target, 1, target).filter((m) => distance(m, r) <= 2);
    if (hits.length) {
      procDepth++;
      try {
        for (const m of hits) g.damage(r, m, damage, "None");
      } finally {
        procDepth--;
      }
    }
  }
  if (s.DxShockwaveChance && s.DxShockwavePercent && g.rng.next(100) < s.DxShockwaveChance) {
    const damage = Math.max(1, Math.floor((amount * s.DxShockwavePercent) / 100)),
      hits = dxNearbyMonsters(g, target, cfg.shockwave.range, target);
    procDepth++;
    try {
      for (const m of hits) g.damage(r, m, damage, "None");
    } finally {
      procDepth--;
    }
    g.emit("DxProc", {
      Kind: "shockwave",
      ObjectID: target.id,
      X: target.x,
      Y: target.y,
      Map: target.map,
    });
  }
  if (!target.dead && s.DxIgniteChance && s.DxIgnitePercent && g.rng.next(100) < s.DxIgniteChance) {
    g.buff(
      target,
      "DxIgnite",
      cfg.ignite.durationMs,
      Math.max(1, Math.floor((amount * s.DxIgnitePercent) / 100)),
      {},
      r.id,
    );
    g.emit("DxProc", { Kind: "ignite", ObjectID: target.id });
  }
  if (
    !target.dead &&
    s.DxCullPercent &&
    monsterTier(g, target) !== "boss" &&
    target.maxHP > 0 &&
    target.hp * 100 <= target.maxHP * s.DxCullPercent
  ) {
    procDepth++;
    try {
      g.damage(r, target, target.hp, "None");
    } finally {
      procDepth--;
    }
    g.emit("DxProc", { Kind: "cull", ObjectID: target.id });
  }
}


function dxIncoming(g, source, target, amount, defence) {
  const cfg = dxConfig(g.rules);
  if (!cfg || target.kind !== "player" || amount <= 0) return amount;
  const r = target,
    s = r.stats,
    struck = defence !== "None";
  if (struck && s.DxDamageReductionPercent)
    amount = Math.floor((amount * (100 - s.DxDamageReductionPercent)) / 100);
  if (struck && s.DxManaShieldPercent && r.mp > 0) {
    const share = Math.min(r.mp, Math.floor((amount * s.DxManaShieldPercent) / 100));
    r.mp -= share;
    amount -= share;
  }
  if (
    struck &&
    s.DxStaticChance &&
    s.DxStaticPercent &&
    procDepth === 0 &&
    source.kind === "monster" &&
    !source.friendly &&
    !source.dead &&
    g.rng.next(100) < s.DxStaticChance
  ) {
    procDepth++;
    try {
      g.damage(r, source, Math.max(1, Math.floor((amount * s.DxStaticPercent) / 100)), "None");
    } finally {
      procDepth--;
    }
    g.emit("DxProc", { Kind: "static", ObjectID: source.id, FromID: r.id });
  }
  if (s.DxCheatDeathPercent && amount >= r.hp && !r.dead) {
    r.dxCooldowns ??= {};
    if (g.time >= (r.dxCooldowns.cheatDeath ?? 0)) {
      r.dxCooldowns.cheatDeath = g.time + cfg.cheatDeathCooldownMs;
      const keep = Math.max(1, Math.floor((r.maxHP * s.DxCheatDeathPercent) / 100));
      if (r.hp <= keep) {
        r.hp = keep;
        amount = 0;
      } else amount = r.hp - keep;
      g.emit("DxProc", { Kind: "cheatDeath", ObjectID: r.id, Value: keep });
      g.say(message("dx.cheatDeath", { value: keep }));
    }
  }
  return Math.max(0, amount);
}
function dxOnKill(g, owner, victim, victimPoisoned) {
  const cfg = dxConfig(g.rules);
  if (!cfg || owner.dead) return;
  const s = owner.stats;
  if (s.DxLifeOnKillPercent) {
    const heal = Math.floor((owner.maxHP * s.DxLifeOnKillPercent) / 100);
    owner.hp = Math.min(owner.maxHP, owner.hp + heal);
  }
  if (s.DxFrenzy)
    g.buff(owner, "DxFrenzy", cfg.frenzy.durationMs, 0, { ...cfg.frenzy.stats }, owner.id);
  if (s.DxManaOnKillPercent) {
    const mana = Math.floor((owner.maxMP * s.DxManaOnKillPercent) / 100);
    owner.mp = Math.min(owner.maxMP, owner.mp + mana);
  }
  if (procDepth > 0) return;
  if (s.DxCorpseExplosionPercent) {
    const damage = Math.min(
      cfg.corpseExplosion.maxDamage,
      Math.floor((victim.maxHP * s.DxCorpseExplosionPercent) / 100),
    );
    if (damage > 0) {
      const hits = dxNearbyMonsters(g, victim, cfg.corpseExplosion.range, victim);
      procDepth++;
      try {
        for (const m of hits) g.damage(owner, m, damage, "None");
      } finally {
        procDepth--;
      }
      g.emit("DxProc", { Kind: "corpse", X: victim.x, Y: victim.y, Map: victim.map });
    }
  }
  if (s.DxPlague && victimPoisoned) {
    const tick = Math.max(
      1,
      Math.min(
        200,
        Math.floor((victim.maxHP * cfg.plague.tickPercent) / 100) + (s.AffixPoisonDamage || 0),
      ),
    );
    for (const m of dxNearbyMonsters(g, victim, cfg.plague.range, victim))
      g.buff(m, "Green", cfg.plague.durationMs, tick, {}, owner.id);
    g.emit("DxProc", { Kind: "plague", X: victim.x, Y: victim.y, Map: victim.map });
  }
}
function dxRuneDrop(g, a, d, owner) {
  const cfg = dxConfig(g.rules);
  if (!cfg || !owner) return;
  const source = dxSourceTier(g, d, a);
  if (source === "other" || g.rng.next(1e4) >= cfg.runeDrop[source]) return;
  const ilvl = dxItemLevel(cfg, d, source),
    rune = weighted3(
      cfg.runes.filter((r) => r.minIlvl <= ilvl),
      (r) => r.weight,
      g.rng,
    );
  if (rune) g.ground(a, g.newItem(rune.id));
}
function dxIsRune(g, id) {
  const cfg = dxConfig(g.rules);
  return !!cfg && !!runeDef(cfg, id);
}
function dxSocketQuote(g, _r, rune, target) {
  const cfg = dxConfig(g.rules),
    def = g.defs.get(target.id);
  if (!cfg || !def || !runeDef(cfg, rune.id)) throw new LocalizedError(message("dx.error.notRune"));
  const dx = target.dx;
  if (!dx?.sockets) throw new LocalizedError(message("dx.error.noSockets"));
  const used = dx.runes?.length || 0;
  if (used >= dx.sockets) throw new LocalizedError(message("dx.error.socketsFull"));
  const preview = { dx: { ...dx, runes: [...(dx.runes || []), rune.id] } },
    word = dxRuneword(cfg, preview, def);
  const details = [message("dx.socket.preview", { used: used + 1, total: dx.sockets })];
  if (word) details.push(message("dx.socket.runeword", { name: entityText("runewords", word.id) }));
  return {
    chance: 100,
    repair: false,
    socket: true,
    stat: "",
    gain: 0,
    effects: {},
    destructive: false,
    details,
  };
}
function dxSocket(g, r, rune, target) {
  dxSocketQuote(g, r, rune, target);
  const dx = target.dx;
  (dx.runes ??= []).push(rune.id);
  rune.count--;
  if (!rune.count) {
    const i = r.inventory.indexOf(rune);
    if (i >= 0) r.inventory[i] = null;
  }
  const word = dxRuneword(dxConfig(g.rules), target, g.defs.get(target.id));
  if (r.equipment.includes(target)) g.refresh(r);
  g.say(
    word
      ? message("dx.socket.formed", { name: entityText("runewords", word.id) })
      : message("dx.socket.done"),
  );
}
function affixText(cfg, a) {
  return message("dx.stat." + (affixDef(cfg, a.id)?.stat || "unknown"), { value: a.value });
}
function dxIsEssence(g, id) {
  const cfg = dxConfig(g.rules);
  return !!cfg && Object.values(cfg.essences).includes(id);
}
function essenceKind(cfg, id) {
  return Object.entries(cfg.essences).find(([, v]) => v === id)?.[0];
}
function enchantPool(cfg, def, dx, index) {
  const old = affixDef(cfg, dx.affixes[index].id);
  if (!old) return [];
  return unusedAffixes(
    cfg,
    def,
    dx,
    dx.affixes.filter((_, i) => i !== index),
  ).filter((a) => a.side === old.side);
}
function dxEnchantOptions(g, r, essence) {
  const cfg = dxConfig(g.rules),
    kind = essenceKind(cfg, essence.id),
    rows = [];
  for (const target of r.inventory) {
    const dx = target?.dx,
      def = target && g.defs.get(target.id);
    if (
      !target ||
      !dx ||
      !def ||
      dx.rarity === "normal" ||
      cfg.enchant.essenceByRarity[dx.rarity] !== kind
    )
      continue;
    for (const [index, a] of dx.affixes.entries()) {
      if (dx.enchanted !== void 0 && dx.enchanted !== index) continue;
      const ranges = affixRanges(cfg, def, dx.ilvl, enchantPool(cfg, def, dx, index));
      if (!ranges.length) continue;
      rows.push({
        uid: target.uid,
        id: target.id,
        affix: index,
        chance: 100,
        enchant: true,
        ranges,
        gold: cfg.enchant.goldPerItemLevel * dx.ilvl,
        details: [
          message("dx.enchant.option", { affix: affixText(cfg, a) }),
          message("dx.enchant.cost", { gold: cfg.enchant.goldPerItemLevel * dx.ilvl }),
        ],
      });
    }
  }
  return rows;
}
function dxEnchant(g, r, essence, target, index) {
  const cfg = dxConfig(g.rules),
    def = g.defs.get(target.id),
    dx = target.dx;
  if (
    !cfg ||
    !def ||
    !dx ||
    dx.rarity === "normal" ||
    !Number.isInteger(index) ||
    !dx.affixes[index]
  )
    throw new LocalizedError(message("dx.error.enchantTarget"));
  if (cfg.enchant.essenceByRarity[dx.rarity] !== essenceKind(cfg, essence.id))
    throw new LocalizedError(message("dx.error.essence"));
  if (dx.enchanted !== void 0 && dx.enchanted !== index)
    throw new LocalizedError(message("dx.error.enchantLocked"));
  const gold = cfg.enchant.goldPerItemLevel * dx.ilvl;
  if (r.gold < gold) throw new LocalizedError(message("forge.insufficient"));
  const family = weighted3(enchantPool(cfg, def, dx, index), (a) => affixWeight(a, def), g.rng);
  if (!family) throw new LocalizedError(message("dx.error.enchantTarget"));
  dx.affixes[index] = dxRollAffix(cfg, family, dx.ilvl, g.rng, def);
  dx.enchanted = index;
  r.gold -= gold;
  essence.count--;
  if (!essence.count) {
    const i = r.inventory.indexOf(essence);
    if (i >= 0) r.inventory[i] = null;
  }
  if (r.equipment.includes(target)) g.refresh(r);
  g.say(message("dx.enchant.done", { affix: affixText(cfg, dx.affixes[index]) }));
  dxTutorialEnchanted(g, r, target);
}
function take(rows, count) {
  const out = [];
  let need = count;
  for (const i of rows) {
    if (need <= 0) break;
    const n = Math.min(need, i.count);
    out.push({ uid: i.uid, count: n });
    need -= n;
  }
  return need > 0 ? void 0 : out;
}
function dxCubeQuote(g, _r, rows, reforgeTarget) {
  const cfg = dxConfig(g.rules);
  if (!cfg || !rows.length) return void 0;
  const essences = rows.filter((i) => essenceKind(cfg, i.id)),
    runes = rows.filter((i) => runeDef(cfg, i.id));
  const gear = rows.filter((i) => {
    const d = g.defs.get(i.id);
    return !!d && dxEligible(cfg, d) && i.count === 1;
  });
  if (gear.length + essences.length + runes.length !== rows.length) return void 0;
  if (
    gear.length === 1 &&
    gear[0].dx?.rarity === "rare" &&
    !runes.length &&
    (essences.length || reforgeTarget !== void 0)
  ) {
    const item2 = gear[0],
      dx2 = item2.dx,
      def2 = g.defs.get(item2.id),
      recipe2 = cfg.cube.reforgeRare,
      material = cfg.essences[recipe2.essence];
    if (
      (reforgeTarget === void 0 || reforgeTarget === item2.uid) &&
      essences.every((i) => i.id === material)
    ) {
      const consume = take(essences, recipe2.count);
      return {
        kind: "reforge",
        target: item2.uid,
        consume: [{ uid: item2.uid, count: 0 }, ...(consume || [])],
        gold: recipe2.goldPerItemLevel * dx2.ilvl,
        outputs: [],
        description: message("dx.cube.reforge", { count: recipe2.count }),
        reforge: {
          material,
          count: recipe2.count,
          ranges: affixRanges(cfg, def2, dx2.ilvl, unusedAffixes(cfg, def2, dx2, [])),
          enough: !!consume,
        },
      };
    }
  }
  if (reforgeTarget !== void 0) return void 0;
  if (rows.length === 1 && gear.length === 1) {
    const item2 = gear[0],
      dx2 = item2.dx;
    if (!dx2 || dx2.rarity === "normal") return void 0;
    assertDxDisposable(g, item2);
    const outputs = cfg.salvage[dx2.rarity].map((o) => ({
      item: cfg.essences[o.essence],
      count: o.count,
    }));
    return {
      kind: "salvage",
      target: item2.uid,
      consume: [{ uid: item2.uid, count: 1 }],
      gold: 0,
      outputs,
      description: message("dx.cube.salvage"),
    };
  }
  if (!gear.length && runes.length === rows.length && new Set(runes.map((i) => i.id)).size === 1) {
    const order = cfg.runes.findIndex((r) => r.id === runes[0].id),
      next = cfg.runes[order + 1],
      consume = take(runes, cfg.cube.runeUpgrade.count);
    if (!next || !consume) return void 0;
    return {
      kind: "rune",
      consume,
      gold: cfg.cube.runeUpgrade.gold,
      outputs: [{ item: next.id, count: 1 }],
      description: message("dx.cube.rune", { count: cfg.cube.runeUpgrade.count }),
    };
  }
  if (
    gear.length !== 1 ||
    runes.length ||
    !essences.length ||
    new Set(essences.map((i) => i.id)).size !== 1
  )
    return void 0;
  const item = gear[0],
    def = g.defs.get(item.id),
    dx = item.dx,
    kind = essenceKind(cfg, essences[0].id);
  const recipe = (name, k, ilvl) => {
    const r = cfg.cube[name];
    if (kind !== r.essence) return void 0;
    const consume = take(essences, r.count);
    if (!consume) return void 0;
    return {
      kind: k,
      target: item.uid,
      consume: [{ uid: item.uid, count: 0 }, ...consume],
      gold: r.goldPerItemLevel * ilvl,
      outputs: [],
      description: message("dx.cube." + k, { count: r.count }),
    };
  };
  if (dx?.rarity === "magic") return recipe("upgradeMagic", "upgrade", dx.ilvl);
  if ((!dx || dx.rarity === "normal") && !dx?.sockets && !item.affixes?.length) {
    const ilvl = dx?.ilvl ?? Math.max(1, def.RequiredType === "Level" ? def.RequiredAmount : 1);
    if (!dxMaxSockets(cfg, def, ilvl)) return void 0;
    return recipe("punchSockets", "punch", ilvl);
  }
  return void 0;
}
function dxSalvageNpc(g, n) {
  const cfg = dxConfig(g.rules);
  return !!cfg && (cfg.salvageNpcRoles || []).includes(n.role);
}


function dxSalvageQuote(g, rows) {
  const cfg = dxConfig(g.rules);
  if (!cfg || !rows.length || rows.length > 8) return void 0;
  const totals = /* @__PURE__ */ new Map();
  for (const i of rows) {
    const d = g.defs.get(i.id);
    if (!d || !dxEligible(cfg, d) || i.count !== 1 || !i.dx || i.dx.rarity === "normal")
      return void 0;
    assertDxDisposable(g, i);
    for (const o of cfg.salvage[i.dx.rarity]) {
      const id = cfg.essences[o.essence];
      totals.set(id, (totals.get(id) || 0) + o.count);
    }
  }
  return {
    kind: "salvage",
    consume: rows.map((i) => ({ uid: i.uid, count: 1 })),
    gold: 0,
    outputs: [...totals].map(([item, count]) => ({ item, count })),
    description: message("dx.salvage.quote", { count: rows.length }),
  };
}
function dxCubeForge(g, r, q) {
  const cfg = dxConfig(g.rules);
  for (const c of q.consume)
    if (c.count)
      assertDxDisposable(
        g,
        r.inventory.find((i) => i?.uid === c.uid),
      );
  for (const c of q.consume) {
    if (!c.count) continue;
    const grid = r.inventory.find((i) => i?.uid === c.uid);
    if (!grid || grid.count < c.count) throw new LocalizedError(message("forge.insufficient"));
    grid.count -= c.count;
    if (!grid.count) r.inventory[r.inventory.indexOf(grid)] = null;
  }
  const item = q.target === void 0 ? void 0 : r.inventory.find((i) => i?.uid === q.target);
  if (q.kind === "salvage" || q.kind === "rune") return message("dx.cube.done." + q.kind);
  if (!item) throw new LocalizedError(message("forge.insufficient"));
  const def = g.defs.get(item.id);
  if (q.kind === "punch") {
    const ilvl =
      item.dx?.ilvl ?? Math.max(1, def.RequiredType === "Level" ? def.RequiredAmount : 1);
    item.dx ??= { v: 1, rarity: "normal", ilvl, affixes: [] };
    item.dx.sockets = dxMaxSockets(cfg, def, ilvl);
  } else if (q.kind === "reforge") {
    const dx = item.dx;
    dx.affixes = [];
    delete dx.enchanted;
    const c = cfg.affixCounts.rare;
    dxAddAffixes(cfg, def, dx, g.rng, countFrom(c.weights, g.rng), c.maxPerSide);
    dx.rareName = [g.rng.next(cfg.rareNames.first), g.rng.next(cfg.rareNames.second)];
  } else if (q.kind === "upgrade") {
    const dx = item.dx,
      c = cfg.affixCounts.rare,
      target = countFrom(c.weights, g.rng);
    dx.rarity = "rare";
    delete dx.enchanted;
    dxAddAffixes(cfg, def, dx, g.rng, Math.max(0, target - dx.affixes.length), c.maxPerSide);
    dx.rareName = [g.rng.next(cfg.rareNames.first), g.rng.next(cfg.rareNames.second)];
  }
  return message("dx.cube.done." + q.kind);
}
var rarityNames = /* @__PURE__ */ new Set(["normal", "magic", "rare", "legendary", "set"]);
function validDxState(dx) {
  if (dx === void 0) return true;
  const d = dx,
    int = (v, min = 0, max = 1e9) => Number.isInteger(v) && v >= min && v <= max,
    str = (v) => v === void 0 || (typeof v === "string" && v.length <= 60);
  return (
    !!d &&
    typeof d === "object" &&
    d.v === 1 &&
    rarityNames.has(d.rarity) &&
    int(d.ilvl, 1, 200) &&
    Array.isArray(d.affixes) &&
    d.affixes.length <= 12 &&
    d.affixes.every(
      (a) =>
        !!a &&
        typeof a.id === "string" &&
        a.id.length <= 40 &&
        int(a.tier, 0, 20) &&
        Number.isFinite(a.value),
    ) &&
    (d.fixed === void 0 ||
      (!!d.fixed &&
        typeof d.fixed === "object" &&
        !Array.isArray(d.fixed) &&
        Object.values(d.fixed).every(Number.isFinite))) &&
    str(d.legendary) &&
    str(d.set) &&
    str(d.piece) &&
    (d.rareName === void 0 ||
      (Array.isArray(d.rareName) &&
        d.rareName.length === 2 &&
        d.rareName.every((v) => int(v, 0, 999)))) &&
    (d.sockets === void 0 || int(d.sockets, 0, 6)) &&
    (d.runes === void 0 ||
      (Array.isArray(d.runes) &&
        d.runes.length <= (d.sockets || 0) &&
        d.runes.every((v) => int(v, 1)))) &&
    (d.enchanted === void 0 || int(d.enchanted, 0, 11))
  );
}

// games/darkforged/singleplayer/core/forge.ts
var keys = ["MaxDC", "MaxMC", "MaxAC", "MaxSC", "MaxMAC", "Luck", "Accuracy", "Agility"];
function forgePoints(item) {
  return keys.reduce((n, k) => n + Math.max(0, item.added[k] || 0), 0);
}
function forgeQuote(g, r, data) {
  const cfg = g.rules.adaptations.forge;
  if (!cfg) throw new LocalizedError(message("core.forge.forgeQuote.135a98ae94"));
  const dxActive = !!g.rules.adaptations.diablo?.enabled;
  let cubeMaterial, cubeSelection;
  const dxResult = (dx, ids) => ({
    mode: "dxCube",
    dx,
    selected: [...ids],
    allocations: [],
    outputQuality: 0,
    outputStars: void 0,
    requirement: "",
    recipe: void 0,
    processingInputs: 1,
    affixIndex: -1,
    target: dx.target,
    inputs: [],
    outputs: dx.outputs,
    gold: dx.gold,
    description: dx.description,
    stat: "",
    chance: 100,
    canForge: r.gold >= dx.gold && (dx.reforge?.enough ?? true),
    cubeMaterial: void 0,
    cubeSelection: [...ids],
  });
  if (data.Mode === "dxsalvage") {
    const ids = data.Selected;
    if (!Array.isArray(ids) || !ids.length || ids.length > 8 || new Set(ids).size !== ids.length)
      throw new LocalizedError(message("core.forge.forgeQuote.26b7c68817"));
    if (!dxSalvageNpc(g, g.requireNPC(r))) throw new LocalizedError(message("dx.salvage.npc"));
    const rows = ids.map((uid) => r.inventory.find((i) => i?.uid === uid));
    const dx = rows.every(Boolean) ? dxSalvageQuote(g, rows) : void 0;
    if (!dx) throw new LocalizedError(message("dx.salvage.invalid"));
    return dxResult(dx, ids);
  }
  if (data.Mode === "cube") {
    const ids = data.Selected;
    if (!Array.isArray(ids) || !ids.length || ids.length > 8 || new Set(ids).size !== ids.length)
      throw new LocalizedError(message("core.forge.forgeQuote.26b7c68817"));
    const placed = ids.map(
      (uid) =>
        r.inventory.find((i) => i?.uid === uid) ||
        r.questInventory.find(
          (i) =>
            i &&
            i.uid === uid &&
            cfg.recipes.some((v) => v.mode === "pandora" && v.inputs.some((a) => a.item === i.id)),
        ),
    );
    if (placed.some((i) => !i || i.id === cfg.boxId))
      throw new LocalizedError(message("core.forge.forgeQuote.052dc5ca26"));
    const rows = placed;
    cubeSelection = [...ids];
    const dx = dxCubeQuote(g, r, rows, data.ReforgeTarget);
    if (data.ReforgeTarget !== void 0 && dx?.kind !== "reforge")
      throw new LocalizedError(message("forge.insufficient"));
    if (dx?.reforge) {
      for (const item of rows) if (item.uid !== dx.target) assertDxDisposable(g, item);
    }
    if (dx) {
      if (!r.inventory.some((i) => i?.id === cfg.boxId))
        throw new LocalizedError(message("core.forge.forgeQuote.68ef58e0c7"));
      return dxResult(dx, ids);
    }
    rows.forEach((item) => assertDxDisposable(g, item));
    const stone = rows.find((i) => i.id === cfg.mixId);
    if (stone) {
      cubeMaterial = stone.uid;
      const gear = rows.filter((i) => i !== stone);
      data = { Mode: "mix", Target: gear[0]?.uid, Selected: gear.map((i) => i.uid) };
    } else {
      const recipe2 = cfg.recipes.find(
        (v) =>
          v.mode === "pandora" &&
          rows.every((i) => v.inputs.some((a) => a.item === i.id)) &&
          v.inputs.every(
            (a) => rows.filter((i) => i.id === a.item).reduce((n, i) => n + i.count, 0) >= a.count,
          ),
      );
      if (!recipe2) throw new LocalizedError(message("core.forge.forgeQuote.e098ab1670"));
      const ingredients = [];
      for (const input of recipe2.inputs) {
        let need = input.count;
        for (const i of rows.filter((i2) => i2.id === input.item)) {
          const count = Math.min(need, i.count);
          if (count) ingredients.push({ uid: i.uid, count });
          need -= count;
        }
      }
      if (ingredients.length !== rows.length)
        throw new LocalizedError(message("core.forge.forgeQuote.2933c380f0"));
      data = { Mode: "recipe", Recipe: recipe2.id, Ingredients: ingredients };
    }
  }
  const mode = String(data.Mode),
    target = r.inventory.find((i) => i?.uid === Number(data.Target)),
    material = r.inventory.find((i) => i?.uid === Number(data.Material));
  if (
    dxActive &&
    target?.dx &&
    [
      "dismantle",
      "enhance",
      "reset",
      "merge",
      "crystal",
      "awaken",
      "potential",
      "potentialChoose",
    ].includes(mode)
  )
    throw new LocalizedError(message("dx.workshop.error.legacy"));
  if (mode === "identify") throw new LocalizedError(message("core.forge.forgeQuote.66a920f6f4"));
  const inputs = [],
    outputs = [];
  const allocations = [];
  const available = [...r.inventory, ...r.questInventory].filter((i) => !!i);
  let description = "",
    requirement = "";
  let gold = 0,
    stat = "",
    selected = [],
    recipe,
    affixIndex2 = -1,
    chance = 0,
    processingInputs = 1;
  if (mode === "recipe") {
    recipe = cfg.recipes.find((v) => v.id === String(data.Recipe));
    if (!recipe) throw new LocalizedError(message("core.forge.forgeQuote.db530d007a"));
    if (recipe.mode === "pandora" && !r.inventory.some((i) => i?.id === cfg.boxId))
      throw new LocalizedError(message("core.forge.forgeQuote.68ef58e0c7"));
    if (
      recipe.skill &&
      recipe.skill !== "talent" &&
      craftLevel(r, recipe.skill) < (recipe.level || 1)
    )
      requirement = message("forge.requirement", {
        skill: entityText("crafting", recipe.skill),
        level: recipe.level || 1,
      });
    const batches = recipe.processing
      ? Math.min(5, Math.max(1, Math.floor(Number(data.Count) || 1)))
      : 1;
    processingInputs = batches;
    inputs.push(...recipe.inputs.map((i) => ({ ...i, count: i.count * batches })));
    outputs.push(recipe.output);
    gold = recipe.gold * batches;
    description = message("recipe." + recipe.id, {
      output: entityText("items", recipe.output.item),
      input: entityText("items", recipe.inputs[0].item),
    });
    if (data.Ingredients !== void 0) {
      if (!Array.isArray(data.Ingredients))
        throw new LocalizedError(message("core.forge.forgeQuote.bbacd00f52"));
      const seen = /* @__PURE__ */ new Set();
      for (const entry of data.Ingredients) {
        const item = available.find((i) => i.uid === entry.uid),
          count = entry.count;
        if (
          !item ||
          seen.has(item.uid) ||
          !Number.isSafeInteger(count) ||
          count < 1 ||
          count > item.count ||
          !inputs.some((row) => row.item === item.id)
        )
          throw new LocalizedError(message("core.forge.forgeQuote.96c6a05c19"));
        assertDxDisposable(g, item);
        seen.add(item.uid);
        allocations.push({ uid: item.uid, item: item.id, count });
      }
      if (
        inputs.some(
          (row) =>
            allocations.filter((a) => a.item === row.item).reduce((n, a) => n + a.count, 0) !==
            row.count,
        )
      )
        throw new LocalizedError(message("core.forge.forgeQuote.0ef60a70ef"));
    } else
      for (const row of inputs) {
        let need = row.count;
        const candidates = available
          .filter((i) => i.id === row.item && !dxFavoriteProtected(g, i))
          .sort(
            (a, b) =>
              (dxActive ? rarities.indexOf(dxRarity(a)) - rarities.indexOf(dxRarity(b)) : 0) ||
              (a.materialQuality || 0) - (b.materialQuality || 0) ||
              forgePoints(a) - forgePoints(b) ||
              a.uid - b.uid,
          );
        for (const item of candidates) {
          if (need <= 0) break;
          const count = Math.min(need, item.count);
          allocations.push({ uid: item.uid, item: item.id, count });
          need -= count;
        }
      }
    selected = allocations.map((a) => a.uid);
  } else if (mode === "mix") {
    if (!r.inventory.some((i) => i?.id === cfg.boxId))
      throw new LocalizedError(message("core.forge.forgeQuote.68ef58e0c7"));
    if (!target) throw new LocalizedError(message("core.forge.forgeQuote.eacdc6ab6e"));
    const def = g.defs.get(target.id),
      grade = Number(def.DreamGrade);
    if (
      ![0, 2, 3, 4, 5, 6, 7].includes(grade) ||
      String(def.DreamName || def.Name).startsWith("\u5929\u9F99\u9879\u94FE")
    )
      throw new LocalizedError(message("core.forge.forgeQuote.23eb261b8e"));
    assertDxDisposable(g, target);
    const chosen2 = Array.isArray(data.Selected)
      ? data.Selected.map(Number)
      : [
          target.uid,
          ...r.inventory
            .filter(
              (i) =>
                !!i && i.id === target.id && i.uid !== target.uid && !dxFavoriteProtected(g, i),
            )
            .sort((a, b) => forgePoints(a) - forgePoints(b) || a.uid - b.uid)
            .slice(0, 2)
            .map((i) => i.uid),
        ];
    const gear = chosen2.map((uid) => r.inventory.find((i) => i?.uid === uid));
    gear.forEach((item) => assertDxDisposable(g, item));
    if (dxActive && gear.some((item) => item?.dx))
      throw new LocalizedError(message("dx.workshop.error.legacy"));
    if (
      new Set(chosen2).size !== chosen2.length ||
      gear.length < 3 ||
      gear.some((i) => !i || i.id !== target.id || i.count !== 1)
    )
      throw new LocalizedError(message("core.forge.forgeQuote.ab95b8372e"));
    if (gear.some((i) => i && forgePoints(i) >= 8))
      throw new LocalizedError(message("core.forge.forgeQuote.44a4cbc171"));
    selected = chosen2;
    inputs.push({ item: cfg.mixId, count: 1 });
    description = message("forge.mixDescription", { count: gear.length, chance: cfg.mixChance });
  } else if (mode === "merge") {
    const essence = cfg.essences.find((v) => v.item === material?.id),
      next =
        essence &&
        cfg.essences.find((v) => v.grade === essence.grade + 1 && v.stat === essence.stat);
    if (!essence || !next) throw new LocalizedError(message("core.forge.forgeQuote.5f2745c8a9"));
    if (target) throw new LocalizedError(message("core.forge.forgeQuote.ce273c94ef"));
    gold = cfg.fees.merge * essence.grade;
    inputs.push({ item: essence.item, count: 20 });
    outputs.push({ item: next.item, count: 1 });
    description = message("forge.mergeDescription");
  } else {
    if (!target || target.count !== 1)
      throw new LocalizedError(message("core.forge.forgeQuote.46f045e474"));
    const def = g.defs.get(target.id),
      grade = Number(def.DreamGrade),
      points = forgePoints(target);
    if (
      !def.DreamType ||
      (["dismantle", "enhance", "reset", "crystal"].includes(mode) &&
        !g.rules.adaptations.dreamRuntime?.statPools[String(def.DreamType)])
    )
      throw new LocalizedError(message("core.forge.forgeQuote.436bf1d625"));
    if (mode === "identify") {
      throw new LocalizedError(message("core.forge.forgeQuote.66a920f6f4"));
    } else if (mode === "awaken") {
      if (!target.handmade && !def.DreamRawItem?.Handmake)
        throw new LocalizedError(message("core.forge.forgeQuote.f8a3c820c0"));
      if (
        def.Type !== "Weapon" &&
        Number(def.DreamType) !== 6 &&
        def.DreamName !== "\u5357\u74DC\u5934"
      )
        throw new LocalizedError(message("core.forge.forgeQuote.884a71edee"));
      if (points < 1) throw new LocalizedError(message("core.forge.forgeQuote.8184c98ae7"));
      if (target.affixes?.length)
        throw new LocalizedError(message("core.forge.forgeQuote.29047386ac"));
      if (
        !Object.values(g.rules.adaptations.dreamRuntime.affixes).some(
          (a) =>
            a.Weight > 0 &&
            Object.values(a.Poses).includes(Number(def.DreamType)) &&
            Object.values(a.Affixes).some((v) => v.Grade <= grade),
        )
      )
        throw new LocalizedError(message("core.forge.forgeQuote.1d1dbf9d26"));
      const count = cfg.crafting?.talents[String(material?.id)];
      if (!count) throw new LocalizedError(message("core.forge.forgeQuote.db1c5e9058"));
      stat = String(Math.min(count, def.Type === "Weapon" ? 5 : 3));
      inputs.push({ item: material.id, count: 1 });
      description = message("forge.awakenDescription", { count: stat });
    } else if (mode === "potential" || mode === "potentialChoose") {
      if (!target.handmade && !def.DreamRawItem?.Handmake)
        throw new LocalizedError(message("core.forge.forgeQuote.92addbc485"));
      if (mode === "potentialChoose") {
        if (!target.potentialOptions?.[Number(data.Choice)])
          throw new LocalizedError(message("core.forge.forgeQuote.6c861e241a"));
        stat = String(data.Choice);
        description = message("forge.chooseDescription");
      } else {
        if ((target.potentialOptions?.length || 0) >= 5)
          throw new LocalizedError(message("core.forge.forgeQuote.fd4b3dca21"));
        const stone = g.defs.get(material?.id || 0),
          level = Number(stone?.DreamRawItem?.Hide || 0);
        if (!String(stone?.DreamName).startsWith("\u6F5C\u80FD\u77F3"))
          throw new LocalizedError(message("core.forge.forgeQuote.369f9d002e"));
        const kind = def.Type === "Stone" && def.DreamType === 16 ? "Gem" : def.Type,
          cap = Math.min(level, Number(def.DreamPotentialCap ?? def.DreamGrade));
        const levels = Object.keys(cfg.potentials?.[kind] || {})
          .map(Number)
          .filter((n) => n <= cap);
        if (!levels.length) throw new LocalizedError(message("core.forge.forgeQuote.874ec5991e"));
        stat = kind + ":" + Math.max(...levels);
        inputs.push({ item: material.id, count: 1 });
        description = message("forge.potentialDescription", {
          attempt: (target.potentialOptions?.length || 0) + 1,
        });
      }
    } else if (mode === "crystal") {
      if (String(def.DreamName).startsWith("\u5929\u9F99\u9879\u94FE"))
        throw new LocalizedError(message("core.forge.forgeQuote.e612e0c45e"));
      const level = Number(g.defs.get(material?.id || 0)?.DreamRawItem?.Hide || 0);
      if (
        !String(g.defs.get(material?.id || 0)?.DreamName).startsWith("\u51DD\u6676\u77F3") ||
        level < grade
      )
        throw new LocalizedError(message("core.forge.forgeQuote.6cdf3f0a25"));
      if (!cfg.fees.crystalByStoneGrade[String(level)] || grade < 1)
        throw new LocalizedError(message("core.forge.forgeQuote.555a0b953e"));
      if (points >= 8) throw new LocalizedError(message("core.forge.forgeQuote.21ff3969ad"));
      gold = cfg.fees.crystalByStoneGrade[String(level)] * (points + 1);
      chance = (grade >= 5 ? cfg.crystalRates.highGrade : cfg.crystalRates.normal)[points];
      inputs.push({ item: material.id, count: 1 });
      description = message("forge.crystalDescription", {
        from: points,
        to: points + 1,
        chance,
        loss: cfg.crystalLoseChance,
      });
    } else if (mode === "reset") {
      if (points < 1) throw new LocalizedError(message("core.forge.forgeQuote.6df3648484"));
      if (points > 8) throw new LocalizedError(message("core.forge.forgeQuote.1da2e99ec4"));
      inputs.push({ item: cfg.resetId, count: 1 });
      gold = cfg.fees.reset * Math.max(1, grade - 6) * points;
      description = message("forge.resetDescription", { points });
    } else {
      if (grade < 2 || grade > 6)
        throw new LocalizedError(message("core.forge.forgeQuote.3d24a74942"));
      if (mode === "dismantle") {
        assertDxDisposable(g, target);
        for (const k of ["MaxDC", "MaxMC", "MaxSC"]) {
          const n = target.added[k] || 0;
          if (n > 0) {
            const essence = cfg.essences.find((v) => v.grade === grade - 1 && v.stat === k);
            if (!essence) throw new LocalizedError(message("core.forge.forgeQuote.0e4b96e457"));
            outputs.push({ item: essence.item, count: n });
          }
        }
        if (!outputs.length) throw new LocalizedError(message("core.forge.forgeQuote.95fd5267e7"));
        gold = cfg.fees.dismantle * (grade - 1) * outputs.reduce((n, v) => n + v.count, 0);
        description = message("forge.dismantleDescription");
      } else if (mode === "enhance") {
        const essence = cfg.essences.find((v) => v.item === material?.id && v.grade >= grade);
        if (!essence)
          throw new LocalizedError(message("core.forge.forgeQuote.5c90c49396", { p0: grade }));
        if (points >= 5) throw new LocalizedError(message("core.forge.forgeQuote.9d820f44c6"));
        stat = essence.stat;
        inputs.push({ item: essence.item, count: points < 3 ? 1 : points === 3 ? 2 : 3 });
        gold = cfg.fees.enhance * grade * (points + 1);
        description = message("forge.enhanceDescription", {
          from: points,
          to: points + 1,
          stat: message("gear.stat." + stat.slice(3)),
        });
      } else throw new LocalizedError(message("core.forge.forgeQuote.eecbe4c7a3"));
    }
  }
  const totals = /* @__PURE__ */ new Map();
  for (const row of inputs) totals.set(row.item, (totals.get(row.item) || 0) + row.count);
  const allocated =
    !recipe ||
    inputs.every(
      (row) =>
        allocations.filter((a) => a.item === row.item).reduce((n, a) => n + a.count, 0) ===
        row.count,
    );
  if (
    !allocated &&
    !requirement &&
    inputs.some((row) => available.some((i) => i.id === row.item && dxFavoriteProtected(g, i)))
  )
    requirement = message("dx.favorite.error.protected");
  const enough =
    !requirement &&
    allocated &&
    [...totals].every(([id, n]) => g.count(r, id) >= n) &&
    r.gold >= gold;
  const chosen = allocations.map((a) => ({
    ...available.find((i) => i.uid === a.uid),
    count: a.count,
  }));
  const outputQuality = recipe ? materialOutputQuality(r, recipe, chosen) : 0;
  const outputStars = recipe?.handmade ? craftStars(g, { id: recipe.output.item }, chosen) : void 0;
  return {
    mode,
    dx: void 0,
    selected,
    allocations,
    outputQuality,
    outputStars,
    requirement,
    recipe,
    processingInputs,
    affixIndex: affixIndex2,
    target: target?.uid,
    inputs: [...totals].map(([item, count]) => ({ item, count })),
    outputs,
    gold,
    description,
    stat,
    chance,
    canForge: enough,
    cubeMaterial,
    cubeSelection,
  };
}


function forge(g, r, data) {
  const quote = forgeQuote(g, r, data);
  if (!quote.canForge) throw new LocalizedError(quote.requirement || message("forge.insufficient"));
  const backup = structuredClone({
    inventory: r.inventory,
    questInventory: r.questInventory,
    gold: r.gold,
    crafting: r.crafting,
    dxTutorial: r.dxTutorial,
  });
  const rng = structuredClone({ seed: g.rng.seed, i: g.rng.i, j: g.rng.j }),
    nextId = g.nextId;
  try {
    let outcome = message("forge.complete");
    const selectedItems = quote.selected
      .map((id) => [...r.inventory, ...r.questInventory].find((i) => i?.uid === id))
      .filter(Boolean)
      .map((i) => structuredClone(i));
    if (quote.recipe) {
      for (const i of selectedItems) i.count = quote.allocations.find((a) => a.uid === i.uid).count;
      for (const a of quote.allocations) {
        const grid = r.inventory.some((i2) => i2?.uid === a.uid) ? r.inventory : r.questInventory;
        const i = grid.find((i2) => i2?.uid === a.uid);
        i.count -= a.count;
        if (!i.count) grid[grid.indexOf(i)] = null;
      }
    } else if (quote.cubeMaterial) {
      const stone = r.inventory.find((i) => i?.uid === quote.cubeMaterial);
      if (--stone.count === 0) r.inventory[r.inventory.indexOf(stone)] = null;
    } else for (const row of quote.inputs) g.consume(r, row.item, row.count);
    const target = r.inventory.find((i) => i?.uid === quote.target);
    if (quote.mode === "identify" && target)
      for (const affix of target.affixes || []) affix.revealed = true;
    if (quote.mode === "awaken" && target)
      rollAffixes(
        target,
        g.defs.get(target.id),
        g.rng,
        g.rules.adaptations.dreamRuntime.affixes,
        Number(quote.stat),
      );
    if (quote.mode === "potential" && target) {
      const [kind, level] = quote.stat.split(":"),
        rows = g.rules.adaptations.forge.potentials[kind][level],
        a = structuredClone(rows[g.rng.next(rows.length)]);
      target.potentialOptions ??= [];
      target.potential = { ...a, rolls: target.potentialOptions.length + 1 };
      target.potentialOptions.push(target.potential);
    }
    if (quote.mode === "potentialChoose" && target)
      target.potential = target.potentialOptions[Number(quote.stat)];
    if (quote.mode === "mix") {
      const best = selectedItems.sort(
        (a, b) => forgePoints(b) - forgePoints(a) || a.uid - b.uid,
      )[0];
      for (const id of quote.selected)
        r.inventory[r.inventory.findIndex((i) => i?.uid === id)] = null;
      if (g.rng.next(100) < g.rules.adaptations.forge.mixChance) {
        const points = Math.min(8, forgePoints(best) + 1);
        randomizePoints(g, best, points);
        delete best.affixes;
        delete best.potential;
        delete best.potentialOptions;
        delete best.weaponGrowth;
        outcome = message("forge.mixSuccess");
      } else outcome = message("forge.mixFailed");
      if (!g.give(r, best, false)) throw new LocalizedError(message("core.forge.forge.f4f8709c7f"));
    }
    if (quote.mode === "crystal" && target) {
      const n = forgePoints(target),
        cfg = g.rules.adaptations.forge;
      let next = n;
      if (g.rng.next(100) < quote.chance) {
        next = n + 1;
        outcome = message("forge.crystalSuccess");
      } else if (g.rng.next(100) < cfg.crystalLoseChance) {
        next = Math.max(0, n - 1);
        outcome = message("forge.crystalLost");
      } else outcome = message("forge.crystalFailed");
      randomizePoints(g, target, next);
    }
    if (quote.mode === "dismantle")
      r.inventory[r.inventory.findIndex((i) => i?.uid === quote.target)] = null;
    if (quote.mode === "dxCube" && quote.dx) outcome = dxCubeForge(g, r, quote.dx);
    if (quote.mode === "enhance" && target)
      target.added[quote.stat] = (target.added[quote.stat] || 0) + 1;
    if (quote.mode === "reset" && target) randomizePoints(g, target, forgePoints(target));
    for (const row of quote.outputs) {
      const item = g.newItem(row.item, row.count);
      item.bound = quote.mode === "recipe";
      if (quote.recipe) {
        const recipe = quote.recipe;
        const quality = materialOutputQuality(r, recipe, selectedItems);
        if (quality) item.materialQuality = quality;
        if (recipe.handmade) {
          item.handmade = true;
          randomizePoints(g, item, craftStars(g, item, selectedItems));
          if (g.rules.adaptations.dreamRuntime)
            rollExceptionalAffixes(
              item,
              g.defs.get(item.id),
              g.rng,
              g.rules.adaptations.dreamRuntime,
            );
        }
      }
      if (!g.give(r, item, false)) throw new LocalizedError(message("core.forge.forge.98d59f5b62"));
    }
    const skill = quote.recipe?.skill;
    if (skill && skill !== "talent" && craftLevel(r, skill) > 0) {
      const amount = (quote.recipe?.experience || 1) * quote.processingInputs;
      craftXP(g, r, skill, amount);
      g.say(
        message("forge.skillExperienceEarned", { skill: entityText("crafting", skill), amount }),
      );
    }
    r.gold -= quote.gold;
    g.refresh(r);
    if (quote.mode === "dxCube" && quote.dx?.kind === "salvage")
      dxTutorialSalvaged(g, r, selectedItems);
    g.say(message("forge.result", { description: quote.description, outcome }));
  } catch (e) {
    Object.assign(r, backup);
    if (backup.crafting === void 0) delete r.crafting;
    if (backup.dxTutorial === void 0) delete r.dxTutorial;
    Object.assign(g.rng, rng);
    g.nextId = nextId;
    throw e;
  }
}
function randomizePoints(g, item, count) {
  const def = g.defs.get(item.id),
    pool = Object.values(
      g.rules.adaptations.dreamRuntime.statPools[String(def.DreamType)]?.rawPool || {},
    );
  if (!pool.length && count)
    throw new LocalizedError(message("core.forge.randomizePoints.124368ca68"));
  for (const k of keys) delete item.added[k];
  for (let remaining = count; remaining > 0; ) {
    const k = keys[pool[g.rng.next(pool.length)]];
    if (!k) throw new LocalizedError(message("core.forge.randomizePoints.8530d28df1"));
    const batch = g.rng.next(remaining) + 1;
    item.added[k] = (item.added[k] || 0) + batch;
    remaining -= batch;
  }
}

// games/darkforged/singleplayer/core/dream-runtime.ts
function dreamFireworkBonus(cfg) {
  const f2 = cfg?.worldFirework;
  return f2?.enabled
    ? f2
    : { enabled: false, experienceBonusPercent: 0, dropBonusPercent: 0, magicFindBonus: 0 };
}
function dreamMagicFind(cfg, gearBonus = 0) {
  return cfg.defaultMagicFind + dreamFireworkBonus(cfg).magicFindBonus + Math.max(0, gearBonus);
}
function dreamItemDropMultiplier(cfg, gearPercent = 0) {
  const c = cfg?.casual;
  return (
    (c?.enabled ? c.baseDropMultiplier + c.dropAdd : 1) +
    (dreamFireworkBonus(cfg).dropBonusPercent + Math.max(0, gearPercent)) / 100
  );
}
function dreamExceptionalChance(magicFind) {
  const m = Math.max(0, magicFind);
  return Math.floor((100 * m) / (m + 250));
}
function dreamEquipmentExceptionalChance(cfg, grade, magicFind = dreamMagicFind(cfg)) {
  return Math.max(
    0,
    Math.min(
      100,
      dreamExceptionalChance(magicFind) + (cfg.exceptionalGradeBonusPercent?.[String(grade)] || 0),
    ),
  );
}
var statKeys = ["MaxDC", "MaxMC", "MaxAC", "MaxSC", "MaxMAC", "Luck", "Accuracy", "Agility"];
function dreamExceptional(item, def, rng, cfg, magicFind = dreamMagicFind(cfg)) {
  markNaturalAffixGeneration(item, magicFind);
  const pool = cfg.statPools[String(def.ExceptionalPoolType ?? def.DreamType)]?.rawPool;
  if (
    !pool ||
    rng.next(100) >= dreamEquipmentExceptionalChance(cfg, effectiveAffixGrade(def), magicFind)
  )
    return;
  let roll = rng.next(32768) % cfg.pointWeights.reduce((a, b) => a + b, 0),
    index = 0;
  while (roll >= cfg.pointWeights[index]) roll -= cfg.pointWeights[index++];
  applyDreamExceptionalPoints(item, def, rng, cfg, index + 1);
}
function applyDreamExceptionalPoints(item, def, rng, cfg, remaining) {
  const pool = cfg.statPools[String(def.ExceptionalPoolType ?? def.DreamType)]?.rawPool;
  if (!pool) return;
  const choices = Object.values(pool);
  for (let attempts = 0; remaining > 0 && attempts < 100; attempts++) {
    const stat = statKeys[choices[rng.next(choices.length)]],
      points = rng.next(remaining + 1, 1);
    if (!stat) continue;
    item.added[stat] = (item.added[stat] || 0) + points;
    remaining -= points;
  }
}
function migrateDreamRuntime(save, rules) {
  const cfg = rules.adaptations.dreamRuntime;
  if (!cfg || (save.dreamRuntimeVersion || 0) >= cfg.version) return save;
  if (!Array.isArray(save.roles) || !save.maps) return save;
  if (
    save.roles.some((r) => !Array.isArray(r.skills)) ||
    Object.values(save.maps).some((m) => !Array.isArray(m.actors))
  )
    throw new LocalizedError(message("core.dream-runtime.migrateDreamRuntime.21031af477"));
  const result = structuredClone(save);
  result.dreamRuntimeVersion = cfg.version;
  for (const role of result.roles) {
    for (const skill of role.skills) {
      const def = rules.skills.find((d) => d.Spell === skill.Spell);
      if (def?.DreamBookProgression) skill.Level = Math.max(1, skill.Level);
    }
  }
  for (const map2 of Object.values(result.maps))
    for (const actor of map2.actors) {
      if (actor.kind !== "monster" || actor.friendly) continue;
      const def = rules.monsters.find((d) => d.Index === actor.definition);
      if (def?.DreamOriginalId === void 0) continue;
      const fraction = actor.maxHP > 0 ? actor.hp / actor.maxHP : 1;
      actor.stats = { ...def.Stats };
      actor.maxHP = Math.max(1, def.Stats.HP || 1);
      actor.hp = actor.dead
        ? 0
        : Math.max(1, Math.min(actor.maxHP, Math.ceil(actor.maxHP * fraction)));
    }
  return result;
}
function dreamDropDenominator(prob, multiple = 1) {
  return Math.max(1, Math.trunc(prob / Math.max(1, multiple)));
}
function dreamBossPotionSupplement(items, table, defs, rng, goldRows = 0) {
  if (rng.next(40) !== 0) return [];
  const roll = rng.next(200) + 1,
    target = roll === 1 ? 64 : roll <= 5 ? 49 : roll <= 12 ? 36 : roll <= 20 ? 25 : 16;
  const ids = [
    ...new Set(
      table.flatMap((row) =>
        row.item !== null && defs.get(row.item)?.Type === "Potion" ? [row.item] : [],
      ),
    ),
  ];
  if (!ids.length) return [];
  const count = Math.max(0, Math.floor((target - items.length - goldRows) / ids.length));
  return ids.flatMap((id) => Array(count).fill(id));
}

// games/darkforged/singleplayer/core/chest-items.ts
function weighted4(g, weights) {
  let roll = g.rng.next(Object.values(weights).reduce((a, b) => a + b, 0));
  for (const [value, weight] of Object.entries(weights)) {
    if (roll < weight) return Number(value);
    roll -= weight;
  }
  throw new LocalizedError(message("core.chest-items.weighted.ada75b5f2e"));
}
function initializeChest(g, item) {
  const cfg = g.rules.adaptations.chestItems?.chests[String(item.id)];
  if (cfg && !item.chestReward) {
    if (item.count !== 1)
      throw new LocalizedError(message("core.chest-items.initializeChest.0578f57960"));
    item.chestReward = { item: weighted4(g, cfg.items), points: weighted4(g, cfg.points) };
  }
}
function migrateChestReward(item, rules) {
  const cfg = rules.adaptations.chestItems?.chests[String(item.id)];
  if (!cfg || item.chestReward || item.count !== 1) return;
  const seed = (Math.imul(item.uid | 0, 1664525) ^ Math.imul(item.id, 1013904223)) | 0;
  const rng = new Random(seed),
    pick = (weights) => {
      let roll = rng.next(Object.values(weights).reduce((sum, n) => sum + n, 0));
      for (const [id, weight] of Object.entries(weights)) {
        if (roll < weight) return Number(id);
        roll -= weight;
      }
      throw new LocalizedError(message("core.chest-items.weighted.ada75b5f2e"));
    };
  item.chestReward = { item: pick(cfg.items), points: pick(cfg.points) };
}
function useChestItem(g, r, item) {
  const config = g.rules.adaptations.chestItems;
  if (!config) return false;
  const remove = (target) => {
    if (--target.count === 0) r.inventory[r.inventory.indexOf(target)] = null;
  };
  const nugget = g.rules.adaptations.bossGold;
  if (item.id === config.gold.item || item.id === nugget?.item) {
    const amount =
      item.id === nugget?.item ? nugget.amount : g.rng.next(config.gold.max + 1, config.gold.min);
    if (!Number.isSafeInteger(r.gold + amount))
      throw new LocalizedError(message("core.chest-items.useChestItem.1e0236aada"));
    r.gold += amount;
    remove(item);
    g.say(message("core.chest-items.useChestItem.b7933d2f60", { p0: amount }));
    return true;
  }
  const entry = Object.entries(config.chests).find(
    ([id2, c]) => Number(id2) === item.id || c.key === item.id,
  );
  if (!entry) return false;
  const [id, cfg] = entry,
    box = item.id === Number(id) ? item : r.inventory.find((i) => i?.id === Number(id));
  const key = item.id === cfg.key ? item : r.inventory.find((i) => i?.id === cfg.key);
  if (!box) throw new LocalizedError(message("core.chest-items.useChestItem.54352aa4d3"));
  if (!key) throw new LocalizedError(message("core.chest-items.useChestItem.6518e82aa7"));
  initializeChest(g, box);
  const sealed = box.chestReward;
  if (!cfg.items[String(sealed.item)] || !Object.hasOwn(cfg.points, String(sealed.points)))
    throw new LocalizedError(message("core.chest-items.useChestItem.0d4dcef593"));
  const def = g.defs.get(sealed.item),
    boxSlot = r.inventory.indexOf(box);
  const slot = bagSlotAccepts(r, g.rules, def, boxSlot)
    ? boxSlot
    : r.inventory.findIndex((i, k) => !i && bagSlotAccepts(r, g.rules, def, k));
  if (slot < 0) throw new LocalizedError(message("storage.bagCategoryFull"));
  const reward = g.newItem(sealed.item);
  if (g.rules.adaptations.dreamRuntime) {
    markAffixPointDistribution(reward, cfg.points);
    applyDreamExceptionalPoints(
      reward,
      def,
      g.rng,
      g.rules.adaptations.dreamRuntime,
      sealed.points,
    );
    rollExceptionalAffixes(reward, def, g.rng, g.rules.adaptations.dreamRuntime);
  }
  r.inventory[boxSlot] = null;
  remove(key);
  r.inventory[slot] = reward;
  g.emit("GainedItem", { Item: { ItemIndex: reward.id, Count: 1 } });
  g.say(
    message("core.chest-items.useChestItem.eb0583d042", {
      p0: entityText("items", def.Index),
      p1: sealed.points ? message("game.item.bonusPoints", { points: sealed.points }) : "",
    }),
  );
  return true;
}

// games/darkforged/singleplayer/core/test-talisman.ts
function activeTestTalisman(r, rules) {
  const item = r.equipment[3];
  const cfg = [rules.adaptations.testTalisman, rules.adaptations.combatTestTalisman].find(
    (c) => c && c.itemId === item?.id,
  );
  return cfg && item?.id === cfg.itemId && (!item.maxDura || item.currentDura > 0) ? cfg : void 0;
}
function applyTestTalismanStats(r, rules) {
  const cfg = activeTestTalisman(r, rules);
  if (!cfg) {
    if (r.special) delete r.special.testTalismanRegenAt;
    return;
  }
  for (const kind of ["DC", "MC", "SC"])
    for (const end of ["Min", "Max"])
      r.stats[end + kind] = Math.trunc((r.stats[end + kind] || 0) * cfg.combatMultiplier);
  for (const kind of ["HP", "MP"])
    r.stats[kind] = Math.trunc((r.stats[kind] || 0) * cfg.vitalityMultiplier);
}
function recoverTestTalisman(r, rules, time) {
  const cfg = activeTestTalisman(r, rules);
  if (!cfg || r.dead) return;
  r.special ??= {};
  if (r.special.testTalismanRegenAt === void 0)
    r.special.testTalismanRegenAt = time + cfg.recoveryIntervalMs;
  if (time < Number(r.special.testTalismanRegenAt)) return;
  r.special.testTalismanRegenAt = time + cfg.recoveryIntervalMs;
  r.hp = Math.min(r.maxHP, r.hp + Math.max(1, Math.trunc((r.maxHP * cfg.recoveryPercent) / 100)));
  r.mp = Math.min(r.maxMP, r.mp + Math.max(1, Math.trunc((r.maxMP * cfg.recoveryPercent) / 100)));
}

// games/darkforged/singleplayer/core/gem-enhancement.ts
var gemStatNames = {
  "NativeState:22": message("gem.stat.NativeState:22"),
  "NativeState:23": message("gem.stat.NativeState:23"),
  "NativeState:25": message("gem.stat.NativeState:25"),
  "NativeState:26": message("gem.stat.NativeState:26"),
  "NativeState:24": message("gem.stat.NativeState:24"),
  "NativeState:27": message("gem.stat.NativeState:27"),
  KillHP: message("gem.stat.KillHP"),
  KillMP: message("gem.stat.KillMP"),
  GemLifeStealPercent: message("gem.stat.GemLifeStealPercent"),
  GemCriticalRatePercent: message("gem.stat.GemCriticalRatePercent"),
  GemFireDamagePercent: message("gem.stat.GemFireDamagePercent"),
  GemEliteDamagePercent: message("gem.stat.GemEliteDamagePercent"),
  GemGuardPercent: message("gem.stat.GemGuardPercent"),
  GemLightningDamagePercent: message("gem.stat.GemLightningDamagePercent"),
  GemIceDamagePercent: message("gem.stat.GemIceDamagePercent"),
  GemGreatFireBallPercent: message("gem.stat.GemGreatFireBallPercent"),
  GemThunderBoltPercent: message("gem.stat.GemThunderBoltPercent"),
  GemIceStormPercent: message("gem.stat.GemIceStormPercent"),
  GemSlayingPercent: message("gem.stat.GemSlayingPercent"),
  GemThrustingPercent: message("gem.stat.GemThrustingPercent"),
  GemHalfMoonPercent: message("gem.stat.GemHalfMoonPercent"),
  GemFlamingSwordPercent: message("gem.stat.GemFlamingSwordPercent"),
  GemSoulFireBallPercent: message("gem.stat.GemSoulFireBallPercent"),
  GemPoisoningPercent: message("gem.stat.GemPoisoningPercent"),
  GemPetDamagePercent: message("gem.stat.GemPetDamagePercent"),
  GemHealingPercent: message("gem.stat.GemHealingPercent"),
};
var upgradeStatNames = {
  MaxDC: message("gem.stat.MaxDC"),
  MaxMC: message("gem.stat.MaxMC"),
  MaxSC: message("gem.stat.MaxSC"),
  MaxAC: message("gem.stat.MaxAC"),
  MaxMAC: message("gem.stat.MaxMAC"),
  Durability: message("gem.stat.Durability"),
  AttackSpeed: message("gem.stat.AttackSpeed"),
  Agility: message("gem.stat.Agility"),
  Accuracy: message("gem.stat.Accuracy"),
  PoisonAttack: message("gem.stat.PoisonAttack"),
  Freezing: message("gem.stat.Freezing"),
  MagicResist: message("gem.stat.MagicResist"),
  PoisonResist: message("gem.stat.PoisonResist"),
  Luck: message("gem.stat.Luck"),
  ...gemStatNames,
};
function gemTier(item) {
  return item.added.GemTier === 2 ? 2 : item.added.GemTier === 1 ? 1 : 0;
}
function rollGem(item, def, rng, cfg, monster) {
  if (!cfg.itemIds.includes(def.Index)) return;
  const profile = cfg.bossProfiles.find((p) => p.monsters.includes(monster?.Name || "")),
    weights = profile?.tierWeights || cfg.tierWeights;
  let roll = rng.next(weights.reduce((a, b) => a + b, 0)),
    tier = 0;
  while (tier < weights.length - 1 && roll >= weights[tier]) roll -= weights[tier++];
  if (profile) {
    item.added.GemPower = profile.mainGains[tier];
    item.added.GemStatLimit = profile.statLimit;
    item.added.GemCountLimit = profile.countLimit;
    item.added.GemBaseChance = profile.baseChance;
    item.added.GemChanceStep = profile.chanceStep;
  }
  if (!tier) return;
  item.added.GemTier = tier;
  const job = cfg.itemJobs[String(def.Index)],
    highPool = cfg.highEffects.filter((e) => !job || !e.jobs || e.jobs.includes(job));
  const pools = [cfg.rareEffects, ...(tier === 2 ? [highPool] : [])];
  for (const [index, pool] of pools.entries()) {
    const effect = pool[rng.next(pool.length)],
      bonus = index === 0 ? profile?.rareBonus || 0 : profile?.highBonus || 0;
    item.added[effect.stat] = Math.min(
      cfg.caps[effect.stat],
      rng.next(effect.max + 1, effect.min) + bonus,
    );
  }
}
function gemLimits(def, item) {
  return {
    statLimit: item.added.GemStatLimit || def.Stats.HPDrainRatePercent || 0,
    countLimit: item.added.GemCountLimit || def.Stats.CriticalDamage || 0,
    baseChance: item.added.GemBaseChance || def.Stats.CriticalRate || 0,
    chanceStep: item.added.GemChanceStep ?? def.Stats.Reflect ?? 0,
  };
}
function gemPowers(item) {
  return Object.fromEntries(
    Object.keys(gemStatNames)
      .filter((k) => (item.added[k] || 0) > 0)
      .map((k) => [k, item.added[k]]),
  );
}
function gemMain(def, item) {
  const stat = Object.keys(upgradeStatNames)
    .filter((k) => !(k in gemStatNames))
    .find((k) =>
      k === "Durability" ? def.Durability > 0 : (def.Stats[k] || 0) + (item.added[k] || 0) > 0,
    );
  const gain =
    stat === "Durability"
      ? item.maxDura
      : stat
        ? ((def.Stats[stat] || 0) + (item.added[stat] || 0)) *
          (item.added.GemPower || (gemTier(item) === 2 ? 2 : 1))
        : 0;
  return { stat: stat || "", gain };
}
function gemEffectText(stat, value) {
  if (stat === "GemGuardPercent") return message("gem.guard", { value });
  if (stat === "GemCriticalRatePercent") return message("gem.crit", { value });
  if (stat === "GemLifeStealPercent") return message("gem.steal", { value });
  return message("gem.effect", {
    stat: upgradeStatNames[stat] || stat,
    value: stat === "Durability" ? value / 1e3 : value,
    unit: stat.endsWith("Percent") ? "%" : "",
  });
}
function capGemStats(r, cfg) {
  for (const [key, cap] of Object.entries(cfg.caps))
    r.stats[key] = Math.max(
      0,
      key === "GemLifeStealPercent" && r.job === "Warrior"
        ? r.stats[key] || 0
        : Math.min(cap, r.stats[key] || 0),
    );
  if (!r.stats.GemGuardPercent)
    r.buffs = r.buffs.filter((b) => b.type !== "\u5B9D\u77F3\u62A4\u76FE");
}
var gemDamageSpells = {
  GemFireDamagePercent: [
    "Hydra",
    "FireBall",
    "GreatFireBall",
    "HellFire",
    "FireWall",
    "FireBang",
    "FlameField",
    "FlameDisruptor",
    "MeteorStrike",
  ],
  GemLightningDamagePercent: ["ThunderBolt", "Lightning", "ThunderStorm"],
  GemIceDamagePercent: ["IceStorm", "FrostCrunch", "Blizzard"],
  GemGreatFireBallPercent: ["GreatFireBall"],
  GemThunderBoltPercent: ["ThunderBolt"],
  GemIceStormPercent: ["IceStorm"],
  GemSlayingPercent: ["Slaying"],
  GemThrustingPercent: ["Thrusting"],
  GemHalfMoonPercent: ["HalfMoon", "CrossHalfMoon"],
  GemFlamingSwordPercent: ["FlamingSword"],
  GemSoulFireBallPercent: ["SoulFireBall"],
  GemPoisoningPercent: ["Poisoning"],
};
function gemDamageBonus(g, source, target, raw, spell) {
  if (target.kind !== "monster" || target.friendly || spell === "EmberSplash") return raw;
  const owner =
    source.kind === "player"
      ? source
      : source.friendly && source.master
        ? g.roles.find((r) => r.id === source.master && !r.dead)
        : void 0;
  if (!owner) return raw;
  let percent =
    source.kind === "player"
      ? Object.entries(gemDamageSpells).reduce(
          (n, [key, spells2]) => n + (spells2.includes(spell || "") ? owner.stats[key] || 0 : 0),
          0,
        )
      : owner.stats.GemPetDamagePercent || 0;
  const def = g.monsters.get(target.definition);
  if (
    def &&
    (hasBossLootBudget(def, g.rules) ||
      ["swift", "elite", "captain"].includes(String(def.AdventureKind)))
  )
    percent += owner.stats.GemEliteDamagePercent || 0;
  percent = Math.min(g.rules.adaptations.gemEnhancement.damageBonusCap, percent);
  if (spell === "Poisoning" && percent > 0) {
    target.special ??= {};
    const extra = Number(target.special.gemPoisonCarry || 0) + (raw * percent) / 100,
      whole = Math.floor(extra);
    target.special.gemPoisonCarry = extra - whole;
    return raw + whole;
  }
  return raw + Math.floor((raw * percent) / 100);
}
function gemHealingBonus(source, amount, spell) {
  return ["Healing", "MassHealing"].includes(spell || "")
    ? amount + Math.floor((amount * (source.stats.GemHealingPercent || 0)) / 100)
    : amount;
}
function absorbGemGuard(g, target, amount) {
  if (target.kind !== "player" || !target.stats.GemGuardPercent || amount <= 0) return amount;
  const r = target;
  r.special ??= {};
  let shield = r.buffs.find((b) => b.type === "\u5B9D\u77F3\u62A4\u76FE" && b.until > g.time);
  const cfg = g.rules.adaptations.gemEnhancement;
  if (
    !shield &&
    r.hp - amount <= (r.maxHP * cfg.guardThreshold) / 100 &&
    g.time >= Number(r.special.gemGuardReady || 0)
  ) {
    r.special.gemGuardReady = g.time + cfg.guardCooldown;
    g.buff(
      r,
      "\u5B9D\u77F3\u62A4\u76FE",
      cfg.guardDuration,
      Math.max(1, Math.floor((r.maxHP * r.stats.GemGuardPercent) / 100)),
      {},
      r.id,
    );
    shield = r.buffs.find((b) => b.type === "\u5B9D\u77F3\u62A4\u76FE");
    g.say(message("core.gem-enhancement.absorbGemGuard.df53609215"));
  }
  if (shield) {
    const absorbed = Math.min(amount, shield.value);
    shield.value -= absorbed;
    amount -= absorbed;
    if (!shield.value) r.buffs = r.buffs.filter((b) => b !== shield);
  }
  return amount;
}
function gemLifeSteal(source, target, damage, defence) {
  if (
    source.kind !== "player" ||
    target.kind !== "monster" ||
    target.friendly ||
    defence === "None" ||
    damage <= 0 ||
    !source.stats.GemLifeStealPercent
  )
    return;
  const r = source;
  r.special ??= {};
  const total = Number(r.special.gemDrain || 0) + (damage * r.stats.GemLifeStealPercent) / 100,
    heal = Math.floor(total);
  r.hp = Math.min(r.maxHP, r.hp + heal);
  r.special.gemDrain = total - heal;
}

// games/darkforged/singleplayer/core/upgrades.ts
var targetFlags = {
  Weapon: "Paralize",
  Armour: "Teleport",
  Helmet: "ClearRing",
  Necklace: "Protection",
  Bracelet: "Revival",
  Ring: "Muscle",
  Amulet: "Flame",
  Belt: "Healing",
  Boots: "Probe",
  Stone: "Skill",
};
function upgradeQuote(g, r, gem, item) {
  const from = g.defs.get(gem.id),
    to = g.defs.get(item.id);
  if (from.Type !== "Gem" || !targetFlags[to.Type] || gem.uid === item.uid)
    throw new LocalizedError(message("core.upgrades.upgradeQuote.3809c9e39e"));
  if ([1, 2, 5, 6].includes(from.Shape)) {
    const metal = ["Weapon", "Necklace", "Ring", "Bracelet"].includes(to.Type),
      cloth = ["Armour", "Helmet", "Boots", "Belt"].includes(to.Type);
    if (
      to.Bind.includes("DontRepair") ||
      item.currentDura === item.maxDura ||
      !(([1, 5].includes(from.Shape) && metal) || ([2, 6].includes(from.Shape) && cloth))
    )
      throw new LocalizedError(message("core.upgrades.upgradeQuote.8e3ccf7e33"));
    return {
      chance: 100,
      repair: true,
      stat: "",
      gain: 0,
      destructive: false,
      effects: {},
      details: [message("gem.repairDurability")],
    };
  }
  if (![3, 4].includes(from.Shape))
    throw new LocalizedError(message("core.upgrades.upgradeQuote.e9de9f11c6"));
  if (g.rules.adaptations.diablo?.enabled && item.dx)
    throw new LocalizedError(message("dx.workshop.error.legacy"));
  if (
    to.Bind.includes("DontUpgrade") ||
    to.Unique !== "None" ||
    !from.Unique.split(",")
      .map((s) => s.trim())
      .includes(targetFlags[to.Type])
  )
    throw new LocalizedError(message("core.upgrades.upgradeQuote.104fee785f"));
  const { stat, gain } = gemMain(from, gem),
    effects = gemPowers(gem),
    limits = gemLimits(from, gem);
  if (!stat) throw new LocalizedError(message("core.upgrades.upgradeQuote.a986284563"));
  const count =
    stat === "Durability"
      ? Math.max(0, Math.trunc((item.maxDura - to.Durability) / 1e3))
      : item.added[stat] || 0;
  if (
    (item.gemCount || 0) >= limits.countLimit ||
    count + (stat === "Durability" ? gain / 1e3 : gain) > limits.statLimit
  )
    throw new LocalizedError(message("core.upgrades.upgradeQuote.d9cca84c52"));
  const decrease = limits.chanceStep * (g.rules.gems.statIndependent ? count : item.gemCount || 0);
  const chance =
    decrease >= limits.baseChance
      ? 0
      : limits.baseChance - decrease + (r.stats.GemRatePercent || 0);
  if (chance <= 0) throw new LocalizedError(message("core.upgrades.upgradeQuote.209cd4bc08"));
  return {
    chance: Math.max(0, Math.min(100, chance)),
    repair: false,
    stat,
    gain,
    effects,
    details: [
      gemEffectText(stat, gain),
      ...Object.entries(effects).map(([k, v]) => gemEffectText(k, v)),
    ],
    destructive: false,
  };
}
function combineItem(g, r, fromID, toID, affix) {
  const from = r.inventory.findIndex((i) => i?.uid === fromID),
    to = r.inventory.findIndex((i) => i?.uid === toID),
    gem = r.inventory[from],
    item = r.inventory[to];
  if (!gem || !item) throw new LocalizedError(message("core.upgrades.combineItem.f0ed4a2f42"));
  if (dxIsRune(g, gem.id) || dxIsEssence(g, gem.id)) {
    if (dxIsRune(g, gem.id)) dxSocket(g, r, gem, item);
    else dxEnchant(g, r, gem, item, Number(affix));
    g.emit("CombineItem", { Success: true, IDFrom: fromID, IDTo: toID });
    return;
  }
  const quote = upgradeQuote(g, r, gem, item),
    def = g.defs.get(item.id);
  if (quote.repair) {
    if ([1, 2].includes(def.Shape)) g.rng.next(10);
    item.currentDura = item.maxDura;
    g.say(message("core.upgrades.combineItem.92fcd944ae"));
  } else if (g.rng.next(100) < quote.chance) {
    if (quote.stat === "Durability") item.maxDura = Math.min(65535, item.maxDura + quote.gain);
    else item.added[quote.stat] = (item.added[quote.stat] || 0) + quote.gain;
    for (const [key, value] of Object.entries(quote.effects))
      item.added[key] = (item.added[key] || 0) + value;
    item.gemCount = (item.gemCount || 0) + 1;
    g.say(message("core.upgrades.combineItem.7ee926e3fc"));
  } else g.say(message("core.upgrades.combineItem.4ce26bc8c1"));
  gem.count--;
  if (!gem.count) r.inventory[from] = null;
  g.emit("CombineItem", { Success: true, IDFrom: fromID, IDTo: toID });
}

// games/darkforged/singleplayer/core/equipment.ts
var amounts = {};
for (const [count, names] of [
  [2, "Mundane NokChi TaoProtect Whisker1 Whisker2 Whisker3 Whisker4 Whisker5"],
  [3, "RedOrchid RedFlower Smash HwanDevil Purity FiveString Bone Bug DarkGhost"],
  [4, "Recall"],
  [
    5,
    "Spirit WhiteGold WhiteGoldH RedJade RedJadeH Nephrite NephriteH Hyeolryong Monitor Oppressive Paeok Sulgwan BlueFrostH BlueFrost",
  ],
])
  for (const name of names.split(" ")) amounts[name] = count;
var bonuses = {
  Mundane: { HP: 50 },
  NokChi: { MP: 50 },
  TaoProtect: { HP: 30, MP: 30 },
  RedOrchid: { Accuracy: 2 },
  RedFlower: { HP: 50, MP: -50 },
  Smash: { MinDC: 1, MaxDC: 3 },
  HwanDevil: { MinMC: 1, MaxMC: 2 },
  Purity: { MinSC: 1, MaxSC: 2 },
  FiveString: { MinAC: 2, MaxAC: 2 },
  Spirit: { MinDC: 2, MaxDC: 5, AttackSpeed: 2 },
  Bone: { MaxAC: 2, MaxMC: 1, MaxSC: 1 },
  Bug: { MaxDC: 1, MaxMC: 1, MaxSC: 1, MaxMAC: 1, PoisonResist: 1 },
  WhiteGold: { MaxDC: 2, MaxAC: 2 },
  WhiteGoldH: { MaxDC: 3, HP: 30, AttackSpeed: 2 },
  RedJade: { MaxMC: 2, MaxMAC: 2 },
  RedJadeH: { MaxMC: 2, MP: 40, Agility: 2 },
  Nephrite: { MaxSC: 2, MaxAC: 1, MaxMAC: 1 },
  NephriteH: { MaxSC: 2, HP: 15, MP: 20, Holy: 1, Accuracy: 1 },
  Whisker1: { MaxDC: 1, BagWeight: 25 },
  Whisker2: { MaxMC: 1, BagWeight: 17 },
  Whisker3: { MaxSC: 1, BagWeight: 17 },
  Whisker4: { MaxDC: 1, BagWeight: 20 },
  Whisker5: { MaxDC: 1, BagWeight: 17 },
  Hyeolryong: { MaxSC: 2, HP: 15, MP: 20, Holy: 1, Accuracy: 1 },
  Monitor: { MagicResist: 1, PoisonResist: 1 },
  Oppressive: { MaxAC: 1, Agility: 1 },
  BlueFrost: {
    MinDC: 1,
    MaxDC: 1,
    MinMC: 1,
    MaxMC: 1,
    HandWeight: 1,
    WearWeight: 2,
  },
  BlueFrostH: { MinDC: 1, MaxDC: 2, MaxMC: 2, Accuracy: 1, HP: 50 },
  DarkGhost: { MP: 25, AttackSpeed: 2 },
};
function itemSets(equipment, defs) {
  const groups = [];
  for (const item of equipment) {
    if (!item || (item.maxDura > 0 && item.currentDura === 0)) continue;
    const def = defs.get(item.id);
    const name = String(def.Set || "None");
    if (name === "None") continue;
    let group = groups.find((g) => g.name === name && !g.types.has(def.Type) && !g.complete);
    if (!group) {
      group = { name, types: /* @__PURE__ */ new Set(), complete: false };
      groups.push(group);
    }
    group.types.add(def.Type);
    group.complete = group.types.size >= (amounts[name] || 0);
  }
  return groups;
}
function applyEquipmentSets(stats2, equipment, defs) {
  const add2 = (values) => {
    for (const [key, value] of Object.entries(values)) stats2[key] = (stats2[key] || 0) + value;
  };
  const once = /* @__PURE__ */ new Set();
  for (const g of itemSets(equipment, defs)) {
    if (g.types.has("Ring") && g.types.has("Bracelet") && !once.has(g.name)) {
      if (g.name === "Smash") add2({ AttackSpeed: 2 });
      if (g.name === "Purity") add2({ Holy: 3 });
      if (g.name === "HwanDevil") add2({ WearWeight: 5, BagWeight: 20 });
      once.add(g.name);
    }
    if (g.name === "DarkGhost" && g.types.has("Necklace") && g.types.has("Bracelet"))
      add2({ HP: 25 });
    if (!g.complete) continue;
    if (g.name === "FiveString") add2({ HP: Math.trunc(((stats2.HP || 0) / 100) * 30) });
    add2(bonuses[g.name] || {});
  }
  const mir = new Set(
    equipment.flatMap((i, slot) =>
      i && !(i.maxDura > 0 && i.currentDura === 0) && defs.get(i.id).Set === "Mir" ? [slot] : [],
    ),
  );
  const all = (...slots3) => slots3.every((s) => mir.has(s));
  if (mir.size === 10)
    add2({
      MaxAC: 1,
      MaxMAC: 1,
      BagWeight: 70,
      Luck: 2,
      AttackSpeed: 2,
      HP: 70,
      MP: 80,
      MagicResist: 6,
      PoisonResist: 6,
    });
  if (all(7, 8)) add2({ MaxMAC: 1, MaxAC: 1 });
  if (all(5, 6)) add2({ MinAC: 1, MinMAC: 1 });
  if ((mir.has(7) || mir.has(8)) && (mir.has(5) || mir.has(6)) && mir.has(4))
    add2({ MaxMAC: 1, MaxAC: 1, BagWeight: 30, WearWeight: 17 });
  if (all(7, 8, 5, 6, 4)) add2({ MaxMAC: 1, MaxAC: 1, BagWeight: 20, WearWeight: 10 });
  if (all(1, 2, 0)) add2({ MaxDC: 2, MaxMC: 1, MaxSC: 1, Agility: 1 });
  if (all(1, 11, 10)) add2({ MaxDC: 1, MaxMC: 1, MaxSC: 1, HandWeight: 17 });
  if (all(1, 11, 10, 2, 0))
    add2({
      MinDC: 1,
      MaxDC: 1,
      MinMC: 1,
      MaxMC: 1,
      MinSC: 1,
      MaxSC: 1,
      HandWeight: 17,
    });
}

// games/darkforged/singleplayer/core/bag-capacity.ts
function isLegacyBag(role, rules) {
  const config = rules.adaptations.bagExpansion;
  return (
    config.baseSlots === 48 &&
    config.columns === 8 &&
    Array.isArray(role.inventory) &&
    role.inventory.length === 46 + (role.bagExpansionRows || 0) * config.columns
  );
}
function migrateBagCapacity(role, rules) {
  if (isLegacyBag(role, rules)) role.inventory.splice(46, 0, null, null);
}

// games/darkforged/singleplayer/core/mainline.ts
function migrateWorldSave(save, rules) {
  const version = rules.adaptations.mainline?.worldVersion;
  if (!version || (save.worldVersion ?? 1) >= version) return save;
  if (!Array.isArray(save.roles) || !save.maps || !Array.isArray(save.events)) return save;
  const migrated = structuredClone(save),
    home = rules.world.maps.find((m) => m.start);
  migrated.worldVersion = version;
  if ((save.worldVersion ?? 1) >= 3) {
    const moved = /* @__PURE__ */ new Set(),
      removed = /* @__PURE__ */ new Set();
    for (const r of migrated.roles) {
      if (
        (save.worldVersion ?? 1) < 4 &&
        r.map === home.id &&
        Math.max(Math.abs(r.x - 301), Math.abs(r.y - 497)) <= 32
      ) {
        r.x = home.center[0];
        r.y = home.center[1];
        r.target = 0;
        moved.add(r.id);
      }
      if (version >= 5 && (save.worldVersion ?? 1) < 5) {
        if (r.map === 1110 && Math.max(Math.abs(r.x - 60), Math.abs(r.y - 92)) <= 12) {
          r.x = 42;
          r.y = 218;
          r.target = 0;
          moved.add(r.id);
        }
        if (r.map === 1120 && Math.max(Math.abs(r.x - 250), Math.abs(r.y - 250)) <= 10) {
          r.x = 270;
          r.y = 250;
          r.target = 0;
          moved.add(r.id);
        }
        for (const [added, old] of [
          [238, 207],
          [239, 218],
        ])
          if (
            (r.completedQuests.includes(old) || r.quests.some((q) => q.id === old)) &&
            !r.completedQuests.includes(added)
          )
            r.completedQuests.push(added);
      }
    }
    for (const mapId of version >= 6
      ? rules.world.maps.filter((m) => !m.instance).map((m) => m.id)
      : version >= 5
        ? [1001, 1007, 1110, 1115, 1120]
        : [home.id]) {
      const state2 = migrated.maps[mapId];
      if (state2) {
        if (!Array.isArray(state2.actors))
          throw new LocalizedError(message("core.mainline.migrateWorldSave.77ca95f093"));
        state2.actors = state2.actors.filter((a) => {
          const keep = a.kind !== "monster" || a.friendly || a.spawn === void 0;
          if (!keep) removed.add(a.id);
          return keep;
        });
        state2.respawns = {};
        for (const a of state2.actors) {
          if (a.kind === "npc") {
            const n = rules.world.npcs.find((n2) => n2.map === mapId && n2.id === a.id);
            if (n) {
              a.x = n.at[0];
              a.y = n.at[1];
            }
          }
          if (a.friendly && a.master && moved.has(a.master)) {
            const owner = migrated.roles.find((r) => r.id === a.master);
            a.x = owner.x;
            a.y = owner.y;
            a.target = 0;
          }
        }
      }
    }
    migrated.events = migrated.events.filter(
      (e) => !removed.has(e.source) && !removed.has(e.target),
    );
    for (const r of migrated.roles) if (removed.has(r.target)) r.target = 0;
    return migrated;
  }
  const kept = [];
  for (const map2 of Object.values(migrated.maps)) {
    if (!Array.isArray(map2.actors))
      throw new LocalizedError(message("core.mainline.migrateWorldSave.77ca95f093"));
    for (const actor of map2.actors)
      if (actor.kind === "item" || (actor.friendly && actor.kind === "monster" && !actor.dead)) {
        actor.map = home.id;
        actor.x = home.center[0];
        actor.y = home.center[1];
        actor.target = 0;
        delete actor.spawn;
        kept.push(actor);
      }
  }
  migrated.maps = { [home.id]: { actors: kept, respawns: {} } };
  migrated.events = [];
  for (const r of migrated.roles) {
    if (!Array.isArray(r.quests) || !Array.isArray(r.completedQuests))
      throw new LocalizedError(message("core.mainline.migrateWorldSave.4230a1abec"));
    r.map = home.id;
    r.x = home.center[0];
    r.y = home.center[1];
    r.target = 0;
    delete r.treasureRun;
    const legacyActive = r.quests.filter((q) => q.id >= 1 && q.id <= 8);
    const passed = r.completedQuests;
    const through = passed.includes(8)
      ? 210
      : passed.includes(7)
        ? 206
        : passed.includes(5)
          ? 204
          : 0;
    for (let id = 201; id <= through; id++) if (!passed.includes(id)) passed.push(id);
    r.quests = r.quests.filter((q) => rules.quests.some((d) => d.Index === q.id));
    const legacyIds = { 1: 201, 2: 201, 3: 202, 4: 203, 5: 204, 6: 206, 7: 206, 8: 210 };
    for (const old of legacyActive) {
      const id = legacyIds[old.id];
      for (let before = 201; before < id; before++)
        if (!passed.includes(before)) passed.push(before);
      if (!passed.includes(id) && !r.quests.some((q) => q.id === id))
        r.quests.push({ id, kills: old.kills });
    }
    for (const [added, old] of [
      [238, 207],
      [239, 218],
    ])
      if ((passed.includes(old) || r.quests.some((q) => q.id === old)) && !passed.includes(added))
        passed.push(added);
  }
  return migrated;
}
function activePortals(g, map2) {
  const state2 = g.map(map2);
  if (state2.portals)
    state2.portals = state2.portals.filter((p) => !p.expires || p.expires > g.time);
  return [...g.region(map2).portals, ...(state2.portals || [])];
}
function mainlineKill(g, monster, r) {
  const config = g.rules.adaptations.mainline;
  if (!config || monster.friendly) return;
  const name = g.monsters.get(monster.definition)?.Name;
  if (
    monster.map === 1004 &&
    name === "BoneElite" &&
    r.completedQuests.includes(211) &&
    g.count(r, 9505) < 1
  ) {
    if (!g.give(r, g.newItem(9505), true)) g.say(message("core.mainline.mainlineKill.15e671c387"));
  }
  for (const source of config.questSources) {
    if (
      !r.quests.some((q) => q.id === source.quest) ||
      !source.maps.includes(monster.map) ||
      !source.monsters.includes(name || "") ||
      !g.needsQuestItem(r, source.item, monster.map)
    )
      continue;
    if (
      (activeTestTalisman(r, g.rules)?.guaranteedQuestMaterials ||
        g.rng.next(source.chance) === 0) &&
      !g.give(r, g.newItem(source.item), true)
    )
      g.say(message("core.mainline.mainlineKill.b8b9789a6e"));
  }
  const bridge = config.hellBridge;
  if (bridge && monster.map === bridge.map && name === bridge.monster) {
    g.map(monster.map).portals = [
      ...(g.map(monster.map).portals || []).filter((p) => p.to !== bridge.map && p.to !== 2030),
      {
        to: bridge.map,
        name: message("map.portal.bridge"),
        at: [monster.x, monster.y],
        landing: [...bridge.landing],
        expires: g.time + bridge.duration,
      },
    ];
    g.say(message("core.mainline.mainlineKill.23d34d4313"));
  }
  const gate = config.corpsePalace;
  if (monster.map === gate.sourceMap && name === gate.monster && g.rng.next(gate.chance) === 0) {
    const target = g.region(gate.targetMap),
      point = g.freeNear(monster.map, monster, 3);
    if (!point) return;
    g.map(monster.map).portals = [
      {
        to: target.id,
        name: message("map.portal.ghoul"),
        at: [point.x, point.y],
        landing: target.center,
        expires: g.time + gate.duration,
      },
    ];
    g.say(message("core.mainline.mainlineKill.af65e052a6"));
  }
}
function summonMainlineBoss(g, r) {
  const config = g.rules.adaptations.mainline;
  if (r.dead || r.map !== config.summonMap)
    throw new LocalizedError(message("core.mainline.summonMainlineBoss.a26aa62145"));
  if (!r.quests.some((q) => q.id === config.summonQuest))
    throw new LocalizedError(message("core.mainline.summonMainlineBoss.c19d92e9fc"));
  if (g.map(r.map).actors.some((a) => a.definition === config.summonMonster && !a.dead))
    throw new LocalizedError(message("core.mainline.summonMainlineBoss.63dbf2ab9b"));
  const point = g.freeNear(r.map, { x: r.x + 4, y: r.y + 3 }, 8);
  if (!point) throw new LocalizedError(message("core.mainline.summonMainlineBoss.28712cf4ec"));
  g.map(r.map).actors.push(g.newMonster(g.monsters.get(config.summonMonster), r.map, point));
  g.say(message("core.mainline.summonMainlineBoss.c66ba002ac"));
}

// games/darkforged/singleplayer/core/spawn-placement.ts
function approvedPlacement(g, mapId) {
  if (mapId !== 1001) return;
  const matches = g
    .region(mapId)
    .spawns.flatMap((s2, i2) =>
      s2.monster === "Oma" && s2.native?.recordId === 9 && s2.native.monsterId === 28
        ? [{ s: s2, i: i2 }]
        : [],
    );
  if (matches.length !== 1) return;
  const { s, i } = matches[0],
    p = s.placement;
  if (!p || p.center[0] !== 232 || p.center[1] !== 566 || p.radius !== 40 || !s.locations?.length)
    return;
  const definitions = g.rules.monsters.filter((d) => d.Name === "Oma" && d.DreamOriginalId === 28);
  if (definitions.length === 1)
    return { locations: s.locations, i, definition: definitions[0].Index };
}
var eligible = (a, i, definition) =>
  a.kind === "monster" &&
  a.map === 1001 &&
  !a.dead &&
  !a.friendly &&
  !a.master &&
  a.spawn === i &&
  a.definition === definition;
function markBichonOmaSpawn(g, actor) {
  const record = approvedPlacement(g, actor.map);
  if (!record || !eligible(actor, record.i, record.definition)) return false;
  (actor.special ??= {}).omaNorthwestPlacement = 2;
  return true;
}
function migrateBichonOmaPlacement(g, mapId) {
  const map2 = g.maps[mapId],
    record = approvedPlacement(g, mapId);
  if (!map2 || !record) return false;
  const { locations, i, definition } = record,
    all = map2.actors.filter((a) => eligible(a, i, definition));
  if (map2.omaNorthwestPlacement === 1 && all.every((a) => a.special?.omaNorthwestPlacement === 2))
    return false;
  const actors = all
    .filter((a) => a.special?.omaNorthwestPlacement !== 2)
    .sort((a, b) => a.id - b.id);
  const ids = new Set(actors.map((a) => a.id));
  const reserved = new Set(
      map2.actors
        .filter((a) => !a.dead && ["monster", "npc"].includes(a.kind) && !ids.has(a.id))
        .map((a) => `${a.x},${a.y}`),
    ),
    plan = [];
  for (const [order, actor] of actors.entries()) {
    const open = ([x, y]) =>
      (x !== actor.x || y !== actor.y) &&
      !reserved.has(`${x},${y}`) &&
      g.walkable(mapId, x, y, actor.id);
    let destination;
    for (let n = 0; !destination && n < locations.length; n++) {
      const p =
        locations[(Math.floor((order * locations.length) / actors.length) + n) % locations.length];
      if (open(p)) destination = p;
    }
    if (!destination) return false;
    reserved.add(destination.join(","));
    plan.push({ actor, x: destination[0], y: destination[1] });
  }
  for (const { actor, x, y } of plan) {
    actor.x = x;
    actor.y = y;
    (actor.special ??= {}).omaNorthwestPlacement = 2;
  }
  map2.omaNorthwestPlacement = 1;
  return true;
}

// games/darkforged/singleplayer/core/inventory-sort.ts
var types = [
  "Potion",
  "Scroll",
  "BagExpansion",
  "TreasureMap",
  "Book",
  "Weapon",
  "Armour",
  "Helmet",
  "Necklace",
  "Bracelet",
  "Ring",
  "Belt",
  "Boots",
  "Talisman",
  "Amulet",
  "Poison",
  "Torch",
];
function canonical(value) {
  if (value && typeof value === "object")
    return JSON.stringify(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, canonical(v)]),
    );
  return JSON.stringify(value);
}
function sortInventory(bag, defs, newId) {
  const groups = /* @__PURE__ */ new Map();
  for (const item of bag)
    if (item) {
      const { uid, count, ...metadata2 } = item,
        key = canonical(metadata2);
      const group = groups.get(key) || [];
      group.push(item);
      groups.set(key, group);
    }
  const sorted = [];
  for (const group of groups.values()) {
    group.sort((a, b) => a.uid - b.uid);
    const max = Math.max(1, defs.get(group[0].id).StackSize);
    let total = group.reduce((sum, i) => sum + i.count, 0),
      index = 0;
    while (total > 0) {
      const count = Math.min(max, total);
      sorted.push({ ...structuredClone(group[0]), uid: group[index++]?.uid ?? 0, count });
      total -= count;
    }
  }
  if (sorted.length > bag.length)
    throw new LocalizedError(message("core.inventory-sort.sortInventory.a0b0e1e655"));
  const order = (i) => {
    const n = types.indexOf(defs.get(i.id).Type);
    return n < 0 ? types.length : n;
  };
  const points = (i) => Object.values(i.added).reduce((sum, n) => sum + Math.max(0, n), 0);
  sorted.sort(
    (a, b) =>
      order(a) - order(b) ||
      defs.get(a.id).RequiredAmount - defs.get(b.id).RequiredAmount ||
      a.id - b.id ||
      points(b) - points(a) ||
      b.count - a.count ||
      a.uid - b.uid,
  );
  for (const item of sorted) if (!item.uid) item.uid = newId();
  return [...sorted, ...Array(bag.length - sorted.length).fill(null)];
}

// games/darkforged/singleplayer/core/skill-info.ts
function passiveSkillStats(spell, level) {
  if (spell === "Fencing") return { Accuracy: level * 3 };
  if (spell === "SpiritSword") return { Accuracy: [0, 3, 5, 8][level] };
  if (spell === "Slaying") return { Accuracy: level, MaxDC: [5, 6, 7, 8][level] };
  return {};
}
var Endpoint = class extends Random {
  constructor(high2) {
    super(1);
    this.high = high2;
  }
  next(max, min = 0) {
    return this.high ? Math.max(min, max - 1) : min;
  }
};
var low = new Endpoint(false);
var high = new Endpoint(true);

// games/darkforged/singleplayer/core/adventure.ts
var near = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
function adventureSetCount(g, r, job = r.job) {
  const ids = g.rules.adaptations.adventure.setIds[job];
  return new Set(
    r.equipment
      .filter((i) => !!i && ids.includes(i.id) && (!i.maxDura || i.currentDura > 0))
      .map((i) => i.id),
  ).size;
}
function applyAdventureSet(g, r) {
  const count = adventureSetCount(g, r),
    config = g.rules.adaptations.adventure;
  if (count >= 2)
    for (const [key, value] of Object.entries(config.setBonuses[r.job]))
      r.stats[key] = (r.stats[key] || 0) + value;
  if (count >= 3) r.stats["Adventure" + r.job] = 1;
}
function adventureHit(g, source, target, amount, spell) {
  if (
    amount <= 0 ||
    source.kind !== "player" ||
    spell !== "GreatFireBall" ||
    !source.stats.AdventureWizard
  )
    return;
  for (const other of [...g.map(source.map).actors])
    if (
      other.id !== target.id &&
      other.kind === "monster" &&
      !other.dead &&
      !other.friendly &&
      near(other, target) <= 1
    )
      g.damage(source, other, Math.max(1, Math.floor(amount * 0.35)), "MAC", "EmberSplash");
}
function owned(r, id) {
  return [...r.inventory, ...r.storage, ...r.equipment, ...r.questInventory].some(
    (i) => i?.id === id,
  );
}
function setReward(g, r) {
  const ids = g.rules.adaptations.adventure.setIds[r.job],
    missing = ids.filter((id) => !owned(r, id));
  const pool = missing.length ? missing : ids;
  return pool[g.rng.next(pool.length)];
}
function earlyAdventureEquipment(g, r) {
  return g.rules.items.filter(
    (d) =>
      [
        "Weapon",
        "Armour",
        "Helmet",
        "Necklace",
        "Bracelet",
        "Ring",
        "Belt",
        "Boots",
        "Stone",
        "Amulet",
      ].includes(d.Type) &&
      d.Unique === "None" &&
      d.RequiredType === "Level" &&
      d.RequiredAmount >= 3 &&
      d.RequiredAmount <= 12 &&
      ["None", "WarWizTao", r.job].includes(d.RequiredClass) &&
      ["None", r.gender].includes(d.RequiredGender) &&
      (g.rules.adaptations.dreamRuntime
        ? d.DreamOriginalId !== void 0 &&
          Number(d.DreamGrade) > 0 &&
          Number(d.DreamGrade) <= 2 &&
          !d.DreamRawItem?.Handmake
        : g.rules.adaptations.earlyLoot.profiles.includes(d.RandomStatsId)),
  );
}
function adventureKill(g, a, r) {
  if (r.stats.AdventureWarrior)
    g.buff(r, "\u7834\u9635\u75BE\u653B", 5e3, 0, { AttackSpeed: 1 }, r.id);
  const kind = g.monsters.get(a.definition)?.AdventureKind,
    cfg = g.rules.adaptations.adventure;
  if (!kind || kind === "guard" || a.special?.summoner || cfg.mapIds.includes(a.map)) return;
  g.ground(a, void 0, kind === "captain" ? 400 : 120);
  if (g.rng.next(kind === "captain" ? cfg.captainSetChance : cfg.eliteSetChance) === 0)
    g.ground(a, g.newItem(setReward(g, r)));
  if (g.rng.next(cfg.eliteTicketChance) === 0) g.ground(a, g.newItem(cfg.ticketId));
  const pool = earlyAdventureEquipment(g, r);
  const dx = !!g.rules.adaptations.diablo?.enabled;
  if (pool.length)
    g.ground(
      a,
      g.newItem(
        pool[g.rng.next(pool.length)].Index,
        1,
        true,
        dx ? g.monsters.get(a.definition) : void 0,
        dx ? r : void 0,
        0,
        dx ? a : void 0,
      ),
    );
}
function adventureMonsterTick(g, a, r) {
  if (a.dead || a.friendly || g.monsters.get(a.definition)?.AdventureKind !== "captain")
    return false;
  const s = (a.special ??= {});
  if (
    a.buffs.some((b) =>
      ["Paralysis", "LRParalysis", "Trap", "Frozen", "Shock", "Stun"].includes(b.type),
    )
  ) {
    if (s.slamAt) {
      delete s.slamAt;
      s.nextSlam = g.time + 6e3;
    }
    return false;
  }
  if (g.time < a.actionAt) return false;
  if (s.slamAt) {
    if (g.time < Number(s.slamAt)) return true;
    const point = { x: Number(s.slamX), y: Number(s.slamY) };
    for (const target of [r, ...g.map(a.map).actors.filter((m) => m.friendly)])
      if (!target.dead && target.map === a.map && near(target, point) <= 1)
        g.damage(a, target, 16, "AC", "CaptainSlam");
    delete s.slamAt;
    s.nextSlam = g.time + 6e3;
    a.actionAt = g.time + 600;
    return true;
  }
  if (!r.dead && near(a, r) <= 6 && !g.safe(r) && g.time >= Number(s.nextSlam || 0)) {
    s.slamAt = g.time + 1400;
    s.slamX = r.x;
    s.slamY = r.y;
    g.say(message("core.adventure.adventureMonsterTick.2bd4ceaab5"));
    if (!s.summoned) {
      s.summoned = true;
      for (let n = 0; n < 2; n++) {
        const p = g.freeNear(a.map, { x: a.x + 2 + n, y: a.y }, 3);
        if (!p) continue;
        const guard = g.newMonster(g.monsters.get(9303), a.map, p);
        guard.special.summoner = a.id;
        g.map(a.map).actors.push(guard);
      }
    }
    return true;
  }
  return false;
}
function treasureMapId(g, r) {
  return g.rules.adaptations.adventure.mapIds[g.roles.indexOf(r)];
}
function enterTreasure(g, r) {
  const cfg = g.rules.adaptations.adventure;
  if (r.level < cfg.tombMinLevel)
    throw new LocalizedError(message("core.adventure.enterTreasure.f97d7b80dd"));
  if (cfg.mapIds.includes(r.map))
    throw new LocalizedError(message("core.adventure.enterTreasure.222ac92c03"));
  if (
    g.time < r.actionAt ||
    g
      .map(r.map)
      .actors.some(
        (a) =>
          a.kind === "monster" && !a.dead && !a.friendly && a.target === r.id && near(a, r) <= 8,
      )
  )
    throw new LocalizedError(message("core.adventure.enterTreasure.11ba74509a"));
  const map2 = treasureMapId(g, r),
    geometry = g.geometry.get(map2);
  if (!geometry) throw new LocalizedError(message("core.adventure.enterTreasure.6c65cfc3bb"));
  const region = g.region(map2),
    p = { x: region.center[0], y: region.center[1] };
  if (geometry.solid[p.y * geometry.width + p.x])
    throw new LocalizedError(message("core.adventure.enterTreasure.a05b40d942"));
  g.maps[map2] = { actors: [], respawns: {} };
  g.events = g.events.filter((e) => e.map !== map2);
  r.map = map2;
  r.x = p.x;
  r.y = p.y;
  r.target = 0;
  g.npc = 0;
  r.treasureRun = { map: map2, wave: 0, nextWaveAt: g.time + 1500, cleared: false, claimed: false };
  g.initializeMap(map2);
  g.bringPets(r);
  g.emit("MapChanged", { MapIndex: map2 });
  g.say(message("core.adventure.enterTreasure.ad7a145358"));
}
function abandonExitedTreasure(g, r) {
  const run = r.treasureRun;
  if (!run || r.map === run.map) return;
  g.clearExitedInstance(r, run.map);
  delete r.treasureRun;
}
function treasureTick(g, r) {
  abandonExitedTreasure(g, r);
  const run = r.treasureRun;
  if (!run || r.dead || run.cleared) return;
  const map2 = g.map(run.map);
  if (map2.actors.some((a) => a.kind === "monster" && !a.dead && !a.friendly)) return;
  if (run.wave >= 3) {
    run.cleared = true;
    run.rewards = [{ item: setReward(g, r), count: 1 }];
    const books = {
      Warrior: ["Slaying", "Thrusting"],
      Wizard: ["GreatFireBall", "HellFire", "ThunderBolt", "FireWall"],
      Taoist: ["SpiritSword", "Poisoning", "SoulFireBall", "SummonSkeleton"],
    };
    const book = books[r.job]
      .map((name) => g.rules.items.find((d) => d.Name === name))
      .find(
        (d) =>
          d &&
          isSupportedBook(d, g.rules) &&
          d.RequiredAmount <= r.level &&
          !r.skills.some((s) => s.Spell === d.Spell) &&
          !owned(r, d.Index),
      );
    if (book) run.rewards.push({ item: book.Index, count: 1 });
    const cfg = g.rules.adaptations.adventure;
    g.ground(r, g.newItem(cfg.chestId));
    const chest = map2.actors.find((a) => a.item?.id === cfg.chestId);
    delete chest.expires;
    g.say(message("core.adventure.treasureTick.e46b65b95b"));
    return;
  }
  if (!run.nextWaveAt) {
    run.nextWaveAt = g.time + 2e3;
    g.say(message("core.adventure.treasureTick.3abeaa7283"));
    return;
  }
  if (g.time < run.nextWaveAt) return;
  const defs = run.wave < 2 ? [9303, 9303, 9303] : [9302];
  const region = g.region(run.map);
  const positions = [],
    reserved = /* @__PURE__ */ new Set();
  for (let n = 0; n < defs.length; n++) {
    const origin = { x: region.center[0] - 3 + n * 3, y: region.center[1] - 4 };
    let p;
    for (let radius = 0; radius <= 5 && !p; radius++)
      for (let dy = -radius; dy <= radius && !p; dy++)
        for (let dx = -radius; dx <= radius && !p; dx++) {
          const x = origin.x + dx,
            y = origin.y + dy,
            key = x + "," + y;
          if (!reserved.has(key) && g.walkable(run.map, x, y)) {
            p = { x, y };
            reserved.add(key);
          }
        }
    if (!p) {
      run.nextWaveAt = g.time + 1e3;
      return;
    }
    positions.push(p);
  }
  for (let n = 0; n < defs.length; n++)
    map2.actors.push(g.newMonster(g.monsters.get(defs[n]), run.map, positions[n]));
  run.wave++;
  run.nextWaveAt = 0;
  g.say(
    message("core.adventure.treasureTick.1ba8320c01", {
      p0: run.wave,
      p1: run.wave === 3 ? message("game.adventure.captainAppears") : "",
    }),
  );
}
function openTreasure(g, r, a) {
  const run = r.treasureRun;
  if (!run || run.map !== r.map || !run.cleared || run.claimed || !run.rewards)
    throw new LocalizedError(message("core.adventure.openTreasure.dd042cb4ae"));
  const backup = structuredClone(r.inventory);
  for (const reward of run.rewards)
    if (!g.give(r, g.newItem(reward.item, reward.count), false)) {
      r.inventory = backup;
      throw new LocalizedError(message("core.adventure.openTreasure.2d266e6674"));
    }
  r.gold += 500;
  run.claimed = true;
  g.map(r.map).actors = g.map(r.map).actors.filter((x) => x.id !== a.id);
  g.say(message("core.adventure.openTreasure.e623862bb2"));
  moveToBichon(g, r);
  abandonExitedTreasure(g, r);
  g.emit("MapChanged", { MapIndex: r.map });
  g.say(message("challenge.complete"));
}

// games/darkforged/singleplayer/core/game.ts
var dirs = ["Up", "UpRight", "Right", "DownRight", "Down", "DownLeft", "Left", "UpLeft"];
var vectors = [
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
var direction = (a, b) =>
  vectors.findIndex(([x, y]) => x === Math.sign(b.x - a.x) && y === Math.sign(b.y - a.y));
var Game7 = class {
  constructor(rules, seed = 1) {
    this.rules = rules;
    this.defs = new Map(rules.items.map((i) => [i.Index, i]));
    this.monsters = new Map(rules.monsters.map((m) => [m.Index, m]));
    this.rng = new Random(seed);
  }
  sharedStorage = Array(SHARED_STORAGE_SLOTS).fill(null);
  defs;
  monsters;
  rng;
  epoch = globalThis.crypto?.randomUUID?.() ?? String(Date.now());
  roles = [];
  maps = {};
  geometry = /* @__PURE__ */ new Map();
  pendingInstanceExit = /* @__PURE__ */ new WeakMap();
  spreadMaps = /* @__PURE__ */ new Set();
  replenishAt = 0;
  time = 0;
  nextId = 1e4;
  events = [];
  nextOrder = 0;
  packets = [];
  cursor = 0;
  revision = 0;
  active = 0;
  npc = 0;
  lastSaved = null;
  sync;
  bossRespawns = {};
  get me() {
    return this.roles.find((r) => r.id === this.active);
  }
  emit(type, data) {
    this.packets.push({ seq: ++this.cursor, type, data });
    if (this.packets.length > 8192) this.packets.splice(0, 4096);
  }
  say(Message) {
    this.emit("Chat", { Message });
  }
  loadMap(info) {
    this.geometry.set(info.id, {
      ...info,
      solid: Uint8Array.from(atob(info.blocked), (c) => c.charCodeAt(0)),
    });
  }
  region(id) {
    const m = this.rules.world.maps.find((m2) => m2.id === id);
    if (!m) throw new LocalizedError(message("core.game.region.8ae41e8772"));
    return m;
  }
  map(id) {
    return this.maps[id] ?? (this.maps[id] = { actors: [], respawns: {} });
  }
  actor(id) {
    return (
      this.roles.find((r) => r.id === id) ??
      Object.values(this.maps)
        .flatMap((m) => m.actors)
        .find((a) => a.id === id)
    );
  }
  walkable(map2, x, y, ignore = 0) {
    const g = this.geometry.get(map2);
    return (
      !!g &&
      x >= 0 &&
      y >= 0 &&
      x < g.width &&
      y < g.height &&
      !g.solid[y * g.width + x] &&
      !this.map(map2).actors.some(
        (a) =>
          a.id !== ignore &&
          !(a.friendly && a.master === ignore && this.roles.some((r) => r.id === ignore)) &&
          !a.dead &&
          visibleMonster(a) &&
          ["monster", "npc"].includes(a.kind) &&
          a.x === x &&
          a.y === y,
      ) &&
      !this.roles.some(
        (r) =>
          r.id !== ignore &&
          r.id === this.active &&
          !r.dead &&
          r.map === map2 &&
          r.x === x &&
          r.y === y,
      )
    );
  }
  freeNear(map2, p, max = 6) {
    for (let n = 0; n <= max; n++)
      for (let y = p.y - n; y <= p.y + n; y++)
        for (let x = p.x - n; x <= p.x + n; x++)
          if (distance(p, { x, y }) === n && this.walkable(map2, x, y)) return { x, y };
    return null;
  }
  initializeMap(id) {
    const m = this.map(id),
      region = this.region(id);
    if (!this.geometry.has(id))
      throw new LocalizedError(message("core.game.initializeMap.8b913f9fd9"));
    migrateBichonOmaPlacement(this, id);
    const populationMultiplier =
      this.rules.adaptations.spawnPopulationByMap?.[String(id)] ??
      this.rules.adaptations.spawnPopulationMultiplier ??
      1;
    if ((m.populationMultiplier || 1) > populationMultiplier) {
      const kept = /* @__PURE__ */ new Map();
      m.actors = m.actors.filter((a) => {
        if (a.kind !== "monster" || a.dead || a.friendly || a.spawn === void 0) return true;
        const n = (kept.get(a.spawn) || 0) + 1;
        kept.set(a.spawn, n);
        return n <= (region.spawns[a.spawn]?.count ?? 0);
      });
    }
    if ((m.populationMultiplier || 1) < populationMultiplier) {
      m.respawns = {};
    }
    m.populationMultiplier = populationMultiplier;
    const phaseReference = region.spawns.findIndex(
      (s, i) => s.respawnPhaseSeconds !== void 0 && m.respawns[i] !== void 0,
    );
    const phaseOrigin =
      phaseReference < 0
        ? this.time
        : m.respawns[phaseReference] - region.spawns[phaseReference].respawnPhaseSeconds * 1e3;
    region.spawns.forEach((s, i) => {
      if (m.respawns[i] !== void 0) return;
      let due = this.time;
      if (s.respawnPhaseSeconds !== void 0) {
        const interval = Math.max(1e3, s.respawnMinutes * 6e4);
        due = phaseOrigin + s.respawnPhaseSeconds * 1e3;
        if (due < this.time) due += Math.ceil((this.time - due) / interval) * interval;
      }
      m.respawns[i] = due;
    });
    m.actors = m.actors.filter(
      (a) => a.kind !== "npc" || this.rules.world.npcs.some((n) => n.id === a.id && n.map === id),
    );
    for (const n of this.rules.world.npcs.filter((n2) => n2.map === id)) {
      const existing = m.actors.find((a) => a.kind === "npc" && a.id === n.id);
      if (existing) Object.assign(existing, { name: n.name, art: n.art, x: n.at[0], y: n.at[1] });
      else
        m.actors.push({
          id: n.id,
          kind: "npc",
          name: n.name,
          art: n.art,
          map: id,
          x: n.at[0],
          y: n.at[1],
          dir: 0,
          hp: 1,
          maxHP: 1,
          dead: false,
          stats: {},
          buffs: [],
          actionAt: 0,
          attackAt: 0,
          moveAt: 0,
          target: 0,
        });
    }
    if (!this.spreadMaps.has(id)) {
      const used = /* @__PURE__ */ new Set();
      for (const a of m.actors.filter((a2) => a2.kind === "item")) {
        if (used.has(`${a.x},${a.y}`)) Object.assign(a, this.dropPosition(a));
        used.add(`${a.x},${a.y}`);
      }
      this.spreadMaps.add(id);
    }
    this.respawn(id);
  }
  dismissPets(r) {
    const removed = /* @__PURE__ */ new Set();
    for (const map2 of Object.values(this.maps)) {
      for (const a of map2.actors)
        if ((a.friendly && a.master === r.id) || (a.kind === "spell" && a.target === r.id))
          removed.add(a.id);
      map2.actors = map2.actors.filter((a) => !removed.has(a.id));
    }
    this.events = this.events.filter(
      (e) => e.source !== r.id && !removed.has(e.source) && !removed.has(e.target),
    );
    for (const map2 of Object.values(this.maps))
      for (const a of map2.actors) if (a.target === r.id || removed.has(a.target)) a.target = 0;
  }
  // A portal may change the role's map before its destination geometry is loaded.
  clearExitedInstance(r, oldMap) {
    if (oldMap === r.map) return;
    const departing = this.maps[oldMap];
    if (departing) {
      for (const pet of departing.actors) {
        if (!pet.friendly || pet.dead || pet.master !== r.id) continue;
        const landing = this.geometry.has(r.map) && this.petLanding(r);
        pet.map = r.map;
        pet.x = landing ? landing.x : r.x;
        pet.y = landing ? landing.y : r.y;
        pet.target = 0;
        this.map(r.map).actors.push(pet);
      }
    }
    delete this.maps[oldMap];
    this.events = this.events.filter((event) => event.map !== oldMap);
  }
  bringPets(r) {
    if (!this.geometry.has(r.map)) return;
    for (const m of Object.values(this.maps)) {
      for (const a of [...m.actors]) {
        if (
          a.friendly &&
          a.master === r.id &&
          !a.dead &&
          (a.map !== r.map || distance(a, r) > 10 || distance(a, r) === 0)
        ) {
          const spot = this.petLanding(r);
          if (!spot) continue;
          m.actors = m.actors.filter((x) => x !== a);
          a.map = r.map;
          a.x = spot.x;
          a.y = spot.y;
          a.target = 0;
          this.map(r.map).actors.push(a);
        }
      }
      m.actors = m.actors.filter(
        (a) => !(a.kind === "spell" && a.target === r.id && a.map !== r.map),
      );
    }
  }
  respawn(id) {
    const map2 = this.map(id),
      region = this.region(id);
    region.spawns.forEach((s, i) => {
      if (s.minPlayerLevel && (this.me?.level || 0) < s.minPlayerLevel) {
        map2.actors = map2.actors.filter((a) => a.spawn !== i);
        return;
      }
      const persistent = persistentBossSpawn(this, region, i);
      if (persistent) {
        const now = this.time,
          interval = Math.max(1e3, s.respawnMinutes * 6e4);
        if (now >= persistent.nextAt) {
          persistent.available = s.count;
          persistent.nextAt += (Math.floor((now - persistent.nextAt) / interval) + 1) * interval;
        }
        map2.respawns[i] = this.time + Math.max(0, persistent.nextAt - now);
      } else if (map2.respawns[i] > this.time) return;
      if (!persistent && s.respawnPhaseSeconds !== void 0) {
        const interval = Math.max(1e3, s.respawnMinutes * 6e4);
        const due = map2.respawns[i] ?? this.time + s.respawnPhaseSeconds * 1e3;
        map2.respawns[i] = due + (Math.floor((this.time - due) / interval) + 1) * interval;
      } else if (!persistent && s.native)
        map2.respawns[i] = this.time + Math.max(1, s.native.intervalSeconds) * 1e3;
      const d = this.rules.monsters.find((m) => m.Name === s.monster);
      if (!d) throw new LocalizedError(message("core.game.respawn.3097501c0a"));
      const existing = map2.actors.filter(
        (a) =>
          a.spawn === i &&
          (!a.dead || (a.ai === 25 && Number(a.special?.revivals) < Number(a.special?.lives))),
      ).length;
      for (let n = existing; n < Math.min(s.count, persistent?.available ?? s.count); n++) {
        let p = null;
        if (s.locations) {
          const start = this.rng.next(s.locations.length);
          for (let k = 0; k < s.locations.length; k++) {
            const [x, y] = s.locations[(start + k) % s.locations.length];
            if (this.walkable(id, x, y)) {
              p = { x, y };
              break;
            }
          }
        } else p = this.freeNear(id, { x: s.at[0], y: s.at[1] }, Math.max(1, s.spread));
        if (!p) continue;
        const actor = this.newMonster(d, id, p, i);
        markBichonOmaSpawn(this, actor);
        map2.actors.push(actor);
      }
    });
  }
  newMonster(d, map2, p, spawn) {
    const actor = {
      id: this.nextId++,
      kind: "monster",
      name: d.Name,
      sourceName: d.Name,
      art: d.Image,
      ai: d.AI,
      definition: d.Index,
      spawn,
      map: map2,
      x: p.x,
      y: p.y,
      dir: this.rng.next(8),
      hp: d.Stats.HP || 1,
      maxHP: d.Stats.HP || 1,
      dead: false,
      stats: { ...d.Stats },
      buffs: [],
      actionAt: this.time,
      attackAt: this.time,
      moveAt: this.time + this.rng.next(1500),
      target: 0,
    };
    initializeMonster(this, actor, d);
    initializeMonsterAffixes(this, actor, d);
    return actor;
  }
  newItem(id, count = 1, random = false, monster, owner, monsterMagicFind = 0, actor) {
    if (id === this.rules.adaptations.unifiedDeerMeat.legacy)
      id = this.rules.adaptations.unifiedDeerMeat.canonical;
    const d = this.defs.get(id);
    if (!d) throw new LocalizedError(message("core.game.newItem.53a9e6222a"));
    const item = {
      uid: this.nextId++,
      id,
      count,
      currentDura: d.Durability,
      maxDura: d.Durability,
      added: {},
      specialVersion: 1,
    };
    if (random) {
      const nativeMagicFind = this.rules.adaptations.dreamRuntime
        ? dreamMagicFind(
            this.rules.adaptations.dreamRuntime,
            (owner?.stats.MagicFind || 0) + monsterMagicFind,
          )
        : (owner?.stats.MagicFind || 0) + monsterMagicFind;
      if (dxNaturalItem(this, item, d, monster, actor, nativeMagicFind)) {
      } else if (this.rules.adaptations.dreamRuntime) {
        const cfg = this.rules.adaptations.dreamRuntime;
        dreamExceptional(
          item,
          d,
          this.rng,
          cfg,
          dreamMagicFind(cfg, (owner?.stats.MagicFind || 0) + monsterMagicFind),
        );
        rollExceptionalAffixes(item, d, this.rng, cfg);
      } else affixes(item, d, this.rng, this.rules.adaptations.earlyLoot);
      rollGem(item, d, this.rng, this.rules.adaptations.gemEnhancement, monster);
    }
    initializeChest(this, item);
    if (
      d.Type === "CraftMaterial" &&
      ["\u53EF\u63D0\u70BC\u4E3A\u77FF\u952D", "\u53EF\u52A0\u5DE5\u4E3A\u6728\u677F"].includes(
        String(d.DreamRawItem?.Desc),
      )
    )
      item.materialQuality = random ? this.rng.next(20, 1) : 1;
    return item;
  }
  create(name, job, gender) {
    if (!["Warrior", "Wizard", "Taoist"].includes(job) || !["Male", "Female"].includes(gender))
      throw new LocalizedError(message("core.game.create.0e98147ebf"));
    if (!/^[\p{L}\p{N}_]{2,12}$/u.test(name))
      throw new LocalizedError(message("core.game.create.d86ef9b54c"));
    if (this.roles.some((r2) => r2.name === name))
      throw new LocalizedError(message("core.game.create.90c93a7e79"));
    if (this.roles.length >= 6) throw new LocalizedError(message("core.game.create.5b01055bee"));
    const home = this.rules.world.maps.find((m) => m.start);
    const r = {
      id: this.nextId++,
      kind: "player",
      name,
      job,
      gender,
      map: home.id,
      x: home.center[0],
      y: home.center[1],
      dir: 4,
      level: 1,
      xp: 0,
      hp: 1,
      maxHP: 1,
      mp: 0,
      maxMP: 0,
      gold: 0,
      dead: false,
      stats: {},
      buffs: [],
      actionAt: 0,
      attackAt: 0,
      moveAt: 0,
      target: 0,
      inventory: Array(this.rules.adaptations.bagExpansion.baseSlots * 2).fill(null),
      itemHotkeys: Array(6).fill(null),
      bagExpansionRows: 0,
      bagLayoutVersion: 1,
      storagePages: 1,
      equipment: Array(15).fill(null),
      storage: Array(80).fill(null),
      questInventory: Array(40).fill(null),
      skills: [],
      quests: [],
      completedQuests: [],
      attackModes: {},
      spellAt: 0,
      potAt: 0,
      healAt: 0,
      regenAt: 1e4,
      potHP: 0,
      potMP: 0,
      healHP: 0,
    };
    this.roles.push(r);
    this.refresh(r);
    for (const d of this.rules.items.filter(
      (i) =>
        i.StartItem &&
        matchesClass(i.RequiredClass, job) &&
        (i.RequiredGender === "None" || i.RequiredGender === gender),
    ))
      this.give(r, starterItem(this.newItem(d.Index), this.rules), false);
    for (let index = 0; index < r.inventory.length; index++) {
      const item = r.inventory[index];
      if (!item) continue;
      const def = this.defs.get(item.id);
      if (def.Type === "Weapon" || def.Type === "Armour") {
        const slot = itemSlots(def)?.[0];
        if (slot !== void 0 && !r.equipment[slot]) {
          this.checkUse(r, def);
          r.equipment[slot] = item;
          r.inventory[index] = null;
        }
      }
      if (def.Name === "(HP)DrugSmall") r.itemHotkeys[0] = item.id;
    }
    this.grantBlessing(r);
    this.refresh(r);
    r.hp = r.maxHP;
    r.mp = r.maxMP;
    return r;
  }
  grantBlessing(r) {
    const cfg = this.rules.adaptations.blessingTalisman;
    if (!cfg || r.claimedBlessing) return;
    if ([...r.inventory, ...r.equipment, ...r.storage].some((i) => i?.id === cfg.itemId)) {
      r.claimedBlessing = true;
      return;
    }
    if (this.give(r, this.newItem(cfg.itemId), false)) r.claimedBlessing = true;
  }
  start(id) {
    const r = this.roles.find((r2) => r2.id === id);
    if (!r) throw new LocalizedError(message("core.game.start.30dd0e6b0b"));
    migrateItemHotkeys(r, this.defs);
    for (let slot = 0; slot < r.equipment.length; slot++) {
      const i = r.equipment[slot];
      if (i && this.defs.get(i.id)?.Type === "Mount" && this.give(r, i, false))
        r.equipment[slot] = null;
    }
    for (const other of this.roles) if (other.id !== id) this.dismissPets(other);
    this.active = id;
    unlockArrivalWaypoints(r, this.rules);
    this.npc = 0;
    this.initializeMap(r.map);
    this.grantBlessing(r);
    if (this.rules.adaptations.noviceProgression)
      migrateSpiritProgress(r, this.rules.adaptations.noviceProgression.spiritGrowth);
    grantNoviceSkill(this, r);
    this.refresh(r);
    if (!r.dead) this.gainXP(r, 0);
    if (grantNoviceSkill(this, r)) this.refresh(r);
    for (const skill of r.skills) this.settleSkillExperience(r, skill);
  }
  refresh(r) {
    const base = this.rules.growth.baseStats.find((s) => s.Job === r.job);
    r.stats = Object.fromEntries(base.Stats.map((s) => [s.Type, baseStat(s, r.job, r.level)]));
    const nativeBase =
      this.rules.adaptations.dreamRuntime?.heroGrowth[r.job]?.[String(Math.min(85, r.level))];
    if (nativeBase)
      Object.assign(r.stats, nativeBase, { Accuracy: 0, Agility: 0, NativeLuckFormula: 1 });
    r.stats.SkillGainMultiplier = 1;
    for (const i of r.equipment) {
      if (!i || (i.maxDura > 0 && i.currentDura === 0)) continue;
      const def = this.defs.get(i.id);
      for (const [k, v] of Object.entries(weaponGrowthStats(i, def)))
        r.stats[k] = (r.stats[k] || 0) + v;
      for (const [k, v] of Object.entries(potentialStats(i, def)))
        r.stats[k] = (r.stats[k] || 0) + v;
      const dxStats = dxItemStats(dxConfig(this.rules), i, def);
      for (const [k, v] of Object.entries(dxStats)) r.stats[k] = (r.stats[k] || 0) + v;
      if (dxStats.MagicResist)
        r.stats.DxMagicResist = (r.stats.DxMagicResist || 0) + dxStats.MagicResist;
      if (def.Unique.includes("Skill")) r.stats.SkillGainMultiplier = 3;
      for (const [k, v] of Object.entries(def.Stats)) r.stats[k] = (r.stats[k] || 0) + v;
      for (const [k, v] of Object.entries({
        ...i.added,
        ...Object.fromEntries(
          Object.entries(affixStats(i, r.job)).map(([k2, v2]) => [k2, v2 + (i.added[k2] || 0)]),
        ),
      }))
        r.stats[k] = (r.stats[k] || 0) + v;
    }
    if (
      r.equipment.some(
        (i) =>
          i &&
          !(i.maxDura > 0 && i.currentDura === 0) &&
          this.defs.get(i.id).Unique.includes("Muscle"),
      )
    )
      for (const key of ["BagWeight", "WearWeight", "HandWeight"])
        r.stats[key] = (r.stats[key] || 0) * 2;
    applyEquipmentSets(r.stats, r.equipment, this.defs);
    for (const set of dreamSetStates(r.equipment, this.defs))
      for (const effect of set.effects)
        if (set.count >= effect.count)
          for (const [k, v] of Object.entries(effect.stats)) r.stats[k] = (r.stats[k] || 0) + v;
    const dxSets = dxSetBonusStats(dxConfig(this.rules), r.equipment);
    for (const [k, v] of Object.entries(dxSets)) r.stats[k] = (r.stats[k] || 0) + v;
    if (dxSets.MagicResist)
      r.stats.DxMagicResist = (r.stats.DxMagicResist || 0) + dxSets.MagicResist;
    for (const item of r.equipment)
      if (item && (!item.maxDura || item.currentDura > 0))
        for (const [k, v] of Object.entries(this.defs.get(item.id).DreamSpecialStats || {}))
          r.stats[k] = (r.stats[k] || 0) + v;
    applyAdventureSet(this, r);
    const title = this.rules.adaptations.trial?.titles[(r.trial?.title || 0) - 1];
    if (title)
      for (const k of ["DC", "MC", "SC", "AC", "MAC"]) {
        r.stats["Min" + k] = (r.stats["Min" + k] || 0) + title.min;
        r.stats["Max" + k] = (r.stats["Max" + k] || 0) + title.max;
      }
    const temp = Object.entries({
      Flame: "FireBall",
      Healing: "Healing",
      Blink: "Blink",
    })
      .filter(([flag]) => this.special(r, flag))
      .map(([, spell]) => spell);
    r.skills = r.skills.filter((s) => !s.temporary || temp.includes(s.Spell));
    for (const spell of temp)
      if (!r.skills.some((s) => s.Spell === spell))
        r.skills.push({
          Spell: spell,
          Level: 0,
          Key: 0,
          Experience: 0,
          CastTime: 0,
          temporary: true,
        });
    for (const skill of r.skills)
      for (const [key, value] of Object.entries(
        this.skill(r, skill.Spell)?.d.DreamSkill
          ? dreamPassiveStats(
              this.skill(r, skill.Spell).d,
              effectiveSkillLevel(skill, this.skill(r, skill.Spell).d, r.stats),
            )
          : passiveSkillStats(skill.Spell, skill.Level),
      ))
        r.stats[key] = (r.stats[key] || 0) + value;
    for (const b of r.buffs)
      for (const [k, v] of Object.entries(b.stats)) r.stats[k] = (r.stats[k] || 0) + v;
    for (const key of [
      "HP",
      "MP",
      "MinDC",
      "MinMC",
      "MinSC",
      "MaxAC",
      "MaxMAC",
      "MaxDC",
      "MaxMC",
      "MaxSC",
      "AttackSpeed",
    ])
      r.stats[key] =
        (r.stats[key] || 0) +
        Math.trunc(((r.stats[key] || 0) * (r.stats[key + "RatePercent"] || 0)) / 100);
    for (const [key, value] of Object.entries(base.Caps))
      r.stats[key] = Math.min(value, r.stats[key] || 0);
    for (const key of [
      "HP",
      "MP",
      "MinAC",
      "MaxAC",
      "MinMAC",
      "MaxMAC",
      "MinDC",
      "MaxDC",
      "MinMC",
      "MaxMC",
      "MinSC",
      "MaxSC",
    ])
      r.stats[key] = Math.max(0, r.stats[key] || 0);
    for (const key of ["DC", "MC", "SC"])
      r.stats["Min" + key] = Math.min(r.stats["Min" + key], r.stats["Max" + key]);
    affixDefence(r);
    const qualityCounts = /* @__PURE__ */ new Map();
    for (const i of r.equipment) {
      if (!i || (i.maxDura > 0 && !i.currentDura)) continue;
      const n = Math.min(8, Math.floor(exceptionalPoints(i)));
      if (n > 0) qualityCounts.set(n, (qualityCounts.get(n) || 0) + 1);
    }
    r.stats.QualitySetDamagePercent = Math.max(
      0,
      ...[...qualityCounts].filter(([, count]) => count >= 5).map(([n]) => n * 2),
    );
    applyTestTalismanStats(r, this.rules);
    capGemStats(r, this.rules.adaptations.gemEnhancement);
    {
      const dx = dxConfig(this.rules);
      if (dx) capPowers(dx, r.stats);
    }
    r.maxHP = Math.max(1, r.stats.HP || 1);
    r.maxMP = Math.max(0, r.stats.MP || 0);
    r.hp = Math.min(r.hp, r.maxHP);
    r.mp = Math.min(r.mp, r.maxMP);
    for (const map2 of Object.values(this.maps))
      for (const pet of map2.actors)
        if (pet.friendly && !pet.dead && pet.master === r.id) this.refreshActor(pet);
  }
  wearItem(_r, _slot, _amount) {}
  special(r, name) {
    return r.equipment.some(
      (i) =>
        i &&
        !(i.maxDura > 0 && i.currentDura === 0) &&
        this.defs
          .get(i.id)
          .Unique.split(",")
          .map((s) => s.trim())
          .includes(name),
    );
  }
  buyback(r, npc) {
    r.buyback ??= {};
    return (r.buyback[npc] = (r.buyback[npc] || []).filter(
      (i) => i.buybackAt === void 0 || i.buybackAt + this.rules.goods.BuyBackTime * 6e4 > this.time,
    ));
  }
  bagWeight(r) {
    return r.inventory.reduce(
      (v, i) => v + (i ? (this.defs.get(i.id)?.Weight || 0) * i.count : 0),
      0,
    );
  }
  insert(grid, item, start = 0, end = grid.length) {
    const d = this.defs.get(item.id);
    let left = item.count;
    const plan = [];
    if (d.StackSize > 1)
      for (let i = start; i < end; i++) {
        const s = grid[i];
        if (
          s &&
          s.id === item.id &&
          s.count < d.StackSize &&
          JSON.stringify(s.added) === JSON.stringify(item.added) &&
          s.materialQuality === item.materialQuality &&
          !!s.bound === !!item.bound
        ) {
          const n = Math.min(left, d.StackSize - s.count);
          plan.push([i, n]);
          left -= n;
          if (!left) break;
        }
      }
    const empty = [];
    for (let i = start; i < end && left > 0; i++)
      if (!grid[i]) {
        const n = Math.min(left, d.StackSize || 1);
        empty.push([i, n]);
        left -= n;
      }
    if (left) return false;
    for (const [i, n] of plan) grid[i].count += n;
    for (const [i, n] of empty)
      grid[i] = {
        ...structuredClone(item),
        uid: empty.length === 1 ? item.uid : this.nextId++,
        count: n,
      };
    return true;
  }
  give(r, item, notify = true) {
    const d = this.defs.get(item.id);
    const target = d.Type === "Quest" ? r.questInventory : r.inventory;
    const [start, end] = d.Type === "Quest" ? [0, target.length] : bagRange(r, this.rules, d);
    if (!this.insert(target, item, start, end)) return false;
    if (notify)
      this.emit(d.Type === "Quest" ? "GainedQuestItem" : "GainedItem", {
        Item: { ItemIndex: item.id, Count: item.count },
      });
    return true;
  }
  transferGroundLoot(r, a) {
    if (a.gold) {
      r.gold += a.gold;
      this.emit("GainedGold", { Gold: a.gold });
    } else if (a.item && !this.give(r, a.item)) return false;
    return true;
  }
  autoLootNearby(r) {
    if (r.dead || this.time < (this.lootScanAt || 0)) return;
    this.lootScanAt = this.time + 200;
    const map = this.map(r.map);
    map.actors = map.actors.filter((a) => {
      if (
        a.kind !== "item" ||
        a.map !== r.map ||
        distance(r, a) > 5 ||
        (a.expires && a.expires <= this.time) ||
        a.item?.id === this.rules.adaptations.adventure.chestId ||
        (!a.gold && this.defs.get(a.item?.id)?.Type !== "Potion")
      ) return true;
      return !this.transferGroundLoot(r, a);
    });
  }
  count(r, id) {
    return [...r.questInventory, ...r.inventory].reduce(
      (n, i) => n + (i?.id === id ? i.count : 0),
      0,
    );
  }
  consume(r, id, count) {
    if (this.count(r, id) < count) return false;
    const available = [...r.questInventory, ...r.inventory]
      .filter((i) => i?.id === id && !(i?.locked || dxFavoriteProtected(this, i)))
      .reduce((n, i) => n + i.count, 0);
    if (available < count) throw new LocalizedError(message("dx.favorite.error.protected"));
    for (const grid of [r.questInventory, r.inventory])
      for (let n = 0; n < grid.length && count; n++) {
        const i = grid[n];
        if (i?.id !== id || i.locked || dxFavoriteProtected(this, i)) continue;
        const take2 = Math.min(count, i.count);
        i.count -= take2;
        count -= take2;
        if (!i.count) grid[n] = null;
      }
    return true;
  }
  skill(r, spell) {
    const s = r.skills.find((s2) => s2.Spell === spell),
      d = this.rules.skills.find((s2) => s2.Spell === spell);
    return s && d ? { s, d, level: effectiveSkillLevel(s, d, r.stats) } : null;
  }
  levelSkill(r, s) {
    const d = this.rules.skills.find((d2) => d2.Spell === s.Spell);
    if (d.DreamBookProgression) return;
    const exp =
      r.level === 65535
        ? 255
        : ((this.rng.next(3) + 1) * Math.min(255, r.stats.SkillGainMultiplier || 1)) & 255;
    if (s.Level >= 3) return;
    const need = [d.Need1, d.Need2, d.Need3][s.Level],
      level = [d.Level1, d.Level2, d.Level3][s.Level];
    if (r.level < level) return;
    s.Experience += exp;
    this.settleSkillExperience(r, s);
  }
  settleSkillExperience(r, s) {
    const d = this.rules.skills.find((d2) => d2.Spell === s.Spell);
    if (!d || d.DreamBookProgression) return;
    while (
      s.Level < 3 &&
      r.level >= [d.Level1, d.Level2, d.Level3][s.Level] &&
      s.Experience >= [d.Need1, d.Need2, d.Need3][s.Level]
    ) {
      s.Experience = s.Level === 2 ? 0 : s.Experience - [d.Need1, d.Need2, d.Need3][s.Level];
      s.Level++;
      this.say(message("core.game.settleSkillExperience.fcc8d6a282"));
      this.refresh(r);
    }
  }
  gainXP(r, xp, flatBonus = 0, near2 = r) {
    xp += Math.trunc((xp * Math.max(0, r.stats.ExpRatePercent || 0)) / 100);
    xp += Math.max(0, Math.trunc(flatBonus));
    r.xp += xp;
    shareSpiritExperience(this, r, xp, near2);
    for (const pet of this.map(r.map).actors.filter(
      (a) => a.friendly && a.master === r.id && !a.dead && distance(a, r) <= 16,
    )) {
      pet.special ??= {};
      const s = pet.special,
        level = Number(s.petLevel || 0),
        max = Number(s.maxPetLevel || 0);
      if (pet.special?.dreamPet || level >= max) continue;
      s.petXP = Number(s.petXP || 0) + xp * ([18, 23, 38].includes(pet.ai || 0) ? 3 : 1);
      while (Number(s.petLevel || 0) < max && Number(s.petXP) >= 100) {
        s.petXP = Number(s.petXP) - 100;
        s.petLevel = Number(s.petLevel || 0) + 1;
        this.refreshActor(pet);
      }
    }
    while (
      r.level < this.rules.growth.experience.length &&
      r.xp >= this.rules.growth.experience[r.level - 1]
    ) {
      r.xp -= this.rules.growth.experience[r.level - 1];
      r.level++;
      this.refresh(r);
      r.hp = r.maxHP;
      r.mp = r.maxMP;
      this.say(message("core.game.gainXP.4c7c6d8205", { p0: r.level }));
    }
    if (grantNoviceSkill(this, r)) this.refresh(r);
    for (const skill of r.skills) this.settleSkillExperience(r, skill);
    if (xp > 0) this.emit("GainedExperience", { ObjectID: r.id, Amount: xp });
  }
  buff(a, type, ms, value = 0, stats2 = {}, source = this.active, spell) {
    if (a.kind === "monster" && !targetableMonster(a)) return;
    if (
      monsterCombatProfile(this, a)?.poisonImmune &&
      ["Green", "Red", "DreamPoisonArmour"].includes(type)
    )
      return;
    const avoid = monsterCombatProfile(this, a)?.statusAvoidPercent?.[type];
    if (avoid && this.rng.next(100) < avoid) return;
    if (type === "NativeCurse") stats2 = { ...stats2, NativeCursePercent: value };
    const resist = ["Green", "Red", "DreamPoisonArmour"].includes(type)
      ? "Poison"
      : ["Paralysis", "LRParalysis", "Stun"].includes(type)
        ? "Stone"
        : ["Slow", "Frozen", "DreamFrost"].includes(type)
          ? "Freeze"
          : "";
    if (resist) {
      const nativePlayer = a.kind === "player" && this.rules.adaptations.dreamRuntime;
      if (nativePlayer) {
        if (["Poison", "Stone"].includes(resist)) {
          const qi = a.buffs.find((b) => b.type === "InnateQi" && b.until > this.time);
          const rank = qi ? this.skill(a, "InnateQi")?.level || qi.value : 0;
          ms -=
            Math.max(0, rank - 3) * 1e3 +
            (a.stats["NativeState:" + (resist === "Poison" ? 39 : 40)] || 0) * 1e3;
        }
        ms = Math.max(1500, ms);
      }
      if (a.stats[resist + "DodgePercent"] && this.rng.next(100) < a.stats[resist + "DodgePercent"])
        return;
      ms = Math.max(
        nativePlayer ? 1e3 : 0,
        Math.floor(ms * (1 - Math.min(100, a.stats[resist + "RecoveryPercent"] || 0) / 100)),
      );
    }
    if (ms <= 0) return;
    const old = a.buffs.find((b) => b.type === type && b.until > this.time);
    if (old && ["Paralysis", "LRParalysis"].includes(type)) return;
    if (old && type === "Red" && old.until - this.time > ms) return;
    a.buffs = a.buffs.filter(
      (b) => b.type !== type && !(type === "Slow" && b.type === "DreamFrost"),
    );
    const monsterGreen =
      type === "Green" &&
      spell !== "NativeDeathPoison" &&
      this.actor(source)?.kind === "monster" &&
      !this.actor(source)?.friendly;
    a.buffs.push({
      type,
      until: this.time + ms,
      next:
        (type === "Green" || (type === "DxIgnite" && dxConfig(this.rules))) && old
          ? old.next
          : this.time + (monsterGreen ? 2e3 : 1e3),
      ...(monsterGreen ? { interval: 2e3, nativeMonsterPoison: true } : {}),
      ...(type === "Green" && old?.interval ? { interval: old.interval } : {}),
      value,
      stats: stats2,
      source,
      ...(spell ? { spell } : {}),
    });
    this.refreshActor(a);
    return a.buffs[a.buffs.length - 1];
  }
  refreshActor(a) {
    if (a.kind === "player") return this.refresh(a);
    const def = this.monsters.get(a.definition);
    if (!def) return;
    const oldMaxHP = a.maxHP,
      oldHP = a.hp;
    a.stats = { ...def.Stats };
    applyBossHealthStats(this, a);
    if (a.special?.nightmareOwner) {
      a.stats.HP = a.maxHP = 120000;
      a.stats.MinDC = 130;
      a.stats.MaxDC = 260;
    }
    if (a.friendly) {
      const level = Number(a.special?.petLevel || 0);
      if (a.special?.dreamPet) {
        if (a.special.dreamTamed) {
          a.stats.HP = (a.stats.HP || 0) + 20 * level;
          for (const key of ["MinAC", "MaxAC", "MinMAC", "MaxMAC"])
            a.stats[key] = (a.stats[key] || 0) + 2 * level;
        }
        const minimumGain = a.special.dreamTamed ? 1 : 0;
        for (let i = 0; i < level; i++) {
          const lo = a.stats.MinDC || 0,
            hi = a.stats.MaxDC || 0;
          a.stats.MinDC = Math.max(
            lo + minimumGain,
            Math.trunc(Math.fround(lo * Math.fround(1.05))),
          );
          a.stats.MaxDC = Math.max(
            hi + minimumGain,
            Math.trunc(Math.fround(hi * Math.fround(1.15))),
          );
        }
      } else
        for (const [key, gain] of Object.entries({
          HP: 20,
          MinAC: 2,
          MaxAC: 2,
          MinMAC: 2,
          MaxMAC: 2,
          MinDC: 1,
          MaxDC: 1,
        }))
          a.stats[key] = (a.stats[key] || 0) + level * gain;
      const beast = Number(a.special?.nativeBeastArmourRank || 0);
      if (beast) {
        a.stats.MinAC = (a.stats.MinAC || 0) + 6 * beast;
        a.stats.MinMAC = (a.stats.MinMAC || 0) + 3 * beast;
        a.stats.MaxDC = (a.stats.MaxDC || 0) + 7 * beast;
        a.stats.Agility = (a.stats.Agility || 0) + beast;
      }
      applyPetDefence(this, a);
      a.maxHP = Math.max(1, a.stats.HP || 1);
      a.hp =
        oldMaxHP > 0 && oldMaxHP !== a.maxHP
          ? Math.min(
              oldHP,
              Math.max(oldHP > 0 ? 1 : 0, Math.floor((Math.max(0, oldHP) / oldMaxHP) * a.maxHP)),
            )
          : Math.min(a.hp, a.maxHP);
    }
    for (const b of a.buffs.filter((b2) => b2.type !== "DreamBossAbility"))
      for (const [key, value] of Object.entries(b.stats))
        a.stats[key] = (a.stats[key] || 0) + value;
    for (const k of ["MinDC", "MaxDC"])
      a.stats[k] = Math.max(
        0,
        Math.floor((a.stats[k] || 0) * (1 + (a.stats[k + "RatePercent"] || 0) / 100)),
      );
  }
  schedule(kind, delay, source, target, damage, defence = "ACAgility", spell) {
    const event = {
      kind,
      at: this.time + delay,
      order: this.nextOrder++,
      source: source.id,
      target: target.id,
      map: source.map,
      damage,
      defence,
      spell,
    };
    this.events.push(event);
    this.events.sort((a, b) => a.at - b.at || a.order - b.order);
    return event;
  }
  safe(a) {
    return this.geometry.get(a.map)?.safeZones.some((z) => distance(a, z) <= z.size) ?? false;
  }
  deferBuff(
    source,
    target,
    type,
    duration,
    value = 0,
    stats2 = {},
    delay = 500,
    interval = 1e3,
    spell,
  ) {
    this.schedule("buff", delay, source, target, 0, "None", spell);
    const event = this.events.find((e) => e.order === this.nextOrder - 1);
    event.effect = { type, duration, value, stats: stats2, interval };
  }
  damage(
    source,
    target,
    raw,
    defence = "ACAgility",
    spell,
    deathEffect = false,
    periodicDamage = false,
  ) {
    if (
      source.friendly &&
      source.master &&
      this.roles.find((r) => r.id === source.master)?.stats.AdventureTaoist
    )
      raw = Math.floor(raw * 1.15);
    if (
      (source.dead && !(deathEffect && nativeDeathSource(this, source, spell))) ||
      target.dead ||
      (target.kind === "monster" && !targetableMonster(target)) ||
      source.map !== target.map ||
      (target.kind === "player" && this.safe(target))
    )
      return 0;
    const channelIndex = target.special?.bossChannelIndex,
      channel =
        channelIndex === void 0
          ? void 0
          : monsterCombatProfile(this, target)?.attacks[Number(channelIndex)]?.channel;
    if (
      !periodicDamage &&
      channel?.invulnerable &&
      this.time < Number(target.special?.bossChannelUntil) &&
      !target.buffs.some(
        (b) =>
          b.until > this.time && ["Paralysis", "Frozen", "Stun", "Trap", "Shock"].includes(b.type),
      )
    )
      return 0;
    const bossShield = target.buffs.find((b) => b.type === "DreamBossShield");
    if (bossShield && defence !== "None") raw = Math.floor(raw * (1 - bossShield.value / 100));
    raw = monsterAffixDamage(this, source, raw, defence, spell);
    raw = dreamOutgoing(this, source, target, raw, spell);
    raw = gemDamageBonus(this, source, target, raw, spell);
    raw = affixOutgoing(this, source, target, raw, spell, defence);
    raw = dxOutgoing(this, source, target, raw, spell, defence);
    const hpBefore = target.hp;
    let hit = true,
      armor = 0;
    const nativeCombat = !!this.rules.adaptations.dreamRuntime;
    if (nativeCombat) {
      if (
        (defence.startsWith("AC") || defence === "Agility") &&
        this.rng.next(10) >=
          Math.max(2, (source.stats.Accuracy || 0) - (target.stats.Agility || 0) + 8)
      )
        hit = false;
    } else if (
      defence.includes("Agility") &&
      this.rng.next((target.stats.Agility || 0) + 1) > (source.stats.Accuracy || 0)
    )
      hit = false;
    if (
      defence.startsWith("AC") &&
      target.stats.PhysicalDodgePercent &&
      this.rng.next(100) < target.stats.PhysicalDodgePercent
    )
      hit = false;
    if (defence.startsWith("MAC")) {
      if (target.stats.MagicDodgePercent && this.rng.next(100) < target.stats.MagicDodgePercent)
        hit = false;
      if (
        !nativeCombat &&
        this.rng.next(this.rules.constants.MagicResistWeight) < (target.stats.MagicResist || 0)
      )
        hit = false;
      const dxResist =
        nativeCombat && dxConfig(this.rules) ? Math.max(0, target.stats.DxMagicResist || 0) : 0;
      if (
        dxResist > 0 &&
        this.rng.next(this.rules.constants.MagicResistWeight) <
          Math.min(this.rules.constants.MagicResistWeight, dxResist)
      )
        hit = false;
      armor = this.rng.next(
        Math.max(target.stats.MinMAC || 0, target.stats.MaxMAC || 0) + 1,
        target.stats.MinMAC || 0,
      );
    } else if (defence.startsWith("AC"))
      armor = this.rng.next(
        Math.max(target.stats.MinAC || 0, target.stats.MaxAC || 0) + 1,
        target.stats.MinAC || 0,
      );
    if (target.kind === "player" && defence !== "None")
      armor = Math.floor(
        armor *
          (1 +
            ((target.stats.NativeDefencePercentLow || 0) + affixRangeExtra(this, target, 11)) /
              100),
      );
    const nativePoison = target.buffs.find((b) => b.type === "DreamPoisonArmour");
    if (source.kind === "player" && defence !== "None")
      armor = Math.floor(armor * (1 - Math.min(100, source.stats.WeakSpotPercent || 0) / 100));
    if (nativePoison) armor = Math.floor(armor * (1 - nativePoison.value / 100));
    const nativeSpell = source.kind === "player" ? this.skill(source, spell || "") : null;
    if (
      nativeSpell?.d.DreamSkill &&
      (spell === "FlameDisruptor" || (spell === "SoulFireBall" && nativeSpell.level >= 4))
    )
      armor = Math.floor(armor * 0.5);
    if (nativeSpell?.d.DreamSkill && spell === "DragonFlame")
      armor = Math.trunc(armor / Math.max(1, nativeSpell.level));
    if (target.buffs.some((b) => b.type === "Red"))
      armor = Math.trunc(armor * (target.kind === "monster" ? 0.5 : 0.9));
    if (hit && source.kind === "player" && defence.startsWith("AC"))
      this.wearItem(source, 0, this.rng.next(4) + 1);
    if (defence.endsWith("Bypass") || defence.endsWith("NoArmor")) armor = 0;
    const shield = target.buffs.find((b) => b.type === "MagicShield");
    let damage =
      raw + (defence === "None" || source.kind !== "player" ? 0 : source.stats.AttackBonus || 0);
    if (defence !== "None" && target.kind === "player") {
      const reduction =
        target.stats.DamageReductionPercent ||
        (shield && !this.skill(target, "MagicShield")?.d.DreamSkill ? (shield.value + 2) * 10 : 0);
      damage -= Math.trunc((damage * reduction) / 100);
    }
    const heavy =
      hit &&
      damage > armor &&
      source.kind === "player" &&
      !target.friendly &&
      defence === "AC" &&
      spell === "None" &&
      noviceHeavyHit(this, source);
    if (heavy)
      damage = Math.floor(
        damage * (this.rules.adaptations.noviceProgression?.heavyStrike?.multiplier || 1),
      );
    let amount = hit ? Math.max(0, damage - armor) : 0;
    const crit =
      !nativeCombat &&
      defence !== "None" &&
      source.kind === "player" &&
      amount > 0 &&
      this.rng.next(100) <
        (source.stats.CriticalRate || 0) * this.rules.constants.CriticalRateWeight +
          (source.stats.GemCriticalRatePercent || 0) +
          (source.stats.DreamCritPercent || 0) +
          (source.stats.NativeCriticalPoints || 0) * 5 +
          affixRangeExtra(this, source, 44);
    if (crit) {
      damage += Math.floor(
        damage *
          (this.rules.adaptations.dreamRuntime
            ? Math.max(
                0.25 +
                  ((source.stats.DreamCritDamagePercent || 0) + affixRangeExtra(this, source, 45)) /
                    100,
                source.stats.GemCriticalRatePercent ? 0.5 : 0,
              )
            : Math.max(
                ((source.stats.CriticalDamage || 0) / this.rules.constants.CriticalDamageWeight) *
                  10,
                source.stats.GemCriticalRatePercent ? 0.5 : 0,
                ((source.stats.DreamCritDamagePercent || 0) + affixRangeExtra(this, source, 45)) /
                  100,
              )),
      );
      amount = damage - armor;
    }
    amount = dreamIncoming(this, target, amount, defence.endsWith("Bypass") ? "None" : defence);
    if (target.kind === "player" && defence !== "None")
      amount = Math.floor(
        amount *
          (1 -
            Math.min(
              100,
              target.stats[
                defence.startsWith("AC")
                  ? "NativePhysicalAbsorbPercent"
                  : "NativeMagicAbsorbPercent"
              ] || 0,
            ) /
              100),
      );
    if (target.kind === "player" && defence !== "None")
      amount = affixIncoming(this, target, amount, defence);
    if (
      shield &&
      amount > 0 &&
      defence !== "None" &&
      !this.skill(target, "MagicShield")?.d.DreamSkill
    )
      shield.until = Math.max(this.time, shield.until - amount * 60);
    if (target.kind === "monster" && target.stats.NativeDamageReductionPercent)
      amount = Math.trunc(amount * (1 - target.stats.NativeDamageReductionPercent / 100));
    amount = absorbGemGuard(this, target, amount);
    amount = dxIncoming(this, source, target, amount, defence);
    const nativeCap = monsterCombatProfile(this, target)?.incomingDamageCap;
    if (nativeCap !== void 0 && amount > 0) amount = Math.min(amount, nativeCap);
    this.emit("DamageIndicator", {
      ObjectID: target.id,
      Type: !hit ? "Miss" : amount ? (heavy ? "HeavyStrike" : "Hit") : "Blocked",
      SourceID: source.id,
      Damage: -amount,
    });
    if (source !== target) {
      noteCompanionCombat(source, this.time);
      noteCompanionCombat(target, this.time);
    }
    if (!amount) return 0;
    monsterAffixHit(this, source, target, amount, defence);
    if (target.ai === 55 && target.master) {
      const owner = this.actor(target.master);
      if (owner) {
        owner.mp = Math.max(0, owner.mp - amount);
        target.target = source.id;
        this.emit("ObjectStruck", { ObjectID: target.id });
        if (!owner.mp) this.die(target, source);
        return amount;
      }
    }
    if (target.stats.EnergyShieldPercent && this.rng.next(100) < target.stats.EnergyShieldPercent)
      target.hp = Math.min(target.maxHP, target.hp + (target.stats.EnergyShieldHPGain || 0));
    if (target.kind === "player" && target.mp > 0 && this.special(target, "Protection"))
      target.mp = Math.max(0, target.mp - amount);
    else target.hp = Math.max(0, target.hp - amount);
    if (target.kind === "player") target.attackModes.channel = false;
    if (spell === "EvilCentipede" && !monsterCombatProfile(this, source) && target.hp > 0) {
      for (const [type, chance, duration] of [
        ["Green", 5, 3e4],
        ["Paralysis", 15, 1e4],
      ]) {
        const value = attackPower(source.stats, "SC", this.rng);
        if (
          this.rng.next(this.rules.constants.PoisonResistWeight) >=
            (target.stats.PoisonResist || 0) &&
          this.rng.next(chance) === 0
        ) {
          this.buff(target, type, duration, value, {}, source.id);
          const b = target.buffs.find((b2) => b2.type === type);
          if (b) {
            b.interval = 2e3;
            b.next = this.time + 2e3;
          }
        }
      }
    }
    if (
      spell === "CaveMaggot" &&
      target.hp > 0 &&
      this.rng.next(this.rules.constants.PoisonResistWeight) >= (target.stats.PoisonResist || 0) &&
      this.rng.next(20) === 0
    )
      this.buff(target, "Paralysis", 5e3, attackPower(source.stats, "SC", this.rng), {}, source.id);
    const hpBeforeLifeSteal = source.hp;
    if (source.kind === "player" && target.kind === "monster" && defence.startsWith("AC")) {
      const r = source,
        level = this.monsters.get(target.definition).Level,
        offset = level > r.level ? 0 : Math.min(10, r.level - level);
      if (this.special(r, "Paralize") && this.rng.next(15, 1) === 1)
        this.buff(target, "Paralysis", 5e3, 0, {}, r.id);
      if (
        source.stats.Freezing > 0 &&
        this.rng.next(this.rules.constants.FreezingAttackWeight) < source.stats.Freezing &&
        this.rng.next(offset) === 0
      )
        this.buff(
          target,
          "Slow",
          Math.min(10, 3 + this.rng.next(source.stats.Freezing)) * 1e3,
          0,
          {},
          r.id,
        );
      if (
        source.stats.PoisonAttack > 0 &&
        this.rng.next(this.rules.constants.PoisonAttackWeight) < source.stats.PoisonAttack &&
        this.rng.next(offset) === 0
      )
        this.buff(
          target,
          "Green",
          5e3,
          Math.min(10, 3 + this.rng.next(source.stats.PoisonAttack)),
          {},
          r.id,
        );
      if (!this.rules.adaptations.dreamRuntime && source.stats.HPDrainRatePercent > 0) {
        r.special ??= {};
        r.special.hpDrain =
          Number(r.special.hpDrain || 0) +
          Math.fround(Math.fround(amount / 100) * source.stats.HPDrainRatePercent);
        if (Number(r.special.hpDrain) > 2) {
          const heal = Math.floor(Number(r.special.hpDrain));
          r.hp = Math.min(r.maxHP, r.hp + heal);
          r.special.hpDrain = Number(r.special.hpDrain) - heal;
        }
      }
    }
    if (defence !== "None" && !deathEffect)
      dreamBossAfterHit(this, source, target, Math.min(amount, hpBefore), spell);
    affixAfterHit(this, source, target, Math.min(amount, hpBefore), defence, spell);
    if (!deathEffect) dxAfterHit(this, source, target, Math.min(amount, hpBefore), defence);
    if (!deathEffect) {
      nativeLifeSteal(this, source, target, Math.min(amount, hpBefore), defence);
      affixManaOnHit(this, source, target, Math.min(amount, hpBefore), defence);
    }
    gemLifeSteal(source, target, Math.min(amount, Math.max(0, hpBefore)), defence);
    if (source.kind === "player" && source.hp > hpBeforeLifeSteal)
      this.emit("DamageIndicator", {
        ObjectID: source.id,
        Type: "Heal",
        Damage: source.hp - hpBeforeLifeSteal,
      });
    if (!periodicDamage && !petAggro(this, source, target)) target.target = source.id;
    if (
      !target.stats.NoFlinchPercent ||
      this.rng.next(100) >= Math.min(100, target.stats.NoFlinchPercent)
    ) {
      this.emit("ObjectStruck", { ObjectID: target.id });
      if (target.kind === "player") {
        target.actionAt = Math.max(target.actionAt, this.time + 200);
        target.moveAt = Math.max(target.moveAt, this.time + 200);
        target.attackAt = Math.max(target.attackAt, this.time + 200);
      }
    }
    if (target.kind === "player" && defence !== "None")
      for (let slot = 1; slot < target.equipment.length; slot++) this.wearItem(target, slot, 1);
    if (spell === "Vampirism" && source.kind === "player") {
      const level = this.skill(source, spell)?.s.Level || 0;
      this.schedule("vamp", 1e3, source, source, Math.trunc(amount * (level + 1) * 0.25));
    }
    target.buffs = target.buffs.filter((b) => b.type !== "LRParalysis" && b.type !== "Trap");
    (target.special ??= {}).lastReceivedDamage = amount;
    if (!target.hp && !(target.kind === "monster" && reviveNativeBoss(this, target)))
      this.die(target, source);
    else if (target.kind === "player") counterAttack(this, target, source);
    dreamAfterHit(this, source, target, amount, defence, raw, spell);
    adventureHit(this, source, target, amount, spell);
    return amount;
  }
  die(a, killer) {
    if (a.kind === "player" && a.trialRun) {
      leaveTrial(this, a, message("trial.failed"));
      return;
    }
    if (a.dead) return;
    if (a.kind === "player") {
      delete a.mountUid;
      const r = a;
      r.special ??= {};
      if (this.time > Number(r.special.revivalAt || 0)) {
        const ring = [r.equipment[7], r.equipment[8]].find(
          (i) => i && i.currentDura >= 1e3 && this.defs.get(i.id).Unique.includes("Revival"),
        );
        if (ring) {
          r.special.revivalAt = this.time + 3e5;
          r.hp = r.maxHP;
          this.refresh(r);
          this.say(message("core.game.die.de43815918"));
          return;
        }
      }
      for (const m of Object.values(this.maps))
        for (const pet of m.actors)
          if (pet.friendly && pet.master === r.id && !pet.dead) this.die(pet, killer);
      if (!this.safe(r)) this.deathDrop(r);
    }
    if (isSpirit(this, a) && a.master) {
      const owner2 = this.roles.find((r) => r.id === a.master);
      if (owner2) {
        owner2.spiritProgress = { level: 0, xp: 0, curveVersion: 4 };
        this.say(message("skill.spirit.died"));
      }
    }
    a.dead = true;
    a.hp = 0;
    a.target = 0;
    a.expires = this.time + 1e4;
    if (a.ai === 25 && a.special) {
      a.special.reviveAt = this.time + (4 + this.rng.next(20)) * 1e3;
      if (Number(a.special.revivals) < Number(a.special.lives))
        a.expires = Number(a.special.reviveAt) + 1e3;
    }
    const dxPoisoned = a.buffs.some((b) => b.type === "Green" && b.until >= this.time);
    a.buffs = [];
    this.emit("ObjectDied", { ObjectID: a.id });
    if (a.kind === "monster") nativeDeathBurst(this, a);
    if (a.kind === "player") {
      this.say(message("core.game.die.016e77d339"));
      return;
    }
    const d = this.monsters.get(a.definition);
    if (!d || a.friendly || a.special?.bossMinion) return;
    recordBossDeath(this, a);
    const owner = killer.kind === "player" ? killer : killer.friendly ? this.me : void 0;
    if (owner && !owner.dead && owner.map === a.map) markNightmareKill(this, owner, a, d);
    if (owner) maybeSealPoCompletion(this, owner);
    if (
      a.spawn !== void 0 &&
      !this.region(a.map).spawns[a.spawn].native &&
      this.region(a.map).spawns[a.spawn].respawnPhaseSeconds === void 0
    )
      this.map(a.map).respawns[a.spawn] =
        this.time + this.region(a.map).spawns[a.spawn].respawnMinutes * 6e4;
    if (owner && !owner.dead && owner.map === a.map) {
      this.emit("MonsterKilled", { ObjectID: owner.id, MonsterIndex: d.Index });
      const monsterXP = Number(a.special?.trialXP ?? d.Experience);
      gainWeaponGrowth(this, owner, monsterXP);
      if (killer.kind === "player" || killer.master === owner.id)
        shareCompanionExperience(this, owner, a, monsterXP);
      affixKill(this, owner);
      dxOnKill(this, owner, a, dxPoisoned);
      adventureKill(this, a, owner);
      mainlineKill(this, a, owner);
      const loot = this.rules.adaptations.earlyLoot;
      const hp = Math.min(
        Math.max(0, owner.maxHP - owner.hp),
        Math.max(0, Math.min(loot.killHPCap, owner.stats.KillHP || 0)),
      );
      const mp = Math.min(
        Math.max(0, owner.maxMP - owner.mp),
        Math.max(0, Math.min(loot.killMPCap, owner.stats.KillMP || 0)),
      );
      owner.hp += hp;
      owner.mp += mp;
      if (hp || mp) this.say(message("core.game.die.6915136761", { p0: hp, p1: mp }));
      if (
        !this.rules.adaptations.dreamRuntime &&
        d.Name === "Scarecrow" &&
        !owner.firstScarecrowReward
      ) {
        const def = this.rules.items.find((i) => i.Name === loot.firstScarecrowWeapon);
        const item = this.newItem(def.Index);
        item.added[{ Warrior: "MaxDC", Wizard: "MaxMC", Taoist: "MaxSC" }[owner.job]] = 1;
        this.ground(a, item);
        owner.firstScarecrowReward = true;
        this.say(message("core.game.die.3f0d3da9b1"));
      }
    }
    if (owner) {
      this.gainXP(
        owner,
        Math.trunc(
          (Number(a.special?.trialXP ?? d.Experience) *
            (1 + Number(a.special?.expAdd || 0) / 100) *
            (1 +
              ((owner.stats.NativeKillXPPercent || 0) + affixRangeExtra(this, owner, 63)) / 100) *
            (100 - 25 * Number(a.special?.revivals || 0))) /
            100,
        ) *
          (this.rules.multipliers.monsterExperienceMultiplier +
            dreamFireworkBonus(this.rules.adaptations.dreamRuntime).experienceBonusPercent / 100),
        owner.stats.KillXP || 0,
        a,
      );
      for (const q of owner.quests) {
        const def = this.rules.quests.find((v) => v.Index === q.id);
        if (!def?.taskMaps?.length || def.taskMaps.includes(a.map))
          q.kills[d.Index] = (q.kills[d.Index] || 0) + 1;
      }
    }
    if (owner) lateMonsterDrop(this, owner, a, d);
    if (a.special?.trialFloor && owner) {
      trialKill(this, owner);
      if (!a.special.trialBoss) return;
    }
    const bossBudget = hasBossLootBudget(d, this.rules),
      candidates = [];
    const table = monsterDropTable(this.rules, d, a);
    let bossGold = 0,
      bossGoldRows = 0;
    const native = this.rules.adaptations.dreamRuntime;
    const bonus =
      (Math.max(0, owner?.stats.ItemDropRatePercent || 0) +
        dreamFireworkBonus(this.rules.adaptations.dreamRuntime).dropBonusPercent) /
      100;
    const rounds = this.rules.adaptations.dreamRuntime
      ? 1
      : 1 + Math.floor(bonus) + (bonus % 1 > 0 && this.rng.next(1e4) < (bonus % 1) * 1e4 ? 1 : 0);
    for (let round = 0; round < rounds; round++)
      for (const drop of table) {
        if (
          drop.item !== null &&
          this.defs.get(drop.item)?.BossRelic &&
          (a.special?.trialBoss || a.special?.trialFloor)
        )
          continue;
        const dropMultiple =
          drop.dropMultiplierMode === "fixed"
            ? 1
            : native
              ? drop.dropMultiplierMode === "casual-only"
                ? native.casual?.enabled
                  ? native.casual.baseDropMultiplier + native.casual.dropAdd
                  : 1
                : dreamItemDropMultiplier(
                    native,
                    (owner?.stats.ItemDropRatePercent || 0) + Number(a.special?.dropAdd || 0),
                  )
              : 1;
        let entry = native
          ? drop.chancePercent !== void 0
            ? { ...drop, chancePercent: Math.min(100, drop.chancePercent * dropMultiple) }
            : { ...drop, chance: dreamDropDenominator(drop.chance, dropMultiple) }
          : drop;
        if (native && drop.chanceBonusPercent)
          entry = {
            ...entry,
            chancePercent:
              Math.round(
                Math.min(
                  100,
                  (entry.chancePercent ?? 100 / entry.chance) + drop.chanceBonusPercent,
                ) * 100,
              ) / 100,
          };
        if (
          owner &&
          activeTestTalisman(owner, this.rules)?.guaranteedQuestMaterials &&
          drop.item !== null &&
          this.needsQuestItem(owner, drop.item, a.map)
        )
          entry = { ...entry, chance: 1 };
        const reward = attemptDrop(entry, this.defs, this.rules, this.rng);
        if (!reward) continue;
        if (reward.gold) {
          if (bossBudget || native?.lootVolume) {
            bossGold += reward.gold;
            bossGoldRows++;
          } else this.ground(a, void 0, reward.gold);
        }
        for (const x of reward.items) {
          const def = this.defs.get(x.id);
          if (def.Type === "Quest") {
            if (round === 0 && owner && this.needsQuestItem(owner, x.id, a.map))
              this.give(owner, this.newItem(x.id));
            continue;
          }
          if (!x.quest) {
            const item = this.newItem(x.id, 1, true, d, owner, Number(a.special?.magicAdd || 0), a);
            if (bossBudget || native?.lootVolume) candidates.push(item);
            else this.ground(a, item);
          }
        }
      }
    if (native && (bossBudget || native.lootVolume))
      ensureBossEquipment(this, a, d, owner, candidates);
    if (native?.lootVolume) {
      const unrestricted = hasUnrestrictedNativeLoot(d, this.rules);
      if (unrestricted && !isChallengeChest(d, this.rules)) {
        for (const id of dreamBossPotionSupplement(
          candidates,
          table,
          this.defs,
          this.rng,
          bossGoldRows,
        ))
          candidates.push(this.newItem(id, 1, true, d, owner));
      }
      const selected = selectNativeLoot(
        candidates,
        this.defs,
        this.rng,
        native.lootVolume,
        unrestricted,
        bossGold,
        (id) => (owner ? this.questItemDeficit(owner, id, a.map) : 0),
      );
      for (const item of selected.items) this.ground(a, item);
      if (selected.gold) this.ground(a, void 0, Math.min(4294967295, selected.gold));
      this.dropBossGold(a, d, owner);
      this.dropBossAccessories(a, d, owner);
      dxRuneDrop(this, a, d, owner);
      return;
    }
    if (bossBudget) {
      if (this.rules.adaptations.dreamRuntime) {
        for (const id of dreamBossPotionSupplement(
          candidates,
          table,
          this.defs,
          this.rng,
          bossGoldRows,
        ))
          candidates.push(this.newItem(id, 1, true, d, owner));
      }
      const selected = this.rules.adaptations.dreamRuntime
        ? candidates
        : selectBossLoot(candidates, this.defs, this.rules, this.rng);
      for (const item of selected) this.ground(a, item);
      if (bossGold) this.ground(a, void 0, Math.min(4294967295, bossGold));
    }
    this.dropBossGold(a, d, owner);
    this.dropBossAccessories(a, d, owner);
    dxRuneDrop(this, a, d, owner);
  }
  dropBossAccessories(a, d, owner) {
    const c = this.rules.adaptations.bossAccessories;
    if (
      !c ||
      !owner ||
      a.friendly ||
      a.special?.bossMinion ||
      a.special?.trialBoss ||
      a.special?.trialFloor ||
      a.special?.trialXP ||
      !c.bossIds.includes(d.Index)
    )
      return;
    const tier = c.tiers.find((t) => d.Level <= t.maxBossLevel);
    if (!tier) return;
    for (const id of tier.items)
      if (this.rng.next(1e4) < c.chancePercent * 100)
        this.ground(a, this.newItem(id, 1, true, d, owner, Number(a.special?.magicAdd || 0)));
  }
  dropBossGold(a, d, owner) {
    const c = this.rules.adaptations.bossGold;
    if (
      c &&
      owner &&
      !a.friendly &&
      !a.special?.bossMinion &&
      !a.special?.trialXP &&
      c.entries[String(d.Index)]?.includes(a.map) &&
      this.rng.next(1e4) < c.chancePercent * 100
    )
      this.ground(a, this.newItem(c.item));
  }
  dropPosition(a) {
    const geometry = this.geometry.get(a.map);
    if (!geometry) return { x: a.x, y: a.y };
    const occupied = new Set(
      this.map(a.map)
        .actors.filter((b) => b.kind === "item" && b.id !== a.id)
        .map((b) => `${b.x},${b.y}`),
    );
    const queue = [{ x: a.x, y: a.y }],
      visited = /* @__PURE__ */ new Set([`${a.x},${a.y}`]);
    for (let i = 0; i < queue.length; i++) {
      const p = queue[i];
      if (!occupied.has(`${p.x},${p.y}`) && this.walkable(a.map, p.x, p.y, a.id)) return p;
      for (const [dx, dy] of vectors) {
        const x = p.x + dx,
          y = p.y + dy,
          key = `${x},${y}`;
        if (
          distance(a, { x, y }) > 8 ||
          visited.has(key) ||
          x < 0 ||
          y < 0 ||
          x >= geometry.width ||
          y >= geometry.height ||
          geometry.solid[y * geometry.width + x]
        )
          continue;
        visited.add(key);
        queue.push({ x, y });
      }
    }
    return { x: a.x, y: a.y };
  }
  ground(a, item, gold = 0) {
    const position = this.dropPosition(a);
    this.map(a.map).actors.push({
      id: this.nextId++,
      kind: "item",
      name: item ? this.defs.get(item.id).Name : "Gold",
      map: a.map,
      x: position.x,
      y: position.y,
      dir: 0,
      hp: 0,
      maxHP: 0,
      dead: false,
      stats: {},
      buffs: [],
      actionAt: 0,
      attackAt: 0,
      moveAt: 0,
      target: 0,
      item,
      gold,
      expires: this.time + 18e4,
    });
  }
  deathDrop(r) {
    const candidates = r.inventory.flatMap((item2, index2) => {
      if (!item2) return [];
      const def = this.defs.get(item2.id);
      return def.Type === "Quest" || def.Bind.toLowerCase().includes("dontdeathdrop")
        ? []
        : [index2];
    });
    if (
      !candidates.length ||
      this.rng.next(100) >= this.rules.adaptations.deathPenalty.inventoryDropPercent
    )
      return;
    const index = candidates[this.rng.next(candidates.length)],
      item = r.inventory[index];
    const dropped = {
      ...structuredClone(item),
      uid: item.count === 1 ? item.uid : this.nextId++,
      count: 1,
    };
    if (--item.count === 0) r.inventory[index] = null;
    this.ground(r, dropped);
  }
  questItemDeficit(r, id, map2 = r.map) {
    const late = lateItemDeficit(this, r, id, map2);
    if (late) return late;
    if (id >= 9511 && id <= 9515 && r.quests.some((q) => q.id === 220) && this.count(r, 9516) === 0)
      return Math.max(0, 1 - this.count(r, id));
    return Math.max(
      0,
      ...r.quests.map((q) => {
        const def = this.rules.quests.find((d) => d.Index === q.id);
        if (def.taskMaps?.length && !def.taskMaps.includes(map2)) return 0;
        return Math.max(
          0,
          ...def.ItemTasks.filter((t) => t.item === id).map((t) => t.count - this.count(r, id)),
        );
      }),
    );
  }
  needsQuestItem(r, id, map2 = r.map) {
    return this.questItemDeficit(r, id, map2) > 0;
  }
  move(a, dir, steps = 1) {
    if (
      dir < 0 ||
      dir > 7 ||
      (a.kind === "monster" &&
        (!targetableMonster(a) ||
          isChallengeChest(this.monsters.get(a.definition), this.rules) ||
          (monsterCombatProfile(this, a)?.stationary ?? a.ai === 14))) ||
      this.time < a.actionAt ||
      a.buffs.some((b) =>
        ["Paralysis", "LRParalysis", "Trap", "Frozen", "Shock", "Stun"].includes(b.type),
      )
    )
      return false;
    const [dx, dy] = vectors[dir];
    if (
      a.ai === 15 &&
      this.map(a.map).actors.some(
        (m) => m.spell === "FireWall" && m.x === a.x + dx && m.y === a.y + dy,
      )
    )
      return false;
    for (let n = 1; n <= steps; n++)
      if (!this.walkable(a.map, a.x + dx * n, a.y + dy * n, a.id)) return false;
    a.dir = dir;
    a.x += dx * steps;
    a.y += dy * steps;
    const slowFactor = a.buffs.some((b) => b.type === "Slow" && b.until > this.time) ? 2 : 1;
    a.actionAt =
      this.time +
      (a.kind === "player"
        ? slowFactor *
          Math.max(
            200,
            Math.floor(600 / (1 + ((a.stats.NativeMoveSpeed || 0) + mountSpeed(this, a)) / 10)),
          )
        : monsterActionCost(this, a, false));
    if (a.kind === "player") {
      a.special ??= {};
      a.special.assistMoveUntil = this.time + 750;
    }
    a.moveAt = a.kind === "player" ? a.actionAt : a.actionAt + monsterMoveSpeed(this, a);
    if (a.kind === "monster") a.attackAt = Math.max(a.attackAt, a.moveAt);
    if (a.kind === "player") this.enterStandingPortal(a);
    return true;
  }
  requestInstanceExit(r, via) {
    this.pendingInstanceExit.set(r, { map: r.map, x: r.x, y: r.y, via });
    this.emit("InstanceExitConfirm", {});
  }
  resolveInstanceExit(r, confirmed) {
    const pending = this.pendingInstanceExit.get(r);
    this.pendingInstanceExit.delete(r);
    if (!confirmed || !pending || pending.map !== r.map || pending.x !== r.x || pending.y !== r.y)
      return;
    if (pending.via === "portal") this.enterStandingPortal(r, true);
    else if (r.challengeRun?.map === r.map) leaveChallenge(this, r);
  }
  enterStandingPortal(a, confirmed = false) {
    this.npc = 0;
    this.pendingInstanceExit.delete(a);
    const portal = activePortals(this, a.map).find((p) => p.at[0] === a.x && p.at[1] === a.y);
    if (portal) {
      if (!confirmed && this.region(a.map).instance && portal.to !== a.map) {
        this.requestInstanceExit(a, "portal");
        return;
      }
      if (portal.requiresQuest && !a.completedQuests.includes(portal.requiresQuest)) {
        this.say(message("core.game.enterStandingPortal.e1c67e0e28"));
        return;
      }
      if (portal.requiresItem) {
        if (this.count(a, portal.requiresItem) < 1) {
          this.say(message("core.game.enterStandingPortal.1f8f9c2a17"));
          return;
        }
        this.consume(a, portal.requiresItem, 1);
      }
      a.target = 0;
      const corpse = this.rules.adaptations.mainline?.corpsePalace;
      if (corpse && a.map === corpse.sourceMap && portal.to === corpse.targetMap)
        this.map(portal.to).portals = [
          { to: a.map, name: message("map.portal.returnMine"), at: [21, 16], landing: [a.x, a.y] },
        ];
      a.map = portal.to;
      a.x = portal.landing[0];
      a.y = portal.landing[1];
      if (a.challengeRun && a.challengeRun.map !== a.map) challengeTick(this, a);
      this.emit("MapChanged", { MapIndex: a.map });
    }
  }
  forceAttack(r, dir, spell = "None") {
    if (
      !Number.isInteger(dir) ||
      dir < 0 ||
      dir >= 8 ||
      r.dead ||
      this.time < Math.max(r.actionAt, r.attackAt)
    )
      return;
    if (mountedItem(this, r)) throw new LocalizedError(message("core.game.forceAttack.8b65c85a07"));
    const [dx, dy] = vectors[dir],
      aim = { x: r.x + dx, y: r.y + dy };
    const target = this.map(r.map).actors.find(
      (a) =>
        a.kind === "monster" &&
        !a.dead &&
        !a.friendly &&
        targetableMonster(a) &&
        a.x === aim.x &&
        a.y === aim.y,
    );
    if (attackDream(this, r, target, spell, aim)) return;
    if (target) {
      this.attack(r, target, spell);
      return;
    }
    r.dir = dir;
    r.attackAt = this.time + attackDelay(r.level, r.stats);
    r.actionAt = this.time + Math.min(550, r.attackAt - this.time);
    this.emit("ObjectAttack", { ObjectID: r.id, Direction: dirs[dir], Spell: "None" });
  }
  attack(r, target, spell = "None") {
    if (mountedItem(this, r)) throw new LocalizedError(message("core.game.attack.8b65c85a07"));
    if (
      r.dead ||
      target.dead ||
      r.map !== target.map ||
      target.kind !== "monster" ||
      !targetableMonster(target) ||
      target.friendly ||
      distance(r, target) > 1 ||
      this.time < Math.max(r.actionAt, r.attackAt)
    )
      return;
    r.dir = direction(r, target);
    if (attackDream(this, r, target, spell)) return;
    const selected = this.skill(r, spell);
    if (spell !== "None" && !selected) spell = "None";
    const interval = attackDelay(r.level, r.stats, !!this.rules.adaptations.dreamRuntime);
    r.attackAt = this.time + interval;
    r.actionAt = this.time + Math.min(550, interval);
    r.regenAt = this.time + 1e4;
    this.emit("ObjectAttack", {
      ObjectID: r.id,
      Direction: dirs[r.dir],
      Spell: spell,
    });
    let damage = nativeAbility(this, r, "DC"),
      defence = "ACAgility";
    if (selected) {
      const key = spell[0].toLowerCase() + spell.slice(1);
      if (["FlamingSword", "TwinDrakeBlade", "Slaying"].includes(spell) && !r.attackModes[key])
        spell = "None";
      if (["HalfMoon", "CrossHalfMoon"].includes(spell)) {
        const cost = skillCost(selected.d, selected.level, r.stats);
        if (r.mp < cost) spell = "None";
        else r.mp -= cost;
      }
      if (["FlamingSword", "TwinDrakeBlade", "Slaying"].includes(spell)) {
        damage = magicDamage(selected.d, selected.s.Level, damage, this.rng);
        r.attackModes[key] = false;
        if (spell === "FlamingSword") defence = "AC";
      }
      if (spell !== "None") this.levelSkill(r, selected.s);
    }
    this.schedule("hit", 300, r, target, damage, defence, spell);
    if (spell === "TwinDrakeBlade" && selected) {
      const e = this.schedule("hit", 400, r, target, damage, "Agility", spell);
      e.effect = {
        type: "TwinDrakeStun",
        duration: (selected.s.Level + 2) * 1e3,
        value: selected.s.Level,
        stats: {},
      };
    }
    const slaying = this.skill(r, "Slaying");
    if (slaying && !r.attackModes.slaying && this.rng.next(12) <= slaying.s.Level) {
      r.attackModes.slaying = true;
      this.emit("SpellToggle", {
        ObjectID: r.id,
        Spell: "Slaying",
        CanUse: true,
      });
    }
    if (["HalfMoon", "CrossHalfMoon", "Thrusting"].includes(spell))
      for (const a of this.map(r.map).actors) {
        if (a === target || a.kind !== "monster" || a.dead || a.friendly) continue;
        const front = direction(r, a),
          delta = (front - r.dir + 8) % 8;
        if (
          spell === "Thrusting"
            ? front === r.dir && distance(r, a) === 2
            : distance(r, a) === 1 && (spell === "CrossHalfMoon" || delta <= 2 || delta >= 6)
        )
          this.schedule("hit", 300, r, a, damage, "AC", spell);
      }
  }
  tick(ms = 20) {
    const r = this.me;
    if (!r || !this.geometry.has(r.map)) return;
    this.time += ms;
    if (this.time >= this.replenishAt) {
      this.respawn(r.map);
      this.replenishAt = this.time + 1e3;
    }
    while (this.events.length && this.events[0].at <= this.time) {
      const e = this.events.shift(),
        a = this.actor(e.source),
        b = this.actor(e.target);
      if (!a || !b || a.map !== e.map || b.map !== e.map) continue;
      if (e.kind === "magic" && !a.dead && !b.dead) completeMagic(this, a, b, e);
      else if (e.kind === "kill" && !a.dead && !b.dead) {
        this.die(b, a);
        if (e.trainSpell && a.kind === "player") {
          const skill = this.skill(a, e.trainSpell)?.s;
          if (skill) this.levelSkill(a, skill);
        }
      } else if (e.kind === "vamp" && !b.dead) {
        const before = b.hp;
        b.hp = Math.min(b.maxHP, b.hp + e.damage);
        if (b.kind === "player" && b.hp > before)
          this.emit("DamageIndicator", { ObjectID: b.id, Type: "Heal", Damage: b.hp - before });
      } else if (e.kind === "deathHit") {
        if (a.dead && nativeDeathSource(this, a, e.spell))
          this.damage(a, b, e.damage, e.defence, e.spell, true);
      } else if (e.kind === "hit") {
        if (
          e.location &&
          distance(b, e.location) >
            (["IceFlame", "IceStorm", "FireBang"].includes(e.spell || "") ? 1 : 2)
        )
          continue;
        const dealt = this.damage(a, b, e.damage, e.defence, e.spell);
        resolveNativeBossHit(this, a, b, dealt, e.spell);
        resolveNativeFieldHit(this, a, b, dealt, e);
        if (dealt && !b.dead && e.effect?.type === "NativeWhirlwindStun")
          this.buff(b, "Stun", e.effect.duration, 0, {}, a.id, e.spell);
        if (dealt && a.kind === "player") {
          if (e.trainSpell) {
            const skill = this.skill(a, e.trainSpell)?.s;
            if (skill) this.levelSkill(a, skill);
          }
          if (
            [
              "None",
              "Slaying",
              "Thrusting",
              "HalfMoon",
              "CrossHalfMoon",
              "FlamingSword",
              "TwinDrakeBlade",
              "CounterAttack",
            ].includes(e.spell || "")
          )
            for (const skill of a.skills.filter(
              (s) => s.Spell === "Fencing" || s.Spell === "SpiritSword",
            ))
              this.levelSkill(a, skill);
          if (
            !b.dead &&
            e.effect?.type === "TwinDrakeStun" &&
            this.monsters.get(b.definition).Level < a.level + 10 &&
            this.rng.next(this.rules.constants.PoisonAttackWeight) >= (b.stats.PoisonResist || 0) &&
            this.rng.next(20) <= e.effect.value + 1
          )
            this.buff(b, "Stun", e.effect.duration);
        }
        if (dealt && ["FrostCrunch", "IceFlame"].includes(e.spell || "") && !b.dead)
          completeMagic(this, a, b, { ...e, trainSpell: void 0 });
      } else if (e.kind === "buff" && !b.dead && e.effect) {
        const v = e.effect;
        if (v.type === "MagicShield" && b.buffs.some((b2) => b2.type === "MagicShield")) continue;
        const buff = this.buff(b, v.type, v.duration, v.value, v.stats, a.id, e.spell);
        if (!buff) continue;
        if (v.type !== "Green" || (buff.interval || 1e3) !== (v.interval || 1e3))
          buff.next = this.time + (v.interval || 1e3);
        buff.interval = v.interval;
        if (e.trainSpell && a.kind === "player") {
          const skill = this.skill(a, e.trainSpell)?.s;
          if (skill) this.levelSkill(a, skill);
        }
      } else if (e.kind === "heal" && !b.dead && b.hp < b.maxHP) {
        if (e.trainSpell && a.kind === "player") {
          const skill = this.skill(a, e.trainSpell)?.s;
          if (skill) this.levelSkill(a, skill);
        }
        const healed = gemHealingBonus(
          a,
          e.spell === "Healing" && a.stats.AdventureTaoist ? Math.floor(e.damage * 1.2) : e.damage,
          e.spell,
        );
        if (a.kind === "player" && this.skill(a, e.spell || "")?.d.DreamSkill)
          queueNativeHealing(this, b, healed);
        else if (b.kind === "player") b.healHP += healed;
        else b.hp = Math.min(b.maxHP, b.hp + healed);
      }
    }
    for (const a of [r, ...this.map(r.map).actors]) {
      recoverNative(this, a);
      recoverCompanion(this, a);
      if (a.kind === "monster" && !a.friendly && distance(a, r) > 24 && !a.buffs.length) continue;
      if (a.dead) continue;
      for (const b of a.buffs) {
        if (b.type === "DxIgnite" && dxConfig(this.rules)) {
          while (!a.dead && b.next <= this.time && b.next <= b.until) {
            b.next += b.interval || 1e3;
            const source = this.actor(b.source);
            if (source) this.damage(source, a, b.value, "None", b.spell, false, true);
          }
          continue;
        }
        if (
          b.next <= this.time &&
          (b.until > this.time || (b.nativeMonsterPoison && b.next <= b.until))
        ) {
          b.next += b.interval || 1e3;
          tickDreamBuff(this, a, b);
          if (b.type === "Slow" && a.kind === "monster") {
            a.special ??= {};
            a.special.slowTicks = Number(a.special.slowTicks || 0) + 1;
          }
          if (["Green", "PoisonCloud", "Plague", "NativeBurn"].includes(b.type)) {
            const source = this.actor(b.source);
            if (source && (!b.nativeMonsterPoison || a.hp > b.value))
              this.damage(
                source,
                a,
                b.value,
                "None",
                b.spell,
                b.spell === "NativeDeathPoison",
                true,
              );
          }
        }
      }
      const before = a.buffs.length;
      a.buffs = a.buffs.filter((b) => b.until > this.time);
      if (a.special && !a.buffs.some((b) => b.type === "Slow")) a.special.slowTicks = 0;
      if (before !== a.buffs.length) this.refreshActor(a);
    }
    if (!r.dead) this.regen(r);
    const flame = r.skills.find((s) => s.Spell === "FlamingSword");
    if (flame && Number(r.special?.["readyUntil:FlamingSword"] ?? flame.CastTime) < this.time)
      r.attackModes.flamingSword = false;
    if (Number(r.special?.["readyUntil:BlazingSword"] ?? Infinity) < this.time)
      r.attackModes.blazingSword = false;
    assistTick(this, r);
    const counter = r.skills.find((s) => s.Spell === "CounterAttack");
    if (counter && counter.CastTime <= this.time) r.attackModes.counterAttack = false;
    for (const a of [...this.map(r.map).actors])
      if (a.kind === "monster") {
        if (!a.friendly && distance(a, r) > 24 && !a.buffs.length) continue;
        if (a.special?.nightmareOwner) tickNightmareFinal(this, a, r);
        if (this.recallDistantPet(a, r)) continue;
        const target = this.actor(a.target);
        if (!a.friendly && target && !this.monsterCanSee(a, target)) a.target = 0;
        if (prepareMonster(this, a, r) && !adventureMonsterTick(this, a, r)) this.ai(a, r);
      } else if (a.kind === "spell") processField(this, a);
    this.map(r.map).actors = this.map(r.map).actors.filter(
      (a) => !a.expires || a.expires > this.time,
    );
    this.autoLootNearby(r);
    challengeTick(this, r);
    trialTick(this, r);
    treasureTick(this, r);
  }
  regen(r) {
    recoverTestTalisman(r, this.rules, this.time);
    if (this.time >= r.regenAt) {
      r.regenAt = this.time + 1e4;
      if (!r.buffs.some((b) => b.nativeMonsterPoison && b.until >= this.time))
        r.hp = Math.min(
          r.maxHP,
          r.hp +
            Math.floor(
              (Math.trunc(r.maxHP * 0.03) + 1) * (1 + (r.stats.HPRecoveryPercent || 0) / 100),
            ),
        );
      r.mp = Math.min(
        r.maxMP,
        r.mp +
          Math.floor(
            (Math.trunc(r.maxMP * 0.03) + 1) * (1 + (r.stats.MPRecoveryPercent || 0) / 100),
          ),
      );
    }
    recoverPotions(r, this.time);
    if (this.time >= r.healAt) {
      r.healAt = this.time + 600;
      const n = Math.min(r.healHP, 5 + Math.trunc(r.level / 10) + Math.trunc(r.healHP / 10));
      r.healHP -= n;
      r.hp = Math.min(r.maxHP, r.hp + n);
    }
    if (r.hp === r.maxHP) r.potHP = 0;
    if (r.mp === r.maxMP) r.potMP = 0;
  }
  petLanding(r) {
    const portals = activePortals(this, r.map);
    for (let n = 1; n <= 5; n++)
      for (let y = r.y - n; y <= r.y + n; y++)
        for (let x = r.x - n; x <= r.x + n; x++)
          if (
            distance(r, { x, y }) === n &&
            !portals.some((p) => p.at[0] === x && p.at[1] === y) &&
            this.walkable(r.map, x, y)
          )
            return { x, y };
    return null;
  }
  monsterCanSee(a, target) {
    const d = this.monsters.get(a.definition);
    return (
      !target.buffs.some((b) => b.type === "Hiding" && b.until > this.time) ||
      !!d?.IsBoss ||
      d?.DreamName === "\u6708\u9B54\u8718\u86DB"
    );
  }
  recallDistantPet(a, r) {
    if (
      !a.friendly ||
      a.dead ||
      a.master !== r.id ||
      r.dead ||
      a.map !== r.map ||
      distance(a, r) <= 10 ||
      (a.special?.tameUntil && Number(a.special.tameUntil) <= this.time)
    )
      return false;
    a.target = 0;
    const spot = this.petLanding(r);
    if (spot) {
      a.x = spot.x;
      a.y = spot.y;
    }
    return true;
  }
  focusMonster(r, id) {
    const target = this.actor(id);
    const focus =
      !r.dead &&
      target?.map === r.map &&
      target.kind === "monster" &&
      !target.dead &&
      !target.friendly &&
      targetableMonster(target)
        ? target.id
        : 0;
    if (r.target !== focus) {
      r.target = focus;
      if (r.special) delete r.special.petCommandTarget;
    }
  }
  ai(a, r) {
    const d = this.monsters.get(a.definition);
    const companion = a.friendly && a.master === r.id && !r.dead;
    if (this.recallDistantPet(a, r)) return;
    if (
      this.time < a.actionAt ||
      a.buffs.some((b) =>
        ["Paralysis", "LRParalysis", "Trap", "Frozen", "Shock", "Stun"].includes(b.type),
      )
    )
      return;
    const leash = 6;
    if (companion && distance(a, r) > leash) {
      a.target = 0;
      if (this.time >= a.moveAt) this.stepTowards(a, r);
      return;
    }
    let target = this.actor(a.target);
    if (!a.friendly && target && !this.monsterCanSee(a, target)) target = void 0;
    if (a.buffs.some((b) => b.type === "Hallucination"))
      target = this.map(a.map).actors.find(
        (m) =>
          m.id !== a.id &&
          m.kind === "monster" &&
          !m.dead &&
          targetableMonster(m) &&
          distance(a, m) <= d.ViewRange,
      );
    else if (a.friendly) {
      if (distance(a, r) > 12) {
        a.target = 0;
        if (this.time >= a.moveAt) this.stepTowards(a, r);
        return;
      }
      if (a.special?.resting) {
        a.target = 0;
        if (distance(a, r) > 2 && this.time >= a.moveAt) this.stepTowards(a, r);
        return;
      }
      const validEnemy = (enemy2) =>
        !!enemy2 &&
        enemy2.kind === "monster" &&
        enemy2.map === a.map &&
        !enemy2.friendly &&
        !enemy2.dead &&
        targetableMonster(enemy2) &&
        (!companion || distance(enemy2, r) <= leash);
      const followFocus = companion && r.job === "Taoist";
      const ordered2 =
        followFocus && r.special?.petCommandTarget
          ? this.actor(Number(r.special.petCommandTarget))
          : void 0;
      const focus = followFocus ? this.actor(r.target) : void 0;
      if (validEnemy(ordered2)) target = ordered2;
      else if (validEnemy(focus)) target = focus;
      else if (!validEnemy(target))
        target = this.map(a.map).actors.find((m) => validEnemy(m) && distance(m, a) <= 8);
    } else if (!target || target.dead || target.map !== a.map) {
      const enemies2 = [
        r,
        ...this.map(a.map).actors.filter((m) => m.friendly && m.master === r.id),
      ];
      target =
        d.AI !== 1 && (d.AI !== 2 || !!a.special?.runAway)
          ? enemies2
              .filter(
                (m) =>
                  !m.dead &&
                  m.map === a.map &&
                  !this.safe(m) &&
                  distance(a, m) <= d.ViewRange &&
                  this.monsterCanSee(a, m),
              )
              .sort((x, y) => distance(a, x) - distance(a, y))[0]
          : void 0;
    }
    if (target && (distance(a, target) > 15 || (target.kind === "player" && this.safe(target))))
      target = void 0;
    a.target = target?.id || 0;
    if (target) {
      if (rangedMovement(this, a, target)) return;
      const range = isSpirit(this, a)
        ? this.rules.adaptations.noviceProgression.spiritRange
        : (dreamBossRange(this, a) ?? monsterRange(a, target, this));
      if (distance(a, target) <= range && this.time >= a.attackAt) {
        attackMonster(this, a, target);
      } else if (
        distance(a, target) > range &&
        this.time >= a.moveAt &&
        (d.DreamRaw || d.MoveSpeed > 0)
      )
        this.stepTowards(a, target, companion ? r : void 0, leash);
    } else if (a.friendly && distance(a, r) > 2 && this.time >= a.moveAt) this.stepTowards(a, r);
    else if (!companion && this.time >= a.moveAt && (d.DreamRaw || d.MoveSpeed > 0)) {
      this.move(a, this.rng.next(8));
      a.moveAt = this.time + Math.max(1e3, d.MoveSpeed) * 3;
    }
  }
  stepTowards(a, p, owner, leash = 6) {
    const dir = direction(a, p);
    for (const off of [0, 1, -1, 2, -2]) {
      const next = (dir + off + 8) % 8;
      const [dx, dy] = vectors[next];
      if (owner && distance({ x: a.x + dx, y: a.y + dy }, owner) > leash) continue;
      if (this.move(a, next)) return;
    }
    a.moveAt = this.time + 500;
  }
  questComplete(r, q) {
    const progress = r.quests.find((t) => t.id === q.Index);
    return (
      !!progress &&
      [...q.CarryItems, ...q.ItemTasks].every((t) => this.count(r, t.item) >= t.count) &&
      (q.KillTotal !== void 0
        ? this.questKillTotal(progress.kills, q) >= q.KillTotal
        : q.KillTasks.every((t) => (progress.kills[t.monster] || 0) >= t.count))
    );
  }
  questKillTotal(kills, q) {
    return q.KillTasks.reduce((sum, t) => sum + (kills[t.monster] || 0), 0);
  }
  woomaWeapon(r, id) {
    return this.newItem(id, 1, true, void 0, r);
  }
  questRewards(q, r) {
    const book = q.ClassRewards?.[r.job];
    return [...q.FixedRewards, ...(q.ClassFixedRewards?.[r.job] || []), ...(book ? [book] : [])];
  }
  questInfo(q, role) {
    return {
      Index: q.Index,
      Name: q.Name,
      NPCIndex: q.acceptNpc,
      FinishNPCIndex: q.finishNpc,
      Description: q.Description,
      TaskDescription: q.TaskDescription,
      RewardGold: q.GoldReward,
      RewardExp: q.ExpReward,
      RewardsFixedItem: this.questRewards(q, role).map((r) => ({
        Item: this.defs.get(r.item),
        Count: r.count,
      })),
      RewardsSelectItem: q.SelectRewards.map((r) => ({
        Item: this.defs.get(r.item),
        Count: r.count,
      })),
      TasksItems: q.ItemTasks.map((t) => ({
        Item: this.defs.get(t.item),
        Count: t.count,
      })),
      TasksMonsters: q.KillTasks.map((t) => ({
        MonsterName: this.monsters.get(t.monster)?.Name,
        Count: t.count,
      })),
    };
  }
  requireNPC(r) {
    const n = this.rules.world.npcs.find((n2) => n2.id === this.npc);
    if (!n || n.map !== r.map || distance(r, { x: n.at[0], y: n.at[1] }) > 3)
      throw new LocalizedError(message("core.game.requireNPC.999365c2eb"));
    return n;
  }
  npcPage(r, n, key) {
    this.npc = n.id;
    key = key.replace(/[\[\]]/g, "").toLowerCase();
    if (
      n.role === "event" &&
      key === "@main" &&
      this.rules.adaptations.activityCodeRewardsEnabled !== true
    ) {
      this.emit("NPCResponse", {
        NPCID: n.id,
        Page: [
          message("npc.noActivityRewards"),
          ...(n.trade?.length
            ? [{ $dialogue: [{ label: message("npc.buyMounts"), action: "@BuyNew" }] }]
            : []),
          { $dialogue: [{ label: message("npc.closeActivity"), action: "@Exit" }] },
        ],
      });
      return;
    }
    if (key === "@challengeevil" || key === "@challengesettle") {
      challengeChoice(this, r, key === "@challengeevil" ? "evil" : "settle");
      return;
    }
    if (key === "@challengeclaim") {
      claimChallengeRewards(this, r);
      return;
    }
    if (key === "@late-evil-dragon" || key === "@late-po-settle") {
      challengeChoice(this, r, key === "@late-evil-dragon" ? "evil" : "settle");
      return;
    }
    if (key.startsWith("@late-")) {
      lateAction(this, r, key);
      return;
    }
    if (n.role === "trial" && key === "@main") {
      this.emit("NPCResponse", { NPCID: n.id, Page: trialPage(this, r) });
      return;
    }
    if (key.startsWith("@trial")) {
      trialAction(this, r, key);
      return;
    }
    if (key === "@claimblessing") {
      const cfg = this.rules.adaptations.blessingTalisman;
      if (!cfg || this.requireNPC(r).id !== cfg.npcId)
        throw new LocalizedError(message("core.game.npcPage.955009b251"));
      if (
        r.claimedBlessing ||
        [...r.inventory, ...r.equipment, ...r.storage].some((i) => i?.id === cfg.itemId)
      )
        throw new LocalizedError(message("core.game.npcPage.f0bea80ae3"));
      if (!this.give(r, this.newItem(cfg.itemId), false))
        throw new LocalizedError(message("core.game.npcPage.77b801a849"));
      r.claimedBlessing = true;
      this.say(message("core.game.npcPage.8ba47b0fd7"));
      this.emit("NPCResponse", { NPCID: n.id, Page: [] });
      return;
    }
    if (key === "@dxworkshop") {
      if (!dxSalvageNpc(this, this.requireNPC(r)))
        throw new LocalizedError(message("dx.salvage.npc"));
      this.emit("OpenForge", { Mode: "dxworkshop" });
      return;
    }
    if (key === "@dxsalvage") {
      if (!dxSalvageNpc(this, this.requireNPC(r)))
        throw new LocalizedError(message("dx.salvage.npc"));
      this.emit("OpenForge", { Mode: "dxsalvage" });
      return;
    }
    if (!n.sections[key]) throw new LocalizedError(message("core.game.npcPage.0d52b8413e"));
    if (waypointAction(this, r, n, key)) return;
    if (key.startsWith("@settle")) {
      const town = this.rules.adaptations.towns?.settlements.find(
        (t) => key === "@settle" + t.id && t.npcIds.includes(this.requireNPC(r).id),
      );
      if (!town) throw new LocalizedError(message("core.game.npcPage.5ddb240bc1"));
      r.homeTown = town.id;
      this.say(message("core.game.npcPage.eefbfec173", { p0: entityText("towns", town.id) }));
      this.npcPage(r, n, "@main");
      return;
    }
    if (key === "@cityintro" && !r.completedQuests.includes(238))
      throw new LocalizedError(message("core.game.npcPage.4dfbf8e123"));
    if (key === "@identify") {
      this.say(message("core.game.npcPage.66a920f6f4"));
      return;
    }
    if (key === "@craftlearn" || key === "@craftgraduate") {
      craftingLearn(this, r, key === "@craftgraduate");
      return;
    }
    if (key === "@craftopen") {
      this.emit("OpenForge", { Mode: "craft" });
      return;
    }
    if (key.startsWith("@challenge-")) {
      enterChallenge(this, r, key.slice(11));
      return;
    }
    if (key === "@challengestart") {
      startChallenge(this, r);
      return;
    }
    if (key === "@challengeleave") {
      if (r.challengeRun?.map === r.map && this.requireNPC(r).role === "challenge")
        this.requestInstanceExit(r, "npc");
      return;
    }
    if (key === "@woomaexchange") {
      if (this.requireNPC(r).id !== 9405)
        throw new LocalizedError(message("core.game.npcPage.d611f46a80"));
      const reward = this.rules.quests.find((q) => q.Index === 214)?.ClassRewards?.[r.job];
      if (!reward || this.count(r, 9507) < 10)
        throw new LocalizedError(message("core.game.npcPage.e05a846aab"));
      const backup = structuredClone({ inventory: r.inventory, questInventory: r.questInventory });
      this.consume(r, 9507, 10);
      if (!this.give(r, this.woomaWeapon(r, reward.item), false)) {
        Object.assign(r, backup);
        throw new LocalizedError(message("core.game.npcPage.f4f8709c7f"));
      }
      this.say(message("core.game.npcPage.557be3469a"));
      return;
    }
    if (key === "@claimtesttalisman") {
      if (this.rules.adaptations.activityCodeRewardsEnabled !== true)
        throw new LocalizedError(message("npc.noActivityRewards"));
      const cfg = this.rules.adaptations.testTalisman;
      if (!cfg || this.requireNPC(r).id !== cfg.npcId)
        throw new LocalizedError(message("core.game.npcPage.bbeb99649b"));
      this.emit("NPCResponse", { NPCID: n.id, Page: [message("npc.codePrompt")] });
      this.emit("NPCEvent", { NPCID: n.id, TestTalisman: true });
      return;
    }
    if (key.startsWith("@travel")) {
      const required = n.travelRequirements?.[key];
      if (required && !r.completedQuests.includes(required))
        throw new LocalizedError(
          message("core.game.npcPage.b4796772c5", { p0: entityText("quests", required) }),
        );
      const move = n.sections[key].find((s) => /^MOVE /i.test(s))?.split(/\s+/);
      const region = move && this.rules.world.maps.find((m) => m.file === move[1]);
      if (!move || !region) throw new LocalizedError(message("core.game.npcPage.3aa73f91dc"));
      const x = Number(move[2]),
        y = Number(move[3]);
      if (!Number.isInteger(x) || !Number.isInteger(y))
        throw new LocalizedError(message("core.game.npcPage.bd90287e1e"));
      r.target = 0;
      r.map = region.id;
      r.x = Number(move[2]);
      r.y = Number(move[3]);
      this.npc = 0;
      this.emit("NPCResponse", { NPCID: n.id, Page: [] });
      return;
    }
    const page = n.sections[key]
      .map((line, index) => ({ line, index }))
      .filter(({ line }) => !line.startsWith("#") && !line.toLowerCase().includes("@claimblessing"))
      .map(({ index }) => dialogueLine(n.id, key, index, r.name));
    if (
      key === "@main" &&
      this.rules.adaptations.towns?.settlements.some((t) => t.npcIds.includes(n.id))
    )
      page.splice(
        1,
        0,
        message("npc.residence", { town: entityText("towns", residence(r, this.rules).id) }),
      );
    if (key === "@main" && dxSalvageNpc(this, n))
      page.splice(Math.max(0, page.length - 1), 0, {
        $dialogue: [{ label: message("dx.workshop.title"), action: "@DxWorkshop" }],
      });
    if (key === "@main" && [3, 9001].includes(n.id) && r.completedQuests.includes(238))
      page.splice(-1, 0, {
        $dialogue: [{ label: message("npc.cityIntro"), action: "@CityIntro" }],
      });
    if (key === "@main")
      page.splice(
        Math.max(0, page.length - 1),
        0,
        ...waypointPage(this, r, n),
        ...lateNpcPage(this, r, n),
        ...(n.id === 9420 || n.role === "challenge" ? challengeRewardPage(r, n.id) : []),
      );
    if (n.id === 9420 && key === "@main") {
      const available = (this.rules.adaptations.guideChallenges || []).filter(
        (c) => this.count(r, c.ticket) > 0,
      );
      this.emit("NPCResponse", {
        NPCID: n.id,
        Page: [
          ...page,
          ...available.map((c) => ({
            $dialogue: [
              {
                label: message("npc.challenge", {
                  map: entityText("maps", c.map),
                  minutes: c.minutes,
                }),
                action: "@challenge-" + c.id,
              },
            ],
          })),
          ...(!available.length ? [message("npc.noChallengeTicket")] : []),
        ],
      });
      return;
    }
    if (!page) throw new LocalizedError(message("core.game.npcPage.0d52b8413e"));
    this.emit("NPCResponse", {
      NPCID: n.id,
      Page: page,
    });
    if (
      this.rules.adaptations.activityCodeRewardsEnabled === true &&
      !this.rules.adaptations.dreamRuntime &&
      n.id === this.rules.adaptations.starterTalisman.npcId
    )
      this.emit("NPCEvent", { NPCID: n.id, Claimed: !!r.claimedStarterTalisman });
    if (["@buynew", "@buysellnew", "@buyback", "@advanced"].includes(key)) {
      const back = this.buyback(r, n.id);
      const goods =
        key === "@advanced"
          ? n.advancedTrade || []
          : n.trade.filter((id) => !n.advancedTrade?.includes(id));
      const list = goods.map((id) => ({
        UniqueID: id,
        ItemIndex: id,
        Count: 1,
      }));
      this.emit("NPCGoods", {
        NPCID: n.id,
        Type: key === "@buyback" ? "BuyBack" : "Buy",
        List:
          key === "@buyback"
            ? back.map((i) => ({
                UniqueID: i.uid,
                ItemIndex: i.id,
                Count: i.count,
                Item: structuredClone(i),
              }))
            : list,
        UnitPrices: Object.fromEntries(
          key === "@buyback"
            ? back.map((i) => [i.uid, Math.trunc(price(i, this.defs.get(i.id)) / i.count)])
            : goods.map((id) => [id, this.defs.get(id).Price]),
        ),
      });
      if (
        ["@buysellnew", "@buynew", "@advanced"].includes(key) &&
        this.rules.adaptations.universalSaleRoles.includes(n.role)
      )
        this.emit("NPCSell", { NPCID: n.id });
    }
    if (key === "@sell") this.emit("NPCSell", { NPCID: n.id });
    if (key === "@repair") this.emit("NPCRepair", { NPCID: n.id });
    if (key === "@storage") this.emit("NPCStorage", { NPCID: n.id });
  }
  canMapTeleport(r) {
    return (
      !r.dead &&
      !this.region(r.map).noTeleport &&
      (!!activeTestTalisman(r, this.rules) ||
        [7, 8].some((slot) => {
          const item = r.equipment[slot],
            def = item && this.defs.get(item.id);
          return !!item && isTeleportRing(def) && (!item.maxDura || item.currentDura > 0);
        }))
    );
  }
  command(type, data = {}) {
    const r = this.me;
    if (!r) throw new LocalizedError(message("core.game.command.1bf8172441"));
    if (r.dead && !["TownRevive", "LogOut"].includes(type))
      throw new LocalizedError(message("core.game.command.db61d62a9c"));
    switch (type) {
      case "SetEquipmentLock":
        setEquipmentLock(this, r, data);
        break;
      case "SellEquipmentBatch":
        sellEquipmentBatch(this, r, data);
        break;
      case "DxFavorite":
        dxFavorite(this, r, data);
        break;
      case "DxTutorialClaim":
        dxTutorialClaim(this, r);
        break;
      case "DxTutorialCompare":
        dxTutorialCompare(this, r, Number(data.UniqueID));
        break;
      case "DxTutorialHide":
        dxTutorialVisibility(this, r, true);
        break;
      case "DxTutorialResume":
        dxTutorialVisibility(this, r, false);
        break;
      case "SetAssist":
        r.assist = assistSettings(data);
        break;
      case "PetControl": {
        const pets2 = Object.values(this.maps)
            .flatMap((m) => m.actors)
            .filter((a) => a.friendly && !a.dead && a.master === r.id),
          mode = String(data.Mode);
        if (mode === "dismiss") {
          if (r.special) delete r.special.petCommandTarget;
          for (const a of pets2) {
            a.dead = true;
            a.hp = 0;
            a.expires = this.time;
          }
          this.say(message("core.game.command.422dfabde1"));
          break;
        }
        if (mode === "rest") {
          if (r.special) delete r.special.petCommandTarget;
          const rest = !pets2.every((a) => a.special?.resting);
          for (const a of pets2) {
            a.special ??= {};
            a.special.resting = rest;
            a.target = 0;
          }
          this.say(
            rest
              ? message("core.game.command.83a5bd6ade")
              : message("core.game.command.34f79b63ab"),
          );
          break;
        }
        if (mode === "recall") {
          if (r.special) delete r.special.petCommandTarget;
          for (const a of pets2) {
            const at = this.petLanding(r);
            if (!at) continue;
            for (const m of Object.values(this.maps))
              m.actors = m.actors.filter((b) => b.id !== a.id);
            a.map = r.map;
            a.x = at.x;
            a.y = at.y;
            a.target = 0;
            this.map(r.map).actors.push(a);
          }
          break;
        }
        if (mode === "target") {
          const target = this.actor(Number(data.Target));
          if (
            !target ||
            target.map !== r.map ||
            target.dead ||
            target.kind !== "monster" ||
            target.friendly
          )
            throw new LocalizedError(message("core.game.command.2f0008d3a0"));
          (r.special ??= {}).petCommandTarget = target.id;
          for (const a of pets2) {
            a.special ??= {};
            a.special.resting = false;
            a.target = target.id;
          }
          break;
        }
        throw new LocalizedError(message("core.game.command.6cf95a2137"));
      }
      case "ForgeQuote": {
        try {
          this.emit("ForgeQuote", forgeQuote(this, r, data));
        } catch (error) {
          if (data.Mode !== "cube" && data.Mode !== "dxsalvage") throw error;
          this.emit("ForgeQuote", {
            cubeSelection: data.Selected,
            canForge: false,
            error: errorText(error),
          });
        }
        break;
      }
      case "Forge":
        forge(this, r, data);
        break;
      case "BindItemHotkey": {
        const key = Number(data.Key);
        if (!Number.isInteger(key) || key < 0 || key >= 6)
          throw new LocalizedError(message("core.game.command.9a1bdb63f7"));
        migrateItemHotkeys(r, this.defs);
        if (data.UniqueID === null) {
          r.itemHotkeys[key] = null;
          if (r.ringHotkeys) r.ringHotkeys[key] = null;
          break;
        }
        const item = r.inventory.find((i) => i?.uid === Number(data.UniqueID));
        if (item && isTeleportRing(this.defs.get(item.id))) {
          const slot = data.To,
            original = slot === 7 || slot === 8 ? r.equipment[slot] : null;
          if (
            !original ||
            original.uid !== data.OriginalUID ||
            this.defs.get(original.id)?.Type !== "Ring"
          )
            throw new LocalizedError(message("core.game.command.4886f3b4f0"));
          const bindings = (r.ringHotkeys ??= Array(6).fill(null));
          bindings[key] = {
            slot,
            teleport: { id: item.id, uid: item.uid },
            original: { id: original.id, uid: original.uid },
          };
          r.itemHotkeys[key] = null;
          break;
        }
        if (!item || !quickItemTypes.includes(this.defs.get(item.id).Type))
          throw new LocalizedError(message("core.game.command.de1f6c0544"));
        if (r.ringHotkeys) r.ringHotkeys[key] = null;
        r.itemHotkeys[key] = item.id;
        break;
      }
      case "UseItemHotkey": {
        const key = Number(data.Key);
        if (!Number.isInteger(key) || key < 0 || key >= 6)
          throw new LocalizedError(message("core.game.command.9a1bdb63f7"));
        migrateItemHotkeys(r, this.defs);
        const binding = r.ringHotkeys?.[key];
        if (binding) {
          const next = nextQuickRing(r, binding);
          if (!next) throw new LocalizedError(message("core.game.command.4795782b6e"));
          this.command("EquipItem", { UniqueID: next.uid, To: binding.slot });
          break;
        }
        const id = r.itemHotkeys[key];
        if (id === null) break;
        const item = r.inventory.find((i) => i?.id === id);
        if (!item) throw new LocalizedError(message("core.game.command.4795782b6e"));
        this.command("UseItem", { UniqueID: item.uid });
        break;
      }
      case "MapTeleport": {
        if (!this.canMapTeleport(r))
          throw new LocalizedError(message("core.game.command.a15e16ccd5"));
        if (Number(data.MapIndex) !== r.map)
          throw new LocalizedError(message("core.game.command.ac33b45ea0"));
        const x = Number(data.X),
          y = Number(data.Y);
        if (!Number.isInteger(x) || !Number.isInteger(y) || !this.walkable(r.map, x, y, r.id))
          throw new LocalizedError(message("core.game.command.feacada29b"));
        r.x = x;
        r.y = y;
        r.target = 0;
        r.actionAt = this.time + 600;
        this.npc = 0;
        this.emit("MapTeleport", { ObjectID: r.id });
        this.say(
          message("core.game.command.78cdb952a0", {
            p0: message(
              activeTestTalisman(r, this.rules) ? "game.teleport.talisman" : "game.teleport.ring",
            ),
            p1: x,
            p2: y,
          }),
        );
        this.enterStandingPortal(r);
        break;
      }
      case "Walk":
      case "Run":
        this.move(r, dirs.indexOf(data.Direction), type === "Run" ? 2 : 1);
        break;
      case "Turn": {
        const d = dirs.indexOf(data.Direction);
        if (d >= 0) r.dir = d;
        break;
      }
      case "ConfirmInstanceExit":
        this.resolveInstanceExit(r, data.Confirmed === true);
        break;
      case "Attack": {
        if (data.Force) {
          this.forceAttack(r, dirs.indexOf(String(data.Direction)), String(data.Spell || "None"));
          break;
        }
        const target = this.actor(Number(data.TargetID));
        if (target) this.attack(r, target, String(data.Spell || "None"));
        break;
      }
      case "Magic":
        if (mountedItem(this, r)) throw new LocalizedError(message("core.game.command.1a01d4ad93"));
        castManualMagic(this, r, data);
        break;
      case "ToggleMount":
        toggleMount(this, r);
        break;
      case "SpellToggle":
        toggleMagic(this, r, String(data.Spell), !!data.CanUse);
        break;
      case "MagicKey": {
        const skill = r.skills.find((s) => s.Spell === data.Spell);
        const key = Number(data.Key);
        if (!skill || !Number.isInteger(key) || key < 0 || key > 8)
          throw new LocalizedError(message("core.game.command.dd4c2d429a"));
        for (const s of r.skills) if (s.Key === key) s.Key = 0;
        skill.Key = key;
        break;
      }
      case "PickUp": {
        const requested = data.ObjectID;
        const a = this.map(r.map).actors.find(
          (a2) =>
            a2.kind === "item" &&
            a2.x === r.x &&
            a2.y === r.y &&
            (requested === void 0 ||
              (a2.map === r.map &&
                typeof requested === "number" &&
                Number.isSafeInteger(requested) &&
                a2.id === requested)),
        );
        if (!a) break;
        if (a.item?.id === this.rules.adaptations.adventure.chestId) {
          openTreasure(this, r, a);
          break;
        }
        if (!this.transferGroundLoot(r, a))
          throw new LocalizedError(message("core.game.command.f4f8709c7f"));
        this.map(r.map).actors = this.map(r.map).actors.filter((m) => m !== a);
        break;
      }
      case "CombineItem":
        combineItem(
          this,
          r,
          Number(data.IDFrom),
          Number(data.IDTo),
          data.Affix === void 0 ? void 0 : Number(data.Affix),
        );
        break;
      case "ExchangeScarletSword":
        exchangeScarletSword(
          this,
          r,
          Array.isArray(data.Selected) ? data.Selected.map(Number) : [],
        );
        break;
      case "UseItem":
        this.useItem(r, Number(data.UniqueID));
        break;
      case "EquipItem": {
        const index = r.inventory.findIndex((i) => i?.uid === Number(data.UniqueID)),
          item = r.inventory[index],
          to = Number(data.To);
        if (!item) throw new LocalizedError(message("core.game.command.9edbd2d8c5"));
        const d = this.defs.get(item.id);
        if (d.Type === "Mount") {
          toggleMount(this, r, item.uid);
          break;
        }
        if (!itemSlots(d)?.includes(to))
          throw new LocalizedError(message("core.game.command.4886f3b4f0"));
        this.checkUse(r, d, item);
        dxCheckRequirement(this, r, item, d);
        const old = r.equipment[to];
        r.inventory[index] = old;
        r.equipment[to] = item;
        this.refresh(r);
        dxTutorialEquipped(this, r, item);
        break;
      }
      case "RemoveItem": {
        const index = r.equipment.findIndex((i) => i?.uid === Number(data.UniqueID)),
          item = r.equipment[index],
          to = Number(data.To);
        if (
          !item ||
          !Number.isInteger(to) ||
          to < 0 ||
          to >= r.inventory.length ||
          !bagSlotAccepts(r, this.rules, this.defs.get(item.id), to) ||
          r.inventory[to]
        )
          throw new LocalizedError(message("core.game.command.3d8e6ffe43"));
        r.inventory[to] = item;
        r.equipment[index] = null;
        this.refresh(r);
        break;
      }
      case "NightmareFinalSummon":
        summonNightmareFinal(this, r);
        break;
      case "CallNPC": {
        const n = this.rules.world.npcs.find((n2) => n2.id === Number(data.ObjectID));
        if (!n || n.map !== r.map || distance(r, { x: n.at[0], y: n.at[1] }) > 3)
          throw new LocalizedError(message("core.game.command.85a81c3341"));
        this.npcPage(r, n, String(data.Key || "[@main]"));
        break;
      }
      case "RedeemEvent": {
        if (this.rules.adaptations.activityCodeRewardsEnabled !== true)
          throw new LocalizedError(message("npc.noActivityRewards"));
        if (this.rules.adaptations.dreamRuntime)
          throw new LocalizedError(message("core.game.command.f978c64d55"));
        const n = this.requireNPC(r),
          event = this.rules.adaptations.starterTalisman;
        if (n.id !== event.npcId || n.role !== "event")
          throw new LocalizedError(message("core.game.command.0548ba11e3"));
        if (r.claimedStarterTalisman)
          throw new LocalizedError(message("core.game.command.b2e4370f3d"));
        if (String(data.Code || "").trim() !== event.code)
          throw new LocalizedError(message("core.game.command.e3d32f0605"));
        if (!this.give(r, this.newItem(event.itemId)))
          throw new LocalizedError(message("core.game.command.eac92aa78b"));
        r.claimedStarterTalisman = true;
        this.say(message("core.game.command.14dece4e2a"));
        this.npcPage(r, n, "@main");
        break;
      }
      case "RedeemActivityCode":
      case "RedeemTestTalisman": {
        if (this.rules.adaptations.activityCodeRewardsEnabled !== true)
          throw new LocalizedError(message("npc.noActivityRewards"));
        const n = this.requireNPC(r),
          goldCode = this.rules.adaptations.goldBarCode,
          combat = this.rules.adaptations.combatTestTalisman;
        const code = String(data.Code || "").trim();
        const cfg = combat && code === combat.code ? combat : this.rules.adaptations.testTalisman;
        if (goldCode && String(data.Code || "").trim() === goldCode.code) {
          if (n.id !== goldCode.npcId)
            throw new LocalizedError(message("core.game.command.75dab95c94"));
          const id = this.rules.adaptations.chestItems?.gold.item;
          if (!id) throw new LocalizedError(message("core.game.command.259c9772aa"));
          if (!this.give(r, this.newItem(id, goldCode.count)))
            throw new LocalizedError(message("core.game.command.fe62d85cf1"));
          this.say(message("core.game.command.31f9bd1249", { p0: goldCode.count }));
          this.npcPage(r, n, "@main");
          break;
        }
        const combatClaim = !!combat && cfg === combat;
        if (!cfg || n.id !== cfg.npcId)
          throw new LocalizedError(
            message(combatClaim ? "game.combatTest.envoy" : "core.game.command.bbeb99649b"),
          );
        if (code !== cfg.code) throw new LocalizedError(message("core.game.command.97ded833ee"));
        if ([...r.inventory, ...r.equipment, ...r.storage].some((i) => i?.id === cfg.itemId))
          throw new LocalizedError(
            message(combatClaim ? "game.combatTest.owned" : "core.game.command.07245475b2"),
          );
        if (!this.give(r, this.newItem(cfg.itemId)))
          throw new LocalizedError(message("core.game.command.77b801a849"));
        this.say(message(combatClaim ? "game.combatTest.claimed" : "core.game.command.6a3d24d360"));
        this.npcPage(r, n, "@main");
        break;
      }
      case "BuyItem": {
        const n = this.requireNPC(r),
          id = Number(data.ItemIndex),
          count = Number(data.Count);
        if (data.Type === "BuyBack") {
          const back = this.buyback(r, n.id),
            item = back.find((i) => i.uid === id);
          if (!item || !Number.isInteger(count) || count < 1 || count > item.count)
            throw new LocalizedError(message("core.game.command.37209580c2"));
          const cost2 = Math.trunc(price(item, this.defs.get(item.id)) / item.count) * count;
          if (r.gold < cost2) throw new LocalizedError(message("core.game.command.e55f88c1eb"));
          const part = {
            ...structuredClone(item),
            uid: count === item.count ? item.uid : this.nextId++,
            count,
          };
          delete part.buybackAt;
          if (!this.give(r, part))
            throw new LocalizedError(message("core.game.command.f4f8709c7f"));
          r.gold -= cost2;
          item.count -= count;
          r.buyback[n.id] = back.filter((i) => i.count > 0);
          break;
        }
        if (!n.trade.includes(id) || !Number.isInteger(count) || count < 1 || count > 999)
          throw new LocalizedError(message("core.game.command.fe364ad24f"));
        const d = this.defs.get(id),
          cost = d.Price * count;
        if (d.Type === "Book" && d.Price === 0) {
          this.checkUse(r, d);
          if (count !== 1 || this.count(r, id) || r.skills.some((s) => s.Spell === d.Spell))
            throw new LocalizedError(message("core.game.command.042a12dcf9"));
        }
        if (r.gold < cost) throw new LocalizedError(message("core.game.command.e55f88c1eb"));
        if (!this.give(r, this.newItem(id, count)))
          throw new LocalizedError(message("core.game.command.f4f8709c7f"));
        r.gold -= cost;
        break;
      }
      case "SellItem": {
        const n = this.requireNPC(r),
          index = r.inventory.findIndex((i) => i?.uid === Number(data.UniqueID)),
          item = r.inventory[index],
          count = Number(data.Count);
        if (!item || !Number.isInteger(count) || count < 1 || count > item.count)
          throw new LocalizedError(message("core.game.command.f9947c06ce"));
        const d = this.defs.get(item.id);
        assertDxDisposable(this, item);
        if (item.locked) assertEquipmentDisposable(item);
        if (!this.rules.adaptations.universalSaleRoles.includes(n.role))
          throw new LocalizedError(message("core.game.command.5fc026e9a7"));
        if (d.Bind.includes("DontSell") || d.Type === "Quest")
          throw new LocalizedError(message("core.game.command.8d142b89d7"));
        r.gold += Math.trunc(price({ ...item, count }, d) / 2);
        r.buyback ??= {};
        r.buyback[n.id] ??= [];
        this.buyback(r, n.id);
        r.buyback[n.id].push({
          buybackAt: this.time,
          ...structuredClone(item),
          uid: count === item.count ? item.uid : this.nextId++,
          count,
        });
        if (
          this.rules.goods.BuyBackMaxStored > 0 &&
          r.buyback[n.id].length > this.rules.goods.BuyBackMaxStored
        )
          r.buyback[n.id].shift();
        item.count -= count;
        if (!item.count) r.inventory[index] = null;
        this.emit("SellItem", { Success: true });
        break;
      }
      case "RepairItem":
      case "SRepairItem": {
        const n = this.requireNPC(r);
        if (!n.sections["@repair"])
          throw new LocalizedError(message("core.game.command.32b067b943"));
        const item = r.inventory.find((i) => i?.uid === Number(data.UniqueID));
        if (!item) throw new LocalizedError(message("core.game.command.9edbd2d8c5"));
        const d = this.defs.get(item.id);
        if (!d.Durability) throw new LocalizedError(message("core.game.command.1089a89c8b"));
        const cost = Math.max(0, price({ ...item, currentDura: item.maxDura }, d) - price(item, d));
        if (
          d.Bind.includes("DontRepair") ||
          (type === "SRepairItem" && d.Bind.includes("NoSRepair"))
        )
          throw new LocalizedError(message("core.game.command.c48d16a17a"));
        if (r.gold < cost) throw new LocalizedError(message("core.game.command.e55f88c1eb"));
        r.gold -= cost;
        item.currentDura = item.maxDura;
        break;
      }
      case "StoreItem":
      case "TakeBackItem": {
        const n = this.requireNPC(r);
        if (n.role !== "storage") throw new LocalizedError(message("core.game.command.fc8754400b"));
        const shared = data.Shared === true;
        if (
          (data.Shared !== void 0 && typeof data.Shared !== "boolean") ||
          (shared && !hasSharedStorage(this.rules))
        )
          throw new LocalizedError(message("storage.sharedUnavailable"));
        const storage = shared ? this.sharedStorage : r.storage;
        const from = Number(data.From),
          to = Number(data.To),
          src = type === "StoreItem" ? r.inventory : storage,
          dst = type === "StoreItem" ? storage : r.inventory;
        if (
          !Number.isInteger(from) ||
          !Number.isInteger(to) ||
          from < 0 ||
          from >= src.length ||
          to < 0 ||
          to >= dst.length ||
          !src[from] ||
          dst[to]
        )
          throw new LocalizedError(message("core.game.command.53e7891bb9"));
        const i = src[from];
        if (shared && type === "StoreItem" && !canShareItem(i, this.defs.get(i.id), this.rules))
          throw new LocalizedError(message("storage.sharedOnly"));
        if (data.UniqueID !== void 0 && Number(data.UniqueID) !== i.uid)
          throw new LocalizedError(message("core.game.command.cda3a5c696"));
        if (type === "TakeBackItem" && !bagSlotAccepts(r, this.rules, this.defs.get(i.id), to))
          throw new LocalizedError(message("storage.bagCategoryFull"));
        dst[to] = i;
        src[from] = null;
        break;
      }
      case "SortStorage": {
        if (data.Shared !== void 0 && typeof data.Shared !== "boolean")
          throw new LocalizedError(message("storage.sharedUnavailable"));
        const n = this.requireNPC(r);
        if (n.role !== "storage") throw new LocalizedError(message("core.game.command.fc8754400b"));
        if (data.Shared === true) {
          if (!hasSharedStorage(this.rules))
            throw new LocalizedError(message("storage.sharedUnavailable"));
          this.sharedStorage = sortInventory(this.sharedStorage, this.defs, () => this.nextId++);
        } else r.storage = sortInventory(r.storage, this.defs, () => this.nextId++);
        break;
      }
      case "UnlockStoragePage": {
        if (this.requireNPC(r).role !== "storage")
          throw new LocalizedError(message("storage.unlockNPC"));
        unlockStoragePage(r, Number(data.Page));
        break;
      }
      case "SortInventory": {
        normalizeBagCompartments(r, this.rules, this.defs);
        const n = equipmentCapacity(r, this.rules);
        r.inventory =
          r.bagLayoutVersion === 1
            ? [
                ...sortInventory(r.inventory.slice(0, n), this.defs, () => this.nextId++),
                ...sortInventory(r.inventory.slice(n), this.defs, () => this.nextId++),
              ]
            : sortInventory(r.inventory, this.defs, () => this.nextId++);
        break;
      }
      case "MoveItem": {
        if (data.Grid && data.Grid !== "Inventory")
          throw new LocalizedError(message("core.game.command.641c485898"));
        const from = Number(data.From),
          to = Number(data.To),
          bag = r.inventory;
        if (
          !Number.isInteger(from) ||
          !Number.isInteger(to) ||
          from < 0 ||
          to < 0 ||
          from >= bag.length ||
          to >= bag.length ||
          !bag[from] ||
          (data.UniqueID !== void 0 && bag[from]?.uid !== Number(data.UniqueID))
        )
          throw new LocalizedError(message("core.game.command.3edeb6d40f"));
        if (
          !bagSlotAccepts(r, this.rules, this.defs.get(bag[from].id), to) ||
          (bag[to] && !bagSlotAccepts(r, this.rules, this.defs.get(bag[to].id), from))
        )
          throw new LocalizedError(message("bag.wrongCategory"));
        if (from === to) break;
        const a = bag[from],
          b = bag[to],
          max = this.defs.get(a.id).StackSize;
        if (
          b &&
          a.id === b.id &&
          max > 1 &&
          b.count < max &&
          JSON.stringify(a.added) === JSON.stringify(b.added) &&
          a.materialQuality === b.materialQuality &&
          !!a.bound === !!b.bound
        ) {
          const count = Math.min(a.count, max - b.count);
          b.count += count;
          a.count -= count;
          if (!a.count) bag[from] = null;
        } else [bag[from], bag[to]] = [bag[to], bag[from]];
        break;
      }
      case "SplitItem": {
        const item = r.inventory.find((i) => i?.uid === Number(data.UniqueID)),
          count = Number(data.Count),
          to = r.inventory.findIndex(
            (i, n) => !i && !!item && bagSlotAccepts(r, this.rules, this.defs.get(item.id), n),
          );
        if (!item || !Number.isInteger(count) || count < 1 || count >= item.count || to < 0)
          throw new LocalizedError(message("core.game.command.45f585c303"));
        r.inventory[to] = {
          ...structuredClone(item),
          uid: this.nextId++,
          count,
        };
        item.count -= count;
        break;
      }
      case "DropItem": {
        const index = r.inventory.findIndex((i) => i?.uid === Number(data.UniqueID)),
          item = r.inventory[index],
          count = Number(data.Count);
        if (!item || !Number.isInteger(count) || count < 1 || count > item.count)
          throw new LocalizedError(message("core.game.command.7ed68b7e72"));
        const def = this.defs.get(item.id);
        assertDxDisposable(this, item);
        if (item.locked) assertEquipmentDisposable(item);
        if (def.Bind.includes("DontDrop") || def.Type === "Quest")
          throw new LocalizedError(message("core.game.command.ddf6aa6d1d"));
        this.ground(r, {
          ...structuredClone(item),
          uid: count === item.count ? item.uid : this.nextId++,
          count,
        });
        item.count -= count;
        if (!item.count) r.inventory[index] = null;
        break;
      }
      case "AcceptQuest":
        this.acceptQuest(r, Number(data.QuestIndex));
        break;
      case "FinishQuest":
        this.finishQuest(r, Number(data.QuestIndex), Number(data.SelectedItemIndex));
        break;
      case "AbandonQuest": {
        const q = this.rules.quests.find((q2) => q2.Index === Number(data.QuestIndex));
        if (q) {
          r.quests = r.quests.filter((t) => t.id !== q.Index);
          for (const t of q.CarryItems)
            this.consume(r, t.item, Math.min(this.count(r, t.item), t.count));
        }
        break;
      }
      case "TownRevive": {
        if (!r.dead) throw new LocalizedError(message("core.game.command.cc93d6760d"));
        const home = residence(r, this.rules);
        const spot = this.freeNear(home.map, { x: home.at[0], y: home.at[1] }, home.radius);
        if (!spot) throw new LocalizedError(message("core.game.command.c18b9454e2"));
        r.dead = false;
        r.hp = r.maxHP;
        r.mp = r.maxMP;
        r.map = home.map;
        r.x = spot.x;
        r.y = spot.y;
        r.target = 0;
        this.npc = 0;
        r.buffs = [];
        r.potHP = r.potMP = r.healHP = 0;
        r.actionAt = this.time + 600;
        break;
      }
      case "LogOut":
        clearManualCast(r);
        this.dismissPets(r);
        this.active = 0;
        this.npc = 0;
        break;
      case "Opendoor":
        break;
      default:
        throw new LocalizedError(message("core.game.command.e52fcae8a7", { p0: type }));
    }
    for (const id of unlockArrivalWaypoints(r, this.rules)) {
      const w = this.rules.adaptations.towns.waypoints.find((w2) => w2.id === id);
      this.say(message("npc.waypointUnlocked", { map: entityText("maps", w.map) }));
    }
  }
  checkUse(r, d, item) {
    const remaining = Math.max(
      isSunPotion(d) ? sunPotionRemaining(r, this.time) : 0,
      itemCooldownRemaining(r, d, this.time),
    );
    if (remaining > 0)
      throw new LocalizedError(
        message("item.sunCooldownRemaining", { seconds: Math.ceil(remaining / 1e3) }),
      );
    if (
      !matchesClass(d.RequiredClass, r.job) ||
      (d.RequiredGender !== "None" && d.RequiredGender !== r.gender)
    )
      throw new LocalizedError(message("core.game.checkUse.7e2e685824"));
    const amount = d.RequiredType === "Level" ? r.level : r.stats[d.RequiredType] || 0;
    const required =
      d.RequiredType === "Level" && item?.dx && itemSlots(d) && dxConfig(this.rules)
        ? dxRequiredLevel(dxConfig(this.rules), item, d)
        : d.RequiredAmount;
    if (amount < required) throw new LocalizedError(message("core.game.checkUse.15eaf41ca3"));
  }
  useItem(r, uid) {
    const index = r.inventory.findIndex((i) => i?.uid === uid),
      item = r.inventory[index];
    if (!item) throw new LocalizedError(message("core.game.useItem.9edbd2d8c5"));
    const d = this.defs.get(item.id);
    const slots3 = itemSlots(d);
    if (dxConfig(this.rules) && item.dx && slots3 && d.Type !== "Mount") {
      this.checkUse(r, d, item);
      dxCheckRequirement(this, r, item, d);
      const to = slots3.find((slot) => !r.equipment[slot]) ?? slots3[0],
        old = r.equipment[to];
      r.inventory[index] = old;
      r.equipment[to] = item;
      this.refresh(r);
      dxTutorialEquipped(this, r, item);
      return;
    }
    this.checkUse(r, d);
    if (isSnowPotion(d) && (r.dead || item.count <= 0 || (r.hp >= r.maxHP && r.mp >= r.maxMP)))
      throw new LocalizedError(message("late.snowNoRecovery"));
    if (useChestItem(this, r, item) || useSummonItem(this, r, item)) return;
    if (d.Type === "Mount") {
      toggleMount(this, r, item.uid);
      return;
    }
    if (d.Type === "MountVoucher") {
      mountVoucher(this, r, item.uid);
      return;
    }
    if (d.Type === "PandoraBox" || d.Type === "ForgeMaterial") {
      const name = String(d.DreamName || d.Name),
        cfg = this.rules.adaptations.forge;
      if (d.Index === cfg.identifyId) {
        this.say(message("core.game.useItem.f59371d780"));
        return;
      }
      this.emit("OpenForge", {
        Mode:
          d.Type === "PandoraBox"
            ? "pandora"
            : d.Index === cfg.resetId
              ? "reset"
              : d.Index === cfg.mixId
                ? "mix"
                : name.startsWith("\u6F5C\u80FD\u77F3")
                  ? "potential"
                  : name.includes("\u5929\u8D4B\u77F3")
                    ? "awaken"
                    : name.startsWith("\u51DD\u6676\u77F3")
                      ? "crystal"
                      : "enhance",
      });
      return;
    }
    if (d.Type === "CraftMaterial") {
      const recipe = this.rules.adaptations.forge?.recipes.find(
        (v) => v.mode === "craft" && v.inputs.some((i) => i.item === d.Index),
      );
      this.emit("OpenForge", {
        Mode: "craft",
        Recipe: recipe?.id,
        Missing: recipe?.inputs.map((i) => ({
          ...i,
          missing: Math.max(0, i.count - this.count(r, i.item)),
        })),
      });
      return;
    }
    if (d.Type === "ChallengeTicket") {
      this.say(message("core.game.useItem.f57105d62e"));
      return;
    }
    if (d.Type === "ExperienceScroll") {
      this.gainXP(r, Number(d.ExperienceValue));
      item.count--;
      if (!item.count) r.inventory[index] = null;
      return;
    }
    if (dxIsRune(this, d.Index) || dxIsEssence(this, d.Index)) {
      const list = dxIsEssence(this, d.Index)
        ? dxEnchantOptions(this, r, item)
        : r.inventory.flatMap((target) => {
            if (!target || target === item) return [];
            try {
              return [{ uid: target.uid, id: target.id, ...dxSocketQuote(this, r, item, target) }];
            } catch {
              return [];
            }
          });
      if (!list.length)
        throw new LocalizedError(
          message(
            dxIsEssence(this, d.Index) ? "dx.error.noEnchantTarget" : "dx.error.noSocketTarget",
          ),
        );
      this.emit("CombineOptions", { FromID: item.uid, List: list });
      return;
    }
    if (d.Type === "Gem") {
      const list = [];
      for (const target of r.inventory) {
        if (!target) continue;
        try {
          list.push({
            uid: target.uid,
            id: target.id,
            ...upgradeQuote(this, r, item, target),
          });
        } catch {}
      }
      if (!list.length) throw new LocalizedError(message("core.game.useItem.645999feaa"));
      this.emit("CombineOptions", { FromID: item.uid, List: list });
      return;
    }
    if (d.Type === "Book") {
      if (!d.Spell || !this.rules.skills.some((s) => s.Spell === d.Spell))
        throw new LocalizedError(message("core.game.useItem.ac1192a04a"));
      if (this.rules.adaptations.disabledSpells[d.Spell])
        throw Error(this.rules.adaptations.disabledSpells[d.Spell]);
      if (d.Spell === "HeavyStrike" && r.skills.some((s) => s.Spell === "Slaying" && !s.temporary))
        throw new LocalizedError(message("skill.heavy.replaced"));
      const native = this.rules.skills.find((s) => s.Spell === d.Spell);
      const known = r.skills.find((s) => s.Spell === d.Spell && !s.temporary);
      if (native?.DreamBookProgression) {
        const next = bookNextRank(native, d, known?.Level || 0, r.level);
        if (known) {
          known.Level = next;
          known.Experience = 0;
        } else {
          r.skills = r.skills.filter((s) => s.Spell !== d.Spell || !s.temporary);
          const starter = [
            ...Object.values(this.rules.adaptations.noviceProgression?.firstBookByJob || {}),
            ...Object.values(this.rules.adaptations.noviceProgression?.secondBookByJob || {}),
          ].includes(d.Index);
          const key =
            starter && !native.DreamSkill?.passive
              ? [1, 2, 3, 4, 5, 6, 7, 8].find((k) => !r.skills.some((s) => s.Key === k)) || 0
              : 0;
          r.skills.push({ Spell: d.Spell, Level: next, Key: key, Experience: 0, CastTime: 0 });
        }
        retireHeavyStrike(r);
        item.count--;
        if (!item.count) r.inventory[index] = null;
        this.say(
          message("core.game.useItem.b8f764be02", { p0: entityText("skills", d.Spell), p1: next }),
        );
        this.refresh(r);
        return;
      }
      if (known) throw new LocalizedError(message("core.game.useItem.f43867c492"));
      r.skills = r.skills.filter((s) => s.Spell !== d.Spell || !s.temporary);
      r.skills.push({
        Spell: d.Spell,
        Level: native?.DreamBookProgression ? 1 : 0,
        Key: 0,
        Experience: 0,
        CastTime: 0,
      });
      this.say(message("core.game.useItem.7b0edac124", { p0: entityText("skills", d.Spell) }));
      this.refresh(r);
    } else if (d.Type === "MainlineSummon") {
      summonMainlineBoss(this, r);
      return;
    } else if (d.Type === "TreasureMap") {
      enterTreasure(this, r);
    } else if (d.Type === "BagExpansion") {
      const config = this.rules.adaptations.bagExpansion,
        rows = r.bagExpansionRows || 0;
      if (rows >= config.maxRows) throw new LocalizedError(message("core.game.useItem.676fb9495c"));
      const n = equipmentCapacity(r, this.rules);
      if (r.bagLayoutVersion === 1) {
        r.inventory.splice(n, 0, ...Array(config.columns).fill(null));
        r.inventory.push(...Array(config.columns).fill(null));
      } else r.inventory.push(...Array(config.columns).fill(null));
      r.bagExpansionRows = rows + 1;
      this.say(
        message("core.game.useItem.2af6fb6f8b", {
          p0: rows + 1,
          p1: config.columns,
          p2: rows + 1,
          p3: config.maxRows,
        }),
      );
    } else if (d.Type === "Potion") {
      if (d.Shape === 0) {
        queuePotion(
          r,
          Math.floor((d.Stats.HP || 0) * (1 + (r.stats.PotionHealingPercent || 0) / 100)),
          d.Stats.MP || 0,
          this.time,
        );
      } else if (d.Shape === 1) {
        if (isSunPotion(d)) r.sunPotionAt = this.time + SUN_POTION_COOLDOWN_MS;
        startItemCooldown(r, d, this.time);
        const hp = d.DreamPotionPercent
          ? Math.floor((r.maxHP * (d.Stats.HP || 0)) / 100)
          : Math.floor((d.Stats.HP || 0) * (1 + (r.stats.PotionHealingPercent || 0) / 100));
        const mp = d.DreamPotionPercent
          ? Math.floor((r.maxMP * (d.Stats.MP || 0)) / 100)
          : d.Stats.MP || 0;
        r.hp = Math.min(r.maxHP, r.hp + hp);
        r.mp = Math.min(r.maxMP, r.mp + mp);
      } else if (d.Shape === 2) {
        r.special ??= {};
        if (r.special.unlockCurse)
          throw new LocalizedError(message("core.game.useItem.b320af37c9"));
        r.special.unlockCurse = true;
      } else if (d.Shape === 3) {
        for (const [type, keys2] of Object.entries({
          Impact: ["MinDC", "MaxDC"],
          Magic: ["MinMC", "MaxMC"],
          Taoist: ["MinSC", "MaxSC"],
          Storm: ["AttackSpeed"],
          HealthAid: ["HP"],
          ManaAid: ["MP"],
          Defence: ["MinAC", "MaxAC"],
          MagicDefence: ["MinMAC", "MaxMAC"],
          BagWeight: ["BagWeight"],
        })) {
          const stats2 = Object.fromEntries(
            keys2.map((k) => [k, (d.Stats[k] || 0) + (item.added[k] || 0)]),
          );
          if (Object.values(stats2).some((v) => v > 0))
            this.buff(r, type, d.Durability * 6e4, 0, stats2);
        }
      } else if (d.Shape === 4 || d.Shape === 5)
        this.buff(r, d.Shape === 4 ? "Exp" : "Drop", d.Durability * 6e4, 0, {
          [d.Shape === 4 ? "ExpRatePercent" : "ItemDropRatePercent"]:
            (d.Stats.Luck || 0) + (item.added.Luck || 0),
        });
      else throw new LocalizedError(message("core.game.useItem.ed072e21b7"));
    } else if (d.Type === "Scroll" && [1, 2].includes(d.Shape)) {
      if (d.Shape === 2 && this.region(r.map).noTeleport)
        throw new LocalizedError(message("core.game.useItem.d3964b45bd"));
      const home = residence(r, this.rules);
      const destination = d.Shape === 1 ? home.map : r.map;
      const geometry = this.geometry.get(destination);
      if (!geometry) throw new LocalizedError(message("core.game.useItem.aea33a7a48"));
      this.initializeMap(destination);
      let spot = null;
      if (d.Shape === 1)
        spot = this.freeNear(destination, { x: home.at[0], y: home.at[1] }, home.radius);
      else {
        const size = geometry.width * geometry.height,
          start = this.rng.next(size);
        for (let offset = 0; offset < size; offset++) {
          const cell = (start + offset) % size,
            x = cell % geometry.width,
            y = Math.floor(cell / geometry.width);
          if ((x !== r.x || y !== r.y) && this.walkable(destination, x, y, r.id)) {
            spot = { x, y };
            break;
          }
        }
      }
      if (!spot) throw new LocalizedError(message("core.game.useItem.912b3c36ab"));
      r.map = destination;
      r.x = spot.x;
      r.y = spot.y;
      r.target = 0;
      r.actionAt = this.time + 600;
      this.npc = 0;
      this.bringPets(r);
      this.say(
        d.Shape === 1
          ? message("core.game.useItem.1cbc1b8891", { p0: entityText("maps", home.id) })
          : message("core.game.useItem.b8c220496a"),
      );
    } else if (d.Type === "Scroll" && d.Shape === 3) {
      const weapon = r.equipment[0];
      if (
        !weapon ||
        (weapon.added.Luck || 0) >= 7 ||
        this.defs.get(weapon.id).Bind.includes("DontUpgrade")
      )
        throw new LocalizedError(message("core.game.useItem.71982d113f"));
      const luck = weapon.added.Luck || 0;
      if (luck > -this.rules.constants.MaxLuck && this.rng.next(20) === 0) {
        weapon.added.Luck = luck - 1;
        this.say(message("core.game.useItem.63ff7d1459"));
      } else if (
        luck <= 0 ||
        this.rng.next(10 * (luck + (this.defs.get(weapon.id).Stats.Luck || 0))) === 0
      ) {
        weapon.added.Luck = luck + 1;
        this.say(message("core.game.useItem.b127f87a89"));
      } else this.say(message("core.game.useItem.5a0f1ec8bf"));
      this.refresh(r);
    } else throw new LocalizedError(message("core.game.useItem.1ed729edb3"));
    item.count--;
    if (!item.count) {
      const used = r.inventory.findIndex((i) => i?.uid === item.uid);
      if (used >= 0) r.inventory[used] = null;
    }
  }
  acceptQuest(r, id) {
    const n = this.requireNPC(r),
      q = this.rules.quests.find((q2) => q2.Index === id);
    if (
      !q ||
      q.acceptNpc !== n.id ||
      r.quests.some((t) => t.id === id) ||
      r.completedQuests.includes(id) ||
      r.level < q.RequiredMinLevel ||
      r.level > q.RequiredMaxLevel ||
      (q.RequiredQuest && !r.completedQuests.includes(q.RequiredQuest))
    )
      throw new LocalizedError(message("core.game.acceptQuest.bcd7946bf3"));
    const backup = structuredClone(r.questInventory);
    for (const i of q.CarryItems)
      if (!this.give(r, this.newItem(i.item, i.count), false)) {
        r.questInventory = backup;
        throw new LocalizedError(message("core.game.acceptQuest.c45399e923"));
      }
    r.quests.push({ id, kills: {} });
    this.say(message("core.game.acceptQuest.7c4db0b8ee", { p0: entityText("quests", q.Index) }));
  }
  finishQuest(r, id, selected) {
    const n = this.requireNPC(r),
      q = this.rules.quests.find((q2) => q2.Index === id);
    if (!q || q.finishNpc !== n.id || !this.questComplete(r, q))
      throw new LocalizedError(message("core.game.finishQuest.daf55c93c8"));
    const rewards = this.questRewards(q, r);
    if (q.SelectRewards.length) {
      const i = Number.isInteger(selected) ? q.SelectRewards[selected] : void 0;
      if (!i) throw new LocalizedError(message("core.game.finishQuest.e7199796d9"));
      rewards.push(i);
    }
    const backup = structuredClone({
      inventory: r.inventory,
      questInventory: r.questInventory,
    });
    for (const t of [...q.CarryItems, ...q.ItemTasks]) this.consume(r, t.item, t.count);
    for (const reward of rewards)
      if (
        !this.give(
          r,
          q.Index === 214 && reward.item === q.ClassRewards?.[r.job]?.item
            ? this.woomaWeapon(r, reward.item)
            : this.newItem(reward.item, reward.count),
          false,
        )
      ) {
        Object.assign(r, backup);
        throw new LocalizedError(message("core.game.finishQuest.1abcf3a5f0"));
      }
    r.gold += q.GoldReward;
    this.gainXP(r, q.ExpReward);
    r.quests = r.quests.filter((t) => t.id !== id);
    r.completedQuests.push(id);
    if (grantNoviceSkill(this, r)) this.refresh(r);
    this.say(message("core.game.finishQuest.df8e4fdf82", { p0: entityText("quests", q.Index) }));
  }
  recoverLegacyMeat(r) {
    for (let i = 0; i < r.questInventory.length; i++) {
      const item = r.questInventory[i];
      if (
        item &&
        (item.id === this.rules.adaptations.unifiedDeerMeat.canonical ||
          ["PandoraBox", "MainlineSummon"].includes(this.defs.get(item.id)?.Type || "")) &&
        this.give(r, item, false)
      )
        r.questInventory[i] = null;
    }
  }
  snapshot(after = -1, viewRange2 = 24) {
    const r = this.me;
    if (r && r.mountUid && !mountedItem(this, r)) delete r.mountUid;
    if (r) abandonExitedTreasure(this, r);
    if (r) this.recoverLegacyMeat(r);
    const role = r ? structuredClone(r) : null;
    let me = null;
    if (role) {
      me = {
        ...role,
        quickRings: role.ringHotkeys?.map((binding) =>
          binding
            ? (nextQuickRing(role, binding) ?? {
                id:
                  role.equipment[binding.slot]?.uid === binding.teleport.uid
                    ? binding.original.id
                    : binding.teleport.id,
                count: 0,
              })
            : null,
        ),
        spiritGrowth: this.rules.adaptations.noviceProgression?.spiritGrowth
          ? {
              cap: this.rules.adaptations.noviceProgression.spiritGrowth.cap,
              nextXP: spiritNextXP(
                this.rules.adaptations.noviceProgression.spiritGrowth,
                role.spiritProgress?.level || 0,
              ),
            }
          : void 0,
        heavyStrikeHits:
          this.time - Number(role.special?.heavyHitAt ?? -Infinity) <= 8e3
            ? Number(role.special?.heavyHits || 0)
            : 0,
        honorTitle: this.rules.adaptations.trial?.titles[(role.trial?.title || 0) - 1]
          ? entityText("honorTitles", role.trial.title)
          : "",
        dynamicPortals: (this.map(role.map).portals || [])
          .filter((p) => !p.expires || p.expires > this.time)
          .map((p) => ({
            MapIndex: p.to,
            Name: p.name,
            Source: { x: p.at[0], y: p.at[1] },
            Destination: { x: p.landing[0], y: p.landing[1] },
          })),
        lateQuestRows: lateQuestRows(this, r),
        nextXP: this.rules.growth.experience[role.level - 1] || 1,
        buffs: role.buffs.map((b) => b.type),
        buffDetails: role.buffs.map((b) => ({
          type: b.type,
          remainingMs: Math.max(0, b.until - this.time),
          stats: b.stats,
          value: b.value,
          spell: b.spell,
        })),
        potionRecovery: potionRecoveryStatus(r, this.time),
        sunPotionRemainingMs: sunPotionRemaining(r, this.time),
        snowPotionRemainingMs: Math.max(0, Math.min(8e3, (r.itemCooldowns?.snow || 0) - this.time)),
        nightmareSeals: role.nightmareSeals || 0,
        nightmareFirstClear: role.nightmareFirstClear === true,
        canMapTeleport: this.canMapTeleport(role),
        trial: role.trial,
        trialRun: role.trialRun
          ? { ...role.trialRun, remainingMs: Math.max(0, role.trialRun.deadline - this.time) }
          : void 0,
        challenge: role.challengeRun
          ? {
              ...role.challengeRun,
              remainingMs: Math.max(
                0,
                (role.challengeRun.returnAt ?? role.challengeRun.deadline) - this.time,
              ),
            }
          : void 0,
        bossRespawns: this.region(role.map).spawns.flatMap((spawn, i) => {
          const def = this.rules.monsters.find((d) => d.Name === spawn.monster);
          if (!def?.IsBoss && !spawn.native?.boss && !spawn.boss) return [];
          const alive = this.map(role.map).actors.filter((a) => a.spawn === i && !a.dead).length;
          const positions = this.map(role.map)
            .actors.filter((a) => a.spawn === i && !a.dead && !a.friendly)
            .map((a) => ({ x: a.x, y: a.y }));
          return [
            {
              positions,
              definition: def?.Index,
              name: def?.DreamName || def?.GuideName || def?.Name,
              alive,
              cap: spawn.count,
              remainingMs: Math.max(0, (this.map(role.map).respawns[i] || 0) - this.time),
              intervalMs: spawn.respawnMinutes * 6e4,
            },
          ];
        }),
        testTalisman: !role.dead ? activeTestTalisman(role, this.rules) || null : null,
        worldFirework: this.rules.adaptations.dreamRuntime?.worldFirework?.enabled
          ? {
              permanent: true,
              experienceBonusPercent: dreamFireworkBonus(this.rules.adaptations.dreamRuntime)
                .experienceBonusPercent,
              monsterExperienceMultiplier:
                (this.rules.multipliers.monsterExperienceMultiplier +
                  dreamFireworkBonus(this.rules.adaptations.dreamRuntime).experienceBonusPercent /
                    100) *
                (1 + Math.max(0, role.stats.ExpRatePercent || 0) / 100),
              dropMultiplier: dreamItemDropMultiplier(
                this.rules.adaptations.dreamRuntime,
                role.stats.ItemDropRatePercent,
              ),
              killXP: Math.max(0, role.stats.KillXP || 0),
              magicFind: dreamMagicFind(this.rules.adaptations.dreamRuntime, role.stats.MagicFind),
              exceptionalChance: dreamExceptionalChance(
                dreamMagicFind(this.rules.adaptations.dreamRuntime, role.stats.MagicFind),
              ),
              exceptionalChancesByGrade: Object.fromEntries(
                [0, 1, 2, 3, 4, 5, 6, 7].map((grade) => [
                  grade,
                  dreamEquipmentExceptionalChance(
                    this.rules.adaptations.dreamRuntime,
                    grade,
                    dreamMagicFind(this.rules.adaptations.dreamRuntime, role.stats.MagicFind),
                  ),
                ]),
              ),
            }
          : null,
        canRun: !role.dead,
        canAttack: !role.dead,
        attackDelay: attackDelay(role.level, role.stats, !!this.rules.adaptations.dreamRuntime),
        attackReadyIn: Math.max(0, Math.max(role.attackAt, role.actionAt) - this.time),
        actionReadyIn: Math.max(0, role.actionAt - this.time),
        spellReadyIn: Math.max(0, Math.max(role.spellAt, role.actionAt) - this.time),
        bagWeight: this.bagWeight(role),
        skills: role.skills.map((s) => ({
          ...s,
          LearnedLevel: s.Level,
          EffectiveLevel: this.skill(role, s.Spell)?.level ?? s.Level,
          Info: this.rules.skills.find((d) => d.Spell === s.Spell),
        })),
        quests: role.quests.map((p) => {
          const q = this.rules.quests.find((q2) => q2.Index === p.id);
          return {
            id: p.id,
            info: this.questInfo(q, role),
            progress: {
              TaskList: [
                entityText("quests", q.Index, "objective"),
                ...(q.KillTotal !== void 0
                  ? [
                      message("quest.killTotal", {
                        current: Math.min(q.KillTotal, this.questKillTotal(p.kills, q)),
                        required: q.KillTotal,
                      }),
                    ]
                  : q.KillTasks.map((t) =>
                      message("quest.progress", {
                        name: entityText("monsters", t.monster),
                        current: p.kills[t.monster] || 0,
                        required: t.count,
                      }),
                    )),
                ...q.ItemTasks.map((t) =>
                  message("quest.progress", {
                    name: entityText("items", t.item),
                    current: this.count(role, t.item),
                    required: t.count,
                  }),
                ),
              ],
              KillCount: q.KillTasks.map((t) => p.kills[t.monster] || 0),
              ItemCount: q.ItemTasks.map((t) => this.count(role, t.item)),
              Completed: this.questComplete(role, q),
            },
          };
        }),
      };
    }
    const actors = r
      ? this.map(r.map)
          .actors.filter(
            (a) =>
              distance(a, r) <=
                (Number.isFinite(viewRange2) ? Math.max(24, Math.min(26, viewRange2)) : 24) &&
              visibleMonster(a),
          )
          .map((a) => {
            if (a.ai === 55 && a.master) {
              const owner = this.roles.find((r2) => r2.id === a.master);
              if (owner)
                return {
                  ...a,
                  kind: "clone",
                  name: owner.name,
                  gender: owner.gender,
                  equipment: structuredClone(owner.equipment),
                  buffs: a.buffs.map((b) => b.type),
                };
            }
            if (a.kind !== "npc")
              return {
                ...a,
                displayName: a.kind === "monster" ? monsterDisplayName(a, this.rules) : void 0,
                rank:
                  a.kind === "monster"
                    ? monsterRank(this.monsters.get(a.definition), this.rules)
                    : void 0,
                extra: !!a.special?.stoned,
                x:
                  a.kind === "spell" && a.show && a.spell !== "FireWall"
                    ? (a.stats.centerX ?? a.x)
                    : a.x,
                y:
                  a.kind === "spell" && a.show && a.spell !== "FireWall"
                    ? (a.stats.centerY ?? a.y)
                    : a.y,
                buffs: a.buffs.map((b) => b.type),
                poison: a.buffs.map((b) => b.type).join(", "),
              };
            return {
              ...a,
              quests: this.rules.quests
                .filter((q) => q.acceptNpc === a.id || q.finishNpc === a.id)
                .map((q) => ({
                  id: q.Index,
                  name: q.Name,
                  canAccept:
                    q.acceptNpc === a.id &&
                    !r.quests.some((t) => t.id === q.Index) &&
                    !r.completedQuests.includes(q.Index) &&
                    r.level >= q.RequiredMinLevel &&
                    r.level <= q.RequiredMaxLevel &&
                    (!q.RequiredQuest || r.completedQuests.includes(q.RequiredQuest)),
                  canFinish: q.finishNpc === a.id && this.questComplete(r, q),
                  info: this.questInfo(q, r),
                })),
            };
          })
      : [];
    return {
      epoch: this.epoch,
      revision: ++this.revision,
      cursor: this.cursor,
      time: this.time,
      runtime: {
        loadedMaps: Object.keys(this.maps).length,
        loadedGeometry: this.geometry.size,
        currentMonsters: r
          ? this.map(r.map).actors.filter((a) => a.kind === "monster" && !a.dead).length
          : 0,
        awakeMonsters: r
          ? this.map(r.map).actors.filter(
              (a) =>
                a.kind === "monster" &&
                !a.dead &&
                (a.friendly || distance(a, r) <= 24 || a.buffs.length),
            ).length
          : 0,
      },
      lastSaved: this.lastSaved,
      ...(hasSharedStorage(this.rules)
        ? {
            sharedStorageGame: sharedStorageGame(this.rules),
            sharedStorageVersion: 1,
            sharedStorage: this.sharedStorage,
          }
        : {}),
      ...(this.sync ? { sync: this.sync } : {}),
      account: { id: 1, name: "\u672C\u673A\u5B58\u6863", guest: false },
      guestAvailable: false,
      stage: r ? "Game" : "Select",
      roles: this.roles.map((r2) => ({
        id: r2.id,
        cloudId: r2.cloudId,
        name: r2.name,
        job: r2.job,
        gender: r2.gender,
        level: r2.level,
      })),
      me,
      actors,
      // Map-only positions do not expose buried bosses to world rendering or targeting.
      mapMonsters: r
        ? this.map(r.map)
            .actors.filter(
              (a) =>
                a.kind === "monster" &&
                !a.dead &&
                distance(a, r) <= 24 &&
                (visibleMonster(a) ||
                  [19, 131].includes(
                    Number(this.monsters.get(a.definition)?.DreamOriginalId || 0),
                  )),
            )
            .map((a) => ({
              id: a.id,
              kind: a.kind,
              x: a.x,
              y: a.y,
              name: a.name,
              friendly: a.friendly,
              dead: a.dead,
              rank: monsterRank(this.monsters.get(a.definition), this.rules),
            }))
        : [],
      packets: after < 0 ? [] : this.packets.filter((p) => p.seq > after),
    };
  }
  save(includeWorld = true) {
    return structuredClone({
      version: 1,
      worldVersion: this.rules.adaptations.mainline?.worldVersion,
      rulesVersion: this.rules.version,
      dreamRuntimeVersion: this.rules.adaptations.dreamRuntime?.version,
      time: this.time,
      nextId: this.nextId,
      rng: this.rng.export(),
      roles: this.roles,
      maps: includeWorld ? this.maps : {},
      events: includeWorld ? this.events : [],
      nextOrder: this.nextOrder,
      lastSaved: this.lastSaved,
      ...(hasSharedStorage(this.rules)
        ? {
            sharedStorageGame: sharedStorageGame(this.rules),
            sharedStorageVersion: 1,
            sharedStorage: this.sharedStorage,
          }
        : {}),
      ...(this.sync ? { sync: this.sync } : {}),
    });
  }
  restore(save) {
    save = migrateDreamRuntime(migrateWorldSave(save, this.rules), this.rules);
    if (save.version !== 1 || save.rulesVersion !== this.rules.version)
      throw new LocalizedError(message("core.game.restore.8d582cc5cd"));
    this.roles = structuredClone(save.roles);
    this.sharedStorage = hasSharedStorage(this.rules)
      ? structuredClone(save.sharedStorage ?? Array(SHARED_STORAGE_SLOTS).fill(null))
      : Array(SHARED_STORAGE_SLOTS).fill(null);
    this.maps = structuredClone(save.maps);
    this.bossRespawns = {};
    this.spreadMaps.clear();
    this.time = save.time;
    this.replenishAt = this.time;
    this.nextId = save.nextId;
    this.rng.restore(save.rng);
    const meat = this.rules.adaptations.unifiedDeerMeat;
    const normalizeMeat = (item) => {
      const def = item && this.defs.get(item.id);
      if (item && def) {
        migrateItemAffixes(item, def, this.rules.adaptations.dreamRuntime?.affixes);
        migrateChestReward(item, this.rules);
      }
      if (item?.id === meat.legacy) {
        item.id = meat.canonical;
        item.maxDura = this.defs.get(meat.canonical).Durability;
        item.currentDura = Math.min(item.currentDura, item.maxDura);
      }
    };
    for (const r of this.roles) {
      if (r.equipment.length === 14) r.equipment.push(null);
      if (this.defs.get(r.equipment[12]?.id || 0)?.DreamType === 6 && !r.equipment[14]) {
        r.equipment[14] = r.equipment[12];
        r.equipment[12] = null;
      }
      for (const skill of Object.keys(r.crafting?.skills ?? {})) settleCraftXP(this, r, skill);
      migrateBagCapacity(r, this.rules);
      migrateItemHotkeys(r, this.defs);
      normalizeBagCompartments(r, this.rules, this.defs);
      for (const item of [
        ...r.inventory,
        ...r.questInventory,
        ...r.storage,
        ...r.equipment,
        ...Object.values(r.buyback || {}).flat(),
      ])
        normalizeMeat(item);
      for (const receipt2 of r.challengeRewards?.pending || [])
        for (const item of receipt2.items) normalizeMeat(item);
      this.recoverLegacyMeat(r);
    }
    for (const m of Object.values(this.maps))
      for (const a of m.actors) {
        normalizeMeat(a.item);
        if (a.item?.id === meat.canonical) a.name = this.defs.get(meat.canonical).Name;
      }
    for (const m of Object.values(this.maps))
      for (const a of m.actors)
        if (a.kind === "monster" && !a.special)
          initializeMonster(this, a, this.monsters.get(a.definition));
    this.events = structuredClone(save.events);
    this.nextOrder = save.nextOrder;
    this.lastSaved = save.lastSaved;
    this.sync = save.sync ? structuredClone(save.sync) : void 0;
    this.active = 0;
    this.npc = 0;
  }
};

// games/darkforged/singleplayer/core/dream-bosses.ts
function prepareDragonTotem(g, a) {
  if (!monsterCombatProfile(g, a)?.ownerBound) return false;
  const owner = a.master ? g.actor(a.master) : void 0;
  if (a.special?.bossMinion && (!owner || owner.dead || owner.map !== a.map)) {
    g.die(a, a);
    return true;
  }
  return false;
}
function summonBossAdds(g, a, original, count, radius = 3, c) {
  const def = g.rules.monsters.find((m) => m.DreamOriginalId === original);
  if (!def) return;
  const living = g
    .map(a.map)
    .actors.filter(
      (m) =>
        !m.dead &&
        !m.friendly &&
        m.definition === def.Index &&
        (c?.scope === "map" || m.master === a.id),
    );
  if (c?.limitBeforeSummon !== void 0 && living.length >= c.limitBeforeSummon) return;
  const needed = c?.mode === "wave" ? count : Math.max(0, count - living.length);
  if (c?.reuseExisting)
    for (const m of living.slice(0, count)) {
      const at = g.freeNear(a.map, a, radius);
      if (!at) break;
      m.x = at.x;
      m.y = at.y;
      m.master = a.id;
      m.target = a.target;
      m.special = { ...m.special, bossMinion: true };
      g.emit("ObjectTeleportIn", { ObjectID: m.id });
    }
  for (let i = 0; i < needed; i++) {
    const [dx, dy] = vectors[(i * 2) % 8];
    const at = c?.cardinal
      ? { x: a.x + dx * radius, y: a.y + dy * radius }
      : g.freeNear(a.map, a, radius);
    if (!at) break;
    if (!g.walkable(a.map, at.x, at.y, a.id)) continue;
    const m = g.newMonster(def, a.map, at);
    m.master = a.id;
    m.target = a.target;
    m.special = { ...m.special, bossMinion: true };
    g.map(a.map).actors.push(m);
  }
}
function summon(g, a, c, key, target) {
  const s = (a.special ??= {});
  if (c.requiredHPBelow !== void 0 && a.hp >= c.requiredHPBelow) return false;
  if (c.requiredHPBelowPercent !== void 0 && a.hp >= (a.maxHP * c.requiredHPBelowPercent) / 100)
    return false;
  if ((c.once && s[key + "Done"]) || g.time < Number(s[key + "At"] ?? c.initialDelayMs ?? 0))
    return false;
  if (c.chancePercent !== void 0 && g.rng.next(100) >= c.chancePercent) return false;
  for (const add2 of c.adds) summonBossAdds(g, a, add2.nativeId, add2.count, c.radius, c);
  s[key + "Done"] = true;
  s[key + "At"] =
    g.time +
    (c.hpBelow !== void 0 && a.hp < c.hpBelow
      ? (c.woundedIntervalMs ?? c.intervalMs ?? 0)
      : (c.intervalMs ?? 0));
  if (target?.kind === "player" && c.drainMPPercent) {
    const r = target,
      drain = Math.floor((r.mp * c.drainMPPercent) / 100);
    r.mp -= drain;
    a.hp = Math.min(a.maxHP, a.hp + drain);
  }
  if (c.actionMs) {
    a.actionAt = Math.max(a.actionAt, g.time + c.actionMs);
    g.emit("ObjectMagic", {
      ObjectID: a.id,
      Cast: true,
      Direction: dirs[a.dir],
      Spell: "None",
      Duration: c.actionMs,
    });
  }
  return true;
}
function prepareDreamBoss(g, a, r) {
  const p = monsterCombatProfile(g, a),
    s = (a.special ??= {});
  if (!p || a.dead) return;
  const branches = activeBossHealthBranches(g, a),
    branchKey = (p.healthBranches ?? []).reduce(
      (mask, b, i) => mask + (branches.includes(b) ? 2 ** i : 0),
      0,
    );
  if (p.healthBranches?.length && s.bossHealthBranch !== branchKey) {
    s.bossHealthBranch = branchKey;
    g.refreshActor(a);
  }
  const regen = p.regeneration;
  if (regen && a.hp < a.maxHP && g.time >= Number(s.bossRegenAt ?? regen.initialDelayMs ?? 0)) {
    if (!a.buffs.some((b) => regen.blockedBy.includes(b.type)))
      a.hp = Math.min(a.maxHP, a.hp + Math.floor((a.maxHP * regen.percent) / 100));
    s.bossRegenAt = g.time + regen.intervalMs;
  }
  const target = g.actor(a.target);
  const controlled = a.buffs.some(
    (b) =>
      b.until > g.time &&
      ["Paralysis", "LRParalysis", "Frozen", "Stun", "Trap", "Shock"].includes(b.type),
  );
  if (s.bossChannelIndex !== void 0) {
    const action = p.attacks[Number(s.bossChannelIndex)],
      ch = action?.channel;
    if (
      !ch ||
      controlled ||
      g.time >= Number(s.bossChannelUntil) ||
      !target ||
      target.dead ||
      target.map !== a.map ||
      g.safe(target)
    ) {
      delete s.bossChannelIndex;
      delete s.bossChannelNext;
      delete s.bossChannelUntil;
    } else if (g.time >= Number(s.bossChannelNext)) {
      s.bossChannelNext = Number(s.bossChannelNext) + ch.intervalMs;
      deliverBossHits(g, a, target, p, { ...action, hitDelayMs: ch.hitDelayMs }, ch.hits);
    }
  }
  if (
    g.time < a.actionAt ||
    a.buffs.some(
      (b) =>
        b.until > g.time &&
        ["Paralysis", "LRParalysis", "Frozen", "Stun", "Trap", "Shock"].includes(b.type),
    )
  )
    return;
  if (
    !target ||
    target.dead ||
    target.map !== a.map ||
    !(target.kind === "player" || target.friendly) ||
    g.safe(target) ||
    distance(a, target) > p.activationRange
  )
    return;
  {
    const t = p.teleport;
    if (s.dragonTeleportAt !== void 0 && s.bossTeleportAt === void 0)
      s.bossTeleportAt = s.dragonTeleportAt;
    const last2 = t?.trackPlayerHit
      ? (s.bossLastPlayerHitAt ?? 0)
      : (s.bossLastAttackAt ?? s.dragonLastAttackAt);
    const petTarget = t?.petOwner && target.kind === "monster" && target.master;
    if (
      t &&
      (t.hpAtMostPercent === void 0 || a.hp <= (a.maxHP * t.hpAtMostPercent) / 100) &&
      (distance(a, target) > t.minDistance || petTarget) &&
      g.time >= Number(s.bossTeleportAt ?? t.initialDelayMs ?? 0) &&
      (last2 === void 0 || g.time - Number(last2) > (t.afterAttackMs ?? 0))
    ) {
      const owner = petTarget ? g.actor(target.master) : void 0;
      const destination =
        owner?.kind === "player" && !owner.dead && owner.map === a.map && !g.safe(owner)
          ? owner
          : target;
      const at = g.freeNear(a.map, destination, t.radius);
      s.bossTeleportAt =
        g.time +
        (t.hpBelow !== void 0 && a.hp < t.hpBelow
          ? (t.woundedIntervalMs ?? t.intervalMs)
          : t.intervalMs);
      if (at) {
        a.x = at.x;
        a.y = at.y;
        a.target = destination.id;
        g.emit("ObjectTeleportIn", { ObjectID: a.id });
        return;
      }
    }
    if (p.summon) {
      if (s.guideSummoned && p.summon.once) s.bossSummonDone = true;
      if (s.dragonSummonAt !== void 0 && s.bossSummonAt === void 0)
        s.bossSummonAt = s.dragonSummonAt;
      if (summon(g, a, p.summon, "bossSummon", target)) return;
    }
  }
  const stages = p.healthStages;
  if (stages && a.maxHP >= stages.count) {
    const stage = Math.trunc(a.hp / Math.trunc(a.maxHP / stages.count));
    if (stage < Number(s.stage ?? stages.count)) {
      if (stages.rageMs) s.madUntil = g.time + stages.rageMs;
      if (stages.summonSettings) {
        const living = g.map(a.map).actors.filter((m) => m.master === a.id && !m.dead).length;
        for (let i = 0; i < Math.min(stages.summonWave, stages.summonLimit - living); i++) {
          const name =
              g.rules.monsterSettings[
                stages.summonSettings[g.rng.next(stages.summonSettings.length)]
              ],
            def = g.rules.monsters.find((m) => m.Name === name);
          const at = g.freeNear(a.map, a, stages.summonRadius);
          if (!def || !at) continue;
          const add2 = g.newMonster(def, a.map, at);
          add2.master = a.id;
          add2.target = a.target;
          add2.actionAt = g.time + stages.summonDelayMs;
          add2.special = { ...add2.special, bossMinion: true };
          g.map(a.map).actors.push(add2);
        }
      }
    }
    s.stage = Math.min(Number(s.stage ?? stages.count), stage);
  }
  const esc = p.escape;
  if (esc && g.time >= Number(s.teleAt || 0)) {
    s.teleAt = g.time + esc.intervalMs;
    if (
      vectors.filter(([dx, dy]) => !g.walkable(a.map, a.x + dx, a.y + dy, a.id)).length >=
      esc.blockedNeighbours
    ) {
      for (let i = 0; i < esc.attempts; i++) {
        const x = a.x + g.rng.next(esc.radius + 1, -esc.radius),
          y = a.y + g.rng.next(esc.radius + 1, -esc.radius);
        if (g.walkable(a.map, x, y, a.id)) {
          a.x = x;
          a.y = y;
          a.target = 0;
          g.emit("ObjectTeleportIn", { ObjectID: a.id });
          break;
        }
      }
    }
  }
}
function nativeAttackIndex(g, a, p) {
  const s = (a.special ??= {});
  const w = p.woundedSelection,
    under = !!w && a.hp < (w.hpBelow ?? (a.maxHP * w.hpBelowPercent) / 100);
  if (under) s.bossWoundedSelection = true;
  if (p.distanceSelection) {
    const t2 = g.actor(a.target);
    return t2 && distance(a, t2) > p.distanceSelection.threshold
      ? p.distanceSelection.far
      : p.distanceSelection.near;
  }
  const force = p.forceAttack,
    t = g.actor(a.target),
    current = p.attacks[Number(s.bossSelectedAttack ?? 0)];
  const dx = t ? Math.abs(a.x - t.x) : 0,
    dy = t ? Math.abs(a.y - t.y) : 0;
  const blocked =
    !!t &&
    (distance(a, t) > (current.range ?? p.range) ||
      !!(current.alignedOnly && dx && dy && dx !== dy));
  if (
    force &&
    (!force.onlyWhenBlocked || blocked) &&
    g.time - Number((force.fromActualAttack ? s.bossLastAttackAt : s.bossRecoverAt) ?? 0) >
      force.afterMs
  ) {
    s.bossSelectedAttack = force.index;
    if (
      force.summon &&
      t &&
      !t.dead &&
      t.map === a.map &&
      !g.safe(t) &&
      !a.dead &&
      g.time >= a.actionAt &&
      !a.buffs.some(
        (b) =>
          b.until > g.time && ["Paralysis", "Frozen", "Stun", "Trap", "Shock"].includes(b.type),
      )
    )
      summon(g, a, force.summon, "bossForcedSummon");
  }
  if (s.bossSelectedAttack !== void 0) return Number(s.bossSelectedAttack);
  const wounded = w && (under || (w.sticky && s.bossWoundedSelection));
  if (p.selection === "nativeModulo") {
    const m = p.moduloSelection;
    return Number(
      (s.bossSelectedAttack = m.indices[g.rng.next(a.hp <= m.hpAtMost ? m.low : m.high)] ?? 0),
    );
  }
  const roll = g.rng.next(100);
  let cumulative = 0,
    index = 0;
  for (let i = 1; i < p.attacks.length; i++) {
    if (
      p.attacks[i].abilityBuff &&
      a.buffs.some((b) => b.type === "DreamBossAbility" && b.until > g.time)
    )
      continue;
    if (
      p.attacks[i].defenceBuff &&
      a.buffs.some((b) => b.type === "DreamBossDefence" && b.until > g.time)
    )
      continue;
    const weight = wounded ? p.woundedSelection.weights[i] : (p.attacks[i].weight ?? 0),
      previous = cumulative;
    cumulative += weight;
    if (roll > previous && roll <= cumulative) {
      index = i;
      break;
    }
  }
  s.bossSelectedAttack = index;
  return index;
}
function dreamBossRange(g, a) {
  const p = monsterCombatProfile(g, a);
  if (!p || !["nativePercent", "nativeModulo"].includes(p.selection)) return p?.range;
  const index = nativeAttackIndex(g, a, p),
    action = p.attacks[index];
  const clock =
    action.cooldownIndex !== void 0
      ? "bossActionRecover" + action.cooldownIndex
      : action.ownCooldown
        ? "bossActionRecover" + index
        : p.independentRecovery
          ? "bossActionRecover0"
          : "bossRecoverAt";
  if (action.executeMs !== void 0) a.attackAt = Number(a.special?.[clock] ?? 0) + action.executeMs;
  else if (p.recoverBeforeInterval)
    a.attackAt = Number(a.special?.[clock] ?? 0) + monsterAttackSpeed(g, a);
  const target = g.actor(a.target),
    dx = target ? Math.abs(target.x - a.x) : 0,
    dy = target ? Math.abs(target.y - a.y) : 0;
  if (
    target &&
    ((action.alignedOnly && dx && dy && dx !== dy) ||
      dx > (action.rangeX ?? Infinity) ||
      dy > (action.rangeY ?? Infinity))
  )
    return 0;
  return action.range ?? p.range;
}
function attackDreamBoss(g, a, target) {
  const p = monsterCombatProfile(g, a);
  if (!p) return false;
  const s = (a.special ??= {}),
    phase = Number(s.bossAttackPhase || 0) % p.attacks.length;
  let selected = phase;
  if (["nativePercent", "nativeModulo"].includes(p.selection))
    selected = nativeAttackIndex(g, a, p);
  if (p.selection === "weighted") {
    const total = p.attacks.reduce((n, v) => n + (v.weight || 0), 0);
    let roll = g.rng.next(total);
    selected = p.attacks.findIndex((v) => (roll -= v.weight || 0) < 0);
  }
  const action = p.attacks[selected];
  const dx = Math.abs(target.x - a.x),
    dy = Math.abs(target.y - a.y);
  if (
    (action.alignedOnly && dx && dy && dx !== dy) ||
    dx > (action.rangeX ?? Infinity) ||
    dy > (action.rangeY ?? Infinity)
  )
    return true;
  if (
    ["nativePercent", "nativeModulo"].includes(p.selection) &&
    (distance(a, target) > (action.range ?? p.range) ||
      distance(a, target) < (action.minimumDistance ?? 0))
  )
    return true;
  delete s.bossSelectedAttack;
  s.bossAttackPhase = phase + 1;
  s.bossLastAttackAt = g.time;
  a.dir = direction(a, target);
  if (a.dir < 0) a.dir = 0;
  a.attackAt = g.time + monsterAttackSpeed(g, a);
  a.actionAt =
    g.time + (action.actionMs ?? (p.actionMs === 300 ? monsterActionCost(g, a, true) : p.actionMs));
  if (p.selection === "cycle" && g.monsters.get(a.definition)?.DreamRaw)
    a.attackAt = a.actionAt + monsterAttackSpeed(g, a);
  s.bossRecoverAt = a.actionAt;
  s["bossActionRecover" + selected] = a.actionAt;
  if (action.teleportToTarget) {
    const owner =
      action.teleportToTarget.petOwner && target.master ? g.actor(target.master) : void 0;
    const destination =
      owner && !owner.dead && owner.map === a.map && !g.safe(owner) ? owner : target;
    const at = g.freeNear(a.map, destination, action.teleportToTarget.radius);
    if (at) {
      a.x = at.x;
      a.y = at.y;
      a.dir = direction(a, destination);
      if (a.dir < 0) a.dir = 0;
      g.emit("ObjectTeleportIn", { ObjectID: a.id });
    }
  }
  if (action.abilityBuff) {
    const b = action.abilityBuff;
    g.buff(a, "DreamBossAbility", b.durationMs, 0, b.multiply, a.id);
  }
  if (action.directStatus) {
    const effect = action.directStatus;
    g.buff(target, effect.type, effect.durationMs, effect.value ?? 0, {}, a.id);
  }
  if (action.groundFire) createBossGroundFire(g, a, target, action.groundFire);
  const animation = action.animation ?? p.animation ?? "ObjectAttack",
    visual = action.visual ?? p.visual ?? "None",
    perTarget = action.visualPerTarget ?? p.visualPerTarget;
  if (action.casterVisual)
    g.emit("ObjectRangeAttack", {
      ObjectID: a.id,
      Direction: dirs[a.dir],
      TargetID: a.id,
      Spell: action.casterVisual,
      Action: action.visualAction,
      Duration: action.visualDurationMs ?? action.actionMs ?? p.actionMs,
    });
  if (!perTarget)
    g.emit(animation, {
      ObjectID: a.id,
      Direction: dirs[a.dir],
      TargetID: target.id,
      Spell: visual,
      Duration: action.visualDurationMs ?? action.actionMs ?? p.actionMs,
      Action: action.visualAction,
      Cast: animation === "ObjectMagic",
    });
  if (action.shield) g.buff(a, "DreamBossShield", action.shield.durationMs, action.shield.percent);
  if (action.defenceBuff) {
    const b = action.defenceBuff;
    a.hp = Math.min(a.maxHP, a.hp + Math.floor((a.maxHP * b.healPercent) / 100));
    g.buff(a, "DreamBossDefence", b.durationMs, 0, {
      MinAC: b.amount,
      MaxAC: b.amount,
      MinMAC: b.amount,
      MaxMAC: b.amount,
    });
  }
  if (p.attackSummon) {
    if (s.guideSummoned) s.attackSummonDone = true;
    summon(g, a, p.attackSummon, "attackSummon");
  }
  if (action.summon) {
    if (s.guideSummoned) s["actionSummon" + selected + "Done"] = true;
    summon(g, a, action.summon, "actionSummon" + selected);
  }
  if (action.channel) {
    s.bossChannelIndex = selected;
    s.bossChannelNext = g.time + action.channel.intervalMs;
    s.bossChannelUntil = g.time + action.channel.durationMs;
  }
  deliverBossHits(g, a, target, p, action, action.hits);
  if (p.suicideAttack) {
    if (a.spawn !== void 0) {
      g.map(a.map).respawns[a.spawn] =
        g.time + g.region(a.map).spawns[a.spawn].respawnMinutes * 6e4;
      a.spawn = void 0;
    }
    a.dead = true;
    a.hp = 0;
    a.target = 0;
    a.expires = g.time + 1e4;
    g.emit("ObjectDied", { ObjectID: a.id, Direction: dirs[a.dir] });
  }
  return true;
}


function deliverBossHits(g, a, target, p, action, hits) {
  const s = (a.special ??= {}),
    damage = p.randomPerTarget ? 0 : attackPower(a.stats, "DC", g.rng);
  const enemies2 = [g.me, ...g.map(a.map).actors.filter((m) => m.friendly)].filter(
    (m) => m && !m.dead && m.map === a.map && !g.safe(m),
  );
  const animation = action.animation ?? p.animation ?? "ObjectAttack",
    visual = action.visual ?? p.visual ?? "None",
    perTarget = action.visualPerTarget ?? p.visualPerTarget;
  for (const h of hits) {
    let targets = enemies2.filter((m) => {
      if (h.excludePrimary && m.id === target.id) return false;
      if (h.shape === "selfArea")
        return (
          Math.abs(m.x - a.x) <= (h.rangeX ?? h.radius) &&
          Math.abs(m.y - a.y) <= (h.rangeY ?? h.radius)
        );
      if (h.shape === "targetArea")
        return (
          Math.abs(m.x - target.x) <= (h.rangeX ?? h.radius) &&
          Math.abs(m.y - target.y) <= (h.rangeY ?? h.radius)
        );
      if (h.shape === "forwardArea") {
        const [dx, dy] = vectors[a.dir];
        return (
          distance(m, { x: a.x + dx * (h.forward ?? 2), y: a.y + dy * (h.forward ?? 2) }) <=
          h.radius
        );
      }
      if (h.shape === "line") {
        const [dx, dy] = vectors[a.dir],
          n = dx ? (m.x - a.x) / dx : (m.y - a.y) / dy;
        return n > 0 && n <= h.radius && m.x === a.x + n * dx && m.y === a.y + n * dy;
      }
      return m.id === target.id && distance(a, m) <= Math.max(action.range ?? p.range, h.radius);
    });
    if (h.scatterRadius !== void 0) {
      const centers = targets;
      targets = centers.flatMap((center) =>
        enemies2.filter((m) => distance(m, center) <= h.scatterRadius),
      );
    }
    if (perTarget)
      g.emit("ObjectMagic", {
        ObjectID: a.id,
        Cast: true,
        Direction: dirs[a.dir],
        Action: action.visualAction,
        Duration: action.visualDurationMs ?? action.actionMs ?? p.actionMs,
      });
    if (perTarget)
      for (const m of new Map(targets.map((m2) => [m2.id, m2])).values())
        g.emit(animation, {
          ObjectID: a.id,
          Direction: dirs[a.dir],
          TargetID: m.id,
          Spell: visual,
          Action: action.visualAction,
          Duration: action.visualDurationMs ?? action.actionMs ?? p.actionMs,
        });
    if (targets.some((m) => m.kind === "player")) s.bossLastPlayerHitAt = g.time;
    for (const m of targets) {
      const power = p.randomPerTarget ? attackPower(a.stats, "DC", g.rng) : damage;
      let raw =
        h.currentHPScale !== void 0
          ? Math.floor(m.hp * h.currentHPScale)
          : h.maxHPScale !== void 0
            ? Math.floor(m.maxHP * h.maxHPScale)
            : Math.floor((h.defence === "None" ? a.stats.MaxDC || power : power) * h.scale);
      let defence = h.defence;
      if (h.addPowerToHPScale) {
        if (m.kind === "player") raw += power;
        else raw = Math.floor(m.maxHP * (h.petsMaxHPScale ?? 0));
      }
      if (h.subtractMPDivisor && m.kind === "player") {
        const r = m;
        r.mp -= Math.floor(r.mp / h.subtractMPDivisor);
      }
      if (h.bypassChanceOneIn && g.rng.next(h.bypassChanceOneIn) === 0) {
        defence = h.defence.startsWith("MAC") ? "MACBypass" : "ACBypass";
        raw = Math.min(raw, Math.floor((m.maxHP * (h.capMaxHPPercent ?? 100)) / 100));
      }
      if (h.drainHalfMP) {
        if (m.kind === "player") {
          const r = m;
          raw = Math.floor(r.mp / 2);
          r.mp -= raw;
        } else raw = Math.floor(m.maxHP * (h.petsMaxHPScale ?? 0.05));
      }
      if (h.rawHealScale) a.hp = Math.min(a.maxHP, a.hp + Math.floor(raw * h.rawHealScale));
      if (p.suicideAttack) g.damage(a, m, raw, defence, h.spell);
      else
        g.schedule(
          "hit",
          (action.hitDelayMs ?? p.hitDelayMs) + distance(a, m) * (p.distanceDelayMs ?? 0),
          a,
          m,
          raw,
          defence,
          h.spell,
        );
    }
  }
}
function dreamBossAfterHit(g, source, target, amount, spell) {
  if (amount <= 0) return;
  const native = g.monsters.get(source.definition)?.DreamOnHit;
  if (native && target.kind === "player" && !target.dead && target.hp > 0) {
    if (native.stoneChancePercent && g.rng.next(100) < native.stoneChancePercent)
      g.buff(target, "Paralysis", native.stoneDurationMs || 2e3, 0, {}, source.id);
    if (native.poisonChancePercent && g.rng.next(100) < native.poisonChancePercent)
      g.buff(
        target,
        "Green",
        native.poisonDurationMs || 8e3,
        native.poisonValue || 8,
        {},
        source.id,
      );
  }
  const profile = monsterCombatProfile(g, source);
  if (profile?.healOwnerPercent && source.master) {
    const owner = g.actor(source.master);
    if (owner && !owner.dead && owner.map === source.map)
      owner.hp = Math.min(
        owner.maxHP,
        owner.hp + Math.floor((amount * profile.healOwnerPercent) / 100),
      );
  }
  if (target.dead || !spell) return;
  const statuses = monsterCombatProfile(g, source)?.statuses?.[spell];
  if (!statuses) return;
  const s = (source.special ??= {});
  for (const effect of statuses) {
    const key = "bossStatusAt:" + spell + ":" + effect.type;
    if (g.time < Number(s[key] ?? (spell === "DragonParalysis" ? s.dragonParalysisAt : 0) ?? 0))
      continue;
    const value = effect.powerStat
      ? attackPower(source.stats, effect.powerStat, g.rng)
      : effect.damageDivisor
        ? Math.max(1, Math.floor(amount / effect.damageDivisor))
        : (effect.value ?? 0);
    if (
      effect.poisonResist &&
      g.rng.next(g.rules.constants.PoisonResistWeight) < (target.stats.PoisonResist || 0)
    )
      continue;
    if (effect.chanceOneIn && g.rng.next(effect.chanceOneIn) !== 0) continue;
    if (effect.chancePercent < 100 && g.rng.next(100) >= effect.chancePercent) continue;
    const applied = g.buff(target, effect.type, effect.durationMs, value, {}, source.id);
    if (effect.tickMs && applied && applied.interval !== effect.tickMs) {
      applied.interval = effect.tickMs;
      applied.next = g.time + effect.tickMs;
    }
    if (effect.cooldownMs) s[key] = g.time + effect.cooldownMs;
  }
}
function resolveNativeBossHit(g, a, target, dealt, spell) {
  if (a.dead || g.safe(target) || !spell) return;
  const h = monsterCombatProfile(g, a)
    ?.attacks.flatMap((x) => x.hits)
    .find((h2) => h2.spell === spell);
  if (!h) return;
  let heal = Math.floor(dealt * (h.healScale ?? 0));
  if (h.mpDivisor && target.kind === "player" && !target.dead) {
    const r = target,
      remaining = Math.floor(r.mp / h.mpDivisor);
    if (remaining > 0) {
      r.mp = remaining;
      if (h.healRemainingMP) heal += remaining;
    }
  }
  if (heal > 0) a.hp = Math.min(a.maxHP, a.hp + heal);
}
function announceTrialRevivals(g, a) {
  if (a.special?.trialFloor !== 52) return;
  const revivals = monsterCombatProfile(g, a)?.revivals;
  if (revivals)
    g.say(
      message("trial.revivalsRemaining", {
        count: revivals.count - Number(a.special.nativeRevivals || 0),
      }),
    );
}
function reviveNativeBoss(g, a) {
  const c = monsterCombatProfile(g, a)?.revivals;
  if (!c) return false;
  const s = (a.special ??= {}),
    used = Number(s.nativeRevivals || 0);
  if (used >= c.count) return false;
  s.nativeRevivals = used + 1;
  g.refreshActor(a);
  a.hp = a.maxHP;
  g.emit("ObjectRevived", { ObjectID: a.id, Effect: true });
  announceTrialRevivals(g, a);
  return true;
}

// games/darkforged/singleplayer/core/trial.ts
var trialState = (r) => (r.trial ??= { stage: 0, honor: 0, title: 0, day: 0, attempts: 0 });
function trialPage(g, r) {
  const p = trialState(r),
    cfg = g.rules.adaptations.trial,
    title = cfg.titles[p.title - 1],
    next = cfg.titles[p.title];
  const line = (key, params = {}) => ({ $dialogue: [{ label: message(key, params) }] });
  const action = (key, action2) => ({ $dialogue: [{ label: message(key), action: action2 }] });
  const intro = [
    action("trial.learn", "@triallearn"),
    {
      $dialogue: [
        { label: message("trial.bringAmulet") },
        { label: message("trial.deliver"), action: "@triallearn" },
      ],
    },
    {
      $dialogue: [
        { label: message("trial.bringPumpkin") },
        { label: message("trial.deliver"), action: "@triallearn" },
      ],
    },
  ];
  return [
    line("trial.status", {
      honor: p.honor,
      title: title ? entityText("honorTitles", p.title) : message("trial.noTitle"),
    }),
    ...(r.trialRun
      ? [
          line("trial.floor", {
            floor: r.trialRun.floor,
            status: message(r.trialRun.cleared ? "trial.cleared" : "trial.kill"),
          }),
          action("trial.next", "@trialnext"),
          action("trial.leave", "@trialleave"),
        ]
      : p.stage < 3
        ? [intro[p.stage]]
        : [action("trial.enter", "@trialenter")]),
    ...(next
      ? [
          line("trial.nextTitle", {
            title: entityText("honorTitles", p.title + 1),
            cost: next.cost,
          }),
          action("trial.promote", "@trialtitle"),
        ]
      : []),
  ];
}
function trialAction(g, r, key, day = Math.floor((Date.now() + 8 * 36e5) / 864e5)) {
  const cfg = g.rules.adaptations.trial,
    n = g.requireNPC(r),
    p = trialState(r);
  if (![cfg.entranceNpc, cfg.insideNpc].includes(n.id))
    throw new LocalizedError(message("core.trial.trialAction.3106f8fba7"));
  if (key === "@triallearn") {
    if (p.stage >= 3) throw new LocalizedError(message("core.trial.trialAction.182420f9c1"));
    const name =
      p.stage === 1 ? "\u9ED1\u94C1\u62A4\u7B26" : p.stage === 2 ? "\u5357\u74DC\u5934" : null;
    if (name) {
      const candidates = r.inventory.filter((i) => i && g.defs.get(i.id)?.DreamName === name),
        item = candidates.find((i) => !dxFavoriteProtected(g, i));
      if (!item) {
        assertDxDisposable(g, candidates[0]);
        throw new LocalizedError(
          message("core.trial.trialAction.3ac3294db7", {
            p0: entityText("items", g.rules.items.find((d) => d.DreamName === name).Index),
          }),
        );
      }
      r.inventory[r.inventory.indexOf(item)] = null;
      r.gold += 5e4;
    }
    g.gainXP(r, p.stage ? 5e4 : 1e4);
    p.stage++;
    g.say(message("core.trial.trialAction.835adcbc64", { p0: p.stage }));
  } else if (key === "@trialtitle") {
    const title = cfg.titles[p.title];
    if (!title) throw new LocalizedError(message("core.trial.trialAction.6026d8c966"));
    if (p.honor < title.cost)
      throw new LocalizedError(message("core.trial.trialAction.7c06dbef5c", { p0: title.cost }));
    p.honor -= title.cost;
    p.title++;
    g.refresh(r);
    g.say(message("core.trial.trialAction.8579f91ac6", { p0: entityText("honorTitles", p.title) }));
  } else if (key === "@trialenter") {
    if (n.id !== cfg.entranceNpc || p.stage < 3)
      throw new LocalizedError(message("core.trial.trialAction.943cc78060"));
    if (r.trialRun || r.challengeRun || r.treasureRun)
      throw new LocalizedError(message("core.trial.trialAction.381831c37b"));
    if (p.day !== day) {
      p.day = day;
      p.attempts = 0;
    }
    if (p.attempts >= cfg.attempts)
      throw new LocalizedError(message("core.trial.trialAction.149859ba4e"));
    const m = g.region(cfg.map),
      geo = g.geometry.get(cfg.map);
    if (!geo || geo.solid[m.center[1] * geo.width + m.center[0]])
      throw new LocalizedError(message("core.trial.trialAction.7d65345670"));
    const landing = g.freeNear(cfg.map, { x: m.center[0], y: m.center[1] }, 3);
    if (!landing) throw new LocalizedError(message("core.trial.trialAction.293bc02306"));
    p.attempts++;
    r.trialRun = { floor: 0, deadline: g.time + cfg.minutes * 6e4, cleared: true, pendingHonor: 0 };
    g.maps[cfg.map] = { actors: [], respawns: {} };
    r.map = cfg.map;
    r.x = landing.x;
    r.y = landing.y;
    r.target = 0;
    g.bringPets(r);
    g.emit("MapChanged", { MapIndex: r.map });
    g.npc = cfg.insideNpc;
    g.say(message("core.trial.trialAction.ed3265354e"));
  } else if (key === "@trialnext") {
    const run = r.trialRun;
    if (!run || n.id !== cfg.insideNpc || r.map !== cfg.map)
      throw new LocalizedError(message("core.trial.trialAction.ac9b21455d"));
    if (!run.cleared) throw new LocalizedError(message("core.trial.trialAction.ae8fb3994e"));
    if (run.floor >= 99) {
      leaveTrial(g, r, message("trial.complete"));
      return;
    }
    const row = cfg.floors[run.floor],
      def = g.rules.monsters.find((d) => d.Name === row.monster),
      at = g.freeNear(r.map, { x: r.x + 4, y: r.y }, 8);
    if (!at) throw new LocalizedError(message("core.trial.trialAction.a3744f6549"));
    settleTrialHonor(r);
    run.floor++;
    run.cleared = false;
    g.map(r.map).actors = g.map(r.map).actors.filter((a2) => a2.friendly || a2.kind !== "monster");
    const a = g.newMonster(def, r.map, at);
    a.hp = a.maxHP = row.hp;
    a.stats.HP = row.hp;
    a.special = { ...a.special, trialFloor: run.floor, trialXP: row.xp, trialBoss: row.boss };
    g.map(r.map).actors.push(a);
    g.say(message("core.trial.trialAction.43bd68bc0b", { p0: run.floor, p1: p.honor }));
    announceTrialRevivals(g, a);
  } else if (key === "@trialleave") {
    leaveTrial(g, r);
    return;
  }
  g.emit("NPCResponse", { NPCID: n.id, Page: [] });
}
function settleTrialHonor(r) {
  const run = r.trialRun;
  if (!run) return;
  const amount = Math.max(0, run.pendingHonor || 0);
  if (amount && run.settledFloor !== run.floor) {
    trialState(r).honor += amount;
    run.settledFloor = run.floor;
  }
  run.pendingHonor = 0;
}
function trialKill(g, r) {
  const run = r.trialRun;
  if (!run || run.cleared || r.map !== g.rules.adaptations.trial.map) return;
  const row = g.rules.adaptations.trial.floors[run.floor - 1];
  if (!row) return;
  run.cleared = true;
  run.pendingHonor = row.honor;
  settleTrialHonor(r);
  g.say(message("core.trial.trialKill.a5ad08e078", { p0: run.floor, p1: row.honor }));
  if (run.floor === 99) leaveTrial(g, r, message("trial.completeFinal"));
}
function leaveTrial(g, r, message2 = message("trial.left")) {
  if (!r.trialRun) return;
  settleTrialHonor(r);
  const cfg = g.rules.adaptations.trial,
    map2 = cfg.map,
    entrance = g.rules.world.npcs.find((n) => n.id === cfg.entranceNpc);
  const candidates = [];
  for (let radius = 1; radius <= 3; radius++)
    for (let dy = -radius; dy <= radius; dy++)
      for (let dx = -radius; dx <= radius; dx++)
        if (Math.max(Math.abs(dx), Math.abs(dy)) === radius)
          candidates.push({ x: entrance.at[0] + dx, y: entrance.at[1] + dy });
  const spot = candidates.find(
    (p) =>
      !g.rules.world.npcs.some(
        (n) => n.map === entrance.map && n.at[0] === p.x && n.at[1] === p.y,
      ) && g.walkable(entrance.map, p.x, p.y, r.id),
  );
  if (!spot) throw new LocalizedError(message("core.trial.leaveTrial.8e8b1271cf"));
  delete r.trialRun;
  r.map = entrance.map;
  r.x = spot.x;
  r.y = spot.y;
  r.target = 0;
  r.dead = false;
  r.hp = r.maxHP;
  r.mp = r.maxMP;
  r.buffs = [];
  g.npc = 0;
  delete g.maps[map2];
  g.events = g.events.filter((e) => e.map !== map2);
  g.bringPets(r);
  g.emit("MapChanged", { MapIndex: entrance.map });
  g.emit("NPCResponse", { NPCID: 0, Page: [] });
  g.say(message2);
}
function trialTick(g, r) {
  if (r.trialRun && (r.map !== g.rules.adaptations.trial.map || g.time >= r.trialRun.deadline))
    leaveTrial(g, r, message("trial.ended"));
}

// games/darkforged/singleplayer/core/character-save.ts
function characterSave(source, rules) {
  const roles = structuredClone(source.roles);
  for (const r of roles) {
    unlockArrivalWaypoints(r, rules);
    const home = residence(r, rules);
    if (r.sunPotionAt !== void 0) r.sunPotionAt = sunPotionRemaining(r, source.time);
    if (r.itemCooldowns)
      r.itemCooldowns = {
        snow: Math.max(0, Math.min(SNOW_COOLDOWN_MS, (r.itemCooldowns.snow || 0) - source.time)),
      };
    const dx = rules.adaptations.diablo;
    if (
      dx?.enabled &&
      (r.special?.dxSecondWindReady !== void 0 || r.special?.dxCheatDeathReady !== void 0)
    ) {
      r.dxCooldowns ??= {};
      if (r.dxCooldowns.secondWind === void 0 && typeof r.special.dxSecondWindReady === "number")
        r.dxCooldowns.secondWind = r.special.dxSecondWindReady;
      if (r.dxCooldowns.cheatDeath === void 0 && typeof r.special.dxCheatDeathReady === "number")
        r.dxCooldowns.cheatDeath = r.special.dxCheatDeathReady;
    }
    if (r.dxCooldowns)
      for (const key of ["secondWind", "cheatDeath"]) {
        const deadline = r.dxCooldowns[key];
        if (deadline !== void 0)
          r.dxCooldowns[key] = Math.max(
            0,
            Math.min(
              key === "secondWind"
                ? (dx?.secondWindCooldownMs ?? 6e4)
                : (dx?.cheatDeathCooldownMs ?? 18e4),
              deadline - source.time,
            ),
          );
      }
    settleTrialHonor(r);
    Object.assign(r, {
      homeTown: home.id,
      map: home.map,
      x: home.at[0],
      y: home.at[1],
      target: 0,
      dead: false,
      hp: Math.max(1, r.hp),
      stats: {},
      buffs: [],
      actionAt: 0,
      attackAt: 0,
      moveAt: 0,
      spellAt: 0,
      potAt: 0,
      healAt: 0,
      regenAt: 1e4,
      potHP: 0,
      potMP: 0,
      healHP: 0,
    });
    delete r.nativeHealing;
    delete r.nativeRecovery;
    for (const key of [
      "flamingSword",
      "blazingSword",
      "slaying",
      "counterAttack",
      "twinDrakeBlade",
      "channel",
    ])
      r.attackModes[key] = false;
    delete r.treasureRun;
    delete r.challengeRun;
    delete r.trialRun;
    delete r.mountUid;
    const unlockCurse = r.special?.unlockCurse;
    delete r.special;
    if (unlockCurse) r.special = { unlockCurse: true };
    for (const skill of r.skills) skill.CastTime = 0;
    for (const items of Object.values(r.buyback || {}))
      for (const item of items) item.buybackAt = 0;
  }
  return {
    ...(hasSharedStorage(rules)
      ? {
          sharedStorageGame: sharedStorageGame(rules),
          sharedStorageVersion: 1,
          sharedStorage: structuredClone(source.sharedStorage ?? Array(80).fill(null)),
        }
      : {}),
    version: 1,
    storageMode: "character-only",
    worldVersion: source.worldVersion,
    rulesVersion: source.rulesVersion,
    dreamRuntimeVersion: source.dreamRuntimeVersion,
    time: 0,
    nextId: source.nextId,
    rng: structuredClone(source.rng),
    roles,
    maps: {},
    events: [],
    nextOrder: 0,
    lastSaved: source.lastSaved,
    ...(source.sync ? { sync: structuredClone(source.sync) } : {}),
  };
}

// games/darkforged/singleplayer/storage.ts
var SAVE_DATABASE = "dream-mir-darkforged-v2";
var LEGACY_SAVE_DATABASE = "dream-mir-typescript-v1";
function validateSave(value, rules) {
  if (!value || typeof value !== "object")
    throw new LocalizedError(message("storage.invalidFormat"));
  const version = value.worldVersion;
  if (version !== void 0 && (!Number.isSafeInteger(version) || version < 1))
    throw new LocalizedError(message("storage.worldVersion"));
  const dreamVersion = value.dreamRuntimeVersion;
  if (
    dreamVersion !== void 0 &&
    (!Number.isSafeInteger(dreamVersion) ||
      dreamVersion < 1 ||
      dreamVersion > (rules.adaptations.dreamRuntime?.version ?? 0))
  )
    throw new LocalizedError(message("storage.dreamVersion"));
  const s = migrateDreamRuntime(migrateWorldSave(value, rules), rules);
  if (s.sync) {
    const m = s.sync,
      record = (v) => !!v && typeof v === "object" && !Array.isArray(v),
      stamp = (v) => v === null || (typeof v === "string" && Number.isFinite(Date.parse(v)));
    if (
      m.protocol !== 2 ||
      m.projectionVersion !== 2 ||
      (m.ownerId !== null &&
        (typeof m.ownerId !== "string" || !m.ownerId.length || m.ownerId.length > 200)) ||
      typeof m.deviceId !== "string" ||
      m.deviceId.length > 200 ||
      typeof m.deviceName !== "string" ||
      m.deviceName.length > 100 ||
      !(m.baseRevision === null || (Number.isSafeInteger(m.baseRevision) && m.baseRevision >= 0)) ||
      !record(m.baseRoles) ||
      !Object.values(m.baseRoles).every((v) => typeof v === "string") ||
      !record(m.tombstones) ||
      !Object.values(m.tombstones).every(
        (v) => record(v) && (v.deletedAt === void 0 || stamp(v.deletedAt)),
      ) ||
      !Number.isSafeInteger(m.progressSeq) ||
      m.progressSeq < 0 ||
      !stamp(m.lastProgressAt) ||
      !stamp(m.checkpointWrittenAt) ||
      !(
        m.serverConfirmedAt === null ||
        (Number.isSafeInteger(m.serverConfirmedAt) && m.serverConfirmedAt >= 0)
      )
    )
      throw new LocalizedError(message("storage.invalidFormat"));
  }
  if (
    s.worldVersion !== void 0 &&
    (!Number.isInteger(s.worldVersion) ||
      s.worldVersion > (rules.adaptations.mainline?.worldVersion ?? 1))
  )
    throw new LocalizedError(message("storage.worldVersion"));
  if (s.version !== 1 || s.rulesVersion !== rules.version)
    throw new LocalizedError(message("storage.version"));
  if (
    !Array.isArray(s.roles) ||
    s.roles.length > 6 ||
    !s.maps ||
    !Array.isArray(s.events) ||
    !s.rng ||
    s.rng.seed?.length !== 56
  )
    throw new LocalizedError(message("storage.structure"));
  const integer = (n, min = 0, max = Number.MAX_SAFE_INTEGER) =>
    Number.isSafeInteger(n) && n >= min && n <= max;
  if (
    !integer(s.time) ||
    !integer(s.nextId) ||
    !integer(s.nextOrder) ||
    !integer(s.rng.i, 0, 55) ||
    !integer(s.rng.j, 0, 55) ||
    !s.rng.seed.every((v) => integer(v, 0, 2147483647))
  )
    throw new LocalizedError(message("storage.clock"));
  const ids = /* @__PURE__ */ new Set(),
    cloudIds = /* @__PURE__ */ new Set(),
    defs = new Map(rules.items.map((i) => [i.Index, i])),
    maps = new Set(rules.world.maps.map((m) => m.id));
  const stats2 = (v) =>
    !!v && typeof v === "object" && !Array.isArray(v) && Object.values(v).every(Number.isFinite);
  const potential = (p) =>
    !!p &&
    typeof p.name === "string" &&
    p.name.length <= 100 &&
    stats2(p.stats) &&
    integer(p.rolls, 1, 5);
  const item = (i) => {
    if (
      (i.gemCount !== void 0 && !integer(i.gemCount, 0, 65535)) ||
      (i.buybackAt !== void 0 && !integer(i.buybackAt)) ||
      !defs.has(i.id) ||
      !integer(i.uid) ||
      ids.has(i.uid) ||
      !integer(i.count, 1, 65535) ||
      !integer(i.currentDura) ||
      !integer(i.maxDura) ||
      i.currentDura > i.maxDura ||
      !stats2(i.added) ||
      (i.weaponGrowth !== void 0 &&
        (!integer(i.weaponGrowth.level, 0, 30) || !integer(i.weaponGrowth.xp, 0, 31e5))) ||
      (i.potential !== void 0 && !potential(i.potential)) ||
      (i.potentialOptions !== void 0 &&
        (!Array.isArray(i.potentialOptions) ||
          i.potentialOptions.length > 5 ||
          !i.potentialOptions.every(potential))) ||
      (i.handmade !== void 0 && typeof i.handmade !== "boolean") ||
      (i.noSharedStorage !== void 0 && typeof i.noSharedStorage !== "boolean") ||
      (i.locked !== void 0 && typeof i.locked !== "boolean") ||
      (i.bound !== void 0 && typeof i.bound !== "boolean") ||
      (i.dxFavorite !== void 0 &&
        (typeof i.dxFavorite !== "boolean" || !dxFavoriteEligible(i, defs.get(i.id)))) ||
      (i.chestReward !== void 0 &&
        (!i.chestReward ||
          !integer(i.chestReward.item, 1) ||
          !integer(i.chestReward.points, 0, 8) ||
          !rules.adaptations.chestItems?.chests[String(i.id)]?.items[String(i.chestReward.item)] ||
          !Object.hasOwn(
            rules.adaptations.chestItems.chests[String(i.id)].points,
            String(i.chestReward.points),
          ) ||
          i.count !== 1)) ||
      (i.materialQuality !== void 0 && !integer(i.materialQuality, 1, 1e4)) ||
      (i.specialVersion !== void 0 && i.specialVersion !== 1) ||
      !validDxState(i.dx) ||
      (i.affixes !== void 0 &&
        (!Array.isArray(i.affixes) ||
          i.affixes.length > 8 ||
          i.affixes.some(
            (a) =>
              !a ||
              !(integer(a.group, 1, 79) || h5AffixTypes.has(a.group)) ||
              !(integer(a.type, 9, 85) || h5AffixTypes.has(a.type)) ||
              !integer(a.low) ||
              !integer(a.high, a.low, 1e4) ||
              !integer(a.rate, 0, 100) ||
              typeof a.revealed !== "boolean" ||
              typeof a.text !== "string" ||
              a.text.length > 500,
          )))
    )
      throw new LocalizedError(message("storage.items"));
    if (i.dxFavorite === false) delete i.dxFavorite;
    if (i.locked !== void 0) {
      if (i.locked && equipmentLockable(i, defs.get(i.id))) i.dxFavorite = true;
      delete i.locked;
    }
    if (i.weaponGrowth && i.weaponGrowth.level >= weaponGrowthRule.cap)
      i.weaponGrowth = { level: weaponGrowthRule.cap, xp: 0 };
    migrateItemAffixes(
      i,
      rules.items.find((d) => d.Index === i.id),
      rules.adaptations.dreamRuntime?.affixes,
    );
    migrateChestReward(i, rules);
    ids.add(i.uid);
  };
  const actor = (a) => {
    if (
      !integer(a.id) ||
      ids.has(a.id) ||
      !maps.has(a.map) ||
      !integer(a.x) ||
      !integer(a.y) ||
      !integer(a.dir, 0, 7) ||
      !Number.isFinite(a.hp) ||
      !Number.isFinite(a.maxHP) ||
      !stats2(a.stats) ||
      !Array.isArray(a.buffs) ||
      ![a.actionAt, a.moveAt, a.attackAt].every((n) => integer(n))
    )
      throw new LocalizedError(message("storage.actor"));
    ids.add(a.id);
    for (const b of a.buffs)
      if (
        (b.spell !== void 0 && typeof b.spell !== "string") ||
        typeof b.type !== "string" ||
        !integer(b.until) ||
        !integer(b.next) ||
        !Number.isFinite(b.value) ||
        !stats2(b.stats) ||
        !integer(b.source)
      )
        throw new LocalizedError(message("storage.buffs"));
  };
  for (const r of s.roles) {
    if (
      r.cloudId !== void 0 &&
      (typeof r.cloudId !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(r.cloudId))
    )
      throw new LocalizedError(message("storage.role"));
    if (r.cloudId) {
      if (cloudIds.has(r.cloudId) || Object.hasOwn(s.sync?.tombstones ?? {}, r.cloudId))
        throw new LocalizedError(message("storage.role"));
      cloudIds.add(r.cloudId);
    }
    if (
      (r.sunPotionAt !== void 0 && !integer(r.sunPotionAt)) ||
      (r.itemCooldowns !== void 0 &&
        (!r.itemCooldowns ||
          Array.isArray(r.itemCooldowns) ||
          typeof r.itemCooldowns !== "object" ||
          Object.entries(r.itemCooldowns).some(
            ([key, n]) =>
              key !== "snow" ||
              !integer(n, 0, Math.min(Number.MAX_SAFE_INTEGER, s.time + SNOW_COOLDOWN_MS)),
          ))) ||
      (r.dxCooldowns !== void 0 &&
        (!r.dxCooldowns ||
          Array.isArray(r.dxCooldowns) ||
          typeof r.dxCooldowns !== "object" ||
          Object.entries(r.dxCooldowns).some(
            ([key, n]) =>
              !["secondWind", "cheatDeath"].includes(key) ||
              !integer(
                n,
                0,
                Math.min(
                  Number.MAX_SAFE_INTEGER,
                  s.time +
                    (key === "secondWind"
                      ? (rules.adaptations.diablo?.secondWindCooldownMs ?? 6e4)
                      : (rules.adaptations.diablo?.cheatDeathCooldownMs ?? 18e4)),
                ),
              ),
          ))) ||
      (r.mountUid !== void 0 && !integer(r.mountUid)) ||
      (r.claimedBlessing !== void 0 && typeof r.claimedBlessing !== "boolean") ||
      (r.unlockedWaypoints !== void 0 &&
        (!Array.isArray(r.unlockedWaypoints) ||
          new Set(r.unlockedWaypoints).size !== r.unlockedWaypoints.length ||
          r.unlockedWaypoints.some(
            (id) => !rules.adaptations.towns?.waypoints?.some((w) => w.id === id),
          ))) ||
      (r.homeTown !== void 0 &&
        !rules.adaptations.towns?.settlements.some((t) => t.id === r.homeTown)) ||
      (r.claimedMount !== void 0 && typeof r.claimedMount !== "boolean") ||
      (r.bagLayoutVersion !== void 0 && r.bagLayoutVersion !== 1) ||
      (r.storagePages !== void 0 && !integer(r.storagePages, 1, 3)) ||
      (r.bagExpansionRows !== void 0 &&
        !integer(r.bagExpansionRows, 0, rules.adaptations.bagExpansion.maxRows)) ||
      (r.claimedStarterTalisman !== void 0 && typeof r.claimedStarterTalisman !== "boolean") ||
      (r.firstScarecrowReward !== void 0 && typeof r.firstScarecrowReward !== "boolean") ||
      !integer(r.id) ||
      ids.has(r.id) ||
      !maps.has(r.map) ||
      !["Warrior", "Wizard", "Taoist"].includes(r.job) ||
      !integer(r.level, 1, 65535) ||
      !integer(r.gold) ||
      !integer(r.xp) ||
      !Number.isFinite(r.hp) ||
      !Number.isFinite(r.mp)
    )
      throw new LocalizedError(message("storage.role"));
    if (r.dxTutorial !== void 0 && !validDxTutorialProgress(r.dxTutorial))
      throw new LocalizedError(message("storage.role"));
    if (
      r.noviceBooks !== void 0 &&
      (!Array.isArray(r.noviceBooks) ||
        r.noviceBooks.length > 6 ||
        new Set(r.noviceBooks).size !== r.noviceBooks.length ||
        r.noviceBooks.some(
          (spell) =>
            ![
              "Fencing",
              "FireBall",
              "SummonSpiritServant",
              "HeavyStrike",
              "GreatFireBall",
              "SoulFireBall",
            ].includes(spell),
        ))
    )
      throw new LocalizedError(message("storage.role"));
    if (r.spiritProgress !== void 0) {
      const p = r.spiritProgress,
        cfg = rules.adaptations.noviceProgression?.spiritGrowth;
      if (
        !p ||
        !cfg ||
        ![void 0, 1, 2, 3, 4].includes(p.curveVersion) ||
        !integer(p.level, 0, cfg.cap) ||
        !integer(
          p.xp,
          0,
          p.level === cfg.cap
            ? 0
            : (p.curveVersion === 4
                ? spiritNextXP(cfg, p.level)
                : p.curveVersion === 3
                  ? (cfg.thresholds?.[p.level] ?? (p.level + 1) * cfg.experienceStep)
                : p.curveVersion === 2
                  ? [2e3, 8e3, 2e4, 6e4, 1e5, 16e4, 21e4][p.level]
                  : (p.level + 1) * cfg.experienceStep) - 1,
        )
      )
        throw new LocalizedError(message("storage.role"));
      migrateSpiritProgress(r, cfg);
    }
    actor(r);
    if (
      r.assist &&
      (["autoMagic", "autoShield"].some(
        (k) => r.assist[k] !== void 0 && typeof r.assist[k] !== "boolean",
      ) ||
        (r.assist.autoMagicSpell !== void 0 &&
          !["auto", "FireBall", "GreatFireBall", "ThunderBolt", "FlameDisruptor"].includes(
            r.assist.autoMagicSpell,
          )))
    )
      throw new LocalizedError(message("storage.assist"));
    if (
      r.assist &&
      (["hpEnabled", "mpEnabled", "flamingSword"].some((k) => typeof r.assist[k] !== "boolean") ||
        (r.assist.blazingSword !== void 0 && typeof r.assist.blazingSword !== "boolean") ||
        !integer(r.assist.hpPercent, 1, 99) ||
        !integer(r.assist.mpPercent, 1, 99))
    )
      throw new LocalizedError(message("storage.assist"));
    if (
      r.trial &&
      (!integer(r.trial.stage, 0, 3) ||
        !integer(r.trial.honor) ||
        !integer(r.trial.title, 0, 15) ||
        !integer(r.trial.day) ||
        !integer(r.trial.attempts, 0, 3))
    )
      throw new LocalizedError(message("storage.trialProgress"));
    if (r.lateQuests !== void 0) {
      const p = r.lateQuests,
        record = (v) => !!v && typeof v === "object" && !Array.isArray(v);
      if (
        !record(p) ||
        Object.keys(p).some((k) => !["pearls", "altar", "blood"].includes(k)) ||
        (p.pearls !== void 0 &&
          (!record(p.pearls) ||
            typeof p.pearls.active !== "boolean" ||
            !integer(p.pearls.exchanges))) ||
        (p.altar !== void 0 && (!record(p.altar) || !integer(p.altar.stage, 0, 3))) ||
        (p.blood !== void 0 &&
          (!record(p.blood) || !integer(p.blood.stage, 0, 2) || !integer(p.blood.cycles)))
      )
        throw new LocalizedError(message("storage.progress"));
    }
    if (r.challengeRewards !== void 0) {
      const p = r.challengeRewards,
        receipt2 = (id) =>
          typeof id === "string" && id.length > 0 && id.length <= 100 && /^[\w:-]+$/.test(id);
      if (
        !p ||
        Array.isArray(p) ||
        !integer(p.sequence) ||
        !integer(p.poCompletions, 0, p.sequence) ||
        !Array.isArray(p.pending) ||
        !Array.isArray(p.claimed) ||
        !p.claimed.every(receipt2) ||
        new Set(p.claimed).size !== p.claimed.length ||
        p.pending.some(
          (row) =>
            !row ||
            !receipt2(row.runId) ||
            !Array.isArray(row.items) ||
            row.items.length < 1 ||
            row.items.length > 2 ||
            p.claimed.includes(row.runId),
        ) ||
        new Set(p.pending.map((row) => row.runId)).size !== p.pending.length
      )
        throw new LocalizedError(message("storage.challengeProgress"));
    }
    if (
      r.trialRun &&
      (!integer(r.trialRun.floor, 0, 99) ||
        !integer(r.trialRun.deadline) ||
        !integer(r.trialRun.pendingHonor) ||
        (r.trialRun.settledFloor !== void 0 &&
          !integer(r.trialRun.settledFloor, 0, r.trialRun.floor)) ||
        typeof r.trialRun.cleared !== "boolean" ||
        r.map !== rules.adaptations.trial?.map)
    )
      throw new LocalizedError(message("storage.trialState"));
    if (
      r.crafting &&
      (!integer(r.crafting.stage, 0, 2) ||
        !r.crafting.skills ||
        Object.entries(r.crafting.skills).some(
          ([k, s2]) =>
            !["ore", "wood", "gem", "cloth", "equipment"].includes(k) ||
            !integer(s2.level, 1, k === "equipment" ? 10 : 9) ||
            !integer(s2.xp),
        ))
    )
      throw new LocalizedError(message("storage.crafting"));
    if (
      r.itemHotkeys !== void 0 &&
      (!Array.isArray(r.itemHotkeys) ||
        r.itemHotkeys.length !== 6 ||
        r.itemHotkeys.some((id) => id !== null && (!integer(id) || !defs.has(id))))
    )
      throw new LocalizedError(message("storage.hotkeys"));
    if (
      r.ringHotkeys !== void 0 &&
      (!Array.isArray(r.ringHotkeys) ||
        r.ringHotkeys.length !== 6 ||
        r.ringHotkeys.some(
          (b) =>
            b !== null &&
            (!b ||
              ![7, 8].includes(b.slot) ||
              !b.teleport ||
              !b.original ||
              !integer(b.teleport.uid, 1) ||
              !integer(b.original.uid, 1) ||
              b.teleport.uid === b.original.uid ||
              !isTeleportRing(defs.get(b.teleport.id)) ||
              defs.get(b.original.id)?.Type !== "Ring"),
        ))
    )
      throw new LocalizedError(message("storage.progress"));
    if (r.challengeRun) {
      const run = r.challengeRun,
        c = rules.adaptations.guideChallenges?.find((c2) => c2.id === run.id);
      if (
        !c ||
        run.map !== c.map ||
        run.map !== r.map ||
        !integer(run.wave, 0, c.waves.length) ||
        typeof run.started !== "boolean" ||
        typeof run.cleared !== "boolean" ||
        !integer(run.deadline) ||
        !integer(run.nextWaveAt) ||
        (run.returnAt !== void 0 && !integer(run.returnAt)) ||
        (run.runId !== void 0 &&
          (typeof run.runId !== "string" ||
            run.runId.length > 100 ||
            !/^\d+:\d+$/.test(run.runId))) ||
        (run.branch !== void 0 && !["choice", "evil", "settle"].includes(run.branch)) ||
        (run.rewardSealed !== void 0 && typeof run.rewardSealed !== "boolean") ||
        (run.cleared && run.wave !== c.waves.length)
      )
        throw new LocalizedError(message("storage.challengeProgress"));
    }
    if (rules.adaptations.guideChallenges?.some((c) => c.map === r.map) && !r.challengeRun)
      throw new LocalizedError(message("storage.missingChallenge"));
    if (r.treasureRun) {
      const run = r.treasureRun;
      if (
        run.map !== rules.adaptations.adventure.mapIds[s.roles.indexOf(r)] ||
        !integer(run.wave, 0, 3) ||
        !integer(run.nextWaveAt) ||
        typeof run.cleared !== "boolean" ||
        typeof run.claimed !== "boolean" ||
        (run.claimed && !run.cleared) ||
        (run.cleared && run.wave !== 3) ||
        (run.cleared &&
          (!Array.isArray(run.rewards) || run.rewards.length < 1 || run.rewards.length > 2)) ||
        (run.rewards !== void 0 &&
          (!Array.isArray(run.rewards) ||
            run.rewards.some((v) => !defs.has(v.item) || !integer(v.count, 1, 20))))
      )
        throw new LocalizedError(message("storage.treasureProgress"));
    }
    if (rules.adaptations.adventure.mapIds.includes(r.map) && r.treasureRun?.map !== r.map)
      throw new LocalizedError(message("storage.missingTreasure"));
    for (const [field, length] of [
      ["inventory", carriedCapacity(r, rules)],
      ["equipment", 15],
      ["storage", 80 * (r.storagePages || 1)],
      ["questInventory", 40],
    ]) {
      const grid = r[field];
      if (
        !Array.isArray(grid) ||
        (grid.length !== length &&
          !(field === "inventory" && r.bagLayoutVersion === void 0 && isLegacyBag(r, rules)) &&
          !(field === "equipment" && grid.length === 14))
      )
        throw new LocalizedError(message("storage.inventory"));
      for (const i of grid) {
        if (!i) continue;
        item(i);
      }
    }
    for (const receipt2 of r.challengeRewards?.pending || [])
      for (const reward of receipt2.items) {
        if (
          reward.count !== 1 ||
          ![20828, { Warrior: 20864, Wizard: 20865, Taoist: 20866 }[r.job]].includes(reward.id)
        )
          throw new LocalizedError(message("storage.items"));
        item(reward);
      }
    if (
      !Array.isArray(r.skills) ||
      !Array.isArray(r.quests) ||
      !Array.isArray(r.completedQuests) ||
      !Array.isArray(r.buffs)
    )
      throw new LocalizedError(message("storage.progress"));
    const spells2 = /* @__PURE__ */ new Set();
    for (const sk of r.skills) {
      if (
        spells2.has(sk.Spell) ||
        !rules.skills.some((d) => d.Spell === sk.Spell) ||
        !integer(
          sk.Level,
          0,
          rules.skills.find((d) => d.Spell === sk.Spell)?.DreamRanks?.length || 3,
        ) ||
        !integer(sk.Experience) ||
        !integer(sk.CastTime)
      )
        throw new LocalizedError(message("storage.skills"));
      spells2.add(sk.Spell);
    }
    for (const q of r.quests)
      if (
        !rules.quests.some((d) => d.Index === q.id) ||
        !q.kills ||
        Object.values(q.kills).some((n) => !integer(n))
      )
        throw new LocalizedError(message("storage.quests"));
    for (const [npc, items] of Object.entries(r.buyback || {})) {
      if (
        (!rules.world.npcs.some((n) => n.id === Number(npc)) &&
          !rules.world.retiredNpcIds?.includes(Number(npc))) ||
        !Array.isArray(items) ||
        items.length > 20
      )
        throw new LocalizedError(message("storage.buyback"));
      items.forEach(item);
    }
  }
  for (const [map2, m] of Object.entries(s.maps)) {
    if (
      m.omaNorthwestPlacement !== void 0 &&
      (Number(map2) !== 1001 || m.omaNorthwestPlacement !== 1)
    )
      throw new LocalizedError(message("storage.map"));
    if (!maps.has(Number(map2)) || !Array.isArray(m.actors) || !m.respawns)
      throw new LocalizedError(message("storage.map"));
    if (m.portals !== void 0) {
      if (
        !Array.isArray(m.portals) ||
        m.portals.some(
          (p) =>
            !maps.has(p.to) ||
            !Array.isArray(p.at) ||
            p.at.length !== 2 ||
            !p.at.every((v) => integer(v)) ||
            !Array.isArray(p.landing) ||
            p.landing.length !== 2 ||
            !p.landing.every((v) => integer(v)) ||
            (p.expires !== void 0 && !integer(p.expires)),
        )
      )
        throw new LocalizedError(message("storage.portal"));
    }
    for (const a of m.actors) {
      actor(a);
      if (a.map !== Number(map2) || !["monster", "npc", "spell", "item"].includes(a.kind))
        throw new LocalizedError(message("storage.actorKind"));
      if (a.kind === "monster" && !rules.monsters.some((m2) => m2.Index === a.definition))
        throw new LocalizedError(message("storage.monster"));
      if (a.item) item(a.item);
    }
  }
  if (hasSharedStorage(rules)) {
    if (s.sharedStorageGame !== void 0 && s.sharedStorageGame !== sharedStorageGame(rules))
      throw new Error("\u6B64\u5B58\u6863\u4E0D\u5C5E\u4E8E\u5F53\u524D\u6E38\u620F\u3002");
    if (
      s.sharedStorageVersion === 1 &&
      sharedStorageGame(rules) !== "classic-hell" &&
      s.sharedStorageGame === void 0
    )
      throw new LocalizedError(message("storage.invalidFormat"));
    s.sharedStorageGame = sharedStorageGame(rules);
    if (
      (s.sharedStorageVersion !== void 0 && s.sharedStorageVersion !== 1) ||
      (s.sharedStorageVersion === 1 && s.sharedStorage === void 0)
    )
      throw new LocalizedError(message("storage.invalidFormat"));
    if (s.sharedStorage === void 0) s.sharedStorage = Array(SHARED_STORAGE_SLOTS).fill(null);
    if (!Array.isArray(s.sharedStorage) || s.sharedStorage.length !== SHARED_STORAGE_SLOTS)
      throw new LocalizedError(message("storage.invalidFormat"));
    for (const entry of s.sharedStorage)
      if (entry !== null) {
        item(entry);
        if (!canShareItem(entry, defs.get(entry.id), rules))
          throw new LocalizedError(message("storage.sharedOnly"));
      }
    s.sharedStorageVersion = 1;
  } else if (
    s.sharedStorage !== void 0 ||
    s.sharedStorageVersion !== void 0 ||
    s.sharedStorageGame !== void 0
  )
    throw new LocalizedError(message("storage.invalidFormat"));
  if ([...ids].some((id) => id >= s.nextId)) throw new LocalizedError(message("storage.objectId"));
  const orders = /* @__PURE__ */ new Set();
  for (const e of s.events) {
    if (
      !["hit", "deathHit", "heal", "expire", "buff", "magic", "vamp", "kill"].includes(e.kind) ||
      !integer(e.at) ||
      !integer(e.order) ||
      e.order >= s.nextOrder ||
      orders.has(e.order) ||
      !integer(e.source) ||
      !integer(e.target) ||
      !maps.has(e.map) ||
      !Number.isFinite(e.damage) ||
      (e.trainSpell !== void 0 && !rules.skills.some((d) => d.Spell === e.trainSpell))
    )
      throw new LocalizedError(message("storage.events"));
    if (
      e.effect &&
      (!integer(e.effect.duration) || !stats2(e.effect.stats) || !Number.isFinite(e.effect.value))
    )
      throw new LocalizedError(message("storage.pendingState"));
    orders.add(e.order);
  }
  return structuredClone(s);
}


var SaveStore = class {
  db;
  ownerId = null;
  key(key, ownerId2 = this.ownerId) {
    return `partition:${ownerId2 === null ? "guest" : "account:" + encodeURIComponent(ownerId2)}:${key}`;
  }
  selectOwner(ownerId2) {
    this.ownerId = ownerId2;
  }
  async open() {
    let created = false;
    this.db = await new Promise((resolve, reject) => {
      const req = indexedDB.open(SAVE_DATABASE, 1);
      req.onupgradeneeded = () => {
        created = true;
        req.result.createObjectStore("saves");
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(new LocalizedError(message("storage.open")));
    });
    /* Collection: independent game; no legacy database import. */
    await new Promise((resolve, reject) => {
      const tx = this.db.transaction("saves", "readwrite"),
        s = tx.objectStore("saves"),
        cursor = s.openCursor();
      cursor.onsuccess = () => {
        const row = cursor.result;
        if (!row) return;
        const key = String(row.key),
          value = row.value;
        if (
          [
            "current",
            "previous",
            "before-cloud-read",
            "before-cloud-merge",
            "cloud-merge-remote",
            "before-dream-runtime-v1",
          ].includes(key) ||
          /^before-world-v\d+$/.test(key)
        ) {
          if (key === "current") {
            const backup = s.get("legacy-current-original");
            backup.onsuccess = () => {
              if (!backup.result) s.put(value, "legacy-current-original");
            };
          }
          const existing = s.get(this.key(key, null));
          existing.onsuccess = () => {
            if (!existing.result) s.put(value, this.key(key, null));
          };
        }
        row.continue();
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => {};
      tx.onabort = () => reject(new LocalizedError(message("storage.aborted")));
    });
  }
  /** One-time copy of every 1.x row. The 1.x database is opened read-only and never created. */
  async importLegacy() {
    const legacy = await new Promise((resolve) => {
      const req = indexedDB.open(LEGACY_SAVE_DATABASE, 1);
      req.onupgradeneeded = () => req.transaction?.abort();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    });
    if (!legacy) return;
    try {
      if (!legacy.objectStoreNames.contains("saves")) return;
      const rows = await new Promise((resolve, reject) => {
        const out = [],
          cursor = legacy.transaction("saves", "readonly").objectStore("saves").openCursor();
        cursor.onsuccess = () => {
          const row = cursor.result;
          if (!row) return resolve(out);
          out.push({ key: row.key, value: row.value });
          row.continue();
        };
        cursor.onerror = () => reject(new LocalizedError(message("storage.read")));
      });
      if (!rows.length) return;
      await new Promise((resolve, reject) => {
        const tx = this.db.transaction("saves", "readwrite"),
          store2 = tx.objectStore("saves");
        for (const row of rows) store2.put(row.value, row.key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => {};
        tx.onabort = () => reject(new LocalizedError(message("storage.aborted")));
      });
    } finally {
      legacy.close();
    }
  }
  async read(key = "current") {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction("saves", "readonly"),
        req = tx.objectStore("saves").get(this.key(key));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(new LocalizedError(message("storage.read")));
    });
  }
  async readOwner(ownerId2, key = "current") {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction("saves", "readonly"),
        r = tx.objectStore("saves").get(this.key(key, ownerId2));
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(new LocalizedError(message("storage.read")));
    });
  }
  async guestBinding() {
    return new Promise((resolve, reject) => {
      const r = this.db
        .transaction("saves", "readonly")
        .objectStore("saves")
        .get("guest-bound-owner");
      r.onsuccess = () => resolve(r.result ?? null);
      r.onerror = () => reject(new LocalizedError(message("storage.read")));
    });
  }
  async bindGuest(ownerId2, save, local, remote) {
    await new Promise((resolve, reject) => {
      const tx = this.db.transaction("saves", "readwrite"),
        s = tx.objectStore("saves"),
        bound = s.get("guest-bound-owner");
      let alreadyBound = false,
        failure;
      bound.onsuccess = () => {
        if (bound.result) {
          alreadyBound = true;
          tx.abort();
          return;
        }
        try {
          if (local) {
            for (const key of ["before-cloud-merge", "before-cloud-read", "previous"])
              s.put(local, this.key(key, ownerId2));
          }
          if (remote) s.put(remote, this.key("cloud-merge-remote", ownerId2));
          s.put(ownerId2, "guest-bound-owner");
          s.put(save, this.key("current", ownerId2));
        } catch (error) {
          failure = error;
          tx.abort();
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => {};
      tx.onabort = () =>
        reject(
          alreadyBound
            ? Error("guestBound")
            : new LocalizedError(
                message(
                  failure?.name === "QuotaExceededError" ? "storage.quota" : "storage.aborted",
                ),
              ),
        );
    });
  }
  async backupOnce(key, save) {
    await new Promise((resolve, reject) => {
      const tx = this.db.transaction("saves", "readwrite"),
        store2 = tx.objectStore("saves"),
        req = store2.get(this.key(key));
      req.onsuccess = () => {
        if (!req.result) store2.put(save, this.key(key));
      };
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(new LocalizedError(message("storage.backup")));
      tx.onerror = () => reject(new LocalizedError(message("storage.backup")));
    });
  }
  async merge(save, remote, local, manual = true) {
    await new Promise((resolve, reject) => {
      const tx = this.db.transaction("saves", "readwrite"),
        store2 = tx.objectStore("saves"),
        old = store2.get(this.key("current"));
      old.onsuccess = () => {
        const original = local ?? old.result;
        if (original) {
          if (manual) store2.put(original, this.key("before-cloud-merge"));
          store2.put(original, this.key("before-cloud-read"));
          store2.put(original, this.key("previous"));
        }
        store2.put(remote, this.key(manual ? "cloud-merge-remote" : "auto-cloud-remote"));
        store2.put(save, this.key("current"));
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => {};
      tx.onabort = () => reject(new LocalizedError(message("storage.aborted")));
    });
  }
  async write(save, keepPrevious = false, backupKey) {
    await new Promise((resolve, reject) => {
      const tx = this.db.transaction("saves", "readwrite"),
        store2 = tx.objectStore("saves"),
        old = store2.get(this.key("current"));
      old.onsuccess = () => {
        if (old.result && backupKey) store2.put(old.result, this.key(backupKey));
        if (old.result && !keepPrevious) store2.put(old.result, this.key("previous"));
        store2.put(save, this.key("current"));
      };
      tx.oncomplete = () => resolve();
      let failure = null;
      tx.onerror = (event) => {
        failure = event.target?.error || tx.error;
      };
      tx.onabort = () => {
        const error = failure || tx.error;
        reject(
          new LocalizedError(
            message(error?.name === "QuotaExceededError" ? "storage.quota" : "storage.aborted"),
          ),
        );
      };
    });
  }
  async writeOwner(save, ownerId2) {
    await new Promise((resolve, reject) => {
      const tx = this.db.transaction("saves", "readwrite");
      tx.objectStore("saves").put(save, this.key("current", ownerId2));
      tx.oncomplete = () => resolve();
      tx.onerror = () => {};
      tx.onabort = () => reject(new LocalizedError(message("storage.aborted")));
    });
  }
};

// games/darkforged/singleplayer/core/cloud-merge.ts
function mergeCloudCharacters(local, remote, selected, rules, replacements = {}) {
  if (hasSharedStorage(rules)) throw Error("mergeSelection");
  const merged = characterSave(validateSave(structuredClone(local), rules), rules);
  const incoming = characterSave(validateSave(structuredClone(remote), rules), rules);
  if (
    !Array.isArray(selected) ||
    !selected.length ||
    selected.some((id) => !Number.isSafeInteger(id)) ||
    new Set(selected).size !== selected.length
  )
    throw Error("mergeSelection");
  const roles = selected.map((id) => incoming.roles.find((r) => r.id === id));
  if (roles.some((r) => !r)) throw Error("mergeSelection");
  if (!replacements || typeof replacements !== "object" || Array.isArray(replacements))
    throw Error("mergeSelection");
  const replace = replacements,
    entries = Object.entries(replace);
  if (
    entries.some(([id, value]) => !selected.includes(Number(id)) || !Number.isSafeInteger(value)) ||
    new Set(Object.values(replace)).size !== entries.length
  )
    throw Error("mergeSelection");
  const nameKey = (name) => name.trim().normalize("NFKC").toLocaleLowerCase();
  if (new Set(roles.map((r) => nameKey(r.name))).size !== roles.length)
    throw Error("mergeDuplicate");
  for (const role of roles) {
    const r = role,
      same = merged.roles.filter((local2) => nameKey(local2.name) === nameKey(r.name));
    if (same.length) {
      if (same.length !== 1 || same[0].job !== r.job || replace[String(r.id)] !== same[0].id)
        throw Error("mergeDuplicate");
    } else if (Object.hasOwn(replace, String(r.id))) throw Error("mergeSelection");
  }
  if (merged.roles.length + roles.length - entries.length > 6) throw Error("mergeFull");
  let next = Math.max(merged.nextId, incoming.nextId);
  const allocate = () => {
    if (!Number.isSafeInteger(next + 1)) throw Error("mergeInvalid");
    return next++;
  };
  for (const role of roles) {
    const r = role,
      replaceId = replace[String(r.id)],
      index = merged.roles.findIndex((local2) => local2.id === replaceId);
    r.id = index >= 0 ? replaceId : allocate();
    delete r.master;
    delete r.item;
    const ids = /* @__PURE__ */ new Map();
    for (const item of [
      ...r.inventory,
      ...r.equipment,
      ...r.storage,
      ...r.questInventory,
      ...Object.values(r.buyback || {}).flat(),
      ...(r.challengeRewards?.pending || []).flatMap((receipt2) => receipt2.items),
    ])
      if (item) {
        const old = item.uid;
        item.uid = allocate();
        ids.set(old, item.uid);
      }
    remapRingHotkeys(r, ids);
    if (index >= 0) merged.roles[index] = r;
    else merged.roles.push(r);
  }
  merged.nextId = next;
  return validateSave(merged, rules);
}

// games/darkforged/singleplayer/core/cloud-save.ts
var cloudGameId = "darkforged";
var maxLength = 15e5;
function encodeCloudSave(source, rules, build, allowEmpty = false) {
  const snapshot = characterSave(validateSave(source, rules), rules);
  if (
    !snapshot.roles.length &&
    !snapshot.sharedStorage?.some(Boolean) &&
    !Object.keys(snapshot.sync?.tombstones || {}).length &&
    !allowEmpty
  )
    throw new LocalizedError(message("core.cloud-save.encodeCloudSave.9dd87e152d"));
  const saveJson = JSON.stringify({
    version: 1,
    format: "darkforged-character-save",
    gameId: cloudGameId,
    contentHash: String(build || rules.version),
    player: { roles: snapshot.roles.map((r) => ({ name: r.name, job: r.job, level: r.level })) },
    snapshot,
  });
  if (saveJson.length > maxLength)
    throw new LocalizedError(message("core.cloud-save.encodeCloudSave.ef250747c5"));
  return saveJson;
}
function remapSaveIds(source) {
  const save = structuredClone(source);
  let next = 1e4;
  const owners = /* @__PURE__ */ new Map(),
    shared = /* @__PURE__ */ new Map();
  for (const role of save.roles) {
    const ids = /* @__PURE__ */ new Map();
    owners.set(role, ids);
    role.id = next++;
    delete role.master;
    delete role.item;
    for (const item of [
      ...role.inventory,
      ...role.equipment,
      ...role.storage,
      ...role.questInventory,
      ...Object.values(role.buyback || {}).flat(),
      ...(role.challengeRewards?.pending || []).flatMap((r) => r.items),
    ])
      if (item) {
        ids.set(item.uid, next);
        item.uid = next++;
      }
  }
  for (const item of save.sharedStorage || [])
    if (item) {
      shared.set(item.uid, next);
      item.uid = next++;
    }
  for (const [role, ids] of owners) remapRingHotkeys(role, ids, shared);
  save.nextId = next;
  return save;
}
function decodeCloudSave(saveJson, rules, options = {}) {
  if (typeof saveJson !== "string" || !saveJson.length || saveJson.length > maxLength)
    throw new LocalizedError(message("core.cloud-save.decodeCloudSave.db10a7bee5"));
  let data;
  try {
    data = JSON.parse(saveJson);
  } catch {
    throw new LocalizedError(message("core.cloud-save.decodeCloudSave.0de22000a4"));
  }
  if (
    !data ||
    data.version !== 1 ||
    data.format !== "darkforged-character-save" ||
    data.gameId !== cloudGameId ||
    !data.snapshot ||
    data.snapshot.storageMode !== "character-only"
  )
    throw new LocalizedError(message("core.cloud-save.decodeCloudSave.fe073fd64f"));
  const snapshot = characterSave(
    validateSave(options.remapIds ? remapSaveIds(data.snapshot) : data.snapshot, rules),
    rules,
  );
  if (
    !snapshot.roles.length &&
    !snapshot.sharedStorage?.some(Boolean) &&
    !Object.keys(snapshot.sync?.tombstones || {}).length &&
    !options.allowEmpty
  )
    throw new LocalizedError(message("core.cloud-save.decodeCloudSave.e3fd97ef99"));
  return snapshot;
}

// games/darkforged/website/save-sync.mjs
var PROJECTION_VERSION = 2;
var DELETED = "~deleted";
var volatileRole = /* @__PURE__ */ new Set([
  "id",
  "cloudId",
  "hp",
  "mp",
  "maxHP",
  "maxMP",
  "map",
  "x",
  "y",
  "dir",
  "target",
  "dead",
  "stats",
  "buffs",
  "actionAt",
  "attackAt",
  "moveAt",
  "spellAt",
  "potAt",
  "healAt",
  "regenAt",
  "potHP",
  "potMP",
  "healHP",
  "sunPotionAt",
  "itemCooldowns",
  "dxCooldowns",
  "nativeHealing",
  "nativeRecovery",
  "treasureRun",
  "challengeRun",
  "trialRun",
  "mountUid",
  "assist",
  "itemHotkeys",
  "ringHotkeys",
  "attackModes",
  "bagLayoutVersion",
]);
var bags = /* @__PURE__ */ new Set(["inventory", "storage", "questInventory"]);
var ordered = (value) =>
  Array.isArray(value)
    ? value.map(ordered)
    : value && typeof value === "object"
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .filter((k) => k !== "uid" && value[k] !== void 0)
            .map((k) => [k, ordered(value[k])]),
        )
      : value;
var stringify = (value) => JSON.stringify(ordered(value));
function itemProgress(item) {
  if (!item) return null;
  const { uid, buybackAt, specialVersion, ...rest } = item;
  return ordered(rest);
}
function bagProgress(items) {
  const groups = /* @__PURE__ */ new Map();
  for (const item of (items || []).filter(Boolean)) {
    const { count, ...asset } = itemProgress(item),
      key = stringify(asset),
      entry = groups.get(key) || { ...asset, count: 0 };
    entry.count += count ?? 1;
    groups.set(key, entry);
  }
  return [...groups.values()].sort((a, b) => stringify(a).localeCompare(stringify(b), "en"));
}
function roleProgress(role) {
  const result = {};
  for (const key of Object.keys(role).sort()) {
    if (volatileRole.has(key) || role[key] === void 0) continue;
    if (bags.has(key)) result[key] = bagProgress(role[key]);
    else if (key === "equipment") result[key] = (role[key] || []).map(itemProgress);
    else if (key === "buyback")
      result[key] = Object.fromEntries(
        Object.keys(role[key] || {})
          .sort()
          .filter((k) => role[key][k]?.length)
          .map((k) => [k, bagProgress(role[key][k])]),
      );
    else if (key === "skills")
      result[key] = (role[key] || [])
        .filter((s) => !s.temporary)
        .map(({ CastTime, Key, ...skill }) => ordered(skill))
        .sort((a, b) => String(a.Spell).localeCompare(String(b.Spell), "en"));
    else if (["quests", "completedQuests", "unlockedWaypoints", "noviceBooks"].includes(key))
      result[key] = (role[key] || [])
        .map(ordered)
        .sort((a, b) => stringify(a).localeCompare(stringify(b), "en"));
    else if (key === "challengeRewards") {
      const { sequence, ...rewards } = role[key] || {};
      result[key] = ordered(rewards);
    } else result[key] = ordered(role[key]);
  }
  if ((result.storagePages ?? 1) === 1) delete result.storagePages;
  for (const key of [
    "inventory",
    "storage",
    "questInventory",
    "skills",
    "quests",
    "completedQuests",
    "unlockedWaypoints",
    "noviceBooks",
  ])
    result[key] ??= [];
  if (!Object.keys(result.buyback || {}).length) delete result.buyback;
  if (result.trial && !Object.values(result.trial).some(Boolean)) delete result.trial;
  if (
    result.crafting &&
    !result.crafting.stage &&
    !Object.keys(result.crafting.skills || {}).length
  )
    delete result.crafting;
  if (result.spiritProgress && !result.spiritProgress.level && !result.spiritProgress.xp)
    delete result.spiritProgress;
  if (
    result.challengeRewards &&
    !result.challengeRewards.poCompletions &&
    !result.challengeRewards.pending?.length &&
    !result.challengeRewards.claimed?.length
  )
    delete result.challengeRewards;
  if (result.lateQuests && !Object.keys(result.lateQuests).length) delete result.lateQuests;
  return stringify(result);
}
function legacyRoleKey(role) {
  return (
    role.name.trim().normalize("NFKC").toLocaleLowerCase("en-US") + "|" + String(role.job || "")
  );
}
function cloudRoleKey(role) {
  return role.cloudId || "legacy:" + legacyRoleKey(role);
}
function legacyCharacterId(ownerId2, role) {
  const text = String(ownerId2 || "guest") + "\0" + legacyRoleKey(role),
    words = [2166136261, 2246822519, 3266489917, 668265263];
  for (let n = 0; n < words.length; n++)
    for (let i = 0; i < text.length; i++)
      words[n] = Math.imul(words[n] ^ text.charCodeAt(i), 16777619 + n * 2) >>> 0;
  const h = words.map((v) => v.toString(16).padStart(8, "0")).join("");
  return (
    h.slice(0, 8) +
    "-" +
    h.slice(8, 12) +
    "-5" +
    h.slice(13, 16) +
    "-a" +
    h.slice(17, 20) +
    "-" +
    h.slice(20, 32)
  );
}
function ensureCharacterIds(save, ownerId2) {
  for (const role of save.roles || []) role.cloudId ||= legacyCharacterId(ownerId2, role);
  return save;
}
function freshSync(ownerId2, device2 = {}) {
  return {
    protocol: 2,
    ownerId: ownerId2 ?? null,
    deviceId: device2.deviceId || "",
    deviceName: device2.deviceName || "",
    projectionVersion: PROJECTION_VERSION,
    baseRevision: null,
    baseRoles: {},
    tombstones: {},
    progressSeq: 0,
    lastProgressAt: null,
    checkpointWrittenAt: null,
    serverConfirmedAt: null,
  };
}
function cloudBaseline(roles, tombstones = {}) {
  return Object.fromEntries(
    [
      ...Object.keys(tombstones || {})
        .sort()
        .map((k) => [k, DELETED]),
      ...(roles || []).map((r) => [cloudRoleKey(r), roleProgress(r)]),
    ].sort(([a], [b]) => a.localeCompare(b, "en")),
  );
}
function snapshotOf(value) {
  if (typeof value === "string") value = JSON.parse(value);
  return value?.snapshot || value;
}
var HELL_SAVE_KEY = "00000000-0000-4000-8000-000000000080";
var SHARED_SAVE_KEY = HELL_SAVE_KEY;
var sharedSnapshot = (value) => {
  const s = snapshotOf(value);
  return s?.gameId === "classic-hell" || s?.sharedStorageVersion === 1;
};
var sharedGame = (s) =>
  s.sharedStorageGame ?? (s.gameId === "classic-hell" ? "classic-hell" : void 0);
function wholeProjection(save, roles = cloudBaseline(save?.roles || [], save?.sync?.tombstones)) {
  return stringify({
    roles,
    sharedStorage: bagProgress(save.sharedStorage || []),
    ...(sharedGame(save) && sharedGame(save) !== "classic-hell" ? { game: sharedGame(save) } : {}),
  });
}
function semanticSnapshot(value) {
  const save = snapshotOf(value);
  return sharedSnapshot(save)
    ? { [SHARED_SAVE_KEY]: wholeProjection(save) }
    : cloudBaseline(save?.roles || [], save?.sync?.tombstones);
}
function progressFingerprint(value) {
  return stringify({ projectionVersion: PROJECTION_VERSION, roles: semanticSnapshot(value) });
}

// games/darkforged/singleplayer/worker.ts
var scope = globalThis;
var viewRange = 24;
var game;
var store;
var paused = true;
var foreground = false;
var busy = false;
var last = performance.now();
var accumulator = 0;
var savedAt = 0;
var serial = Promise.resolve();
var mapLoads = /* @__PURE__ */ new Map();
var mapAssetCache = /* @__PURE__ */ new Map();
var mapAssetBytes = 0;
async function readMapAsset(path) {
  const hit = mapAssetCache.get(path);
  if (hit) {
    mapAssetCache.delete(path);
    mapAssetCache.set(path, hit);
    return hit.value;
  }
  const response = await fetch(path);
  if (!response.ok) throw new LocalizedError(message("storage.mapLoad"));
  const text = await response.text(),
    value = JSON.parse(text),
    bytes = text.length * 2;
  if (bytes <= 8 * 1024 * 1024) {
    mapAssetCache.set(path, { value, bytes });
    mapAssetBytes += bytes;
    while (mapAssetCache.size > 16 || mapAssetBytes > 8 * 1024 * 1024) {
      const key = mapAssetCache.keys().next().value;
      mapAssetBytes -= mapAssetCache.get(key).bytes;
      mapAssetCache.delete(key);
    }
  }
  return value;
}
var ownerId = null;
var device = { deviceId: crypto.randomUUID(), deviceName: "" };
var semantic = (save) => progressFingerprint(save);
function normalize(source, owner = ownerId) {
  const save = ensureCharacterIds(characterSave(source, game.rules), owner);
  save.sync = save.sync
    ? structuredClone(save.sync)
    : { ...freshSync(owner, device), lastProgressAt: save.lastSaved };
  if (save.sync.ownerId !== owner) throw Error("accountChanged");
  if (save.sync.deviceId === device.deviceId) save.sync.deviceName = device.deviceName;
  return save;
}
function guardOwner(data, required = true) {
  if ((required || data?.ownerId !== void 0) && data?.ownerId !== ownerId)
    throw Error("accountChanged");
}
function checkedOwner(value) {
  if (value === null) return null;
  if (typeof value !== "string" || !value.length || value.length > 200 || /[\x00-\x1f]/.test(value))
    throw Error("accountChanged");
  return value;
}
function install(candidate) {
  game = candidate;
  paused = true;
  mapLoads.clear();
  savedAt = 0;
  last = performance.now();
  accumulator = 0;
}
function metadata(data, sync) {
  const next = {
    ...structuredClone(sync),
    baseRevision: data.baseRevision,
    baseRoles: structuredClone(data.baseRoles),
    serverConfirmedAt: data.serverConfirmedAt,
  };
  if (
    !(
      next.baseRevision === null ||
      (Number.isSafeInteger(next.baseRevision) && next.baseRevision >= 0)
    ) ||
    !next.baseRoles ||
    typeof next.baseRoles !== "object" ||
    Array.isArray(next.baseRoles) ||
    !Object.values(next.baseRoles).every((v) => typeof v === "string") ||
    !(
      next.serverConfirmedAt === null ||
      (Number.isSafeInteger(next.serverConfirmedAt) && next.serverConfirmedAt >= 0)
    )
  )
    throw Error("invalid");
  if (
    sync.baseRevision !== null &&
    (next.baseRevision === null || next.baseRevision < sync.baseRevision)
  )
    throw Error("conflict");
  return next;
}
async function guestForAccount() {
  if (ownerId === null) throw Error("accountChanged");
  if (await store.guestBinding()) throw Error("guestBound");
  const guest = await store.readOwner(null);
  if (!guest?.roles.length && !guest?.sharedStorage?.some(Boolean)) throw Error("missing");
  const incoming = characterSave(validateSave(guest, game.rules), game.rules);
  for (const role of incoming.roles)
    if (!role.cloudId || role.cloudId === legacyCharacterId(null, role))
      role.cloudId = legacyCharacterId(ownerId, role);
  incoming.sync = {
    ...freshSync(ownerId, device),
    progressSeq: guest.sync?.progressSeq ?? 0,
    lastProgressAt: guest.sync?.lastProgressAt ?? guest.lastSaved,
    checkpointWrittenAt: /* @__PURE__ */ new Date().toISOString(),
  };
  return incoming;
}
async function map(id) {
  if (game.geometry.has(id)) return;
  let task = mapLoads.get(id);
  if (!task) {
    task = (async () => {
      game.loadMap(await readMapAsset(`data/maps/${id}/info.json`));
    })();
    mapLoads.set(id, task);
  }
  try {
    await task;
  } catch (e) {
    mapLoads.delete(id);
    throw e;
  }
}
async function persist() {
  const at = /* @__PURE__ */ new Date().toISOString(),
    save = normalize(game.save(false)),
    previous = await store.read();
  if (previous) {
    for (const role of previous.roles)
      if (role.cloudId && !save.roles.some((r) => r.cloudId === role.cloudId))
        save.sync.tombstones[role.cloudId] ??= { deletedAt: at };
  }
  const changed = previous
    ? semantic(save) !== semantic(normalize(previous))
    : !!save.roles.length ||
      !!save.sharedStorage?.some(Boolean) ||
      !!Object.keys(save.sync.tombstones).length;
  if (changed) {
    save.sync.progressSeq++;
    save.sync.lastProgressAt = at;
    Object.assign(save.sync, device);
    save.lastSaved = at;
  }
  save.sync.checkpointWrittenAt = at;
  await store.write(save, !changed);
  game.sync = structuredClone(save.sync);
  game.lastSaved = save.lastSaved;
  for (let n = 0; n < game.roles.length; n++) game.roles[n].cloudId = save.roles[n].cloudId;
  savedAt = game.time;
}
async function init() {
  const response = await fetch("data/rules.json");
  if (!response.ok) throw new LocalizedError(message("storage.rulesLoad"));
  const rules = await response.json();
  game = new Game7(rules, crypto.getRandomValues(new Int32Array(1))[0]);
  store = new SaveStore();
  await store.open();
  const saved = await store.read();
  if (saved) {
    if (rules.adaptations.dreamRuntime && !saved.dreamRuntimeVersion)
      await store.backupOnce("before-dream-runtime-v1", saved);
    if (
      rules.adaptations.mainline &&
      (Number(saved.worldVersion) || 1) < rules.adaptations.mainline.worldVersion
    )
      await store.backupOnce(`before-world-v${rules.adaptations.mainline.worldVersion}`, saved);
    try {
      game.restore(characterSave(validateSave(saved, rules), rules));
    } catch (error) {
      const backup = await store.read("previous");
      if (!backup) throw error;
      const recovered = characterSave(validateSave(backup, rules), rules);
      game.restore(recovered);
      await store.write(recovered, true);
      game.say(message("storage.recovered"));
      scope.postMessage({
        notification: true,
        error: message("storage.recovered"),
      });
    }
  }
  const initial = normalize(game.save(false));
  game.sync = initial.sync;
  game.roles = initial.roles;
  return game.snapshot(-1, viewRange);
}
async function request(route, data, after) {
  if (route === "init") return init();
  if (route === "world") return game.rules.world;
  if (route === "cloud/context") {
    const nextOwner = checkedOwner(data?.ownerId);
    if (game.active) throw Error("pendingSelection");
    if (data?.deviceId !== void 0) {
      if (
        typeof data.deviceId !== "string" ||
        data.deviceId.length > 200 ||
        typeof data.deviceName !== "string" ||
        data.deviceName.length > 100
      )
        throw Error("invalid");
      device = { deviceId: data.deviceId, deviceName: data.deviceName };
    }
    if (nextOwner === ownerId) {
      game.sync = normalize(game.save(false)).sync;
      return game.snapshot(-1, viewRange);
    }
    await persist();
    const saved = await store.readOwner(nextOwner),
      candidate = new Game7(game.rules, 1);
    if (saved) candidate.restore(normalize(validateSave(saved, game.rules), nextOwner));
    else candidate.sync = freshSync(nextOwner, device);
    const checkpoint = normalize(candidate.save(false), nextOwner);
    checkpoint.sync.checkpointWrittenAt = /* @__PURE__ */ new Date().toISOString();
    candidate.restore(checkpoint);
    await store.writeOwner(checkpoint, nextOwner);
    store.selectOwner(nextOwner);
    ownerId = nextOwner;
    install(candidate);
    return game.snapshot(-1, viewRange);
  }
  if (route === "cloud/guest") {
    guardOwner(data);
    const guest = await guestForAccount();
    return {
      roles: guest.roles,
      sync: guest.sync,
      saveJson: encodeCloudSave(guest, game.rules, String(data?.build || ""), true),
    };
  }
  if (route === "cloud/bind") {
    guardOwner(data);
    if (ownerId === null) throw Error("accountChanged");
    if (game.active) throw Error("pendingSelection");
    const guest = await guestForAccount(),
      local = normalize(game.save(false));
    let incoming = guest;
    if (data?.saveJson) {
      if (
        typeof data.expectedRoles !== "string" ||
        data.expectedRoles !== JSON.stringify(local.roles)
      )
        throw Error("conflict");
      metadata(data, local.sync);
      incoming = normalize(
        decodeCloudSave(data.saveJson, game.rules, { allowEmpty: true, remapIds: true }),
      );
      incoming.sync = metadata(data, incoming.sync);
    } else if (
      game.roles.length ||
      game.sharedStorage.some(Boolean) ||
      Object.keys(game.sync?.tombstones || {}).length
    )
      throw Error("conflict");
    const remote = data?.remoteSaveJson
      ? decodeCloudSave(data.remoteSaveJson, game.rules, { allowEmpty: true })
      : guest;
    if (remote.sync && remote.sync.ownerId !== ownerId) throw Error("accountChanged");
    inheritStorageCapacity(incoming.roles, game.roles);
    const candidate = new Game7(game.rules, 1);
    candidate.restore(incoming);
    Object.assign(incoming, characterSave(candidate.save(false), game.rules));
    await store.bindGuest(ownerId, incoming, local, remote);
    install(candidate);
    return game.snapshot(-1, viewRange);
  }
  if (route === "viewport") {
    viewRange = viewportActorRange(data?.width, data?.height);
    return { viewRange };
  }
  if (route === "foreground") {
    if (!data?.active) await persist();
    return game.snapshot(after, viewRange);
  }
  if (route === "pause") {
    paused = !!data?.paused;
    last = performance.now();
    accumulator = 0;
    if (paused) await persist();
    return game.snapshot(after, viewRange);
  }
  if (route.startsWith("map/")) {
    const [path, query = ""] = route.split("?"),
      parts = path.split("/"),
      id = Number(parts[1]);
    if (!game.rules.world.maps.some((m) => m.id === id))
      throw new LocalizedError(message("storage.mapRange"));
    const p = new URLSearchParams(query);
    const file =
      parts[2] === "chunk" ? `${Number(p.get("x"))}-${Number(p.get("y"))}.json` : "info.json";
    return readMapAsset(`data/maps/${id}/${file}`);
  }
  if (route === "cloud/local") {
    const save = normalize(game.save(false)),
      guest = await store.readOwner(null),
      bound = await store.guestBinding();
    return {
      stage: game.active ? "Game" : "Select",
      roles: save.roles,
      sync: save.sync,
      guestAvailable:
        ownerId !== null &&
        !bound &&
        !!(guest?.roles.length || guest?.sharedStorage?.some(Boolean)),
      saveJson: encodeCloudSave(save, game.rules, String(data?.build || ""), true),
    };
  }
  if (route === "cloud/commit") {
    guardOwner(data);
    await persist();
    const save = normalize(game.save(false));
    save.sync = metadata(data, save.sync);
    save.sync.checkpointWrittenAt = /* @__PURE__ */ new Date().toISOString();
    await store.write(save, true);
    game.sync = structuredClone(save.sync);
    return { sync: structuredClone(save.sync) };
  }
  if (route === "cloud/apply") {
    guardOwner(data);
    if (game.active) throw Error("pendingSelection");
    const local = normalize(game.save(false));
    if (
      typeof data?.expectedRoles !== "string" ||
      JSON.stringify(local.roles) !== data.expectedRoles
    )
      throw Error("conflict");
    if (data?.expectedProgress !== void 0 && progressFingerprint(local) !== data.expectedProgress)
      throw Error("conflict");
    const incoming = normalize(
      decodeCloudSave(data?.saveJson, game.rules, { allowEmpty: true, remapIds: true }),
    );
    metadata(data, local.sync);
    incoming.sync = metadata(data, incoming.sync);
    incoming.sync.checkpointWrittenAt = /* @__PURE__ */ new Date().toISOString();
    inheritStorageCapacity(incoming.roles, game.roles);
    const candidate = new Game7(game.rules, 1);
    candidate.restore(incoming);
    Object.assign(incoming, characterSave(candidate.save(false), game.rules));
    const remote = decodeCloudSave(data?.remoteSaveJson ?? data?.saveJson, game.rules, {
      allowEmpty: true,
      remapIds: !data?.remoteSaveJson,
    });
    if (remote.sync && remote.sync.ownerId !== ownerId) throw Error("accountChanged");
    await store.merge(incoming, remote, local, !!data?.manual);
    install(candidate);
    return game.snapshot(-1, viewRange);
  }
  if (data?.autoSync && (route === "cloud/merge" || route === "cloud/restore")) {
    if (
      game.active ||
      JSON.stringify(characterSave(game.save(false), game.rules).roles) !== data.expectedRoles
    )
      throw Error("conflict");
  }
  if (route === "cloud/prepare") {
    guardOwner(data, false);
    await persist();
    return {
      saveJson: encodeCloudSave(game.save(false), game.rules, String(data?.build || ""), true),
      sync: structuredClone(game.sync),
    };
  }
  if (route === "cloud/preview") {
    const save = decodeCloudSave(data?.saveJson, game.rules, { allowEmpty: true });
    return {
      roles: save.roles.map((r) => ({
        id: r.id,
        cloudId: r.cloudId,
        name: r.name,
        job: r.job,
        level: r.level,
      })),
      lastSaved: save.lastSaved,
      sync: save.sync,
    };
  }
  if (route === "cloud/merge") {
    guardOwner(data, false);
    if (game.active) throw Error("pendingSelection");
    const remote = decodeCloudSave(data?.saveJson, game.rules);
    if (remote.sync && remote.sync.ownerId !== ownerId) throw Error("accountChanged");
    const incoming = mergeCloudCharacters(
      game.save(false),
      remote,
      data?.roleIds,
      game.rules,
      data?.replacements,
    );
    inheritStorageCapacity(incoming.roles, game.roles);
    const candidate = new Game7(game.rules, 1);
    candidate.restore(incoming);
    Object.assign(incoming, characterSave(candidate.save(false), game.rules));
    candidate.active = 0;
    incoming.sync = structuredClone(game.sync);
    await store.merge(incoming, remote);
    candidate.sync = incoming.sync;
    install(candidate);
    return game.snapshot(-1, viewRange);
  }
  if (route === "cloud/export-backup") {
    guardOwner(data, false);
    const key = data?.kind === "remote" ? "cloud-merge-remote" : "before-cloud-merge";
    const saved = await store.read(key);
    if (!saved) throw Error("noBackup");
    return {
      saveJson: encodeCloudSave(
        validateSave(saved, game.rules),
        game.rules,
        String(data?.build || ""),
        true,
      ),
    };
  }
  if (route === "cloud/backup") {
    guardOwner(data, false);
    return { exists: !!(await store.read("before-cloud-read")) };
  }
  if (route === "cloud/restore" || route === "cloud/rollback") {
    guardOwner(data, false);
    if (game.active) throw Error("pendingSelection");
    const incoming = ensureCharacterIds(
      route === "cloud/restore"
        ? decodeCloudSave(data?.saveJson, game.rules, { allowEmpty: true })
        : characterSave(
            validateSave(await store.read("before-cloud-read"), game.rules),
            game.rules,
          ),
      ownerId,
    );
    if (incoming.sync && incoming.sync.ownerId !== ownerId) throw Error("accountChanged");
    const tombstones = {
      ...structuredClone(game.sync?.tombstones || {}),
      ...structuredClone(incoming.sync?.tombstones || {}),
    };
    for (const role of game.roles)
      if (role.cloudId && !incoming.roles.some((r) => r.cloudId === role.cloudId))
        tombstones[role.cloudId] ??= { deletedAt: /* @__PURE__ */ new Date().toISOString() };
    for (const role of incoming.roles) if (role.cloudId) delete tombstones[role.cloudId];
    incoming.sync = {
      ...structuredClone(game.sync ?? freshSync(ownerId, device)),
      tombstones,
      lastProgressAt: incoming.sync?.lastProgressAt ?? incoming.lastSaved,
      checkpointWrittenAt: /* @__PURE__ */ new Date().toISOString(),
    };
    inheritStorageCapacity(incoming.roles, game.roles);
    const candidate = new Game7(game.rules, 1);
    candidate.restore(incoming);
    Object.assign(incoming, characterSave(candidate.save(false), game.rules));
    candidate.active = 0;
    await store.write(incoming, false, route === "cloud/restore" ? "before-cloud-read" : void 0);
    candidate.sync = incoming.sync;
    install(candidate);
    return game.snapshot(-1, viewRange);
  }
  if (route === "entry" || route === "open") {
    game.active = 0;
    paused = false;
  } else if (route === "create") {
    game.create(String(data?.name || ""), data?.job, data?.gender).cloudId = crypto.randomUUID();
    await persist();
  } else if (route === "delete") {
    if (game.active) throw Error("pendingSelection");
    const role = game.roles.find((r) =>
      data?.cloudId ? r.cloudId === data.cloudId : r.id === data?.id,
    );
    if (!role) throw Error("missing");
    const previousRoles = game.roles;
    game.roles = game.roles.filter((r) => r !== role);
    try {
      await persist();
    } catch (error) {
      game.roles = previousRoles;
      throw error;
    }
  } else if (route === "start") {
    const role = game.roles.find((r) => r.id === data?.id);
    if (!role) throw new LocalizedError(message("storage.roleMissing"));
    const id = role.id;
    game.restore(characterSave(game.save(false), game.rules));
    await map(game.rules.world.maps.find((m) => m.start).id);
    game.start(id);
    savedAt = game.time;
    game.bringPets(game.me);
    paused = false;
  } else if (route === "save") await persist();
  else if (route.startsWith("command/")) {
    if (
      data?.Shared === true &&
      ["command/StoreItem", "command/TakeBackItem", "command/SortStorage"].includes(route)
    ) {
      const role = game.me;
      if (!role) throw Error("invalid");
      const before = structuredClone({
        inventory: role.inventory,
        sharedStorage: game.sharedStorage,
        nextId: game.nextId,
      });
      try {
        game.command(route.slice(8), data);
        await persist();
      } catch (error) {
        role.inventory = before.inventory;
        game.sharedStorage = before.sharedStorage;
        game.nextId = before.nextId;
        throw error;
      }
      return game.snapshot(after, viewRange);
    }
    if (!foreground) return game.snapshot(after, viewRange);
    if (["command/UseItem", "command/UseItemHotkey"].includes(route) && game.me) {
      const item =
        route === "command/UseItemHotkey"
          ? game.me.inventory.find((i) => i?.id === game.me.itemHotkeys?.[Number(data?.Key)])
          : game.me.inventory.find((i) => i?.uid === Number(data?.UniqueID));
      if (item && game.defs.get(item.id)?.Type === "TreasureMap")
        await map(treasureMapId(game, game.me));
    }
    if (route === "command/CallNPC" && Number(data?.ObjectID) === 9420) {
      const key = String(data?.Key || "")
        .replace(/[\[\]]/g, "")
        .toLowerCase();
      const c = game.rules.adaptations.guideChallenges?.find((c2) => "@challenge-" + c2.id === key);
      if (c) await map(c.map);
    }
    if (route === "command/CallNPC") {
      const key = String(data?.Key || "")
          .replace(/[\[\]]/g, "")
          .toLowerCase(),
        npcId = Number(data?.ObjectID),
        late = game.rules.adaptations.lateContent;
      if (late?.fireAltar && npcId === late.fireAltar.npcId && key === "@late-altar-enter") {
        const challenge = game.rules.adaptations.guideChallenges?.find(
          (c) => c.id === late.fireAltar.challenge,
        );
        if (challenge) await map(challenge.map);
      }
      if (late?.secretTicket && npcId === late.secretTicket.npcId) {
        const destination = late.secretTicket.shortcuts.find(
          (d) => "@late-secret-" + d.map === key,
        );
        if (destination) await map(destination.map);
      }
    }
    if (
      route === "command/CallNPC" &&
      Number(data?.ObjectID) === game.rules.adaptations.trial?.entranceNpc &&
      String(data?.Key).includes("@trialenter")
    )
      await map(game.rules.adaptations.trial.map);
    const challengeBefore =
      route === "command/ConfirmInstanceExit" ? game.me?.challengeRun : void 0;
    game.command(route.slice(8), data);
    if (game.me) {
      await map(game.me.map);
      game.initializeMap(game.me.map);
      game.bringPets(game.me);
      abandonExitedTreasure(game, game.me);
      releaseInactiveMaps();
    }
    if (
      [
        "LogOut",
        "DxTutorialClaim",
        "DxFavorite",
        "DxTutorialCompare",
        "DxTutorialHide",
        "DxTutorialResume",
        "BuyItem",
        "SellItem",
        "SetEquipmentLock",
        "SellEquipmentBatch",
        "FinishQuest",
        "RedeemEvent",
        "RedeemTestTalisman",
        "AcceptQuest",
        "UseItem",
        "CombineItem",
        "Forge",
        "ExchangeScarletSword",
        "CallNPC",
        "EquipItem",
        "RemoveItem",
        "StoreItem",
        "TakeBackItem",
        "MoveItem",
        "SortInventory",
        "SortStorage",
        "UnlockStoragePage",
        "BindItemHotkey",
        "SetAssist",
        "UseItemHotkey",
        "SplitItem",
        "DropItem",
        "PickUp",
        "BuyBackItem",
        "TownRevive",
        "MapTeleport",
      ].includes(route.slice(8)) ||
      (challengeBefore && !game.me?.challengeRun)
    )
      await persist();
  } else if (route !== "state") throw new LocalizedError(message("storage.unsupported"));
  if (
    route === "state" &&
    foreground &&
    game.me?.job === "Taoist" &&
    data?.role === game.me.id &&
    data?.map === game.me.map
  ) {
    game.focusMonster(game.me, Number(data.focus) || 0);
  }
  return game.snapshot(after, viewRange);
}


scope.onmessage = (e) => {
  const { id, route, data, after = -1 } = e.data;
  if (route === "foreground") {
    foreground = !!data?.active;
    last = performance.now();
    accumulator = 0;
    synchronizeTimer();
  }
  serial = serial.then(async () => {
    busy = true;
    try {
      scope.postMessage({ id, result: await request(route, data, after) });
    } catch (error) {
      scope.postMessage({
        id,
        error: errorText(error),
      });
    } finally {
      busy = false;
      synchronizeTimer();
    }
  });
};
var timer;
function releaseInactiveMaps() {
  const id = game.me?.map;
  for (const key of Object.keys(game.maps)) if (Number(key) !== id) delete game.maps[Number(key)];
  const home = game.rules.world.maps.find((m) => m.start).id;
  for (const key of game.geometry.keys())
    if (key !== id && key !== home) {
      game.geometry.delete(key);
      mapLoads.delete(key);
    }
  game.events = game.events.filter((e) => e.map === id);
}
function synchronizeTimer() {
  const running = !!game?.me && !paused && foreground;
  if (!running && timer !== void 0) {
    clearInterval(timer);
    timer = void 0;
    accumulator = 0;
  }
  if (running && timer === void 0) {
    last = performance.now();
    accumulator = 0;
    timer = setInterval(step, 20);
  }
  if (game && !game.me) releaseInactiveMaps();
}
function step() {
  const now = performance.now(),
    elapsed = now - last;
  last = now;
  if (!game || paused || !foreground || busy || !game.me) return;
  accumulator += Math.min(elapsed, 200);
  let steps = 0;
  while (accumulator >= 20 && steps++ < 10) {
    game.tick(20);
    accumulator -= 20;
  }
  if (game.time - savedAt >= 3e4) {
    savedAt = game.time;
    serial = serial
      .then(persist)
      .catch((e) => scope.postMessage({ error: String(e), notification: true }));
  }
}

// Installed only in the Darkforged 2.0.23 game worker. Seals are personal quest flags.
const nightmareSealBosses = ["GuideNative106", "GuideNative188", "GuideNative195"];
function markNightmareKill(g, r, a, d) {
  if (
    r.level < 70 ||
    a.special?.trialFloor ||
    a.special?.challenge ||
    a.master ||
    r.trialRun ||
    r.challengeRun ||
    r.treasureRun
  )
    return;
  if (a.special?.nightmareOwner === r.id && d.Name === "GuideNative196" && a.map === 2044) {
    g.map(a.map).actors = g.map(a.map).actors.filter((m) => m.special?.nightmareHelper !== a.id);
    if (!r.nightmareFirstClear) {
      r.nightmareFirstClear = true;
      g.say("混沌魔王首杀完成。拾取战利品后可携此角色进入噩梦。");
    }
    return;
  }
  const seal = nightmareSealBosses.indexOf(d.Name);
  if (seal >= 0 && a.spawn !== undefined && !r.nightmareFirstClear) {
    const bit = 1 << seal;
    if (!((r.nightmareSeals || 0) & bit)) {
      r.nightmareSeals = (r.nightmareSeals || 0) | bit;
      g.say("获得冰川祭坛封印。");
    }
  }
}
function summonNightmareFinal(g, r) {
  if (
    r.dead ||
    r.level < 70 ||
    r.nightmareFirstClear ||
    r.nightmareSeals !== 7 ||
    r.map !== 2044 ||
    Math.max(Math.abs(r.x - 130), Math.abs(r.y - 126)) > 6
  )
    throw Error("请集齐三印后到冰川中央祭坛。");
  const map = g.map(2044);
  if (map.actors.some((a) => !a.dead && a.special?.nightmareOwner === r.id))
    throw Error("魔王已经出现。");
  const at = g.freeNear(2044, { x: 130, y: 126 }, 5);
  if (!at) throw Error("祭坛附近没有可用位置。");
  const def = g.rules.monsters.find((d) => d.Name === "GuideNative196");
  const boss = g.newMonster(def, 2044, at);
  (boss.special ??= {}).nightmareOwner = r.id;
  Object.assign(boss.special, {
    nightmarePhase: 0,
    nightmareStarted: g.time,
    nightmareRegenAt: g.time,
  });
  g.refreshActor(boss);
  boss.hp = boss.maxHP;
  map.actors.push(boss);
  g.say("混沌魔王现身。击败它后，你可自行决定何时复制角色。");
}

function tickNightmareFinal(g, boss, r) {
  const state = boss.special;
  if (boss.dead || state.nightmareOwner !== r.id) return;
  const actors = g.map(boss.map).actors;
  const thresholds = [0.7, 0.4, 0.15];
  while (
    state.nightmarePhase < thresholds.length &&
    boss.hp <= boss.maxHP * thresholds[state.nightmarePhase]
  ) {
    const phase = state.nightmarePhase++;
    const def = g.rules.monsters.find((d) => d.Name === nightmareSealBosses[phase]);
    const at = g.freeNear(boss.map, boss, 5);
    if (!at) continue;
    const helper = g.newMonster(def, boss.map, at);
    Object.assign((helper.special ??= {}), { bossMinion: true, nightmareHelper: boss.id });
    helper.hp = Math.max(1, Math.round(helper.maxHP * 0.1));
    actors.push(helper);
    if (phase === 1) state.nightmareHealer = helper.id;
    g.say("魔王召回了封印守卫。");
  }
  if (g.time - state.nightmareRegenAt >= 1000) {
    state.nightmareRegenAt = g.time;
    if (state.nightmareHealer && actors.some((a) => a.id === state.nightmareHealer && !a.dead))
      boss.hp = Math.min(boss.maxHP, boss.hp + Math.floor(boss.maxHP * 0.0005));
  }
  const elapsed = g.time - state.nightmareStarted;
  const bonus =
    (state.nightmarePhase >= 3 ? 0.25 : 0) +
    (elapsed >= 900000 ? 0.1 * (1 + Math.floor((elapsed - 900000) / 30000)) : 0);
  boss.stats.MinDC = Math.round(130 * (1 + bonus));
  boss.stats.MaxDC = Math.round(260 * (1 + bonus));
}

