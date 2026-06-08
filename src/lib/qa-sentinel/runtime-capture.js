import { base44 } from "@/api/base44Client";
import { routeRegistry } from "@/lib/route-registry";
import { importantCtaSelectors, sentinelCheckDefinitions } from "./check-definitions";
import { recordSentinelEvent, upsertIssueFromFailure } from "./issue-lifecycle";

export function detectVisibleCtas(root = document) {
  return Array.from(root.querySelectorAll(importantCtaSelectors)).slice(0, 250).map((element, index) => ({
    label: getElementLabel(element) || `Unlabeled CTA ${index + 1}`,
    selector: getElementSelector(element),
    href: element.getAttribute("href") || "",
    disabled: !!element.disabled || element.getAttribute("aria-disabled") === "true",
    route: window.location.pathname,
    state: element.disabled ? "disabled" : "detected"
  }));
}

export function getElementLabel(element) {
  return (element.getAttribute("aria-label") || element.innerText || element.value || element.title || element.getAttribute("data-sentinel-id") || "").trim().replace(/\s+/g, " ").slice(0, 120);
}

export function getElementSelector(element) {
  if (element.getAttribute("data-sentinel-id")) return `[data-sentinel-id='${element.getAttribute("data-sentinel-id")}']`;
  if (element.getAttribute("data-testid")) return `[data-testid='${element.getAttribute("data-testid")}']`;
  if (element.id) return `#${element.id}`;
  return element.tagName.toLowerCase();
}

export function buildStaticCoverageMap(issues = []) {
  const active = issues.filter((issue) => !["fixed", "ignored"].includes(issue.status));
  return routeRegistry.map((route) => {
    const routeIssues = active.filter((issue) => issue.route === route.path);
    return {
      route: route.path,
      label: route.label,
      domain: route.domain,
      group: route.group,
      critical: !!route.critical,
      last_status: routeIssues.length ? "failing" : "mapped_only",
      open_issue_count: routeIssues.length,
      last_issue_title: routeIssues[0]?.title || "Mapped, not runtime verified"
    };
  });
}

export async function runInAppSentinelScan(runType = "smoke") {
  const started = Date.now();
  const normalizedRunType = ["manual", "scheduled", "live_user", "smoke", "full", "regression"].includes(runType) ? runType : "manual";
  const runId = `sentinel-${runType}-${started}`;
  const route = window.location.pathname;
  const ctas = detectVisibleCtas();
  const enabledChecks = sentinelCheckDefinitions.filter((check) => check.enabled);
  const currentRouteChecks = enabledChecks.filter((check) => check.route === route);

  const run = await base44.entities.QASentinelRun.create({
    run_id: runId,
    run_type: normalizedRunType,
    status: "running",
    started_at: new Date(started).toISOString(),
    routes_tested: runType === "route" || runType === "full" ? routeRegistry.length : currentRouteChecks.length,
    ctas_tested: ctas.length,
    forms_tested: document.querySelectorAll("form").length,
    functions_tested: 0,
    summary: "In-app deterministic Sentinel scan started. Routes not opened by this browser session are marked mapped-only, not passing.",
    coverage_map: { current_route: route, checked_route_status: "runtime_visible", total_registry_routes: routeRegistry.length }
  });

  await recordSentinelEvent({ event_type: "route_visit", route, test_run_id: runId, message: `Sentinel scan started on ${route}`, severity: "info", metadata: { ctas_detected: ctas.length } });

  const blank = document.body.innerText.trim().length < 20;
  if (blank) {
    await upsertIssueFromFailure({ route, test_run_id: runId, message: "Route renders blank or has no visible working interface", issue_type: "blank_page", severity: "critical", component_name: "document" });
  }

  const brokenMedia = Array.from(document.querySelectorAll("img,video")).filter((node) => node.tagName === "IMG" ? node.complete && node.naturalWidth === 0 : node.error);
  if (brokenMedia.length) {
    await upsertIssueFromFailure({ route, test_run_id: runId, message: "Media upload saved but frontend does not render", issue_type: "media_binding", severity: "major", component_name: "media", evidence: { broken_media_count: brokenMedia.length } });
  }

  await Promise.all(ctas.slice(0, 50).map((cta) => recordSentinelEvent({
    event_type: cta.label.toLowerCase().includes("save") ? "save_attempt" : cta.label.toLowerCase().includes("upload") ? "upload_attempt" : "click",
    route,
    target_label: cta.label,
    target_selector: cta.selector,
    message: `CTA detected: ${cta.label}`,
    severity: cta.disabled ? "warning" : "info",
    test_run_id: runId,
    metadata: cta
  })));

  const issues = await base44.entities.QASentinelIssue.filter({ status: "open" }, "-last_seen_at", 500);
  const critical = issues.filter((issue) => issue.severity === "critical").length;
  const major = issues.filter((issue) => issue.severity === "major").length;
  const minor = issues.filter((issue) => issue.severity === "minor").length;
  const finished = Date.now();
  return base44.entities.QASentinelRun.update(run.id, {
    status: critical ? "failed" : major ? "partial" : "passed",
    finished_at: new Date(finished).toISOString(),
    duration_ms: finished - started,
    issues_found: issues.length,
    critical_count: critical,
    major_count: major,
    minor_count: minor,
    summary: `In-app scan completed. ${ctas.length} CTAs detected on current route. Registry routes remain mapped-only until runtime verified.`,
    coverage_map: { current_route: route, ctas, registry_routes: routeRegistry.length, mapped_only_routes: routeRegistry.length - 1 }
  });
}