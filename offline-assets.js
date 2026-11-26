// Shared verified public bytes survive game-version cache rotation. Never reuse by URL alone.
export function createOfflineAssets({
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
    const response = await fetcher(url);
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
}

