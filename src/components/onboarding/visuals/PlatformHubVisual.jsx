import { motion } from "framer-motion";
import { BookOpen, Landmark, Tag, Gem, Triangle } from "lucide-react";
import { VisualShell, Chip } from "./visualPrimitives";

// Each institution orbits the CORE. Its themed object floats BESIDE it (offset to the side), bobbing gently.
const orbiters = [
  { label: "Museum", Icon: Landmark, angle: -90, radius: 88 },
  { label: "School", Icon: BookOpen, angle: -18, radius: 88 },
  { label: "Brand", Icon: Tag, angle: 54, radius: 88 },
  { label: "Private Collection", Icon: Gem, angle: 126, radius: 88 },
  { label: "Cultural Site", Icon: Triangle, angle: 198, radius: 88 },
];

export default function PlatformHubVisual({ reduceMotion = false }) {
  return (
    <VisualShell>
      <div className="absolute inset-10 rounded-[2rem] border border-slate-200/10 bg-slate-200/[0.03]" />

      {/* orbit ring */}
      <div className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-200/15" />

      {/* CORE — center of gravity */}
      <div className="absolute left-1/2 top-1/2 z-20 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-100/25 bg-slate-100/10 text-center shadow-[0_0_60px_rgba(191,219,254,0.22)]">
        <div className="pt-5 text-[9px] font-bold tracking-[0.18em] text-white">CORE</div>
      </div>

      {/* orbiting institutions */}
      <motion.div
        className="absolute left-1/2 top-1/2 h-0 w-0"
        animate={reduceMotion ? {} : { rotate: 360 }}
        transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
      >
        {orbiters.map(({ label, Icon, angle, radius }) => {
          const rad = (angle * Math.PI) / 180;
          const x = Math.cos(rad) * radius;
          const y = Math.sin(rad) * radius;
          return (
            <div key={label} className="absolute" style={{ transform: `translate(${x}px, ${y}px)` }}>
              {/* counter-rotate so labels & icons stay upright */}
              <motion.div
                className="-translate-x-1/2 -translate-y-1/2"
                animate={reduceMotion ? {} : { rotate: -360 }}
                transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
              >
                <div className="relative flex items-center gap-1.5">
                  <Chip className="relative z-10">{label}</Chip>
                  {/* themed object floating BESIDE the institution, gently bobbing */}
                  <motion.div
                    className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-[#D6A85A]/40 bg-[#D6A85A]/10 text-[#F1D59A]"
                    animate={reduceMotion ? {} : { y: [0, -4, 0] }}
                    transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Icon className="h-3 w-3" />
                  </motion.div>
                </div>
              </motion.div>
            </div>
          );
        })}
      </motion.div>
    </VisualShell>
  );
}