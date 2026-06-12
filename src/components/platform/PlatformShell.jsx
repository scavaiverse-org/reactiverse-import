import { Globe2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { ROLES, normalizeRole } from "@/lib/rbac";
import Navbar from "@/components/layout/Navbar";

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

// Unified header: every public page renders the same shared Navbar (fixed
// pill bar) so the top bar never jumps in position/style between pages.
// The old role-aware PlatformShell header was always in audience="public"
// mode at every call site, so no navigation was lost in the swap.
export default function PlatformShell({ children }) {
  return (
    <main className="min-h-screen bg-background pt-16 text-foreground">
      <Navbar />

      {children}

      <footer className="border-t border-border/40 px-4 py-8 text-center font-body text-xs text-muted-foreground">
        <Globe2 className="mx-auto mb-2 h-4 w-4 text-primary" />
        SCAVerse lets museum owners create virtual museum experiences, and lets visitors explore them online.
      </footer>
    </main>
  );
}