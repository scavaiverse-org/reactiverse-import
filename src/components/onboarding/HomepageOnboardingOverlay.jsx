import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { RotateCcw, Sparkles, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import useOnboardingAudio from "@/components/audio/useOnboardingAudio";
import OnboardingSlide from "./OnboardingSlide";
import OnboardingProgress from "./OnboardingProgress";
import CinematicTextureLayer from "./CinematicTextureLayer";
import GoldDustField from "./GoldDustField";
import OperaLightSweep from "./OperaLightSweep";
import { SCOVERS_ONBOARDING_SLIDES, SCOVERS_ONBOARDING_VIDEO_URL } from "@/lib/scovers-onboarding-content";

export default function HomepageOnboardingOverlay({ open, onClose, onMarkSeen }) {
  const [current, setCurrent] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const cardRef = useRef(null);
  const videoRef = useRef(null);
  const navigate = useNavigate();
  const slides = SCOVERS_ONBOARDING_SLIDES;
  const slide = slides[current];
  const isFinal = current === slides.length - 1;
  const { musicAsset, autoplayBlocked, musicEnabled, enableAudio, replayMusic, stopMusic } = useOnboardingAudio({ open, targetKey: "home_onboarding_intro" });

  useEffect(() => {
    setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (!open || !videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play().catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setTimeout(() => cardRef.current?.focus(), 50);

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        stopMusic();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !cardRef.current) return;
      const focusable = cardRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, stopMusic]);

  const replayVideo = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play().catch(() => {});
  };

  const handleMusicToggle = () => {
    if (musicEnabled) {
      stopMusic({ reset: false, fade: true });
      return;
    }
    enableAudio();
  };

  const handleRoute = async (route) => {
    await stopMusic({ reset: true, fade: true });
    onMarkSeen();
    navigate(route);
  };

  const handleNext = async () => {
    if (slide.primaryCtaRoute && slide.primaryCtaRoute !== "__NEXT__") {
      await handleRoute(slide.primaryCtaRoute);
      return;
    }
    if (isFinal) {
      setCurrent(0);
      replayVideo();
      replayMusic();
      return;
    }
    setCurrent((value) => value + 1);
  };

  const handleSkip = async () => {
    await handleRoute(slide.secondaryCtaRoute || "/platform/overview");
  };

  const handleReplay = () => {
    setCurrent(0);
    replayVideo();
    replayMusic();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex h-screen w-screen items-center justify-center overflow-y-auto overflow-x-hidden px-4 py-5 sm:px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.1 : 0.6, ease: "easeOut" }}
          aria-modal="true"
          role="dialog"
          aria-label="SCAVerse first-time visitor introduction"
        >
          <video ref={videoRef} autoPlay muted loop playsInline preload="auto" className="pointer-events-none absolute inset-0 z-[100] h-full w-full object-cover" aria-hidden="true">
            <source src={SCOVERS_ONBOARDING_VIDEO_URL} type="video/mp4" />
          </video>
          <div className="pointer-events-none absolute inset-0 z-[101] bg-black/50" />
          <div className="pointer-events-none absolute inset-0 z-[102] bg-gradient-to-br from-[#02050b]/90 via-[#07101d]/50 to-black/90" />
          <div className="pointer-events-none absolute inset-0 z-[103]">
            <CinematicTextureLayer reduceMotion={reduceMotion} />
            <GoldDustField reduceMotion={reduceMotion} />
          </div>
          <motion.div
            className="pointer-events-none fixed inset-0 z-[105] opacity-50"
            animate={reduceMotion ? {} : { backgroundPosition: ["0% 0%", "100% 100%"] }}
            transition={{ duration: 16, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
            style={{ backgroundImage: "linear-gradient(115deg, transparent 0%, rgba(226,232,240,0.07) 38%, transparent 64%)", backgroundSize: "240% 240%" }}
          />

          {autoplayBlocked && (
            <button type="button" onClick={enableAudio} className="absolute bottom-8 right-8 z-[120] rounded-full border border-white/20 bg-black/60 px-5 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-white backdrop-blur-xl hover:bg-black/80">
              Tap to Enable Sound
            </button>
          )}

          <motion.div
            ref={cardRef}
            tabIndex={-1}
            className="relative z-[110] my-auto max-h-[94vh] w-full max-w-[984px] overflow-y-auto rounded-[2rem] border border-slate-200/20 bg-[#050914]/80 p-6 shadow-[0_30px_120px_rgba(0,0,0,0.76),0_0_70px_rgba(226,232,240,0.10)] outline-none backdrop-blur-2xl sm:p-10"
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: reduceMotion ? 0.1 : 0.72, ease: "easeOut" }}
          >
            <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[2rem]"><OperaLightSweep reduceMotion={reduceMotion} /></div>
            <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#D6A85A]/70 to-transparent" />
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/20 bg-slate-200/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-100/80">
                <Sparkles className="h-3.5 w-3.5" /> SCAVerse Intro
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                {musicAsset?.fileUrl && (
                  <Button type="button" variant="outline" size="sm" onClick={handleMusicToggle} className="border-slate-200/20 bg-slate-200/10 text-slate-100 hover:bg-slate-200/20 hover:text-white">
                    {musicEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                    {musicEnabled ? "Music On" : "Play Music"}
                  </Button>
                )}
                <Button type="button" variant="ghost" size="sm" onClick={handleReplay} className="text-foreground/60 hover:bg-white/10 hover:text-foreground">
                  <RotateCcw className="h-3.5 w-3.5" /> Replay Animation
                </Button>
              </div>
            </div>

            <div className="relative z-10">
              <AnimatePresence mode="wait">
                <OnboardingSlide key={slide.key} slide={slide} reduceMotion={reduceMotion} />
              </AnimatePresence>

              <OnboardingProgress
                current={current}
                total={slides.length}
                chapter={slide.chapter}
                primaryLabel={slide.primaryCtaLabel}
                canGoBack={current > 0}
                onBack={() => setCurrent((value) => Math.max(0, value - 1))}
                onNext={handleNext}
                onSkip={handleSkip}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}