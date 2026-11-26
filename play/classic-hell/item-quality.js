// singleplayer/core/text.ts
var message = (key, params = {}) => ({ $text: key, params });

// singleplayer/core/weapon-growth.ts
var weaponGrowthRule = { cap: 10, experiencePerLevel: 7e4 };

// singleplayer/core/item-quality.ts
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
function equipmentQuality(item) {
  return dreamQualities[Math.min(8, Math.floor(exceptionalPoints(item)))];
}
function hasUnidentified(item) {
  return !!item?.affixes?.some((a) => !a.revealed);
}
function exceptionalColor(item) {
  if (hasUnidentified(item)) return "#ff9b32";
  if (item?.added.GemTier) return item.added.GemTier === 2 ? "#ffd45c" : "#b98cff";
  return equipmentQuality(item).color;
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
export {
  dreamQualities,
  dreamSetStates,
  equipmentQuality,
  exceptionalColor,
  exceptionalPoints,
  hasUnidentified,
  weaponGrowthRule,
};

