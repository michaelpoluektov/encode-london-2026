float directionalLightNode(vec2 edgeNormal, vec2 lightDirection) {
  vec2 safeLightDirection = normalize(lightDirection + vec2(0.0001));

  return dot(-edgeNormal, safeLightDirection);
}
