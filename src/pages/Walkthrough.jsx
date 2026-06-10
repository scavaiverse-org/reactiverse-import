import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Accessibility, ChevronLeft, ChevronRight, Info, Moon, Volume2, VolumeX, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ThreeBackground from "@/components/layout/ThreeBackground";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { DEFAULT_MUSEUM_SLUG, museumPath } from "@/lib/domain-registry";
import { WALKTHROUGHS, extractRoomsFromConfig, normalizeRooms } from "@/lib/walkthrough-admin";
import { getPublicMediaSlots, ensureMediaTypes } from "@/lib/walkthrough-media-bindings";
import { resolveNextRoomIndex } from "@/lib/walkthrough-routing";
import { trackWalkthroughEvent } from "@/lib/walkthrough-analytics";
import SceneAudio from "@/components/walkthrough/SceneAudio";
import WalkthroughMediaLayer from "@/components/walkthrough/WalkthroughMediaLayer";
import ResolvedMedia from "@/components/walkthrough/ResolvedMedia";
import renderRoomByType from "@/components/walkthrough/renderers/renderRoomByType";
import { getSafeMediaUrl, getSafeNavigationUrl } from "@/lib/walkthrough-media-url";

const fallbackScenes = [
  { title: "Arrival Hall", narrative: "Welcome to the museum. Before you stands the threshold to a world where stories have been told through song, movement, and spectacle for centuries.", image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=800&fit=crop", ambience: "Temple bells and distant music", hotspots: [{ id: "welcome", label: "Welcome Seal", title: "Welcome Seal", description: "The ceremonial seal that greets every visitor." }] },
  { title: "Five Kings Gallery", narrative: "Silk, symbol, and centuries of tradition converge here.", image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&h=800&fit=crop", ambience: "Silk rustling, gentle chimes", hotspots: [{ id: "lineage", label: "Royal Lineage", title: "Royal Lineage", description: "Ancestral stories and symbols." }] },
  { title: "Final Reflection", page_type: "finale_room", narrative: "Your journey concludes here. Pause, reflect, and choose how you would like to continue.", image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=800&fit=crop", ambience: "Reflective stillness" },
];

function resolvePageHeroSection(pageConfig = null) {
  return (pageConfig?.sections || []).find((section) => section.sectionKey === "hero") || pageConfig?.sections?.[0] || null;
}

function resolvePageConfigCtas(pageConfig = null) {
  return (pageConfig?.ctaSlots || [])
    .filter((cta) => cta?.visibility !== false && cta?.route)
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
    .map((cta, index) => ({
      id: cta.ctaKey || `page_cta_${index + 1}`,
      label: cta.label || `Action ${index + 1}`,
      route: cta.route,
      style: index === 0 ? "primary" : "secondary",
    }));
}

function resolvePageMediaUrl(pageConfig = null, mediaRecords = []) {
  const slot = (pageConfig?.mediaSlots || []).find((item) => item.sectionKey === "hero" || item.renderType === "background");
  if (slot?.mediaId) {
    const record = mediaRecords.find((item) => item.id === slot.mediaId);
    if (record?.storageUrl || record?.sourceUrl) return record.storageUrl || record.sourceUrl;
  }
  return pageConfig?.heroMedia?.fileUrl || pageConfig?.heroMedia?.url || "";
}

function createFallbackRecord(pageConfig = null, pageMediaUrl = "", walkthroughKey = "walkthrough1") {
  const heroSection = resolvePageHeroSection(pageConfig);
  const pageCtas = resolvePageConfigCtas(pageConfig);
  const pageCards = Array.isArray(pageConfig?.cards) ? pageConfig.cards.filter((card) => card?.title || card?.body || card?.description) : [];

  if (heroSection || pageCards.length) {
    const introNarrative = heroSection?.description || heroSection?.subtitle || fallbackScenes[0].narrative;
    const cardRooms = pageCards.slice(0, 2).map((card, index) => ({
      id: `config_card_${index + 1}`,
      page_type: "walkthrough_exhibition",
      order: index + 2,
      room_key: `Config${index + 2}`,
      title: card.title || `Gallery ${index + 1}`,
      narration: card.body || card.description || fallbackScenes[1].narrative,
      description: card.description || card.body || "",
      media_url: card.image_url || card.media_url || pageMediaUrl || fallbackScenes[1].image,
      background_media_url: card.image_url || card.media_url || pageMediaUrl || fallbackScenes[1].image,
      exhibition_config: {
        scene_title: card.title || `Gallery ${index + 1}`,
        scene_narrative: card.body || card.description || fallbackScenes[1].narrative,
      },
    }));

    const configuredRooms = [
      {
        id: "config_intro",
        page_type: "onboarding_guide",
        order: 1,
        room_key: "Config1",
        title: heroSection?.title || pageConfig?.pageTitle || fallbackScenes[0].title,
        narration: introNarrative,
        description: introNarrative,
        media_url: pageMediaUrl || fallbackScenes[0].image,
        background_media_url: pageMediaUrl || fallbackScenes[0].image,
        onboarding_config: {
          intro_text: introNarrative,
          guide_name: heroSection?.eyebrow || "Guide",
          choices: [],
        },
      },
      ...(cardRooms.length ? cardRooms : [{
        id: "config_gallery",
        page_type: "walkthrough_exhibition",
        order: 2,
        room_key: "Config2",
        title: pageConfig?.pageName || fallbackScenes[1].title,
        narration: introNarrative,
        description: introNarrative,
        media_url: pageMediaUrl || fallbackScenes[1].image,
        background_media_url: pageMediaUrl || fallbackScenes[1].image,
        exhibition_config: {
          scene_title: pageConfig?.pageName || fallbackScenes[1].title,
          scene_narrative: introNarrative,
        },
      }]),
      {
        id: "config_finale",
        page_type: "finale_room",
        order: cardRooms.length ? cardRooms.length + 2 : 3,
        room_key: `Config${cardRooms.length ? cardRooms.length + 2 : 3}`,
        title: pageConfig?.pageTitle || fallbackScenes[2].title,
        narration: pageConfig?.seo?.description || heroSection?.subtitle || fallbackScenes[2].narrative,
        description: pageConfig?.seo?.description || heroSection?.subtitle || fallbackScenes[2].narrative,
        media_url: pageMediaUrl || fallbackScenes[2].image,
        background_media_url: pageMediaUrl || fallbackScenes[2].image,
        finale_config: {
          achievement_title: pageConfig?.pageTitle || "Journey Complete",
          completion_message: pageConfig?.seo?.description || heroSection?.subtitle || fallbackScenes[2].narrative,
          next_ctas: pageCtas,
        },
        ctas: pageCtas,
      },
    ];

    return { walkthrough_key: walkthroughKey, walkthrough_config: { version: 3, walkthrough_key: walkthroughKey, rooms: configuredRooms } };
  }

  return { walkthrough_key: walkthroughKey, walkthrough_config: { version: 3, walkthrough_key: walkthroughKey, rooms: fallbackScenes.map((scene, index) => ({ ...scene, id: `fallback_${index + 1}`, page_type: scene.page_type || "walkthrough_exhibition", order: index + 1, room_key: `Fallback${index + 1}`, title: scene.title, narration: scene.narrative, media_url: scene.image, background_media_url: scene.image, finale_config: { completion_message: scene.narrative, achievement_title: "Journey Complete" } })) } };
}

function isAudioUrl(url = "") {
  return /\.(mp3|wav|ogg|m4a)(\?|$)/i.test(String(url));
}

function getRoomAudioUrl(room = {}) {
  const audioSlot = getPublicMediaSlots(room || {}).audio;
  const configAudio = room.audio_url || room.audioUrl || room.narration_audio_url || room.narrationAudioUrl || room.ambience_audio_url || room.ambienceAudioUrl;
  const mainMediaAudio = room.media_type === "audio" || isAudioUrl(room.media_url) ? room.media_url : "";
  return getSafeMediaUrl(audioSlot?.url || configAudio || mainMediaAudio || "");
}

function toAudioScene(room) {
  return { id: room.id, title: room.title, audio_url: getRoomAudioUrl(room) };
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

export default function Walkthrough() {
  const { tenant } = useActiveTenant();
  const navigate = useNavigate();
  const { walkthroughKey: routeWalkthroughKey } = useParams();
  const walkthroughKey = WALKTHROUGHS.includes(routeWalkthroughKey) ? routeWalkthroughKey : WALKTHROUGHS[0];
  const [currentRoomIndex, setCurrentRoomIndex] = useState(0);
  const [activeHotspot, setActiveHotspot] = useState(null);
  const [activeArtifact, setActiveArtifact] = useState(null);
  const [muted, setMuted] = useState(true);
  const [calmMode, setCalmMode] = useState(false);
  const [accessibilityMode, setAccessibilityMode] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const { data: experienceConfigs = [] } = useQuery({
    queryKey: ["public-walkthrough-config", tenant?.id, walkthroughKey],
    queryFn: () => tenant ? base44.entities.ExperienceConfig.filter({ tenant_id: tenant.id, module_key: "walkthrough", walkthrough_key: walkthroughKey, status: "published" }, "-updated_at", 10) : Promise.resolve([]),
    enabled: !!tenant?.id,
    initialData: [],
  });

  const { data: pageConfigs = [] } = useQuery({
    queryKey: ["public-walkthrough-page-config", tenant?.id],
    queryFn: () => tenant ? base44.entities.MuseumPageConfig.filter({ tenantId: tenant.id, pageKey: "walkthrough", publishState: "published" }, "-lastPublishedAt", 1) : Promise.resolve([]),
    enabled: !!tenant?.id,
    initialData: [],
  });

  const { data: tenantMedia = [] } = useQuery({
    queryKey: ["public-walkthrough-page-media", tenant?.id],
    queryFn: () => tenant ? base44.entities.TenantMedia.filter({ tenantId: tenant.id, publishState: "published" }, "-updatedAt", 50) : Promise.resolve([]),
    enabled: !!tenant?.id,
    initialData: [],
  });

  const tenantSafeConfigs = experienceConfigs.filter((config) => {
    const configWalkthroughKey = config.walkthrough_key || config.walkthrough_config?.walkthrough_key || walkthroughKey;
    return (!config.museum_id || config.museum_id === tenant?.id) && configWalkthroughKey === walkthroughKey;
  });
  const pageConfig = pageConfigs[0] || null;
  const pageHeroSection = useMemo(() => resolvePageHeroSection(pageConfig), [pageConfig]);
  const pageCtas = useMemo(() => resolvePageConfigCtas(pageConfig), [pageConfig]);
  const pageMediaUrl = useMemo(() => resolvePageMediaUrl(pageConfig, tenantMedia), [pageConfig, tenantMedia]);
  const record = tenantSafeConfigs.find((config) => config.status === "published") || createFallbackRecord(pageConfig, pageMediaUrl, walkthroughKey);
  const rooms = useMemo(() => normalizeRooms(extractRoomsFromConfig(record, walkthroughKey), walkthroughKey).filter((room) => room.visibility !== "hidden"), [record?.id, record?.updated_at, record?.last_updated, record?.walkthrough_config?.updated_at, walkthroughKey]);
  const room = rooms[Math.min(currentRoomIndex, rooms.length - 1)] || rooms[0];
  const resolvedRoom = useMemo(() => {
    if (!room) return room;
    const pageNarrative = pageHeroSection?.description || pageHeroSection?.subtitle || "";
    const ctas = room.ctas?.length ? room.ctas : pageCtas;
    return ensureMediaTypes({
      ...room,
      title: room.title || pageHeroSection?.title || pageConfig?.pageTitle || fallbackScenes[0].title,
      narration: room.narration || pageNarrative || room.description,
      description: room.description || pageNarrative || room.narration,
      media_url: room.media_url || pageMediaUrl || "",
      background_media_url: room.background_media_url || pageMediaUrl || room.media_url || "",
      accessibility: {
        ...(room.accessibility || {}),
        alt_text: room.accessibility?.alt_text || pageHeroSection?.title || pageConfig?.pageTitle || room.title || "Walkthrough media",
      },
      ctas,
      finale_config: {
        ...(room.finale_config || {}),
        next_ctas: room.finale_config?.next_ctas?.length ? room.finale_config.next_ctas : ctas,
      },
    });
  }, [room, pageHeroSection, pageConfig, pageMediaUrl, pageCtas]);
  const tenantSlug = tenant?.slug || DEFAULT_MUSEUM_SLUG;
  const museumId = record?.museum_id || tenant?.id;

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

  if (!resolvedRoom) return <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">No walkthrough rooms available.</div>;

  const hasRoomAudio = !!getRoomAudioUrl(resolvedRoom);
  const audioControlTitle = hasRoomAudio ? (muted ? "Play audio" : "Mute audio") : "No audio available for this room.";
  const context = { next: goNext, choice: handleChoice, goToRoom, activeHotspot, hotspotOpen: handleHotspotOpen, artifactOpen: handleArtifactOpen, track, complete, resolveRoute, calmMode, accessibilityMode, reducedMotion };

  return (
    <div className={`relative min-h-screen overflow-hidden bg-background text-foreground ${calmMode ? "saturate-75 contrast-95" : ""} ${accessibilityMode ? "text-[112.5%]" : ""}`}>
      <ThreeBackground />
      {hasRoomAudio && <SceneAudio scene={toAudioScene(resolvedRoom)} muted={muted || calmMode} />}

      <AnimatePresence mode="wait">
        <motion.div key={resolvedRoom.id} initial={reducedMotion ? false : { opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={reducedMotion ? undefined : { opacity: 0, scale: 0.97 }} transition={{ duration: reducedMotion ? 0 : 0.7 }} className="absolute inset-0">
          <WalkthroughMediaLayer room={resolvedRoom} />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/65 to-background/25" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-background/60 text-foreground border-border/50 backdrop-blur-sm text-xs">Station {currentRoomIndex + 1} of {rooms.length}</Badge>
          <Badge variant="outline" className="bg-background/40 backdrop-blur-sm text-xs">{resolvedRoom.page_type?.replaceAll("_", " ")}</Badge>
          {resolvedRoom.accessibility?.sensory_warning && <Badge variant="outline" className="bg-amber-400/10 text-amber-100">Sensory note</Badge>}
        </div>
        <div className="flex gap-2">
          <Button size="icon" variant="ghost" className="bg-background/40 backdrop-blur-sm" onClick={() => setCalmMode(!calmMode)} title="Calm mode"><Moon className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" className="bg-background/40 backdrop-blur-sm" onClick={() => setAccessibilityMode(!accessibilityMode)} title="Accessibility mode"><Accessibility className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" className="bg-background/40 backdrop-blur-sm disabled:cursor-not-allowed disabled:opacity-45" onClick={() => hasRoomAudio && setMuted(!muted)} disabled={!hasRoomAudio} title={audioControlTitle} aria-label={audioControlTitle}>{muted || !hasRoomAudio ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}</Button>
        </div>
      </div>

      <main className="relative z-10">{renderRoomByType(resolvedRoom, context)}</main>

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