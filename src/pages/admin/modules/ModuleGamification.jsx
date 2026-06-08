import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Gamepad2, Trophy, Star, Target, Award, Gift, ArrowRight } from "lucide-react";
import AdminBreadcrumb from "@/components/admin/AdminBreadcrumb";
import StatusBadge from "@/components/admin/StatusBadge";
import TenantSwitcher from "@/components/admin/TenantSwitcher";
import GamificationElementModal from "@/components/admin/modules/GamificationElementModal";

const GAMIFICATION_ELEMENTS = [
  { label: "Quests", desc: "Guided discovery challenges", icon: Target, status: "unconfigured" },
  { label: "Badges", desc: "Achievement recognition", icon: Award, status: "unconfigured" },
  { label: "Leaderboards", desc: "Visitor ranking system", icon: Trophy, status: "unconfigured" },
  { label: "Rewards", desc: "Points & prize system", icon: Gift, status: "unconfigured" },
  { label: "Learning Achievements", desc: "Educational milestones", icon: Star, status: "unconfigured" },
  { label: "Completion Certificates", desc: "Course / tour completion", icon: Award, status: "unconfigured" },
  { label: "Member Rewards", desc: "Subscriber exclusive benefits", icon: Gift, status: "unconfigured" },
  { label: "Vendor Rewards", desc: "Vendor performance incentives", icon: Star, status: "unconfigured" },
];

export default function ModuleGamification() {
  const { data: tenants = [] } = useQuery({ queryKey: ["gam-tenants"], queryFn: () => base44.entities.MuseumTenant.list() });
  const [activeTenant, setActiveTenant] = useState(null);
  const [activeElement, setActiveElement] = useState(null);
  const selected = tenants.find(t => t.id === activeTenant) || tenants[0];
  const gamEnabled = selected?.enabled_modules?.includes("gamification") || false;

  return (
    <div className="min-h-screen bg-[#060c18] p-6 lg:p-8">
      <AdminBreadcrumb crumbs={[{ label: "Modules", path: "/admin/modules" }, { label: "Gamification" }]} />

      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[10px] tracking-[0.3em] text-red-400 font-semibold mb-1">MODULE 8</p>
          <h1 className="text-2xl font-display font-bold text-foreground">Gamification Module</h1>
          <p className="text-sm text-muted-foreground mt-1">Enable quests, badges, leaderboards, and rewards per museum. Optional — disable cleanly per tenant.</p>
        </div>
        <TenantSwitcher activeTenant={activeTenant} onChange={setActiveTenant} />
      </div>

      {selected && (
        <div className={`border rounded-xl p-4 mb-6 flex items-center justify-between ${gamEnabled ? "bg-emerald-400/5 border-emerald-400/20" : "bg-red-400/5 border-red-400/20"}`}>
          <div>
            <p className="text-xs font-semibold text-foreground">{selected.name}</p>
            <p className="text-[10px] text-muted-foreground">Gamification is {gamEnabled ? "ENABLED" : "DISABLED"} for this museum</p>
          </div>
          <StatusBadge status={gamEnabled ? "enabled" : "disabled"} />
        </div>
      )}

      {!gamEnabled && (
        <div className="bg-amber-400/5 border border-amber-400/20 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Gamepad2 className="w-4 h-4 text-amber-400" />
            <p className="text-xs font-semibold text-amber-400">Gamification Disabled</p>
          </div>
          <p className="text-xs text-muted-foreground">All public-facing gamification elements are hidden for this museum. Enable the module in the tenant configuration to activate.</p>
          <Link to="/admin/tenants" className="inline-flex items-center gap-1.5 text-xs text-amber-400 mt-2 hover:underline">
            Enable in Tenant Config <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* Elements */}
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        {GAMIFICATION_ELEMENTS.map(el => (
          <button
            key={el.label}
            type="button"
            onClick={() => setActiveElement(el)}
            className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-colors hover:border-red-400/40 ${gamEnabled ? "border-red-400/20 bg-red-400/5" : "border-white/6 bg-white/[0.02] opacity-60"}`}
          >
            <el.icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${gamEnabled ? "text-red-400" : "text-muted-foreground/40"}`} />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-foreground">{el.label}</p>
                <StatusBadge status={el.status} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">{el.desc}</p>
            </div>
          </button>
        ))}
      </div>

      <GamificationElementModal
        element={activeElement}
        tenant={selected}
        gamEnabled={gamEnabled}
        open={!!activeElement}
        onClose={() => setActiveElement(null)}
      />

      {/* Per-Tenant Status */}
      <div className="bg-white/[0.03] border border-white/8 rounded-xl p-5">
        <p className="text-xs font-semibold text-foreground mb-4">Gamification Status — All Tenants</p>
        <div className="space-y-2">
          {tenants.map(t => (
            <div key={t.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <div>
                <p className="text-xs text-foreground">{t.name}</p>
                <p className="text-[10px] text-muted-foreground">{t.region}</p>
              </div>
              <StatusBadge status={t.enabled_modules?.includes("gamification") ? "enabled" : "disabled"} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}