import { motion } from "framer-motion";

// A slow gold light sweep across the slide subject. Feels like stage light on silk.
export default function OperaLightSweep({ reduceMotion = false }) {
  if (reduceMotion) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-[rgba(241,213,154,0.16)] to-transparent blur-2xl"
        animate={{ x: ["-120%", "120%"], opacity: [0, 0.24, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}