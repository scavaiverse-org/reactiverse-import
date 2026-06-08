import { motion } from "framer-motion";
import { VisualShell, Chip, appear } from "./visualPrimitives";

const layers = ["Public", "Admin", "Database", "Render Engine", "Analytics"];

export default function DeterministicGridVisual({ reduceMotion = false }) {
  return (
    <VisualShell>
      <div className="flex h-full flex-col justify-center gap-3 px-8">
        {layers.map((layer, i) => <motion.div key={layer} className="relative flex items-center justify-between overflow-hidden rounded-xl border border-slate-200/20 bg-slate-200/10 px-4 py-2 shadow-inner" {...appear(i, reduceMotion)}>
          <Chip>{layer}</Chip>
          <span className="mx-3 h-px flex-1 bg-slate-200/20" />
          <span className="rounded-md border border-slate-200/20 px-2 py-1 text-[8px] text-slate-300/60">Tenant Frame</span>
          <motion.span className="absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-transparent via-white/10 to-transparent" animate={reduceMotion ? {} : { x: [-40, 280] }} transition={{ duration: 2.8, delay: i * 0.15, repeat: Infinity, repeatDelay: 1.5 }} />
        </motion.div>)}
      </div>
    </VisualShell>
  );
}