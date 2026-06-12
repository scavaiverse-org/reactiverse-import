-- Adds a franchise/tenant interest flag to profiles, captured at signup time
-- via auth.users.raw_user_meta_data, so the master admin Users & Access view
-- can surface visitors who indicated they want to open a SCAVers space.

alter table public.profiles add column if not exists franchise_intent boolean not null default false;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, franchise_intent)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'user'),
    coalesce((new.raw_user_meta_data->>'franchise_intent')::boolean, false)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
