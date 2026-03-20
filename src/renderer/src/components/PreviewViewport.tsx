import { type JSX, useEffect, useRef } from "react";
import * as THREE from "three";
import { previewFrame, viewportHost } from "../app-shell.css";
import { Panel } from "./Panel";

export const PreviewViewport = (): JSX.Element => {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;

    if (host === null) {
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#09101f");

    const camera = new THREE.PerspectiveCamera(
      55,
      host.clientWidth / host.clientHeight,
      0.1,
      100,
    );
    camera.position.set(0, 0.6, 2.4);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(host.clientWidth, host.clientHeight);
    host.append(renderer.domElement);

    const geometry = new THREE.TorusKnotGeometry(0.55, 0.2, 160, 24);
    const material = new THREE.MeshStandardMaterial({
      color: "#f4b860",
      metalness: 0.15,
      roughness: 0.3,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const hemiLight = new THREE.HemisphereLight("#fdf2c8", "#17304d", 1.6);
    const keyLight = new THREE.DirectionalLight("#ffffff", 2.4);
    keyLight.position.set(2, 3, 4);
    scene.add(hemiLight, keyLight);

    const resizeObserver = new ResizeObserver(() => {
      const width = host.clientWidth;
      const height = host.clientHeight;

      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });

    resizeObserver.observe(host);

    let frameId = 0;

    const renderFrame = (): void => {
      mesh.rotation.x += 0.004;
      mesh.rotation.y += 0.007;
      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(renderFrame);
    };

    renderFrame();

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      host.textContent = "";
    };
  }, []);

  return (
    <Panel
      eyebrow="Live Preview"
      title="Three.js viewport"
      bodyClassName={previewFrame}
    >
      <div className={viewportHost} ref={hostRef} />
    </Panel>
  );
};
