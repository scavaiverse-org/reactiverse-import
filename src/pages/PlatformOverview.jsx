import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import OverviewHero from "@/components/platform/overview/OverviewHero";
import PreBookingFeature from "@/components/platform/overview/PreBookingFeature";
import { resolvePlatformOverviewContent } from "@/lib/platform-overview-content";

export default function PlatformOverview() {
  const { data: configs = [] } = useQuery({
    queryKey: ["platform-public-page", "platform_overview"],
    queryFn: () => base44.entities.PlatformPageConfig.filter({ pageKey: "platform_overview", ownershipScope: "platform", status: "published" }, "-lastPublishedAt", 1),
    initialData: [],
  });

  const content = resolvePlatformOverviewContent(configs[0]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <OverviewHero content={content} />
      <PreBookingFeature />
    </main>
  );
}