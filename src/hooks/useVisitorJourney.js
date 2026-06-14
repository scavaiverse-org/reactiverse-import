import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { getOrCreateVisitorId } from "@/lib/avatar-config";
import { defaultJourney, buildJourneyRow, recordRoomVisit, recordRoomSkip, recordArtifactViewed } from "@/lib/visitor-journey";
import { evaluateNewBadges } from "@/lib/badge-definitions";

// Loads and updates the current visitor's journey (memory + progress),
// collected artifacts, and earned badges for a given tenant + walkthrough.
// Authenticated visitors are keyed by auth.uid(); anonymous visitors by a
// localStorage-held visitor_id (see getOrCreateVisitorId).
export default function useVisitorJourney(tenantId, walkthroughKey) {
  const { user, isAuthenticated, authChecked } = useAuth();
  const queryClient = useQueryClient();

  const userId = isAuthenticated ? user?.id : null;
  const visitorId = useMemo(() => (isAuthenticated ? null : getOrCreateVisitorId()), [isAuthenticated]);
  const ownerKey = userId || visitorId;
  const ownerFilter = useMemo(() => (userId ? { user_id: userId } : { visitor_id: visitorId }), [userId, visitorId]);
  const enabled = !!ownerKey && !!tenantId && !!walkthroughKey && authChecked;

  const journeyQuery = useQuery({
    queryKey: ["visitor-journey", ownerKey, tenantId, walkthroughKey],
    enabled,
    queryFn: () => base44.entities.VisitorJourney.filter({ ...ownerFilter, tenant_id: tenantId, walkthrough_key: walkthroughKey }, null, 1),
    initialData: [],
  });

  const collectiblesQuery = useQuery({
    queryKey: ["visitor-collectibles", ownerKey, tenantId, walkthroughKey],
    enabled,
    queryFn: () => base44.entities.VisitorCollectible.filter({ ...ownerFilter, tenant_id: tenantId, walkthrough_key: walkthroughKey }),
    initialData: [],
  });

  const badgesQuery = useQuery({
    queryKey: ["visitor-badges", ownerKey, tenantId],
    enabled,
    queryFn: () => base44.entities.VisitorBadge.filter({ ...ownerFilter, tenant_id: tenantId }),
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

  const saveJourney = useCallback(async (nextJourney) => {
    const payload = buildJourneyRow(nextJourney, { userId, visitorId, tenantId, walkthroughKey });
    const result = journey?.id
      ? await base44.entities.VisitorJourney.update(journey.id, payload)
      : await base44.entities.VisitorJourney.create(payload);
    await invalidate();
    return result;
  }, [journey?.id, userId, visitorId, tenantId, walkthroughKey, invalidate]);

  const awardNewBadges = useCallback(async (updatedJourney) => {
    const newBadges = evaluateNewBadges({
      journey: updatedJourney,
      collectibles,
      totalArtifacts: 0,
      earnedBadgeKeys: badges.map((badge) => badge.badgeKey),
    });
    if (!newBadges.length) return;
    await Promise.all(newBadges.map(({ badge_key, tenant_id }) =>
      base44.entities.VisitorBadge.create({ ...ownerFilter, tenant_id, badge_key })));
    await invalidate();
  }, [collectibles, badges, ownerFilter, invalidate]);

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
    if (collectibles.some((item) => item.artifactKey === artifactKey)) return null;
    const result = await base44.entities.VisitorCollectible.create({
      ...ownerFilter,
      tenant_id: tenantId,
      walkthrough_key: walkthroughKey,
      room_key: roomKey,
      artifact_key: artifactKey,
      artifact_title: title,
      artifact_image_url: imageUrl,
    });
    await invalidate();
    await awardNewBadges(journey || defaultJourney(tenantId, walkthroughKey));
    return result;
  }, [enabled, collectibles, ownerFilter, tenantId, walkthroughKey, invalidate, awardNewBadges, journey]);

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
