import { type JSX, useDeferredValue, useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { shadilyApi } from "../api/shadily-api";
import {
  previewFrame,
  previewFrameStale,
  viewportHost,
} from "../app-shell.css";
import type { GraphUniformValues } from "../components/graph/graph-types";
import { usePreviewGraphShader } from "../components/graph/internal/use-preview-graph-shader";
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
import {
  applyPreviewMeshTransform,
  createPreviewGeometry,
} from "../preview-geometry";
import { createPreviewRevision, usePreviewStore } from "../store/preview-store";
import {
  getProjectVertexSource,
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

const getErrorMessage = (error: unknown, fallbackMessage: string): string =>
  error instanceof Error ? error.message : fallbackMessage;

const EMPTY_GRAPH_UNIFORM_VALUES: GraphUniformValues = Object.freeze({});

export const PreviewViewport = (): JSX.Element => {
  const isPreviewStale = usePreviewStore((state) => state.isStale);
  const previewGraphShader = usePreviewGraphShader();
  const project = useProjectStore((s) => s.project);
  const previewMesh = project?.manifest.preview.mesh ?? "sphere";

  const fragmentSource = previewGraphShader.fragmentSource;
  const vertexSource = getProjectVertexSource(project);
  const activeUniformValues =
    fragmentSource === null
      ? EMPTY_GRAPH_UNIFORM_VALUES
      : previewGraphShader.uniformValues;

  const deferredFragment = useDeferredValue(fragmentSource);
  const deferredVertex = useDeferredValue(vertexSource);
  const deferredRevision =
    deferredFragment === null
      ? null
      : createPreviewRevision(deferredFragment, deferredVertex);

  const hostRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshRef = useRef<THREE.Mesh<
    THREE.BufferGeometry,
    THREE.Material
  > | null>(null);
  const activeUniformValuesRef =
    useRef<GraphUniformValues>(activeUniformValues);
  const fragmentSourceRef = useRef<string | null>(fragmentSource);
  const vertexSourceRef = useRef(vertexSource);
  const graphErrorsRef = useRef<readonly string[]>(previewGraphShader.errors);
  const hasInitializedSceneRef = useRef(false);

  useEffect(() => {
    activeUniformValuesRef.current = activeUniformValues;
  }, [activeUniformValues]);

  useEffect(() => {
    fragmentSourceRef.current = fragmentSource;
  }, [fragmentSource]);

  useEffect(() => {
    vertexSourceRef.current = vertexSource;
  }, [vertexSource]);

  useEffect(() => {
    graphErrorsRef.current = previewGraphShader.errors;
  }, [previewGraphShader.errors]);

  useEffect(() => {
    if (fragmentSource !== null || previewGraphShader.errors.length === 0) {
      return;
    }

    usePreviewStore.getState().markFailure({
      stage: "compile",
      message: previewGraphShader.errors.join("\n\n"),
      revision: null,
    });
  }, [fragmentSource, previewGraphShader.errors]);

  // Handle MCP compile-check requests from the main process.
  useEffect(() => {
    const unsub = shadilyApi.preview.onCompileCheck((requestId) => {
      const currentFragmentSource = fragmentSourceRef.current;
      const currentGraphErrors = graphErrorsRef.current;

      if (currentGraphErrors.length > 0 || currentFragmentSource === null) {
        const error =
          currentGraphErrors.length > 0
            ? currentGraphErrors.join("\n\n")
            : "No compiled fragment shader is available.";

        usePreviewStore.getState().markFailure({
          stage: "compile",
          message: error,
          revision: null,
        });
        void shadilyApi.preview.respondCompile(requestId, {
          success: false,
          error,
        });
        return;
      }

      const renderer = rendererRef.current;
      const camera = cameraRef.current;
      const mesh = meshRef.current;

      if (renderer === null || camera === null || mesh === null) {
        const error = "Preview renderer is unavailable.";
        usePreviewStore.getState().markFailure({
          stage: "compile",
          message: error,
          revision: null,
        });
        void shadilyApi.preview.respondCompile(requestId, {
          success: false,
          error,
        });
        return;
      }

      const compileResult = compilePreviewMaterial(
        renderer,
        camera,
        mesh.geometry,
        currentFragmentSource,
        vertexSourceRef.current,
        activeUniformValuesRef.current,
      );

      if (compileResult.kind === "error") {
        usePreviewStore.getState().markFailure({
          stage: "compile",
          message: compileResult.message,
        });
        void shadilyApi.preview.respondCompile(requestId, {
          success: false,
          error: compileResult.message,
        });
        return;
      }

      compileResult.material.dispose();
      usePreviewStore.getState().clearFailureStage("compile");
      void shadilyApi.preview.respondCompile(requestId, {
        success: true,
      });
    });
    return unsub;
  }, []);

  // Handle MCP capture-at requests from the main process.
  useEffect(() => {
    const unsub = shadilyApi.preview.onCaptureAt(async (requestId, _uTime) => {
      const result = await captureRegisteredPreview();
      if (result.kind === "success") {
        void shadilyApi.preview.respondCapture(requestId, result.dataUrl);
      } else {
        void shadilyApi.preview.respondCapture(requestId, null, result.message);
      }
    });
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
    if (hasInitializedSceneRef.current || fragmentSource === null) {
      return;
    }

    const host = hostRef.current;

    if (host === null) {
      return;
    }

    let scene: THREE.Scene | null = null;
    let renderer: THREE.WebGLRenderer | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let controls: OrbitControls | null = null;
    let geometry: THREE.BufferGeometry | null = null;
    let mesh: THREE.Mesh<THREE.BufferGeometry, THREE.Material> | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let frameId = 0;

    hasInitializedSceneRef.current = true;

    try {
      scene = new THREE.Scene();

      camera = new THREE.PerspectiveCamera(
        55,
        Math.max(host.clientWidth, 1) / Math.max(host.clientHeight, 1),
        0.1,
        100,
      );
      camera.position.set(0, 0.6, 2.4);
      camera.lookAt(0, 0, 0);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(
        Math.max(host.clientWidth, 1),
        Math.max(host.clientHeight, 1),
      );
      host.append(renderer.domElement);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.07;
      controls.minDistance = 1.2;
      controls.maxDistance = 10;

      geometry = createPreviewGeometry(previewMesh);
      const material = createPreviewMaterial(
        fragmentSource,
        vertexSource,
        activeUniformValuesRef.current,
      );
      mesh = new THREE.Mesh(geometry, material);
      applyPreviewMeshTransform(mesh, previewMesh);
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
      controlsRef.current = controls;
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
          controls === null ||
          mesh === null
        ) {
          return;
        }

        try {
          const activeMaterial = mesh.material;
          if (activeMaterial instanceof THREE.ShaderMaterial) {
            const timeUniform = activeMaterial.uniforms.u_time;
            if (timeUniform !== undefined) {
              timeUniform.value = clock.getElapsedTime();
            }
          }
          controls.update();
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
      hasInitializedSceneRef.current = false;
      usePreviewStore.getState().markFailure({
        stage: "render",
        message: getErrorMessage(error, "Preview rendering failed."),
      });
    }

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      controls?.dispose();
      geometry?.dispose();
      mesh?.material.dispose();
      renderer?.dispose();
      host.textContent = "";
      sceneRef.current = null;
      rendererRef.current = null;
      cameraRef.current = null;
      controlsRef.current = null;
      meshRef.current = null;
      hasInitializedSceneRef.current = false;
    };
  }, [fragmentSource, previewMesh, vertexSource]);

  useEffect(() => {
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    const mesh = meshRef.current;

    if (
      renderer === null ||
      camera === null ||
      mesh === null ||
      deferredFragment === null ||
      deferredRevision === null
    ) {
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

  useEffect(() => {
    const mesh = meshRef.current;
    if (mesh === null) return;
    const old = mesh.geometry;
    mesh.geometry = createPreviewGeometry(previewMesh);
    applyPreviewMeshTransform(mesh, previewMesh);
    old.dispose();
  }, [previewMesh]);

  return (
    <div
      className={cx(previewFrame, isPreviewStale && previewFrameStale)}
      data-testid="preview-frame"
    >
      <div
        className={viewportHost}
        data-testid="preview-viewport"
        ref={hostRef}
      />
    </div>
  );
};
