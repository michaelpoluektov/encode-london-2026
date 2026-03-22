float surfaceLightNode(float nearestEdge, float bevelSize, float bevelMask, float directionalLight) {
  float centerLift = smoothstep(0.0, bevelSize * 2.0, nearestEdge);
  float light = 0.78 + centerLift * 0.18 + bevelMask * directionalLight * 0.22;

  return clamp(light, 0.55, 1.15);
}
