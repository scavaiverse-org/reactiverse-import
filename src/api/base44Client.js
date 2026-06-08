import { supabase } from '@/lib/supabase';

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
  TenantPresetData: 'tenant_preset_data',
};

function createEntity(entityName) {
  const table = entityTableMap[entityName];
  return {
    async list() {
      const { data, error } = await supabase.from(table).select('*');
      if (error) throw error;
      return data;
    },
    async filter(filters) {
      let query = supabase.from(table).select('*');
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    async create(data) {
      const { data: result, error } = await supabase.from(table).insert(data).select().single();
      if (error) throw error;
      return result;
    },
    async update(id, data) {
      const { data: result, error } = await supabase.from(table).update(data).eq('id', id).select().single();
      if (error) throw error;
      return result;
    },
    async delete(id) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      return true;
    },
  };
}

const entities = Object.fromEntries(
  Object.keys(entityTableMap).map((name) => [name, createEntity(name)])
);

export const base44 = {
  entities,
  auth: {
    async me() {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
    async logout() {
      await supabase.auth.signOut();
    },
    async isAuthenticated() {
      const { data: { session } } = await supabase.auth.getSession();
      return !!session;
    },
    redirectToLogin(redirectUrl) {
      window.location.href = '/login?redirect=' + encodeURIComponent(redirectUrl || '/');
    },
  },
  functions: {
    async invoke(name, payload) {
      console.warn('Function invoke not yet migrated:', name, payload);
      return null;
    },
  },
};
