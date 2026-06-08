const DEFAULT_FILES = ["App.jsx", "lib/qa-sentinel/*", "affected page/component"];

const RULES = [
  {
    match: /tenant.*leak|wrong tenant|tenant isolation/i,
    area: "tenant_isolation",
    risk: "critical",
    complexity: "hard",
    root: "The issue likely comes from missing tenant_id filters, tenantSlug resolution, query scoping, public route lookup, or fallback tenant logic.",
    summary: "Verify every read/write is scoped to the active tenant and no fallback tenant masks the routing context.",
    steps: ["Confirm tenantSlug resolves to the intended tenant record.", "Check every entity query includes the correct tenant_id or museum_id filter.", "Remove unsafe fallback tenant behavior for tenant-owned pages.", "Verify admin and public routes do not share unscoped data."],
    files: ["hooks/useActiveTenant.js", "components/routing/CanonicalRedirects.jsx", "lib/domain-registry.js", "tenant-scoped pages/components"],
    components: ["TenantPublicRedirect", "TenantAdminLayout", "TenantSwitcher"]
  },
  {
    match: /route|redirect|404|not found/i,
    area: "routing",
    risk: "high",
    complexity: "moderate",
    root: "The issue likely comes from App.jsx route registration, route-registry.js, sidebar path, redirect handling, or tenantSlug params.",
    summary: "Align the rendered route, registry route, sidebar link, and redirect target.",
    steps: ["Check App.jsx contains the target route.", "Verify route-registry.js uses the same path.", "Confirm sidebar/navigation links point to the canonical route.", "Validate tenantSlug route parameters and redirect handling."],
    files: ["App.jsx", "lib/route-registry.js", "components/admin/MasterAdminSidebar.jsx", "components/routing/CanonicalRedirects.jsx"],
    components: ["Router", "Sidebar", "CanonicalRedirects"]
  },
  {
    match: /save|persist|persistence|not saved|create preset/i,
    area: "data_persistence",
    risk: "high",
    complexity: "moderate",
    root: "The issue likely comes from a disconnected save handler, missing entity create/update call, required field mismatch, missing tenant_id, cache invalidation, realtime update, or validation gap.",
    summary: "Connect the save CTA to entity persistence, validate required fields, and refetch or realtime-update the list after saving.",
    steps: ["Validate required fields before saving.", "Call the correct entity create/update method with tenant_id and key fields.", "Persist the same fields the loader reads back later.", "Invalidate/refetch the preset list or rely on a realtime subscription after save.", "Show success/error feedback to the admin."],
    files: ["ExperienceEditor.jsx", "PresetManager.jsx", "components/admin/walkthrough/MuseumPresetAutofill.jsx", "entities/TenantPresetData.json"],
    components: ["PresetManager", "ExperienceEditor", "MuseumPresetAutofill"]
  },
  {
    match: /button|click|cta|dead click|not responding/i,
    area: "frontend",
    risk: "medium",
    complexity: "easy",
    root: "The issue likely comes from a missing onClick handler, disabled state, event propagation, button type, missing async handler, or missing feedback state.",
    summary: "Connect the CTA to its intended handler and expose success/error feedback.",
    steps: ["Confirm the button has an onClick or submit handler.", "Check disabled/loading state cannot permanently block the CTA.", "Verify event propagation is not stopped by a parent element.", "Add visible success or error feedback after the action."],
    files: ["affected page/component", "components/ui/button.jsx"],
    components: ["Button", "CTA handler"]
  },
  {
    match: /media|image|video|upload|binding/i,
    area: "media_binding",
    risk: "high",
    complexity: "moderate",
    root: "The issue likely comes from a mismatch between admin field name, saved entity field, frontend render field, upload result shape, URL validation, fallback media, or public page binding.",
    summary: "Trace the uploaded URL from admin input to saved entity payload to public renderer binding.",
    steps: ["Check the admin field name and upload result shape.", "Verify the entity stores the same URL field the renderer reads.", "Validate image/video URLs before rendering.", "Confirm fallback media appears when primary media fails."],
    files: ["components/admin/media/*", "components/walkthrough/ResolvedMedia.jsx", "components/walkthrough/WalkthroughMediaLayer.jsx"],
    components: ["MediaSelector", "ResolvedMedia", "WalkthroughMediaLayer"]
  },
  {
    match: /permission|forbidden|401|403|access/i,
    area: "permissions",
    risk: "high",
    complexity: "moderate",
    root: "The issue likely comes from role guard, route guard, user type, tenant access, master admin access, or gated content logic.",
    summary: "Validate access checks match the user role, domain, and tenant context.",
    steps: ["Check role guard logic for the affected route.", "Verify master admin versus tenant admin access rules.", "Confirm tenant access is evaluated before rendering protected content.", "Show a clear unauthorized state when access is blocked."],
    files: ["lib/access-control.js", "lib/rbac.js", "components/access/DomainAccessGate.jsx"],
    components: ["DomainAccessGate", "ProtectedRoute"]
  },
  {
    match: /realtime|subscription|stale|cache/i,
    area: "realtime",
    risk: "medium",
    complexity: "moderate",
    root: "The issue likely comes from entity subscription setup, cleanup on unmount, duplicate subscriptions, stale query cache, or missing subscription error state.",
    summary: "Ensure realtime subscriptions and query cache invalidation update the visible list consistently.",
    steps: ["Check the entity subscribe handler updates create/update/delete events.", "Clean up subscriptions on unmount.", "Avoid duplicate subscriptions for the same entity.", "Invalidate related queries after mutations."],
    files: ["affected page/component", "lib/query-client.js"],
    components: ["Realtime list", "Query cache"]
  },
  {
    match: /blank|white screen|render|undefined|missing import/i,
    area: "frontend",
    risk: "critical",
    complexity: "moderate",
    root: "The issue likely comes from render exceptions, missing imports, undefined props, missing entity data guards, Suspense/loading boundaries, or console errors.",
    summary: "Guard missing data and resolve render/import errors on the affected page.",
    steps: ["Review console errors for the first render exception.", "Check imports and exported component names.", "Add guards for optional entity data before rendering.", "Provide loading and empty states for async data."],
    files: DEFAULT_FILES,
    components: ["Affected page", "Affected component"]
  },
  {
    match: /loader|loading|stuck|slow/i,
    area: "frontend",
    risk: "medium",
    complexity: "easy",
    root: "The issue likely comes from a missing loading exit path, failed query handling, empty state fallback, or promise rejection.",
    summary: "Ensure loading state exits on success, error, and empty data paths.",
    steps: ["Check all async branches clear loading state.", "Render an error state when queries fail.", "Render an empty state when no records are returned.", "Avoid awaiting promises that may never resolve without a timeout or error path."],
    files: DEFAULT_FILES,
    components: ["Loading boundary", "Data query"]
  },
  {
    match: /frontend.*backend|backend.*frontend|field naming|payload|mismatch/i,
    area: "data_persistence",
    risk: "high",
    complexity: "moderate",
    root: "The issue likely comes from saved entity payload, field naming, query filters, frontend component binding, cache invalidation, or realtime subscription mismatch.",
    summary: "Align saved payload fields with the fields queried and rendered by the frontend.",
    steps: ["Compare create/update payload keys with entity schema keys.", "Verify query filters return the saved record.", "Confirm the component reads the same fields that are persisted.", "Invalidate cache or subscribe to realtime updates after mutation."],
    files: ["entities/*.json", "affected page/component", "api/base44Client.js"],
    components: ["Entity form", "Entity list", "Renderer"]
  }
];

export function buildFixIntelligence(issue = {}) {
  const text = [issue.title, issue.description, issue.area, issue.actual_result, issue.likely_cause, issue.cta_label, issue.component_name].filter(Boolean).join(" ");
  const rule = RULES.find((item) => item.match.test(text)) || {
    area: "unknown",
    risk: issue.severity === "critical" ? "critical" : "medium",
    complexity: "moderate",
    root: "The issue needs deterministic verification against the affected UI flow and stored data contract.",
    summary: "Inspect the affected route, component, data payload, and runtime logs before changing code.",
    steps: ["Open the affected route.", "Repeat the captured reproduction steps.", "Check console/network errors.", "Compare expected and actual stored data.", "Apply the smallest targeted fix and retest."],
    files: DEFAULT_FILES,
    components: ["Affected route", "Affected component"]
  };

  return {
    root_cause_hypothesis: rule.root,
    fix_summary: rule.summary,
    recommended_fix_steps: rule.steps,
    likely_files_affected: rule.files,
    likely_components_affected: rule.components,
    risk_level: rule.risk,
    fix_complexity: rule.complexity,
    estimated_fix_area: rule.area,
    regression_test_steps: issue.regression_test_steps?.length ? issue.regression_test_steps : [
      `Open ${issue.route || "the affected route"}`,
      "Repeat the issue reproduction flow.",
      "Confirm the expected result now happens.",
      "Reload the page and confirm the fix persists.",
      "Verify no new QA Sentinel issue is created for the same flow."
    ],
    verification_command: issue.route ? `Manual verification: open ${issue.route}, repeat the regression steps, then run QA Sentinel regression test.` : "Manual verification: repeat regression steps and run QA Sentinel regression test.",
    safe_to_autofix: false,
    autofix_forbidden_reason: "Automatic production code edits are disabled. The Fix Intelligence Layer only suggests fixes until an explicit developer-only autofix system exists.",
    developer_notes: "Generated by deterministic QA Fix Intelligence rules. No LLM call or integration credit burn was used."
  };
}