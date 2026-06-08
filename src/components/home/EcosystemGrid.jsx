import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Landmark, Ticket, Store, ShoppingBag, Brain, BarChart3, Globe, MessageSquare } from "lucide-react";

const sections = [
  { icon: Landmark, title: "Virtual Museum", desc: "Station-based cultural storytelling with guided walkthrough", path: "/museum", delay: 0 },
  { icon: Ticket, title: "Ticketing", desc: "Multi-tier ticket purchasing with smart conversion flows", path: "/tickets", delay: 0.05 },
  { icon: Store, title: "Vendor Ecosystem", desc: "Registration, dashboards, and marketplace infrastructure", path: "/vendors", delay: 0.1 },
  { icon: ShoppingBag, title: "XRetail Commerce", desc: "Experiential digital storefronts and product journeys", path: "/commerce", delay: 0.15 },
  { icon: Brain, title: "AI Consulting", desc: "Enterprise AI transformation and workflow automation", path: "/consulting", delay: 0.2 },
  { icon: MessageSquare, title: "AI Cultural Guide", desc: "Intelligent visitor guidance and contextual assistance", path: "/guide", delay: 0.25 },
  { icon: BarChart3, title: "Analytics", desc: "Conversion tracking, engagement metrics, and revenue dashboards", path: "/admin", delay: 0.3 },
  { icon: Globe, title: "Regional Expansion", desc: "White-label deployment for heritage sites across Southeast Asia", path: "/expansion", delay: 0.35 },
];

export default function EcosystemGrid() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs tracking-[0.3em] text-primary font-medium mb-3">ECOSYSTEM MODULES</p>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground">
            Complete Cultural Infrastructure
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto text-sm">
            An integrated platform spanning virtual museum experiences, commerce, vendor management, and AI-powered engagement.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sections.map((item) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: item.delay, duration: 0.5 }}
              >
                <Link
                  to={item.path}
                  className="group block p-6 rounded-xl border border-border/50 bg-card/50 hover:bg-card hover:border-primary/20 transition-all duration-300"
                >
                  <Icon className="w-8 h-8 text-primary/70 group-hover:text-primary transition-colors mb-4" />
                  <h3 className="text-sm font-semibold text-foreground mb-1">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}