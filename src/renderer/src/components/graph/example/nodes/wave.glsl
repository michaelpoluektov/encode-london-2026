float waveNode(float time, float frequency) {
  vec2 p = gl_FragCoord.xy * 0.015;
  float phase = (p.x + p.y) * max(frequency, 0.001);

  return sin(phase + time);
}
