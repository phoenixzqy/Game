// Stable entity anchors are shared by every language. Preserve the current
// section even when the visitor arrives through an in-page search result.
function syncLanguageAnchors() {
  for (const link of document.querySelectorAll(".site-languages a")) {
    const target = new URL(link.href, location.href);
    target.hash = location.hash;
    link.href = target.href;
  }
}
syncLanguageAnchors();
window.addEventListener("hashchange", syncLanguageAnchors);
// Search filters existing HTML; article content remains available without JavaScript.
const field = document.querySelector("[data-search]");
if (field) {
  const messages = JSON.parse(document.querySelector("#site-messages").textContent);
  const records = [...document.querySelectorAll("[data-searchable]")];
  const status = document.querySelector("[data-search-status]");
  const empty = document.querySelector("[data-empty]");
  const foldPageFilter = (value) =>
    value.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase(document.documentElement.lang);
  function filter() {
    const q = foldPageFilter(field.value.trim());
    let count = 0;
    for (const record of records) {
      const matches = foldPageFilter(record.textContent).includes(q);
      record.hidden = !matches;
      if (matches) count++;
    }
    status.textContent = (q ? messages.filterFound : messages.filterTotal).replace(
      "{{count}}",
      String(q ? count : records.length),
    );
    empty.hidden = count !== 0;
  }
  field.addEventListener("input", filter);
  filter();
}

