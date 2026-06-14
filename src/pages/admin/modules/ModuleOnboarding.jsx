import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { ArrowRight, Users } from "lucide-react";
import AdminBreadcrumb from "@/components/admin/AdminBreadcrumb";
import StatusBadge from "@/components/admin/StatusBadge";
import TenantSwitcher from "@/components/admin/TenantSwitcher";
import ConfigEditor from "@/components/admin/ConfigEditor";

const ONBOARDING_STEPS = [
  { step: 1, label: "Welcome Screen", desc: "Museum introduction & branding", configured: true },
  { step: 2, label: "User Type Selection", desc: "Visitor / Student / Researcher / Member", configured: true },
  { step: 3, label: "Profile Setup", desc: "Name, preferences, language", configured: true },
  { step: 4, label: "Interest Selection", desc: "Cultural topics, art forms, history", configured: true },
  { step: 5, label: "Museum Introduction", desc: "Cinematic intro to the museum", configured: true },
  { step: 6, label: "CTA & Access Route", desc: "Ticket, walkthrough, or guide entry", configured: false },
];

export default function ModuleOnboarding() {
  const { data: tenants = [] } = useQuery({ queryKey: ["ob-tenants"], queryFn: () => base44.entities.MuseumTenant.list() });
  const { data: progress = [] } = useQuery({ queryKey: ["ob-progress"], queryFn: () => base44.entities.OnboardingProgress.list() });
  const [activeTenant, setActiveTenant] = useState(null);
  const selected = tenants.find(t => t.id === activeTenant) || tenants[0];

  const { data: experienceConfigs = [] } = useQuery({
    queryKey: ["ob-experience-config", selected?.id],
    queryFn: () => base44.entities.ExperienceConfig.filter({ tenant_id: selected.id }),
    enabled: !!selected?.id,
  });
  const savedOnboardingConfig = [...experienceConfigs].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0]?.onboarding_config || {};
  const step6Configured = Boolean(savedOnboardingConfig.cta_label?.trim() && savedOnboardingConfig.completion_route?.trim());

  const completedCount = progress.filter(p => p.stage === "completed").length;

  return (
    <div className="min-h-screen bg-[#060c18] p-6 lg:p-8">
      <AdminBreadcrumb crumbs={[{ label: "Modules", path: "/admin/modules" }, { label: "Onboarding" }]} />

      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[10px] tracking-[0.3em] text-primary font-semibold mb-1">MODULE 1</p>
          <h1 className="text-2xl font-display font-bold text-foreground">Onboarding Module</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure welcome flows, user type selection, and entry journeys per museum tenant.</p>
        </div>
        <TenantSwitcher activeTenant={activeTenant} onChange={setActiveTenant} />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
          <p className="text-2xl font-display font-bold text-primary">{progress.length}</p>
          <p className="text-xs text-muted-foreground">Total Started</p>
        </div>
        <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
          <p className="text-2xl font-display font-bold text-emerald-400">{completedCount}</p>
          <p className="text-xs text-muted-foreground">Completed</p>
        </div>
        <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
          <p className="text-2xl font-display font-bold text-amber-400">{progress.length > 0 ? Math.round((completedCount / progress.length) * 100) : 0}%</p>
          <p className="text-xs text-muted-foreground">Completion Rate</p>
        </div>
      </div>

      <div className="mb-6">
        <ConfigEditor
          tenant={selected}
          configType="experience"
          fieldKey="onboarding_config"
          title={`Onboarding Config${selected ? ` — ${selected.name}` : ""}`}
          description="Saved to ExperienceConfig and used by the public onboarding flow."
          defaultValue={{
            welcome_message: selected ? `Welcome to ${selected.name}` : "Welcome to the museum",
            ai_greeting: selected ? `Hi! I'm ARIA, your cultural guide for ${selected.name}.` : "Hi! I'm ARIA, your cultural guide.",
            completion_route: "/tickets",
            cta_label: "Begin Your Journey",
            background_url: "",
            steps: ONBOARDING_STEPS.map(s => s.label)
          }}
        >
          {({ draft, setDraft }) => (
            <div className="grid lg:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Welcome Message</label>
                <input value={draft.welcome_message || ""} onChange={e => setDraft({ ...draft, welcome_message: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">AI Greeting Script</label>
                <input value={draft.ai_greeting || ""} onChange={e => setDraft({ ...draft, ai_greeting: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">CTA Label</label>
                <input value={draft.cta_label || ""} onChange={e => setDraft({ ...draft, cta_label: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Completion Route</label>
                <input value={draft.completion_route || ""} onChange={e => setDraft({ ...draft, completion_route: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground" />
              </div>
              <div className="lg:col-span-2">
                <label className="text-[10px] text-muted-foreground block mb-1">Background Image / Video URL</label>
                <input value={draft.background_url || ""} onChange={e => setDraft({ ...draft, background_url: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground" />
              </div>
            </div>
          )}
        </ConfigEditor>
      </div>

      {/* Steps */}
      <div className="bg-white/[0.03] border border-white/8 rounded-xl p-5">
        <p className="text-xs font-semibold text-foreground mb-4">Onboarding Steps</p>
        <div className="space-y-2">
          {ONBOARDING_STEPS.map(s => (
            <div key={s.step} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/6">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center">{s.step}</span>
                <div>
                  <p className="text-xs text-foreground">{s.label}</p>
                  <p className="text-[10px] text-muted-foreground">{s.desc}</p>
                </div>
              </div>
              <StatusBadge status={(s.step === 6 ? step6Configured : s.configured) ? "healthy" : "unconfigured"} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <Link to="/admin/users-access" className="flex items-center gap-2 text-xs text-primary border border-primary/30 px-4 py-2 rounded-lg hover:bg-primary/10 transition-colors">
          <Users className="w-3.5 h-3.5" />Users & Access
        </Link>
        <Link to="/admin/modules/ai-guide" className="flex items-center gap-2 text-xs text-violet-400 border border-violet-400/30 px-4 py-2 rounded-lg hover:bg-violet-400/10 transition-colors">
          <ArrowRight className="w-3.5 h-3.5" />AI Guide Config
        </Link>
      </div>
    </div>
  );
}