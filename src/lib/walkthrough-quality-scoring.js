import { findBrokenRoutes, getWalkthroughWarnings, validateWalkthroughRooms } from "@/lib/walkthrough-validation";

const clamp = (value) => Math.max(0, Math.min(100, Math.round(value)));
const average = (values) => values.length ? values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length : 0;

export function scoreWalkthroughQuality(rooms = []) {
  const errors = validateWalkthroughRooms(rooms);
  const warnings = getWalkthroughWarnings(rooms);
  const brokenRoutes = findBrokenRoutes(rooms);
  const hasOnboarding = rooms.some((room) => room.page_type === "onboarding_guide");
  const hasFinale = rooms.some((room) => room.page_type === "finale_room");
  const typeCount = new Set(rooms.map((room) => room.page_type)).size;
  const mediaRooms = rooms.filter((room) => room.media_url || room.background_media_url || room.foreground_media_url).length;
  const interactiveRooms = rooms.filter((room) => (room.hotspots || []).length || ["gamification_page", "branching_choice_room", "ai_conversation_room", "memory_collection_room"].includes(room.page_type)).length;
  const passiveRooms = rooms.length - interactiveRooms;
  const accessibilityHits = rooms.reduce((sum, room) => sum + (room.accessibility?.alt_text ? 1 : 0) + (room.accessibility?.transcript ? 1 : 0) + (room.accessibility?.sensory_warning ? 1 : 0) + (room.accessibility?.calm_mode_available !== false ? 1 : 0), 0);
  const accessibilityTotal = Math.max(rooms.length * 4, 1);

  const immersion = clamp(35 + typeCount * 5 + (mediaRooms / Math.max(rooms.length, 1)) * 25 + average(rooms.map((room) => room.emotional_intensity)) * 0.2);
  const narrativeCoherence = clamp(40 + (hasOnboarding ? 20 : 0) + (hasFinale ? 20 : 0) - brokenRoutes.length * 12 + (rooms.length >= 3 ? 10 : 0));
  const accessibility = clamp((accessibilityHits / accessibilityTotal) * 100);
  const educationalValue = clamp(average(rooms.map((room) => room.educational_density)) + rooms.filter((room) => ["artifact_room", "timeline_room", "archive_room", "ai_conversation_room"].includes(room.page_type)).length * 6);
  const interactionBalance = clamp(100 - Math.abs(passiveRooms - interactiveRooms) * 14 - rooms.filter((room) => room.page_type === "gamification_page").length * 3);
  const emotionalPacing = clamp(100 - Math.max(0, average(rooms.map((room) => room.sensory_intensity)) - 70) * 1.4 - Math.max(0, average(rooms.map((room) => room.emotional_intensity)) - 80));
  const completionReadiness = clamp(100 - errors.length * 12 - warnings.length * 4);
  const spatialRooms = rooms.filter((room) => room.museum_mode_enabled || room.artifact_placement_enabled);
  // Evaluate each room against its OWN floor baseline. The previous one-liner
  // re-searched all rooms per sprite (O(n²)) and could match a sprite to the
  // wrong room's baseline when ids weren't unique.
  const spatialReadiness = spatialRooms.length
    ? (() => {
        const roomsMissingBaseline = spatialRooms.filter((room) => !room.room_semantic_layout?.floor_baseline_y).length;
        let misalignedSprites = 0;
        spatialRooms.forEach((room) => {
          const baseline = Number(room.room_semantic_layout?.floor_baseline_y || 86);
          (room.artifact_sprites || []).forEach((sprite) => {
            if (sprite.floor_locked !== false) {
              const bottom = (Number(sprite.y) || 0) + (Number(sprite.height) || 0);
              if (Math.abs(bottom - baseline) > 4) misalignedSprites += 1;
            }
          });
        });
        return clamp(100 - roomsMissingBaseline * 25 - misalignedSprites * 18);
      })()
    : 100;
  const publishSafety = clamp(100 - errors.length * 18 - brokenRoutes.length * 15);

  return {
    immersion,
    narrative_coherence: narrativeCoherence,
    accessibility,
    educational_value: educationalValue,
    interaction_balance: interactionBalance,
    emotional_pacing: emotionalPacing,
    completion_readiness: completionReadiness,
    spatial_readiness: spatialReadiness,
    publish_safety: publishSafety,
    errors,
    warnings,
  };
}