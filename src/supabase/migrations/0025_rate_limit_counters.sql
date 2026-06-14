-- Backing store for edge-function rate limiting.
--
-- Public edge functions (cultural-guide, stripe-checkout, franchise-checkout,
-- notify-inquiry, verifyPortalAccess) are reachable by anyone, including
-- unauthenticated visitors. Edge function instances are stateless and
-- multi-region, so an in-memory counter can't enforce a global limit — this
-- table + RPC give them a shared, atomic counter keyed by caller IP.

create table public.rate_limit_counters (
  bucket_key text not null,
  window_start timestamptz not null,
  request_count integer not null default 0,
  primary key (bucket_key, window_start)
);

create index rate_limit_counters_window_idx on public.rate_limit_counters(window_start);

alter table public.rate_limit_counters enable row level security;

-- Only edge functions (service role) ever touch this table.
create policy "rate_limit_counters_service_role_all" on public.rate_limit_counters
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Atomically increments the counter for (bucket_key, current window) and
-- returns whether the caller is still within p_max_requests for that window.
-- Also prunes counters from expired windows so the table stays small.
create or replace function public.check_rate_limit(p_bucket_key text, p_max_requests integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window_start timestamptz;
  v_count integer;
begin
  v_window_start := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);

  delete from public.rate_limit_counters where window_start < now() - interval '1 hour';

  insert into public.rate_limit_counters (bucket_key, window_start, request_count)
  values (p_bucket_key, v_window_start, 1)
  on conflict (bucket_key, window_start)
  do update set request_count = rate_limit_counters.request_count + 1
  returning request_count into v_count;

  return v_count <= p_max_requests;
end;
$$;

revoke all on function public.check_rate_limit(text, integer, integer) from public;
grant execute on function public.check_rate_limit(text, integer, integer) to service_role;
