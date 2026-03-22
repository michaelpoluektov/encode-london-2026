float lavaFieldsHash21(vec2 p) {
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}

float lavaFieldsNoise21(vec2 p) {
  vec2 cell = floor(p);
  vec2 local = fract(p);
  vec2 smoothLocal = local * local * (3.0 - 2.0 * local);

  float a = lavaFieldsHash21(cell);
  float b = lavaFieldsHash21(cell + vec2(1.0, 0.0));
  float c = lavaFieldsHash21(cell + vec2(0.0, 1.0));
  float d = lavaFieldsHash21(cell + vec2(1.0, 1.0));

  return mix(mix(a, b, smoothLocal.x), mix(c, d, smoothLocal.x), smoothLocal.y);
}

float lavaFieldsFbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;

  for (int i = 0; i < 5; i += 1) {
    value += amplitude * lavaFieldsNoise21(p);
    p = p * 2.03 + vec2(17.1, 11.7);
    amplitude *= 0.5;
  }

  return value;
}

vec4 lavaFieldsNode(vec2 flowUv, float time, float speed) {
  float driftTime = time * speed;
  float baseField = lavaFieldsFbm(flowUv - vec2(driftTime * 0.45, driftTime * 0.18));
  float fissureField = lavaFieldsFbm(
    flowUv * 1.8 + vec2(driftTime * 0.65, -driftTime * 0.25)
  );
  float cracks = smoothstep(0.52, 0.8, baseField * 0.9 + fissureField * 0.75);
  float molten = smoothstep(0.62, 0.96, baseField + fissureField * 0.55);
  float core = pow(smoothstep(0.78, 1.08, baseField + fissureField * 0.85), 1.6);

  return vec4(cracks, molten, core, fissureField);
}
