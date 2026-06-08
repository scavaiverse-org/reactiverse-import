# Entity Migration Map

Status: REQUIRED BEFORE DATABASE CUTOVER

## Core Entity Groups

| Entity | Purpose | Scope | Migration Target |
|---|---|---|---|
| `User` / profiles | identity profile and roles | user/platform | Supabase auth + profiles |
| `MuseumTenant` | tenant registry | platform/tenant | `museum_tenants` |
| `MuseumPageConfig` | tenant public/admin page config | tenant | `museum_page_configs` |
| `PlatformPageConfig` | platform public/admin page config | platform | platform page config table |
| `ExperienceConfig` | walkthrough/experience config | tenant | `experience_configs` |
| `ModuleConfig` | tenant module settings | tenant | `module_configs` |
| `Exhibit` | museum exhibits/stories | tenant/public published | `exhibits` |
| `Ticket` | visitor ticket submissions | tenant/private | `tickets` |
| `Vendor` | vendor applications/records | tenant/private/public approved | `vendors` |
| `TenantMedia` | tenant media library | tenant/storage | `tenant_media` |
| `MuseumMediaRegistry` | museum-scoped media registry | tenant/storage | media registry table |
| `PlatformMediaRegistry` | platform media registry | platform/public | `platform_media_registry` |
| `MasterMediaRegistry` | shared media presets | platform/public active | `master_media_registry` |
| `MusicAsset` | music/audio assets | tenant/platform | `music_assets` |
| `TenantContent` | editable content sections | tenant | `tenant_content` |
| `ContentAsset` | content/media support records | tenant/platform | `content_assets` |
| `AnalyticsEvent` | event tracking | tenant/platform | `analytics_events` |
| `MasterPrompt` | AI prompt definitions | tenant/platform | `master_prompts` |
| `PromptVersion` | prompt version history | tenant/platform | `prompt_versions` |
| `AIWorkflow` | AI workflow definitions | tenant/platform | AI workflow table |
| `AIOutput` | AI result/proof records | tenant/platform | AI output table |
| `ApprovalRequest` | moderation/publish approval | tenant/platform | approval table |
| `ContentRevision` | version/history | tenant/platform | revisions table |
| `QASentinelIssue` | QA defects | admin/system | `qa_sentinel_issues` |
| `QASentinelRun` | QA run records | admin/system | `qa_sentinel_runs` |
| `QASentinelEvent` | QA event stream | admin/system | `qa_sentinel_events` |
| `QASentinelCheck` | QA checks | admin/system | `qa_sentinel_checks` |
| `QASentinelExport` | QA exports | admin/system | `qa_sentinel_exports` |
| `PlatformHealth` | operational health | admin/system | platform health table |
| `ExperiencePreset` | reusable experience presets | tenant/platform | `experience_presets` |
| `TenantPresetData` | saved tenant presets | tenant | `tenant_preset_data` |

## Required Fields For Tenant-Owned Tables

Every tenant-owned migrated table must include:

- `id`
- `tenant_id`
- owner/created_by field where applicable
- `created_at`
- `updated_at`
- status or publish state where applicable
- visibility field where public/private matters
- indexes for tenant/status/date queries
- RLS policies for select/insert/update/delete

## Required Public Content Rule

Public pages may read only records that are:

- tenant-owned by the current tenant slug
- explicitly public/visible
- published/active
- not archived/deleted

## Required Admin Rule

Admin pages may read/write only if:

- user is authenticated
- user role allows the action
- tenant scope matches, or user has platform/master scope
- write action is allowed by workflow status

## Data Migration Proof

For each entity, prove:

1. Base44 export count
2. cleaned/mapped count
3. imported staging count
4. relationship count
5. public visibility test
6. tenant A/B isolation test
7. admin read test
8. write persistence test
9. rollback method

## Seed Proof

The `seedMuseumGradeContent` function has already produced a coherent demo tenant seed, but seed data is not production proof. It proves only demo readiness and data shape coverage.