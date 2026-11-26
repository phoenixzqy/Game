import {
  progressFingerprint,
  roleProgress,
  cloudRoleKey,
  cloudBaseline,
  semanticSnapshot,
} from "./save-sync.mjs";
export { progressFingerprint, roleProgress, cloudRoleKey, cloudBaseline };
// Acknowledgement always belongs to the exact prepared snapshot, never to later
// gameplay. Durable baselines are committed by the worker before showing success.
export class AutoCloudUploader {
  constructor({
    client,
    prepare,
    reconcile,
    storage = globalThis.localStorage,
    now = () => Date.now(),
    online = () => globalThis.navigator?.onLine !== false,
    blocked = () => false,
    onStatus = () => {},
    interval = 300000,
    minGap = 60000,
    debounce = 10000,
  }) {
    Object.assign(this, {
      client,
      prepare,
      reconcile,
      storage,
      now,
      online,
      blocked,
      onStatus,
      interval,
      minGap,
      debounce,
    });
    this.user = null;
    this.generation = 0;
    this.pending = null;
    this.manual = 0;
    this.lastAttempt = -Infinity;
    this.lastUpload = -Infinity;
    this.nextAt = Infinity;
    this.signature = null;
    this.observed = null;
    this.roles = 0;
    this.hold = null;
    this.status = { code: "guest", at: 0 };
  }
  enabled(user = this.user) {
    if (!user) return false;
    try {
      return this.storage.getItem("backmir-classic-hell-auto-cloud-v1:" + user) !== "off";
    } catch {
      return true;
    }
  }
  emit(code, at = 0, reason = null) {
    this.status = { code, at, reason };
    this.onStatus(this.status);
  }
  setUser(user) {
    if (user === this.user) return;
    this.user = user;
    this.generation++;
    if (this.reconcile) this.lastAttempt = -Infinity;
    this.lastUpload = -Infinity;
    this.signature = null;
    this.hold = null;
    this.observed = null;
    this.nextAt = this.now() + (this.reconcile ? 0 : this.debounce);
    this.emit(!user ? "guest" : this.enabled() ? "waiting" : "off");
  }
  setEnabled(enabled) {
    if (!this.user) return;
    this.storage.setItem("backmir-classic-hell-auto-cloud-v1:" + this.user, enabled ? "on" : "off");
    this.generation++;
    this.hold = null;
    this.nextAt = this.now() + this.debounce;
    this.emit(enabled ? "waiting" : "off");
  }
  observe(s) {
    this.roles = s?.roles?.length || 0;
    const next = s
        ? {
            stage: s.stage,
            id: s.me?.cloudId || s.me?.id,
            level: s.me?.level,
            map: s.me?.map,
            count: this.roles,
            seq: s.sync?.progressSeq,
          }
        : null,
      old = this.observed;
    this.observed = next;
    if (!next) return;
    if (
      old &&
      ((old.stage === "Game" && next.stage === "Select") ||
        next.count !== old.count ||
        next.seq !== old.seq ||
        (old.id === next.id && (next.level > old.level || next.map !== old.map)))
    )
      this.request();
    if (this.reconcile && next.stage === "Select" && old?.stage !== "Select")
      queueMicrotask(() => this.syncNow());
  }
  request(delay = this.debounce) {
    this.nextAt = Math.min(this.nextAt, this.now() + delay);
  }
  valid(user, generation) {
    return this.user === user && this.generation === generation && this.enabled(user);
  }
  // Downloading is a confirmed read; rolling back is an unconfirmed local change.
  acknowledge(user, saveJson, { kind = "downloaded", at = 0 } = {}) {
    if (user !== this.user) return;
    if (saveJson) this.client.rememberProgress?.(user, saveJson);
    this.hold = null;
    this.signature = saveJson ? progressFingerprint(saveJson) : null;
    this.nextAt = this.now() + (kind === "rollback" ? 0 : this.interval);
    this.emit(this.enabled() ? (kind === "rollback" ? "waiting" : kind) : "off", at);
  }
  async exclusive(action) {
    this.manual++;
    try {
      if (this.pending) await this.pending;
      return await action();
    } finally {
      this.manual--;
    }
  }
  async syncNow({ flush = false } = {}) {
    if (this.pending) await this.pending;
    if (["firstLoad", "conflict", "guestBinding"].includes(this.hold)) this.hold = null;
    return this.tick({ force: true, flush });
  }
  async flush() {
    await this.syncNow({ flush: true });
    return ["uploaded", "unchanged", "downloaded"].includes(this.status.code);
  }
  tick({ force = false, flush = false } = {}) {
    if (
      this.pending ||
      this.manual ||
      this.blocked() ||
      !this.user ||
      (!this.roles && !this.reconcile) ||
      !this.enabled() ||
      this.hold
    )
      return this.pending;
    if (!this.online()) {
      this.emit("offline");
      return;
    }
    if (!force && (this.now() < this.nextAt || this.now() - this.lastAttempt < this.minGap)) return;
    const owner = this.user,
      generation = this.generation;
    this.lastAttempt = this.now();
    this.nextAt = this.now() + this.interval;
    this.pending = this.upload(owner, generation, { flush }).finally(() => {
      this.pending = null;
    });
    return this.pending;
  }
  async upload(owner, generation, { flush = false } = {}) {
    this.emit("uploading");
    try {
      // Retry an uncertain response with its original request ID before comparing
      // against a head which may already contain that very same upload.
      if (this.client.resumePending) {
        await this.client.resumePending(owner);
        if (!this.valid(owner, generation) || this.manual) return;
      }
      if (this.reconcile) {
        await this.reconcile(owner, () => this.valid(owner, generation) && !this.manual);
        if (!this.valid(owner, generation) || this.manual) return;
      }
      const listing = await this.client.list(owner);
      if (!this.valid(owner, generation) || this.manual) return;
      const base = this.client.base(owner),
        head = listing.headRevision;
      if (base === null && head > 0) throw Error("firstLoad");
      if (base !== null && base !== head) throw Error("conflict");
      // A last-character deletion is a real progress update. A never-played empty
      // device cannot upload an empty snapshot and clear somebody else's cloud.
      if (!this.roles && !this.reconcile) {
        this.emit("waiting");
        return;
      }
      const { saveJson } = await this.prepare();
      if (!this.valid(owner, generation) || this.manual) return;
      const prepared = JSON.parse(saveJson).snapshot;
      if (
        !prepared.roles.length &&
        !prepared.sharedStorage?.some(Boolean) &&
        !Object.keys(prepared.sync?.tombstones || {}).length
      ) {
        this.emit("waiting");
        return;
      }
      const signature = progressFingerprint(saveJson);
      if (this.signature === null && head > 0) {
        const remote = await this.client.read(owner, head);
        if (!this.valid(owner, generation) || this.manual) return;
        this.signature = progressFingerprint(remote.save.saveJson);
      }
      if (signature === this.signature) {
        this.emit(
          "unchanged",
          listing.versions?.[0]?.createdAt || prepared.sync?.serverConfirmedAt || 0,
        );
        return;
      }
      if (!flush && this.now() - this.lastUpload < this.minGap) {
        this.nextAt = Math.min(this.nextAt, this.lastUpload + this.minGap);
        this.emit("waiting");
        return;
      }
      if (!this.online()) throw Error("offline");
      this.lastUpload = this.now();
      const result = await this.client.upload(owner, saveJson, head);
      if (!this.valid(owner, generation)) return;
      this.signature = signature;
      const current = await this.prepare();
      if (!this.valid(owner, generation)) return;
      if (progressFingerprint(current.saveJson) !== signature) {
        this.nextAt = this.now() + this.debounce;
        this.emit("waiting");
      } else this.emit("uploaded", result?.createdAt || 0);
    } catch (error) {
      if (!this.valid(owner, generation)) return;
      const code =
        error.name === "TimeoutError"
          ? "timeout"
          : error.name === "QuotaExceededError" ||
              (typeof error.code === "string" && error.code.endsWith(".quota"))
            ? "storage"
            : error.message === "missing"
              ? "conflict"
              : error.message;
      if (code === "pendingSelection") {
        this.emit(code);
        return;
      }
      if (
        [
          "firstLoad",
          "conflict",
          "guestBinding",
          "accountChanged",
          "auth",
          "invalid",
          "size",
          "mergeFull",
          "upgradeRequired",
          "storage",
        ].includes(code)
      )
        this.hold = code;
      else this.nextAt = this.now() + this.minGap;
      this.emit(this.hold || (!this.online() ? "offline" : "retry"), 0, code);
    } finally {
      if (this.valid(owner, generation) && this.status.code === "uploading") {
        this.nextAt = Math.min(this.nextAt, this.now() + this.minGap);
        this.emit("waiting");
      }
    }
  }
}

// Legacy API retained for old exports/tests; protocol-2 orchestration exclusively
// uses planSaveSync with stable IDs, tombstones and explicit ancestor presence.
export function planCloudSync(local, remote, baseline = {}) {
  const roleIds = [],
    replacements = {};
  let conflict = false;
  for (const incoming of remote) {
    const matches = local.filter((r) =>
        r.cloudId && incoming.cloudId
          ? r.cloudId === incoming.cloudId
          : r.name.trim().normalize("NFKC").toLocaleLowerCase() ===
            incoming.name.trim().normalize("NFKC").toLocaleLowerCase(),
      ),
      current = matches[0];
    if (!current) {
      const old = baseline[cloudRoleKey(incoming)];
      if (old && old !== roleProgress(incoming)) conflict = true;
      else if (!old) roleIds.push(incoming.id);
      continue;
    }
    if (matches.length !== 1 || current.job !== incoming.job) {
      conflict = true;
      continue;
    }
    if (roleProgress(current) === roleProgress(incoming)) continue;
    const old = baseline[cloudRoleKey(current)];
    if (old === roleProgress(current)) {
      roleIds.push(incoming.id);
      replacements[incoming.id] = current.id;
    } else if (old !== roleProgress(incoming)) conflict = true;
  }
  if (local.length + roleIds.length - Object.keys(replacements).length > 6)
    throw Error("mergeFull");
  return { roleIds, replacements, conflict };
}

