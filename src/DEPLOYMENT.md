# Deployment Guide

## 1. Prerequisites

Install:

- Node.js 20+
- npm
- Supabase CLI
- Git

## 2. Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Fill these values in `.env.local`:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=http://localhost:5173
```

## 3. Supabase setup

Create a new Supabase project, then run:

```bash
supabase init
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

The migrations are located in:

```text
supabase/migrations
```

## 4. Edge Functions

After recreating backend functions as Supabase Edge Functions:

```bash
supabase functions deploy verify-portal-access
supabase functions deploy repair-walkthrough-media-links
supabase functions deploy seed-museum-grade-content
supabase functions deploy post-operational-status-update
supabase functions deploy invoke-ai
```

Set server-side secrets:

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
supabase secrets set INTERNAL_PORTAL_ACCESS_CODE=...
supabase secrets set AI_PROVIDER_API_KEY=...
```

## 5. Production build

```bash
npm run build
```

## 6. Deploy to Vercel

Recommended for the React/Vite frontend.

1. Push the repository to GitHub.
2. Import the repo into Vercel.
3. Framework preset: Vite.
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_APP_URL`
   - `VITE_DEFAULT_MUSEUM_SLUG`

## 7. Deploy to Netlify

Alternative deployment option:

- Build command: `npm run build`
- Publish directory: `dist`
- Add the same frontend environment variables.

## 8. Post-deployment checks

- Open public home page.
- Open public museum route.
- Test login/logout.
- Confirm tenant admin routes are blocked for unauthenticated users.
- Confirm admin-only pages require admin role.
- Upload a test file to storage.
- Create a test ticket/vendor record.
- Confirm RLS blocks unauthorized data reads.