import { ArchiveRestore, CheckCircle2, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDeprecationStatus, LEGACY_WALKTHROUGH_FILES } from "@/lib/walkthrough-deprecation";
import { scoreWalkthroughQuality } from "@/lib/walkthrough-quality-scoring";

export default function MigrationReadinessPanel({ record = {}, rooms = [], onSaveDraft }) {
  const status = getDeprecationStatus(record);
  const quality = scoreWalkthroughQuality(rooms);
  const ready = status.isDynamicV3 && quality.errors.length === 0;

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
      <div className="mb-4">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold"><ArchiveRestore className="h-5 w-5 text-primary" /> Migration Readiness</h2>
        <p className="text-xs text-muted-foreground">Safe live-record migration status and legacy deprecation guardrails.</p>
      </div>

      <div className="grid gap-2 text-xs">
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-background/40 p-3"><span>Dynamic v3 rooms</span><Badge className={status.isDynamicV3 ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-400/10 text-amber-200"}>{status.isDynamicV3 ? "ready" : "pending"}</Badge></div>
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-background/40 p-3"><span>Legacy sources detected</span><Badge variant="outline">{status.legacySourcesDetected ? "yes" : "no"}</Badge></div>
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-background/40 p-3"><span>Publish blockers</span><Badge variant="outline">{quality.errors.length}</Badge></div>
      </div>

      {ready ? (
        <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-xs text-emerald-200"><CheckCircle2 className="mb-2 h-4 w-4" /> This walkthrough is ready for manual QA and controlled publishing.</div>
      ) : (
        <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3 text-xs text-amber-100"><ShieldAlert className="mb-2 h-4 w-4" /> Save a draft after reviewing migrated rooms, then publish only after QA passes.</div>
      )}

      <Button className="mt-4 w-full" variant="outline" onClick={onSaveDraft}>Save v3 Migration Draft</Button>

      <div className="mt-4 border-t border-white/10 pt-4">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Legacy files under guardrail</p>
        <div className="space-y-1 text-[10px] text-muted-foreground">
          {LEGACY_WALKTHROUGH_FILES.map((file) => <p key={file}>• {file}</p>)}
        </div>
      </div>
    </section>
  );
}