import TenantVideoHero from "@/components/tenant/TenantVideoHero";

const previewTenant = (tenant, draft) => ({
  ...tenant,
  name: draft.museumName || tenant?.name,
  logo_url: draft.logoUrl || tenant?.logo_url,
  theme_config: { ...(tenant?.theme_config || {}), tenant_badge: draft.tenantBadge || "Tenant Platform" },
});

export default function TenantHomePreview({ tenant, draft }) {
  const safeTenant = previewTenant(tenant, draft);
  return (
    <section className="rounded-3xl border border-primary/20 bg-primary/[0.04] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Draft/admin preview</p>
          <p className="text-xs text-muted-foreground">This preview does not publish changes.</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] text-muted-foreground">desktop + mobile responsive</span>
      </div>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-background">
        <div className="scale-[0.82] origin-top-left w-[122%] max-h-[620px] overflow-hidden">
          <TenantVideoHero
            tenant={safeTenant}
            eyebrow={draft.heroEyebrow}
            title={draft.heroTitle}
            body={draft.heroDescription}
            mediaUrl={draft.heroMediaUrl}
            cardMediaUrl={draft.cardMediaUrl}
            cardLabel={draft.cardLabel}
            cardTitle={draft.cardTitle}
            cardDescription={draft.cardDescription}
            primaryLabel={draft.primaryCtaLabel}
            secondaryLabel={draft.secondaryCtaLabel}
            onPrimary={() => {}}
            onSecondary={() => {}}
            showActions
          />
        </div>
      </div>
    </section>
  );
}