import { motion } from "framer-motion";
import { VisualShell } from "./visualPrimitives";

const EASE = [0.16, 1, 0.3, 1];
const FALLBACK_SOURCES = ["Public Layer", "Admin Layer", "Data Layer", "Render Engine", "Analytics Loop"];
const NODE_POSITIONS = [
  "left-[31%] top-[10%]",
  "left-[10%] top-[28%]",
  "right-[8%] top-[28%]",
  "left-[10%] bottom-[16%]",
  "right-[8%] bottom-[16%]",
];
const NODE_COLORS = [
  "border-[#D6A85A]/50 bg-[#D6A85A]/15 text-[#F3D79A] shadow-[0_0_38px_rgba(214,168,90,0.22)]",
  "border-sky-200/35 bg-sky-300/10 text-sky-100 shadow-[0_0_34px_rgba(125,211,252,0.18)]",
  "border-emerald-200/35 bg-emerald-300/10 text-emerald-100 shadow-[0_0_34px_rgba(110,231,183,0.16)]",
  "border-violet-200/35 bg-violet-300/10 text-violet-100 shadow-[0_0_34px_rgba(196,181,253,0.18)]",
  "border-rose-200/35 bg-rose-300/10 text-rose-100 shadow-[0_0_34px_rgba(251,113,133,0.16)]",
];

export default function FinalActivationVisual({ slide, reduceMotion = false }) {
  const sources = (slide?.featureSources?.length ? slide.featureSources : FALLBACK_SOURCES).slice(0, 5);
  const systemLines = slide?.prefaceLines || [];

  return (
    <VisualShell>
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute inset-5 rounded-[2rem] border border-[#D6A85A]/25 bg-[radial-gradient(circle_at_50%_50%,rgba(214,168,90,0.14),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.05),transparent_58%)]"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.86, rotate: -4 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.9, ease: EASE }}
        />

        {[0, 1, 2].map((ring) => (
          <motion.div
            key={ring}
            className="absolute left-1/2 top-1/2 rounded-full border border-[#D6A85A]/30"
            style={{ width: 118 + ring * 76, height: 118 + ring * 76, marginLeft: -(59 + ring * 38), marginTop: -(59 + ring * 38) }}
            animate={reduceMotion ? {} : { rotate: ring % 2 ? -360 : 360, opacity: [0.18, 0.48, 0.18] }}
            transition={{ duration: 18 + ring * 5, repeat: Infinity, ease: "linear" }}
          />
        ))}

        <motion.div
          className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/35 bg-gradient-to-br from-[#D6A85A]/35 via-white/15 to-sky-300/15 shadow-[0_0_90px_rgba(214,168,90,0.34)]"
          initial={reduceMotion ? false : { scale: 0.45, opacity: 0, filter: "blur(12px)" }}
          animate={reduceMotion ? { opacity: 1 } : { scale: [1, 1.08, 1], opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 2.8, repeat: reduceMotion ? 0 : Infinity, ease: "easeInOut" }}
        >
          <div className="absolute inset-4 rounded-full border border-white/30 bg-black/20" />
          <div className="absolute inset-10 rounded-full bg-[#D6A85A] shadow-[0_0_45px_rgba(214,168,90,0.55)]" />
        </motion.div>

        {sources.map((source, index) => (
          <motion.div
            key={source}
            className={`absolute ${NODE_POSITIONS[index]} rounded-2xl border px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.18em] backdrop-blur-xl ${NODE_COLORS[index]}`}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.65, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.16, duration: 0.65, ease: EASE }}
          >
            {source}
          </motion.div>
        ))}

        {sources.map((source, index) => (
          <motion.div
            key={`${source}-beam`}
            className="absolute left-1/2 top-1/2 h-px w-[38%] origin-left bg-gradient-to-r from-[#D6A85A]/60 via-white/30 to-transparent"
            style={{ rotate: `${index * (360 / sources.length) - 90}deg` }}
            initial={reduceMotion ? false : { scaleX: 0, opacity: 0 }}
            animate={reduceMotion ? { opacity: 0.5 } : { scaleX: [0, 1, 0.72], opacity: [0, 0.8, 0.35] }}
            transition={{ delay: 0.34 + index * 0.12, duration: 1.2, ease: EASE }}
          />
        ))}

        <div className="absolute inset-x-7 bottom-7 grid gap-1.5">
          {systemLines.map((line, index) => (
            <motion.div
              key={line}
              className="rounded-full border border-white/10 bg-black/28 px-3 py-1.5 text-[9px] font-medium uppercase tracking-[0.16em] text-white/70 backdrop-blur"
              initial={reduceMotion ? false : { opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.75 + index * 0.14, duration: 0.55, ease: EASE }}
            >
              {line}
            </motion.div>
          ))}
        </div>

        <motion.div
          className="absolute inset-x-10 top-9 h-px bg-gradient-to-r from-transparent via-[#D6A85A]/70 to-transparent"
          animate={reduceMotion ? {} : { scaleX: [0.35, 1, 0.35], opacity: [0.25, 0.9, 0.25] }}
          transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </VisualShell>
  );
}