import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Ticket, MapPin, Headphones, Users, BookOpen, Sparkles, ArrowRight, ArrowLeft, Music, Shirt, Landmark, Monitor, ShoppingBag } from "lucide-react";

const stations = [
  {
    id: 1,
    title: "The Grand Entrance",
    category: "Heritage Gateway",
    icon: Landmark,
    desc: "Step into the world of Asian opera through an immersive cultural gateway. Dragon pillars, welcome scrolls, and a heritage wall set the tone for your journey.",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop",
    tags: ["Architecture", "Heritage", "Welcome"],
    color: "text-amber-400",
    bg: "from-amber-500/10",
  },
  {
    id: 2,
    title: "The Costume Alcove",
    category: "Textile Arts",
    icon: Shirt,
    desc: "Silk, embroidery, and centuries of artistic tradition converge. Explore ceremonial robes, warrior armor, and royal headdresses from across Asia.",
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&h=400&fit=crop",
    tags: ["Costume", "Silk", "Royal Attire"],
    color: "text-rose-400",
    bg: "from-rose-500/10",
  },
  {
    id: 3,
    title: "The Music Chamber",
    category: "Sonic Heritage",
    icon: Music,
    desc: "Where sound becomes soul. Discover the erhu, pipa, gong, and other traditional instruments that define the acoustic landscape of Asian opera.",
    image: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=600&h=400&fit=crop",
    tags: ["Instruments", "Music", "Acoustics"],
    color: "text-blue-400",
    bg: "from-blue-500/10",
  },
  {
    id: 4,
    title: "The Stage of Dreams",
    category: "Performance Arts",
    icon: Sparkles,
    desc: "Step onto the reconstructed stage. Every prop, every color, every gesture tells a story. The stage is not merely a platform — it is a universe.",
    image: "https://images.unsplash.com/photo-1503095396549-807759245b35?w=600&h=400&fit=crop",
    tags: ["Stage", "Performance", "Stagecraft"],
    color: "text-violet-400",
    bg: "from-violet-500/10",
  },
  {
    id: 5,
    title: "The Living Archive",
    category: "Digital Heritage",
    icon: Monitor,
    desc: "Heritage meets technology. Interactive digital displays trace the evolution of Asian opera across centuries — from ancient courts to contemporary stages.",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop",
    tags: ["Digital", "Archive", "Interactive"],
    color: "text-cyan-400",
    bg: "from-cyan-500/10",
  },
  {
    id: 6,
    title: "The Cultural Marketplace",
    category: "Commerce & Experience",
    icon: ShoppingBag,
    desc: "Where heritage meets commerce. Artisan crafts, curated experiences, and cultural merchandise await at the AOM's experiential marketplace.",
    image: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=600&h=400&fit=crop",
    tags: ["Market", "Crafts", "Souvenirs"],
    color: "text-emerald-400",
    bg: "from-emerald-500/10",
  },
];

const highlights = [
  { icon: Headphones, label: "Audio Narration", desc: "AI-guided audio at every station" },
  { icon: Users, label: "Group Bookings", desc: "School and corporate group packages" },
  { icon: BookOpen, label: "Learning Journeys", desc: "Gamified cultural education paths" },
  { icon: Ticket, label: "Ticket Required", desc: "Virtual and physical access tiers" },
];

export default function Museum() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative py-24 px-4 overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1600&h=900&fit=crop" alt="Museum" className="w-full h-full object-cover opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/70 to-background" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="mb-6 flex justify-center">
            <Link to="/virtual-experience" className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-card/50 px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
              <ArrowLeft className="w-3.5 h-3.5" /> Available Museums
            </Link>
          </div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-xs tracking-[0.3em] text-primary font-medium mb-3">ASIAN OPERATIC MUSEUM · SINGAPORE</p>
            <h1 className="text-4xl sm:text-5xl font-display font-bold text-foreground mb-4">
              A Living Museum of<br /><span className="text-primary">Cultural Heritage</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm leading-relaxed mb-8">
              Six immersive stations spanning costume arts, musical traditions, stage design, and cultural storytelling — accessible virtually or in person.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/walkthrough">
                <Button size="lg" className="bg-primary text-primary-foreground gap-2">
                  <Play className="w-4 h-4" /> Begin Virtual Tour
                </Button>
              </Link>
              <Link to="/tickets">
                <Button size="lg" variant="outline" className="border-border/50 gap-2">
                  <Ticket className="w-4 h-4" /> Purchase Tickets
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-8 px-4 border-y border-border/30 bg-secondary/20">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {highlights.map((h) => {
            const Icon = h.icon;
            return (
              <div key={h.label} className="text-center">
                <Icon className="w-6 h-6 text-primary/60 mx-auto mb-2" />
                <p className="text-xs font-semibold text-foreground">{h.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{h.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Stations */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <p className="text-xs tracking-[0.3em] text-primary font-medium mb-2">6 STATIONS</p>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground">The Museum Experience</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {stations.map((station, idx) => {
            const Icon = station.icon;
            return (
              <motion.div
                key={station.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
              >
                <Link to="/walkthrough">
                  <Card className="group overflow-hidden bg-card/50 border-border/50 hover:border-primary/20 transition-all cursor-pointer h-full">
                    <div className="relative aspect-video overflow-hidden">
                      <img src={station.image} alt={station.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      <div className={`absolute inset-0 bg-gradient-to-br ${station.bg} to-transparent opacity-60`} />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-background/60 backdrop-blur-sm text-[10px] border-border/30">
                          <MapPin className="w-2.5 h-2.5 mr-1" /> Station {station.id}
                        </Badge>
                      </div>
                      <div className="absolute bottom-3 right-3">
                        <div className={`w-8 h-8 rounded-lg bg-background/60 backdrop-blur-sm flex items-center justify-center ${station.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <p className={`text-[10px] uppercase tracking-widest font-medium mb-1 ${station.color}`}>{station.category}</p>
                      <h3 className="text-sm font-semibold text-foreground mb-2">{station.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{station.desc}</p>
                      <div className="flex flex-wrap gap-1 mt-3">
                        {station.tags.map((tag) => (
                          <span key={tag} className="text-[9px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{tag}</span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 border-t border-border/30 text-center">
        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl font-display font-bold text-foreground mb-3">Experience the Full Museum</h2>
          <p className="text-sm text-muted-foreground mb-6">Purchase a ticket to unlock all 6 stations with AI-guided narration and interactive features.</p>
          <div className="flex justify-center gap-3">
            <Link to="/tickets"><Button className="bg-primary text-primary-foreground gap-2"><Ticket className="w-4 h-4" /> Buy Tickets</Button></Link>
            <Link to="/guide"><Button variant="outline" className="border-border/50 gap-2">Ask AI Guide <ArrowRight className="w-4 h-4" /></Button></Link>
          </div>
        </div>
      </section>
    </div>
  );
}