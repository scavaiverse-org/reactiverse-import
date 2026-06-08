import { Button } from "@/components/ui/button";
import OnboardingProgressRail from "./OnboardingProgressRail";
import CinematicCTA from "./CinematicCTA";

export default function OnboardingProgress({ current, total, canGoBack, chapter, primaryLabel, onBack, onNext, onSkip }) {
  return (
    <div className="mt-7 border-t border-slate-200/10 pt-5">
      <div className="mb-4">
        <OnboardingProgressRail current={current} total={total} chapter={chapter} />
      </div>

      <div className="grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-center">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={!canGoBack}
          className="border-slate-200/20 bg-white/5 text-foreground hover:bg-white/10 disabled:opacity-35"
        >
          Back
        </Button>
        <CinematicCTA onClick={onNext}>{primaryLabel || "Continue"}</CinematicCTA>
        <Button
          type="button"
          variant="ghost"
          onClick={onSkip}
          aria-label="Skip intro and enter the platform overview"
          className="text-foreground/60 hover:bg-white/10 hover:text-foreground"
        >
          Skip Intro
        </Button>
      </div>
    </div>
  );
}