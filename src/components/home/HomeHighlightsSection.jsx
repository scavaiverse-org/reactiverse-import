import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import MediaBackground from "./MediaBackground";

const overlayDefaults = { overlayOpacity: 0.62, overlayColor: "10, 10, 14", overlayBlur: 0 };

export default function HomeHighlightsSection({ section = {}, cards = [], mediaById = {}, resolveSlotMedia }) {
  if (section.visible === false) return null;

  const sortedCards = [...cards]
    .filter((card) => card.visible !== false)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  const background = resolveSlotMedia?.(mediaById, "museum_highlights_section", section.backgroundMediaId) || null;
  const overlay = { ...overlayDefaults, ...(section.overlay || {}) };

  return (
    <MediaBackground
      desktop={background}
      atmosphere
      overlayOpacity={0.82}
      overlayColor={overlay.overlayColor}
      blur={6}
      className="border-t border-border/30 px-4 py-20"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 max-w-2xl space-y-3">
          {section.cardLayout !== "single_cta" && (
            <p className="font-display text-[10px] font-medium uppercase tracking-[0.5em] text-primary/70">
              {section.eyebrow || "Museum Highlights"}
            </p>
          )}
          <h2 className="font-heading text-3xl font-semibold leading-tight text-foreground sm:text-5xl">
            {section.title || "Explore The Collection"}
          </h2>
          <p className="font-body text-base font-light leading-relaxed text-muted-foreground">
            {section.description || "Enter the collection and let culture, costumes, music, performances, and stories unfold naturally as part of one museum journey."}
          </p>
        </div>

        {section.cardLayout === "single_cta" ? (
          <Link
            to={section.ctaRoute || "/walkthrough"}
            className="group inline-flex items-center gap-3 rounded-full border border-primary/30 bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-xl shadow-primary/10 transition-all hover:scale-[1.02] hover:bg-primary/90"
          >
            {section.ctaLabel || "Begin Your Journey"}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {sortedCards.map((card) => {
              const slotKey = `museum_highlight_${card.key === "guided" ? "guided_visit" : card.key}`;
              const cardMedia = resolveSlotMedia?.(mediaById, slotKey, card.backgroundMediaId) || null;
              const cardMobileMedia = resolveSlotMedia?.(mediaById, slotKey, card.mobileMediaId) || cardMedia;
              const cardOverlay = {
                overlayOpacity: 0.64,
                overlayColor: "10, 10, 14",
                overlayBlur: 1,
                ...(card.overlay || {}),
              };

              return (
                <Link key={card.key || card.title} to={card.ctaRoute || "/"} className="group block">
                  <MediaBackground
                    desktop={cardMedia}
                    mobile={cardMobileMedia}
                    overlayOpacity={Math.max(cardOverlay.overlayOpacity, 0.86)}
                    overlayColor={cardOverlay.overlayColor}
                    blur={cardOverlay.overlayBlur}
                    className="min-h-64 rounded-2xl border border-border/40 bg-card/50 shadow-xl shadow-black/20 backdrop-blur-sm transition-all duration-300 group-hover:border-primary/40 group-hover:bg-card/80"
                  >
                    <div className="flex min-h-64 flex-col justify-between bg-background/80 p-5 backdrop-blur-sm">
                      <div>
                        <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-1 font-display text-[10px] uppercase tracking-[0.35em] text-primary/70">
                          {card.badge}
                        </span>
                        <h3 className="mt-4 font-heading text-xl font-semibold leading-tight text-foreground">{card.title}</h3>
                        <p className="mt-1 font-display text-xs uppercase tracking-[0.25em] text-primary/70">{card.subtitle}</p>
                        <p className="mt-3 font-body text-sm font-light leading-6 text-muted-foreground">{card.description}</p>
                      </div>
                      <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                        {card.ctaLabel || "Explore"}
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </MediaBackground>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </MediaBackground>
  );
}