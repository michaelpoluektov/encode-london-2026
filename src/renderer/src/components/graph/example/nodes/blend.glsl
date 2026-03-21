float blendNode(float base, float mask, int steps) {
  float clampedMask = clamp(mask, 0.0, 1.0);
  float bands = max(float(steps), 1.0);
  float blended = mix(base, 1.0 - base, clampedMask * 0.6);

  return floor(blended * bands) / bands;
}
