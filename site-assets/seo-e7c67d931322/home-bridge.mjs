// Same-origin, short-lived messages only. Never forward account or character identity.
export const channel = "backmir-home-v1";
const events = new Set([
  "backup_prompt_view",
  "backup_prompt_click",
  "backup_prompt_dismiss",
  "account_view",
  "auth_start",
  "auth_error",
  "sign_up",
  "login",
  "first_cloud_saved",
  "game_ready",
  "game_load_start",
  "game_load_error",
  "game_start",
  "game_end",
  "game_frame_ready",
  "character_create",
  "map_enter",
  "level_up",
  "player_death",
  "quest_complete",
  "skill_learned",
  "equipment_change",
  "first_kill",
  "game_playtime",
  "game_retention",
]);
export function cleanEvent(name, params = {}) {
  if (!events.has(name)) return null;
  const clean = {};
  for (const key of ["level", "map_id", "quest_id", "play_seconds", "load_ms"])
    if (Number.isSafeInteger(params[key]) && params[key] >= 0 && params[key] <= 10000000)
      clean[key] = params[key];
  for (const [key, allowed] of Object.entries({
    source: ["backup_prompt", "cloud_panel", "account_link", "other"],
    method: ["google"],
    stage: ["sdk", "challenge", "credential", "cancelled", "popup"],
    trigger: ["quest", "playtime"],
    language: ["en", "es", "zh-CN"],
    character_class: ["Warrior", "Wizard", "Taoist"],
    game_language: ["en", "es", "zh-CN"],
    play_session_type: ["new_character", "returning_character"],
    load_stage: ["entry", "boot", "sprite"],
  }))
    if (allowed.includes(params[key])) clean[key] = params[key];
  if (/^[a-f0-9]{12}$/.test(params.game_build || "")) clean.game_build = params.game_build;
  return { name, params: clean };
}
export function validMessage(event, { source, origin, id, lastSeq = -1 }) {
  const d = event.data;
  return (
    event.source === source &&
    event.origin === origin &&
    d?.channel === channel &&
    d.id === id &&
    Number.isSafeInteger(d.seq) &&
    d.seq > lastSeq
  );
}
export function installChildEmbed(win = window, doc = document) {
  const url = new URL(win.location.href),
    id = url.searchParams.get("embed_id");
  if (
    win.parent === win ||
    url.searchParams.get("embed") !== "home" ||
    !/^[-\w]{16,64}$/.test(id || "")
  )
    return null;
  try {
    if (
      win.parent.location.origin !== url.origin ||
      !["/", "/Game/en/", "/Game/es/"].includes(win.parent.location.pathname)
    )
      return null;
  } catch {
    return null;
  }
  let seq = 0,
    lastSeq = -1,
    api = null,
    busy = false,
    initialized = false;
  const post = (type, data = {}) =>
    win.parent.postMessage({ channel, id, seq: ++seq, type, ...data }, url.origin);
  const bridge = {
    active: true,
    post,
    event(name, params) {
      if (name === "game_ready") {
        initialized = true;
        if (api) post("ready");
      }
      const safe = cleanEvent(name, params);
      if (safe) post("event", safe);
    },
    attach(callback) {
      api = callback;
      if (initialized) post("ready");
    },
  };
  win.backmirEmbed = bridge;
  win.gtag = (kind, name, params) => {
    if (kind === "event") bridge.event(name, params);
  };
  doc.documentElement.dataset.homeEmbed = "true";
  win.addEventListener("message", async (event) => {
    if (!validMessage(event, { source: win.parent, origin: url.origin, id, lastSeq })) return;
    const { type, request } = event.data;
    if (
      !["pause", "resume", "save-close"].includes(type) ||
      !Number.isSafeInteger(request) ||
      !api ||
      busy
    )
      return;
    lastSeq = event.data.seq;
    busy = true;
    bridge.active = type === "resume";
    doc.dispatchEvent(new CustomEvent("home-embed-state"));
    try {
      await api(type);
      post("ack", { request, command: type });
    } catch {
      post("error", { request, reason: "save" });
    } finally {
      busy = false;
    }
  });
  return bridge;
}

