import * as THREE from "three";

export type PreviewCompileResult =
  | {
      readonly kind: "success";
      readonly material: THREE.ShaderMaterial;
    }
  | {
      readonly kind: "error";
      readonly message: string;
    };

export const createPreviewMaterial = (
  fragmentShader: string,
  vertexShader: string,
): THREE.ShaderMaterial =>
  new THREE.ShaderMaterial({
    fragmentShader,
    side: THREE.DoubleSide,
    uniforms: {
      u_time: { value: 0 },
    },
    vertexShader,
  });

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
): PreviewCompileResult => {
  const candidateMaterial = createPreviewMaterial(fragmentShader, vertexShader);
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
