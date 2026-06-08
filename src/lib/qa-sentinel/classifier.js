import { sanitizeText } from "./fingerprints";
import { buildFixIntelligence } from "./fix-intelligence";

const RULES = [
  { match: /blank|white screen|no visible/i, severity: "critical", area: "render", title: "Route renders a blank or unusable page", impact: "Users cannot continue because the page interface is not visible." },
  { match: /save|persist/i, severity: "critical", area: "data_persistence", title: "Save action failed to persist data", impact: "Admins may believe changes were saved when they were not." },
  { match: /publish/i, severity: "critical", area: "publishing", title: "Publish action failed", impact: "Live museum content may not match approved admin changes." },
  { match: /tenant.*leak|wrong tenant|tenant isolation/i, severity: "critical", area: "tenant_isolation", title: "Tenant isolation failure detected", impact: "Content or admin state may appear under the wrong tenant." },
  { match: /permission|forbidden|401|403/i, severity: "critical", area: "permission", title: "Permission failure detected", impact: "A protected flow is blocked or access control may be misconfigured." },
  { match: /upload|media|image|video/i, severity: "major", area: "media_binding", title: "Media binding or upload failure detected", impact: "Saved media may not render correctly for visitors." },
  { match: /button|click|cta|link/i, severity: "major", area: "cta", title: "CTA interaction failure detected", impact: "A user action appears clickable but may not complete the expected flow." },
  { match: /network|api|fetch|500|404/i, severity: "major", area: "api", title: "API or network failure detected", impact: "The page may not load or save data reliably." },
  { match: /slow|loader|loading/i, severity: "major", area: "performance", title: "Page appears stuck or slow", impact: "Users may abandon the flow before it completes." },
  { match: /route|redirect/i, severity: "major", area: "routing", title: "Route or redirect failure detected", impact: "Users may land on the wrong page or a dead end." }
];

export function classifyFailure(input = {}) {
  const message = sanitizeText(input.message || input.actual_result || input.title || "Runtime issue detected");
  const rule = RULES.find((item) => item.match.test(message));
  const fallback = {
    severity: input.severity || "warning",
    area: input.area || "runtime",
    title: input.title || "Runtime issue detected",
    human_impact: "A runtime behavior changed and needs verification."
  };
  const selected = rule || fallback;
  const classified = {
    severity: input.severity || selected.severity,
    domain: input.domain || inferDomain(input.route),
    area: input.area || selected.area,
    title: input.title || selected.title,
    description: message,
    human_impact: input.human_impact || selected.impact || fallback.human_impact,
    likely_cause: input.likely_cause || inferLikelyCause(selected.area),
    expected_result: input.expected_result || "The interaction should complete without runtime, routing, network, permission, or persistence errors.",
    actual_result: input.actual_result || message,
    reproduction_steps: input.reproduction_steps || [
      `Open ${input.route || "the affected route"}`,
      input.target_label ? `Interact with ${input.target_label}` : "Repeat the captured user action",
      "Observe the reported failure"
    ]
  };
  return { ...classified, ...buildFixIntelligence({ ...input, ...classified }) };
}

function inferDomain(route = "") {
  if (route.startsWith("/platform/admin")) return "master_admin";
  if (/\/museum\/[^/]+\/admin/.test(route)) return "tenant_admin";
  if (route.startsWith("/museum/")) return "public_museum";
  if (route.startsWith("/platform")) return "platform";
  return "system";
}

function inferLikelyCause(area) {
  const causes = {
    render: "Component render error, missing data guard, or broken import.",
    data_persistence: "Save handler, entity schema, mutation invalidation, or permission mismatch.",
    publishing: "Publish mutation, mirror contract, or frontend/backend content binding mismatch.",
    tenant_isolation: "Missing tenant filter or fallback tenant masking a routing error.",
    permission: "Role gate or auth state mismatch.",
    media_binding: "Admin media field saved but not read by the frontend renderer.",
    cta: "Click handler, route target, disabled state, or missing feedback path.",
    api: "Failed backend request or entity/API contract mismatch.",
    routing: "Route registry, App route, redirect, or sidebar link mismatch."
  };
  return causes[area] || "Needs deterministic retest against the affected UI flow.";
}