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
 * The first path segment of a ZIP entry, or "" for files at the ZIP root.
 */
function topLevelFolder(path = "") {
  const segments = path.split("/");
  return segments.length > 1 ? segments[0] : "";
}

/**
 * Compare two strings the way a human would order filenames: numeric runs
 * compare by value ("room-2" before "room-10"), everything else compares
 * lexically. This is what makes folder/room ordering deterministic and
 * stable regardless of ZIP iteration order.
 */
function naturalCompare(a = "", b = "") {
  const ax = String(a).match(/\d+|\D+/g) || [];
  const bx = String(b).match(/\d+|\D+/g) || [];
  const len = Math.max(ax.length, bx.length);
  for (let i = 0; i < len; i += 1) {
    const av = ax[i] ?? "";
    const bv = bx[i] ?? "";
    if (av === bv) continue;
    const an = /^\d+$/.test(av);
    const bn = /^\d+$/.test(bv);
    if (an && bn) return Number(av) - Number(bv);
    return av < bv ? -1 : 1;
  }
  return 0;
}

/**
 * If a folder name is explicitly an existing walkthrough slot
 * ("walkthrough2", "wt2", "w2"), return that slot key. Otherwise null.
 */
function explicitWalkthroughKey(folder = "") {
  const normalized = folder.toLowerCase().replace(/[^a-z0-9]/g, "");
  const match = normalized.match(/^(?:walkthrough|wt|w)([1-5])$/);
  return match ? `walkthrough${match[1]}` : null;
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
 * The plan can span multiple walkthroughs: every top-level folder in the ZIP
 * that contains image/video assets becomes one walkthrough's set of rooms,
 * ordered (the "chapters") by the natural order of the file paths within that
 * folder. Folder → walkthrough slot assignment is deterministic:
 *  1. Folders explicitly named "walkthroughN" / "wtN" / "wN" claim that slot.
 *  2. Remaining folders fill the remaining slots in natural sort order.
 *  3. At most WALKTHROUGHS.length folders are imported; extras are dropped
 *     with a warning rather than silently merged into another walkthrough.
 *
 * @param {{ inventory: object[], mode: "expert"|"easy"|"very_easy", tenant?: object }} input
 */
export function buildHeuristicMuseumPlan({ inventory = [], mode = "very_easy", tenant = null }) {
  const safeMode = ZIP_IMPORT_MODES.includes(mode) ? mode : "very_easy";
  const visualAssets = inventory.filter(isVisualAsset);
  const textAssets = inventory.filter(isTextAsset);
  const audioAssets = inventory.filter(isAudioAsset);

  const planWarnings = [];
  const usedAssetIds = new Set();

  // Group visual assets by their top-level folder ("" = files at the ZIP root).
  const folderGroups = new Map();
  visualAssets.forEach((asset) => {
    const folder = topLevelFolder(asset.original_filename);
    if (!folderGroups.has(folder)) folderGroups.set(folder, []);
    folderGroups.get(folder).push(asset);
  });

  // Assign each folder to a walkthrough slot, deterministically.
  const folderToKey = new Map();
  const claimedKeys = new Set();
  const folders = [...folderGroups.keys()];

  folders.forEach((folder) => {
    const explicitKey = explicitWalkthroughKey(folder);
    if (explicitKey && !claimedKeys.has(explicitKey)) {
      folderToKey.set(folder, explicitKey);
      claimedKeys.add(explicitKey);
    }
  });

  const remainingFolders = folders.filter((folder) => !folderToKey.has(folder)).sort(naturalCompare);
  const availableKeys = WALKTHROUGHS.filter((key) => !claimedKeys.has(key));
  const droppedFolders = [];

  remainingFolders.forEach((folder, index) => {
    if (index < availableKeys.length) {
      folderToKey.set(folder, availableKeys[index]);
      claimedKeys.add(availableKeys[index]);
    } else {
      droppedFolders.push(folder);
    }
  });

  if (droppedFolders.length > 0) {
    planWarnings.push(`A museum supports a maximum of ${WALKTHROUGHS.length} walkthroughs — content from folder(s) ${droppedFolders.map((f) => f || "(ZIP root)").join(", ")} was not imported.`);
  }

  const walkthroughs = WALKTHROUGHS.map((key) => {
    const folder = [...folderToKey.entries()].find(([, mappedKey]) => mappedKey === key)?.[0];
    if (folder === undefined) return null;

    const assets = [...folderGroups.get(folder)].sort((a, b) => naturalCompare(a.original_filename, b.original_filename));
    const rooms = assets.map((asset, index) => {
      const relatedText = findRelatedTextAsset(asset, textAssets);
      const relatedAudio = findRelatedAudioAsset(asset, audioAssets);
      [asset, relatedText, relatedAudio].filter(Boolean).forEach((item) => usedAssetIds.add(item.id));
      const { room, warnings } = buildRoomFromAsset(asset, { mode: safeMode, relatedText, relatedAudio, order: index + 1 });
      planWarnings.push(...warnings);
      return room;
    });

    if (rooms.length === 0) planWarnings.push(`${walkthroughLabel(key)}: no media assets were found for this walkthrough.`);
    planWarnings.push(`${walkthroughLabel(key)}: built from ZIP folder "${folder || "(ZIP root)"}", ${rooms.length} room(s) ordered by file name.`);

    return {
      walkthrough_key: key,
      title: `${walkthroughLabel(key)} — Imported Draft`,
      description: rooms.length ? UNKNOWN : "No content was found in the ZIP for this walkthrough.",
      source_folder: folder,
      rooms,
    };
  }).filter(Boolean);

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
export async function requestAiMuseumPlan({ inventory, mode, tenant }) {
  try {
    const result = await base44.functions.invoke("generate-museum-plan", {
      mode,
      tenant: { name: tenant?.name || "", description: tenant?.description || "", region: tenant?.region || "" },
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
