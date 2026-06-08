import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import MediaBackground from "./MediaBackground";

export default function FinalCtaMediaPanel({ config, media, overlay = {} }) {
  return (
    <MediaBackground desktop={media} overlayOpacity={overlay.overlayOpacity ?? (media ? 0.72 : 0.1)} overlayColor={overlay.overlayColor || "10, 10, 11"} blur={overlay.overlayBlur ?? (media ? 2 : 0)} className="mx-auto max-w-3xl rounded-[2rem] border border-primary/20 bg-gradient-to-br from-primary/10 via-card/40 to-transparent text-center">
      <div className="p-8 sm:p-12">
        <p className="font-display text-[10px] font-medium uppercase tracking-[0.5em] text-primary/70">Why It Matters</p>
        <h2 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">{config.final_cta_title}</h2>
        <p className="mx-auto mt-4 max-w-xl font-body text-base font-light leading-relaxed text-muted-foreground">{config.final_cta_body}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to={config.primary_cta_path || "/onboarding"} className="w-full sm:w-auto">
            <Button className="min-h-11 w-full bg-primary text-primary-foreground sm:w-auto">
              {config.primary_cta_label} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/white-label" className="w-full sm:w-auto">
            <Button variant="outline" className="min-h-11 w-full border-border/60 sm:w-auto">Learn About the Platform</Button>
          </Link>
        </div>
      </div>
    </MediaBackground>
  );
}