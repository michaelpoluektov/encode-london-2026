float lavaWarpHash21(vec2 p) {
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}

float lavaWarpNoise21(vec2 p) {
  vec2 cell = floor(p);
  vec2 local = fract(p);
  vec2 smoothLocal = local * local * (3.0 - 2.0 * local);

  float a = lavaWarpHash21(cell);
  float b = lavaWarpHash21(cell + vec2(1.0, 0.0));
  float c = lavaWarpHash21(cell + vec2(0.0, 1.0));
  float d = lavaWarpHash21(cell + vec2(1.0, 1.0));

  return mix(mix(a, b, smoothLocal.x), mix(c, d, smoothLocal.x), smoothLocal.y);
}

float lavaWarpFbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;

  for (int i = 0; i < 5; i += 1) {
    value += amplitude * lavaWarpNoise21(p);
    p = p * 2.03 + vec2(17.1, 11.7);
    amplitude *= 0.5;
  }

  return value;
}

vec2 lavaWarpNode(vec2 uv, float time, float scale, float speed) {
  vec2 centeredUv = uv - 0.5;
  vec2 flowUv = centeredUv * scale;
  float driftTime = time * speed;
  vec2 warp = vec2(
    lavaWarpFbm(flowUv + vec2(0.0, driftTime * 0.7)),
    lavaWarpFbm(flowUv + vec2(4.3, -driftTime * 0.45))
  );

  return flowUv + (warp - 0.5) * 2.2;
}
