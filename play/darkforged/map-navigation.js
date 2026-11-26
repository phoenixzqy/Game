import { fitMapTransform, bindMapViewport, canvasPoint } from "./map-viewport.js";
import { i18n } from "./i18n.js";
import { monsterMarker, drawMonsterMarker } from "./monster-markers.js";
// Both overlays use the same walkable terrain and movement coordinates.
export function mapTransform(world, width, height, focus) {
  if (focus) {
    const sx = width / 128,
      sy = height / 128;
    return { sx, sy, ox: width / 2 - (focus.x + 0.5) * sx, oy: height / 2 - (focus.y + 0.5) * sy };
  }
  return fitMapTransform(world, width, height);
}
export class MapNavigation {
  constructor(root, getState, navigate, openMap, teleport) {
    this.root = root;
    this.getState = getState;
    this.teleport = teleport;
    this.navigate = navigate;
    this.openMap = openMap;
    this.world = null;
    this.panel = document.createElement("aside");
    this.panel.id = "minimap";
    this.panel.hidden = true;
    this.panel.innerHTML = ((p) =>
      `<div class="minimap-heading"><span>${i18n.t("ui.f5ebe5536bdd.text0")}</span><button class="map-expand" title="${i18n.t("ui.f5ebe5536bdd.text1")}">M</button><button class="map-collapse" aria-label="${i18n.t("ui.f5ebe5536bdd.text2")}">−</button></div><div class="minimap-content"><canvas width="128" height="128" aria-label="${i18n.t("ui.f5ebe5536bdd.text3")}"></canvas><div class="minimap-legend"><span style="color:#68cfff">${i18n.t("ui.f5ebe5536bdd.text4")}</span> · <span style="color:#ffdc76">${i18n.t("ui.f5ebe5536bdd.text5")}</span><br><span style="color:#e47a63">${i18n.t("ui.f5ebe5536bdd.text6")}</span> · <span style="color:#c58aff">${i18n.t("ui.f5ebe5536bdd.text7")}</span> · <span style="color:#ff4949">${i18n.t("common.mapBoss")}</span></div><div class="map-exits"></div></div>`)(
      {},
    );
    root.append(this.panel);
    this.markers = document.createElement("div");
    this.markers.id = "portal-markers";
    root.append(this.markers);
    this.panel.querySelector(".map-expand").onclick = openMap;
    const collapse = this.panel.querySelector(".map-collapse");
    collapse.onclick = () => {
      const c = this.panel.querySelector(".minimap-content");
      c.hidden = !c.hidden;
      collapse.textContent = c.hidden ? "+" : "−";
      collapse.setAttribute(
        "aria-label",
        c.hidden ? i18n.t("ui.820b501b3f89") : i18n.t("ui.77467616299e"),
      );
    };
    this.panel.querySelector("canvas").onclick = (e) => this.click(e);
  }
  portals() {
    return [...(this.world?.portals || []), ...(this.getState()?.me?.dynamicPortals || [])];
  }
  title(portal) {
    return portal.Name ? i18n.text(portal.Name) : i18n.entity("maps", portal.MapIndex);
  }
  update(world, catalog) {
    if (this.largeView && (!this.largeView.canvas.isConnected || this.world !== world)) {
      this.largeView.dispose();
      this.largeView = null;
    }
    const state = this.getState();
    this.panel.hidden = !world || !state?.me || state.stage !== "Game";
    this.markers.hidden = this.panel.hidden;
    if (this.panel.hidden) {
      this.world = null;
      this.terrain = null;
      return;
    }
    this.catalog = catalog;
    if (this.world !== world) {
      document.querySelector("#win-map")?.remove();
      this.moveReadyAt = performance.now() + 2100;
      this.exitStamp = null;
      this.world = world;
      this.terrain = document.createElement("canvas");
      this.terrain.width = world.width;
      this.terrain.height = world.height;
      const g = this.terrain.getContext("2d"),
        pixels = g.createImageData(world.width, world.height);
      for (let i = 0; i < world.width * world.height; i++) {
        const blocked = world.blockedCells ? world.blockedCells[i] : world.cells[i].blocked,
          o = i * 4;
        pixels.data[o] = blocked ? 20 : 103;
        pixels.data[o + 1] = blocked ? 24 : 111;
        pixels.data[o + 2] = blocked ? 19 : 81;
        pixels.data[o + 3] = 255;
      }
      g.putImageData(pixels, 0, 0);
    }
    const local = this.localPortals(),
      key = JSON.stringify([this.portals(), local]);
    if (this.exitStamp !== key) {
      this.exitStamp = key;
      const exits = this.panel.querySelector(".map-exits");
      exits.replaceChildren();
      this.markers.replaceChildren();
      for (const p of local) exits.append(this.exitButton(p));
      for (const p of this.portals()) {
        const marker = this.exitButton(p);
        marker.className = "portal-marker";
        marker.dataset.x = p.Source.x;
        marker.dataset.y = p.Source.y;
        this.markers.append(marker);
      }

      const large = document.querySelector("#win-map .map-exits");
      if (large) {
        large.replaceChildren();
        for (const p of this.portals()) large.append(this.exitButton(p));
      }
    }
    this.panel.querySelector(".minimap-heading span").textContent =
      world.name + " " + state.me.x + "," + state.me.y;
    this.draw(this.panel.querySelector("canvas"));
    const large = document.querySelector("#win-map canvas");
    if (large) {
      this.draw(large);
      this.updateQuestList(large.closest(".body") || large.parentElement);
    }
  }
  exitButton(p) {
    const b = document.createElement("button");
    b.className = "map-exit";
    b.textContent = i18n.t("map.travelTo", { name: this.title(p), x: p.Source.x, y: p.Source.y });
    b.onclick = () => this.navigate(p.Source, this.title(p));
    return b;
  }
  transform(c) {
    if (c === this.largeView?.canvas) return this.largeView.viewport.transform();
    return mapTransform(
      this.world,
      c.width,
      c.height,
      c === this.panel.querySelector("canvas") ? this.getState()?.me : null,
    );
  }
  visible(c, t, p) {
    const x = t.ox + (p.x + 0.5) * t.sx,
      y = t.oy + (p.y + 0.5) * t.sy;
    return x >= 0 && x < c.width && y >= 0 && y < c.height;
  }
  localPortals() {
    const c = this.panel.querySelector("canvas"),
      t = this.transform(c);
    return this.portals().filter((p) => this.visible(c, t, p.Source));
  }
  draw(c) {
    if (!this.world) return;
    const g = c.getContext("2d"),
      t = this.transform(c),
      s = this.getState();
    g.clearRect(0, 0, c.width, c.height);
    g.fillStyle = "#141813";
    g.fillRect(0, 0, c.width, c.height);
    g.imageSmoothingEnabled = false;
    g.drawImage(
      this.terrain,
      -t.ox / t.sx,
      -t.oy / t.sy,
      c.width / t.sx,
      c.height / t.sy,
      0,
      0,
      c.width,
      c.height,
    );
    const pt = (p) => ({ x: t.ox + (p.x + 0.5) * t.sx, y: t.oy + (p.y + 0.5) * t.sy });
    const dot = (p, color, size) => {
      if (!this.visible(c, t, p)) return;
      p = pt(p);
      g.fillStyle = "#090b08";
      g.fillRect(p.x - size - 1, p.y - size - 1, size * 2 + 2, size * 2 + 2);
      g.fillStyle = color;
      g.fillRect(p.x - size, p.y - size, size * 2, size * 2);
    };
    if (c.width > 300)
      for (const target of (this.questTargets?.() || []).filter((q) => q.map === this.world.id)) {
        const p = pt(target),
          rx = Math.max(7, (target.radius || 3) * t.sx),
          ry = Math.max(7, (target.radius || 3) * t.sy);
        g.save();
        g.fillStyle = target.selected ? "#ffe05935" : "#f4bf4522";
        g.strokeStyle = target.selected ? "#fff38c" : "#eec862";
        g.lineWidth = target.selected ? 3 : 2;
        g.beginPath();
        g.ellipse(p.x, p.y, rx, ry, 0, 0, Math.PI * 2);
        g.fill();
        g.stroke();
        g.font = "bold 12px SimSun";
        g.textAlign = p.x > c.width * 0.7 ? "right" : "left";
        g.lineWidth = 3;
        g.strokeStyle = "#12140c";
        const label = "! " + target.name;
        g.strokeText(label, p.x + 4, p.y - 9);
        g.fillStyle = "#fff38c";
        g.fillText(label, p.x + 4, p.y - 9);
        g.restore();
      }
    for (const a of s.actors || []) if (a.kind === "npc") dot(a, "#76d9d9", 1.5);
    const monsters = (s.mapMonsters || s.actors || [])
      .map((a) => ({ a, marker: monsterMarker(a) }))
      .filter((v) => v.marker)
      .sort((a, b) => a.marker.order - b.marker.order);
    for (const { a, marker } of monsters)
      if (this.visible(c, t, a)) drawMonsterMarker(g, pt(a), marker);
    if (c.width > 300)
      for (const boss of s.me?.bossRespawns || [])
        for (const position of boss.positions || []) {
          dot(position, "#ff4949", 3);
          const p = pt(position);
          g.font = "12px SimSun";
          g.textAlign = p.x > c.width * 0.7 ? "right" : "left";
          g.lineWidth = 3;
          g.strokeStyle = "#080a08";
          const label = i18n.entity("monsters", boss.definition);
          g.strokeText(label, p.x, p.y - 8);
          g.fillStyle = "#ffaaaa";
          g.fillText(label, p.x, p.y - 8);
        }
    if (s.me) {
      dot(s.me, "#68cfff", 2.5);
      const route = this.route?.();
      if (route?.length) {
        g.strokeStyle = "#a4cbd1";
        g.lineWidth = 1;
        g.beginPath();
        const first = pt(s.me);
        g.moveTo(first.x, first.y);
        for (const p of route) {
          const q = pt(p);
          g.lineTo(q.x, q.y);
        }
        g.stroke();
      }
    }
    for (const p of this.portals()) {
      if (!this.visible(c, t, p.Source)) continue;
      dot(p.Source, "#ffdc76", 2.5);
      if (c.width > 300) {
        const q = pt(p.Source);
        g.font = "12px SimSun";
        g.textAlign = q.x > c.width * 0.7 ? "right" : "left";
        g.lineWidth = 3;
        g.strokeStyle = "#080a08";
        g.strokeText(this.title(p), q.x, q.y - 7);
        g.fillStyle = "#ffe29a";
        g.fillText(this.title(p), q.x, q.y - 7);
      }
    }
  }
  click(e) {
    if (!this.world) return;
    const c = e.currentTarget || this.largeView?.canvas,
      { x, y } = canvasPoint(e, c),
      t = this.transform(c);
    const destination = { x: Math.floor((x - t.ox) / t.sx), y: Math.floor((y - t.oy) / t.sy) };
    if (
      c !== this.panel.querySelector("canvas") &&
      this.getState()?.me?.canMapTeleport &&
      this.teleport
    ) {
      this.teleport(destination);
      return;
    }
    const nearby = this.portals()
      .filter((p) => this.visible(c, t, p.Source))
      .map((p) => ({
        p,
        d: Math.hypot(x - t.ox - (p.Source.x + 0.5) * t.sx, y - t.oy - (p.Source.y + 0.5) * t.sy),
      }))
      .sort((a, b) => a.d - b.d)[0];
    if (nearby?.d <= 8) {
      this.navigate(nearby.p.Source, this.title(nearby.p));
      return;
    }
    const goal = { x: Math.floor((x - t.ox) / t.sx), y: Math.floor((y - t.oy) / t.sy) };
    if (goal.x >= 0 && goal.y >= 0 && goal.x < this.world.width && goal.y < this.world.height)
      this.navigate(goal);
  }
  position(camera) {
    // Read layout once before any writes; hidden off-screen portals need no positioning.
    const width = this.root.clientWidth,
      height = this.root.clientHeight;
    for (const el of this.markers.children) {
      const x = Number(el.dataset.x) * 48 + 24 - camera.x,
        y = Number(el.dataset.y) * 32 + 16 - camera.y,
        hidden = x < 0 || x > width || y < 45 || y > height - 158;
      if (el.hidden !== hidden) el.hidden = hidden;
      if (hidden) continue;
      const left = x + "px",
        top = y + "px";
      if (el.style.left !== left) el.style.left = left;
      if (el.style.top !== top) el.style.top = top;
    }
  }
  updateQuestList(body) {
    const list = body.querySelector(".map-quest-targets");
    if (!list) return;
    const targets = (this.questTargets?.() || []).filter((q) => q.map === this.world.id),
      stamp = JSON.stringify(targets);
    if (list.dataset.stamp === stamp) return;
    list.dataset.stamp = stamp;
    list.replaceChildren();
    for (const target of targets) {
      const b = document.createElement("button");
      b.className = "map-quest-target";
      b.textContent =
        "! " +
        target.name +
        " · " +
        target.x +
        "," +
        target.y +
        (target.radius ? i18n.t("quest.nearby") : "");
      b.onclick = () => this.navigate({ x: target.x, y: target.y }, target.name);
      list.append(b);
    }
  }
  attachLarge(body) {
    this.largeView?.dispose();
    this.largeView = null;
    body.innerHTML = ((p) =>
      `<canvas width="528" height="340" aria-label="${i18n.t("ui.86fafe1509b0.text0")}"></canvas><p class="map-legend">${i18n.t("ui.86fafe1509b0.text1")}<span style="color:#c58aff">${i18n.t("ui.86fafe1509b0.text2")}</span> · <span style="color:#ff4949">${i18n.t("common.mapBoss")}</span>${i18n.t("ui.86fafe1509b0.text3")}</p><div class="map-quest-targets"></div><div class="map-exits"></div>`)(
      {},
    );
    if (this.getState()?.me?.canMapTeleport) {
      const hint = document.createElement("p");
      hint.textContent = i18n.t("ui.e0c12cf16132");
      hint.style.color = "#86dcdf";
      body.prepend(hint);
    }
    const c = body.querySelector("canvas");
    if (this.world) {
      const viewport = document.createElement("div");
      viewport.className = "map-viewport";
      c.before(viewport);
      viewport.append(c);
      const controls = document.createElement("div");
      controls.className = "map-view-controls";
      for (const [action, key, label] of [
        ["out", "map.zoomOut", "−"],
        ["in", "map.zoomIn", "+"],
        ["fit", "map.fit"],
        ["me", "map.locate"],
      ]) {
        const b = document.createElement("button");
        b.type = "button";
        b.dataset.mapAction = action;
        b.textContent = label || i18n.t(key);
        b.setAttribute("aria-label", i18n.t(key));
        controls.append(b);
      }
      const level = document.createElement("span");
      level.dataset.mapZoom = "";
      level.setAttribute("aria-live", "polite");
      controls.append(level);
      viewport.before(controls);
      const details = document.createElement("div");
      details.className = "map-locations";
      viewport.after(details);
      for (const node of [...body.children])
        if (node !== controls && node !== viewport && node !== details) details.append(node);
      const hint = document.createElement("p");
      hint.className = "map-drag-hint";
      hint.textContent = i18n.t("map.dragHint");
      details.prepend(hint);
      this.largeView = bindMapViewport({
        canvas: c,
        body,
        world: this.world,
        draw: () => this.draw(c),
        tap: (e) =>
          this.click({
            clientX: e.clientX,
            clientY: e.clientY,
            m2Replay: e.m2Replay,
            currentTarget: c,
          }),
        me: () => this.getState()?.me,
      });
    } else c.onclick = (e) => this.click(e);
    this.draw(c);
    this.updateQuestList(body);
    for (const p of this.portals()) body.querySelector(".map-exits").append(this.exitButton(p));
  }
}

