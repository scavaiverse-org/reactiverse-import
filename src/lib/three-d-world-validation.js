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
    performanceSettings: { maxObjectsMobile: THREE_D_WORLD_EDITOR_SEED.performanceRules.defaultMaxObjectsMobile, maxObjectsDesktop: THREE_D_WORLD_EDITOR_SEED.performanceRules.defaultMaxObjectsDesktop, optimisationsApplied: [] },
    previewMode: "admin_preview",
    previewChecked: false,
    recommendedWarningsConfirmed: false,
    publishStatus: "draft",
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

const NAVIGATION_TYPES = ["door", "portal"];

export function getNavigationObjects(config = {}) {
  return (config.objects || []).filter((object) => NAVIGATION_TYPES.includes(object.type));
}

function objectLabel(object = {}, index = 0) {
  return object.title || object.name || object.label || `Object ${index + 1}`;
}

function isUnlabelled(object = {}) {
  return !(object.title || object.name || object.label || "").trim();
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
  } else if (config.spawnPoint === "custom_xyz") {
    const spawn = config.spawnPointCustom || {};
    const blocked = objects.some((object) => {
      const position = object.position || {};
      return Math.abs(Number(position.x || 0) - Number(spawn.x || 0)) < 0.5
        && Math.abs(Number(position.z || 0) - Number(spawn.z || 0)) < 0.5;
    });
    if (blocked) warnings.push({ id: "spawn_blocked", severity: "required", message: warningById.spawn_blocked });
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
      case "has_spawn_point": passed = !!config.spawnPoint; break;
      case "has_exit": passed = navObjects.length > 0; break;
      case "all_doors_linked": passed = !hasRequiredWarning(["broken_door_link"]); break;
      case "objects_have_titles": passed = !hasAnyWarning(["unlabelled_object"]); break;
      case "media_loaded": passed = !hasRequiredWarning(["missing_fallback_image"]); break;
      case "mobile_safe": passed = band !== "heavy" && !hasAnyWarning(["too_many_objects"]); break;
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
