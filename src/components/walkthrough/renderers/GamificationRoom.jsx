import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Trophy, CheckCircle2, XCircle } from "lucide-react";
import ResolvedMedia from "@/components/walkthrough/ResolvedMedia";

function isQuestionCorrect(question, answer) {
  if (answer == null) return false;
  if ((question.options || []).length) {
    const option = (question.options || []).find((opt) => opt.id === answer);
    return !!option?.is_correct;
  }
  return String(answer).trim().toLowerCase() === String(question.correct_answer || "").trim().toLowerCase();
}

export default function GamificationRoom({ room, context = {}, onComplete, onGameStart }) {
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showFailure, setShowFailure] = useState(false);
  const [answers, setAnswers] = useState({});
  const [completedMissions, setCompletedMissions] = useState(new Set());
  const config = room.gamification_config || {};
  const questions = config.questions || [];
  const missions = config.missions || [];

  useEffect(() => {
    const hotspotId = context.activeHotspot?.id;
    if (!hotspotId) return;
    const matchedMission = missions.find((mission) => mission.required_hotspot_id === hotspotId);
    if (matchedMission) setCompletedMissions((prev) => new Set(prev).add(matchedMission.id));
  }, [context.activeHotspot]);

  const start = () => {
    setStarted(true);
    onGameStart?.(room);
  };

  const answerQuestion = (question, answerId) => {
    if (completed) return;
    setAnswers((prev) => ({ ...prev, [question.id]: answerId }));
  };

  const allQuestionsCorrect = questions.every((question) => isQuestionCorrect(question, answers[question.id]));
  const allMissionsComplete = missions.every((mission) => !mission.required_hotspot_id || completedMissions.has(mission.id));
  const canComplete = !config.required_completion || (allQuestionsCorrect && allMissionsComplete);

  const complete = () => {
    if (!canComplete) {
      setShowFailure(true);
      return;
    }
    setShowFailure(false);
    setCompleted(true);
    onComplete?.(room);
  };

  const retry = () => {
    setAnswers({});
    setCompletedMissions(new Set());
    setShowFailure(false);
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-20">
      <div className="w-full max-w-3xl rounded-[2rem] border border-white/15 bg-background/75 p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {config.badge_icon_url && <ResolvedMedia url={config.badge_icon_url} mediaType={config.badge_icon_type || "image"} alt={config.badge_name || "Badge"} className="h-16 w-16 rounded-2xl object-cover ring-1 ring-primary/30" fallbackVisual fallbackCompact />}
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
          {questions.map((question) => {
            const answer = answers[question.id];
            const answered = answer != null;
            const correct = isQuestionCorrect(question, answer);
            return (
              <div key={question.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold">{question.question}</p>
                <p className="mt-1 text-xs text-muted-foreground">{question.points || 0} points</p>
                {(question.options || []).length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {question.options.map((option) => {
                      const selected = answer === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          disabled={completed}
                          onClick={() => answerQuestion(question, option.id)}
                          className={`w-full rounded-lg border px-3 py-2 text-left text-xs transition ${selected ? (option.is_correct ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-200" : "border-destructive/50 bg-destructive/10 text-destructive") : "border-white/10 bg-background/40 hover:border-primary/40"}`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <input
                    type="text"
                    disabled={completed}
                    value={answer || ""}
                    onChange={(e) => answerQuestion(question, e.target.value)}
                    placeholder="Your answer"
                    className="mt-3 w-full rounded-lg border border-white/10 bg-background/40 px-3 py-2 text-xs"
                  />
                )}
                {answered && question.explanation && (
                  <p className={`mt-2 flex items-start gap-1.5 text-xs ${correct ? "text-emerald-300" : "text-amber-200"}`}>
                    {correct ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
                    {question.explanation}
                  </p>
                )}
              </div>
            );
          })}
          {missions.map((mission) => {
            const done = !mission.required_hotspot_id || completedMissions.has(mission.id);
            return (
              <div key={mission.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold">{mission.title} {done && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />}</p>
                <p className="mt-2 text-xs text-muted-foreground">{mission.description}</p>
                {mission.required_hotspot_id && !done && <p className="mt-2 text-[11px] text-amber-200">Find and open the required hotspot to complete this mission.</p>}
                {done && mission.completion_message && <p className="mt-2 text-[11px] text-emerald-300">{mission.completion_message}</p>}
              </div>
            );
          })}
        </div>
        {completed ? (
          <div className="mt-6 rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-4 text-sm text-emerald-300"><Trophy className="mb-2 h-5 w-5" />{config.success_message || "Challenge complete."}</div>
        ) : (
          <>
            {showFailure && config.failure_message && <div className="mt-6 rounded-xl border border-destructive/25 bg-destructive/10 p-4 text-sm text-destructive">{config.failure_message}</div>}
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={started ? complete : start}>{started ? "Complete Challenge" : "Start Challenge"}</Button>
              {showFailure && config.allow_retry !== false && <Button variant="outline" onClick={retry}>Retry</Button>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
