import { DEFAULT_MUSEUM_SLUG, MUSEUM_PAGE_KEYS, museumPath } from "./domain-registry";

export { MUSEUM_PAGE_KEYS };

export const MUSEUM_PAGES = [
  { pageKey: "museum_home", pageName: "Museum Home", routePage: "home" },
  { pageKey: "museum_setup", pageName: "Museum Setup", routePage: "home" },
  { pageKey: "onboarding", pageName: "Onboarding", routePage: "onboarding" },
  { pageKey: "walkthrough", pageName: "Walkthrough", routePage: "walkthrough" },
  { pageKey: "ai_guide", pageName: "Ask About Tickets", routePage: "guide" },
  { pageKey: "tickets", pageName: "Purchase Tickets", routePage: "tickets" },
  { pageKey: "vendors", pageName: "Vendor Marketplace Info", routePage: "vendors" },
  { pageKey: "commerce", pageName: "Museum Shop Add-ons", routePage: "commerce" },
  { pageKey: "entrance", pageName: "Entrance", routePage: "room-preview" },
  { pageKey: "exhibits", pageName: "Exhibits", routePage: "museum" },
  { pageKey: "stages", pageName: "Stages", routePage: "walkthrough" },
  { pageKey: "experience", pageName: "Experience", routePage: "walkthrough" },
  { pageKey: "rooms", pageName: "Rooms", routePage: "room-preview" },
  { pageKey: "gamification", pageName: "Gamification", routePage: "walkthrough" },
  { pageKey: "vr", pageName: "VR Experience", routePage: "room-preview" },
  { pageKey: "media", pageName: "Media", routePage: "home" },
  { pageKey: "staff", pageName: "Staff", routePage: "home" },
  { pageKey: "settings", pageName: "Settings", routePage: "home" },
  { pageKey: "completion", pageName: "Completion", routePage: "home" },
];

export const MUSEUM_PAGE_BY_KEY = MUSEUM_PAGES.reduce((map, page) => ({ ...map, [page.pageKey]: page }), {});

export function createDefaultMuseumPageConfig(pageKey, tenant) {
  const page = MUSEUM_PAGE_BY_KEY[pageKey] || MUSEUM_PAGES[0];
  const tenantSlug = tenant?.slug || DEFAULT_MUSEUM_SLUG;
  const tenantId = tenant?.id || "";
  return {
    tenantId,
    museumId: tenantId,
    tenantSlug,
    pageKey: page.pageKey,
    pageName: page.pageName,
    ownershipScope: "museum",
    publishState: "draft",
    publishedVersion: 0,
    draftVersion: 1,
    sections: [
      {
        sectionKey: "hero",
        sectionName: `${page.pageName} Hero`,
        eyebrow: tenant?.name || "Museum",
        title: page.pageName,
        subtitle: "Tenant-owned museum experience page.",
        description: "Edit this from the Museum Admin mirror for this tenant only.",
        visibility: true,
        sortOrder: 1,
      },
    ],
    cards: [],
    mediaSlots: [
      {
        slotKey: `${page.pageKey}.hero.background`,
        ownershipScope: "museum",
        tenantId,
        museumId: tenantId,
        pageKey: page.pageKey,
        sectionKey: "hero",
        componentKey: `${page.pageKey}.hero`,
        mediaId: "",
        renderType: "background",
        allowVideo: true,
      },
    ],
    ctaSlots: [
      { ctaKey: "primary", label: "Open Page", route: museumPath(tenantSlug, page.routePage), actionType: "route", visibility: true, sortOrder: 1 },
      { ctaKey: "secondary", label: "Museum Home", route: museumPath(tenantSlug, "home"), actionType: "route", visibility: true, sortOrder: 2 },
    ],
    architecturePresets: [],
    seo: { title: page.pageName, description: `${tenant?.name || "Museum"} ${page.pageName}` },
    accessibility: { reducedMotionFallback: true, altText: `${page.pageName} museum media` },
    verificationReport: { status: "MANUAL_QA_REQUIRED", checks: [] },
    lastEditedAt: new Date().toISOString(),
  };
}