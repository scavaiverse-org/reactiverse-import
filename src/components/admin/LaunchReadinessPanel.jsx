import { AlertTriangle, CheckCircle2, Clock, Rocket } from "lucide-react";
import { calculateTenantReadiness } from "@/lib/readiness";

export default function LaunchReadinessPanel({ tenant, moduleConfigs = [], experienceConfig, assets = [], tickets = [], vendors = [], events = [], compact = false }) {
  const readiness = calculateTenantReadiness({ tenant, moduleConfigs, experienceConfig, assets, tickets, vendors, events });

  return (
    <div className="rounded-xl border border-primary/15 bg-white/[0.03] p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-xs font-semibold text-foreground flex items-center gap-2">
            <Rocket className="w-3.5 h-3.5 text-primary" />Launch Readiness
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">{tenant?.name || "No tenant selected"}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-display font-bold text-primary">{readiness.percentage}%</p>
          <p className="text-[10px] text-muted-foreground">launchable</p>
        </div>
      </div>

      <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-4">
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${readiness.percentage}%` }} />
      </div>

      <div className="rounded-lg border border-white/8 bg-black/10 p-3 mb-4">
        <p className="text-[10px] text-muted-foreground mb-1">Recommended next action</p>
        <p className="text-xs text-foreground">{readiness.recommendedAction}</p>
      </div>

      <div className={compact ? "space-y-1.5 max-h-56 overflow-y-auto" : "grid sm:grid-cols-2 lg:grid-cols-3 gap-2"}>
        {readiness.checks.map((check) => (
          <div key={check.key} className="flex items-start gap-2 text-xs rounded-lg border border-white/6 bg-white/[0.02] p-2">
            {check.done ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
            ) : check.severity === "critical" ? (
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
            ) : (
              <Clock className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
            )}
            <div>
              <p className={check.done ? "text-foreground/80" : "text-muted-foreground"}>{check.label}</p>
              {!check.done && <p className="text-[10px] text-muted-foreground/60">{check.action}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}