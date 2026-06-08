import { Button } from "@/components/ui/button";
import { Archive, MessageCircle } from "lucide-react";
import ResolvedMedia from "@/components/walkthrough/ResolvedMedia";
import ScrollableImageLayer from "@/components/walkthrough/ScrollableImageLayer";
import WalkthroughFallbackVisual from "@/components/walkthrough/WalkthroughFallbackVisual";
import { getScrollableImageSettings } from "@/lib/scrollable-image";

export default function ArtifactRoom({ room, onArtifactOpen }) {
  const config = room.artifact_config || {};
  const artifacts = config.artifacts || [];
  return (
    <div className="px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs uppercase tracking-[0.28em] text-primary">Artifact Room</p>
        <h1 className="mt-3 font-display text-4xl font-bold text-foreground">{room.title}</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-foreground/70">{room.description || room.narration}</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {artifacts.map((artifact, index) => {
            const scrollable = getScrollableImageSettings(artifact, artifact.artifact_type);
            return (
              <div key={artifact.id || artifact.title || `artifact-${index}`} role="button" tabIndex={0} onClick={() => onArtifactOpen(artifact)} onKeyDown={(event) => event.key === "Enter" && onArtifactOpen(artifact)} className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 text-left transition hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary">
                {artifact.media_url || artifact.thumbnail_url ? (scrollable ? (
                  <div className="mb-4 h-40 w-full overflow-hidden rounded-2xl" onClick={(event) => event.stopPropagation()}>
                    <ScrollableImageLayer url={artifact.media_url || artifact.thumbnail_url} alt={artifact.title} settings={scrollable} />
                  </div>
                ) : (
                  <ResolvedMedia url={artifact.media_url || artifact.thumbnail_url} mediaType={artifact.artifact_type} alt={artifact.title} className="mb-4 h-40 w-full rounded-2xl object-cover" controls fallbackVisual fallbackCompact />
                )) : <WalkthroughFallbackVisual compact className="mb-4 h-40 w-full rounded-2xl" />}
                <div className="flex items-center gap-2 text-primary"><Archive className="h-4 w-4" /><span className="text-xs uppercase tracking-widest">{artifact.artifact_type || "artifact"}</span></div>
                <h2 className="mt-2 font-display text-2xl font-bold text-foreground">{artifact.title}</h2>
                <p className="mt-2 line-clamp-3 text-xs leading-6 text-foreground/65">{artifact.description || artifact.cultural_context}</p>
              </div>
            );
          })}
        </div>
        {config.allow_ask_ai !== false && <Button className="mt-6" variant="outline"><MessageCircle className="h-4 w-4" /> Ask AI about this room</Button>}
      </div>
    </div>
  );
}