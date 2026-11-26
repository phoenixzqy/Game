// shared/i18n/offline.js
function offlineFilesForLocale(offlineManifest, languageManifest, locale) {
  const selected = languageManifest.locales.find((entry) => entry.code === locale);
  if (!selected) throw Error("Unsupported offline language: " + locale);
  const siteOnly = new Set(
    Object.entries(offlineManifest.languageFiles || {})
      .filter(([code]) => code !== locale)
      .flatMap(([, files]) => files),
  );
  const codes = /* @__PURE__ */ new Set([locale, ...selected.fallback]);
  return offlineManifest.files.filter((file) => {
    if (siteOnly.has(file)) return false;
    const path = file.replace(/^\.\//, "").replace(/^\//, "");
    if (!path.startsWith("locales/") || path === "locales/manifest.json") return true;
    const relative = path.slice("locales/".length),
      code = relative.split("/")[0].replace(/\.json$/, "");
    return codes.has(code);
  });
}
export { offlineFilesForLocale };

