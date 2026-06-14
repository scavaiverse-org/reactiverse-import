export const SCROLLABLE_OBJECT_POOLS = {
  default: ["shelves", "wall decorations", "small display items", "floor continuation", "soft lighting", "storage objects", "framed pieces", "books", "boxes", "small sculptures", "plants", "fabric", "lamps"],
  museum: ["display cases", "archival posters", "costume displays", "stage curtains", "wooden panels", "lanterns", "ceramic pieces", "musical instruments", "masks", "framed cultural photographs", "museum labels without readable text", "soft gallery lighting"],
};

export const SCROLLABLE_AVOID_POOL = ["extra people", "distorted faces", "duplicated animals", "warped text", "melted furniture", "broken shelves", "impossible floor perspective", "inconsistent lighting", "heavy blur", "surreal objects", "random fantasy elements", "low quality", "artifacts", "duplicate main subject", "changed center image", "broken wall seams", "misaligned floorboards"];

// Width share of EACH side panel relative to the original (each side). Original always stays 1.0 (100%).
export const SCROLLABLE_EXTENSION_SHARE = { subtle: 0.35, medium: 0.6, wide: 0.9, immersive: 1.25 };

export const SCROLLABLE_IMAGE_DEFAULTS = {
  scrollable_image_enabled: false,
  scrollable_image_mode: "off",
  scrollable_image_strength: "medium",
  scrollable_image_preserve_integrity: true,
  scrollable_image_drag_sensitivity: 1,
  scrollable_image_initial_position: "center",
  scrollable_image_edge_protection: true,
  scrollable_image_mobile_swipe: true,
  scrollable_image_mouse_drag: true,
  scrollable_image_coordinate_space: "viewport_percent",
  scrollable_image_viewport_x: 0,
  scrollable_image_full_width_reference: 0,
  scrollable_image_public_parity_checked: false,
  // Generation pipeline fields
  scrollable_image_generation_status: "idle",
  scrollable_image_generation_error: null,
  scrollable_image_original_url: "",
  scrollable_image_extended_url: "",
  scrollable_image_left_extension_url: "",
  scrollable_image_right_extension_url: "",
  scrollable_image_extension_mode: "ai_outpaint",
  scrollable_image_extension_strength: "medium",
  scrollable_image_object_density: "medium",
  scrollable_image_visual_style: "same_room_realistic",
  scrollable_image_randomness: 0.12,
  scrollable_image_seed: "",
  scrollable_image_render_mode: "single_stitched_panorama",
  scrollable_image_approved: false,
  scrollable_image_manifest: null,
};

const VALID_EXT_STRENGTH = ["subtle", "medium", "wide", "immersive"];
const VALID_DENSITY = ["minimal", "medium", "rich"];
const VALID_STATUS = ["idle", "pending", "complete", "failed"];

export function isImageMediaType(type = "") {
  const value = String(type || "").toLowerCase();
  return value === "image" || value.includes("image") || value === "panorama";
}

export function normalizeScrollableImageFields(source = {}) {
  const next = { ...SCROLLABLE_IMAGE_DEFAULTS, ...source };
  const enabled = !!next.scrollable_image_enabled;
  next.scrollable_image_enabled = enabled;
  next.scrollable_image_mode = enabled ? (next.scrollable_image_mode || "horizontal-drag") : "off";
  next.scrollable_image_strength = VALID_EXT_STRENGTH.includes(next.scrollable_image_strength) ? next.scrollable_image_strength : "medium";
  next.scrollable_image_preserve_integrity = true;
  next.scrollable_image_drag_sensitivity = Number(next.scrollable_image_drag_sensitivity || 1);
  next.scrollable_image_initial_position = ["left", "center", "right"].includes(next.scrollable_image_initial_position) ? next.scrollable_image_initial_position : "center";
  next.scrollable_image_edge_protection = next.scrollable_image_edge_protection !== false;
  next.scrollable_image_mobile_swipe = next.scrollable_image_mobile_swipe !== false;
  next.scrollable_image_mouse_drag = next.scrollable_image_mouse_drag !== false;
  next.scrollable_image_coordinate_space = enabled ? "full_image_percent" : "viewport_percent";
  next.scrollable_image_viewport_x = Number(next.scrollable_image_viewport_x || 0);
  next.scrollable_image_full_width_reference = Number(next.scrollable_image_full_width_reference || next.image_width || next.natural_width || 0);
  next.scrollable_image_public_parity_checked = !!next.scrollable_image_public_parity_checked;
  // Generation pipeline normalization
  next.scrollable_image_generation_status = VALID_STATUS.includes(next.scrollable_image_generation_status) ? next.scrollable_image_generation_status : "idle";
  next.scrollable_image_generation_error = next.scrollable_image_generation_error || null;
  next.scrollable_image_original_url = String(next.scrollable_image_original_url || "");
  next.scrollable_image_extended_url = String(next.scrollable_image_extended_url || "");
  next.scrollable_image_left_extension_url = String(next.scrollable_image_left_extension_url || "");
  next.scrollable_image_right_extension_url = String(next.scrollable_image_right_extension_url || "");
  next.scrollable_image_extension_mode = next.scrollable_image_extension_mode || "ai_outpaint";
  next.scrollable_image_extension_strength = VALID_EXT_STRENGTH.includes(next.scrollable_image_extension_strength) ? next.scrollable_image_extension_strength : "medium";
  next.scrollable_image_object_density = VALID_DENSITY.includes(next.scrollable_image_object_density) ? next.scrollable_image_object_density : "medium";
  next.scrollable_image_visual_style = next.scrollable_image_visual_style || "same_room_realistic";
  next.scrollable_image_randomness = Math.min(1, Math.max(0, Number(next.scrollable_image_randomness ?? 0.12)));
  next.scrollable_image_seed = String(next.scrollable_image_seed || "");
  next.scrollable_image_render_mode = next.scrollable_image_render_mode || "single_stitched_panorama";
  next.scrollable_image_approved = !!next.scrollable_image_approved;
  next.scrollable_image_manifest = next.scrollable_image_manifest || null;
  return next;
}

export function getScrollableImageSettings(source = {}, mediaType = "") {
  const normalized = normalizeScrollableImageFields(source);
  return normalized.scrollable_image_enabled && isImageMediaType(mediaType) ? normalized : null;
}

// Canonical helpers for resolving a room's primary image + type. Use these
// everywhere instead of manually checking fields, so scrollable controls never
// misread room state (e.g. image stored only in background_media_url).
export function getPrimaryRoomImage(room = {}) {
  return room.scrollable_image_original_url || room.background_media_url || room.media_url || room.foreground_media_url || "";
}

export function getPrimaryRoomImageType(room = {}) {
  if (room.scrollable_image_original_url) return "image";
  if (room.background_media_url) return room.background_media_type || "image";
  if (room.media_url) return room.media_type || "image";
  if (room.foreground_media_url) return room.foreground_media_type || "image";
  return room.media_type || "image";
}

// Public renderer should ONLY use the extended panorama when generated AND approved.
export function hasApprovedPanorama(source = {}) {
  return !!(source.scrollable_image_approved && source.scrollable_image_generation_status === "complete" && source.scrollable_image_extended_url && source.scrollable_image_render_mode === "single_stitched_panorama");
}

export function makeScrollableImagePatch(enabled) {
  return enabled
    ? { ...SCROLLABLE_IMAGE_DEFAULTS, scrollable_image_enabled: true, scrollable_image_mode: "horizontal-drag", scrollable_image_coordinate_space: "full_image_percent" }
    : { ...SCROLLABLE_IMAGE_DEFAULTS };
}

// Reset generated assets without touching the original upload or the scrollable toggle.
export function makeResetGenerationPatch() {
  return {
    scrollable_image_generation_status: "idle",
    scrollable_image_generation_error: null,
    scrollable_image_extended_url: "",
    scrollable_image_left_extension_url: "",
    scrollable_image_right_extension_url: "",
    scrollable_image_approved: false,
    scrollable_image_manifest: null,
  };
}