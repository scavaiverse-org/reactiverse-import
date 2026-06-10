-- Fix: let the public site read the ticket catalog and published walkthroughs,
-- and re-link the 24 orphaned Asian Operatic Museum exhibits.
-- Paste into Supabase SQL Editor and Run (after restore_asian_operatic_museum.sql).

BEGIN;

-- 1. Re-link exhibits that still point at an old, deleted museum id
UPDATE public.exhibits
SET tenant_id = '91bc9b6c-e084-457f-9828-c3899110568c'
WHERE tenant_name = 'Asian Operatic Museum'
  AND tenant_id <> '91bc9b6c-e084-457f-9828-c3899110568c';

-- 2. Visitors may read published walkthrough/experience configs
DROP POLICY IF EXISTS experience_configs_public_read ON public.experience_configs;
CREATE POLICY experience_configs_public_read ON public.experience_configs
  FOR SELECT USING (status = 'published');

-- 3. Visitors may read the ticketing catalog (prices and ticket types only;
--    other module configs such as AI guide stay private)
DROP POLICY IF EXISTS module_configs_public_ticketing_read ON public.module_configs;
CREATE POLICY module_configs_public_ticketing_read ON public.module_configs
  FOR SELECT USING (module_key = 'ticketing' AND enabled = true);

COMMIT;

-- Verification (optional):
-- SELECT count(*) FROM exhibits WHERE tenant_id = '91bc9b6c-e084-457f-9828-c3899110568c';  -- expect 54
