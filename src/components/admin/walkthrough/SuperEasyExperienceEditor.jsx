import { useState } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, ImagePlus, Loader2, Upload, Wand2 } from "lucide-react";
import { uploadFile } from "@/lib/upload";
import { Button } from "@/components/ui/button";
import { deterministicAnalyzeMedia, mediaAnalysisToCanonicalRoom } from "@/lib/experience-append-protection";
import { evaluateExperienceReadiness, evaluateRoomReadiness } from "@/lib/walkthrough-readiness";
import { analyzeRoomMedia } from "@/lib/walkthrough-media-validation";
import ScrollableImageControls from "./ScrollableImageControls";
import HelpHint from "./HelpHint";


const acceptTypes = "image/*,video/*,audio/*,.glb,.gltf,.usdz,.png,.jpg,.jpeg,.mp4,.webm";

export default function SuperEasyExperienceEditor({ rooms = [], activeRoom = 0, walkthroughKey, onRoomsChange, onActiveRoomChange, onSaveDraft, onAutoFillWholeMuseum, onSwitchToEasy, onPublish, saving }) {
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [brokenMediaUrls, setBrokenMediaUrls] = useState(() => new Set());
  const uploadRoomMedia = async (index, file) => {
    if (!file) return;
    setUploadingIndex(index);
    setUploadError(null);
    try {
      const result = await uploadFile(file);
      const analysis = deterministicAnalyzeMedia({ fileName: file.name, fileUrl: result.file_url, index });
      const mediaValidation = analyzeRoomMedia({ fileName: file.name, fileUrl: result.file_url });
      const built = mediaAnalysisToCanonicalRoom({ analysis, fileUrl: result.file_url, index, walkthroughKey, existingRoom: rooms[index] });
      // Quarantine invalid (screenshot/email) media instead of counting it as ready.
      const nextRoom = mediaValidation.status === "rejected"
        ? {
            ...built,
            media_url: "",
            background_media_url: "",
            media_file_name: file.name,
            media_validation: mediaValidation,
            invalid_media_archive: [
              ...(rooms[index]?.invalid_media_archive || []),
              { url: result.file_url, reason: mediaValidation.reason, detected_at: new Date().toISOString(), previous_field: "media_url" },
            ],
          }
        : { ...built, media_file_name: file.name, media_validation: mediaValidation };
      const nextRooms = index < rooms.length ? rooms.map((room, roomIndex) => roomIndex === index ? nextRoom : room) : [...rooms, nextRoom];
      setBrokenMediaUrls((prev) => {
        if (!prev.has(result.file_url)) return prev;
        const next = new Set(prev);
        next.delete(result.file_url);
        return next;
      });
      onRoomsChange?.(nextRooms);
      onActiveRoomChange?.(index);
      onSaveDraft?.(nextRooms);
    } catch (error) {
      setUploadError(error?.message || "Upload failed. Please try again.");
    } finally {
      setUploadingIndex(null);
    }
  };
  const markMediaBroken = (url) => {
    if (!url) return;
    setBrokenMediaUrls((prev) => (prev.has(url) ? prev : new Set(prev).add(url)));
  };

  const updateRoom = (patch) => {
    if (!rooms[activeRoom]) return;
    const nextRooms = rooms.map((room, index) => index === activeRoom ? { ...room, ...patch } : room);
    onRoomsChange?.(nextRooms);
  };

  const addRoom = () => {
    onActiveRoomChange?.(rooms.length);
  };

  const next = () => {
    if (activeRoom < Math.max(rooms.length - 1, 0)) onActiveRoomChange?.(activeRoom + 1);
    else addRoom();
  };

  const visibleRooms = [...rooms, { title: `Room ${rooms.length + 1}`, media_url: "", isUploadPlaceholder: true }];
  const currentRoom = visibleRooms[activeRoom] || visibleRooms[0];
  const readiness = evaluateExperienceReadiness(rooms);
  const readyCount = readiness.readyCount;
  const activeValidation = currentRoom && !currentRoom.isUploadPlaceholder ? currentRoom.media_validation : null;

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-primary/20 bg-gradient-to-br from-primary/15 via-white/[0.045] to-cyan-400/10 p-5 md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-center">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary"><Wand2 className="h-4 w-4" /> Very Easy Museum Builder <HelpHint title="Very Easy Museum Builder">Upload media for each room, or click "Auto Fill Whole Museum" to generate a complete starter museum with rooms, story, and accessibility text. When the rooms below show "Ready", you can publish straight away.</HelpHint></p>
            <h2 className="font-display text-4xl font-bold md:text-5xl">Auto-fill the whole museum. Review only if you want. Then publish.</h2>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">One button fills the full museum with rooms, media, story, alt text, onboarding, and ending. You can publish immediately.</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/20 p-4 text-sm">
            <div className="flex items-center gap-2 text-emerald-300"><CheckCircle2 className="h-4 w-4" /> {readyCount} of {readiness.total || 0} room{readiness.total === 1 ? "" : "s"} ready</div>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-300">{readyCount} ready</span>
              {readiness.needsReviewCount > 0 && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-300">{readiness.needsReviewCount} needs review</span>}
              {readiness.blockedCount > 0 && <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-rose-300">{readiness.blockedCount} needs media/fix</span>}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Your museum can be auto-created now. Uploaded media is used first.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-4 md:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-primary">Room {activeRoom + 1}</p>
              <h3 className="font-display text-2xl font-bold">{currentRoom?.title || "Upload room media"}</h3>
            </div>
          </div>

          <div className="mb-4 grid gap-3 rounded-2xl border border-primary/20 bg-primary/10 p-4 text-center">
            <p className="text-sm font-semibold text-primary">Whole museum auto-fill</p>
            <p className="text-xs text-muted-foreground">Creates Start, Gallery, and Ending rooms with safe media, story, routes, and accessibility.</p>
            <Button size="lg" onClick={onAutoFillWholeMuseum} disabled={saving} className="mx-auto w-full max-w-sm"><Wand2 className="h-5 w-5" /> Auto Fill Whole Museum</Button>
          </div>

          <label className="flex min-h-[340px] cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed border-primary/30 bg-black/20 p-6 text-center transition hover:border-primary hover:bg-primary/5">
            {uploadingIndex === activeRoom ? <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" /> : currentRoom?.media_url && !brokenMediaUrls.has(currentRoom.media_url) ? <img src={currentRoom.media_url} alt={currentRoom.title || "Uploaded room media"} loading="lazy" className="mb-5 max-h-56 rounded-2xl object-cover" onError={() => markMediaBroken(currentRoom.media_url)} /> : <ImagePlus className="mb-5 h-16 w-16 text-primary" />}
            <span className="text-2xl font-bold">Room Media Upload</span>
            <span className="mt-2 max-w-md text-sm text-muted-foreground">Drop in an image, video, audio, or 3D file. We build the room automatically.</span>
            <input type="file" className="hidden" accept={acceptTypes} onChange={(event) => uploadRoomMedia(activeRoom, event.target.files?.[0])} />
          </label>

          {uploadError && (
            <div className="mt-4 flex items-start gap-2 rounded-2xl border border-rose-400/30 bg-rose-400/10 p-3 text-xs text-rose-100">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Upload failed: {uploadError}</span>
            </div>
          )}

          {currentRoom?.media_url && brokenMediaUrls.has(currentRoom.media_url) && (
            <div className="mt-4 flex items-start gap-2 rounded-2xl border border-rose-400/30 bg-rose-400/10 p-3 text-xs text-rose-100">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>This room's media couldn't be loaded from storage. Try uploading it again.</span>
            </div>
          )}

          {activeValidation?.status === "rejected" && (
            <div className="mt-4 flex items-start gap-2 rounded-2xl border border-rose-400/30 bg-rose-400/10 p-3 text-xs text-rose-100">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{activeValidation.reason} Upload a room, gallery, artifact, stage, exhibit, wall, hall, or cultural object. The previous file was moved to review and does not count as a ready room.</span>
            </div>
          )}

          {currentRoom && !currentRoom.isUploadPlaceholder && (
            <div className="mt-4 rounded-2xl border border-white/10 bg-background/40 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-primary">Preview</p>
                  <h4 className="mt-1 font-display text-xl font-bold">{currentRoom.title || "Museum room"}</h4>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-300">Ready</span>
              </div>
              {currentRoom.description && <p className="mt-3 text-sm leading-6 text-muted-foreground">{currentRoom.description}</p>}
              <button type="button" onClick={onSwitchToEasy} className="mt-3 text-xs text-primary underline underline-offset-4">Need more control? Switch to Easy mode.</button>
            </div>
          )}

          {currentRoom && !currentRoom.isUploadPlaceholder && currentRoom.media_url && (
            <div className="mt-4">
              <ScrollableImageControls
                value={currentRoom}
                mediaType={currentRoom.media_type || "image"}
                originalUrl={currentRoom.media_url}
                onChange={updateRoom}
                simple
                title="Make this image scrollable left/right"
              />
              <p className="mt-2 text-xs text-muted-foreground">Use this when your image is a wide room, wall, mural, gallery, map, scenery, or panoramic exhibit. Safe defaults are used automatically.</p>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" className="h-14 flex-1 text-base" onClick={next}><ArrowRight className="h-5 w-5" /> NEXT</Button>
            <Button size="lg" variant="outline" className="h-14 flex-1 text-base" onClick={() => onSaveDraft?.(rooms)} disabled={saving}><Upload className="h-5 w-5" /> Save Draft</Button>
            <Button size="lg" className="h-14 flex-1 bg-emerald-500 text-base text-white hover:bg-emerald-600" onClick={onPublish} disabled={saving}>{rooms.length ? "Publish Museum" : "Auto Fill & Publish"}</Button>
          </div>
        </div>

        <div className="space-y-3">
          {visibleRooms.map((room, index) => {
            const roomState = room.isUploadPlaceholder ? { status: "placeholder" } : evaluateRoomReadiness(room);
            const stateLabel = roomState.status === "ready" ? "Ready" : roomState.status === "needs_review" ? "Needs review" : roomState.status === "blocked" ? "Needs media" : "Needs upload";
            const stateColor = roomState.status === "ready" ? "text-emerald-300" : roomState.status === "needs_review" ? "text-amber-300" : "text-rose-300";
            return (
            <button key={room.id || room.room_key || index} onClick={() => onActiveRoomChange?.(index)} className={`w-full rounded-2xl border p-3 text-left transition ${index === activeRoom ? "border-primary bg-primary/10" : "border-white/10 bg-white/[0.03]"}`}>
              <div className="flex items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-black/30">
                  {room.media_url && !brokenMediaUrls.has(room.media_url) ? <img src={room.media_url} alt={room.title || "Room"} loading="lazy" className="h-full w-full object-cover" onError={() => markMediaBroken(room.media_url)} /> : <ImagePlus className="h-6 w-6 text-muted-foreground" />}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{room.title || `Room ${index + 1}`}</p>
                  <p className={`text-xs ${stateColor}`}>{stateLabel}</p>
                </div>
              </div>
            </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}