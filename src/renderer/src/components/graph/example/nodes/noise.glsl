float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);

  return fract(p.x * p.y);
}

float noiseNode(float time, float frequency) {
  vec2 p = gl_FragCoord.xy * 0.02 * max(frequency, 0.001);

  return hash21(floor(p + time * 0.25));
}
