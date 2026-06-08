import { Link } from "react-router-dom";
import { Brain, Building2, Landmark, LineChart } from "lucide-react";
import MediaCard from "./MediaCard";
import MediaBackground from "./MediaBackground";

const icons = [Landmark, Brain, LineChart, Building2];

export default function HomeModuleGrid({ section = {}, cards = [], cardMedia = {}, mediaById = {}, resolveSlotMedia }) {
  if (section.visible === false) return null;
  const sectionMedia = resolveSlotMedia?.(mediaById, "what_you_can_do_section", section.backgroundMediaId) || null;
  const sortedCards = [...cards].filter((card) => card.visible !== false).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  return (
    <MediaBackground desktop={sectionMedia} allowVideo atmosphere overlayOpacity={Math.max(section.overlay?.overlayOpacity ?? 0.75, 0.75)} overlayColor={section.overlay?.overlayColor || "10, 10, 14"} blur={Math.max(section.overlay?.overlayBlur || 0, 4)} className="px-4 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 max-w-2xl">
          <p className="font-display text-[10px] font-medium uppercase tracking-[0.5em] text-primary/70">{section.eyebrow || "Plan Your Visit"}</p>
          <h2 className="mt-3 font-heading text-3xl font-semibold leading-tight text-foreground sm:text-5xl">{section.title}</h2>
          <p className="mt-4 font-body text-base font-light leading-relaxed text-muted-foreground">{section.description}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {sortedCards.map((card, index) => {
            const Icon = icons[index % icons.length];
            const exactMedia = resolveSlotMedia?.(mediaById, `home_card_${card.key}`, card.backgroundMediaId) || null;
            const legacyMedia = !card.backgroundMediaId ? cardMedia[card.key] : null;
            const media = exactMedia || legacyMedia;
            const mobileMedia = resolveSlotMedia?.(mediaById, `home_card_${card.key}`, card.mobileMediaId) || media;
            if (media) {
              return (
                <Link key={card.key || card.title} to={card.ctaRoute || card.route || "/"}>
                  <MediaCard title={card.title} description={card.description} tag={card.badge || card.subtitle} media={media} mobileMedia={mobileMedia} overlay={card.overlay} />
                </Link>
              );
            }
            return (
              <Link key={card.key || card.title} to={card.ctaRoute || card.route || "/"} className="rounded-2xl border border-border/40 bg-card/50 p-5 backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:bg-card/80">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <span className="font-display text-[10px] uppercase tracking-[0.35em] text-primary/70">{card.badge || card.subtitle}</span>
                <h3 className="mt-2 font-heading text-lg font-semibold text-foreground">{card.title}</h3>
                <p className="mt-3 font-body text-sm font-light leading-6 text-muted-foreground">{card.description}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </MediaBackground>
  );
}