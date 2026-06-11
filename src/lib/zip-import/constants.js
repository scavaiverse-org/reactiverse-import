// Constants for the "Import Museum ZIP" planning pipeline.
// These define what is allowed into the system before anything is extracted,
// stored, or shown to the AI planning layer.

export const ZIP_IMPORT_MODES = ["expert", "easy", "very_easy"];
export const DEFAULT_ZIP_IMPORT_MODE = "very_easy";

export const MAX_FILE_COUNT = 500;
export const MAX_FOLDER_DEPTH = 12;
export const MAX_FILENAME_LENGTH = 180;

export const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif", "svg"];
export const VIDEO_EXTENSIONS = ["mp4", "mov", "webm"];
export const AUDIO_EXTENSIONS = ["mp3", "wav", "m4a", "ogg"];
export const DOCUMENT_EXTENSIONS = ["txt", "md", "json", "csv", "pdf"];
export const OPTIONAL_DOCUMENT_EXTENSIONS = ["docx", "pptx"];

export const ALLOWED_EXTENSIONS = [
  ...IMAGE_EXTENSIONS,
  ...VIDEO_EXTENSIONS,
  ...AUDIO_EXTENSIONS,
  ...DOCUMENT_EXTENSIONS,
  ...OPTIONAL_DOCUMENT_EXTENSIONS,
];

// Extensions that are always rejected, regardless of MIME type or content.
export const BLOCKED_EXTENSIONS = [
  "exe", "bat", "cmd", "sh", "ps1", "js", "ts", "mjs", "cjs", "php", "py", "rb",
  "jar", "dll", "so", "dylib", "app", "scr", "msi", "com", "vbs", "html", "htm",
  "wasm", "apk", "ipa", "deb", "rpm", "bin", "iso", "img",
];

export const HIDDEN_OR_SYSTEM_FILE_PATTERNS = [
  /^\.ds_store$/i,
  /^thumbs\.db$/i,
  /^desktop\.ini$/i,
  /^__macosx\//i,
  /(^|\/)\.[^/]+$/, // any dotfile/dot-folder segment
];

export function fileExtension(filename = "") {
  const trimmed = String(filename || "").trim();
  const lastDot = trimmed.lastIndexOf(".");
  if (lastDot === -1 || lastDot === trimmed.length - 1) return "";
  return trimmed.slice(lastDot + 1).toLowerCase();
}

export function detectAssetKind(extension = "") {
  const ext = String(extension || "").toLowerCase();
  if (IMAGE_EXTENSIONS.includes(ext)) return "image";
  if (VIDEO_EXTENSIONS.includes(ext)) return "video";
  if (AUDIO_EXTENSIONS.includes(ext)) return "audio";
  if (DOCUMENT_EXTENSIONS.includes(ext) || OPTIONAL_DOCUMENT_EXTENSIONS.includes(ext)) return "document";
  return "unknown";
}

export const TEXT_EXTRACTABLE_EXTENSIONS = ["txt", "md", "json", "csv"];
