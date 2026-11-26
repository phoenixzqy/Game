// frozen:offline-assets.js
function createOfflineAssets({
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
  const hashFor = (url, manifest2) =>
    manifest2?.integrity?.[canonical(url)] ||
    manifest2?.integrity?.[new URL(absolute(url)).pathname] ||
    null;
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
  const bestEffort = async (work) => {
    try {
      return await work();
    } catch {
      return null;
    }
  };
  async function put(url, response, manifest2, cache, { optional = false } = {}) {
    if (response.status === 206) return;
    if (!response.ok) throw Error("HTTP " + response.status);
    const hash = hashFor(url, manifest2);
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
    manifest2,
    cache,
    { legacy = true, sharedKnown = true, localKnown = true } = {},
  ) {
    const hash = hashFor(url, manifest2),
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

// offline-download.js
async function withDeadline(work, parent) {
  const request = new AbortController(),
    cancel = () => request.abort(parent?.reason);
  if (parent?.aborted) cancel();
  else parent?.addEventListener("abort", cancel, { once: true });
  const timer = setTimeout(() => request.abort(), 3e4);
  try {
    return await work(request.signal);
  } finally {
    clearTimeout(timer);
    parent?.removeEventListener("abort", cancel);
  }
}
async function downloadOfflineFiles({
  files,
  cache,
  onProgress = () => {},
  fetcher = fetch,
  retries = 2,
}) {
  let done = 0;
  for (const url of files) {
    if (!(await cache.match(url, { ignoreSearch: true }))) {
      for (let attempt = 0; ; attempt++) {
        try {
          await withDeadline(async (signal) => {
            const response = await fetcher(url, { signal });
            if (!response.ok) throw Error(url + " HTTP " + response.status);
            await cache.put(url, response);
          });
          break;
        } catch (e) {
          if (attempt >= retries) throw e;
        }
      }
    }
    onProgress(++done);
  }
  return done;
}
function createOfflineDownloadTask({
  manifestURL = new URL("./offline-manifest.json", document.baseURI).href,
  selectFiles = (m) => m.files,
  storage = globalThis.caches,
  fetcher = globalThis.fetch,
  baseURL = manifestURL,
  online = () => globalThis.navigator?.onLine !== false,
  locks = globalThis.navigator?.locks,
  cryptoAPI = globalThis.crypto,
  workerReady = async () => {
    if (globalThis.navigator?.serviceWorker) await navigator.serviceWorker.ready;
  },
} = {}) {
  const assets = createOfflineAssets({ storage, baseURL, fetcher, cryptoAPI }),
    listeners = /* @__PURE__ */ new Set(),
    scope = manifestURL + "|" + (selectFiles.locale || ""),
    stateKey = new URL("/Game/__offline_task__/" + encodeURIComponent(scope), baseURL).href;
  let manifest,
    files,
    remaining = [],
    cache,
    meta,
    controller,
    runPromise,
    readyPromise,
    initializing = false,
    disposed = false,
    hadIntent = false,
    otherTimer,
    saves = Promise.resolve();
  let state = {
    phase: "checking",
    done: 0,
    total: 0,
    reused: 0,
    downloaded: 0,
    error: null,
    wanted: false,
    requested: false,
  };
  const emit = () => {
    for (const fn of listeners)
      try {
        fn({ ...state });
      } catch {}
  };
  const persist = () => {
    const body = JSON.stringify({ ...state, manifestCache: manifest.cache, updatedAt: Date.now() });
    return (saves = saves
      .catch(() => {})
      .then(() =>
        meta.put(stateKey, new Response(body, { headers: { "Content-Type": "application/json" } })),
      ));
  };
  const set = (patch) => {
    Object.assign(state, patch);
    emit();
  };
  async function restore() {
    meta = await storage.open("backmir-offline-tasks-v1");
    const previous = await meta.match(stateKey);
    let priorState;
    if (previous) {
      const saved = (priorState = await previous.json());
      hadIntent = !!saved.wanted;
      set({
        done: saved.done || 0,
        total: saved.total || 0,
        reused: saved.done || 0,
        wanted: hadIntent,
        requested: !!saved.requested,
      });
    }
    const response = await fetcher(manifestURL);
    if (!response.ok) throw Error("Offline manifest HTTP " + response.status);
    manifest = await response.json();
    if (
      priorState?.requested &&
      priorState.phase === "complete" &&
      priorState.manifestCache !== manifest.cache
    )
      hadIntent = true;
    files = [...new Set(selectFiles(manifest))];
    cache = await storage.open(manifest.cache);
    set({ phase: "checking", total: files.length });
    const shared = await storage.open(assets.SHARED),
      keys = new Set((await shared.keys()).map((r) => r.url)),
      localKeys = new Set((await cache.keys()).map((r) => assets.canonical(r.url)));
    let done = 0,
      cursor = 0;
    remaining = [];
    const pending = [];
    for (const url of files) {
      const hash = assets.hashFor(url, manifest);
      if (hash ? keys.has(assets.blobKey(hash)) : localKeys.has(assets.canonical(url))) done++;
      else pending.push(url);
    }
    set({ done, reused: done });
    await Promise.all(
      Array.from({ length: 3 }, async () => {
        while (cursor < pending.length) {
          const url = pending[cursor++];
          if (
            await assets.match(url, manifest, cache, {
              sharedKnown: false,
              localKnown: localKeys.has(assets.canonical(url)),
            })
          ) {
            done++;
            set({ done, reused: done });
          } else remaining.push(url);
        }
      }),
    );
    set({
      done,
      reused: done,
      phase: done === files.length ? "complete" : hadIntent ? "paused" : "idle",
      wanted: done === files.length ? false : hadIntent,
    });
    await persist();
    return { ...state };
  }
  async function run() {
    await ready();
    await workerReady();
    if (state.phase === "complete") return { ...state };
    const work = async (lock) => {
      if (locks && !lock) {
        set({ phase: "elsewhere" });
        clearTimeout(otherTimer);
        otherTimer = setTimeout(async () => {
          if (!disposed && !runPromise) {
            readyPromise = null;
            try {
              await ready();
              if (state.wanted) start();
            } catch {}
          }
        }, 1500);
        return { ...state };
      }
      controller = new AbortController();
      set({ phase: "running", wanted: true, requested: true, error: null, downloaded: 0 });
      try {
        state.persistent = (await globalThis.navigator?.storage?.persist?.()) ?? false;
      } catch {
        state.persistent = false;
      }
      await persist();
      let cursor = 0,
        failure,
        stopped = false;
      const workFiles = [...remaining];
      const worker = async () => {
        while (cursor < workFiles.length && !stopped) {
          const url = workFiles[cursor++];
          if (controller.signal.aborted) break;
          try {
            if (await assets.match(url, manifest, cache)) continue;
            for (let attempt = 0; attempt < 3; attempt++) {
              try {
                await withDeadline(async (signal) => {
                  const response = await fetcher(assets.absolute(url), {
                    signal,
                    cache: "no-store",
                  });
                  if (!response.ok) throw Error("HTTP " + response.status);
                  await assets.put(url, response, manifest, cache);
                }, controller.signal);
                break;
              } catch (e) {
                if (controller.signal.aborted || attempt === 2) throw e;
              }
            }
            set({ done: state.done + 1, downloaded: state.downloaded + 1 });
            if (state.downloaded % 16 === 0) await persist();
          } catch (e) {
            failure = e;
            stopped = true;
            controller.abort();
          }
        }
      };
      await Promise.all(Array.from({ length: 3 }, worker));
      if (failure) {
        set({ phase: "paused", error: failure.message });
        await persist();
        return { ...state };
      }
      if (controller.signal.aborted) {
        set({ phase: "paused" });
        await persist();
        return { ...state };
      }
      const sharedKeys = new Set(
          (await (await storage.open(assets.SHARED)).keys()).map((r) => r.url),
        ),
        localKeys = new Set((await cache.keys()).map((r) => assets.canonical(r.url)));
      let done = 0;
      for (const url of files) {
        const hash = assets.hashFor(url, manifest);
        if (hash ? sharedKeys.has(assets.blobKey(hash)) : localKeys.has(assets.canonical(url)))
          done++;
      }
      set({
        done,
        phase: done === files.length ? "complete" : "paused",
        wanted: done !== files.length,
      });
      await persist();
      return { ...state };
    };
    return locks
      ? locks.request("backmir-offline-download:" + scope, { ifAvailable: true }, work)
      : work(true);
  }
  function ready() {
    if (!readyPromise) {
      initializing = true;
      readyPromise = restore()
        .catch((e) => {
          readyPromise = null;
          set({ phase: "error", error: e.message });
          throw e;
        })
        .finally(() => {
          initializing = false;
        });
    }
    return readyPromise;
  }
  function start() {
    if (runPromise) return runPromise;
    return (runPromise = run().finally(() => {
      runPromise = null;
    }));
  }
  async function pause() {
    hadIntent = false;
    set({ wanted: false });
    controller?.abort();
    await ready();
    await persist();
  }
  function subscribe(fn) {
    listeners.add(fn);
    fn({ ...state });
    return () => listeners.delete(fn);
  }
  return {
    ready,
    start,
    pause,
    subscribe,
    refresh() {
      if (!runPromise && !initializing) readyPromise = null;
      return ready();
    },
    snapshot: () => ({ ...state }),
    resume: async () => {
      await ready();
      if (state.wanted && online()) return start();
    },
    dispose() {
      disposed = true;
      clearTimeout(otherTimer);
      listeners.clear();
      controller?.abort();
    },
  };
}
var tasks = /* @__PURE__ */ new Map();
function offlineDownloadTask({
  languageManifest,
  locale,
  selectFiles,
  manifestURL = new URL("./offline-manifest.json", document.baseURI).href,
} = {}) {
  const key = manifestURL + "|" + locale;
  if (!tasks.has(key)) {
    const select = (m) => selectFiles(m, languageManifest, locale);
    select.locale = locale;
    tasks.set(key, createOfflineDownloadTask({ manifestURL, selectFiles: select }));
  }
  return tasks.get(key);
}
function bindOfflineDownload({ button, progress, task, t }) {
  const render = (s) => {
    if (!button.isConnected) return;
    button.disabled = s.phase === "checking" || s.phase === "elsewhere";
    button.textContent = t(
      s.phase === "running"
        ? "system.offlinePause"
        : s.phase === "complete"
          ? "system.offlineComplete"
          : s.phase === "paused"
            ? "system.offlineResume"
            : "system.offline",
    );
    progress.textContent = t(
      "system.offlineState" +
        {
          checking: "Checking",
          running: "Running",
          complete: "Complete",
          paused: "Paused",
          elsewhere: "Elsewhere",
          error: "Error",
          idle: "Ready",
        }[s.phase],
      {
        done: s.done,
        total: s.total,
        reused: s.reused,
        downloaded: s.downloaded,
        error: s.error || "",
      },
    );
  };
  const unsubscribe = task.subscribe(render),
    observer = new MutationObserver(() => {
      if (!button.isConnected) {
        unsubscribe();
        observer.disconnect();
      }
    });
  observer.observe(document.body, { childList: true, subtree: true });
  button.onclick = () => {
    (task.snapshot().phase === "running"
      ? task.pause()
      : task.snapshot().phase === "complete"
        ? task.refresh().then(() => task.start())
        : task.start()
    ).catch(() => {});
  };
  task.refresh().catch(() => {});
  return unsubscribe;
}
export {
  bindOfflineDownload,
  createOfflineDownloadTask,
  downloadOfflineFiles,
  offlineDownloadTask,
};

