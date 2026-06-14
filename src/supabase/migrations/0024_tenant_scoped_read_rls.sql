-- Tighten RLS so tenant A cannot read tenant B's data.
--
-- 0006_missing_entities_rls.sql gave every table it created a
-- "<table>_read_authenticated" SELECT policy of `auth.role() = 'authenticated'`,
-- with no tenant_id check at all. Any signed-in user (from any tenant) could
-- read every other tenant's rows in all 44 tables below (commerce products,
-- ticket orders + visitor PII, audit logs, AI configs, user profiles, etc).
--
-- Replace those policies with tenant-scoped reads: same pattern already used
-- by 0003_rls_policies.sql (is_admin() or same tenant via
-- current_user_tenant_id()/current_user_tenant_ids()). Rows with tenant_id
-- IS NULL are platform-wide system/reference rows (seeded presets, platform
-- config) and remain readable by any authenticated user, matching prior
-- behavior for that data.
--
-- tenant_inquiries is intentionally excluded: 0015 already restricted it to
-- admin-only reads (applicant emails), which is stricter than tenant-scoped
-- and should not be loosened here.

do $$
declare
  t text;
  tables text[] := array[
    'ai_guide_configs', 'ai_guide_qa', 'ai_outputs', 'ai_workflows',
    'approval_requests', 'audit_log', 'commerce_products', 'content_revisions',
    'experience_editor_default_settings', 'experience_editor_modules',
    'experience_editor_qa_rules', 'experience_editor_templates', 'experience_editor_tools',
    'home_configs', 'home_page_configs', 'master_museum_categories', 'migration_trackers',
    'museum_architecture_presets', 'museum_co_curator_prompt_presets', 'museum_media_registry',
    'museum_mode_artifacts', 'museum_mode_object_types', 'onboarding_progress', 'onboarding_steps',
    'permission_grants', 'platform_architecture_presets', 'platform_health', 'platform_page_configs',
    'prompt_executions', 'public_content', 'publish_logs', 'qa_sentinel_checks',
    'qa_sentinel_events', 'qa_sentinel_runs', 'role_permissions', 'room_semantic_engine_presets',
    'room_semantic_layouts', 'route_coverage', 'tenant_access', 'tester_feedback',
    'ticket_orders', 'ticket_types', 'user_profiles', 'visit_plans'
  ];
begin
  foreach t in array tables loop
    execute format('drop policy if exists %I on public.%I', t || '_read_authenticated', t);
    execute format(
      'create policy %I on public.%I for select using (' ||
      'auth.role() = ''authenticated'' and (' ||
      'tenant_id is null' ||
      ' or tenant_id = public.current_user_tenant_id()' ||
      ' or tenant_id = any(public.current_user_tenant_ids())' ||
      ' or public.is_admin()' ||
      '))',
      t || '_tenant_read', t
    );
  end loop;
end $$;

-- Visitor-submitted records: also allow visitors to read their own rows,
-- mirroring the tickets/vendors pattern in 0003_rls_policies.sql.
create policy "ticket_orders_self_read" on public.ticket_orders
  for select using (created_by_id = auth.uid());

create policy "visit_plans_self_read" on public.visit_plans
  for select using (created_by_id = auth.uid());
