import { supabase, hasSupabaseConfig } from '@/lib/supabase';

// Map of Base44 entity name -> Supabase table name.
// Entities not listed here fall back to a safe stub that returns empty
// data, so a missing migration doesn't crash the React tree.
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
  QASentinelEvent: 'qa_sentinel_events',
  QASentinelRun: 'qa_sentinel_runs',
  MasterPrompt: 'master_prompts',
  PromptVersion: 'prompt_versions',
  ContentAsset: 'content_assets',
  PlatformMediaRegistry: 'platform_media_registry',
  MasterMediaRegistry: 'master_media_registry',
  TenantContent: 'tenant_content',
  ModuleConfig: 'module_configs',
  ExperiencePreset: 'experience_presets',
  TenantPresetData: 'tenant_preset_data',
  TesterFeedback: 'tester_feedback',
  PublicContent: 'public_content',
  AuditLog: 'audit_log',
  HomeConfig: 'home_configs',
  MasterMuseumCategory: 'master_museum_categories',
  OnboardingProgress: 'onboarding_progress',
  PlatformHealth: 'platform_health',
  RolePermission: 'role_permissions',
  TenantAccess: 'tenant_access',
  TenantInquiry: 'tenant_inquiries',
  UserProfile: 'user_profiles',
  VisitPlan: 'visit_plans',
};

// Entities the original Base44 app exposed that have no Supabase table yet.
// These get a silent stub so the React tree mounts; the gap surfaces in console.
const UNMIGRATED_ENTITIES = new Set(['PlatformPageConfig']);

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

function keysToCamel(obj) {
  if (Array.isArray(obj)) return obj.map(keysToCamel);
  if (obj && typeof obj === 'object' && obj.constructor === Object) {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      out[snakeToCamel(k)] = keysToCamel(v);
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
    // Base44 realtime subscriptions are not yet ported. Returns a no-op
    // unsubscribe so existing call sites don't crash. To enable real-time:
    // forward to supabase.channel(...).on('postgres_changes', ...).
    subscribe(_callback) {
      return () => {};
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
