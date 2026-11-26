import {
  planSaveSync,
  progressFingerprint,
  semanticSnapshot,
  snapshotOf,
  encodeSnapshot,
  ensureCharacterIds,
  freshSync,
  cloudRoleKey,
  legacyCharacterId,
} from "./save-sync.mjs";
export function deviceIdentity(storage = globalThis.localStorage) {
  const key = "backmir-classic-hell-save-device-v2";
  let value;
  try {
    value = JSON.parse(storage.getItem(key));
  } catch {}
  if (!value?.deviceId || !value?.deviceName) {
    value = {
      deviceId: crypto.randomUUID(),
      deviceName: "Device " + crypto.randomUUID().slice(0, 4),
    };
    try {
      storage.setItem(key, JSON.stringify(value));
    } catch {
      /* Existing local games remain playable when device preferences cannot be saved. */
    }
  }
  return value;
}
export class GameSaveSync {
  constructor({
    api,
    accept,
    session,
    client,
    device = deviceIdentity(),
    storage = globalThis.localStorage,
    build = () => "",
    onChange = () => {},
    autoBindGuest = false,
  }) {
    Object.assign(this, {
      api,
      accept,
      session,
      client,
      device,
      storage,
      build,
      onChange,
      autoBindGuest,
    });
    this.owner = undefined;
    this.contextOwner = undefined;
    this.generation = 0;
    this.contextTask = null;
    this.lastView = null;
    this.auto = null;
  }
  rememberLocalOwner(owner) {
    // This is only a local partition hint, never cloud authority. A member hint
    // follows the worker's selected partition rather than a deferred sign-in.
    try {
      this.storage.setItem(
        "backmir-classic-hell-last-local-owner-v2",
        JSON.stringify({ ownerId: owner }),
      );
    } catch {}
  }
  setAccount(owner) {
    // Explicit sign-out clears the previous account hint immediately, including
    // while an active character defers the worker's switch back to the guest.
    if (owner === null) this.rememberLocalOwner(null);
    this.unverified = false;
    if (owner === this.owner) return;
    this.owner = owner;
    this.generation++;
    this.lastView = null;
    this.binding = null;
  }
  restoreLocalOwner() {
    if (this.owner !== undefined) return this.owner;
    let owner = null;
    try {
      const value = JSON.parse(this.storage.getItem("backmir-classic-hell-last-local-owner-v2"));
      if (
        typeof value?.ownerId === "string" &&
        value.ownerId.length > 0 &&
        value.ownerId.length <= 200 &&
        !/[\x00-\x1f]/.test(value.ownerId)
      )
        owner = value.ownerId;
    } catch {}
    this.owner = owner;
    this.unverified = true;
    this.generation++;
    return owner;
  }
  valid(owner, generation = this.generation) {
    return this.owner === owner && this.generation === generation;
  }
  async context(owner = this.owner, { force = false } = {}) {
    const generation = this.generation;
    if (owner === undefined) throw Error("accountChanged");
    if (!this.valid(owner, generation)) throw Error("accountChanged");
    // An in-flight switch can already have changed the worker partition even
    // before its acknowledgement arrives. Never trust the previous cached owner.
    while (this.contextTask) {
      try {
        await this.contextTask;
      } catch (error) {
        if (!this.valid(owner, generation) || error?.message !== "accountChanged") throw error;
      }
      if (!this.valid(owner, generation)) throw Error("accountChanged");
    }
    if (this.contextOwner === owner && !force) {
      this.rememberLocalOwner(owner);
      return;
    }
    this.contextOwner = undefined;
    const task = (async () => {
      const result = await this.api("cloud/context", { ownerId: owner, ...this.device });
      if (!this.valid(owner, generation)) throw Error("accountChanged");
      this.contextOwner = owner;
      this.rememberLocalOwner(owner);
      await this.accept(result);
      if (!this.valid(owner, generation)) throw Error("accountChanged");
      this.client.hydrate(owner, result.sync);
      this.onChange();
    })();
    this.contextTask = task;
    try {
      await task;
    } finally {
      if (this.contextTask === task) this.contextTask = null;
    }
  }
  async local(owner = this.owner) {
    await this.context(owner);
    const value = await this.api("cloud/local", { build: this.build() });
    if (value.sync?.ownerId !== owner || owner !== this.owner) throw Error("accountChanged");
    this.client.hydrate(owner, value.sync);
    return value;
  }
  async commit(owner, meta, generation = this.generation) {
    if (!this.valid(owner, generation)) throw Error("accountChanged");
    await this.api("cloud/commit", { ownerId: owner, ...meta });
    if (!this.valid(owner, generation)) throw Error("accountChanged");
    this.client.remember(owner, meta.baseRevision);
  }
  async head(owner) {
    const listing = await this.client.list(owner);
    if (owner !== this.owner) throw Error("accountChanged");
    return listing;
  }
  async remote(owner, listing) {
    if (!listing.headRevision) return null;
    const remote = await this.client.read(owner, listing.headRevision);
    if (owner !== this.owner) throw Error("accountChanged");
    if (remote.headRevision !== listing.headRevision) throw Error("conflict");
    return remote.save;
  }
  async checkOwner(owner) {
    const session = await this.session.refresh();
    if (owner !== this.owner || session.user?.id !== owner) throw Error("accountChanged");
  }
  async reconcile(owner, valid = () => true) {
    const generation = this.generation;
    const local = await this.local(owner);
    if (!valid()) return;
    const listing = await this.head(owner);
    if (!valid()) return;
    if (!listing.headRevision) {
      if (local.sync?.baseRevision > 0) throw Error("conflict");
      if (await this.autoBind({ owner, generation, local, listing, remote: null }, valid)) return;
      if (
        !local.roles.length &&
        !snapshotOf(local.saveJson).sharedStorage?.some(Boolean) &&
        local.guestAvailable
      )
        throw Error("guestBinding");
      if (local.sync?.baseRevision !== 0)
        await this.commit(owner, { baseRevision: 0, baseRoles: {}, serverConfirmedAt: null });
      if (this.auto) this.auto.signature = null;
      return;
    }
    const remote = await this.remote(owner, listing);
    if (!valid()) return;
    const plan = planSaveSync(local.saveJson, remote.saveJson, { ownerId: owner });
    if (plan.conflict)
      throw Error(plan.conflicts.every((c) => c.reason === "firstLoad") ? "firstLoad" : "conflict");
    const meta = {
      baseRevision: listing.headRevision,
      baseRoles: plan.baseRoles,
      serverConfirmedAt: remote.createdAt,
    };
    if (plan.changedLocal) {
      if (local.stage !== "Select") throw Error("pendingSelection");
      await this.checkOwner(owner);
      if (!valid()) return;
      if ((await this.head(owner)).headRevision !== listing.headRevision) throw Error("conflict");
      if (!valid()) return;
      const result = await this.api("cloud/apply", {
        ownerId: owner,
        saveJson: encodeSnapshot(local.saveJson, plan.snapshot),
        remoteSaveJson: remote.saveJson,
        expectedRoles: JSON.stringify(local.roles),
        expectedProgress: progressFingerprint(local.saveJson),
        ...meta,
      });
      if (!valid() || owner !== this.owner) return;
      await this.accept(result);
      if (!valid()) return;
    } else if (
      local.sync?.baseRevision !== meta.baseRevision ||
      JSON.stringify(local.sync?.baseRoles) !== JSON.stringify(meta.baseRoles) ||
      local.sync?.serverConfirmedAt !== meta.serverConfirmedAt
    )
      await this.commit(owner, meta);
    if (!valid()) return;
    if (
      await this.autoBind(
        {
          owner,
          generation,
          local: plan.changedLocal ? await this.local(owner) : local,
          listing,
          remote,
        },
        valid,
      )
    )
      return;
    this.client.remember(owner, meta.baseRevision);
    this.client.rememberProgress(owner, encodeSnapshot(local.saveJson, plan.remote));
    if (this.auto)
      this.auto.signature =
        snapshotOf(remote.saveJson).sync?.protocol === 2
          ? progressFingerprint(plan.remote)
          : "protocol-upgrade-needed";
  }
  async view() {
    const owner = this.owner,
      local = await this.local(owner);
    if (!owner) {
      return (this.lastView = {
        owner: null,
        localRoles: local.roles,
        remoteRoles: [],
        localSync: local.sync,
        headRevision: 0,
        confirmedAt: 0,
        deviceName: this.device.deviceName,
        enabled: false,
        guestAvailable: false,
        conflicts: [],
        recoveries: [],
        stage: local.stage,
      });
    }
    if (this.unverified)
      return {
        owner: null,
        localRoles: local.roles,
        remoteRoles: [],
        localSync: local.sync,
        headRevision: local.sync?.baseRevision || 0,
        confirmedAt: local.sync?.serverConfirmedAt || 0,
        deviceName: this.device.deviceName,
        enabled: false,
        guestAvailable: false,
        conflicts: [],
        recoveries: [],
        stage: local.stage,
        cloudUnavailable: true,
      };
    let listing, remote;
    try {
      listing = await this.head(owner);
      remote = await this.remote(owner, listing);
    } catch (error) {
      if (owner !== this.owner) throw Error("accountChanged");
      const code =
        globalThis.navigator?.onLine === false
          ? "offline"
          : error.message === "auth"
            ? "auth"
            : "retry";
      if (this.auto && this.auto.status.code !== code) this.auto.emit(code, 0, error.message);
      // Offline diagnostics and export remain available; a failed check must never
      // masquerade as an empty cloud account or a confirmed successful download.
      return {
        owner: this.session.state.user,
        localRoles: local.roles,
        remoteRoles: [],
        localSync: local.sync,
        headRevision: local.sync?.baseRevision || 0,
        confirmedAt: local.sync?.serverConfirmedAt || 0,
        deviceName: this.device.deviceName,
        enabled: this.auto?.enabled(owner),
        guestAvailable: local.guestAvailable,
        conflicts: [],
        recoveries: [],
        stage: local.stage,
        cloudUnavailable: true,
      };
    }
    const plan = remote ? planSaveSync(local.saveJson, remote.saveJson, { ownerId: owner }) : null;
    const conflicts =
      plan?.conflicts.map((c) => ({
        ...c,
        localDeviceName: this.device.deviceName,
        cloudDeviceName: remote.deviceName || snapshotOf(remote.saveJson).sync?.deviceName,
      })) || [];
    const binding = this.binding;
    if (
      binding &&
      (binding.values.owner !== owner ||
        binding.values.listing.headRevision !== listing.headRevision)
    ) {
      this.binding = null;
      throw Error("conflict");
    }
    return (this.lastView = {
      owner: this.session.state.user,
      localRoles: binding ? binding.plan.local.roles : local.roles,
      remoteRoles: binding ? binding.plan.remote.roles : plan?.remote.roles || [],
      localSync: local.sync,
      headRevision: listing.headRevision,
      confirmedAt: remote?.createdAt || 0,
      deviceName: this.device.deviceName,
      remoteDeviceName: remote?.deviceName,
      enabled: this.auto?.enabled(owner),
      guestAvailable: !binding && local.guestAvailable,
      conflicts: binding
        ? binding.plan.conflicts.map((c) => ({
            ...c,
            localDeviceName: this.device.deviceName,
            cloudDeviceName: remote?.deviceName,
          }))
        : conflicts,
      recoveries: listing.recoveries || [],
      stage: local.stage,
      remoteSave: remote,
      localSave: local,
    });
  }
  async freshManual() {
    const owner = this.owner,
      generation = this.generation;
    if (!owner) throw Error("auth");
    await this.checkOwner(owner);
    if (!this.valid(owner, generation)) throw Error("accountChanged");
    const local = await this.local(owner);
    if (!this.valid(owner, generation)) throw Error("accountChanged");
    if (local.stage !== "Select") throw Error("pendingSelection");
    const listing = await this.head(owner);
    if (
      this.lastView &&
      this.lastView.owner?.id === owner &&
      listing.headRevision !== this.lastView.headRevision
    )
      throw Error("conflict");
    const remote = await this.remote(owner, listing);
    if (!this.valid(owner, generation)) throw Error("accountChanged");
    return { owner, generation, local, listing, remote };
  }
  async applyManual(
    { owner, generation = this.generation, local, listing, remote },
    snapshot,
    {
      kind = "choice",
      bind = false,
      forceUpload = false,
      protectionSaveJson,
      valid = () => true,
    } = {},
  ) {
    const guard = () => {
      if (!this.valid(owner, generation) || !valid()) throw Error("accountChanged");
    };
    guard();
    // Backup must succeed before applying a local replacement. Protection is also
    // rechecked by the CAS upload, and ordinary automatic saves leave it pinned.
    const protection = await this.client.protect(
      owner,
      protectionSaveJson || local.saveJson,
      listing.headRevision,
    );
    guard();
    await this.checkOwner(owner);
    guard();
    if ((await this.head(owner)).headRevision !== listing.headRevision) throw Error("conflict");
    guard();
    const baseRoles = remote
      ? semanticSnapshot(ensureCharacterIds(structuredClone(snapshotOf(remote.saveJson)), owner))
      : {};
    const meta = {
      baseRevision: listing.headRevision,
      baseRoles,
      serverConfirmedAt: remote?.createdAt || null,
    };
    snapshot.sync = {
      ...local.sync,
      ...snapshot.sync,
      ownerId: owner,
      protocol: 2,
      projectionVersion: 2,
      ...(kind === "downloaded" && snapshot.sync?.deviceId
        ? {}
        : { deviceId: this.device.deviceId, deviceName: this.device.deviceName }),
      ...meta,
    };
    const saveJson = encodeSnapshot(local.saveJson, snapshot);
    const result = await this.api(bind ? "cloud/bind" : "cloud/apply", {
      ownerId: owner,
      saveJson,
      remoteSaveJson: remote?.saveJson || local.saveJson,
      expectedRoles: JSON.stringify(local.roles),
      expectedProgress: progressFingerprint(local.saveJson),
      manual: true,
      ...meta,
    });
    guard();
    await this.accept(result);
    guard();
    this.client.remember(owner, listing.headRevision);
    const prepared = await this.api("cloud/prepare", { ownerId: owner, build: this.build() });
    guard();
    const same =
      remote &&
      progressFingerprint(prepared.saveJson) ===
        progressFingerprint(
          ensureCharacterIds(structuredClone(snapshotOf(remote.saveJson)), owner),
        );
    if (!same || forceUpload || snapshotOf(remote?.saveJson || "{}")?.sync?.protocol !== 2) {
      const result = await this.client.upload(owner, prepared.saveJson, listing.headRevision, {
        protectionId: protection.protectionId,
      });
      guard();
      const current = await this.api("cloud/prepare", { ownerId: owner, build: this.build() });
      guard();
      this.auto?.acknowledge(owner, prepared.saveJson, { kind: "uploaded", at: result.createdAt });
      if (progressFingerprint(current.saveJson) !== progressFingerprint(prepared.saveJson)) {
        this.auto?.emit("waiting");
        this.auto?.request(0);
      }
    } else
      this.auto?.acknowledge(owner, prepared.saveJson, {
        kind: "downloaded",
        at: remote.createdAt,
      });
    this.onChange();
    return kind;
  }
  async resolve(choices) {
    const values = await this.freshManual(),
      { owner, local, remote } = values;
    if (!remote) throw Error("conflict");
    const plan = planSaveSync(local.saveJson, remote.saveJson, { ownerId: owner, choices });
    if (plan.conflict) throw Error("mergeSelection");
    return this.applyManual(values, plan.snapshot);
  }
  wholeReplacement(local, incoming, owner) {
    const next = ensureCharacterIds(structuredClone(snapshotOf(incoming)), owner),
      alive = new Set(next.roles.map(cloudRoleKey));
    next.sync = {
      ...local.sync,
      ...next.sync,
      ownerId: owner,
      tombstones: { ...local.sync?.tombstones, ...next.sync?.tombstones },
    };
    for (const role of local.roles)
      if (!alive.has(cloudRoleKey(role))) next.sync.tombstones[cloudRoleKey(role)] ??= {};
    for (const key of alive) delete next.sync.tombstones[key];
    return next;
  }
  async loadCloud() {
    const values = await this.freshManual();
    if (!values.remote) throw Error("missing");
    return this.applyManual(
      values,
      this.wholeReplacement(values.local, snapshotOf(values.remote.saveJson), values.owner),
      { kind: "downloaded" },
    );
  }
  async restoreRecovery(id) {
    const values = await this.freshManual(),
      recovery = await this.client.readRecovery(values.owner, id);
    if (recovery.headRevision !== values.listing.headRevision) throw Error("conflict");
    return this.applyManual(
      values,
      this.wholeReplacement(values.local, recovery.save.saveJson, values.owner),
      { kind: "restore", forceUpload: true },
    );
  }
  async rollback() {
    const owner = this.owner;
    if (!owner) {
      await this.accept(await this.api("cloud/rollback", {}));
      this.auto?.emit("guest");
      return;
    }
    const values = await this.freshManual(),
      backup = await this.api("cloud/export-backup", { kind: "local", build: this.build() });
    return this.applyManual(values, this.wholeReplacement(values.local, backup.saveJson, owner), {
      kind: "rollback",
      forceUpload: true,
    });
  }
  async autoBind(values, valid) {
    if (
      !this.autoBindGuest ||
      !values.local.guestAvailable ||
      !valid() ||
      (this.auto && !this.auto.enabled(values.owner))
    )
      return false;
    if (values.local.stage !== "Select") throw Error("pendingSelection");
    // Reconciliation already owns the uploader task. Reuse its verified inputs;
    // entering the manual/exclusive queue here would wait on that same task.
    const result = await this.bindValues(values, { automatic: true, valid });
    if (result?.requiresChoice) throw Error("firstLoad");
    return true;
  }
  async bindValues(values, { automatic = false, valid = () => true } = {}) {
    const guard = () => {
      if (!this.valid(values.owner, values.generation) || !valid()) throw Error("accountChanged");
    };
    guard();
    const guest = await this.api("cloud/guest", { ownerId: values.owner, build: this.build() });
    guard();
    if (
      !values.remote &&
      !values.local.roles.length &&
      !snapshotOf(values.local.saveJson).sharedStorage?.some(Boolean)
    )
      return this.applyManual(values, snapshotOf(guest.saveJson), {
        bind: true,
        protectionSaveJson: guest.saveJson,
        valid,
      });
    // Do not quietly attach an old guest to an existing account. Offer exactly the
    // same complete-character choices and retain the unowned original unchanged.
    const remote = automatic
      ? values.local.saveJson
      : values.remote?.saveJson || values.local.saveJson;
    if (
      !automatic &&
      values.remote &&
      progressFingerprint(ensureCharacterIds(structuredClone(snapshotOf(remote)), values.owner)) !==
        progressFingerprint(values.local.saveJson)
    )
      throw Error("conflict");
    let plan = planSaveSync(guest.saveJson, remote, { ownerId: values.owner, hasBase: false }),
      automaticChoices = {};
    if (automatic && plan.conflict) {
      // Independently identified additions can coexist. A recorded deletion or
      // two versions of the same character still require the player's choice.
      for (const conflict of plan.conflicts) {
        if (!conflict.local && conflict.cloud && !plan.local.sync?.tombstones?.[conflict.key])
          automaticChoices[conflict.key] = "cloud";
        if (conflict.local && !conflict.cloud && !plan.remote.sync?.tombstones?.[conflict.key])
          automaticChoices[conflict.key] = "local";
      }
      plan = planSaveSync(guest.saveJson, remote, {
        ownerId: values.owner,
        hasBase: false,
        choices: automaticChoices,
      });
    }
    if (!plan.conflict)
      return this.applyManual(values, plan.snapshot, {
        bind: true,
        protectionSaveJson: guest.saveJson,
        valid,
      });
    this.binding = { values, guest, remote, plan, automaticChoices };
    return {
      requiresChoice: true,
      conflicts: plan.conflicts,
      localRoles: plan.local.roles,
      remoteRoles: plan.remote.roles,
    };
  }
  async bind() {
    return this.bindValues(await this.freshManual());
  }
  async resolveBinding(choices) {
    const binding = this.binding;
    if (!binding) throw Error("conflict");
    const values = await this.freshManual();
    if (
      values.owner !== binding.values.owner ||
      values.listing.headRevision !== binding.values.listing.headRevision
    )
      throw Error("conflict");
    const plan = planSaveSync(binding.guest.saveJson, binding.remote, {
      ownerId: values.owner,
      hasBase: false,
      choices: { ...binding.automaticChoices, ...choices },
    });
    if (plan.conflict) throw Error("mergeSelection");
    await this.applyManual(values, plan.snapshot, {
      bind: true,
      protectionSaveJson: binding.guest.saveJson,
    });
    this.binding = null;
  }
  async renameDevice(name) {
    name = String(name).trim();
    if (!name || name.length > 80 || /[\x00-\x1f\x7f]/.test(name)) throw Error("invalid");
    const owner = this.owner;
    this.device = { ...this.device, deviceName: name };
    this.storage.setItem("backmir-classic-hell-save-device-v2", JSON.stringify(this.device));
    await this.context(owner, { force: true });
  }
}

