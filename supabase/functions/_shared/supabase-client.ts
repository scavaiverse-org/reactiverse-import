import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { normalizeRole } from './rbac.ts';

// SUPABASE_URL is auto-injected into every Edge Function by the platform, but
// validate it once up front so a misconfigured environment fails with a clear
// message instead of an opaque createClient error deeper in a request.
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
if (!SUPABASE_URL) {
  throw new Error('SUPABASE_URL environment variable is required');
}

// Resolves an API key from the first env var that yields a usable value.
// Platform-managed vars (SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY) are
// kept in sync with the project's current keys (post key-migration they hold
// the new publishable/secret keys), so they take priority over the manually
// managed *_KEYS secrets, which may hold JSON arrays or stale values.
function resolveKey(...names: string[]): string {
  for (const name of names) {
    const raw = (Deno.env.get(name) || '').trim();
    if (!raw) continue;
    if (raw.startsWith('[')) {
      try {
        const arr = JSON.parse(raw);
        const first = Array.isArray(arr) ? arr[0] : undefined;
        if (typeof first === 'string' && first.trim()) return first.trim();
      } catch { /* not JSON — fall through */ }
      continue;
    }
    return raw.split(',')[0].trim();
  }
  return '';
}

export function getServiceRoleClient() {
  return createClient(
    SUPABASE_URL,
    resolveKey('SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SECRET_KEYS'),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export function getUserClient(authHeader: string) {
  return createClient(
    SUPABASE_URL,
    resolveKey('SUPABASE_ANON_KEY', 'SUPABASE_PUBLISHABLE_KEYS'),
    { global: { headers: { Authorization: authHeader } } },
  );
}

// Resolves the authenticated user plus their role from the profiles table.
// The returned role is always canonical (see _shared/rbac.ts) — stored values
// like 'MASTER_ADMIN', 'admin', or 'tenant_admin' all normalize consistently.
export async function getAuthUser(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;
  const userClient = getUserClient(authHeader);
  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) return null;
  const service = getServiceRoleClient();
  const { data: profile } = await service
    .from('profiles')
    .select('role, tenant_id, tenant_ids')
    .eq('id', user.id)
    .maybeSingle();
  // Merge the singular tenant_id and the tenant_ids array — either may be set
  // depending on how the member was provisioned (mirrors AuthContext).
  const tenantIds = Array.from(new Set([
    ...(profile?.tenant_ids ?? []),
    ...(profile?.tenant_id ? [profile.tenant_id] : []),
  ]));
  return { ...user, role: normalizeRole(profile?.role), tenantIds };
}
