import { Link } from "react-router-dom";
import { ArrowRight, Info, Sparkles, Ticket } from "lucide-react";
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-16 text-foreground">
      {/* Cinematic backdrop: warm glow, cool accent, and a field of soft twinkles */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,hsla(43,100%,56%,0.14),transparent_45%),radial-gradient(circle_at_bottom_right,hsla(190,80%,60%,0.07),transparent_42%)]" />
      <div className="pointer-events-none absolute -top-28 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/20 blur-[130px] animate-pulse" />
      <div className="pointer-events-none absolute bottom-0 right-6 h-80 w-80 rounded-full bg-cyan-400/10 blur-[130px]" />
      <div className="pointer-events-none absolute inset-0 opacity-50">
        {[...Array(24)].map((_, i) => (
          <span
            key={i}
            className="absolute h-1 w-1 animate-pulse rounded-full bg-primary/50"
            style={{ left: `${(i * 41) % 100}%`, top: `${(i * 23) % 100}%`, animationDelay: `${(i % 6) * 0.4}s` }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-2xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.32em] text-primary shadow-lg shadow-primary/10 backdrop-blur">
          <Sparkles className="h-3.5 w-3.5 animate-pulse" /> Premiere · Opening Soon
        </div>
        <p className="font-display text-[11px] uppercase tracking-[0.42em] text-muted-foreground">Now in pre-sale</p>
        <h1 className="mt-4 bg-gradient-to-br from-foreground via-foreground to-primary bg-clip-text font-heading text-5xl font-bold leading-[0.95] tracking-tight text-transparent drop-shadow-2xl sm:text-7xl">
          {tenant.name || "This museum"}
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {hasPresale
            ? "The doors are about to open. Reserve your pre-sale ticket now and be among the first inside the moment it launches."
            : `${tenant.name || "This museum"} is crafting something special. Check back soon.`}
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {hasPresale && (
            <Button asChild size="lg" className="bg-primary text-primary-foreground shadow-lg shadow-primary/25">
              <Link to={museumPath(slug, "tickets")}>
                <Ticket className="h-4 w-4" /> Reserve Pre-Sale Tickets <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
          {slug && (
            <Button asChild variant="outline" size="lg" className="border-white/15 bg-white/5 backdrop-blur">
              <Link to={museumPath(slug, "about")}>
                <Info className="h-4 w-4" /> About this museum
              </Link>
            </Button>
          )}
        </div>
        <Button asChild variant="ghost" className="mt-4 text-muted-foreground hover:text-foreground">
          <Link to="/virtual-experience">Explore available museums</Link>
        </Button>
      </div>
    </main>
  );
}
