import { supabase } from "@/lib/supabase";
import { base44 } from "@/api/base44Client";
import { ROLES, normalizeRole, isMasterUser, getUserTenantIds } from "@/lib/rbac";

/**
 * Fetches the role/tenant/franchise-intent fields used to decide where a
 * freshly authenticated user should land.
 */
export async function fetchAuthProfile(authUserId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("role, tenant_ids, account_type")
    .eq("id", authUserId)
    .single();
  if (error) throw error;
  return data;
}

/**
 * Where a signed-in user should land when they didn't arrive via an explicit
 * `?redirect=` (e.g. from a protected route). Without this, every login just
 * bounces back to the same public homepage with no visible change, which
 * looks like "login isn't working".
 */
export async function resolvePostLoginDestination(profile) {
  const user = { role: profile?.role, tenantIds: profile?.tenant_ids ?? [] };

  if (isMasterUser(user)) return "/platform/admin";

  if (normalizeRole(user.role) !== ROLES.PUBLIC_USER) {
    const tenantIds = getUserTenantIds(user);
    if (tenantIds.length > 0) {
      const tenants = await base44.entities.MuseumTenant.list();
      const tenant = tenants.find((item) => item.id === tenantIds[0]);
      if (tenant?.slug) return `/museum/${tenant.slug}/admin`;
    }
  }

  // Public users who already chose their account type go straight to the
  // consumer platform; undecided ones land on "/" where AccountTypeGate asks.
  if (profile?.account_type) return "/platform/overview";

  return "/";
}
