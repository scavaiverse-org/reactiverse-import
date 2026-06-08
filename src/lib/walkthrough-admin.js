import { ensureTypeConfigs } from "@/lib/walkthrough-room-types";
import { sortRooms } from "@/lib/walkthrough-routing";
import { deepClone, ensureMediaTypes } from "@/lib/walkthrough-media-bindings";
import { SCROLLABLE_IMAGE_DEFAULTS } from "@/lib/scrollable-image";

export const WALKTHROUGHS = ["walkthrough1", "walkthrough2", "walkthrough3", "walkthrough4", "walkthrough5"];
export const WALKTHROUGH_EDITOR_TYPE = "aom_world_class_experience_builder";

export const walkthroughLabel = (key = "walkthrough1") => key.replace("walkthrough", "Walkthrough");

export function roomSuffixFromIndex(index = 0) {
  let n = index + 1;
  let suffix = "";
  while (n > 0) {
    n -= 1;
    suffix = String.fromCharCode(97 + (n % 26)) + suffix;
    n = Math.floor(n / 26);
  }
  return suffix;
}

export function createRoomByType(index = 0, walkthroughKey = "walkthrough1", pageType = "walkthrough_exhibition") {
  const roomKey = `${walkthroughLabel(walkthroughKey)}${roomSuffixFromIndex(index)}`;
  return ensureTypeConfigs({
    id: crypto.randomUUID(),
    room_key: roomKey,
    order: index + 1,
    page_type: pageType,
    title: `Room ${index + 1}`,
    subtitle: "",
    narration: "",
    description: "",
    media_type: "image",
    media_url: "",
    background_media_url: "",
    foreground_media_url: "",
    audio_url: "",
    narrator_audio_url: "",
    ambience: "",
    mood: "",
    lighting: "",
    camera_motion: "none",
    transition_type: "fade",
    emotional_intensity: 40,
    curiosity_level: 55,
    educational_density: 50,
    interaction_density: 45,
    sensory_intensity: 45,
    estimated_duration_seconds: 60,
    visibility: "draft",
    hotspots: [],
    ctas: [],
    ...SCROLLABLE_IMAGE_DEFAULTS,
  });
}

export function createRoom(index = 0, walkthroughKey = "walkthrough1") {
  return createRoomByType(index, walkthroughKey, "walkthrough_exhibition");
}

function mapLegacyScene(scene = {}, index = 0, walkthroughKey = "walkthrough1") {
  return {
    ...scene,
    id: scene.id || crypto.randomUUID(),
    room_key: scene.room_key || `${walkthroughLabel(walkthroughKey)}${roomSuffixFromIndex(index)}`,
    order: index + 1,
    page_type: scene.page_type || "walkthrough_exhibition",
    title: scene.title || `Room ${index + 1}`,
    narration: scene.narration || scene.narrative || scene.description || "",
    description: scene.description || "",
    media_url: scene.media_url || scene.image || scene.image_url || "",
    audio_url: scene.audio_url || scene.audio || scene.ambience_audio_url || "",
    hotspots: scene.hotspots || [],
  };
}

function mapOnboardingSlide(slide = {}, index = 0, walkthroughKey = "walkthrough1") {
  return {
    ...slide,
    id: slide.id || crypto.randomUUID(),
    room_key: slide.room_key || `${walkthroughLabel(walkthroughKey)}${roomSuffixFromIndex(index)}`,
    order: index + 1,
    page_type: "onboarding_guide",
    title: slide.title || `Onboarding ${index + 1}`,
    narration: slide.narration || slide.body || slide.description || "",
    media_url: slide.media_url || slide.image || slide.image_url || "",
    onboarding_config: {
      ...(slide.onboarding_config || {}),
      intro_text: slide.intro_text || slide.body || slide.description || "",
    },
  };
}

export function normalizeRooms(rooms = [], walkthroughKey = "walkthrough1") {
  const list = deepClone(rooms.length ? rooms : [createRoom(0, walkthroughKey)]);
  return sortRooms(list.map((room, index) => {
    const base = createRoomByType(index, walkthroughKey, room.page_type || "walkthrough_exhibition");
    const mapped = mapLegacyScene(room, index, walkthroughKey);
    return ensureMediaTypes(ensureTypeConfigs({
      ...base,
      ...mapped,
      id: mapped.id || base.id,
      room_key: mapped.room_key || base.room_key,
      order: Number(mapped.order || index + 1),
      media_type: mapped.media_type || base.media_type,
      background_media_type: mapped.background_media_type || base.background_media_type,
      foreground_media_type: mapped.foreground_media_type || base.foreground_media_type,
      transition_type: mapped.transition_type || base.transition_type,
      visibility: mapped.visibility || base.visibility,
      accessibility: { ...(base.accessibility || {}), ...(mapped.accessibility || {}) },
      adaptive_modes: { ...(base.adaptive_modes || {}), ...(mapped.adaptive_modes || {}) },
      branching: { ...(base.branching || {}), ...(mapped.branching || {}) },
      hotspots: Array.isArray(mapped.hotspots) ? mapped.hotspots : [],
      ctas: Array.isArray(mapped.ctas) ? mapped.ctas : [],
    }));
  })).map((room, index) => ({ ...room, order: index + 1 }));
}

export function extractRoomsFromConfig(record, walkthroughKey = "walkthrough1") {
  const source = record?.walkthrough_config?.rooms?.length
    ? record.walkthrough_config.rooms
    : record?.rooms?.length
      ? record.rooms
      : record?.walkthrough_config?.scenes?.length
        ? record.walkthrough_config.scenes.map((scene, index) => mapLegacyScene(scene, index, walkthroughKey))
        : record?.onboarding_config?.slides?.length
          ? record.onboarding_config.slides.map((slide, index) => mapOnboardingSlide(slide, index, walkthroughKey))
          : [];
  return normalizeRooms(source, walkthroughKey);
}

export function moveRoom(rooms, index, direction, walkthroughKey) {
  const next = [...rooms];
  const target = index + direction;
  if (target < 0 || target >= next.length) return rooms;
  [next[index], next[target]] = [next[target], next[index]];
  return normalizeRooms(next, walkthroughKey);
}

export function duplicateRoom(rooms, index, walkthroughKey) {
  const original = rooms[index];
  if (!original) return rooms;
  const copy = ensureTypeConfigs({ ...deepClone(original), id: crypto.randomUUID(), title: `${original.title || original.room_key} Copy`, room_key: `${original.room_key || walkthroughLabel(walkthroughKey)}Copy` });
  const next = [...rooms.slice(0, index + 1), copy, ...rooms.slice(index + 1)];
  return normalizeRooms(next, walkthroughKey);
}