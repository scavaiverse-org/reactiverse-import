import { OWNERSHIP_SCOPES } from "./domain-registry";
import { getUserTenantIds, isMasterUser } from "./rbac";

export const ISOLATION_DOMAINS = {
  PLATFORM: "platform",
  MASTER: "master",
  MUSEUM: "museum",
};

export const TENANT_SCOPED_ENTITIES = [
  "MuseumPageConfig",
  "TenantContent",
  "TenantMedia",
  "ExperienceConfig",
  "Ticket",
  "Vendor",
  "Exhibit",
  "AnalyticsEvent",
  "PermissionGrant",
  "AIWorkflow",
  "AIOutput",
  "ApprovalRequest",
  "ContentRevision",
];

export const PLATFORM_SCOPED_ENTITIES = [
  "PlatformPageConfig",
  "PlatformMediaRegistry",
  "PlatformArchitecturePreset",
  "PlatformHealth",
  "MasterMuseumCategory",
  "MasterMediaRegistry",
  "MasterPrompt",
  "PromptVersion",
];

export const isolationRules = {
  platformOwnsPlatformPages: true,
  tenantOwnsMuseumPages: true,
  tenantMediaNeverSharedWithPlatform: true,
  platformMediaNeverMutatesTenantMedia: true,
  publicPagesRenderPublishedRecordsOnly: true,
  tenantStaffLimitedToAssignedTenants: true,
};

export function getRecordTenantId(record = {}) {
  return record.tenantId || record.tenant_id || record.museumId || record.museum_id || record.ownerTenantId || null;
}

export function withTenantAliases(payload = {}, tenantId) {
  return {
    ...payload,
    tenantId,
    tenant_id: tenantId,
  };
}

export function getRecordOwnershipScope(record = {}) {
  return record.ownershipScope || record.visibilityScope || null;
}

export function isPlatformScopedRecord(record = {}) {
  return getRecordOwnershipScope(record) === OWNERSHIP_SCOPES.PLATFORM;
}

export function isTenantScopedRecord(record = {}) {
  return getRecordOwnershipScope(record) === OWNERSHIP_SCOPES.MUSEUM || !!getRecordTenantId(record);
}

export function canUserAccessTenantRecord(user, record = {}, tenantId = getRecordTenantId(record)) {
  if (isMasterUser(user)) return true;
  if (!tenantId) return false;
  return getUserTenantIds(user).includes(tenantId);
}

export function buildIsolationFingerprint({ domain, tenantId, entityName, pageKey }) {
  return [domain || "unknown", tenantId || "platform", entityName || "record", pageKey || "default"].join(":");
}

export function getEntityIsolationScope(entityName) {
  if (TENANT_SCOPED_ENTITIES.includes(entityName)) return ISOLATION_DOMAINS.MUSEUM;
  if (PLATFORM_SCOPED_ENTITIES.includes(entityName)) return ISOLATION_DOMAINS.PLATFORM;
  return ISOLATION_DOMAINS.MUSEUM;
}