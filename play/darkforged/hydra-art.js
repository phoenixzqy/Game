// Original generated 4x2 transparent animation. Fire projectiles use Dream FireBall.
const HYDRA_SIZE = 80,
  HYDRA_SCALE = HYDRA_SIZE / 144;
export class HydraArt {
  muzzle(head) {
    const pos = [
      [-36, -82],
      [0, -110],
      [36, -82],
    ][head] || [0, -110];
    return [(pos[0] * HYDRA_SCALE) / 48, (12 + (pos[1] - 12) * HYDRA_SCALE) / 32];
  }
  constructor() {
    this.image = new Image();
    this.image.src = new URL("./assets/hydra/hydra-idle.png", import.meta.url).href;
    this.shots = new Map();
  }
  shot(id, head, now) {
    for (const [key, shot] of this.shots) if (now - shot.at > 2000) this.shots.delete(key);
    this.shots.set(id, { head, at: now });
  }
  draw(ctx, a, p, now, time) {
    if (!this.image.complete || !this.image.naturalWidth) return;
    const frame = Math.floor(now / 150) % 8,
      w = this.image.naturalWidth / 4,
      h = this.image.naturalHeight / 2,
      size = HYDRA_SIZE;
    ctx.save();
    const remaining = (a.expires || 0) - (time || 0);
    ctx.globalAlpha = remaining < 700 ? Math.max(0, remaining / 700) : 1;
    ctx.drawImage(
      this.image,
      (frame % 4) * w,
      Math.floor(frame / 4) * h,
      w,
      h,
      p.x + 24 - size / 2,
      p.y + 12 - size,
      size,
      size,
    );
    const shot = this.shots.get(a.id),
      dt = shot ? now - shot.at : 1000;
    if (dt < 200) {
      const pos = this.muzzle(shot.head),
        radius = 12 * HYDRA_SCALE;
      ctx.globalCompositeOperation = "screen";
      const x = p.x + 24 + pos[0] * 48,
        y = p.y + pos[1] * 32,
        g = ctx.createRadialGradient(x, y, 0, x, y, radius);
      g.addColorStop(0, "#fff3a9");
      g.addColorStop(0.35, "#ff9c37");
      g.addColorStop(1, "#ff4a0000");
      ctx.globalAlpha *= 1 - dt / 200;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    if (shot && dt > 1000) this.shots.delete(a.id);
  }
  icon(canvas) {
    const paint = () => {
      const c = canvas.getContext("2d"),
        w = canvas.width,
        h = canvas.height;
      c.clearRect(0, 0, w, h);
      c.fillStyle = "#23120d";
      c.fillRect(0, 0, w, h);
      if (this.image.naturalWidth)
        c.drawImage(
          this.image,
          0,
          0,
          this.image.naturalWidth / 4,
          this.image.naturalHeight / 2,
          0,
          0,
          w,
          h,
        );
      c.strokeStyle = "#d59b51";
      c.strokeRect(0.5, 0.5, w - 1, h - 1);
    };
    if (this.image.complete) paint();
    else this.image.addEventListener("load", paint, { once: true });
  }
}

