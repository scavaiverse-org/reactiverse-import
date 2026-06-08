-- Timestamp helpers
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'anonymous');
$$;

create or replace function public.current_user_tenant_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id from public.profiles where id = auth.uid();
$$;

create or replace function public.current_user_tenant_ids()
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select array_remove(array_append(coalesce(tenant_ids, '{}'::text[]), tenant_id), null) from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select lower(public.current_user_role()) in ('admin','master_admin','platform_admin') or public.current_user_role() in ('MASTER_ADMIN','PLATFORM_ADMIN');
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email), coalesce(new.raw_user_meta_data->>'role', 'user'))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles','museum_tenants','experience_configs','museum_page_configs','exhibits','tickets','vendors','tenant_media','music_assets',
    'analytics_events','qa_sentinel_issues','master_prompts','prompt_versions','content_assets','platform_media_registry','master_media_registry',
    'tenant_content','module_configs','experience_presets','tenant_preset_data','qa_sentinel_exports'
  ] loop
    execute format('drop trigger if exists set_updated_at on public.%I', table_name);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name);
  end loop;
end $$;