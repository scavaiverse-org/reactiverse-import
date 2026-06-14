-- Merges four standalone SQL patch files into the canonical migration chain.
-- Excludes restore_asian_operatic_museum.sql (418 KB data restore, environment-
-- specific — must be run manually against the target database).
-- Also excludes allow_svg_panoramas.sql (superseded by setup_media_storage.sql).
-- The application/octet-stream MIME type from allow_3d_model_uploads.sql is
-- intentionally omitted — it is too broad and creates an upload security risk.

BEGIN;

-- ════════════════════════════════════════════════════════════════════════════
-- 1. fix_public_read_policies.sql
--    • Let visitors read published experience configs and ticketing module configs.
--    • Re-link Asian Operatic Museum exhibits that still point at a stale tenant_id.
-- ════════════════════════════════════════════════════════════════════════════

-- Re-link exhibits that still point at an old, deleted museum id.
UPDATE public.exhibits
SET tenant_id = '91bc9b6c-e084-457f-9828-c3899110568c'
WHERE tenant_name = 'Asian Operatic Museum'
  AND tenant_id <> '91bc9b6c-e084-457f-9828-c3899110568c';

-- Visitors may read published walkthrough / experience configs.
DROP POLICY IF EXISTS experience_configs_public_read ON public.experience_configs;
CREATE POLICY experience_configs_public_read ON public.experience_configs
  FOR SELECT USING (status = 'published');

-- Visitors may read the ticketing catalog (prices and ticket types only;
-- other module configs such as AI guide stay private).
DROP POLICY IF EXISTS module_configs_public_ticketing_read ON public.module_configs;
CREATE POLICY module_configs_public_ticketing_read ON public.module_configs
  FOR SELECT USING (module_key = 'ticketing' AND enabled = true);

-- ════════════════════════════════════════════════════════════════════════════
-- 2. site_fixes_2026-06-11.sql
--    • Allow visitors to create ticket reservations.
--    • Remove duplicate walkthrough configs.
--    • Scrub "Asia Operatic Museum" typo across content tables.
-- ════════════════════════════════════════════════════════════════════════════

-- Let visitors create ticket reservations (the policy from the migration files
-- was never applied to the live database, so every public reservation was rejected).
DROP POLICY IF EXISTS tickets_public_insert ON public.tickets;
CREATE POLICY tickets_public_insert ON public.tickets
  FOR INSERT WITH CHECK (true);

-- Remove duplicate walkthrough configs left by an earlier migration.
DELETE FROM public.experience_configs
WHERE id IN (
  '0a1f09c9-ee5d-5719-8c45-f3d8a291a758',
  'b9bbe3a3-6ac7-515b-a2b8-d6a8709efa2a'
);

-- Scrub the "Asia Operatic Museum" typo from all remaining content tables.
UPDATE public.experience_configs
SET tenant_name = REPLACE(tenant_name, 'Asia Operatic Museum', 'Asian Operatic Museum'),
    title = REPLACE(title, 'Asia Operatic Museum', 'Asian Operatic Museum'),
    description = REPLACE(description, 'Asia Operatic Museum', 'Asian Operatic Museum'),
    walkthrough_config = REPLACE(walkthrough_config::text, 'Asia Operatic Museum', 'Asian Operatic Museum')::jsonb,
    rooms = REPLACE(rooms::text, 'Asia Operatic Museum', 'Asian Operatic Museum')::jsonb,
    onboarding_config = REPLACE(onboarding_config::text, 'Asia Operatic Museum', 'Asian Operatic Museum')::jsonb,
    ai_guide_config = REPLACE(ai_guide_config::text, 'Asia Operatic Museum', 'Asian Operatic Museum')::jsonb
WHERE (tenant_name || coalesce(title,'') || coalesce(description,'') || walkthrough_config::text || rooms::text)
  LIKE '%Asia Operatic Museum%';

UPDATE public.module_configs
SET tenant_name = REPLACE(tenant_name, 'Asia Operatic Museum', 'Asian Operatic Museum'),
    config_json = REPLACE(config_json::text, 'Asia Operatic Museum', 'Asian Operatic Museum')::jsonb
WHERE (coalesce(tenant_name,'') || config_json::text) LIKE '%Asia Operatic Museum%';

UPDATE public.content_assets
SET tenant_name = REPLACE(tenant_name, 'Asia Operatic Museum', 'Asian Operatic Museum'),
    title = REPLACE(title, 'Asia Operatic Museum', 'Asian Operatic Museum'),
    description = REPLACE(description, 'Asia Operatic Museum', 'Asian Operatic Museum')
WHERE (coalesce(tenant_name,'') || coalesce(title,'') || coalesce(description,'')) LIKE '%Asia Operatic Museum%';

UPDATE public.tenant_content
SET title = REPLACE(title, 'Asia Operatic Museum', 'Asian Operatic Museum'),
    subtitle = REPLACE(subtitle, 'Asia Operatic Museum', 'Asian Operatic Museum'),
    body = REPLACE(body, 'Asia Operatic Museum', 'Asian Operatic Museum')
WHERE (coalesce(title,'') || coalesce(subtitle,'') || coalesce(body,'')) LIKE '%Asia Operatic Museum%';

-- ════════════════════════════════════════════════════════════════════════════
-- 3. setup_media_storage.sql
--    • Create public-media / tenant-media / qa-evidence buckets if absent.
--    • Create can_upload_media() security-definer helper.
--    • Set storage RLS policies.
--    NOTE: SVG is kept to support panorama authoring, but uploads must be
--          validated server-side (see src/lib/upload.js svg sanitization).
--          application/octet-stream is intentionally omitted (too broad).
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('public-media', 'public-media', true, 104857600,
   ARRAY[
     'image/png','image/jpeg','image/webp','image/gif','image/svg+xml',
     'video/mp4','video/webm','video/quicktime',
     'audio/mpeg','audio/wav','audio/mp4','audio/ogg',
     'application/pdf',
     'model/gltf-binary','model/gltf+json','model/obj','model/vnd.usdz+zip'
   ]),
  ('tenant-media', 'tenant-media', false, 104857600,
   ARRAY[
     'image/png','image/jpeg','image/webp','image/gif','image/svg+xml',
     'video/mp4','video/webm','video/quicktime',
     'audio/mpeg','audio/wav','audio/mp4','audio/ogg',
     'application/pdf',
     'model/gltf-binary','model/gltf+json','model/obj','model/vnd.usdz+zip'
   ]),
  ('qa-evidence', 'qa-evidence', false, 52428800,
   ARRAY['image/png','image/jpeg','video/mp4','application/json','text/plain'])
ON CONFLICT (id) DO UPDATE
  SET allowed_mime_types = EXCLUDED.allowed_mime_types,
      file_size_limit = EXCLUDED.file_size_limit;

CREATE OR REPLACE FUNCTION public.can_upload_media()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin()
    OR lower(public.current_user_role()) IN (
      'franchise_owner', 'franchise_manager', 'franchise_staff',
      'content_editor', 'media_manager',
      'tenant_admin', 'tenant_manager', 'tenant_staff', 'owner'
    )
    OR public.current_user_role() IN (
      'FRANCHISE_OWNER', 'FRANCHISE_MANAGER', 'FRANCHISE_STAFF',
      'CONTENT_EDITOR', 'MEDIA_MANAGER'
    );
$$;

DROP POLICY IF EXISTS public_media_read ON storage.objects;
CREATE POLICY public_media_read ON storage.objects
  FOR SELECT USING (bucket_id = 'public-media');

DROP POLICY IF EXISTS public_media_admin_write ON storage.objects;
DROP POLICY IF EXISTS public_media_staff_write ON storage.objects;
CREATE POLICY public_media_staff_write ON storage.objects
  FOR ALL USING (bucket_id = 'public-media' AND public.can_upload_media())
  WITH CHECK (bucket_id = 'public-media' AND public.can_upload_media());

DROP POLICY IF EXISTS tenant_media_read ON storage.objects;
CREATE POLICY tenant_media_read ON storage.objects
  FOR SELECT USING (
    bucket_id = 'tenant-media'
    AND (public.is_admin() OR split_part(name, '/', 1) = public.current_user_tenant_id())
  );

DROP POLICY IF EXISTS tenant_media_write ON storage.objects;
CREATE POLICY tenant_media_write ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'tenant-media'
    AND (public.is_admin() OR split_part(name, '/', 1) = public.current_user_tenant_id())
  );

DROP POLICY IF EXISTS tenant_media_update ON storage.objects;
CREATE POLICY tenant_media_update ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'tenant-media'
    AND (public.is_admin() OR split_part(name, '/', 1) = public.current_user_tenant_id())
  ) WITH CHECK (
    bucket_id = 'tenant-media'
    AND (public.is_admin() OR split_part(name, '/', 1) = public.current_user_tenant_id())
  );

DROP POLICY IF EXISTS tenant_media_delete ON storage.objects;
CREATE POLICY tenant_media_delete ON storage.objects
  FOR DELETE USING (
    bucket_id = 'tenant-media'
    AND (public.is_admin() OR split_part(name, '/', 1) = public.current_user_tenant_id())
  );

DROP POLICY IF EXISTS qa_evidence_admin_all ON storage.objects;
CREATE POLICY qa_evidence_admin_all ON storage.objects
  FOR ALL USING (bucket_id = 'qa-evidence' AND public.is_admin())
  WITH CHECK (bucket_id = 'qa-evidence' AND public.is_admin());

-- ════════════════════════════════════════════════════════════════════════════
-- 4. cleanup_seeded_commerce.sql
--    • Delete demo/seed ticket data before connecting live Stripe payments.
--    • Reset demo vendors to pending.
-- ════════════════════════════════════════════════════════════════════════════

-- Delete fake tickets (demo visitor emails from seeded data).
DELETE FROM public.tickets
WHERE visitor_email ILIKE '%@scaverse.demo'
   OR visitor_email ILIKE '%@example.com';

-- Delete fake ticket orders (tagged with seed_key or demo emails).
DELETE FROM public.ticket_orders
WHERE (seed_key IS NOT NULL AND seed_key <> '')
   OR visitor_email ILIKE '%@scaverse.demo'
   OR visitor_email ILIKE '%@example.com';

-- Delete demo-only ticket types belonging to the three fictional seed museums.
-- Real Asian Operatic Museum ticket types (a different tenant_id) are untouched.
DELETE FROM public.ticket_types
WHERE tenant_id IN (
  '6a22c77fceb3a375126ca3a6', -- National Heritage Museum (seed)
  '6a22c77fceb3a375126ca3a7', -- Future Science Dome (seed)
  '6a22c77fceb3a375126ca3a8'  -- Living Arts Gallery (seed)
);

-- Purge analytics events generated for the fictional seed museums.
DELETE FROM public.analytics_events
WHERE event_data->>'source' = 'seed';

-- Reset demo vendors from approved to pending.
UPDATE public.vendors
SET status = 'pending'
WHERE email ILIKE '%@example.com'
  AND status = 'approved';

COMMIT;
