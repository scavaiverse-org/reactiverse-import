-- Records which auth provider (google / email) a user signed up with, so the
-- master admin Users & Access view can show a signup-method badge without
-- needing access to auth.users.

alter table public.profiles add column if not exists provider text not null default 'email';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, franchise_intent, provider)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'user'),
    coalesce((new.raw_user_meta_data->>'franchise_intent')::boolean, false),
    coalesce(new.raw_app_meta_data->>'provider', 'email')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Backfill existing users from auth.users app metadata.
update public.profiles p
set provider = coalesce(u.raw_app_meta_data->>'provider', 'email')
from auth.users u
where u.id = p.id;
