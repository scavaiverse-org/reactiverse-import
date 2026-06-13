-- Idempotency stamp for the "museum is now live" launch email.
--
-- notify-launch emails confirmed pre-bookers when a museum is published. It
-- only selects confirmed tickets WHERE launch_email_sent_at IS NULL and stamps
-- each row once the email is sent, so re-publishing a new manifest version
-- never re-emails buyers who were already notified.

alter table public.tickets
  add column if not exists launch_email_sent_at timestamptz;
