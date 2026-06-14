import { AlertTriangle, ArrowUpRight, Bug } from "lucide-react";

const severityClass = {
  critical: "bg-red-500/15 text-red-300 border-red-400/30",
  major: "bg-orange-500/15 text-orange-300 border-orange-400/30",
  minor: "bg-blue-500/15 text-blue-300 border-blue-400/30",
  warning: "bg-amber-500/15 text-amber-300 border-amber-400/30",
  info: "bg-cyan-500/15 text-cyan-300 border-cyan-400/30"
};

export default function QASentinelIssueTable({ issues = [], title = "Live Issue Feed", filter, onSelectIssue }) {
  const visible = filter ? issues.filter(filter) : issues;
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground"><Bug className="h-4 w-4 text-primary" /> {title}</p>
          <p className="text-xs text-muted-foreground">Newest active issues update through Base44 realtime subscriptions.</p>
        </div>
        <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] text-muted-foreground">{visible.length} shown</span>
      </div>
      <div className="overflow-hidden rounded-xl border border-white/8">
        <div className="grid grid-cols-12 gap-2 border-b border-white/8 bg-black/20 px-3 py-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          <span className="col-span-5">Issue</span><span className="col-span-2">Severity</span><span className="col-span-2">Status</span><span className="col-span-3">Route</span>
        </div>
        <div className="max-h-[440px] overflow-y-auto">
          {visible.length === 0 && <p className="p-5 text-sm text-muted-foreground">No matching issues.</p>}
          {visible.map((issue) => (
            <button key={issue.id} onClick={() => onSelectIssue?.(issue)} className="grid w-full grid-cols-12 gap-2 border-b border-white/5 px-3 py-3 text-left transition-colors hover:bg-white/[0.04]">
              <span className="col-span-5 min-w-0">
                <span className="flex items-center gap-2 text-sm font-medium text-foreground"><AlertTriangle className="h-3.5 w-3.5 text-primary" /> <span className="truncate">{issue.title}</span></span>
                <span className="mt-1 block truncate text-[10px] text-muted-foreground">{issue.human_impact || issue.description}</span>
              </span>
              <span className="col-span-2"><span className={`inline-flex rounded-full border px-2 py-1 text-[10px] ${severityClass[issue.severity] || severityClass.warning}`}>{issue.severity}</span></span>
              <span className="col-span-2 text-xs text-muted-foreground">{issue.status}</span>
              <span className="col-span-3 flex min-w-0 items-center gap-1 truncate text-xs text-muted-foreground">{issue.route}<ArrowUpRight className="h-3 w-3" /></span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}