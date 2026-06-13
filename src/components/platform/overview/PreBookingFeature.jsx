import { Link } from "react-router-dom";
import { ArrowRight, Clock, Sparkles, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEFAULT_MUSEUM_SLUG, museumPath } from "@/lib/domain-registry";

// Pre-sale spotlight shown on the consumer platform page, below the hero. While
// the Asian Operatic Museum is the only launching museum, this features its
// pre-booking and links visitors into the museum to reserve tickets.
export default function PreBookingFeature() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
      <div className="overflow-hidden rounded-[2rem] border border-primary/25 bg-gradient-to-br from-primary/10 via-card/50 to-cyan-400/[0.06] p-8 backdrop-blur sm:p-12">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
              <Sparkles className="h-3 w-3" /> Pre-Booking Now Open
            </p>
            <h2 className="mt-4 font-heading text-3xl font-bold sm:text-4xl">Asian Operatic Museum</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Our flagship launch — a cinematic journey through the living art of Asian opera. Reserve your pre-sale ticket now and be among the first inside when the doors open.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to={museumPath(DEFAULT_MUSEUM_SLUG, "home")}>
                <Button size="lg" className="bg-primary text-primary-foreground">
                  <Ticket className="h-4 w-4" /> Reserve Pre-Sale Tickets <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-background/50 p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">What you get</p>
            <ul className="mt-3 space-y-2 text-sm text-foreground/85">
              <li className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" /> Early-bird pre-sale pricing</li>
              <li className="flex items-center gap-2"><Ticket className="h-3.5 w-3.5 shrink-0 text-primary" /> Guaranteed access at launch</li>
              <li className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 shrink-0 text-primary" /> We&apos;ll email you the moment it opens</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
