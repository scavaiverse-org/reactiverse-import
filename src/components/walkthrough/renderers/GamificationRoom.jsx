import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";
import ResolvedMedia from "@/components/walkthrough/ResolvedMedia";

export default function GamificationRoom({ room, onComplete, onGameStart }) {
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const config = room.gamification_config || {};
  const questions = config.questions || [];
  const missions = config.missions || [];

  const start = () => {
    setStarted(true);
    onGameStart?.(room);
  };

  const complete = () => {
    setCompleted(true);
    onComplete?.(room);
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-20">
      <div className="w-full max-w-3xl rounded-[2rem] border border-white/15 bg-background/75 p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {config.badge_icon_url && <ResolvedMedia url={config.badge_icon_url} mediaType="image" alt={config.badge_name || "Badge"} className="h-16 w-16 rounded-2xl object-cover ring-1 ring-primary/30" fallbackVisual fallbackCompact />}
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-primary">{config.game_type || "challenge"}</p>
              <h1 className="mt-3 font-display text-4xl font-bold text-foreground">{room.title || "Challenge"}</h1>
            </div>
          </div>
          <div className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">{config.points_awarded || 0} pts</div>
        </div>
        <p className="mt-5 text-sm leading-7 text-foreground/75">{room.narration || room.description || config.objective_text}</p>
        {config.instructions && <p className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-foreground/70">{config.instructions}</p>}
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {questions.map((question) => <div key={question.id} className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-sm font-semibold">{question.question}</p><p className="mt-2 text-xs text-muted-foreground">{question.points || 0} points</p></div>)}
          {missions.map((mission) => <div key={mission.id} className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-sm font-semibold">{mission.title}</p><p className="mt-2 text-xs text-muted-foreground">{mission.description}</p></div>)}
        </div>
        {completed ? <div className="mt-6 rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-4 text-sm text-emerald-300"><Trophy className="mb-2 h-5 w-5" />{config.success_message || "Challenge complete."}</div> : <Button className="mt-6" onClick={started ? complete : start}>{started ? "Complete Challenge" : "Start Challenge"}</Button>}
      </div>
    </div>
  );
}