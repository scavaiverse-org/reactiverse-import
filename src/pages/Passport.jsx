import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Award, Compass, ImageOff, Loader2, MapPin, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { getOrCreateVisitorId } from "@/lib/avatar-config";
import { getBadgeDefinition } from "@/lib/badge-definitions";
import { museumWalkthroughPath, museumPath } from "@/lib/domain-registry";
import PlatformShell from "@/components/platform/PlatformShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

async function anonVisitorData(action, visitor_id, params = {}) {
  const { data: result, error } = await supabase.functions.invoke("visitor-data", {
    body: { visitor_id, action, ...params },
  });
  if (error) throw error;
  if (result?.error) throw new Error(result.error);
  return result?.data ?? [];
}

// "My SCAVerse Passport" — a cross-museum record of a visitor's progress:
// journeys in progress (continue-your-journey), completed tours, collected
// artifacts, and earned badges. Authenticated visitors are keyed by
// auth.uid() (so this is the same across devices); anonymous visitors are
// keyed by a visitor_id held only in localStorage (see getOrCreateVisitorId),
// with the actual progress data living in Supabase.
export default function Passport() {
  const { user, isAuthenticated, authChecked } = useAuth();
  const { tenants = [] } = useActiveTenant();

  const userId = isAuthenticated ? user?.id : null;
  const visitorId = isAuthenticated ? null : getOrCreateVisitorId();
  const ownerKey = userId || visitorId;
  const ownerFilter = useMemo(() => (userId ? { user_id: userId } : { visitor_id: visitorId }), [userId, visitorId]);
  const enabled = !!ownerKey && authChecked;

  const { data: journeys = [], isLoading: loadingJourneys } = useQuery({
    queryKey: ["passport-journeys", ownerKey],
    enabled,
    queryFn: isAuthenticated
      ? () => base44.entities.VisitorJourney.filter(ownerFilter, "-last_visited_at")
      : () => anonVisitorData("get_all_journeys", visitorId),
    initialData: [],
  });

  const { data: collectibles = [], isLoading: loadingCollectibles } = useQuery({
    queryKey: ["passport-collectibles", ownerKey],
    enabled: enabled && journeys.length > 0,
    queryFn: isAuthenticated
      ? () => base44.entities.VisitorCollectible.filter(ownerFilter, "-collected_at")
      : async () => {
          const allResults = await Promise.all(
            journeys.map((j) => anonVisitorData("get_collectibles", visitorId, { tenant_id: j.tenant_id, walkthrough_key: j.walkthrough_key }))
          );
          return allResults.flat();
        },
    initialData: [],
  });

  const { data: badges = [], isLoading: loadingBadges } = useQuery({
    queryKey: ["passport-badges", ownerKey],
    enabled,
    queryFn: isAuthenticated
      ? () => base44.entities.VisitorBadge.filter(ownerFilter)
      : () => anonVisitorData("get_badges", visitorId),
    initialData: [],
  });

  const tenantsById = useMemo(() => new Map(tenants.map((tenant) => [tenant.id, tenant])), [tenants]);
  const tenantLabel = (tenantId) => tenantsById.get(tenantId)?.name || "A SCAVerse museum";
  // Fall back to the tenant id when the slug isn't in the loaded tenants list
  // (e.g. limited list for anonymous visitors) so links never become
  // "/museum/undefined/...". A non-matching id 404s gracefully instead.
  const tenantSlug = (tenantId) => tenantsById.get(tenantId)?.slug || tenantId;

  const inProgress = journeys.filter((journey) => journey.status === "in_progress");
  const completedJourneys = journeys.filter((journey) => journey.status === "completed");
  const roomsVisited = journeys.reduce((sum, journey) => sum + (journey.visited_room_keys?.length || 0), 0);
  const museumsExplored = new Set(journeys.map((journey) => journey.tenant_id)).size;

  const isLoading = !authChecked || loadingJourneys || loadingCollectibles || loadingBadges;
  const hasAnyProgress = journeys.length > 0 || collectibles.length > 0 || badges.length > 0;

  return (
    <PlatformShell>
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="max-w-3xl">
          <p className="font-display text-[10px] font-medium uppercase tracking-[0.5em] text-primary/70">My SCAVerse Passport</p>
          <h1 className="mt-5 font-heading text-4xl font-semibold tracking-tight text-foreground sm:text-6xl">Your journey across SCAVerse.</h1>
          <p className="mt-5 font-body text-base font-light leading-relaxed text-muted-foreground">
            Rooms you've explored, artifacts you've collected, and badges you've earned — all in one place.
            {!isAuthenticated && " Sign in to keep this passport with you across devices."}
          </p>
        </div>

        {isLoading ? (
          <div className="mt-12 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading your passport…
          </div>
        ) : !hasAnyProgress ? (
          <div className="mt-12 rounded-3xl border border-border/50 bg-card/60 p-10 text-center">
            <Compass className="mx-auto mb-4 h-10 w-10 text-primary" />
            <h2 className="font-display text-2xl font-bold">Your passport is empty — for now.</h2>
            <p className="mt-2 text-sm text-muted-foreground">Start a museum walkthrough to begin tracking your progress, collectibles, and badges.</p>
            <Button asChild className="mt-6 bg-primary text-primary-foreground">
              <Link to="/virtual-experience">Explore Museums <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="mt-12 grid gap-4 sm:grid-cols-4">
              <StatCard label="Museums explored" value={museumsExplored} />
              <StatCard label="Rooms visited" value={roomsVisited} />
              <StatCard label="Artifacts collected" value={collectibles.length} />
              <StatCard label="Badges earned" value={badges.length} />
            </div>

            {inProgress.length > 0 && (
              <div className="mt-14">
                <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">Continue your journey</h2>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {inProgress.map((journey) => (
                    <Card key={journey.id} className="border-border/40 bg-card/50">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary"><MapPin className="h-3.5 w-3.5" /> {tenantLabel(journey.tenant_id)}</div>
                        <p className="mt-3 text-sm text-muted-foreground">
                          {journey.visited_room_keys?.length || 0} of {journey.total_rooms || "?"} rooms visited · {journey.percent_complete || 0}% complete
                        </p>
                        <Progress value={journey.percent_complete || 0} className="mt-3" />
                        <Button asChild className="mt-5 bg-primary text-primary-foreground">
                          <Link to={museumWalkthroughPath(tenantSlug(journey.tenant_id), journey.walkthrough_key)}>
                            Resume Tour <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {completedJourneys.length > 0 && (
              <div className="mt-14">
                <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">Completed tours</h2>
                <div className="mt-5 flex flex-wrap gap-3">
                  {completedJourneys.map((journey) => (
                    <Link key={journey.id} to={museumPath(tenantSlug(journey.tenant_id), "home")}>
                      <Badge className="bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20">
                        <Sparkles className="h-3.5 w-3.5" /> {tenantLabel(journey.tenant_id)} — Full Tour
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {badges.length > 0 && (
              <div className="mt-14">
                <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">Badges earned</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {badges.map((badge) => {
                    const definition = getBadgeDefinition(badge.badge_key);
                    return (
                      <Card key={badge.id} className="border-border/40 bg-card/50">
                        <CardContent className="flex items-start gap-3 p-5">
                          <Award className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                          <div>
                            <p className="font-semibold text-foreground">{definition?.title || badge.badge_key}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{definition?.description}</p>
                            {badge.tenant_id !== "platform" && (
                              <p className="mt-1 text-xs text-primary">{tenantLabel(badge.tenant_id)}</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {collectibles.length > 0 && (
              <div className="mt-14">
                <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">Collected artifacts</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {collectibles.map((item) => (
                    <Card key={item.id} className="overflow-hidden border-border/40 bg-card/50">
                      {item.artifact_image_url ? (
                        <img src={item.artifact_image_url} alt={item.artifact_title || "Collected artifact"} className="h-28 w-full object-cover" />
                      ) : (
                        <div className="flex h-28 w-full items-center justify-center bg-muted/30 text-muted-foreground"><ImageOff className="h-6 w-6" /></div>
                      )}
                      <CardContent className="p-4">
                        <p className="truncate text-sm font-semibold text-foreground">{item.artifact_title || "Untitled artifact"}</p>
                        <p className="mt-1 truncate text-xs text-muted-foreground">{tenantLabel(item.tenant_id)}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </PlatformShell>
  );
}

function StatCard({ label, value }) {
  return (
    <Card className="border-border/40 bg-card/50">
      <CardContent className="p-5">
        <p className="font-heading text-3xl font-bold text-foreground">{value}</p>
        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
