# SCAVerse Isolation Foundation

SCAVerse isolation is the first execution priority. The platform must separate platform ownership from museum ownership before ticketing, commerce, analytics, or immersive expansion scale further.

## Core Rule

Platform records and museum records must never share ownership, media control, publish control, or mutation authority.

## Ownership Domains

- Master domain: ecosystem governance, global standards, tenant registry, permissions, infrastructure, and audit visibility.
- Platform domain: SCAVerse public platform pages, platform media, platform services, templates, navigation, SEO, and acquisition pages.
- Museum domain: tenant-owned museum pages, tickets, media, exhibits, vendors, walkthroughs, analytics, branding, and commerce content.

## Tenant Boundary Contract

Every museum-owned record must resolve to a tenant identity using one of:

- tenantId
- tenant_id
- museumId
- ownerTenantId

Museum staff may only read or mutate records for assigned tenant IDs. Platform staff may administer platform records. Master/platform admins may inspect tenant records for governance, but tenant staff must never cross tenant boundaries.

## Media Boundary Contract

Platform media and tenant media remain separate registries.

Admin Upload → Save → Publish → Public Reflection must preserve:

- record ownership,
- media registry ownership,
- publish state,
- page key,
- tenant ID,
- and public render target.

## Architecture Hooks

The isolation foundation is implemented through:

- `lib/isolation-contract.js` for canonical isolation rules,
- `lib/access-control.js` for platform and tenant access checks,
- `lib/tenant-state.js` for deterministic tenant context resolution,
- `hooks/useActiveTenant.js` for route-aware tenant selection.

## Validation Standard

A feature is not commercially ready until it proves:

- platform pages are platform-owned,
- museum pages are tenant-owned,
- tenant media is isolated,
- tenant tickets are isolated,
- tenant analytics are isolated,
- admin controls mirror public rendering,
- and public pages reflect published records only.