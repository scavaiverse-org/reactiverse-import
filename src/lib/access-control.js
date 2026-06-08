import { ROLES, hasPermission, isMasterUser, normalizeRole, PERMISSIONS } from "./rbac";
import { canUserAccessTenantRecord, getRecordTenantId, isPlatformScopedRecord } from "./isolation-contract";

export { ROLES, normalizeRole };

export function canAccessPlatform(user) {
  return isMasterUser(user);
}

export function canAccessMuseum(user, tenantId) {
  const role = normalizeRole(user?.role);
  if (isMasterUser(user)) return true;
  if ([
    ROLES.FRANCHISE_OWNER,
    ROLES.FRANCHISE_MANAGER,
    ROLES.FRANCHISE_STAFF,
    ROLES.CONTENT_EDITOR,
    ROLES.MEDIA_MANAGER,
    ROLES.APPROVAL_REVIEWER,
    ROLES.ANALYTICS_VIEWER,
  ].includes(role)) {
    return canUserAccessTenantRecord(user, {}, tenantId);
  }
  return false;
}

export function canPerform(user, permission, record = {}) {
  if (isPlatformScopedRecord(record)) return canAccessPlatform(user) && hasPermission(user, permission, record);
  return canUserAccessTenantRecord(user, record, getRecordTenantId(record)) && hasPermission(user, permission, record);
}

export function isReadOnly(user) {
  return !hasPermission(user, PERMISSIONS.WRITE);
}