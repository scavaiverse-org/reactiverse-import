// Add-on layer: detects images that are clearly NOT museum room media
// (email inboxes, docs, chat, dashboards, screenshots) so they are not counted
// as ready and can be quarantined. This is a heuristic filename/URL check — it
// never deletes media, it only classifies it.

const BLOCKED_FILENAME_TOKENS = [
  "screenshot",
  "screen-shot",
  "screen_shot",
  "gmail",
  "docs-edit",
  "email",
  "inbox",
  "whatsapp",
  "telegram",
  "messenger",
  "screenrecorder",
  "screen-recorder",
  "screen_record",
  "notification",
  "dashboard",
  "comgoogleandroidappsdocs",
];

// Filenames containing these tokens must never be seeded as room media.
export const FORBIDDEN_SEED_TOKENS = [
  "screenshot",
  "gmail",
  "docs-edit",
  "email",
  "whatsapp",
  "screenrecorder",
];

const MUSEUM_HINT_TOKENS = [
  "museum", "gallery", "hall", "exhibit", "artifact", "stage", "opera",
  "costume", "archive", "interior", "room", "wall", "performance", "cultural",
  "scene", "panorama", "display",
];

function lower(value = "") {
  return String(value || "").toLowerCase();
}

function lastSegment(url = "") {
  const clean = lower(url).split("?")[0];
  const parts = clean.split("/");
  return parts[parts.length - 1] || clean;
}

// Returns a media_validation object. Pure — never mutates input.
export function analyzeRoomMedia({ fileName = "", fileUrl = "" } = {}) {
  const haystack = `${lower(fileName)} ${lastSegment(fileUrl)}`;
  const matchedBlocked = BLOCKED_FILENAME_TOKENS.find((token) => haystack.includes(token));
  const matchedMuseum = MUSEUM_HINT_TOKENS.find((token) => haystack.includes(token));

  if (matchedBlocked) {
    const isEmail = ["gmail", "email", "inbox", "docs-edit", "comgoogleandroidappsdocs", "whatsapp", "telegram", "messenger", "notification"].some((t) => haystack.includes(t));
    if (isEmail) {
      return {
        status: "rejected",
        reason: "This looks like a screenshot of an email, chat, or app screen, not a museum room image.",
        detected_category: "email_or_app_screenshot",
        contains_private_ui: true,
        contains_email_ui: true,
        museum_suitability_score: 0,
      };
    }
    return {
      status: "needs_review",
      reason: "Screenshot filename detected. If this is a gallery, room, exhibit wall, or museum image, it can still be published after review.",
      detected_category: "unverified_screenshot_media",
      contains_private_ui: false,
      contains_email_ui: false,
      museum_suitability_score: 0.5,
    };
  }

  return {
    status: matchedMuseum ? "approved" : "needs_review",
    reason: matchedMuseum
      ? "Detected museum-style room media."
      : "Could not confirm this is a museum room image. Review before publishing.",
    detected_category: matchedMuseum ? "museum_environment" : "unverified",
    contains_private_ui: false,
    contains_email_ui: false,
    museum_suitability_score: matchedMuseum ? 0.9 : 0.5,
  };
}

// Whether a validation object should block "ready" status.
export function mediaValidationBlocksReady(validation) {
  if (!validation) return false;
  return validation.status === "rejected" && (validation.contains_email_ui || validation.detected_category === "email_or_app_screenshot");
}

// Whether a candidate image is suitable for scrollable left/right extension.
export function isImageSuitableForExtension({ fileName = "", fileUrl = "", mediaType = "" } = {}) {
  const type = lower(mediaType);
  if (type && !type.includes("image") && type !== "panorama") {
    return { suitable: false, reason: "Scrollable extension only works on images, not video, audio, or 3D files." };
  }
  const validation = analyzeRoomMedia({ fileName, fileUrl });
  if (validation.status === "rejected") {
    return {
      suitable: false,
      reason: "This image is not suitable for left/right room extension. Use a museum room, gallery, stage, hallway, exhibit wall, room interior, or wide environmental image.",
    };
  }
  return { suitable: true, reason: "" };
}

// Static guard for seed data: throws/reports if a forbidden filename is used.
export function isForbiddenSeedMedia(value = "") {
  const haystack = `${lower(value)}`;
  return FORBIDDEN_SEED_TOKENS.some((token) => haystack.includes(token));
}