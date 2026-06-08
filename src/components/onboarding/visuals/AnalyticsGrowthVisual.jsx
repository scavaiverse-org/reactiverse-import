import { motion } from "framer-motion";
import { VisualShell, appear } from "./visualPrimitives";

const path = ["Home", "Walkthrough", "AI Guide", "Tickets", "Vendors", "Completion"];

export default function AnalyticsGrowthVisual({ reduceMotion = false }) {
  return (
    <VisualShell>
      <div className="absolute left-6 top-8 space-y-3">
        {path.map((p, i) => <motion.div key={p} className="flex items-center gap-2" {...appear(i, reduceMotion)}><span className="h-2 w-2 rounded-full bg-sky-200 shadow-[0_0_12px_rgba(147,197,253,0.55)]" /><span className="text-[9px] text-slate-200/80">{p}</span></motion.div>)}
      </div>
      <motion.div className="absolute bottom-8 right-8 flex h-32 w-40 items-end gap-2 rounded-2xl border border-slate-200/20 bg-slate-200/10 p-4 shadow-inner" {...appear(3, reduceMotion)}>
        {[32, 54, 42, 76, 64, 92].map((h, i) => <motion.span key={i} className="w-3 rounded-t bg-gradient-to-t from-sky-300/30 to-slate-100" style={{ height: `${h}%` }} animate={reduceMotion ? {} : { opacity: [0.65, 1, 0.65] }} transition={{ duration: 2, delay: i * 0.12, repeat: Infinity }} />)}
      </motion.div>
      <motion.div className="absolute right-10 top-10 h-14 w-14 rounded-full border border-emerald-200/20 bg-emerald-200/5" animate={reduceMotion ? {} : { scale: [1, 1.08, 1] }} transition={{ duration: 2.4, repeat: Infinity }} />
    </VisualShell>
  );
}