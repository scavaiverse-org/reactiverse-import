import { motion } from "framer-motion";
import { Ticket, Store, ShoppingBag, Play } from "lucide-react";
import { VisualShell } from "./visualPrimitives";

// A story spark at the top splits into three action destinations. Pulses travel down the branches.
const branches = [
  { label: "Tickets", Icon: Ticket, x: "20%", color: "rgba(96,165,250,0.6)" },
  { label: "Vendors", Icon: Store, x: "50%", color: "rgba(52,211,153,0.6)" },
  { label: "Commerce", Icon: ShoppingBag, x: "80%", color: "rgba(244,114,182,0.6)" },
];

export default function CommerceFlowVisual({ reduceMotion = false }) {
  return (
    <VisualShell>
      <div className="absolute inset-0">
        {/* source: the experience spark */}
        <motion.div
          className="absolute left-1/2 top-6 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-2xl border border-slate-100/30 bg-slate-100/10 text-white shadow-[0_0_45px_rgba(226,232,240,0.3)]"
          animate={reduceMotion ? {} : { scale: [1, 1.08, 1] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Play className="h-4 w-4 fill-current" />
        </motion.div>
        <div className="absolute left-1/2 top-[58px] -translate-x-1/2 text-[8px] uppercase tracking-[0.2em] text-slate-300/70">Experience</div>

        {/* branch lines (SVG) */}
        <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
          {branches.map((b, i) => (
            <motion.line
              key={b.label}
              x1="50%" y1="22%" x2={b.x} y2="74%"
              stroke="rgba(148,163,184,0.35)" strokeWidth="1.5" strokeDasharray="4 4"
              initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.18, duration: 0.7 }}
            />
          ))}
        </svg>

        {/* traveling pulses */}
        {!reduceMotion && branches.map((b, i) => (
          <motion.span
            key={`p-${b.label}`}
            className="absolute h-2 w-2 rounded-full"
            style={{ background: b.color, boxShadow: `0 0 14px ${b.color}` }}
            initial={{ left: "50%", top: "22%", opacity: 0 }}
            animate={{ left: b.x, top: "74%", opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.6, delay: 0.8 + i * 0.4, repeat: Infinity, repeatDelay: 1 }}
          />
        ))}

        {/* destination cards */}
        {branches.map(({ label, Icon, x, color }, i) => (
          <motion.div
            key={`d-${label}`}
            className="absolute flex -translate-x-1/2 flex-col items-center gap-1.5"
            style={{ left: x, top: "74%" }}
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + i * 0.18, duration: 0.6 }}
          >
            <motion.div
              className="flex h-11 w-11 items-center justify-center rounded-2xl border bg-slate-200/10 text-white"
              style={{ borderColor: color }}
              animate={reduceMotion ? {} : { boxShadow: [`0 0 8px ${color}`, `0 0 26px ${color}`, `0 0 8px ${color}`] }}
              transition={{ duration: 2.4, delay: i * 0.4, repeat: Infinity }}
            >
              <Icon className="h-4 w-4" />
            </motion.div>
            <span className="text-[9px] font-medium text-slate-100">{label}</span>
          </motion.div>
        ))}
      </div>
    </VisualShell>
  );
}