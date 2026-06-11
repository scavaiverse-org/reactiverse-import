import JSZip from "jszip";
import { uploadFile } from "@/lib/upload";
import { WALKTHROUGHS } from "@/lib/walkthrough-admin";
import { validateZipEntries } from "@/lib/zip-import/validate";
import { TEXT_EXTRACTABLE_EXTENSIONS, detectAssetKind, fileExtension } from "@/lib/zip-import/constants";

const MAX_EXTRACTED_TEXT_CHARS = 4000;

function humanizeFilename(path = "") {
  const base = path.split("/").pop() || path;
  const withoutExt = base.includes(".") ? base.slice(0, base.lastIndexOf(".")) : base;
  return withoutExt
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase()) || base;
}

function safeFilenameFor(path = "") {
  return path
    .split("/")
    .map((segment) => segment.replace(/[^a-zA-Z0-9._-]/g, "_"))
    .join("__");
}

function detectSuggestedWalkthroughKey(path = "") {
  const segments = path.toLowerCase().split("/");
  const match = segments.find((segment) => WALKTHROUGHS.includes(segment.replace(/[^a-z0-9]/g, "")));
  if (!match) return null;
  return match.replace(/[^a-z0-9]/g, "");
}

function firstNonEmptyLine(text = "") {
  const line = String(text || "").split(/\r?\n/).find((entry) => entry.trim().length > 0);
  return line ? line.trim().slice(0, 200) : "";
}

async function buildAcceptedAsset(zip, entry, index) {
  const path = entry.path;
  const ext = fileExtension(path);
  const kind = detectAssetKind(ext);
  const zipObject = zip.file(path);

  const asset = {
    id: crypto.randomUUID(),
    original_filename: path,
    safe_filename: safeFilenameFor(path),
    detected_type: kind,
    mime_type: "",
    file_extension: ext,
    file_size: Number(entry.size || 0),
    storage_path: "",
    media_url: "",
    extracted_text: "",
    detected_title: humanizeFilename(path),
    detected_description: "",
    suggested_room_usage: kind === "image" || kind === "video" ? "primary_media" : kind === "audio" ? "narration_audio" : "reference_material",
    suggested_walkthrough_key: detectSuggestedWalkthroughKey(path),
    suggested_room_order: index + 1,
    confidence_score: 0.5,
    warnings: [],
    is_supported: true,
    requires_manual_review: false,
  };

  if (kind === "image" || kind === "video" || kind === "audio") {
    try {
      const blob = await zipObject.async("blob");
      const file = new File([blob], path.split("/").pop(), { type: blob.type || "" });
      const { file_url } = await uploadFile(file);
      asset.media_url = file_url;
      asset.storage_path = file_url;
      asset.mime_type = file.type || "";
      asset.confidence_score = 0.8;
      if (ext === "svg") {
        asset.requires_manual_review = true;
        asset.warnings.push("SVG files require manual review before publishing — verify the file is a static image with no embedded scripts.");
      }
    } catch (error) {
      asset.is_supported = false;
      asset.requires_manual_review = true;
      asset.warnings.push(`Failed to store this file: ${error?.message || "unknown upload error"}.`);
    }
    return asset;
  }

  if (TEXT_EXTRACTABLE_EXTENSIONS.includes(ext)) {
    try {
      const text = await zipObject.async("string");
      asset.extracted_text = text.slice(0, MAX_EXTRACTED_TEXT_CHARS);
      asset.detected_description = firstNonEmptyLine(text);
      asset.suggested_room_usage = "narration_or_reference_text";
      asset.confidence_score = 0.6;
    } catch (error) {
      asset.requires_manual_review = true;
      asset.warnings.push(`Could not read this file as text: ${error?.message || "unknown error"}.`);
    }
    return asset;
  }

  // pdf / docx / pptx — not parsed in-browser; keep as a reference asset for manual review.
  asset.requires_manual_review = true;
  asset.suggested_room_usage = "reference_material";
  asset.confidence_score = 0.3;
  asset.warnings.push(`"${ext.toUpperCase()}" content could not be automatically read and needs manual review.`);
  return asset;
}

/**
 * Extract a ZIP file into a draft asset inventory. Never executes uploaded
 * content; only reads bytes for validated, allow-listed file types.
 *
 * @param {File} file
 * @returns {Promise<{
 *   ok: boolean,
 *   batchId: string,
 *   errors: string[],
 *   inventory: object[],
 *   rejected: { original_filename: string, reason: string }[],
 * }>}
 */
export async function extractZipInventory(file) {
  const batchId = crypto.randomUUID();
  const buffer = typeof file.arrayBuffer === "function" ? await file.arrayBuffer() : file;
  const zip = await JSZip.loadAsync(buffer);

  const entries = Object.values(zip.files).map((entry) => ({
    path: entry.name,
    size: entry._data?.uncompressedSize ?? entry.uncompressedSize ?? 0,
    isDirectory: entry.dir,
  }));

  const { ok, errors, accepted, rejected } = validateZipEntries(entries);

  if (!ok) {
    return { ok: false, batchId, errors, inventory: [], rejected: rejected.map((r) => ({ original_filename: r.entry.path, reason: r.reason })) };
  }

  const inventory = [];
  for (let index = 0; index < accepted.length; index += 1) {
    // Sequential to keep upload concurrency bounded and ordering deterministic.
    const asset = await buildAcceptedAsset(zip, accepted[index], index);
    asset.zip_import_batch_id = batchId;
    inventory.push(asset);
  }

  return {
    ok: true,
    batchId,
    errors: [],
    inventory,
    rejected: rejected.map((r) => ({ original_filename: r.entry.path, reason: r.reason })),
  };
}
