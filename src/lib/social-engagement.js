// Helpers for the social/community return-trigger systems: tenant
// guestbooks, per-room comments, tenant-hosted events, and the exploration
// leaderboard (see guestbook_entries, room_comments, tenant_events, and
// public.get_tenant_leaderboard() in 0023_visitor_engagement.sql).
//
// Guestbook entries and room comments are publicly readable when not
// hidden, and use the same user_id/visitor_id ownership pattern as avatars
// and visitor journeys for writes.

import { supabase } from "@/lib/supabase";
import { base44 } from "@/api/base44Client";

// Builds the row payload for base44.entities.GuestbookEntry.create.
export function buildGuestbookEntryRow({ userId, visitorId, tenantId, displayName, message }) {
  if (!userId && !visitorId) {
    throw new Error("Either userId or visitorId must be provided");
  }
  const trimmedMessage = String(message || "").trim();
  if (!trimmedMessage) {
    throw new Error("Message cannot be empty");
  }
  return {
    user_id: userId || null,
    visitor_id: userId ? null : visitorId,
    tenant_id: tenantId,
    display_name: displayName || "Explorer",
    message: trimmedMessage,
  };
}

// Builds the row payload for base44.entities.RoomComment.create.
export function buildRoomCommentRow({ userId, visitorId, tenantId, walkthroughKey, roomKey, displayName, message }) {
  if (!userId && !visitorId) {
    throw new Error("Either userId or visitorId must be provided");
  }
  const trimmedMessage = String(message || "").trim();
  if (!trimmedMessage) {
    throw new Error("Message cannot be empty");
  }
  return {
    user_id: userId || null,
    visitor_id: userId ? null : visitorId,
    tenant_id: tenantId,
    walkthrough_key: walkthroughKey,
    room_key: roomKey,
    display_name: displayName || "Explorer",
    message: trimmedMessage,
  };
}

// Recent, non-hidden guestbook entries for a tenant's visitor wall.
export async function fetchGuestbookEntries(tenantId, limit = 50) {
  return base44.entities.GuestbookEntry.filter({ tenant_id: tenantId, is_hidden: false }, "-createdAt", limit);
}

// Recent, non-hidden comments left on a specific room.
export async function fetchRoomComments(tenantId, walkthroughKey, roomKey, limit = 50) {
  return base44.entities.RoomComment.filter(
    { tenant_id: tenantId, walkthrough_key: walkthroughKey, room_key: roomKey, is_hidden: false },
    "-createdAt",
    limit
  );
}

// Tenant-hosted events, soonest first. Cancelled/ended events are excluded
// by default - powers "new exhibit available" / event reminder messaging.
export async function fetchTenantEvents(tenantId, { includeEnded = false } = {}) {
  const events = await base44.entities.TenantEvent.filter({ tenant_id: tenantId }, "startsAt");
  if (includeEnded) return events;
  return events.filter((event) => event.status !== "ended" && event.status !== "cancelled");
}

// Exploration leaderboard for a tenant's walkthrough: display names and
// aggregate progress only (see get_tenant_leaderboard SECURITY DEFINER fn).
export async function fetchTenantLeaderboard(tenantId, walkthroughKey, limit = 10) {
  const { data, error } = await supabase.rpc("get_tenant_leaderboard", {
    p_tenant_id: tenantId,
    p_walkthrough_key: walkthroughKey,
    p_limit: limit,
  });
  if (error) throw error;
  return data || [];
}
