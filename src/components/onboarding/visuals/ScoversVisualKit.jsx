import { motion } from "framer-motion";

export const EASE = [0.16, 1, 0.3, 1];

export function VisualFrame({ children, reduceMotion = false }) {
  return (
    <div className="relative mx-auto flex aspect-[16/10] w-full max-w-md items-center justify-center overflow-hidden rounded-[1.7rem] border border-white/10 bg-[#050914]/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_24px_90px_rgba(0,0,0,0.55)] backdrop-blur-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(226,232,240,0.16),transparent_52%),radial-gradient(circle_at_80%_80%,rgba(96,165,250,0.10),transparent_40%),radial-gradient(circle_at_12%_72%,rgba(16,185,129,0.08),transparent_35%)]" />
      <div className="absolute inset-0 opacity-25 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[length:22px_22px]" />
      {!reduceMotion && <motion.div className="absolute -inset-20 opacity-45" animate={{ backgroundPosition: ["0% 0%", "100% 100%"], rotate: [0, 4, 0] }} transition={{ duration: 16, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }} style={{ backgroundImage: "linear-gradient(120deg, transparent 0%, rgba(226,232,240,0.08) 44%, transparent 66%)", backgroundSize: "240% 240%" }} />}
      <div className="absolute left-6 top-6 h-16 w-16 rounded-full border border-slate-100/10 bg-slate-100/5 blur-[1px]" />
      <div className="absolute bottom-7 right-8 h-20 w-20 rounded-full border border-sky-100/10 bg-sky-200/5 blur-sm" />
      <div className="relative z-10 h-full w-full p-5">{children}</div>
    </div>
  );
}

export function Chip({ children, active = true }) {
  return <span className={`rounded-lg border px-2.5 py-1 text-[10px] ${active ? "border-slate-200/30 bg-white/10 text-slate-100" : "border-white/10 text-slate-500"}`}>{children}</span>;
}

export function stagger(i, reduceMotion = false) {
  return reduceMotion ? {} : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.65, delay: i * 0.13, ease: EASE } };
}