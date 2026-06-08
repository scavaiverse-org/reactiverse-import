# Base44 SDK Replacement Map

## Current Base44 entry point

The app currently imports:

```js
import { base44 } from '@/api/base44Client';
```

## Recommended staged replacement

Create a Supabase-backed compatibility module that exports a `base44`-like object during migration. This reduces rewrite risk.

Example target API:

```js
base44.entities.MuseumTenant.list()
base44.entities.MuseumTenant.filter({ slug })
base44.entities.MuseumTenant.create(data)
base44.entities.MuseumTenant.update(id, data)
base44.entities.MuseumTenant.delete(id)
base44.auth.me()
base44.auth.logout()
base44.functions.invoke('functionName', payload)
```

## Entity table map

```js
const entityTableMap = {
  MuseumTenant: 'museum_tenants',
  ExperienceConfig: 'experience_configs',
  MuseumPageConfig: 'museum_page_configs',
  Exhibit: 'exhibits',
  Ticket: 'tickets',
  Vendor: 'vendors',
  TenantMedia: 'tenant_media',
  MusicAsset: 'music_assets',
  AnalyticsEvent: 'analytics_events',
  QASentinelIssue: 'qa_sentinel_issues',
  QASentinelExport: 'qa_sentinel_exports',
  MasterPrompt: 'master_prompts',
  PromptVersion: 'prompt_versions',
  ContentAsset: 'content_assets',
  PlatformMediaRegistry: 'platform_media_registry',
  MasterMediaRegistry: 'master_media_registry',
  TenantContent: 'tenant_content',
  ModuleConfig: 'module_configs',
  ExperiencePreset: 'experience_presets',
  TenantPresetData: 'tenant_preset_data'
};
```

## Important caution

Do not swap the current Base44 client in-place until:

1. Supabase schema exists.
2. RLS has been tested.
3. Production data has been imported or seeded.
4. Auth provider and route guards have been migrated.

Otherwise the current app preview will lose data access.