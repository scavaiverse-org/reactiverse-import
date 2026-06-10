import { motion } from "framer-motion";
import { getSafeMediaUrl, getSafeNavigationUrl } from "@/lib/walkthrough-media-url";

function hasHotspotInteraction(hotspot = {}) {
  const hasMedia = !!getSafeMediaUrl(hotspot.media_url || hotspot.image_url || hotspot.video_url || hotspot.audio_url || hotspot.thumbnail_url || "");
  const hasRoute = !!getSafeNavigationUrl(hotspot.cta_route || hotspot.route || hotspot.url || "");
  return !!(hotspot.detail || hotspot.description || hotspot.long_description || hasMedia || hasRoute || hotspot.next_room_id);
}

const LIGHTING_OVERLAYS = {
  warm: "bg-gradient-to-b from-amber-500/15 via-transparent to-amber-900/20",
  cool: "bg-gradient-to-b from-sky-500/15 via-transparent to-slate-900/25",
  dim: "bg-black/35",
  bright: "bg-white/5",
  dramatic: "bg-gradient-to-t from-black/55 via-transparent to-black/10",
  natural: "bg-gradient-to-b from-white/5 via-transparent to-transparent",
};

function getLightingOverlayClass(lighting = "") {
  const key = String(lighting || "").trim().toLowerCase();
  if (!key) return "";
  if (LIGHTING_OVERLAYS[key]) return LIGHTING_OVERLAYS[key];
  if (/neon|cool|cyber|blue/.test(key)) return LIGHTING_OVERLAYS.cool;
  if (/dramatic|spotlight|stage|curtain/.test(key)) return LIGHTING_OVERLAYS.dramatic;
  if (/dim|dark|shadow/.test(key)) return LIGHTING_OVERLAYS.dim;
  if (/bright|daylight/.test(key)) return LIGHTING_OVERLAYS.bright;
  if (/natural|green|nature|mist/.test(key)) return LIGHTING_OVERLAYS.natural;
  if (/warm|amber|gold/.test(key)) return LIGHTING_OVERLAYS.warm;
  return "bg-gradient-to-b from-white/5 via-transparent to-black/15";
}

const CAMERA_MOTION_VARIANTS = {
  slow_push: { initial: { scale: 1 }, animate: { scale: 1.08 }, transition: { duration: 18, ease: "easeOut" } },
  pan_left: { initial: { x: "2%" }, animate: { x: "-2%" }, transition: { duration: 20, ease: "linear", repeat: Infinity, repeatType: "mirror" } },
  pan_right: { initial: { x: "-2%" }, animate: { x: "2%" }, transition: { duration: 20, ease: "linear", repeat: Infinity, repeatType: "mirror" } },
  zoom_in: { initial: { scale: 1 }, animate: { scale: 1.15 }, transition: { duration: 24, ease: "easeOut" } },
  parallax: { initial: { scale: 1.05, y: 0 }, animate: { scale: 1.1, y: "-1.5%" }, transition: { duration: 22, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" } },
};

function normalizeCameraMotion(value = "") {
  const key = String(value || "").trim().toLowerCase();
  if (CAMERA_MOTION_VARIANTS[key]) return key;
  if (/parallax|drift|glide/.test(key)) return "parallax";
  if (/zoom/.test(key)) return "zoom_in";
  if (/pan.*left/.test(key)) return "pan_left";
  if (/pan.*right/.test(key)) return "pan_right";
  if (/push|reveal|approach/.test(key)) return "slow_push";
  return "";
}

export default function ExhibitionRoom({ room, activeHotspot, onHotspotOpen, context = {} }) {
  const config = room.exhibition_config || {};
  const hotspots = room.hotspots?.length ? room.hotspots : config.hotspots || [];
  const cinematicCtas = config.cinematic_ctas || [];
  const lightingClass = getLightingOverlayClass(config.lighting || room.lighting);
  const motionVariant = CAMERA_MOTION_VARIANTS[normalizeCameraMotion(config.camera_motion || room.camera_motion)];
  return (
    <div className="relative min-h-screen px-4 py-24">
      {motionVariant && <motion.div aria-hidden className="pointer-events-none absolute inset-0 -z-10" initial={motionVariant.initial} animate={motionVariant.animate} transition={motionVariant.transition} />}
      {lightingClass && <div aria-hidden className={`pointer-events-none absolute inset-0 -z-10 ${lightingClass}`} />}
      <div className="relative z-10 mx-auto max-w-5xl">
        <p className="text-xs uppercase tracking-[0.28em] text-primary">{room.mood || config.mood || room.ambience || "Exhibition"}</p>
        <h1 className="mt-3 max-w-3xl font-display text-5xl font-bold text-foreground">{room.title || config.scene_title}</h1>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-foreground/75">{room.narration || room.description || config.scene_narrative}</p>
        <div className="mt-10 flex flex-wrap gap-3">
          {hotspots.map((hotspot, index) => {
            const isInteractive = hasHotspotInteraction(hotspot);
            return (
              <motion.button
                key={hotspot.id || index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.08 }}
                onClick={() => isInteractive && onHotspotOpen(hotspot)}
                disabled={!isInteractive}
                title={isInteractive ? (hotspot.label || hotspot.title || "Open hotspot") : "No interaction configured"}
                className={`rounded-full border px-4 py-2 text-xs backdrop-blur focus:outline-none focus:ring-2 focus:ring-primary ${!isInteractive ? "cursor-not-allowed border-white/15 bg-white/5 text-muted-foreground opacity-70" : activeHotspot?.id === hotspot.id ? "border-primary bg-primary text-primary-foreground" : "border-primary/30 bg-primary/15 text-primary hover:bg-primary/25"}`}
              >
                {hotspot.label || hotspot.title || `Hotspot ${index + 1}`}
                {!isInteractive && <span className="ml-2 text-[10px] text-muted-foreground">No interaction configured</span>}
              </motion.button>
            );
          })}
        </div>
        {cinematicCtas.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-3">
            {cinematicCtas.map((cta, index) => (
              cta.label && cta.route ? (
                <a
                  key={cta.id || index}
                  href={context.resolveRoute ? context.resolveRoute(cta.route) : cta.route}
                  className="rounded-full border border-primary bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {cta.label}
                </a>
              ) : null
            ))}
          </div>
        )}
      </div>
    </div>
  );
}