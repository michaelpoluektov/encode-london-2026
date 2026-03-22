vec4 lavaShadeNode(
  vec2 uv,
  vec4 fields,
  float time,
  float speed,
  float glow,
  vec4 crustColor,
  vec4 lavaColor,
  vec4 hotColor
) {
  float cracks = fields.x;
  float molten = fields.y;
  float core = fields.z;
  float fissureField = fields.w;
  float driftTime = time * speed;

  vec3 crust = crustColor.rgb;
  vec3 lava = lavaColor.rgb;
  vec3 hot = hotColor.rgb;
  vec3 color = mix(crust, lava, cracks);
  color = mix(color, hot, core * glow);

  float emberPulse = 0.82 + 0.18 * sin(driftTime * 2.4 + fissureField * 8.0);
  color *= mix(0.88, emberPulse, molten);

  vec2 centeredUv = uv - 0.5;
  float radius = length(centeredUv);
  float rim = smoothstep(0.78, 0.22, radius);
  color *= rim;
  color += hot * pow(max(0.0, 1.0 - radius / 0.42), 3.0) * molten * 0.18 * glow;

  return vec4(color, 1.0);
}
