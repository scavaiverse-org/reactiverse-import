-- Pre-sale payment proofs (15 June pre-sale).
--
-- There is no live payment gateway — buyers PayNow to a UEN and upload a
-- screenshot as proof. Every pre-sale submission (e-ticket purchase OR tenant
-- 1-week free-trial request) is recorded here so a platform admin can verify
-- the transfer and manually grant the e-ticket / tenant role. This is the
-- single source for the master-admin "UEN" tab.
--
-- Anonymous visitors can INSERT (mirrors tickets_public_insert), but only
-- admins/service-role can read or change rows — payment screenshots contain
-- financial details and must not be world-readable. Inserts are done with a
-- plain insert (no select-back) so the anon insert does not require a select
-- policy.

create table if not exists public.payment_proofs (
  id text primary key default gen_random_uuid()::text,
  kind text not null default 'ticket',            -- 'ticket' | 'tenant_trial'
  item_id text,                                   -- package id or 'tenant_trial'
  item_label text,
  email text not null,                            -- also entered in the PayNow comment
  organization text,
  contact_name text,
  amount numeric,
  currency text not null default 'SGD',
  quantity integer not null default 1,
  screenshot_path text,                           -- object key in the payment-proofs bucket
  status text not null default 'pending',         -- 'pending' | 'verified' | 'rejected'
  notes text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payment_proofs_status_idx on public.payment_proofs (status);
create index if not exists payment_proofs_created_idx on public.payment_proofs (created_at desc);

alter table public.payment_proofs enable row level security;

-- Anyone (incl. anonymous pre-sale buyers) may submit a proof.
create policy payment_proofs_public_insert on public.payment_proofs
  for insert with check (true);

-- Only platform admins can read / verify / reject / delete.
create policy payment_proofs_admin_all on public.payment_proofs
  for all using (public.is_admin()) with check (public.is_admin());

create policy payment_proofs_service_role_all on public.payment_proofs
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Storage: a PRIVATE bucket for the transaction screenshots. Anonymous buyers
-- can upload under the proofs/ prefix; only admins/service-role can read them
-- (via short-lived signed URLs created in the UEN admin tab).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-proofs', 'payment-proofs', false, 10485760, array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;

create policy "payment_proofs_storage_upload" on storage.objects
  for insert with check (bucket_id = 'payment-proofs' and split_part(name, '/', 1) = 'proofs');

create policy "payment_proofs_storage_admin_read" on storage.objects
  for select using (bucket_id = 'payment-proofs' and public.is_admin());

create policy "payment_proofs_storage_admin_update" on storage.objects
  for update using (bucket_id = 'payment-proofs' and public.is_admin())
  with check (bucket_id = 'payment-proofs' and public.is_admin());

create policy "payment_proofs_storage_admin_delete" on storage.objects
  for delete using (bucket_id = 'payment-proofs' and public.is_admin());

create policy "payment_proofs_storage_service_role" on storage.objects
  for all using (bucket_id = 'payment-proofs' and auth.role() = 'service_role')
  with check (bucket_id = 'payment-proofs' and auth.role() = 'service_role');
