import { Download, Play, Radar, RotateCcw, Route, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function QASentinelTesterControls({ onRun, onClearFixed, onExport, isRunning }) {
  const actions = [
    ["smoke", "Run Smoke Test", Radar],
    ["full", "Run Full Test", Play],
    ["manual", "Run Tenant Test", Play],
    ["route", "Run Route Test", Route],
    ["manual", "Run CTA Test", Zap],
    ["regression", "Run Regression Test", RotateCcw]
  ];
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4">
        <p className="text-sm font-semibold text-foreground">Sentinel Controls</p>
        <p className="text-xs text-muted-foreground">Runs in-app deterministic checks. External Playwright-style automation is prepared but not available in this runtime.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map(([type, label, Icon]) => (
          <Button key={label} onClick={() => onRun(type)} disabled={isRunning} variant={type === "smoke" ? "default" : "secondary"} size="sm">
            <Icon className="h-3.5 w-3.5" /> {label}
          </Button>
        ))}
        <Button onClick={onClearFixed} variant="outline" size="sm">Clear Fixed/Ignored from View</Button>
        <Button onClick={onExport} variant="outline" size="sm"><Download className="h-3.5 w-3.5" /> Export QA Report</Button>
      </div>
    </section>
  );
}