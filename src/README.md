# SCAVerse Migration Workspace

This repository currently contains the Base44 React/Vite application plus a Supabase migration package for rebuilding the app outside Base44.

## Current status

- Frontend: React + Vite + Tailwind + shadcn-style components.
- Current backend dependency: Base44 SDK (`@/api/base44Client`).
- Target backend: Supabase Auth, PostgreSQL, Storage, RLS, and Edge Functions.
- Migration artifacts are staged in `/supabase/migrations` and the documentation files in the project root.

## Recommended migration path

1. Create a new GitHub repository from the exported source.
2. Create a new Supabase project.
3. Copy `.env.example` to `.env.local` and fill Supabase values.
4. Run Supabase migrations.
5. Replace Base44 SDK calls using the migration mapping in `MIGRATION_PLAN.md`.
6. Export Base44 data and import it into the Supabase tables.
7. Deploy the Vite frontend to Vercel or Netlify.

## Local development after migration

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Supabase setup

```bash
supabase init
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

See `DEPLOYMENT.md` for full setup and deployment instructions.