import { Activity, AlertTriangle, Bug, GitPullRequestArrow, Radio, Route, ShieldCheck, Zap } from "lucide-react";

const scoreLabel = (score) => score >= 90 ? "Healthy" : score >= 75 ? "Watch" : score >= 50 ? "Degraded" : "Critical";

export default function QASentinelSeverityCards({ score, counts, latestRun, routeCount, ctaCount, formCount, livePulse }) {
  const cards = [
    { label: "System QA Score", value: score, detail: scoreLabel(score), icon: ShieldCheck, tone: score >= 75 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-red-400" },
    { label: "Open Critical Issues", value: counts.critical, detail: "active blockers", icon: AlertTriangle, tone: "text-red-400" },
    { label: "Open Major Issues", value: counts.major, detail: "high-risk flows", icon: Bug, tone: "text-orange-400" },
    { label: "Regressions", value: counts.regressed, detail: "fixed then returned", icon: GitPullRequestArrow, tone: "text-fuchsia-400" },
    { label: "Routes Covered", value: routeCount, detail: "registry mapped", icon: Route, tone: "text-cyan-400" },
    { label: "CTAs Tested", value: ctaCount, detail: "visible detected", icon: Zap, tone: "text-primary" },
    { label: "Forms Tested", value: formCount, detail: "visible detected", icon: Activity, tone: "text-blue-400" },
    { label: "Live Event Pulse", value: livePulse, detail: latestRun?.status || "no run yet", icon: Radio, tone: "text-emerald-400" }
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 shadow-xl shadow-black/10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{card.label}</p>
                <p className={`mt-2 text-3xl font-display font-bold ${card.tone}`}>{card.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{card.detail}</p>
              </div>
              <Icon className={`h-5 w-5 ${card.tone}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}