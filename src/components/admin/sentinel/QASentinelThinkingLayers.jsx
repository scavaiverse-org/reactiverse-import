import { Activity, Brain, Database, HeartPulse, Radio } from "lucide-react";

export default function QASentinelThinkingLayers({ realtime, issueCount = 0, eventCount = 0, score = 0, latestRun, lastUpdated, loading }) {
  const updatedLabel = lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "Waiting for first refresh";
  const layers = [
    {
      label: "Issue status and data",
      value: `${issueCount} active issue${issueCount === 1 ? "" : "s"}`,
      detail: "Issue lists, statuses, and evidence refresh every 3 seconds.",
      icon: Database,
      tone: issueCount > 0 ? "text-amber-300" : "text-emerald-300"
    },
    {
      label: "AI thinking activity",
      value: `${eventCount} live signal${eventCount === 1 ? "" : "s"}`,
      detail: "Runtime events and semantic reasoning signals stay live on screen.",
      icon: Brain,
      tone: "text-cyan-300"
    },
    {
      label: "System health metrics",
      value: `${score}% health score`,
      detail: latestRun ? `Latest run: ${latestRun.status || "recorded"}` : "Waiting for the next QA run.",
      icon: HeartPulse,
      tone: score >= 80 ? "text-emerald-300" : score >= 50 ? "text-amber-300" : "text-red-300"
    }
  ];

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground"><Activity className="h-4 w-4 text-primary" /> Live Thinking Layers</p>
          <p className="text-xs text-muted-foreground">Plain-English live view of what QA Sentinel is reading, reasoning on, and reporting every 3 seconds.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px]">
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 ${realtime === "live" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : "border-amber-400/30 bg-amber-400/10 text-amber-300"}`}>
            <Radio className={`h-3 w-3 ${realtime === "live" ? "animate-pulse" : ""}`} /> {realtime === "live" ? "Live connection" : "Polling every 3 seconds"}
          </span>
          <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-muted-foreground">Last update: {updatedLabel}</span>
          <span className={`rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-1 text-cyan-300 transition-opacity duration-300 ${loading ? "opacity-100" : "opacity-0 pointer-events-none"}`} aria-hidden={!loading}>Refreshing now</span>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {layers.map((layer) => {
          const Icon = layer.icon;
          return (
            <div key={layer.label} className="rounded-xl border border-white/8 bg-black/15 p-4">
              <div className="flex items-start gap-3">
                <Icon className={`mt-0.5 h-4 w-4 ${layer.tone}`} />
                <div>
                  <p className="text-xs font-semibold text-foreground">{layer.label}</p>
                  <p className={`mt-1 text-lg font-bold ${layer.tone}`}>{layer.value}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{layer.detail}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}