// Repair the first-visit gap: resources loaded before SW control are not in its
// version cache. Call only after the core has actually been used (context/Game).
// All writes remain with the existing SW and the page's existing cache pin.
export function createPlayedResourceWarmer({
  corePath,
  serviceWorker = globalThis.navigator?.serviceWorker,
  fetcher = globalThis.fetch?.bind(globalThis),
  performance = globalThis.performance,
  origin = globalThis.location?.origin,
  getResources = () => [],
  online = () => globalThis.navigator?.onLine !== false,
  now = () => Date.now(),
  controllerTimeoutMs = 8000,
  requestTimeoutMs = 10000,
  retryMs = 5000,
  concurrency = 4,
  setTimer = globalThis.setTimeout,
  clearTimer = globalThis.clearTimeout,
} = {}) {
  let pending = null,
    lastAttempt = -Infinity,
    lastFailure = null;
  const successful = new Set();
  const state = { lastResult: null, attempts: 0 };
  let base;
  try {
    base = new URL(origin).origin;
  } catch {}
  const absolute = (value) => {
    try {
      const u = new URL(value, base + "/");
      return u.origin === base && !u.username && !u.password ? u : null;
    } catch {
      return null;
    }
  };
  const core = absolute(corePath),
    validCore = core && /^\/game-runtime\/core\.[a-f0-9]{16,64}\.js$/.test(core.pathname);
  const resource = (value) => {
    const u = typeof value === "string" ? absolute(value) : null;
    if (!u) return null;
    const p = u.pathname;
    const allowed =
      (validCore && p === core.pathname) ||
      p === "/Game/data/rules.json" ||
      /^\/data\/maps\/\d+\/(?:info|\d+-\d+)\.json$/.test(p) ||
      /^\/cache\/sheets\/[A-Za-z0-9_-]+\/\d+\.(?:json|png|webp)$/.test(p) ||
      /^\/catalog\/(?:items|skills|maps|npcs|growth|quests|monsters|audit)\.json$/.test(p) ||
      /^\/assets\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]+\.(?:json|png|webp|jpg|jpeg|gif|svg)$/.test(p);
    // Static paths do not use account/query payloads. Canonicalize the path only.
    return allowed ? base + p : null;
  };
  function waitForControl() {
    return new Promise((resolve) => {
      let finished = false,
        ready = false,
        timer;
      const finish = (reason) => {
        if (finished) return;
        finished = true;
        clearTimer(timer);
        serviceWorker?.removeEventListener?.("controllerchange", check);
        resolve(reason);
      };
      const check = () => {
        if (ready && serviceWorker?.controller) finish(null);
      };
      timer = setTimer(() => finish("controller-timeout"), controllerTimeoutMs);
      serviceWorker?.addEventListener?.("controllerchange", check);
      Promise.resolve(serviceWorker?.ready).then(
        () => {
          ready = true;
          check();
        },
        () => finish("service-worker-ready"),
      );
      check();
    });
  }
  const result = (value) => {
    state.lastResult = value;
    return value;
  };
  async function resources() {
    const seen = performance?.getEntriesByType?.("resource") || [],
      extra = await getResources();
    return [
      ...new Set(
        [
          core.href,
          base + "/Game/data/rules.json",
          ...seen.map((v) => v.name),
          ...(Array.isArray(extra) ? extra : []),
        ]
          .map(resource)
          .filter(Boolean),
      ),
    ];
  }
  async function attempt() {
    state.attempts++;
    lastAttempt = now();
    try {
      const reason = await waitForControl();
      if (reason) return result({ ok: false, reason, attempt: state.attempts });
      if (!online()) return result({ ok: false, reason: "offline", attempt: state.attempts });
      // Collect after control arrives: meanwhile the player may have entered Game.
      const all = await resources(),
        urls = all.filter((url) => !successful.has(url));
      const failed = [];
      let cursor = 0;
      await Promise.all(
        Array.from({ length: Math.min(Math.max(1, concurrency), urls.length) }, async () => {
          while (cursor < urls.length) {
            const url = urls[cursor++],
              controller = new AbortController(),
              timer = setTimer(() => controller.abort(), requestTimeoutMs);
            try {
              // Reload bypasses a pre-control HTTP memory hit. The controlling SW still
              // serves its own cache hits and awaits cache.put before returning misses.
              const response = await fetcher(url, {
                method: "GET",
                mode: "same-origin",
                credentials: "same-origin",
                cache: "reload",
                redirect: "error",
                signal: controller.signal,
              });
              if (!response?.ok) throw Error("resource");
              await response.arrayBuffer?.();
              successful.add(url);
            } catch {
              failed.push(url);
            } finally {
              clearTimer(timer);
            }
          }
        }),
      );
      return result({
        ok: failed.length === 0,
        reason: failed.length ? "resources" : "ready",
        attempt: state.attempts,
        resources: all,
        fetched: urls,
        failed,
      });
    } catch {
      return result({ ok: false, reason: "unavailable", attempt: state.attempts });
    }
  }
  function warm() {
    if (pending) return pending;
    if (!base || !validCore || !fetcher)
      return Promise.resolve(result({ ok: false, reason: "configuration" }));
    if (!serviceWorker)
      return Promise.resolve(result({ ok: false, reason: "service-worker-unavailable" }));
    pending = (async () => {
      try {
        const all = await resources();
        if (all.every((url) => successful.has(url)))
          return result({
            ok: true,
            reason: "ready",
            attempt: state.attempts,
            resources: all,
            fetched: [],
            failed: [],
          });
        if (!online()) return result({ ok: false, reason: "offline" });
        if (now() - lastAttempt < retryMs && lastFailure)
          return result({
            ok: false,
            reason: "retry-wait",
            retryAt: lastAttempt + retryMs,
            lastFailure,
          });
        const value = await attempt();
        lastFailure = value.ok ? null : value.reason;
        return value;
      } catch {
        return result({ ok: false, reason: "unavailable" });
      }
    })().finally(() => {
      pending = null;
    });
    return pending;
  }
  warm.state = state;
  return warm;
}

// Accepted-state observer: retain every map actually entered, including a quick
// A → B → A while an earlier request is pending. No work starts at construction.
export function createPlayedResourceObserver({
  createWarmer,
  warmer,
  getState = () => null,
  startMap,
  online = () => globalThis.navigator?.onLine !== false,
  now = () => Date.now(),
  setTimer = globalThis.setTimeout,
  clearTimer = globalThis.clearTimeout,
  retryMs = 5000,
  onAttempt = () => {},
  onResult = () => {},
} = {}) {
  const maps = new Set(),
    retryDelay = Math.max(5000, Number(retryMs) || 5000);
  let generation = 0,
    completed = -1,
    pending = null,
    lastPromise = null,
    lastResult = null,
    retryAt = 0,
    retryTimer = null,
    disposed = false;
  const getResources = () => [...maps].map((id) => "/Game/data/maps/" + id + "/info.json");
  const warm = typeof createWarmer === "function" ? createWarmer(getResources) : warmer;
  const cancelRetry = () => {
    if (retryTimer !== null) {
      clearTimer(retryTimer);
      retryTimer = null;
    }
  };
  const notify = (fn, value) => {
    try {
      fn(value);
    } catch {}
  };
  function scheduleRetry() {
    if (disposed || retryTimer !== null || !online()) return;
    const delay = Math.max(retryDelay, retryAt - now());
    retryTimer = setTimer(() => {
      retryTimer = null;
      observe();
    }, delay);
  }
  function observe({ force = false } = {}) {
    if (disposed) return lastPromise || Promise.resolve({ ok: false, reason: "disposed" });
    const state = getState();
    if (state?.stage === "Game")
      for (const id of [startMap, state.me?.map])
        if (Number.isInteger(id) && id >= 0 && !maps.has(id)) {
          maps.add(id);
          generation++;
        }
    if (pending) return pending.promise;
    if (completed >= generation && !force) return lastPromise;
    if (!online()) {
      cancelRetry();
      lastResult = { ok: false, reason: "offline" };
      lastPromise = Promise.resolve(lastResult);
      notify(onResult, lastResult);
      return lastPromise;
    }
    if (!force && lastResult && !lastResult.ok && now() < retryAt) {
      scheduleRetry();
      return lastPromise;
    }
    cancelRetry();
    const current = generation;
    const task = Promise.resolve()
      .then(() => (typeof warm === "function" ? warm() : { ok: false, reason: "configuration" }))
      .catch(() => ({ ok: false, reason: "unavailable" }))
      .then((value) => {
        lastResult =
          value && typeof value.ok === "boolean" ? value : { ok: false, reason: "unavailable" };
        if (lastResult.ok) {
          completed = Math.max(completed, current);
          retryAt = 0;
        } else retryAt = Math.max(now() + retryDelay, Number(lastResult.retryAt) || 0);
        notify(onResult, lastResult);
        return lastResult;
      })
      .finally(() => {
        pending = null;
        if (disposed) return;
        if (lastResult?.ok) {
          if (generation > completed) observe();
        } else scheduleRetry();
      });
    pending = { promise: task, generation: current };
    lastPromise = task;
    notify(onAttempt, task);
    return task;
  }
  observe.observe = observe;
  observe.getResources = getResources;
  observe.dispose = () => {
    disposed = true;
    cancelRetry();
  };
  Object.defineProperties(observe, {
    lastPromise: { get: () => lastPromise },
    lastResult: { get: () => lastResult },
    visitedMaps: { get: () => new Set(maps) },
  });
  return observe;
}

