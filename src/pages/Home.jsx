import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { defaultHomeConfig } from "@/lib/home-defaults";
import HeroMediaPanel from "@/components/home/HeroMediaPanel";
import HomeHighlightsSection from "@/components/home/HomeHighlightsSection";
import HomeModuleGrid from "@/components/home/HomeModuleGrid";
import HomePathways from "@/components/home/HomePathways";
import HomeFinalCta from "@/components/home/HomeFinalCta";
import { mediaMap, resolveMedia, resolveSlotMedia } from "@/lib/home-media";

export default function Home() {
  const { data: configs = [] } = useQuery({
    queryKey: ["home-config"],
    queryFn: () => base44.entities.HomeConfig.filter({ status: "published" }, "-updated_at", 1),
    initialData: [],
  });

  const { data: mediaRecords = [] } = useQuery({
    queryKey: ["home-media-registry"],
    queryFn: () => base44.entities.MasterMediaRegistry.filter({ status: "active", isActive: true, museumCategoryCode: "AOM" }, "-updatedAt", 100),
    initialData: [],
  });

  const config = { ...defaultHomeConfig, ...(configs[0] || {}) };
  const mediaById = mediaMap(mediaRecords);
  const media = resolveMedia(config, mediaById);

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <HeroMediaPanel config={config} media={media.hero} mediaById={mediaById} />
      <HomePathways
        section={config.schoolsPartnersSection}
        platform={config.platformPreviewSection}
        pathways={config.pathways}
        deploymentSites={config.deployment_sites}
        mediaById={mediaById}
        resolveSlotMedia={resolveSlotMedia}
      />
      <HomeHighlightsSection
        section={config.museumHighlightsSection}
        cards={config.museumHighlightCards}
        mediaById={mediaById}
        resolveSlotMedia={resolveSlotMedia}
      />
      <HomeModuleGrid
        section={config.whatYouCanDoSection}
        cards={config.homeCards}
        cardMedia={media.cards}
        mediaById={mediaById}
        resolveSlotMedia={resolveSlotMedia}
      />
      <HomeFinalCta config={config} section={config.finalCtaSection} media={media.finalCta} />
    </main>
  );
}