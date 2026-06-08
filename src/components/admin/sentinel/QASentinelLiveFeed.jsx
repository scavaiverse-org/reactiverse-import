import { Activity, AlertTriangle, CheckCircle2, MousePointerClick, Radio } from "lucide-react";

const iconMap = {
  issue_created: AlertTriangle,
  issue_fixed: CheckCircle2,
  click: MousePointerClick,
  save_attempt: MousePointerClick,
  api_error: AlertTriangle,
  console_error: AlertTriangle,
  render_error: AlertTriangle
};

export default function QASentinelLiveFeed({ events = [] }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground"><Radio className="h-4 w-4 text-emerald-400" /> Live Runtime Feed</p>
          <p className="text-xs text-muted-foreground">Route visits, clicks, form submits, API failures, runtime errors, and issue lifecycle events.</p>
        </div>
        <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-[10px] text-emerald-300">latest 100</span>
      </div>
      <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
        {events.length === 0 && <p className="rounded-xl border border-white/8 bg-black/10 p-4 text-sm text-muted-foreground">No live events captured yet.</p>}
        {events.map((event) => {
          const Icon = iconMap[event.event_type] || Activity;
          return (
            <div key={event.id || `${event.timestamp}-${event.message}`} className="rounded-xl border border-white/8 bg-black/15 p-3">
              <div className="flex items-start gap-3">
                <Icon className={`mt-0.5 h-4 w-4 ${event.severity === "critical" ? "text-red-400" : event.severity === "warning" ? "text-amber-400" : "text-cyan-400"}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">{event.event_type}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(event.timestamp || event.created_date).toLocaleString()}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{event.message || event.target_label || "Event captured"}</p>
                  <p className="mt-1 truncate text-[10px] text-muted-foreground/70">{event.route}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}