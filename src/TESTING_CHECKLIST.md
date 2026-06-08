# Migration Testing Checklist

## Authentication

- [ ] Sign up creates an auth user and profile row.
- [ ] Sign in works with email/password or magic link.
- [ ] Session persists after refresh.
- [ ] Sign out clears session.
- [ ] Unauthenticated users are redirected from protected routes.
- [ ] Non-admin users cannot access platform admin routes.
- [ ] Tenant admins can access only their tenant records.

## Public routes

- [ ] `/` loads platform home.
- [ ] `/platform/overview` loads correctly.
- [ ] `/museum/:tenantSlug/home` loads published tenant content.
- [ ] `/museum/:tenantSlug/tickets` renders ticket flow.
- [ ] `/museum/:tenantSlug/about` renders about page.
- [ ] `/museum/:tenantSlug/begin-tour` starts walkthrough.
- [ ] Legacy redirects still route to canonical paths.

## CRUD operations

- [ ] Tenant can create/update museum page config.
- [ ] Tenant can update walkthrough/experience config.
- [ ] Tenant can create/update exhibits.
- [ ] Tenant can create/update music assets.
- [ ] Tenant cannot read or write another tenant's records.
- [ ] Admin can manage all tenant records.

## Visitor submissions

- [ ] Public visitor can submit ticket request.
- [ ] Public visitor cannot list all tickets.
- [ ] Public visitor can submit vendor application.
- [ ] Public visitor cannot list vendor applications.

## Storage

- [ ] Admin can upload to `public-media`.
- [ ] Public can read `public-media`.
- [ ] Tenant user can upload to `tenant-media/{tenant_id}`.
- [ ] Tenant user cannot read another tenant's storage path.
- [ ] QA evidence is admin-only.

## Backend functions

- [ ] Portal access verification works.
- [ ] Media repair function runs only for authorized users/admins.
- [ ] AI calls happen server-side only.
- [ ] Slack/webhook handlers validate signatures.
- [ ] Scheduled jobs do not expose public endpoints without authentication/secrets.

## QA Sentinel

- [ ] Issues list loads for admin.
- [ ] Non-admin cannot read QA issues.
- [ ] Mark fixed/ignore/retest actions update correctly.
- [ ] Exports generate and are admin-only.

## Responsive/UI

- [ ] Desktop public pages match original layout.
- [ ] Mobile public pages are usable.
- [ ] Admin navigation works on desktop.
- [ ] Forms remain accessible by keyboard.
- [ ] Reduced-motion preference is respected.

## Security checks

- [ ] No service role key in browser bundle.
- [ ] No API secrets in frontend code.
- [ ] RLS enabled on all app tables.
- [ ] Storage policies tested with anon and authenticated users.
- [ ] Webhook endpoints reject unsigned requests.
- [ ] Error messages do not leak secrets.