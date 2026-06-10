import { base44 } from "@/api/base44Client";
import { WALKTHROUGHS, walkthroughLabel } from "@/lib/walkthrough-admin";
import { ZIP_IMPORT_MODES } from "@/lib/zip-import/constants";

const UNKNOWN = "Unknown — add this before publishing.";

function baseFilename(path = "") {
  const name = path.split("/").pop() || path;
  return name.includes(".") ? name.slice(0, name.lastIndexOf(".")) : name;
}

function folderOf(path = "") {
  const segments = path.split("/");
  segments.pop();
  return segments.join("/");
}

function isVisualAsset(asset) {
  return asset.detected_type === "image" || asset.detected_type === "video";
}

function isAudioAsset(asset) {
  return asset.detected_type === "audio";
}

function isTextAsset(asset) {
  return asset.detected_type === "document" && !!asset.extracted_text;
}

/**
 * Find a text asset that appears to describe the same subject as a visual
 * asset — same base filename or same folder. Returns null if nothing matches;
 * the caller must not invent narration when this is null.
 */
function findRelatedTextAsset(visualAsset, textAssets) {
  const visualBase = baseFilename(visualAsset.original_filename).toLowerCase();
  const visualFolder = folderOf(visualAsset.original_filename).toLowerCase();

  return (
    textAssets.find((text) => baseFilename(text.original_filename).toLowerCase() === visualBase) ||
    textAssets.find((text) => folderOf(text.original_filename).toLowerCase() === visualFolder) ||
    null
  );
}

function findRelatedAudioAsset(visualAsset, audioAssets) {
  const visualBase = baseFilename(visualAsset.original_filename).toLowerCase();
  const visualFolder = folderOf(visualAsset.original_filename).toLowerCase();

  return (
    audioAssets.find((audio) => baseFilename(audio.original_filename).toLowerCase() === visualBase) ||
    audioAssets.find((audio) => folderOf(audio.original_filename).toLowerCase() === visualFolder) ||
    null
  );
}

function buildRoomFromAsset(asset, { mode, relatedText, relatedAudio, order }) {
  const warnings = [...(asset.warnings || [])];
  const title = asset.detected_title || `Room ${order}`;
  const description = relatedText?.extracted_text ? relatedText.detected_description || "" : asset.detected_description || "";

  const room = {
    title,
    description,
    media_url: asset.media_url || "",
    background_media_url: "",
    media_type: asset.detected_type === "video" ? "video" : "image",
    page_type: "walkthrough_exhibition",
    order,
    visibility: asset.media_url ? "visible" : "draft",
    source_asset_ids: [asset.id, relatedText?.id, relatedAudio?.id].filter(Boolean),
  };

  if (!asset.media_url) {
    warnings.push(`"${title}" has no usable media yet — assign an image or video before publishing.`);
  }

  if (mode === "very_easy") {
    room.narration = relatedText?.extracted_text ? relatedText.extracted_text.slice(0, 600) : "";
    return { room, warnings };
  }

  // easy and expert: always populate narration, falling back to an explicit
  // "not available" marker rather than inventing content.
  room.narration = relatedText?.extracted_text
    ? relatedText.extracted_text.slice(0, 1200)
    : description || "Narration not available in the uploaded materials — add narration before publishing.";
  room.hotspots = [];
  room.ctas = [];
  if (relatedAudio?.media_url) room.audio_url = relatedAudio.media_url;

  if (mode === "easy") return { room, warnings };

  // expert: richer structure on top of "easy"
  room.accessibility = {
    alt_text: asset.detected_title || UNKNOWN,
    long_description: relatedText?.extracted_text ? relatedText.extracted_text.slice(0, 2000) : UNKNOWN,
  };
  room.ctas = [{ label: "Learn More", action: "", note: "Suggested CTA — set a destination before publishing." }];
  room.suggested_learning_outcome = relatedText?.extracted_text
    ? "Visitors will engage with the source material associated with this room."
    : UNKNOWN;
  room.curatorial_framing = relatedText?.extracted_text
    ? relatedText.extracted_text.slice(0, 400)
    : UNKNOWN;
  if (!relatedText) warnings.push(`"${title}" has no matching curatorial text — interpretation fields are marked unknown.`);

  return { room, warnings };
}

/**
 * Build a deterministic, non-fabricating museum plan purely from the asset
 * inventory. Never invents titles, dates, names, or facts that aren't present
 * in the uploaded files — missing information is marked unknown/needs-media.
 *
 * @param {{ inventory: object[], mode: "expert"|"easy"|"very_easy", tenant?: object, includedWalkthroughKeys?: string[] }} input
 */
export function buildHeuristicMuseumPlan({ inventory = [], mode = "very_easy", tenant = null, includedWalkthroughKeys = [] }) {
  const safeMode = ZIP_IMPORT_MODES.includes(mode) ? mode : "very_easy";
  const visualAssets = inventory.filter(isVisualAsset);
  const textAssets = inventory.filter(isTextAsset);
  const audioAssets = inventory.filter(isAudioAsset);

  const defaultKey = includedWalkthroughKeys[0] || "walkthrough1";
  const groups = new Map();
  visualAssets.forEach((asset) => {
    const key = WALKTHROUGHS.includes(asset.suggested_walkthrough_key) ? asset.suggested_walkthrough_key : defaultKey;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(asset);
  });

  const usedAssetIds = new Set();
  const planWarnings = [];

  const orderedKeys = WALKTHROUGHS.filter((key) => groups.has(key));
  const walkthroughs = orderedKeys.map((key) => {
    const assets = [...groups.get(key)].sort((a, b) => a.suggested_room_order - b.suggested_room_order);
    const rooms = assets.map((asset, index) => {
      const relatedText = findRelatedTextAsset(asset, textAssets);
      const relatedAudio = findRelatedAudioAsset(asset, audioAssets);
      [asset, relatedText, relatedAudio].filter(Boolean).forEach((item) => usedAssetIds.add(item.id));
      const { room, warnings } = buildRoomFromAsset(asset, { mode: safeMode, relatedText, relatedAudio, order: index + 1 });
      planWarnings.push(...warnings);
      return room;
    });

    if (rooms.length === 0) planWarnings.push(`${walkthroughLabel(key)}: no media assets were found for this walkthrough.`);

    return {
      walkthrough_key: key,
      title: `${walkthroughLabel(key)} — Imported Draft`,
      description: rooms.length ? UNKNOWN : "No content was found in the ZIP for this walkthrough.",
      rooms,
    };
  });

  if (walkthroughs.length === 0) {
    planWarnings.push("No images or videos were found in the ZIP — at least one visual asset is required to draft a room.");
  }

  const unusedAssets = inventory.filter((asset) => !usedAssetIds.has(asset.id));

  return {
    museum_title: tenant?.name || UNKNOWN,
    museum_description: tenant?.description || UNKNOWN,
    mode: safeMode,
    walkthroughs,
    unused_assets: unusedAssets.map((asset) => ({ id: asset.id, original_filename: asset.original_filename, detected_type: asset.detected_type, requires_manual_review: asset.requires_manual_review })),
    warnings: planWarnings,
    source: "heuristic",
    summary: `Generated a ${safeMode.replace("_", " ")} draft from ${inventory.length} file(s): ${walkthroughs.reduce((sum, w) => sum + w.rooms.length, 0)} room(s) across ${walkthroughs.length} walkthrough(s), ${unusedAssets.length} file(s) unused.`,
  };
}

/**
 * Ask the AI planning edge function for a proposed plan. Returns null if the
 * function is unavailable or errors — callers must fall back to
 * buildHeuristicMuseumPlan in that case. The AI is instructed (server-side)
 * to never fabricate facts and to mark unknowns explicitly.
 */
export async function requestAiMuseumPlan({ inventory, mode, tenant, includedWalkthroughKeys }) {
  try {
    const result = await base44.functions.invoke("generate-museum-plan", {
      mode,
      tenant: { name: tenant?.name || "", description: tenant?.description || "", region: tenant?.region || "" },
      included_walkthrough_keys: includedWalkthroughKeys,
      asset_inventory: inventory.map((asset) => ({
        id: asset.id,
        original_filename: asset.original_filename,
        detected_type: asset.detected_type,
        detected_title: asset.detected_title,
        detected_description: asset.detected_description,
        extracted_text: asset.extracted_text,
        media_url: asset.media_url,
        suggested_walkthrough_key: asset.suggested_walkthrough_key,
        suggested_room_order: asset.suggested_room_order,
      })),
    });
    if (!result || !Array.isArray(result.walkthroughs)) return null;
    return { ...result, source: "ai" };
  } catch {
    return null;
  }
}

/**
 * Build a museum plan, preferring the AI planning layer and falling back to
 * the deterministic heuristic builder if the AI is unavailable.
 */
export async function buildMuseumPlan(input) {
  const aiPlan = await requestAiMuseumPlan(input);
  if (aiPlan) return aiPlan;
  return buildHeuristicMuseumPlan(input);
}
