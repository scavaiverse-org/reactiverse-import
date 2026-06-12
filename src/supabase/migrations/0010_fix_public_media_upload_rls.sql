-- Fix: tenant-level admins/editors could not upload media.
--
-- uploadFile() (src/lib/upload.js) — used by TenantHomeEditor, TenantMusic,
-- WalkthroughRoomEditor and every room-type editor, MediaSelector, the
-- sprite uploader, and ZIP import — always writes to the `public-media`
-- bucket (it must be publicly readable so visitors can see the media).
--
-- The `public_media_admin_write` policy from setup_media_storage.sql only
-- allowed public.is_admin() (MASTER_ADMIN/PLATFORM_ADMIN), so any
-- tenant-scoped staff role (FRANCHISE_OWNER, FRANCHISE_MANAGER,
-- FRANCHISE_STAFF, CONTENT_EDITOR, MEDIA_MANAGER — all of which have
-- canUpload: true in src/lib/rbac.js and are allowed into
-- /museum/:slug/admin/* by canAccessMuseum) had every media upload
-- rejected by storage RLS.
--
-- This adds a can_upload_media() helper (mirrors is_admin()'s canonical +
-- legacy-alias role check, scoped to roles with canUpload: true) and
-- replaces the write policy with it.

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

drop policy if exists public_media_admin_write on storage.objects;
drop policy if exists public_media_staff_write on storage.objects;
create policy public_media_staff_write on storage.objects
  for all using (bucket_id = 'public-media' and public.can_upload_media())
  with check (bucket_id = 'public-media' and public.can_upload_media());
