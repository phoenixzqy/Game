// Fixed native monsters have one facing even when their INI stride is nonzero.
export function monsterFrameIndex(binding, pose, direction, frame) {
  const count = binding.directions ?? 8;
  const facing = ((direction % count) + count) % count;
  return pose.start + facing * pose.stride + frame;
}

