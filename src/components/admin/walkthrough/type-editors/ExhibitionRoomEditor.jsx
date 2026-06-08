import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload } from "lucide-react";
import { detectMediaTypeFromUrl } from "@/lib/walkthrough-media-bindings";

export default function ExhibitionRoomEditor({ room, onChange }) {
  const config = room.exhibition_config || {};
  const setConfig = (patch) => onChange({ ...room, exhibition_config: { ...config, ...patch } });
  const upload = async (field, file) => {
    if (!file) return;
    const result = await base44.integrations.Core.UploadFile({ file });
    setConfig({ [field]: result.file_url });
  };

  return (
    <section className="space-y-4 rounded-2xl border border-primary/15 bg-primary/5 p-4">
      <h3 className="text-sm font-semibold text-primary">Walkthrough Exhibition fields</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2"><Label>Exhibition mode</Label><select value={config.exhibition_mode || "cinematic_scene"} onChange={(e) => setConfig({ exhibition_mode: e.target.value })} className="w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm"><option value="cinematic_scene">Cinematic Scene</option><option value="performance_stage">Performance Stage</option><option value="timeline">Timeline</option><option value="portal_room">Portal Room</option><option value="guided_story">Guided Story</option></select></label>
        <label className="space-y-2"><Label>Camera motion</Label><select value={config.camera_motion || "none"} onChange={(e) => setConfig({ camera_motion: e.target.value })} className="w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm"><option value="none">None</option><option value="slow_push">Slow Push</option><option value="pan_left">Pan Left</option><option value="pan_right">Pan Right</option><option value="zoom_in">Zoom In</option><option value="parallax">Parallax</option></select></label>
        <label className="space-y-2"><Label>Scene title</Label><Input value={config.scene_title || ""} onChange={(e) => setConfig({ scene_title: e.target.value })} /></label>
        <label className="space-y-2"><Label>Mood</Label><Input value={config.mood || ""} onChange={(e) => setConfig({ mood: e.target.value })} /></label>
        <label className="space-y-2 md:col-span-2"><Label>Scene narrative</Label><Textarea rows={3} value={config.scene_narrative || ""} onChange={(e) => setConfig({ scene_narrative: e.target.value })} /></label>
        <label className="space-y-2"><Label>Lighting</Label><Input value={config.lighting || ""} onChange={(e) => setConfig({ lighting: e.target.value })} /></label>
        <label className="space-y-2"><Label>Ambience audio</Label><div className="flex gap-2"><Input value={config.ambience_audio_url || ""} onChange={(e) => setConfig({ ambience_audio_url: e.target.value, ambience_audio_type: detectMediaTypeFromUrl(e.target.value, "audio") })} /><Button asChild variant="outline"><label className="cursor-pointer"><Upload className="h-4 w-4" /> Upload<input type="file" accept="audio/*" className="hidden" onChange={(e) => upload("ambience_audio_url", e.target.files?.[0])} /></label></Button></div></label>
        <label className="space-y-2 md:col-span-2"><Label>Narrator audio</Label><div className="flex gap-2"><Input value={config.narrator_audio_url || ""} onChange={(e) => setConfig({ narrator_audio_url: e.target.value, narrator_audio_type: detectMediaTypeFromUrl(e.target.value, "audio") })} /><Button asChild variant="outline"><label className="cursor-pointer"><Upload className="h-4 w-4" /> Upload<input type="file" accept="audio/*" className="hidden" onChange={(e) => upload("narrator_audio_url", e.target.files?.[0])} /></label></Button></div></label>
      </div>
    </section>
  );
}