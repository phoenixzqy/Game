const siteText = JSON.parse(document.querySelector("#site-messages").textContent);
const text = (key, params = {}) =>
  siteText[key].replace(/\{\{(\w+)\}\}/g, (_, name) => String(params[name] ?? "{{" + name + "}}"));
const directory = document.querySelector("[data-kb-nav]");
if (directory) {
  const mobile = matchMedia("(max-width:900px)");
  const adapt = () => {
    directory.open = !mobile.matches;
  };
  adapt();
  mobile.addEventListener("change", adapt);
}
const query = document.querySelector("#kb-query");
const results = document.querySelector("#kb-results");
const fold = (value) =>
  String(value)
    .toLocaleLowerCase(document.documentElement.lang)
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
const phrasePattern = new RegExp(
  siteText.searchPhrases
    .split("|")
    .sort((a, b) => b.length - a.length)
    .map((phrase) => {
      const clean = fold(phrase),
        escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return /[a-z]/.test(clean) ? "\\b" + escaped + "\\b" : escaped;
    })
    .join("|"),
  "g",
);
const normalize = (value) =>
  fold(value)
    .replace(/\bboss\b/g, siteText.searchBossAlias)
    .replace(/[\s，。？?¿¡!«»“”"']/g, "");
const queryWords = (value) => normalize(fold(value).replace(phrasePattern, ""));
let indexPromise,
  searchSequence = 0;
async function searchKnowledge() {
  const sequence = ++searchSequence;
  const original = query.value.trim();
  if (!original) {
    results.hidden = true;
    results.replaceChildren();
    return;
  }
  results.hidden = false;
  results.textContent = text("searchLoading");
  try {
    const version = document.querySelector("script[data-kb-version]")?.dataset.kbVersion || "";
    indexPromise ??= fetch(
      document.querySelector("script[data-kb-index]").dataset.kbIndex +
        "?v=" +
        encodeURIComponent(version),
    )
      .then((r) => {
        if (!r.ok) throw Error("Search index unavailable");
        return r.json();
      })
      .catch((err) => {
        indexPromise = null;
        throw err;
      });
    const index = await indexPromise;
    if (sequence !== searchSequence) return;
    const queries = [normalize(original), queryWords(original)].filter(Boolean);
    const ranked = index
      .map((entry) => {
        const titles = [normalize(entry.title), queryWords(entry.title)],
          keywords = [normalize(entry.keywords || ""), queryWords(entry.keywords || "")];
        return {
          ...entry,
          score: Math.max(
            ...queries.map((q) =>
              titles.includes(q)
                ? 100
                : titles.some((t) => t.includes(q))
                  ? 70
                  : keywords.some((t) => t.includes(q))
                    ? 25
                    : 0,
            ),
          ),
        };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);
    // Distinct titles pointing to the same document should not crowd out other useful results.
    const seen = new Set();
    const unique = ranked.filter((entry) => {
      if (seen.has(entry.url)) return false;
      seen.add(entry.url);
      return true;
    });
    results.replaceChildren();
    const status = document.createElement("p");
    status.textContent = unique.length
      ? text("searchFound", { count: unique.length, shown: Math.min(16, unique.length) })
      : text("searchEmpty");
    results.append(status);
    for (const entry of unique.slice(0, 16)) {
      const link = document.createElement("a"),
        title = document.createElement("span"),
        tag = document.createElement("small");
      link.href = entry.url;
      title.textContent = entry.title;
      tag.textContent = entry.category;
      link.append(title, tag);
      results.append(link);
    }
  } catch (err) {
    if (sequence === searchSequence) results.textContent = text("searchError");
  }
}
if (query && results) {
  query.addEventListener("input", searchKnowledge);
  query.addEventListener("keydown", (e) => {
    if (e.key === "Escape") results.hidden = true;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      results.querySelector("a")?.focus();
    }
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".kb-global-search")) results.hidden = true;
  });
  query.addEventListener("focus", () => {
    if (query.value.trim()) searchKnowledge();
  });
  query.form.addEventListener("submit", (e) => {
    e.preventDefault();
    searchKnowledge();
  });
  const initial = new URLSearchParams(location.search).get("q");
  if (initial) {
    query.value = initial;
    searchKnowledge();
  }
}

