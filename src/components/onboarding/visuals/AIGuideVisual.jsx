import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { VisualShell } from "./visualPrimitives";

// ARIA — a glowing orb assistant that greets the visitor.
export default function AIGuideVisual({ reduceMotion = false }) {
  const rings = [0, 1, 2];
  return (
    <VisualShell>
      <div className="flex h-full flex-col items-center justify-center gap-7">
        {/* ARIA orb */}
        <div className="relative flex items-center justify-center">
          {rings.map((r) => (
            <motion.span
              key={r}
              className="absolute rounded-full border border-sky-200/30"
              style={{ width: 80, height: 80 }}
              animate={reduceMotion ? {} : { scale: [1, 2.1], opacity: [0.5, 0] }}
              transition={{ duration: 2.6, delay: r * 0.85, repeat: Infinity, ease: "easeOut" }}
            />
          ))}
          <motion.div
            className="relative flex h-20 w-20 items-center justify-center rounded-full border border-sky-100/40 bg-gradient-to-br from-sky-300/25 to-indigo-400/15 text-white shadow-[0_0_55px_rgba(147,197,253,0.4)]"
            animate={reduceMotion ? {} : { boxShadow: ["0 0 35px rgba(147,197,253,0.25)", "0 0 70px rgba(147,197,253,0.5)", "0 0 35px rgba(147,197,253,0.25)"] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-sky-100" />
            <span className="font-display text-base font-semibold tracking-[0.12em]">Aria</span>
          </motion.div>
        </div>

        {/* speech bubble */}
        <motion.div
          className="relative max-w-[78%] rounded-2xl rounded-tl-sm border border-slate-200/20 bg-slate-200/10 px-4 py-3 text-center shadow-[0_18px_44px_rgba(0,0,0,0.3)] backdrop-blur"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="absolute -top-1.5 left-6 h-3 w-3 rotate-45 border-l border-t border-slate-200/20 bg-slate-200/10" />
          <p className="text-[12px] font-medium leading-snug text-slate-100">
            Hi, I&apos;m ARIA. Let me help you.
          </p>
        </motion.div>
      </div>
    </VisualShell>
  );
}