-- Supabase Storage buckets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('public-media', 'public-media', true, 104857600, array['image/png','image/jpeg','image/webp','image/gif','video/mp4','video/webm','audio/mpeg','audio/wav','application/pdf']),
  ('tenant-media', 'tenant-media', false, 104857600, array['image/png','image/jpeg','image/webp','image/gif','video/mp4','video/webm','audio/mpeg','audio/wav','application/pdf']),
  ('qa-evidence', 'qa-evidence', false, 52428800, array['image/png','image/jpeg','video/mp4','application/json','text/plain'])
on conflict (id) do nothing;

-- Public read only for public-media.
create policy public_media_read on storage.objects for select using (bucket_id = 'public-media');
create policy public_media_admin_write on storage.objects for all using (bucket_id = 'public-media' and public.is_admin()) with check (bucket_id = 'public-media' and public.is_admin());

-- Tenant media: path convention tenant-media/{tenant_id}/...
create policy tenant_media_read on storage.objects for select using (
  bucket_id = 'tenant-media' and (public.is_admin() or split_part(name, '/', 1) = public.current_user_tenant_id())
);
create policy tenant_media_write on storage.objects for insert with check (
  bucket_id = 'tenant-media' and (public.is_admin() or split_part(name, '/', 1) = public.current_user_tenant_id())
);
create policy tenant_media_update on storage.objects for update using (
  bucket_id = 'tenant-media' and (public.is_admin() or split_part(name, '/', 1) = public.current_user_tenant_id())
) with check (
  bucket_id = 'tenant-media' and (public.is_admin() or split_part(name, '/', 1) = public.current_user_tenant_id())
);
create policy tenant_media_delete on storage.objects for delete using (
  bucket_id = 'tenant-media' and (public.is_admin() or split_part(name, '/', 1) = public.current_user_tenant_id())
);

-- QA evidence admin-only.
create policy qa_evidence_admin_all on storage.objects for all using (bucket_id = 'qa-evidence' and public.is_admin()) with check (bucket_id = 'qa-evidence' and public.is_admin());