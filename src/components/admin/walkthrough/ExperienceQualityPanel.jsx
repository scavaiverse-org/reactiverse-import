import { ShieldCheck } from "lucide-react";
import { scoreWalkthroughQuality } from "@/lib/walkthrough-quality-scoring";

const rows = [
  ["immersion", "Immersion"],
  ["narrative_coherence", "Narrative Coherence"],
  ["accessibility", "Accessibility"],
  ["educational_value", "Educational Value"],
  ["interaction_balance", "Interaction Balance"],
  ["emotional_pacing", "Emotional Pacing"],
  ["completion_readiness", "Completion Readiness"],
  ["publish_safety", "Publish Safety"],
];

export default function ExperienceQualityPanel({ rooms = [] }) {
  const scores = scoreWalkthroughQuality(rooms);
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
      <div className="mb-4">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold"><ShieldCheck className="h-5 w-5 text-primary" /> Intelligence / Quality Panel</h2>
        <p className="text-xs text-muted-foreground">Deterministic scoring for publish readiness and visitor experience quality.</p>
      </div>
      <div className="space-y-3">
        {rows.map(([key, label]) => <div key={key}><div className="mb-1 flex justify-between text-xs"><span>{label}</span><span className="font-mono text-primary">{scores[key]}</span></div><div className="h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-primary" style={{ width: `${scores[key]}%` }} /></div></div>)}
      </div>
      {(scores.errors.length > 0 || scores.warnings.length > 0) && <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3 text-xs text-amber-100"><p className="mb-1 font-semibold">Readiness notes</p>{[...scores.errors, ...scores.warnings].slice(0, 6).map((item, idx) => <p key={idx}>• {item}</p>)}</div>}
    </section>
  );
}