import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingBag, Store, Star } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { museumPath } from "@/lib/domain-registry";

const FALLBACK_CATEGORIES = [
  { name: "Cultural Arts", count: 24, image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop" },
  { name: "Artisan Crafts", count: 18, image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop" },
  { name: "Tea & Traditions", count: 12, image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop" },
  { name: "Digital Collectibles", count: 8, image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop" },
  { name: "Music & Sound", count: 15, image: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400&h=300&fit=crop" },
  { name: "Experiences", count: 6, image: "https://images.unsplash.com/photo-1503095396549-807759245b35?w=400&h=300&fit=crop" },
];

const FALLBACK_FEATURED_PRODUCTS = [
  { name: "Handcrafted Opera Mask", vendor: "Heritage Artisans", price: "SGD 89", image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop", rating: 4.8 },
  { name: "Silk Fan Collection", vendor: "Royal Silk House", price: "SGD 45", image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=300&h=300&fit=crop", rating: 4.9 },
  { name: "Tea Ceremony Kit", vendor: "Dragon Well Tea", price: "SGD 120", image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&h=300&fit=crop", rating: 5.0 },
  { name: "Virtual Gallery Pass", vendor: "SCAVAI Digital", price: "SGD 25", image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=300&h=300&fit=crop", rating: 4.7 },
];

function getSection(config, keys = []) {
  return (config?.sections || []).find((section) => keys.includes(section.sectionKey) || keys.includes(section.key)) || {};
}

function resolveCommercePageContent(config, tenantSlug) {
  const hasConfig = !!config?.id;
  const heroSection = getSection(config, ["hero", "commerce_hero", "shop_hero"]);
  const categorySection = getSection(config, ["categories", "product_categories"]);
  const featuredSection = getSection(config, ["featured_products", "products"]);
  const vendorSection = getSection(config, ["vendor_cta", "sell_cta"]);
  const cards = config?.cards || [];
  const categoryCards = cards.filter((card) => card.sectionKey === "categories" || card.cardType === "category" || card.type === "category");
  const productCards = cards.filter((card) => card.sectionKey === "featured_products" || card.cardType === "product" || card.type === "product");
  const ctaSlots = config?.ctaSlots || [];
  const rawPrimaryCta = ctaSlots.find((cta) => cta.variant === "primary" || cta.slotKey === "primary") || ctaSlots[0];
  const rawSecondaryCta = ctaSlots.find((cta) => cta.variant === "secondary" || cta.slotKey === "secondary") || ctaSlots[1];
  const vendorCta = ctaSlots.find((cta) => cta.sectionKey === "vendor_cta" || cta.slotKey === "vendor");
  const primaryPath = rawPrimaryCta?.path || rawPrimaryCta?.route || rawPrimaryCta?.url || rawPrimaryCta?.ctaPath;
  const secondaryPath = rawSecondaryCta?.path || rawSecondaryCta?.route || rawSecondaryCta?.url || rawSecondaryCta?.ctaPath;
  const primaryPathIsAddons = primaryPath?.includes("tickets-4");
  const secondaryPathIsTicketFlow = secondaryPath?.includes("tickets-4") || secondaryPath?.includes("tickets-5");

  return {
    hasConfig,
    heroEyebrow: hasConfig ? (heroSection.eyebrow || config.pageName || "Museum Products") : "Museum Products",
    heroTitle: hasConfig ? (heroSection.title || config.pageTitle || "") : "Museum Products and Gifts",
    heroSubtitle: hasConfig ? (heroSection.subtitle || "") : "Browse cultural items, learning packs, and digital experiences.",
    heroBody: hasConfig ? (heroSection.body || heroSection.description || config.pageContent || "") : "Find objects and stories connected to the museum journey.",
    primaryCta: {
      label: primaryPathIsAddons ? "Browse Products" : (rawPrimaryCta?.label || rawPrimaryCta?.title || rawPrimaryCta?.ctaLabel || "Browse Products"),
      path: primaryPath && !primaryPathIsAddons ? primaryPath : "#products",
    },
    secondaryCta: {
      label: secondaryPathIsTicketFlow ? "Reserve Tickets" : (rawSecondaryCta?.label || rawSecondaryCta?.title || rawSecondaryCta?.ctaLabel || "Reserve Tickets"),
      path: secondaryPath && !secondaryPathIsTicketFlow ? secondaryPath : museumPath(tenantSlug, "tickets"),
    },
    categoriesTitle: categorySection.title || "Browse Categories",
    categories: categoryCards.length
      ? categoryCards.map((card) => ({
          name: card.name || card.title || card.label,
          count: card.count || card.itemCount || 0,
          image: card.image || card.imageUrl || card.mediaUrl || card.fileUrl,
        })).filter((category) => category.name && category.image)
      : FALLBACK_CATEGORIES,
    featuredTitle: featuredSection.title || "Featured Products",
    featuredProducts: productCards.length
      ? productCards.map((card) => ({
          name: card.name || card.title || card.label,
          vendor: card.vendor || card.subtitle || "",
          price: card.price || "",
          image: card.image || card.imageUrl || card.mediaUrl || card.fileUrl,
          rating: card.rating,
        })).filter((product) => product.name && product.image)
      : FALLBACK_FEATURED_PRODUCTS,
    vendorTitle: vendorSection.title || "Want to sell with the museum?",
    vendorBody: vendorSection.body || vendorSection.description || "Join our vendor ecosystem and reach thousands of culturally-engaged visitors.",
    vendorCta: {
      label: vendorCta?.label || vendorCta?.title || vendorCta?.ctaLabel || "Vendor Partnership",
      path: vendorCta?.path || vendorCta?.route || vendorCta?.url || vendorCta?.ctaPath || museumPath(tenantSlug, "vendors"),
    },
  };
}

export default function Commerce() {
  const { tenantSlug: routeTenantSlug } = useParams();
  const { tenant } = useActiveTenant();
  const tenantSlug = tenant?.slug || routeTenantSlug || "asian-operatic-museum";
  const { data: pageConfigs = [] } = useQuery({
    queryKey: ["public-commerce-page-config", tenant?.id],
    queryFn: () => tenant ? base44.entities.MuseumPageConfig.filter({ tenantId: tenant.id, pageKey: "commerce", publishState: "published" }, "-lastPublishedAt", 1) : Promise.resolve([]),
    enabled: !!tenant?.id,
    initialData: [],
  });
  const pageContent = useMemo(() => resolveCommercePageContent(pageConfigs[0], tenantSlug), [pageConfigs, tenantSlug]);
  const handleBrowseProducts = (event) => {
    if (pageContent.primaryCta.path === "#products") {
      event.preventDefault();
      document.getElementById("products")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden border-b border-border/40 px-4 py-20 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.16),transparent_45%)]" />
        <div className="relative mx-auto max-w-4xl">
          {pageContent.heroEyebrow && <p className="mb-4 text-xs font-semibold uppercase tracking-[0.32em] text-primary">{pageContent.heroEyebrow}</p>}
          {pageContent.heroTitle && <h1 className="font-display text-4xl font-bold text-foreground sm:text-6xl">{pageContent.heroTitle}</h1>}
          {pageContent.heroSubtitle && <p className="mx-auto mt-5 max-w-2xl text-lg text-foreground/80">{pageContent.heroSubtitle}</p>}
          {pageContent.heroBody && <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">{pageContent.heroBody}</p>}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild className="bg-primary text-primary-foreground gap-2"><Link to={pageContent.primaryCta.path} onClick={handleBrowseProducts}><ShoppingBag className="w-4 h-4" /> {pageContent.primaryCta.label}</Link></Button>
            <Button asChild variant="outline"><Link to={pageContent.secondaryCta.path}>{pageContent.secondaryCta.label}</Link></Button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="products" className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-xl font-display font-bold text-foreground mb-6">{pageContent.categoriesTitle}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {pageContent.categories.map((cat, idx) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              className="group"
            >
              <div className="relative rounded-xl overflow-hidden aspect-square">
                <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-background/20" />
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-xs font-semibold text-foreground">{cat.name}</p>
                  <p className="text-[10px] text-muted-foreground">Preview category · {cat.count} items</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 pb-20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display font-bold text-foreground">{pageContent.featuredTitle}</h2>
          <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Product purchase coming soon</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {pageContent.featuredProducts.map((product, idx) => (
            <motion.div
              key={product.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="overflow-hidden bg-card/50 border-border/50">
                <div className="relative aspect-square overflow-hidden">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  <div className="absolute left-3 top-3 rounded-full bg-background/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground backdrop-blur-sm">
                    Preview only
                  </div>
                </div>
                <CardContent className="p-4">
                  {product.vendor && <p className="text-[10px] text-muted-foreground">{product.vendor}</p>}
                  <h3 className="text-sm font-semibold text-foreground mt-0.5">{product.name}</h3>
                  <div className="flex items-center justify-between mt-2">
                    {product.price && <span className="text-sm font-bold text-primary">{product.price}</span>}
                    {product.rating && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="w-3 h-3 text-primary fill-primary" /> {product.rating}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Vendor CTA */}
      <section className="py-16 px-4 border-t border-border/30">
        <div className="max-w-xl mx-auto text-center">
          <Store className="w-10 h-10 text-primary/50 mx-auto mb-4" />
          <h2 className="text-2xl font-display font-bold text-foreground mb-3">{pageContent.vendorTitle}</h2>
          <p className="text-sm text-muted-foreground mb-6">{pageContent.vendorBody}</p>
          <Button asChild className="bg-primary text-primary-foreground gap-2">
            <Link to={pageContent.vendorCta.path}><ShoppingBag className="w-4 h-4" /> {pageContent.vendorCta.label}</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}