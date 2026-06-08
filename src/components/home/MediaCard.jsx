import { ArrowRight } from "lucide-react";
import MediaBackground from "./MediaBackground";

export default function MediaCard({ title, description, tag, media, mobileMedia, overlay = {} }) {
  return (
    <MediaBackground desktop={media} mobile={mobileMedia || media} overlayOpacity={Math.max(overlay.overlayOpacity ?? (media ? 0.82 : 0.35), media ? 0.82 : 0.35)} overlayColor={overlay.overlayColor || "10, 10, 11"} blur={overlay.overlayBlur ?? 0} className="min-h-56 rounded-2xl border border-border/40 bg-card/50 shadow-xl shadow-black/20 backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:bg-card/80">
      <div className="flex min-h-56 flex-col justify-between bg-background/72 p-5 backdrop-blur-sm">
        <div>
          <span className="font-display text-[10px] uppercase tracking-[0.4em] text-primary/75">{tag}</span>
          <h3 className="mt-2 font-heading text-xl font-semibold tracking-tight text-foreground">{title}</h3>
          <p className="mt-3 font-body text-sm font-light leading-6 text-muted-foreground">{description}</p>
        </div>
        <ArrowRight className="mt-5 h-4 w-4 text-primary" />
      </div>
    </MediaBackground>
  );
}