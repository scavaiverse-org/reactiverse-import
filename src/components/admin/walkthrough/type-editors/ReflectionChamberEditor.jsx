import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ReflectionChamberEditor({ room, onChange }) {
  const config = room.reflection_config || {};
  const setConfig = (patch) => onChange({ ...room, reflection_config: { ...config, ...patch } });
  const moodOptionsText = (config.mood_options || []).join(", ");
  return <section className="grid gap-4 rounded-2xl border border-primary/15 bg-primary/5 p-4 md:grid-cols-2"><h3 className="md:col-span-2 text-sm font-semibold text-primary">Reflection Chamber fields</h3><label className="space-y-2 md:col-span-2"><Label>Reflection prompt</Label><Textarea value={config.reflection_prompt || ""} onChange={(e) => setConfig({ reflection_prompt: e.target.value })} /></label><label className="space-y-2"><Label>Journal placeholder</Label><Input value={config.journal_placeholder || ""} onChange={(e) => setConfig({ journal_placeholder: e.target.value })} /></label><label className="space-y-2"><Label>Mood options (comma separated)</Label><Input value={moodOptionsText} onChange={(e) => setConfig({ mood_options: e.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} placeholder="Calm, Curious, Inspired" /></label><label className="space-y-2 md:col-span-2"><Label>Completion button label</Label><Input value={config.completion_message || ""} onChange={(e) => setConfig({ completion_message: e.target.value })} placeholder="Save Reflection" /></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={config.calm_mode_default !== false} onChange={(e) => setConfig({ calm_mode_default: e.target.checked })} /> Calm mode default</label></section>;
}