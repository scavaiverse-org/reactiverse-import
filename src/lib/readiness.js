const REQUIRED_MODULES = ["onboarding", "ticketing", "ai_guide", "walkthrough", "analytics"];
const VALID_PUBLIC_PATHS = ["/", "/museum", "/walkthrough", "/onboarding", "/guide", "/tickets", "/vendors", "/vendors/register", "/commerce", "/analytics", "/expansion"];

export function calculateTenantReadiness({ tenant, moduleConfigs = [], experienceConfig, assets = [], tickets = [], vendors = [], events = [] }) {
  const enabledModules = tenant?.enabled_modules || [];
  const tenantAssets = assets.filter((asset) => asset.tenant_id === tenant?.id);
  const tenantTickets = tickets.filter((ticket) => ticket.tenant_id === tenant?.id);
  const tenantVendors = vendors.filter((vendor) => vendor.tenant_id === tenant?.id);
  const tenantEvents = events.filter((event) => event.tenant_id === tenant?.id);
  const ctaPaths = [tenant?.theme_config?.primary_cta_path, tenant?.theme_config?.secondary_cta_path].filter(Boolean);
  const ctaPathsValid = ctaPaths.length > 0 && ctaPaths.every((path) => VALID_PUBLIC_PATHS.includes(path));

  const checks = [
    { key: "tenant", label: "Tenant created", done: !!tenant?.id, severity: "critical", action: "Create a museum tenant" },
    { key: "branding", label: "Branding configured", done: !!tenant?.name && !!tenant?.slug && !!tenant?.theme_config?.primary_color, severity: "warning", action: "Complete white-label branding" },
    { key: "modules", label: "Core modules enabled", done: REQUIRED_MODULES.every((module) => enabledModules.includes(module)), severity: "critical", action: "Enable required launch modules" },
    { key: "onboarding", label: "Onboarding has 8-stage journey", done: Array.isArray(experienceConfig?.onboarding_config?.slides) && experienceConfig.onboarding_config.slides.length >= 8, severity: "critical", action: "Configure at least 8 onboarding slides" },
    { key: "ticketing", label: "Ticketing configured", done: moduleConfigs.some((cfg) => cfg.module_key === "ticketing" && cfg.config_json?.ticket_types?.length > 0), severity: "critical", action: "Add ticket types and pricing" },
    { key: "ai_guide", label: "AI guide configured", done: !!experienceConfig?.ai_guide_config?.guide_name, severity: "warning", action: "Set AI guide name and personality" },
    { key: "walkthrough", label: "Walkthrough has 6 usable scenes", done: Array.isArray(experienceConfig?.walkthrough_config?.scenes) && experienceConfig.walkthrough_config.scenes.length >= 6, severity: "critical", action: "Add at least 6 walkthrough scenes" },
    { key: "content", label: "Published content exists", done: tenantAssets.some((asset) => asset.status === "published") || assets.some((asset) => asset.status === "published" && !asset.tenant_id), severity: "critical", action: "Publish at least one exhibit or content asset" },
    { key: "vendors", label: "Vendor module configured if enabled", done: !enabledModules.includes("vendors") || moduleConfigs.some((cfg) => cfg.module_key === "vendors" && cfg.config_json), severity: "warning", action: "Configure vendor categories and approvals" },
    { key: "analytics", label: "Analytics receiving events", done: tenantEvents.length > 0, severity: "warning", action: "Generate test analytics events" },
    { key: "sales", label: "Ticket flow tested", done: tenantTickets.length > 0, severity: "warning", action: "Create a test ticket purchase" },
    { key: "vendor_data", label: "Vendor workflow tested", done: !enabledModules.includes("vendors") || tenantVendors.length > 0, severity: "info", action: "Create or approve a vendor" },
    { key: "routes", label: "Public CTA paths route-safe", done: ctaPathsValid, severity: "critical", action: "Use only registered public CTA routes" },
    { key: "cta", label: "Public CTA labels configured", done: !!tenant?.theme_config?.primary_cta_label && !!tenant?.theme_config?.secondary_cta_label, severity: "warning", action: "Configure public CTA labels" },
    { key: "accessibility", label: "Accessibility controls configured", done: !!experienceConfig?.onboarding_config?.accessibility_preferences?.length || !!experienceConfig?.walkthrough_config?.reduced_motion_alternative, severity: "critical", action: "Enable comfort controls" },
    { key: "sensory", label: "Sensory warnings available", done: !!experienceConfig?.walkthrough_config?.sensory_warnings || !!experienceConfig?.onboarding_config?.sensory_options?.length, severity: "warning", action: "Add sensory warnings to onboarding/walkthrough" },
    { key: "mobile", label: "Mobile preview requires manual QA", done: false, severity: "info", action: "Run mobile preview before final launch" },
  ];

  const passed = checks.filter((check) => check.done).length;
  const percentage = Math.round((passed / checks.length) * 100);
  const missing = checks.filter((check) => !check.done);
  const critical = missing.filter((check) => check.severity === "critical");
  const warnings = missing.filter((check) => check.severity === "warning");

  const status = percentage >= 90 ? "Launch Ready" : percentage >= 75 ? "Almost Ready" : percentage >= 40 ? "Needs Review" : "Not Ready";

  return {
    percentage,
    status,
    checks,
    missing,
    critical,
    warnings,
    recommendedAction: critical[0]?.action || warnings[0]?.action || missing[0]?.action || "Ready for launch review",
  };
}