import { leaderboardMessages } from "./leaderboard-i18n.mjs";
import { leaderboardRows, leaderboardPersonal } from "./leaderboard-view.mjs";
import { accountSession } from "./account-session.mjs";
const locale = document.documentElement.lang,
  m = leaderboardMessages(locale, new URLSearchParams(location.search).get("game")),
  $ = (s) => document.querySelector(s),
  game = ["darkforged", "classic-hell"].includes(new URLSearchParams(location.search).get("game"))
    ? new URLSearchParams(location.search).get("game")
    : "classic";
let board = new URLSearchParams(location.search).get("board") || "all",
  serial = 0,
  busy = false,
  target = null;
const status = (text) => ($("#lb-status").textContent = text);
async function api(path, data) {
  const url = new URL(path, location.origin);
  url.searchParams.set("game", game);
  const response = await fetch(url.pathname + url.search, {
    method: data ? "POST" : "GET",
    credentials: "same-origin",
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
    headers: {
      "X-Backmir-Language": locale,
      ...(data ? { "Content-Type": "application/json", "X-Backmir-Community": "1" } : {}),
    },
    body: data ? JSON.stringify({ ...data, accountId: accountSession.state.user?.id }) : undefined,
  });
  const result = await response.json();
  if (!response.ok)
    throw Error(
      m[result.errorCode] ||
        (response.status === 401
          ? m.auth
          : response.status === 409
            ? m.accountChanged
            : result.error) ||
        m.unavailable,
    );
  return result;
}
async function refresh() {
  const n = ++serial;
  status(m.loading);
  try {
    const data = await api("/Game/api/leaderboard?board=" + encodeURIComponent(board));
    if (n !== serial) return;
    board = data.board;
    document.querySelectorAll("[data-board]").forEach((el) => {
      if (el.dataset.board === board) el.setAttribute("aria-current", "page");
      else el.removeAttribute("aria-current");
    });
    document.querySelectorAll('.site-languages a,nav[aria-label="Language"] a').forEach((link) => {
      const url = new URL(link.href);
      url.searchParams.set("game", game);
      url.searchParams.set("board", board);
      link.href = url.href;
    });
    $("#lb-rows").innerHTML = leaderboardRows(data, locale);
    $("#lb-personal").innerHTML = leaderboardPersonal(data, locale);
    $("#lb-total").textContent =
      m.participants + " · " + new Intl.NumberFormat(locale).format(data.total);
    $("#lb-admin").hidden = !data.moderator;
    status("");
    $("#lb-join")?.addEventListener("submit", (event) => {
      event.preventDefault();
      mutate(
        "/Game/api/leaderboard/participation",
        { enabled: true, consentVersion: 2 },
        game === "darkforged" ? m.darkJoined : m.joined,
      );
    });
    $("#lb-leave")?.addEventListener("click", () =>
      mutate("/Game/api/leaderboard/participation", { enabled: false }, m.left),
    );
    if (data.moderator && $("#lb-admin").open) await loadAdmin();
  } catch (error) {
    if (n === serial) status(m.unavailable);
  }
}
async function mutate(path, data, message) {
  if (busy) return;
  busy = true;
  document.querySelectorAll("button").forEach((el) => (el.disabled = true));
  try {
    await api(path, data);
    await refresh();
    status(message);
  } catch (error) {
    status(error.message || m.unavailable);
  } finally {
    busy = false;
    document.querySelectorAll("button").forEach((el) => (el.disabled = false));
  }
}
async function loadAdmin() {
  const host = $("#lb-admin-list");
  try {
    const data = await api("/Game/api/leaderboard/moderation");
    host.replaceChildren();
    if (!data.rows.length) host.textContent = m.nothing;
    for (const r of data.rows) {
      const item = document.createElement("article"),
        title = document.createElement("p");
      title.textContent = `${r.name || r.id} · ${m[r.job] || ""} ${r.level || ""} · ${m[r.reason] || m[r.state] || r.state}`;
      item.append(title);
      for (const report of JSON.parse(r.reports || "[]")) {
        const p = document.createElement("p");
        p.textContent = report;
        item.append(p);
      }
      for (const action of ["hide", "release", "dismiss"]) {
        if (action === "release" && r.reason === "invalidProgress") continue;
        const b = document.createElement("button");
        b.textContent = m[action];
        b.onclick = () => mutate("/Game/api/leaderboard/moderate", { target: r.id, action }, m.done);
        item.append(b);
      }
      host.append(item);
    }
  } catch {
    host.textContent = m.unavailable;
  }
}
$("#lb-admin").addEventListener("toggle", () => {
  if ($("#lb-admin").open) loadAdmin();
});
$("#lb-refresh").onclick = () => refresh();
document.querySelectorAll("[data-board]").forEach(
  (el) =>
    (el.onclick = (event) => {
      event.preventDefault();
      board = el.dataset.board;
      const query = new URLSearchParams(location.search);
      query.set("board", board);
      query.set("game", game);
      history.replaceState(null, "", "?" + query);
      refresh();
    }),
);
$("#lb-rows").addEventListener("click", (event) => {
  const b = event.target.closest("[data-report-entry]");
  if (!b) return;
  target = b.dataset.reportEntry;
  $("#lb-report-form").reset();
  $("#lb-report-status").textContent = "";
  $("#lb-report-dialog").showModal();
});
$("#lb-report-cancel").onclick = () => $("#lb-report-dialog").close();
$("#lb-report-form").onsubmit = async (event) => {
  event.preventDefault();
  const b = event.submitter;
  b.disabled = true;
  try {
    await api("/Game/api/leaderboard/report", {
      target,
      reason: new FormData(event.target).get("reason"),
    });
    $("#lb-report-dialog").close();
    status(m.sent);
  } catch (error) {
    $("#lb-report-status").textContent = error.message || m.unavailable;
  } finally {
    b.disabled = false;
  }
};
let identity = "";
accountSession.subscribe((session) => {
  const key = session.status + ":" + (session.user?.id || "");
  if (key === identity) return;
  identity = key;
  if (session.status === "member" || session.status === "guest") refresh();
});

