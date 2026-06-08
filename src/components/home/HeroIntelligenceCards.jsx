import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Ticket, Store, ShoppingBag, Gamepad2, BookOpen, BarChart3, Globe } from "lucide-react";

const engines = [
  {
    id: "ai-onboarding",
    icon: Brain,
    title: "AI Onboarding Engine",
    capability: "Intelligent visitor activation & guided discovery",
    output: "Personalized museum journeys powered by contextual AI",
    activation: "Onboarding conversion: 94% completion rate",
    gradient: "from-amber-500/20 to-orange-500/20",
    accentColor: "text-amber-400",
  },
  {
    id: "ticketing",
    icon: Ticket,
    title: "Virtual Ticketing Engine",
    capability: "Frictionless conversion & dynamic ticket states",
    output: "Multi-tier ticketing with promotional pathways",
    activation: "Revenue optimization through smart checkout flows",
    gradient: "from-emerald-500/20 to-teal-500/20",
    accentColor: "text-emerald-400",
  },
  {
    id: "vendor",
    icon: Store,
    title: "Vendor Ecosystem Engine",
    capability: "Scalable vendor onboarding & marketplace infrastructure",
    output: "End-to-end vendor registration, slots, and dashboards",
    activation: "Active vendor pipeline with premium placement logic",
    gradient: "from-blue-500/20 to-indigo-500/20",
    accentColor: "text-blue-400",
  },
  {
    id: "xretail",
    icon: ShoppingBag,
    title: "Experiential Retail Engine",
    capability: "Commerce-enabled cultural experiences",
    output: "Digital storefronts with ticket-linked purchase journeys",
    activation: "Experiential commerce bridging virtual and physical",
    gradient: "from-purple-500/20 to-pink-500/20",
    accentColor: "text-purple-400",
  },
  {
    id: "learning",
    icon: Gamepad2,
    title: "Learning & Gamification Engine",
    capability: "Quest-based cultural education & engagement loops",
    output: "Interactive learning journeys with achievement systems",
    activation: "Gamified discovery driving repeat engagement",
    gradient: "from-rose-500/20 to-red-500/20",
    accentColor: "text-rose-400",
  },
  {
    id: "storytelling",
    icon: BookOpen,
    title: "Cultural Storytelling Engine",
    capability: "Narrative-driven station-based exhibit experiences",
    output: "Immersive cultural narratives with emotional pacing",
    activation: "Heritage preservation through digital storytelling",
    gradient: "from-cyan-500/20 to-sky-500/20",
    accentColor: "text-cyan-400",
  },
  {
    id: "analytics",
    icon: BarChart3,
    title: "Analytics Intelligence Engine",
    capability: "Real-time operational monitoring & conversion tracking",
    output: "Visitor flow analytics, revenue dashboards, engagement metrics",
    activation: "Data-driven decision making for cultural operations",
    gradient: "from-yellow-500/20 to-amber-500/20",
    accentColor: "text-yellow-400",
  },
  {
    id: "whitelabel",
    icon: Globe,
    title: "Regional White-Label Engine",
    capability: "Reusable cultural infrastructure for regional deployment",
    output: "Scalable platform for heritage sites across Southeast Asia",
    activation: "From Singapore to the region — one ecosystem, many museums",
    gradient: "from-teal-500/20 to-emerald-500/20",
    accentColor: "text-teal-400",
  },
];

export default function HeroIntelligenceCards() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % engines.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const engine = engines[activeIndex];
  const Icon = engine.icon;

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Progress indicators */}
      <div className="flex gap-1.5 mb-6 justify-center">
        {engines.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setActiveIndex(idx)}
            className="relative h-1 rounded-full overflow-hidden bg-secondary w-8 cursor-pointer"
          >
            {idx === activeIndex && (
              <motion.div
                className="absolute inset-0 bg-primary rounded-full"
                initial={{ scaleX: 0, transformOrigin: "left" }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 5, ease: "linear" }}
                key={activeIndex}
              />
            )}
            {idx < activeIndex && (
              <div className="absolute inset-0 bg-primary/50 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={engine.id}
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.97 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className={`relative rounded-2xl border border-border/50 bg-gradient-to-br ${engine.gradient} backdrop-blur-sm p-6 sm:p-8`}
        >
          <div className="absolute inset-0 rounded-2xl bg-card/60 backdrop-blur-sm" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2.5 rounded-xl bg-background/50 border border-border/50 ${engine.accentColor}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">{engine.title}</h3>
                <p className="text-xs text-muted-foreground tracking-wider uppercase">SCAVA Engine</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Capability</p>
                <p className="text-sm text-foreground/90">{engine.capability}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Output</p>
                <p className="text-sm text-foreground/90">{engine.output}</p>
              </div>
              <div className={`pt-3 border-t border-border/30`}>
                <p className={`text-xs font-medium ${engine.accentColor}`}>{engine.activation}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}