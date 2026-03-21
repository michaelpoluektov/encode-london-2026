float maskNode(float pattern, float intensity, bool invert) {
  float clampedIntensity = clamp(intensity, 0.0, 1.0);
  float threshold = 1.0 - clampedIntensity;
  float maskedPattern = smoothstep(threshold, 1.0, pattern);

  return invert ? 1.0 - maskedPattern : maskedPattern;
}
