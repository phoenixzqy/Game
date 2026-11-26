// A* charges 10 for an axial step and 14 for a diagonal step.
function unobstructedCost(dx, dy) {
  return 10 * Math.max(dx, dy) + 4 * Math.min(dx, dy);
}

export function findApproachPath(start, target, range, pathTo) {
  const candidates = [];
  for (let x = target.x - range; x <= target.x + range; x++) {
    for (let y = target.y - range; y <= target.y + range; y++) {
      const dx = x - start.x,
        dy = y - start.y;
      const cost = unobstructedCost(Math.abs(dx), Math.abs(dy));
      const deviation = Math.abs(dx * (target.y - start.y) - dy * (target.x - start.x));
      candidates.push({ x, y, cost, deviation });
    }
  }
  candidates.sort((a, b) => a.cost - b.cost || a.deviation - b.deviation);

  let best = null,
    bestCost = Infinity;
  for (const candidate of candidates) {
    if (candidate.cost >= bestCost) break;
    const route = pathTo({ x: candidate.x, y: candidate.y });
    if (route == null) continue;
    let previous = start,
      cost = 0;
    for (const step of route) {
      cost += step.x !== previous.x && step.y !== previous.y ? 14 : 10;
      previous = step;
    }
    if (cost < bestCost) {
      best = route;
      bestCost = cost;
    }
  }
  return best;
}

