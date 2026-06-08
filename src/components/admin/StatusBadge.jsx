import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  live: { label: "LIVE", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30" },
  staging: { label: "STAGING", color: "text-amber-400 bg-amber-400/10 border-amber-400/30" },
  draft: { label: "DRAFT", color: "text-slate-400 bg-slate-400/10 border-slate-400/30" },
  archived: { label: "ARCHIVED", color: "text-red-400 bg-red-400/10 border-red-400/30" },
  operational: { label: "OPERATIONAL", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30" },
  degraded: { label: "DEGRADED", color: "text-amber-400 bg-amber-400/10 border-amber-400/30" },
  outage: { label: "OUTAGE", color: "text-red-400 bg-red-400/10 border-red-400/30" },
  maintenance: { label: "MAINTENANCE", color: "text-blue-400 bg-blue-400/10 border-blue-400/30" },
  healthy: { label: "HEALTHY", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30" },
  warning: { label: "WARNING", color: "text-amber-400 bg-amber-400/10 border-amber-400/30" },
  error: { label: "ERROR", color: "text-red-400 bg-red-400/10 border-red-400/30" },
  unconfigured: { label: "UNCONFIGURED", color: "text-slate-400 bg-slate-400/10 border-slate-400/30" },
  enabled: { label: "ENABLED", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30" },
  disabled: { label: "DISABLED", color: "text-slate-400 bg-slate-400/10 border-slate-400/30" },
  PASS: { label: "PASS", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30" },
  FAIL: { label: "FAIL", color: "text-red-400 bg-red-400/10 border-red-400/30" },
  WARNING: { label: "WARNING", color: "text-amber-400 bg-amber-400/10 border-amber-400/30" },
  MANUAL_QA_REQUIRED: { label: "MANUAL QA", color: "text-blue-400 bg-blue-400/10 border-blue-400/30" },
};

export default function StatusBadge({ status, className = "" }) {
  const cfg = STATUS_CONFIG[status] || { label: status?.toUpperCase() || "UNKNOWN", color: "text-slate-400 bg-slate-400/10 border-slate-400/30" };
  return (
    <span className={cn("inline-flex items-center gap-1 text-[9px] font-bold tracking-widest px-2 py-0.5 rounded border", cfg.color, className)}>
      <span className="w-1 h-1 rounded-full bg-current" />
      {cfg.label}
    </span>
  );
}