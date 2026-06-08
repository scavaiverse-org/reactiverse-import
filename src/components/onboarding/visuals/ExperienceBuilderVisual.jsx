import { motion } from "framer-motion";
import { UploadCloud, Copy } from "lucide-react";
import { VisualShell } from "./visualPrimitives";

// Mirror architecture: what a franchise tenant uploads on the LEFT instantly mirrors to the RIGHT.
export default function ExperienceBuilderVisual({ reduceMotion = false }) {
  return (
    <VisualShell>
      <div className="absolute left-1/2 top-5 -translate-x-1/2 rounded-full border border-[#D6A85A]/40 bg-[#D6A85A]/10 px-3 py-1 text-[8px] font-semibold uppercase tracking-[0.2em] text-[#F1D59A]">
        For Franchise Tenants
      </div>

      <div className="absolute inset-x-6 top-16 bottom-6 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        {/* LEFT: source upload */}
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-sky-200/25 bg-sky-200/[0.06] p-3">
          <div className="text-[8px] uppercase tracking-[0.18em] text-slate-300/70">Tenant</div>
          <motion.div
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-200/40 bg-sky-200/10 text-sky-100"
            animate={reduceMotion ? {} : { y: [0, -4, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <UploadCloud className="h-4 w-4" />
          </motion.div>
          <div className="mt-1 w-full space-y-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="h-1.5 rounded bg-sky-200/30"
                animate={reduceMotion ? {} : { opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.6, delay: i * 0.3, repeat: Infinity }}
              />
            ))}
          </div>
        </div>

        {/* CENTER: mirror channel */}
        <div className="relative flex h-full w-12 items-center justify-center">
          <Copy className="h-3.5 w-3.5 text-slate-300/50" />
          {!reduceMotion && [0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="absolute top-1/2 h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.7)]"
              initial={{ left: 0, opacity: 0 }}
              animate={{ left: "100%", opacity: [0, 1, 1, 0] }}
              transition={{ duration: 1.4, delay: 0.5 + i * 0.5, repeat: Infinity, repeatDelay: 0.6 }}
            />
          ))}
        </div>

        {/* RIGHT: mirrored destination */}
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-emerald-200/25 bg-emerald-200/[0.06] p-3">
          <div className="text-[8px] uppercase tracking-[0.18em] text-slate-300/70">Mirror</div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-200/40 bg-emerald-200/10 text-emerald-100">
            <Copy className="h-4 w-4" />
          </div>
          <div className="mt-1 w-full space-y-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="h-1.5 rounded bg-emerald-200/30"
                animate={reduceMotion ? {} : { opacity: [0, 0, 1, 1] }}
                transition={{ duration: 1.6, delay: 0.6 + i * 0.3, repeat: Infinity }}
              />
            ))}
          </div>
        </div>
      </div>
    </VisualShell>
  );
}