import { i18n as e } from "../i18n.js";
await e.ready;
for (const t of document.querySelectorAll("[data-site-path]")) t.href = e.path(t.dataset.sitePath);
let c = !1,
  d = 0,
  o = 3e4;
const l = () => document.querySelector("[data-network-status]"),
  i = (t) => {
    const n = l();
    n && (n.removeAttribute("data-i18n"), (n.textContent = t));
  };
async function a() {
  if (!(c || document.hidden || Date.now() - d < o)) {
    if (!navigator.onLine) {
      i(e.t("site.game.offline"));
      return;
    }
    if (location.hostname !== "backmir.org") {
      i(e.t("site.game.preview"));
      return;
    }
    ((c = !0), (d = Date.now()));
    try {
      const t = crypto.randomUUID(),
        n = document.querySelector('meta[name="dream-build"]')?.content,
        r = await fetch("/Game/api/session", {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
          headers: { "Content-Type": "application/json", "X-Backmir-Client": "1" },
          body: JSON.stringify({ build: n, nonce: t }),
          signal: AbortSignal.timeout(6e3),
        }),
        s = await r.json();
      if (r.status === 409) {
        (i(e.t("site.game.newVersion")), (o = 6e5));
        return;
      }
      if (!r.ok || s.nonce !== t || s.build !== n || s.saveTrust !== "local-unverified")
        throw Error("Session check incomplete");
      (i(e.t("site.game.connected")), (o = 6e5));
    } catch {
      (i(e.t("site.game.unconnected")), (o = Math.min(6e5, o * 2)));
    } finally {
      c = !1;
    }
  }
}
(window.addEventListener("online", () => {
  ((d = 0), a());
}),
  window.addEventListener("offline", () => i(e.t("site.game.offline"))),
  document.addEventListener("visibilitychange", () => {
    document.hidden || a();
  }),
  setInterval(a, 3e4),
  a());

