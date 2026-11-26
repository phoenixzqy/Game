// Protocol 2: recovery bytes and durable character progress have different jobs.
// Change this version whenever the progress projection changes.
export const PROJECTION_VERSION = 2;
export const DELETED = "~deleted";
const volatileRole = new Set([
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
]);
const bags = new Set(["inventory", "storage", "questInventory"]);
const ordered = (value) =>
  Array.isArray(value)
    ? value.map(ordered)
    : value && typeof value === "object"
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .filter((k) => k !== "uid" && value[k] !== undefined)
            .map((k) => [k, ordered(value[k])]),
        )
      : value;
const stringify = (value) => JSON.stringify(ordered(value));
function itemProgress(item) {
  if (!item) return null;
  const { uid, buybackAt, specialVersion, ...rest } = item;
  return ordered(rest);
}
function bagProgress(items) {
  const groups = new Map();
  for (const item of (items || []).filter(Boolean)) {
    const { count, ...asset } = itemProgress(item),
      key = stringify(asset),
      entry = groups.get(key) || { ...asset, count: 0 };
    entry.count += count ?? 1;
    groups.set(key, entry);
  }
  return [...groups.values()].sort((a, b) => stringify(a).localeCompare(stringify(b), "en"));
}
export function roleProgress(role) {
  const result = {};
  for (const key of Object.keys(role).sort()) {
    if (volatileRole.has(key) || role[key] === undefined) continue;
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
  // Optional empty collections and omitted defaults must not fork a migrated save.
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
export function legacyRoleKey(role) {
  return (
    role.name.trim().normalize("NFKC").toLocaleLowerCase("en-US") + "|" + String(role.job || "")
  );
}
export function cloudRoleKey(role) {
  return role.cloudId || "legacy:" + legacyRoleKey(role);
}
// Stable migration identity is scoped to the account. New characters always get
// random UUIDs in the worker; legacy identity never licenses a content overwrite.
export function legacyCharacterId(ownerId, role) {
  const text = String(ownerId || "guest") + "\0" + legacyRoleKey(role),
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
export function ensureCharacterIds(save, ownerId) {
  for (const role of save.roles || []) role.cloudId ||= legacyCharacterId(ownerId, role);
  return save;
}
export function freshSync(ownerId, device = {}) {
  return {
    protocol: 2,
    ownerId: ownerId ?? null,
    deviceId: device.deviceId || "",
    deviceName: device.deviceName || "",
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
export function cloudBaseline(roles, tombstones = {}) {
  return Object.fromEntries(
    [
      ...Object.keys(tombstones || {})
        .sort()
        .map((k) => [k, DELETED]),
      ...(roles || []).map((r) => [cloudRoleKey(r), roleProgress(r)]),
    ].sort(([a], [b]) => a.localeCompare(b, "en")),
  );
}
export function snapshotOf(value) {
  if (typeof value === "string") value = JSON.parse(value);
  return value?.snapshot || value;
}
export const HELL_SAVE_KEY = "00000000-0000-4000-8000-000000000080";
export const SHARED_SAVE_KEY = HELL_SAVE_KEY;
export const sharedSnapshot = (value) => {
  const s = snapshotOf(value);
  return s?.gameId === "classic-hell" || s?.sharedStorageVersion === 1;
};
const sharedGame = (s) =>
  s.sharedStorageGame ?? (s.gameId === "classic-hell" ? "classic-hell" : undefined);
function wholeProjection(save, roles = cloudBaseline(save?.roles || [], save?.sync?.tombstones)) {
  return stringify({
    roles,
    sharedStorage: bagProgress(save.sharedStorage || []),
    ...(sharedGame(save) && sharedGame(save) !== "classic-hell" ? { game: sharedGame(save) } : {}),
  });
}
export function semanticSnapshot(value) {
  const save = snapshotOf(value);
  return sharedSnapshot(save)
    ? { [SHARED_SAVE_KEY]: wholeProjection(save) }
    : cloudBaseline(save?.roles || [], save?.sync?.tombstones);
}
function planSharedSync(local, remote, { baseline, hasBase, choices }) {
  const lg = sharedGame(local),
    rg = sharedGame(remote);
  if (lg && rg && lg !== rg) throw Error("invalid");
  const game = lg || rg,
    project = (s) => wholeProjection({ ...s, sharedStorageGame: game }),
    key = SHARED_SAVE_KEY,
    l = project(local),
    c = project(remote);
  // An old per-character baseline was recorded before this bank existed, so its bank was empty.
  const b =
    baseline[key] ??
    (hasBase
      ? wholeProjection({ sharedStorageGame: game, sharedStorage: [] }, baseline)
      : undefined);
  const empty = (s) =>
    !s.roles.length &&
    !Object.keys(s.sync?.tombstones || {}).length &&
    !s.sharedStorage?.some(Boolean);
  let source;
  if (l === c) source = "local";
  else if (hasBase && b !== undefined) {
    if (l === b) source = "cloud";
    else if (c === b) source = "local";
  } else if (empty(local)) source = "cloud";
  else if (empty(remote)) source = "local";
  if (!source && ["local", "cloud"].includes(choices[key])) source = choices[key];
  const conflicts = source
    ? []
    : [
        {
          key,
          scope: game === "classic-hell" ? "hell-save" : "shared-save",
          local,
          cloud: remote,
          reason: hasBase ? "diverged" : "firstLoad",
        },
      ];
  const chosen = source === "cloud" ? remote : local;
  const snapshot = {
    ...structuredClone(chosen),
    sharedStorageVersion: 1,
    sharedStorage: structuredClone(chosen.sharedStorage || Array(80).fill(null)),
    ...(game ? { sharedStorageGame: game } : {}),
    sync: {
      ...(local.sync || {}),
      ...(chosen.sync || {}),
      tombstones: structuredClone(chosen.sync?.tombstones || {}),
    },
  };
  return {
    snapshot,
    conflicts,
    conflict: !!conflicts.length,
    baseRoles: { [key]: c },
    changedLocal: progressFingerprint(snapshot) !== progressFingerprint(local),
    needsUpload: progressFingerprint(snapshot) !== progressFingerprint(remote),
    local,
    remote,
  };
}
export function progressFingerprint(value) {
  return stringify({ projectionVersion: PROJECTION_VERSION, roles: semanticSnapshot(value) });
}
function normalized(value, owner) {
  const save = structuredClone(snapshotOf(value));
  ensureCharacterIds(save, owner);
  return save;
}
export function encodeSnapshot(template, snapshot) {
  const envelope = typeof template === "string" ? JSON.parse(template) : structuredClone(template);
  if (envelope?.snapshot) {
    envelope.snapshot = snapshot;
    envelope.player = {
      roles: snapshot.roles.map(({ name, job, level }) => ({ name, job, level })),
    };
    return JSON.stringify(envelope);
  }
  return JSON.stringify({
    version: 1,
    format: "maomao-character-save",
    gameId: "maomao",
    contentHash: "",
    player: { roles: snapshot.roles.map(({ name, job, level }) => ({ name, job, level })) },
    snapshot,
  });
}
// A choice selects an entire character, including a deletion. It never adds XP
// or items from two divergent versions of that character.
export function planSaveSync(
  localValue,
  remoteValue,
  { ownerId, baseline, hasBase, choices = {} } = {},
) {
  const local = normalized(localValue, ownerId),
    remote = normalized(remoteValue, ownerId);
  baseline ??= local.sync?.baseRoles || {};
  hasBase ??=
    local.sync?.baseRevision !== null &&
    local.sync?.baseRevision !== undefined &&
    local.sync?.projectionVersion === PROJECTION_VERSION;
  if (local.gameId === "classic-hell" || remote.gameId === "classic-hell") {
    if (local.gameId !== remote.gameId) throw Error("invalid");
  }
  if (sharedSnapshot(local) || sharedSnapshot(remote))
    return planSharedSync(local, remote, { baseline, hasBase, choices });
  const l = semanticSnapshot(local),
    c = semanticSnapshot(remote),
    lr = new Map(local.roles.map((r) => [cloudRoleKey(r), r])),
    cr = new Map(remote.roles.map((r) => [cloudRoleKey(r), r]));
  const keys = [
      ...new Set([...Object.keys(baseline), ...Object.keys(l), ...Object.keys(c)]),
    ].sort(),
    conflicts = [],
    roles = [],
    tombstones = {};
  const emptyLocal = !Object.keys(l).length,
    emptyRemote = !Object.keys(c).length;
  for (const key of keys) {
    const lv = l[key] ?? DELETED,
      cv = c[key] ?? DELETED,
      bv = baseline[key] ?? DELETED;
    let source;
    if (lv === cv) source = "local";
    else if (!hasBase) {
      if (emptyLocal) source = "cloud";
      else if (emptyRemote) source = "local";
    } else if (lv === bv) source = "cloud";
    else if (cv === bv) source = "local";
    if (!source) {
      const conflict = {
        key,
        local: lr.get(key) || null,
        cloud: cr.get(key) || null,
        reason: !hasBase ? "firstLoad" : lv === DELETED || cv === DELETED ? "deletion" : "diverged",
      };
      if (choices[key] === "local" || choices[key] === "cloud") source = choices[key];
      else {
        conflicts.push(conflict);
        continue;
      }
    }
    const role = (source === "local" ? lr : cr).get(key);
    if (role) roles.push(structuredClone(role));
    else if (l[key] !== undefined || c[key] !== undefined || baseline[key] !== undefined)
      tombstones[key] = structuredClone(
        local.sync?.tombstones?.[key] || remote.sync?.tombstones?.[key] || {},
      );
  }
  if (roles.length > 6) throw Error("mergeFull");
  const snapshot = { ...local, roles, sync: { ...(local.sync || freshSync(ownerId)), tombstones } };
  return {
    snapshot,
    conflicts,
    conflict: !!conflicts.length,
    baseRoles: semanticSnapshot(remote),
    changedLocal: progressFingerprint(snapshot) !== progressFingerprint(local),
    needsUpload: progressFingerprint(snapshot) !== progressFingerprint(remote),
    local,
    remote,
  };
}

