import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, FileArchive, Loader2, RefreshCw, Trash2, UploadCloud } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { extractZipInventory } from "@/lib/zip-import/extract";
import { buildMuseumPlan, buildHeuristicMuseumPlan } from "@/lib/zip-import/plan-builder";
import { buildZipImportDraftPayload } from "@/lib/zip-import/draft-writer";
import { walkthroughLabel } from "@/lib/walkthrough-admin";

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
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState("");

  const activeWalkthroughPlan = plan?.walkthroughs?.find((w) => w.walkthrough_key === walkthroughKey) || null;
  const otherWalkthroughPlans = (plan?.walkthroughs || []).filter((w) => w.walkthrough_key !== walkthroughKey);

  const acceptMutation = useMutation({
    mutationFn: async () => {
      const payload = buildZipImportDraftPayload({
        existingRecord: record,
        tenant,
        museumId,
        walkthroughKey,
        planWalkthrough: activeWalkthroughPlan,
        mode,
        batchId: extraction.batchId,
        inventory: extraction.inventory,
        planSummary: plan.summary,
        planWarnings: plan.warnings,
        planSource: plan.source,
      });
      return record?.id
        ? base44.entities.ExperienceConfig.update(record.id, payload)
        : base44.entities.ExperienceConfig.create(payload);
    },
    onSuccess: () => {
      onDraftWritten?.();
      setPhase("idle");
      setExtraction(null);
      setPlan(null);
      setOpen(false);
    },
  });

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setPlan(null);
    setPhase("extracting");
    try {
      const result = await extractZipInventory(file);
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
      const nextPlan = await buildMuseumPlan({ inventory: extraction.inventory, mode, tenant, includedWalkthroughKeys: [walkthroughKey] });
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
    const nextPlan = buildHeuristicMuseumPlan({ inventory: extraction.inventory, mode: nextMode, tenant, includedWalkthroughKeys: [walkthroughKey] });
    setPlan({ ...nextPlan, source: plan?.source === "ai" ? "heuristic" : nextPlan.source });
    setPhase("reviewing");
  };

  const updateRoomField = (roomIndex, field, value) => {
    setPlan((prev) => {
      const next = { ...prev, walkthroughs: prev.walkthroughs.map((w) => ({ ...w, rooms: [...w.rooms] })) };
      const target = next.walkthroughs.find((w) => w.walkthrough_key === walkthroughKey);
      if (!target) return prev;
      target.rooms[roomIndex] = { ...target.rooms[roomIndex], [field]: value };
      return next;
    });
  };

  const removeRoom = (roomIndex) => {
    setPlan((prev) => {
      const next = { ...prev, walkthroughs: prev.walkthroughs.map((w) => ({ ...w, rooms: [...w.rooms] })) };
      const target = next.walkthroughs.find((w) => w.walkthrough_key === walkthroughKey);
      if (!target) return prev;
      target.rooms.splice(roomIndex, 1);
      target.rooms.forEach((room, idx) => { room.order = idx + 1; });
      return next;
    });
  };

  const reset = () => {
    setExtraction(null);
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
            Upload an exhibition folder (images, video, audio, documents, notes) as a ZIP. This generates a proposed draft for{" "}
            <span className="font-semibold text-foreground">{walkthroughLabel(walkthroughKey)}</span> only — nothing is published.
            Review and edit the proposal, then save it as a draft. The public museum changes only when you press{" "}
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
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-background/30 p-4 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Reading and validating ZIP contents…</div>
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
          walkthroughKey={walkthroughKey}
          activeWalkthroughPlan={activeWalkthroughPlan}
          otherWalkthroughPlans={otherWalkthroughPlans}
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

function AiZipImportReview({ plan, walkthroughKey, activeWalkthroughPlan, otherWalkthroughPlans, mode, onModeChange, onUpdateRoom, onRemoveRoom, onAccept, accepting, acceptError, onCancel }) {
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

      {!activeWalkthroughPlan || activeWalkthroughPlan.rooms.length === 0 ? (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 p-3 text-xs text-rose-100">
          No rooms were proposed for {walkthroughLabel(walkthroughKey)}. Add image or video assets for this walkthrough to the ZIP, or place them in a folder named "{walkthroughKey}".
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{walkthroughLabel(walkthroughKey)} — {activeWalkthroughPlan.rooms.length} proposed room(s)</p>
          {activeWalkthroughPlan.rooms.map((room, index) => (
            <div key={index} className="rounded-2xl border border-white/10 bg-background/30 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 space-y-2">
                  <input
                    className="w-full rounded-lg border border-white/10 bg-background/50 px-2 py-1 text-sm font-semibold"
                    value={room.title}
                    onChange={(e) => onUpdateRoom(index, "title", e.target.value)}
                  />
                  <textarea
                    className="w-full rounded-lg border border-white/10 bg-background/50 px-2 py-1 text-xs"
                    rows={2}
                    value={room.description || ""}
                    placeholder="Description"
                    onChange={(e) => onUpdateRoom(index, "description", e.target.value)}
                  />
                  <textarea
                    className="w-full rounded-lg border border-white/10 bg-background/50 px-2 py-1 text-xs"
                    rows={2}
                    value={room.narration || ""}
                    placeholder="Narration"
                    onChange={(e) => onUpdateRoom(index, "narration", e.target.value)}
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
                <Button type="button" variant="ghost" size="sm" onClick={() => onRemoveRoom(index)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {plan.unused_assets?.length > 0 && (
        <details className="rounded-2xl border border-white/10 bg-background/30 p-3 text-xs">
          <summary className="cursor-pointer font-semibold text-muted-foreground">{plan.unused_assets.length} unused file(s)</summary>
          <div className="mt-2 space-y-0.5 text-[11px] text-muted-foreground">
            {plan.unused_assets.map((asset) => <div key={asset.id}>{asset.original_filename} ({asset.detected_type}){asset.requires_manual_review ? " — needs manual review" : ""}</div>)}
          </div>
        </details>
      )}

      {otherWalkthroughPlans.some((w) => w.rooms.length > 0) && (
        <div className="rounded-2xl border border-white/10 bg-background/30 p-3 text-[11px] text-muted-foreground">
          The ZIP also contains content matching {otherWalkthroughPlans.filter((w) => w.rooms.length > 0).map((w) => walkthroughLabel(w.walkthrough_key)).join(", ")}.
          Switch to that walkthrough tab and re-run Import Museum ZIP with the same file to import it there.
        </div>
      )}

      {acceptError && (
        <div className="flex items-start gap-2 rounded-2xl border border-rose-400/30 bg-rose-400/10 p-3 text-xs text-rose-100">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {acceptError.message || "Failed to save this draft."}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button onClick={onAccept} disabled={accepting || !activeWalkthroughPlan || activeWalkthroughPlan.rooms.length === 0}>
          {accepting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Accept &amp; Save as Draft
        </Button>
        <Button variant="outline" onClick={onCancel}>Discard Proposal</Button>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Saving as draft updates this walkthrough's ExperienceConfig only. It does not change the public museum. To update the public museum, use Publish Museum after reviewing the draft.
      </p>
    </div>
  );
}
