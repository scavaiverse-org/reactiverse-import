import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import PlatformGatewayBackground from "@/components/platform/PlatformGatewayBackground";
import PlatformGatewayBadge from "@/components/platform/PlatformGatewayBadge";
import GatewaySessionTile from "@/components/platform/GatewaySessionTile";
import HomepageOnboardingOverlay from "@/components/onboarding/HomepageOnboardingOverlay";
import { PublicHeaderLogo } from "@/components/layout/PublicHeaderShell";
import useFirstVisit from "@/hooks/useFirstVisit";
import { SCAVERSE_INTRO_STORAGE_KEY } from "@/lib/scaverse-onboarding-content";

const CANONICAL_BADGES = [
  {
    key: "consumer_platform",
    userType: "Consumer Platform",
    title: "Consumer Platform",
    description: "Discover immersive museums and experiences — and pre-book the launch of the Asian Operatic Museum.",
    label: "Enter Consumer Platform",
    route: "/discover",
    visibility: true,
    sortOrder: 1,
  },
  {
    key: "become_tenant",
    userType: "Tenant / Franchise Applicant",
    title: "Become a Tenant / Franchise",
    description: "Claim your free 1-week tenant trial — build your own museum, attraction, or cultural experience on SCAVerse.",
    label: "Apply as a Franchise",
    route: "/become-a-tenant",
    visibility: true,
    sortOrder: 2,
  },
  {
    key: "login",
    userType: "Existing User",
    title: "Login",
    description: "For existing users, admins, operators, and approved tenant teams.",
    label: "Login",
    route: "/login",
    visibility: true,
    sortOrder: 3,
  },
];

function resolveGateway(config, mediaRecords = []) {
  const section = (config?.sections || []).find((item) => item.sectionKey === "gateway" || item.sectionKey === "hero") || {};
  const mediaSlot = (config?.mediaSlots || []).find((slot) => slot.sectionKey === "gateway" || slot.sectionKey === "hero") || {};
  const media = mediaRecords.find((item) => item.id === mediaSlot.mediaId);
  const badges = CANONICAL_BADGES;

  return {
    eyebrow: section.eyebrow || "Visit From Anywhere",
    title: section.title && section.title !== "AOM" ? section.title : "SCAVerse",
    subtitle: section.subtitle || "A cinematic entry point for visitors, tenant applicants, and existing operators.",
    description: section.description || section.body || "Choose your path into the SCAVerse platform.",
    overlayOpacity: section.overlayOpacity ?? mediaSlot.overlayOpacity ?? 0.58,
    videoUrl: section.backgroundVideoUrl || section.videoUrl || mediaSlot.backgroundVideoUrl || (media?.mediaType === "video" ? media.fileUrl : ""),
    badges,
  };
}

export default function PlatformHome() {
  const { isOpen: onboardingOpen, closeOnboarding, markSeen } = useFirstVisit(SCAVERSE_INTRO_STORAGE_KEY);

  useEffect(() => {
    document.title = "SCAVerse";
  }, []);

  const { data: configs = [] } = useQuery({
    queryKey: ["platform-home-gateway"],
    queryFn: () => base44.entities.PlatformPageConfig.filter({ pageKey: "platform_home", ownershipScope: "platform", status: "published" }, "-lastPublishedAt", 1),
    initialData: [],
  });

  const { data: mediaRecords = [] } = useQuery({
    queryKey: ["platform-home-media"],
    queryFn: () => base44.entities.PlatformMediaRegistry.filter({ ownershipScope: "platform", isActive: true }, "-updatedAt", 100),
    initialData: [],
  });

  const gateway = resolveGateway(configs[0], mediaRecords);

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground" data-public-portal="scaverse">
      <PlatformGatewayBackground videoUrl={gateway.videoUrl} overlayOpacity={gateway.overlayOpacity} />

      <section className="relative z-10 flex min-h-screen flex-col px-4 py-8 sm:px-6 lg:px-10 before:pointer-events-none before:absolute before:inset-x-8 before:top-20 before:h-72 before:rounded-full before:bg-primary/[0.03] before:blur-[120px] after:pointer-events-none after:absolute after:bottom-12 after:right-10 after:h-80 after:w-80 after:rounded-full after:bg-primary/[0.025] after:blur-3xl">
        <header className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 pt-2 sm:flex-row">
          <div className="flex items-center gap-3 rounded-full border border-primary/25 bg-background/30 px-4 py-2 shadow-lg shadow-primary/10 backdrop-blur-xl">
            <PublicHeaderLogo as="static" title="SCAVerse" subtitle="Gateway" />
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center py-12 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-background/20 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-primary shadow-lg shadow-black/20 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" /> {gateway.eyebrow}
          </div>
          <h1 className="max-w-5xl font-heading text-5xl font-semibold leading-[0.95] tracking-tight text-foreground drop-shadow-2xl sm:text-7xl lg:text-8xl">
            {gateway.title}
          </h1>
          <p className="mt-7 max-w-3xl font-body text-lg font-light leading-relaxed text-muted-foreground sm:text-xl">
            {gateway.subtitle}
          </p>
          <p className="mt-3 max-w-2xl font-body text-sm font-light leading-7 text-muted-foreground sm:text-base">
            {gateway.description}
          </p>

          <div className="mt-11 grid w-full max-w-3xl gap-5">
            {gateway.badges.map((badge) =>
              badge.key === "login"
                ? <GatewaySessionTile key={badge.key} badge={badge} />
                : <PlatformGatewayBadge key={badge.key} badge={badge} variant="primary" />
            )}
          </div>
        </div>
      </section>

      <HomepageOnboardingOverlay
        open={onboardingOpen}
        onClose={closeOnboarding}
        onMarkSeen={markSeen}
      />
    </main>
  );
}