import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import MediaSelector from "@/components/admin/media/MediaSelector";
import { PLATFORM_PAGES, createDefaultPlatformPageConfig } from "@/lib/platform-page-registry";
import { mediaMap } from "@/lib/home-media";
import { validatePlatformPageConfig } from "@/lib/PlatformPageConfigValidator";

const aomOnly = (categories = []) => categories.filter((category) => category.categoryCode === "AOM");

export default function PlatformPages({ initialPageKey = "platform_home" }) {
  const queryClient = useQueryClient();
  const [pageKey, setPageKey] = useState(initialPageKey);
  const { data: configs = [] } = useQuery({ queryKey: ["platform-page-configs"], queryFn: () => base44.entities.PlatformPageConfig.filter({ ownershipScope: "platform" }, "-lastEditedAt", 200), initialData: [] });
  const { data: categories = [] } = useQuery({ queryKey: ["master-museum-categories"], queryFn: () => base44.entities.MasterMuseumCategory.list(), initialData: [] });
  const { data: media = [] } = useQuery({ queryKey: ["platform-media-registry"], queryFn: () => base44.entities.PlatformMediaRegistry.filter({ ownershipScope: "platform" }, "-updatedAt", 100), initialData: [] });

  const existing = configs.find((config) => config.pageKey === pageKey && config.status === "draft") || configs.find((config) => config.pageKey === pageKey && config.status === "published");
  const [draft, setDraft] = useState(createDefaultPlatformPageConfig(pageKey));

  useEffect(() => {
    setDraft(existing || createDefaultPlatformPageConfig(pageKey));
  }, [pageKey, existing?.id]);

  const page = PLATFORM_PAGES.find((item) => item.pageKey === pageKey) || PLATFORM_PAGES[0];
  const isGateway = pageKey === "platform_home";
  const isPlatformOverview = pageKey === "platform_overview";
  const gatewayDefaults = createDefaultPlatformPageConfig("platform_home").cards;
  const gatewayCards = gatewayDefaults.map((fallback) => ({
    ...fallback,
    ...((draft.cards || []).find((card) => card.key === fallback.key || card.title === fallback.title) || {}),
  }));
  const mediaById = mediaMap(media);
  const validation = validatePlatformPageConfig(draft, mediaById, aomOnly(categories).length || 1);
  const hero = draft.sections?.find((section) => section.sectionKey === "hero") || draft.sections?.[0] || {};
  const heroSlot = draft.mediaSlots?.find((slot) => slot.sectionKey === "hero") || draft.mediaSlots?.[0] || {};
  const primaryCta = draft.ctaSlots?.find((cta) => cta.ctaKey === "primary") || {};
  const secondaryCta = draft.ctaSlots?.find((cta) => cta.ctaKey === "secondary") || {};

  const updateHero = (field, value) => setDraft((prev) => ({ ...prev, sections: (prev.sections || []).map((section, index) => index === 0 || section.sectionKey === "hero" ? { ...section, [field]: value } : section), lastEditedAt: new Date().toISOString() }));
  const updateHeroOverlay = (field, value) => updateHero(field, value);
  const updateHeroSlot = (field, value) => setDraft((prev) => ({ ...prev, mediaSlots: (prev.mediaSlots || []).map((slot, index) => index === 0 || slot.sectionKey === "hero" ? { ...slot, [field]: value } : slot), lastEditedAt: new Date().toISOString() }));
  const updateCta = (key, field, value) => setDraft((prev) => ({ ...prev, ctaSlots: (prev.ctaSlots || []).map((cta) => cta.ctaKey === key ? { ...cta, [field]: value, target: field === "route" ? value : cta.target } : cta), lastEditedAt: new Date().toISOString() }));
  const updateGatewayCard = (key, field, value) => setDraft((prev) => {
    const currentCards = gatewayDefaults.map((fallback) => ({
      ...fallback,
      ...((prev.cards || []).find((card) => card.key === fallback.key || card.title === fallback.title) || {}),
    }));
    return { ...prev, cards: currentCards.map((card) => card.key === key ? { ...card, [field]: value } : card), lastEditedAt: new Date().toISOString() };
  });
  const updateOverviewCard = (key, field, value) => setDraft((prev) => ({
    ...prev,
    cards: (prev.cards || []).map((card) => card.key === key ? { ...card, [field]: value } : card),
    lastEditedAt: new Date().toISOString(),
  }));
  const refreshMedia = () => queryClient.invalidateQueries({ queryKey: ["platform-media-registry"] });

  const publishMutation = useMutation({
    mutationFn: async () => {
      const report = validatePlatformPageConfig(draft, mediaById, aomOnly(categories).length || 1);
      const payload = {
        ...draft,
        pageName: page.pageName,
        ownershipScope: "platform",
        status: "published",
        publishedVersion: (draft.publishedVersion || 0) + 1,
        verificationReport: report,
        lastPublishedAt: new Date().toISOString(),
        lastEditedAt: new Date().toISOString(),
      };
      if (draft.id) return base44.entities.PlatformPageConfig.update(draft.id, payload);
      return base44.entities.PlatformPageConfig.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-page-configs"] });
      queryClient.invalidateQueries({ queryKey: ["platform-public-page", pageKey] });
    },
  });

  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...draft, pageName: page.pageName, ownershipScope: "platform", status: "draft", draftVersion: (draft.draftVersion || 0) + 1, lastEditedAt: new Date().toISOString() };
      if (draft.id) return base44.entities.PlatformPageConfig.update(draft.id, payload);
      return base44.entities.PlatformPageConfig.create(payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["platform-page-configs"] }),
  });

  const resetDraft = () => setDraft(createDefaultPlatformPageConfig(pageKey));

  return (
    <main className="min-h-screen bg-[#060c18] p-6 text-foreground lg:p-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-primary">Platform Domain</p>
          <h1 className="mt-2 font-display text-3xl font-bold">{isGateway ? "Home Control" : "Platform Page Control"}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{isGateway ? "Master-admin control for the public Home page: Visit From Anywhere badge, title, subtitle, CTAs, background video, overlay, and publish state." : "PlatformPageConfig controls only platform-owned pages, CTAs, media slots, validation, and publish proof."}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetDraft}>Revert Draft</Button>
          <Button variant="outline" onClick={() => saveDraftMutation.mutate()} disabled={saveDraftMutation.isPending}>Save Draft</Button>
          <Button onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending || validation.publishBlocked} className="bg-primary text-primary-foreground">Publish Page</Button>
          <Link to={page.route}><Button variant="outline">View Public Page</Button></Link>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {PLATFORM_PAGES.map((item) => (
          <button key={item.pageKey} onClick={() => setPageKey(item.pageKey)} className={`rounded-full border px-3 py-1.5 text-xs transition ${pageKey === item.pageKey ? "border-primary bg-primary/15 text-primary" : "border-border/60 text-muted-foreground hover:text-foreground"}`}>
            {item.pageName}
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="grid gap-6">
          <Card className="border-border/50 bg-card/45"><CardContent className="grid gap-4 p-5">
            <h2 className="font-display text-2xl font-bold">Page Identity</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div><Label>Page Key</Label><Input readOnly className="mt-1 bg-secondary" value={draft.pageKey || pageKey} /></div>
              <div><Label>Page Name</Label><Input readOnly className="mt-1 bg-secondary" value={page.pageName} /></div>
              <div><Label>Ownership Scope</Label><Input readOnly className="mt-1 bg-secondary" value="Platform" /></div>
              <div><Label>Publish State</Label><Input readOnly className="mt-1 bg-secondary" value={draft.status || "draft"} /></div>
            </div>
          </CardContent></Card>

          <Card className="border-border/50 bg-card/45"><CardContent className="grid gap-4 p-5">
            <h2 className="font-display text-2xl font-bold">{isGateway ? "Home Hero" : "Hero Section"}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>Eyebrow</Label><Input className="mt-1 bg-secondary" value={hero.eyebrow || ""} onChange={(e) => updateHero("eyebrow", e.target.value)} /></div>
              <div><Label>Title</Label><Input className="mt-1 bg-secondary" value={hero.title || ""} onChange={(e) => updateHero("title", e.target.value)} /></div>
              <div className="md:col-span-2"><Label>Subtitle</Label><Textarea rows={2} className="mt-1 bg-secondary" value={hero.subtitle || ""} onChange={(e) => updateHero("subtitle", e.target.value)} /></div>
              <div className="md:col-span-2"><Label>Description / Body</Label><Textarea rows={3} className="mt-1 bg-secondary" value={hero.description || hero.body || ""} onChange={(e) => updateHero("description", e.target.value)} /></div>
              <div><Label>Overlay Opacity</Label><Input type="number" min="0" max="1" step="0.05" className="mt-1 bg-secondary" value={hero.overlayOpacity ?? ""} onChange={(e) => updateHeroOverlay("overlayOpacity", Number(e.target.value))} /></div>
              <div><Label>Overlay Blur</Label><Input type="number" className="mt-1 bg-secondary" value={hero.overlayBlur ?? ""} onChange={(e) => updateHeroOverlay("overlayBlur", Number(e.target.value))} /></div>
              <div><Label>Overlay Color RGB</Label><Input className="mt-1 bg-secondary" value={hero.overlayColor || ""} onChange={(e) => updateHeroOverlay("overlayColor", e.target.value)} /></div>
              <div><Label>Background Video URL</Label><Input className="mt-1 bg-secondary" value={hero.backgroundVideoUrl || ""} onChange={(e) => updateHero("backgroundVideoUrl", e.target.value)} /></div>
              {isGateway && <div className="md:col-span-2"><Label>System Color Alignment</Label><Input className="mt-1 bg-secondary" value={hero.systemColorAlignment || ""} onChange={(e) => updateHero("systemColorAlignment", e.target.value)} /></div>}
              <label className="flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={hero.visibility !== false} onChange={(e) => updateHero("visibility", e.target.checked)} /> Visible</label>
            </div>
          </CardContent></Card>

          {isGateway ? (
            <Card className="border-border/50 bg-card/45"><CardContent className="grid gap-4 p-5">
              <h2 className="font-display text-2xl font-bold">Home Gateway CTA Controls</h2>
              <p className="text-xs text-muted-foreground">These three CTAs route the homepage gateway for public visitors, potential tenants, and existing users.</p>
              <div className="grid gap-5">
                {gatewayCards.map((card) => (
                  <div key={card.key} className="rounded-2xl border border-border/50 bg-secondary/35 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">{card.title}</p>
                      <label className="flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={card.visibility !== false} onChange={(e) => updateGatewayCard(card.key, "visibility", e.target.checked)} /> Visible</label>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div><Label>Label</Label><Input className="mt-1 bg-secondary" value={card.label || ""} onChange={(e) => updateGatewayCard(card.key, "label", e.target.value)} /></div>
                      <div><Label>Route</Label><Input className="mt-1 bg-secondary" value={card.route || ""} onChange={(e) => updateGatewayCard(card.key, "route", e.target.value)} /></div>
                      <div><Label>Title</Label><Input className="mt-1 bg-secondary" value={card.title || ""} onChange={(e) => updateGatewayCard(card.key, "title", e.target.value)} /></div>
                      <div><Label>User Type</Label><Input readOnly className="mt-1 bg-secondary" value={card.userType || ""} /></div>
                      <div><Label>Sort Order</Label><Input type="number" className="mt-1 bg-secondary" value={card.sortOrder || 0} onChange={(e) => updateGatewayCard(card.key, "sortOrder", Number(e.target.value))} /></div>
                      <div className="md:col-span-2"><Label>Description</Label><Textarea rows={2} className="mt-1 bg-secondary" value={card.description || ""} onChange={(e) => updateGatewayCard(card.key, "description", e.target.value)} /></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent></Card>
          ) : (
            <Card className="border-border/50 bg-card/45"><CardContent className="grid gap-4 p-5">
              <h2 className="font-display text-2xl font-bold">CTA Buttons</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div><Label>Primary Label</Label><Input className="mt-1 bg-secondary" value={primaryCta.label || ""} onChange={(e) => updateCta("primary", "label", e.target.value)} /></div>
                <div><Label>Primary Route</Label><Input className="mt-1 bg-secondary" value={primaryCta.route || ""} onChange={(e) => updateCta("primary", "route", e.target.value)} /></div>
                <div><Label>Secondary Label</Label><Input className="mt-1 bg-secondary" value={secondaryCta.label || ""} onChange={(e) => updateCta("secondary", "label", e.target.value)} /></div>
                <div><Label>Secondary Route</Label><Input className="mt-1 bg-secondary" value={secondaryCta.route || ""} onChange={(e) => updateCta("secondary", "route", e.target.value)} /></div>
              </div>
            </CardContent></Card>
          )}

          {isPlatformOverview && (
            <Card className="border-border/50 bg-card/45"><CardContent className="grid gap-4 p-5">
              <h2 className="font-display text-2xl font-bold">Mass Market Overview Components</h2>
              <p className="text-xs text-muted-foreground">These are the same public components shown on Platform Overview: action cards, audience benefits, commercial capability cards, and InvokeLLM positioning.</p>
              <div className="grid gap-4">
                {(draft.cards || []).map((card) => (
                  <div key={card.key} className="rounded-2xl border border-border/50 bg-secondary/35 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">{card.group}: {card.title}</p>
                      <label className="flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={card.visibility !== false} onChange={(e) => updateOverviewCard(card.key, "visibility", e.target.checked)} /> Visible</label>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div><Label>Title</Label><Input className="mt-1 bg-secondary" value={card.title || ""} onChange={(e) => updateOverviewCard(card.key, "title", e.target.value)} /></div>
                      <div><Label>CTA Label</Label><Input className="mt-1 bg-secondary" value={card.cta || ""} onChange={(e) => updateOverviewCard(card.key, "cta", e.target.value)} /></div>
                      <div><Label>Route</Label><Input className="mt-1 bg-secondary" value={card.route || ""} onChange={(e) => updateOverviewCard(card.key, "route", e.target.value)} /></div>
                      <div><Label>Sort Order</Label><Input type="number" className="mt-1 bg-secondary" value={card.sortOrder || 0} onChange={(e) => updateOverviewCard(card.key, "sortOrder", Number(e.target.value))} /></div>
                      <div className="md:col-span-2"><Label>Body</Label><Textarea rows={2} className="mt-1 bg-secondary" value={card.body || ""} onChange={(e) => updateOverviewCard(card.key, "body", e.target.value)} /></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent></Card>
          )}

          <MediaSelector label={isGateway ? "Home Background Video Reference" : `${page.pageName} Hero Background Media`} value={heroSlot.mediaId || ""} onChange={(value) => updateHeroSlot("mediaId", value)} media={media} categories={aomOnly(categories)} onSaved={refreshMedia} assignedSection={heroSlot.slotKey || `${pageKey}.hero.background`} registryName="PlatformMediaRegistry" ownershipScope="platform" />
          <MediaSelector label={`${page.pageName} Hero Mobile Media`} value={heroSlot.mobileMediaId || ""} onChange={(value) => updateHeroSlot("mobileMediaId", value)} media={media} categories={aomOnly(categories)} onSaved={refreshMedia} assignedSection={`${pageKey}.hero.mobile`} registryName="PlatformMediaRegistry" ownershipScope="platform" />
        </div>

        <Card className="h-fit border-border/50 bg-card/45"><CardContent className="grid gap-3 p-5">
          <h2 className="font-display text-xl font-bold">Page Verification Report</h2>
          <p className={`text-sm font-semibold ${validation.status === "PASS" ? "text-emerald-300" : "text-amber-300"}`}>{validation.status}</p>
          {validation.checks.map((check) => (
            <div key={check.name} className="rounded-xl border border-border/40 bg-secondary/40 p-3">
              <p className="text-xs font-semibold text-foreground">{check.name}: <span className={check.status === "PASS" ? "text-emerald-300" : "text-red-300"}>{check.status}</span></p>
              <p className="mt-1 text-xs text-muted-foreground">{check.message}</p>
            </div>
          ))}
        </CardContent></Card>
      </div>
    </main>
  );
}