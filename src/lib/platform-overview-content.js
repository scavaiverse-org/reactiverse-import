export const overviewHeroStats = [
  { value: "Live", label: "museum directory" },
  { value: "1", label: "visitor entry point" },
  { value: "24/7", label: "virtual access" },
];

export const overviewActionCards = [
  {
    key: "view_available_museums",
    group: "action",
    title: "View Available Museums",
    body: "Browse live tenant museums before entering a museum-specific visitor experience.",
    cta: "View Available Museums",
    route: "/virtual-experience",
    icon: "Building2",
    visibility: true,
    sortOrder: 1,
  },
];

export const overviewBenefitCards = [
  { key: "consumer_entry", group: "benefit", title: "Consumer-first entry", body: "Visitors start with the platform overview, then choose from available live museums.", visibility: true, sortOrder: 1 },
  { key: "tenant_choice", group: "benefit", title: "Tenant-owned museums", body: "Each museum keeps its own public homepage, tickets, about page, and tour entry.", visibility: true, sortOrder: 2 },
  { key: "simple_navigation", group: "benefit", title: "Simple navigation", body: "The public flow is intentionally focused so visitors do not enter admin or module-only routes by mistake.", visibility: true, sortOrder: 3 },
];

export const overviewCapabilityCards = [
  { key: "museum_directory", group: "capability", title: "Museum directory", body: "Live museums are shown in one visitor-facing listing.", icon: "Building2", visibility: true, sortOrder: 1 },
  { key: "tenant_homepages", group: "capability", title: "Museum homepages", body: "Each museum opens to its own canonical public homepage.", icon: "Sparkles", visibility: true, sortOrder: 2 },
  { key: "visitor_paths", group: "capability", title: "Visitor paths", body: "Tenant pages focus on tickets, about information, and beginning a tour.", icon: "CreditCard", visibility: true, sortOrder: 3 },
];

export const overviewCtaSlots = [
  {
    ctaKey: "primary",
    label: "View Available Museums",
    route: "/virtual-experience",
    actionType: "route",
    target: "/virtual-experience",
    visibility: true,
    sortOrder: 1,
    trackingEvent: "overview_view_available_museums_cta",
  },
];

export const platformOverviewSections = [
  {
    sectionKey: "hero",
    sectionName: "Platform Overview Hero",
    eyebrow: "Consumer platform",
    title: "Choose a live museum to begin your virtual visit.",
    subtitle: "SCAVerse gives visitors one simple path into available tenant museums.",
    description: "Start at the museum directory, then enter the selected museum homepage.",
    overlayOpacity: 0.62,
    overlayColor: "6, 12, 24",
    overlayBlur: 0,
    textColorMode: "light",
    visibility: true,
    sortOrder: 1,
  },
  {
    sectionKey: "actions",
    sectionName: "Museum Directory CTA",
    eyebrow: "Available museums",
    title: "Continue to the live museum directory.",
    description: "The directory is the only public bridge from the platform into tenant museum homepages.",
    visibility: true,
    sortOrder: 2,
  },
];

export function createMassMarketPlatformOverviewConfig() {
  return {
    pageKey: "platform_overview",
    pageName: "Platform Overview",
    ownershipScope: "platform",
    status: "draft",
    publishedVersion: 0,
    draftVersion: 1,
    sections: platformOverviewSections,
    cards: [...overviewActionCards, ...overviewBenefitCards, ...overviewCapabilityCards],
    mediaSlots: [
      {
        slotKey: "platform_overview.hero.background",
        pageKey: "platform_overview",
        ownershipScope: "platform",
        sectionKey: "hero",
        componentKey: "platform_overview.hero",
        adminLabel: "Platform Overview Hero Background",
        mediaId: "",
        allowVideo: true,
        playVideoOnMobile: true,
        reducedMotionFallback: true,
        overlayOpacity: 0.62,
        overlayColor: "6, 12, 24",
        blur: 0,
        brightness: 0.85,
        focusX: 50,
        focusY: 50,
      },
    ],
    ctaSlots: overviewCtaSlots,
    seo: { title: "Platform Overview | SCAVerse", description: "View available virtual museums and enter a tenant museum homepage." },
    accessibility: { reducedMotionFallback: true, altText: "SCAVerse consumer platform overview" },
    verificationReport: { status: "MANUAL_QA_REQUIRED", checks: [] },
    lastEditedAt: new Date().toISOString(),
  };
}

const visibleSorted = (items = []) => items.filter((item) => item.visibility !== false).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
const mergeCards = (defaults, cards = []) => defaults.map((fallback) => {
  const override = (cards || []).find((card) => card.key === fallback.key) || {};
  return { ...fallback, visibility: override.visibility ?? fallback.visibility };
});
const mergeCtas = () => overviewCtaSlots;

export function resolvePlatformOverviewContent(config = {}) {
  const sections = config.sections || [];
  const section = (key) => sections.find((item) => item.sectionKey === key) || platformOverviewSections.find((item) => item.sectionKey === key) || {};
  return {
    hero: section("hero"),
    actionsSection: section("actions"),
    capabilitiesSection: section("capabilities"),
    launchBriefSection: section("launch_brief"),
    actions: visibleSorted(mergeCards(overviewActionCards, config.cards || [])),
    benefits: visibleSorted(mergeCards(overviewBenefitCards, config.cards || [])),
    capabilities: visibleSorted(mergeCards(overviewCapabilityCards, config.cards || [])),
    ctas: visibleSorted(mergeCtas()),
  };
}