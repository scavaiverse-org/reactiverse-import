import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { User, FileText, Cpu, Brain, Bell, Search, CreditCard, Puzzle, ArrowRight } from "lucide-react";
import AdminBreadcrumb from "@/components/admin/AdminBreadcrumb";
import StatusBadge from "@/components/admin/StatusBadge";

const SERVICES = [
  { key: "moa-auth_flow", label: "User & Identity Service", icon: User, path: "/platform/admin/services/identity", modules: ["Onboarding", "Ticketing", "Vendors"] },
  { key: "moa-media_links", label: "Content Management Service", icon: FileText, path: "/platform/admin/services/cms", modules: ["Exhibits", "Walkthrough", "AI Guide"] },
  { key: "moa-route_integrity", label: "Walkthrough Service", icon: Cpu, path: "/admin/tenant/walkthrough", modules: ["Onboarding", "Walkthrough", "Gamification"] },
  { key: "moa-analytics", label: "AI & Personalization Service", icon: Brain, path: "/platform/admin/services/ai-personalization", modules: ["AI Guide", "Analytics", "Recommendations"] },
  { key: "moa-admin_console", label: "Notification Service", icon: Bell, path: "/platform/admin/services/notifications", modules: ["Tickets", "Vendors", "Onboarding"] },
  { key: "moa-performance", label: "Search Service", icon: Search, path: "/platform/admin/services/search", modules: ["Exhibits", "Content", "Vendors"] },
  { key: "moa-commerce", label: "Payment & Billing Service", icon: CreditCard, path: "/platform/admin/services/payments", modules: ["Ticketing", "Commerce", "Vendors"] },
  { key: "moa-export", label: "Integration Service", icon: Puzzle, path: "/platform/admin/services/integrations", modules: ["Email", "Analytics", "External APIs"] },
];

export default function PlatformServices() {
  const { data: health = [] } = useQuery({ queryKey: ["ps-health"], queryFn: () => base44.entities.PlatformHealth.list() });

  const getHealth = (key) => health.find(h => h.service_key === key);

  return (
    <div className="min-h-screen bg-[#060c18] p-6 lg:p-8">
      <AdminBreadcrumb crumbs={[{ label: "Platform Services" }]} />

      <div className="mb-6">
        <p className="text-[10px] tracking-[0.3em] text-cyan-400 font-semibold mb-1">LAYER 4</p>
        <h1 className="text-2xl font-display font-bold text-foreground">Platform Service Layer</h1>
        <p className="text-sm text-muted-foreground mt-1">Core infrastructure services powering all museum modules and tenant experiences.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
          <p className="text-2xl font-display font-bold text-emerald-400">{health.filter(h => h.status === "operational").length}</p>
          <p className="text-xs text-muted-foreground">Services Operational</p>
        </div>
        <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
          <p className="text-2xl font-display font-bold text-amber-400">{health.filter(h => h.status === "degraded").length}</p>
          <p className="text-xs text-muted-foreground">Degraded</p>
        </div>
        <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
          <p className="text-2xl font-display font-bold text-red-400">{health.filter(h => h.status === "outage").length}</p>
          <p className="text-xs text-muted-foreground">Outages</p>
        </div>
      </div>

      {/* Service Cards */}
      <div className="grid lg:grid-cols-2 gap-4">
        {SERVICES.map(svc => {
          const h = getHealth(svc.key);
          return (
            <Link key={svc.key} to={svc.path}
              className="group bg-white/[0.03] border border-cyan-400/10 hover:border-cyan-400/25 rounded-xl p-5 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center">
                    <svc.icon className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{svc.label}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {svc.modules.map(m => (
                        <span key={m} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground">{m}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <StatusBadge status={h?.status || "operational"} />
              </div>

              {h && (
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/5 text-center">
                  <div>
                    <p className="text-xs font-mono text-foreground">{h.uptime_percent}%</p>
                    <p className="text-[9px] text-muted-foreground">Uptime</p>
                  </div>
                  <div>
                    <p className="text-xs font-mono text-foreground">{h.response_time_ms}ms</p>
                    <p className="text-[9px] text-muted-foreground">Response</p>
                  </div>
                  <div>
                    <p className={`text-xs font-mono ${h.error_count > 0 ? "text-amber-400" : "text-emerald-400"}`}>{h.error_count}</p>
                    <p className="text-[9px] text-muted-foreground">Errors</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end mt-3">
                <span className="text-[10px] text-cyan-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Configure <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}