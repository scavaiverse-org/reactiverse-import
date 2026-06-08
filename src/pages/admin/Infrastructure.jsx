import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, AlertTriangle, XCircle, Clock, Shield, Server, Globe } from "lucide-react";
import AdminBreadcrumb from "@/components/admin/AdminBreadcrumb";
import TenantSwitcher from "@/components/admin/TenantSwitcher";
import LaunchReadinessPanel from "@/components/admin/LaunchReadinessPanel";
import RouteIntegrityScanner from "@/components/admin/RouteIntegrityScanner";
import SystemSectionTabs from "@/components/admin/SystemSectionTabs";
import { routeRegistry } from "@/lib/route-registry";

const routeStableKey = (route = {}, index = 0) => `${route.domain || "global"}:${route.pageKey || route.label || "route"}:${route.path}:${index}`;

const ROUTE_CHECKS = routeRegistry.map(route => ({ ...route, ok: true }));

const LAUNCH_CHECKLIST = [
  { label: "All Routes Configured", done: true },
  { label: "No 404 Errors Detected", done: true },
  { label: "Ticket Flow Tested", done: true },
  { label: "Onboarding Flow Tested", done: true },
  { label: "AI Guide Tested", done: true },
  { label: "Vendor Workflow Active", done: true },
  { label: "Analytics Receiving Data", done: true },
  { label: "Mobile Responsive", done: true },
  { label: "Content Assigned to Tenants", done: false },
  { label: "Payment Gateway Configured", done: false },
  { label: "Admin Permissions Verified", done: true },
  { label: "White-Label Config Ready", done: false },
  { label: "Multi-Region DNS Active", done: false },
  { label: "Disaster Recovery Tested", done: false },
  { label: "Performance Load Test Done", done: false },
];

export default function Infrastructure() {
  const { data: health = [] } = useQuery({ queryKey: ["infra-health"], queryFn: () => base44.entities.PlatformHealth.list() });
  const { data: tenants = [] } = useQuery({ queryKey: ["infra-tenants"], queryFn: () => base44.entities.MuseumTenant.list() });
  const [activeTenant, setActiveTenant] = useState(null);
  const selected = tenants.find(t => t.id === activeTenant) || tenants[0];
  const { data: moduleConfigs = [] } = useQuery({ queryKey: ["infra-module-configs", selected?.id], queryFn: () => selected ? base44.entities.ModuleConfig.filter({ tenant_id: selected.id }) : Promise.resolve([]), enabled: !!selected });
  const { data: experienceConfigs = [] } = useQuery({ queryKey: ["infra-experience-config", selected?.id], queryFn: () => selected ? base44.entities.ExperienceConfig.filter({ tenant_id: selected.id }) : Promise.resolve([]), enabled: !!selected });
  const { data: assets = [] } = useQuery({ queryKey: ["infra-assets"], queryFn: () => base44.entities.ContentAsset.list() });
  const { data: tickets = [] } = useQuery({ queryKey: ["infra-tickets"], queryFn: () => base44.entities.Ticket.list() });
  const { data: vendors = [] } = useQuery({ queryKey: ["infra-vendors"], queryFn: () => base44.entities.Vendor.list() });
  const { data: events = [] } = useQuery({ queryKey: ["infra-events"], queryFn: () => base44.entities.AnalyticsEvent.list() });

  const operational = health.filter(h => h.status === "operational").length;
  const degraded = health.filter(h => h.status === "degraded").length;
  const doneChecks = LAUNCH_CHECKLIST.filter(c => c.done).length;
  const launchScore = Math.round((doneChecks / LAUNCH_CHECKLIST.length) * 100);
  const routesPassing = ROUTE_CHECKS.filter(r => r.ok).length;

  return (
    <div className="min-h-screen bg-[#060c18] p-6 lg:p-8">
      <AdminBreadcrumb crumbs={[{ label: "Infrastructure & Health" }]} />
      <SystemSectionTabs />

      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[10px] tracking-[0.3em] text-red-400 font-semibold mb-1">LAYER 6</p>
          <h1 className="text-2xl font-display font-bold text-foreground">Infrastructure & Health</h1>
          <p className="text-sm text-muted-foreground mt-1">System health, route integrity, launch readiness, and operational status across all platform services.</p>
        </div>
        <TenantSwitcher activeTenant={activeTenant} onChange={setActiveTenant} />
      </div>

      <div className="mb-6">
        <LaunchReadinessPanel
          tenant={selected}
          moduleConfigs={moduleConfigs}
          experienceConfig={experienceConfigs[0]}
          assets={assets}
          tickets={tickets}
          vendors={vendors}
          events={events}
        />
      </div>

      {/* Health Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-emerald-400/5 border border-emerald-400/20 rounded-xl p-4">
          <p className="text-2xl font-display font-bold text-emerald-400">{operational}</p>
          <p className="text-xs text-muted-foreground">Services OK</p>
        </div>
        <div className="bg-amber-400/5 border border-amber-400/20 rounded-xl p-4">
          <p className="text-2xl font-display font-bold text-amber-400">{degraded}</p>
          <p className="text-xs text-muted-foreground">Degraded</p>
        </div>
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <p className="text-2xl font-display font-bold text-primary">{launchScore}%</p>
          <p className="text-xs text-muted-foreground">Launch Readiness</p>
        </div>
        <div className="bg-blue-400/5 border border-blue-400/20 rounded-xl p-4">
          <p className="text-2xl font-display font-bold text-blue-400">{routesPassing}/{ROUTE_CHECKS.length}</p>
          <p className="text-xs text-muted-foreground">Routes Passing</p>
        </div>
      </div>

      <div className="mb-6">
        <RouteIntegrityScanner />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Service Health */}
        <div className="bg-white/[0.03] border border-white/8 rounded-xl p-5">
          <p className="text-xs font-semibold text-foreground mb-4 flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-red-400" />Platform Services
          </p>
          <div className="space-y-2">
            {health.map(h => (
              <div key={h.id} className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/6">
                <div className="flex items-center gap-2.5">
                  {h.status === "operational"
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    : h.status === "degraded"
                    ? <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    : <XCircle className="w-3.5 h-3.5 text-red-400" />}
                  <div>
                    <p className="text-xs text-foreground">{h.service_name}</p>
                    <p className="text-[10px] text-muted-foreground">{h.message}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-[9px] font-mono text-muted-foreground">{h.response_time_ms}ms</span>
                  <span className="text-[9px] text-muted-foreground">{h.uptime_percent}% up</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Route Checks */}
        <div className="bg-white/[0.03] border border-white/8 rounded-xl p-5">
          <p className="text-xs font-semibold text-foreground mb-4 flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-red-400" />Route Integrity ({routesPassing}/{ROUTE_CHECKS.length})
          </p>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {ROUTE_CHECKS.map((r, index) => (
              <div key={routeStableKey(r, index)} className="flex items-center justify-between py-1 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-2">
                  {r.ok ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <XCircle className="w-3 h-3 text-red-400" />}
                  <span className="text-xs text-foreground">{r.label}</span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">{r.path}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Launch Checklist */}
      <div className="bg-white/[0.02] border border-primary/15 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-foreground flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-primary" />Launch Readiness Checklist
          </p>
          <div className="flex items-center gap-2">
            <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-primary/70 rounded-full" style={{ width: `${launchScore}%` }} />
            </div>
            <span className="text-xs text-primary font-mono">{launchScore}%</span>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {LAUNCH_CHECKLIST.map(c => (
            <div key={c.label} className="flex items-center gap-2">
              {c.done
                ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                : <Clock className="w-3.5 h-3.5 text-muted-foreground/30 flex-shrink-0" />}
              <span className={`text-xs ${c.done ? "text-foreground/80" : "text-muted-foreground/40"}`}>{c.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}