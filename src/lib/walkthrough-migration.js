import { ensureTypeConfigs } from "@/lib/walkthrough-room-types";

function walkthroughLabel(key = "walkthrough1") {
  return key.replace("walkthrough", "Walkthrough");
}

function roomSuffixFromIndex(index = 0) {
  let n = index + 1;
  let suffix = "";
  while (n > 0) {
    n -= 1;
    suffix = String.fromCharCode(97 + (n % 26)) + suffix;
    n = Math.floor(n / 26);
  }
  return suffix;
}

function keyFor(index, walkthroughKey) {
  return `${walkthroughLabel(walkthroughKey)}${roomSuffixFromIndex(index)}`;
}

export function migrateSceneToRoom(scene = {}, index = 0, walkthroughKey = "walkthrough1") {
  return ensureTypeConfigs({
    ...scene,
    id: scene.id || crypto.randomUUID(),
    room_key: scene.room_key || keyFor(index, walkthroughKey),
    order: index + 1,
    page_type: scene.page_type || "walkthrough_exhibition",
    title: scene.title || `Room ${index + 1}`,
    description: scene.description || "",
    narration: scene.narration || scene.narrative || "",
    media_url: scene.media_url || scene.image || scene.image_url || "",
    audio_url: scene.audio_url || scene.audio || "",
    hotspots: scene.hotspots || [],
    exhibition_config: {
      ...(scene.exhibition_config || {}),
      scene_title: scene.title || scene.exhibition_config?.scene_title || "",
      scene_narrative: scene.narration || scene.narrative || scene.exhibition_config?.scene_narrative || "",
    },
  });
}

export function migrateSlideToRoom(slide = {}, index = 0, walkthroughKey = "walkthrough1") {
  return ensureTypeConfigs({
    ...slide,
    id: slide.id || crypto.randomUUID(),
    room_key: slide.room_key || keyFor(index, walkthroughKey),
    order: index + 1,
    page_type: "onboarding_guide",
    title: slide.title || `Onboarding ${index + 1}`,
    description: slide.description || slide.body || "",
    narration: slide.narration || slide.body || "",
    media_url: slide.media_url || slide.image || slide.image_url || "",
    onboarding_config: {
      ...(slide.onboarding_config || {}),
      intro_text: slide.intro_text || slide.body || slide.description || "",
      step_instruction: slide.step_instruction || "",
    },
  });
}

export function migrateExperienceRecord(record, walkthroughKey = "walkthrough1") {
  const sourceRooms = record?.walkthrough_config?.rooms?.length ? record.walkthrough_config.rooms : record?.rooms?.length ? record.rooms : [];
  if (sourceRooms.length) return sourceRooms.map((room, index) => ensureTypeConfigs({ ...room, order: index + 1 }));
  if (record?.walkthrough_config?.scenes?.length) return record.walkthrough_config.scenes.map((scene, index) => migrateSceneToRoom(scene, index, walkthroughKey));
  if (record?.onboarding_config?.slides?.length) return record.onboarding_config.slides.map((slide, index) => migrateSlideToRoom(slide, index, walkthroughKey));
  return [];
}

export function createLegacyBackup(record = {}) {
  return {
    walkthrough_config: record.walkthrough_config,
    onboarding_config: record.onboarding_config,
    rooms: record.rooms,
    backed_up_at: new Date().toISOString(),
  };
}