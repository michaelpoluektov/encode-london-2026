vec3 blendBrickColorNode(vec3 brickColor, vec3 mortarColor, float brickMask, float surfaceLight, float globalShade) {
  vec3 litBrick = brickColor * surfaceLight * globalShade;
  vec3 litMortar = mortarColor * (0.9 * globalShade);

  return mix(litMortar, litBrick, brickMask);
}
