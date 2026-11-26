// singleplayer/ui/path.ts
var DIRECTIONS = [
  [0, -1],
  [1, -1],
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
];
function canThrough(map, x, y, occupied = /* @__PURE__ */ new Set()) {
  return (
    x >= 0 &&
    y >= 0 &&
    x < map.width &&
    y < map.height &&
    !(map.blockedCells
      ? map.blockedCells[y * map.width + x]
      : map.cells[y * map.width + x].blocked) &&
    !occupied.has(`${x},${y}`)
  );
}
var scratch = /* @__PURE__ */ new WeakMap();
function findPath(map, start, goal, occupied = /* @__PURE__ */ new Set()) {
  if (start.x === goal.x && start.y === goal.y) return [];
  if (
    !canThrough(map, goal.x, goal.y, occupied) ||
    start.x < 0 ||
    start.y < 0 ||
    start.x >= map.width ||
    start.y >= map.height
  )
    return null;
  const n = map.width * map.height;
  let work = scratch.get(map);
  if (!work || work.cost.length !== n) {
    work = {
      cost: new Float32Array(n),
      parent: new Int32Array(n),
      closed: new Uint32Array(n),
      seen: new Uint32Array(n),
      generation: 0,
    };
    scratch.set(map, work);
  }
  if (++work.generation >= 4294967295) {
    work.closed.fill(0);
    work.seen.fill(0);
    work.generation = 1;
  }
  const { cost, parent, closed, seen, generation } = work,
    target = goal.y * map.width + goal.x;
  let order = 0;
  const heap = [];
  const less = (a, b) => a.f < b.f || (a.f === b.f && a.order < b.order);
  const push = (node) => {
    heap.push(node);
    let i = heap.length - 1;
    while (i) {
      const p = (i - 1) >> 1;
      if (!less(heap[i], heap[p])) break;
      [heap[i], heap[p]] = [heap[p], heap[i]];
      i = p;
    }
  };
  const pop = () => {
    const first = heap[0],
      last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        let c = i * 2 + 1;
        if (c >= heap.length) break;
        if (c + 1 < heap.length && less(heap[c + 1], heap[c])) c++;
        if (!less(heap[c], heap[i])) break;
        [heap[c], heap[i]] = [heap[i], heap[c]];
        i = c;
      }
    }
    return first;
  };
  const estimate = (x, y) => {
    const dx = Math.abs(x - goal.x),
      dy = Math.abs(y - goal.y);
    return 10 * Math.max(dx, dy) + 4 * Math.min(dx, dy);
  };
  const initial = start.y * map.width + start.x;
  cost[initial] = 0;
  seen[initial] = generation;
  push({ id: initial, g: 0, f: estimate(start.x, start.y), order: order++ });
  while (heap.length) {
    const node = pop();
    if (closed[node.id] === generation || node.g !== cost[node.id]) continue;
    if (node.id === target) {
      const path = [];
      for (let p = target; p !== initial; p = parent[p])
        path.push({ x: p % map.width, y: Math.floor(p / map.width) });
      return path.reverse();
    }
    closed[node.id] = generation;
    const x = node.id % map.width,
      y = Math.floor(node.id / map.width);
    for (const [dx, dy] of DIRECTIONS) {
      const nx = x + dx,
        ny = y + dy,
        id = ny * map.width + nx;
      if (!canThrough(map, nx, ny, occupied) || closed[id] === generation) continue;
      const g = node.g + (dx && dy ? 14 : 10);
      if (seen[id] === generation && g >= cost[id]) continue;
      seen[id] = generation;
      cost[id] = g;
      parent[id] = node.id;
      push({ id, g, f: g + estimate(nx, ny), order: order++ });
    }
  }
  return null;
}
function direction(dx, dy) {
  return DIRECTIONS.findIndex(([x, y]) => x === Math.sign(dx) && y === Math.sign(dy));
}
function walkFrame(progress) {
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
function steerPath(map, start, aim, occupied = /* @__PURE__ */ new Set()) {
  const dx = aim.x - start.x,
    dy = aim.y - start.y,
    range = Math.max(Math.abs(dx), Math.abs(dy));
  if (!range) return [];
  const axisThreshold = Math.SQRT2 - 1;
  const sx = Math.abs(dx) < Math.abs(dy) * axisThreshold ? 0 : Math.sign(dx);
  const sy = Math.abs(dy) < Math.abs(dx) * axisThreshold ? 0 : Math.sign(dy);
  const stepsAhead = Math.min(2, sx ? Math.abs(dx) : range, sy ? Math.abs(dy) : range);
  const direct = [];
  for (let n = 1; n <= stepsAhead; n++) {
    const p = { x: start.x + sx * n, y: start.y + sy * n };
    if (!canThrough(map, p.x, p.y, occupied)) break;
    direct.push(p);
  }
  if (direct.length) return direct;
  const look = Math.min(8, range),
    goal = {
      x: Math.round(start.x + (dx * look) / range),
      y: Math.round(start.y + (dy * look) / range),
    };
  const steps = Math.max(Math.abs(goal.x - start.x), Math.abs(goal.y - start.y));
  for (let n = steps; n > 0; n--) {
    const route = findPath(
      map,
      start,
      {
        x: Math.round(start.x + ((goal.x - start.x) * n) / steps),
        y: Math.round(start.y + ((goal.y - start.y) * n) / steps),
      },
      occupied,
    );
    if (route?.length) return route;
  }
  return null;
}
export { DIRECTIONS, canThrough, direction, findPath, steerPath, walkFrame };

