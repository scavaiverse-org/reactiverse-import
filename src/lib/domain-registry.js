export const OWNERSHIP_SCOPES = {
  PLATFORM: "platform",
  MUSEUM: "museum",
};

export const DEFAULT_MUSEUM_SLUG = "asian-operatic-museum";

export const PLATFORM_PAGE_KEYS = [
  "platform_home",
  "become_a_tenant",
  "virtual_experience",
  "platform_overview",
  "platform_analytics",
  "platform_white_label",
  "platform_infrastructure",
  "platform_services",
  "platform_launch",
  "platform_docs",
  "platform_system",
  "platform_admin",
  "tenant_registry",
  "architecture_blueprint",
  "platform_about",
  "platform_pricing",
  "platform_contact",
  "platform_marketplace",
  "platform_showcase",
  "platform_navigation",
  "platform_templates",
  "platform_seo",
  "platform_landing_pages",
  "platform_featured_museums",
  "platform_settings",
];

export const MUSEUM_PAGE_KEYS = [
  "museum_home",
  "museum",
  "room_preview",
  "onboarding",
  "walkthrough",
  "ai_guide",
  "tickets",
  "vendors",
  "commerce",
  "exhibits",
  "stories",
  "collections",
  "museum_analytics",
  "entrance",
  "stages",
  "experience",
  "rooms",
  "completion",
  "museum_setup",
  "gamification",
  "vr",
  "media",
  "staff",
  "settings",
];

export const PLATFORM_ROUTES = [
  { path: "/", label: "Platform Home", pageKey: "platform_home" },
  { path: "/become-a-tenant", label: "Become a Tenant", pageKey: "become_a_tenant" },
  { path: "/virtual-experience", label: "Virtual Experience", pageKey: "virtual_experience" },
  { path: "/tenant-login", label: "Tenant Login", pageKey: "platform_home" },
  { path: "/login", label: "Login", pageKey: "platform_home" },
  { path: "/signup", label: "Signup", pageKey: "become_a_tenant" },
  { path: "/about", label: "About", pageKey: "platform_about" },
  { path: "/pricing", label: "Pricing", pageKey: "platform_pricing" },
  { path: "/services", label: "Services", pageKey: "platform_services" },
  { path: "/marketplace", label: "Marketplace", pageKey: "platform_marketplace" },
  { path: "/docs", label: "Documentation", pageKey: "platform_docs" },
  { path: "/contact", label: "Contact", pageKey: "platform_contact" },
  { path: "/showcase", label: "Showcase", pageKey: "platform_showcase" },
  { path: "/platform", label: "Platform", pageKey: "platform_overview" },
  { path: "/platform/overview", label: "Platform Overview", pageKey: "platform_overview" },
  { path: "/platform/analytics", label: "Analytics Core", pageKey: "platform_analytics" },
  { path: "/platform/white-label", label: "White Label", pageKey: "platform_white_label" },
  { path: "/platform/infrastructure", label: "Infrastructure", pageKey: "platform_infrastructure" },
  { path: "/platform/services", label: "Services", pageKey: "platform_services" },
  { path: "/platform/docs", label: "Documentation", pageKey: "platform_docs" },
  { path: "/platform/system", label: "System", pageKey: "platform_system" },
  { path: "/platform/admin", label: "Platform Admin", pageKey: "platform_admin" },
  { path: "/admin/platform", label: "Canonical Platform Admin", pageKey: "platform_admin" },
  { path: "/admin/platform/pages", label: "Canonical Platform Pages", pageKey: "platform_admin" },
  { path: "/admin/platform/media", label: "Canonical Platform Media", pageKey: "platform_admin" },
  { path: "/admin/platform/analytics", label: "Canonical Platform Analytics", pageKey: "platform_admin" },
  { path: "/admin/master", label: "Canonical Master Admin", pageKey: "platform_admin" },
  { path: "/admin/master/tenants", label: "Canonical Master Tenants", pageKey: "tenant_registry" },
  { path: "/admin/master/users", label: "Canonical Master Users", pageKey: "platform_admin" },
  { path: "/admin/master/system", label: "Canonical Master System", pageKey: "platform_system" },
];

export const MUSEUM_ROUTE_TEMPLATES = [
  { path: "/museum/:tenantSlug", label: "Canonical Museum Home", pageKey: "museum_home" },
  { path: "/museum/:tenantSlug/home", label: "Museum Home", pageKey: "museum_home" },
  { path: "/museum/:tenantSlug/home-2", label: "Museum Home 2", pageKey: "museum_home" },
  { path: "/museum/:tenantSlug/home-3", label: "Museum Home 3", pageKey: "museum_home" },
  { path: "/museum/:tenantSlug/home-4", label: "Museum Home 4", pageKey: "museum_home" },
  { path: "/museum/:tenantSlug/home-5", label: "Museum Home 5", pageKey: "museum_home" },
  { path: "/museum/:tenantSlug/about", label: "About", pageKey: "museum_home" },
  { path: "/museum/:tenantSlug/about-2", label: "About 2", pageKey: "museum_home" },
  { path: "/museum/:tenantSlug/about-3", label: "About 3", pageKey: "museum_home" },
  { path: "/museum/:tenantSlug/about-4", label: "About 4", pageKey: "museum_home" },
  { path: "/museum/:tenantSlug/about-5", label: "About 5", pageKey: "museum_home" },
  { path: "/museum/:tenantSlug/begin-tour", label: "Begin Tour", pageKey: "walkthrough" },
  { path: "/museum/:tenantSlug/begin-tour-2", label: "Begin Tour 2", pageKey: "walkthrough" },
  { path: "/museum/:tenantSlug/begin-tour-3", label: "Begin Tour 3", pageKey: "walkthrough" },
  { path: "/museum/:tenantSlug/begin-tour-4", label: "Begin Tour 4", pageKey: "walkthrough" },
  { path: "/museum/:tenantSlug/begin-tour-5", label: "Begin Tour 5", pageKey: "walkthrough" },
  { path: "/museum/:tenantSlug/museum", label: "Museum", pageKey: "museum" },
  { path: "/museum/:tenantSlug/onboarding", label: "Onboarding", pageKey: "onboarding" },
  { path: "/museum/:tenantSlug/walkthrough", label: "Walkthrough", pageKey: "walkthrough" },
  { path: "/museum/:tenantSlug/guide", label: "Ask About Tickets", pageKey: "ai_guide" },
  { path: "/museum/:tenantSlug/tickets", label: "Ticket Gateway", pageKey: "tickets" },
  { path: "/museum/:tenantSlug/tickets-2", label: "Ticket Comparison", pageKey: "tickets" },
  { path: "/museum/:tenantSlug/tickets-3", label: "Visit Planning", pageKey: "tickets" },
  { path: "/museum/:tenantSlug/tickets-4", label: "Ticket Add-ons", pageKey: "tickets" },
  { path: "/museum/:tenantSlug/tickets-5", label: "Ticket Confirmation", pageKey: "tickets" },
  { path: "/museum/:tenantSlug/vendors", label: "Vendor Marketplace Info", pageKey: "vendors" },
  { path: "/museum/:tenantSlug/vendors/register", label: "Vendor Application", pageKey: "vendors" },
  { path: "/museum/:tenantSlug/commerce", label: "Museum Shop Add-ons", pageKey: "commerce" },
  { path: "/museum/:tenantSlug/entrance", label: "Entrance", pageKey: "entrance" },
  { path: "/museum/:tenantSlug/stages", label: "Stages", pageKey: "stages" },
  { path: "/museum/:tenantSlug/experience", label: "Experience", pageKey: "experience" },
  { path: "/museum/:tenantSlug/rooms", label: "Rooms", pageKey: "rooms" },
  { path: "/museum/:tenantSlug/ai-guide", label: "AI Guide Alias", pageKey: "ai_guide" },
  { path: "/museum/:tenantSlug/completion", label: "Completion", pageKey: "completion" },
  { path: "/museum/:tenantSlug/room-preview", label: "Room Preview", pageKey: "room_preview" },
];

export function museumPath(tenantSlug = DEFAULT_MUSEUM_SLUG, page = "home") {
  return `/museum/${tenantSlug || DEFAULT_MUSEUM_SLUG}/${page}`;
}

export function museumWalkthroughPath(tenantSlug = DEFAULT_MUSEUM_SLUG, walkthroughKey = "walkthrough1", page = "begin-tour") {
  const slug = tenantSlug || DEFAULT_MUSEUM_SLUG;
  if (!walkthroughKey || walkthroughKey === "walkthrough1") return `/museum/${slug}/${page}`;
  return `/museum/${slug}/${page}/${walkthroughKey}`;
}

export function platformPath(page = "overview") {
  return page === "overview" ? "/platform/overview" : `/platform/${page}`;
}

export function isPlatformRoute(pathname = "") {
  return pathname === "/platform" || pathname.startsWith("/platform/");
}

export function isMuseumRoute(pathname = "") {
  return pathname.startsWith("/museum/");
}

export function isPlatformPageKey(pageKey) {
  return PLATFORM_PAGE_KEYS.includes(pageKey);
}

export function isMuseumPageKey(pageKey) {
  return MUSEUM_PAGE_KEYS.includes(pageKey);
}