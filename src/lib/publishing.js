export const PUBLISH_STATES = {
  DRAFT: "draft",
  PENDING_REVIEW: "pending_review",
  APPROVED: "approved",
  SCHEDULED: "scheduled",
  PUBLISHED: "published",
  HIDDEN: "hidden",
  ARCHIVED: "archived",
  REJECTED: "rejected",
};

export const PUBLIC_RENDER_STATES = [PUBLISH_STATES.PUBLISHED];

export const ADMIN_RENDER_STATES = Object.values(PUBLISH_STATES);

export function isPublicRenderable(record) {
  return record?.publishState === PUBLISH_STATES.PUBLISHED && !record?.deletedAt && !record?.archivedAt;
}

export function createOwnershipFields({ tenantId, ownerId, userId, visibilityScope = "tenant", publishState = PUBLISH_STATES.DRAFT } = {}) {
  const now = new Date().toISOString();
  return {
    tenantId,
    ownerId: ownerId || userId || "",
    visibilityScope,
    rolePermissions: {},
    publishState,
    createdBy: userId || "",
    updatedBy: userId || "",
    approvedBy: "",
    createdAt: now,
    updatedAt: now,
    deletedAt: "",
    archivedAt: "",
  };
}

export function nextPublishState(currentState, action) {
  const transitions = {
    save_draft: PUBLISH_STATES.DRAFT,
    submit_review: PUBLISH_STATES.PENDING_REVIEW,
    approve: PUBLISH_STATES.APPROVED,
    schedule: PUBLISH_STATES.SCHEDULED,
    publish: PUBLISH_STATES.PUBLISHED,
    hide: PUBLISH_STATES.HIDDEN,
    archive: PUBLISH_STATES.ARCHIVED,
    reject: PUBLISH_STATES.REJECTED,
    rollback: PUBLISH_STATES.PUBLISHED,
  };
  return transitions[action] || currentState || PUBLISH_STATES.DRAFT;
}

export function buildRevisionSnapshot(record, versionNumber = 1, changeSummary = "Snapshot created") {
  return {
    tenantId: record?.tenantId || "",
    ownerId: record?.ownerId || "",
    targetEntity: record?.entityName || record?.targetEntity || "Unknown",
    targetId: record?.id || record?.targetId || "",
    versionNumber,
    snapshot: record || {},
    diff: {},
    changeSummary,
    restorePoint: true,
    visibilityScope: record?.visibilityScope || "tenant",
    publishState: record?.publishState || PUBLISH_STATES.DRAFT,
    createdBy: record?.updatedBy || record?.createdBy || "",
    updatedBy: record?.updatedBy || record?.createdBy || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}