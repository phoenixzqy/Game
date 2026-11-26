// Healing defaults to self; only a living, owned summon can override the target.
export function healingTarget(me, actors, id) {
  return (
    actors.find(
      (a) =>
        a.id === id &&
        a.kind === "monster" &&
        a.friendly &&
        !a.dead &&
        a.master === me.id &&
        a.map === me.map,
    ) || me
  );
}

