export const EASE_CINEMATIC = [0.25, 0.46, 0.45, 0.94];

export const VIEWPORT_REVEAL = {
  once: true,
  margin: "-50px",
  amount: 0.15,
};

export const TEXT_REVEAL = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

export const HEADING_REVEAL = {
  hidden: { opacity: 0, y: 44 },
  visible: { opacity: 1, y: 0 },
};

export const SECTION_REVEAL = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0 },
};

export const CARD_REVEAL = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const PAGE_FADE = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const STAGGER_CONTAINER = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.08,
    },
  },
};

export const STAGGER_CHILD = CARD_REVEAL;

export const transitionFor = ({ duration = 0.9, delay = 0 } = {}) => ({
  duration,
  delay,
  ease: EASE_CINEMATIC,
});