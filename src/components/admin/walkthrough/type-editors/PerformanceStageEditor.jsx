import { uploadFile } from "@/lib/upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload } from "lucide-react";
import { detectMediaTypeFromFile, detectMediaTypeFromUrl } from "@/lib/walkthrough-media-bindings";
import ScrollableImageControls from "../ScrollableImageControls";

export default function PerformanceStageEditor({ room, onChange }) {
  const config = room.performance_config || {};
  const setConfig = (patch) => onChange({ ...room, performance_config: { ...config, ...patch } });
  const upload = async (file) => {
    if (!file) return;
    try {
      const result = await uploadFile(file);
      setConfig({ performance_media_url: result.file_url, performance_media_type: detectMediaTypeFromFile(file) });
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  return (
    <section className="grid gap-4 rounded-2xl border border-primary/15 bg-primary/5 p-4 md:grid-cols-2">
      <h3 className="md:col-span-2 text-sm font-semibold text-primary">Performance Stage fields</h3>
      <label className="space-y-2"><Label>Stage title</Label><Input value={config.stage_title || ""} onChange={(e) => setConfig({ stage_title: e.target.value })} /></label>
      <label className="space-y-2"><Label>Performance media type</Label><select value={config.performance_media_type || "video"} onChange={(e) => setConfig({ performance_media_type: e.target.value })} className="w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm"><option value="video">Video</option><option value="audio">Audio</option><option value="image">Image</option></select></label>
      <label className="space-y-2 md:col-span-2"><Label>Performance media URL</Label><div className="flex gap-2"><Input value={config.performance_media_url || ""} onChange={(e) => setConfig({ performance_media_url: e.target.value, performance_media_type: detectMediaTypeFromUrl(e.target.value, config.performance_media_type) })} /><Button asChild variant="outline"><label className="cursor-pointer"><Upload className="h-4 w-4" /> Upload<input type="file" className="hidden" accept="image/*,video/*,audio/*" onChange={(e) => upload(e.target.files?.[0])} /></label></Button></div></label>
      <div className="md:col-span-2"><ScrollableImageControls value={config} mediaType={config.performance_media_type} onChange={setConfig} /></div>
      <label className="space-y-2 md:col-span-2"><Label>Script</Label><Textarea rows={3} value={config.script_text || ""} onChange={(e) => setConfig({ script_text: e.target.value })} /></label>
      <label className="space-y-2 md:col-span-2"><Label>Lyrics</Label><Textarea rows={3} value={config.lyrics_text || ""} onChange={(e) => setConfig({ lyrics_text: e.target.value })} /></label>
      <label className="space-y-2 md:col-span-2"><Label>Translation</Label><Textarea rows={3} value={config.translation_text || ""} onChange={(e) => setConfig({ translation_text: e.target.value })} /></label>
    </section>
  );
}