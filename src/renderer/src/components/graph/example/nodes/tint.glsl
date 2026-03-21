vec4 tintNode(vec4 base, vec4 accent, float mask) {
  float clampedMask = clamp(mask, 0.0, 1.0);
  vec3 rgb = mix(base.rgb, accent.rgb, clampedMask);
  float alpha = mix(base.a, accent.a, clampedMask);

  return vec4(rgb, alpha);
}
