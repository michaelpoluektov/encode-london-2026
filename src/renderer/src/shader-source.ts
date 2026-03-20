export const STARTER_FRAGMENT_SHADER = `uniform float u_time;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  vec3 color = 0.5 + 0.5 * cos(u_time + uv.xyx + vec3(0.0, 2.0, 4.0));
  gl_FragColor = vec4(color, 1.0);
}`;

export const PREVIEW_VERTEX_SHADER = `varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
