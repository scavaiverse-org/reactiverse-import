import { uploadFile } from "@/lib/upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload } from "lucide-react";
import { detectMediaTypeFromUrl } from "@/lib/walkthrough-media-bindings";

const newQuestion = () => ({ id: crypto.randomUUID(), question: "", question_type: "multiple_choice", options: [{ id: crypto.randomUUID(), label: "Option", is_correct: true }], correct_answer: "", explanation: "", points: 5 });
const newOption = () => ({ id: crypto.randomUUID(), label: "Option", is_correct: false });
const newMission = () => ({ id: crypto.randomUUID(), title: "Mission", description: "", required_hotspot_id: "", completion_message: "" });

export default function GamificationPageEditor({ room, onChange }) {
  const config = room.gamification_config || {};
  const setConfig = (patch) => onChange({ ...room, gamification_config: { ...config, ...patch } });
  const uploadBadge = async (file) => {
    if (!file) return;
    const result = await uploadFile(file);
    setConfig({ badge_icon_url: result.file_url });
  };

  return (
    <section className="space-y-4 rounded-2xl border border-primary/15 bg-primary/5 p-4">
      <h3 className="text-sm font-semibold text-primary">Gamification Page fields</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2"><Label>Game type</Label><select value={config.game_type || "quiz"} onChange={(e) => setConfig({ game_type: e.target.value })} className="w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm"><option value="quiz">Quiz</option><option value="mission">Mission</option><option value="scavenger_hunt">Scavenger Hunt</option><option value="checkpoint">Checkpoint</option><option value="badge_unlock">Badge Unlock</option><option value="puzzle">Puzzle</option><option value="memory_match">Memory Match</option><option value="code_unlock">Code Unlock</option></select></label>
        <label className="space-y-2"><Label>Points awarded</Label><Input type="number" value={config.points_awarded || 0} onChange={(e) => setConfig({ points_awarded: Number(e.target.value) })} /></label>
        <label className="space-y-2 md:col-span-2"><Label>Objective</Label><Textarea rows={2} value={config.objective_text || ""} onChange={(e) => setConfig({ objective_text: e.target.value })} /></label>
        <label className="space-y-2 md:col-span-2"><Label>Instructions</Label><Textarea rows={2} value={config.instructions || ""} onChange={(e) => setConfig({ instructions: e.target.value })} /></label>
        <label className="space-y-2"><Label>Badge name</Label><Input value={config.badge_name || ""} onChange={(e) => setConfig({ badge_name: e.target.value })} /></label>
        <label className="space-y-2"><Label>Badge icon</Label><div className="flex gap-2"><Input value={config.badge_icon_url || ""} onChange={(e) => setConfig({ badge_icon_url: e.target.value, badge_icon_type: detectMediaTypeFromUrl(e.target.value, "image") })} /><Button asChild variant="outline"><label className="cursor-pointer"><Upload className="h-4 w-4" /> Upload<input type="file" accept="image/*" className="hidden" onChange={(e) => uploadBadge(e.target.files?.[0])} /></label></Button></div></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!config.required_completion} onChange={(e) => setConfig({ required_completion: e.target.checked })} /> Required completion</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={config.allow_retry !== false} onChange={(e) => setConfig({ allow_retry: e.target.checked })} /> Allow retry</label>
        <label className="space-y-2"><Label>Success message</Label><Input value={config.success_message || ""} onChange={(e) => setConfig({ success_message: e.target.value })} /></label>
        <label className="space-y-2"><Label>Failure message</Label><Input value={config.failure_message || ""} onChange={(e) => setConfig({ failure_message: e.target.value })} /></label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3"><div className="flex items-center justify-between"><h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Questions</h4><Button size="sm" variant="outline" onClick={() => setConfig({ questions: [...(config.questions || []), newQuestion()] })}>Add question</Button></div>{(config.questions || []).map((question, index) => {
          const updateQuestion = (patch) => setConfig({ questions: config.questions.map((item, i) => i === index ? { ...question, ...patch } : item) });
          const updateOption = (optionIndex, patch) => updateQuestion({ options: question.options.map((opt, i) => i === optionIndex ? { ...opt, ...patch } : opt) });
          return (
            <div key={question.id || index} className="space-y-2 rounded-xl border border-white/10 bg-background/40 p-3">
              <Input value={question.question || ""} onChange={(e) => updateQuestion({ question: e.target.value })} placeholder="Question" />
              <select value={question.question_type || "multiple_choice"} onChange={(e) => updateQuestion({ question_type: e.target.value })} className="w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm">
                <option value="multiple_choice">Multiple choice</option>
                <option value="true_false">True / False</option>
                <option value="short_answer">Short answer</option>
              </select>
              {question.question_type === "short_answer" ? (
                <Input value={question.correct_answer || ""} onChange={(e) => updateQuestion({ correct_answer: e.target.value })} placeholder="Correct answer" />
              ) : (
                <div className="space-y-2">
                  {(question.options || []).map((option, optionIndex) => (
                    <div key={option.id || optionIndex} className="flex items-center gap-2">
                      <input type="checkbox" checked={!!option.is_correct} onChange={(e) => updateOption(optionIndex, { is_correct: e.target.checked })} title="Correct answer" />
                      <Input value={option.label || ""} onChange={(e) => updateOption(optionIndex, { label: e.target.value })} placeholder="Option label" />
                      <Button variant="outline" size="sm" onClick={() => updateQuestion({ options: question.options.filter((_, i) => i !== optionIndex) })}>Remove</Button>
                    </div>
                  ))}
                  <Button size="sm" variant="outline" onClick={() => updateQuestion({ options: [...(question.options || []), newOption()] })}>Add option</Button>
                </div>
              )}
              <Textarea value={question.explanation || ""} onChange={(e) => updateQuestion({ explanation: e.target.value })} placeholder="Explanation shown after answering" rows={2} />
              <Input type="number" value={question.points || 0} onChange={(e) => updateQuestion({ points: Number(e.target.value) })} placeholder="Points" />
              <Button variant="outline" onClick={() => setConfig({ questions: config.questions.filter((_, i) => i !== index) })}>Remove question</Button>
            </div>
          );
        })}</div>
        <div className="space-y-3"><div className="flex items-center justify-between"><h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Missions</h4><Button size="sm" variant="outline" onClick={() => setConfig({ missions: [...(config.missions || []), newMission()] })}>Add mission</Button></div>{(config.missions || []).map((mission, index) => {
          const updateMission = (patch) => setConfig({ missions: config.missions.map((item, i) => i === index ? { ...mission, ...patch } : item) });
          return (
            <div key={mission.id || index} className="space-y-2 rounded-xl border border-white/10 bg-background/40 p-3">
              <Input value={mission.title || ""} onChange={(e) => updateMission({ title: e.target.value })} placeholder="Mission title" />
              <Textarea value={mission.description || ""} onChange={(e) => updateMission({ description: e.target.value })} placeholder="Mission description" />
              <Input value={mission.required_hotspot_id || ""} onChange={(e) => updateMission({ required_hotspot_id: e.target.value })} placeholder="Required hotspot id (optional)" />
              <Input value={mission.completion_message || ""} onChange={(e) => updateMission({ completion_message: e.target.value })} placeholder="Completion message" />
              <Button variant="outline" onClick={() => setConfig({ missions: config.missions.filter((_, i) => i !== index) })}>Remove</Button>
            </div>
          );
        })}</div>
      </div>
    </section>
  );
}