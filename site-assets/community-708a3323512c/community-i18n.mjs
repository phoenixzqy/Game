// Shared display text only. Database IDs, categories and player content stay unchanged.

const rows = {"officialBoard":["官方发布","Official updates","Publicaciones oficiales"],"officialEmpty":["暂无官方发布","No official updates yet","Aún no hay publicaciones oficiales"],"officialEmptyHelp":["版本更新与维护公告会发布在这里。","Version updates and maintenance notices will appear here.","Aquí se publicarán las novedades de versión y los avisos de mantenimiento."],"publicBoard":["公共交流","Public discussion","Conversación general"],"classic-hellBoard":["梦回地狱","BackMir Hell","BackMir Hell"],"classicBoard":["原版","Classic","Clásico"],"darkforgedBoard":["暗金纪元","Darkforged","Darkforged"],"boardAll":["全部","All","Todo"],"communityTools":["社区工具","Community tools","Herramientas del foro"],"officialGuides":["官方攻略","Official guides","Guías oficiales"],"sortTopics":["帖子排序","Sort discussions","Ordenar conversaciones"],"discussionBoard":["讨论区","Discussion board","Foro"],"boardHelp":["公共交流与各游戏讨论区共用账号，角色和存档仍各自独立。","Public and game-specific discussions share your account. Characters and saves stay separate.","Los foros generales y de cada juego comparten tu cuenta. Los personajes y las partidas siguen separados."],"allTopics":["全部话题","All topics","Todos los temas"],"equipmentDay":["当日装备","Equipment shared that day","Equipo del día"],"equipmentFirstDay":["展开首日装备","Show the first day’s equipment","Ver el equipo del primer día"],"equipmentTimeZone":["按北京时间分日","Days follow Beijing time (UTC+8)","Los días siguen la hora de Pekín (UTC+8)"],"lastShared":["最近分享","Last shared","Último equipo compartido"],"or":["或","or","o"],"codePlaceholder":["8 位验证码","8-digit code","Código de 8 dígitos"],"resendCode":["重新发送","Send again","Reenviar"],"resendIn":["{seconds} 秒后重发","Resend in {seconds}s","Reenviar en {seconds}s"],"codeSent":["验证码已发送，10 分钟内有效。","Code sent. Valid for 10 minutes.","Código enviado. Válido durante 10 minutos."],"sendCodeFirst":["请先获取此邮箱的验证码。","Request a code for this email first.","Primero solicita un código para este correo."],"bindEmail":["绑定登录邮箱","Link sign-in email","Vincular correo de acceso"],"changeEmail":["更换登录邮箱","Change sign-in email","Cambiar correo de acceso"],"bindEmailHint":["绑定后可用此邮箱登录，角色和云存档保持不变。","Use this email to sign in to the same account and saves.","Accede con este correo a la misma cuenta y partidas."],"emailBound":["登录邮箱已绑定。","Sign-in email linked.","Correo de acceso vinculado."],"loginEmail":["登录邮箱","Sign-in email","Correo de acceso"],"accountChanged":["账号已变化，请重新打开账号窗口。","Account changed. Reopen the account panel.","La cuenta ha cambiado. Abre de nuevo el panel de cuenta."],"originalPoster":["楼主","Author","Autor"],"allReplies":["全部回复","All replies","Todas las respuestas"],"onlyAuthor":["只看楼主","Author only","Solo el autor"],"oldest":["正序","Oldest first","Más antiguas"],"newest":["倒序","Newest first","Más recientes"],"recentActivity":["最近回复","Recent activity","Actividad reciente"],"newPosts":["最新发布","New posts","Nuevas publicaciones"],"myBookmarks":["我的收藏","My bookmarks","Mis guardados"],"floor":["第","Floor","Piso"],"respond":["回复","Reply","Responder"],"like":["赞","Like","Me gusta"],"bookmark":["收藏","Bookmark","Guardar"],"bookmarked":["已收藏","Bookmarked","Guardado"],"more":["更多操作","More actions","Más opciones"],"viewReplies":["查看楼中楼","View replies","Ver respuestas"],"moreReplies":["加载更多回复","More replies","Más respuestas"],"replyTo":["回复","Reply to","Responder a"],"cancelReply":["取消指定回复","Reply to the post instead","Responder a la publicación"],"writeReply":["写回复，聊聊你的看法…","Write a reply…","Escribe una respuesta…"],"linkCopied":["链接已复制","Link copied","Enlace copiado"],"copyLink":["复制链接","Copy link","Copiar enlace"],"lastActive":["最后更新","Last activity","Última actividad"],"replyCount":["回复","Replies","Respuestas"],"noBookmarks":["还没有收藏的帖子","No bookmarks yet","Aún no tienes guardados"],"imagePrevious":["上一张","Previous image","Imagen anterior"],"imageNext":["下一张","Next image","Imagen siguiente"],"views":["浏览","Views","Vistas"],"readingHelp":["接入后累计，每次打开计一次；网络重试不重复计数。","Total since setup. Each page load counts once; retries are deduplicated.","Total desde la activación. Una vista por apertura; los reintentos no se duplican."],"brand":["旧境传说","Backmir","Backmir"],"community":["玩家社区","Community","Comunidad"],"account":["登录 / 注册","Sign in / Register","Entrar / Registrarse"],"home":["首页","Home","Inicio"],"guide":["攻略知识库","Game guide","Guía del juego"],"play":["开始游戏","Play now","Jugar"],"privacy":["隐私政策","Privacy policy","Política de privacidad"],"terms":["社区约定","Community rules","Normas de la comunidad"],"skip":["跳到正文","Skip to content","Ir al contenido"],"nav":["主导航","Main navigation","Navegación principal"],"welcome":["欢迎回来，冒险者","Welcome, adventurer","Te damos la bienvenida, aventurero"],"loginLead":["使用邮箱或 Google 登录，首次登录会创建账号。","Sign in with email or Google. Your first sign-in creates an account.","Accede con tu correo o Google. Se creará una cuenta la primera vez."],"consent":["我已阅读隐私政策，并同意社区约定。","I have read the privacy policy and agree to the community rules.","He leído la política de privacidad y acepto las normas de la comunidad."],"continueGoogle":["继续使用 Google","Continue with Google","Continuar con Google"],"retry":["重试登录","Retry sign-in","Reintentar"],"signedIn":["已登录","Signed in","Sesión iniciada"],"nickname":["昵称","Display name","Nombre visible"],"save":["保存修改","Save changes","Guardar cambios"],"logout":["退出登录","Sign out","Cerrar sesión"],"logoutAll":["退出所有设备","Sign out on all devices","Cerrar todas las sesiones"],"localSave":["游戏仍可免注册游玩。社区页面不会上传存档；在游戏内登录后默认自动上传，可在“云存档”中关闭。","Guest play remains available. Community pages do not upload saves; game sign-in enables automatic uploads, which can be disabled in Cloud saves.","Puedes seguir jugando como invitado. La comunidad no sube partidas; el acceso en el juego activa subidas automáticas, que puedes desactivar en Partidas en la nube."],"loginNote":["登录后即可参与讨论。","Sign in to join the discussion.","Inicia sesión para participar."],"newPost":["发布帖子","New post","Nueva publicación"],"hero":["分享你的冒险心得","Share your adventures","Comparte tus aventuras"],"lead":["查攻略、聊装备、问打法，帮助下一位冒险者。","Share guides, discuss gear and help fellow adventurers.","Comparte guías, habla de equipo y ayuda a otros aventureros."],"all":["全部讨论","All discussions","Todas las conversaciones"],"latest":["最新讨论","Latest discussions","Conversaciones recientes"],"guideCategory":["攻略分享","Guides","Guías"],"helpCategory":["求助交流","Help","Ayuda"],"gearCategory":["装备分享","Equipment sharing","Compartir equipo"],"feedbackCategory":["问题与建议","Feedback","Comentarios y sugerencias"],"search":["搜索","Search","Buscar"],"searchPlaceholder":["搜索帖子…","Search discussions…","Buscar publicaciones…"],"searchResult":["搜索结果","Search results","Resultados de búsqueda"],"empty":["这里，等你的第一份冒险心得","Be the first to share an adventure","Comparte la primera aventura"],"noResults":["没有找到相关帖子","No matching discussions","No se encontraron publicaciones"],"category":["板块","Category","Categoría"],"title":["标题","Title","Título"],"body":["正文","Message","Mensaje"],"postHelp":["请说明职业、等级、地图与版本。不要发布私人信息。","Include your class, level, map and game version. Do not post private information.","Indica tu clase, nivel, mapa y versión. No publiques información privada."],"publish":["发布帖子","Publish post","Publicar"],"reply":["发布回复","Reply","Responder"],"replies":["讨论与回复","Replies","Respuestas"],"noReplies":["还没有回复，分享你的看法。","No replies yet. Share your thoughts.","Aún no hay respuestas. Comparte tu opinión."],"edit":["编辑我的帖子","Edit my post","Editar mi publicación"],"report":["举报","Report","Denunciar"],"deletePost":["删除我的帖子","Delete my post","Eliminar mi publicación"],"deleteComment":["删除我的评论","Delete my reply","Eliminar mi respuesta"],"reportReason":["举报原因","Reason for reporting","Motivo de la denuncia"],"sendReport":["提交举报","Submit report","Enviar denuncia"],"cancel":["取消","Cancel","Cancelar"],"moderation":["社区管理","Moderation","Moderación"],"moderationLead":["仅管理员可查看待处理举报。","Pending reports are visible to moderators only.","Solo los moderadores pueden ver las denuncias pendientes."],"noneReports":["暂无待处理举报。","No pending reports.","No hay denuncias pendientes."],"original":["查看原帖","View original post","Ver publicación original"],"hide":["隐藏内容","Hide content","Ocultar contenido"],"dismiss":["忽略举报","Dismiss report","Descartar denuncia"],"previous":["上一页","Previous","Anterior"],"next":["下一页","Next","Siguiente"],"page":["页","Page","Página"],"errorTitle":["暂时无法查看","Unable to load this page","No se puede cargar esta página"],"errorHelp":["请稍后重试，或先继续游戏。","Please try again later, or return to the game.","Inténtalo más tarde o vuelve al juego."],"javascript":["浏览无需 JavaScript；登录和发布内容需要启用 JavaScript。","Reading works without JavaScript. Enable it to sign in and post.","Puedes leer sin JavaScript. Actívalo para iniciar sesión y publicar."],"preview":["本地测试环境，内容不会发布到正式站。","Local test environment. Content is not published to the live site.","Entorno de prueba local. El contenido no se publica en el sitio."],"working":["正在处理…","Working…","Procesando…"],"network":["网络连接失败，输入内容已保留，请重试。","Connection failed. Your text is preserved. Please retry.","Falló la conexión. Tu texto se conserva. Inténtalo de nuevo."],"unavailable":["服务暂不可用，请稍后重试。","Service unavailable. Please try again later.","Servicio no disponible. Inténtalo más tarde."],"nicknameSaved":["昵称已更新","Display name updated","Nombre actualizado"],"reported":["举报已提交，等待管理员处理。","Report submitted for review.","Denuncia enviada para revisión."],"signedOut":["已退出登录","Signed out","Sesión cerrada"],"confirmDelete":["确定删除这条内容？删除后将不再公开展示。","Delete this content? It will no longer be publicly visible.","¿Eliminar este contenido? Dejará de ser visible públicamente."],"needConsent":["请先阅读并同意社区约定与隐私说明","Please read the privacy policy and accept the community rules.","Lee la política de privacidad y acepta las normas."],"googleFailed":["Google 登录暂不可用，请重试。","Google sign-in is unavailable. Please retry.","Google no está disponible. Inténtalo de nuevo."],"email":["邮箱地址","Email address","Correo electrónico"],"code":["验证码","Verification code","Código de verificación"],"sendCode":["获取验证码","Send code","Enviar código"],"verify":["登录 / 注册","Sign in / Register","Entrar / Registrarse"],"imageAdd":["添加攻略 / 装备截图","Add screenshots","Añadir capturas"],"imageHelp":["最多9张，每张不超过10 MB。点击图片可放大查看。","Up to 9 images, 10 MB each. Tap an image to enlarge it.","Hasta 9 imágenes, 10 MB cada una. Toca una imagen para ampliarla."],"image":["附图","Attachment","Imagen adjunta"],"fullImage":["查看大图","View full image","Ver imagen completa"],"close":["关闭","Close","Cerrar"],"zoom":["原始尺寸","Original size","Tamaño original"],"uploading":["上传中…","Uploading…","Subiendo…"],"remove":["移除","Remove","Quitar"],"imageFailed":["图片上传失败，请重试。","Image upload failed. Please retry.","Falló la subida. Inténtalo de nuevo."],"imageLimit":["每条内容最多 9 张图片。","Up to 9 images per post or reply.","Hasta 9 imágenes por publicación o respuesta."],"imageType":["只支持 JPG、PNG、WebP，每张不超过 10 MB。","Use JPG, PNG or WebP, up to 10 MB each.","Usa JPG, PNG o WebP, hasta 10 MB cada una."],"uploadWait":["请等待图片上传完成。","Wait for images to finish uploading.","Espera a que terminen de subir las imágenes."],"privacyIntro":["本政策适用于 backmir.org 的网站、邮箱与 Google 登录及玩家社区，更新日期为 2026-10-15。维护联系邮箱：u5196173364@gmail.com。","This policy covers backmir.org, email and Google sign-in, and the player community. Updated October 15, 2026. Contact: u5196173364@gmail.com.","Esta política cubre backmir.org, el acceso por correo y Google y la comunidad. Actualizada el 15 de octubre de 2026. Contacto: u5196173364@gmail.com."],"dataTitle":["我们收集什么","Data we collect","Datos que recopilamos"],"dataText":["游客角色和游戏进度保存在你的浏览器中。使用 Google 登录时，我们验证 Google 提供的唯一账号标识、邮箱及其已验证状态；仅保存标识和邮箱以识别本站账号；基础资料权限可能包含公开名称和头像，但本站不保存 Google 头像，也不读取 Gmail、通讯录或云盘。社区保存你选择公开的昵称、帖子、评论和附图，以及举报、管理记录和必要的登录会话。","Guest characters and progress stay in your browser. With Google sign-in we verify and store your unique Google account identifier and verified email to identify your site account. Basic profile access may include your public name and picture; we do not store your Google picture or access Gmail, contacts or Drive. We store your chosen display name, posts, replies and images, plus reports, moderation records and login sessions.","Los personajes y el progreso de invitado quedan en tu navegador. Al acceder con Google verificamos y guardamos el identificador único y el correo verificado para identificar tu cuenta. El perfil básico puede incluir nombre y foto públicos; no guardamos tu foto de Google ni accedemos a Gmail, contactos o Drive. Guardamos tu nombre visible, publicaciones, respuestas e imágenes, además de denuncias, registros de moderación y sesiones."],"useTitle":["用途与服务提供方","Purpose and service providers","Finalidad y proveedores"],"useText":["数据用于登录、展示你发布的内容、安全防护和处理举报，不出售账号数据，不将 Google 账号数据用于广告或 AI 训练。Google 提供身份认证；Cloudflare 提供网站托管、D1 数据库、私有 R2 图片存储和图片转换。服务可能在你所在国家以外处理数据。帖子、昵称及已发布附图向公众开放，邮箱和 Google 标识不公开展示。","We use data for sign-in, publishing your content, security and moderation. We do not sell account data or use Google account data for advertising or AI training. Google provides authentication; Cloudflare provides hosting, D1, private R2 image storage and image processing. Data may be processed outside your country. Posts, display names and published images are public; email addresses and Google identifiers are not displayed publicly.","Usamos los datos para iniciar sesión, publicar tu contenido, proteger el servicio y moderar. No vendemos datos de cuentas ni usamos datos de Google para publicidad o entrenamiento de IA. Google autentica; Cloudflare aloja el sitio, D1, las imágenes privadas en R2 y su procesamiento. Los datos pueden procesarse fuera de tu país. Las publicaciones, nombres visibles e imágenes publicadas son públicos; los correos e identificadores de Google no se muestran públicamente."],"retentionTitle":["存储、Cookie 与保留期限","Storage, cookies and retention","Almacenamiento, cookies y conservación"],"retentionText":["必要的 HttpOnly 登录 Cookie 最长 30 天，可随时退出全部设备。登录挑战最多保留 5 分钟；过期记录由定时任务清理。上传图片转换为大图和缩略图，移除 EXIF/XMP；不持久保存原始文件。未发布图片约 24 小时后清理，删除或隐藏内容的图片立即停止公开访问，并在约 7 天后清理。账号和帖子保留到删除请求被处理；删除按钮先移除公开展示，安全与管理记录可能为处理举报保留。备份按 Cloudflare 保留周期到期。","Essential HttpOnly session cookies last up to 30 days; you can sign out all devices. Google login challenges expire after 5 minutes; email codes expire after 10 minutes and scheduled cleanup removes expired records. Uploaded images become full-size and thumbnail WebP files with EXIF/XMP removed; originals are not stored. Unpublished images are cleaned up after about 24 hours. Images on deleted or hidden content immediately lose public access and are cleaned up after about 7 days. Accounts and posts remain until a deletion request is processed; the delete button first removes public visibility. Security and moderation records may be retained to resolve reports. Backups expire under Cloudflare retention schedules.","Las cookies HttpOnly de sesión duran hasta 30 días; puedes cerrar todas las sesiones. Los desafíos de Google caducan en 5 minutos; los códigos de correo, en 10 minutos y se limpian periódicamente. Las imágenes se convierten a WebP y miniaturas sin EXIF/XMP; no guardamos los originales. Las imágenes no publicadas se limpian tras unas 24 horas. Las de contenido eliminado u oculto dejan de ser públicas inmediatamente y se limpian tras unos 7 días. Las cuentas y publicaciones se conservan hasta tramitar una solicitud de eliminación; el botón de eliminar primero retira la visibilidad pública. Podemos conservar registros de seguridad y moderación para resolver denuncias. Las copias caducan según los plazos de Cloudflare."],"rightsTitle":["你的选择与联系","Your choices and contact","Tus opciones y contacto"],"rightsText":["你可以不登录继续游戏，也可编辑或删除自己的帖子、退出全部设备，并在 Google 账号设置中撤销授权。账号数据访问、更正或彻底删除请求请发送至维护邮箱；我们会验证账号归属后处理。请勿在公开帖子中填写邮箱、密码或验证码。删除浏览器数据可能永久丢失本机角色，请谨慎操作。本服务不面向 13 岁以下儿童。","You can play without signing in, edit or remove your posts, sign out all devices and revoke access in your Google account settings. Contact the email above to request access, correction or permanent deletion of account data; we verify ownership before processing. Do not post emails, passwords or codes publicly. Clearing browser data can permanently remove local characters. This service is not directed at children under 13.","Puedes jugar sin acceder, editar o eliminar tus publicaciones, cerrar todas las sesiones y revocar el acceso desde tu cuenta de Google. Escribe al correo indicado para solicitar acceso, corrección o eliminación definitiva de datos; verificaremos la titularidad. No publiques correos, contraseñas ni códigos. Borrar datos del navegador puede eliminar tus personajes locales. El servicio no está dirigido a menores de 13 años."],"analyticsTitle":["访问统计","Analytics","Estadísticas"],"analyticsText":["网站首页、攻略和游戏页使用 Google Analytics 统计访问及游玩行为，包括建角、进入游戏、升级、任务完成、地图切换、角色死亡和前台游玩时长，以及视频播放、装备图展开、加载耗时与失败、首次击杀、技能学习和换装；统计字段为职业、等级、地图及任务编号、界面语言和构建版本，不发送角色名、账号标识、邮箱、聊天或存档内容。帖子在本站数据库长期保存累计浏览次数，每次打开仅上报一次，不定时上报或记录阅读时长，不保存用于识别访客的浏览器标识，也不关联账号；单次打开的匿名重试记录保留7天后清理，累计浏览量继续保留。公开帖子页新增浏览次数、访问人数和前台阅读时长统计，使用 Cookie 与浏览器访问数据；仅发送帖子编号、分类与不含查询参数的页面地址，不发送标题、正文、昵称、账号标识或输入内容。同一帖子不同语言与回复页合并统计，从接入后开始记录，不补算历史。访问人数按浏览器识别，不代表精确真人数量。账号页新增登录转化统计；游戏中记录云备份提醒的展示、点击、关闭及首次云备份成功。登录记录仅包括开始、失败阶段、注册或登录成功、入口分类及界面语言，不采集邮箱、昵称、账号标识、凭据或输入内容。社区列表、发帖、管理及隐私政策页不加载统计脚本。Google 登录会按其隐私政策处理认证请求。","The home page, guides and game use Google Analytics for visits and gameplay: character creation, game entry, level-ups, completed quests, map changes, deaths and foreground play time. We also measure video plays, equipment image opens, loading time and errors, first kills, learned skills and equipment changes. Fields include class, level, map and quest IDs, interface language and build version. We do not send character names, account identifiers, emails, chat or save contents. The site retains cumulative post view counts. Each page load reports once, without periodic reports, reading-time records, visitor identifiers or account links. Anonymous per-view retry records expire after 7 days; view totals remain. Public post pages also measure views, visitors and foreground reading time using cookies and browser visit data. Only post IDs, categories and page URLs without query parameters are sent, never titles, bodies, display names, account IDs or typed content. Language and reply-page variants of a post are grouped together. Collection starts after setup, without historical backfill. Visitors are browser-based estimates, not exact counts of people. The account page measures sign-in conversion. The game records backup prompt views, clicks, dismissals and the first successful cloud backup. Sign-in events contain only the start, failure stage, registration or login success, entry category and interface language, never emails, names, account IDs, credentials or typed content. Community lists, posting forms, moderation and privacy pages do not load analytics scripts. Google handles authentication requests under its privacy policy.","La portada, las guías y el juego usan Google Analytics para medir visitas y actividad: creación de personajes, entrada al juego, subidas de nivel, misiones completadas, cambios de mapa, muertes y tiempo de juego en primer plano. También medimos reproducciones de vídeos, apertura de imágenes, carga y errores, primeras bajas, habilidades aprendidas y cambios de equipo. Los campos incluyen clase, nivel, identificadores de mapa y misión, idioma y versión. No enviamos nombres de personajes, identificadores de cuenta, correos, chat ni partidas guardadas. El sitio conserva el total de vistas de cada publicación. Cada apertura informa una vez, sin envíos periódicos, tiempos de lectura, identificadores de visitantes ni vínculos con cuentas. Los registros anónimos de reintentos se borran a los 7 días; el total se conserva. Las publicaciones públicas también miden vistas, visitantes y tiempo de lectura en primer plano mediante cookies y datos de navegación. Solo se envían identificadores de publicación, categorías y direcciones sin parámetros, nunca títulos, textos, nombres, identificadores de cuenta ni contenido introducido. Los idiomas y páginas de respuestas de una publicación se agrupan. La medición empieza al activarla, sin datos históricos. Los visitantes se estiman por navegador, no son un recuento exacto de personas. La página de cuenta mide la conversión del inicio de sesión. El juego registra la aparición, los clics y el cierre del aviso de copia de seguridad, y la primera copia guardada en la nube. Los eventos de acceso solo incluyen el inicio, la fase de error, el registro o acceso completado, la categoría de entrada y el idioma, nunca correos, nombres, identificadores de cuenta, credenciales ni contenido introducido. Las listas, formularios, moderación y privacidad no cargan estadísticas. Google procesa la autenticación según su política de privacidad."],"rulesText":["请友善交流，只发布与游戏有关且你有权分享的内容。不发布广告、骚扰、仇恨、违法内容或他人隐私。玩家内容不代表官方观点。你保留内容权利，并允许本站展示、压缩和保存你提交的内容。管理员可处理举报、隐藏违规内容或停用违规账号。服务更新或中断可能影响社区可用性，游戏本机存档请自行保管。","Be respectful and share game-related content you have the right to publish. No spam, harassment, hate, illegal material or private information about others. Player posts are not official statements. You retain your rights and allow this site to display, compress and store your submissions. Moderators may review reports, hide violations or suspend abusive accounts. Updates or outages may affect availability; look after your browser-local saves.","Sé respetuoso y comparte contenido del juego que tengas derecho a publicar. No se permite spam, acoso, odio, contenido ilegal ni información privada ajena. Las publicaciones no son opiniones oficiales. Conservas tus derechos y permites que el sitio muestre, comprima y almacene lo que envías. Los moderadores pueden revisar denuncias, ocultar infracciones o suspender cuentas abusivas. Las actualizaciones o interrupciones pueden afectar al servicio; cuida tus partidas locales."]}
;

export function communityLocale(path = "", hint = "") {
  return path.startsWith("/Game/en/")
    ? "en"
    : path.startsWith("/Game/es/")
      ? "es"
      : ["en", "es"].includes(hint)
        ? hint
        : "zh-CN";
}
const cloudPrivacy = [
  " 在游戏内登录后默认自动上传，可在云存档中关闭，也可手动上传。本站将全部角色进度、名称、等级和保存时间私密保存到你的账号，仅保留最新一份用于跨设备读取，上传后替换的旧云档不再保留；完整存档不公开展示。读取前在本机备份旧进度。可通过上述邮箱请求删除云档；退出账号不会删除存档。",
  " Automatic cloud uploads are enabled by default when signed in to the game, and can be disabled in Cloud saves. Manual uploads remain available. We privately store character progress, names, levels and save times under your account. Only the latest save is kept for cross-device loading. Replaced cloud saves are not retained; full saves are not public. Loading creates a local backup first. Contact the email above to request deletion. Signing out does not delete saves.",
  " Las subidas automáticas están activadas por defecto al iniciar sesión en el juego. Puedes desactivarlas en Partidas en la nube o subir manualmente. Guardamos de forma privada el progreso, nombres, niveles y fechas en tu cuenta. Solo conservamos la última partida para cargarla en otros dispositivos. Las reemplazadas no se conservan; las partidas completas no son públicas. Antes de cargar se crea una copia local. Puedes solicitar su eliminación al correo indicado. Cerrar sesión no elimina las partidas.",
];
rows.dataText = rows.dataText.map(
  (text, index) =>
    text + cloudPrivacy[index],
);
const attributionPrivacy = [
  " 为分析来源，我们在浏览器保留首次可识别来源最多90天，仅含来源站点域名或受限的utm_source渠道名；注册时关联到本站账号，并记录注册界面语言。登录游戏后记录最近游戏语言和服务端记录时间。不会保存完整来源网址、搜索词或原始IP到这些账号记录，也不把邮箱或账号标识发送给Google Analytics。历史未采集字段保持未知。账号来源及语言记录仅供站点管理使用，并随账号数据删除请求处理。",
  " To understand acquisition, we keep the first identifiable source in this browser for up to 90 days: only a referring hostname or a restricted utm_source label. On registration we associate it with your site account and record the registration interface language. While you play signed in, we record your latest game language and the server receipt time. These account records do not contain full referring URLs, search terms or raw IP addresses. We do not send emails or account identifiers to Google Analytics. Uncollected historical fields remain unknown. Source and language records are for site administration and are covered by account data deletion requests.",
  " Para analizar el origen, conservamos en este navegador la primera fuente identificable durante un máximo de 90 días: solo el dominio de referencia o una etiqueta utm_source limitada. Al registrarte la asociamos con tu cuenta y guardamos el idioma de la interfaz de registro. Al jugar con sesión iniciada guardamos el último idioma del juego y la hora de recepción del servidor. Estos registros no incluyen URL completas, términos de búsqueda ni direcciones IP originales. No enviamos correos ni identificadores de cuenta a Google Analytics. Los campos históricos no recopilados quedan como desconocidos. Los registros de origen e idioma son para la administración del sitio y están incluidos en las solicitudes de eliminación de datos de cuenta.",
];
rows.dataText = rows.dataText.map((text, index) => text + attributionPrivacy[index]);

const emailPrivacy = [
  " 邮箱登录和绑定使用一次性验证码，由 Cloudflare 向你提供的邮箱发送。验证码 10 分钟有效；只保存验证码摘要，不保存明文。绑定邮箱用于登录同一账号，不会创建新的角色存档。",
  " Email sign-in and linking use one-time codes delivered by Cloudflare to the address you provide. Codes expire after 10 minutes; we store only their digests, not plaintext codes. A linked email signs in to the same account and saves.",
  " El acceso y la vinculación por correo usan códigos de un solo uso enviados por Cloudflare a la dirección indicada. Caducan a los 10 minutos; solo guardamos su resumen criptográfico, no el código en texto. El correo vinculado permite acceder a la misma cuenta y partidas.",
];
rows.dataText = rows.dataText.map((text, index) => text + emailPrivacy[index]);
export const communityMessages = (locale) =>
  Object.fromEntries(
    Object.entries(rows).map(([k, v]) => [k, v[locale === "en" ? 1 : locale === "es" ? 2 : 0]]),
  );
export const communityText = (key, locale) => communityMessages(locale)[key] || key;
export const communityPath = (path, locale) =>
  path === "/Game/play/" ? "/Game/play/?lang=" + locale : locale === "zh-CN" ? path : "/" + locale + path;
const errors = {
  请使用已绑定邮箱登录: [
    "Sign in with your linked email address.",
    "Inicia sesión con tu correo vinculado.",
  ],
  邮箱格式不正确: ["Enter a valid email address.", "Introduce un correo electrónico válido."],
  验证码格式不正确: ["Enter the 8-digit code.", "Introduce el código de 8 dígitos."],
  请填写有效邮箱: ["Enter a valid email address.", "Introduce un correo electrónico válido."],
  "邮箱登录尚未开放，请稍后再试": [
    "Email sign-in is unavailable. Please try later.",
    "El acceso por correo no está disponible. Inténtalo más tarde.",
  ],
  "验证码暂时发送失败，请稍后重试": [
    "Could not send the code. Please try again later.",
    "No se pudo enviar el código. Inténtalo más tarde.",
  ],
  "请输入 8 位数字验证码": ["Enter the 8-digit code.", "Introduce el código de 8 dígitos."],
  "验证码不正确、已过期或尝试次数过多，请重新获取": [
    "Code incorrect, expired or tried too many times. Request a new one.",
    "El código es incorrecto, ha caducado o se ha intentado demasiadas veces. Solicita otro.",
  ],
  "验证码已使用，请重新获取": [
    "Code already used. Request a new one.",
    "El código ya se ha usado. Solicita otro.",
  ],
  "账号已切换，请刷新后重试": [
    "Account changed. Refresh and try again.",
    "La cuenta ha cambiado. Recarga e inténtalo de nuevo.",
  ],
  "账号或邮箱状态已变化，请重新验证": [
    "Account or email changed. Request a new code.",
    "La cuenta o el correo ha cambiado. Solicita un código nuevo.",
  ],
  请选择图片: ["Choose an image.", "Elige una imagen."],
  "单张图片不能超过 10 MB": [
    "Each image must be under 10 MB.",
    "Cada imagen debe tener menos de 10 MB.",
  ],
  图片体积超过限制: [
    "Image is too large. Crop it and try again.",
    "La imagen es demasiado grande. Recórtala e inténtalo de nuevo.",
  ],
  "只支持 JPG、PNG 和 WebP 图片": ["Use JPG, PNG or WebP images.", "Usa imágenes JPG, PNG o WebP."],
  "文件不是有效的 JPG、PNG 或 WebP 图片": [
    "Not a valid JPG, PNG or WebP image.",
    "No es una imagen JPG, PNG o WebP válida.",
  ],
  "未发布图片较多，请先发布现有内容或稍后再试": [
    "Too many unpublished images. Publish your current draft or try later.",
    "Hay demasiadas imágenes sin publicar. Publica el borrador o inténtalo más tarde.",
  ],
  "无法读取图片，请换一张图片": [
    "Cannot read this image. Try another file.",
    "No se puede leer la imagen. Prueba otro archivo.",
  ],
  "图片尺寸过大，请裁剪后上传（最多 4000 万像素）": [
    "Image exceeds 40 megapixels or 16384 pixels per side. Crop before uploading.",
    "La imagen supera 40 megapíxeles o 16384 píxeles por lado. Recórtala antes de subir.",
  ],
  "图片无法转换，请重新截图后上传": [
    "Image processing failed. Try a new screenshot.",
    "Falló el procesamiento. Prueba una nueva captura.",
  ],
  "图片压缩失败，请重试": [
    "Image compression failed. Please retry.",
    "Falló la compresión. Inténtalo de nuevo.",
  ],
  "图片保存失败，请重试": [
    "Image storage failed. Please retry.",
    "No se pudo guardar la imagen. Reinténtalo.",
  ],
  图片不存在: ["Image not found.", "Imagen no encontrada."],
  "图片内容过于复杂，请裁剪后上传": [
    "Image is too complex. Crop before uploading.",
    "La imagen es demasiado compleja. Recórtala antes de subir.",
  ],
  请先登录: ["Sign in first.", "Inicia sesión primero."],
  需要管理员权限: ["Moderator access required.", "Se requieren permisos de moderación."],
  请从本站页面操作: ["Please use the form on this website.", "Usa el formulario de este sitio."],
  "操作太频繁，请稍后再试": [
    "Too many attempts. Please try again later.",
    "Demasiados intentos. Inténtalo más tarde.",
  ],
  该账号暂不能参与社区: ["This account is suspended.", "Esta cuenta está suspendida."],
  "登录已过期，请刷新后重试": [
    "Sign-in expired. Refresh and retry.",
    "El acceso caducó. Recarga e inténtalo de nuevo.",
  ],
  "Google 身份验证失败，请重新登录": [
    "Google verification failed. Sign in again.",
    "La verificación de Google falló. Vuelve a iniciar sesión.",
  ],
  "该邮箱已有账号，请联系支持人员安全绑定": [
    "An account already uses this email. Contact support to link accounts securely.",
    "Ya existe una cuenta con este correo. Contacta con soporte para vincularla de forma segura.",
  ],
  帖子不存在或已被移除: ["Post not found or removed.", "La publicación no existe o fue eliminada."],
  内容不存在或不属于你: [
    "Content not found or not owned by you.",
    "El contenido no existe o no te pertenece.",
  ],
  内容不存在: ["Content not found.", "Contenido no encontrado."],
  "昵称不能包含 @ 或尖括号": [
    "Display names cannot contain @, < or >.",
    "El nombre no puede contener @, < o >.",
  ],
  请先阅读并同意社区约定与隐私说明: [
    "Read the privacy policy and accept the community rules.",
    "Lee la política de privacidad y acepta las normas.",
  ],
  请选择板块: ["Choose a category.", "Elige una categoría."],
  请选择讨论区: ["Choose a discussion board.", "Elige un foro."],
  "每条内容最多 9 张图片，请勿重复添加": [
    "Up to 9 different images per post or reply.",
    "Hasta 9 imágenes distintas por publicación o respuesta.",
  ],
  "图片已过期、已被使用或不属于你，请重新上传": [
    "Image expired, already used or not owned by you. Upload it again.",
    "Imagen caducada, ya utilizada o ajena. Súbela de nuevo.",
  ],
  "图片上传暂未开放，请稍后再试": [
    "Image uploads are unavailable. Try later.",
    "Las subidas no están disponibles. Inténtalo más tarde.",
  ],
};
export function translateError(message, locale) {
  if (locale === "zh-CN") return message;
  const n = locale === "es" ? 1 : 0;
  if (errors[message]) return errors[message][n];
  const m = message.match(/^(标题|正文|评论|昵称|举报原因|邮箱|验证码)需为 (\d+)–(\d+) 个字符$/);
  if (m)
    return `${{ 标题: communityText("title", locale), 正文: communityText("body", locale), 评论: communityText("reply", locale), 昵称: communityText("nickname", locale), 举报原因: communityText("reportReason", locale), 邮箱: communityText("email", locale), 验证码: communityText("code", locale) }[m[1]]}: ${m[2]}–${m[3]} ${n ? "caracteres" : "characters"}.`;
  return communityText("unavailable", locale);
}

