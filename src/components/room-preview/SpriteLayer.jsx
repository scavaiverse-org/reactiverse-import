import { Sparkles } from "lucide-react";
import SpriteMediaPreview from "@/components/walkthrough/SpriteMediaPreview";

const spriteStyles = {
  glow: "rounded-full bg-cyan-300/20 blur-2xl shadow-[0_0_60px_rgba(103,232,249,0.35)]",
  shimmer: "rounded-full bg-white/10 blur-xl",
  warmth: "rounded-full bg-amber-300/14 blur-2xl",
  shadow: "rounded-3xl bg-black/25 blur-xl",
  ring: "rounded-full border border-cyan-200/40 bg-cyan-200/5 shadow-[0_0_34px_rgba(103,232,249,0.28)]",
};

export default function SpriteLayer({ sprites = [], motionStyle, disabledMotion, calmMode }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden="true">
      {sprites.map((sprite, index) => {
        const type = sprite.type || "glow";
        const imageUrl = sprite.active_museum_media_url || sprite.processed_sprite_url || sprite.media_url || sprite.image_url;
        const opacity = calmMode ? 0.45 : sprite.opacity ?? 0.85;
        return imageUrl ? (
          <div
            key={sprite.id || index}
            className="absolute"
            style={{
              left: `${sprite.x}%`,
              top: `${sprite.y}%`,
              width: `${sprite.width || 12}%`,
              height: `${sprite.height || 12}%`,
              opacity,
              transform: `${motionStyle(sprite.depth || 0.05)} translate(-50%, -50%) rotate(${Number(sprite.rotation || 0)}deg)`,
            }}
          >
            <SpriteMediaPreview sprite={{ ...sprite, media_url: imageUrl }} className="h-full w-full select-none object-contain drop-shadow-2xl" />
          </div>
        ) : (
          <div
            key={sprite.id || index}
            className={`absolute transform-gpu transition-transform duration-300 ${spriteStyles[type] || spriteStyles.glow} ${disabledMotion ? "" : type === "shimmer" ? "animate-pulse" : ""}`}
            style={{
              left: `${sprite.x}%`,
              top: `${sprite.y}%`,
              width: `${sprite.width || 12}%`,
              height: `${sprite.height || 12}%`,
              opacity,
              transform: `${motionStyle(sprite.depth || 0.05)} translate(-50%, -50%)`,
            }}
          />
        );
      })}
      {!disabledMotion && !calmMode && (
        <div className="absolute left-[48%] top-[24%] flex items-center gap-1 text-[10px] uppercase tracking-[0.25em] text-white/20 animate-pulse">
          <Sparkles className="h-3 w-3" /> Story light
        </div>
      )}
    </div>
  );
}