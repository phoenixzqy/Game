const rows = {
  games: ["选择游戏", "Choose a game", "Elige un juego"],
  classic: ["原版", "Classic", "Clásico"],
  darkforged: ["暗金纪元", "Darkforged", "Forjanegra"],
  darkPrivacy: [
    "暗金纪元云存档默认参榜，仅公开本游戏的角色名、职业、等级、经验和更新时间，不公开邮箱、账号标识或完整存档。可随时退出，立即移除本游戏公开成绩，后续保存不会重新参榜；可自行重新参加。原版参榜设置和两款游戏的存档均不受影响。",
    "Darkforged cloud saves join its board by default. Only this game’s character names, classes, levels, XP and update times are public, never email, account identifiers or full saves. Leaving removes its public scores immediately; later saves do not rejoin you. You can rejoin yourself. Classic participation and both games’ saves stay unchanged.",
    "Las partidas de Forjanegra en la nube participan por defecto. Solo se publican nombres, clases, niveles, experiencia y fechas de este juego, nunca correos, identificadores de cuenta ni partidas completas. Al salir se retiran sus resultados y los siguientes guardados no te reinscriben. Puedes volver a participar. Clásico y las partidas de ambos juegos no cambian.",
  ],
  darkDisclosure: [
    "暗金纪元云存档默认参榜，可随时退出；与原版分别排名、分别设置。按等级、经验排序，未经完整反作弊验证。",
    "Darkforged cloud saves join automatically; you can leave at any time. Rankings and settings are separate from Classic. Ranked by level and XP, without full anti-cheat verification.",
    "Las partidas de Forjanegra en la nube participan automáticamente; puedes salir cuando quieras. Clasificación y ajustes separados de Clásico. Orden por nivel y experiencia, sin verificación completa antitrampas.",
  ],
  darkNotJoined: [
    "暗金纪元云存档默认参榜；退出后可重新参加，后续保存不会自动重开。原版设置不变。",
    "Darkforged cloud saves join by default. You can rejoin after leaving; later saves do not rejoin you. Classic settings stay unchanged.",
    "Las partidas de Forjanegra en la nube participan por defecto. Puedes volver tras salir; los siguientes guardados no te reinscriben. Los ajustes de Clásico no cambian.",
  ],
  darkNoCloudSave: [
    "还没有暗金纪元云存档。登录本游戏后会自动同步，并显示成绩。",
    "No Darkforged cloud save yet. Sign in to this game to sync automatically and show your scores.",
    "Todavía no tienes partida de Forjanegra en la nube. Inicia sesión en este juego para sincronizar automáticamente y mostrar tus resultados.",
  ],
  darkJoined: [
    "暗金纪元已参榜，榜单读取本游戏最近的云存档成绩。",
    "You have joined Darkforged; the board reads this game’s latest cloud scores.",
    "Participas en Forjanegra; la clasificación lee los últimos resultados de este juego en la nube.",
  ],
  darkJoin: [
    "重新参加暗金纪元榜单",
    "Rejoin Darkforged’s board",
    "Volver a participar en Forjanegra",
  ],
  disabled: [
    "本游戏榜单暂未开放。可以继续游玩；不会显示其他游戏的成绩。",
    "This game’s board is not open yet. You can keep playing; scores from other games are never substituted.",
    "La clasificación de este juego aún no está abierta. Puedes seguir jugando; nunca se muestran resultados de otros juegos en su lugar.",
  ],
  details: ["榜单说明与管理", "About & participation", "Información y participación"],
  shortTitle: ["排行榜", "Rankings", "Clasificación"],
  cloudOpen: ["打开云存档", "Open cloud saves", "Abrir partidas en la nube"],
  cloudChanged: [
    "云存档正在更新，请稍后再点一次。",
    "Your cloud save is changing. Please try again shortly.",
    "Tu partida en la nube se está actualizando. Vuelve a intentarlo en breve.",
  ],
  noCloudSave: [
    "登录游戏后，云存档会自动参榜。",
    "Cloud saves join automatically after game sign-in.",
    "Las partidas en la nube entran automáticamente al iniciar sesión en el juego.",
  ],
  title: ["等级排行榜", "Level leaderboard", "Clasificación de niveles"],
  lead: [
    "每一段冒险，都留下成长的足迹。",
    "Every adventure leaves a mark.",
    "Cada aventura deja huella.",
  ],
  disclosure: [
    "云存档自动参榜，可随时退出。榜单按等级、经验排序，未经完整反作弊验证。",
    "Cloud saves join automatically; you can leave at any time. Ranked by level and XP, without full anti-cheat verification.",
    "Las partidas en la nube participan automáticamente; puedes salir cuando quieras. Orden por nivel y experiencia, sin verificación completa antitrampas.",
  ],
  all: ["综合榜", "Overall", "General"],
  Warrior: ["战士", "Warrior", "Guerrero"],
  Wizard: ["法师", "Wizard", "Mago"],
  Taoist: ["道士", "Taoist", "Taoísta"],
  rank: ["名次", "Rank", "Puesto"],
  name: ["角色", "Character", "Personaje"],
  job: ["职业", "Class", "Clase"],
  level: ["等级", "Level", "Nivel"],
  xp: ["本级经验", "Level progress", "Progreso de nivel"],
  time: ["最近提交", "Last submitted", "Último envío"],
  top: ["前 100 名", "Top 100", "Los 100 primeros"],
  rules: [
    "综合榜合并三个职业榜；每个账号的每个职业取成绩最高的一名。等级优先，其次经验，相同成绩并列。满级并列；只展示最近上传的成绩。",
    "Overall combines all three class boards, taking the best character of each class per account. Sorted by level, then XP; equal scores share a rank. Maximum-level characters tie. Only the latest upload is shown.",
    "La general reúne las tres clases, con el mejor personaje de cada clase por cuenta. Orden por nivel y luego experiencia; las puntuaciones iguales comparten puesto. Los personajes de nivel máximo empatan. Solo se muestra el último envío.",
  ],
  empty: [
    "还没有玩家上榜，成为第一位冒险者吧。",
    "No entries yet. Be the first adventurer.",
    "Aún no hay participantes. Sé el primer aventurero.",
  ],
  mine: ["我的排名", "My rank", "Mi puesto"],
  signin: ["登录后参加排行榜", "Sign in to join", "Entra para participar"],
  consent: [
    "公开角色名、职业、等级、经验和更新时间；可随时退出。",
    "Publishes character names, classes, levels, XP and update times. You can leave at any time.",
    "Publica nombres, clases, niveles, experiencia y fechas de actualización. Puedes salir cuando quieras.",
  ],
  join: ["重新参榜", "Rejoin leaderboard", "Volver a participar"],
  leave: ["退出展示榜", "Leave the board", "Salir de la clasificación"],
  joined: [
    "云存档已参榜，上传后自动更新。",
    "Cloud save ranked; uploads update your entry.",
    "Partida en la clasificación; las subidas actualizan el resultado.",
  ],
  left: [
    "已退出，公开成绩已移除。本机与云存档不受影响。",
    "You have left; public entries have been removed. Local and cloud saves are unchanged.",
    "Has salido; los resultados públicos se han retirado. Las partidas locales y en la nube no cambian.",
  ],
  waiting: ["等待云存档同步。", "Waiting for cloud sync.", "Esperando la sincronización."],
  notJoined: [
    "云存档默认参榜；退出后可重新参加。",
    "Cloud saves join by default. You can rejoin after leaving.",
    "Las partidas en la nube participan por defecto. Puedes volver tras salir.",
  ],
  noClass: [
    "最近提交中没有该职业的参榜角色。",
    "No character of this class in your latest entry.",
    "No hay personajes de esta clase en tu último envío.",
  ],
  review: [
    "成绩待核查，暂不公开；云存档已保存，可以继续游玩。",
    "Entry pending review and not public. Your cloud save is safe; you can keep playing.",
    "Resultado pendiente de revisión, aún no público. La partida está guardada; puedes seguir jugando.",
  ],
  invalidProgress: [
    "等级、经验或角色名不符合展示规则。请更新游戏并检查角色，再上传。云存档不受影响。",
    "Level, XP or character name does not meet display rules. Update the game, check the character and upload again. Your cloud save is unaffected.",
    "El nivel, la experiencia o el nombre no cumplen las reglas. Actualiza el juego, revisa el personaje y vuelve a subir. La partida no se ve afectada.",
  ],
  hidden: [
    "该账号的成绩已暂停公开，请联系管理员。",
    "Entries for this account are hidden. Contact a moderator.",
    "Los resultados de esta cuenta están ocultos. Contacta con moderación.",
  ],
  refresh: ["刷新榜单", "Refresh", "Actualizar"],
  loading: ["正在加载…", "Loading…", "Cargando…"],
  unavailable: [
    "暂时无法读取榜单，请稍后刷新。游戏和本机存档仍可使用。",
    "The board is unavailable. Retry later; the game and local saves still work.",
    "La clasificación no está disponible. Reinténtalo más tarde; el juego y las partidas locales siguen funcionando.",
  ],
  participants: ["参榜角色", "Ranked characters", "Personajes clasificados"],
  max: ["满级", "Max level", "Nivel máximo"],
  you: ["你", "You", "Tú"],
  gapLevel: [
    "距离上一名还差 {n} 级",
    "{n} levels behind the next rank",
    "A {n} niveles del puesto anterior",
  ],
  gapXP: [
    "距离上一名还差 {n} 经验",
    "{n} XP behind the next rank",
    "A {n} de experiencia del puesto anterior",
  ],
  first: ["已位列榜首", "At the top", "En primera posición"],
  report: ["举报", "Report", "Denunciar"],
  reportTitle: ["举报排行榜成绩", "Report an entry", "Denunciar un resultado"],
  reportHelp: [
    "请说明异常进度或不当角色名等具体问题。",
    "Describe unusual progress, inappropriate names or another specific concern.",
    "Describe el progreso inusual, un nombre inapropiado u otro problema concreto.",
  ],
  send: ["提交举报", "Send report", "Enviar denuncia"],
  sent: [
    "举报已提交，等待管理员处理。",
    "Report sent for moderator review.",
    "Denuncia enviada a moderación.",
  ],
  cancel: ["取消", "Cancel", "Cancelar"],
  moderation: ["排行榜管理", "Leaderboard moderation", "Moderación de clasificación"],
  hide: ["暂停公开", "Hide entry", "Ocultar"],
  release: ["核查后恢复展示", "Restore after review", "Restaurar tras revisión"],
  dismiss: ["处理举报（保持现状）", "Resolve reports without changes", "Resolver sin cambios"],
  done: ["操作已完成。", "Done.", "Hecho."],
  nothing: ["暂无待处理记录。", "Nothing to review.", "Nada pendiente."],
  invalid: ["请检查填写内容。", "Check your input.", "Revisa los datos."],
  missing: [
    "记录已不存在，请刷新。",
    "Entry no longer exists. Refresh.",
    "El resultado ya no existe. Actualiza.",
  ],
  accountChanged: [
    "账号已切换，请刷新后重试。",
    "Account changed. Refresh and retry.",
    "La cuenta cambió. Actualiza y reinténtalo.",
  ],
  auth: ["请先登录。", "Sign in first.", "Inicia sesión primero."],
  open: ["查看排行榜", "View leaderboard", "Ver clasificación"],
  privacy: [
    "有云存档的账号默认参加排行榜，只公开角色名、职业、等级、经验和更新时间，不公开邮箱、Google标识或完整存档。可随时退出，退出后立即移除公开成绩，后续上传不会重新参榜；可自行重新参加。核查与举报记录仅供管理使用。",
    "Accounts with cloud saves join the leaderboard by default. Only character names, classes, levels, XP and update times are public; emails, Google identifiers and full saves stay private. You can leave at any time: entries are removed immediately and later uploads do not rejoin you. You can rejoin yourself. Review and report records are private to moderators.",
    "Las cuentas con partidas en la nube participan por defecto. Solo se publican nombres, clases, niveles, experiencia y fechas; los correos, identificadores de Google y partidas completas siguen privados. Puedes salir cuando quieras: se retiran los resultados y las siguientes subidas no te vuelven a inscribir. Puedes volver a participar. Revisiones y denuncias son privadas para moderación.",
  ],
};
export function leaderboardMessages(locale = "zh-CN", game = "classic") {
  const n = locale === "en" ? 1 : locale === "es" ? 2 : 0,
    m = Object.fromEntries(Object.entries(rows).map(([k, v]) => [k, v[n]]));
  if (game === "classic-hell") {
    m.title = ["梦回地狱排行榜", "BackMir Hell leaderboard", "Clasificación de BackMir Hell"][n];
    m.disclosure = [
      "梦回地狱独立排行，仅统计地狱版云存档；与原版、暗金纪元分别排名、分别设置。按等级、经验排序，未经完整反作弊验证。",
      "An independent board for Hell cloud saves only. Rankings and participation settings are separate from Classic and Darkforged. Ranked by level and XP, without full anti-cheat verification.",
      "Clasificación exclusiva de las partidas de Hell en la nube. Resultados y participación separados de Clásico y Darkforged. Orden por nivel y experiencia, sin verificación completa antitrampas.",
    ][n];
    m.notJoined = [
      "地狱版云存档默认参榜，可随时退出或重新参加；其他游戏的参榜设置不受影响。",
      "Hell cloud saves join by default. You can leave or rejoin; other games are unaffected.",
      "Las partidas de Hell participan por defecto. Puedes salir o volver; los demás juegos no cambian.",
    ][n];
    m.noCloudSave = [
      "请先保存一份地狱版云存档。",
      "Save a Hell character to the cloud first.",
      "Primero guarda un personaje de Hell en la nube.",
    ][n];
    m.joined = [
      "已参加地狱版排行榜；其他游戏的设置不变。",
      "Joined the Hell leaderboard; other games are unchanged.",
      "Participas en Hell; los demás juegos no cambian.",
    ][n];
  }
  return m;
}

