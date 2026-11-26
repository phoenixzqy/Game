// Transparent additive light: no black-backed sprite rectangle over the map.
export function drawPortal(g, x, y, now) {
  const t = now / 1000,
    pulse = 0.85 + 0.15 * Math.sin(t * 2.6);
  g.save();
  g.translate(x, y);
  g.globalCompositeOperation = "lighter";
  const halo = g.createRadialGradient(0, -30, 4, 0, -30, 65);
  halo.addColorStop(0, "rgba(75,190,255,.16)");
  halo.addColorStop(1, "rgba(40,130,255,0)");
  g.fillStyle = halo;
  g.fillRect(-68, -100, 136, 125);
  g.strokeStyle = `rgba(105,225,255,${pulse * 0.8})`;
  g.lineWidth = 3;
  g.shadowColor = "#39bfff";
  g.shadowBlur = 12;
  g.beginPath();
  g.ellipse(0, 0, 40, 14, 0, 0, Math.PI * 2);
  g.stroke();
  g.strokeStyle = "#ffe49a";
  g.lineWidth = 1.5;
  g.beginPath();
  g.ellipse(0, 0, 31, 10, 0, t, t + Math.PI * 1.6);
  g.stroke();
  // Upright gate sits directly over the actual transition cell.
  g.strokeStyle = `rgba(125,220,255,${pulse})`;
  g.lineWidth = 3;
  g.beginPath();
  g.ellipse(0, -38, 24, 44, 0, 0, Math.PI * 2);
  g.stroke();
  g.strokeStyle = "#d5f6ff";
  g.lineWidth = 1;
  g.beginPath();
  g.ellipse(0, -38, 20, 40, 0, -t * 1.5, -t * 1.5 + Math.PI * 1.3);
  g.stroke();
  for (let i = 0; i < 10; i++) {
    const phase = (t * 0.35 + i / 10) % 1,
      angle = i * 2.4 + t * 0.7;
    g.fillStyle = `rgba(175,239,255,${Math.sin(phase * Math.PI) * 0.8})`;
    g.beginPath();
    g.arc(Math.cos(angle) * (22 + phase * 8), -phase * 85, 1.2, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
}

