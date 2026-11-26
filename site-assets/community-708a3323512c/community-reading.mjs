// One request per visible page load. No heartbeat, duration timer, browser ID,
// account association or close-page report. A failed request retries only online.
export function installPostViews(win = window, doc = document) {
  const el = doc.querySelector("[data-post-reading]");
  if (
    !el ||
    !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(el.dataset.postReading || "") ||
    win.backmirPostViews
  )
    return false;
  if (
    ![
      "",
      "http://127.0.0.1:" + win.location.port,
      "http://localhost:" + win.location.port,
    ].includes(win.location.origin)
  )
    return false;
  try {
    if (
      new URL(win.location.href).searchParams.get("analytics") === "off" ||
      win.sessionStorage.getItem("backmir.analyticsExcluded") === "1"
    )
      return false;
  } catch {}
  const body = JSON.stringify({
    postId: el.dataset.postReading,
    viewId: win.crypto.randomUUID(),
    startedAt: Math.floor(Date.now() / 1000),
  });
  let done = false,
    pending = false;
  const send = async () => {
    if (done || pending || doc.visibilityState !== "visible") return;
    pending = true;
    try {
      const r = await win.fetch("/Game/api/community/view", {
        method: "POST",
        credentials: "omit",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
        signal: AbortSignal.timeout(10000),
      });
      if (r.ok) {
        const { metrics } = await r.json();
        el.querySelector("[data-reading-views]").textContent = new Intl.NumberFormat(
          doc.documentElement.lang,
        ).format(metrics.views);
        done = true;
        doc.removeEventListener("visibilitychange", send);
        win.removeEventListener("online", send);
      }
    } catch {
    } finally {
      pending = false;
    }
  };
  win.backmirPostViews = true;
  doc.addEventListener("visibilitychange", send);
  win.addEventListener("online", send);
  send();
  return true;
}
if (typeof window !== "undefined") installPostViews();

