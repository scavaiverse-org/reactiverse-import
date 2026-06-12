import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Volume2, VolumeX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import useOnboardingAudio from "@/components/audio/useOnboardingAudio";
import OnboardingFlow from "./OnboardingFlow";
import { SCAVERSE_ONBOARDING_VIDEO_URL } from "@/lib/scaverse-onboarding-content";

export default function HomepageOnboardingOverlay({ open, onClose, onMarkSeen }) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const cardRef = useRef(null);
  const videoRef = useRef(null);
  const navigate = useNavigate();
  const { musicAsset, autoplayBlocked, musicEnabled, enableAudio, stopMusic } = useOnboardingAudio({ open, targetKey: "home_onboarding_intro" });

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

  const handleMusicToggle = () => {
    if (musicEnabled) {
      stopMusic({ reset: false, fade: true });
      return;
    }
    enableAudio();
  };

  const handleNavigate = async (route) => {
    await stopMusic({ reset: true, fade: true });
    // Close (not just mark seen): the final consumer CTA routes to "/", and
    // when we're already on "/" the navigation is a no-op — without closing,
    // the overlay would stay frozen on screen.
    onMarkSeen();
    onClose();
    navigate(route);
  };

  const handleClose = () => {
    stopMusic();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex h-screen w-screen items-center justify-center overflow-y-auto overflow-x-hidden px-4 py-5 sm:px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.1 : 0.45, ease: "easeOut" }}
          aria-modal="true"
          role="dialog"
          aria-label="SCAVerse introduction"
        >
          <video ref={videoRef} autoPlay muted loop playsInline preload="auto" className="pointer-events-none absolute inset-0 z-[100] h-full w-full object-cover" aria-hidden="true">
            <source src={SCAVERSE_ONBOARDING_VIDEO_URL} type="video/mp4" />
          </video>
          <div className="pointer-events-none absolute inset-0 z-[101] bg-background/80 backdrop-blur-2xl" />

          {autoplayBlocked && (
            <button type="button" onClick={enableAudio} className="absolute bottom-8 right-8 z-[120] rounded-full border border-white/20 bg-black/60 px-5 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-white backdrop-blur-xl hover:bg-black/80">
              Tap to Enable Sound
            </button>
          )}

          <motion.div
            ref={cardRef}
            tabIndex={-1}
            className="relative z-[110] my-auto max-h-[94vh] w-full max-w-[984px] overflow-y-auto rounded-[2rem] border border-white/10 bg-card/90 p-6 shadow-[0_30px_120px_rgba(0,0,0,0.5)] outline-none backdrop-blur-2xl sm:p-10"
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: reduceMotion ? 0.1 : 0.5, ease: "easeOut" }}
          >
            <div className="absolute right-4 top-4 z-[120] flex items-center gap-2">
              {musicAsset?.fileUrl && (
                <Button type="button" variant="outline" size="sm" onClick={handleMusicToggle} className="border-white/10 bg-white/5 text-foreground/70 hover:bg-white/10 hover:text-foreground">
                  {musicEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                  {musicEnabled ? "Music On" : "Play Music"}
                </Button>
              )}
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close intro"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-foreground/70 hover:bg-white/10 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <OnboardingFlow onNavigate={handleNavigate} className="mx-auto max-w-3xl" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
