import { MUSEUM_ROUTE_TEMPLATES, PLATFORM_ROUTES } from "./domain-registry";

export const CANONICAL_ADMIN_ROUTES = [
  { path: "/admin/platform", label: "Platform Admin", pageKey: "platform_admin", domain: "platform" },
  { path: "/admin/platform/pages", label: "Platform Pages", pageKey: "platform_admin", domain: "platform" },
  { path: "/admin/platform/media", label: "Platform Media", pageKey: "platform_admin", domain: "platform" },
  { path: "/admin/platform/analytics", label: "Platform Analytics", pageKey: "platform_analytics", domain: "platform" },
  { path: "/admin/platform/navigation", label: "Platform Navigation", pageKey: "platform_navigation", domain: "platform" },
  { path: "/admin/platform/templates", label: "Platform Templates", pageKey: "platform_templates", domain: "platform" },
  { path: "/admin/platform/seo", label: "Platform SEO", pageKey: "platform_seo", domain: "platform" },
  { path: "/admin/platform/landing-pages", label: "Platform Landing Pages", pageKey: "platform_landing_pages", domain: "platform" },
  { path: "/admin/platform/featured-museums", label: "Platform Featured Museums", pageKey: "platform_featured_museums", domain: "platform" },
  { path: "/admin/platform/settings", label: "Platform Settings", pageKey: "platform_settings", domain: "platform" },
  { path: "/admin/master", label: "Master Admin", pageKey: "platform_admin", domain: "master" },
  { path: "/admin/master/tenants", label: "Master Tenants", pageKey: "tenant_registry", domain: "master" },
  { path: "/admin/master/users", label: "Master Users", pageKey: "platform_admin", domain: "master" },
  { path: "/admin/master/system", label: "Master System", pageKey: "platform_system", domain: "master" },
  { path: "/admin/master/permissions", label: "Master Permissions", pageKey: "platform_admin", domain: "master" },
  { path: "/admin/master/billing", label: "Master Billing", pageKey: "tenant_registry", domain: "master" },
  { path: "/admin/master/analytics", label: "Master Analytics", pageKey: "platform_analytics", domain: "master" },
  { path: "/admin/master/infrastructure", label: "Master Infrastructure", pageKey: "platform_infrastructure", domain: "master" },
  { path: "/admin/master/modules", label: "Master Modules", pageKey: "platform_admin", domain: "master" },
  { path: "/admin/master/moderation", label: "Master Moderation", pageKey: "platform_admin", domain: "master" },
  { path: "/admin/master/media", label: "Master Media Registry", pageKey: "platform_admin", domain: "master" },
  { path: "/admin/master/ai", label: "Master AI Settings", pageKey: "platform_admin", domain: "master" },
  { path: "/admin/master/feature-flags", label: "Master Feature Flags", pageKey: "platform_admin", domain: "master" },
  { path: "/admin/master/templates", label: "Master Templates", pageKey: "platform_templates", domain: "master" },
  { path: "/admin/master/logs", label: "Master System Logs", pageKey: "platform_system", domain: "master" },
  { path: "/admin/tenant/:tenantId", label: "Tenant Admin", pageKey: "museum_home", domain: "museum" },
  { path: "/admin/tenant/:tenantId/setup", label: "Museum Setup Admin", pageKey: "museum_setup", domain: "museum" },
  { path: "/admin/tenant/:tenantId/onboarding", label: "Tenant Onboarding Admin", pageKey: "onboarding", domain: "museum" },
  { path: "/admin/tenant/:tenantId/home", label: "Tenant Home Admin", pageKey: "museum_home", domain: "museum" },
  { path: "/admin/tenant/:tenantId/tickets", label: "Tenant Tickets Admin", pageKey: "tickets", domain: "museum" },
  { path: "/admin/tenant/:tenantId/entrance", label: "Tenant Entrance Admin", pageKey: "entrance", domain: "museum" },
  { path: "/admin/tenant/:tenantId/exhibits", label: "Tenant Exhibits Admin", pageKey: "exhibits", domain: "museum" },
  { path: "/admin/tenant/:tenantId/stages", label: "Tenant Stages Admin", pageKey: "stages", domain: "museum" },
  { path: "/admin/tenant/:tenantId/experience", label: "Tenant Experience Admin", pageKey: "experience", domain: "museum" },
  { path: "/admin/tenant/:tenantId/rooms", label: "Tenant Rooms Admin", pageKey: "rooms", domain: "museum" },
  { path: "/admin/tenant/:tenantId/ai-guide", label: "Tenant AI Guide Admin", pageKey: "ai_guide", domain: "museum" },
  { path: "/admin/tenant/:tenantId/vendors", label: "Tenant Vendors Admin", pageKey: "vendors", domain: "museum" },
  { path: "/admin/tenant/:tenantId/commerce", label: "Tenant Commerce Admin", pageKey: "commerce", domain: "museum" },
  { path: "/admin/tenant/:tenantId/gamification", label: "Tenant Gamification Admin", pageKey: "gamification", domain: "museum" },
  { path: "/admin/tenant/:tenantId/vr", label: "Tenant VR Admin", pageKey: "vr", domain: "museum" },
  { path: "/admin/tenant/:tenantId/media", label: "Tenant Media Admin", pageKey: "media", domain: "museum" },
  { path: "/admin/tenant/:tenantId/analytics", label: "Tenant Analytics Admin", pageKey: "museum_analytics", domain: "museum" },
  { path: "/admin/tenant/:tenantId/staff", label: "Tenant Staff Admin", pageKey: "staff", domain: "museum" },
  { path: "/admin/tenant/:tenantId/settings", label: "Tenant Settings Admin", pageKey: "settings", domain: "museum" },
];

export const PLATFORM_ADMIN_ROUTES = [
  { path: "/platform/admin/users-access", label: "Users & Access", pageKey: "platform_admin" },
  { path: "/platform/admin/experience-layer", label: "Experience Layer", pageKey: "platform_admin" },
  { path: "/platform/admin/modules", label: "Modules Overview", pageKey: "platform_admin" },
  { path: "/platform/admin/modules/onboarding", label: "Onboarding Module", pageKey: "platform_admin" },
  { path: "/platform/admin/modules/ticketing", label: "Ticketing Module", pageKey: "platform_admin" },
  { path: "/platform/admin/modules/ai-guide", label: "AI Guide Module", pageKey: "platform_admin" },
  { path: "/platform/admin/modules/walkthrough", label: "Walkthrough Module", pageKey: "platform_admin" },
  { path: "/platform/admin/modules/vendors", label: "Vendors Module", pageKey: "platform_admin" },
  { path: "/platform/admin/modules/commerce", label: "Commerce Module", pageKey: "platform_admin" },
  { path: "/platform/admin/modules/analytics", label: "Analytics Module", pageKey: "platform_analytics" },
  { path: "/platform/admin/modules/gamification", label: "Gamification Module", pageKey: "platform_admin" },
  { path: "/platform/admin/platform-services", label: "Platform Services", pageKey: "platform_services" },
  { path: "/platform/admin/services/:serviceKey", label: "Platform Service Detail", pageKey: "platform_services" },
  { path: "/platform/admin/content-data", label: "Content Data", pageKey: "platform_admin" },
  { path: "/platform/admin/content/:contentKey", label: "Content Detail", pageKey: "platform_admin" },
  { path: "/platform/admin/infrastructure", label: "Infrastructure", pageKey: "platform_infrastructure" },
  { path: "/platform/admin/qa-sentinel", label: "Live QA Sentinel", pageKey: "platform_system" },
  { path: "/platform/admin/testers-feedback", label: "Testers Feedback", pageKey: "platform_system" },
  { path: "/platform/admin/public-content", label: "Public Content", pageKey: "platform_admin" },
  { path: "/platform/admin/media", label: "Platform Media Alias", pageKey: "platform_admin" },
  { path: "/platform/admin/home", label: "Platform Home Admin", pageKey: "platform_home" },
  { path: "/platform/admin/music", label: "Music", pageKey: "platform_admin" },
  { path: "/platform/admin/pages", label: "Platform Pages", pageKey: "platform_admin" },
  { path: "/platform/admin/tenants", label: "Tenant Registry", pageKey: "tenant_registry" },
  { path: "/platform/admin/white-label", label: "White Label", pageKey: "platform_white_label" },
  { path: "/platform/admin/architecture-blueprint", label: "Architecture Blueprint", pageKey: "architecture_blueprint" },
];

const rawRouteRegistry = [
  { path: "/", label: "Platform Home", purpose: "SCAVerse public platform gateway", group: "Platform", domain: "platform", critical: true },
  ...PLATFORM_ROUTES.map((route) => ({ ...route, purpose: "Platform-owned system route", group: "Platform", domain: route.domain || "platform", critical: true })),
  ...PLATFORM_ADMIN_ROUTES.map((route) => ({ ...route, purpose: "Routed platform admin page", group: "Platform Admin", domain: "master", critical: true })),
  ...CANONICAL_ADMIN_ROUTES.map((route) => ({ ...route, purpose: "Canonical architecture admin alias", group: route.domain === "master" ? "Master Admin" : route.domain === "platform" ? "Platform Admin" : "Tenant Admin", critical: true })),
  ...MUSEUM_ROUTE_TEMPLATES.map((route) => ({ ...route, purpose: "Tenant-owned museum route", group: "Museum", domain: "museum", critical: true })),
  { path: "/home", label: "Legacy Home Redirect", purpose: "Redirects to museum home", group: "Legacy Redirects", domain: "system", critical: false },
  { path: "/onboarding", label: "Legacy Onboarding Redirect", purpose: "Redirects to museum onboarding", group: "Legacy Redirects", domain: "system", critical: false },
  { path: "/walkthrough", label: "Legacy Walkthrough Redirect", purpose: "Redirects to museum walkthrough", group: "Legacy Redirects", domain: "system", critical: false },
  { path: "/guide", label: "Legacy Guide Redirect", purpose: "Redirects to museum AI guide", group: "Legacy Redirects", domain: "system", critical: false },
  { path: "/tickets", label: "Legacy Tickets Redirect", purpose: "Redirects to museum tickets", group: "Legacy Redirects", domain: "system", critical: false },
  { path: "/vendors", label: "Legacy Vendors Redirect", purpose: "Redirects to museum vendors", group: "Legacy Redirects", domain: "system", critical: false },
  { path: "/commerce", label: "Legacy Commerce Redirect", purpose: "Redirects to museum commerce", group: "Legacy Redirects", domain: "system", critical: false },
  { path: "/analytics", label: "Legacy Platform Analytics Redirect", purpose: "Redirects to platform analytics", group: "Legacy Redirects", domain: "system", critical: false },
  { path: "/white-label", label: "Legacy White Label Redirect", purpose: "Redirects to platform white-label", group: "Legacy Redirects", domain: "system", critical: false },
  { path: "/documentation-notes", label: "Legacy Documentation Redirect", purpose: "Redirects to platform docs", group: "Legacy Redirects", domain: "system", critical: false },
];

export const routeRegistry = rawRouteRegistry.filter((route, index, routes) => {
  const key = `${route.domain || "global"}:${route.pageKey || route.label || "route"}:${route.path}`;
  return routes.findIndex((item) => `${item.domain || "global"}:${item.pageKey || item.label || "route"}:${item.path}` === key) === index;
});

export function createRouteRenderKey(route = {}, index = 0) {
  return `${route.domain || "global"}:${route.pageKey || route.label || "route"}:${route.path || "unknown"}:${index}`;
}

export const routeStableKey = createRouteRenderKey;

export const routeGroups = routeRegistry.reduce((groups, route) => {
  groups[route.group] = [...(groups[route.group] || []), route];
  return groups;
}, {});