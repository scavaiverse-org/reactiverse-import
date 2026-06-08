-- RLS scaffolding for tables added in 0005
-- Matches the pattern from 0003_rls_policies.sql: enable RLS, allow
-- authenticated reads + service_role all + owner writes. Tighten per
-- entity in a follow-up once requirements are clear.

alter table public.ai_guide_configs enable row level security;

create policy "ai_guide_configs_read_authenticated" on public.ai_guide_configs
  for select using (auth.role() = 'authenticated');

create policy "ai_guide_configs_service_role_all" on public.ai_guide_configs
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "ai_guide_configs_owner_write" on public.ai_guide_configs
  for insert with check (auth.uid() = created_by_id);

create policy "ai_guide_configs_owner_update" on public.ai_guide_configs
  for update using (auth.uid() = created_by_id) with check (auth.uid() = created_by_id);

alter table public.ai_guide_qa enable row level security;

create policy "ai_guide_qa_read_authenticated" on public.ai_guide_qa
  for select using (auth.role() = 'authenticated');

create policy "ai_guide_qa_service_role_all" on public.ai_guide_qa
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "ai_guide_qa_owner_write" on public.ai_guide_qa
  for insert with check (auth.uid() = created_by_id);

create policy "ai_guide_qa_owner_update" on public.ai_guide_qa
  for update using (auth.uid() = created_by_id) with check (auth.uid() = created_by_id);

alter table public.ai_outputs enable row level security;

create policy "ai_outputs_read_authenticated" on public.ai_outputs
  for select using (auth.role() = 'authenticated');

create policy "ai_outputs_service_role_all" on public.ai_outputs
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "ai_outputs_owner_write" on public.ai_outputs
  for insert with check (auth.uid() = created_by_id);

create policy "ai_outputs_owner_update" on public.ai_outputs
  for update using (auth.uid() = created_by_id) with check (auth.uid() = created_by_id);

alter table public.ai_workflows enable row level security;

create policy "ai_workflows_read_authenticated" on public.ai_workflows
  for select using (auth.role() = 'authenticated');

create policy "ai_workflows_service_role_all" on public.ai_workflows
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "ai_workflows_owner_write" on public.ai_workflows
  for insert with check (auth.uid() = created_by_id);

create policy "ai_workflows_owner_update" on public.ai_workflows
  for update using (auth.uid() = created_by_id) with check (auth.uid() = created_by_id);

alter table public.approval_requests enable row level security;

create policy "approval_requests_read_authenticated" on public.approval_requests
  for select using (auth.role() = 'authenticated');

create policy "approval_requests_service_role_all" on public.approval_requests
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "approval_requests_owner_write" on public.approval_requests
  for insert with check (auth.uid() = created_by_id);

create policy "approval_requests_owner_update" on public.approval_requests
  for update using (auth.uid() = created_by_id) with check (auth.uid() = created_by_id);

alter table public.audit_log enable row level security;

create policy "audit_log_read_authenticated" on public.audit_log
  for select using (auth.role() = 'authenticated');

create policy "audit_log_service_role_all" on public.audit_log
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "audit_log_owner_write" on public.audit_log
  for insert with check (auth.uid() = created_by_id);

create policy "audit_log_owner_update" on public.audit_log
  for update using (auth.uid() = created_by_id) with check (auth.uid() = created_by_id);

alter table public.commerce_products enable row level security;

create policy "commerce_products_read_authenticated" on public.commerce_products
  for select using (auth.role() = 'authenticated');

create policy "commerce_products_service_role_all" on public.commerce_products
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "commerce_products_owner_write" on public.commerce_products
  for insert with check (auth.uid() = created_by_id);

create policy "commerce_products_owner_update" on public.commerce_products
  for update using (auth.uid() = created_by_id) with check (auth.uid() = created_by_id);

alter table public.content_revisions enable row level security;

create policy "content_revisions_read_authenticated" on public.content_revisions
  for select using (auth.role() = 'authenticated');

create policy "content_revisions_service_role_all" on public.content_revisions
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "content_revisions_owner_write" on public.content_revisions
  for insert with check (auth.uid() = created_by_id);

create policy "content_revisions_owner_update" on public.content_revisions
  for update using (auth.uid() = created_by_id) with check (auth.uid() = created_by_id);

alter table public.experience_editor_default_settings enable row level security;

create policy "experience_editor_default_settings_read_authenticated" on public.experience_editor_default_settings
  for select using (auth.role() = 'authenticated');

create policy "experience_editor_default_settings_service_role_all" on public.experience_editor_default_settings
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "experience_editor_default_settings_owner_write" on public.experience_editor_default_settings
  for insert with check (auth.uid() = created_by_id);

create policy "experience_editor_default_settings_owner_update" on public.experience_editor_default_settings
  for update using (auth.uid() = created_by_id) with check (auth.uid() = created_by_id);

alter table public.experience_editor_modules enable row level security;

create policy "experience_editor_modules_read_authenticated" on public.experience_editor_modules
  for select using (auth.role() = 'authenticated');

create policy "experience_editor_modules_service_role_all" on public.experience_editor_modules
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "experience_editor_modules_owner_write" on public.experience_editor_modules
  for insert with check (auth.uid() = created_by_id);

create policy "experience_editor_modules_owner_update" on public.experience_editor_modules
  for update using (auth.uid() = created_by_id) with check (auth.uid() = created_by_id);

alter table public.experience_editor_qa_rules enable row level security;

create policy "experience_editor_qa_rules_read_authenticated" on public.experience_editor_qa_rules
  for select using (auth.role() = 'authenticated');

create policy "experience_editor_qa_rules_service_role_all" on public.experience_editor_qa_rules
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "experience_editor_qa_rules_owner_write" on public.experience_editor_qa_rules
  for insert with check (auth.uid() = created_by_id);

create policy "experience_editor_qa_rules_owner_update" on public.experience_editor_qa_rules
  for update using (auth.uid() = created_by_id) with check (auth.uid() = created_by_id);

alter table public.experience_editor_templates enable row level security;

create policy "experience_editor_templates_read_authenticated" on public.experience_editor_templates
  for select using (auth.role() = 'authenticated');

create policy "experience_editor_templates_service_role_all" on public.experience_editor_templates
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "experience_editor_templates_owner_write" on public.experience_editor_templates
  for insert with check (auth.uid() = created_by_id);

create policy "experience_editor_templates_owner_update" on public.experience_editor_templates
  for update using (auth.uid() = created_by_id) with check (auth.uid() = created_by_id);

alter table public.experience_editor_tools enable row level security;

create policy "experience_editor_tools_read_authenticated" on public.experience_editor_tools
  for select using (auth.role() = 'authenticated');

create policy "experience_editor_tools_service_role_all" on public.experience_editor_tools
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "experience_editor_tools_owner_write" on public.experience_editor_tools
  for insert with check (auth.uid() = created_by_id);

create policy "experience_editor_tools_owner_update" on public.experience_editor_tools
  for update using (auth.uid() = created_by_id) with check (auth.uid() = created_by_id);

alter table public.home_configs enable row level security;

create policy "home_configs_read_authenticated" on public.home_configs
  for select using (auth.role() = 'authenticated');

create policy "home_configs_service_role_all" on public.home_configs
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "home_configs_owner_write" on public.home_configs
  for insert with check (auth.uid() = created_by_id);

create policy "home_configs_owner_update" on public.home_configs
  for update using (auth.uid() = created_by_id) with check (auth.uid() = created_by_id);

alter table public.home_page_configs enable row level security;

create policy "home_page_configs_read_authenticated" on public.home_page_configs
  for select using (auth.role() = 'authenticated');

create policy "home_page_configs_service_role_all" on public.home_page_configs
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "home_page_configs_owner_write" on public.home_page_configs
  for insert with check (auth.uid() = created_by_id);

create policy "home_page_configs_owner_update" on public.home_page_configs
  for update using (auth.uid() = created_by_id) with check (auth.uid() = created_by_id);

alter table public.master_museum_categories enable row level security;

create policy "master_museum_categories_read_authenticated" on public.master_museum_categories
  for select using (auth.role() = 'authenticated');

create policy "master_museum_categories_service_role_all" on public.master_museum_categories
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "master_museum_categories_owner_write" on public.master_museum_categories
  for insert with check (auth.uid() = created_by_id);

create policy "master_museum_categories_owner_update" on public.master_museum_categories
  for update using (auth.uid() = created_by_id) with check (auth.uid() = created_by_id);

alter table public.migration_trackers enable row level security;

create policy "migration_trackers_read_authenticated" on public.migration_trackers
  for select using (auth.role() = 'authenticated');

create policy "migration_trackers_service_role_all" on public.migration_trackers
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "migration_trackers_owner_write" on public.migration_trackers
  for insert with check (auth.uid() = created_by_id);

create policy "migration_trackers_owner_update" on public.migration_trackers
  for update using (auth.uid() = created_by_id) with check (auth.uid() = created_by_id);

alter table public.museum_architecture_presets enable row level security;

create policy "museum_architecture_presets_read_authenticated" on public.museum_architecture_presets
  for select using (auth.role() = 'authenticated');

create policy "museum_architecture_presets_service_role_all" on public.museum_architecture_presets
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "museum_architecture_presets_owner_write" on public.museum_architecture_presets
  for insert with check (auth.uid() = created_by_id);

create policy "museum_architecture_presets_owner_update" on public.museum_architecture_presets
  for update using (auth.uid() = created_by_id) with check (auth.uid() = created_by_id);

alter table public.museum_co_curator_prompt_presets enable row level security;

create policy "museum_co_curator_prompt_presets_read_authenticated" on public.museum_co_curator_prompt_presets
  for select using (auth.role() = 'authenticated');

create policy "museum_co_curator_prompt_presets_service_role_all" on public.museum_co_curator_prompt_presets
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "museum_co_curator_prompt_presets_owner_write" on public.museum_co_curator_prompt_presets
  for insert with check (auth.uid() = created_by_id);

create policy "museum_co_curator_prompt_presets_owner_update" on public.museum_co_curator_prompt_presets
  for update using (auth.uid() = created_by_id) with check (auth.uid() = created_by_id);

alter table public.museum_media_registry enable row level security;

create policy "museum_media_registry_read_authenticated" on public.museum_media_registry
  for select using (auth.role() = 'authenticated');

create policy "museum_media_registry_service_role_all" on public.museum_media_registry
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "museum_media_registry_owner_write" on public.museum_media_registry
  for insert with check (auth.uid() = created_by_id);

create policy "museum_media_registry_owner_update" on public.museum_media_registry
  for update using (auth.uid() = created_by_id) with check (auth.uid() = created_by_id);

alter table public.museum_mode_artifacts enable row level security;

create policy "museum_mode_artifacts_read_authenticated" on public.museum_mode_artifacts
  for select using (auth.role() = 'authenticated');

create policy "museum_mode_artifacts_service_role_all" on public.museum_mode_artifacts
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "museum_mode_artifacts_owner_write" on public.museum_mode_artifacts
  for insert with check (auth.uid() = created_by_id);

create policy "museum_mode_artifacts_owner_update" on public.museum_mode_artifacts
  for update using (auth.uid() = created_by_id) with check (auth.uid() = created_by_id);

alter table public.museum_mode_object_types enable row level security;

create policy "museum_mode_object_types_read_authenticated" on public.museum_mode_object_types
  for select using (auth.role() = 'authenticated');

create policy "museum_mode_object_types_service_role_all" on public.museum_mode_object_types
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "museum_mode_object_types_owner_write" on public.museum_mode_object_types
  for insert with check (auth.uid() = created_by_id);

create policy "museum_mode_object_types_owner_update" on public.museum_mode_object_types
  for update using (auth.uid() = created_by_id) with check (auth.uid() = created_by_id);

alter table public.onboarding_progress enable row level security;

create policy "onboarding_progress_read_authenticated" on public.onboarding_progress
  for select using (auth.role() = 'authenticated');

create policy "onboarding_progress_service_role_all" on public.onboarding_progress
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "onboarding_progress_owner_write" on public.onboarding_progress
  for insert with check (auth.uid() = created_by_id);

create policy "onboarding_progress_owner_update" on public.onboarding_progress
  for update using (auth.uid() = created_by_id) with check (auth.uid() = created_by_id);

alter table public.onboarding_steps enable row level security;

create policy "onboarding_steps_read_authenticated" on public.onboarding_steps
  for select using (auth.role() = 'authenticated');

create policy "onboarding_steps_service_role_all" on public.onboarding_steps
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "onboarding_steps_owner_write" on public.onboarding_steps
  for insert with check (auth.uid() = created_by_id);

create policy "onboarding_steps_owner_update" on public.onboarding_steps
  for update using (auth.uid() = created_by_id) with check (auth.uid() = created_by_id);

alter table public.permission_grants enable row level security;

create policy "permission_grants_read_authenticated" on public.permission_grants
  for select using (auth.role() = 'authenticated');

create policy "permission_grants_service_role_all" on public.permission_grants
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "permission_grants_owner_write" on public.permission_grants
  for insert with check (auth.uid() = created_by_id);

create policy "permission_grants_owner_update" on public.permission_grants
  for update using (auth.uid() = created_by_id) with check (auth.uid() = created_by_id);

alter table public.platform_architecture_presets enable row level security;

create policy "platform_architecture_presets_read_authenticated" on public.platform_architecture_presets
  for select using (auth.role() = 'authenticated');

create policy "platform_architecture_presets_service_role_all" on public.platform_architecture_presets
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "platform_architecture_presets_owner_write" on public.platform_architecture_presets
  for insert with check (auth.uid() = created_by_id);

create policy "platform_architecture_presets_owner_update" on public.platform_architecture_presets
  for update using (auth.uid() = created_by_id) with check (auth.uid() = created_by_id);

alter table public.platform_health enable row level security;

create policy "platform_health_read_authenticated" on public.platform_health
  for select using (auth.role() = 'authenticated');

create policy "platform_health_service_role_all" on public.platform_health
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "platform_health_owner_write" on public.platform_health
  for insert with check (auth.uid() = created_by_id);

create policy "platform_health_owner_update" on public.platform_health
  for update using (auth.uid() = created_by_id) with check (auth.uid() = created_by_id);

alter table public.platform_page_configs enable row level security;

create policy "platform_page_configs_read_authenticated" on public.platform_page_configs
  for select using (auth.role() = 'authenticated');

create policy "platform_page_configs_service_role_all" on public.platform_page_configs
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "platform_page_configs_owner_write" on public.platform_page_configs
  for insert with check (auth.uid() = created_by_id);

create policy "platform_page_configs_owner_update" on public.platform_page_configs
  for update using (auth.uid() = created_by_id) with check (auth.uid() = created_by_id);

alter table public.prompt_executions enable row level security;

create policy "prompt_executions_read_authenticated" on public.prompt_executions
  for select using (auth.role() = 'authenticated');

create policy "prompt_executions_service_role_all" on public.prompt_executions
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "prompt_executions_owner_write" on public.prompt_executions
  for insert with check (auth.uid() = created_by_id);

create policy "prompt_executions_owner_update" on public.prompt_executions
  for update using (auth.uid() = created_by_id) with check (auth.uid() = created_by_id);

alter table public.public_content enable row level security;

create policy "public_content_read_authenticated" on public.public_content
  for select using (auth.role() = 'authenticated');

create policy "public_content_service_role_all" on public.public_content
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "public_content_owner_write" on public.public_content
  for insert with check (auth.uid() = created_by_id);

create policy "public_content_owner_update" on public.public_content
  for update using (auth.uid() = created_by_id) with check (auth.uid() = created_by_id);

alter table public.publish_logs enable row level security;

create policy "publish_logs_read_authenticated" on public.publish_logs
  for select using (auth.role() = 'authenticated');

create policy "publish_logs_service_role_all" on public.publish_logs
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "publish_logs_owner_write" on public.publish_logs
  for insert with check (auth.uid() = created_by_id);

create policy "publish_logs_owner_update" on public.publish_logs
  for update using (auth.uid() = created_by_id) with check (auth.uid() = created_by_id);

alter table public.qa_sentinel_checks enable row level security;

create policy "qa_sentinel_checks_read_authenticated" on public.qa_sentinel_checks
  for select using (auth.role() = 'authenticated');

create policy "qa_sentinel_checks_service_role_all" on public.qa_sentinel_checks
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "qa_sentinel_checks_owner_write" on public.qa_sentinel_checks
  for insert with check (auth.uid() = created_by_id);

create policy "qa_sentinel_checks_owner_update" on public.qa_sentinel_checks
  for update using (auth.uid() = created_by_id) with check (auth.uid() = created_by_id);

alter table public.qa_sentinel_events enable row level security;

create policy "qa_sentinel_events_read_authenticated" on public.qa_sentinel_events
  for select using (auth.role() = 'authenticated');

create policy "qa_sentinel_events_service_role_all" on public.qa_sentinel_events
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "qa_sentinel_events_owner_write" on public.qa_sentinel_events
  for insert with check (auth.uid() = created_by_id);

create policy "qa_sentinel_events_owner_update" on public.qa_sentinel_events
  for update using (auth.uid() = created_by_id) with check (auth.uid() = created_by_id);

alter table public.qa_sentinel_runs enable row level security;

create policy "qa_sentinel_runs_read_authenticated" on public.qa_sentinel_runs
  for select using (auth.role() = 'authenticated');

create policy "qa_sentinel_runs_service_role_all" on public.qa_sentinel_runs
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "qa_sentinel_runs_owner_write" on public.qa_sentinel_runs
  for insert with check (auth.uid() = created_by_id);

create policy "qa_sentinel_runs_owner_update" on public.qa_sentinel_runs
  for update using (auth.uid() = created_by_id) with check (auth.uid() = created_by_id);

alter table public.role_permissions enable row level security;

create policy "role_permissions_read_authenticated" on public.role_permissions
  for select using (auth.role() = 'authenticated');

create policy "role_permissions_service_role_all" on public.role_permissions
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "role_permissions_owner_write" on public.role_permissions
  for insert with check (auth.uid() = created_by_id);

create policy "role_permissions_owner_update" on public.role_permissions
  for update using (auth.uid() = created_by_id) with check (auth.uid() = created_by_id);

alter table public.room_semantic_engine_presets enable row level security;

create policy "room_semantic_engine_presets_read_authenticated" on public.room_semantic_engine_presets
  for select using (auth.role() = 'authenticated');

create policy "room_semantic_engine_presets_service_role_all" on public.room_semantic_engine_presets
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "room_semantic_engine_presets_owner_write" on public.room_semantic_engine_presets
  for insert with check (auth.uid() = created_by_id);

create policy "room_semantic_engine_presets_owner_update" on public.room_semantic_engine_presets
  for update using (auth.uid() = created_by_id) with check (auth.uid() = created_by_id);

alter table public.room_semantic_layouts enable row level security;

create policy "room_semantic_layouts_read_authenticated" on public.room_semantic_layouts
  for select using (auth.role() = 'authenticated');

create policy "room_semantic_layouts_service_role_all" on public.room_semantic_layouts
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "room_semantic_layouts_owner_write" on public.room_semantic_layouts
  for insert with check (auth.uid() = created_by_id);

create policy "room_semantic_layouts_owner_update" on public.room_semantic_layouts
  for update using (auth.uid() = created_by_id) with check (auth.uid() = created_by_id);

alter table public.route_coverage enable row level security;

create policy "route_coverage_read_authenticated" on public.route_coverage
  for select using (auth.role() = 'authenticated');

create policy "route_coverage_service_role_all" on public.route_coverage
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "route_coverage_owner_write" on public.route_coverage
  for insert with check (auth.uid() = created_by_id);

create policy "route_coverage_owner_update" on public.route_coverage
  for update using (auth.uid() = created_by_id) with check (auth.uid() = created_by_id);

alter table public.tenant_access enable row level security;

create policy "tenant_access_read_authenticated" on public.tenant_access
  for select using (auth.role() = 'authenticated');

create policy "tenant_access_service_role_all" on public.tenant_access
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "tenant_access_owner_write" on public.tenant_access
  for insert with check (auth.uid() = created_by_id);

create policy "tenant_access_owner_update" on public.tenant_access
  for update using (auth.uid() = created_by_id) with check (auth.uid() = created_by_id);

alter table public.tenant_inquiries enable row level security;

create policy "tenant_inquiries_read_authenticated" on public.tenant_inquiries
  for select using (auth.role() = 'authenticated');

create policy "tenant_inquiries_service_role_all" on public.tenant_inquiries
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "tenant_inquiries_owner_write" on public.tenant_inquiries
  for insert with check (auth.uid() = created_by_id);

create policy "tenant_inquiries_owner_update" on public.tenant_inquiries
  for update using (auth.uid() = created_by_id) with check (auth.uid() = created_by_id);

alter table public.tester_feedback enable row level security;

create policy "tester_feedback_read_authenticated" on public.tester_feedback
  for select using (auth.role() = 'authenticated');

create policy "tester_feedback_service_role_all" on public.tester_feedback
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "tester_feedback_owner_write" on public.tester_feedback
  for insert with check (auth.uid() = created_by_id);

create policy "tester_feedback_owner_update" on public.tester_feedback
  for update using (auth.uid() = created_by_id) with check (auth.uid() = created_by_id);

alter table public.ticket_orders enable row level security;

create policy "ticket_orders_read_authenticated" on public.ticket_orders
  for select using (auth.role() = 'authenticated');

create policy "ticket_orders_service_role_all" on public.ticket_orders
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "ticket_orders_owner_write" on public.ticket_orders
  for insert with check (auth.uid() = created_by_id);

create policy "ticket_orders_owner_update" on public.ticket_orders
  for update using (auth.uid() = created_by_id) with check (auth.uid() = created_by_id);

alter table public.ticket_types enable row level security;

create policy "ticket_types_read_authenticated" on public.ticket_types
  for select using (auth.role() = 'authenticated');

create policy "ticket_types_service_role_all" on public.ticket_types
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "ticket_types_owner_write" on public.ticket_types
  for insert with check (auth.uid() = created_by_id);

create policy "ticket_types_owner_update" on public.ticket_types
  for update using (auth.uid() = created_by_id) with check (auth.uid() = created_by_id);

alter table public.user_profiles enable row level security;

create policy "user_profiles_read_authenticated" on public.user_profiles
  for select using (auth.role() = 'authenticated');

create policy "user_profiles_service_role_all" on public.user_profiles
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "user_profiles_owner_write" on public.user_profiles
  for insert with check (auth.uid() = created_by_id);

create policy "user_profiles_owner_update" on public.user_profiles
  for update using (auth.uid() = created_by_id) with check (auth.uid() = created_by_id);

alter table public.visit_plans enable row level security;

create policy "visit_plans_read_authenticated" on public.visit_plans
  for select using (auth.role() = 'authenticated');

create policy "visit_plans_service_role_all" on public.visit_plans
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "visit_plans_owner_write" on public.visit_plans
  for insert with check (auth.uid() = created_by_id);

create policy "visit_plans_owner_update" on public.visit_plans
  for update using (auth.uid() = created_by_id) with check (auth.uid() = created_by_id);
