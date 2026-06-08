import { motion } from "framer-motion";
import CinematicTextureLayer from "./CinematicTextureLayer";
import GoldDustField from "./GoldDustField";
import OperaLightSweep from "./OperaLightSweep";

// Reusable cinematic wrapper that stacks atmosphere + motion behind any slide content.
// Background video stays the responsibility of the parent overlay; this shell layers
// texture, dust, light sweep, and vignette consistently above it.
export default function ImmersiveSlideShell({ children, reduceMotion = false, className = "" }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="pointer-events-none absolute inset-0 z-0">
        <CinematicTextureLayer reduceMotion={reduceMotion} />
        <GoldDustField reduceMotion={reduceMotion} />
        <OperaLightSweep reduceMotion={reduceMotion} />
      </div>
      <motion.div
        className="relative z-10"
        initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 32, scale: 0.96, filter: "blur(12px)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: reduceMotion ? 0.1 : 0.9, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
}