import { type JSX, useDeferredValue, useEffect, useRef } from "react";
import * as THREE from "three";
import { previewFrame, viewportHost } from "../app-shell.css";
import {
  PREVIEW_VERTEX_SHADER,
  STARTER_FRAGMENT_SHADER,
} from "../shader-source";
import { useAppStore } from "../store/app-store";

const createPreviewMaterial = (fragmentShader: string): THREE.ShaderMaterial =>
  new THREE.ShaderMaterial({
    fragmentShader,
    side: THREE.DoubleSide,
    uniforms: {
      u_time: { value: 0 },
    },
    vertexShader: PREVIEW_VERTEX_SHADER,
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

export const PreviewViewport = (): JSX.Element => {
  const shaderSource = useAppStore((state) => state.shaderSource);
  const deferredShaderSource = useDeferredValue(shaderSource);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Mesh<
    THREE.TorusKnotGeometry,
    THREE.Material
  > | null>(null);

  useEffect(() => {
    const host = hostRef.current;

    if (host === null) {
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#09101f");

    const camera = new THREE.PerspectiveCamera(
      55,
      Math.max(host.clientWidth, 1) / Math.max(host.clientHeight, 1),
      0.1,
      100,
    );
    camera.position.set(0, 0.6, 2.4);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(
      Math.max(host.clientWidth, 1),
      Math.max(host.clientHeight, 1),
    );
    host.append(renderer.domElement);

    const geometry = new THREE.TorusKnotGeometry(0.55, 0.2, 160, 24);
    const material = createPreviewMaterial(STARTER_FRAGMENT_SHADER);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const hemiLight = new THREE.HemisphereLight("#fdf2c8", "#17304d", 1.6);
    const keyLight = new THREE.DirectionalLight("#ffffff", 2.4);
    keyLight.position.set(2, 3, 4);
    scene.add(hemiLight, keyLight);

    rendererRef.current = renderer;
    cameraRef.current = camera;
    meshRef.current = mesh;

    const syncViewportSize = (): void => {
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    syncViewportSize();

    const resizeObserver = new ResizeObserver(() => {
      syncViewportSize();
    });

    resizeObserver.observe(host);

    let frameId = 0;
    const clock = new THREE.Clock();

    const renderFrame = (): void => {
      mesh.rotation.x += 0.004;
      mesh.rotation.y += 0.007;
      const activeMaterial = mesh.material;
      if (activeMaterial instanceof THREE.ShaderMaterial) {
        const timeUniform = activeMaterial.uniforms.u_time;
        if (timeUniform !== undefined) {
          timeUniform.value = clock.getElapsedTime();
        }
      }
      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(renderFrame);
    };

    renderFrame();

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      geometry.dispose();
      mesh.material.dispose();
      renderer.dispose();
      host.textContent = "";
      rendererRef.current = null;
      cameraRef.current = null;
      meshRef.current = null;
    };
  }, []);

  useEffect(() => {
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    const mesh = meshRef.current;

    if (renderer === null || camera === null || mesh === null) {
      return;
    }

    const candidateMaterial = createPreviewMaterial(deferredShaderSource);
    const compileScene = new THREE.Scene();
    const compileMesh = new THREE.Mesh(mesh.geometry, candidateMaterial);
    compileScene.add(compileMesh);

    const previousShaderErrorHandler = renderer.debug.onShaderError;
    let shaderError: string | null = null;

    renderer.debug.onShaderError = (
      gl,
      program,
      vertexShader,
      fragmentShader,
    ) => {
      shaderError = formatShaderError(
        gl,
        program,
        vertexShader,
        fragmentShader,
      );
    };

    try {
      renderer.compile(compileScene, camera);
    } catch (error) {
      shaderError =
        error instanceof Error
          ? error.message
          : "Three.js shader compilation failed.";
    } finally {
      renderer.debug.onShaderError = previousShaderErrorHandler;
    }

    if (shaderError !== null) {
      candidateMaterial.dispose();
      console.error(
        "The fragment shader did not compile. The previous valid shader is still rendering.\n\n%s",
        shaderError,
      );
      return;
    }

    const previousMaterial = mesh.material;
    mesh.material = candidateMaterial;
    previousMaterial.dispose();
  }, [deferredShaderSource]);

  return (
    <div className={previewFrame}>
      <div className={viewportHost} ref={hostRef} />
    </div>
  );
};
