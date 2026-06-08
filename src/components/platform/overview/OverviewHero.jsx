import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Building2, Map, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function OverviewHero({ content = {} }) {
  const hero = content.hero || {};
  const { data: liveMuseums = [] } = useQuery({
    queryKey: ["overview-live-museum-count"],
    queryFn: () => base44.entities.MuseumTenant.filter({ status: "live" }, "name", 100),
    initialData: [],
  });
  const heroStats = [
    { value: String(liveMuseums.length || 0), label: liveMuseums.length === 1 ? "live museum" : "live museums" },
    { value: "Live", label: "museum directory" },
    { value: "24/7", label: "virtual access" },
  ];
  const primaryCta = { label: "View Available Museums", route: "/virtual-experience" };
  const flowCards = [
    { icon: Building2, title: "View Available Museums", body: "Browse live tenant museums first." },
    { icon: Map, title: "Choose Museum", body: "Select one museum from the directory." },
    { icon: Sparkles, title: "Enter Museum", body: "Open that museum's public homepage." },
  ];

  return (
    <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:py-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsla(43,100%,56%,0.08),transparent_34%),radial-gradient(circle_at_bottom_right,hsla(45,20%,95%,0.035),transparent_30%)]" />
      <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 font-display text-[10px] font-medium uppercase tracking-[0.5em] text-primary/70">
            <Sparkles className="h-3.5 w-3.5" /> {hero.eyebrow || "Consumer platform"}
          </div>
          <h1 className="max-w-4xl font-heading text-5xl font-semibold leading-[0.95] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            {hero.title || "Choose a live museum to begin your virtual visit."}
          </h1>
          <p className="mt-6 max-w-2xl font-body text-lg font-light leading-relaxed text-muted-foreground">
            {hero.subtitle || "SCAVerse gives visitors one simple path into available tenant museums."}
          </p>
          <div className="mt-8">
            <Link to={primaryCta.route}>
              <Button size="lg" className="w-full bg-primary text-primary-foreground sm:w-auto">
                {primaryCta.label} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
            {heroStats.map((item) => (
              <div key={item.label} className="rounded-2xl border border-border/40 bg-card/50 p-4 backdrop-blur-sm">
                <p className="text-2xl font-bold text-primary">{item.value}</p>
                <p className="mt-1 text-xs leading-4 text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-primary/20 bg-card/55 p-4 shadow-2xl shadow-primary/10 backdrop-blur">
          <div className="rounded-[1.5rem] bg-background/40 p-4">
            <div className="relative aspect-[9/14] overflow-hidden rounded-[1.2rem] border border-white/10 bg-gradient-to-b from-primary/25 via-background to-cyan-400/10 p-5 sm:aspect-[4/5]">
              <video autoPlay muted loop playsInline preload="metadata" className="absolute inset-0 h-full w-full object-cover opacity-40" src="https://res.cloudinary.com/dwc4hamrl/video/upload/q_auto/f_auto/v1780413829/grok_video_2026-06-02-23-23-15_yebvs5.mp4" />
              <div className="absolute inset-0 bg-gradient-to-b from-primary/15 via-background/50 to-background/80" />
              <div className="relative">
                <div className="flex items-center justify-between text-xs text-foreground/70">
                  <span className="font-display uppercase tracking-[0.24em]">Your visit</span>
                </div>
                <div className="mt-10 space-y-4">
                  {flowCards.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.title} className="rounded-2xl border border-white/10 bg-background/55 p-4 backdrop-blur">
                        <Icon className="mb-3 h-5 w-5 text-primary" />
                        <h3 className="font-heading text-xl font-semibold tracking-tight">{item.title}</h3>
                        <p className="mt-1 text-sm leading-5 text-muted-foreground">{item.body}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}