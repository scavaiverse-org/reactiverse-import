import { buildSampleWorldConfig } from "@/lib/three-d-world-validation";
import { THREE_D_WORLD_EDITOR_SEED } from "@/lib/three-d-world-seed";
import { createRoomByType } from "@/lib/walkthrough-admin";

// How many ready-built 3D worlds the "Autofill 3D Worlds…" action can create
// at once. Kept small on purpose — each world is a full, mobile-rendered scene.
export const MAX_AUTOFILL_3D_WORLDS = 8;

const TEMPLATES = THREE_D_WORLD_EDITOR_SEED.worldTemplates;

function clampWorldCount(count) {
  return Math.max(1, Math.min(MAX_AUTOFILL_3D_WORLDS, Math.floor(Number(count) || 0)));
}

/**
 * A complete, walkable 3D world config built from the proven AOM sample world,
 * but re-skinned per index so each generated world looks distinct (its own
 * template, mood, and movement style). The sample's objects, zones, NPC guide,
 * and doors come along so every world has content and a working exit out of the
 * box — and renders deterministically (the renderer seeds purely off room id).
 */
export function buildThreeDWorldConfig(index = 0) {
  const template = TEMPLATES[index % TEMPLATES.length];
  const base = buildSampleWorldConfig();
  return {
    ...base,
    selectedTemplate: template.id,
    moodPreset: template.defaultMood || base.moodPreset,
    movementMode: template.defaultMovement || base.movementMode,
    previewChecked: false,
    publishStatus: "draft",
  };
}

/**
 * Build `count` (1–8) brand-new 3D World rooms ready to drop into a walkthrough.
 * Each is a normal walkthrough room of page_type "three_d_world" carrying a full
 * 3D world config. They start as drafts (consistent with the "Add room" button),
 * so they never inject publish-blocking errors until the tenant is ready.
 */
export function buildThreeDWorldRooms({ count = 1, startIndex = 0, walkthroughKey = "walkthrough1" }) {
  const total = clampWorldCount(count);
  return Array.from({ length: total }, (_, i) => {
    const template = TEMPLATES[i % TEMPLATES.length];
    const room = createRoomByType(startIndex + i, walkthroughKey, "three_d_world");
    return {
      ...room,
      title: `3D World ${i + 1} — ${template.name}`,
      subtitle: template.category,
      description: template.description,
      threeDWorldConfig: buildThreeDWorldConfig(i),
    };
  });
}
