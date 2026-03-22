vec3 brickColorNode(float noise, vec3 brickColorA, vec3 brickColorB, float colorVariation) {
  float mixAmount = clamp(mix(0.5, noise, colorVariation), 0.0, 1.0);

  return mix(brickColorA, brickColorB, mixAmount);
}
