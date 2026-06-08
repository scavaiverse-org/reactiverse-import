import { useEffect, useRef } from "react";
import * as THREE from "three";

const HOTSPOTS = [
  {
    id: "hologram",
    name: "Sang Nila Utama",
    zone: "Left Wing",
    description: "Explore the legendary founder through a cinematic historical masterclass.",
    position: [-8.4, 2.6, -8.8],
    camera: [-4.6, 2.7, 1.9],
    look: [-8.4, 2.4, -9.2],
    color: 0x22d3ee,
  },
  {
    id: "museum-title",
    name: "Asian Operatic Museum",
    zone: "Entrance",
    description: "Enter the main museum experience and begin the guided journey.",
    position: [0, 4.2, -9.82],
    camera: [0, 2.9, 1.6],
    look: [0, 3.6, -9.8],
    color: 0xd6b36a,
  },
  {
    id: "reception",
    name: "Reception Desk",
    zone: "Entrance",
    description: "Begin onboarding and learn how to navigate the virtual museum.",
    position: [0, 1.35, -5.9],
    camera: [0, 2.45, 0.8],
    look: [0, 1.45, -5.9],
    color: 0xf8d77a,
  },
  {
    id: "artifact-shelf",
    name: "Artifact Shelf",
    zone: "Right Wing",
    description: "Inspect cultural objects, symbols, and stories from the exhibition.",
    position: [6.9, 2.7, -8.75],
    camera: [4.35, 2.7, 1.7],
    look: [7.1, 2.7, -8.7],
    color: 0xf59e0b,
  },
  {
    id: "portal",
    name: "Masterclass Portal",
    zone: "Portal",
    description: "Preview the deeper cinematic learning path before it is connected anywhere else.",
    position: [0, 2.1, -9.92],
    camera: [0, 2.35, 3.3],
    look: [0, 2.2, -9.9],
    color: 0x7dd3fc,
  },
];

function canvasTexture(text, width = 1024, height = 256, options = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, width, height);
  ctx.font = `${options.weight || 700} ${options.size || 92}px Georgia, serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = options.shadow || "rgba(0,0,0,0.85)";
  ctx.shadowBlur = options.shadowBlur || 18;
  ctx.shadowOffsetX = 8;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = options.fill || "#d7bf83";
  ctx.fillText(text, width / 2, height / 2);
  ctx.strokeStyle = options.stroke || "rgba(255,236,185,0.28)";
  ctx.lineWidth = 2;
  ctx.strokeText(text, width / 2, height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function labelPlane(text, position, scale, options) {
  const material = new THREE.MeshBasicMaterial({
    map: canvasTexture(text, 1024, 256, options),
    transparent: true,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(scale[0], scale[1]), material);
  mesh.position.set(...position);
  return mesh;
}

function addBox(group, position, scale, color, materialOptions = {}) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(scale[0], scale[1], scale[2]),
    new THREE.MeshStandardMaterial({ color, roughness: 0.65, metalness: 0.12, ...materialOptions })
  );
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function createClickableAura(color) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 16, 12),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.0, depthWrite: false })
  );
}

function createParticles(count) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = -9 + Math.random() * 18;
    positions[i * 3 + 1] = 0.8 + Math.random() * 4.8;
    positions[i * 3 + 2] = -9.6 + Math.random() * 8.8;
  }
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ color: 0x9beafe, size: 0.035, transparent: true, opacity: 0.55, depthWrite: false })
  );
}

export default function TestRoomWorld({ settings, onTelemetry, onDestination }) {
  const mountRef = useRef(null);
  const stateRef = useRef({ settings, focus: null, zone: "Entrance", selected: null });

  useEffect(() => {
    stateRef.current.settings = settings;
  }, [settings]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050302);
    const roomFog = new THREE.FogExp2(0x120b07, 0.06);
    scene.fog = roomFog;

    const camera = new THREE.PerspectiveCamera(46, mount.clientWidth / mount.clientHeight, 0.1, 70);
    camera.position.set(0, 2.7, 8.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const room = new THREE.Group();
    scene.add(room);

    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x14100c, roughness: 0.92, metalness: 0.02 });
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x28160d, roughness: 0.58, metalness: 0.08 });

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 18), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.z = -4.2;
    floor.receiveShadow = true;
    room.add(floor);

    for (let i = 0; i < 14; i += 1) {
      addBox(room, [0, 0.012, -12.7 + i * 1.24], [18, 0.025, 0.025], 0x3a2114);
    }

    addBox(room, [0, 3, -10], [18, 6, 0.25], 0x14100c, { roughness: 0.96 });
    addBox(room, [-9, 3, -4.2], [0.25, 6, 12], 0x100c09, { roughness: 0.96 });
    addBox(room, [9, 3, -4.2], [0.25, 6, 12], 0x100c09, { roughness: 0.96 });
    addBox(room, [0, 6.05, -4.2], [18, 0.22, 12], 0x0d0907, { roughness: 0.98 });

    const softMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.32, depthWrite: false });
    const vignette = new THREE.Mesh(new THREE.PlaneGeometry(18, 6), softMat);
    vignette.position.set(0, 3, -9.84);
    room.add(vignette);

    const title = labelPlane("Asian  Operatic\nMuseum", [0, 4.15, -9.68], [5.2, 1.25], { size: 84, fill: "#c9ad72" });
    room.add(title);

    const leftTitle = labelPlane("Sang  Nila\nUtama", [-6.25, 4.25, -9.65], [3.45, 1.05], { size: 88, fill: "#e6d7a7" });
    room.add(leftTitle);

    const portal = new THREE.Mesh(
      new THREE.TorusGeometry(1.15, 0.035, 12, 64),
      new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.34 })
    );
    portal.position.set(0, 2.15, -9.73);
    room.add(portal);

    const podium = new THREE.Group();
    podium.name = "Reception Desk";
    addBox(podium, [0, 0.75, 0], [1.65, 1.5, 0.82], 0x191512, { roughness: 0.7, metalness: 0.08 });
    addBox(podium, [0, 1.55, -0.06], [1.85, 0.08, 0.92], 0x231b16, { roughness: 0.5, metalness: 0.18 });
    addBox(podium, [0, 1.95, -0.11], [0.78, 0.52, 0.055], 0x4b4a47, { roughness: 0.42, metalness: 0.35 });
    addBox(podium, [0, 1.7, 0.15], [0.82, 0.04, 0.46], 0x2f2e2b, { roughness: 0.52, metalness: 0.3 });
    podium.position.set(0, 0, -5.78);
    room.add(podium);

    const hologram = new THREE.Group();
    hologram.name = "Sang Nila Utama";
    hologram.position.set(-8.3, 0.18, -8.7);
    const holoMat = new THREE.MeshStandardMaterial({ color: 0x22d3ee, emissive: 0x0891b2, emissiveIntensity: 0.8, transparent: true, opacity: 0.48, roughness: 0.18, metalness: 0.05 });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 1.45, 8, 16), holoMat);
    body.position.y = 1.65;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.31, 16, 12), holoMat);
    head.position.y = 2.72;
    const shoulder = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.24, 0.34), holoMat);
    shoulder.position.y = 2.14;
    const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.2, 8), holoMat);
    staff.position.set(0.62, 1.66, 0);
    staff.rotation.z = -0.12;
    hologram.add(body, head, shoulder, staff);
    const base = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.045, 12, 80), new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.9 }));
    base.rotation.x = Math.PI / 2;
    base.position.y = 0.06;
    hologram.add(base);
    room.add(hologram);

    const shelf = new THREE.Group();
    shelf.name = "Artifact Shelf";
    shelf.position.set(6.8, 0.2, -9.18);
    for (let i = 0; i < 6; i += 1) {
      addBox(shelf, [0, 1.25 + i * 0.62, 0], [3.3, 0.055, 0.38], 0x4b3422, { roughness: 0.58 });
      addBox(shelf, [0, 1.52 + i * 0.62, -0.09], [3.45, 0.03, 0.03], 0x8a633c, { emissive: 0x2d1608, emissiveIntensity: 0.15 });
    }
    addBox(shelf, [-0.55, 4.28, 0.08], [0.82, 1.05, 0.18], 0xb65d32, { roughness: 0.5 });
    addBox(shelf, [0.7, 3.17, 0.08], [1.05, 0.65, 0.16], 0x1f1511, { roughness: 0.54 });
    addBox(shelf, [-0.9, 2.45, 0.09], [0.58, 0.7, 0.14], 0xf3e2c7, { roughness: 0.62 });
    const fan = new THREE.Mesh(new THREE.CircleGeometry(0.5, 24, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0xc9a56d, side: THREE.DoubleSide, roughness: 0.5 }));
    fan.position.set(0.98, 3.28, 0.23);
    shelf.add(fan);
    for (let i = 0; i < 3; i += 1) addBox(shelf, [-1.15 + i * 0.45, 2.1, 0.1], [0.22, 0.26, 0.18], 0x17110d, { metalness: 0.2 });
    addBox(shelf, [0.7, 0.56, 0.12], [0.9, 0.35, 0.55], 0x8b6a49);
    addBox(shelf, [1.23, 0.85, 0.1], [0.55, 0.5, 0.42], 0x5f4430);
    const plantMat = new THREE.MeshStandardMaterial({ color: 0x29543b, roughness: 0.8 });
    for (let i = 0; i < 9; i += 1) {
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.48, 6), plantMat);
      leaf.position.set(-1.28 + Math.random() * 0.34, 1.02 + Math.random() * 1.25, 0.2);
      leaf.rotation.z = -0.8 + Math.random() * 1.6;
      shelf.add(leaf);
    }
    room.add(shelf);

    const particles = createParticles(520);
    scene.add(particles);

    const hotspotMeshes = [];
    HOTSPOTS.forEach((hotspot) => {
      const aura = createClickableAura(hotspot.color);
      aura.position.set(...hotspot.position);
      aura.scale.set(1.8, 1.8, 1.8);
      aura.userData.hotspot = hotspot;
      room.add(aura);
      hotspotMeshes.push(aura);
    });

    const ambient = new THREE.AmbientLight(0xffd6a5, 0.28);
    scene.add(ambient);
    const key = new THREE.SpotLight(0xffd08a, 5.8, 18, 0.45, 0.65, 1.5);
    key.position.set(0, 5.7, -3.7);
    key.target.position.set(0, 1.25, -5.85);
    key.castShadow = true;
    scene.add(key, key.target);
    const leftGlow = new THREE.PointLight(0x22d3ee, 2.5, 6);
    leftGlow.position.set(-8.1, 2.3, -8.6);
    scene.add(leftGlow);
    const shelfGlow = new THREE.PointLight(0xf59e0b, 1.25, 5.5);
    shelfGlow.position.set(6.7, 3.2, -8.3);
    scene.add(shelfGlow);

    let yaw = 0;
    let targetYaw = 0;
    let intro = 0;
    let pointerDown = false;
    let moved = false;
    let lastX = 0;
    let targetPosition = new THREE.Vector3(0, 2.7, 2.15);
    let lookTarget = new THREE.Vector3(0, 2.55, -8.7);
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const clock = new THREE.Clock();
    let fpsTime = 0;
    let fpsFrames = 0;
    let fps = 60;
    let animationFrame = null;

    const setPointer = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const currentZone = () => {
      if (stateRef.current.focus) return stateRef.current.zone;
      if (yaw < -0.36) return "Left Wing";
      if (yaw > 0.36) return "Right Wing";
      return "Entrance";
    };

    const focusHotspot = (hotspot) => {
      stateRef.current.focus = hotspot.name;
      stateRef.current.zone = hotspot.zone;
      stateRef.current.selected = hotspot.id;
      targetPosition = new THREE.Vector3(...hotspot.camera);
      lookTarget = new THREE.Vector3(...hotspot.look);
      hotspotMeshes.forEach((mesh) => {
        mesh.material.opacity = mesh.userData.hotspot.id === hotspot.id ? 0.18 : 0;
      });
      setTimeout(() => onDestination(hotspot), 850);
    };

    const resetFocus = () => {
      stateRef.current.focus = null;
      stateRef.current.selected = null;
      targetPosition = new THREE.Vector3(0, 2.7, 2.15);
      lookTarget = new THREE.Vector3(Math.sin(yaw) * 5.3, 2.6, -8.2);
      hotspotMeshes.forEach((mesh) => { mesh.material.opacity = 0; });
    };

    const rotate = (direction) => {
      resetFocus();
      targetYaw = Math.max(-0.82, Math.min(0.82, targetYaw + direction * 0.34));
    };

    const onRotate = (event) => rotate(event.detail?.direction || 0);
    const onKey = (event) => {
      if (event.key === "ArrowLeft") rotate(-1);
      if (event.key === "ArrowRight") rotate(1);
      if (event.key === "Escape") resetFocus();
    };

    const onPointerDown = (event) => {
      pointerDown = true;
      moved = false;
      lastX = event.clientX;
    };

    const onPointerMove = (event) => {
      if (!pointerDown) return;
      const deltaX = event.clientX - lastX;
      if (Math.abs(deltaX) > 2) moved = true;
      targetYaw = Math.max(-0.82, Math.min(0.82, targetYaw - deltaX * 0.004));
      lastX = event.clientX;
      if (moved) resetFocus();
    };

    const onPointerUp = (event) => {
      if (!pointerDown) return;
      pointerDown = false;
      if (moved) return;
      setPointer(event);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(hotspotMeshes, false)[0];
      if (hit?.object?.userData?.hotspot) focusHotspot(hit.object.userData.hotspot);
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    window.addEventListener("keydown", onKey);
    window.addEventListener("test-room-rotate", onRotate);
    window.addEventListener("test-room-center", resetFocus);

    const resize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", resize);

    const animate = () => {
      const delta = clock.getDelta();
      const elapsed = clock.elapsedTime;
      fpsTime += delta;
      fpsFrames += 1;
      if (fpsTime >= 0.5) {
        fps = Math.round(fpsFrames / fpsTime);
        fpsTime = 0;
        fpsFrames = 0;
      }

      const currentSettings = stateRef.current.settings;
      scene.fog = currentSettings.fog ? roomFog : null;
      particles.visible = currentSettings.particles;
      hologram.visible = currentSettings.hologram;
      leftGlow.intensity = currentSettings.hologram ? 2.1 + Math.sin(elapsed * 2.2) * 0.8 : 0;
      if (currentSettings.autoRotate && !stateRef.current.focus && !pointerDown) {
        targetYaw = Math.sin(elapsed * 0.22) * 0.5;
      }

      intro = Math.min(1, intro + delta * 0.22);
      const introPosition = new THREE.Vector3(0, 2.85, 8.8 - intro * 6.65);
      if (intro < 1 && !stateRef.current.focus) camera.position.lerp(introPosition, 0.08);
      else camera.position.lerp(targetPosition, 0.055);

      yaw += (targetYaw - yaw) * 0.07;
      if (!stateRef.current.focus) {
        lookTarget.lerp(new THREE.Vector3(Math.sin(yaw) * 5.8, 2.55, -8.3 + Math.abs(yaw) * 0.55), 0.08);
      }
      camera.lookAt(lookTarget);

      portal.rotation.z += delta * 0.18;
      base.rotation.z += delta * 0.55;
      particles.rotation.y += delta * 0.01;
      hologram.position.y = 0.18 + Math.sin(elapsed * 1.35) * 0.035;
      hologram.rotation.y = Math.sin(elapsed * 0.4) * 0.08;
      shelfGlow.intensity = 1.0 + Math.sin(elapsed * 0.9) * 0.22;
      key.intensity = 5.4 + Math.sin(elapsed * 0.7) * 0.35;

      renderer.render(scene, camera);
      onTelemetry({
        fps,
        zone: currentZone(),
        selected: stateRef.current.focus || "None",
        destination: stateRef.current.focus,
        position: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
        rotation: { x: camera.rotation.x, y: camera.rotation.y, z: camera.rotation.z },
      });
      animationFrame = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("test-room-rotate", onRotate);
      window.removeEventListener("test-room-center", resetFocus);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      if (animationFrame) cancelAnimationFrame(animationFrame);
      renderer.dispose();
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (object.material.map) object.material.map.dispose();
          object.material.dispose?.();
        }
      });
      mount.removeChild(renderer.domElement);
    };
  }, [onDestination, onTelemetry]);

  return <div ref={mountRef} className="absolute inset-0 touch-none" />;
}