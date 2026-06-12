// Deterministic mapping + geometry-building helpers for the visitor-facing
// 3D World renderer. Every function here is a pure function of
// room.threeDWorldConfig — the same config always produces the same scene.
import * as THREE from "three";
import { getMoodPreset, getWorldTemplate } from "@/lib/three-d-world-seed";

const EYE_HEIGHT = 1.6;

function titleCase(value = "") {
  return String(value).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Colour resolution
// ---------------------------------------------------------------------------

const NAMED_COLORS = {
  warm_gold: 0xe8c471, sepia_gold: 0xd2a45c, soft_gold: 0xf3d9a4, gold: 0xd4af37,
  silver: 0xc0c0c0, bronze: 0xb08d57, common: 0xc0c0c0, rare: 0x60a5fa, epic: 0xa855f7,
  legendary: 0xf59e0b, red: 0xef4444, blue: 0x3b82f6, green: 0x22c55e, purple: 0xa855f7,
  orange: 0xf97316, cyan: 0x22d3ee, white: 0xffffff, black: 0x111111, gray: 0x9ca3af,
  grey: 0x9ca3af, pink: 0xf472b6, amber: 0xf59e0b, emerald: 0x10b981, rose: 0xf43f5e,
  yellow: 0xfacc15, teal: 0x14b8a6, indigo: 0x6366f1, lime: 0x84cc16, brown: 0x8a5a35,
};

export function resolveColor(value, fallback = 0xffffff) {
  if (typeof value === "number") return value;
  const raw = String(value || "").trim();
  if (!raw) return fallback;
  if (/^#[0-9a-f]{3,8}$/i.test(raw)) return new THREE.Color(raw).getHex();
  const key = raw.toLowerCase().replace(/[\s-]+/g, "_");
  return NAMED_COLORS[key] ?? fallback;
}

function shiftColor(hex, amount) {
  const color = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  color.getHSL(hsl);
  color.setHSL(hsl.h, hsl.s, Math.max(0, Math.min(1, hsl.l + amount)));
  return color.getHex();
}

// ---------------------------------------------------------------------------
// Room dimensions
// ---------------------------------------------------------------------------

const ROOM_SIZE_DIMENSIONS = {
  small: { width: 10, depth: 10, height: 4 },
  medium: { width: 16, depth: 16, height: 5 },
  large: { width: 24, depth: 24, height: 6 },
  massive: { width: 36, depth: 36, height: 8 },
};

const LAYOUT_SHAPE_FACTORS = {
  single_room: { w: 1, d: 1, kind: "box" },
  long_corridor: { w: 0.55, d: 1.9, kind: "box" },
  circular_gallery: { w: 1.1, d: 1.1, kind: "cylinder" },
  multi_zone_hall: { w: 1.3, d: 1.3, kind: "box" },
  marketplace_street: { w: 0.85, d: 2.2, kind: "box" },
  hub_and_spoke: { w: 1.35, d: 1.35, kind: "box" },
  maze_light: { w: 1.2, d: 1.2, kind: "maze" },
  stage_front: { w: 1.15, d: 1.35, kind: "stage" },
  open_world_square: { w: 1.6, d: 1.6, kind: "box" },
};

export function getRoomDimensions(config = {}) {
  const base = ROOM_SIZE_DIMENSIONS[config.roomSize] || ROOM_SIZE_DIMENSIONS.medium;
  const factor = LAYOUT_SHAPE_FACTORS[config.layoutShape] || LAYOUT_SHAPE_FACTORS.single_room;
  return {
    width: base.width * factor.w,
    depth: base.depth * factor.d,
    height: base.height,
    shape: factor.kind,
  };
}

// ---------------------------------------------------------------------------
// Surfaces (walls / floor / ceiling)
// ---------------------------------------------------------------------------

const WALL_STYLES = {
  white_gallery_wall: { color: 0xf5f3ee, roughness: 0.85, metalness: 0.02 },
  dark_museum_wall: { color: 0x1c1a18, roughness: 0.9, metalness: 0.05 },
  glass_wall: { color: 0xbfe3f0, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.35 },
  heritage_wall: { color: 0x6b4a31, roughness: 0.8, metalness: 0.04 },
  wood_panel_wall: { color: 0x8a5a35, roughness: 0.7, metalness: 0.05 },
  futuristic_metal_wall: { color: 0x3a4a5c, roughness: 0.35, metalness: 0.75 },
  stone_archive_wall: { color: 0x5c5650, roughness: 0.95, metalness: 0 },
  custom_uploaded_texture: { color: 0xcfcac2, roughness: 0.8, metalness: 0.05 },
};

const FLOOR_STYLES = {
  polished_gallery_floor: { color: 0xe7e2d8, roughness: 0.25, metalness: 0.1 },
  marble_floor: { color: 0xeef0f2, roughness: 0.15, metalness: 0.05 },
  wood_floor: { color: 0x8a5a35, roughness: 0.55, metalness: 0.02 },
  black_reflective_floor: { color: 0x0c0c0e, roughness: 0.08, metalness: 0.4 },
  stone_floor: { color: 0x6e6a64, roughness: 0.85, metalness: 0 },
  street_floor: { color: 0x4a4a4d, roughness: 0.9, metalness: 0 },
  futuristic_grid_floor: { color: 0x101a2c, roughness: 0.4, metalness: 0.5, emissive: 0x1d4ed8, emissiveIntensity: 0.15 },
  custom_uploaded_texture: { color: 0xb8b3aa, roughness: 0.6, metalness: 0.05 },
};

const CEILING_STYLES = {
  none_open_sky: null,
  flat_gallery_ceiling: { color: 0xfbfaf7, roughness: 0.9, metalness: 0 },
  high_museum_ceiling: { color: 0xf2f0ec, roughness: 0.9, metalness: 0, heightMultiplier: 1.6 },
  glass_ceiling: { color: 0xcfe8f5, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.3 },
  cinematic_dark_ceiling: { color: 0x0a0a0c, roughness: 0.95, metalness: 0 },
  futuristic_light_ceiling: { color: 0xe8f0ff, roughness: 0.3, metalness: 0.2, emissive: 0x60a5fa, emissiveIntensity: 0.2 },
};

export function getSurfaceVisuals(config = {}) {
  return {
    wall: WALL_STYLES[config.wallStyle] || WALL_STYLES.white_gallery_wall,
    floor: FLOOR_STYLES[config.floorStyle] || FLOOR_STYLES.polished_gallery_floor,
    ceiling: config.ceilingStyle === "none_open_sky" ? null : (CEILING_STYLES[config.ceilingStyle] || CEILING_STYLES.flat_gallery_ceiling),
  };
}

// ---------------------------------------------------------------------------
// Mood / lighting
// ---------------------------------------------------------------------------

const LIGHTING_STYLES = {
  soft_gallery_lights: { ambientColor: 0xfff4e0, ambientIntensity: 0.55, keyColor: 0xfff1d6, keyIntensity: 1.1, keyType: "directional" },
  warm_memory_lights: { ambientColor: 0xffe9c7, ambientIntensity: 0.5, keyColor: 0xffcf9e, keyIntensity: 0.9, keyType: "point" },
  spotlight_path: { ambientColor: 0x1a1a22, ambientIntensity: 0.18, keyColor: 0xfff0c0, keyIntensity: 1.8, keyType: "spot" },
  neon_edge_lights: { ambientColor: 0x14102a, ambientIntensity: 0.25, keyColor: 0x8b5cf6, keyIntensity: 1.4, keyType: "point" },
  bright_daylight: { ambientColor: 0xffffff, ambientIntensity: 0.85, keyColor: 0xffffff, keyIntensity: 1.2, keyType: "directional" },
  stage_lights: { ambientColor: 0x110a14, ambientIntensity: 0.15, keyColor: 0xffffff, keyIntensity: 2.2, keyType: "spot" },
  balanced_soft: { ambientColor: 0xffffff, ambientIntensity: 0.6, keyColor: 0xffffff, keyIntensity: 0.9, keyType: "directional" },
};
const DEFAULT_LIGHTING = { ambientColor: 0xffffff, ambientIntensity: 0.55, keyColor: 0xffffff, keyIntensity: 1, keyType: "directional" };

const COLOR_TONES = {
  warm_white_gold: { accentColor: 0xe8c471, skyColor: 0xfdf6e3 },
  sepia_gold: { accentColor: 0xd2a45c, skyColor: 0xf0e0c0 },
  black_blue_gold: { accentColor: 0x60a5fa, skyColor: 0x05070f },
  blue_purple_cyan: { accentColor: 0x8b5cf6, skyColor: 0x070a18 },
  bright_multicolor: { accentColor: 0xf59e0b, skyColor: 0xeaf6ff },
  black_red_gold: { accentColor: 0xf43f5e, skyColor: 0x070506 },
  white_gray: { accentColor: 0x9ca3af, skyColor: 0xf5f5f5 },
};
const DEFAULT_TONE = { accentColor: 0x60a5fa, skyColor: 0x0b1020 };

const FOG_DENSITY = { false: 0, light: 0.012, medium: 0.028, heavy: 0.05 };
const GLOW_INTENSITY = { none: 0, subtle: 0.3, soft: 0.5, medium: 0.8, strong: 1.2, spotlight: 1.5 };

export function resolveMoodVisuals(config = {}) {
  const mood = getMoodPreset(config.moodPreset) || {};
  const lighting = config.lightingOverride || mood.lighting || "balanced_soft";
  const colorTone = config.colorToneOverride || mood.colorTone || "white_gray";
  const fogRaw = config.fogOverride || (mood.fog ?? "false");
  const fog = String(fogRaw) === "false" || fogRaw === false || !fogRaw ? "false" : String(fogRaw);
  const glow = config.glowOverride || mood.glow || "none";
  const music = config.backgroundMusicOverride || mood.backgroundMusic || "";

  const lightDesc = LIGHTING_STYLES[lighting] || DEFAULT_LIGHTING;
  const toneDesc = COLOR_TONES[colorTone] || DEFAULT_TONE;

  return {
    ...lightDesc,
    ...toneDesc,
    fogDensity: FOG_DENSITY[fog] ?? 0,
    fogColor: toneDesc.skyColor,
    glowIntensity: GLOW_INTENSITY[glow] ?? 0,
    lighting,
    colorTone,
    fog,
    glow,
    music,
  };
}

// ---------------------------------------------------------------------------
// Canvas-texture labels
// ---------------------------------------------------------------------------

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function wrapLines(ctx, text, maxWidth) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";
  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  });
  if (current) lines.push(current);
  return lines;
}

export function createCanvasTexture(text, options = {}) {
  const { width = 512, height = 160, background = "rgba(12,12,20,0.82)", color = "#f5f0e6", fontSize = 38, fontWeight = 700, border = "rgba(255,255,255,0.18)" } = options;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (background) {
    ctx.fillStyle = background;
    roundRect(ctx, 4, 4, width - 8, height - 8, 18);
    ctx.fill();
    if (border) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = border;
      roundRect(ctx, 4, 4, width - 8, height - 8, 18);
      ctx.stroke();
    }
  }
  ctx.fillStyle = color;
  ctx.font = `${fontWeight} ${fontSize}px "Inter", "Segoe UI", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const lines = wrapLines(ctx, text, width - 40).slice(0, 3);
  const lineHeight = fontSize * 1.18;
  const startY = height / 2 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, index) => ctx.fillText(line, width / 2, startY + index * lineHeight));
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function createLabel(text, { width = 1.6, height = 0.5, ...textOptions } = {}) {
  const texture = createCanvasTexture(text, textOptions);
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  mesh.userData.isLabel = true;
  return mesh;
}

// ---------------------------------------------------------------------------
// Room shell
// ---------------------------------------------------------------------------

function makeStandardMaterial(desc = {}, extra = {}) {
  const opts = { color: desc.color ?? 0xffffff, roughness: desc.roughness ?? 0.8, metalness: desc.metalness ?? 0.05, ...extra };
  if (desc.emissive != null) {
    opts.emissive = desc.emissive;
    opts.emissiveIntensity = desc.emissiveIntensity ?? 0.3;
  }
  if (desc.transparent) {
    opts.transparent = true;
    opts.opacity = desc.opacity ?? 0.4;
  }
  return new THREE.MeshStandardMaterial(opts);
}

export function buildRoomShell(dims, surfaces, zoneCount = 0) {
  const group = new THREE.Group();
  const { width, depth, height, shape } = dims;
  const floorMat = makeStandardMaterial(surfaces.floor);
  const wallMat = makeStandardMaterial(surfaces.wall);
  const ceilingMat = surfaces.ceiling ? makeStandardMaterial(surfaces.ceiling) : null;
  const ceilingHeight = height * (surfaces.ceiling?.heightMultiplier || 1);
  let floorMesh;

  if (shape === "cylinder") {
    const radius = width / 2;
    floorMesh = new THREE.Mesh(new THREE.CircleGeometry(radius, 48), floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    group.add(floorMesh);

    const wall = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 48, 1, true), makeStandardMaterial(surfaces.wall, { side: THREE.BackSide }));
    wall.position.y = height / 2;
    group.add(wall);

    if (ceilingMat) {
      const ceiling = new THREE.Mesh(new THREE.CircleGeometry(radius, 48), ceilingMat);
      ceiling.rotation.x = Math.PI / 2;
      ceiling.position.y = ceilingHeight;
      group.add(ceiling);
    }
    return { group, floorMesh };
  }

  floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), floorMat);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.receiveShadow = true;
  group.add(floorMesh);

  const wallThickness = 0.2;
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(width, height, wallThickness), wallMat);
  backWall.position.set(0, height / 2, -depth / 2);
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, height, depth), wallMat);
  leftWall.position.set(-width / 2, height / 2, 0);
  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, height, depth), wallMat);
  rightWall.position.set(width / 2, height / 2, 0);
  [backWall, leftWall, rightWall].forEach((wall) => {
    wall.receiveShadow = true;
    group.add(wall);
  });

  if (ceilingMat) {
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = ceilingHeight;
    group.add(ceiling);
  }

  if (shape === "stage") {
    const stageDepth = depth / 3;
    const stage = new THREE.Mesh(new THREE.BoxGeometry(width * 0.9, 0.4, stageDepth), makeStandardMaterial({ ...surfaces.floor, color: shiftColor(surfaces.floor.color, -0.12) }));
    stage.position.set(0, 0.2, -depth / 2 + stageDepth / 2);
    stage.receiveShadow = true;
    group.add(stage);
  }

  if (shape === "maze") {
    const partitions = Math.max(0, Math.min(3, zoneCount - 1));
    for (let i = 1; i <= partitions; i += 1) {
      const z = depth / 2 - (depth / (partitions + 1)) * i;
      const side = i % 2 === 0 ? -1 : 1;
      const partition = new THREE.Mesh(new THREE.BoxGeometry(width * 0.6, 1.6, wallThickness), wallMat);
      partition.position.set(side * width * 0.18, 0.8, z);
      group.add(partition);
    }
  }

  return { group, floorMesh };
}

export function buildLighting(mood, dims) {
  const lights = [new THREE.AmbientLight(mood.ambientColor, mood.ambientIntensity)];
  if (mood.keyType === "spot") {
    const spot = new THREE.SpotLight(mood.keyColor, mood.keyIntensity * 3, dims.depth * 1.5, Math.PI / 4, 0.4, 1.2);
    spot.position.set(0, dims.height - 0.4, dims.depth * 0.1);
    spot.target.position.set(0, 0, -dims.depth * 0.3);
    lights.push(spot, spot.target);
  } else if (mood.keyType === "point") {
    const point = new THREE.PointLight(mood.keyColor, mood.keyIntensity * 4, dims.depth * 1.4);
    point.position.set(0, dims.height - 0.6, -dims.depth * 0.2);
    lights.push(point);
  } else {
    const directional = new THREE.DirectionalLight(mood.keyColor, mood.keyIntensity);
    directional.position.set(dims.width * 0.3, dims.height, dims.depth * 0.4);
    lights.push(directional);
  }
  return lights;
}

// ---------------------------------------------------------------------------
// Object visuals
// ---------------------------------------------------------------------------

export const OBJECT_ICONS = {
  image_frame: "🖼", video_wall: "🎬", audio_point: "🔊", text_panel: "📜",
  artifact_display: "🏺", memory_capsule: "💭", door: "🚪", portal: "🌀",
  product_booth: "🛍", npc_guide: "🧭", quiz_station: "❓", collectible: "⭐",
  floating_button: "👉", direction_sign: "➜", light_source: "💡",
};

const ARROW_ANGLES = {
  north: 0, northeast: 45, east: 90, southeast: 135,
  south: 180, southwest: 225, west: 270, northwest: 315,
};

function makeResult(group) {
  return { group, interactive: false, kind: "", animated: [], labels: [], mediaRequests: [] };
}

function addLabel(result, text, position, options = {}) {
  const label = createLabel(text, options);
  label.position.set(...position);
  result.group.add(label);
  result.labels.push(label);
  return label;
}

function addBox(group, position, size, materialDesc, extra) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), makeStandardMaterial(materialDesc, extra));
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

export function objectLabelText(object = {}) {
  return object.title || object.name || object.label || "";
}

const OBJECT_BUILDERS = {
  image_frame: (object) => {
    const result = makeResult(new THREE.Group());
    addBox(result.group, [0, 0.6, 0], [1.6, 1.2, 0.08], { color: 0x2b2b2b, roughness: 0.6 });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.0), new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.5 }));
    screen.position.set(0, 0.6, 0.045);
    result.group.add(screen);
    if (object.imageUrl) {
      result.mediaRequests.push({ kind: "image", mesh: screen, url: object.imageUrl });
    } else {
      addLabel(result, `${OBJECT_ICONS.image_frame} Image`, [0, 0.6, 0.05], { width: 1.2, height: 0.4, fontSize: 56, background: null });
    }
    addLabel(result, objectLabelText(object) || "Image Frame", [0, 1.35, 0]);
    result.interactive = true;
    result.kind = "media";
    return result;
  },

  video_wall: (object) => {
    const result = makeResult(new THREE.Group());
    addBox(result.group, [0, 0.85, 0], [2.6, 1.5, 0.1], { color: 0x18181b, roughness: 0.5 });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.35), new THREE.MeshStandardMaterial({ color: 0x0b0b14, roughness: 0.4, emissive: 0x111122, emissiveIntensity: 0.4 }));
    screen.position.set(0, 0.85, 0.055);
    result.group.add(screen);
    if (object.videoUrl) {
      result.mediaRequests.push({ kind: "video", mesh: screen, object });
    } else if (object.thumbnailUrl) {
      result.mediaRequests.push({ kind: "image", mesh: screen, url: object.thumbnailUrl });
    } else {
      addLabel(result, `${OBJECT_ICONS.video_wall} Video`, [0, 0.85, 0.06], { width: 1.6, height: 0.5, fontSize: 64, background: null });
    }
    addLabel(result, objectLabelText(object) || "Video Wall", [0, 1.75, 0]);
    result.interactive = true;
    result.kind = "media";
    return result;
  },

  audio_point: (object) => {
    const result = makeResult(new THREE.Group());
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 16), new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.6, roughness: 0.3 }));
    orb.position.set(0, 1.2, 0);
    result.group.add(orb);
    result.animated.push({ mesh: orb, type: "pulse" });
    addLabel(result, `${OBJECT_ICONS.audio_point} ${objectLabelText(object) || "Audio"}`, [0, 1.75, 0]);
    result.interactive = true;
    result.kind = "audio";
    return result;
  },

  text_panel: (object) => {
    const result = makeResult(new THREE.Group());
    const texture = createCanvasTexture(`${objectLabelText(object) || "Story"}\n\n${object.body || ""}`, { width: 768, height: 480, background: "rgba(244,236,219,0.95)", color: "#2b2118", fontSize: 34, border: "rgba(60,40,20,0.35)" });
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.1), new THREE.MeshBasicMaterial({ map: texture, transparent: true }));
    panel.position.set(0, 1.0, 0);
    result.group.add(panel);
    result.interactive = true;
    result.kind = "media";
    return result;
  },

  artifact_display: (object) => {
    const result = makeResult(new THREE.Group());
    addBox(result.group, [0, 0.45, 0], [0.8, 0.9, 0.8], { color: 0xd9cdb8, roughness: 0.7 });
    if (object.imageUrl) {
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 }));
      plane.position.set(0, 1.2, 0.41);
      result.group.add(plane);
      result.mediaRequests.push({ kind: "image", mesh: plane, url: object.imageUrl });
    } else {
      const artifact = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 0), new THREE.MeshStandardMaterial({ color: 0xc9a56d, roughness: 0.4, metalness: 0.2 }));
      artifact.position.set(0, 1.2, 0);
      result.group.add(artifact);
      result.animated.push({ mesh: artifact, type: "rotate" });
    }
    addLabel(result, objectLabelText(object) || "Artifact", [0, 1.85, 0]);
    result.interactive = true;
    result.kind = "media";
    return result;
  },

  memory_capsule: (object) => {
    const result = makeResult(new THREE.Group());
    const color = resolveColor(object.color, 0xe8c471);
    const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28, 1), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.5, transparent: true, opacity: 0.88, roughness: 0.2 }));
    orb.position.set(0, 1.3, 0);
    result.group.add(orb);
    result.animated.push({ mesh: orb, type: "bob" }, { mesh: orb, type: "spin" });
    addLabel(result, `${OBJECT_ICONS.memory_capsule} ${objectLabelText(object) || "Memory"}`, [0, 1.9, 0]);
    result.interactive = true;
    result.kind = "media";
    return result;
  },

  door: (object) => {
    const result = makeResult(new THREE.Group());
    const locked = !!object.locked;
    const frameColor = locked ? 0x7f1d1d : 0x3a2c1d;
    addBox(result.group, [-0.54, 1.2, 0], [0.12, 2.4, 0.12], { color: frameColor, roughness: 0.6 });
    addBox(result.group, [0.54, 1.2, 0], [0.12, 2.4, 0.12], { color: frameColor, roughness: 0.6 });
    addBox(result.group, [0, 2.34, 0], [1.2, 0.15, 0.12], { color: frameColor, roughness: 0.6 });
    const panelColor = locked ? 0x5c2222 : resolveColor(object.color, 0x4a3826);
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.96, 2.1), new THREE.MeshStandardMaterial({ color: panelColor, roughness: 0.55, emissive: panelColor, emissiveIntensity: 0.12 }));
    panel.position.set(0, 1.1, 0.061);
    result.group.add(panel);
    const icon = locked ? "🔒" : OBJECT_ICONS.door;
    const label = addLabel(result, `${icon} ${objectLabelText(object) || "Door"}`, [0, 2.7, 0]);
    result.interactive = true;
    result.kind = "nav";
    result.group.userData.panelMesh = panel;
    result.group.userData.labelMesh = label;
    return result;
  },

  portal: (object) => {
    const result = makeResult(new THREE.Group());
    const locked = !!object.locked;
    const color = locked ? 0xef4444 : resolveColor(object.color, 0x67e8f9);
    const torus = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.08, 16, 48), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.7, roughness: 0.25 }));
    torus.position.set(0, 1.2, 0);
    result.group.add(torus);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.8, 32), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.22, depthWrite: false }));
    disc.position.set(0, 1.2, 0.01);
    result.group.add(disc);
    result.animated.push({ mesh: torus, type: "spin" });
    const icon = locked ? "🔒" : OBJECT_ICONS.portal;
    const label = addLabel(result, `${icon} ${objectLabelText(object) || "Portal"}`, [0, 2.25, 0]);
    result.interactive = true;
    result.kind = "nav";
    result.group.userData.torusMesh = torus;
    result.group.userData.discMesh = disc;
    result.group.userData.labelMesh = label;
    return result;
  },

  product_booth: (object) => {
    const result = makeResult(new THREE.Group());
    addBox(result.group, [0, 0.45, 0], [1.4, 0.9, 0.6], { color: 0x8a5a35, roughness: 0.6 });
    const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.0), new THREE.MeshStandardMaterial({ color: 0xeceae3, roughness: 0.6 }));
    backdrop.position.set(0, 1.45, -0.29);
    result.group.add(backdrop);
    if (object.imageUrl) {
      result.mediaRequests.push({ kind: "image", mesh: backdrop, url: object.imageUrl });
    }
    const priceText = object.price ? `${object.brandName || ""} — ${object.productName || "Product"}\n${object.price}` : `${object.brandName || ""} ${object.productName || "Product"}`;
    addLabel(result, priceText.trim() || "Product Booth", [0, 0.95, 0.31], { width: 1.4, height: 0.45 });
    result.interactive = true;
    result.kind = "product";
    return result;
  },

  npc_guide: (object) => {
    const result = makeResult(new THREE.Group());
    const color = 0x22d3ee;
    const material = new THREE.MeshStandardMaterial({ color, emissive: 0x0891b2, emissiveIntensity: 0.6, transparent: true, opacity: 0.85, roughness: 0.25 });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.26, 0.85, 6, 12), material);
    body.position.set(0, 1.05, 0);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), material);
    head.position.set(0, 1.75, 0);
    result.group.add(body, head);
    const base = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.025, 8, 48), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7 }));
    base.rotation.x = Math.PI / 2;
    base.position.y = 0.03;
    result.group.add(base);
    result.animated.push({ mesh: result.group, type: "sway" }, { mesh: base, type: "spin" });
    addLabel(result, `${OBJECT_ICONS.npc_guide} ${objectLabelText(object) || "Guide"}`, [0, 2.15, 0]);
    result.interactive = true;
    result.kind = "npc";
    return result;
  },

  quiz_station: (object) => {
    const result = makeResult(new THREE.Group());
    addBox(result.group, [0, 0.55, 0], [0.7, 1.1, 0.5], { color: 0x27272a, roughness: 0.5, metalness: 0.2 });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.4), new THREE.MeshStandardMaterial({ color: 0x111827, emissive: 0x60a5fa, emissiveIntensity: 0.3, roughness: 0.4 }));
    screen.position.set(0, 1.0, 0.26);
    result.group.add(screen);
    addLabel(result, `${OBJECT_ICONS.quiz_station} ${object.question ? "Quiz" : "Quiz Station"}`, [0, 1.55, 0]);
    result.interactive = true;
    result.kind = "quiz";
    return result;
  },

  collectible: (object) => {
    const result = makeResult(new THREE.Group());
    const color = resolveColor(object.rarity, 0xfacc15);
    const gem = new THREE.Mesh(new THREE.IcosahedronGeometry(0.18, 0), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.7, roughness: 0.2, metalness: 0.3 }));
    gem.position.set(0, 1.1, 0);
    result.group.add(gem);
    result.animated.push({ mesh: gem, type: "bob" }, { mesh: gem, type: "spin" });
    addLabel(result, `${OBJECT_ICONS.collectible} ${objectLabelText(object) || "Collectible"}`, [0, 1.6, 0]);
    result.interactive = true;
    result.kind = "collectible";
    return result;
  },

  floating_button: (object) => {
    const result = makeResult(new THREE.Group());
    const color = resolveColor(object.color, 0x6366f1);
    const size = Number(object.size) || 0.3;
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(size, size, 0.12, 24), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.5, roughness: 0.3, metalness: 0.2 }));
    disc.position.set(0, 1.4, 0);
    result.group.add(disc);
    result.animated.push({ mesh: result.group, type: "bob" });
    addLabel(result, `${OBJECT_ICONS.floating_button} ${object.label || objectLabelText(object) || "Action"}`, [0, 1.95, 0]);
    result.interactive = true;
    result.kind = "button";
    return result;
  },

  direction_sign: (object) => {
    const result = makeResult(new THREE.Group());
    addBox(result.group, [0, 0.8, 0], [0.06, 1.6, 0.06], { color: 0x4a3826, roughness: 0.7 });
    const board = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.42), new THREE.MeshBasicMaterial({}));
    board.position.set(0, 1.55, 0);
    const angle = ARROW_ANGLES[String(object.arrowDirection || "north").toLowerCase()] ?? 0;
    board.rotation.y = THREE.MathUtils.degToRad(angle);
    const texture = createCanvasTexture(`➜ ${object.label || objectLabelText(object) || "This way"}`, { width: 512, height: 240, background: "rgba(74,56,38,0.92)", color: "#fdf6e3", fontSize: 46 });
    board.material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    result.group.add(board);
    result.kind = "sign";
    return result;
  },

  light_source: (object) => {
    const result = makeResult(new THREE.Group());
    const color = resolveColor(object.color, 0xffffff);
    const intensity = Number(object.intensity) || 1;
    const light = new THREE.PointLight(color, intensity * 2, 0);
    light.position.set(0, 0, 0);
    result.group.add(light);
    const marker = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), new THREE.MeshBasicMaterial({ color }));
    result.group.add(marker);
    result.animated.push({ mesh: marker, type: "pulse" });
    result.kind = "light";
    return result;
  },
};

export function buildObjectGroup(object = {}) {
  const builder = OBJECT_BUILDERS[object.type];
  if (!builder) return null;
  const result = builder(object);
  result.group.userData.threeDObject = object;
  result.group.userData.interactive = result.interactive;
  result.group.userData.kind = result.kind;
  return result;
}

// ---------------------------------------------------------------------------
// Spawn point + guided-tour stations
// ---------------------------------------------------------------------------

export function getSpawnPosition(config = {}, dims) {
  switch (config.spawnPoint) {
    case "middle_of_room":
      return { x: 0, y: EYE_HEIGHT, z: 0, yaw: 0 };
    case "custom_xyz": {
      const custom = config.spawnPointCustom || {};
      return { x: Number(custom.x) || 0, y: EYE_HEIGHT + (Number(custom.y) || 0), z: Number(custom.z) || 0, yaw: 0 };
    }
    case "cinematic_start_marker":
    case "entrance_door":
    case "front_center":
    default:
      return { x: 0, y: EYE_HEIGHT, z: dims.depth / 2 - 1.2, yaw: 0 };
  }
}

export function getStations(config = {}, dims) {
  const zones = config.zones || [];
  if (!zones.length) {
    const template = getWorldTemplate(config.selectedTemplate);
    return [{
      id: "main",
      name: template?.name || "Main Hall",
      description: "",
      position: { x: 0, y: EYE_HEIGHT, z: dims.depth / 2 - 1.5 },
      lookAt: { x: 0, y: EYE_HEIGHT, z: -dims.depth / 2 },
    }];
  }
  const count = zones.length;
  const step = dims.depth / (count + 1);
  return zones.map((zone, index) => {
    const z = dims.depth / 2 - step * (index + 1);
    return {
      id: zone.id || `zone_${index}`,
      name: zone.name || `Zone ${index + 1}`,
      description: zone.description || "",
      position: { x: 0, y: EYE_HEIGHT, z: z + step * 0.4 },
      lookAt: { x: 0, y: EYE_HEIGHT, z: z - step * 0.6 },
    };
  });
}

export function clampToRoom(x, z, dims, margin = 0.6) {
  if (dims.shape === "cylinder") {
    const radius = dims.width / 2 - margin;
    const distance = Math.hypot(x, z);
    if (distance > radius && distance > 0) {
      const scale = radius / distance;
      return { x: x * scale, z: z * scale };
    }
    return { x, z };
  }
  const halfW = dims.width / 2 - margin;
  const halfD = dims.depth / 2 - margin;
  return { x: Math.max(-halfW, Math.min(halfW, x)), z: Math.max(-halfD, Math.min(halfD, z)) };
}

// ---------------------------------------------------------------------------
// Door / collectible unlock matching
// ---------------------------------------------------------------------------

function normalizeToken(value = "") {
  return String(value || "").toLowerCase().replace(/^visitor_collects_/, "").replace(/[^a-z0-9]+/g, "");
}

export function isDoorUnlocked(object, collectedIds = new Set(), collectibles = []) {
  if (!object.locked) return true;
  const condition = normalizeToken(object.unlockCondition);
  return collectibles.some((collectible) => {
    if (!collectedIds.has(collectible.id)) return false;
    if ((collectible.unlocks || []).includes(object.id)) return true;
    if (!condition) return false;
    const name = normalizeToken(collectible.name);
    const id = normalizeToken(collectible.id);
    return (name && (condition.includes(name) || name.includes(condition))) || (id && (condition.includes(id) || id.includes(condition)));
  });
}

// ---------------------------------------------------------------------------
// Atmosphere particles — deterministic layout via a seeded PRNG so the same
// room always renders the same particle field (motion is decorative only).
// ---------------------------------------------------------------------------

export function seedFromString(text = "") {
  let hash = 0x811c9dc5;
  const value = String(text);
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function createSeededRandom(seed = 1) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ATMOSPHERE_STYLES = {
  dust_motes: { color: 0xfff7e0, size: 0.05, opacity: 0.4 },
  floating_lights: { color: null, size: 0.09, opacity: 0.75 },
  gentle_snow: { color: 0xffffff, size: 0.07, opacity: 0.7 },
  warm_embers: { color: 0xffa743, size: 0.06, opacity: 0.75 },
};

export function buildAtmosphere(effect, dims, accentColor, { count = 100, seed = 1 } = {}) {
  const style = ATMOSPHERE_STYLES[effect];
  if (!style) return null;
  const random = createSeededRandom(seed);
  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  const phases = new Float32Array(count);
  const halfW = dims.width / 2 - 0.4;
  const halfD = dims.depth / 2 - 0.4;
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (random() * 2 - 1) * halfW;
    positions[i * 3 + 1] = 0.2 + random() * (dims.height - 0.4);
    positions[i * 3 + 2] = (random() * 2 - 1) * halfD;
    speeds[i] = 0.15 + random() * 0.35;
    phases[i] = random() * Math.PI * 2;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: style.color ?? accentColor,
    size: style.size,
    transparent: true,
    opacity: style.opacity,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geometry, material);
  const attribute = geometry.getAttribute("position");
  const update = (elapsed, delta) => {
    for (let i = 0; i < count; i += 1) {
      let y = attribute.getY(i);
      if (effect === "gentle_snow") {
        y -= speeds[i] * delta;
        if (y < 0.1) y = dims.height - 0.15;
      } else if (effect === "warm_embers") {
        y += speeds[i] * delta;
        if (y > dims.height - 0.15) y = 0.1;
      } else {
        y += Math.sin(elapsed * 0.4 + phases[i]) * 0.0012;
      }
      attribute.setY(i, y);
    }
    attribute.needsUpdate = true;
  };
  return { points, update };
}

export { EYE_HEIGHT, titleCase };
