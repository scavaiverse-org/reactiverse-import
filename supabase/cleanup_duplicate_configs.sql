-- Cleanup: remove duplicate walkthrough configs left by an earlier migration
-- (they were hidden by row security until the public-read fix) and scrub the
-- "Asia Operatic Museum" typo from all remaining content tables.
-- Paste into Supabase SQL Editor and Run.

BEGIN;

-- 1. Drop the older duplicate walkthrough configs (these two still carry the
--    typo; the typo-fixed copies imported from the Base44 exports remain)
DELETE FROM public.experience_configs
WHERE id IN (
  '0a1f09c9-ee5d-5719-8c45-f3d8a291a758',
  'b9bbe3a3-6ac7-515b-a2b8-d6a8709efa2a'
);

-- 2. Scrub the typo from text and JSON fields across content tables
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

-- Verification (optional):
-- SELECT id, title, walkthrough_key FROM experience_configs WHERE tenant_id = '91bc9b6c-e084-457f-9828-c3899110568c';
