import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Chip, VisualFrame } from "./ScoversVisualKit";

const path = ["Discover", "Enter", "Explore", "Ask", "Book", "Complete"];
const STEP = 0.9; // seconds between each arrow lighting up
const CYCLE = path.length * STEP + 1.2;

export default function VisitorPathVisual({ reduceMotion = false }) {
  return (
    <VisualFrame reduceMotion={reduceMotion}>
      <div className="flex h-full flex-col justify-center gap-5">
        <div className="grid grid-cols-3 gap-2 opacity-30">
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} className="h-8 rounded-lg border border-white/10 bg-white/5 shadow-inner" />
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-2">
          {path.map((item, i) => {
            const isLast = i === path.length - 1;
            return (
              <div key={item} className="flex items-center gap-1">
                <Chip>
                  {isLast ? (
                    <motion.span
                      className="text-[#F1D59A]"
                      animate={reduceMotion ? {} : {
                        textShadow: ["0 0 0px rgba(241,213,154,0)", "0 0 14px rgba(241,213,154,0.9)", "0 0 0px rgba(241,213,154,0)"],
                        opacity: [0.6, 1, 0.6],
                      }}
                      transition={{ duration: CYCLE, times: [(i * STEP) / CYCLE, (i * STEP + 0.4) / CYCLE, 1], repeat: Infinity }}
                    >
                      {item}
                    </motion.span>
                  ) : (
                    item
                  )}
                </Chip>
                {!isLast && (
                  <motion.span
                    className="text-[#D6A85A]"
                    animate={reduceMotion ? { opacity: 0.4 } : { opacity: [0.15, 1, 0.15], x: [0, 2, 0] }}
                    transition={{ duration: CYCLE, times: [(i * STEP) / CYCLE, (i * STEP + 0.3) / CYCLE, 1], repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </motion.span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </VisualFrame>
  );
}