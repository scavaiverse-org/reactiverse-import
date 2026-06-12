import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { getOrCreateVisitorId, buildAvatarRow, configFromAvatarRow } from "@/lib/avatar-config";
import { deleteAvatarMedia } from "@/lib/upload";

// Loads, saves, and deletes the current visitor's platform-wide avatar
// profile. Authenticated visitors are keyed by auth.uid() (user_id);
// anonymous visitors are keyed by a localStorage-held visitor_id.
export default function useAvatarProfile() {
  const { user, isAuthenticated, authChecked } = useAuth();
  const queryClient = useQueryClient();

  const userId = isAuthenticated ? user?.id : null;
  const visitorId = useMemo(() => (isAuthenticated ? null : getOrCreateVisitorId()), [isAuthenticated]);
  const ownerKey = userId || visitorId;

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["avatar-profile", ownerKey],
    enabled: !!ownerKey && authChecked,
    queryFn: () => (userId
      ? base44.entities.Avatar.filter({ user_id: userId }, null, 1)
      : base44.entities.Avatar.filter({ visitor_id: visitorId }, null, 1)),
    initialData: [],
  });

  const avatar = rows[0] || null;

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["avatar-profile", ownerKey] }),
    [queryClient, ownerKey]
  );

  const saveAvatar = useCallback(async (config) => {
    const payload = buildAvatarRow(config, { userId, visitorId });
    const result = avatar?.id
      ? await base44.entities.Avatar.update(avatar.id, payload)
      : await base44.entities.Avatar.create(payload);
    await invalidate();
    return result;
  }, [avatar?.id, userId, visitorId, invalidate]);

  const deleteAvatar = useCallback(async () => {
    if (!avatar?.id) return;
    await Promise.all([
      deleteAvatarMedia(avatar.face_cutout_url),
      deleteAvatarMedia(avatar.body_cutout_url),
    ]);
    await base44.entities.Avatar.delete(avatar.id);
    await invalidate();
  }, [avatar, invalidate]);

  return {
    avatar,
    config: configFromAvatarRow(avatar),
    hasAvatar: !!avatar,
    isLoading: isLoading || !authChecked,
    ownerKey,
    userId,
    visitorId,
    saveAvatar,
    deleteAvatar,
  };
}
