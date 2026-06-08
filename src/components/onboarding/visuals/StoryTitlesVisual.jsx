import { motion } from "framer-motion";
import { Scroll, Crown, Feather, Music2, Gem, Flower2 } from "lucide-react";
import { VisualShell } from "./visualPrimitives";

// Story titles fade in from scattered positions across the card, each paired with a floating artifact.
const stories = [
  { title: "The Silk Road Echoes", Icon: Scroll, x: "16%", y: "22%" },
  { title: "Voices of the Dynasty", Icon: Crown, x: "64%", y: "16%" },
  { title: "The Last Calligrapher", Icon: Feather, x: "22%", y: "68%" },
  { title: "The Forgotten Opera", Icon: Music2, x: "68%", y: "72%" },
  { title: "Whispers in Jade", Icon: Gem, x: "44%", y: "44%" },
  { title: "Lanterns Over Water", Icon: Flower2, x: "12%", y: "46%" },
];

export default function StoryTitlesVisual({ reduceMotion = false }) {
  return (
    <VisualShell>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(5,9,20,0.8)_88%)]" />

        {stories.map(({ title, Icon, x, y }, i) => (
          <motion.div
            key={title}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 whitespace-nowrap"
            style={{ left: x, top: y }}
            animate={reduceMotion ? { opacity: 0.6 } : { opacity: [0, 0.95, 0.95, 0], scale: [0.85, 1, 1, 0.92] }}
            transition={{ duration: 2.6, delay: i * 0.55, repeat: Infinity, repeatDelay: stories.length * 0.55 - 2.6, ease: "easeInOut" }}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[#D6A85A]/40 bg-[#D6A85A]/10 text-[#F1D59A]">
              <Icon className="h-2.5 w-2.5" />
            </span>
            <span className="font-display text-[11px] font-semibold tracking-wide text-[#F1D59A]" style={{ textShadow: "0 0 16px rgba(241,213,154,0.45)" }}>
              {title}
            </span>
          </motion.div>
        ))}
      </div>
    </VisualShell>
  );
}