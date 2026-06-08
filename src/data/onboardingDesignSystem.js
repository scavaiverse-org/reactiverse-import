// Cinematic onboarding design database — Asian Operatic Museum x cinematic AI world.
// Layered ON TOP of the existing SCAVerse onboarding. Does not replace brand palette.

export const onboardingColors = {
  inkBlack: "#090607",
  operaBlack: "#120A0C",
  deepMaroon: "#2A0F14",
  lacquerRed: "#7A1E25",
  emberRed: "#B83A32",
  antiqueGold: "#D6A85A",
  softGold: "#F1D59A",
  porcelain: "#FFF4E2",
  warmIvory: "#F8E7C1",
  jadeMist: "#8FB8A8",
  shadowViolet: "#2A1834",
  bronze: "#A66A3F",
  ricePaper: "#F5E8CE",
};

export const onboardingMotion = {
  cinematicEnter: {
    hidden: { opacity: 0, y: 32, scale: 0.96, filter: "blur(12px)" },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
    },
  },
  slowFloat: {
    animate: {
      y: [0, -14, 0],
      rotate: [0, 1.5, 0],
      transition: { duration: 8, repeat: Infinity, ease: "easeInOut" },
    },
  },
  lightSweep: {
    animate: {
      x: ["-120%", "120%"],
      opacity: [0, 0.24, 0],
      transition: { duration: 5.5, repeat: Infinity, ease: "easeInOut" },
    },
  },
  pulseGlow: {
    animate: {
      opacity: [0.18, 0.38, 0.18],
      scale: [1, 1.04, 1],
      transition: { duration: 6, repeat: Infinity, ease: "easeInOut" },
    },
  },
};

export const slideVisualFormula = {
  background: "existing video or current animated background",
  atmosphere: "cinematic texture layer",
  depth: "floating particles, glow fields, haze, vignette",
  subject: "main visual icon, object, character, portal, map, archive, or symbolic layer",
  copy: "short, emotional, clear",
  cta: "single clear action to next slide",
  skip: "only escape route",
  progress: "visible, elegant, non-distracting",
};

// Creative direction mapped to the ACTUAL SCAVerse slide keys (14 slides).
export const onboardingSlideDirections = {
  enter_scaverse: { mood: "The visitor enters a living cultural portal.", visual: "dark opera stage, gold dust, slow curtain light" },
  one_platform_many_worlds: { mood: "The world opens into many cultural spaces.", visual: "constellation hub, glowing route lines" },
  built_for_visitors: { mood: "The path is human, not a dashboard.", visual: "single luminous visitor path" },
  browse_live_museums: { mood: "Living destinations await discovery.", visual: "floating museum cards, paper depth" },
  every_museum_home: { mood: "Every museum has its own front door.", visual: "branded homepage panels" },
  walkthrough_rooms: { mood: "Stories become rooms you walk through.", visual: "layered room depth, artifact glow" },
  ai_guide: { mood: "A quiet lantern-like guide, not a chatbot.", visual: "intelligence rings, archive scan" },
  commerce_paths: { mood: "Discovery can lead to action.", visual: "silk shadows, gold commerce glow" },
  experience_builder: { mood: "The journey is shaped behind the scenes.", visual: "warm glass builder panels" },
  media_artifacts: { mood: "Media becomes a museum object.", visual: "object silhouettes, golden scan lines" },
  deterministic_design: { mood: "The system stays elegant and ordered.", visual: "snapping architecture diagram" },
  qa_sentinel: { mood: "Readiness is verified before the doors open.", visual: "left-to-right scan nodes" },
  analytics_growth: { mood: "Every journey teaches the operator.", visual: "journey dots collecting into a graph" },
  activate_scaverse: { mood: "A strong, emotional invitation to begin.", visual: "full portal opening, gold crescendo" },
};