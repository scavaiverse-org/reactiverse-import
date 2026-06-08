import { Link, useParams } from "react-router-dom";
import { CheckCircle2, Home, Sparkles, Ticket, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DEFAULT_MUSEUM_SLUG, museumPath } from "@/lib/domain-registry";

export default function Completion() {
  const { tenantSlug } = useParams();
  const activeTenantSlug = tenantSlug || DEFAULT_MUSEUM_SLUG;
  const museumHomePath = museumPath(activeTenantSlug, "home");
  const ticketsPath = museumPath(activeTenantSlug, "tickets");
  const walkthroughPath = museumPath(activeTenantSlug, "begin-tour");

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.22),transparent_42%),linear-gradient(135deg,hsl(var(--background)),hsl(var(--card)))]" />
      <div className="absolute inset-x-0 top-0 h-px bg-primary/50" />

      <section className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-20 text-center">
        <Badge className="mb-6 border-primary/30 bg-primary/10 px-4 py-2 text-primary">
          <Sparkles className="h-4 w-4" /> Experience complete
        </Badge>

        <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full border border-primary/30 bg-primary/10 shadow-2xl shadow-primary/20">
          <Trophy className="h-12 w-12 text-primary" />
        </div>

        <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
          You completed the museum journey
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
          Thank you for exploring the collection. Your visit has been completed, and you can now return home, plan a visit, or continue discovering more museum experiences.
        </p>

        <div className="mt-10 grid w-full max-w-3xl gap-4 sm:grid-cols-3">
          {[
            { label: "Journey completed", value: "100%", icon: CheckCircle2 },
            { label: "Memory unlocked", value: "Finale", icon: Sparkles },
            { label: "Status", value: "Visitor alumni", icon: Trophy },
          ].map((item) => (
            <Card key={item.label} className="border-border/70 bg-card/75 backdrop-blur-xl">
              <CardContent className="p-5 text-center">
                <item.icon className="mx-auto mb-3 h-5 w-5 text-primary" />
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{item.label}</p>
                <p className="mt-2 font-display text-2xl font-semibold text-foreground">{item.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link to={museumHomePath}><Home className="h-4 w-4" /> Return Home</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-primary/30 bg-background/40">
            <Link to={ticketsPath}><Ticket className="h-4 w-4" /> Plan a Visit</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-primary/30 bg-background/40">
            <Link to={walkthroughPath}><Sparkles className="h-4 w-4" /> Revisit Experience</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}