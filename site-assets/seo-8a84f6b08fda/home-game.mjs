import { channel, validMessage, cleanEvent } from "./home-bridge.mjs";
export function mountHomeGame(doc = document, win = window) {
  const box = doc.querySelector("[data-home-game]");
  if (!box) return;
  const locale = ["zh-CN", "en", "es"].includes(doc.documentElement.lang)
    ? doc.documentElement.lang
    : "en";
  const messages = JSON.parse(doc.querySelector("#home-game-messages")?.textContent || "{}"),
    t = (key) => messages[key] || key;
  const get = (k) => box.querySelector(`[data-game-${k}]`),
    status = get("status"),
    screen = box.querySelector(".home-game-screen"),
    placeholder = get("placeholder");
  const experiment = doc.querySelector("[data-seo-experiment]").dataset.seoExperiment,
    siteBuild = doc.querySelector('meta[name="site-build"]')?.content || "";
  let frame = null,
    id = "",
    seq = 0,
    lastSeq = -1,
    ready = false,
    paused = false,
    timer,
    request = 0,
    busy = false,
    hasPlayed = false;
  const loading = get("loading");
  function phase(value) {
    box.dataset.phase = value;
    if (loading) loading.hidden = value !== "loading";
    screen.setAttribute("aria-busy", String(value === "loading"));
  }
  function playLabel() {
    doc.querySelectorAll("[data-home-play]").forEach((button) => {
      button.textContent = t(hasPlayed ? "Continue Playing" : "Start Playing");
    });
  }
  const pending = new Map();
  const track = (name, params = {}) => {
    if (
      !win.backmirAnalyticsDisabled &&
      win.navigator.onLine !== false &&
      typeof win.gtag === "function"
    )
      win.gtag("event", name, {
        ...params,
        experiment_id: experiment,
        entry_mode: "inline",
        content_language: locale,
        landing_path: win.location.pathname,
        site_build: siteBuild,
      });
  };
  function error(message) {
    clearTimeout(timer);
    status.textContent = message;
    get("retry").hidden = false;
    if (!ready) {
      phase("error");
      if (loading) {
        loading.hidden = false;
        get("loading-title").textContent = message;
      }
      expanded(false);
    }
  }
  function expanded(value) {
    box.classList.toggle("is-expanded", value);
    doc.body.style.overflow = value ? "hidden" : "";
    get("expand").textContent = value ? t("Return to page") : t("Expand");
  }
  function remove() {
    if (doc.fullscreenElement) doc.exitFullscreen().catch(() => {});
    clearTimeout(timer);
    frame?.remove();
    frame = null;
    ready = false;
    paused = false;
    box.classList.remove("is-paused");
    placeholder.hidden = false;
    phase("idle");
    playLabel();
    expanded(false);
    for (const key of ["expand", "fullscreen", "pause", "stop", "retry"]) get(key).hidden = true;
    status.textContent = t("Progress saved. Ready when you are.");
  }
  function command(type) {
    if (!frame || !ready) return Promise.reject(Error("not-ready"));
    const n = ++request;
    return new Promise((resolve, reject) => {
      const timeout = win.setTimeout(() => {
        pending.delete(n);
        reject(Error("timeout"));
      }, 15000);
      pending.set(n, {
        resolve: () => {
          clearTimeout(timeout);
          resolve();
        },
        reject: () => {
          clearTimeout(timeout);
          reject(Error("save"));
        },
      });
      frame.contentWindow.postMessage(
        { channel, id, seq: ++seq, type, request: n },
        win.location.origin,
      );
    });
  }
  async function action(type) {
    if (busy) return false;
    busy = true;
    status.textContent = type === "resume" ? t("Resuming…") : t("Saving…");
    try {
      await command(type);
      if (type === "save-close") remove();
      else {
        paused = type === "pause";
        box.classList.toggle("is-paused", paused);
        get("pause").textContent = paused ? t("Resume") : t("Pause & read");
        status.textContent = paused ? t("Paused · progress saved") : t("Playing");
        if (paused) {
          if (doc.fullscreenElement) doc.exitFullscreen().catch(() => {});
          expanded(false);
        } else frame?.contentWindow.focus();
      }
      return true;
    } catch {
      error(t("Could not confirm the save. Keep this game open and retry."));
      return false;
    } finally {
      busy = false;
    }
  }
  function start() {
    if (frame) {
      if (paused) void action("resume");
      box.scrollIntoView({ block: "start" });
      return;
    }
    track("game_entry_click");
    id = win.crypto.randomUUID();
    seq = 0;
    lastSeq = -1;
    ready = false;
    paused = false;
    placeholder.hidden = true;
    get("retry").hidden = true;
    status.textContent = t("Loading BackMir…");
    phase("loading");
    if (loading) get("loading-title").textContent = t("Loading BackMir…");
    frame = doc.createElement("iframe");
    frame.title = t("BackMir browser game");
    frame.allow = "fullscreen; identity-credentials-get";
    frame.referrerPolicy = "strict-origin";
    frame.src =
      "/Game/play/embed-" +
      siteBuild +
      ".html?lang=" +
      locale +
      "&embed=home&embed_id=" +
      encodeURIComponent(id);
    screen.append(frame);
    timer = win.setTimeout(
      () => error(t("Loading is taking longer than expected. Retry or open the full game page.")),
      45000,
    );
    box.scrollIntoView({ block: "start" });
    if (win.matchMedia("(max-width: 900px)").matches) expanded(true);
  }
  win.addEventListener("message", (event) => {
    if (
      !frame ||
      !validMessage(event, {
        source: frame.contentWindow,
        origin: win.location.origin,
        id,
        lastSeq,
      })
    )
      return;
    const d = event.data;
    if (!["ready", "event", "ack", "error", "update"].includes(d.type)) return;
    lastSeq = d.seq;
    if (d.type === "update") {
      remove();
      win.location.assign("/Game/update.html?lang=" + locale + "&home=1");
      return;
    }
    if (d.type === "ready") {
      clearTimeout(timer);
      ready = true;
      phase("character");
      status.textContent = t("Choose your character");
      for (const key of ["expand", "fullscreen", "pause", "stop"]) get(key).hidden = false;
      get("retry").hidden = true;
      frame.contentWindow.focus();
    }
    if (d.type === "event") {
      const e = cleanEvent(d.name, d.params);
      if (e) {
        track(e.name, e.params);
        if (e.name === "game_load_start") status.textContent = t("Loading the game world…");
        if (e.name === "game_frame_ready") {
          hasPlayed = true;
          phase("playing");
          status.textContent = t("Playing");
        }
        if (e.name === "game_load_error") error(t("The game could not load. Please retry."));
      }
    }
    if (d.type === "ack") {
      pending.get(d.request)?.resolve();
      pending.delete(d.request);
    }
    if (d.type === "error") {
      pending.get(d.request)?.reject();
      pending.delete(d.request);
      error(
        d.reason === "save"
          ? t("Save failed. Keep this game open and retry.")
          : t("The game could not load. Please retry."),
      );
    }
  });
  doc.querySelectorAll("[data-home-play]").forEach((a) =>
    a.addEventListener("click", (e) => {
      e.preventDefault();
      start();
    }),
  );
  get("expand").onclick = () => {
    expanded(!box.classList.contains("is-expanded"));
    frame?.contentWindow.focus();
  };
  get("fullscreen").onclick = async () => {
    try {
      if (doc.fullscreenElement) await doc.exitFullscreen();
      else await box.requestFullscreen();
    } catch {
      expanded(true);
    }
    frame?.contentWindow.focus();
  };
  get("pause").onclick = () => action(paused ? "resume" : "pause");
  get("stop").onclick = () => action("save-close");
  get("cancel")?.addEventListener("click", () => {
    if (!ready) {
      remove();
      status.textContent = t("Ready when you are");
    }
  });
  get("retry").onclick = async () => {
    if (ready) {
      await action(paused ? "pause" : "resume");
      return;
    }
    remove();
    start();
  };
  get("standalone").addEventListener("click", async (e) => {
    if (!frame) return;
    e.preventDefault();
    if (!ready) {
      remove();
      win.location.assign("/Game/play/?lang=" + locale);
      return;
    }
    if (await action("save-close")) win.location.assign("/Game/play/?lang=" + locale);
  });
  doc.addEventListener("keydown", (e) => {
    if (e.key === "Escape") expanded(false);
  });
  // Scrolling into the article pauses the world; returning always needs an explicit resume.
  if (win.IntersectionObserver)
    new win.IntersectionObserver(
      (entries) => {
        if (ready && !paused && !busy && !entries[0].isIntersecting) void action("pause");
      },
      { threshold: 0 },
    ).observe(box);
  if (new URL(win.location.href).searchParams.get("resume") === "1") start();
  return { start };
}
if (typeof document !== "undefined") mountHomeGame();

