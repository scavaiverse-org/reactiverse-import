// Lightweight client-side spam protection for public forms (ticket
// reservations, vendor applications, tenant inquiries). Combines a hidden
// honeypot field with a per-form submission rate limit persisted in
// localStorage. This is a first line of defence — Supabase RLS and edge
// functions remain the authoritative guard.

const STORE_PREFIX = "scavers_form_guard_";
const DEFAULT_COOLDOWN_MS = 30 * 1000;
const DEFAULT_MAX_PER_HOUR = 5;
const HOUR_MS = 60 * 60 * 1000;

function storageKey(formKey) {
  return `${STORE_PREFIX}${formKey}`;
}

function readTimestamps(formKey, storage) {
  try {
    const raw = storage.getItem(storageKey(formKey));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((value) => Number.isFinite(value)) : [];
  } catch {
    return [];
  }
}

function defaultStorage() {
  return typeof localStorage !== "undefined" ? localStorage : { getItem: () => null, setItem: () => {} };
}

// A filled honeypot field means an automated submitter — humans never see it.
export function isHoneypotTripped(value) {
  return !!String(value || "").trim();
}

export function checkSubmitAllowed(formKey, { cooldownMs = DEFAULT_COOLDOWN_MS, maxPerHour = DEFAULT_MAX_PER_HOUR, now = Date.now(), storage = defaultStorage() } = {}) {
  const recent = readTimestamps(formKey, storage).filter((value) => now - value < HOUR_MS);
  const last = recent[recent.length - 1];
  if (last != null && now - last < cooldownMs) {
    const waitSeconds = Math.ceil((cooldownMs - (now - last)) / 1000);
    return { allowed: false, reason: "cooldown", message: `Please wait ${waitSeconds}s before submitting again.` };
  }
  if (recent.length >= maxPerHour) {
    return { allowed: false, reason: "hourly_limit", message: "Too many submissions. Please try again later or contact support." };
  }
  return { allowed: true };
}

export function recordSubmit(formKey, { now = Date.now(), storage = defaultStorage() } = {}) {
  const recent = readTimestamps(formKey, storage).filter((value) => now - value < HOUR_MS);
  recent.push(now);
  try {
    storage.setItem(storageKey(formKey), JSON.stringify(recent.slice(-20)));
  } catch {
    // Storage full/blocked — fail open; this guard is best-effort.
  }
}

// Props for an invisible honeypot input. Spread onto an <input> rendered
// off-screen; bots fill it, humans (and browser autofill) never touch it.
// The name is deliberately unusual so autofill heuristics skip it.
export const HONEYPOT_FIELD_NAME = "confirm_url_field";
export function honeypotInputProps() {
  return {
    name: HONEYPOT_FIELD_NAME,
    type: "text",
    tabIndex: -1,
    autoComplete: "off",
    "aria-hidden": "true",
    style: { position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0, pointerEvents: "none" },
  };
}
