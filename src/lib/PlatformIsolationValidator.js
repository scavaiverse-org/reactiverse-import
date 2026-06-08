import { isMuseumPageKey, isMuseumRoute, isPlatformPageKey, isPlatformRoute, MUSEUM_PAGE_KEYS, PLATFORM_PAGE_KEYS } from "./domain-registry";

const pass = (name, message) => ({ name, status: "PASS", message });
const fail = (name, message) => ({ name, status: "FAIL", message });

export function validatePlatformIsolation({
  platformConfigs = [],
  museumConfigs = [],
  platformMedia = [],
  museumMedia = [],
  routes = [],
  users = [],
} = {}) {
  const checks = [];

  const platformConfigLeak = platformConfigs.some((config) => config.ownershipScope !== "platform" || isMuseumPageKey(config.pageKey));
  checks.push(platformConfigLeak ? fail("Platform config isolation", "PlatformPageConfig contains museum ownership or museum page keys.") : pass("Platform config isolation", "Platform configs are platform-owned only."));

  const museumConfigLeak = museumConfigs.some((config) => config.ownershipScope !== "museum" || isPlatformPageKey(config.pageKey) || !config.tenantId || !config.museumId || !config.tenantSlug);
  checks.push(museumConfigLeak ? fail("Museum config isolation", "MuseumPageConfig contains platform keys or missing tenant ownership fields.") : pass("Museum config isolation", "Museum configs are tenant-owned and scoped."));

  const platformMediaLeak = platformMedia.some((item) => item.ownershipScope !== "platform" || item.tenantId || item.museumId);
  checks.push(platformMediaLeak ? fail("Platform media isolation", "Platform media contains museum ownership fields or non-platform scope.") : pass("Platform media isolation", "Platform media is global-platform scoped only."));

  const museumMediaLeak = museumMedia.some((item) => !item.tenantId || item.visibilityScope === "platform");
  checks.push(museumMediaLeak ? fail("Museum media isolation", "Museum media is missing tenant ownership or is incorrectly platform-scoped.") : pass("Museum media isolation", "Museum media is tenant-owned and scoped."));

  const mixedRoutes = routes.some((route) => {
    if (route.domain === "platform") return !isPlatformRoute(route.path);
    if (route.domain === "museum") return !isMuseumRoute(route.path);
    return false;
  });
  checks.push(mixedRoutes ? fail("Route isolation", "Routes are not declared under /platform/* or /museum/:tenantSlug/*.") : pass("Route isolation", "Routes are namespace-isolated."));

  const tenantAdminRoles = ["FRANCHISE_OWNER", "FRANCHISE_MANAGER", "FRANCHISE_STAFF", "CONTENT_EDITOR", "MEDIA_MANAGER", "APPROVAL_REVIEWER", "ANALYTICS_VIEWER"];
  const unsafeMuseumUsers = users.some((user) => tenantAdminRoles.includes(user.role) && !user.tenantId && !user.tenant_id && !Array.isArray(user.assignedTenantIds) && !Array.isArray(user.tenantIds));
  checks.push(unsafeMuseumUsers ? fail("Role isolation", "Tenant admin/editor roles must have an explicit tenant assignment.") : pass("Role isolation", "Tenant admin/editor roles require tenant assignment."));

  const missingMuseumKeys = MUSEUM_PAGE_KEYS.filter((key) => !museumConfigs.some((config) => config.pageKey === key));
  checks.push(missingMuseumKeys.length ? fail("Museum page coverage", `Missing MuseumPageConfig coverage: ${missingMuseumKeys.join(", ")}.`) : pass("Museum page coverage", "Museum page config coverage exists."));

  const platformKeysUsed = platformConfigs.map((config) => config.pageKey).filter(Boolean);
  const invalidPlatformKeys = platformKeysUsed.filter((key) => !PLATFORM_PAGE_KEYS.includes(key));
  checks.push(invalidPlatformKeys.length ? fail("Platform key allowlist", `Invalid platform keys: ${invalidPlatformKeys.join(", ")}.`) : pass("Platform key allowlist", "Platform page keys are allowlisted."));

  const failed = checks.filter((check) => check.status === "FAIL");
  return {
    status: failed.length ? "FAIL" : "PASS",
    checks,
    summary: failed.length ? `${failed.length} isolation checks failed.` : "All isolation checks passed.",
  };
}

export function assertRenderOwnership({ domain, config, media }) {
  if (domain === "platform") return config?.ownershipScope === "platform" && (!media || media.ownershipScope === "platform");
  if (domain === "museum") {
    if (config?.ownershipScope !== "museum") return false;
    if (!media) return true;
    return media.ownershipScope === "museum" && config?.tenantId === media.tenantId;
  }
  return false;
}