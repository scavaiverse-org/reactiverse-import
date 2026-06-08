import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import ScoversOnboardingVisual from "./ScoversOnboardingVisual";
import { getSlideTransition, getTitleAnimation } from "./onboardingMotion";

function AnimatedTitle({ text, anim }) {
  if (!text) return null;
  if (!anim.perWord) {
    return (
      <motion.span variants={anim.child} initial="initial" animate="animate" className="inline-block">
        {text}
      </motion.span>
    );
  }
  const words = text.split(" ");
  return (
    <motion.span variants={anim.container} initial="initial" animate="animate" className="inline-block" style={{ perspective: 800 }}>
      {words.map((word, i) => (
        <motion.span key={`${word}-${i}`} variants={anim.child} className="mr-[0.25em] inline-block">
          {word}
        </motion.span>
      ))}
    </motion.span>
  );
}

export default function OnboardingSlide({ slide, reduceMotion = false }) {
  const slideTransition = getSlideTransition(slide.anim, reduceMotion);
  const titleAnim = getTitleAnimation(slide.anim, reduceMotion);

  if (slide.prefaceLines?.length > 0) {
    return (
      <motion.div key={slide.key} {...slideTransition} className="grid gap-7 text-left lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="scale-[1.2] origin-center"><ScoversOnboardingVisual visualType={slide.visualType} slide={slide} reduceMotion={reduceMotion} /></div>
        <div className="space-y-4">
          {slide.prefaceLines.map((line, i) => (
            <motion.p
              key={line}
              className="font-display text-3xl font-medium leading-snug text-white sm:text-4xl"
              initial={reduceMotion ? false : { opacity: 0, y: 18, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 0.15 + i * 0.28, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              {line}
            </motion.p>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div key={slide.key} {...slideTransition} className="grid gap-7 text-left lg:grid-cols-[0.9fr_1.1fr] lg:items-center pb-[10%]">
      <div className="scale-[1.2] origin-center overflow-hidden rounded-lg mt-[10%]"><ScoversOnboardingVisual visualType={slide.visualType} slide={slide} reduceMotion={reduceMotion} /></div>
      <div>
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200/20 bg-white/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.28em] text-slate-200">
          <span>{slide.chapter}</span>
          <span className="h-1 w-1 rounded-full bg-slate-300/60" />
          <span>{slide.eyebrow}</span>
        </div>
        <h2 className="font-display text-5xl font-semibold leading-tight text-white sm:text-7xl">
          <AnimatedTitle text={slide.title} anim={titleAnim} />
        </h2>
        <motion.p className="mt-5 max-w-2xl text-xl leading-8 text-slate-200/80 sm:text-2xl" initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={reduceMotion ? {} : { opacity: 1, y: 0 }} transition={{ delay: 0.28, duration: 0.7 }}>
          {slide.subtitle}
        </motion.p>
        <motion.p className="mt-4 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg" initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={reduceMotion ? {} : { opacity: 1, y: 0 }} transition={{ delay: 0.36, duration: 0.7 }}>
          {slide.body}
        </motion.p>

        {slide.summary && (
          <motion.p
            className="mt-5 max-w-2xl font-display text-lg font-medium leading-7 text-[#D6A85A] sm:text-xl"
            initial={reduceMotion ? false : { opacity: 0, y: 14, filter: "blur(6px)" }}
            animate={reduceMotion ? {} : { opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.48, duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          >
            {slide.summary}
          </motion.p>
        )}

        {slide.supportingPoints?.length > 0 && (
          <motion.div className="mt-6 grid gap-2.5 sm:grid-cols-2" initial={reduceMotion ? false : { opacity: 0, y: 14 }} animate={reduceMotion ? {} : { opacity: 1, y: 0 }} transition={{ delay: 0.56, duration: 0.6 }}>
            {slide.supportingPoints.map((point) => (
              <div key={point} className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-base text-slate-200/80 backdrop-blur-sm">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-slate-200" />
                <span>{point}</span>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}