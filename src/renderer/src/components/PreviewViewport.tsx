import { type JSX, useDeferredValue, useEffect, useRef } from "react";
import * as THREE from "three";
import {
  DEFAULT_FRAGMENT_SHADER,
  DEFAULT_VERTEX_SHADER,
} from "../../../shared/default-project";
import {
  previewFrame,
  previewFrameStale,
  viewportHost,
} from "../app-shell.css";
import { cx } from "../lib/cx";
import { registerPreviewCaptureHandler } from "../preview-capture";
import {
  compilePreviewMaterial,
  createPreviewMaterial,
} from "../preview-compile";
import { createPreviewRevision, usePreviewStore } from "../store/preview-store";
import {
  getProjectShaderSource,
  useProjectStore,
} from "../store/project-store";
import { darkThemeValues } from "../theme";

const PREVIEW_CAPTURE_SIZE = 200;

const encodeCaptureDataUrl = (
  pixels: Uint8Array,
  width: number,
  height: number,
): string | null => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (context === null) {
    return null;
  }

  const flippedPixels = new Uint8ClampedArray(width * height * 4);

  for (let y = 0; y < height; y += 1) {
    const sourceOffset = y * width * 4;
    const destinationOffset = (height - y - 1) * width * 4;

    flippedPixels.set(
      pixels.subarray(sourceOffset, sourceOffset + width * 4),
      destinationOffset,
    );
  }

  context.putImageData(new ImageData(flippedPixels, width, height), 0, 0);

  return canvas.toDataURL("image/png");
};

export const PreviewViewport = (): JSX.Element => {
  const fragmentSource = useProjectStore((state) =>
    getProjectShaderSource(state.project, "fragment"),
  );
  const vertexSource = useProjectStore((state) =>
    getProjectShaderSource(state.project, "vertex"),
  );
  const isPreviewStale = usePreviewStore((state) => state.isStale);

  const deferredFragment = useDeferredValue(fragmentSource);
  const deferredVertex = useDeferredValue(vertexSource);
  const deferredRevision = createPreviewRevision(
    deferredFragment,
    deferredVertex,
  );

  const hostRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Mesh<
    THREE.SphereGeometry,
    THREE.Material
  > | null>(null);

  useEffect(
    () =>
      registerPreviewCaptureHandler(async () => {
        const scene = sceneRef.current;
        const renderer = rendererRef.current;
        const camera = cameraRef.current;

        if (scene === null || renderer === null || camera === null) {
          return null;
        }

        const renderTarget = new THREE.WebGLRenderTarget(
          PREVIEW_CAPTURE_SIZE,
          PREVIEW_CAPTURE_SIZE,
        );
        const pixels = new Uint8Array(
          PREVIEW_CAPTURE_SIZE * PREVIEW_CAPTURE_SIZE * 4,
        );
        const previousRenderTarget = renderer.getRenderTarget();
        const previousAspect = camera.aspect;

        try {
          camera.aspect = 1;
          camera.updateProjectionMatrix();

          renderer.setRenderTarget(renderTarget);
          renderer.render(scene, camera);
          renderer.readRenderTargetPixels(
            renderTarget,
            0,
            0,
            PREVIEW_CAPTURE_SIZE,
            PREVIEW_CAPTURE_SIZE,
            pixels,
          );

          return encodeCaptureDataUrl(
            pixels,
            PREVIEW_CAPTURE_SIZE,
            PREVIEW_CAPTURE_SIZE,
          );
        } catch (error) {
          console.error("Failed to capture the preview viewport.", error);
          return null;
        } finally {
          camera.aspect = previousAspect;
          camera.updateProjectionMatrix();
          renderer.setRenderTarget(previousRenderTarget);
          renderTarget.dispose();
          renderer.render(scene, camera);
        }
      }),
    [],
  );

  useEffect(() => {
    const host = hostRef.current;

    if (host === null) {
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(darkThemeValues.color.preview.scene);

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

    const geometry = new THREE.SphereGeometry(1, 256, 128);
    const material = createPreviewMaterial(
      DEFAULT_FRAGMENT_SHADER,
      DEFAULT_VERTEX_SHADER,
    );
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const hemiLight = new THREE.HemisphereLight(
      darkThemeValues.color.preview.lightWarm,
      darkThemeValues.color.preview.lightCool,
      1.6,
    );
    const keyLight = new THREE.DirectionalLight(
      darkThemeValues.color.preview.lightKey,
      2.4,
    );
    keyLight.position.set(2, 3, 4);
    scene.add(hemiLight, keyLight);

    sceneRef.current = scene;
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
      mesh.rotation.x;
      mesh.rotation.y += 0.001;
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
      sceneRef.current = null;
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

    usePreviewStore.getState().markAttempted(deferredRevision);

    const compileResult = compilePreviewMaterial(
      renderer,
      camera,
      mesh.geometry,
      deferredFragment,
      deferredVertex,
    );

    if (compileResult.kind === "error") {
      usePreviewStore
        .getState()
        .markStale(deferredRevision, compileResult.message);
      return;
    }

    const previousMaterial = mesh.material;
    mesh.material = compileResult.material;
    previousMaterial.dispose();
    usePreviewStore.getState().markReady(deferredRevision);
  }, [deferredFragment, deferredRevision, deferredVertex]);

  return (
    <div className={cx(previewFrame, isPreviewStale && previewFrameStale)}>
      <div className={viewportHost} ref={hostRef} />
    </div>
  );
};
