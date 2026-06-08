import { Route } from "lucide-react";

const tone = {
  passing: "text-emerald-300 bg-emerald-400/10 border-emerald-400/25",
  failing: "text-red-300 bg-red-400/10 border-red-400/25",
  redirecting: "text-cyan-300 bg-cyan-400/10 border-cyan-400/25",
  permission_blocked: "text-orange-300 bg-orange-400/10 border-orange-400/25",
  blank: "text-red-300 bg-red-400/10 border-red-400/25",
  slow: "text-amber-300 bg-amber-400/10 border-amber-400/25",
  mapped_only: "text-slate-300 bg-slate-400/10 border-slate-400/20",
  untested: "text-muted-foreground bg-white/[0.03] border-white/10"
};

export default function QASentinelRouteMatrix({ rows = [], title = "Route Matrix" }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground"><Route className="h-4 w-4 text-cyan-400" /> {title}</p>
        <p className="text-xs text-muted-foreground">Mapped routes are not marked passing unless runtime-verified.</p>
      </div>
      <div className="overflow-hidden rounded-xl border border-white/8">
        <div className="grid grid-cols-12 gap-2 border-b border-white/8 bg-black/20 px-3 py-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          <span className="col-span-4">Route</span><span className="col-span-2">Domain</span><span className="col-span-2">Group</span><span className="col-span-2">Status</span><span className="col-span-2">Issue</span>
        </div>
        <div className="max-h-[520px] overflow-y-auto">
          {rows.map((row, index) => (
            <div key={buildRouteRowKey(row, index)} className="grid grid-cols-12 gap-2 border-b border-white/5 px-3 py-2 text-xs">
              <span className="col-span-4 min-w-0"><span className="block truncate text-foreground">{row.label}</span><span className="block truncate text-muted-foreground">{row.route || row.path}</span></span>
              <span className="col-span-2 text-muted-foreground">{row.domain}</span>
              <span className="col-span-2 text-muted-foreground">{row.group || "Admin"}</span>
              <span className="col-span-2"><span className={`rounded-full border px-2 py-1 text-[10px] ${tone[row.last_status] || tone.untested}`}>{row.last_status || "untested"}</span></span>
              <span className="col-span-2 truncate text-muted-foreground">{row.last_issue_title || `${row.open_issue_count || 0} open`}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function buildRouteRowKey(row, index) {
  if (row.id) return [row.id, row.route || row.path || "path-none", index].join("::");
  return [
    row.route || row.path || "path-none",
    row.label || "label-none",
    row.domain || "domain-none",
    row.group || "group-none",
    row.last_status || "status-none",
    row.fingerprint || "fingerprint-none",
    index
  ].join("::");
}