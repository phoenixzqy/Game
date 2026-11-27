import { bindAccountLogin, mountEmailBinding } from "./account-login.mjs";
import { installAccountAnalytics, browserAccountFunnel, funnelSource } from "./account-funnel.mjs";
import "./community-reading.mjs";
import { floorCard } from "./community-thread-view.mjs";
import { publishAccountChange } from "./account-session.mjs";
import { communityMessages, communityPath } from "./community-i18n.mjs";
import { localizedAccountReturn } from "./account-return.mjs";
import "./community-images.js";
const locale = document.documentElement.lang,
  m = communityMessages(locale),
  p = (path) => communityPath(path, locale),
  $ = (s) => document.querySelector(s),
  $$ = (s) => document.querySelectorAll(s);
installAccountAnalytics();
const authTrack = browserAccountFunnel(),
  authSource = funnelSource(new URLSearchParams(location.search).get("source"));
if (/\/(?:account)\/$/.test(location.pathname))
  authTrack("account_view", { source: authSource }, true);
let user = null,
  reportTarget = null,
  replyParent = null,
  emailBinding = null,
  bindingKey = "";
let toastTimer;
const show = (message, target = "#community-status") => {
  const el = $(target);
  if (el) el.textContent = message;
  if (message && target === "#community-status") {
    let toast = $("#community-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "community-toast";
      toast.setAttribute("role", "status");
      document.body.append(toast);
    }
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toast.hidden = true), 6000);
  }
};
async function api(path, data) {
  let response;
  try {
    response = await fetch(path, {
      method: data ? "POST" : "GET",
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        "X-Backmir-Language": locale,
        ...(data ? { "Content-Type": "application/json", "X-Backmir-Community": "1" } : {}),
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  } catch {
    throw Error(m.network);
  }
  let result;
  try {
    result = await response.json();
  } catch {
    throw Error(m.unavailable);
  }
  if (!response.ok) throw Error(result.error || m.unavailable);
  return result;
}
function nextPath() {
  const next = new URLSearchParams(location.search).get("next");
  if (
    next &&
    /(?<=^\/Game)\/(?:en\/|es\/)?(?:community\/|play\/)/.test(next) &&
    !/[\\\r\n]/.test(next)
  )
    return next;
  return p("/Game/community/");
}
// UI follows session permissions; the server independently enforces publish/edit/move access.
function syncCommunityControls(account) {
  const moderator = account?.role === "moderator" && !account.banned;
  $$("[data-moderator-only]").forEach((el) => (el.hidden = !moderator));
  $$("[data-post-editor]").forEach((el) => {
    const allowed =
      el.dataset.canEdit === "true" &&
      (el.dataset.postBoard === "official" ? moderator : el.dataset.postOwner === account?.id);
    el.hidden = !allowed;
  });
  $$("[data-community-board-select]").forEach((select) => {
    const editor = select.closest("[data-post-editor]"),
      editing = select.hasAttribute("data-edit-board"),
      canMove =
        !!account &&
        editor?.dataset.canMove === "true" &&
        (editor.dataset.postBoard === "official"
          ? moderator
          : editor.dataset.postOwner === account.id);
    select.querySelectorAll("[data-official-option]").forEach((option) => {
      option.hidden = !moderator;
      option.disabled = !moderator;
    });
    if (!editing && select.value === "official" && !moderator) select.value = "public";
    select.disabled = editing && !canMove;
    const label = select.closest("[data-board-field]"),
      form = select.closest("form"),
      fixed = form.querySelector("[data-board-fixed]");
    if (label) label.hidden = select.disabled;
    if (fixed) fixed.hidden = !select.disabled;
    const category = form.querySelector("[data-post-category]");
    if (category)
      category.hidden = !["classic", "classic-hell", "darkforged"].includes(select.value);
  });
}
const sectionPicker = $("[data-community-section-picker]");
if (sectionPicker) {
  const narrow = window.matchMedia("(max-width:600px)"),
    syncPicker = () => {
      sectionPicker.open = !narrow.matches;
    };
  syncPicker();
  narrow.addEventListener("change", syncPicker);
}
document.addEventListener("change", (event) => {
  if (event.target.matches("[data-community-board-select]")) syncCommunityControls(user);
});
function updateUser(account) {
  user = account;
  syncCommunityControls(user);
  $$("[data-account-link]").forEach((el) => {
    el.textContent = user ? user.nickname : m.account;
  });
  $$("[data-auth-guest]").forEach((el) => (el.hidden = !!user));
  $$("[data-auth-member]").forEach((el) => (el.hidden = !user));
  $$("[data-requires-login]").forEach((el) => (el.disabled = !user));
  $$("[data-login-note]").forEach((el) => (el.hidden = !!user));
  $$("[data-owner]").forEach((el) => (el.hidden = el.dataset.owner !== user?.id));
  if (user) {
    $$("[data-account-name]").forEach((el) => (el.textContent = user.nickname));
    $$("[data-account-email]").forEach((el) => {
      el.hidden = !!user.emailLoginAddress;
      el.textContent = user.emailLoginAddress ? "" : user.email;
    });
    if ($("#nickname")) $("#nickname").value = user.nickname;
  }
  const host = $("[data-email-binding]"),
    key = user ? user.id + ":" + (user.emailLoginAddress || "") : "";
  if (host && bindingKey !== key) {
    emailBinding?.dispose();
    emailBinding = null;
    host.replaceChildren();
    bindingKey = key;
    if (user)
      emailBinding = mountEmailBinding(host, {
        user,
        locale,
        onSuccess: (account) => updateUser(account),
      });
  }
}
function form(selector, handler) {
  const el = $(selector);
  if (!el) return;
  el.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = el.querySelector('button[type="submit"],button:not([type])');
    if (button?.disabled) return;
    if (button) button.disabled = true;
    show(m.working);
    try {
      await handler(new FormData(el));
    } catch (error) {
      show(error.message, selector === "#report-form" ? "#report-status" : "#community-status");
    } finally {
      if (button) button.disabled = false;
    }
  });
}
const login = $("[data-account-login]");
if (login)
  bindAccountLogin(login, {
    locale,
    source: authSource,
    track: authTrack,
    onSuccess: (account) => {
      updateUser(account);
      location.assign(nextPath());
    },
  });
const returnGame = $("[data-return-game]");
if (returnGame && /(?<=^\/Game)\/play\//.test(nextPath())) returnGame.href = nextPath();
// Keep the return destination when the player switches language on this page.
if (login)
  for (const link of $$('nav[aria-label="Language"] a,.site-languages a')) {
    const url = new URL(link.href);
    url.searchParams.set("next", localizedAccountReturn(nextPath(), link.lang));
    url.searchParams.set("source", authSource);
    link.href = url.href;
  }
form("#profile-form", async (form) => {
  await api("/Game/api/account/profile", { nickname: form.get("nickname") });
  updateUser((await api("/Game/api/account/me")).user);
  show(m.nicknameSaved);
});
form("#post-form", async (form) => {
  const result = await api("/Game/api/community/posts", {
    ...Object.fromEntries(form),
    images: window.communityImages.ids($("#post-form")),
  });
  location.assign(p("/Game/community/posts/" + result.id + "/"));
});
form("#edit-post-form", async (form) => {
  await api("/Game/api/community/edit", {
    id: $("#edit-post-form").dataset.postId,
    ...Object.fromEntries(form),
    images: window.communityImages.ids($("#edit-post-form")),
  });
  location.reload();
});
form("#comment-form", async (form) => {
  const result = await api("/Game/api/community/comments", {
    postId: $("#comment-form").dataset.postId,
    body: form.get("body"),
    parentId: replyParent,
    images: window.communityImages.ids($("#comment-form")),
  });
  location.assign(
    location.pathname +
      "?focus=" +
      encodeURIComponent(result.id) +
      "#reply-" +
      encodeURIComponent(result.id),
  );
});
form("#report-form", async (form) => {
  await api("/Game/api/community/report", { ...reportTarget, reason: form.get("reason") });
  $("#report-dialog").close();
  show(m.reported);
});
$("#cancel-report")?.addEventListener("click", () => $("#report-dialog").close());
document.addEventListener("click", async (event) => {
  const bookmark = event.target.closest("[data-bookmarks]");
  if (bookmark && !user) {
    event.preventDefault();
    location.assign(p("/Game/account/") + "?next=" + encodeURIComponent(bookmark.getAttribute("href")));
    return;
  }
  const b = event.target.closest("button");
  if (!b || b.closest("[data-email-form],[data-account-login]")) return;
  try {
    if (b.hasAttribute("data-reply-to")) {
      if (!user) {
        location.assign(
          p("/Game/account/") +
            "?next=" +
            encodeURIComponent(location.pathname + location.search + location.hash),
        );
        return;
      }
      replyParent = b.dataset.replyTo || null;
      const context = $("#reply-context");
      context.hidden = !replyParent;
      context.querySelector("span").textContent = replyParent
        ? m.replyTo + " @" + b.dataset.replyName
        : "";
      $("#thread-composer").scrollIntoView({ block: "center" });
      $("#reply-body").focus();
    }
    if (b.hasAttribute("data-cancel-reply")) {
      replyParent = null;
      $("#reply-context").hidden = true;
      $("#reply-body").focus();
    }
    if (b.dataset.reaction) {
      if (!user) {
        location.assign(
          p("/Game/account/") +
            "?next=" +
            encodeURIComponent(location.pathname + location.search + location.hash),
        );
        return;
      }
      if (b.disabled) return;
      b.disabled = true;
      const enabled = b.getAttribute("aria-pressed") !== "true";
      const result = await api("/Game/api/community/reaction", {
        id: b.dataset.id,
        type: b.dataset.type,
        kind: b.dataset.reaction,
        enabled,
      });
      b.setAttribute(
        "aria-pressed",
        String(b.dataset.reaction === "bookmark" ? result.bookmarked : result.liked),
      );
      if (b.dataset.reaction === "bookmark")
        b.textContent = result.bookmarked ? m.bookmarked : m.bookmark;
      else b.querySelector("span").textContent = result.likes;
    }

    if (b.dataset.moreReplies) {
      if (b.disabled) return;
      b.disabled = true;
      const root = b.dataset.moreReplies;
      const result = await api(
        "/Game/api/community/replies?" +
          new URLSearchParams({ post: b.dataset.post, root, page: b.dataset.page }),
      );
      const host = document.querySelector('[data-children="' + root + '"]');
      const markup = result.items
        .map((item) =>
          floorCard(
            item,
            {
              post: { id: b.dataset.post, user_id: b.dataset.op },
              m,
              locale,
              basePath: b.dataset.base,
            },
            true,
          ),
        )
        .join("");
      const previous = b.dataset.direction === "previous";
      host.insertAdjacentHTML(previous ? "afterbegin" : "beforeend", markup);
      b.dataset.page = String(result.page + (previous ? -1 : 1));
      b.hidden = previous ? !result.hasPrevious : !result.hasNext;
      updateUser(user);
    }
    if (b.matches("[data-logout],[data-logout-all]")) {
      b.disabled = true;
      await api(
        b.hasAttribute("data-logout-all") ? "/Game/api/account/logout-all" : "/Game/api/account/logout",
        {},
      );
      publishAccountChange(null);
      updateUser(null);
      show(m.signedOut);
    }
    if (b.dataset.delete) {
      if (!confirm(m.confirmDelete)) return;
      b.disabled = true;
      await api("/Game/api/community/delete", { type: b.dataset.delete, id: b.dataset.id });
      if (b.dataset.delete === "post") location.assign(p("/Game/community/"));
      else location.reload();
    }
    if (b.dataset.report) {
      if (!user) {
        location.assign(p("/Game/account/") + "?next=" + encodeURIComponent(location.pathname));
        return;
      }
      reportTarget = { type: b.dataset.report, id: b.dataset.id };
      $("#report-form").reset();
      show("", "#report-status");
      $("#report-dialog").showModal();
    }
    if (b.dataset.moderate) {
      b.disabled = true;
      await api("/Game/api/community/moderate", {
        type: b.dataset.type,
        id: b.dataset.id,
        action: b.dataset.moderate,
      });
      await moderation();
    }
  } catch (error) {
    show(error.message);
  } finally {
    if (!b.matches("#google-start")) b.disabled = false;
  }
});


async function moderation() {
  const host = $("#moderation-list");
  if (!host) return;
  const { reports } = await api("/Game/api/community/reports");
  host.replaceChildren();
  if (!reports.length) {
    host.textContent = m.noneReports;
    return;
  }
  for (const report of reports) {
    const card = document.createElement("article");
    card.className = "community-panel";
    for (const value of [report.reason, report.content]) {
      const el = document.createElement("p");
      el.textContent = value;
      card.append(el);
    }
    const link = document.createElement("a");
    link.href = p("/Game/community/posts/" + report.post_id + "/");
    link.textContent = m.original;
    card.append(link);
    for (const action of ["hide", "dismiss"]) {
      const b = document.createElement("button");
      b.textContent = m[action];
      Object.assign(b.dataset, {
        moderate: action,
        type: report.target_type,
        id: report.target_id,
      });
      card.append(b);
    }
    host.append(card);
  }
}
if (!/\/(privacy|terms)\/$/.test(location.pathname))
  api("/Game/api/account/me")
    .then(async (result) => {
      updateUser(result.user);
      if (user?.role === "moderator") {
        const link = document.createElement("a");
        link.href = p("/Game/community/moderation/");
        link.textContent = m.moderation;
        $(".nav")?.append(link);
      }
      await moderation();
    })
    .catch((error) => show(error.message));

