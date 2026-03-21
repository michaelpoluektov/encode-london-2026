import * as THREE from "three";
import type {
  GraphUniformValue,
  GraphUniformValues,
} from "./components/graph/graph-types";

export type PreviewCompileResult =
  | {
      readonly kind: "success";
      readonly material: THREE.ShaderMaterial;
    }
  | {
      readonly kind: "error";
      readonly message: string;
    };

const createPreviewUniformValue = (
  value: GraphUniformValue,
): boolean | number | THREE.Vector2 | THREE.Vector3 | THREE.Vector4 => {
  if (typeof value === "boolean" || typeof value === "number") {
    return value;
  }

  if ("w" in value) {
    return new THREE.Vector4(value.x, value.y, value.z, value.w);
  }

  if ("z" in value) {
    return new THREE.Vector3(value.x, value.y, value.z);
  }

  return new THREE.Vector2(value.x, value.y);
};

const assignPreviewUniformValue = (
  uniform: THREE.IUniform<unknown>,
  value: GraphUniformValue,
): void => {
  if (typeof value === "boolean" || typeof value === "number") {
    uniform.value = value;
    return;
  }

  if ("w" in value) {
    if (uniform.value instanceof THREE.Vector4) {
      uniform.value.set(value.x, value.y, value.z, value.w);
      return;
    }

    uniform.value = new THREE.Vector4(value.x, value.y, value.z, value.w);
    return;
  }

  if ("z" in value) {
    if (uniform.value instanceof THREE.Vector3) {
      uniform.value.set(value.x, value.y, value.z);
      return;
    }

    uniform.value = new THREE.Vector3(value.x, value.y, value.z);
    return;
  }

  if (uniform.value instanceof THREE.Vector2) {
    uniform.value.set(value.x, value.y);
    return;
  }

  uniform.value = new THREE.Vector2(value.x, value.y);
};

const createPreviewUniforms = (
  uniformValues: GraphUniformValues,
): Record<string, THREE.IUniform<unknown>> => ({
  u_time: { value: 0 },
  ...Object.fromEntries(
    Object.entries(uniformValues).map(([name, value]) => [
      name,
      { value: createPreviewUniformValue(value) },
    ]),
  ),
});

export const createPreviewMaterial = (
  fragmentShader: string,
  vertexShader: string,
  uniformValues: GraphUniformValues = {},
): THREE.ShaderMaterial =>
  new THREE.ShaderMaterial({
    fragmentShader,
    side: THREE.DoubleSide,
    uniforms: createPreviewUniforms(uniformValues),
    vertexShader,
  });

export const applyPreviewUniforms = (
  material: THREE.ShaderMaterial,
  uniformValues: GraphUniformValues,
): void => {
  for (const [name, value] of Object.entries(uniformValues)) {
    const existingUniform = material.uniforms[name];

    if (existingUniform === undefined) {
      material.uniforms[name] = {
        value: createPreviewUniformValue(value),
      };
      continue;
    }

    assignPreviewUniformValue(existingUniform, value);
  }
};

const formatShaderError = (
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader,
): string => {
  const lines = [
    gl.getProgramInfoLog(program)?.trim(),
    gl.getShaderInfoLog(fragmentShader)?.trim(),
    gl.getShaderInfoLog(vertexShader)?.trim(),
  ].filter((line): line is string => line !== undefined && line.length > 0);

  return lines.join("\n\n");
};

export const compilePreviewMaterial = (
  renderer: THREE.WebGLRenderer,
  camera: THREE.Camera,
  geometry: THREE.BufferGeometry,
  fragmentShader: string,
  vertexShader: string,
  uniformValues: GraphUniformValues = {},
): PreviewCompileResult => {
  const candidateMaterial = createPreviewMaterial(
    fragmentShader,
    vertexShader,
    uniformValues,
  );
  const compileScene = new THREE.Scene();
  const compileMesh = new THREE.Mesh(geometry, candidateMaterial);
  const compileRenderTarget = new THREE.WebGLRenderTarget(1, 1);
  const previousRenderTarget = renderer.getRenderTarget();
  compileScene.add(compileMesh);

  const previousShaderErrorHandler = renderer.debug.onShaderError;
  let shaderError: string | null = null;

  renderer.debug.onShaderError = (
    gl,
    program,
    nextVertexShader,
    nextFragmentShader,
  ) => {
    shaderError = formatShaderError(
      gl,
      program,
      nextVertexShader,
      nextFragmentShader,
    );
  };

  try {
    renderer.compile(compileScene, camera);
    renderer.setRenderTarget(compileRenderTarget);
    renderer.render(compileScene, camera);
  } catch (error) {
    shaderError =
      error instanceof Error
        ? error.message
        : "Three.js shader compilation failed.";
  } finally {
    renderer.debug.onShaderError = previousShaderErrorHandler;
    renderer.setRenderTarget(previousRenderTarget);
    compileRenderTarget.dispose();
    compileScene.remove(compileMesh);
  }

  if (shaderError !== null) {
    candidateMaterial.dispose();

    return {
      kind: "error",
      message: shaderError,
    };
  }

  return {
    kind: "success",
    material: candidateMaterial,
  };
};
