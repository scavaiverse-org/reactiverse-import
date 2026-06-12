import { Link } from "react-router-dom";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { useAuth } from "@/lib/AuthContext";
import { isMasterUser, getUserTenantIds } from "@/lib/rbac";

/**
 * Museum-level publish gate. The directory and tour player already check
 * published_manifest_id, but home/about/tickets/commerce/vendors/guide were
 * reachable by direct URL while a museum was still under construction —
 * which means any future tenant's half-built museum would be publicly
 * visible. Visitors now get a neutral "not open yet" screen until the
 * museum is published; master admins and the museum's own team bypass the
 * gate so they can keep building.
 */
export default function MuseumOpenGate({ children }) {
  const { tenant, isLoading } = useActiveTenant();
  const { user, isLoadingAuth } = useAuth();

  if (isLoading || isLoadingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      </div>
    );
  }

  // Unknown slug — let the page's own not-found handling deal with it.
  if (!tenant) return children;

  const isOpen = !!tenant.published_manifest_id;
  const isTeam = isMasterUser(user) || getUserTenantIds(user).includes(tenant.id);
  if (isOpen || isTeam) return children;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-md rounded-3xl border border-border/50 bg-card/70 p-8 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-primary/25 bg-primary/10">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground">This museum is not open yet</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {tenant.name || "This museum"} is still preparing its experience. Check back soon.
        </p>
        <Button asChild className="mt-6 w-full bg-primary text-primary-foreground">
          <Link to="/virtual-experience">Explore available museums</Link>
        </Button>
      </div>
    </main>
  );
}
