import { motion } from "framer-motion";
import { VisualShell, EASE } from "./visualPrimitives";

export default function PortalRevealVisual({ reduceMotion = false }) {
  return (
    <VisualShell>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="absolute h-44 w-44 rounded-full bg-sky-200/5 blur-2xl" />
        {[0, 1, 2].map(i => (
          <motion.div key={i} className="absolute rounded-full border border-slate-100/20 shadow-[inset_0_0_22px_rgba(226,232,240,0.05)]" style={{ width: 110 + i * 46, height: 110 + i * 46 }} {...(reduceMotion ? {} : { initial: { opacity: 0, scale: 0.72 }, animate: { opacity: [0, 0.9, 0.35], scale: [0.72, 1, 1.06] }, transition: { delay: i * 0.35, duration: 1.6, ease: EASE } })} />
        ))}
        {["top-10 left-14", "bottom-12 left-20", "top-16 right-16", "bottom-16 right-24"].map((pos, i) => (
          <motion.span key={pos} className={`absolute ${pos} h-1.5 w-1.5 rounded-full bg-slate-100/60 shadow-[0_0_18px_rgba(226,232,240,0.5)]`} animate={reduceMotion ? {} : { opacity: [0.25, 1, 0.25], scale: [0.9, 1.25, 0.9] }} transition={{ duration: 2.2, delay: i * 0.3, repeat: Infinity }} />
        ))}
        {!reduceMotion && [0, 1, 2].map(i => (
          <motion.div
            key={`pulse-${i}`}
            className="absolute h-28 w-28 rounded-[2rem] border border-slate-100/40"
            initial={{ opacity: 0.55, scale: 1 }}
            animate={{ opacity: 0, scale: 2.6 }}
            transition={{ duration: 3, delay: i * 1, repeat: Infinity, ease: "easeOut" }}
          />
        ))}
        <motion.div className="absolute h-28 w-28 rounded-[2rem] border border-slate-100/30 bg-slate-100/10 shadow-[0_0_70px_rgba(226,232,240,0.24)]" {...(reduceMotion ? {} : { initial: { opacity: 0, scale: 0.8 }, animate: { opacity: 1, scale: 1 }, transition: { delay: 0.2, duration: 0.8 } })} />
        <motion.div className="absolute h-20 w-20 rounded-[1.35rem] border border-sky-100/20 bg-black/10" animate={reduceMotion ? {} : { rotate: [0, 3, -3, 0] }} transition={{ duration: 5, repeat: Infinity }} />
        <motion.div className="absolute text-center" {...(reduceMotion ? {} : { initial: { opacity: 0, letterSpacing: "0.28em" }, animate: { opacity: 1, letterSpacing: "0.16em" }, transition: { delay: 0.75, duration: 0.9, ease: EASE } })}>
          <div className="font-display text-lg font-bold text-white">SCAVERSE</div>
          <div className="mt-1 text-[8px] uppercase tracking-[0.26em] text-slate-300/70">Civilization Engine</div>
        </motion.div>
      </div>
    </VisualShell>
  );
}