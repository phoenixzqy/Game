const copy = {
  "zh-CN": {
    title: "让角色进度跟着你",
    lead: "登录后自动云备份，换设备继续玩。",
    hint: "使用邮箱或 Google 登录。",
    prompt: "为这个角色开启云备份",
    detail: "本机进度仍会自动保存。登录后可备份到账号，换设备继续玩。",
    cta: "登录并开启云备份",
    later: "暂时不用",
    level: "等级",
    back: "返回游戏",
  },
  en: {
    title: "Keep your adventure with you",
    lead: "Sign in to back up your progress and play on another device.",
    hint: "Sign in with email or Google.",
    prompt: "Back up this character",
    detail:
      "Your progress still saves on this device. Sign in to back it up to your account and continue on another device.",
    cta: "Sign in to back up",
    later: "Not now",
    level: "Level",
    back: "Back to game",
  },
  es: {
    title: "Lleva tu aventura contigo",
    lead: "Entra para guardar tu progreso en la nube y seguir jugando en otro dispositivo.",
    hint: "Accede con tu correo o Google.",
    prompt: "Guarda este personaje en la nube",
    detail:
      "Tu progreso se sigue guardando en este dispositivo. Entra para hacer una copia en tu cuenta y continuar en otro dispositivo.",
    cta: "Entrar y guardar en la nube",
    later: "Ahora no",
    level: "Nivel",
    back: "Volver al juego",
  },
};
const baseConversionMessages = (locale) => copy[locale] || copy["zh-CN"];

const ownInvitation = {
  "zh-CN": {
    title: "梦回地狱云存档",
    lead: "登录后自动同步本游戏进度。",
    prompt: "登录，自动保存进度",
    detail: "登录后自动云存档并参加梦回地狱榜单，可随时关闭同步或退出榜单。",
    cta: "登录并自动保存",
  },
  en: {
    title: "BackMir Hell cloud saves",
    lead: "Sign in to sync this game automatically.",
    prompt: "Sign in for automatic saves",
    detail:
      "Signing in enables automatic cloud saves and BackMir Hell rankings. You can turn off sync or leave the board at any time.",
    cta: "Sign in and save automatically",
  },
  es: {
    title: "Partidas de BackMir Hell en la nube",
    lead: "Inicia sesión para sincronizar este juego automáticamente.",
    prompt: "Accede para guardar automáticamente",
    detail:
      "Al iniciar sesión, las partidas se guardan en la nube y participan en la clasificación de BackMir Hell. Puedes desactivar la sincronización o salir de la clasificación.",
    cta: "Acceder y guardar automáticamente",
  },
};
export const conversionMessages = (locale) => ({
  ...baseConversionMessages(locale),
  ...(ownInvitation[locale] || ownInvitation["zh-CN"]),
});

