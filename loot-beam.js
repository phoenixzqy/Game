// Procedural ground-loot markers; shared bounds keep off-screen shafts visible.
export const LOOT_BEAM_HEIGHT = 128,
  LOOT_BEAM_RADIUS = 24;
export function drawLootBeam(ctx, x, y, now, color, phase = 0) {
  const pulse = 0.9 + 0.1 * Math.sin(now / 520 + phase),
    height = LOOT_BEAM_HEIGHT;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = pulse;
  const shaft = ctx.createLinearGradient(x, y - height, x, y);
  shaft.addColorStop(0, color + "00");
  shaft.addColorStop(0.2, color + "28");
  shaft.addColorStop(0.65, color + "80");
  shaft.addColorStop(1, color + "cc");
  ctx.fillStyle = shaft;
  ctx.beginPath();
  ctx.moveTo(x - 5, y - height);
  ctx.lineTo(x + 5, y - height);
  ctx.lineTo(x + 14, y);
  ctx.lineTo(x - 14, y);
  ctx.closePath();
  ctx.fill();
  const core = ctx.createLinearGradient(x, y - height, x, y);
  core.addColorStop(0, "#fff7d000");
  core.addColorStop(0.4, "#fff7d070");
  core.addColorStop(1, "#fff7d0f0");
  ctx.fillStyle = core;
  ctx.fillRect(x - 2, y - height, 4, height);
  const halo = ctx.createRadialGradient(x, y, 0, x, y, LOOT_BEAM_RADIUS);
  halo.addColorStop(0, color + "d0");
  halo.addColorStop(0.4, color + "80");
  halo.addColorStop(1, color + "00");
  ctx.fillStyle = halo;
  ctx.translate(x, y);
  ctx.scale(1, 0.35);
  ctx.beginPath();
  ctx.arc(0, 0, LOOT_BEAM_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

