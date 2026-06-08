import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import HeroVideoBackground from "./HeroVideoBackground";

export default function HeroMediaPanel({ config, media }) {
  return (
    <HeroVideoBackground desktop={media.desktop} tablet={media.tablet} mobile={media.mobile}>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="mx-auto flex min-h-[88vh] max-w-5xl flex-col items-center justify-center px-5 pb-16 pt-24 text-center md:min-h-[82vh] md:px-8">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.1 }} className="w-full">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-background/30 px-4 py-2 font-display text-[10px] font-medium uppercase tracking-[0.5em] text-primary/70 shadow-lg backdrop-blur-md">
            {media.badge ? <img src={media.badge.fileUrl} alt="" className="h-5 w-5 rounded-full object-cover" /> : <Sparkles className="h-3.5 w-3.5" />} {config.heroSection?.badge || config.eyebrow}
          </div>
          <h1 className="mx-auto max-w-4xl font-heading text-4xl font-semibold leading-[0.95] tracking-tight text-foreground drop-shadow-2xl sm:text-6xl lg:text-7xl">{config.hero_title}</h1>
          <p className="mx-auto mt-5 max-w-2xl font-body text-base font-light leading-relaxed text-muted-foreground drop-shadow sm:text-lg">{config.hero_subtitle}</p>
          <p className="mx-auto mt-3 max-w-2xl font-body text-sm font-light leading-7 text-muted-foreground drop-shadow sm:text-base">{config.hero_body}</p>
          <div className="mx-auto mt-8 grid max-w-xl gap-3 sm:flex sm:flex-wrap sm:justify-center">
            <Link to={config.primary_cta_path || "/onboarding"} className="w-full sm:w-auto"><Button size="lg" className="min-h-12 w-full rounded-full bg-primary px-8 text-primary-foreground shadow-xl shadow-primary/20 hover:bg-primary/90 sm:w-auto">{config.primary_cta_label || "Start Visit"} <ArrowRight className="h-4 w-4" /></Button></Link>
            {config.secondary_cta_label && (
              <Link to={config.secondary_cta_path || "/walkthrough"} className="w-full sm:w-auto"><Button size="lg" variant="outline" className="min-h-12 w-full rounded-full border-white/25 bg-background/15 px-8 text-foreground backdrop-blur-md hover:bg-background/30 sm:w-auto">{config.secondary_cta_label}</Button></Link>
            )}
            <Link to={config.tertiary_cta_path || "/guide"} className="w-full sm:w-auto"><Button size="lg" variant="ghost" className="min-h-12 w-full rounded-full px-8 text-foreground hover:bg-background/30 sm:w-auto"><MessageCircle className="h-4 w-4" /> {config.tertiary_cta_label || "Ask ARIA"}</Button></Link>
          </div>
        </motion.div>
      </div>
    </HeroVideoBackground>
  );
}