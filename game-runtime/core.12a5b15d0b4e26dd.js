import { EncryptedSaveStore as fn } from "/Game/site-assets/encrypted-save.js";
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
function Ht(e) {
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
function de(e, t, a = {}) {
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
function pa(e, t, a, i = !0) {
  if (e.Spell === "Hydra") return hydraStats(e, t).power;
  const n = e.DreamRaw,
    s = Math.min(10, Math.max(0, t));
  if (n?.MultiBase) {
    const r = (l, f) =>
        Number(n[l] || 0) + (a && n[f] ? a.next(Number(n[f]) + 1) : i ? Number(n[f] || 0) : 0),
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
var Nt = class {
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
  B = Math.fround;
function bn(e, t, a) {
  if (!e.Gain) return e.Base;
  let i;
  return (
    e.FormulaType === "Health"
      ? (i = B(e.Base + B(B(B(a / e.Gain) + e.GainRate) + (t === "Warrior" ? B(a / 20) : 0)) * a))
      : e.FormulaType === "Mana"
        ? (i = B(
            t === "Wizard"
              ? B(e.Base + B(B(B(B(a / e.Gain) + 2) * B(2.2)) * a)) + B(a * e.GainRate)
              : t === "Taoist"
                ? B(e.Base + B(B(B(a / e.Gain) * B(2.2)) * a)) + B(a * e.GainRate)
                : B(e.Base + B(a * e.Gain)) + B(a * e.GainRate),
          ))
        : (i =
            e.FormulaType === "Weight"
              ? B(e.Base + B(B(a / e.Gain) * a))
              : B(e.Base + B(a / e.Gain))),
    Math.trunc(Math.min(e.Max > 0 ? e.Max : 2147483647, i))
  );
}
var ot = (e, t, a = !1) =>
  a
    ? dreamAttackDelay(t)
    : Math.max(550, 1400 - ((t.AttackSpeed || 0) * 60 + Math.min(370, e * 14)));
function Q(e, t, a) {
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
function Me(e) {
  const t = Math.floor(e);
  return e - t === 0.5 ? t + (t % 2) : Math.round(e);
}
function magicPower(e, t, a) {
  if (e.DreamSkill) return pa(e, t);
  const i = e.MPowerBonus > 0 ? a.next(e.MPowerBase + e.MPowerBonus, e.MPowerBase) : e.MPowerBase,
    n = e.PowerBonus > 0 ? a.next(e.PowerBase + e.PowerBonus, e.PowerBase) : e.PowerBase;
  return Me(B(B(B(i / 4) * (t + 1)) + n));
}
var magicDamage = (e, t, a, i) =>
  e.DreamSkill
    ? Math.trunc(Math.fround(Math.fround(a + pa(e, t, i)) * Math.fround(dreamCoefficient(e, t))))
    : Math.trunc(B((a + magicPower(e, t, i)) * B(e.MultiplierBase + B(t * e.MultiplierBonus))));
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
var $e = new Set([
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
  gn = {
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
  return e.DreamType === 6 ? [14] : gn[e.Type];
}
function price(e, t) {
  let a = t.Price;
  if (t.Durability > 0) {
    a = Math.trunc(B(e.maxDura * B(B(t.Price / 2) / t.Durability)));
    const i = e.maxDura ? B(e.currentDura / e.maxDura) : 0;
    a = Math.floor(B(B(B(a / 2) + B(B(a / 2) * i)) + B(t.Price / 2)));
  }
  return Math.trunc(B(a * B(B(Object.keys(e.added).length * B(0.1)) + 1))) * e.count;
}
function yn(e, t, a, i) {
  const n = t.RandomStats || {},
    s = (l, f) => {
      let h = 0;
      for (let p = 0; p < l; p++) a.next(f) === 0 && h++;
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
    $e.has(t.Type) &&
    i.profiles.includes(t.RandomStatsId) &&
    (r ||
      (!i.qualityProfiles && t.RequiredType === "Level" && t.RequiredAmount <= i.maxRequiredLevel))
  ) {
    if (a.next(100) >= c.exceptionalPercent) return;
    const l = new Set(["MaxAC", "MaxMAC", "MaxDC", "MaxMC", "MaxSC"]),
      f = Object.entries(o)
        .filter(([P]) => n[P + "Chance"] > 0)
        .map(([, P]) => ({
          key: P,
          weight: ["MaxDC", "MaxMC", "MaxSC"].includes(P) ? 3 : 1,
          min: 1,
          max: l.has(P) ? c.totalPointWeights.length : 1,
        }));
    f.push(
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
      p = a.next(c.totalPointWeights.reduce((P, w) => P + w, 0));
    for (; h < c.totalPointWeights.length && p >= c.totalPointWeights[h - 1]; )
      p -= c.totalPointWeights[h++ - 1];
    const g = a.next(100);
    let y = Math.min(
      h,
      g < i.thirdAffixPercent ? 3 : g < i.thirdAffixPercent + i.secondAffixPercent ? 2 : 1,
    );
    const u = [],
      v = (P, w) => {
        if (w.length === y) {
          w.reduce((C, q) => C + q.min, 0) <= h &&
            w.reduce((C, q) => C + q.max, 0) >= h &&
            u.push({
              stats: w,
              weight: w.reduce((C, q) => C * q.weight, 1),
            });
          return;
        }
        for (let C = P; C < f.length; C++) v(C + 1, [...w, f[C]]);
      };
    for (; y > 0 && !u.length; ) (v(0, []), u.length || y--);
    if (!u.length) return;
    p = a.next(u.reduce((P, w) => P + w.weight, 0));
    let x = 0;
    for (; p >= u[x].weight; ) p -= u[x++].weight;
    const m = u[x].stats;
    let M = h;
    for (let P = 0; P < m.length; P++) {
      const w = m[P],
        C = m.slice(P + 1),
        q = Math.max(w.min, M - C.reduce((k, I) => k + I.max, 0)),
        L = Math.min(w.max, M - C.reduce((k, I) => k + I.min, 0)),
        W = q === L ? q : a.next(L + 1, q);
      ((e.added[w.key] = W), (M -= W));
    }
    return;
  }
  for (const [l, f] of Object.entries(o))
    n[l + "Chance"] > 0 &&
      a.next(n[l + "Chance"]) === 0 &&
      (e.added[f] = s(n[l + "MaxStat"] - 1, n[l + "StatChance"]) + 1);
}
function ba(e, t) {
  if (!t.adaptations.dreamRuntime || e.Type !== "Book") return !0;
  const a = t.skills.find((n) => n.Spell === e.Spell);
  if (!a?.DreamSkill) return !1;
  const i = a.DreamRaw?.Job;
  return i === void 0 || e.RequiredClass === ["Warrior", "Wizard", "Taoist"][i];
}


function ga(e, t, a, i) {
  const n = e.item === null ? void 0 : t.get(e.item);
  if (n && !ba(n, a)) return null;
  const s =
      e.dropMultiplierMode === "fixed"
        ? 1
        : e.gold > 0
          ? a.multipliers.goldDropChanceMultiplier
          : n && $e.has(n.Type) && !e.quest
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
      const f = ga(l, t, a, i);
      if (f && ((r += f.gold), c.push(...f.items), e.group.first)) break;
    }
    e.group.random && c.length && (c = [c[i.next(c.length)]]);
  }
  return {
    gold: r,
    items: c,
  };
}
var ya = 80,
  xn = [0, 5e5, 1e6];
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
function va(e, t, a) {
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
    const f = a.get(l.id);
    if (!f) throw new b(message("storage.inventory"));
    const h = isBagEquipment(f) ? 0 : i,
      p = h + i;
    c >= h && c < p && !s[c] ? (s[c] = l) : o.push(l);
  }
  const r = [];
  for (const c of o) {
    const l = a.get(c.id),
      f = isBagEquipment(l) ? 0 : i,
      h = s.findIndex((p, g) => !p && g >= f && g < f + i);
    h < 0 ? r.push(c) : (s[h] = c);
  }
  for (const c of r) {
    const l = n.indexOf(c),
      f = l >= 0 && l < s.length && !s[l] ? l : s.findIndex((h) => !h);
    if (f < 0) throw new b(message("storage.inventory"));
    s[f] = c;
  }
  ((e.inventory = s), (e.bagLayoutVersion = 1));
}
function Mn(e, t) {
  const a = e.storagePages || 1;
  if (!Number.isSafeInteger(t) || t !== a + 1 || t > 3) throw new b(message("storage.unlockOrder"));
  const i = xn[t - 1];
  if (e.gold < i)
    throw new b(
      message("storage.unlockGold", {
        gold: i,
      }),
    );
  ((e.gold -= i), e.storage.push(...Array(ya).fill(null)), (e.storagePages = t));
}
function rt(e, t) {
  for (const a of e) {
    const i = t.find(
        (s) =>
          (a.cloudId && s.cloudId === a.cloudId) ||
          (!a.cloudId && !s.cloudId && s.id === a.id && s.name === a.name && s.job === a.job),
      ),
      n = Math.max(a.storagePages || 1, i?.storagePages || 1);
    n > (a.storagePages || 1) &&
      (a.storage.push(...Array(n * ya - a.storage.length).fill(null)), (a.storagePages = n));
  }
}
var ue = {
  cap: 10,
  experiencePerLevel: 7e4,
};
function weaponGrowthStats(e, t) {
  if (t.Type !== "Weapon" || (e.maxDura > 0 && !e.currentDura)) return {};
  const a = Math.min(ue.cap, e.weaponGrowth?.level || 0);
  return {
    Luck: Math.floor(a / 3),
    WeakSpotPercent: a * 2,
  };
}
function Ma(e, t, a) {
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
  if (n.level >= ue.cap) return;
  const s = n.level;
  for (n.xp += Math.floor(a); n.level < ue.cap && n.xp >= (n.level + 1) * ue.experiencePerLevel; )
    ((n.xp -= (n.level + 1) * ue.experiencePerLevel), n.level++);
  (n.level === ue.cap && (n.xp = 0),
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
var Sn = new Set(["MaxDC", "MaxMC", "MaxSC", "MaxAC", "MaxMAC", "Luck", "Accuracy", "Agility"]),
  Br = [
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
function we(e) {
  return e?.added.GemTier
    ? e.added.GemTier === 2
      ? 4
      : 1
    : Object.entries(e?.added || {}).reduce(
        (t, [a, i]) => t + (Sn.has(a) && Number.isFinite(i) ? Math.max(0, i) : 0),
        0,
      );
}
function kn(e, t) {
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
function Se(e) {
  return e?.locked === !0 || e?.dxFavorite === !0;
}
function equipmentLockable(e, t) {
  return !!e && !!t && t.StackSize === 1 && !!itemSlots(t)?.length && e.count === 1;
}
function assertEquipmentDisposable(e) {
  if (Se(e)) throw new b(message("manage.protected"));
}
function Pn(e, t, a) {
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
  return t ? String(e.dx?.rarity || "normal") : "q" + Math.min(8, Math.floor(we(e)));
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
function Dn(e, t, a, i = !1) {
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
        !Se(r) &&
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
function In(e, t, a) {
  const i = e.requireNPC(t);
  if (i.id !== a.NPCID || !e.rules.adaptations.universalSaleRoles.includes(i.role))
    throw new b(message("manage.shopRequired"));
  const n = Dn(t, e.defs, a.Filter, !!e.rules.adaptations.diablo?.enabled);
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
function Sa(e, t, a) {
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
    [l, f] = r.center;
  if (!c || c.solid[f * c.width + l])
    throw new b(message("core.challenges.enterChallenge.9c11bd7a83"));
  ((e.maps[i.map] = {
    actors: [],
    respawns: {},
  }),
    (e.events = e.events.filter((p) => p.map !== i.map)),
    e.consume(t, i.ticket, 1),
    (t.map = i.map),
    (t.x = l),
    (t.y = f),
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


function ka(e, t, a = message("challenge.left")) {
  const i = t.challengeRun;
  if (!i) return;
  const n = e.rules.world.maps.find((s) => s.start);
  ((t.map = n.id),
    (t.x = n.center[0]),
    (t.y = n.center[1]),
    (t.target = 0),
    (e.npc = 0),
    t.dead && ((t.dead = !1), (t.hp = Math.max(1, t.maxHP)), (t.mp = t.maxMP), (t.buffs = [])),
    delete e.maps[i.map],
    (e.events = e.events.filter((s) => s.map !== i.map)),
    delete t.challengeRun,
    e.initializeMap(n.id),
    e.bringPets(t),
    e.emit("MapChanged", {
      MapIndex: n.id,
    }),
    e.emit("NPCResponse", {
      NPCID: 0,
      Page: [],
    }),
    e.say(a));
}
function Hn(e, t) {
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
function Pa(e, t) {
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
    : (Da(e, t), (a.branch = "choice"), (a.nextWaveAt = 0), e.say(message("late.poChoice")), !0);
}
function Aa(e, t) {
  const a = t.challengeRun;
  if (!a) return;
  if (t.map !== a.map) {
    (delete e.maps[a.map],
      (e.events = e.events.filter((f) => f.map !== a.map)),
      delete t.challengeRun);
    return;
  }
  if (e.time >= (a.cleared && a.returnAt !== void 0 ? a.returnAt : a.deadline)) {
    ka(e, t, message(a.cleared ? "challenge.complete" : "challenge.timeout"));
    return;
  }
  if (!a.started || a.cleared || t.dead) return;
  const i = e.rules.adaptations.guideChallenges.find((f) => f.id === a.id),
    n = e.map(a.map);
  for (const f of i.waves.flat().filter((h) => h.at)) {
    const h = [...e.monsters.values()].find((p) => p.Name === f.monster);
    for (const p of n.actors.filter(
      (g) =>
        g.definition === h?.Index &&
        !g.dead &&
        g.special?.challenge === a.map &&
        !g.special.challengeAnchored,
    )) {
      const [g, y] = f.at;
      e.walkable(a.map, g, y, p.id) && ((p.x = g), (p.y = y), (p.special.challengeAnchored = !0));
    }
  }
  if (
    n.actors.some((f) => f.kind === "monster" && !f.friendly && !f.dead) ||
    (!a.nextWaveAt &&
      ((a.nextWaveAt = e.time + (a.wave < i.waves.length ? 2e3 : 0)), a.wave < i.waves.length)) ||
    e.time < a.nextWaveAt ||
    Pa(e, t) ||
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
  for (const f of o)
    for (let h = 0; h < f.count; h++) {
      const p = [...e.monsters.values()].find((u) => u.Name === f.monster);
      if (!p)
        throw new b(
          message("core.challenges.challengeTick.380afbda2e", {
            p0: f.monster,
          }),
        );
      let g;
      const y = f.at ? [f.at] : i.spawnPoints;
      for (let u = 0; u < y.length && !g; u++) {
        const v = y[f.at ? 0 : r++ % y.length],
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
        anchored: !!f.at,
      });
    }
  for (const { def: f, at: h, anchored: p } of c) {
    const g = e.newMonster(f, t.map, h);
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
        Da(e, t),
        Ia(e, t),
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
function Da(e, t) {
  const a = t.challengeRun;
  if (!a || a.id !== "po" || a.rewardSealed) return;
  if (isHell(e.rules)) {
    a.rewardSealed = !0;
    return;
  }
  const i = rewardState(t);
  if (
    ((a.runId ??= t.id + ":" + ++i.sequence),
    i.pending.some((r) => r.runId === a.runId) || i.claimed.includes(a.runId))
  ) {
    a.rewardSealed = !0;
    return;
  }
  const n = i.poCompletions === 0 || e.rng.next(1e4) < 2e3,
    s = e.rng.next(1e4) < 1e3,
    o = [];
  (n && o.push(e.newItem(20828, 1, !0, void 0, t)),
    s &&
      o.push(
        e.newItem(
          {
            Warrior: 20864,
            Wizard: 20865,
            Taoist: 20866,
          }[t.job],
          1,
          !0,
          void 0,
          t,
        ),
      ),
    i.poCompletions++,
    (a.rewardSealed = !0),
    o.length
      ? i.pending.push({
          runId: a.runId,
          items: o,
        })
      : i.claimed.push(a.runId));
}
function Ia(e, t) {
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
  Ia(e, t);
}
function Ha(e, t, a) {
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
  } else ((i.branch = "settle"), (i.nextWaveAt = 0), Aa(e, t));
  e.emit("NPCResponse", {
    NPCID: n.id,
    Page: [],
  });
}
function Rn(e, t) {
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
function Ne(e, t, a) {
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
function lt(e, t, a, i) {
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
function Tn(e, t, a, i) {
  const n = e.rules.adaptations.lateContent;
  if (!n || a.friendly || a.special?.trialFloor || a.special?.bossMinion) return;
  isHell(e.rules) &&
    Number(i.DreamOriginalId) === 141 &&
    n.fireAltar &&
    e.count(t, n.fireAltar.heart) < 1 &&
    e.rng.next(2) === 0 &&
    e.give(t, e.newItem(n.fireAltar.heart));
  const s = originalMonster(i),
    o = [],
    r = n.fireAltar;
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
    const f = e.newItem(l.item);
    if (
      e.insert(t.questInventory, f, 0) &&
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
function qn(e, t, a) {
  const i = e.rules.adaptations.lateContent;
  i || fail("unavailable");
  const n = i.sevenPearls,
    s = i.fireAltar,
    o = i.bloodCycle,
    r = i.secretTicket;
  if (a === "@late-pearls" || a === "@late-pearls-exchange") {
    (n || fail("unavailable"), Ne(e, t, n.npcId), checkLevel(t, n.level));
    const l = state(t);
    ((l.pearls ??= {
      active: !1,
      exchanges: 0,
    }),
      a === "@late-pearls-exchange"
        ? (l.pearls.active || fail("acceptFirst"),
          lt(
            e,
            t,
            n.materials.map((f) => ({
              item: f.item,
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
    (s || fail("unavailable"), Ne(e, t, s.npcId), checkLevel(t, s.level));
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
        ? (lt(
            e,
            t,
            s.spiritItems.map((f) => ({
              item: f,
              count: 1,
            })),
            [],
          ),
          (l.altar.stage = 2))
        : l.altar.stage === 2
          ? (lt(
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
      (l.altar.stage !== 3 && fail("altarLocked"), Sa(e, t, s.challenge));
      return;
    }
  } else if (a === "@late-blood" || a === "@late-blood-submit") {
    (o || fail("unavailable"), Ne(e, t, o.npcId), checkLevel(t, o.level));
    const l = state(t);
    if (
      ((l.blood ??= {
        stage: 0,
        cycles: 0,
      }),
      a === "@late-blood-submit")
    ) {
      const f = l.blood.stage;
      (f !== 1 && f !== 2 && fail("noSubmission"),
        lt(
          e,
          t,
          [
            {
              item: o.stages[f - 1].item,
              count: 1,
            },
          ],
          [],
        ),
        f === 1
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
    (r || fail("unavailable"), Ne(e, t, r.npcId));
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
      Ne(e, t, l.npcId),
      e.emit("ScarletSwordOptions", {
        Materials: l.materials,
        Result: l.result,
      }));
    return;
  } else fail("unavailable");
  const c = e.requireNPC(t);
  e.emit("NPCResponse", {
    NPCID: c.id,
    Page: Ra(e, t, c),
  });
}


function On(e, t, a) {
  const i = e.rules.adaptations.lateContent?.scarletSword;
  (i || fail("unavailable"),
    Ne(e, t, i.npcId),
    (!Array.isArray(a) || new Set(a).size !== a.length) && fail("selectEquipment"));
  const n = i.materials.filter((r) => e.defs.get(r.item)?.Type === "Weapon"),
    s = [];
  for (const r of n) {
    const c = a
      .map((l) => t.inventory.find((f) => f?.uid === l))
      .filter((l) => !!l && l.id === r.item);
    ((c.length !== r.count ||
      c.some(
        (l) => l.bound || l.locked || l.count !== 1 || t.equipment.some((f) => f?.uid === l.uid),
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
function Na(e, t) {
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
                      (f) =>
                        f.monster ===
                        [...e.monsters.values()].find(
                          (h) => originalMonster(h) === c.monsterOriginalId,
                        )?.Name,
                    ),
                  )
                  .map((l) => {
                    const f = [...e.monsters.values()].find(
                      (h) => originalMonster(h) === c.monsterOriginalId,
                    );
                    return {
                      map: l.id,
                      monster: f?.Name || "",
                      monsterId: f?.Index || 0,
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
function Ra(e, t, a) {
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
  for (const o of Na(e, t).filter((r) => r.npcId === a.id)) {
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
function En(e, t, a) {
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
function Ba(e, t) {
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
function Fn(e, t, a) {
  return e.adaptations.bossRewards?.entries[String(t.Index)]?.maps.includes(a.map) && !Ba(e, a)
    ? t.Drops
    : (t.MapDrops?.[String(a.map)] ?? t.Drops);
}
function Ln(e, t, a, i, n) {
  const s = Ba(e.rules, t);
  if (
    !s ||
    n.some((c) => {
      const l = e.defs.get(c.id)?.Type;
      return l && ($e.has(l) || l === "Talisman" || l === "Amulet");
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
function spiritNextXP(e, t) {
  return t >= e.cap ? 0 : (e.thresholds?.[t] ?? (t + 1) * e.experienceStep);
}
function Ot(e, t) {
  const a = e.spiritProgress;
  if (!a || a.curveVersion === 3 || !t.thresholds) return;
  let n =
      (a.curveVersion === 2
        ? [2e3, 8e3, 2e4, 6e4, 1e5, 16e4, 21e4]
        : Array.from(
            {
              length: t.cap,
            },
            (o, r) => (r + 1) * t.experienceStep,
          )
      )
        .slice(0, a.level)
        .reduce((o, r) => o + r, 0) + a.xp,
    s = 0;
  for (; s < t.cap && n >= spiritNextXP(t, s); ) ((n -= spiritNextXP(t, s)), s++);
  e.spiritProgress = {
    level: s,
    xp: s === t.cap ? 0 : n,
    curveVersion: 3,
  };
}
function Wn(e, t) {
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

var jn = {
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


function $n(e, t, a, i) {
  const n = jn[e + "/" + t + "/" + a];
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
function Ta(e) {
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
function ft(e, t) {
  const a = e.rules.adaptations.noviceProgression;
  if (!a) return !1;
  let i = Ta(t);
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
      if (!e.give(t, Xi(e.newItem(o), e.rules))) continue;
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
function Gn(e, t) {
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
function Qn(e, t) {
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
function zn(e, t, a) {
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
  const a = e.rules.adaptations.noviceProgression.spiritGrowth;
  Ot(t, a);
  const i = (t.spiritProgress ??= {
    level: 0,
    xp: 0,
    curveVersion: 3,
  });
  return {
    cfg: a,
    progress: i,
  };
}
function Vn(e, t, a) {
  if (a <= 0 || !Number.isFinite(a)) return;
  const i = e
    .map(t.map)
    .actors.filter(
      (r) =>
        isSpirit(e, r) &&
        r.master === t.id &&
        !r.dead &&
        Math.max(Math.abs(r.x - t.x), Math.abs(r.y - t.y)) <= 16,
    );
  if (!i.length) return;
  const { cfg: n, progress: s } = spiritGrowth(e, t),
    o = s.level;
  if (!(s.level >= n.cap)) {
    for (s.xp += Math.trunc(a); s.level < n.cap && s.xp >= spiritNextXP(n, s.level); )
      ((s.xp -= spiritNextXP(n, s.level)), s.level++);
    s.level >= n.cap && (s.xp = 0);
    for (const r of i)
      ((r.special ??= {}),
        Object.assign(r.special, {
          petLevel: s.level,
          petXP: s.xp,
          maxPetLevel: n.cap,
        }),
        s.level !== o &&
          (e.refreshActor(r),
          e.emit("SpiritLevelUp", {
            ObjectID: r.id,
            Level: s.level,
          })));
    s.level !== o &&
      e.say(
        message("skill.spirit.levelUp", {
          level: s.level,
        }),
      );
  }
}
function Un(e, t) {
  if (!isSpirit(e, t) || t.dead || t.hp >= t.maxHP) return;
  const a = (t.special ??= {});
  if (a.spiritRegenAt === void 0) {
    a.spiritRegenAt = e.time + 5e3;
    return;
  }
  if (e.time < Number(a.spiritRegenAt)) return;
  a.spiritRegenAt = e.time + 5e3;
  const i = t.hp;
  ((t.hp = Math.min(t.maxHP, t.hp + Math.max(1, Math.floor(t.maxHP * 0.01)))),
    t.hp > i &&
      e.emit("DamageIndicator", {
        ObjectID: t.id,
        Type: "Heal",
        Damage: t.hp - i,
      }));
}
function ut(e, t) {
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
function Ft(e, t) {
  const a = [];
  for (const i of t.adaptations.towns?.waypoints || [])
    !i.unlockOnArrival ||
      e.unlockedWaypoints?.includes(i.id) ||
      (e.map !== i.map && !(i.arrivalQuest && e.completedQuests.includes(i.arrivalQuest))) ||
      ((e.unlockedWaypoints ??= []).push(i.id), a.push(i.id));
  return a;
}
function Kn(e, t, a, i) {
  const n = e.rules.adaptations.towns?.waypoints || [],
    s = n.find((f) => f.npcId === a.id && i === "@waypointreturn-" + f.id),
    o = n.find((f) => f.stationIds.includes(a.id) && i === "@waypoint-" + f.id),
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
function Xn(e, t, a) {
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
function F(e, t, a) {
  const i = Q(t.stats, a, e.rng);
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
function _n(e, t, a, i) {
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
    const f = i.next(l + 1);
    [r[l], r[f]] = [r[f], r[l]];
  }
  for (const l of r) {
    const f = t.get(l.id).Type;
    f !== "Quest" &&
      o[
        $e.has(f) ? "equipment" : f === "Book" ? "books" : f === "Potion" ? "potions" : "materials"
      ].push(l);
  }
  (o.equipment.sort(
    (l, f) =>
      s.indexOf(String(t.get(f.id).Grade)) - s.indexOf(String(t.get(l.id).Grade)) || we(f) - we(l),
  ),
    o.books.sort((l, f) => t.get(f.id).RequiredAmount - t.get(l.id).RequiredAmount),
    o.materials.sort((l, f) => (f.added.GemTier || 0) - (l.added.GemTier || 0)));
  const c = (l) => {
    const f = new Set();
    return l.filter((h) => (f.has(h.id) ? !1 : (f.add(h.id), !0)));
  };
  return [
    ...o.equipment.slice(0, n.equipment),
    ...c(o.books).slice(0, n.books),
    ...c(o.potions).slice(0, n.potions),
    ...c(o.materials).slice(0, n.materials),
  ];
}
function Lt(e, t) {
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
  if (!s || !(n.boss || n.native?.boss || Lt(s, e.rules) !== "normal" || (o && !o.helper))) return;
  const r = bossSpawnKey(t, a),
    c = (e.bossRespawns[i.id] ??= {});
  if (!c[r]) {
    const l = e.map(t.id);
    c[r] = {
      nextAt: l.respawns[a] ?? e.time,
      available: l.actors.filter((f) => f.spawn === a && !f.dead && !f.friendly).length,
    };
  }
  return c[r];
}


function Zn(e, t) {
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
function Wt(e, t, a) {
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
function ts(e, t, a) {
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
function as(e, t) {
  if (t.friendly) return;
  const a = e.rules.adaptations.bossBehaviors,
    i = a?.entries[String(t.definition)];
  return i ? a.profiles[i.profile] : void 0;
}
function $(e, t) {
  if (!t.friendly)
    return (
      as(e, t) ??
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
function ns(e, t, a) {
  if (isHell(e.rules)) {
    ls(e, t, a);
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
      (l) => l.Weight > 0 && Object.values(l.Affixes).some((f) => f.Weight > 0 && f.Grade <= n),
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
    for (const f of ["MinAC", "MaxAC", "MinMAC", "MaxMAC"])
      t.stats[f] = Math.floor((t.stats[f] || 0) * l);
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
function Fa(e) {
  if (!(e.friendly || !e.monsterAffixes)) {
    for (const t of e.monsterAffixes)
      if (t.type === 10003)
        for (const a of ["MinAC", "MaxAC", "MinMAC", "MaxMAC"])
          e.stats[a] = Math.floor(((e.stats[a] || 0) * (100 + (t.defencePercent ?? t.low))) / 100);
  }
}
function os(e, t, a, i, n) {
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
function rs(e, t, a, i, n) {
  if (!(t.friendly || a.dead || i <= 0 || n === "None"))
    for (const s of monsterAffixEntries(t))
      s.type === 10001 &&
        e.rng.next(100) < s.rate &&
        e.buff(a, "Green", s.duration * 1e3, e.rng.next(s.high + 1, s.low), {}, t.id);
}
function cs(e, t) {
  const a = t.special,
    i = monsterAffixEntries(t).filter((n) => n.type === 10011);
  t.dead ||
    t.friendly ||
    !a ||
    !i.length ||
    e.time < Number(a.nativeAffixRegenAt) ||
    ((a.nativeAffixRegenAt = e.time + 5e3),
    t.buffs.some((n) => n.type === "Green" || n.type === "DreamPoisonArmour") ||
      (t.hp = Math.min(
        t.maxHP,
        t.hp + Math.ceil((t.maxHP * i.reduce((n, s) => n + s.low, 0)) / 100),
      )));
}
function ls(e, t, a) {
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
  for (let f = 0; f < o; f++) {
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
      [y, u] = g[e.rng.next(g.length)];
    (t.monsterAffixes.push({
      group: p.ID,
      tier: y,
      type: p.Type,
      low: u.LowValue,
      high: u.HighValue,
      rate: p.Rate,
      duration: u.Dura,
    }),
      (l.affixDrop = Math.min(
        65535,
        Math.trunc(Math.fround(Number(l.affixDrop) + Math.fround(u.MagicAdd * Math.fround(1.2)))),
      )),
      (l.magicAdd = (Number(l.magicAdd) + u.MagicAdd) & 65535),
      (l.expAdd = Math.min(65535, Number(l.expAdd) + u.ExpAdd)),
      f === 0 &&
        ((l.nativeAffixType = p.Type),
        (l.nativeAffixLow = u.LowValue),
        (l.nativeAffixHigh = u.HighValue),
        (l.nativeAffixRate = p.Rate),
        (l.nativeAffixDuration = u.Dura),
        (l.nativeAffixRegenAt = e.time + 5e3)),
      (t.name = u.Name + " \xB7 " + t.name));
  }
  for (const f of t.monsterAffixes)
    f.type === 10003 && (f.defencePercent = e.rng.next(f.high + 1, f.low));
  (Fa(t),
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
function ds(e, t, a, i = !1) {
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
function fs(e, t) {
  if (!$(e, t)?.ownerBound) return !1;
  const a = t.master ? e.actor(t.master) : void 0;
  return t.special?.bossMinion && (!a || a.dead || a.map !== t.map) ? (e.die(t, t), !0) : !1;
}
function us(e, t, a, i, n = 3, s) {
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
      const f = e.freeNear(t.map, t, n);
      if (!f) break;
      ((l.x = f.x),
        (l.y = f.y),
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
    const [f, h] = V[(l * 2) % 8],
      p = s?.cardinal
        ? {
            x: t.x + f * n,
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
function pt(e, t, a, i, n) {
  const s = (t.special ??= {});
  if (
    (a.requiredHPBelow !== void 0 && t.hp >= a.requiredHPBelow) ||
    (a.requiredHPBelowPercent !== void 0 && t.hp >= (t.maxHP * a.requiredHPBelowPercent) / 100) ||
    (a.once && s[i + "Done"]) ||
    e.time < Number(s[i + "At"] ?? a.initialDelayMs ?? 0) ||
    (a.chancePercent !== void 0 && e.rng.next(100) >= a.chancePercent)
  )
    return !1;
  for (const o of a.adds) us(e, t, o.nativeId, o.count, a.radius, a);
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
        Direction: E[t.dir],
        Spell: "None",
        Duration: a.actionMs,
      })),
    !0
  );
}


function ms(e, t, a) {
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
        Wa(
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
    A(t, c) > i.activationRange
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
      (A(t, c) > p.minDistance || y) &&
      e.time >= Number(n.bossTeleportAt ?? p.initialDelayMs ?? 0) &&
      (g === void 0 || e.time - Number(g) > (p.afterAttackMs ?? 0))
    ) {
      const u = y ? e.actor(c.master) : void 0,
        v = u?.kind === "player" && !u.dead && u.map === t.map && !e.safe(u) ? u : c,
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
      pt(e, t, i.summon, "bossSummon", c))
    )
      return;
  }
  const f = i.healthStages;
  if (f && t.maxHP >= f.count) {
    const p = Math.trunc(t.hp / Math.trunc(t.maxHP / f.count));
    if (
      p < Number(n.stage ?? f.count) &&
      (f.rageMs && (n.madUntil = e.time + f.rageMs), f.summonSettings)
    ) {
      const g = e.map(t.map).actors.filter((y) => y.master === t.id && !y.dead).length;
      for (let y = 0; y < Math.min(f.summonWave, f.summonLimit - g); y++) {
        const u = e.rules.monsterSettings[f.summonSettings[e.rng.next(f.summonSettings.length)]],
          v = e.rules.monsters.find((M) => M.Name === u),
          x = e.freeNear(t.map, t, f.summonRadius);
        if (!v || !x) continue;
        const m = e.newMonster(v, t.map, x);
        ((m.master = t.id),
          (m.target = t.target),
          (m.actionAt = e.time + f.summonDelayMs),
          (m.special = {
            ...m.special,
            bossMinion: !0,
          }),
          e.map(t.map).actors.push(m));
      }
    }
    n.stage = Math.min(Number(n.stage ?? f.count), p);
  }
  const h = i.escape;
  if (
    h &&
    e.time >= Number(n.teleAt || 0) &&
    ((n.teleAt = e.time + h.intervalMs),
    V.filter(([p, g]) => !e.walkable(t.map, t.x + p, t.y + g, t.id)).length >= h.blockedNeighbours)
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
function La(e, t, a) {
  const i = (t.special ??= {}),
    n = a.woundedSelection,
    s = !!n && t.hp < (n.hpBelow ?? (t.maxHP * n.hpBelowPercent) / 100);
  if ((s && (i.bossWoundedSelection = !0), a.distanceSelection)) {
    const v = e.actor(t.target);
    return v && A(t, v) > a.distanceSelection.threshold
      ? a.distanceSelection.far
      : a.distanceSelection.near;
  }
  const o = a.forceAttack,
    r = e.actor(t.target),
    c = a.attacks[Number(i.bossSelectedAttack ?? 0)],
    l = r ? Math.abs(t.x - r.x) : 0,
    f = r ? Math.abs(t.y - r.y) : 0,
    h = !!r && (A(t, r) > (c.range ?? a.range) || !!(c.alignedOnly && l && f && l !== f));
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
        pt(e, t, o.summon, "bossForcedSummon")),
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
    u = 0;
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
      u = v;
      break;
    }
  }
  return ((i.bossSelectedAttack = u), u);
}
function ps(e, t) {
  const a = $(e, t);
  if (!a || !["nativePercent", "nativeModulo"].includes(a.selection)) return a?.range;
  const i = La(e, t, a),
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
    : a.recoverBeforeInterval && (t.attackAt = Number(t.special?.[s] ?? 0) + Be(e, t));
  const o = e.actor(t.target),
    r = o ? Math.abs(o.x - t.x) : 0,
    c = o ? Math.abs(o.y - t.y) : 0;
  return o &&
    ((n.alignedOnly && r && c && r !== c) || r > (n.rangeX ?? 1 / 0) || c > (n.rangeY ?? 1 / 0))
    ? 0
    : (n.range ?? a.range);
}
function hs(e, t, a) {
  const i = $(e, t);
  if (!i) return !1;
  const n = (t.special ??= {}),
    s = Number(n.bossAttackPhase || 0) % i.attacks.length;
  let o = s;
  if (
    (["nativePercent", "nativeModulo"].includes(i.selection) && (o = La(e, t, i)),
    i.selection === "weighted")
  ) {
    const g = i.attacks.reduce((u, v) => u + (v.weight || 0), 0);
    let y = e.rng.next(g);
    o = i.attacks.findIndex((u) => (y -= u.weight || 0) < 0);
  }
  const r = i.attacks[o],
    c = Math.abs(a.x - t.x),
    l = Math.abs(a.y - t.y);
  if (
    (r.alignedOnly && c && l && c !== l) ||
    c > (r.rangeX ?? 1 / 0) ||
    l > (r.rangeY ?? 1 / 0) ||
    (["nativePercent", "nativeModulo"].includes(i.selection) &&
      (A(t, a) > (r.range ?? i.range) || A(t, a) < (r.minimumDistance ?? 0)))
  )
    return !0;
  if (
    (delete n.bossSelectedAttack,
    (n.bossAttackPhase = s + 1),
    (n.bossLastAttackAt = e.time),
    (t.dir = direction(t, a)),
    t.dir < 0 && (t.dir = 0),
    (t.attackAt = e.time + Be(e, t)),
    (t.actionAt =
      e.time + (r.actionMs ?? (i.actionMs === 300 ? monsterActionCost(e, t, !0) : i.actionMs))),
    i.selection === "cycle" &&
      e.monsters.get(t.definition)?.DreamRaw &&
      (t.attackAt = t.actionAt + Be(e, t)),
    (n.bossRecoverAt = t.actionAt),
    (n["bossActionRecover" + o] = t.actionAt),
    r.teleportToTarget)
  ) {
    const g = r.teleportToTarget.petOwner && a.master ? e.actor(a.master) : void 0,
      y = g && !g.dead && g.map === t.map && !e.safe(g) ? g : a,
      u = e.freeNear(t.map, y, r.teleportToTarget.radius);
    u &&
      ((t.x = u.x),
      (t.y = u.y),
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
  r.groundFire && Os(e, t, a, r.groundFire);
  const f = r.animation ?? i.animation ?? "ObjectAttack",
    h = r.visual ?? i.visual ?? "None",
    p = r.visualPerTarget ?? i.visualPerTarget;
  if (
    (r.casterVisual &&
      e.emit("ObjectRangeAttack", {
        ObjectID: t.id,
        Direction: E[t.dir],
        TargetID: t.id,
        Spell: r.casterVisual,
        Action: r.visualAction,
        Duration: r.visualDurationMs ?? r.actionMs ?? i.actionMs,
      }),
    p ||
      e.emit(f, {
        ObjectID: t.id,
        Direction: E[t.dir],
        TargetID: a.id,
        Spell: h,
        Duration: r.visualDurationMs ?? r.actionMs ?? i.actionMs,
        Action: r.visualAction,
        Cast: f === "ObjectMagic",
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
      (n.guideSummoned && (n.attackSummonDone = !0), pt(e, t, i.attackSummon, "attackSummon")),
    r.summon &&
      (n.guideSummoned && (n["actionSummon" + o + "Done"] = !0),
      pt(e, t, r.summon, "actionSummon" + o)),
    r.channel &&
      ((n.bossChannelIndex = o),
      (n.bossChannelNext = e.time + r.channel.intervalMs),
      (n.bossChannelUntil = e.time + r.channel.durationMs)),
    Wa(e, t, a, i, r, r.hits),
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
        Direction: E[t.dir],
      })),
    !0
  );
}
function Wa(e, t, a, i, n, s) {
  const o = (t.special ??= {}),
    r = i.randomPerTarget ? 0 : Q(t.stats, "DC", e.rng),
    c = [e.me, ...e.map(t.map).actors.filter((p) => p.friendly)].filter(
      (p) => p && !p.dead && p.map === t.map && !e.safe(p),
    ),
    l = n.animation ?? i.animation ?? "ObjectAttack",
    f = n.visual ?? i.visual ?? "None",
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
        const [u, v] = V[t.dir];
        return (
          A(y, {
            x: t.x + u * (p.forward ?? 2),
            y: t.y + v * (p.forward ?? 2),
          }) <= p.radius
        );
      }
      if (p.shape === "line") {
        const [u, v] = V[t.dir],
          x = u ? (y.x - t.x) / u : (y.y - t.y) / v;
        return x > 0 && x <= p.radius && y.x === t.x + x * u && y.y === t.y + x * v;
      }
      return y.id === a.id && A(t, y) <= Math.max(n.range ?? i.range, p.radius);
    });
    if (
      (p.scatterRadius !== void 0 &&
        (g = g.flatMap((u) => c.filter((v) => A(v, u) <= p.scatterRadius))),
      h &&
        e.emit("ObjectMagic", {
          ObjectID: t.id,
          Cast: !0,
          Direction: E[t.dir],
          Action: n.visualAction,
          Duration: n.visualDurationMs ?? n.actionMs ?? i.actionMs,
        }),
      h)
    )
      for (const y of new Map(g.map((u) => [u.id, u])).values())
        e.emit(l, {
          ObjectID: t.id,
          Direction: E[t.dir],
          TargetID: y.id,
          Spell: f,
          Action: n.visualAction,
          Duration: n.visualDurationMs ?? n.actionMs ?? i.actionMs,
        });
    g.some((y) => y.kind === "player") && (o.bossLastPlayerHitAt = e.time);
    for (const y of g) {
      const u = i.randomPerTarget ? Q(t.stats, "DC", e.rng) : r;
      let v =
          p.currentHPScale !== void 0
            ? Math.floor(y.hp * p.currentHPScale)
            : p.maxHPScale !== void 0
              ? Math.floor(y.maxHP * p.maxHPScale)
              : Math.floor(((p.defence === "None" && t.stats.MaxDC) || u) * p.scale),
        x = p.defence;
      if (
        (p.addPowerToHPScale &&
          (y.kind === "player" ? (v += u) : (v = Math.floor(y.maxHP * (p.petsMaxHPScale ?? 0)))),
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
          (n.hitDelayMs ?? i.hitDelayMs) + A(t, y) * (i.distanceDelayMs ?? 0),
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


function bs(e, t, a, i, n) {
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
    const f = "bossStatusAt:" + n + ":" + l.type;
    if (e.time < Number(c[f] ?? (n === "DragonParalysis" ? c.dragonParalysisAt : 0) ?? 0)) continue;
    const h = l.powerStat
      ? Q(t.stats, l.powerStat, e.rng)
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
      l.cooldownMs && (c[f] = e.time + l.cooldownMs));
  }
}
function gs(e, t, a, i, n) {
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
function ys(e, t) {
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
      !0);
}
function ja(e, t, a, i, n) {
  if (!e.rules.skills.some((m) => m.DreamSkill)) return !1;
  let s = e.skill(t, i);
  if (i !== "None" && !s?.d.DreamSkill) return !1;
  const o = ot(t.level, t.stats, !0);
  ((t.dir = direction(t, n || a)),
    (t.attackAt = e.time + o),
    (t.actionAt = e.time + Math.min(550, o)),
    (t.regenAt = e.time + 1e4));
  const r = F(e, t, "DC"),
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
  const f = (m, M, P = "AC", w = i) =>
    m ? e.schedule("hit", 350, t, m, Math.trunc(M), P, w) : void 0;
  let h = !1,
    p = i;
  if (s && ["HalfMoon", "WhirlwindSlash"].includes(i)) {
    const m = de(s.d, s.level, t.stats);
    t.mp < m ? (i = "None") : (t.mp -= m);
  }
  if (s && ["FlamingSword", "BlazingSword"].includes(i)) {
    const m = Math.trunc(Math.fround(r * Math.fround(dreamCoefficient(s.d, s.level))));
    if ((f(a, m), (t.attackModes[l] = !1), (h = !0), i === "BlazingSword"))
      for (const M of c) {
        const P = A(t, M);
        M !== a &&
          direction(t, M) === t.dir &&
          P >= 2 &&
          P <= 5 &&
          f(M, Math.trunc(Math.fround(m * Math.fround(1 - (P - 1) * 0.1))));
      }
  } else if (s && ["HalfMoon", "WhirlwindSlash"].includes(i)) {
    for (const m of c) {
      const M = (direction(t, m) - t.dir + 8) % 8;
      if (A(t, m) !== 1 || (i === "HalfMoon" && ![7, 0, 1, 2, 3].includes(M))) continue;
      const P = f(
        m,
        m === a ? r : Math.trunc(Math.fround(r * Math.fround(dreamCoefficient(s.d, s.level)))),
        m === a ? "AC" : "ACNoArmor",
      );
      P &&
        i === "WhirlwindSlash" &&
        m !== a &&
        e.monsters.get(m.definition).Level <= t.level &&
        e.rng.next(100) < Math.min(100, s.level * 2) &&
        (P.effect = {
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
    u = g ? 20 : 0,
    v = y ? Math.min(20, 6 + 2 * y.level) : 0,
    x = u + v > 0 ? e.rng.next(100) : 100;
  if (g && x < u)
    (f(a, Math.trunc(((t.stats.MaxDC || 0) * (14 + g.level)) / 10), "AC", "Slaying"),
      ["FlamingSword", "BlazingSword"].includes(i) || (p = "Slaying"),
      (h = !0));
  else if (y && x < u + v) {
    const m = Math.trunc(Math.fround(F(e, t, "DC") * Math.fround(dreamCoefficient(y.d, y.level))));
    for (const M of c) {
      const P = A(t, M);
      direction(t, M) === t.dir &&
        P >= 1 &&
        P <= 3 &&
        f(M, Math.trunc(Math.fround(m * Math.fround(1 - (P - 1) * 0.1))), "AC", "SkyCleaver");
    }
    (["FlamingSword", "BlazingSword"].includes(i) || (p = "SkyCleaver"), (h = !0));
  }
  if (!h && (f(a, r, "AC", "None"), s && i === "Thrusting")) {
    const m = de(s.d, s.level, t.stats);
    if (t.mp >= m) {
      t.mp -= m;
      const [M, P] = V[t.dir];
      for (const w of c)
        w.x === t.x + M * 2 &&
          w.y === t.y + P * 2 &&
          f(
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
      Direction: E[t.dir],
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
  const o = Math.trunc(F(e, i, "SC") / 2);
  return (
    a +
    Math.max(
      Math.trunc(o * (0.6 + 0.3 * n.level)),
      Math.trunc(o * 2 * (petInheritance(e, t)?.attack || 0) + 1e-9),
    )
  );
}
function vs(e, t, a, i, n) {
  if (t.special?.dreamPet && t.master) {
    const c = e.roles.find((f) => f.id === t.master),
      l = e.monsters.get(t.definition)?.DreamOriginalId;
    if (c && !t.special?.dreamTamed && l !== 144) {
      const f = petInheritance(e, t);
      if (f) {
        const h = l === 99 ? 27 : [14, 62].includes(Number(l) || 0) ? 24 : 0,
          p = h ? Math.max(0, c.stats["NativeState:" + h] || 0) * 0.0625 : 0,
          g = F(e, c, "SC"),
          y = l === 99 ? Math.trunc(Math.fround(g / 1.2)) : g;
        return i + Math.trunc(g * f.attack + y * p + 1e-9);
      }
      if (l === 99 || l === 62) {
        const h = e.skill(c, l === 99 ? "SummonTiger" : "AdvancedSummon");
        if (h) {
          const p = h.s.Level,
            g = F(e, c, "SC"),
            y = l === 99 ? Math.trunc(Math.fround(Math.fround(g) / Math.fround(1.2))) : g,
            u = Math.fround(l === 99 ? Math.min(0.5, 0.2 + p / 10) : Math.min(0.9, 0.3 + p / 5)),
            v = Math.max(0, Math.trunc(c.stats["NativeState:" + (l === 99 ? 27 : 24)] || 0)),
            x = Math.fround(u + Math.fround(Math.fround(v) * 0.0625));
          i += Math.trunc(Math.fround(y * x));
        }
      } else if (l === 14 || l === 29) {
        const h = e.skill(c, "SummonShinsu");
        if (h) {
          const p = Math.fround(
              Math.min(l === 14 ? 0.5 : 1, (l === 14 ? 0.2 : 0.3) + h.s.Level / 10),
            ),
            g = l === 14 ? Math.max(0, c.stats["NativeState:24"] || 0) * 0.0625 : 0;
          i += Math.trunc(Math.fround(F(e, c, "SC") * Math.fround(p + g)));
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
function $a(e, t, a, i) {
  if (i === "None" || t.kind !== "player" || a <= 0) return a;
  const n = t,
    s = n.buffs.find((c) => c.type === "MagicShield");
  if (s && e.skill(n, "MagicShield")?.d.DreamSkill) {
    const c = Math.min(10, e.skill(n, "MagicShield").level),
      l = Math.min(3, c),
      f = Math.fround(0.17),
      h = Math.fround(l * f),
      p = Math.min(Math.fround(h + Math.fround(F(e, n, "MC") / 1024)), Math.fround(h + f)),
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
function Ms(e, t, a, i) {
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
function ws(e, t, a) {
  const i = (t.nativeHealing ??= []);
  a > 0 &&
    i.length < 4 &&
    i.push({
      remaining: Math.trunc(a),
      chunk: Math.max(1, Math.trunc(a / 5)),
      next: e.time + 1e3,
    });
}
function Ss(e, t) {
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
function ks(e, t, a, i, n, s = i, o) {
  if (a.kind !== "player" || n === "None" || a.dead) return;
  const r = a,
    c = r.buffs.find((f) => f.type === "InnateQi"),
    l = r.buffs.find((f) => f.type === "DiamondBody");
  if (c) {
    const f = e.skill(r, "InnateQi")?.level || c.value;
    Ms(e, r, Math.trunc((i * f) / 10), f >= 6 ? 2 : f >= 4 ? 3 : 4);
  }
  if (!(o === "DiamondReflect" || o === "NativeReflect")) {
    if (l && !t.dead) {
      const f = e.skill(r, "DiamondBody")?.level || l.value,
        h = Math.min(3, f);
      e.rng.next(15) < f &&
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


function Ps(e, t, a) {
  if (a.type !== "DragonFlame" || t.kind !== "player") return;
  const i = t,
    n = e.skill(i, "DragonFlame");
  if (n)
    for (const s of e
      .map(t.map)
      .actors.filter((o) => o.kind === "monster" && !o.friendly && !o.dead && A(o, t) <= 2))
      e.damage(t, s, magicDamage(n.d, a.value, F(e, t, "MC"), e.rng), "MAC", "DragonFlame");
}
function Ga(e, t, a) {
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
var ht = (e) => e.special?.visible !== !1,
  targetableMonster = (e) => ht(e) && !e.special?.stoned,
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
var Cs = (e, t) =>
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
  Be = (e, t) => {
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
function Ds(e, t, a) {
  if (isChallengeChest(e.monsters.get(t.definition), e.rules)) return ((t.target = 0), !1);
  if (fs(e, t)) return !1;
  cs(e, t);
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
        (f) =>
          A(t, f) <= (i.visible ? (r?.hideRange ?? (n.AI === 14 ? 7 : 3)) : (r?.emergeRange ?? 3)),
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
    if (e.time >= t.actionAt && s.some((l) => A(t, l) <= (c?.wakeRange ?? 2)))
      for (const l of e
        .map(t.map)
        .actors.filter(
          (f) =>
            (!!$(e, f)?.stone || (!$(e, f) && [15, 17].includes(f.ai || 0))) &&
            !f.dead &&
            A(f, t) <= (c?.groupRange ?? 14),
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
      (t.art = l ? "Shinsu1" : "Shinsu"),
      (t.actionAt = e.time + 1e3),
      e.emit(l ? "ObjectShow" : "ObjectHide", {
        ObjectID: t.id,
      }));
  }
  if ((ms(e, t, a), !o && [11, 17].includes(n.AI) && t.maxHP >= 7)) {
    const l = Math.trunc(t.hp / Math.trunc(t.maxHP / 7));
    if (l < Number(i.stage ?? 7))
      if (n.AI === 11) i.madUntil = e.time + 8e3;
      else {
        const f = Math.min(
          8,
          40 - e.map(t.map).actors.filter((h) => h.master === t.id && !h.dead).length,
        );
        for (let h = 0; h < f; h++) {
          const p = e.rules.monsterSettings["Zuma" + (e.rng.next(7) + 1)],
            g = e.rules.monsters.find((v) => v.Name === p);
          if (!g) continue;
          const y = e.freeNear(t.map, t, 3);
          if (!y) continue;
          const u = e.newMonster(g, t.map, y);
          ((u.master = t.id),
            (u.target = t.target),
            (u.actionAt = e.time + 2e3),
            e.map(t.map).actors.push(u));
        }
      }
    i.stage = Math.min(Number(i.stage ?? 7), l);
  }
  if (
    !o &&
    n.AI === 11 &&
    e.time >= Number(i.teleAt || 0) &&
    ((i.teleAt = e.time + 1e4),
    V.filter(([f, h]) => !e.walkable(t.map, t.x + f, t.y + h, t.id)).length >= 5)
  )
    for (let f = 0; f < 100; f++) {
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
function Is(e, t) {
  if (e.ai === 8 || e.ai === 38 || e.ai === 55) return 6;
  if (e.ai === 18) {
    const a = Math.abs(e.x - t.x),
      i = Math.abs(e.y - t.y);
    return (a <= 1 && i <= 1) || a === i || a % 2 === i % 2 ? 2 : 0;
  }
  if (e.ai === 14) return 7;
  if (e.ai === 26) {
    const a = Math.abs(e.x - t.x),
      i = Math.abs(e.y - t.y);
    return a === 0 || i === 0 || a === i ? 6 : 0;
  }
  return 1;
}
function Hs(e, t, a) {
  const i = t.special || (t.special = {});
  if (t.ai === 2 && i.runAway) return (Va(e, t, a), !0);
  const n = $(e, t),
    s = n?.retreat;
  return (s || (!n && t.ai === 8)) && e.time >= t.attackAt && e.time >= Number(i.fearUntil || 0)
    ? ((i.fearUntil = e.time + (s?.intervalMs ?? 5e3)),
      A(t, a) >= (s?.range ?? 6) ? e.stepTowards(t, a) : Va(e, t, a),
      !0)
    : !1;
}
function Va(e, t, a) {
  if (e.time < t.moveAt) return;
  let i = direction(a, t);
  if ((i < 0 && (i = t.dir), e.move(t, i))) return;
  const n = e.rng.next(2) ? -1 : 1;
  for (let s = 1; s < 8; s++) if (e.move(t, (i + n * s + 8) % 8)) return;
}
function Ns(e, t, a) {
  if (isSpirit(e, t)) {
    ((t.dir = direction(t, a)),
      (t.attackAt = e.time + Be(e, t)),
      (t.actionAt = e.time + 600),
      e.emit("ObjectRangeAttack", {
        ObjectID: t.id,
        Direction: E[t.dir],
        TargetID: a.id,
        Spell: "SoulFireBall",
        Duration: 600,
      }),
      e.schedule("hit", 500, t, a, Q(t.stats, "DC", e.rng), "MAC", "SpiritServantBolt"));
    return;
  }
  if (hs(e, t, a) || (t.ai === 18 && !t.special?.mode && !t.special?.dreamPet)) return;
  ((t.dir = direction(t, a)),
    t.dir < 0 && (t.dir = 0),
    (t.attackAt = e.time + Be(e, t)),
    (t.actionAt = e.time + monsterActionCost(e, t, !0)),
    e.monsters.get(t.definition)?.DreamRaw && (t.attackAt = t.actionAt + Be(e, t)),
    e.emit(
      t.ai === 55
        ? "Magic"
        : [8, 26, 38].includes(t.ai || 0)
          ? "ObjectRangeAttack"
          : "ObjectAttack",
      {
        ObjectID: t.id,
        Direction: E[t.dir],
        TargetID: a.id,
        Location: {
          X: t.x,
          Y: t.y,
        },
        Spell: t.ai === 55 ? "ThunderBolt" : "None",
        Cast: t.ai === 55,
        Target: a,
      },
    ));
  const i = moonSpiritAttackPower(e, t, Q(t.stats, t.ai === 55 ? "MC" : "DC", e.rng)),
    n = t.friendly
      ? e
          .map(t.map)
          .actors.filter((s) => s.kind === "monster" && !s.friendly && targetableMonster(s))
      : [e.me, ...e.map(t.map).actors.filter((s) => s.friendly)];
  if (t.ai === 14)
    for (const s of n.filter((o) => o && !o.dead && A(o, t) <= 7))
      e.schedule("hit", 500, t, s, i, "MAC", "EvilCentipede");
  else if (t.ai === 26 || t.ai === 18) {
    const [s, o] = V[t.dir];
    for (let r = 1; r <= (t.ai === 18 ? 2 : 6); r++)
      for (const c of n.filter((l) => l && !l.dead && l.x === t.x + s * r && l.y === t.y + o * r))
        e.schedule(
          "hit",
          (t.ai === 18 ? 500 : 300) + r * 50,
          t,
          c,
          i,
          t.ai === 18
            ? Number(e.monsters.get(t.definition)?.DreamRaw?.Weight || 0) & 1
              ? "MAC"
              : "ACAgility"
            : "MACAgility",
        );
  } else {
    const s = e.schedule(
      "hit",
      t.ai === 8 ? 500 + A(t, a) * 50 : [38, 55].includes(t.ai || 0) ? 500 : 300,
      t,
      a,
      i,
      [38, 55].includes(t.ai || 0)
        ? "MAC"
        : [7, 10, 11, 17].includes(t.ai || 0)
          ? "MACAgility"
          : "ACAgility",
      t.ai === 7 ? "CaveMaggot" : void 0,
    );
    isHell(e.rules) && t.ai !== 55 && (s.monsterBasicAttack = !0);
  }
}


var Rs = 6;
function Qt(e, t, a, i) {
  const n = e.geometry.get(t);
  if (!n) return !1;
  let s = a.x,
    o = a.y;
  const r = Math.abs(i.x - s),
    c = Math.abs(i.y - o),
    l = s < i.x ? 1 : -1,
    f = o < i.y ? 1 : -1;
  let h = r - c;
  for (let p = 0; p < 64; p++) {
    if (s < 0 || o < 0 || s >= n.width || o >= n.height || n.solid[o * n.width + s]) return !1;
    if (s === i.x && o === i.y) return !0;
    const g = h * 2;
    (g > -c && ((h -= c), (s += l)), g < r && ((h += r), (o += f)));
  }
  return !1;
}
function enemy(e) {
  return e.kind === "monster" && !e.dead && !e.friendly && targetableMonster(e);
}
var Ue = new WeakMap();
function Bs(e, t) {
  const a = Ue.get(t);
  if (!a) return !1;
  if (t.dead || t.map !== a.map || e.time > a.until) return (Ue.delete(t), !1);
  if (e.time < Math.max(t.spellAt, t.actionAt)) return !0;
  Ue.delete(t);
  try {
    Ka(e, t, {
      ...a.data,
      Queue: !1,
    });
  } catch (i) {
    e.say(Ht(i));
  }
  return !0;
}
function Ka(e, t, a) {
  const i = e.skill(t, "Hydra");
  if (!i || t.job !== "Wizard" || t.dead || mountedItem(e, t) || e.time < i.s.CastTime) return;
  const n = de(i.d, i.level, t.stats);
  if (t.mp < n) throw new b(message("core.magic.castMagic.26f1ab23c0"));
  if (e.time < Math.max(t.spellAt, t.actionAt)) {
    a.Queue === !0 &&
      t.assist?.autoMagic &&
      Ue.set(t, {
        map: t.map,
        until: e.time + 3e3,
        data: {
          ...a,
        },
      });
    return;
  }
  Ue.delete(t);
  const s = e.actor(Number(a.TargetID)),
    o = s && s.map === t.map && enemy(s) && A(t, s) <= i.d.Range ? s : void 0,
    [r, c] = V[t.dir];
  let l = o ?? {
    x: t.x + r * 2,
    y: t.y + c * 2,
  };
  if (a.AutoPlace !== !0 && a.Location) {
    const v = {
      x: Number(a.Location.X),
      y: Number(a.Location.Y),
    };
    if (!Number.isInteger(v.x) || !Number.isInteger(v.y) || A(t, v) > i.d.Range)
      throw new b(message("core.dream-magic.castDream.8ec455055d"));
    l = v;
  }
  const f = [];
  for (let v = l.y - 2; v <= l.y + 2; v++)
    for (let x = l.x - 2; x <= l.x + 2; x++)
      f.push({
        x,
        y: v,
      });
  f.sort((v, x) => A(v, l) - A(x, l) || A(v, t) - A(x, t) || v.y - x.y || v.x - x.x);
  const h = f.find(
    (v) => A(t, v) <= i.d.Range && e.walkable(t.map, v.x, v.y, t.id) && Qt(e, t.map, t, v),
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
  const u = dreamCastDelay(t.stats);
  ((t.mp -= n),
    (i.s.CastTime = e.time + i.d.DreamSkill.cooldown),
    (t.spellAt = e.time + u),
    (t.actionAt = e.time + Math.min(600, u)),
    e.emit("Magic", {
      ObjectID: t.id,
      Spell: "Hydra",
      Cast: !0,
      Direction: E[t.dir],
      Target: h,
      TargetID: 0,
    }));
}
function Ts(e, t) {
  const a = e.actor(t.target);
  if (!a || a.kind !== "player" || a.dead || a.map !== t.map) {
    t.expires = e.time;
    return;
  }
  if (t.dead || e.time >= (t.expires ?? 0) || e.time < t.attackAt) return;
  const i = e.map(t.map).actors.filter((c) => enemy(c) && A(t, c) <= Rs && Qt(e, t.map, t, c));
  i.sort(
    (c, l) =>
      +(l.id === t.stats.preferred) - +(c.id === t.stats.preferred) ||
      A(t, c) - A(t, l) ||
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
    r = Math.min(900, Math.max(160, A(t, n) * 65));
  (e.schedule(
    "hit",
    200 + r,
    a,
    n,
    magicDamage(s.d, t.stats.level, F(e, a, "MC"), e.rng),
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
      Direction: E[t.dir],
    }));
}
function Xa(e, t, a) {
  const i = a.spell,
    n = a.level || 0,
    s = !!e.skill(t, i)?.d.DreamSkill,
    o = a.location,
    r = i === "FireWall",
    c = i === "Blizzard" || i === "MeteorStrike" || i === "DragonFlame",
    l = c ? 2 : 1,
    f =
      a.durationMs ??
      (s && r
        ? Math.min((F(e, t, "MC") + 3 * n) * 500, [0, 8e3, 12e3, 15e3, 18e3, 21e3, 24e3][n] ?? 25e3)
        : s && i === "PoisonCloud"
          ? 3e3 + F(e, t, "SC") * 100
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
    for (let u = o.x - l; u <= o.x + l; u++) {
      if (
        (r && Math.abs(u - o.x) + Math.abs(y - o.y) > 1) ||
        u < 0 ||
        y < 0 ||
        u >= p.width ||
        y >= p.height ||
        p.solid[y * p.width + u]
      )
        continue;
      const v = e
        .map(t.map)
        .actors.find(
          (x) =>
            x.spell === i && x.x === u && x.y === y && !x.dead && (x.expires ?? 1 / 0) > e.time,
        );
      if (v) {
        (r || i === "PoisonCloud" || i === "DragonFlame") &&
          ((v.expires = e.time + f), (v.target = t.id));
        continue;
      }
      (e.map(t.map).actors.push({
        id: e.nextId++,
        kind: "spell",
        name: i,
        spell: i,
        map: t.map,
        x: u,
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
        expires: e.time + f,
      }),
        (g = !1));
    }
}
function qs(e, t) {
  if (t.spell === "Hydra") {
    Ts(e, t);
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
      (o) => o && !o.dead && o.map === t.map && !e.safe(o) && A(o, t) === 0,
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
        n.kind === "monster" && !n.dead && !n.friendly && targetableMonster(n) && A(n, t) === 0,
    );
  t.spell === "HealingCircle" && A(a, t) === 0 && !a.healHP && a.hp < a.maxHP && (a.healHP += 25);
  for (const n of i) {
    const s = ["FireWall", "PoisonCloud", "DragonFlame"].includes(t.spell),
      o = s ? e.skill(a, t.spell) : void 0;
    if (s && !o) continue;
    let r = o
      ? magicDamage(o.d, o.level, F(e, a, t.spell === "PoisonCloud" ? "SC" : "MC"), e.rng)
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
function Os(e, t, a, i) {
  const n = i.spell ?? "NativeDragonFireWall",
    s = e.geometry.get(t.map),
    o = e.monsters.get(t.definition).Stats;
  for (let r = a.y - i.radius; r <= a.y + i.radius; r++)
    for (let c = a.x - i.radius; c <= a.x + i.radius; c++) {
      if (c < 0 || r < 0 || c >= s.width || r >= s.height || s.solid[r * s.width + c]) continue;
      const l = e
        .map(t.map)
        .actors.find(
          (f) => f.spell === n && f.x === c && f.y === r && !f.dead && (f.expires ?? 0) > e.time,
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
function Es(e, t, a, i, n) {
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
  const s = 5e3 + F(e, t, "SC") * 200,
    o = Math.trunc(F(e, t, "SC") / 4);
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
function Fs(e, t) {
  const a =
    e.rules.adaptations.monsterCombat?.deathBursts?.[
      String(e.monsters.get(t.definition)?.DreamOriginalId)
    ];
  if (!a || t.friendly || t.special?.deathBurstDone) return;
  (t.special ??= {}).deathBurstDone = !0;
  const i = [
    e.me,
    ...e.map(t.map).actors.filter((n) => n.kind === "monster" && n.friendly && n.master),
  ].filter((n) => n && !n.dead && n.map === t.map && A(t, n) <= a.radius && !e.safe(n));
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


var bt = 8e3;
function isSnowPotion(e) {
  return (
    e.Type === "Potion" &&
    (e.Index === 20260 || e.DreamOriginalId === 260 || e.DreamName === "\u4E07\u5E74\u96EA\u971C")
  );
}
function itemCooldownRemaining(e, t, a) {
  return isSnowPotion(t) ? Math.max(0, Math.min(bt, (e.itemCooldowns?.snow || 0) - a)) : 0;
}
function Ws(e, t, a) {
  isSnowPotion(t) && ((e.itemCooldowns ??= {}).snow = a + bt);
}
var _a = 4e3;
function isSunPotion(e) {
  return e.Type === "Potion" && e.Shape === 1 && [670, 671, 21231].includes(e.Index);
}
function sunPotionRemaining(e, t) {
  return Math.max(0, Math.min(_a, (e.sunPotionAt || 0) - t));
}
var Ut = new WeakMap();
function Za(e) {
  let t = Ut.get(e);
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
      Ut.set(e, t)),
    t
  );
}
function js(e, t) {
  const a = Ut.get(e);
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
function $s(e, t, a, i) {
  const n = Za(e);
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
function Gs(e, t) {
  const a = Za(e);
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
function Qs(e, t, a, i, n, s, o = () => !1) {
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
      const P = o(m.id);
      r.set(m.id, P === !0 ? 1 / 0 : P === !1 ? 0 : Math.max(0, Math.floor(P)));
    }
    const M = r.get(m.id);
    M > 0 && (c.add(m), r.set(m.id, M - m.count));
  }
  const l = (m) => c.has(m),
    f = !n && a.next(100) < i.ordinaryBurstPercent,
    h = e.filter((m) => recoveryPotion(t.get(m.id)) && !l(m)),
    p = e.filter((m) => !recoveryPotion(t.get(m.id)) || l(m)),
    g = n ? i.bossMaxPotions : f ? i.burstMaxPotions : i.ordinaryMaxPotions;
  if (h.length && a.next(100) < i.potionChancePercent)
    for (let m = 0; m < g && h.length; m++) p.push(...h.splice(a.next(h.length), 1));
  const y = (m) =>
      l(m)
        ? 100
        : $e.has(t.get(m.id).Type)
          ? 50 +
            we(m) * 2 +
            (m.affixes?.length ? 10 : 0) +
            Math.min(7, Number(t.get(m.id).DreamGrade) || 0)
          : t.get(m.id).Type === "Book"
            ? 40
            : recoveryPotion(t.get(m.id))
              ? 0
              : 10,
    u = (f ? i.ordinaryBurstMax : i.ordinaryMax) - (s > 0 ? 1 : 0);
  p.sort((m, M) => y(M) - y(m));
  const v = p.filter((m) => l(m)),
    x = p.filter((m) => !l(m));
  return {
    items: [...v, ...x.slice(0, Math.max(0, u - v.length))],
    gold: s,
    burst: f,
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
var gt = new Set([19, 1001, 43]);
function Vs(e, t) {
  const a = e.affixes || [],
    i = a.filter((s) => t[s.group]?.Prefix).length,
    n = a.findIndex((s) => t[s.group]?.Prefix && !gt.has(s.type));
  return n >= 0 ? n : i < 3 ? a.findIndex((s) => !t[s.group]?.Prefix && !gt.has(s.type)) : -1;
}
function Xt(e) {
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
var yt = new WeakMap();
function markNaturalAffixGeneration(e, t) {
  yt.set(e, {
    magicFind: t,
  });
}
function markAffixPointDistribution(e, t) {
  yt.set(e, {
    pointWeights: t,
  });
}
function Xs(e) {
  const t = yt.get(e);
  return (yt.delete(e), t);
}
function Js(e, t, a, i, n) {
  const s = Xt(t),
    o = Vs(e, i);
  if (o < 0 || !(s.speed + s.luck)) return;
  if (n + 1e-10 < s.speed + s.luck)
    throw new Error(`Affix channel capacity ${t.Index}: q=${n} < ${s.speed + s.luck}`);
  const r = Math.round((1e4 * s.speed) / n),
    c = Math.round((1e4 * s.luck) / n),
    l = a.next(1e4);
  let f = 0;
  if (l < r) {
    const g = t.Stats.MaxDC || 0,
      y = t.Stats.MaxMC || 0,
      u = t.Stats.MaxSC || 0,
      v = t.RequiredClass === "Warrior" || g > Math.max(y, u),
      x = ["Wizard", "Taoist"].includes(t.RequiredClass) || Math.max(y, u) > g;
    f =
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
  } else l < r + c && (f = 1032);
  if (!f) return;
  const h = i[f];
  if (!h) throw new Error(`Missing controlled affix ${f}`);
  const p = h.Affixes[1];
  e.affixes.some((g) => g.type === h.Type || (f !== 1032 && [19, 1001].includes(g.type))) ||
    (e.affixes[o] = {
      group: f,
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
function Jt(e, t, a, i) {
  if (i.mode === "hell") return;
  const n = Xs(e),
    s = effectiveAffixGrade(t),
    o = i.affixDropPolicy?.linkedExceptional,
    r = Math.min(8, Math.floor(we(e)));
  if (!o || !i.affixes || r < 1 || e.added.GemTier || e.affixes?.length || !(s > 0)) return;
  const c = o.chanceByEquipmentGrade?.[String(s)] ?? o.chanceByStars;
  if (a.next(100) >= c[r]) return;
  const l =
    o.highStarCounts && r >= o.highStarCounts.minStars
      ? o.highStarCounts.countWeights
      : o.countWeights;
  let f = a.next(l.reduce((y, u) => y + u, 0)),
    h = 1;
  for (; h < l.length && f >= l[h - 1]; ) f -= l[h++ - 1];
  const p = Xt(t),
    g =
      p.speed + p.luck
        ? Ys(
            t,
            i,
            n ?? {
              stars: r,
            },
          )
        : void 0;
  wt(e, t, a, i.affixes, h, g?.normalizer);
}
var ti = new WeakMap();
function _s(e, t, a) {
  let i = ti.get(t);
  i || ((i = new Map()), ti.set(t, i));
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
        g = p.reduce((y, u) => y + u, 0);
      return (
        (c[Math.min(8, h)] / 100) * p.reduce((y, u, v) => y + (u / g) * Qi(e, t.affixes, v + 1), 0)
      );
    };
  let f = 0;
  if ("stars" in a) f = l(a.stars);
  else if ("pointWeights" in a) {
    const h = Object.values(a.pointWeights).reduce((p, g) => p + g, 0);
    f = Object.entries(a.pointWeights).reduce((p, [g, y]) => p + (y / h) * l(Number(g)), 0);
  } else {
    const h = t.pointWeights.reduce((y, u) => y + u, 0),
      p = t.pointWeights.map(() => 0);
    for (let y = 0; y < 32768; y++) {
      let u = y % h,
        v = 0;
      for (; u >= t.pointWeights[v]; ) u -= t.pointWeights[v++];
      p[v]++;
    }
    f =
      (Math.max(
        0,
        Math.min(
          100,
          Math.floor((100 * Math.max(0, a.magicFind)) / (Math.max(0, a.magicFind) + 250)) +
            (t.exceptionalGradeBonusPercent?.[String(n)] || 0),
        ),
      ) /
        100) *
      p.reduce((y, u, v) => y + (u / 32768) * l(v + 1), 0);
  }
  return (i.set(s, f), f);
}
function Ys(e, t, a) {
  const i = Xt(e),
    n = _s(e, t, a),
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
function Zs(e, t) {
  const a = trialState(t),
    i = e.rules.adaptations.trial,
    n = i.titles[a.title - 1],
    s = i.titles[a.title],
    o = (l, f = {}) => ({
      $dialogue: [
        {
          label: message(l, f),
        },
      ],
    }),
    r = (l, f) => ({
      $dialogue: [
        {
          label: message(l),
          action: f,
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


function eo(e, t, a, i = Math.floor((Date.now() + 8 * 36e5) / 864e5)) {
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
      const c = t.inventory.filter((f) => f && e.defs.get(f.id)?.DreamName === r),
        l = c.find((f) => !Se(f)) || c[0];
      if ((assertEquipmentDisposable(l), !l))
        throw new b(
          message("core.trial.trialAction.3ac3294db7", {
            p0: entityText("items", e.rules.items.find((f) => f.DreamName === r).Index),
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
      Ke(e, t, message("trial.complete"));
      return;
    }
    const c = n.floors[r.floor],
      l = e.rules.adaptations.dreamRuntime?.hell?.trialCandidates,
      f =
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
    (xt(t),
      r.floor++,
      (r.cleared = !1),
      (e.map(t.map).actors = e
        .map(t.map)
        .actors.filter((g) => g.friendly || g.kind !== "monster")));
    const p = e.newMonster(f, t.map, h);
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
      ));
  } else if (a === "@trialleave") {
    Ke(e, t);
    return;
  }
  e.emit("NPCResponse", {
    NPCID: s.id,
    Page: [],
  });
}
function xt(e) {
  const t = e.trialRun;
  if (!t) return;
  const a = Math.max(0, t.pendingHonor || 0);
  (a && t.settledFloor !== t.floor && ((trialState(e).honor += a), (t.settledFloor = t.floor)),
    (t.pendingHonor = 0));
}
function to(e, t) {
  const a = t.trialRun;
  if (!a || a.cleared || t.map !== e.rules.adaptations.trial.map) return;
  const i = e.rules.adaptations.trial.floors[a.floor - 1];
  i &&
    ((a.cleared = !0),
    (a.pendingHonor = i.honor),
    isHell(e.rules) || xt(t),
    e.say(
      message("core.trial.trialKill.a5ad08e078", {
        p0: a.floor,
        p1: i.honor,
      }),
    ),
    a.floor === 99 && Ke(e, t, message("trial.completeFinal")));
}
function Ke(e, t, a = message("trial.left")) {
  if (!t.trialRun) return;
  xt(t);
  const i = e.rules.adaptations.trial,
    n = i.map,
    s = e.rules.world.npcs.find((c) => c.id === i.entranceNpc),
    o = [];
  for (let c = 1; c <= 3; c++)
    for (let l = -c; l <= c; l++)
      for (let f = -c; f <= c; f++)
        Math.max(Math.abs(f), Math.abs(l)) === c &&
          o.push({
            x: s.at[0] + f,
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
function ao(e, t) {
  t.trialRun &&
    (t.map !== e.rules.adaptations.trial.map || e.time >= t.trialRun.deadline) &&
    Ke(e, t, message("trial.ended"));
}
function craftingState(e) {
  return (e.crafting ??= {
    stage: 0,
    skills: {},
  });
}
function io(e, t, a = !1) {
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
function no(e, t, a, i = 1) {
  if (a === "talent") return;
  const n = craftingState(t).skills[a];
  n && ((n.xp += i), ii(e, t, a, !0));
}
function ii(e, t, a, i = !1) {
  const n = t.crafting?.skills[a],
    s =
      e.rules.adaptations.dreamRuntime?.hell?.craftingExperience[a] ??
      e.rules.adaptations.forge.crafting.experience;
  if (!(!n || a === "talent"))
    for (; n.level < (a === "equipment" ? 10 : 9) && n.xp >= s[n.level - 1]; )
      ((n.xp -= s[n.level - 1]),
        n.level++,
        i &&
          e.say(
            message("core.crafting.craftXP.6339b79af5", {
              p0: n.level,
            }),
          ));
}
function ni(e, t, a) {
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
        Math.floor((a.reduce((s, o) => s + we(o), 0) * 10) / a.length)
      : 0;
}
function si(e, t, a) {
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
var Zt = ["MaxDC", "MaxMC", "MaxAC", "MaxSC", "MaxMAC", "Luck", "Accuracy", "Agility"];
function forgePoints(e) {
  return Zt.reduce((t, a) => t + Math.max(0, e.added[a] || 0), 0);
}
function oi(e, t, a) {
  const i = e.rules.adaptations.forge;
  if (!i) throw new b(message("core.forge.forgeQuote.135a98ae94"));
  let n, s;
  if (a.Mode === "cube") {
    const k = a.Selected;
    if (!Array.isArray(k) || !k.length || k.length > 8 || new Set(k).size !== k.length)
      throw new b(message("core.forge.forgeQuote.26b7c68817"));
    const I = k.map(
      (R) =>
        t.inventory.find((D) => D?.uid === R) ||
        t.questInventory.find(
          (D) =>
            D &&
            D.uid === R &&
            i.recipes.some((z) => z.mode === "pandora" && z.inputs.some((Y) => Y.item === D.id)),
        ),
    );
    if (I.some((R) => !R || R.id === i.boxId))
      throw new b(message("core.forge.forgeQuote.052dc5ca26"));
    const H = I;
    (H.forEach(assertEquipmentDisposable), (s = [...k]));
    const N = H.find((R) => R.id === i.mixId);
    if (N) {
      n = N.uid;
      const R = H.filter((D) => D !== N);
      a = {
        Mode: "mix",
        Target: R[0]?.uid,
        Selected: R.map((D) => D.uid),
      };
    } else {
      const R = i.recipes.find(
        (z) =>
          z.mode === "pandora" &&
          H.every((Y) => z.inputs.some((ne) => ne.item === Y.id)) &&
          z.inputs.every(
            (Y) =>
              H.filter((ne) => ne.id === Y.item).reduce((ne, ve) => ne + ve.count, 0) >= Y.count,
          ),
      );
      if (!R) throw new b(message("core.forge.forgeQuote.e098ab1670"));
      const D = [];
      for (const z of R.inputs) {
        let Y = z.count;
        for (const ne of H.filter((ve) => ve.id === z.item)) {
          const ve = Math.min(Y, ne.count);
          (ve &&
            D.push({
              uid: ne.uid,
              count: ve,
            }),
            (Y -= ve));
        }
      }
      if (D.length !== H.length) throw new b(message("core.forge.forgeQuote.2933c380f0"));
      a = {
        Mode: "recipe",
        Recipe: R.id,
        Ingredients: D,
      };
    }
  }
  const o = String(a.Mode),
    r = t.inventory.find((k) => k?.uid === Number(a.Target)),
    c = t.inventory.find((k) => k?.uid === Number(a.Material));
  if (o === "identify") throw new b(message("core.forge.forgeQuote.66a920f6f4"));
  const l = [],
    f = [],
    h = [],
    p = [...t.inventory, ...t.questInventory].filter((k) => !!k && !Se(k));
  let g = "",
    y = "",
    u = 0,
    v = "",
    x = [],
    m,
    M = -1,
    P = 0;
  if (o === "recipe") {
    if (((m = i.recipes.find((I) => I.id === String(a.Recipe))), !m))
      throw new b(message("core.forge.forgeQuote.db530d007a"));
    if (m.mode === "pandora" && !t.inventory.some((I) => I?.id === i.boxId))
      throw new b(message("core.forge.forgeQuote.68ef58e0c7"));
    m.skill &&
      m.skill !== "talent" &&
      craftLevel(t, m.skill) < (m.level || 1) &&
      (y = message("forge.requirement", {
        skill: entityText("crafting", m.skill),
        level: m.level || 1,
      }));
    const k = m.processing ? Math.min(5, Math.max(1, Math.floor(Number(a.Count) || 1))) : 1;
    if (
      (l.push(
        ...m.inputs.map((I) => ({
          ...I,
          count: I.count * k,
        })),
      ),
      f.push(m.output),
      (u = m.gold * k),
      (g = message("recipe." + m.id, {
        output: entityText("items", m.output.item),
        input: entityText("items", m.inputs[0].item),
      })),
      a.Ingredients !== void 0)
    ) {
      if (!Array.isArray(a.Ingredients)) throw new b(message("core.forge.forgeQuote.bbacd00f52"));
      const I = new Set();
      for (const H of a.Ingredients) {
        const N = p.find((D) => D.uid === H.uid),
          R = H.count;
        if (
          !N ||
          I.has(N.uid) ||
          !Number.isSafeInteger(R) ||
          R < 1 ||
          R > N.count ||
          !l.some((D) => D.item === N.id)
        )
          throw new b(message("core.forge.forgeQuote.96c6a05c19"));
        (I.add(N.uid),
          h.push({
            uid: N.uid,
            item: N.id,
            count: R,
          }));
      }
      if (
        l.some(
          (H) => h.filter((N) => N.item === H.item).reduce((N, R) => N + R.count, 0) !== H.count,
        )
      )
        throw new b(message("core.forge.forgeQuote.0ef60a70ef"));
    } else
      for (const I of l) {
        let H = I.count;
        for (const N of p
          .filter((R) => R.id === I.item)
          .sort(
            (R, D) =>
              (R.materialQuality || 0) - (D.materialQuality || 0) ||
              forgePoints(R) - forgePoints(D) ||
              R.uid - D.uid,
          )) {
          if (H <= 0) break;
          const R = Math.min(H, N.count);
          (h.push({
            uid: N.uid,
            item: N.id,
            count: R,
          }),
            (H -= R));
        }
      }
    x = h.map((I) => I.uid);
  } else if (o === "mix") {
    if (!t.inventory.some((D) => D?.id === i.boxId))
      throw new b(message("core.forge.forgeQuote.68ef58e0c7"));
    if (!r) throw new b(message("core.forge.forgeQuote.eacdc6ab6e"));
    const k = e.defs.get(r.id),
      I = Number(k.DreamGrade);
    if (
      ![0, 2, 3, 4, 5, 6, 7].includes(I) ||
      String(k.DreamName || k.Name).startsWith("\u5929\u9F99\u9879\u94FE")
    )
      throw new b(message("core.forge.forgeQuote.23eb261b8e"));
    const H = Array.isArray(a.Selected)
        ? a.Selected.map(Number)
        : [
            r.uid,
            ...t.inventory
              .filter((D) => !!D && D.id === r.id && D.uid !== r.uid && !Se(D))
              .sort((D, z) => forgePoints(D) - forgePoints(z) || D.uid - z.uid)
              .slice(0, 2)
              .map((D) => D.uid),
          ],
      N = H.map((D) => t.inventory.find((z) => z?.uid === D));
    if (
      (N.forEach(assertEquipmentDisposable),
      new Set(H).size !== H.length ||
        N.length < 3 ||
        N.some((D) => !D || D.id !== r.id || D.count !== 1))
    )
      throw new b(message("core.forge.forgeQuote.ab95b8372e"));
    if (N.some((D) => D && forgePoints(D) >= 8))
      throw new b(message("core.forge.forgeQuote.44a4cbc171"));
    if (isHell(e.rules) && N.some((D) => D?.handmade))
      throw new Error("\u624B\u5DE5\u88C5\u5907\u4E0D\u80FD\u4F7F\u7528\u6DF7\u5143\u77F3\u3002");
    const R = isHell(e.rules) ? hellMixChance(N.map((D) => forgePoints(D))) : i.mixChance;
    ((P = R),
      isHell(e.rules) && (u = 15e3 * (Math.max(...N.map((D) => forgePoints(D))) + 1)),
      (x = H),
      l.push({
        item: i.mixId,
        count: 1,
      }),
      (g = message("forge.mixDescription", {
        count: N.length,
        chance: R,
      })));
  } else if (o === "merge") {
    const k = i.essences.find((H) => H.item === c?.id),
      I = k && i.essences.find((H) => H.grade === k.grade + 1 && H.stat === k.stat);
    if (!k || !I) throw new b(message("core.forge.forgeQuote.5f2745c8a9"));
    if (r) throw new b(message("core.forge.forgeQuote.ce273c94ef"));
    ((u = i.fees.merge * k.grade),
      l.push({
        item: k.item,
        count: 20,
      }),
      f.push({
        item: I.item,
        count: 1,
      }),
      (g = message("forge.mergeDescription")));
  } else {
    if (!r || r.count !== 1) throw new b(message("core.forge.forgeQuote.46f045e474"));
    const k = e.defs.get(r.id),
      I = Number(k.DreamGrade),
      H = forgePoints(r);
    if (
      !k.DreamType ||
      (["dismantle", "enhance", "reset", "crystal"].includes(o) &&
        !e.rules.adaptations.dreamRuntime?.statPools[String(k.DreamType)])
    )
      throw new b(message("core.forge.forgeQuote.436bf1d625"));
    if (o === "identify") throw new b(message("core.forge.forgeQuote.66a920f6f4"));
    if (o === "awaken") {
      if (!r.handmade && !k.DreamRawItem?.Handmake)
        throw new b(message("core.forge.forgeQuote.f8a3c820c0"));
      if (k.Type !== "Weapon" && Number(k.DreamType) !== 6 && k.DreamName !== "\u5357\u74DC\u5934")
        throw new b(message("core.forge.forgeQuote.884a71edee"));
      if (H < 1) throw new b(message("core.forge.forgeQuote.8184c98ae7"));
      if (r.affixes?.length) throw new b(message("core.forge.forgeQuote.29047386ac"));
      if (
        !Object.values(e.rules.adaptations.dreamRuntime.affixes).some(
          (R) =>
            R.Weight > 0 &&
            Object.values(R.Poses).includes(Number(k.DreamType)) &&
            Object.values(R.Affixes).some((D) => D.Grade <= I),
        )
      )
        throw new b(message("core.forge.forgeQuote.1d1dbf9d26"));
      const N = i.crafting?.talents[String(c?.id)];
      if (!N) throw new b(message("core.forge.forgeQuote.db1c5e9058"));
      ((v = String(Math.min(N, k.Type === "Weapon" ? 5 : 3))),
        l.push({
          item: c.id,
          count: 1,
        }),
        (g = message("forge.awakenDescription", {
          count: v,
        })));
    } else if (o === "potential" || o === "potentialChoose") {
      if (!r.handmade && !k.DreamRawItem?.Handmake)
        throw new b(message("core.forge.forgeQuote.92addbc485"));
      if (o === "potentialChoose") {
        if (!r.potentialOptions?.[Number(a.Choice)])
          throw new b(message("core.forge.forgeQuote.6c861e241a"));
        ((v = String(a.Choice)), (g = message("forge.chooseDescription")));
      } else {
        if ((r.potentialOptions?.length || 0) >= 5)
          throw new b(message("core.forge.forgeQuote.fd4b3dca21"));
        const N = e.defs.get(c?.id || 0),
          R = Number(N?.DreamRawItem?.Hide || 0);
        if (!String(N?.DreamName).startsWith("\u6F5C\u80FD\u77F3"))
          throw new b(message("core.forge.forgeQuote.369f9d002e"));
        const D = k.Type === "Stone" && k.DreamType === 16 ? "Gem" : k.Type,
          z = Math.min(R, Number(k.DreamPotentialCap ?? k.DreamGrade)),
          Y = Object.keys(i.potentials?.[D] || {})
            .map(Number)
            .filter((ne) => ne <= z);
        if (!Y.length) throw new b(message("core.forge.forgeQuote.874ec5991e"));
        ((v = D + ":" + Math.max(...Y)),
          l.push({
            item: c.id,
            count: 1,
          }),
          (g = message("forge.potentialDescription", {
            attempt: (r.potentialOptions?.length || 0) + 1,
          })));
      }
    } else if (o === "crystal") {
      if (String(k.DreamName).startsWith("\u5929\u9F99\u9879\u94FE"))
        throw new b(message("core.forge.forgeQuote.e612e0c45e"));
      const N = Number(e.defs.get(c?.id || 0)?.DreamRawItem?.Hide || 0);
      if (!String(e.defs.get(c?.id || 0)?.DreamName).startsWith("\u51DD\u6676\u77F3") || N < I)
        throw new b(message("core.forge.forgeQuote.6cdf3f0a25"));
      if (!i.fees.crystalByStoneGrade[String(N)] || I < 1)
        throw new b(message("core.forge.forgeQuote.555a0b953e"));
      if (H >= 8) throw new b(message("core.forge.forgeQuote.21ff3969ad"));
      ((u = i.fees.crystalByStoneGrade[String(N)] * (H + 1)),
        (P = (I >= 5 ? i.crystalRates.highGrade : i.crystalRates.normal)[H]),
        l.push({
          item: c.id,
          count: 1,
        }),
        (g = message("forge.crystalDescription", {
          from: H,
          to: H + 1,
          chance: P,
          loss: i.crystalLoseChance,
        })));
    } else if (o === "reset") {
      if (H < 1) throw new b(message("core.forge.forgeQuote.6df3648484"));
      if (H > 8) throw new b(message("core.forge.forgeQuote.1da2e99ec4"));
      (l.push({
        item: i.resetId,
        count: 1,
      }),
        (u = i.fees.reset * Math.max(1, I - 6) * H),
        (g = message("forge.resetDescription", {
          points: H,
        })));
    } else {
      if (I < 2 || I > 6) throw new b(message("core.forge.forgeQuote.3d24a74942"));
      if (o === "dismantle") {
        assertEquipmentDisposable(r);
        for (const N of ["MaxDC", "MaxMC", "MaxSC"]) {
          const R = r.added[N] || 0;
          if (R > 0) {
            const D = i.essences.find((z) => z.grade === I - 1 && z.stat === N);
            if (!D) throw new b(message("core.forge.forgeQuote.0e4b96e457"));
            f.push({
              item: D.item,
              count: R,
            });
          }
        }
        if (!f.length) throw new b(message("core.forge.forgeQuote.95fd5267e7"));
        ((u = i.fees.dismantle * (I - 1) * f.reduce((N, R) => N + R.count, 0)),
          (g = message("forge.dismantleDescription")));
      } else if (o === "enhance") {
        const N = i.essences.find((R) => R.item === c?.id && R.grade >= I);
        if (!N)
          throw new b(
            message("core.forge.forgeQuote.5c90c49396", {
              p0: I,
            }),
          );
        if (H >= 5) throw new b(message("core.forge.forgeQuote.9d820f44c6"));
        ((v = N.stat),
          l.push({
            item: N.item,
            count: H < 3 ? 1 : H === 3 ? 2 : 3,
          }),
          (u = i.fees.enhance * I * (H + 1)),
          (g = message("forge.enhanceDescription", {
            from: H,
            to: H + 1,
            stat: message("gear.stat." + v.slice(3)),
          })));
      } else throw new b(message("core.forge.forgeQuote.eecbe4c7a3"));
    }
  }
  m &&
    !y &&
    l.some((k) => h.filter((I) => I.item === k.item).reduce((I, H) => I + H.count, 0) < k.count) &&
    (y = message("forge.insufficient"));
  const w = new Map();
  for (const k of l) w.set(k.item, (w.get(k.item) || 0) + k.count);
  const C = !y && [...w].every(([k, I]) => e.count(t, k) >= I) && t.gold >= u,
    q = h.map((k) => ({
      ...p.find((I) => I.uid === k.uid),
      count: k.count,
    })),
    L = m ? ni(t, m, q) : 0,
    W = m?.handmade
      ? si(
          e,
          {
            id: m.output.item,
          },
          q,
        )
      : void 0;
  return {
    mode: o,
    selected: x,
    allocations: h,
    outputQuality: L,
    outputStars: W,
    requirement: y,
    recipe: m,
    affixIndex: M,
    target: r?.uid,
    inputs: [...w].map(([k, I]) => ({
      item: k,
      count: I,
    })),
    outputs: f,
    gold: u,
    description: g,
    stat: v,
    chance: P,
    canForge: C,
    cubeMaterial: n,
    cubeSelection: s,
  };
}


function so(e, t, a) {
  const i = oi(e, t, a);
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
      .map((f) => [...t.inventory, ...t.questInventory].find((h) => h?.uid === f))
      .filter(Boolean)
      .map((f) => structuredClone(f));
    if (i.recipe) {
      for (const f of c) f.count = i.allocations.find((h) => h.uid === f.uid).count;
      for (const f of i.allocations) {
        const h = t.inventory.some((g) => g?.uid === f.uid) ? t.inventory : t.questInventory,
          p = h.find((g) => g?.uid === f.uid);
        ((p.count -= f.count), p.count || (h[h.indexOf(p)] = null));
      }
    } else if (i.cubeMaterial) {
      const f = t.inventory.find((h) => h?.uid === i.cubeMaterial);
      --f.count === 0 && (t.inventory[t.inventory.indexOf(f)] = null);
    } else for (const f of i.inputs) e.consume(t, f.item, f.count);
    const l = t.inventory.find((f) => f?.uid === i.target);
    if (i.mode === "identify" && l) for (const f of l.affixes || []) f.revealed = !0;
    if (
      (i.mode === "awaken" &&
        l &&
        wt(l, e.defs.get(l.id), e.rng, e.rules.adaptations.dreamRuntime.affixes, Number(i.stat)),
      i.mode === "potential" && l)
    ) {
      const [f, h] = i.stat.split(":"),
        p = e.rules.adaptations.forge.potentials[f][h],
        g = structuredClone(p[e.rng.next(p.length)]);
      ((l.potentialOptions ??= []),
        (l.potential = {
          ...g,
          rolls: l.potentialOptions.length + 1,
        }),
        l.potentialOptions.push(l.potential));
    }
    if (
      (i.mode === "potentialChoose" && l && (l.potential = l.potentialOptions[Number(i.stat)]),
      i.mode === "mix")
    ) {
      const f = c.sort((h, p) => forgePoints(p) - forgePoints(h) || h.uid - p.uid)[0];
      for (const h of i.selected) t.inventory[t.inventory.findIndex((p) => p?.uid === h)] = null;
      if (isHell(e.rules)) {
        const h = e.rng.next(1e4) < hellMixChance(c.map(forgePoints)) * 100,
          p = e.newItem(f.id);
        if ((Xe(e, p, h ? Math.min(5, forgePoints(f) + 1) : forgePoints(f)), !e.give(t, p, !1)))
          throw new Error("\u80CC\u5305\u7A7A\u95F4\u4E0D\u8DB3");
        r = message(h ? "forge.mixSuccess" : "forge.mixFailed");
      } else {
        if (e.rng.next(100) < e.rules.adaptations.forge.mixChance) {
          const h = Math.min(8, forgePoints(f) + 1);
          (Xe(e, f, h),
            delete f.affixes,
            delete f.potential,
            delete f.potentialOptions,
            delete f.weaponGrowth,
            (r = message("forge.mixSuccess")));
        } else r = message("forge.mixFailed");
        if (!e.give(t, f, !1)) throw new b(message("core.forge.forge.f4f8709c7f"));
      }
    }
    if (i.mode === "crystal" && l) {
      const f = forgePoints(l),
        h = e.rules.adaptations.forge;
      let p = f;
      (e.rng.next(100) < i.chance
        ? ((p = f + 1), (r = message("forge.crystalSuccess")))
        : e.rng.next(100) < h.crystalLoseChance
          ? ((p = Math.max(0, f - 1)), (r = message("forge.crystalLost")))
          : (r = message("forge.crystalFailed")),
        Xe(e, l, p));
    }
    (i.mode === "dismantle" &&
      (t.inventory[t.inventory.findIndex((f) => f?.uid === i.target)] = null),
      i.mode === "enhance" && l && (l.added[i.stat] = (l.added[i.stat] || 0) + 1),
      i.mode === "reset" && l && Xe(e, l, forgePoints(l)));
    for (const f of i.outputs) {
      const h = e.newItem(f.item, f.count);
      if (((h.bound = i.mode === "recipe"), i.recipe)) {
        const p = i.recipe,
          g = ni(t, p, c);
        (g && (h.materialQuality = g),
          p.handmade &&
            ((h.handmade = !0),
            Xe(e, h, si(e, h, c)),
            e.rules.adaptations.dreamRuntime &&
              Jt(h, e.defs.get(h.id), e.rng, e.rules.adaptations.dreamRuntime)),
          p.skill && no(e, t, p.skill, p.experience || 1));
      }
      if (!e.give(t, h, !1)) throw new b(message("core.forge.forge.98d59f5b62"));
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
function Xe(e, t, a) {
  const i = e.defs.get(t.id),
    n = Object.values(
      e.rules.adaptations.dreamRuntime.statPools[String(i.DreamType)]?.rawPool || {},
    );
  if (!n.length && a) throw new b(message("core.forge.randomizePoints.124368ca68"));
  for (const s of Zt) delete t.added[s];
  for (let s = a; s > 0; ) {
    const o = Zt[n[e.rng.next(n.length)]];
    if (!o) throw new b(message("core.forge.randomizePoints.8530d28df1"));
    const r = e.rng.next(s) + 1;
    ((t.added[o] = (t.added[o] || 0) + r), (s -= r));
  }
}
function Te(e) {
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
  return e.defaultMagicFind + Te(e).magicFindBonus + Math.max(0, t);
}
function dreamItemDropMultiplier(e, t = 0) {
  const a = e?.casual;
  return (
    (e?.mode === "hell" ? 2 : a?.enabled ? a.baseDropMultiplier + a.dropAdd : 1) +
    (Te(e).dropBonusPercent + Math.max(0, t)) / 100
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
var oo = ["MaxDC", "MaxMC", "MaxAC", "MaxSC", "MaxMAC", "Luck", "Accuracy", "Agility"];
function ro(e, t, a, i, n = dreamMagicFind(i)) {
  if (
    (markNaturalAffixGeneration(e, n),
    !i.statPools[String(t.ExceptionalPoolType ?? t.DreamType)]?.rawPool ||
      a.next(100) >= dreamEquipmentExceptionalChance(i, effectiveAffixGrade(t), n))
  )
    return;
  let o = a.next(32768) % i.pointWeights.reduce((c, l) => c + l, 0),
    r = 0;
  for (; o >= i.pointWeights[r]; ) o -= i.pointWeights[r++];
  li(e, t, a, i, r + 1);
}
function li(e, t, a, i, n) {
  const s = i.statPools[String(t.ExceptionalPoolType ?? t.DreamType)]?.rawPool;
  if (!s) return;
  const o = Object.values(s);
  for (let r = 0; n > 0 && r < 100; r++) {
    const c = oo[o[a.next(o.length)]],
      l = a.next(n + 1, 1);
    c && ((e.added[c] = (e.added[c] || 0) + l), (n -= l));
  }
}
function di(e, t) {
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
function ui(e, t, a, i, n = 0) {
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
function hi(e, t) {
  const a = t.adaptations.chestItems?.chests[String(e.id)];
  if (!a || e.chestReward || e.count !== 1) return;
  const i = (Math.imul(e.uid | 0, 1664525) ^ Math.imul(e.id, 1013904223)) | 0,
    n = new Nt(i),
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
function co(e, t, a) {
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
    f = a.id === c.key ? a : t.inventory.find((v) => v?.id === c.key);
  if (!l) throw new b(message("core.chest-items.useChestItem.54352aa4d3"));
  if (!f) throw new b(message("core.chest-items.useChestItem.6518e82aa7"));
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
  const u = e.newItem(h.item);
  return (
    e.rules.adaptations.dreamRuntime &&
      (markAffixPointDistribution(u, c.points),
      li(u, p, e.rng, e.rules.adaptations.dreamRuntime, h.points),
      Jt(u, p, e.rng, e.rules.adaptations.dreamRuntime)),
    (t.inventory[g] = null),
    n(f),
    (t.inventory[y] = u),
    e.emit("GainedItem", {
      Item: {
        ItemIndex: u.id,
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


function Pe(e, t) {
  const a = e.equipment[3],
    i = [t.adaptations.testTalisman, t.adaptations.combatTestTalisman].find(
      (n) => n && n.itemId === a?.id,
    );
  return i && a?.id === i.itemId && (!a.maxDura || a.currentDura > 0) ? i : void 0;
}
function lo(e, t) {
  const a = Pe(e, t);
  if (!a) {
    e.special && delete e.special.testTalismanRegenAt;
    return;
  }
  for (const i of ["DC", "MC", "SC"])
    for (const n of ["Min", "Max"])
      e.stats[n + i] = Math.trunc((e.stats[n + i] || 0) * a.combatMultiplier);
  for (const i of ["HP", "MP"]) e.stats[i] = Math.trunc((e.stats[i] || 0) * a.vitalityMultiplier);
}
function fo(e, t, a) {
  const i = Pe(e, t);
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
var uo = {
    SummonSpiritServant: -1,
    SummonSkeleton: 29,
    SummonShinsu: 14,
    AdvancedSummon: 62,
    SummonTiger: 99,
    SummonMoonSpirit: 144,
  },
  mo = new Set(["Thrusting", "HalfMoon", "WhirlwindSlash", "FlamingSword", "BlazingSword"]);
function bi(e, t, a, i, n) {
  const s = a.Spell[0].toLowerCase() + a.Spell.slice(1),
    o = e.skill(t, a.Spell).s;
  if (n && ["FlamingSword", "BlazingSword"].includes(a.Spell)) {
    if (e.time < o.CastTime) throw new b(message("core.dream-magic.toggleDream.427a35f43e"));
    const r = de(a, i, t.stats);
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
function po(e) {
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
function ho(e, t, a, i) {
  const n = e.skill(t, a.Spell).s.Level,
    s = a.Spell === "SummonTiger" && n >= 4 ? n - 3 : Math.min(3, n),
    o = a.Spell === "SummonTiger" && n >= 4 ? 116 : uo[a.Spell],
    r = a.Spell === "SummonSpiritServant",
    c = e.rules.monsters.find((u) =>
      r
        ? u.Index === e.rules.adaptations.noviceProgression?.spiritMonster
        : u.DreamOriginalId === o,
    );
  if (!c) throw new b(message("core.dream-magic.summonDream.b6561f1b76"));
  const l = r || a.Spell === "SummonSkeleton" ? 1 : 2,
    f = r ? 1 : s >= 3 ? 2 : 1;
  for (const u of pets(e, t).filter(
    (v) => v.special?.dreamFamily === l && v.definition !== c.Index,
  ))
    ((u.dead = !0), (u.hp = 0), (u.expires = e.time));
  const h = pets(e, t).filter((u) => u.definition === c.Index),
    p = r ? spiritGrowth(e, t) : null,
    g = r
      ? p.progress.level
      : Math.min(
          7,
          s + Math.max(0, i - n) + (o === 116 ? 3 : 0) + (t.stats["PetLevel:" + a.Spell] || 0),
        ),
    y = r ? p.cfg.cap : isHell(e.rules) ? hellPetCap(g) : Math.min(7, g + 2);
  for (const u of h)
    ((u.special.petLevel = Math.max(g, Number(u.special.petLevel || 0))),
      (u.special.maxPetLevel = y),
      p && (u.special.petXP = p.progress.xp),
      e.refreshActor(u));
  for (const u of h.slice(f)) ((u.dead = !0), (u.hp = 0), (u.expires = e.time));
  e.bringPets(t);
  for (let u = Math.min(h.length, f); u < f; u++) {
    const v = e.freeNear(t.map, t, 3);
    if (!v) break;
    const x = e.newMonster(c, t.map, v);
    ((x.friendly = !0),
      (x.master = t.id),
      (x.special = {
        ...x.special,
        dreamPet: !0,
        dreamFamily: l,
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
function bo(e, t, a, i) {
  const n = e.skill(t, a.Spell),
    s = n.level,
    o = a.DreamSkill,
    r = a.Spell;
  if (o.passive) {
    e.say(message("core.dream-magic.castDream.2c29d4452a"));
    return;
  }
  if (mo.has(r)) {
    bi(e, t, a, s, !0);
    return;
  }
  if (e.time < Math.max(t.spellAt, t.actionAt, n.s.CastTime)) return;
  const c = de(a, s, t.stats);
  if (t.mp < c) throw new b(message("core.dream-magic.castDream.26f1ab23c0"));
  let l = e.actor(Number(i.TargetID));
  const f = {
    x: Number(i.Location?.X ?? t.x),
    y: Number(i.Location?.Y ?? t.y),
  };
  if (!Number.isFinite(f.x) || !Number.isFinite(f.y))
    throw new b(message("core.dream-magic.castDream.a817ce95ed"));
  const h = l ?? f;
  if (l?.map !== void 0 && l.map !== t.map)
    throw new b(message("core.dream-magic.castDream.0640ca6a3a"));
  if (A(t, h) > a.Range) throw new b(message("core.dream-magic.castDream.8ec455055d"));
  const p = () => {
      if (!l || l.dead || l.friendly || l.kind !== "monster" || !targetableMonster(l))
        throw new b(message("core.dream-magic.castDream.ac7b618ae7"));
      return l;
    },
    g = (m = "MC") => magicDamage(a, s, F(e, t, m), e.rng),
    y = (m, M, P = 500, w = "MAC") => {
      const C = e.schedule("hit", P, t, m, M, w, r);
      return (
        (C.level = s),
        ["MeteorStrike", "IceFlame", "FireBang", "IceStorm"].includes(r) &&
          (C.location = {
            x: h.x,
            y: h.y,
          }),
        C
      );
    },
    u = (m, M, P, w = 500, C = "MAC") => {
      for (const q of enemies(e, t).filter((L) => A(L, m) <= M)) y(q, P, w, C);
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
      v = () => y(m, g(r === "SoulFireBall" ? "SC" : "MC"));
      break;
    }
    case "FireBang":
    case "IceStorm":
    case "IceFlame":
      v = () => u(h, 1, g());
      break;
    case "ChainThunder": {
      const m = p();
      v = () => {
        const M = [m];
        for (; M.length < Math.max(2, s + 1); ) {
          const P = M[M.length - 1],
            w = enemies(e, t)
              .filter((C) => !M.includes(C) && A(C, P) <= Math.min(4, n.s.Level + 1))
              .sort((C, q) => A(C, P) - A(q, P) || C.id - q.id)[0];
          if (!w) break;
          M.push(w);
        }
        for (const [P, w] of M.entries())
          y(w, Math.trunc(g() * Math.max(0.25, 0.8 ** P)), 900 + P * 300);
        e.emit("SpellChain", {
          Spell: r,
          Segments: M.map((P, w) => ({
            From: {
              x: (w ? M[w - 1] : t).x,
              y: (w ? M[w - 1] : t).y,
            },
            To: {
              x: P.x,
              y: P.y,
            },
            Delay: w * 300,
          })),
        });
      };
      break;
    }
    case "ThunderStorm":
      v = () => {
        for (const m of enemies(e, t).filter((M) => A(M, t) <= 2))
          y(m, Math.floor(g() / (A(m, t) > 1 ? 2 : 1)));
      };
      break;
    case "MeteorStrike":
      v = () => {
        for (const m of enemies(e, t).filter((M) => A(M, h) <= 1))
          for (let M = 0; M < 3; M++) {
            const P = y(m, g(), 2500 + M * 700);
            delete P.location;
          }
      };
      break;
    case "FireWall":
    case "PoisonCloud":
    case "DragonFlame":
      v = () => {
        const m = r === "PoisonCloud",
          M = r === "FireWall",
          P = M
            ? Math.min(
                (F(e, t, "MC") + 3 * s) * 500,
                [0, 8e3, 12e3, 15e3, 18e3, 21e3, 24e3][s] ?? 25e3,
              )
            : m
              ? 3e3 + F(e, t, "SC") * 100
              : 3e3,
          w = e.schedule("magic", M ? 0 : m ? 800 : 300, t, t, 0, "None", r);
        ((w.durationMs = P),
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
        for (const m of [t, ...pets(e, t)].filter((M) => M.map === t.map && A(M, h) <= 1))
          e.schedule("heal", 500, t, m, g("SC"), "None", r);
      };
      break;
    case "Poisoning": {
      const m = p();
      v = () => {
        const M = (20 + s * 7 + F(e, t, "SC") * 2) * 1e3,
          P = e.buff(m, "Green", M, poisoningDamage(s, t.stats), {}, t.id, r);
        (P && (P.interval = 1e3),
          e.buff(m, "DreamPoisonArmour", M, Math.min(100, 4 * s), {}, t.id, r));
      };
      break;
    }
    case "GhostBurn": {
      const m = p();
      v = () =>
        e.buff(
          m,
          "GhostBurn",
          5e3 + 3e3 * s + Math.trunc(F(e, t, "SC") / 10),
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
      v = () => e.buff(t, "Hiding", (8 * s + F(e, t, "SC")) * 500 + 500);
      break;
    case "BlessedArmour":
      v = () => {
        const m = F(e, t, "SC"),
          M = m < 70 ? m * 8e3 : m * 3e3 + 35e4;
        for (const P of [t, ...pets(e, t)].filter((w) => w.map === t.map && A(w, h) <= 1)) {
          const w = P.id === t.id ? 2 * s * (1 + Math.trunc((t.level - 1) / 10)) : 2 * s;
          e.buff(
            P,
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
      v = () => e.buff(t, "MagicShield", (5 + F(e, t, "MC")) * 1e3, s, {}, t.id, r);
      break;
    case "BloodDragon":
      v = () =>
        e.buff(
          t,
          r,
          (F(e, t, "DC") + 25 * s) * 200,
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
          F(e, t, "DC") * 400 + s * 5e3,
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
          F(e, t, "SC") * 500 + Math.min(s, 3) * 5e3,
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
      v = () => ho(e, t, a, s);
      break;
    case "LionRoar":
      v = () => {
        for (const m of enemies(e, t).filter(
          (M) => A(M, t) <= Math.min(4, s + 1) && e.monsters.get(M.definition).Level <= t.level - 2,
        ))
          e.buff(m, "LRParalysis", s * 2e3, 0, {}, t.id, r);
      };
      break;
    case "FlashSlash":
      v = () => {
        const m = direction(t, h),
          [M, P] = V[m],
          w = e.geometry.get(t.map);
        t.dir = m;
        for (let C = 0; C < s + 1; C++) {
          const q = t.x + M,
            L = t.y + P;
          if (
            q < 0 ||
            L < 0 ||
            q >= w.width ||
            L >= w.height ||
            w.solid[L * w.width + q] ||
            e
              .map(t.map)
              .actors.some(
                (W) => !W.dead && (W.kind === "npc" || W.friendly) && W.x === q && W.y === L,
              )
          )
            break;
          ((t.x = q), (t.y = L));
          for (const W of enemies(e, t).filter((k) => k.x === q && k.y === L))
            y(W, Math.trunc(F(e, t, "DC") * (s + 4) * 0.5), 500, "AC");
        }
      };
      break;
    case "ElectricShock": {
      const m = p(),
        M = e.monsters.get(m.definition),
        P = po(M);
      if (P === null || m.special?.elite || m.special?.nativeAffixType)
        throw new b(message("core.dream-magic.castDream.2a0a3eb47b"));
      if (P > t.level)
        throw new b(
          message("core.dream-magic.castDream.8e84096164", {
            p0: P,
          }),
        );
      if (t.level - M.Level < 3) throw new b(message("core.dream-magic.castDream.fcd380a876"));
      if (pets(e, t).length >= (s === 1 ? 1 : 3))
        throw new b(message("core.dream-magic.castDream.b245cda302"));
      v = () => {
        const w = Math.max(1, Math.trunc((70 - F(e, t, "MC")) / 10));
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
      Direction: E[t.dir],
      Target: {
        x: h.x,
        y: h.y,
      },
      TargetID: l?.id || 0,
    }));
}


function go(e, t, a, i) {
  if (i.spell === "FireWall" || i.spell === "PoisonCloud" || i.spell === "DragonFlame") {
    Xa(e, t, i);
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
    const o = e.buff(a, "Slow", n * 1e3 + F(e, t, "MC") * 200, 0, {}, t.id, i.spell);
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
var yo = new Set([
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
  gi = new Set([
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
function ta(e, t, a, i) {
  if (i && mountedItem(e, t)) throw new b(message("core.magic.toggleMagic.5c12d1da76"));
  const n = e.skill(t, a);
  if (!n) throw new b(message("core.magic.toggleMagic.446bba28f3"));
  if (n.d.DreamSkill) {
    bi(e, t, n.d, n.level, i);
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
function xo(e, t, a) {
  const i = e.skill(t, "CounterAttack");
  if (!i || !t.attackModes.counterAttack || e.time >= i.s.CastTime) return;
  let n = Q(t.stats, "DC", e.rng);
  e.rng.next(100) <= (t.stats.Accuracy || 0) && (n *= 2);
  const s = magicDamage(i.d, i.s.Level, n, e.rng);
  A(t, a) > 1 ||
    e.rng.next(10) > i.s.Level + 6 ||
    ((t.dir = (a.dir + 4) % 8),
    (t.attackModes.counterAttack = !1),
    e.schedule("hit", Math.max(0, t.attackAt - e.time), t, a, s, "AC", "CounterAttack"),
    e.emit("Magic", {
      ObjectID: t.id,
      Spell: "CounterAttack",
      Cast: !0,
      Direction: E[t.dir],
      Target: a,
      TargetID: a.id,
    }),
    e.levelSkill(t, i.s));
}
function aa(e, t, a, i, n) {
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
  const [s, o] = V[i];
  let r = 0;
  for (; r < n && e.walkable(a.map, a.x + s, a.y + o, a.id); ) ((a.x += s), (a.y += o), r++);
  return (
    r &&
      ((a.dir = (i + 4) % 8),
      (a.actionAt = e.time + 300 * r),
      (a.moveAt = e.time + 500 * r),
      e.emit("ObjectPushed", {
        ObjectID: a.id,
        Direction: E[a.dir],
        Location: {
          X: a.x,
          Y: a.y,
        },
      })),
    r
  );
}
function yi(e, t, a, i) {
  if (e.skill(t, i.spell || "")?.d.DreamSkill) {
    go(e, t, a, i);
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
      let f = !1;
      for (let h = 0; h < 200; h++) {
        const p = o.center[0] + e.rng.next(c, -c),
          g = o.center[1] + e.rng.next(l, -l);
        if (e.walkable(o.id, p, g, t.id)) {
          ((t.map = o.id), (t.x = p), (t.y = g), e.initializeMap(t.map), e.bringPets(t), (f = !0));
          break;
        }
      }
      if (!f) return;
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
        (e.bringPets(t), (l.x = c.x), (l.y = c.y));
        return;
      }
      const f = e.newMonster(r, t.map, c);
      ((f.friendly = !0),
        (f.master = t.id),
        (f.special.petLevel = n),
        (f.special.maxPetLevel = i.spell === "SummonSkeleton" ? 4 + n : 1 + n * 2),
        e.refreshActor(f),
        (f.hp = f.maxHP),
        (f.actionAt = e.time + 1e3),
        e.map(t.map).actors.push(f));
      break;
    }
    case "Mirroring": {
      const o = e.map(t.map).actors.find((f) => f.ai === 55 && f.master === t.id && !f.dead);
      if (o) {
        e.die(o, t);
        return;
      }
      const r = e.rules.monsters.find((f) => f.Name === e.rules.monsterSettings.CloneName),
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
          const f = e.skill(t, "ElectricShock")?.s;
          f && e.levelSkill(t, f);
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
        .flatMap((f) => f.actors)
        .filter((f) => f.friendly && f.master === t.id && !f.dead);
      if (
        s.IsBoss &&
        r.filter((f) => e.monsters.get(f.definition)?.IsBoss).length >=
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
      Xa(e, t, i);
      break;
    case "TrapHexagon":
      for (const o of e
        .map(t.map)
        .actors.filter(
          (r) =>
            r.kind === "monster" &&
            !r.dead &&
            !r.friendly &&
            A(r, i.location) <= 1 &&
            e.monsters.get(r.definition).Level <= t.level + 2,
        ))
        (e.buff(o, "Trap", i.damage), (o.target = 0));
      break;
    case "Curse":
      for (const o of e
        .map(t.map)
        .actors.filter(
          (r) => r.kind === "monster" && !r.dead && !r.friendly && A(r, i.location) <= 3,
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
          (r) => r.kind === "monster" && !r.dead && !r.friendly && A(r, i.location) <= 1,
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
      if (!s || a.friendly || A(t, a) > 7 || e.rng.next(t.level + 20 + n * 5) <= s.Level + 10)
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
            A(r, i.location) <= 2 &&
            e.monsters.get(r.definition).Level <= t.level + 3,
        ))
        e.buff(o, "LRParalysis", (n + 2) * 1e3);
      break;
    case "Entrapment": {
      if (!s || a.friendly || A(t, a) > 7 || s.Level >= t.level + 5 + e.rng.next(8)) return;
      const o = (t.dir + 4) % 8,
        r = Math.abs(t.x - a.x),
        c = Math.abs(t.y - a.y),
        l = o % 2 ? Math.min(r, c) : Math.max(0, o === 0 || o === 4 ? c - 2 : r - 2);
      if (
        e.rng.next(30) >= (n + 1) * 3 + t.level - s.Level + 9 ||
        (e.buff(a, "Paralysis", Me((n + 1) * 0.8) * 1e3), !aa(e, t, a, o, l))
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


function ia(e, t, a) {
  if (mountedItem(e, t)) throw new b(message("core.magic.castMagic.5c12d1da76"));
  const i = String(a.Spell),
    n = e.skill(t, i);
  if (!n) throw new b(message("core.magic.castMagic.446bba28f3"));
  if (i === "Hydra") {
    Ka(e, t, a);
    return;
  }
  if (n.d.DreamSkill) {
    bo(e, t, n.d, a);
    return;
  }
  if (e.rules.adaptations.disabledSpells[i]) throw Error(e.rules.adaptations.disabledSpells[i]);
  if (!yo.has(i)) throw new b(message("core.magic.castMagic.fe001409a7"));
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
  let l = e.actor(Number(a.TargetID));
  const f = {
    x: Number(a.Location?.X ?? t.x),
    y: Number(a.Location?.Y ?? t.y),
  };
  if (s.Range && A(t, l ?? f) > s.Range) throw new b(message("core.magic.castMagic.8ec455055d"));
  const h = () => e.map(t.map).actors.filter((m) => m.kind === "monster" && !m.dead && !m.friendly),
    p = () => {
      if (!l || l.dead || l.map !== t.map || l.friendly || l.kind !== "monster")
        throw new b(message("core.magic.castMagic.ac7b618ae7"));
      return l;
    },
    g = (m, M) => {
      const P = [...t.equipment, ...t.inventory].find(
        (w) =>
          w &&
          e.defs.get(w.id)?.Type === "Amulet" &&
          e.defs.get(w.id)?.DreamType !== 17 &&
          e.defs.get(w.id)?.Shape === m &&
          w.count >= M,
      );
      if (!P)
        throw new b(
          message(m === 0 ? "core.magic.castMagic.e588610336" : "core.magic.castMagic.63a4d58a68"),
        );
      return () => {
        P.count -= M;
        for (const w of [t.equipment, t.inventory])
          for (let C = 0; C < w.length; C++) w[C] === P && !P.count && (w[C] = null);
      };
    };
  let y;
  const u = (m) => magicDamage(s, r, Q(t.stats, m, e.rng), e.rng);
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
      ta(e, t, i, !0);
      return;
    case "ShoulderDash":
      y = () => {
        const m = E.indexOf(a.Direction) >= 0 ? E.indexOf(a.Direction) : t.dir,
          [M, P] = V[m],
          w = e.rng.next(2) + r + 2;
        let C,
          q = 0;
        for (let L = 0; L < w; L++) {
          const W = {
            ...t,
            x: t.x + M,
            y: t.y + P,
          };
          if (
            e.safe(W) ||
            (L === 0 &&
              (C = h().find(
                (k) => k.x === W.x && k.y === W.y && e.monsters.get(k.definition).Level < t.level,
              )),
            C && !aa(e, t, C, m, 1)) ||
            !e.walkable(t.map, W.x, W.y, t.id)
          )
            break;
          ((t.x = W.x),
            (t.y = W.y),
            (t.dir = m),
            q++,
            e.emit("ObjectDash", {
              ObjectID: t.id,
              Direction: E[m],
              Location: {
                X: t.x,
                Y: t.y,
              },
            }));
        }
        (q && e.levelSkill(t, o),
          q && C && e.damage(t, C, magicDamage(s, r, 0, e.rng), "None", i),
          q || e.say(message("core.magic.castMagic.4033afec75")));
      };
      break;
    case "Blizzard":
    case "MeteorStrike":
    case "PoisonCloud":
    case "HealingCircle": {
      const m = l ?? f,
        M = i === "PoisonCloud" ? g(0, 5) : () => {},
        P = i === "PoisonCloud" ? g(1, 5) : () => {};
      y = () => {
        (M(), P());
        const w = e.schedule(
          "magic",
          i === "HealingCircle" ? 1700 : i === "PoisonCloud" ? 500 + A(t, m) * 50 : 500,
          t,
          t,
          u(["PoisonCloud", "HealingCircle"].includes(i) ? "SC" : "MC"),
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
      const m = l ?? f,
        M = g(0, 1);
      if (
        i === "TrapHexagon" &&
        !h().some((C) => A(C, m) <= 1 && e.monsters.get(C.definition).Level <= t.level + 2)
      )
        throw new b(message("core.magic.castMagic.ea367d54b7"));
      const P =
          i === "Plague"
            ? [...t.equipment, ...t.inventory].find(
                (C) =>
                  C &&
                  e.defs.get(C.id)?.Type === "Amulet" &&
                  e.defs.get(C.id)?.DreamType !== 17 &&
                  [1, 2].includes(e.defs.get(C.id).Shape),
              )
            : void 0,
        w = P ? g(e.defs.get(P.id).Shape, 1) : () => {};
      y = () => {
        if ((M(), w(), i === "Curse" && e.rng.next(10 - (r + 1) * 2) > 2)) return;
        const C = e.schedule(
          "magic",
          i === "TrapHexagon" ? 500 : 500 + A(t, m) * 50,
          t,
          t,
          i === "TrapHexagon" ? (r * 5 + 10) * 1e3 : u("SC"),
          "None",
          i,
        );
        ((C.location = {
          x: m.x,
          y: m.y,
        }),
          (C.level = r),
          P &&
            (C.effect = {
              type: e.defs.get(P.id).Shape === 1 ? "Green" : "Red",
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
        const P = e.schedule("magic", 500 + A(t, m) * 50, t, m, 0, "None", i);
        P.level = r;
      };
      break;
    }
    case "FireBall":
    case "GreatFireBall":
    case "ThunderBolt":
    case "SoulFireBall": {
      const m = p();
      y = () => {
        let M = u(i === "SoulFireBall" ? "SC" : "MC");
        i === "ThunderBolt" && e.monsters.get(m.definition)?.Undead && (M = Math.trunc(M * 1.5));
        const P = e.schedule(
          "hit",
          i === "ThunderBolt" ? 500 : A(t, m) * 50 + 500,
          t,
          m,
          M,
          "MAC",
          i,
        );
        P.location = {
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
        let M = u("MC");
        i === "FlameDisruptor" &&
          !e.monsters.get(m.definition)?.Undead &&
          (M = Math.trunc(M * 1.5));
        const P = e.schedule(
          "hit",
          i === "FrostCrunch" ? 500 + A(t, m) * 50 : 500,
          t,
          m,
          M,
          "MAC",
          i,
        );
        ((P.level = r),
          i !== "Vampirism" &&
            (P.location = {
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
        for (const M of h().filter((P) => A(P, t) <= 1)) {
          const P = e.monsters.get(M.definition).Level;
          P >= t.level ||
            e.rng.next(20) >= 6 + r * 3 + t.level - P ||
            (m = aa(e, t, M, direction(t, M), 1 + Math.max(0, r - 1) + e.rng.next(2)) > 0 || m);
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
          Q(t.stats, "SC", e.rng) + magicPower(s, r, e.rng),
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
        e.deferBuff(t, m, i, (Q(t.stats, "SC", e.rng) + magicPower(s, r, e.rng)) * 1e3, 0, {
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
        const P =
          m.kind !== "player" || m.job === "Warrior"
            ? "MaxDC"
            : m.job === "Wizard"
              ? "MaxMC"
              : "MaxSC";
        e.buff(m, i, (Q(t.stats, "SC", e.rng) * 4 + (r + 1) * 50) * 1e3, 0, {
          [P]: (t.stats.MaxSC || 0) >= 5 ? Math.min(8, Math.trunc(t.stats.MaxSC / 5)) : 1,
        });
      };
      break;
    }
    case "EnergyShield":
      y = () => {
        const m = Math.max(2, 10 - (Math.trunc((t.stats.Luck || 0) / 3) + r + 1)),
          M = Me((Q(t.stats, "SC", e.rng) / 4) * (r + 1) + s.PowerBase);
        e.buff(t, i, (30 + 50 * r) * 1e3, 0, {
          EnergyShieldPercent: Me(100 / m),
          EnergyShieldHPGain: M,
        });
      };
      break;
    case "BladeAvalanche":
      y = () => {
        let m = Q(t.stats, "DC", e.rng);
        e.rng.next(100) <= 1 + (t.stats.Luck || 0) && (m *= 2);
        const M = magicDamage(s, r, m, e.rng),
          P = E.indexOf(a.Direction) >= 0 ? E.indexOf(a.Direction) : t.dir;
        for (const w of [-1, 0, 1]) {
          const C = V[(P + w + 8) % 8],
            q = V[P];
          for (let L = 0; L < 3; L++)
            for (const W of h().filter(
              (k) => k.x === t.x + C[0] + q[0] * L && k.y === t.y + C[1] + q[1] * L,
            ))
              e.damage(t, W, L <= 1 ? M : Math.trunc(M * 0.6), "MAC", i);
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
            magicDamage(s, r, Q(t.stats, "SC", e.rng) * 2, e.rng) + t.level,
            "None",
            i,
          )));
      break;
    }
    case "MagicShield":
      y = () => {
        if (t.buffs.some((M) => M.type === "MagicShield")) return;
        const m = Me(
          ((Q(t.stats, "MC", e.rng) + 15) / 4) * (r + 1) +
            (s.PowerBonus > 0 ? e.rng.next(s.PowerBase + s.PowerBonus, s.PowerBase) : s.PowerBase),
        );
        e.deferBuff(t, t, i, m * 1e3, r);
      };
      break;
    case "ProtectionField":
      y = () => {
        const m = Me((t.stats.MaxAC || 0) * (0.2 + 0.03 * r));
        e.buff(t, i, (45 + 15 * r) * 1e3, 0, {
          MinAC: m,
          MaxAC: m,
        });
      };
      break;
    case "Rage":
      y = () => {
        const m = Me((t.stats.MaxDC || 0) * (0.12 + 0.03 * r));
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
        (m(), e.deferBuff(t, t, "Hiding", (Q(t.stats, "SC", e.rng) + (r + 1) * 5) * 1e3));
      };
      break;
    }
    case "Poisoning": {
      const m = p(),
        M = [...t.equipment, ...t.inventory].find(
          (w) =>
            w &&
            e.defs.get(w.id)?.Type === "Amulet" &&
            e.defs.get(w.id)?.DreamType !== 17 &&
            [1, 2].includes(e.defs.get(w.id).Shape),
        ),
        P = M ? e.defs.get(M.id).Shape : 1;
      y = () => {
        const w = u("SC");
        e.deferBuff(
          t,
          m,
          P === 1 ? "Green" : "Red",
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
        P = M ? () => {} : g(0, i === "SummonSkeleton" ? 1 : i === "SummonShinsu" ? 5 : 2);
      if (
        !M &&
        Object.values(e.maps)
          .flatMap((w) => w.actors)
          .filter((w) => w.friendly && w.master === t.id && !w.dead).length >= 2
      )
        throw new b(message("core.magic.castMagic.23fe292b10"));
      y = () => {
        (M || e.levelSkill(t, o), P());
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
      const m = l ?? f;
      y = () => {
        const M = u("MC");
        for (const P of h().filter((w) => A(w, m) <= 1)) e.schedule("hit", 500, t, P, M, "MAC", i);
      };
      break;
    }
    case "HellFire":
    case "Lightning": {
      y = () => {
        const m = u("MC"),
          M = i === "HellFire" ? 4 : 8,
          P = Number.isInteger(E.indexOf(a.Direction)) ? E.indexOf(a.Direction) : t.dir;
        for (const w of h()) {
          const C = (direction(t, w) - P + 8) % 8;
          A(t, w) <= M &&
            (C === 0 || (i === "HellFire" && r === 3 && [1, 7].includes(C))) &&
            e.schedule("hit", 500, t, w, m, "MAC", i);
        }
      };
      break;
    }
    case "ThunderStorm":
    case "FlameField": {
      y = () => {
        const m = u("MC");
        for (const M of h().filter((P) => A(P, t) <= 2))
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
        M = l ?? f;
      y = () => {
        m();
        const P = Q(t.stats, "SC", e.rng) * 4 + (r + 1) * 50;
        for (const w of [t, ...e.map(t.map).actors.filter((C) => C.friendly && !C.dead)].filter(
          (C) => A(C, M) <= 3,
        )) {
          const C = w.kind === "player" ? w.level : e.monsters.get(w.definition).Level;
          e.deferBuff(
            t,
            w,
            i,
            P * 1e3,
            0,
            {
              [i === "SoulShield" ? "MaxMAC" : "MaxAC"]: Math.trunc(C / 7) + 4,
            },
            A(t, M) * 50 + 500,
          );
        }
      };
      break;
    }
    case "MassHealing": {
      const m = l ?? f;
      y = () => {
        const M = u("SC");
        for (const P of [t, ...e.map(t.map).actors.filter((w) => w.friendly && !w.dead)].filter(
          (w) => A(w, m) <= 1,
        ))
          e.schedule("heal", 500, t, P, M, "None", i);
      };
      break;
    }
    case "MassHiding": {
      g(0, 1);
      const m = l ?? f;
      y = () => {
        const M = Math.trunc(Q(t.stats, "SC", e.rng) / 2) + (r + 1) * 2;
        for (const P of [t, ...e.map(t.map).actors.filter((w) => w.friendly && !w.dead)].filter(
          (w) => A(w, m) <= 1,
        ))
          e.deferBuff(t, P, "Hiding", M * 1e3, 0, {}, A(t, m) * 50 + 500);
      };
      break;
    }
    case "Blink":
      if (!e.walkable(t.map, f.x, f.y, t.id))
        throw new b(message("core.magic.castMagic.758eaa2d29"));
      y = () => {
        const m = e.schedule("magic", 200, t, t, 0, "None", i);
        ((m.level = r),
          (m.location = {
            ...f,
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
      const m = l ?? f;
      y = () => {
        const M = e.schedule("magic", 500, t, t, u("MC"), "None", i);
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
  if ((y(), gi.has(i))) for (const m of e.events.filter((M) => M.order >= v)) m.trainSpell = i;
  ((t.mp -= c),
    (t.actionAt = e.time + 600),
    (t.attackAt = e.time + 600),
    (t.spellAt = e.time + (i === "FlameField" ? 2500 : 1800)),
    (t.regenAt = e.time + 1e4),
    (o.CastTime = e.time + s.DelayBase - r * s.DelayReduction));
  const x = E.indexOf(a.Direction);
  (x >= 0 && (t.dir = x),
    !gi.has(i) &&
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
      Direction: E[t.dir],
      Target: l ?? f,
      TargetID: l?.id || 0,
    }));
}


var na = {
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
  xi = {
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
    ...na,
  };
function gemTier(e) {
  return e.added.GemTier === 2 ? 2 : e.added.GemTier === 1 ? 1 : 0;
}
function Mo(e, t, a, i, n) {
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
    f = i.highEffects.filter((p) => !l || !p.jobs || p.jobs.includes(l)),
    h = [i.rareEffects, ...(c === 2 ? [f] : [])];
  for (const [p, g] of h.entries()) {
    const y = g[a.next(g.length)],
      u = p === 0 ? s?.rareBonus || 0 : s?.highBonus || 0;
    e.added[y.stat] = Math.min(i.caps[y.stat], a.next(y.max + 1, y.min) + u);
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
    Object.keys(na)
      .filter((t) => (e.added[t] || 0) > 0)
      .map((t) => [t, e.added[t]]),
  );
}
function ko(e, t) {
  const a = Object.keys(xi)
      .filter((n) => !(n in na))
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
function vi(e, t) {
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
            stat: xi[e] || e,
            value: e === "Durability" ? t / 1e3 : t,
            unit: e.endsWith("Percent") ? "%" : "",
          });
}
function Po(e, t) {
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
var Ao = {
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
function Co(e, t, a, i, n) {
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
      ? Object.entries(Ao).reduce((c, [l, f]) => c + ((f.includes(n || "") && s.stats[l]) || 0), 0)
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
function Io(e, t, a) {
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
function Ho(e, t, a, i) {
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
var Mi = {
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
function wi(e, t, a, i) {
  const n = e.defs.get(a.id),
    s = e.defs.get(i.id);
  if (n.Type !== "Gem" || !Mi[s.Type] || a.uid === i.uid)
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
      .includes(Mi[s.Type])
  )
    throw new b(message("core.upgrades.upgradeQuote.104fee785f"));
  const { stat: o, gain: r } = ko(n, a),
    c = gemPowers(a),
    l = gemLimits(n, a);
  if (!o) throw new b(message("core.upgrades.upgradeQuote.a986284563"));
  const f =
    o === "Durability"
      ? Math.max(0, Math.trunc((i.maxDura - s.Durability) / 1e3))
      : i.added[o] || 0;
  if ((i.gemCount || 0) >= l.countLimit || f + (o === "Durability" ? r / 1e3 : r) > l.statLimit)
    throw new b(message("core.upgrades.upgradeQuote.d9cca84c52"));
  const h = l.chanceStep * (e.rules.gems.statIndependent ? f : i.gemCount || 0),
    p = h >= l.baseChance ? 0 : l.baseChance - h + (t.stats.GemRatePercent || 0);
  if (p <= 0) throw new b(message("core.upgrades.upgradeQuote.209cd4bc08"));
  return {
    chance: Math.max(0, Math.min(100, p)),
    repair: !1,
    stat: o,
    gain: r,
    effects: c,
    details: [vi(o, r), ...Object.entries(c).map(([g, y]) => vi(g, y))],
    destructive: !1,
  };
}
function No(e, t, a, i) {
  const n = t.inventory.findIndex((f) => f?.uid === a),
    s = t.inventory.findIndex((f) => f?.uid === i),
    o = t.inventory[n],
    r = t.inventory[s];
  if (!o || !r) throw new b(message("core.upgrades.combineItem.f0ed4a2f42"));
  const c = wi(e, t, o, r),
    l = e.defs.get(r.id);
  if (c.repair)
    ([1, 2].includes(l.Shape) && e.rng.next(10),
      (r.currentDura = r.maxDura),
      e.say(message("core.upgrades.combineItem.92fcd944ae")));
  else if (e.rng.next(100) < c.chance) {
    c.stat === "Durability"
      ? (r.maxDura = Math.min(65535, r.maxDura + c.gain))
      : (r.added[c.stat] = (r.added[c.stat] || 0) + c.gain);
    for (const [f, h] of Object.entries(c.effects)) r.added[f] = (r.added[f] || 0) + h;
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
var Si = {};
for (const [e, t] of [
  [2, "Mundane NokChi TaoProtect Whisker1 Whisker2 Whisker3 Whisker4 Whisker5"],
  [3, "RedOrchid RedFlower Smash HwanDevil Purity FiveString Bone Bug DarkGhost"],
  [4, "Recall"],
  [
    5,
    "Spirit WhiteGold WhiteGoldH RedJade RedJadeH Nephrite NephriteH Hyeolryong Monitor Oppressive Paeok Sulgwan BlueFrostH BlueFrost",
  ],
])
  for (const a of t.split(" ")) Si[a] = e;


var Ro = {
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
function Bo(e, t) {
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
      (o.complete = o.types.size >= (Si[s] || 0)));
  }
  return a;
}
function To(e, t, a) {
  const i = (r) => {
      for (const [c, l] of Object.entries(r)) e[c] = (e[c] || 0) + l;
    },
    n = new Set();
  for (const r of Bo(t, a))
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
        i(Ro[r.name] || {})));
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
function qo(e, t) {
  isLegacyBag(e, t) && e.inventory.splice(46, 0, null, null);
}
function Pi(e, t) {
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
        for (const [l, f] of [
          [238, 207],
          [239, 218],
        ])
          (c.completedQuests.includes(f) || c.quests.some((h) => h.id === f)) &&
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
        ((l.actors = l.actors.filter((f) => {
          const h = f.kind !== "monster" || f.friendly || f.spawn === void 0;
          return (h || r.add(f.id), h);
        })),
          (l.respawns = {}));
        for (const f of l.actors) {
          if (f.kind === "npc") {
            const h = t.world.npcs.find((p) => p.map === c && p.id === f.id);
            h && ((f.x = h.at[0]), (f.y = h.at[1]));
          }
          if (f.friendly && f.master && o.has(f.master)) {
            const h = i.roles.find((p) => p.id === f.master);
            ((f.x = h.x), (f.y = h.y), (f.target = 0));
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
    const f = {
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
      const p = f[h.id];
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
function Ai(e, t) {
  const a = e.map(t);
  return (
    a.portals && (a.portals = a.portals.filter((i) => !i.expires || i.expires > e.time)),
    [...e.region(t).portals, ...(a.portals || [])]
  );
}
function Oo(e, t, a) {
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
      ((Pe(a, e.rules)?.guaranteedQuestMaterials ||
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
function Eo(e, t) {
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
function Fo(e, t) {
  const a = approvedPlacement(e, t.map);
  return !a || !eligible(t, a.i, a.definition)
    ? !1
    : (((t.special ??= {}).omaNorthwestPlacement = 2), !0);
}
function Lo(e, t) {
  const a = e.maps[t],
    i = approvedPlacement(e, t);
  if (!a || !i) return !1;
  const { locations: n, i: s, definition: o } = i,
    r = a.actors.filter((p) => eligible(p, s, o));
  if (a.omaNorthwestPlacement === 1 && r.every((p) => p.special?.omaNorthwestPlacement === 2))
    return !1;
  const c = r.filter((p) => p.special?.omaNorthwestPlacement !== 2).sort((p, g) => p.id - g.id),
    l = new Set(c.map((p) => p.id)),
    f = new Set(
      a.actors
        .filter((p) => !p.dead && ["monster", "npc"].includes(p.kind) && !l.has(p.id))
        .map((p) => `${p.x},${p.y}`),
    ),
    h = [];
  for (const [p, g] of c.entries()) {
    const y = ([v, x]) =>
      (v !== g.x || x !== g.y) && !f.has(`${v},${x}`) && e.walkable(t, v, x, g.id);
    let u;
    for (let v = 0; !u && v < n.length; v++) {
      const x = n[(Math.floor((p * n.length) / c.length) + v) % n.length];
      y(x) && (u = x);
    }
    if (!u) return !1;
    (f.add(u.join(",")),
      h.push({
        actor: g,
        x: u[0],
        y: u[1],
      }));
  }
  for (const { actor: p, x: g, y } of h)
    ((p.x = g), (p.y = y), ((p.special ??= {}).omaNorthwestPlacement = 2));
  return ((a.omaNorthwestPlacement = 1), !0);
}
var Ii = [
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
function Hi(e) {
  return JSON.stringify(
    e && typeof e == "object"
      ? Object.entries(e)
          .sort(([t], [a]) => t.localeCompare(a))
          .map(([t, a]) => [t, Hi(a)])
      : e,
  );
}
function Je(e, t, a) {
  const i = new Map();
  for (const r of e)
    if (r) {
      const { uid: c, count: l, ...f } = r,
        h = Hi(f),
        p = i.get(h) || [];
      (p.push(r), i.set(h, p));
    }
  const n = [];
  for (const r of i.values()) {
    r.sort((h, p) => h.uid - p.uid);
    const c = Math.max(1, t.get(r[0].id).StackSize);
    let l = r.reduce((h, p) => h + p.count, 0),
      f = 0;
    for (; l > 0; ) {
      const h = Math.min(c, l);
      (n.push({
        ...structuredClone(r[0]),
        uid: r[f++]?.uid ?? 0,
        count: h,
      }),
        (l -= h));
    }
  }
  if (n.length > e.length) throw new b(message("core.inventory-sort.sortInventory.a0b0e1e655"));
  const s = (r) => {
      const c = Ii.indexOf(t.get(r.id).Type);
      return c < 0 ? Ii.length : c;
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
function Wo(e, t) {
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
var Ni = class extends Nt {
    constructor(e) {
      (super(1), (this.high = e));
    }
    next(e, t = 0) {
      return this.high ? Math.max(t, e - 1) : t;
    }
  },
  Tr = new Ni(!1),
  qr = new Ni(!0),
  Ri = ["Potion", "Scroll", "Book", "BagExpansion", "TreasureMap"];
function migrateItemHotkeys(e, t) {
  e.itemHotkeys ??= Array.from(
    {
      length: 6,
    },
    (a, i) => {
      const n = e.inventory[i];
      return n && Ri.includes(t.get(n.id)?.Type || "") ? n.id : null;
    },
  );
}
var vt = (e, t) => Math.max(Math.abs(e.x - t.x), Math.abs(e.y - t.y));
function adventureSetCount(e, t, a = t.job) {
  const i = e.rules.adaptations.adventure.setIds[a];
  return new Set(
    t.equipment
      .filter((n) => !!n && i.includes(n.id) && (!n.maxDura || n.currentDura > 0))
      .map((n) => n.id),
  ).size;
}
function $o(e, t) {
  const a = adventureSetCount(e, t),
    i = e.rules.adaptations.adventure;
  if (a >= 2)
    for (const [n, s] of Object.entries(i.setBonuses[t.job])) t.stats[n] = (t.stats[n] || 0) + s;
  a >= 3 && (t.stats["Adventure" + t.job] = 1);
}
function Go(e, t, a, i, n) {
  if (!(i <= 0 || t.kind !== "player" || n !== "GreatFireBall" || !t.stats.AdventureWizard))
    for (const s of [...e.map(t.map).actors])
      s.id !== a.id &&
        s.kind === "monster" &&
        !s.dead &&
        !s.friendly &&
        vt(s, a) <= 1 &&
        e.damage(t, s, Math.max(1, Math.floor(i * 0.35)), "MAC", "EmberSplash");
}
function owned(e, t) {
  return [...e.inventory, ...e.storage, ...e.equipment, ...e.questInventory].some(
    (a) => a?.id === t,
  );
}
function Ti(e, t) {
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
function zo(e, t, a) {
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
      e.ground(t, e.newItem(Ti(e, a))),
    e.rng.next(n.eliteTicketChance) === 0 && e.ground(t, e.newItem(n.ticketId)));
  const s = earlyAdventureEquipment(e, a);
  s.length && e.ground(t, e.newItem(s[e.rng.next(s.length)].Index, 1, !0));
}
function Vo(e, t, a) {
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
      !s.dead && s.map === t.map && vt(s, n) <= 1 && e.damage(t, s, 16, "AC", "CaptainSlam");
    return (delete i.slamAt, (i.nextSlam = e.time + 6e3), (t.actionAt = e.time + 600), !0);
  }
  if (!a.dead && vt(t, a) <= 6 && !e.safe(a) && e.time >= Number(i.nextSlam || 0)) {
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
function Uo(e, t) {
  const a = e.rules.adaptations.adventure;
  if (t.level < a.tombMinLevel) throw new b(message("core.adventure.enterTreasure.f97d7b80dd"));
  if (a.mapIds.includes(t.map)) throw new b(message("core.adventure.enterTreasure.222ac92c03"));
  if (
    e.time < t.actionAt ||
    e
      .map(t.map)
      .actors.some(
        (r) => r.kind === "monster" && !r.dead && !r.friendly && r.target === t.id && vt(r, t) <= 8,
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
function sa(e, t) {
  const a = t.treasureRun;
  !a ||
    t.map === a.map ||
    ((e.maps[a.map] = {
      actors: [],
      respawns: {},
    }),
    (e.events = e.events.filter((i) => i.map !== a.map)),
    delete t.treasureRun);
}
function Ko(e, t) {
  sa(e, t);
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
              item: Ti(e, t),
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
          ba(p, e.rules) &&
          p.RequiredAmount <= t.level &&
          !t.skills.some((g) => g.Spell === p.Spell) &&
          !owned(t, p.Index),
      );
    l &&
      a.rewards.push({
        item: l.Index,
        count: 1,
      });
    const f = e.rules.adaptations.adventure;
    e.ground(t, e.newItem(f.chestId));
    const h = i.actors.find((p) => p.item?.id === f.chestId);
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
    let f;
    for (let h = 0; h <= 5 && !f; h++)
      for (let p = -h; p <= h && !f; p++)
        for (let g = -h; g <= h && !f; g++) {
          const y = l.x + g,
            u = l.y + p,
            v = y + "," + u;
          !r.has(v) &&
            e.walkable(a.map, y, u) &&
            ((f = {
              x: y,
              y: u,
            }),
            r.add(v));
        }
    if (!f) {
      a.nextWaveAt = e.time + 1e3;
      return;
    }
    o.push(f);
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


function Xo(e, t, a) {
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
    e.say(message("core.adventure.openTreasure.e623862bb2")));
}
var Oi = ["FlameDisruptor", "ThunderBolt", "GreatFireBall", "FireBall"];
function Ei(e) {
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
    autoMagicSpell: Oi.includes(e?.autoMagicSpell || "") ? e.autoMagicSpell : "auto",
  };
}
var Fi = new WeakMap();
function Jo(e, t) {
  if (Bs(e, t) || t.dead || !t.assist) return;
  const a = Ei(t.assist);
  let i = Fi.get(t);
  (i ||
    ((i = {
      hp: 0,
      mp: 0,
    }),
    Fi.set(t, i)),
    migrateItemHotkeys(t, e.defs));
  for (const [n, s, o, r, c, l, f] of [
    ["hp", 0, a.hpEnabled, a.hpPercent, t.maxHP, t.potHP, "HP"],
    ["mp", 1, a.mpEnabled, a.mpPercent, t.maxMP, t.potMP, "MP"],
  ]) {
    if (!o || c <= 0 || t[n] * 100 >= c * r || l > 0 || e.time < i[n]) continue;
    const h = t.inventory.find((g) => g?.id === t.itemHotkeys?.[s]);
    if (!h) continue;
    const p = e.defs.get(h.id);
    if (!(p?.Type !== "Potion" || ![0, 1].includes(p.Shape) || !(p.Stats[f] > 0))) {
      i[n] = e.time + 1e3;
      try {
        e.checkUse(t, p);
      } catch {
        continue;
      }
      e.useItem(t, h.uid);
    }
  }
  if (!mountedItem(e, t)) {
    if (
      t.job === "Wizard" &&
      (a.autoMagic || a.autoShield) &&
      !e.safe(t) &&
      e.time >= Math.max(t.actionAt, t.spellAt, Number(t.special?.assistMoveUntil || 0))
    ) {
      const n = e
        .map(t.map)
        .actors.filter(
          (o) =>
            o.kind === "monster" &&
            !o.dead &&
            !o.friendly &&
            targetableMonster(o) &&
            A(t, o) <= 6 &&
            Qt(e, t.map, t, o),
        );
      n.sort(
        (o, r) => +(r.id === t.target) - +(o.id === t.target) || A(t, o) - A(t, r) || o.id - r.id,
      );
      const s = n[0];
      if (s) {
        const o = e.skill(t, "MagicShield"),
          r = (f) => e.time >= f.s.CastTime && t.mp >= de(f.d, f.level, t.stats);
        if (
          a.autoShield &&
          o &&
          !t.buffs.some((f) => f.type === "MagicShield" && f.until > e.time) &&
          r(o)
        ) {
          ia(e, t, {
            Spell: "MagicShield",
            TargetID: t.id,
            Location: {
              X: t.x,
              Y: t.y,
            },
            Direction: E[t.dir],
          });
          return;
        }
        const c = a.autoMagicSpell === "auto" ? Oi.find((f) => e.skill(t, f)) : a.autoMagicSpell,
          l = c ? e.skill(t, c) : void 0;
        if (a.autoMagic && l && r(l) && A(t, s) <= l.d.Range) {
          ia(e, t, {
            Spell: c,
            TargetID: s.id,
            Location: {
              X: s.x,
              Y: s.y,
            },
            Direction: E[t.dir],
          });
          return;
        }
      }
    }
    for (const [n, s] of [
      ["blazingSword", "BlazingSword"],
      ["flamingSword", "FlamingSword"],
    ]) {
      if (!a[n] || t.attackModes[n]) continue;
      const o = e.skill(t, s);
      if (!o || e.time < o.s.CastTime) continue;
      const r = o.d.DreamSkill
        ? de(o.d, o.level, t.stats)
        : o.d.BaseCost + o.s.Level * o.d.LevelCost;
      t.mp >= r && ta(e, t, s, !0);
    }
  }
}
var E = ["Up", "UpRight", "Right", "DownRight", "Down", "DownLeft", "Left", "UpLeft"],
  V = [
    [0, -1],
    [1, -1],
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
    [-1, 0],
    [-1, -1],
  ],
  A = (e, t) => Math.max(Math.abs(e.x - t.x), Math.abs(e.y - t.y)),
  direction = (e, t) =>
    V.findIndex(([a, i]) => a === Math.sign(t.x - e.x) && i === Math.sign(t.y - e.y)),
  Fe = class {
    constructor(e, t = 1) {
      ((this.rules = e),
        (this.defs = new Map(e.items.map((a) => [a.Index, a]))),
        (this.monsters = new Map(e.monsters.map((a) => [a.Index, a]))),
        (this.rng = new Nt(t)));
    }
    defs;
    monsters;
    rng;
    epoch = globalThis.crypto?.randomUUID?.() ?? String(Date.now());
    roles = [];
    sharedStorage = Array(Ze).fill(null);
    maps = {};
    geometry = new Map();
    spreadMaps = new Set();
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
            ht(s) &&
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
              A(t, {
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
      Lo(this, e);
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
    bringPets(e) {
      if (this.geometry.has(e.map))
        for (const t of Object.values(this.maps)) {
          for (const a of [...t.actors])
            if (a.friendly && a.master === e.id && !a.dead && (a.map !== e.map || A(a, e) > 10)) {
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
          const f = this.newMonster(o, e, l, n);
          (Fo(this, f), t.actors.push(f));
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
      return (Ga(this, n, e), ns(this, n, e), n);
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
          (ro(r, o, this.rng, c, dreamMagicFind(c, (n?.stats.MagicFind || 0) + s)),
            Jt(r, o, this.rng, c));
        } else yn(r, o, this.rng, this.rules.adaptations.earlyLoot);
        Mo(r, o, this.rng, this.rules.adaptations.gemEnhancement, i);
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
        this.give(n, Xi(this.newItem(s.Index), this.rules), !1);
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
        Ft(t, this.rules),
        (this.npc = 0),
        this.initializeMap(t.map),
        this.grantBlessing(t),
        this.rules.adaptations.noviceProgression &&
          Ot(t, this.rules.adaptations.noviceProgression.spiritGrowth),
        ft(this, t),
        this.refresh(t),
        t.dead || this.gainXP(t, 0),
        ft(this, t) && this.refresh(t));
      for (const a of t.skills) this.settleSkillExperience(t, a);
    }
    refresh(e) {
      const t = this.rules.growth.baseStats.find((o) => o.Job === e.job);
      e.stats = Object.fromEntries(t.Stats.map((o) => [o.Type, bn(o, e.job, e.level)]));
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
        for (const [c, l] of Object.entries(or(o, r))) e.stats[c] = (e.stats[c] || 0) + l;
        r.Unique.includes("Skill") && (e.stats.SkillGainMultiplier = 3);
        for (const [c, l] of Object.entries(r.Stats)) e.stats[c] = (e.stats[c] || 0) + l;
        for (const [c, l] of Object.entries({
          ...o.added,
          ...Object.fromEntries(
            Object.entries(_o(o, e.job)).map(([f, h]) => [f, h + (o.added[f] || 0)]),
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
      To(e.stats, e.equipment, this.defs);
      for (const o of kn(e.equipment, this.defs))
        for (const r of o.effects)
          if (o.count >= r.count)
            for (const [c, l] of Object.entries(r.stats)) e.stats[c] = (e.stats[c] || 0) + l;
      for (const o of e.equipment)
        if (o && (!o.maxDura || o.currentDura > 0))
          for (const [r, c] of Object.entries(this.defs.get(o.id).DreamSpecialStats || {}))
            e.stats[r] = (e.stats[r] || 0) + c;
      $o(this, e);
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
            : Wo(o.Spell, o.Level),
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
      Zo(e);
      const s = new Map();
      for (const o of e.equipment) {
        if (!o || (o.maxDura > 0 && !o.currentDura)) continue;
        const r = Math.min(8, Math.floor(we(o)));
        r > 0 && s.set(r, (s.get(r) || 0) + 1);
      }
      ((e.stats.QualitySetDamagePercent = Math.max(
        0,
        ...[...s].filter(([, o]) => o >= 5).map(([o]) => o * 2),
      )),
        lo(e, this.rules),
        Po(e, this.rules.adaptations.gemEnhancement),
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
            const f = Math.min(s, n.StackSize - l.count);
            if ((o.push([c, f]), (s -= f), !s)) break;
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
          .filter((n) => n?.id === t && !Se(n))
          .reduce((n, s) => n + s.count, 0) < a
      )
        throw new b(message("manage.protected"));
      for (const n of [e.questInventory, e.inventory])
        for (let s = 0; s < n.length && a; s++) {
          const o = n[s];
          if (o?.id !== t || Se(o)) continue;
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
    gainXP(e, t, a = 0) {
      if (
        (isHell(this.rules) ||
          (t += Math.trunc((t * Math.max(0, e.stats.ExpRatePercent || 0)) / 100)),
        !(isHell(this.rules) && t === 0))
      ) {
        ((t += Math.max(0, Math.trunc(a))), (e.xp += t), Vn(this, e, t));
        for (const i of this.map(e.map).actors.filter(
          (n) => n.friendly && n.master === e.id && !n.dead && A(n, e) <= 16,
        )) {
          i.special ??= {};
          const n = i.special,
            s = Number(n.petLevel || 0),
            o = Number(n.maxPetLevel || 0);
          i.special?.dreamPet ||
            s >= o ||
            (isHell(this.rules) && !isSpirit(this, i)) ||
            ((n.petXP = Number(n.petXP || 0) + t * ([18, 23, 38].includes(i.ai || 0) ? 3 : 1)),
            Number(n.petXP) >= (s + 1) * 2e4 &&
              ((n.petXP = Number(n.petXP) - (s + 1) * 2e4),
              (n.petLevel = s + 1),
              this.refreshActor(i)));
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
        ft(this, e) && this.refresh(e);
        for (const i of e.skills) this.settleSkillExperience(e, i);
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
      const f =
        t === "Green" &&
        o !== "NativeDeathPoison" &&
        this.actor(s)?.kind === "monster" &&
        !this.actor(s)?.friendly;
      return (
        e.buffs.push({
          type: t,
          until: this.time + a,
          next: t === "Green" && l ? l.next : this.time + (f ? 2e3 : 1e3),
          ...(f
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
        Fa(e),
        e.friendly)
      ) {
        const n = Number(e.special?.petLevel || 0);
        if (e.special?.dreamPet)
          for (let o = 0; o < n; o++)
            ((e.stats.MinDC = Math.trunc(Math.fround((e.stats.MinDC || 0) * Math.fround(1.05)))),
              (e.stats.MaxDC = Math.trunc(Math.fround((e.stats.MaxDC || 0) * Math.fround(1.15)))));
        else
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
          Qn(this, e),
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
      return this.geometry.get(e.map)?.safeZones.some((t) => A(e, t) <= t.size) ?? !1;
    }
    deferBuff(e, t, a, i, n = 0, s = {}, o = 500, r = 1e3, c) {
      this.schedule("buff", o, e, t, 0, "None", c);
      const l = this.events.find((f) => f.order === this.nextOrder - 1);
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
          this.roles.find((k) => k.id === e.master)?.stats.AdventureTaoist &&
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
          (k) =>
            k.until > this.time &&
            ["Paralysis", "Frozen", "Stun", "Trap", "Shock"].includes(k.type),
        )
      )
        return 0;
      const f = t.buffs.find((k) => k.type === "DreamBossShield");
      f && i !== "None" && (a = Math.floor(a * (1 - f.value / 100)));
      const h = ds(this, e, a, r && !s && !o && i !== "None");
      ((a = os(this, e, a, i, n)),
        (a = vs(this, e, t, a, n)),
        (a = Co(this, e, t, a, n)),
        (a = er(this, e, t, a, n, i)));
      const p = t.hp;
      let g = !0,
        y = 0;
      const u = !!this.rules.adaptations.dreamRuntime;
      (u
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
            !u &&
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
      const v = t.buffs.find((k) => k.type === "DreamPoisonArmour");
      (e.kind === "player" &&
        i !== "None" &&
        (y = Math.floor(y * (1 - Math.min(100, e.stats.WeakSpotPercent || 0) / 100))),
        v && (y = Math.floor(y * (1 - v.value / 100))));
      const x = e.kind === "player" ? this.skill(e, n || "") : null;
      (x?.d.DreamSkill &&
        (n === "FlameDisruptor" || (n === "SoulFireBall" && x.level >= 4)) &&
        (y = Math.floor(y * 0.5)),
        x?.d.DreamSkill && n === "DragonFlame" && (y = Math.trunc(y / Math.max(1, x.level))),
        t.buffs.some((k) => k.type === "Red") &&
          (y = Math.trunc(y * (t.kind === "monster" ? 0.5 : 0.9))),
        g && e.kind === "player" && i.startsWith("AC") && this.wearItem(e, 0, this.rng.next(4) + 1),
        (i.endsWith("Bypass") || i.endsWith("NoArmor")) && (y = 0));
      const m = t.buffs.find((k) => k.type === "MagicShield");
      let M = a + (i === "None" || e.kind !== "player" ? 0 : e.stats.AttackBonus || 0);
      if (i !== "None" && t.kind === "player") {
        const k =
          t.stats.DamageReductionPercent ||
          (m && !this.skill(t, "MagicShield")?.d.DreamSkill ? (m.value + 2) * 10 : 0);
        M -= Math.trunc((M * k) / 100);
      }
      const P =
        g &&
        M > y &&
        e.kind === "player" &&
        !t.friendly &&
        i === "AC" &&
        n === "None" &&
        Gn(this, e);
      P &&
        (M = Math.floor(
          M * (this.rules.adaptations.noviceProgression?.heavyStrike?.multiplier || 1),
        ));
      let w = g ? Math.max(0, M - y) : 0;
      (!u &&
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
        h.raw || (w = $a(this, t, w, i.endsWith("Bypass") ? "None" : i)),
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
        t.kind === "player" && i !== "None" && (w = zi(this, t, w, i)));
      let q = 0;
      if (h.raw) {
        if (g) {
          let k = this.rng.next(
            Math.max(t.stats.MinMAC || 0, t.stats.MaxMAC || 0) + 1,
            t.stats.MinMAC || 0,
          );
          (t.kind === "player" &&
            (k = Math.floor(
              k *
                (1 + ((t.stats.NativeDefencePercentLow || 0) + affixRangeExtra(this, t, 11)) / 100),
            )),
            v && (k = Math.floor(k * (1 - v.value / 100))),
            t.buffs.some((H) => H.type === "Red") &&
              (k = Math.trunc(k * (t.kind === "monster" ? 0.5 : 0.9))));
          const I =
            t.kind === "player"
              ? t.stats.DamageReductionPercent ||
                (m && !this.skill(t, "MagicShield")?.d.DreamSkill ? (m.value + 2) * 10 : 0)
              : 0;
          ((q = Math.max(0, h.raw - Math.trunc((h.raw * I) / 100) - k)),
            t.kind === "player" &&
              ((q = Math.floor(
                q * (1 - Math.min(100, t.stats.NativeMagicAbsorbPercent || 0) / 100),
              )),
              (q = zi(this, t, q, "MAC"))));
        }
        w = $a(this, t, w + q, "MAC");
      }
      (m &&
        w > 0 &&
        i !== "None" &&
        !this.skill(t, "MagicShield")?.d.DreamSkill &&
        (m.until = Math.max(this.time, m.until - w * 60)),
        t.kind === "monster" &&
          t.stats.NativeDamageReductionPercent &&
          (w = Math.trunc(w * (1 - t.stats.NativeDamageReductionPercent / 100))),
        (w = Io(this, t, w)));
      const L = $(this, t)?.incomingDamageCap;
      if (
        (L !== void 0 && w > 0 && (w = Math.min(w, L)),
        this.emit("DamageIndicator", {
          ObjectID: t.id,
          Type: g ? (w ? (P ? "HeavyStrike" : "Hit") : "Blocked") : "Miss",
          SourceID: e.id,
          Damage: -w,
          ...(w > 0 && q > 0
            ? {
                ElementalTypes: h.types,
              }
            : {}),
        }),
        !w)
      )
        return 0;
      for (const k of [e, t])
        isSpirit(this, k) && ((k.special ??= {}).spiritRegenAt = this.time + 5e3);
      if ((rs(this, e, t, w, i), t.ai === 55 && t.master)) {
        const k = this.actor(t.master);
        if (k)
          return (
            (k.mp = Math.max(0, k.mp - w)),
            (t.target = e.id),
            this.emit("ObjectStruck", {
              ObjectID: t.id,
            }),
            k.mp || this.die(t, e),
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
        for (const [k, I, H] of [
          ["Green", 5, 3e4],
          ["Paralysis", 15, 1e4],
        ]) {
          const N = Q(e.stats, "SC", this.rng);
          if (
            this.rng.next(this.rules.constants.PoisonResistWeight) >= (t.stats.PoisonResist || 0) &&
            this.rng.next(I) === 0
          ) {
            this.buff(t, k, H, N, {}, e.id);
            const R = t.buffs.find((D) => D.type === k);
            R && ((R.interval = 2e3), (R.next = this.time + 2e3));
          }
        }
      n === "CaveMaggot" &&
        t.hp > 0 &&
        this.rng.next(this.rules.constants.PoisonResistWeight) >= (t.stats.PoisonResist || 0) &&
        this.rng.next(20) === 0 &&
        this.buff(t, "Paralysis", 5e3, Q(e.stats, "SC", this.rng), {}, e.id);
      const W = e.hp;
      if (e.kind === "player" && t.kind === "monster" && i.startsWith("AC")) {
        const k = e,
          I = this.monsters.get(t.definition).Level,
          H = I > k.level ? 0 : Math.min(10, k.level - I);
        if (
          (this.special(k, "Paralize") &&
            this.rng.next(15, 1) === 1 &&
            this.buff(t, "Paralysis", 5e3, 0, {}, k.id),
          e.stats.Freezing > 0 &&
            this.rng.next(this.rules.constants.FreezingAttackWeight) < e.stats.Freezing &&
            this.rng.next(H) === 0 &&
            this.buff(
              t,
              "Slow",
              Math.min(10, 3 + this.rng.next(e.stats.Freezing)) * 1e3,
              0,
              {},
              k.id,
            ),
          e.stats.PoisonAttack > 0 &&
            this.rng.next(this.rules.constants.PoisonAttackWeight) < e.stats.PoisonAttack &&
            this.rng.next(H) === 0 &&
            this.buff(
              t,
              "Green",
              5e3,
              Math.min(10, 3 + this.rng.next(e.stats.PoisonAttack)),
              {},
              k.id,
            ),
          !this.rules.adaptations.dreamRuntime &&
            e.stats.HPDrainRatePercent > 0 &&
            ((k.special ??= {}),
            (k.special.hpDrain =
              Number(k.special.hpDrain || 0) +
              Math.fround(Math.fround(w / 100) * e.stats.HPDrainRatePercent)),
            Number(k.special.hpDrain) > 2))
        ) {
          const N = Math.floor(Number(k.special.hpDrain));
          ((k.hp = Math.min(k.maxHP, k.hp + N)),
            (k.special.hpDrain = Number(k.special.hpDrain) - N));
        }
      }
      if (
        (i !== "None" && !s && bs(this, e, t, Math.min(w, p), n),
        tr(this, e, t, Math.min(w, p), i, n),
        s || (ir(this, e, t, Math.min(w, p), i), affixManaOnHit(this, e, t, Math.min(w, p), i)),
        Ho(e, t, Math.min(w, Math.max(0, p)), i),
        e.kind === "player" &&
          e.hp > W &&
          this.emit("DamageIndicator", {
            ObjectID: e.id,
            Type: "Heal",
            Damage: e.hp - W,
          }),
        !o && !zn(this, e, t) && (t.target = e.id),
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
        for (let k = 1; k < t.equipment.length; k++) this.wearItem(t, k, 1);
      if (n === "Vampirism" && e.kind === "player") {
        const k = this.skill(e, n)?.s.Level || 0;
        this.schedule("vamp", 1e3, e, e, Math.trunc(w * (k + 1) * 0.25));
      }
      return (
        (t.buffs = t.buffs.filter((k) => k.type !== "LRParalysis" && k.type !== "Trap")),
        ((t.special ??= {}).lastReceivedDamage = w),
        !t.hp && !(t.kind === "monster" && ys(this, t))
          ? this.die(t, e)
          : t.kind === "player" && xo(this, t, e),
        ks(this, e, t, w, i, a, n),
        Go(this, e, t, w, n),
        w
      );
    }
    die(e, t) {
      if (e.kind === "player" && e.trialRun) {
        Ke(this, e, message("trial.failed"));
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
              (u) => u && u.currentDura >= 1e3 && this.defs.get(u.id).Unique.includes("Revival"),
            ))
        ) {
          ((g.special.revivalAt = this.time + 3e5),
            (g.hp = g.maxHP),
            this.refresh(g),
            this.say(message("core.game.die.de43815918")));
          return;
        }
        for (const y of Object.values(this.maps))
          for (const u of y.actors) u.friendly && u.master === g.id && !u.dead && this.die(u, t);
        this.safe(g) || this.deathDrop(g);
      }
      if (isSpirit(this, e) && e.master) {
        const g = this.roles.find((y) => y.id === e.master);
        g &&
          ((g.spiritProgress = {
            level: 0,
            xp: 0,
            curveVersion: 3,
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
        e.kind === "monster" && Fs(this, e),
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
      Zn(this, e);
      const i =
        t.kind === "player"
          ? t
          : t.friendly
            ? isHell(this.rules)
              ? this.roles.find((g) => g.id === t.master)
              : this.me
            : void 0;
      if (
        (i && Pa(this, i),
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
          isHell(this.rules) || Ma(this, i, Number(e.special?.trialXP ?? a.Experience)),
          sr(this, i),
          zo(this, e, i),
          Oo(this, e, i));
        const g = this.rules.adaptations.earlyLoot,
          y = Math.min(
            Math.max(0, i.maxHP - i.hp),
            Math.max(0, Math.min(g.killHPCap, i.stats.KillHP || 0)),
          ),
          u = Math.min(
            Math.max(0, i.maxMP - i.mp),
            Math.max(0, Math.min(g.killMPCap, i.stats.KillMP || 0)),
          );
        if (
          ((i.hp += y),
          (i.mp += u),
          (y || u) &&
            this.say(
              message("core.game.die.6915136761", {
                p0: y,
                p1: u,
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
      if (t.special?.dreamPet && !isSpirit(this, t) && !e.friendly) {
        const g = t.special,
          y = Number(g.petLevel || 0),
          u = Number(g.maxPetLevel || 0);
        if (isHell(this.rules)) hr(t);
        else
          for (
            g.petXP = Number(g.petXP || 0) + a.Experience;
            Number(g.petLevel || 0) < u && Number(g.petXP) >= (Number(g.petLevel || 0) + 1) * 2e4;

          )
            ((g.petXP = Number(g.petXP) - (Number(g.petLevel || 0) + 1) * 2e4),
              (g.petLevel = Number(g.petLevel || 0) + 1));
        g.petLevel !== y && this.refreshActor(t);
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
          (t.kind === "player" && Ma(this, i, g),
            (a.DreamOriginalId !== void 0 || e.special?.trialXP) && this.gainXP(i, g || 1),
            this.rules.adaptations.dreamRuntime.hell.sceneHalfExperience.includes(e.map) &&
              this.gainXP(i, Math.trunc(Number(e.special?.trialXP ?? a.Experience) / 2) || 1));
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
                Te(this.rules.adaptations.dreamRuntime).experienceBonusPercent / 100),
            i.stats.KillXP || 0,
          );
        for (const g of i.quests) {
          const y = this.rules.quests.find((u) => u.Index === g.id);
          (!y?.taskMaps?.length || y.taskMaps.includes(e.map)) &&
            (g.kills[a.Index] = (g.kills[a.Index] || 0) + 1);
        }
      }
      if (
        (i && Tn(this, i, e, a), e.special?.trialFloor && i && (to(this, i), !e.special.trialBoss))
      )
        return;
      const n = hasBossLootBudget(a, this.rules),
        s = [],
        o = Fn(this.rules, a, e);
      let r = 0,
        c = 0,
        l = isHell(this.rules) ? ur(e, this.rng) : 0;
      const f = this.rules.adaptations.dreamRuntime,
        h =
          (Math.max(0, i?.stats.ItemDropRatePercent || 0) +
            Te(this.rules.adaptations.dreamRuntime).dropBonusPercent) /
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
          const u =
            y.dropMultiplierMode === "fixed"
              ? 1
              : f
                ? y.dropMultiplierMode === "casual-only"
                  ? f.casual?.enabled
                    ? f.casual.baseDropMultiplier + f.casual.dropAdd
                    : 1
                  : dreamItemDropMultiplier(
                      f,
                      (i?.stats.ItemDropRatePercent || 0) +
                        (isHell(this.rules) ? 0 : Number(e.special?.dropAdd || 0)),
                    )
                : 1;
          let v = f
            ? y.chancePercent !== void 0
              ? {
                  ...y,
                  chancePercent: Math.min(100, y.chancePercent * u),
                }
              : {
                  ...y,
                  chance: dreamDropDenominator(y.chance, u),
                }
            : y;
          (f &&
            y.chanceBonusPercent &&
            (v = {
              ...v,
              chancePercent:
                Math.round(
                  Math.min(100, (v.chancePercent ?? 100 / v.chance) + y.chanceBonusPercent) * 100,
                ) / 100,
            }),
            i &&
              Pe(i, this.rules)?.guaranteedQuestMaterials &&
              y.item !== null &&
              this.needsQuestItem(i, y.item, e.map) &&
              (v = {
                ...v,
                chance: 1,
              }));
          const x = ga(v, this.defs, this.rules, this.rng);
          if (x) {
            x.gold && (n || f?.lootVolume ? ((r += x.gold), c++) : this.ground(e, void 0, x.gold));
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
                const P = this.newItem(
                  m.id,
                  1,
                  !0,
                  a,
                  i,
                  Number(e.special?.magicAdd || 0) +
                    (isHell(this.rules)
                      ? hellMagicBase2(hellAffixParameter2(e), f?.defaultMagicFind) -
                        (f?.defaultMagicFind ?? 3)
                      : 0),
                );
                (isHell(this.rules) && (l = mr(P, M, e, this.rng, this.rules, l)),
                  n || f?.lootVolume ? s.push(P) : this.ground(e, P));
              }
            }
          }
        }
      if (
        (!isHell(this.rules) && f && (n || f.lootVolume) && Ln(this, e, a, i, s), f?.lootVolume)
      ) {
        const g = hasUnrestrictedNativeLoot(a, this.rules);
        if (g && !isChallengeChest(a, this.rules))
          for (const u of ui(s, o, this.defs, this.rng, c)) s.push(this.newItem(u, 1, !0, a, i));
        const y = Qs(s, this.defs, this.rng, f.lootVolume, g, r, (u) =>
          i ? this.questItemDeficit(i, u, e.map) : 0,
        );
        for (const u of y.items) this.ground(e, u);
        (y.gold && this.ground(e, void 0, Math.min(4294967295, y.gold)),
          this.dropBossGold(e, a, i),
          this.dropBossAccessories(e, a, i));
        return;
      }
      if (n) {
        if (this.rules.adaptations.dreamRuntime)
          for (const y of ui(s, o, this.defs, this.rng, c)) s.push(this.newItem(y, 1, !0, a, i));
        const g = this.rules.adaptations.dreamRuntime ? s : _n(s, this.defs, this.rules, this.rng);
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
        for (const [r, c] of V) {
          const l = o.x + r,
            f = o.y + c,
            h = `${l},${f}`;
          A(e, {
            x: l,
            y: f,
          }) > 8 ||
            n.has(h) ||
            l < 0 ||
            f < 0 ||
            l >= t.width ||
            f >= t.height ||
            t.solid[f * t.width + l] ||
            (n.add(h),
            i.push({
              x: l,
              y: f,
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
      const [i, n] = V[t];
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
        (e.moveAt = e.kind === "player" ? e.actionAt : e.actionAt + Cs(this, e)),
        e.kind === "monster" && (e.attackAt = Math.max(e.attackAt, e.moveAt)),
        e.kind === "player" && this.enterStandingPortal(e),
        !0
      );
    }
    enterStandingPortal(e) {
      this.npc = 0;
      const t = Ai(this, e.map).find((a) => a.at[0] === e.x && a.at[1] === e.y);
      if (t) {
        if (t.requiresQuest && !e.completedQuests.includes(t.requiresQuest)) {
          this.say(message("core.game.enterStandingPortal.e1c67e0e28"));
          return;
        }
        if (t.requiresItem) {
          if (this.count(e, t.requiresItem) < 1) {
            this.say(message("core.game.enterStandingPortal.1f8f9c2a17"));
            return;
          }
          this.consume(e, t.requiresItem, 1);
        }
        e.target = 0;
        const a = this.rules.adaptations.mainline?.corpsePalace;
        (a &&
          e.map === a.sourceMap &&
          t.to === a.targetMap &&
          (this.map(t.to).portals = [
            {
              to: e.map,
              name: message("map.portal.returnMine"),
              at: [21, 16],
              landing: [e.x, e.y],
            },
          ]),
          (e.map = t.to),
          (e.x = t.landing[0]),
          (e.y = t.landing[1]),
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
      const [i, n] = V[t],
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
      if (!ja(this, e, o, a, s)) {
        if (o) {
          this.attack(e, o, a);
          return;
        }
        ((e.dir = t),
          (e.attackAt = this.time + ot(e.level, e.stats)),
          (e.actionAt = this.time + Math.min(550, e.attackAt - this.time)),
          this.emit("ObjectAttack", {
            ObjectID: e.id,
            Direction: E[t],
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
        A(e, t) > 1 ||
        this.time < Math.max(e.actionAt, e.attackAt) ||
        ((e.dir = direction(e, t)), ja(this, e, t, a))
      )
        return;
      const i = this.skill(e, a);
      a !== "None" && !i && (a = "None");
      const n = ot(e.level, e.stats, !!this.rules.adaptations.dreamRuntime);
      ((e.attackAt = this.time + n),
        (e.actionAt = this.time + Math.min(550, n)),
        (e.regenAt = this.time + 1e4),
        this.emit("ObjectAttack", {
          ObjectID: e.id,
          Direction: E[e.dir],
          Spell: a,
        }));
      let s = F(this, e, "DC"),
        o = "ACAgility";
      if (i) {
        const c = a[0].toLowerCase() + a.slice(1);
        if (
          (["FlamingSword", "TwinDrakeBlade", "Slaying"].includes(a) &&
            !e.attackModes[c] &&
            (a = "None"),
          ["HalfMoon", "CrossHalfMoon"].includes(a))
        ) {
          const l = de(i.d, i.level, e.stats);
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
            f = (l - e.dir + 8) % 8;
          (a === "Thrusting"
            ? l === e.dir && A(e, c) === 2
            : A(e, c) === 1 && (a === "CrossHalfMoon" || f <= 2 || f >= 6)) &&
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
          if (n.kind === "magic" && !s.dead && !o.dead) yi(this, s, o, n);
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
              A(o, n.location) >
                (["IceFlame", "IceStorm", "FireBang"].includes(n.spell || "") ? 1 : 2)
            )
              continue;
            const r = this.damage(s, o, n.damage, n.defence, n.spell, !1, !1, n.monsterBasicAttack);
            if (
              (gs(this, s, o, r, n.spell),
              Es(this, s, o, r, n),
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
              yi(this, s, o, {
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
              ? ws(this, o, r)
              : o.kind === "player"
                ? (o.healHP += r)
                : (o.hp = Math.min(o.maxHP, o.hp + r));
          }
        }
      }
      for (const n of [t, ...this.map(t.map).actors]) {
        if (
          (Ss(this, n),
          Un(this, n),
          (n.kind === "monster" && !n.friendly && A(n, t) > 24 && !n.buffs.length) || n.dead)
        )
          continue;
        for (const o of n.buffs)
          if (
            o.next <= this.time &&
            (o.until > this.time || (o.nativeMonsterPoison && o.next <= o.until)) &&
            ((o.next += o.interval || 1e3),
            Ps(this, n, o),
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
        Jo(this, t));
      const i = t.skills.find((n) => n.Spell === "CounterAttack");
      i && i.CastTime <= this.time && (t.attackModes.counterAttack = !1);
      for (const n of [...this.map(t.map).actors])
        if (n.kind === "monster") {
          if ((!n.friendly && A(n, t) > 24 && !n.buffs.length) || this.recallDistantPet(n, t))
            continue;
          const s = this.actor(n.target);
          (!n.friendly && s && !this.monsterCanSee(n, s) && (n.target = 0),
            Ds(this, n, t) && !Vo(this, n, t) && this.ai(n, t));
        } else n.kind === "spell" && qs(this, n);
      ((this.map(t.map).actors = this.map(t.map).actors.filter(
        (n) => !n.expires || n.expires > this.time,
      )),
        Aa(this, t),
        ao(this, t),
        Ko(this, t));
    }
    regen(e) {
      if (
        (fo(e, this.rules, this.time),
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
        Gs(e, this.time),
        this.time >= e.healAt)
      ) {
        e.healAt = this.time + 600;
        const t = Math.min(e.healHP, 5 + Math.trunc(e.level / 10) + Math.trunc(e.healHP / 10));
        ((e.healHP -= t), (e.hp = Math.min(e.maxHP, e.hp + t)));
      }
      (e.hp === e.maxHP && (e.potHP = 0), e.mp === e.maxMP && (e.potMP = 0));
    }
    petLanding(e) {
      const t = Ai(this, e.map);
      for (let a = 1; a <= 5; a++)
        for (let i = e.y - a; i <= e.y + a; i++)
          for (let n = e.x - a; n <= e.x + a; n++)
            if (
              A(e, {
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
        A(e, t) <= 10 ||
        (e.special?.tameUntil && Number(e.special.tameUntil) <= this.time)
      )
        return !1;
      e.target = 0;
      const a = this.petLanding(t);
      return (a && ((e.x = a.x), (e.y = a.y)), !0);
    }
    ai(e, t) {
      const a = this.monsters.get(e.definition),
        i = e.friendly && e.master === t.id && !t.dead;
      if (
        this.recallDistantPet(e, t) ||
        this.time < e.actionAt ||
        e.buffs.some((s) =>
          ["Paralysis", "LRParalysis", "Trap", "Frozen", "Shock", "Stun"].includes(s.type),
        )
      )
        return;
      if (i && A(e, t) > 6) {
        ((e.target = 0), this.time >= e.moveAt && this.stepTowards(e, t));
        return;
      }
      let n = this.actor(e.target);
      if (
        (!e.friendly && n && !this.monsterCanSee(e, n) && (n = void 0),
        e.buffs.some((s) => s.type === "Hallucination"))
      )
        n = this.map(e.map).actors.find(
          (s) =>
            s.id !== e.id &&
            s.kind === "monster" &&
            !s.dead &&
            targetableMonster(s) &&
            A(e, s) <= a.ViewRange,
        );
      else if (e.friendly) {
        if (A(e, t) > 12) {
          ((e.target = 0), this.time >= e.moveAt && this.stepTowards(e, t));
          return;
        }
        if (e.special?.resting) {
          ((e.target = 0), A(e, t) > 2 && this.time >= e.moveAt && this.stepTowards(e, t));
          return;
        }
        (!n ||
          n.dead ||
          n.kind !== "monster" ||
          n.friendly ||
          (i && (n.map !== t.map || A(n, t) > 6))) &&
          (n = this.map(e.map).actors.find(
            (s) =>
              s.kind === "monster" &&
              !s.friendly &&
              !s.dead &&
              A(s, e) <= 8 &&
              (!i || A(s, t) <= 6),
          ));
      } else if (!n || n.dead || n.map !== e.map) {
        const s = [t, ...this.map(e.map).actors.filter((o) => o.friendly && o.master === t.id)];
        n =
          a.AI !== 1 && (a.AI !== 2 || e.special?.runAway)
            ? s
                .filter(
                  (o) =>
                    !o.dead &&
                    o.map === e.map &&
                    !this.safe(o) &&
                    A(e, o) <= a.ViewRange &&
                    this.monsterCanSee(e, o),
                )
                .sort((o, r) => A(e, o) - A(e, r))[0]
            : void 0;
      }
      if (
        (n && (A(e, n) > 15 || (n.kind === "player" && this.safe(n))) && (n = void 0),
        (e.target = n?.id || 0),
        n)
      ) {
        if (Hs(this, e, n)) return;
        const s = isSpirit(this, e)
          ? this.rules.adaptations.noviceProgression.spiritRange
          : (ps(this, e) ?? Is(e, n));
        A(e, n) <= s && this.time >= e.attackAt
          ? (isSpirit(this, e) && ((e.special ??= {}).spiritRegenAt = this.time + 5e3),
            Ns(this, e, n))
          : A(e, n) > s &&
            this.time >= e.moveAt &&
            (a.DreamRaw || a.MoveSpeed > 0) &&
            this.stepTowards(e, n);
      } else
        e.friendly && A(e, t) > 2 && this.time >= e.moveAt
          ? this.stepTowards(e, t)
          : !i &&
            this.time >= e.moveAt &&
            (a.DreamRaw || a.MoveSpeed > 0) &&
            (this.move(e, this.rng.next(8)),
            (e.moveAt = this.time + Math.max(1e3, a.MoveSpeed) * 3));
    }
    stepTowards(e, t) {
      const a = direction(e, t);
      for (const i of [0, 1, -1, 2, -2]) if (this.move(e, (a + i + 8) % 8)) return;
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
        A(e, {
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
        Ha(this, e, a === "@challengeevil" ? "evil" : "settle");
        return;
      }
      if (a === "@challengeclaim") {
        claimChallengeRewards(this, e);
        return;
      }
      if (a === "@late-evil-dragon" || a === "@late-po-settle") {
        Ha(this, e, a === "@late-evil-dragon" ? "evil" : "settle");
        return;
      }
      if (a.startsWith("@late-")) {
        qn(this, e, a);
        return;
      }
      if (t.role === "trial" && a === "@main") {
        this.emit("NPCResponse", {
          NPCID: t.id,
          Page: Zs(this, e),
        });
        return;
      }
      if (a.startsWith("@trial")) {
        eo(this, e, a);
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
      if (Kn(this, e, t, a)) return;
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
        io(this, e, a === "@craftgraduate");
        return;
      }
      if (a === "@craftopen") {
        this.emit("OpenForge", {
          Mode: "craft",
        });
        return;
      }
      if (a.startsWith("@challenge-")) {
        Sa(this, e, a.slice(11));
        return;
      }
      if (a === "@challengestart") {
        Hn(this, e);
        return;
      }
      if (a === "@challengeleave") {
        (this.requireNPC(e), ka(this, e));
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
        .map(({ index: n }) => $n(t.id, a, n, e.name));
      if (
        (a === "@main" &&
          this.rules.adaptations.towns?.settlements.some((n) => n.npcIds.includes(t.id)) &&
          i.splice(
            1,
            0,
            message("npc.residence", {
              town: entityText("towns", ut(e, this.rules).id),
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
            ...Xn(this, e, t),
            ...Ra(this, e, t),
            ...(t.id === 9420 || t.role === "challenge" ? Rn(e, t.id) : []),
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
        (!!Pe(e, this.rules) ||
          [7, 8].some((t) => {
            const a = e.equipment[t],
              i = a && this.defs.get(a.id);
            return (
              !!a &&
              i?.Type === "Ring" &&
              i.Unique.split(",")
                .map((n) => n.trim())
                .includes("Teleport") &&
              (!a.maxDura || a.currentDura > 0)
            );
          }))
      );
    }
    command(e, t = {}) {
      const a = this.me;
      if (!a) throw new b(message("core.game.command.1bf8172441"));
      if (a.dead && !["TownRevive", "LogOut"].includes(e))
        throw new b(message("core.game.command.db61d62a9c"));
      switch (e) {
        case "SetEquipmentLock":
          Pn(this, a, t);
          break;
        case "SellEquipmentBatch":
          In(this, a, t);
          break;
        case "SetAssist":
          a.assist = Ei(t);
          break;
        case "PetControl": {
          const i = Object.values(this.maps)
              .flatMap((s) => s.actors)
              .filter((s) => s.friendly && !s.dead && s.master === a.id),
            n = String(t.Mode);
          if (n === "dismiss") {
            for (const s of i) ((s.dead = !0), (s.hp = 0), (s.expires = this.time));
            this.say(message("core.game.command.422dfabde1"));
            break;
          }
          if (n === "rest") {
            const s = !i.every((o) => o.special?.resting);
            for (const o of i) ((o.special ??= {}), (o.special.resting = s), (o.target = 0));
            this.say(message(s ? "core.game.command.83a5bd6ade" : "core.game.command.34f79b63ab"));
            break;
          }
          if (n === "recall") {
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
            for (const o of i) ((o.special ??= {}), (o.special.resting = !1), (o.target = s.id));
            break;
          }
          throw new b(message("core.game.command.6cf95a2137"));
        }
        case "ForgeQuote": {
          try {
            this.emit("ForgeQuote", oi(this, a, t));
          } catch (i) {
            if (t.Mode !== "cube") throw i;
            this.emit("ForgeQuote", {
              cubeSelection: t.Selected,
              canForge: !1,
              error: Ht(i),
            });
          }
          break;
        }
        case "Forge":
          so(this, a, t);
          break;
        case "BindItemHotkey": {
          const i = Number(t.Key);
          if (!Number.isInteger(i) || i < 0 || i >= 6)
            throw new b(message("core.game.command.9a1bdb63f7"));
          if ((migrateItemHotkeys(a, this.defs), t.UniqueID === null)) {
            a.itemHotkeys[i] = null;
            break;
          }
          const n = a.inventory.find((s) => s?.uid === Number(t.UniqueID));
          if (!n || !Ri.includes(this.defs.get(n.id).Type))
            throw new b(message("core.game.command.de1f6c0544"));
          a.itemHotkeys[i] = n.id;
          break;
        }
        case "UseItemHotkey": {
          const i = Number(t.Key);
          if (!Number.isInteger(i) || i < 0 || i >= 6)
            throw new b(message("core.game.command.9a1bdb63f7"));
          migrateItemHotkeys(a, this.defs);
          const n = a.itemHotkeys[i];
          if (n === null) break;
          const s = a.inventory.find((o) => o?.id === n);
          if (!s) throw new b(message("core.game.command.4795782b6e"));
          this.command("UseItem", {
            UniqueID: s.uid,
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
                p0: message(Pe(a, this.rules) ? "game.teleport.talisman" : "game.teleport.ring"),
                p1: i,
                p2: n,
              }),
            ),
            this.enterStandingPortal(a));
          break;
        }
        case "Walk":
        case "Run":
          this.move(a, E.indexOf(t.Direction), e === "Run" ? 2 : 1);
          break;
        case "Turn": {
          const i = E.indexOf(t.Direction);
          i >= 0 && (a.dir = i);
          break;
        }
        case "Attack": {
          if (t.Force) {
            this.forceAttack(a, E.indexOf(String(t.Direction)), String(t.Spell || "None"));
            break;
          }
          const i = this.actor(Number(t.TargetID));
          i && this.attack(a, i, String(t.Spell || "None"));
          break;
        }
        case "Magic":
          if (mountedItem(this, a)) throw new b(message("core.game.command.1a01d4ad93"));
          ia(this, a, t);
          break;
        case "ToggleMount":
          Wt(this, a);
          break;
        case "SpellToggle":
          ta(this, a, String(t.Spell), !!t.CanUse);
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
            (n) => n.kind === "item" && n.x === a.x && n.y === a.y,
          );
          if (!i) break;
          if (i.item?.id === this.rules.adaptations.adventure.chestId) {
            Xo(this, a, i);
            break;
          }
          if (i.gold)
            ((a.gold += i.gold),
              this.emit("GainedGold", {
                Gold: i.gold,
              }));
          else if (i.item && !this.give(a, i.item))
            throw new b(message("core.game.command.f4f8709c7f"));
          this.map(a.map).actors = this.map(a.map).actors.filter((n) => n !== i);
          break;
        }
        case "CombineItem":
          No(this, a, Number(t.IDFrom), Number(t.IDTo));
          break;
        case "ExchangeScarletSword":
          On(this, a, Array.isArray(t.Selected) ? t.Selected.map(Number) : []);
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
            Wt(this, a, n.uid);
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
            A(a, {
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
            const f = Math.trunc(price(l, this.defs.get(l.id)) / l.count) * s;
            if (a.gold < f) throw new b(message("core.game.command.e55f88c1eb"));
            const h = {
              ...structuredClone(l),
              uid: s === l.count ? l.uid : this.nextId++,
              count: s,
            };
            if ((delete h.buybackAt, !this.give(a, h)))
              throw new b(message("core.game.command.f4f8709c7f"));
            ((a.gold -= f), (l.count -= s), (a.buyback[i.id] = c.filter((p) => p.count > 0)));
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
          if ((t.Shared !== void 0 && typeof t.Shared != "boolean") || (n && !oe(this.rules)))
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
          const f = c[o];
          if (n && e === "StoreItem" && !Ki(f, this.defs.get(f.id), this.rules))
            throw new b(message("storage.sharedOnly"));
          if (t.UniqueID !== void 0 && Number(t.UniqueID) !== f.uid)
            throw new b(message("core.game.command.cda3a5c696"));
          if (e === "TakeBackItem" && !bagSlotAccepts(a, this.rules, this.defs.get(f.id), r))
            throw new b(message("storage.bagCategoryFull"));
          ((l[r] = f), (c[o] = null));
          break;
        }
        case "SortStorage": {
          if (t.Shared !== void 0 && typeof t.Shared != "boolean")
            throw new b(message("storage.sharedUnavailable"));
          if (this.requireNPC(a).role !== "storage")
            throw new b(message("core.game.command.fc8754400b"));
          if (t.Shared === !0) {
            if (!oe(this.rules)) throw new b(message("storage.sharedUnavailable"));
            this.sharedStorage = Je(this.sharedStorage, this.defs, () => this.nextId++);
          } else a.storage = Je(a.storage, this.defs, () => this.nextId++);
          break;
        }
        case "UnlockStoragePage": {
          if (this.requireNPC(a).role !== "storage") throw new b(message("storage.unlockNPC"));
          Mn(a, Number(t.Page));
          break;
        }
        case "SortInventory": {
          va(a, this.rules, this.defs);
          const i = equipmentCapacity(a, this.rules);
          a.inventory =
            a.bagLayoutVersion === 1
              ? [
                  ...Je(a.inventory.slice(0, i), this.defs, () => this.nextId++),
                  ...Je(a.inventory.slice(i), this.defs, () => this.nextId++),
                ]
              : Je(a.inventory, this.defs, () => this.nextId++);
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
          const i = ut(a, this.rules),
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
          (this.dismissPets(a), (this.active = 0), (this.npc = 0));
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
      for (const i of Ft(a, this.rules)) {
        const n = this.rules.adaptations.towns.waypoints.find((s) => s.id === i);
        this.say(
          message("npc.waypointUnlocked", {
            map: entityText("maps", n.map),
          }),
        );
      }
    }
    checkUse(e, t) {
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
      if (!(co(this, e, i) || En(this, e, i))) {
        if (n.Type === "Mount") {
          Wt(this, e, i.uid);
          return;
        }
        if (n.Type === "MountVoucher") {
          ts(this, e, i.uid);
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
                  ...wi(this, e, i, o),
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
              e.skills = e.skills.filter((f) => f.Spell !== n.Spell || !f.temporary);
              const l =
                ([
                  ...Object.values(this.rules.adaptations.noviceProgression?.firstBookByJob || {}),
                  ...Object.values(this.rules.adaptations.noviceProgression?.secondBookByJob || {}),
                ].includes(n.Index) &&
                  !s.DreamSkill?.passive &&
                  [1, 2, 3, 4, 5, 6, 7, 8].find((f) => !e.skills.some((h) => h.Key === f))) ||
                0;
              e.skills.push({
                Spell: n.Spell,
                Level: r,
                Key: l,
                Experience: 0,
                CastTime: 0,
              });
            }
            (Ta(e),
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
          Eo(this, e);
          return;
        } else if (n.Type === "TreasureMap") Uo(this, e);
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
            $s(
              e,
              Math.floor((n.Stats.HP || 0) * (1 + (e.stats.PotionHealingPercent || 0) / 100)),
              n.Stats.MP || 0,
              this.time,
            );
          else if (n.Shape === 1) {
            (isSunPotion(n) && (e.sunPotionAt = this.time + _a), Ws(e, n, this.time));
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
          const s = ut(e, this.rules),
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
              f = this.rng.next(l);
            for (let h = 0; h < l; h++) {
              const p = (f + h) % l,
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
        ft(this, e) && this.refresh(e),
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
    snapshot(e = -1) {
      const t = this.me;
      (t && t.mountUid && !mountedItem(this, t) && delete t.mountUid,
        t && sa(this, t),
        t && this.recoverLegacyMeat(t));
      const a = t ? structuredClone(t) : null;
      let i = null;
      a &&
        (i = {
          ...a,
          spiritGrowth: this.rules.adaptations.noviceProgression?.spiritGrowth
            ? {
                cap: this.rules.adaptations.noviceProgression.spiritGrowth.cap,
                nextXP: spiritNextXP(
                  this.rules.adaptations.noviceProgression.spiritGrowth,
                  a.spiritProgress?.level || 0,
                ),
              }
            : void 0,
          heavyStrikeHits:
            this.time - Number(a.special?.heavyHitAt ?? -1 / 0) <= 8e3
              ? Number(a.special?.heavyHits || 0)
              : 0,
          honorTitle: this.rules.adaptations.trial?.titles[(a.trial?.title || 0) - 1]
            ? entityText("honorTitles", a.trial.title)
            : "",
          dynamicPortals: (this.map(a.map).portals || [])
            .filter((s) => !s.expires || s.expires > this.time)
            .map((s) => ({
              MapIndex: s.to,
              Name: s.name,
              Source: {
                x: s.at[0],
                y: s.at[1],
              },
              Destination: {
                x: s.landing[0],
                y: s.landing[1],
              },
            })),
          lateQuestRows: Na(this, t),
          nextXP: this.rules.growth.experience[a.level - 1] || 1,
          buffs: a.buffs.map((s) => s.type),
          buffDetails: a.buffs.map((s) => ({
            type: s.type,
            remainingMs: Math.max(0, s.until - this.time),
            stats: s.stats,
            value: s.value,
            spell: s.spell,
          })),
          potionRecovery: js(t, this.time),
          sunPotionRemainingMs: sunPotionRemaining(t, this.time),
          snowPotionRemainingMs: Math.max(
            0,
            Math.min(8e3, (t.itemCooldowns?.snow || 0) - this.time),
          ),
          canMapTeleport: this.canMapTeleport(a),
          trial: a.trial,
          trialRun: a.trialRun
            ? {
                ...a.trialRun,
                remainingMs: Math.max(0, a.trialRun.deadline - this.time),
              }
            : void 0,
          challenge: a.challengeRun
            ? {
                ...a.challengeRun,
                remainingMs: Math.max(
                  0,
                  (a.challengeRun.returnAt ?? a.challengeRun.deadline) - this.time,
                ),
              }
            : void 0,
          bossRespawns: this.region(a.map).spawns.flatMap((s, o) => {
            const r = this.rules.monsters.find((f) => f.Name === s.monster);
            if (!r?.IsBoss && !s.native?.boss && !s.boss) return [];
            const c = this.map(a.map).actors.filter((f) => f.spawn === o && !f.dead).length;
            return [
              {
                positions: this.map(a.map)
                  .actors.filter((f) => f.spawn === o && !f.dead && !f.friendly)
                  .map((f) => ({
                    x: f.x,
                    y: f.y,
                  })),
                definition: r?.Index,
                name: r?.DreamName || r?.GuideName || r?.Name,
                alive: c,
                cap: s.count,
                remainingMs: Math.max(0, (this.map(a.map).respawns[o] || 0) - this.time),
                intervalMs: s.respawnMinutes * 6e4,
              },
            ];
          }),
          testTalisman: a.dead ? null : Pe(a, this.rules) || null,
          worldFirework: this.rules.adaptations.dreamRuntime?.worldFirework?.enabled
            ? {
                permanent: !0,
                experienceBonusPercent: Te(this.rules.adaptations.dreamRuntime)
                  .experienceBonusPercent,
                monsterExperienceMultiplier:
                  (this.rules.multipliers.monsterExperienceMultiplier +
                    Te(this.rules.adaptations.dreamRuntime).experienceBonusPercent / 100) *
                  (1 + Math.max(0, a.stats.ExpRatePercent || 0) / 100),
                dropMultiplier: dreamItemDropMultiplier(
                  this.rules.adaptations.dreamRuntime,
                  a.stats.ItemDropRatePercent,
                ),
                killXP: Math.max(0, a.stats.KillXP || 0),
                magicFind: dreamMagicFind(this.rules.adaptations.dreamRuntime, a.stats.MagicFind),
                exceptionalChance: dreamExceptionalChance(
                  dreamMagicFind(this.rules.adaptations.dreamRuntime, a.stats.MagicFind),
                ),
                exceptionalChancesByGrade: Object.fromEntries(
                  [0, 1, 2, 3, 4, 5, 6, 7].map((s) => [
                    s,
                    dreamEquipmentExceptionalChance(
                      this.rules.adaptations.dreamRuntime,
                      s,
                      dreamMagicFind(this.rules.adaptations.dreamRuntime, a.stats.MagicFind),
                    ),
                  ]),
                ),
              }
            : null,
          canRun: !a.dead,
          canAttack: !a.dead,
          attackDelay: ot(a.level, a.stats, !!this.rules.adaptations.dreamRuntime),
          attackReadyIn: Math.max(0, Math.max(a.attackAt, a.actionAt) - this.time),
          actionReadyIn: Math.max(0, a.actionAt - this.time),
          spellReadyIn: Math.max(0, Math.max(a.spellAt, a.actionAt) - this.time),
          bagWeight: this.bagWeight(a),
          skills: a.skills.map((s) => ({
            ...s,
            LearnedLevel: s.Level,
            EffectiveLevel: this.skill(a, s.Spell)?.level ?? s.Level,
            Info: this.rules.skills.find((o) => o.Spell === s.Spell),
          })),
          quests: a.quests.map((s) => {
            const o = this.rules.quests.find((r) => r.Index === s.id);
            return {
              id: s.id,
              info: this.questInfo(o, a),
              progress: {
                TaskList: [
                  entityText("quests", o.Index, "objective"),
                  ...(o.KillTotal !== void 0
                    ? [
                        message("quest.killTotal", {
                          current: Math.min(o.KillTotal, this.questKillTotal(s.kills, o)),
                          required: o.KillTotal,
                        }),
                      ]
                    : o.KillTasks.map((r) =>
                        message("quest.progress", {
                          name: entityText("monsters", r.monster),
                          current: s.kills[r.monster] || 0,
                          required: r.count,
                        }),
                      )),
                  ...o.ItemTasks.map((r) =>
                    message("quest.progress", {
                      name: entityText("items", r.item),
                      current: this.count(a, r.item),
                      required: r.count,
                    }),
                  ),
                ],
                KillCount: o.KillTasks.map((r) => s.kills[r.monster] || 0),
                ItemCount: o.ItemTasks.map((r) => this.count(a, r.item)),
                Completed: this.questComplete(a, o),
              },
            };
          }),
        });
      const n = t
        ? this.map(t.map)
            .actors.filter((s) => A(s, t) <= 24 && ht(s))
            .map((s) => {
              if (s.ai === 55 && s.master) {
                const o = this.roles.find((r) => r.id === s.master);
                if (o)
                  return {
                    ...s,
                    kind: "clone",
                    name: o.name,
                    gender: o.gender,
                    equipment: structuredClone(o.equipment),
                    buffs: s.buffs.map((r) => r.type),
                  };
              }
              return s.kind !== "npc"
                ? {
                    ...s,
                    displayName: s.kind === "monster" ? Wn(s, this.rules) : void 0,
                    rank:
                      s.kind === "monster"
                        ? Lt(this.monsters.get(s.definition), this.rules)
                        : void 0,
                    extra: !!s.special?.stoned,
                    x:
                      s.kind === "spell" && s.show && s.spell !== "FireWall"
                        ? (s.stats.centerX ?? s.x)
                        : s.x,
                    y:
                      s.kind === "spell" && s.show && s.spell !== "FireWall"
                        ? (s.stats.centerY ?? s.y)
                        : s.y,
                    buffs: s.buffs.map((o) => o.type),
                    poison: s.buffs.map((o) => o.type).join(", "),
                  }
                : {
                    ...s,
                    quests: this.rules.quests
                      .filter((o) => o.acceptNpc === s.id || o.finishNpc === s.id)
                      .map((o) => ({
                        id: o.Index,
                        name: o.Name,
                        canAccept:
                          o.acceptNpc === s.id &&
                          !t.quests.some((r) => r.id === o.Index) &&
                          !t.completedQuests.includes(o.Index) &&
                          t.level >= o.RequiredMinLevel &&
                          t.level <= o.RequiredMaxLevel &&
                          (!o.RequiredQuest || t.completedQuests.includes(o.RequiredQuest)),
                        canFinish: o.finishNpc === s.id && this.questComplete(t, o),
                        info: this.questInfo(o, t),
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
          currentMonsters: t
            ? this.map(t.map).actors.filter((s) => s.kind === "monster" && !s.dead).length
            : 0,
          awakeMonsters: t
            ? this.map(t.map).actors.filter(
                (s) =>
                  s.kind === "monster" &&
                  !s.dead &&
                  (s.friendly || A(s, t) <= 24 || s.buffs.length),
              ).length
            : 0,
        },
        lastSaved: this.lastSaved,
        ...(oe(this.rules)
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
        stage: t ? "Game" : "Select",
        roles: this.roles.map((s) => ({
          id: s.id,
          cloudId: s.cloudId,
          name: s.name,
          job: s.job,
          gender: s.gender,
          level: s.level,
        })),
        me: i,
        actors: n,
        mapMonsters: t
          ? this.map(t.map)
              .actors.filter(
                (s) =>
                  s.kind === "monster" &&
                  !s.dead &&
                  A(s, t) <= 24 &&
                  (ht(s) ||
                    [19, 131].includes(
                      Number(this.monsters.get(s.definition)?.DreamOriginalId || 0),
                    )),
              )
              .map((s) => ({
                id: s.id,
                kind: s.kind,
                x: s.x,
                y: s.y,
                name: s.name,
                friendly: s.friendly,
                dead: s.dead,
                rank: Lt(this.monsters.get(s.definition), this.rules),
              }))
          : [],
        packets: e < 0 ? [] : this.packets.filter((s) => s.seq > e),
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
        ...(oe(this.rules)
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
        ((e = di(Pi(e, this.rules), this.rules)),
        e.version !== 1 || e.rulesVersion !== this.rules.version)
      )
        throw new b(message("core.game.restore.8d582cc5cd"));
      ((this.roles = structuredClone(e.roles)),
        (this.sharedStorage = oe(this.rules)
          ? structuredClone(e.sharedStorage ?? Array(Ze).fill(null))
          : Array(Ze).fill(null)),
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
          (i && n && (ji(i, n, this.rules.adaptations.dreamRuntime?.affixes), hi(i, this.rules)),
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
        for (const n of Object.keys(i.crafting?.skills ?? {})) ii(this, i, n);
        (qo(i, this.rules), migrateItemHotkeys(i, this.defs), va(i, this.rules, this.defs));
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
          n.kind === "monster" && !n.special && Ga(this, n, this.monsters.get(n.definition));
      ((this.events = structuredClone(e.events)),
        (this.nextOrder = e.nextOrder),
        (this.lastSaved = e.lastSaved),
        (this.sync = e.sync ? structuredClone(e.sync) : void 0),
        (this.active = 0),
        (this.npc = 0));
    }
  },
  Mt = [
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
  me = {
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


for (let e = 0; e < Mt.length; e++)
  ((me[23 + e] = "SkillLevel:" + Mt[e]), (me[46 + e] = "SkillDamage:" + Mt[e]));
function _o(e, t) {
  const a = {};
  for (const i of e.affixes || []) {
    if (!i.revealed || (t && Li[i.group] && Li[i.group] !== t)) continue;
    if (i.type === 1009) {
      for (const s of ["StoneRecoveryPercent", "FreezeRecoveryPercent"]) a[s] = (a[s] || 0) + i.low;
      continue;
    }
    const n = me[i.type];
    n && !n.startsWith("SkillDamage:") && (a[n] = (a[n] || 0) + i.low);
  }
  return a;
}
((me[1033] = "SkillLevel:Hydra"),
  (me[1001] = "CastSpeed"),
  (me[1002] = "KillXP"),
  Object.assign(me, {
    1003: "NativeMoveSpeed",
    1004: "DreamCritPercent",
    1005: "DreamCritDamagePercent",
    1006: "HPRatePercent",
    1007: "NativePhysicalAbsorbPercent",
    1008: "NativeMagicAbsorbPercent",
    1010: "AffixDamagePercent",
  }));
var Li = {
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
Object.assign(me, {
  1020: "AffixLifeOnHit",
  1021: "AffixLifeDrainPercent",
  1023: "AffixManaOnHit",
  1024: "AffixManaDrainPercent",
  1026: "AffixPoisonDamage",
  1027: "AffixSummonDamage",
});
var Wi = new Set([
  1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009, 1010, 1020, 1021, 1022, 1023, 1024, 1025,
  1026, 1027, 1028, 1029, 1030, 1031, 1032, 1033,
]);
function Ye(e, t) {
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
function ji(e, t, a) {
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
function Yo(e, t) {
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
    i = Ye(e, "Warrior") && !Ye(e, "Wizard") && !Ye(e, "Taoist");
  return Object.values(t)
    .filter(
      (n) =>
        !n.ControlledChannel &&
        n.Weight > 0 &&
        (!n.AuxiliaryOnly || auxiliaryAffixSlot(e)) &&
        (!n.WearableJob || supportsWearableJob(e, n.WearableJob)) &&
        (!n.EquipmentJob || Ye(e, n.EquipmentJob)) &&
        (!n.ExcludeEquipmentJob || !Ye(e, n.ExcludeEquipmentJob)) &&
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
function Qi(e, t, a) {
  if (a <= 0) return 0;
  const i = affixCandidates(e, t),
    n = i.filter((c) => c.Prefix);
  if (!i.some((c) => !c.Prefix && (c.RollChancePercent ?? 100) === 100))
    throw new Error(`No guaranteed suffix in affix pool ${e.Index}`);
  let s = 0;
  const o = (c, l) => {
      if (!l) return 1;
      if (!c.length || l > new Set(c.filter((h) => gt.has(h.Type)).map((h) => h.Type)).size)
        return 0;
      const f = c.reduce((h, p) => h + p.Weight, 0);
      return c
        .filter((h) => gt.has(h.Type))
        .reduce(
          (h, p) =>
            h +
            ((0.5 * p.Weight) / f) *
              o(
                c.filter((g) => g.Type !== p.Type),
                l - 1,
              ),
          0,
        );
    },
    r = (c, l, f) => {
      if (c === n.length) {
        s += f * o(l, Math.min(6, a));
        return;
      }
      const h = n[c],
        p = (h.RollChancePercent ?? 100) / 100;
      (p > 0 && r(c + 1, [...l, h], f * p), p < 1 && r(c + 1, l, f * (1 - p)));
    };
  return (r(0, [], 1), 1 - s);
}
function wt(e, t, a, i, n, s) {
  const o = effectiveAffixGrade(t);
  if (!(o > 0) || n <= 0) return;
  const r = affixCandidates(t, i).filter(
    (f) => f.RollChancePercent === void 0 || a.next(100) < f.RollChancePercent,
  );
  e.affixes = [];
  const c = {
      prefix: 0,
      suffix: 0,
    },
    l = Math.min(6, n);
  for (let f = 0; f < l && r.length; f++) {
    let h = c.prefix >= 3 ? !1 : c.suffix >= 3 ? !0 : a.next(2) !== 0;
    if (c[h ? "prefix" : "suffix"] >= 3) break;
    let p = r.filter((m) => m.Prefix === h);
    if (!p.length) {
      if (((h = !h), c[h ? "prefix" : "suffix"] >= 3)) break;
      p = r.filter((m) => m.Prefix === h);
    }
    if (!p.length) break;
    const g = weighted3(p, a),
      y = Yo(g, o);
    if (!y.length) break;
    const u = weighted3(y, a);
    c[g.Prefix ? "prefix" : "suffix"]++;
    const v = g.Range
        ? u.LowValue
        : a.next(u.HighValue + 1, o >= 5 ? Math.ceil((u.LowValue + u.HighValue) / 2) : u.LowValue),
      x = g.Range ? u.HighValue : v;
    e.affixes.push({
      group: g.ID,
      tier: u.tier,
      name: u.Name,
      type: g.Type,
      low: v,
      high: x,
      rate: g.Rate,
      duration: u.Dura,
      revealed: !0,
      text: g.Format.replaceAll("{val}", String(v))
        .replaceAll("{vallow}", String(v))
        .replaceAll("{valhigh}", String(x))
        .replaceAll("{dura}", String(u.Dura))
        .replaceAll("%%", "%"),
    });
    for (let m = r.length - 1; m >= 0; m--) r[m].Type === g.Type && r.splice(m, 1);
  }
  if (
    t.AffixChannelsEnabled === !0 &&
    (s !== void 0 || Object.values(i).some((f) => f.ControlledChannel))
  ) {
    for (const f of [1030, 1031, 1032])
      if (!i[f]?.ControlledChannel) throw new Error(`Missing controlled affix ${f}`);
    Js(e, t, a, i, s ?? Qi(t, i, n));
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
function Zo(e) {
  const t = equippedAffixes(e).filter((a) => a.type === 11);
  ((e.stats.NativeDefencePercentLow = t.reduce((a, i) => a + i.low, 0)),
    (e.stats.NativeDefencePercentHigh = t.reduce((a, i) => a + i.high, 0)));
}
function affixRangeExtra(e, t, a) {
  return equippedAffixes(t)
    .filter((i) => i.type === a)
    .reduce((i, n) => i + affixRoll(e, n) - n.low, 0);
}
function er(e, t, a, i, n, s) {
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
    if (l.type >= 46 && l.type <= 62 && Mt[l.type - 46] === n) {
      i *= 1 + affixRoll(e, l) / 100;
      continue;
    }
    ![10, 41, 42, 81, 85].includes(l.type) ||
      ([81, 85].includes(l.type) && e.rng.next(100) >= l.rate) ||
      (l.type === 10 && !c) ||
      (l.type === 41 && (c || (r?.DreamOriginalId || 0) >= 56)) ||
      (l.type === 42 && (c || (r?.DreamOriginalId || 0) < 56)) ||
      (l.type === 85 && !a.buffs.some((f) => f.type === "Slow" || f.type === "Frozen")) ||
      (l.type === 81 ? (i += affixRoll(e, l)) : (i *= 1 + affixRoll(e, l) / 100));
  }
  return Math.floor(
    (i * (100 + (o.stats.QualitySetDamagePercent || 0) + (o.stats.AffixDamagePercent || 0))) / 100,
  );
}
function zi(e, t, a, i) {
  for (const n of equippedAffixes(t))
    ((n.type === 79 && i.startsWith("AC")) || (n.type === 80 && i.startsWith("MAC"))) &&
      e.rng.next(100) < n.rate &&
      (a = Math.floor(a * (1 - affixRoll(e, n) / 100)));
  return a;
}
function tr(e, t, a, i, n, s) {
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
var Vi = new WeakMap();
function ar(e, t, a) {
  let i = Vi.get(t);
  (!i || e.time < i.at || e.time - i.at >= 600) &&
    ((i = {
      at: e.time,
      used: 0,
    }),
    Vi.set(t, i));
  const n = Math.max(
    0,
    Math.min(Math.floor(a), 8 + Math.floor(t.maxMP * 0.02) - i.used, t.maxMP - t.mp),
  );
  return ((i.used += n), n);
}
function ir(e, t, a, i, n) {
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
  if ((s.job !== "Warrior" && (o = Math.min(12, o)), A(t, a) > 1)) o = Math.trunc(o / 2);
  else {
    const h = V[t.dir];
    (!h || a.x !== t.x + h[0] || a.y !== t.y + h[1]) && (o = 0);
  }
  const r = s.job === "Warrior" && n.startsWith("AC"),
    c = r ? Math.max(0, s.stats.AffixLifeOnHit || 0) : 0,
    l = r ? Math.max(0, s.stats.AffixLifeDrainPercent || 0) : 0,
    f = c + Math.floor((i * Math.max(0, o + l)) / 100);
  s.hp = Math.min(s.maxHP, s.hp + f);
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
  s.mp += ar(e, s, Math.min(i, o + Math.floor((i * r) / 100)));
}
function sr(e, t) {
  for (const a of equippedAffixes(t))
    a.type === 14 && (t.mp = Math.min(t.maxMP, t.mp + affixRoll(e, a)));
}
function or(e, t) {
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
function rr(e, t) {
  let a = 0;
  for (let i = 1; i <= 6 && !(t.next(10 * i) + 1 > e); i++) (a++, (e -= 10));
  return a;
}
function cr(e, t) {
  let a = 0;
  for (; e > 0 && a < 6 && !(e < 20 && t.next(20) + 1 > e); ) (a++, (e = Math.floor(e / 2)));
  return a;
}
var isHell = (e) => e.adaptations.dreamRuntime?.mode === "hell";
function lr(e, t, a, i, n = 0, s = 0, o = 0) {
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
  return lr(
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
  ur = (e, t) => rr(hellAffixParameter2(e), t);
function mr(e, t, a, i, n, s) {
  const o = n.adaptations.dreamRuntime;
  if (!(Number(t.DreamGrade) > 0) || !o?.affixes) return s;
  if (hellAffixParameter2(a) === 0) {
    const c = o.hell?.ordinaryAffixChancePercent || 0;
    return (c > 0 && i.next(1e4) < c * 100 && wt(e, t, i, o.affixes, 1), s);
  }
  if (s < 1) return s;
  const r = cr(hellAffixParameter2(a), i);
  return r ? (wt(e, t, i, o.affixes, r), e.affixes?.length ? s - 1 : s) : s;
}
var hellPetCap = (e) => (e <= 1 ? 3 : e === 2 ? 5 : e === 3 ? 7 : e + 3);
function hr(e) {
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
var Ze = 80,
  sharedStorageGame = (e) => (isHell(e) ? "classic-hell" : "maomao"),
  oe = (e) => isHell(e) || e.adaptations.sharedStorage?.enabled === !0;
function Ki(e, t, a) {
  return !oe(a) ||
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
function Xi(e, t) {
  return (oe(t) && (e.noSharedStorage = !0), e);
}
function J(e, t) {
  const a = structuredClone(e.roles);
  for (const i of a) {
    Ft(i, t);
    const n = ut(i, t);
    (i.sunPotionAt !== void 0 && (i.sunPotionAt = sunPotionRemaining(i, e.time)),
      i.itemCooldowns &&
        (i.itemCooldowns = {
          snow: Math.max(0, Math.min(bt, (i.itemCooldowns.snow || 0) - e.time)),
        }),
      xt(i),
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
    ...(oe(t)
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
function ae(e, t) {
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
  const n = di(Pi(e, t), t);
  if (n.sync) {
    const u = n.sync,
      v = (m) => !!m && typeof m == "object" && !Array.isArray(m),
      x = (m) => m === null || (typeof m == "string" && Number.isFinite(Date.parse(m)));
    if (
      u.protocol !== 2 ||
      u.projectionVersion !== 2 ||
      (u.ownerId !== null &&
        (typeof u.ownerId != "string" || !u.ownerId.length || u.ownerId.length > 200)) ||
      typeof u.deviceId != "string" ||
      u.deviceId.length > 200 ||
      typeof u.deviceName != "string" ||
      u.deviceName.length > 100 ||
      !(u.baseRevision === null || (Number.isSafeInteger(u.baseRevision) && u.baseRevision >= 0)) ||
      !v(u.baseRoles) ||
      !Object.values(u.baseRoles).every((m) => typeof m == "string") ||
      !v(u.tombstones) ||
      !Object.values(u.tombstones).every(
        (m) => v(m) && (m.deletedAt === void 0 || x(m.deletedAt)),
      ) ||
      !Number.isSafeInteger(u.progressSeq) ||
      u.progressSeq < 0 ||
      !x(u.lastProgressAt) ||
      !x(u.checkpointWrittenAt) ||
      !(
        u.serverConfirmedAt === null ||
        (Number.isSafeInteger(u.serverConfirmedAt) && u.serverConfirmedAt >= 0)
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
  const s = (u, v = 0, x = Number.MAX_SAFE_INTEGER) => Number.isSafeInteger(u) && u >= v && u <= x;
  if (
    !s(n.time) ||
    !s(n.nextId) ||
    !s(n.nextOrder) ||
    !s(n.rng.i, 0, 55) ||
    !s(n.rng.j, 0, 55) ||
    !n.rng.seed.every((u) => s(u, 0, 2147483647))
  )
    throw new b(message("storage.clock"));
  const o = new Set(),
    r = new Set(),
    c = new Map(t.items.map((u) => [u.Index, u])),
    l = new Set(t.world.maps.map((u) => u.id)),
    f = (u) =>
      !!u && typeof u == "object" && !Array.isArray(u) && Object.values(u).every(Number.isFinite),
    h = (u) =>
      !!u && typeof u.name == "string" && u.name.length <= 100 && f(u.stats) && s(u.rolls, 1, 5),
    p = (u) => {
      if (
        (u.gemCount !== void 0 && !s(u.gemCount, 0, 65535)) ||
        (u.buybackAt !== void 0 && !s(u.buybackAt)) ||
        !c.has(u.id) ||
        !s(u.uid) ||
        o.has(u.uid) ||
        !s(u.count, 1, 65535) ||
        !s(u.currentDura) ||
        !s(u.maxDura) ||
        u.currentDura > u.maxDura ||
        !f(u.added) ||
        (u.weaponGrowth !== void 0 &&
          (!s(u.weaponGrowth.level, 0, 30) || !s(u.weaponGrowth.xp, 0, 31e5))) ||
        (u.potential !== void 0 && !h(u.potential)) ||
        (u.potentialOptions !== void 0 &&
          (!Array.isArray(u.potentialOptions) ||
            u.potentialOptions.length > 5 ||
            !u.potentialOptions.every(h))) ||
        (u.handmade !== void 0 && typeof u.handmade != "boolean") ||
        (u.locked !== void 0 && typeof u.locked != "boolean") ||
        (u.bound !== void 0 && typeof u.bound != "boolean") ||
        (u.noSharedStorage !== void 0 && typeof u.noSharedStorage != "boolean") ||
        (u.chestReward !== void 0 &&
          (!u.chestReward ||
            !s(u.chestReward.item, 1) ||
            !s(u.chestReward.points, 0, 8) ||
            !t.adaptations.chestItems?.chests[String(u.id)]?.items[String(u.chestReward.item)] ||
            !Object.hasOwn(
              t.adaptations.chestItems.chests[String(u.id)].points,
              String(u.chestReward.points),
            ) ||
            u.count !== 1)) ||
        (u.materialQuality !== void 0 && !s(u.materialQuality, 1, 1e4)) ||
        (u.specialVersion !== void 0 && u.specialVersion !== 1) ||
        (u.affixes !== void 0 &&
          (!Array.isArray(u.affixes) ||
            u.affixes.length > 8 ||
            u.affixes.some(
              (v) =>
                !v ||
                !(s(v.group, 1, 79) || Wi.has(v.group)) ||
                !(s(v.type, 9, 85) || Wi.has(v.type)) ||
                !s(v.low) ||
                !s(v.high, v.low, 1e4) ||
                !s(v.rate, 0, 100) ||
                typeof v.revealed != "boolean" ||
                typeof v.text != "string" ||
                v.text.length > 500,
            )))
      )
        throw new b(message("storage.items"));
      ((u.locked === !1 || (u.locked === !0 && !equipmentLockable(u, c.get(u.id)))) &&
        delete u.locked,
        u.weaponGrowth &&
          u.weaponGrowth.level >= ue.cap &&
          (u.weaponGrowth = {
            level: ue.cap,
            xp: 0,
          }),
        ji(
          u,
          t.items.find((v) => v.Index === u.id),
          t.adaptations.dreamRuntime?.affixes,
        ),
        hi(u, t),
        o.add(u.uid));
    },
    g = (u) => {
      if (
        !s(u.id) ||
        o.has(u.id) ||
        !l.has(u.map) ||
        !s(u.x) ||
        !s(u.y) ||
        !s(u.dir, 0, 7) ||
        !Number.isFinite(u.hp) ||
        !Number.isFinite(u.maxHP) ||
        !f(u.stats) ||
        !Array.isArray(u.buffs) ||
        ![u.actionAt, u.moveAt, u.attackAt].every((v) => s(v))
      )
        throw new b(message("storage.actor"));
      o.add(u.id);
      for (const v of u.buffs)
        if (
          (v.spell !== void 0 && typeof v.spell != "string") ||
          typeof v.type != "string" ||
          !s(v.until) ||
          !s(v.next) ||
          !Number.isFinite(v.value) ||
          !f(v.stats) ||
          !s(v.source)
        )
          throw new b(message("storage.buffs"));
    };
  for (const u of n.roles) {
    if (
      u.cloudId !== void 0 &&
      (typeof u.cloudId != "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(u.cloudId))
    )
      throw new b(message("storage.role"));
    if (u.cloudId) {
      if (r.has(u.cloudId) || Object.hasOwn(n.sync?.tombstones ?? {}, u.cloudId))
        throw new b(message("storage.role"));
      r.add(u.cloudId);
    }
    if (
      (u.sunPotionAt !== void 0 && !s(u.sunPotionAt)) ||
      (u.itemCooldowns !== void 0 &&
        (!u.itemCooldowns ||
          Array.isArray(u.itemCooldowns) ||
          typeof u.itemCooldowns != "object" ||
          Object.entries(u.itemCooldowns).some(
            ([x, m]) => x !== "snow" || !s(m, 0, Math.min(Number.MAX_SAFE_INTEGER, n.time + bt)),
          ))) ||
      (u.mountUid !== void 0 && !s(u.mountUid)) ||
      (u.claimedBlessing !== void 0 && typeof u.claimedBlessing != "boolean") ||
      (u.unlockedWaypoints !== void 0 &&
        (!Array.isArray(u.unlockedWaypoints) ||
          new Set(u.unlockedWaypoints).size !== u.unlockedWaypoints.length ||
          u.unlockedWaypoints.some(
            (x) => !t.adaptations.towns?.waypoints?.some((m) => m.id === x),
          ))) ||
      (u.homeTown !== void 0 &&
        !t.adaptations.towns?.settlements.some((x) => x.id === u.homeTown)) ||
      (u.claimedMount !== void 0 && typeof u.claimedMount != "boolean") ||
      (u.bagLayoutVersion !== void 0 && u.bagLayoutVersion !== 1) ||
      (u.storagePages !== void 0 && !s(u.storagePages, 1, 3)) ||
      (u.bagExpansionRows !== void 0 &&
        !s(u.bagExpansionRows, 0, t.adaptations.bagExpansion.maxRows)) ||
      (u.claimedStarterTalisman !== void 0 && typeof u.claimedStarterTalisman != "boolean") ||
      (u.firstScarecrowReward !== void 0 && typeof u.firstScarecrowReward != "boolean") ||
      !s(u.id) ||
      o.has(u.id) ||
      !l.has(u.map) ||
      !["Warrior", "Wizard", "Taoist"].includes(u.job) ||
      !s(u.level, 1, 65535) ||
      !s(u.gold) ||
      !s(u.xp) ||
      !Number.isFinite(u.hp) ||
      !Number.isFinite(u.mp)
    )
      throw new b(message("storage.role"));
    if (
      u.noviceBooks !== void 0 &&
      (!Array.isArray(u.noviceBooks) ||
        u.noviceBooks.length > 6 ||
        new Set(u.noviceBooks).size !== u.noviceBooks.length ||
        u.noviceBooks.some(
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
    if (u.spiritProgress !== void 0) {
      const x = u.spiritProgress,
        m = t.adaptations.noviceProgression?.spiritGrowth;
      if (
        !x ||
        !m ||
        ![void 0, 1, 2, 3].includes(x.curveVersion) ||
        !s(x.level, 0, m.cap) ||
        !s(
          x.xp,
          0,
          x.level === m.cap
            ? 0
            : (x.curveVersion === 3
                ? spiritNextXP(m, x.level)
                : x.curveVersion === 2
                  ? [2e3, 8e3, 2e4, 6e4, 1e5, 16e4, 21e4][x.level]
                  : (x.level + 1) * m.experienceStep) - 1,
        )
      )
        throw new b(message("storage.role"));
      Ot(u, m);
    }
    if (
      (g(u),
      u.assist &&
        (["autoMagic", "autoShield"].some(
          (x) => u.assist[x] !== void 0 && typeof u.assist[x] != "boolean",
        ) ||
          (u.assist.autoMagicSpell !== void 0 &&
            !["auto", "FireBall", "GreatFireBall", "ThunderBolt", "FlameDisruptor"].includes(
              u.assist.autoMagicSpell,
            ))))
    )
      throw new b(message("storage.assist"));
    if (
      u.assist &&
      (["hpEnabled", "mpEnabled", "flamingSword"].some((x) => typeof u.assist[x] != "boolean") ||
        (u.assist.blazingSword !== void 0 && typeof u.assist.blazingSword != "boolean") ||
        !s(u.assist.hpPercent, 1, 99) ||
        !s(u.assist.mpPercent, 1, 99))
    )
      throw new b(message("storage.assist"));
    if (
      u.trial &&
      (!s(u.trial.stage, 0, 3) ||
        !s(u.trial.honor) ||
        !s(u.trial.title, 0, 15) ||
        !s(u.trial.day) ||
        !s(u.trial.attempts, 0, 3))
    )
      throw new b(message("storage.trialProgress"));
    if (u.lateQuests !== void 0) {
      const x = u.lateQuests,
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
    if (u.challengeRewards !== void 0) {
      const x = u.challengeRewards,
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
      u.trialRun &&
      (!s(u.trialRun.floor, 0, 99) ||
        !s(u.trialRun.deadline) ||
        !s(u.trialRun.pendingHonor) ||
        (u.trialRun.settledFloor !== void 0 && !s(u.trialRun.settledFloor, 0, u.trialRun.floor)) ||
        typeof u.trialRun.cleared != "boolean" ||
        u.map !== t.adaptations.trial?.map)
    )
      throw new b(message("storage.trialState"));
    if (
      u.crafting &&
      (!s(u.crafting.stage, 0, 2) ||
        !u.crafting.skills ||
        Object.entries(u.crafting.skills).some(
          ([x, m]) =>
            !["ore", "wood", "gem", "cloth", "equipment"].includes(x) ||
            !s(m.level, 1, x === "equipment" ? 10 : 9) ||
            !s(m.xp),
        ))
    )
      throw new b(message("storage.crafting"));
    if (
      u.itemHotkeys !== void 0 &&
      (!Array.isArray(u.itemHotkeys) ||
        u.itemHotkeys.length !== 6 ||
        u.itemHotkeys.some((x) => x !== null && (!s(x) || !c.has(x))))
    )
      throw new b(message("storage.hotkeys"));
    if (u.challengeRun) {
      const x = u.challengeRun,
        m = t.adaptations.guideChallenges?.find((M) => M.id === x.id);
      if (
        !m ||
        x.map !== m.map ||
        x.map !== u.map ||
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
    if (t.adaptations.guideChallenges?.some((x) => x.map === u.map) && !u.challengeRun)
      throw new b(message("storage.missingChallenge"));
    if (u.treasureRun) {
      const x = u.treasureRun;
      if (
        x.map !== t.adaptations.adventure.mapIds[n.roles.indexOf(u)] ||
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
    if (t.adaptations.adventure.mapIds.includes(u.map) && u.treasureRun?.map !== u.map)
      throw new b(message("storage.missingTreasure"));
    for (const [x, m] of [
      ["inventory", carriedCapacity(u, t)],
      ["equipment", 15],
      ["storage", 80 * (u.storagePages || 1)],
      ["questInventory", 40],
    ]) {
      const M = u[x];
      if (
        !Array.isArray(M) ||
        (M.length !== m &&
          !(x === "inventory" && u.bagLayoutVersion === void 0 && isLegacyBag(u, t)) &&
          !(x === "equipment" && M.length === 14))
      )
        throw new b(message("storage.inventory"));
      for (const P of M) P && p(P);
    }
    for (const x of u.challengeRewards?.pending || [])
      for (const m of x.items) {
        if (
          m.count !== 1 ||
          ![
            20828,
            {
              Warrior: 20864,
              Wizard: 20865,
              Taoist: 20866,
            }[u.job],
          ].includes(m.id)
        )
          throw new b(message("storage.items"));
        p(m);
      }
    if (
      !Array.isArray(u.skills) ||
      !Array.isArray(u.quests) ||
      !Array.isArray(u.completedQuests) ||
      !Array.isArray(u.buffs)
    )
      throw new b(message("storage.progress"));
    const v = new Set();
    for (const x of u.skills) {
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
    for (const x of u.quests)
      if (
        !t.quests.some((m) => m.Index === x.id) ||
        !x.kills ||
        Object.values(x.kills).some((m) => !s(m))
      )
        throw new b(message("storage.quests"));
    for (const [x, m] of Object.entries(u.buyback || {})) {
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
  for (const [u, v] of Object.entries(n.maps)) {
    if (v.omaNorthwestPlacement !== void 0 && (Number(u) !== 1001 || v.omaNorthwestPlacement !== 1))
      throw new b(message("storage.map"));
    if (!l.has(Number(u)) || !Array.isArray(v.actors) || !v.respawns)
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
      if ((g(x), x.map !== Number(u) || !["monster", "npc", "spell", "item"].includes(x.kind)))
        throw new b(message("storage.actorKind"));
      if (x.kind === "monster" && !t.monsters.some((m) => m.Index === x.definition))
        throw new b(message("storage.monster"));
      x.item && p(x.item);
    }
  }
  if (oe(t)) {
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
      (n.sharedStorage === void 0 && (n.sharedStorage = Array(Ze).fill(null)),
      !Array.isArray(n.sharedStorage) || n.sharedStorage.length !== Ze)
    )
      throw new b(message("storage.invalidFormat"));
    for (const u of n.sharedStorage)
      if (u !== null && (p(u), !Ki(u, c.get(u.id), t))) throw new b(message("storage.sharedOnly"));
    n.sharedStorageVersion = 1;
  } else if (
    n.sharedStorage !== void 0 ||
    n.sharedStorageVersion !== void 0 ||
    n.sharedStorageGame !== void 0
  )
    throw new b(message("storage.invalidFormat"));
  if ([...o].some((u) => u >= n.nextId)) throw new b(message("storage.objectId"));
  const y = new Set();
  for (const u of n.events) {
    if (
      !["hit", "deathHit", "heal", "expire", "buff", "magic", "vamp", "kill"].includes(u.kind) ||
      !s(u.at) ||
      !s(u.order) ||
      u.order >= n.nextOrder ||
      y.has(u.order) ||
      !s(u.source) ||
      !s(u.target) ||
      !l.has(u.map) ||
      !Number.isFinite(u.damage) ||
      (u.monsterBasicAttack !== void 0 && typeof u.monsterBasicAttack != "boolean") ||
      (u.trainSpell !== void 0 && !t.skills.some((v) => v.Spell === u.trainSpell))
    )
      throw new b(message("storage.events"));
    if (
      u.effect &&
      (!s(u.effect.duration) || !f(u.effect.stats) || !Number.isFinite(u.effect.value))
    )
      throw new b(message("storage.pendingState"));
    y.add(u.order);
  }
  return structuredClone(n);
}


function br(e, t, a, i, n = {}) {
  if (oe(i)) throw Error("mergeSelection");
  const s = J(ae(structuredClone(e), i), i),
    o = J(ae(structuredClone(t), i), i);
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
  const f = (g) => g.trim().normalize("NFKC").toLocaleLowerCase();
  if (new Set(r.map((g) => f(g.name))).size !== r.length) throw Error("mergeDuplicate");
  for (const g of r) {
    const y = g,
      u = s.roles.filter((v) => f(v.name) === f(y.name));
    if (u.length) {
      if (u.length !== 1 || u[0].job !== y.job || c[String(y.id)] !== u[0].id)
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
      u = c[String(y.id)],
      v = s.roles.findIndex((x) => x.id === u);
    ((y.id = v >= 0 ? u : p()), delete y.master, delete y.item);
    for (const x of [
      ...y.inventory,
      ...y.equipment,
      ...y.storage,
      ...y.questInventory,
      ...Object.values(y.buyback || {}).flat(),
      ...(y.challengeRewards?.pending || []).flatMap((m) => m.items),
    ])
      x && (x.uid = p());
    v >= 0 ? (s.roles[v] = y) : s.roles.push(y);
  }
  return ((s.nextId = h), ae(s, i));
}
var Ji = "maomao",
  _i = 15e5;
function kt(e, t, a, i = !1) {
  const n = J(ae(e, t), t);
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
    gameId: isHell(t) ? "classic-hell" : Ji,
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
  if (s.length > _i) throw new b(message("core.cloud-save.encodeCloudSave.ef250747c5"));
  return s;
}
function gr(e) {
  const t = structuredClone(e);
  let a = 1e4;
  for (const i of t.roles) {
    ((i.id = a++), delete i.master, delete i.item);
    for (const n of [
      ...i.inventory,
      ...i.equipment,
      ...i.storage,
      ...i.questInventory,
      ...Object.values(i.buyback || {}).flat(),
      ...(i.challengeRewards?.pending || []).flatMap((s) => s.items),
    ])
      n && (n.uid = a++);
  }
  for (const i of t.sharedStorage || []) i && (i.uid = a++);
  return ((t.nextId = a), t);
}
function Ae(e, t, a = {}) {
  if (typeof e != "string" || !e.length || e.length > _i)
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
    i.gameId !== (isHell(t) ? "classic-hell" : Ji) ||
    !i.snapshot ||
    i.snapshot.storageMode !== "character-only"
  )
    throw new b(message("core.cloud-save.decodeCloudSave.fe073fd64f"));
  const n = J(ae(a.remapIds ? gr(i.snapshot) : i.snapshot, t), t);
  if (
    !n.roles.length &&
    !n.sharedStorage?.some(Boolean) &&
    !Object.keys(n.sync?.tombstones || {}).length &&
    !a.allowEmpty
  )
    throw new b(message("core.cloud-save.decodeCloudSave.e3fd97ef99"));
  return n;
}
var Yi = 2,
  yr = "~deleted",
  xr = new Set([
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
    "attackModes",
    "bagLayoutVersion",
  ]),
  vr = new Set(["inventory", "storage", "questInventory"]),
  he = (e) =>
    Array.isArray(e)
      ? e.map(he)
      : e && typeof e == "object"
        ? Object.fromEntries(
            Object.keys(e)
              .sort()
              .filter((t) => t !== "uid" && e[t] !== void 0)
              .map((t) => [t, he(e[t])]),
          )
        : e,
  stringify = (e) => JSON.stringify(he(e));
function itemProgress(e) {
  if (!e) return null;
  const { uid: t, buybackAt: a, specialVersion: i, ...n } = e;
  return he(n);
}
function oa(e) {
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
function Mr(e) {
  const t = {};
  for (const a of Object.keys(e).sort())
    if (!(xr.has(a) || e[a] === void 0))
      if (vr.has(a)) t[a] = oa(e[a]);
      else if (a === "equipment") t[a] = (e[a] || []).map(itemProgress);
      else if (a === "buyback")
        t[a] = Object.fromEntries(
          Object.keys(e[a] || {})
            .sort()
            .filter((i) => e[a][i]?.length)
            .map((i) => [i, oa(e[a][i])]),
        );
      else if (a === "skills")
        t[a] = (e[a] || [])
          .filter((i) => !i.temporary)
          .map(({ CastTime: i, Key: n, ...s }) => he(s))
          .sort((i, n) => String(i.Spell).localeCompare(String(n.Spell), "en"));
      else if (["quests", "completedQuests", "unlockedWaypoints", "noviceBooks"].includes(a))
        t[a] = (e[a] || []).map(he).sort((i, n) => stringify(i).localeCompare(stringify(n), "en"));
      else if (a === "challengeRewards") {
        const { sequence: i, ...n } = e[a] || {};
        t[a] = he(n);
      } else t[a] = he(e[a]);
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
    projectionVersion: Yi,
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
        .map((a) => [a, yr]),
      ...(e || []).map((a) => [cloudRoleKey(a), Mr(a)]),
    ].sort(([a], [i]) => a.localeCompare(i, "en")),
  );
}
function nn(e) {
  return (typeof e == "string" && (e = JSON.parse(e)), e?.snapshot || e);
}
var Sr = "00000000-0000-4000-8000-000000000080",
  kr = Sr,
  sharedSnapshot = (e) => {
    const t = nn(e);
    return t?.gameId === "classic-hell" || t?.sharedStorageVersion === 1;
  },
  sharedGame = (e) =>
    e.sharedStorageGame ?? (e.gameId === "classic-hell" ? "classic-hell" : void 0);
function wholeProjection(e, t = cloudBaseline(e?.roles || [], e?.sync?.tombstones)) {
  return stringify({
    roles: t,
    sharedStorage: oa(e.sharedStorage || []),
    ...(sharedGame(e) && sharedGame(e) !== "classic-hell"
      ? {
          game: sharedGame(e),
        }
      : {}),
  });
}
function semanticSnapshot(e) {
  const t = nn(e);
  return sharedSnapshot(t)
    ? {
        [kr]: wholeProjection(t),
      }
    : cloudBaseline(t?.roles || [], t?.sync?.tombstones);
}
function progressFingerprint(e) {
  return stringify({
    projectionVersion: Yi,
    roles: semanticSnapshot(e),
  });
}
var At = globalThis,
  S,
  G,
  Ce = !0,
  et = !1,
  da = !1,
  We = performance.now(),
  ge = 0,
  tt = 0,
  Ct = Promise.resolve(),
  at = new Map(),
  ye = new Map(),
  fa = 0;
async function sn(e) {
  const t = ye.get(e);
  if (t) return (ye.delete(e), ye.set(e, t), t.value);
  const a = await fetch(e);
  if (!a.ok) throw new b(message("storage.mapLoad"));
  const i = await a.text(),
    n = JSON.parse(i),
    s = i.length * 2;
  if (s <= 8 * 1024 * 1024)
    for (
      ye.set(e, {
        value: n,
        bytes: s,
      }),
        fa += s;
      ye.size > 16 || fa > 8 * 1024 * 1024;

    ) {
      const o = ye.keys().next().value;
      ((fa -= ye.get(o).bytes), ye.delete(o));
    }
  return n;
}
var X = null,
  xe = {
    deviceId: crypto.randomUUID(),
    deviceName: "",
  },
  semantic = (e) => progressFingerprint(e);
function ee(e, t = X) {
  const a = ensureCharacterIds(J(e, S.rules), t);
  if (
    ((a.sync = a.sync
      ? structuredClone(a.sync)
      : {
          ...freshSync(t, xe),
          lastProgressAt: a.lastSaved,
        }),
    a.sync.ownerId !== t)
  )
    throw Error("accountChanged");
  return (a.sync.deviceId === xe.deviceId && (a.sync.deviceName = xe.deviceName), a);
}
function le(e, t = !0) {
  if ((t || e?.ownerId !== void 0) && e?.ownerId !== X) throw Error("accountChanged");
}
function Dr(e) {
  if (e === null) return null;
  if (typeof e != "string" || !e.length || e.length > 200 || /[\x00-\x1f]/.test(e))
    throw Error("accountChanged");
  return e;
}
function it(e) {
  ((S = e), (Ce = !0), at.clear(), (tt = 0), (We = performance.now()), (ge = 0));
}
function nt(e, t) {
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


async function rn() {
  if (X === null) throw Error("accountChanged");
  if (await G.guestBinding()) throw Error("guestBound");
  const e = await G.readOwner(null);
  if (!e?.roles.length && !e?.sharedStorage?.some(Boolean)) throw Error("missing");
  const t = J(ae(e, S.rules), S.rules);
  for (const a of t.roles)
    (!a.cloudId || a.cloudId === legacyCharacterId(null, a)) &&
      (a.cloudId = legacyCharacterId(X, a));
  return (
    (t.sync = {
      ...freshSync(X, xe),
      progressSeq: e.sync?.progressSeq ?? 0,
      lastProgressAt: e.sync?.lastProgressAt ?? e.lastSaved,
      checkpointWrittenAt: new Date().toISOString(),
    }),
    t
  );
}
async function De(e) {
  if (S.geometry.has(e)) return;
  let t = at.get(e);
  t ||
    ((t = (async () => {
      S.loadMap(await sn(`data/maps/${e}/info.json`));
    })()),
    at.set(e, t));
  try {
    await t;
  } catch (a) {
    throw (at.delete(e), a);
  }
}
async function ie() {
  const e = new Date().toISOString(),
    t = ee(S.save(!1)),
    a = await G.read();
  if (a)
    for (const n of a.roles)
      n.cloudId &&
        !t.roles.some((s) => s.cloudId === n.cloudId) &&
        (t.sync.tombstones[n.cloudId] ??= {
          deletedAt: e,
        });
  const i = a
    ? semantic(t) !== semantic(ee(a))
    : !!t.roles.length ||
      !!t.sharedStorage?.some(Boolean) ||
      !!Object.keys(t.sync.tombstones).length;
  (i &&
    (t.sync.progressSeq++,
    (t.sync.lastProgressAt = e),
    Object.assign(t.sync, xe),
    (t.lastSaved = e)),
    (t.sync.checkpointWrittenAt = e),
    await G.write(t, !i),
    (S.sync = structuredClone(t.sync)),
    (S.lastSaved = t.lastSaved));
  for (let n = 0; n < S.roles.length; n++) S.roles[n].cloudId = t.roles[n].cloudId;
  tt = S.time;
}
async function cn() {
  const e = await fetch("data/rules.json");
  if (!e.ok) throw new b(message("storage.rulesLoad"));
  const t = await e.json();
  ((S = new Fe(t, crypto.getRandomValues(new Int32Array(1))[0])),
    (G = new fn(t.adaptations.dreamRuntime?.hell?.gameId)),
    await G.open());
  const a = await G.read();
  if (a) {
    (t.adaptations.dreamRuntime &&
      !a.dreamRuntimeVersion &&
      (await G.backupOnce("before-dream-runtime-v1", a)),
      t.adaptations.mainline &&
        (Number(a.worldVersion) || 1) < t.adaptations.mainline.worldVersion &&
        (await G.backupOnce(`before-world-v${t.adaptations.mainline.worldVersion}`, a)));
    try {
      S.restore(J(ae(a, t), t));
    } catch (n) {
      const s = await G.read("previous");
      if (!s) throw n;
      const o = J(ae(s, t), t);
      (S.restore(o),
        await G.write(o, !0),
        S.say(message("storage.recovered")),
        At.postMessage({
          notification: !0,
          error: message("storage.recovered"),
        }));
    }
  }
  const i = ee(S.save(!1));
  return ((S.sync = i.sync), (S.roles = i.roles), S.snapshot());
}
async function Ir(e, t, a) {
  if (e === "init") return cn();
  if (e === "world") return S.rules.world;
  if (e === "cloud/context") {
    const i = Dr(t?.ownerId);
    if (S.active) throw Error("pendingSelection");
    if (t?.deviceId !== void 0) {
      if (
        typeof t.deviceId != "string" ||
        t.deviceId.length > 200 ||
        typeof t.deviceName != "string" ||
        t.deviceName.length > 100
      )
        throw Error("invalid");
      xe = {
        deviceId: t.deviceId,
        deviceName: t.deviceName,
      };
    }
    if (i === X) return ((S.sync = ee(S.save(!1)).sync), S.snapshot());
    await ie();
    const n = await G.readOwner(i),
      s = new Fe(S.rules, 1);
    n ? s.restore(ee(ae(n, S.rules), i)) : (s.sync = freshSync(i, xe));
    const o = ee(s.save(!1), i);
    return (
      (o.sync.checkpointWrittenAt = new Date().toISOString()),
      s.restore(o),
      await G.writeOwner(o, i),
      G.selectOwner(i),
      (X = i),
      it(s),
      S.snapshot()
    );
  }
  if (e === "cloud/guest") {
    le(t);
    const i = await rn();
    return {
      roles: i.roles,
      sync: i.sync,
      saveJson: kt(i, S.rules, String(t?.build || ""), !0),
    };
  }
  if (e === "cloud/bind") {
    if ((le(t), X === null)) throw Error("accountChanged");
    if (S.active) throw Error("pendingSelection");
    const i = await rn(),
      n = ee(S.save(!1));
    let s = i;
    if (t?.saveJson) {
      if (
        (t.expectedProgress !== void 0 && progressFingerprint(n) !== t.expectedProgress) ||
        typeof t.expectedRoles != "string" ||
        t.expectedRoles !== JSON.stringify(n.roles)
      )
        throw Error("conflict");
      (nt(t, n.sync),
        (s = ee(
          Ae(t.saveJson, S.rules, {
            allowEmpty: !0,
            remapIds: !0,
          }),
        )),
        (s.sync = nt(t, s.sync)));
    } else if (
      S.roles.length ||
      S.sharedStorage.some(Boolean) ||
      Object.keys(S.sync?.tombstones || {}).length
    )
      throw Error("conflict");
    const o = t?.remoteSaveJson
      ? Ae(t.remoteSaveJson, S.rules, {
          allowEmpty: !0,
        })
      : i;
    if (o.sync && o.sync.ownerId !== X) throw Error("accountChanged");
    rt(s.roles, S.roles);
    const r = new Fe(S.rules, 1);
    return (
      r.restore(s),
      Object.assign(s, J(r.save(!1), S.rules)),
      await G.bindGuest(X, s, n, o),
      it(r),
      S.snapshot()
    );
  }
  if (e === "foreground") return (t?.active || (await ie()), S.snapshot(a));
  if (e === "pause")
    return (
      (Ce = !!t?.paused),
      (We = performance.now()),
      (ge = 0),
      Ce && (await ie()),
      S.snapshot(a)
    );
  if (e.startsWith("map/")) {
    const [i, n = ""] = e.split("?"),
      s = i.split("/"),
      o = Number(s[1]);
    if (!S.rules.world.maps.some((l) => l.id === o)) throw new b(message("storage.mapRange"));
    const r = new URLSearchParams(n),
      c = s[2] === "chunk" ? `${Number(r.get("x"))}-${Number(r.get("y"))}.json` : "info.json";
    return sn(`data/maps/${o}/${c}`);
  }
  if (e === "cloud/local") {
    const i = ee(S.save(!1)),
      n = await G.readOwner(null),
      s = await G.guestBinding();
    return {
      stage: S.active ? "Game" : "Select",
      roles: i.roles,
      sync: i.sync,
      guestAvailable: X !== null && !s && !!(n?.roles.length || n?.sharedStorage?.some(Boolean)),
      saveJson: kt(i, S.rules, String(t?.build || ""), !0),
    };
  }
  if (e === "cloud/commit") {
    (le(t), await ie());
    const i = ee(S.save(!1));
    return (
      (i.sync = nt(t, i.sync)),
      (i.sync.checkpointWrittenAt = new Date().toISOString()),
      await G.write(i, !0),
      (S.sync = structuredClone(i.sync)),
      {
        sync: structuredClone(i.sync),
      }
    );
  }
  if (e === "cloud/apply") {
    if ((le(t), S.active)) throw Error("pendingSelection");
    const i = ee(S.save(!1));
    if (
      typeof t?.expectedRoles != "string" ||
      JSON.stringify(i.roles) !== t.expectedRoles ||
      (t?.expectedProgress !== void 0 && progressFingerprint(i) !== t.expectedProgress)
    )
      throw Error("conflict");
    const n = ee(
      Ae(t?.saveJson, S.rules, {
        allowEmpty: !0,
        remapIds: !0,
      }),
    );
    (nt(t, i.sync),
      (n.sync = nt(t, n.sync)),
      (n.sync.checkpointWrittenAt = new Date().toISOString()),
      rt(n.roles, S.roles));
    const s = new Fe(S.rules, 1);
    (s.restore(n), Object.assign(n, J(s.save(!1), S.rules)));
    const o = Ae(t?.remoteSaveJson ?? t?.saveJson, S.rules, {
      allowEmpty: !0,
      remapIds: !t?.remoteSaveJson,
    });
    if (o.sync && o.sync.ownerId !== X) throw Error("accountChanged");
    return (await G.merge(n, o, i, !!t?.manual), it(s), S.snapshot());
  }
  if (
    t?.autoSync &&
    (e === "cloud/merge" || e === "cloud/restore") &&
    (S.active || JSON.stringify(J(S.save(!1), S.rules).roles) !== t.expectedRoles)
  )
    throw Error("conflict");
  if (e === "cloud/prepare")
    return (
      le(t, !1),
      await ie(),
      {
        saveJson: kt(S.save(!1), S.rules, String(t?.build || ""), !0),
        sync: structuredClone(S.sync),
      }
    );
  if (e === "cloud/preview") {
    const i = Ae(t?.saveJson, S.rules, {
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
    if ((le(t, !1), S.active)) throw Error("pendingSelection");
    const i = Ae(t?.saveJson, S.rules);
    if (i.sync && i.sync.ownerId !== X) throw Error("accountChanged");
    const n = br(S.save(!1), i, t?.roleIds, S.rules, t?.replacements);
    rt(n.roles, S.roles);
    const s = new Fe(S.rules, 1);
    return (
      s.restore(n),
      Object.assign(n, J(s.save(!1), S.rules)),
      (s.active = 0),
      (n.sync = structuredClone(S.sync)),
      await G.merge(n, i),
      (s.sync = n.sync),
      it(s),
      S.snapshot()
    );
  }
  if (e === "cloud/export-backup") {
    le(t, !1);
    const i = t?.kind === "remote" ? "cloud-merge-remote" : "before-cloud-merge",
      n = await G.read(i);
    if (!n) throw Error("noBackup");
    return {
      saveJson: kt(ae(n, S.rules), S.rules, String(t?.build || ""), !0),
    };
  }
  if (e === "cloud/backup")
    return (
      le(t, !1),
      {
        exists: !!(await G.read("before-cloud-read")),
      }
    );
  if (e === "cloud/restore" || e === "cloud/rollback") {
    if ((le(t, !1), S.active)) throw Error("pendingSelection");
    const i = ensureCharacterIds(
      e === "cloud/restore"
        ? Ae(t?.saveJson, S.rules, {
            allowEmpty: !0,
          })
        : J(ae(await G.read("before-cloud-read"), S.rules), S.rules),
      X,
    );
    if (i.sync && i.sync.ownerId !== X) throw Error("accountChanged");
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
      ...structuredClone(S.sync ?? freshSync(X, xe)),
      tombstones: n,
      lastProgressAt: i.sync?.lastProgressAt ?? i.lastSaved,
      checkpointWrittenAt: new Date().toISOString(),
    }),
      rt(i.roles, S.roles));
    const s = new Fe(S.rules, 1);
    return (
      s.restore(i),
      Object.assign(i, J(s.save(!1), S.rules)),
      (s.active = 0),
      await G.write(i, !1, e === "cloud/restore" ? "before-cloud-read" : void 0),
      (s.sync = i.sync),
      it(s),
      S.snapshot()
    );
  }
  if (e === "entry" || e === "open") ((S.active = 0), (Ce = !1));
  else if (e === "create")
    ((S.create(String(t?.name || ""), t?.job, t?.gender).cloudId = crypto.randomUUID()),
      await ie());
  else if (e === "delete") {
    if (S.active) throw Error("pendingSelection");
    const i = S.roles.find((s) => (t?.cloudId ? s.cloudId === t.cloudId : s.id === t?.id));
    if (!i) throw Error("missing");
    const n = S.roles;
    S.roles = S.roles.filter((s) => s !== i);
    try {
      await ie();
    } catch (s) {
      throw ((S.roles = n), s);
    }
  } else if (e === "start") {
    const i = S.roles.find((s) => s.id === t?.id);
    if (!i) throw new b(message("storage.roleMissing"));
    const n = i.id;
    (S.restore(J(S.save(!1), S.rules)),
      await De(S.rules.world.maps.find((s) => s.start).id),
      S.start(n),
      (tt = S.time),
      S.bringPets(S.me),
      (Ce = !1));
  } else if (e === "save") await ie();
  else if (e.startsWith("command/")) {
    if (!et) return S.snapshot(a);
    if (
      t?.Shared === !0 &&
      ["command/StoreItem", "command/TakeBackItem", "command/SortStorage"].includes(e)
    ) {
      const i = S.me;
      if (!i) throw Error("invalid");
      const n = structuredClone({
        inventory: i.inventory,
        sharedStorage: S.sharedStorage,
        nextId: S.nextId,
      });
      try {
        (S.command(e.slice(8), t), await ie());
      } catch (s) {
        throw (
          (i.inventory = n.inventory),
          (S.sharedStorage = n.sharedStorage),
          (S.nextId = n.nextId),
          s
        );
      }
      return S.snapshot(a);
    }
    if (!et) return S.snapshot(a);
    if (["command/UseItem", "command/UseItemHotkey"].includes(e) && S.me) {
      const i =
        e === "command/UseItemHotkey"
          ? S.me.inventory.find((n) => n?.id === S.me.itemHotkeys?.[Number(t?.Key)])
          : S.me.inventory.find((n) => n?.uid === Number(t?.UniqueID));
      i && S.defs.get(i.id)?.Type === "TreasureMap" && (await De(treasureMapId(S, S.me)));
    }
    if (e === "command/CallNPC" && Number(t?.ObjectID) === 9420) {
      const i = String(t?.Key || "")
          .replace(/[\[\]]/g, "")
          .toLowerCase(),
        n = S.rules.adaptations.guideChallenges?.find((s) => "@challenge-" + s.id === i);
      n && (await De(n.map));
    }
    if (e === "command/CallNPC") {
      const i = String(t?.Key || "")
          .replace(/[\[\]]/g, "")
          .toLowerCase(),
        n = Number(t?.ObjectID),
        s = S.rules.adaptations.lateContent;
      if (s?.fireAltar && n === s.fireAltar.npcId && i === "@late-altar-enter") {
        const o = S.rules.adaptations.guideChallenges?.find((r) => r.id === s.fireAltar.challenge);
        o && (await De(o.map));
      }
      if (s?.secretTicket && n === s.secretTicket.npcId) {
        const o = s.secretTicket.shortcuts.find((r) => "@late-secret-" + r.map === i);
        o && (await De(o.map));
      }
    }
    (e === "command/CallNPC" &&
      Number(t?.ObjectID) === S.rules.adaptations.trial?.entranceNpc &&
      String(t?.Key).includes("@trialenter") &&
      (await De(S.rules.adaptations.trial.map)),
      S.command(e.slice(8), t),
      S.me && (await De(S.me.map), S.initializeMap(S.me.map), S.bringPets(S.me), sa(S, S.me), ln()),
      [
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
      ].includes(e.slice(8)) && (await ie()));
  } else if (e !== "state") throw new b(message("storage.unsupported"));
  return S.snapshot(a);
}


const Hr = (e) => {
  const { id: t, route: a, data: i, after: n = -1 } = e.data;
  (a === "foreground" && ((et = !!i?.active), (We = performance.now()), (ge = 0), dn()),
    (Ct = Ct.then(async () => {
      da = !0;
      try {
        At.postMessage({
          id: t,
          result: await Ir(a, i, n),
        });
      } catch (s) {
        At.postMessage({
          id: t,
          error: Ht(s),
        });
      } finally {
        ((da = !1), dn());
      }
    })));
};
var st;
function ln() {
  const e = S.me?.map;
  for (const a of Object.keys(S.maps)) Number(a) !== e && delete S.maps[Number(a)];
  const t = S.rules.world.maps.find((a) => a.start).id;
  for (const a of S.geometry.keys()) a !== e && a !== t && (S.geometry.delete(a), at.delete(a));
  S.events = S.events.filter((a) => a.map === e);
}
function dn() {
  const e = !!S?.me && !Ce && et;
  (!e && st !== void 0 && (clearInterval(st), (st = void 0), (ge = 0)),
    e && st === void 0 && ((We = performance.now()), (ge = 0), (st = setInterval(Nr, 20))),
    S && !S.me && ln());
}
function Nr() {
  const e = performance.now(),
    t = e - We;
  if (((We = e), !S || Ce || !et || da || !S.me)) return;
  ge += Math.min(t, 200);
  let a = 0;
  for (; ge >= 20 && a++ < 10; ) (S.tick(20), (ge -= 20));
  S.time - tt >= 3e4 &&
    ((tt = S.time),
    (Ct = Ct.then(ie).catch((i) =>
      At.postMessage({
        error: String(i),
        notification: !0,
      }),
    )));
}
async function Or() {
  await cn();
}
export { Hr as handleCoreMessage, Or as initializeCore };

