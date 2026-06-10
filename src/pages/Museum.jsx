import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Ticket, MapPin, Headphones, Users, BookOpen, ArrowRight, ArrowLeft } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { DEFAULT_MUSEUM_SLUG, museumPath } from "@/lib/domain-registry";
import { fetchPublishedManifest } from "@/lib/manifest-public";

const highlights = [
  { icon: Headphones, label: "Audio Narration", desc: "AI-guided audio at every station" },
  { icon: Users, label: "Group Bookings", desc: "School and corporate group packages" },
  { icon: BookOpen, label: "Learning Journeys", desc: "Gamified cultural education paths" },
  { icon: Ticket, label: "Ticket Required", desc: "Virtual and physical access tiers" },
];

export default function Museum() {
  const { data: tenant } = useQuery({
    queryKey: ["museum-page-tenant", DEFAULT_MUSEUM_SLUG],
    queryFn: async () => {
      const tenants = await base44.entities.MuseumTenant.filter({ slug: DEFAULT_MUSEUM_SLUG }, "name", 1);
      return tenants?.[0] || null;
    },
  });

  const { data: manifest } = useQuery({
    queryKey: ["published-manifest", tenant?.id, tenant?.published_manifest_id],
    queryFn: () => fetchPublishedManifest(tenant),
    enabled: !!tenant?.id,
    initialData: null,
  });

  const tenantSlug = tenant?.slug || DEFAULT_MUSEUM_SLUG;

  if (!manifest) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center text-muted-foreground">
        <p className="text-lg font-medium text-foreground">This experience has not been published yet.</p>
        <Link to="/virtual-experience"><Button variant="outline">Available Museums</Button></Link>
      </div>
    );
  }

  const multiWalkthrough = manifest.walkthroughs.length > 1;
  const stationCards = multiWalkthrough
    ? manifest.walkthroughs.map((walkthrough, index) => ({
        key: walkthrough.walkthrough_key,
        title: walkthrough.title,
        desc: walkthrough.description,
        image: walkthrough.rooms?.[0]?.background_media_url || walkthrough.rooms?.[0]?.media_url,
        index: index + 1,
        to: museumPath(tenantSlug, `tour/${index + 1}`),
        badge: `Walkthrough ${index + 1}`,
      }))
    : (manifest.walkthroughs[0]?.rooms || []).map((room, index) => ({
        key: room.id || room.room_key,
        title: room.title,
        desc: room.description || room.narration_text || "",
        image: room.background_media_url || room.media_url,
        index: index + 1,
        to: museumPath(tenantSlug, "begin-tour"),
        badge: `Station ${index + 1}`,
      }));

  return (
    <div className="min-h-screen bg-background">
      <section className="relative py-24 px-4 overflow-hidden">
        <div className="absolute inset-0">
          {manifest.card.cover_media_url && (
            <img src={manifest.card.cover_media_url} alt={manifest.card.title} className="w-full h-full object-cover opacity-10" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/70 to-background" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="mb-6 flex justify-center">
            <Link to="/virtual-experience" className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-card/50 px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
              <ArrowLeft className="w-3.5 h-3.5" /> Available Museums
            </Link>
          </div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {manifest.card.region && <p className="text-xs tracking-[0.3em] text-primary font-medium mb-3">{manifest.card.region.toUpperCase()}</p>}
            <h1 className="text-4xl sm:text-5xl font-display font-bold text-foreground mb-4">{manifest.card.title}</h1>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm leading-relaxed mb-8">{manifest.card.description}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to={museumPath(tenantSlug, "begin-tour")}>
                <Button size="lg" className="bg-primary text-primary-foreground gap-2">
                  <Play className="w-4 h-4" /> Begin Virtual Tour
                </Button>
              </Link>
              <Link to={museumPath(tenantSlug, "tickets")}>
                <Button size="lg" variant="outline" className="border-border/50 gap-2">
                  <Ticket className="w-4 h-4" /> Purchase Tickets
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

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

      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <p className="text-xs tracking-[0.3em] text-primary font-medium mb-2">{stationCards.length} {multiWalkthrough ? "WALKTHROUGHS" : "STATIONS"}</p>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground">The Museum Experience</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {stationCards.map((station, idx) => (
            <motion.div
              key={station.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08 }}
            >
              <Link to={station.to}>
                <Card className="group overflow-hidden bg-card/50 border-border/50 hover:border-primary/20 transition-all cursor-pointer h-full">
                  <div className="relative aspect-video overflow-hidden">
                    {station.image && <img src={station.image} alt={station.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-background/60 backdrop-blur-sm text-[10px] border-border/30">
                        <MapPin className="w-2.5 h-2.5 mr-1" /> {station.badge}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold text-foreground mb-2">{station.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{station.desc}</p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="py-16 px-4 border-t border-border/30 text-center">
        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl font-display font-bold text-foreground mb-3">Experience the Full Museum</h2>
          <p className="text-sm text-muted-foreground mb-6">Purchase a ticket to unlock all stations with AI-guided narration and interactive features.</p>
          <div className="flex justify-center gap-3">
            <Link to={museumPath(tenantSlug, "tickets")}><Button className="bg-primary text-primary-foreground gap-2"><Ticket className="w-4 h-4" /> Buy Tickets</Button></Link>
            <Link to={museumPath(tenantSlug, "guide")}><Button variant="outline" className="border-border/50 gap-2">Ask AI Guide <ArrowRight className="w-4 h-4" /></Button></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
