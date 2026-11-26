import { EncryptedSaveStore as In } from "/Game/site-assets/encrypted-save.js";
function Hn(e, t) {
  const a = Number(e),
    i = Number(t);
  return !Number.isFinite(a) || !Number.isFinite(i) || a <= 0 || i <= 0
    ? 24
    : Math.max(
        24,
        Math.min(
          26,
          Math.ceil(Math.max(Math.min(a, 1920) / 96 + 2, (Math.min(i, 1080) / 2 + 90) / 32 + 6)),
        ),
      );
}
function dreamAttackDelay(e) {
  return Math.max(600, 1100 - 50 * (e.AttackSpeed || 0));
}
function dreamCastDelay(e) {
  return Math.max(600, 1500 - 90 * (e.CastSpeed || 0));
}
var hydraLevel = (e) => Math.min(7, Math.max(0, Math.trunc(e)));
function hydraStats(e, t) {
  const a = e.HydraRanks?.[hydraLevel(t)];
  if (!a) throw Error("Missing Hydra rank configuration");
  return a;
}
var message = (e, t = {}) => ({
    $text: e,
    params: t,
  }),
  entityText = (e, t, a = "name") => ({
    $entity: e,
    id: String(t),
    field: a,
  }),
  b = class extends Error {
    detail;
    constructor(e) {
      (super(e.$text), (this.name = "LocalizedError"), (this.detail = e));
    }
  };
function mt(e) {
  return e instanceof b ||
    (e instanceof Error && "detail" in e && typeof e.detail?.$text == "string")
    ? e.detail
    : e instanceof Error
      ? e.message
      : String(e);
}
function poisoningDamage(e, t) {
  return (
    Math.max(1, Math.floor(4 * e + Math.max(0, ((t.MinSC || 0) + (t.MaxSC || 0)) / 2) * 0.2)) +
    Math.max(0, t.AffixPoisonDamage || 0)
  );
}
function le(e, t, a = {}) {
  let i = e.DreamSkill
    ? e.DreamSkill.costBase + Math.max(0, t - 1) * e.DreamSkill.costStep
    : e.BaseCost + t * e.LevelCost;
  return (
    ["Teleport", "Blink"].includes(e.Spell) &&
      (i += Math.trunc((i * (a.TeleportManaPenaltyPercent || 0)) / 100)),
    Math.max(0, Math.trunc(i * (1 + (a.ManaPenaltyPercent || 0) / 100)))
  );
}
function effectiveSkillLevel(e, t, a) {
  if (!t.DreamSkill || e.temporary) return e.Level;
  const i =
    e.Level +
    Math.max(0, Math.trunc(a["SkillLevel:" + t.Spell] || 0)) +
    Math.max(0, Math.trunc(a["ElementLevel:" + t.DreamSkill.element] || 0));
  return t.Spell === "Hydra" ? hydraLevel(i) : i;
}
function ka(e, t, a, i = !0) {
  if (e.Spell === "Hydra") return hydraStats(e, t).power;
  const n = e.DreamRaw,
    s = Math.min(10, Math.max(0, t));
  if (n?.MultiBase) {
    const r = (l, u) =>
        Number(n[l] || 0) + (a && n[u] ? a.next(Number(n[u]) + 1) : i ? Number(n[u] || 0) : 0),
      c = r("MPowerBase", "MPowerBonus");
    return Math.trunc(Math.fround(Math.fround(c * (s + 2)) * 0.5)) + r("PowerBase", "PowerBonus");
  }
  const o = e.DreamSkill;
  return Math.max(0, Math.floor(o.powerBase + o.powerStep * s));
}
function dreamCoefficient(e, t) {
  if (e.Spell === "Hydra") return hydraStats(e, t).mcPercent / 100;
  const a = e.DreamRaw,
    i = Math.min(10, Math.max(0, t));
  return a?.MultiBase
    ? Math.max(0, (a.MultiBase + (i + 1) * (a.MultiBonus || 0)) / 100)
    : Math.max(0, e.DreamSkill.coefficient + e.DreamSkill.coefficientStep * i);
}
function bookNextRank(e, t, a, i) {
  const n = a + 1,
    s = Number(t.DreamBookMin || 1),
    o = Number(t.DreamBookMax || 3);
  if (n < s)
    throw new b(
      message("core.dream-skills.bookNextRank.3f898de048", {
        p0: entityText("skills", e.Spell),
        p1: s - 1,
      }),
    );
  if (n > o)
    throw new b(
      message("core.dream-skills.bookNextRank.b42eb4fe14", {
        p0: s,
        p1: o,
      }),
    );
  const r = e.DreamRanks?.[n - 1];
  if (!r) throw new b(message("core.dream-skills.bookNextRank.d7dd7a4828"));
  if (i < r.LvReq)
    throw new b(
      message("core.dream-skills.bookNextRank.564a7fbe79", {
        p0: r.LvReq,
      }),
    );
  return n;
}
function dreamPassiveStats(e, t) {
  const a = Math.min(t, e.DreamRanks?.length || 3);
  switch (e.Spell) {
    case "Fencing":
      return {
        Accuracy: [0, 3, 5, 8][a],
        MinDC: [0, 3, 5, 7][a],
        MaxDC: [0, 3, 5, 7][a],
      };
    case "SpiritSword":
      return {
        Accuracy: a,
        Agility: Math.max(0, a - 1),
      };
    case "Steadfast":
      return {
        NoFlinchPercent: t > 0 ? Number(e.DreamRanks?.[Math.min(3, t) - 1]?.Increase || 0) : 0,
      };
    case "Berserker":
      return {
        MinDCRatePercent: 10 + 5 * a,
        MaxDCRatePercent: 15 + 5 * a,
        Accuracy: 1 + a,
      };
    default:
      return {};
  }
}
var Et = class {
    seed = Array(56).fill(0);
    i = 0;
    j = 21;
    constructor(e = 1) {
      let t = 161803398 - Math.abs(e === -2147483648 ? 2147483647 : e);
      this.seed[55] = t;
      let a = 1;
      for (let i = 1; i < 55; i++) {
        const n = (21 * i) % 55;
        ((this.seed[n] = a), (a = (t - a) | 0), a < 0 && (a += 2147483647), (t = this.seed[n]));
      }
      for (let i = 1; i < 5; i++)
        for (let n = 1; n < 56; n++)
          ((this.seed[n] = (this.seed[n] - this.seed[1 + ((n + 30) % 55)]) | 0),
            this.seed[n] < 0 && (this.seed[n] += 2147483647));
    }
    sample() {
      (++this.i >= 56 && (this.i = 1), ++this.j >= 56 && (this.j = 1));
      let e = (this.seed[this.i] - this.seed[this.j]) | 0;
      return (e === 2147483647 && e--, e < 0 && (e += 2147483647), (this.seed[this.i] = e), e);
    }
    next(e, t = 0) {
      if (!Number.isInteger(e) || e < t) throw Error("Invalid random bounds");
      return t + Math.floor((this.sample() / 2147483647) * (e - t));
    }
    export() {
      return {
        seed: [...this.seed],
        i: this.i,
        j: this.j,
      };
    }
    restore(e) {
      ((this.seed = [...e.seed]), (this.i = e.i), (this.j = e.j));
    }
  },
  T = Math.fround;
function On(e, t, a) {
  if (!e.Gain) return e.Base;
  let i;
  return (
    e.FormulaType === "Health"
      ? (i = T(e.Base + T(T(T(a / e.Gain) + e.GainRate) + (t === "Warrior" ? T(a / 20) : 0)) * a))
      : e.FormulaType === "Mana"
        ? (i = T(
            t === "Wizard"
              ? T(e.Base + T(T(T(T(a / e.Gain) + 2) * T(2.2)) * a)) + T(a * e.GainRate)
              : t === "Taoist"
                ? T(e.Base + T(T(T(a / e.Gain) * T(2.2)) * a)) + T(a * e.GainRate)
                : T(e.Base + T(a * e.Gain)) + T(a * e.GainRate),
          ))
        : (i =
            e.FormulaType === "Weight"
              ? T(e.Base + T(T(a / e.Gain) * a))
              : T(e.Base + T(a / e.Gain))),
    Math.trunc(Math.min(e.Max > 0 ? e.Max : 2147483647, i))
  );
}
var pt = (e, t, a = !1) =>
  a
    ? dreamAttackDelay(t)
    : Math.max(550, 1400 - ((t.AttackSpeed || 0) * 60 + Math.min(370, e * 14)));
function z(e, t, a) {
  const i = Math.max(0, e["Min" + t] || 0),
    n = Math.max(i, e["Max" + t] || 0),
    s = e.Luck || 0,
    o = (r) => Math.floor(r * (1 - Math.min(100, e.NativeCursePercent || 0) / 100));
  return s > 0 && (e.NativeLuckFormula ? a.next(100) < Math.min(80, s * 8) : s > a.next(10))
    ? o(n)
    : s < 0 && s < -a.next(e.NativeLuckFormula ? 10 - s : 10)
      ? o(i)
      : o(a.next(n + 1, i));
}
function Se(e) {
  const t = Math.floor(e);
  return e - t === 0.5 ? t + (t % 2) : Math.round(e);
}
function magicPower(e, t, a) {
  if (e.DreamSkill) return ka(e, t);
  const i = e.MPowerBonus > 0 ? a.next(e.MPowerBase + e.MPowerBonus, e.MPowerBase) : e.MPowerBase,
    n = e.PowerBonus > 0 ? a.next(e.PowerBase + e.PowerBonus, e.PowerBase) : e.PowerBase;
  return Se(T(T(T(i / 4) * (t + 1)) + n));
}
var magicDamage = (e, t, a, i) =>
  e.DreamSkill
    ? Math.trunc(Math.fround(Math.fround(a + ka(e, t, i)) * Math.fround(dreamCoefficient(e, t))))
    : Math.trunc(T((a + magicPower(e, t, i)) * T(e.MultiplierBase + T(t * e.MultiplierBonus))));
function matchesClass(e, t) {
  return (
    e === "None" ||
    e === t ||
    e === "WarWizTao" ||
    e.split(", ").includes(t) ||
    ({
      Warrior: "War",
      Wizard: "Wiz",
      Taoist: "Tao",
    }[t] &&
      e.includes(
        {
          Warrior: "War",
          Wizard: "Wiz",
          Taoist: "Tao",
        }[t],
      ))
  );
}
var Ke = new Set([
    "Weapon",
    "Armour",
    "Helmet",
    "Necklace",
    "Bracelet",
    "Ring",
    "Belt",
    "Boots",
    "Stone",
  ]),
  qn = {
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
function itemSlots(e) {
  return e.DreamType === 6 ? [14] : qn[e.Type];
}
function price(e, t) {
  let a = t.Price;
  if (t.Durability > 0) {
    a = Math.trunc(T(e.maxDura * T(T(t.Price / 2) / t.Durability)));
    const i = e.maxDura ? T(e.currentDura / e.maxDura) : 0;
    a = Math.floor(T(T(T(a / 2) + T(T(a / 2) * i)) + T(t.Price / 2)));
  }
  return Math.trunc(T(a * T(T(Object.keys(e.added).length * T(0.1)) + 1))) * e.count;
}
function En(e, t, a, i) {
  const n = t.RandomStats || {},
    s = (l, u) => {
      let h = 0;
      for (let p = 0; p < l; p++) a.next(u) === 0 && h++;
      return h;
    };
  if (n.MaxDuraChance > 0 && a.next(n.MaxDuraChance) === 0) {
    const l = s(n.MaxDuraMaxStat, n.MaxDuraStatChance) * 1e3;
    ((e.maxDura = Math.min(65535, e.maxDura + l)), (e.currentDura = e.maxDura));
  }
  const o = {
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
    },
    r = i?.qualityProfiles?.[String(t.Grade)],
    c = r || i;
  if (
    i &&
    c &&
    Ke.has(t.Type) &&
    i.profiles.includes(t.RandomStatsId) &&
    (r ||
      (!i.qualityProfiles && t.RequiredType === "Level" && t.RequiredAmount <= i.maxRequiredLevel))
  ) {
    if (a.next(100) >= c.exceptionalPercent) return;
    const l = new Set(["MaxAC", "MaxMAC", "MaxDC", "MaxMC", "MaxSC"]),
      u = Object.entries(o)
        .filter(([k]) => n[k + "Chance"] > 0)
        .map(([, k]) => ({
          key: k,
          weight: ["MaxDC", "MaxMC", "MaxSC"].includes(k) ? 3 : 1,
          min: 1,
          max: l.has(k) ? c.totalPointWeights.length : 1,
        }));
    u.push(
      {
        key: "KillHP",
        weight: 2,
        min: i.killHP[0],
        max: i.killHP[1],
      },
      {
        key: "KillMP",
        weight: 2,
        min: i.killMP[0],
        max: i.killMP[1],
      },
    );
    let h = 1,
      p = a.next(c.totalPointWeights.reduce((k, w) => k + w, 0));
    for (; h < c.totalPointWeights.length && p >= c.totalPointWeights[h - 1]; )
      p -= c.totalPointWeights[h++ - 1];
    const g = a.next(100);
    let y = Math.min(
      h,
      g < i.thirdAffixPercent ? 3 : g < i.thirdAffixPercent + i.secondAffixPercent ? 2 : 1,
    );
    const f = [],
      v = (k, w) => {
        if (w.length === y) {
          w.reduce((D, E) => D + E.min, 0) <= h &&
            w.reduce((D, E) => D + E.max, 0) >= h &&
            f.push({
              stats: w,
              weight: w.reduce((D, E) => D * E.weight, 1),
            });
          return;
        }
        for (let D = k; D < u.length; D++) v(D + 1, [...w, u[D]]);
      };
    for (; y > 0 && !f.length; ) (v(0, []), f.length || y--);
    if (!f.length) return;
    p = a.next(f.reduce((k, w) => k + w.weight, 0));
    let x = 0;
    for (; p >= f[x].weight; ) p -= f[x++].weight;
    const m = f[x].stats;
    let M = h;
    for (let k = 0; k < m.length; k++) {
      const w = m[k],
        D = m.slice(k + 1),
        E = Math.max(w.min, M - D.reduce((A, C) => A + C.max, 0)),
        W = Math.min(w.max, M - D.reduce((A, C) => A + C.min, 0)),
        j = E === W ? E : a.next(W + 1, E);
      ((e.added[w.key] = j), (M -= j));
    }
    return;
  }
  for (const [l, u] of Object.entries(o))
    n[l + "Chance"] > 0 &&
      a.next(n[l + "Chance"]) === 0 &&
      (e.added[u] = s(n[l + "MaxStat"] - 1, n[l + "StatChance"]) + 1);
}


function Aa(e, t) {
  if (!t.adaptations.dreamRuntime || e.Type !== "Book") return !0;
  const a = t.skills.find((n) => n.Spell === e.Spell);
  if (!a?.DreamSkill) return !1;
  const i = a.DreamRaw?.Job;
  return i === void 0 || e.RequiredClass === ["Warrior", "Wizard", "Taoist"][i];
}
function Ca(e, t, a, i) {
  const n = e.item === null ? void 0 : t.get(e.item);
  if (n && !Aa(n, a)) return null;
  const s =
      e.dropMultiplierMode === "fixed"
        ? 1
        : e.gold > 0
          ? a.multipliers.goldDropChanceMultiplier
          : n && Ke.has(n.Type) && !e.quest
            ? a.multipliers.equipmentDropMultiplier
            : 1,
    o = Math.max(1, Math.trunc(e.chance));
  if (
    e.chancePercent !== void 0
      ? i.next(1e4) >= Math.min(100, e.chancePercent * s) * 100
      : s === 1
        ? i.next(o) !== 0
        : (i.sample() / 2147483647) * o >= s
  )
    return null;
  if (e.gold)
    return {
      gold: Math.min(
        4294967295,
        i.next(e.gold + Math.floor(e.gold / 2), Math.floor(e.gold / 2)) *
          a.multipliers.goldAmountMultiplier,
      ),
      items: [],
    };
  if (e.item !== null)
    return {
      gold: 0,
      items: n
        ? [
            {
              id: n.Index,
              quest: e.quest,
            },
          ]
        : [],
    };
  let r = 0,
    c = [];
  if (e.group) {
    for (const l of e.group.items) {
      const u = Ca(l, t, a, i);
      if (u && ((r += u.gold), c.push(...u.items), e.group.first)) break;
    }
    e.group.random && c.length && (c = [c[i.next(c.length)]]);
  }
  return {
    gold: r,
    items: c,
  };
}
var Da = 80,
  Fn = [0, 5e5, 1e6];
function equipmentCapacity(e, t) {
  const a = t.adaptations.bagExpansion;
  return a.baseSlots + (e.bagExpansionRows || 0) * a.columns;
}
function carriedCapacity(e, t) {
  return equipmentCapacity(e, t) * (e.bagLayoutVersion === 1 ? 2 : 1);
}
function isBagEquipment(e) {
  return !!itemSlots(e)?.length;
}
function bagRange(e, t, a) {
  const i = equipmentCapacity(e, t);
  return e.bagLayoutVersion !== 1
    ? [0, e.inventory.length]
    : isBagEquipment(a)
      ? [0, i]
      : [i, 2 * i];
}
function bagSlotAccepts(e, t, a, i) {
  const [n, s] = bagRange(e, t, a);
  return i >= n && i < s;
}
function Ha(e, t, a) {
  const i = equipmentCapacity(e, t),
    n = e.inventory;
  if (
    e.bagLayoutVersion === 1 &&
    n.length === 2 * i &&
    n.every((c, l) => !c || (!!a.get(c.id) && bagSlotAccepts(e, t, a.get(c.id), l)))
  )
    return;
  const s = Array(2 * i).fill(null),
    o = [];
  for (let c = 0; c < n.length; c++) {
    const l = n[c];
    if (!l) continue;
    const u = a.get(l.id);
    if (!u) throw new b(message("storage.inventory"));
    const h = isBagEquipment(u) ? 0 : i,
      p = h + i;
    c >= h && c < p && !s[c] ? (s[c] = l) : o.push(l);
  }
  const r = [];
  for (const c of o) {
    const l = a.get(c.id),
      u = isBagEquipment(l) ? 0 : i,
      h = s.findIndex((p, g) => !p && g >= u && g < u + i);
    h < 0 ? r.push(c) : (s[h] = c);
  }
  for (const c of r) {
    const l = n.indexOf(c),
      u = l >= 0 && l < s.length && !s[l] ? l : s.findIndex((h) => !h);
    if (u < 0) throw new b(message("storage.inventory"));
    s[u] = c;
  }
  ((e.inventory = s), (e.bagLayoutVersion = 1));
}
function Wn(e, t) {
  const a = e.storagePages || 1;
  if (!Number.isSafeInteger(t) || t !== a + 1 || t > 3) throw new b(message("storage.unlockOrder"));
  const i = Fn[t - 1];
  if (e.gold < i)
    throw new b(
      message("storage.unlockGold", {
        gold: i,
      }),
    );
  ((e.gold -= i), e.storage.push(...Array(Da).fill(null)), (e.storagePages = t));
}
function ht(e, t) {
  for (const a of e) {
    const i = t.find(
        (s) =>
          (a.cloudId && s.cloudId === a.cloudId) ||
          (!a.cloudId && !s.cloudId && s.id === a.id && s.name === a.name && s.job === a.job),
      ),
      n = Math.max(a.storagePages || 1, i?.storagePages || 1);
    n > (a.storagePages || 1) &&
      (a.storage.push(...Array(n * Da - a.storage.length).fill(null)), (a.storagePages = n));
  }
}
var Na = ["Potion", "Scroll", "Book", "BagExpansion", "TreasureMap"];
function migrateItemHotkeys(e, t) {
  e.itemHotkeys ??= Array.from(
    {
      length: 6,
    },
    (a, i) => {
      const n = e.inventory[i];
      return n && Na.includes(t.get(n.id)?.Type || "") ? n.id : null;
    },
  );
}
function isTeleportRing(e) {
  return e?.Type === "Ring" && e.Unique?.split(",").some((t) => t.trim() === "Teleport");
}
function Ra(e, t) {
  const a = e.equipment[t.slot];
  if (!a) return;
  const i = (s) => a.uid === s.uid && a.id === s.id,
    n = i(t.teleport) ? t.original : i(t.original) ? t.teleport : null;
  if (n) return e.inventory.find((s) => s?.uid === n.uid && s.id === n.id);
}
function Ba(e, t, a) {
  Array.isArray(e.ringHotkeys) &&
    (e.ringHotkeys = e.ringHotkeys.map((i) => {
      if (!i) return null;
      const n = (r) => t.get(r) ?? a?.get(r),
        s = n(i.teleport?.uid),
        o = n(i.original?.uid);
      return s === void 0 || o === void 0
        ? null
        : {
            ...i,
            teleport: {
              ...i.teleport,
              uid: s,
            },
            original: {
              ...i.original,
              uid: o,
            },
          };
    }));
}
var pe = {
  cap: 10,
  experiencePerLevel: 7e4,
};
function weaponGrowthStats(e, t) {
  if (t.Type !== "Weapon" || (e.maxDura > 0 && !e.currentDura)) return {};
  const a = Math.min(pe.cap, e.weaponGrowth?.level || 0);
  return {
    Luck: Math.floor(a / 3),
    WeakSpotPercent: a * 2,
  };
}
function Ta(e, t, a) {
  const i = t.equipment[0];
  if (
    !e.rules.adaptations.dreamRuntime ||
    !i ||
    e.defs.get(i.id)?.Type !== "Weapon" ||
    (i.maxDura > 0 && !i.currentDura) ||
    a <= 0
  )
    return;
  const n = (i.weaponGrowth ??= {
    level: 0,
    xp: 0,
  });
  if (n.level >= pe.cap) return;
  const s = n.level;
  for (n.xp += Math.floor(a); n.level < pe.cap && n.xp >= (n.level + 1) * pe.experiencePerLevel; )
    ((n.xp -= (n.level + 1) * pe.experiencePerLevel), n.level++);
  (n.level === pe.cap && (n.xp = 0),
    n.level !== s &&
      (e.refresh(t),
      e.say(
        message("core.weapon-growth.gainWeaponGrowth.8021f12fab", {
          p0: n.level,
          p1: Math.floor(n.level / 3),
          p2: n.level * 2,
        }),
      )));
}
var $n = new Set(["MaxDC", "MaxMC", "MaxSC", "MaxAC", "MaxMAC", "Luck", "Accuracy", "Agility"]),
  lc = [
    {
      name: message("quality.0"),
      color: "#ffffff",
      guideColor: "#002060",
    },
    {
      name: message("quality.1"),
      color: "#42d976",
      guideColor: "#00b050",
    },
    {
      name: message("quality.2"),
      color: "#acc769",
      guideColor: "#76923c",
    },
    {
      name: message("quality.3"),
      color: "#66ffff",
      guideColor: "#66ffff",
    },
    {
      name: message("quality.4"),
      color: "#6699ff",
      guideColor: "#0033cc",
    },
    {
      name: message("quality.5"),
      color: "#ff7474",
      guideColor: "#ff0000",
    },
    {
      name: message("quality.6"),
      color: "#9999ff",
      guideColor: "#000099",
    },
    {
      name: message("quality.7"),
      color: "#ffff66",
      guideColor: "#ffff66",
    },
    {
      name: message("quality.8"),
      color: "#ff66ff",
      guideColor: "#ff00ff",
    },
  ];
function ke(e) {
  return e?.added.GemTier
    ? e.added.GemTier === 2
      ? 4
      : 1
    : Object.entries(e?.added || {}).reduce(
        (t, [a, i]) => t + ($n.has(a) && Number.isFinite(i) ? Math.max(0, i) : 0),
        0,
      );
}
function Gn(e, t) {
  const a = new Map();
  for (const i of e) if (i) for (const n of t.get(i.id)?.DreamSets || []) a.set(n.id, n);
  return [...a.values()].map((i) => {
    const n = e.filter((o) => !!o && (!o.maxDura || o.currentDura > 0)),
      s = i.members.reduce(
        (o, r) => o + Math.min(r.count, n.filter((c) => r.items.includes(c.id)).length),
        0,
      );
    return {
      ...i,
      count: s,
      total: i.members.reduce((o, r) => o + r.count, 0),
    };
  });
}
function Pe(e) {
  return e?.locked === !0 || e?.dxFavorite === !0;
}
function equipmentLockable(e, t) {
  return !!e && !!t && t.StackSize === 1 && !!itemSlots(t)?.length && e.count === 1;
}
function assertEquipmentDisposable(e) {
  if (Pe(e)) throw new b(message("manage.protected"));
}
function Qn(e, t, a) {
  if (!Number.isSafeInteger(a.UniqueID) || typeof a.Locked != "boolean")
    throw new b(message("manage.invalidItem"));
  const i = [...t.inventory, ...t.equipment, ...t.storage].find((n) => n?.uid === a.UniqueID);
  if (!equipmentLockable(i, e.defs.get(i?.id ?? -1))) throw new b(message("manage.invalidItem"));
  e.rules.adaptations.diablo?.enabled
    ? (a.Locked ? (i.dxFavorite = !0) : delete i.dxFavorite, delete i.locked)
    : a.Locked
      ? (i.locked = !0)
      : delete i.locked;
}
var saleQualities = (e) =>
  e
    ? ["normal", "magic", "rare", "set", "legendary"]
    : Array.from(
        {
          length: 9,
        },
        (t, a) => "q" + a,
      );
function saleQuality(e, t) {
  return t ? String(e.dx?.rarity || "normal") : "q" + Math.min(8, Math.floor(ke(e)));
}
function saleSpecial(e, t) {
  const a = e.dx;
  return !!(
    e.affixes?.length ||
    e.handmade ||
    e.bound ||
    e.potential ||
    e.potentialOptions?.length ||
    e.gemCount ||
    e.added.GemTier ||
    e.weaponGrowth?.level ||
    e.weaponGrowth?.xp ||
    t.BossAccessory ||
    t.DreamSets?.length ||
    (t.Unique && t.Unique !== "None") ||
    ["set", "legendary"].includes(a?.rarity || "") ||
    a?.sockets ||
    a?.runes?.length ||
    a?.affixes?.length ||
    a?.runeword
  );
}
function Un(e, t, a, i = !1) {
  const n = saleQualities(i);
  if (
    !a ||
    !Array.isArray(a.qualities) ||
    a.qualities.some((r) => !n.includes(r)) ||
    typeof a.includeSpecial != "boolean"
  )
    throw new b(message("manage.invalidFilter"));
  const s = new Set(e.equipment.filter(Boolean).map((r) => r.uid));
  e.mountUid && s.add(e.mountUid);
  const o = e.inventory
    .filter((r) => !!r)
    .filter((r) => {
      const c = t.get(r.id);
      return (
        equipmentLockable(r, c) &&
        !Pe(r) &&
        !s.has(r.uid) &&
        !c.Bind.includes("DontSell") &&
        a.qualities.includes(saleQuality(r, i)) &&
        (a.includeSpecial || !saleSpecial(r, c))
      );
    })
    .sort((r, c) => r.uid - c.uid)
    .map((r) => ({
      item: r,
      gold: Math.trunc(price(r, t.get(r.id)) / 2),
      special: saleSpecial(r, t.get(r.id)),
    }));
  return {
    rows: o,
    total: o.reduce((r, c) => r + c.gold, 0),
    expected: JSON.stringify(o.map(({ item: r, gold: c }) => [r, c])),
  };
}
function Kn(e, t, a) {
  const i = e.requireNPC(t);
  if (i.id !== a.NPCID || !e.rules.adaptations.universalSaleRoles.includes(i.role))
    throw new b(message("manage.shopRequired"));
  const n = Un(t, e.defs, a.Filter, !!e.rules.adaptations.diablo?.enabled);
  if (!n.rows.length || n.expected !== a.Expected) throw new b(message("manage.saleChanged"));
  if (!Number.isSafeInteger(n.total) || !Number.isSafeInteger(t.gold + n.total))
    throw new b(message("manage.invalidFilter"));
  const s = structuredClone(t),
    o = e.nextId,
    r = e.packets.slice(),
    c = e.cursor;
  try {
    for (const { item: l } of n.rows)
      e.command("SellItem", {
        UniqueID: l.uid,
        Count: l.count,
      });
  } catch (l) {
    throw (
      Object.assign(t, s),
      s.buyback === void 0 && delete t.buyback,
      (e.nextId = o),
      (e.packets = r),
      (e.cursor = c),
      l
    );
  }
  e.say(
    message("manage.sold", {
      count: n.rows.length,
      gold: n.total,
    }),
  );
}
function Ye(e, t) {
  const a = t.adaptations.towns,
    i = a?.settlements.find((s) => s.id === (e.homeTown || a.default));
  if (i) return i;
  const n = t.world.maps.find((s) => s.start);
  return {
    id: a?.default || "village",
    name: "\u65B0\u624B\u6751",
    map: n.id,
    at: n.center,
    radius: 4,
    npcIds: [],
  };
}


function qa(e, t) {
  const a = Ye(
    {
      homeTown: "bichon",
    },
    e.rules,
  );
  ((t.map = a.map),
    ([t.x, t.y] = a.at),
    (t.target = 0),
    (e.npc = 0),
    e.initializeMap(t.map),
    e.bringPets(t));
}
function $t(e, t) {
  const a = [];
  for (const i of t.adaptations.towns?.waypoints || [])
    !i.unlockOnArrival ||
      e.unlockedWaypoints?.includes(i.id) ||
      (e.map !== i.map && !(i.arrivalQuest && e.completedQuests.includes(i.arrivalQuest))) ||
      ((e.unlockedWaypoints ??= []).push(i.id), a.push(i.id));
  return a;
}
function Xn(e, t, a, i) {
  const n = e.rules.adaptations.towns?.waypoints || [],
    s = n.find((u) => u.npcId === a.id && i === "@waypointreturn-" + u.id),
    o = n.find((u) => u.stationIds.includes(a.id) && i === "@waypoint-" + u.id),
    r = s || o;
  if (!r) return !1;
  if ((e.requireNPC(t), !s && !t.unlockedWaypoints?.includes(r.id)))
    throw new b(
      message("npc.waypointLocked", {
        map: entityText("maps", r.map),
      }),
    );
  const c = s ? r.returnMap : r.map,
    l = s ? r.returnAt : r.at;
  return (
    s &&
      !t.unlockedWaypoints?.includes(r.id) &&
      ((t.unlockedWaypoints ??= []).push(r.id),
      e.say(
        message("npc.waypointUnlocked", {
          map: entityText("maps", r.map),
        }),
      )),
    (t.target = 0),
    (t.map = c),
    (t.x = l[0]),
    (t.y = l[1]),
    (e.npc = 0),
    e.emit("NPCResponse", {
      NPCID: a.id,
      Page: [],
    }),
    !0
  );
}
function Jn(e, t, a) {
  return (e.rules.adaptations.towns?.waypoints || []).flatMap((i) => {
    const n = {
      map: entityText("maps", i.map),
    };
    return i.npcId === a.id
      ? [
          message(i.unlockOnArrival ? "npc.waypointArrivalIntro" : "npc.waypointIntro", n),
          {
            $dialogue: [
              {
                label: message("npc.waypointReturn"),
                action: "@waypointreturn-" + i.id,
              },
            ],
          },
        ]
      : i.stationIds.includes(a.id)
        ? t.unlockedWaypoints?.includes(i.id)
          ? [
              {
                $dialogue: [
                  {
                    label: message("npc.waypointTravel", n),
                    action: "@waypoint-" + i.id,
                  },
                ],
              },
            ]
          : [message(i.unlockOnArrival ? "npc.waypointArrivalLocked" : "npc.waypointLocked", n)]
        : [];
  });
}
function Ea(e, t, a) {
  const i = e.rules.adaptations.guideChallenges?.find((p) => p.id === a),
    n = e.requireNPC(t),
    s = e.rules.adaptations.lateContent?.fireAltar,
    o =
      !!s &&
      a === s.challenge &&
      n.id === s.npcId &&
      t.level >= s.level &&
      t.lateQuests?.altar?.stage === 3;
  if (!i || t.dead || (n.id !== 9420 && !o))
    throw new b(message("core.challenges.enterChallenge.924500cc7e"));
  if (t.challengeRun || t.trialRun || t.treasureRun)
    throw new b(message("core.challenges.enterChallenge.381831c37b"));
  if (e.count(t, i.ticket) < 1)
    throw new b(
      message("core.challenges.enterChallenge.3ac3294db7", {
        p0: entityText("items", i.ticket),
      }),
    );
  const r = e.region(i.map),
    c = e.geometry.get(i.map),
    [l, u] = r.center;
  if (!c || c.solid[u * c.width + l])
    throw new b(message("core.challenges.enterChallenge.9c11bd7a83"));
  ((e.maps[i.map] = {
    actors: [],
    respawns: {},
  }),
    (e.events = e.events.filter((p) => p.map !== i.map)),
    e.consume(t, i.ticket, 1),
    (t.map = i.map),
    (t.x = l),
    (t.y = u),
    (t.target = 0),
    (e.npc = 0));
  const h = (t.challengeRewards ??= {
    sequence: 0,
    poCompletions: 0,
    pending: [],
    claimed: [],
  });
  ((t.challengeRun = {
    runId: t.id + ":" + ++h.sequence,
    id: a,
    map: i.map,
    wave: 0,
    started: !1,
    cleared: !1,
    deadline: e.time + i.minutes * 6e4,
    nextWaveAt: 0,
  }),
    e.initializeMap(i.map),
    e.bringPets(t),
    e.emit("NPCResponse", {
      NPCID: 9420,
      Page: [],
    }),
    e.emit("MapChanged", {
      MapIndex: i.map,
    }),
    e.say(
      message("core.challenges.enterChallenge.c380a5cf44", {
        p0: entityText("maps", r.id),
        p1: i.minutes,
      }),
    ));
}
function Fa(e, t, a = message("challenge.left"), i = !1) {
  const n = t.challengeRun;
  if (!n) return;
  t.dead && ((t.dead = !1), (t.hp = Math.max(1, t.maxHP)), (t.mp = t.maxMP), (t.buffs = []));
  const s = e.rules.adaptations.guideChallenges?.find((o) => o.id === n.id);
  if (i && s?.ticketName.endsWith("\u85CF\u5B9D\u56FE")) qa(e, t);
  else {
    const o = e.rules.world.maps.find((r) => r.start);
    ((t.map = o.id),
      ([t.x, t.y] = o.center),
      (t.target = 0),
      (e.npc = 0),
      e.initializeMap(t.map),
      e.bringPets(t));
  }
  (e.clearExitedInstance(t, n.map),
    delete t.challengeRun,
    e.emit("MapChanged", {
      MapIndex: t.map,
    }),
    e.emit("NPCResponse", {
      NPCID: 0,
      Page: [],
    }),
    e.say(a));
}
function _n(e, t) {
  const a = t.challengeRun,
    i = e.requireNPC(t);
  if (!a || a.map !== t.map || i.role !== "challenge")
    throw new b(message("core.challenges.startChallenge.26f7fd3f6c"));
  if (a.started) throw new b(message("core.challenges.startChallenge.555f8fcc3b"));
  ((a.started = !0),
    (a.nextWaveAt = e.time + 1e3),
    e.emit("NPCResponse", {
      NPCID: i.id,
      Page: [],
    }),
    e.say(message("core.challenges.startChallenge.4a37e8bec3")));
}
function La(e, t) {
  const a = t.challengeRun,
    i = e.rules.adaptations.guideChallenges?.find((n) => n.id === "po");
  return !a ||
    !i ||
    a.id !== "po" ||
    a.map !== t.map ||
    !a.started ||
    a.cleared ||
    a.branch ||
    a.wave < i.waves.length ||
    e.time >= a.deadline ||
    e.map(a.map).actors.some((n) => n.kind === "monster" && !n.friendly && !n.dead)
    ? !1
    : (ja(e, t), (a.branch = "choice"), (a.nextWaveAt = 0), e.say(message("late.poChoice")), !0);
}
function Gt(e, t) {
  const a = t.challengeRun;
  if (!a) return;
  if (t.map !== a.map) {
    (e.clearExitedInstance(t, a.map), delete t.challengeRun);
    return;
  }
  if (e.time >= (a.cleared && a.returnAt !== void 0 ? a.returnAt : a.deadline)) {
    Fa(e, t, message(a.cleared ? "challenge.complete" : "challenge.timeout"), !0);
    return;
  }
  if (!a.started || a.cleared || t.dead) return;
  const i = e.rules.adaptations.guideChallenges.find((u) => u.id === a.id),
    n = e.map(a.map);
  for (const u of i.waves.flat().filter((h) => h.at)) {
    const h = [...e.monsters.values()].find((p) => p.Name === u.monster);
    for (const p of n.actors.filter(
      (g) =>
        g.definition === h?.Index &&
        !g.dead &&
        g.special?.challenge === a.map &&
        !g.special.challengeAnchored,
    )) {
      const [g, y] = u.at;
      e.walkable(a.map, g, y, p.id) && ((p.x = g), (p.y = y), (p.special.challengeAnchored = !0));
    }
  }
  if (
    n.actors.some((u) => u.kind === "monster" && !u.friendly && !u.dead) ||
    (!a.nextWaveAt &&
      ((a.nextWaveAt = e.time + (a.wave < i.waves.length ? 2e3 : 0)), a.wave < i.waves.length)) ||
    e.time < a.nextWaveAt ||
    La(e, t) ||
    a.branch === "choice"
  )
    return;
  const s = i.waves[a.wave],
    o = s || [
      {
        monster: i.chest,
        count: 1,
      },
    ];
  let r = 0;
  const c = [],
    l = new Set();
  for (const u of o)
    for (let h = 0; h < u.count; h++) {
      const p = [...e.monsters.values()].find((f) => f.Name === u.monster);
      if (!p)
        throw new b(
          message("core.challenges.challengeTick.380afbda2e", {
            p0: u.monster,
          }),
        );
      let g;
      const y = u.at ? [u.at] : i.spawnPoints;
      for (let f = 0; f < y.length && !g; f++) {
        const v = y[u.at ? 0 : r++ % y.length],
          x = v.join(",");
        !l.has(x) &&
          e.walkable(t.map, v[0], v[1]) &&
          ((g = {
            x: v[0],
            y: v[1],
          }),
          l.add(x));
      }
      if (!g) {
        a.nextWaveAt = e.time + 1e3;
        return;
      }
      c.push({
        def: p,
        at: g,
        anchored: !!u.at,
      });
    }
  for (const { def: u, at: h, anchored: p } of c) {
    const g = e.newMonster(u, t.map, h);
    ((g.special = {
      ...g.special,
      challenge: a.map,
      challengeAnchored: p,
    }),
      n.actors.push(g));
  }
  ((a.nextWaveAt = 0),
    s
      ? (a.wave++,
        e.say(
          message("core.challenges.challengeTick.12497496fc", {
            p0: a.wave,
            p1: i.waves.length,
          }),
        ))
      : ((a.cleared = !0),
        ja(e, t),
        $a(e, t),
        (a.returnAt = e.time + i.returnDelay),
        e.say(
          message("core.challenges.challengeTick.3a4c97432a", {
            p0: Math.ceil(i.returnDelay / 1e3),
          }),
        )));
}
function rewardState(e) {
  return (e.challengeRewards ??= {
    sequence: 0,
    poCompletions: 0,
    pending: [],
    claimed: [],
  });
}
function ja(e, t) {
  const a = t.challengeRun;
  if (!a || a.id !== "po" || a.rewardSealed) return;
  const i = rewardState(t);
  if (
    ((a.runId ??= t.id + ":" + ++i.sequence),
    i.pending.some((l) => l.runId === a.runId) || i.claimed.includes(a.runId))
  ) {
    a.rewardSealed = !0;
    return;
  }
  const n = isHell(e.rules),
    s = i.poCompletions === 0,
    o = [],
    r = !n && (s || e.rng.next(1e4) < 2e3),
    c = (n && i.poCompletions < 3) || e.rng.next(1e4) < 1e3;
  if ((r && o.push(e.newItem(20828, 1, !0, void 0, t)), c)) {
    const l = (
      n
        ? {
            Warrior: 20864,
            Wizard: 20866,
            Taoist: 20865,
          }
        : {
            Warrior: 20864,
            Wizard: 20865,
            Taoist: 20866,
          }
    )[t.job];
    o.push(e.newItem(l, 1, !0, void 0, t));
  }
  (i.poCompletions++,
    (a.rewardSealed = !0),
    o.length
      ? i.pending.push({
          runId: a.runId,
          items: o,
        })
      : i.claimed.push(a.runId));
}
function $a(e, t) {
  const a = rewardState(t);
  for (const i of [...a.pending]) {
    const n = {
      ...t,
      inventory: structuredClone(t.inventory),
      questInventory: structuredClone(t.questInventory),
    };
    let s = !0;
    for (const o of i.items)
      if (!e.give(n, structuredClone(o), !1)) {
        s = !1;
        break;
      }
    if (!s) break;
    ((t.inventory = n.inventory),
      (t.questInventory = n.questInventory),
      (a.pending = a.pending.filter((o) => o.runId !== i.runId)),
      a.claimed.includes(i.runId) || a.claimed.push(i.runId),
      e.say(message("late.rewardClaimed")));
  }
}
function claimChallengeRewards(e, t) {
  const a = e.requireNPC(t);
  if (a.id !== 9420 && !(a.role === "challenge" && t.challengeRun))
    throw new b(message("late.claimNpc"));
  $a(e, t);
}
function Ga(e, t, a) {
  const i = t.challengeRun,
    n = e.requireNPC(t);
  if (
    !i ||
    i.id !== "po" ||
    i.map !== t.map ||
    i.branch !== "choice" ||
    n.role !== "challenge" ||
    t.dead
  )
    throw new b(message("late.poUnavailable"));
  if (a === "evil") {
    const s = e.rules.adaptations.lateContent?.evilDragon;
    if (!s || e.count(t, s.heart) < 1) throw new b(message("late.needHeart"));
    const o = [...e.monsters.values()].find((l) => l.Name === s.monster),
      r = e.freeNear(
        t.map,
        {
          x: t.x + 3,
          y: t.y,
        },
        8,
      );
    if (!o || !r) throw new b(message("late.landing"));
    const c = e.newMonster(o, t.map, r);
    if (
      ((c.special = {
        ...c.special,
        challenge: i.map,
        evilDragon: !0,
      }),
      !e.consume(t, s.heart, 1))
    )
      throw new b(message("late.needHeart"));
    (e.map(t.map).actors.push(c),
      (i.branch = "evil"),
      (i.nextWaveAt = 0),
      e.say(message("late.evilSummoned")));
  } else ((i.branch = "settle"), (i.nextWaveAt = 0), Gt(e, t));
  e.emit("NPCResponse", {
    NPCID: n.id,
    Page: [],
  });
}


function Zn(e, t) {
  const a = [];
  return (
    e.challengeRun?.branch === "choice" &&
      a.push(
        {
          $dialogue: [
            {
              label: message("late.evilChoice"),
              action: "@late-evil-dragon",
            },
          ],
        },
        {
          $dialogue: [
            {
              label: message("late.settleChoice"),
              action: "@late-po-settle",
            },
          ],
        },
      ),
    e.challengeRewards?.pending.length &&
      a.push({
        $dialogue: [
          {
            label: message("late.claimChoice"),
            action: "@challengeclaim",
          },
        ],
      }),
    a
  );
}
function fail(e) {
  throw new b(message("late." + e));
}
var state = (e) => (e.lateQuests ??= {});
function Oe(e, t, a) {
  (t.dead || e.requireNPC(t).id !== a) && fail("wrongNpc");
}
function checkLevel(e, t) {
  if (e.level < t)
    throw new b(
      message("late.level", {
        level: t,
      }),
    );
}
function gt(e, t, a, i) {
  const n = {
    ...t,
    inventory: structuredClone(t.inventory),
    questInventory: structuredClone(t.questInventory),
  };
  for (const s of a) e.consume(n, s.item, s.count) || fail("missing");
  for (const s of i) e.give(n, e.newItem(s.item, s.count), !1) || fail("full");
  ((t.inventory = n.inventory), (t.questInventory = n.questInventory));
}
function lateItemDeficit(e, t, a, i) {
  const n = e.rules.adaptations.lateContent;
  if (!n) return 0;
  const s = n.sevenPearls;
  if (
    s &&
    t.level >= s.level &&
    t.lateQuests?.pearls?.active &&
    s.materials.some((c) => c.item === a && c.mapIds?.includes(i))
  )
    return Math.max(0, 1 - e.count(t, a));
  const o = n.fireAltar;
  if (o && t.level >= o.level && t.lateQuests?.altar?.stage === 1 && o.spiritItems.includes(a))
    return Math.max(0, 1 - e.count(t, a));
  const r = n.bloodCycle;
  if (r && t.level >= r.level) {
    const c = t.lateQuests?.blood?.stage || 0,
      l = r.stages[c === 2 ? 1 : 0];
    if (l?.item === a && l.map === i) return Math.max(0, 1 - e.count(t, a));
  }
  return 0;
}
function originalMonster(e) {
  return Number(e.DreamOriginalId ?? e.OriginalId ?? /^GuideNative(\d+)$/.exec(e.Name)?.[1]);
}
function ts(e, t, a, i) {
  const n = e.rules.adaptations.lateContent;
  if (!n || a.friendly || a.special?.trialFloor || a.special?.bossMinion) return;
  const s = originalMonster(i),
    o = [];
  if (isHell(e.rules) && s === 138 && n.fireAltar) {
    const l = e.rules.adaptations.dreamRuntime.hell.princeHeartRolls;
    for (const u of l ?? [1, 4, 8]) {
      if (u > 1 && e.rng.next(u) !== 0) continue;
      const h = e.newItem(n.fireAltar.heart);
      e.give(t, h) || e.ground(a, h);
    }
  }
  const r = n.fireAltar;
  r && t.level >= r.level && t.lateQuests?.altar?.stage === 1 && o.push(...r.sourceDrops);
  const c = n.bloodCycle;
  if (c && t.level >= c.level) {
    const l = t.lateQuests?.blood?.stage || 0;
    o.push(c.stages[l === 2 ? 1 : 0]);
  }
  for (const l of o) {
    if (
      !l ||
      s !== l.monsterOriginalId ||
      (l.map !== void 0 && l.map !== a.map) ||
      (l.mapIds && !l.mapIds.includes(a.map)) ||
      e.count(t, l.item) >= 1 ||
      e.rng.next(l.chance) !== 0
    )
      continue;
    const u = e.newItem(l.item);
    if (
      e.insert(t.questInventory, u, 0) &&
      (e.emit("GainedQuestItem", {
        Item: {
          ItemIndex: l.item,
          Count: 1,
        },
      }),
      c?.stages[0].item === l.item)
    ) {
      const h = state(t);
      ((h.blood ??= {
        stage: 0,
        cycles: 0,
      }),
        h.blood.stage === 0 && (h.blood.stage = 1));
    }
  }
}
function as(e, t, a) {
  const i = e.rules.adaptations.lateContent;
  i || fail("unavailable");
  const n = i.sevenPearls,
    s = i.fireAltar,
    o = i.bloodCycle,
    r = i.secretTicket;
  if (a === "@late-pearls" || a === "@late-pearls-exchange") {
    (n || fail("unavailable"), Oe(e, t, n.npcId), checkLevel(t, n.level));
    const l = state(t);
    ((l.pearls ??= {
      active: !1,
      exchanges: 0,
    }),
      a === "@late-pearls-exchange"
        ? (l.pearls.active || fail("acceptFirst"),
          gt(
            e,
            t,
            n.materials.map((u) => ({
              item: u.item,
              count: 1,
            })),
            n.rewards,
          ),
          l.pearls.exchanges++,
          e.say(
            message("late.pearlsExchanged", {
              count: l.pearls.exchanges,
            }),
          ))
        : (l.pearls.active = !0));
  } else if (a === "@late-altar" || a === "@late-altar-submit" || a === "@late-altar-enter") {
    (s || fail("unavailable"), Oe(e, t, s.npcId), checkLevel(t, s.level));
    const l = state(t);
    if (
      ((l.altar ??= {
        stage: 0,
      }),
      a === "@late-altar")
    )
      l.altar.stage === 0 && (l.altar.stage = 1);
    else if (a === "@late-altar-submit")
      l.altar.stage === 1
        ? (gt(
            e,
            t,
            s.spiritItems.map((u) => ({
              item: u,
              count: 1,
            })),
            [],
          ),
          (l.altar.stage = 2))
        : l.altar.stage === 2
          ? (gt(
              e,
              t,
              [
                {
                  item: s.talisman,
                  count: 1,
                },
              ],
              [],
            ),
            (l.altar.stage = 3))
          : fail("noSubmission");
    else {
      (l.altar.stage !== 3 && fail("altarLocked"), Ea(e, t, s.challenge));
      return;
    }
  } else if (a === "@late-blood" || a === "@late-blood-submit") {
    (o || fail("unavailable"), Oe(e, t, o.npcId), checkLevel(t, o.level));
    const l = state(t);
    if (
      ((l.blood ??= {
        stage: 0,
        cycles: 0,
      }),
      a === "@late-blood-submit")
    ) {
      const u = l.blood.stage;
      (u !== 1 && u !== 2 && fail("noSubmission"),
        gt(
          e,
          t,
          [
            {
              item: o.stages[u - 1].item,
              count: 1,
            },
          ],
          [],
        ),
        u === 1
          ? ((l.blood.stage = 2), isHell(e.rules) && e.gainXP(t, 1e3))
          : ((l.blood.stage = 0),
            l.blood.cycles++,
            (t.gold += o.gold),
            e.gainXP(t, o.experience),
            e.say(
              message("late.bloodComplete", {
                count: l.blood.cycles,
              }),
            )));
    }
  } else if (a.startsWith("@late-secret-")) {
    (r || fail("unavailable"), Oe(e, t, r.npcId));
    const l = r.shortcuts.find((p) => p.map === Number(a.slice(13)));
    ((!l || !t.completedQuests.includes(l.requiresQuest)) && fail("secretLocked"),
      e.geometry.get(l.map) || fail("landing"),
      e.initializeMap(l.map));
    const h = e.freeNear(
      l.map,
      {
        x: l.x,
        y: l.y,
      },
      3,
    );
    (h || fail("landing"),
      e.consume(t, r.item, 1) || fail("missing"),
      (t.map = l.map),
      (t.x = h.x),
      (t.y = h.y),
      (t.target = 0),
      (e.npc = 0),
      e.initializeMap(t.map),
      e.bringPets(t),
      e.emit("MapChanged", {
        MapIndex: t.map,
      }),
      e.emit("NPCResponse", {
        NPCID: 0,
        Page: [],
      }));
    return;
  } else if (a === "@late-scarlet-sword") {
    const l = i.scarletSword;
    (l || fail("unavailable"),
      Oe(e, t, l.npcId),
      e.emit("ScarletSwordOptions", {
        Materials: l.materials,
        Result: l.result,
      }));
    return;
  } else fail("unavailable");
  const c = e.requireNPC(t);
  e.emit("NPCResponse", {
    NPCID: c.id,
    Page: za(e, t, c),
  });
}
function is(e, t, a) {
  const i = e.rules.adaptations.lateContent?.scarletSword;
  (i || fail("unavailable"),
    Oe(e, t, i.npcId),
    (!Array.isArray(a) || new Set(a).size !== a.length) && fail("selectEquipment"));
  const n = i.materials.filter((r) => e.defs.get(r.item)?.Type === "Weapon"),
    s = [];
  for (const r of n) {
    const c = a
      .map((l) => t.inventory.find((u) => u?.uid === l))
      .filter((l) => !!l && l.id === r.item);
    ((c.length !== r.count ||
      c.some(
        (l) => l.bound || l.locked || l.count !== 1 || t.equipment.some((u) => u?.uid === l.uid),
      )) &&
      fail("selectEquipment"),
      s.push(...c));
  }
  s.length !== a.length && fail("selectEquipment");
  const o = {
    ...t,
    inventory: structuredClone(t.inventory),
    questInventory: structuredClone(t.questInventory),
  };
  for (const r of s) o.inventory[o.inventory.findIndex((c) => c?.uid === r.uid)] = null;
  for (const r of i.materials.filter((c) => !n.includes(c)))
    e.consume(o, r.item, r.count) || fail("missing");
  (e.give(o, e.newItem(i.result, 1, !0, void 0, t), !1) || fail("full"),
    (t.inventory = o.inventory),
    (t.questInventory = o.questInventory),
    e.say(message("late.scarletComplete")));
}
function Qa(e, t) {
  const a = e.rules.adaptations.lateContent;
  if (!a) return [];
  const i = [],
    n = (s) =>
      (s.mapIds || [s.map]).filter(Number.isInteger).map((o) => {
        const r = [...e.monsters.values()].find((c) => originalMonster(c) === s.monsterOriginalId);
        return {
          map: o,
          monster: r?.Name || "GuideNative" + s.monsterOriginalId,
          monsterId: r?.Index || 0,
        };
      });
  if (a.sevenPearls && t.level >= a.sevenPearls.level) {
    const s = a.sevenPearls;
    i.push({
      id: "pearls",
      title: message("late.pearlsTitle"),
      description: message(
        t.lateQuests?.pearls?.active ? "late.pearlsCollect" : "late.pearlsAccept",
      ),
      npcId: s.npcId,
      stage: 1,
      cycles: t.lateQuests?.pearls?.exchanges || 0,
      active: !!t.lateQuests?.pearls?.active,
      items: s.materials.map((o) => ({
        item: o.item,
        need: 1,
        have: e.count(t, o.item),
        sources: n(o),
      })),
    });
  }
  if (a.fireAltar && t.level >= a.fireAltar.level) {
    const s = a.fireAltar,
      o = t.lateQuests?.altar?.stage || 0;
    i.push({
      id: "altar",
      title: message("late.altarTitle"),
      description: message("late.altarStage" + o),
      npcId: s.npcId,
      stage: o,
      cycles: 0,
      active: o > 0,
      items: (o === 2 ? [s.talisman] : o === 3 ? [] : s.spiritItems).map((r) => ({
        item: r,
        need: 1,
        have: e.count(t, r),
        sources: s.sourceDrops
          .filter((c) => c.item === r)
          .flatMap((c) =>
            c.mapIds || c.map
              ? n(c)
              : e.rules.world.maps
                  .filter((l) =>
                    l.spawns.some(
                      (u) =>
                        u.monster ===
                        [...e.monsters.values()].find(
                          (h) => originalMonster(h) === c.monsterOriginalId,
                        )?.Name,
                    ),
                  )
                  .map((l) => {
                    const u = [...e.monsters.values()].find(
                      (h) => originalMonster(h) === c.monsterOriginalId,
                    );
                    return {
                      map: l.id,
                      monster: u?.Name || "",
                      monsterId: u?.Index || 0,
                    };
                  }),
          ),
      })),
    });
  }
  if (a.bloodCycle && t.level >= a.bloodCycle.level) {
    const s = a.bloodCycle,
      o = t.lateQuests?.blood?.stage || 0,
      r = s.stages[o === 2 ? 1 : 0];
    i.push({
      id: "blood",
      title: message("late.bloodTitle"),
      description: message("late.bloodStage" + o),
      npcId: s.npcId,
      stage: o,
      cycles: t.lateQuests?.blood?.cycles || 0,
      active: !0,
      items: [
        {
          item: r.item,
          need: 1,
          have: e.count(t, r.item),
          sources: n(r),
        },
      ],
    });
  }
  return i;
}
function za(e, t, a) {
  const i = e.rules.adaptations.lateContent;
  if (!i) return [];
  const n = [];
  for (const o of [i.sevenPearls, i.fireAltar, i.bloodCycle])
    o?.npcId === a.id &&
      t.level < o.level &&
      n.push(
        message("late.requiredLevel", {
          level: o.level,
        }),
      );
  const s = (o, r) => ({
    $dialogue: [
      {
        label: message("late." + o),
        action: r,
      },
    ],
  });
  for (const o of Qa(e, t).filter((r) => r.npcId === a.id)) {
    n.push(
      o.title,
      o.description,
      message("late.cycles", {
        count: o.cycles,
      }),
    );
    for (const r of o.items) {
      n.push(
        message("late.itemCount", {
          item: entityText("items", r.item),
          have: Math.min(r.need, r.have),
          need: r.need,
        }),
      );
      for (const c of r.sources)
        n.push(
          message("late.source", {
            map: entityText("maps", c.map),
            monster: entityText("monsters", c.monsterId),
          }),
        );
    }
    (o.id === "pearls" &&
      n.push(s("pearlsStart", "@late-pearls"), s("exchange", "@late-pearls-exchange")),
      o.id === "altar" &&
        n.push(
          s(
            o.stage === 3 ? "altarEnter" : o.stage === 0 ? "altarStart" : "submit",
            o.stage === 3
              ? "@late-altar-enter"
              : o.stage === 0
                ? "@late-altar"
                : "@late-altar-submit",
          ),
        ),
      o.id === "blood" &&
        n.push(
          s("bloodStatus", "@late-blood"),
          ...(o.stage === 1 || o.stage === 2 ? [s("submit", "@late-blood-submit")] : []),
        ));
  }
  if (a.id === i.secretTicket?.npcId)
    for (const o of i.secretTicket.shortcuts)
      t.completedQuests.includes(o.requiresQuest) &&
        n.push({
          $dialogue: [
            {
              label: message("late.shortcut", {
                map: entityText("maps", o.map),
              }),
              action: "@late-secret-" + o.map,
            },
          ],
        });
  return (a.id === i.scarletSword?.npcId && n.push(s("scarletSelect", "@late-scarlet-sword")), n);
}


function ns(e, t, a) {
  const i = e.rules.adaptations.lateContent?.bagua;
  if (!i || a.id !== i.item) return !1;
  if (
    t.dead ||
    a.count <= 0 ||
    t.map !== i.map ||
    Math.abs(t.x - i.x) > i.range ||
    Math.abs(t.y - i.y) > i.range
  )
    throw new b(message("late.baguaLocation"));
  const n = e.map(t.map);
  if (
    n.actors.filter((c) => c.kind === "monster" && !c.dead && c.special?.lateSummonBagua === !0)
      .length >= i.maxAlive
  )
    throw new b(message("late.baguaAlive"));
  const s = [...e.monsters.values()].find((c) => c.Name === i.monster),
    o = e.freeNear(
      t.map,
      {
        x: t.x,
        y: t.y,
      },
      3,
    );
  if (!s || !o) throw new b(message("late.landing"));
  const r = e.newMonster(s, t.map, o);
  return (
    (r.special = {
      ...r.special,
      lateSummonBagua: !0,
      summonedBy: t.id,
    }),
    n.actors.push(r),
    --a.count === 0 && (t.inventory[t.inventory.findIndex((c) => c?.uid === a.uid)] = null),
    e.say(message("late.baguaSummoned")),
    !0
  );
}
function Va(e, t) {
  const a = e.adaptations.bossRewards?.entries[String(t.definition)];
  if (
    !(
      !e.adaptations.dreamRuntime ||
      !a?.maps.includes(t.map) ||
      t.kind !== "monster" ||
      t.friendly ||
      t.master !== void 0 ||
      t.special?.bossMinion ||
      t.special?.trialFloor !== void 0 ||
      t.special?.trialBoss ||
      t.special?.challenge !== void 0
    )
  )
    return a;
}
function ss(e, t, a) {
  return e.adaptations.bossRewards?.entries[String(t.Index)]?.maps.includes(a.map) && !Va(e, a)
    ? t.Drops
    : (t.MapDrops?.[String(a.map)] ?? t.Drops);
}
function os(e, t, a, i, n) {
  const s = Va(e.rules, t);
  if (
    !s ||
    n.some((c) => {
      const l = e.defs.get(c.id)?.Type;
      return l && (Ke.has(l) || l === "Talisman" || l === "Amulet");
    })
  )
    return;
  const o = s.fallback.filter((c) => c.weight > 0 && e.defs.has(c.item));
  if (!o.length) return;
  let r = e.rng.next(o.reduce((c, l) => c + l.weight, 0));
  for (const c of o) {
    if (r < c.weight) {
      n.push(e.newItem(c.item, 1, !0, a, i, Number(t.special?.magicAdd || 0)));
      return;
    }
    r -= c.weight;
  }
}
function spiritNextXP(e, t) { return t >= e.cap ? 0 : 100; }
function zt(e, t) {
  const p = e.spiritProgress;
  if (!p || p.curveVersion === 4) return;
  let level = p.level, xp = p.xp;
  while (level < t.cap && xp >= 100) { xp -= 100; level++; }
  e.spiritProgress = { level, xp: level >= t.cap ? 0 : xp, curveVersion: 4 };
}

function rs(e, t) {
  const a = e.special?.nativeBeastArmourRank
    ? t.monsters.find((n) => n.DreamOriginalId === 82)
    : void 0;
  let i = entityText("monsters", a?.Index ?? e.definition);
  if (e.monsterAffixes)
    for (const n of e.monsterAffixes)
      i = message("monster.affixedName", {
        affix: entityText("monsterAffixes", n.group + "." + n.tier),
        name: i,
      });
  else
    e: for (const n of Object.values(t.adaptations.dreamRuntime?.monsterAffixModel?.groups || {}))
      for (const [s, o] of Object.entries(n.Affixes))
        if (e.name.startsWith(o.Name + " \xB7 ")) {
          i = message("monster.affixedName", {
            affix: entityText("monsterAffixes", n.ID + "." + s),
            name: i,
          });
          break e;
        }
  return e.definition === t.adaptations.noviceProgression?.spiritMonster ||
    (e.friendly && e.master !== void 0 && typeof e.special?.petLevel == "number")
    ? message("skill.spirit.name", {
        name: i,
        level: Number(e.special?.petLevel || 0),
      })
    : i;
}

var cs = {
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


function ls(e, t, a, i) {
  const n = cs[e + "/" + t + "/" + a];
  if (!n) throw Error("Missing dialogue binding " + e + "/" + t + "/" + a);
  return {
    $dialogue: n.parts.map((s) => ({
      ...s,
      label:
        typeof s.label == "object" && "$text" in s.label
          ? message(s.label.$text, {
              username: i,
            })
          : s.label,
    })),
  };
}
function Ua(e) {
  const t = e.skills.findIndex((n) => n.Spell === "HeavyStrike"),
    a = e.skills.findIndex((n) => n.Spell === "Slaying" && !n.temporary);
  if (a < 0 || (e.special && (delete e.special.heavyHits, delete e.special.heavyHitAt), t < 0))
    return !1;
  const i = e.skills[a];
  return (
    (e.skills = e.skills.filter((n) => n.Spell !== "HeavyStrike" && n !== i)),
    e.skills.splice(Math.min(t, e.skills.length), 0, i),
    !0
  );
}
function xt(e, t) {
  const a = e.rules.adaptations.noviceProgression;
  if (!a) return !1;
  let i = Ua(t);
  const n = [];
  ([a.quest, 203, 204].some((s) => t.completedQuests.includes(s)) &&
    n.push([a.spellByJob[t.job], a.firstBookByJob?.[t.job]]),
    a.secondQuest &&
      t.completedQuests.includes(a.secondQuest) &&
      n.push([a.secondSpellByJob?.[t.job] || "", a.secondBookByJob?.[t.job]]));
  for (const [s, o] of n) {
    if (!s || !o || t.noviceBooks?.includes(s)) continue;
    const r = t.skills.some(
        (l) => (l.Spell === s || (s === "HeavyStrike" && l.Spell === "Slaying")) && !l.temporary,
      ),
      c = [...t.inventory, ...t.storage].some((l) => l?.id === o);
    if (!r && !c) {
      if (!e.give(t, pn(e.newItem(o), e.rules))) continue;
      (e.say(
        message("skill.starter.bookReceived", {
          skill: entityText("skills", s),
        }),
      ),
        (i = !0));
    }
    (t.noviceBooks ??= []).push(s);
  }
  return i;
}
function ds(e, t) {
  const a = e.rules.adaptations.noviceProgression?.heavyStrike;
  if (!a || t.job !== "Warrior" || !e.skill(t, "HeavyStrike") || e.skill(t, "Slaying")) return !1;
  const i = (t.special ??= {}),
    n = e.time - Number(i.heavyHitAt ?? -1 / 0) > a.resetMs ? 0 : Number(i.heavyHits || 0);
  return (
    (i.heavyHitAt = e.time),
    (i.heavyHits = n + 1),
    Number(i.heavyHits) < a.hits ? !1 : ((i.heavyHits = 0), !0)
  );
}
function isSpirit(e, t) {
  return t.definition === e.rules.adaptations.noviceProgression?.spiritMonster && t.friendly;
}
function petInheritance(e, t) {
  if (!t.friendly || !t.master || !t.special?.dreamPet || t.special?.dreamTamed) return;
  const a = e.monsters.get(t.definition);
  return e.rules.adaptations.noviceProgression?.petInheritance[
    isSpirit(e, t) ? "SpiritServant" : String(a?.DreamOriginalId)
  ];
}
function fs(e, t) {
  const a = petInheritance(e, t),
    i = e.roles.find((s) => s.id === t.master);
  if (!a || !i) return;
  const n = Math.max(0, ((i.stats.MinSC || 0) + (i.stats.MaxSC || 0)) / 2);
  for (const s of ["MinAC", "MaxAC"]) t.stats[s] = (t.stats[s] || 0) + Math.floor(n * a.ac);
  for (const s of ["MinMAC", "MaxMAC"]) t.stats[s] = (t.stats[s] || 0) + Math.floor(n * a.mac);
  if (((t.stats.HP = (t.stats.HP || 0) + Math.floor(n * a.hp)), isSpirit(e, t))) {
    ((t.stats.HP += i.level * 5),
      (t.stats.MinDC += Math.floor(i.level / 5)),
      (t.stats.MaxDC += Math.floor(i.level / 4)));
    for (const s of ["MinAC", "MaxAC", "MinMAC", "MaxMAC"]) t.stats[s] += Math.floor(i.level / 10);
  }
}
function us(e, t, a) {
  if (a.kind !== "monster" || a.friendly) return !1;
  if (
    t.friendly && t.master
      ? e.roles.find((s) => s.id === t.master && !s.dead && s.map === a.map)
      : void 0
  )
    return (
      (a.special ??= {}),
      (a.special.frontPet = t.id),
      (a.special.frontPetUntil = e.time + 2500),
      (a.target = t.id),
      !0
    );
  const n = e.actor(Number(a.special?.frontPet));
  return t.kind === "player" &&
    n &&
    !n.dead &&
    n.friendly &&
    n.master === t.id &&
    n.map === a.map &&
    Number(a.special?.frontPetUntil) > e.time &&
    Math.max(Math.abs(n.x - a.x), Math.abs(n.y - a.y)) <= 8
    ? ((a.target = n.id), !0)
    : !1;
}
function spiritGrowth(e, t) {
  const skill = e.skill(t, "SummonSpiritServant");
  const a = { ...e.rules.adaptations.noviceProgression.spiritGrowth,
    cap: summonPetCap(skill?.level || 1, t.stats["PetLevel:SummonSpiritServant"] || 0) };
  zt(t, a);
  const i = (t.spiritProgress ??= {
    level: 0,
    xp: 0,
    curveVersion: 4,
  });
  return {
    cfg: a,
    progress: i,
  };
}
function ms(e, t, a, i = t) {
  if (t.dead || t.map !== i.map || a <= 0 || !Number.isFinite(a)) return;
  const n = e
    .map(t.map)
    .actors.filter(
      (c) =>
        isSpirit(e, c) &&
        c.master === t.id &&
        !c.dead &&
        Math.max(Math.abs(c.x - i.x), Math.abs(c.y - i.y)) <= 16,
    );
  if (!n.length) return;
  const { cfg: s, progress: o } = spiritGrowth(e, t),
    r = o.level;
  if (!(o.level >= s.cap)) {
    for (o.xp += Math.trunc(a); o.level < s.cap && o.xp >= spiritNextXP(s, o.level); )
      ((o.xp -= spiritNextXP(s, o.level)), o.level++);
    o.level >= s.cap && (o.xp = 0);
    for (const c of n)
      ((c.special ??= {}),
        Object.assign(c.special, {
          petLevel: o.level,
          petXP: o.xp,
          maxPetLevel: s.cap,
        }),
        o.level !== r &&
          (e.refreshActor(c),
          e.emit("SpiritLevelUp", {
            ObjectID: c.id,
            Level: o.level,
          })));
    o.level !== r &&
      e.say(
        message("skill.spirit.levelUp", {
          level: o.level,
        }),
      );
  }
}
var Xa = 5e3,
  ps = 1e4;
function isOwnedCompanion(e) {
  return e.kind === "monster" && e.friendly && !!e.master && !!e.special?.dreamPet;
}
function Kt(e, t) {
  isOwnedCompanion(e) && !e.dead && (e.special.petCombatAt = t);
}
function hs(e, t) {
  if (!isOwnedCompanion(t) || t.dead || t.hp >= t.maxHP) return;
  const a = t.special,
    i = a.petRegenAt ?? a.spiritRegenAt ?? a.tamedRegenAt;
  if (i === void 0) {
    a.petRegenAt = e.time + Xa;
    return;
  }
  if (e.time < Number(i)) return;
  a.petRegenAt = e.time + Xa;
  const n = e.time - Number(a.petCombatAt ?? -1 / 0) < ps,
    s = Math.min(t.maxHP - t.hp, Math.max(1, Math.floor(t.maxHP * (n ? 0.01 : 0.03))));
  ((t.hp += s),
    e.emit("DamageIndicator", {
      ObjectID: t.id,
      Type: "Heal",
      Damage: s,
    }));
}
function bs(e, t, a, i) {
  if (t.job !== "Taoist" && t.job !== "Wizard") return;
  if (Number.isFinite(i) && i > 0)
    for (const s of e.map(t.map).actors) {
      if (
        !isOwnedCompanion(s) ||
        s.master !== t.id ||
        s.map !== a.map ||
        s.dead ||
        isSpirit(e, s) ||
        !!s.special?.dreamTamed != (t.job === "Wizard") ||
        Math.max(Math.abs(s.x - a.x), Math.abs(s.y - a.y)) > 16
      )
        continue;
      const o = s.special,
        r = Number(o.petLevel || 0),
        c = Number(o.maxPetLevel || 0);
      if (!(r >= c)) {
        for (
          o.petXP = Number(o.petXP || 0) + i;
          Number(o.petLevel || 0) < c && Number(o.petXP) >= 100;

        )
          ((o.petXP = Number(o.petXP) - 100),
            (o.petLevel = Number(o.petLevel || 0) + 1));
        o.petLevel !== r && e.refreshActor(s);
      }
    }
}
function L(e, t, a) {
  const i = z(t.stats, a, e.rng);
  if (t.kind !== "player" || !e.rules.adaptations.dreamRuntime || !["DC", "MC", "SC"].includes(a))
    return i;
  const n = t.stats,
    s = t,
    o =
      (n.CriticalRate || 0) * e.rules.constants.CriticalRateWeight +
      (n.GemCriticalRatePercent || 0) +
      (n.DreamCritPercent || 0) +
      (n.NativeCriticalPoints || 0) +
      affixRangeExtra(e, s, 44);
  if (o <= 0 || e.rng.next(100) >= Math.min(100, o)) return i;
  const r = Math.min(
      2,
      Math.max(0, ((n.DreamCritDamagePercent || 0) + affixRangeExtra(e, s, 45)) / 100),
    ),
    c = Math.max(
      Math.fround(Math.fround(1.2) + Math.fround(r)),
      n.GemCriticalRatePercent ? 1.5 : 0,
    );
  return Math.trunc(Math.fround(i * c));
}
function hasBossLootBudget(e, t) {
  return e.IsBoss || t.adaptations.bossLoot.monsters.includes(e.Name);
}
function hasUnrestrictedNativeLoot(e, t) {
  const a = t.adaptations.bossBehaviors?.entries[String(e.Index)];
  return (
    hasBossLootBudget(e, t) ||
    (!!a && !a.helper) ||
    e.GuideRank === "elite" ||
    ["elite", "swift", "captain"].includes(String(e.AdventureKind)) ||
    isChallengeChest(e, t)
  );
}
function isChallengeChest(e, t) {
  return !!t.adaptations.guideChallenges?.some((a) => a.chest === e?.Name);
}
function ys(e, t, a, i) {
  const n = a.adaptations.bossLoot,
    s = ["Common", "Rare", "Legendary", "Mythical", "Heroic"],
    o = {
      equipment: [],
      books: [],
      potions: [],
      materials: [],
    },
    r = [...e];
  for (let l = r.length - 1; l > 0; l--) {
    const u = i.next(l + 1);
    [r[l], r[u]] = [r[u], r[l]];
  }
  for (const l of r) {
    const u = t.get(l.id).Type;
    u !== "Quest" &&
      o[
        Ke.has(u) ? "equipment" : u === "Book" ? "books" : u === "Potion" ? "potions" : "materials"
      ].push(l);
  }
  (o.equipment.sort(
    (l, u) =>
      s.indexOf(String(t.get(u.id).Grade)) - s.indexOf(String(t.get(l.id).Grade)) || ke(u) - ke(l),
  ),
    o.books.sort((l, u) => t.get(u.id).RequiredAmount - t.get(l.id).RequiredAmount),
    o.materials.sort((l, u) => (u.added.GemTier || 0) - (l.added.GemTier || 0)));
  const c = (l) => {
    const u = new Set();
    return l.filter((h) => (u.has(h.id) ? !1 : (u.add(h.id), !0)));
  };
  return [
    ...o.equipment.slice(0, n.equipment),
    ...c(o.books).slice(0, n.books),
    ...c(o.potions).slice(0, n.potions),
    ...c(o.materials).slice(0, n.materials),
  ];
}
function Xt(e, t) {
  return e
    ? e.DreamOriginalId === 27 || e.DreamOriginalId === 44
      ? "elite"
      : hasBossLootBudget(e, t)
        ? "boss"
        : e.GuideRank === "elite" || e.AdventureKind === "elite" || e.AdventureKind === "swift"
          ? "elite"
          : "normal"
    : "normal";
}
function bossSpawnKey(e, t) {
  const a = e.spawns[t];
  return JSON.stringify([e.id, t, a.monster, ...a.at]);
}
function persistentBossSpawn(e, t, a) {
  const i = e.me,
    n = t.spawns[a];
  if (
    !i ||
    !n ||
    e.rules.adaptations.guideChallenges?.some((l) => l.map === t.id) ||
    e.rules.adaptations.adventure.mapIds.includes(t.id) ||
    e.rules.adaptations.trial?.map === t.id
  )
    return;
  const s = e.rules.monsters.find((l) => l.Name === n.monster),
    o = s && e.rules.adaptations.bossBehaviors?.entries[String(s.Index)];
  if (!s || !(n.boss || n.native?.boss || Xt(s, e.rules) !== "normal" || (o && !o.helper))) return;
  const r = bossSpawnKey(t, a),
    c = (e.bossRespawns[i.id] ??= {});
  if (!c[r]) {
    const l = e.map(t.id);
    c[r] = {
      nextAt: l.respawns[a] ?? e.time,
      available: l.actors.filter((u) => u.spawn === a && !u.dead && !u.friendly).length,
    };
  }
  return c[r];
}
function vs(e, t) {
  if (
    t.spawn === void 0 ||
    t.friendly ||
    t.special?.bossMinion ||
    (t.ai === 25 && Number(t.special?.revivals) < Number(t.special?.lives))
  )
    return;
  const a = e.region(t.map),
    i = a.spawns[t.spawn],
    n = persistentBossSpawn(e, a, t.spawn);
  n &&
    ((n.available = Math.max(0, n.available - 1)),
    !i.native &&
      i.respawnPhaseSeconds === void 0 &&
      (n.nextAt = e.time + Math.max(1e3, i.respawnMinutes * 6e4)));
}
function mountedItem(e, t) {
  return t.mountUid
    ? t.inventory.find((a) => a && a.uid === t.mountUid && e.defs.get(a.id)?.Type === "Mount")
    : void 0;
}
function mountSpeed(e, t) {
  const a = mountedItem(e, t);
  return a ? Number(e.defs.get(a.id).DreamMountSpeed || 0) : 0;
}
function Jt(e, t, a) {
  if (t.dead) throw new b(message("core.mounts.toggleMount.01807ce390"));
  if (t.mountUid && (!a || a === t.mountUid)) {
    (delete t.mountUid, e.say(message("core.mounts.toggleMount.ea50da7868")));
    return;
  }
  const i = t.inventory.find((n) => n && (a ? n.uid === a : e.defs.get(n.id)?.Type === "Mount"));
  if (!i || e.defs.get(i.id)?.Type !== "Mount")
    throw new b(message("core.mounts.toggleMount.3827072b6d"));
  ((t.mountUid = i.uid),
    (t.target = 0),
    e.say(
      message("core.mounts.toggleMount.18e1be6798", {
        p0: entityText("items", i.id),
      }),
    ));
}


function ws(e, t, a) {
  const i = t.inventory.find((r) => r?.uid === a),
    n = e.rules.items.filter(
      (r) => r.Type === "Mount" && Number(r.DreamMountSpeed) <= 3 && Number(r.DreamMountSpeed) >= 2,
    );
  if (!i || e.defs.get(i.id)?.Type !== "MountVoucher" || !n.length)
    throw new b(message("core.mounts.mountVoucher.1f2e357b01"));
  if (i.count > 1 && !t.inventory.some((r) => !r))
    throw new b(message("core.mounts.mountVoucher.a5eb332e68"));
  const s = n[e.rng.next(n.length)],
    o = e.newItem(s.Index);
  if (
    ((o.bound = !0),
    i.count--,
    i.count || (t.inventory[t.inventory.indexOf(i)] = null),
    !e.give(t, o, !1))
  )
    throw new b(message("core.mounts.mountVoucher.f4f8709c7f"));
  e.say(
    message("core.mounts.mountVoucher.552bba3d4a", {
      p0: entityText("items", s.Index),
    }),
  );
}
function Ss(e, t) {
  if (t.friendly) return;
  const a = e.rules.adaptations.bossBehaviors,
    i = a?.entries[String(t.definition)];
  return i ? a.profiles[i.profile] : void 0;
}
function $(e, t) {
  if (!t.friendly)
    return (
      Ss(e, t) ??
      e.rules.adaptations.monsterCombat?.byNativeId[
        String(e.monsters.get(t.definition)?.DreamOriginalId)
      ]
    );
}
function activeBossHealthBranches(e, t) {
  return ($(e, t)?.healthBranches ?? []).filter(
    (a) =>
      (a.hpAtMostPercent === void 0 || t.hp <= (t.maxHP * a.hpAtMostPercent) / 100) &&
      (a.hpBelow === void 0 || t.hp < a.hpBelow) &&
      (a.hpBelowPercent === void 0 || t.hp < (t.maxHP * a.hpBelowPercent) / 100),
  );
}
function applyBossHealthStats(e, t) {
  const a = $(e, t)?.revivals;
  if (a)
    for (const n of a.statMultipliers.slice(0, Number(t.special?.nativeRevivals || 0)))
      for (const [s, o] of Object.entries(n)) t.stats[s] = Math.floor((t.stats[s] || 0) * o);
  const i = t.buffs.find((n) => n.type === "DreamBossAbility" && n.until > e.time);
  if (i)
    for (const [n, s] of Object.entries(i.stats)) t.stats[n] = Math.floor((t.stats[n] || 0) * s);
  for (const n of activeBossHealthBranches(e, t)) {
    for (const [s, o] of Object.entries(n.multiply ?? {}))
      t.stats[s] = Math.floor((t.stats[s] || 0) * o);
    for (const [s, o] of Object.entries(n.add ?? {})) t.stats[s] = (t.stats[s] || 0) + o;
  }
}
function weighted(e, t) {
  let a = e.rng.next(t.reduce((i, n) => i + n.Weight, 0));
  for (const i of t) {
    if (a < i.Weight) return i;
    a -= i.Weight;
  }
  return t[t.length - 1];
}
function Ps(e, t, a) {
  if (isHell(e.rules)) {
    Hs(e, t, a);
    return;
  }
  const i = e.rules.adaptations.dreamRuntime?.monsterAffixModel;
  if (
    !i ||
    t.spawn === void 0 ||
    t.map === e.rules.world.maps.find((l) => l.start).id ||
    a.Experience <= 0 ||
    e.rng.next(100) >= i.chancePercent
  )
    return;
  const n = Math.max(0, Math.min(7, Math.floor(a.Level / 10))),
    s = Object.values(i.groups).filter(
      (l) => l.Weight > 0 && Object.values(l.Affixes).some((u) => u.Weight > 0 && u.Grade <= n),
    );
  if (!s.length) return;
  const o = weighted(e, s),
    r = weighted(
      e,
      Object.values(o.Affixes).filter((l) => l.Weight > 0 && l.Grade <= n),
    ),
    c = t.special;
  if (
    ((c.nativeAffixType = o.Type),
    (c.nativeAffixLow = r.LowValue),
    (c.nativeAffixHigh = r.HighValue),
    (c.nativeAffixRate = o.Rate),
    (c.nativeAffixDuration = r.Dura),
    (c.affixDrop = r.AffixDrop),
    (c.magicAdd = r.MagicAdd),
    (c.dropAdd = r.DropAdd),
    (c.expAdd = r.ExpAdd),
    (c.nativeAffixRegenAt = e.time + 5e3),
    (t.name = r.Name + " \xB7 " + t.name),
    o.Type === 10003)
  ) {
    const l = 1 + e.rng.next(r.HighValue + 1, r.LowValue) / 100;
    for (const u of ["MinAC", "MaxAC", "MinMAC", "MaxMAC"])
      t.stats[u] = Math.floor((t.stats[u] || 0) * l);
  }
}
function monsterAffixEntries(e) {
  if (e.monsterAffixes) return e.monsterAffixes;
  const t = e.special;
  return t?.nativeAffixType
    ? [
        {
          group: 0,
          tier: "",
          type: Number(t.nativeAffixType),
          low: Number(t.nativeAffixLow),
          high: Number(t.nativeAffixHigh),
          rate: Number(t.nativeAffixRate),
          duration: Number(t.nativeAffixDuration),
        },
      ]
    : [];
}
var hasMonsterAffix = (e, t) => monsterAffixEntries(e).some((a) => a.type === t);
function Ya(e) {
  if (!(e.friendly || !e.monsterAffixes)) {
    for (const t of e.monsterAffixes)
      if (t.type === 10003)
        for (const a of ["MinAC", "MaxAC", "MinMAC", "MaxMAC"])
          e.stats[a] = Math.floor(((e.stats[a] || 0) * (100 + (t.defencePercent ?? t.low))) / 100);
  }
}
function Cs(e, t, a, i, n) {
  if (t.friendly || t.kind !== "monster" || i === "None") return a;
  const s = e.rules.skills.find((o) => o.Spell === n)?.DreamSkill?.element;
  for (const o of monsterAffixEntries(t)) {
    const r = e.rng.next(o.high + 1, o.low);
    (o.type === 10002 &&
      i.startsWith("AC") &&
      (a = Math.floor(t.monsterAffixes ? (a * (100 + r)) / 100 : a * (1 + r / 100))),
      s &&
        {
          10005: 4,
          10006: 5,
          10007: 2,
          10008: 3,
          10009: 1,
        }[o.type] === s &&
        (a = Math.floor(t.monsterAffixes ? (a * (100 + r)) / 100 : a * (1 + r / 100))));
  }
  return a;
}
function Ds(e, t, a, i, n) {
  if (!(t.friendly || a.dead || i <= 0 || n === "None"))
    for (const s of monsterAffixEntries(t))
      s.type === 10001 &&
        e.rng.next(100) < s.rate &&
        e.buff(a, "Green", s.duration * 1e3, e.rng.next(s.high + 1, s.low), {}, t.id);
}
function Is(e, t) {
  const a = t.special,
    i = monsterAffixEntries(t).filter((r) => r.type === 10011);
  if (
    t.dead ||
    t.friendly ||
    !a ||
    !i.length ||
    e.time < Number(a.nativeAffixRegenAt) ||
    ((a.nativeAffixRegenAt = e.time + 5e3),
    t.buffs.some((r) => r.type === "Green" || r.type === "DreamPoisonArmour"))
  )
    return;
  const s =
      a.challenge === t.map &&
      !a.bossMinion &&
      e.monsters.get(t.definition ?? 0)?.IsBoss &&
      isHell(e.rules)
        ? (e.rules.adaptations.dreamRuntime?.hell?.challengeRegenerationScalePercent ?? 100)
        : 100,
    o = i.reduce((r, c) => r + c.low, 0);
  t.hp = Math.min(t.maxHP, t.hp + Math.ceil((t.maxHP * o * s) / 1e4));
}
function Hs(e, t, a) {
  const i = e.rules.adaptations.dreamRuntime?.monsterAffixModel;
  if (!i || [14, 62, 82, 29, 161].includes(Number(a.DreamOriginalId) || 0) || a.Experience <= 0)
    return;
  const n = Number(
      t.spawn === void 0 ? 0 : e.region(t.map).spawns[t.spawn]?.native?.generationType || 0,
    ),
    s = n === 0 ? e.rng.next(35) : 3,
    o =
      n === 3
        ? e.rng.next(5, 3)
        : n === 2
          ? e.rng.next(3, 1)
          : s <= 2
            ? s === 0
              ? e.rng.next(5, 3)
              : e.rng.next(3, 1)
            : 0,
    r = Object.values(i.groups),
    c = new Set();
  t.special ??= {};
  const l = t.special;
  ((t.monsterAffixes = []), (l.affixDrop = 0), (l.magicAdd = 0), (l.expAdd = 0), (l.dropAdd = 0));
  for (let u = 0; u < o; u++) {
    let h = e.rng.next(r.length);
    if (c.has(r[h].Type)) {
      let v = h - 1;
      for (; v >= 0 && c.has(r[v].Type); ) v--;
      if (v >= 0) h = v;
      else for (; h < r.length && c.has(r[h].Type); ) h++;
    }
    const p = r[h];
    if (!p) break;
    c.add(p.Type);
    const g = Object.entries(p.Affixes),
      [y, f] = g[e.rng.next(g.length)];
    (t.monsterAffixes.push({
      group: p.ID,
      tier: y,
      type: p.Type,
      low: f.LowValue,
      high: f.HighValue,
      rate: p.Rate,
      duration: f.Dura,
    }),
      (l.affixDrop = Math.min(
        65535,
        Math.trunc(Math.fround(Number(l.affixDrop) + Math.fround(f.MagicAdd * Math.fround(1.2)))),
      )),
      (l.magicAdd = (Number(l.magicAdd) + f.MagicAdd) & 65535),
      (l.expAdd = Math.min(65535, Number(l.expAdd) + f.ExpAdd)),
      u === 0 &&
        ((l.nativeAffixType = p.Type),
        (l.nativeAffixLow = f.LowValue),
        (l.nativeAffixHigh = f.HighValue),
        (l.nativeAffixRate = p.Rate),
        (l.nativeAffixDuration = f.Dura),
        (l.nativeAffixRegenAt = e.time + 5e3)),
      (t.name = f.Name + " \xB7 " + t.name));
  }
  for (const u of t.monsterAffixes)
    u.type === 10003 && (u.defencePercent = e.rng.next(u.high + 1, u.low));
  (Ya(t),
    t.monsterAffixes.length &&
      ((t.maxHP = Math.max(
        1,
        Math.trunc(
          Math.fround(
            Math.fround(a.Stats.HP || 1) * Math.fround(1 + t.monsterAffixes.length * 0.25),
          ),
        ),
      )),
      (t.hp = t.maxHP)));
}
function Ns(e, t, a, i = !1) {
  if (
    !i ||
    !isHell(e.rules) ||
    !e.rules.adaptations.dreamRuntime?.hell?.monsterElementalBasicAttack ||
    t.kind !== "monster" ||
    t.friendly ||
    a <= 0
  )
    return {
      raw: 0,
      types: [],
    };
  const n = monsterAffixEntries(t).filter((s) => s.type >= 10005 && s.type <= 10009);
  return {
    raw: Math.floor((a * n.reduce((s, o) => s + o.low / 2, 0)) / 100),
    types: n.map((s) => s.type),
  };
}
function Rs(e, t) {
  if (!$(e, t)?.ownerBound) return !1;
  const a = t.master ? e.actor(t.master) : void 0;
  return t.special?.bossMinion && (!a || a.dead || a.map !== t.map) ? (e.die(t, t), !0) : !1;
}
function Bs(e, t, a, i, n = 3, s) {
  const o = e.rules.monsters.find((l) => l.DreamOriginalId === a);
  if (!o) return;
  const r = e
    .map(t.map)
    .actors.filter(
      (l) =>
        !l.dead &&
        !l.friendly &&
        l.definition === o.Index &&
        (s?.scope === "map" || l.master === t.id),
    );
  if (s?.limitBeforeSummon !== void 0 && r.length >= s.limitBeforeSummon) return;
  const c = s?.mode === "wave" ? i : Math.max(0, i - r.length);
  if (s?.reuseExisting)
    for (const l of r.slice(0, i)) {
      const u = e.freeNear(t.map, t, n);
      if (!u) break;
      ((l.x = u.x),
        (l.y = u.y),
        (l.master = t.id),
        (l.target = t.target),
        (l.special = {
          ...l.special,
          bossMinion: !0,
        }),
        e.emit("ObjectTeleportIn", {
          ObjectID: l.id,
        }));
    }
  for (let l = 0; l < c; l++) {
    const [u, h] = U[(l * 2) % 8],
      p = s?.cardinal
        ? {
            x: t.x + u * n,
            y: t.y + h * n,
          }
        : e.freeNear(t.map, t, n);
    if (!p) break;
    if (!e.walkable(t.map, p.x, p.y, t.id)) continue;
    const g = e.newMonster(o, t.map, p);
    ((g.master = t.id),
      (g.target = t.target),
      (g.special = {
        ...g.special,
        bossMinion: !0,
      }),
      e.map(t.map).actors.push(g));
  }
}
function Mt(e, t, a, i, n) {
  const s = (t.special ??= {});
  if (
    (a.requiredHPBelow !== void 0 && t.hp >= a.requiredHPBelow) ||
    (a.requiredHPBelowPercent !== void 0 && t.hp >= (t.maxHP * a.requiredHPBelowPercent) / 100) ||
    (a.once && s[i + "Done"]) ||
    e.time < Number(s[i + "At"] ?? a.initialDelayMs ?? 0) ||
    (a.chancePercent !== void 0 && e.rng.next(100) >= a.chancePercent)
  )
    return !1;
  for (const o of a.adds) Bs(e, t, o.nativeId, o.count, a.radius, a);
  if (
    ((s[i + "Done"] = !0),
    (s[i + "At"] =
      e.time +
      (a.hpBelow !== void 0 && t.hp < a.hpBelow
        ? (a.woundedIntervalMs ?? a.intervalMs ?? 0)
        : (a.intervalMs ?? 0))),
    n?.kind === "player" && a.drainMPPercent)
  ) {
    const o = n,
      r = Math.floor((o.mp * a.drainMPPercent) / 100);
    ((o.mp -= r), (t.hp = Math.min(t.maxHP, t.hp + r)));
  }
  return (
    a.actionMs &&
      ((t.actionAt = Math.max(t.actionAt, e.time + a.actionMs)),
      e.emit("ObjectMagic", {
        ObjectID: t.id,
        Cast: !0,
        Direction: F[t.dir],
        Spell: "None",
        Duration: a.actionMs,
      })),
    !0
  );
}
function Ts(e, t, a) {
  const i = $(e, t),
    n = (t.special ??= {});
  if (!i || t.dead) return;
  const s = activeBossHealthBranches(e, t),
    o = (i.healthBranches ?? []).reduce((p, g, y) => p + (s.includes(g) ? 2 ** y : 0), 0);
  i.healthBranches?.length &&
    n.bossHealthBranch !== o &&
    ((n.bossHealthBranch = o), e.refreshActor(t));
  const r = i.regeneration;
  r &&
    t.hp < t.maxHP &&
    e.time >= Number(n.bossRegenAt ?? r.initialDelayMs ?? 0) &&
    (t.buffs.some((p) => r.blockedBy.includes(p.type)) ||
      (t.hp = Math.min(t.maxHP, t.hp + Math.floor((t.maxHP * r.percent) / 100))),
    (n.bossRegenAt = e.time + r.intervalMs));
  const c = e.actor(t.target),
    l = t.buffs.some(
      (p) =>
        p.until > e.time &&
        ["Paralysis", "LRParalysis", "Frozen", "Stun", "Trap", "Shock"].includes(p.type),
    );
  if (n.bossChannelIndex !== void 0) {
    const p = i.attacks[Number(n.bossChannelIndex)],
      g = p?.channel;
    !g || l || e.time >= Number(n.bossChannelUntil) || !c || c.dead || c.map !== t.map || e.safe(c)
      ? (delete n.bossChannelIndex, delete n.bossChannelNext, delete n.bossChannelUntil)
      : e.time >= Number(n.bossChannelNext) &&
        ((n.bossChannelNext = Number(n.bossChannelNext) + g.intervalMs),
        ei(
          e,
          t,
          c,
          i,
          {
            ...p,
            hitDelayMs: g.hitDelayMs,
          },
          g.hits,
        ));
  }
  if (
    e.time < t.actionAt ||
    t.buffs.some(
      (p) =>
        p.until > e.time &&
        ["Paralysis", "LRParalysis", "Frozen", "Stun", "Trap", "Shock"].includes(p.type),
    ) ||
    !c ||
    c.dead ||
    c.map !== t.map ||
    !(c.kind === "player" || c.friendly) ||
    e.safe(c) ||
    P(t, c) > i.activationRange
  )
    return;
  {
    const p = i.teleport;
    n.dragonTeleportAt !== void 0 &&
      n.bossTeleportAt === void 0 &&
      (n.bossTeleportAt = n.dragonTeleportAt);
    const g = p?.trackPlayerHit
        ? (n.bossLastPlayerHitAt ?? 0)
        : (n.bossLastAttackAt ?? n.dragonLastAttackAt),
      y = p?.petOwner && c.kind === "monster" && c.master;
    if (
      p &&
      (p.hpAtMostPercent === void 0 || t.hp <= (t.maxHP * p.hpAtMostPercent) / 100) &&
      (P(t, c) > p.minDistance || y) &&
      e.time >= Number(n.bossTeleportAt ?? p.initialDelayMs ?? 0) &&
      (g === void 0 || e.time - Number(g) > (p.afterAttackMs ?? 0))
    ) {
      const f = y ? e.actor(c.master) : void 0,
        v = f?.kind === "player" && !f.dead && f.map === t.map && !e.safe(f) ? f : c,
        x = e.freeNear(t.map, v, p.radius);
      if (
        ((n.bossTeleportAt =
          e.time +
          (p.hpBelow !== void 0 && t.hp < p.hpBelow
            ? (p.woundedIntervalMs ?? p.intervalMs)
            : p.intervalMs)),
        x)
      ) {
        ((t.x = x.x),
          (t.y = x.y),
          (t.target = v.id),
          e.emit("ObjectTeleportIn", {
            ObjectID: t.id,
          }));
        return;
      }
    }
    if (
      i.summon &&
      (n.guideSummoned && i.summon.once && (n.bossSummonDone = !0),
      n.dragonSummonAt !== void 0 &&
        n.bossSummonAt === void 0 &&
        (n.bossSummonAt = n.dragonSummonAt),
      Mt(e, t, i.summon, "bossSummon", c))
    )
      return;
  }
  const u = i.healthStages;
  if (u && t.maxHP >= u.count) {
    const p = Math.trunc(t.hp / Math.trunc(t.maxHP / u.count));
    if (
      p < Number(n.stage ?? u.count) &&
      (u.rageMs && (n.madUntil = e.time + u.rageMs), u.summonSettings)
    ) {
      const g = e.map(t.map).actors.filter((y) => y.master === t.id && !y.dead).length;
      for (let y = 0; y < Math.min(u.summonWave, u.summonLimit - g); y++) {
        const f = e.rules.monsterSettings[u.summonSettings[e.rng.next(u.summonSettings.length)]],
          v = e.rules.monsters.find((M) => M.Name === f),
          x = e.freeNear(t.map, t, u.summonRadius);
        if (!v || !x) continue;
        const m = e.newMonster(v, t.map, x);
        ((m.master = t.id),
          (m.target = t.target),
          (m.actionAt = e.time + u.summonDelayMs),
          (m.special = {
            ...m.special,
            bossMinion: !0,
          }),
          e.map(t.map).actors.push(m));
      }
    }
    n.stage = Math.min(Number(n.stage ?? u.count), p);
  }
  const h = i.escape;
  if (
    h &&
    e.time >= Number(n.teleAt || 0) &&
    ((n.teleAt = e.time + h.intervalMs),
    U.filter(([p, g]) => !e.walkable(t.map, t.x + p, t.y + g, t.id)).length >= h.blockedNeighbours)
  )
    for (let p = 0; p < h.attempts; p++) {
      const g = t.x + e.rng.next(h.radius + 1, -h.radius),
        y = t.y + e.rng.next(h.radius + 1, -h.radius);
      if (e.walkable(t.map, g, y, t.id)) {
        ((t.x = g),
          (t.y = y),
          (t.target = 0),
          e.emit("ObjectTeleportIn", {
            ObjectID: t.id,
          }));
        break;
      }
    }
}


function Za(e, t, a) {
  const i = (t.special ??= {}),
    n = a.woundedSelection,
    s = !!n && t.hp < (n.hpBelow ?? (t.maxHP * n.hpBelowPercent) / 100);
  if ((s && (i.bossWoundedSelection = !0), a.distanceSelection)) {
    const v = e.actor(t.target);
    return v && P(t, v) > a.distanceSelection.threshold
      ? a.distanceSelection.far
      : a.distanceSelection.near;
  }
  const o = a.forceAttack,
    r = e.actor(t.target),
    c = a.attacks[Number(i.bossSelectedAttack ?? 0)],
    l = r ? Math.abs(t.x - r.x) : 0,
    u = r ? Math.abs(t.y - r.y) : 0,
    h = !!r && (P(t, r) > (c.range ?? a.range) || !!(c.alignedOnly && l && u && l !== u));
  if (
    (o &&
      (!o.onlyWhenBlocked || h) &&
      e.time - Number((o.fromActualAttack ? i.bossLastAttackAt : i.bossRecoverAt) ?? 0) >
        o.afterMs &&
      ((i.bossSelectedAttack = o.index),
      o.summon &&
        r &&
        !r.dead &&
        r.map === t.map &&
        !e.safe(r) &&
        !t.dead &&
        e.time >= t.actionAt &&
        !t.buffs.some(
          (v) =>
            v.until > e.time && ["Paralysis", "Frozen", "Stun", "Trap", "Shock"].includes(v.type),
        ) &&
        Mt(e, t, o.summon, "bossForcedSummon")),
    i.bossSelectedAttack !== void 0)
  )
    return Number(i.bossSelectedAttack);
  const p = n && (s || (n.sticky && i.bossWoundedSelection));
  if (a.selection === "nativeModulo") {
    const v = a.moduloSelection;
    return Number(
      (i.bossSelectedAttack = v.indices[e.rng.next(t.hp <= v.hpAtMost ? v.low : v.high)] ?? 0),
    );
  }
  const g = e.rng.next(100);
  let y = 0,
    f = 0;
  for (let v = 1; v < a.attacks.length; v++) {
    if (
      (a.attacks[v].abilityBuff &&
        t.buffs.some((M) => M.type === "DreamBossAbility" && M.until > e.time)) ||
      (a.attacks[v].defenceBuff &&
        t.buffs.some((M) => M.type === "DreamBossDefence" && M.until > e.time))
    )
      continue;
    const x = p ? a.woundedSelection.weights[v] : (a.attacks[v].weight ?? 0),
      m = y;
    if (((y += x), g > m && g <= y)) {
      f = v;
      break;
    }
  }
  return ((i.bossSelectedAttack = f), f);
}
function Os(e, t) {
  const a = $(e, t);
  if (!a || !["nativePercent", "nativeModulo"].includes(a.selection)) return a?.range;
  const i = Za(e, t, a),
    n = a.attacks[i],
    s =
      n.cooldownIndex !== void 0
        ? "bossActionRecover" + n.cooldownIndex
        : n.ownCooldown
          ? "bossActionRecover" + i
          : a.independentRecovery
            ? "bossActionRecover0"
            : "bossRecoverAt";
  n.executeMs !== void 0
    ? (t.attackAt = Number(t.special?.[s] ?? 0) + n.executeMs)
    : a.recoverBeforeInterval && (t.attackAt = Number(t.special?.[s] ?? 0) + Ae(e, t));
  const o = e.actor(t.target),
    r = o ? Math.abs(o.x - t.x) : 0,
    c = o ? Math.abs(o.y - t.y) : 0;
  return o &&
    ((n.alignedOnly && r && c && r !== c) || r > (n.rangeX ?? 1 / 0) || c > (n.rangeY ?? 1 / 0))
    ? 0
    : (n.range ?? a.range);
}
function qs(e, t, a) {
  const i = $(e, t);
  if (!i) return !1;
  const n = (t.special ??= {}),
    s = Number(n.bossAttackPhase || 0) % i.attacks.length;
  let o = s;
  if (
    (["nativePercent", "nativeModulo"].includes(i.selection) && (o = Za(e, t, i)),
    i.selection === "weighted")
  ) {
    const g = i.attacks.reduce((f, v) => f + (v.weight || 0), 0);
    let y = e.rng.next(g);
    o = i.attacks.findIndex((f) => (y -= f.weight || 0) < 0);
  }
  const r = i.attacks[o],
    c = Math.abs(a.x - t.x),
    l = Math.abs(a.y - t.y);
  if (
    (r.alignedOnly && c && l && c !== l) ||
    c > (r.rangeX ?? 1 / 0) ||
    l > (r.rangeY ?? 1 / 0) ||
    (["nativePercent", "nativeModulo"].includes(i.selection) &&
      (P(t, a) > (r.range ?? i.range) || P(t, a) < (r.minimumDistance ?? 0)))
  )
    return !0;
  if (
    (delete n.bossSelectedAttack,
    (n.bossAttackPhase = s + 1),
    (n.bossLastAttackAt = e.time),
    (t.dir = direction(t, a)),
    t.dir < 0 && (t.dir = 0),
    (t.attackAt = e.time + Ae(e, t)),
    (t.actionAt =
      e.time + (r.actionMs ?? (i.actionMs === 300 ? monsterActionCost(e, t, !0) : i.actionMs))),
    i.selection === "cycle" &&
      e.monsters.get(t.definition)?.DreamRaw &&
      (t.attackAt = t.actionAt + Ae(e, t)),
    (n.bossRecoverAt = t.actionAt),
    (n["bossActionRecover" + o] = t.actionAt),
    r.teleportToTarget)
  ) {
    const g = r.teleportToTarget.petOwner && a.master ? e.actor(a.master) : void 0,
      y = g && !g.dead && g.map === t.map && !e.safe(g) ? g : a,
      f = e.freeNear(t.map, y, r.teleportToTarget.radius);
    f &&
      ((t.x = f.x),
      (t.y = f.y),
      (t.dir = direction(t, y)),
      t.dir < 0 && (t.dir = 0),
      e.emit("ObjectTeleportIn", {
        ObjectID: t.id,
      }));
  }
  if (r.abilityBuff) {
    const g = r.abilityBuff;
    e.buff(t, "DreamBossAbility", g.durationMs, 0, g.multiply, t.id);
  }
  if (r.directStatus) {
    const g = r.directStatus;
    e.buff(a, g.type, g.durationMs, g.value ?? 0, {}, t.id);
  }
  r.groundFire && xo(e, t, a, r.groundFire);
  const u = r.animation ?? i.animation ?? "ObjectAttack",
    h = r.visual ?? i.visual ?? "None",
    p = r.visualPerTarget ?? i.visualPerTarget;
  if (
    (r.casterVisual &&
      e.emit("ObjectRangeAttack", {
        ObjectID: t.id,
        Direction: F[t.dir],
        TargetID: t.id,
        Spell: r.casterVisual,
        Action: r.visualAction,
        Duration: r.visualDurationMs ?? r.actionMs ?? i.actionMs,
      }),
    p ||
      e.emit(u, {
        ObjectID: t.id,
        Direction: F[t.dir],
        TargetID: a.id,
        Spell: h,
        Duration: r.visualDurationMs ?? r.actionMs ?? i.actionMs,
        Action: r.visualAction,
        Cast: u === "ObjectMagic",
      }),
    r.shield && e.buff(t, "DreamBossShield", r.shield.durationMs, r.shield.percent),
    r.defenceBuff)
  ) {
    const g = r.defenceBuff;
    ((t.hp = Math.min(t.maxHP, t.hp + Math.floor((t.maxHP * g.healPercent) / 100))),
      e.buff(t, "DreamBossDefence", g.durationMs, 0, {
        MinAC: g.amount,
        MaxAC: g.amount,
        MinMAC: g.amount,
        MaxMAC: g.amount,
      }));
  }
  return (
    i.attackSummon &&
      (n.guideSummoned && (n.attackSummonDone = !0), Mt(e, t, i.attackSummon, "attackSummon")),
    r.summon &&
      (n.guideSummoned && (n["actionSummon" + o + "Done"] = !0),
      Mt(e, t, r.summon, "actionSummon" + o)),
    r.channel &&
      ((n.bossChannelIndex = o),
      (n.bossChannelNext = e.time + r.channel.intervalMs),
      (n.bossChannelUntil = e.time + r.channel.durationMs)),
    ei(e, t, a, i, r, r.hits),
    i.suicideAttack &&
      (t.spawn !== void 0 &&
        ((e.map(t.map).respawns[t.spawn] =
          e.time + e.region(t.map).spawns[t.spawn].respawnMinutes * 6e4),
        (t.spawn = void 0)),
      (t.dead = !0),
      (t.hp = 0),
      (t.target = 0),
      (t.expires = e.time + 1e4),
      e.emit("ObjectDied", {
        ObjectID: t.id,
        Direction: F[t.dir],
      })),
    !0
  );
}
function ei(e, t, a, i, n, s) {
  const o = (t.special ??= {}),
    r = i.randomPerTarget ? 0 : z(t.stats, "DC", e.rng),
    c = [e.me, ...e.map(t.map).actors.filter((p) => p.friendly)].filter(
      (p) => p && !p.dead && p.map === t.map && !e.safe(p),
    ),
    l = n.animation ?? i.animation ?? "ObjectAttack",
    u = n.visual ?? i.visual ?? "None",
    h = n.visualPerTarget ?? i.visualPerTarget;
  for (const p of s) {
    let g = c.filter((y) => {
      if (p.excludePrimary && y.id === a.id) return !1;
      if (p.shape === "selfArea")
        return (
          Math.abs(y.x - t.x) <= (p.rangeX ?? p.radius) &&
          Math.abs(y.y - t.y) <= (p.rangeY ?? p.radius)
        );
      if (p.shape === "targetArea")
        return (
          Math.abs(y.x - a.x) <= (p.rangeX ?? p.radius) &&
          Math.abs(y.y - a.y) <= (p.rangeY ?? p.radius)
        );
      if (p.shape === "forwardArea") {
        const [f, v] = U[t.dir];
        return (
          P(y, {
            x: t.x + f * (p.forward ?? 2),
            y: t.y + v * (p.forward ?? 2),
          }) <= p.radius
        );
      }
      if (p.shape === "line") {
        const [f, v] = U[t.dir],
          x = f ? (y.x - t.x) / f : (y.y - t.y) / v;
        return x > 0 && x <= p.radius && y.x === t.x + x * f && y.y === t.y + x * v;
      }
      return y.id === a.id && P(t, y) <= Math.max(n.range ?? i.range, p.radius);
    });
    if (
      (p.scatterRadius !== void 0 &&
        (g = g.flatMap((f) => c.filter((v) => P(v, f) <= p.scatterRadius))),
      h &&
        e.emit("ObjectMagic", {
          ObjectID: t.id,
          Cast: !0,
          Direction: F[t.dir],
          Action: n.visualAction,
          Duration: n.visualDurationMs ?? n.actionMs ?? i.actionMs,
        }),
      h)
    )
      for (const y of new Map(g.map((f) => [f.id, f])).values())
        e.emit(l, {
          ObjectID: t.id,
          Direction: F[t.dir],
          TargetID: y.id,
          Spell: u,
          Action: n.visualAction,
          Duration: n.visualDurationMs ?? n.actionMs ?? i.actionMs,
        });
    g.some((y) => y.kind === "player") && (o.bossLastPlayerHitAt = e.time);
    for (const y of g) {
      const f = i.randomPerTarget ? z(t.stats, "DC", e.rng) : r;
      let v =
          p.currentHPScale !== void 0
            ? Math.floor(y.hp * p.currentHPScale)
            : p.maxHPScale !== void 0
              ? Math.floor(y.maxHP * p.maxHPScale)
              : Math.floor(((p.defence === "None" && t.stats.MaxDC) || f) * p.scale),
        x = p.defence;
      if (
        (p.addPowerToHPScale &&
          (y.kind === "player" ? (v += f) : (v = Math.floor(y.maxHP * (p.petsMaxHPScale ?? 0)))),
        p.subtractMPDivisor && y.kind === "player")
      ) {
        const m = y;
        m.mp -= Math.floor(m.mp / p.subtractMPDivisor);
      }
      if (
        (p.bypassChanceOneIn &&
          e.rng.next(p.bypassChanceOneIn) === 0 &&
          ((x = p.defence.startsWith("MAC") ? "MACBypass" : "ACBypass"),
          (v = Math.min(v, Math.floor((y.maxHP * (p.capMaxHPPercent ?? 100)) / 100)))),
        p.drainHalfMP)
      )
        if (y.kind === "player") {
          const m = y;
          ((v = Math.floor(m.mp / 2)), (m.mp -= v));
        } else v = Math.floor(y.maxHP * (p.petsMaxHPScale ?? 0.05));
      if (
        (p.rawHealScale && (t.hp = Math.min(t.maxHP, t.hp + Math.floor(v * p.rawHealScale))),
        i.suicideAttack)
      )
        e.damage(t, y, v, x, p.spell);
      else {
        const m = e.schedule(
          "hit",
          (n.hitDelayMs ?? i.hitDelayMs) + P(t, y) * (i.distanceDelayMs ?? 0),
          t,
          y,
          v,
          x,
          p.spell,
        );
        p.basicAttack && (m.monsterBasicAttack = !0);
      }
    }
  }
}
function Es(e, t, a, i, n) {
  if (i <= 0) return;
  const s = e.monsters.get(t.definition)?.DreamOnHit;
  s &&
    a.kind === "player" &&
    !a.dead &&
    a.hp > 0 &&
    (s.stoneChancePercent &&
      e.rng.next(100) < s.stoneChancePercent &&
      e.buff(a, "Paralysis", s.stoneDurationMs || 2e3, 0, {}, t.id),
    s.poisonChancePercent &&
      e.rng.next(100) < s.poisonChancePercent &&
      e.buff(a, "Green", s.poisonDurationMs || 8e3, s.poisonValue || 8, {}, t.id));
  const o = $(e, t);
  if (o?.healOwnerPercent && t.master) {
    const l = e.actor(t.master);
    l &&
      !l.dead &&
      l.map === t.map &&
      (l.hp = Math.min(l.maxHP, l.hp + Math.floor((i * o.healOwnerPercent) / 100)));
  }
  if (a.dead || !n) return;
  const r = $(e, t)?.statuses?.[n];
  if (!r) return;
  const c = (t.special ??= {});
  for (const l of r) {
    const u = "bossStatusAt:" + n + ":" + l.type;
    if (e.time < Number(c[u] ?? (n === "DragonParalysis" ? c.dragonParalysisAt : 0) ?? 0)) continue;
    const h = l.powerStat
      ? z(t.stats, l.powerStat, e.rng)
      : l.damageDivisor
        ? Math.max(1, Math.floor(i / l.damageDivisor))
        : (l.value ?? 0);
    if (
      (l.poisonResist &&
        e.rng.next(e.rules.constants.PoisonResistWeight) < (a.stats.PoisonResist || 0)) ||
      (l.chanceOneIn && e.rng.next(l.chanceOneIn) !== 0) ||
      (l.chancePercent < 100 && e.rng.next(100) >= l.chancePercent)
    )
      continue;
    const p = e.buff(a, l.type, l.durationMs, h, {}, t.id);
    (l.tickMs &&
      p &&
      p.interval !== l.tickMs &&
      ((p.interval = l.tickMs), (p.next = e.time + l.tickMs)),
      l.cooldownMs && (c[u] = e.time + l.cooldownMs));
  }
}


function Fs(e, t, a, i, n) {
  if (t.dead || e.safe(a) || !n) return;
  const s = $(e, t)
    ?.attacks.flatMap((r) => r.hits)
    .find((r) => r.spell === n);
  if (!s) return;
  let o = Math.floor(i * (s.healScale ?? 0));
  if (s.mpDivisor && a.kind === "player" && !a.dead) {
    const r = a,
      c = Math.floor(r.mp / s.mpDivisor);
    c > 0 && ((r.mp = c), s.healRemainingMP && (o += c));
  }
  o > 0 && (t.hp = Math.min(t.maxHP, t.hp + o));
}
function ti(e, t) {
  if (t.special?.trialFloor !== 52) return;
  const a = $(e, t)?.revivals;
  a &&
    e.say(
      message("trial.revivalsRemaining", {
        count: a.count - Number(t.special.nativeRevivals || 0),
      }),
    );
}
function Ls(e, t) {
  const a = $(e, t)?.revivals;
  if (!a) return !1;
  const i = (t.special ??= {}),
    n = Number(i.nativeRevivals || 0);
  return n >= a.count
    ? !1
    : ((i.nativeRevivals = n + 1),
      e.refreshActor(t),
      (t.hp = t.maxHP),
      e.emit("ObjectRevived", {
        ObjectID: t.id,
        Effect: !0,
      }),
      ti(e, t),
      !0);
}
var Ws = new Set(["FireBall", "GreatFireBall", "SoulFireBall"]);
function canReachDreamSpell(e, t, a, i) {
  return !Ws.has(a) || We(e, t.map, t, i);
}
var js = {
    SummonSpiritServant: -1,
    SummonSkeleton: 29,
    SummonShinsu: 14,
    AdvancedSummon: 62,
    SummonTiger: 99,
    SummonMoonSpirit: 144,
  },
  $s = new Set(["Thrusting", "HalfMoon", "WhirlwindSlash", "FlamingSword", "BlazingSword"]);
function ii(e, t, a, i, n) {
  const s = a.Spell[0].toLowerCase() + a.Spell.slice(1),
    o = e.skill(t, a.Spell).s;
  if (n && ["FlamingSword", "BlazingSword"].includes(a.Spell)) {
    if (e.time < o.CastTime) throw new b(message("core.dream-magic.toggleDream.427a35f43e"));
    const r = le(a, i, t.stats);
    if (t.mp < r) throw new b(message("core.dream-magic.toggleDream.26f1ab23c0"));
    ((t.mp -= r), (o.CastTime = e.time + a.DreamSkill.cooldown));
  }
  (n &&
    ["FlamingSword", "BlazingSword"].includes(a.Spell) &&
    ((t.special ??= {}),
    (t.special["readyUntil:" + a.Spell] = e.time + (a.Spell === "FlamingSword" ? 6e3 : 1e4))),
    n && a.Spell === "WhirlwindSlash" && (t.attackModes.halfMoon = !1),
    n && a.Spell === "HalfMoon" && (t.attackModes.whirlwindSlash = !1),
    (t.attackModes[s] = n),
    e.emit("SpellToggle", {
      ObjectID: t.id,
      Spell: a.Spell,
      CanUse: n,
    }));
}
function enemies(e, t) {
  return e
    .map(t.map)
    .actors.filter((a) => a.kind === "monster" && !a.dead && !a.friendly && targetableMonster(a));
}
function pets(e, t) {
  return Object.values(e.maps)
    .flatMap((a) => a.actors)
    .filter((a) => a.master === t.id && a.friendly && !a.dead);
}
function Gs(e) {
  if (e.IsBoss || e.GuideRank === "elite") return null;
  const t = String(e.DreamName || e.Name),
    a = e.Stats.HP || 0;
  return t === "\u534A\u517D\u52C7\u58EB"
    ? a >= 900
      ? 36
      : 23
    : t === "\u5DE8\u578B\u591A\u89D2\u866B"
      ? a >= 900
        ? 33
        : null
      : ({
          鹿: 4,
          多钩猫: 8,
          钉耙猫: 8,
          半兽战士: 17,
          半兽人战士: 17,
          沃玛战士: 28,
          沃玛勇士: 28,
          沃玛战将: 28,
          火焰沃玛: 28,
          黑野猪: 28,
          红野猪: 28,
          蜈蚣: 28,
          钳虫: 28,
          跳跳蜂: 28,
          巨型蠕虫: 28,
          黑色恶蛆: 28,
          牛头魔: 39,
          黑锷蜘蛛: 43,
          黑鄂蜘蛛: 43,
          黑狐: 58,
          素狐: 58,
          赤狐: 58,
          冰甲虫: 63,
          雪狼: 63,
          寒冰雪人: 63,
          寒冰战士: 63,
        }[t] ?? null);
}
function Qs(e, t, a, i) {
  const n = e.skill(t, a.Spell).s.Level,
    s = a.Spell === "SummonTiger" && n >= 4 ? n - 3 : Math.min(3, n),
    o = a.Spell === "SummonTiger" && n >= 4 ? 116 : js[a.Spell],
    r = a.Spell === "SummonSpiritServant",
    c = e.rules.monsters.find((f) =>
      r
        ? f.Index === e.rules.adaptations.noviceProgression?.spiritMonster
        : f.DreamOriginalId === o,
    );
  if (!c) throw new b(message("core.dream-magic.summonDream.b6561f1b76"));
  const l = r || a.Spell === "SummonSkeleton" ? 1 : 2,
    u = r ? 1 : s >= 3 ? 2 : 1;
  const h = pets(e, t).filter((f) => f.definition === c.Index),
    p = r ? spiritGrowth(e, t) : null,
    g = r
      ? p.progress.level
      : Math.min(
          7,
          s + Math.max(0, i - n) + (o === 116 ? 3 : 0) + (t.stats["PetLevel:" + a.Spell] || 0),
        ),
    y = summonPetCap(i, t.stats["PetLevel:" + a.Spell] || 0);
  for (const f of h)
    ((f.special.petLevel = Math.max(g, Number(f.special.petLevel || 0))),
      (f.special.maxPetLevel = y),
      p && (f.special.petXP = p.progress.xp),
      e.refreshActor(f));
  for (const f of h.slice(u)) ((f.dead = !0), (f.hp = 0), (f.expires = e.time));
  e.bringPets(t);
  for (let f = Math.min(h.length, u); f < u; f++) {
    const v = e.freeNear(t.map, t, 3);
    if (!v) break;
    const x = e.newMonster(c, t.map, v);
    ((x.friendly = !0),
      (x.master = t.id),
      (x.special = {
        ...x.special,
        dreamPet: !0,
        dreamFamily: l,
        summonSpell: a.Spell,
        petLevel: g,
        maxPetLevel: y,
        ...(p
          ? {
              petXP: p.progress.xp,
            }
          : {}),
      }),
      e.refreshActor(x),
      (x.hp = x.maxHP),
      (x.actionAt = e.time + (o === 29 ? 1500 : 500)),
      e.map(t.map).actors.push(x),
      e.emit("ObjectShow", {
        ObjectID: x.id,
        Duration: o === 29 ? 1500 : 500,
      }));
  }
}
function zs(e, t, a, i) {
  const n = e.skill(t, a.Spell),
    s = n.level,
    o = a.DreamSkill,
    r = a.Spell;
  if (o.passive) {
    e.say(message("core.dream-magic.castDream.2c29d4452a"));
    return;
  }
  if ($s.has(r)) {
    ii(e, t, a, s, !0);
    return;
  }
  if (e.time < Math.max(t.spellAt, t.actionAt, n.s.CastTime)) return;
  const c = le(a, s, t.stats);
  if (t.mp < c) throw new b(message("core.dream-magic.castDream.26f1ab23c0"));
  let l = r === "Poisoning" ? t : e.actor(Number(i.TargetID));
  const u = {
    x: Number(i.Location?.X ?? t.x),
    y: Number(i.Location?.Y ?? t.y),
  };
  if (!Number.isFinite(u.x) || !Number.isFinite(u.y))
    throw new b(message("core.dream-magic.castDream.a817ce95ed"));
  const h = l ?? u;
  if (l?.map !== void 0 && l.map !== t.map)
    throw new b(message("core.dream-magic.castDream.0640ca6a3a"));
  if (P(t, h) > a.Range) throw new b(message("core.dream-magic.castDream.8ec455055d"));
  const p = () => {
      if (!l || l.dead || l.friendly || l.kind !== "monster" || !targetableMonster(l))
        throw new b(message("core.dream-magic.castDream.ac7b618ae7"));
      return l;
    },
    g = (m = "MC") => magicDamage(a, s, L(e, t, m), e.rng),
    y = (m, M, k = 500, w = "MAC") => {
      const D = e.schedule("hit", k, t, m, M, w, r);
      return (
        (D.level = s),
        ["MeteorStrike", "IceFlame", "FireBang", "IceStorm"].includes(r) &&
          (D.location = {
            x: h.x,
            y: h.y,
          }),
        D
      );
    },
    f = (m, M, k, w = 500, D = "MAC") => {
      for (const E of enemies(e, t).filter((W) => P(W, m) <= M)) y(E, k, w, D);
    };
  let v;
  switch (r) {
    case "FireBall":
    case "GreatFireBall":
    case "ThunderBolt":
    case "SoulFireBall":
    case "FlameDisruptor":
    case "FrostCrunch": {
      const m = p();
      if (!canReachDreamSpell(e, t, r, m)) throw new b(message("skill.projectileObstructed"));
      v = () => y(m, g(r === "SoulFireBall" ? "SC" : "MC") *
        (r === "SoulFireBall" && n.s.Level >= 4 ? 2 : 1));
      break;
    }
    case "FireBang":
    case "IceStorm":
    case "IceFlame":
      v = () => f(h, 1, g());
      break;
    case "ChainThunder": {
      const m = p();
      v = () => {
        const M = [m];
        for (; M.length < Math.max(2, s + 1); ) {
          const k = M[M.length - 1],
            w = enemies(e, t)
              .filter((D) => !M.includes(D) && P(D, k) <= Math.min(4, n.s.Level + 1))
              .sort((D, E) => P(D, k) - P(E, k) || D.id - E.id)[0];
          if (!w) break;
          M.push(w);
        }
        for (const [k, w] of M.entries())
          y(w, Math.trunc(g() * Math.max(0.25, 0.8 ** k)), 900 + k * 300);
        e.emit("SpellChain", {
          Spell: r,
          Segments: M.map((k, w) => ({
            From: {
              x: (w ? M[w - 1] : t).x,
              y: (w ? M[w - 1] : t).y,
            },
            To: {
              x: k.x,
              y: k.y,
            },
            Delay: w * 300,
          })),
        });
      };
      break;
    }
    case "ThunderStorm":
      v = () => {
        for (const m of enemies(e, t).filter((M) => P(M, t) <= 2))
          y(m, Math.floor(g() / (P(m, t) > 1 ? 2 : 1)));
      };
      break;
    case "MeteorStrike":
      v = () => {
        for (const m of enemies(e, t).filter((M) => P(M, h) <= 1))
          for (let M = 0; M < 3; M++) {
            const k = y(m, g(), 2500 + M * 700);
            delete k.location;
          }
      };
      break;
    case "FireWall":
    case "PoisonCloud":
    case "DragonFlame":
      v = () => {
        const m = r === "PoisonCloud",
          M = r === "FireWall",
          k = M
            ? Math.min(
                (L(e, t, "MC") + 3 * s) * 500,
                [0, 8e3, 12e3, 15e3, 18e3, 21e3, 24e3][s] ?? 25e3,
              )
            : m
              ? 3e3 + L(e, t, "SC") * 100
              : 3e3,
          w = e.schedule("magic", M ? 0 : m ? 800 : 300, t, t, 0, "None", r);
        ((w.durationMs = k),
          (w.level = s),
          (w.location = {
            x: h.x,
            y: h.y,
          }));
      };
      break;
    case "Healing": {
      const m = l && !l.dead && (l.id === t.id || l.master === t.id) ? l : t;
      v = () => e.schedule("heal", 500, t, m, g("SC"), "None", r);
      break;
    }
    case "MassHealing":
      v = () => {
        for (const m of [t, ...pets(e, t)].filter((M) => M.map === t.map && P(M, h) <= 1))
          e.schedule("heal", 500, t, m, g("SC"), "None", r);
      };
      break;
    case "Poisoning": {
      v = () => {
        const duration = (20 + s * 7 + L(e, t, "SC") * 2) * 1e3;
        for (const m of enemies(e, t).filter((m) => P(t, m) <= a.Range)) {
          const buff = e.buff(m, "Green", duration, poisoningDamage(s, t.stats), {}, t.id, r);
          if (buff) buff.interval = 1e3;
          e.buff(m, "DreamPoisonArmour", duration, Math.min(100, 4 * s), {}, t.id, r);
        }
      };
      break;
    }
    case "GhostBurn": {
      const m = p();
      v = () =>
        e.buff(
          m,
          "GhostBurn",
          5e3 + 3e3 * s + Math.trunc(L(e, t, "SC") / 10),
          0,
          {
            MinDCRatePercent: -(3 + 2 * s),
            MaxDCRatePercent: -(3 + 2 * s),
          },
          t.id,
          r,
        );
      break;
    }
    case "Hiding":
      v = () => e.buff(t, "Hiding", (8 * s + L(e, t, "SC")) * 500 + 500);
      break;
    case "BlessedArmour":
      v = () => {
        const m = L(e, t, "SC"),
          M = m < 70 ? m * 8e3 : m * 3e3 + 35e4;
        for (const k of [t, ...pets(e, t)].filter((w) => w.map === t.map && P(w, h) <= 1)) {
          const w = k.id === t.id ? 2 * s * (1 + Math.trunc((t.level - 1) / 10)) : 2 * s;
          e.buff(
            k,
            "BlessedArmour",
            M,
            0,
            {
              MinAC: w,
              MaxAC: w,
              MinMAC: w,
              MaxMAC: w,
            },
            t.id,
            r,
          );
        }
      };
      break;
    case "MagicShield":
      v = () => e.buff(t, "MagicShield", (5 + L(e, t, "MC")) * 1e3, s, {}, t.id, r);
      break;
    case "BloodDragon":
      v = () =>
        e.buff(
          t,
          r,
          s >= 3 ? 3e5 : (L(e, t, "DC") + 25 * s) * 200,
          0,
          {
            DreamCritPercent: Math.min(3, s) * 10,
            DreamCritDamagePercent: Math.min(3, s) * 6,
            AttackSpeed: Math.min(3, s) + 1,
          },
          t.id,
          r,
        );
      break;
    case "DiamondBody": {
      const m = Math.min(6, s),
        M = Math.min(3, m);
      v = () =>
        e.buff(
          t,
          r,
          s >= 3 ? 3e5 : L(e, t, "DC") * 400 + s * 5e3,
          m,
          {
            MinAC: M * 8,
            MaxAC: M * 8,
            MinMAC: M * 8,
            MaxMAC: M * 8,
            NoFlinchPercent: 7 * M,
            HPRatePercent: [0, 0, 0, 0, 20, 40, 70][m],
            PotionHealingPercent: [0, 0, 0, 0, 10, 15, 20][m],
          },
          t.id,
          r,
        );
      break;
    }
    case "Abyss": {
      const m = Math.min(6, s);
      v = () =>
        e.buff(
          t,
          r,
          (s + 5) * 3e3,
          m,
          {
            DreamMagicDamagePercent: 3 + m,
            ManaPenaltyPercent: [0, 6, 7, 8, 9, 10, 12][m],
            DreamCritPercent: m >= 4 ? [10, 15, 25][m - 4] : 0,
          },
          t.id,
          r,
        );
      break;
    }
    case "InnateQi":
      v = () =>
        e.buff(
          t,
          r,
          L(e, t, "SC") * 500 + Math.min(s, 3) * 5e3,
          Math.min(6, s),
          {
            SpiritDamagePercent: 10 * Math.min(6, s),
          },
          t.id,
          r,
        );
      break;
    case "BeastArmour": {
      const m = pets(e, t).find(
        (M) =>
          e.monsters.get(M.definition)?.DreamOriginalId === 62 && !M.special?.nativeBeastArmourRank,
      );
      if (!m) throw new b(message("core.dream-magic.castDream.019bf7dc80"));
      v = () => {
        ((m.special ??= {}),
          (m.special.nativeBeastArmourRank = s),
          (m.art = e.rules.monsters.find((M) => M.DreamOriginalId === 82)?.Image || m.art),
          (m.name = "\u5723\u517D"),
          e.refreshActor(m),
          e.emit("ObjectShow", {
            ObjectID: m.id,
            Duration: 500,
          }));
      };
      break;
    }
    case "SummonSpiritServant":
    case "SummonSkeleton":
    case "SummonShinsu":
    case "AdvancedSummon":
    case "SummonTiger":
    case "SummonMoonSpirit":
      if (!e.freeNear(t.map, t, 3)) throw new b(message("core.dream-magic.castDream.b60b3b41b5"));
      v = () => Qs(e, t, a, s);
      break;
    case "LionRoar":
      v = () => {
        for (const m of enemies(e, t).filter(
          (M) => P(M, t) <= Math.min(4, s + 1) && e.monsters.get(M.definition).Level <= t.level - 2,
        ))
          e.buff(m, "LRParalysis", s * 2e3, 0, {}, t.id, r);
      };
      break;
    case "FlashSlash":
      v = () => {
        const m = direction(t, h),
          [M, k] = U[m],
          w = e.geometry.get(t.map);
        t.dir = m;
        for (let D = 0; D < s + 1; D++) {
          const E = t.x + M,
            W = t.y + k;
          if (
            E < 0 ||
            W < 0 ||
            E >= w.width ||
            W >= w.height ||
            w.solid[W * w.width + E] ||
            e
              .map(t.map)
              .actors.some(
                (j) => !j.dead && (j.kind === "npc" || j.friendly) && j.x === E && j.y === W,
              )
          )
            break;
          ((t.x = E), (t.y = W));
          for (const j of enemies(e, t).filter((A) => A.x === E && A.y === W))
            y(j, Math.trunc(L(e, t, "DC") * (s + 4) * 0.5), 500, "AC");
        }
      };
      break;
    case "ElectricShock": {
      const m = p(),
        M = e.monsters.get(m.definition),
        k = Gs(M);
      if (k === null || m.special?.elite || m.special?.nativeAffixType)
        throw new b(message("core.dream-magic.castDream.2a0a3eb47b"));
      if (k > t.level)
        throw new b(
          message("core.dream-magic.castDream.8e84096164", {
            p0: k,
          }),
        );
      if (t.level - M.Level < 3) throw new b(message("core.dream-magic.castDream.fcd380a876"));
      if (pets(e, t).filter((pet) => pet.special?.dreamTamed || pet.special?.tameUntil).length >= (s === 1 ? 1 : 3))
        throw new b(message("core.dream-magic.castDream.b245cda302"));
      v = () => {
        const w = Math.max(1, Math.trunc((70 - L(e, t, "MC")) / 10));
        if (e.rng.next(w) !== 0) {
          e.say(message("core.dream-magic.castDream.0b855f3c9e"));
          return;
        }
        (m.spawn !== void 0 &&
          ((e.map(m.map).respawns[m.spawn] =
            e.time + e.region(m.map).spawns[m.spawn].respawnMinutes * 6e4),
          (m.spawn = void 0)),
          (m.friendly = !0),
          (m.master = t.id),
          (m.target = 0),
          (m.buffs = []),
          (m.special = {
            ...m.special,
            dreamPet: !0,
            dreamTamed: !0,
            petLevel: 0,
            maxPetLevel: 3,
            tameUntil: 0,
          }),
          e.refreshActor(m),
          e.say(
            message("core.dream-magic.castDream.76b2142e79", {
              p0: entityText("monsters", m.definition),
            }),
          ));
      };
      break;
    }
    default:
      throw new b(
        message("core.dream-magic.castDream.fa2913ca98", {
          p0: r,
        }),
      );
  }
  const x = dreamCastDelay(t.stats);
  (v(),
    (t.mp -= c),
    (n.s.CastTime = e.time + o.cooldown),
    (t.spellAt = e.time + x),
    (t.actionAt = e.time + Math.min(600, x)),
    e.emit("Magic", {
      ObjectID: t.id,
      Spell: r,
      Cast: !0,
      Direction: F[t.dir],
      Target: {
        x: h.x,
        y: h.y,
      },
      TargetID: l?.id || 0,
    }));
}


function Vs(e, t, a, i) {
  if (i.spell === "FireWall" || i.spell === "PoisonCloud" || i.spell === "DragonFlame") {
    xi(e, t, i);
    return;
  }
  const n = e.skill(t, i.spell || "")?.s.Level || 1,
    s = Number(e.monsters.get(a.definition)?.DreamRaw?.Weight || 0);
  if (
    ["FrostCrunch", "IceFlame"].includes(i.spell || "") &&
    !t.dead &&
    !a.dead &&
    a.hp > 0 &&
    !(s & 128) &&
    !hasMonsterAffix(a, 10009) &&
    !a.buffs.some((o) => o.type === "Slow" && o.until > e.time) &&
    e.rng.next(100) < Math.min(100, 20 * n)
  ) {
    const o = e.buff(a, "Slow", n * 1e3 + L(e, t, "MC") * 200, 0, {}, t.id, i.spell);
    o &&
      ((a.buffs = a.buffs.filter((r) => r.type !== "DreamFrost")),
      a.buffs.push({
        ...o,
        type: "DreamFrost",
        value: 50,
        stats: {},
      }));
  }
}
var Us = new Set([
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
  ]),
  ni = new Set([
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
function Yt(e, t, a, i) {
  if (i && mountedItem(e, t)) throw new b(message("core.magic.toggleMagic.5c12d1da76"));
  const n = e.skill(t, a);
  if (!n) throw new b(message("core.magic.toggleMagic.446bba28f3"));
  if (n.d.DreamSkill) {
    ii(e, t, n.d, n.level, i);
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
    ].includes(a)
  )
    throw new b(message("core.magic.toggleMagic.ffd64a746c"));
  const s = a[0].toLowerCase() + a.slice(1);
  if (i && ["FlamingSword", "TwinDrakeBlade", "CounterAttack"].includes(a)) {
    const o = n.d.BaseCost + n.s.Level * n.d.LevelCost;
    if (t.mp < o || (a === "CounterAttack" && t.mp === o))
      throw new b(message("core.magic.toggleMagic.26f1ab23c0"));
    if (e.time < n.s.CastTime) throw new b(message("core.magic.toggleMagic.427a35f43e"));
    ((t.mp -= o),
      (n.s.CastTime =
        e.time +
        (a === "CounterAttack"
          ? 7e3
          : a === "FlamingSword"
            ? 1e4
            : n.d.DelayBase - n.s.Level * n.d.DelayReduction)));
  }
  if (((t.attackModes[s] = i), i && a === "CounterAttack")) {
    const o = 11 + n.s.Level * 3;
    e.buff(t, a, 7e3, 0, {
      MinAC: o,
      MaxAC: o,
      MinMAC: o,
      MaxMAC: o,
    });
  }
  e.emit("SpellToggle", {
    ObjectID: t.id,
    Spell: a,
    CanUse: i,
  });
}
function Ks(e, t, a) {
  const i = e.skill(t, "CounterAttack");
  if (!i || !t.attackModes.counterAttack || e.time >= i.s.CastTime) return;
  let n = z(t.stats, "DC", e.rng);
  e.rng.next(100) <= (t.stats.Accuracy || 0) && (n *= 2);
  const s = magicDamage(i.d, i.s.Level, n, e.rng);
  P(t, a) > 1 ||
    e.rng.next(10) > i.s.Level + 6 ||
    ((t.dir = (a.dir + 4) % 8),
    (t.attackModes.counterAttack = !1),
    e.schedule("hit", Math.max(0, t.attackAt - e.time), t, a, s, "AC", "CounterAttack"),
    e.emit("Magic", {
      ObjectID: t.id,
      Spell: "CounterAttack",
      Cast: !0,
      Direction: F[t.dir],
      Target: a,
      TargetID: a.id,
    }),
    e.levelSkill(t, i.s));
}
function Zt(e, t, a, i, n) {
  if (
    a.kind !== "monster" ||
    !e.monsters.get(a.definition)?.CanPush ||
    isChallengeChest(e.monsters.get(a.definition), e.rules) ||
    !targetableMonster(a) ||
    i < 0 ||
    i > 7 ||
    a.dead
  )
    return 0;
  const [s, o] = U[i];
  let r = 0;
  for (; r < n && e.walkable(a.map, a.x + s, a.y + o, a.id); ) ((a.x += s), (a.y += o), r++);
  return (
    r &&
      ((a.dir = (i + 4) % 8),
      (a.actionAt = e.time + 300 * r),
      (a.moveAt = e.time + 500 * r),
      e.emit("ObjectPushed", {
        ObjectID: a.id,
        Direction: F[a.dir],
        Location: {
          X: a.x,
          Y: a.y,
        },
      })),
    r
  );
}
function si(e, t, a, i) {
  if (e.skill(t, i.spell || "")?.d.DreamSkill) {
    Vs(e, t, a, i);
    return;
  }
  const n = i.level || 0,
    s = e.monsters.get(a.definition);
  switch (i.spell) {
    case "Blink": {
      const o = i.location;
      if (!e.walkable(t.map, o.x, o.y, t.id) || e.rng.next(4) >= n + 1) return;
      ((t.x = o.x),
        (t.y = o.y),
        e.buff(t, "TemporalFlux", 3e4, 0, {
          TeleportManaPenaltyPercent: 30,
        }));
      break;
    }
    case "Teleport": {
      const o = e.rules.world.maps.find((h) => h.start),
        r = e.geometry.get(o.id),
        c = Math.trunc(r.width / (n + 1)),
        l = Math.trunc(r.height / (n + 1));
      let u = !1;
      for (let h = 0; h < 200; h++) {
        const p = o.center[0] + e.rng.next(c, -c),
          g = o.center[1] + e.rng.next(l, -l);
        if (e.walkable(o.id, p, g, t.id)) {
          ((t.map = o.id), (t.x = p), (t.y = g), e.initializeMap(t.map), e.bringPets(t), (u = !0));
          break;
        }
      }
      if (!u) return;
      e.buff(t, "TemporalFlux", 3e4, 0, {
        TeleportManaPenaltyPercent: 30,
      });
      break;
    }
    case "Purification":
      if (!(a.id === t.id || a.friendly) || e.rng.next(4) > n) return;
      ((a.buffs = a.buffs.filter(
        (o) =>
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
          ].includes(o.type),
      )),
        e.refreshActor(a));
      break;
    case "SummonSkeleton":
    case "SummonShinsu":
    case "SummonHolyDeva": {
      const o =
          e.rules.monsterSettings[
            i.spell === "SummonSkeleton"
              ? "SkeletonName"
              : i.spell === "SummonShinsu"
                ? "ShinsuName"
                : "AngelName"
          ],
        r = e.rules.monsters.find((h) => h.Name === o),
        c = e.freeNear(t.map, t, 3);
      if (!r || !c) return;
      const l = Object.values(e.maps)
        .flatMap((h) => h.actors)
        .find((h) => h.master === t.id && h.definition === r.Index && !h.dead);
      if (l) {
        l.special.maxPetLevel = summonPetCap(n);
        l.special.summonSpell = i.spell;
        e.refreshActor(l);
        (e.bringPets(t), (l.x = c.x), (l.y = c.y));
        return;
      }
      const u = e.newMonster(r, t.map, c);
      ((u.friendly = !0),
        (u.master = t.id),
        (u.special.petLevel = n),
        (u.special.maxPetLevel = summonPetCap(n)),
        (u.special.summonSpell = i.spell),
        e.refreshActor(u),
        (u.hp = u.maxHP),
        (u.actionAt = e.time + 1e3),
        e.map(t.map).actors.push(u));
      break;
    }
    case "Mirroring": {
      const o = e.map(t.map).actors.find((u) => u.ai === 55 && u.master === t.id && !u.dead);
      if (o) {
        e.die(o, t);
        return;
      }
      const r = e.rules.monsters.find((u) => u.Name === e.rules.monsterSettings.CloneName),
        c = e.freeNear(t.map, t, 2);
      if (!r || !c) return;
      const l = e.newMonster(r, t.map, c);
      ((l.friendly = !0),
        (l.master = t.id),
        (l.actionAt = e.time + 1e3),
        e.map(t.map).actors.push(l));
      break;
    }
    case "ElectricShock": {
      if (!s || a.friendly) return;
      if (e.rng.next(4 - n) > 0) {
        if (e.rng.next(2) === 0) {
          const u = e.skill(t, "ElectricShock")?.s;
          u && e.levelSkill(t, u);
        }
        return;
      }
      const o = e.skill(t, "ElectricShock")?.s;
      if ((o && e.levelSkill(t, o), e.rng.next(2) > 0)) {
        (e.buff(a, "Shock", (n * 5 + 10) * 1e3), (a.target = 0));
        return;
      }
      if (s.Level > t.level + 2 || !s.CanTame) return;
      const r = Object.values(e.maps)
        .flatMap((u) => u.actors)
        .filter((u) => u.friendly && u.master === t.id && !u.dead &&
          (u.special?.tameUntil || u.special?.dreamTamed));
      if (
        s.IsBoss &&
        r.filter((u) => e.monsters.get(u.definition)?.IsBoss).length >=
          e.rules.constants.MaxBossTames
      )
        return;
      if (e.rng.next(t.level + 20 + n * 5) <= s.Level + 10) {
        e.rng.next(5) > 0 && (e.buff(a, "TameRage", (e.rng.next(20) + 10) * 1e3), (a.target = 0));
        return;
      }
      if (r.length >= n + 2) return;
      const c = Math.trunc((a.stats.HP || 0) / 100),
        l = c <= 2 ? 2 : c * 2;
      if (e.rng.next(l) !== 0) return;
      (a.spawn !== void 0 &&
        ((e.map(a.map).respawns[a.spawn] =
          e.time + e.region(a.map).spawns[a.spawn].respawnMinutes * 6e4),
        (a.spawn = void 0)),
        (a.friendly = !0),
        (a.master = t.id),
        (a.target = 0),
        (a.buffs = []),
        (a.special ??= {}),
        (a.special.petLevel = 0),
        (a.special.maxPetLevel = 1 + n * 2),
        (a.special.tameUntil = e.time + 36e5),
        e.refreshActor(a),
        e.say(
          message("core.magic.completeMagic.76b2142e79", {
            p0: entityText("monsters", a.definition),
          }),
        ));
      break;
    }
    case "FireWall":
    case "Blizzard":
    case "MeteorStrike":
    case "PoisonCloud":
    case "HealingCircle":
      xi(e, t, i);
      break;
    case "TrapHexagon":
      for (const o of e
        .map(t.map)
        .actors.filter(
          (r) =>
            r.kind === "monster" &&
            !r.dead &&
            !r.friendly &&
            P(r, i.location) <= 1 &&
            e.monsters.get(r.definition).Level <= t.level + 2,
        ))
        (e.buff(o, "Trap", i.damage), (o.target = 0));
      break;
    case "Curse":
      for (const o of e
        .map(t.map)
        .actors.filter(
          (r) => r.kind === "monster" && !r.dead && !r.friendly && P(r, i.location) <= 3,
        ))
        if (e.rng.next(10) < 4) {
          e.buff(o, "Slow", i.damage * 1e3);
          const r = 1 + (n + 1) * 2;
          e.buff(o, "Curse", i.damage * 1e3, 0, {
            MaxDCRatePercent: -r,
            MaxMCRatePercent: -r,
            MaxSCRatePercent: -r,
          });
        }
      break;
    case "Plague":
      for (const o of e
        .map(t.map)
        .actors.filter(
          (r) => r.kind === "monster" && !r.dead && !r.friendly && P(r, i.location) <= 1,
        )) {
        const r = e.rng.next(15),
          c = r < 3 ? "Slow" : r < 5 ? "Frozen" : r < 10 ? i.effect?.type : void 0;
        if (c) {
          const l = c === "Red" ? Math.trunc(i.damage / 15) + n + 1 : i.damage + (n + 1) * 2;
          e.buff(o, c, ((n + 1) * 2 + Math.trunc(i.damage / 10)) * 1e3, l);
        }
        e.damage(t, o, (t.stats.MaxSC || 0) * 2, "MAC", i.spell);
      }
      break;
    case "Hallucination":
      if (!s || a.friendly || P(t, a) > 7 || e.rng.next(t.level + 20 + n * 5) <= s.Level + 10)
        return;
      (e.buff(a, "Hallucination", (e.rng.next(20) + 10) * 1e3), (a.target = 0));
      break;
    case "FrostCrunch":
      if (!s || t.level + 10 < s.Level) return;
      (e.rng.next(20) <= n && e.buff(a, "Slow", (5 + e.rng.next(5)) * 1e3),
        e.rng.next(40) <= n && e.buff(a, "Frozen", (5 + e.rng.next(t.stats.Freezing || 0)) * 1e3));
      break;
    case "LionRoar":
      for (const o of e
        .map(t.map)
        .actors.filter(
          (r) =>
            r.kind === "monster" &&
            !r.dead &&
            !r.friendly &&
            P(r, i.location) <= 2 &&
            e.monsters.get(r.definition).Level <= t.level + 3,
        ))
        e.buff(o, "LRParalysis", (n + 2) * 1e3);
      break;
    case "Entrapment": {
      if (!s || a.friendly || P(t, a) > 7 || s.Level >= t.level + 5 + e.rng.next(8)) return;
      const o = (t.dir + 4) % 8,
        r = Math.abs(t.x - a.x),
        c = Math.abs(t.y - a.y),
        l = o % 2 ? Math.min(r, c) : Math.max(0, o === 0 || o === 4 ? c - 2 : r - 2);
      if (
        e.rng.next(30) >= (n + 1) * 3 + t.level - s.Level + 9 ||
        (e.buff(a, "Paralysis", Se((n + 1) * 0.8) * 1e3), !Zt(e, t, a, o, l))
      )
        return;
      break;
    }
    case "Revelation":
      if (e.rng.next(4) > n || a.buffs.some((o) => o.type === "Revelation")) return;
      e.buff(a, "Revelation", i.damage * 1e3);
      break;
  }
  if (i.trainSpell && i.trainSpell !== "ElectricShock") {
    const o = e.skill(t, i.trainSpell)?.s;
    o && e.levelSkill(t, o);
  }
}


function wt(e, t, a) {
  if (mountedItem(e, t)) throw new b(message("core.magic.castMagic.5c12d1da76"));
  const i = String(a.Spell),
    n = e.skill(t, i);
  if (!n) throw new b(message("core.magic.castMagic.446bba28f3"));
  if (i === "Hydra") {
    yi(e, t, a);
    return;
  }
  if (n.d.DreamSkill) {
    zs(e, t, n.d, a);
    return;
  }
  if (e.rules.adaptations.disabledSpells[i]) throw Error(e.rules.adaptations.disabledSpells[i]);
  if (!Us.has(i)) throw new b(message("core.magic.castMagic.fe001409a7"));
  if (["Fencing", "SpiritSword", "Slaying"].includes(i)) {
    e.say(message("core.magic.castMagic.eaa7e33280"));
    return;
  }
  const { d: s, s: o } = n,
    r = o.Level;
  if (e.time < Math.max(t.spellAt, t.actionAt, o.CastTime)) return;
  let c = s.BaseCost + r * s.LevelCost;
  if (
    (["Teleport", "Blink"].includes(i) &&
      t.stats.TeleportManaPenaltyPercent > 0 &&
      (c += Math.trunc((c * t.stats.TeleportManaPenaltyPercent) / 100)),
    t.stats.ManaPenaltyPercent > 0 && (c += Math.trunc((c * t.stats.ManaPenaltyPercent) / 100)),
    i === "Plague" && (c = (t.stats.MaxSC || 0) + (t.stats.MinSC || 0)),
    t.mp < c)
  )
    throw new b(message("core.magic.castMagic.26f1ab23c0"));
  let l = i === "Poisoning" ? t : e.actor(Number(a.TargetID));
  const u = {
    x: Number(a.Location?.X ?? t.x),
    y: Number(a.Location?.Y ?? t.y),
  };
  if (s.Range && P(t, l ?? u) > s.Range) throw new b(message("core.magic.castMagic.8ec455055d"));
  const h = () => e.map(t.map).actors.filter((m) => m.kind === "monster" && !m.dead && !m.friendly),
    p = () => {
      if (!l || l.dead || l.map !== t.map || l.friendly || l.kind !== "monster")
        throw new b(message("core.magic.castMagic.ac7b618ae7"));
      return l;
    },
    g = (m, M) => {
      const k = [...t.equipment, ...t.inventory].find(
        (w) =>
          w &&
          e.defs.get(w.id)?.Type === "Amulet" &&
          e.defs.get(w.id)?.DreamType !== 17 &&
          e.defs.get(w.id)?.Shape === m &&
          w.count >= M,
      );
      if (!k)
        throw new b(
          message(m === 0 ? "core.magic.castMagic.e588610336" : "core.magic.castMagic.63a4d58a68"),
        );
      return () => {
        k.count -= M;
        for (const w of [t.equipment, t.inventory])
          for (let D = 0; D < w.length; D++) w[D] === k && !k.count && (w[D] = null);
      };
    };
  let y;
  const f = (m) => magicDamage(s, r, z(t.stats, m, e.rng), e.rng);
  switch (i) {
    case "Mirroring":
      y = () => {
        (e.map(t.map).actors.some((m) => m.ai === 55 && m.master === t.id && !m.dead) ||
          e.levelSkill(t, o),
          e.schedule("magic", 500, t, t, 0, "None", i));
      };
      break;
    case "ElectricShock": {
      const m = p();
      y = () => {
        const M = e.schedule("magic", 500, t, m, 0, "None", i);
        M.level = r;
      };
      break;
    }
    case "CounterAttack":
      Yt(e, t, i, !0);
      return;
    case "ShoulderDash":
      y = () => {
        const m = F.indexOf(a.Direction) >= 0 ? F.indexOf(a.Direction) : t.dir,
          [M, k] = U[m],
          w = e.rng.next(2) + r + 2;
        let D,
          E = 0;
        for (let W = 0; W < w; W++) {
          const j = {
            ...t,
            x: t.x + M,
            y: t.y + k,
          };
          if (
            e.safe(j) ||
            (W === 0 &&
              (D = h().find(
                (A) => A.x === j.x && A.y === j.y && e.monsters.get(A.definition).Level < t.level,
              )),
            D && !Zt(e, t, D, m, 1)) ||
            !e.walkable(t.map, j.x, j.y, t.id)
          )
            break;
          ((t.x = j.x),
            (t.y = j.y),
            (t.dir = m),
            E++,
            e.emit("ObjectDash", {
              ObjectID: t.id,
              Direction: F[m],
              Location: {
                X: t.x,
                Y: t.y,
              },
            }));
        }
        (E && e.levelSkill(t, o),
          E && D && e.damage(t, D, magicDamage(s, r, 0, e.rng), "None", i),
          E || e.say(message("core.magic.castMagic.4033afec75")));
      };
      break;
    case "Blizzard":
    case "MeteorStrike":
    case "PoisonCloud":
    case "HealingCircle": {
      const m = l ?? u,
        M = i === "PoisonCloud" ? g(0, 5) : () => {},
        k = i === "PoisonCloud" ? g(1, 5) : () => {};
      y = () => {
        (M(), k());
        const w = e.schedule(
          "magic",
          i === "HealingCircle" ? 1700 : i === "PoisonCloud" ? 500 + P(t, m) * 50 : 500,
          t,
          t,
          f(["PoisonCloud", "HealingCircle"].includes(i) ? "SC" : "MC"),
          "None",
          i,
        );
        ((w.location = {
          x: m.x,
          y: m.y,
        }),
          (w.level = r),
          i === "PoisonCloud" &&
            (w.effect = {
              type: "Green",
              duration: 12e3,
              value: e.rng.next(t.stats.PoisonAttack || 0),
              stats: {},
            }),
          ["Blizzard", "MeteorStrike"].includes(i) && (t.attackModes.channel = !0));
      };
      break;
    }
    case "Curse":
    case "Plague":
    case "TrapHexagon": {
      const m = l ?? u,
        M = g(0, 1);
      if (
        i === "TrapHexagon" &&
        !h().some((D) => P(D, m) <= 1 && e.monsters.get(D.definition).Level <= t.level + 2)
      )
        throw new b(message("core.magic.castMagic.ea367d54b7"));
      const k =
          i === "Plague"
            ? [...t.equipment, ...t.inventory].find(
                (D) =>
                  D &&
                  e.defs.get(D.id)?.Type === "Amulet" &&
                  e.defs.get(D.id)?.DreamType !== 17 &&
                  [1, 2].includes(e.defs.get(D.id).Shape),
              )
            : void 0,
        w = k ? g(e.defs.get(k.id).Shape, 1) : () => {};
      y = () => {
        if ((M(), w(), i === "Curse" && e.rng.next(10 - (r + 1) * 2) > 2)) return;
        const D = e.schedule(
          "magic",
          i === "TrapHexagon" ? 500 : 500 + P(t, m) * 50,
          t,
          t,
          i === "TrapHexagon" ? (r * 5 + 10) * 1e3 : f("SC"),
          "None",
          i,
        );
        ((D.location = {
          x: m.x,
          y: m.y,
        }),
          (D.level = r),
          k &&
            (D.effect = {
              type: e.defs.get(k.id).Shape === 1 ? "Green" : "Red",
              duration: 0,
              value: 0,
              stats: {},
            }));
      };
      break;
    }
    case "Hallucination": {
      const m = p(),
        M = g(0, 1);
      y = () => {
        M();
        const k = e.schedule("magic", 500 + P(t, m) * 50, t, m, 0, "None", i);
        k.level = r;
      };
      break;
    }
    case "FireBall":
    case "GreatFireBall":
    case "ThunderBolt":
    case "SoulFireBall": {
      const m = p();
      y = () => {
        let M = f(i === "SoulFireBall" ? "SC" : "MC") * (i === "SoulFireBall" && r >= 4 ? 2 : 1);
        i === "ThunderBolt" && e.monsters.get(m.definition)?.Undead && (M = Math.trunc(M * 1.5));
        const k = e.schedule(
          "hit",
          i === "ThunderBolt" ? 500 : P(t, m) * 50 + 500,
          t,
          m,
          M,
          "MAC",
          i,
        );
        k.location = {
          x: m.x,
          y: m.y,
        };
      };
      break;
    }
    case "FlameDisruptor":
    case "FrostCrunch":
    case "Vampirism": {
      const m = p();
      y = () => {
        let M = f("MC");
        i === "FlameDisruptor" &&
          !e.monsters.get(m.definition)?.Undead &&
          (M = Math.trunc(M * 1.5));
        const k = e.schedule(
          "hit",
          i === "FrostCrunch" ? 500 + P(t, m) * 50 : 500,
          t,
          m,
          M,
          "MAC",
          i,
        );
        ((k.level = r),
          i !== "Vampirism" &&
            (k.location = {
              x: m.x,
              y: m.y,
            }));
      };
      break;
    }
    case "TurnUndead": {
      const m = p(),
        M = e.monsters.get(m.definition);
      if (!M.Undead) throw new b(message("core.magic.castMagic.4c5437b4ae"));
      y = () => {
        e.rng.next(2) + t.level - 1 <= M.Level ||
        e.rng.next(100) >= ((r + 1) << 3) + t.level - M.Level + 15
          ? (m.target = t.id)
          : e.schedule("kill", 500, t, m, 0, "None", i);
      };
      break;
    }
    case "Fury":
      y = () =>
        e.deferBuff(t, t, i, 6e4 + r * 1e4, 0, {
          AttackSpeed: 4,
        });
      break;
    case "Repulsion":
    case "EnergyRepulsor":
      y = () => {
        let m = !1;
        for (const M of h().filter((k) => P(k, t) <= 1)) {
          const k = e.monsters.get(M.definition).Level;
          k >= t.level ||
            e.rng.next(20) >= 6 + r * 3 + t.level - k ||
            (m = Zt(e, t, M, direction(t, M), 1 + Math.max(0, r - 1) + e.rng.next(2)) > 0 || m);
        }
        m && e.levelSkill(t, o);
      };
      break;
    case "LionRoar":
      y = () => {
        const m = e.schedule("magic", 500, t, t, 0, "None", i);
        ((m.level = r),
          (m.location = {
            x: t.x,
            y: t.y,
          }));
      };
      break;
    case "Entrapment": {
      const m = p();
      y = () => {
        const M = e.schedule("magic", 500, t, m, 0, "None", i);
        M.level = r;
      };
      break;
    }
    case "Revelation": {
      if (!l || l.dead || !["monster", "player"].includes(l.kind))
        throw new b(message("core.magic.castMagic.3337a45d3e"));
      const m = l;
      y = () => {
        const M = e.schedule(
          "magic",
          500,
          t,
          m,
          z(t.stats, "SC", e.rng) + magicPower(s, r, e.rng),
          "None",
          i,
        );
        M.level = r;
      };
      break;
    }
    case "PetEnhancer": {
      if (!l || l.dead || !l.friendly || l.kind !== "monster")
        throw new b(message("core.magic.castMagic.b8a1fd496b"));
      const m = l,
        M = e.monsters.get(m.definition).Level;
      y = () =>
        e.deferBuff(t, m, i, (z(t.stats, "SC", e.rng) + magicPower(s, r, e.rng)) * 1e3, 0, {
          MinDC: 2 + M * 2,
          MaxDC: 2 + M * 2,
          MinAC: 4 + M,
          MaxAC: 4 + M,
        });
      break;
    }
    case "UltimateEnhancer": {
      const m = l && !l.dead && (l.friendly || l.id === t.id) ? l : t,
        M = g(0, 1);
      y = () => {
        M();
        const k =
          m.kind !== "player" || m.job === "Warrior"
            ? "MaxDC"
            : m.job === "Wizard"
              ? "MaxMC"
              : "MaxSC";
        e.buff(m, i, (z(t.stats, "SC", e.rng) * 4 + (r + 1) * 50) * 1e3, 0, {
          [k]: (t.stats.MaxSC || 0) >= 5 ? Math.min(8, Math.trunc(t.stats.MaxSC / 5)) : 1,
        });
      };
      break;
    }
    case "EnergyShield":
      y = () => {
        const m = Math.max(2, 10 - (Math.trunc((t.stats.Luck || 0) / 3) + r + 1)),
          M = Se((z(t.stats, "SC", e.rng) / 4) * (r + 1) + s.PowerBase);
        e.buff(t, i, (30 + 50 * r) * 1e3, 0, {
          EnergyShieldPercent: Se(100 / m),
          EnergyShieldHPGain: M,
        });
      };
      break;
    case "BladeAvalanche":
      y = () => {
        let m = z(t.stats, "DC", e.rng);
        e.rng.next(100) <= 1 + (t.stats.Luck || 0) && (m *= 2);
        const M = magicDamage(s, r, m, e.rng),
          k = F.indexOf(a.Direction) >= 0 ? F.indexOf(a.Direction) : t.dir;
        for (const w of [-1, 0, 1]) {
          const D = U[(k + w + 8) % 8],
            E = U[k];
          for (let W = 0; W < 3; W++)
            for (const j of h().filter(
              (A) => A.x === t.x + D[0] + E[0] * W && A.y === t.y + D[1] + E[1] * W,
            ))
              e.damage(t, j, W <= 1 ? M : Math.trunc(M * 0.6), "MAC", i);
        }
      };
      break;
    case "Healing": {
      const m = l && !l.dead && (l.id === t.id || l.friendly) ? l : t;
      ((l = m),
        (y = () =>
          e.schedule(
            "heal",
            500,
            t,
            m,
            magicDamage(s, r, z(t.stats, "SC", e.rng) * 2, e.rng) + t.level,
            "None",
            i,
          )));
      break;
    }
    case "MagicShield":
      y = () => {
        if (t.buffs.some((M) => M.type === "MagicShield")) return;
        const m = Se(
          ((z(t.stats, "MC", e.rng) + 15) / 4) * (r + 1) +
            (s.PowerBonus > 0 ? e.rng.next(s.PowerBase + s.PowerBonus, s.PowerBase) : s.PowerBase),
        );
        e.deferBuff(t, t, i, m * 1e3, r);
      };
      break;
    case "ProtectionField":
      y = () => {
        const m = Se((t.stats.MaxAC || 0) * (0.2 + 0.03 * r));
        e.buff(t, i, (45 + 15 * r) * 1e3, 0, {
          MinAC: m,
          MaxAC: m,
        });
      };
      break;
    case "Rage":
      y = () => {
        const m = Se((t.stats.MaxDC || 0) * (0.12 + 0.03 * r));
        e.buff(t, i, (18 + 6 * r) * 1e3, 0, {
          MinDC: m,
          MaxDC: m,
        });
      };
      break;
    case "MagicBooster":
      y = () =>
        e.deferBuff(t, t, i, 6e4, 0, {
          MinMC: 6 + r * 6,
          MaxMC: 6 + r * 6,
          ManaPenaltyPercent: 6 + r,
        });
      break;
    case "Purification": {
      const m = l && (l.id === t.id || l.friendly) ? l : t;
      y = () => {
        const M = e.schedule("magic", 500, t, m, 0, "None", i);
        M.level = r;
      };
      break;
    }
    case "Hiding": {
      const m = g(0, 1);
      y = () => {
        (m(), e.deferBuff(t, t, "Hiding", (z(t.stats, "SC", e.rng) + (r + 1) * 5) * 1e3));
      };
      break;
    }
    case "Poisoning": {
      const targets = h().filter((m) => targetableMonster(m) && P(t, m) <= (s.Range || 7)),
        M = [...t.equipment, ...t.inventory].find(
          (w) =>
            w &&
            e.defs.get(w.id)?.Type === "Amulet" &&
            e.defs.get(w.id)?.DreamType !== 17 &&
            [1, 2].includes(e.defs.get(w.id).Shape),
        ),
        k = M ? e.defs.get(M.id).Shape : 1;
      y = () => {
        const w = f("SC");
        for (const m of targets) e.deferBuff(
          t,
          m,
          k === 1 ? "Green" : "Red",
          (w * 2 + (r + 1) * 7) * 2e3,
          Math.trunc(w / 15) + r + 1 + e.rng.next(t.stats.PoisonAttack || 0),
          {},
          500,
          2e3,
          i,
        );
      };
      break;
    }
    case "SummonSkeleton":
    case "SummonShinsu":
    case "SummonHolyDeva": {
      const m =
          e.rules.monsterSettings[
            i === "SummonSkeleton"
              ? "SkeletonName"
              : i === "SummonShinsu"
                ? "ShinsuName"
                : "AngelName"
          ],
        M = Object.values(e.maps)
          .flatMap((w) => w.actors)
          .find((w) => w.master === t.id && w.name === m && !w.dead),
        k = M ? () => {} : g(0, i === "SummonSkeleton" ? 1 : i === "SummonShinsu" ? 5 : 2);
      y = () => {
        (M || e.levelSkill(t, o), k());
        const w = e.schedule(
          "magic",
          !M && i === "SummonHolyDeva" ? 1500 : 500,
          t,
          t,
          0,
          "None",
          i,
        );
        w.level = r;
      };
      break;
    }
    case "FireBang":
    case "IceStorm": {
      const m = l ?? u;
      y = () => {
        const M = f("MC");
        for (const k of h().filter((w) => P(w, m) <= 1)) e.schedule("hit", 500, t, k, M, "MAC", i);
      };
      break;
    }
    case "HellFire":
    case "Lightning": {
      y = () => {
        const m = f("MC"),
          M = i === "HellFire" ? 4 : 8,
          k = Number.isInteger(F.indexOf(a.Direction)) ? F.indexOf(a.Direction) : t.dir;
        for (const w of h()) {
          const D = (direction(t, w) - k + 8) % 8;
          P(t, w) <= M &&
            (D === 0 || (i === "HellFire" && r === 3 && [1, 7].includes(D))) &&
            e.schedule("hit", 500, t, w, m, "MAC", i);
        }
      };
      break;
    }
    case "ThunderStorm":
    case "FlameField": {
      y = () => {
        const m = f("MC");
        for (const M of h().filter((k) => P(k, t) <= 2))
          e.schedule(
            "hit",
            500,
            t,
            M,
            i === "ThunderStorm" && !e.monsters.get(M.definition)?.Undead ? Math.trunc(m / 10) : m,
            "MAC",
            i,
          );
      };
      break;
    }
    case "SoulShield":
    case "BlessedArmour": {
      const m = g(0, 1),
        M = l ?? u;
      y = () => {
        m();
        const k = z(t.stats, "SC", e.rng) * 4 + (r + 1) * 50;
        for (const w of [t, ...e.map(t.map).actors.filter((D) => D.friendly && !D.dead)].filter(
          (D) => P(D, M) <= 3,
        )) {
          const D = w.kind === "player" ? w.level : e.monsters.get(w.definition).Level;
          e.deferBuff(
            t,
            w,
            i,
            k * 1e3,
            0,
            {
              [i === "SoulShield" ? "MaxMAC" : "MaxAC"]: Math.trunc(D / 7) + 4,
            },
            P(t, M) * 50 + 500,
          );
        }
      };
      break;
    }
    case "MassHealing": {
      const m = l ?? u;
      y = () => {
        const M = f("SC");
        for (const k of [t, ...e.map(t.map).actors.filter((w) => w.friendly && !w.dead)].filter(
          (w) => P(w, m) <= 1,
        ))
          e.schedule("heal", 500, t, k, M, "None", i);
      };
      break;
    }
    case "MassHiding": {
      g(0, 1);
      const m = l ?? u;
      y = () => {
        const M = Math.trunc(z(t.stats, "SC", e.rng) / 2) + (r + 1) * 2;
        for (const k of [t, ...e.map(t.map).actors.filter((w) => w.friendly && !w.dead)].filter(
          (w) => P(w, m) <= 1,
        ))
          e.deferBuff(t, k, "Hiding", M * 1e3, 0, {}, P(t, m) * 50 + 500);
      };
      break;
    }
    case "Blink":
      if (!e.walkable(t.map, u.x, u.y, t.id))
        throw new b(message("core.magic.castMagic.758eaa2d29"));
      y = () => {
        const m = e.schedule("magic", 200, t, t, 0, "None", i);
        ((m.level = r),
          (m.location = {
            ...u,
          }));
      };
      break;
    case "Teleport":
      if (!e.geometry.has(e.rules.world.maps.find((m) => m.start).id))
        throw new b(message("core.magic.castMagic.be0f3f005d"));
      y = () => {
        const m = e.schedule("magic", 200, t, t, 0, "None", i);
        m.level = r;
      };
      break;
    case "FireWall": {
      const m = l ?? u;
      y = () => {
        const M = e.schedule("magic", 500, t, t, f("MC"), "None", i);
        ((M.level = r),
          (M.location = {
            x: m.x,
            y: m.y,
          }));
      };
      break;
    }
    default:
      throw new b(message("core.magic.castMagic.26a8666f16"));
  }
  const v = e.nextOrder;
  if ((y(), ni.has(i))) for (const m of e.events.filter((M) => M.order >= v)) m.trainSpell = i;
  ((t.mp -= c),
    (t.actionAt = e.time + 600),
    (t.attackAt = e.time + 600),
    (t.spellAt = e.time + (i === "FlameField" ? 2500 : 1800)),
    (t.regenAt = e.time + 1e4),
    (o.CastTime = e.time + s.DelayBase - r * s.DelayReduction));
  const x = F.indexOf(a.Direction);
  (x >= 0 && (t.dir = x),
    !ni.has(i) &&
      ![
        "Repulsion",
        "EnergyRepulsor",
        "ShoulderDash",
        "SummonSkeleton",
        "SummonShinsu",
        "SummonHolyDeva",
        "Mirroring",
      ].includes(i) &&
      e.levelSkill(t, o),
    e.emit("Magic", {
      ObjectID: t.id,
      Spell: i,
      Cast: !0,
      Direction: F[t.dir],
      Target: l ?? u,
      TargetID: l?.id || 0,
    }));
}


var oi = ["FlameDisruptor", "ThunderBolt", "GreatFireBall", "FireBall"];
function ri(e) {
  const t = (a, i) =>
    typeof a == "number" && Number.isFinite(a) ? Math.max(1, Math.min(99, Math.round(a))) : i;
  return {
    hpEnabled: e?.hpEnabled === !0,
    hpPercent: t(e?.hpPercent, 70),
    mpEnabled: e?.mpEnabled === !0,
    mpPercent: t(e?.mpPercent, 30),
    flamingSword: e?.flamingSword === !0,
    blazingSword: e?.blazingSword === !0,
    autoMagic: e?.autoMagic === !0,
    autoShield: e?.autoShield === !0,
    autoMagicSpell: oi.includes(e?.autoMagicSpell || "") ? e.autoMagicSpell : "auto",
  };
}
var ci = new WeakMap(),
  Le = new WeakMap();
function clearManualCast(e) {
  Le.delete(e);
}
function Js(e, t, a) {
  Le.delete(t);
  const i =
    a.Queue === !0 &&
    t.job === "Wizard" &&
    (t.assist?.autoMagic || t.assist?.autoShield) &&
    e.skill(t, String(a.Spell));
  if (
    (i &&
      !i.d.DreamSkill?.passive &&
      e.time >= i.s.CastTime &&
      i.d.Spell !== "MagicShield" &&
      li(e, t, Number(a.TargetID) || 0),
    i &&
      !i.d.DreamSkill?.passive &&
      e.time >= i.s.CastTime &&
      e.time < Math.max(t.spellAt, t.actionAt))
  ) {
    Le.set(t, {
      map: t.map,
      x: t.x,
      y: t.y,
      expires: e.time + 3e3,
      data: {
        ...a,
        Queue: !1,
      },
    });
    return;
  }
  wt(e, t, {
    ...a,
    Queue: !1,
  });
}
function _s(e, t) {
  const a = Le.get(t);
  if (!a) return !1;
  if (
    t.dead ||
    t.map !== a.map ||
    t.x !== a.x ||
    t.y !== a.y ||
    mountedItem(e, t) ||
    e.time > a.expires
  )
    return (Le.delete(t), !1);
  if (e.time < Math.max(t.spellAt, t.actionAt)) return !0;
  Le.delete(t);
  const i = Number(a.data.TargetID) || 0,
    n = i ? e.actor(i) : void 0;
  if (i && (!n || n.dead || n.map !== t.map) && !a.data.AutoPlace) return !1;
  try {
    wt(e, t, a.data);
  } catch (s) {
    e.say(mt(s));
  }
  return !0;
}
var ea = [
  ["blazingSword", "BlazingSword"],
  ["flamingSword", "FlamingSword"],
];
function Ys(e, t, a) {
  const i = e.skill(t, a);
  if (!autoBattleBound(i) || e.time < i.s.CastTime) return !1;
  const n = i.d.DreamSkill ? le(i.d, i.level, t.stats) : i.d.BaseCost + i.s.Level * i.d.LevelCost;
  return t.mp < n ? !1 : (Yt(e, t, a, !0), !0);
}
function Zs(e, t, a) {
  if (t.job !== "Warrior" || e.safe(t) || t.assist?.autoBattle?.enabled || ea.some(([, i]) => i === a)) return a;
  for (const [i, n] of ea) if (t.attackModes[i] && autoBattleBound(e.skill(t, n))) return n;
  for (const [i, n] of ea) if (t.assist?.[i] && Ys(e, t, n) && t.attackModes[i]) return n;
  return a;
}
function li(e, t, a = 0) {
  if (
    t.job !== "Wizard" ||
    !t.assist?.autoShield ||
    t.dead ||
    mountedItem(e, t) ||
    e.safe(t) ||
    e.time < Math.max(t.spellAt, t.actionAt) ||
    t.buffs.some((o) => o.type === "MagicShield" && o.until > e.time)
  )
    return !1;
  const i = e.skill(t, "MagicShield");
  if (!autoBattleBound(i) || e.time < i.s.CastTime || t.mp < le(i.d, i.level, t.stats)) return !1;
  const n = e.time < Number(t.special?.assistMoveUntil || 0);
  return e
    .map(t.map)
    .actors.some((o) =>
      o.kind !== "monster" || o.dead || o.friendly || !targetableMonster(o) || P(t, o) > 6
        ? !1
        : o.target === t.id
          ? !0
          : (!n || o.id === a || o.id === t.target) && We(e, t.map, t, o),
    )
    ? (wt(e, t, {
        Spell: "MagicShield",
        TargetID: t.id,
        Location: {
          X: t.x,
          Y: t.y,
        },
        Direction: F[t.dir],
      }),
      !0)
    : !1;
}
function eo(e, t) {
  if (li(e, t) || _s(e, t) || bo(e, t) || t.dead || !t.assist) return;
  const a = ri(t.assist);
  let i = ci.get(t);
  (i ||
    ((i = {
      hp: 0,
      mp: 0,
    }),
    ci.set(t, i)),
    migrateItemHotkeys(t, e.defs));
  for (const [n, s, o, r, c, l, u] of [
    ["hp", 0, a.hpEnabled, a.hpPercent, t.maxHP, t.potHP, "HP"],
    ["mp", 1, a.mpEnabled, a.mpPercent, t.maxMP, t.potMP, "MP"],
  ]) {
    if (!o || c <= 0 || t[n] * 100 >= c * r || l > 0 || e.time < i[n]) continue;
    const h = t.inventory.find((g) => g?.id === t.itemHotkeys?.[s]);
    if (!h) continue;
    const p = e.defs.get(h.id);
    if (!(p?.Type !== "Potion" || ![0, 1].includes(p.Shape) || !(p.Stats[u] > 0))) {
      i[n] = e.time + 1e3;
      try {
        e.checkUse(t, p);
      } catch {
        continue;
      }
      e.useItem(t, h.uid);
    }
  }
  if (
    !mountedItem(e, t) &&
    t.job === "Wizard" &&
    a.autoMagic &&
    !e.safe(t) &&
    e.time >= Math.max(t.actionAt, t.spellAt, Number(t.special?.assistMoveUntil || 0))
  ) {
    const n = e
      .map(t.map)
      .actors.filter(
        (s) =>
          s.kind === "monster" && !s.dead && !s.friendly && targetableMonster(s) && P(t, s) <= 6,
      );
    if (
      (n.sort(
        (s, o) => +(o.id === t.target) - +(s.id === t.target) || P(t, s) - P(t, o) || s.id - o.id,
      ),
      n.length)
    ) {
      const s = a.autoMagicSpell === "auto" ? oi.find((r) => autoBattleBound(e.skill(t, r))) : a.autoMagicSpell,
        o = s ? e.skill(t, s) : void 0;
      if (autoBattleBound(o) && e.time >= o.s.CastTime && t.mp >= le(o.d, o.level, t.stats)) {
        const r = n.find((c) => P(t, c) <= o.d.Range && canReachDreamSpell(e, t, o.d.Spell, c));
        if (r) {
          wt(e, t, {
            Spell: o.d.Spell,
            TargetID: r.id,
            Location: {
              X: r.x,
              Y: r.y,
            },
            Direction: F[t.dir],
          });
          return;
        }
      }
    }
  }
}
function di(e, t, a, i, n) {
  if (!e.rules.skills.some((m) => m.DreamSkill)) return !1;
  a && (i = Zs(e, t, i));
  let s = e.skill(t, i);
  if (i !== "None" && !s?.d.DreamSkill) return !1;
  const o = pt(t.level, t.stats, !0);
  ((t.dir = direction(t, n || a)),
    (t.attackAt = e.time + o),
    (t.actionAt = e.time + Math.min(550, o)),
    (t.regenAt = e.time + 1e4));
  const r = L(e, t, "DC"),
    c = e
      .map(t.map)
      .actors.filter(
        (m) =>
          m.kind === "monster" &&
          !m.friendly &&
          !m.dead &&
          m.special?.visible !== !1 &&
          !m.special?.stoned,
      ),
    l = i[0].toLowerCase() + i.slice(1);
  (i === "Slaying" ||
    (["FlamingSword", "BlazingSword", "HalfMoon", "WhirlwindSlash", "Thrusting"].includes(i) &&
      !t.attackModes[l])) &&
    (i = "None");
  const u = (m, M, k = "AC", w = i) =>
    m ? e.schedule("hit", 350, t, m, Math.trunc(M), k, w) : void 0;
  let h = !1,
    p = i;
  if (s && ["HalfMoon", "WhirlwindSlash"].includes(i)) {
    const m = le(s.d, s.level, t.stats);
    t.mp < m ? (i = "None") : (t.mp -= m);
  }
  if (s && ["FlamingSword", "BlazingSword"].includes(i)) {
    const m = Math.trunc(Math.fround(r * Math.fround(dreamCoefficient(s.d, s.level))));
    if ((u(a, m), (t.attackModes[l] = !1), (h = !0), i === "BlazingSword"))
      for (const M of c) {
        const k = P(t, M);
        M !== a &&
          direction(t, M) === t.dir &&
          k >= 2 &&
          k <= 5 &&
          u(M, Math.trunc(Math.fround(m * Math.fround(1 - (k - 1) * 0.1))));
      }
  } else if (s && ["HalfMoon", "WhirlwindSlash"].includes(i)) {
    for (const m of c) {
      const M = (direction(t, m) - t.dir + 8) % 8;
      if (P(t, m) !== 1 || (i === "HalfMoon" && ![7, 0, 1, 2, 3].includes(M))) continue;
      const k = u(
        m,
        m === a ? r : Math.trunc(Math.fround(r * Math.fround(dreamCoefficient(s.d, s.level)))),
        m === a ? "AC" : "ACNoArmor",
      );
      k &&
        i === "WhirlwindSlash" &&
        m !== a &&
        e.monsters.get(m.definition).Level <= t.level &&
        e.rng.next(100) < Math.min(100, s.level * 2) &&
        (k.effect = {
          type: "NativeWhirlwindStun",
          duration: 1800 + e.rng.next(Math.max(1, s.level * 100)),
          value: 0,
          stats: {},
        });
    }
    h = !0;
  }
  const g = e.skill(t, "Slaying"),
    y = e.skill(t, "SkyCleaver"),
    f = g ? 20 : 0,
    v = y ? Math.min(20, 6 + 2 * y.level) : 0,
    x = f + v > 0 ? e.rng.next(100) : 100;
  if (g && x < f)
    (u(a, Math.trunc(((t.stats.MaxDC || 0) * (14 + g.level)) / 10), "AC", "Slaying"),
      ["FlamingSword", "BlazingSword"].includes(i) || (p = "Slaying"),
      (h = !0));
  else if (y && x < f + v) {
    const m = Math.trunc(Math.fround(L(e, t, "DC") * Math.fround(dreamCoefficient(y.d, y.level))));
    for (const M of c) {
      const k = P(t, M);
      direction(t, M) === t.dir &&
        k >= 1 &&
        k <= 3 &&
        u(M, Math.trunc(Math.fround(m * Math.fround(1 - (k - 1) * 0.1))), "AC", "SkyCleaver");
    }
    (["FlamingSword", "BlazingSword"].includes(i) || (p = "SkyCleaver"), (h = !0));
  }
  if (!h && (u(a, r, "AC", "None"), s && i === "Thrusting")) {
    const m = le(s.d, s.level, t.stats);
    if (t.mp >= m) {
      t.mp -= m;
      const [M, k] = U[t.dir];
      for (const w of c)
        w.x === t.x + M * 2 &&
          w.y === t.y + k * 2 &&
          u(
            w,
            Math.trunc(Math.fround(r * Math.fround(dreamCoefficient(s.d, s.level)))),
            "ACNoArmor",
            "Thrusting",
          );
    }
  }
  return (
    (t.attackModes.slaying = !1),
    e.emit("ObjectAttack", {
      ObjectID: t.id,
      Direction: F[t.dir],
      Spell: p,
    }),
    !0
  );
}
function moonSpiritAttackPower(e, t, a) {
  if (!t.special?.dreamPet || e.monsters.get(t.definition)?.DreamOriginalId !== 144) return a;
  const i = e.roles.find((r) => r.id === t.master),
    n = i && e.skill(i, "SummonMoonSpirit");
  if (!i || !n) return a;
  const s = n.level * 5;
  if (i.mp <= s) return 0;
  i.mp -= s;
  const o = Math.trunc(L(e, i, "SC") / 2);
  return (
    a +
    Math.max(
      Math.trunc(o * (0.6 + 0.3 * n.level)),
      Math.trunc(o * 2 * (petInheritance(e, t)?.attack || 0) + 1e-9),
    )
  );
}
function ao(e, t, a, i, n) {
  if (t.special?.dreamPet && t.master) {
    const c = e.roles.find((u) => u.id === t.master),
      l = e.monsters.get(t.definition)?.DreamOriginalId;
    if (c && !t.special?.dreamTamed && l !== 144) {
      const u = petInheritance(e, t);
      if (u) {
        const h = l === 99 ? 27 : [14, 62].includes(Number(l) || 0) ? 24 : 0,
          p = h ? Math.max(0, c.stats["NativeState:" + h] || 0) * 0.0625 : 0,
          g = L(e, c, "SC"),
          y = l === 99 ? Math.trunc(Math.fround(g / 1.2)) : g;
        return i + Math.trunc(g * u.attack + y * p + 1e-9);
      }
      if (l === 99 || l === 62) {
        const h = e.skill(c, l === 99 ? "SummonTiger" : "AdvancedSummon");
        if (h) {
          const p = h.s.Level,
            g = L(e, c, "SC"),
            y = l === 99 ? Math.trunc(Math.fround(Math.fround(g) / Math.fround(1.2))) : g,
            f = Math.fround(l === 99 ? Math.min(0.5, 0.2 + p / 10) : Math.min(0.9, 0.3 + p / 5)),
            v = Math.max(0, Math.trunc(c.stats["NativeState:" + (l === 99 ? 27 : 24)] || 0)),
            x = Math.fround(f + Math.fround(Math.fround(v) * 0.0625));
          i += Math.trunc(Math.fround(y * x));
        }
      } else if (l === 14 || l === 29) {
        const h = e.skill(c, "SummonShinsu");
        if (h) {
          const p = Math.fround(
              Math.min(l === 14 ? 0.5 : 1, (l === 14 ? 0.2 : 0.3) + h.s.Level / 10),
            ),
            g = l === 14 ? Math.max(0, c.stats["NativeState:24"] || 0) * 0.0625 : 0;
          i += Math.trunc(Math.fround(L(e, c, "SC") * Math.fround(p + g)));
        }
      }
    }
  }
  if (t.kind !== "player") return i;
  const s = t.job === "Wizard" ? "MC" : t.job === "Taoist" ? "SC" : "DC";
  i *= 1 + (t.stats["Native" + s + "DamagePercent"] || 0) / 100;
  const o = {
    FlamingSword: 22,
    IceStorm: 23,
    BlazingSword: 25,
    FlameDisruptor: 26,
  }[n || ""];
  o && (i *= 1 + (t.stats["NativeState:" + o] || 0) / 10);
  const r = e.rules.skills.find((c) => c.Spell === n);
  return (
    r?.DreamSkill &&
      (r.DreamOriginalId >= 29 &&
        r.DreamOriginalId <= 45 &&
        (i *= 1 + (t.stats.DreamMagicDamagePercent || 0) / 100),
      r.DreamSkill.element === 5 && a.buffs.some((c) => c.type === "DreamFrost") && (i *= 1.5),
      r.DreamSkill.element === 2 && (i *= 1 + (t.stats.SpiritDamagePercent || 0) / 100),
      (i *= 1 + (t.stats["SkillDamage:" + r.Spell] || 0) / 100)),
    Math.floor(i)
  );
}


function fi(e, t, a, i) {
  if (i === "None" || t.kind !== "player" || a <= 0) return a;
  const n = t,
    s = n.buffs.find((c) => c.type === "MagicShield");
  if (s && e.skill(n, "MagicShield")?.d.DreamSkill) {
    const c = Math.min(10, e.skill(n, "MagicShield").level),
      l = Math.min(3, c),
      u = Math.fround(0.17),
      h = Math.fround(l * u),
      p = Math.min(Math.fround(h + Math.fround(L(e, n, "MC") / 1024)), Math.fround(h + u)),
      g = Math.trunc(Math.fround(Math.fround(a * p) + 1));
    ((a = Math.max(0, a - g)),
      g > 0 &&
        e.time > s.until - 3e3 &&
        ((n.buffs = n.buffs.filter((y) => y !== s)), e.refreshActor(n)));
  }
  const o = n.buffs.find((c) => c.type === "InnateQi");
  if (o) {
    const c = e.skill(n, "InnateQi")?.level || o.value;
    a = Math.trunc(a * (1 - Math.min(90, Math.max(0, c - 3) * 6) / 100));
  }
  const r = n.buffs.find((c) => c.type === "DiamondBody");
  if (r) {
    const c = e.skill(n, "DiamondBody")?.level || r.value,
      l = Math.min(3, c);
    e.rng.next(5) < c && (a = Math.trunc(Math.fround(a * Math.fround(1 - l * 0.05))));
  }
  if (s && n.buffs.includes(s)) {
    const c = e.skill(n, "MagicShield")?.s.Level || 0;
    c > 3 &&
      ((a = Math.min(a, Math.trunc(n.maxHP * Math.max(0.05, 0.55 - (c - 3) * 0.05)))),
      e.rng.next(120) < (c - 3) * 10 && n.hp / n.maxHP < 0.4 && (a = 0));
  }
  return a;
}
function io(e, t, a, i) {
  const n = (t.nativeRecovery ??= []),
    s = Math.trunc(a / i);
  s > 0 &&
    n.length < 4 &&
    n.push({
      remaining: Math.trunc(a),
      chunk: s,
      next: e.time + 1e3,
    });
}
function no(e, t, a) {
  const i = (t.nativeHealing ??= []);
  a > 0 &&
    i.length < 4 &&
    i.push({
      remaining: Math.trunc(a),
      chunk: Math.max(1, Math.trunc(a / 5)),
      next: e.time + 1e3,
    });
}
function so(e, t) {
  if (t.dead) {
    (t.nativeRecovery && (t.nativeRecovery = []), t.nativeHealing && (t.nativeHealing = []));
    return;
  }
  for (const a of ["nativeRecovery", "nativeHealing"])
    if (t[a]?.length) {
      for (const i of t[a] || [])
        if (e.time >= i.next) {
          const n = Math.min(i.remaining, i.chunk);
          ((i.remaining -= n), (i.next = e.time + 1e3), (t.hp = Math.min(t.maxHP, t.hp + n)));
        }
      t[a] = t[a]?.filter((i) => i.remaining > 0);
    }
}
function oo(e, t, a, i, n, s = i, o) {
  if (a.kind !== "player" || n === "None" || a.dead) return;
  const r = a,
    c = r.buffs.find((u) => u.type === "InnateQi"),
    l = r.buffs.find((u) => u.type === "DiamondBody");
  if (c) {
    const u = e.skill(r, "InnateQi")?.level || c.value;
    io(e, r, Math.trunc((i * u) / 10), u >= 6 ? 2 : u >= 4 ? 3 : 4);
  }
  if (!(o === "DiamondReflect" || o === "NativeReflect")) {
    if (l && !t.dead) {
      const u = e.skill(r, "DiamondBody")?.level || l.value,
        h = Math.min(3, u);
      e.rng.next(15) < u &&
        e.schedule(
          "hit",
          500,
          r,
          t,
          Math.trunc(Math.fround(s * Math.fround(0.35 + 0.1 * h))),
          "AC",
          "DiamondReflect",
        );
    }
    r.stats.NativeReflectPercent &&
      !t.dead &&
      e.schedule(
        "hit",
        500,
        r,
        t,
        Math.trunc((s * r.stats.NativeReflectPercent) / 100) + 1,
        "ACBypass",
        "NativeReflect",
      );
  }
}
function ro(e, t, a) {
  if (a.type !== "DragonFlame" || t.kind !== "player") return;
  const i = t,
    n = e.skill(i, "DragonFlame");
  if (n)
    for (const s of e
      .map(t.map)
      .actors.filter((o) => o.kind === "monster" && !o.friendly && !o.dead && P(o, t) <= 2))
      e.damage(t, s, magicDamage(n.d, a.value, L(e, t, "MC"), e.rng), "MAC", "DragonFlame");
}
function ui(e, t, a) {
  const i = (t.special = {
      stage: $(e, t)?.healthStages?.count ?? 7,
    }),
    n = $(e, t);
  (n?.regeneration?.initialDelayMs !== void 0 &&
    (i.bossRegenAt = e.time + n.regeneration.initialDelayMs),
    (n?.burrow || (!n && [14, 24].includes(a.AI))) &&
      Object.assign(i, {
        visible: !1,
        visibleAt: 0,
      }),
    (n?.stone || (!n && [15, 17].includes(a.AI))) &&
      Object.assign(i, {
        stoned: !0,
      }),
    a.AI === 25 &&
      Object.assign(i, {
        lives: e.rng.next(3),
        revivals: 0,
      }),
    a.AI === 2 &&
      Object.assign(i, {
        runAway: e.rng.next(7) === 0,
      }));
}
var St = (e) => e.special?.visible !== !1,
  targetableMonster = (e) => St(e) && !e.special?.stoned,
  moveSpeed = (e, t) =>
    t.special?.madUntil && Number(t.special.madUntil) > e.time
      ? ($(e, t)?.healthStages?.moveMs ?? 400)
      : Math.max(
          0,
          (e.monsters.get(t.definition)?.MoveSpeed || 0) - (t.special?.runAway ? 300 : 0),
        ),
  attackSpeed = (e, t) =>
    t.special?.madUntil && Number(t.special.madUntil) > e.time
      ? ($(e, t)?.healthStages?.attackMs ?? 500)
      : Math.floor(
          e.monsters.get(t.definition).AttackSpeed /
            (1 +
              (!t.monsterAffixes && t.special?.nativeAffixType === 10010
                ? Number(t.special.nativeAffixLow) / 10
                : 0)),
        );
function bossHealthInterval(e, t, a, i) {
  for (const n of activeBossHealthBranches(e, t))
    a = i
      ? (n.attackIntervalMs ?? a) - (n.attackIntervalReductionMs ?? 0)
      : (n.moveIntervalMs ?? a);
  return a;
}
var slow = (e, t, a) =>
  e.monsters.get(t.definition)?.DreamRaw
    ? a + (t.buffs.some((i) => i.type === "Slow" && i.until > e.time) ? 600 : 0)
    : Number(t.special?.slowTicks) > 0
      ? Math.min(3500, a + Number(t.special?.slowTicks) * 100)
      : a;
function monsterActionCost(e, t, a) {
  const i = e.monsters.get(t.definition)?.DreamRaw;
  if (!i) return 300;
  if (!a)
    return Math.trunc(Math.fround((600 - Math.min(10, i.MoveSpeed || 0) * 50) * Math.fround(1.2)));
  const n = Number(e.monsters.get(t.definition)?.DreamOriginalId),
    s = n === 80 ? 8 : [104, 136, 144].includes(n || 0) ? 10 : 6;
  return Math.max(50, (140 - (i.AtkSpeed || 0) * 5) * (s + 2) + 50);
}
var lo = (e, t) =>
    slow(
      e,
      t,
      Math.max(
        isSpirit(e, t) || e.monsters.get(t.definition)?.DreamRaw ? 0 : 400,
        bossHealthInterval(e, t, moveSpeed(e, t), !1) -
          (t.special?.dreamPet ? Number(t.special.petLevel || 0) * 50 : 0) -
          (t.friendly &&
          !e.monsters.get(t.definition)?.DreamRaw &&
          ([18, 23, 38].includes(t.ai || 0) || t.special?.dreamPet)
            ? Number((t.special?.dreamPet ? t.special.petLevel : t.special?.maxPetLevel) || 0) * 130
            : 0),
      ),
    ),
  Ae = (e, t) => {
    const a = Math.max(
        e.monsters.get(t.definition)?.DreamRaw ? 0 : 400,
        (t.special?.dreamPet
          ? Math.max(
              200,
              bossHealthInterval(e, t, attackSpeed(e, t), !0) -
                Number(t.special.petLevel || 0) * 50,
            )
          : bossHealthInterval(e, t, attackSpeed(e, t), !0)) -
          (t.friendly &&
          !e.monsters.get(t.definition)?.DreamRaw &&
          ([18, 23, 38].includes(t.ai || 0) || t.special?.dreamPet)
            ? Number((t.special?.dreamPet ? t.special.petLevel : t.special?.maxPetLevel) || 0) * 70
            : 0),
      ),
      i = t.monsterAffixes?.filter((n) => n.type === 10010).reduce((n, s) => n + s.low, 0) || 0;
    return slow(e, t, i ? Math.floor(a / (1 + i / 10)) : a);
  };
function fo(e, t, a) {
  if (isChallengeChest(e.monsters.get(t.definition), e.rules)) return ((t.target = 0), !1);
  if (Rs(e, t)) return !1;
  Is(e, t);
  const i = t.special || (t.special = {}),
    n = e.monsters.get(t.definition);
  if (
    (t.friendly &&
      i.tameUntil &&
      e.time >= Number(i.tameUntil) &&
      ((t.friendly = !1),
      (t.master = void 0),
      (t.target = 0),
      (i.tameUntil = 0),
      e.say(
        message("core.monsters.prepareMonster.074787788c", {
          p0: entityText("monsters", t.definition),
        }),
      )),
    !t.dead && n.AI === 55 && t.master && e.time >= Number(i.mpAt || 0))
  ) {
    const l = e.actor(t.master);
    if (((i.mpAt = e.time + 1e3), l && (l.dead || (l.mp = Math.max(0, l.mp - 10)), l.mp <= 0)))
      return (e.die(t, l), !1);
  }
  if (t.dead)
    if (n.AI === 25 && Number(i.revivals) < Number(i.lives) && e.time >= Number(i.reviveAt))
      ((i.revivals = Number(i.revivals) + 1),
        (t.dead = !1),
        (t.expires = void 0),
        (t.hp = Math.trunc((t.maxHP * (100 - 25 * Number(i.revivals))) / 100)),
        (t.actionAt = e.time + 300),
        e.emit("ObjectRevived", {
          ObjectID: t.id,
          Effect: !0,
        }));
    else return !1;
  const s = [a, ...e.map(t.map).actors.filter((l) => l.friendly)].filter(
      (l) => !l.dead && l.map === t.map && !e.safe(l),
    ),
    o = $(e, t),
    r = o?.burrow,
    c = o?.stone;
  if (r || (!o && [14, 24].includes(n.AI))) {
    if (
      ((r?.restoreHP || (!o && n.AI === 14)) && !i.visible && (t.hp = t.maxHP),
      e.time >= Number(i.visibleAt || 0))
    ) {
      i.visibleAt = e.time + (r?.scanMs ?? 2e3);
      const l = s.some(
        (u) =>
          P(t, u) <= (i.visible ? (r?.hideRange ?? (n.AI === 14 ? 7 : 3)) : (r?.emergeRange ?? 3)),
      );
      !i.visible && l
        ? ((i.visible = !0),
          (t.actionAt = e.time + (r?.emergeDelayMs ?? 2e3)),
          e.emit("ObjectShow", {
            ObjectID: t.id,
          }))
        : (r || n.AI === 14) &&
          i.visible &&
          !l &&
          ((i.visible = !1),
          (i.visibleAt = e.time + (r?.hideDelayMs ?? 3e3)),
          (!r || r.restoreHP) && (t.hp = t.maxHP),
          e.emit("ObjectHide", {
            ObjectID: t.id,
          }));
    }
    if (!i.visible) return !1;
  }
  if ((c || (!o && [15, 17].includes(n.AI))) && i.stoned) {
    if (e.time >= t.actionAt && s.some((l) => P(t, l) <= (c?.wakeRange ?? 2)))
      for (const l of e
        .map(t.map)
        .actors.filter(
          (u) =>
            (!!$(e, u)?.stone || (!$(e, u) && [15, 17].includes(u.ai || 0))) &&
            !u.dead &&
            P(u, t) <= (c?.groupRange ?? 14),
        ))
        l.special?.stoned &&
          ((l.special.stoned = !1),
          (l.actionAt = e.time + (c?.wakeDelayMs ?? 1e3)),
          e.emit("ObjectShow", {
            ObjectID: l.id,
          }));
    if (i.stoned) return !1;
  }
  if (n.AI === 18 && (!n.DreamOriginalId || n.DreamOriginalId === 14) && e.time >= t.actionAt) {
    t.target && (i.modeUntil = e.time + 3e4);
    const l = Number(i.modeUntil || 0) > e.time;
    l !== !!i.mode &&
      ((i.mode = l),
      (t.art = n.DreamOriginalId === 14 ? n.Image : l ? "Shinsu1" : "Shinsu"),
      (t.actionAt = e.time + 1e3),
      e.emit(l ? "ObjectShow" : "ObjectHide", {
        ObjectID: t.id,
      }));
  }
  if ((Ts(e, t, a), !o && [11, 17].includes(n.AI) && t.maxHP >= 7)) {
    const l = Math.trunc(t.hp / Math.trunc(t.maxHP / 7));
    if (l < Number(i.stage ?? 7))
      if (n.AI === 11) i.madUntil = e.time + 8e3;
      else {
        const u = Math.min(
          8,
          40 - e.map(t.map).actors.filter((h) => h.master === t.id && !h.dead).length,
        );
        for (let h = 0; h < u; h++) {
          const p = e.rules.monsterSettings["Zuma" + (e.rng.next(7) + 1)],
            g = e.rules.monsters.find((v) => v.Name === p);
          if (!g) continue;
          const y = e.freeNear(t.map, t, 3);
          if (!y) continue;
          const f = e.newMonster(g, t.map, y);
          ((f.master = t.id),
            (f.target = t.target),
            (f.actionAt = e.time + 2e3),
            e.map(t.map).actors.push(f));
        }
      }
    i.stage = Math.min(Number(i.stage ?? 7), l);
  }
  if (
    !o &&
    n.AI === 11 &&
    e.time >= Number(i.teleAt || 0) &&
    ((i.teleAt = e.time + 1e4),
    U.filter(([u, h]) => !e.walkable(t.map, t.x + u, t.y + h, t.id)).length >= 5)
  )
    for (let u = 0; u < 100; u++) {
      const h = t.x + e.rng.next(5, -4),
        p = t.y + e.rng.next(5, -4);
      if (e.walkable(t.map, h, p, t.id)) {
        ((t.x = h),
          (t.y = p),
          (t.target = 0),
          e.emit("ObjectTeleportIn", {
            ObjectID: t.id,
          }));
        break;
      }
    }
  return !0;
}


function hi(e, t, a) {
  if (
    !t.friendly ||
    !t.master ||
    !t.special?.dreamTamed ||
    a.friendly ||
    a.dead ||
    a.kind !== "monster" ||
    a.map !== t.map ||
    !targetableMonster(a)
  )
    return;
  const i = e.monsters.get(t.definition)?.DreamOriginalId;
  if (i !== 94 && i !== 95 && i !== 96) return;
  const n = e.rules.adaptations.monsterCombat?.byNativeId[i],
    s = n?.attacks[0],
    o = s?.hits[0],
    r = s?.visual ?? n?.visual;
  return !n || !s || !o || o.shape !== "target" || !r
    ? void 0
    : {
        range: s.range ?? n.range,
        minimumDistance: s.minimumDistance ?? 0,
        visual: r,
        hit: o,
        power: i === 96 ? "DC" : "MC",
        actionMs: s.actionMs ?? n.actionMs,
        hitDelayMs: s.hitDelayMs ?? n.hitDelayMs,
      };
}
function monsterRange(e, t, a) {
  const i = a && hi(a, e, t);
  if (i) return We(a, e.map, e, t) ? i.range : 1;
  if (e.ai === 8 || e.ai === 38 || e.ai === 55) return 6;
  if (e.ai === 18) {
    const n = Math.abs(e.x - t.x),
      s = Math.abs(e.y - t.y);
    return (n <= 1 && s <= 1) || n === s || n % 2 === s % 2 ? 2 : 0;
  }
  if (e.ai === 14) return 7;
  if (e.ai === 26) {
    const n = Math.abs(e.x - t.x),
      s = Math.abs(e.y - t.y);
    return n === 0 || s === 0 || n === s ? 6 : 0;
  }
  return 1;
}
function mo(e, t, a) {
  const i = t.special || (t.special = {});
  if (t.ai === 2 && i.runAway) return (bi(e, t, a), !0);
  const n = $(e, t),
    s = n?.retreat;
  return (s || (!n && t.ai === 8)) && e.time >= t.attackAt && e.time >= Number(i.fearUntil || 0)
    ? ((i.fearUntil = e.time + (s?.intervalMs ?? 5e3)),
      P(t, a) >= (s?.range ?? 6) ? e.stepTowards(t, a) : bi(e, t, a),
      !0)
    : !1;
}
function bi(e, t, a) {
  if (e.time < t.moveAt) return;
  let i = direction(a, t);
  if ((i < 0 && (i = t.dir), e.move(t, i))) return;
  const n = e.rng.next(2) ? -1 : 1;
  for (let s = 1; s < 8; s++) if (e.move(t, (i + n * s + 8) % 8)) return;
}
function po(e, t, a) {
  Kt(t, e.time);
  const i = hi(e, t, a);
  if (i) {
    const c = P(t, a);
    if (
      c > i.range ||
      c < i.minimumDistance ||
      !We(e, t.map, t, a) ||
      e.time < Number(t.special.foxAttackAt ?? t.special.redFoxAttackAt ?? 0)
    )
      return;
    ((t.special.foxAttackAt = e.time + 7e3),
      (t.dir = Math.max(0, direction(t, a))),
      (t.actionAt = e.time + i.actionMs),
      (t.attackAt = t.actionAt + Ae(e, t)),
      e.emit("ObjectRangeAttack", {
        ObjectID: t.id,
        Direction: F[t.dir],
        TargetID: a.id,
        Spell: i.visual,
        Duration: i.actionMs,
      }),
      e.schedule(
        "hit",
        i.hitDelayMs,
        t,
        a,
        Math.floor(z(t.stats, i.power, e.rng) * i.hit.scale),
        i.hit.defence,
        i.visual,
      ));
    return;
  }
  if (isSpirit(e, t)) {
    ((t.dir = direction(t, a)),
      (t.attackAt = e.time + Ae(e, t)),
      (t.actionAt = e.time + 600),
      e.emit("ObjectRangeAttack", {
        ObjectID: t.id,
        Direction: F[t.dir],
        TargetID: a.id,
        Spell: "SoulFireBall",
        Duration: 600,
      }),
      e.schedule("hit", 500, t, a, z(t.stats, "DC", e.rng), "MAC", "SpiritServantBolt"));
    return;
  }
  if (qs(e, t, a)) return;
  const n = e.monsters.get(t.definition)?.DreamOriginalId,
    s = t.ai === 18 && (n === 14 ? "ShinsuFire" : n === 62 ? "AncientShinsuFire" : "");
  if (t.ai === 18 && !t.special?.mode && !t.special?.dreamPet) return;
  ((t.dir = direction(t, a)),
    t.dir < 0 && (t.dir = 0),
    (t.attackAt = e.time + Ae(e, t)),
    (t.actionAt = e.time + monsterActionCost(e, t, !0)),
    e.monsters.get(t.definition)?.DreamRaw && (t.attackAt = t.actionAt + Ae(e, t)),
    e.emit(
      t.ai === 55
        ? "Magic"
        : s || [8, 26, 38].includes(t.ai || 0)
          ? "ObjectRangeAttack"
          : "ObjectAttack",
      {
        ObjectID: t.id,
        Direction: F[t.dir],
        TargetID: a.id,
        Location: {
          X: t.x,
          Y: t.y,
        },
        Spell: t.ai === 55 ? "ThunderBolt" : s || "None",
        Cast: t.ai === 55,
        Target: a,
      },
    ));
  const o = moonSpiritAttackPower(e, t, z(t.stats, t.ai === 55 ? "MC" : "DC", e.rng)),
    r = t.friendly
      ? e
          .map(t.map)
          .actors.filter((c) => c.kind === "monster" && !c.friendly && targetableMonster(c))
      : [e.me, ...e.map(t.map).actors.filter((c) => c.friendly)];
  if (t.ai === 14)
    for (const c of r.filter((l) => l && !l.dead && P(l, t) <= 7))
      e.schedule("hit", 500, t, c, o, "MAC", "EvilCentipede");
  else if (t.ai === 26 || t.ai === 18) {
    const [c, l] = U[t.dir];
    for (let u = 1; u <= (t.ai === 18 ? 2 : 6); u++)
      for (const h of r.filter((p) => p && !p.dead && p.x === t.x + c * u && p.y === t.y + l * u))
        e.schedule(
          "hit",
          (t.ai === 18 ? 500 : 300) + u * 50,
          t,
          h,
          o,
          t.ai === 18
            ? Number(e.monsters.get(t.definition)?.DreamRaw?.Weight || 0) & 1
              ? "MAC"
              : "ACAgility"
            : "MACAgility",
        );
  } else {
    const c = e.schedule(
      "hit",
      t.ai === 8 ? 500 + P(t, a) * 50 : [38, 55].includes(t.ai || 0) ? 500 : 300,
      t,
      a,
      o,
      [38, 55].includes(t.ai || 0)
        ? "MAC"
        : [7, 10, 11, 17].includes(t.ai || 0)
          ? "MACAgility"
          : "ACAgility",
      t.ai === 7 ? "CaveMaggot" : void 0,
    );
    isHell(e.rules) && t.ai !== 55 && (c.monsterBasicAttack = !0);
  }
}
var ho = 6;
function We(e, t, a, i) {
  const n = e.geometry.get(t);
  if (!n) return !1;
  let s = a.x,
    o = a.y;
  const r = Math.abs(i.x - s),
    c = Math.abs(i.y - o),
    l = s < i.x ? 1 : -1,
    u = o < i.y ? 1 : -1;
  let h = r - c;
  for (let p = 0; p < 64; p++) {
    if (s < 0 || o < 0 || s >= n.width || o >= n.height || n.solid[o * n.width + s]) return !1;
    if (s === i.x && o === i.y) return !0;
    const g = h * 2;
    (g > -c && ((h -= c), (s += l)), g < r && ((h += r), (o += u)));
  }
  return !1;
}
function enemy(e) {
  return e.kind === "monster" && !e.dead && !e.friendly && targetableMonster(e);
}
var tt = new WeakMap();
function bo(e, t) {
  const a = tt.get(t);
  if (!a) return !1;
  if (t.dead || t.map !== a.map || e.time > a.until) return (tt.delete(t), !1);
  if (e.time < Math.max(t.spellAt, t.actionAt)) return !0;
  tt.delete(t);
  try {
    yi(e, t, {
      ...a.data,
      Queue: !1,
    });
  } catch (i) {
    e.say(mt(i));
  }
  return !0;
}
function yi(e, t, a) {
  const i = e.skill(t, "Hydra");
  if (!i || t.job !== "Wizard" || t.dead || mountedItem(e, t) || e.time < i.s.CastTime) return;
  const n = le(i.d, i.level, t.stats);
  if (t.mp < n) throw new b(message("core.magic.castMagic.26f1ab23c0"));
  if (e.time < Math.max(t.spellAt, t.actionAt)) {
    a.Queue === !0 &&
      t.assist?.autoMagic &&
      tt.set(t, {
        map: t.map,
        until: e.time + 3e3,
        data: {
          ...a,
        },
      });
    return;
  }
  tt.delete(t);
  const s = e.actor(Number(a.TargetID)),
    o = s && s.map === t.map && enemy(s) && P(t, s) <= i.d.Range ? s : void 0,
    [r, c] = U[t.dir];
  let l = o ?? {
    x: t.x + r * 2,
    y: t.y + c * 2,
  };
  if (a.AutoPlace !== !0 && a.Location) {
    const v = {
      x: Number(a.Location.X),
      y: Number(a.Location.Y),
    };
    if (!Number.isInteger(v.x) || !Number.isInteger(v.y) || P(t, v) > i.d.Range)
      throw new b(message("core.dream-magic.castDream.8ec455055d"));
    l = v;
  }
  const u = [];
  for (let v = l.y - 2; v <= l.y + 2; v++)
    for (let x = l.x - 2; x <= l.x + 2; x++)
      u.push({
        x,
        y: v,
      });
  u.sort((v, x) => P(v, l) - P(x, l) || P(v, t) - P(x, t) || v.y - x.y || v.x - x.x);
  const h = u.find(
    (v) => P(t, v) <= i.d.Range && e.walkable(t.map, v.x, v.y, t.id) && We(e, t.map, t, v),
  );
  if (!h) throw new b(message("core.dream-magic.castDream.b60b3b41b5"));
  for (const v of Object.values(e.maps))
    v.actors = v.actors.filter((x) => !(x.spell === "Hydra" && x.target === t.id));
  const p = hydraLevel(i.level),
    g = hydraStats(i.d, p),
    y = {
      id: e.nextId++,
      kind: "spell",
      name: "Hydra",
      spell: "Hydra",
      map: t.map,
      ...h,
      dir: t.dir,
      hp: 1,
      maxHP: 1,
      dead: !1,
      stats: {
        interval: g.intervalMs,
        level: p,
        preferred: o?.id || 0,
        born: e.time,
        shots: 0,
      },
      buffs: [],
      show: !0,
      actionAt: 0,
      attackAt: e.time + 500,
      moveAt: 0,
      target: t.id,
      expires: e.time + g.durationMs,
    };
  e.map(t.map).actors.push(y);
  const f = dreamCastDelay(t.stats);
  ((t.mp -= n),
    (i.s.CastTime = e.time + i.d.DreamSkill.cooldown),
    (t.spellAt = e.time + f),
    (t.actionAt = e.time + Math.min(600, f)),
    e.emit("Magic", {
      ObjectID: t.id,
      Spell: "Hydra",
      Cast: !0,
      Direction: F[t.dir],
      Target: h,
      TargetID: 0,
    }));
}
function go(e, t) {
  const a = e.actor(t.target);
  if (!a || a.kind !== "player" || a.dead || a.map !== t.map) {
    t.expires = e.time;
    return;
  }
  if (t.dead || e.time >= (t.expires ?? 0) || e.time < t.attackAt) return;
  const i = e.map(t.map).actors.filter((c) => enemy(c) && P(t, c) <= ho && We(e, t.map, t, c));
  i.sort(
    (c, l) =>
      +(l.id === t.stats.preferred) - +(c.id === t.stats.preferred) ||
      P(t, c) - P(t, l) ||
      c.id - l.id,
  );
  const n = i[0];
  if (!n) {
    t.attackAt = e.time + 150;
    return;
  }
  const s = e.skill(a, "Hydra");
  if (!s) {
    t.expires = e.time;
    return;
  }
  ((t.attackAt = e.time + t.stats.interval), (t.dir = direction(t, n)));
  const o = t.stats.shots++ % 3,
    r = Math.min(900, Math.max(160, P(t, n) * 65));
  (e.schedule(
    "hit",
    200 + r,
    a,
    n,
    magicDamage(s.d, t.stats.level, L(e, a, "MC"), e.rng),
    "MAC",
    "Hydra",
  ),
    e.emit("HydraShot", {
      ObjectID: t.id,
      Head: o,
      From: {
        x: t.x,
        y: t.y,
      },
      Target: {
        x: n.x,
        y: n.y,
      },
      TargetID: n.id,
      Spell: "FireBall",
      Direction: F[t.dir],
    }));
}
function xi(e, t, a) {
  const i = a.spell,
    n = a.level || 0,
    s = !!e.skill(t, i)?.d.DreamSkill,
    o = a.location,
    r = i === "FireWall",
    c = i === "Blizzard" || i === "MeteorStrike" || i === "DragonFlame",
    l = c ? 2 : 1,
    u =
      a.durationMs ??
      (s && r
        ? Math.min((L(e, t, "MC") + 3 * n) * 500, [0, 8e3, 12e3, 15e3, 18e3, 21e3, 24e3][n] ?? 25e3)
        : s && i === "PoisonCloud"
          ? 3e3 + L(e, t, "SC") * 100
          : i === "DragonFlame"
            ? 3e3
            : r
              ? (10 + Math.trunc(a.damage / 2)) * 1e3
              : c
                ? 3e3
                : i === "PoisonCloud"
                  ? 6e3
                  : 1e4 + n * 5e3),
    h = i === "DragonFlame" ? 1e3 : r ? (s ? 1e3 : 2e3) : c ? 440 : i === "PoisonCloud" ? 1e3 : 400,
    p = e.geometry.get(t.map);
  let g = !0;
  for (let y = o.y - l; y <= o.y + l; y++)
    for (let f = o.x - l; f <= o.x + l; f++) {
      if (
        (r && Math.abs(f - o.x) + Math.abs(y - o.y) > 1) ||
        f < 0 ||
        y < 0 ||
        f >= p.width ||
        y >= p.height ||
        p.solid[y * p.width + f]
      )
        continue;
      const v = e
        .map(t.map)
        .actors.find(
          (x) =>
            x.spell === i && x.x === f && x.y === y && !x.dead && (x.expires ?? 1 / 0) > e.time,
        );
      if (v) {
        (r || i === "PoisonCloud" || i === "DragonFlame") &&
          ((v.expires = e.time + u), (v.target = t.id));
        continue;
      }
      (e.map(t.map).actors.push({
        id: e.nextId++,
        kind: "spell",
        name: i,
        spell: i,
        map: t.map,
        x: f,
        y,
        dir: 0,
        hp: 1,
        maxHP: 1,
        dead: !1,
        stats: {
          power: a.damage,
          interval: h,
          bonus: a.effect?.value || 0,
          centerX: o.x,
          centerY: o.y,
        },
        buffs: [],
        show: r || g,
        actionAt: 0,
        attackAt:
          (r || i === "PoisonCloud" || i === "DragonFlame") && s
            ? (Math.floor(e.time / 1e3) + 1) * 1e3
            : e.time + (r ? 0 : c ? 800 : h),
        moveAt: 0,
        target: t.id,
        expires: e.time + u,
      }),
        (g = !1));
    }
}


function yo(e, t) {
  if (t.spell === "Hydra") {
    go(e, t);
    return;
  }
  if (t.dead || e.time < t.attackAt || e.time >= (t.expires ?? 1 / 0)) return;
  if (
    ((t.attackAt = e.time + (t.stats.interval || 2e3)),
    ["NativeDragonFireWall", "NativeBossIceField"].includes(t.spell || ""))
  ) {
    const n = e.actor(t.target);
    if (!n || n.dead || n.map !== t.map) {
      t.expires = e.time;
      return;
    }
    for (const s of [e.me, ...e.map(t.map).actors.filter((o) => o.friendly && o.master)].filter(
      (o) => o && !o.dead && o.map === t.map && !e.safe(o) && P(o, t) === 0,
    )) {
      const o = e.rng.next(Math.max(t.stats.MinDC + 1, t.stats.MaxDC), t.stats.MinDC);
      e.schedule("hit", t.stats.hitDelayMs, n, s, o, "MAC", t.spell);
    }
    return;
  }
  const a = e.actor(t.target);
  if (!a || a.dead || a.map !== t.map) {
    t.expires = e.time;
    return;
  }
  if (["Blizzard", "MeteorStrike"].includes(t.spell) && !a.attackModes.channel) return;
  const i = e
    .map(t.map)
    .actors.filter(
      (n) =>
        n.kind === "monster" && !n.dead && !n.friendly && targetableMonster(n) && P(n, t) === 0,
    );
  t.spell === "HealingCircle" && P(a, t) === 0 && !a.healHP && a.hp < a.maxHP && (a.healHP += 25);
  for (const n of i) {
    const s = ["FireWall", "PoisonCloud", "DragonFlame"].includes(t.spell),
      o = s ? e.skill(a, t.spell) : void 0;
    if (s && !o) continue;
    let r = o
      ? magicDamage(o.d, o.level, L(e, a, t.spell === "PoisonCloud" ? "SC" : "MC"), e.rng)
      : t.stats.power || 0;
    if (o?.d.DreamSkill && ["FireWall", "PoisonCloud", "DragonFlame"].includes(t.spell)) {
      if (t.spell === "PoisonCloud") {
        const l = [1, 2, 1.5, 1.2][o.level] ?? 1;
        r = Math.trunc(r / l);
      }
      const c = e.schedule("hit", 500, a, n, r, "MAC", t.spell);
      t.spell === "PoisonCloud" &&
        ((c.level = o.level),
        (c.effect = {
          type: "NativeFieldPoison",
          duration: 0,
          value: 0,
          stats: {},
        }));
      continue;
    }
    (e.damage(a, n, r, "MAC", t.spell),
      !n.dead &&
        (t.spell === "PoisonCloud"
          ? e.buff(
              n,
              "Green",
              12e3,
              Math.trunc(((a.stats.MinSC || 0) + (a.stats.MaxSC || 0)) / 2) + (t.stats.bonus || 0),
              {},
              a.id,
            )
          : t.spell === "HealingCircle"
            ? e.buff(n, "Slow", (5 + e.rng.next(5)) * 1e3)
            : t.spell === "Blizzard" &&
              e.rng.next(8) === 0 &&
              e.buff(n, "Slow", (5 + e.rng.next(a.stats.Freezing || 0)) * 2e3)));
  }
}
function xo(e, t, a, i) {
  const n = i.spell ?? "NativeDragonFireWall",
    s = e.geometry.get(t.map),
    o = e.monsters.get(t.definition).Stats;
  for (let r = a.y - i.radius; r <= a.y + i.radius; r++)
    for (let c = a.x - i.radius; c <= a.x + i.radius; c++) {
      if (c < 0 || r < 0 || c >= s.width || r >= s.height || s.solid[r * s.width + c]) continue;
      const l = e
        .map(t.map)
        .actors.find(
          (u) => u.spell === n && u.x === c && u.y === r && !u.dead && (u.expires ?? 0) > e.time,
        );
      if (l) {
        ((l.expires = e.time + i.delayMs + i.durationMs), (l.target = t.id));
        continue;
      }
      e.map(t.map).actors.push({
        id: e.nextId++,
        kind: "spell",
        name: n === "NativeBossIceField" ? "\u51B0\u6676\u9886\u57DF" : "\u706B\u9F99\u5730\u706B",
        spell: n,
        map: t.map,
        x: c,
        y: r,
        dir: 0,
        hp: 1,
        maxHP: 1,
        dead: !1,
        stats: {
          MinDC: Math.trunc(Math.fround((o.MinDC || 0) * i.damageScale)),
          MaxDC: Math.trunc(Math.fround((o.MaxDC || 0) * i.damageScale)),
          interval: i.intervalMs,
          hitDelayMs: i.hitDelayMs,
        },
        buffs: [],
        show: n === "NativeBossIceField",
        actionAt: 0,
        attackAt: e.time + i.delayMs,
        moveAt: 0,
        target: t.id,
        expires: e.time + i.delayMs + i.durationMs,
      });
    }
}
function vo(e, t, a, i, n) {
  if (
    n.spell !== "PoisonCloud" ||
    n.effect?.type !== "NativeFieldPoison" ||
    t.kind !== "player" ||
    t.dead ||
    a.dead ||
    i <= 0 ||
    e.rng.next(Math.max(1, 8 - (n.level || 1))) !== 0
  )
    return;
  const s = 5e3 + L(e, t, "SC") * 200,
    o = Math.trunc(L(e, t, "SC") / 4);
  e.buff(a, "Green", s, o, {}, t.id, "PoisonCloud");
}
function nativeDeathSource(e, t, a) {
  return (
    ["NativeDeathBurst", "NativeDeathPoison"].includes(a || "") &&
    !!e.rules.adaptations.monsterCombat?.deathBursts?.[
      String(e.monsters.get(t.definition)?.DreamOriginalId)
    ]
  );
}
function Mo(e, t) {
  const a =
    e.rules.adaptations.monsterCombat?.deathBursts?.[
      String(e.monsters.get(t.definition)?.DreamOriginalId)
    ];
  if (!a || t.friendly || t.special?.deathBurstDone) return;
  (t.special ??= {}).deathBurstDone = !0;
  const i = [
    e.me,
    ...e.map(t.map).actors.filter((n) => n.kind === "monster" && n.friendly && n.master),
  ].filter((n) => n && !n.dead && n.map === t.map && P(t, n) <= a.radius && !e.safe(n));
  for (const n of i) {
    const s = a.targetHPDivisor
        ? Math.trunc(n.hp / a.targetHPDivisor)
        : Math.trunc(Math.fround(Number(t.special.lastReceivedDamage || 0) * a.lastDamageScale)),
      o = e.monsters.get(t.definition)?.DreamMagicAttack ? "MAC" : "ACAgility";
    (e.schedule("deathHit", a.delayMs, t, n, s, o, "NativeDeathBurst"),
      a.poison &&
        (e.buff(n, "Green", a.poison.durationMs, a.poison.value, {}, t.id, "NativeDeathPoison"),
        (t.expires = Math.max(t.expires || 0, e.time + a.poison.durationMs + 1e3))));
  }
}
var kt = 8e3,
  Mi = 1e3,
  ia = new WeakMap();
function wo(e, t, a) {
  const i = ia.get(e);
  return !i || t.Type !== "Potion" || t.Shape !== 0
    ? 0
    : Math.max(0, t.Stats.HP > 0 ? i.hp - a : 0, t.Stats.MP > 0 ? i.mp - a : 0);
}
function So(e, t, a) {
  const i = ia.get(e) ?? {
    hp: 0,
    mp: 0,
  };
  (t.Stats.HP > 0 && (i.hp = a + Mi), t.Stats.MP > 0 && (i.mp = a + Mi), ia.set(e, i));
}
function isSnowPotion(e) {
  return (
    e.Type === "Potion" &&
    (e.Index === 20260 || e.DreamOriginalId === 260 || e.DreamName === "\u4E07\u5E74\u96EA\u971C")
  );
}
function itemCooldownRemaining(e, t, a) {
  return isSnowPotion(t) ? Math.max(0, Math.min(kt, (e.itemCooldowns?.snow || 0) - a)) : 0;
}
function Po(e, t, a) {
  isSnowPotion(t) && ((e.itemCooldowns ??= {}).snow = a + kt);
}
var wi = 4e3;
function isSunPotion(e) {
  return e.Type === "Potion" && e.Shape === 1 && [670, 671, 21231].includes(e.Index);
}
function sunPotionRemaining(e, t) {
  return Math.max(0, Math.min(wi, (e.sunPotionAt || 0) - t));
}
var oa = new WeakMap();
function ki(e) {
  let t = oa.get(e);
  return (
    t ||
      ((t = {
        hp: {
          at: 0,
          doses: [],
        },
        mp: {
          at: 0,
          doses: [],
        },
      }),
      oa.set(e, t)),
    t
  );
}
function Ao(e, t) {
  const a = oa.get(e);
  return e.dead || !a
    ? []
    : ["hp", "mp"].flatMap((i) => {
        const n = a[i],
          s = n.doses[0],
          o = i === "hp" ? e.potHP : e.potMP;
        return !s || !o || e[i] >= (i === "hp" ? e.maxHP : e.maxMP)
          ? []
          : [
              {
                kind: i,
                remainingMs: Math.max(0, n.at + (4 - s.tick) * 1e3 - t),
                queuedBottles: n.doses.length - 1,
              },
            ];
      });
}
function Co(e, t, a, i) {
  const n = ki(e);
  for (const [s, o, r] of [
    ["hp", t, "potHP"],
    ["mp", a, "potMP"],
  ]) {
    const c = n[s];
    e[r] || (c.doses = []);
    const l = Math.min(65535 - e[r], Math.max(0, Math.floor(o)));
    l &&
      (c.doses.length || (c.at = i + 1e3),
      c.doses.push({
        amount: l,
        tick: 0,
      }),
      (e[r] += l));
  }
}
function Do(e, t) {
  const a = ki(e);
  for (const [i, n, s] of [
    ["hp", "potHP", "maxHP"],
    ["mp", "potMP", "maxMP"],
  ]) {
    const o = a[i];
    if (e.dead || e[i] >= e[s] || !e[n]) {
      ((o.doses = []), (e[n] = 0));
      continue;
    }
    for (
      o.doses.length ||
      (o.doses.push({
        amount: e[n],
        tick: 0,
      }),
      (o.at = t + 1e3));
      o.doses.length && t >= o.at;

    ) {
      const r = o.doses[0],
        c = Math.floor((r.amount * (r.tick + 1)) / 5) - Math.floor((r.amount * r.tick) / 5);
      if (
        ((e[i] = Math.min(e[s], e[i] + c)),
        (e[n] -= c),
        r.tick++,
        (o.at += 1e3),
        r.tick === 5 && o.doses.shift(),
        e[i] >= e[s])
      ) {
        ((o.doses = []), (e[n] = 0));
        break;
      }
    }
  }
}
function recoveryPotion(e) {
  return e.Type === "Potion" && ((e.Stats.HP || 0) > 0 || (e.Stats.MP || 0) > 0);
}
function Io(e, t, a, i, n, s, o = () => !1) {
  if (n)
    return {
      items: [...e],
      gold: s,
      burst: !1,
    };
  const r = new Map(),
    c = new Set();
  for (const m of e) {
    if (!r.has(m.id)) {
      const k = o(m.id);
      r.set(m.id, k === !0 ? 1 / 0 : k === !1 ? 0 : Math.max(0, Math.floor(k)));
    }
    const M = r.get(m.id);
    M > 0 && (c.add(m), r.set(m.id, M - m.count));
  }
  const l = (m) => c.has(m),
    u = !n && a.next(100) < i.ordinaryBurstPercent,
    h = e.filter((m) => recoveryPotion(t.get(m.id)) && !l(m)),
    p = e.filter((m) => !recoveryPotion(t.get(m.id)) || l(m)),
    g = n ? i.bossMaxPotions : u ? i.burstMaxPotions : i.ordinaryMaxPotions;
  if (h.length && a.next(100) < i.potionChancePercent)
    for (let m = 0; m < g && h.length; m++) p.push(...h.splice(a.next(h.length), 1));
  const y = (m) =>
      l(m)
        ? 100
        : Ke.has(t.get(m.id).Type)
          ? 50 +
            ke(m) * 2 +
            (m.affixes?.length ? 10 : 0) +
            Math.min(7, Number(t.get(m.id).DreamGrade) || 0)
          : t.get(m.id).Type === "Book"
            ? 40
            : recoveryPotion(t.get(m.id))
              ? 0
              : 10,
    f = (u ? i.ordinaryBurstMax : i.ordinaryMax) - (s > 0 ? 1 : 0);
  p.sort((m, M) => y(M) - y(m));
  const v = p.filter((m) => l(m)),
    x = p.filter((m) => !l(m));
  return {
    items: [...v, ...x.slice(0, Math.max(0, f - v.length))],
    gold: s,
    burst: u,
  };
}
function effectiveAffixGrade(e) {
  return Number(e.AffixGenerationGrade ?? e.DreamGrade) || 0;
}
function auxiliaryAffixSlot(e) {
  return (
    (e.Type === "Bracelet" && e.DreamType === 4) ||
    (e.Type === "Stone" && [6, 16].includes(Number(e.DreamType))) ||
    (e.Type === "Talisman" && e.AffixPoolType === 6) ||
    (e.Type === "Amulet" && e.DreamType === 17 && e.AffixPoolType === 6)
  );
}
function supportsWearableJob(e, t) {
  const a = e.RequiredClass;
  return (
    a === "None" ||
    a === "WarWizTao" ||
    a === t ||
    a.split(", ").includes(t) ||
    a.includes(
      {
        Warrior: "War",
        Wizard: "Wiz",
        Taoist: "Tao",
      }[t],
    )
  );
}
var Pt = new Set([19, 1001, 43]);
function No(e, t) {
  const a = e.affixes || [],
    i = a.filter((s) => t[s.group]?.Prefix).length,
    n = a.findIndex((s) => t[s.group]?.Prefix && !Pt.has(s.type));
  return n >= 0 ? n : i < 3 ? a.findIndex((s) => !t[s.group]?.Prefix && !Pt.has(s.type)) : -1;
}
function ca(e) {
  return effectiveAffixGrade(e) < 5 || effectiveAffixGrade(e) > 7 || e.AffixChannelsEnabled !== !0
    ? {
        speed: 0,
        luck: 0,
      }
    : auxiliaryAffixSlot(e)
      ? {
          speed: 0.1,
          luck: 0.05,
        }
      : e.Type === "Ring" && e.DreamType === 5
        ? {
            speed: 0,
            luck: 0.05,
          }
        : {
            speed: 0,
            luck: 0,
          };
}
var At = new WeakMap();
function markNaturalAffixGeneration(e, t) {
  At.set(e, {
    magicFind: t,
  });
}
function markAffixPointDistribution(e, t) {
  At.set(e, {
    pointWeights: t,
  });
}
function To(e) {
  const t = At.get(e);
  return (At.delete(e), t);
}


function Oo(e, t, a, i, n) {
  const s = ca(t),
    o = No(e, i);
  if (o < 0 || !(s.speed + s.luck)) return;
  if (n + 1e-10 < s.speed + s.luck)
    throw new Error(`Affix channel capacity ${t.Index}: q=${n} < ${s.speed + s.luck}`);
  const r = Math.round((1e4 * s.speed) / n),
    c = Math.round((1e4 * s.luck) / n),
    l = a.next(1e4);
  let u = 0;
  if (l < r) {
    const g = t.Stats.MaxDC || 0,
      y = t.Stats.MaxMC || 0,
      f = t.Stats.MaxSC || 0,
      v = t.RequiredClass === "Warrior" || g > Math.max(y, f),
      x = ["Wizard", "Taoist"].includes(t.RequiredClass) || Math.max(y, f) > g;
    u =
      t.AffixSpeedKind === "attack"
        ? 1030
        : t.AffixSpeedKind === "cast"
          ? 1031
          : v
            ? 1030
            : x
              ? 1031
              : a.next(2) === 0
                ? 1030
                : 1031;
  } else l < r + c && (u = 1032);
  if (!u) return;
  const h = i[u];
  if (!h) throw new Error(`Missing controlled affix ${u}`);
  const p = h.Affixes[1];
  e.affixes.some((g) => g.type === h.Type || (u !== 1032 && [19, 1001].includes(g.type))) ||
    (e.affixes[o] = {
      group: u,
      tier: "1",
      name: p.Name,
      type: h.Type,
      low: 1,
      high: 1,
      rate: 100,
      duration: 0,
      revealed: !0,
      text: h.Format.replaceAll("{val}", "1"),
    });
}
function la(e, t, a, i) {
  if (i.mode === "hell") return;
  const n = To(e),
    s = effectiveAffixGrade(t),
    o = i.affixDropPolicy?.linkedExceptional,
    r = Math.min(8, Math.floor(ke(e)));
  if (!o || !i.affixes || r < 1 || e.added.GemTier || e.affixes?.length || !(s > 0)) return;
  const c = o.chanceByEquipmentGrade?.[String(s)] ?? o.chanceByStars;
  if (a.next(100) >= c[r]) return;
  const l =
    o.highStarCounts && r >= o.highStarCounts.minStars
      ? o.highStarCounts.countWeights
      : o.countWeights;
  let u = a.next(l.reduce((y, f) => y + f, 0)),
    h = 1;
  for (; h < l.length && u >= l[h - 1]; ) u -= l[h++ - 1];
  const p = ca(t),
    g =
      p.speed + p.luck
        ? Eo(
            t,
            i,
            n ?? {
              stars: r,
            },
          )
        : void 0;
  ot(e, t, a, i.affixes, h, g?.normalizer);
}
var Ai = new WeakMap();
function qo(e, t, a) {
  let i = Ai.get(t);
  i || ((i = new Map()), Ai.set(t, i));
  const n = effectiveAffixGrade(e),
    s = JSON.stringify([
      e.Index,
      n,
      e.RequiredClass,
      e.Stats,
      e.Type,
      e.DreamType,
      e.AffixPoolType,
      a,
    ]),
    o = i.get(s);
  if (o !== void 0) return o;
  const r = t.affixDropPolicy.linkedExceptional,
    c = r.chanceByEquipmentGrade?.[String(n)] ?? r.chanceByStars,
    l = (h) => {
      if (h < 1) return 0;
      const p =
          r.highStarCounts && h >= r.highStarCounts.minStars
            ? r.highStarCounts.countWeights
            : r.countWeights,
        g = p.reduce((y, f) => y + f, 0);
      return (
        (c[Math.min(8, h)] / 100) * p.reduce((y, f, v) => y + (f / g) * cn(e, t.affixes, v + 1), 0)
      );
    };
  let u = 0;
  if ("stars" in a) u = l(a.stars);
  else if ("pointWeights" in a) {
    const h = Object.values(a.pointWeights).reduce((p, g) => p + g, 0);
    u = Object.entries(a.pointWeights).reduce((p, [g, y]) => p + (y / h) * l(Number(g)), 0);
  } else {
    const h = t.pointWeights.reduce((y, f) => y + f, 0),
      p = t.pointWeights.map(() => 0);
    for (let y = 0; y < 32768; y++) {
      let f = y % h,
        v = 0;
      for (; f >= t.pointWeights[v]; ) f -= t.pointWeights[v++];
      p[v]++;
    }
    u =
      (Math.max(
        0,
        Math.min(
          100,
          Math.floor((100 * Math.max(0, a.magicFind)) / (Math.max(0, a.magicFind) + 250)) +
            (t.exceptionalGradeBonusPercent?.[String(n)] || 0),
        ),
      ) /
        100) *
      p.reduce((y, f, v) => y + (f / 32768) * l(v + 1), 0);
  }
  return (i.set(s, u), u);
}
function Eo(e, t, a) {
  const i = ca(e),
    n = qo(e, t, a),
    s = i.speed + i.luck,
    o = n + 1e-10 < s;
  if (o && "magicFind" in a) throw new Error(`Natural affix capacity ${e.Index}: q=${n} < ${s}`);
  const r = o ? 1 : n || 1,
    c = {
      speed: Math.round((1e4 * i.speed) / r),
      luck: Math.round((1e4 * i.luck) / r),
    };
  return {
    q: n,
    normalizer: r,
    mode: o ? "conditional-capacity" : "whole-source",
    requestedFinal: i,
    conditionalBasisPoints: c,
    expectedFinal: {
      speed: (n * c.speed) / 1e4,
      luck: (n * c.luck) / 1e4,
    },
    limitation: o
      ? "Original source point distribution has insufficient replaceable outcomes; original zero-star and count rules are preserved."
      : void 0,
  };
}
var trialState = (e) =>
  (e.trial ??= {
    stage: 0,
    honor: 0,
    title: 0,
    day: 0,
    attempts: 0,
  });
function Fo(e, t) {
  const a = trialState(t),
    i = e.rules.adaptations.trial,
    n = i.titles[a.title - 1],
    s = i.titles[a.title],
    o = (l, u = {}) => ({
      $dialogue: [
        {
          label: message(l, u),
        },
      ],
    }),
    r = (l, u) => ({
      $dialogue: [
        {
          label: message(l),
          action: u,
        },
      ],
    }),
    c = [
      r("trial.learn", "@triallearn"),
      {
        $dialogue: [
          {
            label: message("trial.bringAmulet"),
          },
          {
            label: message("trial.deliver"),
            action: "@triallearn",
          },
        ],
      },
      {
        $dialogue: [
          {
            label: message("trial.bringPumpkin"),
          },
          {
            label: message("trial.deliver"),
            action: "@triallearn",
          },
        ],
      },
    ];
  return [
    o("trial.status", {
      honor: a.honor,
      title: n ? entityText("honorTitles", a.title) : message("trial.noTitle"),
    }),
    ...(t.trialRun
      ? [
          o("trial.floor", {
            floor: t.trialRun.floor,
            status: message(t.trialRun.cleared ? "trial.cleared" : "trial.kill"),
          }),
          r("trial.next", "@trialnext"),
          r("trial.leave", "@trialleave"),
        ]
      : a.stage < 3
        ? [c[a.stage]]
        : [r("trial.enter", "@trialenter")]),
    ...(s
      ? [
          o("trial.nextTitle", {
            title: entityText("honorTitles", a.title + 1),
            cost: s.cost,
          }),
          r("trial.promote", "@trialtitle"),
        ]
      : []),
  ];
}
function Lo(e, t, a, i = Math.floor((Date.now() + 8 * 36e5) / 864e5)) {
  const n = e.rules.adaptations.trial,
    s = e.requireNPC(t),
    o = trialState(t);
  if (![n.entranceNpc, n.insideNpc].includes(s.id))
    throw new b(message("core.trial.trialAction.3106f8fba7"));
  if (a === "@triallearn") {
    if (o.stage >= 3) throw new b(message("core.trial.trialAction.182420f9c1"));
    const r =
      o.stage === 1 ? "\u9ED1\u94C1\u62A4\u7B26" : o.stage === 2 ? "\u5357\u74DC\u5934" : null;
    if (r) {
      const c = t.inventory.filter((u) => u && e.defs.get(u.id)?.DreamName === r),
        l = c.find((u) => !Pe(u)) || c[0];
      if ((assertEquipmentDisposable(l), !l))
        throw new b(
          message("core.trial.trialAction.3ac3294db7", {
            p0: entityText("items", e.rules.items.find((u) => u.DreamName === r).Index),
          }),
        );
      ((t.inventory[t.inventory.indexOf(l)] = null), (t.gold += 5e4));
    }
    (e.gainXP(t, o.stage ? 5e4 : 1e4),
      o.stage++,
      e.say(
        message("core.trial.trialAction.835adcbc64", {
          p0: o.stage,
        }),
      ));
  } else if (a === "@trialtitle") {
    const r = n.titles[o.title];
    if (!r) throw new b(message("core.trial.trialAction.6026d8c966"));
    if (o.honor < r.cost)
      throw new b(
        message("core.trial.trialAction.7c06dbef5c", {
          p0: r.cost,
        }),
      );
    ((o.honor -= r.cost),
      o.title++,
      e.refresh(t),
      e.say(
        message("core.trial.trialAction.8579f91ac6", {
          p0: entityText("honorTitles", o.title),
        }),
      ));
  } else if (a === "@trialenter") {
    if (s.id !== n.entranceNpc || o.stage < 3)
      throw new b(message("core.trial.trialAction.943cc78060"));
    if (t.trialRun || t.challengeRun || t.treasureRun)
      throw new b(message("core.trial.trialAction.381831c37b"));
    if ((o.day !== i && ((o.day = i), (o.attempts = 0)), o.attempts >= n.attempts))
      throw new b(message("core.trial.trialAction.149859ba4e"));
    const r = e.region(n.map),
      c = e.geometry.get(n.map);
    if (!c || c.solid[r.center[1] * c.width + r.center[0]])
      throw new b(message("core.trial.trialAction.7d65345670"));
    const l = e.freeNear(
      n.map,
      {
        x: r.center[0],
        y: r.center[1],
      },
      3,
    );
    if (!l) throw new b(message("core.trial.trialAction.293bc02306"));
    (o.attempts++,
      (t.trialRun = {
        floor: 0,
        deadline: e.time + n.minutes * 6e4,
        cleared: !0,
        pendingHonor: 0,
      }),
      (e.maps[n.map] = {
        actors: [],
        respawns: {},
      }),
      (t.map = n.map),
      (t.x = l.x),
      (t.y = l.y),
      (t.target = 0),
      e.bringPets(t),
      e.emit("MapChanged", {
        MapIndex: t.map,
      }),
      (e.npc = n.insideNpc),
      e.say(message("core.trial.trialAction.ed3265354e")));
  } else if (a === "@trialnext") {
    const r = t.trialRun;
    if (!r || s.id !== n.insideNpc || t.map !== n.map)
      throw new b(message("core.trial.trialAction.ac9b21455d"));
    if (!r.cleared) throw new b(message("core.trial.trialAction.ae8fb3994e"));
    if (r.floor >= 99) {
      at(e, t, message("trial.complete"));
      return;
    }
    const c = n.floors[r.floor],
      l = e.rules.adaptations.dreamRuntime?.hell?.trialCandidates,
      u =
        isHell(e.rules) && !c.boss && l?.length
          ? e.monsters.get(l[e.rng.next(l.length)])
          : e.rules.monsters.find((g) => g.Name === c.monster),
      h = e.freeNear(
        t.map,
        {
          x: t.x + 4,
          y: t.y,
        },
        8,
      );
    if (!h) throw new b(message("core.trial.trialAction.a3744f6549"));
    (Ct(t),
      r.floor++,
      (r.cleared = !1),
      (e.map(t.map).actors = e
        .map(t.map)
        .actors.filter((g) => g.friendly || g.kind !== "monster")));
    const p = e.newMonster(u, t.map, h);
    ((p.hp = p.maxHP = c.hp),
      (p.stats.HP = c.hp),
      isHell(e.rules) &&
        !c.boss &&
        Object.assign(p.stats, {
          MinAC: 50,
          MaxAC: 50,
          MinMAC: 50,
          MaxMAC: 50,
          MinDC: 80,
          MaxDC: 120,
        }),
      (p.special = {
        ...p.special,
        trialFloor: r.floor,
        trialXP: c.xp,
        trialBoss: c.boss,
      }),
      e.map(t.map).actors.push(p),
      e.say(
        message("core.trial.trialAction.43bd68bc0b", {
          p0: r.floor,
          p1: o.honor,
        }),
      ),
      ti(e, p));
  } else if (a === "@trialleave") {
    at(e, t);
    return;
  }
  e.emit("NPCResponse", {
    NPCID: s.id,
    Page: [],
  });
}
function Ct(e) {
  const t = e.trialRun;
  if (!t) return;
  const a = Math.max(0, t.pendingHonor || 0);
  (a && t.settledFloor !== t.floor && ((trialState(e).honor += a), (t.settledFloor = t.floor)),
    (t.pendingHonor = 0));
}
function Wo(e, t) {
  const a = t.trialRun;
  if (!a || a.cleared || t.map !== e.rules.adaptations.trial.map) return;
  const i = e.rules.adaptations.trial.floors[a.floor - 1];
  i &&
    ((a.cleared = !0),
    (a.pendingHonor = i.honor),
    isHell(e.rules) || Ct(t),
    e.say(
      message("core.trial.trialKill.a5ad08e078", {
        p0: a.floor,
        p1: i.honor,
      }),
    ),
    a.floor === 99 && at(e, t, message("trial.completeFinal")));
}
function at(e, t, a = message("trial.left")) {
  if (!t.trialRun) return;
  Ct(t);
  const i = e.rules.adaptations.trial,
    n = i.map,
    s = e.rules.world.npcs.find((c) => c.id === i.entranceNpc),
    o = [];
  for (let c = 1; c <= 3; c++)
    for (let l = -c; l <= c; l++)
      for (let u = -c; u <= c; u++)
        Math.max(Math.abs(u), Math.abs(l)) === c &&
          o.push({
            x: s.at[0] + u,
            y: s.at[1] + l,
          });
  const r = o.find(
    (c) =>
      !e.rules.world.npcs.some((l) => l.map === s.map && l.at[0] === c.x && l.at[1] === c.y) &&
      e.walkable(s.map, c.x, c.y, t.id),
  );
  if (!r) throw new b(message("core.trial.leaveTrial.8e8b1271cf"));
  (delete t.trialRun,
    (t.map = s.map),
    (t.x = r.x),
    (t.y = r.y),
    (t.target = 0),
    (t.dead = !1),
    (t.hp = t.maxHP),
    (t.mp = t.maxMP),
    (t.buffs = []),
    (e.npc = 0),
    delete e.maps[n],
    (e.events = e.events.filter((c) => c.map !== n)),
    e.bringPets(t),
    e.emit("MapChanged", {
      MapIndex: s.map,
    }),
    e.emit("NPCResponse", {
      NPCID: 0,
      Page: [],
    }),
    e.say(a));
}


function jo(e, t) {
  t.trialRun &&
    (t.map !== e.rules.adaptations.trial.map || e.time >= t.trialRun.deadline) &&
    at(e, t, message("trial.ended"));
}
function craftingState(e) {
  return (e.crafting ??= {
    stage: 0,
    skills: {},
  });
}
function $o(e, t, a = !1) {
  const i = e.rules.adaptations.forge;
  if (e.requireNPC(t).id !== i.artisanNpc)
    throw new b(message("core.crafting.craftingLearn.d0a0d01e8a"));
  const n = craftingState(t);
  if (t.level < 35) throw new b(message("core.crafting.craftingLearn.a68010b921"));
  if (n.stage >= (a ? 2 : 1)) throw new b(message("core.crafting.craftingLearn.788eae4b6b"));
  if (a && n.stage !== 1) throw new b(message("core.crafting.craftingLearn.efd1179990"));
  const s = a ? "\u91D1\u952D" : "\u94DC\u77FF",
    o = a ? 25 : 14,
    r = t.inventory.find(
      (c) => c && e.defs.get(c.id)?.DreamName === s && (c.materialQuality || 0) >= o,
    );
  if (!r)
    throw new b(
      message("core.crafting.craftingLearn.04c8734c45", {
        p0: o,
        p1: entityText("items", e.rules.items.find((c) => c.DreamName === s).Index),
      }),
    );
  if (a) {
    const c = e.rules.items.find((l) => l.DreamName === "\u6F5C\u80FD\u77F3\u2461");
    if (r.count > 1 && !t.inventory.some((l) => !l) && !t.inventory.some((l) => l?.id === c.Index))
      throw new b(message("core.crafting.craftingLearn.f4f8709c7f"));
  }
  (--r.count === 0 && (t.inventory[t.inventory.indexOf(r)] = null),
    (n.stage = a ? 2 : 1),
    a &&
      e.give(
        t,
        e.newItem(e.rules.items.find((c) => c.DreamName === "\u6F5C\u80FD\u77F3\u2461").Index, 2),
        !1,
      ));
  for (const c of a ? ["equipment"] : ["ore", "wood", "gem", "cloth"])
    n.skills[c] = {
      level: 1,
      xp: 0,
    };
  e.say(
    message(
      a ? "core.crafting.craftingLearn.d6de453710" : "core.crafting.craftingLearn.546f3b03b3",
    ),
  );
}
function craftLevel(e, t) {
  return craftingState(e).skills[t]?.level || 0;
}
function Go(e, t, a, i = 1) {
  if (a === "talent") return;
  const n = craftingState(t).skills[a];
  n && ((n.xp += i), Ci(e, t, a, !0));
}
function Ci(e, t, a, i = !1) {
  const n = t.crafting?.skills[a];
  if (!n || a === "talent") return;
  const s = e.rules.adaptations.forge.crafting,
    o =
      e.rules.adaptations.dreamRuntime?.hell?.craftingExperience[a] ??
      s.experienceBySkill?.[a] ??
      s.experience;
  for (; n.level < (a === "equipment" ? 10 : 9) && n.xp >= o[n.level - 1]; )
    ((n.xp -= o[n.level - 1]),
      n.level++,
      i &&
        e.say(
          message("core.crafting.craftXP.6339b79af5", {
            p0: n.level,
          }),
        ));
}
function Di(e, t, a) {
  const i = craftLevel(e, t.skill),
    n = t.level || 1;
  return t.processing
    ? Math.max(
        1,
        Math.floor(
          a.reduce((s, o) => s + (o.materialQuality || 1) * o.count, 0) *
            Math.min(1, 0.4 + 0.2 * (i - n)),
        ),
      )
    : t.refining
      ? Math.min(20, 8 + Math.max(0, i - n) * 4) +
        Math.floor((a.reduce((s, o) => s + ke(o), 0) * 10) / a.length)
      : 0;
}
function Ii(e, t, a) {
  const i = e.defs.get(t.id),
    n = String(i.DreamName || i.Name),
    s = a.reduce((r, c) => r + (c.materialQuality || 0) * c.count, 0);
  return i.Type === "Amulet"
    ? 0
    : (i.Type === "Weapon"
        ? i.RequiredAmount <= 60
          ? [121, 161, 201, 321, 401]
          : [106, 141, 176, 281, 351]
        : i.Type === "Helmet"
          ? n.includes("\u5357\u74DC")
            ? [91, 121, 151, 241, 301]
            : [76, 101, 126, 201, 251]
          : i.Type === "Armour"
            ? [106, 141, 176, 281, 351]
            : ["Bracelet", "Necklace", "Ring"].includes(i.Type)
              ? [151, 201, 251, 401, 501]
              : n.includes("\u738B\u77F3")
                ? [121, 161, 201, 321, 401]
                : n.includes("\u4EA1\u9B42\u68FA")
                  ? [101, 121, 151, 241, 301]
                  : [76, 101, 151, 201, 251]
      ).filter((r) => s >= r).length;
}
var ma = ["MaxDC", "MaxMC", "MaxAC", "MaxSC", "MaxMAC", "Luck", "Accuracy", "Agility"];
function forgePoints(e) {
  return ma.reduce((t, a) => t + Math.max(0, e.added[a] || 0), 0);
}
function Hi(e, t, a) {
  const i = e.rules.adaptations.forge;
  if (!i) throw new b(message("core.forge.forgeQuote.135a98ae94"));
  let n, s;
  if (a.Mode === "cube") {
    const C = a.Selected;
    if (!Array.isArray(C) || !C.length || C.length > 8 || new Set(C).size !== C.length)
      throw new b(message("core.forge.forgeQuote.26b7c68817"));
    const N = C.map(
      (B) =>
        t.inventory.find((H) => H?.uid === B) ||
        t.questInventory.find(
          (H) =>
            H &&
            H.uid === B &&
            i.recipes.some((V) => V.mode === "pandora" && V.inputs.some((ee) => ee.item === H.id)),
        ),
    );
    if (N.some((B) => !B || B.id === i.boxId))
      throw new b(message("core.forge.forgeQuote.052dc5ca26"));
    const R = N;
    (R.forEach(assertEquipmentDisposable), (s = [...C]));
    const I = R.find((B) => B.id === i.mixId);
    if (I) {
      n = I.uid;
      const B = R.filter((H) => H !== I);
      a = {
        Mode: "mix",
        Target: B[0]?.uid,
        Selected: B.map((H) => H.uid),
      };
    } else {
      const B = i.recipes.find(
        (V) =>
          V.mode === "pandora" &&
          R.every((ee) => V.inputs.some((oe) => oe.item === ee.id)) &&
          V.inputs.every(
            (ee) =>
              R.filter((oe) => oe.id === ee.item).reduce((oe, we) => oe + we.count, 0) >= ee.count,
          ),
      );
      if (!B) throw new b(message("core.forge.forgeQuote.e098ab1670"));
      const H = [];
      for (const V of B.inputs) {
        let ee = V.count;
        for (const oe of R.filter((we) => we.id === V.item)) {
          const we = Math.min(ee, oe.count);
          (we &&
            H.push({
              uid: oe.uid,
              count: we,
            }),
            (ee -= we));
        }
      }
      if (H.length !== R.length) throw new b(message("core.forge.forgeQuote.2933c380f0"));
      a = {
        Mode: "recipe",
        Recipe: B.id,
        Ingredients: H,
      };
    }
  }
  const o = String(a.Mode),
    r = t.inventory.find((C) => C?.uid === Number(a.Target)),
    c = t.inventory.find((C) => C?.uid === Number(a.Material));
  if (o === "identify") throw new b(message("core.forge.forgeQuote.66a920f6f4"));
  const l = [],
    u = [],
    h = [],
    p = [...t.inventory, ...t.questInventory].filter((C) => !!C && !Pe(C));
  let g = "",
    y = "",
    f = 0,
    v = "",
    x = [],
    m,
    M = -1,
    k = 0,
    w = 1;
  if (o === "recipe") {
    if (((m = i.recipes.find((N) => N.id === String(a.Recipe))), !m))
      throw new b(message("core.forge.forgeQuote.db530d007a"));
    if (m.mode === "pandora" && !t.inventory.some((N) => N?.id === i.boxId))
      throw new b(message("core.forge.forgeQuote.68ef58e0c7"));
    m.skill &&
      m.skill !== "talent" &&
      craftLevel(t, m.skill) < (m.level || 1) &&
      (y = message("forge.requirement", {
        skill: entityText("crafting", m.skill),
        level: m.level || 1,
      }));
    const C = m.processing ? Math.min(5, Math.max(1, Math.floor(Number(a.Count) || 1))) : 1;
    if (
      ((w = C),
      l.push(
        ...m.inputs.map((N) => ({
          ...N,
          count: N.count * C,
        })),
      ),
      u.push(m.output),
      (f = m.gold * C),
      (g = message("recipe." + m.id, {
        output: entityText("items", m.output.item),
        input: entityText("items", m.inputs[0].item),
      })),
      a.Ingredients !== void 0)
    ) {
      if (!Array.isArray(a.Ingredients)) throw new b(message("core.forge.forgeQuote.bbacd00f52"));
      const N = new Set();
      for (const R of a.Ingredients) {
        const I = p.find((H) => H.uid === R.uid),
          B = R.count;
        if (
          !I ||
          N.has(I.uid) ||
          !Number.isSafeInteger(B) ||
          B < 1 ||
          B > I.count ||
          !l.some((H) => H.item === I.id)
        )
          throw new b(message("core.forge.forgeQuote.96c6a05c19"));
        (N.add(I.uid),
          h.push({
            uid: I.uid,
            item: I.id,
            count: B,
          }));
      }
      if (
        l.some(
          (R) => h.filter((I) => I.item === R.item).reduce((I, B) => I + B.count, 0) !== R.count,
        )
      )
        throw new b(message("core.forge.forgeQuote.0ef60a70ef"));
    } else
      for (const N of l) {
        let R = N.count;
        for (const I of p
          .filter((B) => B.id === N.item)
          .sort(
            (B, H) =>
              (B.materialQuality || 0) - (H.materialQuality || 0) ||
              forgePoints(B) - forgePoints(H) ||
              B.uid - H.uid,
          )) {
          if (R <= 0) break;
          const B = Math.min(R, I.count);
          (h.push({
            uid: I.uid,
            item: I.id,
            count: B,
          }),
            (R -= B));
        }
      }
    x = h.map((N) => N.uid);
  } else if (o === "mix") {
    if (!t.inventory.some((H) => H?.id === i.boxId))
      throw new b(message("core.forge.forgeQuote.68ef58e0c7"));
    if (!r) throw new b(message("core.forge.forgeQuote.eacdc6ab6e"));
    const C = e.defs.get(r.id),
      N = Number(C.DreamGrade);
    if (
      ![0, 2, 3, 4, 5, 6, 7].includes(N) ||
      String(C.DreamName || C.Name).startsWith("\u5929\u9F99\u9879\u94FE")
    )
      throw new b(message("core.forge.forgeQuote.23eb261b8e"));
    const R = Array.isArray(a.Selected)
        ? a.Selected.map(Number)
        : [
            r.uid,
            ...t.inventory
              .filter((H) => !!H && H.id === r.id && H.uid !== r.uid && !Pe(H))
              .sort((H, V) => forgePoints(H) - forgePoints(V) || H.uid - V.uid)
              .slice(0, 2)
              .map((H) => H.uid),
          ],
      I = R.map((H) => t.inventory.find((V) => V?.uid === H));
    if (
      (I.forEach(assertEquipmentDisposable),
      new Set(R).size !== R.length ||
        I.length < 3 ||
        I.some((H) => !H || H.id !== r.id || H.count !== 1))
    )
      throw new b(message("core.forge.forgeQuote.ab95b8372e"));
    if (I.some((H) => H && forgePoints(H) >= 8))
      throw new b(message("core.forge.forgeQuote.44a4cbc171"));
    if (isHell(e.rules) && I.some((H) => H?.handmade))
      throw new Error("\u624B\u5DE5\u88C5\u5907\u4E0D\u80FD\u4F7F\u7528\u6DF7\u5143\u77F3\u3002");
    const B = isHell(e.rules) ? hellMixChance(I.map((H) => forgePoints(H))) : i.mixChance;
    ((k = B),
      isHell(e.rules) && (f = 15e3 * (Math.max(...I.map((H) => forgePoints(H))) + 1)),
      (x = R),
      l.push({
        item: i.mixId,
        count: 1,
      }),
      (g = message("forge.mixDescription", {
        count: I.length,
        chance: B,
      })));
  } else if (o === "merge") {
    const C = i.essences.find((I) => I.item === c?.id),
      N = C && i.essences.find((I) => I.grade === C.grade + 1 && I.stat === C.stat),
      R = c && isHell(e.rules) ? i.crystalMerges?.[c.id] : void 0;
    if (!R && (!C || !N)) throw new b(message("core.forge.forgeQuote.5f2745c8a9"));
    if (r) throw new b(message("core.forge.forgeQuote.ce273c94ef"));
    R && c
      ? (l.push({
          item: c.id,
          count: R.count,
        }),
        u.push({
          item: R.item,
          count: 1,
        }),
        (g = message("forge.crystalMergeDescription", {
          count: R.count,
          input: entityText("items", c.id),
          output: entityText("items", R.item),
        })))
      : C &&
        N &&
        ((f = i.fees.merge * C.grade),
        l.push({
          item: C.item,
          count: 20,
        }),
        u.push({
          item: N.item,
          count: 1,
        }),
        (g = message("forge.mergeDescription")));
  } else {
    if (!r || r.count !== 1) throw new b(message("core.forge.forgeQuote.46f045e474"));
    const C = e.defs.get(r.id),
      N = Number(C.DreamGrade),
      R = forgePoints(r);
    if (
      !C.DreamType ||
      (["dismantle", "enhance", "reset", "crystal"].includes(o) &&
        !e.rules.adaptations.dreamRuntime?.statPools[String(C.DreamType)])
    )
      throw new b(message("core.forge.forgeQuote.436bf1d625"));
    if (o === "identify") throw new b(message("core.forge.forgeQuote.66a920f6f4"));
    if (o === "awaken") {
      if (!r.handmade && !C.DreamRawItem?.Handmake)
        throw new b(message("core.forge.forgeQuote.f8a3c820c0"));
      if (C.Type !== "Weapon" && Number(C.DreamType) !== 6 && C.DreamName !== "\u5357\u74DC\u5934")
        throw new b(message("core.forge.forgeQuote.884a71edee"));
      if (R < 1) throw new b(message("core.forge.forgeQuote.8184c98ae7"));
      if (r.affixes?.length) throw new b(message("core.forge.forgeQuote.29047386ac"));
      if (
        !Object.values(e.rules.adaptations.dreamRuntime.affixes).some(
          (B) =>
            B.Weight > 0 &&
            Object.values(B.Poses).includes(Number(C.DreamType)) &&
            Object.values(B.Affixes).some((H) => H.Grade <= N),
        )
      )
        throw new b(message("core.forge.forgeQuote.1d1dbf9d26"));
      const I = i.crafting?.talents[String(c?.id)];
      if (!I) throw new b(message("core.forge.forgeQuote.db1c5e9058"));
      ((v = String(Math.min(I, C.Type === "Weapon" ? 5 : 3))),
        l.push({
          item: c.id,
          count: 1,
        }),
        (g = message("forge.awakenDescription", {
          count: v,
        })));
    } else if (o === "potential" || o === "potentialChoose") {
      if (!r.handmade && !C.DreamRawItem?.Handmake)
        throw new b(message("core.forge.forgeQuote.92addbc485"));
      if (o === "potentialChoose") {
        if (!r.potentialOptions?.[Number(a.Choice)])
          throw new b(message("core.forge.forgeQuote.6c861e241a"));
        ((v = String(a.Choice)), (g = message("forge.chooseDescription")));
      } else {
        if ((r.potentialOptions?.length || 0) >= 5)
          throw new b(message("core.forge.forgeQuote.fd4b3dca21"));
        const I = e.defs.get(c?.id || 0),
          B = Number(I?.DreamRawItem?.Hide || 0);
        if (!String(I?.DreamName).startsWith("\u6F5C\u80FD\u77F3"))
          throw new b(message("core.forge.forgeQuote.369f9d002e"));
        const H = C.Type === "Stone" && C.DreamType === 16 ? "Gem" : C.Type,
          V = Math.min(B, Number(C.DreamPotentialCap ?? C.DreamGrade)),
          ee = Object.keys(i.potentials?.[H] || {})
            .map(Number)
            .filter((oe) => oe <= V);
        if (!ee.length) throw new b(message("core.forge.forgeQuote.874ec5991e"));
        ((v = H + ":" + Math.max(...ee)),
          l.push({
            item: c.id,
            count: 1,
          }),
          (g = message("forge.potentialDescription", {
            attempt: (r.potentialOptions?.length || 0) + 1,
          })));
      }
    } else if (o === "crystal") {
      if (String(C.DreamName).startsWith("\u5929\u9F99\u9879\u94FE"))
        throw new b(message("core.forge.forgeQuote.e612e0c45e"));
      const I = Number(e.defs.get(c?.id || 0)?.DreamRawItem?.Hide || 0);
      if (!String(e.defs.get(c?.id || 0)?.DreamName).startsWith("\u51DD\u6676\u77F3") || I < N)
        throw new b(message("core.forge.forgeQuote.6cdf3f0a25"));
      if (!i.fees.crystalByStoneGrade[String(I)] || N < 1)
        throw new b(message("core.forge.forgeQuote.555a0b953e"));
      if (R >= 8) throw new b(message("core.forge.forgeQuote.21ff3969ad"));
      ((f = i.fees.crystalByStoneGrade[String(I)] * (R + 1)),
        (k = (N >= 5 ? i.crystalRates.highGrade : i.crystalRates.normal)[R]),
        l.push({
          item: c.id,
          count: 1,
        }),
        (g = message("forge.crystalDescription", {
          from: R,
          to: R + 1,
          chance: k,
          loss: i.crystalLoseChance,
        })));
    } else if (o === "reset") {
      if (R < 1) throw new b(message("core.forge.forgeQuote.6df3648484"));
      if (R > 8) throw new b(message("core.forge.forgeQuote.1da2e99ec4"));
      (l.push({
        item: i.resetId,
        count: 1,
      }),
        (f = i.fees.reset * Math.max(1, N - 6) * R),
        (g = message("forge.resetDescription", {
          points: R,
        })));
    } else {
      if (N < 2 || N > 6) throw new b(message("core.forge.forgeQuote.3d24a74942"));
      if (o === "dismantle") {
        assertEquipmentDisposable(r);
        for (const I of ["MaxDC", "MaxMC", "MaxSC"]) {
          const B = r.added[I] || 0;
          if (B > 0) {
            const H = i.essences.find((V) => V.grade === N - 1 && V.stat === I);
            if (!H) throw new b(message("core.forge.forgeQuote.0e4b96e457"));
            u.push({
              item: H.item,
              count: B,
            });
          }
        }
        if (!u.length) throw new b(message("core.forge.forgeQuote.95fd5267e7"));
        ((f = i.fees.dismantle * (N - 1) * u.reduce((I, B) => I + B.count, 0)),
          (g = message("forge.dismantleDescription")));
      } else if (o === "enhance") {
        const I = i.essences.find((B) => B.item === c?.id && B.grade >= N);
        if (!I)
          throw new b(
            message("core.forge.forgeQuote.5c90c49396", {
              p0: N,
            }),
          );
        if (R >= 5) throw new b(message("core.forge.forgeQuote.9d820f44c6"));
        ((v = I.stat),
          l.push({
            item: I.item,
            count: R < 3 ? 1 : R === 3 ? 2 : 3,
          }),
          (f = i.fees.enhance * N * (R + 1)),
          (g = message("forge.enhanceDescription", {
            from: R,
            to: R + 1,
            stat: message("gear.stat." + v.slice(3)),
          })));
      } else throw new b(message("core.forge.forgeQuote.eecbe4c7a3"));
    }
  }
  m &&
    !y &&
    l.some((C) => h.filter((N) => N.item === C.item).reduce((N, R) => N + R.count, 0) < C.count) &&
    (y = message("forge.insufficient"));
  const D = new Map();
  for (const C of l) D.set(C.item, (D.get(C.item) || 0) + C.count);
  const E = !y && [...D].every(([C, N]) => e.count(t, C) >= N) && t.gold >= f,
    W = h.map((C) => ({
      ...p.find((N) => N.uid === C.uid),
      count: C.count,
    })),
    j = m ? Di(t, m, W) : 0,
    A = m?.handmade
      ? Ii(
          e,
          {
            id: m.output.item,
          },
          W,
        )
      : void 0;
  return {
    mode: o,
    selected: x,
    allocations: h,
    outputQuality: j,
    outputStars: A,
    requirement: y,
    recipe: m,
    processingInputs: w,
    affixIndex: M,
    target: r?.uid,
    inputs: [...D].map(([C, N]) => ({
      item: C,
      count: N,
    })),
    outputs: u,
    gold: f,
    description: g,
    stat: v,
    chance: k,
    canForge: E,
    cubeMaterial: n,
    cubeSelection: s,
  };
}


function Qo(e, t, a) {
  const i = Hi(e, t, a);
  if (!i.canForge) throw new b(i.requirement || message("forge.insufficient"));
  const n = structuredClone({
      inventory: t.inventory,
      questInventory: t.questInventory,
      gold: t.gold,
      crafting: t.crafting,
    }),
    s = structuredClone({
      seed: e.rng.seed,
      i: e.rng.i,
      j: e.rng.j,
    }),
    o = e.nextId;
  try {
    let r = message("forge.complete");
    const c = i.selected
      .map((h) => [...t.inventory, ...t.questInventory].find((p) => p?.uid === h))
      .filter(Boolean)
      .map((h) => structuredClone(h));
    if (i.recipe) {
      for (const h of c) h.count = i.allocations.find((p) => p.uid === h.uid).count;
      for (const h of i.allocations) {
        const p = t.inventory.some((y) => y?.uid === h.uid) ? t.inventory : t.questInventory,
          g = p.find((y) => y?.uid === h.uid);
        ((g.count -= h.count), g.count || (p[p.indexOf(g)] = null));
      }
    } else if (i.cubeMaterial) {
      const h = t.inventory.find((p) => p?.uid === i.cubeMaterial);
      --h.count === 0 && (t.inventory[t.inventory.indexOf(h)] = null);
    } else for (const h of i.inputs) e.consume(t, h.item, h.count);
    const l = t.inventory.find((h) => h?.uid === i.target);
    if (i.mode === "identify" && l) for (const h of l.affixes || []) h.revealed = !0;
    if (
      (i.mode === "awaken" &&
        l &&
        ot(l, e.defs.get(l.id), e.rng, e.rules.adaptations.dreamRuntime.affixes, Number(i.stat)),
      i.mode === "potential" && l)
    ) {
      const [h, p] = i.stat.split(":"),
        g = e.rules.adaptations.forge.potentials[h][p],
        y = structuredClone(g[e.rng.next(g.length)]);
      ((l.potentialOptions ??= []),
        (l.potential = {
          ...y,
          rolls: l.potentialOptions.length + 1,
        }),
        l.potentialOptions.push(l.potential));
    }
    if (
      (i.mode === "potentialChoose" && l && (l.potential = l.potentialOptions[Number(i.stat)]),
      i.mode === "mix")
    ) {
      const h = c.sort((p, g) => forgePoints(g) - forgePoints(p) || p.uid - g.uid)[0];
      for (const p of i.selected) t.inventory[t.inventory.findIndex((g) => g?.uid === p)] = null;
      if (isHell(e.rules)) {
        const p = e.rng.next(1e4) < hellMixChance(c.map(forgePoints)) * 100,
          g = e.newItem(h.id);
        if ((it(e, g, p ? Math.min(5, forgePoints(h) + 1) : forgePoints(h)), !e.give(t, g, !1)))
          throw new Error("\u80CC\u5305\u7A7A\u95F4\u4E0D\u8DB3");
        r = message(p ? "forge.mixSuccess" : "forge.mixFailed");
      } else {
        if (e.rng.next(100) < e.rules.adaptations.forge.mixChance) {
          const p = Math.min(8, forgePoints(h) + 1);
          (it(e, h, p),
            delete h.affixes,
            delete h.potential,
            delete h.potentialOptions,
            delete h.weaponGrowth,
            (r = message("forge.mixSuccess")));
        } else r = message("forge.mixFailed");
        if (!e.give(t, h, !1)) throw new b(message("core.forge.forge.f4f8709c7f"));
      }
    }
    if (i.mode === "crystal" && l) {
      const h = forgePoints(l),
        p = e.rules.adaptations.forge;
      let g = h;
      (e.rng.next(100) < i.chance
        ? ((g = h + 1), (r = message("forge.crystalSuccess")))
        : e.rng.next(100) < p.crystalLoseChance
          ? ((g = Math.max(0, h - 1)), (r = message("forge.crystalLost")))
          : (r = message("forge.crystalFailed")),
        it(e, l, g));
    }
    (i.mode === "dismantle" &&
      (t.inventory[t.inventory.findIndex((h) => h?.uid === i.target)] = null),
      i.mode === "enhance" && l && (l.added[i.stat] = (l.added[i.stat] || 0) + 1),
      i.mode === "reset" && l && it(e, l, forgePoints(l)));
    for (const h of i.outputs) {
      const p = e.newItem(h.item, h.count);
      if (((p.bound = i.mode === "recipe"), i.recipe)) {
        const g = i.recipe,
          y = Di(t, g, c);
        (y && (p.materialQuality = y),
          g.handmade &&
            ((p.handmade = !0),
            it(e, p, Ii(e, p, c)),
            e.rules.adaptations.dreamRuntime &&
              la(p, e.defs.get(p.id), e.rng, e.rules.adaptations.dreamRuntime)));
      }
      if (!e.give(t, p, !1)) throw new b(message("core.forge.forge.98d59f5b62"));
    }
    const u = i.recipe?.skill;
    if (u && u !== "talent" && craftLevel(t, u) > 0) {
      const h = (i.recipe?.experience || 1) * i.processingInputs;
      (Go(e, t, u, h),
        e.say(
          message("forge.skillExperienceEarned", {
            skill: entityText("crafting", u),
            amount: h,
          }),
        ));
    }
    ((t.gold -= i.gold),
      e.refresh(t),
      e.say(
        message("forge.result", {
          description: i.description,
          outcome: r,
        }),
      ));
  } catch (r) {
    throw (
      Object.assign(t, n),
      n.crafting === void 0 && delete t.crafting,
      Object.assign(e.rng, s),
      (e.nextId = o),
      r
    );
  }
}
function it(e, t, a) {
  const i = e.defs.get(t.id),
    n = Object.values(
      e.rules.adaptations.dreamRuntime.statPools[String(i.DreamType)]?.rawPool || {},
    );
  if (!n.length && a) throw new b(message("core.forge.randomizePoints.124368ca68"));
  for (const s of ma) delete t.added[s];
  for (let s = a; s > 0; ) {
    const o = ma[n[e.rng.next(n.length)]];
    if (!o) throw new b(message("core.forge.randomizePoints.8530d28df1"));
    const r = e.rng.next(s) + 1;
    ((t.added[o] = (t.added[o] || 0) + r), (s -= r));
  }
}
function je(e) {
  const t = e?.mode === "hell" ? void 0 : e?.worldFirework;
  return t?.enabled
    ? t
    : {
        enabled: !1,
        experienceBonusPercent: 0,
        dropBonusPercent: 0,
        magicFindBonus: 0,
      };
}
function dreamMagicFind(e, t = 0) {
  return e.defaultMagicFind + je(e).magicFindBonus + Math.max(0, t);
}
function dreamItemDropMultiplier(e, t = 0) {
  const a = e?.casual;
  return (
    (e?.mode === "hell" ? 2 : a?.enabled ? a.baseDropMultiplier + a.dropAdd : 1) +
    (je(e).dropBonusPercent + Math.max(0, t)) / 100
  );
}
function dreamExceptionalChance(e) {
  const t = Math.max(0, e);
  return Math.floor((100 * t) / (t + 250));
}
function dreamEquipmentExceptionalChance(e, t, a = dreamMagicFind(e)) {
  return Math.max(
    0,
    Math.min(100, dreamExceptionalChance(a) + (e.exceptionalGradeBonusPercent?.[String(t)] || 0)),
  );
}
var zo = ["MaxDC", "MaxMC", "MaxAC", "MaxSC", "MaxMAC", "Luck", "Accuracy", "Agility"];
function Vo(e, t, a, i, n = dreamMagicFind(i)) {
  if (
    (markNaturalAffixGeneration(e, n),
    !i.statPools[String(t.ExceptionalPoolType ?? t.DreamType)]?.rawPool ||
      a.next(100) >= dreamEquipmentExceptionalChance(i, effectiveAffixGrade(t), n))
  )
    return;
  let o = a.next(32768) % i.pointWeights.reduce((c, l) => c + l, 0),
    r = 0;
  for (; o >= i.pointWeights[r]; ) o -= i.pointWeights[r++];
  Bi(e, t, a, i, r + 1);
}
function Bi(e, t, a, i, n) {
  const s = i.statPools[String(t.ExceptionalPoolType ?? t.DreamType)]?.rawPool;
  if (!s) return;
  const o = Object.values(s);
  for (let r = 0; n > 0 && r < 100; r++) {
    const c = zo[o[a.next(o.length)]],
      l = a.next(n + 1, 1);
    c && ((e.added[c] = (e.added[c] || 0) + l), (n -= l));
  }
}
function Ti(e, t) {
  const a = t.adaptations.dreamRuntime;
  if (!a || (e.dreamRuntimeVersion || 0) >= a.version || !Array.isArray(e.roles) || !e.maps)
    return e;
  if (
    e.roles.some((n) => !Array.isArray(n.skills)) ||
    Object.values(e.maps).some((n) => !Array.isArray(n.actors))
  )
    throw new b(message("core.dream-runtime.migrateDreamRuntime.21031af477"));
  const i = structuredClone(e);
  i.dreamRuntimeVersion = a.version;
  for (const n of i.roles)
    for (const s of n.skills)
      t.skills.find((r) => r.Spell === s.Spell)?.DreamBookProgression &&
        (s.Level = Math.max(1, s.Level));
  for (const n of Object.values(i.maps))
    for (const s of n.actors) {
      if (s.kind !== "monster" || s.friendly) continue;
      const o = t.monsters.find((c) => c.Index === s.definition);
      if (o?.DreamOriginalId === void 0) continue;
      const r = s.maxHP > 0 ? s.hp / s.maxHP : 1;
      ((s.stats = {
        ...o.Stats,
      }),
        (s.maxHP = Math.max(1, o.Stats.HP || 1)),
        (s.hp = s.dead ? 0 : Math.max(1, Math.min(s.maxHP, Math.ceil(s.maxHP * r)))));
    }
  return i;
}
function dreamDropDenominator(e, t = 1) {
  return Math.max(1, Math.trunc(e / Math.max(1, t)));
}
function qi(e, t, a, i, n = 0) {
  if (i.next(40) !== 0) return [];
  const s = i.next(200) + 1,
    o = s === 1 ? 64 : s <= 5 ? 49 : s <= 12 ? 36 : s <= 20 ? 25 : 16,
    r = [
      ...new Set(
        t.flatMap((l) => (l.item !== null && a.get(l.item)?.Type === "Potion" ? [l.item] : [])),
      ),
    ];
  if (!r.length) return [];
  const c = Math.max(0, Math.floor((o - e.length - n) / r.length));
  return r.flatMap((l) => Array(c).fill(l));
}
function weighted2(e, t) {
  let a = e.rng.next(Object.values(t).reduce((i, n) => i + n, 0));
  for (const [i, n] of Object.entries(t)) {
    if (a < n) return Number(i);
    a -= n;
  }
  throw new b(message("core.chest-items.weighted.ada75b5f2e"));
}
function initializeChest(e, t) {
  const a = e.rules.adaptations.chestItems?.chests[String(t.id)];
  if (a && !t.chestReward) {
    if (t.count !== 1) throw new b(message("core.chest-items.initializeChest.0578f57960"));
    t.chestReward = {
      item: weighted2(e, a.items),
      points: weighted2(e, a.points),
    };
  }
}
function Li(e, t) {
  const a = t.adaptations.chestItems?.chests[String(e.id)];
  if (!a || e.chestReward || e.count !== 1) return;
  const i = (Math.imul(e.uid | 0, 1664525) ^ Math.imul(e.id, 1013904223)) | 0,
    n = new Et(i),
    s = (o) => {
      let r = n.next(Object.values(o).reduce((c, l) => c + l, 0));
      for (const [c, l] of Object.entries(o)) {
        if (r < l) return Number(c);
        r -= l;
      }
      throw new b(message("core.chest-items.weighted.ada75b5f2e"));
    };
  e.chestReward = {
    item: s(a.items),
    points: s(a.points),
  };
}
function Uo(e, t, a) {
  const i = e.rules.adaptations.chestItems;
  if (!i) return !1;
  const n = (v) => {
      --v.count === 0 && (t.inventory[t.inventory.indexOf(v)] = null);
    },
    s = e.rules.adaptations.bossGold;
  if (a.id === i.gold.item || a.id === s?.item) {
    const v = a.id === s?.item ? s.amount : e.rng.next(i.gold.max + 1, i.gold.min);
    if (!Number.isSafeInteger(t.gold + v))
      throw new b(message("core.chest-items.useChestItem.1e0236aada"));
    return (
      (t.gold += v),
      n(a),
      e.say(
        message("core.chest-items.useChestItem.b7933d2f60", {
          p0: v,
        }),
      ),
      !0
    );
  }
  const o = Object.entries(i.chests).find(([v, x]) => Number(v) === a.id || x.key === a.id);
  if (!o) return !1;
  const [r, c] = o,
    l = a.id === Number(r) ? a : t.inventory.find((v) => v?.id === Number(r)),
    u = a.id === c.key ? a : t.inventory.find((v) => v?.id === c.key);
  if (!l) throw new b(message("core.chest-items.useChestItem.54352aa4d3"));
  if (!u) throw new b(message("core.chest-items.useChestItem.6518e82aa7"));
  initializeChest(e, l);
  const h = l.chestReward;
  if (!c.items[String(h.item)] || !Object.hasOwn(c.points, String(h.points)))
    throw new b(message("core.chest-items.useChestItem.0d4dcef593"));
  const p = e.defs.get(h.item),
    g = t.inventory.indexOf(l),
    y = bagSlotAccepts(t, e.rules, p, g)
      ? g
      : t.inventory.findIndex((v, x) => !v && bagSlotAccepts(t, e.rules, p, x));
  if (y < 0) throw new b(message("storage.bagCategoryFull"));
  const f = e.newItem(h.item);
  return (
    e.rules.adaptations.dreamRuntime &&
      (markAffixPointDistribution(f, c.points),
      Bi(f, p, e.rng, e.rules.adaptations.dreamRuntime, h.points),
      la(f, p, e.rng, e.rules.adaptations.dreamRuntime)),
    (t.inventory[g] = null),
    n(u),
    (t.inventory[y] = f),
    e.emit("GainedItem", {
      Item: {
        ItemIndex: f.id,
        Count: 1,
      },
    }),
    e.say(
      message("core.chest-items.useChestItem.eb0583d042", {
        p0: entityText("items", p.Index),
        p1: h.points
          ? message("game.item.bonusPoints", {
              points: h.points,
            })
          : "",
      }),
    ),
    !0
  );
}


function De(e, t) {
  const a = e.equipment[3],
    i = [t.adaptations.testTalisman, t.adaptations.combatTestTalisman].find(
      (n) => n && n.itemId === a?.id,
    );
  return i && a?.id === i.itemId && (!a.maxDura || a.currentDura > 0) ? i : void 0;
}
function Ko(e, t) {
  const a = De(e, t);
  if (!a) {
    e.special && delete e.special.testTalismanRegenAt;
    return;
  }
  for (const i of ["DC", "MC", "SC"])
    for (const n of ["Min", "Max"])
      e.stats[n + i] = Math.trunc((e.stats[n + i] || 0) * a.combatMultiplier);
  for (const i of ["HP", "MP"]) e.stats[i] = Math.trunc((e.stats[i] || 0) * a.vitalityMultiplier);
}
function Xo(e, t, a) {
  const i = De(e, t);
  !i ||
    e.dead ||
    ((e.special ??= {}),
    e.special.testTalismanRegenAt === void 0 &&
      (e.special.testTalismanRegenAt = a + i.recoveryIntervalMs),
    !(a < Number(e.special.testTalismanRegenAt)) &&
      ((e.special.testTalismanRegenAt = a + i.recoveryIntervalMs),
      (e.hp = Math.min(
        e.maxHP,
        e.hp + Math.max(1, Math.trunc((e.maxHP * i.recoveryPercent) / 100)),
      )),
      (e.mp = Math.min(
        e.maxMP,
        e.mp + Math.max(1, Math.trunc((e.maxMP * i.recoveryPercent) / 100)),
      ))));
}
var ha = {
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
  },
  Wi = {
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
    ...ha,
  };
function gemTier(e) {
  return e.added.GemTier === 2 ? 2 : e.added.GemTier === 1 ? 1 : 0;
}
function _o(e, t, a, i, n) {
  if (!i.itemIds.includes(t.Index)) return;
  const s = i.bossProfiles.find((p) => p.monsters.includes(n?.Name || "")),
    o = s?.tierWeights || i.tierWeights;
  let r = a.next(o.reduce((p, g) => p + g, 0)),
    c = 0;
  for (; c < o.length - 1 && r >= o[c]; ) r -= o[c++];
  if (
    (s &&
      ((e.added.GemPower = s.mainGains[c]),
      (e.added.GemStatLimit = s.statLimit),
      (e.added.GemCountLimit = s.countLimit),
      (e.added.GemBaseChance = s.baseChance),
      (e.added.GemChanceStep = s.chanceStep)),
    !c)
  )
    return;
  e.added.GemTier = c;
  const l = i.itemJobs[String(t.Index)],
    u = i.highEffects.filter((p) => !l || !p.jobs || p.jobs.includes(l)),
    h = [i.rareEffects, ...(c === 2 ? [u] : [])];
  for (const [p, g] of h.entries()) {
    const y = g[a.next(g.length)],
      f = p === 0 ? s?.rareBonus || 0 : s?.highBonus || 0;
    e.added[y.stat] = Math.min(i.caps[y.stat], a.next(y.max + 1, y.min) + f);
  }
}
function gemLimits(e, t) {
  return {
    statLimit: t.added.GemStatLimit || e.Stats.HPDrainRatePercent || 0,
    countLimit: t.added.GemCountLimit || e.Stats.CriticalDamage || 0,
    baseChance: t.added.GemBaseChance || e.Stats.CriticalRate || 0,
    chanceStep: t.added.GemChanceStep ?? e.Stats.Reflect ?? 0,
  };
}
function gemPowers(e) {
  return Object.fromEntries(
    Object.keys(ha)
      .filter((t) => (e.added[t] || 0) > 0)
      .map((t) => [t, e.added[t]]),
  );
}
function er(e, t) {
  const a = Object.keys(Wi)
      .filter((n) => !(n in ha))
      .find((n) =>
        n === "Durability" ? e.Durability > 0 : (e.Stats[n] || 0) + (t.added[n] || 0) > 0,
      ),
    i =
      a === "Durability"
        ? t.maxDura
        : a
          ? ((e.Stats[a] || 0) + (t.added[a] || 0)) *
            (t.added.GemPower || (gemTier(t) === 2 ? 2 : 1))
          : 0;
  return {
    stat: a || "",
    gain: i,
  };
}
function ji(e, t) {
  return e === "GemGuardPercent"
    ? message("gem.guard", {
        value: t,
      })
    : e === "GemCriticalRatePercent"
      ? message("gem.crit", {
          value: t,
        })
      : e === "GemLifeStealPercent"
        ? message("gem.steal", {
            value: t,
          })
        : message("gem.effect", {
            stat: Wi[e] || e,
            value: e === "Durability" ? t / 1e3 : t,
            unit: e.endsWith("Percent") ? "%" : "",
          });
}
function tr(e, t) {
  for (const [a, i] of Object.entries(t.caps))
    e.stats[a] = Math.max(
      0,
      a === "GemLifeStealPercent" && e.job === "Warrior"
        ? e.stats[a] || 0
        : Math.min(i, e.stats[a] || 0),
    );
  e.stats.GemGuardPercent ||
    (e.buffs = e.buffs.filter((a) => a.type !== "\u5B9D\u77F3\u62A4\u76FE"));
}
var ar = {
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
function ir(e, t, a, i, n) {
  if (a.kind !== "monster" || a.friendly || n === "EmberSplash") return i;
  const s =
    t.kind === "player"
      ? t
      : t.friendly && t.master
        ? e.roles.find((c) => c.id === t.master && !c.dead)
        : void 0;
  if (!s) return i;
  let o =
    t.kind === "player"
      ? Object.entries(ar).reduce((c, [l, u]) => c + ((u.includes(n || "") && s.stats[l]) || 0), 0)
      : s.stats.GemPetDamagePercent || 0;
  const r = e.monsters.get(a.definition);
  if (
    (r &&
      (hasBossLootBudget(r, e.rules) ||
        ["swift", "elite", "captain"].includes(String(r.AdventureKind))) &&
      (o += s.stats.GemEliteDamagePercent || 0),
    (o = Math.min(e.rules.adaptations.gemEnhancement.damageBonusCap, o)),
    n === "Poisoning" && o > 0)
  ) {
    a.special ??= {};
    const c = Number(a.special.gemPoisonCarry || 0) + (i * o) / 100,
      l = Math.floor(c);
    return ((a.special.gemPoisonCarry = c - l), i + l);
  }
  return i + Math.floor((i * o) / 100);
}
function gemHealingBonus(e, t, a) {
  return ["Healing", "MassHealing"].includes(a || "")
    ? t + Math.floor((t * (e.stats.GemHealingPercent || 0)) / 100)
    : t;
}
function sr(e, t, a) {
  if (t.kind !== "player" || !t.stats.GemGuardPercent || a <= 0) return a;
  const i = t;
  i.special ??= {};
  let n = i.buffs.find((o) => o.type === "\u5B9D\u77F3\u62A4\u76FE" && o.until > e.time);
  const s = e.rules.adaptations.gemEnhancement;
  if (
    (!n &&
      i.hp - a <= (i.maxHP * s.guardThreshold) / 100 &&
      e.time >= Number(i.special.gemGuardReady || 0) &&
      ((i.special.gemGuardReady = e.time + s.guardCooldown),
      e.buff(
        i,
        "\u5B9D\u77F3\u62A4\u76FE",
        s.guardDuration,
        Math.max(1, Math.floor((i.maxHP * i.stats.GemGuardPercent) / 100)),
        {},
        i.id,
      ),
      (n = i.buffs.find((o) => o.type === "\u5B9D\u77F3\u62A4\u76FE")),
      e.say(message("core.gem-enhancement.absorbGemGuard.df53609215"))),
    n)
  ) {
    const o = Math.min(a, n.value);
    ((n.value -= o), (a -= o), n.value || (i.buffs = i.buffs.filter((r) => r !== n)));
  }
  return a;
}
function or(e, t, a, i) {
  if (
    e.kind !== "player" ||
    t.kind !== "monster" ||
    t.friendly ||
    i === "None" ||
    a <= 0 ||
    !e.stats.GemLifeStealPercent
  )
    return;
  const n = e;
  n.special ??= {};
  const s = Number(n.special.gemDrain || 0) + (a * n.stats.GemLifeStealPercent) / 100,
    o = Math.floor(s);
  ((n.hp = Math.min(n.maxHP, n.hp + o)), (n.special.gemDrain = s - o));
}
var $i = {
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
function Gi(e, t, a, i) {
  const n = e.defs.get(a.id),
    s = e.defs.get(i.id);
  if (n.Type !== "Gem" || !$i[s.Type] || a.uid === i.uid)
    throw new b(message("core.upgrades.upgradeQuote.3809c9e39e"));
  if ([1, 2, 5, 6].includes(n.Shape)) {
    const g = ["Weapon", "Necklace", "Ring", "Bracelet"].includes(s.Type),
      y = ["Armour", "Helmet", "Boots", "Belt"].includes(s.Type);
    if (
      s.Bind.includes("DontRepair") ||
      i.currentDura === i.maxDura ||
      !(([1, 5].includes(n.Shape) && g) || ([2, 6].includes(n.Shape) && y))
    )
      throw new b(message("core.upgrades.upgradeQuote.8e3ccf7e33"));
    return {
      chance: 100,
      repair: !0,
      stat: "",
      gain: 0,
      destructive: !1,
      effects: {},
      details: [message("gem.repairDurability")],
    };
  }
  if (![3, 4].includes(n.Shape)) throw new b(message("core.upgrades.upgradeQuote.e9de9f11c6"));
  if (
    s.Bind.includes("DontUpgrade") ||
    s.Unique !== "None" ||
    !n.Unique.split(",")
      .map((g) => g.trim())
      .includes($i[s.Type])
  )
    throw new b(message("core.upgrades.upgradeQuote.104fee785f"));
  const { stat: o, gain: r } = er(n, a),
    c = gemPowers(a),
    l = gemLimits(n, a);
  if (!o) throw new b(message("core.upgrades.upgradeQuote.a986284563"));
  const u =
    o === "Durability"
      ? Math.max(0, Math.trunc((i.maxDura - s.Durability) / 1e3))
      : i.added[o] || 0;
  if ((i.gemCount || 0) >= l.countLimit || u + (o === "Durability" ? r / 1e3 : r) > l.statLimit)
    throw new b(message("core.upgrades.upgradeQuote.d9cca84c52"));
  const h = l.chanceStep * (e.rules.gems.statIndependent ? u : i.gemCount || 0),
    p = h >= l.baseChance ? 0 : l.baseChance - h + (t.stats.GemRatePercent || 0);
  if (p <= 0) throw new b(message("core.upgrades.upgradeQuote.209cd4bc08"));
  return {
    chance: Math.max(0, Math.min(100, p)),
    repair: !1,
    stat: o,
    gain: r,
    effects: c,
    details: [ji(o, r), ...Object.entries(c).map(([g, y]) => ji(g, y))],
    destructive: !1,
  };
}
function rr(e, t, a, i) {
  const n = t.inventory.findIndex((u) => u?.uid === a),
    s = t.inventory.findIndex((u) => u?.uid === i),
    o = t.inventory[n],
    r = t.inventory[s];
  if (!o || !r) throw new b(message("core.upgrades.combineItem.f0ed4a2f42"));
  const c = Gi(e, t, o, r),
    l = e.defs.get(r.id);
  if (c.repair)
    ([1, 2].includes(l.Shape) && e.rng.next(10),
      (r.currentDura = r.maxDura),
      e.say(message("core.upgrades.combineItem.92fcd944ae")));
  else if (e.rng.next(100) < c.chance) {
    c.stat === "Durability"
      ? (r.maxDura = Math.min(65535, r.maxDura + c.gain))
      : (r.added[c.stat] = (r.added[c.stat] || 0) + c.gain);
    for (const [u, h] of Object.entries(c.effects)) r.added[u] = (r.added[u] || 0) + h;
    ((r.gemCount = (r.gemCount || 0) + 1), e.say(message("core.upgrades.combineItem.7ee926e3fc")));
  } else e.say(message("core.upgrades.combineItem.4ce26bc8c1"));
  (o.count--,
    o.count || (t.inventory[n] = null),
    e.emit("CombineItem", {
      Success: !0,
      IDFrom: a,
      IDTo: i,
    }));
}


var Qi = {};
for (const [e, t] of [
  [2, "Mundane NokChi TaoProtect Whisker1 Whisker2 Whisker3 Whisker4 Whisker5"],
  [3, "RedOrchid RedFlower Smash HwanDevil Purity FiveString Bone Bug DarkGhost"],
  [4, "Recall"],
  [
    5,
    "Spirit WhiteGold WhiteGoldH RedJade RedJadeH Nephrite NephriteH Hyeolryong Monitor Oppressive Paeok Sulgwan BlueFrostH BlueFrost",
  ],
])
  for (const a of t.split(" ")) Qi[a] = e;
var cr = {
  Mundane: {
    HP: 50,
  },
  NokChi: {
    MP: 50,
  },
  TaoProtect: {
    HP: 30,
    MP: 30,
  },
  RedOrchid: {
    Accuracy: 2,
  },
  RedFlower: {
    HP: 50,
    MP: -50,
  },
  Smash: {
    MinDC: 1,
    MaxDC: 3,
  },
  HwanDevil: {
    MinMC: 1,
    MaxMC: 2,
  },
  Purity: {
    MinSC: 1,
    MaxSC: 2,
  },
  FiveString: {
    MinAC: 2,
    MaxAC: 2,
  },
  Spirit: {
    MinDC: 2,
    MaxDC: 5,
    AttackSpeed: 2,
  },
  Bone: {
    MaxAC: 2,
    MaxMC: 1,
    MaxSC: 1,
  },
  Bug: {
    MaxDC: 1,
    MaxMC: 1,
    MaxSC: 1,
    MaxMAC: 1,
    PoisonResist: 1,
  },
  WhiteGold: {
    MaxDC: 2,
    MaxAC: 2,
  },
  WhiteGoldH: {
    MaxDC: 3,
    HP: 30,
    AttackSpeed: 2,
  },
  RedJade: {
    MaxMC: 2,
    MaxMAC: 2,
  },
  RedJadeH: {
    MaxMC: 2,
    MP: 40,
    Agility: 2,
  },
  Nephrite: {
    MaxSC: 2,
    MaxAC: 1,
    MaxMAC: 1,
  },
  NephriteH: {
    MaxSC: 2,
    HP: 15,
    MP: 20,
    Holy: 1,
    Accuracy: 1,
  },
  Whisker1: {
    MaxDC: 1,
    BagWeight: 25,
  },
  Whisker2: {
    MaxMC: 1,
    BagWeight: 17,
  },
  Whisker3: {
    MaxSC: 1,
    BagWeight: 17,
  },
  Whisker4: {
    MaxDC: 1,
    BagWeight: 20,
  },
  Whisker5: {
    MaxDC: 1,
    BagWeight: 17,
  },
  Hyeolryong: {
    MaxSC: 2,
    HP: 15,
    MP: 20,
    Holy: 1,
    Accuracy: 1,
  },
  Monitor: {
    MagicResist: 1,
    PoisonResist: 1,
  },
  Oppressive: {
    MaxAC: 1,
    Agility: 1,
  },
  BlueFrost: {
    MinDC: 1,
    MaxDC: 1,
    MinMC: 1,
    MaxMC: 1,
    HandWeight: 1,
    WearWeight: 2,
  },
  BlueFrostH: {
    MinDC: 1,
    MaxDC: 2,
    MaxMC: 2,
    Accuracy: 1,
    HP: 50,
  },
  DarkGhost: {
    MP: 25,
    AttackSpeed: 2,
  },
};
function lr(e, t) {
  const a = [];
  for (const i of e) {
    if (!i || (i.maxDura > 0 && i.currentDura === 0)) continue;
    const n = t.get(i.id),
      s = String(n.Set || "None");
    if (s === "None") continue;
    let o = a.find((r) => r.name === s && !r.types.has(n.Type) && !r.complete);
    (o ||
      ((o = {
        name: s,
        types: new Set(),
        complete: !1,
      }),
      a.push(o)),
      o.types.add(n.Type),
      (o.complete = o.types.size >= (Qi[s] || 0)));
  }
  return a;
}
function dr(e, t, a) {
  const i = (r) => {
      for (const [c, l] of Object.entries(r)) e[c] = (e[c] || 0) + l;
    },
    n = new Set();
  for (const r of lr(t, a))
    (r.types.has("Ring") &&
      r.types.has("Bracelet") &&
      !n.has(r.name) &&
      (r.name === "Smash" &&
        i({
          AttackSpeed: 2,
        }),
      r.name === "Purity" &&
        i({
          Holy: 3,
        }),
      r.name === "HwanDevil" &&
        i({
          WearWeight: 5,
          BagWeight: 20,
        }),
      n.add(r.name)),
      r.name === "DarkGhost" &&
        r.types.has("Necklace") &&
        r.types.has("Bracelet") &&
        i({
          HP: 25,
        }),
      r.complete &&
        (r.name === "FiveString" &&
          i({
            HP: Math.trunc(((e.HP || 0) / 100) * 30),
          }),
        i(cr[r.name] || {})));
  const s = new Set(
      t.flatMap((r, c) =>
        r && !(r.maxDura > 0 && r.currentDura === 0) && a.get(r.id).Set === "Mir" ? [c] : [],
      ),
    ),
    o = (...r) => r.every((c) => s.has(c));
  (s.size === 10 &&
    i({
      MaxAC: 1,
      MaxMAC: 1,
      BagWeight: 70,
      Luck: 2,
      AttackSpeed: 2,
      HP: 70,
      MP: 80,
      MagicResist: 6,
      PoisonResist: 6,
    }),
    o(7, 8) &&
      i({
        MaxMAC: 1,
        MaxAC: 1,
      }),
    o(5, 6) &&
      i({
        MinAC: 1,
        MinMAC: 1,
      }),
    (s.has(7) || s.has(8)) &&
      (s.has(5) || s.has(6)) &&
      s.has(4) &&
      i({
        MaxMAC: 1,
        MaxAC: 1,
        BagWeight: 30,
        WearWeight: 17,
      }),
    o(7, 8, 5, 6, 4) &&
      i({
        MaxMAC: 1,
        MaxAC: 1,
        BagWeight: 20,
        WearWeight: 10,
      }),
    o(1, 2, 0) &&
      i({
        MaxDC: 2,
        MaxMC: 1,
        MaxSC: 1,
        Agility: 1,
      }),
    o(1, 11, 10) &&
      i({
        MaxDC: 1,
        MaxMC: 1,
        MaxSC: 1,
        HandWeight: 17,
      }),
    o(1, 11, 10, 2, 0) &&
      i({
        MinDC: 1,
        MaxDC: 1,
        MinMC: 1,
        MaxMC: 1,
        MinSC: 1,
        MaxSC: 1,
        HandWeight: 17,
      }));
}
function isLegacyBag(e, t) {
  const a = t.adaptations.bagExpansion;
  return (
    a.baseSlots === 48 &&
    a.columns === 8 &&
    Array.isArray(e.inventory) &&
    e.inventory.length === 46 + (e.bagExpansionRows || 0) * a.columns
  );
}
function fr(e, t) {
  isLegacyBag(e, t) && e.inventory.splice(46, 0, null, null);
}
function Vi(e, t) {
  const a = t.adaptations.mainline?.worldVersion;
  if (
    !a ||
    (e.worldVersion ?? 1) >= a ||
    !Array.isArray(e.roles) ||
    !e.maps ||
    !Array.isArray(e.events)
  )
    return e;
  const i = structuredClone(e),
    n = t.world.maps.find((o) => o.start);
  if (((i.worldVersion = a), (e.worldVersion ?? 1) >= 3)) {
    const o = new Set(),
      r = new Set();
    for (const c of i.roles)
      if (
        ((e.worldVersion ?? 1) < 4 &&
          c.map === n.id &&
          Math.max(Math.abs(c.x - 301), Math.abs(c.y - 497)) <= 32 &&
          ((c.x = n.center[0]), (c.y = n.center[1]), (c.target = 0), o.add(c.id)),
        a >= 5 && (e.worldVersion ?? 1) < 5)
      ) {
        (c.map === 1110 &&
          Math.max(Math.abs(c.x - 60), Math.abs(c.y - 92)) <= 12 &&
          ((c.x = 42), (c.y = 218), (c.target = 0), o.add(c.id)),
          c.map === 1120 &&
            Math.max(Math.abs(c.x - 250), Math.abs(c.y - 250)) <= 10 &&
            ((c.x = 270), (c.y = 250), (c.target = 0), o.add(c.id)));
        for (const [l, u] of [
          [238, 207],
          [239, 218],
        ])
          (c.completedQuests.includes(u) || c.quests.some((h) => h.id === u)) &&
            !c.completedQuests.includes(l) &&
            c.completedQuests.push(l);
      }
    for (const c of a >= 6
      ? t.world.maps.filter((l) => !l.instance).map((l) => l.id)
      : a >= 5
        ? [1001, 1007, 1110, 1115, 1120]
        : [n.id]) {
      const l = i.maps[c];
      if (l) {
        if (!Array.isArray(l.actors))
          throw new b(message("core.mainline.migrateWorldSave.77ca95f093"));
        ((l.actors = l.actors.filter((u) => {
          const h = u.kind !== "monster" || u.friendly || u.spawn === void 0;
          return (h || r.add(u.id), h);
        })),
          (l.respawns = {}));
        for (const u of l.actors) {
          if (u.kind === "npc") {
            const h = t.world.npcs.find((p) => p.map === c && p.id === u.id);
            h && ((u.x = h.at[0]), (u.y = h.at[1]));
          }
          if (u.friendly && u.master && o.has(u.master)) {
            const h = i.roles.find((p) => p.id === u.master);
            ((u.x = h.x), (u.y = h.y), (u.target = 0));
          }
        }
      }
    }
    i.events = i.events.filter((c) => !r.has(c.source) && !r.has(c.target));
    for (const c of i.roles) r.has(c.target) && (c.target = 0);
    return i;
  }
  const s = [];
  for (const o of Object.values(i.maps)) {
    if (!Array.isArray(o.actors)) throw new b(message("core.mainline.migrateWorldSave.77ca95f093"));
    for (const r of o.actors)
      (r.kind === "item" || (r.friendly && r.kind === "monster" && !r.dead)) &&
        ((r.map = n.id),
        (r.x = n.center[0]),
        (r.y = n.center[1]),
        (r.target = 0),
        delete r.spawn,
        s.push(r));
  }
  ((i.maps = {
    [n.id]: {
      actors: s,
      respawns: {},
    },
  }),
    (i.events = []));
  for (const o of i.roles) {
    if (!Array.isArray(o.quests) || !Array.isArray(o.completedQuests))
      throw new b(message("core.mainline.migrateWorldSave.4230a1abec"));
    ((o.map = n.id),
      (o.x = n.center[0]),
      (o.y = n.center[1]),
      (o.target = 0),
      delete o.treasureRun);
    const r = o.quests.filter((h) => h.id >= 1 && h.id <= 8),
      c = o.completedQuests,
      l = c.includes(8) ? 210 : c.includes(7) ? 206 : c.includes(5) ? 204 : 0;
    for (let h = 201; h <= l; h++) c.includes(h) || c.push(h);
    o.quests = o.quests.filter((h) => t.quests.some((p) => p.Index === h.id));
    const u = {
      1: 201,
      2: 201,
      3: 202,
      4: 203,
      5: 204,
      6: 206,
      7: 206,
      8: 210,
    };
    for (const h of r) {
      const p = u[h.id];
      for (let g = 201; g < p; g++) c.includes(g) || c.push(g);
      !c.includes(p) &&
        !o.quests.some((g) => g.id === p) &&
        o.quests.push({
          id: p,
          kills: h.kills,
        });
    }
    for (const [h, p] of [
      [238, 207],
      [239, 218],
    ])
      (c.includes(p) || o.quests.some((g) => g.id === p)) && !c.includes(h) && c.push(h);
  }
  return i;
}
function Ui(e, t) {
  const a = e.map(t);
  return (
    a.portals && (a.portals = a.portals.filter((i) => !i.expires || i.expires > e.time)),
    [...e.region(t).portals, ...(a.portals || [])]
  );
}
function ur(e, t, a) {
  const i = e.rules.adaptations.mainline;
  if (!i || t.friendly) return;
  const n = e.monsters.get(t.definition)?.Name;
  t.map === 1004 &&
    n === "BoneElite" &&
    a.completedQuests.includes(211) &&
    e.count(a, 9505) < 1 &&
    (e.give(a, e.newItem(9505), !0) || e.say(message("core.mainline.mainlineKill.15e671c387")));
  for (const r of i.questSources)
    !a.quests.some((c) => c.id === r.quest) ||
      !r.maps.includes(t.map) ||
      !r.monsters.includes(n || "") ||
      !e.needsQuestItem(a, r.item, t.map) ||
      ((De(a, e.rules)?.guaranteedQuestMaterials ||
        e.rng.next(
          isHell(e.rules) && r.hellSource === "native-row"
            ? dreamDropDenominator(
                r.chance,
                dreamItemDropMultiplier(
                  e.rules.adaptations.dreamRuntime,
                  a.stats.ItemDropRatePercent || 0,
                ),
              )
            : r.chance,
        ) === 0) &&
        !e.give(a, e.newItem(r.item), !0) &&
        e.say(message("core.mainline.mainlineKill.b8b9789a6e")));
  const s = i.hellBridge;
  s &&
    t.map === s.map &&
    n === s.monster &&
    ((e.map(t.map).portals = [
      ...(e.map(t.map).portals || []).filter((r) => r.to !== s.map && r.to !== 2030),
      {
        to: s.map,
        name: message("map.portal.bridge"),
        at: [t.x, t.y],
        landing: [...s.landing],
        expires: e.time + s.duration,
      },
    ]),
    e.say(message("core.mainline.mainlineKill.23d34d4313")));
  const o = i.corpsePalace;
  if (t.map === o.sourceMap && n === o.monster && e.rng.next(o.chance) === 0) {
    const r = e.region(o.targetMap),
      c = e.freeNear(t.map, t, 3);
    if (!c) return;
    ((e.map(t.map).portals = [
      {
        to: r.id,
        name: message("map.portal.ghoul"),
        at: [c.x, c.y],
        landing: r.center,
        expires: e.time + o.duration,
      },
    ]),
      e.say(message("core.mainline.mainlineKill.af65e052a6")));
  }
}
function mr(e, t) {
  const a = e.rules.adaptations.mainline;
  if (t.dead || t.map !== a.summonMap)
    throw new b(message("core.mainline.summonMainlineBoss.a26aa62145"));
  if (!t.quests.some((n) => n.id === a.summonQuest))
    throw new b(message("core.mainline.summonMainlineBoss.c19d92e9fc"));
  if (e.map(t.map).actors.some((n) => n.definition === a.summonMonster && !n.dead))
    throw new b(message("core.mainline.summonMainlineBoss.63dbf2ab9b"));
  const i = e.freeNear(
    t.map,
    {
      x: t.x + 4,
      y: t.y + 3,
    },
    8,
  );
  if (!i) throw new b(message("core.mainline.summonMainlineBoss.28712cf4ec"));
  (e.map(t.map).actors.push(e.newMonster(e.monsters.get(a.summonMonster), t.map, i)),
    e.say(message("core.mainline.summonMainlineBoss.c66ba002ac")));
}


function approvedPlacement(e, t) {
  if (t !== 1001) return;
  const a = e.region(t).spawns.flatMap((r, c) =>
    r.monster === "Oma" && r.native?.recordId === 9 && r.native.monsterId === 28
      ? [
          {
            s: r,
            i: c,
          },
        ]
      : [],
  );
  if (a.length !== 1) return;
  const { s: i, i: n } = a[0],
    s = i.placement;
  if (!s || s.center[0] !== 232 || s.center[1] !== 566 || s.radius !== 40 || !i.locations?.length)
    return;
  const o = e.rules.monsters.filter((r) => r.Name === "Oma" && r.DreamOriginalId === 28);
  if (o.length === 1)
    return {
      locations: i.locations,
      i: n,
      definition: o[0].Index,
    };
}
var eligible = (e, t, a) =>
  e.kind === "monster" &&
  e.map === 1001 &&
  !e.dead &&
  !e.friendly &&
  !e.master &&
  e.spawn === t &&
  e.definition === a;
function pr(e, t) {
  const a = approvedPlacement(e, t.map);
  return !a || !eligible(t, a.i, a.definition)
    ? !1
    : (((t.special ??= {}).omaNorthwestPlacement = 2), !0);
}
function hr(e, t) {
  const a = e.maps[t],
    i = approvedPlacement(e, t);
  if (!a || !i) return !1;
  const { locations: n, i: s, definition: o } = i,
    r = a.actors.filter((p) => eligible(p, s, o));
  if (a.omaNorthwestPlacement === 1 && r.every((p) => p.special?.omaNorthwestPlacement === 2))
    return !1;
  const c = r.filter((p) => p.special?.omaNorthwestPlacement !== 2).sort((p, g) => p.id - g.id),
    l = new Set(c.map((p) => p.id)),
    u = new Set(
      a.actors
        .filter((p) => !p.dead && ["monster", "npc"].includes(p.kind) && !l.has(p.id))
        .map((p) => `${p.x},${p.y}`),
    ),
    h = [];
  for (const [p, g] of c.entries()) {
    const y = ([v, x]) =>
      (v !== g.x || x !== g.y) && !u.has(`${v},${x}`) && e.walkable(t, v, x, g.id);
    let f;
    for (let v = 0; !f && v < n.length; v++) {
      const x = n[(Math.floor((p * n.length) / c.length) + v) % n.length];
      y(x) && (f = x);
    }
    if (!f) return !1;
    (u.add(f.join(",")),
      h.push({
        actor: g,
        x: f[0],
        y: f[1],
      }));
  }
  for (const { actor: p, x: g, y } of h)
    ((p.x = g), (p.y = y), ((p.special ??= {}).omaNorthwestPlacement = 2));
  return ((a.omaNorthwestPlacement = 1), !0);
}
var Ji = [
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
function _i(e) {
  return JSON.stringify(
    e && typeof e == "object"
      ? Object.entries(e)
          .sort(([t], [a]) => t.localeCompare(a))
          .map(([t, a]) => [t, _i(a)])
      : e,
  );
}
function nt(e, t, a) {
  const i = new Map();
  for (const r of e)
    if (r) {
      const { uid: c, count: l, ...u } = r,
        h = _i(u),
        p = i.get(h) || [];
      (p.push(r), i.set(h, p));
    }
  const n = [];
  for (const r of i.values()) {
    r.sort((h, p) => h.uid - p.uid);
    const c = Math.max(1, t.get(r[0].id).StackSize);
    let l = r.reduce((h, p) => h + p.count, 0),
      u = 0;
    for (; l > 0; ) {
      const h = Math.min(c, l);
      (n.push({
        ...structuredClone(r[0]),
        uid: r[u++]?.uid ?? 0,
        count: h,
      }),
        (l -= h));
    }
  }
  if (n.length > e.length) throw new b(message("core.inventory-sort.sortInventory.a0b0e1e655"));
  const s = (r) => {
      const c = Ji.indexOf(t.get(r.id).Type);
      return c < 0 ? Ji.length : c;
    },
    o = (r) => Object.values(r.added).reduce((c, l) => c + Math.max(0, l), 0);
  n.sort(
    (r, c) =>
      s(r) - s(c) ||
      t.get(r.id).RequiredAmount - t.get(c.id).RequiredAmount ||
      r.id - c.id ||
      o(c) - o(r) ||
      c.count - r.count ||
      r.uid - c.uid,
  );
  for (const r of n) r.uid || (r.uid = a());
  return [...n, ...Array(e.length - n.length).fill(null)];
}
function br(e, t) {
  return e === "Fencing"
    ? {
        Accuracy: t * 3,
      }
    : e === "SpiritSword"
      ? {
          Accuracy: [0, 3, 5, 8][t],
        }
      : e === "Slaying"
        ? {
            Accuracy: t,
            MaxDC: [5, 6, 7, 8][t],
          }
        : {};
}
var Yi = class extends Et {
    constructor(e) {
      (super(1), (this.high = e));
    }
    next(e, t = 0) {
      return this.high ? Math.max(t, e - 1) : t;
    }
  },
  dc = new Yi(!1),
  fc = new Yi(!0),
  Dt = (e, t) => Math.max(Math.abs(e.x - t.x), Math.abs(e.y - t.y));
function adventureSetCount(e, t, a = t.job) {
  const i = e.rules.adaptations.adventure.setIds[a];
  return new Set(
    t.equipment
      .filter((n) => !!n && i.includes(n.id) && (!n.maxDura || n.currentDura > 0))
      .map((n) => n.id),
  ).size;
}
function yr(e, t) {
  const a = adventureSetCount(e, t),
    i = e.rules.adaptations.adventure;
  if (a >= 2)
    for (const [n, s] of Object.entries(i.setBonuses[t.job])) t.stats[n] = (t.stats[n] || 0) + s;
  a >= 3 && (t.stats["Adventure" + t.job] = 1);
}
function xr(e, t, a, i, n) {
  if (!(i <= 0 || t.kind !== "player" || n !== "GreatFireBall" || !t.stats.AdventureWizard))
    for (const s of [...e.map(t.map).actors])
      s.id !== a.id &&
        s.kind === "monster" &&
        !s.dead &&
        !s.friendly &&
        Dt(s, a) <= 1 &&
        e.damage(t, s, Math.max(1, Math.floor(i * 0.35)), "MAC", "EmberSplash");
}
function owned(e, t) {
  return [...e.inventory, ...e.storage, ...e.equipment, ...e.questInventory].some(
    (a) => a?.id === t,
  );
}
function en(e, t) {
  const a = e.rules.adaptations.adventure.setIds[t.job],
    i = a.filter((s) => !owned(t, s)),
    n = i.length ? i : a;
  return n[e.rng.next(n.length)];
}
function earlyAdventureEquipment(e, t) {
  return e.rules.items.filter(
    (a) =>
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
      ].includes(a.Type) &&
      a.Unique === "None" &&
      a.RequiredType === "Level" &&
      a.RequiredAmount >= 3 &&
      a.RequiredAmount <= 12 &&
      ["None", "WarWizTao", t.job].includes(a.RequiredClass) &&
      ["None", t.gender].includes(a.RequiredGender) &&
      (e.rules.adaptations.dreamRuntime
        ? a.DreamOriginalId !== void 0 &&
          Number(a.DreamGrade) > 0 &&
          Number(a.DreamGrade) <= 2 &&
          !a.DreamRawItem?.Handmake
        : e.rules.adaptations.earlyLoot.profiles.includes(a.RandomStatsId)),
  );
}
function Mr(e, t, a) {
  if (isHell(e.rules)) return;
  a.stats.AdventureWarrior &&
    e.buff(
      a,
      "\u7834\u9635\u75BE\u653B",
      5e3,
      0,
      {
        AttackSpeed: 1,
      },
      a.id,
    );
  const i = e.monsters.get(t.definition)?.AdventureKind,
    n = e.rules.adaptations.adventure;
  if (!i || i === "guard" || t.special?.summoner || n.mapIds.includes(t.map)) return;
  (e.ground(t, void 0, i === "captain" ? 400 : 120),
    e.rng.next(i === "captain" ? n.captainSetChance : n.eliteSetChance) === 0 &&
      e.ground(t, e.newItem(en(e, a))),
    e.rng.next(n.eliteTicketChance) === 0 && e.ground(t, e.newItem(n.ticketId)));
  const s = earlyAdventureEquipment(e, a);
  s.length && e.ground(t, e.newItem(s[e.rng.next(s.length)].Index, 1, !0));
}
function wr(e, t, a) {
  if (t.dead || t.friendly || e.monsters.get(t.definition)?.AdventureKind !== "captain") return !1;
  const i = (t.special ??= {});
  if (
    t.buffs.some((n) =>
      ["Paralysis", "LRParalysis", "Trap", "Frozen", "Shock", "Stun"].includes(n.type),
    )
  )
    return (i.slamAt && (delete i.slamAt, (i.nextSlam = e.time + 6e3)), !1);
  if (e.time < t.actionAt) return !1;
  if (i.slamAt) {
    if (e.time < Number(i.slamAt)) return !0;
    const n = {
      x: Number(i.slamX),
      y: Number(i.slamY),
    };
    for (const s of [a, ...e.map(t.map).actors.filter((o) => o.friendly)])
      !s.dead && s.map === t.map && Dt(s, n) <= 1 && e.damage(t, s, 16, "AC", "CaptainSlam");
    return (delete i.slamAt, (i.nextSlam = e.time + 6e3), (t.actionAt = e.time + 600), !0);
  }
  if (!a.dead && Dt(t, a) <= 6 && !e.safe(a) && e.time >= Number(i.nextSlam || 0)) {
    if (
      ((i.slamAt = e.time + 1400),
      (i.slamX = a.x),
      (i.slamY = a.y),
      e.say(message("core.adventure.adventureMonsterTick.2bd4ceaab5")),
      !i.summoned)
    ) {
      i.summoned = !0;
      for (let n = 0; n < 2; n++) {
        const s = e.freeNear(
          t.map,
          {
            x: t.x + 2 + n,
            y: t.y,
          },
          3,
        );
        if (!s) continue;
        const o = e.newMonster(e.monsters.get(9303), t.map, s);
        ((o.special.summoner = t.id), e.map(t.map).actors.push(o));
      }
    }
    return !0;
  }
  return !1;
}
function treasureMapId(e, t) {
  return e.rules.adaptations.adventure.mapIds[e.roles.indexOf(t)];
}
function Sr(e, t) {
  const a = e.rules.adaptations.adventure;
  if (t.level < a.tombMinLevel) throw new b(message("core.adventure.enterTreasure.f97d7b80dd"));
  if (a.mapIds.includes(t.map)) throw new b(message("core.adventure.enterTreasure.222ac92c03"));
  if (
    e.time < t.actionAt ||
    e
      .map(t.map)
      .actors.some(
        (r) => r.kind === "monster" && !r.dead && !r.friendly && r.target === t.id && Dt(r, t) <= 8,
      )
  )
    throw new b(message("core.adventure.enterTreasure.11ba74509a"));
  const i = treasureMapId(e, t),
    n = e.geometry.get(i);
  if (!n) throw new b(message("core.adventure.enterTreasure.6c65cfc3bb"));
  const s = e.region(i),
    o = {
      x: s.center[0],
      y: s.center[1],
    };
  if (n.solid[o.y * n.width + o.x]) throw new b(message("core.adventure.enterTreasure.a05b40d942"));
  ((e.maps[i] = {
    actors: [],
    respawns: {},
  }),
    (e.events = e.events.filter((r) => r.map !== i)),
    (t.map = i),
    (t.x = o.x),
    (t.y = o.y),
    (t.target = 0),
    (e.npc = 0),
    (t.treasureRun = {
      map: i,
      wave: 0,
      nextWaveAt: e.time + 1500,
      cleared: !1,
      claimed: !1,
    }),
    e.initializeMap(i),
    e.bringPets(t),
    e.emit("MapChanged", {
      MapIndex: i,
    }),
    e.say(message("core.adventure.enterTreasure.ad7a145358")));
}
function It(e, t) {
  const a = t.treasureRun;
  !a || t.map === a.map || (e.clearExitedInstance(t, a.map), delete t.treasureRun);
}
function kr(e, t) {
  It(e, t);
  const a = t.treasureRun;
  if (!a || t.dead || a.cleared) return;
  const i = e.map(a.map);
  if (i.actors.some((c) => c.kind === "monster" && !c.dead && !c.friendly)) return;
  if (a.wave >= 3) {
    ((a.cleared = !0),
      (a.rewards = isHell(e.rules)
        ? []
        : [
            {
              item: en(e, t),
              count: 1,
            },
          ]));
    const l = {
      Warrior: ["Slaying", "Thrusting"],
      Wizard: ["GreatFireBall", "HellFire", "ThunderBolt", "FireWall"],
      Taoist: ["SpiritSword", "Poisoning", "SoulFireBall", "SummonSkeleton"],
    }[t.job]
      .map((p) => e.rules.items.find((g) => g.Name === p))
      .find(
        (p) =>
          p &&
          Aa(p, e.rules) &&
          p.RequiredAmount <= t.level &&
          !t.skills.some((g) => g.Spell === p.Spell) &&
          !owned(t, p.Index),
      );
    l &&
      a.rewards.push({
        item: l.Index,
        count: 1,
      });
    const u = e.rules.adaptations.adventure;
    e.ground(t, e.newItem(u.chestId));
    const h = i.actors.find((p) => p.item?.id === u.chestId);
    (delete h.expires, e.say(message("core.adventure.treasureTick.e46b65b95b")));
    return;
  }
  if (!a.nextWaveAt) {
    ((a.nextWaveAt = e.time + 2e3), e.say(message("core.adventure.treasureTick.3abeaa7283")));
    return;
  }
  if (e.time < a.nextWaveAt) return;
  const n = a.wave < 2 ? [9303, 9303, 9303] : [9302],
    s = e.region(a.map),
    o = [],
    r = new Set();
  for (let c = 0; c < n.length; c++) {
    const l = {
      x: s.center[0] - 3 + c * 3,
      y: s.center[1] - 4,
    };
    let u;
    for (let h = 0; h <= 5 && !u; h++)
      for (let p = -h; p <= h && !u; p++)
        for (let g = -h; g <= h && !u; g++) {
          const y = l.x + g,
            f = l.y + p,
            v = y + "," + f;
          !r.has(v) &&
            e.walkable(a.map, y, f) &&
            ((u = {
              x: y,
              y: f,
            }),
            r.add(v));
        }
    if (!u) {
      a.nextWaveAt = e.time + 1e3;
      return;
    }
    o.push(u);
  }
  for (let c = 0; c < n.length; c++) i.actors.push(e.newMonster(e.monsters.get(n[c]), a.map, o[c]));
  (a.wave++,
    (a.nextWaveAt = 0),
    e.say(
      message("core.adventure.treasureTick.1ba8320c01", {
        p0: a.wave,
        p1: a.wave === 3 ? message("game.adventure.captainAppears") : "",
      }),
    ));
}


function Pr(e, t, a) {
  const i = t.treasureRun;
  if (!i || i.map !== t.map || !i.cleared || i.claimed || !i.rewards)
    throw new b(message("core.adventure.openTreasure.dd042cb4ae"));
  const n = structuredClone(t.inventory);
  for (const s of i.rewards)
    if (!e.give(t, e.newItem(s.item, s.count), !1))
      throw ((t.inventory = n), new b(message("core.adventure.openTreasure.2d266e6674")));
  ((t.gold += 500),
    (i.claimed = !0),
    (e.map(t.map).actors = e.map(t.map).actors.filter((s) => s.id !== a.id)),
    e.say(message("core.adventure.openTreasure.e623862bb2")),
    qa(e, t),
    It(e, t),
    e.emit("MapChanged", {
      MapIndex: t.map,
    }),
    e.say(message("challenge.complete")));
}
var F = ["Up", "UpRight", "Right", "DownRight", "Down", "DownLeft", "Left", "UpLeft"],
  U = [
    [0, -1],
    [1, -1],
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
    [-1, 0],
    [-1, -1],
  ],
  P = (e, t) => Math.max(Math.abs(e.x - t.x), Math.abs(e.y - t.y)),
  direction = (e, t) =>
    U.findIndex(([a, i]) => a === Math.sign(t.x - e.x) && i === Math.sign(t.y - e.y)),
  Ge = class {
    constructor(e, t = 1) {
      ((this.rules = e),
        (this.defs = new Map(e.items.map((a) => [a.Index, a]))),
        (this.monsters = new Map(e.monsters.map((a) => [a.Index, a]))),
        (this.rng = new Et(t)));
    }
    defs;
    monsters;
    rng;
    epoch = globalThis.crypto?.randomUUID?.() ?? String(Date.now());
    roles = [];
    sharedStorage = Array(rt).fill(null);
    maps = {};
    geometry = new Map();
    spreadMaps = new Set();
    replenishAt = 0;
    pendingInstanceExit = new WeakMap();
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
      return this.roles.find((e) => e.id === this.active);
    }
    emit(e, t) {
      (this.packets.push({
        seq: ++this.cursor,
        type: e,
        data: t,
      }),
        this.packets.length > 8192 && this.packets.splice(0, 4096));
    }
    say(e) {
      this.emit("Chat", {
        Message: e,
      });
    }
    loadMap(e) {
      this.geometry.set(e.id, {
        ...e,
        solid: Uint8Array.from(atob(e.blocked), (t) => t.charCodeAt(0)),
      });
    }
    region(e) {
      const t = this.rules.world.maps.find((a) => a.id === e);
      if (!t) throw new b(message("core.game.region.8ae41e8772"));
      return t;
    }
    map(e) {
      return (
        this.maps[e] ??
        (this.maps[e] = {
          actors: [],
          respawns: {},
        })
      );
    }
    actor(e) {
      return (
        this.roles.find((t) => t.id === e) ??
        Object.values(this.maps)
          .flatMap((t) => t.actors)
          .find((t) => t.id === e)
      );
    }
    walkable(e, t, a, i = 0) {
      const n = this.geometry.get(e);
      return (
        !!n &&
        t >= 0 &&
        a >= 0 &&
        t < n.width &&
        a < n.height &&
        !n.solid[a * n.width + t] &&
        !this.map(e).actors.some(
          (s) =>
            s.id !== i &&
            !(s.friendly && s.master === i && this.roles.some((o) => o.id === i)) &&
            !s.dead &&
            St(s) &&
            ["monster", "npc"].includes(s.kind) &&
            s.x === t &&
            s.y === a,
        ) &&
        !this.roles.some(
          (s) =>
            s.id !== i && s.id === this.active && !s.dead && s.map === e && s.x === t && s.y === a,
        )
      );
    }
    freeNear(e, t, a = 6) {
      for (let i = 0; i <= a; i++)
        for (let n = t.y - i; n <= t.y + i; n++)
          for (let s = t.x - i; s <= t.x + i; s++)
            if (
              P(t, {
                x: s,
                y: n,
              }) === i &&
              this.walkable(e, s, n)
            )
              return {
                x: s,
                y: n,
              };
      return null;
    }
    initializeMap(e) {
      const t = this.map(e),
        a = this.region(e);
      if (!this.geometry.has(e)) throw new b(message("core.game.initializeMap.8b913f9fd9"));
      hr(this, e);
      const i =
        this.rules.adaptations.spawnPopulationByMap?.[String(e)] ??
        this.rules.adaptations.spawnPopulationMultiplier ??
        1;
      if ((t.populationMultiplier || 1) > i) {
        const o = new Map();
        t.actors = t.actors.filter((r) => {
          if (r.kind !== "monster" || r.dead || r.friendly || r.spawn === void 0) return !0;
          const c = (o.get(r.spawn) || 0) + 1;
          return (o.set(r.spawn, c), c <= (a.spawns[r.spawn]?.count ?? 0));
        });
      }
      ((t.populationMultiplier || 1) < i && (t.respawns = {}), (t.populationMultiplier = i));
      const n = a.spawns.findIndex(
          (o, r) => o.respawnPhaseSeconds !== void 0 && t.respawns[r] !== void 0,
        ),
        s = n < 0 ? this.time : t.respawns[n] - a.spawns[n].respawnPhaseSeconds * 1e3;
      (a.spawns.forEach((o, r) => {
        if (t.respawns[r] !== void 0) return;
        let c = this.time;
        if (o.respawnPhaseSeconds !== void 0) {
          const l = Math.max(1e3, o.respawnMinutes * 6e4);
          ((c = s + o.respawnPhaseSeconds * 1e3),
            c < this.time && (c += Math.ceil((this.time - c) / l) * l));
        }
        t.respawns[r] = c;
      }),
        (t.actors = t.actors.filter(
          (o) =>
            o.kind !== "npc" || this.rules.world.npcs.some((r) => r.id === o.id && r.map === e),
        )));
      for (const o of this.rules.world.npcs.filter((r) => r.map === e)) {
        const r = t.actors.find((c) => c.kind === "npc" && c.id === o.id);
        r
          ? Object.assign(r, {
              name: o.name,
              art: o.art,
              x: o.at[0],
              y: o.at[1],
            })
          : t.actors.push({
              id: o.id,
              kind: "npc",
              name: o.name,
              art: o.art,
              map: e,
              x: o.at[0],
              y: o.at[1],
              dir: 0,
              hp: 1,
              maxHP: 1,
              dead: !1,
              stats: {},
              buffs: [],
              actionAt: 0,
              attackAt: 0,
              moveAt: 0,
              target: 0,
            });
      }
      if (!this.spreadMaps.has(e)) {
        const o = new Set();
        for (const r of t.actors.filter((c) => c.kind === "item"))
          (o.has(`${r.x},${r.y}`) && Object.assign(r, this.dropPosition(r)),
            o.add(`${r.x},${r.y}`));
        this.spreadMaps.add(e);
      }
      this.respawn(e);
    }
    dismissPets(e) {
      const t = new Set();
      for (const a of Object.values(this.maps)) {
        for (const i of a.actors)
          ((i.friendly && i.master === e.id) || (i.kind === "spell" && i.target === e.id)) &&
            t.add(i.id);
        a.actors = a.actors.filter((i) => !t.has(i.id));
      }
      this.events = this.events.filter(
        (a) => a.source !== e.id && !t.has(a.source) && !t.has(a.target),
      );
      for (const a of Object.values(this.maps))
        for (const i of a.actors) (i.target === e.id || t.has(i.target)) && (i.target = 0);
    }
    clearExitedInstance(e, t) {
      if (t === e.map) return;
      const a = this.maps[t];
      if (a)
        for (const i of a.actors) {
          if (!i.friendly || i.dead || i.master !== e.id) continue;
          const n = this.geometry.has(e.map) && this.petLanding(e);
          ((i.map = e.map),
            (i.x = n ? n.x : e.x),
            (i.y = n ? n.y : e.y),
            (i.target = 0),
            this.map(e.map).actors.push(i));
        }
      (delete this.maps[t], (this.events = this.events.filter((i) => i.map !== t)));
    }
    bringPets(e) {
      if (this.geometry.has(e.map))
        for (const t of Object.values(this.maps)) {
          for (const a of [...t.actors])
            if (
              a.friendly &&
              a.master === e.id &&
              !a.dead &&
              (a.map !== e.map || P(a, e) > 10 || P(a, e) === 0)
            ) {
              const i = this.petLanding(e);
              if (!i) continue;
              ((t.actors = t.actors.filter((n) => n !== a)),
                (a.map = e.map),
                (a.x = i.x),
                (a.y = i.y),
                (a.target = 0),
                this.map(e.map).actors.push(a));
            }
          t.actors = t.actors.filter(
            (a) => !(a.kind === "spell" && a.target === e.id && a.map !== e.map),
          );
        }
    }
    respawn(e) {
      const t = this.map(e),
        a = this.region(e);
      a.spawns.forEach((i, n) => {
        if (i.minPlayerLevel && (this.me?.level || 0) < i.minPlayerLevel) {
          t.actors = t.actors.filter((c) => c.spawn !== n);
          return;
        }
        const s = persistentBossSpawn(this, a, n);
        if (s) {
          const c = this.time,
            l = Math.max(1e3, i.respawnMinutes * 6e4);
          (c >= s.nextAt &&
            ((s.available = i.count), (s.nextAt += (Math.floor((c - s.nextAt) / l) + 1) * l)),
            (t.respawns[n] = this.time + Math.max(0, s.nextAt - c)));
        } else if (t.respawns[n] > this.time) return;
        if (!s && i.respawnPhaseSeconds !== void 0) {
          const c = Math.max(1e3, i.respawnMinutes * 6e4),
            l = t.respawns[n] ?? this.time + i.respawnPhaseSeconds * 1e3;
          t.respawns[n] = l + (Math.floor((this.time - l) / c) + 1) * c;
        } else
          !s &&
            i.native &&
            (t.respawns[n] = this.time + Math.max(1, i.native.intervalSeconds) * 1e3);
        const o = this.rules.monsters.find((c) => c.Name === i.monster);
        if (!o) throw new b(message("core.game.respawn.3097501c0a"));
        const r = t.actors.filter(
          (c) =>
            c.spawn === n &&
            (!c.dead || (c.ai === 25 && Number(c.special?.revivals) < Number(c.special?.lives))),
        ).length;
        for (let c = r; c < Math.min(i.count, s?.available ?? i.count); c++) {
          let l = null;
          if (i.locations) {
            const h = this.rng.next(i.locations.length);
            for (let p = 0; p < i.locations.length; p++) {
              const [g, y] = i.locations[(h + p) % i.locations.length];
              if (this.walkable(e, g, y)) {
                l = {
                  x: g,
                  y,
                };
                break;
              }
            }
          } else
            l = this.freeNear(
              e,
              {
                x: i.at[0],
                y: i.at[1],
              },
              Math.max(1, i.spread),
            );
          if (!l) continue;
          const u = this.newMonster(o, e, l, n);
          (pr(this, u), t.actors.push(u));
        }
      });
    }
    newMonster(e, t, a, i) {
      const n = {
        id: this.nextId++,
        kind: "monster",
        name: e.Name,
        sourceName: e.Name,
        art: e.Image,
        ai: e.AI,
        definition: e.Index,
        spawn: i,
        map: t,
        x: a.x,
        y: a.y,
        dir: this.rng.next(8),
        hp: e.Stats.HP || 1,
        maxHP: e.Stats.HP || 1,
        dead: !1,
        stats: {
          ...e.Stats,
        },
        buffs: [],
        actionAt: this.time,
        attackAt: this.time,
        moveAt: this.time + this.rng.next(1500),
        target: 0,
      };
      return (ui(this, n, e), Ps(this, n, e), n);
    }
    newItem(e, t = 1, a = !1, i, n, s = 0) {
      e === this.rules.adaptations.unifiedDeerMeat.legacy &&
        (e = this.rules.adaptations.unifiedDeerMeat.canonical);
      const o = this.defs.get(e);
      if (!o) throw new b(message("core.game.newItem.53a9e6222a"));
      const r = {
        uid: this.nextId++,
        id: e,
        count: t,
        currentDura: o.Durability,
        maxDura: o.Durability,
        added: {},
        specialVersion: 1,
      };
      if (a) {
        if (this.rules.adaptations.dreamRuntime) {
          const c = this.rules.adaptations.dreamRuntime;
          (Vo(r, o, this.rng, c, dreamMagicFind(c, (n?.stats.MagicFind || 0) + s)),
            la(r, o, this.rng, c));
        } else En(r, o, this.rng, this.rules.adaptations.earlyLoot);
        _o(r, o, this.rng, this.rules.adaptations.gemEnhancement, i);
      }
      return (
        initializeChest(this, r),
        o.Type === "CraftMaterial" &&
          ["\u53EF\u63D0\u70BC\u4E3A\u77FF\u952D", "\u53EF\u52A0\u5DE5\u4E3A\u6728\u677F"].includes(
            String(o.DreamRawItem?.Desc),
          ) &&
          (r.materialQuality = a ? this.rng.next(20, 1) : 1),
        r
      );
    }
    create(e, t, a) {
      if (!["Warrior", "Wizard", "Taoist"].includes(t) || !["Male", "Female"].includes(a))
        throw new b(message("core.game.create.0e98147ebf"));
      if (!/^[\p{L}\p{N}_]{2,12}$/u.test(e)) throw new b(message("core.game.create.d86ef9b54c"));
      if (this.roles.some((s) => s.name === e)) throw new b(message("core.game.create.90c93a7e79"));
      if (this.roles.length >= 6) throw new b(message("core.game.create.5b01055bee"));
      const i = this.rules.world.maps.find((s) => s.start),
        n = {
          id: this.nextId++,
          kind: "player",
          name: e,
          job: t,
          gender: a,
          map: i.id,
          x: i.center[0],
          y: i.center[1],
          dir: 4,
          level: 1,
          xp: 0,
          hp: 1,
          maxHP: 1,
          mp: 0,
          maxMP: 0,
          gold: 0,
          dead: !1,
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
      (this.roles.push(n), this.refresh(n));
      for (const s of this.rules.items.filter(
        (o) =>
          o.StartItem &&
          matchesClass(o.RequiredClass, t) &&
          (o.RequiredGender === "None" || o.RequiredGender === a),
      ))
        this.give(n, pn(this.newItem(s.Index), this.rules), !1);
      for (let s = 0; s < n.inventory.length; s++) {
        const o = n.inventory[s];
        if (!o) continue;
        const r = this.defs.get(o.id);
        if (r.Type === "Weapon" || r.Type === "Armour") {
          const c = itemSlots(r)?.[0];
          c !== void 0 &&
            !n.equipment[c] &&
            (this.checkUse(n, r), (n.equipment[c] = o), (n.inventory[s] = null));
        }
        r.Name === "(HP)DrugSmall" && (n.itemHotkeys[0] = o.id);
      }
      return (this.grantBlessing(n), this.refresh(n), (n.hp = n.maxHP), (n.mp = n.maxMP), n);
    }
    grantBlessing(e) {
      const t = this.rules.adaptations.blessingTalisman;
      if (!(!t || e.claimedBlessing)) {
        if ([...e.inventory, ...e.equipment, ...e.storage].some((a) => a?.id === t.itemId)) {
          e.claimedBlessing = !0;
          return;
        }
        this.give(e, this.newItem(t.itemId), !1) && (e.claimedBlessing = !0);
      }
    }
    start(e) {
      const t = this.roles.find((a) => a.id === e);
      if (!t) throw new b(message("core.game.start.30dd0e6b0b"));
      migrateItemHotkeys(t, this.defs);
      for (let a = 0; a < t.equipment.length; a++) {
        const i = t.equipment[a];
        i &&
          this.defs.get(i.id)?.Type === "Mount" &&
          this.give(t, i, !1) &&
          (t.equipment[a] = null);
      }
      for (const a of this.roles) a.id !== e && this.dismissPets(a);
      ((this.active = e),
        $t(t, this.rules),
        (this.npc = 0),
        this.initializeMap(t.map),
        this.grantBlessing(t),
        this.rules.adaptations.noviceProgression &&
          zt(t, this.rules.adaptations.noviceProgression.spiritGrowth),
        xt(this, t),
        this.refresh(t),
        t.dead || this.gainXP(t, 0),
        xt(this, t) && this.refresh(t));
      for (const a of t.skills) this.settleSkillExperience(t, a);
    }
    refresh(e) {
      const t = this.rules.growth.baseStats.find((o) => o.Job === e.job);
      e.stats = Object.fromEntries(t.Stats.map((o) => [o.Type, On(o, e.job, e.level)]));
      const a =
        this.rules.adaptations.dreamRuntime?.heroGrowth[e.job]?.[String(Math.min(85, e.level))];
      (a &&
        Object.assign(e.stats, a, {
          Accuracy: 0,
          Agility: 0,
          NativeLuckFormula: 1,
        }),
        (e.stats.SkillGainMultiplier = 1));
      for (const o of e.equipment) {
        if (!o || (o.maxDura > 0 && o.currentDura === 0)) continue;
        const r = this.defs.get(o.id);
        for (const [c, l] of Object.entries(weaponGrowthStats(o, r)))
          e.stats[c] = (e.stats[c] || 0) + l;
        for (const [c, l] of Object.entries(Or(o, r))) e.stats[c] = (e.stats[c] || 0) + l;
        r.Unique.includes("Skill") && (e.stats.SkillGainMultiplier = 3);
        for (const [c, l] of Object.entries(r.Stats)) e.stats[c] = (e.stats[c] || 0) + l;
        for (const [c, l] of Object.entries({
          ...o.added,
          ...Object.fromEntries(
            Object.entries(Ar(o, e.job)).map(([u, h]) => [u, h + (o.added[u] || 0)]),
          ),
        }))
          e.stats[c] = (e.stats[c] || 0) + l;
      }
      if (
        e.equipment.some(
          (o) =>
            o &&
            !(o.maxDura > 0 && o.currentDura === 0) &&
            this.defs.get(o.id).Unique.includes("Muscle"),
        )
      )
        for (const o of ["BagWeight", "WearWeight", "HandWeight"])
          e.stats[o] = (e.stats[o] || 0) * 2;
      dr(e.stats, e.equipment, this.defs);
      for (const o of Gn(e.equipment, this.defs))
        for (const r of o.effects)
          if (o.count >= r.count)
            for (const [c, l] of Object.entries(r.stats)) e.stats[c] = (e.stats[c] || 0) + l;
      for (const o of e.equipment)
        if (o && (!o.maxDura || o.currentDura > 0))
          for (const [r, c] of Object.entries(this.defs.get(o.id).DreamSpecialStats || {}))
            e.stats[r] = (e.stats[r] || 0) + c;
      yr(this, e);
      const i = this.rules.adaptations.trial?.titles[(e.trial?.title || 0) - 1];
      if (i)
        for (const o of ["DC", "MC", "SC", "AC", "MAC"])
          ((e.stats["Min" + o] = (e.stats["Min" + o] || 0) + i.min),
            (e.stats["Max" + o] = (e.stats["Max" + o] || 0) + i.max));
      const n = Object.entries({
        Flame: "FireBall",
        Healing: "Healing",
        Blink: "Blink",
      })
        .filter(([o]) => this.special(e, o))
        .map(([, o]) => o);
      e.skills = e.skills.filter((o) => !o.temporary || n.includes(o.Spell));
      for (const o of n)
        e.skills.some((r) => r.Spell === o) ||
          e.skills.push({
            Spell: o,
            Level: 0,
            Key: 0,
            Experience: 0,
            CastTime: 0,
            temporary: !0,
          });
      for (const o of e.skills)
        for (const [r, c] of Object.entries(
          this.skill(e, o.Spell)?.d.DreamSkill
            ? dreamPassiveStats(
                this.skill(e, o.Spell).d,
                effectiveSkillLevel(o, this.skill(e, o.Spell).d, e.stats),
              )
            : br(o.Spell, o.Level),
        ))
          e.stats[r] = (e.stats[r] || 0) + c;
      for (const o of e.buffs)
        for (const [r, c] of Object.entries(o.stats)) e.stats[r] = (e.stats[r] || 0) + c;
      for (const o of [
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
        e.stats[o] =
          (e.stats[o] || 0) +
          Math.trunc(((e.stats[o] || 0) * (e.stats[o + "RatePercent"] || 0)) / 100);
      for (const [o, r] of Object.entries(t.Caps)) e.stats[o] = Math.min(r, e.stats[o] || 0);
      for (const o of [
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
        e.stats[o] = Math.max(0, e.stats[o] || 0);
      for (const o of ["DC", "MC", "SC"])
        e.stats["Min" + o] = Math.min(e.stats["Min" + o], e.stats["Max" + o]);
      Dr(e);
      const s = new Map();
      for (const o of e.equipment) {
        if (!o || (o.maxDura > 0 && !o.currentDura)) continue;
        const r = Math.min(8, Math.floor(ke(o)));
        r > 0 && s.set(r, (s.get(r) || 0) + 1);
      }
      ((e.stats.QualitySetDamagePercent = Math.max(
        0,
        ...[...s].filter(([, o]) => o >= 5).map(([o]) => o * 2),
      )),
        Ko(e, this.rules),
        tr(e, this.rules.adaptations.gemEnhancement),
        (e.maxHP = Math.max(1, e.stats.HP || 1)),
        (e.maxMP = Math.max(0, e.stats.MP || 0)),
        (e.hp = Math.min(e.hp, e.maxHP)),
        (e.mp = Math.min(e.mp, e.maxMP)));
      for (const o of Object.values(this.maps))
        for (const r of o.actors)
          r.friendly && !r.dead && r.master === e.id && this.refreshActor(r);
    }
    wearItem(e, t, a) {}
    special(e, t) {
      return e.equipment.some(
        (a) =>
          a &&
          !(a.maxDura > 0 && a.currentDura === 0) &&
          this.defs
            .get(a.id)
            .Unique.split(",")
            .map((i) => i.trim())
            .includes(t),
      );
    }
    buyback(e, t) {
      return (
        (e.buyback ??= {}),
        (e.buyback[t] = (e.buyback[t] || []).filter(
          (a) =>
            a.buybackAt === void 0 || a.buybackAt + this.rules.goods.BuyBackTime * 6e4 > this.time,
        ))
      );
    }
    bagWeight(e) {
      return e.inventory.reduce(
        (t, a) => t + (a ? (this.defs.get(a.id)?.Weight || 0) * a.count : 0),
        0,
      );
    }
    insert(e, t, a = 0, i = e.length) {
      const n = this.defs.get(t.id);
      let s = t.count;
      const o = [];
      if (n.StackSize > 1)
        for (let c = a; c < i; c++) {
          const l = e[c];
          if (
            l &&
            l.id === t.id &&
            l.count < n.StackSize &&
            JSON.stringify(l.added) === JSON.stringify(t.added) &&
            l.materialQuality === t.materialQuality &&
            !!l.bound == !!t.bound &&
            !!l.noSharedStorage == !!t.noSharedStorage
          ) {
            const u = Math.min(s, n.StackSize - l.count);
            if ((o.push([c, u]), (s -= u), !s)) break;
          }
        }
      const r = [];
      for (let c = a; c < i && s > 0; c++)
        if (!e[c]) {
          const l = Math.min(s, n.StackSize || 1);
          (r.push([c, l]), (s -= l));
        }
      if (s) return !1;
      for (const [c, l] of o) e[c].count += l;
      for (const [c, l] of r)
        e[c] = {
          ...structuredClone(t),
          uid: r.length === 1 ? t.uid : this.nextId++,
          count: l,
        };
      return !0;
    }
    give(e, t, a = !0) {
      const i = this.defs.get(t.id),
        n = i.Type === "Quest" ? e.questInventory : e.inventory,
        [s, o] = i.Type === "Quest" ? [0, n.length] : bagRange(e, this.rules, i);
      return this.insert(n, t, s, o)
        ? (a &&
            this.emit(i.Type === "Quest" ? "GainedQuestItem" : "GainedItem", {
              Item: {
                ItemIndex: t.id,
                Count: t.count,
              },
            }),
          !0)
        : !1;
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
          P(r, a) > 5 ||
          (a.expires && a.expires <= this.time) ||
          a.item?.id === this.rules.adaptations.adventure.chestId ||
          (!a.gold && !["Potion", "ExperienceScroll"].includes(this.defs.get(a.item?.id)?.Type))
        ) return true;
        return !this.transferGroundLoot(r, a);
      });
    }
    count(e, t) {
      return [...e.questInventory, ...e.inventory].reduce(
        (a, i) => a + (i?.id === t ? i.count : 0),
        0,
      );
    }
    consume(e, t, a) {
      if (this.count(e, t) < a) return !1;
      if (
        [...e.questInventory, ...e.inventory]
          .filter((n) => n?.id === t && !Pe(n))
          .reduce((n, s) => n + s.count, 0) < a
      )
        throw new b(message("manage.protected"));
      for (const n of [e.questInventory, e.inventory])
        for (let s = 0; s < n.length && a; s++) {
          const o = n[s];
          if (o?.id !== t || Pe(o)) continue;
          const r = Math.min(a, o.count);
          ((o.count -= r), (a -= r), o.count || (n[s] = null));
        }
      return !0;
    }
    skill(e, t) {
      const a = e.skills.find((n) => n.Spell === t),
        i = this.rules.skills.find((n) => n.Spell === t);
      return a && i
        ? {
            s: a,
            d: i,
            level: effectiveSkillLevel(a, i, e.stats),
          }
        : null;
    }
    levelSkill(e, t) {
      const a = this.rules.skills.find((o) => o.Spell === t.Spell);
      if (a.DreamBookProgression) return;
      const i =
        e.level === 65535
          ? 255
          : ((this.rng.next(3) + 1) * Math.min(255, e.stats.SkillGainMultiplier || 1)) & 255;
      if (t.Level >= 3) return;
      const n = [a.Need1, a.Need2, a.Need3][t.Level],
        s = [a.Level1, a.Level2, a.Level3][t.Level];
      e.level < s || ((t.Experience += i), this.settleSkillExperience(e, t));
    }
    settleSkillExperience(e, t) {
      const a = this.rules.skills.find((i) => i.Spell === t.Spell);
      if (!(!a || a.DreamBookProgression))
        for (
          ;
          t.Level < 3 &&
          e.level >= [a.Level1, a.Level2, a.Level3][t.Level] &&
          t.Experience >= [a.Need1, a.Need2, a.Need3][t.Level];

        )
          ((t.Experience = t.Level === 2 ? 0 : t.Experience - [a.Need1, a.Need2, a.Need3][t.Level]),
            t.Level++,
            this.say(message("core.game.settleSkillExperience.fcc8d6a282")),
            this.refresh(e));
    }
    gainXP(e, t, a = 0, i = e) {
      if (
        (isHell(this.rules) ||
          (t += Math.trunc((t * Math.max(0, e.stats.ExpRatePercent || 0)) / 100)),
        !(isHell(this.rules) && t === 0))
      ) {
        ((t += Math.max(0, Math.trunc(a))), (e.xp += t), ms(this, e, t, i));
        for (const n of this.map(e.map).actors.filter(
          (s) => s.friendly && s.master === e.id && !s.dead && P(s, e) <= 16,
        )) {
          n.special ??= {};
          const s = n.special,
            o = Number(s.petLevel || 0),
            r = Number(s.maxPetLevel || 0);
          if (n.special?.dreamPet || o >= r) continue;
          s.petXP = Number(s.petXP || 0) + t * ([18, 23, 38].includes(n.ai || 0) ? 3 : 1);
          while (Number(s.petLevel || 0) < r && Number(s.petXP) >= 100) {
            s.petXP = Number(s.petXP) - 100;
            s.petLevel = Number(s.petLevel || 0) + 1;
          }
          if (s.petLevel !== o) this.refreshActor(n);
        }
        for (
          ;
          e.level < this.rules.growth.experience.length &&
          e.xp >= this.rules.growth.experience[e.level - 1];

        )
          ((e.xp -= this.rules.growth.experience[e.level - 1]),
            e.level++,
            this.refresh(e),
            (e.hp = e.maxHP),
            (e.mp = e.maxMP),
            this.say(
              message("core.game.gainXP.4c7c6d8205", {
                p0: e.level,
              }),
            ));
        xt(this, e) && this.refresh(e);
        for (const n of e.skills) this.settleSkillExperience(e, n);
        t > 0 &&
          this.emit("GainedExperience", {
            ObjectID: e.id,
            Amount: t,
          });
      }
    }
    buff(e, t, a, i = 0, n = {}, s = this.active, o) {
      if (
        (e.kind === "monster" && !targetableMonster(e)) ||
        ($(this, e)?.poisonImmune && ["Green", "Red", "DreamPoisonArmour"].includes(t))
      )
        return;
      const r = $(this, e)?.statusAvoidPercent?.[t];
      if (r && this.rng.next(100) < r) return;
      t === "NativeCurse" &&
        (n = {
          ...n,
          NativeCursePercent: i,
        });
      const c = ["Green", "Red", "DreamPoisonArmour"].includes(t)
        ? "Poison"
        : ["Paralysis", "LRParalysis", "Stun"].includes(t)
          ? "Stone"
          : ["Slow", "Frozen", "DreamFrost"].includes(t)
            ? "Freeze"
            : "";
      if (c) {
        const h = e.kind === "player" && this.rules.adaptations.dreamRuntime;
        if (h) {
          if (["Poison", "Stone"].includes(c)) {
            const p = e.buffs.find((y) => y.type === "InnateQi" && y.until > this.time),
              g = p ? this.skill(e, "InnateQi")?.level || p.value : 0;
            a -=
              Math.max(0, g - 3) * 1e3 +
              (e.stats["NativeState:" + (c === "Poison" ? 39 : 40)] || 0) * 1e3;
          }
          a = Math.max(1500, a);
        }
        if (e.stats[c + "DodgePercent"] && this.rng.next(100) < e.stats[c + "DodgePercent"]) return;
        a = Math.max(
          h ? 1e3 : 0,
          Math.floor(a * (1 - Math.min(100, e.stats[c + "RecoveryPercent"] || 0) / 100)),
        );
      }
      if (a <= 0) return;
      const l = e.buffs.find((h) => h.type === t && h.until > this.time);
      if (
        (l && ["Paralysis", "LRParalysis"].includes(t)) ||
        (l && t === "Red" && l.until - this.time > a)
      )
        return;
      e.buffs = e.buffs.filter((h) => h.type !== t && !(t === "Slow" && h.type === "DreamFrost"));
      const u =
        t === "Green" &&
        o !== "NativeDeathPoison" &&
        this.actor(s)?.kind === "monster" &&
        !this.actor(s)?.friendly;
      return (
        e.buffs.push({
          type: t,
          until: this.time + a,
          next: t === "Green" && l ? l.next : this.time + (u ? 2e3 : 1e3),
          ...(u
            ? {
                interval: 2e3,
                nativeMonsterPoison: !0,
              }
            : {}),
          ...(t === "Green" && l?.interval
            ? {
                interval: l.interval,
              }
            : {}),
          value: i,
          stats: n,
          source: s,
          ...(o
            ? {
                spell: o,
              }
            : {}),
        }),
        this.refreshActor(e),
        e.buffs[e.buffs.length - 1]
      );
    }
    refreshActor(e) {
      refreshSummonLevelCap(this, e);
      if (e.kind === "player") return this.refresh(e);
      const t = this.monsters.get(e.definition);
      if (!t) return;
      const a = e.maxHP,
        i = e.hp;
      if (
        ((e.stats = {
          ...t.Stats,
        }),
        applyBossHealthStats(this, e),
        Ya(e),
        e.friendly)
      ) {
        const n = Number(e.special?.petLevel || 0);
        if (e.special?.dreamPet) {
          if (e.special.dreamTamed) {
            e.stats.HP = (e.stats.HP || 0) + 20 * n;
            for (const r of ["MinAC", "MaxAC", "MinMAC", "MaxMAC"])
              e.stats[r] = (e.stats[r] || 0) + 2 * n;
          }
          const o = e.special.dreamTamed ? 1 : 0;
          for (let r = 0; r < n; r++) {
            const c = e.stats.MinDC || 0,
              l = e.stats.MaxDC || 0;
            ((e.stats.MinDC = Math.max(c + o, Math.trunc(Math.fround(c * Math.fround(1.05))))),
              (e.stats.MaxDC = Math.max(l + o, Math.trunc(Math.fround(l * Math.fround(1.15))))));
          }
        } else
          for (const [o, r] of Object.entries({
            HP: 20,
            MinAC: 2,
            MaxAC: 2,
            MinMAC: 2,
            MaxMAC: 2,
            MinDC: 1,
            MaxDC: 1,
          }))
            e.stats[o] = (e.stats[o] || 0) + n * r;
        const s = Number(e.special?.nativeBeastArmourRank || 0);
        (s &&
          ((e.stats.MinAC = (e.stats.MinAC || 0) + 6 * s),
          (e.stats.MinMAC = (e.stats.MinMAC || 0) + 3 * s),
          (e.stats.MaxDC = (e.stats.MaxDC || 0) + 7 * s),
          (e.stats.Agility = (e.stats.Agility || 0) + s)),
          fs(this, e),
          (e.maxHP = Math.max(1, e.stats.HP || 1)),
          (e.hp =
            a > 0 && a !== e.maxHP
              ? Math.min(i, Math.max(i > 0 ? 1 : 0, Math.floor((Math.max(0, i) / a) * e.maxHP)))
              : Math.min(e.hp, e.maxHP)));
      }
      for (const n of e.buffs.filter((s) => s.type !== "DreamBossAbility"))
        for (const [s, o] of Object.entries(n.stats)) e.stats[s] = (e.stats[s] || 0) + o;
      for (const n of ["MinDC", "MaxDC"])
        e.stats[n] = Math.max(
          0,
          Math.floor((e.stats[n] || 0) * (1 + (e.stats[n + "RatePercent"] || 0) / 100)),
        );
    }
    schedule(e, t, a, i, n, s = "ACAgility", o) {
      const r = {
        kind: e,
        at: this.time + t,
        order: this.nextOrder++,
        source: a.id,
        target: i.id,
        map: a.map,
        damage: n,
        defence: s,
        spell: o,
      };
      return (this.events.push(r), this.events.sort((c, l) => c.at - l.at || c.order - l.order), r);
    }
    safe(e) {
      return this.geometry.get(e.map)?.safeZones.some((t) => P(e, t) <= t.size) ?? !1;
    }
    deferBuff(e, t, a, i, n = 0, s = {}, o = 500, r = 1e3, c) {
      this.schedule("buff", o, e, t, 0, "None", c);
      const l = this.events.find((u) => u.order === this.nextOrder - 1);
      l.effect = {
        type: a,
        duration: i,
        value: n,
        stats: s,
        interval: r,
      };
    }
    damage(e, t, a, i = "ACAgility", n, s = !1, o = !1, r = !1) {
      if (
        (e.friendly &&
          e.master &&
          this.roles.find((A) => A.id === e.master)?.stats.AdventureTaoist &&
          (a = Math.floor(a * 1.15)),
        (e.dead && !(s && nativeDeathSource(this, e, n))) ||
          t.dead ||
          (t.kind === "monster" && !targetableMonster(t)) ||
          e.map !== t.map ||
          (t.kind === "player" && this.safe(t)))
      )
        return 0;
      const c = t.special?.bossChannelIndex,
        l = c === void 0 ? void 0 : $(this, t)?.attacks[Number(c)]?.channel;
      if (
        !o &&
        l?.invulnerable &&
        this.time < Number(t.special?.bossChannelUntil) &&
        !t.buffs.some(
          (A) =>
            A.until > this.time &&
            ["Paralysis", "Frozen", "Stun", "Trap", "Shock"].includes(A.type),
        )
      )
        return 0;
      const u = t.buffs.find((A) => A.type === "DreamBossShield");
      u && i !== "None" && (a = Math.floor(a * (1 - u.value / 100)));
      const h = Ns(this, e, a, r && !s && !o && i !== "None");
      ((a = Cs(this, e, a, i, n)),
        (a = ao(this, e, t, a, n)),
        (a = ir(this, e, t, a, n)),
        (a = Ir(this, e, t, a, n, i)));
      const p = t.hp;
      let g = !0,
        y = 0;
      const f = !!this.rules.adaptations.dreamRuntime;
      (f
        ? (i.startsWith("AC") || i === "Agility") &&
          this.rng.next(10) >= Math.max(2, (e.stats.Accuracy || 0) - (t.stats.Agility || 0) + 8) &&
          (g = !1)
        : i.includes("Agility") &&
          this.rng.next((t.stats.Agility || 0) + 1) > (e.stats.Accuracy || 0) &&
          (g = !1),
        i.startsWith("AC") &&
          t.stats.PhysicalDodgePercent &&
          this.rng.next(100) < t.stats.PhysicalDodgePercent &&
          (g = !1),
        i.startsWith("MAC")
          ? (t.stats.MagicDodgePercent &&
              this.rng.next(100) < t.stats.MagicDodgePercent &&
              (g = !1),
            !f &&
              this.rng.next(this.rules.constants.MagicResistWeight) < (t.stats.MagicResist || 0) &&
              (g = !1),
            (y = this.rng.next(
              Math.max(t.stats.MinMAC || 0, t.stats.MaxMAC || 0) + 1,
              t.stats.MinMAC || 0,
            )))
          : i.startsWith("AC") &&
            (y = this.rng.next(
              Math.max(t.stats.MinAC || 0, t.stats.MaxAC || 0) + 1,
              t.stats.MinAC || 0,
            )),
        t.kind === "player" &&
          i !== "None" &&
          (y = Math.floor(
            y * (1 + ((t.stats.NativeDefencePercentLow || 0) + affixRangeExtra(this, t, 11)) / 100),
          )));
      const v = t.buffs.find((A) => A.type === "DreamPoisonArmour");
      (e.kind === "player" &&
        i !== "None" &&
        (y = Math.floor(y * (1 - Math.min(100, e.stats.WeakSpotPercent || 0) / 100))),
        v && (y = Math.floor(y * (1 - v.value / 100))));
      const x = e.kind === "player" ? this.skill(e, n || "") : null;
      (x?.d.DreamSkill &&
        (n === "FlameDisruptor" || (n === "SoulFireBall" && x.level >= 4)) &&
        (y = Math.floor(y * 0.5)),
        x?.d.DreamSkill && n === "DragonFlame" && (y = Math.trunc(y / Math.max(1, x.level))),
        t.buffs.some((A) => A.type === "Red") &&
          (y = Math.trunc(y * (t.kind === "monster" ? 0.5 : 0.9))),
        g && e.kind === "player" && i.startsWith("AC") && this.wearItem(e, 0, this.rng.next(4) + 1),
        (i.endsWith("Bypass") || i.endsWith("NoArmor")) && (y = 0));
      const m = t.buffs.find((A) => A.type === "MagicShield");
      let M = a + (i === "None" || e.kind !== "player" ? 0 : e.stats.AttackBonus || 0);
      if (i !== "None" && t.kind === "player") {
        const A =
          t.stats.DamageReductionPercent ||
          (m && !this.skill(t, "MagicShield")?.d.DreamSkill ? (m.value + 2) * 10 : 0);
        M -= Math.trunc((M * A) / 100);
      }
      const k =
        g &&
        M > y &&
        e.kind === "player" &&
        !t.friendly &&
        i === "AC" &&
        n === "None" &&
        ds(this, e);
      k &&
        (M = Math.floor(
          M * (this.rules.adaptations.noviceProgression?.heavyStrike?.multiplier || 1),
        ));
      let w = g ? Math.max(0, M - y) : 0;
      (!f &&
        i !== "None" &&
        e.kind === "player" &&
        w > 0 &&
        this.rng.next(100) <
          (e.stats.CriticalRate || 0) * this.rules.constants.CriticalRateWeight +
            (e.stats.GemCriticalRatePercent || 0) +
            (e.stats.DreamCritPercent || 0) +
            (e.stats.NativeCriticalPoints || 0) * 5 +
            affixRangeExtra(this, e, 44) &&
        ((M += Math.floor(
          M *
            (this.rules.adaptations.dreamRuntime
              ? Math.max(
                  0.25 +
                    ((e.stats.DreamCritDamagePercent || 0) + affixRangeExtra(this, e, 45)) / 100,
                  e.stats.GemCriticalRatePercent ? 0.5 : 0,
                )
              : Math.max(
                  ((e.stats.CriticalDamage || 0) / this.rules.constants.CriticalDamageWeight) * 10,
                  e.stats.GemCriticalRatePercent ? 0.5 : 0,
                  ((e.stats.DreamCritDamagePercent || 0) + affixRangeExtra(this, e, 45)) / 100,
                )),
        )),
        (w = M - y)),
        h.raw || (w = fi(this, t, w, i.endsWith("Bypass") ? "None" : i)),
        t.kind === "player" &&
          i !== "None" &&
          (w = Math.floor(
            w *
              (1 -
                Math.min(
                  100,
                  t.stats[
                    i.startsWith("AC") ? "NativePhysicalAbsorbPercent" : "NativeMagicAbsorbPercent"
                  ] || 0,
                ) /
                  100),
          )),
        t.kind === "player" && i !== "None" && (w = ln(this, t, w, i)));
      let E = 0;
      if (h.raw) {
        if (g) {
          let A = this.rng.next(
            Math.max(t.stats.MinMAC || 0, t.stats.MaxMAC || 0) + 1,
            t.stats.MinMAC || 0,
          );
          (t.kind === "player" &&
            (A = Math.floor(
              A *
                (1 + ((t.stats.NativeDefencePercentLow || 0) + affixRangeExtra(this, t, 11)) / 100),
            )),
            v && (A = Math.floor(A * (1 - v.value / 100))),
            t.buffs.some((N) => N.type === "Red") &&
              (A = Math.trunc(A * (t.kind === "monster" ? 0.5 : 0.9))));
          const C =
            t.kind === "player"
              ? t.stats.DamageReductionPercent ||
                (m && !this.skill(t, "MagicShield")?.d.DreamSkill ? (m.value + 2) * 10 : 0)
              : 0;
          ((E = Math.max(0, h.raw - Math.trunc((h.raw * C) / 100) - A)),
            t.kind === "player" &&
              ((E = Math.floor(
                E * (1 - Math.min(100, t.stats.NativeMagicAbsorbPercent || 0) / 100),
              )),
              (E = ln(this, t, E, "MAC"))));
        }
        w = fi(this, t, w + E, "MAC");
      }
      (m &&
        w > 0 &&
        i !== "None" &&
        !this.skill(t, "MagicShield")?.d.DreamSkill &&
        (m.until = Math.max(this.time, m.until - w * 60)),
        t.kind === "monster" &&
          t.stats.NativeDamageReductionPercent &&
          (w = Math.trunc(w * (1 - t.stats.NativeDamageReductionPercent / 100))),
        (w = sr(this, t, w)));
      const W = $(this, t)?.incomingDamageCap;
      if (
        (W !== void 0 && w > 0 && (w = Math.min(w, W)),
        this.emit("DamageIndicator", {
          ObjectID: t.id,
          Type: g ? (w ? (k ? "HeavyStrike" : "Hit") : "Blocked") : "Miss",
          SourceID: e.id,
          Damage: -w,
          ...(w > 0 && E > 0
            ? {
                ElementalTypes: h.types,
              }
            : {}),
        }),
        e !== t && (Kt(e, this.time), Kt(t, this.time)),
        !w)
      )
        return 0;
      if ((Ds(this, e, t, w, i), t.ai === 55 && t.master)) {
        const A = this.actor(t.master);
        if (A)
          return (
            (A.mp = Math.max(0, A.mp - w)),
            (t.target = e.id),
            this.emit("ObjectStruck", {
              ObjectID: t.id,
            }),
            A.mp || this.die(t, e),
            w
          );
      }
      if (
        (t.stats.EnergyShieldPercent &&
          this.rng.next(100) < t.stats.EnergyShieldPercent &&
          (t.hp = Math.min(t.maxHP, t.hp + (t.stats.EnergyShieldHPGain || 0))),
        t.kind === "player" && t.mp > 0 && this.special(t, "Protection")
          ? (t.mp = Math.max(0, t.mp - w))
          : (t.hp = Math.max(0, t.hp - w)),
        t.kind === "player" && (t.attackModes.channel = !1),
        n === "EvilCentipede" && !$(this, e) && t.hp > 0)
      )
        for (const [A, C, N] of [
          ["Green", 5, 3e4],
          ["Paralysis", 15, 1e4],
        ]) {
          const R = z(e.stats, "SC", this.rng);
          if (
            this.rng.next(this.rules.constants.PoisonResistWeight) >= (t.stats.PoisonResist || 0) &&
            this.rng.next(C) === 0
          ) {
            this.buff(t, A, N, R, {}, e.id);
            const I = t.buffs.find((B) => B.type === A);
            I && ((I.interval = 2e3), (I.next = this.time + 2e3));
          }
        }
      n === "CaveMaggot" &&
        t.hp > 0 &&
        this.rng.next(this.rules.constants.PoisonResistWeight) >= (t.stats.PoisonResist || 0) &&
        this.rng.next(20) === 0 &&
        this.buff(t, "Paralysis", 5e3, z(e.stats, "SC", this.rng), {}, e.id);
      const j = e.hp;
      if (e.kind === "player" && t.kind === "monster" && i.startsWith("AC")) {
        const A = e,
          C = this.monsters.get(t.definition).Level,
          N = C > A.level ? 0 : Math.min(10, A.level - C);
        if (
          (this.special(A, "Paralize") &&
            this.rng.next(15, 1) === 1 &&
            this.buff(t, "Paralysis", 5e3, 0, {}, A.id),
          e.stats.Freezing > 0 &&
            this.rng.next(this.rules.constants.FreezingAttackWeight) < e.stats.Freezing &&
            this.rng.next(N) === 0 &&
            this.buff(
              t,
              "Slow",
              Math.min(10, 3 + this.rng.next(e.stats.Freezing)) * 1e3,
              0,
              {},
              A.id,
            ),
          e.stats.PoisonAttack > 0 &&
            this.rng.next(this.rules.constants.PoisonAttackWeight) < e.stats.PoisonAttack &&
            this.rng.next(N) === 0 &&
            this.buff(
              t,
              "Green",
              5e3,
              Math.min(10, 3 + this.rng.next(e.stats.PoisonAttack)),
              {},
              A.id,
            ),
          !this.rules.adaptations.dreamRuntime &&
            e.stats.HPDrainRatePercent > 0 &&
            ((A.special ??= {}),
            (A.special.hpDrain =
              Number(A.special.hpDrain || 0) +
              Math.fround(Math.fround(w / 100) * e.stats.HPDrainRatePercent)),
            Number(A.special.hpDrain) > 2))
        ) {
          const R = Math.floor(Number(A.special.hpDrain));
          ((A.hp = Math.min(A.maxHP, A.hp + R)),
            (A.special.hpDrain = Number(A.special.hpDrain) - R));
        }
      }
      if (
        (i !== "None" && !s && Es(this, e, t, Math.min(w, p), n),
        Hr(this, e, t, Math.min(w, p), i, n),
        s || (Rr(this, e, t, Math.min(w, p), i), affixManaOnHit(this, e, t, Math.min(w, p), i)),
        or(e, t, Math.min(w, Math.max(0, p)), i),
        e.kind === "player" &&
          e.hp > j &&
          this.emit("DamageIndicator", {
            ObjectID: e.id,
            Type: "Heal",
            Damage: e.hp - j,
          }),
        !o && !us(this, e, t) && (t.target = e.id),
        (!t.stats.NoFlinchPercent ||
          this.rng.next(100) >= Math.min(100, t.stats.NoFlinchPercent)) &&
          (this.emit("ObjectStruck", {
            ObjectID: t.id,
          }),
          t.kind === "player" &&
            ((t.actionAt = Math.max(t.actionAt, this.time + 200)),
            (t.moveAt = Math.max(t.moveAt, this.time + 200)),
            (t.attackAt = Math.max(t.attackAt, this.time + 200)))),
        t.kind === "player" && i !== "None")
      )
        for (let A = 1; A < t.equipment.length; A++) this.wearItem(t, A, 1);
      if (n === "Vampirism" && e.kind === "player") {
        const A = this.skill(e, n)?.s.Level || 0;
        this.schedule("vamp", 1e3, e, e, Math.trunc(w * (A + 1) * 0.25));
      }
      return (
        (t.buffs = t.buffs.filter((A) => A.type !== "LRParalysis" && A.type !== "Trap")),
        ((t.special ??= {}).lastReceivedDamage = w),
        !t.hp && !(t.kind === "monster" && Ls(this, t))
          ? this.die(t, e)
          : t.kind === "player" && Ks(this, t, e),
        oo(this, e, t, w, i, a, n),
        xr(this, e, t, w, n),
        w
      );
    }
    die(e, t) {
      if (e.kind === "player" && e.trialRun) {
        at(this, e, message("trial.failed"));
        return;
      }
      if (e.dead) return;
      if (e.kind === "player") {
        delete e.mountUid;
        const g = e;
        if (
          ((g.special ??= {}),
          this.time > Number(g.special.revivalAt || 0) &&
            [g.equipment[7], g.equipment[8]].find(
              (f) => f && f.currentDura >= 1e3 && this.defs.get(f.id).Unique.includes("Revival"),
            ))
        ) {
          ((g.special.revivalAt = this.time + 3e5),
            (g.hp = g.maxHP),
            this.refresh(g),
            this.say(message("core.game.die.de43815918")));
          return;
        }
        for (const y of Object.values(this.maps))
          for (const f of y.actors) f.friendly && f.master === g.id && !f.dead && this.die(f, t);
        this.safe(g) || this.deathDrop(g);
      }
      if (isSpirit(this, e) && e.master) {
        const g = this.roles.find((y) => y.id === e.master);
        g &&
          ((g.spiritProgress = {
            level: 0,
            xp: 0,
            curveVersion: 4,
          }),
          this.say(message("skill.spirit.died")));
      }
      if (
        ((e.dead = !0),
        (e.hp = 0),
        (e.target = 0),
        (e.expires = this.time + 1e4),
        e.ai === 25 &&
          e.special &&
          ((e.special.reviveAt = this.time + (4 + this.rng.next(20)) * 1e3),
          Number(e.special.revivals) < Number(e.special.lives) &&
            (e.expires = Number(e.special.reviveAt) + 1e3)),
        (e.buffs = []),
        this.emit("ObjectDied", {
          ObjectID: e.id,
        }),
        e.kind === "monster" && Mo(this, e),
        e.kind === "player")
      ) {
        this.say(message("core.game.die.016e77d339"));
        return;
      }
      const a = this.monsters.get(e.definition);
      if (
        !a ||
        e.friendly ||
        e.special?.bossMinion ||
        (isHell(this.rules) &&
          e.ai === 25 &&
          Number(e.special?.revivals || 0) < Number(e.special?.lives || 0))
      )
        return;
      vs(this, e);
      const i =
        t.kind === "player"
          ? t
          : t.friendly
            ? isHell(this.rules)
              ? this.roles.find((g) => g.id === t.master)
              : this.me
            : void 0;
      if (
        (i && La(this, i),
        e.spawn !== void 0 &&
          !this.region(e.map).spawns[e.spawn].native &&
          this.region(e.map).spawns[e.spawn].respawnPhaseSeconds === void 0 &&
          (this.map(e.map).respawns[e.spawn] =
            this.time + this.region(e.map).spawns[e.spawn].respawnMinutes * 6e4),
        i && !i.dead && i.map === e.map)
      ) {
        (this.emit("MonsterKilled", {
          ObjectID: i.id,
          MonsterIndex: a.Index,
        }),
          isHell(this.rules) || Ta(this, i, Number(e.special?.trialXP ?? a.Experience)),
          (t.kind === "player" || t.master === i.id) &&
            bs(this, i, e, Number(e.special?.trialXP ?? a.Experience)),
          Tr(this, i),
          Mr(this, e, i),
          ur(this, e, i));
        const g = this.rules.adaptations.earlyLoot,
          y = Math.min(
            Math.max(0, i.maxHP - i.hp),
            Math.max(0, Math.min(g.killHPCap, i.stats.KillHP || 0)),
          ),
          f = Math.min(
            Math.max(0, i.maxMP - i.mp),
            Math.max(0, Math.min(g.killMPCap, i.stats.KillMP || 0)),
          );
        if (
          ((i.hp += y),
          (i.mp += f),
          (y || f) &&
            this.say(
              message("core.game.die.6915136761", {
                p0: y,
                p1: f,
              }),
            ),
          !this.rules.adaptations.dreamRuntime && a.Name === "Scarecrow" && !i.firstScarecrowReward)
        ) {
          const v = this.rules.items.find((m) => m.Name === g.firstScarecrowWeapon),
            x = this.newItem(v.Index);
          ((x.added[
            {
              Warrior: "MaxDC",
              Wizard: "MaxMC",
              Taoist: "MaxSC",
            }[i.job]
          ] = 1),
            this.ground(e, x),
            (i.firstScarecrowReward = !0),
            this.say(message("core.game.die.3f0d3da9b1")));
        }
      }
      if (i) {
        if (isHell(this.rules)) {
          const g = hellXP(
            this.rules,
            i,
            e,
            a,
            (i.stats.NativeKillXPPercent || 0) + affixRangeExtra(this, i, 63),
          );
          (t.kind === "player" && Ta(this, i, g),
            (a.DreamOriginalId !== void 0 || e.special?.trialXP) && this.gainXP(i, g || 1, 0, e),
            this.rules.adaptations.dreamRuntime.hell.sceneHalfExperience.includes(e.map) &&
              this.gainXP(
                i,
                Math.trunc(Number(e.special?.trialXP ?? a.Experience) / 2) || 1,
                0,
                e,
              ));
        } else
          this.gainXP(
            i,
            Math.trunc(
              (Number(e.special?.trialXP ?? a.Experience) *
                (1 + Number(e.special?.expAdd || 0) / 100) *
                (1 + ((i.stats.NativeKillXPPercent || 0) + affixRangeExtra(this, i, 63)) / 100) *
                (100 - 25 * Number(e.special?.revivals || 0))) /
                100,
            ) *
              (this.rules.multipliers.monsterExperienceMultiplier +
                je(this.rules.adaptations.dreamRuntime).experienceBonusPercent / 100),
            i.stats.KillXP || 0,
            e,
          );
        for (const g of i.quests) {
          const y = this.rules.quests.find((f) => f.Index === g.id);
          (!y?.taskMaps?.length || y.taskMaps.includes(e.map)) &&
            (g.kills[a.Index] = (g.kills[a.Index] || 0) + 1);
        }
      }
      if (
        (i && ts(this, i, e, a), e.special?.trialFloor && i && (Wo(this, i), !e.special.trialBoss))
      )
        return;
      const n = hasBossLootBudget(a, this.rules),
        s = [],
        o = ss(this.rules, a, e);
      let r = 0,
        c = 0,
        l = isHell(this.rules) ? hellAffixBudget(e, this.rng, this.rules) : 0;
      const u = this.rules.adaptations.dreamRuntime,
        h =
          (Math.max(0, i?.stats.ItemDropRatePercent || 0) +
            je(this.rules.adaptations.dreamRuntime).dropBonusPercent) /
          100,
        p = this.rules.adaptations.dreamRuntime
          ? 1
          : 1 + Math.floor(h) + (h % 1 > 0 && this.rng.next(1e4) < (h % 1) * 1e4 ? 1 : 0);
      for (let g = 0; g < p; g++)
        for (const y of o) {
          if (
            y.item !== null &&
            this.defs.get(y.item)?.BossRelic &&
            (e.special?.trialBoss || e.special?.trialFloor)
          )
            continue;
          const f =
            y.dropMultiplierMode === "fixed"
              ? 1
              : u
                ? y.dropMultiplierMode === "casual-only"
                  ? u.casual?.enabled
                    ? u.casual.baseDropMultiplier + u.casual.dropAdd
                    : 1
                  : dreamItemDropMultiplier(
                      u,
                      (i?.stats.ItemDropRatePercent || 0) +
                        (isHell(this.rules) ? 0 : Number(e.special?.dropAdd || 0)),
                    )
                : 1;
          let v = u
            ? y.chancePercent !== void 0
              ? {
                  ...y,
                  chancePercent: Math.min(100, y.chancePercent * f),
                }
              : {
                  ...y,
                  chance: dreamDropDenominator(y.chance, f),
                }
            : y;
          (u &&
            y.chanceBonusPercent &&
            (v = {
              ...v,
              chancePercent:
                Math.round(
                  Math.min(100, (v.chancePercent ?? 100 / v.chance) + y.chanceBonusPercent) * 100,
                ) / 100,
            }),
            i &&
              De(i, this.rules)?.guaranteedQuestMaterials &&
              y.item !== null &&
              this.needsQuestItem(i, y.item, e.map) &&
              (v = {
                ...v,
                chance: 1,
              }));
          const x = Ca(v, this.defs, this.rules, this.rng);
          if (x) {
            x.gold && (n || u?.lootVolume ? ((r += x.gold), c++) : this.ground(e, void 0, x.gold));
            for (const m of x.items) {
              const M = this.defs.get(m.id);
              if (M.Type === "Quest") {
                g === 0 &&
                  i &&
                  this.needsQuestItem(i, m.id, e.map) &&
                  this.give(i, this.newItem(m.id));
                continue;
              }
              if (!m.quest) {
                const k = this.newItem(
                  m.id,
                  1,
                  !0,
                  a,
                  i,
                  isHell(this.rules) ? $r(e, this.rules) : Number(e.special?.magicAdd || 0),
                );
                (isHell(this.rules) && (l = Gr(k, M, e, this.rng, this.rules, l)),
                  n || u?.lootVolume ? s.push(k) : this.ground(e, k));
              }
            }
          }
        }
      if (
        (!isHell(this.rules) && u && (n || u.lootVolume) && os(this, e, a, i, s), u?.lootVolume)
      ) {
        const g = hasUnrestrictedNativeLoot(a, this.rules);
        if (g && !isChallengeChest(a, this.rules))
          for (const f of qi(s, o, this.defs, this.rng, c)) s.push(this.newItem(f, 1, !0, a, i));
        const y = Io(s, this.defs, this.rng, u.lootVolume, g, r, (f) =>
          i ? this.questItemDeficit(i, f, e.map) : 0,
        );
        for (const f of y.items) this.ground(e, f);
        (y.gold && this.ground(e, void 0, Math.min(4294967295, y.gold)),
          this.dropBossGold(e, a, i),
          this.dropBossAccessories(e, a, i));
        return;
      }
      if (n) {
        if (this.rules.adaptations.dreamRuntime)
          for (const y of qi(s, o, this.defs, this.rng, c)) s.push(this.newItem(y, 1, !0, a, i));
        const g = this.rules.adaptations.dreamRuntime ? s : ys(s, this.defs, this.rules, this.rng);
        for (const y of g) this.ground(e, y);
        r && this.ground(e, void 0, Math.min(4294967295, r));
      }
      (this.dropBossGold(e, a, i), this.dropBossAccessories(e, a, i));
    }
    dropBossAccessories(e, t, a) {
      const i = this.rules.adaptations.bossAccessories;
      if (
        !i ||
        !a ||
        e.friendly ||
        e.special?.bossMinion ||
        e.special?.trialBoss ||
        e.special?.trialFloor ||
        e.special?.trialXP ||
        !i.bossIds.includes(t.Index)
      )
        return;
      const n = i.tiers.find((s) => t.Level <= s.maxBossLevel);
      if (n)
        for (const s of n.items)
          this.rng.next(1e4) < i.chancePercent * 100 &&
            this.ground(e, this.newItem(s, 1, !0, t, a, Number(e.special?.magicAdd || 0)));
    }
    dropBossGold(e, t, a) {
      const i = this.rules.adaptations.bossGold;
      i &&
        a &&
        !e.friendly &&
        !e.special?.bossMinion &&
        !e.special?.trialXP &&
        i.entries[String(t.Index)]?.includes(e.map) &&
        this.rng.next(1e4) < i.chancePercent * 100 &&
        this.ground(e, this.newItem(i.item));
    }
    dropPosition(e) {
      const t = this.geometry.get(e.map);
      if (!t)
        return {
          x: e.x,
          y: e.y,
        };
      const a = new Set(
          this.map(e.map)
            .actors.filter((s) => s.kind === "item" && s.id !== e.id)
            .map((s) => `${s.x},${s.y}`),
        ),
        i = [
          {
            x: e.x,
            y: e.y,
          },
        ],
        n = new Set([`${e.x},${e.y}`]);
      for (let s = 0; s < i.length; s++) {
        const o = i[s];
        if (!a.has(`${o.x},${o.y}`) && this.walkable(e.map, o.x, o.y, e.id)) return o;
        for (const [r, c] of U) {
          const l = o.x + r,
            u = o.y + c,
            h = `${l},${u}`;
          P(e, {
            x: l,
            y: u,
          }) > 8 ||
            n.has(h) ||
            l < 0 ||
            u < 0 ||
            l >= t.width ||
            u >= t.height ||
            t.solid[u * t.width + l] ||
            (n.add(h),
            i.push({
              x: l,
              y: u,
            }));
        }
      }
      return {
        x: e.x,
        y: e.y,
      };
    }
    ground(e, t, a = 0) {
      const i = this.dropPosition(e);
      this.map(e.map).actors.push({
        id: this.nextId++,
        kind: "item",
        name: t ? this.defs.get(t.id).Name : "Gold",
        map: e.map,
        x: i.x,
        y: i.y,
        dir: 0,
        hp: 0,
        maxHP: 0,
        dead: !1,
        stats: {},
        buffs: [],
        actionAt: 0,
        attackAt: 0,
        moveAt: 0,
        target: 0,
        item: t,
        gold: a,
        expires: this.time + 18e4,
      });
    }
    deathDrop(e) {
      const t = e.inventory.flatMap((s, o) => {
        if (!s) return [];
        const r = this.defs.get(s.id);
        return r.Type === "Quest" || r.Bind.toLowerCase().includes("dontdeathdrop") ? [] : [o];
      });
      if (
        !t.length ||
        this.rng.next(100) >= this.rules.adaptations.deathPenalty.inventoryDropPercent
      )
        return;
      const a = t[this.rng.next(t.length)],
        i = e.inventory[a],
        n = {
          ...structuredClone(i),
          uid: i.count === 1 ? i.uid : this.nextId++,
          count: 1,
        };
      (--i.count === 0 && (e.inventory[a] = null), this.ground(e, n));
    }
    questItemDeficit(e, t, a = e.map) {
      const i = lateItemDeficit(this, e, t, a);
      return (
        i ||
        (t >= 9511 && t <= 9515 && e.quests.some((n) => n.id === 220) && this.count(e, 9516) === 0
          ? Math.max(0, 1 - this.count(e, t))
          : Math.max(
              0,
              ...e.quests.map((n) => {
                const s = this.rules.quests.find((o) => o.Index === n.id);
                return s.taskMaps?.length && !s.taskMaps.includes(a)
                  ? 0
                  : Math.max(
                      0,
                      ...s.ItemTasks.filter((o) => o.item === t).map(
                        (o) => o.count - this.count(e, t),
                      ),
                    );
              }),
            ))
      );
    }
    needsQuestItem(e, t, a = e.map) {
      return this.questItemDeficit(e, t, a) > 0;
    }
    move(e, t, a = 1) {
      if (
        t < 0 ||
        t > 7 ||
        (e.kind === "monster" &&
          (!targetableMonster(e) ||
            isChallengeChest(this.monsters.get(e.definition), this.rules) ||
            ($(this, e)?.stationary ?? e.ai === 14))) ||
        this.time < e.actionAt ||
        e.buffs.some((o) =>
          ["Paralysis", "LRParalysis", "Trap", "Frozen", "Shock", "Stun"].includes(o.type),
        )
      )
        return !1;
      const [i, n] = U[t];
      if (
        e.ai === 15 &&
        this.map(e.map).actors.some(
          (o) => o.spell === "FireWall" && o.x === e.x + i && o.y === e.y + n,
        )
      )
        return !1;
      for (let o = 1; o <= a; o++)
        if (!this.walkable(e.map, e.x + i * o, e.y + n * o, e.id)) return !1;
      ((e.dir = t), (e.x += i * a), (e.y += n * a));
      const s = e.buffs.some((o) => o.type === "Slow" && o.until > this.time) ? 2 : 1;
      return (
        (e.actionAt =
          this.time +
          (e.kind === "player"
            ? s *
              Math.max(
                200,
                Math.floor(600 / (1 + ((e.stats.NativeMoveSpeed || 0) + mountSpeed(this, e)) / 10)),
              )
            : monsterActionCost(this, e, !1))),
        e.kind === "player" && ((e.special ??= {}), (e.special.assistMoveUntil = this.time + 750)),
        (e.moveAt = e.kind === "player" ? e.actionAt : e.actionAt + lo(this, e)),
        e.kind === "monster" && (e.attackAt = Math.max(e.attackAt, e.moveAt)),
        e.kind === "player" && this.enterStandingPortal(e),
        !0
      );
    }
    requestInstanceExit(e, t) {
      (this.pendingInstanceExit.set(e, {
        map: e.map,
        x: e.x,
        y: e.y,
        via: t,
      }),
        this.emit("InstanceExitConfirm", {}));
    }
    resolveInstanceExit(e, t) {
      const a = this.pendingInstanceExit.get(e);
      (this.pendingInstanceExit.delete(e),
        !(!t || !a || a.map !== e.map || a.x !== e.x || a.y !== e.y) &&
          (a.via === "portal"
            ? this.enterStandingPortal(e, !0)
            : e.challengeRun?.map === e.map && Fa(this, e)));
    }
    enterStandingPortal(e, t = !1) {
      ((this.npc = 0), this.pendingInstanceExit.delete(e));
      const a = Ui(this, e.map).find((i) => i.at[0] === e.x && i.at[1] === e.y);
      if (a) {
        if (!t && this.region(e.map).instance && a.to !== e.map) {
          this.requestInstanceExit(e, "portal");
          return;
        }
        if (a.requiresQuest && !e.completedQuests.includes(a.requiresQuest)) {
          this.say(message("core.game.enterStandingPortal.e1c67e0e28"));
          return;
        }
        if (a.requiresItem) {
          if (this.count(e, a.requiresItem) < 1) {
            this.say(message("core.game.enterStandingPortal.1f8f9c2a17"));
            return;
          }
          this.consume(e, a.requiresItem, 1);
        }
        e.target = 0;
        const i = this.rules.adaptations.mainline?.corpsePalace;
        (i &&
          e.map === i.sourceMap &&
          a.to === i.targetMap &&
          (this.map(a.to).portals = [
            {
              to: e.map,
              name: message("map.portal.returnMine"),
              at: [21, 16],
              landing: [e.x, e.y],
            },
          ]),
          (e.map = a.to),
          (e.x = a.landing[0]),
          (e.y = a.landing[1]),
          e.challengeRun && e.challengeRun.map !== e.map && Gt(this, e),
          this.emit("MapChanged", {
            MapIndex: e.map,
          }));
      }
    }
    forceAttack(e, t, a = "None") {
      if (
        !Number.isInteger(t) ||
        t < 0 ||
        t >= 8 ||
        e.dead ||
        this.time < Math.max(e.actionAt, e.attackAt)
      )
        return;
      if (mountedItem(this, e)) throw new b(message("core.game.forceAttack.8b65c85a07"));
      const [i, n] = U[t],
        s = {
          x: e.x + i,
          y: e.y + n,
        },
        o = this.map(e.map).actors.find(
          (r) =>
            r.kind === "monster" &&
            !r.dead &&
            !r.friendly &&
            targetableMonster(r) &&
            r.x === s.x &&
            r.y === s.y,
        );
      if (!di(this, e, o, a, s)) {
        if (o) {
          this.attack(e, o, a);
          return;
        }
        ((e.dir = t),
          (e.attackAt = this.time + pt(e.level, e.stats)),
          (e.actionAt = this.time + Math.min(550, e.attackAt - this.time)),
          this.emit("ObjectAttack", {
            ObjectID: e.id,
            Direction: F[t],
            Spell: "None",
          }));
      }
    }
    attack(e, t, a = "None") {
      if (mountedItem(this, e)) throw new b(message("core.game.attack.8b65c85a07"));
      if (
        e.dead ||
        t.dead ||
        e.map !== t.map ||
        t.kind !== "monster" ||
        !targetableMonster(t) ||
        t.friendly ||
        P(e, t) > 1 ||
        this.time < Math.max(e.actionAt, e.attackAt) ||
        ((e.dir = direction(e, t)), di(this, e, t, a))
      )
        return;
      const i = this.skill(e, a);
      a !== "None" && !i && (a = "None");
      const n = pt(e.level, e.stats, !!this.rules.adaptations.dreamRuntime);
      ((e.attackAt = this.time + n),
        (e.actionAt = this.time + Math.min(550, n)),
        (e.regenAt = this.time + 1e4),
        this.emit("ObjectAttack", {
          ObjectID: e.id,
          Direction: F[e.dir],
          Spell: a,
        }));
      let s = L(this, e, "DC"),
        o = "ACAgility";
      if (i) {
        const c = a[0].toLowerCase() + a.slice(1);
        if (
          (["FlamingSword", "TwinDrakeBlade", "Slaying"].includes(a) &&
            !e.attackModes[c] &&
            (a = "None"),
          ["HalfMoon", "CrossHalfMoon"].includes(a))
        ) {
          const l = le(i.d, i.level, e.stats);
          e.mp < l ? (a = "None") : (e.mp -= l);
        }
        (["FlamingSword", "TwinDrakeBlade", "Slaying"].includes(a) &&
          ((s = magicDamage(i.d, i.s.Level, s, this.rng)),
          (e.attackModes[c] = !1),
          a === "FlamingSword" && (o = "AC")),
          a !== "None" && this.levelSkill(e, i.s));
      }
      if ((this.schedule("hit", 300, e, t, s, o, a), a === "TwinDrakeBlade" && i)) {
        const c = this.schedule("hit", 400, e, t, s, "Agility", a);
        c.effect = {
          type: "TwinDrakeStun",
          duration: (i.s.Level + 2) * 1e3,
          value: i.s.Level,
          stats: {},
        };
      }
      const r = this.skill(e, "Slaying");
      if (
        (r &&
          !e.attackModes.slaying &&
          this.rng.next(12) <= r.s.Level &&
          ((e.attackModes.slaying = !0),
          this.emit("SpellToggle", {
            ObjectID: e.id,
            Spell: "Slaying",
            CanUse: !0,
          })),
        ["HalfMoon", "CrossHalfMoon", "Thrusting"].includes(a))
      )
        for (const c of this.map(e.map).actors) {
          if (c === t || c.kind !== "monster" || c.dead || c.friendly) continue;
          const l = direction(e, c),
            u = (l - e.dir + 8) % 8;
          (a === "Thrusting"
            ? l === e.dir && P(e, c) === 2
            : P(e, c) === 1 && (a === "CrossHalfMoon" || u <= 2 || u >= 6)) &&
            this.schedule("hit", 300, e, c, s, "AC", a);
        }
    }
    tick(e = 20) {
      const t = this.me;
      if (!t || !this.geometry.has(t.map)) return;
      for (
        this.time += e,
          this.time >= this.replenishAt &&
            (this.respawn(t.map), (this.replenishAt = this.time + 1e3));
        this.events.length && this.events[0].at <= this.time;

      ) {
        const n = this.events.shift(),
          s = this.actor(n.source),
          o = this.actor(n.target);
        if (!(!s || !o || s.map !== n.map || o.map !== n.map)) {
          if (n.kind === "magic" && !s.dead && !o.dead) si(this, s, o, n);
          else if (n.kind === "kill" && !s.dead && !o.dead) {
            if ((this.die(o, s), n.trainSpell && s.kind === "player")) {
              const r = this.skill(s, n.trainSpell)?.s;
              r && this.levelSkill(s, r);
            }
          } else if (n.kind === "vamp" && !o.dead) {
            const r = o.hp;
            ((o.hp = Math.min(o.maxHP, o.hp + n.damage)),
              o.kind === "player" &&
                o.hp > r &&
                this.emit("DamageIndicator", {
                  ObjectID: o.id,
                  Type: "Heal",
                  Damage: o.hp - r,
                }));
          } else if (n.kind === "deathHit")
            s.dead &&
              nativeDeathSource(this, s, n.spell) &&
              this.damage(s, o, n.damage, n.defence, n.spell, !0);
          else if (n.kind === "hit") {
            if (
              n.location &&
              P(o, n.location) >
                (["IceFlame", "IceStorm", "FireBang"].includes(n.spell || "") ? 1 : 2)
            )
              continue;
            const r = this.damage(s, o, n.damage, n.defence, n.spell, !1, !1, n.monsterBasicAttack);
            if (
              (Fs(this, s, o, r, n.spell),
              vo(this, s, o, r, n),
              r &&
                !o.dead &&
                n.effect?.type === "NativeWhirlwindStun" &&
                this.buff(o, "Stun", n.effect.duration, 0, {}, s.id, n.spell),
              r && s.kind === "player")
            ) {
              if (n.trainSpell) {
                const c = this.skill(s, n.trainSpell)?.s;
                c && this.levelSkill(s, c);
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
                ].includes(n.spell || "")
              )
                for (const c of s.skills.filter(
                  (l) => l.Spell === "Fencing" || l.Spell === "SpiritSword",
                ))
                  this.levelSkill(s, c);
              !o.dead &&
                n.effect?.type === "TwinDrakeStun" &&
                this.monsters.get(o.definition).Level < s.level + 10 &&
                this.rng.next(this.rules.constants.PoisonAttackWeight) >=
                  (o.stats.PoisonResist || 0) &&
                this.rng.next(20) <= n.effect.value + 1 &&
                this.buff(o, "Stun", n.effect.duration);
            }
            r &&
              ["FrostCrunch", "IceFlame"].includes(n.spell || "") &&
              !o.dead &&
              si(this, s, o, {
                ...n,
                trainSpell: void 0,
              });
          } else if (n.kind === "buff" && !o.dead && n.effect) {
            const r = n.effect;
            if (r.type === "MagicShield" && o.buffs.some((l) => l.type === "MagicShield")) continue;
            const c = this.buff(o, r.type, r.duration, r.value, r.stats, s.id, n.spell);
            if (!c) continue;
            if (
              ((r.type !== "Green" || (c.interval || 1e3) !== (r.interval || 1e3)) &&
                (c.next = this.time + (r.interval || 1e3)),
              (c.interval = r.interval),
              n.trainSpell && s.kind === "player")
            ) {
              const l = this.skill(s, n.trainSpell)?.s;
              l && this.levelSkill(s, l);
            }
          } else if (n.kind === "heal" && !o.dead && o.hp < o.maxHP) {
            if (n.trainSpell && s.kind === "player") {
              const c = this.skill(s, n.trainSpell)?.s;
              c && this.levelSkill(s, c);
            }
            const r = gemHealingBonus(
              s,
              n.spell === "Healing" && s.stats.AdventureTaoist
                ? Math.floor(n.damage * 1.2)
                : n.damage,
              n.spell,
            );
            s.kind === "player" && this.skill(s, n.spell || "")?.d.DreamSkill
              ? no(this, o, r)
              : o.kind === "player"
                ? (o.healHP += r)
                : (o.hp = Math.min(o.maxHP, o.hp + r));
          }
        }
      }
      for (const n of [t, ...this.map(t.map).actors]) {
        if (
          (so(this, n),
          hs(this, n),
          (n.kind === "monster" && !n.friendly && P(n, t) > 24 && !n.buffs.length) || n.dead)
        )
          continue;
        for (const o of n.buffs)
          if (
            o.next <= this.time &&
            (o.until > this.time || (o.nativeMonsterPoison && o.next <= o.until)) &&
            ((o.next += o.interval || 1e3),
            ro(this, n, o),
            o.type === "Slow" &&
              n.kind === "monster" &&
              ((n.special ??= {}), (n.special.slowTicks = Number(n.special.slowTicks || 0) + 1)),
            ["Green", "PoisonCloud", "Plague", "NativeBurn"].includes(o.type))
          ) {
            const r = this.actor(o.source);
            r &&
              (!o.nativeMonsterPoison || n.hp > o.value) &&
              this.damage(r, n, o.value, "None", o.spell, o.spell === "NativeDeathPoison", !0);
          }
        const s = n.buffs.length;
        ((n.buffs = n.buffs.filter((o) => o.until > this.time)),
          n.special && !n.buffs.some((o) => o.type === "Slow") && (n.special.slowTicks = 0),
          s !== n.buffs.length && this.refreshActor(n));
      }
      t.dead || this.regen(t);
      const a = t.skills.find((n) => n.Spell === "FlamingSword");
      (a &&
        Number(t.special?.["readyUntil:FlamingSword"] ?? a.CastTime) < this.time &&
        (t.attackModes.flamingSword = !1),
        Number(t.special?.["readyUntil:BlazingSword"] ?? 1 / 0) < this.time &&
          (t.attackModes.blazingSword = !1),
        eo(this, t));
      const i = t.skills.find((n) => n.Spell === "CounterAttack");
      i && i.CastTime <= this.time && (t.attackModes.counterAttack = !1);
      for (const n of [...this.map(t.map).actors])
        if (n.kind === "monster") {
          if ((!n.friendly && P(n, t) > 24 && !n.buffs.length) || this.recallDistantPet(n, t))
            continue;
          const s = this.actor(n.target);
          (!n.friendly && s && !this.monsterCanSee(n, s) && (n.target = 0),
            fo(this, n, t) && !wr(this, n, t) && this.ai(n, t));
        } else n.kind === "spell" && yo(this, n);
      ((this.map(t.map).actors = this.map(t.map).actors.filter(
        (n) => !n.expires || n.expires > this.time,
      )),
        this.autoLootNearby(t),
        Gt(this, t),
        jo(this, t),
        kr(this, t));
    }
    regen(e) {
      if (
        (Xo(e, this.rules, this.time),
        this.time >= e.regenAt &&
          ((e.regenAt = this.time + 1e4),
          e.buffs.some((t) => t.nativeMonsterPoison && t.until >= this.time) ||
            (e.hp = Math.min(
              e.maxHP,
              e.hp +
                Math.floor(
                  (Math.trunc(e.maxHP * 0.03) + 1) * (1 + (e.stats.HPRecoveryPercent || 0) / 100),
                ),
            )),
          (e.mp = Math.min(
            e.maxMP,
            e.mp +
              Math.floor(
                (Math.trunc(e.maxMP * 0.03) + 1) * (1 + (e.stats.MPRecoveryPercent || 0) / 100),
              ),
          ))),
        Do(e, this.time),
        this.time >= e.healAt)
      ) {
        e.healAt = this.time + 600;
        const t = Math.min(e.healHP, 5 + Math.trunc(e.level / 10) + Math.trunc(e.healHP / 10));
        ((e.healHP -= t), (e.hp = Math.min(e.maxHP, e.hp + t)));
      }
      (e.hp === e.maxHP && (e.potHP = 0), e.mp === e.maxMP && (e.potMP = 0));
    }
    petLanding(e) {
      const t = Ui(this, e.map);
      for (let a = 1; a <= 5; a++)
        for (let i = e.y - a; i <= e.y + a; i++)
          for (let n = e.x - a; n <= e.x + a; n++)
            if (
              P(e, {
                x: n,
                y: i,
              }) === a &&
              !t.some((s) => s.at[0] === n && s.at[1] === i) &&
              this.walkable(e.map, n, i)
            )
              return {
                x: n,
                y: i,
              };
      return null;
    }
    monsterCanSee(e, t) {
      const a = this.monsters.get(e.definition);
      return (
        !t.buffs.some((i) => i.type === "Hiding" && i.until > this.time) ||
        !!a?.IsBoss ||
        a?.DreamName === "\u6708\u9B54\u8718\u86DB"
      );
    }
    recallDistantPet(e, t) {
      if (
        !e.friendly ||
        e.dead ||
        e.master !== t.id ||
        t.dead ||
        e.map !== t.map ||
        P(e, t) <= 16 ||
        (e.special?.tameUntil && Number(e.special.tameUntil) <= this.time)
      )
        return !1;
      e.target = 0;
      const a = this.petLanding(t);
      return (a && ((e.x = a.x), (e.y = a.y)), !0);
    }
    focusMonster(e, t) {
      const a = this.actor(t),
        i =
          !e.dead &&
          a?.map === e.map &&
          a.kind === "monster" &&
          !a.dead &&
          !a.friendly &&
          targetableMonster(a)
            ? a.id
            : 0;
      e.target !== i && ((e.target = i), e.special && delete e.special.petCommandTarget);
    }
    ai(e, t) {
      const a = this.monsters.get(e.definition),
        i = e.friendly && e.master === t.id && !t.dead;
      if (
        this.recallDistantPet(e, t) ||
        this.time < e.actionAt ||
        e.buffs.some((o) =>
          ["Paralysis", "LRParalysis", "Trap", "Frozen", "Shock", "Stun"].includes(o.type),
        )
      )
        return;
      const n = 12;
      if (i && P(e, t) > n) {
        ((e.target = 0), this.time >= e.moveAt && this.stepTowards(e, t));
        return;
      }
      let s = this.actor(e.target);
      if (
        (!e.friendly && s && !this.monsterCanSee(e, s) && (s = void 0),
        e.buffs.some((o) => o.type === "Hallucination"))
      )
        s = this.map(e.map).actors.find(
          (o) =>
            o.id !== e.id &&
            o.kind === "monster" &&
            !o.dead &&
            targetableMonster(o) &&
            P(e, o) <= a.ViewRange,
        );
      else if (e.friendly) {
        if (P(e, t) > 12) {
          ((e.target = 0), this.time >= e.moveAt && this.stepTowards(e, t));
          return;
        }
        if (e.special?.resting) {
          ((e.target = 0), P(e, t) > 2 && this.time >= e.moveAt && this.stepTowards(e, t));
          return;
        }
        const o = (u) =>
            !!u &&
            u.kind === "monster" &&
            u.map === e.map &&
            !u.friendly &&
            !u.dead &&
            targetableMonster(u) &&
            (!i || P(u, t) <= n),
          r = i && t.job === "Taoist",
          c =
            r && t.special?.petCommandTarget
              ? this.actor(Number(t.special.petCommandTarget))
              : void 0;
        o(c)
          ? (s = c)
          : (s = this.map(e.map).actors
              .filter((u) => o(u) && (i || P(u, e) <= 8))
              .sort((x, y) => P(x, t) - P(y, t) || x.id - y.id)[0]);
      } else if (!s || s.dead || s.map !== e.map) {
        const o = [t, ...this.map(e.map).actors.filter((r) => r.friendly && r.master === t.id)];
        s =
          a.AI !== 1 && (a.AI !== 2 || e.special?.runAway)
            ? o
                .filter(
                  (r) =>
                    !r.dead &&
                    r.map === e.map &&
                    !this.safe(r) &&
                    P(e, r) <= a.ViewRange &&
                    this.monsterCanSee(e, r),
                )
                .sort((r, c) => P(e, r) - P(e, c))[0]
            : void 0;
      }
      if (
        (s && ((!i && P(e, s) > 15) || (s.kind === "player" && this.safe(s))) && (s = void 0),
        (e.target = s?.id || 0),
        s)
      ) {
        if (mo(this, e, s)) return;
        const o = isSpirit(this, e)
          ? this.rules.adaptations.noviceProgression.spiritRange
          : (Os(this, e) ?? monsterRange(e, s, this));
        P(e, s) <= o && this.time >= e.attackAt
          ? po(this, e, s)
          : P(e, s) > o &&
            this.time >= e.moveAt &&
            (a.DreamRaw || a.MoveSpeed > 0) &&
            this.stepTowards(e, s, i ? t : void 0, n);
      } else
        e.friendly && P(e, t) > 2 && this.time >= e.moveAt
          ? this.stepTowards(e, t)
          : !i &&
            this.time >= e.moveAt &&
            (a.DreamRaw || a.MoveSpeed > 0) &&
            (this.move(e, this.rng.next(8)),
            (e.moveAt = this.time + Math.max(1e3, a.MoveSpeed) * 3));
    }
    stepTowards(e, t, a, i = 6) {
      const n = direction(e, t);
      for (const s of [0, 1, -1, 2, -2]) {
        const o = (n + s + 8) % 8,
          [r, c] = U[o];
        if (
          !(
            a &&
            P(
              {
                x: e.x + r,
                y: e.y + c,
              },
              a,
            ) > i
          ) &&
          this.move(e, o)
        )
          return;
      }
      e.moveAt = this.time + 500;
    }
    questComplete(e, t) {
      const a = e.quests.find((i) => i.id === t.Index);
      return (
        !!a &&
        [...t.CarryItems, ...t.ItemTasks].every((i) => this.count(e, i.item) >= i.count) &&
        (t.KillTotal !== void 0
          ? this.questKillTotal(a.kills, t) >= t.KillTotal
          : t.KillTasks.every((i) => (a.kills[i.monster] || 0) >= i.count))
      );
    }
    questKillTotal(e, t) {
      return t.KillTasks.reduce((a, i) => a + (e[i.monster] || 0), 0);
    }
    woomaWeapon(e, t) {
      return this.newItem(t, 1, !0, void 0, e);
    }
    questRewards(e, t) {
      const a = e.ClassRewards?.[t.job];
      return [...e.FixedRewards, ...(e.ClassFixedRewards?.[t.job] || []), ...(a ? [a] : [])];
    }
    questInfo(e, t) {
      return {
        Index: e.Index,
        Name: e.Name,
        NPCIndex: e.acceptNpc,
        FinishNPCIndex: e.finishNpc,
        Description: e.Description,
        TaskDescription: e.TaskDescription,
        RewardGold: e.GoldReward,
        RewardExp: e.ExpReward,
        RewardsFixedItem: this.questRewards(e, t).map((a) => ({
          Item: this.defs.get(a.item),
          Count: a.count,
        })),
        RewardsSelectItem: e.SelectRewards.map((a) => ({
          Item: this.defs.get(a.item),
          Count: a.count,
        })),
        TasksItems: e.ItemTasks.map((a) => ({
          Item: this.defs.get(a.item),
          Count: a.count,
        })),
        TasksMonsters: e.KillTasks.map((a) => ({
          MonsterName: this.monsters.get(a.monster)?.Name,
          Count: a.count,
        })),
      };
    }
    requireNPC(e) {
      const t = this.rules.world.npcs.find((a) => a.id === this.npc);
      if (
        !t ||
        t.map !== e.map ||
        P(e, {
          x: t.at[0],
          y: t.at[1],
        }) > 3
      )
        throw new b(message("core.game.requireNPC.999365c2eb"));
      return t;
    }
    npcPage(e, t, a) {
      if (
        ((this.npc = t.id),
        (a = a.replace(/[\[\]]/g, "").toLowerCase()),
        t.role === "event" &&
          a === "@main" &&
          this.rules.adaptations.activityCodeRewardsEnabled !== !0)
      ) {
        this.emit("NPCResponse", {
          NPCID: t.id,
          Page: [
            message("npc.noActivityRewards"),
            ...(t.trade?.length
              ? [
                  {
                    $dialogue: [
                      {
                        label: message("npc.buyMounts"),
                        action: "@BuyNew",
                      },
                    ],
                  },
                ]
              : []),
            {
              $dialogue: [
                {
                  label: message("npc.closeActivity"),
                  action: "@Exit",
                },
              ],
            },
          ],
        });
        return;
      }
      if (a === "@challengeevil" || a === "@challengesettle") {
        Ga(this, e, a === "@challengeevil" ? "evil" : "settle");
        return;
      }
      if (a === "@challengeclaim") {
        claimChallengeRewards(this, e);
        return;
      }
      if (a === "@late-evil-dragon" || a === "@late-po-settle") {
        Ga(this, e, a === "@late-evil-dragon" ? "evil" : "settle");
        return;
      }
      if (a.startsWith("@late-")) {
        as(this, e, a);
        return;
      }
      if (t.role === "trial" && a === "@main") {
        this.emit("NPCResponse", {
          NPCID: t.id,
          Page: Fo(this, e),
        });
        return;
      }
      if (a.startsWith("@trial")) {
        Lo(this, e, a);
        return;
      }
      if (a === "@claimblessing") {
        const n = this.rules.adaptations.blessingTalisman;
        if (!n || this.requireNPC(e).id !== n.npcId)
          throw new b(message("core.game.npcPage.955009b251"));
        if (
          e.claimedBlessing ||
          [...e.inventory, ...e.equipment, ...e.storage].some((s) => s?.id === n.itemId)
        )
          throw new b(message("core.game.npcPage.f0bea80ae3"));
        if (!this.give(e, this.newItem(n.itemId), !1))
          throw new b(message("core.game.npcPage.77b801a849"));
        ((e.claimedBlessing = !0),
          this.say(message("core.game.npcPage.8ba47b0fd7")),
          this.emit("NPCResponse", {
            NPCID: t.id,
            Page: [],
          }));
        return;
      }
      if (!t.sections[a]) throw new b(message("core.game.npcPage.0d52b8413e"));
      if (Xn(this, e, t, a)) return;
      if (a.startsWith("@settle")) {
        const n = this.rules.adaptations.towns?.settlements.find(
          (s) => a === "@settle" + s.id && s.npcIds.includes(this.requireNPC(e).id),
        );
        if (!n) throw new b(message("core.game.npcPage.5ddb240bc1"));
        ((e.homeTown = n.id),
          this.say(
            message("core.game.npcPage.eefbfec173", {
              p0: entityText("towns", n.id),
            }),
          ),
          this.npcPage(e, t, "@main"));
        return;
      }
      if (a === "@cityintro" && !e.completedQuests.includes(238))
        throw new b(message("core.game.npcPage.4dfbf8e123"));
      if (a === "@identify") {
        this.say(message("core.game.npcPage.66a920f6f4"));
        return;
      }
      if (a === "@craftlearn" || a === "@craftgraduate") {
        $o(this, e, a === "@craftgraduate");
        return;
      }
      if (a === "@craftopen") {
        this.emit("OpenForge", {
          Mode: "craft",
        });
        return;
      }
      if (a.startsWith("@challenge-")) {
        Ea(this, e, a.slice(11));
        return;
      }
      if (a === "@challengestart") {
        _n(this, e);
        return;
      }
      if (a === "@challengeleave") {
        e.challengeRun?.map === e.map &&
          this.requireNPC(e).role === "challenge" &&
          this.requestInstanceExit(e, "npc");
        return;
      }
      if (a === "@woomaexchange") {
        if (this.requireNPC(e).id !== 9405) throw new b(message("core.game.npcPage.d611f46a80"));
        const n = this.rules.quests.find((o) => o.Index === 214)?.ClassRewards?.[e.job];
        if (!n || this.count(e, 9507) < 10) throw new b(message("core.game.npcPage.e05a846aab"));
        const s = structuredClone({
          inventory: e.inventory,
          questInventory: e.questInventory,
        });
        if ((this.consume(e, 9507, 10), !this.give(e, this.woomaWeapon(e, n.item), !1)))
          throw (Object.assign(e, s), new b(message("core.game.npcPage.f4f8709c7f")));
        this.say(message("core.game.npcPage.557be3469a"));
        return;
      }
      if (a === "@claimtesttalisman") {
        if (this.rules.adaptations.activityCodeRewardsEnabled !== !0)
          throw new b(message("npc.noActivityRewards"));
        const n = this.rules.adaptations.testTalisman;
        if (!n || this.requireNPC(e).id !== n.npcId)
          throw new b(message("core.game.npcPage.bbeb99649b"));
        (this.emit("NPCResponse", {
          NPCID: t.id,
          Page: [message("npc.codePrompt")],
        }),
          this.emit("NPCEvent", {
            NPCID: t.id,
            TestTalisman: !0,
          }));
        return;
      }
      if (a.startsWith("@travel")) {
        const n = t.travelRequirements?.[a];
        if (n && !e.completedQuests.includes(n))
          throw new b(
            message("core.game.npcPage.b4796772c5", {
              p0: entityText("quests", n),
            }),
          );
        const s = t.sections[a].find((l) => /^MOVE /i.test(l))?.split(/\s+/),
          o = s && this.rules.world.maps.find((l) => l.file === s[1]);
        if (!s || !o) throw new b(message("core.game.npcPage.3aa73f91dc"));
        const r = Number(s[2]),
          c = Number(s[3]);
        if (!Number.isInteger(r) || !Number.isInteger(c))
          throw new b(message("core.game.npcPage.bd90287e1e"));
        ((e.target = 0),
          (e.map = o.id),
          (e.x = Number(s[2])),
          (e.y = Number(s[3])),
          (this.npc = 0),
          this.emit("NPCResponse", {
            NPCID: t.id,
            Page: [],
          }));
        return;
      }
      const i = t.sections[a]
        .map((n, s) => ({
          line: n,
          index: s,
        }))
        .filter(({ line: n }) => !n.startsWith("#") && !n.toLowerCase().includes("@claimblessing"))
        .map(({ index: n }) => ls(t.id, a, n, e.name));
      if (
        (a === "@main" &&
          this.rules.adaptations.towns?.settlements.some((n) => n.npcIds.includes(t.id)) &&
          i.splice(
            1,
            0,
            message("npc.residence", {
              town: entityText("towns", Ye(e, this.rules).id),
            }),
          ),
        a === "@main" &&
          [3, 9001].includes(t.id) &&
          e.completedQuests.includes(238) &&
          i.splice(-1, 0, {
            $dialogue: [
              {
                label: message("npc.cityIntro"),
                action: "@CityIntro",
              },
            ],
          }),
        a === "@main" &&
          i.splice(
            Math.max(0, i.length - 1),
            0,
            ...Jn(this, e, t),
            ...za(this, e, t),
            ...(t.id === 9420 || t.role === "challenge" ? Zn(e, t.id) : []),
          ),
        t.id === 9420 && a === "@main")
      ) {
        const n = (this.rules.adaptations.guideChallenges || []).filter(
          (s) => this.count(e, s.ticket) > 0,
        );
        this.emit("NPCResponse", {
          NPCID: t.id,
          Page: [
            ...i,
            ...n.map((s) => ({
              $dialogue: [
                {
                  label: message("npc.challenge", {
                    map: entityText("maps", s.map),
                    minutes: s.minutes,
                  }),
                  action: "@challenge-" + s.id,
                },
              ],
            })),
            ...(n.length ? [] : [message("npc.noChallengeTicket")]),
          ],
        });
        return;
      }
      if (!i) throw new b(message("core.game.npcPage.0d52b8413e"));
      if (
        (this.emit("NPCResponse", {
          NPCID: t.id,
          Page: i,
        }),
        this.rules.adaptations.activityCodeRewardsEnabled === !0 &&
          !this.rules.adaptations.dreamRuntime &&
          t.id === this.rules.adaptations.starterTalisman.npcId &&
          this.emit("NPCEvent", {
            NPCID: t.id,
            Claimed: !!e.claimedStarterTalisman,
          }),
        ["@buynew", "@buysellnew", "@buyback", "@advanced"].includes(a))
      ) {
        const n = this.buyback(e, t.id),
          s =
            a === "@advanced"
              ? t.advancedTrade || []
              : t.trade.filter((r) => !t.advancedTrade?.includes(r)),
          o = s.map((r) => ({
            UniqueID: r,
            ItemIndex: r,
            Count: 1,
          }));
        (this.emit("NPCGoods", {
          NPCID: t.id,
          Type: a === "@buyback" ? "BuyBack" : "Buy",
          List:
            a === "@buyback"
              ? n.map((r) => ({
                  UniqueID: r.uid,
                  ItemIndex: r.id,
                  Count: r.count,
                  Item: structuredClone(r),
                }))
              : o,
          UnitPrices: Object.fromEntries(
            a === "@buyback"
              ? n.map((r) => [r.uid, Math.trunc(price(r, this.defs.get(r.id)) / r.count)])
              : s.map((r) => [r, this.defs.get(r).Price]),
          ),
        }),
          ["@buysellnew", "@buynew", "@advanced"].includes(a) &&
            this.rules.adaptations.universalSaleRoles.includes(t.role) &&
            this.emit("NPCSell", {
              NPCID: t.id,
            }));
      }
      (a === "@sell" &&
        this.emit("NPCSell", {
          NPCID: t.id,
        }),
        a === "@repair" &&
          this.emit("NPCRepair", {
            NPCID: t.id,
          }),
        a === "@storage" &&
          this.emit("NPCStorage", {
            NPCID: t.id,
          }));
    }
    canMapTeleport(e) {
      return (
        !e.dead &&
        !this.region(e.map).noTeleport &&
        (!!De(e, this.rules) ||
          [e.equipment[7], e.equipment[8], ...e.inventory].some((a) => {
            const i = a && this.defs.get(a.id);
            return !!a && isTeleportRing(i) && (!a.maxDura || a.currentDura > 0);
          }))
      );
    }
    command(e, t = {}) {
      const a = this.me;
      if (!a) throw new b(message("core.game.command.1bf8172441"));
      if (a.dead && !["TownRevive", "LogOut"].includes(e))
        throw new b(message("core.game.command.db61d62a9c"));
      switch (e) {
        case "ConfirmInstanceExit":
          this.resolveInstanceExit(a, t.Confirmed === !0);
          break;
        case "SetEquipmentLock":
          Qn(this, a, t);
          break;
        case "SellEquipmentBatch":
          Kn(this, a, t);
          break;
        case "SetAssist":
          a.assist = ri(t);
          break;
        case "PetControl": {
          const i = Object.values(this.maps)
              .flatMap((s) => s.actors)
              .filter((s) => s.friendly && !s.dead && s.master === a.id),
            n = String(t.Mode);
          if (n === "dismiss") {
            a.special && delete a.special.petCommandTarget;
            for (const s of i) ((s.dead = !0), (s.hp = 0), (s.expires = this.time));
            this.say(message("core.game.command.422dfabde1"));
            break;
          }
          if (n === "rest") {
            a.special && delete a.special.petCommandTarget;
            const s = !i.every((o) => o.special?.resting);
            for (const o of i) ((o.special ??= {}), (o.special.resting = s), (o.target = 0));
            this.say(message(s ? "core.game.command.83a5bd6ade" : "core.game.command.34f79b63ab"));
            break;
          }
          if (n === "recall") {
            a.special && delete a.special.petCommandTarget;
            for (const s of i) {
              const o = this.petLanding(a);
              if (o) {
                for (const r of Object.values(this.maps))
                  r.actors = r.actors.filter((c) => c.id !== s.id);
                ((s.map = a.map),
                  (s.x = o.x),
                  (s.y = o.y),
                  (s.target = 0),
                  this.map(a.map).actors.push(s));
              }
            }
            break;
          }
          if (n === "target") {
            const s = this.actor(Number(t.Target));
            if (!s || s.map !== a.map || s.dead || s.kind !== "monster" || s.friendly)
              throw new b(message("core.game.command.2f0008d3a0"));
            (a.special ??= {}).petCommandTarget = s.id;
            for (const o of i) ((o.special ??= {}), (o.special.resting = !1), (o.target = s.id));
            break;
          }
          throw new b(message("core.game.command.6cf95a2137"));
        }
        case "ForgeQuote": {
          try {
            this.emit("ForgeQuote", Hi(this, a, t));
          } catch (i) {
            if (t.Mode !== "cube") throw i;
            this.emit("ForgeQuote", {
              cubeSelection: t.Selected,
              canForge: !1,
              error: mt(i),
            });
          }
          break;
        }
        case "Forge":
          Qo(this, a, t);
          break;
        case "BindItemHotkey": {
          const i = Number(t.Key);
          if (!Number.isInteger(i) || i < 0 || i >= 6)
            throw new b(message("core.game.command.9a1bdb63f7"));
          if ((migrateItemHotkeys(a, this.defs), t.UniqueID === null)) {
            ((a.itemHotkeys[i] = null), a.ringHotkeys && (a.ringHotkeys[i] = null));
            break;
          }
          const n = a.inventory.find((s) => s?.uid === Number(t.UniqueID));
          if (n && isTeleportRing(this.defs.get(n.id))) {
            const s = t.To,
              o = s === 7 || s === 8 ? a.equipment[s] : null;
            if (!o || o.uid !== t.OriginalUID || this.defs.get(o.id)?.Type !== "Ring")
              throw new b(message("core.game.command.4886f3b4f0"));
            const r = (a.ringHotkeys ??= Array(6).fill(null));
            ((r[i] = {
              slot: s,
              teleport: {
                id: n.id,
                uid: n.uid,
              },
              original: {
                id: o.id,
                uid: o.uid,
              },
            }),
              (a.itemHotkeys[i] = null));
            break;
          }
          if (!n || !Na.includes(this.defs.get(n.id).Type))
            throw new b(message("core.game.command.de1f6c0544"));
          (a.ringHotkeys && (a.ringHotkeys[i] = null), (a.itemHotkeys[i] = n.id));
          break;
        }
        case "UseItemHotkey": {
          const i = Number(t.Key);
          if (!Number.isInteger(i) || i < 0 || i >= 6)
            throw new b(message("core.game.command.9a1bdb63f7"));
          migrateItemHotkeys(a, this.defs);
          const n = a.ringHotkeys?.[i];
          if (n) {
            const r = Ra(a, n);
            if (!r) throw new b(message("core.game.command.4795782b6e"));
            this.command("EquipItem", {
              UniqueID: r.uid,
              To: n.slot,
            });
            break;
          }
          const s = a.itemHotkeys[i];
          if (s === null) break;
          const o = a.inventory.find((r) => r?.id === s);
          if (!o) throw new b(message("core.game.command.4795782b6e"));
          this.command("UseItem", {
            UniqueID: o.uid,
          });
          break;
        }
        case "MapTeleport": {
          if (!this.canMapTeleport(a)) throw new b(message("core.game.command.a15e16ccd5"));
          if (Number(t.MapIndex) !== a.map) throw new b(message("core.game.command.ac33b45ea0"));
          const i = Number(t.X),
            n = Number(t.Y);
          if (!Number.isInteger(i) || !Number.isInteger(n) || !this.walkable(a.map, i, n, a.id))
            throw new b(message("core.game.command.feacada29b"));
          ((a.x = i),
            (a.y = n),
            (a.target = 0),
            (a.actionAt = this.time + 600),
            (this.npc = 0),
            this.emit("MapTeleport", {
              ObjectID: a.id,
            }),
            this.say(
              message("core.game.command.78cdb952a0", {
                p0: message(De(a, this.rules) ? "game.teleport.talisman" : "game.teleport.ring"),
                p1: i,
                p2: n,
              }),
            ),
            this.enterStandingPortal(a));
          break;
        }
        case "Walk":
        case "Run":
          this.move(a, F.indexOf(t.Direction), e === "Run" ? 2 : 1);
          break;
        case "Turn": {
          const i = F.indexOf(t.Direction);
          i >= 0 && (a.dir = i);
          break;
        }
        case "Attack": {
          if (t.Force) {
            this.forceAttack(a, F.indexOf(String(t.Direction)), String(t.Spell || "None"));
            break;
          }
          const i = this.actor(Number(t.TargetID));
          i && this.attack(a, i, String(t.Spell || "None"));
          break;
        }
        case "Magic":
          if (mountedItem(this, a)) throw new b(message("core.game.command.1a01d4ad93"));
          Js(this, a, t);
          break;
        case "ToggleMount":
          Jt(this, a);
          break;
        case "SpellToggle":
          Yt(this, a, String(t.Spell), !!t.CanUse);
          break;
        case "MagicKey": {
          const i = a.skills.find((s) => s.Spell === t.Spell),
            n = Number(t.Key);
          if (!i || !Number.isInteger(n) || n < 0 || n > 8)
            throw new b(message("core.game.command.dd4c2d429a"));
          for (const s of a.skills) s.Key === n && (s.Key = 0);
          i.Key = n;
          break;
        }
        case "PickUp": {
          const i = this.map(a.map).actors.find(
            (n) => n.kind === "item" && n.x === a.x && n.y === a.y &&
              (t.ObjectID === void 0 || (n.map === a.map && Number.isSafeInteger(t.ObjectID) && n.id === t.ObjectID)),
          );
          if (!i) break;
          if (i.item?.id === this.rules.adaptations.adventure.chestId) {
            Pr(this, a, i);
            break;
          }
          if (!this.transferGroundLoot(a, i))
            throw new b(message("core.game.command.f4f8709c7f"));
          this.map(a.map).actors = this.map(a.map).actors.filter((n) => n !== i);
          break;
        }
        case "CombineItem":
          rr(this, a, Number(t.IDFrom), Number(t.IDTo));
          break;
        case "ExchangeScarletSword":
          is(this, a, Array.isArray(t.Selected) ? t.Selected.map(Number) : []);
          break;
        case "UseItem":
          this.useItem(a, Number(t.UniqueID));
          break;
        case "EquipItem": {
          const i = a.inventory.findIndex((c) => c?.uid === Number(t.UniqueID)),
            n = a.inventory[i],
            s = Number(t.To);
          if (!n) throw new b(message("core.game.command.9edbd2d8c5"));
          const o = this.defs.get(n.id);
          if (o.Type === "Mount") {
            Jt(this, a, n.uid);
            break;
          }
          if (!itemSlots(o)?.includes(s)) throw new b(message("core.game.command.4886f3b4f0"));
          this.checkUse(a, o);
          const r = a.equipment[s];
          ((a.inventory[i] = r), (a.equipment[s] = n), this.refresh(a));
          break;
        }
        case "RemoveItem": {
          const i = a.equipment.findIndex((o) => o?.uid === Number(t.UniqueID)),
            n = a.equipment[i],
            s = Number(t.To);
          if (
            !n ||
            !Number.isInteger(s) ||
            s < 0 ||
            s >= a.inventory.length ||
            !bagSlotAccepts(a, this.rules, this.defs.get(n.id), s) ||
            a.inventory[s]
          )
            throw new b(message("core.game.command.3d8e6ffe43"));
          ((a.inventory[s] = n), (a.equipment[i] = null), this.refresh(a));
          break;
        }
        case "CallNPC": {
          const i = this.rules.world.npcs.find((n) => n.id === Number(t.ObjectID));
          if (
            !i ||
            i.map !== a.map ||
            P(a, {
              x: i.at[0],
              y: i.at[1],
            }) > 3
          )
            throw new b(message("core.game.command.85a81c3341"));
          this.npcPage(a, i, String(t.Key || "[@main]"));
          break;
        }
        case "RedeemEvent": {
          if (this.rules.adaptations.activityCodeRewardsEnabled !== !0)
            throw new b(message("npc.noActivityRewards"));
          if (this.rules.adaptations.dreamRuntime)
            throw new b(message("core.game.command.f978c64d55"));
          const i = this.requireNPC(a),
            n = this.rules.adaptations.starterTalisman;
          if (i.id !== n.npcId || i.role !== "event")
            throw new b(message("core.game.command.0548ba11e3"));
          if (a.claimedStarterTalisman) throw new b(message("core.game.command.b2e4370f3d"));
          if (String(t.Code || "").trim() !== n.code)
            throw new b(message("core.game.command.e3d32f0605"));
          if (!this.give(a, this.newItem(n.itemId)))
            throw new b(message("core.game.command.eac92aa78b"));
          ((a.claimedStarterTalisman = !0),
            this.say(message("core.game.command.14dece4e2a")),
            this.npcPage(a, i, "@main"));
          break;
        }
        case "RedeemActivityCode":
        case "RedeemTestTalisman": {
          if (this.rules.adaptations.activityCodeRewardsEnabled !== !0)
            throw new b(message("npc.noActivityRewards"));
          if (isHell(this.rules))
            throw new Error("\u5730\u72F1\u7248\u4E0D\u5F00\u653E\u6D4B\u8BD5\u5151\u6362\u3002");
          const i = this.requireNPC(a),
            n = this.rules.adaptations.goldBarCode,
            s = this.rules.adaptations.combatTestTalisman,
            o = String(t.Code || "").trim(),
            r = s && o === s.code ? s : this.rules.adaptations.testTalisman;
          if (n && String(t.Code || "").trim() === n.code) {
            if (i.id !== n.npcId) throw new b(message("core.game.command.75dab95c94"));
            const l = this.rules.adaptations.chestItems?.gold.item;
            if (!l) throw new b(message("core.game.command.259c9772aa"));
            if (!this.give(a, this.newItem(l, n.count)))
              throw new b(message("core.game.command.fe62d85cf1"));
            (this.say(
              message("core.game.command.31f9bd1249", {
                p0: n.count,
              }),
            ),
              this.npcPage(a, i, "@main"));
            break;
          }
          const c = !!s && r === s;
          if (!r || i.id !== r.npcId)
            throw new b(message(c ? "game.combatTest.envoy" : "core.game.command.bbeb99649b"));
          if (o !== r.code) throw new b(message("core.game.command.97ded833ee"));
          if ([...a.inventory, ...a.equipment, ...a.storage].some((l) => l?.id === r.itemId))
            throw new b(message(c ? "game.combatTest.owned" : "core.game.command.07245475b2"));
          if (!this.give(a, this.newItem(r.itemId)))
            throw new b(message("core.game.command.77b801a849"));
          (this.say(message(c ? "game.combatTest.claimed" : "core.game.command.6a3d24d360")),
            this.npcPage(a, i, "@main"));
          break;
        }
        case "BuyItem": {
          const i = this.requireNPC(a),
            n = Number(t.ItemIndex),
            s = Number(t.Count);
          if (t.Type === "BuyBack") {
            const c = this.buyback(a, i.id),
              l = c.find((p) => p.uid === n);
            if (!l || !Number.isInteger(s) || s < 1 || s > l.count)
              throw new b(message("core.game.command.37209580c2"));
            const u = Math.trunc(price(l, this.defs.get(l.id)) / l.count) * s;
            if (a.gold < u) throw new b(message("core.game.command.e55f88c1eb"));
            const h = {
              ...structuredClone(l),
              uid: s === l.count ? l.uid : this.nextId++,
              count: s,
            };
            if ((delete h.buybackAt, !this.give(a, h)))
              throw new b(message("core.game.command.f4f8709c7f"));
            ((a.gold -= u), (l.count -= s), (a.buyback[i.id] = c.filter((p) => p.count > 0)));
            break;
          }
          if (!i.trade.includes(n) || !Number.isInteger(s) || s < 1 || s > 999)
            throw new b(message("core.game.command.fe364ad24f"));
          const o = this.defs.get(n),
            r = o.Price * s;
          if (
            o.Type === "Book" &&
            o.Price === 0 &&
            (this.checkUse(a, o),
            s !== 1 || this.count(a, n) || a.skills.some((c) => c.Spell === o.Spell))
          )
            throw new b(message("core.game.command.042a12dcf9"));
          if (a.gold < r) throw new b(message("core.game.command.e55f88c1eb"));
          if (!this.give(a, this.newItem(n, s)))
            throw new b(message("core.game.command.f4f8709c7f"));
          a.gold -= r;
          break;
        }
        case "SellItem": {
          const i = this.requireNPC(a),
            n = a.inventory.findIndex((c) => c?.uid === Number(t.UniqueID)),
            s = a.inventory[n],
            o = Number(t.Count);
          if (!s || !Number.isInteger(o) || o < 1 || o > s.count)
            throw new b(message("core.game.command.f9947c06ce"));
          assertEquipmentDisposable(s);
          const r = this.defs.get(s.id);
          if (!this.rules.adaptations.universalSaleRoles.includes(i.role))
            throw new b(message("core.game.command.5fc026e9a7"));
          if (r.Bind.includes("DontSell") || r.Type === "Quest")
            throw new b(message("core.game.command.8d142b89d7"));
          ((a.gold += Math.trunc(
            price(
              {
                ...s,
                count: o,
              },
              r,
            ) / 2,
          )),
            (a.buyback ??= {}),
            (a.buyback[i.id] ??= []),
            this.buyback(a, i.id),
            a.buyback[i.id].push({
              buybackAt: this.time,
              ...structuredClone(s),
              uid: o === s.count ? s.uid : this.nextId++,
              count: o,
            }),
            this.rules.goods.BuyBackMaxStored > 0 &&
              a.buyback[i.id].length > this.rules.goods.BuyBackMaxStored &&
              a.buyback[i.id].shift(),
            (s.count -= o),
            s.count || (a.inventory[n] = null),
            this.emit("SellItem", {
              Success: !0,
            }));
          break;
        }
        case "RepairItem":
        case "SRepairItem": {
          if (!this.requireNPC(a).sections["@repair"])
            throw new b(message("core.game.command.32b067b943"));
          const n = a.inventory.find((r) => r?.uid === Number(t.UniqueID));
          if (!n) throw new b(message("core.game.command.9edbd2d8c5"));
          const s = this.defs.get(n.id);
          if (!s.Durability) throw new b(message("core.game.command.1089a89c8b"));
          const o = Math.max(
            0,
            price(
              {
                ...n,
                currentDura: n.maxDura,
              },
              s,
            ) - price(n, s),
          );
          if (
            s.Bind.includes("DontRepair") ||
            (e === "SRepairItem" && s.Bind.includes("NoSRepair"))
          )
            throw new b(message("core.game.command.c48d16a17a"));
          if (a.gold < o) throw new b(message("core.game.command.e55f88c1eb"));
          ((a.gold -= o), (n.currentDura = n.maxDura));
          break;
        }
        case "StoreItem":
        case "TakeBackItem": {
          if (this.requireNPC(a).role !== "storage")
            throw new b(message("core.game.command.fc8754400b"));
          const n = t.Shared === !0;
          if ((t.Shared !== void 0 && typeof t.Shared != "boolean") || (n && !ce(this.rules)))
            throw new b(message("storage.sharedUnavailable"));
          const s = n ? this.sharedStorage : a.storage,
            o = Number(t.From),
            r = Number(t.To),
            c = e === "StoreItem" ? a.inventory : s,
            l = e === "StoreItem" ? s : a.inventory;
          if (
            !Number.isInteger(o) ||
            !Number.isInteger(r) ||
            o < 0 ||
            o >= c.length ||
            r < 0 ||
            r >= l.length ||
            !c[o] ||
            l[r]
          )
            throw new b(message("core.game.command.53e7891bb9"));
          const u = c[o];
          if (n && e === "StoreItem" && !mn(u, this.defs.get(u.id), this.rules))
            throw new b(message("storage.sharedOnly"));
          if (t.UniqueID !== void 0 && Number(t.UniqueID) !== u.uid)
            throw new b(message("core.game.command.cda3a5c696"));
          if (e === "TakeBackItem" && !bagSlotAccepts(a, this.rules, this.defs.get(u.id), r))
            throw new b(message("storage.bagCategoryFull"));
          ((l[r] = u), (c[o] = null));
          break;
        }
        case "SortStorage": {
          if (t.Shared !== void 0 && typeof t.Shared != "boolean")
            throw new b(message("storage.sharedUnavailable"));
          if (this.requireNPC(a).role !== "storage")
            throw new b(message("core.game.command.fc8754400b"));
          if (t.Shared === !0) {
            if (!ce(this.rules)) throw new b(message("storage.sharedUnavailable"));
            this.sharedStorage = nt(this.sharedStorage, this.defs, () => this.nextId++);
          } else a.storage = nt(a.storage, this.defs, () => this.nextId++);
          break;
        }
        case "UnlockStoragePage": {
          if (this.requireNPC(a).role !== "storage") throw new b(message("storage.unlockNPC"));
          Wn(a, Number(t.Page));
          break;
        }
        case "SortInventory": {
          Ha(a, this.rules, this.defs);
          const i = equipmentCapacity(a, this.rules);
          a.inventory =
            a.bagLayoutVersion === 1
              ? [
                  ...nt(a.inventory.slice(0, i), this.defs, () => this.nextId++),
                  ...nt(a.inventory.slice(i), this.defs, () => this.nextId++),
                ]
              : nt(a.inventory, this.defs, () => this.nextId++);
          break;
        }
        case "MoveItem": {
          if (t.Grid && t.Grid !== "Inventory")
            throw new b(message("core.game.command.641c485898"));
          const i = Number(t.From),
            n = Number(t.To),
            s = a.inventory;
          if (
            !Number.isInteger(i) ||
            !Number.isInteger(n) ||
            i < 0 ||
            n < 0 ||
            i >= s.length ||
            n >= s.length ||
            !s[i] ||
            (t.UniqueID !== void 0 && s[i]?.uid !== Number(t.UniqueID))
          )
            throw new b(message("core.game.command.3edeb6d40f"));
          if (
            !bagSlotAccepts(a, this.rules, this.defs.get(s[i].id), n) ||
            (s[n] && !bagSlotAccepts(a, this.rules, this.defs.get(s[n].id), i))
          )
            throw new b(message("bag.wrongCategory"));
          if (i === n) break;
          const o = s[i],
            r = s[n],
            c = this.defs.get(o.id).StackSize;
          if (
            r &&
            o.id === r.id &&
            c > 1 &&
            r.count < c &&
            JSON.stringify(o.added) === JSON.stringify(r.added) &&
            o.materialQuality === r.materialQuality &&
            !!o.bound == !!r.bound &&
            !!o.noSharedStorage == !!r.noSharedStorage
          ) {
            const l = Math.min(o.count, c - r.count);
            ((r.count += l), (o.count -= l), o.count || (s[i] = null));
          } else [s[i], s[n]] = [s[n], s[i]];
          break;
        }
        case "SplitItem": {
          const i = a.inventory.find((o) => o?.uid === Number(t.UniqueID)),
            n = Number(t.Count),
            s = a.inventory.findIndex(
              (o, r) => !o && !!i && bagSlotAccepts(a, this.rules, this.defs.get(i.id), r),
            );
          if (!i || !Number.isInteger(n) || n < 1 || n >= i.count || s < 0)
            throw new b(message("core.game.command.45f585c303"));
          ((a.inventory[s] = {
            ...structuredClone(i),
            uid: this.nextId++,
            count: n,
          }),
            (i.count -= n));
          break;
        }
        case "DropItem": {
          const i = a.inventory.findIndex((r) => r?.uid === Number(t.UniqueID)),
            n = a.inventory[i],
            s = Number(t.Count);
          if (!n || !Number.isInteger(s) || s < 1 || s > n.count)
            throw new b(message("core.game.command.7ed68b7e72"));
          assertEquipmentDisposable(n);
          const o = this.defs.get(n.id);
          if (o.Bind.includes("DontDrop") || o.Type === "Quest")
            throw new b(message("core.game.command.ddf6aa6d1d"));
          (this.ground(a, {
            ...structuredClone(n),
            uid: s === n.count ? n.uid : this.nextId++,
            count: s,
          }),
            (n.count -= s),
            n.count || (a.inventory[i] = null));
          break;
        }
        case "AcceptQuest":
          this.acceptQuest(a, Number(t.QuestIndex));
          break;
        case "FinishQuest":
          this.finishQuest(a, Number(t.QuestIndex), Number(t.SelectedItemIndex));
          break;
        case "AbandonQuest": {
          const i = this.rules.quests.find((n) => n.Index === Number(t.QuestIndex));
          if (i) {
            a.quests = a.quests.filter((n) => n.id !== i.Index);
            for (const n of i.CarryItems)
              this.consume(a, n.item, Math.min(this.count(a, n.item), n.count));
          }
          break;
        }
        case "TownRevive": {
          if (!a.dead) throw new b(message("core.game.command.cc93d6760d"));
          const i = Ye(a, this.rules),
            n = this.freeNear(
              i.map,
              {
                x: i.at[0],
                y: i.at[1],
              },
              i.radius,
            );
          if (!n) throw new b(message("core.game.command.c18b9454e2"));
          ((a.dead = !1),
            (a.hp = a.maxHP),
            (a.mp = a.maxMP),
            (a.map = i.map),
            (a.x = n.x),
            (a.y = n.y),
            (a.target = 0),
            (this.npc = 0),
            (a.buffs = []),
            (a.potHP = a.potMP = a.healHP = 0),
            (a.actionAt = this.time + 600));
          break;
        }
        case "LogOut":
          (clearManualCast(a), this.dismissPets(a), (this.active = 0), (this.npc = 0));
          break;
        case "Opendoor":
          break;
        default:
          throw new b(
            message("core.game.command.e52fcae8a7", {
              p0: e,
            }),
          );
      }
      for (const i of $t(a, this.rules)) {
        const n = this.rules.adaptations.towns.waypoints.find((s) => s.id === i);
        this.say(
          message("npc.waypointUnlocked", {
            map: entityText("maps", n.map),
          }),
        );
      }
    }
    checkUse(e, t) {
      if (this.rules.adaptations.dreamRuntime && !isHell(this.rules) && wo(e, t, this.time) > 0)
        throw new b(message("item.ordinaryPotionCooldown"));
      const a = Math.max(
        isSunPotion(t) ? sunPotionRemaining(e, this.time) : 0,
        itemCooldownRemaining(e, t, this.time),
      );
      if (a > 0)
        throw new b(
          message("item.sunCooldownRemaining", {
            seconds: Math.ceil(a / 1e3),
          }),
        );
      if (
        !matchesClass(t.RequiredClass, e.job) ||
        (t.RequiredGender !== "None" && t.RequiredGender !== e.gender)
      )
        throw new b(message("core.game.checkUse.7e2e685824"));
      if ((t.RequiredType === "Level" ? e.level : e.stats[t.RequiredType] || 0) < t.RequiredAmount)
        throw new b(message("core.game.checkUse.15eaf41ca3"));
    }
    useItem(e, t) {
      const a = e.inventory.findIndex((s) => s?.uid === t),
        i = e.inventory[a];
      if (!i) throw new b(message("core.game.useItem.9edbd2d8c5"));
      const n = this.defs.get(i.id);
      if (
        (this.checkUse(e, n),
        isSnowPotion(n) && (e.dead || i.count <= 0 || (e.hp >= e.maxHP && e.mp >= e.maxMP)))
      )
        throw new b(message("late.snowNoRecovery"));
      if (!(Uo(this, e, i) || ns(this, e, i))) {
        if (n.Type === "Mount") {
          Jt(this, e, i.uid);
          return;
        }
        if (n.Type === "MountVoucher") {
          ws(this, e, i.uid);
          return;
        }
        if (n.Type === "PandoraBox" || n.Type === "ForgeMaterial") {
          const s = String(n.DreamName || n.Name),
            o = this.rules.adaptations.forge;
          if (n.Index === o.identifyId) {
            this.say(message("core.game.useItem.f59371d780"));
            return;
          }
          this.emit("OpenForge", {
            Mode:
              n.Type === "PandoraBox"
                ? "pandora"
                : n.Index === o.resetId
                  ? "reset"
                  : n.Index === o.mixId
                    ? "mix"
                    : s.startsWith("\u6F5C\u80FD\u77F3")
                      ? "potential"
                      : s.includes("\u5929\u8D4B\u77F3")
                        ? "awaken"
                        : s.startsWith("\u51DD\u6676\u77F3")
                          ? "crystal"
                          : "enhance",
          });
          return;
        }
        if (n.Type === "CraftMaterial") {
          const s = this.rules.adaptations.forge?.recipes.find(
            (o) => o.mode === "craft" && o.inputs.some((r) => r.item === n.Index),
          );
          this.emit("OpenForge", {
            Mode: "craft",
            Recipe: s?.id,
            Missing: s?.inputs.map((o) => ({
              ...o,
              missing: Math.max(0, o.count - this.count(e, o.item)),
            })),
          });
          return;
        }
        if (n.Type === "ChallengeTicket") {
          this.say(message("core.game.useItem.f57105d62e"));
          return;
        }
        if (n.Type === "ExperienceScroll") {
          (this.gainXP(e, Number(n.ExperienceValue)),
            i.count--,
            i.count || (e.inventory[a] = null));
          return;
        }
        if (n.Type === "Gem") {
          const s = [];
          for (const o of e.inventory)
            if (o)
              try {
                s.push({
                  uid: o.uid,
                  id: o.id,
                  ...Gi(this, e, i, o),
                });
              } catch {}
          if (!s.length) throw new b(message("core.game.useItem.645999feaa"));
          this.emit("CombineOptions", {
            FromID: i.uid,
            List: s,
          });
          return;
        }
        if (n.Type === "Book") {
          if (!n.Spell || !this.rules.skills.some((r) => r.Spell === n.Spell))
            throw new b(message("core.game.useItem.ac1192a04a"));
          if (this.rules.adaptations.disabledSpells[n.Spell])
            throw Error(this.rules.adaptations.disabledSpells[n.Spell]);
          if (
            n.Spell === "HeavyStrike" &&
            e.skills.some((r) => r.Spell === "Slaying" && !r.temporary)
          )
            throw new b(message("skill.heavy.replaced"));
          const s = this.rules.skills.find((r) => r.Spell === n.Spell),
            o = e.skills.find((r) => r.Spell === n.Spell && !r.temporary);
          if (s?.DreamBookProgression) {
            const r = bookNextRank(s, n, o?.Level || 0, e.level);
            if (o) ((o.Level = r), (o.Experience = 0));
            else {
              e.skills = e.skills.filter((u) => u.Spell !== n.Spell || !u.temporary);
              const l =
                ([
                  ...Object.values(this.rules.adaptations.noviceProgression?.firstBookByJob || {}),
                  ...Object.values(this.rules.adaptations.noviceProgression?.secondBookByJob || {}),
                ].includes(n.Index) &&
                  !s.DreamSkill?.passive &&
                  [1, 2, 3, 4, 5, 6, 7, 8].find((u) => !e.skills.some((h) => h.Key === u))) ||
                0;
              e.skills.push({
                Spell: n.Spell,
                Level: r,
                Key: l,
                Experience: 0,
                CastTime: 0,
              });
            }
            (Ua(e),
              i.count--,
              i.count || (e.inventory[a] = null),
              this.say(
                message("core.game.useItem.b8f764be02", {
                  p0: entityText("skills", n.Spell),
                  p1: r,
                }),
              ),
              this.refresh(e));
            return;
          }
          if (o) throw new b(message("core.game.useItem.f43867c492"));
          ((e.skills = e.skills.filter((r) => r.Spell !== n.Spell || !r.temporary)),
            e.skills.push({
              Spell: n.Spell,
              Level: s?.DreamBookProgression ? 1 : 0,
              Key: 0,
              Experience: 0,
              CastTime: 0,
            }),
            this.say(
              message("core.game.useItem.7b0edac124", {
                p0: entityText("skills", n.Spell),
              }),
            ),
            this.refresh(e));
        } else if (n.Type === "MainlineSummon") {
          mr(this, e);
          return;
        } else if (n.Type === "TreasureMap") Sr(this, e);
        else if (n.Type === "BagExpansion") {
          const s = this.rules.adaptations.bagExpansion,
            o = e.bagExpansionRows || 0;
          if (o >= s.maxRows) throw new b(message("core.game.useItem.676fb9495c"));
          const r = equipmentCapacity(e, this.rules);
          (e.bagLayoutVersion === 1
            ? (e.inventory.splice(r, 0, ...Array(s.columns).fill(null)),
              e.inventory.push(...Array(s.columns).fill(null)))
            : e.inventory.push(...Array(s.columns).fill(null)),
            (e.bagExpansionRows = o + 1),
            this.say(
              message("core.game.useItem.2af6fb6f8b", {
                p0: o + 1,
                p1: s.columns,
                p2: o + 1,
                p3: s.maxRows,
              }),
            ));
        } else if (n.Type === "Potion") {
          if (n.Shape === 0)
            (Co(
              e,
              Math.floor((n.Stats.HP || 0) * (1 + (e.stats.PotionHealingPercent || 0) / 100)),
              n.Stats.MP || 0,
              this.time,
            ),
              this.rules.adaptations.dreamRuntime && !isHell(this.rules) && So(e, n, this.time));
          else if (n.Shape === 1) {
            (isSunPotion(n) && (e.sunPotionAt = this.time + wi), Po(e, n, this.time));
            const s = n.DreamPotionPercent
                ? Math.floor((e.maxHP * (n.Stats.HP || 0)) / 100)
                : Math.floor((n.Stats.HP || 0) * (1 + (e.stats.PotionHealingPercent || 0) / 100)),
              o = n.DreamPotionPercent
                ? Math.floor((e.maxMP * (n.Stats.MP || 0)) / 100)
                : n.Stats.MP || 0;
            ((e.hp = Math.min(e.maxHP, e.hp + s)), (e.mp = Math.min(e.maxMP, e.mp + o)));
          } else if (n.Shape === 2) {
            if (((e.special ??= {}), e.special.unlockCurse))
              throw new b(message("core.game.useItem.b320af37c9"));
            e.special.unlockCurse = !0;
          } else if (n.Shape === 3)
            for (const [s, o] of Object.entries({
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
              const r = Object.fromEntries(
                o.map((c) => [c, (n.Stats[c] || 0) + (i.added[c] || 0)]),
              );
              Object.values(r).some((c) => c > 0) && this.buff(e, s, n.Durability * 6e4, 0, r);
            }
          else if (n.Shape === 4 || n.Shape === 5)
            this.buff(e, n.Shape === 4 ? "Exp" : "Drop", n.Durability * 6e4, 0, {
              [n.Shape === 4 ? "ExpRatePercent" : "ItemDropRatePercent"]:
                (n.Stats.Luck || 0) + (i.added.Luck || 0),
            });
          else throw new b(message("core.game.useItem.ed072e21b7"));
        } else if (n.Type === "Scroll" && [1, 2].includes(n.Shape)) {
          if (n.Shape === 2 && this.region(e.map).noTeleport)
            throw new b(message("core.game.useItem.d3964b45bd"));
          const s = Ye(e, this.rules),
            o = n.Shape === 1 ? s.map : e.map,
            r = this.geometry.get(o);
          if (!r) throw new b(message("core.game.useItem.aea33a7a48"));
          this.initializeMap(o);
          let c = null;
          if (n.Shape === 1)
            c = this.freeNear(
              o,
              {
                x: s.at[0],
                y: s.at[1],
              },
              s.radius,
            );
          else {
            const l = r.width * r.height,
              u = this.rng.next(l);
            for (let h = 0; h < l; h++) {
              const p = (u + h) % l,
                g = p % r.width,
                y = Math.floor(p / r.width);
              if ((g !== e.x || y !== e.y) && this.walkable(o, g, y, e.id)) {
                c = {
                  x: g,
                  y,
                };
                break;
              }
            }
          }
          if (!c) throw new b(message("core.game.useItem.912b3c36ab"));
          ((e.map = o),
            (e.x = c.x),
            (e.y = c.y),
            (e.target = 0),
            (e.actionAt = this.time + 600),
            (this.npc = 0),
            this.bringPets(e),
            this.say(
              n.Shape === 1
                ? message("core.game.useItem.1cbc1b8891", {
                    p0: entityText("maps", s.id),
                  })
                : message("core.game.useItem.b8c220496a"),
            ));
        } else if (n.Type === "Scroll" && n.Shape === 3) {
          const s = e.equipment[0];
          if (!s || (s.added.Luck || 0) >= 7 || this.defs.get(s.id).Bind.includes("DontUpgrade"))
            throw new b(message("core.game.useItem.71982d113f"));
          const o = s.added.Luck || 0;
          (o > -this.rules.constants.MaxLuck && this.rng.next(20) === 0
            ? ((s.added.Luck = o - 1), this.say(message("core.game.useItem.63ff7d1459")))
            : o <= 0 || this.rng.next(10 * (o + (this.defs.get(s.id).Stats.Luck || 0))) === 0
              ? ((s.added.Luck = o + 1), this.say(message("core.game.useItem.b127f87a89")))
              : this.say(message("core.game.useItem.5a0f1ec8bf")),
            this.refresh(e));
        } else throw new b(message("core.game.useItem.1ed729edb3"));
        if ((i.count--, !i.count)) {
          const s = e.inventory.findIndex((o) => o?.uid === i.uid);
          s >= 0 && (e.inventory[s] = null);
        }
      }
    }
    acceptQuest(e, t) {
      const a = this.requireNPC(e),
        i = this.rules.quests.find((s) => s.Index === t);
      if (
        !i ||
        i.acceptNpc !== a.id ||
        e.quests.some((s) => s.id === t) ||
        e.completedQuests.includes(t) ||
        e.level < i.RequiredMinLevel ||
        e.level > i.RequiredMaxLevel ||
        (i.RequiredQuest && !e.completedQuests.includes(i.RequiredQuest))
      )
        throw new b(message("core.game.acceptQuest.bcd7946bf3"));
      const n = structuredClone(e.questInventory);
      for (const s of i.CarryItems)
        if (!this.give(e, this.newItem(s.item, s.count), !1))
          throw ((e.questInventory = n), new b(message("core.game.acceptQuest.c45399e923")));
      (e.quests.push({
        id: t,
        kills: {},
      }),
        this.say(
          message("core.game.acceptQuest.7c4db0b8ee", {
            p0: entityText("quests", i.Index),
          }),
        ));
    }
    finishQuest(e, t, a) {
      const i = this.requireNPC(e),
        n = this.rules.quests.find((r) => r.Index === t);
      if (!n || n.finishNpc !== i.id || !this.questComplete(e, n))
        throw new b(message("core.game.finishQuest.daf55c93c8"));
      const s = this.questRewards(n, e);
      if (n.SelectRewards.length) {
        const r = Number.isInteger(a) ? n.SelectRewards[a] : void 0;
        if (!r) throw new b(message("core.game.finishQuest.e7199796d9"));
        s.push(r);
      }
      const o = structuredClone({
        inventory: e.inventory,
        questInventory: e.questInventory,
      });
      for (const r of [...n.CarryItems, ...n.ItemTasks]) this.consume(e, r.item, r.count);
      for (const r of s)
        if (
          !this.give(
            e,
            n.Index === 214 && r.item === n.ClassRewards?.[e.job]?.item
              ? this.woomaWeapon(e, r.item)
              : this.newItem(r.item, r.count),
            !1,
          )
        )
          throw (Object.assign(e, o), new b(message("core.game.finishQuest.1abcf3a5f0")));
      ((e.gold += n.GoldReward),
        this.gainXP(e, n.ExpReward),
        (e.quests = e.quests.filter((r) => r.id !== t)),
        e.completedQuests.push(t),
        xt(this, e) && this.refresh(e),
        this.say(
          message("core.game.finishQuest.df8e4fdf82", {
            p0: entityText("quests", n.Index),
          }),
        ));
    }
    recoverLegacyMeat(e) {
      for (let t = 0; t < e.questInventory.length; t++) {
        const a = e.questInventory[t];
        a &&
          (a.id === this.rules.adaptations.unifiedDeerMeat.canonical ||
            ["PandoraBox", "MainlineSummon"].includes(this.defs.get(a.id)?.Type || "")) &&
          this.give(e, a, !1) &&
          (e.questInventory[t] = null);
      }
    }
    snapshot(e = -1, t = 24) {
      const a = this.me;
      (a && a.mountUid && !mountedItem(this, a) && delete a.mountUid,
        a && It(this, a),
        a && this.recoverLegacyMeat(a));
      const i = a ? structuredClone(a) : null;
      let n = null;
      i &&
        (n = {
          ...i,
          quickRings: i.ringHotkeys?.map((o) =>
            o
              ? (Ra(i, o) ?? {
                  id: i.equipment[o.slot]?.uid === o.teleport.uid ? o.original.id : o.teleport.id,
                  count: 0,
                })
              : null,
          ),
          spiritGrowth: this.rules.adaptations.noviceProgression?.spiritGrowth
            ? {
                cap: spiritGrowth(this, i).cfg.cap,
                nextXP: spiritNextXP(
                  spiritGrowth(this, i).cfg,
                  i.spiritProgress?.level || 0,
                ),
              }
            : void 0,
          heavyStrikeHits:
            this.time - Number(i.special?.heavyHitAt ?? -1 / 0) <= 8e3
              ? Number(i.special?.heavyHits || 0)
              : 0,
          honorTitle: this.rules.adaptations.trial?.titles[(i.trial?.title || 0) - 1]
            ? entityText("honorTitles", i.trial.title)
            : "",
          dynamicPortals: (this.map(i.map).portals || [])
            .filter((o) => !o.expires || o.expires > this.time)
            .map((o) => ({
              MapIndex: o.to,
              Name: o.name,
              Source: {
                x: o.at[0],
                y: o.at[1],
              },
              Destination: {
                x: o.landing[0],
                y: o.landing[1],
              },
            })),
          lateQuestRows: Qa(this, a),
          nextXP: this.rules.growth.experience[i.level - 1] || 1,
          buffs: i.buffs.map((o) => o.type),
          buffDetails: i.buffs.map((o) => ({
            type: o.type,
            remainingMs: Math.max(0, o.until - this.time),
            stats: o.stats,
            value: o.value,
            spell: o.spell,
          })),
          potionRecovery: Ao(a, this.time),
          sunPotionRemainingMs: sunPotionRemaining(a, this.time),
          snowPotionRemainingMs: Math.max(
            0,
            Math.min(8e3, (a.itemCooldowns?.snow || 0) - this.time),
          ),
          canMapTeleport: this.canMapTeleport(i),
          trial: i.trial,
          trialRun: i.trialRun
            ? {
                ...i.trialRun,
                remainingMs: Math.max(0, i.trialRun.deadline - this.time),
              }
            : void 0,
          challenge: i.challengeRun
            ? {
                ...i.challengeRun,
                remainingMs: Math.max(
                  0,
                  (i.challengeRun.returnAt ?? i.challengeRun.deadline) - this.time,
                ),
              }
            : void 0,
          bossRespawns: this.region(i.map).spawns.flatMap((o, r) => {
            const c = this.rules.monsters.find((h) => h.Name === o.monster);
            if (!c?.IsBoss && !o.native?.boss && !o.boss) return [];
            const l = this.map(i.map).actors.filter((h) => h.spawn === r && !h.dead).length;
            return [
              {
                positions: this.map(i.map)
                  .actors.filter((h) => h.spawn === r && !h.dead && !h.friendly)
                  .map((h) => ({
                    x: h.x,
                    y: h.y,
                  })),
                definition: c?.Index,
                name: c?.DreamName || c?.GuideName || c?.Name,
                alive: l,
                cap: o.count,
                remainingMs: Math.max(0, (this.map(i.map).respawns[r] || 0) - this.time),
                intervalMs: o.respawnMinutes * 6e4,
              },
            ];
          }),
          testTalisman: i.dead ? null : De(i, this.rules) || null,
          worldFirework: this.rules.adaptations.dreamRuntime?.worldFirework?.enabled
            ? {
                permanent: !0,
                experienceBonusPercent: je(this.rules.adaptations.dreamRuntime)
                  .experienceBonusPercent,
                monsterExperienceMultiplier:
                  (this.rules.multipliers.monsterExperienceMultiplier +
                    je(this.rules.adaptations.dreamRuntime).experienceBonusPercent / 100) *
                  (1 + Math.max(0, i.stats.ExpRatePercent || 0) / 100),
                dropMultiplier: dreamItemDropMultiplier(
                  this.rules.adaptations.dreamRuntime,
                  i.stats.ItemDropRatePercent,
                ),
                killXP: Math.max(0, i.stats.KillXP || 0),
                magicFind: dreamMagicFind(this.rules.adaptations.dreamRuntime, i.stats.MagicFind),
                exceptionalChance: dreamExceptionalChance(
                  dreamMagicFind(this.rules.adaptations.dreamRuntime, i.stats.MagicFind),
                ),
                exceptionalChancesByGrade: Object.fromEntries(
                  [0, 1, 2, 3, 4, 5, 6, 7].map((o) => [
                    o,
                    dreamEquipmentExceptionalChance(
                      this.rules.adaptations.dreamRuntime,
                      o,
                      dreamMagicFind(this.rules.adaptations.dreamRuntime, i.stats.MagicFind),
                    ),
                  ]),
                ),
              }
            : null,
          canRun: !i.dead,
          canAttack: !i.dead,
          attackDelay: pt(i.level, i.stats, !!this.rules.adaptations.dreamRuntime),
          attackReadyIn: Math.max(0, Math.max(i.attackAt, i.actionAt) - this.time),
          actionReadyIn: Math.max(0, i.actionAt - this.time),
          spellReadyIn: Math.max(0, Math.max(i.spellAt, i.actionAt) - this.time),
          bagWeight: this.bagWeight(i),
          skills: i.skills.map((o) => ({
            ...o,
            LearnedLevel: o.Level,
            EffectiveLevel: this.skill(i, o.Spell)?.level ?? o.Level,
            Info: this.rules.skills.find((r) => r.Spell === o.Spell),
          })),
          quests: i.quests.map((o) => {
            const r = this.rules.quests.find((c) => c.Index === o.id);
            return {
              id: o.id,
              info: this.questInfo(r, i),
              progress: {
                TaskList: [
                  entityText("quests", r.Index, "objective"),
                  ...(r.KillTotal !== void 0
                    ? [
                        message("quest.killTotal", {
                          current: Math.min(r.KillTotal, this.questKillTotal(o.kills, r)),
                          required: r.KillTotal,
                        }),
                      ]
                    : r.KillTasks.map((c) =>
                        message("quest.progress", {
                          name: entityText("monsters", c.monster),
                          current: o.kills[c.monster] || 0,
                          required: c.count,
                        }),
                      )),
                  ...r.ItemTasks.map((c) =>
                    message("quest.progress", {
                      name: entityText("items", c.item),
                      current: this.count(i, c.item),
                      required: c.count,
                    }),
                  ),
                ],
                KillCount: r.KillTasks.map((c) => o.kills[c.monster] || 0),
                ItemCount: r.ItemTasks.map((c) => this.count(i, c.item)),
                Completed: this.questComplete(i, r),
              },
            };
          }),
        });
      const s = a
        ? this.map(a.map)
            .actors.filter(
              (o) => P(o, a) <= (Number.isFinite(t) ? Math.max(24, Math.min(26, t)) : 24) && St(o),
            )
            .map((o) => {
              if (o.ai === 55 && o.master) {
                const r = this.roles.find((c) => c.id === o.master);
                if (r)
                  return {
                    ...o,
                    kind: "clone",
                    name: r.name,
                    gender: r.gender,
                    equipment: structuredClone(r.equipment),
                    buffs: o.buffs.map((c) => c.type),
                  };
              }
              return o.kind !== "npc"
                ? {
                    ...o,
                    displayName: o.kind === "monster" ? rs(o, this.rules) : void 0,
                    rank:
                      o.kind === "monster"
                        ? Xt(this.monsters.get(o.definition), this.rules)
                        : void 0,
                    extra: !!o.special?.stoned,
                    x:
                      o.kind === "spell" && o.show && o.spell !== "FireWall"
                        ? (o.stats.centerX ?? o.x)
                        : o.x,
                    y:
                      o.kind === "spell" && o.show && o.spell !== "FireWall"
                        ? (o.stats.centerY ?? o.y)
                        : o.y,
                    buffs: o.buffs.map((r) => r.type),
                    poison: o.buffs.map((r) => r.type).join(", "),
                  }
                : {
                    ...o,
                    quests: this.rules.quests
                      .filter((r) => r.acceptNpc === o.id || r.finishNpc === o.id)
                      .map((r) => ({
                        id: r.Index,
                        name: r.Name,
                        canAccept:
                          r.acceptNpc === o.id &&
                          !a.quests.some((c) => c.id === r.Index) &&
                          !a.completedQuests.includes(r.Index) &&
                          a.level >= r.RequiredMinLevel &&
                          a.level <= r.RequiredMaxLevel &&
                          (!r.RequiredQuest || a.completedQuests.includes(r.RequiredQuest)),
                        canFinish: r.finishNpc === o.id && this.questComplete(a, r),
                        info: this.questInfo(r, a),
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
          currentMonsters: a
            ? this.map(a.map).actors.filter((o) => o.kind === "monster" && !o.dead).length
            : 0,
          awakeMonsters: a
            ? this.map(a.map).actors.filter(
                (o) =>
                  o.kind === "monster" &&
                  !o.dead &&
                  (o.friendly || P(o, a) <= 24 || o.buffs.length),
              ).length
            : 0,
        },
        lastSaved: this.lastSaved,
        ...(ce(this.rules)
          ? {
              sharedStorageGame: sharedStorageGame(this.rules),
              sharedStorageVersion: 1,
              sharedStorage: this.sharedStorage,
            }
          : {}),
        ...(this.sync
          ? {
              sync: this.sync,
            }
          : {}),
        account: {
          id: 1,
          name: "\u672C\u673A\u5B58\u6863",
          guest: !1,
        },
        guestAvailable: !1,
        stage: a ? "Game" : "Select",
        roles: this.roles.map((o) => ({
          id: o.id,
          cloudId: o.cloudId,
          name: o.name,
          job: o.job,
          gender: o.gender,
          level: o.level,
        })),
        me: n,
        actors: s,
        mapMonsters: a
          ? this.map(a.map)
              .actors.filter(
                (o) =>
                  o.kind === "monster" &&
                  !o.dead &&
                  P(o, a) <= 24 &&
                  (St(o) ||
                    [19, 131].includes(
                      Number(this.monsters.get(o.definition)?.DreamOriginalId || 0),
                    )),
              )
              .map((o) => ({
                id: o.id,
                kind: o.kind,
                x: o.x,
                y: o.y,
                name: o.name,
                friendly: o.friendly,
                dead: o.dead,
                rank: Xt(this.monsters.get(o.definition), this.rules),
              }))
          : [],
        packets: e < 0 ? [] : this.packets.filter((o) => o.seq > e),
      };
    }
    save(e = !0) {
      return structuredClone({
        version: 1,
        worldVersion: this.rules.adaptations.mainline?.worldVersion,
        rulesVersion: this.rules.version,
        ...(isHell(this.rules)
          ? {
              gameId: "classic-hell",
            }
          : {}),
        dreamRuntimeVersion: this.rules.adaptations.dreamRuntime?.version,
        time: this.time,
        nextId: this.nextId,
        rng: this.rng.export(),
        roles: this.roles,
        maps: e ? this.maps : {},
        events: e ? this.events : [],
        nextOrder: this.nextOrder,
        lastSaved: this.lastSaved,
        ...(ce(this.rules)
          ? {
              sharedStorageGame: sharedStorageGame(this.rules),
              sharedStorageVersion: 1,
              sharedStorage: this.sharedStorage,
            }
          : {}),
        ...(this.sync
          ? {
              sync: this.sync,
            }
          : {}),
      });
    }
    restore(e) {
      if (
        ((e = Ti(Vi(e, this.rules), this.rules)),
        e.version !== 1 || e.rulesVersion !== this.rules.version)
      )
        throw new b(message("core.game.restore.8d582cc5cd"));
      ((this.roles = structuredClone(e.roles)),
        (this.sharedStorage = ce(this.rules)
          ? structuredClone(e.sharedStorage ?? Array(rt).fill(null))
          : Array(rt).fill(null)),
        (this.maps = structuredClone(e.maps)),
        (this.bossRespawns = {}),
        this.spreadMaps.clear(),
        (this.time = e.time),
        (this.replenishAt = this.time),
        (this.nextId = e.nextId),
        this.rng.restore(e.rng));
      const t = this.rules.adaptations.unifiedDeerMeat,
        a = (i) => {
          const n = i && this.defs.get(i.id);
          (i && n && (sn(i, n, this.rules.adaptations.dreamRuntime?.affixes), Li(i, this.rules)),
            i?.id === t.legacy &&
              ((i.id = t.canonical),
              (i.maxDura = this.defs.get(t.canonical).Durability),
              (i.currentDura = Math.min(i.currentDura, i.maxDura))));
        };
      for (const i of this.sharedStorage) a(i);
      for (const i of this.roles) {
        (i.equipment.length === 14 && i.equipment.push(null),
          this.defs.get(i.equipment[12]?.id || 0)?.DreamType === 6 &&
            !i.equipment[14] &&
            ((i.equipment[14] = i.equipment[12]), (i.equipment[12] = null)));
        for (const n of Object.keys(i.crafting?.skills ?? {})) Ci(this, i, n);
        (fr(i, this.rules), migrateItemHotkeys(i, this.defs), Ha(i, this.rules, this.defs));
        for (const n of [
          ...i.inventory,
          ...i.questInventory,
          ...i.storage,
          ...i.equipment,
          ...Object.values(i.buyback || {}).flat(),
        ])
          a(n);
        for (const n of i.challengeRewards?.pending || []) for (const s of n.items) a(s);
        this.recoverLegacyMeat(i);
      }
      for (const i of Object.values(this.maps))
        for (const n of i.actors)
          (a(n.item), n.item?.id === t.canonical && (n.name = this.defs.get(t.canonical).Name));
      for (const i of Object.values(this.maps))
        for (const n of i.actors)
          n.kind === "monster" && !n.special && ui(this, n, this.monsters.get(n.definition));
      ((this.events = structuredClone(e.events)),
        (this.nextOrder = e.nextOrder),
        (this.lastSaved = e.lastSaved),
        (this.sync = e.sync ? structuredClone(e.sync) : void 0),
        (this.active = 0),
        (this.npc = 0));
    }
  },
  Ht = [
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
  ],
  he = {
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

// Summon growth is based on effective spell rank; earned levels and XP are preserved.
function summonPetCap(level, bonus = 0) {
  return (
    1 + 2 * Math.max(1, Math.trunc(Number(level) || 1)) + Math.max(0, bonus)
  );
}
function refreshSummonLevelCap(g, pet) {
  if (
    pet.kind !== "monster" ||
    !pet.friendly ||
    !pet.master ||
    typeof pet.special?.petLevel !== "number" ||
    pet.special.dreamTamed
  )
    return;
  const owner = g.roles.find((r) => r.id === pet.master);
  const def = g.monsters.get(pet.definition);
  if (!owner || !def) return;
  const ids = {
    SummonSkeleton: 29,
    SummonShinsu: 14,
    AdvancedSummon: 62,
    SummonTiger: def.DreamOriginalId === 116 ? 116 : 99,
    SummonMoonSpirit: 144,
  };
  const native = {
    SummonSkeleton: "SkeletonName",
    SummonShinsu: "ShinsuName",
    SummonHolyDeva: "AngelName",
  };
  const spell =
    pet.special.summonSpell ||
    (def.Index === g.rules.adaptations.noviceProgression?.spiritMonster
      ? "SummonSpiritServant"
      : Object.keys(ids).find((s) => def.DreamOriginalId === ids[s]) ||
        Object.keys(native).find(
          (s) => def.Name === g.rules.monsterSettings?.[native[s]],
        ));
  const skill = spell && g.skill(owner, spell);
  if (skill)
    pet.special.maxPetLevel = summonPetCap(
      skill.level,
      owner.stats["PetLevel:" + spell] || 0,
    );
}

// Shared by the three offline workers and their settings UI.
var AUTO_BATTLE_SKILLS = {
  Warrior: [
    "BloodDragon",
    "DiamondBody",
    "ProtectionField",
    "Rage",
    "FlamingSword",
    "BlazingSword",
    "HalfMoon",
    "WhirlwindSlash",
    "Thrusting",
  ],
  Wizard: [
    "MagicShield",
    "Abyss",
    "MagicBooster",
    "FireBall",
    "GreatFireBall",
    "ThunderBolt",
    "FlameDisruptor",
    "FrostCrunch",
    "FireBang",
    "IceStorm",
    "IceFlame",
    "ChainThunder",
    "ThunderStorm",
    "MeteorStrike",
    "FireWall",
    "DragonFlame",
    "Hydra",
  ],
  Taoist: [
    "BlessedArmour",
    "SoulShield",
    "Hiding",
    "Healing",
    "MassHealing",
    "SummonSpiritServant",
    "SummonSkeleton",
    "SummonShinsu",
    "AdvancedSummon",
    "SummonTiger",
    "SummonMoonSpirit",
    "InnateQi",
    "BeastArmour",
    "Poisoning",
    "GhostBurn",
    "SoulFireBall",
    "PoisonCloud",
  ],
};
function autoBattleSettings(value, catalog = [], migrateDefaults = true) {
  const strings = (v) =>
    Array.isArray(v)
      ? [...new Set(v.filter((x) => typeof x === "string" && x.length <= 80))]
      : [];
  const ids = (v) =>
    Array.isArray(v)
      ? [...new Set(v.filter((x) => Number.isSafeInteger(x) && x >= 0))]
      : [];
  const all = [...catalog];
  const options = {
    ids: all.map((d) => d.Index),
    types: [...new Set(all.map((d) => d.Type))],
    grades: [...new Set(all.map((d) => String(d.Grade || "None")))],
    tiers: [...new Set(all.map((d) => d.DreamGrade).filter(Number.isFinite))],
    qualities: ["normal", "exceptional", "goldExceptional"],
  };
  const raw = value?.loot;
  // The old untouched template contained five empty arrays and enabled gold.
  const initial =
    !raw ||
    (migrateDefaults &&
      raw.version === undefined &&
      raw.gold !== false &&
      Object.keys(options).every(
        (k) => Array.isArray(raw[k]) && !raw[k].length,
      ));
  const selected = (key) => {
    if (initial || (raw.version === 2 && !Array.isArray(raw[key])))
      return options[key];
    const selected =
      key === "ids" || key === "tiers" ? ids(raw[key]) : strings(raw[key]);
    return selected.filter((x) => options[key].includes(x));
  };
  const loot = Object.fromEntries(
    Object.keys(options).map((key) => [key, selected(key)]),
  );
  if (!initial && raw.version !== 2) {
    // Expand the old ID-or-category union before switching to independent gates.
    loot.ids = all
      .filter((d) => loot.ids.includes(d.Index) || loot.types.includes(d.Type))
      .map((d) => d.Index);
    loot.types = options.types;
  }
  return {
    enabled: value?.enabled === true,
    sweep: value?.sweep === true,
    lootEnabled: value?.lootEnabled === true,
    skills: Array.isArray(value?.skills) ? strings(value.skills) : null,
    loot: {
      version: 2,
      gold: raw?.gold !== false,
      ...loot,
    },
  };
}
function autoBattleQuality(item, qualityPoints) {
  const points = qualityPoints(item);
  return points >= 4
    ? "goldExceptional"
    : Object.values(item.added || {}).some((v) => v > 0) || item.affixes?.length
      ? "exceptional"
      : "normal";
}
function autoBattleAllowsLoot(config, actor, defs, chestId, qualityPoints) {
  if (
    actor.kind !== "item" ||
    actor.dead ||
    (chestId !== undefined && actor.item?.id === chestId)
  )
    return false;
  if (actor.gold > 0) return config.gold;
  const item = actor.item,
    def = item && defs.get(item.id);
  return (
    !!def &&
    (config.version === 2
      ? config.ids.includes(item.id) && config.types.includes(def.Type)
      : config.ids.includes(item.id) || config.types.includes(def.Type)) &&
    config.grades.includes(String(def.Grade || "None")) &&
    (def.DreamGrade === undefined || config.tiers.includes(def.DreamGrade)) &&
    config.qualities.includes(autoBattleQuality(item, qualityPoints))
  );
}

// Decisions use a fresh simulation snapshot, never browser key events.
var autoBattleStates = new WeakMap();
var autoBattleVectors = [
  [0, -1],
  [1, -1],
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
];
var autoBattleDistance = (a, b) =>
  Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
var autoBattleHasBuff = (g, a, type) =>
  a.buffs.some((b) => b.type === type && b.until > g.time);
var autoBattleBound = (sk) =>
  !!sk && Number.isInteger(sk.s.Key) && sk.s.Key >= 1 && sk.s.Key <= 8;
var AUTO_BATTLE_DAMAGE = [
  "FireBall",
  "GreatFireBall",
  "ThunderBolt",
  "SoulFireBall",
  "FlameDisruptor",
  "FrostCrunch",
  "FireBang",
  "IceStorm",
  "IceFlame",
  "MeteorStrike",
  "ThunderStorm",
  "ChainThunder",
  "FireWall",
  "PoisonCloud",
  "DragonFlame",
  "Hydra",
];
function autoBattleSkill(g, r, cfg, api, spell) {
  const sk = g.skill(r, spell);
  if (
    !autoBattleBound(sk) ||
    (cfg.skills !== null && !cfg.skills.includes(spell)) ||
    sk.d.DreamSkill?.passive ||
    g.rules.adaptations.disabledSpells?.[spell] ||
    g.time < sk.s.CastTime ||
    r.mp < api.cost(sk.d, sk.d.DreamSkill ? sk.level : sk.s.Level, r.stats)
  )
    return null;
  if (!sk.d.DreamSkill) {
    const reagent = {
      Hiding: [0, 1],
      BlessedArmour: [0, 1],
      SoulShield: [0, 1],
      Poisoning: [0, 1],
      PoisonCloud: [0, 5],
      GhostBurn: [0, 1],
      SummonSkeleton: [0, 1],
      SummonShinsu: [0, 1],
      AdvancedSummon: [0, 1],
    }[spell];
    if (
      reagent &&
      ![...r.equipment, ...r.inventory].some(
        (i) =>
          i &&
          g.defs.get(i.id)?.Type === "Amulet" &&
          g.defs.get(i.id)?.DreamType !== 17 &&
          g.defs.get(i.id)?.Shape === reagent[0] &&
          i.count >= reagent[1],
      )
    )
      return null;
  }
  return sk;
}
function autoBattlePending(g, r, target, spell) {
  return g.events.some(
    (e) =>
      e.source === r.id &&
      e.target === target.id &&
      e.spell === spell &&
      e.at > g.time,
  );
}
function autoBattleCandidate(
  sk,
  target,
  benefit,
  priority,
  api,
  r,
  mode = "cast",
) {
  const cost = api.cost(sk.d, sk.d.DreamSkill ? sk.level : sk.s.Level, r.stats);
  return {
    sk,
    target,
    benefit,
    priority,
    mode,
    cost,
    score: benefit / Math.max(1, cost),
  };
}
function autoBattleBest(candidates) {
  return candidates
    .filter((c) => c.benefit > 0)
    .sort(
      (a, b) =>
        a.priority - b.priority ||
        b.score - a.score ||
        b.benefit - a.benefit ||
        a.sk.d.Spell.localeCompare(b.sk.d.Spell) ||
        (a.target.id || 0) - (b.target.id || 0) ||
        a.target.y - b.target.y ||
        a.target.x - b.target.x,
    )[0];
}
function autoBattleBuffCandidates(g, r, cfg, api, spells, priority = 0) {
  return spells.flatMap((spell) => {
    const sk = autoBattleSkill(g, r, cfg, api, spell);
    return sk &&
      !autoBattleHasBuff(g, r, spell) &&
      !autoBattlePending(g, r, r, spell)
      ? [autoBattleCandidate(sk, r, 1, priority, api, r)]
      : [];
  });
}
function autoBattlePower(r, sk, api, kind = "MC") {
  // Estimate without consuming the world's RNG or mutating combat state.
  const raw = ((r.stats["Min" + kind] || 0) + (r.stats["Max" + kind] || 0)) / 2;
  const meanRng = {
    next: (max, min = 0) => Math.max(min, (min + Math.max(min, max - 1)) / 2),
  };
  return api.damage(
    sk.d,
    sk.d.DreamSkill ? sk.level : sk.s.Level,
    raw,
    meanRng,
  );
}
function autoBattleUsefulDamage(a, raw, defence = "MAC", context) {
  let armor = defence.endsWith("NoArmor")
    ? 0
    : ((a.stats["Min" + defence] || 0) + (a.stats["Max" + defence] || 0)) / 2;
  if (context) {
    const { g, r, api, sk } = context;
    raw = api.outgoing(g, r, a, raw, sk.d.Spell) + (r.stats.AttackBonus || 0);
    armor *= 1 - Math.min(100, r.stats.WeakSpotPercent || 0) / 100;
    const poison = a.buffs.find(
      (b) => b.type === "DreamPoisonArmour" && b.until > g.time,
    );
    if (poison) armor *= 1 - poison.value / 100;
    if (
      sk.d.DreamSkill &&
      (sk.d.Spell === "FlameDisruptor" ||
        (sk.d.Spell === "SoulFireBall" && sk.level >= 4))
    )
      armor *= 0.5;
    if (sk.d.DreamSkill && sk.d.Spell === "DragonFlame")
      armor /= Math.max(1, sk.level);
    if (autoBattleHasBuff(g, a, "Red")) armor *= 0.5;
  }
  const dodge = defence.startsWith("MAC")
    ? a.stats.MagicDodgePercent
    : a.stats.PhysicalDodgePercent;
  return Math.min(
    a.hp,
    Math.max(0, raw - armor) * (1 - Math.min(100, dodge || 0) / 100),
  );
}
function autoBattleDamageCandidates(
  g,
  r,
  cfg,
  api,
  enemies,
  spells,
  priority = 6,
) {
  const result = [];
  for (const spell of spells) {
    if (!AUTO_BATTLE_DAMAGE.includes(spell)) continue;
    const sk = autoBattleSkill(g, r, cfg, api, spell);
    if (!sk) continue;
    const native = !!sk.d.DreamSkill;
    // Only include implemented models. Legacy spells with different geometry stay manual.
    const single = [
      "FireBall",
      "GreatFireBall",
      "ThunderBolt",
      "SoulFireBall",
      "FlameDisruptor",
      "FrostCrunch",
    ].includes(spell);
    if (!native && !single && !["FireBang", "IceStorm"].includes(spell))
      continue;
    let power = autoBattlePower(
      r,
      sk,
      api,
      ["SoulFireBall", "PoisonCloud"].includes(spell) ? "SC" : "MC",
    );
    if (spell === "PoisonCloud" && native)
      power = Math.trunc(power / ([1, 2, 1.5, 1.2][sk.level] ?? 1));
    const areaRadius =
      spell === "DragonFlame"
        ? 2
        : [
              "FireBang",
              "IceStorm",
              "IceFlame",
              "MeteorStrike",
              "FireWall",
              "PoisonCloud",
            ].includes(spell)
          ? 1
          : 0;
    const centers = new Map(enemies.map((a) => [`${a.x},${a.y}`, a]));
    // Empty tiles can be better AoE centers than any monster's own tile.
    if (areaRadius)
      for (const a of enemies.filter(
        (a) => autoBattleDistance(r, a) <= sk.d.Range + areaRadius,
      )) {
        for (let dy = -areaRadius; dy <= areaRadius; dy++)
          for (let dx = -areaRadius; dx <= areaRadius; dx++) {
            const x = a.x + dx,
              y = a.y + dy,
              key = `${x},${y}`,
              geom = g.geometry.get(r.map);
            if (
              x >= 0 &&
              y >= 0 &&
              x < geom.width &&
              y < geom.height &&
              !geom.solid[y * geom.width + x] &&
              !centers.has(key)
            )
              centers.set(key, { id: 0, x, y });
          }
      }
    for (const center of centers.values()) {
      if (
        autoBattleDistance(r, center) > sk.d.Range ||
        !api.reach(g, r, spell, center)
      )
        continue;
      let hits = [[center, 1]];
      if (["FireBang", "IceStorm", "IceFlame", "MeteorStrike"].includes(spell))
        hits = enemies
          .filter((a) => autoBattleDistance(a, center) <= 1)
          .map((a) => [a, spell === "MeteorStrike" ? 3 : 1]);
      if (spell === "ThunderStorm")
        hits = enemies
          .filter((a) => autoBattleDistance(a, r) <= 2)
          .map((a) => [a, autoBattleDistance(a, r) > 1 ? 0.5 : 1]);
      if (spell === "ChainThunder") {
        hits = [[center, 1]];
        while (hits.length < Math.max(2, sk.level + 1)) {
          const previous = hits.at(-1)[0];
          const next = enemies
            .filter(
              (a) =>
                !hits.some(([b]) => a === b) &&
                autoBattleDistance(a, previous) <= Math.min(4, sk.s.Level + 1),
            )
            .sort(
              (a, b) =>
                autoBattleDistance(a, previous) -
                  autoBattleDistance(b, previous) || a.id - b.id,
            )[0];
          if (!next) break;
          hits.push([next, Math.max(0.25, 0.8 ** hits.length)]);
        }
      }
      if (["FireWall", "PoisonCloud", "DragonFlame"].includes(spell)) {
        const duration =
          spell === "DragonFlame"
            ? 3
            : spell === "PoisonCloud"
              ? 3 + ((r.stats.MinSC || 0) + (r.stats.MaxSC || 0)) / 20
              : Math.min(
                  (((r.stats.MinMC || 0) + (r.stats.MaxMC || 0)) / 2 +
                    3 * sk.level) *
                    0.5,
                  [0, 8, 12, 15, 18, 21, 24][sk.level] ?? 25,
                );
        hits = enemies
          .filter((a) =>
            spell === "FireWall"
              ? Math.abs(a.x - center.x) + Math.abs(a.y - center.y) <= 1
              : autoBattleDistance(a, center) <=
                (spell === "DragonFlame" ? 2 : 1),
          )
          .filter(
            (a) =>
              !g
                .map(r.map)
                .actors.some(
                  (f) =>
                    f.kind === "spell" &&
                    f.spell === spell &&
                    f.x === a.x &&
                    f.y === a.y &&
                    f.expires > g.time,
                ) &&
              !g.events.some(
                (e) =>
                  e.spell === spell &&
                  e.location &&
                  (spell === "FireWall"
                    ? Math.abs(e.location.x - a.x) +
                        Math.abs(e.location.y - a.y) <=
                      1
                    : autoBattleDistance(e.location, a) <=
                      (spell === "DragonFlame" ? 2 : 1)) &&
                  e.at >= g.time,
              ),
          )
          .map((a) => [a, Math.floor(duration)]);
      }
      if (spell === "Hydra") {
        if (
          g
            .map(r.map)
            .actors.some(
              (a) =>
                a.spell === "Hydra" &&
                a.target === r.id &&
                !a.dead &&
                a.expires > g.time,
            ) ||
          !autoBattleVectors.some(([dx, dy]) => {
            const p = { x: center.x + dx, y: center.y + dy };
            return (
              autoBattleDistance(r, p) <= sk.d.Range &&
              g.walkable(r.map, p.x, p.y, r.id) &&
              api.sight(g, r.map, r, p)
            );
          })
        )
          continue;
        const balance = api.hydraStats(sk.d, sk.level);
        hits = [
          [
            center,
            Math.max(1, Math.floor(balance.durationMs / balance.intervalMs)),
          ],
        ];
      }
      const benefit = hits.reduce(
        (sum, [a, multiplier]) =>
          sum +
          Math.min(
            a.hp,
            autoBattleUsefulDamage(a, power, "MAC", { g, r, api, sk }) *
              multiplier,
          ),
        0,
      );
      if (benefit)
        result.push(autoBattleCandidate(sk, center, benefit, priority, api, r));
    }
  }
  return result;
}
function autoBattleContext(g, r, cfg, api) {
  return {
    g,
    r,
    cfg,
    api,
    enemies: g
      .map(r.map)
      .actors.filter(
        (a) =>
          a.kind === "monster" &&
          !a.dead &&
          !a.friendly &&
          targetableMonster(a),
      ),
  };
}
function autoBattleRoute(g, r, api, goal, range, state, explore = false) {
  const geom = g.geometry.get(r.map);
  const portals = new Set(
    api.portals(g, r.map).map((p) => p.at[1] * geom.width + p.at[0]),
  );
  const key = (x, y) => y * geom.width + x;
  const start = key(r.x, r.y),
    queue = [{ x: r.x, y: r.y, first: -1 }],
    seen = new Set([start]);
  let fallback = null;
  const occupied = new Set(
    g
      .map(r.map)
      .actors.filter(
        (a) =>
          a.id !== r.id &&
          !(a.friendly && a.master === r.id) &&
          !a.dead &&
          api.visible(a) &&
          ["monster", "npc"].includes(a.kind),
      )
      .map((a) => key(a.x, a.y)),
  );
  // Bound work on large maps; approaching goals is retried after a short backoff.
  for (let i = 0; i < queue.length && i < 12000; i++) {
    const at = queue[i];
    if (
      at.first >= 0 &&
      (explore
        ? !state.visited.has(key(at.x, at.y))
        : autoBattleDistance(at, goal) <= range)
    )
      return at.first;
    if (
      explore &&
      at.first >= 0 &&
      (!fallback || (state.visited.get(key(at.x, at.y)) || 0) < fallback.age)
    )
      fallback = {
        dir: at.first,
        age: state.visited.get(key(at.x, at.y)) || 0,
      };
    for (let dir = 0; dir < 8; dir++) {
      const [dx, dy] = autoBattleVectors[dir],
        x = at.x + dx,
        y = at.y + dy,
        k = key(x, y);
      if (
        x < 0 ||
        y < 0 ||
        x >= geom.width ||
        y >= geom.height ||
        seen.has(k) ||
        portals.has(k) ||
        geom.solid[k] ||
        occupied.has(k)
      )
        continue;
      seen.add(k);
      queue.push({ x, y, first: at.first < 0 ? dir : at.first });
    }
  }
  return fallback?.dir ?? -1;
}
// The viewport is transient worker state and follows desktop resolution/mobile layout.
var autoBattleView = { width: 1280, height: 768, mobile: false };
function autoBattleSetViewport(data) {
  const width = Number(data?.width),
    height = Number(data?.height);
  if (
    Number.isFinite(width) &&
    Number.isFinite(height) &&
    width > 0 &&
    height > 0
  )
    autoBattleView = {
      width: Math.min(4096, width),
      height: Math.min(4096, height),
      mobile: data.mobile === true,
    };
}
function autoBattleOnScreen(r, a) {
  // Match the game renderer's 48x32 grid and player camera offset.
  const { width, height, mobile } = autoBattleView;
  const x = (a.x - r.x) * 48 + width / 2;
  const y = (a.y - r.y) * 32 + height / 2 - (mobile ? 35 : 90) + 12;
  return x >= 0 && x <= width && y >= 0 && y <= height;
}
function autoBattleLootAllowed(g, r, cfg, a, api) {
  return (
    cfg.lootEnabled &&
    a.map === r.map &&
    (!a.expires || a.expires > g.time) &&
    autoBattleAllowsLoot(
      cfg.loot,
      a,
      g.defs,
      g.rules.adaptations.adventure?.chestId,
      api.qualityPoints,
    )
  );
}
function autoBattleMove(
  g,
  r,
  api,
  goal,
  range,
  state,
  explore = false,
  direction,
) {
  const dir =
    direction ?? autoBattleRoute(g, r, api, goal, range, state, explore);
  if (dir < 0) return false;
  const [dx, dy] = autoBattleVectors[dir];
  const next = { ...r, x: r.x + dx, y: r.y + dy };
  const run =
    (explore || autoBattleDistance(next, goal) > range) &&
    autoBattleRoute(g, next, api, goal, range, state, explore) === dir;
  return (run && g.move(r, dir, 2)) || g.move(r, dir, 1);
}
function autoBattleLoot(g, r, cfg, state, api) {
  if (!cfg.lootEnabled || g.time < state.lootAt) return;
  state.lootAt = g.time + 200;
  const ground = g.map(r.map).actors;
  let picked = false;
  for (const a of [...ground]) {
    if (
      autoBattleDistance(r, a) > 5 ||
      !autoBattleLootAllowed(g, r, cfg, a, api)
    )
      continue;
    if (a.gold > 0) {
      r.gold += a.gold;
      g.emit("GainedGold", { Gold: a.gold });
    } else if (!g.give(r, a.item)) {
      state.rejectedLoot.set(a.id, g.time + 3000);
      continue;
    }
    const index = ground.indexOf(a);
    if (index >= 0) ground.splice(index, 1);
    state.rejectedLoot.delete(a.id);
    picked = true;
  }
  for (const [id, until] of state.rejectedLoot)
    if (until <= g.time) state.rejectedLoot.delete(id);
  return picked;
}
function autoBattleTick(g, r, api) {
  let cfg = r.assist?.autoBattle;
  if (!cfg) return;
  let state = autoBattleStates.get(r);
  if (!state) {
    cfg = r.assist.autoBattle = autoBattleSettings(cfg, g.defs.values());
    state = {
      map: r.map,
      pauseUntil: 0,
      lootAt: 0,
      routeAt: 0,
      visited: new Map(),
      rejectedLoot: new Map(),
    };
    autoBattleStates.set(r, state);
  }
  if (r.dead || r.map !== state.map) {
    cfg.enabled = false;
    cfg.lootEnabled = false;
    autoBattleStates.delete(r);
    return;
  }
  if (!g.geometry.has(r.map)) return;
  if (g.time < state.pauseUntil) return;
  if (autoBattleLoot(g, r, cfg, state, api)) return;
  if (
    mountedItem(g, r) ||
    g.safe(r) ||
    g.npc ||
    api.pending(r) ||
    g.time < Math.max(r.actionAt, r.spellAt) ||
    r.buffs.some(
      (b) =>
        [
          "Paralysis",
          "LRParalysis",
          "Trap",
          "Frozen",
          "Shock",
          "Stun",
        ].includes(b.type) && b.until > g.time,
    )
  )
    return;
  // Reserve the next action for eligible on-screen loot before any combat or sweep.
  const loot = g
    .map(r.map)
    .actors.filter(
      (a) =>
        autoBattleLootAllowed(g, r, cfg, a, api) &&
        autoBattleOnScreen(r, a) &&
        (state.rejectedLoot.get(a.id) || 0) <= g.time,
    )
    .sort(
      (a, b) =>
        autoBattleDistance(r, a) - autoBattleDistance(r, b) || a.id - b.id,
    );
  for (const a of loot) {
    if (autoBattleDistance(r, a) <= 5 || g.time < state.routeAt) return;
    const dir = autoBattleRoute(g, r, api, a, 5, state);
    if (dir < 0) {
      state.rejectedLoot.set(a.id, g.time + 1000);
      continue;
    }
    state.routeAt = g.time + 200;
    if (autoBattleMove(g, r, api, a, 5, state, false, dir)) return;
    state.rejectedLoot.set(a.id, g.time + 1000);
  }
  if (!cfg.enabled) return;
  const context = autoBattleContext(g, r, cfg, api);
  const decision = {
    Warrior: autoBattleWarrior,
    Wizard: autoBattleWizard,
    Taoist: autoBattleTaoist,
  }[r.job]?.(context);
  if (decision) {
    if (decision.mode === "melee") {
      const spell = decision.sk.d.Spell,
        key = spell[0].toLowerCase() + spell.slice(1);
      if (!r.attackModes[key]) api.toggle(g, r, spell, true);
      g.attack(r, decision.target, spell);
    } else
      api.cast(g, r, {
        Spell: decision.sk.d.Spell,
        TargetID: decision.target.id,
        Location: { X: decision.target.x, Y: decision.target.y },
        Direction: api.dirs[r.dir],
      });
    return;
  }
  const nearest = context.enemies
    .slice()
    .sort(
      (a, b) =>
        autoBattleDistance(r, a) - autoBattleDistance(r, b) || a.id - b.id,
    )[0];
  if (
    nearest &&
    r.job === "Warrior" &&
    autoBattleDistance(r, nearest) <= 1 &&
    g.time >= r.attackAt
  ) {
    g.attack(r, nearest, "None");
    return;
  }
  if (!cfg.sweep || g.time < state.routeAt) return;
  state.routeAt = g.time + Math.max(200, r.actionAt - g.time);
  state.visited.set(r.y * g.geometry.get(r.map).width + r.x, g.time);
  const goal = nearest;
  const hurtPet =
    r.job === "Taoist" &&
    Object.values(g.maps)
      .flatMap((m) => m.actors)
      .find(
        (a) =>
          a.master === r.id &&
          a.map === r.map &&
          !a.dead &&
          a.hp / a.maxHP < 0.7 &&
          autoBattleSkill(g, r, cfg, api, "Healing") &&
          autoBattleDistance(r, a) > g.skill(r, "Healing").d.Range,
      );
  const ranged =
    r.job === "Warrior"
      ? 1
      : Math.max(
          1,
          ...AUTO_BATTLE_DAMAGE.map(
            (s) => autoBattleSkill(g, r, cfg, api, s)?.d.Range || 0,
          ),
        );
  // Approach to one tile if already in nominal range but no usable cast exists (e.g. a wall).
  const range = goal && autoBattleDistance(r, goal) <= ranged ? 1 : ranged;
  const routeGoal = hurtPet || goal;
  let dir = routeGoal
    ? autoBattleRoute(
        g,
        r,
        api,
        routeGoal,
        hurtPet ? g.skill(r, "Healing").d.Range : range,
        state,
      )
    : -1;
  if (routeGoal && dir < 0) state.routeAt = g.time + 1000;
  const exploring = dir < 0;
  if (exploring) dir = autoBattleRoute(g, r, api, null, 0, state, true);
  const stopRange = hurtPet ? g.skill(r, "Healing").d.Range : range;
  if (
    !autoBattleMove(
      g,
      r,
      api,
      exploring ? null : routeGoal,
      stopRange,
      state,
      exploring,
      dir,
    )
  )
    state.routeAt = g.time + 1000;
}
function installAutoBattle(Game, api) {
  const tick = Game.prototype.tick,
    command = Game.prototype.command;
  Game.prototype.tick = function (ms) {
    tick.call(this, ms);
    if (this.me) autoBattleTick(this, this.me, api);
  };
  Game.prototype.command = function (type, data = {}) {
    const r = this.me;
    if (r && type === "SetAssist") {
      const cfg = autoBattleSettings(
        data.autoBattle ?? r.assist?.autoBattle,
        this.defs.values(),
      );
      command.call(this, type, {
        ...data,
        ...(cfg.enabled
          ? {
              autoMagic: false,
              autoShield: false,
              flamingSword: false,
              blazingSword: false,
            }
          : {}),
      });
      r.assist.autoBattle = cfg;
      autoBattleStates.delete(r);
      autoBattleStates.set(r, {
        map: r.map,
        pauseUntil: 0,
        lootAt: 0,
        routeAt: 0,
        visited: new Map(),
        rejectedLoot: new Map(),
      });
      return;
    }
    if (
      r &&
      [
        "Walk",
        "Run",
        "Attack",
        "Magic",
        "SpellToggle",
        "MapTeleport",
        "CallNPC",
        "PickUp",
        "PetControl",
        "ToggleMount",
      ].includes(type)
    ) {
      const state = autoBattleStates.get(r);
      if (state) state.pauseUntil = this.time + 1500;
    }
    return command.call(this, type, data);
  };
}

function autoBattleWarrior({ g, r, cfg, api, enemies }) {
  const buffs = autoBattleBuffCandidates(g, r, cfg, api, [
    "BloodDragon",
    "DiamondBody",
    "ProtectionField",
    "Rage",
  ]);
  const candidates = [...buffs];
  for (const target of enemies.filter((a) => autoBattleDistance(r, a) <= 1)) {
    if (g.time < r.attackAt) break;
    for (const spell of [
      "FlamingSword",
      "BlazingSword",
      "HalfMoon",
      "WhirlwindSlash",
      "Thrusting",
    ]) {
      const sk = autoBattleSkill(g, r, cfg, api, spell);
      if (!sk) continue;
      const dir = autoBattleVectors.findIndex(
        ([x, y]) =>
          x === Math.sign(target.x - r.x) && y === Math.sign(target.y - r.y),
      );
      const raw = ((r.stats.MinDC || 0) + (r.stats.MaxDC || 0)) / 2;
      const coefficient = sk.d.DreamSkill ? api.coefficient(sk.d, sk.level) : 1;
      // The primary hit is already available as a free basic attack.
      let benefit = Math.max(
        0,
        autoBattleUsefulDamage(
          target,
          raw * (spell.includes("Sword") ? coefficient : 1),
          "AC",
          { g, r, api, sk },
        ) - autoBattleUsefulDamage(target, raw, "AC"),
      );
      for (const other of enemies.filter((a) => a !== target)) {
        const d = autoBattleDistance(r, other),
          od = autoBattleVectors.findIndex(
            ([x, y]) =>
              x === Math.sign(other.x - r.x) && y === Math.sign(other.y - r.y),
          );
        if (
          (spell === "WhirlwindSlash" && d === 1) ||
          (spell === "HalfMoon" &&
            d === 1 &&
            [7, 0, 1, 2, 3].includes((od - dir + 8) % 8)) ||
          (spell === "Thrusting" && d === 2 && od === dir) ||
          (spell === "BlazingSword" && d >= 2 && d <= 5 && od === dir)
        )
          benefit += autoBattleUsefulDamage(
            other,
            raw *
              coefficient *
              (spell === "BlazingSword" ? 1 - (d - 1) * 0.1 : 1),
            spell === "BlazingSword" ? "AC" : "ACNoArmor",
            { g, r, api, sk },
          );
      }
      candidates.push(
        autoBattleCandidate(sk, target, benefit, 6, api, r, "melee"),
      );
    }
  }
  return autoBattleBest(candidates);
}

function autoBattleWizard({ g, r, cfg, api, enemies }) {
  return autoBattleBest([
    ...autoBattleBuffCandidates(g, r, cfg, api, ["MagicShield"]),
    ...autoBattleBuffCandidates(g, r, cfg, api, ["Abyss", "MagicBooster"], 5),
    ...autoBattleDamageCandidates(
      g,
      r,
      cfg,
      api,
      enemies,
      AUTO_BATTLE_SKILLS.Wizard,
    ),
  ]);
}

function autoBattleTaoist({ g, r, cfg, api, enemies }) {
  const candidates = autoBattleBuffCandidates(g, r, cfg, api, [
    "BlessedArmour",
    "SoulShield",
  ]);
  const pets = Object.values(g.maps)
    .flatMap((m) => m.actors)
    .filter((a) => a.master === r.id && a.friendly && !a.dead);
  const injured = pets.filter(
    (a) =>
      a.map === r.map &&
      a.maxHP > 0 &&
      a.hp / a.maxHP < 0.7 &&
      (a.hp +
        (a.nativeHealing || []).reduce((sum, row) => sum + row.remaining, 0)) /
        a.maxHP <
        0.7,
  );
  for (const spell of ["Healing", "MassHealing"]) {
    const sk = autoBattleSkill(g, r, cfg, api, spell);
    if (!sk) continue;
    for (const pet of injured) {
      if (
        autoBattleDistance(r, pet) > sk.d.Range ||
        autoBattlePending(g, r, pet, "Healing") ||
        autoBattlePending(g, r, pet, "MassHealing")
      )
        continue;
      const targets =
        spell === "Healing"
          ? [pet]
          : injured.filter((a) => autoBattleDistance(a, pet) <= 1);
      const amount = autoBattlePower(r, sk, api, "SC");
      const benefit = targets.reduce(
        (n, a) => n + Math.min(a.maxHP - a.hp, amount),
        0,
      );
      candidates.push(autoBattleCandidate(sk, pet, benefit, 1, api, r));
    }
  }
  // The existing game permits one kind per summon family. Choose once per family
  // to avoid repeatedly replacing different pets with each other.
  for (const family of [
    ["SummonSkeleton", "SummonSpiritServant"],
    ["SummonMoonSpirit", "SummonTiger", "AdvancedSummon", "SummonShinsu"],
  ]) {
    const chosen = family.find((spell) => {
      const sk = g.skill(r, spell);
      return (
        autoBattleBound(sk) &&
        !sk.d.DreamSkill?.passive &&
        !g.rules.adaptations.disabledSpells?.[spell] &&
        (cfg.skills === null || cfg.skills.includes(spell))
      );
    });
    if (!chosen) continue;
    const sk = autoBattleSkill(g, r, cfg, api, chosen);
    if (!sk) continue;
    const id =
      chosen === "SummonTiger" && sk.s.Level >= 4 ? 116 : api.summonIds[chosen];
    const def = g.rules.monsters.find((m) =>
      chosen === "SummonSpiritServant"
        ? m.Index === g.rules.adaptations.noviceProgression?.spiritMonster
        : m.DreamOriginalId === id,
    );
    const stage =
      chosen === "SummonTiger" && sk.s.Level >= 4
        ? sk.s.Level - 3
        : Math.min(3, sk.s.Level);
    const expected = chosen === "SummonSpiritServant" ? 1 : stage >= 3 ? 2 : 1;
    const alive = def
      ? pets.filter((a) => a.definition === def.Index).length
      : expected;
    if (
      alive < expected &&
      g.freeNear(r.map, r, 3) &&
      !autoBattlePending(g, r, r, chosen)
    )
      candidates.push(autoBattleCandidate(sk, r, expected - alive, 2, api, r));
  }
  candidates.push(
    ...autoBattleBuffCandidates(g, r, cfg, api, ["Hiding"], 3),
    ...autoBattleBuffCandidates(g, r, cfg, api, ["InnateQi"], 5),
  );
  for (const spell of ["Poisoning", "GhostBurn"]) {
    const sk = autoBattleSkill(g, r, cfg, api, spell);
    if (!sk) continue;
    for (const target of enemies) {
      const profile = api.profile(g, target);
      const remaining = (percent) =>
        1 - Math.max(0, Math.min(100, percent || 0)) / 100;
      const chance = remaining(
        profile?.statusAvoidPercent?.[spell === "Poisoning" ? "Green" : spell],
      );
      const poisonFactor =
        remaining(target.stats.PoisonDodgePercent) *
        remaining(target.stats.PoisonRecoveryPercent);
      if (
        autoBattleDistance(r, target) > sk.d.Range ||
        autoBattleHasBuff(g, target, spell === "Poisoning" ? "Green" : spell) ||
        autoBattlePending(g, r, target, spell) ||
        !chance ||
        (spell === "Poisoning" && (profile?.poisonImmune || !poisonFactor))
      )
        continue;
      const benefit =
        spell === "Poisoning"
          ? Math.min(
              target.hp,
              api.poison(sk.level, r.stats) *
                (20 +
                  7 * sk.level +
                  ((r.stats.MinSC || 0) + (r.stats.MaxSC || 0))) *
                poisonFactor *
                chance,
            )
          : Math.max(
              1,
              ((((target.stats.MinDC || 0) + (target.stats.MaxDC || 0)) / 2) *
                (3 + 2 * sk.level)) /
                100,
            ) * chance;
      candidates.push(autoBattleCandidate(sk, target, benefit, 4, api, r));
    }
  }
  const beast = autoBattleSkill(g, r, cfg, api, "BeastArmour");
  if (
    beast &&
    pets.some(
      (a) =>
        g.monsters.get(a.definition)?.DreamOriginalId === 62 &&
        !a.special?.nativeBeastArmourRank,
    )
  )
    candidates.push(autoBattleCandidate(beast, r, 1, 5, api, r));
  candidates.push(
    ...autoBattleDamageCandidates(g, r, cfg, api, enemies, [
      "SoulFireBall",
      "PoisonCloud",
    ]),
  );
  return autoBattleBest(candidates);
}

installAutoBattle(Ge, {
  cast: wt,
  toggle: Yt,
  cost: le,
  damage: magicDamage,
  coefficient: dreamCoefficient,
  poison: poisoningDamage,
  outgoing: ao,
  dirs: F,
  reach: canReachDreamSpell,
  portals: Ui,
  summonIds: js,
  sight: We,
  hydraStats,
  visible: St,
  qualityPoints: ke,
  profile: $,
  pending: (r) => Le.has(r) || tt.has(r),
});


for (let e = 0; e < Ht.length; e++)
  ((he[23 + e] = "SkillLevel:" + Ht[e]), (he[46 + e] = "SkillDamage:" + Ht[e]));
function Ar(e, t) {
  const a = {};
  for (const i of e.affixes || []) {
    if (!i.revealed || (t && an[i.group] && an[i.group] !== t)) continue;
    if (i.type === 1009) {
      for (const s of ["StoneRecoveryPercent", "FreezeRecoveryPercent"]) a[s] = (a[s] || 0) + i.low;
      continue;
    }
    const n = he[i.type];
    n && !n.startsWith("SkillDamage:") && (a[n] = (a[n] || 0) + i.low);
  }
  return a;
}
((he[1033] = "SkillLevel:Hydra"),
  (he[1001] = "CastSpeed"),
  (he[1002] = "KillXP"),
  Object.assign(he, {
    1003: "NativeMoveSpeed",
    1004: "DreamCritPercent",
    1005: "DreamCritDamagePercent",
    1006: "HPRatePercent",
    1007: "NativePhysicalAbsorbPercent",
    1008: "NativeMagicAbsorbPercent",
    1010: "AffixDamagePercent",
  }));
var an = {
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
Object.assign(he, {
  1020: "AffixLifeOnHit",
  1021: "AffixLifeDrainPercent",
  1023: "AffixManaOnHit",
  1024: "AffixManaDrainPercent",
  1026: "AffixPoisonDamage",
  1027: "AffixSummonDamage",
});
var nn = new Set([
  1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009, 1010, 1020, 1021, 1022, 1023, 1024, 1025,
  1026, 1027, 1028, 1029, 1030, 1031, 1032, 1033,
]);
function st(e, t) {
  if (["Warrior", "Wizard", "Taoist"].includes(e.RequiredClass)) return e.RequiredClass === t;
  const a = e.Stats.MaxDC || 0,
    i = e.Stats.MaxMC || 0,
    n = e.Stats.MaxSC || 0;
  return a === i && i === n
    ? !0
    : Number(e.DreamType) === 9
      ? i || n
        ? t === "Wizard"
          ? i >= n
          : t === "Taoist" && n >= i
        : t === "Warrior"
      : t === "Warrior"
        ? a >= Math.max(i, n)
        : t === "Wizard"
          ? i >= Math.max(a, n)
          : n >= Math.max(a, i);
}
function sn(e, t, a) {
  for (const i of e.affixes || []) {
    i.revealed = !0;
    const n = a?.[String(i.group)],
      s = n?.LegacyRanges?.[i.tier],
      o = n?.Affixes[i.tier];
    n &&
      s &&
      o &&
      i.type === n.Type &&
      i.low === s.low &&
      i.high === s.high &&
      ((i.low = o.LowValue),
      (i.high = o.HighValue),
      (i.text = n.Format.replaceAll("{val}", String(i.low))
        .replaceAll("{vallow}", String(i.low))
        .replaceAll("{valhigh}", String(i.high))
        .replaceAll("{dura}", String(i.duration))
        .replaceAll("%%", "%")));
  }
  if (!(e.specialVersion === 1 || t.DreamOriginalId === void 0)) {
    for (const [i, n, s, o] of [
      ["KillXP", 1002, 1002, "\u51FB\u6740\u989D\u5916\u7ECF\u9A8C"],
      ["MagicFind", 32, 40, "\u6781\u54C1\u6389\u843D"],
    ]) {
      const r = e.added[i];
      r > 0 &&
        ((e.affixes ??= []),
        e.affixes.push({
          group: n,
          tier: "legacy",
          name: "\u4F20\u627F",
          type: s,
          low: r,
          high: r,
          rate: 100,
          duration: 0,
          revealed: !0,
          text: o + " +" + r,
        }),
        delete e.added[i]);
    }
    e.specialVersion = 1;
  }
}
function weighted3(e, t) {
  let a = t.next(e.reduce((i, n) => i + n.Weight, 0));
  for (const i of e) {
    if (a < i.Weight) return i;
    a -= i.Weight;
  }
  return e[e.length - 1];
}
function Cr(e, t) {
  const a = Object.entries(e.Affixes)
    .filter(([, s]) => s.Grade <= t && s.Weight > 0)
    .map(([s, o]) => ({
      ...o,
      tier: s,
    }));
  if (e.Progressive) {
    const s = Math.max(0, ...a.map((o) => o.Grade));
    return a.filter((o) => o.Grade === s);
  }
  if (t < 5) return a;
  const i = Math.max(0, ...a.map((s) => s.Grade)),
    n = Math.min(i, Math.max(t - 2, i - 1));
  return a.filter((s) => s.Grade >= n);
}
function affixCandidates(e, t) {
  const a = effectiveAffixGrade(e),
    i = st(e, "Warrior") && !st(e, "Wizard") && !st(e, "Taoist");
  return Object.values(t)
    .filter(
      (n) =>
        !n.ControlledChannel &&
        n.Weight > 0 &&
        (!n.AuxiliaryOnly || auxiliaryAffixSlot(e)) &&
        (!n.WearableJob || supportsWearableJob(e, n.WearableJob)) &&
        (!n.EquipmentJob || st(e, n.EquipmentJob)) &&
        (!n.ExcludeEquipmentJob || !st(e, n.ExcludeEquipmentJob)) &&
        (n.MaxRequiredLevel === void 0 ||
          (e.RequiredType === "Level" && e.RequiredAmount <= n.MaxRequiredLevel)) &&
        !n.ExcludedNames?.includes(String(e.DreamName || e.Name)) &&
        Object.values(n.Poses).includes(Number(e.AffixPoolType ?? e.DreamType)) &&
        Object.values(n.Affixes).some((s) => s.Weight > 0 && s.Grade <= a),
    )
    .map((n) => {
      const s = !n.GradeOverridesExclusiveWarrior || i;
      return {
        ...n,
        Weight: s ? (n.WeightByEquipmentGrade?.[a] ?? n.Weight) : n.Weight,
        RollChancePercent: s
          ? (n.RollChanceByEquipmentGrade?.[a] ?? n.RollChancePercent)
          : n.RollChancePercent,
      };
    });
}
function cn(e, t, a) {
  if (a <= 0) return 0;
  const i = affixCandidates(e, t),
    n = i.filter((c) => c.Prefix);
  if (!i.some((c) => !c.Prefix && (c.RollChancePercent ?? 100) === 100))
    throw new Error(`No guaranteed suffix in affix pool ${e.Index}`);
  let s = 0;
  const o = (c, l) => {
      if (!l) return 1;
      if (!c.length || l > new Set(c.filter((h) => Pt.has(h.Type)).map((h) => h.Type)).size)
        return 0;
      const u = c.reduce((h, p) => h + p.Weight, 0);
      return c
        .filter((h) => Pt.has(h.Type))
        .reduce(
          (h, p) =>
            h +
            ((0.5 * p.Weight) / u) *
              o(
                c.filter((g) => g.Type !== p.Type),
                l - 1,
              ),
          0,
        );
    },
    r = (c, l, u) => {
      if (c === n.length) {
        s += u * o(l, Math.min(6, a));
        return;
      }
      const h = n[c],
        p = (h.RollChancePercent ?? 100) / 100;
      (p > 0 && r(c + 1, [...l, h], u * p), p < 1 && r(c + 1, l, u * (1 - p)));
    };
  return (r(0, [], 1), 1 - s);
}
function ot(e, t, a, i, n, s) {
  const o = effectiveAffixGrade(t);
  if (!(o > 0) || n <= 0) return;
  const r = affixCandidates(t, i).filter(
    (u) => u.RollChancePercent === void 0 || a.next(100) < u.RollChancePercent,
  );
  e.affixes = [];
  const c = {
      prefix: 0,
      suffix: 0,
    },
    l = Math.min(6, n);
  for (let u = 0; u < l && r.length; u++) {
    let h = c.prefix >= 3 ? !1 : c.suffix >= 3 ? !0 : a.next(2) !== 0;
    if (c[h ? "prefix" : "suffix"] >= 3) break;
    let p = r.filter((m) => m.Prefix === h);
    if (!p.length) {
      if (((h = !h), c[h ? "prefix" : "suffix"] >= 3)) break;
      p = r.filter((m) => m.Prefix === h);
    }
    if (!p.length) break;
    const g = weighted3(p, a),
      y = Cr(g, o);
    if (!y.length) break;
    const f = weighted3(y, a);
    c[g.Prefix ? "prefix" : "suffix"]++;
    const v = g.Range
        ? f.LowValue
        : a.next(f.HighValue + 1, o >= 5 ? Math.ceil((f.LowValue + f.HighValue) / 2) : f.LowValue),
      x = g.Range ? f.HighValue : v;
    e.affixes.push({
      group: g.ID,
      tier: f.tier,
      name: f.Name,
      type: g.Type,
      low: v,
      high: x,
      rate: g.Rate,
      duration: f.Dura,
      revealed: !0,
      text: g.Format.replaceAll("{val}", String(v))
        .replaceAll("{vallow}", String(v))
        .replaceAll("{valhigh}", String(x))
        .replaceAll("{dura}", String(f.Dura))
        .replaceAll("%%", "%"),
    });
    for (let m = r.length - 1; m >= 0; m--) r[m].Type === g.Type && r.splice(m, 1);
  }
  if (
    t.AffixChannelsEnabled === !0 &&
    (s !== void 0 || Object.values(i).some((u) => u.ControlledChannel))
  ) {
    for (const u of [1030, 1031, 1032])
      if (!i[u]?.ControlledChannel) throw new Error(`Missing controlled affix ${u}`);
    Oo(e, t, a, i, s ?? cn(t, i, n));
  }
}
function equippedAffixes(e) {
  return e.equipment.flatMap((t) =>
    t && (!t.maxDura || t.currentDura > 0) ? (t.affixes || []).filter((a) => a.revealed) : [],
  );
}
function affixRoll(e, t) {
  return e.rng.next(t.high + 1, t.low);
}
function Dr(e) {
  const t = equippedAffixes(e).filter((a) => a.type === 11);
  ((e.stats.NativeDefencePercentLow = t.reduce((a, i) => a + i.low, 0)),
    (e.stats.NativeDefencePercentHigh = t.reduce((a, i) => a + i.high, 0)));
}
function affixRangeExtra(e, t, a) {
  return equippedAffixes(t)
    .filter((i) => i.type === a)
    .reduce((i, n) => i + affixRoll(e, n) - n.low, 0);
}
function Ir(e, t, a, i, n, s) {
  if (s === "None") return i;
  const o = t.kind === "player" ? t : t.friendly ? e.roles.find((l) => l.id === t.master) : void 0;
  if (!o) return i;
  if (t.kind !== "player")
    return (
      e.rng.next(100) < (o.stats.PetCritPercent || 0) &&
        (i *= 1.25 + (o.stats.PetCritDamagePercent || 0) / 100),
      o.job === "Taoist" &&
        t.special?.dreamPet &&
        !t.special?.dreamTamed &&
        (i += Math.max(0, o.stats.AffixSummonDamage || 0)),
      Math.floor(i)
    );
  const r = e.rules.skills.find((l) => l.Spell === n),
    c = s.startsWith("AC");
  for (const l of equippedAffixes(o)) {
    if (l.type >= 46 && l.type <= 62 && Ht[l.type - 46] === n) {
      i *= 1 + affixRoll(e, l) / 100;
      continue;
    }
    ![10, 41, 42, 81, 85].includes(l.type) ||
      ([81, 85].includes(l.type) && e.rng.next(100) >= l.rate) ||
      (l.type === 10 && !c) ||
      (l.type === 41 && (c || (r?.DreamOriginalId || 0) >= 56)) ||
      (l.type === 42 && (c || (r?.DreamOriginalId || 0) < 56)) ||
      (l.type === 85 && !a.buffs.some((u) => u.type === "Slow" || u.type === "Frozen")) ||
      (l.type === 81 ? (i += affixRoll(e, l)) : (i *= 1 + affixRoll(e, l) / 100));
  }
  return Math.floor(
    (i * (100 + (o.stats.QualitySetDamagePercent || 0) + (o.stats.AffixDamagePercent || 0))) / 100,
  );
}
function ln(e, t, a, i) {
  for (const n of equippedAffixes(t))
    ((n.type === 79 && i.startsWith("AC")) || (n.type === 80 && i.startsWith("MAC"))) &&
      e.rng.next(100) < n.rate &&
      (a = Math.floor(a * (1 - affixRoll(e, n) / 100)));
  return a;
}
function Hr(e, t, a, i, n, s) {
  if (n === "None" || i <= 0) return;
  if (a.kind === "player") {
    const r = a;
    for (const c of equippedAffixes(r))
      c.type === 13 && (r.mp = Math.min(r.maxMP, r.mp + Math.floor((i * affixRoll(e, c)) / 100)));
  }
  if (t.kind !== "player") return;
  const o = t;
  n.startsWith("AC") &&
    !a.dead &&
    o.stats.NativeParalysisPercent &&
    e.rng.next(100) < o.stats.NativeParalysisPercent &&
    e.buff(a, "Paralysis", 2e3, 0, {}, o.id);
  for (const r of equippedAffixes(o))
    ![9, 20, 84].includes(r.type) ||
      (r.type === 20 && e.rules.adaptations.dreamRuntime) ||
      e.rng.next(100) >= r.rate ||
      (r.type === 20 &&
        n.startsWith("AC") &&
        (o.hp = Math.min(o.maxHP, o.hp + Math.floor((i * affixRoll(e, r)) / 100))),
      r.type === 9 &&
        n.startsWith("AC") &&
        !a.dead &&
        (e.buff(a, "Green", r.duration * 1e3, affixRoll(e, r), {}, o.id),
        e.buff(a, "Red", r.duration * 1e3, 0, {}, o.id)),
      r.type === 84 &&
        s === "FlameDisruptor" &&
        !a.dead &&
        e.buff(
          a,
          "NativeBurn",
          r.duration * 1e3,
          Math.floor((i * affixRoll(e, r)) / 100),
          {},
          o.id,
        ));
}
var dn = new WeakMap();
function Nr(e, t, a) {
  let i = dn.get(t);
  (!i || e.time < i.at || e.time - i.at >= 600) &&
    ((i = {
      at: e.time,
      used: 0,
    }),
    dn.set(t, i));
  const n = Math.max(
    0,
    Math.min(Math.floor(a), 8 + Math.floor(t.maxMP * 0.02) - i.used, t.maxMP - t.mp),
  );
  return ((i.used += n), n);
}
function Rr(e, t, a, i, n) {
  if (
    !e.rules.adaptations.dreamRuntime ||
    t.kind !== "player" ||
    t.dead ||
    a.kind !== "monster" ||
    a.friendly ||
    n === "None" ||
    i <= 0
  )
    return;
  const s = t;
  let o =
    (s.stats.NativeLifeDrainPercent || 0) +
    (s.stats.HPDrainRatePercent || 0) +
    equippedAffixes(s)
      .filter((h) => h.type === 20)
      .reduce((h, p) => h + affixRoll(e, p), 0);
  if ((s.job !== "Warrior" && (o = Math.min(12, o)), P(t, a) > 1)) o = Math.trunc(o / 2);
  else {
    const h = U[t.dir];
    (!h || a.x !== t.x + h[0] || a.y !== t.y + h[1]) && (o = 0);
  }
  const r = s.job === "Warrior" && n.startsWith("AC"),
    c = r ? Math.max(0, s.stats.AffixLifeOnHit || 0) : 0,
    l = r ? Math.max(0, s.stats.AffixLifeDrainPercent || 0) : 0,
    u = c + Math.floor((i * Math.max(0, o + l)) / 100);
  s.hp = Math.min(s.maxHP, s.hp + u);
}


function affixManaOnHit(e, t, a, i, n) {
  if (
    !e.rules.adaptations.dreamRuntime ||
    t.kind !== "player" ||
    t.dead ||
    a.kind !== "monster" ||
    a.friendly ||
    n === "None" ||
    i <= 0
  )
    return;
  const s = t;
  if (s.job !== "Wizard") return;
  const o = Math.min(8, s.stats.AffixManaOnHit || 0),
    r = Math.min(4, s.stats.AffixManaDrainPercent || 0);
  s.mp += Nr(e, s, Math.min(i, o + Math.floor((i * r) / 100)));
}
function Tr(e, t) {
  for (const a of equippedAffixes(t))
    a.type === 14 && (t.mp = Math.min(t.maxMP, t.mp + affixRoll(e, a)));
}
function Or(e, t) {
  const a = {};
  for (const [i, n] of Object.entries(e.potential?.stats || {}))
    if (i === "\u653B\u51FB\u589E\u5F3A")
      for (const s of ["MinDC", "MaxDC", "MinMC", "MaxMC", "MinSC", "MaxSC"])
        a[s] = Math.floor(((t.Stats[s] || 0) * n) / 100);
    else if (i === "\u9632\u5FA1\u589E\u5F3A")
      for (const s of ["MinAC", "MaxAC", "MinMAC", "MaxMAC"])
        a[s] = Math.floor(((t.Stats[s] || 0) * n) / 100);
    else {
      const s = {
        暴击概率: "DreamCritPercent",
        暴击上限: "DreamCritDamagePercent",
        吸收生命: "HPDrainRatePercent",
        攻击速度: "AttackSpeed",
        防后仰: "NoFlinchPercent",
        麻痹概率: "NativeParalysisPercent",
        中毒恢复: "PoisonRecoveryPercent",
        石化恢复: "StoneRecoveryPercent",
      };
      s[i] && (a[s[i]] = (a[s[i]] || 0) + n);
    }
  return a;
}
function qr(e, t) {
  let a = 0;
  for (let i = 1; i <= 6 && !(t.next(10 * i) + 1 > e); i++) (a++, (e -= 10));
  return a;
}
function fn(e, t) {
  let a = 0;
  for (; e > 0 && a < 6 && !(e < 20 && t.next(20) + 1 > e); ) (a++, (e = Math.floor(e / 2)));
  return a;
}
var isHell = (e) => e.adaptations.dreamRuntime?.mode === "hell";
function Er(e, t, a, i, n = 0, s = 0, o = 0) {
  let r = e * (t > 70 ? 1 : 2);
  const c = t - a;
  if (c > 15 && !i) {
    let l = 2 * c - 30;
    (l >= 100 && (l = 95), (r = Math.trunc((r * (100 - l)) / 100)));
  }
  return (
    (r = Math.trunc(
      Math.fround(Math.fround(r) * Math.fround(1 + Math.fround(Math.min(65535, n) / 100))),
    )),
    (r = Math.trunc(
      Math.fround(Math.fround(r) + Math.fround(Math.fround(e) * Math.fround(s / 100))),
    )),
    r + Math.trunc(e / 100) * o
  );
}
function hellXP(e, t, a, i, n) {
  const s = e.adaptations.dreamRuntime.hell;
  return Er(
    Number(a.special?.trialXP ?? i.Experience),
    t.level,
    i.Level,
    a.spawn !== void 0
      ? !!e.world.maps.find((o) => o.id === a.map)?.spawns[a.spawn]?.native?.boss
      : i.IsBoss,
    Number(a.special?.expAdd || 0),
    n,
    s.sceneExperiencePercent[String(a.map)] || 0,
  );
}
var hellAffixParameter2 = (e) => Math.min(65535, Math.max(0, Number(e.special?.affixDrop || 0))),
  hellMagicBase2 = (e, t = 3) => ((e & 255) === 1 ? 11 : (e & 255) === 2 ? 21 : t),
  hellAffixBudget = (e, t, a) =>
    a?.adaptations.dreamRuntime?.hell?.affixChanceByCount ? 0 : qr(hellAffixParameter2(e), t);
function jr(e, t) {
  const a = t.adaptations.dreamRuntime?.hell,
    i = a?.affixChanceByCount;
  if (!i) return;
  const n = e.monsterAffixes?.length ?? (hellAffixParameter2(e) > 0 ? 1 : 0);
  return Math.max(0, Math.min(30, i[Math.min(4, n)] ?? a.ordinaryAffixChancePercent ?? 1));
}
function $r(e, t) {
  return t.adaptations.dreamRuntime?.hell?.affixChanceByCount
    ? 0
    : Number(e.special?.magicAdd || 0) +
        hellMagicBase2(hellAffixParameter2(e), t.adaptations.dreamRuntime?.defaultMagicFind) -
        (t.adaptations.dreamRuntime?.defaultMagicFind ?? 3);
}
function Gr(e, t, a, i, n, s) {
  const o = n.adaptations.dreamRuntime;
  if (!(Number(t.DreamGrade) > 0) || !o?.affixes) return s;
  const r = jr(a, n);
  if (r !== void 0) {
    if (i.next(1e4) < r * 100) {
      const l = a.monsterAffixes?.length ?? (hellAffixParameter2(a) > 0 ? 1 : 0);
      ot(e, t, i, o.affixes, l ? Math.max(1, fn(hellAffixParameter2(a), i)) : 1);
    }
    return s;
  }
  if (hellAffixParameter2(a) === 0) {
    const l = o.hell?.ordinaryAffixChancePercent || 0;
    return (l > 0 && i.next(1e4) < l * 100 && ot(e, t, i, o.affixes, 1), s);
  }
  if (s < 1) return s;
  const c = fn(hellAffixParameter2(a), i);
  return c ? (ot(e, t, i, o.affixes, c), e.affixes?.length ? s - 1 : s) : s;
}
var hellPetCap = (e) => (e <= 1 ? 3 : e === 2 ? 5 : e === 3 ? 7 : e + 3);
function zr(e) {
  const t = e.special,
    a = Number(t.petLevel || 0),
    i = Number(t.maxPetLevel || 0);
  return a >= i
    ? !1
    : ((t.petXP = Number(t.petXP || 0) + 1),
      Number(t.petXP) >= Math.max(1, a * 10) ? ((t.petXP = 0), (t.petLevel = a + 1), !0) : !1);
}
function hellMixChance(e) {
  const t = Math.max(...e);
  return Math.min(1, t === 0 ? e.length / 4 : e.reduce((a, i) => a + i, 0) / (7 * t - 3)) * 100;
}
var rt = 80,
  sharedStorageGame = (e) => (isHell(e) ? "classic-hell" : "maomao"),
  ce = (e) => isHell(e) || e.adaptations.sharedStorage?.enabled === !0;
function mn(e, t, a) {
  return !ce(a) ||
    !t ||
    e.bound ||
    e.noSharedStorage ||
    [
      a.adaptations.blessingTalisman?.itemId,
      a.adaptations.starterTalisman?.itemId,
      a.adaptations.testTalisman?.itemId,
      a.adaptations.combatTestTalisman?.itemId,
    ].includes(t.Index) ||
    /(?:^|,\s*)(?:DontTrade|DontStore)(?:,|$)/i.test(t.Bind || "")
    ? !1
    : !!itemSlots(t)?.length ||
        (t.Type === "Book" &&
          !!t.Spell &&
          t.Spell !== "None" &&
          a.skills.some((i) => i.Spell === t.Spell));
}
function pn(e, t) {
  return (ce(t) && (e.noSharedStorage = !0), e);
}
function Y(e, t) {
  const a = structuredClone(e.roles);
  for (const i of a) {
    $t(i, t);
    const n = Ye(i, t);
    (i.sunPotionAt !== void 0 && (i.sunPotionAt = sunPotionRemaining(i, e.time)),
      i.itemCooldowns &&
        (i.itemCooldowns = {
          snow: Math.max(0, Math.min(kt, (i.itemCooldowns.snow || 0) - e.time)),
        }),
      Ct(i),
      Object.assign(i, {
        homeTown: n.id,
        map: n.map,
        x: n.at[0],
        y: n.at[1],
        target: 0,
        dead: !1,
        hp: Math.max(1, i.hp),
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
      }),
      delete i.nativeHealing,
      delete i.nativeRecovery);
    for (const o of [
      "flamingSword",
      "blazingSword",
      "slaying",
      "counterAttack",
      "twinDrakeBlade",
      "channel",
    ])
      i.attackModes[o] = !1;
    (delete i.treasureRun, delete i.challengeRun, delete i.trialRun, delete i.mountUid);
    const s = i.special?.unlockCurse;
    (delete i.special,
      s &&
        (i.special = {
          unlockCurse: !0,
        }));
    for (const o of i.skills) o.CastTime = 0;
    for (const o of Object.values(i.buyback || {})) for (const r of o) r.buybackAt = 0;
  }
  return {
    ...(e.gameId
      ? {
          gameId: e.gameId,
        }
      : {}),
    ...(ce(t)
      ? {
          sharedStorageGame: sharedStorageGame(t),
          sharedStorageVersion: 1,
          sharedStorage: structuredClone(e.sharedStorage ?? Array(80).fill(null)),
        }
      : {}),
    version: 1,
    storageMode: "character-only",
    worldVersion: e.worldVersion,
    rulesVersion: e.rulesVersion,
    dreamRuntimeVersion: e.dreamRuntimeVersion,
    time: 0,
    nextId: e.nextId,
    rng: structuredClone(e.rng),
    roles: a,
    maps: {},
    events: [],
    nextOrder: 0,
    lastSaved: e.lastSaved,
    ...(e.sync
      ? {
          sync: structuredClone(e.sync),
        }
      : {}),
  };
}
function ne(e, t) {
  if (!e || typeof e != "object") throw new b(message("storage.invalidFormat"));
  if (isHell(t) ? e.gameId !== "classic-hell" : e.gameId === "classic-hell")
    throw new Error("\u6B64\u5B58\u6863\u4E0D\u5C5E\u4E8E\u5F53\u524D\u6E38\u620F\u3002");
  const a = e.worldVersion;
  if (a !== void 0 && (!Number.isSafeInteger(a) || a < 1))
    throw new b(message("storage.worldVersion"));
  const i = e.dreamRuntimeVersion;
  if (
    i !== void 0 &&
    (!Number.isSafeInteger(i) || i < 1 || i > (t.adaptations.dreamRuntime?.version ?? 0))
  )
    throw new b(message("storage.dreamVersion"));
  const n = Ti(Vi(e, t), t);
  if (n.sync) {
    const f = n.sync,
      v = (m) => !!m && typeof m == "object" && !Array.isArray(m),
      x = (m) => m === null || (typeof m == "string" && Number.isFinite(Date.parse(m)));
    if (
      f.protocol !== 2 ||
      f.projectionVersion !== 2 ||
      (f.ownerId !== null &&
        (typeof f.ownerId != "string" || !f.ownerId.length || f.ownerId.length > 200)) ||
      typeof f.deviceId != "string" ||
      f.deviceId.length > 200 ||
      typeof f.deviceName != "string" ||
      f.deviceName.length > 100 ||
      !(f.baseRevision === null || (Number.isSafeInteger(f.baseRevision) && f.baseRevision >= 0)) ||
      !v(f.baseRoles) ||
      !Object.values(f.baseRoles).every((m) => typeof m == "string") ||
      !v(f.tombstones) ||
      !Object.values(f.tombstones).every(
        (m) => v(m) && (m.deletedAt === void 0 || x(m.deletedAt)),
      ) ||
      !Number.isSafeInteger(f.progressSeq) ||
      f.progressSeq < 0 ||
      !x(f.lastProgressAt) ||
      !x(f.checkpointWrittenAt) ||
      !(
        f.serverConfirmedAt === null ||
        (Number.isSafeInteger(f.serverConfirmedAt) && f.serverConfirmedAt >= 0)
      )
    )
      throw new b(message("storage.invalidFormat"));
  }
  if (
    n.worldVersion !== void 0 &&
    (!Number.isInteger(n.worldVersion) ||
      n.worldVersion > (t.adaptations.mainline?.worldVersion ?? 1))
  )
    throw new b(message("storage.worldVersion"));
  if (n.version !== 1 || n.rulesVersion !== t.version) throw new b(message("storage.version"));
  if (
    !Array.isArray(n.roles) ||
    n.roles.length > 6 ||
    !n.maps ||
    !Array.isArray(n.events) ||
    !n.rng ||
    n.rng.seed?.length !== 56
  )
    throw new b(message("storage.structure"));
  const s = (f, v = 0, x = Number.MAX_SAFE_INTEGER) => Number.isSafeInteger(f) && f >= v && f <= x;
  if (
    !s(n.time) ||
    !s(n.nextId) ||
    !s(n.nextOrder) ||
    !s(n.rng.i, 0, 55) ||
    !s(n.rng.j, 0, 55) ||
    !n.rng.seed.every((f) => s(f, 0, 2147483647))
  )
    throw new b(message("storage.clock"));
  const o = new Set(),
    r = new Set(),
    c = new Map(t.items.map((f) => [f.Index, f])),
    l = new Set(t.world.maps.map((f) => f.id)),
    u = (f) =>
      !!f && typeof f == "object" && !Array.isArray(f) && Object.values(f).every(Number.isFinite),
    h = (f) =>
      !!f && typeof f.name == "string" && f.name.length <= 100 && u(f.stats) && s(f.rolls, 1, 5),
    p = (f) => {
      if (
        (f.gemCount !== void 0 && !s(f.gemCount, 0, 65535)) ||
        (f.buybackAt !== void 0 && !s(f.buybackAt)) ||
        !c.has(f.id) ||
        !s(f.uid) ||
        o.has(f.uid) ||
        !s(f.count, 1, 65535) ||
        !s(f.currentDura) ||
        !s(f.maxDura) ||
        f.currentDura > f.maxDura ||
        !u(f.added) ||
        (f.weaponGrowth !== void 0 &&
          (!s(f.weaponGrowth.level, 0, 30) || !s(f.weaponGrowth.xp, 0, 31e5))) ||
        (f.potential !== void 0 && !h(f.potential)) ||
        (f.potentialOptions !== void 0 &&
          (!Array.isArray(f.potentialOptions) ||
            f.potentialOptions.length > 5 ||
            !f.potentialOptions.every(h))) ||
        (f.handmade !== void 0 && typeof f.handmade != "boolean") ||
        (f.locked !== void 0 && typeof f.locked != "boolean") ||
        (f.bound !== void 0 && typeof f.bound != "boolean") ||
        (f.noSharedStorage !== void 0 && typeof f.noSharedStorage != "boolean") ||
        (f.chestReward !== void 0 &&
          (!f.chestReward ||
            !s(f.chestReward.item, 1) ||
            !s(f.chestReward.points, 0, 8) ||
            !t.adaptations.chestItems?.chests[String(f.id)]?.items[String(f.chestReward.item)] ||
            !Object.hasOwn(
              t.adaptations.chestItems.chests[String(f.id)].points,
              String(f.chestReward.points),
            ) ||
            f.count !== 1)) ||
        (f.materialQuality !== void 0 && !s(f.materialQuality, 1, 1e4)) ||
        (f.specialVersion !== void 0 && f.specialVersion !== 1) ||
        (f.affixes !== void 0 &&
          (!Array.isArray(f.affixes) ||
            f.affixes.length > 8 ||
            f.affixes.some(
              (v) =>
                !v ||
                !(s(v.group, 1, 79) || nn.has(v.group)) ||
                !(s(v.type, 9, 85) || nn.has(v.type)) ||
                !s(v.low) ||
                !s(v.high, v.low, 1e4) ||
                !s(v.rate, 0, 100) ||
                typeof v.revealed != "boolean" ||
                typeof v.text != "string" ||
                v.text.length > 500,
            )))
      )
        throw new b(message("storage.items"));
      ((f.locked === !1 || (f.locked === !0 && !equipmentLockable(f, c.get(f.id)))) &&
        delete f.locked,
        f.weaponGrowth &&
          f.weaponGrowth.level >= pe.cap &&
          (f.weaponGrowth = {
            level: pe.cap,
            xp: 0,
          }),
        sn(
          f,
          t.items.find((v) => v.Index === f.id),
          t.adaptations.dreamRuntime?.affixes,
        ),
        Li(f, t),
        o.add(f.uid));
    },
    g = (f) => {
      if (
        !s(f.id) ||
        o.has(f.id) ||
        !l.has(f.map) ||
        !s(f.x) ||
        !s(f.y) ||
        !s(f.dir, 0, 7) ||
        !Number.isFinite(f.hp) ||
        !Number.isFinite(f.maxHP) ||
        !u(f.stats) ||
        !Array.isArray(f.buffs) ||
        ![f.actionAt, f.moveAt, f.attackAt].every((v) => s(v))
      )
        throw new b(message("storage.actor"));
      o.add(f.id);
      for (const v of f.buffs)
        if (
          (v.spell !== void 0 && typeof v.spell != "string") ||
          typeof v.type != "string" ||
          !s(v.until) ||
          !s(v.next) ||
          !Number.isFinite(v.value) ||
          !u(v.stats) ||
          !s(v.source)
        )
          throw new b(message("storage.buffs"));
    };
  for (const f of n.roles) {
    if (
      f.cloudId !== void 0 &&
      (typeof f.cloudId != "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(f.cloudId))
    )
      throw new b(message("storage.role"));
    if (f.cloudId) {
      if (r.has(f.cloudId) || Object.hasOwn(n.sync?.tombstones ?? {}, f.cloudId))
        throw new b(message("storage.role"));
      r.add(f.cloudId);
    }
    if (
      (f.sunPotionAt !== void 0 && !s(f.sunPotionAt)) ||
      (f.itemCooldowns !== void 0 &&
        (!f.itemCooldowns ||
          Array.isArray(f.itemCooldowns) ||
          typeof f.itemCooldowns != "object" ||
          Object.entries(f.itemCooldowns).some(
            ([x, m]) => x !== "snow" || !s(m, 0, Math.min(Number.MAX_SAFE_INTEGER, n.time + kt)),
          ))) ||
      (f.mountUid !== void 0 && !s(f.mountUid)) ||
      (f.claimedBlessing !== void 0 && typeof f.claimedBlessing != "boolean") ||
      (f.unlockedWaypoints !== void 0 &&
        (!Array.isArray(f.unlockedWaypoints) ||
          new Set(f.unlockedWaypoints).size !== f.unlockedWaypoints.length ||
          f.unlockedWaypoints.some(
            (x) => !t.adaptations.towns?.waypoints?.some((m) => m.id === x),
          ))) ||
      (f.homeTown !== void 0 &&
        !t.adaptations.towns?.settlements.some((x) => x.id === f.homeTown)) ||
      (f.claimedMount !== void 0 && typeof f.claimedMount != "boolean") ||
      (f.bagLayoutVersion !== void 0 && f.bagLayoutVersion !== 1) ||
      (f.storagePages !== void 0 && !s(f.storagePages, 1, 3)) ||
      (f.bagExpansionRows !== void 0 &&
        !s(f.bagExpansionRows, 0, t.adaptations.bagExpansion.maxRows)) ||
      (f.claimedStarterTalisman !== void 0 && typeof f.claimedStarterTalisman != "boolean") ||
      (f.firstScarecrowReward !== void 0 && typeof f.firstScarecrowReward != "boolean") ||
      !s(f.id) ||
      o.has(f.id) ||
      !l.has(f.map) ||
      !["Warrior", "Wizard", "Taoist"].includes(f.job) ||
      !s(f.level, 1, 65535) ||
      !s(f.gold) ||
      !s(f.xp) ||
      !Number.isFinite(f.hp) ||
      !Number.isFinite(f.mp)
    )
      throw new b(message("storage.role"));
    if (
      f.noviceBooks !== void 0 &&
      (!Array.isArray(f.noviceBooks) ||
        f.noviceBooks.length > 6 ||
        new Set(f.noviceBooks).size !== f.noviceBooks.length ||
        f.noviceBooks.some(
          (x) =>
            ![
              "Fencing",
              "FireBall",
              "SummonSpiritServant",
              "HeavyStrike",
              "GreatFireBall",
              "SoulFireBall",
            ].includes(x),
        ))
    )
      throw new b(message("storage.role"));
    if (f.spiritProgress !== void 0) {
      const x = f.spiritProgress,
        m = t.adaptations.noviceProgression?.spiritGrowth;
      if (
        !x ||
        !m ||
        ![void 0, 1, 2, 3, 4].includes(x.curveVersion) ||
        !s(x.level, 0, x.curveVersion === 4 ? 65535 : m.cap) ||
        !s(
          x.xp,
          0,
          x.curveVersion !== 4 && x.level === m.cap
            ? 0
            : (x.curveVersion === 4
                ? 100
                : x.curveVersion === 3
                  ? (m.thresholds?.[x.level] ?? (x.level + 1) * m.experienceStep)
                : x.curveVersion === 2
                  ? [2e3, 8e3, 2e4, 6e4, 1e5, 16e4, 21e4][x.level]
                  : (x.level + 1) * m.experienceStep) - 1,
        )
      )
        throw new b(message("storage.role"));
      zt(f, m);
    }
    if (
      (g(f),
      f.assist &&
        (["autoMagic", "autoShield"].some(
          (x) => f.assist[x] !== void 0 && typeof f.assist[x] != "boolean",
        ) ||
          (f.assist.autoMagicSpell !== void 0 &&
            !["auto", "FireBall", "GreatFireBall", "ThunderBolt", "FlameDisruptor"].includes(
              f.assist.autoMagicSpell,
            ))))
    )
      throw new b(message("storage.assist"));
    if (
      f.assist &&
      (["hpEnabled", "mpEnabled", "flamingSword"].some((x) => typeof f.assist[x] != "boolean") ||
        (f.assist.blazingSword !== void 0 && typeof f.assist.blazingSword != "boolean") ||
        !s(f.assist.hpPercent, 1, 99) ||
        !s(f.assist.mpPercent, 1, 99))
    )
      throw new b(message("storage.assist"));
    if (
      f.trial &&
      (!s(f.trial.stage, 0, 3) ||
        !s(f.trial.honor) ||
        !s(f.trial.title, 0, 15) ||
        !s(f.trial.day) ||
        !s(f.trial.attempts, 0, 3))
    )
      throw new b(message("storage.trialProgress"));
    if (f.lateQuests !== void 0) {
      const x = f.lateQuests,
        m = (M) => !!M && typeof M == "object" && !Array.isArray(M);
      if (
        !m(x) ||
        Object.keys(x).some((M) => !["pearls", "altar", "blood"].includes(M)) ||
        (x.pearls !== void 0 &&
          (!m(x.pearls) || typeof x.pearls.active != "boolean" || !s(x.pearls.exchanges))) ||
        (x.altar !== void 0 && (!m(x.altar) || !s(x.altar.stage, 0, 3))) ||
        (x.blood !== void 0 && (!m(x.blood) || !s(x.blood.stage, 0, 2) || !s(x.blood.cycles)))
      )
        throw new b(message("storage.progress"));
    }
    if (f.challengeRewards !== void 0) {
      const x = f.challengeRewards,
        m = (M) => typeof M == "string" && M.length > 0 && M.length <= 100 && /^[\w:-]+$/.test(M);
      if (
        !x ||
        Array.isArray(x) ||
        !s(x.sequence) ||
        !s(x.poCompletions, 0, x.sequence) ||
        !Array.isArray(x.pending) ||
        !Array.isArray(x.claimed) ||
        !x.claimed.every(m) ||
        new Set(x.claimed).size !== x.claimed.length ||
        x.pending.some(
          (M) =>
            !M ||
            !m(M.runId) ||
            !Array.isArray(M.items) ||
            M.items.length < 1 ||
            M.items.length > 2 ||
            x.claimed.includes(M.runId),
        ) ||
        new Set(x.pending.map((M) => M.runId)).size !== x.pending.length
      )
        throw new b(message("storage.challengeProgress"));
    }
    if (
      f.trialRun &&
      (!s(f.trialRun.floor, 0, 99) ||
        !s(f.trialRun.deadline) ||
        !s(f.trialRun.pendingHonor) ||
        (f.trialRun.settledFloor !== void 0 && !s(f.trialRun.settledFloor, 0, f.trialRun.floor)) ||
        typeof f.trialRun.cleared != "boolean" ||
        f.map !== t.adaptations.trial?.map)
    )
      throw new b(message("storage.trialState"));
    if (
      f.crafting &&
      (!s(f.crafting.stage, 0, 2) ||
        !f.crafting.skills ||
        Object.entries(f.crafting.skills).some(
          ([x, m]) =>
            !["ore", "wood", "gem", "cloth", "equipment"].includes(x) ||
            !s(m.level, 1, x === "equipment" ? 10 : 9) ||
            !s(m.xp),
        ))
    )
      throw new b(message("storage.crafting"));
    if (
      f.itemHotkeys !== void 0 &&
      (!Array.isArray(f.itemHotkeys) ||
        f.itemHotkeys.length !== 6 ||
        f.itemHotkeys.some((x) => x !== null && (!s(x) || !c.has(x))))
    )
      throw new b(message("storage.hotkeys"));
    if (
      f.ringHotkeys !== void 0 &&
      (!Array.isArray(f.ringHotkeys) ||
        f.ringHotkeys.length !== 6 ||
        f.ringHotkeys.some(
          (x) =>
            x !== null &&
            (!x ||
              ![7, 8].includes(x.slot) ||
              !x.teleport ||
              !x.original ||
              !s(x.teleport.uid, 1) ||
              !s(x.original.uid, 1) ||
              x.teleport.uid === x.original.uid ||
              !isTeleportRing(c.get(x.teleport.id)) ||
              c.get(x.original.id)?.Type !== "Ring"),
        ))
    )
      throw new b(message("storage.progress"));
    if (f.challengeRun) {
      const x = f.challengeRun,
        m = t.adaptations.guideChallenges?.find((M) => M.id === x.id);
      if (
        !m ||
        x.map !== m.map ||
        x.map !== f.map ||
        !s(x.wave, 0, m.waves.length) ||
        typeof x.started != "boolean" ||
        typeof x.cleared != "boolean" ||
        !s(x.deadline) ||
        !s(x.nextWaveAt) ||
        (x.returnAt !== void 0 && !s(x.returnAt)) ||
        (x.runId !== void 0 &&
          (typeof x.runId != "string" || x.runId.length > 100 || !/^\d+:\d+$/.test(x.runId))) ||
        (x.branch !== void 0 && !["choice", "evil", "settle"].includes(x.branch)) ||
        (x.rewardSealed !== void 0 && typeof x.rewardSealed != "boolean") ||
        (x.cleared && x.wave !== m.waves.length)
      )
        throw new b(message("storage.challengeProgress"));
    }
    if (t.adaptations.guideChallenges?.some((x) => x.map === f.map) && !f.challengeRun)
      throw new b(message("storage.missingChallenge"));
    if (f.treasureRun) {
      const x = f.treasureRun;
      if (
        x.map !== t.adaptations.adventure.mapIds[n.roles.indexOf(f)] ||
        !s(x.wave, 0, 3) ||
        !s(x.nextWaveAt) ||
        typeof x.cleared != "boolean" ||
        typeof x.claimed != "boolean" ||
        (x.claimed && !x.cleared) ||
        (x.cleared && x.wave !== 3) ||
        (x.cleared &&
          (!Array.isArray(x.rewards) || x.rewards.length < 1 || x.rewards.length > 2)) ||
        (x.rewards !== void 0 &&
          (!Array.isArray(x.rewards) ||
            x.rewards.some((m) => !c.has(m.item) || !s(m.count, 1, 20))))
      )
        throw new b(message("storage.treasureProgress"));
    }
    if (t.adaptations.adventure.mapIds.includes(f.map) && f.treasureRun?.map !== f.map)
      throw new b(message("storage.missingTreasure"));
    for (const [x, m] of [
      ["inventory", carriedCapacity(f, t)],
      ["equipment", 15],
      ["storage", 80 * (f.storagePages || 1)],
      ["questInventory", 40],
    ]) {
      const M = f[x];
      if (
        !Array.isArray(M) ||
        (M.length !== m &&
          !(x === "inventory" && f.bagLayoutVersion === void 0 && isLegacyBag(f, t)) &&
          !(x === "equipment" && M.length === 14))
      )
        throw new b(message("storage.inventory"));
      for (const k of M) k && p(k);
    }
    for (const x of f.challengeRewards?.pending || [])
      for (const m of x.items) {
        if (
          m.count !== 1 ||
          ![
            20828,
            {
              Warrior: 20864,
              Wizard: 20865,
              Taoist: 20866,
            }[f.job],
          ].includes(m.id)
        )
          throw new b(message("storage.items"));
        p(m);
      }
    if (
      !Array.isArray(f.skills) ||
      !Array.isArray(f.quests) ||
      !Array.isArray(f.completedQuests) ||
      !Array.isArray(f.buffs)
    )
      throw new b(message("storage.progress"));
    const v = new Set();
    for (const x of f.skills) {
      if (
        v.has(x.Spell) ||
        !t.skills.some((m) => m.Spell === x.Spell) ||
        !s(x.Level, 0, t.skills.find((m) => m.Spell === x.Spell)?.DreamRanks?.length || 3) ||
        !s(x.Experience) ||
        !s(x.CastTime)
      )
        throw new b(message("storage.skills"));
      v.add(x.Spell);
    }
    for (const x of f.quests)
      if (
        !t.quests.some((m) => m.Index === x.id) ||
        !x.kills ||
        Object.values(x.kills).some((m) => !s(m))
      )
        throw new b(message("storage.quests"));
    for (const [x, m] of Object.entries(f.buyback || {})) {
      if (
        (!t.world.npcs.some((M) => M.id === Number(x)) &&
          !t.world.retiredNpcIds?.includes(Number(x))) ||
        !Array.isArray(m) ||
        m.length > 20
      )
        throw new b(message("storage.buyback"));
      m.forEach(p);
    }
  }
  for (const [f, v] of Object.entries(n.maps)) {
    if (v.omaNorthwestPlacement !== void 0 && (Number(f) !== 1001 || v.omaNorthwestPlacement !== 1))
      throw new b(message("storage.map"));
    if (!l.has(Number(f)) || !Array.isArray(v.actors) || !v.respawns)
      throw new b(message("storage.map"));
    if (
      v.portals !== void 0 &&
      (!Array.isArray(v.portals) ||
        v.portals.some(
          (x) =>
            !l.has(x.to) ||
            !Array.isArray(x.at) ||
            x.at.length !== 2 ||
            !x.at.every((m) => s(m)) ||
            !Array.isArray(x.landing) ||
            x.landing.length !== 2 ||
            !x.landing.every((m) => s(m)) ||
            (x.expires !== void 0 && !s(x.expires)),
        ))
    )
      throw new b(message("storage.portal"));
    for (const x of v.actors) {
      if ((g(x), x.map !== Number(f) || !["monster", "npc", "spell", "item"].includes(x.kind)))
        throw new b(message("storage.actorKind"));
      if (x.kind === "monster" && !t.monsters.some((m) => m.Index === x.definition))
        throw new b(message("storage.monster"));
      x.item && p(x.item);
    }
  }
  if (ce(t)) {
    if (n.sharedStorageGame !== void 0 && n.sharedStorageGame !== sharedStorageGame(t))
      throw new Error("\u6B64\u5B58\u6863\u4E0D\u5C5E\u4E8E\u5F53\u524D\u6E38\u620F\u3002");
    if (
      n.sharedStorageVersion === 1 &&
      sharedStorageGame(t) !== "classic-hell" &&
      n.sharedStorageGame === void 0
    )
      throw new b(message("storage.invalidFormat"));
    if (
      ((n.sharedStorageGame = sharedStorageGame(t)),
      (n.sharedStorageVersion !== void 0 && n.sharedStorageVersion !== 1) ||
        (n.sharedStorageVersion === 1 && n.sharedStorage === void 0))
    )
      throw new b(message("storage.invalidFormat"));
    if (
      (n.sharedStorage === void 0 && (n.sharedStorage = Array(rt).fill(null)),
      !Array.isArray(n.sharedStorage) || n.sharedStorage.length !== rt)
    )
      throw new b(message("storage.invalidFormat"));
    for (const f of n.sharedStorage)
      if (f !== null && (p(f), !mn(f, c.get(f.id), t))) throw new b(message("storage.sharedOnly"));
    n.sharedStorageVersion = 1;
  } else if (
    n.sharedStorage !== void 0 ||
    n.sharedStorageVersion !== void 0 ||
    n.sharedStorageGame !== void 0
  )
    throw new b(message("storage.invalidFormat"));
  if ([...o].some((f) => f >= n.nextId)) throw new b(message("storage.objectId"));
  const y = new Set();
  for (const f of n.events) {
    if (
      !["hit", "deathHit", "heal", "expire", "buff", "magic", "vamp", "kill"].includes(f.kind) ||
      !s(f.at) ||
      !s(f.order) ||
      f.order >= n.nextOrder ||
      y.has(f.order) ||
      !s(f.source) ||
      !s(f.target) ||
      !l.has(f.map) ||
      !Number.isFinite(f.damage) ||
      (f.monsterBasicAttack !== void 0 && typeof f.monsterBasicAttack != "boolean") ||
      (f.trainSpell !== void 0 && !t.skills.some((v) => v.Spell === f.trainSpell))
    )
      throw new b(message("storage.events"));
    if (
      f.effect &&
      (!s(f.effect.duration) || !u(f.effect.stats) || !Number.isFinite(f.effect.value))
    )
      throw new b(message("storage.pendingState"));
    y.add(f.order);
  }
  return structuredClone(n);
}


function Vr(e, t, a, i, n = {}) {
  if (ce(i)) throw Error("mergeSelection");
  const s = Y(ne(structuredClone(e), i), i),
    o = Y(ne(structuredClone(t), i), i);
  if (
    !Array.isArray(a) ||
    !a.length ||
    a.some((g) => !Number.isSafeInteger(g)) ||
    new Set(a).size !== a.length
  )
    throw Error("mergeSelection");
  const r = a.map((g) => o.roles.find((y) => y.id === g));
  if (r.some((g) => !g) || !n || typeof n != "object" || Array.isArray(n))
    throw Error("mergeSelection");
  const c = n,
    l = Object.entries(c);
  if (
    l.some(([g, y]) => !a.includes(Number(g)) || !Number.isSafeInteger(y)) ||
    new Set(Object.values(c)).size !== l.length
  )
    throw Error("mergeSelection");
  const u = (g) => g.trim().normalize("NFKC").toLocaleLowerCase();
  if (new Set(r.map((g) => u(g.name))).size !== r.length) throw Error("mergeDuplicate");
  for (const g of r) {
    const y = g,
      f = s.roles.filter((v) => u(v.name) === u(y.name));
    if (f.length) {
      if (f.length !== 1 || f[0].job !== y.job || c[String(y.id)] !== f[0].id)
        throw Error("mergeDuplicate");
    } else if (Object.hasOwn(c, String(y.id))) throw Error("mergeSelection");
  }
  if (s.roles.length + r.length - l.length > 6) throw Error("mergeFull");
  let h = Math.max(s.nextId, o.nextId);
  const p = () => {
    if (!Number.isSafeInteger(h + 1)) throw Error("mergeInvalid");
    return h++;
  };
  for (const g of r) {
    const y = g,
      f = c[String(y.id)],
      v = s.roles.findIndex((m) => m.id === f);
    ((y.id = v >= 0 ? f : p()), delete y.master, delete y.item);
    const x = new Map();
    for (const m of [
      ...y.inventory,
      ...y.equipment,
      ...y.storage,
      ...y.questInventory,
      ...Object.values(y.buyback || {}).flat(),
      ...(y.challengeRewards?.pending || []).flatMap((M) => M.items),
    ])
      if (m) {
        const M = m.uid;
        ((m.uid = p()), x.set(M, m.uid));
      }
    (Ba(y, x), v >= 0 ? (s.roles[v] = y) : s.roles.push(y));
  }
  return ((s.nextId = h), ne(s, i));
}
var hn = "maomao",
  bn = 15e5;
function Nt(e, t, a, i = !1) {
  const n = Y(ne(e, t), t);
  if (
    !n.roles.length &&
    !n.sharedStorage?.some(Boolean) &&
    !Object.keys(n.sync?.tombstones || {}).length &&
    !i
  )
    throw new b(message("core.cloud-save.encodeCloudSave.9dd87e152d"));
  const s = JSON.stringify({
    version: 1,
    format: isHell(t) ? "classic-hell-character-save" : "maomao-character-save",
    gameId: isHell(t) ? "classic-hell" : hn,
    contentHash: String(a || t.version),
    player: {
      roles: n.roles.map((o) => ({
        name: o.name,
        job: o.job,
        level: o.level,
      })),
    },
    snapshot: n,
  });
  if (s.length > bn) throw new b(message("core.cloud-save.encodeCloudSave.ef250747c5"));
  return s;
}
function Ur(e) {
  const t = structuredClone(e);
  let a = 1e4;
  const i = new Map(),
    n = new Map();
  for (const s of t.roles) {
    const o = new Map();
    (i.set(s, o), (s.id = a++), delete s.master, delete s.item);
    for (const r of [
      ...s.inventory,
      ...s.equipment,
      ...s.storage,
      ...s.questInventory,
      ...Object.values(s.buyback || {}).flat(),
      ...(s.challengeRewards?.pending || []).flatMap((c) => c.items),
    ])
      r && (o.set(r.uid, a), (r.uid = a++));
  }
  for (const s of t.sharedStorage || []) s && (n.set(s.uid, a), (s.uid = a++));
  for (const [s, o] of i) Ba(s, o, n);
  return ((t.nextId = a), t);
}
function He(e, t, a = {}) {
  if (typeof e != "string" || !e.length || e.length > bn)
    throw new b(message("core.cloud-save.decodeCloudSave.db10a7bee5"));
  let i;
  try {
    i = JSON.parse(e);
  } catch {
    throw new b(message("core.cloud-save.decodeCloudSave.0de22000a4"));
  }
  if (
    !i ||
    i.version !== 1 ||
    i.format !== (isHell(t) ? "classic-hell-character-save" : "maomao-character-save") ||
    i.gameId !== (isHell(t) ? "classic-hell" : hn) ||
    !i.snapshot ||
    i.snapshot.storageMode !== "character-only"
  )
    throw new b(message("core.cloud-save.decodeCloudSave.fe073fd64f"));
  const n = Y(ne(a.remapIds ? Ur(i.snapshot) : i.snapshot, t), t);
  if (
    !n.roles.length &&
    !n.sharedStorage?.some(Boolean) &&
    !Object.keys(n.sync?.tombstones || {}).length &&
    !a.allowEmpty
  )
    throw new b(message("core.cloud-save.decodeCloudSave.e3fd97ef99"));
  return n;
}
var gn = 2,
  Kr = "~deleted",
  Xr = new Set([
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
  ]),
  Jr = new Set(["inventory", "storage", "questInventory"]),
  ge = (e) =>
    Array.isArray(e)
      ? e.map(ge)
      : e && typeof e == "object"
        ? Object.fromEntries(
            Object.keys(e)
              .sort()
              .filter((t) => t !== "uid" && e[t] !== void 0)
              .map((t) => [t, ge(e[t])]),
          )
        : e,
  stringify = (e) => JSON.stringify(ge(e));
function itemProgress(e) {
  if (!e) return null;
  const { uid: t, buybackAt: a, specialVersion: i, ...n } = e;
  return ge(n);
}
function ba(e) {
  const t = new Map();
  for (const a of (e || []).filter(Boolean)) {
    const { count: i, ...n } = itemProgress(a),
      s = stringify(n),
      o = t.get(s) || {
        ...n,
        count: 0,
      };
    ((o.count += i ?? 1), t.set(s, o));
  }
  return [...t.values()].sort((a, i) => stringify(a).localeCompare(stringify(i), "en"));
}
function _r(e) {
  const t = {};
  for (const a of Object.keys(e).sort())
    if (!(Xr.has(a) || e[a] === void 0))
      if (Jr.has(a)) t[a] = ba(e[a]);
      else if (a === "equipment") t[a] = (e[a] || []).map(itemProgress);
      else if (a === "buyback")
        t[a] = Object.fromEntries(
          Object.keys(e[a] || {})
            .sort()
            .filter((i) => e[a][i]?.length)
            .map((i) => [i, ba(e[a][i])]),
        );
      else if (a === "skills")
        t[a] = (e[a] || [])
          .filter((i) => !i.temporary)
          .map(({ CastTime: i, Key: n, ...s }) => ge(s))
          .sort((i, n) => String(i.Spell).localeCompare(String(n.Spell), "en"));
      else if (["quests", "completedQuests", "unlockedWaypoints", "noviceBooks"].includes(a))
        t[a] = (e[a] || []).map(ge).sort((i, n) => stringify(i).localeCompare(stringify(n), "en"));
      else if (a === "challengeRewards") {
        const { sequence: i, ...n } = e[a] || {};
        t[a] = ge(n);
      } else t[a] = ge(e[a]);
  (t.storagePages ?? 1) === 1 && delete t.storagePages;
  for (const a of [
    "inventory",
    "storage",
    "questInventory",
    "skills",
    "quests",
    "completedQuests",
    "unlockedWaypoints",
    "noviceBooks",
  ])
    t[a] ??= [];
  return (
    Object.keys(t.buyback || {}).length || delete t.buyback,
    t.trial && !Object.values(t.trial).some(Boolean) && delete t.trial,
    t.crafting &&
      !t.crafting.stage &&
      !Object.keys(t.crafting.skills || {}).length &&
      delete t.crafting,
    t.spiritProgress && !t.spiritProgress.level && !t.spiritProgress.xp && delete t.spiritProgress,
    t.challengeRewards &&
      !t.challengeRewards.poCompletions &&
      !t.challengeRewards.pending?.length &&
      !t.challengeRewards.claimed?.length &&
      delete t.challengeRewards,
    t.lateQuests && !Object.keys(t.lateQuests).length && delete t.lateQuests,
    stringify(t)
  );
}
function legacyRoleKey(e) {
  return e.name.trim().normalize("NFKC").toLocaleLowerCase("en-US") + "|" + String(e.job || "");
}
function cloudRoleKey(e) {
  return e.cloudId || "legacy:" + legacyRoleKey(e);
}
function legacyCharacterId(e, t) {
  const a = String(e || "guest") + "\0" + legacyRoleKey(t),
    i = [2166136261, 2246822519, 3266489917, 668265263];
  for (let s = 0; s < i.length; s++)
    for (let o = 0; o < a.length; o++)
      i[s] = Math.imul(i[s] ^ a.charCodeAt(o), 16777619 + s * 2) >>> 0;
  const n = i.map((s) => s.toString(16).padStart(8, "0")).join("");
  return (
    n.slice(0, 8) +
    "-" +
    n.slice(8, 12) +
    "-5" +
    n.slice(13, 16) +
    "-a" +
    n.slice(17, 20) +
    "-" +
    n.slice(20, 32)
  );
}
function ensureCharacterIds(e, t) {
  for (const a of e.roles || []) a.cloudId ||= legacyCharacterId(t, a);
  return e;
}
function freshSync(e, t = {}) {
  return {
    protocol: 2,
    ownerId: e ?? null,
    deviceId: t.deviceId || "",
    deviceName: t.deviceName || "",
    projectionVersion: gn,
    baseRevision: null,
    baseRoles: {},
    tombstones: {},
    progressSeq: 0,
    lastProgressAt: null,
    checkpointWrittenAt: null,
    serverConfirmedAt: null,
  };
}
function cloudBaseline(e, t = {}) {
  return Object.fromEntries(
    [
      ...Object.keys(t || {})
        .sort()
        .map((a) => [a, Kr]),
      ...(e || []).map((a) => [cloudRoleKey(a), _r(a)]),
    ].sort(([a], [i]) => a.localeCompare(i, "en")),
  );
}
function wn(e) {
  return (typeof e == "string" && (e = JSON.parse(e)), e?.snapshot || e);
}
var Zr = "00000000-0000-4000-8000-000000000080",
  ec = Zr,
  sharedSnapshot = (e) => {
    const t = wn(e);
    return t?.gameId === "classic-hell" || t?.sharedStorageVersion === 1;
  },
  sharedGame = (e) =>
    e.sharedStorageGame ?? (e.gameId === "classic-hell" ? "classic-hell" : void 0);
function wholeProjection(e, t = cloudBaseline(e?.roles || [], e?.sync?.tombstones)) {
  return stringify({
    roles: t,
    sharedStorage: ba(e.sharedStorage || []),
    ...(sharedGame(e) && sharedGame(e) !== "classic-hell"
      ? {
          game: sharedGame(e),
        }
      : {}),
  });
}
function semanticSnapshot(e) {
  const t = wn(e);
  return sharedSnapshot(t)
    ? {
        [ec]: wholeProjection(t),
      }
    : cloudBaseline(t?.roles || [], t?.sync?.tombstones);
}
function progressFingerprint(e) {
  return stringify({
    projectionVersion: gn,
    roles: semanticSnapshot(e),
  });
}
var Bt = globalThis,
  Z = 24,
  S,
  Q,
  Ne = !0,
  ze = !1,
  va = !1,
  Ve = performance.now(),
  xe = 0,
  ct = 0,
  Tt = Promise.resolve(),
  lt = new Map(),
  ve = new Map(),
  Ma = 0;
async function Sn(e) {
  const t = ve.get(e);
  if (t) return (ve.delete(e), ve.set(e, t), t.value);
  const a = await fetch(e);
  if (!a.ok) throw new b(message("storage.mapLoad"));
  const i = await a.text(),
    n = JSON.parse(i),
    s = i.length * 2;
  if (s <= 8 * 1024 * 1024)
    for (
      ve.set(e, {
        value: n,
        bytes: s,
      }),
        Ma += s;
      ve.size > 16 || Ma > 8 * 1024 * 1024;

    ) {
      const o = ve.keys().next().value;
      ((Ma -= ve.get(o).bytes), ve.delete(o));
    }
  return n;
}
var _ = null,
  Me = {
    deviceId: crypto.randomUUID(),
    deviceName: "",
  },
  semantic = (e) => progressFingerprint(e);
function te(e, t = _) {
  const a = ensureCharacterIds(Y(e, S.rules), t);
  if (
    ((a.sync = a.sync
      ? structuredClone(a.sync)
      : {
          ...freshSync(t, Me),
          lastProgressAt: a.lastSaved,
        }),
    a.sync.ownerId !== t)
  )
    throw Error("accountChanged");
  return (a.sync.deviceId === Me.deviceId && (a.sync.deviceName = Me.deviceName), a);
}
function ue(e, t = !0) {
  if ((t || e?.ownerId !== void 0) && e?.ownerId !== _) throw Error("accountChanged");
}
function nc(e) {
  if (e === null) return null;
  if (typeof e != "string" || !e.length || e.length > 200 || /[\x00-\x1f]/.test(e))
    throw Error("accountChanged");
  return e;
}
function dt(e) {
  ((S = e), (Ne = !0), lt.clear(), (ct = 0), (Ve = performance.now()), (xe = 0));
}
function ft(e, t) {
  const a = {
    ...structuredClone(t),
    baseRevision: e.baseRevision,
    baseRoles: structuredClone(e.baseRoles),
    serverConfirmedAt: e.serverConfirmedAt,
  };
  if (
    !(a.baseRevision === null || (Number.isSafeInteger(a.baseRevision) && a.baseRevision >= 0)) ||
    !a.baseRoles ||
    typeof a.baseRoles != "object" ||
    Array.isArray(a.baseRoles) ||
    !Object.values(a.baseRoles).every((i) => typeof i == "string") ||
    !(
      a.serverConfirmedAt === null ||
      (Number.isSafeInteger(a.serverConfirmedAt) && a.serverConfirmedAt >= 0)
    )
  )
    throw Error("invalid");
  if (t.baseRevision !== null && (a.baseRevision === null || a.baseRevision < t.baseRevision))
    throw Error("conflict");
  return a;
}


async function Pn() {
  if (_ === null) throw Error("accountChanged");
  if (await Q.guestBinding()) throw Error("guestBound");
  const e = await Q.readOwner(null);
  if (!e?.roles.length && !e?.sharedStorage?.some(Boolean)) throw Error("missing");
  const t = Y(ne(e, S.rules), S.rules);
  for (const a of t.roles)
    (!a.cloudId || a.cloudId === legacyCharacterId(null, a)) &&
      (a.cloudId = legacyCharacterId(_, a));
  return (
    (t.sync = {
      ...freshSync(_, Me),
      progressSeq: e.sync?.progressSeq ?? 0,
      lastProgressAt: e.sync?.lastProgressAt ?? e.lastSaved,
      checkpointWrittenAt: new Date().toISOString(),
    }),
    t
  );
}
async function Re(e) {
  if (S.geometry.has(e)) return;
  let t = lt.get(e);
  t ||
    ((t = (async () => {
      S.loadMap(await Sn(`data/maps/${e}/info.json`));
    })()),
    lt.set(e, t));
  try {
    await t;
  } catch (a) {
    throw (lt.delete(e), a);
  }
}
async function se() {
  const e = new Date().toISOString(),
    t = te(S.save(!1)),
    a = await Q.read();
  if (a)
    for (const n of a.roles)
      n.cloudId &&
        !t.roles.some((s) => s.cloudId === n.cloudId) &&
        (t.sync.tombstones[n.cloudId] ??= {
          deletedAt: e,
        });
  const i = a
    ? semantic(t) !== semantic(te(a))
    : !!t.roles.length ||
      !!t.sharedStorage?.some(Boolean) ||
      !!Object.keys(t.sync.tombstones).length;
  (i &&
    (t.sync.progressSeq++,
    (t.sync.lastProgressAt = e),
    Object.assign(t.sync, Me),
    (t.lastSaved = e)),
    (t.sync.checkpointWrittenAt = e),
    await Q.write(t, !i),
    (S.sync = structuredClone(t.sync)),
    (S.lastSaved = t.lastSaved));
  for (let n = 0; n < S.roles.length; n++) S.roles[n].cloudId = t.roles[n].cloudId;
  ct = S.time;
}
async function An() {
  const e = await fetch("data/rules.json");
  if (!e.ok) throw new b(message("storage.rulesLoad"));
  const t = await e.json();
  ((S = new Ge(t, crypto.getRandomValues(new Int32Array(1))[0])),
    (Q = new In(t.adaptations.dreamRuntime?.hell?.gameId)),
    await Q.open());
  const a = await Q.read();
  if (a) {
    (t.adaptations.dreamRuntime &&
      !a.dreamRuntimeVersion &&
      (await Q.backupOnce("before-dream-runtime-v1", a)),
      t.adaptations.mainline &&
        (Number(a.worldVersion) || 1) < t.adaptations.mainline.worldVersion &&
        (await Q.backupOnce(`before-world-v${t.adaptations.mainline.worldVersion}`, a)));
    try {
      S.restore(Y(ne(a, t), t));
    } catch (n) {
      const s = await Q.read("previous");
      if (!s) throw n;
      const o = Y(ne(s, t), t);
      (S.restore(o),
        await Q.write(o, !0),
        S.say(message("storage.recovered")),
        Bt.postMessage({
          notification: !0,
          error: message("storage.recovered"),
        }));
    }
  }
  const i = te(S.save(!1));
  return ((S.sync = i.sync), (S.roles = i.roles), S.snapshot(-1, Z));
}
async function sc(e, t, a) {
  if (e === "init") return An();
  if (e === "world") return S.rules.world;
  if (e === "cloud/context") {
    const i = nc(t?.ownerId);
    if (S.active) throw Error("pendingSelection");
    if (t?.deviceId !== void 0) {
      if (
        typeof t.deviceId != "string" ||
        t.deviceId.length > 200 ||
        typeof t.deviceName != "string" ||
        t.deviceName.length > 100
      )
        throw Error("invalid");
      Me = {
        deviceId: t.deviceId,
        deviceName: t.deviceName,
      };
    }
    if (i === _) return ((S.sync = te(S.save(!1)).sync), S.snapshot(-1, Z));
    await se();
    const n = await Q.readOwner(i),
      s = new Ge(S.rules, 1);
    n ? s.restore(te(ne(n, S.rules), i)) : (s.sync = freshSync(i, Me));
    const o = te(s.save(!1), i);
    return (
      (o.sync.checkpointWrittenAt = new Date().toISOString()),
      s.restore(o),
      await Q.writeOwner(o, i),
      Q.selectOwner(i),
      (_ = i),
      dt(s),
      S.snapshot(-1, Z)
    );
  }
  if (e === "cloud/guest") {
    ue(t);
    const i = await Pn();
    return {
      roles: i.roles,
      sync: i.sync,
      saveJson: Nt(i, S.rules, String(t?.build || ""), !0),
    };
  }
  if (e === "cloud/bind") {
    if ((ue(t), _ === null)) throw Error("accountChanged");
    if (S.active) throw Error("pendingSelection");
    const i = await Pn(),
      n = te(S.save(!1));
    let s = i;
    if (t?.saveJson) {
      if (
        (t.expectedProgress !== void 0 && progressFingerprint(n) !== t.expectedProgress) ||
        typeof t.expectedRoles != "string" ||
        t.expectedRoles !== JSON.stringify(n.roles)
      )
        throw Error("conflict");
      (ft(t, n.sync),
        (s = te(
          He(t.saveJson, S.rules, {
            allowEmpty: !0,
            remapIds: !0,
          }),
        )),
        (s.sync = ft(t, s.sync)));
    } else if (
      S.roles.length ||
      S.sharedStorage.some(Boolean) ||
      Object.keys(S.sync?.tombstones || {}).length
    )
      throw Error("conflict");
    const o = t?.remoteSaveJson
      ? He(t.remoteSaveJson, S.rules, {
          allowEmpty: !0,
        })
      : i;
    if (o.sync && o.sync.ownerId !== _) throw Error("accountChanged");
    ht(s.roles, S.roles);
    const r = new Ge(S.rules, 1);
    return (
      r.restore(s),
      Object.assign(s, Y(r.save(!1), S.rules)),
      await Q.bindGuest(_, s, n, o),
      dt(r),
      S.snapshot(-1, Z)
    );
  }
  if (e === "viewport")
    return (
      autoBattleSetViewport(t),
      (Z = Hn(t?.width, t?.height)),
      {
        viewRange: Z,
      }
    );
  if (e === "foreground") return (t?.active || (await se()), S.snapshot(a, Z));
  if (e === "pause")
    return (
      (Ne = !!t?.paused),
      (Ve = performance.now()),
      (xe = 0),
      Ne && (await se()),
      S.snapshot(a, Z)
    );
  if (e.startsWith("map/")) {
    const [i, n = ""] = e.split("?"),
      s = i.split("/"),
      o = Number(s[1]);
    if (!S.rules.world.maps.some((l) => l.id === o)) throw new b(message("storage.mapRange"));
    const r = new URLSearchParams(n),
      c = s[2] === "chunk" ? `${Number(r.get("x"))}-${Number(r.get("y"))}.json` : "info.json";
    return Sn(`data/maps/${o}/${c}`);
  }
  if (e === "cloud/local") {
    const i = te(S.save(!1)),
      n = await Q.readOwner(null),
      s = await Q.guestBinding();
    return {
      stage: S.active ? "Game" : "Select",
      roles: i.roles,
      sync: i.sync,
      guestAvailable: _ !== null && !s && !!(n?.roles.length || n?.sharedStorage?.some(Boolean)),
      saveJson: Nt(i, S.rules, String(t?.build || ""), !0),
    };
  }
  if (e === "cloud/commit") {
    (ue(t), await se());
    const i = te(S.save(!1));
    return (
      (i.sync = ft(t, i.sync)),
      (i.sync.checkpointWrittenAt = new Date().toISOString()),
      await Q.write(i, !0),
      (S.sync = structuredClone(i.sync)),
      {
        sync: structuredClone(i.sync),
      }
    );
  }
  if (e === "cloud/apply") {
    if ((ue(t), S.active)) throw Error("pendingSelection");
    const i = te(S.save(!1));
    if (
      typeof t?.expectedRoles != "string" ||
      JSON.stringify(i.roles) !== t.expectedRoles ||
      (t?.expectedProgress !== void 0 && progressFingerprint(i) !== t.expectedProgress)
    )
      throw Error("conflict");
    const n = te(
      He(t?.saveJson, S.rules, {
        allowEmpty: !0,
        remapIds: !0,
      }),
    );
    (ft(t, i.sync),
      (n.sync = ft(t, n.sync)),
      (n.sync.checkpointWrittenAt = new Date().toISOString()),
      ht(n.roles, S.roles));
    const s = new Ge(S.rules, 1);
    (s.restore(n), Object.assign(n, Y(s.save(!1), S.rules)));
    const o = He(t?.remoteSaveJson ?? t?.saveJson, S.rules, {
      allowEmpty: !0,
      remapIds: !t?.remoteSaveJson,
    });
    if (o.sync && o.sync.ownerId !== _) throw Error("accountChanged");
    return (await Q.merge(n, o, i, !!t?.manual), dt(s), S.snapshot(-1, Z));
  }
  if (
    t?.autoSync &&
    (e === "cloud/merge" || e === "cloud/restore") &&
    (S.active || JSON.stringify(Y(S.save(!1), S.rules).roles) !== t.expectedRoles)
  )
    throw Error("conflict");
  if (e === "cloud/prepare")
    return (
      ue(t, !1),
      await se(),
      {
        saveJson: Nt(S.save(!1), S.rules, String(t?.build || ""), !0),
        sync: structuredClone(S.sync),
      }
    );
  if (e === "cloud/preview") {
    const i = He(t?.saveJson, S.rules, {
      allowEmpty: !0,
    });
    return {
      roles: i.roles.map((n) => ({
        id: n.id,
        cloudId: n.cloudId,
        name: n.name,
        job: n.job,
        level: n.level,
      })),
      lastSaved: i.lastSaved,
      sync: i.sync,
    };
  }
  if (e === "cloud/merge") {
    if ((ue(t, !1), S.active)) throw Error("pendingSelection");
    const i = He(t?.saveJson, S.rules);
    if (i.sync && i.sync.ownerId !== _) throw Error("accountChanged");
    const n = Vr(S.save(!1), i, t?.roleIds, S.rules, t?.replacements);
    ht(n.roles, S.roles);
    const s = new Ge(S.rules, 1);
    return (
      s.restore(n),
      Object.assign(n, Y(s.save(!1), S.rules)),
      (s.active = 0),
      (n.sync = structuredClone(S.sync)),
      await Q.merge(n, i),
      (s.sync = n.sync),
      dt(s),
      S.snapshot(-1, Z)
    );
  }
  if (e === "cloud/export-backup") {
    ue(t, !1);
    const i = t?.kind === "remote" ? "cloud-merge-remote" : "before-cloud-merge",
      n = await Q.read(i);
    if (!n) throw Error("noBackup");
    return {
      saveJson: Nt(ne(n, S.rules), S.rules, String(t?.build || ""), !0),
    };
  }
  if (e === "cloud/backup")
    return (
      ue(t, !1),
      {
        exists: !!(await Q.read("before-cloud-read")),
      }
    );
  if (e === "cloud/restore" || e === "cloud/rollback") {
    if ((ue(t, !1), S.active)) throw Error("pendingSelection");
    const i = ensureCharacterIds(
      e === "cloud/restore"
        ? He(t?.saveJson, S.rules, {
            allowEmpty: !0,
          })
        : Y(ne(await Q.read("before-cloud-read"), S.rules), S.rules),
      _,
    );
    if (i.sync && i.sync.ownerId !== _) throw Error("accountChanged");
    const n = {
      ...structuredClone(S.sync?.tombstones || {}),
      ...structuredClone(i.sync?.tombstones || {}),
    };
    for (const o of S.roles)
      o.cloudId &&
        !i.roles.some((r) => r.cloudId === o.cloudId) &&
        (n[o.cloudId] ??= {
          deletedAt: new Date().toISOString(),
        });
    for (const o of i.roles) o.cloudId && delete n[o.cloudId];
    ((i.sync = {
      ...structuredClone(S.sync ?? freshSync(_, Me)),
      tombstones: n,
      lastProgressAt: i.sync?.lastProgressAt ?? i.lastSaved,
      checkpointWrittenAt: new Date().toISOString(),
    }),
      ht(i.roles, S.roles));
    const s = new Ge(S.rules, 1);
    return (
      s.restore(i),
      Object.assign(i, Y(s.save(!1), S.rules)),
      (s.active = 0),
      await Q.write(i, !1, e === "cloud/restore" ? "before-cloud-read" : void 0),
      (s.sync = i.sync),
      dt(s),
      S.snapshot(-1, Z)
    );
  }
  if (e === "entry" || e === "open") ((S.active = 0), (Ne = !1));
  else if (e === "create")
    ((S.create(String(t?.name || ""), t?.job, t?.gender).cloudId = crypto.randomUUID()),
      await se());
  else if (e === "delete") {
    if (S.active) throw Error("pendingSelection");
    const i = S.roles.find((s) => (t?.cloudId ? s.cloudId === t.cloudId : s.id === t?.id));
    if (!i) throw Error("missing");
    const n = S.roles;
    S.roles = S.roles.filter((s) => s !== i);
    try {
      await se();
    } catch (s) {
      throw ((S.roles = n), s);
    }
  } else if (e === "start") {
    const i = S.roles.find((s) => s.id === t?.id);
    if (!i) throw new b(message("storage.roleMissing"));
    const n = i.id;
    (S.restore(Y(S.save(!1), S.rules)),
      await Re(S.rules.world.maps.find((s) => s.start).id),
      S.start(n),
      (ct = S.time),
      S.bringPets(S.me),
      (Ne = !1));
  } else if (e === "save") await se();
  else if (e.startsWith("command/")) {
    if (!ze) return S.snapshot(a, Z);
    if (
      t?.Shared === !0 &&
      ["command/StoreItem", "command/TakeBackItem", "command/SortStorage"].includes(e)
    ) {
      const n = S.me;
      if (!n) throw Error("invalid");
      const s = structuredClone({
        inventory: n.inventory,
        sharedStorage: S.sharedStorage,
        nextId: S.nextId,
      });
      try {
        (S.command(e.slice(8), t), await se());
      } catch (o) {
        throw (
          (n.inventory = s.inventory),
          (S.sharedStorage = s.sharedStorage),
          (S.nextId = s.nextId),
          o
        );
      }
      return S.snapshot(a, Z);
    }
    if (!ze) return S.snapshot(a, Z);
    if (["command/UseItem", "command/UseItemHotkey"].includes(e) && S.me) {
      const n =
        e === "command/UseItemHotkey"
          ? S.me.inventory.find((s) => s?.id === S.me.itemHotkeys?.[Number(t?.Key)])
          : S.me.inventory.find((s) => s?.uid === Number(t?.UniqueID));
      n && S.defs.get(n.id)?.Type === "TreasureMap" && (await Re(treasureMapId(S, S.me)));
    }
    if (e === "command/CallNPC" && Number(t?.ObjectID) === 9420) {
      const n = String(t?.Key || "")
          .replace(/[\[\]]/g, "")
          .toLowerCase(),
        s = S.rules.adaptations.guideChallenges?.find((o) => "@challenge-" + o.id === n);
      s && (await Re(s.map));
    }
    if (e === "command/CallNPC") {
      const n = String(t?.Key || "")
          .replace(/[\[\]]/g, "")
          .toLowerCase(),
        s = Number(t?.ObjectID),
        o = S.rules.adaptations.lateContent;
      if (o?.fireAltar && s === o.fireAltar.npcId && n === "@late-altar-enter") {
        const r = S.rules.adaptations.guideChallenges?.find((c) => c.id === o.fireAltar.challenge);
        r && (await Re(r.map));
      }
      if (o?.secretTicket && s === o.secretTicket.npcId) {
        const r = o.secretTicket.shortcuts.find((c) => "@late-secret-" + c.map === n);
        r && (await Re(r.map));
      }
    }
    e === "command/CallNPC" &&
      Number(t?.ObjectID) === S.rules.adaptations.trial?.entranceNpc &&
      String(t?.Key).includes("@trialenter") &&
      (await Re(S.rules.adaptations.trial.map));
    const i = e === "command/ConfirmInstanceExit" ? S.me?.challengeRun : void 0;
    (S.command(e.slice(8), t),
      S.me && (await Re(S.me.map), S.initializeMap(S.me.map), S.bringPets(S.me), It(S, S.me), Cn()),
      ([
        "LogOut",
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
      ].includes(e.slice(8)) ||
        (i && !S.me?.challengeRun)) &&
        (await se()));
  } else if (e !== "state") throw new b(message("storage.unsupported"));
  return (
    e === "state" &&
      ze &&
      S.me?.job === "Taoist" &&
      t?.role === S.me.id &&
      t?.map === S.me.map &&
      S.focusMonster(S.me, Number(t.focus) || 0),
    S.snapshot(a, Z)
  );
}


const oc = (e) => {
  const { id: t, route: a, data: i, after: n = -1 } = e.data;
  (a === "foreground" && ((ze = !!i?.active), (Ve = performance.now()), (xe = 0), Dn()),
    (Tt = Tt.then(async () => {
      va = !0;
      try {
        Bt.postMessage({
          id: t,
          result: await sc(a, i, n),
        });
      } catch (s) {
        Bt.postMessage({
          id: t,
          error: mt(s),
        });
      } finally {
        ((va = !1), Dn());
      }
    })));
};
var ut;
function Cn() {
  const e = S.me?.map;
  for (const a of Object.keys(S.maps)) Number(a) !== e && delete S.maps[Number(a)];
  const t = S.rules.world.maps.find((a) => a.start).id;
  for (const a of S.geometry.keys()) a !== e && a !== t && (S.geometry.delete(a), lt.delete(a));
  S.events = S.events.filter((a) => a.map === e);
}
function Dn() {
  const e = !!S?.me && !Ne && ze;
  (!e && ut !== void 0 && (clearInterval(ut), (ut = void 0), (xe = 0)),
    e && ut === void 0 && ((Ve = performance.now()), (xe = 0), (ut = setInterval(rc, 20))),
    S && !S.me && Cn());
}
function rc() {
  const e = performance.now(),
    t = e - Ve;
  if (((Ve = e), !S || Ne || !ze || va || !S.me)) return;
  xe += Math.min(t, 200);
  let a = 0;
  for (; xe >= 20 && a++ < 10; ) (S.tick(20), (xe -= 20));
  S.time - ct >= 3e4 &&
    ((ct = S.time),
    (Tt = Tt.then(se).catch((i) =>
      Bt.postMessage({
        error: String(i),
        notification: !0,
      }),
    )));
}
async function uc() {
  await An();
}
export { oc as handleCoreMessage, uc as initializeCore };

