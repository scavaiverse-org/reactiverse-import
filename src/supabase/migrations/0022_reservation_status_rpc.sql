-- Public reservation status lookup for anonymous ticket buyers.
--
-- Tickets are not readable by anonymous visitors under RLS (tickets_private_read
-- is admin/tenant/owner only), and there is no anonymous auth — so after a
-- visitor reserves (insert-only, id generated client-side) they could not read
-- their own ticket back to (a) detect Stripe payment confirmation on the
-- confirmation page, or (b) unlock the tour via useTourAccess.
--
-- This SECURITY DEFINER function returns ONLY non-PII status fields for a ticket
-- looked up by its exact id (an unguessable UUID the client already holds in
-- localStorage). No visitor name/email is exposed.

create or replace function public.reservation_status(p_id text)
returns table (id text, status text, confirmation_stage text, tenant_id text)
language sql
security definer
set search_path = public
as $func$
  select t.id, t.status, t.confirmation_stage, t.tenant_id
  from public.tickets t
  where t.id = p_id;
$func$;

revoke all on function public.reservation_status(text) from public;
grant execute on function public.reservation_status(text) to anon, authenticated;
