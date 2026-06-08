import React from "react";
import { motion } from "framer-motion";

const stats = [
  { value: "8", label: "Platform Engines" },
  { value: "12+", label: "Museum Stations" },
  { value: "50+", label: "Vendor Slots" },
  { value: "6", label: "Regional Sites" },
  { value: "AI-Native", label: "Architecture" },
  { value: "Browser-First", label: "Accessibility" },
];

export default function StatsBar() {
  return (
    <section className="py-10 px-4 border-y border-border/30 bg-secondary/30">
      <div className="max-w-6xl mx-auto flex flex-wrap justify-center gap-8 md:gap-12">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.08, duration: 0.5 }}
            className="text-center"
          >
            <p className="text-2xl sm:text-3xl font-display font-bold text-primary">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground mt-1 tracking-widest uppercase">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}