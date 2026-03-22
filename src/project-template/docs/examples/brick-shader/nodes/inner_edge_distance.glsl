vec2 innerEdgeDistanceNode(vec2 cellUv, float mortarSize) {
  vec2 innerMin = vec2(mortarSize);
  vec2 innerMax = vec2(1.0 - mortarSize);

  return min(cellUv - innerMin, innerMax - cellUv);
}
