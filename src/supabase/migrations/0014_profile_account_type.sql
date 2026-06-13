-- Account-type choice (Faheem's onboarding model): every authenticated
-- public user must pick whether they're a consumer or a prospective
-- franchisee. NULL means "not chosen yet" and triggers the fullscreen
-- chooser overlay until they answer. Users can re-choose later.

alter table public.profiles add column if not exists account_type text
  check (account_type in ('consumer', 'franchisee'));
