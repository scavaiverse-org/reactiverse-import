import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { DEFAULT_ROOM_PREVIEW_CONFIG } from "@/lib/room-preview-defaults";
import { publicExperienceFilter } from "@/lib/tenant-query";
import SpriteLayer from "@/components/room-preview/SpriteLayer";
import { Bot, Info, Maximize2, Sparkles, Ticket, Volume2, VolumeX, Wand2, X } from "lucide-react";

function HotspotButton({ hotspot, onOpen, motionStyle, disabledMotion }) {
  return (
    <button
      type="button"
      aria-label={hotspot.label}
      onClick={() => onOpen(hotspot)}
      className="absolute min-h-11 min-w-11 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/60 bg-primary/15 shadow-[0_0_24px_hsl(210_18%_82%_/_0.20)] backdrop-blur-sm transition hover:bg-primary/25 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
      style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%`, transform: `${motionStyle} translate(-50%, -50%)` }}
    >
      <span className="block h-3 w-3 rounded-full bg-primary mx-auto" />
      <span className="sr-only">{hotspot.label}</span>
    </button>
  );
}

function StoryPanel({ hotspot, onClose, onRoute, largeText }) {
  if (!hotspot) return null;
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm" onClick={onClose}>
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-0 left-0 right-0 mx-auto max-w-2xl rounded-t-3xl border border-white/15 bg-black/80 p-5 text-white shadow-2xl sm:bottom-auto sm:left-auto sm:right-6 sm:top-24 sm:rounded-3xl sm:p-6"
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-primary/80">Story Point</p>
              <h2 className={`${largeText ? "text-3xl" : "text-2xl"} mt-2 font-heading font-semibold tracking-tight`}>{hotspot.title}</h2>
            </div>
            <button type="button" onClick={onClose} aria-label="Close story panel" className="min-h-11 min-w-11 rounded-full border border-white/15 bg-white/10 text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-primary">
              <X className="mx-auto h-5 w-5" />
            </button>
          </div>
          <p className={`${largeText ? "text-base" : "text-sm"} leading-7 text-white/80`}>{hotspot.description}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => onRoute(hotspot.primary_cta_route)} className="min-h-11 bg-primary text-primary-foreground">{hotspot.primary_cta_label}</Button>
            <Button onClick={() => onRoute(hotspot.secondary_cta_route)} variant="outline" className="min-h-11 border-white/20 bg-white/10 text-white hover:bg-white/20">{hotspot.secondary_cta_label}</Button>
            <Button onClick={onClose} variant="ghost" className="min-h-11 text-white hover:bg-white/10">Close</Button>
          </div>
        </div>
      </div>
    </>
  );
}

function ComfortControls({ reducedMotion, calmMode, largeText, setReducedMotion, setCalmMode, setLargeText }) {
  const controls = [
    ["Reduced motion", reducedMotion, setReducedMotion],
    ["Calm mode", calmMode, setCalmMode],
    ["Larger text", largeText, setLargeText],
  ];
  return (
    <div className="fixed bottom-28 right-3 z-20 w-[min(92vw,220px)] rounded-2xl border border-white/12 bg-black/45 p-3 text-xs text-white backdrop-blur-xl sm:bottom-5 sm:right-5">
      <p className="mb-2 font-semibold text-white/90">Comfort</p>
      <div className="space-y-2">
        {controls.map(([label, enabled, setter]) => (
          <button key={label} type="button" onClick={() => setter(!enabled)} className="flex min-h-11 w-full items-center justify-between rounded-xl bg-white/8 px-3 py-2 text-left hover:bg-white/14 focus:outline-none focus:ring-2 focus:ring-primary">
            <span>{label}</span>
            <span className={`h-5 w-9 rounded-full p-0.5 transition ${enabled ? "bg-primary" : "bg-white/20"}`}><span className={`block h-4 w-4 rounded-full bg-white transition ${enabled ? "translate-x-4" : ""}`} /></span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function RoomPreview() {
  const navigate = useNavigate();
  const { tenant } = useActiveTenant();
  const { data: configs = [] } = useQuery({
    queryKey: ["public-room-preview-config", tenant?.id],
    queryFn: () => tenant ? base44.entities.ExperienceConfig.filter(publicExperienceFilter(tenant.id)) : Promise.resolve([]),
    enabled: !!tenant,
  });
  const roomConfig = configs[0]?.room_preview_config || DEFAULT_ROOM_PREVIEW_CONFIG;
  const [activeHotspot, setActiveHotspot] = useState(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [muted, setMuted] = useState(true);
  const [infoOpen, setInfoOpen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(roomConfig.reduced_motion_default || false);
  const [calmMode, setCalmMode] = useState(roomConfig.calm_mode_default || false);
  const [largeText, setLargeText] = useState(false);
  const [aiSprites, setAiSprites] = useState(null);

  const disabledMotion = reducedMotion;
  const hotspots = Array.isArray(roomConfig.hotspots) ? roomConfig.hotspots : DEFAULT_ROOM_PREVIEW_CONFIG.hotspots;
  const sprites = aiSprites || (Array.isArray(roomConfig.visual_sprites) ? roomConfig.visual_sprites : DEFAULT_ROOM_PREVIEW_CONFIG.visual_sprites);
  const parallax = useMemo(() => ({ x: mouse.x, y: mouse.y }), [mouse]);
  const layerMove = (depth) => disabledMotion ? "translate3d(0,0,0)" : `translate3d(${parallax.x * depth}px, ${parallax.y * depth}px, 0)`;
  const routeTo = (route) => navigate(route || "/walkthrough");

  useEffect(() => {
    setReducedMotion(!!roomConfig.reduced_motion_default);
    setCalmMode(!!roomConfig.calm_mode_default);
  }, [configs[0]?.id, configs[0]?.updated_date]);

  const spriteLayoutMutation = useMutation({
    mutationFn: async () => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const prompt = `Suggest a cinematic 2.5D visual sprite layout for this Asian Operatic Museum room preview. Return ONLY a JSON object with a "sprites" array — no explanation, no markdown. Each sprite must have: id (string), label (string), type (one of: glow shimmer warmth shadow ring), x (number 0-100), y (number 0-100), width (number), height (number), opacity (number 0-1). Return 5 to 8 sprites. Room title: ${roomConfig.title}. Hotspots: ${hotspots.map(h => `${h.label} at ${h.x},${h.y}`).join("; ")}.`;
      const res = await fetch(`${supabaseUrl}/functions/v1/cultural-guide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, guide_name: "SpriteAI", personality: "precise, returns only valid JSON" }),
      });
      if (!res.ok) return null;
      const data = await res.json().catch(() => null);
      const text = data?.text || "";
      const match = text.match(/\{[\s\S]*\}/);
      return match ? JSON.parse(match[0]) : null;
    },
    onSuccess: (result) => {
      const nextSprites = result?.sprites || result?.data?.sprites;
      if (Array.isArray(nextSprites) && nextSprites.length) setAiSprites(nextSprites);
    }
  });

  const handleMouseMove = (event) => {
    if (disabledMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setMouse({ x: event.clientX - rect.left - rect.width / 2, y: event.clientY - rect.top - rect.height / 2 });
  };

  if (roomConfig.enabled === false) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black p-6 text-center text-white">
        <div className="max-w-md rounded-3xl border border-white/15 bg-white/8 p-6 backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">Room Preview</p>
          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight">Room preview is currently closed.</h1>
          <p className="mt-3 text-sm text-white/70">You can still begin the museum walkthrough.</p>
          <Button onClick={() => routeTo('/walkthrough')} className="mt-5 bg-primary text-primary-foreground">Begin Walkthrough</Button>
        </div>
      </main>
    );
  }

  return (
    <main onMouseMove={handleMouseMove} className={`relative h-screen w-full overflow-hidden bg-black text-white ${largeText ? "text-lg" : ""}`}>
      <div className="absolute inset-0 scale-105 bg-cover bg-center transform-gpu transition-transform duration-300" style={{ backgroundImage: `url(${roomConfig.background_image_url || DEFAULT_ROOM_PREVIEW_CONFIG.background_image_url})`, transform: `${layerMove(0.02)} scale(1.05)` }} />
      <div className="absolute inset-0 bg-black/45" />
      <div className={`absolute inset-0 ${calmMode ? "opacity-45" : "opacity-100"}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_48%,rgba(210,218,228,0.07),transparent_25%),radial-gradient(circle_at_52%_30%,rgba(180,190,204,0.10),transparent_28%),linear-gradient(to_top,rgba(0,0,0,0.72),transparent_55%)]" />
        <div className="absolute inset-0 shadow-[inset_0_0_140px_rgba(0,0,0,0.85)]" />
      </div>
      <SpriteLayer sprites={sprites} motionStyle={layerMove} disabledMotion={disabledMotion} calmMode={calmMode} />

      <section className="relative z-10 flex h-full flex-col justify-between p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="max-w-[min(92vw,560px)] rounded-2xl border border-white/12 bg-black/35 p-4 backdrop-blur-xl">
            <Badge className="mb-3 border-primary/30 bg-primary/10 text-primary">Room Preview</Badge>
            <h1 className={`${largeText ? "text-4xl" : "text-2xl sm:text-4xl"} font-heading font-semibold tracking-tight`}>{roomConfig.title}</h1>
            <p className="mt-2 max-w-lg font-body text-sm font-light text-muted-foreground sm:text-base">{roomConfig.subtitle}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button size="icon" variant="outline" className="min-h-11 min-w-11 border-white/20 bg-black/35 text-white hover:bg-white/15" onClick={() => setMuted(!muted)} aria-label="Sound"><>{muted ? <VolumeX /> : <Volume2 />}</></Button>
            <Button size="icon" variant="outline" className="min-h-11 min-w-11 border-white/20 bg-black/35 text-white hover:bg-white/15" onClick={() => setInfoOpen(!infoOpen)} aria-label="Info"><Info /></Button>
            <Button size="icon" variant="outline" disabled={spriteLayoutMutation.isPending} className="min-h-11 min-w-11 border-white/20 bg-black/35 text-white hover:bg-white/15 disabled:opacity-50" onClick={() => spriteLayoutMutation.mutate()} aria-label="Suggest sprite layout"><Wand2 /></Button>
            <Button size="icon" variant="outline" className="hidden min-h-11 min-w-11 border-white/20 bg-black/35 text-white hover:bg-white/15 sm:inline-flex" onClick={() => document.documentElement.requestFullscreen?.()} aria-label="Fullscreen"><Maximize2 /></Button>
          </div>
        </div>

        <div className="absolute inset-0 z-0">
          {hotspots.map((hotspot) => <HotspotButton key={hotspot.id} hotspot={hotspot} onOpen={setActiveHotspot} motionStyle={layerMove(0.10)} disabledMotion={disabledMotion} />)}
        </div>

        {infoOpen && <div className="relative z-20 max-w-md rounded-2xl border border-white/12 bg-black/55 p-4 text-sm text-white/80 backdrop-blur-xl">Tap a glowing marker to learn about the room, then choose your next step.</div>}

        <div className="relative z-10 flex flex-col gap-3 pb-2 sm:flex-row sm:items-end sm:justify-between">
          <p className="rounded-full border border-border/40 bg-background/50 px-4 py-2 font-display text-xs uppercase tracking-[0.24em] text-muted-foreground backdrop-blur-xl">Entrance Preview</p>
          <div className="flex flex-wrap gap-2 rounded-2xl border border-white/12 bg-black/35 p-2 backdrop-blur-xl">
            <Button onClick={() => routeTo("/walkthrough")} className="min-h-11 bg-primary text-primary-foreground"><Sparkles className="h-4 w-4" /> Begin Walkthrough</Button>
            <Button onClick={() => routeTo("/guide")} variant="outline" className="min-h-11 border-white/20 bg-white/10 text-white hover:bg-white/20"><Bot className="h-4 w-4" /> Ask ARIA</Button>
            <Button onClick={() => routeTo("/tickets")} variant="outline" className="min-h-11 border-white/20 bg-white/10 text-white hover:bg-white/20"><Ticket className="h-4 w-4" /> View Tickets</Button>
          </div>
        </div>
      </section>

      <ComfortControls reducedMotion={reducedMotion} calmMode={calmMode} largeText={largeText} setReducedMotion={setReducedMotion} setCalmMode={setCalmMode} setLargeText={setLargeText} />
      <StoryPanel hotspot={activeHotspot} onClose={() => setActiveHotspot(null)} onRoute={routeTo} largeText={largeText} />
    </main>
  );
}