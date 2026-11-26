// singleplayer/core/text.ts
var message = (key, params = {}) => ({ $text: key, params });
var LocalizedError = class extends Error {
  detail;
  constructor(detail) {
    super(detail.$text);
    this.name = "LocalizedError";
    this.detail = detail;
  }
};

// singleplayer/core/rules.ts
var f = Math.fround;
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

// singleplayer/core/equipment-management.ts
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
export {
  assertEquipmentDisposable,
  bulkSaleSelection,
  equipmentLockable,
  equipmentLocked,
  saleQualities,
  saleQuality,
  saleSpecial,
  sellEquipmentBatch,
  setEquipmentLock,
};

