# Base44 to Supabase Migration Plan

## Executive summary

The existing app is a large React/Vite museum platform with public museum pages, tenant admin pages, platform admin dashboards, QA Sentinel tooling, media management, ticket/vendor flows, walkthrough builders, onboarding, analytics, and tenant-isolated content.

The safest migration strategy is staged rather than a direct one-shot rewrite:

1. Preserve the React/Vite frontend.
2. Introduce Supabase client/auth/storage wrappers.
3. Recreate Base44 entities as PostgreSQL tables.
4. Replace Base44 SDK entity calls screen by screen.
5. Move backend functions to Supabase Edge Functions.
6. Run data export/import and validation.
7. Deploy externally.

## 1. Frontend structure

Main router: `App.jsx`.

Major route groups:

- Public platform routes: `/`, `/platform/overview`, `/platform/docs`, `/virtual-experience`, `/become-a-tenant`.
- Public museum routes: `/museum/:tenantSlug/home`, `/tickets`, `/about`, `/begin-tour`, `/completion`, `/vendors`, `/commerce`, `/guide`.
- Tenant admin routes: `/museum/:tenantSlug/admin`, `/walkthrough`, `/tickets`, `/vendors`, `/exhibits`, `/analytics`, `/music`, `/home`.
- Platform admin routes: `/platform/admin`, `/users-access`, `/modules`, `/public-content`, `/pages`, `/tenants`, `/qa-sentinel`, `/music`, etc.
- Legacy redirects map older routes into canonical platform/museum routes.

Key UI systems:

- Layout: `components/layout/AppLayout`, `components/layout/MasterAdminLayout`, `components/tenant-admin/TenantAdminLayout`.
- Tenant public pages: `components/tenant/TenantPublicPage`, `TenantNavbar`, `TenantVideoHero`, `TenantCTA`, `TenantOverlay`.
- Walkthrough: `pages/Walkthrough`, `components/walkthrough/*`, `components/admin/walkthrough/*`.
- QA Sentinel: `pages/admin/QASentinel`, `components/admin/sentinel/*`, `lib/qa-sentinel/*`.
- Media/admin tooling: `components/admin/media/*`, `pages/admin/PublicContent`, `pages/admin/Music`, `pages/tenant-admin/TenantMusic`.

## 2. Base44 dependencies to replace

Search targets:

- `import { base44 } from '@/api/base44Client'`
- `base44.entities.*`
- `base44.auth.*`
- `base44.functions.invoke(...)`
- `base44.integrations.Core.UploadFile(...)`
- `base44.integrations.Core.InvokeLLM(...)`
- `base44.analytics.track(...)`
- `base44.users.inviteUser(...)`
- Realtime: `base44.entities.Entity.subscribe(...)`

Replacement approach:

| Base44 feature | Supabase replacement |
|---|---|
| `base44.auth.me()` | `supabase.auth.getUser()` + `profiles` table |
| `base44.auth.isAuthenticated()` | `supabase.auth.getSession()` |
| `base44.auth.redirectToLogin()` | App login route using Supabase Auth |
| `base44.auth.logout()` | `supabase.auth.signOut()` |
| `base44.entities.X.list()` | `supabase.from(table).select('*').order(...)` |
| `base44.entities.X.filter(query)` | `supabase.from(table).select('*').match(query)` |
| `base44.entities.X.create(data)` | `supabase.from(table).insert(data).select().single()` |
| `base44.entities.X.update(id,data)` | `supabase.from(table).update(data).eq('id', id)` |
| `base44.entities.X.delete(id)` | `supabase.from(table).delete().eq('id', id)` |
| `base44.entities.X.subscribe()` | Supabase Realtime channels |
| `UploadFile` | Supabase Storage upload |
| `InvokeLLM` | Supabase Edge Function calling chosen AI provider |
| backend functions | Supabase Edge Functions |
| analytics tracking | `analytics_events` insert or external analytics |

## 3. Data model migration

The first Supabase schema is in:

- `supabase/migrations/0001_initial_schema.sql`

It includes the most important entity tables:

- `profiles`
- `museum_tenants`
- `experience_configs`
- `museum_page_configs`
- `exhibits`
- `tickets`
- `vendors`
- `tenant_media`
- `music_assets`
- `analytics_events`
- `qa_sentinel_issues`
- `master_prompts`
- `prompt_versions`
- `content_assets`
- `platform_media_registry`
- `master_media_registry`
- `tenant_content`
- `module_configs`
- `experience_presets`
- `tenant_preset_data`
- `qa_sentinel_exports`

Assumptions are documented in `SUPABASE_SCHEMA.md`.

## 4. Authentication migration

Base44 currently handles login/session/user state through platform auth. Supabase replacement should include:

- Supabase email/password or magic-link login.
- `profiles` table linked to `auth.users`.
- Role field must normalize both Base44 roles (`admin`, `user`) and SCAVerse roles (`MASTER_ADMIN`, `PLATFORM_ADMIN`, `FRANCHISE_OWNER`, etc.).
- Tenant association must support both `profiles.tenant_id` and multi-tenant `profiles.tenant_ids`.
- Protected routes using a React auth provider.
- Admin route guards using `profiles.role`.

## 5. Permissions and RLS

RLS is enabled in `0003_rls_policies.sql`.

Secure defaults:

- Public visitors can read only published public museum/platform content.
- Visitor-submitted tickets/vendor applications can be inserted publicly but are not publicly readable.
- Tenant staff can access records for their tenant.
- Platform admins can manage all records.
- QA Sentinel and platform operations are admin-only.
- Private media buckets are tenant/admin scoped.

## 6. Storage migration

Buckets in `0004_storage_buckets.sql`:

- `public-media`: public published platform/media assets.
- `tenant-media`: private tenant-scoped uploads.
- `qa-evidence`: private admin-only evidence files.

Path convention:

```text
tenant-media/{tenant_id}/{record_id-or-file-name}
qa-evidence/{run_id}/{file-name}
```

## 7. Backend logic migration

Existing Base44 functions:

- `migrateWalkthroughV3`
- `postOperationalStatusUpdate`
- `repairWalkthroughMediaLinks`
- `runWeek3OperationalSaturation`
- `seedMuseumGradeContent`
- `verifyPortalAccess`

Supabase targets:

- Edge Functions for API-like behavior and secrets.
- PostgreSQL functions/triggers for timestamping, user profile creation, simple data validation.
- Scheduled jobs via Supabase scheduled Edge Functions or external cron provider.

Recommended Edge Functions:

- `verify-portal-access`
- `repair-walkthrough-media-links`
- `seed-museum-grade-content`
- `post-operational-status-update`
- `invoke-ai`
- `send-email`
- `slack-webhook-handler` if Slack behavior is retained.

## 8. Data export/import strategy

Preferred:

1. Export each Base44 entity as JSON/CSV from admin/data tools or API.
2. Normalize camelCase/snake_case fields.
3. Preserve `id`, `created_date`, `updated_date`, and `created_by_id` where possible.
4. Upload files to Supabase Storage and rewrite file URLs.
5. Import in dependency order.
6. Validate counts and sample records.

Import order:

1. users/profiles
2. museum_tenants
3. module_configs
4. museum_page_configs
5. tenant_media, music_assets, media registries
6. experience_configs, presets, walkthrough data
7. exhibits
8. tickets/vendors
9. analytics_events
10. QA Sentinel tables

## 9. Implementation phases

### Phase 1 — Migration foundation

- Add Supabase project.
- Run migrations.
- Configure `.env.local`.
- Create Supabase client and auth provider.

### Phase 2 — Compatibility wrapper

Create a wrapper that mimics the subset of Base44 used by the app, backed by Supabase. This allows replacing `@/api/base44Client` gradually.

### Phase 3 — Public pages

Migrate public read-only flows first:

- Platform home/overview.
- Museum home/tickets/about/begin-tour.
- Published media rendering.

### Phase 4 — Forms and submissions

- Tickets.
- Vendor registration.
- Tenant inquiries.
- Analytics event tracking.

### Phase 5 — Admin portals

- Tenant admin CRUD.
- Platform admin CRUD.
- Walkthrough builder.
- Media management.
- Music management.

### Phase 6 — Backend functions/integrations

- Edge Functions.
- Storage uploads.
- AI calls.
- Slack/webhooks if needed.

### Phase 7 — Production hardening

- RLS review.
- Data validation.
- Monitoring.
- Backups.
- Deployment.

## Risks and unresolved issues

- Some Base44 proprietary behavior cannot be inferred perfectly, especially built-in auth, entity security, connector internals, and integration credit behavior.
- Full production data export requires access to Base44 records/files outside this code context.
- User IDs may not map 1:1 to Supabase Auth users unless users are recreated carefully.
- File URLs need a rewrite plan if Base44 file storage URLs expire or are private.
- AI/Slack/email/payment integrations need provider-specific secrets and server-side implementation.