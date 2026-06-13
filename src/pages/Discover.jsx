import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Clock, Compass, Sparkles, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import PlatformGatewayBackground from "@/components/platform/PlatformGatewayBackground";
import { PublicHeaderLogo } from "@/components/layout/PublicHeaderShell";
import { DEFAULT_MUSEUM_SLUG, museumPath } from "@/lib/domain-registry";

// Consumer "front door" for the platform. SCAVerse is multi-tenant, so visitors
// land here to discover experiences rather than being dropped straight into one
// museum's checkout. While only the Asian Operatic Museum is launching, it's the
// featured pre-booking; the "coming soon" tiles keep the platform framing and
// simply become real museums as more tenants go live.
const COMING_SOON = [
  "Maritime Heritage Museum",
  "Modern Art Pavilion",
  "Science & Discovery Hall",
];

export default function Discover() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Discover — SCAVerse";
  }, []);

  const enterFeatured = () => navigate(museumPath(DEFAULT_MUSEUM_SLUG, "home"));

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground" data-public-portal="scaverse">
      <PlatformGatewayBackground overlayOpacity={0.6} />

      <section className="relative z-10 mx-auto flex w-full max-w-6xl flex-col px-4 py-8 sm:px-6 lg:px-10">
        <header className="flex items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-3 rounded-full border border-primary/25 bg-background/30 px-4 py-2 shadow-lg shadow-primary/10 backdrop-blur-xl"
          >
            <PublicHeaderLogo as="static" title="SCAVerse" subtitle="Discover" />
          </button>
        </header>

        <div className="mx-auto mt-10 w-full max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-background/20 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-primary shadow-lg shadow-black/20 backdrop-blur-md">
            <Compass className="h-3.5 w-3.5" /> Explore the platform
          </div>
          <h1 className="font-heading text-4xl font-semibold leading-tight tracking-tight drop-shadow-2xl sm:text-6xl">
            Discover immersive museums &amp; experiences
          </h1>
          <p className="mt-6 font-body text-base font-light leading-relaxed text-muted-foreground sm:text-lg">
            SCAVerse is a platform of digital museums and cultural experiences. New worlds are opening — here&apos;s what&apos;s live first.
          </p>
        </div>

        {/* Featured: AOM pre-booking */}
        <section className="mt-12 overflow-hidden rounded-[2rem] border border-primary/25 bg-gradient-to-br from-primary/10 via-card/50 to-cyan-400/[0.06] p-8 backdrop-blur sm:p-12">
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
                <Button size="lg" className="bg-primary text-primary-foreground" onClick={enterFeatured}>
                  <Ticket className="h-4 w-4" /> Reserve Pre-Sale Tickets <ArrowRight className="h-4 w-4" />
                </Button>
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
        </section>

        {/* Coming soon */}
        <div className="mt-12 mb-16">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">More experiences coming soon</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {COMING_SOON.map((name) => (
              <div key={name} className="rounded-2xl border border-border/40 bg-card/30 p-6 opacity-60">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10"><Compass className="h-4 w-4 text-primary/70" /></div>
                <p className="mt-3 font-heading text-base font-semibold text-foreground/80">{name}</p>
                <p className="mt-1 inline-flex items-center gap-1 text-[11px] uppercase tracking-widest text-muted-foreground"><Clock className="h-3 w-3" /> Coming soon</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
