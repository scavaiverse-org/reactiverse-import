# Role Security Map

Status: REQUIRED ROLE NORMALIZATION CONTRACT

## Canonical Roles

Use these role meanings across frontend, backend, database, docs, and QA.

| Canonical Role | Meaning | Access Boundary |
|---|---|---|
| `MASTER_ADMIN` | Full platform owner / highest operator | all platform and tenant scopes |
| `PLATFORM_ADMIN` | Platform operator | platform admin and allowed tenant oversight |
| `TENANT_OWNER` | Museum owner | own tenant only |
| `TENANT_ADMIN` | Museum admin | own tenant only |
| `TENANT_EDITOR` | Content editor | own tenant content write scope only |
| `TENANT_VIEWER` | Read-only tenant staff | own tenant read scope only |
| `VENDOR` | Vendor/partner user | own vendor records only |
| `TESTER` | QA/test user | test routes/data only |
| `USER` | Logged-in standard user | own profile/submissions only |
| `PUBLIC` | Anonymous visitor | public published content only |

## Current Risk

Base44 built-in user roles usually include `admin` and `user`. The app must normalize those into the canonical role vocabulary before migration.

## Required Alignment

| Layer | Required Action |
|---|---|
| Frontend route gates | Normalize role values before checking access |
| Auth profile | Store canonical role and tenant IDs |
| Supabase profiles | Include role, tenant_id, tenant_ids, disabled/deleted states |
| RLS policies | Use canonical role helper functions |
| Admin UI | Display role labels consistently |
| Tenant UI | Block wrong-tenant access server-side |
| Backend functions | Validate user, role, tenant, ownership, and allowed action |

## Tenant Isolation Rules

- Public users read only published public records.
- Tenant staff read/write only their own tenant records.
- Tenant staff cannot access another tenant by URL guessing.
- Tenant staff cannot upload into another tenant bucket/path.
- Tenant staff cannot edit platform settings.
- Platform admins can access tenant data only by approved scope.
- Master admins can access all data.
- Disabled/deleted users lose access immediately.

## Backend Write Protection Rule

Every write must validate:

1. authenticated user
2. canonical role
3. tenant ownership
4. record ownership where applicable
5. allowed action
6. record status workflow
7. dangerous-action confirmation where applicable

Frontend hiding is not security.

## Required Fake User Test Set

- Anonymous visitor
- Standard user
- Tester
- Vendor
- Tenant viewer A
- Tenant editor A
- Tenant admin A
- Tenant owner A
- Tenant admin B
- Platform admin
- Master admin

## 100% Proof Requirement

For each role, test:

- login
- logout
- session refresh
- allowed routes
- blocked routes
- read access
- create access
- update access
- delete/archive access
- upload access
- export access
- wrong-tenant URL access