import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Loader2, Sparkles, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import MuseumGateShell from "@/components/tenant/MuseumGateShell";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { DEFAULT_MUSEUM_SLUG, museumPath } from "@/lib/domain-registry";
import { WALKTHROUGHS } from "@/lib/walkthrough-admin";
import { ensureMediaTypes } from "@/lib/walkthrough-media-bindings";
import { trackWalkthroughEvent } from "@/lib/walkthrough-analytics";
import { fetchPublishedManifest, getWalkthroughByIndex } from "@/lib/manifest-public";
import { useTourAccess } from "@/lib/ticket-access";
import WalkthroughExperienceRunner from "@/components/walkthrough/WalkthroughExperienceRunner";

function resolveWalkthroughIndex(params) {
  if (params.walkthroughIndex) {
    const parsed = Number(params.walkthroughIndex);
    if (Number.isFinite(parsed) && parsed >= 1) return parsed;
  }
  if (params.walkthroughKey) {
    const slot = WALKTHROUGHS.indexOf(params.walkthroughKey);
    if (slot >= 0) return slot + 1;
  }
  return 1;
}

export default function Walkthrough() {
  const { tenant } = useActiveTenant();
  const navigate = useNavigate();
  const params = useParams();
  const walkthroughIndex = resolveWalkthroughIndex(params);

  const { data: manifest } = useQuery({
    queryKey: ["published-manifest", tenant?.id, tenant?.published_manifest_id],
    queryFn: () => fetchPublishedManifest(tenant),
    enabled: !!tenant?.id,
    initialData: null,
  });

  const { hasAccess, checking: checkingAccess, staffBypass } = useTourAccess(tenant);

  const walkthrough = getWalkthroughByIndex(manifest, walkthroughIndex);
  const rooms = useMemo(() => (walkthrough?.rooms || []).map((room) => ensureMediaTypes(room)), [walkthrough]);
  const tenantSlug = tenant?.slug || DEFAULT_MUSEUM_SLUG;
  const museumId = manifest?.museum_id || tenant?.id;
  const walkthroughKey = walkthrough?.walkthrough_key;

  if (checkingAccess) {
    return (
      <MuseumGateShell>
        <Loader2 className="mx-auto h-7 w-7 animate-spin text-primary" />
        <p className="mt-4 text-lg font-medium text-foreground">Checking your ticket…</p>
      </MuseumGateShell>
    );
  }

  if (!hasAccess) {
    return (
      <MuseumGateShell>
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.32em] text-primary shadow-lg shadow-primary/10 backdrop-blur">
          <Ticket className="h-3.5 w-3.5" /> Ticket required
        </div>
        <h1 className="font-heading text-4xl font-bold tracking-tight drop-shadow-2xl sm:text-5xl">Your ticket unlocks this tour</h1>
        <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-muted-foreground sm:text-base">Tour access opens the moment your ticket is paid or confirmed. Reserve yours to step inside, or check your reservation status.</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" className="bg-primary text-primary-foreground shadow-lg shadow-primary/25" onClick={() => navigate(museumPath(tenantSlug, "tickets"))}>
            <Ticket className="h-4 w-4" /> Get Tickets <ArrowRight className="h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline" className="border-white/15 bg-white/5 backdrop-blur" onClick={() => navigate(museumPath(tenantSlug, "tickets-5"))}>Check Reservation</Button>
        </div>
        <Button variant="ghost" className="mt-4 text-muted-foreground hover:text-foreground" onClick={() => navigate(museumPath(tenantSlug, "home"))}>Back to Museum Home</Button>
      </MuseumGateShell>
    );
  }

  if (!manifest || !walkthrough || !rooms.length) {
    // A paying visitor with a confirmed ticket shouldn't hit a bare "not
    // published" wall before launch — reassure them their pre-booking is safe.
    // Staff previewing (staffBypass) still get the plain unpublished notice.
    if (!staffBypass) {
      return (
        <MuseumGateShell>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.32em] text-emerald-300 shadow-lg shadow-emerald-400/10 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> You&apos;re in
          </div>
          <h1 className="font-heading text-4xl font-bold tracking-tight drop-shadow-2xl sm:text-5xl">You&apos;re confirmed — your spot is reserved</h1>
          <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-muted-foreground sm:text-base">{tenant?.name || "The museum"} is putting the finishing touches on the experience. It isn&apos;t open just yet — but your ticket is locked in, and we&apos;ll email you the moment it goes live.</p>
          <Button size="lg" variant="outline" className="mt-8 border-white/15 bg-white/5 backdrop-blur" onClick={() => navigate(museumPath(tenantSlug, "home"))}>Back to Museum Home</Button>
        </MuseumGateShell>
      );
    }
    return (
      <MuseumGateShell>
        <p className="text-lg font-medium text-foreground">This experience has not been published yet.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(museumPath(tenantSlug, "home"))}>Back to Museum Home</Button>
      </MuseumGateShell>
    );
  }

  const handleTrack = (eventName, { room, ...data }) => trackWalkthroughEvent({ eventName, tenant, museumId, walkthroughKey, room, data });

  return (
    <WalkthroughExperienceRunner
      rooms={rooms}
      tenantSlug={tenantSlug}
      onExitStart={() => navigate(museumPath(tenantSlug, "home"))}
      onComplete={() => navigate(museumPath(tenantSlug, "completion"))}
      onTrack={handleTrack}
      onNavigateRoute={navigate}
    />
  );
}
