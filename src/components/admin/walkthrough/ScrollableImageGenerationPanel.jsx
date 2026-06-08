import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Loader2, Sparkles, Check, RotateCcw, Undo2, AlertTriangle, Lock, ImageOff, Power } from "lucide-react";
import { getPrimaryRoomImage, getPrimaryRoomImageType, makeResetGenerationPatch } from "@/lib/scrollable-image";

const STRENGTHS = ["subtle", "medium", "wide", "immersive"];
const DENSITIES = ["minimal", "medium", "rich"];
const STYLES = [
  { value: "same_room_realistic", label: "Same room (realistic)" },
  { value: "gallery_clean", label: "Clean gallery" },
  { value: "warm_cultural", label: "Warm cultural" },
];

function stableHash(value = "") {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

export default function ScrollableImageGenerationPanel({ value = {}, onChange, originalUrl = "", museumType = "", simple = false }) {
  const [busy, setBusy] = useState(false);
  const status = value.scrollable_image_generation_status || "idle";
  const error = value.scrollable_image_generation_error;
  const approved = !!value.scrollable_image_approved;
  const original = value.scrollable_image_original_url || getPrimaryRoomImage(value) || originalUrl;
  const originalType = getPrimaryRoomImageType(value);
  const leftUrl = value.scrollable_image_left_extension_url;
  const rightUrl = value.scrollable_image_right_extension_url;
  const stitchedUrl = value.scrollable_image_extended_url;
  const manifest = value.scrollable_image_manifest || {};
  const qaScore = Number(manifest.qaScore || 0);
  const hasPanels = status === "complete" && leftUrl && rightUrl;
  const hasResult = hasPanels && !!stitchedUrl;

  // Allow any uploaded image to be extended; only non-image media is blocked.
  const type = String(originalType || "").toLowerCase();
  const suitability = !original
    ? { suitable: false, reason: "Upload an image first — there is nothing to extend." }
    : type && !type.includes("image") && type !== "panorama"
      ? { suitable: false, reason: "Scrollable extension only works on images, not video, audio, or 3D files." }
      : { suitable: true, reason: "" };

  const update = (patch) => onChange?.({ ...value, ...patch, scrollable_image_preserve_integrity: true });

  const generate = async (variation = false) => {
    if (!original) { update({ scrollable_image_generation_status: "failed", scrollable_image_generation_error: "Upload a room image first — there is nothing to extend." }); return; }
    if (!suitability.suitable) { update({ scrollable_image_generation_status: "failed", scrollable_image_generation_error: suitability.reason }); return; }
    // Ensure the original is captured the moment we generate.
    if (!value.scrollable_image_original_url) update({ scrollable_image_original_url: original });
    setBusy(true);
    update({ scrollable_image_generation_status: "pending", scrollable_image_generation_error: null, scrollable_image_approved: false });
    try {
      const randomness = value.scrollable_image_randomness ?? 0.12;
      const extensionStrength = value.scrollable_image_extension_strength || "medium";
      const objectDensity = value.scrollable_image_object_density || "medium";
      const visualStyle = value.scrollable_image_visual_style || "same_room_realistic";
      const tenantId = value.tenant_id || value.museum_id || "tenant";
      const roomId = value.id || value.room_key || value.title || "room";
      const imageHash = stableHash(`${original}-${value.media_id || value.media_url || value.background_media_url || ""}`);
      const deterministicSeed = `${tenantId}-${roomId}-${imageHash}-${extensionStrength}-${objectDensity}-${visualStyle}-${randomness}`;
      const res = await base44.functions.invoke("generateScrollableImageExtension", {
        original_image_url: original,
        extension_strength: extensionStrength,
        randomness,
        visual_style: visualStyle,
        object_density: objectDensity,
        museum_type: museumType || undefined,
        tenant_id: tenantId,
        room_id: roomId,
        media_id: value.media_id || value.media_url || value.background_media_url || "",
        seed: deterministicSeed,
        variation_seed: variation ? `${Date.now()}` : undefined,
      });
      const data = res?.data || {};
      if (data.status === "complete") {
        update({
          scrollable_image_generation_status: "complete",
          scrollable_image_generation_error: null,
          scrollable_image_original_url: data.original_image_url || original,
          scrollable_image_left_extension_url: data.left_extension_url || "",
          scrollable_image_right_extension_url: data.right_extension_url || "",
          scrollable_image_extended_url: data.scrollable_image_extended_url || data.extended_panorama_url || "",
          left_extension_url: data.left_extension_url || "",
          right_extension_url: data.right_extension_url || "",
          original_image_url: data.original_image_url || original,
          extended_panorama_url: data.extended_panorama_url || "",
          scrollable_image_render_mode: "single_stitched_panorama",
          scrollable_image_seed: data.deterministic_seed || data.seed || "",
          scrollable_image_manifest: data.manifest || null,
          scrollable_image_approved: false,
        });
      } else {
        const msg = data.user_message || data.error || "Generation failed. Please regenerate.";
        update({ scrollable_image_generation_status: "failed", scrollable_image_generation_error: data.next_action ? `${msg} ${data.next_action}` : msg });
      }
    } catch (e) {
      const payload = e?.response?.data || {};
      const msg = payload.user_message || payload.error || e.message || "Generation failed.";
      update({ scrollable_image_generation_status: "failed", scrollable_image_generation_error: payload.next_action ? `${msg} ${payload.next_action}` : msg });
    } finally {
      setBusy(false);
    }
  };

  const approve = () => {
    if (!stitchedUrl) {
      update({ scrollable_image_approved: false, scrollable_image_generation_error: "Generated panels exist, but the stitched panorama is missing. Public approval is blocked until the panorama is composed." });
      return;
    }
    update({
      scrollable_image_approved: true,
      scrollable_image_render_mode: "single_stitched_panorama",
      scrollable_image_manifest: { ...(value.scrollable_image_manifest || {}), approvedAt: new Date().toISOString(), renderMode: "single_stitched_panorama", publicUsesSingleImage: true },
    });
  };
  const reset = () => update(makeResetGenerationPatch());

  return (
    <div className="mt-4 space-y-4 rounded-2xl border border-white/10 bg-background/40 p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Lock className="h-3.5 w-3.5" /> Your original upload is preserved as the center. The system generates left/right panels, then stitches one public panorama.
      </div>

      {!simple && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="space-y-1.5"><Label className="text-xs">Extension strength</Label>
              <select value={value.scrollable_image_extension_strength || "medium"} onChange={(e) => update({ scrollable_image_extension_strength: e.target.value })} className="w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm">
                {STRENGTHS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="space-y-1.5"><Label className="text-xs">Object density</Label>
              <select value={value.scrollable_image_object_density || "medium"} onChange={(e) => update({ scrollable_image_object_density: e.target.value })} className="w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm">
                {DENSITIES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </label>
            <label className="space-y-1.5"><Label className="text-xs">Visual style</Label>
              <select value={value.scrollable_image_visual_style || "same_room_realistic"} onChange={(e) => update({ scrollable_image_visual_style: e.target.value })} className="w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm">
                {STYLES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </label>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Randomness: {Math.round((value.scrollable_image_randomness ?? 0.12) * 100)}%</Label>
            <Slider value={[(value.scrollable_image_randomness ?? 0.12) * 100]} min={0} max={35} step={1} onValueChange={([v]) => update({ scrollable_image_randomness: v / 100 })} />
            {(value.scrollable_image_randomness ?? 0.12) > 0.25 && <p className="text-xs text-amber-400">Higher randomness can create visible seams, changed room geometry, or mismatched objects. Realistic rooms work best at 12% to 18%.</p>}
          </div>
        </>
      )}

      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground">Raw panel preview for admin inspection</p>
        <div className="grid grid-cols-3 gap-2">
          {[{ u: leftUrl, l: "Left (generated)" }, { u: original, l: "Original (preserved)" }, { u: rightUrl, l: "Right (generated)" }].map((p, i) => (
            <div key={i} className="space-y-1">
              <div className="aspect-video overflow-hidden rounded-lg border border-white/10 bg-secondary">
                {p.u ? <img src={p.u} alt={p.l} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">—</div>}
              </div>
              <p className="text-center text-[10px] text-muted-foreground">{p.l}</p>
            </div>
          ))}
        </div>
      </div>

      {stitchedUrl && (
        <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-3">
          <p className="text-xs font-semibold text-primary">Final public panorama preview</p>
          <div className="aspect-[3/1] overflow-x-auto rounded-lg border border-white/10 bg-black">
            <img src={stitchedUrl} alt="Final stitched panorama preview" className="h-full min-w-full object-cover" />
          </div>
          <p className="text-xs text-muted-foreground">Approve only if this looks like one natural image with no visible seam. QA score: {qaScore || "pending"}.</p>
        </div>
      )}

      {!busy && status !== "pending" && !suitability.suitable && status !== "failed" && (
        <p className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-500"><ImageOff className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {suitability.reason}</p>
      )}
      {status === "pending" && <p className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating extended background…</p>}
      {status === "failed" && error && <p className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}</p>}
      {hasPanels && !stitchedUrl && <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-500">Generated panels exist, but the stitched panorama is missing. Public approval is blocked until the panorama is composed.</p>}
      {hasResult && !approved && <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-500">The stitched panorama appears ready for public preview. Please still check the visitor preview before publishing.</p>}
      {approved && <p className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-500"><Check className="h-3.5 w-3.5" /> Approved — public experience will use the stitched panorama.</p>}

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={() => generate(false)} disabled={busy || !suitability.suitable}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {hasResult ? "Stable regenerate" : status === "failed" ? "Try again" : "Generate extended background"}
        </Button>
        {!simple && hasResult && <Button type="button" size="sm" variant="outline" onClick={() => generate(true)} disabled={busy || !suitability.suitable}><Sparkles className="h-4 w-4" /> Generate variation</Button>}
        {hasResult && !approved && <Button type="button" size="sm" variant="default" onClick={approve}><Check className="h-4 w-4" /> Approve stitched panorama</Button>}
        {approved && <Button type="button" size="sm" variant="outline" onClick={() => update({ scrollable_image_approved: false })}><Undo2 className="h-4 w-4" /> Unapprove</Button>}
        {/* Reset only appears when generated panels actually exist (Step 9). */}
        {hasResult && <Button type="button" size="sm" variant="ghost" onClick={reset}><RotateCcw className="h-4 w-4" /> Reset to original</Button>}
        {/* On failure (no result), offer recovery actions instead of Reset. */}
        {status === "failed" && !hasResult && (
          <Button type="button" size="sm" variant="ghost" onClick={() => onChange?.({ ...value, scrollable_image_enabled: false, scrollable_image_generation_status: "idle", scrollable_image_generation_error: null })}>
            <Power className="h-4 w-4" /> Disable scrollable mode
          </Button>
        )}
      </div>
    </div>
  );
}