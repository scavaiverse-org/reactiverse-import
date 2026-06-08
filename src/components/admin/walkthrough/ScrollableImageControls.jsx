import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { isImageMediaType, makeScrollableImagePatch } from "@/lib/scrollable-image";
import ScrollableImageGenerationPanel from "./ScrollableImageGenerationPanel";

export default function ScrollableImageControls({ value = {}, mediaType = "", onChange, advanced = false, simple = false, title = "Scrollable image", originalUrl = "", museumType = "" }) {
  const isImage = isImageMediaType(mediaType);
  if (!isImage) return null;

  const update = (patch) => onChange?.({ ...value, ...patch, scrollable_image_preserve_integrity: true });
  const enabled = !!value.scrollable_image_enabled;
  const approved = !!value.scrollable_image_approved;

  return (
    <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Label className="text-sm font-semibold">{advanced ? "Enable scrollable image" : "Make this image scrollable left/right"}</Label>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Best for wide rooms, galleries, maps, walls, murals, exhibits, scenery, and panoramic images.</p>
        </div>
        <Switch checked={enabled} onCheckedChange={(checked) => update(makeScrollableImagePatch(checked))} aria-label={title} />
      </div>

      {enabled && !approved && (
        <p className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-500">
          Scrollable mode needs a generated &amp; approved extended panorama to feel immersive. Until then, the public experience shows your original image.
        </p>
      )}

      {enabled && <ScrollableImageGenerationPanel value={value} onChange={onChange} originalUrl={originalUrl} museumType={museumType} simple={simple} />}

      {enabled && advanced && (
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="space-y-2"><Label>Scroll direction</Label><select value="horizontal" disabled className="w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm opacity-80"><option>horizontal</option></select></label>
          <label className="space-y-2"><Label>Drag sensitivity</Label><Input type="number" min="0.5" max="3" step="0.1" value={value.scrollable_image_drag_sensitivity || 1} onChange={(e) => update({ scrollable_image_drag_sensitivity: Number(e.target.value) })} /></label>
          <label className="space-y-2"><Label>Initial position</Label><select value={value.scrollable_image_initial_position || "center"} onChange={(e) => update({ scrollable_image_initial_position: e.target.value })} className="w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm"><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label>
          <label className="space-y-2"><Label>Extension strength</Label><select value={value.scrollable_image_strength || "medium"} onChange={(e) => update({ scrollable_image_strength: e.target.value })} className="w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm"><option value="subtle">Subtle</option><option value="medium">Medium</option><option value="wide">Wide</option></select></label>
          <div className="rounded-xl border border-white/10 bg-background/40 p-3 text-xs text-muted-foreground">Edge protection: on</div>
          <div className="rounded-xl border border-white/10 bg-background/40 p-3 text-xs text-muted-foreground">Preserve image integrity: locked on</div>
          <div className="rounded-xl border border-white/10 bg-background/40 p-3 text-xs text-muted-foreground">Mobile swipe support: on</div>
          <div className="rounded-xl border border-white/10 bg-background/40 p-3 text-xs text-muted-foreground">Mouse drag support: on</div>
        </div>
      )}
    </div>
  );
}