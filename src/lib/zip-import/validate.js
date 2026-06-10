import {
  ALLOWED_EXTENSIONS,
  BLOCKED_EXTENSIONS,
  HIDDEN_OR_SYSTEM_FILE_PATTERNS,
  MAX_EXTRACTED_BYTES,
  MAX_FILENAME_LENGTH,
  MAX_FILE_COUNT,
  MAX_FOLDER_DEPTH,
  MAX_ZIP_BYTES,
  fileExtension,
} from "@/lib/zip-import/constants";

/**
 * One ZIP entry as reported by the extractor before any file is read into memory.
 * @typedef {{ path: string, size: number, isDirectory: boolean }} ZipEntryMeta
 */

function isPathTraversal(path = "") {
  return path.split("/").some((segment) => segment === "..");
}

function isHiddenOrSystemFile(path = "") {
  const segments = path.split("/").filter(Boolean);
  return segments.some((segment) => HIDDEN_OR_SYSTEM_FILE_PATTERNS.some((pattern) => pattern.test(`${segment}/`) || pattern.test(segment)));
}

function isAbsoluteOrRooted(path = "") {
  return path.startsWith("/") || /^[a-zA-Z]:\\/.test(path) || path.startsWith("\\\\");
}

/**
 * Validate the ZIP at the listing level, before extracting any file content.
 * Never executes or reads file content — operates on names/sizes only.
 *
 * @param {ZipEntryMeta[]} entries
 * @param {{ zipBytes?: number }} [options]
 * @returns {{ ok: boolean, errors: string[], accepted: ZipEntryMeta[], rejected: { entry: ZipEntryMeta, reason: string }[] }}
 */
export function validateZipEntries(entries = [], { zipBytes = 0 } = {}) {
  const errors = [];
  const accepted = [];
  const rejected = [];

  if (zipBytes > MAX_ZIP_BYTES) {
    errors.push(`ZIP file is too large (${zipBytes} bytes). Maximum allowed is ${MAX_ZIP_BYTES} bytes.`);
  }

  const files = entries.filter((entry) => !entry.isDirectory);

  if (files.length > MAX_FILE_COUNT) {
    errors.push(`ZIP contains too many files (${files.length}). Maximum allowed is ${MAX_FILE_COUNT}.`);
  }

  let totalExtractedBytes = 0;
  const seenSafeNames = new Set();

  files.forEach((entry) => {
    const path = String(entry.path || "");
    totalExtractedBytes += Number(entry.size || 0);

    const segments = path.split("/").filter(Boolean);
    const ext = fileExtension(path);

    if (isPathTraversal(path)) {
      rejected.push({ entry, reason: "Path traversal (`..`) is not allowed." });
      return;
    }
    if (isAbsoluteOrRooted(path)) {
      rejected.push({ entry, reason: "Absolute or rooted file paths are not allowed." });
      return;
    }
    if (segments.length > MAX_FOLDER_DEPTH) {
      rejected.push({ entry, reason: `Folder depth exceeds the maximum of ${MAX_FOLDER_DEPTH}.` });
      return;
    }
    if (path.length > MAX_FILENAME_LENGTH) {
      rejected.push({ entry, reason: `File path exceeds the maximum length of ${MAX_FILENAME_LENGTH} characters.` });
      return;
    }
    if (isHiddenOrSystemFile(path)) {
      rejected.push({ entry, reason: "Hidden or OS system files are not imported." });
      return;
    }
    if (!ext) {
      rejected.push({ entry, reason: "File has no extension and cannot be classified." });
      return;
    }
    if (BLOCKED_EXTENSIONS.includes(ext)) {
      rejected.push({ entry, reason: `File type \".${ext}\" is not allowed for security reasons.` });
      return;
    }
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      rejected.push({ entry, reason: `File type \".${ext}\" is not a supported museum asset type.` });
      return;
    }

    const normalized = path.toLowerCase();
    if (seenSafeNames.has(normalized)) {
      rejected.push({ entry, reason: "Duplicate filename within the ZIP." });
      return;
    }
    seenSafeNames.add(normalized);

    accepted.push(entry);
  });

  if (totalExtractedBytes > MAX_EXTRACTED_BYTES) {
    errors.push(`Total extracted size (${totalExtractedBytes} bytes) exceeds the maximum of ${MAX_EXTRACTED_BYTES} bytes.`);
  }

  return { ok: errors.length === 0, errors, accepted, rejected };
}
