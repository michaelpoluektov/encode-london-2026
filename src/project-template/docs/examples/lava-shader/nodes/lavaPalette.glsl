vec4 lavaPaletteNode(
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

  return vec4(color, 1.0);
}
