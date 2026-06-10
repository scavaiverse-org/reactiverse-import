import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Save } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import WalkthroughFilters from "@/components/admin/walkthrough/WalkthroughFilters";
import WalkthroughRoomEditor from "@/components/admin/walkthrough/WalkthroughRoomEditor";
import WalkthroughPreview from "@/components/admin/walkthrough/WalkthroughPreview";
import JourneyMap from "@/components/admin/walkthrough/JourneyMap";
import ExperienceTimeline from "@/components/admin/walkthrough/ExperienceTimeline";
import ExperienceQualityPanel from "@/components/admin/walkthrough/ExperienceQualityPanel";
import MigrationReadinessPanel from "@/components/admin/walkthrough/MigrationReadinessPanel";
import RolloutControlPanel from "@/components/admin/walkthrough/RolloutControlPanel";
import MuseumPresetAutofill from "@/components/admin/walkthrough/MuseumPresetAutofill";
import AdminPanelTabGuidesDownload from "@/components/admin/AdminPanelTabGuidesDownload";
import PublishMuseumDialog from "@/components/admin/walkthrough/PublishMuseumDialog";
import ImportMuseumZipPanel from "@/components/admin/walkthrough/ImportMuseumZipPanel";
import TheV2Guide from "@/components/admin/walkthrough/TheV2Guide";
import SuperEasyExperienceEditor from "@/components/admin/walkthrough/SuperEasyExperienceEditor";
import GlobalExperienceAutofill from "@/components/admin/walkthrough/GlobalExperienceAutofill";
import { WALKTHROUGH_EDITOR_TYPE, WALKTHROUGHS, createRoomByType, duplicateRoom, extractRoomsFromConfig, moveRoom, normalizeRooms, walkthroughLabel } from "@/lib/walkthrough-admin";
import { museumWalkthroughPath } from "@/lib/domain-registry";
import { deepClone } from "@/lib/walkthrough-media-bindings";
import { getErrorRoomKeys, getWalkthroughWarnings, hasGlobalIssue, validateWalkthroughRooms } from "@/lib/walkthrough-validation";
import { scoreWalkthroughQuality } from "@/lib/walkthrough-quality-scoring";
import { createLegacyBackup } from "@/lib/walkthrough-migration";
import { autofillEntireExperience, autofillMedia, autofillRoom, buildCanonicalExperienceConfig, generateCinematicLayout, generateMuseumNarrative, prepareVeryEasyPublishRooms, validateExperienceIntegrity } from "@/lib/experience-append-protection";
import { buildVeryEasyPublishPlan } from "@/lib/very-easy-publish-orchestrator";
import { validateVeryEasyPublishReadiness } from "@/lib/very-easy-validation";

export default function TenantWalkthrough() {
  const queryClient = useQueryClient();
  const { tenant: routeTenant } = useActiveTenant();
  const { data: tenants = [] } = useQuery({ queryKey: ["walkthrough-admin-tenants", routeTenant?.id], queryFn: () => routeTenant ? Promise.resolve([routeTenant]) : base44.entities.MuseumTenant.list("name", 100), initialData: [] });
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [museumFilter, setMuseumFilter] = useState("");
  const [walkthroughKey, setWalkthroughKey] = useState(WALKTHROUGHS[0]);
  const [status, setStatus] = useState("draft");
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(0);
  const [validationErrors, setValidationErrors] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [editorMode, setEditorMode] = useState("very_easy");

  const selectedTenant = useMemo(() => routeTenant || tenants.find((tenant) => tenant.id === selectedTenantId) || tenants[0], [tenants, selectedTenantId, routeTenant]);

  useEffect(() => {
    if (!selectedTenantId && (routeTenant?.id || tenants[0]?.id)) setSelectedTenantId(routeTenant?.id || tenants[0].id);
  }, [routeTenant?.id, tenants, selectedTenantId]);

  useEffect(() => {
    if (routeTenant?.id) setMuseumFilter(routeTenant.id);
    else if (selectedTenant?.id && !museumFilter) setMuseumFilter(selectedTenant.id);
    }, [routeTenant?.id, selectedTenant?.id, museumFilter]);

  const { data: configs = [] } = useQuery({
    queryKey: ["tenant-walkthrough-config", selectedTenant?.id, museumFilter, walkthroughKey],
    enabled: !!selectedTenant?.id,
    queryFn: () => base44.entities.ExperienceConfig.filter({ tenant_id: selectedTenant.id, museum_id: museumFilter || selectedTenant.id, module_key: "walkthrough", walkthrough_key: walkthroughKey }, "-updated_at", 20),
    initialData: [],
  });

  const record = configs[0];
  const qualityScores = useMemo(() => scoreWalkthroughQuality(rooms), [rooms]);

  useEffect(() => {
    setRooms(extractRoomsFromConfig(record, walkthroughKey));
    setStatus(record?.status || "draft");
    setValidationErrors([]);
    setWarnings([]);
    setActiveRoom(0);
  }, [record?.id, record?.updated_at, walkthroughKey]);

  const updateRoom = (index, room) => setRooms((prev) => normalizeRooms(prev.map((item, i) => i === index ? room : item), walkthroughKey));

  const saveMutation = useMutation({
    mutationFn: async (input = {}) => {
      const sourceRooms = typeof input === "object" && input.rooms ? input.rooms : rooms;
      const normalizedMode = editorMode === "super_easy" ? "very_easy" : editorMode;
      const isVeryEasy = normalizedMode === "very_easy";
      const normalizedRooms = normalizeRooms(deepClone(sourceRooms), walkthroughKey);
      const canonical = buildCanonicalExperienceConfig({ mode: normalizedMode, rooms: normalizedRooms, walkthroughKey });
      const publicRooms = canonical.rooms;
      const baseErrors = isVeryEasy ? validateVeryEasyPublishReadiness(publicRooms) : validateWalkthroughRooms(publicRooms);
      const integrity = isVeryEasy ? { errors: [] } : validateExperienceIntegrity(publicRooms);
      const errors = [...baseErrors, ...integrity.errors.filter((error) => !baseErrors.includes(error))];
      const nextWarnings = getWalkthroughWarnings(publicRooms);
      const nextQuality = scoreWalkthroughQuality(publicRooms);
      setValidationErrors(errors);
      setWarnings(nextWarnings);

      const now = new Date().toISOString();
      const payload = {
        tenant_id: selectedTenant.id,
        museum_id: museumFilter || selectedTenant.id,
        tenant_name: selectedTenant.name,
        module_key: "walkthrough",
        walkthrough_key: walkthroughKey,
        title: walkthroughLabel(walkthroughKey),
        description: "AOM Immersive Experience Builder configuration",
        status: "draft",
        legacy_backup_before_dynamic_walkthrough_migration: record?.legacy_backup_before_dynamic_walkthrough_migration || createLegacyBackup(record || {}),
        walkthrough_config: {
          ...(record?.walkthrough_config || {}),
          version: 3,
          editor_type: WALKTHROUGH_EDITOR_TYPE,
          walkthrough_key: walkthroughKey,
          rooms: publicRooms,
          journey_map: { room_count: publicRooms.length, active_room_id: publicRooms[activeRoom]?.id || null },
          timeline_metrics: {
            total_duration_seconds: publicRooms.reduce((sum, room) => sum + Number(room.estimated_duration_seconds || 0), 0),
            room_metrics: publicRooms.map((room) => ({ id: room.id, room_key: room.room_key, emotional_intensity: room.emotional_intensity, educational_density: room.educational_density, interaction_density: room.interaction_density, sensory_intensity: room.sensory_intensity, duration: room.estimated_duration_seconds })),
          },
          quality_scores: nextQuality,
          warnings: nextWarnings,
          append_only_editor: {
            active_mode: normalizedMode,
            canonical_version: canonical.version,
            integrity: canonical.integrity,
            feature_layer: "very_easy_global_autofill_append_only"
          },
          draft_state: "saved_with_warnings_allowed",
          updated_at: now,
        },
        rooms: publicRooms,
        updated_at: now,
        last_updated: now,
      };
      return record?.id ? base44.entities.ExperienceConfig.update(record.id, payload) : base44.entities.ExperienceConfig.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-walkthrough-config"] });
      queryClient.invalidateQueries({ queryKey: ["public-walkthrough-config"] });
    },
  });

  const showPublishErrorGlow = saveMutation.isError && validationErrors.length > 0;
  const errorRoomKeys = useMemo(() => showPublishErrorGlow ? getErrorRoomKeys(validationErrors, rooms) : new Set(), [showPublishErrorGlow, validationErrors, rooms]);
  const hasUnresolvedGlobalIssue = showPublishErrorGlow && hasGlobalIssue(validationErrors, rooms);

  const handlePresetPopulate = (nextRooms, summary, saveAsDraft) => {
    setRooms(deepClone(nextRooms));
    setActiveRoom(0);
    setValidationErrors(summary.errors || []);
    setWarnings(summary.warnings || []);
    if (saveAsDraft) saveMutation.mutate({ status: "draft", rooms: nextRooms });
  };

  const applyRoomsDraft = (nextRooms) => {
    const normalized = normalizeRooms(deepClone(nextRooms), walkthroughKey);
    const integrity = validateExperienceIntegrity(normalized);
    setRooms(normalized);
    setValidationErrors(integrity.errors || []);
    setWarnings(getWalkthroughWarnings(normalized));
  };

  const handleGlobalAutofill = (action) => {
    const actions = {
      room: () => rooms.map((room, index) => index === activeRoom ? autofillRoom(room, index, walkthroughKey) : room),
      experience: () => autofillEntireExperience(rooms, walkthroughKey),
      media: () => autofillMedia(rooms, walkthroughKey),
      layout: () => generateCinematicLayout(rooms, walkthroughKey),
      narrative: () => generateMuseumNarrative(rooms, walkthroughKey),
    };
    applyRoomsDraft(actions[action]?.() || rooms);
  };

  if (!selectedTenant) return <div className="text-sm text-muted-foreground">Create or select a tenant before managing Walkthrough.</div>;
  const currentRoom = rooms[activeRoom];

  return (
    <main className="space-y-6">
      <TheV2Guide />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-primary">Tenant Admin</p>
          <h1 className="mt-2 font-display text-3xl font-bold">AOM Immersive Experience Builder</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">One canonical operating system for journey maps, room states, cinematic preview, pacing intelligence, validation, migration, and tenant-safe publishing.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{status}</Badge>
          <Badge className="bg-primary/10 text-primary">Publish safety {qualityScores.publish_safety || 0}</Badge>
          <AdminPanelTabGuidesDownload />
          <Button variant="outline" onClick={() => saveMutation.mutate("draft")} disabled={saveMutation.isPending}><Save className="h-4 w-4" /> Save Draft</Button>
          <PublishMuseumDialog tenant={selectedTenant} museumId={museumFilter || selectedTenant.id} />
        </div>
      </div>

      <ImportMuseumZipPanel
        tenant={selectedTenant}
        museumId={museumFilter || selectedTenant.id}
        walkthroughKey={walkthroughKey}
        record={record}
        onDraftWritten={() => queryClient.invalidateQueries({ queryKey: ["tenant-walkthrough-config"] })}
      />

      {(validationErrors.length > 0 || warnings.length > 0) && (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
          <div className="mb-2 flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" /> {editorMode === "very_easy" || editorMode === "super_easy" ? "Museum status" : "Validation and quality notes"}</div>
          {editorMode === "very_easy" || editorMode === "super_easy" ? (
            <div className="space-y-3">
              <p>Your museum can be fixed automatically before publishing.</p>
              <Button size="sm" onClick={() => {
                const plan = buildVeryEasyPublishPlan({ rooms, walkthroughKey, tenant: selectedTenant });
                setRooms(plan.rooms);
                setValidationErrors([]);
                setWarnings([]);
                setActiveRoom(0);
                saveMutation.mutate({ status: "draft", rooms: plan.rooms });
              }}>Fix Everything Automatically</Button>
            </div>
          ) : (
            <>
              <ul className="list-disc space-y-1 pl-5">{[...validationErrors, ...warnings].map((item) => <li key={item}>{item}</li>)}</ul>
              <p className="mt-3 text-xs text-amber-200/80">Save Draft is allowed with warnings; Publish is blocked by validation errors.</p>
            </>
          )}
        </div>
      )}

      {saveMutation.error && <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{saveMutation.error.message}</div>}

      <WalkthroughFilters tenants={tenants} selectedTenantId={selectedTenant.id} onTenantChange={(id) => { if (!routeTenant?.id) { setSelectedTenantId(id); setMuseumFilter(id); } }} museumFilter={museumFilter} onMuseumFilterChange={(value) => { if (!routeTenant?.id) setMuseumFilter(value); }} walkthroughKey={walkthroughKey} onWalkthroughChange={setWalkthroughKey} hideTenantSelector={!!routeTenant?.id} />

      <p className="text-xs text-muted-foreground">
        Publishing {walkthroughLabel(walkthroughKey)} will appear at{" "}
        <span className="font-mono text-foreground">{museumWalkthroughPath(selectedTenant.slug, walkthroughKey)}</span>
      </p>

      <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-2">
        <div className="grid gap-2 md:grid-cols-3">
          {[
            ["very_easy", "Very Easy", "Auto Fill → Publish"],
            ["easy", "Easy", "Guided preset tools"],
            ["expert", "Expert", "Full control"]
          ].map(([mode, label, helper]) => (
            <button key={mode} onClick={() => setEditorMode(mode)} className={`rounded-2xl p-4 text-left transition ${editorMode === mode ? "bg-primary text-primary-foreground" : "bg-background/40 text-muted-foreground hover:bg-white/5 hover:text-foreground"}`}>
              <span className="block text-lg font-bold">{label}</span>
              <span className="mt-1 block text-xs opacity-80">{helper}</span>
            </button>
          ))}
        </div>
      </div>

      {editorMode !== "very_easy" && editorMode !== "super_easy" && <GlobalExperienceAutofill onAction={handleGlobalAutofill} disabled={saveMutation.isPending} />}

      {editorMode !== "very_easy" && editorMode !== "super_easy" && <MuseumPresetAutofill tenant={selectedTenant} museumId={museumFilter || selectedTenant.id} walkthroughKey={walkthroughKey} rooms={rooms} onPopulate={handlePresetPopulate} />}

      {(editorMode === "very_easy" || editorMode === "super_easy") && (
        <SuperEasyExperienceEditor
          rooms={rooms}
          activeRoom={activeRoom}
          walkthroughKey={walkthroughKey}
          onRoomsChange={applyRoomsDraft}
          onActiveRoomChange={setActiveRoom}
          onSaveDraft={(nextRooms) => saveMutation.mutate({ status: "draft", rooms: nextRooms || rooms })}
          onAutoFillWholeMuseum={() => {
            const plan = buildVeryEasyPublishPlan({ rooms, walkthroughKey, tenant: selectedTenant });
            setRooms(plan.rooms);
            setActiveRoom(0);
            saveMutation.mutate({ status: "draft", rooms: plan.rooms });
          }}
          onSwitchToEasy={() => setEditorMode("easy")}
          onPublish={() => {
            const publishRooms = prepareVeryEasyPublishRooms({ rooms, walkthroughKey, tenant: selectedTenant });
            setRooms(publishRooms);
            setActiveRoom(0);
            saveMutation.mutate({ status: "draft", rooms: publishRooms });
          }}
          saving={saveMutation.isPending}
        />
      )}

      {editorMode === "expert" && <div className="grid gap-6 xl:grid-cols-[340px_1fr_320px]">
        <JourneyMap rooms={rooms} activeIndex={activeRoom} onSelect={setActiveRoom} onAdd={() => { const next = normalizeRooms([...rooms, createRoomByType(rooms.length, walkthroughKey, "walkthrough_exhibition")], walkthroughKey); setRooms(next); setActiveRoom(next.length - 1); }} onDuplicate={(index) => { const next = duplicateRoom(rooms, index, walkthroughKey); setRooms(next); setActiveRoom(index + 1); }} onMove={(index, direction) => { setRooms(moveRoom(rooms, index, direction, walkthroughKey)); setActiveRoom(Math.max(0, Math.min(rooms.length - 1, index + direction))); }} onDelete={(index) => { const next = normalizeRooms(rooms.filter((_, i) => i !== index), walkthroughKey); setRooms(next); setActiveRoom(Math.max(0, index - 1)); }} errorRoomKeys={errorRoomKeys} hasGlobalIssue={hasUnresolvedGlobalIssue} />
        <div className="space-y-6">
          <WalkthroughRoomEditor room={currentRoom} onChange={(room) => updateRoom(activeRoom, room)} hasError={errorRoomKeys.has(currentRoom?.room_key)} />
          <WalkthroughPreview room={currentRoom} />
        </div>
        <div className="space-y-6">
          <ExperienceTimeline rooms={rooms} />
          <ExperienceQualityPanel rooms={rooms} />
          <MigrationReadinessPanel record={record} rooms={rooms} onSaveDraft={() => saveMutation.mutate("draft")} />
          <RolloutControlPanel tenant={selectedTenant} record={record} rooms={rooms} walkthroughKey={walkthroughKey} onComplete={() => queryClient.invalidateQueries({ queryKey: ["tenant-walkthrough-config"] })} />
        </div>
      </div>}

      {editorMode === "easy" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <JourneyMap rooms={rooms} activeIndex={activeRoom} onSelect={setActiveRoom} onAdd={() => { const next = normalizeRooms([...rooms, createRoomByType(rooms.length, walkthroughKey, "walkthrough_exhibition")], walkthroughKey); setRooms(next); setActiveRoom(next.length - 1); }} onDuplicate={(index) => { const next = duplicateRoom(rooms, index, walkthroughKey); setRooms(next); setActiveRoom(index + 1); }} onMove={(index, direction) => { setRooms(moveRoom(rooms, index, direction, walkthroughKey)); setActiveRoom(Math.max(0, Math.min(rooms.length - 1, index + direction))); }} onDelete={(index) => { const next = normalizeRooms(rooms.filter((_, i) => i !== index), walkthroughKey); setRooms(next); setActiveRoom(Math.max(0, index - 1)); }} />
            <WalkthroughRoomEditor room={currentRoom} onChange={(room) => updateRoom(activeRoom, room)} />
            <WalkthroughPreview room={currentRoom} />
          </div>
          <div className="space-y-6">
            <ExperienceTimeline rooms={rooms} />
            <ExperienceQualityPanel rooms={rooms} />
          </div>
        </div>
      )}
    </main>
  );
}