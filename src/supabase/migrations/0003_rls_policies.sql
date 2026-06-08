-- Secure defaults: RLS enabled on all app tables.
-- Assumption: tenant-scoped data is visible to users with the same tenant_id, platform admins can read/manage everything, published public content can be read anonymously where needed.

alter table public.profiles enable row level security;
alter table public.museum_tenants enable row level security;
alter table public.experience_configs enable row level security;
alter table public.museum_page_configs enable row level security;
alter table public.exhibits enable row level security;
alter table public.tickets enable row level security;
alter table public.vendors enable row level security;
alter table public.tenant_media enable row level security;
alter table public.music_assets enable row level security;
alter table public.analytics_events enable row level security;
alter table public.qa_sentinel_issues enable row level security;
alter table public.master_prompts enable row level security;
alter table public.prompt_versions enable row level security;
alter table public.content_assets enable row level security;
alter table public.platform_media_registry enable row level security;
alter table public.master_media_registry enable row level security;
alter table public.tenant_content enable row level security;
alter table public.module_configs enable row level security;
alter table public.experience_presets enable row level security;
alter table public.tenant_preset_data enable row level security;
alter table public.qa_sentinel_exports enable row level security;

-- Profiles
create policy profiles_self_read on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy profiles_self_update on public.profiles for update using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());
create policy profiles_admin_insert on public.profiles for insert with check (public.is_admin() or id = auth.uid());

-- Public tenant discovery
create policy tenants_public_live_read on public.museum_tenants for select using (status = 'live' or public.is_admin() or id = public.current_user_tenant_id());
create policy tenants_admin_manage on public.museum_tenants for all using (public.is_admin()) with check (public.is_admin());

-- Public published museum pages/exhibits/media used by visitor routes
create policy museum_pages_public_read on public.museum_page_configs for select using (visibility_state = 'public' and publish_state = 'published');
create policy museum_pages_tenant_manage on public.museum_page_configs for all using (public.is_admin() or (tenant_id = public.current_user_tenant_id() or tenant_id = any(public.current_user_tenant_ids()))) with check (public.is_admin() or (tenant_id = public.current_user_tenant_id() or tenant_id = any(public.current_user_tenant_ids())));

create policy exhibits_public_read on public.exhibits for select using (status = 'published' or public.is_admin() or (tenant_id = public.current_user_tenant_id() or tenant_id = any(public.current_user_tenant_ids())));
create policy exhibits_tenant_manage on public.exhibits for all using (public.is_admin() or (tenant_id = public.current_user_tenant_id() or tenant_id = any(public.current_user_tenant_ids()))) with check (public.is_admin() or (tenant_id = public.current_user_tenant_id() or tenant_id = any(public.current_user_tenant_ids())));

create policy tenant_media_public_read on public.tenant_media for select using ((visibility = 'public' and publish_state = 'published') or public.is_admin() or (tenant_id = public.current_user_tenant_id() or tenant_id = any(public.current_user_tenant_ids())));
create policy tenant_media_tenant_manage on public.tenant_media for all using (public.is_admin() or (tenant_id = public.current_user_tenant_id() or tenant_id = any(public.current_user_tenant_ids()))) with check (public.is_admin() or (tenant_id = public.current_user_tenant_id() or tenant_id = any(public.current_user_tenant_ids())));

create policy music_assets_public_read on public.music_assets for select using ((visibility = 'public' and status = 'active') or public.is_admin() or (tenant_id = public.current_user_tenant_id() or tenant_id = any(public.current_user_tenant_ids())));
create policy music_assets_tenant_manage on public.music_assets for all using (public.is_admin() or (tenant_id = public.current_user_tenant_id() or tenant_id = any(public.current_user_tenant_ids()))) with check (public.is_admin() or (tenant_id = public.current_user_tenant_id() or tenant_id = any(public.current_user_tenant_ids())));

-- Tenant-scoped admin/editor tables
create policy experience_configs_tenant_access on public.experience_configs for all using (public.is_admin() or (tenant_id = public.current_user_tenant_id() or tenant_id = any(public.current_user_tenant_ids()))) with check (public.is_admin() or (tenant_id = public.current_user_tenant_id() or tenant_id = any(public.current_user_tenant_ids())));
create policy module_configs_tenant_access on public.module_configs for all using (public.is_admin() or (tenant_id = public.current_user_tenant_id() or tenant_id = any(public.current_user_tenant_ids()))) with check (public.is_admin() or (tenant_id = public.current_user_tenant_id() or tenant_id = any(public.current_user_tenant_ids())));
create policy tenant_content_tenant_access on public.tenant_content for all using (public.is_admin() or (tenant_id = public.current_user_tenant_id() or tenant_id = any(public.current_user_tenant_ids()))) with check (public.is_admin() or (tenant_id = public.current_user_tenant_id() or tenant_id = any(public.current_user_tenant_ids())));
create policy content_assets_tenant_access on public.content_assets for all using (public.is_admin() or (tenant_id = public.current_user_tenant_id() or tenant_id = any(public.current_user_tenant_ids()))) with check (public.is_admin() or (tenant_id = public.current_user_tenant_id() or tenant_id = any(public.current_user_tenant_ids())));
create policy tenant_preset_data_tenant_access on public.tenant_preset_data for all using (public.is_admin() or (tenant_id = public.current_user_tenant_id() or tenant_id = any(public.current_user_tenant_ids()))) with check (public.is_admin() or (tenant_id = public.current_user_tenant_id() or tenant_id = any(public.current_user_tenant_ids())));
create policy experience_presets_tenant_access on public.experience_presets for all using (public.is_admin() or is_system_preset = true or (tenant_id = public.current_user_tenant_id() or tenant_id = any(public.current_user_tenant_ids()))) with check (public.is_admin() or (tenant_id = public.current_user_tenant_id() or tenant_id = any(public.current_user_tenant_ids())));

-- Visitor-submitted records: allow insert, restrict reads to owner/admin/tenant staff.
create policy tickets_public_insert on public.tickets for insert with check (true);
create policy tickets_private_read on public.tickets for select using (public.is_admin() or (tenant_id = public.current_user_tenant_id() or tenant_id = any(public.current_user_tenant_ids())) or created_by_id = auth.uid());
create policy tickets_staff_update on public.tickets for update using (public.is_admin() or (tenant_id = public.current_user_tenant_id() or tenant_id = any(public.current_user_tenant_ids()))) with check (public.is_admin() or (tenant_id = public.current_user_tenant_id() or tenant_id = any(public.current_user_tenant_ids())));

create policy vendors_public_insert on public.vendors for insert with check (true);
create policy vendors_private_read on public.vendors for select using (public.is_admin() or (tenant_id = public.current_user_tenant_id() or tenant_id = any(public.current_user_tenant_ids())) or created_by_id = auth.uid());
create policy vendors_staff_update on public.vendors for update using (public.is_admin() or (tenant_id = public.current_user_tenant_id() or tenant_id = any(public.current_user_tenant_ids()))) with check (public.is_admin() or (tenant_id = public.current_user_tenant_id() or tenant_id = any(public.current_user_tenant_ids())));

create policy analytics_insert on public.analytics_events for insert with check (true);
create policy analytics_admin_read on public.analytics_events for select using (public.is_admin() or (tenant_id = public.current_user_tenant_id() or tenant_id = any(public.current_user_tenant_ids())));

-- Platform/admin-only tables
create policy qa_issues_admin_all on public.qa_sentinel_issues for all using (public.is_admin()) with check (public.is_admin());
create policy qa_exports_admin_all on public.qa_sentinel_exports for all using (public.is_admin()) with check (public.is_admin());
create policy platform_media_public_read on public.platform_media_registry for select using (publish_state = 'published' and is_active = true);
create policy platform_media_admin_all on public.platform_media_registry for all using (public.is_admin()) with check (public.is_admin());
create policy master_media_public_read on public.master_media_registry for select using (status = 'active' and is_active = true);
create policy master_media_admin_all on public.master_media_registry for all using (public.is_admin()) with check (public.is_admin());
create policy master_prompts_admin_all on public.master_prompts for all using (public.is_admin() or (tenant_id = public.current_user_tenant_id() or tenant_id = any(public.current_user_tenant_ids()))) with check (public.is_admin() or (tenant_id = public.current_user_tenant_id() or tenant_id = any(public.current_user_tenant_ids())));
create policy prompt_versions_admin_all on public.prompt_versions for all using (public.is_admin() or (tenant_id = public.current_user_tenant_id() or tenant_id = any(public.current_user_tenant_ids()))) with check (public.is_admin() or (tenant_id = public.current_user_tenant_id() or tenant_id = any(public.current_user_tenant_ids())));