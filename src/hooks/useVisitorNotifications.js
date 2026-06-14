import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { getOrCreateVisitorId } from "@/lib/avatar-config";

// Loads the current visitor's return-trigger notifications (new exhibit
// available, ticket unlocks a new room, saved artifact updated, a friend
// visited the same room, collection incomplete, etc. - see
// visitor_notifications in 0023_visitor_engagement.sql).
// Notifications are created by the platform (admin/service role), so this
// hook only reads and lets the visitor mark-as-read or dismiss their own.
export default function useVisitorNotifications(tenantId) {
  const { user, isAuthenticated, authChecked } = useAuth();
  const queryClient = useQueryClient();

  const userId = isAuthenticated ? user?.id : null;
  const visitorId = useMemo(() => (isAuthenticated ? null : getOrCreateVisitorId()), [isAuthenticated]);
  const ownerKey = userId || visitorId;
  const ownerFilter = useMemo(() => (userId ? { user_id: userId } : { visitor_id: visitorId }), [userId, visitorId]);
  const enabled = !!ownerKey && authChecked;

  const filter = useMemo(
    () => (tenantId ? { ...ownerFilter, tenant_id: tenantId } : ownerFilter),
    [ownerFilter, tenantId]
  );

  const notificationsQuery = useQuery({
    queryKey: ["visitor-notifications", ownerKey, tenantId || null],
    enabled,
    queryFn: () => base44.entities.VisitorNotification.filter(filter, "-createdAt"),
    initialData: [],
  });

  const notifications = notificationsQuery.data;
  const unreadCount = notifications.filter((item) => !item.isRead).length;

  const invalidate = useCallback(() => queryClient.invalidateQueries({
    queryKey: ["visitor-notifications", ownerKey, tenantId || null],
  }), [queryClient, ownerKey, tenantId]);

  // Only act on notifications the visitor actually owns (i.e. present in their
  // loaded, owner-filtered list). For authenticated users RLS enforces this on
  // the server; the check keeps the client from acting on unowned/stale ids.
  const markAsRead = useCallback(async (id) => {
    if (!notifications.some((item) => item.id === id)) return null;
    const result = await base44.entities.VisitorNotification.update(id, { is_read: true });
    await invalidate();
    return result;
  }, [notifications, invalidate]);

  const markAllAsRead = useCallback(async () => {
    const unread = notifications.filter((item) => !item.isRead);
    if (!unread.length) return;
    await Promise.all(unread.map((item) => base44.entities.VisitorNotification.update(item.id, { is_read: true })));
    await invalidate();
  }, [notifications, invalidate]);

  const dismiss = useCallback(async (id) => {
    if (!notifications.some((item) => item.id === id)) return;
    await base44.entities.VisitorNotification.delete(id);
    await invalidate();
  }, [notifications, invalidate]);

  return {
    notifications,
    unreadCount,
    isLoading: !authChecked || notificationsQuery.isLoading,
    markAsRead,
    markAllAsRead,
    dismiss,
  };
}
