const e = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
export function authorLine(item, post, m, locale) {
  const time = new Date(item.created_at * 1000);
  return `<div class="thread-author"><span class="thread-avatar" aria-hidden="true">${e(Array.from(item.nickname || "?")[0])}</span><div><strong>${e(item.nickname)}</strong>${item.user_id === post.user_id ? ` <span class="op-badge">${e(m.originalPoster)}</span>` : ""}<time datetime="${time.toISOString()}">${e(time.toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" }))}</time></div></div>`;
}
export function equipmentDayHeading(day, m) {
  return /^\d{4}-\d{2}-\d{2}$/.test(day || "")
    ? `<h3 class="equipment-day-heading"><time datetime="${e(day)}">${e(day)}</time><span>${e(m.equipmentDay)}</span></h3>`
    : "";
}
export function imageGallery(items = [], m) {
  return items.length
    ? `<div class="community-gallery thread-gallery gallery-${items.length}">${items
        .map((image, i) => {
          const caption =
            [image.game ? m[image.game + "Board"] : "", image.playerName, image.itemName]
              .filter(Boolean)
              .join(" · ") || m.image + " " + (i + 1);
          return `<a href="${e(image.url)}" data-lightbox data-caption="${e(caption)}" aria-label="${e(m.fullImage)} · ${e(caption)}" target="_blank" rel="noopener"><img src="${e(image.thumbnail)}" alt="${e(caption)}" loading="lazy"></a>`;
        })
        .join("")}</div>`
    : "";
}
export function reactionBar(item, type, m, { postId, basePath }) {
  const share =
    type === "post"
      ? basePath
      : basePath +
        "?focus=" +
        encodeURIComponent(item.id) +
        "#reply-" +
        encodeURIComponent(item.id);
  return `<div class="thread-actions"><button type="button" data-reply-to="${type === "post" ? "" : e(item.id)}" data-reply-name="${e(item.nickname)}">${e(m.respond)}</button><button type="button" data-reaction="like" data-type="${type}" data-id="${e(item.id)}" aria-pressed="${!!item.liked}">${e(m.like)} <span>${Number(item.likes) || 0}</span></button>${type === "post" ? `<button type="button" data-reaction="bookmark" data-type="post" data-id="${e(item.id)}" aria-pressed="${!!item.bookmarked}">${e(item.bookmarked ? m.bookmarked : m.bookmark)}</button>` : ""}<button type="button" data-share="${e(share)}">${e(m.share)}</button><details class="thread-more"><summary aria-label="${e(m.more)}">···</summary><div><button type="button" data-report="${type}" data-id="${e(item.id)}">${e(m.report)}</button><button type="button" hidden data-owner="${e(item.user_id)}" data-delete="${type}" data-id="${e(item.id)}">${e(type === "post" ? m.deletePost : m.deleteComment)}</button></div></details></div>`;
}
export function floorCard(item, { post, m, locale, basePath, onlyAuthor = false }, child = false) {
  const context = { post, m, locale, basePath, onlyAuthor };
  const children = item.children?.items || [];
  return `<article class="community-comment thread-floor${child ? " thread-child" : ""}" id="reply-${e(item.id)}">${authorLine(item, post, m, locale)}<div class="floor-content">${!child && post.isEquipmentShare ? equipmentDayHeading(item.shareDay, m) : ""}${child && item.replyTo && item.parent_id !== item.root_id ? `<p class="reply-context">${e(m.replyTo)} @${e(item.replyTo)}</p>` : ""}<div class="post-body">${e(item.body)}</div>${imageGallery(item.images, m)}<div class="floor-footer">${!child ? `<a class="floor-number" href="${e(basePath)}?focus=${e(item.id)}#reply-${e(item.id)}">${locale === "zh-CN" ? `第${Number(item.floor) || 2}楼` : `${e(m.floor)} ${Number(item.floor) || 2}`}</a>` : ""}${reactionBar(item, "comment", m, { postId: post.id, basePath })}</div>${!child && children.length ? `<details class="thread-children" ${item.expandChildren || !onlyAuthor ? "open" : ""}><summary>${e(m.viewReplies)} (${Number(item.replyCount) || children.length})</summary>${item.children.hasPrevious ? `<button type="button" data-more-replies="${e(item.id)}" data-direction="previous" data-post="${e(post.id)}" data-page="${item.children.page - 1}" data-op="${e(post.user_id)}" data-base="${e(basePath)}">${e(m.previous)}</button>` : ""}<div data-children="${e(item.id)}">${children.map((c) => floorCard(c, context, true)).join("")}</div>${item.children.hasNext ? `<button type="button" data-more-replies="${e(item.id)}" data-post="${e(post.id)}" data-page="${item.children.page + 1}" data-op="${e(post.user_id)}" data-base="${e(basePath)}">${e(m.moreReplies)}</button>` : ""}</details>` : ""}</div></article>`;
}

