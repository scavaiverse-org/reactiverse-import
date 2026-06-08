import { motion } from "framer-motion";

// Premium next-slide CTA: gold border, soft glow, hover lift, light sweep.
export default function CinematicCTA({ children, onClick, disabled = false, type = "button" }) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { y: -2 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="group relative inline-flex h-10 w-full items-center justify-center overflow-hidden rounded-xl border border-[#D6A85A]/60 bg-gradient-to-b from-[#F1D59A] to-[#D6A85A] px-6 text-sm font-semibold text-[#2A0F14] shadow-[0_0_28px_rgba(214,168,90,0.35)] transition-colors hover:shadow-[0_0_40px_rgba(214,168,90,0.55)] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
    >
      <span className="relative z-10">{children}</span>
      {!disabled && (
        <span className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-white/40 blur-md transition-transform duration-700 ease-out group-hover:translate-x-[420%]" />
      )}
    </motion.button>
  );
}