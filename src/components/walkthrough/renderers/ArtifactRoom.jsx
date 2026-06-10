import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Archive, MessageCircle, Bookmark, BookmarkCheck } from "lucide-react";
import ResolvedMedia from "@/components/walkthrough/ResolvedMedia";
import ScrollableImageLayer from "@/components/walkthrough/ScrollableImageLayer";
import WalkthroughFallbackVisual from "@/components/walkthrough/WalkthroughFallbackVisual";
import { getScrollableImageSettings } from "@/lib/scrollable-image";

const LAYOUT_GRID_CLASSES = {
  grid: "grid gap-4 md:grid-cols-3",
  gallery_wall: "grid gap-3 md:grid-cols-4",
  spotlight: "grid gap-4 md:grid-cols-2",
  archive_table: "flex flex-col divide-y divide-white/10",
  immersive_room: "relative min-h-[60vh]",
};

function ArtifactMeta({ artifact }) {
  const meta = [artifact.creator, artifact.origin, artifact.year].filter(Boolean);
  if (!meta.length) return null;
  return <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground/80">{meta.join(" · ")}</p>;
}

export default function ArtifactRoom({ room, onArtifactOpen }) {
  const config = room.artifact_config || {};
  const artifacts = config.artifacts || [];
  const layout = config.room_layout || "spotlight";
  const showCards = config.show_artifact_cards !== false;
  const allowZoom = config.allow_zoom !== false;
  const allowSave = !!config.allow_save_artifact;
  const [savedIds, setSavedIds] = useState(new Set());
  const isImmersive = layout === "immersive_room";
  const isTable = layout === "archive_table";
  const gridClass = LAYOUT_GRID_CLASSES[layout] || LAYOUT_GRID_CLASSES.grid;

  const toggleSave = (event, artifact) => {
    event.stopPropagation();
    setSavedIds((prev) => {
      const next = new Set(prev);
      const id = artifact.id || artifact.title;
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const renderMedia = (artifact, className) => {
    const scrollable = getScrollableImageSettings(artifact, artifact.artifact_type);
    if (!(artifact.media_url || artifact.thumbnail_url)) return <WalkthroughFallbackVisual compact className={className} />;
    if (scrollable) return <div className={`overflow-hidden ${className}`} onClick={(event) => event.stopPropagation()}><ScrollableImageLayer url={artifact.media_url || artifact.thumbnail_url} alt={artifact.title} settings={scrollable} /></div>;
    return <ResolvedMedia url={artifact.media_url || artifact.thumbnail_url} mediaType={artifact.artifact_type} alt={artifact.title} className={className} controls fallbackVisual fallbackCompact />;
  };

  return (
    <div className="px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs uppercase tracking-[0.28em] text-primary">Artifact Room</p>
        <h1 className="mt-3 font-display text-4xl font-bold text-foreground">{room.title}</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-foreground/70">{room.description || room.narration}</p>
        <div className={`mt-8 ${gridClass}`}>
          {artifacts.map((artifact, index) => {
            const id = artifact.id || artifact.title || `artifact-${index}`;
            const interactive = allowZoom && artifact.action_type !== "none";
            const handleClick = () => interactive && onArtifactOpen(artifact);
            const saved = savedIds.has(artifact.id || artifact.title);

            if (isImmersive) {
              return (
                <div
                  key={id}
                  role="button"
                  tabIndex={0}
                  onClick={handleClick}
                  onKeyDown={(event) => event.key === "Enter" && handleClick()}
                  style={{ left: `${artifact.hotspot_x ?? 50}%`, top: `${artifact.hotspot_y ?? 50}%` }}
                  className={`absolute w-48 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-white/[0.06] p-3 text-left backdrop-blur transition hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary ${interactive ? "cursor-pointer" : "cursor-default"}`}
                >
                  {renderMedia(artifact, "mb-2 h-24 w-full rounded-xl object-cover")}
                  {showCards && <h2 className="font-display text-sm font-bold text-foreground">{artifact.title}</h2>}
                  {showCards && <ArtifactMeta artifact={artifact} />}
                </div>
              );
            }

            if (isTable) {
              return (
                <div
                  key={id}
                  role="button"
                  tabIndex={0}
                  onClick={handleClick}
                  onKeyDown={(event) => event.key === "Enter" && handleClick()}
                  className={`flex items-center gap-4 py-4 text-left transition hover:bg-white/[0.04] focus:outline-none focus:ring-2 focus:ring-primary ${interactive ? "cursor-pointer" : "cursor-default"}`}
                >
                  {renderMedia(artifact, "h-16 w-16 shrink-0 rounded-xl object-cover")}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-primary"><Archive className="h-3.5 w-3.5" /><span className="text-[10px] uppercase tracking-widest">{artifact.artifact_type || "artifact"}</span></div>
                    <h2 className="mt-1 font-display text-lg font-bold text-foreground">{artifact.title}</h2>
                    {showCards && <ArtifactMeta artifact={artifact} />}
                    {showCards && <p className="mt-1 line-clamp-2 text-xs leading-6 text-foreground/65">{artifact.ai_caption || artifact.description || artifact.cultural_context}</p>}
                  </div>
                  {allowSave && <Button size="icon" variant="ghost" onClick={(event) => toggleSave(event, artifact)} aria-label="Save artifact">{saved ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}</Button>}
                </div>
              );
            }

            return (
              <div
                key={id}
                role="button"
                tabIndex={0}
                onClick={handleClick}
                onKeyDown={(event) => event.key === "Enter" && handleClick()}
                className={`rounded-3xl border border-white/10 bg-white/[0.06] p-4 text-left transition hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary ${interactive ? "cursor-pointer" : "cursor-default"}`}
              >
                {renderMedia(artifact, "mb-4 h-40 w-full rounded-2xl object-cover")}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-primary"><Archive className="h-4 w-4" /><span className="text-xs uppercase tracking-widest">{artifact.artifact_type || "artifact"}</span></div>
                  {allowSave && <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(event) => toggleSave(event, artifact)} aria-label="Save artifact">{saved ? <BookmarkCheck className="h-3.5 w-3.5 text-primary" /> : <Bookmark className="h-3.5 w-3.5" />}</Button>}
                </div>
                {showCards && <h2 className="mt-2 font-display text-2xl font-bold text-foreground">{artifact.title}</h2>}
                {showCards && <ArtifactMeta artifact={artifact} />}
                {showCards && <p className="mt-2 line-clamp-3 text-xs leading-6 text-foreground/65">{artifact.ai_caption || artifact.description || artifact.cultural_context}</p>}
              </div>
            );
          })}
        </div>
        {config.allow_ask_ai !== false && <Button className="mt-6" variant="outline"><MessageCircle className="h-4 w-4" /> Ask AI about this room</Button>}
      </div>
    </div>
  );
}
