float brickMaskNode(vec2 cellUv, float mortarSize, float edgeSoftness) {
  float left = smoothstep(mortarSize, mortarSize + edgeSoftness, cellUv.x);
  float bottom = smoothstep(mortarSize, mortarSize + edgeSoftness, cellUv.y);
  float right = 1.0 - smoothstep(1.0 - mortarSize - edgeSoftness, 1.0 - mortarSize, cellUv.x);
  float top = 1.0 - smoothstep(1.0 - mortarSize - edgeSoftness, 1.0 - mortarSize, cellUv.y);

  return left * right * bottom * top;
}
