vec4 lavaFinishNode(
  vec2 uv,
  vec4 baseColor,
  vec4 fields,
  float glow,
  vec4 hotColor
) {
  float molten = fields.y;

  vec2 centeredUv = uv - 0.5;
  float radius = length(centeredUv);
  float rim = smoothstep(0.78, 0.22, radius);

  vec3 color = baseColor.rgb * rim;
  color += hotColor.rgb * pow(max(0.0, 1.0 - radius / 0.42), 3.0) * molten * 0.18 * glow;

  return vec4(color, 1.0);
}
