# Data Export and Import Strategy

## Export from Base44

Export every entity as JSON or CSV where possible. Preserve these built-in fields:

- `id`
- `created_date`
- `updated_date`
- `created_by_id`

If direct export is unavailable, use Base44 admin pages or temporary export functions to read entity data and download JSON files.

## Transform field names

Common mappings:

| Base44 | Supabase |
|---|---|
| `created_date` | `created_at` |
| `updated_date` | `updated_at` |
| `created_by_id` | `created_by_id` |
| `tenantId` | `tenant_id` |
| `ownerId` | `owner_id` |
| `fileUrl` | `file_url` |
| `storageUrl` | `storage_url` |
| `publishState` | `publish_state` |
| `visibilityScope` | `visibility_scope` |

## File migration

1. Download Base44-hosted files where legally and technically possible.
2. Upload files to Supabase Storage.
3. Preserve folder structure by tenant:

```text
tenant-media/{tenant_id}/{original_filename}
public-media/{asset_type}/{original_filename}
```

4. Rewrite database file URL fields to Supabase public URLs or signed URL paths.

## Import order

1. `profiles`
2. `museum_tenants`
3. `module_configs`
4. `museum_page_configs`
5. `tenant_media`, `music_assets`, `platform_media_registry`, `master_media_registry`
6. `experience_configs`, `experience_presets`, `tenant_preset_data`
7. `exhibits`
8. `tickets`, `vendors`
9. `analytics_events`
10. `qa_sentinel_issues`, `qa_sentinel_exports`

## Validation queries

```sql
select count(*) from museum_tenants;
select tenant_id, count(*) from museum_page_configs group by tenant_id;
select tenant_id, count(*) from exhibits group by tenant_id;
select status, count(*) from tickets group by status;
select status, count(*) from vendors group by status;
```

## Relationship validation

```sql
select e.*
from exhibits e
left join museum_tenants t on t.id = e.tenant_id
where e.tenant_id is not null and t.id is null;
```

Run equivalent checks for tenant-scoped tables after import.