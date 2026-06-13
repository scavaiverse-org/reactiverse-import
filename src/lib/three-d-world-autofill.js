import { AUTOFILL_WORLD_LAYOUTS, buildAutofillWorldConfigByIndex } from "@/lib/three-d-world-validation";
import { getWorldTemplate } from "@/lib/three-d-world-seed";
import { createRoomByType } from "@/lib/walkthrough-admin";

// How many ready-built 3D worlds the "Autofill 3D Worlds…" action can create
// at once. Kept small on purpose — each world is a full, mobile-rendered scene.
export const MAX_AUTOFILL_3D_WORLDS = 8;

function clampWorldCount(count) {
  return Math.max(1, Math.min(MAX_AUTOFILL_3D_WORLDS, Math.floor(Number(count) || 0)));
}

/**
 * A complete, walkable, publish-ready 3D world config, cycling deterministically
 * through AUTOFILL_WORLD_LAYOUTS by index so each generated world has its own
 * distinct zones, objects, NPC, and exits (the same fully-furnished layouts used
 * by the single-room "Autofill 3D" button) instead of repeated copies of the
 * sample world.
 */
export function buildThreeDWorldConfig(index = 0) {
  return buildAutofillWorldConfigByIndex(index);
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
    const layout = AUTOFILL_WORLD_LAYOUTS[i % AUTOFILL_WORLD_LAYOUTS.length];
    const template = getWorldTemplate(layout.selectedTemplate);
    const room = createRoomByType(startIndex + i, walkthroughKey, "three_d_world");
    return {
      ...room,
      title: `3D World ${i + 1} — ${layout.label}`,
      subtitle: template?.category || "",
      description: template?.description || "",
      threeDWorldConfig: buildThreeDWorldConfig(i),
    };
  });
}
