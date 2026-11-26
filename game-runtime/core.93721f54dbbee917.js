import { EncryptedSaveStore as Oi } from "/Game/site-assets/encrypted-save.js";
function dreamAttackDelay(e) {
  return Math.max(600, 1100 - 50 * (e.AttackSpeed || 0));
}
function dreamCastDelay(e) {
  return Math.max(600, 1500 - 90 * (e.CastSpeed || 0));
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
function Xt(e) {
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
function Pe(e, t, a = {}) {
  let i = e.DreamSkill
    ? e.DreamSkill.costBase + Math.max(0, t - 1) * e.DreamSkill.costStep
    : e.BaseCost + t * e.LevelCost;
  return (
    ["Teleport", "Blink"].includes(e.Spell) &&
      (i += Math.trunc((i * (a.TeleportManaPenaltyPercent || 0)) / 100)),
    Math.max(0, Math.trunc(i * (1 + (a.ManaPenaltyPercent || 0) / 100)))
  );
}
function Jt(e, t, a) {
  return !t.DreamSkill || e.temporary
    ? e.Level
    : e.Level +
        Math.max(0, Math.trunc(a["SkillLevel:" + t.Spell] || 0)) +
        Math.max(0, Math.trunc(a["ElementLevel:" + t.DreamSkill.element] || 0));
}
function _t(e, t, a, i = !0) {
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
function Ee(e, t) {
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
var wt = class {
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
  N = Math.fround;
function $i(e, t, a) {
  if (!e.Gain) return e.Base;
  let i;
  return (
    e.FormulaType === "Health"
      ? (i = N(e.Base + N(N(N(a / e.Gain) + e.GainRate) + (t === "Warrior" ? N(a / 20) : 0)) * a))
      : e.FormulaType === "Mana"
        ? (i = N(
            t === "Wizard"
              ? N(e.Base + N(N(N(N(a / e.Gain) + 2) * N(2.2)) * a)) + N(a * e.GainRate)
              : t === "Taoist"
                ? N(e.Base + N(N(N(a / e.Gain) * N(2.2)) * a)) + N(a * e.GainRate)
                : N(e.Base + N(a * e.Gain)) + N(a * e.GainRate),
          ))
        : (i =
            e.FormulaType === "Weight"
              ? N(e.Base + N(N(a / e.Gain) * a))
              : N(e.Base + N(a / e.Gain))),
    Math.trunc(Math.min(e.Max > 0 ? e.Max : 2147483647, i))
  );
}
var _e = (e, t, a = !1) =>
  a
    ? dreamAttackDelay(t)
    : Math.max(550, 1400 - ((t.AttackSpeed || 0) * 60 + Math.min(370, e * 14)));
function G(e, t, a) {
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
function pe(e) {
  const t = Math.floor(e);
  return e - t === 0.5 ? t + (t % 2) : Math.round(e);
}
function magicPower(e, t, a) {
  if (e.DreamSkill) return _t(e, t);
  const i = e.MPowerBonus > 0 ? a.next(e.MPowerBase + e.MPowerBonus, e.MPowerBase) : e.MPowerBase,
    n = e.PowerBonus > 0 ? a.next(e.PowerBase + e.PowerBonus, e.PowerBase) : e.PowerBase;
  return pe(N(N(N(i / 4) * (t + 1)) + n));
}
var magicDamage = (e, t, a, i) =>
  e.DreamSkill
    ? Math.trunc(Math.fround(Math.fround(a + _t(e, t, i)) * Math.fround(Ee(e, t))))
    : Math.trunc(N((a + magicPower(e, t, i)) * N(e.MultiplierBase + N(t * e.MultiplierBonus))));
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
var Le = new Set([
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
  Gi = {
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
  return e.DreamType === 6 ? [14] : Gi[e.Type];
}
function price(e, t) {
  let a = t.Price;
  if (t.Durability > 0) {
    a = Math.trunc(N(e.maxDura * N(N(t.Price / 2) / t.Durability)));
    const i = e.maxDura ? N(e.currentDura / e.maxDura) : 0;
    a = Math.floor(N(N(N(a / 2) + N(N(a / 2) * i)) + N(t.Price / 2)));
  }
  return Math.trunc(N(a * N(N(Object.keys(e.added).length * N(0.1)) + 1))) * e.count;
}
function Qi(e, t, a, i) {
  const n = t.RandomStats || {},
    s = (l, f) => {
      let h = 0;
      for (let m = 0; m < l; m++) a.next(f) === 0 && h++;
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
    Le.has(t.Type) &&
    i.profiles.includes(t.RandomStatsId) &&
    (r ||
      (!i.qualityProfiles && t.RequiredType === "Level" && t.RequiredAmount <= i.maxRequiredLevel))
  ) {
    if (a.next(100) >= c.exceptionalPercent) return;
    const l = new Set(["MaxAC", "MaxMAC", "MaxDC", "MaxMC", "MaxSC"]),
      f = Object.entries(o)
        .filter(([k]) => n[k + "Chance"] > 0)
        .map(([, k]) => ({
          key: k,
          weight: ["MaxDC", "MaxMC", "MaxSC"].includes(k) ? 3 : 1,
          min: 1,
          max: l.has(k) ? c.totalPointWeights.length : 1,
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
      m = a.next(c.totalPointWeights.reduce((k, S) => k + S, 0));
    for (; h < c.totalPointWeights.length && m >= c.totalPointWeights[h - 1]; )
      m -= c.totalPointWeights[h++ - 1];
    const g = a.next(100);
    let y = Math.min(
      h,
      g < i.thirdAffixPercent ? 3 : g < i.thirdAffixPercent + i.secondAffixPercent ? 2 : 1,
    );
    const u = [],
      w = (k, S) => {
        if (S.length === y) {
          S.reduce((D, C) => D + C.min, 0) <= h &&
            S.reduce((D, C) => D + C.max, 0) >= h &&
            u.push({
              stats: S,
              weight: S.reduce((D, C) => D * C.weight, 1),
            });
          return;
        }
        for (let D = k; D < f.length; D++) w(D + 1, [...S, f[D]]);
      };
    for (; y > 0 && !u.length; ) (w(0, []), u.length || y--);
    if (!u.length) return;
    m = a.next(u.reduce((k, S) => k + S.weight, 0));
    let x = 0;
    for (; m >= u[x].weight; ) m -= u[x++].weight;
    const p = u[x].stats;
    let v = h;
    for (let k = 0; k < p.length; k++) {
      const S = p[k],
        D = p.slice(k + 1),
        C = Math.max(S.min, v - D.reduce((A, H) => A + H.max, 0)),
        O = Math.min(S.max, v - D.reduce((A, H) => A + H.min, 0)),
        E = C === O ? C : a.next(O + 1, C);
      ((e.added[S.key] = E), (v -= E));
    }
    return;
  }
  for (const [l, f] of Object.entries(o))
    n[l + "Chance"] > 0 &&
      a.next(n[l + "Chance"]) === 0 &&
      (e.added[f] = s(n[l + "MaxStat"] - 1, n[l + "StatChance"]) + 1);
}
function Zt(e, t) {
  if (!t.adaptations.dreamRuntime || e.Type !== "Book") return !0;
  const a = t.skills.find((n) => n.Spell === e.Spell);
  if (!a?.DreamSkill) return !1;
  const i = a.DreamRaw?.Job;
  return i === void 0 || e.RequiredClass === ["Warrior", "Wizard", "Taoist"][i];
}
function ea(e, t, a, i) {
  const n = e.item === null ? void 0 : t.get(e.item);
  if (n && !Zt(n, a)) return null;
  const s =
      e.dropMultiplierMode === "fixed"
        ? 1
        : e.gold > 0
          ? a.multipliers.goldDropChanceMultiplier
          : n && Le.has(n.Type) && !e.quest
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
      const f = ea(l, t, a, i);
      if (f && ((r += f.gold), c.push(...f.items), e.group.first)) break;
    }
    e.group.random && c.length && (c = [c[i.next(c.length)]]);
  }
  return {
    gold: r,
    items: c,
  };
}


var ta = 80,
  zi = [0, 5e5, 1e6];
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
function Vi(e, t, a) {
  const i = equipmentCapacity(e, t),
    n = e.inventory;
  if (
    e.bagLayoutVersion === 1 &&
    n.length === 2 * i &&
    n.every((r, c) => !r || (!!a.get(r.id) && bagSlotAccepts(e, t, a.get(r.id), c)))
  )
    return;
  const s = Array(2 * i).fill(null),
    o = [];
  for (let r = 0; r < n.length; r++) {
    const c = n[r];
    if (!c) continue;
    const l = a.get(c.id);
    if (!l) throw new b(message("storage.inventory"));
    const f = isBagEquipment(l) ? 0 : i,
      h = f + i;
    r >= f && r < h && !s[r] ? (s[r] = c) : o.push(c);
  }
  for (const r of o) {
    const c = a.get(r.id),
      l = isBagEquipment(c) ? 0 : i,
      f = s.findIndex((h, m) => !h && m >= l && m < l + i);
    if (f < 0) throw new b(message("storage.inventory"));
    s[f] = r;
  }
  ((e.inventory = s), (e.bagLayoutVersion = 1));
}
function Ki(e, t) {
  const a = e.storagePages || 1;
  if (!Number.isSafeInteger(t) || t !== a + 1 || t > 3) throw new b(message("storage.unlockOrder"));
  const i = zi[t - 1];
  if (e.gold < i)
    throw new b(
      message("storage.unlockGold", {
        gold: i,
      }),
    );
  ((e.gold -= i), e.storage.push(...Array(ta).fill(null)), (e.storagePages = t));
}
function Ze(e, t) {
  for (const a of e) {
    const i = t.find(
        (s) =>
          (a.cloudId && s.cloudId === a.cloudId) ||
          (!a.cloudId && !s.cloudId && s.id === a.id && s.name === a.name && s.job === a.job),
      ),
      n = Math.max(a.storagePages || 1, i?.storagePages || 1);
    n > (a.storagePages || 1) &&
      (a.storage.push(...Array(n * ta - a.storage.length).fill(null)), (a.storagePages = n));
  }
}
var ia = 4e3;
function isSunPotion(e) {
  return e.Type === "Potion" && e.Shape === 1 && [670, 671, 21231].includes(e.Index);
}
function sunPotionRemaining(e, t) {
  return Math.max(0, Math.min(ia, (e.sunPotionAt || 0) - t));
}
function et(e, t) {
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
function Pt(e, t) {
  const a = [];
  for (const i of t.adaptations.towns?.waypoints || [])
    !i.unlockOnArrival ||
      e.unlockedWaypoints?.includes(i.id) ||
      (e.map !== i.map && !(i.arrivalQuest && e.completedQuests.includes(i.arrivalQuest))) ||
      ((e.unlockedWaypoints ??= []).push(i.id), a.push(i.id));
  return a;
}
function Xi(e, t, a, i) {
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
function Ji(e, t, a) {
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
var tt = 8e3;
function isSnowPotion(e) {
  return (
    e.Type === "Potion" &&
    (e.Index === 20260 || e.DreamOriginalId === 260 || e.DreamName === "\u4E07\u5E74\u96EA\u971C")
  );
}
function itemCooldownRemaining(e, t, a) {
  return isSnowPotion(t) ? Math.max(0, Math.min(tt, (e.itemCooldowns?.snow || 0) - a)) : 0;
}
function Yi(e, t, a) {
  isSnowPotion(t) && ((e.itemCooldowns ??= {}).snow = a + tt);
}
var oe = {
  cap: 10,
  experiencePerLevel: 7e4,
};
function weaponGrowthStats(e, t) {
  if (t.Type !== "Weapon" || (e.maxDura > 0 && !e.currentDura)) return {};
  const a = Math.min(oe.cap, e.weaponGrowth?.level || 0);
  return {
    Luck: Math.floor(a / 3),
    WeakSpotPercent: a * 2,
  };
}
function en(e, t, a) {
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
  if (n.level >= oe.cap) return;
  const s = n.level;
  for (n.xp += Math.floor(a); n.level < oe.cap && n.xp >= (n.level + 1) * oe.experiencePerLevel; )
    ((n.xp -= (n.level + 1) * oe.experiencePerLevel), n.level++);
  (n.level === oe.cap && (n.xp = 0),
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
var tn = new Set(["MaxDC", "MaxMC", "MaxSC", "MaxAC", "MaxMAC", "Luck", "Accuracy", "Agility"]),
  Jo = [
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
function he(e) {
  return e?.added.GemTier
    ? e.added.GemTier === 2
      ? 4
      : 1
    : Object.entries(e?.added || {}).reduce(
        (t, [a, i]) => t + (tn.has(a) && Number.isFinite(i) ? Math.max(0, i) : 0),
        0,
      );
}
function an(e, t) {
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
function be(e) {
  return e?.locked === !0 || e?.dxFavorite === !0;
}
function equipmentLockable(e, t) {
  return !!e && !!t && t.StackSize === 1 && !!itemSlots(t)?.length && e.count === 1;
}
function assertEquipmentDisposable(e) {
  if (be(e)) throw new b(message("manage.protected"));
}
function nn(e, t, a) {
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
  return t ? String(e.dx?.rarity || "normal") : "q" + Math.min(8, Math.floor(he(e)));
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
function rn(e, t, a, i = !1) {
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
        !be(r) &&
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
function cn(e, t, a) {
  const i = e.requireNPC(t);
  if (i.id !== a.NPCID || !e.rules.adaptations.universalSaleRoles.includes(i.role))
    throw new b(message("manage.shopRequired"));
  const n = rn(t, e.defs, a.Filter, !!e.rules.adaptations.diablo?.enabled);
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
var trialState = (e) =>
  (e.trial ??= {
    stage: 0,
    honor: 0,
    title: 0,
    day: 0,
    attempts: 0,
  });


function ln(e, t) {
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
function dn(e, t, a, i = Math.floor((Date.now() + 8 * 36e5) / 864e5)) {
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
        l = c.find((f) => !be(f)) || c[0];
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
      je(e, t, message("trial.complete"));
      return;
    }
    const c = n.floors[r.floor],
      l = e.rules.monsters.find((m) => m.Name === c.monster),
      f = e.freeNear(
        t.map,
        {
          x: t.x + 4,
          y: t.y,
        },
        8,
      );
    if (!f) throw new b(message("core.trial.trialAction.a3744f6549"));
    (at(t),
      r.floor++,
      (r.cleared = !1),
      (e.map(t.map).actors = e
        .map(t.map)
        .actors.filter((m) => m.friendly || m.kind !== "monster")));
    const h = e.newMonster(l, t.map, f);
    ((h.hp = h.maxHP = c.hp),
      (h.stats.HP = c.hp),
      (h.special = {
        ...h.special,
        trialFloor: r.floor,
        trialXP: c.xp,
        trialBoss: c.boss,
      }),
      e.map(t.map).actors.push(h),
      e.say(
        message("core.trial.trialAction.43bd68bc0b", {
          p0: r.floor,
          p1: o.honor,
        }),
      ));
  } else if (a === "@trialleave") {
    je(e, t);
    return;
  }
  e.emit("NPCResponse", {
    NPCID: s.id,
    Page: [],
  });
}
function at(e) {
  const t = e.trialRun;
  if (!t) return;
  const a = Math.max(0, t.pendingHonor || 0);
  (a && t.settledFloor !== t.floor && ((trialState(e).honor += a), (t.settledFloor = t.floor)),
    (t.pendingHonor = 0));
}
function fn(e, t) {
  const a = t.trialRun;
  if (!a || a.cleared || t.map !== e.rules.adaptations.trial.map) return;
  const i = e.rules.adaptations.trial.floors[a.floor - 1];
  i &&
    ((a.cleared = !0),
    (a.pendingHonor = i.honor),
    at(t),
    e.say(
      message("core.trial.trialKill.a5ad08e078", {
        p0: a.floor,
        p1: i.honor,
      }),
    ),
    a.floor === 99 && je(e, t, message("trial.completeFinal")));
}
function je(e, t, a = message("trial.left")) {
  if (!t.trialRun) return;
  at(t);
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
function un(e, t) {
  t.trialRun &&
    (t.map !== e.rules.adaptations.trial.map || e.time >= t.trialRun.deadline) &&
    je(e, t, message("trial.ended"));
}
function U(e, t) {
  const a = structuredClone(e.roles);
  for (const i of a) {
    Pt(i, t);
    const n = et(i, t);
    (i.sunPotionAt !== void 0 && (i.sunPotionAt = sunPotionRemaining(i, e.time)),
      i.itemCooldowns &&
        (i.itemCooldowns = {
          snow: Math.max(0, Math.min(tt, (i.itemCooldowns.snow || 0) - e.time)),
        }),
      at(i),
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
function spiritNextXP(e, t) {
  return t >= e.cap ? 0 : (e.thresholds?.[t] ?? (t + 1) * e.experienceStep);
}
function It(e, t) {
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
function oa(e, t, a) {
  const i = e.rules.adaptations.guideChallenges?.find((m) => m.id === a),
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
    (e.events = e.events.filter((m) => m.map !== i.map)),
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


function ra(e, t, a = message("challenge.left")) {
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
function mn(e, t) {
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
function ca(e, t) {
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
    : (fa(e, t), (a.branch = "choice"), (a.nextWaveAt = 0), e.say(message("late.poChoice")), !0);
}
function la(e, t) {
  const a = t.challengeRun;
  if (!a) return;
  if (t.map !== a.map) {
    (delete e.maps[a.map],
      (e.events = e.events.filter((f) => f.map !== a.map)),
      delete t.challengeRun);
    return;
  }
  if (e.time >= (a.cleared && a.returnAt !== void 0 ? a.returnAt : a.deadline)) {
    ra(e, t, message(a.cleared ? "challenge.complete" : "challenge.timeout"));
    return;
  }
  if (!a.started || a.cleared || t.dead) return;
  const i = e.rules.adaptations.guideChallenges.find((f) => f.id === a.id),
    n = e.map(a.map);
  for (const f of i.waves.flat().filter((h) => h.at)) {
    const h = [...e.monsters.values()].find((m) => m.Name === f.monster);
    for (const m of n.actors.filter(
      (g) =>
        g.definition === h?.Index &&
        !g.dead &&
        g.special?.challenge === a.map &&
        !g.special.challengeAnchored,
    )) {
      const [g, y] = f.at;
      e.walkable(a.map, g, y, m.id) && ((m.x = g), (m.y = y), (m.special.challengeAnchored = !0));
    }
  }
  if (
    n.actors.some((f) => f.kind === "monster" && !f.friendly && !f.dead) ||
    (!a.nextWaveAt &&
      ((a.nextWaveAt = e.time + (a.wave < i.waves.length ? 2e3 : 0)), a.wave < i.waves.length)) ||
    e.time < a.nextWaveAt ||
    ca(e, t) ||
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
      const m = [...e.monsters.values()].find((u) => u.Name === f.monster);
      if (!m)
        throw new b(
          message("core.challenges.challengeTick.380afbda2e", {
            p0: f.monster,
          }),
        );
      let g;
      const y = f.at ? [f.at] : i.spawnPoints;
      for (let u = 0; u < y.length && !g; u++) {
        const w = y[f.at ? 0 : r++ % y.length],
          x = w.join(",");
        !l.has(x) &&
          e.walkable(t.map, w[0], w[1]) &&
          ((g = {
            x: w[0],
            y: w[1],
          }),
          l.add(x));
      }
      if (!g) {
        a.nextWaveAt = e.time + 1e3;
        return;
      }
      c.push({
        def: m,
        at: g,
        anchored: !!f.at,
      });
    }
  for (const { def: f, at: h, anchored: m } of c) {
    const g = e.newMonster(f, t.map, h);
    ((g.special = {
      ...g.special,
      challenge: a.map,
      challengeAnchored: m,
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
        fa(e, t),
        ua(e, t),
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
function fa(e, t) {
  const a = t.challengeRun;
  if (!a || a.id !== "po" || a.rewardSealed) return;
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
function ua(e, t) {
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
  ua(e, t);
}
function ma(e, t, a) {
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
  } else ((i.branch = "settle"), (i.nextWaveAt = 0), la(e, t));
  e.emit("NPCResponse", {
    NPCID: n.id,
    Page: [],
  });
}
function hn(e, t) {
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
function He(e, t, a) {
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
function nt(e, t, a, i) {
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
function gn(e, t, a, i) {
  const n = e.rules.adaptations.lateContent;
  if (!n || a.friendly || a.special?.trialFloor || a.special?.bossMinion) return;
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
function yn(e, t, a) {
  const i = e.rules.adaptations.lateContent;
  i || fail("unavailable");
  const n = i.sevenPearls,
    s = i.fireAltar,
    o = i.bloodCycle,
    r = i.secretTicket;
  if (a === "@late-pearls" || a === "@late-pearls-exchange") {
    (n || fail("unavailable"), He(e, t, n.npcId), checkLevel(t, n.level));
    const l = state(t);
    ((l.pearls ??= {
      active: !1,
      exchanges: 0,
    }),
      a === "@late-pearls-exchange"
        ? (l.pearls.active || fail("acceptFirst"),
          nt(
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
    (s || fail("unavailable"), He(e, t, s.npcId), checkLevel(t, s.level));
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
        ? (nt(
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
          ? (nt(
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
      (l.altar.stage !== 3 && fail("altarLocked"), oa(e, t, s.challenge));
      return;
    }
  } else if (a === "@late-blood" || a === "@late-blood-submit") {
    (o || fail("unavailable"), He(e, t, o.npcId), checkLevel(t, o.level));
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
        nt(
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
          ? (l.blood.stage = 2)
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
    (r || fail("unavailable"), He(e, t, r.npcId));
    const l = r.shortcuts.find((m) => m.map === Number(a.slice(13)));
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
      He(e, t, l.npcId),
      e.emit("ScarletSwordOptions", {
        Materials: l.materials,
        Result: l.result,
      }));
    return;
  } else fail("unavailable");
  const c = e.requireNPC(t);
  e.emit("NPCResponse", {
    NPCID: c.id,
    Page: ha(e, t, c),
  });
}


function xn(e, t, a) {
  const i = e.rules.adaptations.lateContent?.scarletSword;
  (i || fail("unavailable"),
    He(e, t, i.npcId),
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
function pa(e, t) {
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
function ha(e, t, a) {
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
  for (const o of pa(e, t).filter((r) => r.npcId === a.id)) {
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
function vn(e, t, a) {
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
function ba(e, t) {
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
function wn(e, t, a) {
  return e.adaptations.bossRewards?.entries[String(t.Index)]?.maps.includes(a.map) && !ba(e, a)
    ? t.Drops
    : (t.MapDrops?.[String(a.map)] ?? t.Drops);
}
function Mn(e, t, a, i, n) {
  const s = ba(e.rules, t);
  if (
    !s ||
    n.some((c) => {
      const l = e.defs.get(c.id)?.Type;
      return l && (Le.has(l) || l === "Talisman" || l === "Amulet");
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
function Sn(e, t) {
  const a = e.special?.nativeBeastArmourRank
    ? t.monsters.find((n) => n.DreamOriginalId === 82)
    : void 0;
  let i = entityText("monsters", a?.Index ?? e.definition);
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

var kn = {
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


function Pn(e, t, a, i) {
  const n = kn[e + "/" + t + "/" + a];
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
function ga(e) {
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
function ot(e, t) {
  const a = e.rules.adaptations.noviceProgression;
  if (!a) return !1;
  let i = ga(t);
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
      if (!e.give(t, e.newItem(o))) continue;
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
function Cn(e, t) {
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
function An(e, t) {
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
function Dn(e, t, a) {
  if (a.kind !== "monster" || a.friendly || e.monsters.get(a.definition)?.IsBoss) return !1;
  if (petInheritance(e, t))
    return (
      (a.special ??= {}),
      (a.special.frontPet = t.id),
      (a.special.frontPetUntil = e.time + 2500),
      (a.target = t.id),
      !0
    );
  const i = e.actor(Number(a.special?.frontPet));
  return t.kind === "player" &&
    i &&
    !i.dead &&
    i.friendly &&
    i.map === a.map &&
    Number(a.special?.frontPetUntil) > e.time &&
    Math.max(Math.abs(i.x - a.x), Math.abs(i.y - a.y)) <= 2
    ? ((a.target = i.id), !0)
    : !1;
}
function spiritGrowth(e, t) {
  const a = e.rules.adaptations.noviceProgression.spiritGrowth;
  It(t, a);
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
function In(e, t, a) {
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
function Hn(e, t) {
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
function F(e, t, a) {
  const i = G(t.stats, a, e.rng);
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
function Rn(e, t, a, i) {
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
        Le.has(f) ? "equipment" : f === "Book" ? "books" : f === "Potion" ? "potions" : "materials"
      ].push(l);
  }
  (o.equipment.sort(
    (l, f) =>
      s.indexOf(String(t.get(f.id).Grade)) - s.indexOf(String(t.get(l.id).Grade)) || he(f) - he(l),
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
function Nt(e, t) {
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
  if (!s || !(n.boss || n.native?.boss || Nt(s, e.rules) !== "normal" || (o && !o.helper))) return;
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
function Tn(e, t) {
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
function qn(e, t) {
  if (t.friendly) return;
  const a = e.rules.adaptations.bossBehaviors,
    i = a?.entries[String(t.definition)];
  return i ? a.profiles[i.profile] : void 0;
}
function j(e, t) {
  if (!t.friendly)
    return (
      qn(e, t) ??
      e.rules.adaptations.monsterCombat?.byNativeId[
        String(e.monsters.get(t.definition)?.DreamOriginalId)
      ]
    );
}
function activeBossHealthBranches(e, t) {
  return (j(e, t)?.healthBranches ?? []).filter(
    (a) =>
      (a.hpAtMostPercent === void 0 || t.hp <= (t.maxHP * a.hpAtMostPercent) / 100) &&
      (a.hpBelow === void 0 || t.hp < a.hpBelow) &&
      (a.hpBelowPercent === void 0 || t.hp < (t.maxHP * a.hpBelowPercent) / 100),
  );
}
function applyBossHealthStats(e, t) {
  const a = j(e, t)?.revivals;
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
function Fn(e, t, a) {
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


function En(e, t, a, i, n) {
  const s = t.special;
  if (t.friendly || t.kind !== "monster" || !s?.nativeAffixType || i === "None") return a;
  const o = Number(s.nativeAffixType),
    r = e.rng.next(Number(s.nativeAffixHigh) + 1, Number(s.nativeAffixLow));
  if (o === 10002 && i.startsWith("AC")) return Math.floor(a * (1 + r / 100));
  const c = e.rules.skills.find((l) => l.Spell === n)?.DreamSkill?.element;
  return c &&
    {
      10005: 4,
      10006: 5,
      10007: 2,
      10008: 3,
      10009: 1,
    }[o] === c
    ? Math.floor(a * (1 + r / 100))
    : a;
}
function Ln(e, t, a, i, n) {
  const s = t.special;
  t.friendly ||
    a.dead ||
    !s ||
    i <= 0 ||
    n === "None" ||
    (s.nativeAffixType === 10001 &&
      e.rng.next(100) < Number(s.nativeAffixRate) &&
      e.buff(
        a,
        "Green",
        Number(s.nativeAffixDuration) * 1e3,
        e.rng.next(Number(s.nativeAffixHigh) + 1, Number(s.nativeAffixLow)),
        {},
        t.id,
      ));
}
function Wn(e, t) {
  const a = t.special;
  t.dead ||
    t.friendly ||
    a?.nativeAffixType !== 10011 ||
    e.time < Number(a.nativeAffixRegenAt) ||
    ((a.nativeAffixRegenAt = e.time + 5e3),
    t.buffs.some((i) => i.type === "Green" || i.type === "DreamPoisonArmour") ||
      (t.hp = Math.min(t.maxHP, t.hp + Math.ceil((t.maxHP * Number(a.nativeAffixLow)) / 100))));
}
function jn(e, t) {
  if (!j(e, t)?.ownerBound) return !1;
  const a = t.master ? e.actor(t.master) : void 0;
  return t.special?.bossMinion && (!a || a.dead || a.map !== t.map) ? (e.die(t, t), !0) : !1;
}
function $n(e, t, a, i, n = 3, s) {
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
    const [f, h] = Q[(l * 2) % 8],
      m = s?.cardinal
        ? {
            x: t.x + f * n,
            y: t.y + h * n,
          }
        : e.freeNear(t.map, t, n);
    if (!m) break;
    if (!e.walkable(t.map, m.x, m.y, t.id)) continue;
    const g = e.newMonster(o, t.map, m);
    ((g.master = t.id),
      (g.target = t.target),
      (g.special = {
        ...g.special,
        bossMinion: !0,
      }),
      e.map(t.map).actors.push(g));
  }
}
function ct(e, t, a, i, n) {
  const s = (t.special ??= {});
  if (
    (a.requiredHPBelow !== void 0 && t.hp >= a.requiredHPBelow) ||
    (a.requiredHPBelowPercent !== void 0 && t.hp >= (t.maxHP * a.requiredHPBelowPercent) / 100) ||
    (a.once && s[i + "Done"]) ||
    e.time < Number(s[i + "At"] ?? a.initialDelayMs ?? 0) ||
    (a.chancePercent !== void 0 && e.rng.next(100) >= a.chancePercent)
  )
    return !1;
  for (const o of a.adds) $n(e, t, o.nativeId, o.count, a.radius, a);
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
        Direction: L[t.dir],
        Spell: "None",
        Duration: a.actionMs,
      })),
    !0
  );
}
function Gn(e, t, a) {
  const i = j(e, t),
    n = (t.special ??= {});
  if (!i || t.dead) return;
  const s = activeBossHealthBranches(e, t),
    o = (i.healthBranches ?? []).reduce((m, g, y) => m + (s.includes(g) ? 2 ** y : 0), 0);
  i.healthBranches?.length &&
    n.bossHealthBranch !== o &&
    ((n.bossHealthBranch = o), e.refreshActor(t));
  const r = i.regeneration;
  r &&
    t.hp < t.maxHP &&
    e.time >= Number(n.bossRegenAt ?? r.initialDelayMs ?? 0) &&
    (t.buffs.some((m) => r.blockedBy.includes(m.type)) ||
      (t.hp = Math.min(t.maxHP, t.hp + Math.floor((t.maxHP * r.percent) / 100))),
    (n.bossRegenAt = e.time + r.intervalMs));
  const c = e.actor(t.target),
    l = t.buffs.some(
      (m) =>
        m.until > e.time &&
        ["Paralysis", "LRParalysis", "Frozen", "Stun", "Trap", "Shock"].includes(m.type),
    );
  if (n.bossChannelIndex !== void 0) {
    const m = i.attacks[Number(n.bossChannelIndex)],
      g = m?.channel;
    !g || l || e.time >= Number(n.bossChannelUntil) || !c || c.dead || c.map !== t.map || e.safe(c)
      ? (delete n.bossChannelIndex, delete n.bossChannelNext, delete n.bossChannelUntil)
      : e.time >= Number(n.bossChannelNext) &&
        ((n.bossChannelNext = Number(n.bossChannelNext) + g.intervalMs),
        Ma(
          e,
          t,
          c,
          i,
          {
            ...m,
            hitDelayMs: g.hitDelayMs,
          },
          g.hits,
        ));
  }
  if (
    e.time < t.actionAt ||
    t.buffs.some(
      (m) =>
        m.until > e.time &&
        ["Paralysis", "LRParalysis", "Frozen", "Stun", "Trap", "Shock"].includes(m.type),
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
    const m = i.teleport;
    n.dragonTeleportAt !== void 0 &&
      n.bossTeleportAt === void 0 &&
      (n.bossTeleportAt = n.dragonTeleportAt);
    const g = m?.trackPlayerHit
        ? (n.bossLastPlayerHitAt ?? 0)
        : (n.bossLastAttackAt ?? n.dragonLastAttackAt),
      y = m?.petOwner && c.kind === "monster" && c.master;
    if (
      m &&
      (m.hpAtMostPercent === void 0 || t.hp <= (t.maxHP * m.hpAtMostPercent) / 100) &&
      (P(t, c) > m.minDistance || y) &&
      e.time >= Number(n.bossTeleportAt ?? m.initialDelayMs ?? 0) &&
      (g === void 0 || e.time - Number(g) > (m.afterAttackMs ?? 0))
    ) {
      const u = y ? e.actor(c.master) : void 0,
        w = u?.kind === "player" && !u.dead && u.map === t.map && !e.safe(u) ? u : c,
        x = e.freeNear(t.map, w, m.radius);
      if (
        ((n.bossTeleportAt =
          e.time +
          (m.hpBelow !== void 0 && t.hp < m.hpBelow
            ? (m.woundedIntervalMs ?? m.intervalMs)
            : m.intervalMs)),
        x)
      ) {
        ((t.x = x.x),
          (t.y = x.y),
          (t.target = w.id),
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
      ct(e, t, i.summon, "bossSummon", c))
    )
      return;
  }
  const f = i.healthStages;
  if (f && t.maxHP >= f.count) {
    const m = Math.trunc(t.hp / Math.trunc(t.maxHP / f.count));
    if (
      m < Number(n.stage ?? f.count) &&
      (f.rageMs && (n.madUntil = e.time + f.rageMs), f.summonSettings)
    ) {
      const g = e.map(t.map).actors.filter((y) => y.master === t.id && !y.dead).length;
      for (let y = 0; y < Math.min(f.summonWave, f.summonLimit - g); y++) {
        const u = e.rules.monsterSettings[f.summonSettings[e.rng.next(f.summonSettings.length)]],
          w = e.rules.monsters.find((v) => v.Name === u),
          x = e.freeNear(t.map, t, f.summonRadius);
        if (!w || !x) continue;
        const p = e.newMonster(w, t.map, x);
        ((p.master = t.id),
          (p.target = t.target),
          (p.actionAt = e.time + f.summonDelayMs),
          (p.special = {
            ...p.special,
            bossMinion: !0,
          }),
          e.map(t.map).actors.push(p));
      }
    }
    n.stage = Math.min(Number(n.stage ?? f.count), m);
  }
  const h = i.escape;
  if (
    h &&
    e.time >= Number(n.teleAt || 0) &&
    ((n.teleAt = e.time + h.intervalMs),
    Q.filter(([m, g]) => !e.walkable(t.map, t.x + m, t.y + g, t.id)).length >= h.blockedNeighbours)
  )
    for (let m = 0; m < h.attempts; m++) {
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
function wa(e, t, a) {
  const i = (t.special ??= {}),
    n = a.woundedSelection,
    s = !!n && t.hp < (n.hpBelow ?? (t.maxHP * n.hpBelowPercent) / 100);
  if ((s && (i.bossWoundedSelection = !0), a.distanceSelection)) {
    const w = e.actor(t.target);
    return w && P(t, w) > a.distanceSelection.threshold
      ? a.distanceSelection.far
      : a.distanceSelection.near;
  }
  const o = a.forceAttack,
    r = e.actor(t.target),
    c = a.attacks[Number(i.bossSelectedAttack ?? 0)],
    l = r ? Math.abs(t.x - r.x) : 0,
    f = r ? Math.abs(t.y - r.y) : 0,
    h = !!r && (P(t, r) > (c.range ?? a.range) || !!(c.alignedOnly && l && f && l !== f));
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
          (w) =>
            w.until > e.time && ["Paralysis", "Frozen", "Stun", "Trap", "Shock"].includes(w.type),
        ) &&
        ct(e, t, o.summon, "bossForcedSummon")),
    i.bossSelectedAttack !== void 0)
  )
    return Number(i.bossSelectedAttack);
  const m = n && (s || (n.sticky && i.bossWoundedSelection));
  if (a.selection === "nativeModulo") {
    const w = a.moduloSelection;
    return Number(
      (i.bossSelectedAttack = w.indices[e.rng.next(t.hp <= w.hpAtMost ? w.low : w.high)] ?? 0),
    );
  }
  const g = e.rng.next(100);
  let y = 0,
    u = 0;
  for (let w = 1; w < a.attacks.length; w++) {
    if (
      (a.attacks[w].abilityBuff &&
        t.buffs.some((v) => v.type === "DreamBossAbility" && v.until > e.time)) ||
      (a.attacks[w].defenceBuff &&
        t.buffs.some((v) => v.type === "DreamBossDefence" && v.until > e.time))
    )
      continue;
    const x = m ? a.woundedSelection.weights[w] : (a.attacks[w].weight ?? 0),
      p = y;
    if (((y += x), g > p && g <= y)) {
      u = w;
      break;
    }
  }
  return ((i.bossSelectedAttack = u), u);
}
function Qn(e, t) {
  const a = j(e, t);
  if (!a || !["nativePercent", "nativeModulo"].includes(a.selection)) return a?.range;
  const i = wa(e, t, a),
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
    : a.recoverBeforeInterval && (t.attackAt = Number(t.special?.[s] ?? 0) + Ne(e, t));
  const o = e.actor(t.target),
    r = o ? Math.abs(o.x - t.x) : 0,
    c = o ? Math.abs(o.y - t.y) : 0;
  return o &&
    ((n.alignedOnly && r && c && r !== c) || r > (n.rangeX ?? 1 / 0) || c > (n.rangeY ?? 1 / 0))
    ? 0
    : (n.range ?? a.range);
}
function zn(e, t, a) {
  const i = j(e, t);
  if (!i) return !1;
  const n = (t.special ??= {}),
    s = Number(n.bossAttackPhase || 0) % i.attacks.length;
  let o = s;
  if (
    (["nativePercent", "nativeModulo"].includes(i.selection) && (o = wa(e, t, i)),
    i.selection === "weighted")
  ) {
    const g = i.attacks.reduce((u, w) => u + (w.weight || 0), 0);
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
      (P(t, a) > (r.range ?? i.range) || P(t, a) < (r.minimumDistance ?? 0)))
  )
    return !0;
  if (
    (delete n.bossSelectedAttack,
    (n.bossAttackPhase = s + 1),
    (n.bossLastAttackAt = e.time),
    (t.dir = direction(t, a)),
    t.dir < 0 && (t.dir = 0),
    (t.attackAt = e.time + Ne(e, t)),
    (t.actionAt =
      e.time + (r.actionMs ?? (i.actionMs === 300 ? monsterActionCost(e, t, !0) : i.actionMs))),
    i.selection === "cycle" &&
      e.monsters.get(t.definition)?.DreamRaw &&
      (t.attackAt = t.actionAt + Ne(e, t)),
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
  r.groundFire && ds(e, t, a, r.groundFire);
  const f = r.animation ?? i.animation ?? "ObjectAttack",
    h = r.visual ?? i.visual ?? "None",
    m = r.visualPerTarget ?? i.visualPerTarget;
  if (
    (r.casterVisual &&
      e.emit("ObjectRangeAttack", {
        ObjectID: t.id,
        Direction: L[t.dir],
        TargetID: t.id,
        Spell: r.casterVisual,
        Action: r.visualAction,
        Duration: r.visualDurationMs ?? r.actionMs ?? i.actionMs,
      }),
    m ||
      e.emit(f, {
        ObjectID: t.id,
        Direction: L[t.dir],
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
      (n.guideSummoned && (n.attackSummonDone = !0), ct(e, t, i.attackSummon, "attackSummon")),
    r.summon &&
      (n.guideSummoned && (n["actionSummon" + o + "Done"] = !0),
      ct(e, t, r.summon, "actionSummon" + o)),
    r.channel &&
      ((n.bossChannelIndex = o),
      (n.bossChannelNext = e.time + r.channel.intervalMs),
      (n.bossChannelUntil = e.time + r.channel.durationMs)),
    Ma(e, t, a, i, r, r.hits),
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
        Direction: L[t.dir],
      })),
    !0
  );
}


function Ma(e, t, a, i, n, s) {
  const o = (t.special ??= {}),
    r = i.randomPerTarget ? 0 : G(t.stats, "DC", e.rng),
    c = [e.me, ...e.map(t.map).actors.filter((m) => m.friendly)].filter(
      (m) => m && !m.dead && m.map === t.map && !e.safe(m),
    ),
    l = n.animation ?? i.animation ?? "ObjectAttack",
    f = n.visual ?? i.visual ?? "None",
    h = n.visualPerTarget ?? i.visualPerTarget;
  for (const m of s) {
    let g = c.filter((y) => {
      if (m.excludePrimary && y.id === a.id) return !1;
      if (m.shape === "selfArea")
        return (
          Math.abs(y.x - t.x) <= (m.rangeX ?? m.radius) &&
          Math.abs(y.y - t.y) <= (m.rangeY ?? m.radius)
        );
      if (m.shape === "targetArea")
        return (
          Math.abs(y.x - a.x) <= (m.rangeX ?? m.radius) &&
          Math.abs(y.y - a.y) <= (m.rangeY ?? m.radius)
        );
      if (m.shape === "forwardArea") {
        const [u, w] = Q[t.dir];
        return (
          P(y, {
            x: t.x + u * (m.forward ?? 2),
            y: t.y + w * (m.forward ?? 2),
          }) <= m.radius
        );
      }
      if (m.shape === "line") {
        const [u, w] = Q[t.dir],
          x = u ? (y.x - t.x) / u : (y.y - t.y) / w;
        return x > 0 && x <= m.radius && y.x === t.x + x * u && y.y === t.y + x * w;
      }
      return y.id === a.id && P(t, y) <= Math.max(n.range ?? i.range, m.radius);
    });
    if (
      (m.scatterRadius !== void 0 &&
        (g = g.flatMap((u) => c.filter((w) => P(w, u) <= m.scatterRadius))),
      h &&
        e.emit("ObjectMagic", {
          ObjectID: t.id,
          Cast: !0,
          Direction: L[t.dir],
          Action: n.visualAction,
          Duration: n.visualDurationMs ?? n.actionMs ?? i.actionMs,
        }),
      h)
    )
      for (const y of new Map(g.map((u) => [u.id, u])).values())
        e.emit(l, {
          ObjectID: t.id,
          Direction: L[t.dir],
          TargetID: y.id,
          Spell: f,
          Action: n.visualAction,
          Duration: n.visualDurationMs ?? n.actionMs ?? i.actionMs,
        });
    g.some((y) => y.kind === "player") && (o.bossLastPlayerHitAt = e.time);
    for (const y of g) {
      const u = i.randomPerTarget ? G(t.stats, "DC", e.rng) : r;
      let w =
          m.currentHPScale !== void 0
            ? Math.floor(y.hp * m.currentHPScale)
            : m.maxHPScale !== void 0
              ? Math.floor(y.maxHP * m.maxHPScale)
              : Math.floor(((m.defence === "None" && t.stats.MaxDC) || u) * m.scale),
        x = m.defence;
      if (
        (m.addPowerToHPScale &&
          (y.kind === "player" ? (w += u) : (w = Math.floor(y.maxHP * (m.petsMaxHPScale ?? 0)))),
        m.subtractMPDivisor && y.kind === "player")
      ) {
        const p = y;
        p.mp -= Math.floor(p.mp / m.subtractMPDivisor);
      }
      if (
        (m.bypassChanceOneIn &&
          e.rng.next(m.bypassChanceOneIn) === 0 &&
          ((x = m.defence.startsWith("MAC") ? "MACBypass" : "ACBypass"),
          (w = Math.min(w, Math.floor((y.maxHP * (m.capMaxHPPercent ?? 100)) / 100)))),
        m.drainHalfMP)
      )
        if (y.kind === "player") {
          const p = y;
          ((w = Math.floor(p.mp / 2)), (p.mp -= w));
        } else w = Math.floor(y.maxHP * (m.petsMaxHPScale ?? 0.05));
      (m.rawHealScale && (t.hp = Math.min(t.maxHP, t.hp + Math.floor(w * m.rawHealScale))),
        i.suicideAttack
          ? e.damage(t, y, w, x, m.spell)
          : e.schedule(
              "hit",
              (n.hitDelayMs ?? i.hitDelayMs) + P(t, y) * (i.distanceDelayMs ?? 0),
              t,
              y,
              w,
              x,
              m.spell,
            ));
    }
  }
}
function Un(e, t, a, i, n) {
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
  const o = j(e, t);
  if (o?.healOwnerPercent && t.master) {
    const l = e.actor(t.master);
    l &&
      !l.dead &&
      l.map === t.map &&
      (l.hp = Math.min(l.maxHP, l.hp + Math.floor((i * o.healOwnerPercent) / 100)));
  }
  if (a.dead || !n) return;
  const r = j(e, t)?.statuses?.[n];
  if (!r) return;
  const c = (t.special ??= {});
  for (const l of r) {
    const f = "bossStatusAt:" + n + ":" + l.type;
    if (e.time < Number(c[f] ?? (n === "DragonParalysis" ? c.dragonParalysisAt : 0) ?? 0)) continue;
    const h = l.powerStat
      ? G(t.stats, l.powerStat, e.rng)
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
    const m = e.buff(a, l.type, l.durationMs, h, {}, t.id);
    (l.tickMs &&
      m &&
      m.interval !== l.tickMs &&
      ((m.interval = l.tickMs), (m.next = e.time + l.tickMs)),
      l.cooldownMs && (c[f] = e.time + l.cooldownMs));
  }
}
function Vn(e, t, a, i, n) {
  if (t.dead || e.safe(a) || !n) return;
  const s = j(e, t)
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
function Kn(e, t) {
  const a = j(e, t)?.revivals;
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
function Sa(e, t, a, i, n) {
  if (!e.rules.skills.some((p) => p.DreamSkill)) return !1;
  let s = e.skill(t, i);
  if (i !== "None" && !s?.d.DreamSkill) return !1;
  const o = _e(t.level, t.stats, !0);
  ((t.dir = direction(t, n || a)),
    (t.attackAt = e.time + o),
    (t.actionAt = e.time + Math.min(550, o)),
    (t.regenAt = e.time + 1e4));
  const r = F(e, t, "DC"),
    c = e
      .map(t.map)
      .actors.filter(
        (p) =>
          p.kind === "monster" &&
          !p.friendly &&
          !p.dead &&
          p.special?.visible !== !1 &&
          !p.special?.stoned,
      ),
    l = i[0].toLowerCase() + i.slice(1);
  (i === "Slaying" ||
    (["FlamingSword", "BlazingSword", "HalfMoon", "WhirlwindSlash", "Thrusting"].includes(i) &&
      !t.attackModes[l])) &&
    (i = "None");
  const f = (p, v, k = "AC", S = i) =>
    p ? e.schedule("hit", 350, t, p, Math.trunc(v), k, S) : void 0;
  let h = !1,
    m = i;
  if (s && ["HalfMoon", "WhirlwindSlash"].includes(i)) {
    const p = Pe(s.d, s.level, t.stats);
    t.mp < p ? (i = "None") : (t.mp -= p);
  }
  if (s && ["FlamingSword", "BlazingSword"].includes(i)) {
    const p = Math.trunc(Math.fround(r * Math.fround(Ee(s.d, s.level))));
    if ((f(a, p), (t.attackModes[l] = !1), (h = !0), i === "BlazingSword"))
      for (const v of c) {
        const k = P(t, v);
        v !== a &&
          direction(t, v) === t.dir &&
          k >= 2 &&
          k <= 5 &&
          f(v, Math.trunc(Math.fround(p * Math.fround(1 - (k - 1) * 0.1))));
      }
  } else if (s && ["HalfMoon", "WhirlwindSlash"].includes(i)) {
    for (const p of c) {
      const v = (direction(t, p) - t.dir + 8) % 8;
      if (P(t, p) !== 1 || (i === "HalfMoon" && ![7, 0, 1, 2, 3].includes(v))) continue;
      const k = f(
        p,
        p === a ? r : Math.trunc(Math.fround(r * Math.fround(Ee(s.d, s.level)))),
        p === a ? "AC" : "ACNoArmor",
      );
      k &&
        i === "WhirlwindSlash" &&
        p !== a &&
        e.monsters.get(p.definition).Level <= t.level &&
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
    u = g ? 20 : 0,
    w = y ? Math.min(20, 6 + 2 * y.level) : 0,
    x = u + w > 0 ? e.rng.next(100) : 100;
  if (g && x < u)
    (f(a, Math.trunc(((t.stats.MaxDC || 0) * (14 + g.level)) / 10), "AC", "Slaying"),
      ["FlamingSword", "BlazingSword"].includes(i) || (m = "Slaying"),
      (h = !0));
  else if (y && x < u + w) {
    const p = Math.trunc(Math.fround(F(e, t, "DC") * Math.fround(Ee(y.d, y.level))));
    for (const v of c) {
      const k = P(t, v);
      direction(t, v) === t.dir &&
        k >= 1 &&
        k <= 3 &&
        f(v, Math.trunc(Math.fround(p * Math.fround(1 - (k - 1) * 0.1))), "AC", "SkyCleaver");
    }
    (["FlamingSword", "BlazingSword"].includes(i) || (m = "SkyCleaver"), (h = !0));
  }
  if (!h && (f(a, r, "AC", "None"), s && i === "Thrusting")) {
    const p = Pe(s.d, s.level, t.stats);
    if (t.mp >= p) {
      t.mp -= p;
      const [v, k] = Q[t.dir];
      for (const S of c)
        S.x === t.x + v * 2 &&
          S.y === t.y + k * 2 &&
          f(
            S,
            Math.trunc(Math.fround(r * Math.fround(Ee(s.d, s.level)))),
            "ACNoArmor",
            "Thrusting",
          );
    }
  }
  return (
    (t.attackModes.slaying = !1),
    e.emit("ObjectAttack", {
      ObjectID: t.id,
      Direction: L[t.dir],
      Spell: m,
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
function Jn(e, t, a, i, n) {
  if (t.special?.dreamPet && t.master) {
    const c = e.roles.find((f) => f.id === t.master),
      l = e.monsters.get(t.definition)?.DreamOriginalId;
    if (c && !t.special?.dreamTamed && l !== 144) {
      const f = petInheritance(e, t);
      if (f) {
        const h = l === 99 ? 27 : [14, 62].includes(Number(l) || 0) ? 24 : 0,
          m = h ? Math.max(0, c.stats["NativeState:" + h] || 0) * 0.0625 : 0,
          g = F(e, c, "SC"),
          y = l === 99 ? Math.trunc(Math.fround(g / 1.2)) : g;
        return i + Math.trunc(g * f.attack + y * m + 1e-9);
      }
      if (l === 99 || l === 62) {
        const h = e.skill(c, l === 99 ? "SummonTiger" : "AdvancedSummon");
        if (h) {
          const m = h.s.Level,
            g = F(e, c, "SC"),
            y = l === 99 ? Math.trunc(Math.fround(Math.fround(g) / Math.fround(1.2))) : g,
            u = Math.fround(l === 99 ? Math.min(0.5, 0.2 + m / 10) : Math.min(0.9, 0.3 + m / 5)),
            w = Math.max(0, Math.trunc(c.stats["NativeState:" + (l === 99 ? 27 : 24)] || 0)),
            x = Math.fround(u + Math.fround(Math.fround(w) * 0.0625));
          i += Math.trunc(Math.fround(y * x));
        }
      } else if (l === 14 || l === 29) {
        const h = e.skill(c, "SummonShinsu");
        if (h) {
          const m = Math.fround(
              Math.min(l === 14 ? 0.5 : 1, (l === 14 ? 0.2 : 0.3) + h.s.Level / 10),
            ),
            g = l === 14 ? Math.max(0, c.stats["NativeState:24"] || 0) * 0.0625 : 0;
          i += Math.trunc(Math.fround(F(e, c, "SC") * Math.fround(m + g)));
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


function _n(e, t, a, i) {
  if (i === "None" || t.kind !== "player" || a <= 0) return a;
  const n = t,
    s = n.buffs.find((c) => c.type === "MagicShield");
  if (s && e.skill(n, "MagicShield")?.d.DreamSkill) {
    const c = Math.min(10, e.skill(n, "MagicShield").level),
      l = Math.min(3, c),
      f = Math.fround(0.17),
      h = Math.fround(l * f),
      m = Math.min(Math.fround(h + Math.fround(F(e, n, "MC") / 1024)), Math.fround(h + f)),
      g = Math.trunc(Math.fround(Math.fround(a * m) + 1));
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
function Yn(e, t, a, i) {
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
function Zn(e, t, a) {
  const i = (t.nativeHealing ??= []);
  a > 0 &&
    i.length < 4 &&
    i.push({
      remaining: Math.trunc(a),
      chunk: Math.max(1, Math.trunc(a / 5)),
      next: e.time + 1e3,
    });
}
function es(e, t) {
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
function ts(e, t, a, i, n, s = i, o) {
  if (a.kind !== "player" || n === "None" || a.dead) return;
  const r = a,
    c = r.buffs.find((f) => f.type === "InnateQi"),
    l = r.buffs.find((f) => f.type === "DiamondBody");
  if (c) {
    const f = e.skill(r, "InnateQi")?.level || c.value;
    Yn(e, r, Math.trunc((i * f) / 10), f >= 6 ? 2 : f >= 4 ? 3 : 4);
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
function as(e, t, a) {
  if (a.type !== "DragonFlame" || t.kind !== "player") return;
  const i = t,
    n = e.skill(i, "DragonFlame");
  if (n)
    for (const s of e
      .map(t.map)
      .actors.filter((o) => o.kind === "monster" && !o.friendly && !o.dead && P(o, t) <= 2))
      e.damage(t, s, magicDamage(n.d, a.value, F(e, t, "MC"), e.rng), "MAC", "DragonFlame");
}
function ka(e, t, a) {
  const i = (t.special = {
      stage: j(e, t)?.healthStages?.count ?? 7,
    }),
    n = j(e, t);
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
var lt = (e) => e.special?.visible !== !1,
  targetableMonster = (e) => lt(e) && !e.special?.stoned,
  moveSpeed = (e, t) =>
    t.special?.madUntil && Number(t.special.madUntil) > e.time
      ? (j(e, t)?.healthStages?.moveMs ?? 400)
      : Math.max(
          0,
          (e.monsters.get(t.definition)?.MoveSpeed || 0) - (t.special?.runAway ? 300 : 0),
        ),
  Pa = (e, t) =>
    t.special?.madUntil && Number(t.special.madUntil) > e.time
      ? (j(e, t)?.healthStages?.attackMs ?? 500)
      : Math.floor(
          e.monsters.get(t.definition).AttackSpeed /
            (1 +
              (t.special?.nativeAffixType === 10010 ? Number(t.special.nativeAffixLow) / 10 : 0)),
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
var ns = (e, t) =>
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
  Ne = (e, t) =>
    slow(
      e,
      t,
      Math.max(
        e.monsters.get(t.definition)?.DreamRaw ? 0 : 400,
        (t.special?.dreamPet
          ? Math.max(
              200,
              bossHealthInterval(e, t, Pa(e, t), !0) - Number(t.special.petLevel || 0) * 50,
            )
          : bossHealthInterval(e, t, Pa(e, t), !0)) -
          (t.friendly &&
          !e.monsters.get(t.definition)?.DreamRaw &&
          ([18, 23, 38].includes(t.ai || 0) || t.special?.dreamPet)
            ? Number((t.special?.dreamPet ? t.special.petLevel : t.special?.maxPetLevel) || 0) * 70
            : 0),
      ),
    );
function ss(e, t, a) {
  if (isChallengeChest(e.monsters.get(t.definition), e.rules)) return ((t.target = 0), !1);
  if (jn(e, t)) return !1;
  Wn(e, t);
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
    o = j(e, t),
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
          P(t, f) <= (i.visible ? (r?.hideRange ?? (n.AI === 14 ? 7 : 3)) : (r?.emergeRange ?? 3)),
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
          (f) =>
            (!!j(e, f)?.stone || (!j(e, f) && [15, 17].includes(f.ai || 0))) &&
            !f.dead &&
            P(f, t) <= (c?.groupRange ?? 14),
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
  if ((Gn(e, t, a), !o && [11, 17].includes(n.AI) && t.maxHP >= 7)) {
    const l = Math.trunc(t.hp / Math.trunc(t.maxHP / 7));
    if (l < Number(i.stage ?? 7))
      if (n.AI === 11) i.madUntil = e.time + 8e3;
      else {
        const f = Math.min(
          8,
          40 - e.map(t.map).actors.filter((h) => h.master === t.id && !h.dead).length,
        );
        for (let h = 0; h < f; h++) {
          const m = e.rules.monsterSettings["Zuma" + (e.rng.next(7) + 1)],
            g = e.rules.monsters.find((w) => w.Name === m);
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
    Q.filter(([f, h]) => !e.walkable(t.map, t.x + f, t.y + h, t.id)).length >= 5)
  )
    for (let f = 0; f < 100; f++) {
      const h = t.x + e.rng.next(5, -4),
        m = t.y + e.rng.next(5, -4);
      if (e.walkable(t.map, h, m, t.id)) {
        ((t.x = h),
          (t.y = m),
          (t.target = 0),
          e.emit("ObjectTeleportIn", {
            ObjectID: t.id,
          }));
        break;
      }
    }
  return !0;
}
function os(e, t) {
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


function rs(e, t, a) {
  const i = t.special || (t.special = {});
  if (t.ai === 2 && i.runAway) return (Aa(e, t, a), !0);
  const n = j(e, t),
    s = n?.retreat;
  return (s || (!n && t.ai === 8)) && e.time >= t.attackAt && e.time >= Number(i.fearUntil || 0)
    ? ((i.fearUntil = e.time + (s?.intervalMs ?? 5e3)),
      P(t, a) >= (s?.range ?? 6) ? e.stepTowards(t, a) : Aa(e, t, a),
      !0)
    : !1;
}
function Aa(e, t, a) {
  if (e.time < t.moveAt) return;
  let i = direction(a, t);
  if ((i < 0 && (i = t.dir), e.move(t, i))) return;
  const n = e.rng.next(2) ? -1 : 1;
  for (let s = 1; s < 8; s++) if (e.move(t, (i + n * s + 8) % 8)) return;
}
function cs(e, t, a) {
  if (isSpirit(e, t)) {
    ((t.dir = direction(t, a)),
      (t.attackAt = e.time + Ne(e, t)),
      (t.actionAt = e.time + 600),
      e.emit("ObjectRangeAttack", {
        ObjectID: t.id,
        Direction: L[t.dir],
        TargetID: a.id,
        Spell: "SoulFireBall",
        Duration: 600,
      }),
      e.schedule("hit", 500, t, a, G(t.stats, "DC", e.rng), "MAC", "SpiritServantBolt"));
    return;
  }
  if (zn(e, t, a) || (t.ai === 18 && !t.special?.mode && !t.special?.dreamPet)) return;
  ((t.dir = direction(t, a)),
    t.dir < 0 && (t.dir = 0),
    (t.attackAt = e.time + Ne(e, t)),
    (t.actionAt = e.time + monsterActionCost(e, t, !0)),
    e.monsters.get(t.definition)?.DreamRaw && (t.attackAt = t.actionAt + Ne(e, t)),
    e.emit(
      t.ai === 55
        ? "Magic"
        : [8, 26, 38].includes(t.ai || 0)
          ? "ObjectRangeAttack"
          : "ObjectAttack",
      {
        ObjectID: t.id,
        Direction: L[t.dir],
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
  const i = moonSpiritAttackPower(e, t, G(t.stats, t.ai === 55 ? "MC" : "DC", e.rng)),
    n = t.friendly
      ? e
          .map(t.map)
          .actors.filter((s) => s.kind === "monster" && !s.friendly && targetableMonster(s))
      : [e.me, ...e.map(t.map).actors.filter((s) => s.friendly)];
  if (t.ai === 14)
    for (const s of n.filter((o) => o && !o.dead && P(o, t) <= 7))
      e.schedule("hit", 500, t, s, i, "MAC", "EvilCentipede");
  else if (t.ai === 26 || t.ai === 18) {
    const [s, o] = Q[t.dir];
    for (let r = 1; r <= (t.ai === 18 ? 2 : 6); r++)
      for (const c of n.filter((l) => l && !l.dead && l.x === t.x + s * r && l.y === t.y + o * r))
        e.schedule(
          "hit",
          (t.ai === 18 ? 500 : 300) + r * 50,
          t,
          c,
          i,
          t.ai === 18 ? "ACAgility" : "MACAgility",
        );
  } else
    e.schedule(
      "hit",
      t.ai === 8 ? 500 + P(t, a) * 50 : [38, 55].includes(t.ai || 0) ? 500 : 300,
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
}
function Da(e, t, a) {
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
    m = e.geometry.get(t.map);
  let g = !0;
  for (let y = o.y - l; y <= o.y + l; y++)
    for (let u = o.x - l; u <= o.x + l; u++) {
      if (
        (r && Math.abs(u - o.x) + Math.abs(y - o.y) > 1) ||
        u < 0 ||
        y < 0 ||
        u >= m.width ||
        y >= m.height ||
        m.solid[y * m.width + u]
      )
        continue;
      const w = e
        .map(t.map)
        .actors.find(
          (x) =>
            x.spell === i && x.x === u && x.y === y && !x.dead && (x.expires ?? 1 / 0) > e.time,
        );
      if (w) {
        (r || i === "PoisonCloud" || i === "DragonFlame") &&
          ((w.expires = e.time + f), (w.target = t.id));
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
function ls(e, t) {
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
function ds(e, t, a, i) {
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
function fs(e, t, a, i, n) {
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
function us(e, t) {
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
var qt = new WeakMap();
function Ha(e) {
  let t = qt.get(e);
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
      qt.set(e, t)),
    t
  );
}
function ms(e, t) {
  const a = qt.get(e);
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
function ps(e, t, a, i) {
  const n = Ha(e);
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


function hs(e, t) {
  const a = Ha(e);
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
function bs(e, t, a, i, n, s, o = () => !1) {
  if (n)
    return {
      items: [...e],
      gold: s,
      burst: !1,
    };
  const r = new Map(),
    c = new Set();
  for (const p of e) {
    if (!r.has(p.id)) {
      const k = o(p.id);
      r.set(p.id, k === !0 ? 1 / 0 : k === !1 ? 0 : Math.max(0, Math.floor(k)));
    }
    const v = r.get(p.id);
    v > 0 && (c.add(p), r.set(p.id, v - p.count));
  }
  const l = (p) => c.has(p),
    f = !n && a.next(100) < i.ordinaryBurstPercent,
    h = e.filter((p) => recoveryPotion(t.get(p.id)) && !l(p)),
    m = e.filter((p) => !recoveryPotion(t.get(p.id)) || l(p)),
    g = n ? i.bossMaxPotions : f ? i.burstMaxPotions : i.ordinaryMaxPotions;
  if (h.length && a.next(100) < i.potionChancePercent)
    for (let p = 0; p < g && h.length; p++) m.push(...h.splice(a.next(h.length), 1));
  const y = (p) =>
      l(p)
        ? 100
        : Le.has(t.get(p.id).Type)
          ? 50 +
            he(p) * 2 +
            (p.affixes?.length ? 10 : 0) +
            Math.min(7, Number(t.get(p.id).DreamGrade) || 0)
          : t.get(p.id).Type === "Book"
            ? 40
            : recoveryPotion(t.get(p.id))
              ? 0
              : 10,
    u = (f ? i.ordinaryBurstMax : i.ordinaryMax) - (s > 0 ? 1 : 0);
  m.sort((p, v) => y(v) - y(p));
  const w = m.filter((p) => l(p)),
    x = m.filter((p) => !l(p));
  return {
    items: [...w, ...x.slice(0, Math.max(0, u - w.length))],
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
var dt = new Set([19, 1001, 43]);
function ys(e, t) {
  const a = e.affixes || [],
    i = a.filter((s) => t[s.group]?.Prefix).length,
    n = a.findIndex((s) => t[s.group]?.Prefix && !dt.has(s.type));
  return n >= 0 ? n : i < 3 ? a.findIndex((s) => !t[s.group]?.Prefix && !dt.has(s.type)) : -1;
}
function Ft(e) {
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
var ft = new WeakMap();
function markNaturalAffixGeneration(e, t) {
  ft.set(e, {
    magicFind: t,
  });
}
function markAffixPointDistribution(e, t) {
  ft.set(e, {
    pointWeights: t,
  });
}
function ws(e) {
  const t = ft.get(e);
  return (ft.delete(e), t);
}
function Ms(e, t, a, i, n) {
  const s = Ft(t),
    o = ys(e, i);
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
      w = t.RequiredClass === "Warrior" || g > Math.max(y, u),
      x = ["Wizard", "Taoist"].includes(t.RequiredClass) || Math.max(y, u) > g;
    f =
      t.AffixSpeedKind === "attack"
        ? 1030
        : t.AffixSpeedKind === "cast"
          ? 1031
          : w
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
  const m = h.Affixes[1];
  e.affixes.some((g) => g.type === h.Type || (f !== 1032 && [19, 1001].includes(g.type))) ||
    (e.affixes[o] = {
      group: f,
      tier: "1",
      name: m.Name,
      type: h.Type,
      low: 1,
      high: 1,
      rate: 100,
      duration: 0,
      revealed: !0,
      text: h.Format.replaceAll("{val}", "1"),
    });
}
function Et(e, t, a, i) {
  const n = ws(e),
    s = effectiveAffixGrade(t),
    o = i.affixDropPolicy?.linkedExceptional,
    r = Math.min(8, Math.floor(he(e)));
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
  const m = Ft(t),
    g =
      m.speed + m.luck
        ? ks(
            t,
            i,
            n ?? {
              stars: r,
            },
          )
        : void 0;
  vi(e, t, a, i.affixes, h, g?.normalizer);
}
var Ra = new WeakMap();
function Ss(e, t, a) {
  let i = Ra.get(t);
  i || ((i = new Map()), Ra.set(t, i));
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
      const m =
          r.highStarCounts && h >= r.highStarCounts.minStars
            ? r.highStarCounts.countWeights
            : r.countWeights,
        g = m.reduce((y, u) => y + u, 0);
      return (
        (c[Math.min(8, h)] / 100) * m.reduce((y, u, w) => y + (u / g) * xi(e, t.affixes, w + 1), 0)
      );
    };
  let f = 0;
  if ("stars" in a) f = l(a.stars);
  else if ("pointWeights" in a) {
    const h = Object.values(a.pointWeights).reduce((m, g) => m + g, 0);
    f = Object.entries(a.pointWeights).reduce((m, [g, y]) => m + (y / h) * l(Number(g)), 0);
  } else {
    const h = t.pointWeights.reduce((y, u) => y + u, 0),
      m = t.pointWeights.map(() => 0);
    for (let y = 0; y < 32768; y++) {
      let u = y % h,
        w = 0;
      for (; u >= t.pointWeights[w]; ) u -= t.pointWeights[w++];
      m[w]++;
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
      m.reduce((y, u, w) => y + (u / 32768) * l(w + 1), 0);
  }
  return (i.set(s, f), f);
}
function ks(e, t, a) {
  const i = Ft(e),
    n = Ss(e, t, a),
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
function mountedItem(e, t) {
  return t.mountUid
    ? t.inventory.find((a) => a && a.uid === t.mountUid && e.defs.get(a.id)?.Type === "Mount")
    : void 0;
}
function mountSpeed(e, t) {
  const a = mountedItem(e, t);
  return a ? Number(e.defs.get(a.id).DreamMountSpeed || 0) : 0;
}
function Lt(e, t, a) {
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
function Cs(e, t, a) {
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
function craftingState(e) {
  return (e.crafting ??= {
    stage: 0,
    skills: {},
  });
}
function As(e, t, a = !1) {
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
function Ds(e, t, a, i = 1) {
  if (a === "talent") return;
  const n = craftingState(t).skills[a];
  n && ((n.xp += i), Ta(e, t, a, !0));
}
function Ta(e, t, a, i = !1) {
  const n = t.crafting?.skills[a],
    s = e.rules.adaptations.forge.crafting.experience;
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
function qa(e, t, a) {
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
        Math.floor((a.reduce((s, o) => s + he(o), 0) * 10) / a.length)
      : 0;
}
function Oa(e, t, a) {
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
var jt = ["MaxDC", "MaxMC", "MaxAC", "MaxSC", "MaxMAC", "Luck", "Accuracy", "Agility"];
function forgePoints(e) {
  return jt.reduce((t, a) => t + Math.max(0, e.added[a] || 0), 0);
}
function Fa(e, t, a) {
  const i = e.rules.adaptations.forge;
  if (!i) throw new b(message("core.forge.forgeQuote.135a98ae94"));
  let n, s;
  if (a.Mode === "cube") {
    const A = a.Selected;
    if (!Array.isArray(A) || !A.length || A.length > 8 || new Set(A).size !== A.length)
      throw new b(message("core.forge.forgeQuote.26b7c68817"));
    const H = A.map(
      (I) =>
        t.inventory.find((q) => q?.uid === I) ||
        t.questInventory.find(
          (q) =>
            q &&
            q.uid === I &&
            i.recipes.some((K) => K.mode === "pandora" && K.inputs.some((X) => X.item === q.id)),
        ),
    );
    if (H.some((I) => !I || I.id === i.boxId))
      throw new b(message("core.forge.forgeQuote.052dc5ca26"));
    const R = H;
    (R.forEach(assertEquipmentDisposable), (s = [...A]));
    const B = R.find((I) => I.id === i.mixId);
    if (B) {
      n = B.uid;
      const I = R.filter((q) => q !== B);
      a = {
        Mode: "mix",
        Target: I[0]?.uid,
        Selected: I.map((q) => q.uid),
      };
    } else {
      const I = i.recipes.find(
        (K) =>
          K.mode === "pandora" &&
          R.every((X) => K.inputs.some((ae) => ae.item === X.id)) &&
          K.inputs.every(
            (X) =>
              R.filter((ae) => ae.id === X.item).reduce((ae, me) => ae + me.count, 0) >= X.count,
          ),
      );
      if (!I) throw new b(message("core.forge.forgeQuote.e098ab1670"));
      const q = [];
      for (const K of I.inputs) {
        let X = K.count;
        for (const ae of R.filter((me) => me.id === K.item)) {
          const me = Math.min(X, ae.count);
          (me &&
            q.push({
              uid: ae.uid,
              count: me,
            }),
            (X -= me));
        }
      }
      if (q.length !== R.length) throw new b(message("core.forge.forgeQuote.2933c380f0"));
      a = {
        Mode: "recipe",
        Recipe: I.id,
        Ingredients: q,
      };
    }
  }
  const o = String(a.Mode),
    r = t.inventory.find((A) => A?.uid === Number(a.Target)),
    c = t.inventory.find((A) => A?.uid === Number(a.Material));
  if (o === "identify") throw new b(message("core.forge.forgeQuote.66a920f6f4"));
  const l = [],
    f = [],
    h = [],
    m = [...t.inventory, ...t.questInventory].filter((A) => !!A && !be(A));
  let g = "",
    y = "",
    u = 0,
    w = "",
    x = [],
    p,
    v = -1,
    k = 0;
  if (o === "recipe") {
    if (((p = i.recipes.find((H) => H.id === String(a.Recipe))), !p))
      throw new b(message("core.forge.forgeQuote.db530d007a"));
    if (p.mode === "pandora" && !t.inventory.some((H) => H?.id === i.boxId))
      throw new b(message("core.forge.forgeQuote.68ef58e0c7"));
    p.skill &&
      p.skill !== "talent" &&
      craftLevel(t, p.skill) < (p.level || 1) &&
      (y = message("forge.requirement", {
        skill: entityText("crafting", p.skill),
        level: p.level || 1,
      }));
    const A = p.processing ? Math.min(5, Math.max(1, Math.floor(Number(a.Count) || 1))) : 1;
    if (
      (l.push(
        ...p.inputs.map((H) => ({
          ...H,
          count: H.count * A,
        })),
      ),
      f.push(p.output),
      (u = p.gold * A),
      (g = message("recipe." + p.id, {
        output: entityText("items", p.output.item),
        input: entityText("items", p.inputs[0].item),
      })),
      a.Ingredients !== void 0)
    ) {
      if (!Array.isArray(a.Ingredients)) throw new b(message("core.forge.forgeQuote.bbacd00f52"));
      const H = new Set();
      for (const R of a.Ingredients) {
        const B = m.find((q) => q.uid === R.uid),
          I = R.count;
        if (
          !B ||
          H.has(B.uid) ||
          !Number.isSafeInteger(I) ||
          I < 1 ||
          I > B.count ||
          !l.some((q) => q.item === B.id)
        )
          throw new b(message("core.forge.forgeQuote.96c6a05c19"));
        (H.add(B.uid),
          h.push({
            uid: B.uid,
            item: B.id,
            count: I,
          }));
      }
      if (
        l.some(
          (R) => h.filter((B) => B.item === R.item).reduce((B, I) => B + I.count, 0) !== R.count,
        )
      )
        throw new b(message("core.forge.forgeQuote.0ef60a70ef"));
    } else
      for (const H of l) {
        let R = H.count;
        for (const B of m
          .filter((I) => I.id === H.item)
          .sort(
            (I, q) =>
              (I.materialQuality || 0) - (q.materialQuality || 0) ||
              forgePoints(I) - forgePoints(q) ||
              I.uid - q.uid,
          )) {
          if (R <= 0) break;
          const I = Math.min(R, B.count);
          (h.push({
            uid: B.uid,
            item: B.id,
            count: I,
          }),
            (R -= I));
        }
      }
    x = h.map((H) => H.uid);
  } else if (o === "mix") {
    if (!t.inventory.some((I) => I?.id === i.boxId))
      throw new b(message("core.forge.forgeQuote.68ef58e0c7"));
    if (!r) throw new b(message("core.forge.forgeQuote.eacdc6ab6e"));
    const A = e.defs.get(r.id),
      H = Number(A.DreamGrade);
    if (
      ![0, 2, 3, 4, 5, 6, 7].includes(H) ||
      String(A.DreamName || A.Name).startsWith("\u5929\u9F99\u9879\u94FE")
    )
      throw new b(message("core.forge.forgeQuote.23eb261b8e"));
    const R = Array.isArray(a.Selected)
        ? a.Selected.map(Number)
        : [
            r.uid,
            ...t.inventory
              .filter((I) => !!I && I.id === r.id && I.uid !== r.uid && !be(I))
              .sort((I, q) => forgePoints(I) - forgePoints(q) || I.uid - q.uid)
              .slice(0, 2)
              .map((I) => I.uid),
          ],
      B = R.map((I) => t.inventory.find((q) => q?.uid === I));
    if (
      (B.forEach(assertEquipmentDisposable),
      new Set(R).size !== R.length ||
        B.length < 3 ||
        B.some((I) => !I || I.id !== r.id || I.count !== 1))
    )
      throw new b(message("core.forge.forgeQuote.ab95b8372e"));
    if (B.some((I) => I && forgePoints(I) >= 8))
      throw new b(message("core.forge.forgeQuote.44a4cbc171"));
    ((x = R),
      l.push({
        item: i.mixId,
        count: 1,
      }),
      (g = message("forge.mixDescription", {
        count: B.length,
        chance: i.mixChance,
      })));
  } else if (o === "merge") {
    const A = i.essences.find((R) => R.item === c?.id),
      H = A && i.essences.find((R) => R.grade === A.grade + 1 && R.stat === A.stat);
    if (!A || !H) throw new b(message("core.forge.forgeQuote.5f2745c8a9"));
    if (r) throw new b(message("core.forge.forgeQuote.ce273c94ef"));
    ((u = i.fees.merge * A.grade),
      l.push({
        item: A.item,
        count: 20,
      }),
      f.push({
        item: H.item,
        count: 1,
      }),
      (g = message("forge.mergeDescription")));
  } else {
    if (!r || r.count !== 1) throw new b(message("core.forge.forgeQuote.46f045e474"));
    const A = e.defs.get(r.id),
      H = Number(A.DreamGrade),
      R = forgePoints(r);
    if (
      !A.DreamType ||
      (["dismantle", "enhance", "reset", "crystal"].includes(o) &&
        !e.rules.adaptations.dreamRuntime?.statPools[String(A.DreamType)])
    )
      throw new b(message("core.forge.forgeQuote.436bf1d625"));
    if (o === "identify") throw new b(message("core.forge.forgeQuote.66a920f6f4"));
    if (o === "awaken") {
      if (!r.handmade && !A.DreamRawItem?.Handmake)
        throw new b(message("core.forge.forgeQuote.f8a3c820c0"));
      if (A.Type !== "Weapon" && Number(A.DreamType) !== 6 && A.DreamName !== "\u5357\u74DC\u5934")
        throw new b(message("core.forge.forgeQuote.884a71edee"));
      if (R < 1) throw new b(message("core.forge.forgeQuote.8184c98ae7"));
      if (r.affixes?.length) throw new b(message("core.forge.forgeQuote.29047386ac"));
      if (
        !Object.values(e.rules.adaptations.dreamRuntime.affixes).some(
          (I) =>
            I.Weight > 0 &&
            Object.values(I.Poses).includes(Number(A.DreamType)) &&
            Object.values(I.Affixes).some((q) => q.Grade <= H),
        )
      )
        throw new b(message("core.forge.forgeQuote.1d1dbf9d26"));
      const B = i.crafting?.talents[String(c?.id)];
      if (!B) throw new b(message("core.forge.forgeQuote.db1c5e9058"));
      ((w = String(Math.min(B, A.Type === "Weapon" ? 5 : 3))),
        l.push({
          item: c.id,
          count: 1,
        }),
        (g = message("forge.awakenDescription", {
          count: w,
        })));
    } else if (o === "potential" || o === "potentialChoose") {
      if (!r.handmade && !A.DreamRawItem?.Handmake)
        throw new b(message("core.forge.forgeQuote.92addbc485"));
      if (o === "potentialChoose") {
        if (!r.potentialOptions?.[Number(a.Choice)])
          throw new b(message("core.forge.forgeQuote.6c861e241a"));
        ((w = String(a.Choice)), (g = message("forge.chooseDescription")));
      } else {
        if ((r.potentialOptions?.length || 0) >= 5)
          throw new b(message("core.forge.forgeQuote.fd4b3dca21"));
        const B = e.defs.get(c?.id || 0),
          I = Number(B?.DreamRawItem?.Hide || 0);
        if (!String(B?.DreamName).startsWith("\u6F5C\u80FD\u77F3"))
          throw new b(message("core.forge.forgeQuote.369f9d002e"));
        const q = A.Type === "Stone" && A.DreamType === 16 ? "Gem" : A.Type,
          K = Math.min(I, Number(A.DreamPotentialCap ?? A.DreamGrade)),
          X = Object.keys(i.potentials?.[q] || {})
            .map(Number)
            .filter((ae) => ae <= K);
        if (!X.length) throw new b(message("core.forge.forgeQuote.874ec5991e"));
        ((w = q + ":" + Math.max(...X)),
          l.push({
            item: c.id,
            count: 1,
          }),
          (g = message("forge.potentialDescription", {
            attempt: (r.potentialOptions?.length || 0) + 1,
          })));
      }
    } else if (o === "crystal") {
      if (String(A.DreamName).startsWith("\u5929\u9F99\u9879\u94FE"))
        throw new b(message("core.forge.forgeQuote.e612e0c45e"));
      const B = Number(e.defs.get(c?.id || 0)?.DreamRawItem?.Hide || 0);
      if (!String(e.defs.get(c?.id || 0)?.DreamName).startsWith("\u51DD\u6676\u77F3") || B < H)
        throw new b(message("core.forge.forgeQuote.6cdf3f0a25"));
      if (!i.fees.crystalByStoneGrade[String(B)] || H < 1)
        throw new b(message("core.forge.forgeQuote.555a0b953e"));
      if (R >= 8) throw new b(message("core.forge.forgeQuote.21ff3969ad"));
      ((u = i.fees.crystalByStoneGrade[String(B)] * (R + 1)),
        (k = (H >= 5 ? i.crystalRates.highGrade : i.crystalRates.normal)[R]),
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
        (u = i.fees.reset * Math.max(1, H - 6) * R),
        (g = message("forge.resetDescription", {
          points: R,
        })));
    } else {
      if (H < 2 || H > 6) throw new b(message("core.forge.forgeQuote.3d24a74942"));
      if (o === "dismantle") {
        assertEquipmentDisposable(r);
        for (const B of ["MaxDC", "MaxMC", "MaxSC"]) {
          const I = r.added[B] || 0;
          if (I > 0) {
            const q = i.essences.find((K) => K.grade === H - 1 && K.stat === B);
            if (!q) throw new b(message("core.forge.forgeQuote.0e4b96e457"));
            f.push({
              item: q.item,
              count: I,
            });
          }
        }
        if (!f.length) throw new b(message("core.forge.forgeQuote.95fd5267e7"));
        ((u = i.fees.dismantle * (H - 1) * f.reduce((B, I) => B + I.count, 0)),
          (g = message("forge.dismantleDescription")));
      } else if (o === "enhance") {
        const B = i.essences.find((I) => I.item === c?.id && I.grade >= H);
        if (!B)
          throw new b(
            message("core.forge.forgeQuote.5c90c49396", {
              p0: H,
            }),
          );
        if (R >= 5) throw new b(message("core.forge.forgeQuote.9d820f44c6"));
        ((w = B.stat),
          l.push({
            item: B.item,
            count: R < 3 ? 1 : R === 3 ? 2 : 3,
          }),
          (u = i.fees.enhance * H * (R + 1)),
          (g = message("forge.enhanceDescription", {
            from: R,
            to: R + 1,
            stat: message("gear.stat." + w.slice(3)),
          })));
      } else throw new b(message("core.forge.forgeQuote.eecbe4c7a3"));
    }
  }
  p &&
    !y &&
    l.some((A) => h.filter((H) => H.item === A.item).reduce((H, R) => H + R.count, 0) < A.count) &&
    (y = message("forge.insufficient"));
  const S = new Map();
  for (const A of l) S.set(A.item, (S.get(A.item) || 0) + A.count);
  const D = !y && [...S].every(([A, H]) => e.count(t, A) >= H) && t.gold >= u,
    C = h.map((A) => ({
      ...m.find((H) => H.uid === A.uid),
      count: A.count,
    })),
    O = p ? qa(t, p, C) : 0,
    E = p?.handmade
      ? Oa(
          e,
          {
            id: p.output.item,
          },
          C,
        )
      : void 0;
  return {
    mode: o,
    selected: x,
    allocations: h,
    outputQuality: O,
    outputStars: E,
    requirement: y,
    recipe: p,
    affixIndex: v,
    target: r?.uid,
    inputs: [...S].map(([A, H]) => ({
      item: A,
      count: H,
    })),
    outputs: f,
    gold: u,
    description: g,
    stat: w,
    chance: k,
    canForge: D,
    cubeMaterial: n,
    cubeSelection: s,
  };
}


function Is(e, t, a) {
  const i = Fa(e, t, a);
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
          m = h.find((g) => g?.uid === f.uid);
        ((m.count -= f.count), m.count || (h[h.indexOf(m)] = null));
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
        vi(l, e.defs.get(l.id), e.rng, e.rules.adaptations.dreamRuntime.affixes, Number(i.stat)),
      i.mode === "potential" && l)
    ) {
      const [f, h] = i.stat.split(":"),
        m = e.rules.adaptations.forge.potentials[f][h],
        g = structuredClone(m[e.rng.next(m.length)]);
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
      const f = c.sort((h, m) => forgePoints(m) - forgePoints(h) || h.uid - m.uid)[0];
      for (const h of i.selected) t.inventory[t.inventory.findIndex((m) => m?.uid === h)] = null;
      if (e.rng.next(100) < e.rules.adaptations.forge.mixChance) {
        const h = Math.min(8, forgePoints(f) + 1);
        (ut(e, f, h),
          delete f.affixes,
          delete f.potential,
          delete f.potentialOptions,
          delete f.weaponGrowth,
          (r = message("forge.mixSuccess")));
      } else r = message("forge.mixFailed");
      if (!e.give(t, f, !1)) throw new b(message("core.forge.forge.f4f8709c7f"));
    }
    if (i.mode === "crystal" && l) {
      const f = forgePoints(l),
        h = e.rules.adaptations.forge;
      let m = f;
      (e.rng.next(100) < i.chance
        ? ((m = f + 1), (r = message("forge.crystalSuccess")))
        : e.rng.next(100) < h.crystalLoseChance
          ? ((m = Math.max(0, f - 1)), (r = message("forge.crystalLost")))
          : (r = message("forge.crystalFailed")),
        ut(e, l, m));
    }
    (i.mode === "dismantle" &&
      (t.inventory[t.inventory.findIndex((f) => f?.uid === i.target)] = null),
      i.mode === "enhance" && l && (l.added[i.stat] = (l.added[i.stat] || 0) + 1),
      i.mode === "reset" && l && ut(e, l, forgePoints(l)));
    for (const f of i.outputs) {
      const h = e.newItem(f.item, f.count);
      if (((h.bound = i.mode === "recipe"), i.recipe)) {
        const m = i.recipe,
          g = qa(t, m, c);
        (g && (h.materialQuality = g),
          m.handmade &&
            ((h.handmade = !0),
            ut(e, h, Oa(e, h, c)),
            e.rules.adaptations.dreamRuntime &&
              Et(h, e.defs.get(h.id), e.rng, e.rules.adaptations.dreamRuntime)),
          m.skill && Ds(e, t, m.skill, m.experience || 1));
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
function ut(e, t, a) {
  const i = e.defs.get(t.id),
    n = Object.values(
      e.rules.adaptations.dreamRuntime.statPools[String(i.DreamType)]?.rawPool || {},
    );
  if (!n.length && a) throw new b(message("core.forge.randomizePoints.124368ca68"));
  for (const s of jt) delete t.added[s];
  for (let s = a; s > 0; ) {
    const o = jt[n[e.rng.next(n.length)]];
    if (!o) throw new b(message("core.forge.randomizePoints.8530d28df1"));
    const r = e.rng.next(s) + 1;
    ((t.added[o] = (t.added[o] || 0) + r), (s -= r));
  }
}
function Re(e) {
  const t = e?.worldFirework;
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
  return e.defaultMagicFind + Re(e).magicFindBonus + Math.max(0, t);
}
function Ea(e, t = 0) {
  const a = e?.casual;
  return (
    (a?.enabled ? a.baseDropMultiplier + a.dropAdd : 1) +
    (Re(e).dropBonusPercent + Math.max(0, t)) / 100
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
var Hs = ["MaxDC", "MaxMC", "MaxAC", "MaxSC", "MaxMAC", "Luck", "Accuracy", "Agility"];
function Ns(e, t, a, i, n = dreamMagicFind(i)) {
  if (
    (markNaturalAffixGeneration(e, n),
    !i.statPools[String(t.ExceptionalPoolType ?? t.DreamType)]?.rawPool ||
      a.next(100) >= dreamEquipmentExceptionalChance(i, effectiveAffixGrade(t), n))
  )
    return;
  let o = a.next(32768) % i.pointWeights.reduce((c, l) => c + l, 0),
    r = 0;
  for (; o >= i.pointWeights[r]; ) o -= i.pointWeights[r++];
  ja(e, t, a, i, r + 1);
}
function ja(e, t, a, i, n) {
  const s = i.statPools[String(t.ExceptionalPoolType ?? t.DreamType)]?.rawPool;
  if (!s) return;
  const o = Object.values(s);
  for (let r = 0; n > 0 && r < 100; r++) {
    const c = Hs[o[a.next(o.length)]],
      l = a.next(n + 1, 1);
    c && ((e.added[c] = (e.added[c] || 0) + l), (n -= l));
  }
}
function $a(e, t) {
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
function Ga(e, t, a, i, n = 0) {
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
function Ua(e, t) {
  const a = t.adaptations.chestItems?.chests[String(e.id)];
  if (!a || e.chestReward || e.count !== 1) return;
  const i = (Math.imul(e.uid | 0, 1664525) ^ Math.imul(e.id, 1013904223)) | 0,
    n = new wt(i),
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
function Bs(e, t, a) {
  const i = e.rules.adaptations.chestItems;
  if (!i) return !1;
  const n = (u) => {
      --u.count === 0 && (t.inventory[t.inventory.indexOf(u)] = null);
    },
    s = e.rules.adaptations.bossGold;
  if (a.id === i.gold.item || a.id === s?.item) {
    const u = a.id === s?.item ? s.amount : e.rng.next(i.gold.max + 1, i.gold.min);
    if (!Number.isSafeInteger(t.gold + u))
      throw new b(message("core.chest-items.useChestItem.1e0236aada"));
    return (
      (t.gold += u),
      n(a),
      e.say(
        message("core.chest-items.useChestItem.b7933d2f60", {
          p0: u,
        }),
      ),
      !0
    );
  }
  const o = Object.entries(i.chests).find(([u, w]) => Number(u) === a.id || w.key === a.id);
  if (!o) return !1;
  const [r, c] = o,
    l = a.id === Number(r) ? a : t.inventory.find((u) => u?.id === Number(r)),
    f = a.id === c.key ? a : t.inventory.find((u) => u?.id === c.key);
  if (!l) throw new b(message("core.chest-items.useChestItem.54352aa4d3"));
  if (!f) throw new b(message("core.chest-items.useChestItem.6518e82aa7"));
  initializeChest(e, l);
  const h = l.chestReward;
  if (!c.items[String(h.item)] || !Object.hasOwn(c.points, String(h.points)))
    throw new b(message("core.chest-items.useChestItem.0d4dcef593"));
  const m = e.newItem(h.item),
    g = e.defs.get(m.id);
  e.rules.adaptations.dreamRuntime &&
    (markAffixPointDistribution(m, c.points),
    ja(m, g, e.rng, e.rules.adaptations.dreamRuntime, h.points),
    Et(m, g, e.rng, e.rules.adaptations.dreamRuntime));
  const y = t.inventory.indexOf(l);
  return (
    (t.inventory[y] = m),
    n(f),
    e.emit("GainedItem", {
      Item: {
        ItemIndex: m.id,
        Count: 1,
      },
    }),
    e.say(
      message("core.chest-items.useChestItem.eb0583d042", {
        p0: entityText("items", g.Index),
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
function ye(e, t) {
  const a = e.equipment[3],
    i = [t.adaptations.testTalisman, t.adaptations.combatTestTalisman].find(
      (n) => n && n.itemId === a?.id,
    );
  return i && a?.id === i.itemId && (!a.maxDura || a.currentDura > 0) ? i : void 0;
}
function Ts(e, t) {
  const a = ye(e, t);
  if (!a) {
    e.special && delete e.special.testTalismanRegenAt;
    return;
  }
  for (const i of ["DC", "MC", "SC"])
    for (const n of ["Min", "Max"])
      e.stats[n + i] = Math.trunc((e.stats[n + i] || 0) * a.combatMultiplier);
  for (const i of ["HP", "MP"]) e.stats[i] = Math.trunc((e.stats[i] || 0) * a.vitalityMultiplier);
}
function qs(e, t, a) {
  const i = ye(e, t);
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


var Os = {
    SummonSpiritServant: -1,
    SummonSkeleton: 29,
    SummonShinsu: 14,
    AdvancedSummon: 62,
    SummonTiger: 99,
    SummonMoonSpirit: 144,
  },
  Fs = new Set(["Thrusting", "HalfMoon", "WhirlwindSlash", "FlamingSword", "BlazingSword"]);
function Va(e, t, a, i, n) {
  const s = a.Spell[0].toLowerCase() + a.Spell.slice(1),
    o = e.skill(t, a.Spell).s;
  if (n && ["FlamingSword", "BlazingSword"].includes(a.Spell)) {
    if (e.time < o.CastTime) throw new b(message("core.dream-magic.toggleDream.427a35f43e"));
    const r = Pe(a, i, t.stats);
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
function Es(e) {
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
function Ls(e, t, a, i) {
  const n = e.skill(t, a.Spell).s.Level,
    s = a.Spell === "SummonTiger" && n >= 4 ? n - 3 : Math.min(3, n),
    o = a.Spell === "SummonTiger" && n >= 4 ? 116 : Os[a.Spell],
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
    (w) => w.special?.dreamFamily === l && w.definition !== c.Index,
  ))
    ((u.dead = !0), (u.hp = 0), (u.expires = e.time));
  const h = pets(e, t).filter((u) => u.definition === c.Index),
    m = r ? spiritGrowth(e, t) : null,
    g = r
      ? m.progress.level
      : Math.min(
          7,
          s + Math.max(0, i - n) + (o === 116 ? 3 : 0) + (t.stats["PetLevel:" + a.Spell] || 0),
        ),
    y = r ? m.cfg.cap : Math.min(7, g + 2);
  for (const u of h)
    ((u.special.petLevel = Math.max(g, Number(u.special.petLevel || 0))),
      (u.special.maxPetLevel = y),
      m && (u.special.petXP = m.progress.xp),
      e.refreshActor(u));
  for (const u of h.slice(f)) ((u.dead = !0), (u.hp = 0), (u.expires = e.time));
  e.bringPets(t);
  for (let u = Math.min(h.length, f); u < f; u++) {
    const w = e.freeNear(t.map, t, 3);
    if (!w) break;
    const x = e.newMonster(c, t.map, w);
    ((x.friendly = !0),
      (x.master = t.id),
      (x.special = {
        ...x.special,
        dreamPet: !0,
        dreamFamily: l,
        petLevel: g,
        maxPetLevel: y,
        ...(m
          ? {
              petXP: m.progress.xp,
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
function Ws(e, t, a, i) {
  const n = e.skill(t, a.Spell),
    s = n.level,
    o = a.DreamSkill,
    r = a.Spell;
  if (o.passive) {
    e.say(message("core.dream-magic.castDream.2c29d4452a"));
    return;
  }
  if (Fs.has(r)) {
    Va(e, t, a, s, !0);
    return;
  }
  if (e.time < Math.max(t.spellAt, t.actionAt, n.s.CastTime)) return;
  const c = Pe(a, s, t.stats);
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
  if (P(t, h) > a.Range) throw new b(message("core.dream-magic.castDream.8ec455055d"));
  const m = () => {
      if (!l || l.dead || l.friendly || l.kind !== "monster" || !targetableMonster(l))
        throw new b(message("core.dream-magic.castDream.ac7b618ae7"));
      return l;
    },
    g = (p = "MC") => magicDamage(a, s, F(e, t, p), e.rng),
    y = (p, v, k = 500, S = "MAC") => {
      const D = e.schedule("hit", k, t, p, v, S, r);
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
    u = (p, v, k, S = 500, D = "MAC") => {
      for (const C of enemies(e, t).filter((O) => P(O, p) <= v)) y(C, k, S, D);
    };
  let w;
  switch (r) {
    case "FireBall":
    case "GreatFireBall":
    case "ThunderBolt":
    case "SoulFireBall":
    case "FlameDisruptor":
    case "FrostCrunch": {
      const p = m();
      w = () => y(p, g(r === "SoulFireBall" ? "SC" : "MC"));
      break;
    }
    case "FireBang":
    case "IceStorm":
    case "IceFlame":
      w = () => u(h, 1, g());
      break;
    case "ChainThunder": {
      const p = m();
      w = () => {
        const v = [p];
        for (; v.length < Math.max(2, s + 1); ) {
          const k = v[v.length - 1],
            S = enemies(e, t)
              .filter((D) => !v.includes(D) && P(D, k) <= Math.min(4, n.s.Level + 1))
              .sort((D, C) => P(D, k) - P(C, k) || D.id - C.id)[0];
          if (!S) break;
          v.push(S);
        }
        for (const [k, S] of v.entries())
          y(S, Math.trunc(g() * Math.max(0.25, 0.8 ** k)), 900 + k * 300);
        e.emit("SpellChain", {
          Spell: r,
          Segments: v.map((k, S) => ({
            From: {
              x: (S ? v[S - 1] : t).x,
              y: (S ? v[S - 1] : t).y,
            },
            To: {
              x: k.x,
              y: k.y,
            },
            Delay: S * 300,
          })),
        });
      };
      break;
    }
    case "ThunderStorm":
      w = () => {
        for (const p of enemies(e, t).filter((v) => P(v, t) <= 2))
          y(p, Math.floor(g() / (P(p, t) > 1 ? 2 : 1)));
      };
      break;
    case "MeteorStrike":
      w = () => {
        for (const p of enemies(e, t).filter((v) => P(v, h) <= 1))
          for (let v = 0; v < 3; v++) {
            const k = y(p, g(), 2500 + v * 700);
            delete k.location;
          }
      };
      break;
    case "FireWall":
    case "PoisonCloud":
    case "DragonFlame":
      w = () => {
        const p = r === "PoisonCloud",
          v = r === "FireWall",
          k = v
            ? Math.min(
                (F(e, t, "MC") + 3 * s) * 500,
                [0, 8e3, 12e3, 15e3, 18e3, 21e3, 24e3][s] ?? 25e3,
              )
            : p
              ? 3e3 + F(e, t, "SC") * 100
              : 3e3,
          S = e.schedule("magic", v ? 0 : p ? 800 : 300, t, t, 0, "None", r);
        ((S.durationMs = k),
          (S.level = s),
          (S.location = {
            x: h.x,
            y: h.y,
          }));
      };
      break;
    case "Healing": {
      const p = l && !l.dead && (l.id === t.id || l.master === t.id) ? l : t;
      w = () => e.schedule("heal", 500, t, p, g("SC"), "None", r);
      break;
    }
    case "MassHealing":
      w = () => {
        for (const p of [t, ...pets(e, t)].filter((v) => v.map === t.map && P(v, h) <= 1))
          e.schedule("heal", 500, t, p, g("SC"), "None", r);
      };
      break;
    case "Poisoning": {
      const p = m();
      w = () => {
        const v = (20 + s * 7 + F(e, t, "SC") * 2) * 1e3,
          k = e.buff(p, "Green", v, poisoningDamage(s, t.stats), {}, t.id, r);
        (k && (k.interval = 1e3),
          e.buff(p, "DreamPoisonArmour", v, Math.min(100, 4 * s), {}, t.id, r));
      };
      break;
    }
    case "GhostBurn": {
      const p = m();
      w = () =>
        e.buff(
          p,
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
      w = () => e.buff(t, "Hiding", (8 * s + F(e, t, "SC")) * 500 + 500);
      break;
    case "BlessedArmour":
      w = () => {
        const p = F(e, t, "SC"),
          v = p < 70 ? p * 8e3 : p * 3e3 + 35e4;
        for (const k of [t, ...pets(e, t)].filter((S) => S.map === t.map && P(S, h) <= 1)) {
          const S = k.id === t.id ? 2 * s * (1 + Math.trunc((t.level - 1) / 10)) : 2 * s;
          e.buff(
            k,
            "BlessedArmour",
            v,
            0,
            {
              MinAC: S,
              MaxAC: S,
              MinMAC: S,
              MaxMAC: S,
            },
            t.id,
            r,
          );
        }
      };
      break;
    case "MagicShield":
      w = () => e.buff(t, "MagicShield", (5 + F(e, t, "MC")) * 1e3, s, {}, t.id, r);
      break;
    case "BloodDragon":
      w = () =>
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
      const p = Math.min(6, s),
        v = Math.min(3, p);
      w = () =>
        e.buff(
          t,
          r,
          F(e, t, "DC") * 400 + s * 5e3,
          p,
          {
            MinAC: v * 8,
            MaxAC: v * 8,
            MinMAC: v * 8,
            MaxMAC: v * 8,
            NoFlinchPercent: 7 * v,
            HPRatePercent: [0, 0, 0, 0, 20, 40, 70][p],
            PotionHealingPercent: [0, 0, 0, 0, 10, 15, 20][p],
          },
          t.id,
          r,
        );
      break;
    }
    case "Abyss": {
      const p = Math.min(6, s);
      w = () =>
        e.buff(
          t,
          r,
          (s + 5) * 3e3,
          p,
          {
            DreamMagicDamagePercent: 3 + p,
            ManaPenaltyPercent: [0, 6, 7, 8, 9, 10, 12][p],
            DreamCritPercent: p >= 4 ? [10, 15, 25][p - 4] : 0,
          },
          t.id,
          r,
        );
      break;
    }
    case "InnateQi":
      w = () =>
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
      const p = pets(e, t).find(
        (v) =>
          e.monsters.get(v.definition)?.DreamOriginalId === 62 && !v.special?.nativeBeastArmourRank,
      );
      if (!p) throw new b(message("core.dream-magic.castDream.019bf7dc80"));
      w = () => {
        ((p.special ??= {}),
          (p.special.nativeBeastArmourRank = s),
          (p.art = e.rules.monsters.find((v) => v.DreamOriginalId === 82)?.Image || p.art),
          (p.name = "\u5723\u517D"),
          e.refreshActor(p),
          e.emit("ObjectShow", {
            ObjectID: p.id,
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
      w = () => Ls(e, t, a, s);
      break;
    case "LionRoar":
      w = () => {
        for (const p of enemies(e, t).filter(
          (v) => P(v, t) <= Math.min(4, s + 1) && e.monsters.get(v.definition).Level <= t.level - 2,
        ))
          e.buff(p, "LRParalysis", s * 2e3, 0, {}, t.id, r);
      };
      break;
    case "FlashSlash":
      w = () => {
        const p = direction(t, h),
          [v, k] = Q[p],
          S = e.geometry.get(t.map);
        t.dir = p;
        for (let D = 0; D < s + 1; D++) {
          const C = t.x + v,
            O = t.y + k;
          if (
            C < 0 ||
            O < 0 ||
            C >= S.width ||
            O >= S.height ||
            S.solid[O * S.width + C] ||
            e
              .map(t.map)
              .actors.some(
                (E) => !E.dead && (E.kind === "npc" || E.friendly) && E.x === C && E.y === O,
              )
          )
            break;
          ((t.x = C), (t.y = O));
          for (const E of enemies(e, t).filter((A) => A.x === C && A.y === O))
            y(E, Math.trunc(F(e, t, "DC") * (s + 4) * 0.5), 500, "AC");
        }
      };
      break;
    case "ElectricShock": {
      const p = m(),
        v = e.monsters.get(p.definition),
        k = Es(v);
      if (k === null || p.special?.elite || p.special?.nativeAffixType)
        throw new b(message("core.dream-magic.castDream.2a0a3eb47b"));
      if (k > t.level)
        throw new b(
          message("core.dream-magic.castDream.8e84096164", {
            p0: k,
          }),
        );
      if (t.level - v.Level < 3) throw new b(message("core.dream-magic.castDream.fcd380a876"));
      if (pets(e, t).length >= (s === 1 ? 1 : 3))
        throw new b(message("core.dream-magic.castDream.b245cda302"));
      w = () => {
        const S = Math.max(1, Math.trunc((70 - F(e, t, "MC")) / 10));
        if (e.rng.next(S) !== 0) {
          e.say(message("core.dream-magic.castDream.0b855f3c9e"));
          return;
        }
        (p.spawn !== void 0 &&
          ((e.map(p.map).respawns[p.spawn] =
            e.time + e.region(p.map).spawns[p.spawn].respawnMinutes * 6e4),
          (p.spawn = void 0)),
          (p.friendly = !0),
          (p.master = t.id),
          (p.target = 0),
          (p.buffs = []),
          (p.special = {
            ...p.special,
            dreamPet: !0,
            dreamTamed: !0,
            petLevel: 0,
            maxPetLevel: 3,
            tameUntil: 0,
          }),
          e.refreshActor(p),
          e.say(
            message("core.dream-magic.castDream.76b2142e79", {
              p0: entityText("monsters", p.definition),
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
  (w(),
    (t.mp -= c),
    (n.s.CastTime = e.time + o.cooldown),
    (t.spellAt = e.time + x),
    (t.actionAt = e.time + Math.min(600, x)),
    e.emit("Magic", {
      ObjectID: t.id,
      Spell: r,
      Cast: !0,
      Direction: L[t.dir],
      Target: {
        x: h.x,
        y: h.y,
      },
      TargetID: l?.id || 0,
    }));
}


function js(e, t, a, i) {
  if (i.spell === "FireWall" || i.spell === "PoisonCloud" || i.spell === "DragonFlame") {
    Da(e, t, i);
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
    a.special?.nativeAffixType !== 10009 &&
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
var $s = new Set([
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
  Ka = new Set([
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
function $t(e, t, a, i) {
  if (i && mountedItem(e, t)) throw new b(message("core.magic.toggleMagic.5c12d1da76"));
  const n = e.skill(t, a);
  if (!n) throw new b(message("core.magic.toggleMagic.446bba28f3"));
  if (n.d.DreamSkill) {
    Va(e, t, n.d, n.level, i);
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
function Gs(e, t, a) {
  const i = e.skill(t, "CounterAttack");
  if (!i || !t.attackModes.counterAttack || e.time >= i.s.CastTime) return;
  let n = G(t.stats, "DC", e.rng);
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
      Direction: L[t.dir],
      Target: a,
      TargetID: a.id,
    }),
    e.levelSkill(t, i.s));
}
function Gt(e, t, a, i, n) {
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
  const [s, o] = Q[i];
  let r = 0;
  for (; r < n && e.walkable(a.map, a.x + s, a.y + o, a.id); ) ((a.x += s), (a.y += o), r++);
  return (
    r &&
      ((a.dir = (i + 4) % 8),
      (a.actionAt = e.time + 300 * r),
      (a.moveAt = e.time + 500 * r),
      e.emit("ObjectPushed", {
        ObjectID: a.id,
        Direction: L[a.dir],
        Location: {
          X: a.x,
          Y: a.y,
        },
      })),
    r
  );
}
function Xa(e, t, a, i) {
  if (e.skill(t, i.spell || "")?.d.DreamSkill) {
    js(e, t, a, i);
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
        const m = o.center[0] + e.rng.next(c, -c),
          g = o.center[1] + e.rng.next(l, -l);
        if (e.walkable(o.id, m, g, t.id)) {
          ((t.map = o.id), (t.x = m), (t.y = g), e.initializeMap(t.map), e.bringPets(t), (f = !0));
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
      Da(e, t, i);
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
        (e.buff(a, "Paralysis", pe((n + 1) * 0.8) * 1e3), !Gt(e, t, a, o, l))
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


function Qs(e, t, a) {
  if (mountedItem(e, t)) throw new b(message("core.magic.castMagic.5c12d1da76"));
  const i = String(a.Spell),
    n = e.skill(t, i);
  if (!n) throw new b(message("core.magic.castMagic.446bba28f3"));
  if (n.d.DreamSkill) {
    Ws(e, t, n.d, a);
    return;
  }
  if (e.rules.adaptations.disabledSpells[i]) throw Error(e.rules.adaptations.disabledSpells[i]);
  if (!$s.has(i)) throw new b(message("core.magic.castMagic.fe001409a7"));
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
  if (s.Range && P(t, l ?? f) > s.Range) throw new b(message("core.magic.castMagic.8ec455055d"));
  const h = () => e.map(t.map).actors.filter((p) => p.kind === "monster" && !p.dead && !p.friendly),
    m = () => {
      if (!l || l.dead || l.map !== t.map || l.friendly || l.kind !== "monster")
        throw new b(message("core.magic.castMagic.ac7b618ae7"));
      return l;
    },
    g = (p, v) => {
      const k = [...t.equipment, ...t.inventory].find(
        (S) =>
          S &&
          e.defs.get(S.id)?.Type === "Amulet" &&
          e.defs.get(S.id)?.DreamType !== 17 &&
          e.defs.get(S.id)?.Shape === p &&
          S.count >= v,
      );
      if (!k)
        throw new b(
          message(p === 0 ? "core.magic.castMagic.e588610336" : "core.magic.castMagic.63a4d58a68"),
        );
      return () => {
        k.count -= v;
        for (const S of [t.equipment, t.inventory])
          for (let D = 0; D < S.length; D++) S[D] === k && !k.count && (S[D] = null);
      };
    };
  let y;
  const u = (p) => magicDamage(s, r, G(t.stats, p, e.rng), e.rng);
  switch (i) {
    case "Mirroring":
      y = () => {
        (e.map(t.map).actors.some((p) => p.ai === 55 && p.master === t.id && !p.dead) ||
          e.levelSkill(t, o),
          e.schedule("magic", 500, t, t, 0, "None", i));
      };
      break;
    case "ElectricShock": {
      const p = m();
      y = () => {
        const v = e.schedule("magic", 500, t, p, 0, "None", i);
        v.level = r;
      };
      break;
    }
    case "CounterAttack":
      $t(e, t, i, !0);
      return;
    case "ShoulderDash":
      y = () => {
        const p = L.indexOf(a.Direction) >= 0 ? L.indexOf(a.Direction) : t.dir,
          [v, k] = Q[p],
          S = e.rng.next(2) + r + 2;
        let D,
          C = 0;
        for (let O = 0; O < S; O++) {
          const E = {
            ...t,
            x: t.x + v,
            y: t.y + k,
          };
          if (
            e.safe(E) ||
            (O === 0 &&
              (D = h().find(
                (A) => A.x === E.x && A.y === E.y && e.monsters.get(A.definition).Level < t.level,
              )),
            D && !Gt(e, t, D, p, 1)) ||
            !e.walkable(t.map, E.x, E.y, t.id)
          )
            break;
          ((t.x = E.x),
            (t.y = E.y),
            (t.dir = p),
            C++,
            e.emit("ObjectDash", {
              ObjectID: t.id,
              Direction: L[p],
              Location: {
                X: t.x,
                Y: t.y,
              },
            }));
        }
        (C && e.levelSkill(t, o),
          C && D && e.damage(t, D, magicDamage(s, r, 0, e.rng), "None", i),
          C || e.say(message("core.magic.castMagic.4033afec75")));
      };
      break;
    case "Blizzard":
    case "MeteorStrike":
    case "PoisonCloud":
    case "HealingCircle": {
      const p = l ?? f,
        v = i === "PoisonCloud" ? g(0, 5) : () => {},
        k = i === "PoisonCloud" ? g(1, 5) : () => {};
      y = () => {
        (v(), k());
        const S = e.schedule(
          "magic",
          i === "HealingCircle" ? 1700 : i === "PoisonCloud" ? 500 + P(t, p) * 50 : 500,
          t,
          t,
          u(["PoisonCloud", "HealingCircle"].includes(i) ? "SC" : "MC"),
          "None",
          i,
        );
        ((S.location = {
          x: p.x,
          y: p.y,
        }),
          (S.level = r),
          i === "PoisonCloud" &&
            (S.effect = {
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
      const p = l ?? f,
        v = g(0, 1);
      if (
        i === "TrapHexagon" &&
        !h().some((D) => P(D, p) <= 1 && e.monsters.get(D.definition).Level <= t.level + 2)
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
        S = k ? g(e.defs.get(k.id).Shape, 1) : () => {};
      y = () => {
        if ((v(), S(), i === "Curse" && e.rng.next(10 - (r + 1) * 2) > 2)) return;
        const D = e.schedule(
          "magic",
          i === "TrapHexagon" ? 500 : 500 + P(t, p) * 50,
          t,
          t,
          i === "TrapHexagon" ? (r * 5 + 10) * 1e3 : u("SC"),
          "None",
          i,
        );
        ((D.location = {
          x: p.x,
          y: p.y,
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
      const p = m(),
        v = g(0, 1);
      y = () => {
        v();
        const k = e.schedule("magic", 500 + P(t, p) * 50, t, p, 0, "None", i);
        k.level = r;
      };
      break;
    }
    case "FireBall":
    case "GreatFireBall":
    case "ThunderBolt":
    case "SoulFireBall": {
      const p = m();
      y = () => {
        let v = u(i === "SoulFireBall" ? "SC" : "MC");
        i === "ThunderBolt" && e.monsters.get(p.definition)?.Undead && (v = Math.trunc(v * 1.5));
        const k = e.schedule(
          "hit",
          i === "ThunderBolt" ? 500 : P(t, p) * 50 + 500,
          t,
          p,
          v,
          "MAC",
          i,
        );
        k.location = {
          x: p.x,
          y: p.y,
        };
      };
      break;
    }
    case "FlameDisruptor":
    case "FrostCrunch":
    case "Vampirism": {
      const p = m();
      y = () => {
        let v = u("MC");
        i === "FlameDisruptor" &&
          !e.monsters.get(p.definition)?.Undead &&
          (v = Math.trunc(v * 1.5));
        const k = e.schedule(
          "hit",
          i === "FrostCrunch" ? 500 + P(t, p) * 50 : 500,
          t,
          p,
          v,
          "MAC",
          i,
        );
        ((k.level = r),
          i !== "Vampirism" &&
            (k.location = {
              x: p.x,
              y: p.y,
            }));
      };
      break;
    }
    case "TurnUndead": {
      const p = m(),
        v = e.monsters.get(p.definition);
      if (!v.Undead) throw new b(message("core.magic.castMagic.4c5437b4ae"));
      y = () => {
        e.rng.next(2) + t.level - 1 <= v.Level ||
        e.rng.next(100) >= ((r + 1) << 3) + t.level - v.Level + 15
          ? (p.target = t.id)
          : e.schedule("kill", 500, t, p, 0, "None", i);
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
        let p = !1;
        for (const v of h().filter((k) => P(k, t) <= 1)) {
          const k = e.monsters.get(v.definition).Level;
          k >= t.level ||
            e.rng.next(20) >= 6 + r * 3 + t.level - k ||
            (p = Gt(e, t, v, direction(t, v), 1 + Math.max(0, r - 1) + e.rng.next(2)) > 0 || p);
        }
        p && e.levelSkill(t, o);
      };
      break;
    case "LionRoar":
      y = () => {
        const p = e.schedule("magic", 500, t, t, 0, "None", i);
        ((p.level = r),
          (p.location = {
            x: t.x,
            y: t.y,
          }));
      };
      break;
    case "Entrapment": {
      const p = m();
      y = () => {
        const v = e.schedule("magic", 500, t, p, 0, "None", i);
        v.level = r;
      };
      break;
    }
    case "Revelation": {
      if (!l || l.dead || !["monster", "player"].includes(l.kind))
        throw new b(message("core.magic.castMagic.3337a45d3e"));
      const p = l;
      y = () => {
        const v = e.schedule(
          "magic",
          500,
          t,
          p,
          G(t.stats, "SC", e.rng) + magicPower(s, r, e.rng),
          "None",
          i,
        );
        v.level = r;
      };
      break;
    }
    case "PetEnhancer": {
      if (!l || l.dead || !l.friendly || l.kind !== "monster")
        throw new b(message("core.magic.castMagic.b8a1fd496b"));
      const p = l,
        v = e.monsters.get(p.definition).Level;
      y = () =>
        e.deferBuff(t, p, i, (G(t.stats, "SC", e.rng) + magicPower(s, r, e.rng)) * 1e3, 0, {
          MinDC: 2 + v * 2,
          MaxDC: 2 + v * 2,
          MinAC: 4 + v,
          MaxAC: 4 + v,
        });
      break;
    }
    case "UltimateEnhancer": {
      const p = l && !l.dead && (l.friendly || l.id === t.id) ? l : t,
        v = g(0, 1);
      y = () => {
        v();
        const k =
          p.kind !== "player" || p.job === "Warrior"
            ? "MaxDC"
            : p.job === "Wizard"
              ? "MaxMC"
              : "MaxSC";
        e.buff(p, i, (G(t.stats, "SC", e.rng) * 4 + (r + 1) * 50) * 1e3, 0, {
          [k]: (t.stats.MaxSC || 0) >= 5 ? Math.min(8, Math.trunc(t.stats.MaxSC / 5)) : 1,
        });
      };
      break;
    }
    case "EnergyShield":
      y = () => {
        const p = Math.max(2, 10 - (Math.trunc((t.stats.Luck || 0) / 3) + r + 1)),
          v = pe((G(t.stats, "SC", e.rng) / 4) * (r + 1) + s.PowerBase);
        e.buff(t, i, (30 + 50 * r) * 1e3, 0, {
          EnergyShieldPercent: pe(100 / p),
          EnergyShieldHPGain: v,
        });
      };
      break;
    case "BladeAvalanche":
      y = () => {
        let p = G(t.stats, "DC", e.rng);
        e.rng.next(100) <= 1 + (t.stats.Luck || 0) && (p *= 2);
        const v = magicDamage(s, r, p, e.rng),
          k = L.indexOf(a.Direction) >= 0 ? L.indexOf(a.Direction) : t.dir;
        for (const S of [-1, 0, 1]) {
          const D = Q[(k + S + 8) % 8],
            C = Q[k];
          for (let O = 0; O < 3; O++)
            for (const E of h().filter(
              (A) => A.x === t.x + D[0] + C[0] * O && A.y === t.y + D[1] + C[1] * O,
            ))
              e.damage(t, E, O <= 1 ? v : Math.trunc(v * 0.6), "MAC", i);
        }
      };
      break;
    case "Healing": {
      const p = l && !l.dead && (l.id === t.id || l.friendly) ? l : t;
      ((l = p),
        (y = () =>
          e.schedule(
            "heal",
            500,
            t,
            p,
            magicDamage(s, r, G(t.stats, "SC", e.rng) * 2, e.rng) + t.level,
            "None",
            i,
          )));
      break;
    }
    case "MagicShield":
      y = () => {
        if (t.buffs.some((v) => v.type === "MagicShield")) return;
        const p = pe(
          ((G(t.stats, "MC", e.rng) + 15) / 4) * (r + 1) +
            (s.PowerBonus > 0 ? e.rng.next(s.PowerBase + s.PowerBonus, s.PowerBase) : s.PowerBase),
        );
        e.deferBuff(t, t, i, p * 1e3, r);
      };
      break;
    case "ProtectionField":
      y = () => {
        const p = pe((t.stats.MaxAC || 0) * (0.2 + 0.03 * r));
        e.buff(t, i, (45 + 15 * r) * 1e3, 0, {
          MinAC: p,
          MaxAC: p,
        });
      };
      break;
    case "Rage":
      y = () => {
        const p = pe((t.stats.MaxDC || 0) * (0.12 + 0.03 * r));
        e.buff(t, i, (18 + 6 * r) * 1e3, 0, {
          MinDC: p,
          MaxDC: p,
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
      const p = l && (l.id === t.id || l.friendly) ? l : t;
      y = () => {
        const v = e.schedule("magic", 500, t, p, 0, "None", i);
        v.level = r;
      };
      break;
    }
    case "Hiding": {
      const p = g(0, 1);
      y = () => {
        (p(), e.deferBuff(t, t, "Hiding", (G(t.stats, "SC", e.rng) + (r + 1) * 5) * 1e3));
      };
      break;
    }
    case "Poisoning": {
      const p = m(),
        v = [...t.equipment, ...t.inventory].find(
          (S) =>
            S &&
            e.defs.get(S.id)?.Type === "Amulet" &&
            e.defs.get(S.id)?.DreamType !== 17 &&
            [1, 2].includes(e.defs.get(S.id).Shape),
        ),
        k = v ? e.defs.get(v.id).Shape : 1;
      y = () => {
        const S = u("SC");
        e.deferBuff(
          t,
          p,
          k === 1 ? "Green" : "Red",
          (S * 2 + (r + 1) * 7) * 2e3,
          Math.trunc(S / 15) + r + 1 + e.rng.next(t.stats.PoisonAttack || 0),
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
      const p =
          e.rules.monsterSettings[
            i === "SummonSkeleton"
              ? "SkeletonName"
              : i === "SummonShinsu"
                ? "ShinsuName"
                : "AngelName"
          ],
        v = Object.values(e.maps)
          .flatMap((S) => S.actors)
          .find((S) => S.master === t.id && S.name === p && !S.dead),
        k = v ? () => {} : g(0, i === "SummonSkeleton" ? 1 : i === "SummonShinsu" ? 5 : 2);
      if (
        !v &&
        Object.values(e.maps)
          .flatMap((S) => S.actors)
          .filter((S) => S.friendly && S.master === t.id && !S.dead).length >= 2
      )
        throw new b(message("core.magic.castMagic.23fe292b10"));
      y = () => {
        (v || e.levelSkill(t, o), k());
        const S = e.schedule(
          "magic",
          !v && i === "SummonHolyDeva" ? 1500 : 500,
          t,
          t,
          0,
          "None",
          i,
        );
        S.level = r;
      };
      break;
    }
    case "FireBang":
    case "IceStorm": {
      const p = l ?? f;
      y = () => {
        const v = u("MC");
        for (const k of h().filter((S) => P(S, p) <= 1)) e.schedule("hit", 500, t, k, v, "MAC", i);
      };
      break;
    }
    case "HellFire":
    case "Lightning": {
      y = () => {
        const p = u("MC"),
          v = i === "HellFire" ? 4 : 8,
          k = Number.isInteger(L.indexOf(a.Direction)) ? L.indexOf(a.Direction) : t.dir;
        for (const S of h()) {
          const D = (direction(t, S) - k + 8) % 8;
          P(t, S) <= v &&
            (D === 0 || (i === "HellFire" && r === 3 && [1, 7].includes(D))) &&
            e.schedule("hit", 500, t, S, p, "MAC", i);
        }
      };
      break;
    }
    case "ThunderStorm":
    case "FlameField": {
      y = () => {
        const p = u("MC");
        for (const v of h().filter((k) => P(k, t) <= 2))
          e.schedule(
            "hit",
            500,
            t,
            v,
            i === "ThunderStorm" && !e.monsters.get(v.definition)?.Undead ? Math.trunc(p / 10) : p,
            "MAC",
            i,
          );
      };
      break;
    }
    case "SoulShield":
    case "BlessedArmour": {
      const p = g(0, 1),
        v = l ?? f;
      y = () => {
        p();
        const k = G(t.stats, "SC", e.rng) * 4 + (r + 1) * 50;
        for (const S of [t, ...e.map(t.map).actors.filter((D) => D.friendly && !D.dead)].filter(
          (D) => P(D, v) <= 3,
        )) {
          const D = S.kind === "player" ? S.level : e.monsters.get(S.definition).Level;
          e.deferBuff(
            t,
            S,
            i,
            k * 1e3,
            0,
            {
              [i === "SoulShield" ? "MaxMAC" : "MaxAC"]: Math.trunc(D / 7) + 4,
            },
            P(t, v) * 50 + 500,
          );
        }
      };
      break;
    }
    case "MassHealing": {
      const p = l ?? f;
      y = () => {
        const v = u("SC");
        for (const k of [t, ...e.map(t.map).actors.filter((S) => S.friendly && !S.dead)].filter(
          (S) => P(S, p) <= 1,
        ))
          e.schedule("heal", 500, t, k, v, "None", i);
      };
      break;
    }
    case "MassHiding": {
      g(0, 1);
      const p = l ?? f;
      y = () => {
        const v = Math.trunc(G(t.stats, "SC", e.rng) / 2) + (r + 1) * 2;
        for (const k of [t, ...e.map(t.map).actors.filter((S) => S.friendly && !S.dead)].filter(
          (S) => P(S, p) <= 1,
        ))
          e.deferBuff(t, k, "Hiding", v * 1e3, 0, {}, P(t, p) * 50 + 500);
      };
      break;
    }
    case "Blink":
      if (!e.walkable(t.map, f.x, f.y, t.id))
        throw new b(message("core.magic.castMagic.758eaa2d29"));
      y = () => {
        const p = e.schedule("magic", 200, t, t, 0, "None", i);
        ((p.level = r),
          (p.location = {
            ...f,
          }));
      };
      break;
    case "Teleport":
      if (!e.geometry.has(e.rules.world.maps.find((p) => p.start).id))
        throw new b(message("core.magic.castMagic.be0f3f005d"));
      y = () => {
        const p = e.schedule("magic", 200, t, t, 0, "None", i);
        p.level = r;
      };
      break;
    case "FireWall": {
      const p = l ?? f;
      y = () => {
        const v = e.schedule("magic", 500, t, t, u("MC"), "None", i);
        ((v.level = r),
          (v.location = {
            x: p.x,
            y: p.y,
          }));
      };
      break;
    }
    default:
      throw new b(message("core.magic.castMagic.26a8666f16"));
  }
  const w = e.nextOrder;
  if ((y(), Ka.has(i))) for (const p of e.events.filter((v) => v.order >= w)) p.trainSpell = i;
  ((t.mp -= c),
    (t.actionAt = e.time + 600),
    (t.attackAt = e.time + 600),
    (t.spellAt = e.time + (i === "FlameField" ? 2500 : 1800)),
    (t.regenAt = e.time + 1e4),
    (o.CastTime = e.time + s.DelayBase - r * s.DelayReduction));
  const x = L.indexOf(a.Direction);
  (x >= 0 && (t.dir = x),
    !Ka.has(i) &&
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
      Direction: L[t.dir],
      Target: l ?? f,
      TargetID: l?.id || 0,
    }));
}


var Qt = {
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
  Ja = {
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
    ...Qt,
  };
function gemTier(e) {
  return e.added.GemTier === 2 ? 2 : e.added.GemTier === 1 ? 1 : 0;
}
function Us(e, t, a, i, n) {
  if (!i.itemIds.includes(t.Index)) return;
  const s = i.bossProfiles.find((m) => m.monsters.includes(n?.Name || "")),
    o = s?.tierWeights || i.tierWeights;
  let r = a.next(o.reduce((m, g) => m + g, 0)),
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
    f = i.highEffects.filter((m) => !l || !m.jobs || m.jobs.includes(l)),
    h = [i.rareEffects, ...(c === 2 ? [f] : [])];
  for (const [m, g] of h.entries()) {
    const y = g[a.next(g.length)],
      u = m === 0 ? s?.rareBonus || 0 : s?.highBonus || 0;
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
    Object.keys(Qt)
      .filter((t) => (e.added[t] || 0) > 0)
      .map((t) => [t, e.added[t]]),
  );
}
function Xs(e, t) {
  const a = Object.keys(Ja)
      .filter((n) => !(n in Qt))
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
function _a(e, t) {
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
            stat: Ja[e] || e,
            value: e === "Durability" ? t / 1e3 : t,
            unit: e.endsWith("Percent") ? "%" : "",
          });
}
function Js(e, t) {
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
var _s = {
  GemFireDamagePercent: [
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
function Ys(e, t, a, i, n) {
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
      ? Object.entries(_s).reduce((c, [l, f]) => c + ((f.includes(n || "") && s.stats[l]) || 0), 0)
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
function eo(e, t, a) {
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
function to(e, t, a, i) {
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
var Ya = {
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
function Za(e, t, a, i) {
  const n = e.defs.get(a.id),
    s = e.defs.get(i.id);
  if (n.Type !== "Gem" || !Ya[s.Type] || a.uid === i.uid)
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
      .includes(Ya[s.Type])
  )
    throw new b(message("core.upgrades.upgradeQuote.104fee785f"));
  const { stat: o, gain: r } = Xs(n, a),
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
    m = h >= l.baseChance ? 0 : l.baseChance - h + (t.stats.GemRatePercent || 0);
  if (m <= 0) throw new b(message("core.upgrades.upgradeQuote.209cd4bc08"));
  return {
    chance: Math.max(0, Math.min(100, m)),
    repair: !1,
    stat: o,
    gain: r,
    effects: c,
    details: [_a(o, r), ...Object.entries(c).map(([g, y]) => _a(g, y))],
    destructive: !1,
  };
}
function ao(e, t, a, i) {
  const n = t.inventory.findIndex((f) => f?.uid === a),
    s = t.inventory.findIndex((f) => f?.uid === i),
    o = t.inventory[n],
    r = t.inventory[s];
  if (!o || !r) throw new b(message("core.upgrades.combineItem.f0ed4a2f42"));
  const c = Za(e, t, o, r),
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
var ei = {};
for (const [e, t] of [
  [2, "Mundane NokChi TaoProtect Whisker1 Whisker2 Whisker3 Whisker4 Whisker5"],
  [3, "RedOrchid RedFlower Smash HwanDevil Purity FiveString Bone Bug DarkGhost"],
  [4, "Recall"],
  [
    5,
    "Spirit WhiteGold WhiteGoldH RedJade RedJadeH Nephrite NephriteH Hyeolryong Monitor Oppressive Paeok Sulgwan BlueFrostH BlueFrost",
  ],
])
  for (const a of t.split(" ")) ei[a] = e;


var io = {
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
function no(e, t) {
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
      (o.complete = o.types.size >= (ei[s] || 0)));
  }
  return a;
}
function so(e, t, a) {
  const i = (r) => {
      for (const [c, l] of Object.entries(r)) e[c] = (e[c] || 0) + l;
    },
    n = new Set();
  for (const r of no(t, a))
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
        i(io[r.name] || {})));
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
function oo(e, t) {
  isLegacyBag(e, t) && e.inventory.splice(46, 0, null, null);
}
function ai(e, t) {
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
            const h = t.world.npcs.find((m) => m.map === c && m.id === f.id);
            h && ((f.x = h.at[0]), (f.y = h.at[1]));
          }
          if (f.friendly && f.master && o.has(f.master)) {
            const h = i.roles.find((m) => m.id === f.master);
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
    o.quests = o.quests.filter((h) => t.quests.some((m) => m.Index === h.id));
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
      const m = f[h.id];
      for (let g = 201; g < m; g++) c.includes(g) || c.push(g);
      !c.includes(m) &&
        !o.quests.some((g) => g.id === m) &&
        o.quests.push({
          id: m,
          kills: h.kills,
        });
    }
    for (const [h, m] of [
      [238, 207],
      [239, 218],
    ])
      (c.includes(m) || o.quests.some((g) => g.id === m)) && !c.includes(h) && c.push(h);
  }
  return i;
}
function ro(e, t) {
  const a = e.map(t);
  return (
    a.portals && (a.portals = a.portals.filter((i) => !i.expires || i.expires > e.time)),
    [...e.region(t).portals, ...(a.portals || [])]
  );
}
function co(e, t, a) {
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
      ((ye(a, e.rules)?.guaranteedQuestMaterials || e.rng.next(r.chance) === 0) &&
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
function lo(e, t) {
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
function fo(e, t) {
  const a = approvedPlacement(e, t.map);
  return !a || !eligible(t, a.i, a.definition)
    ? !1
    : (((t.special ??= {}).omaNorthwestPlacement = 2), !0);
}
function uo(e, t) {
  const a = e.maps[t],
    i = approvedPlacement(e, t);
  if (!a || !i) return !1;
  const { locations: n, i: s, definition: o } = i,
    r = a.actors.filter((m) => eligible(m, s, o));
  if (a.omaNorthwestPlacement === 1 && r.every((m) => m.special?.omaNorthwestPlacement === 2))
    return !1;
  const c = r.filter((m) => m.special?.omaNorthwestPlacement !== 2).sort((m, g) => m.id - g.id),
    l = new Set(c.map((m) => m.id)),
    f = new Set(
      a.actors
        .filter((m) => !m.dead && ["monster", "npc"].includes(m.kind) && !l.has(m.id))
        .map((m) => `${m.x},${m.y}`),
    ),
    h = [];
  for (const [m, g] of c.entries()) {
    const y = ([w, x]) =>
      (w !== g.x || x !== g.y) && !f.has(`${w},${x}`) && e.walkable(t, w, x, g.id);
    let u;
    for (let w = 0; !u && w < n.length; w++) {
      const x = n[(Math.floor((m * n.length) / c.length) + w) % n.length];
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
  for (const { actor: m, x: g, y } of h)
    ((m.x = g), (m.y = y), ((m.special ??= {}).omaNorthwestPlacement = 2));
  return ((a.omaNorthwestPlacement = 1), !0);
}
var si = [
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
function oi(e) {
  return JSON.stringify(
    e && typeof e == "object"
      ? Object.entries(e)
          .sort(([t], [a]) => t.localeCompare(a))
          .map(([t, a]) => [t, oi(a)])
      : e,
  );
}
function mt(e, t, a) {
  const i = new Map();
  for (const r of e)
    if (r) {
      const { uid: c, count: l, ...f } = r,
        h = oi(f),
        m = i.get(h) || [];
      (m.push(r), i.set(h, m));
    }
  const n = [];
  for (const r of i.values()) {
    r.sort((h, m) => h.uid - m.uid);
    const c = Math.max(1, t.get(r[0].id).StackSize);
    let l = r.reduce((h, m) => h + m.count, 0),
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
      const c = si.indexOf(t.get(r.id).Type);
      return c < 0 ? si.length : c;
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
function mo(e, t) {
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
var ri = class extends wt {
    constructor(e) {
      (super(1), (this.high = e));
    }
    next(e, t = 0) {
      return this.high ? Math.max(t, e - 1) : t;
    }
  },
  _o = new ri(!1),
  Yo = new ri(!0),
  ci = ["Potion", "Scroll", "Book", "BagExpansion", "TreasureMap"];
function migrateItemHotkeys(e, t) {
  e.itemHotkeys ??= Array.from(
    {
      length: 6,
    },
    (a, i) => {
      const n = e.inventory[i];
      return n && ci.includes(t.get(n.id)?.Type || "") ? n.id : null;
    },
  );
}
var pt = (e, t) => Math.max(Math.abs(e.x - t.x), Math.abs(e.y - t.y));
function adventureSetCount(e, t, a = t.job) {
  const i = e.rules.adaptations.adventure.setIds[a];
  return new Set(
    t.equipment
      .filter((n) => !!n && i.includes(n.id) && (!n.maxDura || n.currentDura > 0))
      .map((n) => n.id),
  ).size;
}
function ho(e, t) {
  const a = adventureSetCount(e, t),
    i = e.rules.adaptations.adventure;
  if (a >= 2)
    for (const [n, s] of Object.entries(i.setBonuses[t.job])) t.stats[n] = (t.stats[n] || 0) + s;
  a >= 3 && (t.stats["Adventure" + t.job] = 1);
}
function bo(e, t, a, i, n) {
  if (!(i <= 0 || t.kind !== "player" || n !== "GreatFireBall" || !t.stats.AdventureWizard))
    for (const s of [...e.map(t.map).actors])
      s.id !== a.id &&
        s.kind === "monster" &&
        !s.dead &&
        !s.friendly &&
        pt(s, a) <= 1 &&
        e.damage(t, s, Math.max(1, Math.floor(i * 0.35)), "MAC", "EmberSplash");
}
function owned(e, t) {
  return [...e.inventory, ...e.storage, ...e.equipment, ...e.questInventory].some(
    (a) => a?.id === t,
  );
}
function di(e, t) {
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
function yo(e, t, a) {
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
      e.ground(t, e.newItem(di(e, a))),
    e.rng.next(n.eliteTicketChance) === 0 && e.ground(t, e.newItem(n.ticketId)));
  const s = earlyAdventureEquipment(e, a);
  s.length && e.ground(t, e.newItem(s[e.rng.next(s.length)].Index, 1, !0));
}
function xo(e, t, a) {
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
      !s.dead && s.map === t.map && pt(s, n) <= 1 && e.damage(t, s, 16, "AC", "CaptainSlam");
    return (delete i.slamAt, (i.nextSlam = e.time + 6e3), (t.actionAt = e.time + 600), !0);
  }
  if (!a.dead && pt(t, a) <= 6 && !e.safe(a) && e.time >= Number(i.nextSlam || 0)) {
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
function vo(e, t) {
  const a = e.rules.adaptations.adventure;
  if (t.level < a.tombMinLevel) throw new b(message("core.adventure.enterTreasure.f97d7b80dd"));
  if (a.mapIds.includes(t.map)) throw new b(message("core.adventure.enterTreasure.222ac92c03"));
  if (
    e.time < t.actionAt ||
    e
      .map(t.map)
      .actors.some(
        (r) => r.kind === "monster" && !r.dead && !r.friendly && r.target === t.id && pt(r, t) <= 8,
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
function zt(e, t) {
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
function wo(e, t) {
  zt(e, t);
  const a = t.treasureRun;
  if (!a || t.dead || a.cleared) return;
  const i = e.map(a.map);
  if (i.actors.some((c) => c.kind === "monster" && !c.dead && !c.friendly)) return;
  if (a.wave >= 3) {
    ((a.cleared = !0),
      (a.rewards = [
        {
          item: di(e, t),
          count: 1,
        },
      ]));
    const l = {
      Warrior: ["Slaying", "Thrusting"],
      Wizard: ["GreatFireBall", "HellFire", "ThunderBolt", "FireWall"],
      Taoist: ["SpiritSword", "Poisoning", "SoulFireBall", "SummonSkeleton"],
    }[t.job]
      .map((m) => e.rules.items.find((g) => g.Name === m))
      .find(
        (m) =>
          m &&
          Zt(m, e.rules) &&
          m.RequiredAmount <= t.level &&
          !t.skills.some((g) => g.Spell === m.Spell) &&
          !owned(t, m.Index),
      );
    l &&
      a.rewards.push({
        item: l.Index,
        count: 1,
      });
    const f = e.rules.adaptations.adventure;
    e.ground(t, e.newItem(f.chestId));
    const h = i.actors.find((m) => m.item?.id === f.chestId);
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
      for (let m = -h; m <= h && !f; m++)
        for (let g = -h; g <= h && !f; g++) {
          const y = l.x + g,
            u = l.y + m,
            w = y + "," + u;
          !r.has(w) &&
            e.walkable(a.map, y, u) &&
            ((f = {
              x: y,
              y: u,
            }),
            r.add(w));
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


function Mo(e, t, a) {
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
function ui(e) {
  const t = (a, i) =>
    typeof a == "number" && Number.isFinite(a) ? Math.max(1, Math.min(99, Math.round(a))) : i;
  return {
    hpEnabled: e?.hpEnabled === !0,
    hpPercent: t(e?.hpPercent, 70),
    mpEnabled: e?.mpEnabled === !0,
    mpPercent: t(e?.mpPercent, 30),
    flamingSword: e?.flamingSword === !0,
    blazingSword: e?.blazingSword === !0,
  };
}
var mi = new WeakMap();
function So(e, t) {
  if (t.dead || !t.assist) return;
  const a = ui(t.assist);
  let i = mi.get(t);
  (i ||
    ((i = {
      hp: 0,
      mp: 0,
    }),
    mi.set(t, i)),
    migrateItemHotkeys(t, e.defs));
  for (const [n, s, o, r, c, l, f] of [
    ["hp", 0, a.hpEnabled, a.hpPercent, t.maxHP, t.potHP, "HP"],
    ["mp", 1, a.mpEnabled, a.mpPercent, t.maxMP, t.potMP, "MP"],
  ]) {
    if (!o || c <= 0 || t[n] * 100 >= c * r || l > 0 || e.time < i[n]) continue;
    const h = t.inventory.find((g) => g?.id === t.itemHotkeys?.[s]);
    if (!h) continue;
    const m = e.defs.get(h.id);
    if (!(m?.Type !== "Potion" || ![0, 1].includes(m.Shape) || !(m.Stats[f] > 0))) {
      i[n] = e.time + 1e3;
      try {
        e.checkUse(t, m);
      } catch {
        continue;
      }
      e.useItem(t, h.uid);
    }
  }
  if (!mountedItem(e, t))
    for (const [n, s] of [
      ["blazingSword", "BlazingSword"],
      ["flamingSword", "FlamingSword"],
    ]) {
      if (!a[n] || t.attackModes[n]) continue;
      const o = e.skill(t, s);
      if (!o || e.time < o.s.CastTime) continue;
      const r = o.d.DreamSkill
        ? Pe(o.d, o.level, t.stats)
        : o.d.BaseCost + o.s.Level * o.d.LevelCost;
      t.mp >= r && $t(e, t, s, !0);
    }
}
var L = ["Up", "UpRight", "Right", "DownRight", "Down", "DownLeft", "Left", "UpLeft"],
  Q = [
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
    Q.findIndex(([a, i]) => a === Math.sign(t.x - e.x) && i === Math.sign(t.y - e.y)),
  Oe = class {
    constructor(e, t = 1) {
      ((this.rules = e),
        (this.defs = new Map(e.items.map((a) => [a.Index, a]))),
        (this.monsters = new Map(e.monsters.map((a) => [a.Index, a]))),
        (this.rng = new wt(t)));
    }
    defs;
    monsters;
    rng;
    epoch = globalThis.crypto?.randomUUID?.() ?? String(Date.now());
    roles = [];
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
            !s.dead &&
            lt(s) &&
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
      uo(this, e);
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
            if (a.friendly && a.master === e.id && !a.dead && a.map !== e.map) {
              const i =
                this.freeNear(e.map, e, e.job === "Taoist" ? 2 : 5) ||
                (e.job === "Taoist" ? this.freeNear(e.map, e, 5) : null);
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
            for (let m = 0; m < i.locations.length; m++) {
              const [g, y] = i.locations[(h + m) % i.locations.length];
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
          (fo(this, f), t.actors.push(f));
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
      return (ka(this, n, e), Fn(this, n, e), n);
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
          (Ns(r, o, this.rng, c, dreamMagicFind(c, (n?.stats.MagicFind || 0) + s)),
            Et(r, o, this.rng, c));
        } else Qi(r, o, this.rng, this.rules.adaptations.earlyLoot);
        Us(r, o, this.rng, this.rules.adaptations.gemEnhancement, i);
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
        this.give(n, this.newItem(s.Index), !1);
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
        Pt(t, this.rules),
        (this.npc = 0),
        this.initializeMap(t.map),
        this.grantBlessing(t),
        this.rules.adaptations.noviceProgression &&
          It(t, this.rules.adaptations.noviceProgression.spiritGrowth),
        ot(this, t),
        this.refresh(t),
        t.dead || this.gainXP(t, 0),
        ot(this, t) && this.refresh(t));
      for (const a of t.skills) this.settleSkillExperience(t, a);
    }
    refresh(e) {
      const t = this.rules.growth.baseStats.find((o) => o.Job === e.job);
      e.stats = Object.fromEntries(t.Stats.map((o) => [o.Type, $i(o, e.job, e.level)]));
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
        for (const [c, l] of Object.entries(To(o, r))) e.stats[c] = (e.stats[c] || 0) + l;
        r.Unique.includes("Skill") && (e.stats.SkillGainMultiplier = 3);
        for (const [c, l] of Object.entries(r.Stats)) e.stats[c] = (e.stats[c] || 0) + l;
        for (const [c, l] of Object.entries({
          ...o.added,
          ...Object.fromEntries(
            Object.entries(ko(o, e.job)).map(([f, h]) => [f, h + (o.added[f] || 0)]),
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
      so(e.stats, e.equipment, this.defs);
      for (const o of an(e.equipment, this.defs))
        for (const r of o.effects)
          if (o.count >= r.count)
            for (const [c, l] of Object.entries(r.stats)) e.stats[c] = (e.stats[c] || 0) + l;
      for (const o of e.equipment)
        if (o && (!o.maxDura || o.currentDura > 0))
          for (const [r, c] of Object.entries(this.defs.get(o.id).DreamSpecialStats || {}))
            e.stats[r] = (e.stats[r] || 0) + c;
      ho(this, e);
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
            ? dreamPassiveStats(this.skill(e, o.Spell).d, Jt(o, this.skill(e, o.Spell).d, e.stats))
            : mo(o.Spell, o.Level),
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
      Co(e);
      const s = new Map();
      for (const o of e.equipment) {
        if (!o || (o.maxDura > 0 && !o.currentDura)) continue;
        const r = Math.min(8, Math.floor(he(o)));
        r > 0 && s.set(r, (s.get(r) || 0) + 1);
      }
      ((e.stats.QualitySetDamagePercent = Math.max(
        0,
        ...[...s].filter(([, o]) => o >= 5).map(([o]) => o * 2),
      )),
        Ts(e, this.rules),
        Js(e, this.rules.adaptations.gemEnhancement),
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
            !!l.bound == !!t.bound
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
          .filter((n) => n?.id === t && !be(n))
          .reduce((n, s) => n + s.count, 0) < a
      )
        throw new b(message("manage.protected"));
      for (const n of [e.questInventory, e.inventory])
        for (let s = 0; s < n.length && a; s++) {
          const o = n[s];
          if (o?.id !== t || be(o)) continue;
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
            level: Jt(a, i, e.stats),
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
      ((t += Math.trunc((t * Math.max(0, e.stats.ExpRatePercent || 0)) / 100)),
        (t += Math.max(0, Math.trunc(a))),
        (e.xp += t),
        In(this, e, t));
      for (const i of this.map(e.map).actors.filter(
        (n) => n.friendly && n.master === e.id && !n.dead && P(n, e) <= 16,
      )) {
        i.special ??= {};
        const n = i.special,
          s = Number(n.petLevel || 0),
          o = Number(n.maxPetLevel || 0);
        i.special?.dreamPet ||
          s >= o ||
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
      ot(this, e) && this.refresh(e);
      for (const i of e.skills) this.settleSkillExperience(e, i);
      t > 0 &&
        this.emit("GainedExperience", {
          ObjectID: e.id,
          Amount: t,
        });
    }
    buff(e, t, a, i = 0, n = {}, s = this.active, o) {
      if (
        (e.kind === "monster" && !targetableMonster(e)) ||
        (j(this, e)?.poisonImmune && ["Green", "Red", "DreamPoisonArmour"].includes(t))
      )
        return;
      const r = j(this, e)?.statusAvoidPercent?.[t];
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
            const m = e.buffs.find((y) => y.type === "InnateQi" && y.until > this.time),
              g = m ? this.skill(e, "InnateQi")?.level || m.value : 0;
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
          An(this, e),
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
      const l = this.events.find((f) => f.order === this.nextOrder - 1);
      l.effect = {
        type: a,
        duration: i,
        value: n,
        stats: s,
        interval: r,
      };
    }
    damage(e, t, a, i = "ACAgility", n, s = !1, o = !1) {
      if (
        (e.friendly &&
          e.master &&
          this.roles.find((C) => C.id === e.master)?.stats.AdventureTaoist &&
          (a = Math.floor(a * 1.15)),
        (e.dead && !(s && nativeDeathSource(this, e, n))) ||
          t.dead ||
          (t.kind === "monster" && !targetableMonster(t)) ||
          e.map !== t.map ||
          (t.kind === "player" && this.safe(t)))
      )
        return 0;
      const r = t.special?.bossChannelIndex,
        c = r === void 0 ? void 0 : j(this, t)?.attacks[Number(r)]?.channel;
      if (
        !o &&
        c?.invulnerable &&
        this.time < Number(t.special?.bossChannelUntil) &&
        !t.buffs.some(
          (C) =>
            C.until > this.time &&
            ["Paralysis", "Frozen", "Stun", "Trap", "Shock"].includes(C.type),
        )
      )
        return 0;
      const l = t.buffs.find((C) => C.type === "DreamBossShield");
      (l && i !== "None" && (a = Math.floor(a * (1 - l.value / 100))),
        (a = En(this, e, a, i, n)),
        (a = Jn(this, e, t, a, n)),
        (a = Ys(this, e, t, a, n)),
        (a = Ao(this, e, t, a, n, i)));
      const f = t.hp;
      let h = !0,
        m = 0;
      const g = !!this.rules.adaptations.dreamRuntime;
      (g
        ? (i.startsWith("AC") || i === "Agility") &&
          this.rng.next(10) >= Math.max(2, (e.stats.Accuracy || 0) - (t.stats.Agility || 0) + 8) &&
          (h = !1)
        : i.includes("Agility") &&
          this.rng.next((t.stats.Agility || 0) + 1) > (e.stats.Accuracy || 0) &&
          (h = !1),
        i.startsWith("AC") &&
          t.stats.PhysicalDodgePercent &&
          this.rng.next(100) < t.stats.PhysicalDodgePercent &&
          (h = !1),
        i.startsWith("MAC")
          ? (t.stats.MagicDodgePercent &&
              this.rng.next(100) < t.stats.MagicDodgePercent &&
              (h = !1),
            !g &&
              this.rng.next(this.rules.constants.MagicResistWeight) < (t.stats.MagicResist || 0) &&
              (h = !1),
            (m = this.rng.next(
              Math.max(t.stats.MinMAC || 0, t.stats.MaxMAC || 0) + 1,
              t.stats.MinMAC || 0,
            )))
          : i.startsWith("AC") &&
            (m = this.rng.next(
              Math.max(t.stats.MinAC || 0, t.stats.MaxAC || 0) + 1,
              t.stats.MinAC || 0,
            )),
        t.kind === "player" &&
          i !== "None" &&
          (m = Math.floor(
            m * (1 + ((t.stats.NativeDefencePercentLow || 0) + affixRangeExtra(this, t, 11)) / 100),
          )));
      const y = t.buffs.find((C) => C.type === "DreamPoisonArmour");
      (e.kind === "player" &&
        i !== "None" &&
        (m = Math.floor(m * (1 - Math.min(100, e.stats.WeakSpotPercent || 0) / 100))),
        y && (m = Math.floor(m * (1 - y.value / 100))));
      const u = e.kind === "player" ? this.skill(e, n || "") : null;
      (u?.d.DreamSkill &&
        (n === "FlameDisruptor" || (n === "SoulFireBall" && u.level >= 4)) &&
        (m = Math.floor(m * 0.5)),
        u?.d.DreamSkill && n === "DragonFlame" && (m = Math.trunc(m / Math.max(1, u.level))),
        t.buffs.some((C) => C.type === "Red") &&
          (m = Math.trunc(m * (t.kind === "monster" ? 0.5 : 0.9))),
        h && e.kind === "player" && i.startsWith("AC") && this.wearItem(e, 0, this.rng.next(4) + 1),
        (i.endsWith("Bypass") || i.endsWith("NoArmor")) && (m = 0));
      const w = t.buffs.find((C) => C.type === "MagicShield");
      let x = a + (i === "None" || e.kind !== "player" ? 0 : e.stats.AttackBonus || 0);
      if (i !== "None" && t.kind === "player") {
        const C =
          t.stats.DamageReductionPercent ||
          (w && !this.skill(t, "MagicShield")?.d.DreamSkill ? (w.value + 2) * 10 : 0);
        x -= Math.trunc((x * C) / 100);
      }
      const p =
        h &&
        x > m &&
        e.kind === "player" &&
        !t.friendly &&
        i === "AC" &&
        n === "None" &&
        Cn(this, e);
      p &&
        (x = Math.floor(
          x * (this.rules.adaptations.noviceProgression?.heavyStrike?.multiplier || 1),
        ));
      let v = h ? Math.max(0, x - m) : 0;
      (!g &&
        i !== "None" &&
        e.kind === "player" &&
        v > 0 &&
        this.rng.next(100) <
          (e.stats.CriticalRate || 0) * this.rules.constants.CriticalRateWeight +
            (e.stats.GemCriticalRatePercent || 0) +
            (e.stats.DreamCritPercent || 0) +
            (e.stats.NativeCriticalPoints || 0) * 5 +
            affixRangeExtra(this, e, 44) &&
        ((x += Math.floor(
          x *
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
        (v = x - m)),
        (v = _n(this, t, v, i.endsWith("Bypass") ? "None" : i)),
        t.kind === "player" &&
          i !== "None" &&
          (v = Math.floor(
            v *
              (1 -
                Math.min(
                  100,
                  t.stats[
                    i.startsWith("AC") ? "NativePhysicalAbsorbPercent" : "NativeMagicAbsorbPercent"
                  ] || 0,
                ) /
                  100),
          )),
        t.kind === "player" && i !== "None" && (v = Do(this, t, v, i)),
        w &&
          v > 0 &&
          i !== "None" &&
          !this.skill(t, "MagicShield")?.d.DreamSkill &&
          (w.until = Math.max(this.time, w.until - v * 60)),
        t.kind === "monster" &&
          t.stats.NativeDamageReductionPercent &&
          (v = Math.trunc(v * (1 - t.stats.NativeDamageReductionPercent / 100))),
        (v = eo(this, t, v)));
      const S = j(this, t)?.incomingDamageCap;
      if (
        (S !== void 0 && v > 0 && (v = Math.min(v, S)),
        this.emit("DamageIndicator", {
          ObjectID: t.id,
          Type: h ? (v ? (p ? "HeavyStrike" : "Hit") : "Blocked") : "Miss",
          SourceID: e.id,
          Damage: -v,
        }),
        !v)
      )
        return 0;
      for (const C of [e, t])
        isSpirit(this, C) && ((C.special ??= {}).spiritRegenAt = this.time + 5e3);
      if ((Ln(this, e, t, v, i), t.ai === 55 && t.master)) {
        const C = this.actor(t.master);
        if (C)
          return (
            (C.mp = Math.max(0, C.mp - v)),
            (t.target = e.id),
            this.emit("ObjectStruck", {
              ObjectID: t.id,
            }),
            C.mp || this.die(t, e),
            v
          );
      }
      if (
        (t.stats.EnergyShieldPercent &&
          this.rng.next(100) < t.stats.EnergyShieldPercent &&
          (t.hp = Math.min(t.maxHP, t.hp + (t.stats.EnergyShieldHPGain || 0))),
        t.kind === "player" && t.mp > 0 && this.special(t, "Protection")
          ? (t.mp = Math.max(0, t.mp - v))
          : (t.hp = Math.max(0, t.hp - v)),
        t.kind === "player" && (t.attackModes.channel = !1),
        n === "EvilCentipede" && !j(this, e) && t.hp > 0)
      )
        for (const [C, O, E] of [
          ["Green", 5, 3e4],
          ["Paralysis", 15, 1e4],
        ]) {
          const A = G(e.stats, "SC", this.rng);
          if (
            this.rng.next(this.rules.constants.PoisonResistWeight) >= (t.stats.PoisonResist || 0) &&
            this.rng.next(O) === 0
          ) {
            this.buff(t, C, E, A, {}, e.id);
            const H = t.buffs.find((R) => R.type === C);
            H && ((H.interval = 2e3), (H.next = this.time + 2e3));
          }
        }
      n === "CaveMaggot" &&
        t.hp > 0 &&
        this.rng.next(this.rules.constants.PoisonResistWeight) >= (t.stats.PoisonResist || 0) &&
        this.rng.next(20) === 0 &&
        this.buff(t, "Paralysis", 5e3, G(e.stats, "SC", this.rng), {}, e.id);
      const D = e.hp;
      if (e.kind === "player" && t.kind === "monster" && i.startsWith("AC")) {
        const C = e,
          O = this.monsters.get(t.definition).Level,
          E = O > C.level ? 0 : Math.min(10, C.level - O);
        if (
          (this.special(C, "Paralize") &&
            this.rng.next(15, 1) === 1 &&
            this.buff(t, "Paralysis", 5e3, 0, {}, C.id),
          e.stats.Freezing > 0 &&
            this.rng.next(this.rules.constants.FreezingAttackWeight) < e.stats.Freezing &&
            this.rng.next(E) === 0 &&
            this.buff(
              t,
              "Slow",
              Math.min(10, 3 + this.rng.next(e.stats.Freezing)) * 1e3,
              0,
              {},
              C.id,
            ),
          e.stats.PoisonAttack > 0 &&
            this.rng.next(this.rules.constants.PoisonAttackWeight) < e.stats.PoisonAttack &&
            this.rng.next(E) === 0 &&
            this.buff(
              t,
              "Green",
              5e3,
              Math.min(10, 3 + this.rng.next(e.stats.PoisonAttack)),
              {},
              C.id,
            ),
          !this.rules.adaptations.dreamRuntime &&
            e.stats.HPDrainRatePercent > 0 &&
            ((C.special ??= {}),
            (C.special.hpDrain =
              Number(C.special.hpDrain || 0) +
              Math.fround(Math.fround(v / 100) * e.stats.HPDrainRatePercent)),
            Number(C.special.hpDrain) > 2))
        ) {
          const A = Math.floor(Number(C.special.hpDrain));
          ((C.hp = Math.min(C.maxHP, C.hp + A)),
            (C.special.hpDrain = Number(C.special.hpDrain) - A));
        }
      }
      if (
        (i !== "None" && !s && Un(this, e, t, Math.min(v, f), n),
        Io(this, e, t, Math.min(v, f), i, n),
        s || (No(this, e, t, Math.min(v, f), i), affixManaOnHit(this, e, t, Math.min(v, f), i)),
        to(e, t, Math.min(v, Math.max(0, f)), i),
        e.kind === "player" &&
          e.hp > D &&
          this.emit("DamageIndicator", {
            ObjectID: e.id,
            Type: "Heal",
            Damage: e.hp - D,
          }),
        Dn(this, e, t) || (t.target = e.id),
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
        for (let C = 1; C < t.equipment.length; C++) this.wearItem(t, C, 1);
      if (n === "Vampirism" && e.kind === "player") {
        const C = this.skill(e, n)?.s.Level || 0;
        this.schedule("vamp", 1e3, e, e, Math.trunc(v * (C + 1) * 0.25));
      }
      return (
        (t.buffs = t.buffs.filter((C) => C.type !== "LRParalysis" && C.type !== "Trap")),
        ((t.special ??= {}).lastReceivedDamage = v),
        !t.hp && !(t.kind === "monster" && Kn(this, t))
          ? this.die(t, e)
          : t.kind === "player" && Gs(this, t, e),
        ts(this, e, t, v, i, a, n),
        bo(this, e, t, v, n),
        v
      );
    }
    die(e, t) {
      if (e.kind === "player" && e.trialRun) {
        je(this, e, message("trial.failed"));
        return;
      }
      if (e.dead) return;
      if (e.kind === "player") {
        delete e.mountUid;
        const m = e;
        if (
          ((m.special ??= {}),
          this.time > Number(m.special.revivalAt || 0) &&
            [m.equipment[7], m.equipment[8]].find(
              (y) => y && y.currentDura >= 1e3 && this.defs.get(y.id).Unique.includes("Revival"),
            ))
        ) {
          ((m.special.revivalAt = this.time + 3e5),
            (m.hp = m.maxHP),
            this.refresh(m),
            this.say(message("core.game.die.de43815918")));
          return;
        }
        for (const g of Object.values(this.maps))
          for (const y of g.actors) y.friendly && y.master === m.id && !y.dead && this.die(y, t);
        this.safe(m) || this.deathDrop(m);
      }
      if (isSpirit(this, e) && e.master) {
        const m = this.roles.find((g) => g.id === e.master);
        m &&
          ((m.spiritProgress = {
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
        e.kind === "monster" && us(this, e),
        e.kind === "player")
      ) {
        this.say(message("core.game.die.016e77d339"));
        return;
      }
      const a = this.monsters.get(e.definition);
      if (!a || e.friendly || e.special?.bossMinion) return;
      Tn(this, e);
      const i = t.kind === "player" ? t : t.friendly ? this.me : void 0;
      if (
        (i && ca(this, i),
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
          en(this, i, Number(e.special?.trialXP ?? a.Experience)),
          Bo(this, i),
          yo(this, e, i),
          co(this, e, i));
        const m = this.rules.adaptations.earlyLoot,
          g = Math.min(
            Math.max(0, i.maxHP - i.hp),
            Math.max(0, Math.min(m.killHPCap, i.stats.KillHP || 0)),
          ),
          y = Math.min(
            Math.max(0, i.maxMP - i.mp),
            Math.max(0, Math.min(m.killMPCap, i.stats.KillMP || 0)),
          );
        if (
          ((i.hp += g),
          (i.mp += y),
          (g || y) &&
            this.say(
              message("core.game.die.6915136761", {
                p0: g,
                p1: y,
              }),
            ),
          !this.rules.adaptations.dreamRuntime && a.Name === "Scarecrow" && !i.firstScarecrowReward)
        ) {
          const u = this.rules.items.find((x) => x.Name === m.firstScarecrowWeapon),
            w = this.newItem(u.Index);
          ((w.added[
            {
              Warrior: "MaxDC",
              Wizard: "MaxMC",
              Taoist: "MaxSC",
            }[i.job]
          ] = 1),
            this.ground(e, w),
            (i.firstScarecrowReward = !0),
            this.say(message("core.game.die.3f0d3da9b1")));
        }
      }
      if (t.special?.dreamPet && !isSpirit(this, t) && !e.friendly) {
        const m = t.special,
          g = Number(m.petLevel || 0),
          y = Number(m.maxPetLevel || 0);
        for (
          m.petXP = Number(m.petXP || 0) + a.Experience;
          Number(m.petLevel || 0) < y && Number(m.petXP) >= (Number(m.petLevel || 0) + 1) * 2e4;

        )
          ((m.petXP = Number(m.petXP) - (Number(m.petLevel || 0) + 1) * 2e4),
            (m.petLevel = Number(m.petLevel || 0) + 1));
        m.petLevel !== g && this.refreshActor(t);
      }
      if (i) {
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
              Re(this.rules.adaptations.dreamRuntime).experienceBonusPercent / 100),
          i.stats.KillXP || 0,
        );
        for (const m of i.quests) {
          const g = this.rules.quests.find((y) => y.Index === m.id);
          (!g?.taskMaps?.length || g.taskMaps.includes(e.map)) &&
            (m.kills[a.Index] = (m.kills[a.Index] || 0) + 1);
        }
      }
      if (
        (i && gn(this, i, e, a), e.special?.trialFloor && i && (fn(this, i), !e.special.trialBoss))
      )
        return;
      const n = hasBossLootBudget(a, this.rules),
        s = [],
        o = wn(this.rules, a, e);
      let r = 0,
        c = 0;
      const l = this.rules.adaptations.dreamRuntime,
        f =
          (Math.max(0, i?.stats.ItemDropRatePercent || 0) +
            Re(this.rules.adaptations.dreamRuntime).dropBonusPercent) /
          100,
        h = this.rules.adaptations.dreamRuntime
          ? 1
          : 1 + Math.floor(f) + (f % 1 > 0 && this.rng.next(1e4) < (f % 1) * 1e4 ? 1 : 0);
      for (let m = 0; m < h; m++)
        for (const g of o) {
          if (
            g.item !== null &&
            this.defs.get(g.item)?.BossRelic &&
            (e.special?.trialBoss || e.special?.trialFloor)
          )
            continue;
          const y =
            g.dropMultiplierMode === "fixed"
              ? 1
              : l
                ? g.dropMultiplierMode === "casual-only"
                  ? l.casual?.enabled
                    ? l.casual.baseDropMultiplier + l.casual.dropAdd
                    : 1
                  : Ea(l, (i?.stats.ItemDropRatePercent || 0) + Number(e.special?.dropAdd || 0))
                : 1;
          let u = l
            ? g.chancePercent !== void 0
              ? {
                  ...g,
                  chancePercent: Math.min(100, g.chancePercent * y),
                }
              : {
                  ...g,
                  chance: dreamDropDenominator(g.chance, y),
                }
            : g;
          (l &&
            g.chanceBonusPercent &&
            (u = {
              ...u,
              chancePercent:
                Math.round(
                  Math.min(100, (u.chancePercent ?? 100 / u.chance) + g.chanceBonusPercent) * 100,
                ) / 100,
            }),
            i &&
              ye(i, this.rules)?.guaranteedQuestMaterials &&
              g.item !== null &&
              this.needsQuestItem(i, g.item, e.map) &&
              (u = {
                ...u,
                chance: 1,
              }));
          const w = ea(u, this.defs, this.rules, this.rng);
          if (w) {
            w.gold && (n || l?.lootVolume ? ((r += w.gold), c++) : this.ground(e, void 0, w.gold));
            for (const x of w.items) {
              if (this.defs.get(x.id).Type === "Quest") {
                m === 0 &&
                  i &&
                  this.needsQuestItem(i, x.id, e.map) &&
                  this.give(i, this.newItem(x.id));
                continue;
              }
              if (!x.quest) {
                const v = this.newItem(x.id, 1, !0, a, i, Number(e.special?.magicAdd || 0));
                n || l?.lootVolume ? s.push(v) : this.ground(e, v);
              }
            }
          }
        }
      if ((l && (n || l.lootVolume) && Mn(this, e, a, i, s), l?.lootVolume)) {
        const m = hasUnrestrictedNativeLoot(a, this.rules);
        if (m && !isChallengeChest(a, this.rules))
          for (const y of Ga(s, o, this.defs, this.rng, c)) s.push(this.newItem(y, 1, !0, a, i));
        const g = bs(s, this.defs, this.rng, l.lootVolume, m, r, (y) =>
          i ? this.questItemDeficit(i, y, e.map) : 0,
        );
        for (const y of g.items) this.ground(e, y);
        (g.gold && this.ground(e, void 0, Math.min(4294967295, g.gold)),
          this.dropBossGold(e, a, i),
          this.dropBossAccessories(e, a, i));
        return;
      }
      if (n) {
        if (this.rules.adaptations.dreamRuntime)
          for (const g of Ga(s, o, this.defs, this.rng, c)) s.push(this.newItem(g, 1, !0, a, i));
        const m = this.rules.adaptations.dreamRuntime ? s : Rn(s, this.defs, this.rules, this.rng);
        for (const g of m) this.ground(e, g);
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
        for (const [r, c] of Q) {
          const l = o.x + r,
            f = o.y + c,
            h = `${l},${f}`;
          P(e, {
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
            (j(this, e)?.stationary ?? e.ai === 14))) ||
        this.time < e.actionAt ||
        e.buffs.some((o) =>
          ["Paralysis", "LRParalysis", "Trap", "Frozen", "Shock", "Stun"].includes(o.type),
        )
      )
        return !1;
      const [i, n] = Q[t];
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
        (e.moveAt = e.kind === "player" ? e.actionAt : e.actionAt + ns(this, e)),
        e.kind === "monster" && (e.attackAt = Math.max(e.attackAt, e.moveAt)),
        e.kind === "player" && this.enterStandingPortal(e),
        !0
      );
    }
    enterStandingPortal(e) {
      this.npc = 0;
      const t = ro(this, e.map).find((a) => a.at[0] === e.x && a.at[1] === e.y);
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
      const [i, n] = Q[t],
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
      if (!Sa(this, e, o, a, s)) {
        if (o) {
          this.attack(e, o, a);
          return;
        }
        ((e.dir = t),
          (e.attackAt = this.time + _e(e.level, e.stats)),
          (e.actionAt = this.time + Math.min(550, e.attackAt - this.time)),
          this.emit("ObjectAttack", {
            ObjectID: e.id,
            Direction: L[t],
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
        ((e.dir = direction(e, t)), Sa(this, e, t, a))
      )
        return;
      const i = this.skill(e, a);
      a !== "None" && !i && (a = "None");
      const n = _e(e.level, e.stats, !!this.rules.adaptations.dreamRuntime);
      ((e.attackAt = this.time + n),
        (e.actionAt = this.time + Math.min(550, n)),
        (e.regenAt = this.time + 1e4),
        this.emit("ObjectAttack", {
          ObjectID: e.id,
          Direction: L[e.dir],
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
          const l = Pe(i.d, i.level, e.stats);
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
            ? l === e.dir && P(e, c) === 2
            : P(e, c) === 1 && (a === "CrossHalfMoon" || f <= 2 || f >= 6)) &&
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
          if (n.kind === "magic" && !s.dead && !o.dead) Xa(this, s, o, n);
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
            const r = this.damage(s, o, n.damage, n.defence, n.spell);
            if (
              (Vn(this, s, o, r, n.spell),
              fs(this, s, o, r, n),
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
              Xa(this, s, o, {
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
              ? Zn(this, o, r)
              : o.kind === "player"
                ? (o.healHP += r)
                : (o.hp = Math.min(o.maxHP, o.hp + r));
          }
        }
      }
      for (const n of [t, ...this.map(t.map).actors]) {
        if (
          (es(this, n),
          Hn(this, n),
          (n.kind === "monster" && !n.friendly && P(n, t) > 24 && !n.buffs.length) || n.dead)
        )
          continue;
        for (const o of n.buffs)
          if (
            o.next <= this.time &&
            (o.until > this.time || (o.nativeMonsterPoison && o.next <= o.until)) &&
            ((o.next += o.interval || 1e3),
            as(this, n, o),
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
        So(this, t));
      const i = t.skills.find((n) => n.Spell === "CounterAttack");
      i && i.CastTime <= this.time && (t.attackModes.counterAttack = !1);
      for (const n of [...this.map(t.map).actors])
        if (n.kind === "monster") {
          if ((!n.friendly && P(n, t) > 24 && !n.buffs.length) || this.recallDistantTaoistPet(n, t))
            continue;
          ss(this, n, t) && !xo(this, n, t) && this.ai(n, t);
        } else n.kind === "spell" && ls(this, n);
      ((this.map(t.map).actors = this.map(t.map).actors.filter(
        (n) => !n.expires || n.expires > this.time,
      )),
        la(this, t),
        un(this, t),
        wo(this, t));
    }
    regen(e) {
      if (
        (qs(e, this.rules, this.time),
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
        hs(e, this.time),
        this.time >= e.healAt)
      ) {
        e.healAt = this.time + 600;
        const t = Math.min(e.healHP, 5 + Math.trunc(e.level / 10) + Math.trunc(e.healHP / 10));
        ((e.healHP -= t), (e.hp = Math.min(e.maxHP, e.hp + t)));
      }
      (e.hp === e.maxHP && (e.potHP = 0), e.mp === e.maxMP && (e.potMP = 0));
    }
    recallDistantTaoistPet(e, t) {
      if (
        !e.friendly ||
        e.dead ||
        e.master !== t.id ||
        t.job !== "Taoist" ||
        t.dead ||
        e.map !== t.map ||
        P(e, t) <= 10 ||
        (e.special?.tameUntil && Number(e.special.tameUntil) <= this.time)
      )
        return !1;
      e.target = 0;
      const a = this.freeNear(t.map, t, 2) || this.freeNear(t.map, t, 5);
      return (a && ((e.x = a.x), (e.y = a.y)), !0);
    }
    ai(e, t) {
      const a = this.monsters.get(e.definition),
        i = e.friendly && e.master === t.id && t.job === "Taoist" && !t.dead;
      if (
        this.recallDistantTaoistPet(e, t) ||
        this.time < e.actionAt ||
        e.buffs.some((s) =>
          ["Paralysis", "LRParalysis", "Trap", "Frozen", "Shock", "Stun"].includes(s.type),
        )
      )
        return;
      if (i && P(e, t) > 6) {
        ((e.target = 0), this.time >= e.moveAt && this.stepTowards(e, t));
        return;
      }
      let n = this.actor(e.target);
      if (e.buffs.some((s) => s.type === "Hallucination"))
        n = this.map(e.map).actors.find(
          (s) =>
            s.id !== e.id &&
            s.kind === "monster" &&
            !s.dead &&
            targetableMonster(s) &&
            P(e, s) <= a.ViewRange,
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
        (!n ||
          n.dead ||
          n.kind !== "monster" ||
          n.friendly ||
          (i && (n.map !== t.map || P(n, t) > 6))) &&
          (n = this.map(e.map).actors.find(
            (s) =>
              s.kind === "monster" &&
              !s.friendly &&
              !s.dead &&
              P(s, e) <= 8 &&
              (!i || P(s, t) <= 6),
          ));
      } else if (!n || n.dead || n.map !== e.map) {
        const s = a.IsBoss
          ? [t]
          : [t, ...this.map(e.map).actors.filter((o) => o.friendly && !!petInheritance(this, o))];
        n =
          a.AI !== 1 && (a.AI !== 2 || e.special?.runAway)
            ? s
                .filter(
                  (o) =>
                    !o.dead &&
                    o.map === e.map &&
                    !this.safe(o) &&
                    P(e, o) <= a.ViewRange &&
                    (!o.buffs.some((r) => r.type === "Hiding") ||
                      a.IsBoss ||
                      a.DreamName === "\u6708\u9B54\u8718\u86DB"),
                )
                .sort((o, r) => P(e, o) - P(e, r))[0]
            : void 0;
      }
      if (
        (n && (P(e, n) > 15 || (n.kind === "player" && this.safe(n))) && (n = void 0),
        (e.target = n?.id || 0),
        n)
      ) {
        if (rs(this, e, n)) return;
        const s = isSpirit(this, e)
          ? this.rules.adaptations.noviceProgression.spiritRange
          : (Qn(this, e) ?? os(e, n));
        P(e, n) <= s && this.time >= e.attackAt
          ? (isSpirit(this, e) && ((e.special ??= {}).spiritRegenAt = this.time + 5e3),
            cs(this, e, n))
          : P(e, n) > s &&
            this.time >= e.moveAt &&
            (a.DreamRaw || a.MoveSpeed > 0) &&
            this.stepTowards(e, n);
      } else
        e.friendly && P(e, t) > 2 && this.time >= e.moveAt
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
        a === "@challengeevil" || a === "@challengesettle")
      ) {
        ma(this, e, a === "@challengeevil" ? "evil" : "settle");
        return;
      }
      if (a === "@challengeclaim") {
        claimChallengeRewards(this, e);
        return;
      }
      if (a === "@late-evil-dragon" || a === "@late-po-settle") {
        ma(this, e, a === "@late-evil-dragon" ? "evil" : "settle");
        return;
      }
      if (a.startsWith("@late-")) {
        yn(this, e, a);
        return;
      }
      if (t.role === "trial" && a === "@main") {
        this.emit("NPCResponse", {
          NPCID: t.id,
          Page: ln(this, e),
        });
        return;
      }
      if (a.startsWith("@trial")) {
        dn(this, e, a);
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
      if (Xi(this, e, t, a)) return;
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
        As(this, e, a === "@craftgraduate");
        return;
      }
      if (a === "@craftopen") {
        this.emit("OpenForge", {
          Mode: "craft",
        });
        return;
      }
      if (a.startsWith("@challenge-")) {
        oa(this, e, a.slice(11));
        return;
      }
      if (a === "@challengestart") {
        mn(this, e);
        return;
      }
      if (a === "@challengeleave") {
        (this.requireNPC(e), ra(this, e));
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
        .map(({ index: n }) => Pn(t.id, a, n, e.name));
      if (
        (a === "@main" &&
          this.rules.adaptations.towns?.settlements.some((n) => n.npcIds.includes(t.id)) &&
          i.splice(
            1,
            0,
            message("npc.residence", {
              town: entityText("towns", et(e, this.rules).id),
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
            ...Ji(this, e, t),
            ...ha(this, e, t),
            ...(t.id === 9420 || t.role === "challenge" ? hn(e, t.id) : []),
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
        (!!ye(e, this.rules) ||
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
          nn(this, a, t);
          break;
        case "SellEquipmentBatch":
          cn(this, a, t);
          break;
        case "SetAssist":
          a.assist = ui(t);
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
              const o = this.freeNear(a.map, a, 3);
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
            this.emit("ForgeQuote", Fa(this, a, t));
          } catch (i) {
            if (t.Mode !== "cube") throw i;
            this.emit("ForgeQuote", {
              cubeSelection: t.Selected,
              canForge: !1,
              error: Xt(i),
            });
          }
          break;
        }
        case "Forge":
          Is(this, a, t);
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
          if (!n || !ci.includes(this.defs.get(n.id).Type))
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
                p0: message(ye(a, this.rules) ? "game.teleport.talisman" : "game.teleport.ring"),
                p1: i,
                p2: n,
              }),
            ),
            this.enterStandingPortal(a));
          break;
        }
        case "Walk":
        case "Run":
          this.move(a, L.indexOf(t.Direction), e === "Run" ? 2 : 1);
          break;
        case "Turn": {
          const i = L.indexOf(t.Direction);
          i >= 0 && (a.dir = i);
          break;
        }
        case "Attack": {
          if (t.Force) {
            this.forceAttack(a, L.indexOf(String(t.Direction)), String(t.Spell || "None"));
            break;
          }
          const i = this.actor(Number(t.TargetID));
          i && this.attack(a, i, String(t.Spell || "None"));
          break;
        }
        case "Magic":
          if (mountedItem(this, a)) throw new b(message("core.game.command.1a01d4ad93"));
          Qs(this, a, t);
          break;
        case "ToggleMount":
          Lt(this, a);
          break;
        case "SpellToggle":
          $t(this, a, String(t.Spell), !!t.CanUse);
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
            Mo(this, a, i);
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
          ao(this, a, Number(t.IDFrom), Number(t.IDTo));
          break;
        case "ExchangeScarletSword":
          xn(this, a, Array.isArray(t.Selected) ? t.Selected.map(Number) : []);
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
            Lt(this, a, n.uid);
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
              l = c.find((m) => m.uid === n);
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
            ((a.gold -= f), (l.count -= s), (a.buyback[i.id] = c.filter((m) => m.count > 0)));
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
          const n = Number(t.From),
            s = Number(t.To),
            o = e === "StoreItem" ? a.inventory : a.storage,
            r = e === "StoreItem" ? a.storage : a.inventory;
          if (
            !Number.isInteger(n) ||
            !Number.isInteger(s) ||
            n < 0 ||
            n >= o.length ||
            s < 0 ||
            s >= r.length ||
            !o[n] ||
            r[s]
          )
            throw new b(message("core.game.command.53e7891bb9"));
          const c = o[n];
          if (t.UniqueID !== void 0 && Number(t.UniqueID) !== c.uid)
            throw new b(message("core.game.command.cda3a5c696"));
          if (e === "TakeBackItem" && !bagSlotAccepts(a, this.rules, this.defs.get(c.id), s))
            throw new b(message("storage.bagCategoryFull"));
          ((r[s] = c), (o[n] = null));
          break;
        }
        case "SortStorage": {
          if (this.requireNPC(a).role !== "storage")
            throw new b(message("core.game.command.fc8754400b"));
          a.storage = mt(a.storage, this.defs, () => this.nextId++);
          break;
        }
        case "UnlockStoragePage": {
          if (this.requireNPC(a).role !== "storage") throw new b(message("storage.unlockNPC"));
          Ki(a, Number(t.Page));
          break;
        }
        case "SortInventory": {
          const i = equipmentCapacity(a, this.rules);
          a.inventory =
            a.bagLayoutVersion === 1
              ? [
                  ...mt(a.inventory.slice(0, i), this.defs, () => this.nextId++),
                  ...mt(a.inventory.slice(i), this.defs, () => this.nextId++),
                ]
              : mt(a.inventory, this.defs, () => this.nextId++);
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
            !!o.bound == !!r.bound
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
          const i = et(a, this.rules),
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
      for (const i of Pt(a, this.rules)) {
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
      if (!(Bs(this, e, i) || vn(this, e, i))) {
        if (n.Type === "Mount") {
          Lt(this, e, i.uid);
          return;
        }
        if (n.Type === "MountVoucher") {
          Cs(this, e, i.uid);
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
                  ...Za(this, e, i, o),
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
            (ga(e),
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
          lo(this, e);
          return;
        } else if (n.Type === "TreasureMap") vo(this, e);
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
            ps(
              e,
              Math.floor((n.Stats.HP || 0) * (1 + (e.stats.PotionHealingPercent || 0) / 100)),
              n.Stats.MP || 0,
              this.time,
            );
          else if (n.Shape === 1) {
            (isSunPotion(n) && (e.sunPotionAt = this.time + ia), Yi(e, n, this.time));
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
          const s = et(e, this.rules),
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
              const m = (f + h) % l,
                g = m % r.width,
                y = Math.floor(m / r.width);
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
        ot(this, e) && this.refresh(e),
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
        t && zt(this, t),
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
          lateQuestRows: pa(this, t),
          nextXP: this.rules.growth.experience[a.level - 1] || 1,
          buffs: a.buffs.map((s) => s.type),
          buffDetails: a.buffs.map((s) => ({
            type: s.type,
            remainingMs: Math.max(0, s.until - this.time),
            stats: s.stats,
            value: s.value,
            spell: s.spell,
          })),
          potionRecovery: ms(t, this.time),
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
          testTalisman: a.dead ? null : ye(a, this.rules) || null,
          worldFirework: this.rules.adaptations.dreamRuntime?.worldFirework?.enabled
            ? {
                permanent: !0,
                experienceBonusPercent: Re(this.rules.adaptations.dreamRuntime)
                  .experienceBonusPercent,
                monsterExperienceMultiplier:
                  (this.rules.multipliers.monsterExperienceMultiplier +
                    Re(this.rules.adaptations.dreamRuntime).experienceBonusPercent / 100) *
                  (1 + Math.max(0, a.stats.ExpRatePercent || 0) / 100),
                dropMultiplier: Ea(
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
          attackDelay: _e(a.level, a.stats, !!this.rules.adaptations.dreamRuntime),
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
            .actors.filter((s) => P(s, t) <= 24 && lt(s))
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
                    displayName: s.kind === "monster" ? Sn(s, this.rules) : void 0,
                    rank:
                      s.kind === "monster"
                        ? Nt(this.monsters.get(s.definition), this.rules)
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
                  (s.friendly || P(s, t) <= 24 || s.buffs.length),
              ).length
            : 0,
        },
        lastSaved: this.lastSaved,
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
                  P(s, t) <= 24 &&
                  (lt(s) ||
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
                rank: Nt(this.monsters.get(s.definition), this.rules),
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
        dreamRuntimeVersion: this.rules.adaptations.dreamRuntime?.version,
        time: this.time,
        nextId: this.nextId,
        rng: this.rng.export(),
        roles: this.roles,
        maps: e ? this.maps : {},
        events: e ? this.events : [],
        nextOrder: this.nextOrder,
        lastSaved: this.lastSaved,
        ...(this.sync
          ? {
              sync: this.sync,
            }
          : {}),
      });
    }
    restore(e) {
      if (
        ((e = $a(ai(e, this.rules), this.rules)),
        e.version !== 1 || e.rulesVersion !== this.rules.version)
      )
        throw new b(message("core.game.restore.8d582cc5cd"));
      ((this.roles = structuredClone(e.roles)),
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
          (i && n && (bi(i, n, this.rules.adaptations.dreamRuntime?.affixes), Ua(i, this.rules)),
            i?.id === t.legacy &&
              ((i.id = t.canonical),
              (i.maxDura = this.defs.get(t.canonical).Durability),
              (i.currentDura = Math.min(i.currentDura, i.maxDura))));
        };
      for (const i of this.roles) {
        (i.equipment.length === 14 && i.equipment.push(null),
          this.defs.get(i.equipment[12]?.id || 0)?.DreamType === 6 &&
            !i.equipment[14] &&
            ((i.equipment[14] = i.equipment[12]), (i.equipment[12] = null)));
        for (const n of Object.keys(i.crafting?.skills ?? {})) Ta(this, i, n);
        (oo(i, this.rules), migrateItemHotkeys(i, this.defs), Vi(i, this.rules, this.defs));
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
          n.kind === "monster" && !n.special && ka(this, n, this.monsters.get(n.definition));
      ((this.events = structuredClone(e.events)),
        (this.nextOrder = e.nextOrder),
        (this.lastSaved = e.lastSaved),
        (this.sync = e.sync ? structuredClone(e.sync) : void 0),
        (this.active = 0),
        (this.npc = 0));
    }
  },
  ht = [
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
  xe = {
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


for (let e = 0; e < ht.length; e++)
  ((xe[23 + e] = "SkillLevel:" + ht[e]), (xe[46 + e] = "SkillDamage:" + ht[e]));
function ko(e, t) {
  const a = {};
  for (const i of e.affixes || []) {
    if (!i.revealed || (t && pi[i.group] && pi[i.group] !== t)) continue;
    if (i.type === 1009) {
      for (const s of ["StoneRecoveryPercent", "FreezeRecoveryPercent"]) a[s] = (a[s] || 0) + i.low;
      continue;
    }
    const n = xe[i.type];
    n && !n.startsWith("SkillDamage:") && (a[n] = (a[n] || 0) + i.low);
  }
  return a;
}
((xe[1001] = "CastSpeed"),
  (xe[1002] = "KillXP"),
  Object.assign(xe, {
    1003: "NativeMoveSpeed",
    1004: "DreamCritPercent",
    1005: "DreamCritDamagePercent",
    1006: "HPRatePercent",
    1007: "NativePhysicalAbsorbPercent",
    1008: "NativeMagicAbsorbPercent",
    1010: "AffixDamagePercent",
  }));
var pi = {
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
Object.assign(xe, {
  1020: "AffixLifeOnHit",
  1021: "AffixLifeDrainPercent",
  1023: "AffixManaOnHit",
  1024: "AffixManaDrainPercent",
  1026: "AffixPoisonDamage",
  1027: "AffixSummonDamage",
});
var hi = new Set([
  1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009, 1010, 1020, 1021, 1022, 1023, 1024, 1025,
  1026, 1027, 1028, 1029, 1030, 1031, 1032,
]);
function ze(e, t) {
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
function bi(e, t, a) {
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
function Po(e, t) {
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
    i = ze(e, "Warrior") && !ze(e, "Wizard") && !ze(e, "Taoist");
  return Object.values(t)
    .filter(
      (n) =>
        !n.ControlledChannel &&
        n.Weight > 0 &&
        (!n.AuxiliaryOnly || auxiliaryAffixSlot(e)) &&
        (!n.WearableJob || supportsWearableJob(e, n.WearableJob)) &&
        (!n.EquipmentJob || ze(e, n.EquipmentJob)) &&
        (!n.ExcludeEquipmentJob || !ze(e, n.ExcludeEquipmentJob)) &&
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
function xi(e, t, a) {
  if (a <= 0) return 0;
  const i = affixCandidates(e, t),
    n = i.filter((c) => c.Prefix);
  if (!i.some((c) => !c.Prefix && (c.RollChancePercent ?? 100) === 100))
    throw new Error(`No guaranteed suffix in affix pool ${e.Index}`);
  let s = 0;
  const o = (c, l) => {
      if (!l) return 1;
      if (!c.length || l > new Set(c.filter((h) => dt.has(h.Type)).map((h) => h.Type)).size)
        return 0;
      const f = c.reduce((h, m) => h + m.Weight, 0);
      return c
        .filter((h) => dt.has(h.Type))
        .reduce(
          (h, m) =>
            h +
            ((0.5 * m.Weight) / f) *
              o(
                c.filter((g) => g.Type !== m.Type),
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
        m = (h.RollChancePercent ?? 100) / 100;
      (m > 0 && r(c + 1, [...l, h], f * m), m < 1 && r(c + 1, l, f * (1 - m)));
    };
  return (r(0, [], 1), 1 - s);
}
function vi(e, t, a, i, n, s) {
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
    let m = r.filter((p) => p.Prefix === h);
    if (!m.length) {
      if (((h = !h), c[h ? "prefix" : "suffix"] >= 3)) break;
      m = r.filter((p) => p.Prefix === h);
    }
    if (!m.length) break;
    const g = weighted3(m, a),
      y = Po(g, o);
    if (!y.length) break;
    const u = weighted3(y, a);
    c[g.Prefix ? "prefix" : "suffix"]++;
    const w = g.Range
        ? u.LowValue
        : a.next(u.HighValue + 1, o >= 5 ? Math.ceil((u.LowValue + u.HighValue) / 2) : u.LowValue),
      x = g.Range ? u.HighValue : w;
    e.affixes.push({
      group: g.ID,
      tier: u.tier,
      name: u.Name,
      type: g.Type,
      low: w,
      high: x,
      rate: g.Rate,
      duration: u.Dura,
      revealed: !0,
      text: g.Format.replaceAll("{val}", String(w))
        .replaceAll("{vallow}", String(w))
        .replaceAll("{valhigh}", String(x))
        .replaceAll("{dura}", String(u.Dura))
        .replaceAll("%%", "%"),
    });
    for (let p = r.length - 1; p >= 0; p--) r[p].Type === g.Type && r.splice(p, 1);
  }
  if (
    t.AffixChannelsEnabled === !0 &&
    (s !== void 0 || Object.values(i).some((f) => f.ControlledChannel))
  ) {
    for (const f of [1030, 1031, 1032])
      if (!i[f]?.ControlledChannel) throw new Error(`Missing controlled affix ${f}`);
    Ms(e, t, a, i, s ?? xi(t, i, n));
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
function Co(e) {
  const t = equippedAffixes(e).filter((a) => a.type === 11);
  ((e.stats.NativeDefencePercentLow = t.reduce((a, i) => a + i.low, 0)),
    (e.stats.NativeDefencePercentHigh = t.reduce((a, i) => a + i.high, 0)));
}
function affixRangeExtra(e, t, a) {
  return equippedAffixes(t)
    .filter((i) => i.type === a)
    .reduce((i, n) => i + affixRoll(e, n) - n.low, 0);
}
function Ao(e, t, a, i, n, s) {
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
    if (l.type >= 46 && l.type <= 62 && ht[l.type - 46] === n) {
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
function Do(e, t, a, i) {
  for (const n of equippedAffixes(t))
    ((n.type === 79 && i.startsWith("AC")) || (n.type === 80 && i.startsWith("MAC"))) &&
      e.rng.next(100) < n.rate &&
      (a = Math.floor(a * (1 - affixRoll(e, n) / 100)));
  return a;
}
function Io(e, t, a, i, n, s) {
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
var wi = new WeakMap();
function Ho(e, t, a) {
  let i = wi.get(t);
  (!i || e.time < i.at || e.time - i.at >= 600) &&
    ((i = {
      at: e.time,
      used: 0,
    }),
    wi.set(t, i));
  const n = Math.max(
    0,
    Math.min(Math.floor(a), 8 + Math.floor(t.maxMP * 0.02) - i.used, t.maxMP - t.mp),
  );
  return ((i.used += n), n);
}
function No(e, t, a, i, n) {
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
      .reduce((h, m) => h + affixRoll(e, m), 0);
  if ((s.job !== "Warrior" && (o = Math.min(12, o)), P(t, a) > 1)) o = Math.trunc(o / 2);
  else {
    const h = Q[t.dir];
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
  s.mp += Ho(e, s, Math.min(i, o + Math.floor((i * r) / 100)));
}
function Bo(e, t) {
  for (const a of equippedAffixes(t))
    a.type === 14 && (t.mp = Math.min(t.maxMP, t.mp + affixRoll(e, a)));
}
function To(e, t) {
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
function te(e, t) {
  if (!e || typeof e != "object") throw new b(message("storage.invalidFormat"));
  const a = e.worldVersion;
  if (a !== void 0 && (!Number.isSafeInteger(a) || a < 1))
    throw new b(message("storage.worldVersion"));
  const i = e.dreamRuntimeVersion;
  if (
    i !== void 0 &&
    (!Number.isSafeInteger(i) || i < 1 || i > (t.adaptations.dreamRuntime?.version ?? 0))
  )
    throw new b(message("storage.dreamVersion"));
  const n = $a(ai(e, t), t);
  if (n.sync) {
    const u = n.sync,
      w = (p) => !!p && typeof p == "object" && !Array.isArray(p),
      x = (p) => p === null || (typeof p == "string" && Number.isFinite(Date.parse(p)));
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
      !w(u.baseRoles) ||
      !Object.values(u.baseRoles).every((p) => typeof p == "string") ||
      !w(u.tombstones) ||
      !Object.values(u.tombstones).every(
        (p) => w(p) && (p.deletedAt === void 0 || x(p.deletedAt)),
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
  const s = (u, w = 0, x = Number.MAX_SAFE_INTEGER) => Number.isSafeInteger(u) && u >= w && u <= x;
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
    m = (u) => {
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
              (w) =>
                !w ||
                !(s(w.group, 1, 79) || hi.has(w.group)) ||
                !(s(w.type, 9, 85) || hi.has(w.type)) ||
                !s(w.low) ||
                !s(w.high, w.low, 1e4) ||
                !s(w.rate, 0, 100) ||
                typeof w.revealed != "boolean" ||
                typeof w.text != "string" ||
                w.text.length > 500,
            )))
      )
        throw new b(message("storage.items"));
      ((u.locked === !1 || (u.locked === !0 && !equipmentLockable(u, c.get(u.id)))) &&
        delete u.locked,
        u.weaponGrowth &&
          u.weaponGrowth.level >= oe.cap &&
          (u.weaponGrowth = {
            level: oe.cap,
            xp: 0,
          }),
        bi(
          u,
          t.items.find((w) => w.Index === u.id),
          t.adaptations.dreamRuntime?.affixes,
        ),
        Ua(u, t),
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
        ![u.actionAt, u.moveAt, u.attackAt].every((w) => s(w))
      )
        throw new b(message("storage.actor"));
      o.add(u.id);
      for (const w of u.buffs)
        if (
          (w.spell !== void 0 && typeof w.spell != "string") ||
          typeof w.type != "string" ||
          !s(w.until) ||
          !s(w.next) ||
          !Number.isFinite(w.value) ||
          !f(w.stats) ||
          !s(w.source)
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
            ([x, p]) => x !== "snow" || !s(p, 0, Math.min(Number.MAX_SAFE_INTEGER, n.time + tt)),
          ))) ||
      (u.mountUid !== void 0 && !s(u.mountUid)) ||
      (u.claimedBlessing !== void 0 && typeof u.claimedBlessing != "boolean") ||
      (u.unlockedWaypoints !== void 0 &&
        (!Array.isArray(u.unlockedWaypoints) ||
          new Set(u.unlockedWaypoints).size !== u.unlockedWaypoints.length ||
          u.unlockedWaypoints.some(
            (x) => !t.adaptations.towns?.waypoints?.some((p) => p.id === x),
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
        p = t.adaptations.noviceProgression?.spiritGrowth;
      if (
        !x ||
        !p ||
        ![void 0, 1, 2, 3].includes(x.curveVersion) ||
        !s(x.level, 0, p.cap) ||
        !s(
          x.xp,
          0,
          x.level === p.cap
            ? 0
            : (x.curveVersion === 3
                ? spiritNextXP(p, x.level)
                : x.curveVersion === 2
                  ? [2e3, 8e3, 2e4, 6e4, 1e5, 16e4, 21e4][x.level]
                  : (x.level + 1) * p.experienceStep) - 1,
        )
      )
        throw new b(message("storage.role"));
      It(u, p);
    }
    if (
      (g(u),
      u.assist &&
        (["hpEnabled", "mpEnabled", "flamingSword"].some((x) => typeof u.assist[x] != "boolean") ||
          (u.assist.blazingSword !== void 0 && typeof u.assist.blazingSword != "boolean") ||
          !s(u.assist.hpPercent, 1, 99) ||
          !s(u.assist.mpPercent, 1, 99)))
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
        p = (v) => !!v && typeof v == "object" && !Array.isArray(v);
      if (
        !p(x) ||
        Object.keys(x).some((v) => !["pearls", "altar", "blood"].includes(v)) ||
        (x.pearls !== void 0 &&
          (!p(x.pearls) || typeof x.pearls.active != "boolean" || !s(x.pearls.exchanges))) ||
        (x.altar !== void 0 && (!p(x.altar) || !s(x.altar.stage, 0, 3))) ||
        (x.blood !== void 0 && (!p(x.blood) || !s(x.blood.stage, 0, 2) || !s(x.blood.cycles)))
      )
        throw new b(message("storage.progress"));
    }
    if (u.challengeRewards !== void 0) {
      const x = u.challengeRewards,
        p = (v) => typeof v == "string" && v.length > 0 && v.length <= 100 && /^[\w:-]+$/.test(v);
      if (
        !x ||
        Array.isArray(x) ||
        !s(x.sequence) ||
        !s(x.poCompletions, 0, x.sequence) ||
        !Array.isArray(x.pending) ||
        !Array.isArray(x.claimed) ||
        !x.claimed.every(p) ||
        new Set(x.claimed).size !== x.claimed.length ||
        x.pending.some(
          (v) =>
            !v ||
            !p(v.runId) ||
            !Array.isArray(v.items) ||
            v.items.length < 1 ||
            v.items.length > 2 ||
            x.claimed.includes(v.runId),
        ) ||
        new Set(x.pending.map((v) => v.runId)).size !== x.pending.length
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
          ([x, p]) =>
            !["ore", "wood", "gem", "cloth", "equipment"].includes(x) ||
            !s(p.level, 1, x === "equipment" ? 10 : 9) ||
            !s(p.xp),
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
        p = t.adaptations.guideChallenges?.find((v) => v.id === x.id);
      if (
        !p ||
        x.map !== p.map ||
        x.map !== u.map ||
        !s(x.wave, 0, p.waves.length) ||
        typeof x.started != "boolean" ||
        typeof x.cleared != "boolean" ||
        !s(x.deadline) ||
        !s(x.nextWaveAt) ||
        (x.returnAt !== void 0 && !s(x.returnAt)) ||
        (x.runId !== void 0 &&
          (typeof x.runId != "string" || x.runId.length > 100 || !/^\d+:\d+$/.test(x.runId))) ||
        (x.branch !== void 0 && !["choice", "evil", "settle"].includes(x.branch)) ||
        (x.rewardSealed !== void 0 && typeof x.rewardSealed != "boolean") ||
        (x.cleared && x.wave !== p.waves.length)
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
            x.rewards.some((p) => !c.has(p.item) || !s(p.count, 1, 20))))
      )
        throw new b(message("storage.treasureProgress"));
    }
    if (t.adaptations.adventure.mapIds.includes(u.map) && u.treasureRun?.map !== u.map)
      throw new b(message("storage.missingTreasure"));
    for (const [x, p] of [
      ["inventory", carriedCapacity(u, t)],
      ["equipment", 15],
      ["storage", 80 * (u.storagePages || 1)],
      ["questInventory", 40],
    ]) {
      const v = u[x];
      if (
        !Array.isArray(v) ||
        (v.length !== p &&
          !(x === "inventory" && u.bagLayoutVersion === void 0 && isLegacyBag(u, t)) &&
          !(x === "equipment" && v.length === 14))
      )
        throw new b(message("storage.inventory"));
      for (const k of v) k && m(k);
    }
    for (const x of u.challengeRewards?.pending || [])
      for (const p of x.items) {
        if (
          p.count !== 1 ||
          ![
            20828,
            {
              Warrior: 20864,
              Wizard: 20865,
              Taoist: 20866,
            }[u.job],
          ].includes(p.id)
        )
          throw new b(message("storage.items"));
        m(p);
      }
    if (
      !Array.isArray(u.skills) ||
      !Array.isArray(u.quests) ||
      !Array.isArray(u.completedQuests) ||
      !Array.isArray(u.buffs)
    )
      throw new b(message("storage.progress"));
    const w = new Set();
    for (const x of u.skills) {
      if (
        w.has(x.Spell) ||
        !t.skills.some((p) => p.Spell === x.Spell) ||
        !s(x.Level, 0, t.skills.find((p) => p.Spell === x.Spell)?.DreamRanks?.length || 3) ||
        !s(x.Experience) ||
        !s(x.CastTime)
      )
        throw new b(message("storage.skills"));
      w.add(x.Spell);
    }
    for (const x of u.quests)
      if (
        !t.quests.some((p) => p.Index === x.id) ||
        !x.kills ||
        Object.values(x.kills).some((p) => !s(p))
      )
        throw new b(message("storage.quests"));
    for (const [x, p] of Object.entries(u.buyback || {})) {
      if (
        (!t.world.npcs.some((v) => v.id === Number(x)) &&
          !t.world.retiredNpcIds?.includes(Number(x))) ||
        !Array.isArray(p) ||
        p.length > 20
      )
        throw new b(message("storage.buyback"));
      p.forEach(m);
    }
  }
  for (const [u, w] of Object.entries(n.maps)) {
    if (w.omaNorthwestPlacement !== void 0 && (Number(u) !== 1001 || w.omaNorthwestPlacement !== 1))
      throw new b(message("storage.map"));
    if (!l.has(Number(u)) || !Array.isArray(w.actors) || !w.respawns)
      throw new b(message("storage.map"));
    if (
      w.portals !== void 0 &&
      (!Array.isArray(w.portals) ||
        w.portals.some(
          (x) =>
            !l.has(x.to) ||
            !Array.isArray(x.at) ||
            x.at.length !== 2 ||
            !x.at.every((p) => s(p)) ||
            !Array.isArray(x.landing) ||
            x.landing.length !== 2 ||
            !x.landing.every((p) => s(p)) ||
            (x.expires !== void 0 && !s(x.expires)),
        ))
    )
      throw new b(message("storage.portal"));
    for (const x of w.actors) {
      if ((g(x), x.map !== Number(u) || !["monster", "npc", "spell", "item"].includes(x.kind)))
        throw new b(message("storage.actorKind"));
      if (x.kind === "monster" && !t.monsters.some((p) => p.Index === x.definition))
        throw new b(message("storage.monster"));
      x.item && m(x.item);
    }
  }
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
      (u.trainSpell !== void 0 && !t.skills.some((w) => w.Spell === u.trainSpell))
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


function qo(e, t, a, i, n = {}) {
  const s = U(te(structuredClone(e), i), i),
    o = U(te(structuredClone(t), i), i);
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
      u = s.roles.filter((w) => f(w.name) === f(y.name));
    if (u.length) {
      if (u.length !== 1 || u[0].job !== y.job || c[String(y.id)] !== u[0].id)
        throw Error("mergeDuplicate");
    } else if (Object.hasOwn(c, String(y.id))) throw Error("mergeSelection");
  }
  if (s.roles.length + r.length - l.length > 6) throw Error("mergeFull");
  let h = Math.max(s.nextId, o.nextId);
  const m = () => {
    if (!Number.isSafeInteger(h + 1)) throw Error("mergeInvalid");
    return h++;
  };
  for (const g of r) {
    const y = g,
      u = c[String(y.id)],
      w = s.roles.findIndex((x) => x.id === u);
    ((y.id = w >= 0 ? u : m()), delete y.master, delete y.item);
    for (const x of [
      ...y.inventory,
      ...y.equipment,
      ...y.storage,
      ...y.questInventory,
      ...Object.values(y.buyback || {}).flat(),
      ...(y.challengeRewards?.pending || []).flatMap((p) => p.items),
    ])
      x && (x.uid = m());
    w >= 0 ? (s.roles[w] = y) : s.roles.push(y);
  }
  return ((s.nextId = h), te(s, i));
}
var Mi = "maomao",
  Si = 15e5;
function bt(e, t, a, i = !1) {
  const n = U(te(e, t), t);
  if (!n.roles.length && !Object.keys(n.sync?.tombstones || {}).length && !i)
    throw new b(message("core.cloud-save.encodeCloudSave.9dd87e152d"));
  const s = JSON.stringify({
    version: 1,
    format: "maomao-character-save",
    gameId: Mi,
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
  if (s.length > Si) throw new b(message("core.cloud-save.encodeCloudSave.ef250747c5"));
  return s;
}
function Oo(e) {
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
  return ((t.nextId = a), t);
}
function we(e, t, a = {}) {
  if (typeof e != "string" || !e.length || e.length > Si)
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
    i.format !== "maomao-character-save" ||
    i.gameId !== Mi ||
    !i.snapshot ||
    i.snapshot.storageMode !== "character-only"
  )
    throw new b(message("core.cloud-save.decodeCloudSave.fe073fd64f"));
  const n = U(te(a.remapIds ? Oo(i.snapshot) : i.snapshot, t), t);
  if (!n.roles.length && !Object.keys(n.sync?.tombstones || {}).length && !a.allowEmpty)
    throw new b(message("core.cloud-save.decodeCloudSave.e3fd97ef99"));
  return n;
}
var ki = 2,
  Fo = "~deleted",
  Eo = new Set([
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
  Lo = new Set(["inventory", "storage", "questInventory"]),
  le = (e) =>
    Array.isArray(e)
      ? e.map(le)
      : e && typeof e == "object"
        ? Object.fromEntries(
            Object.keys(e)
              .sort()
              .filter((t) => t !== "uid" && e[t] !== void 0)
              .map((t) => [t, le(e[t])]),
          )
        : e,
  stringify = (e) => JSON.stringify(le(e));
function itemProgress(e) {
  if (!e) return null;
  const { uid: t, buybackAt: a, specialVersion: i, ...n } = e;
  return le(n);
}
function Ci(e) {
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
function Wo(e) {
  const t = {};
  for (const a of Object.keys(e).sort())
    if (!(Eo.has(a) || e[a] === void 0))
      if (Lo.has(a)) t[a] = Ci(e[a]);
      else if (a === "equipment") t[a] = (e[a] || []).map(itemProgress);
      else if (a === "buyback")
        t[a] = Object.fromEntries(
          Object.keys(e[a] || {})
            .sort()
            .filter((i) => e[a][i]?.length)
            .map((i) => [i, Ci(e[a][i])]),
        );
      else if (a === "skills")
        t[a] = (e[a] || [])
          .filter((i) => !i.temporary)
          .map(({ CastTime: i, Key: n, ...s }) => le(s))
          .sort((i, n) => String(i.Spell).localeCompare(String(n.Spell), "en"));
      else if (["quests", "completedQuests", "unlockedWaypoints", "noviceBooks"].includes(a))
        t[a] = (e[a] || []).map(le).sort((i, n) => stringify(i).localeCompare(stringify(n), "en"));
      else if (a === "challengeRewards") {
        const { sequence: i, ...n } = e[a] || {};
        t[a] = le(n);
      } else t[a] = le(e[a]);
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
    projectionVersion: ki,
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
        .map((a) => [a, Fo]),
      ...(e || []).map((a) => [cloudRoleKey(a), Wo(a)]),
    ].sort(([a], [i]) => a.localeCompare(i, "en")),
  );
}
function Go(e) {
  return (typeof e == "string" && (e = JSON.parse(e)), e?.snapshot || e);
}
function Qo(e) {
  const t = Go(e);
  return cloudBaseline(t?.roles || [], t?.sync?.tombstones);
}
function progressFingerprint(e) {
  return stringify({
    projectionVersion: ki,
    roles: Qo(e),
  });
}
var yt = globalThis,
  M,
  $,
  Se = !0,
  xt = !1,
  Vt = !1,
  Fe = performance.now(),
  de = 0,
  Ue = 0,
  vt = Promise.resolve(),
  Ve = new Map(),
  fe = new Map(),
  Kt = 0;
async function Hi(e) {
  const t = fe.get(e);
  if (t) return (fe.delete(e), fe.set(e, t), t.value);
  const a = await fetch(e);
  if (!a.ok) throw new b(message("storage.mapLoad"));
  const i = await a.text(),
    n = JSON.parse(i),
    s = i.length * 2;
  if (s <= 8 * 1024 * 1024)
    for (
      fe.set(e, {
        value: n,
        bytes: s,
      }),
        Kt += s;
      fe.size > 16 || Kt > 8 * 1024 * 1024;

    ) {
      const o = fe.keys().next().value;
      ((Kt -= fe.get(o).bytes), fe.delete(o));
    }
  return n;
}
var z = null,
  ue = {
    deviceId: crypto.randomUUID(),
    deviceName: "",
  },
  semantic = (e) => progressFingerprint(e);
function J(e, t = z) {
  const a = ensureCharacterIds(U(e, M.rules), t);
  if (
    ((a.sync = a.sync
      ? structuredClone(a.sync)
      : {
          ...freshSync(t, ue),
          lastProgressAt: a.lastSaved,
        }),
    a.sync.ownerId !== t)
  )
    throw Error("accountChanged");
  return (a.sync.deviceId === ue.deviceId && (a.sync.deviceName = ue.deviceName), a);
}
function se(e, t = !0) {
  if ((t || e?.ownerId !== void 0) && e?.ownerId !== z) throw Error("accountChanged");
}
function zo(e) {
  if (e === null) return null;
  if (typeof e != "string" || !e.length || e.length > 200 || /[\x00-\x1f]/.test(e))
    throw Error("accountChanged");
  return e;
}
function Ke(e) {
  ((M = e), (Se = !0), Ve.clear(), (Ue = 0), (Fe = performance.now()), (de = 0));
}
function Xe(e, t) {
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
async function Ri() {
  if (z === null) throw Error("accountChanged");
  if (await $.guestBinding()) throw Error("guestBound");
  const e = await $.readOwner(null);
  if (!e?.roles.length) throw Error("missing");
  const t = U(te(e, M.rules), M.rules);
  for (const a of t.roles)
    (!a.cloudId || a.cloudId === legacyCharacterId(null, a)) &&
      (a.cloudId = legacyCharacterId(z, a));
  return (
    (t.sync = {
      ...freshSync(z, ue),
      progressSeq: e.sync?.progressSeq ?? 0,
      lastProgressAt: e.sync?.lastProgressAt ?? e.lastSaved,
      checkpointWrittenAt: new Date().toISOString(),
    }),
    t
  );
}
async function ke(e) {
  if (M.geometry.has(e)) return;
  let t = Ve.get(e);
  t ||
    ((t = (async () => {
      M.loadMap(await Hi(`data/maps/${e}/info.json`));
    })()),
    Ve.set(e, t));
  try {
    await t;
  } catch (a) {
    throw (Ve.delete(e), a);
  }
}


async function ie() {
  const e = new Date().toISOString(),
    t = J(M.save(!1)),
    a = await $.read();
  if (a)
    for (const n of a.roles)
      n.cloudId &&
        !t.roles.some((s) => s.cloudId === n.cloudId) &&
        (t.sync.tombstones[n.cloudId] ??= {
          deletedAt: e,
        });
  const i = a
    ? semantic(t) !== semantic(J(a))
    : !!t.roles.length || !!Object.keys(t.sync.tombstones).length;
  (i &&
    (t.sync.progressSeq++,
    (t.sync.lastProgressAt = e),
    Object.assign(t.sync, ue),
    (t.lastSaved = e)),
    (t.sync.checkpointWrittenAt = e),
    await $.write(t, !i),
    (M.sync = structuredClone(t.sync)),
    (M.lastSaved = t.lastSaved));
  for (let n = 0; n < M.roles.length; n++) M.roles[n].cloudId = t.roles[n].cloudId;
  Ue = M.time;
}
async function Bi() {
  const e = await fetch("data/rules.json");
  if (!e.ok) throw new b(message("storage.rulesLoad"));
  const t = await e.json();
  ((M = new Oe(t, crypto.getRandomValues(new Int32Array(1))[0])), ($ = new Oi()), await $.open());
  const a = await $.read();
  if (a) {
    (t.adaptations.dreamRuntime &&
      !a.dreamRuntimeVersion &&
      (await $.backupOnce("before-dream-runtime-v1", a)),
      t.adaptations.mainline &&
        (Number(a.worldVersion) || 1) < t.adaptations.mainline.worldVersion &&
        (await $.backupOnce(`before-world-v${t.adaptations.mainline.worldVersion}`, a)));
    try {
      M.restore(U(te(a, t), t));
    } catch (n) {
      const s = await $.read("previous");
      if (!s) throw n;
      const o = U(te(s, t), t);
      (M.restore(o),
        await $.write(o, !0),
        M.say(message("storage.recovered")),
        yt.postMessage({
          notification: !0,
          error: message("storage.recovered"),
        }));
    }
  }
  const i = J(M.save(!1));
  return ((M.sync = i.sync), (M.roles = i.roles), M.snapshot());
}
async function Uo(e, t, a) {
  if (e === "init") return Bi();
  if (e === "world") return M.rules.world;
  if (e === "cloud/context") {
    const i = zo(t?.ownerId);
    if (M.active) throw Error("pendingSelection");
    if (t?.deviceId !== void 0) {
      if (
        typeof t.deviceId != "string" ||
        t.deviceId.length > 200 ||
        typeof t.deviceName != "string" ||
        t.deviceName.length > 100
      )
        throw Error("invalid");
      ue = {
        deviceId: t.deviceId,
        deviceName: t.deviceName,
      };
    }
    if (i === z) return ((M.sync = J(M.save(!1)).sync), M.snapshot());
    await ie();
    const n = await $.readOwner(i),
      s = new Oe(M.rules, 1);
    n ? s.restore(J(te(n, M.rules), i)) : (s.sync = freshSync(i, ue));
    const o = J(s.save(!1), i);
    return (
      (o.sync.checkpointWrittenAt = new Date().toISOString()),
      s.restore(o),
      await $.writeOwner(o, i),
      $.selectOwner(i),
      (z = i),
      Ke(s),
      M.snapshot()
    );
  }
  if (e === "cloud/guest") {
    se(t);
    const i = await Ri();
    return {
      roles: i.roles,
      sync: i.sync,
      saveJson: bt(i, M.rules, String(t?.build || ""), !0),
    };
  }
  if (e === "cloud/bind") {
    if ((se(t), z === null)) throw Error("accountChanged");
    if (M.active) throw Error("pendingSelection");
    const i = await Ri(),
      n = J(M.save(!1));
    let s = i;
    if (t?.saveJson) {
      if (typeof t.expectedRoles != "string" || t.expectedRoles !== JSON.stringify(n.roles))
        throw Error("conflict");
      (Xe(t, n.sync),
        (s = J(
          we(t.saveJson, M.rules, {
            allowEmpty: !0,
            remapIds: !0,
          }),
        )),
        (s.sync = Xe(t, s.sync)));
    } else if (M.roles.length || Object.keys(M.sync?.tombstones || {}).length)
      throw Error("conflict");
    const o = t?.remoteSaveJson
      ? we(t.remoteSaveJson, M.rules, {
          allowEmpty: !0,
        })
      : i;
    if (o.sync && o.sync.ownerId !== z) throw Error("accountChanged");
    Ze(s.roles, M.roles);
    const r = new Oe(M.rules, 1);
    return (
      r.restore(s),
      Object.assign(s, U(r.save(!1), M.rules)),
      await $.bindGuest(z, s, n, o),
      Ke(r),
      M.snapshot()
    );
  }
  if (e === "foreground") return (t?.active || (await ie()), M.snapshot(a));
  if (e === "pause")
    return (
      (Se = !!t?.paused),
      (Fe = performance.now()),
      (de = 0),
      Se && (await ie()),
      M.snapshot(a)
    );
  if (e.startsWith("map/")) {
    const [i, n = ""] = e.split("?"),
      s = i.split("/"),
      o = Number(s[1]);
    if (!M.rules.world.maps.some((l) => l.id === o)) throw new b(message("storage.mapRange"));
    const r = new URLSearchParams(n),
      c = s[2] === "chunk" ? `${Number(r.get("x"))}-${Number(r.get("y"))}.json` : "info.json";
    return Hi(`data/maps/${o}/${c}`);
  }
  if (e === "cloud/local") {
    const i = J(M.save(!1)),
      n = await $.readOwner(null),
      s = await $.guestBinding();
    return {
      stage: M.active ? "Game" : "Select",
      roles: i.roles,
      sync: i.sync,
      guestAvailable: z !== null && !s && !!n?.roles.length,
      saveJson: bt(i, M.rules, String(t?.build || ""), !0),
    };
  }
  if (e === "cloud/commit") {
    (se(t), await ie());
    const i = J(M.save(!1));
    return (
      (i.sync = Xe(t, i.sync)),
      (i.sync.checkpointWrittenAt = new Date().toISOString()),
      await $.write(i, !0),
      (M.sync = structuredClone(i.sync)),
      {
        sync: structuredClone(i.sync),
      }
    );
  }
  if (e === "cloud/apply") {
    if ((se(t), M.active)) throw Error("pendingSelection");
    const i = J(M.save(!1));
    if (
      typeof t?.expectedRoles != "string" ||
      JSON.stringify(i.roles) !== t.expectedRoles ||
      (t?.expectedProgress !== void 0 && progressFingerprint(i) !== t.expectedProgress)
    )
      throw Error("conflict");
    const n = J(
      we(t?.saveJson, M.rules, {
        allowEmpty: !0,
        remapIds: !0,
      }),
    );
    (Xe(t, i.sync),
      (n.sync = Xe(t, n.sync)),
      (n.sync.checkpointWrittenAt = new Date().toISOString()),
      Ze(n.roles, M.roles));
    const s = new Oe(M.rules, 1);
    (s.restore(n), Object.assign(n, U(s.save(!1), M.rules)));
    const o = we(t?.remoteSaveJson ?? t?.saveJson, M.rules, {
      allowEmpty: !0,
      remapIds: !t?.remoteSaveJson,
    });
    if (o.sync && o.sync.ownerId !== z) throw Error("accountChanged");
    return (await $.merge(n, o, i, !!t?.manual), Ke(s), M.snapshot());
  }
  if (
    t?.autoSync &&
    (e === "cloud/merge" || e === "cloud/restore") &&
    (M.active || JSON.stringify(U(M.save(!1), M.rules).roles) !== t.expectedRoles)
  )
    throw Error("conflict");
  if (e === "cloud/prepare")
    return (
      se(t, !1),
      await ie(),
      {
        saveJson: bt(M.save(!1), M.rules, String(t?.build || ""), !0),
        sync: structuredClone(M.sync),
      }
    );
  if (e === "cloud/preview") {
    const i = we(t?.saveJson, M.rules, {
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
    if ((se(t, !1), M.active)) throw Error("pendingSelection");
    const i = we(t?.saveJson, M.rules);
    if (i.sync && i.sync.ownerId !== z) throw Error("accountChanged");
    const n = qo(M.save(!1), i, t?.roleIds, M.rules, t?.replacements);
    Ze(n.roles, M.roles);
    const s = new Oe(M.rules, 1);
    return (
      s.restore(n),
      Object.assign(n, U(s.save(!1), M.rules)),
      (s.active = 0),
      (n.sync = structuredClone(M.sync)),
      await $.merge(n, i),
      (s.sync = n.sync),
      Ke(s),
      M.snapshot()
    );
  }
  if (e === "cloud/export-backup") {
    se(t, !1);
    const i = t?.kind === "remote" ? "cloud-merge-remote" : "before-cloud-merge",
      n = await $.read(i);
    if (!n) throw Error("noBackup");
    return {
      saveJson: bt(te(n, M.rules), M.rules, String(t?.build || ""), !0),
    };
  }
  if (e === "cloud/backup")
    return (
      se(t, !1),
      {
        exists: !!(await $.read("before-cloud-read")),
      }
    );
  if (e === "cloud/restore" || e === "cloud/rollback") {
    if ((se(t, !1), M.active)) throw Error("pendingSelection");
    const i = ensureCharacterIds(
      e === "cloud/restore"
        ? we(t?.saveJson, M.rules, {
            allowEmpty: !0,
          })
        : U(te(await $.read("before-cloud-read"), M.rules), M.rules),
      z,
    );
    if (i.sync && i.sync.ownerId !== z) throw Error("accountChanged");
    const n = {
      ...structuredClone(M.sync?.tombstones || {}),
      ...structuredClone(i.sync?.tombstones || {}),
    };
    for (const o of M.roles)
      o.cloudId &&
        !i.roles.some((r) => r.cloudId === o.cloudId) &&
        (n[o.cloudId] ??= {
          deletedAt: new Date().toISOString(),
        });
    for (const o of i.roles) o.cloudId && delete n[o.cloudId];
    ((i.sync = {
      ...structuredClone(M.sync ?? freshSync(z, ue)),
      tombstones: n,
      lastProgressAt: i.sync?.lastProgressAt ?? i.lastSaved,
      checkpointWrittenAt: new Date().toISOString(),
    }),
      Ze(i.roles, M.roles));
    const s = new Oe(M.rules, 1);
    return (
      s.restore(i),
      Object.assign(i, U(s.save(!1), M.rules)),
      (s.active = 0),
      await $.write(i, !1, e === "cloud/restore" ? "before-cloud-read" : void 0),
      (s.sync = i.sync),
      Ke(s),
      M.snapshot()
    );
  }
  if (e === "entry" || e === "open") ((M.active = 0), (Se = !1));
  else if (e === "create")
    ((M.create(String(t?.name || ""), t?.job, t?.gender).cloudId = crypto.randomUUID()),
      await ie());
  else if (e === "delete") {
    if (M.active) throw Error("pendingSelection");
    const i = M.roles.find((s) => (t?.cloudId ? s.cloudId === t.cloudId : s.id === t?.id));
    if (!i) throw Error("missing");
    const n = M.roles;
    M.roles = M.roles.filter((s) => s !== i);
    try {
      await ie();
    } catch (s) {
      throw ((M.roles = n), s);
    }
  } else if (e === "start") {
    const i = M.roles.find((s) => s.id === t?.id);
    if (!i) throw new b(message("storage.roleMissing"));
    const n = i.id;
    (M.restore(U(M.save(!1), M.rules)),
      await ke(M.rules.world.maps.find((s) => s.start).id),
      M.start(n),
      (Ue = M.time),
      M.bringPets(M.me),
      (Se = !1));
  } else if (e === "save") await ie();
  else if (e.startsWith("command/")) {
    if (!xt) return M.snapshot(a);
    if (["command/UseItem", "command/UseItemHotkey"].includes(e) && M.me) {
      const i =
        e === "command/UseItemHotkey"
          ? M.me.inventory.find((n) => n?.id === M.me.itemHotkeys?.[Number(t?.Key)])
          : M.me.inventory.find((n) => n?.uid === Number(t?.UniqueID));
      i && M.defs.get(i.id)?.Type === "TreasureMap" && (await ke(treasureMapId(M, M.me)));
    }
    if (e === "command/CallNPC" && Number(t?.ObjectID) === 9420) {
      const i = String(t?.Key || "")
          .replace(/[\[\]]/g, "")
          .toLowerCase(),
        n = M.rules.adaptations.guideChallenges?.find((s) => "@challenge-" + s.id === i);
      n && (await ke(n.map));
    }
    if (e === "command/CallNPC") {
      const i = String(t?.Key || "")
          .replace(/[\[\]]/g, "")
          .toLowerCase(),
        n = Number(t?.ObjectID),
        s = M.rules.adaptations.lateContent;
      if (s?.fireAltar && n === s.fireAltar.npcId && i === "@late-altar-enter") {
        const o = M.rules.adaptations.guideChallenges?.find((r) => r.id === s.fireAltar.challenge);
        o && (await ke(o.map));
      }
      if (s?.secretTicket && n === s.secretTicket.npcId) {
        const o = s.secretTicket.shortcuts.find((r) => "@late-secret-" + r.map === i);
        o && (await ke(o.map));
      }
    }
    (e === "command/CallNPC" &&
      Number(t?.ObjectID) === M.rules.adaptations.trial?.entranceNpc &&
      String(t?.Key).includes("@trialenter") &&
      (await ke(M.rules.adaptations.trial.map)),
      M.command(e.slice(8), t),
      M.me && (await ke(M.me.map), M.initializeMap(M.me.map), M.bringPets(M.me), zt(M, M.me), Ti()),
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
  return M.snapshot(a);
}


const Vo = (e) => {
  const { id: t, route: a, data: i, after: n = -1 } = e.data;
  (a === "foreground" && ((xt = !!i?.active), (Fe = performance.now()), (de = 0), qi()),
    (vt = vt.then(async () => {
      Vt = !0;
      try {
        yt.postMessage({
          id: t,
          result: await Uo(a, i, n),
        });
      } catch (s) {
        yt.postMessage({
          id: t,
          error: Xt(s),
        });
      } finally {
        ((Vt = !1), qi());
      }
    })));
};
var Je;
function Ti() {
  const e = M.me?.map;
  for (const a of Object.keys(M.maps)) Number(a) !== e && delete M.maps[Number(a)];
  const t = M.rules.world.maps.find((a) => a.start).id;
  for (const a of M.geometry.keys()) a !== e && a !== t && (M.geometry.delete(a), Ve.delete(a));
  M.events = M.events.filter((a) => a.map === e);
}
function qi() {
  const e = !!M?.me && !Se && xt;
  (!e && Je !== void 0 && (clearInterval(Je), (Je = void 0), (de = 0)),
    e && Je === void 0 && ((Fe = performance.now()), (de = 0), (Je = setInterval(Ko, 20))),
    M && !M.me && Ti());
}
function Ko() {
  const e = performance.now(),
    t = e - Fe;
  if (((Fe = e), !M || Se || !xt || Vt || !M.me)) return;
  de += Math.min(t, 200);
  let a = 0;
  for (; de >= 20 && a++ < 10; ) (M.tick(20), (de -= 20));
  M.time - Ue >= 3e4 &&
    ((Ue = M.time),
    (vt = vt.then(ie).catch((i) =>
      yt.postMessage({
        error: String(i),
        notification: !0,
      }),
    )));
}
async function Zo() {
  await Bi();
}
export { Vo as handleCoreMessage, Zo as initializeCore };

