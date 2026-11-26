import { analyticsContext } from "./analytics-context.mjs";
// Deliberate allowlist: never pass snapshots, names, account IDs, saves or input to GA.
const jobs = new Set(["Warrior", "Wizard", "Taoist"]),
  locales = new Set(["zh-CN", "en", "es"]);
const integer = (v) => (Number.isSafeInteger(v) && v >= 0 && v <= 10000000 ? v : undefined);
export function createGameAnalytics({
  send = () => {},
  now = () => performance.now(),
  locale = () => "zh-CN",
  build = "",
} = {}) {
  let previous = null,
    ready = false,
    visible = true,
    last = now(),
    elapsed = 0,
    entryAt = null,
    rendered = false,
    firstKill = false,
    pendingNew = false,
    newSession = false,
    playTotal = 0,
    milestones = new Set(),
    packetSeq = -1,
    failures = new Set();
  const context = (me) =>
    Object.fromEntries(
      Object.entries({
        character_class: jobs.has(me?.job) ? me.job : undefined,
        level: integer(me?.level),
        map_id: integer(me?.map),
        game_language: locales.has(locale()) ? locale() : "zh-CN",
        play_session_type: newSession ? "new_character" : "returning_character",
        game_build: /^[a-f0-9]{12}$/.test(build) ? build : undefined,
      }).filter(([, v]) => v !== undefined),
    );
  const emit = (name, params = {}, me = previous) => {
    try {
      send(name, { ...context(me), ...params });
    } catch {
      /* Analytics must never interrupt play. */
    }
  };
  function flush() {
    if (elapsed >= 1000) {
      const seconds = Math.floor(elapsed / 1000);
      elapsed -= seconds * 1000;
      emit("game_playtime", { play_seconds: seconds });
      playTotal += seconds;
      for (const mark of [300, 600])
        if (playTotal >= mark && !milestones.has(mark)) {
          milestones.add(mark);
          emit("game_retention", { play_seconds: mark });
        }
    }
  }
  function tick() {
    const t = now();
    if (previous && visible) elapsed += Math.max(0, Math.min(30000, t - last));
    last = t;
    if (elapsed >= 60000) flush();
  }
  function visibility(value) {
    tick();
    visible = !!value;
    if (!visible) flush();
  }
  function observe(s) {
    tick();
    if (!ready) {
      ready = true;
      emit("game_ready");
    }
    const m = s.stage === "Game" ? s.me : null;
    if (!m) {
      if (previous) {
        flush();
        emit("game_end");
      }
      previous = null;
      elapsed = 0;
      return;
    }
    // A new epoch (load/rollback/re-entry) establishes a baseline, not earned progress.
    const current = {
      id: m.id,
      epoch: s.epoch,
      job: m.job,
      level: m.level,
      map: m.map,
      dead: !!m.dead,
      skills: new Set((m.skills || []).filter((s) => !s.temporary).map((s) => s.Spell)),
      equipment: (m.equipment || []).map((i) => i?.uid || 0),
      quests: new Set((m.completedQuests || []).filter((id) => integer(id) !== undefined)),
    };
    if (!previous || previous.id !== current.id || previous.epoch !== current.epoch) {
      if (previous) {
        flush();
        emit("game_end");
      }
      elapsed = 0;
      playTotal = 0;
      milestones.clear();
      packetSeq = -1;
      rendered = false;
      firstKill = false;
      newSession = pendingNew;
      pendingNew = false;
      previous = current;
      emit("game_start");
      emit("map_enter");
      return;
    }
    if (current.level > previous.level) emit("level_up", {}, current);
    if (current.map !== previous.map) emit("map_enter", {}, current);
    if (current.dead && !previous.dead) emit("player_death", {}, current);
    for (const id of current.quests)
      if (!previous.quests.has(id)) emit("quest_complete", { quest_id: id }, current);
    if ([...current.skills].some((skill) => !previous.skills.has(skill)))
      emit("skill_learned", {}, current);
    if (current.equipment.some((uid, i) => uid && uid !== previous.equipment[i]))
      emit("equipment_change", {}, current);
    previous = current;
  }
  return {
    observe,
    tick,
    visibility,
    flush: () => {
      tick();
      flush();
    },
    created(job) {
      pendingNew = true;
      emit("character_create", {}, { job });
    },
    entryBegin() {
      entryAt = now();
      emit("game_load_start");
    },
    loadFailure(stage) {
      if (["entry", "boot", "sprite"].includes(stage) && !failures.has(stage)) {
        failures.add(stage);
        emit("game_load_error", { load_stage: stage });
      }
    },
    rendered(s) {
      if (rendered || !previous || s?.stage !== "Game" || s.me?.id !== previous.id) return;
      rendered = true;
      emit(
        "game_frame_ready",
        entryAt === null ? {} : { load_ms: Math.round(Math.max(0, now() - entryAt)) },
      );
      entryAt = null;
    },
    packet(p) {
      if (!previous || !p || !Number.isSafeInteger(p.seq) || p.seq <= packetSeq) return;
      packetSeq = p.seq;
      if (p.type === "MonsterKilled" && p.data?.ObjectID === previous.id && !firstKill) {
        firstKill = true;
        emit("first_kill");
      }
    },
  };
}

export function installGameAnalytics({
  locale,
  build,
  enabled = false,
  win = window,
  doc = document,
} = {}) {
  // Preview builds, offline play and analytics blockers never block gameplay.
  const embedded = win.backmirEmbed;
  if (
    !embedded &&
    (!enabled ||
      win.backmirAnalyticsDisabled ||
      win.location.origin !== "" ||
      win.location.pathname?.startsWith("/__capture"))
  )
    return {
      observe() {},
      created() {},
      entryBegin() {},
      loadFailure() {},
      rendered() {},
      packet() {},
    };
  const pageBuild = doc.querySelector?.('meta[name="dream-build"]')?.content;
  const tracker = createGameAnalytics({
    locale,
    build: /^[a-f0-9]{12}$/.test(pageBuild || "") ? pageBuild : build,
    send: (event, params) => {
      if (embedded) {
        embedded.event(event, { ...analyticsContext(win, doc), ...params });
        return;
      }
      if (win.navigator.onLine !== false && typeof win.gtag === "function")
        win.gtag("event", event, { ...analyticsContext(win, doc), ...params });
    },
  });
  const visible = () => !doc.hidden && (!embedded || (embedded.active && doc.hasFocus()));
  tracker.visibility(visible());
  doc.addEventListener("visibilitychange", () => tracker.visibility(visible()));
  if (embedded) {
    doc.addEventListener("game-foreground", () => tracker.visibility(visible()));
    doc.addEventListener("home-embed-state", () => tracker.visibility(visible()));
    win.addEventListener("blur", () => tracker.visibility(false));
    win.addEventListener("focus", () => tracker.visibility(visible()));
  }
  win.addEventListener("pagehide", () => {
    tracker.visibility(false);
  });
  win.addEventListener("pageshow", () => tracker.visibility(visible()));
  win.setInterval(() => tracker.tick(), 15000);
  return tracker;
}

