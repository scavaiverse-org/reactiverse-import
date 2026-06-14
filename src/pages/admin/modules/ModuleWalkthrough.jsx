import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Map, Play, Eye, ArrowRight } from "lucide-react";
import AdminBreadcrumb from "@/components/admin/AdminBreadcrumb";
import StatusBadge from "@/components/admin/StatusBadge";
import TenantSwitcher from "@/components/admin/TenantSwitcher";
import ConfigEditor from "@/components/admin/ConfigEditor";
import { DEFAULT_ROOM_PREVIEW_CONFIG } from "@/lib/room-preview-defaults";

const SCENES = [
  { id: 1, title: "Grand Entrance — The Gate of Heritage", hotspots: 3, media: "image+audio", status: "published" },
  { id: 2, title: "Hall of Origins — Tang Dynasty Opera", hotspots: 5, media: "image+video", status: "published" },
  { id: 3, title: "Costume Atelier — Silk & Symbol", hotspots: 4, media: "image+audio", status: "published" },
  { id: 4, title: "The Stage — Living Performance Space", hotspots: 6, media: "video", status: "published" },
  { id: 5, title: "Instrument Gallery — Strings of Time", hotspots: 4, media: "image+audio", status: "draft" },
  { id: 6, title: "Archive Chamber — Scrolls & Scripts", hotspots: 2, media: "image", status: "draft" },
  { id: 7, title: "Heritage Bridge — Future of Opera", hotspots: 3, media: "animation", status: "draft" },
];

const MODES = [
  { label: "Cinematic Guided Flow", enabled: true },
  { label: "Free Exploration", enabled: true },
  { label: "Learning Mode", enabled: true },
  { label: "Browser-First (No Unity/Unreal)", enabled: true },
  { label: "Scene-by-scene Progress", enabled: true },
  { label: "VR Mode (Future)", enabled: false },
];

export default function ModuleWalkthrough() {
  const { data: tenants = [] } = useQuery({ queryKey: ["wt-tenants"], queryFn: () => base44.entities.MuseumTenant.list() });
  const [activeTenant, setActiveTenant] = useState(null);
  const selected = tenants.find(t => t.id === activeTenant) || tenants[0];
  const { data: events = [] } = useQuery({ queryKey: ["wt-events", selected?.id], queryFn: () => selected ? base44.entities.AnalyticsEvent.filter({ tenant_id: selected.id }) : base44.entities.AnalyticsEvent.list(), enabled: !!selected });
  const walkthroughStarts = events.filter(e => e.event_type === "walkthrough_start").length;
  const walkthroughComplete = events.filter(e => e.event_type === "walkthrough_complete").length;

  return (
    <div className="min-h-screen bg-[#060c18] p-6 lg:p-8">
      <AdminBreadcrumb crumbs={[{ label: "Modules", path: "/admin/modules" }, { label: "Walkthrough" }]} />

      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[10px] tracking-[0.3em] text-cyan-400 font-semibold mb-1">MODULE 4</p>
          <h1 className="text-2xl font-display font-bold text-foreground">Virtual Walkthrough Module</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage cinematic scenes, hotspots, narration, and visitor flow. Browser-first, no Unity/Unreal required.</p>
        </div>
        <TenantSwitcher activeTenant={activeTenant} onChange={setActiveTenant} />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
          <p className="text-2xl font-display font-bold text-cyan-400">{SCENES.length}</p>
          <p className="text-xs text-muted-foreground">Total Scenes</p>
        </div>
        <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
          <p className="text-2xl font-display font-bold text-emerald-400">{walkthroughStarts || "—"}</p>
          <p className="text-xs text-muted-foreground">Tours Started</p>
        </div>
        <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
          <p className="text-2xl font-display font-bold text-primary">{walkthroughComplete || "—"}</p>
          <p className="text-xs text-muted-foreground">Tours Completed</p>
        </div>
      </div>

      <div className="mb-6">
        <ConfigEditor
          tenant={selected}
          configType="experience"
          fieldKey="room_preview_config"
          title={`Room Preview Settings${selected ? ` — ${selected.name}` : ""}`}
          description="Saved to ExperienceConfig and used by the public /room-preview page. Update the room title, image, comfort defaults, and hotspot story panels here."
          defaultValue={DEFAULT_ROOM_PREVIEW_CONFIG}
        >
          {({ draft, setDraft }) => (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1 text-[10px] text-muted-foreground">Room title
                  <input value={draft.title || ""} onChange={e => setDraft({ ...draft, title: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground" />
                </label>
                <label className="space-y-1 text-[10px] text-muted-foreground">Background image URL
                  <input value={draft.background_image_url || ""} onChange={e => setDraft({ ...draft, background_image_url: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground" />
                </label>
              </div>
              <label className="space-y-1 text-[10px] text-muted-foreground block">Room subtitle
                <textarea value={draft.subtitle || ""} onChange={e => setDraft({ ...draft, subtitle: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground min-h-16" />
              </label>
              <div className="grid gap-3 md:grid-cols-3">
                <label className="flex items-center gap-2 text-xs text-foreground"><input type="checkbox" checked={draft.enabled !== false} onChange={e => setDraft({ ...draft, enabled: e.target.checked })} /> Enable room preview</label>
                <label className="flex items-center gap-2 text-xs text-foreground"><input type="checkbox" checked={!!draft.reduced_motion_default} onChange={e => setDraft({ ...draft, reduced_motion_default: e.target.checked })} /> Reduced motion default</label>
                <label className="flex items-center gap-2 text-xs text-foreground"><input type="checkbox" checked={!!draft.calm_mode_default} onChange={e => setDraft({ ...draft, calm_mode_default: e.target.checked })} /> Calm mode default</label>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-semibold text-foreground">Hotspots</p>
                {(draft.hotspots || []).map((hotspot, index) => (
                  <div key={hotspot.id || index} className="rounded-xl border border-white/8 bg-white/[0.02] p-3 space-y-2">
                    <div className="grid gap-2 md:grid-cols-4">
                      <input value={hotspot.title || ""} placeholder="Hotspot title" onChange={e => { const next = [...draft.hotspots]; next[index] = { ...hotspot, title: e.target.value, label: e.target.value }; setDraft({ ...draft, hotspots: next }); }} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground" />
                      <input type="number" value={hotspot.x || 0} placeholder="Position X" onChange={e => { const next = [...draft.hotspots]; next[index] = { ...hotspot, x: Number(e.target.value) }; setDraft({ ...draft, hotspots: next }); }} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground" />
                      <input type="number" value={hotspot.y || 0} placeholder="Position Y" onChange={e => { const next = [...draft.hotspots]; next[index] = { ...hotspot, y: Number(e.target.value) }; setDraft({ ...draft, hotspots: next }); }} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground" />
                      <input value={hotspot.primary_cta_label || ""} placeholder="Primary CTA" onChange={e => { const next = [...draft.hotspots]; next[index] = { ...hotspot, primary_cta_label: e.target.value }; setDraft({ ...draft, hotspots: next }); }} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground" />
                    </div>
                    <textarea value={hotspot.description || ""} placeholder="Hotspot description" onChange={e => { const next = [...draft.hotspots]; next[index] = { ...hotspot, description: e.target.value }; setDraft({ ...draft, hotspots: next }); }} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground min-h-16" />
                    <div className="grid gap-2 md:grid-cols-3">
                      <input value={hotspot.primary_cta_route || ""} placeholder="Primary route" onChange={e => { const next = [...draft.hotspots]; next[index] = { ...hotspot, primary_cta_route: e.target.value }; setDraft({ ...draft, hotspots: next }); }} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground" />
                      <input value={hotspot.secondary_cta_label || ""} placeholder="Secondary CTA" onChange={e => { const next = [...draft.hotspots]; next[index] = { ...hotspot, secondary_cta_label: e.target.value }; setDraft({ ...draft, hotspots: next }); }} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground" />
                      <input value={hotspot.secondary_cta_route || ""} placeholder="Secondary route" onChange={e => { const next = [...draft.hotspots]; next[index] = { ...hotspot, secondary_cta_route: e.target.value }; setDraft({ ...draft, hotspots: next }); }} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ConfigEditor>
      </div>

      <div className="mb-6">
        <ConfigEditor
          tenant={selected}
          configType="experience"
          fieldKey="walkthrough_config"
          title={`Walkthrough Config${selected ? ` — ${selected.name}` : ""}`}
          description="Saved to ExperienceConfig and used by the public walkthrough. DETERMINISTIC CTA CONTRACT: a hotspot badge ALWAYS only opens its panel — it never routes, advances scenes, or completes the tour. Scene movement is controlled exclusively by the bottom navigation (Previous/Next/Complete). Hotspot schema: hotspots: [{ id, label, title, description, detail, sensory_note, reduced_motion_text, panel_actions: [{ label, action_type, route }] }]. Every panel automatically includes 'Keep Exploring' (close) and 'Ask ARIA'. You may add ONE contextual panel action — action_type one of: next_station (label must be 'Go to Next Station'), complete_tour ('Complete Tour'), or route ('View Tickets' /tickets, 'Register Vendor' /vendors/register, 'Explore Marketplace' /commerce). Legacy action_type values (open_panel, ask_aria, open_ticket, open_vendor, open_commerce, complete_scene, complete_tour) are auto-normalized into safe panel actions and can never break badge behavior."
          defaultValue={{ scenes: SCENES, modes: MODES, default_cta: "Continue Tour" }}
        >
          {({ draft, setDraft }) => (
            <div className="space-y-2">
              {(draft.scenes || []).map((scene, index) => (
                <div key={scene.id || index} className="grid grid-cols-[60px_1fr_90px_120px] gap-2">
                  <input type="number" value={scene.id || index + 1} onChange={e => { const next = [...draft.scenes]; next[index] = { ...scene, id: Number(e.target.value) || index + 1 }; setDraft({ ...draft, scenes: next }); }} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground" />
                  <input value={scene.title || ""} onChange={e => { const next = [...draft.scenes]; next[index] = { ...scene, title: e.target.value }; setDraft({ ...draft, scenes: next }); }} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground" />
                  <input value={scene.hotspots || 0} onChange={e => { const next = [...draft.scenes]; next[index] = { ...scene, hotspots: Number(e.target.value) }; setDraft({ ...draft, scenes: next }); }} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground" />
                  <select value={scene.status || "draft"} onChange={e => { const next = [...draft.scenes]; next[index] = { ...scene, status: e.target.value }; setDraft({ ...draft, scenes: next }); }} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              ))}
            </div>
          )}
        </ConfigEditor>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Scenes */}
        <div className="bg-white/[0.03] border border-cyan-400/15 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold text-foreground flex items-center gap-2">
              <Map className="w-3.5 h-3.5 text-cyan-400" />Walkthrough Scenes
            </p>
            <Link to="/room-preview" className="text-xs text-cyan-400 hover:underline flex items-center gap-1">
              <Eye className="w-3 h-3" />Room Preview
            </Link>
          </div>
          <div className="space-y-2">
            {SCENES.map(s => (
              <div key={s.id} className="flex items-start justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/6">
                <div className="flex items-start gap-2.5">
                  <span className="text-[9px] font-bold text-cyan-400/60 mt-0.5">#{s.id}</span>
                  <div>
                    <p className="text-xs text-foreground">{s.title}</p>
                    <p className="text-[10px] text-muted-foreground">{s.hotspots} hotspots · {s.media}</p>
                  </div>
                </div>
                <StatusBadge status={s.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Modes */}
        <div className="bg-white/[0.03] border border-cyan-400/15 rounded-xl p-5">
          <p className="text-xs font-semibold text-foreground mb-4 flex items-center gap-2">
            <Play className="w-3.5 h-3.5 text-cyan-400" />Walkthrough Modes
          </p>
          <div className="space-y-2">
            {MODES.map(m => (
              <div key={m.label} className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/6">
                <span className={`text-xs ${m.enabled ? "text-foreground" : "text-muted-foreground/50"}`}>{m.label}</span>
                <StatusBadge status={m.enabled ? "enabled" : "disabled"} />
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-white/5">
            <Link to="/room-preview" className="flex items-center justify-center gap-2 text-xs text-cyan-400 border border-cyan-400/30 py-2 rounded-lg hover:bg-cyan-400/10 transition-colors w-full">
              <Eye className="w-3.5 h-3.5" />Preview Room Entrance
            </Link>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Link to="/admin/content/exhibits" className="flex items-center gap-2 text-xs text-cyan-400 border border-cyan-400/30 px-4 py-2 rounded-lg hover:bg-cyan-400/10 transition-colors">
          <ArrowRight className="w-3.5 h-3.5" />Exhibit Content
        </Link>
        <Link to="/admin/modules/analytics" className="flex items-center gap-2 text-xs text-primary border border-primary/30 px-4 py-2 rounded-lg hover:bg-primary/10 transition-colors">
          <ArrowRight className="w-3.5 h-3.5" />Analytics
        </Link>
      </div>
    </div>
  );
}