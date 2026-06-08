import { motion } from "framer-motion";
import { VisualShell, appear } from "./visualPrimitives";

const routes = ["Home", "Guide", "Tickets", "Media", "Publish"];
const colors = ["bg-emerald-300", "bg-emerald-300", "bg-amber-300", "bg-red-300", "bg-emerald-300"];

export default function QASentinelVisual({ reduceMotion = false }) {
  return (
    <VisualShell>
      <div className="absolute inset-x-8 top-14 grid grid-cols-5 gap-2">
        {routes.map((route, i) => <motion.div key={route} className="rounded-xl border border-slate-200/20 bg-slate-200/10 p-3 text-center shadow-inner" {...appear(i, reduceMotion)}>
          <span className={`mx-auto mb-2 block h-2 w-2 rounded-full ${colors[i]} shadow-[0_0_14px_rgba(255,255,255,0.25)]`} />
          <span className="text-[8px] text-slate-200">{route}</span>
        </motion.div>)}
      </div>
      <motion.div className="absolute left-8 top-[44%] h-px w-[calc(100%-4rem)] bg-sky-100/40" {...(reduceMotion ? {} : { initial: { scaleX: 0 }, animate: { scaleX: 1 }, transition: { duration: 1.2 } })} />
      <motion.div className="absolute left-8 top-[44%] h-2 w-2 -translate-y-1/2 rounded-full bg-sky-100 shadow-[0_0_22px_rgba(186,230,253,0.7)]" animate={reduceMotion ? {} : { x: [0, 320, 0] }} transition={{ duration: 3.5, repeat: Infinity }} />
      <motion.div className="absolute bottom-8 right-8 w-36 rounded-xl border border-slate-200/20 bg-black/30 p-3 shadow-[0_18px_44px_rgba(0,0,0,0.25)]" {...appear(5, reduceMotion)}><div className="text-[8px] uppercase tracking-[0.22em] text-slate-300/60">Readiness</div><div className="mt-2 h-3 rounded-full bg-gradient-to-r from-emerald-300/60 via-amber-300/50 to-red-300/50" /></motion.div>
    </VisualShell>
  );
}