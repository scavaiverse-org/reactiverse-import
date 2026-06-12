import { MUSEUM_MODE_DEFAULTS } from "@/lib/room-semantic-layout";

export const PAGE_TYPES = {
  onboarding_guide: { label: "Onboarding Guide", description: "Welcome, guide narration, instructions, and visitor choices.", configKey: "onboarding_config" },
  artifact_room: { label: "Artifact Exploration Room", description: "Artifact gallery, metadata, hotspots, and AI explainers.", configKey: "artifact_config" },
  walkthrough_exhibition: { label: "Cinematic Walkthrough Exhibition", description: "Cinematic scene, narration, ambience, and guided storytelling.", configKey: "exhibition_config" },
  gamification_page: { label: "Gamification Challenge", description: "Quiz, mission, scavenger hunt, badge, and puzzle systems.", configKey: "gamification_config" },
  reflection_chamber: { label: "Reflection Chamber", description: "Emotional pause, journaling, calm mode, and reflective prompts.", configKey: "reflection_config" },
  ai_conversation_room: { label: "AI Conversation Room", description: "ARIA discussion, scoped prompts, and educational conversation.", configKey: "ai_conversation_config" },
  performance_stage: { label: "Performance Stage", description: "Opera showcase, spotlight scene, translation, lyrics, and scripts.", configKey: "performance_config" },
  timeline_room: { label: "Timeline Room", description: "Chronology, milestones, historical progression, and linked media.", configKey: "timeline_config" },
  archive_room: { label: "Archive Room", description: "Documents, scans, posters, recordings, and searchable archives.", configKey: "archive_config" },
  branching_choice_room: { label: "Branching Choice Room", description: "Visitor decisions, alternate paths, and replayability.", configKey: "branching_choice_config" },
  memory_collection_room: { label: "Memory Collection Room", description: "Saved discoveries, journals, unlocked items, and memories.", configKey: "memory_collection_config" },
  finale_room: { label: "Finale Room", description: "Recap, achievements, next CTAs, donations, shop, and follow-up.", configKey: "finale_config" },
  three_d_world: { label: "3D World", description: "Immersive 3D room with templates, objects, portals, gamification, and an NPC guide — built without code.", configKey: "threeDWorldConfig" },
};

export const PAGE_TYPE_OPTIONS = Object.entries(PAGE_TYPES).map(([value, config]) => ({ value, ...config }));

export function createAccessibilityConfig() {
  return { reduced_motion_text: "", sensory_warning: "", calm_mode_available: true, transcript: "", alt_text: "" };
}

export function createAdaptiveModesConfig() {
  return { calm_mode: true, reduced_motion: true, accessibility_mode: true, mobile_mode: true };
}

export function createBranchingConfig() {
  return { required: false, optional: true, next_room_id: "", fallback_room_id: "", conditions: [] };
}

export function createOnboardingGuideConfig() {
  return { guide_mode: "welcome", guide_name: "Museum Guide", guide_avatar_url: "", guide_voice_url: "", intro_text: "", step_instruction: "", visitor_choice_prompt: "", choices: [], show_progress: true, allow_skip: false, skip_target_room_id: "" };
}

export function createArtifactRoomConfig() {
  return { room_layout: "spotlight", artifacts: [], show_artifact_cards: true, allow_zoom: true, allow_save_artifact: false, allow_ask_ai: true, semantic_description: "", ai_explainer_prompt: "" };
}

export function createExhibitionConfig() {
  return { exhibition_mode: "cinematic_scene", scene_title: "", scene_narrative: "", camera_motion: "none", mood: "", lighting: "", ambience_audio_url: "", ambience_audio_type: "audio", narrator_audio_url: "", narrator_audio_type: "audio", hotspots: [], cinematic_ctas: [] };
}

export function createGamificationConfig() {
  return { game_type: "quiz", objective_text: "", instructions: "", points_awarded: 10, badge_name: "", badge_icon_url: "", badge_icon_type: "image", required_completion: false, allow_retry: true, success_message: "Great work — challenge complete.", failure_message: "Try again or continue when ready.", next_room_on_success: "", next_room_on_failure: "", questions: [], missions: [] };
}

export function createReflectionConfig() {
  return { reflection_prompt: "", journal_placeholder: "Write what this room made you notice...", mood_options: ["calm", "curious", "moved"], calm_mode_default: true, completion_message: "Reflection saved." };
}

export function createAIConversationConfig() {
  return { persona_name: "ARIA", system_context: "Answer only from this museum experience and the current room context.", starter_questions: ["What should I notice here?", "Why is this important?"], artifact_context_enabled: true, suggested_next_room_id: "" };
}

export function createPerformanceConfig() {
  return { stage_title: "", performance_media_url: "", performance_media_type: "video", script_text: "", lyrics_text: "", translation_text: "", spotlight_style: "gold", subtitles_enabled: true };
}

export function createTimelineConfig() {
  return { timeline_title: "", events: [], show_progression_line: true, chronology_mode: "linear" };
}

export function createArchiveConfig() {
  return { archive_title: "", documents: [], searchable: true, categories: ["poster", "recording", "photo", "scan"] };
}

export function createBranchingChoiceConfig() {
  return { prompt: "Which path would you like to follow?", choices: [] };
}

export function createMemoryCollectionConfig() {
  return { collection_title: "", prompt: "Save a discovery from this room.", collectibles: [], allow_journal: true };
}

export function createFinaleConfig() {
  return { completion_message: "You completed the experience.", achievement_title: "Museum Journey Complete", media_url: "", media_type: "", next_ctas: [] };
}

// The 3D World config is created by the 3D World Builder itself (so the
// builder can show its "start building / load sample" intro until the admin
// initialises it) — the factory only has to preserve whatever exists.
export function createThreeDWorldRoomConfig() {
  return {};
}

export function configFactoryForPageType(pageType) {
  return {
    onboarding_guide: createOnboardingGuideConfig,
    artifact_room: createArtifactRoomConfig,
    walkthrough_exhibition: createExhibitionConfig,
    gamification_page: createGamificationConfig,
    reflection_chamber: createReflectionConfig,
    ai_conversation_room: createAIConversationConfig,
    performance_stage: createPerformanceConfig,
    timeline_room: createTimelineConfig,
    archive_room: createArchiveConfig,
    branching_choice_room: createBranchingChoiceConfig,
    memory_collection_room: createMemoryCollectionConfig,
    finale_room: createFinaleConfig,
    three_d_world: createThreeDWorldRoomConfig,
  }[pageType] || createExhibitionConfig;
}

export function ensureTypeConfigs(room = {}) {
  const pageType = room.page_type || "walkthrough_exhibition";
  const next = {
    emotional_intensity: 40,
    curiosity_level: 55,
    educational_density: 50,
    interaction_density: 45,
    sensory_intensity: 45,
    estimated_duration_seconds: 60,
    ambience: "",
    mood: "",
    lighting: "",
    camera_motion: "none",
    background_media_type: "",
    foreground_media_url: "",
    foreground_media_type: "",
    audio_type: "audio",
    narrator_audio_url: "",
    narrator_audio_type: "audio",
    ...MUSEUM_MODE_DEFAULTS,
    adaptive_modes: createAdaptiveModesConfig(),
    branching: createBranchingConfig(),
    ...room,
    page_type: pageType,
    accessibility: { ...createAccessibilityConfig(), ...(room.accessibility || {}) },
    adaptive_modes: { ...createAdaptiveModesConfig(), ...(room.adaptive_modes || {}) },
    branching: { ...createBranchingConfig(), ...(room.branching || {}) },
  };

  Object.entries(PAGE_TYPES).forEach(([type, config]) => {
    const factory = configFactoryForPageType(type);
    next[config.configKey] = { ...factory(), ...(room[config.configKey] || {}) };
  });

  return next;
}