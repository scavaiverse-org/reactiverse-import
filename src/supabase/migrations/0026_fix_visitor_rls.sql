-- Fix: anonymous visitor RLS policies on visitor_* tables were scoped only to
-- "auth.uid() is null and visitor_id is not null", which lets ANY anonymous
-- caller read or mutate ANY visitor's rows — Postgres cannot verify the
-- requesting client owns the visitor_id UUID because it only exists in the
-- client's localStorage, not in any JWT claim.
--
-- Resolution:
--   * Drop all anon SELECT / UPDATE / DELETE policies on visitor_journeys,
--     visitor_collectibles, visitor_badges, and visitor_notifications.
--   * Drop the anon INSERT policies on those same tables (reads and writes for
--     anonymous visitors are now handled exclusively by the visitor-data Edge
--     Function, which runs under service_role and scopes every query to the
--     caller-supplied visitor_id server-side).
--   * Rewrite guestbook_entries and room_comments owner policies to require
--     auth.uid() — anon-only variants are removed.  Public INSERT (anon can
--     post a comment / guestbook entry) is preserved via the existing
--     owner_insert policy that already allows both paths.

-- ── visitor_journeys ─────────────────────────────────────────────────────────
drop policy if exists "visitor_journeys_visitor_select" on public.visitor_journeys;
drop policy if exists "visitor_journeys_visitor_insert" on public.visitor_journeys;
drop policy if exists "visitor_journeys_visitor_update" on public.visitor_journeys;
drop policy if exists "visitor_journeys_visitor_delete" on public.visitor_journeys;

-- ── visitor_collectibles ─────────────────────────────────────────────────────
drop policy if exists "visitor_collectibles_visitor_select" on public.visitor_collectibles;
drop policy if exists "visitor_collectibles_visitor_insert" on public.visitor_collectibles;
drop policy if exists "visitor_collectibles_visitor_delete" on public.visitor_collectibles;

-- ── visitor_badges ────────────────────────────────────────────────────────────
drop policy if exists "visitor_badges_visitor_select" on public.visitor_badges;
drop policy if exists "visitor_badges_visitor_insert" on public.visitor_badges;

-- ── visitor_notifications ─────────────────────────────────────────────────────
drop policy if exists "visitor_notifications_visitor_select" on public.visitor_notifications;
drop policy if exists "visitor_notifications_visitor_update" on public.visitor_notifications;
drop policy if exists "visitor_notifications_visitor_delete" on public.visitor_notifications;

-- ── guestbook_entries — replace mixed auth/anon owner policies ────────────────
-- The previous owner_select and owner_delete allowed any anon with any
-- visitor_id to act as the row owner.  Replace with auth-only variants.
-- Public non-hidden reads are still covered by guestbook_entries_public_read.
-- Anon posting is still covered by guestbook_entries_owner_insert (kept as-is).
drop policy if exists "guestbook_entries_owner_select" on public.guestbook_entries;
drop policy if exists "guestbook_entries_owner_delete" on public.guestbook_entries;

create policy "guestbook_entries_owner_select" on public.guestbook_entries
  for select using (auth.uid() is not null and auth.uid() = user_id);

create policy "guestbook_entries_owner_delete" on public.guestbook_entries
  for delete using (auth.uid() is not null and auth.uid() = user_id);

-- ── room_comments — same fix ──────────────────────────────────────────────────
drop policy if exists "room_comments_owner_select" on public.room_comments;
drop policy if exists "room_comments_owner_delete" on public.room_comments;

create policy "room_comments_owner_select" on public.room_comments
  for select using (auth.uid() is not null and auth.uid() = user_id);

create policy "room_comments_owner_delete" on public.room_comments
  for delete using (auth.uid() is not null and auth.uid() = user_id);
