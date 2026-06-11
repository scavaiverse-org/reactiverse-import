// Mirrors src/lib/rbac.js — canonical roles + legacy alias normalization.
// Edge functions must compare against canonical names only; getAuthUser
// normalizes whatever is stored in profiles.role through normalizeRole.

export const ROLES = {
  MASTER_ADMIN: 'MASTER_ADMIN',
  PLATFORM_ADMIN: 'PLATFORM_ADMIN',
  FRANCHISE_OWNER: 'FRANCHISE_OWNER',
  FRANCHISE_MANAGER: 'FRANCHISE_MANAGER',
  FRANCHISE_STAFF: 'FRANCHISE_STAFF',
  CONTENT_EDITOR: 'CONTENT_EDITOR',
  MEDIA_MANAGER: 'MEDIA_MANAGER',
  APPROVAL_REVIEWER: 'APPROVAL_REVIEWER',
  ANALYTICS_VIEWER: 'ANALYTICS_VIEWER',
  PUBLIC_USER: 'PUBLIC_USER',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

const CANONICAL = new Set<string>(Object.values(ROLES));

const ALIASES: Record<string, Role> = {
  admin: ROLES.MASTER_ADMIN,
  super_admin: ROLES.MASTER_ADMIN,
  master_admin: ROLES.MASTER_ADMIN,
  platform_admin: ROLES.PLATFORM_ADMIN,
  owner: ROLES.FRANCHISE_OWNER,
  tenant_admin: ROLES.FRANCHISE_OWNER,
  tenant_manager: ROLES.FRANCHISE_MANAGER,
  tenant_staff: ROLES.FRANCHISE_STAFF,
  content_editor: ROLES.CONTENT_EDITOR,
  media_manager: ROLES.MEDIA_MANAGER,
  approval_reviewer: ROLES.APPROVAL_REVIEWER,
  analytics_viewer: ROLES.ANALYTICS_VIEWER,
  user: ROLES.PUBLIC_USER,
  visitor: ROLES.PUBLIC_USER,
};

export function normalizeRole(role: unknown): Role {
  const value = String(role || '').trim();
  const alias = value.toLowerCase();
  if (ALIASES[alias]) return ALIASES[alias];
  const upper = value.toUpperCase();
  if (CANONICAL.has(upper)) return upper as Role;
  return ROLES.PUBLIC_USER;
}

// Platform-level admins (mirrors isMasterUser in src/lib/rbac.js).
export const MASTER_ROLES: Role[] = [ROLES.MASTER_ADMIN, ROLES.PLATFORM_ADMIN];

// Roles allowed to run tenant content generation/QA tooling.
export const TENANT_ADMIN_ROLES: Role[] = [...MASTER_ROLES, ROLES.FRANCHISE_OWNER];
