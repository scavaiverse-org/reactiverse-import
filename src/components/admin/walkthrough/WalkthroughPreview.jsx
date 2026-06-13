import { useMemo, useState } from "react";
import { Accessibility, ChevronLeft, ChevronRight, EyeOff, Eye, Info, Moon, MonitorSmartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import renderRoomByType from "@/components/walkthrough/renderers/renderRoomByType";
import WalkthroughMediaLayer from "@/components/walkthrough/WalkthroughMediaLayer";
import ResolvedMedia from "@/components/walkthrough/ResolvedMedia";
import { PAGE_TYPES } from "@/lib/walkthrough-room-types";
import { DEFAULT_MUSEUM_SLUG, museumPath } from "@/lib/domain-registry";
import { resolveNextRoomIndex } from "@/lib/walkthrough-routing";
import { compileVisibleRooms } from "@/lib/manifest-compiler";
import { getSafeMediaUrl, getSafeNavigationUrl } from "@/lib/walkthrough-media-url";

function getInteractionMedia(item = {}) {
  return getSafeMediaUrl(item.media_url || item.image_url || item.video_url || item.audio_url || item.thumbnail_url || "");
}

function getInteractionMediaType(item = {}) {
  return item.media_type || item.type || item.artifact_type || "";
}

function getInteractionRoute(item = {}) {
  return getSafeNavigationUrl(item.cta_route || item.route || item.url || "");
}

/**
 * Mirrors the public Walkthrough page: same context shape passed to
 * renderRoomByType (currentRoomIndex/totalRooms/calmMode/accessibilityMode/
 * reducedMotion/resolveRoute/etc.) and the same Station badge / progress bar /
 * Previous-Next chrome, so what an admin sees here is what a paying visitor
 * sees on the live walkthrough.
 *
 * Determinism: the preview renders through the EXACT compiled room set a real
 * publish produces (compileVisibleRooms) — same filtering, ordering, station
 * numbering, and stripped fields used by "Test Publish" and the live manifest —
 * so the preview can never drift from what visitors actually walk. A published
 * room previews inside the live walk at its true position; a draft/hidden room
 * (not part of the live walk) previews on its own with an honest notice.
 */
export default function WalkthroughPreview({ room, rooms = [], activeIndex = 0, tenantSlug, walkthroughKey = "walkthrough1", onNavigateRoom }) {
  const [activeHotspot, setActiveHotspot] = useState(null);
  const [activeArtifact, setActiveArtifact] = useState(null);
  const [calmMode, setCalmMode] = useState(false);
  const [accessibilityMode, setAccessibilityMode] = useState(false);

  const compiledRooms = useMemo(() => compileVisibleRooms(rooms, walkthroughKey), [rooms, walkthroughKey]);
  const compiledIndex = useMemo(
    () => compiledRooms.findIndex((entry) => entry.room_key === room?.room_key),
    [compiledRooms, room?.room_key]
  );

  if (!room) return null;

  const slug = tenantSlug || DEFAULT_MUSEUM_SLUG;
  // Published rooms preview inside the live walk; draft/hidden rooms (excluded
  // from the compiled set, exactly as a publish would exclude them) preview
  // standalone so the tenant is never shown a misleading "Station X of Y".
  const inLiveWalk = compiledIndex >= 0;
  const previewRooms = inLiveWalk ? compiledRooms : [room];
  const currentRoomIndex = inLiveWalk ? compiledIndex : 0;
  const previewRoom = previewRooms[currentRoomIndex];
  const pageType = previewRoom.page_type || "walkthrough_exhibition";

  const resolveRoute = (route) => !route ? "#" : /^https?:\/\//i.test(route) ? route : route.startsWith("/") ? route : museumPath(slug, route);

  const goToIndex = (index) => {
    if (index < 0 || index >= previewRooms.length) return;
    setActiveHotspot(null);
    setActiveArtifact(null);
    // Standalone (draft/hidden) preview has no neighbours to navigate to.
    if (!inLiveWalk) return;
    // Map the compiled-walk position back to the raw editor index so the active
    // room selection stays correct in the editor.
    const targetKey = previewRooms[index]?.room_key;
    const rawIndex = rooms.findIndex((entry) => entry.room_key === targetKey);
    onNavigateRoom?.(rawIndex >= 0 ? rawIndex : activeIndex);
  };

  const goToRoom = (target) => goToIndex(resolveNextRoomIndex({ rooms: previewRooms, currentIndex: currentRoomIndex, target }));
  const goNext = () => goToIndex(resolveNextRoomIndex({ rooms: previewRooms, currentIndex: currentRoomIndex, target: previewRoom?.branching?.next_room_id }));
  const goPrevious = () => goToIndex(currentRoomIndex - 1);
  const handleChoice = (choice) => goToRoom(choice.next_room_id);
  const handleHotspotOpen = (hotspot) => setActiveHotspot(hotspot);
  const handleArtifactOpen = (artifact) => setActiveArtifact(artifact);

  const context = {
    next: goNext,
    choice: handleChoice,
    goToRoom,
    activeHotspot,
    hotspotOpen: handleHotspotOpen,
    artifactOpen: handleArtifactOpen,
    track: () => {},
    complete: () => {},
    resolveRoute,
    calmMode,
    accessibilityMode,
    reducedMotion: false,
    currentRoomIndex,
    totalRooms: previewRooms.length,
  };

  const activeItem = activeArtifact || activeHotspot;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-sm font-semibold">
        <span className="flex items-center gap-2"><Eye className="h-4 w-4 text-primary" /> Shared live preview · {PAGE_TYPES[pageType]?.label}</span>
        <span className="flex items-center gap-2 text-xs text-muted-foreground"><MonitorSmartphone className="h-4 w-4" /> {previewRoom.museum_mode_enabled || previewRoom.artifact_placement_enabled ? "Museum Mode active" : previewRoom.scrollable_image_enabled ? "Scrollable image active · drag left/right to preview" : "Normal image"}</span>
      </div>
      {inLiveWalk ? (
        <p className="mb-3 flex items-center gap-1.5 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-[11px] text-emerald-200">
          <Eye className="h-3.5 w-3.5" /> Exactly what visitors walk — same rooms, order, and station numbers as the published tour.
        </p>
      ) : (
        <p className="mb-3 flex items-center gap-1.5 rounded-xl border border-amber-400/25 bg-amber-400/10 px-3 py-1.5 text-[11px] text-amber-200">
          <EyeOff className="h-3.5 w-3.5" /> This room is <strong className="mx-1 uppercase">{room.visibility || "draft"}</strong> — it isn't part of the live walk yet. Set its visibility to Published to include it.
        </p>
      )}
      <div className={`relative max-h-[580px] overflow-hidden rounded-2xl border border-white/10 bg-background ${calmMode ? "saturate-75 contrast-95" : ""} ${accessibilityMode ? "text-[112.5%]" : ""}`}>
        <div className="absolute inset-0"><WalkthroughMediaLayer room={previewRoom} /></div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/65 to-background/25" />

        <div className="relative z-20 flex flex-wrap items-center justify-between gap-2 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-background/60 text-foreground border-border/50 backdrop-blur-sm text-xs">{inLiveWalk ? `Station ${currentRoomIndex + 1} of ${previewRooms.length}` : "Not in live walk"}</Badge>
            <Badge variant="outline" className="bg-background/40 backdrop-blur-sm text-xs">{previewRoom.page_type?.replaceAll("_", " ")}</Badge>
            {previewRoom.accessibility?.sensory_warning && <Badge variant="outline" className="bg-amber-400/10 text-amber-100">Sensory note</Badge>}
          </div>
          <div className="flex gap-2">
            <Button size="icon" variant="ghost" className="h-8 w-8 bg-background/40 backdrop-blur-sm" onClick={() => setCalmMode((value) => !value)} title="Calm mode"><Moon className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 bg-background/40 backdrop-blur-sm" onClick={() => setAccessibilityMode((value) => !value)} title="Accessibility mode"><Accessibility className="h-4 w-4" /></Button>
          </div>
        </div>

        <div className="relative z-10 max-h-[460px] overflow-y-auto pb-16">
          {renderRoomByType(previewRoom, context)}
        </div>

        {activeItem && (() => {
          const mediaUrl = getInteractionMedia(activeItem);
          const mediaType = getInteractionMediaType(activeItem);
          const route = getInteractionRoute(activeItem);
          const description = activeArtifact?.long_description || activeArtifact?.description || activeHotspot?.detail || activeHotspot?.description || "More details are not configured for this item yet.";
          return (
            <div className="absolute inset-x-4 bottom-20 z-30 mx-auto max-w-xl rounded-3xl border border-white/15 bg-background/90 p-5 shadow-2xl backdrop-blur-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-primary">{activeArtifact ? "Artifact" : "Hotspot"}</p>
                  <h2 className="mt-1 font-heading text-xl font-semibold tracking-tight">{activeArtifact?.title || activeHotspot?.title || activeHotspot?.label}</h2>
                </div>
                <button className="rounded-full p-1 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary" onClick={() => { setActiveHotspot(null); setActiveArtifact(null); }}><X className="h-4 w-4" /></button>
              </div>
              {mediaUrl ? <ResolvedMedia url={mediaUrl} mediaType={mediaType} alt={activeItem?.title || activeItem?.label || "Hotspot media"} className="mt-4 h-40 w-full rounded-2xl object-cover" controls fallbackVisual fallbackCompact /> : <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-5 text-sm text-muted-foreground">Media not available yet</div>}
              <p className="mt-3 font-body text-sm font-light leading-7 text-muted-foreground">{description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => { setActiveHotspot(null); setActiveArtifact(null); }}><Info className="h-4 w-4" /> Keep Exploring</Button>
                {route && <Button size="sm" disabled title={resolveRoute(route)}>{activeHotspot?.cta_label || activeArtifact?.cta_label || "Open"}</Button>}
              </div>
            </div>
          );
        })()}

        <div className="absolute inset-x-0 bottom-0 z-20 border-t border-white/10 bg-background/75 p-3 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <Button size="sm" variant="outline" onClick={goPrevious} disabled={currentRoomIndex === 0}><ChevronLeft className="h-4 w-4" /> Previous</Button>
            <div className="hidden flex-1 gap-1 px-4 sm:flex">{previewRooms.map((item, index) => <div key={item.id || index} className={`h-1 flex-1 rounded-full ${index <= currentRoomIndex ? "bg-primary" : "bg-white/10"}`} />)}</div>
            <Button size="sm" onClick={goNext} disabled={currentRoomIndex === previewRooms.length - 1}>{currentRoomIndex === previewRooms.length - 1 ? "Complete Tour" : "Next"} <ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
    </div>
  );
}
