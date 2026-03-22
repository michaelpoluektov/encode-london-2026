import * as THREE from "three";
import type { PreviewModelId } from "../../shared/default-project";

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
