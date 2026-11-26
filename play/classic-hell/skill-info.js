// singleplayer/core/text.ts
var message = (key, params = {}) => ({ $text: key, params });
var entityText = (kind, id, field = "name") => ({ $entity: kind, id: String(id), field });

// singleplayer/core/hydra-balance.ts
var hydraLevel = (level) => Math.min(7, Math.max(0, Math.trunc(level)));
function hydraStats(d, level) {
  const row = d.HydraRanks?.[hydraLevel(level)];
  if (!row) throw Error("Missing Hydra rank configuration");
  return row;
}

// singleplayer/core/dream-skills.ts
function poisoningDamage(level, stats) {
  return (
    Math.max(
      1,
      Math.floor(4 * level + Math.max(0, ((stats.MinSC || 0) + (stats.MaxSC || 0)) / 2) * 0.2),
    ) + Math.max(0, stats.AffixPoisonDamage || 0)
  );
}
function skillCost(d, level, stats = {}) {
  let cost = d.DreamSkill
    ? d.DreamSkill.costBase + Math.max(0, level - 1) * d.DreamSkill.costStep
    : d.BaseCost + level * d.LevelCost;
  if (["Teleport", "Blink"].includes(d.Spell))
    cost += Math.trunc((cost * (stats.TeleportManaPenaltyPercent || 0)) / 100);
  return Math.max(0, Math.trunc(cost * (1 + (stats.ManaPenaltyPercent || 0) / 100)));
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
function dreamSkillDetails(d, l, stats) {
  if (d.Spell === "Hydra") {
    const row = hydraStats(d, l),
      damage = (mc) =>
        Math.trunc(Math.fround(Math.fround(mc + row.power) * Math.fround(row.mcPercent / 100)));
    return {
      cost: skillCost(d, l, stats),
      passive: false,
      effects: [
        message("skill.hydra.damage", {
          base: row.power,
          percent: row.mcPercent,
          low: damage(stats.MinMC || 0),
          high: damage(stats.MaxMC || 0),
        }),
        message("skill.hydra.timing", {
          seconds: row.durationMs / 1e3,
          interval: row.intervalMs / 1e3,
        }),
        message("skill.hydra.single"),
      ],
    };
  }
  const n = d.DreamSkill,
    rank = Math.min(l, d.DreamRanks.length),
    a = dreamBasicPower(d, l),
    low2 = dreamBasicPower(d, l, void 0, false),
    co = dreamCoefficient(d, l),
    kind = d.DreamOriginalId >= 56 ? "SC" : "MC";
  let effects = [];
  if (n.powerStep || n.powerBase) {
    const lo = Math.floor(((stats["Min" + kind] || 0) + low2) * co),
      hi = Math.floor(((stats["Max" + kind] || 0) + a) * co);
    effects = [
      message("skill.effect.4354a1358678", {
        p0: low2 === a ? a : low2 + "\u2013" + a,
        p1: Math.round(co * 100),
      }),
      message("skill.effect.dfb4ca8a13b1", {
        p0:
          kind === "SC"
            ? message("skill.effect.df71d0567504")
            : message("skill.effect.f92fd0c0b8c9"),
        p1: lo,
        p2: hi,
      }),
    ];
  }
  const descriptions = d.DreamRanks?.[rank - 1]?.Descs;
  if (descriptions)
    effects.push(
      ...Object.entries(descriptions)
        .filter(([, v]) => !v.includes("\u5F31\u70B9"))
        .map(([key]) => entityText("skills", d.Spell, `rank.${rank}.desc.${key}`)),
    );
  switch (d.Spell) {
    case "Steadfast":
      effects = [
        message("skill.effect.3d1eb35a789f", { p0: dreamPassiveStats(d, l).NoFlinchPercent }),
      ];
      break;
    case "FireWall":
      effects.push(message("skill.effect.85bf7fca3c60"));
      effects.push(message("skill.effect.9e02bc77d106"));
      break;
    case "PoisonCloud":
      effects.push(
        message("skill.effect.9bfdce449ad2", { p0: [1, 2, 1.5, 1.2][l] ?? 1 }),
        message("skill.effect.ff369aa18e0c", { p0: Math.round(100 / Math.max(1, 8 - l)) }),
      );
      break;
    case "DragonFlame":
      effects.push(message("skill.effect.704ec5cea2eb"));
      break;
    case "MeteorStrike":
      effects.push(message("skill.effect.f6f6eb681eb4"));
      break;
    case "FireBang":
    case "IceStorm":
      effects.push(message("skill.effect.e2d8b3798bc1"));
      break;
    case "FrostCrunch":
    case "IceFlame":
      effects.push(message("skill.effect.1adcd773e6de"), message("skill.effect.c935f519e78b"));
      break;
    case "FlameDisruptor":
      effects.push(message("skill.effect.86b9b1ffa559"));
      break;
    case "ThunderStorm":
      effects.push(message("skill.effect.0031092086f3"));
      break;
    case "Thrusting":
    case "HalfMoon":
      effects.push(message("skill.effect.1f031e128239", { p0: Math.round(co * 100) }));
      break;
    case "FlamingSword":
    case "BlazingSword":
      effects.push(
        message("skill.effect.cea500ba269a", {
          p0: Math.round(co * 100),
          p1: d.Spell === "FlamingSword" ? 6 : 10,
        }),
      );
      if (d.Spell === "BlazingSword") effects.push(message("skill.effect.fdf80f83267c"));
      break;
    case "SkyCleaver":
      effects.push(
        message("skill.effect.e3789b95cb75", {
          p0: Math.min(20, 6 + 2 * l),
          p1: Math.round(co * 100),
        }),
      );
      break;
    case "WhirlwindSlash":
      effects.push(
        message("skill.effect.5baecdadcb62", { p0: Math.round(co * 100) }),
        message("skill.effect.8a5bd4a1dc90", { p0: Math.min(100, l * 2) }),
      );
      break;
    case "Slaying":
      effects = [message("skill.effect.efa3dfeb28d5", { p0: 140 + 10 * l })];
      break;
    case "Poisoning":
      effects = [
        message("skill.effect.f22217ae2faf", { p0: poisoningDamage(l, stats) }),
        message("skill.effect.e91ae38d99df", { p0: Math.min(100, l * 4) }),
        message("skill.effect.6f4e455d9141"),
      ];
      break;
    case "SoulFireBall":
      effects.push(message("skill.effect.ad8d837ad17a"));
      break;
    case "Hiding":
      effects.push(message("skill.effect.d6ee03f9f937"));
      break;
    case "BlessedArmour":
      effects.push(message("skill.effect.474d5e3129c9"), message("skill.effect.7e63ac5a3e7c"));
      break;
    case "GhostBurn":
      effects.push(message("skill.effect.b9f693540961"));
      break;
    case "ChainThunder":
      effects.push(message("skill.effect.3e06b9a5976a"), message("skill.effect.db613b10bcd4"));
      break;
    case "MagicShield":
      effects.push(message("skill.effect.783a1136a9ec"), message("skill.effect.f0d470660334"));
      break;
    case "InnateQi":
      effects.push(message("skill.effect.3ddc5715ddad"), message("skill.effect.77643a4a06a9"));
      break;
    case "DiamondBody":
      effects.push(message("skill.effect.f06caa486214"));
      break;
    case "BeastArmour":
      effects = [message("skill.effect.45912633b3fa"), message("skill.effect.75a9092ca5b7")];
      break;
    case "LionRoar":
      effects.push(message("skill.effect.0b6fc4be680b"));
      break;
    case "FlashSlash":
      effects.push(message("skill.effect.217c93c42871", { p0: l + 1, p1: (l + 4) / 2 }));
      break;
    case "SummonMoonSpirit":
      effects.push(
        message("skill.effect.d896fe93f0c9", { p0: rank >= 3 ? 2 : 1 }),
        message("skill.effect.f50e394fc515", { p0: rank * 5, p1: (0.6 + 0.3 * rank).toFixed(1) }),
      );
      break;
    case "SummonSkeleton":
    case "SummonShinsu":
    case "AdvancedSummon":
    case "SummonTiger":
      effects.push(message("skill.effect.806bfbf54284"));
      break;
    case "ElectricShock":
      effects = [
        message("skill.effect.df7381b5b59d", { p0: l === 1 ? 1 : 3 }),
        message("skill.effect.4e9dbc244db4"),
        message("skill.effect.20806335f0dc"),
      ];
      break;
    case "Abyss":
      effects = [
        message("skill.effect.99913d05244e", { p0: 3 + rank }),
        message("skill.effect.b21b30cab539", { p0: [0, 6, 7, 8, 9, 10, 12][rank] }),
        ...(rank >= 4
          ? [message("skill.effect.criticalChance", { p0: [10, 15, 25][rank - 4] })]
          : []),
      ];
      break;
  }
  if (
    [
      "SummonSpiritServant",
      "SummonSkeleton",
      "SummonShinsu",
      "AdvancedSummon",
      "SummonTiger",
      "SummonMoonSpirit",
    ].includes(d.Spell) &&
    (stats.AffixSummonDamage || 0) > 0
  )
    effects.push(message("skill.summon.affixDamage", { p0: stats.AffixSummonDamage }));
  if (!effects.length)
    effects = [entityText("skills", d.Spell, d.DreamDescription ? "description" : "name")];
  return { cost: skillCost(d, l, stats), effects, passive: n.passive };
}

// singleplayer/core/rules.ts
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

// singleplayer/core/skill-info.ts
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
var pct = (n) => `${Number(n.toFixed(2))}%`;
function skillRankDetails(d, level, stats, roleLevel) {
  if (d.DreamSkill) return dreamSkillDetails(d, level, stats);
  const s = d.Spell,
    l = level,
    stat = (key) => stats[key] || 0;
  const range = (fn, kind = "MC") => {
    const a = fn(stat("Min" + kind), low),
      b = fn(stat("Max" + kind), high);
    return a === b ? `${a}` : `${a}\u2013${b}`;
  };
  const damage = (kind = "MC") => range((p, r) => magicDamage(d, l, p, r), kind);
  const sc = (fn) => range((p) => fn(p), "SC");
  let cost = d.BaseCost + l * d.LevelCost;
  if (["Teleport", "Blink"].includes(s))
    cost += Math.trunc((cost * stat("TeleportManaPenaltyPercent")) / 100);
  cost += Math.trunc((cost * stat("ManaPenaltyPercent")) / 100);
  if (["HalfMoon", "CrossHalfMoon", "FlamingSword", "TwinDrakeBlade", "CounterAttack"].includes(s))
    cost = d.BaseCost + l * d.LevelCost;
  if (s === "Plague") cost = stat("MinSC") + stat("MaxSC");
  let effects = [];
  const passive = passiveSkillStats(s, l);
  if (Object.keys(passive).length) {
    cost = 0;
    effects = [message("skill.effect.8976d7f81cf0", { p0: passive.Accuracy })];
    if (s === "Slaying")
      effects.push(
        message("skill.effect.241bb6073551", { p0: passive.MaxDC }),
        message("skill.effect.783547c6480e", { p0: pct(((l + 1) / 12) * 100) }),
      );
  } else
    switch (s) {
      case "FireBall":
      case "GreatFireBall":
        effects = [message("skill.effect.fe3798fa9b14", { p0: damage() })];
        break;
      case "SoulFireBall":
        effects = [
          message("skill.effect.90cad428ad4f", { p0: damage("SC") }),
          message("skill.effect.ad8d837ad17a"),
        ];
        break;
      case "ThunderBolt":
        effects = [
          message("skill.effect.fe3798fa9b14", { p0: damage() }),
          message("skill.effect.7ba1b4c04dd3", {
            p0: range((p, r) => Math.trunc(magicDamage(d, l, p, r) * 1.5)),
          }),
        ];
        break;
      case "FlameDisruptor":
        effects = [
          message("skill.effect.fe3798fa9b14", { p0: damage() }),
          message("skill.effect.f69438bf0812"),
        ];
        break;
      case "FrostCrunch":
        effects = [
          message("skill.effect.fe3798fa9b14", { p0: damage() }),
          message("skill.effect.9bd3bc18ae41", { p0: pct((l + 1) * 5), p1: pct((l + 1) * 2.5) }),
        ];
        break;
      case "Vampirism":
        effects = [
          message("skill.effect.fe3798fa9b14", { p0: damage() }),
          message("skill.effect.eae6d0842b23", { p0: (l + 1) * 25 }),
        ];
        break;
      case "FireBang":
      case "IceStorm":
        effects = [message("skill.effect.df354f0508f8", { p0: damage() })];
        break;
      case "HellFire":
        effects = [
          message("skill.effect.46a233981864", { p0: damage() }),
          l === 3 ? message("skill.effect.14b3a54fc504") : message("skill.effect.26ce139f54bb"),
        ];
        break;
      case "Lightning":
        effects = [message("skill.effect.39ab3804905b", { p0: damage() })];
        break;
      case "ThunderStorm":
      case "FlameField":
        effects = [message("skill.effect.87d0e2028f5c", { p0: damage() })];
        if (s === "ThunderStorm") effects.push(message("skill.effect.62488b477828"));
        break;
      case "FireWall":
        effects = [
          message("skill.effect.d38f5205d41f", { p0: damage() }),
          message("skill.effect.c671ffc0a569", {
            p0: range((p, r) => 10 + Math.trunc(magicDamage(d, l, p, r) / 2)),
          }),
        ];
        break;
      case "Blizzard":
      case "MeteorStrike":
        effects = [
          message("skill.effect.e2f2a56e5adc", { p0: damage() }),
          message("skill.effect.6fdd9e8d5972"),
        ];
        if (s === "Blizzard") effects.push(message("skill.effect.a1a8f74f7711"));
        break;
      case "Healing":
        effects = [
          message("skill.effect.cda5b3b109f2", {
            p0: range((p, r) => magicDamage(d, l, p * 2, r) + roleLevel, "SC"),
          }),
          message("skill.effect.2331a0c22023"),
        ];
        break;
      case "MassHealing":
        effects = [message("skill.effect.cf93a22eb8ba", { p0: damage("SC") })];
        break;
      case "MagicShield":
        effects = [
          message("skill.effect.f14f864cfaa8", { p0: (l + 2) * 10 }),
          message("skill.effect.238b317e9f63", {
            p0: range((p, r) =>
              roundEven(
                ((p + 15) / 4) * (l + 1) +
                  (d.PowerBonus > 0
                    ? r.next(d.PowerBase + d.PowerBonus, d.PowerBase)
                    : d.PowerBase),
              ),
            ),
          }),
        ];
        break;
      case "ProtectionField":
        effects = [
          message("skill.effect.5c6920885e3c", {
            p0: roundEven(stat("MaxAC") * (0.2 + 0.03 * l)),
            p1: 20 + 3 * l,
          }),
          message("skill.effect.c671ffc0a569", { p0: 45 + 15 * l }),
        ];
        break;
      case "Rage":
        effects = [
          message("skill.effect.2486865231e2", {
            p0: roundEven(stat("MaxDC") * (0.12 + 0.03 * l)),
            p1: 12 + 3 * l,
          }),
          message("skill.effect.c671ffc0a569", { p0: 18 + 6 * l }),
        ];
        break;
      case "MagicBooster":
        effects = [
          message("skill.effect.2deb7f6f23d6", { p0: 6 + 6 * l }),
          message("skill.effect.6b5246a508a8", { p0: 6 + l }),
        ];
        break;
      case "Fury":
        effects = [message("skill.effect.197a6e355ba5", { p0: 60 + 10 * l })];
        break;
      case "CounterAttack":
        effects = [
          message("skill.effect.b896198ced9c", { p0: 11 + 3 * l }),
          message("skill.effect.ae684f1acc5a", { p0: 70 + 10 * l }),
        ];
        break;
      case "Thrusting":
        cost = 0;
        effects = [
          message("skill.effect.5187faebe04d", { p0: stat("MinDC"), p1: stat("MaxDC") }),
          message("skill.effect.1811de8e0041"),
        ];
        break;
      case "HalfMoon":
      case "CrossHalfMoon":
        effects = [
          message("skill.effect.911261445f52", {
            p0:
              s === "HalfMoon"
                ? message("skill.effect.1df611a34ccc")
                : message("skill.effect.b56e966b25fd"),
            p1: stat("MinDC"),
            p2: stat("MaxDC"),
          }),
          message("skill.effect.2c85a082131f"),
        ];
        break;
      case "FlamingSword":
      case "TwinDrakeBlade":
        effects = [
          message("skill.effect.c83e87760eb7", { p0: damage("DC") }),
          s === "TwinDrakeBlade"
            ? message("skill.effect.21a920d908d5", { p0: l + 2 })
            : message("skill.effect.bd1fa5db83e9"),
        ];
        break;
      case "ShoulderDash":
        effects = [
          message("skill.effect.6439a6d82408", { p0: l + 2, p1: l + 3 }),
          message("skill.effect.282196a21abe", {
            p0: magicDamage(d, l, 0, low),
            p1: magicDamage(d, l, 0, high),
          }),
        ];
        break;
      case "BladeAvalanche":
        effects = [
          message("skill.effect.42319d5ba20b", { p0: damage("DC") }),
          message("skill.effect.3cd83cd933bb"),
        ];
        break;
      case "SummonSkeleton":
      case "SummonShinsu":
      case "SummonHolyDeva":
        effects = [
          message("skill.effect.4c36abb4369c", {
            p0: l,
            p1: s === "SummonSkeleton" ? 4 + l : 1 + l * 2,
          }),
          message("skill.effect.fe65fcfe2e4b", {
            p0: s === "SummonSkeleton" ? 1 : s === "SummonShinsu" ? 5 : 2,
          }),
        ];
        break;
      case "Hiding":
        effects = [
          message("skill.effect.e9ccd8b379d5", { p0: sc((p) => p + (l + 1) * 5) }),
          message("skill.effect.b4d920e4eb01"),
        ];
        break;
      case "MassHiding":
        effects = [
          message("skill.effect.586bcf9517aa", { p0: sc((p) => Math.floor(p / 2) + (l + 1) * 2) }),
          message("skill.effect.fc8c213d96bc"),
        ];
        break;
      case "Purification":
        effects = [message("skill.effect.c3c52a8dd57a", { p0: (l + 1) * 25 })];
        break;
      case "Revelation":
        effects = [
          message("skill.effect.ab7d6f3944ad", { p0: (l + 1) * 25 }),
          message("skill.effect.c671ffc0a569", {
            p0: range((p, r) => p + magicPower(d, l, r), "SC"),
          }),
        ];
        break;
      case "SoulShield":
      case "BlessedArmour":
        effects = [
          message("skill.effect.d854c283c180", {
            p0:
              s === "SoulShield"
                ? message("skill.effect.a6d6689aaf2a")
                : message("skill.effect.75ba7a572706"),
          }),
          message("skill.effect.0108c701d247", { p0: sc((p) => 4 * p + (l + 1) * 50) }),
        ];
        break;
      case "UltimateEnhancer":
        effects = [
          message("skill.effect.6895a0243d25", {
            p0: Math.min(8, stat("MaxSC") >= 5 ? Math.floor(stat("MaxSC") / 5) : 1),
          }),
          message("skill.effect.0108c701d247", { p0: sc((p) => 4 * p + (l + 1) * 50) }),
        ];
        break;
      case "PetEnhancer":
        effects = [
          message("skill.effect.2ce543d7ad7c"),
          message("skill.effect.c671ffc0a569", {
            p0: range((p, r) => p + magicPower(d, l, r), "SC"),
          }),
        ];
        break;
      case "EnergyShield":
        effects = [
          message("skill.effect.a6fb3c6b0614", {
            p0: 30 + 50 * l,
            p1: roundEven(100 / Math.max(2, 10 - (Math.trunc(stat("Luck") / 3) + l + 1))),
          }),
          message("skill.effect.c752283bb60a", {
            p0: sc((p) => roundEven((p / 4) * (l + 1) + d.PowerBase)),
          }),
        ];
        break;
      case "Poisoning":
        effects = [
          message("skill.effect.88efb71df923", { p0: sc((p) => (p * 2 + (l + 1) * 7) * 2) }),
          message("skill.effect.a30149786572", { p0: sc((p) => Math.floor(p / 15) + l + 1) }),
          message("skill.effect.6f4e455d9141"),
        ];
        break;
      case "PoisonCloud":
        effects = [
          message("skill.effect.e1f78c4cd2d9", { p0: damage("SC") }),
          message("skill.effect.51f6c3e18b8b"),
        ];
        break;
      case "HealingCircle":
        effects = [
          message("skill.effect.26de69a0c75c", { p0: 10 + 5 * l }),
          message("skill.effect.11bc57136d40"),
          message("skill.effect.325cee3f17f5", { p0: damage("SC") }),
        ];
        break;
      case "Repulsion":
      case "EnergyRepulsor":
        effects = [
          message("skill.effect.d5044b0c34a0", {
            p0: 1 + Math.max(0, l - 1),
            p1: 2 + Math.max(0, l - 1),
          }),
          message("skill.effect.51bf4bef258f", { p0: 6 + 3 * l }),
        ];
        break;
      case "LionRoar":
        effects = [
          message("skill.effect.b1dbe9f73bd8", { p0: l + 2 }),
          message("skill.effect.7fc171a1814a"),
        ];
        break;
      case "TrapHexagon":
        effects = [
          message("skill.effect.c777f5d39435", { p0: 10 + 5 * l }),
          message("skill.effect.607545992977"),
        ];
        break;
      case "Entrapment":
        effects = [
          message("skill.effect.9d6424001fbf", { p0: roundEven((l + 1) * 0.8) }),
          message("skill.effect.bf0314416463", { p0: (l + 1) * 3 + 9 }),
        ];
        break;
      case "TurnUndead":
        effects = [
          message("skill.effect.74c22b907d7d", { p0: 8 * (l + 1) + 15 }),
          message("skill.effect.ce6a05590679"),
        ];
        break;
      case "ElectricShock":
        effects = [
          message("skill.effect.c800ebe20bc4", { p0: pct(100 / (4 - l)), p1: l + 2 }),
          message("skill.effect.2c42483571dc", { p0: 1 + 2 * l }),
          message("skill.effect.250b2adc7f60"),
        ];
        break;
      case "Hallucination":
        effects = [
          message("skill.effect.1ae1edb2b52a", { p0: 20 + 5 * l }),
          message("skill.effect.ce9405a8bc05"),
        ];
        break;
      case "Curse":
        effects = [
          message("skill.effect.de89c8fb8490", { p0: [15, 20, 30, 40][l], p1: 3 + 2 * l }),
          message("skill.effect.4a20e89762c4", { p0: damage("SC") }),
        ];
        break;
      case "Plague":
        effects = [
          message("skill.effect.9ce9ef99daf7", { p0: stat("MaxSC") * 2 }),
          message("skill.effect.8578a65336d4", {
            p0: sc((p) => 2 * (l + 1) + Math.floor(magicDamage(d, l, p, low) / 10)),
          }),
        ];
        break;
      case "Blink":
        effects = [
          message("skill.effect.388811a6fc07", { p0: (l + 1) * 25 }),
          message("skill.effect.6d171f729afb"),
        ];
        break;
      case "Teleport":
        effects = [
          message("skill.effect.3ee064479e5c", { p0: l + 1 }),
          message("skill.effect.6d171f729afb"),
        ];
        break;
      case "Mirroring":
        effects = [message("skill.effect.03cc16996d82")];
        break;
      default:
        effects = [message("skill.effect.5451006b675d")];
    }
  return { cost, effects, passive: Object.keys(passive).length > 0 };
}


export { passiveSkillStats, skillCost, skillRankDetails };

