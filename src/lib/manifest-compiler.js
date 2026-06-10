import { WALKTHROUGHS, extractRoomsFromConfig, walkthroughLabel } from "@/lib/walkthrough-admin";
import { deepClone } from "@/lib/walkthrough-media-bindings";

const ROOM_FIELDS_TO_STRIP = ["warnings", "draft_state", "append_only_editor", "quality_scores", "legacy_backup_before_dynamic_walkthrough_migration"];

function isValidMediaUrl(url = "") {
  if (typeof url !== "string" || !url.trim()) return false;
  return /^(https?:\/\/|\/|data:)/i.test(url.trim());
}

function stripEditorFields(room = {}) {
  const clean = { ...room };
  ROOM_FIELDS_TO_STRIP.forEach((field) => delete clean[field]);
  return clean;
}

function rawRoomsFromConfig(config) {
  if (config?.walkthrough_config?.rooms?.length) return config.walkthrough_config.rooms;
  if (config?.rooms?.length) return config.rooms;
  return [];
}

function compileWalkthrough(config, walkthroughKey, errors) {
  const label = walkthroughLabel(walkthroughKey);

  const visibleRawRooms = rawRoomsFromConfig(config)
    .filter((room) => room?.visibility !== "hidden" && room?.visibility !== "draft");

  visibleRawRooms.forEach((room, index) => {
    if (!room?.title || !String(room.title).trim()) {
      const roomLabel = room?.room_key || `room ${index + 1}`;
      errors.push(`${label} / ${roomLabel}: room is missing a title.`);
    }
  });

  const rooms = extractRoomsFromConfig(config, walkthroughKey)
    .filter((room) => room.visibility !== "hidden" && room.visibility !== "draft")
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0) || String(a.room_key || "").localeCompare(String(b.room_key || "")))
    .map((room, index) => ({ ...stripEditorFields(room), id: room.room_key || `${walkthroughKey}-room-${index + 1}`, order: index + 1 }));

  if (rooms.length === 0) {
    errors.push(`${label}: has zero visible rooms.`);
    return null;
  }

  rooms.forEach((room) => {
    const roomLabel = room.title || room.room_key || `${label} room`;
    if (!isValidMediaUrl(room.media_url) && !isValidMediaUrl(room.background_media_url)) errors.push(`${label} / ${roomLabel}: room has no valid media_url or background_media_url.`);
  });

  return {
    walkthrough_key: walkthroughKey,
    title: config?.title || label,
    description: config?.description || "",
    order: WALKTHROUGHS.indexOf(walkthroughKey) + 1,
    rooms,
  };
}

function buildCard(tenant, walkthroughs, errors) {
  const title = tenant?.theme_config?.hero_title || tenant?.name || "";
  const description = tenant?.description || "";
  if (!title.trim()) errors.push("Card: title is required (set tenant name or theme_config.hero_title).");
  if (!description.trim()) errors.push("Card: description is required (set tenant description).");

  const firstWalkthrough = walkthroughs[0];
  const firstRoom = firstWalkthrough?.rooms?.[0];
  const coverMediaUrl = firstRoom?.background_media_url || firstRoom?.media_url || "";

  return {
    title,
    description,
    cover_media_url: coverMediaUrl,
    region: tenant?.region || "",
    walkthrough_count: walkthroughs.length,
  };
}

/**
 * Pure compile + validation. Same input always produces an identical manifest
 * (excluding published_at). Returns { manifest: null, errors } if any gate fails.
 */
export function compileMuseumManifest({ tenant, experienceConfigs = [], includedWalkthroughKeys = [], previousVersion = 0, publishedBy = "" }) {
  const errors = [];
  const configs = deepClone(experienceConfigs).filter((config) => config?.module_key === "walkthrough");

  const orderedKeys = WALKTHROUGHS.filter((key) => includedWalkthroughKeys.includes(key));
  if (orderedKeys.length === 0) errors.push("At least one walkthrough must be included to publish.");

  const duplicateKeys = orderedKeys.filter((key, index) => orderedKeys.indexOf(key) !== index);
  [...new Set(duplicateKeys)].forEach((key) => errors.push(`${walkthroughLabel(key)}: duplicate walkthrough_key is not allowed.`));

  const walkthroughs = [];
  const sourceConfigIds = [];
  orderedKeys.forEach((key) => {
    const config = configs.find((item) => (item.walkthrough_key || item.walkthrough_config?.walkthrough_key) === key);
    const compiled = compileWalkthrough(config, key, errors);
    if (compiled) {
      walkthroughs.push(compiled);
      if (config?.id) sourceConfigIds.push(config.id);
    }
  });

  if (errors.length > 0) return { manifest: null, errors };

  const card = buildCard(tenant, walkthroughs, errors);
  if (errors.length > 0) return { manifest: null, errors };

  const manifest = {
    tenant_id: tenant?.id || "",
    museum_id: tenant?.id || "",
    tenant_slug: tenant?.slug || "",
    manifest_version: Number(previousVersion || 0) + 1,
    schema_version: 1,
    card,
    walkthroughs,
    published_at: new Date().toISOString(),
    published_by: publishedBy || "",
    source_experience_config_ids: sourceConfigIds,
    integrity: { gates_passed: true },
  };

  return { manifest, errors: [] };
}
