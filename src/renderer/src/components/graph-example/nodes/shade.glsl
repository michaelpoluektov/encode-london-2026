vec4 shadeNode(float signal, float detail, float roughness, vec4 tint) {
  float clampedSignal = clamp(signal, 0.0, 1.0);
  float clampedDetail = clamp(detail, 0.0, 1.0);
  float clampedRoughness = clamp(roughness, 0.0, 1.0);
  float highlight = mix(clampedDetail, clampedSignal, 1.0 - clampedRoughness);
  vec3 color = tint.rgb * (0.35 + 0.65 * clampedSignal);

  color += vec3(highlight) * (0.12 + 0.28 * clampedRoughness);

  return vec4(clamp(color, 0.0, 1.0), tint.a);
}
