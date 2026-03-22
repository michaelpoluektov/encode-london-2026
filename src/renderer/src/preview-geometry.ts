import * as THREE from "three";
import type { PreviewModelId } from "../../shared/default-project";

const CUBE_PREVIEW_X_ROTATION = -Math.atan(Math.SQRT1_2);
const CUBE_PREVIEW_Y_ROTATION = Math.PI / 4;

export const createPreviewGeometry = (
  mesh: PreviewModelId,
): THREE.BufferGeometry => {
  switch (mesh) {
    case "sphere":
      return new THREE.SphereGeometry(1, 64, 32);
    case "plane":
      return new THREE.PlaneGeometry(2.4, 2.4, 1, 1);
    case "torus":
      return new THREE.TorusGeometry(0.7, 0.3, 64, 128);
    case "cube":
      return new THREE.BoxGeometry(1.6, 1.6, 1.6, 1, 1, 1);
  }
};

export const applyPreviewMeshTransform = (
  meshObject: THREE.Mesh<THREE.BufferGeometry, THREE.Material>,
  mesh: PreviewModelId,
): void => {
  meshObject.position.set(0, 0, 0);
  meshObject.rotation.set(0, 0, 0);

  if (mesh === "cube") {
    meshObject.rotation.set(
      CUBE_PREVIEW_X_ROTATION,
      CUBE_PREVIEW_Y_ROTATION,
      0,
    );
  }
};
