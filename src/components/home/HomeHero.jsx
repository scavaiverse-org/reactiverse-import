import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomeHero({ config }) {
  const heroImage = config.mobile_hero_image_url || config.background_image_url;

  return (
    <section
      className="relative overflow-hidden bg-cover bg-center px-4 pb-14 pt-24 sm:pb-20 sm:pt-32"
      style={heroImage ? { backgroundImage: `linear-gradient(rgba(10, 10, 14, 0.84), rgba(10, 10, 14, 0.94)), url(${heroImage})` } : undefined}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 top-0 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-primary/[0.025] blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 font-display text-[10px] font-medium uppercase tracking-[0.5em] text-primary/70">
            <Sparkles className="h-3.5 w-3.5" /> {config.eyebrow}
          </div>
          <h1 className="max-w-4xl font-heading text-4xl font-semibold leading-[0.95] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            {config.hero_title}
          </h1>
          <p className="mt-5 max-w-2xl font-body text-base font-light leading-relaxed text-muted-foreground sm:text-lg">{config.hero_subtitle}</p>
          <p className="mt-4 max-w-xl font-body text-base font-light leading-7 text-muted-foreground">{config.hero_body}</p>
          <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
            <Link to={config.primary_cta_path || "/onboarding"} className="w-full sm:w-auto">
              <Button size="lg" className="min-h-11 w-full bg-primary px-7 text-primary-foreground hover:bg-primary/90 sm:w-auto">
                {config.primary_cta_label} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to={config.secondary_cta_path || "/walkthrough"} className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="min-h-11 w-full border-border/60 px-7 sm:w-auto">
                {config.secondary_cta_label}
              </Button>
            </Link>
            <Link to={config.tertiary_cta_path || "/guide"} className="w-full sm:w-auto">
              <Button size="lg" variant="ghost" className="min-h-11 w-full px-7 text-foreground hover:bg-secondary sm:w-auto">
                <MessageCircle className="h-4 w-4" /> {config.tertiary_cta_label || "Ask ARIA"}
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.15 }} className="relative">
          <div className="rounded-[2rem] border border-white/10 bg-card/45 p-5 shadow-2xl shadow-primary/5 backdrop-blur">
            <div className="rounded-[1.5rem] border border-primary/20 bg-gradient-to-br from-primary/12 via-background to-primary/[0.03] p-6">
              <p className="text-sm uppercase tracking-[0.22em] text-primary">Museum Highlights</p>
              <div className="mt-8 grid gap-3">
                {(config.modules || []).slice(0, 4).map((module, index) => (
                  <div key={module.title} className="flex items-start justify-between rounded-xl border border-white/10 bg-black/20 p-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{module.title}</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{module.description}</p>
                    </div>
                    <span className="ml-3 rounded-full border border-primary/25 bg-primary/10 px-2 py-1 text-xs text-primary">{module.tag || `0${index + 1}`}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}