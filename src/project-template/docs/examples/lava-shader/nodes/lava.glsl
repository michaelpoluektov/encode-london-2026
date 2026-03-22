float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}

float noise21(vec2 p) {
  vec2 cell = floor(p);
  vec2 local = fract(p);
  vec2 smoothLocal = local * local * (3.0 - 2.0 * local);

  float a = hash21(cell);
  float b = hash21(cell + vec2(1.0, 0.0));
  float c = hash21(cell + vec2(0.0, 1.0));
  float d = hash21(cell + vec2(1.0, 1.0));

  return mix(mix(a, b, smoothLocal.x), mix(c, d, smoothLocal.x), smoothLocal.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;

  for (int i = 0; i < 5; i += 1) {
    value += amplitude * noise21(p);
    p = p * 2.03 + vec2(17.1, 11.7);
    amplitude *= 0.5;
  }

  return value;
}

vec4 lavaNode(
  vec2 uv,
  float time,
  float scale,
  float speed,
  float glow,
  vec4 crustColor,
  vec4 lavaColor,
  vec4 hotColor
) {
  vec2 centeredUv = uv - 0.5;
  float radius = length(centeredUv);

  vec2 flowUv = centeredUv * scale;
  float driftTime = time * speed;
  vec2 warp = vec2(
    fbm(flowUv + vec2(0.0, driftTime * 0.7)),
    fbm(flowUv + vec2(4.3, -driftTime * 0.45))
  );
  flowUv += (warp - 0.5) * 2.2;

  float baseField = fbm(flowUv - vec2(driftTime * 0.45, driftTime * 0.18));
  float fissureField = fbm(flowUv * 1.8 + vec2(driftTime * 0.65, -driftTime * 0.25));
  float cracks = smoothstep(0.52, 0.8, baseField * 0.9 + fissureField * 0.75);
  float molten = smoothstep(0.62, 0.96, baseField + fissureField * 0.55);
  float core = pow(smoothstep(0.78, 1.08, baseField + fissureField * 0.85), 1.6);

  vec3 crust = crustColor.rgb;
  vec3 lava = lavaColor.rgb;
  vec3 hot = hotColor.rgb;
  vec3 color = mix(crust, lava, cracks);
  color = mix(color, hot, core * glow);

  float emberPulse = 0.82 + 0.18 * sin(driftTime * 2.4 + fissureField * 8.0);
  color *= mix(0.88, emberPulse, molten);

  float rim = smoothstep(0.78, 0.22, radius);
  color *= rim;
  color += hot * pow(max(0.0, 1.0 - radius / 0.42), 3.0) * molten * 0.18 * glow;

  return vec4(color, 1.0);
}
