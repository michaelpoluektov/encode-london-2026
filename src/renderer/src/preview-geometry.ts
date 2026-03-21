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
  }
};
