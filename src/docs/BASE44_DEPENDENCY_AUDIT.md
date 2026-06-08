# Base44 Dependency Audit

Status: REQUIRED BEFORE MIGRATION CUTOVER

## Classification Labels

Each Base44 dependency must be marked as one of:

- `keep_temporarily`
- `replace_with_supabase`
- `remove`
- `fake_unused`
- `dangerous`

## Dependency Groups

| Dependency | Current Purpose | Migration Target | Initial Classification |
|---|---|---|---|
| `base44.entities.*.list` | Read entity data for public/admin pages | Supabase select adapter | replace_with_supabase |
| `base44.entities.*.filter` | Tenant/status filtered reads | Supabase select + filters + RLS | replace_with_supabase |
| `base44.entities.*.create` | Create tickets, vendors, admin records, seeded records | Supabase insert + RLS | replace_with_supabase |
| `base44.entities.*.update` | Admin edits, issue lifecycle, content updates | Supabase update + ownership checks | replace_with_supabase |
| `base44.entities.*.delete` | Deletes/archives where used | Supabase delete/archive + confirmation | replace_with_supabase |
| `base44.entities.*.subscribe` | Realtime QA/admin updates | Supabase realtime channels | replace_with_supabase |
| `base44.auth.me` | Current user lookup | Supabase auth + profiles | replace_with_supabase |
| `base44.auth.isAuthenticated` | Frontend auth state check | Supabase session check | replace_with_supabase |
| `base44.auth.redirectToLogin` | Base44 login redirect | Supabase auth UI/redirect | keep_temporarily |
| `base44.auth.logout` | Logout | Supabase signOut | replace_with_supabase |
| `base44.auth.updateMe` | Current user profile mutation | Supabase profiles update | replace_with_supabase |
| `base44.functions.invoke` | Backend function calls | Supabase Edge Functions or API route adapter | keep_temporarily |
| `base44.integrations.Core.InvokeLLM` | AI output generation | Final AI provider via secure server only | keep_temporarily |
| `base44.integrations.Core.UploadFile` | File upload/storage | Supabase Storage buckets | replace_with_supabase |
| `base44.analytics.track` | Client analytics | Supabase/Firebase/analytics service | keep_temporarily |
| `base44.users.inviteUser` | Invite app users | Supabase invite/admin flow | replace_with_supabase |
| Base44 file URLs | Existing uploaded media | Supabase Storage URL migration map | keep_temporarily |

## Non-Destructive Migration Method

1. Do not remove Base44 imports blindly.
2. Create a compatibility adapter matching current method names.
3. Replace backend implementation one entity at a time.
4. Validate each entity after migration.
5. Keep old route behavior unchanged during adapter migration.
6. Run tenant isolation tests after every migrated write path.
7. Remove Base44 only after full staging proof.

## Dangerous Cases To Block

- Any service-role secret in frontend.
- Any admin write relying only on frontend visibility.
- Any public create/update/delete to tenant-owned tables without RLS.
- Any upload path not scoped by tenant or ownership.
- Any AI request containing admin/private tenant records without permission boundary.

## Required Evidence Per Dependency

For every reference, record:

- file path
- line/function context
- entity/function/integration touched
- access level
- migration classification
- replacement target
- test route
- tenant isolation impact
- rollback path

## Export Rule

Base44 can remain temporarily only if every remaining dependency is explicitly documented, isolated, and accepted as a migration blocker or staged migration item.