// Hub interactions. Everything here is an enhancement: links, details menus
// and noscript videos work without it. Never reads game saves.
const doc = document,
  win = window;
const reduced = win.matchMedia("(prefers-reduced-motion: reduce)").matches;
const LAST = "backmir.hub.lastPlayed";
const store = {
  get(key) {
    try {
      return win.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      win.localStorage.setItem(key, value);
    } catch {}
  },
};

// Mobile menu
const header = doc.querySelector("[data-hub-header]"),
  toggle = doc.querySelector("[data-hub-menu-toggle]");
toggle?.addEventListener("click", () => {
  const open = !header.classList.contains("is-open");
  header.classList.toggle("is-open", open);
  toggle.setAttribute("aria-expanded", String(open));
});

// One dropdown open at a time; close on outside click or Escape.
const drops = [...doc.querySelectorAll("[data-hub-drop]")];
for (const drop of drops)
  drop.addEventListener("toggle", () => {
    if (drop.open) for (const other of drops) if (other !== drop) other.open = false;
  });
doc.addEventListener("click", (event) => {
  for (const drop of drops) if (drop.open && !drop.contains(event.target)) drop.open = false;
});
doc.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  for (const drop of drops)
    if (drop.open) {
      drop.open = false;
      drop.querySelector("summary")?.focus();
    }
  if (header?.classList.contains("is-open")) {
    header.classList.remove("is-open");
    toggle?.setAttribute("aria-expanded", "false");
  }
});

// Remember the last game started from the hub and point it out on return.
doc.addEventListener("click", (event) => {
  const link = event.target.closest?.("[data-hub-play],[data-collection-choice]");
  if (!link) return;
  const game = link.dataset.hubPlay || link.dataset.collectionChoice;
  store.set(LAST, game);
  if (typeof win.gtag === "function" && !win.backmirAnalyticsDisabled)
    win.gtag("event", "hub_play_click", { game_id: game, landing_path: win.location.pathname });
});
const last = store.get(LAST);
if (last)
  for (const card of doc.querySelectorAll(`[data-hub-game="${CSS.escape(last)}"]`))
    card.querySelector("[data-hub-last]")?.removeAttribute("hidden");

// The homepage showcase keeps every caption in HTML. Only this enhancement
// hides inactive figures; without JavaScript the row scrolls natively.
for (const carousel of doc.querySelectorAll("[data-hub-carousel]")) {
  const slides = [...carousel.querySelectorAll("[data-hub-slide]")],
    dots = [...carousel.querySelectorAll("[data-hub-carousel-dot]")];
  const controls = carousel.querySelector("[data-hub-carousel-controls]"),
    toggle = carousel.querySelector("[data-hub-carousel-toggle]"),
    status = carousel.querySelector("[data-hub-carousel-status]"),
    track = carousel.querySelector("[data-hub-carousel-track]");
  if (slides.length < 2 || !controls || !toggle || !track) continue;
  const motion = win.matchMedia("(prefers-reduced-motion: reduce)"),
    interval = Math.max(5000, Number(carousel.dataset.hubCarouselInterval) || 6000);
  let index = 0,
    timer = null,
    userPaused = motion.matches,
    hovered = false,
    focused = false,
    inView = !("IntersectionObserver" in win),
    gesture = null,
    suppressClick = false;
  const schedule = () => {
    win.clearTimeout(timer);
    const paused = userPaused || hovered || focused || doc.hidden || !inView;
    carousel.dataset.hubCarouselState = paused ? "paused" : "playing";
    toggle.textContent = userPaused ? toggle.dataset.playLabel : toggle.dataset.pauseLabel;
    toggle.setAttribute("aria-pressed", String(userPaused));
    if (!paused) timer = win.setTimeout(() => show(index + 1), interval);
  };
  const show = (next, manual = false) => {
    const transferFocus = manual && slides[index].contains(doc.activeElement);
    index = (next + slides.length) % slides.length;
    if (manual) userPaused = true;
    for (const [i, slide] of slides.entries()) slide.hidden = i !== index;
    for (const [i, dot] of dots.entries()) {
      if (i === index) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    }
    carousel.dataset.hubCarouselIndex = String(index);
    status.setAttribute("aria-live", manual ? "polite" : "off");
    status.textContent =
      slides[index].getAttribute("aria-label") +
      ": " +
      slides[index].querySelector("[data-hub-slide-title]").textContent;
    if (transferFocus) slides[index].querySelector("a")?.focus({ preventScroll: true });
    schedule();
  };
  carousel.dataset.hubCarouselReady = "true";
  controls.hidden = false;
  carousel
    .querySelector("[data-hub-carousel-prev]")
    .addEventListener("click", () => show(index - 1, true));
  carousel
    .querySelector("[data-hub-carousel-next]")
    .addEventListener("click", () => show(index + 1, true));
  for (const dot of dots)
    dot.addEventListener("click", () => show(Number(dot.dataset.hubCarouselDot), true));
  toggle.addEventListener("click", () => {
    userPaused = !userPaused;
    schedule();
  });
  carousel.addEventListener("keydown", (event) => {
    if (
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.target.matches("input,textarea,select,[contenteditable]")
    )
      return;
    const next = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: slides.length - 1 }[
      event.key
    ];
    if (next === undefined) return;
    event.preventDefault();
    show(next, true);
  });
  carousel.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "mouse") {
      hovered = true;
      schedule();
    }
  });
  carousel.addEventListener("pointerleave", (event) => {
    if (event.pointerType === "mouse") {
      hovered = false;
      schedule();
    }
  });
  carousel.addEventListener("focusin", (event) => {
    focused = event.target.matches(":focus-visible");
    schedule();
  });
  carousel.addEventListener("focusout", () => {
    queueMicrotask(() => {
      focused = !!carousel.querySelector(":focus-visible");
      schedule();
    });
  });
  // Opening an image or using a control pauses until explicitly resumed.
  carousel.addEventListener(
    "click",
    (event) => {
      if (suppressClick) {
        event.preventDefault();
        event.stopImmediatePropagation();
        suppressClick = false;
        return;
      }
      if (event.target.closest("[data-hub-lightbox]")) {
        userPaused = true;
        schedule();
      }
    },
    true,
  );
  track.addEventListener("pointerdown", (event) => {
    if (event.isPrimary && event.pointerType !== "mouse") {
      gesture = { id: event.pointerId, x: event.clientX, y: event.clientY };
      userPaused = true;
      schedule();
    }
  });
  track.addEventListener(
    "pointermove",
    (event) => {
      if (
        gesture?.id === event.pointerId &&
        Math.abs(event.clientX - gesture.x) > Math.abs(event.clientY - gesture.y) + 10
      )
        event.preventDefault();
    },
    { passive: false },
  );
  track.addEventListener("pointerup", (event) => {
    if (gesture?.id !== event.pointerId) return;
    const dx = event.clientX - gesture.x,
      dy = event.clientY - gesture.y;
    gesture = null;
    if (Math.abs(dx) < 40 || Math.abs(dx) <= Math.abs(dy) * 1.3) return;
    event.preventDefault();
    suppressClick = true;
    win.setTimeout(() => {
      suppressClick = false;
    }, 300);
    show(index + (dx < 0 ? 1 : -1), true);
  });
  track.addEventListener("pointercancel", () => {
    gesture = null;
  });
  doc.addEventListener("visibilitychange", schedule);
  motion.addEventListener("change", (event) => {
    if (event.matches) userPaused = true;
    schedule();
  });
  if ("IntersectionObserver" in win)
    new IntersectionObserver(
      (entries) => {
        inView = entries[0].isIntersecting;
        schedule();
      },
      { threshold: 0.2 },
    ).observe(carousel);
  show(0);
}

// Hovering a game's artwork previews its gameplay (fine pointers only, no data saver).
const saveData = navigator.connection?.saveData;
if (!reduced && !saveData && win.matchMedia("(hover: hover) and (pointer: fine)").matches) {
  for (const media of doc.querySelectorAll("[data-hub-preview]")) {
    if (media.closest("[data-hub-carousel]")) continue;
    const card = media.closest(".hub-marquee");
    let video = null;
    const start = () => {
      if (!video) {
        video = doc.createElement("video");
        Object.assign(video, { muted: true, loop: true, playsInline: true, preload: "auto" });
        video.src = media.dataset.hubPreview;
        video.setAttribute("aria-hidden", "true");
        media.append(video);
      }
      video.play().catch(() => {});
    };
    const stop = () => {
      video?.pause();
    };
    card.addEventListener("pointerenter", start);
    card.addEventListener("pointerleave", stop);
  }
}

// Screenshot lightbox.
for (const link of doc.querySelectorAll("[data-hub-lightbox]"))
  link.addEventListener("click", (event) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey) return;
    event.preventDefault();
    const box = doc.createElement("div"),
      img = doc.createElement("img"),
      close = doc.createElement("button");
    box.className = "hub-lightbox";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    img.src = link.href;
    img.alt = link.querySelector("img")?.alt || "";
    close.type = "button";
    close.textContent = { "zh-CN": "关闭", es: "Cerrar" }[doc.documentElement.lang] || "Close";
    const done = () => {
      box.remove();
      doc.removeEventListener("keydown", onKey);
      link.focus();
    };
    const onKey = (e) => {
      if (e.key === "Escape") done();
    };
    box.addEventListener("click", (e) => {
      if (e.target === box) done();
    });
    close.addEventListener("click", done);
    doc.addEventListener("keydown", onKey);
    box.append(img, close);
    doc.body.append(box);
    close.focus();
  });

// Genre filter on the all-games page.
const filters = doc.querySelector("[data-hub-filters]");
if (filters) {
  const status = filters.querySelector("[data-hub-filter-status]"),
    rows = [...doc.querySelectorAll(".hub-row")];
  filters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-hub-filter]");
    if (!button) return;
    const key = button.dataset.hubFilter;
    for (const other of filters.querySelectorAll("[data-hub-filter]"))
      other.setAttribute("aria-pressed", String(other === button));
    let count = 0;
    for (const row of rows) {
      const show = !key || row.dataset.hubGenres.split(" ").includes(key);
      row.hidden = !show;
      if (show) count++;
    }
    status.textContent = status.dataset.template.replace("{{count}}", String(count));
  });
}

(function enhancePreview(info, url) {
  if (!info) return;
  const primary = document.querySelector(info.selector);
  if (
    !primary ||
    Array.from(primary.parentElement.querySelectorAll("a")).some((a) => a.href === url)
  )
    return;
  const link = document.createElement("a");
  link.className = "hub-button hub-button-quiet";
  link.href = url;
  link.textContent = info.label;
  const note = document.createElement("small");
  note.style.cssText = "order:1;flex-basis:100%;line-height:1.5";
  note.textContent = info.note;
  primary.after(link, note);
})(
  (function pageInfo(pathname, translations) {
    const match = /^\/(?:(en|es)\/)?(games\/darkforged\/)?$/.exec(pathname);
    if (!match) return null;
    const scope = match[2] ? ".hub-game-hero-copy" : ".hub-marquee-body";
    const [label, note] = translations[match[1] || "zh"];
    return { selector: scope + ' .hub-actions a[data-hub-play="darkforged"]', label, note };
  })(location.pathname, {
    zh: [
      "预览 2.1 噩梦测试服",
      "所有人可看预览。正式服角色达到 70 级并首杀混沌魔王后，可复制角色进入测试服。",
    ],
    en: [
      "Preview the 2.1 Nightmare beta",
      "Anyone can watch the preview. Reach level 70 and defeat the Chaos Lord on the live server to copy your character into the beta.",
    ],
    es: [
      "Ver el avance de Pesadilla 2.1",
      "El avance está abierto a todos. Alcanza el nivel 70 y derrota al Señor del Caos en el servidor oficial para copiar tu personaje a la beta.",
    ],
  }),
  "https://nightmare.backmir.org/preview/",
);

