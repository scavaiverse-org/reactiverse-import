import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Receipt, CheckCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// Live admin notification bell. Reads admin_notifications and subscribes to
// realtime inserts (a DB trigger creates one whenever a payment proof is
// submitted), so admins are notified of new pre-sale submissions instantly.
export default function NotificationBell() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const { data: notifications = [] } = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: () => base44.entities.AdminNotification.list("-created_at", 50),
    initialData: [],
    refetchInterval: 60000,
  });

  // Realtime: refetch on any change to admin_notifications.
  useEffect(() => {
    const unsubscribe = base44.entities.AdminNotification.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["uen-pending-count"] });
    });
    return unsubscribe;
  }, [queryClient]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  const unread = notifications.filter((n) => !n.isRead).length;

  const markAllRead = async () => {
    const toMark = notifications.filter((n) => !n.isRead);
    if (!toMark.length) return;
    try {
      await Promise.all(toMark.map((n) => base44.entities.AdminNotification.update(n.id, { is_read: true })));
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    }
  };

  const markOne = async (id) => {
    try {
      await base44.entities.AdminNotification.update(id, { is_read: true });
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/5 text-muted-foreground transition hover:text-foreground"
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-black">{unread > 99 ? "99+" : unread}</span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-10 z-50 w-72 overflow-hidden rounded-xl border border-white/10 bg-[#0b1322] shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
            <p className="text-xs font-semibold">Notifications</p>
            {unread > 0 && (
              <button onClick={markAllRead} className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline">
                <CheckCheck className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  to={n.link || "/platform/admin/uen"}
                  onClick={() => { markOne(n.id); setOpen(false); }}
                  className={`flex gap-2.5 border-b border-white/5 px-3 py-2.5 transition hover:bg-white/[0.04] ${n.isRead ? "opacity-60" : ""}`}
                >
                  <Receipt className={`mt-0.5 h-4 w-4 shrink-0 ${n.isRead ? "text-muted-foreground" : "text-amber-400"}`} />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold">{n.title}</p>
                    {n.message && <p className="truncate text-[11px] text-muted-foreground">{n.message}</p>}
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.isRead && <span className="ml-auto mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />}
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
