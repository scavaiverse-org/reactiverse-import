-- Deterministic publish pipeline: immutable per-museum publish snapshots.
-- No code path may ever update or delete rows in this table; every publish
-- inserts a new row and bumps museum_tenants.published_manifest_version.

create table if not exists public.published_experience_manifests (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  museum_id text,
  tenant_slug text,
  manifest_version numeric not null,
  schema_version numeric not null default 1,
  card jsonb not null default '{}'::jsonb,
  walkthroughs jsonb not null default '[]'::jsonb,
  published_at text,
  published_by text,
  source_experience_config_ids text[],
  integrity jsonb,
  created_at timestamptz not null default now()
);

create index if not exists published_experience_manifests_tenant_idx on public.published_experience_manifests(tenant_id);
create unique index if not exists published_experience_manifests_tenant_version_idx on public.published_experience_manifests(tenant_id, manifest_version);

alter table public.published_experience_manifests enable row level security;

create policy "published_experience_manifests_read_all" on public.published_experience_manifests
  for select using (true);

create policy "published_experience_manifests_service_role_all" on public.published_experience_manifests
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "published_experience_manifests_authenticated_insert" on public.published_experience_manifests
  for insert with check (auth.role() = 'authenticated');

alter table public.museum_tenants
  add column if not exists published_manifest_id text,
  add column if not exists published_manifest_version numeric not null default 0;
