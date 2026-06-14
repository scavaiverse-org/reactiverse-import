import { useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Box, CheckCircle2, ChevronDown, ChevronUp, Copy, DoorOpen, Eye, Plus, Sparkles, Trash2, Upload, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import HelpHint from "../HelpHint";
import ThreeDWorldCanvas from "@/components/walkthrough/ThreeDWorldCanvas";
import { uploadFile } from "@/lib/upload";
import { THREE_D_WORLD_EDITOR_SEED, getMoodPreset, getObjectType, getWorldTemplate } from "@/lib/three-d-world-seed";
import {
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

// Tab order mirrors the previous numbered sections — title/hint shown in the
// tab bar and panel header, content rendered only for the active tab.
const BUILDER_TABS = [
  { title: "World Template", hint: "Pick the starting style of this world. The template sets sensible defaults for mood and movement — you can change everything afterwards." },
  { title: "Environment & Mood", hint: "The mood preset controls lighting, music, colour, fog, and glow together. Override any single value if you need something specific." },
  { title: "Room Layout", hint: "Shape and surfaces of the world, the visitor starting point, and named zones that organise the space." },
  { title: "Visitor Movement", hint: "How visitors travel through this world. Guided options are easiest for first-time visitors; free walk suits explorers." },
  { title: "Object Library", hint: "Everything placed inside the world is an object. Add from the library, then fine-tune each one in Interactive Objects below." },
  { title: "Interactive Objects", hint: "Full control over every object: where it sits, how big it is, what media it shows, and what happens when a visitor interacts with it." },
  { title: "Doors, Portals & Room Linking", hint: "Connect this world to the rest of the museum. Every world needs at least one working exit before it can be published." },
  { title: "Media & Content Anchors", hint: "Quick-add the most common content holders. Each becomes an object you can position and edit above." },
  { title: "Gamification Layer", hint: "Optional play layer: collectibles, quests, badges, and unlockable doors that reward exploration." },
  { title: "NPC / Guide Layer", hint: "A friendly virtual guide that welcomes visitors and explains the room. Keep lines short — under 24 words." },
  { title: "Performance & Mobile Optimisation", hint: "SCAVerse worlds are mobile-first. This panel estimates how heavy the world is for phones and suggests fixes." },
  { title: "Preview & Publish Checks", hint: "Check the world from every angle before it goes live. Required checks block publishing; recommended ones can be confirmed and accepted." },
];

function prettify(value = "") {
  return String(value).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function TabPanel({ index, title, hint, open, onToggle, children }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-background/30">
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between gap-2.5 px-4 py-3 transition-colors hover:bg-white/[0.03]">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">{index + 1}</span>
          <span className="text-sm font-semibold">{title}</span>
          {hint && <HelpHint title={title}>{hint}</HelpHint>}
        </div>
        <span className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${open ? "text-muted-foreground" : "bg-primary/10 text-primary"}`}>
          {open ? <>Hide <ChevronUp className="h-3.5 w-3.5" /></> : <>Show <ChevronDown className="h-3.5 w-3.5" /></>}
        </span>
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

// File picker filters per media field, matched to what each object type actually renders.
const MEDIA_ACCEPT_BY_FIELD = {
  imageUrl: "image/*",
  videoUrl: "video/*",
  audioUrl: "audio/*",
  modelUrl: ".glb,.gltf,.usdz,.obj",
  mediaUrl: "image/*,video/*,audio/*",
  iconUrl: "image/*",
};

// Sample-world objects store their text in `body` (text_panel) or `story`
// (memory_capsule); always edit the field that already holds the text so the
// editor never leaves a stale duplicate behind.
function getDescriptionField(object = {}) {
  if (object.description) return "description";
  if (object.body != null) return "body";
  if (object.story != null) return "story";
  return "description";
}

// Type-specific fields beyond the shared title/description/media/transform
// set, mirroring each object type's editableFields in the seed library.
const TYPE_EXTRA_FIELDS = {
  text_panel: [
    { field: "fontSize", label: "Font size", kind: "select", options: ["small", "medium", "large"] },
    { field: "alignment", label: "Alignment", kind: "select", options: ["left", "center", "right"] },
  ],
  video_wall: [
    { field: "thumbnailUrl", label: "Thumbnail URL", kind: "text", placeholder: "https://…" },
    { field: "autoplay", label: "Autoplay", kind: "toggle" },
    { field: "mute", label: "Mute", kind: "toggle" },
    { field: "loop", label: "Loop", kind: "toggle" },
  ],
  audio_point: [
    { field: "transcript", label: "Transcript", kind: "textarea", hint: "Shown for accessibility alongside the audio." },
    { field: "loop", label: "Loop", kind: "toggle" },
  ],
  artifact_display: [
    { field: "imageUrl", label: "Fallback image URL", kind: "text", placeholder: "https://…", hint: "Shown on slower devices instead of the 3D model. Required for publish." },
    { field: "lighting", label: "Lighting", kind: "text" },
  ],
  memory_capsule: [
    { field: "emotionTag", label: "Emotion tag", kind: "text" },
    { field: "color", label: "Color", kind: "text" },
  ],
  product_booth: [
    { field: "brandName", label: "Brand name", kind: "text" },
    { field: "productName", label: "Product name", kind: "text" },
    { field: "price", label: "Price", kind: "text" },
    { field: "linkUrl", label: "Link URL", kind: "text", placeholder: "https://…" },
    { field: "ctaText", label: "CTA text", kind: "text" },
  ],
  npc_guide: [
    { field: "script", label: "Guide script", kind: "textarea" },
    { field: "avatarStyle", label: "Avatar style", kind: "text" },
    { field: "dialogueSteps", label: "Dialogue steps", kind: "lines", hint: "One line per step, under 24 words each." },
  ],
  quiz_station: [
    { field: "question", label: "Question", kind: "text" },
    { field: "answers", label: "Answers", kind: "lines", hint: "One answer option per line." },
    { field: "correctAnswer", label: "Correct answer", kind: "text" },
    { field: "reward", label: "Reward", kind: "text" },
  ],
  collectible: [
    { field: "rarity", label: "Rarity", kind: "select", options: ["common", "uncommon", "rare", "legendary"] },
    { field: "rewardPoints", label: "Reward points", kind: "number" },
    { field: "unlockEffect", label: "Unlock effect", kind: "text" },
  ],
  floating_button: [
    { field: "targetUrl", label: "Target URL", kind: "text", placeholder: "https://…", hint: "Used when the click action opens a link." },
    { field: "destinationRoomId", label: "Destination room id", kind: "text", hint: "Used when the click action is Go to Another Room." },
  ],
  direction_sign: [
    { field: "arrowDirection", label: "Arrow direction", kind: "select", options: ["forward", "back", "left", "right", "up", "down"] },
  ],
  light_source: [
    { field: "lightType", label: "Light type", kind: "select", options: ["spotlight", "ambient", "point", "highlight"] },
    { field: "intensity", label: "Intensity", kind: "number" },
    { field: "color", label: "Color", kind: "text" },
    { field: "targetObjectId", label: "Target object id", kind: "text" },
  ],
  portal: [
    { field: "portalEffect", label: "Portal effect", kind: "text" },
    { field: "color", label: "Color", kind: "text" },
  ],
};

function ExtraField({ definition, object, onUpdate }) {
  const { field, label, kind, options = [], placeholder, hint } = definition;
  const value = object[field];
  if (kind === "toggle") return <Toggle label={label} checked={!!value} onChange={(checked) => onUpdate({ [field]: checked })} hint={hint} />;
  if (kind === "select") {
    return (
      <Field label={label} hint={hint}>
        <select className={selectClass} value={value || ""} onChange={(e) => onUpdate({ [field]: e.target.value })}>
          <option value="">Choose…</option>
          {options.map((option) => <option key={option} value={option}>{prettify(option)}</option>)}
        </select>
      </Field>
    );
  }
  if (kind === "textarea") return <Field label={label} hint={hint}><Textarea rows={2} value={value || ""} onChange={(e) => onUpdate({ [field]: e.target.value })} /></Field>;
  if (kind === "lines") return <Field label={label} hint={hint}><Textarea rows={2} value={(Array.isArray(value) ? value : []).join("\n")} onChange={(e) => onUpdate({ [field]: e.target.value.split("\n").filter(Boolean) })} /></Field>;
  if (kind === "number") return <Field label={label} hint={hint}><Input type="number" value={value ?? ""} onChange={(e) => onUpdate({ [field]: e.target.value === "" ? undefined : Number(e.target.value) })} /></Field>;
  return <Field label={label} hint={hint}><Input value={value || ""} placeholder={placeholder} onChange={(e) => onUpdate({ [field]: e.target.value })} /></Field>;
}

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
  const [addObjectType, setAddObjectType] = useState("image_frame");
  const [uploadingField, setUploadingField] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(true);
  const [stepPanelOpen, setStepPanelOpen] = useState(true);
  const [editingObjectId, setEditingObjectId] = useState(null);
  const config = getThreeDWorldConfig(room);
  const setConfig = (patch) => onChange({ ...room, threeDWorldConfig: { ...(config || createThreeDWorldConfig()), ...patch } });

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
        <div className="space-y-2 text-left">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-primary"><Eye className="h-3.5 w-3.5" /> Live preview — empty gallery</p>
          <ThreeDWorldCanvas config={null} room={room} className="h-[360px] w-full overflow-hidden rounded-2xl border border-white/10" />
          <p className="text-xs text-muted-foreground">This is the real 3D space visitors will walk through. Start building or load the sample world to fill it with objects — the preview updates as you edit.</p>
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
  // Compare by id only when both rooms actually have one — unsaved rooms all
  // share id === undefined, which would wrongly exclude every sibling.
  const isSameRoom = (entry) => entry === room
    || (entry.id != null && room.id != null && entry.id === room.id)
    || (entry.id == null && room.id == null && entry.room_key != null && entry.room_key === room.room_key);
  const roomOptions = rooms.filter((entry) => !isSameRoom(entry)).map((entry) => ({ value: entry.id || entry.room_key, label: entry.title || entry.room_key || entry.id }));

  const updateObject = (id, patch) => setConfig({ objects: objects.map((object) => (object.id === id ? { ...object, ...patch } : object)) });
  const uploadObjectMedia = async (id, field, file) => {
    if (!file) return;
    const key = `${id}:${field}`;
    setUploadingField(key);
    try {
      const result = await uploadFile(file);
      updateObject(id, { [field]: result.file_url });
    } catch (error) {
      console.error("Media upload failed", error);
    } finally {
      setUploadingField((current) => (current === key ? null : current));
    }
  };
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
  const previewMode = SEED.previewModes.find((mode) => mode.id === config.previewMode) || SEED.previewModes[0];

  const goToTab = (index) => { setActiveTab(Math.max(0, Math.min(BUILDER_TABS.length - 1, index))); setEditingObjectId(null); };

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

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-background/20">
        <button type="button" onClick={() => setPreviewOpen((v) => !v)} className="flex w-full items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03]">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
            <Eye className="h-3.5 w-3.5" /> Live Preview · Updates as you edit
          </span>
          <span className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${previewOpen ? "text-muted-foreground" : "bg-primary/10 text-primary"}`}>
            {previewOpen ? <>Hide <ChevronUp className="h-3.5 w-3.5" /></> : <>Show <ChevronDown className="h-3.5 w-3.5" /></>}
          </span>
        </button>
        {previewOpen && (
          <div className="space-y-2 border-t border-white/10 p-4">
            <ThreeDWorldCanvas config={config} room={room} debounceMs={400} className="h-[420px] w-full overflow-hidden rounded-2xl border border-white/10" />
            <p className="text-xs text-muted-foreground">Drag to look around, scroll to zoom, click an object to see how it appears to visitors. This is the same renderer used on the published page.</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {BUILDER_TABS.map((tab, index) => (
          <button
            key={tab.title}
            type="button"
            onClick={() => { setActiveTab(index); setEditingObjectId(null); }}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${activeTab === index ? "border-primary/40 bg-primary/15 text-primary" : "border-white/10 bg-background/30 text-muted-foreground hover:bg-white/[0.03]"}`}
          >
            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${activeTab === index ? "bg-primary/25 text-primary" : "bg-white/10 text-muted-foreground"}`}>{index + 1}</span>
            {tab.title}
          </button>
        ))}
      </div>

      <TabPanel index={activeTab} title={BUILDER_TABS[activeTab].title} hint={BUILDER_TABS[activeTab].hint} open={stepPanelOpen} onToggle={() => setStepPanelOpen((v) => !v)}>
        {activeTab === 0 && (
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
        )}

        {activeTab === 1 && (
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
          </div>
        )}

        {activeTab === 2 && (
          <>
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
          </>
        )}

        {activeTab === 3 && (
          <>
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
          </>
        )}

        {activeTab === 4 && (
          <>
            <div className="flex flex-wrap items-end gap-3">
              <Field label="Object type">
                <select className={selectClass} value={addObjectType} onChange={(e) => setAddObjectType(e.target.value)}>
                  {SEED.objectLibrary.map((entry) => <option key={entry.id} value={entry.id}>{entry.name} — {entry.category}</option>)}
                </select>
              </Field>
              <Button onClick={() => addObject(addObjectType)}><Plus className="h-4 w-4" /> Add object</Button>
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
          </>
        )}

        {activeTab === 5 && (
          <>
            {objects.length === 0 && <p className="text-xs text-muted-foreground">Add objects in the Object Library first.</p>}
            <div className="space-y-3">
              {objects.map((object) => {
                const mediaField = MEDIA_FIELD_BY_TYPE[object.type];
                const descriptionField = getDescriptionField(object);
                const extraFields = TYPE_EXTRA_FIELDS[object.type] || [];
                const isEditing = editingObjectId === object.id;
                const openEdit = () => { setEditingObjectId(object.id); setPreviewOpen(false); setStepPanelOpen(true); };
                const closeEdit = () => { setEditingObjectId(null); setPreviewOpen(true); };
                return (
                  <div key={object.id} className="overflow-hidden rounded-xl border border-white/10 bg-background/40">
                    <button type="button" onClick={isEditing ? closeEdit : openEdit} className="flex w-full items-center justify-between px-4 py-2.5 transition-colors hover:bg-white/[0.03]">
                      <span className="text-sm font-semibold">{object.title || object.name || "Untitled"} <span className="ml-2 text-xs font-normal text-muted-foreground">{getObjectType(object.type)?.name || prettify(object.type)}</span></span>
                      <span className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${isEditing ? "text-muted-foreground" : "bg-primary/10 text-primary"}`}>
                        {isEditing ? <>Close <ChevronUp className="h-3.5 w-3.5" /></> : <>Edit <ChevronDown className="h-3.5 w-3.5" /></>}
                      </span>
                    </button>
                    {isEditing && <div className="space-y-3 border-t border-white/10 p-4">
                      <div className="grid gap-3 md:grid-cols-2">
                        <Field label="Title"><Input value={object.title || ""} onChange={(e) => updateObject(object.id, { title: e.target.value })} /></Field>
                        <Field label="Description"><Input value={object[descriptionField] || ""} onChange={(e) => updateObject(object.id, { [descriptionField]: e.target.value })} /></Field>
                        {mediaField && (
                          <Field label={`Media URL (${prettify(mediaField.replace("Url", ""))})`}>
                            <div className="flex gap-2">
                              <Input value={object[mediaField] || ""} placeholder="https://…" onChange={(e) => updateObject(object.id, { [mediaField]: e.target.value })} />
                              <Button asChild variant="outline" size="sm">
                                <label className="cursor-pointer whitespace-nowrap">
                                  <Upload className="h-3.5 w-3.5" /> {uploadingField === `${object.id}:${mediaField}` ? "Uploading…" : "Upload"}
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept={MEDIA_ACCEPT_BY_FIELD[mediaField] || "*/*"}
                                    onChange={(e) => uploadObjectMedia(object.id, mediaField, e.target.files?.[0])}
                                  />
                                </label>
                              </Button>
                            </div>
                          </Field>
                        )}
                        {extraFields.map((definition) => <ExtraField key={definition.field} definition={definition} object={object} onUpdate={(patch) => updateObject(object.id, patch)} />)}
                        <Field label="Click action" hint="What happens when a visitor clicks this object.">
                          <select className={selectClass} value={object.clickAction || "open_popup"} onChange={(e) => updateObject(object.id, { clickAction: e.target.value })}>
                            {SEED.interactionTypes.map((action) => <option key={action.id} value={action.id}>{action.name}</option>)}
                          </select>
                        </Field>
                        <Field label="Trigger radius" hint="How close (in metres) the visitor must be before this object activates."><Input type="number" step="0.5" min="0" value={object.triggerRadius ?? 2} onChange={(e) => updateObject(object.id, { triggerRadius: Number(e.target.value) })} /></Field>
                        <Field label="Lock condition" hint="Leave empty for always available. Example: visitor_collects_first_memory"><Input value={object.lockCondition || object.unlockCondition || ""} onChange={(e) => updateObject(object.id, { lockCondition: e.target.value })} /></Field>
                      </div>
                      <div className="grid gap-3 md:grid-cols-3">
                        <VectorInput label="Position" value={object.position} onChange={(value) => updateObject(object.id, { position: value })} />
                        <VectorInput label="Rotation" value={object.rotation} onChange={(value) => updateObject(object.id, { rotation: value })} />
                        <VectorInput label="Scale" value={object.scale} onChange={(value) => updateObject(object.id, { scale: value })} />
                      </div>
                      <Toggle label="Visible to visitors" checked={object.visible !== false} onChange={(value) => updateObject(object.id, { visible: value })} />
                    </div>}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activeTab === 6 && (
          <>
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
          </>
        )}

        {activeTab === 7 && (
          <>
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
          </>
        )}

        {activeTab === 8 && (
          <>
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
                <p className="text-xs text-muted-foreground">Tip: to make a door unlockable, add a Door in the Doors, Portals & Room Linking tab, set it to Locked, and use a collectible name as the unlock condition.</p>
              </>
            )}
          </>
        )}

        {activeTab === 9 && (
          <>
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
          </>
        )}

        {activeTab === 10 && (
          <>
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
          </>
        )}

        {activeTab === 11 && (
          <>
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
                onClick={() => setConfig({ publishStatus: config.publishStatus === "published" ? "draft" : "published" })}
              >
                {config.publishStatus === "published" ? "Set world back to draft" : "Mark world ready to publish"}
              </Button>
              {!checklist.canPublish && config.publishStatus !== "published" && (
                <p className="text-xs text-rose-300">{checklist.requiredFailures.length > 0 ? `${checklist.requiredFailures.length} required check(s) failing.` : "Confirm the recommended warnings to continue."}</p>
              )}
              <p className="text-xs text-muted-foreground">The room goes live with the museum's main Publish — this state is included in those checks.</p>
            </div>
          </>
        )}
      </TabPanel>

      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" disabled={activeTab === 0} onClick={() => goToTab(activeTab - 1)}><ArrowLeft className="h-3.5 w-3.5" /> Previous</Button>
        <span className="text-xs text-muted-foreground">Step {activeTab + 1} of {BUILDER_TABS.length}</span>
        <Button size="sm" disabled={activeTab === BUILDER_TABS.length - 1} onClick={() => goToTab(activeTab + 1)}>Next <ArrowRight className="h-3.5 w-3.5" /></Button>
      </div>
    </section>
  );
}
