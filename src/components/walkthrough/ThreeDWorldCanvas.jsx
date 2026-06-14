import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { buildSceneSpec } from "@/lib/three-d-world-scene";

// Renders an actual walkable 3D gallery from a threeDWorldConfig. The same
// component powers the editor's live preview and the published front end, so a
// given world always looks identical in both places (determinism by shared
// renderer). Layout comes entirely from buildSceneSpec, which is pure and
// random-free; this file only turns that spec into three.js meshes.

const PLACEHOLDER_FILLS = {
  image_frame: "#3a3530",
  video_wall: "#0e0e12",
  text_panel: "#f3efe6",
  memory_capsule: "#2a2030",
  collectible: "#2a2614",
  quiz_station: "#16242a",
  audio_point: "#1c2630",
  direction_sign: "#222018",
  floating_button: "#1a2430",
};

function hexToInt(hex, fallback = 0x808080) {
  if (typeof hex !== "string") return fallback;
  const cleaned = hex.replace("#", "");
  const n = parseInt(cleaned, 16);
  return Number.isNaN(n) ? fallback : n;
}

// A canvas-drawn texture used whenever a piece has no uploaded media: a
// tinted board with the object's title (and body text for panels), so an
// unconfigured world still reads as a labelled gallery rather than blank walls.
function makePlaceholderTexture(label, kind, bodyText = "") {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 384;
  const ctx = canvas.getContext("2d");
  const fill = PLACEHOLDER_FILLS[kind] || "#2c2824";
  const dark = kind === "text_panel" ? false : true;
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // subtle inner border
  ctx.strokeStyle = dark ? "rgba(231,199,137,0.35)" : "rgba(40,34,28,0.25)";
  ctx.lineWidth = 6;
  ctx.strokeRect(14, 14, canvas.width - 28, canvas.height - 28);

  const text = dark ? "#efe6d4" : "#241c12";
  ctx.fillStyle = text;
  ctx.textAlign = "center";

  if (kind === "text_panel" && bodyText) {
    ctx.textBaseline = "top";
    ctx.font = "600 30px Georgia, serif";
    ctx.fillText(truncate(label, 26), canvas.width / 2, 52);
    ctx.font = "300 22px Georgia, serif";
    wrapText(ctx, bodyText, canvas.width / 2, 110, canvas.width - 80, 30, 8);
  } else {
    ctx.textBaseline = "middle";
    ctx.font = "600 34px Georgia, serif";
    wrapText(ctx, label, canvas.width / 2, canvas.height / 2 - 10, canvas.width - 70, 42, 4, true);
    ctx.font = "400 20px Georgia, serif";
    ctx.fillStyle = dark ? "rgba(239,230,212,0.6)" : "rgba(36,28,18,0.6)";
    ctx.fillText(kind.replace(/_/g, " "), canvas.width / 2, canvas.height - 46);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function truncate(str, max) {
  const s = String(str || "");
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines, center = false) {
  const words = String(text || "").split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length >= maxLines) break;
    } else {
      line = test;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  const startY = center ? y - ((lines.length - 1) * lineHeight) / 2 : y;
  lines.forEach((l, i) => ctx.fillText(l, x, startY + i * lineHeight));
}

// Big serif title board for the back wall (the "EDGAR DEGAS" plate look).
function makeTitleTexture(title, subtitle, accent) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 384;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#efe7d6";
  const size = title.length > 18 ? 78 : title.length > 12 ? 104 : 128;
  ctx.font = `600 ${size}px Georgia, serif`;
  // letter-spaced rendering for the museum plate feel
  drawSpaced(ctx, title, canvas.width / 2, 170, size * 0.14);
  if (subtitle) {
    ctx.font = "400 34px Georgia, serif";
    ctx.fillStyle = accent || "rgba(231,199,137,0.85)";
    drawSpaced(ctx, subtitle.toUpperCase(), canvas.width / 2, 270, 8);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function drawSpaced(ctx, text, cx, y, spacing) {
  const chars = String(text).split("");
  const widths = chars.map((c) => ctx.measureText(c).width + spacing);
  const total = widths.reduce((a, b) => a + b, 0) - spacing;
  let x = cx - total / 2;
  chars.forEach((c, i) => {
    ctx.fillText(c, x + widths[i] / 2 - spacing / 2, y);
    x += widths[i];
  });
}

export default function ThreeDWorldCanvas({
  config,
  room = {},
  className = "",
  style,
  interactive = true,
  onSelectObject,
  debounceMs = 0,
  cartoonify = false,
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const contentRef = useRef(null);
  const clickablesRef = useRef([]);
  const animatorsRef = useRef([]);
  const camStateRef = useRef({ theta: 0, phi: Math.PI / 2, radius: 8, targetTheta: 0, targetPhi: Math.PI / 2, target: new THREE.Vector3(0, 1.6, -2), dragging: false, moved: false, lastX: 0, lastY: 0, idle: 0 });
  const selectRef = useRef(onSelectObject);
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => { selectRef.current = onSelectObject; }, [onSelectObject]);

  // Debounced signature: only the visual fields, so rapid typing in unrelated
  // inputs doesn't thrash the scene, and identical configs never rebuild.
  const signature = JSON.stringify({
    rs: config?.roomSize, ls: config?.layoutShape, ws: config?.wallStyle, fs: config?.floorStyle,
    cs: config?.ceilingStyle, mp: config?.moodPreset, ct: config?.colorToneOverride, fg: config?.fogOverride,
    ca: config?.cartoonify,
    title: room?.title,
    objs: (config?.objects || []).map((o) => [o.id, o.type, o.title || o.name || o.label, o.imageUrl, o.videoUrl, o.thumbnailUrl, o.mediaUrl, o.iconUrl, o.body, o.description, o.story, o.color, o.locked, o.visible, o.position?.x, o.position?.y, o.position?.z, o.rotation?.y]),
  });
  const [debouncedSig, setDebouncedSig] = useState(signature);
  useEffect(() => {
    if (debounceMs <= 0) { setDebouncedSig(signature); return undefined; }
    const id = setTimeout(() => setDebouncedSig(signature), debounceMs);
    return () => clearTimeout(id);
  }, [signature, debounceMs]);

  // --- Mount once: renderer, camera, base lights, controls, render loop. ---
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    } catch (error) {
      console.error("3D preview unavailable", error);
      setWebglFailed(true);
      return undefined;
    }
    const width = mount.clientWidth || 640;
    const height = mount.clientHeight || 420;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.touchAction = "none";
    renderer.domElement.style.display = "block";
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const camera = new THREE.PerspectiveCamera(58, width / height, 0.1, 200);
    cameraRef.current = camera;

    const content = new THREE.Group();
    scene.add(content);
    contentRef.current = content;

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const cam = camStateRef.current;

    const applyCamera = () => {
      const sinPhi = Math.sin(cam.phi);
      camera.position.set(
        cam.target.x + cam.radius * sinPhi * Math.sin(cam.theta),
        cam.target.y + cam.radius * Math.cos(cam.phi),
        cam.target.z + cam.radius * sinPhi * Math.cos(cam.theta),
      );
      camera.lookAt(cam.target);
    };

    const onPointerDown = (event) => {
      cam.dragging = true;
      cam.moved = false;
      cam.lastX = event.clientX;
      cam.lastY = event.clientY;
      renderer.domElement.setPointerCapture?.(event.pointerId);
    };
    const onPointerMove = (event) => {
      if (!cam.dragging) return;
      const dx = event.clientX - cam.lastX;
      const dy = event.clientY - cam.lastY;
      if (Math.abs(dx) + Math.abs(dy) > 3) cam.moved = true;
      cam.lastX = event.clientX;
      cam.lastY = event.clientY;
      cam.targetTheta -= dx * 0.005;
      cam.targetPhi = Math.max(0.7, Math.min(1.45, cam.targetPhi - dy * 0.004));
    };
    const onPointerUp = (event) => {
      if (!cam.dragging) return;
      cam.dragging = false;
      if (cam.moved || !interactive) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(clickablesRef.current, true)[0];
      let node = hit?.object;
      while (node && !node.userData?.worldObject) node = node.parent;
      if (node?.userData?.worldObject) selectRef.current?.(node.userData.worldObject);
    };
    const onWheel = (event) => {
      event.preventDefault();
      cam.radius = Math.max(2.5, Math.min(26, cam.radius + event.deltaY * 0.01));
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointercancel", () => { cam.dragging = false; });
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

    const resize = () => {
      const w = mount.clientWidth || width;
      const h = mount.clientHeight || height;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);

    const clock = new THREE.Clock();
    let frame = null;
    const animate = () => {
      const delta = clock.getDelta();
      const elapsed = clock.elapsedTime;
      // ease camera toward target orientation
      cam.theta += (cam.targetTheta - cam.theta) * 0.1;
      cam.phi += (cam.targetPhi - cam.phi) * 0.1;
      // very subtle idle sway so the scene feels alive without drifting
      if (!cam.dragging) {
        cam.idle += delta;
        cam.targetTheta += Math.sin(cam.idle * 0.25) * 0.00035;
      }
      applyCamera();
      for (const fn of animatorsRef.current) fn(elapsed, delta);
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    applyCamera();
    animate();

    return () => {
      if (frame) cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      disposeGroup(content);
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      contentRef.current = null;
      clickablesRef.current = [];
      animatorsRef.current = [];
    };
  }, [interactive]);

  // --- Rebuild scene contents whenever the world spec changes. ---
  useEffect(() => {
    const scene = sceneRef.current;
    const content = contentRef.current;
    if (!scene || !content) return;

    disposeGroup(content);
    clickablesRef.current = [];
    animatorsRef.current = [];

    const spec = buildSceneSpec(config || {}, room || {});
    const { dimensions: dims, colors, lighting } = spec;

    scene.background = new THREE.Color(hexToInt(lighting.background, 0x101014));
    scene.fog = lighting.fog > 0 ? new THREE.FogExp2(hexToInt(lighting.background, 0x101014), lighting.fog) : null;

    // recentre the camera target / framing for this room size
    const cam = camStateRef.current;
    cam.target.set(0, 1.6, -dims.d * 0.12);
    cam.radius = Math.min(dims.d * 0.46, 13);
    cam.targetTheta = 0;
    cam.targetPhi = Math.PI / 2 + 0.04;

    buildRoomShell(content, dims, colors, lighting);
    buildLighting(content, dims, lighting);
    buildTitle(content, dims, spec);
    if (spec.hasBench) buildBench(content, colors);

    const accentInt = hexToInt(spec.accent, 0xe7c789);
    spec.wallArt.forEach((item) => buildWallArt(content, item, clickablesRef.current, animatorsRef.current, accentInt));
    spec.pedestals.forEach((item) => buildPedestal(content, item, clickablesRef.current, accentInt));
    spec.doors.forEach((item) => buildDoor(content, item, clickablesRef.current, animatorsRef.current, accentInt));
    spec.npcs.forEach((item) => buildNpc(content, item, clickablesRef.current, animatorsRef.current, accentInt));

    if (config?.cartoonify) {
      const gradientMap = makeToonGradient(4);
      applyCartoonMaterials(content, gradientMap);
    }

    // Paint immediately so the populated room shows up on the very first
    // frame instead of a black flash while waiting for the next RAF tick.
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    if (renderer && camera) renderer.render(scene, camera);
  }, [debouncedSig]); // eslint-disable-line react-hooks/exhaustive-deps

  if (webglFailed) {
    return (
      <div className={`flex items-center justify-center rounded-2xl border border-white/10 bg-background/60 text-center text-sm text-muted-foreground ${className}`} style={style}>
        <p className="max-w-xs px-4 py-10">3D preview needs WebGL, which is unavailable in this browser. The world is still saved and will render where WebGL is supported.</p>
      </div>
    );
  }

  return <div ref={mountRef} className={className} style={{ position: "relative", ...style }} />;
}

// ----------------------------- builders --------------------------------------

function standardMat(colorInt, opts = {}) {
  return new THREE.MeshStandardMaterial({ color: colorInt, roughness: 0.85, metalness: 0.05, ...opts });
}

function makeToonGradient(steps = 4) {
  const data = new Uint8Array(steps * 4);
  const stops = steps === 3
    ? [[30, 30, 35], [120, 110, 100], [240, 230, 215]]
    : [[20, 20, 25], [80, 75, 70], [160, 150, 140], [245, 235, 220]];
  for (let i = 0; i < steps; i += 1) {
    data[i * 4] = stops[i][0];
    data[i * 4 + 1] = stops[i][1];
    data[i * 4 + 2] = stops[i][2];
    data[i * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, steps, 1, THREE.RGBAFormat);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
}

function applyCartoonMaterials(group, gradientMap) {
  group.traverse((obj) => {
    if (!obj.isMesh || !obj.material) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    const toonMats = mats.map((mat) => {
      if (mat.isMeshToonMaterial) return mat;
      const toon = new THREE.MeshToonMaterial({
        color: mat.color ? mat.color.clone() : new THREE.Color(0xd4c8b8),
        gradientMap,
        map: mat.map || null,
        transparent: mat.transparent || false,
        opacity: mat.opacity ?? 1,
        side: mat.side ?? THREE.FrontSide,
      });
      mat.dispose();
      return toon;
    });
    obj.material = Array.isArray(obj.material) ? toonMats : toonMats[0];
  });
}

function buildRoomShell(group, dims, colors, lighting) {
  const wall = hexToInt(colors.wall);
  const floorColor = hexToInt(colors.floor);
  const { w, d, h } = dims;

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), standardMat(floorColor, { roughness: 0.5, metalness: 0.15 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  const wallMat = standardMat(wall, { roughness: 0.95, side: THREE.FrontSide });
  const addWall = (geo, x, y, z, ry) => {
    const m = new THREE.Mesh(geo, wallMat);
    m.position.set(x, y, z);
    m.rotation.y = ry;
    m.receiveShadow = true;
    group.add(m);
  };
  addWall(new THREE.PlaneGeometry(w, h), 0, h / 2, -d / 2, 0); // back
  addWall(new THREE.PlaneGeometry(w, h), 0, h / 2, d / 2, Math.PI); // front
  addWall(new THREE.PlaneGeometry(d, h), -w / 2, h / 2, 0, Math.PI / 2); // left
  addWall(new THREE.PlaneGeometry(d, h), w / 2, h / 2, 0, -Math.PI / 2); // right

  if (colors.hasCeiling) {
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(w, d), standardMat(hexToInt(colors.ceiling), { roughness: 1 }));
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = h;
    group.add(ceiling);
    // recessed ceiling cove down the centre (warm strip, like track lighting)
    const cove = new THREE.Mesh(
      new THREE.PlaneGeometry(w * 0.42, d - 1),
      new THREE.MeshBasicMaterial({ color: hexToInt(lighting.key, 0xffe9c7) }),
    );
    cove.rotation.x = Math.PI / 2;
    cove.position.set(0, h - 0.02, 0);
    group.add(cove);
  }

  // baseboard accent line where wall meets floor (depth cue)
  const baseMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25 });
  const trim = (geoW, x, z, ry) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(geoW, 0.18), baseMat);
    m.position.set(x, 0.09, z);
    m.rotation.y = ry;
    group.add(m);
  };
  trim(w, 0, -d / 2 + 0.02, 0);
  trim(d, -w / 2 + 0.02, 0, Math.PI / 2);
  trim(d, w / 2 - 0.02, 0, -Math.PI / 2);
}

function buildLighting(group, dims, lighting) {
  const ambient = new THREE.AmbientLight(hexToInt(lighting.ambient, 0xffffff), lighting.ambientIntensity);
  group.add(ambient);
  const hemi = new THREE.HemisphereLight(hexToInt(lighting.ambient, 0xffffff), hexToInt(lighting.background, 0x101014), 0.35);
  group.add(hemi);

  // a few overhead lights down the hall — these cast the floor pools
  const { d, h } = dims;
  const count = Math.max(2, Math.round(d / 6));
  for (let i = 0; i < count; i += 1) {
    const z = -d / 2 + 2 + (i / Math.max(1, count - 1)) * (d - 4);
    const spot = new THREE.SpotLight(hexToInt(lighting.key, 0xffe9c7), lighting.keyIntensity, d, 0.7, 0.7, 1.2);
    spot.position.set(0, h - 0.3, z);
    spot.target.position.set(0, 0, z);
    spot.castShadow = i === 0; // one shadow caster keeps mobile light
    if (spot.castShadow) { spot.shadow.mapSize.set(1024, 1024); spot.shadow.camera.far = d; }
    group.add(spot, spot.target);
  }
}

function buildTitle(group, dims, spec) {
  const texture = makeTitleTexture(spec.title, spec.subtitle, "rgba(231,199,137,0.9)");
  const aspect = 1024 / 384;
  const wTitle = Math.min(dims.w * 0.6, 5.2);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(wTitle, wTitle / aspect),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }),
  );
  mesh.position.set(0, dims.h * 0.6, -dims.d / 2 + 0.06);
  group.add(mesh);
}

function buildBench(group, colors) {
  const wood = hexToInt(colors.floor === "#d9d4cc" ? "#3a2c20" : "#241b13", 0x241b13);
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.12, 2.6), standardMat(wood, { roughness: 0.6 }));
  top.position.set(0, 0.45, 0);
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);
  [-1.1, 1.1].forEach((z) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.45, 0.16), standardMat(wood, { roughness: 0.7 }));
    leg.position.set(0, 0.22, z);
    group.add(leg);
  });
}

function frameMaterialFor(item, accentInt) {
  // gold-ish frame for art, dark bezel for screens/panels
  if (item.kind === "video_wall") return standardMat(0x0a0a0c, { metalness: 0.4, roughness: 0.4 });
  if (item.kind === "text_panel") return standardMat(0x2b2620, { roughness: 0.8 });
  return standardMat(0x8a6d3b, { metalness: 0.5, roughness: 0.45, emissive: 0x140d04, emissiveIntensity: 0.2 });
}

function buildWallArt(group, item, clickables, animators, accentInt) {
  const node = new THREE.Group();
  const fw = item.kind === "video_wall" ? 2.2 : 1.7;
  const fh = item.kind === "video_wall" ? 1.25 : 1.15;
  const border = item.kind === "text_panel" ? 0.08 : 0.14;

  const frame = new THREE.Mesh(new THREE.BoxGeometry(fw + border * 2, fh + border * 2, 0.09), frameMaterialFor(item, accentInt));
  frame.castShadow = true;
  node.add(frame);

  const artMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7, metalness: 0 });
  applyArtTexture(artMat, item);
  const art = new THREE.Mesh(new THREE.PlaneGeometry(fw, fh), artMat);
  art.position.z = 0.051;
  node.add(art);

  if (item.kind === "video_wall") {
    const play = new THREE.Mesh(
      new THREE.CircleGeometry(0.22, 3),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.92 }),
    );
    play.rotation.z = -Math.PI / 2;
    play.position.set(0, 0, 0.06);
    node.add(play);
  }

  // small accent spotlight pooling on the piece
  const spot = new THREE.SpotLight(accentInt, 2.2, 5, 0.6, 0.8, 1.4);
  spot.position.set(0, 1.4, 0.8);
  spot.target.position.set(0, 0, 0);
  node.add(spot, spot.target);

  node.position.set(item.position[0], item.position[1], item.position[2]);
  node.rotation.y = item.rotationY;
  node.userData.worldObject = item.object;
  clickables.push(node);
  // gentle hover-independent shimmer for collectibles/memory capsules
  if (item.kind === "collectible" || item.kind === "memory_capsule") {
    animators.push((t) => { art.material.emissiveIntensity = 0.2 + Math.sin(t * 2) * 0.15; });
    artMat.emissive = new THREE.Color(accentInt);
    artMat.emissiveIntensity = 0.2;
  }
  group.add(node);
}

function applyArtTexture(material, item) {
  if (item.mediaUrl) {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(
      item.mediaUrl,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 8;
        material.map = texture;
        material.color.set(0xffffff);
        material.needsUpdate = true;
      },
      undefined,
      () => {
        material.map = makePlaceholderTexture(item.label, item.kind, item.text);
        material.needsUpdate = true;
      },
    );
    // show placeholder until the image resolves
    material.map = makePlaceholderTexture(item.label, item.kind, item.text);
  } else {
    material.map = makePlaceholderTexture(item.label, item.kind, item.text);
  }
  material.needsUpdate = true;
}

function buildPedestal(group, item, clickables, accentInt) {
  const node = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.95, 0.95), standardMat(0x1b1714, { roughness: 0.7 }));
  base.position.y = 0.475;
  base.castShadow = true;
  base.receiveShadow = true;
  node.add(base);
  const slab = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.08, 1.05), standardMat(0x2a241f, { roughness: 0.5, metalness: 0.2 }));
  slab.position.y = 0.99;
  node.add(slab);

  if (item.mediaUrl) {
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
    applyArtTexture(mat, item);
    const board = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.0), mat);
    board.position.set(0, 1.55, 0);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.86, 1.06, 0.04), standardMat(0x8a6d3b, { metalness: 0.4 }));
    back.position.set(0, 1.55, -0.03);
    node.add(back, board);
  } else {
    const gem = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.34, 0),
      new THREE.MeshStandardMaterial({ color: accentInt, emissive: accentInt, emissiveIntensity: 0.5, roughness: 0.25, metalness: 0.6 }),
    );
    gem.position.y = 1.45;
    gem.castShadow = true;
    node.add(gem);
  }
  const glow = new THREE.PointLight(accentInt, 1.1, 3);
  glow.position.set(0, 1.7, 0.4);
  node.add(glow);

  node.position.set(item.position[0], item.position[1], item.position[2]);
  node.userData.worldObject = item.object;
  clickables.push(node);
  group.add(node);
}

function buildDoor(group, item, clickables, animators, accentInt) {
  const node = new THREE.Group();
  const isPortal = item.kind === "portal";
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.8, 0.16), standardMat(0x15110d, { roughness: 0.8, metalness: 0.2 }));
  frame.position.y = 1.4;
  frame.castShadow = true;
  node.add(frame);

  const colorInt = item.color ? hexToInt(namedColor(item.color), accentInt) : accentInt;
  if (isPortal) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.85, 0.07, 14, 48),
      new THREE.MeshBasicMaterial({ color: colorInt, transparent: true, opacity: 0.9 }),
    );
    ring.position.set(0, 1.5, 0.12);
    node.add(ring);
    const veil = new THREE.Mesh(
      new THREE.CircleGeometry(0.82, 40),
      new THREE.MeshBasicMaterial({ color: colorInt, transparent: true, opacity: 0.28 }),
    );
    veil.position.set(0, 1.5, 0.1);
    node.add(veil);
    animators.push((t) => { ring.rotation.z = t * 0.4; veil.material.opacity = 0.22 + Math.sin(t * 2) * 0.08; });
    const portalLight = new THREE.PointLight(colorInt, 1.4, 4);
    portalLight.position.set(0, 1.5, 0.5);
    node.add(portalLight);
  } else {
    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 2.45, 0.06),
      standardMat(item.locked ? 0x3a2a22 : 0x4a3526, { roughness: 0.6, metalness: 0.15 }),
    );
    panel.position.set(0, 1.32, 0.07);
    node.add(panel);
    const handle = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), standardMat(0xcaa86a, { metalness: 0.8, roughness: 0.3 }));
    handle.position.set(0.42, 1.25, 0.12);
    node.add(handle);
    const glowMat = new THREE.MeshBasicMaterial({ color: item.locked ? 0xff6a6a : colorInt, transparent: true, opacity: 0.55 });
    const sill = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.5), glowMat);
    sill.rotation.x = -Math.PI / 2;
    sill.position.set(0, 0.02, 0.55);
    node.add(sill);
  }

  // label plate above the door
  const label = makePlaceholderTexture(item.label, "direction_sign", "");
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.5), new THREE.MeshBasicMaterial({ map: label, transparent: true, depthWrite: false }));
  plate.position.set(0, 2.95, 0.1);
  node.add(plate);

  node.position.set(item.position[0], item.position[1], item.position[2]);
  node.rotation.y = item.rotationY;
  node.userData.worldObject = item.object;
  clickables.push(node);
  group.add(node);
}

function buildNpc(group, item, clickables, animators, accentInt) {
  const node = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: accentInt, emissive: accentInt, emissiveIntensity: 0.4, transparent: true, opacity: 0.7, roughness: 0.3 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 1.0, 6, 14), mat);
  body.position.y = 1.0;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 14), mat);
  head.position.y = 1.75;
  node.add(body, head);
  const ringMat = new THREE.MeshBasicMaterial({ color: accentInt, transparent: true, opacity: 0.85 });
  const base = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.04, 10, 40), ringMat);
  base.rotation.x = Math.PI / 2;
  base.position.y = 0.05;
  node.add(base);
  const light = new THREE.PointLight(accentInt, 1.2, 4);
  light.position.set(0, 1.4, 0.4);
  node.add(light);
  animators.push((t) => { node.position.y = item.position[1] + Math.sin(t * 1.4) * 0.04; head.rotation.y = Math.sin(t * 0.5) * 0.2; });

  node.position.set(item.position[0], item.position[1], item.position[2]);
  node.userData.worldObject = item.object;
  clickables.push(node);
  group.add(node);
}

// Map a few friendly colour names used in the editor to hex.
const NAMED_COLORS = { gold: "#e7c789", warm_gold: "#e7c789", blue: "#6ad0ff", cyan: "#67e8f9", red: "#ff6a6a", green: "#7ee0a0", purple: "#b78bff", white: "#ffffff" };
function namedColor(value) {
  if (typeof value === "string" && value.startsWith("#")) return value;
  return NAMED_COLORS[value] || "#e7c789";
}

function disposeGroup(group) {
  if (!group) return;
  for (let i = group.children.length - 1; i >= 0; i -= 1) {
    const child = group.children[i];
    disposeGroup(child);
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((m) => { if (m.map) m.map.dispose(); m.dispose?.(); });
    }
    group.remove(child);
  }
}
