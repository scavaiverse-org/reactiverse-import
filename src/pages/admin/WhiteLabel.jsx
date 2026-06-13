import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Palette, Globe, Type, Image, ShieldCheck, ArrowRight } from "lucide-react";
import AdminBreadcrumb from "@/components/admin/AdminBreadcrumb";
import StatusBadge from "@/components/admin/StatusBadge";

const BRAND_CHECKS = [
  { label: "Museum name configured", key: "name" },
  { label: "Tenant slug configured", key: "slug" },
  { label: "Regional ownership assigned", key: "region" },
  { label: "Custom theme available", key: "theme_config" },
  { label: "Launch readiness tracked", key: "launch_readiness" },
];

export default function WhiteLabel() {
  const { data: tenants = [] } = useQuery({
    queryKey: ["white-label-tenants"],
    queryFn: () => base44.entities.MuseumTenant.list()
  });

  return (
    <div className="min-h-screen bg-[#060c18] p-6 lg:p-8">
      <AdminBreadcrumb crumbs={[{ label: "White Label" }]} />

      <div className="mb-6">
        <p className="text-[10px] tracking-[0.3em] text-fuchsia-400 font-semibold mb-1">MULTI-TENANT BRANDING</p>
        <h1 className="text-2xl font-display font-bold text-foreground">White Label Control</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Manage museum-specific branding, domains, themes, and launch packaging for every tenant in the SCAVA ecosystem.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
          <Palette className="w-4 h-4 text-fuchsia-400 mb-3" />
          <p className="text-2xl font-display font-bold text-foreground">{tenants.length}</p>
          <p className="text-xs text-muted-foreground">Branded Tenants</p>
        </div>
        <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
          <Globe className="w-4 h-4 text-blue-400 mb-3" />
          <p className="text-2xl font-display font-bold text-blue-400">{tenants.filter(t => t.custom_domain).length}</p>
          <p className="text-xs text-muted-foreground">Custom Domains</p>
        </div>
        <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
          <ShieldCheck className="w-4 h-4 text-emerald-400 mb-3" />
          <p className="text-2xl font-display font-bold text-emerald-400">{tenants.filter(t => t.status === "live").length}</p>
          <p className="text-xs text-muted-foreground">Live Brands</p>
        </div>
        <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
          <Type className="w-4 h-4 text-primary mb-3" />
          <p className="text-2xl font-display font-bold text-primary">{tenants.filter(t => t.theme_config?.font).length}</p>
          <p className="text-xs text-muted-foreground">Theme Fonts</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {tenants.map((tenant) => {
          const checksComplete = BRAND_CHECKS.filter(c => tenant[c.key] !== undefined && tenant[c.key] !== null && tenant[c.key] !== "").length;
          const score = Math.round((checksComplete / BRAND_CHECKS.length) * 100);
          return (
            <div key={tenant.id} className="bg-white/[0.03] border border-fuchsia-400/10 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">{tenant.name}</p>
                  <p className="text-[10px] text-muted-foreground">{tenant.custom_domain || `${tenant.slug}.scaverse.io`}</p>
                </div>
                <StatusBadge status={tenant.status} />
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl border border-white/15 flex items-center justify-center"
                  style={{ background: tenant.theme_config?.primary_color || "rgba(255,255,255,0.04)" }}
                >
                  <Image className="w-4 h-4 text-white/80" />
                </div>
                <div>
                  <p className="text-xs text-foreground">{tenant.theme_config?.font || "Default Display"}</p>
                  <p className="text-[10px] text-muted-foreground">Primary: {tenant.theme_config?.primary_color || "Not configured"}</p>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] text-muted-foreground">Brand readiness</span>
                  <span className="text-[10px] text-fuchsia-400 font-mono">{score}%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-fuchsia-400/70" style={{ width: `${score}%` }} />
                </div>
              </div>

              <div className="space-y-1.5 mb-4">
                {BRAND_CHECKS.map(check => {
                  const done = tenant[check.key] !== undefined && tenant[check.key] !== null && tenant[check.key] !== "";
                  return (
                    <div key={check.key} className="flex items-center gap-2 text-xs">
                      <span className={`w-1.5 h-1.5 rounded-full ${done ? "bg-emerald-400" : "bg-white/20"}`} />
                      <span className={done ? "text-foreground/75" : "text-muted-foreground/40"}>{check.label}</span>
                    </div>
                  );
                })}
              </div>

              <Link to={`/platform/admin/tenants?tenantId=${tenant.id}`} className="inline-flex items-center gap-2 text-xs text-fuchsia-400 hover:text-fuchsia-300 transition-colors">
                Manage tenant settings <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}