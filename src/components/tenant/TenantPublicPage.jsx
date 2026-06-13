import { useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { CalendarDays, Crown, Info, Play, ShieldCheck, Sparkles, Star, Ticket, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { museumPath } from "@/lib/domain-registry";
import { fetchPublishedManifest } from "@/lib/manifest-public";
import TenantNavbar from "./TenantNavbar";
import MuseumOpenGate from "./MuseumOpenGate";
import TenantOverlay from "./TenantOverlay";
import TenantVideoHero from "./TenantVideoHero";
import TenantCTA from "./TenantCTA";
import TenantTransitionLayer from "./TenantTransitionLayer";

const pageKeyByType = { home: "museum_home", tickets: "tickets", about: "museum_home", tour: "walkthrough" };
const toneByVariant = {
  1: "from-primary/10 via-background to-card",
  2: "from-primary/10 via-background to-card",
  3: "from-primary/12 via-background to-card",
  4: "from-primary/10 via-background to-card",
  5: "from-primary/10 via-background to-card",
};

const ticketPlans = [
  { title: "General Entry", price: "Standard", icon: Ticket, body: "Timed public access with digital visitor support and exhibit discovery." },
  { title: "VIP Guided Tour", price: "Premium", icon: Crown, body: "Priority access, guided rooms, exclusive content, and concierge support." },
  { title: "Family Pass", price: "Bundle", icon: Users, body: "Family-friendly access with shared activities and accessible pacing." },
  { title: "Event Bundle", price: "Limited", icon: CalendarDays, body: "Timed event access, cultural programming, and post-visit resources." },
];

function useTenantPageData(tenant, pageType) {
  const pageKey = pageKeyByType[pageType] || "museum_home";

  const { data: pageConfigs = [] } = useQuery({
    queryKey: ["tenant-public-page-config", tenant?.id, pageKey],
    queryFn: () => tenant ? base44.entities.MuseumPageConfig.filter({ tenantId: tenant.id, pageKey, publishState: "published" }, "-lastPublishedAt", 1) : Promise.resolve([]),
    enabled: !!tenant?.id,
    initialData: [],
  });

  const { data: media = [] } = useQuery({
    queryKey: ["tenant-public-media", tenant?.id],
    queryFn: () => tenant ? base44.entities.TenantMedia.filter({ tenantId: tenant.id, publishState: "published" }, "-updatedAt", 20) : Promise.resolve([]),
    enabled: !!tenant?.id,
    initialData: [],
  });

  const { data: exhibits = [] } = useQuery({
    queryKey: ["tenant-public-exhibits", tenant?.id],
    queryFn: () => tenant ? base44.entities.Exhibit.filter({ tenant_id: tenant.id, status: "published" }, "-updated_date", 6) : Promise.resolve([]),
    enabled: !!tenant?.id,
    initialData: [],
  });

  const { data: music = [] } = useQuery({
    queryKey: ["tenant-ambient-music", tenant?.id, pageType],
    queryFn: () => tenant ? base44.entities.MusicAsset.filter({ tenant_id: tenant.id, targetKey: `tenant_${tenant.id}_${pageType}`, status: "active" }, "-updatedAt", 1) : Promise.resolve([]),
    enabled: !!tenant?.id,
    initialData: [],
  });

  return { config: pageConfigs[0], media, exhibits, musicAsset: music.find((item) => item.enabled !== false) || null };
}

function resolveHero(tenant, config, pageType, variant, manifest) {
  const section = (config?.sections || []).find((item) => item.sectionKey === "hero") || {};
  const label = pageType === "tickets" ? "Ticketing Gateway" : pageType === "about" ? "Museum Story" : pageType === "tour" ? "Begin Tour" : "Tenant Platform";
  if ((pageType === "home" || pageType === "tour") && manifest?.card) {
    const title = section.title || manifest.card.title || tenant?.name || "Museum Platform";
    const body = section.description || section.subtitle || manifest.card.description || tenant?.description || "";
    return { eyebrow: section.eyebrow || label, title, body };
  }
  const title = section.title || (pageType === "tickets" ? `Choose your ${tenant?.name || "museum"} access` : pageType === "about" ? `The story behind ${tenant?.name || "this museum"}` : pageType === "tour" ? `Begin your ${tenant?.name || "museum"} journey` : tenant?.theme_config?.hero_title || tenant?.name || "Museum Platform");
  const body = section.description || section.subtitle || tenant?.description || "Enter a tenant-owned public platform with immersive rooms, tickets, stories, tours, marketplace access, and AI-guided discovery.";
  return { eyebrow: section.eyebrow || label, title, body };
}

function ParticleField() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-45">
      {[...Array(18)].map((_, index) => (
        <span key={index} className="absolute h-1 w-1 rounded-full bg-primary/45 shadow-[0_0_18px_hsl(210_18%_82%_/_0.18)]" style={{ left: `${(index * 37) % 100}%`, top: `${(index * 19) % 100}%` }} />
      ))}
    </div>
  );
}

function HomeContent({ slug, exhibits }) {
  const cards = [
    { title: "Reserve Pre-Sale Tickets", body: "Lock in early-bird pre-sale pricing and guarantee your access when the museum opens.", to: museumPath(slug, "tickets"), icon: Ticket },
    { title: "About Us", body: "Explore the museum story, mission, and cultural background.", to: museumPath(slug, "about"), icon: Info },
    { title: "Begin Tour", body: "Start from the museum's public tour entry page.", to: museumPath(slug, "begin-tour"), icon: Play },
  ];

  return (
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mb-8"><p className="font-display text-[10px] font-medium uppercase tracking-[0.5em] text-primary/70">Public pathways</p><h2 className="mt-3 font-heading text-4xl font-bold text-foreground">Choose how to enter.</h2></div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{cards.map((card, index) => <TenantCTA key={card.title} {...card} delay={index * 0.05} />)}</div>
      </section>
  );
}

function TicketsContent({ slug }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="mb-8"><p className="font-display text-[10px] font-medium uppercase tracking-[0.5em] text-primary/70">Ticket journey</p><h2 className="mt-3 font-heading text-4xl font-bold text-foreground">Reserve, compare, plan, upgrade, confirm.</h2></div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {ticketPlans.map((plan, index) => {
          const Icon = plan.icon;
          return <div key={plan.title} className="rounded-[2rem] border border-border/40 bg-card/50 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl"><div className="mb-5 flex items-center justify-between"><Icon className="h-6 w-6 text-primary" /><Badge className="bg-primary/10 text-primary">{plan.price}</Badge></div><h3 className="font-heading text-2xl font-bold text-foreground">{plan.title}</h3><p className="mt-4 text-sm leading-7 text-muted-foreground">{plan.body}</p><div className="mt-6 flex items-center gap-2 text-xs text-emerald-300"><ShieldCheck className="h-4 w-4" /> Pending payment · QR-ready</div></div>;
        })}
      </div>
      <div className="mt-8 flex flex-wrap gap-3"><Button asChild><Link to={museumPath(slug, "tickets-2")}>Compare Ticket Types</Link></Button><Button asChild variant="outline"><Link to={museumPath(slug, "tickets-3")}>Plan Visit</Link></Button><Button asChild variant="outline"><Link to={museumPath(slug, "guide")}>Ask About Tickets</Link></Button></div>
    </section>
  );
}

function AboutContent({ tenant }) {
  const museumName = tenant?.name || "this museum";
  const chapters = [
    { title: "Origins", body: `${museumName} was founded to give its cultural heritage a living, accessible home — bringing collections, performances, and stories to visitors everywhere.` },
    { title: "Cultural preservation", body: "Our mission is to safeguard traditions, artefacts, and performance art for future generations through careful curation and immersive digital access." },
    { title: "Curator vision", body: "Each room and exhibit is shaped by curators who pair authentic cultural context with engaging, modern storytelling." },
    { title: "Future digital access", body: "We continue to expand virtual tours, guided experiences, and educational programmes so the museum remains open and inclusive — anytime, anywhere." },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[2rem] border border-border/40 bg-card/50 p-8 backdrop-blur-xl"><Sparkles className="mb-5 h-7 w-7 text-primary" /><h2 className="font-heading text-4xl font-bold text-foreground">A living cultural platform.</h2><p className="mt-5 text-sm leading-7 text-muted-foreground">{tenant?.description || `${museumName} preserves cultural knowledge through immersive storytelling, guided digital experiences, and public access pathways.`}</p></div>
        <div className="space-y-4">{chapters.map((chapter, index) => <div key={chapter.title} className="rounded-3xl border border-border/40 bg-card/50 p-6 backdrop-blur-xl"><p className="text-xs uppercase tracking-[0.26em] text-primary">Chapter {index + 1}</p><h3 className="mt-2 font-heading text-2xl font-bold text-foreground">{chapter.title}</h3><p className="mt-3 text-sm leading-7 text-muted-foreground">{chapter.body}</p></div>)}</div>
      </div>
    </section>
  );
}

function BeginTourContent({ slug, manifest }) {
  const walkthroughs = manifest?.walkthroughs || [];

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="mb-8">
        <p className="font-display text-[10px] font-medium uppercase tracking-[0.5em] text-primary/70">Begin tour</p>
        <h2 className="mt-3 font-heading text-4xl font-bold text-foreground">Your museum tour starts here.</h2>
      </div>
      {walkthroughs.length === 0 ? (
        <div className="rounded-[2rem] border border-primary/20 bg-primary/10 p-8 text-center backdrop-blur-xl">
          <h3 className="font-heading text-3xl font-bold text-foreground">This experience has not been published yet.</h3>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-3">
          {walkthroughs.map((walkthrough, index) => (
            <Link key={walkthrough.walkthrough_key} to={museumPath(slug, `tour/${index + 1}`)} className="rounded-[2rem] border border-border/40 bg-card/50 p-6 backdrop-blur-xl transition-colors hover:border-primary/40">
              <Play className="mb-5 h-6 w-6 text-primary" />
              <h3 className="font-heading text-2xl font-bold text-foreground">{walkthrough.title}</h3>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">{walkthrough.description}</p>
              <p className="mt-4 text-xs uppercase tracking-widest text-primary">{walkthrough.rooms.length} room{walkthrough.rooms.length === 1 ? "" : "s"}</p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function FeaturedExhibits({ slug, exhibits }) {
  const fallback = ["Signature Gallery", "Story Archive", "Immersive Room"];
  const items = exhibits.length ? exhibits.slice(0, 3) : fallback.map((title) => ({ title, description: "Tenant-specific exhibit content appears here when published." }));
  return <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6"><div className="mb-8 flex flex-wrap items-center justify-between gap-4"><div><p className="font-display text-[10px] font-medium uppercase tracking-[0.5em] text-primary/70">Featured exhibits</p><h2 className="mt-3 font-heading text-4xl font-bold text-foreground">Museum highlights.</h2></div><Button asChild variant="outline" className="border-white/15 bg-white/10"><Link to={museumPath(slug, "museum")}>View Exhibits</Link></Button></div><div className="grid gap-5 md:grid-cols-3">{items.map((item, index) => <div key={item.id || item.title} className="min-h-56 rounded-[2rem] border border-white/10 bg-gradient-to-br from-card/70 to-card/30 p-6 backdrop-blur-xl"><Star className="mb-5 h-5 w-5 text-primary" /><h3 className="font-heading text-2xl font-bold text-foreground">{item.title || item.name}</h3><p className="mt-4 text-sm leading-7 text-muted-foreground">{item.description || item.body || "A tenant-owned exhibit preview."}</p></div>)}</div></section>;
}

// Gate first: unpublished museums show "not open yet" to outside visitors
// (master admins and the museum's own team pass through). Tickets + about are
// presale pages — they stay reachable before publish so visitors can buy
// ahead of launch and read what they're buying; home/tour stay gated.
export default function TenantPublicPage(props) {
  const presale = props.pageType === "about" || props.pageType === "tickets";
  return (
    <MuseumOpenGate allow={presale}>
      <TenantPublicPageInner {...props} />
    </MuseumOpenGate>
  );
}

function TenantPublicPageInner({ pageType = "home", variant = 1 }) {
  const navigate = useNavigate();
  const { tenant, isLoading } = useActiveTenant();
  const slug = tenant?.slug;
  const { config, media, exhibits, musicAsset } = useTenantPageData(tenant, pageType);
  const effectiveTenant = useMemo(() => ({
    ...tenant,
    name: config?.structuredData?.museumName || tenant?.name,
    logo_url: config?.structuredData?.logoUrl || tenant?.logo_url,
    theme_config: { ...(tenant?.theme_config || {}), tenant_badge: config?.structuredData?.tenantBadge || tenant?.theme_config?.tenant_badge },
  }), [tenant, config]);
  const { data: manifest } = useQuery({
    queryKey: ["published-manifest", tenant?.id, tenant?.published_manifest_id],
    queryFn: () => fetchPublishedManifest(tenant),
    enabled: !!tenant?.id && (pageType === "home" || pageType === "tour"),
    initialData: null,
  });
  const hero = useMemo(() => resolveHero(effectiveTenant, config, pageType, variant, manifest), [effectiveTenant, config, pageType, variant, manifest]);
  const cinematicCard = (config?.cards || []).find((item) => item.cardKey === "cinematic") || {};
  const cta = (key, fallback) => (config?.ctaSlots || []).find((item) => item.ctaKey === key)?.label || fallback;
  const ctaRoute = (key, fallback) => (config?.ctaSlots || []).find((item) => item.ctaKey === key)?.route || fallback;
  const heroMedia = config?.heroMedia?.fileUrl || media.find((item) => item.mediaType === "video")?.storageUrl || media.find((item) => item.mediaType === "video")?.sourceUrl || media[0]?.storageUrl || media[0]?.sourceUrl;

  useEffect(() => { if (effectiveTenant?.name) document.title = `${effectiveTenant.name} · Public Platform`; }, [effectiveTenant?.name]);
  useEffect(() => {
    if (!musicAsset?.fileUrl) return;
    const audio = new Audio(musicAsset.fileUrl);
    audio.loop = musicAsset.loop !== false;
    audio.volume = Number(musicAsset.volume ?? 0.25);
    audio.play().catch(() => {});
    return () => { audio.pause(); audio.currentTime = 0; };
  }, [musicAsset?.fileUrl]);

  if (isLoading) return <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">Loading tenant platform…</div>;
  if (!tenant || !slug) return <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">Museum not found.</div>;

  return (
    <main className={`relative min-h-screen overflow-hidden bg-background text-foreground bg-gradient-to-br ${toneByVariant[variant] || toneByVariant[1]}`}>
      <ParticleField />
      <TenantTransitionLayer />
      <TenantNavbar ctaSlots={config?.ctaSlots || []} tenantOverride={effectiveTenant} />
      <TenantOverlay tenant={effectiveTenant} pageType={pageType} />
      <TenantVideoHero
        tenant={effectiveTenant}
        title={hero.title}
        eyebrow={hero.eyebrow}
        body={hero.body}
        mediaUrl={heroMedia}
        cardMediaUrl={cinematicCard.mediaUrl}
        cardLabel={cinematicCard.label || "Cinematic entry"}
        cardTitle={cinematicCard.title || "Owned tenant experience"}
        cardDescription={cinematicCard.description || ""}
        primaryLabel={pageType === "tickets" ? "View Ticket Tiers" : cta("primary", "Begin Tour")}
        secondaryLabel={pageType === "about" ? "View Tickets" : cta("secondary", "About Us")}
        onPrimary={() => navigate(pageType === "tickets" ? museumPath(slug, "tickets") : museumPath(slug, ctaRoute("primary", "begin-tour")))}
        onSecondary={() => navigate(pageType === "about" ? museumPath(slug, "tickets") : museumPath(slug, ctaRoute("secondary", "about")))}
        onPlay={() => navigate(museumPath(slug, "begin-tour"))}
        showActions={pageType !== "home" && pageType !== "tour"}
      />
      {pageType === "home" && <HomeContent slug={slug} exhibits={exhibits} />}
      {pageType === "tickets" && <TicketsContent slug={slug} />}
      {pageType === "about" && <AboutContent tenant={tenant} />}
      {pageType === "tour" && <BeginTourContent slug={slug} manifest={manifest} />}
    </main>
  );
}