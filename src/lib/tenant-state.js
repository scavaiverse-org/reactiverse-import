const ACTIVE_TENANT_KEY = "scava_active_tenant_id";

export function getStoredTenantId() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_TENANT_KEY);
}

export function setStoredTenantId(tenantId) {
  if (typeof window === "undefined" || !tenantId) return;
  window.localStorage.setItem(ACTIVE_TENANT_KEY, tenantId);
}

export function findTenantBySlug(tenants = [], tenantSlug) {
  return tenantSlug ? tenants.find((tenant) => tenant.slug === tenantSlug) || null : null;
}

export function getActiveTenant(tenants = [], activeTenantId) {
  return tenants.find((tenant) => tenant.id === activeTenantId) || tenants[0] || null;
}

export function resolveTenantContext(tenants = [], { tenantSlug, storedTenantId } = {}) {
  const slugTenant = findTenantBySlug(tenants, tenantSlug);
  const liveTenant = tenants.find((tenant) => tenant.status === "live");
  const activeTenant = getActiveTenant(tenants, storedTenantId) || liveTenant || tenants[0] || null;

  return {
    tenant: tenantSlug ? slugTenant : activeTenant,
    slugTenant,
    liveTenant,
    activeTenant,
    isolationKey: tenantSlug ? tenantSlug : activeTenant?.id || "platform",
  };
}