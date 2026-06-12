import { useState } from "react";
import { ArrowDown, ArrowUp, Box, CheckCircle2, ChevronDown, Copy, DoorOpen, Eye, Plus, Sparkles, Trash2, Upload, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import HelpHint from "../HelpHint";
import SpritePhotoshopPanel from "../SpritePhotoshopPanel";
import { uploadFile } from "@/lib/upload";
import { THREE_D_WORLD_EDITOR_SEED, getMoodPreset, getObjectType, getWorldTemplate } from "@/lib/three-d-world-seed";
import {
  buildPublishManifest,
  buildSampleWorldConfig,
  computeThreeDWorldWarnings,
  createThreeDWorldConfig,
  estimateMobileWeight,
  evaluatePublishChecklist,
  getNavigationObjects,
  getThreeDWorldConfig,
  suggestOptimisations,
} from "@/lib/three-d-world-validation";

const SEED = THREE_D_WORLD_EDITOR_SEED;
const selectClass = "w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary";

// Object types that carry museum-grade metadata (provenance, sources, flags).
const METADATA_TYPES = new Set(["artifact_display", "image_frame", "memory_capsule", "text_panel"]);
const ALT_TEXT_TYPES = new Set(["image_frame", "artifact_display", "memory_capsule", "product_booth"]);
const TRANSCRIPT_TYPES = new Set(["audio_point", "video_wall"]);
// Object types that can show a transparent-PNG cutout ("sprite") instead of a frame/pedestal.
const SPRITE_TYPES = new Set(["artifact_display", "image_frame"]);

function blobToSpriteFile(blob, name = "sprite.png") {
  return new File([blob], name, { type: blob.type || "image/png" });
}

const snapValue = (value, step) => Math.round((Number(value) || 0) / step) * step;
const snapVector = (vector = {}) => ({ x: snapValue(vector.x, 0.5), y: snapValue(vector.y, 0.5), z: snapValue(vector.z, 0.5) });
const snapAngles = (vector = {}) => ({ x: snapValue(vector.x, 15), y: snapValue(vector.y, 15), z: snapValue(vector.z, 15) });

function prettify(value = "") {
  return String(value).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function Section({ index, title, hint, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-background/30">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-white/[0.03]">
        <span className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">{index}</span>
          <span className="text-sm font-semibold">{title}</span>
          {hint && <HelpHint title={title}>{hint}</HelpHint>}
        </span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="space-y-4 border-t border-white/10 p-4">{children}</div>}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="space-y-1.5">
      <span className="flex items-center gap-1.5"><Label>{label}</Label>{hint && <HelpHint title={label}>{hint}</HelpHint>}</span>
      {children}
    </label>
  );
}

function Toggle({ label, checked, onChange, hint }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
      {hint && <HelpHint title={label}>{hint}</HelpHint>}
    </label>
  );
}

function VectorInput({ label, value = {}, onChange }) {
  const update = (axis, raw) => onChange({ ...{ x: 0, y: 0, z: 0 }, ...value, [axis]: raw === "" ? 0 : Number(raw) });
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="grid grid-cols-3 gap-2">
        {["x", "y", "z"].map((axis) => (
          <div key={axis} className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase text-muted-foreground">{axis}</span>
            <Input type="number" step="0.1" value={value?.[axis] ?? 0} onChange={(e) => update(axis, e.target.value)} />
          </div>
        ))}
      </div>
    </div>
  );
}

// Primary media field differs per object type; map it so the generic
// object card always edits the right one.
const MEDIA_FIELD_BY_TYPE = { image_frame: "imageUrl", video_wall: "videoUrl", audio_point: "audioUrl", artifact_display: "modelUrl", memory_capsule: "mediaUrl", product_booth: "imageUrl", collectible: "iconUrl" };

const ANCHOR_QUICK_ADD = [
  { label: "Add Image", type: "image_frame" },
  { label: "Add Video", type: "video_wall" },
  { label: "Add Audio", type: "audio_point" },
  { label: "Add 3D Model", type: "artifact_display" },
  { label: "Add Text Story", type: "text_panel" },
  { label: "Add Product", type: "product_booth" },
  { label: "Add Quiz", type: "quiz_station" },
];

function newObject(type, count) {
  const definition = getObjectType(type);
  return {
    id: `obj_${type}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    type,
    title: `${definition?.name || prettify(type)} ${count + 1}`,
    description: "",
    position: { x: 0, y: 1, z: -3 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    clickAction: "open_popup",
    triggerRadius: 2,
    visible: true,
    lockCondition: "",
    anchorType: type === "door" || type === "portal" ? "door_label" : "wall_frame",
  };
}

export default function ThreeDWorldBuilder({ room, onChange, rooms = [] }) {
  const config = getThreeDWorldConfig(room);
  const setConfig = (patch) => onChange({ ...room, threeDWorldConfig: { ...(config || createThreeDWorldConfig()), ...patch } });
  const [newObjectType, setNewObjectType] = useState("image_frame");
  const [transformClipboard, setTransformClipboard] = useState(null);
  const [spriteUploads, setSpriteUploads] = useState({});

  // First visit for this room: offer a clean start or the seeded sample.
  if (!config) {
    return (
      <section className="space-y-4 rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
        <Box className="mx-auto h-10 w-10 text-primary" />
        <h3 className="font-display text-2xl font-bold">{SEED.editorName}</h3>
        <p className="mx-auto max-w-xl text-sm text-muted-foreground">{SEED.editorDescription}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={() => onChange({ ...room, threeDWorldConfig: createThreeDWorldConfig() })}><Wand2 className="h-4 w-4" /> Start Building</Button>
          <Button variant="outline" onClick={() => onChange({ ...room, threeDWorldConfig: buildSampleWorldConfig() })}><Sparkles className="h-4 w-4" /> Load Sample World (AOM Heritage Portal)</Button>
        </div>
      </section>
    );
  }

  const objects = config.objects || [];
  const template = getWorldTemplate(config.selectedTemplate);
  const mood = getMoodPreset(config.moodPreset);
  const navObjects = getNavigationObjects(config);
  const warnings = computeThreeDWorldWarnings(config, rooms);
  const requiredWarnings = warnings.filter((warning) => warning.severity === "required");
  const weight = estimateMobileWeight(config);
  const checklist = evaluatePublishChecklist(config, rooms);
  const optimisations = suggestOptimisations(warnings);
  const roomOptions = rooms.filter((entry) => entry.id !== room.id).map((entry) => ({ value: entry.id || entry.room_key, label: entry.title || entry.room_key || entry.id }));

  const updateObject = (id, patch) => setConfig({ objects: objects.map((object) => (object.id === id ? { ...object, ...patch } : object)) });
  const addObject = (type) => setConfig({ objects: [...objects, newObject(type, objects.length)] });
  const removeObject = (id) => setConfig({ objects: objects.filter((object) => object.id !== id) });
  const duplicateObject = (id) => {
    const source = objects.find((object) => object.id === id);
    if (!source) return;
    setConfig({ objects: [...objects, { ...JSON.parse(JSON.stringify(source)), id: `${source.id}_copy_${Date.now()}`, title: `${source.title || "Object"} (copy)` }] });
  };
  const moveObject = (id, direction) => {
    const index = objects.findIndex((object) => object.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= objects.length) return;
    const next = [...objects];
    [next[index], next[target]] = [next[target], next[index]];
    setConfig({ objects: next });
  };

  // Sprite import: turn an uploaded photo into a transparent-PNG cutout and use it
  // as this object's image, switching the object into sprite display mode.
  const setSpriteFile = (id, file) => setSpriteUploads((current) => ({ ...current, [id]: { file, status: "" } }));
  const clearSpriteUpload = (id) => setSpriteUploads((current) => { const next = { ...current }; delete next[id]; return next; });
  const setSpriteStatus = (id, status) => setSpriteUploads((current) => ({ ...current, [id]: { ...(current[id] || {}), status } }));
  const applySpriteImage = async (id, file) => {
    setSpriteStatus(id, "Uploading sprite…");
    try {
      const { file_url } = await uploadFile(file);
      updateObject(id, { imageUrl: file_url, spriteMode: true });
      clearSpriteUpload(id);
    } catch {
      setSpriteStatus(id, "Upload failed. Please try again.");
    }
  };
  const acceptSpriteCutout = (id, { blob }) => applySpriteImage(id, blobToSpriteFile(blob));
  const acceptOriginalSpriteImage = (id) => {
    const file = spriteUploads[id]?.file;
    if (file) applySpriteImage(id, file);
  };

  const applyTemplate = (templateId) => {
    const selected = getWorldTemplate(templateId);
    if (!selected) { setConfig({ selectedTemplate: "" }); return; }
    setConfig({ selectedTemplate: templateId, moodPreset: config.moodPreset || selected.defaultMood, movementMode: selected.defaultMovement || config.movementMode });
  };

  const applyNpcType = (npcId) => {
    const npc = SEED.npcGuideSeed.defaultNPCs.find((entry) => entry.id === npcId);
    if (!npc) { setConfig({ npcGuide: { ...config.npcGuide, npcType: "" } }); return; }
    setConfig({ npcGuide: { ...config.npcGuide, npcType: npc.id, avatarStyle: npc.avatarStyle, tone: npc.tone, openingLine: config.npcGuide?.openingLine || npc.openingLine } });
  };

  const gamification = config.gamification || {};
  const npcGuide = config.npcGuide || {};
  const accessibility = config.accessibility || {};
  const setAccessibility = (patch) => setConfig({ accessibility: { ...accessibility, ...patch } });
  const previewMode = SEED.previewModes.find((mode) => mode.id === config.previewMode) || SEED.previewModes[0];

  // Publishing snapshots the world into version history with a deterministic
  // fingerprint, so the live version is locked and can always be restored.
  const publishWorld = () => {
    if (config.publishStatus === "published") {
      setConfig({ publishStatus: "draft" });
      return;
    }
    const manifest = buildPublishManifest(config);
    const snapshot = JSON.parse(JSON.stringify(config));
    delete snapshot.versionHistory;
    delete snapshot.publishManifest;
    const history = [
      ...(config.versionHistory || []),
      { versionId: manifest.versionId, publishedAt: new Date().toISOString(), contentHash: manifest.contentHash, snapshot },
    ].slice(-5);
    setConfig({ publishStatus: "published", publishManifest: manifest, versionHistory: history, versionCounter: (Number(config.versionCounter) || 0) + 1 });
  };

  const restoreVersion = (entry) => {
    if (!entry?.snapshot) return;
    onChange({
      ...room,
      threeDWorldConfig: {
        ...JSON.parse(JSON.stringify(entry.snapshot)),
        enabled: true,
        versionHistory: config.versionHistory || [],
        versionCounter: Number(config.versionCounter) || 0,
        publishManifest: null,
        publishStatus: "draft",
      },
    });
  };

  return (
    <section className="space-y-3 rounded-2xl border border-primary/15 bg-primary/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Box className="h-5 w-5 text-primary" />
          <h3 className="font-display text-lg font-bold">{SEED.editorName}</h3>
          <HelpHint title="3D World Builder">{SEED.editorDescription} Everything you set here is saved with this room and only applies when the room type is 3D World.</HelpHint>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className={`rounded-full px-2.5 py-1 font-semibold ${config.publishStatus === "published" ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>{config.publishStatus === "published" ? "World published" : "World draft"}</span>
          <span className="rounded-full bg-background/50 px-2.5 py-1 text-muted-foreground">{objects.length} objects</span>
          {requiredWarnings.length > 0 && <span className="rounded-full bg-rose-500/15 px-2.5 py-1 text-rose-300">{requiredWarnings.length} blocking</span>}
        </div>
      </div>

      <Section index={1} title="World Template" hint="Pick the starting style of this world. The template sets sensible defaults for mood and movement — you can change everything afterwards.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Template">
            <select className={selectClass} value={config.selectedTemplate || ""} onChange={(e) => applyTemplate(e.target.value)}>
              <option value="">Choose a template…</option>
              {SEED.worldTemplates.map((entry) => <option key={entry.id} value={entry.id}>{entry.name} — {entry.category}</option>)}
            </select>
          </Field>
          {template && (
            <div className="rounded-xl border border-white/10 bg-background/40 p-3 text-xs">
              <p className="text-muted-foreground">{template.description}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {template.bestFor.map((tag) => <span key={tag} className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">{tag}</span>)}
              </div>
              <p className="mt-2 text-muted-foreground">Recommended object limit: <strong className="text-foreground">{template.recommendedObjectLimit}</strong></p>
            </div>
          )}
        </div>
      </Section>

      <Section index={2} title="Environment & Mood" hint="The mood preset controls lighting, music, colour, fog, and glow together. Override any single value if you need something specific.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Mood preset">
            <select className={selectClass} value={config.moodPreset || ""} onChange={(e) => setConfig({ moodPreset: e.target.value })}>
              <option value="">Choose a mood…</option>
              {SEED.moodPresets.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
            </select>
          </Field>
          {mood && <div className="rounded-xl border border-white/10 bg-background/40 p-3 text-xs text-muted-foreground">Feels: <em className="text-foreground">{mood.emotionalTone}</em></div>}
          <Field label="Lighting style"><Input value={config.lightingOverride || mood?.lighting || ""} onChange={(e) => setConfig({ lightingOverride: e.target.value })} placeholder="From mood preset" /></Field>
          <Field label="Background music"><Input value={config.backgroundMusicOverride || mood?.backgroundMusic || ""} onChange={(e) => setConfig({ backgroundMusicOverride: e.target.value })} placeholder="From mood preset" /></Field>
          <Field label="Colour tone"><Input value={config.colorToneOverride || mood?.colorTone || ""} onChange={(e) => setConfig({ colorToneOverride: e.target.value })} placeholder="From mood preset" /></Field>
          <Field label="Fog">
            <select className={selectClass} value={config.fogOverride || String(mood?.fog ?? "false")} onChange={(e) => setConfig({ fogOverride: e.target.value })}>
              {["false", "light", "medium", "heavy"].map((level) => <option key={level} value={level}>{level === "false" ? "None" : prettify(level)}</option>)}
            </select>
          </Field>
          <Field label="Glow">
            <select className={selectClass} value={config.glowOverride || mood?.glow || "none"} onChange={(e) => setConfig({ glowOverride: e.target.value })}>
              {["none", "subtle", "soft", "medium", "strong", "spotlight"].map((level) => <option key={level} value={level}>{prettify(level)}</option>)}
            </select>
          </Field>
          <Field label="Atmosphere effect" hint="Decorative particles like dust or snow. Automatically reduced on phones and disabled in reduced-motion mode.">
            <select className={selectClass} value={config.atmosphereEffect || "none"} onChange={(e) => setConfig({ atmosphereEffect: e.target.value })}>
              {SEED.atmosphereEffects.map((effect) => <option key={effect.id} value={effect.id}>{effect.name}</option>)}
            </select>
          </Field>
          <Field label="Background music URL" hint="Optional looping music. Visitors get a mute toggle and it never plays before their first tap.">
            <Input value={config.backgroundMusicUrl || ""} placeholder="https://…" onChange={(e) => setConfig({ backgroundMusicUrl: e.target.value })} />
          </Field>
        </div>
      </Section>

      <Section index={3} title="Room Layout" hint="Shape and surfaces of the world, the visitor starting point, and named zones that organise the space.">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Room size">
            <select className={selectClass} value={config.roomSize || "medium"} onChange={(e) => setConfig({ roomSize: e.target.value })}>
              {SEED.roomLayoutOptions.roomSizes.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
            </select>
          </Field>
          <Field label="Layout shape">
            <select className={selectClass} value={config.layoutShape || "single_room"} onChange={(e) => setConfig({ layoutShape: e.target.value })}>
              {SEED.roomLayoutOptions.layoutShapes.map((shape) => <option key={shape} value={shape}>{prettify(shape)}</option>)}
            </select>
          </Field>
          <Field label="Spawn point" hint="Where visitors appear when they enter this world.">
            <select className={selectClass} value={typeof config.spawnPoint === "string" ? config.spawnPoint : "custom_xyz"} onChange={(e) => setConfig({ spawnPoint: e.target.value })}>
              {SEED.roomLayoutOptions.spawnPointOptions.map((option) => <option key={option} value={option}>{prettify(option)}</option>)}
            </select>
          </Field>
          <Field label="Wall style">
            <select className={selectClass} value={config.wallStyle || ""} onChange={(e) => setConfig({ wallStyle: e.target.value })}>
              {SEED.roomLayoutOptions.wallStyles.map((style) => <option key={style} value={style}>{prettify(style)}</option>)}
            </select>
          </Field>
          <Field label="Floor style">
            <select className={selectClass} value={config.floorStyle || ""} onChange={(e) => setConfig({ floorStyle: e.target.value })}>
              {SEED.roomLayoutOptions.floorStyles.map((style) => <option key={style} value={style}>{prettify(style)}</option>)}
            </select>
          </Field>
          <Field label="Ceiling style">
            <select className={selectClass} value={config.ceilingStyle || ""} onChange={(e) => setConfig({ ceilingStyle: e.target.value })}>
              {SEED.roomLayoutOptions.ceilingStyles.map((style) => <option key={style} value={style}>{prettify(style)}</option>)}
            </select>
          </Field>
        </div>
        {config.spawnPoint === "custom_xyz" && <VectorInput label="Custom spawn position" value={config.spawnPointCustom} onChange={(value) => setConfig({ spawnPointCustom: value })} />}
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Zones</p>
          <Button size="sm" variant="outline" onClick={() => setConfig({ zones: [...(config.zones || []), { id: `zone_${Date.now()}`, name: `Zone ${(config.zones || []).length + 1}`, description: "" }] })}><Plus className="h-3.5 w-3.5" /> Add zone</Button>
        </div>
        {(config.zones || []).map((zone, index) => (
          <div key={zone.id || index} className="grid gap-2 rounded-xl border border-white/10 bg-background/40 p-3 md:grid-cols-[1fr_2fr_auto]">
            <Input value={zone.name || ""} placeholder="Zone name" onChange={(e) => setConfig({ zones: config.zones.map((entry, i) => (i === index ? { ...entry, name: e.target.value } : entry)) })} />
            <Input value={zone.description || ""} placeholder="What happens in this zone" onChange={(e) => setConfig({ zones: config.zones.map((entry, i) => (i === index ? { ...entry, description: e.target.value } : entry)) })} />
            <Button size="icon" variant="ghost" onClick={() => setConfig({ zones: config.zones.filter((_, i) => i !== index) })}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
      </Section>

      <Section index={4} title="Visitor Movement" hint="How visitors travel through this world. Guided options are easiest for first-time visitors; free walk suits explorers.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Movement mode">
            <select className={selectClass} value={config.movementMode || "click_to_move"} onChange={(e) => setConfig({ movementMode: e.target.value })}>
              {SEED.visitorMovementModes.map((mode) => <option key={mode.id} value={mode.id}>{mode.name}</option>)}
            </select>
          </Field>
          <div className="rounded-xl border border-white/10 bg-background/40 p-3 text-xs text-muted-foreground">{SEED.visitorMovementModes.find((mode) => mode.id === config.movementMode)?.description}</div>
        </div>
        <div className="flex flex-wrap gap-6">
          <Toggle label="Mobile controls" checked={config.mobileControls !== false} onChange={(value) => setConfig({ mobileControls: value })} hint="Show on-screen joystick and tap controls for phone visitors." />
          <Toggle label="Guided path" checked={!!config.guidedPathEnabled} onChange={(value) => setConfig({ guidedPathEnabled: value })} hint="Draw a suggested route through the world." />
          <Toggle label="Auto walkthrough" checked={!!config.autoWalkthroughEnabled} onChange={(value) => setConfig({ autoWalkthroughEnabled: value })} hint="Camera tours the world automatically, like a cinematic trailer." />
        </div>
      </Section>

      <Section index={5} title="Object Library" hint="Everything placed inside the world is an object. Add from the library, then fine-tune each one in Interactive Objects below.">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Object type">
            <select className={selectClass} value={newObjectType} onChange={(e) => setNewObjectType(e.target.value)}>
              {SEED.objectLibrary.map((entry) => <option key={entry.id} value={entry.id}>{entry.name} — {entry.category}</option>)}
            </select>
          </Field>
          <Button onClick={() => addObject(newObjectType)}><Plus className="h-4 w-4" /> Add object</Button>
        </div>
        {objects.length === 0 && <p className="text-xs text-muted-foreground">No objects yet. Add your first object above, use the quick-add buttons in Media & Content Anchors, or load the sample world.</p>}
        <div className="space-y-2">
          {objects.map((object, index) => (
            <div key={object.id || index} className="flex items-center gap-2 rounded-xl border border-white/10 bg-background/40 px-3 py-2">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">{getObjectType(object.type)?.name || prettify(object.type)}</span>
              <span className="min-w-0 flex-1 truncate text-sm">{object.title || object.name || object.label || <em className="text-rose-300">Untitled</em>}</span>
              <Button size="icon" variant="ghost" title="Move up" disabled={index === 0} onClick={() => moveObject(object.id, -1)}><ArrowUp className="h-3.5 w-3.5" /></Button>
              <Button size="icon" variant="ghost" title="Move down" disabled={index === objects.length - 1} onClick={() => moveObject(object.id, 1)}><ArrowDown className="h-3.5 w-3.5" /></Button>
              <Button size="icon" variant="ghost" title="Duplicate" onClick={() => duplicateObject(object.id)}><Copy className="h-3.5 w-3.5" /></Button>
              <Button size="icon" variant="ghost" title="Delete" onClick={() => removeObject(object.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          ))}
        </div>
      </Section>

      <Section index={6} title="Interactive Objects" hint="Full control over every object: where it sits, how big it is, what media it shows, and what happens when a visitor interacts with it." defaultOpen={objects.length > 0}>
        {objects.length === 0 && <p className="text-xs text-muted-foreground">Add objects in the Object Library first.</p>}
        <div className="space-y-3">
          {objects.map((object) => {
            const mediaField = MEDIA_FIELD_BY_TYPE[object.type];
            return (
              <details key={object.id} className="rounded-xl border border-white/10 bg-background/40">
                <summary className="cursor-pointer px-4 py-2.5 text-sm font-semibold">{object.title || object.name || "Untitled"} <span className="ml-2 text-xs font-normal text-muted-foreground">{getObjectType(object.type)?.name || prettify(object.type)}</span></summary>
                <div className="space-y-3 border-t border-white/10 p-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Title"><Input value={object.title || ""} onChange={(e) => updateObject(object.id, { title: e.target.value })} /></Field>
                    <Field label="Description"><Input value={object.description || object.body || object.story || ""} onChange={(e) => updateObject(object.id, { description: e.target.value })} /></Field>
                    {mediaField && <Field label={`Media URL (${prettify(mediaField.replace("Url", ""))})`}><Input value={object[mediaField] || ""} placeholder="https://…" onChange={(e) => updateObject(object.id, { [mediaField]: e.target.value })} /></Field>}
                    <Field label="Click action" hint="What happens when a visitor clicks this object.">
                      <select className={selectClass} value={object.clickAction || "open_popup"} onChange={(e) => updateObject(object.id, { clickAction: e.target.value })}>
                        {SEED.interactionTypes.map((action) => <option key={action.id} value={action.id}>{action.name}</option>)}
                      </select>
                    </Field>
                    <Field label="Trigger radius" hint="How close (in metres) the visitor must be before this object activates."><Input type="number" step="0.5" min="0" value={object.triggerRadius ?? 2} onChange={(e) => updateObject(object.id, { triggerRadius: Number(e.target.value) })} /></Field>
                    <Field label="Lock condition" hint="Leave empty for always available. Example: visitor_collects_first_memory"><Input value={object.lockCondition || object.unlockCondition || ""} onChange={(e) => updateObject(object.id, { lockCondition: e.target.value })} /></Field>
                    {ALT_TEXT_TYPES.has(object.type) && (
                      <Field label="Alt text" hint="Screen-reader description of this object's image."><Input value={object.altText || ""} onChange={(e) => updateObject(object.id, { altText: e.target.value })} /></Field>
                    )}
                    {TRANSCRIPT_TYPES.has(object.type) && (
                      <Field label="Transcript" hint="Text version of the audio or video, for deaf and hard-of-hearing visitors.">
                        <Textarea rows={2} value={object.transcript || ""} onChange={(e) => updateObject(object.id, { transcript: e.target.value })} />
                      </Field>
                    )}
                  </div>
                  {SPRITE_TYPES.has(object.type) && (
                    <div className="space-y-2 rounded-lg border border-white/10 bg-background/30 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <Toggle label="Sprite cutout (transparent PNG)" checked={!!object.spriteMode} onChange={(value) => updateObject(object.id, { spriteMode: value })} hint="Shows the image as a flat, transparent-background cutout instead of inside a frame or pedestal box — great for artifact photos with the background removed." />
                          {object.spriteMode && (
                            <Toggle label="Always face viewer (billboard)" checked={!!object.billboard} onChange={(value) => updateObject(object.id, { billboard: value })} hint="The cutout rotates to always face the visitor, like a classic 2D sprite." />
                          )}
                        </div>
                        <Button size="sm" variant="outline" asChild>
                          <label className="cursor-pointer">
                            <Upload className="h-3.5 w-3.5" /> Import sprite from photo
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) setSpriteFile(object.id, file); }} />
                          </label>
                        </Button>
                      </div>
                      {spriteUploads[object.id]?.file && (
                        <SpritePhotoshopPanel
                          file={spriteUploads[object.id].file}
                          onAccept={(payload) => acceptSpriteCutout(object.id, payload)}
                          onUseOriginal={() => acceptOriginalSpriteImage(object.id)}
                          onCancel={() => clearSpriteUpload(object.id)}
                        />
                      )}
                      {spriteUploads[object.id]?.status && <p className="text-xs text-muted-foreground">{spriteUploads[object.id].status}</p>}
                    </div>
                  )}
                  <div className="grid gap-3 md:grid-cols-3">
                    <VectorInput label="Position" value={object.position} onChange={(value) => updateObject(object.id, { position: value })} />
                    <VectorInput label="Rotation" value={object.rotation} onChange={(value) => updateObject(object.id, { rotation: value })} />
                    <VectorInput label="Scale" value={object.scale} onChange={(value) => updateObject(object.id, { scale: value })} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => setTransformClipboard(JSON.parse(JSON.stringify({ position: object.position || { x: 0, y: 0, z: 0 }, rotation: object.rotation || { x: 0, y: 0, z: 0 }, scale: object.scale || { x: 1, y: 1, z: 1 } })))}>Copy transform</Button>
                    <Button size="sm" variant="outline" disabled={!transformClipboard} onClick={() => transformClipboard && updateObject(object.id, JSON.parse(JSON.stringify(transformClipboard)))}>Paste transform</Button>
                    <Button size="sm" variant="outline" onClick={() => updateObject(object.id, { position: snapVector(object.position), rotation: snapAngles(object.rotation) })}>Snap to grid</Button>
                    <Button size="sm" variant="outline" onClick={() => updateObject(object.id, { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } })}>Reset transform</Button>
                  </div>
                  {METADATA_TYPES.has(object.type) && (
                    <details className="rounded-lg border border-white/10 bg-background/30 p-3">
                      <summary className="cursor-pointer text-xs font-semibold uppercase tracking-widest text-muted-foreground">Museum metadata & cultural safety (optional)</summary>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <Field label="Creator / maker"><Input value={object.creator || ""} onChange={(e) => updateObject(object.id, { creator: e.target.value })} /></Field>
                        <Field label="Period / date"><Input value={object.period || ""} onChange={(e) => updateObject(object.id, { period: e.target.value })} /></Field>
                        <Field label="Culture / origin"><Input value={object.culture || ""} onChange={(e) => updateObject(object.id, { culture: e.target.value })} /></Field>
                        <Field label="Material / technique"><Input value={object.material || ""} onChange={(e) => updateObject(object.id, { material: e.target.value })} /></Field>
                        <Field label="Provenance"><Input value={object.provenance || ""} onChange={(e) => updateObject(object.id, { provenance: e.target.value })} /></Field>
                        <Field label="Source citation" hint="Required when the claim status is Curator Verified."><Input value={object.sourceCitation || ""} onChange={(e) => updateObject(object.id, { sourceCitation: e.target.value })} /></Field>
                        <Field label="Claim status" hint="Visitors see this honestly — verified, interpretation, or disputed.">
                          <select className={selectClass} value={object.curatorialStatus || ""} onChange={(e) => updateObject(object.id, { curatorialStatus: e.target.value })}>
                            {SEED.curatorialSeed.statuses.map((status) => <option key={status.id} value={status.id}>{status.name}</option>)}
                          </select>
                        </Field>
                        <Field label="Cultural sensitivity" hint="Flagged objects get a respectful notice and should not be gamified.">
                          <select className={selectClass} value={object.sensitivity || "none"} onChange={(e) => updateObject(object.id, { sensitivity: e.target.value })}>
                            {SEED.curatorialSeed.sensitivityFlags.map((flag) => <option key={flag.id} value={flag.id}>{flag.name}</option>)}
                          </select>
                        </Field>
                      </div>
                    </details>
                  )}
                  <Toggle label="Visible to visitors" checked={object.visible !== false} onChange={(value) => updateObject(object.id, { visible: value })} />
                </div>
              </details>
            );
          })}
        </div>
      </Section>

      <Section index={7} title="Doors, Portals & Room Linking" hint="Connect this world to the rest of the museum. Every world needs at least one working exit before it can be published.">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => addObject("door")}><DoorOpen className="h-4 w-4" /> Add door</Button>
          <Button variant="outline" onClick={() => addObject("portal")}><Sparkles className="h-4 w-4" /> Add portal</Button>
        </div>
        {navObjects.length === 0 && <p className="text-xs text-rose-300">No doors or portals yet — this world has no exit.</p>}
        <div className="space-y-3">
          {navObjects.map((object) => (
            <div key={object.id} className="grid gap-3 rounded-xl border border-white/10 bg-background/40 p-4 md:grid-cols-2">
              <Field label={`${prettify(object.type)} name`}><Input value={object.title || ""} onChange={(e) => updateObject(object.id, { title: e.target.value })} /></Field>
              <Field label="Destination room" hint="Pick a room from this museum, or type an external room id.">
                <div className="flex gap-2">
                  <select className={selectClass} value={roomOptions.some((option) => option.value === object.destinationRoomId) ? object.destinationRoomId : ""} onChange={(e) => e.target.value && updateObject(object.id, { destinationRoomId: e.target.value })}>
                    <option value="">Choose room…</option>
                    {roomOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                  <Input value={object.destinationRoomId || ""} placeholder="or type room id" onChange={(e) => updateObject(object.id, { destinationRoomId: e.target.value })} />
                </div>
              </Field>
              <Field label="Door type">
                <select className={selectClass} value={object.doorType || (object.type === "portal" ? "glowing_portal" : "normal_door")} onChange={(e) => updateObject(object.id, { doorType: e.target.value })}>
                  {SEED.doorAndPortalSystem.doorTypes.map((doorType) => <option key={doorType} value={doorType}>{prettify(doorType)}</option>)}
                </select>
              </Field>
              <Field label="Transition style">
                <select className={selectClass} value={object.transitionStyle || "fade"} onChange={(e) => updateObject(object.id, { transitionStyle: e.target.value })}>
                  {SEED.doorAndPortalSystem.transitionStyles.map((style) => <option key={style} value={style}>{prettify(style)}</option>)}
                </select>
              </Field>
              <Toggle label="Locked" checked={!!object.locked} onChange={(value) => updateObject(object.id, { locked: value })} hint="Locked doors need an unlock condition, e.g. collecting an item." />
              {object.locked && <Field label="Unlock condition"><Input value={object.unlockCondition || ""} placeholder="e.g. visitor_collects_first_memory" onChange={(e) => updateObject(object.id, { unlockCondition: e.target.value })} /></Field>}
            </div>
          ))}
        </div>
        {warnings.filter((warning) => warning.id === "broken_door_link").map((warning, index) => (
          <p key={index} className="text-xs text-rose-300">⚠ {warning.message}</p>
        ))}
      </Section>

      <Section index={8} title="Media & Content Anchors" hint="Quick-add the most common content holders. Each becomes an object you can position and edit above.">
        <div className="flex flex-wrap gap-2">
          {ANCHOR_QUICK_ADD.map((entry) => (
            <Button key={entry.type + entry.label} size="sm" variant="outline" onClick={() => addObject(entry.type)}><Plus className="h-3.5 w-3.5" /> {entry.label}</Button>
          ))}
        </div>
        <div className="rounded-xl border border-white/10 bg-background/40 p-3 text-xs text-muted-foreground">
          <p className="mb-1 font-semibold text-foreground">Media guidelines</p>
          <ul className="list-inside list-disc space-y-0.5">
            {SEED.mediaAnchors.mediaRules.map((rule) => <li key={rule}>{rule}</li>)}
          </ul>
        </div>
      </Section>

      <Section index={9} title="Gamification Layer" hint="Optional play layer: collectibles, quests, badges, and unlockable doors that reward exploration." defaultOpen={!!gamification.enabled}>
        <Toggle label="Enable gamification" checked={!!gamification.enabled} onChange={(value) => setConfig({ gamification: { ...gamification, enabled: value } })} />
        {gamification.enabled && (
          <>
            <div className="grid gap-2 md:grid-cols-3">
              {SEED.gamificationSeed.availableSystems.map((system) => (
                <label key={system.id} className="flex items-start gap-2 rounded-xl border border-white/10 bg-background/40 p-3 text-xs">
                  <input type="checkbox" checked={(gamification.systems || []).includes(system.id)} onChange={(e) => setConfig({ gamification: { ...gamification, systems: e.target.checked ? [...(gamification.systems || []), system.id] : (gamification.systems || []).filter((id) => id !== system.id) } })} />
                  <span><strong>{system.name}</strong><br /><span className="text-muted-foreground">{system.description}</span></span>
                </label>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Collectibles</p>
              <Button size="sm" variant="outline" onClick={() => setConfig({ gamification: { ...gamification, collectibles: [...(gamification.collectibles || []), { id: `collectible_${Date.now()}`, name: "New Collectible", description: "", rewardPoints: 10, unlocks: [] }] } })}><Plus className="h-3.5 w-3.5" /> Add collectible</Button>
            </div>
            {(gamification.collectibles || []).map((collectible, index) => (
              <div key={collectible.id || index} className="grid gap-2 rounded-xl border border-white/10 bg-background/40 p-3 md:grid-cols-[1fr_2fr_auto_auto]">
                <Input value={collectible.name || ""} placeholder="Name" onChange={(e) => setConfig({ gamification: { ...gamification, collectibles: gamification.collectibles.map((entry, i) => (i === index ? { ...entry, name: e.target.value } : entry)) } })} />
                <Input value={collectible.description || ""} placeholder="What it unlocks or means" onChange={(e) => setConfig({ gamification: { ...gamification, collectibles: gamification.collectibles.map((entry, i) => (i === index ? { ...entry, description: e.target.value } : entry)) } })} />
                <Input type="number" className="w-24" value={collectible.rewardPoints ?? 10} title="Reward points" onChange={(e) => setConfig({ gamification: { ...gamification, collectibles: gamification.collectibles.map((entry, i) => (i === index ? { ...entry, rewardPoints: Number(e.target.value) } : entry)) } })} />
                <Button size="icon" variant="ghost" onClick={() => setConfig({ gamification: { ...gamification, collectibles: gamification.collectibles.filter((_, i) => i !== index) } })}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Quest steps" hint="One mission per line. Visitors complete them in order.">
                <Textarea rows={3} value={(gamification.questSteps || []).join("\n")} placeholder={"Find the first memory\nVisit the portal hall"} onChange={(e) => setConfig({ gamification: { ...gamification, questSteps: e.target.value.split("\n").filter(Boolean) } })} />
              </Field>
              <div className="space-y-3">
                <Field label="Badges" hint="One badge name per line.">
                  <Textarea rows={2} value={(gamification.badges || []).join("\n")} placeholder="Heritage Explorer" onChange={(e) => setConfig({ gamification: { ...gamification, badges: e.target.value.split("\n").filter(Boolean) } })} />
                </Field>
                <Field label="Completion reward">
                  <select className={selectClass} value={gamification.completionReward || ""} onChange={(e) => setConfig({ gamification: { ...gamification, completionReward: e.target.value } })}>
                    <option value="">No reward</option>
                    {SEED.gamificationSeed.defaultRewards.map((reward) => <option key={reward} value={reward}>{reward}</option>)}
                  </select>
                </Field>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Tip: to make a door unlockable, add a Door in section 7, set it to Locked, and use a collectible name as the unlock condition.</p>
          </>
        )}
      </Section>

      <Section index={10} title="NPC / Guide Layer" hint="A friendly virtual guide that welcomes visitors and explains the room. Keep lines short — under 24 words." defaultOpen={!!npcGuide.enabled}>
        <Toggle label="Enable NPC guide" checked={!!npcGuide.enabled} onChange={(value) => setConfig({ npcGuide: { ...npcGuide, enabled: value } })} />
        {npcGuide.enabled && (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Guide type">
              <select className={selectClass} value={npcGuide.npcType || ""} onChange={(e) => applyNpcType(e.target.value)}>
                <option value="">Choose a guide…</option>
                {SEED.npcGuideSeed.defaultNPCs.map((npc) => <option key={npc.id} value={npc.id}>{npc.name}</option>)}
              </select>
            </Field>
            <Field label="Trigger" hint="When the guide starts talking.">
              <select className={selectClass} value={npcGuide.triggerType || "on_room_start"} onChange={(e) => setConfig({ npcGuide: { ...npcGuide, triggerType: e.target.value } })}>
                {SEED.npcGuideSeed.triggerOptions.map((trigger) => <option key={trigger} value={trigger}>{prettify(trigger.replace(/^on_/, ""))}</option>)}
              </select>
            </Field>
            <Field label="Opening line"><Input value={npcGuide.openingLine || ""} onChange={(e) => setConfig({ npcGuide: { ...npcGuide, openingLine: e.target.value } })} /></Field>
            <Field label="Tone"><Input value={npcGuide.tone || ""} onChange={(e) => setConfig({ npcGuide: { ...npcGuide, tone: e.target.value } })} /></Field>
            <Field label="Guide script" hint="The full explanation the guide gives. Simple language, short sentences, always say what to do next.">
              <Textarea rows={3} value={npcGuide.script || ""} onChange={(e) => setConfig({ npcGuide: { ...npcGuide, script: e.target.value } })} />
            </Field>
            <Field label="Dialogue steps" hint="One line per step. Each line should be under 24 words and explain the next action.">
              <Textarea rows={3} value={(npcGuide.dialogueSteps || []).join("\n")} placeholder={"Welcome to the room\nStart with the memory wall"} onChange={(e) => setConfig({ npcGuide: { ...npcGuide, dialogueSteps: e.target.value.split("\n").filter(Boolean) } })} />
            </Field>
          </div>
        )}
      </Section>

      <Section index={11} title="Accessibility & Comfort" hint="Accessibility is a publish check, not an afterthought. Alt text and transcripts live on each object above; these settings shape the whole room.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Sensory warning" hint="Shown when visitors enter, e.g. 'This room contains wartime audio.' Leave empty for none.">
            <Input value={accessibility.sensoryWarning || ""} onChange={(e) => setAccessibility({ sensoryWarning: e.target.value })} />
          </Field>
          <Field label="Visitor text size">
            <select className={selectClass} value={accessibility.textScale || "normal"} onChange={(e) => setAccessibility({ textScale: e.target.value })}>
              {SEED.accessibilitySeed.textScales.map((scale) => <option key={scale.id} value={scale.id}>{scale.name}</option>)}
            </select>
          </Field>
        </div>
        <div className="flex flex-wrap gap-6">
          <Toggle label="High contrast HUD" checked={!!accessibility.highContrast} onChange={(value) => setAccessibility({ highContrast: value })} hint="Stronger panel backgrounds for low-vision visitors." />
          <Toggle label="2D accessible view" checked={accessibility.twoDFallbackEnabled !== false} onChange={(value) => setAccessibility({ twoDFallbackEnabled: value })} hint="Lets visitors browse this room as a readable list — vital for screen readers and low-end devices." />
          <Toggle label="Mini-map" checked={accessibility.miniMapEnabled !== false} onChange={(value) => setAccessibility({ miniMapEnabled: value })} hint="Top-down map so visitors never feel lost." />
        </div>
        <div className="rounded-xl border border-white/10 bg-background/40 p-3 text-xs text-muted-foreground">
          <p className="mb-1 font-semibold text-foreground">Accessibility guidelines</p>
          <ul className="list-inside list-disc space-y-0.5">
            {SEED.accessibilitySeed.rules.map((rule) => <li key={rule}>{rule}</li>)}
          </ul>
        </div>
      </Section>

      <Section index={12} title="Performance & Mobile Optimisation" hint="SCAVerse worlds are mobile-first. This panel estimates how heavy the world is for phones and suggests fixes.">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-background/40 p-3 text-center">
            <p className="text-2xl font-bold">{weight.objectCount}</p>
            <p className="text-xs text-muted-foreground">objects (mobile limit {config.performanceSettings?.maxObjectsMobile || SEED.performanceRules.defaultMaxObjectsMobile})</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-background/40 p-3 text-center">
            <p className={`text-2xl font-bold ${weight.band === "heavy" ? "text-rose-300" : weight.band === "moderate" ? "text-amber-300" : "text-emerald-300"}`}>{weight.weight}/100</p>
            <p className="text-xs text-muted-foreground">estimated mobile weight ({weight.band})</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-background/40 p-3 text-center">
            <p className="text-2xl font-bold">{warnings.length}</p>
            <p className="text-xs text-muted-foreground">active warnings</p>
          </div>
        </div>
        {warnings.length > 0 && (
          <ul className="space-y-1.5">
            {warnings.map((warning, index) => (
              <li key={index} className={`rounded-lg border px-3 py-2 text-xs ${warning.severity === "required" ? "border-rose-400/30 bg-rose-400/10 text-rose-200" : "border-amber-400/30 bg-amber-400/10 text-amber-200"}`}>
                {warning.severity === "required" ? "Blocking: " : "Recommended: "}{warning.message}
              </li>
            ))}
          </ul>
        )}
        {optimisations.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-background/40 p-3 text-xs">
            <p className="mb-1 font-semibold text-foreground">Suggested optimisations</p>
            <div className="flex flex-wrap gap-1.5">{optimisations.map((action) => <span key={action} className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">{prettify(action)}</span>)}</div>
          </div>
        )}
      </Section>

      <Section index={13} title="Preview & Publish Checks" hint="Check the world from every angle before it goes live. Required checks block publishing; recommended ones can be confirmed and accepted.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Preview mode">
            <select className={selectClass} value={config.previewMode || "admin_preview"} onChange={(e) => setConfig({ previewMode: e.target.value })}>
              {SEED.previewModes.map((mode) => <option key={mode.id} value={mode.id}>{mode.name}</option>)}
            </select>
          </Field>
          <div className="rounded-xl border border-white/10 bg-background/40 p-3 text-xs text-muted-foreground"><Eye className="mb-1 h-4 w-4 text-primary" /> {previewMode.description}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-background/40 p-3 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground">{previewMode.name} summary</p>
          <p className="mt-1">{template ? template.name : "No template"} · {mood ? mood.name : "No mood"} · {prettify(config.roomSize || "medium")} {prettify(config.layoutShape || "single_room")} · {objects.length} objects · {navObjects.length} exits · {(config.zones || []).length} zones{config.previewMode === "mobile_preview" ? ` · mobile weight ${weight.weight}/100 (${weight.band})` : ""}{config.previewMode === "guided_tour_preview" ? ` · path: ${(config.zones || []).map((zone) => zone.name).join(" → ") || "no zones defined"}` : ""}</p>
        </div>
        <Toggle label="I have checked the visitor preview" checked={!!config.previewChecked} onChange={(value) => setConfig({ previewChecked: value })} />
        <div className="space-y-1.5">
          {checklist.results.map((item) => (
            <div key={item.id} className="flex items-center gap-2 text-xs">
              {item.passed ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" /> : <span className={`h-3.5 w-3.5 rounded-full border-2 ${item.severity === "required" ? "border-rose-400" : "border-amber-400"}`} />}
              <span className={item.passed ? "text-muted-foreground" : "text-foreground"}>{item.label}</span>
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${item.severity === "required" ? "bg-rose-500/15 text-rose-300" : "bg-amber-500/15 text-amber-300"}`}>{item.severity}</span>
            </div>
          ))}
        </div>
        {checklist.recommendedFailures.length > 0 && (
          <Toggle label={`I understand and accept the ${checklist.recommendedFailures.length} recommended warning(s)`} checked={!!config.recommendedWarningsConfirmed} onChange={(value) => setConfig({ recommendedWarningsConfirmed: value })} />
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            disabled={config.publishStatus !== "published" && !checklist.canPublish}
            variant={config.publishStatus === "published" ? "outline" : "default"}
            onClick={publishWorld}
          >
            {config.publishStatus === "published" ? "Set world back to draft" : "Mark world ready to publish"}
          </Button>
          {!checklist.canPublish && config.publishStatus !== "published" && (
            <p className="text-xs text-rose-300">{checklist.requiredFailures.length > 0 ? `${checklist.requiredFailures.length} required check(s) failing.` : "Confirm the recommended warnings to continue."}</p>
          )}
          <p className="text-xs text-muted-foreground">The room goes live with the museum's main Publish — this state is included in those checks.</p>
        </div>
        {config.publishStatus === "published" && config.publishManifest && (
          <p className="text-xs text-muted-foreground">Published as <strong className="text-foreground">{config.publishManifest.versionId}</strong> · content fingerprint <code className="rounded bg-background/60 px-1">{config.publishManifest.contentHash}</code> · {config.publishManifest.objectIds?.length ?? 0} objects locked to this version.</p>
        )}
        {(config.versionHistory || []).length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Version history</p>
            {config.versionHistory.slice().reverse().map((entry) => (
              <div key={`${entry.versionId}-${entry.publishedAt}`} className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-background/40 px-3 py-2 text-xs">
                <span className="min-w-0 truncate"><strong>{entry.versionId}</strong> · {new Date(entry.publishedAt).toLocaleString()} · <code>{entry.contentHash}</code></span>
                <Button size="sm" variant="ghost" onClick={() => restoreVersion(entry)}>Restore</Button>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">Restoring loads that version back into the editor as a draft — nothing changes for visitors until you publish again.</p>
          </div>
        )}
      </Section>
    </section>
  );
}
