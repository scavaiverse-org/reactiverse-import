import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Rocket, Ticket, Brain, Map, Store, ShoppingBag, BarChart3, Gamepad2,
  Eye, CheckCircle2
} from "lucide-react";
import AdminBreadcrumb from "@/components/admin/AdminBreadcrumb";
import StatusBadge from "@/components/admin/StatusBadge";
import TenantSwitcher from "@/components/admin/TenantSwitcher";

const MODULE_META = {
  onboarding: { label: "Onboarding", icon: Rocket, path: "/admin/modules/onboarding", color: "text-primary border-primary/25 bg-primary/5" },
  ticketing: { label: "Ticketing", icon: Ticket, path: "/admin/modules/ticketing", color: "text-blue-400 border-blue-400/25 bg-blue-400/5" },
  ai_guide: { label: "AI Guide", icon: Brain, path: "/admin/modules/ai-guide", color: "text-violet-400 border-violet-400/25 bg-violet-400/5" },
  walkthrough: { label: "Walkthrough", icon: Map, path: "/admin/modules/walkthrough", color: "text-cyan-400 border-cyan-400/25 bg-cyan-400/5" },
  vendors: { label: "Vendors", icon: Store, path: "/admin/modules/vendors", color: "text-amber-400 border-amber-400/25 bg-amber-400/5" },
  commerce: { label: "Commerce", icon: ShoppingBag, path: "/admin/modules/commerce", color: "text-emerald-400 border-emerald-400/25 bg-emerald-400/5" },
  analytics: { label: "Analytics", icon: BarChart3, path: "/admin/modules/analytics", color: "text-pink-400 border-pink-400/25 bg-pink-400/5" },
  gamification: { label: "Gamification", icon: Gamepad2, path: "/admin/modules/gamification", color: "text-red-400 border-red-400/25 bg-red-400/5" },
};

export default function ModulesOverview() {
  const { data: tenants = [] } = useQuery({ queryKey: ["mod-tenants"], queryFn: () => base44.entities.MuseumTenant.list() });
  const { data: moduleConfigs = [] } = useQuery({ queryKey: ["mod-configs"], queryFn: () => base44.entities.ModuleConfig.list() });
  const [activeTenant, setActiveTenant] = useState(null);
  const selected = tenants.find(t => t.id === activeTenant) || tenants[0];
  const tenantModuleConfigs = moduleConfigs.filter((cfg) => cfg.tenant_id === selected?.id);

  return (
    <div className="min-h-screen bg-[#060c18] p-6 lg:p-8">
      <AdminBreadcrumb crumbs={[{ label: "Business Modules" }]} />

      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[10px] tracking-[0.3em] text-primary font-semibold mb-1">LAYER 3</p>
          <h1 className="text-2xl font-display font-bold text-foreground">Business Modules</h1>
          <p className="text-sm text-muted-foreground mt-1">Plug-and-play module management. Enable or disable per museum tenant.</p>
        </div>
        <TenantSwitcher activeTenant={activeTenant} onChange={setActiveTenant} />
      </div>

      {selected && (
        <div className="bg-primary/5 border border-primary/15 rounded-xl p-3 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-xs text-primary font-medium">{selected.name}</p>
            <span className="text-[10px] text-muted-foreground">— {selected.enabled_modules?.length || 0}/8 modules enabled</span>
          </div>
          <StatusBadge status={selected.status} />
        </div>
      )}

      {/* Tenant Module Matrix */}
      {tenants.length > 0 && (
        <div className="bg-white/[0.02] border border-white/8 rounded-xl p-5 mb-6 overflow-x-auto">
          <p className="text-xs font-semibold text-foreground mb-4">Module Matrix — All Tenants</p>
          <table className="w-full text-xs min-w-[600px]">
            <thead>
              <tr className="text-muted-foreground">
                <th className="text-left pb-3 font-medium">Museum</th>
                {Object.values(MODULE_META).map(m => (
                  <th key={m.label} className="pb-3 font-medium text-center">
                    <m.icon className="w-3.5 h-3.5 mx-auto mb-0.5" />
                    <span className="text-[9px]">{m.label}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tenants.map(t => (
                <tr key={t.id} className="border-t border-white/5">
                  <td className="py-2.5 text-foreground font-medium pr-4">{t.name}</td>
                  {Object.keys(MODULE_META).map(key => {
                    const en = t.enabled_modules?.includes(key);
                    return (
                      <td key={key} className="py-2.5 text-center">
                        {en ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mx-auto" /> : <div className="w-3.5 h-3.5 rounded-full border border-white/10 mx-auto" />}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Module Cards */}
      <div className="grid lg:grid-cols-2 xl:grid-cols-4 gap-4">
        {Object.entries(MODULE_META).map(([key, meta], i) => {
          const config = tenantModuleConfigs.find((cfg) => cfg.module_key === key);
          const enabled = selected?.enabled_modules?.includes(key) ?? config?.enabled ?? true;
          const health = enabled ? (config?.status || "unconfigured") : "disabled";
          const content = config?.content_readiness ?? 0;
          const completeness = config?.config_completeness ?? 0;
          const records = config?.record_count ?? 0;
          return (
            <motion.div key={key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className={`border rounded-xl p-4 ${meta.color} ${!enabled ? "opacity-50" : ""}`}>
              <div className="flex items-start justify-between mb-3">
                <meta.icon className="w-5 h-5" />
                <StatusBadge status={health} />
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">{meta.label}</p>
              <p className="text-[10px] text-muted-foreground mb-3">{config ? `${records.toLocaleString()} records` : "No saved config yet"}</p>

              <div className="space-y-1.5 mb-4">
                <div>
                  <div className="flex justify-between text-[9px] text-muted-foreground mb-0.5">
                    <span>Content</span><span>{content}%</span>
                  </div>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-current opacity-60" style={{ width: `${content}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[9px] text-muted-foreground mb-0.5">
                    <span>Config</span><span>{completeness}%</span>
                  </div>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-current opacity-40" style={{ width: `${completeness}%` }} />
                  </div>
                </div>
              </div>

              <div className="flex gap-1.5">
                <Link to={meta.path} className="flex-1 text-center text-[10px] py-1 rounded border border-current bg-white/5 hover:bg-white/10 transition-colors">
                  Configure
                </Link>
                <Link to={meta.path} className="px-2 py-1 rounded border border-current bg-white/5 hover:bg-white/10 transition-colors">
                  <Eye className="w-3 h-3" />
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}