import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import { getOrCreateVisitorId } from "@/lib/avatar-config";
import { defaultJourney, buildJourneyRow, recordRoomVisit, recordRoomSkip, recordArtifactViewed } from "@/lib/visitor-journey";
import { evaluateNewBadges } from "@/lib/badge-definitions";

// Invoke the visitor-data Edge Function (anon path only).
// Returns the parsed `data` field or throws on error.
async function visitorDataFn(action, visitor_id, params = {}) {
  const { data: result, error } = await supabase.functions.invoke("visitor-data", {
    body: { visitor_id, action, ...params },
  });
  if (error) throw error;
  if (result?.error) throw new Error(result.error);
  return result?.data ?? null;
}

// Loads and updates the current visitor's journey (memory + progress),
// collected artifacts, and earned badges for a given tenant + walkthrough.
//
// Authenticated visitors are keyed by auth.uid() — all reads/writes go
// directly to PostgREST (owner_* RLS policies enforce ownership).
// Anonymous visitors are keyed by a localStorage-held visitor_id and all
// reads/writes go through the visitor-data Edge Function, which uses
// service_role with an explicit visitor_id filter so Postgres cannot be
// exploited by an anon caller guessing another visitor's UUID.
export default function useVisitorJourney(tenantId, walkthroughKey) {
  const { user, isAuthenticated, authChecked } = useAuth();
  const queryClient = useQueryClient();

  const userId = isAuthenticated ? user?.id : null;
  const visitorId = useMemo(() => (isAuthenticated ? null : getOrCreateVisitorId()), [isAuthenticated]);
  const ownerKey = userId || visitorId;
  const ownerFilter = useMemo(() => (userId ? { user_id: userId } : { visitor_id: visitorId }), [userId, visitorId]);
  const enabled = !!ownerKey && !!tenantId && !!walkthroughKey && authChecked;

  // ── Query helpers ────────────────────────────────────────────────────────

  const journeyQuery = useQuery({
    queryKey: ["visitor-journey", ownerKey, tenantId, walkthroughKey],
    enabled,
    queryFn: isAuthenticated
      ? () => base44.entities.VisitorJourney.filter({ ...ownerFilter, tenant_id: tenantId, walkthrough_key: walkthroughKey }, null, 1)
      : async () => {
          const data = await visitorDataFn("get_journey", visitorId, { tenant_id: tenantId, walkthrough_key: walkthroughKey });
          return Array.isArray(data) ? data : data ? [data] : [];
        },
    initialData: [],
  });

  const collectiblesQuery = useQuery({
    queryKey: ["visitor-collectibles", ownerKey, tenantId, walkthroughKey],
    enabled,
    queryFn: isAuthenticated
      ? () => base44.entities.VisitorCollectible.filter({ ...ownerFilter, tenant_id: tenantId, walkthrough_key: walkthroughKey })
      : () => visitorDataFn("get_collectibles", visitorId, { tenant_id: tenantId, walkthrough_key: walkthroughKey }).then((d) => d ?? []),
    initialData: [],
  });

  const badgesQuery = useQuery({
    queryKey: ["visitor-badges", ownerKey, tenantId],
    enabled,
    queryFn: isAuthenticated
      ? () => base44.entities.VisitorBadge.filter({ ...ownerFilter, tenant_id: tenantId })
      : () => visitorDataFn("get_badges", visitorId, { tenant_id: tenantId }).then((d) => d ?? []),
    initialData: [],
  });

  const journey = journeyQuery.data[0] || null;
  const collectibles = collectiblesQuery.data;
  const badges = badgesQuery.data;

  const invalidate = useCallback(() => Promise.all([
    queryClient.invalidateQueries({ queryKey: ["visitor-journey", ownerKey, tenantId, walkthroughKey] }),
    queryClient.invalidateQueries({ queryKey: ["visitor-collectibles", ownerKey, tenantId, walkthroughKey] }),
    queryClient.invalidateQueries({ queryKey: ["visitor-badges", ownerKey, tenantId] }),
  ]), [queryClient, ownerKey, tenantId, walkthroughKey]);

  // ── Writes ────────────────────────────────────────────────────────────────

  const saveJourney = useCallback(async (nextJourney) => {
    const payload = buildJourneyRow(nextJourney, { userId, visitorId, tenantId, walkthroughKey });
    let result;
    if (isAuthenticated) {
      result = journey?.id
        ? await base44.entities.VisitorJourney.update(journey.id, payload)
        : await base44.entities.VisitorJourney.create(payload);
    } else {
      result = await visitorDataFn("save_journey", visitorId, {
        tenant_id: tenantId,
        walkthrough_key: walkthroughKey,
        payload,
      });
    }
    await invalidate();
    return result;
  }, [journey?.id, userId, visitorId, tenantId, walkthroughKey, isAuthenticated, invalidate]);

  // collectiblesOverride lets a caller pass the just-updated collectibles list
  // when the query cache hasn't refreshed yet (e.g. right after collecting an
  // artifact), so count-based badges are evaluated against current data.
  const awardNewBadges = useCallback(async (updatedJourney, collectiblesOverride) => {
    const newBadges = evaluateNewBadges({
      journey: updatedJourney,
      collectibles: collectiblesOverride ?? collectibles,
      totalArtifacts: 0,
      earnedBadgeKeys: badges.map((badge) => badge.badge_key || badge.badgeKey),
    });
    if (!newBadges.length) return;
    if (isAuthenticated) {
      await Promise.all(newBadges.map(({ badge_key, tenant_id }) =>
        base44.entities.VisitorBadge.create({ ...ownerFilter, tenant_id, badge_key })));
    } else {
      await Promise.all(newBadges.map(({ badge_key, tenant_id }) =>
        visitorDataFn("add_badge", visitorId, { tenant_id, payload: { badge_key } })));
    }
    await invalidate();
  }, [collectibles, badges, ownerFilter, visitorId, isAuthenticated, invalidate]);

  // ── Public API ────────────────────────────────────────────────────────────

  const visitRoom = useCallback(async (roomKey, totalRooms) => {
    if (!enabled) return null;
    const base = journey || defaultJourney(tenantId, walkthroughKey, totalRooms);
    const updated = recordRoomVisit(base, roomKey, totalRooms);
    const result = await saveJourney(updated);
    await awardNewBadges(updated);
    return result;
  }, [enabled, journey, tenantId, walkthroughKey, saveJourney, awardNewBadges]);

  const skipRoom = useCallback(async (roomKey) => {
    if (!enabled) return null;
    const base = journey || defaultJourney(tenantId, walkthroughKey);
    return saveJourney(recordRoomSkip(base, roomKey));
  }, [enabled, journey, tenantId, walkthroughKey, saveJourney]);

  const viewArtifact = useCallback(async (artifactKey) => {
    if (!enabled) return null;
    const base = journey || defaultJourney(tenantId, walkthroughKey);
    return saveJourney(recordArtifactViewed(base, artifactKey));
  }, [enabled, journey, tenantId, walkthroughKey, saveJourney]);

  const collectArtifact = useCallback(async ({ artifactKey, roomKey, title, imageUrl }) => {
    if (!enabled) return null;
    if (collectibles.some((item) => (item.artifactKey || item.artifact_key) === artifactKey)) return null;
    let result;
    if (isAuthenticated) {
      result = await base44.entities.VisitorCollectible.create({
        ...ownerFilter,
        tenant_id: tenantId,
        walkthrough_key: walkthroughKey,
        room_key: roomKey,
        artifact_key: artifactKey,
        artifact_title: title,
        artifact_image_url: imageUrl,
      });
    } else {
      result = await visitorDataFn("add_collectible", visitorId, {
        tenant_id: tenantId,
        walkthrough_key: walkthroughKey,
        payload: {
          tenant_id: tenantId,
          walkthrough_key: walkthroughKey,
          room_key: roomKey,
          artifact_key: artifactKey,
          artifact_title: title,
          artifact_image_url: imageUrl,
        },
      });
    }
    await invalidate();
    // Evaluate badges against the collectibles list including the one just
    // collected — the query cache hasn't refreshed yet, so the closure's
    // `collectibles` is still pre-insert and would miss count-based badges.
    const updatedCollectibles = [...collectibles, { artifact_key: artifactKey, room_key: roomKey }];
    await awardNewBadges(journey || defaultJourney(tenantId, walkthroughKey), updatedCollectibles);
    return result;
  }, [enabled, collectibles, ownerFilter, visitorId, tenantId, walkthroughKey, isAuthenticated, invalidate, awardNewBadges, journey]);

  return {
    journey,
    collectibles,
    badges,
    isLoading: !authChecked || journeyQuery.isLoading || collectiblesQuery.isLoading || badgesQuery.isLoading,
    ownerKey,
    visitRoom,
    skipRoom,
    viewArtifact,
    collectArtifact,
  };
}
