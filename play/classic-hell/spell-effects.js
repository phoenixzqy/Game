// Only original frames checked against the local magic.ini are used here.
export class SpellEffects {
  constructor(bindings, draw, missing) {
    this.bindings = bindings;
    this.drawFrame = draw;
    this.missing = missing;
    this.active = [];
  }
  trigger(spell, caster, target, now) {
    const b = this.bindings[spell];
    if (!b || !Object.keys(b.phases).length) {
      if (spell !== "None") this.missing.add("spell-effect:" + spell);
      return;
    }
    const distance = Math.max(Math.abs(caster.x - target.x), Math.abs(caster.y - target.y));
    const travel = b.phases.way ? Math.min(900, Math.max(160, distance * 65)) : 0;
    this.active.push({ b, caster: { ...caster }, target: { ...target }, at: now, travel });
  }
  draw(now) {
    this.active = this.active.filter((e) => {
      const t = now - e.at,
        life = Math.max(
          1200 + e.travel,
          ...Object.values(e.b.phases).map((f) => (f.delayMs ?? 0) + (f.durationMs ?? 0)),
        );
      if (t > life) return false;
      const paint = (phase, at, duration, x, y, dir = 0) => {
        const f = e.b.phases[phase];
        at = f?.delayMs ?? at;
        duration = f?.durationMs ?? duration;
        if (!f || t < at || t >= at + duration) return;
        const n = Math.min(f.count - 1, Math.floor(((t - at) / duration) * f.count));
        const index = f.start + (f.directions > 1 ? dir * f.stride : 0) + n;
        if (!f.blankFrames?.includes(index)) this.drawFrame(e.b.pack, index, x * 48, y * 32, true);
      };
      const self = e.b.phases.self,
        dx = e.target.x - e.caster.x,
        dy = e.target.y - e.caster.y;
      // Native self-anchored beams aim at the target in 16 directions; the body
      // still has eight facings. Zero distance falls back to the body's facing.
      const selfDir =
        self?.aim === "target" && (dx || dy)
          ? (Math.round((Math.atan2(dx, -dy) * self.directions) / (2 * Math.PI)) +
              self.directions) %
            self.directions
          : (e.caster.dir || 0) * (self?.directions === 16 ? 2 : 1);
      paint("self", 0, 550, e.caster.x, e.caster.y, selfDir);
      if (e.travel) {
        const p = Math.max(0, Math.min(1, (t - 200) / e.travel)),
          dx = e.target.x - e.caster.x,
          dy = e.target.y - e.caster.y;
        const directions = e.b.phases.way.directions || 1;
        const dir =
          (Math.round((Math.atan2(dx, -dy) * directions) / (2 * Math.PI)) + directions) %
          directions;
        paint("way", 200, e.travel, e.caster.x + dx * p, e.caster.y + dy * p, dir);
      }
      const dest = e.b.phases.dest,
        anchor = dest?.aim === "caster" ? e.caster : e.target;
      paint(
        "dest",
        200 + e.travel,
        650,
        anchor.x,
        anchor.y,
        dest?.aim === "caster" ? e.caster.dir || 0 : 0,
      );
      return true;
    });
  }
  persistent(actor, now, position) {
    const b = this.bindings[actor.spell],
      f = b?.phases.persistent || b?.phases.dest;
    if (!f) return;
    const at = position || { x: actor.x * 48, y: actor.y * 32 };
    this.drawFrame(
      b.pack,
      f.start + (Math.floor(now / (f.frameMs ?? 130)) % f.count),
      at.x,
      at.y,
      true,
    );
  }
  clear() {
    this.active = [];
  }
}

