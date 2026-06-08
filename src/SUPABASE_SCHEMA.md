# Supabase Schema

The SQL schema is defined in `supabase/migrations/0001_initial_schema.sql`.

## Naming conventions

- Base44 entities use PascalCase, e.g. `MuseumTenant`.
- Supabase tables use snake_case plural names, e.g. `museum_tenants`.
- Base44 `created_date` maps to `created_at`.
- Base44 `updated_date` maps to `updated_at`.
- Base44 `created_by_id` maps to `created_by_id`.
- Base44 object fields map to `jsonb`.
- Base44 array fields map to `text[]` when simple strings, otherwise `jsonb`.

## Entity-to-table mapping

| Base44 entity | Supabase table |
|---|---|
| User | `auth.users` + `profiles` |
| MuseumTenant | `museum_tenants` |
| ExperienceConfig | `experience_configs` |
| MuseumPageConfig | `museum_page_configs` |
| Exhibit | `exhibits` |
| Ticket | `tickets` |
| Vendor | `vendors` |
| TenantMedia | `tenant_media` |
| MusicAsset | `music_assets` |
| AnalyticsEvent | `analytics_events` |
| QASentinelIssue | `qa_sentinel_issues` |
| QASentinelExport | `qa_sentinel_exports` |
| MasterPrompt | `master_prompts` |
| PromptVersion | `prompt_versions` |
| ContentAsset | `content_assets` |
| PlatformMediaRegistry | `platform_media_registry` |
| MasterMediaRegistry | `master_media_registry` |
| TenantContent | `tenant_content` |
| ModuleConfig | `module_configs` |
| ExperiencePreset | `experience_presets` |
| TenantPresetData | `tenant_preset_data` |

## Important assumptions

1. Tenant isolation is based on `tenant_id`.
2. Platform admins are users whose `profiles.role` is one of `admin`, `master_admin`, or `platform_admin`.
3. Public museum pages are rows where `publish_state = 'published'` and `visibility_state = 'public'`.
4. Visitor-created ticket/vendor records are insertable publicly but readable only by staff/admin or the authenticated owner.
5. Many relationships are implicit text IDs in Base44, so the first migration preserves them as text rather than forcing strict foreign keys that may break imports.
6. Once production data is imported and validated, stricter foreign keys can be added in a later migration.

## Recommended follow-up constraints

After successful import, add foreign keys where data quality allows:

- `experience_configs.tenant_id -> museum_tenants.id`
- `museum_page_configs.tenant_id -> museum_tenants.id`
- `exhibits.tenant_id -> museum_tenants.id`
- `tickets.tenant_id -> museum_tenants.id`
- `vendors.tenant_id -> museum_tenants.id`
- `tenant_media.tenant_id -> museum_tenants.id`
- `module_configs.tenant_id -> museum_tenants.id