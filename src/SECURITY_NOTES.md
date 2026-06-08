# Security Notes

## Key migration security requirements

- Do not expose Supabase service role keys in frontend code.
- Keep all private API calls in Edge Functions.
- Enable RLS on every user-facing table.
- Use storage bucket policies for media access.
- Validate all webhook signatures.
- Validate tenant ownership server-side for sensitive writes.
- Never rely only on hidden UI for admin protection.

## RLS defaults

The migration enables RLS for all app tables and creates secure default policies:

- Public read only for published public content.
- Public insert for visitor submissions only where required.
- Tenant-scoped staff access using `profiles.tenant_id`.
- Platform admin access using `profiles.role`.
- QA Sentinel and exports are admin-only.

## Sensitive tables

The following should never be publicly readable:

- `profiles`
- `tickets`
- `vendors`
- `analytics_events`
- `qa_sentinel_issues`
- `qa_sentinel_exports`
- draft/private tenant content
- private media objects

## Storage

Buckets:

- `public-media`: public read, admin write.
- `tenant-media`: private tenant/admin scoped.
- `qa-evidence`: private admin-only.

Do not store raw secrets, tokens, payment data, or private documents in public buckets.

## Edge Functions

Use Edge Functions for:

- AI provider calls.
- Slack and webhook handling.
- Email sending.
- Payment provider calls.
- Admin-only maintenance tasks.

Each Edge Function should:

1. Verify authentication when user-facing.
2. Verify admin role when admin-only.
3. Validate request payloads.
4. Avoid permissive CORS.
5. Never return secrets.
6. Log safely without PII or tokens.

## Remaining manual review

Before production launch:

- Confirm every table has RLS enabled.
- Attempt unauthorized reads/writes with anon key.
- Review all storage policies.
- Rotate any secrets copied from Base44.
- Confirm webhook validation for every external provider.
- Confirm admin roles are assigned manually and audited.