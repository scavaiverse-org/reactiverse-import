import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight, Clock, Sparkles, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listPresaleMuseums } from "@/lib/manifest-public";
import { museumPath } from "@/lib/domain-registry";
import { PRESALE_PROMO_ENDS_AT, selectPresaleDisplayMuseums } from "@/lib/presale-content";

function isPresaleActive() {
  return new Date() <= new Date(PRESALE_PROMO_ENDS_AT);
}

// Dynamic pre-sale spotlight on the consumer platform page.
// – When the DB returns pre-sale museums, renders one card per museum.
// – When the DB returns [] (e.g. AOM is already published) or throws (RLS,
//   network), renders the hardcoded AOM fallback card so the section is never
//   blank during the active pre-sale window.
// – Only returns null after the promo window closes AND the DB confirms no
//   pre-sale museums.
export default function PreBookingFeature() {
  const { data: museums = [] } = useQuery({
    queryKey: ["presale-museums"],
    queryFn: () => listPresaleMuseums().catch(() => []),
    initialData: [],
    retry: 1,
  });

  if (!isPresaleActive() && !museums.length) return null;

  const displayMuseums = selectPresaleDisplayMuseums(museums);

  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
      <p className="mb-5 font-display text-[10px] font-medium uppercase tracking-[0.5em] text-primary/70">Now in pre-sale</p>
      <div className="space-y-6">
        {displayMuseums.map((tenant) => (
          <div key={tenant.id} className="overflow-hidden rounded-[2rem] border border-primary/25 bg-gradient-to-br from-primary/10 via-card/50 to-cyan-400/[0.06] p-8 backdrop-blur sm:p-12">
            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                  <Sparkles className="h-3 w-3" /> Pre-Booking Now Open
                </p>
                <h2 className="mt-4 font-heading text-3xl font-bold sm:text-4xl">{tenant.name}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {tenant.description || "Reserve your pre-sale ticket now and be among the first inside the moment the doors open."}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  {tenant.useFallbackCta ? (
                    <Link to="/presale">
                      <Button size="lg" className="bg-primary text-primary-foreground">
                        <Ticket className="h-4 w-4" /> Reserve Pre-Sale Tickets <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  ) : (
                    <Link to={museumPath(tenant.slug, "tickets")}>
                      <Button size="lg" className="bg-primary text-primary-foreground">
                        <Ticket className="h-4 w-4" /> Reserve Pre-Sale Tickets <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
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
        ))}
      </div>
    </section>
  );
}
