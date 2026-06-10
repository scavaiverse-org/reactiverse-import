import { getScrollableImageSettings, isImageMediaType, normalizeScrollableImageFields } from "@/lib/scrollable-image";
import { clampArtifactToSafeZone, isImageUrl, normalizeMuseumModeRoom } from "@/lib/room-semantic-layout";

export const WALKTHROUGH_MEDIA_BINDINGS = [
  { label: "Main", adminPath: "room.media_url", savedPath: "walkthrough_config.rooms[].media_url", publicSlot: "main + background fallback", typePath: "room.media_type", supported: ["image", "video", "audio", "document", "link"], fallback: "Background, type room, or no media" },
  { label: "Background", adminPath: "room.background_media_url", savedPath: "walkthrough_config.rooms[].background_media_url", publicSlot: "background", typePath: "room.background_media_type", supported: ["image", "video"], fallback: "Main media" },
  { label: "Foreground", adminPath: "room.foreground_media_url", savedPath: "walkthrough_config.rooms[].foreground_media_url", publicSlot: "foreground", typePath: "room.foreground_media_type", supported: ["image", "video"], fallback: "Guide avatar" },
  { label: "Audio", adminPath: "room.audio_url", savedPath: "walkthrough_config.rooms[].audio_url", publicSlot: "scene audio", typePath: "room.audio_type", supported: ["audio"], fallback: "Exhibition ambience" },
  { label: "Narrator audio", adminPath: "room.narrator_audio_url", savedPath: "walkthrough_config.rooms[].narrator_audio_url", publicSlot: "narrator audio fallback", typePath: "room.narrator_audio_type", supported: ["audio"], fallback: "Only used when no ambience audio is present" },
  { label: "Performance", adminPath: "room.performance_config.performance_media_url", savedPath: "walkthrough_config.rooms[].performance_config.performance_media_url", publicSlot: "performance room media", typePath: "room.performance_config.performance_media_type", supported: ["image", "video", "audio"], fallback: "Main media" },
  { label: "Artifacts", adminPath: "room.artifact_config.artifacts[].media_url", savedPath: "walkthrough_config.rooms[].artifact_config.artifacts[].media_url", publicSlot: "artifact cards + background fallback", typePath: "artifact_type", supported: ["image", "video", "audio", "document", "link"], fallback: "No artifact media" },
  { label: "Timeline", adminPath: "room.timeline_config.events[].media_url", savedPath: "walkthrough_config.rooms[].timeline_config.events[].media_url", publicSlot: "timeline event cards + background fallback", typePath: "media_type", supported: ["image", "video", "audio"], fallback: "No event media" },
  { label: "Archive", adminPath: "room.archive_config.documents[].file_url/media_url", savedPath: "walkthrough_config.rooms[].archive_config.documents[].file_url", publicSlot: "archive cards + background fallback", typePath: "media_type", supported: ["image", "video", "audio", "document", "link"], fallback: "Open file link" },
  { label: "Guide avatar", adminPath: "room.onboarding_config.guide_avatar_url", savedPath: "walkthrough_config.rooms[].onboarding_config.guide_avatar_url", publicSlot: "foreground fallback + guide card", typePath: "image", supported: ["image"], fallback: "No avatar" },
  { label: "Badge/finale", adminPath: "room.gamification_config.badge_icon_url / room.finale_config.media_url", savedPath: "walkthrough_config.rooms[].gamification_config.badge_icon_url", publicSlot: "type renderer", typePath: "image", supported: ["image"], fallback: "No badge/finale media" },
];

export function deepClone(value) {
  if (value == null) return value;
  return typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

export function detectMediaTypeFromFile(file) {
  const mime = String(file?.type || "").toLowerCase();
  const name = String(file?.name || "").toLowerCase();
  if (mime.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif|svg)$/.test(name)) return "image";
  if (mime.startsWith("video/") || /\.(mp4|webm|mov|m4v)$/.test(name)) return "video";
  if (mime.startsWith("audio/") || /\.(mp3|wav|ogg|m4a)$/.test(name)) return "audio";
  if (mime.includes("pdf") || mime.includes("document") || mime.includes("presentation") || mime.includes("spreadsheet") || /\.(pdf|doc|docx|ppt|pptx|xls|xlsx|txt|rtf)$/.test(name)) return "document";
  return "link";
}

function unwrapMediaValue(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    return value.file_url || value.fileUrl || value.storageUrl || value.sourceUrl || value.publicUrl || value.url || value.media_url || value.mediaUrl || value.downloadUrl || "";
  }
  return String(value || "");
}

export function isPlaceholderMediaUrl(url = "") {
  const value = String(url || "").trim().toLowerCase();
  return !value || value.includes("yourcdn.com") || value.includes("example.com/") || value.includes("placeholder.");
}

export function normalizeMediaUrlValue(value) {
  const raw = unwrapMediaValue(value).trim();
  if (!raw || isPlaceholderMediaUrl(raw)) return "";
  if (/^(https?:|data:|blob:)/i.test(raw)) return raw;
  if (raw.startsWith("//")) return `https:${raw}`;
  if (raw.startsWith("/")) return typeof window !== "undefined" ? `${window.location.origin}${raw}` : raw;
  if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(raw)) return `https://${raw}`;
  return raw;
}

export function detectMediaTypeFromUrl(url = "", currentType = "") {
  const normalizedUrl = normalizeMediaUrlValue(url);
  const normalizedCurrent = String(currentType || "").toLowerCase();
  const rawValue = String(normalizedUrl || "").trim().toLowerCase();
  const value = rawValue.split("?")[0].split("#")[0];
  if (!value) return normalizedCurrent || "";
  if (/images\.unsplash\.com|images\.pexels\.com|images\.pixabay\.com|media\.base44\.com\/images/.test(rawValue)) return "image";
  if (/\.(jpg|jpeg|png|webp|gif|svg)$/.test(value)) return "image";
  if (/\.(mp4|webm|mov|m4v)$/.test(value)) return "video";
  if (/\.(mp3|wav|ogg|m4a)$/.test(value)) return "audio";
  if (/\.(pdf|doc|docx|ppt|pptx|xls|xlsx|txt|rtf)$/.test(value)) return "document";
  if (/youtube\.com|youtu\.be|vimeo\.com/.test(value)) return "external_video";
  return normalizedCurrent || "link";
}

function withType(url, type, source = {}) {
  const normalizedUrl = normalizeMediaUrlValue(url);
  const detectedType = type || detectMediaTypeFromUrl(normalizedUrl);
  if (!normalizedUrl) return null;
  const scrollable = getScrollableImageSettings(source, detectedType);
  return {
    url: normalizedUrl,
    type: detectedType,
    label: "",
    scrollable: scrollable
      ? {
          ...scrollable,
          // original upload is always the canonical center anchor
          scrollable_image_original_url: scrollable.scrollable_image_original_url || normalizedUrl,
        }
      : null,
  };
}

function firstSource(...items) {
  return items.find((item) => item?.url) || null;
}

function firstUrl(...values) {
  return values.map(normalizeMediaUrlValue).find(Boolean) || "";
}

function isVisualType(type = "") {
  return ["image", "video", "embed_video", "external_video", "panorama", "model_3d"].includes(String(type || "").toLowerCase());
}

function mirrorPublicUploadContract(next) {
  const primaryUrl = firstUrl(next.media_url, next.background_media_url, next.background_image_url, next.hero_image_url, next.image_url, next.primary_image_url);
  if (!next.media_url && primaryUrl) next.media_url = primaryUrl;
  if (next.media_url && !next.media_type) next.media_type = detectMediaTypeFromUrl(next.media_url, next.media_type);

  if (!next.background_media_url && next.media_url && isVisualType(next.media_type)) {
    next.background_media_url = next.media_url;
    next.background_media_type = next.media_type;
  }
  if (next.background_media_url && !next.background_media_type) next.background_media_type = detectMediaTypeFromUrl(next.background_media_url, next.media_type || next.background_media_type);
  if (next.foreground_media_url && !next.foreground_media_type) next.foreground_media_type = detectMediaTypeFromUrl(next.foreground_media_url, next.foreground_media_type);

  const visualUrl = firstUrl(next.background_media_url, isVisualType(next.media_type) ? next.media_url : "", next.foreground_media_url);
  const visualType = detectMediaTypeFromUrl(visualUrl, next.background_media_type || next.media_type || next.foreground_media_type);

  next.performance_config = next.performance_config || {};
  if (next.page_type === "performance_stage" && !next.performance_config.performance_media_url && visualUrl) {
    next.performance_config.performance_media_url = visualUrl;
    next.performance_config.performance_media_type = visualType;
  }

  next.finale_config = next.finale_config || {};
  if (next.page_type === "finale_room" && !next.finale_config.media_url && visualUrl) {
    next.finale_config.media_url = visualUrl;
    next.finale_config.media_type = visualType;
  }

  if (Array.isArray(next.artifact_sprites)) {
    next.artifact_sprites = next.artifact_sprites.map((sprite) => ({
      ...sprite,
      id: sprite.id || sprite.seed_key || crypto.randomUUID(),
      title: sprite.title || sprite.artifact_title || "Artifact",
      header: sprite.header || sprite.artifact_header || sprite.title || sprite.artifact_title || "Artifact",
      description: sprite.description || sprite.artifact_description || "",
      body: sprite.body || sprite.artifact_body || "",
      media_url: firstUrl(sprite.active_museum_media_url, sprite.processed_sprite_url, sprite.media_url, sprite.sprite_image_url, sprite.image_url, sprite.original_media_url),
      original_media_url: normalizeMediaUrlValue(sprite.original_media_url),
      processed_sprite_url: normalizeMediaUrlValue(sprite.processed_sprite_url),
      active_museum_media_url: firstUrl(sprite.active_museum_media_url, sprite.processed_sprite_url, sprite.media_url, sprite.original_media_url),
      artifact_type: detectMediaTypeFromUrl(firstUrl(sprite.active_museum_media_url, sprite.processed_sprite_url, sprite.media_url, sprite.sprite_image_url, sprite.image_url, sprite.original_media_url), sprite.artifact_type || sprite.media_type),
      media_type: detectMediaTypeFromUrl(firstUrl(sprite.active_museum_media_url, sprite.processed_sprite_url, sprite.media_url, sprite.sprite_image_url, sprite.image_url, sprite.original_media_url), sprite.media_type || sprite.artifact_type),
      video_url: normalizeMediaUrlValue(sprite.video_url),
      audio_url: normalizeMediaUrlValue(sprite.audio_url),
      x: Number(sprite.x ?? sprite.x_position_percent ?? 50),
      y: Number(sprite.y ?? sprite.y_position_percent ?? 70),
      width: Number(sprite.width ?? sprite.width_percent ?? 18),
      height: Number(sprite.height ?? sprite.height_percent ?? 24),
      rotation: Number(sprite.rotation ?? sprite.rotation_degrees ?? 0),
      depth: Number(sprite.depth ?? sprite.z_index ?? 0),
      display_mode: sprite.display_mode || sprite.interaction_mode || "click",
    })).filter((sprite) => sprite.media_url);
  }

  next.public_media_contract = {
    main: !!next.media_url,
    background: !!next.background_media_url,
    foreground: !!next.foreground_media_url,
    audio: !!next.audio_url,
    narratorAudio: !!next.narrator_audio_url,
    museumArtifacts: Array.isArray(next.artifact_sprites) ? next.artifact_sprites.length : 0,
  };
  return next;
}

export function getPublicMediaSlots(room = {}) {
  const timelineMedia = (room.timeline_config?.events || []).find((event) => event?.media_url);
  const artifactMedia = (room.artifact_config?.artifacts || []).find((artifact) => artifact?.media_url);
  const archiveMedia = (room.archive_config?.documents || []).find((doc) => doc?.file_url || doc?.media_url);
  const background = firstSource(
    withType(room.background_media_url, room.background_media_type, room),
    withType(room.media_url, room.media_type, room),
    withType(room.performance_config?.performance_media_url, room.performance_config?.performance_media_type, room.performance_config),
    withType(timelineMedia?.media_url, timelineMedia?.media_type, timelineMedia),
    withType(artifactMedia?.media_url, artifactMedia?.artifact_type, artifactMedia),
    withType(archiveMedia?.file_url || archiveMedia?.media_url, archiveMedia?.media_type || archiveMedia?.category, archiveMedia)
  );
  const foreground = firstSource(
    withType(room.foreground_media_url, room.foreground_media_type, room),
    withType(room.onboarding_config?.guide_avatar_url, "image", room.onboarding_config)
  );
  const audio = firstSource(
    withType(room.audio_url, "audio"),
    withType(room.exhibition_config?.ambience_audio_url, "audio")
  );
  const narration = firstSource(
    withType(room.narrator_audio_url, "audio"),
    withType(room.exhibition_config?.narrator_audio_url, "audio"),
    withType(room.onboarding_config?.guide_voice_url, "audio")
  );
  const main = withType(room.media_url, room.media_type, room);
  const typeSpecific = firstSource(
    withType(room.performance_config?.performance_media_url, room.performance_config?.performance_media_type, room.performance_config),
    withType(artifactMedia?.media_url, artifactMedia?.artifact_type, artifactMedia),
    withType(timelineMedia?.media_url, timelineMedia?.media_type, timelineMedia),
    withType(archiveMedia?.file_url || archiveMedia?.media_url, archiveMedia?.media_type || archiveMedia?.category, archiveMedia),
    withType(room.gamification_config?.badge_icon_url, "image", room.gamification_config),
    withType(room.finale_config?.media_url, room.finale_config?.media_type, room.finale_config)
  );
  return { background, main, foreground, audio, narration, typeSpecific };
}

export function ensureMediaTypes(room = {}) {
  const next = mirrorPublicUploadContract(normalizeMuseumModeRoom(normalizeScrollableImageFields(deepClone(room) || {})));
  next.media_url = normalizeMediaUrlValue(next.media_url);
  next.background_media_url = normalizeMediaUrlValue(next.background_media_url);
  next.foreground_media_url = normalizeMediaUrlValue(next.foreground_media_url);
  next.audio_url = normalizeMediaUrlValue(next.audio_url);
  next.narrator_audio_url = normalizeMediaUrlValue(next.narrator_audio_url);
  if (next.media_url) next.media_type = detectMediaTypeFromUrl(next.media_url, next.media_type);
  if (next.background_media_url) {
    const backgroundTypeHint = next.background_media_url === next.media_url ? next.media_type : next.background_media_type;
    next.background_media_type = detectMediaTypeFromUrl(next.background_media_url, backgroundTypeHint);
  }
  if (next.foreground_media_url) {
    const foregroundTypeHint = next.foreground_media_url === next.media_url ? next.media_type : next.foreground_media_type;
    next.foreground_media_type = detectMediaTypeFromUrl(next.foreground_media_url, foregroundTypeHint);
  }
  if (next.audio_url) next.audio_type = "audio";
  if (next.narrator_audio_url) next.narrator_audio_type = "audio";
  if (next.performance_config?.performance_media_url) {
    next.performance_config.performance_media_url = normalizeMediaUrlValue(next.performance_config.performance_media_url);
    next.performance_config = normalizeScrollableImageFields(next.performance_config);
    if (next.performance_config.performance_media_url) next.performance_config.performance_media_type = detectMediaTypeFromUrl(next.performance_config.performance_media_url, next.performance_config.performance_media_type);
  }
  if (Array.isArray(next.artifact_config?.artifacts)) next.artifact_config.artifacts = next.artifact_config.artifacts.map((artifact) => {
    const media_url = firstUrl(artifact.active_museum_media_url, artifact.processed_sprite_url, artifact.media_url, artifact.original_media_url);
    const thumbnail_url = normalizeMediaUrlValue(artifact.thumbnail_url);
    return normalizeScrollableImageFields({
      ...artifact,
      media_url,
      original_media_url: normalizeMediaUrlValue(artifact.original_media_url),
      processed_sprite_url: normalizeMediaUrlValue(artifact.processed_sprite_url),
      active_museum_media_url: media_url,
      thumbnail_url,
      artifact_type: media_url ? detectMediaTypeFromUrl(media_url, artifact.artifact_type) : artifact.artifact_type,
    });
  });
  if (Array.isArray(next.timeline_config?.events)) next.timeline_config.events = next.timeline_config.events.map((event) => {
    const media_url = normalizeMediaUrlValue(event.media_url);
    return normalizeScrollableImageFields({ ...event, media_url, media_type: media_url ? detectMediaTypeFromUrl(media_url, event.media_type) : event.media_type });
  });
  if (Array.isArray(next.archive_config?.documents)) next.archive_config.documents = next.archive_config.documents.map((doc) => {
    const file_url = normalizeMediaUrlValue(doc.file_url);
    const media_url = normalizeMediaUrlValue(doc.media_url);
    const url = file_url || media_url;
    return normalizeScrollableImageFields({ ...doc, file_url, media_url, media_type: url ? detectMediaTypeFromUrl(url, doc.media_type || doc.category) : doc.media_type });
  });
  if (next.onboarding_config?.guide_avatar_url) next.onboarding_config.guide_avatar_url = normalizeMediaUrlValue(next.onboarding_config.guide_avatar_url);
  if (next.onboarding_config?.guide_voice_url) next.onboarding_config.guide_voice_url = normalizeMediaUrlValue(next.onboarding_config.guide_voice_url);
  if (next.gamification_config?.badge_icon_url) next.gamification_config.badge_icon_url = normalizeMediaUrlValue(next.gamification_config.badge_icon_url);
  if (next.finale_config?.media_url) {
    next.finale_config.media_url = normalizeMediaUrlValue(next.finale_config.media_url);
    next.finale_config = normalizeScrollableImageFields(next.finale_config);
    if (next.finale_config.media_url) next.finale_config.media_type = detectMediaTypeFromUrl(next.finale_config.media_url, next.finale_config.media_type);
  }
  if (Array.isArray(next.artifact_sprites)) next.artifact_sprites = next.artifact_sprites.map((sprite) => {
    const media_url = firstUrl(sprite.active_museum_media_url, sprite.processed_sprite_url, sprite.media_url, sprite.sprite_image_url, sprite.original_media_url);
    const media_type = detectMediaTypeFromUrl(media_url, sprite.media_type || sprite.artifact_type);
    return clampArtifactToSafeZone({ artifact: { ...sprite, media_url, media_type, artifact_type: media_type, active_museum_media_url: media_url, processed_sprite_url: normalizeMediaUrlValue(sprite.processed_sprite_url), original_media_url: normalizeMediaUrlValue(sprite.original_media_url), video_url: normalizeMediaUrlValue(sprite.video_url), audio_url: normalizeMediaUrlValue(sprite.audio_url) }, semanticLayout: next.room_semantic_layout });
  });
  return mirrorPublicUploadContract(next);
}

export function getMediaWarnings(room = {}, label = room.room_key || room.title || "Room") {
  const warnings = [];
  const check = (url, type, name) => { if (url && !type) warnings.push(`${label}: ${name} has a media URL but no media type; it will be auto-detected.`); };
  const checkScrollable = (source = {}, url, type, name) => {
    if (!source.scrollable_image_enabled) return;
    if (!url) warnings.push(`${label}: ${name} has scrollable image enabled but no image URL exists.`);
    if (!isImageMediaType(type)) warnings.push(`${label}: ${name} has scrollable image enabled but is not an image.`);
    if (!source.scrollable_image_mode) warnings.push(`${label}: ${name} has scrollable image enabled but no mode is set.`);
  };
  if ((room.museum_mode_enabled || room.artifact_placement_enabled) && !(room.artifact_sprites || []).length) warnings.push(`${label}: Museum Mode is enabled but no artifact sprite is uploaded.`);
  if ((room.museum_mode_enabled || room.artifact_placement_enabled) && Number(room.room_semantic_layout?.confidence || 0) < 0.58) warnings.push(`${label}: Museum Mode floor detection confidence is low; safe fallback placement is being used.`);
  (room.artifact_sprites || []).forEach((sprite, index) => {
    if (sprite.media_url && !sprite.media_type && !sprite.artifact_type) warnings.push(`${label}: artifact sprite ${index + 1} has no media type; it will be auto-detected.`);
    if (sprite.video_url && !/(youtube\.com|youtu\.be|vimeo\.com|\.(mp4|webm|mov|m4v)(\?|#|$))/i.test(sprite.video_url)) warnings.push(`${label}: artifact sprite ${index + 1} has a video URL that may not preview inline.`);
    const zone = room.room_semantic_layout?.safe_placement_zones?.[0];
    if (zone && (Number(sprite.x) < zone.x || Number(sprite.y) < zone.y - 12 || Number(sprite.x) > zone.x + zone.width || Number(sprite.y) > zone.y + zone.height)) warnings.push(`${label}: artifact sprite ${index + 1} is outside the suggested safe zone.`);
  });
  check(room.media_url, room.media_type, "main media");
  check(room.background_media_url, room.background_media_type, "background media");
  check(room.foreground_media_url, room.foreground_media_type, "foreground media");
  checkScrollable(room, room.background_media_url || room.media_url, room.background_media_url ? room.background_media_type : room.media_type, "room image");
  (room.artifact_config?.artifacts || []).forEach((artifact, index) => {
    check(artifact.media_url, artifact.artifact_type, `artifact ${index + 1}`);
    checkScrollable(artifact, artifact.media_url, artifact.artifact_type, `artifact ${index + 1}`);
  });
  (room.timeline_config?.events || []).forEach((event, index) => {
    check(event.media_url, event.media_type, `timeline event ${index + 1}`);
    checkScrollable(event, event.media_url, event.media_type, `timeline event ${index + 1}`);
  });
  (room.archive_config?.documents || []).forEach((doc, index) => {
    check(doc.file_url || doc.media_url, doc.media_type, `archive document ${index + 1}`);
    checkScrollable(doc, doc.file_url || doc.media_url, doc.media_type, `archive document ${index + 1}`);
  });
  check(room.performance_config?.performance_media_url, room.performance_config?.performance_media_type, "performance media");
  checkScrollable(room.performance_config, room.performance_config?.performance_media_url, room.performance_config?.performance_media_type, "performance media");
  checkScrollable(room.finale_config, room.finale_config?.media_url, room.finale_config?.media_type, "finale media");
  return warnings;
}