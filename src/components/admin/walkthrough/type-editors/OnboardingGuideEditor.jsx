import { uploadFile } from "@/lib/upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload } from "lucide-react";
import { detectMediaTypeFromUrl } from "@/lib/walkthrough-media-bindings";

const newChoice = () => ({ id: crypto.randomUUID(), label: "Choice", description: "", next_room_id: "" });

export default function OnboardingGuideEditor({ room, onChange }) {
  const config = room.onboarding_config || {};
  const setConfig = (patch) => onChange({ ...room, onboarding_config: { ...config, ...patch } });
  const upload = async (field, file) => {
    if (!file) return;
    try {
      const result = await uploadFile(file);
      setConfig({ [field]: result.file_url });
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  return (
    <section className="space-y-4 rounded-2xl border border-primary/15 bg-primary/5 p-4">
      <h3 className="text-sm font-semibold text-primary">Onboarding Guide fields</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2"><Label>Guide mode</Label><select value={config.guide_mode || "welcome"} onChange={(e) => setConfig({ guide_mode: e.target.value })} className="w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm"><option value="welcome">Welcome</option><option value="instruction">Instruction</option><option value="story_intro">Story Intro</option><option value="safety_briefing">Safety Briefing</option><option value="choice_screen">Choice Screen</option></select></label>
        <label className="space-y-2"><Label>Guide name</Label><Input value={config.guide_name || ""} onChange={(e) => setConfig({ guide_name: e.target.value })} /></label>
        <label className="space-y-2 md:col-span-2"><Label>Intro text</Label><Textarea rows={3} value={config.intro_text || ""} onChange={(e) => setConfig({ intro_text: e.target.value })} /></label>
        <label className="space-y-2 md:col-span-2"><Label>Instruction text</Label><Textarea rows={2} value={config.step_instruction || ""} onChange={(e) => setConfig({ step_instruction: e.target.value })} /></label>
        <label className="space-y-2"><Label>Guide avatar URL</Label><div className="flex gap-2"><Input value={config.guide_avatar_url || ""} onChange={(e) => setConfig({ guide_avatar_url: e.target.value, guide_avatar_type: detectMediaTypeFromUrl(e.target.value, "image") })} /><Button asChild variant="outline"><label className="cursor-pointer"><Upload className="h-4 w-4" /> Upload<input type="file" accept="image/*" className="hidden" onChange={(e) => upload("guide_avatar_url", e.target.files?.[0])} /></label></Button></div></label>
        <label className="space-y-2"><Label>Voice/audio URL</Label><div className="flex gap-2"><Input value={config.guide_voice_url || ""} onChange={(e) => setConfig({ guide_voice_url: e.target.value, guide_voice_type: detectMediaTypeFromUrl(e.target.value, "audio") })} /><Button asChild variant="outline"><label className="cursor-pointer"><Upload className="h-4 w-4" /> Upload<input type="file" accept="audio/*" className="hidden" onChange={(e) => upload("guide_voice_url", e.target.files?.[0])} /></label></Button></div></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={config.show_progress !== false} onChange={(e) => setConfig({ show_progress: e.target.checked })} /> Show progress</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!config.allow_skip} onChange={(e) => setConfig({ allow_skip: e.target.checked })} /> Allow skip</label>
        <label className="space-y-2 md:col-span-2"><Label>Skip / next room ID</Label><Input value={config.skip_target_room_id || ""} onChange={(e) => setConfig({ skip_target_room_id: e.target.value })} /></label>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between"><h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Visitor choices</h4><Button size="sm" variant="outline" onClick={() => setConfig({ choices: [...(config.choices || []), newChoice()] })}>Add choice</Button></div>
        {(config.choices || []).map((choice, index) => <div key={choice.id || index} className="grid gap-2 rounded-xl border border-white/10 bg-background/40 p-3 md:grid-cols-3"><Input value={choice.label || ""} onChange={(e) => setConfig({ choices: config.choices.map((item, i) => i === index ? { ...choice, label: e.target.value } : item) })} placeholder="Label" /><Input value={choice.next_room_id || ""} onChange={(e) => setConfig({ choices: config.choices.map((item, i) => i === index ? { ...choice, next_room_id: e.target.value } : item) })} placeholder="Next room ID" /><Button variant="outline" onClick={() => setConfig({ choices: config.choices.filter((_, i) => i !== index) })}>Remove</Button><Textarea className="md:col-span-3" value={choice.description || ""} onChange={(e) => setConfig({ choices: config.choices.map((item, i) => i === index ? { ...choice, description: e.target.value } : item) })} placeholder="Description" /></div>)}
      </div>
    </section>
  );
}