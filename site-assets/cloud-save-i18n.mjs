const messages = {
  "auto_pendingSelection": [
    "云端有新进度，返回选角后自动同步。",
    "New cloud progress; syncing at character selection.",
    "Hay progreso nuevo en la nube; se sincronizará al seleccionar personajes."
  ],
  "auto_mergeFull": [
    "自动同步暂停：合并后超过6个角色。请打开云存档选择要保留的角色，两份原档均未改动。",
    "Automatic sync paused: more than 6 characters. Open Cloud saves to choose characters; both originals are unchanged.",
    "Sincronización pausada: se superan 6 personajes. Abre Partidas en la nube para elegir; ambos originales siguen intactos."
  ],
  "auto_loaded": [
    "已自动同步云端角色；本机进度已备份。",
    "Cloud characters synced automatically; local progress was backed up.",
    "Personajes sincronizados; se guardó una copia del progreso local."
  ],
  "keepLocal": [
    "保留本机",
    "Keep local",
    "Conservar local"
  ],
  "useCloud": [
    "采用云端",
    "Use cloud",
    "Usar nube"
  ],
  "backupTools": [
    "更多选项（备份与恢复）",
    "More options (backup & recovery)",
    "Más opciones (copias y recuperación)"
  ],
  "exportLocal": [
    "导出本机存档文件",
    "Export local save file",
    "Exportar partida local"
  ],
  "exportCloud": [
    "导出云端存档文件",
    "Export cloud save file",
    "Exportar partida de la nube"
  ],
  "exportMergeLocal": [
    "导出上次合并前的本机备份",
    "Export pre-merge local backup",
    "Exportar copia local anterior a la combinación"
  ],
  "exportMergeRemote": [
    "导出上次合并前的云端备份",
    "Export pre-merge cloud backup",
    "Exportar copia de nube anterior a la combinación"
  ],
  "merge": [
    "合并角色",
    "Merge characters",
    "Combinar personajes"
  ],
  "mergeHelp": [
    "逐个选择角色版本：保留本机，或采用云端。不同角色可加入；同一角色不会拼接等级、装备或任务，最多6个角色。",
    "Choose local or cloud progress for each character. Add different characters. A character’s levels, equipment and quests are never combined. Maximum 6 characters.",
    "Elige el progreso local o de la nube de cada personaje. Añade personajes distintos. Nunca se mezclan niveles, equipo ni misiones de un personaje. Máximo 6 personajes."
  ],
  "mergeReview": [
    "合并并保存到云端",
    "Merge and save to cloud",
    "Combinar y guardar en la nube"
  ],
  "mergeSelection": [
    "请选择至少一个要加入或采用云端版本的角色。",
    "Select at least one character to add or use from the cloud.",
    "Selecciona al menos un personaje para añadir o usar desde la nube."
  ],
  "mergeDuplicate": [
    "本机已有同名角色，不会覆盖",
    "A local character has this name; it will not be overwritten",
    "Ya existe un personaje local con este nombre; no se sobrescribe"
  ],
  "mergeFull": [
    "合并后超过6个角色，请减少选择。未改动存档。",
    "More than 6 characters. Select fewer; no saves changed.",
    "Se superan los 6 personajes. Selecciona menos; no se ha cambiado ninguna partida."
  ],
  "mergeInvalid": [
    "无法安全合并此存档，原进度未改动。",
    "This save cannot be merged safely; original progress is unchanged.",
    "No se puede combinar esta partida con seguridad; no se cambia el progreso original."
  ],
  "mergeConfirm": [
    "按下方选择保存并上传：未改选的角色保留本机，选择云端的角色整份替换，勾选的新角色加入。操作前自动备份两份原存档。",
    "Save and upload your choices: keep local characters by default, replace entire characters when cloud is selected, and add checked new characters. Both originals are backed up first.",
    "Guarda y sube tus elecciones: conserva los personajes locales por defecto, sustituye el personaje completo al elegir nube y añade los nuevos marcados. Antes se guardan ambas copias."
  ],
  "mergeAdd": [
    "加入这些云端角色",
    "Add these cloud characters",
    "Añadir estos personajes de la nube"
  ],
  "merged": [
    "角色选择已保存并同步，其他设备会在选角时自动核对。",
    "Character choices are saved and synced. Other devices check automatically at character selection.",
    "Elecciones guardadas y sincronizadas. Los otros dispositivos comprobarán el progreso en la selección."
  ],
  "mergedLocal": [
    "角色已合并到本机，但本次上传未确认成功。两份原存档备份已保留；请核对最新云档后重试。",
    "Characters are merged locally, but upload success is unconfirmed. Both original backups are retained; review the latest cloud save before retrying.",
    "Personajes combinados localmente, pero no se confirma la subida. Se conservan ambas copias originales; revisa la nube antes de reintentar."
  ],
  "auto_guest": [
    "进度仅在本机，登录后可自动同步",
    "Progress is local; sign in for automatic sync",
    "El progreso es local; accede para sincronizar automáticamente"
  ],
  "auto_size": [
    "自动上传暂停：存档超过大小限制",
    "Automatic uploads paused: save is too large",
    "Subidas pausadas: la partida es demasiado grande"
  ],
  "auto_invalid": [
    "自动上传暂停：请检查存档",
    "Automatic uploads paused: check your save",
    "Subidas pausadas: revisa la partida"
  ],
  "auto_accountChanged": [
    "自动上传暂停：账号已切换",
    "Automatic uploads paused: account changed",
    "Subidas pausadas: la cuenta cambió"
  ],
  "auto_auth": [
    "自动上传暂停：请重新登录",
    "Automatic uploads paused: sign in again",
    "Subidas pausadas: inicia sesión de nuevo"
  ],
  "auto_conflict": [
    "同步暂停，本机进度已保留。返回选角后自动核对；若同角色两边都有修改，请在云存档中选择保留哪份。",
    "Sync paused; local progress is kept. Return to selection for an automatic check. If both devices changed one character, choose its version in Cloud saves.",
    "Sincronización pausada; se conserva el progreso local. Vuelve a la selección para comprobarlo. Si ambos dispositivos cambiaron un personaje, elige su versión en Partidas en la nube."
  ],
  "auto_firstLoad": [
    "此设备尚未连接当前云档，请核对角色。已有进度保留，需要选择时会逐角色说明。",
    "This device has not connected to the current cloud save. Review the characters; existing progress is kept and any choices are explained per character.",
    "Este dispositivo aún no está conectado a la partida actual. Revisa los personajes; se conserva el progreso y se explicará cada elección."
  ],
  "auto_retry": [
    "云端暂不可用，将自动重试",
    "Cloud unavailable; automatic retry pending",
    "Nube no disponible; se reintentará automáticamente"
  ],
  "auto_offline": [
    "当前离线，本机保存继续；联网后重试",
    "Offline. Local saving continues; retrying when online",
    "Sin conexión. Sigue el guardado local; se reintentará al conectar"
  ],
  "auto_off": [
    "自动同步已关闭，进度仅保存在本机",
    "Automatic sync is off; progress stays on this device",
    "La sincronización está desactivada; el progreso queda en este dispositivo"
  ],
  "auto_uploading": [
    "正在同步，等待云端确认…",
    "Syncing; waiting for cloud confirmation…",
    "Sincronizando; esperando confirmación de la nube…"
  ],
  "auto_unchanged": [
    "进度已与云端一致",
    "Progress matches the cloud",
    "El progreso coincide con la nube"
  ],
  "auto_uploaded": [
    "云端已确认，本次进度已同步",
    "Cloud confirmed; this progress is synced",
    "La nube ha confirmado este progreso"
  ],
  "auto_downloaded": [
    "已同步云端进度",
    "Cloud progress synced",
    "Progreso de la nube sincronizado"
  ],
  "auto_rollback": [
    "本机备份已恢复，等待重新核对云端",
    "Local backup restored; cloud check pending",
    "Copia local restaurada; pendiente de comprobar la nube"
  ],
  "auto_guestBinding": [
    "此设备有未归属进度，请选择是否关联当前账号",
    "Unassigned progress on this device needs an account choice",
    "El progreso sin asignar necesita que elijas una cuenta"
  ],
  "auto_upgradeRequired": [
    "存档同步协议已升级，请保存本机进度并更新游戏",
    "Save sync has been upgraded; save locally and update the game",
    "La sincronización ha cambiado; guarda localmente y actualiza el juego"
  ],
  "storageFull": [
    "本机存储空间不足，未能确认操作完成。请先导出存档，释放空间后重新核对云端。",
    "Local storage is full; completion is unconfirmed. Export your save, free space, then check the cloud again.",
    "El almacenamiento local está lleno; no se confirma la acción. Exporta la partida, libera espacio y vuelve a comprobar la nube."
  ],
  "auto_storage": [
    "本机存储空间不足，同步暂停。请先导出存档，释放空间后重新核对。",
    "Local storage is full; sync is paused. Export your save, free space, then check again.",
    "El almacenamiento local está lleno; sincronización pausada. Exporta la partida, libera espacio y vuelve a comprobar."
  ],
  "auto_waiting": [
    "本机进度已保存，等待同步核对",
    "Progress saved locally; sync check pending",
    "Progreso guardado localmente; sincronización pendiente"
  ],
  "autoHelp": [
    "登录后在选角页自动同步：空设备载入云端角色，不同角色合并；同角色两边都有修改时保留选择。游戏中登录不会中断战斗，返回选角后同步。有变化时每5分钟及升级、切图、返回选角后上传，最短间隔1分钟。关闭此开关会同时停止自动上传和下载。",
    "Sign-in syncs at character selection: empty devices load cloud characters and different characters merge. Conflicting progress requires a choice. Signing in during play never interrupts combat; return to selection to sync. Changed progress uploads every 5 minutes and at checkpoints, at most once per minute. Turning this off stops automatic uploads and downloads.",
    "Al acceder se sincroniza en la selección: los dispositivos vacíos cargan personajes y los distintos se combinan. Los conflictos requieren elegir. El combate no se interrumpe; vuelve a la selección. Los cambios se suben cada 5 minutos y en puntos de control, como máximo una vez por minuto. Desactivar detiene subidas y descargas automáticas."
  ],
  "autoLabel": [
    "自动同步云存档",
    "Sync cloud saves automatically",
    "Sincronizar partidas automáticamente"
  ],
  "guestButton": [
    "登录 / 云存档",
    "Sign in / Saves",
    "Acceso / Nube"
  ],
  "accountTitle": [
    "账号与云存档",
    "Account & cloud saves",
    "Cuenta y partidas en la nube"
  ],
  "guestTitle": [
    "游客 · 登录与云存档",
    "Guest · Sign in & cloud saves",
    "Invitado · Acceso y nube"
  ],
  "member": [
    "已登录：{name}",
    "Signed in: {name}",
    "Sesión iniciada: {name}"
  ],
  "guest": [
    "游客（未登录）",
    "Guest (signed out)",
    "Invitado (sin sesión)"
  ],
  "checking": [
    "正在确认账号状态",
    "Checking account status",
    "Comprobando la cuenta"
  ],
  "accountUnavailable": [
    "暂时无法确认登录状态",
    "Sign-in status unavailable",
    "No se puede comprobar la sesión"
  ],
  "memberSave": [
    "本机自动保存 · 云端自动上传状态见“云存档”",
    "Local autosave · See Cloud saves for automatic upload status",
    "Guardado local · Consulta el estado de subidas en Partidas en la nube"
  ],
  "guestSave": [
    "进度保存在本机；登录后支持自动上传云存档。",
    "Progress stays on this device; sign in for automatic cloud uploads.",
    "El progreso se guarda aquí; inicia sesión para subidas automáticas."
  ],
  "unknownSave": [
    "本机保存可继续；连接恢复后重新确认账号。",
    "Local saving continues. Reconnect to verify your account.",
    "El guardado local continúa. Conéctate para comprobar tu cuenta."
  ],
  "manageAccount": [
    "管理账号",
    "Manage account",
    "Gestionar cuenta"
  ],
  "saveLocal": [
    "保存到本机",
    "Save on this device",
    "Guardar en este dispositivo"
  ],
  "savedLocal": [
    "已保存到本机；自动上传状态可在云存档中查看。",
    "Saved locally. Check automatic upload status in Cloud saves.",
    "Guardado localmente. Consulta las subidas automáticas en Partidas en la nube."
  ],
  "title": [
    "云存档",
    "Cloud saves",
    "Partidas en la nube"
  ],
  "intro": [
    "本机自动保存不变。登录后默认自动同步：选角时载入或合并云端角色，游戏中自动上传；双方都有修改时由你选择，不直接覆盖。可在更多选项中关闭。云端保留最新一份，合并前备份保存在本机。",
    "Local autosave stays on. Cloud sync is enabled after sign-in: characters load or merge at character selection, and progress uploads during play. If both copies changed, you choose what to keep. Disable sync in More options. The cloud keeps the latest save; backups made before merging stay on this device.",
    "El guardado local sigue activo. La sincronización se activa al iniciar sesión: los personajes se cargan o combinan en la selección y el progreso se sube durante el juego. Si ambas copias cambiaron, tú decides cuál conservar. Puedes desactivarla en Más opciones. La nube conserva la última partida; las copias anteriores a una combinación se guardan en este dispositivo."
  ],
  "login": [
    "登录 / 注册",
    "Sign in / Register",
    "Entrar / Registrarse"
  ],
  "refresh": [
    "刷新账号与云存档",
    "Refresh account and cloud save",
    "Actualizar cuenta y partida"
  ],
  "upload": [
    "立即上传",
    "Upload now",
    "Subir ahora"
  ],
  "load": [
    "读取到本机",
    "Load on this device",
    "Cargar en este dispositivo"
  ],
  "rollback": [
    "恢复读取前的本机备份",
    "Restore local backup",
    "Restaurar copia local"
  ],
  "empty": [
    "还没有云存档",
    "No cloud save yet",
    "Aún no hay partida en la nube"
  ],
  "history": [
    "最新云存档",
    "Latest cloud save",
    "Última partida en la nube"
  ],
  "local": [
    "本机角色",
    "Local characters",
    "Personajes locales"
  ],
  "working": [
    "正在处理…",
    "Working…",
    "Procesando…"
  ],
  "confirm": [
    "确认",
    "Confirm",
    "Confirmar"
  ],
  "cancel": [
    "取消",
    "Cancel",
    "Cancelar"
  ],
  "uploadConfirm": [
    "将全部本机角色上传到云端，并替换上一份云存档。旧云档不再保留，无法从云端找回。已参加展示榜时，此次上传也会更新公开成绩。",
    "Upload all local characters and replace the previous cloud save. The old cloud save will not be retained or recoverable from the cloud. If you joined the leaderboard, this also updates your public entry.",
    "Sube todos los personajes locales y reemplaza la partida anterior. La anterior no se conserva ni puede recuperarse de la nube. Si participas en la clasificación, también se actualizará tu resultado público."
  ],
  "loadConfirm": [
    "将替换本机全部角色。读取前自动备份，可用“恢复本机备份”撤销。",
    "Replace all local characters. A local backup is created first so you can undo this load.",
    "Se reemplazarán todos los personajes locales. Antes se crea una copia local para poder deshacerlo."
  ],
  "rollbackConfirm": [
    "恢复最近一次云端读取前的本机进度；不会改动云端存档。",
    "Restore local progress from before the last cloud load. Cloud saves are unchanged.",
    "Restaura el progreso local anterior a la última carga. No se cambia la nube."
  ],
  "uploaded": [
    "已上传。",
    "Uploaded.",
    "Subida completada."
  ],
  "loaded": [
    "已读取，原本机进度已备份。",
    "Loaded. Your previous local progress is backed up.",
    "Partida cargada. Hay una copia del progreso local anterior."
  ],
  "restored": [
    "已恢复本机备份。再次上传前，请先检查云端版本。",
    "Local backup restored. Review the cloud version before uploading again.",
    "Copia local restaurada. Revisa la versión en la nube antes de volver a subir."
  ],
  "noBackup": [
    "没有读取前备份。",
    "No local backup is available.",
    "No hay copia local disponible."
  ],
  "auth": [
    "请先登录，或刷新账号状态。",
    "Sign in, or refresh your account status.",
    "Inicia sesión o actualiza el estado de la cuenta."
  ],
  "firstLoad": [
    "此设备尚未读取已有云档。可选择“合并不同角色”保留两边角色，或核对后读取云档。",
    "Merge different characters to keep both devices’ characters, or review the cloud save before loading.",
    "Combina personajes distintos para conservar los de ambos dispositivos, o revisa la nube antes de cargar."
  ],
  "conflict": [
    "云端版本已变化，本次没有覆盖。本机进度保留。请刷新核对；不同角色可选择合并，不必覆盖本机。",
    "The cloud version changed. Nothing was overwritten. Local progress is preserved. Refresh to review; different characters can be merged without replacing local characters.",
    "La versión en la nube ha cambiado. No se sobrescribió nada. Se conserva el progreso local. Actualiza y revisa; puedes combinar personajes distintos sin reemplazar los locales."
  ],
  "accountChanged": [
    "登录账号已改变，请关闭窗口后重新打开。",
    "Your account changed. Close and reopen this window.",
    "La cuenta cambió. Cierra y vuelve a abrir esta ventana."
  ],
  "size": [
    "存档超过1 MB上限，本机进度仍安全保存。",
    "Save exceeds the 1 MB limit. Local progress is still safe.",
    "La partida supera 1 MB. El progreso local sigue a salvo."
  ],
  "invalid": [
    "存档格式不兼容，未覆盖本机进度。",
    "Incompatible save. Local progress was not replaced.",
    "Partida incompatible. No se reemplazó el progreso local."
  ],
  "missing": [
    "该云存档已被新上传替换，请刷新。",
    "This cloud save has been replaced. Refresh to see the latest one.",
    "Esta partida ha sido reemplazada. Actualiza para ver la última."
  ],
  "unavailable": [
    "云端暂不可用，请稍后重试。本机保存不受影响。",
    "Cloud saves are unavailable. Retry later; local saving still works.",
    "La nube no está disponible. Reintenta más tarde; el guardado local sigue funcionando."
  ],
  "time": [
    "云端接收时间",
    "Received by the cloud",
    "Recibido por la nube"
  ],
  "localTime": [
    "本机写入时间（不代表进度较新）",
    "Local checkpoint time (not progress age)",
    "Escritura local (no indica progreso más nuevo)"
  ],
  "level": [
    "等级",
    "Level",
    "Nivel"
  ]
}
;


export const cloudMessages = (locale) =>
  Object.fromEntries(
    Object.entries(messages).map(([key, value]) => [
      key,
      value[locale === "en" ? 1 : locale === "es" ? 2 : 0],
    ]),
  );

export function accountPresentation(session, locale) {
  const m = cloudMessages(locale),
    member = session.status === "member",
    guest = session.status === "guest";
  return {
    identity: member
      ? m.member.replace("{name}", session.user.nickname)
      : guest
        ? m.guest
        : session.status === "checking"
          ? m.checking
          : m.accountUnavailable,
    button: guest ? m.guestButton : m.title,
    detail: member ? m.memberSave : guest ? m.guestSave : m.unknownSave,
    title: member ? m.accountTitle : guest ? m.guestTitle : m.title,
    link: member ? m.manageAccount : m.login,
  };
}

const panelRows = {
  "rateLimited": [
    "云端请求过于频繁，仍待同步，请稍后重试。",
    "Too many cloud requests. Sync is still pending; retry shortly.",
    "Demasiadas solicitudes. La sincronización sigue pendiente; reintenta más tarde."
  ],
  "timeout": [
    "尚未收到云端确认，本机可以继续，请重新核对后重试。",
    "Cloud confirmation timed out. Continue locally, then check and retry.",
    "Se agotó la espera de confirmación. Continúa en este dispositivo y vuelve a comprobar."
  ],
  "savedAccount": [
    "此前账号的本机进度",
    "Previously used account on this device",
    "Cuenta usada antes en este dispositivo"
  ],
  "offlineAccount": [
    "正在使用此前账号保存在本机的进度。账号尚未联网核验，登录后再同步。",
    "Using this device’s saved account progress. Sign in online before syncing.",
    "Se usa el progreso de la cuenta guardado aquí. Inicia sesión en línea antes de sincronizar."
  ],
  "characterId": [
    "角色标识",
    "Character ID",
    "ID del personaje"
  ],
  "synced": [
    "已同步",
    "Synced",
    "Sincronizado"
  ],
  "syncing": [
    "正在同步",
    "Syncing",
    "Sincronizando"
  ],
  "pending": [
    "待同步",
    "Sync pending",
    "Pendiente de sincronizar"
  ],
  "choice": [
    "需要选择",
    "A choice is needed",
    "Es necesario elegir"
  ],
  "localOnly": [
    "仅本机",
    "On this device only",
    "Solo en este dispositivo"
  ],
  "updateTitle": [
    "需要更新",
    "Update required",
    "Actualización necesaria"
  ],
  "verified": [
    "云端已确认，其他设备可以继续。",
    "The cloud has confirmed this progress. You can continue on another device.",
    "La nube ha confirmado este progreso. Puedes continuar en otro dispositivo."
  ],
  "syncWait": [
    "正在保存到云端，等待确认。本机游戏可以继续。",
    "Saving to the cloud and waiting for confirmation. You can keep playing locally.",
    "Guardando en la nube y esperando confirmación. Puedes seguir jugando localmente."
  ],
  "offline": [
    "当前离线。本机进度已保存，联网后再同步。",
    "You are offline. Progress is saved locally and will sync after reconnection.",
    "Sin conexión. El progreso está guardado localmente y se sincronizará al conectar."
  ],
  "retry": [
    "暂时无法连接云端。本机进度已保存，请重试。",
    "The cloud is temporarily unavailable. Progress is saved locally; try again.",
    "La nube no está disponible. El progreso está guardado localmente; reintenta."
  ],
  "waiting": [
    "本机进度已保存，尚未确认与云端一致。",
    "Progress is saved locally. A matching cloud copy has not yet been confirmed.",
    "El progreso está guardado localmente. Aún no se ha confirmado que coincida con la nube."
  ],
  "pendingSelection": [
    "需要在选角页核对账号和进度。当前游戏不会被中断，准备好后返回选角继续。",
    "Your account and progress need a check at character selection. Your current game continues until you choose to return.",
    "Debes comprobar la cuenta y el progreso en la selección de personaje. La partida continúa hasta que decidas volver."
  ],
  "divergent": [
    "这些角色有两份不同的进度，请逐个选择要继续的一份。",
    "These characters have different versions. Choose which complete version to continue for each.",
    "Estos personajes tienen versiones distintas. Elige qué versión completa continuar de cada uno."
  ],
  "firstLoad": [
    "此设备尚未连接当前云档。请先核对角色，已有进度会保留。",
    "This device has not connected to the current cloud save. Review the characters first; existing progress is kept.",
    "Este dispositivo aún no está conectado a la partida actual. Revisa los personajes; se conserva el progreso existente."
  ],
  "guestBinding": [
    "此设备有未归属进度。只有确认关联后，才会同步到当前账号。",
    "This device has unassigned progress. It will sync to this account only after you confirm the link.",
    "Este dispositivo tiene progreso sin asignar. Solo se sincronizará con esta cuenta cuando confirmes el vínculo."
  ],
  "guest": [
    "尚未登录。进度保存在这台设备，登录后可在其他设备继续。",
    "You are signed out. Progress stays on this device; sign in to continue elsewhere.",
    "No has iniciado sesión. El progreso queda en este dispositivo; accede para continuar en otro."
  ],
  "off": [
    "自动同步已关闭，上传和下载都已暂停。本机保存继续。",
    "Automatic sync is off. Uploads and downloads are paused; local saving continues.",
    "La sincronización está desactivada. Se pausan subidas y descargas; sigue el guardado local."
  ],
  "auth": [
    "登录状态已过期。本机进度保留，请重新登录。",
    "Your session has expired. Local progress is kept; sign in again.",
    "La sesión ha caducado. Se conserva el progreso local; inicia sesión de nuevo."
  ],
  "size": [
    "存档超过同步大小限制，本机进度已保留。",
    "The save exceeds the sync size limit. Local progress is kept.",
    "La partida supera el límite de sincronización. Se conserva el progreso local."
  ],
  "invalid": [
    "暂时无法安全同步这份存档，本机进度已保留。",
    "This save cannot be synced safely yet. Local progress is kept.",
    "Aún no se puede sincronizar esta partida con seguridad. Se conserva el progreso local."
  ],
  "mergeFull": [
    "合并后会超过6个角色，请先处理角色数量。两份进度均已保留。",
    "Merging would exceed 6 characters. Review the character count first; both copies are kept.",
    "La combinación superaría 6 personajes. Revisa la cantidad; se conservan ambas copias."
  ],
  "updateRequired": [
    "存档同步已升级。请先保存本机进度，再更新游戏后重试。",
    "Save sync has been upgraded. Save locally, then update the game and retry.",
    "La sincronización ha cambiado. Guarda localmente, actualiza el juego y reintenta."
  ],
  "continue": [
    "继续游戏",
    "Continue playing",
    "Continuar jugando"
  ],
  "continueLocal": [
    "继续本机游戏",
    "Keep playing locally",
    "Seguir jugando localmente"
  ],
  "syncNow": [
    "立即同步",
    "Sync now",
    "Sincronizar ahora"
  ],
  "returnToSelect": [
    "返回选角并核对",
    "Return to selection and check",
    "Volver a selección y comprobar"
  ],
  "retryAction": [
    "重新核对",
    "Check again",
    "Comprobar de nuevo"
  ],
  "enable": [
    "开启自动同步",
    "Enable automatic sync",
    "Activar sincronización"
  ],
  "login": [
    "登录并同步",
    "Sign in and sync",
    "Acceder y sincronizar"
  ],
  "bind": [
    "关联此设备进度",
    "Link this device’s progress",
    "Vincular progreso del dispositivo"
  ],
  "compare": [
    "比较并选择",
    "Compare and choose",
    "Comparar y elegir"
  ],
  "update": [
    "保存并更新游戏",
    "Save and update game",
    "Guardar y actualizar el juego"
  ],
  "account": [
    "当前账号",
    "Current account",
    "Cuenta actual"
  ],
  "guestAccount": [
    "此设备游客",
    "Guest on this device",
    "Invitado de este dispositivo"
  ],
  "roles": [
    "角色进度",
    "Character progress",
    "Progreso de personajes"
  ],
  "noRoles": [
    "暂无角色",
    "No characters yet",
    "Aún no hay personajes"
  ],
  "confirmed": [
    "云端已确认于",
    "Cloud confirmed at",
    "Confirmado por la nube"
  ],
  "notConfirmed": [
    "云端尚未确认本次进度",
    "This progress is not yet confirmed by the cloud",
    "La nube aún no ha confirmado este progreso"
  ],
  "unknownDate": [
    "时间未知",
    "Time unknown",
    "Fecha desconocida"
  ],
  "device": [
    "来源设备",
    "Source device",
    "Dispositivo de origen"
  ],
  "thisDevice": [
    "这台设备",
    "This device",
    "Este dispositivo"
  ],
  "otherDevice": [
    "另一台设备",
    "Other device",
    "Otro dispositivo"
  ],
  "localVersion": [
    "继续这台设备的版本",
    "Continue this device’s version",
    "Continuar la versión de este dispositivo"
  ],
  "cloudVersion": [
    "继续另一台设备的版本",
    "Continue the other device’s version",
    "Continuar la versión del otro dispositivo"
  ],
  "deleted": [
    "这个版本中角色已删除",
    "This character is deleted in this version",
    "El personaje está eliminado en esta versión"
  ],
  "wholeCharacter": [
    "每个角色只采用一个完整版本，经验、金币和物品不会相加。确认前保留恢复副本。",
    "One complete version is used for each character. Experience, gold and items are not added together. Recovery copies are kept before confirmation.",
    "Se usa una versión completa por personaje. No se suman experiencia, oro ni objetos. Se conservan copias antes de confirmar."
  ],
  "chooseAll": [
    "请为每个分歧角色选择一份进度；不会预选任何一边。",
    "Choose a version for every conflicting character. Neither side is selected for you.",
    "Elige una versión para cada personaje en conflicto. No hay ninguna elegida por defecto."
  ],
  "applyChoices": [
    "按选择继续并同步",
    "Continue and sync these choices",
    "Continuar y sincronizar estas elecciones"
  ],
  "later": [
    "稍后处理",
    "Decide later",
    "Decidir más tarde"
  ],
  "level": [
    "等级",
    "Level",
    "Nivel"
  ],
  "xp": [
    "经验",
    "Experience",
    "Experiencia"
  ],
  "gold": [
    "金币",
    "Gold",
    "Oro"
  ],
  "activeQuests": [
    "进行中任务",
    "Active quests",
    "Misiones activas"
  ],
  "completedQuests": [
    "已完成任务",
    "Completed quests",
    "Misiones completadas"
  ],
  "questProgress": [
    "任务目标进度",
    "Quest objective progress",
    "Progreso de objetivos"
  ],
  "lateQuests": [
    "后期任务进度",
    "Late-game quest progress",
    "Progreso de misiones avanzadas"
  ],
  "equipment": [
    "装备",
    "Equipment",
    "Equipo"
  ],
  "inventory": [
    "背包",
    "Inventory",
    "Inventario"
  ],
  "storage": [
    "仓库",
    "Storage",
    "Almacén"
  ],
  "questItems": [
    "任务物品",
    "Quest items",
    "Objetos de misión"
  ],
  "items": [
    "件",
    "items",
    "objetos"
  ],
  "added": [
    "多出",
    "More",
    "Más"
  ],
  "removed": [
    "少于",
    "Fewer",
    "Menos"
  ],
  "changed": [
    "不同位置",
    "different slots",
    "espacios distintos"
  ],
  "none": [
    "无",
    "None",
    "Ninguno"
  ],
  "taskChanged": [
    "任务进度与另一份不同",
    "Quest progress differs from the other version",
    "El progreso de misiones difiere de la otra versión"
  ],
  "advanced": [
    "更多选项（恢复与诊断）",
    "More options (recovery & diagnostics)",
    "Más opciones (recuperación y diagnóstico)"
  ],
  "exportLocal": [
    "导出本机存档文件",
    "Export local save file",
    "Exportar partida local"
  ],
  "exportCloud": [
    "导出云端存档文件",
    "Export cloud save file",
    "Exportar partida de la nube"
  ],
  "loadCloud": [
    "整档采用云端进度",
    "Replace all local progress from cloud",
    "Sustituir todo el progreso local desde la nube"
  ],
  "rollback": [
    "恢复本机备份",
    "Restore local backup",
    "Restaurar copia local"
  ],
  "exportMergeLocal": [
    "导出选择前的本机恢复副本",
    "Export local copy from before the choice",
    "Exportar copia local anterior a la elección"
  ],
  "exportMergeRemote": [
    "导出选择前的云端恢复副本",
    "Export cloud copy from before the choice",
    "Exportar copia de nube anterior a la elección"
  ],
  "loadConfirm": [
    "这会替换本机全部角色。继续前保留恢复副本；请确认要整档采用云端。",
    "This replaces all local characters. Recovery copies are kept first. Confirm only if you want the complete cloud save.",
    "Se reemplazarán todos los personajes locales. Antes se conservan copias. Confirma solo si quieres toda la partida de la nube."
  ],
  "rollbackConfirm": [
    "恢复本机备份后会重新核对云端，尚未同步的变化会明确标记。",
    "Restoring a local backup triggers a new cloud check. Changes not yet synced will remain marked.",
    "Restaurar una copia local vuelve a comprobar la nube. Se indicarán los cambios aún no sincronizados."
  ],
  "bindConfirm": [
    "将此设备的未归属角色关联到当前账号并核对云端。已有原档会保留，不会自动挑选同角色的赢家。",
    "Link unassigned characters on this device to the current account and check the cloud. Originals are kept; conflicting versions are not chosen automatically.",
    "Vincula los personajes sin asignar a la cuenta actual y comprueba la nube. Se conservan los originales; no se elige automáticamente entre versiones en conflicto."
  ],
  "confirm": [
    "确认继续",
    "Confirm and continue",
    "Confirmar y continuar"
  ],
  "cancel": [
    "取消",
    "Cancel",
    "Cancelar"
  ],
  "enabled": [
    "自动同步（上传与下载）",
    "Automatic sync (upload & download)",
    "Sincronización automática (subida y descarga)"
  ],
  "deviceName": [
    "这台设备的名称",
    "This device’s name",
    "Nombre de este dispositivo"
  ],
  "rename": [
    "保存设备名称",
    "Save device name",
    "Guardar nombre"
  ],
  "deviceHint": [
    "用于说明进度来源，不用于判断哪个版本更新。",
    "Helps identify progress sources; never determines which version is newer.",
    "Identifica el origen del progreso; nunca decide qué versión es más reciente."
  ],
  "deviceNameRequired": [
    "请填写设备名称。",
    "Enter a device name.",
    "Introduce un nombre de dispositivo."
  ],
  "deviceNameTooLong": [
    "设备名称请不超过40个字符。",
    "Use at most 40 characters for the device name.",
    "Usa como máximo 40 caracteres para el nombre."
  ],
  "diagnostics": [
    "同步诊断",
    "Sync diagnostics",
    "Diagnóstico de sincronización"
  ],
  "head": [
    "云端版本",
    "Cloud revision",
    "Versión de nube"
  ],
  "base": [
    "共同版本",
    "Common revision",
    "Versión común"
  ],
  "progressSeq": [
    "本机进度序号",
    "Local progress sequence",
    "Secuencia de progreso local"
  ],
  "checkpoint": [
    "本机写入于",
    "Local checkpoint written at",
    "Copia local escrita el"
  ],
  "checkpointHelp": [
    "本机写入时间不是进度新旧依据；不会用两台设备的时钟决定覆盖。",
    "Checkpoint time does not indicate newer progress. Device clocks never decide replacement.",
    "La fecha de escritura no indica un progreso más nuevo. Los relojes no deciden qué reemplazar."
  ],
  "recoveries": [
    "可恢复副本",
    "Recovery copies",
    "Copias recuperables"
  ],
  "recoveryRetention": [
    "最近一次人工选择或恢复前的副本，最多两份，保留7天。",
    "Up to two copies from before the latest manual choice or recovery, retained for 7 days.",
    "Hasta dos copias anteriores a la última elección o recuperación manual, conservadas 7 días."
  ],
  "recoveryEmpty": [
    "暂无可恢复副本。",
    "No recovery copies available.",
    "No hay copias recuperables."
  ],
  "recoveryLocal": [
    "原本机进度",
    "Original local progress",
    "Progreso local original"
  ],
  "recoveryCloud": [
    "原云端进度",
    "Original cloud progress",
    "Progreso original de la nube"
  ],
  "created": [
    "创建于",
    "Created at",
    "Creada el"
  ],
  "expires": [
    "保留至",
    "Available until",
    "Disponible hasta"
  ],
  "restoreRecovery": [
    "恢复这份副本",
    "Restore this copy",
    "Restaurar esta copia"
  ],
  "recoveryConfirm": [
    "将采用这份恢复副本并重新核对云端。继续前保留当前进度，不会直接倒退云端版本。",
    "Use this recovery copy and check the cloud again. Current progress is preserved first; the cloud revision is not rolled back.",
    "Usa esta copia y vuelve a comprobar la nube. Antes se conserva el progreso actual; no se retrocede la versión de nube."
  ],
  "working": [
    "正在处理…",
    "Working…",
    "Procesando…"
  ],
  "failed": [
    "暂时无法完成操作，本机进度已保留。请重新核对。",
    "The action could not be completed. Local progress is kept; check again.",
    "No se pudo completar la acción. Se conserva el progreso local; vuelve a comprobarlo."
  ],
  "accountChanged": [
    "账号已切换，请重新打开此窗口核对当前账号。",
    "The account changed. Reopen this window to check the current account.",
    "La cuenta ha cambiado. Vuelve a abrir esta ventana para comprobarla."
  ],
  "completed": [
    "操作完成，请以当前同步状态为准。",
    "Action completed. Check the current sync status.",
    "Acción completada. Comprueba el estado actual."
  ],
  "storageFull": [
    "本机存储空间不足，未能确认操作完成。请先导出存档，释放空间后重新核对云端。",
    "Local storage is full; completion is unconfirmed. Export your save, free space, then check the cloud again.",
    "El almacenamiento local está lleno; no se confirma la acción. Exporta la partida, libera espacio y vuelve a comprobar la nube."
  ]
}
;


export const cloudPanelMessages = (locale) =>
  Object.fromEntries(
    Object.entries(panelRows).map(([key, row]) => [
      key,
      row[locale === "en" ? 1 : locale === "es" ? 2 : 0],
    ]),
  );

