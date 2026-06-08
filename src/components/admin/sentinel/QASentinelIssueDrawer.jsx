import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function QASentinelIssueDrawer({ issue, onClose, onMarkFixed, onIgnore, onRetest }) {
  if (!issue) return null;
  return (
    <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <aside className="ml-auto h-full w-full max-w-2xl overflow-y-auto border-l border-white/10 bg-background p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-primary">{issue.issue_key}</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-foreground">{issue.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{issue.description}</p>
          </div>
          <button onClick={onClose} className="rounded-full border border-white/10 p-2 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <Button onClick={() => onRetest(issue)}>Retest</Button>
          <Button variant="secondary" onClick={() => onMarkFixed(issue)}>Mark fixed</Button>
          <Button variant="outline" onClick={() => onIgnore(issue)}>Ignore</Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Info label="Severity" value={issue.severity} />
          <Info label="Status" value={issue.status} />
          <Info label="Route" value={issue.route} />
          <Info label="Component" value={issue.component_name || "—"} />
          <Info label="CTA / Function" value={issue.cta_label || issue.function_name || "—"} />
          <Info label="Tenant" value={issue.tenant_slug || issue.tenant_id || "—"} />
          <Info label="First seen" value={formatDate(issue.first_seen_at)} />
          <Info label="Last seen" value={formatDate(issue.last_seen_at)} />
        </div>

        <Detail label="Human impact" value={issue.human_impact} />
        <Detail label="Expected result" value={issue.expected_result} />
        <Detail label="Actual result" value={issue.actual_result} />
        <Detail label="Suggested fix / likely cause" value={issue.likely_cause} />

        <section className="mt-6 rounded-2xl border border-primary/15 bg-primary/[0.04] p-4">
          <h3 className="font-display text-xl font-bold text-foreground">Suggested Fix</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Info label="Fix Complexity" value={issue.fix_complexity || "—"} />
            <Info label="Risk Level" value={issue.risk_level || "—"} />
            <Info label="Fix Area" value={issue.estimated_fix_area || "—"} />
            <Info label="Safe to Autofix" value={issue.safe_to_autofix ? "Yes" : "No"} />
          </div>
          <Detail label="Root Cause Hypothesis" value={issue.root_cause_hypothesis} />
          <Detail label="Fix Summary" value={issue.fix_summary} />
          <Detail label="Recommended Fix Steps" value={(issue.recommended_fix_steps || []).join("\n")} pre />
          <Detail label="Likely Files Affected" value={(issue.likely_files_affected || []).join("\n")} pre />
          <Detail label="Likely Components Affected" value={(issue.likely_components_affected || []).join("\n")} pre />
          <Detail label="Regression Test Steps" value={(issue.regression_test_steps || []).join("\n")} pre />
          <Detail label="Verification Steps" value={issue.verification_command} />
          <Detail label="Autofix Safety Note" value={issue.autofix_forbidden_reason} />
        </section>

        <Detail label="Reproduction steps" value={(issue.reproduction_steps || []).join("\n")} pre />
        <Detail label="Console errors" value={(issue.console_errors || []).join("\n")} pre />
        <Detail label="Network errors" value={JSON.stringify(issue.network_errors || [], null, 2)} pre />
        {(issue.screenshot_url || issue.video_url) && <Detail label="Evidence" value={issue.screenshot_url || issue.video_url} />}
      </aside>
    </div>
  );
}

function Info({ label, value }) {
  return <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3"><p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p><p className="mt-1 break-words text-sm text-foreground">{value}</p></div>;
}

function Detail({ label, value, pre }) {
  if (!value) return null;
  return <div className="mt-4 rounded-xl border border-white/8 bg-black/15 p-4"><p className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>{pre ? <pre className="whitespace-pre-wrap text-xs text-foreground/80">{value}</pre> : <p className="text-sm text-foreground/80">{value}</p>}</div>;
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : "—";
}