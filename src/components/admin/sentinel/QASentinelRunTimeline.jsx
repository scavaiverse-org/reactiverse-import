import { Clock, PlayCircle } from "lucide-react";

export default function QASentinelRunTimeline({ runs = [] }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground"><PlayCircle className="h-4 w-4 text-primary" /> Test Run Timeline</p>
        <p className="text-xs text-muted-foreground">Manual, smoke, route, CTA, tenant, full, and regression runs.</p>
      </div>
      <div className="space-y-3">
        {runs.length === 0 && <p className="text-sm text-muted-foreground">No Sentinel runs yet.</p>}
        {runs.map((run) => (
          <div key={run.id || run.run_id} className="rounded-xl border border-white/8 bg-black/15 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">{run.run_type} · {run.status}</p>
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><Clock className="h-3 w-3" /> {run.started_at ? new Date(run.started_at).toLocaleString() : "—"}</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{run.summary}</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs sm:grid-cols-6">
              <Metric label="Routes" value={run.routes_tested || 0} />
              <Metric label="CTAs" value={run.ctas_tested || 0} />
              <Metric label="Forms" value={run.forms_tested || 0} />
              <Metric label="Issues" value={run.issues_found || 0} />
              <Metric label="Critical" value={run.critical_count || 0} />
              <Metric label="Major" value={run.major_count || 0} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Metric({ label, value }) {
  return <div className="rounded-lg border border-white/8 bg-white/[0.03] p-2"><p className="font-semibold text-foreground">{value}</p><p className="text-[10px] text-muted-foreground">{label}</p></div>;
}