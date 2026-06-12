-- Fix: QA Sentinel in-app scans could not record runs/events.
--
-- qa_sentinel_runs/qa_sentinel_events only had owner-scoped insert policies
-- (with check auth.uid() = created_by_id), but the sentinel client
-- (runtime-capture.js / issue-lifecycle.js via base44Client.create) never
-- sets created_by_id — so every "Run Scan" died on its first insert with an
-- RLS violation, and issue Fix/Ignore actions failed when logging their
-- lifecycle event. Mirrors the is_admin() policy qa_sentinel_issues already
-- has. Applied to live DB 2026-06-13.

drop policy if exists qa_sentinel_runs_admin_all on public.qa_sentinel_runs;
create policy qa_sentinel_runs_admin_all on public.qa_sentinel_runs
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists qa_sentinel_events_admin_all on public.qa_sentinel_events;
create policy qa_sentinel_events_admin_all on public.qa_sentinel_events
  for all using (public.is_admin()) with check (public.is_admin());
