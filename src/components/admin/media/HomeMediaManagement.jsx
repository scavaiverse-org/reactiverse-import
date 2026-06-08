import { useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import MediaSelector from "./MediaSelector";
import MediaLibraryPanel from "./MediaLibraryPanel";

const SECTION_FIELDS = [
  { key: "heroDesktopMediaId", label: "Hero Background · Desktop", section: "home.hero.desktop" },
  { key: "heroTabletMediaId", label: "Hero Background · Tablet", section: "home.hero.tablet" },
  { key: "heroMobileMediaId", label: "Hero Mobile Background", section: "home.hero.mobile" },
  { key: "highlightMediaId", label: "Museum Highlight Background", section: "home.highlight" },
  { key: "visitCardMediaId", label: "Visit Card Background", section: "home.card.visit" },
  { key: "ariaCardMediaId", label: "ARIA Card Background", section: "home.card.aria" },
  { key: "storiesCardMediaId", label: "Stories Card Background", section: "home.card.stories" },
  { key: "futureCardMediaId", label: "Future Card Background", section: "home.card.future" },
  { key: "finalCtaMediaId", label: "Final CTA Background", section: "home.finalCta" },
];

export default function HomeMediaManagement({ draft, updateDraft }) {
  const queryClient = useQueryClient();
  const { data: categories = [] } = useQuery({ queryKey: ["master-museum-categories"], queryFn: () => base44.entities.MasterMuseumCategory.list(), initialData: [] });
  const { data: media = [] } = useQuery({ queryKey: ["master-media-registry"], queryFn: () => base44.entities.MasterMediaRegistry.list("-updatedAt", 100), initialData: [] });
  const hasAom = useMemo(() => categories.some((cat) => cat.categoryCode === "AOM"), [categories]);

  const ensureAomMutation = useMutation({
    mutationFn: () => base44.entities.MasterMuseumCategory.create({
      categoryCode: "AOM",
      categoryName: "Asian Operatic Museum",
      description: "Default master media category for the Asian Operatic Museum.",
      isDefault: true,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["master-museum-categories"] }),
  });

  useEffect(() => {
    if (categories.length === 0 || !hasAom) ensureAomMutation.mutate();
  }, [categories.length, hasAom]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["master-media-registry"] });
    queryClient.invalidateQueries({ queryKey: ["master-museum-categories"] });
  };

  return (
    <Card className="border-primary/20 bg-primary/[0.03]">
      <CardContent className="space-y-5 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Media Management</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-foreground">AOM Master Library</h2>
            <p className="mt-1 text-sm text-muted-foreground">Upload, link, save, assign, and publish Home media from one deterministic registry.</p>
          </div>
          <Button type="button" variant="outline" onClick={() => window.open("/", "_blank")} className="min-h-11 border-border/60">Test Home</Button>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {SECTION_FIELDS.map((field) => (
            <MediaSelector
              key={field.key}
              label={field.label}
              value={draft[field.key] || ""}
              onChange={(next) => updateDraft(field.key, next)}
              media={media}
              categories={categories}
              onSaved={refresh}
              assignedSection={field.section}
            />
          ))}
        </div>

        <MediaLibraryPanel media={media} categories={categories} onChanged={refresh} />
      </CardContent>
    </Card>
  );
}