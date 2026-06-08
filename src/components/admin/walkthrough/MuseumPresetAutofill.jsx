import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Wand2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MUSEUM_PRESETS } from "@/lib/museumPresets";
import { populateMuseumPreset } from "@/lib/museum-preset-autofill";

export default function MuseumPresetAutofill({ tenant, museumId, walkthroughKey, rooms, onPopulate }) {
  const queryClient = useQueryClient();
  const [presetId, setPresetId] = useState(MUSEUM_PRESETS[0]?.presetId || "");
  const [resetCurrentWalkthrough, setResetCurrentWalkthrough] = useState(true);
  const [preserveExistingMedia, setPreserveExistingMedia] = useState(true);
  const [saveAsDraft, setSaveAsDraft] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isSavingPreset, setIsSavingPreset] = useState(false);

  const preset = useMemo(() => MUSEUM_PRESETS.find((item) => item.presetId === presetId) || MUSEUM_PRESETS[0], [presetId]);
  const { data: savedPresets = [] } = useQuery({
    queryKey: ["tenant-preset-data", tenant?.id, museumId, walkthroughKey],
    enabled: !!tenant?.id && !!walkthroughKey,
    queryFn: () => base44.entities.TenantPresetData.filter({ tenant_id: tenant.id, museum_id: museumId || tenant.id, walkthrough_key: walkthroughKey }, "-updated_at", 50),
    initialData: [],
  });

  const savePreset = async () => {
    setError("");
    if (!tenant?.id) { setError("Select a tenant before saving a preset."); return; }
    if (!preset?.presetId || !preset?.presetName) { setError("Select a preset before saving."); return; }
    if (!walkthroughKey) { setError("Select a walkthrough before saving a preset."); return; }

    setIsSavingPreset(true);
    try {
      const next = populateMuseumPreset({ selectedTenant: tenant, museumId, walkthroughKey, preset, existingRooms: rooms, resetCurrentWalkthrough, preserveExistingMedia });
      const now = new Date().toISOString();
      await base44.entities.TenantPresetData.create({
        tenant_id: tenant.id,
        museum_id: museumId || tenant.id,
        tenant_name: tenant.name,
        preset_key: `${tenant.id}-${walkthroughKey}-${preset.presetId}-${Date.now()}`,
        preset_name: preset.presetName,
        walkthrough_key: walkthroughKey,
        source_preset_id: preset.presetId,
        preset_data: { preset, summary: next.summary, options: { resetCurrentWalkthrough, preserveExistingMedia, saveAsDraft } },
        rooms: next.rooms,
        status: "saved",
        created_at: now,
        updated_at: now,
      });
      setResult(next.summary);
      await queryClient.invalidateQueries({ queryKey: ["tenant-preset-data"] });
    } finally {
      setIsSavingPreset(false);
    }
  };

  const loadSavedPreset = (saved) => {
    setError("");
    const loadedRooms = saved.rooms || [];
    if (!loadedRooms.length) { setError("This saved preset has no room data to load."); return; }
    setResult(saved.preset_data?.summary || null);
    onPopulate?.(loadedRooms, saved.preset_data?.summary || { errors: [], warnings: [] }, false);
  };

  const duplicateSavedPreset = async (saved) => {
    setError("");
    const now = new Date().toISOString();
    await base44.entities.TenantPresetData.create({
      tenant_id: saved.tenant_id,
      museum_id: saved.museum_id,
      tenant_name: saved.tenant_name,
      preset_key: `${saved.preset_key || saved.id}-copy-${Date.now()}`,
      preset_name: `${saved.preset_name} Copy`,
      walkthrough_key: saved.walkthrough_key,
      source_preset_id: saved.source_preset_id,
      preset_data: { ...(saved.preset_data || {}), duplicated_from: saved.id },
      rooms: saved.rooms || [],
      status: "saved",
      created_at: now,
      updated_at: now,
    });
    await queryClient.invalidateQueries({ queryKey: ["tenant-preset-data"] });
  };

  const publishSavedPreset = async (saved) => {
    setError("");
    await base44.entities.TenantPresetData.update(saved.id, {
      preset_data: { ...(saved.preset_data || {}), publishState: "published", published_at: new Date().toISOString() },
      updated_at: new Date().toISOString(),
    });
    await queryClient.invalidateQueries({ queryKey: ["tenant-preset-data"] });
  };

  const confirmPopulate = () => {
    setError("");
    const next = populateMuseumPreset({ selectedTenant: tenant, museumId, walkthroughKey, preset, existingRooms: rooms, resetCurrentWalkthrough, preserveExistingMedia });
    setResult(next.summary);
    onPopulate?.(next.rooms, next.summary, saveAsDraft);
    setConfirmOpen(false);
  };

  return (
    <section className="rounded-3xl border border-primary/20 bg-primary/[0.055] p-4 shadow-2xl shadow-black/10">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-xl font-bold"><Wand2 className="h-5 w-5 text-primary" /> Museum Preset Autofill</h2>
          <p className="text-xs text-muted-foreground">Deterministically populate a complete draft walkthrough from one museum preset.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={savePreset} disabled={isSavingPreset}>{isSavingPreset ? "Saving..." : "Save Preset"}</Button>
          <Button onClick={() => setConfirmOpen(true)}><Wand2 className="h-4 w-4" /> Populate Full Museum</Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="space-y-1 md:col-span-2">
          <label className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Preset selector</label>
          <Select value={presetId} onValueChange={setPresetId}>
            <SelectTrigger><SelectValue placeholder="Select preset" /></SelectTrigger>
            <SelectContent>{MUSEUM_PRESETS.map((item) => <SelectItem key={item.presetId} value={item.presetId}>{item.presetName}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Info label="Museum title" value={preset?.museumName} />
        <Info label="Experience theme" value={preset?.tenantTheme} />
        <Info label="Number of rooms" value={preset?.rooms?.length || 0} />
        <Info label="Walkthrough" value={`${preset?.walkthroughKey || "Platform preset"} → ${walkthroughKey}`} />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <CheckOption label="Reset current walkthrough" checked={resetCurrentWalkthrough} onCheckedChange={setResetCurrentWalkthrough} />
        <CheckOption label="Preserve existing media" checked={preserveExistingMedia} onCheckedChange={setPreserveExistingMedia} />
        <CheckOption label="Save as draft" checked={saveAsDraft} onCheckedChange={setSaveAsDraft} />
      </div>

      {error && <p className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">{error}</p>}

      {result && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-background/40 p-3 text-xs">
          <p className="font-semibold text-primary">Full museum populated successfully. Review, preview, then publish when ready.</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-5">
            <Metric label="Rooms created" value={result.roomsCreated} />
            <Metric label="Warnings" value={result.warningsRemaining} />
            <Metric label="Missing media" value={result.missingMediaCount} />
            <Metric label="Accessibility issues" value={result.accessibilityIssues} />
            <Metric label="Publish safety" value={result.publishSafetyScore} />
          </div>
        </div>
      )}

      {savedPresets.length > 0 && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-background/40 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Saved tenant presets</p>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {savedPresets.map((saved) => (
              <div key={saved.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div>
                  <p className="text-sm font-semibold">{saved.preset_name}</p>
                  <p className="text-[10px] text-muted-foreground">{saved.updated_at ? new Date(saved.updated_at).toLocaleString() : "Saved preset"}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => loadSavedPreset(saved)}>Load/Edit</Button>
                  <Button size="sm" variant="outline" onClick={() => duplicateSavedPreset(saved)}>Duplicate</Button>
                  <Button size="sm" onClick={() => publishSavedPreset(saved)}>Publish</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Populate</DialogTitle>
            <DialogDescription>This will populate the selected walkthrough with the chosen museum preset. Existing draft rooms may be replaced if reset is enabled.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button onClick={() => { try { confirmPopulate(); } catch (err) { setError(err.message); setConfirmOpen(false); } }}>Confirm Populate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-background/40 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function CheckOption({ label, checked, onCheckedChange }) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-background/40 p-3 text-sm">
      <Checkbox checked={checked} onCheckedChange={(value) => onCheckedChange(Boolean(value))} />
      {label}
    </label>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.035] p-2">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}