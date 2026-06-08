import { ArrowRight, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const fallbackImage = "https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?auto=format&fit=crop&w=2200&q=80";

export default function TenantVideoHero({ tenant, eyebrow, title, body, mediaUrl, cardMediaUrl, cardLabel = "Cinematic entry", cardTitle = "Owned tenant experience", cardDescription = "", primaryLabel, secondaryLabel, onPrimary, onSecondary, onPlay, showActions = true }) {
  const isVideo = mediaUrl && (/\.(mp4|webm|mov|m4v)(\?|$)/i.test(mediaUrl) || /youtube\.com|youtu\.be|vimeo\.com/i.test(mediaUrl));
  const renderableVideo = mediaUrl && /\.(mp4|webm|mov|m4v)(\?|$)/i.test(mediaUrl);
  const externalVideo = mediaUrl && isVideo && !renderableVideo;
  const imageUrl = mediaUrl && !isVideo ? mediaUrl : tenant?.theme_config?.background_image_url || fallbackImage;
  const cardUrl = cardMediaUrl || imageUrl;
  const cardIsVideo = cardUrl && /\.(mp4|webm|mov|m4v)(\?|$)/i.test(cardUrl);
  const cardExternalVideo = cardUrl && /youtube\.com|youtu\.be|vimeo\.com/i.test(cardUrl);
  const cardImageUrl = cardExternalVideo ? imageUrl : cardUrl;

  return (
    <section className="relative flex min-h-[92vh] items-center overflow-hidden px-4 pb-16 pt-32 sm:px-6">
      <div className="absolute inset-0">
        {renderableVideo ? (
          <video autoPlay muted loop playsInline className="h-full w-full object-cover opacity-70">
            <source src={mediaUrl} />
          </video>
        ) : (
          <div className="h-full w-full bg-cover bg-center opacity-70" style={{ backgroundImage: `url(${imageUrl})` }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/72 to-background/92" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_24%,rgba(210,218,228,0.08),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(180,190,204,0.06),transparent_30%)]" />
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 font-display text-[10px] font-medium uppercase tracking-[0.5em] text-primary/70 backdrop-blur-xl">
            <Sparkles className="h-3.5 w-3.5" /> {eyebrow}
          </div>
          <h1 className="max-w-5xl font-heading text-5xl font-semibold leading-[0.95] tracking-tight text-foreground sm:text-7xl lg:text-8xl">
            {title}
          </h1>
          <p className="mt-6 max-w-2xl font-body text-base font-light leading-relaxed text-muted-foreground sm:text-lg">{body}</p>
          {externalVideo && <p className="mt-4 inline-flex rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-xs text-amber-100">External video URL saved — showing fallback background.</p>}
          {showActions && (
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" onClick={onPrimary} className="min-h-12 bg-primary px-7 text-primary-foreground hover:bg-primary/90">
                {primaryLabel} <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={onSecondary} className="min-h-12 border-white/15 bg-white/10 px-7 backdrop-blur-xl hover:bg-white/15">
                {secondaryLabel}
              </Button>
            </div>
          )}
        </div>

        <div className="relative hidden lg:block">
          <div className="absolute -inset-6 rounded-[3rem] bg-primary/10 blur-3xl" />
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/12 bg-white/[0.06] p-4 shadow-[0_32px_120px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-primary/20 bg-cover bg-center" style={{ backgroundImage: cardIsVideo ? undefined : `url(${cardImageUrl})` }}>
              {cardIsVideo && <video src={cardUrl} className="absolute inset-0 h-full w-full object-cover" autoPlay muted loop playsInline />}
              <div className="relative flex h-full flex-col justify-end bg-gradient-to-t from-black/82 via-black/10 to-transparent p-7">
                <button
                  type="button"
                  onClick={onPlay}
                  aria-label="Begin tour"
                  className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-primary/35 bg-primary/20 text-primary backdrop-blur-xl transition-all hover:scale-105 hover:bg-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Play className="h-6 w-6 fill-current" />
                </button>
                <p className="font-display text-[10px] uppercase tracking-[0.4em] text-primary/80">{cardLabel}</p>
                {cardExternalVideo && <p className="mt-2 font-display text-[10px] uppercase tracking-[0.25em] text-amber-100">External video saved · fallback shown</p>}
                <h2 className="mt-3 font-heading text-3xl font-semibold text-foreground">{cardTitle}</h2>
                {cardDescription && <p className="mt-3 font-body text-sm font-light leading-6 text-muted-foreground">{cardDescription}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}