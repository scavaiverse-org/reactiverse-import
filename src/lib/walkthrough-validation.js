import { PAGE_TYPES } from "@/lib/walkthrough-room-types";
import { getMediaWarnings } from "@/lib/walkthrough-media-bindings";

function hasText(value) { return typeof value === "string" && value.trim().length > 0; }
function roomLabel(room, index) { return room?.room_key || `Room ${index + 1}`; }

// Validation/warning messages are written as "<label>: <message>" where <label> is roomLabel(room, index).
// This maps those messages back to the offending room(s) so the editor can highlight the source of the error.
export function getErrorRoomKeys(messages = [], rooms = []) {
  const labelToKey = new Map(rooms.map((room, index) => [roomLabel(room, index), room.room_key || `Room ${index + 1}`]));
  const keys = new Set();
  messages.forEach((message) => {
    const label = String(message).split(":")[0].trim();
    if (labelToKey.has(label)) keys.add(labelToKey.get(label));
  });
  return keys;
}

export function hasGlobalIssue(messages = [], rooms = []) {
  const labels = new Set(rooms.map((room, index) => roomLabel(room, index)));
  return messages.some((message) => !labels.has(String(message).split(":")[0].trim()));
}
function museumModeActive(room = {}) { return !!(room.museum_mode_enabled || room.artifact_placement_enabled); }
function spriteBottom(sprite = {}) { return Number(sprite.y || 0) + Number(sprite.height || 0); }
function spriteHasMedia(sprite = {}) { return hasText(sprite.media_url) || hasText(sprite.processed_sprite_url) || hasText(sprite.active_museum_media_url) || hasText(sprite.sprite_image_url); }
function getMuseumModeErrors(room = {}, label = "Room") {
  if (!museumModeActive(room)) return [];
  const errors = [];
  const baseline = Number(room.room_semantic_layout?.floor_baseline_y || 86);
  if (!hasText(room.background_media_url) && !hasText(room.media_url)) errors.push(`${label}: room image is required for Museum Mode.`);
  (room.artifact_sprites || []).forEach((sprite, index) => {
    const name = `${label}: artifact sprite ${index + 1}`;
    const bottom = spriteBottom(sprite);
    if (!spriteHasMedia(sprite)) errors.push(`${name} must have valid media or processed sprite URL.`);
    if (sprite.floor_locked !== false && Math.abs(bottom - baseline) > 4) errors.push(`${name} is floating or not aligned to the floor baseline.`);
    if (bottom > baseline + 4) errors.push(`${name} is below the floor baseline.`);
    if (Number(sprite.x || 0) < 0 || Number(sprite.y || 0) < 0 || Number(sprite.x || 0) + Number(sprite.width || 0) > 100 || Number(sprite.y || 0) + Number(sprite.height || 0) > 100) errors.push(`${name} is outside room bounds.`);
  });
  if (room.scrollable_image_enabled && room.scrollable_image_coordinate_space !== "full_image_percent") errors.push(`${label}: scrollable room must use full-image coordinate space.`);
  return errors;
}

function getScrollableImageErrors(room = {}, label = "Room") {
  if (!room.scrollable_image_enabled) return [];
  const errors = [];
  const status = room.scrollable_image_generation_status;
  if (status === "pending") errors.push(`${label}: scrollable room extension is still generating.`);
  if (status === "failed") errors.push(`${label}: scrollable room extension failed. Regenerate or disable scrollable mode.`);
  if (!room.scrollable_image_left_extension_url && !room.scrollable_image_right_extension_url && !room.scrollable_image_extended_url) errors.push(`${label}: scrollable room must have a generated extended panorama before publishing.`);
  if (!room.scrollable_image_approved) errors.push(`${label}: scrollable room extension must be approved before publishing.`);
  if (room.scrollable_image_coordinate_space !== "full_image_percent") errors.push(`${label}: scrollable room must use full_image_percent coordinates for artifacts.`);
  return errors;
}

export function findBrokenRoutes(rooms = []) {
  const ids = new Set(rooms.flatMap((room) => [room.id, room.room_key].filter(Boolean)));
  const broken = [];
  rooms.forEach((room, index) => {
    const label = roomLabel(room, index);
    const targets = [room.branching?.next_room_id, room.branching?.fallback_room_id, room.onboarding_config?.skip_target_room_id, ...(room.ctas || []).map((cta) => cta.route), ...(room.finale_config?.next_ctas || []).map((cta) => cta.route), ...(room.onboarding_config?.choices || []).map((choice) => choice.next_room_id), ...(room.branching_choice_config?.choices || []).map((choice) => choice.next_room_id)].filter(Boolean).filter((target) => !String(target).startsWith("/"));
    targets.forEach((target) => { if (!ids.has(target)) broken.push(`${label}: route target "${target}" does not match any room id or key.`); });
  });
  return broken;
}

export function validateWalkthroughRooms(rooms = []) {
  const errors = [];
  const keys = rooms.map((room) => room.room_key).filter(Boolean);
  const duplicateKeys = keys.filter((key, index) => keys.indexOf(key) !== index);

  if (rooms.length < 3) errors.push("At least 3 rooms are required before publishing.");
  if (!rooms.some((room) => room.page_type === "onboarding_guide")) errors.push("An onboarding room is required before publishing.");
  if (!rooms.some((room) => room.page_type === "finale_room")) errors.push("A finale room is required before publishing.");
  [...new Set(duplicateKeys)].forEach((key) => errors.push(`${key}: duplicate room key is not allowed.`));

  rooms.forEach((room, index) => {
    const label = roomLabel(room, index);
    if (!hasText(room.title)) errors.push(`${label}: title is required.`);
    if (!room.page_type || !PAGE_TYPES[room.page_type]) errors.push(`${label}: page type is required.`);
    if (!Number.isFinite(Number(room.order))) errors.push(`${label}: order is required.`);
    if (!hasText(room.narration) && !hasText(room.description)) errors.push(`${label}: narration or description is required.`);
    if ((room.media_url || room.background_media_url || room.foreground_media_url) && !hasText(room.accessibility?.alt_text)) errors.push(`${label}: media alt text is required.`);
    if ((room.audio_url || room.narrator_audio_url) && !hasText(room.accessibility?.transcript)) errors.push(`${label}: audio transcript is required.`);
    if (room.page_type === "finale_room" && hasText(room.branching?.next_room_id)) errors.push(`${label}: final room must not have an unresolved next room.`);
    errors.push(...getMuseumModeErrors(room, label));
    errors.push(...getScrollableImageErrors(room, label));

    if (room.page_type === "onboarding_guide" && !hasText(room.onboarding_config?.intro_text) && !hasText(room.narration)) errors.push(`${label}: onboarding intro text is required.`);
    if (room.page_type === "artifact_room" && !(room.artifact_config?.artifacts || []).length && !(room.hotspots || []).length) errors.push(`${label}: add at least one artifact or hotspot.`);
    if (room.page_type === "walkthrough_exhibition" && !hasText(room.exhibition_config?.scene_narrative) && !hasText(room.narration)) errors.push(`${label}: scene narrative or narration is required.`);
    if (room.page_type === "gamification_page" && !hasText(room.gamification_config?.objective_text)) errors.push(`${label}: game objective is required.`);
    if (room.page_type === "reflection_chamber" && !hasText(room.reflection_config?.reflection_prompt)) errors.push(`${label}: reflection prompt is required.`);
    if (room.page_type === "ai_conversation_room") {
      if (!hasText(room.ai_conversation_config?.persona_name)) errors.push(`${label}: AI persona name is required.`);
      if (!hasText(room.ai_conversation_config?.system_context)) errors.push(`${label}: AI system context is required.`);
    }
    if (room.page_type === "performance_stage" && !hasText(room.performance_config?.performance_media_url) && !hasText(room.media_url) && !hasText(room.title)) errors.push(`${label}: performance video/audio or title is required.`);
    if (room.page_type === "timeline_room" && !(room.timeline_config?.events || []).length) errors.push(`${label}: add at least one timeline event.`);
    if (room.page_type === "archive_room" && !(room.archive_config?.documents || []).length) errors.push(`${label}: add at least one archive document.`);
    if (room.page_type === "branching_choice_room" && (room.branching_choice_config?.choices || []).length < 2) errors.push(`${label}: add at least two branching choices.`);
    (room.branching_choice_config?.choices || []).forEach((choice) => {
      if (!hasText(choice.next_room_id)) errors.push(`${label}: each branching choice must point to a valid room key.`);
    });
    if (room.page_type === "memory_collection_room" && !hasText(room.memory_collection_config?.collection_title)) errors.push(`${label}: collection title is required.`);
    if (room.page_type === "finale_room" && !hasText(room.finale_config?.completion_message)) errors.push(`${label}: completion message is required.`);
  });
  return [...errors, ...findBrokenRoutes(rooms)];
}

export function getWalkthroughWarnings(rooms = []) {
  const warnings = [];
  if (!rooms.some((room) => room.page_type === "onboarding_guide")) warnings.push("Add an onboarding guide to orient visitors.");
  if (!rooms.some((room) => room.page_type === "finale_room")) warnings.push("Add a finale room to close the journey.");
  rooms.forEach((room, index) => {
    const label = roomLabel(room, index);
    if (!room.accessibility?.alt_text && (room.media_url || room.background_media_url || room.foreground_media_url)) warnings.push(`${label}: add alt text for media.`);
    if (!room.accessibility?.transcript && (room.audio_url || room.narrator_audio_url)) warnings.push(`${label}: add a transcript for audio.`);
    if (Number(room.sensory_intensity || 0) > 85) warnings.push(`${label}: sensory intensity is high; add calm mode or warnings.`);
    if (museumModeActive(room) && Number(room.room_semantic_layout?.floor_confidence || room.room_semantic_layout?.confidence || 0) < 0.58) warnings.push(`${label}: safe estimated floor should be reviewed before publishing.`);
    if (museumModeActive(room) && (room.artifact_sprites || []).some((sprite) => !sprite.caption && !sprite.description)) warnings.push(`${label}: visible artifact sprites should include visitor-facing captions.`);
    if (room.scrollable_image_enabled && !room.scrollable_image_approved) warnings.push(`${label}: scrollable mode is on but no approved extended panorama exists yet — visitors will see the original image only.`);
    warnings.push(...getMediaWarnings(room, label));
  });
  return warnings;
}