float globalShadeNode(vec2 uv) {
  vec2 centeredUv = uv - 0.5;

  return clamp(1.05 - dot(centeredUv, centeredUv) * 0.85, 0.65, 1.05);
}
