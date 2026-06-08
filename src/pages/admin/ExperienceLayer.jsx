import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Layers, Map, Brain, Rocket, Gamepad2, Users, Calendar, ArrowRight, Eye, Settings } from "lucide-react";
import AdminBreadcrumb from "@/components/admin/AdminBreadcrumb";
import StatusBadge from "@/components/admin/StatusBadge";
import TenantSwitcher from "@/components/admin/TenantSwitcher";

const EXPERIENCE_COMPONENTS = [
  { key: "onboarding", label: "Onboarding Experience", icon: Rocket, path: "/admin/modules/onboarding" },
  { key: "ai_guide", label: "AI Guide & Assistant", icon: Brain, path: "/admin/modules/ai-guide" },
  { key: "walkthrough", label: "Virtual Walkthrough", icon: Map, path: "/admin/modules/walkthrough" },
  { key: "exhibits", label: "Interactive Exhibits", icon: Layers, path: "/admin/content/exhibits" },
  { key: "gamification", label: "Gamification", icon: Gamepad2, path: "/admin/modules/gamification" },
  { key: "events", label: "Events & Live Sessions", icon: Calendar, path: "/admin/modules/analytics" },
  { key: "community", label: "Community & Social", icon: Users, path: "/admin/users-access" },
];

const EXPERIENCE_MODES = [
  { key: "guided", label: "Guided Tour", desc: "AI-led narrative journey through exhibits", active: true },
  { key: "free", label: "Free Exploration", desc: "Self-directed museum walkthrough", active: true },
  { key: "learning", label: "Learning Mode", desc: "Structured educational content flow", active: true },
  { key: "challenge", label: "Challenge / Quest Mode", desc: "Gamified discovery challenges", active: false },
  { key: "event", label: "Event Mode", desc: "Live session and event experience", active: false },
];

export default function ExperienceLayer() {
  const { data: tenants = [] } = useQuery({ queryKey: ["el-tenants"], queryFn: () => base44.entities.MuseumTenant.list() });
  const [activeTenant, setActiveTenant] = useState(null);

  const selected = tenants.find(t => t.id === activeTenant) || tenants[0];

  return (
    <div className="min-h-screen bg-[#060c18] p-6 lg:p-8">
      <AdminBreadcrumb crumbs={[{ label: "Experience Layer" }]} />

      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[10px] tracking-[0.3em] text-violet-400 font-semibold mb-1">LAYER 2</p>
          <h1 className="text-2xl font-display font-bold text-foreground">Experience Layer</h1>
          <p className="text-sm text-muted-foreground mt-1">Control visitor experience components, modes, and flows per museum.</p>
        </div>
        <TenantSwitcher activeTenant={activeTenant} onChange={setActiveTenant} />
      </div>

      {selected && (
        <div className="bg-violet-400/5 border border-violet-400/20 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs text-violet-400 font-semibold">{selected.name}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{selected.region} · {selected.custom_domain}</p>
          </div>
          <StatusBadge status={selected.status} />
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Experience Components */}
        <div className="bg-white/[0.03] border border-violet-400/15 rounded-xl p-5">
          <p className="text-xs font-semibold text-foreground mb-4 flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-violet-400" />Experience Components
          </p>
          <div className="space-y-2">
            {EXPERIENCE_COMPONENTS.map(c => {
              const enabled = selected?.enabled_modules?.includes(c.key) ?? true;
              return (
                <div key={c.key} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/6">
                  <div className="flex items-center gap-2.5">
                    <c.icon className={`w-3.5 h-3.5 ${enabled ? "text-violet-400" : "text-muted-foreground/40"}`} />
                    <span className={`text-xs ${enabled ? "text-foreground" : "text-muted-foreground/50"}`}>{c.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={enabled ? "enabled" : "disabled"} />
                    <Link to={c.path} className="text-primary hover:text-primary/80">
                      <Settings className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Experience Modes */}
        <div className="bg-white/[0.03] border border-violet-400/15 rounded-xl p-5">
          <p className="text-xs font-semibold text-foreground mb-4 flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-violet-400" />Experience Modes
          </p>
          <div className="space-y-2">
            {EXPERIENCE_MODES.map(m => (
              <div key={m.key} className="p-3 rounded-lg bg-white/[0.02] border border-white/6">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-foreground">{m.label}</span>
                  <StatusBadge status={m.active ? "enabled" : "disabled"} />
                </div>
                <p className="text-[10px] text-muted-foreground">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Connected Modules */}
      <div className="bg-white/[0.02] border border-white/8 rounded-xl p-5">
        <p className="text-xs font-semibold text-foreground mb-3">Connected Modules</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {[
            { label: "Onboarding", path: "/admin/modules/onboarding" },
            { label: "AI Guide", path: "/admin/modules/ai-guide" },
            { label: "Walkthrough", path: "/admin/modules/walkthrough" },
            { label: "Exhibits", path: "/admin/content/exhibits" },
            { label: "Gamification", path: "/admin/modules/gamification" },
            { label: "Analytics", path: "/admin/modules/analytics" },
          ].map(l => (
            <Link key={l.path} to={l.path} className="group flex items-center justify-between p-2.5 rounded-lg border border-white/8 hover:bg-white/[0.05] transition-all">
              <span className="text-xs text-foreground">{l.label}</span>
              <ArrowRight className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}