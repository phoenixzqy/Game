const CACHE = "backmir-darkforged-pages-3612784fe171a9bc";
const OFFLINE_ASSETS = (function createOfflineAssets({
  storage = globalThis.caches,
  baseURL = globalThis.location?.href,
  fetcher = globalThis.fetch,
  cryptoAPI = globalThis.crypto,
} = {}) {
  const SHARED = "backmir-offline-content-v1",
    base = new URL(baseURL),
    absolute = (u) => new URL(typeof u === "string" ? u : u.url, base).href,
    canonical = (u) => {
      const x = new URL(absolute(u));
      return x.origin + x.pathname;
    };
  const digest = async (response) =>
    Array.from(
      new Uint8Array(
        await cryptoAPI.subtle.digest("SHA-256", await response.clone().arrayBuffer()),
      ),
      (x) => x.toString(16).padStart(2, "0"),
    ).join("");
  const hashFor = (url, manifest) =>
    manifest?.integrity?.[canonical(url)] ||
    manifest?.integrity?.[new URL(absolute(url)).pathname] ||
    null;
  // Strip the source response URL so module imports and Worker URLs resolve in the requesting game's scope.
  const rebase = (response) =>
    new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  const blobKey = (hash) => new URL("/Game/__backmir_offline_content__/" + hash, base.origin).href;
  async function verified(response, hash) {
    return !!response?.ok && (await digest(response)) === hash;
  }
  // A gameplay request can still use the response when the device cannot store it.
  // Explicit offline downloads remain strict: they only count bytes actually written.
  const bestEffort = async (work) => {
    try {
      return await work();
    } catch {
      return null;
    }
  };
  async function put(url, response, manifest, cache, { optional = false } = {}) {
    if (response.status === 206) return;
    if (!response.ok) throw Error("HTTP " + response.status);
    const hash = hashFor(url, manifest);
    if (hash && !(await verified(response, hash)))
      throw Error("Integrity mismatch: " + absolute(url));
    const write = async () =>
      hash
        ? (await storage.open(SHARED)).put(blobKey(hash), rebase(response.clone()))
        : cache.put(absolute(url), response.clone());
    if (optional) await bestEffort(write);
    else await write();
  }
  let legacyIndex;
  async function match(
    url,
    manifest,
    cache,
    { legacy = true, sharedKnown = true, localKnown = true } = {},
  ) {
    const hash = hashFor(url, manifest),
      request = absolute(url),
      localMatch = () => bestEffort(() => cache.match(request, { ignoreSearch: true }));
    if (!hash) return localMatch();
    const shared = await bestEffort(() => storage.open(SHARED)),
      hit = sharedKnown && shared ? await bestEffort(() => shared.match(blobKey(hash))) : null;
    if (hit) return rebase(hit);
    const local = localKnown ? await localMatch() : null;
    const promote = async (response) => {
      if (shared) await bestEffort(() => shared.put(blobKey(hash), rebase(response.clone())));
      return rebase(response);
    };
    if (await verified(local, hash)) return promote(local);
    if (legacy) {
      const prefix = base.pathname.startsWith("/Game/play/darkforged/")
        ? "backmir-darkforged-"
        : base.pathname.startsWith("/Game/play/classic-hell/")
          ? "backmir-classic-hell-"
          : "dream-h5-";
      const sameGame = (n) =>
        n.startsWith(prefix) ||
        (prefix === "dream-h5-" &&
          n.startsWith("backmir-classic-") &&
          !n.startsWith("backmir-classic-hell-"));
      legacyIndex ??= storage
        .keys()
        .then((names) =>
          Promise.all(
            names
              .filter(sameGame)
              .slice(-4)
              .reverse()
              .map(async (name) =>
                bestEffort(async () => {
                  const old = await storage.open(name);
                  return {
                    cache: old,
                    keys: new Set((await old.keys()).map((r) => canonical(r.url))),
                  };
                }),
              ),
          ),
        )
        .catch(() => {
          legacyIndex = null;
          return [];
        });
      for (const entry of await legacyIndex) {
        if (!entry?.keys.has(canonical(url))) continue;
        const old = await bestEffort(() => entry.cache.match(request, { ignoreSearch: true }));
        if (await verified(old, hash)) return promote(old);
      }
    }
    return null;
  }
  async function manifest(cacheName) {
    const cache = await storage.open(cacheName),
      url = new URL("./offline-manifest.json", base).href;
    const hit = await bestEffort(() => cache.match(url, { ignoreSearch: true }));
    if (hit) {
      const saved = await bestEffort(() => hit.json());
      if (saved?.cache === cacheName) return saved;
    }
    const fresh = new URL(url);
    fresh.searchParams.set("__release", cacheName);
    const response = await fetcher(fresh.href, { cache: "no-store" });
    if (!response.ok) throw Error("Offline manifest HTTP " + response.status);
    const current = await response.clone().json();
    if (current.cache !== cacheName) throw Error("Offline manifest version mismatch: " + cacheName);
    await bestEffort(() => cache.put(url, response));
    return current;
  }
  async function respond(response, request) {
    const range = request?.headers?.get?.("range");
    if (!range) return response;
    const bytes = await response.arrayBuffer(),
      size = bytes.byteLength,
      m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    let start, end;
    if (m && (m[1] || m[2])) {
      if (!m[1]) {
        const suffix = Number(m[2]);
        start = Math.max(0, size - suffix);
        end = size - 1;
      } else {
        start = Number(m[1]);
        end = m[2] ? Math.min(size - 1, Number(m[2])) : size - 1;
      }
    }
    if (
      !m ||
      !Number.isSafeInteger(start) ||
      !Number.isSafeInteger(end) ||
      start < 0 ||
      start > end ||
      start >= size
    )
      return new Response(null, { status: 416, headers: { "Content-Range": "bytes */" + size } });
    const headers = new Headers(response.headers);
    headers.delete("Content-Encoding");
    headers.set("Content-Range", "bytes " + start + "-" + end + "/" + size);
    headers.set("Content-Length", String(end - start + 1));
    headers.set("Accept-Ranges", "bytes");
    return new Response(bytes.slice(start, end + 1), { status: 206, headers });
  }
  return { SHARED, absolute, canonical, blobKey, hashFor, digest, match, put, manifest, respond };
})({ baseURL: self.registration.scope });
const LANGUAGE_ASSETS = {
    "zh-CN": [
      "/Game/play/darkforged/locales/zh-CN/common.f302c3195c656ab7.json",
      "/Game/play/darkforged/locales/zh-CN/entities-adventure-sets.edf42d8a63adc25a.json",
      "/Game/play/darkforged/locales/zh-CN/entities-affixes.2c79c1537c91e858.json",
      "/Game/play/darkforged/locales/zh-CN/entities-boss-accessories.414de124bfff292c.json",
      "/Game/play/darkforged/locales/zh-CN/entities-boss-relics.e96f615845205e79.json",
      "/Game/play/darkforged/locales/zh-CN/entities-buffs.8f055a07d8559d3c.json",
      "/Game/play/darkforged/locales/zh-CN/entities-crafting.c91b1e0a9c596dfc.json",
      "/Game/play/darkforged/locales/zh-CN/entities-darkforged.9e265cbdcaa58380.json",
      "/Game/play/darkforged/locales/zh-CN/entities-honor-titles.6fa904b9c81a2110.json",
      "/Game/play/darkforged/locales/zh-CN/entities-items.9d6cf58409e35ae8.json",
      "/Game/play/darkforged/locales/zh-CN/entities-late-content.4a3e8a74991c4f57.json",
      "/Game/play/darkforged/locales/zh-CN/entities-maps.daaae4d0408f9fb5.json",
      "/Game/play/darkforged/locales/zh-CN/entities-monster-affixes.1d00888bace7a378.json",
      "/Game/play/darkforged/locales/zh-CN/entities-monsters.8493a381d9c284b1.json",
      "/Game/play/darkforged/locales/zh-CN/entities-npcs.7a608892da1efe8f.json",
      "/Game/play/darkforged/locales/zh-CN/entities-potentials.19261f600cf1bd1b.json",
      "/Game/play/darkforged/locales/zh-CN/entities-quests.7edd2932ebf356f8.json",
      "/Game/play/darkforged/locales/zh-CN/entities-sets.73778a966adc427f.json",
      "/Game/play/darkforged/locales/zh-CN/entities-skills.47c15ea0556b4363.json",
      "/Game/play/darkforged/locales/zh-CN/entities-towns.f611042d3aa95b33.json",
      "/Game/play/darkforged/locales/zh-CN/game-affixes.0fc3349bf42b54c8.json",
      "/Game/play/darkforged/locales/zh-CN/game-buffs.b6d0496fabc10ad4.json",
      "/Game/play/darkforged/locales/zh-CN/game-character.267a5ff09a2d90b4.json",
      "/Game/play/darkforged/locales/zh-CN/game-cloud.8df294a85545ff9e.json",
      "/Game/play/darkforged/locales/zh-CN/game-darkforged-collection.b077875a38134b8b.json",
      "/Game/play/darkforged/locales/zh-CN/game-darkforged-favorite-core.bf375e3945342cec.json",
      "/Game/play/darkforged/locales/zh-CN/game-darkforged-recipes.234f8965be47bfec.json",
      "/Game/play/darkforged/locales/zh-CN/game-darkforged-tutorial.727a8903b89b5d03.json",
      "/Game/play/darkforged/locales/zh-CN/game-darkforged-workshop.dfa45895bf4e68c8.json",
      "/Game/play/darkforged/locales/zh-CN/game-darkforged.80bb432e14d0e4b0.json",
      "/Game/play/darkforged/locales/zh-CN/game-dialogue.c674a8678e0c1f36.json",
      "/Game/play/darkforged/locales/zh-CN/game-entry.c1a2cdc9e65c45f8.json",
      "/Game/play/darkforged/locales/zh-CN/game-equipment.77c897864f8d9beb.json",
      "/Game/play/darkforged/locales/zh-CN/game-forge-results.6dcf5790125914ad.json",
      "/Game/play/darkforged/locales/zh-CN/game-forge.74d4b70865571c09.json",
      "/Game/play/darkforged/locales/zh-CN/game-gems.4fc3b6a8fc135a77.json",
      "/Game/play/darkforged/locales/zh-CN/game-hud.46a2a6d83a23e1d0.json",
      "/Game/play/darkforged/locales/zh-CN/game-hydra.91ffabd1152a574c.json",
      "/Game/play/darkforged/locales/zh-CN/game-interface.61d18b14bb264b89.json",
      "/Game/play/darkforged/locales/zh-CN/game-items-shops.96b91802c82bb125.json",
      "/Game/play/darkforged/locales/zh-CN/game-late.33c19ef4f89e1c70.json",
      "/Game/play/darkforged/locales/zh-CN/game-management.6f09d84c73839e8f.json",
      "/Game/play/darkforged/locales/zh-CN/game-messages.9ba6b13b393a6178.json",
      "/Game/play/darkforged/locales/zh-CN/game-quests.87eb5d5e63d84893.json",
      "/Game/play/darkforged/locales/zh-CN/game-recipes.7826b3cdeccdda96.json",
      "/Game/play/darkforged/locales/zh-CN/game-share.da77fbbe26af133c.json",
      "/Game/play/darkforged/locales/zh-CN/game-site.b8170e4619ec43a2.json",
      "/Game/play/darkforged/locales/zh-CN/game-skill-effects.baff5915de4885e3.json",
      "/Game/play/darkforged/locales/zh-CN/game-skills.11bf0ec99ee0fc79.json",
      "/Game/play/darkforged/locales/zh-CN/game-storage.f0dd36244d7b8be4.json",
      "/Game/play/darkforged/locales/zh-CN/game-system.66d9c7f831482ce6.json",
      "/Game/play/darkforged/locales/zh-CN/game-trial.899bffc37e89bf1f.json",
      "/Game/play/darkforged/locales/zh-CN/website-content.17ce7011d23429a6.json",
      "/Game/play/darkforged/locales/zh-CN/website-endgame.7875b46eeb6e906a.json",
      "/Game/play/darkforged/locales/zh-CN/website-home.267a584d22994d1d.json",
      "/Game/play/darkforged/locales/zh-CN/website-knowledge.c5785166446ee146.json",
      "/Game/play/darkforged/locales/zh-CN/website-player-guides.cf38bf7b7ffbf97d.json",
      "/Game/play/darkforged/locales/zh-CN/website-shell.8f4a7337c6bfdfc7.json",
      "/Game/play/darkforged/locales/zh-CN.json",
    ],
    en: [
      "/Game/play/darkforged/locales/en/common.d6bac8498ef28861.json",
      "/Game/play/darkforged/locales/en/entities-adventure-sets.13e73ad5dd8fe57a.json",
      "/Game/play/darkforged/locales/en/entities-affixes.fe01a59e6ffcb0c7.json",
      "/Game/play/darkforged/locales/en/entities-boss-accessories.6a2a8333f22de090.json",
      "/Game/play/darkforged/locales/en/entities-boss-relics.afbde495168ba694.json",
      "/Game/play/darkforged/locales/en/entities-buffs.38d15f922ab30f5f.json",
      "/Game/play/darkforged/locales/en/entities-crafting.8c9a512137be8fc1.json",
      "/Game/play/darkforged/locales/en/entities-darkforged.44b7384c047e0178.json",
      "/Game/play/darkforged/locales/en/entities-honor-titles.10773c3d3edeca66.json",
      "/Game/play/darkforged/locales/en/entities-items.9b9ca2d18f844e77.json",
      "/Game/play/darkforged/locales/en/entities-late-content.2ef48a22ed0104ab.json",
      "/Game/play/darkforged/locales/en/entities-maps.b03cc7e6eccf4329.json",
      "/Game/play/darkforged/locales/en/entities-monster-affixes.ce7b4e62616009e2.json",
      "/Game/play/darkforged/locales/en/entities-monsters.0eeb05d03b55b441.json",
      "/Game/play/darkforged/locales/en/entities-npcs.49716fc71ae438a9.json",
      "/Game/play/darkforged/locales/en/entities-potentials.4d774177fae9b055.json",
      "/Game/play/darkforged/locales/en/entities-quests.6c9aa76a0625c1db.json",
      "/Game/play/darkforged/locales/en/entities-sets.46eb51532620e071.json",
      "/Game/play/darkforged/locales/en/entities-skills.650f13e15fb7667d.json",
      "/Game/play/darkforged/locales/en/entities-towns.bc9bdfe03b8280a6.json",
      "/Game/play/darkforged/locales/en/game-affixes.45c5bfa0d9e4fb6b.json",
      "/Game/play/darkforged/locales/en/game-buffs.7a4261f7c69be17c.json",
      "/Game/play/darkforged/locales/en/game-character.480c862f1011a698.json",
      "/Game/play/darkforged/locales/en/game-cloud.701813ec78197d0c.json",
      "/Game/play/darkforged/locales/en/game-darkforged-collection.c21bc038cc74f9bc.json",
      "/Game/play/darkforged/locales/en/game-darkforged-favorite-core.2a507a634c56c33b.json",
      "/Game/play/darkforged/locales/en/game-darkforged-recipes.af7449ef49fa6f96.json",
      "/Game/play/darkforged/locales/en/game-darkforged-tutorial.e1226e92f2b8d72d.json",
      "/Game/play/darkforged/locales/en/game-darkforged-workshop.b2eefcfd1a17c954.json",
      "/Game/play/darkforged/locales/en/game-darkforged.d9efc8855b444a2f.json",
      "/Game/play/darkforged/locales/en/game-dialogue.f274f1f6bd83b863.json",
      "/Game/play/darkforged/locales/en/game-entry.42429aa3900943b5.json",
      "/Game/play/darkforged/locales/en/game-equipment.f31d51da01b99e85.json",
      "/Game/play/darkforged/locales/en/game-forge-results.2518c6ad1981efdd.json",
      "/Game/play/darkforged/locales/en/game-forge.90b637f0c7777e46.json",
      "/Game/play/darkforged/locales/en/game-gems.af4ff9912d8a8218.json",
      "/Game/play/darkforged/locales/en/game-hud.81c24c92f38df306.json",
      "/Game/play/darkforged/locales/en/game-hydra.a923837d2ae326ef.json",
      "/Game/play/darkforged/locales/en/game-interface.97ff735fbcbe5ce1.json",
      "/Game/play/darkforged/locales/en/game-items-shops.464523a8db048d06.json",
      "/Game/play/darkforged/locales/en/game-late.0f74dfe52a01b97f.json",
      "/Game/play/darkforged/locales/en/game-management.fbce4a24c56a85fc.json",
      "/Game/play/darkforged/locales/en/game-messages.fcfcd33ddee3a7fc.json",
      "/Game/play/darkforged/locales/en/game-quests.255a3a30bd7b650d.json",
      "/Game/play/darkforged/locales/en/game-recipes.0871b04f4f361254.json",
      "/Game/play/darkforged/locales/en/game-share.07422e4a1e28a95c.json",
      "/Game/play/darkforged/locales/en/game-site.e94c02182a390a3d.json",
      "/Game/play/darkforged/locales/en/game-skill-effects.c62afb3d96c702cf.json",
      "/Game/play/darkforged/locales/en/game-skills.88e87dc8fd9e0203.json",
      "/Game/play/darkforged/locales/en/game-storage.ac8359cca2b75c5d.json",
      "/Game/play/darkforged/locales/en/game-system.fc501df83a695d87.json",
      "/Game/play/darkforged/locales/en/game-trial.f7db9a9e93f35fbf.json",
      "/Game/play/darkforged/locales/en/website-content.fa8c1c54cdb060b1.json",
      "/Game/play/darkforged/locales/en/website-endgame.96281cc5c2e5cb77.json",
      "/Game/play/darkforged/locales/en/website-home.6435aa6743865dde.json",
      "/Game/play/darkforged/locales/en/website-knowledge.1bb72200232f065a.json",
      "/Game/play/darkforged/locales/en/website-player-guides.86b69fb169ef6ea1.json",
      "/Game/play/darkforged/locales/en/website-shell.d9daf046b0019d1d.json",
      "/Game/play/darkforged/locales/en.json",
    ],
    es: [
      "/Game/play/darkforged/locales/es/common.466f0dab953d6b46.json",
      "/Game/play/darkforged/locales/es/entities-adventure-sets.114e94b7f9ffc5e2.json",
      "/Game/play/darkforged/locales/es/entities-affixes.873541924aa31870.json",
      "/Game/play/darkforged/locales/es/entities-boss-accessories.25abc05c5c73f50c.json",
      "/Game/play/darkforged/locales/es/entities-boss-relics.f201915f81f41f65.json",
      "/Game/play/darkforged/locales/es/entities-buffs.82ce0ca4712dcfe1.json",
      "/Game/play/darkforged/locales/es/entities-crafting.133fc0428ea7ec45.json",
      "/Game/play/darkforged/locales/es/entities-darkforged.d50b4d38fd86661b.json",
      "/Game/play/darkforged/locales/es/entities-honor-titles.f2d46e1777fbf469.json",
      "/Game/play/darkforged/locales/es/entities-items.896d06dce4e4908b.json",
      "/Game/play/darkforged/locales/es/entities-late-content.d4649f731782ac1f.json",
      "/Game/play/darkforged/locales/es/entities-maps.f9ca75cfc9f3731d.json",
      "/Game/play/darkforged/locales/es/entities-monster-affixes.9c420fbf032f05e7.json",
      "/Game/play/darkforged/locales/es/entities-monsters.439bf64787aa001c.json",
      "/Game/play/darkforged/locales/es/entities-npcs.ce8752a59ed9142a.json",
      "/Game/play/darkforged/locales/es/entities-potentials.b46a528a47cd84b9.json",
      "/Game/play/darkforged/locales/es/entities-quests.35f539043c52b39b.json",
      "/Game/play/darkforged/locales/es/entities-sets.0a25ec8ebb062317.json",
      "/Game/play/darkforged/locales/es/entities-skills.8d6fd65a46e03347.json",
      "/Game/play/darkforged/locales/es/entities-towns.0d2a73c11c4dd1d4.json",
      "/Game/play/darkforged/locales/es/game-affixes.8913e705ead7cda9.json",
      "/Game/play/darkforged/locales/es/game-buffs.50f7a527ea8e6527.json",
      "/Game/play/darkforged/locales/es/game-character.e6e0d394e27259c0.json",
      "/Game/play/darkforged/locales/es/game-cloud.70e5aab4c1202882.json",
      "/Game/play/darkforged/locales/es/game-darkforged-collection.8664fc9542f83a8d.json",
      "/Game/play/darkforged/locales/es/game-darkforged-favorite-core.78cb7a2bf0ac574f.json",
      "/Game/play/darkforged/locales/es/game-darkforged-recipes.8293eca4deb29046.json",
      "/Game/play/darkforged/locales/es/game-darkforged-tutorial.fbe41b1d32090c36.json",
      "/Game/play/darkforged/locales/es/game-darkforged-workshop.e6f408b83c711f63.json",
      "/Game/play/darkforged/locales/es/game-darkforged.e8ea7ca62916965c.json",
      "/Game/play/darkforged/locales/es/game-dialogue.08ec914a29b4a99c.json",
      "/Game/play/darkforged/locales/es/game-entry.9cd3f21d445f99fc.json",
      "/Game/play/darkforged/locales/es/game-equipment.da14fb69b457eb28.json",
      "/Game/play/darkforged/locales/es/game-forge-results.78006a999bd453ca.json",
      "/Game/play/darkforged/locales/es/game-forge.8953e0c9996659cd.json",
      "/Game/play/darkforged/locales/es/game-gems.eb003d905e4265c3.json",
      "/Game/play/darkforged/locales/es/game-hud.6dd9b300dafd1423.json",
      "/Game/play/darkforged/locales/es/game-hydra.31ad036b234d0bd0.json",
      "/Game/play/darkforged/locales/es/game-interface.385ef99541d68b39.json",
      "/Game/play/darkforged/locales/es/game-items-shops.75c17f4727fbb102.json",
      "/Game/play/darkforged/locales/es/game-late.9636262678a4a340.json",
      "/Game/play/darkforged/locales/es/game-management.b350807ad8a5c4b7.json",
      "/Game/play/darkforged/locales/es/game-messages.c2df1f609c9a7dc4.json",
      "/Game/play/darkforged/locales/es/game-quests.b624560d90013b95.json",
      "/Game/play/darkforged/locales/es/game-recipes.fd3186a2b30582f2.json",
      "/Game/play/darkforged/locales/es/game-share.f7c2074abdcf043a.json",
      "/Game/play/darkforged/locales/es/game-site.ecafc152b8e564ba.json",
      "/Game/play/darkforged/locales/es/game-skill-effects.afffed6995b942a4.json",
      "/Game/play/darkforged/locales/es/game-skills.c5544b0876c0d5d8.json",
      "/Game/play/darkforged/locales/es/game-storage.5fd0fef043eebb3e.json",
      "/Game/play/darkforged/locales/es/game-system.f309856855354f82.json",
      "/Game/play/darkforged/locales/es/game-trial.404df055afb92a59.json",
      "/Game/play/darkforged/locales/es/website-content.8bfe729d888defd8.json",
      "/Game/play/darkforged/locales/es/website-endgame.07dc4989f36b246b.json",
      "/Game/play/darkforged/locales/es/website-home.dd4259e4c320b184.json",
      "/Game/play/darkforged/locales/es/website-knowledge.42a44e57fa2e85d1.json",
      "/Game/play/darkforged/locales/es/website-player-guides.b8f7aa68847abfc2.json",
      "/Game/play/darkforged/locales/es/website-shell.580325e41cecbd82.json",
      "/Game/play/darkforged/locales/es.json",
    ],
  },
  SHELL = [
    "/Game/site-assets/game-preferences.mjs",
    "/Game/site-assets/game-update.mjs",
    "./cloud/gist-client.mjs",
    "./cloud/gist-cloud.mjs",
    "./collection-nav.js",
    "./cloud/account-login.mjs",
    "./cloud/community-i18n.mjs",
    "./cloud/google-signin.mjs",
    "./cloud/account-conversion-i18n.mjs",
    "./cloud/account-attribution.mjs",
    "./cloud/account-session.mjs",
    "./cloud/email-signin.mjs",
    "./cloud/backup-prompt.mjs",
    "./cloud/auto-cloud-save.mjs",
    "./cloud/save-sync.mjs",
    "./cloud/cloud-save-client.mjs",
    "./cloud/cloud-save-i18n.mjs",
    "./cloud/cloud-save-panel.mjs",
    "./cloud/game-save-sync.mjs",
    "./cloud/leaderboard-i18n.mjs",
    "./cloud/darkforged-account-client.mjs",
    "./cloud/game.css",
    "./assets/share-font/backmir-share-sans.6a1acde9f42c8475.woff2",
    "./",
    "./index.html",
    "./style.css",
    "./update.html",
    "./offline-manifest.json",
    "./locales/manifest.json",
    "./assets/webp-codec/encode.js",
    "./assets/webp-codec/encode-worker.js",
    "./assets/webp-codec/meta.js",
    "./assets/webp-codec/webp_enc.js",
    "./assets/webp-codec/webp_enc.wasm",
    "./actor-picking.js",
    "./character-panel.js",
    "./client.js",
    "./cloud-api.js",
    "./combat-text.js",
    "./control-mode.js",
    "./darkforged.js",
    "./desktop-spell-target.js",
    "./equipment-language.js",
    "./equipment-management.js",
    "./gem-enhancement.js",
    "./healing-target.js",
    "./i18n.js",
    "./item-quality.js",
    "./loot-beam.js",
    "./map-navigation.js",
    "./map-viewport.js",
    "./mobile-mode-recovery.js",
    "./monster-frame.js",
    "./monster-markers.js",
    "./offline-download.js",
    "./offline-locales.js",
    "./path-singleplayer.js",
    "./path.js",
    "./player-animation.js",
    "./portal-effects.js",
    "./quest-order.js",
    "./skill-info.js",
    "./spell-effects.js",
    "./transport.js",
    "./visuals.js",
    "./worker.js",
    "./offline-assets.js",
    "./mobile/entry.62895d72e48d.js",
    "./mobile/mobile.292642e3da50.css",
    "/Game/play/darkforged/locales/zh-CN/game-forge.74d4b70865571c09.json",
    "/Game/play/darkforged/locales/en/game-forge.90b637f0c7777e46.json",
    "/Game/play/darkforged/locales/es/game-forge.8953e0c9996659cd.json",
    "/Game/play/darkforged/locales/zh-CN/game-darkforged.80bb432e14d0e4b0.json",
    "/Game/play/darkforged/locales/zh-CN/game-trial.252f0932c0a4fae9.json",
    "/Game/play/darkforged/locales/en/game-darkforged.d9efc8855b444a2f.json",
    "/Game/play/darkforged/locales/en/game-trial.7a5f49202adcf6cf.json",
    "/Game/play/darkforged/locales/es/game-darkforged.e8ea7ca62916965c.json",
    "/Game/play/darkforged/locales/es/game-trial.8b6fc31ad0c68cf7.json",
    "/Game/play/darkforged/locales/zh-CN/game-skills.11bf0ec99ee0fc79.json",
    "/Game/play/darkforged/locales/zh-CN/game-system.66d9c7f831482ce6.json",
    "/Game/play/darkforged/locales/en/game-skills.88e87dc8fd9e0203.json",
    "/Game/play/darkforged/locales/en/game-system.fc501df83a695d87.json",
    "/Game/play/darkforged/locales/es/game-skills.c5544b0876c0d5d8.json",
    "/Game/play/darkforged/locales/es/game-system.f309856855354f82.json",
    "./catalog/items.json",
    "./data/rules.json",
    "./assets/compatibility.json",
    "/Game/play/darkforged/locales/zh-CN/entities-buffs.610530d19e230a0f.json",
    "/Game/play/darkforged/locales/zh-CN/game-darkforged-recipes.63ed7e3b24a86f30.json",
    "/Game/play/darkforged/locales/zh-CN/game-darkforged-workshop.c408589f5380a2e4.json",
    "/Game/play/darkforged/locales/zh-CN/game-equipment.1bac07382300c673.json",
    "/Game/play/darkforged/locales/zh-CN/game-items-shops.e1899444a0bc663d.json",
    "/Game/play/darkforged/locales/en/entities-buffs.762c9df7b88d9e1d.json",
    "/Game/play/darkforged/locales/en/game-darkforged-recipes.a11577b4e7013a3c.json",
    "/Game/play/darkforged/locales/en/game-darkforged-workshop.e314031fdffd4e01.json",
    "/Game/play/darkforged/locales/en/game-equipment.e07d51892fc9d339.json",
    "/Game/play/darkforged/locales/en/game-items-shops.15e20f241cdac439.json",
    "/Game/play/darkforged/locales/es/entities-buffs.5ab5094a49d791f2.json",
    "/Game/play/darkforged/locales/es/game-darkforged-recipes.39d60a0be9d25362.json",
    "/Game/play/darkforged/locales/es/game-darkforged-workshop.60e9e844e39fdf4b.json",
    "/Game/play/darkforged/locales/es/game-equipment.c1de460d0ce5039b.json",
    "/Game/play/darkforged/locales/es/game-items-shops.7014c459570e8e5a.json",
    "/Game/play/darkforged/locales/zh-CN/game-recipes.956ee53face30c8d.json",
    "/Game/play/darkforged/locales/en/game-recipes.413d65fe67955484.json",
    "/Game/play/darkforged/locales/es/game-recipes.d99849cc59a566da.json",
    "./approach-path.js",
    "./mobile/entry.b7d3d3cc5b26.js",
    "./assets/spell-effects.json",
    "./mobile/entry.ce90fafbcb3c.js",
    "./mobile/mobile.3b183706ccfe.css",
    "./mobile/entry.72846b172b40.js",
  "/Game/__local__/offline.js","/Game/__local__/offline.css",];

const GAME_SW = {
  owns: (name) =>
    typeof name === "string" && name.startsWith("backmir-darkforged-"),
  context: (u) => u.pathname.startsWith("/Game/play/darkforged/"),
  request(u) {
    const site = new URL("../../", self.registration.scope);
    if (!(u.pathname.startsWith("/Game/play/darkforged/") || u.pathname.startsWith("/Game/_shared/") || u.pathname.startsWith("/Game/__local__/")))
      return ["site-assets/", "_shared/", "__local__/"].some((path) =>
        u.pathname.startsWith(new URL(path, site).pathname),
      );
    return true;
  },
};

// Bundled after each game's CACHE, SHELL, language assets and request policy.
(function gameCacheRuntime() {
  const PINS = "backmir-game-client-pins";
  const key = (id) =>
    new Request(
      self.location.origin + "/Game/__cache_pin__/" + encodeURIComponent(id),
    );
  const owned = (name) => GAME_SW.owns(name);
  const readPin = async (id) =>
    id ? (await (await caches.open(PINS)).match(key(id)))?.text() : null;
  const pin = async (id, name) => {
    if (id && owned(name) && (await caches.keys()).includes(name))
      await (await caches.open(PINS)).put(key(id), new Response(name));
  };
  const manifests = new Map();
  const manifestFor = (name) => {
    if (!manifests.has(name))
      manifests.set(
        name,
        OFFLINE_ASSETS.manifest(name).catch(() => {
          manifests.delete(name);
          return null;
        }),
      );
    return manifests.get(name);
  };
  const activeCache = () =>
    new Promise((resolve) => {
      const active = self.registration.active;
      if (!active) {
        resolve(null);
        return;
      }
      const channel = new MessageChannel();
      const done = (value) => {
        clearTimeout(timer);
        channel.port1.close();
        channel.port2.close();
        resolve(value);
      };
      const timer = setTimeout(() => done(null), 2000);
      channel.port1.onmessage = (event) => done(event.data?.cache);
      active.postMessage({ type: "GET_CACHE_VERSION" }, [channel.port2]);
    });
  self.addEventListener("install", (event) =>
    event.waitUntil(
      (async () => {
        const pages = (
          await self.clients.matchAll({
            includeUncontrolled: true,
            type: "all",
          })
        ).filter((client) => GAME_SW.context(new URL(client.url)));
        const old = await activeCache();
        // Old installed workers had no pins in Hell/Darkforged. Capture their release
        // before claiming live documents, including dedicated game workers.
        for (const client of pages)
          if (!(await readPin(client.id)) && old) await pin(client.id, old);
        const requested = [
          new URL(self.location.href).searchParams.get("lang"),
          ...pages.map((client) =>
            new URL(client.url).searchParams.get("lang"),
          ),
        ];
        const codes = new Set(["zh-CN"]);
        for (const value of requested) {
          const normalized = String(value || "")
            .replaceAll("_", "-")
            .toLowerCase();
          const code =
            Object.keys(LANGUAGE_ASSETS).find(
              (code) => code.toLowerCase() === normalized,
            ) ||
            Object.keys(LANGUAGE_ASSETS).find(
              (code) => code.toLowerCase() === normalized.split("-")[0],
            );
          if (code) codes.add(code);
        }
        const cache = await caches.open(CACHE);
        const manifest = await OFFLINE_ASSETS.manifest(CACHE);
        const files = [
          ...new Set([
            ...SHELL,
            ...[...codes].flatMap((code) => LANGUAGE_ASSETS[code]),
          ]),
        ];
        let next = 0;
        await Promise.all(
          Array.from({ length: Math.min(8, files.length) }, async () => {
            while (next < files.length) {
              const file = files[next++],
                url = new URL(file, self.location.href);
              url.searchParams.set("__release", CACHE);
              const response = await fetch(url, { cache: "no-store" });
              if (!response.ok)
                throw Error("Shell HTTP " + response.status + ": " + file);
              await OFFLINE_ASSETS.put(file, response.clone(), manifest, cache);
              await cache.put(new URL(file, self.location.href), response);
            }
          }),
        );
        // Existing tabs keep their pinned bytes. The next navigation gets the new
        // shell without a DevTools reset or clearing character storage.
        await self.skipWaiting();
      })(),
    ),
  );
  self.addEventListener("message", (event) => {
    if (event.data?.type === "PIN_GAME_CACHE")
      event.waitUntil(pin(event.source?.id, event.data.cache));
    if (event.data?.type === "GET_CACHE_VERSION")
      event.ports?.[0]?.postMessage({ cache: CACHE });
    if (
      ["ACTIVATE_UPDATE", "SKIP_WAITING"].includes(event.data?.type) ||
      event.data === "SKIP_WAITING"
    )
      event.waitUntil(self.skipWaiting());
  });
  self.addEventListener("activate", (event) =>
    event.waitUntil(
      (async () => {
        const live = await self.clients.matchAll({
            includeUncontrolled: true,
            type: "all",
          }),
          keep = new Set([CACHE]);
        let unknown = false;
        for (const client of live) {
          const saved = await readPin(client.id);
          if (saved) keep.add(saved);
          else if (GAME_SW.context(new URL(client.url))) unknown = true;
        }
        if (!unknown) {
          const names = await caches.keys(),
            previous = names
              .filter((name) => owned(name) && !keep.has(name))
              .at(-1);
          if (previous) keep.add(previous);
          for (const name of names)
            if (owned(name) && !keep.has(name)) await caches.delete(name);
        }
        const pins = await caches.open(PINS),
          ids = new Set(live.map((client) => client.id));
        for (const request of await pins.keys())
          if (
            !ids.has(
              decodeURIComponent(
                new URL(request.url).pathname.split("/").at(-1),
              ),
            )
          )
            await pins.delete(request);
        await self.clients.claim();
        for (const client of live)
          if (GAME_SW.context(new URL(client.url)))
            client.postMessage({ type: "GAME_UPDATE_READY", cache: CACHE });
      })(),
    ),
  );
  self.addEventListener("fetch", (event) => {
    const u = new URL(event.request.url);
    if (
      event.request.method !== "GET" ||
      u.origin !== self.location.origin ||
      !GAME_SW.request(u) ||
      (event.request.headers.has("range") &&
        !/\.(?:mp3|ogg|wav|webm)$/.test(u.pathname)) ||
      u.pathname.endsWith(".mp4")
    )
      return;
    event.respondWith(
      (async () => {
        const navigation = event.request.mode === "navigate";
        const saved = navigation ? null : await readPin(event.clientId);
        const name = owned(saved) ? saved : CACHE,
          cache = await caches.open(name);
        const manifest = await manifestFor(name);
        // A navigated document and all its module/worker requests use one release.
        if (event.resultingClientId) await pin(event.resultingClientId, name);
        const navigable = (response) =>
          navigation && response?.redirected
            ? new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
              })
            : response;
        const hit = manifest
          ? await OFFLINE_ASSETS.match(event.request, manifest, cache)
          : await cache.match(event.request, { ignoreSearch: true });
        if (hit)
          return event.request.headers.has("range")
            ? OFFLINE_ASSETS.respond(hit, event.request)
            : navigable(hit);
        const response = await fetch(event.request);
        if (response.ok) {
          if (manifest)
            await OFFLINE_ASSETS.put(
              event.request,
              response.clone(),
              manifest,
              cache,
              { optional: true },
            );
          else await cache.put(event.request, response.clone());
        }
        return navigable(response);
      })(),
    );
  });
})();

