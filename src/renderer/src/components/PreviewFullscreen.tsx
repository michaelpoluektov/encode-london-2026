import {
  type JSX,
  useCallback,
  useDeferredValue,
  useEffect,
  useRef,
} from "react";
import { createPortal } from "react-dom";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  PREVIEW_MODELS,
  type PreviewModelId,
} from "../../../shared/default-project";
import {
  applyPreviewUniforms,
  compilePreviewMaterial,
  createPreviewMaterial,
} from "../preview-compile";
import {
  applyPreviewMeshTransform,
  createPreviewGeometry,
} from "../preview-geometry";
import {
  getProjectVertexSource,
  useProjectStore,
} from "../store/project-store";
import { saveCurrentProject } from "../store/save-project";
import { darkThemeValues } from "../theme";
import type { GraphUniformValues } from "./graph/graph-types";
import { usePreviewGraphShader } from "./graph/internal/use-preview-graph-shader";
import {
  closeButton,
  hint,
  modelSelect,
  overlay,
  sceneHost,
  topBar,
} from "./preview-fullscreen.css";
import { CloseIcon } from "./ui/icons";

const EMPTY_UNIFORM_VALUES: GraphUniformValues = Object.freeze({});

const DEFAULT_CAMERA_POSITION = new THREE.Vector3(0, 0.6, 2.4);
const DEFAULT_CAMERA_TARGET = new THREE.Vector3(0, 0, 0);

type PreviewFullscreenProps = {
  readonly onClose: () => void;
};

export const PreviewFullscreen = ({
  onClose,
}: PreviewFullscreenProps): JSX.Element => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Mesh<
    THREE.BufferGeometry,
    THREE.Material
  > | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const hasInitializedSceneRef = useRef(false);

  const previewGraphShader = usePreviewGraphShader();
  const project = useProjectStore((s) => s.project);
  const previewMesh = project?.manifest.preview.mesh ?? "sphere";
  const updatePreviewMesh = useProjectStore((s) => s.updatePreviewMesh);

  const handleSelectMesh = useCallback(
    (mesh: PreviewModelId) => {
      updatePreviewMesh(mesh);
      void saveCurrentProject();
    },
    [updatePreviewMesh],
  );

  const fragmentSource = previewGraphShader.fragmentSource;
  const vertexSource = getProjectVertexSource(project);
  const activeUniformValues =
    fragmentSource === null
      ? EMPTY_UNIFORM_VALUES
      : previewGraphShader.uniformValues;
  const activeUniformValuesRef =
    useRef<GraphUniformValues>(activeUniformValues);

  useEffect(() => {
    activeUniformValuesRef.current = activeUniformValues;
  }, [activeUniformValues]);

  const deferredFragment = useDeferredValue(fragmentSource);
  const deferredVertex = useDeferredValue(vertexSource);

  // Scene setup
  useEffect(() => {
    if (hasInitializedSceneRef.current || fragmentSource === null) return;

    const host = hostRef.current;
    if (host === null) return;

    let scene: THREE.Scene | null = null;
    let renderer: THREE.WebGLRenderer | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let geometry: THREE.BufferGeometry | null = null;
    let mesh: THREE.Mesh<THREE.BufferGeometry, THREE.Material> | null = null;
    let controls: OrbitControls | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let frameId = 0;

    hasInitializedSceneRef.current = true;

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
      55,
      Math.max(host.clientWidth, 1) / Math.max(host.clientHeight, 1),
      0.1,
      100,
    );
    camera.position.copy(DEFAULT_CAMERA_POSITION);
    camera.lookAt(DEFAULT_CAMERA_TARGET);

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
    controls.saveState();

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
    meshRef.current = mesh;
    controlsRef.current = controls;

    const syncSize = (): void => {
      if (camera === null || renderer === null) return;
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    syncSize();
    resizeObserver = new ResizeObserver(syncSize);
    resizeObserver.observe(host);

    const clock = new THREE.Clock();

    const renderFrame = (): void => {
      if (
        scene === null ||
        renderer === null ||
        camera === null ||
        mesh === null ||
        controls === null
      ) {
        return;
      }

      const activeMaterial = mesh.material;
      if (activeMaterial instanceof THREE.ShaderMaterial) {
        const timeUniform = activeMaterial.uniforms.u_time;
        if (timeUniform !== undefined) {
          timeUniform.value = clock.getElapsedTime();
        }
      }

      controls.update();
      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(renderFrame);
    };

    renderFrame();

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
      meshRef.current = null;
      controlsRef.current = null;
      hasInitializedSceneRef.current = false;
    };
  }, [fragmentSource, previewMesh, vertexSource]);

  // Shader recompilation
  useEffect(() => {
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    const mesh = meshRef.current;
    if (
      renderer === null ||
      camera === null ||
      mesh === null ||
      deferredFragment === null
    ) {
      return;
    }

    const compileResult = compilePreviewMaterial(
      renderer,
      camera,
      mesh.geometry,
      deferredFragment,
      deferredVertex,
      activeUniformValuesRef.current,
    );

    if (compileResult.kind === "error") return;

    const prev = mesh.material;
    mesh.material = compileResult.material;
    prev.dispose();
  }, [deferredFragment, deferredVertex]);

  // Uniform updates
  useEffect(() => {
    const mesh = meshRef.current;
    if (mesh === null) return;
    const material = mesh.material;
    if (!(material instanceof THREE.ShaderMaterial)) return;
    applyPreviewUniforms(material, activeUniformValues);
  }, [activeUniformValues]);

  // Geometry swap when model changes
  useEffect(() => {
    const mesh = meshRef.current;
    if (mesh === null) return;
    const old = mesh.geometry;
    mesh.geometry = createPreviewGeometry(previewMesh);
    applyPreviewMeshTransform(mesh, previewMesh);
    old.dispose();
  }, [previewMesh]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "r" || e.key === "R") {
        controlsRef.current?.reset();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const content = (
    <div className={overlay}>
      <div className={sceneHost} ref={hostRef} />
      <div className={topBar}>
        <select
          className={modelSelect}
          value={previewMesh}
          onChange={(e) => {
            handleSelectMesh(e.currentTarget.value as PreviewModelId);
          }}
        >
          {PREVIEW_MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
        <button
          aria-label="Close fullscreen preview"
          className={closeButton}
          type="button"
          onClick={onClose}
        >
          <CloseIcon size={12} />
        </button>
      </div>
      <div className={hint}>
        Drag to orbit · Scroll to zoom · Right-drag to pan · R to reset · Esc to
        close
      </div>
    </div>
  );

  return createPortal(content, document.body);
};
