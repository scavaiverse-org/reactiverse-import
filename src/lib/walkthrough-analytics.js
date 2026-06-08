import { base44 } from "@/api/base44Client";

export const WALKTHROUGH_EVENTS = [
  "walkthrough_started",
  "walkthrough_room_viewed",
  "walkthrough_page_type_viewed",
  "walkthrough_hotspot_opened",
  "walkthrough_artifact_opened",
  "walkthrough_ai_question_started",
  "walkthrough_game_started",
  "walkthrough_game_completed",
  "walkthrough_choice_selected",
  "walkthrough_memory_saved",
  "walkthrough_reflection_completed",
  "walkthrough_completed",
];

export function trackWalkthroughEvent({ eventName, tenant, museumId, walkthroughKey, room, data = {} }) {
  if (!eventName) return Promise.resolve();
  return base44.entities.AnalyticsEvent.create({
    tenant_id: tenant?.id,
    tenant_name: tenant?.name,
    event_type: eventName,
    source_page: "walkthrough",
    event_data: {
      museum_id: museumId || tenant?.id,
      walkthrough_key: walkthroughKey,
      room_id: room?.id,
      room_key: room?.room_key,
      room_order: room?.order,
      page_type: room?.page_type,
      timestamp: new Date().toISOString(),
      ...data,
    },
  }).catch(() => {});
}