import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ChevronDown, PlayCircle, Save } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import HelpHint from "@/components/admin/walkthrough/HelpHint";
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
import TestPublishOverlay from "@/components/admin/walkthrough/TestPublishOverlay";
import ImportMuseumZipPanel from "@/components/admin/walkthrough/ImportMuseumZipPanel";
import TheV2Guide from "@/components/admin/walkthrough/TheV2Guide";
import GlobalExperienceAutofill from "@/components/admin/walkthrough/GlobalExperienceAutofill";
import { WALKTHROUGH_EDITOR_TYPE, WALKTHROUGHS, createRoomByType, duplicateRoom, extractRoomsFromConfig, moveRoom, normalizeRooms, walkthroughLabel } from "@/lib/walkthrough-admin";
import { buildThreeDWorldRooms } from "@/lib/three-d-world-autofill";
import { museumWalkthroughPath } from "@/lib/domain-registry";
import { deepClone } from "@/lib/walkthrough-media-bindings";
import { getErrorRoomKeys, getWalkthroughWarnings, hasGlobalIssue, validateWalkthroughRooms } from "@/lib/walkthrough-validation";
import { compileVisibleRooms } from "@/lib/manifest-compiler";
import { scoreWalkthroughQuality } from "@/lib/walkthrough-quality-scoring";
import { createLegacyBackup } from "@/lib/walkthrough-migration";
import { autofillEntireExperience, autofillMedia, autofillRoom, buildCanonicalExperienceConfig, generateCinematicLayout, generateMuseumNarrative, validateExperienceIntegrity } from "@/lib/experience-append-protection";

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
  const [editorMode, setEditorMode] = useState("easy");
  const [testPublishOpen, setTestPublishOpen] = useState(false);

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
  const testPublishRooms = useMemo(() => compileVisibleRooms(rooms, walkthroughKey), [rooms, walkthroughKey]);

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
      const normalizedRooms = normalizeRooms(deepClone(sourceRooms), walkthroughKey);
      const canonical = buildCanonicalExperienceConfig({ mode: editorMode, rooms: normalizedRooms, walkthroughKey });
      const publicRooms = canonical.rooms;
      const baseErrors = validateWalkthroughRooms(publicRooms);
      const integrity = validateExperienceIntegrity(publicRooms);
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
            active_mode: editorMode,
            canonical_version: canonical.version,
            integrity: canonical.integrity,
            feature_layer: "global_autofill_append_only"
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
    onSuccess: (saved) => {
      // Seed the cache with the just-saved record instead of invalidating + refetching:
      // a refetch can race the write and return stale data, which the effect below
      // would then use to clobber the local rooms (e.g. wiping a just-uploaded image).
      queryClient.setQueryData(["tenant-walkthrough-config", selectedTenant?.id, museumFilter, walkthroughKey], (old = []) => {
        const others = (old || []).filter((item) => item.id !== saved.id);
        return [saved, ...others];
      });
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

  const handleGlobalAutofill = (action, payload = {}) => {
    // 3D world autofill appends brand-new ready-built worlds, then jumps the
    // editor to the first one so the tenant can preview/customise it immediately.
    if (action === "threeDWorld" || action === "threeDWorlds") {
      const count = action === "threeDWorld" ? 1 : payload.count;
      const firstNewIndex = rooms.length;
      const newRooms = buildThreeDWorldRooms({ count, startIndex: rooms.length, walkthroughKey });
      applyRoomsDraft([...rooms, ...newRooms]);
      setActiveRoom(firstNewIndex);
      return;
    }
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
          <h1 className="mt-2 flex items-center gap-2 font-display text-3xl font-bold">
            AOM Immersive Experience Builder
            <HelpHint title="Experience Builder">
              This page builds the immersive walkthrough visitors see for {walkthroughLabel(walkthroughKey)}.
              Pick a mode below: <strong>Easy</strong> gives guided preset tools alongside the room editor, and
              <strong> Expert</strong> exposes every field for full control. "Save Draft" stores your work
              without publishing; "Publish" makes it live to visitors once validation passes.
            </HelpHint>
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">One canonical operating system for journey maps, room states, cinematic preview, pacing intelligence, validation, migration, and tenant-safe publishing.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{status}</Badge>
          <Badge className="bg-primary/10 text-primary">Publish safety {qualityScores.publish_safety || 0}</Badge>
          <HelpHint title="Status and publish safety">
            <strong>Status</strong> reflects whether this walkthrough is a draft or published.
            <strong> Publish safety</strong> is a 0-100 score combining validation errors, warnings, and content
            completeness across all rooms — aim for a high score before publishing.
          </HelpHint>
          <AdminPanelTabGuidesDownload />
          <Button variant="outline" onClick={() => saveMutation.mutate("draft")} disabled={saveMutation.isPending}><Save className="h-4 w-4" /> Save Draft</Button>
          <ImportMuseumZipPanel
            tenant={selectedTenant}
            museumId={museumFilter || selectedTenant.id}
            walkthroughKey={walkthroughKey}
            record={record}
            onDraftWritten={() => queryClient.invalidateQueries({ queryKey: ["tenant-walkthrough-config"] })}
          />
          <Button variant="outline" onClick={() => setTestPublishOpen(true)} disabled={rooms.length === 0}><PlayCircle className="h-4 w-4" /> Test Publish</Button>
          <PublishMuseumDialog tenant={selectedTenant} museumId={museumFilter || selectedTenant.id} />
          <HelpHint title="Import ZIP, Test Publish, and Publish">
            <strong>Import Museum ZIP</strong> reads an uploaded ZIP of media/content and turns it into a draft
            walkthrough automatically. <strong>Test Publish</strong> opens a full-screen run-through of this
            walkthrough using your current draft, exactly as a visitor would experience it once published.
            <strong> Publish</strong> makes the current draft live at the museum's
            public URL — it's blocked if there are unresolved validation errors.
          </HelpHint>
        </div>
      </div>

      {(validationErrors.length > 0 || warnings.length > 0) && (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
          <div className="mb-2 flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" /> Validation and quality notes</div>
          <ul className="list-disc space-y-1 pl-5">{[...validationErrors, ...warnings].map((item) => <li key={item}>{item}</li>)}</ul>
          <p className="mt-3 text-xs text-amber-200/80">Save Draft is allowed with warnings; Publish is blocked by validation errors.</p>
        </div>
      )}

      {saveMutation.error && <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{saveMutation.error.message}</div>}

      <WalkthroughFilters tenants={tenants} selectedTenantId={selectedTenant.id} onTenantChange={(id) => { if (!routeTenant?.id) { setSelectedTenantId(id); setMuseumFilter(id); } }} museumFilter={museumFilter} onMuseumFilterChange={(value) => { if (!routeTenant?.id) setMuseumFilter(value); }} walkthroughKey={walkthroughKey} onWalkthroughChange={setWalkthroughKey} hideTenantSelector={!!routeTenant?.id} />

      <p className="text-xs text-muted-foreground">
        Publishing {walkthroughLabel(walkthroughKey)} will appear at{" "}
        <span className="font-mono text-foreground">{museumWalkthroughPath(selectedTenant.slug, walkthroughKey)}</span>
      </p>

      <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-2">
        <div className="mb-1 flex items-center gap-1.5 px-2 pt-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Editor mode</span>
          <HelpHint title="Editor mode">
            <strong>Easy</strong>: journey map and room editor plus preset/autofill tools, with pacing and quality
            panels alongside. <strong>Expert</strong>: the same room editor and journey map, plus full pacing,
            quality, migration, and rollout tooling. Switching modes does not lose any data.
          </HelpHint>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          {[
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

      <Collapsible defaultOpen={false}>
        <CollapsibleTrigger asChild>
          <button type="button" className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-sm font-semibold transition hover:bg-white/[0.06] [&[data-state=open]>svg]:rotate-180">
            <span className="flex items-center gap-1.5">
              Bulk Tools (Autofill &amp; Presets)
              <HelpHint title="Bulk Tools">
                Optional power tools for filling in lots of content at once: Global Experience Autofill (room,
                media, layout, and narrative generators) and Museum Preset Autofill (populate the whole
                walkthrough from a ready-made museum preset, or save/load your own presets). Expand only when
                you need them.
              </HelpHint>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 space-y-6">
          <GlobalExperienceAutofill onAction={handleGlobalAutofill} disabled={saveMutation.isPending} />
          <MuseumPresetAutofill tenant={selectedTenant} museumId={museumFilter || selectedTenant.id} walkthroughKey={walkthroughKey} rooms={rooms} onPopulate={handlePresetPopulate} />
        </CollapsibleContent>
      </Collapsible>

      {editorMode === "expert" && <div className="grid gap-6 xl:grid-cols-[340px_1fr_320px]">
        <JourneyMap rooms={rooms} activeIndex={activeRoom} onSelect={setActiveRoom} onAdd={() => { const next = normalizeRooms([...rooms, createRoomByType(rooms.length, walkthroughKey, "walkthrough_exhibition")], walkthroughKey); setRooms(next); setActiveRoom(next.length - 1); }} onDuplicate={(index) => { const next = duplicateRoom(rooms, index, walkthroughKey); setRooms(next); setActiveRoom(index + 1); }} onMove={(index, direction) => { setRooms(moveRoom(rooms, index, direction, walkthroughKey)); setActiveRoom(Math.max(0, Math.min(rooms.length - 1, index + direction))); }} onDelete={(index) => { const next = normalizeRooms(rooms.filter((_, i) => i !== index), walkthroughKey); setRooms(next); setActiveRoom(Math.max(0, index - 1)); }} errorRoomKeys={errorRoomKeys} hasGlobalIssue={hasUnresolvedGlobalIssue} />
        <div className="space-y-6">
          <WalkthroughRoomEditor room={currentRoom} onChange={(room) => updateRoom(activeRoom, room)} rooms={rooms} hasError={errorRoomKeys.has(currentRoom?.room_key)} previewSlot={<WalkthroughPreview room={currentRoom} rooms={rooms} activeIndex={activeRoom} tenantSlug={selectedTenant.slug} walkthroughKey={walkthroughKey} onNavigateRoom={setActiveRoom} />} />
        </div>
        <div>
          <Tabs defaultValue="pacing">
            <div className="mb-2 flex items-center gap-1.5">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="pacing">Pacing</TabsTrigger>
                <TabsTrigger value="quality">Quality</TabsTrigger>
                <TabsTrigger value="migration">Migration</TabsTrigger>
                <TabsTrigger value="rollout">Rollout</TabsTrigger>
              </TabsList>
              <HelpHint title="Side panels">
                <strong>Pacing</strong> shows the experience timeline and per-room intensity/duration.
                <strong> Quality</strong> shows content-completeness scores across all rooms.
                <strong> Migration</strong> checks readiness to migrate from any legacy data format.
                <strong> Rollout</strong> controls staged/full publishing to visitors.
              </HelpHint>
            </div>
            <TabsContent value="pacing"><ExperienceTimeline rooms={rooms} /></TabsContent>
            <TabsContent value="quality"><ExperienceQualityPanel rooms={rooms} /></TabsContent>
            <TabsContent value="migration"><MigrationReadinessPanel record={record} rooms={rooms} onSaveDraft={() => saveMutation.mutate("draft")} /></TabsContent>
            <TabsContent value="rollout"><RolloutControlPanel tenant={selectedTenant} record={record} rooms={rooms} walkthroughKey={walkthroughKey} onComplete={() => queryClient.invalidateQueries({ queryKey: ["tenant-walkthrough-config"] })} /></TabsContent>
          </Tabs>
        </div>
      </div>}

      {testPublishOpen && (
        <TestPublishOverlay rooms={testPublishRooms} tenantSlug={selectedTenant.slug} onClose={() => setTestPublishOpen(false)} />
      )}

      {editorMode === "easy" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <JourneyMap rooms={rooms} activeIndex={activeRoom} onSelect={setActiveRoom} onAdd={() => { const next = normalizeRooms([...rooms, createRoomByType(rooms.length, walkthroughKey, "walkthrough_exhibition")], walkthroughKey); setRooms(next); setActiveRoom(next.length - 1); }} onDuplicate={(index) => { const next = duplicateRoom(rooms, index, walkthroughKey); setRooms(next); setActiveRoom(index + 1); }} onMove={(index, direction) => { setRooms(moveRoom(rooms, index, direction, walkthroughKey)); setActiveRoom(Math.max(0, Math.min(rooms.length - 1, index + direction))); }} onDelete={(index) => { const next = normalizeRooms(rooms.filter((_, i) => i !== index), walkthroughKey); setRooms(next); setActiveRoom(Math.max(0, index - 1)); }} />
            <WalkthroughRoomEditor room={currentRoom} onChange={(room) => updateRoom(activeRoom, room)} rooms={rooms} previewSlot={<WalkthroughPreview room={currentRoom} rooms={rooms} activeIndex={activeRoom} tenantSlug={selectedTenant.slug} walkthroughKey={walkthroughKey} onNavigateRoom={setActiveRoom} />} />
          </div>
          <div>
            <Tabs defaultValue="pacing">
              <div className="mb-2 flex items-center gap-1.5">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="pacing">Pacing</TabsTrigger>
                  <TabsTrigger value="quality">Quality</TabsTrigger>
                </TabsList>
                <HelpHint title="Side panels">
                  <strong>Pacing</strong> shows the experience timeline and per-room intensity/duration.
                  <strong> Quality</strong> shows content-completeness scores across all rooms.
                </HelpHint>
              </div>
              <TabsContent value="pacing"><ExperienceTimeline rooms={rooms} /></TabsContent>
              <TabsContent value="quality"><ExperienceQualityPanel rooms={rooms} /></TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </main>
  );
}