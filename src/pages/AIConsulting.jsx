import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Brain, Zap, MessageSquare, Bot, BarChart3, Shield, Workflow,
  Users, Lightbulb, Cpu, Globe, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const capabilities = [
  { icon: Brain, title: 'AI Transformation Advisory', desc: 'Strategic AI roadmaps for cultural institutions and enterprises' },
  { icon: Workflow, title: 'Workflow Automation', desc: 'Intelligent process automation for museum operations' },
  { icon: MessageSquare, title: 'Prompt Architecture', desc: 'Custom prompt engineering for cultural AI applications' },
  { icon: Bot, title: 'AI Assistant Design', desc: 'Conversational AI guides for visitor engagement' },
  { icon: Users, title: 'AI Onboarding Systems', desc: 'Intelligent visitor activation and personalization' },
  { icon: Zap, title: 'AI Sales Agents', desc: 'Conversion-optimized ticket and merchandise AI' },
  { icon: Lightbulb, title: 'AI Learning Guides', desc: 'Educational AI for curriculum-aligned cultural content' },
  { icon: Globe, title: 'AI Cultural Guides', desc: 'Multilingual heritage interpretation systems' },
  { icon: Cpu, title: 'AI Content Generation', desc: 'Automated exhibit descriptions and promotional content' },
  { icon: BarChart3, title: 'AI Analytics', desc: 'Intelligent insights from visitor behavior data' },
  { icon: Shield, title: 'AI Governance', desc: 'Hallucination control and content safety frameworks' },
  { icon: Workflow, title: 'Multi-Agent Workflows', desc: 'Orchestrated AI agent systems for complex operations' },
];

const useCases = [
  { title: 'Virtual Museum Deployment', desc: 'End-to-end virtual museum platform with AI-guided tours, ticketing, and vendor ecosystems.' },
  { title: 'Experiential Retail', desc: 'Commerce-enabled cultural experiences with AR previews and ticket-linked purchase journeys.' },
  { title: 'Experiential Learning', desc: 'Gamified education platforms with AI tutoring and cultural certification programs.' },
  { title: 'Heritage Digitization', desc: 'Digital twin creation and cultural asset preservation for regional heritage sites.' },
  { title: 'Corporate Partnerships', desc: 'Enterprise onboarding for corporate sponsors, CSR programs, and cultural patrons.' },
  { title: 'Regional White-Label', desc: 'Reusable platform deployment across Southeast Asian cultural institutions.' },
];

export default function AIConsulting() {
  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-20">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-primary font-mono text-xs uppercase tracking-[0.2em] mb-3">
            AOM Consulting
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="font-display text-3xl sm:text-5xl font-bold text-foreground mb-6 max-w-3xl mx-auto leading-tight">
            Enterprise-Grade AI for Cultural Technology
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-muted-foreground font-body text-lg max-w-2xl mx-auto leading-relaxed mb-8">
            We deliver AI transformation, virtual museum infrastructure, and experiential commerce platforms
            for heritage institutions across Southeast Asia.
          </motion.p>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex items-center justify-center gap-4">
            <Link to="/onboarding">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-body font-semibold gap-2 px-8">
                Start a Project <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Capabilities Grid */}
        <section className="mb-24">
          <h2 className="font-display text-2xl font-semibold text-foreground text-center mb-12">AI Capabilities</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {capabilities.map((cap, i) => {
              const Icon = cap.icon;
              return (
                <motion.div
                  key={cap.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="p-5 rounded-xl border border-border bg-card hover:border-primary/30 transition-all"
                >
                  <Icon className="w-5 h-5 text-primary mb-3" />
                  <h3 className="font-body font-semibold text-foreground text-sm mb-1">{cap.title}</h3>
                  <p className="text-muted-foreground text-xs font-body leading-relaxed">{cap.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Use Cases */}
        <section className="mb-24">
          <h2 className="font-display text-2xl font-semibold text-foreground text-center mb-12">Deployment Use Cases</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {useCases.map((uc, i) => (
              <motion.div
                key={uc.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-transparent"
              >
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">{uc.title}</h3>
                <p className="text-muted-foreground font-body text-sm leading-relaxed">{uc.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-16 rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-transparent">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-foreground mb-4">
            Ready to Transform Your Cultural Institution?
          </h2>
          <p className="text-muted-foreground font-body max-w-lg mx-auto mb-8">
            From AI strategy to full virtual museum deployment — we partner with heritage organizations to build the future of cultural technology.
          </p>
          <Link to="/onboarding">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-body font-semibold gap-2 px-8">
              Begin Consultation <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </section>
      </div>
    </div>
  );
}