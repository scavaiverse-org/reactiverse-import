const BLOCKED_MEDIA_HOSTS = [
  "cdn.scaverse.demo",
  "scaverse.demo",
];

export function cleanMediaUrl(url = "") {
  return String(url || "").trim();
}

export function isBlockedDemoMediaUrl(url = "") {
  const value = cleanMediaUrl(url).toLowerCase();
  return BLOCKED_MEDIA_HOSTS.some((host) => value.includes(host));
}

export function isValidMediaUrl(url = "") {
  const value = cleanMediaUrl(url);
  if (!value || isBlockedDemoMediaUrl(value)) return false;
  if (/^(data:|blob:|\/)/i.test(value)) return true;
  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value);
      return !!parsed.hostname && !parsed.hostname.endsWith(".demo");
    } catch {
      return false;
    }
  }
  return false;
}

export function getSafeMediaUrl(url = "") {
  const value = cleanMediaUrl(url);
  return isValidMediaUrl(value) ? value : "";
}

export function getSafeNavigationUrl(url = "") {
  const value = cleanMediaUrl(url);
  if (!value || isBlockedDemoMediaUrl(value)) return "";
  if (value.startsWith("/") || /^[a-z0-9_-]+$/i.test(value)) return value;
  return isValidMediaUrl(value) ? value : "";
}