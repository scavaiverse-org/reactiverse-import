-- Visitor engagement & retention layer.
--
-- Adds the data foundation for five return-trigger systems, all keyed by the
-- same visitor identity used by avatars (0018_avatar_creator.sql): either an
-- authenticated user (user_id = auth.uid()) or an anonymous visitor
-- (visitor_id = a random UUID held in localStorage, see getOrCreateVisitorId
-- in src/lib/avatar-config.js).
--
--   1. visitor_journeys      — "continue your journey" memory + progress %
--   2. visitor_collectibles  — artifacts a visitor has collected
--   3. visitor_badges        — earned achievements/badges
--   4. visitor_notifications — return-trigger notifications (read/unread)
--   5. guestbook_entries     — tenant-wide visitor wall
--   6. room_comments         — per-room comments
--   7. tenant_events         — tenant-hosted events (admin-managed content)
--
-- Plus get_tenant_leaderboard(), a SECURITY DEFINER function that exposes only
-- display names + aggregate progress for a tenant's exploration leaderboard,
-- since visitor_journeys itself is owner-scoped under RLS.

-- 1. Per-visitor journey memory + progress -----------------------------------
create table public.visitor_journeys (
  id text primary key default gen_random_uuid()::text,
  user_id uuid references auth.users(id) on delete cascade,
  visitor_id text,
  tenant_id text not null,
  walkthrough_key text not null,
  status text not null default 'in_progress' check (status in ('in_progress','completed')),
  visited_room_keys text[] not null default '{}',
  skipped_room_keys text[] not null default '{}',
  artifacts_viewed text[] not null default '{}',
  total_rooms numeric default 0,
  percent_complete numeric not null default 0,
  last_room_key text,
  started_at timestamptz not null default now(),
  last_visited_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint visitor_journeys_owner_xor check (
    (user_id is not null and visitor_id is null) or
    (user_id is null and visitor_id is not null)
  )
);
create unique index visitor_journeys_user_unique on public.visitor_journeys (user_id, tenant_id, walkthrough_key) where user_id is not null;
create unique index visitor_journeys_visitor_unique on public.visitor_journeys (visitor_id, tenant_id, walkthrough_key) where visitor_id is not null;
create index visitor_journeys_tenant_idx on public.visitor_journeys(tenant_id, walkthrough_key);

alter table public.visitor_journeys enable row level security;

create policy "visitor_journeys_owner_select" on public.visitor_journeys
  for select using (auth.uid() is not null and auth.uid() = user_id);
create policy "visitor_journeys_owner_insert" on public.visitor_journeys
  for insert with check (auth.uid() is not null and auth.uid() = user_id and visitor_id is null);
create policy "visitor_journeys_owner_update" on public.visitor_journeys
  for update using (auth.uid() is not null and auth.uid() = user_id)
  with check (auth.uid() is not null and auth.uid() = user_id);
create policy "visitor_journeys_owner_delete" on public.visitor_journeys
  for delete using (auth.uid() is not null and auth.uid() = user_id);

create policy "visitor_journeys_visitor_select" on public.visitor_journeys
  for select using (auth.uid() is null and visitor_id is not null);
create policy "visitor_journeys_visitor_insert" on public.visitor_journeys
  for insert with check (auth.uid() is null and user_id is null and visitor_id is not null);
create policy "visitor_journeys_visitor_update" on public.visitor_journeys
  for update using (auth.uid() is null and visitor_id is not null)
  with check (auth.uid() is null and user_id is null and visitor_id is not null);
create policy "visitor_journeys_visitor_delete" on public.visitor_journeys
  for delete using (auth.uid() is null and visitor_id is not null);

create policy "visitor_journeys_admin_all" on public.visitor_journeys
  for all using (public.is_admin()) with check (public.is_admin());
create policy "visitor_journeys_service_role_all" on public.visitor_journeys
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- 2. Collected artifacts -------------------------------------------------------
create table public.visitor_collectibles (
  id text primary key default gen_random_uuid()::text,
  user_id uuid references auth.users(id) on delete cascade,
  visitor_id text,
  tenant_id text not null,
  walkthrough_key text not null,
  room_key text,
  artifact_key text not null,
  artifact_title text,
  artifact_image_url text,
  collected_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint visitor_collectibles_owner_xor check (
    (user_id is not null and visitor_id is null) or
    (user_id is null and visitor_id is not null)
  )
);
create unique index visitor_collectibles_user_unique on public.visitor_collectibles (user_id, tenant_id, walkthrough_key, artifact_key) where user_id is not null;
create unique index visitor_collectibles_visitor_unique on public.visitor_collectibles (visitor_id, tenant_id, walkthrough_key, artifact_key) where visitor_id is not null;
create index visitor_collectibles_tenant_idx on public.visitor_collectibles(tenant_id, walkthrough_key);

alter table public.visitor_collectibles enable row level security;

create policy "visitor_collectibles_owner_select" on public.visitor_collectibles
  for select using (auth.uid() is not null and auth.uid() = user_id);
create policy "visitor_collectibles_owner_insert" on public.visitor_collectibles
  for insert with check (auth.uid() is not null and auth.uid() = user_id and visitor_id is null);
create policy "visitor_collectibles_owner_delete" on public.visitor_collectibles
  for delete using (auth.uid() is not null and auth.uid() = user_id);

create policy "visitor_collectibles_visitor_select" on public.visitor_collectibles
  for select using (auth.uid() is null and visitor_id is not null);
create policy "visitor_collectibles_visitor_insert" on public.visitor_collectibles
  for insert with check (auth.uid() is null and user_id is null and visitor_id is not null);
create policy "visitor_collectibles_visitor_delete" on public.visitor_collectibles
  for delete using (auth.uid() is null and visitor_id is not null);

create policy "visitor_collectibles_admin_all" on public.visitor_collectibles
  for all using (public.is_admin()) with check (public.is_admin());
create policy "visitor_collectibles_service_role_all" on public.visitor_collectibles
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- 3. Earned badges/achievements -------------------------------------------------
-- tenant_id defaults to 'platform' (rather than null) for platform-wide badges
-- so the unique index below behaves correctly (NULLs are never equal in
-- Postgres unique indexes, which would otherwise allow duplicate platform badges).
create table public.visitor_badges (
  id text primary key default gen_random_uuid()::text,
  user_id uuid references auth.users(id) on delete cascade,
  visitor_id text,
  tenant_id text not null default 'platform',
  badge_key text not null,
  earned_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint visitor_badges_owner_xor check (
    (user_id is not null and visitor_id is null) or
    (user_id is null and visitor_id is not null)
  )
);
create unique index visitor_badges_user_unique on public.visitor_badges (user_id, tenant_id, badge_key) where user_id is not null;
create unique index visitor_badges_visitor_unique on public.visitor_badges (visitor_id, tenant_id, badge_key) where visitor_id is not null;

alter table public.visitor_badges enable row level security;

create policy "visitor_badges_owner_select" on public.visitor_badges
  for select using (auth.uid() is not null and auth.uid() = user_id);
create policy "visitor_badges_owner_insert" on public.visitor_badges
  for insert with check (auth.uid() is not null and auth.uid() = user_id and visitor_id is null);

create policy "visitor_badges_visitor_select" on public.visitor_badges
  for select using (auth.uid() is null and visitor_id is not null);
create policy "visitor_badges_visitor_insert" on public.visitor_badges
  for insert with check (auth.uid() is null and user_id is null and visitor_id is not null);

create policy "visitor_badges_admin_all" on public.visitor_badges
  for all using (public.is_admin()) with check (public.is_admin());
create policy "visitor_badges_service_role_all" on public.visitor_badges
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- 4. Return-trigger notifications -------------------------------------------------
-- No owner-insert policy: notifications are created by the platform (service
-- role / triggers / admin), visitors can only read, mark-read, and dismiss
-- their own.
create table public.visitor_notifications (
  id text primary key default gen_random_uuid()::text,
  user_id uuid references auth.users(id) on delete cascade,
  visitor_id text,
  tenant_id text,
  type text not null,
  title text not null,
  message text,
  link text,
  data jsonb default '{}'::jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  constraint visitor_notifications_owner_xor check (
    (user_id is not null and visitor_id is null) or
    (user_id is null and visitor_id is not null)
  )
);
create index visitor_notifications_user_idx on public.visitor_notifications(user_id) where user_id is not null;
create index visitor_notifications_visitor_idx on public.visitor_notifications(visitor_id) where visitor_id is not null;
create index visitor_notifications_unread_idx on public.visitor_notifications(is_read) where is_read = false;

alter table public.visitor_notifications enable row level security;

create policy "visitor_notifications_owner_select" on public.visitor_notifications
  for select using (auth.uid() is not null and auth.uid() = user_id);
create policy "visitor_notifications_owner_update" on public.visitor_notifications
  for update using (auth.uid() is not null and auth.uid() = user_id)
  with check (auth.uid() is not null and auth.uid() = user_id);
create policy "visitor_notifications_owner_delete" on public.visitor_notifications
  for delete using (auth.uid() is not null and auth.uid() = user_id);

create policy "visitor_notifications_visitor_select" on public.visitor_notifications
  for select using (auth.uid() is null and visitor_id is not null);
create policy "visitor_notifications_visitor_update" on public.visitor_notifications
  for update using (auth.uid() is null and visitor_id is not null)
  with check (auth.uid() is null and user_id is null and visitor_id is not null);
create policy "visitor_notifications_visitor_delete" on public.visitor_notifications
  for delete using (auth.uid() is null and visitor_id is not null);

create policy "visitor_notifications_admin_all" on public.visitor_notifications
  for all using (public.is_admin()) with check (public.is_admin());
create policy "visitor_notifications_service_role_all" on public.visitor_notifications
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- 5. Tenant-wide visitor guestbook --------------------------------------------
create table public.guestbook_entries (
  id text primary key default gen_random_uuid()::text,
  user_id uuid references auth.users(id) on delete cascade,
  visitor_id text,
  tenant_id text not null,
  display_name text not null,
  message text not null,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  constraint guestbook_entries_owner_xor check (
    (user_id is not null and visitor_id is null) or
    (user_id is null and visitor_id is not null)
  )
);
create index guestbook_entries_tenant_idx on public.guestbook_entries(tenant_id, created_at desc);

alter table public.guestbook_entries enable row level security;

-- Anyone (including anon) can read non-hidden entries for a tenant.
create policy "guestbook_entries_public_read" on public.guestbook_entries
  for select using (is_hidden = false);

create policy "guestbook_entries_owner_insert" on public.guestbook_entries
  for insert with check (
    (auth.uid() is not null and auth.uid() = user_id and visitor_id is null) or
    (auth.uid() is null and user_id is null and visitor_id is not null)
  );
create policy "guestbook_entries_owner_select" on public.guestbook_entries
  for select using (
    (auth.uid() is not null and auth.uid() = user_id) or
    (auth.uid() is null and visitor_id is not null)
  );
create policy "guestbook_entries_owner_delete" on public.guestbook_entries
  for delete using (
    (auth.uid() is not null and auth.uid() = user_id) or
    (auth.uid() is null and visitor_id is not null)
  );

-- Tenant staff/admin can moderate (hide/delete) any entry for their tenant.
create policy "guestbook_entries_tenant_moderate" on public.guestbook_entries
  for all using (public.is_admin() or (tenant_id = public.current_user_tenant_id() or tenant_id = any(public.current_user_tenant_ids())))
  with check (public.is_admin() or (tenant_id = public.current_user_tenant_id() or tenant_id = any(public.current_user_tenant_ids())));

-- 6. Per-room comments -----------------------------------------------------------
create table public.room_comments (
  id text primary key default gen_random_uuid()::text,
  user_id uuid references auth.users(id) on delete cascade,
  visitor_id text,
  tenant_id text not null,
  walkthrough_key text not null,
  room_key text not null,
  display_name text not null,
  message text not null,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  constraint room_comments_owner_xor check (
    (user_id is not null and visitor_id is null) or
    (user_id is null and visitor_id is not null)
  )
);
create index room_comments_room_idx on public.room_comments(tenant_id, walkthrough_key, room_key, created_at desc);

alter table public.room_comments enable row level security;

create policy "room_comments_public_read" on public.room_comments
  for select using (is_hidden = false);

create policy "room_comments_owner_insert" on public.room_comments
  for insert with check (
    (auth.uid() is not null and auth.uid() = user_id and visitor_id is null) or
    (auth.uid() is null and user_id is null and visitor_id is not null)
  );
create policy "room_comments_owner_select" on public.room_comments
  for select using (
    (auth.uid() is not null and auth.uid() = user_id) or
    (auth.uid() is null and visitor_id is not null)
  );
create policy "room_comments_owner_delete" on public.room_comments
  for delete using (
    (auth.uid() is not null and auth.uid() = user_id) or
    (auth.uid() is null and visitor_id is not null)
  );

create policy "room_comments_tenant_moderate" on public.room_comments
  for all using (public.is_admin() or (tenant_id = public.current_user_tenant_id() or tenant_id = any(public.current_user_tenant_ids())))
  with check (public.is_admin() or (tenant_id = public.current_user_tenant_id() or tenant_id = any(public.current_user_tenant_ids())));

-- 7. Tenant-hosted events (admin-managed content) ----------------------------------
create table public.tenant_events (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  title text not null,
  description text,
  starts_at timestamptz,
  ends_at timestamptz,
  status text not null default 'upcoming' check (status in ('upcoming','live','ended','cancelled')),
  link text,
  created_by_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tenant_events_tenant_idx on public.tenant_events(tenant_id, starts_at);

alter table public.tenant_events enable row level security;

create policy "tenant_events_public_read" on public.tenant_events
  for select using (status <> 'cancelled' or public.is_admin() or (tenant_id = public.current_user_tenant_id() or tenant_id = any(public.current_user_tenant_ids())));

create policy "tenant_events_tenant_manage" on public.tenant_events
  for all using (public.is_admin() or (tenant_id = public.current_user_tenant_id() or tenant_id = any(public.current_user_tenant_ids())))
  with check (public.is_admin() or (tenant_id = public.current_user_tenant_id() or tenant_id = any(public.current_user_tenant_ids())));

-- Exploration leaderboard -------------------------------------------------------
-- visitor_journeys is owner-scoped under RLS, so a cross-visitor leaderboard
-- needs a SECURITY DEFINER function that exposes only display names and
-- aggregate progress — never user_id/visitor_id.
create or replace function public.get_tenant_leaderboard(p_tenant_id text, p_walkthrough_key text, p_limit int default 10)
returns table (display_name text, percent_complete numeric, rooms_visited numeric, artifacts_collected numeric, status text)
language sql
security definer
set search_path = public
as $func$
  select
    coalesce(a.display_name, 'Explorer') as display_name,
    j.percent_complete,
    coalesce(array_length(j.visited_room_keys, 1), 0)::numeric as rooms_visited,
    (
      select count(*)::numeric from public.visitor_collectibles c
      where c.tenant_id = j.tenant_id and c.walkthrough_key = j.walkthrough_key
        and ((c.user_id is not null and c.user_id = j.user_id) or (c.visitor_id is not null and c.visitor_id = j.visitor_id))
    ) as artifacts_collected,
    j.status
  from public.visitor_journeys j
  left join public.avatars a on (a.user_id = j.user_id or a.visitor_id = j.visitor_id)
  where j.tenant_id = p_tenant_id and j.walkthrough_key = p_walkthrough_key
  order by j.percent_complete desc, j.last_visited_at asc
  limit coalesce(p_limit, 10);
$func$;

revoke all on function public.get_tenant_leaderboard(text, text, int) from public;
grant execute on function public.get_tenant_leaderboard(text, text, int) to anon, authenticated;
