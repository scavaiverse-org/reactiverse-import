-- Site fixes 2026-06-11 — run this ONE file in the Supabase SQL Editor.
-- It includes everything from cleanup_duplicate_configs.sql plus the
-- ticket-reservation permission fix, all idempotent (safe to run twice).

BEGIN;

-- 1. Let visitors create ticket reservations (the policy from the migration
--    files was never applied to the live database, so every public
--    reservation was rejected)
DROP POLICY IF EXISTS tickets_public_insert ON public.tickets;
CREATE POLICY tickets_public_insert ON public.tickets
  FOR INSERT WITH CHECK (true);

-- 2. Remove duplicate walkthrough configs left by an earlier migration
--    (typo'd copies; the corrected imports remain)
DELETE FROM public.experience_configs
WHERE id IN (
  '0a1f09c9-ee5d-5719-8c45-f3d8a291a758',
  'b9bbe3a3-6ac7-515b-a2b8-d6a8709efa2a'
);

-- 3. Scrub the "Asia Operatic Museum" typo from all remaining content tables
UPDATE public.experience_configs
SET tenant_name = REPLACE(tenant_name, 'Asia Operatic Museum', 'Asian Operatic Museum'),
    title = REPLACE(title, 'Asia Operatic Museum', 'Asian Operatic Museum'),
    description = REPLACE(description, 'Asia Operatic Museum', 'Asian Operatic Museum'),
    walkthrough_config = REPLACE(walkthrough_config::text, 'Asia Operatic Museum', 'Asian Operatic Museum')::jsonb,
    rooms = REPLACE(rooms::text, 'Asia Operatic Museum', 'Asian Operatic Museum')::jsonb,
    onboarding_config = REPLACE(onboarding_config::text, 'Asia Operatic Museum', 'Asian Operatic Museum')::jsonb,
    ai_guide_config = REPLACE(ai_guide_config::text, 'Asia Operatic Museum', 'Asian Operatic Museum')::jsonb
WHERE (tenant_name || coalesce(title,'') || coalesce(description,'') || walkthrough_config::text || rooms::text) LIKE '%Asia Operatic Museum%';

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

COMMIT;
