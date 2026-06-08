import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Brain, Shield, Globe2, MessageSquare, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";
import AdminBreadcrumb from "@/components/admin/AdminBreadcrumb";
import TenantSwitcher from "@/components/admin/TenantSwitcher";
import ConfigEditor from "@/components/admin/ConfigEditor";

const ANTI_HALLUCINATION = [
  { rule: "Answer only from approved museum content", active: true },
  { rule: "Show fallback if uncertain", active: true },
  { rule: "Log unanswered questions", active: true },
  { rule: "Admin review for failed queries", active: true },
  { rule: "Restricted topics enforcement", active: true },
  { rule: "Escalation to human support", active: true },
];

const AI_CONFIG = [
  { label: "Guide Name", value: "ARIA" },
  { label: "Personality", value: "Warm, scholarly, culturally informed" },
  { label: "Language Modes", value: "English, Mandarin, Malay (configured)" },
  { label: "Voice Mode", value: "Text only (Voice: planned)" },
  { label: "Ticket Conversion Prompts", value: "Enabled" },
  { label: "Vendor Guidance", value: "Enabled" },
  { label: "Exhibit Explanations", value: "Enabled" },
];

export default function ModuleAIGuide() {
  const { data: tenants = [] } = useQuery({ queryKey: ["ai-tenants"], queryFn: () => base44.entities.MuseumTenant.list() });
  const { data: events = [] } = useQuery({ queryKey: ["ai-events"], queryFn: () => base44.entities.AnalyticsEvent.list() });
  const [activeTenant, setActiveTenant] = useState(null);

  const selected = tenants.find(t => t.id === activeTenant) || tenants[0];
  const aiInteractions = events.filter(e => e.event_type === "ai_guide_interaction" && selected?.id && e.tenant_id === selected.id).length;

  return (
    <div className="min-h-screen bg-[#060c18] p-6 lg:p-8">
      <AdminBreadcrumb crumbs={[{ label: "Modules", path: "/admin/modules" }, { label: "AI Guide" }]} />

      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[10px] tracking-[0.3em] text-violet-400 font-semibold mb-1">MODULE 3</p>
          <h1 className="text-2xl font-display font-bold text-foreground">AI Guide Module</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure ARIA's knowledge base, personality, anti-hallucination rules, and multilingual settings.</p>
        </div>
        <TenantSwitcher activeTenant={activeTenant} onChange={setActiveTenant} />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
          <p className="text-2xl font-display font-bold text-violet-400">{aiInteractions || "—"}</p>
          <p className="text-xs text-muted-foreground">AI Interactions</p>
        </div>
        <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
          <p className="text-2xl font-display font-bold text-emerald-400">Live</p>
          <p className="text-xs text-muted-foreground">Config Persistence</p>
        </div>
        <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
          <p className="text-2xl font-display font-bold text-violet-400">{aiInteractions || "Collecting..."}</p>
          <p className="text-xs text-muted-foreground">AI Interactions This Period</p>
        </div>
      </div>

      <div className="mb-6">
        <ConfigEditor
          tenant={selected}
          configType="experience"
          fieldKey="ai_guide_config"
          title={`AI Guide Config${selected ? ` — ${selected.name}` : ""}`}
          description="Saved to ExperienceConfig and used by the public AI guide."
          defaultValue={{ guide_name: "ARIA", personality: "Warm, scholarly, culturally informed", knowledge_base: "Approved museum content only", fallback_answer: "I’m not certain from the approved museum content yet.", restricted_topics: "Medical, legal, political advice" }}
        >
          {({ draft, setDraft }) => (
            <div className="grid lg:grid-cols-2 gap-4">
              {[
                ["guide_name", "Guide Name"],
                ["personality", "Personality"],
                ["knowledge_base", "Approved Knowledge Base"],
                ["fallback_answer", "Fallback Answer"],
                ["restricted_topics", "Restricted Topics"],
              ].map(([key, label]) => (
                <div key={key} className={key === "knowledge_base" ? "lg:col-span-2" : ""}>
                  <label className="text-[10px] text-muted-foreground block mb-1">{label}</label>
                  <textarea value={draft[key] || ""} onChange={e => setDraft({ ...draft, [key]: e.target.value })} className="w-full min-h-[72px] bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground" />
                </div>
              ))}
            </div>
          )}
        </ConfigEditor>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* AI Configuration */}
        <div className="bg-white/[0.03] border border-violet-400/15 rounded-xl p-5">
          <p className="text-xs font-semibold text-foreground mb-4 flex items-center gap-2">
            <Brain className="w-3.5 h-3.5 text-violet-400" />Guide Configuration
          </p>
          <div className="space-y-2.5">
            {AI_CONFIG.map(c => (
              <div key={c.label} className="flex items-start justify-between py-1.5 border-b border-white/5 last:border-0">
                <span className="text-[10px] text-muted-foreground w-40">{c.label}</span>
                <span className="text-xs text-foreground text-right">{c.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Anti-Hallucination */}
        <div className="bg-white/[0.03] border border-violet-400/15 rounded-xl p-5">
          <p className="text-xs font-semibold text-foreground mb-4 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-violet-400" />Anti-Hallucination Controls
          </p>
          <div className="space-y-2">
            {ANTI_HALLUCINATION.map(r => (
              <div key={r.rule} className="flex items-center gap-2.5 py-1.5 border-b border-white/5 last:border-0">
                {r.active
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  : <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                <span className={`text-xs ${r.active ? "text-foreground/80" : "text-muted-foreground/50"}`}>{r.rule}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Multilingual */}
      <div className="bg-white/[0.03] border border-white/8 rounded-xl p-5 mb-6">
        <p className="text-xs font-semibold text-foreground mb-3 flex items-center gap-2">
          <Globe2 className="w-3.5 h-3.5 text-violet-400" />Multilingual Settings
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            { name: "English", planned: false },
            { name: "Mandarin (简体)", planned: false },
            { name: "Malay (Bahasa)", planned: false },
            { name: "Tamil", planned: false },
            { name: "Japanese", planned: true },
            { name: "Korean", planned: true },
          ].map(lang => (
            <span key={lang.name} className={`inline-flex items-center gap-1.5 text-[10px] px-3 py-1 rounded-full border ${lang.planned ? "border-white/10 text-muted-foreground/60" : "border-violet-400/30 text-violet-400 bg-violet-400/5"}`}>
              {lang.name}
              {lang.planned && <span className="rounded-full border border-white/10 px-1.5 py-0.5 text-[8px] uppercase tracking-[0.16em] text-muted-foreground/70">Planned</span>}
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Link to={selected?.slug ? `/museum/${selected.slug}/guide` : "#"} className="flex items-center gap-2 text-xs text-violet-400 border border-violet-400/30 px-4 py-2 rounded-lg hover:bg-violet-400/10 transition-colors">
          <MessageSquare className="w-3.5 h-3.5" />Preview AI Guide
        </Link>
        <Link to="/platform/admin/content-data" className="flex items-center gap-2 text-xs text-primary border border-primary/30 px-4 py-2 rounded-lg hover:bg-primary/10 transition-colors">
          <ArrowRight className="w-3.5 h-3.5" />Content & Knowledge Base
        </Link>
      </div>
    </div>
  );
}