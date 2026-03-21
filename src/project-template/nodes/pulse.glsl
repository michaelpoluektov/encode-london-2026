vec4 pulseNode(vec2 uv, float time) {
  vec2 centeredUv = uv - 0.5;
  float radius = length(centeredUv);
  float wave = 0.5 + 0.5 * sin(time * 1.5 - radius * 18.0);
  vec3 color = mix(vec3(0.08, 0.12, 0.18), vec3(0.95, 0.55, 0.24), wave);

  color *= 1.0 - smoothstep(0.35, 0.75, radius);

  return vec4(color, 1.0);
}
