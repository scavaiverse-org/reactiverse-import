// Append-only Very Easy publish layer. Do not replace Expert/Easy builders. This layer guarantees publishable defaults for non-technical users.

import { normalizeRooms } from "@/lib/walkthrough-admin";
import { ensureTypeConfigs } from "@/lib/walkthrough-room-types";
import { ensureMediaTypes, detectMediaTypeFromUrl, normalizeMediaUrlValue } from "@/lib/walkthrough-media-bindings";
import { getSeedAsset } from "@/lib/cinematic-media-seed-database";

const SAFE_FALLBACK_MEDIA = "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1400&q=80";
const ROOM_KEYS = ["start", "main_gallery", "finale"];

function text(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function getSafeSeedMedia(index = 0) {
  const asset = getSeedAsset(index) || {};
  return {
    preview: normalizeMediaUrlValue(asset.preview) || SAFE_FALLBACK_MEDIA,
    media_type: "image",
    title: asset.title || `Museum Room ${index + 1}`,
    alt_text: asset.title ? `Museum image showing ${asset.title}.` : "Museum room image.",
  };
}

function mediaTypeFor(url = "", current = "") {
  const type = detectMediaTypeFromUrl(url, current || "image");
  return type === "link" ? "image" : type;
}

function acceptedUploadedMedia(uploadedMedia = []) {
  return uploadedMedia
    .map((item) => normalizeMediaUrlValue(item?.fileUrl || item?.file_url || item?.media_url || item?.url || item))
    .filter(Boolean);
}

function choosePrimaryMedia({ room = {}, uploadedMedia = [], index = 0 }) {
  const uploaded = acceptedUploadedMedia(uploadedMedia)[index] || acceptedUploadedMedia(uploadedMedia)[0];
  const existing = normalizeMediaUrlValue(room.media_url || room.background_media_url || room.foreground_media_url || room.finale_config?.media_url);
  const seed = getSafeSeedMedia(index).preview;
  return uploaded || existing || seed;
}

function ensureAccessibility(room, tenant = {}, index = 0) {
  const museumName = text(tenant.name, "the museum");
  const title = text(room.title, `Room ${index + 1}`);
  const narration = text(room.narration, text(room.description, `This room introduces visitors to ${title}.`));
  return {
    ...(room.accessibility || {}),
    alt_text: text(room.accessibility?.alt_text, `Museum room image for ${title} at ${museumName}.`),
    transcript: text(room.accessibility?.transcript, narration),
    calm_mode_available: room.accessibility?.calm_mode_available !== false,
    sensory_warning: text(room.accessibility?.sensory_warning, "Calm mode and reduced motion are available."),
  };
}

function neutralizeIncompleteScrollable(room, fixesApplied, label) {
  if (room.scrollable_image_enabled && !room.scrollable_image_approved) {
    fixesApplied.push(`Disabled unfinished scrollable image on ${label} so the museum can publish.`);
    return {
      ...room,
      scrollable_image_enabled: false,
      scrollable_image_generation_status: "",
      scrollable_image_generation_error: null,
    };
  }
  return room;
}

function baseRoom({ existing = {}, tenant = {}, walkthroughKey = "walkthrough1", index = 0, pageType, uploadedMedia = [], fixesApplied }) {
  const museumName = text(tenant.name, "the Museum");
  const key = ROOM_KEYS[index] || `room_${index + 1}`;
  const mediaUrl = choosePrimaryMedia({ room: existing, uploadedMedia, index });
  const mediaType = mediaTypeFor(mediaUrl, existing.media_type || existing.background_media_type);
  const isVisual = ["image", "video", "panorama", "external_video", "embed_video"].includes(mediaType);
  const seed = getSafeSeedMedia(index);
  const titles = [
    `Welcome to ${museumName}`,
    `${museumName} Main Gallery`,
    "Journey Complete",
  ];
  const descriptions = [
    `Begin a guided museum journey through ${museumName}.`,
    `Explore a cinematic gallery room with story, atmosphere, and a clear visitor path.`,
    `Your museum journey concludes here. Pause, reflect, and choose what to explore next.`,
  ];
  const nextKey = index === 0 ? ROOM_KEYS[1] : index === 1 ? ROOM_KEYS[2] : "";

  fixesApplied.push(`${key}: publish-ready room prepared.`);

  const room = {
    ...existing,
    id: `${walkthroughKey}_very_easy_room_${index + 1}`,
    room_key: key,
    order: index + 1,
    page_type: pageType,
    title: text(existing.title, titles[index] || seed.title),
    subtitle: text(existing.subtitle, index === 1 ? "Cinematic museum gallery" : ""),
    description: text(existing.description, descriptions[index] || `A guided room for ${museumName}.`),
    narration: text(existing.narration, descriptions[index] || `This room introduces visitors to ${museumName}.`),
    media_url: mediaUrl,
    media_type: mediaType,
    background_media_url: isVisual ? normalizeMediaUrlValue(existing.background_media_url) || mediaUrl : seed.preview,
    background_media_type: isVisual ? mediaType : "image",
    foreground_media_url: normalizeMediaUrlValue(existing.foreground_media_url),
    foreground_media_type: existing.foreground_media_type || "",
    audio_url: normalizeMediaUrlValue(existing.audio_url),
    narrator_audio_url: normalizeMediaUrlValue(existing.narrator_audio_url),
    museum_mode_enabled: false,
    artifact_placement_enabled: false,
    artifact_sprites: [],
    scrollable_image_enabled: false,
    scrollable_image_approved: false,
    scrollable_image_generation_status: "",
    branching: {
      ...(existing.branching || {}),
      required: false,
      optional: true,
      next_room_id: nextKey,
      fallback_room_id: "",
      conditions: [],
    },
    ctas: Array.isArray(existing.ctas) ? existing.ctas.filter((cta) => cta?.route) : [],
  };

  room.accessibility = ensureAccessibility(room, tenant, index);

  if (pageType === "onboarding_guide") {
    room.onboarding_config = {
      ...(room.onboarding_config || {}),
      guide_mode: "welcome",
      guide_name: "Museum Guide",
      intro_text: text(room.onboarding_config?.intro_text, room.description),
      step_instruction: text(room.onboarding_config?.step_instruction, "Tap Next when you are ready."),
      start_button_label: "Start Museum",
      choices: [],
      allow_skip: false,
      skip_target_room_id: ROOM_KEYS[1],
      show_progress: true,
    };
  }

  if (pageType === "walkthrough_exhibition") {
    room.exhibition_config = {
      ...(room.exhibition_config || {}),
      exhibition_mode: "cinematic_scene",
      scene_title: text(room.exhibition_config?.scene_title, room.title),
      scene_narrative: text(room.exhibition_config?.scene_narrative, room.narration),
      visitor_instruction: "Look around and follow the story.",
      camera_motion: text(room.exhibition_config?.camera_motion, "slow reveal"),
      mood: text(room.exhibition_config?.mood, "reverence and curiosity"),
      lighting: text(room.exhibition_config?.lighting, "soft museum light"),
      hotspots: Array.isArray(room.hotspots) ? room.hotspots : [],
    };
  }

  if (pageType === "finale_room") {
    room.branching = { required: false, optional: true, next_room_id: "", fallback_room_id: "", conditions: [] };
    room.finale_config = {
      ...(room.finale_config || {}),
      achievement_title: text(room.finale_config?.achievement_title, "Journey Complete"),
      completion_message: text(room.finale_config?.completion_message, room.description),
      media_url: normalizeMediaUrlValue(room.finale_config?.media_url) || room.media_url,
      media_type: mediaTypeFor(room.finale_config?.media_url || room.media_url, room.finale_config?.media_type || room.media_type),
      next_ctas: Array.isArray(room.finale_config?.next_ctas) ? room.finale_config.next_ctas.filter((cta) => cta?.route) : [],
    };
  }

  return ensureMediaTypes(ensureTypeConfigs(neutralizeIncompleteScrollable(room, fixesApplied, key)));
}

function repairLinearRoutes(rooms = []) {
  return rooms.map((room, index) => ({
    ...room,
    branching: {
      ...(room.branching || {}),
      next_room_id: index === rooms.length - 1 ? "" : rooms[index + 1]?.room_key || "",
      fallback_room_id: "",
      conditions: [],
    },
  }));
}

function createMinimumMuseumRooms({ rooms = [], walkthroughKey = "walkthrough1", tenant = {}, uploadedMedia = [], fixesApplied = [] }) {
  const source = rooms.length ? rooms : [];
  const specs = [
    { pageType: "onboarding_guide" },
    { pageType: "walkthrough_exhibition" },
    { pageType: "finale_room" },
  ];
  return specs.map((spec, index) => baseRoom({
    existing: source[index] || {},
    tenant,
    walkthroughKey,
    index,
    pageType: spec.pageType,
    uploadedMedia,
    fixesApplied,
  }));
}

export function buildVeryEasyPublishPlan({ rooms = [], walkthroughKey = "walkthrough1", tenant = {}, uploadedMedia = [] } = {}) {
  const fixesApplied = [];
  const minimum = createMinimumMuseumRooms({ rooms, walkthroughKey, tenant, uploadedMedia, fixesApplied });
  const routed = repairLinearRoutes(minimum);
  const normalized = normalizeRooms(routed, walkthroughKey).map((room, index) => ensureMediaTypes(ensureTypeConfigs({
    ...room,
    visibility: "published",
    order: index + 1,
    accessibility: ensureAccessibility(room, tenant, index),
  })));
  return { rooms: normalized, fixesApplied };
}

export function autofillWholeMuseumForPublish(args = {}) {
  return buildVeryEasyPublishPlan(args).rooms;
}