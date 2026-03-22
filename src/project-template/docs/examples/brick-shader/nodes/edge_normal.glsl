vec2 edgeNormalNode(vec2 cellUv, vec2 edgeDistance) {
  float useX = step(edgeDistance.x, edgeDistance.y);
  vec2 xNormal = vec2(sign(cellUv.x - 0.5), 0.0);
  vec2 yNormal = vec2(0.0, sign(cellUv.y - 0.5));

  return xNormal * useX + yNormal * (1.0 - useX);
}
