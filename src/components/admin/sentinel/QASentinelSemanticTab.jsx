import QASentinelIssueTable from "./QASentinelIssueTable";
import { semanticTabIssues } from "@/lib/qa-sentinel/verbatim-export";

const DESCRIPTIONS = {
  "Runtime Truth": "Live runtime reality: console errors, failed API calls, dead clicks, blank renders, save failures, broken uploads, and runtime exceptions.",
  "Structural Intelligence": "Deterministic architecture integrity: route coverage, guards, tenant filters, redirects, entity bindings, cache invalidation, and frontend/backend divergence.",
  "Semantic Impact": "Operational impact: silent failures, trust damage, workflow disruption, tenant isolation risk, museum experience degradation, and regression severity."
};

export default function QASentinelSemanticTab({ tab, issues = [], onSelectIssue }) {
  const rows = semanticTabIssues(issues, tab);
  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">{tab}</p>
        <h2 className="mt-2 font-display text-2xl font-bold text-foreground">{tab}</h2>
        <p className="mt-2 max-w-4xl text-sm text-muted-foreground">{DESCRIPTIONS[tab] || "QA Sentinel semantic analysis view."}</p>
        <p className="mt-3 text-xs text-muted-foreground">Issue-only view. Healthy checks, passing routes, and working CTAs are excluded.</p>
      </div>
      <QASentinelIssueTable issues={rows} onSelectIssue={onSelectIssue} />
    </section>
  );
}