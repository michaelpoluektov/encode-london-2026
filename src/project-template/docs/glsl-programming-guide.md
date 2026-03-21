# GLSL Programming Guide

This guide is for writing `nodes/*.glsl` custom node functions and `vertex.vert` shader code in Shadily.

It is based on:

- Three.js `ShaderMaterial` documentation: <https://threejs.org/docs/api/en/materials/ShaderMaterial.html>
- The Book of Shaders chapters and glossary: <https://thebookofshaders.com/03/>, <https://thebookofshaders.com/04/>, <https://thebookofshaders.com/glossary/>
- Khronos OpenGL Wiki on GLSL qualifiers: <https://wikis.khronos.org/opengl/Type_Qualifier>
- MDN on `OES_standard_derivatives`: <https://developer.mozilla.org/en-US/docs/Web/API/OES_standard_derivatives>

## Working baseline for this project

Shadily currently compiles fragment shaders through Three.js `ShaderMaterial` on `WebGLRenderer`, and it does not set `glslVersion` to `THREE.GLSL3`. In practice, author shader code in the GLSL1 / GLSL ES 1.00 style used by classic Three.js `ShaderMaterial`.

The fragment compiler in this project also generates shader glue around your node functions:

- it declares `uniform` values for graph uniforms and time
- it declares `varying` values for graph varyings
- it generates `void main()`
- it writes the final color to `gl_FragColor`

Because of that, custom node files should contain reusable GLSL functions, not full standalone shaders.

## Safe language features to use

These are the most useful features to lean on in Shadily, and they match the external guides above:

- scalar types: `bool`, `int`, `float`
- vector types: `vec2`, `vec3`, `vec4`
- constructors: `vec3(1.0)`, `vec3(a, b, c)`, `vec4(color, 1.0)`
- swizzles: `.x`, `.xy`, `.rgb`, `.a`
- arithmetic and comparisons
- helper functions such as `sin`, `cos`, `abs`, `floor`, `ceil`, `fract`, `mod`, `min`, `max`, `clamp`, `mix`, `step`, `smoothstep`, `length`, `distance`, `dot`, `cross`, `normalize`, `reflect`, and `refract`
- small pure helper functions with explicit input and output types

Example custom node:

```glsl
vec4 pulseNode(vec2 uv, float time) {
  vec2 centeredUv = uv - 0.5;
  float radius = length(centeredUv);
  float wave = 0.5 + 0.5 * sin(time * 1.5 - radius * 18.0);
  vec3 color = mix(vec3(0.08, 0.12, 0.18), vec3(0.95, 0.55, 0.24), wave);

  color *= 1.0 - smoothstep(0.35, 0.75, radius);

  return vec4(color, 1.0);
}
```

## How to write custom node files

For `nodes/*.glsl` files:

- write one or more reusable functions
- make the main function name match the node instance name plus `Node`, or keep exactly one supported function in the file
- keep parameters and return types simple
- use graph uniform and varying nodes instead of hardcoding app-facing inputs in GLSL

Avoid putting these in custom node files:

- `void main()`
- `uniform` declarations
- `varying` declarations
- `attribute` declarations
- `#version ...`
- precision declarations

Shadily generates the fragment shader wrapper itself, and Three.js injects shader preamble such as precision handling.

## Reserved words and naming

Do not use GLSL keywords or qualifiers as identifiers. That includes names such as:

- `layout`
- `attribute`
- `varying`
- `uniform`
- `in`
- `out`
- `const`

Use descriptive names like `centeredUv`, `pulseColor`, `ringRadius`, or `noiseAmount` instead.

## Features that are not supported in Shadily right now

Some of these are valid GLSL in general, but they do not fit this project's current compiler or Three.js setup.

### GLSL 3 syntax

Do not use GLSL 3 / `#version 300 es` features in project shaders right now, including:

- `layout(...)` qualifiers
- `in` / `out` stage interfaces replacing `attribute` / `varying`
- explicit fragment outputs such as `out vec4 fragColor;`
- interface blocks

Reason:

- Three.js `ShaderMaterial` supports `THREE.GLSL1` and `THREE.GLSL3`, but this project leaves `glslVersion` unset
- the generated fragment shader in Shadily uses `varying` and `gl_FragColor`, which is the GLSL1-style pipeline

### Optional extension-dependent fragment functions

Avoid relying on derivative functions such as:

- `dFdx`
- `dFdy`
- `fwidth`

Reason:

- MDN documents these as extension-gated in WebGL1 through `OES_standard_derivatives`
- Shadily's preview material does not enable shader extensions on `ShaderMaterial`

If the renderer path is upgraded later, this can be revisited.

### Graph parser and runtime limits

Even if plain GLSL could support them, Shadily's current graph parser and uniform bridge do not support these as graph-facing node signature types:

- matrix types such as `mat2`, `mat3`, `mat4`
- sampler types such as `sampler2D`
- arrays
- structs
- unsigned integer vector families

For custom node signatures, Shadily currently recognizes only:

```txt
bool
float
int
vec2
vec3
vec4
```

That limitation comes from the app's own parser and graph schema, not from GLSL itself.
