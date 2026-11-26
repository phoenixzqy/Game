import { communityMessages } from "./community-i18n.mjs";
const locale = document.documentElement.lang,
  m = communityMessages(locale);
(() => {
  const states = new WeakMap(),
    size = (n) =>
      n < 1024 * 1024 ? `${Math.round(n / 1024)} KB` : `${(n / 1024 / 1024).toFixed(2)} MB`;
  for (const host of document.querySelectorAll("[data-image-uploader]")) {
    const form = host.closest("form"),
      input = host.querySelector("input"),
      list = host.querySelector(".image-upload-list"),
      status = host.querySelector(".image-upload-status");
    const state = { images: JSON.parse(host.dataset.images || "[]"), busy: false };
    states.set(form, state);
    const say = (text) => (status.textContent = text);
    function render() {
      list.replaceChildren();
      state.images.forEach((image, index) => {
        const card = document.createElement("div");
        card.className = "image-upload-card";
        const pic = document.createElement("img");
        pic.src = image.thumbnail;
        pic.alt = `${m.image} ${index + 1}`;
        card.append(pic);
        const text = document.createElement("p");
        text.textContent = `${index + 1}. ${size(image.bytes)} · ${image.width} × ${image.height}`;
        card.append(text);
        const buttons = document.createElement("div");
        for (const [label, action, disabled] of [
          [
            m.previous,
            () => {
              [state.images[index - 1], state.images[index]] = [
                state.images[index],
                state.images[index - 1],
              ];
            },
            index === 0,
          ],
          [m.remove, () => state.images.splice(index, 1), false],
        ]) {
          const b = document.createElement("button");
          b.type = "button";
          b.textContent = label;
          b.disabled = disabled || state.busy;
          b.addEventListener("click", () => {
            if (state.busy) return;
            action();
            render();
            say(`${state.images.length} / 9`);
          });
          buttons.append(b);
        }
        card.append(buttons);
        list.append(card);
      });
    }
    async function add(files) {
      if (state.busy) {
        say(m.uploadWait);
        return;
      }
      if (form.querySelector("fieldset")?.disabled) {
        say(m.loginNote);
        return;
      }
      if (files.length + state.images.length > 9) {
        say(m.imageLimit);
        return;
      }
      state.busy = true;
      input.disabled = true;
      render();
      let done = 0,
        original = 0,
        compressed = 0,
        thumbnails = 0;
      try {
        for (const file of files) {
          if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
            throw Error(m.imageType);
          if (file.size > 10 * 1024 * 1024) throw Error(m.imageType);
          say(`${m.uploading} ${done + 1} / ${files.length}`);
          const response = await fetch("/Game/api/community/images", {
            method: "POST",
            credentials: "same-origin",
            headers: {
              "Content-Type": file.type,
              "X-Backmir-Community": "1",
              "X-Backmir-Language": locale,
            },
            body: file,
          });
          const result = await response.json();
          if (!response.ok) throw Error(result.error || m.imageFailed);
          state.images.push(result);
          done++;
          original += file.size;
          compressed += result.bytes;
          thumbnails += result.thumbnailBytes;
          render();
        }
        say(`${m.image}: ${state.images.length} / 9`);
      } catch (error) {
        say(`${state.images.length} / 9 · ${error.message || m.network}`);
      } finally {
        state.busy = false;
        input.disabled = false;
        input.value = "";
        render();
      }
    }
    input.addEventListener("change", () => {
      if (input.files.length) add([...input.files]);
    });
    form.querySelector("textarea")?.addEventListener("paste", (event) => {
      const files = [...event.clipboardData.items]
        .filter((x) => x.kind === "file")
        .map((x) => x.getAsFile())
        .filter(Boolean);
      if (files.length) {
        event.preventDefault();
        add(files);
      }
    });
    render();
  }
  window.communityImages = {
    ids(form) {
      const state = states.get(form);
      if (state?.busy) throw Error(m.uploadWait);
      return state?.images.map((x) => x.id) || [];
    },
  };
  const dialog = document.querySelector("#image-lightbox");
  if (!dialog) return;
  const picture = dialog.querySelector("img"),
    zoom = dialog.querySelector("[data-image-zoom]");
  let group = [],
    position = 0,
    opener = null,
    start = null;
  const previous = dialog.querySelector("[data-image-previous]"),
    next = dialog.querySelector("[data-image-next]");
  function display() {
    const link = group[position];
    picture.src = link.href;
    picture.alt = link.dataset.caption;
    dialog.querySelector("[data-image-caption]").textContent = `${position + 1} / ${group.length}`;
    dialog.classList.remove("image-natural");
    zoom.textContent = m.zoom;
    if (previous) previous.disabled = position === 0;
    if (next) next.disabled = position === group.length - 1;
    dialog.querySelector(".image-lightbox-scroll").scrollTo(0, 0);
  }
  function step(n) {
    const value = position + n;
    if (value < 0 || value >= group.length) return;
    position = value;
    display();
  }
  document.addEventListener("click", (event) => {
    const link = event.target.closest("[data-lightbox]");
    if (!link) return;
    event.preventDefault();
    opener = link;
    group = Array.from(link.closest(".community-gallery").querySelectorAll("[data-lightbox]"));
    position = group.indexOf(link);
    display();
    dialog.showModal();
  });
  dialog.querySelector("[data-image-close]").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => opener?.focus({ preventScroll: true }));
  previous?.addEventListener("click", () => step(-1));
  next?.addEventListener("click", () => step(1));
  dialog.addEventListener("keydown", (event) => {
    if (dialog.classList.contains("image-natural")) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      step(-1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      step(1);
    }
  });
  picture.addEventListener(
    "touchstart",
    (event) => {
      start =
        event.touches.length === 1
          ? { x: event.touches[0].clientX, y: event.touches[0].clientY }
          : null;
    },
    { passive: true },
  );
  picture.addEventListener(
    "touchend",
    (event) => {
      if (start && !dialog.classList.contains("image-natural")) {
        const t = event.changedTouches[0],
          dx = t.clientX - start.x,
          dy = t.clientY - start.y;
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
      }
      start = null;
    },
    { passive: true },
  );
  zoom.addEventListener("click", () => {
    dialog.classList.toggle("image-natural");
    zoom.textContent = dialog.classList.contains("image-natural") ? m.fullImage : m.zoom;
  });
})();

