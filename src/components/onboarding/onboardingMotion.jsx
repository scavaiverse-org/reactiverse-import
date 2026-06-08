// Per-slide font + transition animation presets for the onboarding overlay.
// Each preset returns framer-motion props for the slide container (transition)
// and a `title`/`text` variant generator for cinematic font reveals.

const easeCinematic = [0.16, 1, 0.3, 1];

// Slide-level container transitions keyed by animation name.
export const SLIDE_TRANSITIONS = {
  rise: {
    initial: { opacity: 0, y: 40, scale: 0.97 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -32, scale: 0.98 },
    transition: { duration: 0.8, ease: easeCinematic },
  },
  drift: {
    initial: { opacity: 0, x: 60 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
    transition: { duration: 0.85, ease: easeCinematic },
  },
  zoom: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.04 },
    transition: { duration: 0.8, ease: easeCinematic },
  },
  unfold: {
    initial: { opacity: 0, y: 32, rotateX: 8 },
    animate: { opacity: 1, y: 0, rotateX: 0 },
    exit: { opacity: 0, y: -24, rotateX: -6 },
    transition: { duration: 0.85, ease: easeCinematic },
  },
  system: {
    initial: { opacity: 0, scale: 0.86, rotateX: 12, filter: "blur(10px)" },
    animate: { opacity: 1, scale: 1, rotateX: 0, filter: "blur(0px)" },
    exit: { opacity: 0, scale: 1.08, filter: "blur(8px)" },
    transition: { duration: 1.05, ease: easeCinematic },
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.7, ease: "easeOut" },
  },
  system_activation: {
    initial: { opacity: 0, scale: 0.86, rotateX: 10, filter: "blur(14px)" },
    animate: { opacity: 1, scale: 1, rotateX: 0, filter: "blur(0px)" },
    exit: { opacity: 0, scale: 1.08, filter: "blur(10px)" },
    transition: { duration: 1.05, ease: easeCinematic },
  },
};

// Title font-reveal styles keyed by animation name.
export const TITLE_ANIMATIONS = {
  // Per-word staggered rise
  rise: {
    container: { animate: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } } },
    child: {
      initial: { opacity: 0, y: 28, filter: "blur(8px)" },
      animate: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: easeCinematic } },
    },
    perWord: true,
  },
  // Per-word horizontal drift
  drift: {
    container: { animate: { transition: { staggerChildren: 0.07, delayChildren: 0.12 } } },
    child: {
      initial: { opacity: 0, x: 24, filter: "blur(6px)" },
      animate: { opacity: 1, x: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: easeCinematic } },
    },
    perWord: true,
  },
  // Whole-title blur-in zoom
  zoom: {
    container: { animate: { transition: { delayChildren: 0.1 } } },
    child: {
      initial: { opacity: 0, scale: 0.92, filter: "blur(10px)" },
      animate: { opacity: 1, scale: 1, filter: "blur(0px)", transition: { duration: 0.75, ease: easeCinematic } },
    },
    perWord: false,
  },
  // Per-word unfold from below
  unfold: {
    container: { animate: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } } },
    child: {
      initial: { opacity: 0, y: 32, rotateX: 40 },
      animate: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.65, ease: easeCinematic } },
    },
    perWord: true,
  },
  system: {
    container: { animate: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } } },
    child: {
      initial: { opacity: 0, y: 20, scale: 0.96, filter: "blur(8px)" },
      animate: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transition: { duration: 0.72, ease: easeCinematic } },
    },
    perWord: true,
  },
  fade: {
    container: { animate: { transition: { delayChildren: 0.1 } } },
    child: {
      initial: { opacity: 0 },
      animate: { opacity: 1, transition: { duration: 0.7, ease: "easeOut" } },
    },
    perWord: false,
  },
  system_activation: {
    container: { animate: { transition: { staggerChildren: 0.1, delayChildren: 0.08 } } },
    child: {
      initial: { opacity: 0, y: 22, scale: 0.94, filter: "blur(10px)" },
      animate: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transition: { duration: 0.75, ease: easeCinematic } },
    },
    perWord: true,
  },
};

export function getSlideTransition(name, reduceMotion) {
  if (reduceMotion) return SLIDE_TRANSITIONS.fade;
  return SLIDE_TRANSITIONS[name] || SLIDE_TRANSITIONS.rise;
}

export function getTitleAnimation(name, reduceMotion) {
  if (reduceMotion) return TITLE_ANIMATIONS.fade;
  return TITLE_ANIMATIONS[name] || TITLE_ANIMATIONS.rise;
}