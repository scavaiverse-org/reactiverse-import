import { Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isExperienceFeatureEnabled } from "@/lib/experience-feature-flags";
import HelpHint from "./HelpHint";

const actions = [
  ["room", "Autofill Room"],
  ["experience", "Autofill Entire Experience"],
  ["media", "Autofill Media"],
  ["layout", "Generate Cinematic Layout"],
  ["narrative", "Generate Museum Narrative"],
];

export default function GlobalExperienceAutofill({ onAction, disabled }) {
  if (!isExperienceFeatureEnabled("ENABLE_GLOBAL_AUTOFILL")) return null;
  return (
    <section className="rounded-3xl border border-cyan-400/20 bg-cyan-400/[0.055] p-4 shadow-2xl shadow-black/10">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-xl font-bold"><Sparkles className="h-5 w-5 text-cyan-300" /> Global Experience Autofill <HelpHint title="Global Experience Autofill">One-click tools that fill in content for the active room or the whole experience: room defaults, full-experience autofill, media, cinematic layout, and narrative text. Everything is written to your draft — review and Save Draft or Publish when ready.</HelpHint></h2>
          <p className="text-xs text-muted-foreground">Works across Super Easy, Easy, and Expert. Writes to draft first, then validates before save or publish.</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map(([key, label]) => (
          <Button key={key} variant={key === "experience" ? "default" : "outline"} onClick={() => onAction?.(key)} disabled={disabled}>
            <Wand2 className="h-4 w-4" /> {label}
          </Button>
        ))}
      </div>
    </section>
  );
}