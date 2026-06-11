import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Store, ShieldCheck, TrendingUp, Users, Zap, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { Link } from "react-router-dom";
import { museumPath } from "@/lib/domain-registry";

const FALLBACK_BENEFITS = [
  { icon: ShieldCheck, title: "Premium Placement", desc: "Curated placement within the museum ecosystem and virtual walkthrough" },
  { icon: TrendingUp, title: "Revenue Analytics", desc: "Real-time dashboards tracking visitor engagement and sales performance" },
  { icon: Users, title: "Visitor Reach", desc: "Access to our growing base of museum visitors and cultural enthusiasts" },
  { icon: Zap, title: "AI-Powered Discovery", desc: "Our AI guide recommends your products to relevant visitor segments" },
];

const FALLBACK_SLOT_TYPES = [
  { value: "standard", label: "Standard Listing", price: "SGD 300 one-time", desc: "Storefront listing setup, product photography guidelines, and 12% commission per sale." },
  { value: "featured", label: "Featured Placement", price: "SGD 300 one-time + SGD 150/mo", desc: "Everything in Standard, plus homepage and room-exit placement (max 4 slots at a time). 12% commission per sale." },
];

const VENDOR_COMMISSION_NOTE = "All vendors: SGD 300 one-time onboarding fee covers storefront setup. SCAVerse takes a 12% commission on marketplace sales — you keep your own fulfilment.";

const ICONS = { ShieldCheck, TrendingUp, Users, Zap, Store };

function getSection(config, keys = []) {
  return (config?.sections || []).find((section) => keys.includes(section.sectionKey) || keys.includes(section.key)) || {};
}

function resolveIcon(iconName, fallbackIcon = Store) {
  return ICONS[iconName] || fallbackIcon;
}

function resolveVendorsPageContent(config, tenantSlug) {
  const hasConfig = !!config?.id;
  const heroSection = getSection(config, ["hero", "vendors_hero", "marketplace_hero"]);
  const benefitsSection = getSection(config, ["benefits", "vendor_benefits"]);
  const tiersSection = getSection(config, ["partnership_tiers", "slot_types", "vendor_slots"]);
  const cards = config?.cards || [];
  const benefitCards = cards.filter((card) => card.sectionKey === "benefits" || card.cardType === "benefit" || card.type === "benefit");
  const slotCards = cards.filter((card) => ["partnership_tiers", "slot_types", "vendor_slots"].includes(card.sectionKey) || card.cardType === "slot_type" || card.type === "slot_type");
  const ctaSlots = config?.ctaSlots || [];
  const primaryCta = ctaSlots.find((cta) => cta.variant === "primary" || cta.slotKey === "primary") || ctaSlots[0];
  const secondaryCta = ctaSlots.find((cta) => cta.variant === "secondary" || cta.slotKey === "secondary") || ctaSlots[1];

  return {
    hasConfig,
    heroEyebrow: hasConfig ? (heroSection.eyebrow || config.pageName || "Museum Marketplace") : "Museum Marketplace",
    heroTitle: hasConfig ? (heroSection.title || config.pageTitle || "") : "Partner and Vendor Marketplace",
    heroSubtitle: hasConfig ? (heroSection.subtitle || "") : "Partner options for ticket-linked shop, add-ons, and cultural bundles.",
    heroBody: hasConfig ? (heroSection.body || heroSection.description || config.pageContent || "") : "This page explains the vendor ecosystem after visitors have seen ticket add-ons and museum shop options.",
    primaryCta: {
      label: primaryCta?.label || primaryCta?.title || primaryCta?.ctaLabel || "Apply as Vendor",
      path: primaryCta?.path || primaryCta?.route || primaryCta?.url || primaryCta?.ctaPath || museumPath(tenantSlug, "vendors/register"),
    },
    secondaryCta: {
      label: secondaryCta?.label || secondaryCta?.title || secondaryCta?.ctaLabel || "Return to Tickets",
      path: secondaryCta?.path || secondaryCta?.route || secondaryCta?.url || secondaryCta?.ctaPath || museumPath(tenantSlug, "tickets"),
    },
    benefitsTitle: benefitsSection.title || "",
    benefits: benefitCards.length
      ? benefitCards.map((card) => ({
          icon: resolveIcon(card.icon, ShieldCheck),
          title: card.title || card.label,
          desc: card.desc || card.description || card.body,
        })).filter((benefit) => benefit.title && benefit.desc)
      : FALLBACK_BENEFITS,
    tiersTitle: tiersSection.title || "Partnership Tiers",
    slotTypes: slotCards.length
      ? slotCards.map((card, index) => ({
          value: card.value || card.key || `slot_${index + 1}`,
          label: card.label || card.title,
          price: card.price || card.subtitle || "",
          desc: card.desc || card.description || card.body,
        })).filter((slot) => slot.value && slot.label)
      : FALLBACK_SLOT_TYPES,
  };
}

export default function Vendors() {
  const { tenant } = useActiveTenant();
  const tenantSlug = tenant?.slug || "asian-operatic-museum";
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    business_name: "", contact_name: "", email: "", phone: "",
    category: "", description: "", slot_type: "standard", website_url: "",
  });

  const { data: pageConfigs = [] } = useQuery({
    queryKey: ["public-vendors-page-config", tenant?.id],
    queryFn: () => tenant ? base44.entities.MuseumPageConfig.filter({ tenantId: tenant.id, pageKey: "vendors", publishState: "published" }, "-lastPublishedAt", 1) : Promise.resolve([]),
    enabled: !!tenant?.id,
    initialData: [],
  });
  const pageContent = useMemo(() => resolveVendorsPageContent(pageConfigs[0], tenantSlug), [pageConfigs, tenantSlug]);

  const registerMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        tenant_id: tenant?.id,
        tenant_name: tenant?.name,
        status: "pending",
      };
      base44.entities.AnalyticsEvent.create({ tenant_id: tenant?.id, tenant_name: tenant?.name, event_type: "vendor_signup", event_data: { slot_type: data.slot_type }, source_page: "vendors" }).catch(() => {});
      return base44.entities.Vendor.create(payload);
    },
    onSuccess: () => {
      toast.success("Application submitted! We'll review and get back to you within 48 hours.");
      setShowForm(false);
      setFormData({ business_name: "", contact_name: "", email: "", phone: "", category: "", description: "", slot_type: "standard", website_url: "" });
    },
    onError: (error) => {
      toast.error(error?.message || "Vendor application failed. Please try again.");
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden border-b border-border/40 px-4 py-20 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.16),transparent_45%)]" />
        <div className="relative mx-auto max-w-4xl">
          {pageContent.heroEyebrow && <p className="mb-4 text-xs font-semibold uppercase tracking-[0.32em] text-primary">{pageContent.heroEyebrow}</p>}
          {pageContent.heroTitle && <h1 className="font-display text-4xl font-bold text-foreground sm:text-6xl">{pageContent.heroTitle}</h1>}
          {pageContent.heroSubtitle && <p className="mx-auto mt-5 max-w-2xl text-lg text-foreground/78">{pageContent.heroSubtitle}</p>}
          {pageContent.heroBody && <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">{pageContent.heroBody}</p>}
        </div>
      </section>
      <div className="mb-10 mt-[-18px] flex justify-center px-4 relative z-10">
        <div className="flex flex-wrap justify-center gap-3 rounded-2xl border border-border/50 bg-card/70 p-3 backdrop-blur-xl">
          <Button asChild className="bg-primary text-primary-foreground gap-2"><Link to={pageContent.primaryCta.path}><Store className="w-4 h-4" /> {pageContent.primaryCta.label}</Link></Button>
          <Button asChild variant="outline"><Link to={pageContent.secondaryCta.path}>{pageContent.secondaryCta.label}</Link></Button>
        </div>
      </div>

      {/* Benefits */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        {pageContent.benefitsTitle && <h2 className="text-2xl font-display font-bold text-foreground text-center mb-8">{pageContent.benefitsTitle}</h2>}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {pageContent.benefits.map((b, idx) => {
            const Icon = b.icon;
            return (
              <motion.div key={b.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }}>
                <div className="p-5 rounded-xl border border-border/50 bg-card/50">
                  <Icon className="w-7 h-7 text-primary/70 mb-3" />
                  <h3 className="text-sm font-semibold text-foreground mb-1">{b.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Slot Types */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-display font-bold text-foreground text-center mb-2">{pageContent.tiersTitle}</h2>
        <p className="mx-auto mb-8 max-w-2xl text-center text-xs text-muted-foreground">{VENDOR_COMMISSION_NOTE}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {pageContent.slotTypes.map((slot) => (
            <Card key={slot.value} className="bg-card/50 border-border/50">
              <CardContent className="p-5">
                <h3 className="font-semibold text-foreground text-sm">{slot.label}</h3>
                {slot.price && <p className="text-lg font-display font-bold text-primary mt-1">{slot.price}</p>}
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{slot.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Registration Form */}
      {showForm && (
        <section className="max-w-lg mx-auto px-4 pb-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-card border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Vendor Application</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Business Name</Label>
                    <Input value={formData.business_name} onChange={(e) => setFormData({ ...formData, business_name: e.target.value })} className="bg-secondary border-border/50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Contact Name</Label>
                    <Input value={formData.contact_name} onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })} className="bg-secondary border-border/50" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="bg-secondary border-border/50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Phone</Label>
                    <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="bg-secondary border-border/50" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Category</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger className="bg-secondary border-border/50"><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cultural_arts">Cultural Arts</SelectItem>
                      <SelectItem value="food_beverage">Food & Beverage</SelectItem>
                      <SelectItem value="merchandise">Merchandise</SelectItem>
                      <SelectItem value="experiences">Experiences</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="corporate_sponsor">Corporate Sponsor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Slot Type</Label>
                  <Select value={formData.slot_type} onValueChange={(v) => setFormData({ ...formData, slot_type: v })}>
                    <SelectTrigger className="bg-secondary border-border/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {pageContent.slotTypes.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}{s.price ? ` — ${s.price}` : ""}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="bg-secondary border-border/50" rows={3} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Website URL</Label>
                  <Input value={formData.website_url} onChange={(e) => setFormData({ ...formData, website_url: e.target.value })} className="bg-secondary border-border/50" placeholder="https://" />
                </div>
                <Button
                  className="w-full bg-primary text-primary-foreground gap-2"
                  onClick={() => registerMutation.mutate(formData)}
                  disabled={!formData.business_name || !formData.email || !formData.category || registerMutation.isPending}
                >
                  {registerMutation.isPending ? "Submitting..." : "Submit Application"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </section>
      )}
    </div>
  );
}