import { uploadFile } from "@/lib/upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload } from "lucide-react";
import { detectMediaTypeFromFile, detectMediaTypeFromUrl } from "@/lib/walkthrough-media-bindings";
import ScrollableImageControls from "../ScrollableImageControls";

const newCta = () => ({ id: crypto.randomUUID(), label: "Next Step", route: "home", style: "primary" });

export default function FinaleRoomEditor({ room, onChange }) {
  const config = room.finale_config || {};
  const ctas = config.next_ctas || [];
  const setConfig = (patch) => onChange({ ...room, finale_config: { ...config, ...patch } });
  const upload = async (file) => {
    if (!file) return;
    const result = await uploadFile(file);
    setConfig({ media_url: result.file_url, media_type: detectMediaTypeFromFile(file) });
  };

  return (
    <section className="space-y-4 rounded-2xl border border-primary/15 bg-primary/5 p-4">
      <h3 className="text-sm font-semibold text-primary">Finale Room fields</h3>
      <label className="space-y-2"><Label>Achievement title</Label><Input value={config.achievement_title || ""} onChange={(e) => setConfig({ achievement_title: e.target.value })} /></label>
      <label className="space-y-2"><Label>Completion message</Label><Textarea value={config.completion_message || ""} onChange={(e) => setConfig({ completion_message: e.target.value })} /></label>
      <label className="space-y-2"><Label>Finale media</Label><div className="flex gap-2"><Input value={config.media_url || ""} onChange={(e) => setConfig({ media_url: e.target.value, media_type: detectMediaTypeFromUrl(e.target.value, config.media_type) })} /><Button asChild variant="outline"><label className="cursor-pointer"><Upload className="h-4 w-4" /> Upload<input type="file" accept="image/*,video/*,audio/*,.pdf" className="hidden" onChange={(e) => upload(e.target.files?.[0])} /></label></Button></div></label>
      <ScrollableImageControls value={config} mediaType={config.media_type} onChange={setConfig} />
      <div className="flex items-center justify-between"><p className="text-xs uppercase tracking-widest text-muted-foreground">Next CTAs</p><Button size="sm" variant="outline" onClick={() => setConfig({ next_ctas: [...ctas, newCta()] })}>Add CTA</Button></div>
      {ctas.map((cta, index) => <div key={cta.id || index} className="grid gap-2 rounded-xl border border-white/10 bg-background/40 p-3 md:grid-cols-3"><Input value={cta.label || ""} placeholder="Label" onChange={(e) => setConfig({ next_ctas: ctas.map((item, i) => i === index ? { ...cta, label: e.target.value } : item) })} /><Input value={cta.route || ""} placeholder="Route" onChange={(e) => setConfig({ next_ctas: ctas.map((item, i) => i === index ? { ...cta, route: e.target.value } : item) })} /><Button variant="outline" onClick={() => setConfig({ next_ctas: ctas.filter((_, i) => i !== index) })}>Remove</Button></div>)}
    </section>
  );
}