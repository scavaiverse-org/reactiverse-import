import { createRoomByType, normalizeRooms } from "@/lib/walkthrough-admin";
import { ensureMediaTypes } from "@/lib/walkthrough-media-bindings";
import { ensureTypeConfigs } from "@/lib/walkthrough-room-types";
import { validateWalkthroughRooms } from "@/lib/walkthrough-validation";
import { getSeedAsset } from "@/lib/cinematic-media-seed-database";

export const CANONICAL_EXPERIENCE_CONFIG_VERSION = 1;

const mediaTypeFromName = (name = "") => {
  const value = String(name).toLowerCase();
  if (/\.(mp4|webm|mov)$/.test(value)) return "video";
  if (/\.(mp3|wav|m4a|ogg)$/.test(value)) return "audio";
  if (/\.(glb|gltf|usdz)$/.test(value)) return "model_3d";
  return "image";
};

const stableHash = (input = "") => String(input).split("").reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 7);
const titleCase = (value = "") => String(value).replace(/[-_]+/g, " ").replace(/\.[^/.]+$/, "").replace(/\b\w/g, (char) => char.toUpperCase()).trim();

export function deterministicAnalyzeMedia({ fileName = "", fileUrl = "", index = 0 }) {
  const seed = stableHash(`${fileName}|${fileUrl}|${index}`);
  const asset = getSeedAsset(seed);
  const mediaType = mediaTypeFromName(fileName || fileUrl);
  const cleanTitle = titleCase(fileName) || asset.title;
  return {
    source: "deterministic-super-easy-analysis",
    seed,
    mediaType,
    category: asset.category,
    emotionalTone: asset.emotionalTone,
    culturalClassification: asset.semanticCategory,
    cinematicStyle: asset.cinematicProfile,
    artifactPositioning: "center-stage with soft depth and clear visual hierarchy",
    roomPacing: asset.pacingProfile,
    title: cleanTitle,
    description: `${cleanTitle} becomes a cinematic museum room with ${asset.emotionalTone}, guided pacing, and a clear visitor path.`,
    soundtrackMood: asset.soundtrackProfile,
    narration: `Welcome to ${cleanTitle}. Look closely at the details, atmosphere, and story. This room has been arranged to guide attention naturally and make the experience feel cinematic without extra setup.`,
    transition: asset.cinematicTransitionStyle,
    displayHierarchy: "hero media first, artifact detail second, visitor action last",
    lighting: asset.lightingMood,
    ambience: asset.roomEnvironment,
    tags: asset.tags,
    recommendedRoomType: asset.recommendedRoomType,
    cameraMotion: asset.autoCameraMovement,
  };
}

export function mediaAnalysisToCanonicalRoom({ analysis, fileUrl, index = 0, walkthroughKey = "walkthrough1", existingRoom }) {
  const pageType = index === 0 ? "onboarding_guide" : analysis.recommendedRoomType || "walkthrough_exhibition";
  const base = existingRoom?.id ? { ...existingRoom } : createRoomByType(index, walkthroughKey, pageType);
  const room = ensureMediaTypes(ensureTypeConfigs({
    ...base,
    page_type: pageType,
    title: analysis.title,
    subtitle: analysis.emotionalTone,
    description: analysis.description,
    narration: analysis.narration,
    media_type: analysis.mediaType,
    media_url: fileUrl,
    background_media_url: fileUrl,
    background_media_type: analysis.mediaType,
    transition_type: analysis.transition,
    mood: analysis.emotionalTone,
    lighting: analysis.lighting,
    ambience: analysis.ambience,
    camera_motion: analysis.cameraMotion,
    emotional_intensity: analysis.roomPacing === "slow" ? 45 : 62,
    curiosity_level: 75,
    educational_density: 65,
    interaction_density: 48,
    sensory_intensity: 58,
    estimated_duration_seconds: analysis.roomPacing === "slow" ? 75 : 60,
    visibility: "draft",
    tags: analysis.tags,
    accessibility: {
      ...(base.accessibility || {}),
      alt_text: `${analysis.title} shown as a cinematic museum room.`,
      transcript: analysis.narration,
      sensory_warning: "Calm mode and reduced motion remain available.",
    },
    hotspots: [{ id: `hotspot-${analysis.seed}`, label: "Look here", title: analysis.category, description: analysis.description, x: 50, y: 50 }],
    exhibition_config: {
      ...(base.exhibition_config || {}),
      scene_title: analysis.title,
      scene_narrative: analysis.narration,
      camera_motion: analysis.cameraMotion,
      mood: analysis.emotionalTone,
      lighting: analysis.lighting,
      hotspots: [{ id: `hotspot-${analysis.seed}`, label: "Look here", title: analysis.category, description: analysis.description, x: 50, y: 50 }],
    },
    artifact_config: {
      ...(base.artifact_config || {}),
      semantic_description: analysis.culturalClassification,
      artifacts: [{ title: analysis.title, description: analysis.description, media_url: fileUrl, thumbnail_url: fileUrl, artifact_type: analysis.mediaType }],
    },
    onboarding_config: {
      ...(base.onboarding_config || {}),
      guide_name: "Museum Guide",
      intro_text: analysis.description,
      step_instruction: "Tap Next when you are ready.",
      choices: [],
    },
    finale_config: {
      ...(base.finale_config || {}),
      completion_message: "Your cinematic museum experience is ready.",
      achievement_title: "Experience Complete",
      media_url: fileUrl,
      media_type: analysis.mediaType,
    },
  }));
  return room;
}

export function easyToCanonical({ rooms = [], walkthroughKey = "walkthrough1" }) {
  return normalizeRooms(rooms.map((room) => ensureMediaTypes(ensureTypeConfigs({ ...room }))), walkthroughKey);
}

export function expertToCanonical({ rooms = [], walkthroughKey = "walkthrough1" }) {
  return normalizeRooms(rooms.map((room) => ensureMediaTypes(ensureTypeConfigs({ ...room }))), walkthroughKey);
}

export function validateExperienceIntegrity(rooms = []) {
  const errors = validateWalkthroughRooms(rooms);
  const duplicateIds = rooms.map((room) => room.id).filter((id, index, ids) => id && ids.indexOf(id) !== index);
  duplicateIds.forEach((id) => errors.push(`${id}: duplicate room id is not allowed.`));
  rooms.forEach((room) => {
    if (room === room.branching || room === room.exhibition_config) errors.push(`${room.room_key || room.id}: recursive room reference blocked.`);
  });
  return { valid: errors.length === 0, errors };
}

export function buildCanonicalExperienceConfig({ mode = "expert", rooms = [], walkthroughKey = "walkthrough1" }) {
  const transformer = mode === "easy" ? easyToCanonical : expertToCanonical;
  const canonicalRooms = transformer({ rooms, walkthroughKey });
  return { version: CANONICAL_EXPERIENCE_CONFIG_VERSION, mode, walkthroughKey, rooms: canonicalRooms, integrity: validateExperienceIntegrity(canonicalRooms) };
}

export function autofillRoom(room, index = 0, walkthroughKey = "walkthrough1") {
  const analysis = deterministicAnalyzeMedia({ fileName: room?.title || room?.room_key || `Room ${index + 1}`, fileUrl: room?.media_url || "", index });
  return mediaAnalysisToCanonicalRoom({ analysis, fileUrl: room?.media_url || room?.background_media_url || getSeedAsset(index).preview, index, walkthroughKey, existingRoom: room });
}

export function autofillEntireExperience(rooms = [], walkthroughKey = "walkthrough1") {
  const source = rooms.length ? rooms : [0, 1, 2].map((index) => createRoomByType(index, walkthroughKey));
  return normalizeRooms(source.map((room, index) => autofillRoom(room, index, walkthroughKey)), walkthroughKey);
}

export function autofillMedia(rooms = [], walkthroughKey = "walkthrough1") {
  const source = rooms.length ? rooms : autofillEntireExperience([], walkthroughKey);
  return normalizeRooms(source.map((room, index) => {
    const asset = getSeedAsset(index) || {};
    const mediaUrl = room.media_url || asset.preview || "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1400&q=80";
    const narration = room.narration || room.description || `This room introduces visitors to ${room.title || `Room ${index + 1}`}.`;
    const next = ensureMediaTypes(ensureTypeConfigs({
      ...room,
      media_url: mediaUrl,
      background_media_url: room.background_media_url || mediaUrl,
      media_type: room.media_type || "image",
      background_media_type: room.background_media_type || room.media_type || "image",
      accessibility: {
        ...(room.accessibility || {}),
        alt_text: room.accessibility?.alt_text || `Museum room image for ${room.title || `Room ${index + 1}`}.`,
        transcript: room.accessibility?.transcript || narration,
      },
    }));
    if (next.page_type === "finale_room") next.finale_config = { ...(next.finale_config || {}), media_url: next.finale_config?.media_url || mediaUrl, media_type: next.finale_config?.media_type || "image" };
    if (next.page_type === "performance_stage") next.performance_config = { ...(next.performance_config || {}), performance_media_url: next.performance_config?.performance_media_url || mediaUrl, performance_media_type: next.performance_config?.performance_media_type || "image" };
    return next;
  }), walkthroughKey);
}

export function generateCinematicLayout(rooms = [], walkthroughKey = "walkthrough1") {
  return normalizeRooms(rooms.map((room, index) => ensureTypeConfigs({ ...room, transition_type: index % 3 === 0 ? "fade" : index % 3 === 1 ? "cinematic_zoom" : "portal", camera_motion: index % 2 === 0 ? "slow reveal, gentle push-in" : "side glide with detail reveal", lighting: room.lighting || getSeedAsset(index).lightingMood, ambience: room.ambience || getSeedAsset(index).roomEnvironment })), walkthroughKey);
}

export function generateMuseumNarrative(rooms = [], walkthroughKey = "walkthrough1") {
  return normalizeRooms(rooms.map((room, index) => ensureTypeConfigs({ ...room, narration: room.narration || `Room ${index + 1} invites visitors to notice the story, texture, and meaning of ${room.title || "this museum moment"}.`, description: room.description || `${room.title || "This room"} is arranged as a clear cinematic museum stop with guided attention and calm pacing.` })), walkthroughKey);
}

// Ordered sequence of room types for a full-length museum walkthrough.
// When filling from index N onward, slot N maps to FILL_TYPE_SEQUENCE[N].
// The last slot is always forced to finale_room regardless of this array.
export const FILL_TYPE_SEQUENCE = [
  "onboarding_guide",
  "walkthrough_exhibition",
  "artifact_room",
  "timeline_room",
  "walkthrough_exhibition",
  "reflection_chamber",
  "gamification_page",
  "finale_room",
];

const FILL_TITLE_BY_TYPE = {
  onboarding_guide: (t) => `Welcome to ${t}`,
  walkthrough_exhibition: (t) => `${t} — Gallery`,
  artifact_room: (t) => `${t} — Artifacts`,
  timeline_room: (t) => `${t} — Through the Ages`,
  performance_stage: (t) => `${t} — Performance`,
  reflection_chamber: (t) => `${t} — Reflect`,
  gamification_page: (t) => `${t} — Discovery Challenge`,
  ai_conversation_room: (t) => `Ask ARIA about ${t}`,
  archive_room: (t) => `${t} — Archive`,
  memory_collection_room: (t) => `Your ${t} Discoveries`,
  branching_choice_room: (t) => `${t} — Choose Your Path`,
  finale_room: (t) => `${t} — Journey Complete`,
  three_d_world: (t) => `${t} — 3D World`,
};

function extractMuseumTheme(rooms = []) {
  const meaningful = rooms.map((r) => r.title || "").filter((t) => t && !/^Room \d+$/i.test(t));
  return meaningful[0] || "Museum";
}

// Appends auto-generated rooms to an existing (partial) walkthrough until it
// reaches targetCount. Existing rooms are never modified. The final slot is
// always a finale_room. Room titles are seeded from the first meaningful
// existing room title so new rooms feel thematically consistent.
export function fillRemainingRooms(existingRooms = [], targetCount = 8, walkthroughKey = "walkthrough1") {
  const current = existingRooms.length;
  if (targetCount <= current) return { rooms: normalizeRooms(existingRooms, walkthroughKey), added: 0 };
  const theme = extractMuseumTheme(existingRooms);
  const newRooms = [];
  for (let i = current; i < targetCount; i++) {
    const isLast = i === targetCount - 1;
    const pageType = isLast ? "finale_room" : (FILL_TYPE_SEQUENCE[i] || "walkthrough_exhibition");
    const titleFn = FILL_TITLE_BY_TYPE[pageType] || ((t) => `${t} — Room ${i + 1}`);
    const skeleton = createRoomByType(i, walkthroughKey, pageType);
    skeleton.title = titleFn(theme);
    newRooms.push(autofillRoom(skeleton, i, walkthroughKey));
  }
  return { rooms: normalizeRooms([...existingRooms, ...newRooms], walkthroughKey), added: newRooms.length };
}

