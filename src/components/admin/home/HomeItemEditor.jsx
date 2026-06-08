import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function HomeItemEditor({ title, value = {}, onChange, card = false }) {
  const update = (field, next) => onChange({ ...value, [field]: next });
  const updateOverlay = (field, next) => onChange({ ...value, overlay: { ...(value.overlay || {}), [field]: next } });

  return (
    <div className="rounded-2xl border border-border/50 bg-card/35 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={value.visible !== false} onChange={(e) => update("visible", e.target.checked)} /> Visible
        </label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div><Label>Title</Label><Input className="mt-1 bg-secondary" value={value.title || ""} onChange={(e) => update("title", e.target.value)} /></div>
        <div><Label>{card ? "Subtitle" : "Description"}</Label><Input className="mt-1 bg-secondary" value={card ? (value.subtitle || "") : (value.description || "")} onChange={(e) => update(card ? "subtitle" : "description", e.target.value)} /></div>
        {card && <div className="md:col-span-2"><Label>Description</Label><Textarea rows={2} className="mt-1 bg-secondary" value={value.description || ""} onChange={(e) => update("description", e.target.value)} /></div>}
        {card && <div><Label>Badge</Label><Input className="mt-1 bg-secondary" value={value.badge || ""} onChange={(e) => update("badge", e.target.value)} /></div>}
        {(card || "ctaLabel" in value) && <div><Label>CTA Label</Label><Input className="mt-1 bg-secondary" value={value.ctaLabel || ""} onChange={(e) => update("ctaLabel", e.target.value)} /></div>}
        {(card || "ctaRoute" in value) && <div><Label>CTA Route</Label><Input className="mt-1 bg-secondary" value={value.ctaRoute || ""} onChange={(e) => update("ctaRoute", e.target.value)} /></div>}
        {"route" in value && <div><Label>Route</Label><Input className="mt-1 bg-secondary" value={value.route || ""} onChange={(e) => update("route", e.target.value)} /></div>}
        {"buttonLabel" in value && <div><Label>Button Label</Label><Input className="mt-1 bg-secondary" value={value.buttonLabel || ""} onChange={(e) => update("buttonLabel", e.target.value)} /></div>}
        {"buttonRoute" in value && <div><Label>Button Route</Label><Input className="mt-1 bg-secondary" value={value.buttonRoute || ""} onChange={(e) => update("buttonRoute", e.target.value)} /></div>}
        {card && <div><Label>Sort Order</Label><Input type="number" className="mt-1 bg-secondary" value={value.sortOrder || 0} onChange={(e) => update("sortOrder", Number(e.target.value))} /></div>}
        <div><Label>Background Media ID</Label><Input className="mt-1 bg-secondary" value={value.backgroundMediaId || ""} onChange={(e) => update("backgroundMediaId", e.target.value)} /></div>
        <div><Label>Mobile Media ID</Label><Input className="mt-1 bg-secondary" value={value.mobileMediaId || ""} onChange={(e) => update("mobileMediaId", e.target.value)} /></div>
        <div><Label>Overlay Opacity</Label><Input type="number" step="0.05" min="0" max="1" className="mt-1 bg-secondary" value={value.overlay?.overlayOpacity ?? ""} onChange={(e) => updateOverlay("overlayOpacity", Number(e.target.value))} /></div>
        <div><Label>Overlay Blur</Label><Input type="number" className="mt-1 bg-secondary" value={value.overlay?.overlayBlur ?? ""} onChange={(e) => updateOverlay("overlayBlur", Number(e.target.value))} /></div>
        <div><Label>Overlay Color RGB</Label><Input className="mt-1 bg-secondary" value={value.overlay?.overlayColor || ""} onChange={(e) => updateOverlay("overlayColor", e.target.value)} placeholder="6, 12, 24" /></div>
      </div>
    </div>
  );
}