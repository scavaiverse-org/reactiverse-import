# SCAVerse Export Readiness Freeze

Status: FOUNDATION PROOF MODE  
Branch target: `export-readiness-freeze`  
Feature status: frozen until export gates pass

## Freeze Rule

No new pages, routes, badges, CTAs, animations, copy rewrites, AI systems, or feature expansion until export readiness is proven.

Allowed work only:

- lint/build fixes
- dependency mapping
- Supabase/RLS/storage proof
- Base44 decoupling planning and adapter work
- tenant isolation proof
- auth and admin route protection proof
- upload proof
- QA Sentinel proof
- rollback documentation
- staging QA

## Current Export Verdict

Do not export yet.

The app is visually and structurally advanced, but export is blocked until these are proven:

1. Base44 runtime dependencies are mapped and isolated.
2. Supabase schema, RLS, storage, auth, and triggers are live-tested.
3. Tenant isolation is proven with Tenant A and Tenant B accounts.
4. Admin and public journeys are runtime-tested.
5. Upload paths are tested for access, preview, delete, and visibility.
6. AI guide includes source, confidence, uncertainty, and fallback behavior.
7. Mobile, refresh, back/forward, and error states are tested.
8. Staging deployment passes full QA.
9. Rollback path is ready.

## Core User Journeys to Protect

### Visitor Journey

Landing → Tenant page → Tickets → Walkthrough → AI Guide → Vendors → Confirmation

### Admin Journey

Login → Dashboard → Tenant settings → Pages/content → Tickets → Vendors → Media → Analytics → Publish

## Base44 Dependency Classification

Each Base44 reference must be classified as one of:

- keep temporarily
- replace with Supabase
- remove
- fake/unused
- dangerous

Dependency groups to map:

- `base44.entities`
- `base44.auth`
- `base44.functions`
- `base44.integrations`
- `UploadFile`
- AI/InvokeLLM calls
- file storage references
- analytics calls
- invite/user calls

## Architecture Lock Map

| Layer | Current state | Export requirement |
|---|---|---|
| Frontend | React/Vite routes and components | Must build and route safely |
| Auth | Base44 auth active | Replace or explicitly isolate |
| Database | Base44 entities active; Supabase planned | Adapter and live Supabase proof required |
| Storage | Base44 UploadFile references active | Supabase storage policy proof required |
| Admin | Platform + tenant admin routes exist | Role and tenant protection proof required |
| Public pages | Tenant/platform pages exist | Published public data only |
| AI | Base44/Core integrations likely active | Source/confidence/fallback trust layer required |
| Analytics | Entity-backed demo events exist | Public/admin sync and dashboard proof required |
| QA | QA Sentinel exists | Must become export gate |
| Deployment | Base44 runtime active | Staging export proof required |

## Migration Gates

Export is blocked unless all are true:

- [ ] `npm ci` passes
- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] High-risk dependency vulnerabilities are patched or explicitly accepted
- [ ] Base44 dependency map is complete
- [ ] Supabase adapter plan exists
- [ ] Supabase migrations applied to real staging project
- [ ] RLS manually tested with fake users
- [ ] Storage policies manually tested
- [ ] Tenant isolation proven
- [ ] Admin route protection proven
- [ ] Public/admin sync proven
- [ ] Upload flows proven
- [ ] AI trust behavior proven
- [ ] Mobile QA completed
- [ ] Refresh/back-forward QA completed
- [ ] Error states tested
- [ ] QA Sentinel export reviewed
- [ ] Staging deployment passes
- [ ] Rollback plan prepared

## Remaining Production Blockers

- Base44 decoupling is incomplete.
- Supabase live execution is unproven.
- RLS/storage proof is incomplete.
- Upload migration is not proven.
- AI trust layer needs full verification.
- Full route/CTA QA is not complete.
- Real XR/hologram/VR hardware and production media assets are not connected.
- Payment provider is not connected.

## Final Rule

Do not export because the app looks ready. Export only when auth, database, tenant isolation, admin sync, uploads, mobile, AI trust, staging QA, and rollback are proven.