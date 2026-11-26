import { cloudMessages, cloudPanelMessages } from "./cloud-save-i18n.mjs";

/** Player-facing categories. `at` is deliberately not used as progress time. */
export function cloudPanelState(status = {}) {
  const code = typeof status === "string" ? status : status?.code || "waiting";
  if (code === "upgradeRequired") return { kind: "update", code };
  if (["uploaded", "unchanged", "downloaded", "synced"].includes(code))
    return { kind: "synced", code };
  if (["uploading", "syncing"].includes(code)) return { kind: "syncing", code };
  if (["conflict", "firstLoad", "guestBinding", "mergeFull"].includes(code))
    return { kind: "choice", code };
  if (["guest", "off", "offlineAccount"].includes(code)) return { kind: "local", code };
  return { kind: "pending", code };
}

const numeric = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);
const items = (rows) => (Array.isArray(rows) ? rows : []).filter(Boolean);
const stable = (value) =>
  Array.isArray(value)
    ? value.map(stable)
    : value && typeof value === "object"
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .filter((key) => key !== "uid")
            .map((key) => [key, stable(value[key])]),
        )
      : value;
const fingerprint = (item) => JSON.stringify(stable(item));
function itemDiff(current, other) {
  const a = items(current),
    b = items(other),
    totals = (rows) => {
      const map = new Map();
      for (const item of rows) {
        const { count, ...rest } = item,
          key = fingerprint(rest);
        map.set(key, (map.get(key) || 0) + Math.max(1, numeric(count)));
      }
      return map;
    },
    am = totals(a),
    bm = totals(b);
  let added = 0,
    removed = 0;
  for (const key of new Set([...am.keys(), ...bm.keys()])) {
    const delta = (am.get(key) || 0) - (bm.get(key) || 0);
    added += Math.max(0, delta);
    removed += Math.max(0, -delta);
  }
  const length = Math.max(current?.length || 0, other?.length || 0);
  let changed = 0;
  for (let index = 0; index < length; index++)
    if (fingerprint(current?.[index] || null) !== fingerprint(other?.[index] || null)) changed++;
  return {
    count: a.reduce((n, item) => n + Math.max(1, numeric(item.count)), 0),
    added,
    removed,
    changed,
  };
}
/** Summaries only; never used to choose a winning character version. */
export function roleComparison(role, other) {
  if (!role) return { deleted: true };
  const quests = Array.isArray(role.quests) ? role.quests : [],
    completed = Array.isArray(role.completedQuests) ? role.completedQuests : [];
  return {
    deleted: false,
    level: numeric(role.level),
    xp: numeric(role.xp),
    nextXP: numeric(role.nextXP),
    gold: numeric(role.gold),
    inventory: itemDiff(role.inventory, other?.inventory),
    equipment: itemDiff(role.equipment, other?.equipment),
    storage: itemDiff(role.storage, other?.storage),
    questItems: itemDiff(role.questInventory, other?.questInventory),
    activeQuests: quests.map((q) => q.id).sort((a, b) => a - b),
    completedQuests: [...completed].sort((a, b) => a - b),
    objectives: quests.reduce(
      (n, q) => n + Object.values(q.kills || {}).reduce((sum, value) => sum + numeric(value), 0),
      0,
    ),
    tasksChanged:
      JSON.stringify(stable({ quests, completed, late: role.lateQuests || {} })) !==
      JSON.stringify(
        stable({
          quests: other?.quests || [],
          completed: other?.completedQuests || [],
          late: other?.lateQuests || {},
        }),
      ),
    lateChanged:
      JSON.stringify(stable(role.lateQuests || {})) !==
      JSON.stringify(stable(other?.lateQuests || {})),
  };
}

/**
 * DOM-only cloud save presentation. All storage/network work belongs to adapters.
 * Optional itemName(item), questName(id), update() and download(json,label) adapters
 * enrich presentation without making the panel depend on game globals.
 */
export function mountCloudSavePanel(host, options = {}) {
  const doc = host.ownerDocument || globalThis.document;
  if (!doc) throw Error("A DOM document is required");
  const m = cloudPanelMessages(options.locale),
    legacy = cloudMessages(options.locale),
    root = doc.createElement("section");
  root.className = "cloud-panel";
  root.dataset.cloudSavePanel = "";
  host.replaceChildren(root);
  let disposed = false,
    busy = false,
    view = null,
    activeRefresh = null,
    activeOwner = null,
    renderedOwner = null,
    generation = 0,
    controls = [],
    messageNode = null,
    confirmation = null,
    loginCleanup = null,
    loginGeneration = 0,
    loginHost = null,
    emailCleanup = null,
    emailHost = null,
    emailStamp = "",
    emailGeneration = 0,
    advancedNode = null,
    diagnosticsNode = null,
    deviceInput = null,
    expanded = false,
    conflictStamp = "",
    choices = new Map();
  const currentUser = () => (typeof options.user === "function" ? options.user() : options.user);
  const ownerId = () => currentUser()?.id || null;
  const status = () => (typeof options.status === "function" ? options.status() : options.status);
  const element = (tag, text, className) => {
    const el = doc.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (className) el.className = className;
    return el;
  };
  const mark = (el, key, value = "") => {
    el.dataset[key] = String(value);
    return el;
  };
  const text = (parent, value, tag = "p", className) => {
    const el = element(tag, value, className);
    parent.append(el);
    return el;
  };
  const control = (el, disabled = false) => {
    controls.push({ el, disabled });
    el.disabled = busy || disabled;
    return el;
  };
  const button = (parent, label, action, key, value) => {
    const el = control(element("button", label));
    el.type = "button";
    if (key) mark(el, key, value);
    el.onclick = () => {
      if (disposed || busy) return;
      if (!ownsView()) {
        showMessage(m.accountChanged, true);
        return;
      }
      return action();
    };
    parent.append(el);
    return el;
  };
  const showMessage = (value, error = false) => {
    if (messageNode) {
      messageNode.textContent = value;
      messageNode.dataset.error = error ? "true" : "false";
    }
  };
  const date = (value) => {
    if (value === undefined || value === null || value === "") return m.unknownDate;
    const d = new Date(
      typeof value === "number" && value > 0 && value < 1e12 ? value * 1000 : value,
    );
    if (!Number.isFinite(d.getTime())) return m.unknownDate;
    return new Intl.DateTimeFormat(options.locale || "zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  };
  const number = (value) => new Intl.NumberFormat(options.locale || "zh-CN").format(numeric(value));
  const setBusy = (value) => {
    busy = value;
    root.setAttribute("aria-busy", String(value));
    for (const { el, disabled } of controls) el.disabled = value || disabled;
  };
  const clearLogin = () => {
    loginGeneration++;
    try {
      typeof loginCleanup === "function" ? loginCleanup() : loginCleanup?.dispose?.();
    } catch {}
    loginCleanup = null;
    loginHost = null;
  };
  const clearEmail = () => {
    emailGeneration++;
    try {
      typeof emailCleanup === "function" ? emailCleanup() : emailCleanup?.dispose?.();
    } catch {}
    emailCleanup = null;
    emailHost = null;
    emailStamp = "";
  };
  const ownsView = () => !view?.owner?.id || view.owner.id === ownerId();
  const changed = async (type) => {
    if (!disposed) {
      if (!ownsView()) {
        showMessage(m.accountChanged, true);
        return;
      }
      await options.onChange?.({ type });
    }
  };
  const errorText = (error) =>
    typeof error?.code === "string" && error.code.endsWith(".quota")
      ? m.storageFull
      : error?.message === "accountChanged"
        ? m.accountChanged
        : error?.message === "upgradeRequired"
          ? m.updateRequired
          : ["storageFull", "storage", "quota", "backupFailed", "storageWriteFailed"].includes(
                error?.message,
              ) || error?.name === "QuotaExceededError"
            ? m.storageFull
            : legacy[error?.message] || m.failed;
  const execute = async (action, type = "sync") => {
    if (disposed || busy) return;
    if (!ownsView()) {
      showMessage(m.accountChanged, true);
      return;
    }
    const owner = ownerId();
    setBusy(true);
    showMessage(m.working);
    try {
      await action();
      if (disposed) return;
      if (owner !== ownerId()) {
        showMessage(m.accountChanged, true);
        return;
      }
      if (activeRefresh) await activeRefresh;
      await refresh();
      if (!disposed && owner === ownerId()) await changed(type);
    } catch (error) {
      if (!disposed) showMessage(owner !== ownerId() ? m.accountChanged : errorText(error), true);
    } finally {
      if (!disposed) setBusy(false);
    }
  };
  const confirm = (description, action, type) => {
    const owner = ownerId();
    confirmation.replaceChildren();
    root.dataset.cloudChoosing = "true";
    text(confirmation, description);
    mark(confirmation, "cloudConfirmation");
    button(
      confirmation,
      m.confirm,
      () =>
        execute(async () => {
          if (owner !== ownerId()) throw Error("accountChanged");
          confirmation.replaceChildren();
          root.dataset.cloudChoosing = String(expanded);
          await action();
        }, type),
      "cloudConfirm",
    );
    button(
      confirmation,
      m.cancel,
      () => {
        confirmation.replaceChildren();
        root.dataset.cloudChoosing = String(expanded);
      },
      "cloudCancel",
    );
  };
  const download = async (adapter, label) => {
    const owner = ownerId(),
      result = await adapter(),
      json = typeof result === "string" ? result : result?.saveJson;
    if (typeof json !== "string") throw Error("invalid");
    if (disposed) return;
    if (owner !== ownerId()) throw Error("accountChanged");
    if (options.download) return options.download(json, label);
    const url = URL.createObjectURL(new Blob([json], { type: "application/json" })),
      link = doc.createElement("a");
    link.href = url;
    link.download =
      "darkforged-" + label + "-" + new Date().toISOString().replace(/[:.]/g, "-") + ".json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const mountLogin = async () => {
    if (disposed || busy) return;
    if (loginHost) return;
    clearLogin();
    const token = loginGeneration,
      owner = ownerId(),
      target = mark(element("section", undefined, "cloud-panel-login"), "cloudLogin");
    loginHost = target;
    root.append(target);
    if (!options.loginMount) {
      await changed("login");
      return;
    }
    try {
      const cleanup = await options.loginMount(target);
      if (disposed || token !== loginGeneration || owner !== ownerId()) {
        typeof cleanup === "function" ? cleanup() : cleanup?.dispose?.();
      } else loginCleanup = cleanup;
    } catch (error) {
      if (!disposed && token === loginGeneration) {
        loginHost = null;
        showMessage(errorText(error), true);
      }
    }
  };
  const mountEmail = (parent) => {
    if (!ownerId() || !options.emailBindingMount) {
      clearEmail();
      return;
    }
    const stamp = JSON.stringify([ownerId(), currentUser()?.emailLoginAddress || ""]);
    if (emailHost && stamp === emailStamp) {
      parent.append(emailHost);
      return;
    }
    clearEmail();
    emailStamp = stamp;
    const token = emailGeneration,
      owner = ownerId(),
      target = mark(element("section", undefined, "cloud-panel-email"), "cloudEmailBinding");
    emailHost = target;
    parent.append(target);
    Promise.resolve()
      .then(() => {
        if (disposed || token !== emailGeneration || owner !== ownerId()) return null;
        return options.emailBindingMount(target);
      })
      .then((cleanup) => {
        if (disposed || token !== emailGeneration || owner !== ownerId()) {
          typeof cleanup === "function" ? cleanup() : cleanup?.dispose?.();
        } else emailCleanup = cleanup;
      })
      .catch((error) => {
        if (!disposed && token === emailGeneration) showMessage(errorText(error), true);
      });
  };
  const taskNames = (ids) => {
    if (!ids.length) return m.none;
    const names = ids
      .slice(-4)
      .map((id) => options.questName?.(id))
      .filter(Boolean);
    return number(ids.length) + (names.length ? " · " + names.join(" / ") : "");
  };
  function renderRole(parent, role, other, source) {
    text(parent, m.device + ": " + source, "p", "cloud-panel-source");
    if (role?.cloudId)
      text(parent, m.characterId + ": " + role.cloudId.slice(0, 8), "p", "cloud-panel-source");
    const summary = roleComparison(role, other);
    if (summary.deleted) {
      text(parent, m.deleted, "strong", "cloud-panel-deleted");
      return;
    }
    text(parent, (role.name || "") + " · " + (options.jobs?.[role.job] || role.job || ""), "h4");
    const list = element("dl", undefined, "cloud-panel-facts");
    const fact = (name, value) => {
      list.append(element("dt", name), element("dd", value));
    };
    fact(m.level, number(summary.level));
    fact(
      m.xp,
      number(summary.xp) +
        (summary.nextXP > 0
          ? " / " +
            number(summary.nextXP) +
            " (" +
            Math.floor((summary.xp / summary.nextXP) * 100) +
            "%)"
          : ""),
    );
    fact(m.gold, number(summary.gold));
    fact(m.activeQuests, taskNames(summary.activeQuests));
    fact(m.completedQuests, taskNames(summary.completedQuests));
    fact(m.questProgress, number(summary.objectives));
    for (const [key, label] of [
      ["equipment", m.equipment],
      ["inventory", m.inventory],
      ["storage", m.storage],
      ["questItems", m.questItems],
    ]) {
      const row = summary[key];
      let caption = number(row.count) + " " + m.items;
      if (key === "equipment" && row.changed)
        caption += " · " + number(row.changed) + " " + m.changed;
      else if (row.added || row.removed)
        caption +=
          " · " + m.added + " " + number(row.added) + " / " + m.removed + " " + number(row.removed);
      fact(label, caption);
    }
    parent.append(list);
    if (summary.tasksChanged) text(parent, m.taskChanged, "p", "cloud-panel-difference");
    if (summary.lateChanged)
      text(parent, m.lateQuests + " · " + m.taskChanged, "p", "cloud-panel-difference");
    if (options.itemName) {
      const otherItems = new Set(
        [...items(other?.equipment), ...items(other?.inventory), ...items(other?.storage)].map(
          fingerprint,
        ),
      );
      const changedItems = [
        ...items(role.equipment),
        ...items(role.inventory),
        ...items(role.storage),
      ]
        .filter((item) => !otherItems.has(fingerprint(item)))
        .slice(0, 5)
        .map((item) => options.itemName(item))
        .filter(Boolean);
      if (changedItems.length)
        text(
          parent,
          m.equipment + " / " + m.inventory + " / " + m.storage + ": " + changedItems.join(" · "),
          "p",
          "cloud-panel-item-names",
        );
    }
  }
  function hellSaveLabel() {
    return options.locale === "en"
      ? "All characters and shared storage"
      : options.locale === "es"
        ? "Todos los personajes y almacén compartido"
        : "全部角色与共享仓库";
  }
  const wholeConflict = (c) => c.scope === "hell-save" || c.scope === "shared-save";
  function renderHellSave(parent, save, source) {
    text(parent, source, "p");
    text(parent, hellSaveLabel(), "h4");
    for (const r of save?.roles || [])
      text(
        parent,
        r.name + " · " + (options.jobs?.[r.job] || r.job) + " · " + m.level + " " + number(r.level),
      );
    text(
      parent,
      (options.locale === "en"
        ? "Shared storage"
        : options.locale === "es"
          ? "Almacén compartido"
          : "共享仓库") +
        " " +
        items(save?.sharedStorage).length +
        "/80",
    );
  }
  function renderConflicts(parent) {
    const conflicts = view.conflicts || [];
    if (!expanded || !conflicts.length) return;
    root.dataset.cloudChoosing = "true";
    const box = mark(element("section", undefined, "cloud-panel-conflicts"), "cloudConflicts");
    text(box, m.chooseAll);
    text(
      box,
      conflicts.some(wholeConflict)
        ? options.locale === "en"
          ? "Choose one complete save. Characters and shared storage stay together."
          : options.locale === "es"
            ? "Elige una partida completa, con personajes y almacén compartido."
            : "选择一份完整存档，全部角色和共享仓库一起保留；不会分别合并。"
        : m.wholeCharacter,
      "p",
      "cloud-panel-help",
    );
    conflicts.forEach((conflict, index) => {
      const group = element("fieldset", undefined, "cloud-panel-conflict"),
        role = conflict.local || conflict.cloud;
      group.append(
        element(
          "legend",
          wholeConflict(conflict)
            ? hellSaveLabel()
            : (role?.name || m.roles) + " · " + (options.jobs?.[role?.job] || role?.job || ""),
        ),
      );
      const columns = element("div", undefined, "cloud-panel-versions");
      for (const side of ["local", "cloud"]) {
        const label = element("label", undefined, "cloud-panel-version"),
          input = control(element("input"));
        input.type = "radio";
        input.name = "cloud-character-version-" + index;
        input.value = side;
        input.checked = choices.get(conflict.key) === side;
        mark(input, "cloudChoice", conflict.key);
        input.setAttribute(
          "aria-label",
          (role?.name || m.roles) + " · " + (side === "local" ? m.localVersion : m.cloudVersion),
        );
        input.onchange = () => {
          if (input.checked && !busy) {
            choices.set(conflict.key, side);
            showMessage("");
          }
        };
        label.append(input, element("strong", side === "local" ? m.localVersion : m.cloudVersion));
        const details = element("div", undefined, "cloud-panel-version-info");
        const source =
          side === "local"
            ? conflict.localDeviceName ||
              conflict.local?.sourceDeviceName ||
              view.deviceName ||
              m.thisDevice
            : conflict.cloudDeviceName ||
              conflict.cloud?.sourceDeviceName ||
              view.remoteDeviceName ||
              m.otherDevice;
        if (wholeConflict(conflict)) renderHellSave(details, conflict[side], source);
        else
          renderRole(
            details,
            conflict[side],
            conflict[side === "local" ? "cloud" : "local"],
            source,
          );
        label.append(details);
        columns.append(label);
      }
      group.append(columns);
      box.append(group);
    });
    const actions = element("div", undefined, "cloud-panel-actions");
    button(
      actions,
      m.applyChoices,
      () => {
        if (conflicts.some((conflict) => !["local", "cloud"].includes(choices.get(conflict.key)))) {
          showMessage(m.chooseAll, true);
          return;
        }
        const selected = Object.fromEntries(
          conflicts.map((conflict) => [conflict.key, choices.get(conflict.key)]),
        );
        return execute(() => options.resolve(selected), "resolve");
      },
      "cloudResolve",
    );
    button(
      actions,
      m.later,
      () => {
        expanded = false;
        root.dataset.cloudChoosing = "false";
        render();
      },
      "cloudLater",
    );
    box.append(actions);
    parent.append(box);
  }
  function renderAdvanced(parent) {
    const advanced = mark(element("details", undefined, "cloud-panel-advanced"), "cloudAdvanced");
    advancedNode = advanced;
    advanced.append(element("summary", m.advanced));
    const tools = element("div", undefined, "cloud-panel-tools");
    if (options.exportLocal)
      button(
        tools,
        m.exportLocal,
        () => execute(() => download(options.exportLocal, "local"), "export"),
        "cloudAction",
        "exportLocal",
      );
    if (options.exportMergeLocal)
      button(
        tools,
        m.exportMergeLocal,
        () => execute(() => download(options.exportMergeLocal, "before-choice-local"), "export"),
        "cloudAction",
        "exportMergeLocal",
      );
    if (options.exportMergeRemote)
      button(
        tools,
        m.exportMergeRemote,
        () => execute(() => download(options.exportMergeRemote, "before-choice-cloud"), "export"),
        "cloudAction",
        "exportMergeRemote",
      );
    if (ownerId() && options.exportCloud && view.headRevision)
      button(
        tools,
        m.exportCloud,
        () => execute(() => download(options.exportCloud, "cloud"), "export"),
        "cloudAction",
        "exportCloud",
      );
    if (ownerId() && options.loadCloud && view.headRevision)
      button(
        tools,
        m.loadCloud,
        () => confirm(m.loadConfirm, options.loadCloud, "load"),
        "cloudAction",
        "loadCloud",
      );
    if (options.rollback)
      button(
        tools,
        m.rollback,
        () => confirm(m.rollbackConfirm, options.rollback, "rollback"),
        "cloudAction",
        "rollback",
      );
    advanced.append(tools);
    mountEmail(advanced);
    if (ownerId() && options.setEnabled) {
      const label = element("label", undefined, "cloud-panel-toggle"),
        input = control(element("input"));
      input.type = "checkbox";
      input.checked = view.enabled !== false;
      mark(input, "cloudEnabled");
      input.onchange = () => execute(() => options.setEnabled(input.checked), "enabled");
      label.append(input, element("span", m.enabled));
      advanced.append(label);
    }
    if (options.renameDevice) {
      const form = element("form", undefined, "cloud-panel-device"),
        label = element("label", m.deviceName),
        input = control(element("input"));
      deviceInput = input;
      input.type = "text";
      input.maxLength = 40;
      input.value = view.deviceName || "";
      mark(input, "cloudDeviceName");
      input.setAttribute("aria-label", m.deviceName);
      label.append(input);
      form.append(label);
      const rename = () => {
        const name = input.value.trim();
        if (!name) {
          showMessage(m.deviceNameRequired, true);
          input.focus();
          return;
        }
        if ([...name].length > 40) {
          showMessage(m.deviceNameTooLong, true);
          input.focus();
          return;
        }
        return execute(() => options.renameDevice(name), "device");
      };
      button(form, m.rename, rename, "cloudAction", "rename");
      form.onsubmit = (event) => {
        event.preventDefault();
        return rename();
      };
      text(form, m.deviceHint, "p", "cloud-panel-help");
      advanced.append(form);
    }
    if (ownerId()) {
      const recovery = mark(
        element("section", undefined, "cloud-panel-recoveries"),
        "cloudRecoveries",
      );
      text(recovery, m.recoveries, "h3");
      text(recovery, m.recoveryRetention, "p", "cloud-panel-help");
      if (!view.recoveries?.length) text(recovery, m.recoveryEmpty);
      for (const row of view.recoveries || []) {
        const card = element("section", undefined, "cloud-panel-recovery");
        text(
          card,
          row.slot === "cloud" || row.source === "cloud" || row.source === "remote"
            ? m.recoveryCloud
            : m.recoveryLocal,
          "strong",
        );
        text(card, m.created + ": " + date(row.createdAt));
        text(card, m.expires + ": " + date(row.expiresAt));
        if (options.restoreRecovery)
          button(
            card,
            m.restoreRecovery,
            () => confirm(m.recoveryConfirm, () => options.restoreRecovery(row.id), "recovery"),
            "cloudRecovery",
            row.id,
          );
        recovery.append(card);
      }
      advanced.append(recovery);
    }
    const diagnostics = element("details", undefined, "cloud-panel-diagnostics");
    diagnosticsNode = diagnostics;
    diagnostics.append(element("summary", m.diagnostics));
    for (const [label, value] of [
      [m.head, view.headRevision ?? "—"],
      [m.base, view.localSync?.baseRevision ?? view.localSync?.cloudRevision ?? "—"],
      [m.progressSeq, view.localSync?.progressSeq ?? "—"],
      [m.checkpoint, date(view.localSync?.checkpointWrittenAt)],
    ])
      text(diagnostics, label + ": " + value);
    text(diagnostics, m.checkpointHelp, "p", "cloud-panel-help");
    advanced.append(diagnostics);
    parent.append(advanced);
  }
  function render() {
    if (disposed || !view) return;
    const advancedOpen = !!advancedNode?.open,
      diagnosticsOpen = !!diagnosticsNode?.open,
      deviceDraft = deviceInput?.value;
    controls = [];
    root.replaceChildren();
    root.dataset.cloudChoosing = String(expanded);
    renderedOwner = ownerId();
    let state = cloudPanelState(status());
    if (!ownerId())
      state = cloudPanelState({
        code:
          state.code === "offlineAccount" && view.localSync?.ownerId ? "offlineAccount" : "guest",
      });
    else if (state.code !== "upgradeRequired" && view.conflicts?.length)
      state = cloudPanelState({ code: "conflict" });
    else if (state.code !== "upgradeRequired" && view.guestAvailable)
      state = cloudPanelState({ code: "guestBinding" });
    else if (state.code !== "upgradeRequired" && view.enabled === false)
      state = cloudPanelState({ code: "off" });
    if (!["guest", "auth", "offlineAccount"].includes(state.code)) clearLogin();
    root.dataset.cloudState = state.kind;
    const main = mark(element("section", undefined, "cloud-panel-main"), "cloudPanelMain"),
      title = mark(
        element(
          "h3",
          m[
            state.kind === "local"
              ? "localOnly"
              : state.kind === "choice"
                ? "choice"
                : state.kind === "update"
                  ? "updateTitle"
                  : state.kind
          ],
        ),
        "cloudPanelState",
      );
    title.setAttribute("role", "status");
    main.append(title);
    const description =
      state.code === "retry" && status()?.reason === "rateLimited"
        ? m.rateLimited
        : state.code === "retry" && status()?.reason === "timeout"
          ? m.timeout
          : state.kind === "synced"
            ? m.verified
            : state.kind === "syncing"
              ? m.syncWait
              : {
                  conflict: m.divergent,
                  firstLoad: m.firstLoad,
                  guestBinding: m.guestBinding,
                  mergeFull: m.mergeFull,
                  offline: m.offline,
                  retry: m.retry,
                  pendingSelection: m.pendingSelection,
                  guest: m.guest,
                  offlineAccount: m.offlineAccount,
                  off: m.off,
                  auth: m.auth,
                  size: m.size,
                  invalid: m.invalid,
                  accountChanged: m.accountChanged,
                  upgradeRequired: m.updateRequired,
                  storage: m.storageFull,
                }[state.code] || m.waiting;
    text(main, description, "p", "cloud-panel-description");
    const displayName =
      view.owner?.displayName ||
      currentUser()?.nickname ||
      currentUser()?.displayName ||
      m.guestAccount;
    text(main, m.account + ": " + displayName, "p", "cloud-panel-owner");
    const roles = view.localRoles?.length ? view.localRoles : view.remoteRoles || [],
      list = element("ul", undefined, "cloud-panel-roles");
    for (const role of roles) {
      text(
        list,
        (role.name || "") +
          " · " +
          (options.jobs?.[role.job] || role.job || "") +
          " · " +
          m.level +
          " " +
          number(role.level),
        "li",
      );
    }
    if (!roles.length) text(list, m.noRoles, "li");
    main.append(list);
    if (ownerId()) {
      if (view.confirmedAt)
        text(main, m.confirmed + ": " + date(view.confirmedAt), "p", "cloud-panel-confirmed");
      else text(main, m.notConfirmed, "p", "cloud-panel-help");
      if (view.sourceDeviceName || view.remoteDeviceName)
        text(
          main,
          m.device + ": " + (view.sourceDeviceName || view.remoteDeviceName),
          "p",
          "cloud-panel-help",
        );
    }
    const action = element("div", undefined, "cloud-panel-primary");
    let label, handler;
    if (state.kind === "synced") {
      label = m.continue;
      handler = () => changed("continue");
    } else if (state.kind === "syncing") {
      label = m.continueLocal;
      handler = () => changed("continue");
    } else if (state.kind === "update") {
      label = m.update;
      handler = () =>
        execute(() => (options.update ? options.update() : changed("update")), "update");
    } else if (["guest", "auth", "offlineAccount"].includes(state.code)) {
      label = m.login;
      handler = mountLogin;
    } else if (state.code === "guestBinding") {
      label = m.bind;
      handler = () => confirm(m.bindConfirm, options.bind, "bind");
    } else if (state.code === "off") {
      label = m.enable;
      handler = () => execute(() => options.setEnabled(true), "enabled");
    } else if (state.kind === "choice" && view.conflicts?.length) {
      label = m.compare;
      handler = () => {
        expanded = true;
        render();
      };
    } else {
      label =
        state.code === "pendingSelection"
          ? m.returnToSelect
          : state.code === "auth"
            ? m.login
            : state.kind === "choice"
              ? m.retryAction
              : m.syncNow;
      handler = () => execute(options.sync, "sync");
    }
    button(action, label, handler, "cloudPrimary");
    main.append(action);
    root.append(main);
    messageNode = mark(element("p", undefined, "cloud-panel-message"), "cloudPanelMessage");
    messageNode.setAttribute("role", "status");
    messageNode.setAttribute("aria-live", "polite");
    root.append(messageNode);
    renderConflicts(root);
    renderAdvanced(root);
    if (advancedNode) advancedNode.open = advancedOpen;
    if (diagnosticsNode) diagnosticsNode.open = diagnosticsOpen;
    if (deviceInput && deviceDraft !== undefined) deviceInput.value = deviceDraft;
    confirmation = mark(
      element("section", undefined, "cloud-panel-confirmation"),
      "cloudConfirmation",
    );
    confirmation.dataset.cloudConfirmation = "";
    root.append(confirmation);
    if (loginHost) root.append(loginHost);
    setBusy(busy);
  }
  function renderSelectionBoundary(owner) {
    // Context switching is intentionally deferred during play. Do not display
    // another partition's roles or empty-cloud claims before it can be checked.
    view = null;
    renderedOwner = owner;
    expanded = false;
    choices = new Map();
    clearLogin();
    clearEmail();
    advancedNode = null;
    diagnosticsNode = null;
    deviceInput = null;
    controls = [];
    root.replaceChildren();
    root.dataset.cloudState = "pending";
    root.dataset.cloudChoosing = "false";
    const main = mark(element("section", undefined, "cloud-panel-main"), "cloudPanelMain"),
      title = mark(element("h3", m.pending), "cloudPanelState");
    title.setAttribute("role", "status");
    main.append(title);
    text(main, m.pendingSelection, "p", "cloud-panel-description");
    text(
      main,
      m.account + ": " + (currentUser()?.nickname || currentUser()?.displayName || m.guestAccount),
      "p",
      "cloud-panel-owner",
    );
    const action = element("div", undefined, "cloud-panel-primary");
    button(
      action,
      m.returnToSelect,
      () => {
        if (owner !== ownerId()) {
          showMessage(m.accountChanged, true);
          return;
        }
        return execute(options.sync, "sync");
      },
      "cloudPrimary",
    );
    main.append(action);
    root.append(main);
    messageNode = mark(element("p", undefined, "cloud-panel-message"), "cloudPanelMessage");
    messageNode.setAttribute("role", "status");
    messageNode.setAttribute("aria-live", "polite");
    root.append(messageNode);
    setBusy(busy);
  }
  function refresh() {
    if (disposed) return Promise.resolve();
    const owner = ownerId();
    if (activeRefresh && activeOwner === owner) return activeRefresh;
    if (view && renderedOwner !== owner) {
      view = null;
      expanded = false;
      choices = new Map();
      clearLogin();
      clearEmail();
      advancedNode = null;
      diagnosticsNode = null;
      deviceInput = null;
      controls = [];
      root.replaceChildren();
      messageNode = mark(element("p", undefined, "cloud-panel-message"), "cloudPanelMessage");
      messageNode.setAttribute("role", "status");
      root.append(messageNode);
      showMessage(m.accountChanged, true);
    }
    const token = ++generation;
    activeOwner = owner;
    const task = (async () => {
      try {
        const next = await options.load();
        if (disposed || token !== generation) return;
        if (owner !== ownerId() || (next.owner?.id && next.owner.id !== owner)) {
          showMessage(m.accountChanged, true);
          return;
        }
        if (options.listRecoveries && !Array.isArray(next.recoveries)) {
          const recoveries = await options.listRecoveries();
          if (disposed || token !== generation || owner !== ownerId()) return;
          next.recoveries = recoveries;
        }
        const stamp = JSON.stringify({ head: next.headRevision, conflicts: next.conflicts || [] });
        if (stamp !== conflictStamp) {
          conflictStamp = stamp;
          choices = new Map();
          expanded = false;
        }
        view = next;
        render();
      } catch (error) {
        if (disposed || token !== generation || owner !== ownerId()) return;
        if (error?.message === "pendingSelection") {
          renderSelectionBoundary(owner);
          return;
        }
        if (!messageNode) {
          root.replaceChildren();
          messageNode = mark(element("p", undefined, "cloud-panel-message"), "cloudPanelMessage");
          messageNode.setAttribute("role", "status");
          root.append(messageNode);
        }
        showMessage(errorText(error), true);
      }
    })().finally(() => {
      if (activeRefresh === task) activeRefresh = null;
    });
    activeRefresh = task;
    return task;
  }
  void refresh();
  return {
    refresh,
    dispose() {
      if (disposed) return;
      disposed = true;
      generation++;
      clearLogin();
      clearEmail();
      root.dataset.cloudChoosing = "false";
      root.dataset.disposed = "true";
    },
  };
}

