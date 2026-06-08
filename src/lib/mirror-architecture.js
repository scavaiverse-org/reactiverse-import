import { DEFAULT_MUSEUM_SLUG, museumPath } from "./domain-registry";

export const MIRROR_PAGE_TYPES = {
  MUSEUM: "museum",
  PLATFORM: "platform",
};

export const MIRRORED_MUSEUM_PAGES = [
  { pageKey: "museum_home", label: "Home", publicPath: (tenantSlug = DEFAULT_MUSEUM_SLUG) => museumPath(tenantSlug, "home"), adminPath: (tenantSlug = DEFAULT_MUSEUM_SLUG) => `/museum/${tenantSlug}/admin/home`, entityName: "MuseumPageConfig" },
  { pageKey: "museum_setup", label: "Museum Setup", publicPath: (tenantSlug = DEFAULT_MUSEUM_SLUG) => museumPath(tenantSlug, "home"), adminPath: (tenantSlug = DEFAULT_MUSEUM_SLUG) => `/museum/${tenantSlug}/admin`, entityName: "MuseumTenant" },
  { pageKey: "onboarding", label: "Onboarding", publicPath: (tenantSlug = DEFAULT_MUSEUM_SLUG) => museumPath(tenantSlug, "onboarding"), adminPath: (tenantSlug = DEFAULT_MUSEUM_SLUG) => `/museum/${tenantSlug}/admin/home`, entityName: "MuseumPageConfig" },
  { pageKey: "tickets", label: "Tickets", publicPath: (tenantSlug = DEFAULT_MUSEUM_SLUG) => museumPath(tenantSlug, "tickets"), adminPath: (tenantSlug = DEFAULT_MUSEUM_SLUG) => `/museum/${tenantSlug}/admin/tickets`, entityName: "MuseumPageConfig" },
  { pageKey: "vendors", label: "Vendors", publicPath: (tenantSlug = DEFAULT_MUSEUM_SLUG) => museumPath(tenantSlug, "vendors"), adminPath: (tenantSlug = DEFAULT_MUSEUM_SLUG) => `/museum/${tenantSlug}/admin/vendors`, entityName: "MuseumPageConfig" },
  { pageKey: "exhibits", label: "Exhibits", publicPath: (tenantSlug = DEFAULT_MUSEUM_SLUG) => museumPath(tenantSlug, "exhibits"), adminPath: (tenantSlug = DEFAULT_MUSEUM_SLUG) => `/museum/${tenantSlug}/admin/exhibits`, entityName: "MuseumPageConfig" },
  { pageKey: "entrance", label: "Entrance", publicPath: (tenantSlug = DEFAULT_MUSEUM_SLUG) => museumPath(tenantSlug, "entrance"), adminPath: (tenantSlug = DEFAULT_MUSEUM_SLUG) => `/museum/${tenantSlug}/admin/walkthrough`, entityName: "ExperienceConfig" },
  { pageKey: "stages", label: "Stages", publicPath: (tenantSlug = DEFAULT_MUSEUM_SLUG) => museumPath(tenantSlug, "stages"), adminPath: (tenantSlug = DEFAULT_MUSEUM_SLUG) => `/museum/${tenantSlug}/admin/walkthrough`, entityName: "ExperienceConfig" },
  { pageKey: "experience", label: "Experience", publicPath: (tenantSlug = DEFAULT_MUSEUM_SLUG) => museumPath(tenantSlug, "experience"), adminPath: (tenantSlug = DEFAULT_MUSEUM_SLUG) => `/museum/${tenantSlug}/admin/walkthrough`, entityName: "ExperienceConfig" },
  { pageKey: "rooms", label: "Rooms", publicPath: (tenantSlug = DEFAULT_MUSEUM_SLUG) => museumPath(tenantSlug, "rooms"), adminPath: (tenantSlug = DEFAULT_MUSEUM_SLUG) => `/museum/${tenantSlug}/admin/walkthrough`, entityName: "ExperienceConfig" },
  { pageKey: "walkthrough", label: "Walkthrough", publicPath: (tenantSlug = DEFAULT_MUSEUM_SLUG) => museumPath(tenantSlug, "walkthrough"), adminPath: (tenantSlug = DEFAULT_MUSEUM_SLUG) => `/museum/${tenantSlug}/admin/walkthrough`, entityName: "MuseumPageConfig" },
  { pageKey: "ai_guide", label: "AI Guide", publicPath: (tenantSlug = DEFAULT_MUSEUM_SLUG) => museumPath(tenantSlug, "guide"), adminPath: (tenantSlug = DEFAULT_MUSEUM_SLUG) => `/platform/admin/modules/ai-guide`, entityName: "MuseumPageConfig" },
  { pageKey: "commerce", label: "Commerce", publicPath: (tenantSlug = DEFAULT_MUSEUM_SLUG) => museumPath(tenantSlug, "commerce"), adminPath: (tenantSlug = DEFAULT_MUSEUM_SLUG) => `/platform/admin/modules/commerce`, entityName: "MuseumPageConfig" },
  { pageKey: "gamification", label: "Gamification", publicPath: (tenantSlug = DEFAULT_MUSEUM_SLUG) => museumPath(tenantSlug, "walkthrough"), adminPath: (tenantSlug = DEFAULT_MUSEUM_SLUG) => `/platform/admin/modules/gamification`, entityName: "ExperienceConfig" },
  { pageKey: "vr", label: "VR", publicPath: (tenantSlug = DEFAULT_MUSEUM_SLUG) => museumPath(tenantSlug, "room-preview"), adminPath: (tenantSlug = DEFAULT_MUSEUM_SLUG) => `/museum/${tenantSlug}/admin/walkthrough`, entityName: "ExperienceConfig" },
  { pageKey: "media", label: "Media", publicPath: (tenantSlug = DEFAULT_MUSEUM_SLUG) => museumPath(tenantSlug, "home"), adminPath: (tenantSlug = DEFAULT_MUSEUM_SLUG) => `/museum/${tenantSlug}/admin/home`, entityName: "TenantMedia" },
  { pageKey: "staff", label: "Staff", publicPath: (tenantSlug = DEFAULT_MUSEUM_SLUG) => museumPath(tenantSlug, "home"), adminPath: (tenantSlug = DEFAULT_MUSEUM_SLUG) => `/museum/${tenantSlug}/admin`, entityName: "User" },
  { pageKey: "settings", label: "Settings", publicPath: (tenantSlug = DEFAULT_MUSEUM_SLUG) => museumPath(tenantSlug, "home"), adminPath: (tenantSlug = DEFAULT_MUSEUM_SLUG) => `/museum/${tenantSlug}/admin`, entityName: "MuseumTenant" },
  { pageKey: "completion", label: "Completion", publicPath: (tenantSlug = DEFAULT_MUSEUM_SLUG) => museumPath(tenantSlug, "completion"), adminPath: (tenantSlug = DEFAULT_MUSEUM_SLUG) => `/museum/${tenantSlug}/admin/walkthrough`, entityName: "ExperienceConfig" },
];

export const MIRRORED_PLATFORM_PAGES = [
  { pageKey: "platform_home", label: "Home", publicPath: () => "/", adminPath: () => "/platform/admin/home", entityName: "PlatformPageConfig" },
  { pageKey: "platform_about", label: "About", publicPath: () => "/about", adminPath: () => "/platform/admin/pages", entityName: "PlatformPageConfig" },
  { pageKey: "platform_pricing", label: "Pricing", publicPath: () => "/pricing", adminPath: () => "/platform/admin/pages", entityName: "PlatformPageConfig" },
  { pageKey: "platform_marketplace", label: "Marketplace", publicPath: () => "/marketplace", adminPath: () => "/platform/admin/pages", entityName: "PlatformPageConfig" },
  { pageKey: "platform_contact", label: "Contact", publicPath: () => "/contact", adminPath: () => "/platform/admin/pages", entityName: "PlatformPageConfig" },
  { pageKey: "platform_showcase", label: "Showcase", publicPath: () => "/showcase", adminPath: () => "/platform/admin/pages", entityName: "PlatformPageConfig" },
  { pageKey: "platform_overview", label: "Platform Overview", publicPath: () => "/platform/overview", adminPath: () => "/platform/admin/pages", entityName: "PlatformPageConfig" },
  { pageKey: "platform_analytics", label: "Analytics", publicPath: () => "/platform/analytics", adminPath: () => "/platform/admin/modules/analytics", entityName: "PlatformPageConfig" },
  { pageKey: "platform_white_label", label: "White Label", publicPath: () => "/platform/white-label", adminPath: () => "/platform/admin/white-label", entityName: "PlatformPageConfig" },
  { pageKey: "platform_infrastructure", label: "Infrastructure", publicPath: () => "/platform/infrastructure", adminPath: () => "/platform/admin/infrastructure", entityName: "PlatformPageConfig" },
  { pageKey: "platform_services", label: "Services", publicPath: () => "/platform/services", adminPath: () => "/platform/admin/platform-services", entityName: "PlatformPageConfig" },
  { pageKey: "platform_docs", label: "Docs", publicPath: () => "/platform/docs", adminPath: () => "/platform/admin/public-content", entityName: "PlatformPageConfig" },
  { pageKey: "platform_system", label: "System", publicPath: () => "/platform/system", adminPath: () => "/platform/admin/architecture-blueprint", entityName: "PlatformPageConfig" },
  { pageKey: "platform_navigation", label: "Navigation", publicPath: () => "/", adminPath: () => "/platform/admin/pages", entityName: "PlatformPageConfig" },
  { pageKey: "platform_templates", label: "Templates", publicPath: () => "/showcase", adminPath: () => "/platform/admin/public-content", entityName: "PlatformPageConfig" },
  { pageKey: "platform_seo", label: "SEO", publicPath: () => "/", adminPath: () => "/platform/admin/pages", entityName: "PlatformPageConfig" },
  { pageKey: "platform_landing_pages", label: "Landing Pages", publicPath: () => "/", adminPath: () => "/platform/admin/pages", entityName: "PlatformPageConfig" },
  { pageKey: "platform_featured_museums", label: "Featured Museums", publicPath: () => "/showcase", adminPath: () => "/platform/admin/tenants", entityName: "MuseumTenant" },
  { pageKey: "platform_settings", label: "Settings", publicPath: () => "/", adminPath: () => "/platform/admin/infrastructure", entityName: "PlatformPageConfig" },
];

export function getMirrorPage(pageKey, type = MIRROR_PAGE_TYPES.MUSEUM) {
  const source = type === MIRROR_PAGE_TYPES.PLATFORM ? MIRRORED_PLATFORM_PAGES : MIRRORED_MUSEUM_PAGES;
  return source.find((page) => page.pageKey === pageKey) || null;
}

export function getMissingMirrors(publicRoutes = [], mirrorPages = [...MIRRORED_MUSEUM_PAGES, ...MIRRORED_PLATFORM_PAGES]) {
  return mirrorPages.filter((page) => !publicRoutes.some((route) => route.pageKey === page.pageKey));
}