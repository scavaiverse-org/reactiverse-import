import { motion } from "framer-motion";
import { Image, Film, Music, Box } from "lucide-react";
import { VisualShell } from "./visualPrimitives";

// Raw media types stream in from the left and converge into a glowing museum artifact on a pedestal.
const media = [
  { Icon: Image, y: "26%" },
  { Icon: Film, y: "50%" },
  { Icon: Music, y: "74%" },
];

export default function MediaArtifactVisual({ reduceMotion = false }) {
  return (
    <VisualShell>
      <div className="absolute inset-0">
        {/* incoming media chips */}
        {media.map(({ Icon, y }, i) => (
          <motion.div
            key={i}
            className="absolute flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg border border-slate-200/25 bg-slate-200/10 text-slate-200"
            style={{ left: "10%", top: y }}
            animate={reduceMotion ? {} : { left: ["10%", "44%"], opacity: [1, 1, 0], scale: [1, 0.6] }}
            transition={{ duration: 1.8, delay: i * 0.5, repeat: Infinity, repeatDelay: 1.4, ease: "easeIn" }}
          >
            <Icon className="h-3.5 w-3.5" />
          </motion.div>
        ))}

        {/* convergence glow */}
        <motion.div
          className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(147,197,253,0.35),transparent_70%)]"
          animate={reduceMotion ? {} : { scale: [0.9, 1.15, 0.9], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* resulting artifact + pedestal */}
        <motion.div
          className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
          animate={reduceMotion ? {} : { y: ["-52%", "-56%", "-52%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.div
            className="flex h-16 w-16 items-center justify-center rounded-2xl border border-sky-100/40 bg-gradient-to-br from-sky-300/25 to-indigo-400/15 text-white shadow-[0_0_50px_rgba(147,197,253,0.4)]"
            animate={reduceMotion ? {} : { rotate: [0, 6, 0, -6, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            <Box className="h-6 w-6" />
          </motion.div>
        </motion.div>

        {/* pedestal */}
        <div className="absolute left-1/2 bottom-9 h-2.5 w-24 -translate-x-1/2 rounded-full bg-slate-200/15 blur-[1px]" />
        <div className="absolute left-1/2 bottom-7 h-1 w-16 -translate-x-1/2 rounded-full bg-slate-200/10" />
        <div className="absolute left-1/2 bottom-3 -translate-x-1/2 text-[8px] uppercase tracking-[0.22em] text-slate-300/70">Museum Object</div>
      </div>
    </VisualShell>
  );
}