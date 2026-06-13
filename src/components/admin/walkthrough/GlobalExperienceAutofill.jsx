import { useState } from "react";
import { Box, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { isExperienceFeatureEnabled } from "@/lib/experience-feature-flags";
import { MAX_AUTOFILL_3D_WORLDS } from "@/lib/three-d-world-autofill";
import HelpHint from "./HelpHint";

const actions = [
  ["room", "Autofill Room"],
  ["experience", "Autofill Entire Experience"],
  ["media", "Autofill Media"],
  ["layout", "Generate Cinematic Layout"],
  ["narrative", "Generate Museum Narrative"],
];

export default function GlobalExperienceAutofill({ onAction, disabled }) {
  const [worldsOpen, setWorldsOpen] = useState(false);
  const [worldCount, setWorldCount] = useState(3);

  if (!isExperienceFeatureEnabled("ENABLE_GLOBAL_AUTOFILL")) return null;

  const confirmWorlds = () => {
    onAction?.("threeDWorlds", { count: worldCount });
    setWorldsOpen(false);
  };

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

      {/* 3D World autofill — a single ready-built world, plus a "choose how many"
          option directly beneath it for populating several worlds at once. */}
      <div className="mt-4 space-y-2 rounded-2xl border border-primary/20 bg-primary/[0.05] p-3">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Box className="h-4 w-4 text-primary" /> 3D Worlds
          <HelpHint title="Autofill 3D Worlds">Drop ready-built 3D world rooms straight into this walkthrough. Each one is a complete, walkable sample world — template, mood, objects, NPC guide, and doors — that you can then customise. New worlds are added as drafts so nothing goes live until you publish.</HelpHint>
        </p>
        <div className="flex flex-col gap-2 sm:max-w-xs">
          <Button variant="outline" className="justify-start" onClick={() => onAction?.("threeDWorld")} disabled={disabled}>
            <Box className="h-4 w-4" /> Autofill 3D World
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => setWorldsOpen(true)} disabled={disabled}>
            <Sparkles className="h-4 w-4" /> Autofill 3D Worlds…
          </Button>
        </div>
      </div>

      <Dialog open={worldsOpen} onOpenChange={setWorldsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>How many 3D worlds?</DialogTitle>
            <DialogDescription>Choose how many ready-built 3D world rooms to add to this walkthrough. You can create up to {MAX_AUTOFILL_3D_WORLDS} at once — each is added as a draft.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-2 py-2">
            {Array.from({ length: MAX_AUTOFILL_3D_WORLDS }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setWorldCount(n)}
                className={`rounded-xl border px-3 py-3 text-sm font-bold transition ${worldCount === n ? "border-primary bg-primary text-primary-foreground" : "border-white/10 bg-background/40 text-muted-foreground hover:bg-white/5 hover:text-foreground"}`}
              >
                {n}
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWorldsOpen(false)}>Cancel</Button>
            <Button onClick={confirmWorlds}><Box className="h-4 w-4" /> Create {worldCount} 3D world{worldCount > 1 ? "s" : ""}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
