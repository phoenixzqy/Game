// The inherited legacy service is blocked. Use the game-specific protocol 2 cloud panel.
export class CloudAccountAPI {
  async request() {
    const code = document.documentElement.lang;
    const message =
      {
        en: "Use the Darkforged cloud save panel.",
        es: "Usa el panel de partidas en la nube de Darkforged.",
        "zh-CN": "请使用暗金纪元专属云存档面板。",
      }[code] || "Use the Darkforged cloud save panel.";
    throw new Error(message);
  }
  me() {
    return this.request();
  }
  auth() {
    return this.request();
  }
  logout() {
    return this.request();
  }
  read() {
    return this.request();
  }
  upload() {
    return this.request();
  }
}

