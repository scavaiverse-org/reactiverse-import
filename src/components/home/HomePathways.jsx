import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import MediaBackground from "./MediaBackground";

export default function HomePathways({ section = {}, platform = {}, pathways = [], deploymentSites = [], mediaById = {}, resolveSlotMedia }) {
  if (section.visible === false) return null;
  const sectionMedia = resolveSlotMedia?.(mediaById, "schools_partners_section", section.backgroundMediaId) || null;
  const platformMedia = resolveSlotMedia?.(mediaById, "platform_preview_section", platform.backgroundMediaId) || null;

  return (
    <MediaBackground desktop={sectionMedia} allowVideo atmosphere overlayOpacity={Math.max(section.overlay?.overlayOpacity ?? 0.75, 0.75)} overlayColor={section.overlay?.overlayColor || "10, 10, 14"} blur={Math.max(section.overlay?.overlayBlur || 0, 4)} className="border-t border-border/30 bg-card/10 px-4 py-24">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">{section.eyebrow || "Begin Your Journey"}</p>
          <h2 className="mt-3 font-display text-3xl font-bold text-foreground sm:text-4xl">{section.title}</h2>
          <p className="mt-4 text-base leading-7 text-foreground/75">{section.description}</p>
          {section.ctaLabel && (
            <Link to={section.route || "/tickets"} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">
              {section.ctaLabel} <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
        <div className="grid gap-3">
          {pathways.map((pathway) => (
            <Link key={pathway.label} to={pathway.path || "/"} className="group rounded-2xl border border-white/10 bg-black/15 p-5 transition-all hover:border-primary/30 hover:bg-primary/[0.04]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">{pathway.label}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{pathway.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-primary opacity-50 transition-opacity group-hover:opacity-100" />
              </div>
            </Link>
          ))}
          {platform.visible !== false && (
            <MediaBackground desktop={platformMedia} overlayOpacity={Math.max(platform.overlay?.overlayOpacity ?? 0.82, 0.82)} overlayColor={platform.overlay?.overlayColor || "10, 10, 14"} blur={platform.overlay?.overlayBlur || 0} className="mt-4 rounded-2xl border border-primary/20 bg-primary/[0.04]">
              <div className="bg-background/65 p-5 backdrop-blur-sm">
                <p className="text-sm font-semibold text-foreground">{platform.title}</p>
                <p className="mt-2 text-sm leading-6 text-foreground/75">{platform.description}</p>
                <Link to={platform.route || "/white-label"} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                  {platform.ctaLabel || "Learn More"} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </MediaBackground>
          )}
          {section.showDeploymentSites !== false && (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {deploymentSites.map((site) => (
                <div key={site.name} className="rounded-xl border border-primary/15 bg-primary/[0.035] p-4">
                  <p className="text-xs font-semibold text-foreground">{site.name}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-primary">{site.status}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MediaBackground>
  );
}