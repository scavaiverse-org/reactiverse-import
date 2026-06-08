import { PUBLISH_STATES } from "./publishing";

export function tenantFilter(tenantId, extra = {}) {
  return { tenantId, ...extra };
}

export function legacyTenantFilter(tenantId, extra = {}) {
  return { tenant_id: tenantId, ...extra };
}

export function publicTenantFilter(tenantId, extra = {}) {
  return {
    tenantId,
    publishState: PUBLISH_STATES.PUBLISHED,
    ...extra,
  };
}

export function publicExperienceFilter(tenantId, extra = {}) {
  return {
    tenant_id: tenantId,
    status: PUBLISH_STATES.PUBLISHED,
    ...extra,
  };
}

export function publicMuseumPageFilter(tenantId, pageKey, extra = {}) {
  return {
    tenantId,
    pageKey,
    publishState: PUBLISH_STATES.PUBLISHED,
    visibilityState: "public",
    ...extra,
  };
}

export function assertTenantId(tenantId) {
  if (!tenantId) {
    throw new Error("Tenant context is required for this operation.");
  }
  return tenantId;
}