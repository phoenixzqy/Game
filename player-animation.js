// Preserve an action already in progress when a struck packet arrives.
// BMClient GamePlayer::Update excludes movement/attack/casting from hurt poses.
export function shouldPlayHurt(current, now) {
  return (
    !current ||
    now >= current.at + current.duration ||
    !["walk", "run", "atk", "cast", "hurt"].includes(current.action)
  );
}

