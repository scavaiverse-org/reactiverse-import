-- Tracks the franchisee "Early Bird" checkout (7-day trial, then SGD 300 /
-- 6 months) against the inquiry that started it, whether paid via Stripe
-- subscription or the PayNow QR fallback.

alter table public.tenant_inquiries add column if not exists plan text;
alter table public.tenant_inquiries add column if not exists checkout_status text;
alter table public.tenant_inquiries add column if not exists checkout_session_id text;

alter table public.tenant_inquiries drop constraint if exists tenant_inquiries_checkout_status_check;
alter table public.tenant_inquiries add constraint tenant_inquiries_checkout_status_check
  check (checkout_status is null or checkout_status in ('checkout_started', 'paynow_pending', 'paid', 'cancelled'));
