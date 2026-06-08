import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, MapPin, Layers, Zap, Shield, BarChart3, CheckCircle2, ArrowRight, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import PublicPageHero from "@/components/public/PublicPageHero";

const deploymentSites = [
  {
    name: "Jambi Cultural Museum",
    location: "Sumatra, Indonesia",
    type: "Heritage Site",
    status: "Pipeline",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    image: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400&h=280&fit=crop",
    desc: "Rich Melayu heritage with traditional ceremonies and royal history dating back to the 7th century Srivijayan empire.",
  },
  {
    name: "Cameron Highlands Heritage",
    location: "Pahang, Malaysia",
    type: "Cultural Experience",
    status: "Pipeline",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=280&fit=crop",
    desc: "Colonial tea plantation history, indigenous Orang Asli traditions, and highland biodiversity cultural storytelling.",
  },
  {
    name: "Musang King Cultural Trail",
    location: "Kelantan, Malaysia",
    type: "Agri-Culture Tourism",
    status: "Concept",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
    image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=280&fit=crop",
    desc: "Durian heritage tourism with cultural storytelling around agricultural identity and community livelihoods.",
  },
  {
    name: "Kutai Kartanegara Museum",
    location: "East Kalimantan, Indonesia",
    type: "Royal Heritage",
    status: "Pipeline",
    color: "text-violet-400",
    bg: "bg-violet-400/10",
    image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=280&fit=crop",
    desc: "Indonesia's oldest Hindu kingdom with rich Dayak traditions, royal ceremonies, and forest cultural heritage.",
  },
  {
    name: "LKY Leadership Museum",
    location: "Singapore",
    type: "Leadership Heritage",
    status: "Concept",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&h=280&fit=crop",
    desc: "Singapore's nation-building journey, Lee Kuan Yew's leadership philosophy, and the Southeast Asian transformation story.",
  },
  {
    name: "Regional Batik Museum",
    location: "Yogyakarta, Indonesia",
    type: "Craft Heritage",
    status: "Pipeline",
    color: "text-rose-400",
    bg: "bg-rose-400/10",
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=280&fit=crop",
    desc: "UNESCO-recognized batik craft traditions with interactive dyeing demonstrations and cultural storytelling.",
  },
];

const platformFeatures = [
  { icon: Layers, title: "Modular Architecture", desc: "Swap content, language, and branding per deployment — same underlying infrastructure" },
  { icon: Globe, title: "Multilingual Ready", desc: "Full support for Bahasa, Mandarin, Tamil, and Southeast Asian regional languages" },
  { icon: Zap, title: "Rapid Deployment", desc: "New museum deployable in 4–6 weeks using the AOM core" },
  { icon: BarChart3, title: "Unified Analytics", desc: "Cross-museum performance benchmarking and visitor flow intelligence" },
  { icon: Shield, title: "IP Protection", desc: "Cultural content licensing and digital rights management built in" },
  { icon: Building2, title: "Government Ready", desc: "Compliance-ready infrastructure for national heritage bodies and tourism boards" },
];

const statusColors = {
  "Active": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "Pipeline": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Concept": "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

export default function WhiteLabel() {
  return (
    <div className="min-h-screen bg-background">
      <PublicPageHero
        pageKey="white_label"
        eyebrow="Museum Deployment"
        fallback={{
          title: "Launch a Digital Museum",
          subtitle: "Bring a museum online with guided visits, tickets, and reports.",
          body: "This page is for museum teams, sponsors, schools, and public agencies.",
          cta_label: "Start Deployment",
          cta_path: "/consulting",
          secondary_cta_label: "View Platform",
          secondary_cta_path: "/platform",
        }}
      />

      {/* Platform Features */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="text-center mb-12">
          <p className="text-xs tracking-[0.3em] text-primary font-medium mb-2">PLATFORM CAPABILITIES</p>
          <h2 className="text-2xl font-display font-bold text-foreground">Built for Scale. Designed for Region.</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {platformFeatures.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.07 }}
              >
                <Card className="h-full bg-card/50 border-border/50 hover:border-primary/20 transition-all">
                  <CardContent className="p-5">
                    <Icon className="w-6 h-6 text-primary/70 mb-3" />
                    <h3 className="text-sm font-semibold text-foreground mb-1">{feat.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{feat.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Deployment Pipeline */}
      <section className="py-16 px-4 border-t border-border/30 bg-card/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs tracking-[0.3em] text-primary font-medium mb-2">REGIONAL PIPELINE</p>
            <h2 className="text-2xl font-display font-bold text-foreground">Identified Deployment Sites</h2>
            <p className="text-muted-foreground text-sm mt-2 max-w-lg mx-auto">
              Cultural and heritage sites across Southeast Asia identified for AOM deployment.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {deploymentSites.map((site, idx) => (
              <motion.div
                key={site.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
              >
                <Card className="overflow-hidden bg-card/50 border-border/50 hover:border-primary/20 transition-all group">
                  <div className="relative aspect-video overflow-hidden">
                    <img src={site.image} alt={site.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                      <div>
                        <p className="text-xs font-bold text-foreground">{site.name}</p>
                        <p className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                          <MapPin className="w-2.5 h-2.5" /> {site.location}
                        </p>
                      </div>
                      <Badge className={`text-[10px] border ${statusColors[site.status] || ""}`}>{site.status}</Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <p className={`text-[10px] uppercase tracking-widest font-medium mb-2 ${site.color}`}>{site.type}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{site.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Deployment Process */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <p className="text-xs tracking-[0.3em] text-primary font-medium mb-2">DEPLOYMENT PROCESS</p>
          <h2 className="text-2xl font-display font-bold text-foreground">From Concept to Launch in 6 Weeks</h2>
        </div>
        <div className="space-y-4">
          {[
            { week: "Week 1–2", title: "Discovery & Architecture", items: ["Site assessment", "Content audit", "Technical scoping", "Stakeholder alignment"] },
            { week: "Week 3–4", title: "Platform Configuration", items: ["Branding & white-label setup", "Content migration", "AI guide training", "Ticketing & vendor setup"] },
            { week: "Week 5", title: "Integration & Testing", items: ["Payment gateway", "Analytics setup", "Mobile QA", "Stakeholder demo"] },
            { week: "Week 6", title: "Launch & Handover", items: ["Soft launch", "Staff training", "Documentation", "Ongoing support SLA"] },
          ].map((phase, i) => (
            <motion.div
              key={phase.week}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex gap-5 p-5 rounded-xl border border-border/50 bg-card/30"
            >
              <div className="flex-shrink-0 w-20">
                <p className="text-xs text-primary font-mono">{phase.week}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">{phase.title}</h4>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {phase.items.map((item) => (
                    <p key={item} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CheckCircle2 className="w-3 h-3 text-primary/50" /> {item}
                    </p>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 border-t border-border/30 text-center">
        <div className="max-w-xl mx-auto">
          <Globe className="w-10 h-10 text-primary/40 mx-auto mb-4" />
          <h2 className="text-2xl font-display font-bold text-foreground mb-3">Ready to Deploy in Your Region?</h2>
          <p className="text-sm text-muted-foreground mb-6">Contact AOM to begin a regional deployment scoping for your heritage site or cultural institution.</p>
          <Link to="/consulting">
            <Button className="bg-primary text-primary-foreground gap-2 px-8">
              Begin Regional Scoping <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}