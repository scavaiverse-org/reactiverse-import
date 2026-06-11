import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ChevronRight, Sparkles } from "lucide-react";

// NOTE: do not animate CSS `filter` (blur) here — filter animations are not
// GPU-composited and repaint every staggered child inside the overlay's
// backdrop-blur card, which flickers badly on mobile (see e083715 history).
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] } },
};

const reducedContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.15 } },
};

const reducedItem = {
  hidden: { opacity: 1 },
  show: { opacity: 1 },
};

export default function PremiumOnboardingStage({ stage, currentStage, totalStages, selections, multiSelections, onSelect, onNext, canProceed, isLastStage, reduceMotion = false }) {
  const containerVariants = reduceMotion ? reducedContainer : container;
  const itemVariants = reduceMotion ? reducedItem : item;
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -18 }} className="relative">
      <motion.div variants={itemVariants} className="text-center mb-6">
        <div className="mx-auto mb-5 h-20 w-20 rounded-full border border-primary/25 bg-primary/10 shadow-[0_0_80px_rgba(245,174,56,0.18)] flex items-center justify-center">
          <span className="text-5xl text-primary/40 font-mono">{stage.visual}</span>
        </div>
        <p className="mb-3 font-display text-[10px] font-medium uppercase tracking-[0.5em] text-primary/70">Museum Entrance · Step {currentStage + 1} of {totalStages}</p>
        <h1 className="mb-4 font-heading text-4xl font-semibold leading-[0.95] tracking-tight text-foreground sm:text-5xl">{stage.title}</h1>
        <p className="mx-auto max-w-md font-body text-sm font-light leading-relaxed text-muted-foreground">{stage.subtitle}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2 text-[10px] text-muted-foreground">
          {stage.sensory && <span className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1">Sensory: {stage.sensory}</span>}
          {stage.reducedMotion && <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1">Reduced motion available</span>}
        </div>
      </motion.div>

      {stage.content && (
        <motion.p variants={itemVariants} className="mx-auto mb-8 max-w-xl rounded-2xl border border-primary/15 bg-card/50 px-6 py-5 text-center font-body text-sm font-light leading-relaxed text-muted-foreground shadow-2xl backdrop-blur-xl">
          {stage.content}
        </motion.p>
      )}

      {stage.options && !stage.multiSelect && (
        <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {stage.options.map((opt) => {
            const Icon = opt.icon;
            const isSelected = selections[stage.id] === opt.id;
            return (
              <motion.button key={opt.id} variants={itemVariants} onClick={() => onSelect(opt.id)} className={`group p-4 rounded-2xl border text-left transition-all backdrop-blur-xl ${isSelected ? "border-primary bg-primary/10 text-foreground shadow-[0_0_30px_rgba(245,174,56,0.14)]" : "border-white/10 bg-white/[0.035] text-foreground/75 hover:border-primary/30 hover:bg-white/[0.06]"}`}>
                <div className="flex items-start gap-3">
                  {Icon && <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isSelected ? "bg-primary/20" : "bg-white/5"}`}><Icon className={`w-4 h-4 ${isSelected ? "text-primary" : "text-muted-foreground group-hover:text-primary"}`} /></div>}
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{opt.label}</p>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                    </div>
                    {opt.desc && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{opt.desc}</p>}
                    {opt.price && <p className="text-xs text-primary mt-2 font-mono">{opt.price}</p>}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      )}

      {stage.options && stage.multiSelect && (
        <motion.div variants={containerVariants} className="flex flex-wrap gap-2 justify-center mb-8">
          {stage.options.map((opt) => {
            const isSelected = multiSelections.includes(opt.id);
            return (
              <motion.button key={opt.id} variants={itemVariants} onClick={() => onSelect(opt.id)} className={`px-4 py-2.5 rounded-full border text-sm transition-all ${isSelected ? "border-primary bg-primary/10 text-primary shadow-[0_0_20px_rgba(245,174,56,0.12)]" : "border-white/10 bg-white/[0.04] text-muted-foreground hover:border-primary/30 hover:text-foreground"}`}>
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 inline mr-1.5" />}{opt.label}
              </motion.button>
            );
          })}
        </motion.div>
      )}

      {stage.reducedMotion && (
        <motion.p variants={itemVariants} className="mx-auto mb-5 max-w-lg text-center text-[11px] leading-relaxed text-muted-foreground/70">
          {stage.reducedMotion}
        </motion.p>
      )}

      {stage.quickLinks?.length > 0 && (
        <motion.div variants={itemVariants} className="mb-5 flex flex-wrap justify-center gap-2">
          {stage.quickLinks.map((link) => (
            <Link key={link.route} to={link.route} className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </motion.div>
      )}

      <motion.div variants={itemVariants} className="flex justify-center">
        <Button size="lg" onClick={onNext} disabled={!canProceed()} className="bg-primary text-primary-foreground hover:bg-primary/90 px-10 gap-2 disabled:opacity-40 shadow-[0_0_40px_rgba(245,174,56,0.18)]">
          {stage.cta} {isLastStage ? <Sparkles className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </Button>
      </motion.div>
    </motion.div>
  );
}