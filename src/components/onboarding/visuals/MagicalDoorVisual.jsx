import { motion } from "framer-motion";
import { VisualShell } from "./visualPrimitives";

// An enigmatic door that opens; from a small dim point a bright light flashes, then resets. Loops forever.
export default function MagicalDoorVisual({ reduceMotion = false }) {
  const CYCLE = 6;
  return (
    <VisualShell>
      <div className="absolute inset-0 flex items-center justify-center">
        {/* outer mystical glow */}
        <motion.div
          className="absolute h-56 w-44 rounded-full bg-[#D6A85A]/10 blur-3xl"
          animate={reduceMotion ? {} : { opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: CYCLE, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* door frame */}
        <div className="relative h-44 w-28 rounded-t-[3.5rem] border-2 border-[#D6A85A]/40 bg-[#0a1120] shadow-[0_0_50px_rgba(214,168,90,0.25)] overflow-hidden">
          {/* the light behind the doors */}
          <motion.div
            className="absolute inset-0 z-0 bg-gradient-to-t from-white via-[#FBEFC9] to-[#D6A85A]"
            animate={reduceMotion ? { opacity: 0.5 } : {
              opacity: [0.05, 0.05, 0.4, 1, 0.4, 0.05],
            }}
            transition={{ duration: CYCLE, times: [0, 0.25, 0.45, 0.55, 0.75, 1], repeat: Infinity, ease: "easeInOut" }}
          />
          {/* central flash burst */}
          <motion.div
            className="absolute left-1/2 top-1/2 z-10 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
            animate={reduceMotion ? { opacity: 0.4, scale: 1 } : {
              opacity: [0, 0, 1, 0.2, 0],
              scale: [0.4, 0.6, 6, 3, 0.4],
              boxShadow: ["0 0 0 rgba(255,255,255,0)", "0 0 0 rgba(255,255,255,0)", "0 0 60px rgba(255,255,255,0.95)", "0 0 20px rgba(255,255,255,0.4)", "0 0 0 rgba(255,255,255,0)"],
            }}
            transition={{ duration: CYCLE, times: [0, 0.4, 0.52, 0.62, 1], repeat: Infinity, ease: "easeOut" }}
          />

          {/* left door panel */}
          <motion.div
            className="absolute left-0 top-0 z-20 h-full w-1/2 rounded-tl-[3.5rem] border-r border-[#D6A85A]/30 bg-gradient-to-br from-[#161f33] to-[#0a1120]"
            style={{ transformOrigin: "left center" }}
            animate={reduceMotion ? {} : { rotateY: [0, 0, -78, -78, 0], scaleX: [1, 1, 0.4, 0.4, 1] }}
            transition={{ duration: CYCLE, times: [0, 0.3, 0.5, 0.85, 1], repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="absolute right-2 top-1/2 h-4 w-1 -translate-y-1/2 rounded-full bg-[#D6A85A]/50" />
          </motion.div>

          {/* right door panel */}
          <motion.div
            className="absolute right-0 top-0 z-20 h-full w-1/2 rounded-tr-[3.5rem] border-l border-[#D6A85A]/30 bg-gradient-to-bl from-[#161f33] to-[#0a1120]"
            style={{ transformOrigin: "right center" }}
            animate={reduceMotion ? {} : { rotateY: [0, 0, 78, 78, 0], scaleX: [1, 1, 0.4, 0.4, 1] }}
            transition={{ duration: CYCLE, times: [0, 0.3, 0.5, 0.85, 1], repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="absolute left-2 top-1/2 h-4 w-1 -translate-y-1/2 rounded-full bg-[#D6A85A]/50" />
          </motion.div>
        </div>

        {/* drifting embers */}
        {!reduceMotion && [0, 1, 2, 3].map(i => (
          <motion.span
            key={i}
            className="absolute h-1 w-1 rounded-full bg-[#F1D59A]"
            style={{ left: `${42 + i * 5}%`, top: "55%" }}
            animate={{ y: [-4, -34], opacity: [0, 0.9, 0] }}
            transition={{ duration: 3, delay: i * 0.5, repeat: Infinity, ease: "easeOut" }}
          />
        ))}
      </div>
    </VisualShell>
  );
}