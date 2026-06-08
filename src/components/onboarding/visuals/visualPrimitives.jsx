import { motion } from "framer-motion";

export const EASE = [0.16, 1, 0.3, 1];

export function VisualShell({ children }) {
  const reduceMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <div className="relative mx-auto mb-7 flex aspect-[16/10] w-full max-w-[460px] items-center justify-center overflow-hidden rounded-[1.75rem] border border-slate-200/20 bg-[#050914] shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_28px_90px_rgba(0,0,0,0.38)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(226,232,240,0.16),transparent_52%),radial-gradient(circle_at_80%_70%,rgba(96,165,250,0.11),transparent_44%),radial-gradient(circle_at_18%_80%,rgba(16,185,129,0.08),transparent_38%)]" />
      <div className="absolute inset-0 opacity-25 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[length:22px_22px]" />
      <motion.div className="absolute -inset-24 opacity-35" animate={reduceMotion ? {} : { rotate: [0, 8, 0], scale: [1, 1.06, 1] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} style={{ background: "conic-gradient(from 160deg, transparent, rgba(226,232,240,0.10), transparent, rgba(96,165,250,0.08), transparent)" }} />
      <div className="absolute left-6 top-6 h-16 w-16 rounded-full border border-slate-100/10 bg-slate-100/5 blur-[1px]" />
      <div className="absolute bottom-7 right-8 h-20 w-20 rounded-full border border-sky-100/10 bg-sky-200/5 blur-sm" />
      <div className="absolute inset-x-8 top-8 h-px bg-gradient-to-r from-transparent via-slate-200/40 to-transparent" />
      <div className="absolute inset-x-10 bottom-8 h-px bg-gradient-to-r from-transparent via-sky-200/25 to-transparent" />
      <div className="relative z-10 h-full w-full p-5">{children}</div>
    </div>
  );
}

export function Chip({ children, className = "" }) {
  return <span className={`rounded-full border border-slate-200/20 bg-slate-200/10 px-2.5 py-1 text-[9px] font-medium text-slate-200/80 backdrop-blur ${className}`}>{children}</span>;
}

export function appear(index = 0, reduceMotion = false) {
  return reduceMotion ? {} : {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: index * 0.16, duration: 0.65, ease: EASE },
  };
}

export function Line({ className = "", reduceMotion = false }) {
  return <motion.div className={`h-px bg-gradient-to-r from-transparent via-slate-200/40 to-transparent ${className}`} {...(reduceMotion ? {} : { initial: { scaleX: 0 }, animate: { scaleX: 1 }, transition: { duration: 0.8, ease: EASE } })} />;
}