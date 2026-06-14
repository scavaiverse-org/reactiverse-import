// Validation, performance estimation, and publish-readiness checks for the
// 3D World Builder. Pure functions over room.threeDWorldConfig so the same
// logic powers the editor warnings panel, the publish checklist, and the
// museum-wide publish gate.

import { THREE_D_WORLD_EDITOR_SEED, getWorldTemplate } from "@/lib/three-d-world-seed";

export const THREE_D_WORLD_PAGE_TYPE = "three_d_world";

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function isThreeDWorldRoom(room = {}) {
  const type = String(room.page_type || room.master_page_type || room.masterPageType || "").toLowerCase();
  return THREE_D_WORLD_EDITOR_SEED.conditionalDisplayRule.showWhenValueIncludes
    .map((value) => value.toLowerCase())
    .includes(type);
}

// Rooms persist through a snake_case storage layer that re-emits camelCase
// aliases on read, so accept both spellings when reading the config. A config
// only counts as initialised once the builder created it (enabled flag set) —
// room normalisation fabricates empty config objects for every type.
export function getThreeDWorldConfig(room = {}) {
  const config = room.threeDWorldConfig || room.three_d_world_config || null;
  return config && config.enabled ? config : null;
}

export function createThreeDWorldConfig(overrides = {}) {
  return {
    enabled: true,
    selectedTemplate: "",
    moodPreset: "",
    lightingOverride: "",
    backgroundMusicOverride: "",
    colorToneOverride: "",
    fogOverride: "",
    glowOverride: "",
    atmosphereEffect: "none",
    backgroundMusicUrl: "",
    roomSize: "medium",
    layoutShape: "single_room",
    wallStyle: "white_gallery_wall",
    floorStyle: "polished_gallery_floor",
    ceilingStyle: "flat_gallery_ceiling",
    spawnPoint: "front_center",
    spawnPointCustom: { x: 0, y: 0, z: 0 },
    movementMode: "click_to_move",
    mobileControls: true,
    guidedPathEnabled: false,
    autoWalkthroughEnabled: false,
    zones: [],
    objects: [],
    gamification: { enabled: false, systems: [], collectibles: [], questSteps: [], badges: [], completionReward: "" },
    npcGuide: { enabled: false, npcType: "", avatarStyle: "", tone: "", openingLine: "", script: "", dialogueSteps: [], triggerType: "on_room_start" },
    accessibility: { sensoryWarning: "", textScale: "normal", highContrast: false, twoDFallbackEnabled: true, miniMapEnabled: true },
    performanceSettings: { maxObjectsMobile: THREE_D_WORLD_EDITOR_SEED.performanceRules.defaultMaxObjectsMobile, maxObjectsDesktop: THREE_D_WORLD_EDITOR_SEED.performanceRules.defaultMaxObjectsDesktop, optimisationsApplied: [] },
    previewMode: "admin_preview",
    previewChecked: false,
    recommendedWarningsConfirmed: false,
    publishStatus: "draft",
    publishManifest: null,
    versionHistory: [],
    versionCounter: 0,
    ...overrides,
  };
}

export function buildSampleWorldConfig() {
  const sample = deepClone(THREE_D_WORLD_EDITOR_SEED.defaultSampleWorld);
  return createThreeDWorldConfig({
    selectedTemplate: sample.selectedTemplate,
    moodPreset: sample.moodPreset,
    roomSize: sample.roomSize,
    layoutShape: sample.layoutShape,
    movementMode: sample.movementMode,
    spawnPoint: sample.spawnPoint,
    zones: sample.zones,
    objects: sample.starterObjects,
    gamification: { ...createThreeDWorldConfig().gamification, ...sample.gamification },
    publishStatus: sample.publishStatus,
  });
}

// Fully-furnished room layouts for the "Autofill 3D" button. Each one reads
// like a styled interior — gallery walls, seating/display pieces, a host NPC,
// and at least two exits — so the world is publish-ready as soon as it's
// generated. Every click picks a different layout than the one currently
// applied, so repeated autofills cycle through distinct looks.
export const AUTOFILL_WORLD_LAYOUTS = [
  {
    id: "heritage_gallery",
    label: "Heritage Gallery",
    selectedTemplate: "museum_gallery",
    moodPreset: "premium_calm",
    roomSize: "medium",
    layoutShape: "single_room",
    wallStyle: "white_gallery_wall",
    floorStyle: "marble_floor",
    ceilingStyle: "flat_gallery_ceiling",
    movementMode: "click_to_move_guided",
    spawnPoint: "front_center",
    zones: [
      { id: "zone_entrance", name: "Entrance", description: "Visitors arrive and get a short welcome." },
      { id: "zone_gallery_wall", name: "Gallery Wall", description: "Framed portraits and a heritage timeline." },
      { id: "zone_exhibits", name: "Curated Exhibits", description: "A reading shelf and lounge seating display." },
    ],
    objects: [
      { id: "welcome_panel", type: "text_panel", title: "Welcome to the Gallery", body: "Step inside to explore curated portraits, heritage exhibits, and a quiet reading corner.", clickAction: "open_popup" },
      { id: "portrait_wall", type: "image_frame", title: "Founders Portrait Wall", caption: "Portraits of the founding team.", clickAction: "open_popup" },
      { id: "heritage_timeline", type: "image_frame", title: "Heritage Timeline", caption: "Key moments from our history.", clickAction: "open_popup" },
      { id: "reading_shelf", type: "artifact_display", title: "Curator's Reading Shelf", description: "A shelf of catalogues and reference books." },
      { id: "lounge_seating", type: "artifact_display", title: "Lounge Seating Display", description: "A curated seating area for visitors to rest." },
      { id: "founding_story", type: "memory_capsule", title: "The Founding Story", story: "Hear how this collection began.", color: "warm_gold", clickAction: "show_story" },
      { id: "gallery_host", type: "npc_guide", name: "Gallery Host", title: "Gallery Host", script: "Welcome. Take your time with the portraits, then visit the reading shelf before you go.", triggerType: "on_room_start" },
      { id: "exit_door", type: "door", title: "Exit to Main Lobby", destinationRoomId: "room_main_lobby", locked: false },
      { id: "next_exhibit_portal", type: "portal", title: "Enter Next Exhibit", destinationRoomId: "room_next_exhibit", portalEffect: "soft_gold_warp", locked: false, color: "gold" },
    ],
  },
  {
    id: "memory_lounge",
    label: "Memory Lounge",
    selectedTemplate: "memory_archive",
    moodPreset: "nostalgic_warm",
    roomSize: "medium",
    layoutShape: "long_corridor",
    wallStyle: "heritage_wall",
    floorStyle: "wood_floor",
    ceilingStyle: "high_museum_ceiling",
    movementMode: "guided_walkthrough",
    spawnPoint: "entrance_door",
    zones: [
      { id: "zone_entrance", name: "Entrance", description: "Visitors arrive in a warm, lamplit hallway." },
      { id: "zone_family_wall", name: "Family Wall", description: "Framed family photographs line the corridor." },
      { id: "zone_memory_nook", name: "Memory Nook", description: "A cozy reading nook with memory capsules." },
    ],
    objects: [
      { id: "welcome_panel", type: "text_panel", title: "Welcome to the Memory Lounge", body: "Wander through family photographs and personal stories collected over the years.", clickAction: "open_popup" },
      { id: "family_portraits", type: "image_frame", title: "Family Portrait Wall", caption: "Portraits passed down through generations.", clickAction: "open_popup" },
      { id: "old_photographs", type: "image_frame", title: "Old Photographs", caption: "Snapshots from years gone by.", clickAction: "open_popup" },
      { id: "grandmothers_letter", type: "memory_capsule", title: "Grandmother's Letter", story: "A handwritten letter kept safe for decades.", color: "warm_gold", clickAction: "show_story" },
      { id: "childhood_home", type: "memory_capsule", title: "Childhood Home", story: "A memory of the house where it all began.", color: "warm_gold", clickAction: "show_story" },
      { id: "reading_nook", type: "artifact_display", title: "Cozy Reading Nook", description: "A soft armchair and side table for quiet reflection." },
      { id: "memory_keeper", type: "npc_guide", name: "Memory Keeper", title: "Memory Keeper", script: "This room holds memories. Take your time as you move through them.", triggerType: "on_room_start" },
      { id: "exit_door", type: "door", title: "Exit to Archive Hall", destinationRoomId: "room_archive_hall", locked: false },
      { id: "lobby_portal", type: "portal", title: "Return to Lobby", destinationRoomId: "room_main_lobby", portalEffect: "soft_gold_warp", locked: false, color: "gold" },
    ],
  },
  {
    id: "neon_game_room",
    label: "Neon Game Room",
    selectedTemplate: "futuristic_room",
    moodPreset: "futuristic_glow",
    roomSize: "medium",
    layoutShape: "multi_zone_hall",
    wallStyle: "futuristic_metal_wall",
    floorStyle: "futuristic_grid_floor",
    ceilingStyle: "futuristic_light_ceiling",
    movementMode: "free_walk",
    spawnPoint: "front_center",
    zones: [
      { id: "zone_entrance", name: "Entrance", description: "Neon-lit entryway into the game lounge." },
      { id: "zone_arcade", name: "Arcade Wall", description: "Retro screens and collectible consoles." },
      { id: "zone_lounge", name: "Lounge", description: "Seating and a merch booth." },
    ],
    objects: [
      { id: "welcome_panel", type: "text_panel", title: "Welcome to the Game Lounge", body: "Kick back, watch the arcade wall, and check out the merch booth.", clickAction: "open_popup" },
      { id: "arcade_screen", type: "video_wall", title: "Retro Arcade Screen", autoplay: false, mute: true, loop: true },
      { id: "console_display", type: "collectible", name: "Limited Edition Console", description: "A rare console on display.", rarity: "rare" },
      { id: "gaming_seat", type: "artifact_display", title: "Gaming Lounge Seat", description: "A comfortable seat for watching the big screen." },
      { id: "merch_booth", type: "product_booth", title: "Merch Booth", brandName: "SCAVerse", productName: "Pro Controller", price: "$59", ctaText: "View" },
      { id: "game_master", type: "npc_guide", name: "Game Master", title: "Game Master", script: "Welcome to the lounge. Check the arcade wall, then grab some merch on your way out.", triggerType: "on_room_start" },
      { id: "exit_door", type: "door", title: "Exit to Lobby", destinationRoomId: "room_main_lobby", locked: false },
      { id: "arena_portal", type: "portal", title: "Enter Tournament Arena", destinationRoomId: "room_tournament_arena", portalEffect: "soft_gold_warp", locked: false, color: "cyan" },
    ],
  },
  {
    id: "modern_living_room",
    label: "Modern Living Room",
    selectedTemplate: "museum_gallery",
    moodPreset: "neutral_clean",
    roomSize: "medium",
    layoutShape: "single_room",
    wallStyle: "wood_panel_wall",
    floorStyle: "wood_floor",
    ceilingStyle: "flat_gallery_ceiling",
    movementMode: "click_to_move",
    spawnPoint: "front_center",
    zones: [
      { id: "zone_entrance", name: "Entrance", description: "Visitors step into a warm, furnished living room." },
      { id: "zone_gallery_wall", name: "Feature Wall", description: "Statement art and framed family photos." },
      { id: "zone_lounge", name: "Lounge", description: "Shelving, an armchair, and a fireplace story." },
    ],
    objects: [
      { id: "welcome_panel", type: "text_panel", title: "Welcome Home", body: "A furnished living room with a feature wall, shelving, and a cozy lounge area.", clickAction: "open_popup" },
      { id: "statement_art", type: "image_frame", title: "Statement Wall Art", caption: "A bold centrepiece for the feature wall.", clickAction: "open_popup" },
      { id: "family_photos", type: "image_frame", title: "Framed Family Photos", caption: "Favourite moments, framed.", clickAction: "open_popup" },
      { id: "shelf_display", type: "artifact_display", title: "Built-in Shelf Display", description: "Books, vases, and curated objects on display." },
      { id: "lounge_armchair", type: "artifact_display", title: "Lounge Armchair", description: "A comfortable reading chair beside the window." },
      { id: "fireplace_story", type: "memory_capsule", title: "Fireplace Story", story: "The story behind this room's centrepiece fireplace.", color: "warm_gold", clickAction: "show_story" },
      { id: "house_host", type: "npc_guide", name: "House Host", title: "House Host", script: "Make yourself at home. Have a look at the shelf, then the armchair by the window.", triggerType: "on_room_start" },
      { id: "exit_door", type: "door", title: "Exit to Hallway", destinationRoomId: "room_main_lobby", locked: false },
      { id: "reading_room_portal", type: "portal", title: "Enter Reading Room", destinationRoomId: "room_reading_room", portalEffect: "soft_gold_warp", locked: false, color: "gold" },
    ],
  },
  {
    id: "futuristic_showcase",
    label: "Futuristic Showcase",
    selectedTemplate: "futuristic_room",
    moodPreset: "futuristic_blue",
    roomSize: "large",
    layoutShape: "multi_zone_hall",
    wallStyle: "futuristic_metal_wall",
    floorStyle: "black_reflective_floor",
    ceilingStyle: "glass_ceiling",
    movementMode: "click_to_move_guided",
    spawnPoint: "entrance_door",
    zones: [
      { id: "zone_entrance", name: "Entrance", description: "A sleek entry hall with a glowing demo screen." },
      { id: "zone_booths", name: "Showcase Booths", description: "Tenant and partner showcase booths." },
      { id: "zone_lab", name: "Innovation Lab", description: "A portal leading to the innovation lab." },
    ],
    objects: [
      { id: "welcome_panel", type: "text_panel", title: "Welcome to the Innovation Showcase", body: "Explore live demos and tenant showcase booths in this premium hall.", clickAction: "open_popup" },
      { id: "demo_screen", type: "video_wall", title: "Product Demo Screen", autoplay: false, mute: true, loop: true },
      { id: "tenant_booth", type: "product_booth", title: "Tenant Showcase Booth", brandName: "SCAVerse Tenant", productName: "Featured Product", price: "$0", ctaText: "Learn More" },
      { id: "partner_booth", type: "product_booth", title: "Partner Spotlight Booth", brandName: "Partner Spotlight", productName: "New Release", price: "$0", ctaText: "Learn More" },
      { id: "innovation_badge", type: "collectible", name: "Innovation Badge", description: "Collect this badge to mark your visit.", rarity: "common" },
      { id: "ai_host", type: "npc_guide", name: "AI Host", title: "AI Host", script: "Welcome. I'll help you find the right booth — start with the demo screen.", triggerType: "on_room_start" },
      { id: "exit_door", type: "door", title: "Exit to Lobby", destinationRoomId: "room_main_lobby", locked: false },
      { id: "lab_portal", type: "portal", title: "Enter Innovation Lab", destinationRoomId: "room_innovation_lab", portalEffect: "soft_gold_warp", locked: false, color: "blue" },
    ],
  },
  {
    id: "marketplace_street",
    label: "Marketplace Street",
    selectedTemplate: "marketplace_street",
    moodPreset: "lively_public",
    roomSize: "large",
    layoutShape: "marketplace_street",
    wallStyle: "stone_archive_wall",
    floorStyle: "street_floor",
    ceilingStyle: "none_open_sky",
    movementMode: "free_walk",
    spawnPoint: "front_center",
    zones: [
      { id: "zone_entrance", name: "Entrance", description: "Visitors arrive on a lively open-air street." },
      { id: "zone_stalls", name: "Stalls", description: "Artisan, tenant, and gift shop stalls." },
      { id: "zone_exhibit_hall", name: "Exhibit Hall Entrance", description: "A path leading to the exhibit hall." },
    ],
    objects: [
      { id: "welcome_panel", type: "text_panel", title: "Welcome to the Marketplace", body: "Browse artisan stalls, tenant showcases, and the gift shop along this open street.", clickAction: "open_popup" },
      { id: "artisan_stall", type: "product_booth", title: "Artisan Stall", brandName: "Local Artisan", productName: "Handmade Goods", price: "$15", ctaText: "Visit Stall" },
      { id: "tenant_stall", type: "product_booth", title: "Tenant Stall", brandName: "SCAVerse Tenant", productName: "Featured Item", price: "$20", ctaText: "Visit Stall" },
      { id: "gift_shop", type: "product_booth", title: "Gift Shop Booth", brandName: "Gift Shop", productName: "Souvenir Set", price: "$12", ctaText: "Visit Stall" },
      { id: "street_mural", type: "image_frame", title: "Street Mural", caption: "A mural welcoming visitors to the street.", clickAction: "open_popup" },
      { id: "direction_sign", type: "direction_sign", label: "Follow the Path to Exhibits", arrowDirection: "forward" },
      { id: "market_host", type: "npc_guide", name: "Market Host", title: "Market Host", script: "Explore the stalls around you. Tap anything that catches your eye.", triggerType: "on_room_start" },
      { id: "exit_door", type: "door", title: "Exit to Lobby", destinationRoomId: "room_main_lobby", locked: false },
      { id: "exhibit_hall_portal", type: "portal", title: "Enter Exhibit Hall", destinationRoomId: "room_exhibit_hall", portalEffect: "soft_gold_warp", locked: false, color: "gold" },
    ],
  },
];

// Builds a complete, publish-ready config for the "Autofill 3D" button.
// Picks a layout different from `previousLayoutId` so repeated clicks cycle
// through distinct, fully-furnished room styles.
export function buildAutofillWorldConfig(previousLayoutId) {
  const pool = AUTOFILL_WORLD_LAYOUTS.filter((layout) => layout.id !== previousLayoutId);
  const candidates = pool.length ? pool : AUTOFILL_WORLD_LAYOUTS;
  const layout = candidates[Math.floor(Math.random() * candidates.length)];
  return createThreeDWorldConfig({
    selectedTemplate: layout.selectedTemplate,
    moodPreset: layout.moodPreset,
    roomSize: layout.roomSize,
    layoutShape: layout.layoutShape,
    wallStyle: layout.wallStyle,
    floorStyle: layout.floorStyle,
    ceilingStyle: layout.ceilingStyle,
    movementMode: layout.movementMode,
    spawnPoint: layout.spawnPoint,
    zones: deepClone(layout.zones),
    objects: deepClone(layout.objects),
    gamification: { ...createThreeDWorldConfig().gamification },
    previewChecked: true,
    recommendedWarningsConfirmed: true,
    publishStatus: "draft",
    autofillLayoutId: layout.id,
  });
}

const NAVIGATION_TYPES = ["door", "portal"];

// Approximate world coordinates for the named spawn point options, used to
// detect objects placed on top of the visitor starting position.
const NAMED_SPAWN_COORDS = {
  front_center: { x: 0, z: 0 },
  entrance_door: { x: 0, z: 2 },
  middle_of_room: { x: 0, z: -3 },
  cinematic_start_marker: { x: 0, z: 0 },
};

export function getNavigationObjects(config = {}) {
  return (config.objects || []).filter((object) => NAVIGATION_TYPES.includes(object.type));
}

function objectLabel(object = {}, index = 0) {
  return object.title || object.name || object.label || `Object ${index + 1}`;
}

function isUnlabelled(object = {}) {
  return !(object.title || object.name || object.label || "").trim();
}

// Mirrors isDefaultPosition in three-d-world-scene.js: true when an object is
// still at the new-object default {x:0, y:0|1, z:-3}, which the scene layout
// auto-relocates rather than rendering in place.
function isUnplacedDefaultPosition(position) {
  if (!position) return true;
  const { x = 0, y = 0, z = 0 } = position;
  return Number(x) === 0 && Number(z) === -3 && (Number(y) === 1 || Number(y) === 0);
}

// Rough mobile weight model: each object class carries a cost; the result is
// a 0-100 "weight" plus a band label the admin can reason about.
const OBJECT_WEIGHTS = { video_wall: 6, artifact_display: 5, npc_guide: 4, portal: 3, light_source: 3, memory_capsule: 2, product_booth: 2, audio_point: 2, quiz_station: 2, image_frame: 1.5, collectible: 1, floating_button: 1, direction_sign: 1, text_panel: 1, door: 1 };

export function estimateMobileWeight(config = {}) {
  const objects = config.objects || [];
  const sizeFactor = { small: 0.85, medium: 1, large: 1.25, massive: 1.6 }[config.roomSize] || 1;
  const raw = objects.reduce((sum, object) => sum + (OBJECT_WEIGHTS[object.type] || 1.5), 0) * sizeFactor;
  const weight = Math.min(100, Math.round(raw));
  const band = weight >= 70 ? "heavy" : weight >= 40 ? "moderate" : "light";
  return { weight, band, objectCount: objects.length };
}

// Computes every active warning for one 3D world config.
// `allRooms` lets door/portal destinations be checked against real rooms.
export function computeThreeDWorldWarnings(config = {}, allRooms = []) {
  const rules = THREE_D_WORLD_EDITOR_SEED.performanceRules;
  const warningById = Object.fromEntries(rules.warnings.map((warning) => [warning.id, warning.message]));
  const warnings = [];
  const objects = config.objects || [];
  const template = getWorldTemplate(config.selectedTemplate);
  const mobileLimit = Math.min(
    Number(config.performanceSettings?.maxObjectsMobile || rules.defaultMaxObjectsMobile),
    template?.recommendedObjectLimit || rules.defaultMaxObjectsDesktop
  );

  if (objects.length > mobileLimit) {
    warnings.push({ id: "too_many_objects", severity: "recommended", message: `${warningById.too_many_objects} (${objects.length} objects, limit ${mobileLimit}.)` });
  }

  objects.forEach((object, index) => {
    if (object.type === "video_wall" && object.videoUrl && !object.thumbnailUrl) {
      warnings.push({ id: "large_video_files", severity: "recommended", message: `${objectLabel(object, index)}: ${warningById.large_video_files}` });
    }
    if (object.type === "artifact_display" && object.modelUrl && !object.imageUrl) {
      warnings.push({ id: "missing_fallback_image", severity: "required", message: `${objectLabel(object, index)}: ${warningById.missing_fallback_image}` });
    }
  });

  if (objects.some(isUnlabelled)) {
    warnings.push({ id: "unlabelled_object", severity: "recommended", message: warningById.unlabelled_object });
  }

  // Accessibility checks — these feed the accessibility publish gate.
  const altTextTypes = new Set(["image_frame", "artifact_display", "memory_capsule", "product_booth"]);
  const missingAlt = objects.filter((object) => altTextTypes.has(object.type) && (object.imageUrl || object.mediaUrl) && !(object.altText || "").trim());
  if (missingAlt.length) {
    warnings.push({ id: "missing_alt_text", severity: "recommended", message: `${missingAlt.length} media object(s): ${warningById.missing_alt_text}` });
  }
  const missingTranscript = objects.filter((object) =>
    ((object.type === "audio_point" && object.audioUrl) || (object.type === "video_wall" && object.videoUrl)) && !(object.transcript || "").trim());
  if (missingTranscript.length) {
    warnings.push({ id: "missing_transcript", severity: "recommended", message: `${missingTranscript.length} audio/video object(s): ${warningById.missing_transcript}` });
  }

  // Curator-grade truth layer + respectful gamification.
  objects.forEach((object, index) => {
    if (object.curatorialStatus === "curator_verified" && !(object.sourceCitation || "").trim()) {
      warnings.push({ id: "uncited_claim", severity: "recommended", message: `${objectLabel(object, index)}: ${warningById.uncited_claim}` });
    }
    const sensitive = object.sensitivity && object.sensitivity !== "none";
    const gamified = object.type === "collectible" || object.type === "quiz_station" || object.clickAction === "collect_item";
    if (config.gamification?.enabled && sensitive && gamified) {
      warnings.push({ id: "sensitive_gamification", severity: "recommended", message: `${objectLabel(object, index)}: ${warningById.sensitive_gamification}` });
    }
  });

  const navObjects = getNavigationObjects(config);
  if (!navObjects.length) {
    warnings.push({ id: "no_exit", severity: "required", message: warningById.no_exit });
  }

  const knownRoomIds = new Set(allRooms.flatMap((room) => [room.id, room.room_key]).filter(Boolean));
  navObjects.forEach((object, index) => {
    if (!object.destinationRoomId) {
      warnings.push({ id: "broken_door_link", severity: "required", message: `${objectLabel(object, index)}: every door must have a destination room.` });
      return;
    }
    // External/sample destinations (room_*) are allowed; only flag when the
    // destination looks like it should be a sibling room and is missing.
    const destination = String(object.destinationRoomId);
    const looksInternal = knownRoomIds.size > 0 && !destination.startsWith("room_");
    if (looksInternal && !knownRoomIds.has(destination)) {
      warnings.push({ id: "broken_door_link", severity: "required", message: `${objectLabel(object, index)}: ${warningById.broken_door_link}` });
    }
    const destinationRoom = allRooms.find((room) => room.id === destination || room.room_key === destination);
    if (destinationRoom && destinationRoom.visibility && destinationRoom.visibility !== "visible") {
      warnings.push({ id: "broken_door_link", severity: "recommended", message: `${objectLabel(object, index)}: destination room is not visible/published yet.` });
    }
    if (object.locked && !object.unlockCondition) {
      warnings.push({ id: "broken_door_link", severity: "required", message: `${objectLabel(object, index)}: locked doors must have an unlock condition.` });
    }
  });

  if (!config.spawnPoint) {
    warnings.push({ id: "spawn_blocked", severity: "required", message: "Visitor starting point is not set." });
  } else {
    // Named spawn points map to approximate world coordinates so the same
    // collision check covers them; those are estimates, so the warning is
    // only "recommended" — custom coordinates are exact and stay blocking.
    const spawn = config.spawnPoint === "custom_xyz"
      ? config.spawnPointCustom || {}
      : NAMED_SPAWN_COORDS[config.spawnPoint];
    if (spawn) {
      const blocked = objects.some((object) => {
        // An object still at the editor's default/unset position {x:0, z:-3}
        // is auto-placed elsewhere by the gallery layout (see
        // isDefaultPosition in three-d-world-scene.js) and never actually
        // renders there, so it can't block the spawn point.
        if (isUnplacedDefaultPosition(object.position)) return false;
        const position = object.position || {};
        return Math.abs(Number(position.x || 0) - Number(spawn.x || 0)) < 0.5
          && Math.abs(Number(position.z || 0) - Number(spawn.z || 0)) < 0.5;
      });
      if (blocked) warnings.push({ id: "spawn_blocked", severity: config.spawnPoint === "custom_xyz" ? "required" : "recommended", message: warningById.spawn_blocked });
    }
  }

  return warnings;
}

export function suggestOptimisations(warnings = []) {
  const actions = new Set();
  warnings.forEach((warning) => {
    if (warning.id === "too_many_objects") { actions.add("reduce_object_count"); actions.add("lazy_load_far_objects"); }
    if (warning.id === "large_video_files") { actions.add("compress_media"); }
    if (warning.id === "missing_fallback_image") { actions.add("replace_heavy_model_with_image"); }
  });
  if (!actions.size) return [];
  return THREE_D_WORLD_EDITOR_SEED.performanceRules.optimisationActions.filter((action) => actions.has(action));
}

// Evaluates the publish checklist for a config. Required failures block
// publish; recommended failures need explicit admin confirmation.
export function evaluatePublishChecklist(config = {}, allRooms = []) {
  const warnings = computeThreeDWorldWarnings(config, allRooms);
  const hasRequiredWarning = (ids) => warnings.some((warning) => ids.includes(warning.id) && warning.severity === "required");
  const hasAnyWarning = (ids) => warnings.some((warning) => ids.includes(warning.id));
  const navObjects = getNavigationObjects(config);
  const { band } = estimateMobileWeight(config);

  const results = THREE_D_WORLD_EDITOR_SEED.publishChecklist.map((item) => {
    let passed = true;
    switch (item.id) {
      case "has_template": passed = !!config.selectedTemplate; break;
      case "has_spawn_point": passed = !!config.spawnPoint && !hasRequiredWarning(["spawn_blocked"]); break;
      case "has_exit": passed = navObjects.length > 0; break;
      case "all_doors_linked": passed = !hasRequiredWarning(["broken_door_link"]); break;
      case "objects_have_titles": passed = !hasAnyWarning(["unlabelled_object"]); break;
      case "media_loaded": passed = !hasRequiredWarning(["missing_fallback_image"]); break;
      case "mobile_safe": passed = band !== "heavy" && !hasAnyWarning(["too_many_objects"]); break;
      case "accessibility_ready": passed = !hasAnyWarning(["missing_alt_text", "missing_transcript"]); break;
      case "sources_cited": passed = !hasAnyWarning(["uncited_claim"]); break;
      case "respectful_gamification": passed = !hasAnyWarning(["sensitive_gamification"]); break;
      case "preview_checked": passed = !!config.previewChecked; break;
      case "performance_checked": passed = !hasAnyWarning(["too_many_objects", "large_video_files"]) || !!config.recommendedWarningsConfirmed; break;
      default: passed = true;
    }
    return { ...item, passed };
  });

  const requiredFailures = results.filter((item) => item.severity === "required" && !item.passed);
  const recommendedFailures = results.filter((item) => item.severity === "recommended" && !item.passed);
  return {
    results,
    warnings,
    requiredFailures,
    recommendedFailures,
    canPublish: requiredFailures.length === 0 && (recommendedFailures.length === 0 || !!config.recommendedWarningsConfirmed),
  };
}

// ---------------------------------------------------------------------------
// Deterministic publish manifest — the same world content always produces the
// same fingerprint, so a published world is verifiably locked to a version.
// ---------------------------------------------------------------------------

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

// Keys that describe editor/publish state rather than world content; they are
// excluded so the hash only changes when the visitor-facing world changes.
const NON_CONTENT_KEYS = new Set(["versionHistory", "publishManifest", "publishStatus", "versionCounter", "previewMode", "previewChecked", "recommendedWarningsConfirmed"]);

export function hashThreeDWorldConfig(config = {}) {
  const content = Object.fromEntries(Object.entries(config).filter(([key]) => !NON_CONTENT_KEYS.has(key)));
  const text = stableStringify(content);
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function buildPublishManifest(config = {}) {
  const objects = config.objects || [];
  return {
    versionId: `v${(Number(config.versionCounter) || 0) + 1}`,
    contentHash: hashThreeDWorldConfig(config),
    template: config.selectedTemplate || "",
    moodPreset: config.moodPreset || "",
    movementMode: config.movementMode || "click_to_move",
    objectIds: objects.map((object) => object.id),
    navigation: getNavigationObjects(config).map((object) => ({ id: object.id, destinationRoomId: object.destinationRoomId || "" })),
    fallbacks: {
      maxObjectsMobile: Number(config.performanceSettings?.maxObjectsMobile) || THREE_D_WORLD_EDITOR_SEED.performanceRules.defaultMaxObjectsMobile,
      twoDViewEnabled: config.accessibility?.twoDFallbackEnabled !== false,
    },
  };
}

// Museum-wide publish gate: returns blocking error strings (in the standard
// "<room label>: <message>" format) for every 3D World room in the journey.
export function getThreeDWorldPublishErrors(rooms = []) {
  const errors = [];
  rooms.forEach((room, index) => {
    if (!isThreeDWorldRoom(room)) return;
    const label = room.room_key || `Room ${index + 1}`;
    const config = getThreeDWorldConfig(room);
    if (!config || !config.enabled) {
      errors.push(`${label}: 3D World room has no world configuration yet. Open the 3D World Builder and pick a template.`);
      return;
    }
    const checklist = evaluatePublishChecklist(config, rooms);
    checklist.requiredFailures.forEach((item) => {
      errors.push(`${label}: 3D World check failed — ${item.label}.`);
    });
    if (checklist.recommendedFailures.length && !config.recommendedWarningsConfirmed) {
      errors.push(`${label}: confirm the recommended 3D World warnings in Preview & Publish Checks before publishing.`);
    }
  });
  return errors;
}
