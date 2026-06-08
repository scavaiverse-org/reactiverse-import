import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Workflow, Bot, MessageSquare, BarChart3, Shield, Lightbulb, Layers, ArrowRight, CheckCircle2 } from "lucide-react";

const capabilities = [
  { icon: Brain, title: "AI Transformation Advisory", desc: "Strategic guidance for organizations adopting AI across operations, customer engagement, and cultural deployment." },
  { icon: Workflow, title: "Workflow Automation", desc: "End-to-end automation design for repetitive processes, content pipelines, and operational workflows." },
  { icon: Bot, title: "AI Assistant Design", desc: "Custom AI assistants for onboarding, customer support, cultural guidance, and sales conversion." },
  { icon: MessageSquare, title: "Prompt Architecture", desc: "Production-grade prompt engineering, hallucination control, and response quality frameworks." },
  { icon: BarChart3, title: "AI Analytics Interpretation", desc: "Intelligent dashboards that translate raw data into actionable business insights." },
  { icon: Shield, title: "AI Governance", desc: "Hallucination control, content safety, compliance frameworks, and responsible AI deployment." },
  { icon: Lightbulb, title: "Multi-Agent Workflows", desc: "Orchestrated AI agent systems for complex tasks spanning content, commerce, and customer journeys." },
  { icon: Layers, title: "White-Label AI Platforms", desc: "Reusable AI-powered platforms for cultural institutions, retail, education, and government." },
];

const useCases = [
  "AI-powered visitor onboarding for museums and cultural institutions",
  "Intelligent sales agents for ticket conversion optimization",
  "Cultural AI guides supporting multilingual heritage experiences",
  "Automated content generation for exhibits and publications",
  "AI-assisted vendor onboarding and marketplace curation",
  "Predictive analytics for visitor engagement and revenue forecasting",
  "AI customer support with controlled knowledge bases",
  "Learning journey personalization for educational institutions",
];

export default function Consulting() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="py-24 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
          <p className="text-xs tracking-[0.3em] text-primary font-medium mb-3">AOM · CONSULTING</p>
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-foreground">
            Enterprise <span className="text-primary">AI</span> for
            <br />Cultural Innovation
          </h1>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto text-sm">
            From strategy to deployment — we build AI systems that transform cultural institutions, retail ecosystems, and government initiatives across Southeast Asia.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/guide">
              <Button size="lg" className="bg-primary text-primary-foreground gap-2">
                <Bot className="w-4 h-4" /> Try Our AI Guide
              </Button>
            </Link>
            <Link to="/expansion">
              <Button size="lg" variant="outline" className="border-border/50 gap-2">
                Regional Deployment <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Capabilities Grid */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="text-center mb-12">
          <p className="text-xs tracking-[0.3em] text-primary font-medium mb-2">CAPABILITIES</p>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground">What We Deliver</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {capabilities.map((cap, idx) => {
            const Icon = cap.icon;
            return (
              <motion.div
                key={cap.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="h-full bg-card/50 border-border/50 hover:border-primary/20 transition-all">
                  <CardContent className="p-5">
                    <Icon className="w-7 h-7 text-primary/70 mb-3" />
                    <h3 className="text-sm font-semibold text-foreground mb-1">{cap.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{cap.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 px-4 border-t border-border/30 bg-secondary/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs tracking-[0.3em] text-primary font-medium mb-2">USE CASES</p>
            <h2 className="text-2xl font-display font-bold text-foreground">Proven Applications</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {useCases.map((uc, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -10 : 10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-card/50 border border-border/30"
              >
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-foreground/80">{uc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}