import { motion } from "framer-motion";

const PARTICLES = Array.from({ length: 26 }).map((_, i) => ({
  id: i,
  left: (i * 37) % 100,
  top: (i * 53) % 100,
  size: 1 + (i % 3),
  delay: (i % 7) * 0.6,
  duration: 7 + (i % 5),
}));

// Subtle drifting antique-gold dust. Calm, not noisy.
export default function GoldDustField({ reduceMotion = false }) {
  if (reduceMotion) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {PARTICLES.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full bg-[#D6A85A]"
          style={{ left: `${p.left}%`, top: `${p.top}%`, width: p.size, height: p.size, boxShadow: "0 0 8px rgba(214,168,90,0.6)" }}
          animate={{ y: [0, -22, 0], opacity: [0, 0.7, 0] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}