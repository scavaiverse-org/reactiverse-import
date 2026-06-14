export const AUDIT_ACTIONS = {
  UPLOAD: "upload",
  EDIT: "edit",
  DELETE: "delete",
  APPROVE: "approve",
  REJECT: "reject",
  ARCHIVE: "archive",
  RESTORE: "restore",
  PUBLISH: "publish",
  ROLLBACK: "rollback",
  AI_GENERATE: "ai_generate",
  PROMPT_EXECUTE: "prompt_execute",
  PERMISSION_CHANGE: "permission_change",
};

export function buildAuditRecord({ user, tenantId, action, targetType, targetId, targetName, beforeState, afterState, details, severity = "info" }) {
  return {
    user_id: user?.id || "",
    user_name: user?.full_name || user?.email || "System",
    action,
    target_type: targetType,
    target_id: targetId || "",
    target_name: targetName || "",
    details: details || "",
    metadata: {
      tenantId: tenantId || null,
      beforeState: beforeState || null,
      afterState: afterState || null,
    },
    timestamp: new Date().toISOString(),
    severity,
  };
}