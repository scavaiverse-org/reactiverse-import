# Environment Variables Example

Status: TEMPLATE ONLY — DO NOT STORE REAL SECRETS IN REPO

## Rules

- Never commit real secrets.
- Never expose service role keys in frontend code.
- Keep local, staging, and production values separate.
- Rotate any secret that was ever pasted into chat, docs, screenshots, or frontend code.
- Store private values only in the hosting provider / backend secret manager.

## Base44 / Internal

```bash
INTERNAL_PORTAL_ACCESS_CODE=replace_me
```

## Supabase

Frontend-safe public values:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=replace_with_anon_key
```

Backend-only private values:

```bash
SUPABASE_SERVICE_ROLE_KEY=server_only_never_frontend
SUPABASE_JWT_SECRET=server_only_if_needed
```

## Firebase

Frontend-safe values, if Firebase is selected:

```bash
VITE_FIREBASE_API_KEY=replace_me
VITE_FIREBASE_AUTH_DOMAIN=replace_me
VITE_FIREBASE_PROJECT_ID=replace_me
VITE_FIREBASE_STORAGE_BUCKET=replace_me
VITE_FIREBASE_MESSAGING_SENDER_ID=replace_me
VITE_FIREBASE_APP_ID=replace_me
```

Private values, if backend Firebase Admin is selected:

```bash
FIREBASE_SERVICE_ACCOUNT_JSON=server_only
```

## AI Provider

```bash
AI_PROVIDER_API_KEY=server_only
AI_PROVIDER_MODEL=replace_me
```

## Email Provider

```bash
EMAIL_PROVIDER_API_KEY=server_only
EMAIL_FROM_ADDRESS=no-reply@example.com
```

## Payments

```bash
STRIPE_SECRET_KEY=server_only
STRIPE_WEBHOOK_SECRET=server_only
VITE_STRIPE_PUBLISHABLE_KEY=public_key_only
```

## Cloudflare / Deployment

```bash
CLOUDFLARE_API_TOKEN=server_only
CLOUDFLARE_ACCOUNT_ID=replace_me
PUBLIC_SITE_URL=https://example.com
STAGING_SITE_URL=https://staging.example.com
```

## Webhooks

```bash
WEBHOOK_SHARED_SECRET=server_only
```

## Analytics

```bash
VITE_ANALYTICS_ID=replace_me_if_used
```

## Required Environments

- `.env.local` for local development
- staging provider environment variables
- production provider environment variables

Do not copy production secrets into local developer machines unless absolutely required and approved.