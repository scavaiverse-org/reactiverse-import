import { motion } from "framer-motion";

// Global atmosphere layer: rice-paper grain, fabric weave, opera glow + vignette.
// Sits ABOVE the existing video/gradients, below the slide content.
export default function CinematicTextureLayer({ reduceMotion = false }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(214,168,90,0.18),transparent_36%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_82%,rgba(122,30,37,0.20),transparent_42%)]" />
      <div className="absolute inset-0 opacity-[0.08] mix-blend-soft-light texture-rice-paper" />
      <div className="absolute inset-0 opacity-[0.10] mix-blend-overlay texture-fabric-weave" />
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(214,168,90,0.10),transparent_50%)]"
        animate={reduceMotion ? {} : { opacity: [0.18, 0.36, 0.18], scale: [1, 1.04, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_48%,rgba(0,0,0,0.72)_100%)]" />
    </div>
  );
}