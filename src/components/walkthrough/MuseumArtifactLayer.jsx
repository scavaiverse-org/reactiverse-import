import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import ResolvedMedia from "@/components/walkthrough/ResolvedMedia";
import SpriteMediaPreview from "@/components/walkthrough/SpriteMediaPreview";

function panelText(artifact) {
  return artifact.body || artifact.description || artifact.long_description || "";
}

export default function MuseumArtifactLayer({ room, editable = false, onArtifactOpen }) {
  const [active, setActive] = useState(null);
  const sprites = room?.museum_mode_enabled || room?.artifact_placement_enabled ? (room.artifact_sprites || []) : [];
  if (!sprites.length) return null;

  const open = (artifact) => {
    onArtifactOpen?.(artifact);
    if ((artifact.display_mode || "click") !== "always") setActive(artifact);
  };

  return (
    <div className="absolute inset-0 z-[12] pointer-events-none overflow-hidden">
      {sprites.map((artifact) => {
        const mode = artifact.display_mode || "click";
        return (
          <button
            key={artifact.id}
            type="button"
            disabled={editable}
            onClick={() => open(artifact)}
            onMouseEnter={() => mode === "hover" && setActive(artifact)}
            className="group pointer-events-auto absolute touch-none focus:outline-none focus:ring-2 focus:ring-primary"
            style={{
              left: `${artifact.x || 50}%`,
              top: `${artifact.y || 70}%`,
              width: `${artifact.width || 18}%`,
              height: `${artifact.height || 24}%`,
              zIndex: 20 + Number(artifact.depth || artifact.z_index || 0),
              opacity: Number(artifact.opacity ?? 1),
              transform: `rotate(${Number(artifact.rotation || 0)}deg) scale(${Number(artifact.scale || 1)})`,
              filter: artifact.shadow_enabled === false ? "none" : `drop-shadow(${Number(artifact.shadow_offset_x || 0)}px ${Number(artifact.shadow_offset_y || 12)}px ${Number(artifact.shadow_blur || 18)}px rgba(0,0,0,${Number(artifact.shadow_strength || 0.32)}))`,
            }}
            aria-label={artifact.title || "Museum artifact"}
          >
            <SpriteMediaPreview sprite={artifact} className="h-full w-full select-none object-contain drop-shadow-[0_22px_36px_rgba(0,0,0,0.45)] transition group-hover:scale-[1.02]" />
            {(artifact.caption || (mode === "always" && (artifact.title || panelText(artifact)))) && (
              <span className="absolute left-1/2 top-full mt-2 min-w-40 -translate-x-1/2 rounded-2xl border border-white/15 bg-background/85 px-3 py-2 text-left text-xs text-foreground shadow-2xl backdrop-blur-xl">
                <strong className="block font-heading text-sm">{artifact.caption || artifact.header || artifact.title}</strong>
                {mode === "always" && <span className="mt-1 line-clamp-3 text-muted-foreground">{panelText(artifact)}</span>}
              </span>
            )}
          </button>
        );
      })}

      {active && (
        <div className="pointer-events-auto absolute inset-x-4 bottom-20 mx-auto max-h-[60vh] max-w-xl overflow-y-auto rounded-3xl border border-white/15 bg-background/90 p-5 shadow-2xl backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-primary">Museum Artifact</p>
              <h2 className="mt-1 font-heading text-2xl font-semibold tracking-tight">{active.header || active.title || "Artifact"}</h2>
            </div>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setActive(null)} aria-label="Close artifact panel"><X className="h-4 w-4" /></Button>
          </div>
          {active.description && <p className="mt-3 text-sm leading-7 text-muted-foreground">{active.description}</p>}
          {active.body && <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-foreground/80">{active.body}</p>}
          {active.video_url && <ResolvedMedia url={active.video_url} mediaType="video" alt={active.title || "Artifact video"} className="mt-4 aspect-video w-full rounded-2xl object-cover" controls />}
          {active.audio_url && <ResolvedMedia url={active.audio_url} mediaType="audio" alt={active.title || "Artifact audio"} className="mt-4 w-full rounded-2xl" controls />}
        </div>
      )}
    </div>
  );
}