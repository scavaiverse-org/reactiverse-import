import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import OnboardingFlow from "./OnboardingFlow";

export default function HomepageOnboardingOverlay({ open, onClose, onMarkSeen }) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const cardRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setTimeout(() => cardRef.current?.focus(), 50);

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
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
  }, [open, onClose]);

  const handleNavigate = (route) => {
    onMarkSeen();
    navigate(route);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex h-screen w-screen items-center justify-center overflow-y-auto overflow-x-hidden bg-background/95 px-4 py-5 backdrop-blur-2xl sm:px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.1 : 0.45, ease: "easeOut" }}
          aria-modal="true"
          role="dialog"
          aria-label="SCAVers introduction"
        >
          <motion.div
            ref={cardRef}
            tabIndex={-1}
            className="relative z-[110] my-auto max-h-[94vh] w-full max-w-[984px] overflow-y-auto rounded-[2rem] border border-white/10 bg-card/90 p-6 shadow-[0_30px_120px_rgba(0,0,0,0.5)] outline-none backdrop-blur-2xl sm:p-10"
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: reduceMotion ? 0.1 : 0.5, ease: "easeOut" }}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close intro"
              className="absolute right-4 top-4 z-[120] flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-foreground/70 hover:bg-white/10 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            <OnboardingFlow onNavigate={handleNavigate} className="mx-auto max-w-3xl" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
