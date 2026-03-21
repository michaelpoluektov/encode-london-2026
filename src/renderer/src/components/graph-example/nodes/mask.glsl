float maskNode(float pattern, float intensity) {
  float clampedIntensity = clamp(intensity, 0.0, 1.0);
  float threshold = 1.0 - clampedIntensity;

  return smoothstep(threshold, 1.0, pattern);
}
