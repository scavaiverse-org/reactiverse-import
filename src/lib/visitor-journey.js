// Helpers for tracking a visitor's progress through a museum walkthrough:
// which rooms they've visited/skipped, which artifacts they've seen, and the
// resulting completion percentage. Persisted in visitor_journeys
// (0023_visitor_engagement.sql), keyed by the same user_id/visitor_id
// ownership pattern as avatars (see src/lib/avatar-config.js).

export function defaultJourney(tenantId, walkthroughKey, totalRooms = 0) {
  const now = new Date().toISOString();
  return {
    tenant_id: tenantId,
    walkthrough_key: walkthroughKey,
    status: "in_progress",
    visited_room_keys: [],
    skipped_room_keys: [],
    artifacts_viewed: [],
    total_rooms: totalRooms,
    percent_complete: 0,
    last_room_key: null,
    started_at: now,
    last_visited_at: now,
    completed_at: null,
  };
}

// Builds a clean payload for VisitorJourney.create/update — only the columns
// that belong on visitor_journeys, with the owner/scope fields applied.
export function buildJourneyRow(journey, { userId, visitorId, tenantId, walkthroughKey }) {
  return {
    user_id: userId || null,
    visitor_id: userId ? null : visitorId,
    tenant_id: tenantId,
    walkthrough_key: walkthroughKey,
    status: journey.status,
    visited_room_keys: journey.visited_room_keys || [],
    skipped_room_keys: journey.skipped_room_keys || [],
    artifacts_viewed: journey.artifacts_viewed || [],
    total_rooms: journey.total_rooms || 0,
    percent_complete: journey.percent_complete || 0,
    last_room_key: journey.last_room_key || null,
    started_at: journey.started_at,
    last_visited_at: journey.last_visited_at,
    completed_at: journey.completed_at || null,
  };
}

export function computePercentComplete(visitedRoomKeys, totalRooms) {
  if (!totalRooms) return 0;
  const ratio = Math.min(1, visitedRoomKeys.length / totalRooms);
  return Math.round(ratio * 1000) / 10; // one decimal place
}

export function recordRoomVisit(journey, roomKey, totalRooms) {
  const visited = journey.visited_room_keys?.includes(roomKey)
    ? journey.visited_room_keys
    : [...(journey.visited_room_keys || []), roomKey];
  const effectiveTotal = totalRooms ?? journey.total_rooms;
  const percent = computePercentComplete(visited, effectiveTotal);
  const completed = percent >= 100;
  const now = new Date().toISOString();
  return {
    ...journey,
    visited_room_keys: visited,
    total_rooms: effectiveTotal,
    percent_complete: percent,
    last_room_key: roomKey,
    last_visited_at: now,
    status: completed ? "completed" : "in_progress",
    completed_at: completed ? (journey.completed_at || now) : journey.completed_at,
  };
}

export function recordRoomSkip(journey, roomKey) {
  if (journey.skipped_room_keys?.includes(roomKey)) return journey;
  return { ...journey, skipped_room_keys: [...(journey.skipped_room_keys || []), roomKey] };
}

export function recordArtifactViewed(journey, artifactKey) {
  if (journey.artifacts_viewed?.includes(artifactKey)) return journey;
  return { ...journey, artifacts_viewed: [...(journey.artifacts_viewed || []), artifactKey] };
}

// Summarizes a returning visitor's state for "continue your journey" /
// "you missed this room" messaging.
export function describeReturnState(journey, rooms = []) {
  if (!journey) return null;
  const visited = new Set(journey.visited_room_keys || []);
  const skipped = new Set(journey.skipped_room_keys || []);
  const missedRoom = rooms.find((room) => !visited.has(room.room_key) && !skipped.has(room.room_key));
  return {
    percentComplete: journey.percent_complete || 0,
    roomsVisited: journey.visited_room_keys?.length || 0,
    artifactsViewed: journey.artifacts_viewed?.length || 0,
    isComplete: journey.status === "completed",
    lastRoomKey: journey.last_room_key,
    missedRoomKey: missedRoom?.room_key || null,
  };
}
