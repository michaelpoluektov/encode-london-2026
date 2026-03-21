float blendNode(float base, float mask) {
  float clampedMask = clamp(mask, 0.0, 1.0);

  return mix(base, 1.0 - base, clampedMask * 0.6);
}
