// Canonical readiness scanner (add-on truth layer).
// Reads existing room data and returns clearer readiness states. It does NOT
// mutate rooms. All builder surfaces (Super Easy count, Journey Map badges,
// timeline, quality panel, publish validation, dry run) should read from here
// so readiness is consistent everywhere.

import { analyzeRoomMedia, mediaValidationBlocksReady } from "@/lib/walkthrough-media-validation";

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function getPrimaryImage(room = {}) {
  return room.scrollable_image_original_url || room.background_media_url || room.media_url || room.foreground_media_url || "";
}

// Evaluate a single room. Returns { ready, status, blockers, warnings, actions }.
export function evaluateRoomReadiness(room = {}) {
  const blockers = [];
  const warnings = [];
  const actions = [];

  const title = room.title;
  const story = room.narration || room.description;
  const image = getPrimaryImage(room);

  // Resolve media validation: prefer a stored result, otherwise compute it.
  const validation = room.media_validation && room.media_validation.status
    ? room.media_validation
    : (image ? analyzeRoomMedia({ fileName: room.media_file_name || "", fileUrl: image }) : null);

  if (!hasText(title)) {
    blockers.push("Missing room title.");
    actions.push({ code: "OPEN_ROOM", label: "Add Title" });
  }
  if (!hasText(story)) {
    blockers.push("Missing narration or description.");
    actions.push({ code: "OPEN_ROOM", label: "Add Story" });
  }
  if (!image) {
    blockers.push("Missing room media.");
    actions.push({ code: "OPEN_ROOM", label: "Upload Media" });
  } else if (mediaValidationBlocksReady(validation)) {
    blockers.push(validation.reason || "Media looks like a screenshot, not museum room media.");
    actions.push({ code: "REVIEW_MEDIA", label: "Review Media" });
  } else if (validation && validation.status === "needs_review") {
    warnings.push(validation.reason || "Room media should be reviewed before publishing.");
  }

  if (image && !hasText(room.accessibility?.alt_text)) {
    warnings.push("Missing media alt text.");
  }

  if (room.scrollable_image_enabled && !room.scrollable_image_approved) {
    blockers.push("Scrollable mode is on but the panorama is not approved.");
    actions.push({ code: "OPEN_SCROLLABLE", label: "Approve Panorama" });
  }

  let status = "ready";
  if (blockers.length) status = "blocked";
  else if (warnings.length) status = "needs_review";

  return { ready: status === "ready", status, blockers, warnings, actions };
}

// Evaluate the whole experience. Aggregates per-room readiness.
export function evaluateExperienceReadiness(rooms = []) {
  const perRoom = rooms.map((room, index) => ({ index, room, ...evaluateRoomReadiness(room) }));
  const readyCount = perRoom.filter((entry) => entry.ready).length;
  const needsReviewCount = perRoom.filter((entry) => entry.status === "needs_review").length;
  const blockedCount = perRoom.filter((entry) => entry.status === "blocked").length;
  return {
    perRoom,
    readyCount,
    needsReviewCount,
    blockedCount,
    total: rooms.length,
  };
}

// Convenience for the shallow-count callers that just need a truthful number.
export function countReadyRooms(rooms = []) {
  return evaluateExperienceReadiness(rooms).readyCount;
}