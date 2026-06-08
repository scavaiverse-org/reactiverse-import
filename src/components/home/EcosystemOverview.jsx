import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, Ticket, Store, Brain, Globe, GraduationCap } from 'lucide-react';

const pillars = [
  {
    icon: Compass,
    title: 'Virtual Museum',
    description: 'Cinematic browser-first walkthroughs with station-based storytelling',
    link: '/walkthrough',
    gradient: 'from-amber-500/10 to-transparent',
  },
  {
    icon: Ticket,
    title: 'Smart Ticketing',
    description: 'Conversion-optimized purchasing with dynamic promotional pathways',
    link: '/tickets',
    gradient: 'from-cyan-500/10 to-transparent',
  },
  {
    icon: Store,
    title: 'Vendor Marketplace',
    description: 'Scalable vendor ecosystem with premium slot infrastructure',
    link: '/vendors',
    gradient: 'from-emerald-500/10 to-transparent',
  },
  {
    icon: Brain,
    title: 'AI Intelligence',
    description: 'AI-guided onboarding, recommendations, and cultural discovery',
    link: '/ai-consulting',
    gradient: 'from-violet-500/10 to-transparent',
  },
  {
    icon: GraduationCap,
    title: 'Learning Journeys',
    description: 'Gamified education, quests, and cultural certification programs',
    link: '/walkthrough',
    gradient: 'from-rose-500/10 to-transparent',
  },
  {
    icon: Globe,
    title: 'Regional Expansion',
    description: 'White-label infrastructure for heritage museums across Southeast Asia',
    link: '/white-label',
    gradient: 'from-blue-500/10 to-transparent',
  },
];

export default function EcosystemOverview() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-primary font-mono text-xs uppercase tracking-[0.2em] mb-3"
          >
            Ecosystem Architecture
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-3xl sm:text-4xl font-semibold text-foreground"
          >
            Six Pillars of Cultural Technology
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {pillars.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  to={pillar.link}
                  className={`block p-6 rounded-2xl border border-border/50 bg-gradient-to-br ${pillar.gradient} hover:border-primary/30 transition-all duration-300 group h-full`}
                >
                  <Icon className="w-8 h-8 text-primary mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                    {pillar.title}
                  </h3>
                  <p className="text-muted-foreground font-body text-sm leading-relaxed">
                    {pillar.description}
                  </p>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}