import { WALKTHROUGH_EDITOR_TYPE, normalizeRooms, walkthroughLabel } from "@/lib/walkthrough-admin";
import { deepClone } from "@/lib/walkthrough-media-bindings";

/**
 * Convert one walkthrough from a museum plan into normalized draft rooms.
 * Pure function — does not touch any entity.
 */
export function buildDraftRoomsFromPlan(planWalkthrough, walkthroughKey) {
  const rooms = planWalkthrough?.rooms || [];
  return normalizeRooms(deepClone(rooms), walkthroughKey);
}

/**
 * Build an ExperienceConfig payload for a ZIP-import-generated draft.
 *
 * This is a DRAFT-ONLY payload:
 * - `status` is always "draft", never "published".
 * - It never references PublishedExperienceManifest.
 * - It never includes published_manifest_id / published_manifest_version.
 * - It carries the required ZIP-import metadata fields inside walkthrough_config
 *   so reviewers can see provenance (batch id, mode, warnings, asset inventory).
 *
 * The caller is responsible for persisting this via
 * `base44.entities.ExperienceConfig.update(id, payload)` or `.create(payload)` —
 * this module never calls entity methods itself.
 *
 * @param {{
 *   existingRecord?: object,
 *   tenant: object,
 *   museumId: string,
 *   walkthroughKey: string,
 *   planWalkthrough: object,
 *   mode: "expert" | "easy" | "very_easy",
 *   batchId: string,
 *   inventory: object[],
 *   planSummary?: string,
 *   planWarnings?: string[],
 *   planSource?: "ai" | "heuristic",
 * }} input
 */
export function buildZipImportDraftPayload({
  existingRecord = null,
  tenant,
  museumId,
  walkthroughKey,
  planWalkthrough,
  mode,
  batchId,
  inventory = [],
  planSummary = "",
  planWarnings = [],
  planSource = "heuristic",
}) {
  const rooms = buildDraftRoomsFromPlan(planWalkthrough, walkthroughKey);
  const now = new Date().toISOString();

  return {
    tenant_id: tenant.id,
    museum_id: museumId || tenant.id,
    tenant_name: tenant.name,
    module_key: "walkthrough",
    walkthrough_key: walkthroughKey,
    title: planWalkthrough?.title || existingRecord?.title || walkthroughLabel(walkthroughKey),
    description: planWalkthrough?.description || existingRecord?.description || "AOM Immersive Experience Builder configuration",
    status: "draft",
    rooms,
    walkthrough_config: {
      ...(existingRecord?.walkthrough_config || {}),
      version: 3,
      editor_type: WALKTHROUGH_EDITOR_TYPE,
      walkthrough_key: walkthroughKey,
      rooms,
      ai_generated_draft: true,
      zip_import_source: true,
      zip_import_batch_id: batchId,
      ai_generation_mode: mode,
      ai_generation_summary: planSummary,
      ai_generation_warnings: planWarnings,
      ai_generation_source: planSource,
      asset_inventory: inventory,
      draft_state: "saved_with_warnings_allowed",
      updated_at: now,
    },
    updated_at: now,
    last_updated: now,
  };
}
