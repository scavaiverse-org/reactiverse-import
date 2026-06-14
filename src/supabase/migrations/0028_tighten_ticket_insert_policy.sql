-- Tighten the public ticket-reservation INSERT policy.
--
-- 0027 set `tickets_public_insert` to WITH CHECK (true), which lets any caller
-- insert a reservation with an arbitrary tenant_id — polluting other tenants'
-- dashboards/analytics with bogus rows. Constrain it so the tenant_id must
-- reference a real museum_tenants row.
--
-- Why a SECURITY DEFINER function instead of an inline subquery: presale
-- reservations are created for museums that are NOT yet 'live', but the
-- museum_tenants read policy (tenants_public_live_read, 0003) only exposes
-- status='live' rows to anon. An inline `tenant_id IN (SELECT id FROM
-- museum_tenants)` would therefore be evaluated under the caller's RLS and
-- reject every presale reservation. tenant_exists() runs as definer so it sees
-- all tenants regardless of status, keeping frictionless presale working while
-- still blocking non-existent tenant_ids.

BEGIN;

CREATE OR REPLACE FUNCTION public.tenant_exists(p_tenant_id text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.museum_tenants WHERE id = p_tenant_id);
$$;

REVOKE ALL ON FUNCTION public.tenant_exists(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.tenant_exists(text) TO anon, authenticated;

DROP POLICY IF EXISTS tickets_public_insert ON public.tickets;
CREATE POLICY tickets_public_insert ON public.tickets
  FOR INSERT
  WITH CHECK (tenant_id IS NOT NULL AND public.tenant_exists(tenant_id));

COMMIT;
