# Environment Variables

Copy `.env.example` to `.env.local` for local development.

## Supabase

| Variable | Required | Scope | Description |
|---|---:|---|---|
| `VITE_SUPABASE_URL` | Yes | Frontend | Supabase project URL. Safe for browser. |
| `VITE_SUPABASE_ANON_KEY` | Yes | Frontend | Supabase anon key. Safe for browser with RLS enabled. |
| `SUPABASE_PROJECT_REF` | Yes | CLI/Deploy | Supabase project reference. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Edge Functions | Service role key. Never expose in frontend. |

## App

| Variable | Required | Scope | Description |
|---|---:|---|---|
| `VITE_APP_URL` | Yes | Frontend | Local or production frontend URL. |
| `VITE_DEFAULT_MUSEUM_SLUG` | Optional | Frontend | Default tenant slug for redirects. |
| `INTERNAL_PORTAL_ACCESS_CODE` | Optional | Server only | Replacement for the existing Base44 internal access secret. |

## Optional integrations

| Variable | Required when | Scope | Notes |
|---|---|---|---|
| `SLACK_BOT_TOKEN` | Slack posting/webhooks | Server only | Existing Base44 Slack connector must be reimplemented with OAuth or bot token. |
| `SLACK_SIGNING_SECRET` | Slack webhooks | Server only | Validate Slack requests. |
| `AI_PROVIDER_API_KEY` | AI generation | Server only | Used by Edge Function, not frontend. |
| `EMAIL_PROVIDER_API_KEY` | Email sending | Server only | For transactional email. |
| `PAYMENT_PROVIDER_SECRET_KEY` | Payments | Server only | Stripe or other provider secret key. |
| `WEBHOOK_SECRET` | External webhooks | Server only | Shared secret for custom webhooks. |

## Security rules

- Never commit real `.env.local` values.
- Never put service role keys in Vite variables.
- Only `VITE_*` variables are allowed in frontend code.
- Edge Functions must read secrets from Supabase function environment variables.