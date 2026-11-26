import { leaderboardMessages } from "./leaderboard-i18n.mjs";
import { communityPath, communityMessages } from "./community-i18n.mjs";
const selectedGame = (data) =>
  ["darkforged", "classic-hell"].includes(data.game) ? data.game : "classic";
const playPath = (data, locale) =>
  selectedGame(data) !== "classic"
    ? "/Game/play/" + selectedGame(data) + "/?lang=" + encodeURIComponent(locale)
    : communityPath("/Game/play/", locale);
const boardPath = (data, locale, board = data.board || "all") =>
  communityPath("/Game/leaderboard/", locale) +
  "?" +
  new URLSearchParams({ game: selectedGame(data), board });
const e = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
export function leaderboardRows(data, locale) {
  const m = leaderboardMessages(locale, selectedGame(data)),
    num = (n) => new Intl.NumberFormat(locale).format(n),
    date = (n) => new Date(n).toLocaleString(locale, { timeZone: "UTC" }) + " UTC";
  if (!data.rows?.length) return `<tr><td colspan="6" class="lb-empty">${e(m.empty)}</td></tr>`;
  return data.rows
    .map(
      (r) =>
        `<tr ${r.id === data.mine?.id ? 'class="lb-self"' : ""}><td><span class="lb-rank ${r.rank <= 3 ? "lb-medal" : ""}">${r.rank}</span></td><td><strong>${e(r.name)}</strong>${r.id === data.mine?.id ? ` <small>${e(m.you)}</small>` : ""}${data.signedIn && r.id !== data.mine?.id ? `<button class="lb-report" data-report-entry="${e(r.id)}" aria-label="${e(m.report + ": " + r.name)}">${e(m.report)}</button>` : ""}</td><td>${e(m[r.job])}</td><td><strong>${r.level}</strong></td><td>${r.nextXP ? `<span>${num(r.xp)} / ${num(r.nextXP)}</span><progress max="${r.nextXP}" value="${r.xp}"></progress>` : e(m.max)}</td><td><time datetime="${new Date(r.submittedAt).toISOString()}">${e(date(r.submittedAt))}</time></td></tr>`,
    )
    .join("");
}
export function leaderboardPersonal(data, locale) {
  const m = leaderboardMessages(locale, selectedGame(data)),
    p = (path) => communityPath(path, locale),
    num = (n) => new Intl.NumberFormat(locale).format(n),
    dark = selectedGame(data) === "darkforged";
  if (data.available === false)
    return `<p>${e(m.disabled)}</p><a class="button" href="${playPath(data, locale)}">${e(communityMessages(locale).play)}</a>`;
  if (!data.signedIn)
    return `<p>${e(dark ? m.darkNotJoined : m.notJoined)}</p><a class="button" href="${p("/Game/account/")}?next=${encodeURIComponent(boardPath(data, locale))}">${e(m.signin)}</a>`;
  const participation = data.participation;
  if (!participation?.enabled && !data.hasCloudSave)
    return `<p>${e(dark ? m.darkNoCloudSave : m.noCloudSave)}</p><a class="button" href="${playPath(data, locale)}">${e(m.cloudOpen)}</a>`;
  if (!participation?.enabled)
    return `<p>${e(dark ? m.darkNotJoined : m.notJoined)}</p><form id="lb-join"><label class="consent"><input type="checkbox" name="consent" required> ${e(m.consent)}</label><button class="button">${e(dark ? m.darkJoin : m.join)}</button></form>`;
  const r = data.mine;
  let text = m[participation.state] || m.noClass;
  if (participation.reason === "invalidProgress" && participation.state === "review")
    text = m.invalidProgress;
  if (participation.state === "ready")
    text = r ? `#${r.rank} · ${r.name} · ${m[r.job]} · ${m.level} ${r.level}` : m.noClass;
  const gap = r
    ? data.ahead
      ? data.ahead.level > r.level
        ? m.gapLevel.replace("{n}", num(data.ahead.level - r.level))
        : m.gapXP.replace("{n}", num(data.ahead.xp - r.xp))
      : m.first
    : "";
  return `<p class="lb-my-score">${e(text)}</p>${gap ? `<p>${e(gap)}</p>` : ""}${participation.state !== "waiting" ? `<p class="small">${e(dark ? m.darkJoined : m.joined)}</p>` : ""}<button id="lb-leave">${e(m.leave)}</button>`;
}
export function leaderboardContent(data = {}, locale = "zh-CN") {
  const m = leaderboardMessages(locale, selectedGame(data)),
    c = communityMessages(locale),
    p = (path) => communityPath(path, locale),
    game = selectedGame(data);
  const gameTabs = `<nav class="lb-game-tabs lb-tabs" aria-label="${e(m.games)}">${["classic", "classic-hell", "darkforged"].map((id) => `<a href="${p("/Game/leaderboard/")}?game=${id}" data-board-game="${id}" ${id === game ? 'aria-current="page"' : ""}>${e(id === "classic-hell" ? (locale === "zh-CN" ? "梦回地狱" : "BackMir Hell") : m[id])}</a>`).join("")}</nav>`;
  return `<section class="community-hero"><div><p class="lb-eyebrow">BACKMIR · ${e(m.title)}</p><h1>${e(m.title)}</h1><p>${e(m.lead)}</p></div><a class="button" href="${playPath(data, locale)}">${e(c.play)}</a></section>${gameTabs}<p class="note" data-board-disclosure>${e(data.available === false ? m.disabled : game === "darkforged" ? m.darkDisclosure : m.disclosure)}</p><nav class="lb-tabs" aria-label="${e(m.title)}">${["all", "Warrior", "Wizard", "Taoist"].map((board) => `<a href="${boardPath(data, locale, board)}" data-board="${board}" ${board === (data.board || "all") ? 'aria-current="page"' : ""}>${e(m[board])}</a>`).join("")}</nav><section class="community-panel"><div class="lb-heading"><h2>${e(m.top)}</h2><span id="lb-total">${e(m.participants)} · ${data.total || 0}</span><button id="lb-refresh">${e(m.refresh)}</button></div><p id="lb-status" role="status" aria-live="polite"></p><div class="lb-scroll"><table class="lb-table"><caption class="sr-only">${e(m.title)}</caption><thead><tr>${["rank", "name", "job", "level", "xp", "time"].map((k) => `<th scope="col">${e(m[k])}</th>`).join("")}</tr></thead><tbody id="lb-rows">${leaderboardRows(data, locale)}</tbody></table></div><p class="small">${e(m.rules)}</p></section><section class="community-panel lb-personal"><h2>${e(m.mine)}</h2><div id="lb-personal">${leaderboardPersonal(data, locale)}</div></section><details id="lb-admin" hidden class="community-panel"><summary>${e(m.moderation)}</summary><div id="lb-admin-list"></div></details><dialog id="lb-report-dialog"><form id="lb-report-form"><h2>${e(m.reportTitle)}</h2><label>${e(m.reportHelp)}<textarea name="reason" minlength="4" maxlength="500" required></textarea></label><button>${e(m.send)}</button><button type="button" id="lb-report-cancel">${e(m.cancel)}</button><p id="lb-report-status" role="status"></p></form></dialog>`;
}

