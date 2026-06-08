import { motion } from "framer-motion";
import { VisualShell } from "./visualPrimitives";

// An enigmatic magical door that opens, releasing a bright flash of light
// that grows from a thin sliver into a blinding glow, then loops.
export default function TenantHomeVisual({ reduceMotion = false }) {
  const flashTimes = [0, 0.35, 0.55, 0.8, 1];
  return (
    <VisualShell>
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Doorway frame */}
        <div className="relative h-52 w-36 rounded-t-[3rem] border-2 border-[#D6A85A]/40 bg-[#0a0d18] shadow-[0_0_50px_rgba(214,168,90,0.25),inset_0_0_30px_rgba(0,0,0,0.6)]">
          {/* glowing rune accents on the frame */}
          {[0.18, 0.5, 0.82].map((y, i) => (
            <motion.span
              key={i}
              className="absolute -left-1 h-2 w-2 rounded-full bg-[#F1D59A]"
              style={{ top: `${y * 100}%` }}
              animate={reduceMotion ? {} : { opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 2.4, delay: i * 0.4, repeat: Infinity }}
            />
          ))}
          {[0.18, 0.5, 0.82].map((y, i) => (
            <motion.span
              key={`r-${i}`}
              className="absolute -right-1 h-2 w-2 rounded-full bg-[#F1D59A]"
              style={{ top: `${y * 100}%` }}
              animate={reduceMotion ? {} : { opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 2.4, delay: i * 0.4 + 0.2, repeat: Infinity }}
            />
          ))}

          {/* The bright light gap inside the door — grows from a sliver */}
          <div className="absolute inset-2 overflow-hidden rounded-t-[2.6rem]">
            <motion.div
              className="absolute left-1/2 top-0 h-full -translate-x-1/2 bg-gradient-to-b from-white via-[#FFF4D6] to-[#F1D59A]"
              style={{ filter: "blur(2px)" }}
              animate={reduceMotion ? { width: "60%" } : { width: ["4%", "4%", "30%", "100%", "4%"] }}
              transition={{ duration: 5, times: flashTimes, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* radiant flash */}
            <motion.div
              className="absolute inset-0 bg-white"
              animate={reduceMotion ? { opacity: 0 } : { opacity: [0, 0, 0.15, 0.95, 0] }}
              transition={{ duration: 5, times: flashTimes, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          {/* Left & right door panels swinging open */}
          <motion.div
            className="absolute inset-y-2 left-2 w-[46%] origin-left rounded-tl-[2.4rem] border-r border-[#D6A85A]/30 bg-gradient-to-br from-[#161a28] to-[#0a0d18]"
            animate={reduceMotion ? { rotateY: -60 } : { rotateY: [0, 0, -35, -78, 0] }}
            transition={{ duration: 5, times: flashTimes, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformPerspective: 600 }}
          />
          <motion.div
            className="absolute inset-y-2 right-2 w-[46%] origin-right rounded-tr-[2.4rem] border-l border-[#D6A85A]/30 bg-gradient-to-bl from-[#161a28] to-[#0a0d18]"
            animate={reduceMotion ? { rotateY: 60 } : { rotateY: [0, 0, 35, 78, 0] }}
            transition={{ duration: 5, times: flashTimes, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformPerspective: 600 }}
          />
        </div>

        {/* Outer glow bloom around the whole door at peak flash */}
        <motion.div
          className="absolute h-56 w-56 rounded-full bg-[#FFF4D6]/30 blur-3xl"
          animate={reduceMotion ? { opacity: 0.2 } : { opacity: [0, 0, 0.2, 0.8, 0] }}
          transition={{ duration: 5, times: flashTimes, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </VisualShell>
  );
}