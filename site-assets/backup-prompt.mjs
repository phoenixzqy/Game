// Foreground play time only; display is deferred until the caller reports safety.
export function createBackupPrompt({
  now = () => performance.now(),
  storage,
  show = () => {},
  hide = () => {},
  track = () => {},
} = {}) {
  const key = "backmir.backupPrompt.v1";
  let last = now(),
    elapsed = 0,
    previous = null,
    eligible = null,
    visible = false,
    shown = false,
    done = false;
  try {
    done = storage?.getItem(key) === "done";
  } catch {}
  function conceal() {
    if (visible) {
      visible = false;
      hide();
    }
  }
  return {
    observe(s, { guest = false, foreground = true, safe = false } = {}) {
      const t = now(),
        playing = s?.stage === "Game" && !!s.me;
      if (
        previous?.playing &&
        previous.foreground &&
        foreground &&
        playing &&
        previous.id === s.me.id
      )
        elapsed += Math.max(0, Math.min(t - last, 10000));
      last = t;
      if (
        playing &&
        previous?.id === s.me.id &&
        previous.epoch === s.epoch &&
        (s.me.completedQuests || []).some((id) => !previous.quests.has(id))
      )
        eligible = "quest";
      previous = {
        playing,
        foreground,
        id: s?.me?.id,
        epoch: s?.epoch,
        quests: new Set(s?.me?.completedQuests || []),
      };
      if (elapsed >= 300000 && !eligible) eligible = "playtime";
      if (!guest || !foreground || !playing || !safe || done) {
        conceal();
        return;
      }
      if (eligible && !visible) {
        visible = true;
        show(s.me);
        if (!shown) {
          shown = true;
          track("backup_prompt_view", { source: "backup_prompt", trigger: eligible }, true);
        }
      }
    },
    dismiss() {
      done = true;
      conceal();
      try {
        storage?.setItem(key, "done");
      } catch {}
      track("backup_prompt_dismiss", { source: "backup_prompt" }, true);
    },
    click() {
      done = true;
      conceal();
      try {
        storage?.setItem(key, "done");
      } catch {}
      track("backup_prompt_click", { source: "backup_prompt" }, true);
    },
    hide: conceal,
  };
}

