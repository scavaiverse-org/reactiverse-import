// Pure, deterministic scene description for the 3D World renderer.
//
// Turns a threeDWorldConfig into a plain-object "scene spec" — room
// dimensions, surface colours, mood lighting, and the exact placement of every
// object (framed wall art, pedestals, doors, NPC, bench, title). No three.js,
// no DOM, and crucially NO Math.random: the same config always produces the
// identical spec, which is what makes the editor preview and the published
// front end render deterministically the same world.

import { getMoodPreset, getWorldTemplate } from "@/lib/three-d-world-seed";

// Room footprint per size. Galleries read best as halls (depth > width).
const ROOM_DIMENSIONS = {
  small: { w: 8, d: 12, h: 4.5 },
  medium: { w: 10, d: 18, h: 5 },
  large: { w: 14, d: 24, h: 6 },
  massive: { w: 18, d: 32, h: 7 },
};

const WALL_COLORS = {
  white_gallery_wall: "#ece9e2",
  dark_museum_wall: "#1c1c22",
  glass_wall: "#2a3a44",
  heritage_wall: "#6b5a44",
  wood_panel_wall: "#5a3f28",
  futuristic_metal_wall: "#3a3f4a",
  stone_archive_wall: "#807a70",
  custom_uploaded_texture: "#c9c6bf",
};

const FLOOR_COLORS = {
  polished_gallery_floor: "#2c2622",
  marble_floor: "#d9d4cc",
  wood_floor: "#6b4a2e",
  black_reflective_floor: "#0d0d10",
  stone_floor: "#6e6862",
  street_floor: "#454545",
  futuristic_grid_floor: "#141821",
  custom_uploaded_texture: "#3a3a3a",
};

const CEILING_COLORS = {
  none_open_sky: "#0b1020",
  flat_gallery_ceiling: "#c5c2bb",
  high_museum_ceiling: "#b9b4ab",
  glass_ceiling: "#1a2230",
  cinematic_dark_ceiling: "#0e0e12",
  futuristic_light_ceiling: "#dfe6ef",
};

// Mood → render parameters. accent is the glow/spotlight tint.
const MOOD_LIGHTING = {
  premium_calm: { background: "#0e0d0b", ambient: "#fff3df", ambientIntensity: 0.55, key: "#ffe9c7", keyIntensity: 1.4, accent: "#e7c789", fog: 0.012 },
  nostalgic_warm: { background: "#140d07", ambient: "#ffdcab", ambientIntensity: 0.5, key: "#ffcf94", keyIntensity: 1.3, accent: "#e0a861", fog: 0.03 },
  cinematic_dark: { background: "#05070c", ambient: "#9fb4d6", ambientIntensity: 0.32, key: "#ffd9a0", keyIntensity: 1.6, accent: "#7fb2ff", fog: 0.04 },
  futuristic_glow: { background: "#070912", ambient: "#9fd2ff", ambientIntensity: 0.42, key: "#bfe4ff", keyIntensity: 1.5, accent: "#6ad0ff", fog: 0.02 },
  futuristic_blue: { background: "#070912", ambient: "#9fd2ff", ambientIntensity: 0.42, key: "#bfe4ff", keyIntensity: 1.5, accent: "#6ad0ff", fog: 0.02 },
  lively_public: { background: "#14161a", ambient: "#ffffff", ambientIntensity: 0.7, key: "#ffffff", keyIntensity: 1.5, accent: "#ffd36a", fog: 0 },
  stage_spotlight: { background: "#0a0506", ambient: "#ffb3a0", ambientIntensity: 0.3, key: "#ffd9a0", keyIntensity: 1.9, accent: "#ff7a6a", fog: 0.02 },
  neutral_clean: { background: "#16171a", ambient: "#ffffff", ambientIntensity: 0.62, key: "#ffffff", keyIntensity: 1.35, accent: "#9aa0a6", fog: 0 },
};

const FOG_LEVEL = { false: 0, none: 0, light: 0.018, medium: 0.035, heavy: 0.06 };

const DEFAULT_MOOD = MOOD_LIGHTING.neutral_clean;

// Objects placed flat against the walls as framed pieces.
const WALL_ART_TYPES = new Set([
  "image_frame", "video_wall", "text_panel", "memory_capsule",
  "collectible", "quiz_station", "audio_point", "direction_sign", "floating_button",
]);
// Objects placed on the floor as standing pieces.
const PEDESTAL_TYPES = new Set(["artifact_display", "product_booth"]);
const NAV_TYPES = new Set(["door", "portal"]);

export function getRoomDimensions(config = {}) {
  return ROOM_DIMENSIONS[config.roomSize] || ROOM_DIMENSIONS.medium;
}

export function getSurfaceColors(config = {}) {
  const ceilingStyle = config.ceilingStyle || "flat_gallery_ceiling";
  return {
    wall: WALL_COLORS[config.wallStyle] || WALL_COLORS.white_gallery_wall,
    floor: FLOOR_COLORS[config.floorStyle] || FLOOR_COLORS.polished_gallery_floor,
    ceiling: CEILING_COLORS[ceilingStyle] || CEILING_COLORS.flat_gallery_ceiling,
    hasCeiling: ceilingStyle !== "none_open_sky",
  };
}

export function getMoodLighting(config = {}) {
  const base = MOOD_LIGHTING[config.moodPreset] || DEFAULT_MOOD;
  // An explicit fog override (from the editor) wins over the mood default.
  const fogKey = config.fogOverride;
  const fog = fogKey != null && fogKey !== "" && FOG_LEVEL[fogKey] != null ? FOG_LEVEL[fogKey] : base.fog;
  return { ...base, fog };
}

function primaryMedia(object = {}) {
  return object.imageUrl || object.thumbnailUrl || object.mediaUrl || object.iconUrl || "";
}

function objectText(object = {}) {
  return object.body || object.description || object.story || "";
}

function objectLabel(object = {}, index = 0) {
  return object.title || object.name || object.label || `Object ${index + 1}`;
}

// Returns true when a position is unset or the editor's default {0,1,-3}, in
// which case we auto-place the object for a clean gallery; an admin-set custom
// position is honoured instead.
function isDefaultPosition(position) {
  if (!position) return true;
  const { x = 0, y = 0, z = 0 } = position;
  return x === 0 && z === -3 && (y === 1 || y === 0);
}

/**
 * Deterministic gallery layout. Given the visible objects, returns the full
 * placement of wall art, pedestals, doors, NPCs and signage. Index order in
 * `objects` fully determines positions, so the layout never shifts between
 * renders for the same world.
 */
export function buildSceneSpec(config = {}, room = {}) {
  const dims = getRoomDimensions(config);
  const colors = getSurfaceColors(config);
  const lighting = getMoodLighting(config);
  const accent = config.colorToneOverride ? lighting.accent : lighting.accent;

  const objects = (config.objects || []).filter((object) => object && object.visible !== false);

  const wallArt = [];
  const pedestals = [];
  const doors = [];
  const npcs = [];

  const halfW = dims.w / 2;
  const halfD = dims.d / 2;

  // --- Wall art: alternate left / right walls marching front→back, overflow
  // to the back wall. Eye-height, evenly spaced. ---
  const artObjects = objects.filter((o) => WALL_ART_TYPES.has(o.type));
  const spacing = 2.7;
  const zStart = -halfD + 2.6;
  const zEnd = halfD - 2.6;
  const slotsPerSide = Math.max(1, Math.floor((zEnd - zStart) / spacing) + 1);
  let backWallArt = 0;
  artObjects.forEach((object, i) => {
    const idx = artObjects.indexOf(object);
    const sideIndex = i; // marching index
    const slot = Math.floor(sideIndex / 2);
    const onSide = slot < slotsPerSide;
    const custom = !isDefaultPosition(object.position);
    let position;
    let rotationY;
    let wall;
    if (custom) {
      const p = object.position;
      position = [Number(p.x) || 0, (Number(p.y) || 1.8), Number(p.z) || 0];
      rotationY = ((Number(object.rotation?.y) || 0) * Math.PI) / 180;
      wall = "custom";
    } else if (onSide) {
      const left = sideIndex % 2 === 0;
      const z = zStart + slot * spacing;
      position = [left ? -halfW + 0.12 : halfW - 0.12, 1.8, z];
      rotationY = left ? Math.PI / 2 : -Math.PI / 2;
      wall = left ? "left" : "right";
    } else {
      // Overflow onto the back wall, spread horizontally.
      const n = backWallArt;
      backWallArt += 1;
      const spread = Math.min(3, dims.w - 3);
      const x = backWallArt === 1 ? 0 : (n % 2 === 0 ? -1 : 1) * (1.6 + Math.floor(n / 2) * spread / 2);
      position = [Math.max(-halfW + 1.4, Math.min(halfW - 1.4, x)), 1.8, -halfD + 0.12];
      rotationY = 0;
      wall = "back";
    }
    wallArt.push({
      id: object.id || `art_${idx}`,
      object,
      kind: object.type,
      label: objectLabel(object, idx),
      mediaUrl: primaryMedia(object),
      text: objectText(object),
      color: object.color || "",
      position,
      rotationY,
      wall,
    });
  });

  // --- Pedestals down the centre aisle, gently offset left/right. ---
  const pedestalObjects = objects.filter((o) => PEDESTAL_TYPES.has(o.type));
  const pedSpacing = 3.2;
  const pedStart = -halfD + 3.4;
  pedestalObjects.forEach((object, i) => {
    const custom = !isDefaultPosition(object.position);
    const z = custom ? Number(object.position.z) || 0 : pedStart + i * pedSpacing;
    const x = custom ? Number(object.position.x) || 0 : (i % 2 === 0 ? -1.5 : 1.5);
    pedestals.push({
      id: object.id || `ped_${i}`,
      object,
      kind: object.type,
      label: objectLabel(object, i),
      mediaUrl: primaryMedia(object),
      color: object.color || "",
      position: [x, 0, Math.max(-halfD + 1.5, Math.min(halfD - 3.5, z))],
    });
  });

  // --- Doors / portals: back corners first, then front corners, then sides. ---
  const navObjects = objects.filter((o) => NAV_TYPES.has(o.type));
  const doorSlots = [
    { position: [-halfW + 1.7, 0, -halfD + 0.18], rotationY: 0 },
    { position: [halfW - 1.7, 0, -halfD + 0.18], rotationY: 0 },
    { position: [-halfW + 1.7, 0, halfD - 0.18], rotationY: Math.PI },
    { position: [halfW - 1.7, 0, halfD - 0.18], rotationY: Math.PI },
    { position: [-halfW + 0.18, 0, halfD - 3], rotationY: Math.PI / 2 },
    { position: [halfW - 0.18, 0, halfD - 3], rotationY: -Math.PI / 2 },
  ];
  navObjects.forEach((object, i) => {
    const slot = doorSlots[i % doorSlots.length];
    doors.push({
      id: object.id || `door_${i}`,
      object,
      kind: object.type,
      label: objectLabel(object, i),
      locked: !!object.locked,
      color: object.color || "",
      position: slot.position,
      rotationY: slot.rotationY,
    });
  });

  // --- NPC guide near the entrance. ---
  objects.filter((o) => o.type === "npc_guide").forEach((object, i) => {
    npcs.push({
      id: object.id || `npc_${i}`,
      object,
      label: objectLabel(object, i),
      position: [i === 0 ? -1.8 : 1.8, 0, halfD - 3.6],
    });
  });

  const template = getWorldTemplate(config.selectedTemplate);
  const mood = getMoodPreset(config.moodPreset);
  const title = (room.title || template?.name || "3D World").toUpperCase();
  const subtitle = mood?.name || template?.category || "";

  return {
    dimensions: dims,
    colors,
    lighting,
    accent,
    title,
    subtitle,
    hasBench: dims.d >= 14,
    wallArt,
    pedestals,
    doors,
    npcs,
    objectCount: objects.length,
  };
}

export { WALL_ART_TYPES, PEDESTAL_TYPES, NAV_TYPES };
