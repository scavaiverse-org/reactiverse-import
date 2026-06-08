import ResolvedMedia from "@/components/walkthrough/ResolvedMedia";
import ScrollableImageLayer from "@/components/walkthrough/ScrollableImageLayer";
import WalkthroughFallbackVisual from "@/components/walkthrough/WalkthroughFallbackVisual";
import { getScrollableImageSettings } from "@/lib/scrollable-image";

export default function PerformanceStageRoom({ room }) {
  const config = room.performance_config || {};
  const media = room.media_url || config.performance_media_url;
  const mediaType = room.media_type || config.performance_media_type;
  const scrollable = getScrollableImageSettings(room.media_url ? room : config, mediaType);

  return (
    <div className="min-h-screen px-4 py-24">
      <div className="mx-auto max-w-5xl rounded-[2rem] border border-primary/20 bg-black/55 p-6 shadow-[0_0_80px_rgba(245,158,11,0.12)] backdrop-blur">
        <p className="text-xs uppercase tracking-[0.28em] text-primary">Performance Stage</p>
        <h1 className="mt-3 font-display text-5xl font-bold">{room.title || config.stage_title}</h1>
        {media ? (scrollable ? <div className="mt-6 h-[60vh] w-full overflow-hidden rounded-2xl"><ScrollableImageLayer url={media} alt={room.title || config.stage_title} settings={scrollable} /></div> : <ResolvedMedia url={media} mediaType={mediaType} alt={room.title || config.stage_title} className="mt-6 h-[60vh] w-full rounded-2xl object-contain" controls fallbackVisual />) : <WalkthroughFallbackVisual className="mt-6 h-[60vh] w-full rounded-2xl" />}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-white/10 p-4"><h2 className="font-semibold">Script / Lyrics</h2><p className="mt-2 whitespace-pre-wrap text-sm text-white/70">{room.narration || room.description || config.script_text || config.lyrics_text}</p></div>
          <div className="rounded-2xl bg-white/10 p-4"><h2 className="font-semibold">Translation</h2><p className="mt-2 whitespace-pre-wrap text-sm text-white/70">{config.translation_text || "Add translations for accessibility and learning."}</p></div>
        </div>
      </div>
    </div>
  );
}