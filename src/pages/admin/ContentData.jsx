import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Image, Mic, User, Map, Tag, GitBranch, Milestone, Zap, ArrowRight } from "lucide-react";
import AdminBreadcrumb from "@/components/admin/AdminBreadcrumb";
import StatusBadge from "@/components/admin/StatusBadge";
import TenantSwitcher from "@/components/admin/TenantSwitcher";
import { calculateTenantReadiness } from "@/lib/readiness";

const CONTENT_SECTIONS = [
  { label: "Exhibits", icon: Milestone, path: "/platform/admin/content/exhibits", type: "exhibit" },
  { label: "Media Library", icon: Image, path: "/platform/admin/content/media-library", type: "media" },
  { label: "Animations", icon: Zap, path: "/platform/admin/content/animations", type: "animation" },
  { label: "Scripts & Audio", icon: Mic, path: "/platform/admin/content/scripts", type: "script" },
  { label: "Characters", icon: User, path: "/platform/admin/content/characters", type: "character" },
  { label: "Stations", icon: Map, path: "/platform/admin/content/stations", type: "station" },
  { label: "Metadata", icon: Tag, path: "/platform/admin/content/metadata", type: "metadata" },
  { label: "Version Control", icon: GitBranch, path: "/platform/admin/content/version-control", type: "version" },
];

export default function ContentData() {
  const { data: assets = [] } = useQuery({ queryKey: ["cd-assets"], queryFn: () => base44.entities.ContentAsset.list() });
  const { data: tenants = [] } = useQuery({ queryKey: ["cd-tenants"], queryFn: () => base44.entities.MuseumTenant.list() });
  const { data: moduleConfigs = [] } = useQuery({ queryKey: ["cd-module-configs"], queryFn: () => base44.entities.ModuleConfig.list() });
  const { data: experienceConfigs = [] } = useQuery({ queryKey: ["cd-experience-configs"], queryFn: () => base44.entities.ExperienceConfig.list() });
  const { data: tickets = [] } = useQuery({ queryKey: ["cd-tickets"], queryFn: () => base44.entities.Ticket.list() });
  const { data: vendors = [] } = useQuery({ queryKey: ["cd-vendors"], queryFn: () => base44.entities.Vendor.list() });
  const { data: events = [] } = useQuery({ queryKey: ["cd-events"], queryFn: () => base44.entities.AnalyticsEvent.list() });
  const [activeTenant, setActiveTenant] = useState(null);

  const countByType = (type) => assets.filter(a => a.asset_type === type).length;
  const publishedCount = assets.filter(a => a.status === "published").length;
  const draftCount = assets.filter(a => a.status === "draft").length;

  return (
    <div className="min-h-screen bg-[#060c18] p-6 lg:p-8">
      <AdminBreadcrumb crumbs={[{ label: "Content & Data" }]} />

      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[10px] tracking-[0.3em] text-emerald-400 font-semibold mb-1">LAYER 5</p>
          <h1 className="text-2xl font-display font-bold text-foreground">Content & Data Layer</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage all dynamic museum content — exhibits, media, scripts, characters, and cultural narratives per tenant.</p>
        </div>
        <TenantSwitcher activeTenant={activeTenant} onChange={setActiveTenant} />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
          <p className="text-2xl font-display font-bold text-primary">{assets.length}</p>
          <p className="text-xs text-muted-foreground">Total Assets</p>
        </div>
        <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
          <p className="text-2xl font-display font-bold text-emerald-400">{publishedCount}</p>
          <p className="text-xs text-muted-foreground">Published</p>
        </div>
        <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
          <p className="text-2xl font-display font-bold text-amber-400">{draftCount}</p>
          <p className="text-xs text-muted-foreground">Draft</p>
        </div>
        <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
          <p className="text-2xl font-display font-bold text-blue-400">{tenants.length}</p>
          <p className="text-xs text-muted-foreground">Tenants</p>
        </div>
      </div>

      {/* Content Sections */}
      <div className="grid lg:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {CONTENT_SECTIONS.map(s => (
          <Link key={s.path} to={s.path}
            className="group bg-white/[0.03] border border-emerald-400/10 hover:border-emerald-400/25 rounded-xl p-4 transition-all">
            <div className="flex items-center justify-between mb-3">
              <s.icon className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-mono text-muted-foreground">{countByType(s.type) || "—"}</span>
            </div>
            <p className="text-sm font-medium text-foreground">{s.label}</p>
            <div className="flex items-center gap-1 mt-2 text-[10px] text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
              Manage <ArrowRight className="w-3 h-3" />
            </div>
          </Link>
        ))}
      </div>

      {/* Per-Tenant Content Status */}
      <div className="bg-white/[0.03] border border-white/8 rounded-xl p-5">
        <p className="text-xs font-semibold text-foreground mb-4">Content Status by Tenant</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[500px]">
            <thead>
              <tr className="text-muted-foreground border-b border-white/5">
                <th className="pb-2 text-left font-medium">Museum</th>
                <th className="pb-2 text-left font-medium">Assets</th>
                <th className="pb-2 text-left font-medium">Published</th>
                <th className="pb-2 text-left font-medium">Content Ready</th>
                <th className="pb-2 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map(t => {
                const ta = assets.filter(a => a.tenant_id === t.id);
                const tp = ta.filter(a => a.status === "published").length;
                const readiness = calculateTenantReadiness({
                  tenant: t,
                  moduleConfigs: moduleConfigs.filter(cfg => cfg.tenant_id === t.id),
                  experienceConfig: experienceConfigs.find(cfg => cfg.tenant_id === t.id),
                  assets,
                  tickets,
                  vendors,
                  events,
                }).percentage;
                return (
                  <tr key={t.id} className="border-b border-white/5 last:border-0">
                    <td className="py-2.5 text-foreground">{t.name}</td>
                    <td className="py-2.5 text-muted-foreground">{ta.length}</td>
                    <td className="py-2.5 text-emerald-400">{tp}</td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-400/60 rounded-full" style={{ width: `${readiness}%` }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{readiness}%</span>
                      </div>
                    </td>
                    <td className="py-2.5"><StatusBadge status={t.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}