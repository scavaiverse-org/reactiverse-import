import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { DEFAULT_MUSEUM_SLUG, museumPath } from "@/lib/domain-registry";
import { WALKTHROUGHS } from "@/lib/walkthrough-admin";
import { ensureMediaTypes } from "@/lib/walkthrough-media-bindings";
import { trackWalkthroughEvent } from "@/lib/walkthrough-analytics";
import { fetchPublishedManifest, getWalkthroughByIndex } from "@/lib/manifest-public";
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

  const walkthrough = getWalkthroughByIndex(manifest, walkthroughIndex);
  const rooms = useMemo(() => (walkthrough?.rooms || []).map((room) => ensureMediaTypes(room)), [walkthrough]);
  const tenantSlug = tenant?.slug || DEFAULT_MUSEUM_SLUG;
  const museumId = manifest?.museum_id || tenant?.id;
  const walkthroughKey = walkthrough?.walkthrough_key;

  if (!manifest || !walkthrough || !rooms.length) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center text-muted-foreground">
        <p className="text-lg font-medium text-foreground">This experience has not been published yet.</p>
        <Button variant="outline" onClick={() => navigate(museumPath(tenantSlug, "home"))}>Back to Museum Home</Button>
      </div>
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
