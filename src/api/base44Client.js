import { supabase, hasSupabaseConfig } from '@/lib/supabase';

// Map of Base44 entity name -> Supabase table name.
// Entities not listed here fall back to a safe stub that returns empty
// data, so a missing migration doesn't crash the React tree.
const entityTableMap = {
  // Migrated in 0001_initial_schema.sql
  AnalyticsEvent: 'analytics_events',
  ContentAsset: 'content_assets',
  Exhibit: 'exhibits',
  ExperienceConfig: 'experience_configs',
  ExperiencePreset: 'experience_presets',
  MasterMediaRegistry: 'master_media_registry',
  MasterPrompt: 'master_prompts',
  ModuleConfig: 'module_configs',
  MuseumPageConfig: 'museum_page_configs',
  MuseumTenant: 'museum_tenants',
  MusicAsset: 'music_assets',
  PlatformMediaRegistry: 'platform_media_registry',
  PromptVersion: 'prompt_versions',
  QASentinelExport: 'qa_sentinel_exports',
  QASentinelIssue: 'qa_sentinel_issues',
  TenantContent: 'tenant_content',
  TenantMedia: 'tenant_media',
  TenantPresetData: 'tenant_preset_data',
  Ticket: 'tickets',
  Vendor: 'vendors',

  // Added in 0005_missing_entities.sql
  AIGuideConfig: 'ai_guide_configs',
  AIGuideQA: 'ai_guide_qa',
  AIOutput: 'ai_outputs',
  AIWorkflow: 'ai_workflows',
  ApprovalRequest: 'approval_requests',
  AuditLog: 'audit_log',
  CommerceProduct: 'commerce_products',
  ContentRevision: 'content_revisions',
  ExperienceEditorDefaultSetting: 'experience_editor_default_settings',
  ExperienceEditorModule: 'experience_editor_modules',
  ExperienceEditorQARule: 'experience_editor_qa_rules',
  ExperienceEditorTemplate: 'experience_editor_templates',
  ExperienceEditorTool: 'experience_editor_tools',
  HomeConfig: 'home_configs',
  HomePageConfig: 'home_page_configs',
  MasterMuseumCategory: 'master_museum_categories',
  MigrationTracker: 'migration_trackers',
  MuseumArchitecturePreset: 'museum_architecture_presets',
  MuseumCoCuratorPromptPreset: 'museum_co_curator_prompt_presets',
  MuseumMediaRegistry: 'museum_media_registry',
  MuseumModeArtifact: 'museum_mode_artifacts',
  MuseumModeObjectType: 'museum_mode_object_types',
  OnboardingProgress: 'onboarding_progress',
  OnboardingStep: 'onboarding_steps',
  PermissionGrant: 'permission_grants',
  PlatformArchitecturePreset: 'platform_architecture_presets',
  PlatformHealth: 'platform_health',
  PlatformPageConfig: 'platform_page_configs',
  PromptExecution: 'prompt_executions',
  PublicContent: 'public_content',
  PublishLog: 'publish_logs',
  PublishedExperienceManifest: 'published_experience_manifests',
  QASentinelCheck: 'qa_sentinel_checks',
  QASentinelEvent: 'qa_sentinel_events',
  QASentinelRun: 'qa_sentinel_runs',
  RolePermission: 'role_permissions',
  RoomSemanticEnginePreset: 'room_semantic_engine_presets',
  RoomSemanticLayout: 'room_semantic_layouts',
  RouteCoverage: 'route_coverage',
  TenantAccess: 'tenant_access',
  TenantInquiry: 'tenant_inquiries',
  TesterFeedback: 'tester_feedback',
  TicketOrder: 'ticket_orders',
  TicketType: 'ticket_types',
  UserProfile: 'user_profiles',
  VisitPlan: 'visit_plans',
  // Auth-linked RBAC profile — the role source of truth used by login,
  // edge functions, and the tour gate (NOT the legacy user_profiles table).
  Profile: 'profiles',

  // Added in 0016_inventory_and_etickets.sql
  ETicketTemplate: 'e_ticket_templates',
  InventoryItem: 'inventory_items',
};

// All 65 Base44 entities now map to a real Supabase table. The catch-all
// Proxy in buildEntities() still returns a safe stub for any unknown entity
// name so accidental access never throws.
const UNMIGRATED_ENTITIES = new Set();

const camelToSnake = (s) => s.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase());
const snakeToCamel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

function keysToSnake(obj) {
  if (Array.isArray(obj)) return obj.map(keysToSnake);
  if (obj && typeof obj === 'object' && obj.constructor === Object) {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      out[camelToSnake(k)] = keysToSnake(v);
    }
    return out;
  }
  return obj;
}

// Keep the original (snake_case) keys AND add camelCase aliases. Parts of the
// app read Base44-style camelCase (e.g. pageConfig.heroMedia) while others read
// raw column names (e.g. config.config_json.ticket_types); emitting both keeps
// every consumer working, including keys nested inside stored JSON payloads.
function keysToCamel(obj) {
  if (Array.isArray(obj)) return obj.map(keysToCamel);
  if (obj && typeof obj === 'object' && obj.constructor === Object) {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      const converted = keysToCamel(v);
      out[k] = converted;
      const camel = snakeToCamel(k);
      if (camel !== k && !(camel in obj)) out[camel] = converted;
    }
    return out;
  }
  return obj;
}

// Parse Base44 sort arg: "-updatedAt" -> { column: "updated_at", ascending: false }
function parseSort(sortArg) {
  if (!sortArg || typeof sortArg !== 'string') return null;
  const ascending = !sortArg.startsWith('-');
  const field = ascending ? sortArg : sortArg.slice(1);
  return { column: camelToSnake(field), ascending };
}

function applyFilters(query, filters) {
  for (const [key, value] of Object.entries(filters || {})) {
    const column = camelToSnake(key);
    if (Array.isArray(value)) {
      query = query.in(column, value);
    } else if (value === null) {
      query = query.is(column, null);
    } else {
      query = query.eq(column, value);
    }
  }
  return query;
}

function makeUnmigratedStub(entityName) {
  const warn = (op) => {
    if (typeof console !== 'undefined') {
      console.warn(`[base44Client] ${entityName}.${op}() called but no Supabase table exists. Returning stub.`);
    }
  };
  return {
    async list() { warn('list'); return []; },
    async filter() { warn('filter'); return []; },
    async get() { warn('get'); return null; },
    async create() { warn('create'); throw new Error(`Entity ${entityName} is not migrated`); },
    async update() { warn('update'); throw new Error(`Entity ${entityName} is not migrated`); },
    async delete() { warn('delete'); throw new Error(`Entity ${entityName} is not migrated`); },
    subscribe() { return () => {}; },
  };
}

function createEntity(_entityName, table) {
  return {
    async list(sortArg, limit) {
      let query = supabase.from(table).select('*');
      const sort = parseSort(sortArg);
      if (sort) query = query.order(sort.column, { ascending: sort.ascending });
      if (Number.isFinite(limit)) query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return keysToCamel(data || []);
    },
    async filter(filters, sortArg, limit) {
      let query = supabase.from(table).select('*');
      query = applyFilters(query, filters);
      const sort = parseSort(sortArg);
      if (sort) query = query.order(sort.column, { ascending: sort.ascending });
      if (Number.isFinite(limit)) query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return keysToCamel(data || []);
    },
    async get(id) {
      const { data, error } = await supabase.from(table).select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return keysToCamel(data);
    },
    async create(data) {
      const { data: result, error } = await supabase.from(table).insert(keysToSnake(data)).select().single();
      if (error) throw error;
      return keysToCamel(result);
    },
    async update(id, data) {
      const { data: result, error } = await supabase.from(table).update(keysToSnake(data)).eq('id', id).select().single();
      if (error) throw error;
      return keysToCamel(result);
    },
    async delete(id) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      return true;
    },
    subscribe(callback) {
      if (!hasSupabaseConfig || typeof callback !== 'function') return () => {};
      const channel = supabase
        .channel(`realtime:${table}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
          callback(keysToCamel(payload));
        })
        .subscribe();
      return () => supabase.removeChannel(channel);
    },
  };
}

function buildEntities() {
  const entities = {};
  for (const [name, table] of Object.entries(entityTableMap)) {
    entities[name] = createEntity(name, table);
  }
  for (const name of UNMIGRATED_ENTITIES) {
    entities[name] = makeUnmigratedStub(name);
  }
  // Catch-all: unknown entity access returns the unmigrated stub instead of
  // undefined, so accidental references don't throw "cannot read property of undefined".
  return new Proxy(entities, {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (typeof prop === 'string') return makeUnmigratedStub(prop);
      return undefined;
    },
  });
}

const entities = buildEntities();

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
      if (!hasSupabaseConfig) return null;
      const { data, error } = await supabase.functions.invoke(name, { body: payload });
      if (error) {
        console.warn(`[base44Client] functions.invoke(${name}) failed:`, error);
        return null;
      }
      return data;
    },
  },
};
