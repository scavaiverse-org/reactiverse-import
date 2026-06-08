export const ROLES = {
  MASTER_ADMIN: "MASTER_ADMIN",
  PLATFORM_ADMIN: "PLATFORM_ADMIN",
  FRANCHISE_OWNER: "FRANCHISE_OWNER",
  FRANCHISE_MANAGER: "FRANCHISE_MANAGER",
  FRANCHISE_STAFF: "FRANCHISE_STAFF",
  CONTENT_EDITOR: "CONTENT_EDITOR",
  MEDIA_MANAGER: "MEDIA_MANAGER",
  APPROVAL_REVIEWER: "APPROVAL_REVIEWER",
  ANALYTICS_VIEWER: "ANALYTICS_VIEWER",
  PUBLIC_USER: "PUBLIC_USER",
};

export const PERMISSIONS = {
  READ: "canRead",
  WRITE: "canWrite",
  PUBLISH: "canPublish",
  APPROVE: "canApprove",
  DELETE: "canDelete",
  ARCHIVE: "canArchive",
  UPLOAD: "canUpload",
  MANAGE_USERS: "canManageUsers",
  MANAGE_BILLING: "canManageBilling",
  MANAGE_PROMPTS: "canManagePrompts",
  VIEW_ANALYTICS: "canViewAnalytics",
  EXPORT_DATA: "canExportData",
};

const allPermissions = Object.values(PERMISSIONS).reduce((map, key) => ({ ...map, [key]: true }), {});

export const ROLE_PERMISSIONS = {
  [ROLES.MASTER_ADMIN]: allPermissions,
  [ROLES.PLATFORM_ADMIN]: { ...allPermissions, canManageBilling: false },
  [ROLES.FRANCHISE_OWNER]: {
    canRead: true,
    canWrite: true,
    canPublish: true,
    canApprove: true,
    canArchive: true,
    canUpload: true,
    canManageUsers: true,
    canViewAnalytics: true,
    canExportData: true,
  },
  [ROLES.FRANCHISE_MANAGER]: {
    canRead: true,
    canWrite: true,
    canPublish: true,
    canApprove: true,
    canArchive: true,
    canUpload: true,
    canViewAnalytics: true,
  },
  [ROLES.FRANCHISE_STAFF]: { canRead: true, canWrite: true, canUpload: true },
  [ROLES.CONTENT_EDITOR]: { canRead: true, canWrite: true, canUpload: true },
  [ROLES.MEDIA_MANAGER]: { canRead: true, canWrite: true, canUpload: true, canArchive: true },
  [ROLES.APPROVAL_REVIEWER]: { canRead: true, canApprove: true, canPublish: true },
  [ROLES.ANALYTICS_VIEWER]: { canRead: true, canViewAnalytics: true, canExportData: true },
  [ROLES.PUBLIC_USER]: { canRead: true },
};

export function normalizeRole(role) {
  const value = String(role || "").trim();
  const alias = value.toLowerCase();

  const aliases = {
    admin: ROLES.MASTER_ADMIN,
    super_admin: ROLES.MASTER_ADMIN,
    owner: ROLES.FRANCHISE_OWNER,
    tenant_admin: ROLES.FRANCHISE_OWNER,
    tenant_manager: ROLES.FRANCHISE_MANAGER,
    tenant_staff: ROLES.FRANCHISE_STAFF,
    content_editor: ROLES.CONTENT_EDITOR,
    media_manager: ROLES.MEDIA_MANAGER,
    approval_reviewer: ROLES.APPROVAL_REVIEWER,
    analytics_viewer: ROLES.ANALYTICS_VIEWER,
    platform_admin: ROLES.PLATFORM_ADMIN,
    master_admin: ROLES.MASTER_ADMIN,
    user: ROLES.PUBLIC_USER,
  };

  return aliases[alias] || (ROLE_PERMISSIONS[value] ? value : ROLES.PUBLIC_USER);
}

export function isMasterUser(user) {
  const role = normalizeRole(user?.role);
  return role === ROLES.MASTER_ADMIN || role === ROLES.PLATFORM_ADMIN;
}

export function getUserTenantIds(user) {
  return user?.tenantIds || user?.assignedTenantIds || user?.assignedMuseumIds || [];
}

export function hasPermission(user, permission, record = {}) {
  const role = normalizeRole(user?.role);
  const base = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS[ROLES.PUBLIC_USER];
  const explicit = user?.permissions?.[permission] ?? record?.rolePermissions?.[role]?.[permission];
  return explicit ?? !!base[permission];
}

export function canAccessTenant(user, tenantId) {
  if (isMasterUser(user)) return true;
  if (!tenantId) return false;
  return getUserTenantIds(user).includes(tenantId);
}

export function canReadRecord(user, record) {
  if (record?.publishState === "published" && record?.visibilityScope === "public") return true;
  return canAccessTenant(user, record?.tenantId) && hasPermission(user, PERMISSIONS.READ, record);
}

export function canMutateRecord(user, record, permission = PERMISSIONS.WRITE) {
  return canAccessTenant(user, record?.tenantId) && hasPermission(user, permission, record);
}