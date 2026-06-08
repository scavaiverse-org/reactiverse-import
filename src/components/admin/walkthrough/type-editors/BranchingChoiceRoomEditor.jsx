import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const newChoice = () => ({ id: crypto.randomUUID(), label: "Choice", description: "", next_room_id: "" });
export default function BranchingChoiceRoomEditor({ room, onChange }) {
  const config = room.branching_choice_config || {};
  const choices = config.choices || [];
  const setConfig = (patch) => onChange({ ...room, branching_choice_config: { ...config, ...patch } });
  return <section className="space-y-4 rounded-2xl border border-primary/15 bg-primary/5 p-4"><h3 className="text-sm font-semibold text-primary">Branching Choice Room fields</h3><label className="space-y-2"><Label>Choice prompt</Label><Textarea value={config.prompt || ""} onChange={(e) => setConfig({ prompt: e.target.value })} /></label><div className="flex items-center justify-between"><p className="text-xs uppercase tracking-widest text-muted-foreground">Choices</p><Button size="sm" variant="outline" onClick={() => setConfig({ choices: [...choices, newChoice()] })}>Add choice</Button></div>{choices.map((choice, index) => <div key={choice.id || index} className="grid gap-2 rounded-xl border border-white/10 bg-background/40 p-3 md:grid-cols-3"><Input value={choice.label || ""} placeholder="Label" onChange={(e) => setConfig({ choices: choices.map((item, i) => i === index ? { ...choice, label: e.target.value } : item) })} /><Input value={choice.next_room_id || ""} placeholder="Next room id/key" onChange={(e) => setConfig({ choices: choices.map((item, i) => i === index ? { ...choice, next_room_id: e.target.value } : item) })} /><Button variant="outline" onClick={() => setConfig({ choices: choices.filter((_, i) => i !== index) })}>Remove</Button></div>)}</section>;
}