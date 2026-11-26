// singleplayer/core/darkforged.ts
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
var isPowerStat = (key) => powerSet.has(key);
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
function dxState(item) {
  return item?.dx;
}
function dxRarity(item) {
  return item?.dx?.rarity || "normal";
}
function dxColor(cfg, item) {
  const r = dxRarity(item);
  return r === "normal" || !cfg ? void 0 : cfg.colors[r];
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
var add = (out, stats, sign = 1) => {
  for (const [k, v] of Object.entries(stats || {}))
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
  const keys = dx.runes.map((id) => runeDef(cfg, id)?.key);
  return cfg.runewords.find(
    (w) =>
      w.types.includes(def.Type) &&
      w.runes.length === keys.length &&
      w.runes.every((k, i) => k === keys[i]),
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
function capPowers(cfg, stats) {
  for (const [k, cap] of Object.entries(cfg.powerCaps))
    if (stats[k] !== void 0) stats[k] = Math.min(cap, Math.max(0, stats[k]));
}
function dxNameParts(cfg, item) {
  const dx = item.dx;
  if (!cfg || !dx) return null;
  if (dx.rarity === "legendary") return { kind: "legendary", legendary: dx.legendary };
  if (dx.rarity === "set") return { kind: "set", set: dx.set, piece: dx.piece };
  if (dx.rarity === "rare") return { kind: "rare", rare: dx.rareName || [0, 0] };
  if (dx.rarity === "magic") {
    const prefix = dx.affixes.find((a) => affixDef(cfg, a.id)?.side === "prefix"),
      suffix = dx.affixes.find((a) => affixDef(cfg, a.id)?.side === "suffix");
    return { kind: "magic", prefix: prefix?.id, suffix: suffix?.id };
  }
  return null;
}
export {
  affixDef,
  affixIndex,
  broken,
  capPowers,
  dxColor,
  dxEligible,
  dxItemStats,
  dxLevelRequirement,
  dxNameParts,
  dxRarity,
  dxRequiredLevel,
  dxRuneword,
  dxSetBonusStats,
  dxSetStates,
  dxState,
  isPowerStat,
  percentStats,
  powerStats,
  rarities,
  runeDef,
  socketGroup,
};

