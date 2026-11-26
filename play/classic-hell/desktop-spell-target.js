import { healingTarget } from "./healing-target.js";
// Hover-only spells never fall back to the persistent attack selection.
export function desktopSpellTarget(me, actors, spell, hover, selected, selfSpells) {
  if (spell === "Healing") return healingTarget(me, actors, hover?.id);
  if (spell === "Poisoning")
    return hover?.kind === "monster" && !hover.dead && !hover.friendly && hover.map === me.map
      ? hover
      : null;
  return selfSpells.has(spell) ? me : actors.find((a) => a.id === selected && !a.dead) || hover;
}

