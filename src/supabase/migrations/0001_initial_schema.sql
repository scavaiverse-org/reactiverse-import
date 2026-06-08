-- Supabase migration generated from Base44 entity schemas
-- Assumptions:
-- 1. Base44 record ids are text and are preserved in `id`.
-- 2. Base44 built-ins are mapped to id, created_at, updated_at, created_by_id.
-- 3. JSON/object fields are stored as jsonb.
-- 4. Cross-entity relationships are mostly implicit in the Base44 project and therefore represented with indexed text ids.

create extension if not exists pgcrypto;

create type publish_state as enum ('draft','pending_review','approved','scheduled','published','hidden','archived','rejected');
create type visibility_scope as enum ('public','tenant','platform','private','restricted');
create type tenant_status as enum ('draft','staging','live','archived');
create type issue_status as enum ('open','investigating','fixed','ignored','regressed');
create type issue_severity as enum ('critical','major','minor','warning','info');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'user',
  tenant_id text,
  tenant_ids text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.museum_tenants (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  slug text not null unique,
  status tenant_status not null default 'draft',
  logo_url text,
  description text,
  region text,
  owner text,
  custom_domain text,
  enabled_modules text[],
  theme_config jsonb not null default '{}'::jsonb,
  launch_readiness numeric default 0,
  created_by_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.experience_configs (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  museum_id text,
  tenant_name text,
  module_key text,
  walkthrough_key text,
  title text,
  description text,
  status text not null default 'draft' check (status in ('draft','published','hidden','archived')),
  onboarding_config jsonb default '{}'::jsonb,
  ai_guide_config jsonb default '{}'::jsonb,
  walkthrough_config jsonb default '{}'::jsonb,
  rooms jsonb default '[]'::jsonb,
  legacy_backup_before_dynamic_walkthrough_migration jsonb,
  room_preview_config jsonb default '{}'::jsonb,
  gamification_config jsonb default '{}'::jsonb,
  experience_modes text[],
  theme_config jsonb default '{}'::jsonb,
  last_updated timestamptz,
  created_by_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index experience_configs_tenant_idx on public.experience_configs(tenant_id);
create index experience_configs_walkthrough_idx on public.experience_configs(walkthrough_key);

create table public.museum_page_configs (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  museum_id text not null,
  tenant_slug text not null,
  page_key text not null,
  page_name text not null,
  page_title text,
  page_content text,
  ownership_scope text not null default 'museum',
  created_by text,
  updated_by text,
  publish_state text not null default 'draft' check (publish_state in ('draft','published','archived')),
  visibility_state text not null default 'public' check (visibility_state in ('public','private','restricted')),
  published_version numeric default 0,
  draft_version numeric default 1,
  hero_media jsonb default '{}'::jsonb,
  sections jsonb default '[]'::jsonb,
  cards jsonb default '[]'::jsonb,
  media_slots jsonb default '[]'::jsonb,
  cta_slots jsonb default '[]'::jsonb,
  architecture_presets jsonb default '[]'::jsonb,
  seo jsonb default '{}'::jsonb,
  accessibility jsonb default '{}'::jsonb,
  verification_report jsonb default '{}'::jsonb,
  mirror_contract jsonb default '{}'::jsonb,
  architecture_layer text,
  canonical_route text,
  admin_mirror_route text,
  render_engine_dependency text,
  last_published_at timestamptz,
  last_edited_at timestamptz,
  updated_by_user text,
  created_by_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(tenant_id, page_key)
);
create index museum_page_configs_tenant_idx on public.museum_page_configs(tenant_id);
create index museum_page_configs_slug_page_idx on public.museum_page_configs(tenant_slug, page_key);

create table public.exhibits (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  tenant_name text,
  title text not null,
  summary text,
  description text,
  long_description text,
  historical_significance text,
  related_exhibits text[],
  media_references text[],
  ai_guide_context text,
  station_number numeric not null,
  category text not null check (category in ('opera_tradition','costume_art','music_instruments','stage_design','cultural_heritage','interactive','commerce')),
  image_url text,
  audio_url text,
  narrative_text text,
  is_featured boolean default false,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  engagement_count numeric default 0,
  tags text[],
  created_by_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index exhibits_tenant_idx on public.exhibits(tenant_id);
create index exhibits_status_idx on public.exhibits(status);

create table public.tickets (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  tenant_name text,
  ticket_type text not null,
  visitor_name text not null,
  visitor_email text not null,
  quantity numeric default 1,
  total_price numeric,
  currency text default 'SGD',
  status text not null default 'pending' check (status in ('pending','confirmed','used','expired','refunded')),
  visit_date date,
  promo_code text,
  notes text,
  access_mode text check (access_mode in ('virtual','physical','hybrid')),
  ticket_addons text[],
  accessibility_needs text,
  group_type text check (group_type in ('individual','family','school','corporate','other')),
  confirmation_stage text,
  source_step text,
  commerce_interest boolean default false,
  ai_help_used boolean default false,
  created_by_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tickets_tenant_idx on public.tickets(tenant_id);
create index tickets_email_idx on public.tickets(visitor_email);

create table public.vendors (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  tenant_name text,
  business_name text not null,
  contact_name text not null,
  email text not null,
  phone text,
  category text not null check (category in ('cultural_arts','food_beverage','merchandise','experiences','education','technology','corporate_sponsor')),
  description text,
  logo_url text,
  status text not null default 'pending' check (status in ('pending','approved','active','suspended','rejected')),
  slot_type text default 'standard' check (slot_type in ('standard','premium','featured','anchor')),
  website_url text,
  products_count numeric default 0,
  revenue_total numeric default 0,
  created_by_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index vendors_tenant_idx on public.vendors(tenant_id);
create index vendors_status_idx on public.vendors(status);

create table public.tenant_media (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  owner_id text,
  uploader_id text,
  media_type text not null default 'image' check (media_type in ('image','video','pdf','document','audio','url','embed','ai_generated')),
  title text not null,
  description text,
  tags text[],
  storage_url text not null,
  thumbnail_url text,
  source_url text,
  file_size numeric,
  mime_type text,
  visibility_scope text default 'tenant',
  visibility text default 'private' check (visibility in ('public','private','restricted')),
  publish_state publish_state not null default 'draft',
  metadata jsonb default '{}'::jsonb,
  role_permissions jsonb default '{}'::jsonb,
  ai_generated boolean default false,
  ai_summary text,
  ai_tags text[],
  approved_by text,
  created_by text,
  updated_by text,
  deleted_at timestamptz,
  archived_at timestamptz,
  created_by_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tenant_media_tenant_idx on public.tenant_media(tenant_id);

create table public.music_assets (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  created_by text,
  updated_by text,
  visibility text default 'private' check (visibility in ('public','private','restricted')),
  ownership_scope text default 'tenant' check (ownership_scope in ('platform','tenant')),
  title text not null,
  description text,
  file_url text not null,
  file_type text not null,
  file_name text,
  file_size numeric,
  duration numeric,
  enabled boolean default true,
  status text not null default 'active' check (status in ('active','draft','disconnected','archived')),
  target_type text not null default 'Onboarding Overlay',
  target_key text not null,
  target_label text not null,
  placement text default 'Background music',
  autoplay boolean default true,
  loop boolean default true,
  volume numeric default 0.7,
  fade_in_ms numeric default 1500,
  fade_out_ms numeric default 1000,
  start_at_seconds numeric default 0,
  end_at_seconds numeric,
  created_by_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index music_assets_tenant_idx on public.music_assets(tenant_id);

create table public.analytics_events (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  tenant_name text,
  event_type text not null,
  event_data jsonb default '{}'::jsonb,
  source_page text,
  device_type text,
  created_by_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index analytics_events_tenant_idx on public.analytics_events(tenant_id);
create index analytics_events_type_idx on public.analytics_events(event_type);

create table public.qa_sentinel_issues (
  id text primary key default gen_random_uuid()::text,
  issue_key text not null,
  title text not null,
  description text,
  severity issue_severity not null default 'warning',
  status issue_status not null default 'open',
  domain text default 'system',
  area text,
  route text not null,
  component_name text,
  cta_label text,
  function_name text,
  expected_result text,
  actual_result text,
  human_impact text,
  likely_cause text,
  root_cause_hypothesis text,
  fix_summary text,
  recommended_fix_steps text[],
  likely_files_affected text[],
  likely_components_affected text[],
  risk_level text default 'medium',
  fix_complexity text default 'moderate',
  estimated_fix_area text default 'unknown',
  regression_test_steps text[],
  verification_command text,
  safe_to_autofix boolean default false,
  autofix_forbidden_reason text,
  developer_notes text,
  reproduction_steps text[],
  evidence jsonb default '{}'::jsonb,
  console_errors text[],
  network_errors jsonb default '[]'::jsonb,
  screenshot_url text,
  video_url text,
  tenant_id text,
  tenant_slug text,
  first_seen_at timestamptz not null,
  last_seen_at timestamptz not null,
  last_verified_at timestamptz,
  fixed_at timestamptz,
  regression_count numeric default 0,
  occurrence_count numeric default 1,
  test_run_id text,
  fingerprint text not null,
  created_by_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(fingerprint)
);
create index qa_sentinel_issues_status_idx on public.qa_sentinel_issues(status);
create index qa_sentinel_issues_route_idx on public.qa_sentinel_issues(route);

-- Generic content/config tables for lower-traffic Base44 entities.
create table public.master_prompts (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  owner_id text,
  prompt_key text not null,
  name text not null,
  description text,
  scope text not null default 'tenant',
  current_version_id text,
  visibility_scope text default 'tenant',
  role_permissions jsonb default '{}'::jsonb,
  publish_state publish_state not null default 'draft',
  approved_by text,
  created_by text,
  updated_by text,
  deleted_at timestamptz,
  archived_at timestamptz,
  created_by_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(prompt_key)
);

create table public.prompt_versions (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  owner_id text,
  master_prompt_id text not null,
  version_number numeric default 1,
  prompt_text text not null,
  system_instructions text,
  model_config jsonb default '{}'::jsonb,
  test_inputs jsonb default '[]'::jsonb,
  test_results jsonb default '[]'::jsonb,
  rollout_stage text default 'draft',
  visibility_scope text default 'tenant',
  role_permissions jsonb default '{}'::jsonb,
  publish_state publish_state not null default 'draft',
  approved_by text,
  created_by text,
  updated_by text,
  deleted_at timestamptz,
  archived_at timestamptz,
  created_by_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.content_assets (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  tenant_name text,
  asset_type text not null,
  title text not null,
  url text,
  metadata jsonb default '{}'::jsonb,
  status text default 'draft',
  version text default '1.0',
  file_size text,
  tags text[],
  description text,
  created_by_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index content_assets_tenant_idx on public.content_assets(tenant_id);

create table public.platform_media_registry (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  preset_name text,
  preset_slug text,
  description text,
  ownership_scope text default 'platform',
  assigned_page text not null,
  assigned_component text not null,
  render_type text not null default 'background',
  media_type text not null default 'image',
  source_type text not null default 'url',
  file_url text not null,
  thumbnail_url text,
  original_file_name text,
  file_extension text,
  mime_type text,
  file_size numeric,
  autoplay boolean default true,
  loop boolean default true,
  muted boolean default true,
  publish_state text not null default 'published',
  is_active boolean default true,
  tags text[],
  created_by text,
  updated_by text,
  created_by_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.master_media_registry (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  preset_name text,
  preset_slug text,
  description text,
  museum_category text default 'AOM',
  museum_category_code text not null default 'AOM',
  museum_category_name text default 'Asian Operatic Museum',
  media_type text not null default 'image',
  source_type text not null default 'url',
  file_url text not null,
  thumbnail_url text,
  original_file_name text,
  file_extension text,
  mime_type text,
  file_size numeric,
  duration_seconds numeric,
  width numeric,
  height numeric,
  aspect_ratio text,
  autoplay boolean default true,
  loop boolean default true,
  muted boolean default true,
  is_active boolean default true,
  status text default 'active',
  assigned_sections text[],
  tags text[],
  notes text,
  created_by text,
  updated_by text,
  created_by_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tenant_content (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  owner_id text,
  page_key text not null,
  section_key text,
  content_type text not null default 'section',
  title text not null,
  subtitle text,
  body text,
  structured_data jsonb default '{}'::jsonb,
  layout_config jsonb default '{}'::jsonb,
  media_ids text[],
  visibility_scope text default 'tenant',
  role_permissions jsonb default '{}'::jsonb,
  publish_state publish_state not null default 'draft',
  scheduled_at timestamptz,
  published_at timestamptz,
  approved_by text,
  created_by text,
  updated_by text,
  deleted_at timestamptz,
  archived_at timestamptz,
  version numeric default 1,
  previous_version_id text,
  ai_summary text,
  ai_tags text[],
  created_by_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tenant_content_tenant_page_idx on public.tenant_content(tenant_id, page_key);

create table public.module_configs (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  tenant_name text,
  module_key text not null,
  enabled boolean default true,
  config_json jsonb default '{}'::jsonb,
  status text default 'unconfigured',
  content_readiness numeric default 0,
  config_completeness numeric default 0,
  record_count numeric default 0,
  last_updated timestamptz,
  created_by_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(tenant_id, module_key)
);

create table public.experience_presets (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  owner_user_id text,
  assigned_tenant_ids text[],
  preset_name text not null,
  preset_description text,
  preset_category text,
  preset_scope text not null default 'tenant',
  source_mode text default 'easy',
  created_from_experience_id text,
  canonical_experience_config jsonb not null,
  easy_mode_snapshot jsonb default '{}'::jsonb,
  expert_mode_snapshot jsonb default '{}'::jsonb,
  room_count numeric default 0,
  room_types text[],
  media_manifest jsonb default '[]'::jsonb,
  audio_manifest jsonb default '[]'::jsonb,
  theme_manifest jsonb default '{}'::jsonb,
  interaction_manifest jsonb default '{}'::jsonb,
  hotspot_manifest jsonb default '[]'::jsonb,
  transition_manifest jsonb default '[]'::jsonb,
  ambience_manifest jsonb default '[]'::jsonb,
  schema_health jsonb default '{}'::jsonb,
  usage_count numeric default 0,
  version numeric default 1,
  is_system_preset boolean default false,
  is_tenant_preset boolean default true,
  is_customized boolean default false,
  is_archived boolean default false,
  last_applied_at timestamptz,
  created_by_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tenant_preset_data (
  id text primary key default gen_random_uuid()::text,
  tenant_id text not null,
  museum_id text,
  tenant_name text,
  preset_key text not null,
  preset_name text not null,
  walkthrough_key text not null,
  source_preset_id text,
  preset_data jsonb not null,
  rooms jsonb default '[]'::jsonb,
  status text default 'saved',
  created_by_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.qa_sentinel_exports (
  id text primary key default gen_random_uuid()::text,
  export_id text not null unique,
  created_by text,
  export_type text not null check (export_type in ('json','markdown','txt')),
  issue_count numeric default 0,
  critical_count numeric default 0,
  major_count numeric default 0,
  minor_count numeric default 0,
  warning_count numeric default 0,
  regression_count numeric default 0,
  included_tabs text[],
  filters jsonb default '{}'::jsonb,
  export_blob text not null,
  checksum text,
  version text,
  created_by_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);