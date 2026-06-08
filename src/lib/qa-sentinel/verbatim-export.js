const SEVERITY_ORDER = { critical: 5, major: 4, minor: 3, warning: 2, info: 1 };
const EXPORT_TABS = ["Runtime Truth", "Structural Intelligence", "Semantic Impact"];
const SENSITIVE_PATTERNS = [
  [/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, maskEmail],
  [/(password|token|api[_-]?key|secret|authorization|bearer)\s*[:=]\s*[^\s,}\]]+/gi, "$1: [MASKED]"],
  [/\b(?:\d[ -]*?){13,19}\b/g, "[MASKED_PAYMENT_DATA]"]
];

export function buildVerbatimExport({ issues = [], events = [], runs = [], exportType = "json", filters = {}, previousExports = [] }) {
  const started = performance.now();
  const filteredIssues = applyFilters(issues, filters);
  const canonicalIssues = groupIssues(filteredIssues).map((group) => buildCanonicalIssue(group, events, runs));
  canonicalIssues.sort(compareForensicIssues);

  const counts = countIssues(canonicalIssues);
  const stableMetadata = {
    export_type: exportType,
    issue_count: canonicalIssues.length,
    critical_count: counts.critical,
    major_count: counts.major,
    minor_count: counts.minor,
    warning_count: counts.warning,
    regression_count: counts.regressed,
    included_tabs: EXPORT_TABS,
    filters,
    version: "qa-verbatim-export-v1"
  };
  const stablePayload = { export_metadata: stableMetadata, issues: canonicalIssues };
  const stableBlob = exportType === "markdown" ? toMarkdown(stablePayload) : exportType === "txt" ? toTxt(stablePayload) : JSON.stringify(stablePayload, null, 2);
  const checksum = checksumFor(maskSensitive(stableBlob).slice(0, 900000));
  const reusable = previousExports.find((item) => item.export_type === exportType && item.checksum === checksum);
  const metadata = {
    export_id: `qa-export-${Date.now()}`,
    created_at: new Date().toISOString(),
    ...stableMetadata,
    checksum
  };
  const payload = { export_metadata: metadata, issues: canonicalIssues };
  const blob = exportType === "markdown" ? toMarkdown(payload) : exportType === "txt" ? toTxt(payload) : JSON.stringify(payload, null, 2);
  const safeBlob = maskSensitive(blob).slice(0, 900000);
  const duration = Math.round(performance.now() - started);

  return {
    metadata: { ...metadata, export_size: safeBlob.length, export_duration_ms: duration, reused_export_id: reusable?.export_id || "" },
    blob: safeBlob,
    checksum,
    reused: !!reusable
  };
}

function applyFilters(issues, filters) {
  return issues.filter((issue) => {
    if (filters.criticalOnly && issue.severity !== "critical") return false;
    if (filters.regressionOnly && issue.status !== "regressed" && !(issue.regression_count > 0)) return false;
    if (filters.openOnly && ["fixed", "ignored"].includes(issue.status)) return false;
    if (filters.severity && issue.severity !== filters.severity) return false;
    if (filters.status && issue.status !== filters.status) return false;
    if (filters.route && !String(issue.route || "").includes(filters.route)) return false;
    if (filters.tenant && !String(issue.tenant_slug || issue.tenant_id || "").includes(filters.tenant)) return false;
    if (filters.domain && issue.domain !== filters.domain) return false;
    if (filters.component && !String(issue.component_name || "").includes(filters.component)) return false;
    if (filters.runId && issue.test_run_id !== filters.runId) return false;
    if (filters.tabOrigin && !belongsToTab(issue, filters.tabOrigin)) return false;
    if (filters.dateFrom && new Date(issue.last_seen_at || issue.created_date || 0) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && new Date(issue.last_seen_at || issue.created_date || 0) > new Date(filters.dateTo)) return false;
    return true;
  });
}

export function belongsToTab(issue, tab) {
  const text = [issue.area, issue.title, issue.description, issue.actual_result, issue.likely_cause, issue.estimated_fix_area].filter(Boolean).join(" ").toLowerCase();
  if (tab === "Runtime Truth") return /console|network|api|runtime|blank|save|loader|upload|click|render|fetch|realtime|exception|persistence/.test(text);
  if (tab === "Structural Intelligence") return /route|redirect|guard|tenant|binding|sidebar|orphan|legacy|frontend|backend|schema|cache|permission|architecture|structural|data_persistence/.test(text);
  if (tab === "Semantic Impact") return /impact|trust|confusion|business|workflow|tenant|museum|silent|regression|risk|credibility|conversion|human/.test(text) || !!issue.human_impact;
  return true;
}

export function semanticTabIssues(issues, tab) {
  return issues.filter((issue) => belongsToTab(issue, tab));
}

export function buildCanonicalIssueExport({ issues = [], events = [], filters = {}, exportType = "json", createdBy = "" }) {
  const result = buildVerbatimExport({ issues, events, runs: [], exportType, filters });
  const exportBlob = result.blob;
  return {
    payload: { export_metadata: { ...result.metadata, created_by: createdBy } },
    export_blob: exportBlob,
    byte_size: new Blob([exportBlob]).size,
    max_size_bytes: 1000000
  };
}

export function downloadExport(content, exportType = "json") {
  const filename = `qa-sentinel-export.${exportType === "markdown" ? "md" : exportType}`;
  const mime = exportType === "json" ? "application/json" : "text/plain;charset=utf-8";
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function groupIssues(issues) {
  const map = new Map();
  issues.forEach((issue) => {
    const key = issue.fingerprint || [issue.route, issue.component_name, issue.area, issue.cta_label, issue.actual_result || issue.title].filter(Boolean).join("|");
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(issue);
  });
  return Array.from(map.values());
}

function buildCanonicalIssue(group, events, runs) {
  const canonical = group.sort(compareRawIssues)[0];
  const relatedEvents = events.filter((event) => event.route === canonical.route || event.test_run_id === canonical.test_run_id || (canonical.cta_label && event.target_label === canonical.cta_label));
  const relatedRuns = runs.filter((run) => run.run_id === canonical.test_run_id || (canonical.status === "regressed" && run.run_type === "regression"));
  return {
    canonical_issue: sanitizeObject(canonical),
    runtime_truth: sanitizeObject({
      title: canonical.title,
      description: canonical.description,
      actual_result: canonical.actual_result,
      console_errors: canonical.console_errors || [],
      network_errors: canonical.network_errors || [],
      route: canonical.route,
      component_name: canonical.component_name,
      cta_label: canonical.cta_label,
      runtime_signature: canonical.fingerprint,
      manifestations: group.map(sanitizeObject)
    }),
    structural_intelligence: sanitizeObject({
      route: canonical.route,
      domain: canonical.domain,
      area: canonical.area,
      component_name: canonical.component_name,
      function_name: canonical.function_name,
      likely_cause: canonical.likely_cause,
      estimated_fix_area: canonical.estimated_fix_area,
      likely_files_affected: canonical.likely_files_affected || [],
      likely_components_affected: canonical.likely_components_affected || []
    }),
    semantic_impact: sanitizeObject({
      human_impact: canonical.human_impact,
      risk_level: canonical.risk_level,
      severity: canonical.severity,
      status: canonical.status,
      occurrence_count: canonical.occurrence_count,
      regression_count: canonical.regression_count
    }),
    fix_intelligence: sanitizeObject({
      root_cause_hypothesis: canonical.root_cause_hypothesis,
      fix_summary: canonical.fix_summary,
      recommended_fix_steps: canonical.recommended_fix_steps || [],
      fix_complexity: canonical.fix_complexity,
      verification_command: canonical.verification_command,
      regression_test_steps: canonical.regression_test_steps || [],
      safe_to_autofix: canonical.safe_to_autofix,
      autofix_forbidden_reason: canonical.autofix_forbidden_reason,
      developer_notes: canonical.developer_notes
    }),
    runtime_events: relatedEvents.sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0)).map(sanitizeObject),
    regression_history: sanitizeObject({
      fixed_at: canonical.fixed_at || "",
      reopened_at: canonical.status === "regressed" ? canonical.last_seen_at : "",
      regression_count: canonical.regression_count || 0,
      regression_timeline: relatedRuns.map(sanitizeObject)
    }),
    evidence: sanitizeObject({
      evidence: canonical.evidence || {},
      screenshot_url: canonical.screenshot_url || "",
      video_url: canonical.video_url || ""
    })
  };
}

function compareForensicIssues(a, b) {
  return compareRawIssues(a.canonical_issue, b.canonical_issue);
}

function compareRawIssues(a, b) {
  return (SEVERITY_ORDER[b.severity] || 0) - (SEVERITY_ORDER[a.severity] || 0)
    || new Date(b.last_seen_at || 0) - new Date(a.last_seen_at || 0)
    || (b.occurrence_count || 0) - (a.occurrence_count || 0);
}

function countIssues(items) {
  return items.reduce((acc, item) => {
    const issue = item.canonical_issue || item;
    acc[issue.severity] = (acc[issue.severity] || 0) + 1;
    if (issue.status === "regressed" || issue.regression_count > 0) acc.regressed += 1;
    return acc;
  }, { critical: 0, major: 0, minor: 0, warning: 0, info: 0, regressed: 0 });
}

function toMarkdown(payload) {
  return payload.issues.map((item) => {
    const issue = item.canonical_issue;
    return [`# ISSUE — ${issue.title || "Untitled issue"}`,
      `Severity: ${issue.severity || ""}`,
      `Status: ${issue.status || ""}`,
      `Fingerprint: ${issue.fingerprint || ""}`,
      `Route: ${issue.route || ""}`,
      "", "## Runtime Truth", dump(item.runtime_truth),
      "", "## Structural Intelligence", dump(item.structural_intelligence),
      "", "## Semantic Impact", dump(item.semantic_impact),
      "", "## Fix Intelligence", dump(item.fix_intelligence),
      "", "## Runtime Events", dump(item.runtime_events),
      "", "## Regression History", dump(item.regression_history),
      "", "## Evidence", dump(item.evidence),
      "", "## Reproduction Steps", dump(issue.reproduction_steps || []),
      "", "## Timestamps", `first_seen_at: ${issue.first_seen_at || ""}\nlast_seen_at: ${issue.last_seen_at || ""}\nlast_verified_at: ${issue.last_verified_at || ""}`
    ].join("\n");
  }).join("\n\n---\n\n");
}

function toTxt(payload) {
  return payload.issues.map((item) => {
    const issue = item.canonical_issue;
    return [`ISSUE — ${issue.title || "Untitled issue"}`,
      `Severity: ${issue.severity || ""}`,
      `Status: ${issue.status || ""}`,
      `Fingerprint: ${issue.fingerprint || ""}`,
      `Route: ${issue.route || ""}`,
      "", "Runtime Truth", dump(item.runtime_truth),
      "", "Structural Intelligence", dump(item.structural_intelligence),
      "", "Semantic Impact", dump(item.semantic_impact),
      "", "Fix Intelligence", dump(item.fix_intelligence),
      "", "Runtime Events", dump(item.runtime_events),
      "", "Regression History", dump(item.regression_history),
      "", "Evidence", dump(item.evidence),
      "", "Reproduction Steps", dump(issue.reproduction_steps || []),
      "", "Timestamps", `first_seen_at: ${issue.first_seen_at || ""}\nlast_seen_at: ${issue.last_seen_at || ""}\nlast_verified_at: ${issue.last_verified_at || ""}`
    ].join("\n");
  }).join("\n\n==============================\n\n");
}

function dump(value) {
  return typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

function sanitizeObject(value) {
  return JSON.parse(maskSensitive(JSON.stringify(value || {}, null, 2)));
}

function maskSensitive(text) {
  return SENSITIVE_PATTERNS.reduce((current, [pattern, replacement]) => current.replace(pattern, replacement), String(text || ""));
}

function maskEmail(email) {
  const [name, domain] = email.split("@");
  return `${name.slice(0, 2)}***@${domain}`;
}

export function checksumFor(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return `fnv1a-${(hash >>> 0).toString(16)}`;
}