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
import type { GraphUniformValues } from "../components/graph/graph-types";
import { cx } from "../lib/cx";
import {
  captureRegisteredPreview,
  registerPreviewCaptureHandler,
} from "../preview-capture";
import {
  applyPreviewUniforms,
  compilePreviewMaterial,
  createPreviewMaterial,
} from "../preview-compile";
import { useGraphPreviewStore } from "../store/graph-preview-store";
import { createPreviewRevision, usePreviewStore } from "../store/preview-store";
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

const getErrorMessage = (error: unknown, fallbackMessage: string): string =>
  error instanceof Error ? error.message : fallbackMessage;

const EMPTY_GRAPH_UNIFORM_VALUES: GraphUniformValues = Object.freeze({});

export const PreviewViewport = (): JSX.Element => {
  const graphFragmentSource = useGraphPreviewStore(
    (state) => state.fragmentShaderSource,
  );
  const graphUniformValues = useGraphPreviewStore(
    (state) => state.uniformValues,
  );
  const isPreviewStale = usePreviewStore((state) => state.isStale);

  const fragmentSource = graphFragmentSource ?? DEFAULT_FRAGMENT_SHADER;
  const vertexSource = DEFAULT_VERTEX_SHADER;
  const activeUniformValues = graphFragmentSource === null
    ? EMPTY_GRAPH_UNIFORM_VALUES
    : graphUniformValues;

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
  const activeUniformValuesRef =
    useRef<GraphUniformValues>(activeUniformValues);

  useEffect(() => {
    activeUniformValuesRef.current = activeUniformValues;
  }, [activeUniformValues]);

  // Handle MCP compile-check requests from the main process.
  useEffect(() => {
    const unsub = window.shadily.preview.onCompileCheck((requestId) => {
      const compileDiag = usePreviewStore.getState().diagnostics.compile;
      void window.shadily.preview.respondCompile(requestId, {
        success: compileDiag === null,
        error: compileDiag?.message,
      });
    });
    return unsub;
  }, []);

  // Handle MCP capture-at requests from the main process.
  useEffect(() => {
    const unsub = window.shadily.preview.onCaptureAt(
      async (requestId, _uTime) => {
        const result = await captureRegisteredPreview();
        if (result.kind === "success") {
          void window.shadily.preview.respondCapture(requestId, result.dataUrl);
        } else {
          void window.shadily.preview.respondCapture(
            requestId,
            null,
            result.message,
          );
        }
      },
    );
    return unsub;
  }, []);

  useEffect(
    () =>
      registerPreviewCaptureHandler(async () => {
        const scene = sceneRef.current;
        const renderer = rendererRef.current;
        const camera = cameraRef.current;
        const previewState = usePreviewStore.getState();
        const captureRevision =
          previewState.activeRevision ?? previewState.lastSuccessfulRevision;

        if (scene === null || renderer === null || camera === null) {
          const message = "Preview capture is unavailable.";
          previewState.markFailure({
            stage: "capture",
            message,
            revision: captureRevision,
          });

          return {
            kind: "error",
            message,
          };
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
        } catch (error) {
          const message = getErrorMessage(
            error,
            "Failed to capture the preview viewport.",
          );
          usePreviewStore.getState().markFailure({
            stage: "capture",
            message,
            revision: captureRevision,
          });

          return {
            kind: "error",
            message,
          };
        } finally {
          camera.aspect = previousAspect;
          camera.updateProjectionMatrix();
          renderer.setRenderTarget(previousRenderTarget);
          renderTarget.dispose();
          try {
            renderer.render(scene, camera);
          } catch (error) {
            usePreviewStore.getState().markFailure({
              stage: "render",
              message: getErrorMessage(error, "Preview rendering failed."),
            });
          }
        }

        const dataUrl = encodeCaptureDataUrl(
          pixels,
          PREVIEW_CAPTURE_SIZE,
          PREVIEW_CAPTURE_SIZE,
        );

        if (dataUrl === null) {
          const message = "Preview capture could not be encoded as PNG.";
          usePreviewStore.getState().markFailure({
            stage: "capture",
            message,
            revision: captureRevision,
          });

          return {
            kind: "error",
            message,
          };
        }

        usePreviewStore.getState().clearFailureStage("capture");

        return {
          kind: "success",
          dataUrl,
        };
      }),
    [],
  );

  useEffect(() => {
    const host = hostRef.current;

    if (host === null) {
      return;
    }

    let scene: THREE.Scene | null = null;
    let renderer: THREE.WebGLRenderer | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let geometry: THREE.SphereGeometry | null = null;
    let mesh: THREE.Mesh<THREE.SphereGeometry, THREE.Material> | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let frameId = 0;

    try {
      scene = new THREE.Scene();
      scene.background = new THREE.Color(darkThemeValues.color.preview.scene);

      camera = new THREE.PerspectiveCamera(
        55,
        Math.max(host.clientWidth, 1) / Math.max(host.clientHeight, 1),
        0.1,
        100,
      );
      camera.position.set(0, 0.6, 2.4);
      camera.lookAt(0, 0, 0);

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(
        Math.max(host.clientWidth, 1),
        Math.max(host.clientHeight, 1),
      );
      host.append(renderer.domElement);

      geometry = new THREE.SphereGeometry(1, 256, 128);
      const material = createPreviewMaterial(
        DEFAULT_FRAGMENT_SHADER,
        DEFAULT_VERTEX_SHADER,
        EMPTY_GRAPH_UNIFORM_VALUES,
      );
      mesh = new THREE.Mesh(geometry, material);
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
        if (camera === null || renderer === null) {
          return;
        }

        const width = Math.max(host.clientWidth, 1);
        const height = Math.max(host.clientHeight, 1);

        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      };

      syncViewportSize();

      resizeObserver = new ResizeObserver(() => {
        syncViewportSize();
      });

      resizeObserver.observe(host);

      const clock = new THREE.Clock();

      const renderFrame = (): void => {
        if (
          scene === null ||
          renderer === null ||
          camera === null ||
          mesh === null
        ) {
          return;
        }

        try {
          mesh.rotation.y += 0.001;
          const activeMaterial = mesh.material;
          if (activeMaterial instanceof THREE.ShaderMaterial) {
            const timeUniform = activeMaterial.uniforms.u_time;
            if (timeUniform !== undefined) {
              timeUniform.value = clock.getElapsedTime();
            }
          }
          renderer.render(scene, camera);
          usePreviewStore.getState().clearFailureStage("render");
        } catch (error) {
          usePreviewStore.getState().markFailure({
            stage: "render",
            message: getErrorMessage(error, "Preview rendering failed."),
          });
        }

        frameId = window.requestAnimationFrame(renderFrame);
      };

      renderFrame();
    } catch (error) {
      usePreviewStore.getState().markFailure({
        stage: "render",
        message: getErrorMessage(error, "Preview rendering failed."),
      });
    }

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      geometry?.dispose();
      mesh?.material.dispose();
      renderer?.dispose();
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
      activeUniformValuesRef.current,
    );

    if (compileResult.kind === "error") {
      usePreviewStore.getState().markFailure({
        stage: "compile",
        revision: deferredRevision,
        message: compileResult.message,
      });
      return;
    }

    const previousMaterial = mesh.material;
    mesh.material = compileResult.material;
    previousMaterial.dispose();
    usePreviewStore.getState().markReady(deferredRevision);
  }, [deferredFragment, deferredRevision, deferredVertex]);

  useEffect(() => {
    const mesh = meshRef.current;

    if (mesh === null) {
      return;
    }

    const material = mesh.material;

    if (!(material instanceof THREE.ShaderMaterial)) {
      return;
    }

    applyPreviewUniforms(material, activeUniformValues);
  }, [activeUniformValues]);

  return (
    <div className={cx(previewFrame, isPreviewStale && previewFrameStale)}>
      <div className={viewportHost} ref={hostRef} />
    </div>
  );
};
