import { motion } from "framer-motion";
import { getSafeMediaUrl, getSafeNavigationUrl } from "@/lib/walkthrough-media-url";

function hasHotspotInteraction(hotspot = {}) {
  const hasMedia = !!getSafeMediaUrl(hotspot.media_url || hotspot.image_url || hotspot.video_url || hotspot.audio_url || hotspot.thumbnail_url || "");
  const hasRoute = !!getSafeNavigationUrl(hotspot.cta_route || hotspot.route || hotspot.url || "");
  return !!(hotspot.detail || hotspot.description || hotspot.long_description || hasMedia || hasRoute || hotspot.next_room_id);
}

export default function ExhibitionRoom({ room, activeHotspot, onHotspotOpen }) {
  const config = room.exhibition_config || {};
  const hotspots = room.hotspots?.length ? room.hotspots : config.hotspots || [];
  return (
    <div className="relative min-h-screen px-4 py-24">
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
      </div>
    </div>
  );
}