import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

export default function HomePublishReadiness({ checks = [], statusText }) {
  const requiredMissing = checks.filter((item) => item.required && !item.ok);
  const warnings = checks.filter((item) => !item.required && !item.ok);
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">Publish readiness</p>
          <p className="mt-1 text-sm text-muted-foreground">{requiredMissing.length ? "Required fields need attention before publishing." : warnings.length ? "Ready to publish with optional warnings." : "Ready to publish."}</p>
        </div>
        {statusText && <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs text-primary">{statusText}</span>}
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-2 lg:grid-cols-3">
        {checks.map((item) => {
          const Icon = item.ok ? CheckCircle2 : item.required ? AlertTriangle : Info;
          return (
            <div key={item.label} className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-xs ${item.ok ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200" : item.required ? "border-destructive/25 bg-destructive/10 text-destructive" : "border-amber-400/20 bg-amber-400/10 text-amber-200"}`}>
              <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{item.label}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}