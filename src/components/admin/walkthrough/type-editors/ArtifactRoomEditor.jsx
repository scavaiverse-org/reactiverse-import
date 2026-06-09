import { base44 } from "@/api/base44Client";
import { uploadFile } from "@/lib/upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Loader2 } from "lucide-react";
import { useState } from "react";
import { detectMediaTypeFromFile, detectMediaTypeFromUrl } from "@/lib/walkthrough-media-bindings";
import ScrollableImageControls from "../ScrollableImageControls";
import MuseumModeEditor from "../MuseumModeEditor";
import MuseumSpriteUploader from "../MuseumSpriteUploader";

const newArtifact = () => ({ id: crypto.randomUUID(), title: "Artifact", description: "", artifact_type: "image", media_url: "", thumbnail_url: "", year: "", origin: "", creator: "", cultural_context: "", long_description: "", ai_caption: "", hotspot_x: 50, hotspot_y: 50, action_type: "panel", cta_label: "", cta_route: "" });

export default function ArtifactRoomEditor({ room, onChange }) {
  const config = room.artifact_config || {};
  const artifacts = config.artifacts || [];
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const setConfig = (patch) => onChange({ ...room, artifact_config: { ...config, ...patch } });
  const updateArtifact = (index, patch) => setConfig({ artifacts: artifacts.map((item, i) => i === index ? { ...item, ...patch } : item) });
  const uploadArtifact = async (index, file) => {
    if (!file) return;
    setUploadingIndex(index);
    setUploadError("");
    try {
      const result = await uploadFile(file);
      updateArtifact(index, { media_url: result.file_url, artifact_type: detectMediaTypeFromFile(file) });
    } catch {
      setUploadError("Upload failed. Try a smaller file or another format.");
    } finally {
      setUploadingIndex(null);
    }
  };

  return (
    <section className="space-y-4 rounded-2xl border border-primary/15 bg-primary/5 p-4">
      <MuseumModeEditor room={room} onChange={onChange} advanced />
      <h3 className="text-sm font-semibold text-primary">Normal Artifact Room fields</h3>
      <div className="grid gap-4 md:grid-cols-4">
        <label className="space-y-2 md:col-span-2"><Label>Room layout</Label><select value={config.room_layout || "spotlight"} onChange={(e) => setConfig({ room_layout: e.target.value })} className="w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm"><option value="grid">Grid</option><option value="spotlight">Spotlight</option><option value="gallery_wall">Gallery Wall</option><option value="archive_table">Archive Table</option><option value="immersive_room">Immersive Room</option></select></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={config.show_artifact_cards !== false} onChange={(e) => setConfig({ show_artifact_cards: e.target.checked })} /> Cards</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={config.allow_ask_ai !== false} onChange={(e) => setConfig({ allow_ask_ai: e.target.checked })} /> Ask AI</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={config.allow_zoom !== false} onChange={(e) => setConfig({ allow_zoom: e.target.checked })} /> Zoom</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!config.allow_save_artifact} onChange={(e) => setConfig({ allow_save_artifact: e.target.checked })} /> Save artifact</label>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between"><h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Artifacts</h4><Button size="sm" variant="outline" onClick={() => setConfig({ artifacts: [...artifacts, newArtifact()] })}>Add artifact</Button></div>
        {artifacts.map((artifact, index) => (
          <div key={artifact.id || index} className="grid gap-2 rounded-xl border border-white/10 bg-background/40 p-3 md:grid-cols-4">
            <Input value={artifact.title || ""} onChange={(e) => updateArtifact(index, { title: e.target.value })} placeholder="Title" />
            <select value={artifact.artifact_type || "image"} onChange={(e) => updateArtifact(index, { artifact_type: e.target.value })} className="rounded-lg border border-input bg-secondary px-3 py-2 text-sm"><option value="image">Image</option><option value="video">Video</option><option value="audio">Audio</option><option value="document">Document</option><option value="object">Object</option><option value="external_link">External Link</option></select>
            <Input value={artifact.year || ""} onChange={(e) => updateArtifact(index, { year: e.target.value })} placeholder="Year" />
            <Button variant="outline" onClick={() => setConfig({ artifacts: artifacts.filter((_, i) => i !== index) })}>Remove</Button>
            <div className="flex gap-2 md:col-span-4"><Input value={artifact.media_url || ""} onChange={(e) => updateArtifact(index, { media_url: e.target.value, artifact_type: detectMediaTypeFromUrl(e.target.value, artifact.artifact_type) })} placeholder="Artifact media URL" /><Button asChild variant="outline" disabled={uploadingIndex === index}><label className="cursor-pointer">{uploadingIndex === index ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} {uploadingIndex === index ? "Uploading…" : "Upload"}<input type="file" className="hidden" accept="image/*,video/*,audio/*,.pdf" onChange={(e) => uploadArtifact(index, e.target.files?.[0])} /></label></Button></div>
            {uploadError && uploadingIndex === null && <p className="md:col-span-4 text-xs text-amber-300">{uploadError}</p>}
            <div className="md:col-span-4 flex flex-wrap items-center gap-2">
              <MuseumSpriteUploader
                label="Prepare Sprite"
                existingSprite={artifact}
                onSpriteReady={(sprite) => updateArtifact(index, { ...sprite, title: artifact.title, description: artifact.description, year: artifact.year, origin: artifact.origin, creator: artifact.creator })}
              />
              <span className="text-xs text-muted-foreground">Upload an artifact image and we will cut out the main object for you.</span>
            </div>
            <div className="md:col-span-4"><ScrollableImageControls value={artifact} mediaType={artifact.artifact_type} onChange={(patch) => updateArtifact(index, patch)} /></div>
            <Input value={artifact.origin || ""} onChange={(e) => updateArtifact(index, { origin: e.target.value })} placeholder="Origin" />
            <Input value={artifact.creator || ""} onChange={(e) => updateArtifact(index, { creator: e.target.value })} placeholder="Creator" />
            <Input type="number" value={artifact.hotspot_x ?? ""} onChange={(e) => updateArtifact(index, { hotspot_x: e.target.value === "" ? "" : Number(e.target.value) })} placeholder="X %" />
            <Input type="number" value={artifact.hotspot_y ?? ""} onChange={(e) => updateArtifact(index, { hotspot_y: e.target.value === "" ? "" : Number(e.target.value) })} placeholder="Y %" />
            <Textarea className="md:col-span-2" value={artifact.description || ""} onChange={(e) => updateArtifact(index, { description: e.target.value })} placeholder="Description" />
            <Textarea className="md:col-span-2" value={artifact.cultural_context || ""} onChange={(e) => updateArtifact(index, { cultural_context: e.target.value })} placeholder="Cultural context" />
            <label className="space-y-2"><Label>On click</Label><select value={artifact.action_type || "panel"} onChange={(e) => updateArtifact(index, { action_type: e.target.value })} className="w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm"><option value="panel">Open info panel</option><option value="cta">Call to action</option><option value="link">External link</option><option value="none">No action</option></select></label>
            {(artifact.action_type === "cta" || artifact.action_type === "link") && <Input value={artifact.cta_label || ""} onChange={(e) => updateArtifact(index, { cta_label: e.target.value })} placeholder="Button label" />}
            {(artifact.action_type === "cta" || artifact.action_type === "link") && <Input className="md:col-span-2" value={artifact.cta_route || ""} onChange={(e) => updateArtifact(index, { cta_route: e.target.value })} placeholder={artifact.action_type === "link" ? "https://… external URL" : "/museum/route or destination"} />}
          </div>
        ))}
      </div>
    </section>
  );
}