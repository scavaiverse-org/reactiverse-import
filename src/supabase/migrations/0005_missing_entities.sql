-- AUTO-GENERATED from Base44 entity schemas
-- Source: Base44 app 6a171d7f6abbd230a00539e2 (SCAVAI, slug=scaverse)
-- Run: supabase migration up  (after review)

-- AIGuideConfig (13 fields)
create table if not exists public.ai_guide_configs (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  seed_key text not null,
  guide_name text not null,
  guide_personality text,
  welcome_message text,
  fallback_message text,
  allowed_topics text[],
  blocked_topics text[],
  source_policy text,
  citation_policy text,
  language_level text,
  tone text,
  enabled boolean,
  created_by text,
  updated_by text,
  created_by_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ai_guide_configs_tenant_idx on public.ai_guide_configs(tenant_id);

-- AIGuideQA (7 fields)
create table if not exists public.ai_guide_qa (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  seed_key text not null,
  guide_id text,
  question text not null,
  answer text not null,
  topic text,
  enabled boolean,
  created_by text,
  updated_by text,
  created_by_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ai_guide_qa_tenant_idx on public.ai_guide_qa(tenant_id);

-- AIOutput (20 fields)
create table if not exists public.ai_outputs (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  owner_id text,
  execution_id text,
  target_entity text,
  target_id text,
  output_type text not null default 'summary',
  text text,
  json jsonb,
  confidence numeric,
  review_state text default 'unreviewed',
  visibility_scope text default 'tenant',
  role_permissions jsonb,
  publish_state text not null default 'draft',
  approved_by text,
  deleted_at text,
  archived_at text,
  created_by text,
  updated_by text,
  created_by_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (output_type in ('summary','tags','category','moderation','seo','draft_content','recommendation','embedding','custom')),
  check (review_state in ('unreviewed','approved','rejected','needs_revision')),
  check (visibility_scope in ('platform','tenant','private')),
  check (publish_state in ('draft','pending_review','approved','scheduled','published','hidden','archived','rejected'))
);
create index if not exists ai_outputs_tenant_idx on public.ai_outputs(tenant_id);

-- AIWorkflow (18 fields)
create table if not exists public.ai_workflows (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  owner_id text,
  workflow_key text not null,
  name_ text not null,
  description text,
  trigger_type text not null default 'manual',
  steps jsonb,
  is_active boolean default true,
  visibility_scope text default 'tenant',
  role_permissions jsonb,
  publish_state text not null default 'draft',
  approved_by text,
  deleted_at text,
  archived_at text,
  created_by text,
  updated_by text,
  created_by_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (trigger_type in ('upload','manual','publish','schedule','content_update','media_update')),
  check (visibility_scope in ('platform','tenant','private')),
  check (publish_state in ('draft','pending_review','approved','scheduled','published','hidden','archived','rejected'))
);
create index if not exists ai_workflows_tenant_idx on public.ai_workflows(tenant_id);

-- ApprovalRequest (21 fields)
create table if not exists public.approval_requests (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  owner_id text,
  target_entity text not null,
  target_id text not null,
  requested_state text,
  status text not null default 'pending',
  reviewer_id text,
  reviewer_comments text,
  rejection_reason text,
  requested_by text,
  reviewed_at text,
  visibility_scope text default 'tenant',
  role_permissions jsonb,
  publish_state text default 'pending_review',
  approved_by text,
  deleted_at text,
  archived_at text,
  created_by text,
  updated_by text,
  created_by_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('pending','approved','rejected','revision_requested','escalated','cancelled')),
  check (visibility_scope in ('platform','tenant','private')),
  check (publish_state in ('draft','pending_review','approved','scheduled','published','hidden','archived','rejected'))
);
create index if not exists approval_requests_tenant_idx on public.approval_requests(tenant_id);

-- AuditLog (11 fields)
create table if not exists public.audit_log (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  user_id text,
  user_name text,
  action text not null,
  target_type text not null,
  target_id text,
  target_name text,
  details text,
  metadata jsonb,
  timestamp text,
  ip_address text,
  severity text default 'info',
  created_by text,
  updated_by text,
  created_by_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (severity in ('info','warning','critical'))
);
create index if not exists audit_log_tenant_idx on public.audit_log(tenant_id);

-- CommerceProduct (14 fields)
create table if not exists public.commerce_products (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  seed_key text not null,
  vendor_id text,
  product_name text not null,
  description text,
  price numeric,
  currency text,
  stock_quantity numeric,
  image_url text,
  category text,
  status text,
  featured boolean,
  shipping_required boolean,
  digital_delivery boolean,
  created_by text,
  updated_by text,
  created_by_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists commerce_products_tenant_idx on public.commerce_products(tenant_id);

-- ContentRevision (19 fields)
create table if not exists public.content_revisions (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  owner_id text,
  target_entity text not null,
  target_id text not null,
  version_number numeric not null default 1,
  snapshot jsonb not null,
  diff jsonb,
  change_summary text,
  restore_point boolean default true,
  visibility_scope text default 'tenant',
  role_permissions jsonb,
  publish_state text default 'draft',
  approved_by text,
  deleted_at text,
  archived_at text,
  created_by text,
  updated_by text,
  created_by_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (visibility_scope in ('platform','tenant','private')),
  check (publish_state in ('draft','pending_review','approved','scheduled','published','hidden','archived','rejected'))
);
create index if not exists content_revisions_tenant_idx on public.content_revisions(tenant_id);

-- ExperienceEditorDefaultSetting (29 fields)
create table if not exists public.experience_editor_default_settings (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  slug text not null,
  title text not null,
  default_floor_detection_method text,
  fallback_floor_detection_method text,
  manual_floor_method text,
  default_sprite_anchor text,
  default_sprite_floor_locked boolean,
  default_sprite_shadow_enabled boolean,
  default_sprite_shadow_strength numeric,
  default_sprite_opacity numeric,
  default_sprite_rotation numeric,
  default_sprite_scale numeric,
  default_safe_zone_margin_percent numeric,
  default_mobile_safe_zone_margin_percent numeric,
  default_text_readability_mode text,
  default_preview_required_before_publish boolean,
  default_qa_required_before_publish boolean,
  default_reduced_motion_available boolean,
  easy_mode_enabled boolean,
  expert_mode_enabled boolean,
  museum_co_curator_enabled boolean,
  analytics_memory_enabled boolean,
  scrollable_coordinate_lock_enabled boolean,
  status text not null,
  created_by_system boolean default true,
  version text,
  sort_order numeric,
  created_by text,
  updated_by text,
  created_by_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists experience_editor_default_settings_tenant_idx on public.experience_editor_default_settings(tenant_id);

-- ExperienceEditorModule (11 fields)
create table if not exists public.experience_editor_modules (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  slug text not null,
  title text not null,
  description text,
  mode_availability text[],
  status text not null,
  core boolean default false,
  created_by_system boolean default true,
  version text,
  sort_order numeric,
  created_by text,
  updated_by text,
  created_by_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists experience_editor_modules_tenant_idx on public.experience_editor_modules(tenant_id);

-- ExperienceEditorQARule (13 fields)
create table if not exists public.experience_editor_qa_rules (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  slug text not null,
  title text not null,
  description text,
  severity text not null,
  rule_type text,
  blocks_publish boolean default false,
  mode_availability text[],
  status text not null,
  created_by_system boolean default true,
  version text,
  sort_order numeric,
  created_by text,
  updated_by text,
  created_by_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists experience_editor_qa_rules_tenant_idx on public.experience_editor_qa_rules(tenant_id);

-- ExperienceEditorTemplate (13 fields)
create table if not exists public.experience_editor_templates (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  slug text not null,
  title text not null,
  description text,
  mood text,
  music text,
  lighting text,
  mode_availability text[],
  status text not null,
  created_by_system boolean default true,
  version text,
  sort_order numeric,
  created_by text,
  updated_by text,
  created_by_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists experience_editor_templates_tenant_idx on public.experience_editor_templates(tenant_id);

-- ExperienceEditorTool (16 fields)
create table if not exists public.experience_editor_tools (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  slug text not null,
  title text not null,
  description text,
  module_slug text not null,
  tool_type text,
  mode_availability text[],
  status text not null,
  sort_order numeric,
  requires_media boolean default false,
  requires_room_image boolean default false,
  requires_selected_artifact boolean default false,
  qa_related boolean default false,
  created_by_system boolean default true,
  version text,
  created_by text,
  updated_by text,
  created_by_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists experience_editor_tools_tenant_idx on public.experience_editor_tools(tenant_id);

-- HomeConfig (39 fields)
create table if not exists public.home_configs (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  title text not null,
  status text default 'published',
  eyebrow text,
  hero_title text not null,
  hero_subtitle text,
  hero_body text,
  primary_cta_label text,
  primary_cta_path text,
  secondary_cta_label text,
  secondary_cta_path text,
  tertiary_cta_label text,
  tertiary_cta_path text,
  background_image_url text,
  mobile_hero_image_url text,
  hero_desktop_media_id text,
  hero_tablet_media_id text,
  hero_mobile_media_id text,
  highlight_media_id text,
  visit_card_media_id text,
  aria_card_media_id text,
  stories_card_media_id text,
  future_card_media_id text,
  final_cta_media_id text,
  media_overlay_config jsonb,
  hero_section jsonb,
  museum_highlights_section jsonb,
  museum_highlight_cards jsonb,
  what_you_can_do_section jsonb,
  home_cards jsonb,
  schools_partners_section jsonb,
  platform_preview_section jsonb,
  final_cta_section jsonb,
  metrics jsonb,
  modules jsonb,
  pathways jsonb,
  deployment_sites jsonb,
  final_cta_title text,
  final_cta_body text,
  created_by text,
  updated_by text,
  created_by_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('draft','published','archived'))
);
create index if not exists home_configs_tenant_idx on public.home_configs(tenant_id);

-- HomePageConfig (31 fields)
create table if not exists public.home_page_configs (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  title text not null,
  status text default 'published',
  eyebrow text,
  hero_title text not null,
  hero_subtitle text,
  hero_body text,
  primary_cta_label text,
  primary_cta_path text,
  secondary_cta_label text,
  secondary_cta_path text,
  tertiary_cta_label text,
  tertiary_cta_path text,
  background_image_url text,
  mobile_hero_image_url text,
  hero_desktop_media_id text,
  hero_tablet_media_id text,
  hero_mobile_media_id text,
  highlight_media_id text,
  visit_card_media_id text,
  aria_card_media_id text,
  stories_card_media_id text,
  future_card_media_id text,
  final_cta_media_id text,
  media_overlay_config jsonb,
  metrics jsonb,
  modules jsonb,
  pathways jsonb,
  deployment_sites jsonb,
  final_cta_title text,
  final_cta_body text,
  created_by text,
  updated_by text,
  created_by_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('draft','published','archived'))
);
create index if not exists home_page_configs_tenant_idx on public.home_page_configs(tenant_id);

-- MasterMuseumCategory (7 fields)
create table if not exists public.master_museum_categories (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  category_code text not null,
  category_name text not null,
  description text,
  is_default boolean default false,
  is_active boolean default true,
  created_by text,
  updated_by text,
  created_by_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists master_museum_categories_tenant_idx on public.master_museum_categories(tenant_id);

-- MigrationTracker (9 fields)
create table if not exists public.migration_trackers (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  seed_key text not null,
  area text not null,
  current_dependency text,
  target_system text,
  migration_status text not null,
  affected_files_count numeric,
  risk_level text,
  next_action text,
  owner text,
  created_by text,
  updated_by text,
  created_by_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists migration_trackers_tenant_idx on public.migration_trackers(tenant_id);

-- MuseumArchitecturePreset (13 fields)
create table if not exists public.museum_architecture_presets (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  museum_id text not null,
  tenant_slug text not null,
  preset_key text not null,
  preset_name text not null,
  ownership_scope text not null default 'museum',
  preset_type text not null,
  config jsonb,
  publish_state text not null default 'draft',
  created_by text,
  updated_by text,
  created_by_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ownership_scope in ('museum')),
  check (preset_type in ('hero_media','onboarding_visual','walkthrough_media','guide_avatar','exhibit_visual','overlay','cta_visual','theme')),
  check (publish_state in ('draft','published','archived'))
);
create index if not exists museum_architecture_presets_tenant_idx on public.museum_architecture_presets(tenant_id);

-- MuseumCoCuratorPromptPreset (11 fields)
create table if not exists public.museum_co_curator_prompt_presets (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  slug text not null,
  title text not null,
  description text,
  safety_rule text,
  mode_availability text[],
  status text not null,
  created_by_system boolean default true,
  version text,
  sort_order numeric,
  created_by text,
  updated_by text,
  created_by_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists museum_co_curator_prompt_presets_tenant_idx on public.museum_co_curator_prompt_presets(tenant_id);

-- MuseumMediaRegistry (29 fields)
create table if not exists public.museum_media_registry (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  museum_id text not null,
  tenant_slug text not null,
  name_ text not null,
  preset_name text,
  preset_slug text,
  description text,
  ownership_scope text not null default 'museum',
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
  created_by_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ownership_scope in ('museum')),
  check (render_type in ('background','foreground','overlay','avatar','poster','fallback','cta_visual')),
  check (media_type in ('image','video')),
  check (source_type in ('upload','url')),
  check (publish_state in ('draft','published','archived'))
);
create index if not exists museum_media_registry_tenant_idx on public.museum_media_registry(tenant_id);

-- MuseumModeArtifact (88 fields)
create table if not exists public.museum_mode_artifacts (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  seed_key text not null,
  experience_id text,
  room_id text not null,
  artifact_id text,
  exhibit_id text,
  title text,
  description text,
  source_image_url text,
  media_url text,
  sprite_image_url text,
  processed_sprite_url text,
  active_museum_media_url text,
  sprite_type text,
  background_removed boolean default false,
  background_removal_method text,
  background_removal_confidence numeric,
  background_removal_status text,
  edge_cleanup_status text,
  x numeric,
  y numeric,
  x_percent numeric,
  y_percent numeric,
  width numeric,
  height numeric,
  width_percent numeric,
  height_percent numeric,
  rotation numeric,
  scale numeric default 1,
  opacity numeric default 1,
  z_index numeric,
  depth numeric,
  layer_group text,
  anchor_mode text,
  foot_anchor text,
  floor_locked boolean default true,
  floor_contact_y numeric,
  floor_baseline_y_at_placement numeric,
  semantic_zone_id text,
  placement_confidence numeric,
  placement_method text,
  shadow_enabled boolean default true,
  shadow_strength numeric,
  shadow_blur numeric,
  shadow_offset_x numeric,
  shadow_offset_y numeric,
  reflection_enabled boolean default false,
  reflection_strength numeric,
  locked boolean default false,
  visible boolean default true,
  editable boolean default true,
  interactive boolean default true,
  display_mode text,
  action_type text,
  action_target text,
  header text,
  body text,
  caption text,
  curator_note text,
  accessibility_label text,
  audio_description text,
  video_url text,
  audio_url text,
  transcript text,
  language text,
  created_from_mode text,
  last_edited_from_mode text,
  qa_state text,
  publish_state text,
  artifact_title text,
  artifact_header text,
  artifact_description text,
  artifact_body text,
  x_position_percent numeric,
  y_position_percent numeric,
  rotation_degrees numeric,
  interaction_mode text,
  placement_type text,
  semantic_confidence numeric,
  fallback_used boolean,
  floor_zone_id text,
  mobile_position_override jsonb,
  version numeric default 2,
  created_by text,
  updated_by text,
  created_by_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists museum_mode_artifacts_tenant_idx on public.museum_mode_artifacts(tenant_id);

-- MuseumModeObjectType (12 fields)
create table if not exists public.museum_mode_object_types (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  slug text not null,
  title text not null,
  description text,
  default_anchor text,
  floor_locked boolean default false,
  mode_availability text[],
  status text not null,
  created_by_system boolean default true,
  version text,
  sort_order numeric,
  created_by text,
  updated_by text,
  created_by_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists museum_mode_object_types_tenant_idx on public.museum_mode_object_types(tenant_id);

-- OnboardingProgress (7 fields)
create table if not exists public.onboarding_progress (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  tenant_name text,
  stage text default 'welcome',
  completed_steps text[],
  preferences jsonb,
  has_purchased_ticket boolean default false,
  ai_recommendations text[],
  created_by text,
  updated_by text,
  created_by_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (stage in ('welcome','discovery','exploration','activation','completed'))
);
create index if not exists onboarding_progress_tenant_idx on public.onboarding_progress(tenant_id);

-- OnboardingStep (9 fields)
create table if not exists public.onboarding_steps (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  seed_key text not null,
  audience text not null,
  step_order numeric not null,
  title text not null,
  description text,
  route text,
  action_label text,
  completed_by_default boolean,
  flow_key text,
  created_by text,
  updated_by text,
  created_by_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists onboarding_steps_tenant_idx on public.onboarding_steps(tenant_id);

-- PermissionGrant (28 fields)
create table if not exists public.permission_grants (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  owner_id text,
  role text not null,
  user_id text,
  entity_name text not null,
  scope text not null default 'tenant',
  can_read boolean default false,
  can_write boolean default false,
  can_publish boolean default false,
  can_approve boolean default false,
  can_delete boolean default false,
  can_archive boolean default false,
  can_upload boolean default false,
  can_manage_users boolean default false,
  can_manage_billing boolean default false,
  can_manage_prompts boolean default false,
  can_view_analytics boolean default false,
  can_export_data boolean default false,
  visibility_scope text default 'tenant',
  role_permissions jsonb,
  publish_state text default 'published',
  approved_by text,
  deleted_at text,
  archived_at text,
  created_by text,
  updated_by text,
  created_by_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (scope in ('platform','tenant','own','public')),
  check (visibility_scope in ('platform','tenant','private')),
  check (publish_state in ('draft','pending_review','approved','scheduled','published','hidden','archived','rejected'))
);
create index if not exists permission_grants_tenant_idx on public.permission_grants(tenant_id);

-- PlatformArchitecturePreset (10 fields)
create table if not exists public.platform_architecture_presets (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  preset_key text not null,
  preset_name text not null,
  ownership_scope text not null default 'platform',
  preset_type text not null,
  config jsonb,
  publish_state text not null default 'draft',
  created_by text,
  updated_by text,
  created_by_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ownership_scope in ('platform')),
  check (preset_type in ('overlay','typography','animation','cta_engine','fallback','theme','validator')),
  check (publish_state in ('draft','published','archived'))
);
create index if not exists platform_architecture_presets_tenant_idx on public.platform_architecture_presets(tenant_id);

-- PlatformHealth (8 fields)
create table if not exists public.platform_health (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  service_key text not null,
  service_name text not null,
  status text default 'operational',
  message text,
  last_checked text,
  uptime_percent numeric default 100,
  response_time_ms numeric,
  error_count numeric default 0,
  created_by text,
  updated_by text,
  created_by_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('operational','degraded','outage','maintenance'))
);
create index if not exists platform_health_tenant_idx on public.platform_health(tenant_id);

-- PlatformPageConfig (19 fields)
create table if not exists public.platform_page_configs (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  page_key text not null,
  page_name text not null,
  ownership_scope text not null default 'platform',
  status text not null default 'draft',
  published_version numeric default 0,
  draft_version numeric default 1,
  sections jsonb,
  cards jsonb,
  media_slots jsonb,
  cta_slots jsonb,
  seo jsonb,
  accessibility jsonb,
  verification_report jsonb,
  mirror_contract jsonb,
  architecture_layer text,
  canonical_route text,
  admin_mirror_route text,
  last_published_at text,
  last_edited_at text,
  created_by text,
  updated_by text,
  created_by_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (page_key in ('platform_home','become_a_tenant','virtual_experience','platform_overview','platform_about','platform_pricing','platform_contact','platform_marketplace','platform_showcase','platform_analytics','platform_white_label','platform_infrastructure','platform_services','platform_launch','platform_docs','platform_system','platform_admin','tenant_registry','architecture_blueprint','platform_navigation','platform_templates','platform_seo','platform_landing_pages','platform_featured_museums','platform_settings')),
  check (ownership_scope in ('platform')),
  check (status in ('draft','published','archived'))
);
create index if not exists platform_page_configs_tenant_idx on public.platform_page_configs(tenant_id);

-- PromptExecution (22 fields)
create table if not exists public.prompt_executions (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  owner_id text,
  master_prompt_id text,
  prompt_version_id text not null,
  workflow_id text,
  target_entity text,
  target_id text,
  input jsonb,
  output_id text,
  status text not null default 'queued',
  error_message text,
  token_usage jsonb,
  visibility_scope text default 'tenant',
  role_permissions jsonb,
  publish_state text default 'draft',
  approved_by text,
  deleted_at text,
  archived_at text,
  created_by text,
  updated_by text,
  created_by_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('queued','running','completed','failed','cancelled')),
  check (visibility_scope in ('platform','tenant','private')),
  check (publish_state in ('draft','pending_review','approved','scheduled','published','hidden','archived','rejected'))
);
create index if not exists prompt_executions_tenant_idx on public.prompt_executions(tenant_id);

-- PublicContent (13 fields)
create table if not exists public.public_content (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  page_key text not null,
  title text not null,
  subtitle text not null,
  body text not null,
  cta_label text not null,
  cta_path text not null,
  secondary_cta_label text,
  secondary_cta_path text,
  status text not null default 'published',
  last_updated text,
  owner text not null,
  source text not null,
  public_visibility boolean default true,
  created_by text,
  updated_by text,
  created_by_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (page_key in ('home','walkthrough','guide','tickets','vendors','commerce','platform','white_label','analytics','documentation_notes')),
  check (status in ('draft','review','published','archived'))
);
create index if not exists public_content_tenant_idx on public.public_content(tenant_id);

-- PublishLog (22 fields)
create table if not exists public.publish_logs (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  owner_id text,
  target_entity text not null,
  target_id text not null,
  from_state text not null,
  to_state text not null,
  published_version_id text,
  published_by text not null,
  published_at text,
  scheduled_at text,
  rollback_from_log_id text,
  notes text,
  visibility_scope text default 'tenant',
  role_permissions jsonb,
  publish_state text default 'published',
  approved_by text,
  deleted_at text,
  archived_at text,
  created_by text,
  updated_by text,
  created_by_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (visibility_scope in ('platform','tenant','private')),
  check (publish_state in ('draft','pending_review','approved','scheduled','published','hidden','archived','rejected'))
);
create index if not exists publish_logs_tenant_idx on public.publish_logs(tenant_id);

-- QASentinelCheck (13 fields)
create table if not exists public.qa_sentinel_checks (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  check_key text not null,
  label text not null,
  domain text,
  route text,
  check_type text not null,
  selector text,
  expected_behavior text not null,
  enabled boolean not null default true,
  critical boolean default false,
  tenant_scope text default 'global',
  last_status text default 'unknown',
  last_checked_at text,
  last_issue_key text,
  created_by text,
  updated_by text,
  created_by_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (check_type in ('route','cta','form','upload','permission','data_persistence','redirect','media_binding','admin_tab','frontend_backend_match','spatial_editor','publish_gate')),
  check (tenant_scope in ('global','per_tenant')),
  check (last_status in ('unknown','passing','failing','skipped'))
);
create index if not exists qa_sentinel_checks_tenant_idx on public.qa_sentinel_checks(tenant_id);

-- QASentinelEvent (12 fields)
create table if not exists public.qa_sentinel_events (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  event_type text not null,
  route text,
  component_name text,
  target_label text,
  target_selector text,
  message text,
  metadata jsonb,
  severity text default 'info',
  timestamp text not null,
  test_run_id text,
  tenant_slug text,
  created_by text,
  updated_by text,
  created_by_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (event_type in ('click','route_visit','form_submit','save_attempt','api_error','console_error','upload_attempt','permission_check','render_error','issue_created','issue_updated','issue_fixed','regression_detected')),
  check (severity in ('info','warning','critical'))
);
create index if not exists qa_sentinel_events_tenant_idx on public.qa_sentinel_events(tenant_id);

-- QASentinelRun (18 fields)
create table if not exists public.qa_sentinel_runs (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  run_id text not null,
  run_type text not null default 'manual',
  status text not null default 'running',
  started_at text not null,
  finished_at text,
  duration_ms numeric,
  routes_tested numeric default 0,
  ctas_tested numeric default 0,
  forms_tested numeric default 0,
  functions_tested numeric default 0,
  issues_found numeric default 0,
  critical_count numeric default 0,
  major_count numeric default 0,
  minor_count numeric default 0,
  tenant_slug text,
  summary text,
  coverage_map jsonb,
  created_by text,
  updated_by text,
  created_by_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (run_type in ('manual','scheduled','live_user','smoke','full','regression')),
  check (status in ('running','passed','failed','partial','cancelled'))
);
create index if not exists qa_sentinel_runs_tenant_idx on public.qa_sentinel_runs(tenant_id);

-- RolePermission (4 fields)
create table if not exists public.role_permissions (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  seed_key text not null,
  role text not null,
  permissions text[],
  description text,
  created_by text,
  updated_by text,
  created_by_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists role_permissions_tenant_idx on public.role_permissions(tenant_id);

-- RoomSemanticEnginePreset (12 fields)
create table if not exists public.room_semantic_engine_presets (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  slug text not null,
  title text not null,
  description text,
  method text not null,
  default_enabled boolean default true,
  mode_availability text[],
  status text not null,
  created_by_system boolean default true,
  version text,
  sort_order numeric,
  created_by text,
  updated_by text,
  created_by_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists room_semantic_engine_presets_tenant_idx on public.room_semantic_engine_presets(tenant_id);

-- RoomSemanticLayout (41 fields)
create table if not exists public.room_semantic_layouts (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  seed_key text not null,
  room_id text not null,
  semantic_method text,
  floor_detected boolean default false,
  floor_y_min numeric,
  floor_y_max numeric,
  floor_baseline_y numeric,
  floor_confidence numeric,
  floor_confidence_label text,
  fallback_used boolean default false,
  detection_method text,
  manual_floor_override boolean default false,
  manual_floor_baseline_y numeric,
  human_verified boolean default false,
  safe_placement_zones jsonb,
  floor_zones jsonb,
  wall_zones jsonb,
  ceiling_zones jsonb,
  display_zones jsonb,
  restricted_zones jsonb,
  safe_text_zones jsonb,
  mobile_safe_zones jsonb,
  scan_metadata jsonb,
  scan_sample_rows jsonb,
  scan_best_transition numeric,
  scan_brightness_delta numeric,
  scan_saturation_delta numeric,
  scan_edge_delta numeric,
  image_width numeric,
  image_height numeric,
  aspect_ratio numeric,
  last_scan_at text,
  last_scan_source text,
  wall_y_min numeric,
  wall_y_max numeric,
  suggested_anchor_points jsonb,
  perspective_hint text,
  confidence numeric,
  notes text,
  version numeric default 2,
  created_by text,
  updated_by text,
  created_by_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists room_semantic_layouts_tenant_idx on public.room_semantic_layouts(tenant_id);

-- RouteCoverage (11 fields)
create table if not exists public.route_coverage (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  seed_key text not null,
  route text not null,
  route_type text,
  required_role text,
  tenant_scoped boolean,
  expected_status text,
  test_status text not null,
  blocked_access_test boolean,
  actor_role text,
  actor_user_id text,
  expected_result text,
  created_by text,
  updated_by text,
  created_by_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists route_coverage_tenant_idx on public.route_coverage(tenant_id);

-- TenantAccess (5 fields)
create table if not exists public.tenant_access (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  seed_key text not null,
  user_id text not null,
  role text not null,
  scope_status text,
  created_by text,
  updated_by text,
  created_by_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tenant_access_tenant_idx on public.tenant_access(tenant_id);

-- TenantInquiry (7 fields)
create table if not exists public.tenant_inquiries (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  organization text not null,
  contact_name text not null,
  email text not null,
  museum_type text,
  message text,
  status text not null default 'new',
  submitted_at text,
  created_by text,
  updated_by text,
  created_by_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('new','contacted','qualified','closed'))
);
create index if not exists tenant_inquiries_tenant_idx on public.tenant_inquiries(tenant_id);

-- TesterFeedback (17 fields)
create table if not exists public.tester_feedback (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  timestamp text not null,
  agent_name text not null,
  test_category text not null,
  page text,
  page_key text,
  route text,
  expected_result text,
  actual_result text,
  status text not null default 'NOT_RUN',
  severity text default 'info',
  summary text not null,
  details text,
  recommended_fix text,
  screenshot_url text,
  resolved boolean default false,
  resolved_at text,
  created_by text,
  updated_by text,
  created_by_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (agent_name in ('Operational Tester','Visitor Tester','Accessibility Tester','Tenant Isolation Tester')),
  check (status in ('PASS','FAIL','WARNING','NOT_RUN','MANUAL_QA_REQUIRED')),
  check (severity in ('critical','high','medium','low','info'))
);
create index if not exists tester_feedback_tenant_idx on public.tester_feedback(tenant_id);

-- TicketOrder (13 fields)
create table if not exists public.ticket_orders (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  seed_key text not null,
  ticket_type_id text not null,
  visitor_user_id text,
  visitor_name text,
  visitor_email text not null,
  quantity numeric,
  total_price numeric,
  currency text,
  status text,
  visit_date text,
  payment_status text,
  created_by text,
  updated_by text,
  created_by_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ticket_orders_tenant_idx on public.ticket_orders(tenant_id);

-- TicketType (14 fields)
create table if not exists public.ticket_types (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  seed_key text not null,
  ticket_name text not null,
  ticket_type text,
  description text,
  price numeric,
  currency text,
  available_quantity numeric,
  max_per_order numeric,
  status text,
  booking_required boolean,
  includes_guided_tour boolean,
  includes_virtual_access boolean,
  terms text,
  created_by text,
  updated_by text,
  created_by_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ticket_types_tenant_idx on public.ticket_types(tenant_id);

-- UserProfile (12 fields)
create table if not exists public.user_profiles (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  seed_key text not null,
  email text not null,
  full_name text,
  display_name text,
  role text not null,
  status text,
  access_scope text,
  avatar_url text,
  job_title text,
  notes text,
  last_login_at text,
  created_by text,
  updated_by text,
  created_by_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists user_profiles_tenant_idx on public.user_profiles(tenant_id);

-- VisitPlan (10 fields)
create table if not exists public.visit_plans (
  id text primary key default gen_random_uuid()::text,
  tenant_id text,
  tenant_name text,
  stage text not null default 'planning',
  visit_date text,
  quantity numeric default 1,
  group_type text default 'individual',
  accessibility_needs text,
  requirements text,
  addons text[],
  commerce_interest boolean default false,
  created_by text,
  updated_by text,
  created_by_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (stage in ('planning','addons')),
  check (group_type in ('individual','family','school','corporate'))
);
create index if not exists visit_plans_tenant_idx on public.visit_plans(tenant_id);
