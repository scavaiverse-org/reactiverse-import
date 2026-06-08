import { HOME_MEDIA_SLOTS } from "./home-media-slots";

const SUPPORTED_TYPES = ["image", "video"];

export function validateHomeMediaAssignment({ slotKey, media }) {
  const slot = HOME_MEDIA_SLOTS.find((item) => item.slotKey === slotKey);
  if (!slot) return { status: "FAIL", publishBlocked: true, message: "Slot does not exist." };
  if (!media) return { status: "EMPTY", publishBlocked: false, message: "No media assigned; fallback gradient will render." };
  if (media.status !== "active" || media.isActive === false) return { status: "FAIL", publishBlocked: true, message: "Registry record is not active." };
  if (!media.fileUrl) return { status: "FAIL", publishBlocked: true, message: "Media URL is missing." };
  if (!SUPPORTED_TYPES.includes(media.mediaType) || !slot.allowedMediaTypes.includes(media.mediaType)) return { status: "FAIL", publishBlocked: true, message: "Media type is not supported for this slot." };
  if (!Array.isArray(media.assignedSections) || !media.assignedSections.includes(slot.assignedSection)) return { status: "FAIL", publishBlocked: true, message: "Media is not assigned to this exact slot." };
  return { status: "PASS", publishBlocked: false, message: "Media assignment is valid." };
}

export function canRenderSlotMedia(slotKey, media) {
  return validateHomeMediaAssignment({ slotKey, media }).status === "PASS";
}