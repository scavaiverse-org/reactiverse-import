import { useState } from "react";
import { CheckCircle2, RotateCcw, ShieldCheck, Wand2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { evaluateQAChecklist } from "@/lib/walkthrough-qa-checklist";
import { scoreWalkthroughQuality } from "@/lib/walkthrough-quality-scoring";

export default function RolloutControlPanel({ tenant, record, rooms, walkthroughKey, onComplete }) {
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const quality = scoreWalkthroughQuality(rooms);
  const checklist = evaluateQAChecklist({ rooms, record, quality });
  const passed = checklist.filter((item) => item.passed).length;

  const runMigration = async (mode, apply = false) => {
    setRunning(true);
    setError(null);
    try {
      const response = await base44.functions.invoke("migrateWalkthroughV3", { mode, apply, tenant_id: tenant?.id, walkthrough_key: walkthroughKey });
      setResult(response.data);
      onComplete?.();
    } catch (err) {
      setError(err?.message || "Migration failed.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
      <div className="mb-4">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold"><ShieldCheck className="h-5 w-5 text-primary" /> QA & Rollout</h2>
        <p className="text-xs text-muted-foreground">Deterministic dry-run, migration, rollback, and QA readiness.</p>
      </div>
      {error && (
        <div className="mb-4 rounded-2xl border border-rose-400/30 bg-rose-400/10 p-3 text-xs text-rose-100">{error}</div>
      )}

      <div className="mb-4 flex items-center justify-between rounded-2xl border border-white/10 bg-background/40 p-3 text-xs">
        <span>Checklist</span>
        <Badge className="bg-primary/10 text-primary">{passed}/{checklist.length}</Badge>
      </div>

      <div className="space-y-2">
        {checklist.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-background/30 px-3 py-2 text-xs">
            <span>{item.label}</span>
            <span className={item.passed ? "text-emerald-300" : "text-amber-200"}>{item.passed ? "PASS" : "CHECK"}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-2">
        <Button variant="outline" disabled={running} onClick={() => runMigration("dry_run", false)}><Wand2 className="h-4 w-4" /> Dry Run</Button>
        <Button disabled={running || quality.errors.length > 0} onClick={() => runMigration("apply", true)}><CheckCircle2 className="h-4 w-4" /> Apply Migration</Button>
        <Button variant="outline" disabled={running} onClick={() => runMigration("rollback", true)}><RotateCcw className="h-4 w-4" /> Rollback to Backup</Button>
      </div>

      {result && (
        <div className="mt-4 max-h-48 overflow-auto rounded-2xl border border-white/10 bg-background/50 p-3 text-[10px] text-muted-foreground">
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </section>
  );
}