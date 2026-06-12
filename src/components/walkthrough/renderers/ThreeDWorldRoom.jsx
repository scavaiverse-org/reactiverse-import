import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlignLeft, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, DoorOpen, Gem, HelpCircle, Image as ImageIcon, Film, Lightbulb, Lock, MousePointerClick, Signpost, Sparkles, Star, Store, UserRound, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ResolvedMedia from "@/components/walkthrough/ResolvedMedia";
import { getMoodPreset, getWorldTemplate } from "@/lib/three-d-world-seed";
import { getNavigationObjects, getThreeDWorldConfig } from "@/lib/three-d-world-validation";

const TONE_OVERLAYS = {
  warm_white_gold: "from-amber-200/10 via-transparent to-amber-900/25",
  sepia_gold: "from-amber-400/15 via-transparent to-orange-950/30",
  black_blue_gold: "from-slate-900/40 via-transparent to-blue-950/40",
  blue_purple_cyan: "from-indigo-500/15 via-transparent to-cyan-900/25",
  bright_multicolor: "from-white/10 via-transparent to-transparent",
  black_red_gold: "from-red-900/25 via-transparent to-black/45",
  white_gray: "from-white/5 via-transparent to-transparent",
};

const OBJECT_ICONS = {
  image_frame: ImageIcon,
  video_wall: Film,
  audio_point: Volume2,
  text_panel: AlignLeft,
  artifact_display: Gem,
  memory_capsule: Sparkles,
  product_booth: Store,
  npc_guide: UserRound,
  quiz_station: HelpCircle,
  collectible: Star,
  floating_button: MousePointerClick,
  direction_sign: Signpost,
  light_source: Lightbulb,
};

const ARROW_ICONS = { forward: ArrowUp, up: ArrowUp, back: ArrowDown, down: ArrowDown, left: ArrowLeft, right: ArrowRight };

const COLLECTIBLE_TYPES = ["collectible", "memory_capsule"];

function normalizeToken(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function objectDescription(object = {}) {
  return object.description || object.body || object.story || "";
}

// Maps a 3D world object onto the hotspot shape the runner's shared popup
// understands, so popups stay consistent with every other room type.
function toHotspot(object = {}) {
  const media = object.imageUrl || object.thumbnailUrl || object.videoUrl || object.audioUrl || object.mediaUrl || object.iconUrl || "";
  const mediaType = object.videoUrl ? "video" : object.audioUrl ? "audio" : media ? "image" : "";
  return {
    id: object.id,
    title: object.title || object.name || object.label,
    description: objectDescription(object) || object.transcript || "",
    media_url: media,
    media_type: mediaType,
    cta_route: object.linkUrl || object.targetUrl || "",
    cta_label: object.ctaText || "",
  };
}

function QuizStation({ object, track }) {
  const [answer, setAnswer] = useState(null);
  const answers = Array.isArray(object.answers) ? object.answers : String(object.answers || "").split("\n").filter(Boolean);
  if (!object.question || answers.length === 0) {
    return <p className="mt-2 text-xs text-muted-foreground">This quiz has not been configured yet.</p>;
  }
  const correct = answer != null && normalizeToken(answer) === normalizeToken(object.correctAnswer);
  return (
    <div className="mt-3 space-y-2">
      <p className="text-sm font-semibold">{object.question}</p>
      {answers.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => { setAnswer(option); track?.("three_d_world_quiz_answered", { object_id: object.id, correct: normalizeToken(option) === normalizeToken(object.correctAnswer) }); }}
          className={`w-full rounded-lg border px-3 py-2 text-left text-xs transition ${answer === option ? (normalizeToken(option) === normalizeToken(object.correctAnswer) ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-200" : "border-destructive/50 bg-destructive/10 text-destructive") : "border-white/10 bg-background/40 hover:border-primary/40"}`}
        >
          {option}
        </button>
      ))}
      {correct && object.reward && <p className="text-xs text-emerald-300">Reward: {object.reward}</p>}
    </div>
  );
}

export default function ThreeDWorldRoom({ room, context = {} }) {
  const config = getThreeDWorldConfig(room);
  const [collected, setCollected] = useState(() => new Set());
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [openQuiz, setOpenQuiz] = useState(null);

  const objects = (config?.objects || []).filter((object) => object.visible !== false);
  const navObjects = getNavigationObjects({ objects });
  const contentObjects = objects.filter((object) => !navObjects.includes(object) && object.type !== "light_source" && object.type !== "direction_sign");
  const signs = objects.filter((object) => object.type === "direction_sign");
  const lights = objects.filter((object) => object.type === "light_source");
  const gamification = config?.gamification || {};
  const npcGuide = config?.npcGuide || {};
  const template = getWorldTemplate(config?.selectedTemplate);
  const mood = getMoodPreset(config?.moodPreset);
  const tone = config?.colorToneOverride || mood?.colorTone || "";
  const overlay = TONE_OVERLAYS[tone] || "from-white/5 via-transparent to-black/20";

  // Tokens earned from collected objects, used to satisfy door unlock
  // conditions and gamification collectible "unlocks" lists.
  const { collectedTokens, unlockedDoorIds } = useMemo(() => {
    const tokens = new Set();
    objects.filter((object) => collected.has(object.id)).forEach((object) => {
      tokens.add(normalizeToken(object.id));
      tokens.add(normalizeToken(object.title || object.name));
    });
    const doorIds = new Set();
    (gamification.collectibles || []).forEach((entry) => {
      if (tokens.has(normalizeToken(entry.id)) || tokens.has(normalizeToken(entry.name))) {
        tokens.add(normalizeToken(entry.id));
        tokens.add(normalizeToken(entry.name));
        (entry.unlocks || []).forEach((doorId) => doorIds.add(doorId));
      }
    });
    return { collectedTokens: tokens, unlockedDoorIds: doorIds };
  }, [objects, collected, gamification.collectibles]);

  if (!config) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-20">
        <p className="max-w-md text-center text-sm text-muted-foreground">This 3D world has not been configured yet.</p>
      </div>
    );
  }

  const isDoorUnlocked = (door) => {
    if (!door.locked) return true;
    if (unlockedDoorIds.has(door.id)) return true;
    const condition = normalizeToken(String(door.unlockCondition || "").replace(/^visitor_collects_/i, ""));
    if (!condition) return false;
    return [...collectedTokens].some((token) => token && (token === condition || token.includes(condition) || condition.includes(token)));
  };

  const collect = (object) => {
    setCollected((prev) => new Set(prev).add(object.id));
    context.track?.("three_d_world_item_collected", { object_id: object.id, title: object.title || object.name });
  };

  const openObject = (object) => {
    context.track?.("three_d_world_object_opened", { object_id: object.id, object_type: object.type });
    if (COLLECTIBLE_TYPES.includes(object.type) || object.clickAction === "collect_item") collect(object);
    if (object.clickAction === "start_quiz" || object.type === "quiz_station") { setOpenQuiz(openQuiz === object.id ? null : object.id); return; }
    if (object.clickAction === "go_to_room" && object.destinationRoomId) { context.goToRoom?.(object.destinationRoomId); return; }
    if (object.type === "floating_button") {
      if (object.actionType === "go_to_room" && object.destinationRoomId) { context.goToRoom?.(object.destinationRoomId); return; }
      context.hotspotOpen?.(toHotspot(object));
      return;
    }
    context.hotspotOpen?.(toHotspot(object));
  };

  const enterDoor = (door) => {
    if (!isDoorUnlocked(door)) return;
    context.track?.("three_d_world_door_used", { object_id: door.id, destination: door.destinationRoomId });
    context.goToRoom?.(door.destinationRoomId);
  };

  const dialogueSteps = npcGuide.dialogueSteps || [];
  const collectibleObjects = objects.filter((object) => COLLECTIBLE_TYPES.includes(object.type));
  const collectedCount = collectibleObjects.filter((object) => collected.has(object.id)).length;

  return (
    <div className="relative min-h-screen px-4 py-24">
      <div aria-hidden className={`pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b ${overlay}`} />

      <div className="relative z-10 mx-auto max-w-5xl">
        <p className="text-xs uppercase tracking-[0.28em] text-primary">{template?.name || "3D World"}{mood ? ` · ${mood.name}` : ""}</p>
        <h1 className="mt-3 max-w-3xl font-display text-5xl font-bold text-foreground">{room.title || template?.name || "3D World"}</h1>
        {room.narration || room.description ? <p className="mt-5 max-w-2xl text-sm leading-7 text-foreground/75">{room.narration || room.description}</p> : null}

        {(config.zones || []).length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {config.zones.map((zone) => (
              <span key={zone.id} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-foreground/80" title={zone.description}>{zone.name}</span>
            ))}
          </div>
        )}

        {npcGuide.enabled && (npcGuide.openingLine || npcGuide.script || dialogueSteps.length > 0) && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-8 flex items-start gap-4 rounded-2xl border border-primary/25 bg-primary/10 p-5 backdrop-blur">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20"><UserRound className="h-5 w-5 text-primary" /></span>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-widest text-primary">Your guide</p>
              <p className="mt-1 text-sm leading-6 text-foreground">{dialogueSteps.length > 0 ? dialogueSteps[Math.min(dialogueIndex, dialogueSteps.length - 1)] : npcGuide.openingLine || npcGuide.script}</p>
              {dialogueSteps.length > 1 && dialogueIndex < dialogueSteps.length - 1 && (
                <Button size="sm" variant="outline" className="mt-3" onClick={() => setDialogueIndex(dialogueIndex + 1)}>Continue</Button>
              )}
            </div>
          </motion.div>
        )}

        {signs.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {signs.map((sign) => {
              const Arrow = ARROW_ICONS[String(sign.arrowDirection || "").toLowerCase()] || ArrowRight;
              return <span key={sign.id} className="flex items-center gap-1.5 rounded-full border border-white/15 bg-background/50 px-3 py-1 text-xs text-foreground/80"><Arrow className="h-3.5 w-3.5 text-primary" /> {sign.label || sign.title}</span>;
            })}
          </div>
        )}

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contentObjects.map((object, index) => {
            const Icon = OBJECT_ICONS[object.type] || Sparkles;
            const isCollected = collected.has(object.id);
            const thumbnail = object.imageUrl || object.thumbnailUrl || object.iconUrl || "";
            return (
              <motion.div key={object.id || index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="rounded-2xl border border-white/10 bg-background/55 p-4 backdrop-blur">
                <button type="button" onClick={() => openObject(object)} className="w-full text-left focus:outline-none focus:ring-2 focus:ring-primary rounded-xl">
                  {thumbnail && <ResolvedMedia url={thumbnail} mediaType="image" alt={object.title || object.name || "Object"} className="mb-3 h-32 w-full rounded-xl object-cover" fallbackVisual fallbackCompact />}
                  <span className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${isCollected ? "text-emerald-300" : "text-primary"}`} />
                    <span className="truncate text-sm font-semibold">{object.title || object.name || object.label || "Untitled"}</span>
                    {isCollected && <Star className="h-3.5 w-3.5 shrink-0 text-emerald-300" />}
                  </span>
                  {objectDescription(object) && <span className="mt-1.5 block text-xs leading-5 text-muted-foreground line-clamp-3">{objectDescription(object)}</span>}
                  {object.type === "product_booth" && (object.productName || object.price) && (
                    <span className="mt-2 block text-xs text-foreground/80">{[object.brandName, object.productName].filter(Boolean).join(" · ")}{object.price ? ` — ${object.price}` : ""}</span>
                  )}
                </button>
                {(object.type === "quiz_station" || object.clickAction === "start_quiz") && openQuiz === object.id && <QuizStation object={object} track={context.track} />}
              </motion.div>
            );
          })}
        </div>

        {navObjects.length > 0 && (
          <div className="mt-10">
            <p className="text-xs uppercase tracking-[0.28em] text-primary">Doors & Portals</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {navObjects.map((door) => {
                const unlocked = isDoorUnlocked(door);
                const Icon = door.type === "portal" ? Sparkles : DoorOpen;
                return (
                  <button
                    key={door.id}
                    type="button"
                    onClick={() => enterDoor(door)}
                    disabled={!unlocked}
                    title={unlocked ? `Go to ${door.title || door.destinationRoomId || "next room"}` : "Locked — explore the room to unlock this door."}
                    className={`flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm backdrop-blur transition focus:outline-none focus:ring-2 focus:ring-primary ${unlocked ? "border-primary/40 bg-primary/15 text-primary hover:bg-primary/25" : "cursor-not-allowed border-white/15 bg-white/5 text-muted-foreground"}`}
                  >
                    {unlocked ? <Icon className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    {door.title || "Door"}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {(gamification.enabled && (collectibleObjects.length > 0 || (gamification.questSteps || []).length > 0)) && (
          <div className="mt-10 rounded-2xl border border-white/10 bg-background/50 p-5 backdrop-blur">
            {collectibleObjects.length > 0 && <p className="text-sm font-semibold">Collected {collectedCount} of {collectibleObjects.length}</p>}
            {(gamification.questSteps || []).length > 0 && (
              <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                {gamification.questSteps.map((step) => <li key={step} className="flex items-center gap-2"><Star className="h-3 w-3 text-primary" /> {step}</li>)}
              </ul>
            )}
            {gamification.completionReward && collectibleObjects.length > 0 && collectedCount === collectibleObjects.length && (
              <p className="mt-3 text-xs text-emerald-300">Reward unlocked: {gamification.completionReward}</p>
            )}
          </div>
        )}

        {lights.length > 0 && (
          <p className="mt-8 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <Lightbulb className="h-3 w-3" /> Lighting: {lights.map((light) => light.title || light.lightType || "light").join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}
