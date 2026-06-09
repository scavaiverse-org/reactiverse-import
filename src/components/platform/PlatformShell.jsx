import { Link } from "react-router-dom";
import { Building2, Globe2, LogOut, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { ROLES, normalizeRole } from "@/lib/rbac";

function getAssignedTenant(user, tenants) {
  const tenantIds = user?.tenantIds || user?.assignedTenantIds || user?.assignedMuseumIds || [];
  return tenants.find((tenant) => tenantIds.includes(tenant.id)) || null;
}

function getRoleState(user) {
  const role = normalizeRole(user?.role);
  return {
    isMaster: role === ROLES.MASTER_ADMIN || role === ROLES.PLATFORM_ADMIN,
    isTenant: [
      ROLES.FRANCHISE_OWNER,
      ROLES.FRANCHISE_MANAGER,
      ROLES.FRANCHISE_STAFF,
      ROLES.CONTENT_EDITOR,
      ROLES.MEDIA_MANAGER,
      ROLES.APPROVAL_REVIEWER,
      ROLES.ANALYTICS_VIEWER,
    ].includes(role),
  };
}

export function usePlatformWorkspace() {
  const { user, isAuthenticated, isLoadingAuth, logout } = useAuth();
  const { tenants = [], isLoading: isLoadingTenants } = useActiveTenant();
  const { isMaster, isTenant } = getRoleState(user);
  const assignedTenant = getAssignedTenant(user, tenants);
  const tenant = assignedTenant || null;
  const isReady = !isLoadingAuth && !isLoadingTenants;

  return { user, isAuthenticated, isLoadingAuth, isReady, logout, tenants, tenant, isMaster, isTenant };
}

export default function PlatformShell({ children, audience = "public" }) {
  const { isAuthenticated, isReady, logout, tenant, isMaster, isTenant } = usePlatformWorkspace();
  const tenantSlug = tenant?.slug;
  // Consumer-facing pages (audience="public") must never render admin/tenant
  // management navigation, even for admins browsing the public site.
  const forcePublic = audience === "public";

  const publicLinks = [
    { label: "Consumer Platform", path: "/platform/overview" },
    { label: "Become a Tenant", path: "/become-a-tenant" },
    { label: "Login", path: "/login" },
  ];

  const tenantLinks = tenantSlug ? [
    { label: "My Museum", path: `/museum/${tenantSlug}/home` },
    { label: "Tenant Admin", path: `/museum/${tenantSlug}/admin` },
    { label: "Manage Content", path: `/museum/${tenantSlug}/admin/home` },
    { label: "Manage Media", path: `/museum/${tenantSlug}/admin/home` },
    { label: "Manage Rooms", path: `/museum/${tenantSlug}/admin/exhibits` },
    { label: "Preview Public Museum", path: `/museum/${tenantSlug}/home` },
  ] : [];

  const masterLinks = [
    { label: "Platform Admin", path: "/platform/admin" },
    { label: "Tenants", path: "/platform/admin/tenants" },
    { label: "Platform Pages", path: "/platform/admin/pages" },
    { label: "Analytics", path: "/platform/admin/modules/analytics" },
  ];

  const activeLinks = forcePublic
    ? publicLinks
    : isAuthenticated && isMaster ? masterLinks : isAuthenticated && isTenant ? tenantLinks : publicLinks;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/25 bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-display text-sm font-semibold uppercase tracking-[0.28em]">SCAVERSE</p>
              <p className="font-body text-xs text-muted-foreground">Museum engine platform</p>
            </div>
          </Link>

          <nav className="flex flex-wrap items-center gap-2">
            {!isReady ? (
              <div className="flex items-center gap-2">
                <div className="h-7 w-24 animate-pulse rounded-md bg-muted/50" />
                <div className="h-7 w-20 animate-pulse rounded-md bg-muted/50" />
                <div className="h-7 w-16 animate-pulse rounded-md bg-muted/50" />
              </div>
            ) : (
              <>
                {activeLinks.map((link) => (
                  <Link key={link.path} to={link.path}>
                    <Button variant="ghost" size="sm" className="font-display text-xs uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground">
                      {link.label}
                    </Button>
                  </Link>
                ))}
                {isAuthenticated ? (
                  <Button variant="outline" size="sm" onClick={() => logout(true)} className="border-border/60">
                    <LogOut className="h-4 w-4" /> Logout
                  </Button>
                ) : (
                  <Link to="/login">
                    <Button size="sm" className="bg-primary text-primary-foreground">
                      <Building2 className="h-4 w-4" /> Login
                    </Button>
                  </Link>
                )}
              </>
            )}
          </nav>
        </div>
      </header>

      {children}

      <footer className="border-t border-border/40 px-4 py-8 text-center font-body text-xs text-muted-foreground">
        <Globe2 className="mx-auto mb-2 h-4 w-4 text-primary" />
        SCAVerse lets museum owners create virtual museum experiences, and lets visitors explore them online.
      </footer>
    </main>
  );
}