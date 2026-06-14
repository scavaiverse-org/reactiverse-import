import { base44 } from "@/api/base44Client";
import { classifyFailure } from "./classifier";
import { createFingerprint, createIssueKey, sanitizeObject, sanitizeText } from "./fingerprints";

export async function recordSentinelEvent(payload) {
  const safe = {
    event_type: payload.event_type || "console_error",
    route: payload.route || (typeof window !== "undefined" ? window.location.pathname : ""),
    component_name: sanitizeText(payload.component_name || "runtime"),
    target_label: sanitizeText(payload.target_label || ""),
    target_selector: sanitizeText(payload.target_selector || ""),
    message: sanitizeText(payload.message || ""),
    metadata: sanitizeObject(payload.metadata || {}),
    severity: payload.severity || "info",
    timestamp: payload.timestamp || new Date().toISOString(),
    test_run_id: payload.test_run_id || "",
    tenant_slug: payload.tenant_slug || extractTenantSlug(payload.route || (typeof window !== "undefined" ? window.location.pathname : ""))
  };
  return base44.entities.QASentinelEvent.create(safe);
}

export async function upsertIssueFromFailure(raw) {
  const route = raw.route || window.location.pathname;
  const fingerprint = raw.fingerprint || createFingerprint({
    route,
    component_name: raw.component_name || "runtime",
    target_label: raw.target_label || raw.cta_label || "",
    message: raw.message || raw.actual_result || raw.title || "",
    issue_type: raw.issue_type || raw.area || "runtime"
  });
  const now = new Date().toISOString();
  const classified = classifyFailure({ ...raw, route });
  const existing = await base44.entities.QASentinelIssue.filter({ fingerprint }, "-last_seen_at", 1);

  if (existing?.length) {
    const issue = existing[0];
    const regressed = issue.status === "fixed";
    const data = {
      status: regressed ? "regressed" : issue.status,
      last_seen_at: now,
      last_verified_at: now,
      occurrence_count: (issue.occurrence_count || 1) + 1,
      regression_count: (issue.regression_count || 0) + (regressed ? 1 : 0),
      severity: raw.severity || issue.severity || classified.severity,
      actual_result: sanitizeText(raw.actual_result || raw.message || issue.actual_result || ""),
      console_errors: raw.console_errors || issue.console_errors || [],
      network_errors: raw.network_errors || issue.network_errors || [],
      root_cause_hypothesis: classified.root_cause_hypothesis,
      fix_summary: classified.fix_summary,
      recommended_fix_steps: classified.recommended_fix_steps,
      likely_files_affected: classified.likely_files_affected,
      likely_components_affected: classified.likely_components_affected,
      risk_level: classified.risk_level,
      fix_complexity: classified.fix_complexity,
      estimated_fix_area: classified.estimated_fix_area,
      regression_test_steps: classified.regression_test_steps,
      verification_command: classified.verification_command,
      safe_to_autofix: false,
      autofix_forbidden_reason: classified.autofix_forbidden_reason,
      developer_notes: classified.developer_notes
    };
    const updated = await base44.entities.QASentinelIssue.update(issue.id, data);
    await recordSentinelEvent({
      event_type: regressed ? "regression_detected" : "issue_updated",
      route,
      message: regressed ? `Regression detected: ${issue.title}` : `Issue updated: ${issue.title}`,
      severity: regressed ? "critical" : "warning",
      metadata: { issue_key: issue.issue_key, fingerprint }
    });
    return updated;
  }

  const issue = {
    issue_key: createIssueKey(fingerprint),
    title: sanitizeText(classified.title),
    description: sanitizeText(classified.description),
    severity: classified.severity,
    status: "open",
    domain: classified.domain,
    area: classified.area,
    route,
    component_name: sanitizeText(raw.component_name || "runtime"),
    cta_label: sanitizeText(raw.cta_label || raw.target_label || ""),
    function_name: sanitizeText(raw.function_name || ""),
    expected_result: sanitizeText(classified.expected_result),
    actual_result: sanitizeText(classified.actual_result),
    human_impact: sanitizeText(classified.human_impact),
    likely_cause: sanitizeText(classified.likely_cause),
    root_cause_hypothesis: sanitizeText(classified.root_cause_hypothesis),
    fix_summary: sanitizeText(classified.fix_summary),
    recommended_fix_steps: classified.recommended_fix_steps || [],
    likely_files_affected: classified.likely_files_affected || [],
    likely_components_affected: classified.likely_components_affected || [],
    risk_level: classified.risk_level || "medium",
    fix_complexity: classified.fix_complexity || "moderate",
    estimated_fix_area: classified.estimated_fix_area || "unknown",
    regression_test_steps: classified.regression_test_steps || [],
    verification_command: sanitizeText(classified.verification_command),
    safe_to_autofix: false,
    autofix_forbidden_reason: sanitizeText(classified.autofix_forbidden_reason),
    developer_notes: sanitizeText(classified.developer_notes),
    reproduction_steps: classified.reproduction_steps,
    evidence: sanitizeObject(raw.evidence || {}),
    console_errors: (raw.console_errors || []).map(sanitizeText),
    network_errors: (raw.network_errors || []).map(sanitizeObject),
    screenshot_url: raw.screenshot_url || "",
    video_url: raw.video_url || "",
    tenant_id: raw.tenant_id || "",
    tenant_slug: raw.tenant_slug || extractTenantSlug(route),
    first_seen_at: now,
    last_seen_at: now,
    last_verified_at: now,
    regression_count: 0,
    occurrence_count: 1,
    test_run_id: raw.test_run_id || "",
    fingerprint
  };
  const created = await base44.entities.QASentinelIssue.create(issue);
  await recordSentinelEvent({ event_type: "issue_created", route, message: `Issue created: ${issue.title}`, severity: issue.severity === "critical" ? "critical" : "warning", metadata: { issue_key: issue.issue_key, fingerprint } });
  return created;
}

export async function markIssueFixed(issue) {
  const now = new Date().toISOString();
  const updated = await base44.entities.QASentinelIssue.update(issue.id, {
    status: "fixed",
    fixed_at: now,
    last_verified_at: now
  });
  await recordSentinelEvent({ event_type: "issue_fixed", route: issue.route, message: `Issue fixed: ${issue.title}`, severity: "info", metadata: { issue_key: issue.issue_key } });
  return updated;
}

export async function ignoreIssue(issue) {
  return base44.entities.QASentinelIssue.update(issue.id, { status: "ignored", last_verified_at: new Date().toISOString() });
}

function extractTenantSlug(route = "") {
  const match = route.match(/\/museum\/([^/]+)/);
  return match?.[1] || "";
}