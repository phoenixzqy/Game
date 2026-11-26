// Port of BMClient/Astar/SAstarImpl.cpp Calculate8DirectionNormal.
// Search bounds, neighbor order, costs, Manhattan heuristic, stable ties and
// early destination return intentionally preserve the original behavior.
export const DIRECTIONS = [
  [0, -1],
  [1, -1],
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
];
const NEIGHBORS = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
];
export function canThrough(map, x, y, occupied = new Set()) {
  return (
    x >= 0 &&
    y >= 0 &&
    x < map.width &&
    y < map.height &&
    !map.cells[y * map.width + x].blocked &&
    !occupied.has(`${x},${y}`)
  );
}
export function findPath(map, start, goal, occupied = new Set()) {
  if (start.x === goal.x && start.y === goal.y) return [];
  if (!canThrough(map, goal.x, goal.y, occupied)) return null;
  const minX = Math.min(start.x, goal.x),
    minY = Math.min(start.y, goal.y);
  const width = Math.min(minX, 5) + 5 + Math.abs(start.x - goal.x) + 1;
  const height = Math.min(minY, 5) + 5 + Math.abs(start.y - goal.y) + 1;
  const left = Math.max(0, minX - 5),
    top = Math.max(0, minY - 5);
  let current = { ...start, g: 0, f: 0, parent: null };
  const closed = new Set([`${start.x},${start.y}`]),
    open = [];
  while (true) {
    for (let i = 0; i < NEIGHBORS.length; i++) {
      const [dx, dy] = NEIGHBORS[i],
        x = current.x + dx,
        y = current.y + dy,
        key = `${x},${y}`;
      if (
        x < left ||
        y < top ||
        x >= left + width ||
        y >= top + height ||
        closed.has(key) ||
        !canThrough(map, x, y, occupied)
      )
        continue;
      if (x === goal.x && y === goal.y) {
        const path = [{ x, y }];
        for (let c = current; c.parent; c = c.parent) path.push({ x: c.x, y: c.y });
        return path.reverse();
      }
      const g = current.g + ([1, 3, 4, 6].includes(i) ? 10 : 14);
      const existing = open.find((c) => c.x === x && c.y === y);
      if (!existing) {
        const h = (Math.abs(goal.x - x) + Math.abs(goal.y - y)) * 10;
        open.push({ x, y, g, h, f: g + h, parent: current });
      } else if (g < existing.g) {
        existing.g = g;
        existing.f = existing.h + g;
        existing.parent = current;
      }
    }
    if (!open.length) return null;
    open.sort((a, b) => a.f - b.f);
    current = open.shift();
    closed.add(`${current.x},${current.y}`);
  }
}
export function direction(dx, dy) {
  return DIRECTIONS.findIndex(([x, y]) => x === Math.sign(dx) && y === Math.sign(dy));
}
export function walkFrame(progress) {
  // GameOtherPlayer.cpp UpdateMove: 0.16 / .32 / .48 / .64 / .8 thresholds.
  return progress > 0.8
    ? 5
    : progress > 0.64
      ? 4
      : progress > 0.48
        ? 3
        : progress > 0.32
          ? 2
          : progress > 0.16
            ? 1
            : 0;
}

