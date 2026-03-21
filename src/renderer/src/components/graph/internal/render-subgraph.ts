import * as THREE from "three";
import { DEFAULT_VERTEX_SHADER, type PreviewModelId } from "../../../../../shared/default-project";
import type { GraphUniformValues } from "../graph-types";
import { createPreviewMaterial } from "../../../preview-compile";
import { createPreviewGeometry } from "../../../preview-geometry";

// Matches the graphNodeCard background in graph-node.css.ts
const PREVIEW_BACKGROUND_COLOR = 0x262626;

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

export const renderSubgraphToDataUrl = async (
  fragmentSource: string,
  uniformValues: GraphUniformValues,
  width = 240,
  height = 120,
  modelId: PreviewModelId = "sphere",
): Promise<string | null> => {
  const hiddenCanvas = document.createElement("canvas");
  hiddenCanvas.width = width;
  hiddenCanvas.height = height;

  let renderer: THREE.WebGLRenderer | null = null;
  let geometry: THREE.BufferGeometry | null = null;
  let material: THREE.ShaderMaterial | null = null;
  let renderTarget: THREE.WebGLRenderTarget | null = null;

  try {
    renderer = new THREE.WebGLRenderer({ canvas: hiddenCanvas, antialias: false });
    renderer.setPixelRatio(1);
    renderer.setSize(width, height);
    renderer.setClearColor(PREVIEW_BACKGROUND_COLOR, 1);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100);
    camera.position.set(0, 0.6, 2.4);
    camera.lookAt(0, 0, 0);

    geometry = createPreviewGeometry(modelId);
    material = createPreviewMaterial(fragmentSource, DEFAULT_VERTEX_SHADER, uniformValues);

    const scene = new THREE.Scene();
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    renderTarget = new THREE.WebGLRenderTarget(width, height);
    renderer.setRenderTarget(renderTarget);
    renderer.render(scene, camera);

    const pixels = new Uint8Array(width * height * 4);
    renderer.readRenderTargetPixels(renderTarget, 0, 0, width, height, pixels);

    return encodeCaptureDataUrl(pixels, width, height);
  } catch {
    return null;
  } finally {
    renderTarget?.dispose();
    material?.dispose();
    geometry?.dispose();
    renderer?.dispose();
  }
};
