import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { DEFAULT_MUSEUM_SLUG, museumPath } from "@/lib/domain-registry";
import {
  Building2, Users, Package, Server, Database, Activity, Palette,
  Ticket, Store, Brain, Map, BarChart3, Gamepad2, ShoppingBag,
  Rocket, AlertTriangle, CheckCircle2, Globe,
  ArrowRight, Layers, Zap, Receipt
} from "lucide-react";
import StatusBadge from "@/components/admin/StatusBadge";
import LaunchReadinessPanel from "@/components/admin/LaunchReadinessPanel";
import AdminPanelTabGuidesDownload from "@/components/admin/AdminPanelTabGuidesDownload";
import { calculateTenantReadiness } from "@/lib/readiness";

const MODULES = [
  { key: "onboarding", label: "Onboarding", icon: Rocket, path: "/platform/admin/modules/onboarding" },
  { key: "ticketing", label: "Ticketing", icon: Ticket, path: "/platform/admin/modules/ticketing" },
  { key: "ai_guide", label: "AI Guide", icon: Brain, path: "/platform/admin/modules/ai-guide" },
  { key: "walkthrough", label: "Walkthrough", icon: Map, path: "/platform/admin/modules/walkthrough" },
  { key: "vendors", label: "Vendors", icon: Store, path: "/platform/admin/modules/vendors" },
  { key: "commerce", label: "Commerce", icon: ShoppingBag, path: "/platform/admin/modules/commerce" },
  { key: "analytics", label: "Analytics", icon: BarChart3, path: "/platform/admin/modules/analytics" },
  { key: "gamification", label: "Gamification", icon: Gamepad2, path: "/platform/admin/modules/gamification" },
];

const LAYERS = [
  { label: "Users & Access", path: "/platform/admin/users-access", icon: Users, color: "text-blue-400 border-blue-400/30 bg-blue-400/5" },
  { label: "Experience Layer", path: "/platform/admin/experience-layer", icon: Layers, color: "text-violet-400 border-violet-400/30 bg-violet-400/5" },
  { label: "Business Modules", path: "/platform/admin/modules", icon: Package, color: "text-primary border-primary/30 bg-primary/5" },
  { label: "Platform Services", path: "/platform/admin/platform-services", icon: Server, color: "text-cyan-400 border-cyan-400/30 bg-cyan-400/5" },
  { label: "Content & Data", path: "/platform/admin/content-data", icon: Database, color: "text-emerald-400 border-emerald-400/30 bg-emerald-400/5" },
  { label: "Infrastructure", path: "/platform/admin/infrastructure", icon: Activity, color: "text-red-400 border-red-400/30 bg-red-400/5" },
  { label: "Museum Tenants", path: "/platform/admin/tenants", icon: Building2, color: "text-amber-400 border-amber-400/30 bg-amber-400/5" },
  { label: "White Label", path: "/platform/admin/white-label", icon: Palette, color: "text-pink-400 border-pink-400/30 bg-pink-400/5" },
];

export default function MasterDashboard() {
  const { data: tenants = [] } = useQuery({ queryKey: ["master-tenants"], queryFn: () => base44.entities.MuseumTenant.list() });
  const { data: tickets = [] } = useQuery({ queryKey: ["master-tickets"], queryFn: () => base44.entities.Ticket.list() });
  const { data: vendors = [] } = useQuery({ queryKey: ["master-vendors"], queryFn: () => base44.entities.Vendor.list() });
  const { data: health = [] } = useQuery({ queryKey: ["master-health"], queryFn: () => base44.entities.PlatformHealth.list() });
  const { data: moduleConfigs = [] } = useQuery({ queryKey: ["master-module-configs"], queryFn: () => base44.entities.ModuleConfig.list() });
  const { data: experienceConfigs = [] } = useQuery({ queryKey: ["master-experience-configs"], queryFn: () => base44.entities.ExperienceConfig.list() });
  const { data: assets = [] } = useQuery({ queryKey: ["master-assets"], queryFn: () => base44.entities.ContentAsset.list() });
  const { data: events = [] } = useQuery({ queryKey: ["master-events"], queryFn: () => base44.entities.AnalyticsEvent.list() });
  const { data: paymentProofs = [] } = useQuery({ queryKey: ["master-payment-proofs"], queryFn: () => base44.entities.PaymentProof.list("-created_at", 500), initialData: [] });

  const pendingProofs = paymentProofs.filter(p => p.status === "pending").length;
  const liveTenants = tenants.filter(t => t.status === "live").length;
  const stagingTenants = tenants.filter(t => t.status === "staging").length;
  const revenue = tickets.reduce((s, t) => s + (t.total_price || 0), 0);
  const pendingVendors = vendors.filter(v => v.status === "pending").length;
  const healthIssues = health.filter(h => h.status !== "operational").length;
  const readinessByTenant = tenants.reduce((map, tenant) => {
    map[tenant.id] = calculateTenantReadiness({
      tenant,
      moduleConfigs: moduleConfigs.filter(cfg => cfg.tenant_id === tenant.id),
      experienceConfig: experienceConfigs.find(cfg => cfg.tenant_id === tenant.id),
      assets,
      tickets,
      vendors,
      events,
    });
    return map;
  }, {});

  return (
    <div className="min-h-screen bg-[#060c18] text-foreground p-6 lg:p-8">
    {/* Header */}
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] tracking-[0.3em] text-primary font-semibold">AOM PLATFORM DASHBOARD</span>
            <span className="text-[9px] text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">DATA-BACKED VIEW</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">AOM Platform Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage platform pages, museum tenants, tickets, media, vendors, analytics, and publishing.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AdminPanelTabGuidesDownload />
          <Link to={museumPath(DEFAULT_MUSEUM_SLUG, "home")} className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground">
            <Globe className="w-3.5 h-3.5" /> View Homepage
          </Link>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-8">
        {[
          { label: "Live Museums", value: liveTenants, sub: `${stagingTenants} staging`, color: "text-emerald-400", icon: Globe },
          { label: "Total Tenants", value: tenants.length, sub: "Across all regions", color: "text-primary", icon: Building2 },
          { label: "Tickets Sold", value: tickets.length, sub: `SGD ${revenue.toLocaleString()}`, color: "text-blue-400", icon: Ticket },
          { label: "Vendors", value: vendors.length, sub: `${pendingVendors} pending`, color: "text-amber-400", icon: Store },
          { label: "System Alerts", value: healthIssues, sub: healthIssues === 0 ? "All systems go" : "Needs attention", color: healthIssues > 0 ? "text-red-400" : "text-emerald-400", icon: Activity },
        ].map((k) => (
          <div key={k.label} className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
            <k.icon className={`w-4 h-4 ${k.color} mb-2`} />
            <p className={`text-2xl font-display font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-foreground/80 mt-0.5">{k.label}</p>
            <p className="text-[10px] text-muted-foreground">{k.sub}</p>
          </div>
        ))}
        {/* Pre-sale (UEN) — stat + shortcut to the payment proofs tab */}
        <Link to="/platform/admin/uen" className="group bg-white/[0.03] border border-white/8 rounded-xl p-4 transition-all hover:border-amber-400/40 hover:bg-amber-400/[0.04]">
          <Receipt className={`w-4 h-4 mb-2 ${pendingProofs > 0 ? "text-amber-400" : "text-primary"}`} />
          <p className={`text-2xl font-display font-bold ${pendingProofs > 0 ? "text-amber-400" : "text-primary"}`}>{paymentProofs.length}</p>
          <p className="text-xs text-foreground/80 mt-0.5">Pre-sale (UEN)</p>
          <p className="text-[10px] text-muted-foreground">{pendingProofs > 0 ? `${pendingProofs} pending review` : "All reviewed"}</p>
        </Link>
      </div>

      {/* Architecture Layers Grid */}
      <div className="mb-8">
        <p className="text-[10px] tracking-[0.25em] text-muted-foreground font-semibold mb-3">ARCHITECTURE LAYERS</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {LAYERS.map((layer) => (
            <Link key={layer.path} to={layer.path}
              className={`group flex items-center justify-between p-4 rounded-xl border ${layer.color} transition-all hover:scale-[1.01]`}>
              <div className="flex items-center gap-2.5">
                <layer.icon className="w-4 h-4" />
                <span className="text-xs font-medium text-foreground">{layer.label}</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </div>
      </div>

      {/* Museum Tenants */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] tracking-[0.25em] text-muted-foreground font-semibold">MUSEUM TENANTS</p>
          <Link to="/platform/admin/tenants" className="text-xs text-primary hover:underline flex items-center gap-1">
            Manage All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid lg:grid-cols-2 gap-3">
          {tenants.map((tenant) => (
            <div key={tenant.id} className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{tenant.name}</p>
                  <p className="text-xs text-muted-foreground">{tenant.region} · {tenant.custom_domain}</p>
                </div>
                <StatusBadge status={tenant.status} />
              </div>
              {/* Module Pills */}
              <div className="flex flex-wrap gap-1 mb-3">
                {MODULES.map(m => {
                  const enabled = tenant.enabled_modules?.includes(m.key);
                  return (
                    <span key={m.key} className={`text-[9px] px-2 py-0.5 rounded-full border font-medium ${enabled ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/5" : "text-slate-600 border-slate-600/20 bg-transparent"}`}>
                      {m.label}
                    </span>
                  );
                })}
              </div>
              {/* Launch readiness */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-muted-foreground">Launch Readiness</span>
                  <span className="text-[10px] text-primary">{readinessByTenant[tenant.id]?.percentage || 0}%</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-primary/70" style={{ width: `${readinessByTenant[tenant.id]?.percentage || 0}%` }} />
                </div>
                <Link to={`/platform/admin/tenants?tenantId=${tenant.id}`} className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  Manage tenant settings <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modules + Health Row */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Module Status */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] tracking-[0.25em] text-muted-foreground font-semibold">BUSINESS MODULES</p>
            <Link to="/platform/admin/modules" className="text-xs text-primary hover:underline">View All</Link>
          </div>
          <div className="space-y-2">
            {MODULES.map(m => {
              const configuredCount = moduleConfigs.filter(cfg => cfg.module_key === m.key).length;
              const status = configuredCount > 0 ? `${configuredCount} configured` : "Needs config";
              return (
                <Link key={m.key} to={m.path}
                  className="group flex items-center justify-between bg-white/[0.02] border border-white/6 rounded-lg px-3 py-2 hover:bg-white/[0.05] transition-all">
                  <div className="flex items-center gap-2.5">
                    <m.icon className="w-3.5 h-3.5 text-primary/60" />
                    <span className="text-xs text-foreground">{m.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={configuredCount > 0 ? "text-[9px] text-emerald-400" : "text-[9px] text-amber-400"}>{status}</span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Platform Health */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] tracking-[0.25em] text-muted-foreground font-semibold">PLATFORM HEALTH</p>
            <Link to="/platform/admin/infrastructure" className="text-xs text-primary hover:underline">Full Report</Link>
          </div>
          <div className="space-y-2">
            {health.map(h => (
              <div key={h.id} className="flex items-center justify-between bg-white/[0.02] border border-white/6 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2.5">
                  {h.status === "operational"
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    : h.status === "degraded"
                    ? <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    : <Zap className="w-3.5 h-3.5 text-red-400" />
                  }
                  <span className="text-xs text-foreground">{h.service_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-muted-foreground">{h.response_time_ms}ms</span>
                  <StatusBadge status={h.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Launch Readiness Checker */}
      <LaunchReadinessPanel
        tenant={tenants[0]}
        moduleConfigs={moduleConfigs.filter(cfg => cfg.tenant_id === tenants[0]?.id)}
        experienceConfig={experienceConfigs.find(cfg => cfg.tenant_id === tenants[0]?.id)}
        assets={assets}
        tickets={tickets}
        vendors={vendors}
        events={events}
      />
    </div>
  );
}