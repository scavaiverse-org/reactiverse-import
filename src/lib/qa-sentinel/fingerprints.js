const MASKS = [
  { pattern: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, value: "[email]" },
  { pattern: /(token|api[_-]?key|password|secret|authorization)\s*[:=]\s*[^\s&]+/gi, value: "$1=[masked]" },
  { pattern: /\b(?:\d[ -]*?){13,19}\b/g, value: "[payment]" }
];

export function sanitizeText(value = "") {
  let safe = String(value).slice(0, 1200);
  MASKS.forEach(({ pattern, value }) => {
    safe = safe.replace(pattern, value);
  });
  return safe;
}

export function sanitizeObject(value = {}) {
  const json = sanitizeText(JSON.stringify(value || {}));
  try {
    return JSON.parse(json);
  } catch {
    return { redacted: true };
  }
}

export function stableHash(input = "") {
  let hash = 0;
  const text = sanitizeText(input);
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export function createFingerprint({ route = "", component_name = "", target_label = "", message = "", issue_type = "runtime" }) {
  return stableHash([route, component_name, target_label, sanitizeText(message), issue_type].join("::"));
}

export function createIssueKey(fingerprint) {
  return `qa-${fingerprint}`;
}