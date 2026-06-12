-- Fixes the broken Become-a-Tenant funnel and locks down applicant data.
--
-- Problems with the 0006 policies:
--   1. INSERT required auth.uid() = created_by_id, but the public form never
--      sets created_by_id (and anonymous visitors have no uid) -> every
--      application was silently rejected since RLS was enabled.
--   2. UPDATE was owner-only, so master admins couldn't change status.
--   3. SELECT was open to ANY authenticated user, leaking applicant emails.

-- 1. Anyone (anon or signed-in) may submit an application.
drop policy if exists "tenant_inquiries_owner_write" on public.tenant_inquiries;
create policy "tenant_inquiries_public_insert" on public.tenant_inquiries
  for insert with check (true);

-- 2. Admins manage applications (read, triage status, delete).
drop policy if exists "tenant_inquiries_read_authenticated" on public.tenant_inquiries;
create policy "tenant_inquiries_admin_read" on public.tenant_inquiries
  for select using (public.is_admin());

create policy "tenant_inquiries_admin_update" on public.tenant_inquiries
  for update using (public.is_admin()) with check (public.is_admin());

create policy "tenant_inquiries_admin_delete" on public.tenant_inquiries
  for delete using (public.is_admin());
