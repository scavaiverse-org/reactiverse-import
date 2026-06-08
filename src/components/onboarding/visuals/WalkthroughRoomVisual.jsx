import { motion } from "framer-motion";
import { VisualShell, appear } from "./visualPrimitives";

const STORY_TITLES = [
  "The Silk Road Awakens",
  "Echoes of the Ming Court",
  "Masks of the Opera",
  "Bronze & Ember",
  "The Cartographer's Dream",
  "Whispers of Dunhuang",
  "Lanterns Over the Bay",
  "The Forgotten Dynasty",
];

export default function WalkthroughRoomVisual({ reduceMotion = false }) {
  return (
    <VisualShell>
      <motion.div className="absolute inset-5 rounded-2xl bg-gradient-to-b from-slate-300/10 to-slate-950/30" {...appear(0, reduceMotion)} />
      <div className="absolute left-10 right-10 top-10 grid grid-cols-3 gap-2 opacity-20">
        {[0, 1, 2].map(i => <span key={i} className="h-16 rounded-xl border border-slate-200/10 bg-black/10" />)}
      </div>

      {/* Story titles zoom in from depth until they vanish */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ perspective: 700 }}>
        {STORY_TITLES.map((title, i) => (
          <motion.div
            key={title}
            className="absolute whitespace-nowrap font-display text-base font-semibold tracking-wide text-[#F1D59A]"
            style={{ textShadow: "0 0 22px rgba(214,168,90,0.55)" }}
            animate={reduceMotion ? { opacity: 0.6, scale: 1 } : {
              opacity: [0, 0.9, 0.9, 0],
              scale: [0.2, 1.1, 1.8, 2.6],
              z: [-300, 0, 120, 260],
            }}
            transition={{
              duration: 4,
              delay: i * 1,
              repeat: Infinity,
              repeatDelay: STORY_TITLES.length * 1 - 4,
              ease: "easeIn",
            }}
          >
            {title}
          </motion.div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(5,9,20,0.6)_85%)]" />
    </VisualShell>
  );
}