-- E-ticket template catalog + per-user e-ticket inventory.
--
-- e_ticket_templates: the "different versions of e-tickets" for each
-- ticketing package (one row per tenant + package_type + design_version).
-- Managed from the new master-admin Inventory tab.
--
-- inventory_items: the actual e-tickets owned by platform users. One row is
-- credited per successful ticket purchase (see supabase/functions/
-- stripe-webhook), linking the buyer (auth.users), the paid tickets row,
-- and (when available) the matching e_ticket_templates row. Each issued
-- e-ticket gets a unique e_ticket_code.

create table public.e_ticket_templates (
  id text primary key default gen_random_uuid()::text,
  tenant_id text references public.museum_tenants(id) on delete cascade,
  package_type text not null,
  name text not null,
  description text,
  design_version text not null default 'v1',
  price numeric,
  currency text not null default 'SGD',
  benefits jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, package_type, design_version)
);

create table public.inventory_items (
  id text primary key default gen_random_uuid()::text,
  user_id uuid references auth.users(id) on delete set null,
  tenant_id text references public.museum_tenants(id) on delete cascade,
  tenant_name text,
  ticket_id text references public.tickets(id) on delete set null,
  template_id text references public.e_ticket_templates(id) on delete set null,
  package_type text not null,
  label text,
  e_ticket_code text not null unique,
  visitor_name text,
  visitor_email text,
  quantity numeric default 1,
  price numeric,
  currency text default 'SGD',
  status text not null default 'active' check (status in ('active','used','expired','revoked')),
  issued_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index inventory_items_user_idx on public.inventory_items(user_id);
create index inventory_items_tenant_idx on public.inventory_items(tenant_id);
create index inventory_items_ticket_idx on public.inventory_items(ticket_id);

create trigger set_updated_at before update on public.e_ticket_templates for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.inventory_items for each row execute function public.set_updated_at();

alter table public.e_ticket_templates enable row level security;
alter table public.inventory_items enable row level security;

-- Catalog of e-ticket templates: any signed-in user can browse it (used to
-- render inventory entries); only master admins manage it.
create policy "e_ticket_templates_read_authenticated" on public.e_ticket_templates
  for select using (auth.role() = 'authenticated');
create policy "e_ticket_templates_admin_write" on public.e_ticket_templates
  for all using (public.is_admin()) with check (public.is_admin());
create policy "e_ticket_templates_service_role" on public.e_ticket_templates
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Inventory items: owners read their own e-tickets; admins read/manage all;
-- the stripe-webhook (service role) credits new e-tickets on payment.
create policy "inventory_items_owner_read" on public.inventory_items
  for select using (auth.uid() = user_id or public.is_admin());
create policy "inventory_items_admin_write" on public.inventory_items
  for all using (public.is_admin()) with check (public.is_admin());
create policy "inventory_items_service_role" on public.inventory_items
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Seed the e-ticket template catalog with the AOM Day-One packages
-- (matches 0009_aom_ticket_pricing.sql ticket_types, regular pricing).
insert into public.e_ticket_templates (tenant_id, package_type, name, description, design_version, price, currency, benefits) values
  ('91bc9b6c-e084-457f-9828-c3899110568c', 'standard_pass', 'Standard Pass E-Ticket', 'Full walkthrough access — all published rooms, 48-hour access window.', 'v1', 12, 'SGD', '["Full walkthrough — all published rooms","48-hour access window"]'::jsonb),
  ('91bc9b6c-e084-457f-9828-c3899110568c', 'premium_pass', 'Premium Pass E-Ticket', 'Everything in Standard Pass plus AI Cultural Guide and hidden exhibits.', 'v1', 18, 'SGD', '["Everything in Standard Pass","AI Cultural Guide included","Hidden exhibits unlocked","Downloadable story cards"]'::jsonb),
  ('91bc9b6c-e084-457f-9828-c3899110568c', 'family_pass', 'Family Pass E-Ticket (up to 5)', 'Up to 5 visitors with all Premium Pass features.', 'v1', 39, 'SGD', '["Up to 5 visitors","All Premium Pass features","Kid-friendly AI guide mode"]'::jsonb),
  ('91bc9b6c-e084-457f-9828-c3899110568c', 'school_block_40', 'School Block E-Ticket — 40 pax', '40 student passes with teacher dashboard link.', 'v1', 280, 'SGD', '["40 student passes (SGD 7/pax)","Teacher dashboard link","Learning-mode AI guide"]'::jsonb),
  ('91bc9b6c-e084-457f-9828-c3899110568c', 'school_block_100', 'School Block E-Ticket — 100 pax', '100 student passes with MOE-friendly invoice.', 'v1', 600, 'SGD', '["100 student passes (SGD 6/pax)","MOE-friendly invoice","Redemption codes"]'::jsonb),
  ('91bc9b6c-e084-457f-9828-c3899110568c', 'corporate_block_50', 'Corporate Block E-Ticket — 50 pax', '50 Premium passes with co-branded landing screen.', 'v1', 650, 'SGD', '["50 Premium passes (SGD 13/pax)","Co-branded landing screen","Invoice-ready enquiry"]'::jsonb),
  ('91bc9b6c-e084-457f-9828-c3899110568c', 'event_vip_tour', 'Event / VIP Private Tour E-Ticket', 'Timed group session with host commentary.', 'v1', 1500, 'SGD', '["Timed group session","Custom welcome from host","Host commentary throughout"]'::jsonb)
on conflict (tenant_id, package_type, design_version) do nothing;
