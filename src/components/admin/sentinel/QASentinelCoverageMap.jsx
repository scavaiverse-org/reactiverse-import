import { Map } from "lucide-react";

export default function QASentinelCoverageMap({ checks = [], ctas = [] }) {
  const grouped = checks.reduce((acc, check) => {
    acc[check.check_type] = (acc[check.check_type] || 0) + 1;
    return acc;
  }, {});
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground"><Map className="h-4 w-4 text-cyan-400" /> Coverage Map</p>
        <p className="text-xs text-muted-foreground">Configured deterministic checks and current visible CTA inventory.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {Object.entries(grouped).map(([type, count]) => <Metric key={type} label={type} value={count} />)}
        <Metric label="visible_ctas" value={ctas.length} />
      </div>
      <div className="mt-4 max-h-56 overflow-y-auto rounded-xl border border-white/8 bg-black/15">
        {ctas.map((cta, index) => (
          <div key={buildCtaKey(cta, index)} className="grid grid-cols-12 gap-2 border-b border-white/5 px-3 py-2 text-xs">
            <span className="col-span-4 truncate text-foreground">{cta.label}</span>
            <span className="col-span-3 truncate text-muted-foreground">{cta.selector}</span>
            <span className="col-span-3 truncate text-muted-foreground">{cta.href || "no href"}</span>
            <span className="col-span-2 text-right text-primary">{cta.state}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function buildCtaKey(cta, index) {
  if (cta.id) return [cta.id, cta.route || "route-none", cta.selector || cta.target_selector || "selector-none", index].join("::");
  return [
    cta.route || "route-none",
    cta.component_name || "component-none",
    cta.target_selector || cta.selector || "selector-none",
    cta.target_label || cta.label || "label-none",
    cta.event_type || "event-none",
    cta.fingerprint || "fingerprint-none",
    cta.href || "href-none",
    cta.state || "state-none",
    index
  ].join("::");
}

function Metric({ label, value }) {
  return <div className="rounded-xl border border-white/8 bg-black/15 p-3"><p className="text-2xl font-display font-bold text-primary">{value}</p><p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p></div>;
}