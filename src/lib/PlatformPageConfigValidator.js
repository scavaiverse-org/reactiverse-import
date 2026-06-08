import { PLATFORM_PAGE_KEYS } from "./platform-page-registry";

const VALID_PLATFORM_ROUTES = ["/", "/login", "/become-a-tenant", "/virtual-experience", "/platform", "/platform/overview", "/platform/system", "/platform/admin", "/platform/analytics", "/platform/white-label", "/platform/infrastructure", "/platform/services", "/platform/launch", "/platform/tenants", "/platform/docs", "/museum/asian-operatic-museum/tickets", "/museum/asian-operatic-museum/walkthrough"];

export function validatePlatformPageConfig(config, mediaById = {}, categoryCount = 1) {
  const checks = [];
  const add = (name, pass, message) => checks.push({ name, status: pass ? "PASS" : "FAIL", message });

  add("Page key", PLATFORM_PAGE_KEYS.includes(config?.pageKey), "Config must use a canonical page key.");
  add("Platform ownership", config?.ownershipScope === "platform", "PlatformPageConfig must be platform-owned only.");
  add("Sections", Array.isArray(config?.sections) && config.sections.length > 0, "At least one section is required.");
  add("CTA routes", (config?.ctaSlots || []).every((cta) => !cta.visibility || !cta.route || VALID_PLATFORM_ROUTES.includes(cta.route) || cta.actionType === "external_link"), "Visible platform CTAs must use approved platform routes.");
  add("Gateway badge routes", (config?.cards || []).every((card) => !card.visibility || !card.route || VALID_PLATFORM_ROUTES.includes(card.route)), "Visible homepage gateway badges must use approved routes.");
  add("Media IDs", (config?.mediaSlots || []).every((slot) => !slot.mediaId || mediaById[slot.mediaId]), "Assigned media IDs must resolve in PlatformMediaRegistry.");
  add("Media ownership", (config?.mediaSlots || []).every((slot) => !slot.mediaId || mediaById[slot.mediaId]?.ownershipScope === "platform"), "Assigned media must be platform-owned.");
  add("Media active", (config?.mediaSlots || []).every((slot) => !slot.mediaId || ((mediaById[slot.mediaId]?.publishState === "published" || mediaById[slot.mediaId]?.status === "active") && mediaById[slot.mediaId]?.isActive !== false)), "Assigned media must be published and active.");

  const failed = checks.filter((check) => check.status === "FAIL");
  return {
    status: failed.length ? "FAIL" : "PASS",
    publishBlocked: failed.length > 0,
    checks,
    summary: failed.length ? `${failed.length} validation checks failed.` : "All validation checks passed.",
  };
}

export function resolvePlatformHero(config, mediaById = {}) {
  const section = (config?.sections || []).find((item) => item.sectionKey === "hero") || config?.sections?.[0] || {};
  const slot = (config?.mediaSlots || []).find((item) => item.sectionKey === "hero") || {};
  const media = mediaById[slot.mediaId || section.backgroundMediaId] || null;
  const mobileMedia = mediaById[slot.mobileMediaId || section.mobileMediaId] || media;
  const ctas = (config?.ctaSlots || []).filter((cta) => cta.visibility !== false).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  return { section, slot, media, mobileMedia, ctas };
}