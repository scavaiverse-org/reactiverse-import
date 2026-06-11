import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, FileArchive, Loader2, RefreshCw, Trash2, UploadCloud } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { extractZipInventory } from "@/lib/zip-import/extract";
import { buildMuseumPlan, buildHeuristicMuseumPlan } from "@/lib/zip-import/plan-builder";
import { buildZipImportDraftPayload } from "@/lib/zip-import/draft-writer";
import { WALKTHROUGHS, walkthroughLabel } from "@/lib/walkthrough-admin";

const MODES = [
  { value: "very_easy", label: "Very Easy", hint: "Minimum complete draft — title, description, media, basic narration." },
  { value: "easy", label: "Easy", hint: "Clean structure with narration, hotspots, and CTAs scaffolded." },
  { value: "expert", label: "Expert", hint: "Full curatorial draft — accessibility text, CTAs, learning outcomes." },
];

export default function ImportMuseumZipPanel({ tenant, museumId, walkthroughKey, record, onDraftWritten }) {
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef(null);
  const [phase, setPhase] = useState("idle"); // idle | extracting | ready | planning | reviewing
  const [mode, setMode] = useState("very_easy");
  const [extraction, setExtraction] = useState(null); // { ok, batchId, errors, inventory, rejected }
  const [progress, setProgress] = useState(null); // { completed, total, file }
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState("");

  const { data: existingConfigs = [] } = useQuery({
    queryKey: ["zip-import-existing-configs", tenant?.id, museumId],
    enabled: open && !!tenant?.id,
    queryFn: () => base44.entities.ExperienceConfig.filter({ tenant_id: tenant.id, museum_id: museumId || tenant.id, module_key: "walkthrough" }, "-updated_at", 50),
    initialData: [],
  });

  const recordByWalkthroughKey = useMemo(() => {
    const map = {};
    WALKTHROUGHS.forEach((key) => {
      map[key] = existingConfigs.find((c) => c.walkthrough_key === key) || (key === walkthroughKey ? record : null) || null;
    });
    return map;
  }, [existingConfigs, walkthroughKey, record]);

  const acceptMutation = useMutation({
    mutationFn: async () => {
      const targets = (plan?.walkthroughs || []).filter((w) => w.rooms.length > 0);
      const results = [];
      for (const planWalkthrough of targets) {
        const existingRecord = recordByWalkthroughKey[planWalkthrough.walkthrough_key];
        const payload = buildZipImportDraftPayload({
          existingRecord,
          tenant,
          museumId,
          walkthroughKey: planWalkthrough.walkthrough_key,
          planWalkthrough,
          mode,
          batchId: extraction.batchId,
          inventory: extraction.inventory,
          planSummary: plan.summary,
          planWarnings: plan.warnings,
          planSource: plan.source,
        });
        const result = existingRecord?.id
          ? await base44.entities.ExperienceConfig.update(existingRecord.id, payload)
          : await base44.entities.ExperienceConfig.create(payload);
        results.push(result);
      }
      return results;
    },
    onSuccess: () => {
      onDraftWritten?.();
      setPhase("idle");
      setExtraction(null);
      setProgress(null);
      setPlan(null);
      setOpen(false);
    },
  });

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setPlan(null);
    setProgress(null);
    setPhase("extracting");
    try {
      const result = await extractZipInventory(file, { onProgress: setProgress });
      setExtraction(result);
      if (!result.ok) {
        setError(result.errors.join(" "));
        setPhase("idle");
        return;
      }
      setPhase("ready");
    } catch (err) {
      setError(err?.message || "Failed to read this ZIP file.");
      setPhase("idle");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const generatePlan = async () => {
    if (!extraction) return;
    setPhase("planning");
    setError("");
    try {
      const nextPlan = await buildMuseumPlan({ inventory: extraction.inventory, mode, tenant });
      setPlan(nextPlan);
      setPhase("reviewing");
    } catch (err) {
      setError(err?.message || "Failed to generate a museum plan.");
      setPhase("ready");
    }
  };

  const regenerateWithMode = (nextMode) => {
    setMode(nextMode);
    if (!extraction) return;
    const nextPlan = buildHeuristicMuseumPlan({ inventory: extraction.inventory, mode: nextMode, tenant });
    setPlan({ ...nextPlan, source: plan?.source === "ai" ? "heuristic" : nextPlan.source });
    setPhase("reviewing");
  };

  const updateRoomField = (targetKey, roomIndex, field, value) => {
    setPlan((prev) => {
      const next = { ...prev, walkthroughs: prev.walkthroughs.map((w) => ({ ...w, rooms: [...w.rooms] })) };
      const target = next.walkthroughs.find((w) => w.walkthrough_key === targetKey);
      if (!target) return prev;
      target.rooms[roomIndex] = { ...target.rooms[roomIndex], [field]: value };
      return next;
    });
  };

  const removeRoom = (targetKey, roomIndex) => {
    setPlan((prev) => {
      const next = { ...prev, walkthroughs: prev.walkthroughs.map((w) => ({ ...w, rooms: [...w.rooms] })) };
      const target = next.walkthroughs.find((w) => w.walkthrough_key === targetKey);
      if (!target) return prev;
      target.rooms.splice(roomIndex, 1);
      target.rooms.forEach((room, idx) => { room.order = idx + 1; });
      return next;
    });
  };

  const reset = () => {
    setExtraction(null);
    setProgress(null);
    setPlan(null);
    setError("");
    setPhase("idle");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline"><FileArchive className="h-4 w-4" /> Import Museum ZIP</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileArchive className="h-5 w-5 text-primary" /> Import Museum ZIP</DialogTitle>
          <DialogDescription>
            Upload an exhibition folder (images, video, audio, documents, notes) as a ZIP. The importer automatically determines
            how many walkthroughs are needed (up to {WALKTHROUGHS.length}) from the ZIP's top-level folders, and orders the rooms in
            each walkthrough by file name — deterministically, every time. Nothing is published. Review and edit the proposal,
            then save it as drafts. The public museum changes only when you press{" "}
            <span className="font-semibold text-foreground">Publish Museum</span>.
          </DialogDescription>
        </DialogHeader>

      {phase === "idle" && (
        <div className="rounded-2xl border border-dashed border-white/15 bg-background/30 p-6 text-center">
          <input ref={fileInputRef} type="file" accept=".zip" className="hidden" onChange={handleFileChange} />
          <Button onClick={() => fileInputRef.current?.click()}><UploadCloud className="h-4 w-4" /> Choose ZIP file</Button>
          <p className="mt-2 text-[11px] text-muted-foreground">Images, video, audio, PDF/TXT/MD/JSON/CSV, optional DOCX/PPTX. Executable and script files are rejected automatically.</p>
        </div>
      )}

      {phase === "extracting" && (
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-background/30 p-4 text-sm">
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          <span>
            {progress
              ? `Processing file ${progress.completed} of ${progress.total} — ${progress.file}`
              : "Reading and validating ZIP contents…"}
          </span>
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-2xl border border-rose-400/30 bg-rose-400/10 p-3 text-xs text-rose-100">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {extraction?.ok && (phase === "ready" || phase === "planning") && (
        <div className="space-y-4">
          <AssetInventorySummary extraction={extraction} />

          <div className="rounded-2xl border border-white/10 bg-background/30 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Choose a draft mode</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {MODES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setMode(option.value)}
                  className={`rounded-xl border p-3 text-left text-xs transition-colors ${mode === option.value ? "border-primary/60 bg-primary/10" : "border-white/10 bg-background/40 hover:border-white/20"}`}
                >
                  <div className="font-semibold">{option.label}</div>
                  <div className="mt-1 text-[11px] text-muted-foreground">{option.hint}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={generatePlan} disabled={phase === "planning"}>
              {phase === "planning" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Generate Plan
            </Button>
            <Button variant="outline" onClick={reset}><Trash2 className="h-4 w-4" /> Cancel</Button>
          </div>
        </div>
      )}

      {phase === "reviewing" && plan && (
        <AiZipImportReview
          plan={plan}
          currentWalkthroughKey={walkthroughKey}
          mode={mode}
          onModeChange={regenerateWithMode}
          onUpdateRoom={updateRoomField}
          onRemoveRoom={removeRoom}
          onAccept={() => acceptMutation.mutate()}
          accepting={acceptMutation.isPending}
          acceptError={acceptMutation.error}
          onCancel={reset}
        />
      )}
      </DialogContent>
    </Dialog>
  );
}

function AssetInventorySummary({ extraction }) {
  const supported = extraction.inventory.filter((a) => a.is_supported);
  const needsReview = extraction.inventory.filter((a) => a.requires_manual_review);
  return (
    <div className="rounded-2xl border border-white/10 bg-background/30 p-3 text-xs">
      <p className="mb-2 font-semibold uppercase tracking-wide text-muted-foreground">Asset inventory — batch {extraction.batchId.slice(0, 8)}</p>
      <div className="flex flex-wrap gap-2">
        <Badge className="bg-primary/10 text-primary">{extraction.inventory.length} files accepted</Badge>
        <Badge variant="outline">{supported.length} ready to use</Badge>
        {needsReview.length > 0 && <Badge className="bg-amber-400/10 text-amber-200">{needsReview.length} need review</Badge>}
        {extraction.rejected.length > 0 && <Badge className="bg-rose-400/10 text-rose-200">{extraction.rejected.length} rejected</Badge>}
      </div>
      {extraction.rejected.length > 0 && (
        <div className="mt-2 max-h-28 overflow-auto rounded-xl border border-white/10 bg-background/40 p-2 text-[11px] text-muted-foreground">
          {extraction.rejected.map((item) => (
            <div key={item.original_filename}>{item.original_filename} — {item.reason}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function AiZipImportReview({ plan, currentWalkthroughKey, mode, onModeChange, onUpdateRoom, onRemoveRoom, onAccept, accepting, acceptError, onCancel }) {
  const importable = plan.walkthroughs.filter((w) => w.rooms.length > 0);
  return (
    <div className="space-y-4" data-panel="ai-zip-import-review">
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3 text-xs">
        <p className="font-semibold">AI ZIP Import Review — {plan.source === "ai" ? "AI-generated" : "Heuristic"} plan ({mode.replace("_", " ")} mode)</p>
        <p className="mt-1 text-muted-foreground">{plan.summary}</p>
        <p className="mt-1 text-muted-foreground">Museum title: <span className="text-foreground">{plan.museum_title}</span> · Description: <span className="text-foreground">{plan.museum_description}</span></p>
      </div>

      <div className="flex flex-wrap gap-2">
        {MODES.map((option) => (
          <Button key={option.value} type="button" size="sm" variant={mode === option.value ? "default" : "outline"} onClick={() => onModeChange(option.value)}>
            {option.label}
          </Button>
        ))}
      </div>

      {plan.warnings?.length > 0 && (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-3 text-xs text-amber-100">
          <div className="mb-1 flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" /> Warnings</div>
          <ul className="list-disc space-y-0.5 pl-5">
            {plan.warnings.map((warning, idx) => <li key={idx}>{warning}</li>)}
          </ul>
        </div>
      )}

      {importable.length === 0 ? (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 p-3 text-xs text-rose-100">
          No rooms were proposed from this ZIP. Add image or video files, organized into folders (one folder per walkthrough), and try again.
        </div>
      ) : (
        importable.map((planWalkthrough) => (
          <div key={planWalkthrough.walkthrough_key} className="space-y-2">
            <p className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {walkthroughLabel(planWalkthrough.walkthrough_key)} — {planWalkthrough.rooms.length} proposed room(s)
              <Badge variant="outline" className="lowercase">from "{planWalkthrough.source_folder || "ZIP root"}"</Badge>
              {planWalkthrough.walkthrough_key === currentWalkthroughKey && <Badge className="bg-primary/10 text-primary">current</Badge>}
            </p>
            {planWalkthrough.rooms.map((room, index) => (
              <div key={index} className="rounded-2xl border border-white/10 bg-background/30 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-2">
                    <input
                      className="w-full rounded-lg border border-white/10 bg-background/50 px-2 py-1 text-sm font-semibold"
                      value={room.title}
                      onChange={(e) => onUpdateRoom(planWalkthrough.walkthrough_key, index, "title", e.target.value)}
                    />
                    <textarea
                      className="w-full rounded-lg border border-white/10 bg-background/50 px-2 py-1 text-xs"
                      rows={2}
                      value={room.description || ""}
                      placeholder="Description"
                      onChange={(e) => onUpdateRoom(planWalkthrough.walkthrough_key, index, "description", e.target.value)}
                    />
                    <textarea
                      className="w-full rounded-lg border border-white/10 bg-background/50 px-2 py-1 text-xs"
                      rows={2}
                      value={room.narration || ""}
                      placeholder="Narration"
                      onChange={(e) => onUpdateRoom(planWalkthrough.walkthrough_key, index, "narration", e.target.value)}
                    />
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      {room.media_url ? <Badge variant="outline">Media assigned</Badge> : <Badge className="bg-amber-400/10 text-amber-200">Needs media</Badge>}
                      <Badge variant="outline">{room.media_type}</Badge>
                      <Badge variant="outline">{room.page_type}</Badge>
                    </div>
                  </div>
                  {room.media_url && (
                    room.media_type === "video"
                      ? <video src={room.media_url} className="h-20 w-28 rounded-lg object-cover" muted />
                      : <img src={room.media_url} alt={room.title} className="h-20 w-28 rounded-lg object-cover" />
                  )}
                  <Button type="button" variant="ghost" size="sm" onClick={() => onRemoveRoom(planWalkthrough.walkthrough_key, index)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        ))
      )}

      {plan.unused_assets?.length > 0 && (
        <details className="rounded-2xl border border-white/10 bg-background/30 p-3 text-xs">
          <summary className="cursor-pointer font-semibold text-muted-foreground">{plan.unused_assets.length} unused file(s)</summary>
          <div className="mt-2 space-y-0.5 text-[11px] text-muted-foreground">
            {plan.unused_assets.map((asset) => <div key={asset.id}>{asset.original_filename} ({asset.detected_type}){asset.requires_manual_review ? " — needs manual review" : ""}</div>)}
          </div>
        </details>
      )}

      {acceptError && (
        <div className="flex items-start gap-2 rounded-2xl border border-rose-400/30 bg-rose-400/10 p-3 text-xs text-rose-100">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {acceptError.message || "Failed to save this draft."}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button onClick={onAccept} disabled={accepting || importable.length === 0}>
          {accepting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Accept &amp; Save {importable.length > 1 ? `${importable.length} Drafts` : "Draft"}
        </Button>
        <Button variant="outline" onClick={onCancel}>Discard Proposal</Button>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Saving as draft updates the ExperienceConfig for each walkthrough listed above. It does not change the public museum. To update the public museum, use Publish Museum after reviewing the drafts.
      </p>
    </div>
  );
}
