// singleplayer/ui/actor-picking.ts
function pickRenderedActor(hits, x, y, kind, opaque) {
  const candidates = hits.filter((h) => !h.a.dead && (!kind || h.a.kind === kind));
  for (let i = candidates.length - 1; i >= 0; i--) {
    const h = candidates[i],
      n = h.name;
    if (Math.abs(x - n.x) <= n.width / 2 + 5 && y >= n.y - 16 && y <= n.y + 5) return h.a;
  }
  for (let i = candidates.length - 1; i >= 0; i--) {
    const h = candidates[i];
    if (
      h.f
        ? opaque(h, x, y)
        : h.a.kind !== "monster" && Math.abs(x - h.p.x - 24) < 16 && Math.abs(y - h.p.y) < 16
    )
      return h.a;
  }
  let best,
    score = Infinity;
  for (let i = candidates.length - 1; i >= 0; i--) {
    const h = candidates[i];
    if (h.a.kind !== "monster" || h.a.friendly) continue;
    const f = h.f,
      cx = f ? h.p.x + f.dx + f.width / 2 : h.p.x + 24,
      cy = f ? h.p.y + f.dy + f.height / 2 : h.p.y - 20;
    const rx = f ? Math.min(34, Math.max(18, f.width / 2 + 4)) : 20,
      ry = f ? Math.min(42, Math.max(22, f.height / 2 + 4)) : 28;
    const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
    if (d <= 1 && d < score) {
      best = h;
      score = d;
    }
  }
  return best?.a || null;
}
export { pickRenderedActor };

