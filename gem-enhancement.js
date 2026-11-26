// singleplayer/core/text.ts
var message = (key, params = {}) => ({ $text: key, params });

// singleplayer/core/item-quality.ts
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

// singleplayer/core/boss-loot.ts
function hasBossLootBudget(monster, rules) {
  return monster.IsBoss || rules.adaptations.bossLoot.monsters.includes(monster.Name);
}

// singleplayer/core/gem-enhancement.ts
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
function gemTierName(item) {
  return message("gem.tier." + gemTier(item));
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
function gemDescription(def, item, cfg) {
  if ([1, 2, 5, 6].includes(def.Shape))
    return [message("gem.repairMaterial"), message("gem.selectEquipment")];
  if (![3, 4].includes(def.Shape)) return [message("gem.unavailable")];
  const { stat, gain } = gemMain(def, item),
    effects = gemPowers(item),
    limits = gemLimits(def, item);
  return [
    ...(cfg.itemIds.includes(def.Index)
      ? [message("gem.quality", { quality: gemTierName(item) })]
      : []),
    message("gem.success", { effect: gemEffectText(stat, gain) }),
    ...Object.entries(effects).map(([k, v]) => gemEffectText(k, v)),
    message("gem.chance", { chance: limits.baseChance }),
    message("gem.chanceStep", { step: limits.chanceStep }),
    message("gem.countLimit", { count: limits.countLimit }),
    message("gem.statLimit", { limit: limits.statLimit }),
    ...Object.keys(effects).map((k) =>
      message("gem.effectCap", {
        stat: gemStatNames[k],
        cap: cfg.caps[k],
        unit: k.endsWith("Percent") ? "%" : message("gem.points"),
      }),
    ),
    ...(Object.keys(effects).some(
      (k) =>
        k.startsWith("Gem") &&
        ![
          "GemCriticalRatePercent",
          "GemLifeStealPercent",
          "GemGuardPercent",
          "GemHealingPercent",
        ].includes(k),
    )
      ? [message("gem.damageCap", { cap: cfg.damageBonusCap })]
      : []),
    message("gem.consumption"),
  ];
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
          (n, [key, spells]) => n + (spells.includes(spell || "") ? owner.stats[key] || 0 : 0),
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
export {
  absorbGemGuard,
  capGemStats,
  gemDamageBonus,
  gemDamageSpells,
  gemDescription,
  gemEffectText,
  gemHealingBonus,
  gemLifeSteal,
  gemLimits,
  gemMain,
  gemPowers,
  gemStatNames,
  gemTier,
  gemTierName,
  rollGem,
  upgradeStatNames,
};

