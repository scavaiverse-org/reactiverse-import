import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Accessibility, ChevronLeft, ChevronRight, Info, Moon, Volume2, VolumeX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ThreeBackground from "@/components/layout/ThreeBackground";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { DEFAULT_MUSEUM_SLUG, museumPath } from "@/lib/domain-registry";
import { WALKTHROUGHS } from "@/lib/walkthrough-admin";
import { ensureMediaTypes, getPublicMediaSlots } from "@/lib/walkthrough-media-bindings";
import { resolveNextRoomIndex } from "@/lib/walkthrough-routing";
import { trackWalkthroughEvent } from "@/lib/walkthrough-analytics";
import { fetchPublishedManifest, getWalkthroughByIndex } from "@/lib/manifest-public";
import { useTourAccess } from "@/lib/ticket-access";
import SceneAudio from "@/components/walkthrough/SceneAudio";
import WalkthroughMediaLayer from "@/components/walkthrough/WalkthroughMediaLayer";
import ResolvedMedia from "@/components/walkthrough/ResolvedMedia";
import renderRoomByType from "@/components/walkthrough/renderers/renderRoomByType";
import { getSafeMediaUrl, getSafeNavigationUrl } from "@/lib/walkthrough-media-url";

function isAudioUrl(url = "") {
  return /\.(mp3|wav|ogg|m4a)(\?|$)/i.test(String(url));
}

function getRoomAudioUrls(room = {}) {
  const slots = getPublicMediaSlots(room || {});
  const configAmbience = room.audio_url || room.audioUrl || room.ambience_audio_url || room.ambienceAudioUrl;
  const mainMediaAudio = room.media_type === "audio" || isAudioUrl(room.media_url) ? room.media_url : "";
  const ambience = getSafeMediaUrl(slots.audio?.url || configAmbience || mainMediaAudio || "");
  const configNarration = room.narrator_audio_url || room.narratorAudioUrl || room.narration_audio_url || room.narrationAudioUrl;
  const narration = getSafeMediaUrl(slots.narration?.url || configNarration || "");
  return { ambience, narration };
}

function getRoomAudioUrl(room = {}) {
  const { ambience, narration } = getRoomAudioUrls(room);
  return ambience || narration;
}

function toAudioScene(room) {
  const { ambience, narration } = getRoomAudioUrls(room);
  return { id: room.id, title: room.title, audio_url: ambience, narration_audio_url: narration };
}

function getInteractionMedia(item = {}) {
  return getSafeMediaUrl(item.media_url || item.image_url || item.video_url || item.audio_url || item.thumbnail_url || "");
}

function getInteractionMediaType(item = {}) {
  return item.media_type || item.type || item.artifact_type || "";
}

function getInteractionRoute(item = {}) {
  return getSafeNavigationUrl(item.cta_route || item.route || item.url || "");
}

function resolveWalkthroughIndex(params) {
  if (params.walkthroughIndex) {
    const parsed = Number(params.walkthroughIndex);
    if (Number.isFinite(parsed) && parsed >= 1) return parsed;
  }
  if (params.walkthroughKey) {
    const slot = WALKTHROUGHS.indexOf(params.walkthroughKey);
    if (slot >= 0) return slot + 1;
  }
  return 1;
}

export default function Walkthrough() {
  const { tenant } = useActiveTenant();
  const navigate = useNavigate();
  const params = useParams();
  const walkthroughIndex = resolveWalkthroughIndex(params);
  const [currentRoomIndex, setCurrentRoomIndex] = useState(0);
  const [activeHotspot, setActiveHotspot] = useState(null);
  const [activeArtifact, setActiveArtifact] = useState(null);
  const [muted, setMuted] = useState(true);
  const [calmMode, setCalmMode] = useState(false);
  const [accessibilityMode, setAccessibilityMode] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const { data: manifest } = useQuery({
    queryKey: ["published-manifest", tenant?.id, tenant?.published_manifest_id],
    queryFn: () => fetchPublishedManifest(tenant),
    enabled: !!tenant?.id,
    initialData: null,
  });

  const { hasAccess, checking: checkingAccess } = useTourAccess(tenant);

  const walkthrough = getWalkthroughByIndex(manifest, walkthroughIndex);
  const rooms = useMemo(() => (walkthrough?.rooms || []).map((room) => ensureMediaTypes(room)), [walkthrough]);
  const room = rooms[Math.min(currentRoomIndex, rooms.length - 1)] || rooms[0];
  const tenantSlug = tenant?.slug || DEFAULT_MUSEUM_SLUG;
  const museumId = manifest?.museum_id || tenant?.id;
  const walkthroughKey = walkthrough?.walkthrough_key;

  const track = (eventName, data = {}) => trackWalkthroughEvent({ eventName, tenant, museumId, walkthroughKey, room, data });

  useEffect(() => { if (room) track("walkthrough_started"); }, [tenant?.id]);
  useEffect(() => {
    if (!room) return;
    setActiveHotspot(null);
    setActiveArtifact(null);
    track("walkthrough_room_viewed");
    track("walkthrough_page_type_viewed");
  }, [room?.id]);

  const goToIndex = (index) => {
    if (index < 0) {
      track("walkthrough_completed");
      navigate(museumPath(tenantSlug, "completion"));
      return;
    }
    setCurrentRoomIndex(index);
  };

  const goToRoom = (target, data = {}) => {
    track("walkthrough_choice_selected", data);
    goToIndex(resolveNextRoomIndex({ rooms, currentIndex: currentRoomIndex, target }));
  };

  const goNext = () => goToIndex(resolveNextRoomIndex({ rooms, currentIndex: currentRoomIndex, target: room?.branching?.next_room_id }));
  const goPrevious = () => currentRoomIndex === 0 ? navigate(museumPath(tenantSlug, "home")) : setCurrentRoomIndex((value) => value - 1);
  const resolveRoute = (route) => !route ? "#" : /^https?:\/\//i.test(route) ? route : route.startsWith("/") ? route : museumPath(tenantSlug, route);
  const handleChoice = (choice) => goToRoom(choice.next_room_id, { choice_id: choice.id, choice_label: choice.label });
  const handleHotspotOpen = (hotspot) => { setActiveHotspot(hotspot); track("walkthrough_hotspot_opened", { hotspot_id: hotspot.id, label: hotspot.label || hotspot.title }); };
  const handleArtifactOpen = (artifact) => { setActiveArtifact(artifact); track("walkthrough_artifact_opened", { artifact_id: artifact.id, title: artifact.title }); };
  const complete = () => { track("walkthrough_completed"); navigate(museumPath(tenantSlug, "completion")); };

  if (checkingAccess) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center text-muted-foreground">
        <p className="text-lg font-medium text-foreground">Checking your ticket…</p>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center text-muted-foreground">
        <p className="text-lg font-medium text-foreground">A ticket is required to enter this tour.</p>
        <p className="max-w-md text-sm leading-6">Tour access unlocks once your ticket is paid or confirmed. Reserve a ticket to get started, or check your reservation status on the confirmation page.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={() => navigate(museumPath(tenantSlug, "tickets"))}>Get Tickets</Button>
          <Button variant="outline" onClick={() => navigate(museumPath(tenantSlug, "tickets-5"))}>Check Reservation</Button>
          <Button variant="outline" onClick={() => navigate(museumPath(tenantSlug, "home"))}>Back to Museum Home</Button>
        </div>
      </div>
    );
  }

  if (!manifest || !walkthrough || !room) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center text-muted-foreground">
        <p className="text-lg font-medium text-foreground">This experience has not been published yet.</p>
        <Button variant="outline" onClick={() => navigate(museumPath(tenantSlug, "home"))}>Back to Museum Home</Button>
      </div>
    );
  }

  const hasRoomAudio = !!getRoomAudioUrl(room);
  const audioControlTitle = hasRoomAudio ? (muted ? "Play audio" : "Mute audio") : "No audio available for this room.";
  const context = { next: goNext, choice: handleChoice, goToRoom, activeHotspot, hotspotOpen: handleHotspotOpen, artifactOpen: handleArtifactOpen, track, complete, resolveRoute, calmMode, accessibilityMode, reducedMotion, currentRoomIndex, totalRooms: rooms.length };

  return (
    <div className={`relative min-h-screen overflow-hidden bg-background text-foreground ${calmMode ? "saturate-75 contrast-95" : ""} ${accessibilityMode ? "text-[112.5%]" : ""}`}>
      <ThreeBackground />
      {hasRoomAudio && <SceneAudio scene={toAudioScene(room)} muted={muted || calmMode} />}

      <AnimatePresence mode="wait">
        <motion.div key={room.id} initial={reducedMotion ? false : { opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={reducedMotion ? undefined : { opacity: 0, scale: 0.97 }} transition={{ duration: reducedMotion ? 0 : 0.7 }} className="absolute inset-0">
          <WalkthroughMediaLayer room={room} />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/65 to-background/25" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-background/60 text-foreground border-border/50 backdrop-blur-sm text-xs">Station {currentRoomIndex + 1} of {rooms.length}</Badge>
          <Badge variant="outline" className="bg-background/40 backdrop-blur-sm text-xs">{room.page_type?.replaceAll("_", " ")}</Badge>
          {room.accessibility?.sensory_warning && <Badge variant="outline" className="bg-amber-400/10 text-amber-100">Sensory note</Badge>}
        </div>
        <div className="flex gap-2">
          <Button size="icon" variant="ghost" className="bg-background/40 backdrop-blur-sm" onClick={() => setCalmMode(!calmMode)} title="Calm mode"><Moon className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" className="bg-background/40 backdrop-blur-sm" onClick={() => setAccessibilityMode(!accessibilityMode)} title="Accessibility mode"><Accessibility className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" className="bg-background/40 backdrop-blur-sm disabled:cursor-not-allowed disabled:opacity-45" onClick={() => hasRoomAudio && setMuted(!muted)} disabled={!hasRoomAudio} title={audioControlTitle} aria-label={audioControlTitle}>{muted || !hasRoomAudio ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}</Button>
        </div>
      </div>

      <main className="relative z-10">{renderRoomByType(room, context)}</main>

      {(activeHotspot || activeArtifact) && (() => {
        const activeItem = activeArtifact || activeHotspot;
        const mediaUrl = getInteractionMedia(activeItem);
        const mediaType = getInteractionMediaType(activeItem);
        const route = getInteractionRoute(activeItem);
        const description = activeArtifact?.long_description || activeArtifact?.description || activeHotspot?.detail || activeHotspot?.description || "More details are not configured for this item yet.";
        return (
          <div className="fixed inset-x-4 bottom-24 z-30 mx-auto max-w-xl rounded-3xl border border-white/15 bg-background/90 p-5 shadow-2xl backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-widest text-primary">{activeArtifact ? "Artifact" : "Hotspot"}</p><h2 className="mt-1 font-heading text-2xl font-semibold tracking-tight">{activeArtifact?.title || activeHotspot?.title || activeHotspot?.label}</h2></div><button className="rounded-full p-1 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary" onClick={() => { setActiveHotspot(null); setActiveArtifact(null); }}><X className="h-4 w-4" /></button></div>
            {mediaUrl ? <ResolvedMedia url={mediaUrl} mediaType={mediaType} alt={activeItem?.title || activeItem?.label || "Hotspot media"} className="mt-4 h-56 w-full rounded-2xl object-cover" controls fallbackVisual fallbackCompact /> : <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-5 text-sm text-muted-foreground">Media not available yet</div>}
            <p className="mt-3 font-body text-sm font-light leading-7 text-muted-foreground">{description}</p>
            <div className="mt-4 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => { setActiveHotspot(null); setActiveArtifact(null); }}><Info className="h-4 w-4" /> Keep Exploring</Button>{route && <Button size="sm" onClick={() => navigate(resolveRoute(route))}>{activeHotspot?.cta_label || activeArtifact?.cta_label || "Open"}</Button>}</div>
          </div>
        );
      })()}

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-background/75 p-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <Button variant="outline" onClick={goPrevious}><ChevronLeft className="h-4 w-4" /> {currentRoomIndex === 0 ? "Exit" : "Previous"}</Button>
          <div className="hidden flex-1 gap-1 px-4 sm:flex">{rooms.map((item, index) => <div key={item.id || index} className={`h-1 flex-1 rounded-full ${index <= currentRoomIndex ? "bg-primary" : "bg-white/10"}`} />)}</div>
          <Button onClick={goNext}>{currentRoomIndex === rooms.length - 1 ? "Complete Tour" : "Next"} <ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
}
