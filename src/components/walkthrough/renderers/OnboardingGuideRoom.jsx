import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Minimize2, X } from "lucide-react";
import ResolvedMedia from "@/components/walkthrough/ResolvedMedia";

export default function OnboardingGuideRoom({ room, onNext, onChoice, context = {} }) {
  const [minimized, setMinimized] = useState(false);
  const config = room.onboarding_config || {};

  useEffect(() => {
    setMinimized(false);
  }, [room?.id]);

  if (minimized) {
    return (
      <div className="pointer-events-none fixed inset-x-4 bottom-24 z-30 flex justify-center sm:bottom-28">
        <Button className="pointer-events-auto rounded-full border border-white/15 bg-background/80 px-4 shadow-2xl backdrop-blur-xl" variant="outline" onClick={() => setMinimized(false)}>
          Open room guide
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-20">
      <div className="relative w-full max-w-2xl rounded-[2rem] border border-white/15 bg-background/75 p-8 text-center shadow-2xl backdrop-blur-xl">
        <button aria-label="Minimize room guide" onClick={() => setMinimized(true)} className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/5 p-2 text-muted-foreground transition hover:bg-white/10 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
          <X className="h-4 w-4" />
        </button>
        {config.guide_avatar_url && <ResolvedMedia url={config.guide_avatar_url} mediaType="image" alt={config.guide_name || "Guide avatar"} className="mx-auto mb-5 h-24 w-24 rounded-full object-cover ring-2 ring-primary/30" fallbackVisual fallbackCompact />}
        {config.show_progress !== false && context.totalRooms > 0 && (
          <div className="mx-auto mb-4 h-1 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((context.currentRoomIndex + 1) / context.totalRooms) * 100}%` }} />
          </div>
        )}
        <p className="text-xs uppercase tracking-[0.28em] text-primary">{config.guide_mode || "welcome"}</p>
        <h1 className="mt-3 font-display text-4xl font-bold text-foreground">{room.title || config.guide_name || "Welcome"}</h1>
        <p className="mt-4 text-sm leading-7 text-foreground/75">{room.narration || room.description || config.intro_text}</p>
        {config.step_instruction && <p className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-foreground/70">{config.step_instruction}</p>}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
          {(config.choices || []).map((choice, index) => (
            <Button key={choice.id || choice.label || `choice-${index}`} variant="outline" className="h-auto flex-col items-start gap-1 whitespace-normal py-2 text-left" onClick={() => onChoice(choice)}>
              <span>{choice.label}</span>
              {choice.description && <span className="text-xs font-normal text-muted-foreground">{choice.description}</span>}
            </Button>
          ))}
          <Button variant="outline" onClick={() => setMinimized(true)}><Minimize2 className="h-4 w-4" /> Hide Guide</Button>
          {config.allow_skip && config.skip_target_room_id && (
            <Button variant="ghost" onClick={() => context.goToRoom?.(config.skip_target_room_id, { skipped: true })}>Skip</Button>
          )}
        </div>
      </div>
    </div>
  );
}