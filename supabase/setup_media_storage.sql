-- Set up media storage buckets for the experience builder (they were never
-- created in the live project, so every media upload failed).
-- Paste into Supabase SQL Editor and Run. Idempotent — safe to run twice.

-- 1. Buckets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('public-media', 'public-media', true, 104857600, array['image/png','image/jpeg','image/webp','image/gif','video/mp4','video/webm','audio/mpeg','audio/wav','application/pdf']),
  ('tenant-media', 'tenant-media', false, 104857600, array['image/png','image/jpeg','image/webp','image/gif','video/mp4','video/webm','audio/mpeg','audio/wav','application/pdf']),
  ('qa-evidence', 'qa-evidence', false, 52428800, array['image/png','image/jpeg','video/mp4','application/json','text/plain'])
on conflict (id) do nothing;

-- 2. Storage access rules

-- can_upload_media(): is_admin() plus the tenant-scoped staff roles that have
-- canUpload: true in src/lib/rbac.js (FRANCHISE_OWNER/MANAGER/STAFF,
-- CONTENT_EDITOR, MEDIA_MANAGER, and their lowercase legacy aliases). Without
-- this, uploadFile() (src/lib/upload.js) — used by every museum admin editor
-- and ZIP import — gets rejected by storage RLS for tenant staff.
create or replace function public.can_upload_media()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
    or lower(public.current_user_role()) in (
      'franchise_owner', 'franchise_manager', 'franchise_staff',
      'content_editor', 'media_manager',
      'tenant_admin', 'tenant_manager', 'tenant_staff', 'owner'
    )
    or public.current_user_role() in (
      'FRANCHISE_OWNER', 'FRANCHISE_MANAGER', 'FRANCHISE_STAFF',
      'CONTENT_EDITOR', 'MEDIA_MANAGER'
    );
$$;

drop policy if exists public_media_read on storage.objects;
create policy public_media_read on storage.objects
  for select using (bucket_id = 'public-media');

drop policy if exists public_media_admin_write on storage.objects;
drop policy if exists public_media_staff_write on storage.objects;
create policy public_media_staff_write on storage.objects
  for all using (bucket_id = 'public-media' and public.can_upload_media())
  with check (bucket_id = 'public-media' and public.can_upload_media());

drop policy if exists tenant_media_read on storage.objects;
create policy tenant_media_read on storage.objects for select using (
  bucket_id = 'tenant-media' and (public.is_admin() or split_part(name, '/', 1) = public.current_user_tenant_id())
);

drop policy if exists tenant_media_write on storage.objects;
create policy tenant_media_write on storage.objects for insert with check (
  bucket_id = 'tenant-media' and (public.is_admin() or split_part(name, '/', 1) = public.current_user_tenant_id())
);

drop policy if exists tenant_media_update on storage.objects;
create policy tenant_media_update on storage.objects for update using (
  bucket_id = 'tenant-media' and (public.is_admin() or split_part(name, '/', 1) = public.current_user_tenant_id())
) with check (
  bucket_id = 'tenant-media' and (public.is_admin() or split_part(name, '/', 1) = public.current_user_tenant_id())
);

drop policy if exists tenant_media_delete on storage.objects;
create policy tenant_media_delete on storage.objects for delete using (
  bucket_id = 'tenant-media' and (public.is_admin() or split_part(name, '/', 1) = public.current_user_tenant_id())
);

drop policy if exists qa_evidence_admin_all on storage.objects;
create policy qa_evidence_admin_all on storage.objects
  for all using (bucket_id = 'qa-evidence' and public.is_admin())
  with check (bucket_id = 'qa-evidence' and public.is_admin());
