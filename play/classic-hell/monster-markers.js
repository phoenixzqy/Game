// Shared by the small and large maps. Friendly summons always keep their own marker.
export function monsterMarker(actor) {
  if (actor.kind !== "monster" || actor.dead) return null;
  if (actor.friendly) return { color: "#8acd88", size: 1.5, shape: "square", order: 0 };
  if (actor.rank === "boss") return { color: "#ff4949", size: 4.5, shape: "star", order: 2 };
  if (actor.rank === "elite") return { color: "#c58aff", size: 3.5, shape: "diamond", order: 1 };
  return { color: "#e47a63", size: 1.5, shape: "square", order: 0 };
}

export function drawMonsterMarker(g, p, marker) {
  const { size, shape, color } = marker;
  g.save();
  g.fillStyle = color;
  g.strokeStyle = "#090b08";
  g.lineWidth = 1.5;
  g.beginPath();
  if (shape === "square") g.rect(p.x - size, p.y - size, size * 2, size * 2);
  else {
    const count = shape === "star" ? 10 : 4;
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + (i * Math.PI * 2) / count;
      const radius = shape === "star" && i % 2 ? size * 0.45 : size;
      const x = p.x + Math.cos(angle) * radius,
        y = p.y + Math.sin(angle) * radius;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.closePath();
  }
  g.stroke();
  g.fill();
  g.restore();
}

