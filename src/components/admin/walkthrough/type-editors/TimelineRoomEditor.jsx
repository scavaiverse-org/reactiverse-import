import { base44 } from "@/api/base44Client";
import { uploadFile } from "@/lib/upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { detectMediaTypeFromFile, detectMediaTypeFromUrl } from "@/lib/walkthrough-media-bindings";
import ScrollableImageControls from "../ScrollableImageControls";

const newEvent = () => ({ id: crypto.randomUUID(), date: "", title: "Milestone", description: "", media_url: "", media_type: "image" });

export default function TimelineRoomEditor({ room, onChange }) {
  const config = room.timeline_config || {};
  const events = config.events || [];
  const setConfig = (patch) => onChange({ ...room, timeline_config: { ...config, ...patch } });
  const updateEvent = (index, patch) => setConfig({ events: events.map((item, i) => i === index ? { ...item, ...patch } : item) });
  const upload = async (index, file) => {
    if (!file) return;
    const result = await uploadFile(file);
    updateEvent(index, { media_url: result.file_url, media_type: detectMediaTypeFromFile(file) });
  };

  return (
    <section className="space-y-4 rounded-2xl border border-primary/15 bg-primary/5 p-4">
      <h3 className="text-sm font-semibold text-primary">Timeline Room fields</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2"><Label>Timeline title</Label><Input value={config.timeline_title || ""} onChange={(e) => setConfig({ timeline_title: e.target.value })} /></label>
        <label className="space-y-2"><Label>Chronology mode</Label><select value={config.chronology_mode || "linear"} onChange={(e) => setConfig({ chronology_mode: e.target.value })} className="w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm"><option value="linear">Linear (as entered)</option><option value="reverse">Reverse chronological</option><option value="thematic">Thematic grouping</option></select></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={config.show_progression_line !== false} onChange={(e) => setConfig({ show_progression_line: e.target.checked })} /> Show progression line</label>
      </div>
      <div className="flex items-center justify-between"><p className="text-xs uppercase tracking-widest text-muted-foreground">Events</p><Button size="sm" variant="outline" onClick={() => setConfig({ events: [...events, newEvent()] })}>Add event</Button></div>
      {events.map((event, index) => (
        <div key={event.id || index} className="grid gap-2 rounded-xl border border-white/10 bg-background/40 p-3 md:grid-cols-4">
          <Input value={event.date || ""} placeholder="Date" onChange={(e) => updateEvent(index, { date: e.target.value })} />
          <Input value={event.title || ""} placeholder="Title" onChange={(e) => updateEvent(index, { title: e.target.value })} />
          <Input className="md:col-span-2" value={event.description || ""} placeholder="Description" onChange={(e) => updateEvent(index, { description: e.target.value })} />
          <select value={event.media_type || "image"} onChange={(e) => updateEvent(index, { media_type: e.target.value })} className="rounded-lg border border-input bg-secondary px-3 py-2 text-sm"><option value="image">Image</option><option value="video">Video</option><option value="audio">Audio</option></select>
          <div className="flex gap-2 md:col-span-3"><Input value={event.media_url || ""} placeholder="Event media URL" onChange={(e) => updateEvent(index, { media_url: e.target.value, media_type: detectMediaTypeFromUrl(e.target.value, event.media_type) })} /><Button asChild variant="outline"><label className="cursor-pointer"><Upload className="h-4 w-4" /> Upload<input type="file" className="hidden" accept="image/*,video/*,audio/*" onChange={(e) => upload(index, e.target.files?.[0])} /></label></Button></div>
          <div className="md:col-span-4"><ScrollableImageControls value={event} mediaType={event.media_type} onChange={(patch) => updateEvent(index, patch)} /></div>
        </div>
      ))}
    </section>
  );
}