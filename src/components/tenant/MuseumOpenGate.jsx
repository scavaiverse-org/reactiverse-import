import { Link } from "react-router-dom";
import { Building2, Info, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { useAuth } from "@/lib/AuthContext";
import { isMasterUser, getUserTenantIds } from "@/lib/rbac";
import { museumPath } from "@/lib/domain-registry";

/**
 * Museum-level publish gate. The directory and tour player already check
 * published_manifest_id, but home/about/tickets/commerce/vendors/guide were
 * reachable by direct URL while a museum was still under construction —
 * which means any future tenant's half-built museum would be publicly
 * visible. Visitors now get a neutral "not open yet" screen until the
 * museum is published; master admins and the museum's own team bypass the
 * gate so they can keep building. Presale pages (tickets / about) pass
 * `allow` so they stay reachable before publish — tickets are sold ahead of
 * launch, and the tour itself remains protected by its own routes +
 * useTourAccess (paid-ticket check), so opening these doors leaks nothing.
 */
export default function MuseumOpenGate({ children, allow = false }) {
  const { tenant, isLoading, isModuleEnabled } = useActiveTenant();
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
  if (allow || isOpen || isTeam) return children;

  // Presale: even before publish, tickets + about stay reachable so visitors
  // can buy ahead of launch and read what they're buying. Surface those doors
  // here so the gate isn't a dead end — otherwise the only way in is a typed
  // URL. Tickets only if the ticketing module is enabled; about is always on.
  const slug = tenant.slug;
  const ticketingOn = isModuleEnabled("ticketing");
  const hasPresale = !!slug && ticketingOn;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-md rounded-3xl border border-border/50 bg-card/70 p-8 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-primary/25 bg-primary/10">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground">This museum is not open yet</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {hasPresale
            ? `${tenant.name || "This museum"} opens soon — reserve your presale tickets now and we'll let you in the moment it launches.`
            : `${tenant.name || "This museum"} is still preparing its experience. Check back soon.`}
        </p>
        {hasPresale && (
          <Button asChild className="mt-6 w-full bg-primary text-primary-foreground">
            <Link to={museumPath(slug, "tickets")}>
              <Ticket className="h-4 w-4" /> Buy presale tickets
            </Link>
          </Button>
        )}
        {slug && (
          <Button asChild variant="outline" className="mt-3 w-full">
            <Link to={museumPath(slug, "about")}>
              <Info className="h-4 w-4" /> About this museum
            </Link>
          </Button>
        )}
        <Button asChild variant="ghost" className="mt-3 w-full">
          <Link to="/virtual-experience">Explore available museums</Link>
        </Button>
      </div>
    </main>
  );
}
