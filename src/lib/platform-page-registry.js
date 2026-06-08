import { PLATFORM_PAGE_KEYS, platformPath } from "./domain-registry";
import { createMassMarketPlatformOverviewConfig } from "./platform-overview-content";

export { PLATFORM_PAGE_KEYS };

export const PLATFORM_PAGES = [
  { pageKey: "platform_home", pageName: "Home", route: "/" },
  { pageKey: "become_a_tenant", pageName: "Become a Tenant", route: "/become-a-tenant" },
  { pageKey: "platform_about", pageName: "About", route: "/about" },
  { pageKey: "platform_pricing", pageName: "Pricing", route: "/pricing" },
  { pageKey: "platform_contact", pageName: "Contact", route: "/contact" },
  { pageKey: "platform_marketplace", pageName: "Marketplace", route: "/marketplace" },
  { pageKey: "platform_showcase", pageName: "Showcase", route: "/showcase" },
  { pageKey: "platform_overview", pageName: "Platform Overview", route: platformPath("overview") },
  { pageKey: "platform_analytics", pageName: "Analytics Core", route: platformPath("analytics") },
  { pageKey: "platform_white_label", pageName: "White Label", route: platformPath("white-label") },
  { pageKey: "platform_infrastructure", pageName: "Infrastructure", route: platformPath("infrastructure") },
  { pageKey: "platform_services", pageName: "Services", route: platformPath("services") },
  { pageKey: "platform_launch", pageName: "Launch Readiness", route: "/platform/admin" },
  { pageKey: "platform_docs", pageName: "Documentation", route: platformPath("docs") },
  { pageKey: "platform_system", pageName: "System", route: platformPath("system") },
  { pageKey: "platform_admin", pageName: "Platform Admin", route: platformPath("admin") },
  { pageKey: "tenant_registry", pageName: "Tenant Registry", route: "/platform/admin/tenants" },
  { pageKey: "architecture_blueprint", pageName: "Architecture Blueprint", route: platformPath("system") },
  { pageKey: "platform_navigation", pageName: "Platform Navigation", route: "/platform/admin/pages" },
  { pageKey: "platform_templates", pageName: "Platform Templates", route: "/platform/admin/public-content" },
  { pageKey: "platform_seo", pageName: "Platform SEO", route: "/platform/admin/pages" },
  { pageKey: "platform_landing_pages", pageName: "Platform Landing Pages", route: "/platform/admin/pages" },
  { pageKey: "platform_featured_museums", pageName: "Platform Featured Museums", route: "/platform/admin/tenants" },
  { pageKey: "platform_settings", pageName: "Platform Settings", route: "/platform/admin/infrastructure" },
];

export const PLATFORM_PAGE_BY_KEY = PLATFORM_PAGES.reduce((map, page) => ({ ...map, [page.pageKey]: page }), {});

export function createDefaultPlatformPageConfig(pageKey) {
  const page = PLATFORM_PAGE_BY_KEY[pageKey] || PLATFORM_PAGES[0];

  if (page.pageKey === "platform_overview") {
    return createMassMarketPlatformOverviewConfig();
  }

  if (page.pageKey === "become_a_tenant") {
    return {
      pageKey: "become_a_tenant",
      pageName: "Become a Tenant",
      ownershipScope: "platform",
      status: "draft",
      publishedVersion: 0,
      draftVersion: 1,
      sections: [
        {
          sectionKey: "hero",
          sectionName: "Become Tenant Hero",
          eyebrow: "Become a tenant / franchisee",
          title: "Launch your own virtual museum without building software.",
          subtitle: "AOM is for museum owners, cultural groups, curators, schools, galleries, heritage operators, and private collectors who want a visitor-ready virtual museum experience.",
          description: "Request a demo or contact the platform owner.",
          backgroundVideoUrl: "https://res.cloudinary.com/dwc4hamrl/video/upload/q_auto/f_auto/v1780431698/grok_video_2026-06-03-04-21-15_eo9sqz.mp4",
          overlayOpacity: 0.68,
          overlayColor: "6, 12, 24",
          overlayBlur: 0,
          textColorMode: "light",
          visibility: true,
          sortOrder: 1,
        },
      ],
      cards: [],
      mediaSlots: [
        { slotKey: "become_a_tenant.hero.background", pageKey: "become_a_tenant", ownershipScope: "platform", sectionKey: "hero", componentKey: "become_a_tenant.hero", adminLabel: "Become a Tenant Hero Background", mediaId: "", allowVideo: true, playVideoOnMobile: true, reducedMotionFallback: true, overlayOpacity: 0.68, overlayColor: "6, 12, 24" },
      ],
      ctaSlots: [
        { ctaKey: "primary", label: "Request Demo", route: "/become-a-tenant", actionType: "route", target: "/become-a-tenant", visibility: true, sortOrder: 1, trackingEvent: "become_a_tenant_primary_cta" },
        { ctaKey: "secondary", label: "Already a tenant?", route: "/tenant-login", actionType: "route", target: "/tenant-login", visibility: true, sortOrder: 2, trackingEvent: "become_a_tenant_secondary_cta" },
      ],
      seo: { title: "Become a Tenant | AOM", description: "Launch your own virtual museum without building software." },
      accessibility: { reducedMotionFallback: true, altText: "AOM become a tenant cinematic background" },
      verificationReport: { status: "MANUAL_QA_REQUIRED", checks: [] },
      lastEditedAt: new Date().toISOString(),
    };
  }

  if (page.pageKey === "platform_home") {
    return {
      pageKey: "platform_home",
      pageName: "Home",
      ownershipScope: "platform",
      status: "draft",
      publishedVersion: 0,
      draftVersion: 1,
      sections: [
        {
          sectionKey: "gateway",
          sectionName: "Home Hero",
          eyebrow: "Visit From Anywhere",
          title: "AOM",
          subtitle: "A focused entry point for consumers, franchise applicants, and existing users.",
          description: "Choose the canonical path you need.",
          backgroundVideoUrl: "https://res.cloudinary.com/dwc4hamrl/video/upload/q_auto/f_auto/v1780217188/grok_video_2026-05-31-16-45-59_qtjuki.mp4",
          overlayOpacity: 0.58,
          overlayColor: "6, 12, 24",
          systemColorAlignment: "AOM primary gold, dark museum background, soft cyan accents",
          visibility: true,
          sortOrder: 1,
        },
      ],
      cards: [
        { key: "consumer_platform", userType: "Consumer Platform", title: "Consumer Platform", description: "Explore the consumer-facing museum platform and browse available virtual museums.", label: "Enter Consumer Platform", route: "/platform/overview", visibility: true, sortOrder: 1 },
        { key: "become_tenant", userType: "Tenant / Franchise Applicant", title: "Become a Tenant / Franchise", description: "Apply to launch your own museum, attraction, or cultural experience on SCAVerse.", label: "Apply as a Franchise", route: "/become-a-tenant", visibility: true, sortOrder: 2 },
        { key: "login", userType: "Existing User", title: "Login", description: "For existing users, admins, operators, and approved tenant teams.", label: "Login", route: "/login", visibility: true, sortOrder: 3 },
      ],
      mediaSlots: [
        { slotKey: "platform_home.gateway.background_video", pageKey: "platform_home", ownershipScope: "platform", sectionKey: "gateway", componentKey: "platform_home.gateway", adminLabel: "Homepage Gateway Background Video", mediaId: "", allowVideo: true, playVideoOnMobile: true, reducedMotionFallback: true, overlayOpacity: 0.68, overlayColor: "6, 12, 24" },
      ],
      ctaSlots: [],
      seo: { title: "Home | AOM", description: "Choose how you want to enter AOM." },
      accessibility: { reducedMotionFallback: true, altText: "AOM cinematic gateway background" },
      verificationReport: { status: "MANUAL_QA_REQUIRED", checks: [] },
      lastEditedAt: new Date().toISOString(),
    };
  }

  return {
    pageKey: page.pageKey,
    pageName: page.pageName,
    ownershipScope: "platform",
    status: "draft",
    publishedVersion: 0,
    draftVersion: 1,
    sections: [
      {
        sectionKey: "hero",
        sectionName: "Hero Section",
        eyebrow: page.pageName,
        title: page.pageName,
        subtitle: "Platform-owned system page.",
        description: "Editable only by platform staff from the platform admin domain.",
        body: "",
        overlayOpacity: 0.68,
        overlayColor: "6, 12, 24",
        overlayBlur: 0,
        textColorMode: "light",
        visibility: true,
        sortOrder: 1,
      },
    ],
    cards: [],
    mediaSlots: [
      {
        slotKey: `${page.pageKey}.hero.background`,
        pageKey: page.pageKey,
        ownershipScope: "platform",
        sectionKey: "hero",
        componentKey: `${page.pageKey}.hero`,
        adminLabel: `${page.pageName} Hero Background`,
        mediaId: "",
        allowVideo: true,
        playVideoOnMobile: false,
        reducedMotionFallback: true,
        overlayOpacity: 0.68,
        overlayColor: "6, 12, 24",
        blur: 0,
        brightness: 0.85,
        focusX: 50,
        focusY: 50,
      },
    ],
    ctaSlots: [
      { ctaKey: "primary", label: "Open Page", route: page.route, actionType: "route", target: page.route, visibility: true, sortOrder: 1, trackingEvent: `${page.pageKey}_primary_cta` },
      { ctaKey: "secondary", label: "Platform Overview", route: "/platform/overview", actionType: "route", target: "/platform/overview", visibility: true, sortOrder: 2, trackingEvent: `${page.pageKey}_secondary_cta` },
    ],
    seo: { title: page.pageName, description: "AOM platform system page." },
    accessibility: { reducedMotionFallback: true, altText: `${page.pageName} platform media` },
    verificationReport: { status: "MANUAL_QA_REQUIRED", checks: [] },
    lastEditedAt: new Date().toISOString(),
  };
}

export function platformPublicKey(pageKey) {
  const aliases = {
    home: "platform_home",
    platform_home: "platform_home",
    platform: "platform_overview",
    analytics: "platform_analytics",
    white_label: "platform_white_label",
    documentation_notes: "platform_docs",
    about: "platform_about",
    pricing: "platform_pricing",
    contact: "platform_contact",
    marketplace: "platform_marketplace",
    showcase: "platform_showcase",
    services: "platform_services",
    docs: "platform_docs",
  };
  return aliases[pageKey] || pageKey;
}