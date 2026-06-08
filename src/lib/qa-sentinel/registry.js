import { routeRegistry } from "@/lib/route-registry";

export const sentinelRoutes = routeRegistry.map((route) => ({
  ...route,
  sentinel_status: "mapped_only",
  runtime_verified: false
}));

export const adminTabDefinitions = [
  { label: "Master Dashboard", route: "/platform/admin", domain: "master_admin", critical: true },
  { label: "Users Access", route: "/platform/admin/users-access", domain: "master_admin", critical: true },
  { label: "Experience Layer", route: "/platform/admin/experience-layer", domain: "master_admin", critical: true },
  { label: "Modules", route: "/platform/admin/modules", domain: "master_admin", critical: true },
  { label: "Infrastructure", route: "/platform/admin/infrastructure", domain: "master_admin", critical: true },
  { label: "Public Content", route: "/platform/admin/public-content", domain: "master_admin", critical: true },
  { label: "Platform Pages", route: "/platform/admin/pages", domain: "master_admin", critical: true },
  { label: "Tenants", route: "/platform/admin/tenants", domain: "master_admin", critical: true },
  { label: "Architecture Blueprint", route: "/platform/admin/architecture-blueprint", domain: "master_admin", critical: true },
  { label: "Tenant Dashboard", route: "/museum/aom/admin", domain: "tenant_admin", critical: true },
  { label: "Museum Home Editor", route: "/museum/aom/admin/home", domain: "tenant_admin", critical: true },
  { label: "Experience Builder", route: "/museum/aom/admin/walkthrough", domain: "tenant_admin", critical: true },
  { label: "Tickets", route: "/museum/aom/admin/tickets", domain: "tenant_admin", critical: true },
  { label: "Vendors", route: "/museum/aom/admin/vendors", domain: "tenant_admin", critical: true },
  { label: "Exhibits", route: "/museum/aom/admin/exhibits", domain: "tenant_admin", critical: true },
  { label: "Music", route: "/museum/aom/admin/music", domain: "tenant_admin", critical: true },
  { label: "Analytics", route: "/museum/aom/admin/analytics", domain: "tenant_admin", critical: true }
];

export function buildRouteCoverageMap(issues = []) {
  const activeIssues = issues.filter((issue) => !["fixed", "ignored"].includes(issue.status));
  return sentinelRoutes.map((route) => {
    const routeIssues = activeIssues.filter((issue) => issue.route === route.path);
    return {
      ...route,
      last_status: routeIssues.length ? (routeIssues.some((issue) => issue.severity === "critical") ? "failing" : "warning") : "mapped_only",
      open_issue_count: routeIssues.length,
      last_issue_title: routeIssues[0]?.title || "Mapped, not runtime verified"
    };
  });
}