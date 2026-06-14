import {
  SKIN_TONES, BODY_BUILDS, HEIGHT_RANGE, HAIR_STYLES, HAIR_COLORS, OUTFIT_COLORS,
  ACCESSORIES, VIEW_MODES, QUALITY_TIERS, SOURCE_PHOTO_TYPES,
} from "@/lib/avatar-seed";

const VISITOR_ID_KEY = "scaverse_avatar_visitor_id_v1";

// A random, unguessable id used to own an avatar row when the visitor isn't
// logged in. Stored in localStorage and acts as a capability token (see RLS
// policies in 0018_avatar_creator.sql).
export function getOrCreateVisitorId() {
  if (typeof window === "undefined" || !window.localStorage) return null;
  let id = window.localStorage.getItem(VISITOR_ID_KEY);
  if (!id) {
    // This id is a capability token used by RLS, so it must be unguessable.
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      id = crypto.randomUUID();
    } else if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      // Fallback for environments without randomUUID: still cryptographically
      // secure (never Math.random, which is predictable).
      const bytes = crypto.getRandomValues(new Uint8Array(16));
      id = `visitor-${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
    } else {
      throw new Error("A secure crypto API is required to generate a visitor id");
    }
    window.localStorage.setItem(VISITOR_ID_KEY, id);
  }
  return id;
}

export function defaultAvatarConfig() {
  return {
    display_name: "",
    skin_tone: SKIN_TONES[3].id,
    body_build: BODY_BUILDS[1].id,
    height_scale: HEIGHT_RANGE.default,
    hair_style: HAIR_STYLES[1].id,
    hair_color: HAIR_COLORS[1].id,
    outfit_top_color: OUTFIT_COLORS[2].id,
    outfit_bottom_color: OUTFIT_COLORS[0].id,
    accessory: ACCESSORIES[0].id,
    view_mode: VIEW_MODES[0].id,
    quality_tier: QUALITY_TIERS[0].id,
    face_cutout_url: null,
    body_cutout_url: null,
    source_photo_type: SOURCE_PHOTO_TYPES.NONE,
    consent_given_at: null,
    age_confirmed: false,
  };
}

export function clampHeightScale(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return HEIGHT_RANGE.default;
  return Math.min(HEIGHT_RANGE.max, Math.max(HEIGHT_RANGE.min, num));
}

export function resolveSkinTone(id) {
  return SKIN_TONES.find((entry) => entry.id === id) || SKIN_TONES[3];
}

export function resolveBodyBuild(id) {
  return BODY_BUILDS.find((entry) => entry.id === id) || BODY_BUILDS[1];
}

export function resolveHairColor(id) {
  return HAIR_COLORS.find((entry) => entry.id === id) || HAIR_COLORS[1];
}

export function resolveOutfitColor(id) {
  return OUTFIT_COLORS.find((entry) => entry.id === id) || OUTFIT_COLORS[0];
}

// Builds the row payload for base44.entities.Avatar.create/update from a
// config object plus the resolved owner (exactly one of userId/visitorId).
export function buildAvatarRow(config, { userId, visitorId }) {
  const now = new Date().toISOString();
  return {
    user_id: userId || null,
    visitor_id: userId ? null : visitorId,
    display_name: config.display_name || "",
    skin_tone: config.skin_tone,
    body_build: config.body_build,
    height_scale: clampHeightScale(config.height_scale),
    hair_style: config.hair_style,
    hair_color: config.hair_color,
    outfit_top_color: config.outfit_top_color,
    outfit_bottom_color: config.outfit_bottom_color,
    accessory: config.accessory,
    view_mode: config.view_mode,
    quality_tier: config.quality_tier,
    face_cutout_url: config.face_cutout_url || null,
    body_cutout_url: config.body_cutout_url || null,
    source_photo_type: config.source_photo_type || SOURCE_PHOTO_TYPES.NONE,
    consent_given_at: config.consent_given_at || null,
    age_confirmed: !!config.age_confirmed,
    updated_at: now,
  };
}

// Maps a saved avatars row back to the editable config shape.
export function configFromAvatarRow(row) {
  if (!row) return defaultAvatarConfig();
  const base = defaultAvatarConfig();
  return {
    ...base,
    display_name: row.display_name || "",
    skin_tone: row.skin_tone || base.skin_tone,
    body_build: row.body_build || base.body_build,
    height_scale: clampHeightScale(row.height_scale),
    hair_style: row.hair_style || base.hair_style,
    hair_color: row.hair_color || base.hair_color,
    outfit_top_color: row.outfit_top_color || base.outfit_top_color,
    outfit_bottom_color: row.outfit_bottom_color || base.outfit_bottom_color,
    accessory: row.accessory || base.accessory,
    view_mode: row.view_mode || base.view_mode,
    quality_tier: row.quality_tier || base.quality_tier,
    face_cutout_url: row.face_cutout_url || null,
    body_cutout_url: row.body_cutout_url || null,
    source_photo_type: row.source_photo_type || base.source_photo_type,
    consent_given_at: row.consent_given_at || null,
    age_confirmed: !!row.age_confirmed,
  };
}
