import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Save, Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import TenantHomePreview from "@/components/tenant-admin/TenantHomePreview";
import { museumPath } from "@/lib/domain-registry";

const pageKey = "museum_home";
const nowIso = () => new Date().toISOString();
const detectMediaType = (url = "") => /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url) || /youtube\.com|youtu\.be|vimeo\.com/i.test(url) ? "video" : "image";

const defaultDraft = (tenant) => ({
  museumName: tenant?.name || "",
  logoUrl: tenant?.logo_url || "",
  tenantBadge: tenant?.theme_config?.tenant_badge || "Tenant Platform",
  heroEyebrow: "Tenant Platform · Experience 1",
  heroTitle: tenant?.theme_config?.hero_title || tenant?.name || "Museum Platform",
  heroDescription: tenant?.description || "Enter a tenant-owned public platform with immersive rooms, tickets, stories, tours, marketplace access, and AI-guided discovery.",
  heroMediaUrl: tenant?.theme_config?.background_image_url || "",
  heroMediaType: detectMediaType(tenant?.theme_config?.background_image_url || ""),
  cardMediaUrl: tenant?.theme_config?.background_image_url || "",
  cardMediaType: detectMediaType(tenant?.theme_config?.background_image_url || ""),
  cardLabel: "Cinematic entry",
  cardTitle: "Owned tenant experience",
  cardDescription: "",
  navHomeLabel: "Home",
  navTicketsLabel: "Purchase Tickets",
  navAboutLabel: "About Us",
  navTourLabel: "Begin Tour",
  primaryCtaLabel: "Begin Tour",
  primaryCtaRoute: "begin-tour",
  secondaryCtaLabel: "About Us",
  secondaryCtaRoute: "about",
});

function draftFromConfig(tenant, config) {
  const base = defaultDraft(tenant);
  const hero = (config?.sections || []).find((item) => item.sectionKey === "hero") || {};
  const cinematic = (config?.cards || []).find((item) => item.cardKey === "cinematic") || {};
  const cta = (key, fallback) => (config?.ctaSlots || []).find((item) => item.ctaKey === key)?.label || fallback;
  const route = (key, fallback) => (config?.ctaSlots || []).find((item) => item.ctaKey === key)?.route || fallback;
  return {
    ...base,
    museumName: config?.structuredData?.museumName || base.museumName,
    logoUrl: config?.structuredData?.logoUrl || base.logoUrl,
    tenantBadge: config?.structuredData?.tenantBadge || base.tenantBadge,
    heroEyebrow: hero.eyebrow || base.heroEyebrow,
    heroTitle: hero.title || config?.pageTitle || base.heroTitle,
    heroDescription: hero.description || hero.subtitle || config?.pageContent || base.heroDescription,
    heroMediaUrl: config?.heroMedia?.fileUrl || base.heroMediaUrl,
    heroMediaType: config?.heroMedia?.mediaType || detectMediaType(config?.heroMedia?.fileUrl || base.heroMediaUrl),
    cardMediaUrl: cinematic.mediaUrl || base.cardMediaUrl,
    cardMediaType: cinematic.mediaType || detectMediaType(cinematic.mediaUrl || base.cardMediaUrl),
    cardLabel: cinematic.label || base.cardLabel,
    cardTitle: cinematic.title || base.cardTitle,
    cardDescription: cinematic.description || base.cardDescription,
    navHomeLabel: cta("nav_home", base.navHomeLabel),
    navTicketsLabel: cta("nav_tickets", base.navTicketsLabel),
    navAboutLabel: cta("nav_about", base.navAboutLabel),
    navTourLabel: cta("nav_tour", base.navTourLabel),
    primaryCtaLabel: cta("primary", base.primaryCtaLabel),
    primaryCtaRoute: route("primary", base.primaryCtaRoute),
    secondaryCtaLabel: cta("secondary", base.secondaryCtaLabel),
    secondaryCtaRoute: route("secondary", base.secondaryCtaRoute),
  };
}

function payloadFromDraft(tenant, draft, publishState) {
  const now = nowIso();
  return {
    tenantId: tenant.id,
    museumId: tenant.id,
    tenantSlug: tenant.slug,
    pageKey,
    pageName: "Museum Home",
    pageTitle: draft.heroTitle,
    pageContent: draft.heroDescription,
    ownershipScope: "museum",
    publishState,
    visibilityState: "public",
    structuredData: { museumName: draft.museumName, logoUrl: draft.logoUrl, tenantBadge: draft.tenantBadge },
    heroMedia: { fileUrl: draft.heroMediaUrl, mediaType: draft.heroMediaType || detectMediaType(draft.heroMediaUrl) },
    sections: [{ sectionKey: "hero", eyebrow: draft.heroEyebrow, title: draft.heroTitle, description: draft.heroDescription }],
    cards: [{ cardKey: "cinematic", label: draft.cardLabel, title: draft.cardTitle, description: draft.cardDescription, mediaUrl: draft.cardMediaUrl, mediaType: draft.cardMediaType || detectMediaType(draft.cardMediaUrl) }],
    ctaSlots: [
      { ctaKey: "nav_home", label: draft.navHomeLabel, route: "home", slotType: "navigation" },
      { ctaKey: "nav_tickets", label: draft.navTicketsLabel, route: "tickets", slotType: "navigation" },
      { ctaKey: "nav_about", label: draft.navAboutLabel, route: "about", slotType: "navigation" },
      { ctaKey: "nav_tour", label: draft.navTourLabel, route: "begin-tour", slotType: "navigation" },
      { ctaKey: "primary", label: draft.primaryCtaLabel, route: draft.primaryCtaRoute, slotType: "hero" },
      { ctaKey: "secondary", label: draft.secondaryCtaLabel, route: draft.secondaryCtaRoute, slotType: "hero" },
    ],
    canonicalRoute: museumPath(tenant.slug, "home"),
    adminMirrorRoute: `/museum/${tenant.slug}/admin/home`,
    lastEditedAt: now,
    lastPublishedAt: publishState === "published" ? now : undefined,
    updatedAt: now,
  };
}

export default function HomeAdmin() {
  const { tenant } = useActiveTenant();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(defaultDraft(tenant));

  const { data: configs = [] } = useQuery({
    queryKey: ["tenant-home-page-configs", tenant?.id],
    enabled: !!tenant?.id,
    queryFn: () => base44.entities.MuseumPageConfig.filter({ tenantId: tenant.id, pageKey }, "-updatedAt", 20),
    initialData: [],
  });

  const draftRecord = useMemo(() => configs.find((item) => item.publishState === "draft"), [configs]);
  const publishedRecord = useMemo(() => configs.find((item) => item.publishState === "published"), [configs]);

  useEffect(() => {
    if (!tenant) return;
    setDraft(draftFromConfig(tenant, draftRecord || publishedRecord));
  }, [tenant?.id, draftRecord?.id, draftRecord?.updatedAt, publishedRecord?.id, publishedRecord?.updatedAt]);

  const update = (field, value) => setDraft((prev) => ({ ...prev, [field]: value }));
  const uploadMedia = async (field, typeField, file) => {
    if (!file) return;
    const result = await base44.integrations.Core.UploadFile({ file });
    update(field, result.file_url);
    update(typeField, file.type?.startsWith("video/") ? "video" : "image");
  };

  const saveMutation = useMutation({
    mutationFn: async (publishState) => {
      const payload = payloadFromDraft(tenant, draft, publishState);
      const target = publishState === "published" ? publishedRecord : draftRecord;
      return target?.id ? base44.entities.MuseumPageConfig.update(target.id, payload) : base44.entities.MuseumPageConfig.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-home-page-configs", tenant?.id] });
      queryClient.invalidateQueries({ queryKey: ["tenant-public-page-config", tenant?.id, pageKey] });
      queryClient.invalidateQueries({ queryKey: ["active-tenant-source"] });
    },
  });

  if (!tenant) return <div className="text-sm text-muted-foreground">Select a museum before editing the home page.</div>;

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-primary">Museum Home Page Editor</p>
          <h1 className="mt-2 font-display text-3xl font-bold">{tenant.name} public home</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Save drafts safely, preview changes here, then publish to the public museum home page.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open(museumPath(tenant.slug, "home"), "_blank")}><Eye className="h-4 w-4" /> Public Page</Button>
          <Button variant="outline" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate("draft")}><Save className="h-4 w-4" /> Save Draft</Button>
          <Button disabled={saveMutation.isPending} onClick={() => saveMutation.mutate("published")}><Eye className="h-4 w-4" /> Publish</Button>
        </div>
      </div>

      {saveMutation.error && <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{saveMutation.error.message}</div>}

      <section className="grid gap-5 rounded-3xl border border-white/10 bg-white/[0.035] p-5 lg:grid-cols-2">
        <div className="space-y-2"><Label>Museum display name</Label><Input value={draft.museumName} onChange={(e) => update("museumName", e.target.value)} /></div>
        <div className="space-y-2"><Label>Museum logo/avatar URL</Label><Input value={draft.logoUrl} onChange={(e) => update("logoUrl", e.target.value)} /></div>
        <div className="space-y-2"><Label>Tenant badge/label</Label><Input value={draft.tenantBadge} onChange={(e) => update("tenantBadge", e.target.value)} /></div>
        <div className="space-y-2"><Label>Hero eyebrow/badge</Label><Input value={draft.heroEyebrow} onChange={(e) => update("heroEyebrow", e.target.value)} /></div>
        <div className="space-y-2 lg:col-span-2"><Label>Hero title</Label><Textarea rows={2} value={draft.heroTitle} onChange={(e) => update("heroTitle", e.target.value)} /></div>
        <div className="space-y-2 lg:col-span-2"><Label>Hero description</Label><Textarea rows={3} value={draft.heroDescription} onChange={(e) => update("heroDescription", e.target.value)} /></div>
        <MediaField label="Hero background media" value={draft.heroMediaUrl} onChange={(value) => { update("heroMediaUrl", value); update("heroMediaType", detectMediaType(value)); }} onUpload={(file) => uploadMedia("heroMediaUrl", "heroMediaType", file)} />
        <MediaField label="Right-side cinematic card media" value={draft.cardMediaUrl} onChange={(value) => { update("cardMediaUrl", value); update("cardMediaType", detectMediaType(value)); }} onUpload={(file) => uploadMedia("cardMediaUrl", "cardMediaType", file)} />
        <div className="space-y-2"><Label>Card label</Label><Input value={draft.cardLabel} onChange={(e) => update("cardLabel", e.target.value)} /></div>
        <div className="space-y-2"><Label>Card title</Label><Input value={draft.cardTitle} onChange={(e) => update("cardTitle", e.target.value)} /></div>
        <div className="space-y-2 lg:col-span-2"><Label>Card description</Label><Textarea rows={2} value={draft.cardDescription} onChange={(e) => update("cardDescription", e.target.value)} /></div>
      </section>

      <section className="grid gap-5 rounded-3xl border border-white/10 bg-white/[0.035] p-5 lg:grid-cols-4">
        <NavField label="Home" value={draft.navHomeLabel} onChange={(v) => update("navHomeLabel", v)} route="home" />
        <NavField label="Purchase Tickets" value={draft.navTicketsLabel} onChange={(v) => update("navTicketsLabel", v)} route="tickets" />
        <NavField label="About Us" value={draft.navAboutLabel} onChange={(v) => update("navAboutLabel", v)} route="about" />
        <NavField label="Begin Tour" value={draft.navTourLabel} onChange={(v) => update("navTourLabel", v)} route="begin-tour" />
        <div className="space-y-2"><Label>Primary CTA label</Label><Input value={draft.primaryCtaLabel} onChange={(e) => update("primaryCtaLabel", e.target.value)} /></div>
        <div className="space-y-2"><Label>Primary CTA route</Label><Input value={draft.primaryCtaRoute} onChange={(e) => update("primaryCtaRoute", e.target.value)} /></div>
        <div className="space-y-2"><Label>Secondary CTA label</Label><Input value={draft.secondaryCtaLabel} onChange={(e) => update("secondaryCtaLabel", e.target.value)} /></div>
        <div className="space-y-2"><Label>Secondary CTA route</Label><Input value={draft.secondaryCtaRoute} onChange={(e) => update("secondaryCtaRoute", e.target.value)} /></div>
      </section>

      <TenantHomePreview tenant={tenant} draft={draft} />
    </main>
  );
}

function MediaField({ label, value, onChange, onUpload }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="Image, video, YouTube/Vimeo, or direct media URL" />
        <Button asChild variant="outline"><label className="cursor-pointer"><Upload className="h-4 w-4" /> Upload<input type="file" className="hidden" accept="image/*,video/*" onChange={(e) => onUpload(e.target.files?.[0])} /></label></Button>
      </div>
    </div>
  );
}

function NavField({ label, value, onChange, route }) {
  return <div className="space-y-2"><Label>{label} label</Label><Input value={value} onChange={(e) => onChange(e.target.value)} /><p className="text-[10px] text-muted-foreground">Route: {route}</p></div>;
}