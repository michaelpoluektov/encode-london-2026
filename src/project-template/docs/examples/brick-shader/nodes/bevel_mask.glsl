float bevelMaskNode(float nearestEdge, float bevelSize) {
  return 1.0 - smoothstep(0.0, bevelSize, nearestEdge);
}
