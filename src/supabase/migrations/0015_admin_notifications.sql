-- Admin notifications — an in-app feed for platform admins. The first source
-- is the 15 June pre-sale: when anyone (including an anonymous buyer) submits a
-- payment proof, a notification is created automatically so admins can verify
-- the transfer and grant the role.
--
-- The notification is written by an AFTER INSERT trigger on payment_proofs that
-- runs SECURITY DEFINER, so the anonymous submitter never needs (and never gets)
-- write access to admin_notifications — only the trigger and service role do.

create table if not exists public.admin_notifications (
  id text primary key default gen_random_uuid()::text,
  type text not null default 'general',           -- e.g. 'payment_proof_submitted'
  title text not null,
  message text,
  data jsonb,                                      -- { proof_id, kind, email, ... }
  link text,                                       -- admin route to open
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists admin_notifications_unread_idx on public.admin_notifications (is_read, created_at desc);

alter table public.admin_notifications enable row level security;

-- Only platform admins can read / mark-read / delete. No public access.
create policy admin_notifications_admin_all on public.admin_notifications
  for all using (public.is_admin()) with check (public.is_admin());

create policy admin_notifications_service_role_all on public.admin_notifications
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Trigger: create an admin notification whenever a payment proof is submitted.
create or replace function public.notify_admin_payment_proof()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.admin_notifications (type, title, message, data, link)
  values (
    'payment_proof_submitted',
    case when new.kind = 'tenant_trial' then 'New tenant trial request' else 'New pre-sale payment proof' end,
    coalesce(new.email, 'unknown') || ' · ' || coalesce(new.item_label, new.item_id, 'item')
      || case when coalesce(new.amount, 0) > 0 then ' · ' || new.currency || ' ' || new.amount::text else '' end,
    jsonb_build_object('proof_id', new.id, 'kind', new.kind, 'email', new.email, 'amount', new.amount, 'currency', new.currency),
    '/platform/admin/uen'
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_admin_payment_proof on public.payment_proofs;
create trigger trg_notify_admin_payment_proof
  after insert on public.payment_proofs
  for each row execute function public.notify_admin_payment_proof();

-- Make the table available to realtime so the admin notification bell updates
-- live. Guarded so re-running the migration is safe.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.admin_notifications;
    exception when duplicate_object then null;
    end;
  end if;
end $$;
