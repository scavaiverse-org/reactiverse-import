import { useEffect, useRef } from "react";
import * as THREE from "three";
import { buildAvatarGroup, applyAvatarCutoutTexture } from "@/lib/avatar-render-helpers";
import { getSafeMediaUrl } from "@/lib/walkthrough-media-url";

// Small live turntable preview of the avatar being customized. Rebuilds the
// scene whenever the config changes so every choice is reflected instantly.
export default function AvatarPreview3D({ config, className = "" }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !mount.clientWidth || !mount.clientHeight) return undefined;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x12161f);

    const camera = new THREE.PerspectiveCamera(35, mount.clientWidth / mount.clientHeight, 0.1, 20);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x222233, 1.1));
    const key = new THREE.DirectionalLight(0xffffff, 1.2);
    key.position.set(2, 3, 2);
    scene.add(key);

    const { group, mediaRequests, totalHeight } = buildAvatarGroup(config);
    scene.add(group);

    const textureResources = [];
    mediaRequests.forEach((request) => {
      const safeUrl = getSafeMediaUrl(request.url);
      if (!safeUrl) return;
      new THREE.TextureLoader().load(safeUrl, (texture) => {
        applyAvatarCutoutTexture(request.mesh, texture);
        textureResources.push(texture);
      });
    });

    const distance = Math.max(2.2, totalHeight * 1.7);
    camera.position.set(0, totalHeight * 0.55, distance);
    camera.lookAt(0, totalHeight * 0.55, 0);

    let frame;
    let angle = 0;
    const animate = () => {
      angle += 0.006;
      group.rotation.y = angle;
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      if (!mount.clientWidth || !mount.clientHeight) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      if (frame) cancelAnimationFrame(frame);
      textureResources.forEach((texture) => texture.dispose());
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [config]);

  return <div ref={mountRef} className={`h-full w-full ${className}`} />;
}
