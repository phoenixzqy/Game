// The large map fits its panel first on desktop and mobile. Zoom/pan operate in map coordinates,
// independent of CSS scaling, a rotated page, and the movement controller.
export function fitMapTransform(world, width, height) {
  const scale = Math.min(
    Math.max(1, width - 12) / (world.width * 1.5),
    Math.max(1, height - 12) / world.height,
  );
  return {
    sx: scale * 1.5,
    sy: scale,
    ox: (width - world.width * scale * 1.5) / 2,
    oy: (height - world.height * scale) / 2,
  };
}
export class MapViewport {
  constructor(world, width, height) {
    this.world = world;
    this.width = width;
    this.height = height;
    this.reset();
  }
  reset() {
    this.zoom = 1;
    this.x = this.world.width / 2;
    this.y = this.world.height / 2;
  }
  resize(width, height) {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.transform();
  }
  transform() {
    const base = fitMapTransform(this.world, this.width, this.height),
      sx = base.sx * this.zoom,
      sy = base.sy * this.zoom;
    const clamp = (value, size, half) =>
      half * 2 >= size ? size / 2 : Math.max(half, Math.min(size - half, value));
    this.x = clamp(this.x, this.world.width, this.width / (2 * sx));
    this.y = clamp(this.y, this.world.height, this.height / (2 * sy));
    return { sx, sy, ox: this.width / 2 - this.x * sx, oy: this.height / 2 - this.y * sy };
  }
  zoomBy(factor) {
    this.zoom = Math.max(1, Math.min(4, this.zoom * factor));
    this.transform();
  }
  pan(dx, dy) {
    const t = this.transform();
    this.x -= dx / t.sx;
    this.y -= dy / t.sy;
    this.transform();
  }
  locate(point) {
    if (!point) return;
    this.zoom = Math.max(2, this.zoom);
    this.x = point.x + 0.5;
    this.y = point.y + 0.5;
    this.transform();
  }
}
export function canvasPoint(
  event,
  canvas,
  turned = globalThis.document?.documentElement?.dataset.turned,
) {
  const r = canvas.getBoundingClientRect();
  // m2's click replay has already converted its client coordinates.
  if (!event.m2Replay && turned === "right")
    return {
      x: ((event.clientY - r.top) * canvas.width) / r.height,
      y: ((r.right - event.clientX) * canvas.height) / r.width,
    };
  if (!event.m2Replay && turned === "left")
    return {
      x: ((r.bottom - event.clientY) * canvas.width) / r.height,
      y: ((event.clientX - r.left) * canvas.height) / r.width,
    };
  return {
    x: ((event.clientX - r.left) * canvas.width) / r.width,
    y: ((event.clientY - r.top) * canvas.height) / r.height,
  };
}
export function bindMapViewport({ canvas, body, world, draw, tap, me }) {
  const viewport = new MapViewport(world, canvas.width, canvas.height),
    box = canvas.parentElement,
    zoom = body.querySelector("[data-map-zoom]");
  let press = null,
    suppressUntil = 0,
    disposed = false;
  const fingers = new Set(),
    listeners = [];
  const on = (node, type, fn) => {
    node.addEventListener(type, fn);
    listeners.push(() => node.removeEventListener(type, fn));
  };
  const paint = () => {
    if (disposed) return;
    draw();
    zoom.textContent = Math.round(viewport.zoom * 100) + "%";
    body.querySelector("[data-map-action=out]").disabled = viewport.zoom <= 1;
    body.querySelector("[data-map-action=in]").disabled = viewport.zoom >= 4;
  };
  const resize = () => {
    if (!canvas.isConnected) return;
    const w = Math.max(1, Math.round(box.clientWidth)),
      h = Math.max(1, Math.round(box.clientHeight));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      viewport.resize(w, h);
    }
    paint();
  };
  for (const b of body.querySelectorAll("[data-map-action]"))
    on(b, "click", () => {
      const action = b.dataset.mapAction;
      if (action === "fit") viewport.reset();
      else if (action === "me") viewport.locate(me());
      else viewport.zoomBy(action === "in" ? 1.5 : 1 / 1.5);
      paint();
    });
  on(canvas, "pointerdown", (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    fingers.add(e.pointerId);
    suppressUntil = 0;
    canvas.setPointerCapture?.(e.pointerId);
    if (fingers.size !== 1) {
      press = null;
      suppressUntil = performance.now() + 750;
      return;
    }
    press = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      point: canvasPoint(e, canvas),
      moved: false,
    };
  });
  on(canvas, "pointermove", (e) => {
    if (press?.id !== e.pointerId || fingers.size !== 1) return;
    e.preventDefault();
    const point = canvasPoint(e, canvas);
    if (!press.moved && Math.hypot(e.clientX - press.startX, e.clientY - press.startY) < 8) return;
    press.moved = true;
    viewport.pan(point.x - press.point.x, point.y - press.point.y);
    press.point = point;
    paint();
  });
  const release = (e, cancelled = false) => {
    if (!fingers.has(e.pointerId)) return;
    fingers.delete(e.pointerId);
    suppressUntil = performance.now() + 750;
    const p = press;
    press = null;
    e.preventDefault();
    canvas.releasePointerCapture?.(e.pointerId);
    if (
      !cancelled &&
      p?.id === e.pointerId &&
      !p.moved &&
      !fingers.size &&
      Math.hypot(e.clientX - p.startX, e.clientY - p.startY) < 8
    )
      tap(e);
  };
  on(canvas, "pointerup", (e) => release(e));
  on(canvas, "pointercancel", (e) => release(e, true));
  on(canvas, "lostpointercapture", (e) => release(e, true));
  on(canvas, "click", (e) => {
    if (performance.now() < suppressUntil) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
    tap(e);
  });
  const doc = canvas.ownerDocument;
  const newPress = () => {
    suppressUntil = 0;
  };
  const guardClick = (e) => {
    if (
      performance.now() < suppressUntil &&
      (e.detail > 0 || e.pointerType === "touch" || e.m2Replay)
    ) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  };
  doc.addEventListener("pointerdown", newPress, true);
  doc.addEventListener("click", guardClick, true);
  const observer = typeof ResizeObserver === "function" ? new ResizeObserver(resize) : null;
  observer?.observe(box);
  globalThis.addEventListener("resize", resize);
  resize();
  return {
    canvas,
    viewport,
    dispose() {
      disposed = true;
      press = null;
      fingers.clear();
      observer?.disconnect();
      globalThis.removeEventListener("resize", resize);
      for (const remove of listeners) remove();
      const clear = () => {
        doc.removeEventListener("pointerdown", newPress, true);
        doc.removeEventListener("click", guardClick, true);
      };
      const delay = suppressUntil - performance.now();
      if (delay > 0) setTimeout(clear, delay);
      else clear();
    },
  };
}

