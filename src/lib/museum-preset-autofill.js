import { WALKTHROUGHS, normalizeRooms } from "@/lib/walkthrough-admin";
import { ensureTypeConfigs } from "@/lib/walkthrough-room-types";
import { deepClone, ensureMediaTypes, normalizeMediaUrlValue } from "@/lib/walkthrough-media-bindings";
import { getWalkthroughWarnings, validateWalkthroughRooms } from "@/lib/walkthrough-validation";
import { scoreWalkthroughQuality } from "@/lib/walkthrough-quality-scoring";

const PAGE_TYPE_BY_MASTER_TYPE = {
  "Onboarding Guide": "onboarding_guide",
  "Timeline Room": "timeline_room",
  "Cinematic Walkthrough Exhibition": "walkthrough_exhibition",
  "Artifact Exploration Room": "artifact_room",
  "Performance Stage": "performance_stage",
  "Branching Choice Room": "branching_choice_room",
  "Finale Room": "finale_room",
};

const MEDIA_FIELDS = ["media_url", "background_media_url", "foreground_media_url", "audio_url", "narrator_audio_url"];

function normalizeWalkthroughKey(value = "") {
  return String(value).toLowerCase();
}

function preserveExistingValue(existingRoom, nextRoom, field, preserveExistingMedia) {
  const nextValue = normalizeMediaUrlValue(nextRoom[field]);
  if (!preserveExistingMedia) return nextValue;
  return normalizeMediaUrlValue(existingRoom?.[field]) || nextValue;
}

function preserveNestedMedia(existingRoom, nextRoom, preserveExistingMedia) {
  if (!preserveExistingMedia || !existingRoom) return nextRoom;
  const preserved = deepClone(nextRoom);
  if (existingRoom.background_media_type) preserved.background_media_type = existingRoom.background_media_type;
  if (existingRoom.foreground_media_type) preserved.foreground_media_type = existingRoom.foreground_media_type;
  if (existingRoom.performance_config?.performance_media_url) {
    preserved.performance_config = { ...(preserved.performance_config || {}), performance_media_url: existingRoom.performance_config.performance_media_url, performance_media_type: existingRoom.performance_config.performance_media_type || preserved.performance_config?.performance_media_type };
  }
  if ((existingRoom.artifact_config?.artifacts || []).some((item) => item.media_url || item.thumbnail_url)) preserved.artifact_config = deepClone(existingRoom.artifact_config);
  if ((existingRoom.timeline_config?.events || []).some((item) => item.media_url)) preserved.timeline_config = deepClone(existingRoom.timeline_config);
  if ((existingRoom.archive_config?.documents || []).some((item) => item.file_url || item.media_url)) preserved.archive_config = deepClone(existingRoom.archive_config);
  if (existingRoom.exhibition_config?.ambience_audio_url || existingRoom.exhibition_config?.narrator_audio_url) {
    preserved.exhibition_config = { ...(preserved.exhibition_config || {}), ambience_audio_url: existingRoom.exhibition_config.ambience_audio_url || preserved.exhibition_config?.ambience_audio_url, narrator_audio_url: existingRoom.exhibition_config.narrator_audio_url || preserved.exhibition_config?.narrator_audio_url };
  }
  if (existingRoom.onboarding_config?.guide_avatar_url || existingRoom.onboarding_config?.guide_voice_url) {
    preserved.onboarding_config = { ...(preserved.onboarding_config || {}), guide_avatar_url: existingRoom.onboarding_config.guide_avatar_url || preserved.onboarding_config?.guide_avatar_url, guide_voice_url: existingRoom.onboarding_config.guide_voice_url || preserved.onboarding_config?.guide_voice_url };
  }
  if (existingRoom.gamification_config?.badge_icon_url) preserved.gamification_config = { ...(preserved.gamification_config || {}), badge_icon_url: existingRoom.gamification_config.badge_icon_url };
  if (existingRoom.finale_config?.media_url) preserved.finale_config = { ...(preserved.finale_config || {}), media_url: existingRoom.finale_config.media_url, media_type: existingRoom.finale_config.media_type || preserved.finale_config?.media_type };
  return ensureMediaTypes(preserved);
}

function mapChoices(choices = []) {
  return choices.map((choice) => ({
    label: choice.label,
    next_room_id: choice.nextRoomId,
    description: choice.description || "",
  }));
}

function mapHotspots(hotspots = []) {
  return hotspots.map((hotspot, index) => ({
    id: hotspot.id || `hotspot-${index + 1}`,
    label: hotspot.label || hotspot.title || `Hotspot ${index + 1}`,
    title: hotspot.title || hotspot.label || `Hotspot ${index + 1}`,
    description: hotspot.description || "",
  }));
}

function presetRoomToCanonical(presetRoom, index, existingRoom, preserveExistingMedia) {
  const pageType = PAGE_TYPE_BY_MASTER_TYPE[presetRoom.masterPageType] || "walkthrough_exhibition";
  const choices = mapChoices(presetRoom.visitorChoices || presetRoom.onboardingConfig?.visitorChoices || []);
  const mediaType = String(presetRoom.mediaType || "Image").toLowerCase();
  const nextRoomId = presetRoom.nextRoomId || "";
  const baseRoom = ensureTypeConfigs({
    id: presetRoom.roomKey,
    room_key: presetRoom.roomKey,
    order: index + 1,
    page_type: pageType,
    title: presetRoom.title,
    subtitle: presetRoom.subtitle || "",
    narration: presetRoom.narration || "",
    description: presetRoom.description || "",
    media_type: mediaType,
    media_url: presetRoom.mainMediaUrl || "",
    background_media_url: presetRoom.backgroundMediaUrl || "",
    foreground_media_url: presetRoom.foregroundMediaUrl || "",
    audio_url: presetRoom.audioUrl || "",
    narrator_audio_url: presetRoom.narratorAudioUrl || "",
    transition_type: String(presetRoom.transition || "Fade").toLowerCase(),
    visibility: "draft",
    hotspots: mapHotspots(presetRoom.hotspots || []),
    ctas: [],
    branching: {
      required: pageType === "branching_choice_room",
      optional: pageType !== "branching_choice_room",
      next_room_id: pageType === "branching_choice_room" || pageType === "finale_room" ? "" : nextRoomId,
      fallback_room_id: "",
      conditions: [],
    },
    accessibility: {
      alt_text: presetRoom.altText || "",
      transcript: presetRoom.transcript || "",
      sensory_warning: "",
      calm_mode_available: true,
      reduced_motion_text: "Reduced motion and calm mode are supported for this preset room.",
    },
    adaptive_modes: {
      calm_mode: true,
      reduced_motion: true,
      accessibility_mode: true,
      mobile_mode: true,
    },
  });

  MEDIA_FIELDS.forEach((field) => {
    baseRoom[field] = preserveExistingValue(existingRoom, baseRoom, field, preserveExistingMedia);
  });

  baseRoom.onboarding_config = {
    ...baseRoom.onboarding_config,
    guide_mode: presetRoom.onboardingConfig?.guideMode || "Welcome",
    guide_name: presetRoom.onboardingConfig?.guideName || "The Archivist",
    guide_avatar_url: presetRoom.onboardingConfig?.guideAvatarUrl || "",
    guide_voice_url: presetRoom.onboardingConfig?.voiceAudioUrl || "",
    intro_text: presetRoom.onboardingConfig?.introText || presetRoom.description || "",
    step_instruction: presetRoom.onboardingConfig?.instructionText || "",
    show_progress: presetRoom.onboardingConfig?.showProgress ?? true,
    allow_skip: presetRoom.onboardingConfig?.allowSkip ?? false,
    skip_target_room_id: presetRoom.onboardingConfig?.skipNextRoomId || "",
    choices,
  };

  baseRoom.exhibition_config = {
    ...baseRoom.exhibition_config,
    scene_title: presetRoom.title,
    scene_narrative: presetRoom.narration || presetRoom.description || "",
    narrator_audio_url: baseRoom.narrator_audio_url,
    ambience_audio_url: baseRoom.audio_url,
    hotspots: baseRoom.hotspots,
  };

  baseRoom.artifact_config = {
    ...baseRoom.artifact_config,
    artifacts: baseRoom.hotspots.map((hotspot) => ({
      title: hotspot.title,
      description: hotspot.description,
      media_url: baseRoom.media_url || baseRoom.foreground_media_url || "",
      thumbnail_url: baseRoom.foreground_media_url || baseRoom.media_url || "",
      artifact_type: baseRoom.media_type || baseRoom.foreground_media_type || "image",
    })),
    semantic_description: presetRoom.description || "",
  };

  baseRoom.performance_config = {
    ...baseRoom.performance_config,
    stage_title: presetRoom.title,
    performance_media_url: baseRoom.media_url,
    script_text: presetRoom.narration || "",
  };

  baseRoom.timeline_config = {
    ...baseRoom.timeline_config,
    timeline_title: presetRoom.title,
    events: [{
      title: presetRoom.title,
      description: presetRoom.description || presetRoom.narration || "",
      media_url: baseRoom.media_url || baseRoom.background_media_url || "",
      media_type: baseRoom.media_type || baseRoom.background_media_type || "image",
    }],
  };

  baseRoom.branching_choice_config = {
    ...baseRoom.branching_choice_config,
    prompt: presetRoom.subtitle || "Choose your path",
    choices,
  };

  baseRoom.finale_config = {
    ...baseRoom.finale_config,
    media_url: baseRoom.media_url || baseRoom.background_media_url || "",
    media_type: baseRoom.media_type || baseRoom.background_media_type || "image",
    completion_message: presetRoom.finaleConfig?.completionMessage || presetRoom.description || "Journey complete.",
    achievement_title: presetRoom.finaleConfig?.achievementTitle || "Journey Complete",
    next_ctas: [
      presetRoom.finaleConfig?.primaryCtaLabel && { label: presetRoom.finaleConfig.primaryCtaLabel, route: presetRoom.finaleConfig.primaryCtaRoute },
      presetRoom.finaleConfig?.secondaryCtaLabel && { label: presetRoom.finaleConfig.secondaryCtaLabel, route: presetRoom.finaleConfig.secondaryCtaRoute },
      presetRoom.finaleConfig?.ticketCtaLabel && { label: presetRoom.finaleConfig.ticketCtaLabel, route: presetRoom.finaleConfig.ticketCtaRoute },
    ].filter(Boolean),
  };

  return ensureMediaTypes(preserveNestedMedia(existingRoom, baseRoom, preserveExistingMedia));
}

export function createPresetValidationSummary(rooms = []) {
  const errors = validateWalkthroughRooms(rooms);
  const warnings = getWalkthroughWarnings(rooms);
  const quality = scoreWalkthroughQuality(rooms);
  const missingMediaCount = rooms.filter((room) => !room.media_url && !room.background_media_url && !room.foreground_media_url).length;
  const accessibilityIssues = rooms.filter((room) => {
    const hasMedia = room.media_url || room.background_media_url || room.foreground_media_url;
    const hasAudio = room.audio_url || room.narrator_audio_url;
    return (hasMedia && !room.accessibility?.alt_text) || (hasAudio && !room.accessibility?.transcript);
  }).length;

  return {
    roomsCreated: rooms.length,
    warningsRemaining: warnings.length,
    missingMediaCount,
    accessibilityIssues,
    publishSafetyScore: quality.publish_safety || 0,
    errors,
    warnings,
  };
}

export function populateMuseumPreset({ selectedTenant, museumId, walkthroughKey, preset, existingRooms = [], resetCurrentWalkthrough = true, preserveExistingMedia = true }) {
  if (!selectedTenant?.id) throw new Error("Select a tenant before populating the museum.");
  if (!museumId) throw new Error("Select a museum before populating the walkthrough.");
  if (museumId !== selectedTenant.id && museumId !== selectedTenant.museum_id) throw new Error("Selected museum must belong to the selected tenant.");
  if (!WALKTHROUGHS.includes(walkthroughKey)) throw new Error("Selected walkthrough key is not valid.");
  if (!preset?.rooms?.length) throw new Error("Selected preset is empty.");

  const presetWalkthroughKey = normalizeWalkthroughKey(preset.walkthroughKey);
  const isPlatformPreset = preset.presetScope === "system" || preset.preset_scope === "system" || preset.isSystemPreset || preset.is_system_preset || (!preset.tenantId && !preset.tenant_id);
  if (presetWalkthroughKey && presetWalkthroughKey !== walkthroughKey && !isPlatformPreset) throw new Error("Selected preset does not match this walkthrough key.");

  const safeExistingRooms = deepClone(existingRooms);
  const existingByKey = new Map(safeExistingRooms.map((room) => [room.room_key, room]));
  const presetKeys = new Set(preset.rooms.map((room) => room.roomKey));
  const generatedRooms = preset.rooms.map((room, index) => presetRoomToCanonical(room, index, existingByKey.get(room.roomKey), preserveExistingMedia));
  const retainedRooms = resetCurrentWalkthrough ? [] : safeExistingRooms.filter((room) => !presetKeys.has(room.room_key));
  const nextRooms = normalizeRooms([...retainedRooms, ...generatedRooms], walkthroughKey);
  const summary = createPresetValidationSummary(nextRooms);

  return { rooms: nextRooms, summary };
}