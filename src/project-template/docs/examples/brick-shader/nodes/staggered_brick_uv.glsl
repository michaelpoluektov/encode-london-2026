vec2 staggeredBrickUvNode(vec2 scaledUv, float rowOffset) {
  float oddRow = mod(floor(scaledUv.y), 2.0);

  return vec2(scaledUv.x + oddRow * rowOffset, scaledUv.y);
}
