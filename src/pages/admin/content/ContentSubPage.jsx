import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, Upload } from "lucide-react";
import AdminBreadcrumb from "@/components/admin/AdminBreadcrumb";
import StatusBadge from "@/components/admin/StatusBadge";
import TenantSwitcher from "@/components/admin/TenantSwitcher";
import ContentAssetDetailDialog from "@/components/admin/content/ContentAssetDetailDialog";

const PAGE_CONFIG = {
  exhibits: { title: "Exhibits", type: "exhibit", layer: "Content & Data" },
  "media-library": { title: "Media Library", type: "media", layer: "Content & Data" },
  animations: { title: "Animations", type: "animation", layer: "Content & Data" },
  scripts: { title: "Scripts & Audio", type: "script", layer: "Content & Data" },
  characters: { title: "Characters", type: "character", layer: "Content & Data" },
  stations: { title: "Stations", type: "station", layer: "Content & Data" },
  metadata: { title: "Metadata Tags", type: "metadata", layer: "Content & Data" },
  "version-control": { title: "Version Control", type: "version", layer: "Content & Data" },
};

export default function ContentSubPage() {
  const { pathname } = useLocation();
  const pageKey = pathname.split("/").pop();
  const config = PAGE_CONFIG[pageKey] || { title: "Content", type: "exhibit", layer: "Content & Data" };

  const { data: assets = [] } = useQuery({
    queryKey: ["content-sub", config.type],
    queryFn: () => base44.entities.ContentAsset.list()
  });
  const [activeTenant, setActiveTenant] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);

  const filtered = assets.filter(a => a.asset_type === config.type);
  const tenantFiltered = activeTenant ? filtered.filter(a => a.tenant_id === activeTenant) : filtered;

  return (
    <div className="min-h-screen bg-[#060c18] p-6 lg:p-8">
      <AdminBreadcrumb crumbs={[
        { label: "Content & Data", path: "/platform/admin/content-data" },
        { label: config.title }
      ]} />

      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[10px] tracking-[0.3em] text-emerald-400 font-semibold mb-1">{config.layer.toUpperCase()}</p>
          <h1 className="text-2xl font-display font-bold text-foreground">{config.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{tenantFiltered.length} asset{tenantFiltered.length !== 1 ? "s" : ""} across museum tenants.</p>
        </div>
        <div className="flex items-center gap-2">
          <TenantSwitcher activeTenant={activeTenant} onChange={setActiveTenant} />
        </div>
      </div>

      {tenantFiltered.length === 0 ? (
        <div className="bg-white/[0.02] border border-white/8 rounded-xl p-12 text-center">
          <Upload className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-1">No {config.title.toLowerCase()} assets yet</p>
          <p className="text-xs text-muted-foreground/60">Assets can be added by museum operators and content teams.</p>
          <div className="flex justify-center gap-2 mt-4">
            <Link to="/platform/admin/content-data" className="text-xs text-emerald-400 border border-emerald-400/30 px-3 py-1.5 rounded-lg hover:bg-emerald-400/10 transition-colors">
              ← Content Overview
            </Link>
            <Link to="/platform/admin/tenants" className="text-xs text-primary border border-primary/30 px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors">
              Manage Tenants
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white/[0.03] border border-white/8 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground border-b border-white/5 bg-white/[0.02]">
                  <th className="px-4 py-3 text-left font-medium">Title</th>
                  <th className="px-4 py-3 text-left font-medium">Tenant</th>
                  <th className="px-4 py-3 text-left font-medium">Version</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {tenantFiltered.map(a => (
                  <tr key={a.id} role="button" tabIndex={0} onClick={() => setSelectedAsset(a)} onKeyDown={(e) => { if (e.key === "Enter") setSelectedAsset(a); }} className="border-b border-white/5 last:border-0 hover:bg-white/[0.04] cursor-pointer transition-colors">
                    <td className="px-4 py-3 text-foreground">{a.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">{a.tenant_name || a.tenant_id}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono">v{a.version}</td>
                    <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex gap-3 mt-6">
        <Link to="/platform/admin/content-data" className="flex items-center gap-2 text-xs text-emerald-400 border border-emerald-400/30 px-4 py-2 rounded-lg hover:bg-emerald-400/10 transition-colors">
          ← Content Overview
        </Link>
        <Link to="/platform/admin/services/cms" className="flex items-center gap-2 text-xs text-cyan-400 border border-cyan-400/30 px-4 py-2 rounded-lg hover:bg-cyan-400/10 transition-colors">
          <ArrowRight className="w-3.5 h-3.5" />CMS Service
        </Link>
      </div>

      <ContentAssetDetailDialog asset={selectedAsset} open={!!selectedAsset} onClose={() => setSelectedAsset(null)} />
    </div>
  );
}