-- Avatar Creation System: platform-wide deterministic 3D avatars.
--
-- Stores one avatar profile per visitor, owned either by an authenticated
-- user (user_id = auth.uid()) or by an anonymous visitor (visitor_id = a
-- random UUID generated client-side and kept in localStorage). Exactly one
-- of user_id / visitor_id is set per row.
--
-- Privacy/consent: only a derived cutout image (face and/or full body,
-- background removed) is stored — never the original uploaded photo. A row
-- is only created after consent_given_at is recorded and age_confirmed is
-- true. Deleting the row (avatars_delete policy below) is the "delete
-- avatar" action; callers are also expected to remove the cutout objects
-- from the avatar-media storage bucket on delete.

create table if not exists public.avatars (
  id text primary key default gen_random_uuid()::text,
  user_id uuid references auth.users(id) on delete cascade,
  visitor_id text,
  display_name text,
  skin_tone text not null default 'medium',
  body_build text not null default 'average',
  height_scale numeric not null default 1.0,
  hair_style text not null default 'short',
  hair_color text not null default 'darkbrown',
  outfit_top_color text not null default 'sky',
  outfit_bottom_color text not null default 'charcoal',
  accessory text not null default 'none',
  view_mode text not null default 'third_person',
  quality_tier text not null default 'standard',
  face_cutout_url text,
  body_cutout_url text,
  source_photo_type text not null default 'none',
  consent_given_at timestamptz,
  age_confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint avatars_owner_xor check (
    (user_id is not null and visitor_id is null) or
    (user_id is null and visitor_id is not null)
  )
);

create unique index if not exists avatars_user_id_unique on public.avatars (user_id) where user_id is not null;
create unique index if not exists avatars_visitor_id_unique on public.avatars (visitor_id) where visitor_id is not null;

alter table public.avatars enable row level security;

-- Authenticated users manage their own avatar by user_id.
create policy "avatars_owner_select" on public.avatars
  for select using (auth.uid() is not null and auth.uid() = user_id);

create policy "avatars_owner_insert" on public.avatars
  for insert with check (auth.uid() is not null and auth.uid() = user_id and visitor_id is null);

create policy "avatars_owner_update" on public.avatars
  for update using (auth.uid() is not null and auth.uid() = user_id)
  with check (auth.uid() is not null and auth.uid() = user_id);

create policy "avatars_owner_delete" on public.avatars
  for delete using (auth.uid() is not null and auth.uid() = user_id);

-- Anonymous visitors: rows are keyed by a random UUID (visitor_id) generated
-- client-side and held in localStorage, which acts as a capability token —
-- only someone who already knows the UUID can read/update/delete that row.
-- This mirrors the existing anonymous-insert pattern used for tickets
-- (tickets_public_insert ... with check (true)).
create policy "avatars_visitor_select" on public.avatars
  for select using (auth.uid() is null and visitor_id is not null);

create policy "avatars_visitor_insert" on public.avatars
  for insert with check (auth.uid() is null and user_id is null and visitor_id is not null);

create policy "avatars_visitor_update" on public.avatars
  for update using (auth.uid() is null and visitor_id is not null)
  with check (auth.uid() is null and user_id is null and visitor_id is not null);

create policy "avatars_visitor_delete" on public.avatars
  for delete using (auth.uid() is null and visitor_id is not null);

-- Master/platform admins can review and remove avatars (misuse guardrail).
create policy "avatars_admin_all" on public.avatars
  for all using (public.is_admin()) with check (public.is_admin());

create policy "avatars_service_role_all" on public.avatars
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Storage: a dedicated public-read bucket for avatar cutout images, kept
-- separate from public-media (which is staff/admin-write only) so any
-- visitor — authenticated or anonymous — can upload their own avatar
-- cutouts under the avatars/ prefix.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatar-media', 'avatar-media', true, 10485760, array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;

create policy "avatar_media_read" on storage.objects
  for select using (bucket_id = 'avatar-media');

create policy "avatar_media_write" on storage.objects
  for insert with check (bucket_id = 'avatar-media' and split_part(name, '/', 1) = 'avatars');

create policy "avatar_media_update" on storage.objects
  for update using (bucket_id = 'avatar-media' and split_part(name, '/', 1) = 'avatars')
  with check (bucket_id = 'avatar-media' and split_part(name, '/', 1) = 'avatars');

create policy "avatar_media_delete" on storage.objects
  for delete using (bucket_id = 'avatar-media' and split_part(name, '/', 1) = 'avatars');
