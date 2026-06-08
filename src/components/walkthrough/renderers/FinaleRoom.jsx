import { Link } from "react-router-dom";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import ResolvedMedia from "@/components/walkthrough/ResolvedMedia";
import ScrollableImageLayer from "@/components/walkthrough/ScrollableImageLayer";
import WalkthroughFallbackVisual from "@/components/walkthrough/WalkthroughFallbackVisual";
import { getScrollableImageSettings } from "@/lib/scrollable-image";

export default function FinaleRoom({ room, context = {} }) {
  const config = room.finale_config || {};
  const progressionLabels = ["continue", "next", "complete", "complete tour", "complete experience"];
  const ctas = (config.next_ctas?.length ? config.next_ctas : room.ctas || [])
    .filter((cta) => !progressionLabels.some((label) => String(cta.label || "").toLowerCase().trim() === label));
  const media = room.media_url || config.media_url;
  const mediaType = room.media_type || config.media_type;
  const scrollable = getScrollableImageSettings(room.media_url ? room : config, mediaType);
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-20">
      <div className="max-w-3xl rounded-[2rem] border border-primary/20 bg-background/85 p-8 text-center backdrop-blur-xl">
        <Trophy className="mx-auto h-12 w-12 text-primary" />
        <p className="mt-4 text-xs uppercase tracking-[0.28em] text-primary">Finale</p>
        <h1 className="mt-3 font-display text-5xl font-bold">{room.title || config.achievement_title}</h1>
        {media ? (scrollable ? <div className="mx-auto mt-5 h-56 w-full overflow-hidden rounded-2xl"><ScrollableImageLayer url={media} alt={room.title || config.achievement_title} settings={scrollable} /></div> : <ResolvedMedia url={media} mediaType={mediaType} alt={room.title || config.achievement_title} className="mx-auto mt-5 h-56 w-full rounded-2xl object-contain" controls fallbackVisual fallbackCompact />) : <WalkthroughFallbackVisual compact className="mx-auto mt-5 h-56 w-full rounded-2xl" />}
        <p className="mt-5 text-sm leading-7 text-muted-foreground">{room.narration || room.description || config.completion_message}</p>
        {ctas.length > 0 && <div className="mt-7 flex flex-wrap justify-center gap-3">{ctas.map((cta) => <Button key={cta.id || cta.label} asChild variant={cta.style === "secondary" ? "outline" : "default"}><Link to={context.resolveRoute?.(cta.route) || cta.route || "#"}>{cta.label}</Link></Button>)}</div>}
      </div>
    </div>
  );
}