import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { mediaMap } from "@/lib/home-media";
import { platformPublicKey } from "@/lib/platform-page-registry";
import { resolvePlatformHero } from "@/lib/PlatformPageConfigValidator";

export default function PublicPageHero({ pageKey, fallback, eyebrow }) {
  const canonicalPageKey = platformPublicKey(pageKey);
  const { data: configs = [] } = useQuery({
    queryKey: ["platform-public-page", canonicalPageKey],
    queryFn: () => base44.entities.PlatformPageConfig.filter({ pageKey: canonicalPageKey, ownershipScope: "platform", status: "published" }, "-lastPublishedAt", 1),
    initialData: [],
  });
  const { data: mediaRecords = [] } = useQuery({
    queryKey: ["platform-public-media", canonicalPageKey],
    queryFn: () => base44.entities.PlatformMediaRegistry.filter({ ownershipScope: "platform", publishState: "published", isActive: true }, "-updatedAt", 100),
    initialData: [],
  });
  const { data: legacyContent = [] } = useQuery({
    queryKey: ["public-content", pageKey],
    queryFn: () => base44.entities.PublicContent.filter({ page_key: pageKey, status: "published", public_visibility: true }),
    initialData: [],
  });

  const config = configs[0];
  const legacyPage = legacyContent[0] || {};
  const resolved = config ? resolvePlatformHero(config, mediaMap(mediaRecords)) : null;
  const section = resolved?.section || {};
  const media = resolved?.media;
  const ctas = resolved?.ctas || [];
  const page = {
    title: section.title || legacyPage.title || fallback.title,
    subtitle: section.subtitle || legacyPage.subtitle || fallback.subtitle,
    body: section.description || section.body || legacyPage.body || fallback.body,
    eyebrow: section.eyebrow || eyebrow,
    cta_label: ctas[0]?.label || legacyPage.cta_label || fallback.cta_label,
    cta_path: ctas[0]?.route || legacyPage.cta_path || fallback.cta_path,
    secondary_cta_label: ctas[1]?.label || legacyPage.secondary_cta_label || fallback.secondary_cta_label,
    secondary_cta_path: ctas[1]?.route || legacyPage.secondary_cta_path || fallback.secondary_cta_path,
  };
  const overlayOpacity = section.overlayOpacity ?? 0.68;
  const overlayColor = section.overlayColor || "6, 12, 24";

  return (
    <section className="relative overflow-hidden px-4 pb-10 pt-24 text-center">
      {media?.fileUrl && (
        <div className="absolute inset-0">
          {media.mediaType === "video" ? (
            <video src={media.fileUrl} className="h-full w-full object-cover" muted loop playsInline autoPlay />
          ) : (
            <img src={media.fileUrl} alt={page.title} className="h-full w-full object-cover" />
          )}
          <div className="absolute inset-0" style={{ backgroundColor: `rgba(${overlayColor}, ${overlayOpacity})` }} />
        </div>
      )}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 mx-auto max-w-3xl">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-primary">{page.eyebrow}</p>
        <h1 className="font-display text-4xl font-bold text-foreground sm:text-5xl">{page.title}</h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-foreground/80">{page.subtitle}</p>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{page.body}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link to={page.cta_path}>
            <Button className="bg-primary text-primary-foreground gap-2">
              {page.cta_label} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          {page.secondary_cta_label && page.secondary_cta_path && (
            <Link to={page.secondary_cta_path}>
              <Button variant="outline" className="border-border/50 bg-background/30 backdrop-blur-sm">
                {page.secondary_cta_label}
              </Button>
            </Link>
          )}
        </div>
      </motion.div>
    </section>
  );
}