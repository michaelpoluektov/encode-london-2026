float brickNoiseNode(vec2 brickIndex) {
  return fract(sin(dot(brickIndex, vec2(127.1, 311.7))) * 43758.5453123);
}
