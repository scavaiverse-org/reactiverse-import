import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Landmark, Building2, Palette, Theater } from "lucide-react";
import { VisualShell } from "./visualPrimitives";

// A living, sequential directory: museums cycle one at a time into a glowing
// "active destination" frame while the others orbit as waiting tiles.
const museums = [
  { name: "Museum North", Icon: Landmark, glow: "rgba(96,165,250,0.5)", grad: "from-sky-300/25 to-sky-500/10" },
  { name: "Civic Archive", Icon: Building2, glow: "rgba(244,114,182,0.5)", grad: "from-pink-300/25 to-pink-500/10" },
  { name: "Digital Gallery", Icon: Palette, glow: "rgba(52,211,153,0.5)", grad: "from-emerald-300/25 to-emerald-500/10" },
  { name: "Opera Hall", Icon: Theater, glow: "rgba(214,168,90,0.5)", grad: "from-amber-300/25 to-amber-500/10" },
];

export default function MuseumDirectoryVisual({ reduceMotion = false }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => setActive((v) => (v + 1) % museums.length), 2200);
    return () => clearInterval(id);
  }, [reduceMotion]);

  const current = museums[active];

  return (
    <VisualShell>
      {/* waiting tiles strip at top */}
      <div className="absolute inset-x-8 top-7 flex justify-center gap-2">
        {museums.map((m, i) => (
          <motion.button
            key={m.name}
            type="button"
            className={`h-2.5 w-10 rounded-full ${i === active ? "bg-slate-100" : "bg-slate-200/25"}`}
            animate={reduceMotion ? {} : { opacity: i === active ? 1 : 0.5, scaleX: i === active ? 1.15 : 1 }}
            transition={{ duration: 0.5 }}
          />
        ))}
      </div>

      {/* glowing active destination frame */}
      <div className="absolute inset-0 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.name}
            className={`relative flex h-32 w-44 flex-col items-center justify-center overflow-hidden rounded-3xl border border-slate-100/30 bg-gradient-to-br ${current.grad}`}
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 22, scale: 0.9, rotateX: 18 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -22, scale: 0.92, rotateX: -18 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{ boxShadow: `0 0 60px ${current.glow}` }}
          >
            <motion.div
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-100/30 bg-slate-100/15 text-white"
              animate={reduceMotion ? {} : { y: [0, -5, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <current.Icon className="h-6 w-6" />
            </motion.div>
            <p className="mt-3 text-[10px] font-semibold tracking-[0.16em] text-white">{current.name.toUpperCase()}</p>
            <span className="mt-1 rounded-full border border-emerald-300/40 bg-emerald-400/10 px-2 py-0.5 text-[7px] font-semibold uppercase tracking-[0.2em] text-emerald-200">Live</span>
          </motion.div>
        </AnimatePresence>

        {/* expanding pulse ring behind the active card */}
        {!reduceMotion && (
          <motion.span
            key={`pulse-${current.name}`}
            className="absolute h-32 w-44 rounded-3xl border"
            style={{ borderColor: current.glow }}
            initial={{ opacity: 0.5, scale: 1 }}
            animate={{ opacity: 0, scale: 1.4 }}
            transition={{ duration: 1.8, ease: "easeOut" }}
          />
        )}
      </div>
    </VisualShell>
  );
}