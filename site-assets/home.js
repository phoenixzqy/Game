const dialog = document.querySelector(".shot-dialog");
if (dialog && typeof dialog.showModal === "function") {
  const img = dialog.querySelector("img"),
    caption = dialog.querySelector("p");
  document.querySelectorAll("[data-lightbox]").forEach((link) =>
    link.addEventListener("click", (e) => {
      if (e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      img.src = link.href;
      img.alt = link.dataset.caption;
      caption.textContent = link.dataset.caption;
      dialog.showModal();
    }),
  );
  dialog.querySelector(".shot-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) {
      const b = dialog.getBoundingClientRect();
      if (e.clientX < b.left || e.clientX > b.right || e.clientY < b.top || e.clientY > b.bottom)
        dialog.close();
    }
  });
}
document.querySelectorAll("video").forEach((video) =>
  video.addEventListener("play", () => {
    document.querySelectorAll("video").forEach((other) => {
      if (other !== video) other.pause();
    });
  }),
);

document.querySelectorAll(".battle-detail").forEach((detail) =>
  detail.addEventListener("toggle", () => {
    if (!detail.open) detail.querySelector("video")?.pause();
  }),
);

const mediaEvent = (name, media) => {
  try {
    if (location.origin === "" && typeof window.gtag === "function")
      window.gtag("event", name, { media_id: media, source_path: location.pathname });
  } catch {}
};
document
  .querySelectorAll("[data-lightbox]")
  .forEach((link) =>
    link.addEventListener("click", () =>
      mediaEvent(
        "equipment_image_open",
        new URL(link.href).pathname.split("/").pop().replace(".webp", ""),
      ),
    ),
  );
const filmDialog = document.querySelector(".film-dialog");
if (filmDialog && typeof filmDialog.showModal === "function") {
  const video = filmDialog.querySelector("video"),
    fallback = filmDialog.querySelector(".film-fallback");
  document.querySelectorAll("[data-play-film]").forEach((link) =>
    link.addEventListener("click", (event) => {
      if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      video.src = link.href;
      fallback.href = link.href;
      fallback.hidden = true;
      filmDialog.showModal();
      video.play().catch(() => {
        fallback.hidden = false;
      });
    }),
  );
  filmDialog.querySelector(".film-close").onclick = () => filmDialog.close();
  filmDialog.addEventListener("close", () => {
    video.pause();
    video.removeAttribute("src");
    video.load();
  });
  video.addEventListener("error", () => {
    fallback.hidden = false;
  });
  filmDialog.addEventListener("click", (e) => {
    if (e.target === filmDialog) {
      const b = filmDialog.getBoundingClientRect();
      if (e.clientX < b.left || e.clientX > b.right || e.clientY < b.top || e.clientY > b.bottom)
        filmDialog.close();
    }
  });
}
document.querySelectorAll("video").forEach((video) => {
  const tracked = new Set();
  video.addEventListener("play", () => {
    const src = video.currentSrc || video.querySelector("source")?.src || video.src;
    if (!src || tracked.has(src)) return;
    tracked.add(src);
    mediaEvent(
      "gameplay_video_play",
      new URL(src, location.href).pathname.split("/").pop().replace(".mp4", ""),
    );
  });
});

