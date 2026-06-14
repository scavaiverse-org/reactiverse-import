export const blueprintPageFunctions = [
  {
    label: "A",
    title: "Master Admin Layer",
    purpose: "Highest authority layer controlling ecosystem tenants, admins, permissions, billing, analytics, infrastructure, modules, moderation, media, AI, feature flags, templates, security, and system logs.",
    pages: [
      { code: "A1", path: "/admin/master", page: "MasterDashboard", function: "Ecosystem command center for global readiness, health, tenants, modules, and operational posture.", adminConnection: "Canonical alias to the existing master console at /platform/admin." },
      { code: "A2", path: "/admin/master/tenants", page: "MasterTenants", function: "Manage tenant activation, staging/live state, launch readiness, tenant branding, and module enablement.", adminConnection: "Canonical alias to /platform/admin/tenants." },
      { code: "A3", path: "/admin/master/users", page: "MasterUsers", function: "Manage platform admins, tenant operators, invited users, roles, and access governance.", adminConnection: "Canonical alias to /platform/admin/users-access." },
      { code: "A4", path: "/admin/master/permissions", page: "MasterPermissions", function: "Govern permission grants, tenant boundaries, public/private scopes, and role-level capabilities.", adminConnection: "Backed by User, PermissionGrant, and access-control utilities." },
      { code: "A5", path: "/admin/master/billing", page: "MasterBilling", function: "Canonical billing/plans control surface for tenant lifecycle and subscription governance.", adminConnection: "Alias to tenant registry until billing module is expanded." },
      { code: "A6", path: "/admin/master/analytics", page: "MasterAnalytics", function: "System-wide analytics and readiness oversight across platform and tenant domains.", adminConnection: "Alias to /platform/admin/modules/analytics." },
      { code: "A7", path: "/admin/master/infrastructure", page: "MasterInfrastructure", function: "Control infrastructure, route integrity, environment readiness, health, and operational proof.", adminConnection: "Alias to /platform/admin/infrastructure." },
      { code: "A8", path: "/admin/master/modules", page: "MasterModules", function: "Global control of onboarding, ticketing, AI guide, walkthrough, vendors, commerce, analytics, gamification, and future VR modules.", adminConnection: "Alias to /platform/admin/modules." },
      { code: "A9", path: "/admin/master/moderation", page: "MasterModeration", function: "Review QA feedback, tester issues, content warnings, operational saturation, and moderation signals.", adminConnection: "Alias to /platform/admin/testers-feedback." },
      { code: "A10", path: "/admin/master/media", page: "MasterMediaRegistry", function: "Govern shared platform media registries and media assignment standards.", adminConnection: "Alias to /platform/admin/public-content." },
      { code: "A11", path: "/admin/master/ai", page: "MasterAISettings", function: "Govern global AI prompt patterns, AI guide readiness, moderation prompts, and workflow standards.", adminConnection: "Alias to /platform/admin/modules/ai-guide." },
      { code: "A12", path: "/admin/master/feature-flags", page: "MasterFeatureFlags", function: "Global feature flag and module rollout standard for safe platform expansion.", adminConnection: "Alias to /platform/admin/modules." },
      { code: "A13", path: "/admin/master/templates", page: "MasterTemplates", function: "Global onboarding, page, media, and museum template standards.", adminConnection: "Alias to /platform/admin/public-content." },
      { code: "A14", path: "/admin/master/logs", page: "MasterSystemLogs", function: "Operational and QA feedback reference layer for system events.", adminConnection: "Alias to /platform/admin/testers-feedback and backend operational logs." }
    ]
  },
  {
    label: "B",
    title: "Platform Public Layer",
    purpose: "Platform-owned public pages for AOM corporate presence, tenant acquisition, platform education, marketplace/showcase, services, documentation, authentication entry, and conversion.",
    pages: [
      { code: "B1", path: "/", page: "Home", function: "AOM public gateway that routes visitors to platform exploration, tenant acquisition, or login.", adminConnection: "HomeAdmin / PlatformPages mirror via PlatformPageConfig." },
      { code: "B2", path: "/about", page: "About", function: "Public explanation of AOM, currently routed to the platform overview experience.", adminConnection: "AboutAdmin mirror contract through PlatformPages." },
      { code: "B3", path: "/pricing", page: "Pricing", function: "Public pricing/acquisition entry, currently routed to BecomeTenant.", adminConnection: "PricingAdmin mirror contract through PlatformPages." },
      { code: "B4", path: "/services", page: "Services", function: "Public services route for platform capabilities and service offerings.", adminConnection: "ServicesAdmin mirror via PlatformServices admin controls." },
      { code: "B5", path: "/marketplace", page: "Marketplace", function: "Canonical public marketplace route mapped safely to tenant commerce until standalone marketplace expands.", adminConnection: "MarketplaceAdmin mirror contract through PlatformPages and commerce modules." },
      { code: "B6", path: "/white-label", page: "WhiteLabel", function: "Public white-label and expansion route preserved through legacy redirect.", adminConnection: "WhiteLabelAdmin mirror at /platform/admin/white-label." },
      { code: "B7", path: "/docs", page: "Documentation", function: "Public documentation route mapped to platform docs.", adminConnection: "DocumentationAdmin mirror through public content and PlatformPages." },
      { code: "B8", path: "/contact", page: "Contact", function: "Public contact/legal utility route preserved in AppLayout.", adminConnection: "ContactAdmin mirror contract through PlatformPages." },
      { code: "B9", path: "/login", page: "Login", function: "Authentication entry handled by SCAVerse auth flow.", adminConnection: "AuthAdmin mirror contract; no custom auth backend created." },
      { code: "B10", path: "/signup", page: "Signup", function: "Tenant signup/acquisition alias routed to BecomeTenant.", adminConnection: "AuthAdmin / BecomeTenant mirror contract." },
      { code: "B11", path: "/showcase", page: "Showcase", function: "Public showcase alias routed to VirtualExperience.", adminConnection: "ShowcaseAdmin mirror contract through PlatformPages." }
    ]
  },
  {
    label: "C",
    title: "Platform Admin Layer",
    purpose: "Administrative control layer for platform-owned pages, navigation, global content, marketing, templates, modules, featured museums, SEO, analytics, and settings. Kept separate from Master Admin.",
    pages: [
      { code: "C1", path: "/admin/platform", page: "PlatformDashboard", function: "Canonical platform admin dashboard alias.", adminConnection: "Redirects to /platform/admin." },
      { code: "C2", path: "/admin/platform/pages", page: "PlatformPages", function: "Edit platform-owned public pages and mirror metadata.", adminConnection: "Redirects to /platform/admin/pages." },
      { code: "C3", path: "/admin/platform/navigation", page: "PlatformNavigation", function: "Canonical navigation control surface.", adminConnection: "Alias to PlatformPages while preserving future expansion path." },
      { code: "C4", path: "/admin/platform/media", page: "PlatformMedia", function: "Manage platform media assets and assignments.", adminConnection: "Redirects to /platform/admin/public-content." },
      { code: "C5", path: "/admin/platform/templates", page: "PlatformTemplates", function: "Manage global page/onboarding/media templates.", adminConnection: "Alias to public content controls." },
      { code: "C6", path: "/admin/platform/seo", page: "PlatformSEO", function: "Manage platform SEO metadata and page presentation contracts.", adminConnection: "Alias to PlatformPages." },
      { code: "C7", path: "/admin/platform/landing-pages", page: "PlatformLandingPages", function: "Manage public landing pages and acquisition flows.", adminConnection: "Alias to PlatformPages." },
      { code: "C8", path: "/admin/platform/featured-museums", page: "PlatformFeaturedMuseums", function: "Manage featured tenant/showcase visibility.", adminConnection: "Alias to Tenants registry." },
      { code: "C9", path: "/admin/platform/analytics", page: "PlatformAnalytics", function: "Manage platform analytics module and public analytics presentation.", adminConnection: "Redirects to /platform/admin/modules/analytics." },
      { code: "C10", path: "/admin/platform/settings", page: "PlatformSettings", function: "Manage platform operating settings and standards.", adminConnection: "Alias to infrastructure settings." }
    ]
  },
  {
    label: "D",
    title: "Tenant Admin Layer",
    purpose: "Tenant-isolated private control center for museum/franchise content, media, onboarding, tickets, exhibits, rooms, AI guide, commerce, gamification, VR readiness, analytics, staff, and settings.",
    pages: [
      { code: "D1", path: "/admin/tenant/:tenantId", page: "TenantDashboard", function: "Canonical tenant admin entry and operational dashboard.", adminConnection: "Redirects to /museum/:tenantId/admin." },
      { code: "D2", path: "/admin/tenant/:tenantId/setup", page: "MuseumSetupAdmin", function: "Tenant setup, branding, launch readiness, domain, and module baseline.", adminConnection: "Alias to tenant admin dashboard." },
      { code: "D3", path: "/admin/tenant/:tenantId/onboarding", page: "OnboardingAdmin", function: "Edit tenant onboarding content and journey start.", adminConnection: "Alias to tenant home/admin controls until standalone onboarding admin expands." },
      { code: "D4", path: "/admin/tenant/:tenantId/home", page: "HomeAdmin", function: "Edit museum home page content and media.", adminConnection: "Redirects to /museum/:tenantId/admin/home." },
      { code: "D5", path: "/admin/tenant/:tenantId/tickets", page: "TicketsAdmin", function: "Edit tenant tickets and booking flow.", adminConnection: "Redirects to /museum/:tenantId/admin/tickets." },
      { code: "D6", path: "/admin/tenant/:tenantId/walkthrough", page: "Walkthrough", function: "Edit tenant walkthrough selection, room ordering, media, hotspots, CTAs, publishing, preview, tenant filtering, and museum filtering.", adminConnection: "Redirects to /museum/:tenantId/admin/walkthrough." },
      { code: "D7", path: "/admin/tenant/:tenantId/exhibits", page: "ExhibitsAdmin", function: "Edit tenant exhibit inventory and exhibit page content.", adminConnection: "Redirects to /museum/:tenantId/admin/exhibits." },
      { code: "D11", path: "/admin/tenant/:tenantId/ai-guide", page: "AIGuideAdmin", function: "Edit tenant AI guide behavior and prompt configuration.", adminConnection: "Alias to AI guide module controls." },
      { code: "D12", path: "/admin/tenant/:tenantId/vendors", page: "VendorsAdmin", function: "Edit tenant vendor management.", adminConnection: "Redirects to /museum/:tenantId/admin/vendors." },
      { code: "D13", path: "/admin/tenant/:tenantId/commerce", page: "CommerceAdmin", function: "Edit tenant commerce/marketplace flows.", adminConnection: "Alias to vendor/admin commerce controls." },
      { code: "D14", path: "/admin/tenant/:tenantId/gamification", page: "GamificationAdmin", function: "Edit gamified progression readiness and future badge/quest systems.", adminConnection: "Alias to tenant dashboard and gamification module config." },
      { code: "D15", path: "/admin/tenant/:tenantId/vr", page: "VRAdmin", function: "Edit future VR/3D readiness configuration.", adminConnection: "Alias to tenant dashboard and room preview config." },
      { code: "D16", path: "/admin/tenant/:tenantId/media", page: "MediaAdmin", function: "Manage tenant media and assignments.", adminConnection: "Alias to HomeAdmin/media controls." },
      { code: "D17", path: "/admin/tenant/:tenantId/analytics", page: "AnalyticsAdmin", function: "View tenant-isolated analytics.", adminConnection: "Redirects to /museum/:tenantId/admin/analytics." },
      { code: "D18", path: "/admin/tenant/:tenantId/staff", page: "StaffAdmin", function: "Manage tenant staff access.", adminConnection: "Alias to tenant dashboard and User access controls." },
      { code: "D19", path: "/admin/tenant/:tenantId/settings", page: "SettingsAdmin", function: "Manage tenant settings.", adminConnection: "Alias to tenant dashboard." }
    ]
  },
  {
    label: "E",
    title: "Tenant Public Museum Layer",
    purpose: "Customer-facing museum experience rendered dynamically from tenant-controlled configuration, media, content, tickets, AI, vendors, and experience settings.",
    pages: [
      { code: "E1", path: "/museum/:tenantSlug", page: "Home", function: "Canonical tenant public entry route.", adminConnection: "Redirects to /museum/:tenantSlug/home; mirrored by HomeAdmin." },
      { code: "E2", path: "/museum/:tenantSlug/onboarding", page: "Onboarding", function: "Tenant onboarding journey.", adminConnection: "Mirrored by OnboardingAdmin and ExperienceConfig." },
      { code: "E3", path: "/museum/:tenantSlug/home", page: "Home", function: "Tenant museum homepage.", adminConnection: "Mirrored by HomeAdmin and MuseumPageConfig." },
      { code: "E4", path: "/museum/:tenantSlug/tickets", page: "Tickets", function: "Tenant ticketing and booking experience.", adminConnection: "Mirrored by TicketsAdmin and ModuleConfig ticketing." },
      { code: "E5", path: "/museum/:tenantSlug/entrance", page: "Entrance", function: "Canonical museum entrance mapped to room preview.", adminConnection: "Mirrored by EntranceAdmin and ExperienceConfig." },
      { code: "E6", path: "/museum/:tenantSlug/exhibits", page: "Exhibits", function: "Canonical exhibit route mapped to the museum page renderer.", adminConnection: "Mirrored by ExhibitsAdmin." },
      { code: "E7", path: "/museum/:tenantSlug/stages", page: "Stages", function: "Canonical stages route mapped to walkthrough renderer.", adminConnection: "Mirrored by StagesAdmin and walkthrough config." },
      { code: "E8", path: "/museum/:tenantSlug/experience", page: "Experience", function: "Canonical experience route mapped to walkthrough renderer.", adminConnection: "Mirrored by ExperienceAdmin." },
      { code: "E9", path: "/museum/:tenantSlug/rooms", page: "Rooms", function: "Canonical rooms route mapped to room preview renderer.", adminConnection: "Mirrored by RoomsAdmin." },
      { code: "E10", path: "/museum/:tenantSlug/guide", page: "AIGuide", function: "Tenant AI guide experience.", adminConnection: "Mirrored by AIGuideAdmin and AI module config." },
      { code: "E11", path: "/museum/:tenantSlug/vendors", page: "Vendors", function: "Tenant vendor directory and flows.", adminConnection: "Mirrored by VendorsAdmin." },
      { code: "E12", path: "/museum/:tenantSlug/commerce", page: "Commerce", function: "Tenant commerce/marketplace experience.", adminConnection: "Mirrored by CommerceAdmin." },
      { code: "E13", path: "/museum/:tenantSlug/completion", page: "Completion", function: "Canonical completion/exit route mapped to museum home until standalone completion expands.", adminConnection: "Mirrored by ExperienceAdmin." }
    ]
  },
  {
    label: "F",
    title: "Database / Storage Layer",
    purpose: "Single source of truth for all tenant and platform content, uploads, media URLs, settings, configurations, tickets, stages, analytics, AI prompts, gamification state, VR config, customer progress, branding, and audit data.",
    pages: [
      { code: "F1", path: "MuseumTenant", page: "Tenant", function: "Tenant identity, slug, status, theme, modules, launch readiness, and branding.", adminConnection: "MasterTenants and Tenant setup controls." },
      { code: "F2", path: "User + PermissionGrant", page: "TenantUser / TenantRole", function: "Users, roles, permissions, and tenant-safe access boundaries.", adminConnection: "MasterUsers, StaffAdmin, access-control utilities." },
      { code: "F3", path: "MuseumPageConfig", page: "MuseumPage", function: "Tenant public page content, sections, cards, media slots, CTAs, SEO, accessibility, and mirror metadata.", adminConnection: "Tenant public pages and tenant admin mirrors." },
      { code: "F4", path: "Walkthrough", page: "Walkthrough", function: "Canonical walkthrough rooms, media, hotspots, CTAs, publishing, preview, and related visitor configuration.", adminConnection: "Walkthrough admin, Onboarding admin, AI Guide admin, and module controls." },
      { code: "F5", path: "Exhibit / Ticket / Vendor", page: "MuseumExhibit / MuseumTicket / MuseumVendor", function: "Business and content records for exhibits, ticketing, vendors, and commerce.", adminConnection: "ExhibitsAdmin, TicketsAdmin, VendorsAdmin, CommerceAdmin." },
      { code: "F6", path: "TenantMedia + MasterMediaRegistry + PlatformMediaRegistry", page: "MuseumMedia / PlatformMedia", function: "Uploads, URLs, videos, images, thumbnails, source metadata, and assignment state.", adminConnection: "MediaAdmin, PlatformMedia, MasterMediaRegistry." },
      { code: "F7", path: "PlatformPageConfig + ModuleConfig", page: "PlatformPage / PlatformModule", function: "Platform page content, platform module contracts, and canonical admin mirror rules.", adminConnection: "PlatformPages, PlatformModules, PlatformSettings." },
      { code: "F8", path: "AnalyticsEvent + TesterFeedback + AuditLog + PlatformHealth", page: "MuseumAnalytics / PlatformAnalytics", function: "Analytics, QA, readiness, operational proof, system health, and audit records.", adminConnection: "AnalyticsAdmin, MasterAnalytics, PlatformAnalytics." },
      { code: "F9", path: "MasterPrompt + PromptVersion + AIWorkflow + AIOutput", page: "MuseumAIConfig", function: "AI prompt governance, workflow outputs, moderation, summaries, and future AI artifacts.", adminConnection: "AIGuideAdmin, MasterAISettings." }
    ]
  },
  {
    label: "G",
    title: "Render Engine Layer",
    purpose: "Deterministic logic layer that transforms database records into live public experiences while preserving module gates, tenant boundaries, dynamic content, media rendering, AI guide, ticketing, VR readiness, and gamification readiness.",
    pages: [
      { code: "G1", path: "ModuleGate", page: "ModuleGate", function: "Protects enabled/disabled tenant modules without deleting routes or modules.", adminConnection: "Reads MuseumTenant.enabled_modules and ModuleConfig." },
      { code: "G2", path: "Home / PlatformHome / PublicPageHero", page: "PageRenderer", function: "Renders platform and tenant page configuration into public UI.", adminConnection: "PlatformPageConfig and MuseumPageConfig." },
      { code: "G3", path: "Onboarding", page: "OnboardingRenderer", function: "Renders tenant onboarding journey from ExperienceConfig and tenant page content.", adminConnection: "OnboardingAdmin mirror." },
      { code: "G4", path: "Walkthrough", page: "WalkthroughRenderer", function: "Renders walkthrough rooms, hotspots, panel actions, media, and progress.", adminConnection: "Walkthrough admin mirror." },
      { code: "G5", path: "RoomPreview", page: "RoomRenderer", function: "Renders room/entrance/VR-ready preview experiences with sprites and comfort controls.", adminConnection: "EntranceAdmin, RoomsAdmin, VRAdmin mirrors." },
      { code: "G6", path: "Tickets", page: "TicketRenderer", function: "Renders ticket tiers, booking flow, and ticket conversion events.", adminConnection: "TicketsAdmin and ticketing module." },
      { code: "G7", path: "AIGuide", page: "AIRenderer", function: "Renders AI guide interactions from tenant-safe AI configuration.", adminConnection: "AIGuideAdmin and AI prompt entities." },
      { code: "G8", path: "Vendors / Commerce", page: "CommerceRenderer", function: "Renders tenant vendor and commerce experiences.", adminConnection: "VendorsAdmin and CommerceAdmin." },
      { code: "G9", path: "MediaBackground / MediaCard / HeroVideoBackground", page: "MediaRenderer", function: "Renders images, videos, URLs, overlays, fallbacks, and responsive media slots.", adminConnection: "TenantMedia, PlatformMediaRegistry, MasterMediaRegistry." }
    ]
  },
  {
    label: "H",
    title: "Analytics, Media, and Customer Feedback Layer",
    purpose: "Closes the loop from customer actions, media usage, AI interactions, ticketing, QA, and operational alerts back into master, platform, and tenant admin dashboards.",
    pages: [
      { code: "H1", path: "Visitor Flow", page: "VisitorFlow", function: "Discover → Onboard → Buy Tickets → Enter → Explore Exhibits → Walkthrough → AI Guide → Vendors/Commerce → Completion.", adminConnection: "Tracked through AnalyticsEvent, TesterFeedback, and tenant analytics." },
      { code: "H2", path: "Analytics Feedback Loop", page: "AnalyticsLoop", function: "Visitor events, conversion events, readiness, tester results, and QA results feed back into admin layers.", adminConnection: "MasterAnalytics, PlatformAnalytics, AnalyticsAdmin." },
      { code: "H3", path: "Media / Asset Flow", page: "AssetFlow", function: "Upload → Registry → Assignment → Database Slot → Render Engine → Public Experience.", adminConnection: "MediaAdmin, PlatformMedia, MasterMediaRegistry." },
      { code: "H4", path: "AI System Relationships", page: "AIFlow", function: "Prompts, workflow runs, AI outputs, guide config, and moderation artifacts remain tenant-safe and reviewable.", adminConnection: "MasterAISettings and AIGuideAdmin." },
      { code: "H5", path: "VR / Gamification Relationships", page: "ImmersiveFlow", function: "Walkthrough rooms, progression, badge/quest readiness, and VR-ready configs feed the render engine.", adminConnection: "Walkthrough, VRAdmin, and GamificationAdmin." },
      { code: "H6", path: "Ticketing Relationships", page: "TicketFlow", function: "Tickets, checkout intent, booking request, analytics, and tenant reporting stay isolated per tenant.", adminConnection: "TicketsAdmin and AnalyticsAdmin." },
      { code: "H7", path: "Slack Alerts", page: "OperationalAlerts", function: "Operational status updates can be posted to Slack through postOperationalStatusUpdate.", adminConnection: "Authorized Slack connector and backend operational function." }
    ]
  }
];

export const blueprintFlatPages = blueprintPageFunctions.flatMap(layer => layer.pages.map(page => ({ ...page, layer: `${layer.label}. ${layer.title}` })));

export const blueprintValidationChecklist = [
  "No existing routes were deleted; canonical routes were added as safe aliases or redirects.",
  "No entities were deleted; page key enums and mirror metadata were expanded non-destructively.",
  "Tenant isolation remains based on tenantSlug, tenantId, ownershipScope, module gates, and tenant-scoped records.",
  "Every standardized public page has a documented admin mirror contract.",
  "Platform Admin remains separate from Master Admin through canonical aliases and layer documentation.",
  "Render engine relationships remain database-driven through page config, experience config, module config, media registries, and tenant data.",
  "Media, analytics, AI, VR, gamification, ticketing, and onboarding relationships are preserved and documented."
];