import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { uploadFile } from "@/lib/upload";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import PageTypeSelector from "./PageTypeSelector";
import OnboardingGuideEditor from "./type-editors/OnboardingGuideEditor";
import ArtifactRoomEditor from "./type-editors/ArtifactRoomEditor";
import ExhibitionRoomEditor from "./type-editors/ExhibitionRoomEditor";
import GamificationPageEditor from "./type-editors/GamificationPageEditor";
import ReflectionChamberEditor from "./type-editors/ReflectionChamberEditor";
import AIConversationRoomEditor from "./type-editors/AIConversationRoomEditor";
import PerformanceStageEditor from "./type-editors/PerformanceStageEditor";
import TimelineRoomEditor from "./type-editors/TimelineRoomEditor";
import ArchiveRoomEditor from "./type-editors/ArchiveRoomEditor";
import BranchingChoiceRoomEditor from "./type-editors/BranchingChoiceRoomEditor";
import MemoryCollectionRoomEditor from "./type-editors/MemoryCollectionRoomEditor";
import FinaleRoomEditor from "./type-editors/FinaleRoomEditor";
import MediaRenderCheck from "./MediaRenderCheck";
import MediaUploadStatus from "./MediaUploadStatus";
import ScrollableImageControls from "./ScrollableImageControls";
import MuseumModeEditor from "./MuseumModeEditor";
import { ensureTypeConfigs, PAGE_TYPES } from "@/lib/walkthrough-room-types";
import { scoreWalkthroughQuality } from "@/lib/walkthrough-quality-scoring";
import { detectMediaTypeFromFile, detectMediaTypeFromUrl, ensureMediaTypes } from "@/lib/walkthrough-media-bindings";

const newHotspot = () => ({ id: crypto.randomUUID(), label: "Hotspot", x: 50, y: 50, title: "", description: "", cta_label: "", cta_route: "" });
const newCta = () => ({ id: crypto.randomUUID(), label: "Continue", route: "", action_type: "next_room", style: "primary" });

const typeEditors = {
  onboarding_guide: OnboardingGuideEditor,
  artifact_room: ArtifactRoomEditor,
  walkthrough_exhibition: ExhibitionRoomEditor,
  gamification_page: GamificationPageEditor,
  reflection_chamber: ReflectionChamberEditor,
  ai_conversation_room: AIConversationRoomEditor,
  performance_stage: PerformanceStageEditor,
  timeline_room: TimelineRoomEditor,
  archive_room: ArchiveRoomEditor,
  branching_choice_room: BranchingChoiceRoomEditor,
  memory_collection_room: MemoryCollectionRoomEditor,
  finale_room: FinaleRoomEditor,
};

export default function WalkthroughRoomEditor({ room, onChange, hasError = false }) {
  const [tab, setTab] = useState("basic");
  const [uploadStates, setUploadStates] = useState({});
  if (!room) return null;

  const setRoom = (nextRoom) => onChange(ensureMediaTypes(ensureTypeConfigs(nextRoom)));
  const setField = (field, value) => setRoom({ ...room, [field]: value });
  const setMediaUrl = (field, value, explicitTypeField) => {
    const typeField = explicitTypeField || (field === "media_url" ? "media_type" : field.replace(/_url$/, "_type"));
    setRoom({ ...room, [field]: value, [typeField]: value ? detectMediaTypeFromUrl(value, room[typeField]) : room[typeField] });
  };
  const setUploadState = (field, state) => setUploadStates((prev) => ({ ...prev, [field]: { ...(prev[field] || {}), ...state } }));
  const updateList = (field, index, value) => setRoom({ ...room, [field]: (room[field] || []).map((item, i) => i === index ? value : item) });
  const removeList = (field, index) => setRoom({ ...room, [field]: (room[field] || []).filter((_, i) => i !== index) });
  const setAccessibility = (field, value) => setField("accessibility", { ...(room.accessibility || {}), [field]: value });
  const setAdaptive = (field, value) => setField("adaptive_modes", { ...(room.adaptive_modes || {}), [field]: value });
  const setBranching = (field, value) => setField("branching", { ...(room.branching || {}), [field]: value });
  const quality = scoreWalkthroughQuality([room]);

  const uploadMedia = async (field, file) => {
    if (!file) return;
    setUploadState(field, { status: "uploading", progress: 8, message: "Preparing upload…", fileName: file.name });
    const timer = window.setInterval(() => {
      setUploadStates((prev) => {
        const current = prev[field] || {};
        if (current.status !== "uploading") return prev;
        return { ...prev, [field]: { ...current, progress: Math.min((current.progress || 8) + 12, 92), message: "Uploading…" } };
      });
    }, 450);

    try {
      const result = await uploadFile(file);
      window.clearInterval(timer);
      const detectedType = detectMediaTypeFromFile(file);
      const typeField = field === "media_url" ? "media_type" : field.replace(/_url$/, "_type");
      setUploadState(field, { status: "complete", progress: 100, message: "Upload complete", fileName: file.name });
      setRoom({ ...room, [field]: result.file_url, [typeField]: detectedType });
    } catch (error) {
      window.clearInterval(timer);
      setUploadState(field, { status: "error", progress: 100, message: "Upload failed", fileName: file.name });
      throw error;
    }
  };

  const TypeEditor = typeEditors[room.page_type || "walkthrough_exhibition"] || ExhibitionRoomEditor;

  return (
    <div className={`overflow-hidden rounded-3xl border bg-white/[0.035] shadow-2xl shadow-black/10 ${hasError ? "animate-error-glow border-destructive" : "border-white/10"}`}>
      <div className="flex flex-col gap-4 border-b border-white/10 bg-gradient-to-r from-primary/10 to-transparent p-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-2xl font-bold">{room.title || room.room_key}</h2>
            <span className="rounded-full border border-white/10 bg-background/50 px-2 py-1 text-xs text-muted-foreground">{room.room_key}</span>
            <span className="rounded-full border border-white/10 bg-background/50 px-2 py-1 text-xs text-muted-foreground">Order {room.order}</span>
            <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-xs text-primary">{room.visibility || "draft"}</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Changing room type preserves shared fields and keeps old type-specific config hidden, not deleted.</p>
        </div>
        <PageTypeSelector value={room.page_type} onChange={(pageType) => setRoom({ ...room, page_type: pageType })} />
      </div>

      <div className="border-b border-white/10 px-5 pt-4">
        <div className="flex flex-wrap gap-2">
          {["basic", "advanced", "preview"].map((item) => <button key={item} onClick={() => setTab(item)} className={`rounded-full px-4 py-2 text-xs font-semibold capitalize transition ${tab === item ? "bg-primary text-primary-foreground" : "bg-white/5 text-muted-foreground hover:text-foreground"}`}>{item}</button>)}
        </div>
      </div>

      <div className="space-y-6 p-5">
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
          Current type: {PAGE_TYPES[room.page_type || "walkthrough_exhibition"]?.label}. Type-specific fields from other room states are preserved in storage.
        </div>

        {tab === "basic" && (
          <>
            <section className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2"><Label>Room title</Label><Input value={room.title || ""} onChange={(e) => setField("title", e.target.value)} /></label>
              <label className="space-y-2"><Label>Visibility</Label><select value={room.visibility || "draft"} onChange={(e) => setField("visibility", e.target.value)} className="w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm"><option value="draft">Draft</option><option value="published">Published</option><option value="hidden">Hidden</option></select></label>
              <label className="space-y-2"><Label>Media type</Label><select value={room.media_type || "image"} onChange={(e) => setField("media_type", e.target.value)} className="w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm"><option value="image">Image</option><option value="video">Video</option><option value="audio">Audio</option><option value="model_3d">3D Model</option><option value="panorama">Panorama</option><option value="none">None</option></select></label>
              <label className="space-y-2"><Label>Transition</Label><select value={room.transition_type || "fade"} onChange={(e) => setField("transition_type", e.target.value)} className="w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm"><option value="fade">Fade</option><option value="slide">Slide</option><option value="cinematic_zoom">Cinematic Zoom</option><option value="portal">Portal</option><option value="none">None</option></select></label>
              <label className="space-y-2 md:col-span-2"><Label>Subtitle</Label><Input value={room.subtitle || ""} onChange={(e) => setField("subtitle", e.target.value)} /></label>
              <label className="space-y-2 md:col-span-2"><Label>Narration</Label><Textarea rows={3} value={room.narration || ""} onChange={(e) => setField("narration", e.target.value)} /></label>
              <label className="space-y-2 md:col-span-2"><Label>Description</Label><Textarea rows={2} value={room.description || ""} onChange={(e) => setField("description", e.target.value)} /></label>
            </section>

            <section className="grid gap-4 rounded-2xl border border-white/10 bg-background/30 p-4 md:grid-cols-2">
              <h3 className="md:col-span-2 text-sm font-semibold">Media & Files</h3>
              <p className="md:col-span-2 text-xs text-muted-foreground">Uploaded files and pasted URLs save to the same canonical fields used by the public visitor walkthrough.</p>
              <label className="space-y-2 md:col-span-2"><Label>Main media</Label><div className="flex gap-2"><Input value={room.media_url || ""} onChange={(e) => setMediaUrl("media_url", e.target.value)} placeholder="Image, video, audio, PDF, YouTube/Vimeo, or external URL" /><Button asChild variant="outline"><label className="cursor-pointer"><Upload className="h-4 w-4" /> Upload<input type="file" className="hidden" accept="image/*,video/*,audio/*,.pdf" onChange={(e) => uploadMedia("media_url", e.target.files?.[0])} /></label></Button></div></label>
              <label className="space-y-2"><Label>Background media</Label><div className="flex gap-2"><Input value={room.background_media_url || ""} onChange={(e) => setMediaUrl("background_media_url", e.target.value)} placeholder="Background image or video URL" /><Button asChild variant="outline"><label className="cursor-pointer"><Upload className="h-4 w-4" /> Upload<input type="file" className="hidden" accept="image/*,video/*" onChange={(e) => uploadMedia("background_media_url", e.target.files?.[0])} /></label></Button></div></label>
              <label className="space-y-2"><Label>Foreground media</Label><div className="flex gap-2"><Input value={room.foreground_media_url || ""} onChange={(e) => setMediaUrl("foreground_media_url", e.target.value)} placeholder="Foreground overlay image or video URL" /><Button asChild variant="outline"><label className="cursor-pointer"><Upload className="h-4 w-4" /> Upload<input type="file" className="hidden" accept="image/*,video/*" onChange={(e) => uploadMedia("foreground_media_url", e.target.files?.[0])} /></label></Button></div></label>
              <label className="space-y-2"><Label>Audio URL</Label><div className="flex gap-2"><Input value={room.audio_url || ""} onChange={(e) => setMediaUrl("audio_url", e.target.value, "audio_type")} placeholder="Scene audio URL" /><Button asChild variant="outline"><label className="cursor-pointer"><Upload className="h-4 w-4" /> Upload<input type="file" className="hidden" accept="audio/*" onChange={(e) => uploadMedia("audio_url", e.target.files?.[0])} /></label></Button></div></label>
              <label className="space-y-2"><Label>Narrator audio URL</Label><div className="flex gap-2"><Input value={room.narrator_audio_url || ""} onChange={(e) => setMediaUrl("narrator_audio_url", e.target.value, "narrator_audio_type")} placeholder="Narrator audio URL" /><Button asChild variant="outline"><label className="cursor-pointer"><Upload className="h-4 w-4" /> Upload<input type="file" className="hidden" accept="audio/*" onChange={(e) => uploadMedia("narrator_audio_url", e.target.files?.[0])} /></label></Button></div></label>
              <MediaUploadStatus uploads={uploadStates} />
              <div className="md:col-span-2 space-y-4">
                <ScrollableImageControls value={room} mediaType={room.background_media_url ? room.background_media_type : room.media_type} onChange={setRoom} originalUrl={room.background_media_url || room.media_url} />
                <MuseumModeEditor room={room} onChange={setRoom} />
              </div>
              <div className="md:col-span-2"><MediaRenderCheck room={room} /></div>
            </section>
            <TypeEditor room={room} onChange={setRoom} />
          </>
        )}

        {tab === "advanced" && (
          <>
            <section className="grid gap-4 rounded-2xl border border-white/10 bg-background/30 p-4 md:grid-cols-3">
              <h3 className="md:col-span-3 text-sm font-semibold">Experience metrics</h3>
              {["emotional_intensity", "curiosity_level", "educational_density", "interaction_density", "sensory_intensity", "estimated_duration_seconds"].map((field) => <label key={field} className="space-y-2"><Label>{field.replaceAll("_", " ")}</Label><Input type="number" value={room[field] || 0} onChange={(e) => setField(field, Number(e.target.value))} /></label>)}
              <label className="space-y-2"><Label>Mood</Label><Input value={room.mood || ""} onChange={(e) => setField("mood", e.target.value)} /></label>
              <label className="space-y-2"><Label>Lighting</Label><Input value={room.lighting || ""} onChange={(e) => setField("lighting", e.target.value)} /></label>
              <label className="space-y-2"><Label>Camera motion</Label><Input value={room.camera_motion || ""} onChange={(e) => setField("camera_motion", e.target.value)} /></label>
            </section>

            <section className="space-y-4 rounded-2xl border border-white/10 bg-background/30 p-4">
              <ScrollableImageControls value={room} mediaType={room.background_media_url ? room.background_media_type : room.media_type} onChange={setRoom} advanced originalUrl={room.background_media_url || room.media_url} />
              <MuseumModeEditor room={room} onChange={setRoom} advanced />
            </section>

            <section className="grid gap-4 rounded-2xl border border-white/10 bg-background/30 p-4 md:grid-cols-2">
              <h3 className="md:col-span-2 text-sm font-semibold">Branching and adaptive modes</h3>
              <label className="space-y-2"><Label>Next room id/key</Label><Input value={room.branching?.next_room_id || ""} onChange={(e) => setBranching("next_room_id", e.target.value)} /></label>
              <label className="space-y-2"><Label>Fallback room id/key</Label><Input value={room.branching?.fallback_room_id || ""} onChange={(e) => setBranching("fallback_room_id", e.target.value)} /></label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!room.branching?.required} onChange={(e) => setBranching("required", e.target.checked)} /> Required room</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={room.adaptive_modes?.calm_mode !== false} onChange={(e) => setAdaptive("calm_mode", e.target.checked)} /> Calm mode</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={room.adaptive_modes?.reduced_motion !== false} onChange={(e) => setAdaptive("reduced_motion", e.target.checked)} /> Reduced motion</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={room.adaptive_modes?.accessibility_mode !== false} onChange={(e) => setAdaptive("accessibility_mode", e.target.checked)} /> Accessibility mode</label>
            </section>

            <section className="grid gap-4 rounded-2xl border border-white/10 bg-background/30 p-4 md:grid-cols-2">
              <h3 className="md:col-span-2 text-sm font-semibold">Accessibility</h3>
              <label className="space-y-2"><Label>Alt text</Label><Input value={room.accessibility?.alt_text || ""} onChange={(e) => setAccessibility("alt_text", e.target.value)} /></label>
              <label className="space-y-2"><Label>Sensory warning</Label><Input value={room.accessibility?.sensory_warning || ""} onChange={(e) => setAccessibility("sensory_warning", e.target.value)} /></label>
              <label className="space-y-2 md:col-span-2"><Label>Transcript</Label><Textarea rows={2} value={room.accessibility?.transcript || ""} onChange={(e) => setAccessibility("transcript", e.target.value)} /></label>
            </section>

            <div className="space-y-3">
              <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Hotspots</h3><Button size="sm" variant="outline" onClick={() => setField("hotspots", [...(room.hotspots || []), newHotspot()])}>Add hotspot</Button></div>
              {(room.hotspots || []).map((hotspot, index) => <div key={hotspot.id || index} className="grid gap-2 rounded-xl border border-white/10 bg-background/40 p-3 md:grid-cols-7"><Input className="md:col-span-2" value={hotspot.title || ""} placeholder="Title" onChange={(e) => updateList("hotspots", index, { ...hotspot, title: e.target.value, label: e.target.value })} /><Input type="number" value={hotspot.x || 0} placeholder="X %" onChange={(e) => updateList("hotspots", index, { ...hotspot, x: Number(e.target.value) })} /><Input type="number" value={hotspot.y || 0} placeholder="Y %" onChange={(e) => updateList("hotspots", index, { ...hotspot, y: Number(e.target.value) })} /><Input value={hotspot.cta_label || ""} placeholder="CTA label" onChange={(e) => updateList("hotspots", index, { ...hotspot, cta_label: e.target.value })} /><Input value={hotspot.cta_route || ""} placeholder="CTA route (e.g. /museum/route or room key)" onChange={(e) => updateList("hotspots", index, { ...hotspot, cta_route: e.target.value })} /><Button variant="outline" onClick={() => removeList("hotspots", index)}>Remove</Button><Textarea className="md:col-span-7" rows={2} value={hotspot.description || ""} placeholder="Description" onChange={(e) => updateList("hotspots", index, { ...hotspot, description: e.target.value })} /></div>)}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">CTAs</h3><Button size="sm" variant="outline" onClick={() => setField("ctas", [...(room.ctas || []), newCta()])}>Add CTA</Button></div>
              {(room.ctas || []).map((cta, index) => <div key={cta.id || index} className="grid gap-2 rounded-xl border border-white/10 bg-background/40 p-3 md:grid-cols-[1fr_1fr_auto]"><Input value={cta.label || ""} placeholder="Label" onChange={(e) => updateList("ctas", index, { ...cta, label: e.target.value })} /><Input value={cta.route || ""} placeholder="Route or target room" onChange={(e) => updateList("ctas", index, { ...cta, route: e.target.value })} /><Button variant="outline" onClick={() => removeList("ctas", index)}>Remove</Button></div>)}
            </div>
          </>
        )}

        {tab === "preview" && (
          <section className="grid gap-4 md:grid-cols-4">
            {Object.entries(quality).filter(([key]) => !["errors", "warnings"].includes(key)).map(([key, value]) => <div key={key} className="rounded-2xl border border-white/10 bg-background/40 p-4"><p className="text-[10px] uppercase tracking-widest text-muted-foreground">{key.replaceAll("_", " ")}</p><p className="mt-2 font-display text-3xl font-bold text-primary">{value}</p></div>)}
          </section>
        )}
      </div>
    </div>
  );
}