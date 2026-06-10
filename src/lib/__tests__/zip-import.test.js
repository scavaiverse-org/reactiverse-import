import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import JSZip from "jszip";
import { validateZipEntries } from "@/lib/zip-import/validate";
import { buildHeuristicMuseumPlan } from "@/lib/zip-import/plan-builder";
import { buildZipImportDraftPayload, buildDraftRoomsFromPlan } from "@/lib/zip-import/draft-writer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = path.resolve(__dirname, "../..");

vi.mock("@/lib/upload", () => ({
  uploadFile: vi.fn(async (file) => ({ file_url: `https://media.test/${file.name}` })),
}));

const tenant = { id: "tenant-1", slug: "asian-operatic-museum", name: "Asian Operatic Museum", description: "A living museum.", region: "Singapore" };

describe("validateZipEntries", () => {
  const file = (path, size = 100) => ({ path, size, isDirectory: false });

  it("accepts allowed asset types", () => {
    const { ok, accepted, rejected } = validateZipEntries([file("walkthrough1/room-a.jpg"), file("walkthrough1/room-a.txt"), file("notes.mp3")]);
    expect(ok).toBe(true);
    expect(accepted).toHaveLength(3);
    expect(rejected).toHaveLength(0);
  });

  it("rejects path traversal", () => {
    const { rejected } = validateZipEntries([file("../../etc/passwd.jpg")]);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason).toMatch(/traversal/i);
  });

  it("rejects blocked executable extensions", () => {
    const { rejected } = validateZipEntries([file("setup.exe"), file("script.sh"), file("payload.js")]);
    expect(rejected).toHaveLength(3);
    rejected.forEach((r) => expect(r.reason).toMatch(/not allowed/i));
  });

  it("rejects hidden and OS system files", () => {
    const { rejected } = validateZipEntries([file(".DS_Store"), file("__MACOSX/room-a.jpg"), file("folder/.hidden.jpg")]);
    expect(rejected).toHaveLength(3);
  });

  it("rejects unsupported file types without breaking the import", () => {
    const { ok, accepted, rejected } = validateZipEntries([file("model.blend"), file("room.jpg")]);
    expect(ok).toBe(true);
    expect(accepted).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason).toMatch(/not a supported museum asset type/i);
  });

  it("rejects duplicate filenames", () => {
    const { rejected } = validateZipEntries([file("room.jpg"), file("room.jpg")]);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason).toMatch(/duplicate/i);
  });
});

describe("extractZipInventory", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("builds an asset inventory from a real ZIP, uploading media and extracting text", async () => {
    const zip = new JSZip();
    zip.file("walkthrough1/room-a.jpg", new Uint8Array([0xff, 0xd8, 0xff, 0xd9]));
    zip.file("walkthrough1/room-a.txt", "The Grand Hall\nA description of the grand hall artifact.");
    zip.file("malware.exe", "MZ");
    const buffer = await zip.generateAsync({ type: "uint8array" });
    const file = new File([buffer], "import.zip", { type: "application/zip" });

    const { extractZipInventory } = await import("@/lib/zip-import/extract");
    const result = await extractZipInventory(file);

    expect(result.ok).toBe(true);
    expect(result.rejected.some((r) => r.original_filename === "malware.exe")).toBe(true);

    const image = result.inventory.find((a) => a.detected_type === "image");
    expect(image.media_url).toBe("https://media.test/room-a.jpg");
    expect(image.suggested_walkthrough_key).toBe("walkthrough1");
    expect(image.zip_import_batch_id).toBe(result.batchId);

    const doc = result.inventory.find((a) => a.detected_type === "document");
    expect(doc.extracted_text).toContain("The Grand Hall");
    expect(doc.zip_import_batch_id).toBe(result.batchId);
  });
});

describe("buildHeuristicMuseumPlan", () => {
  const imageAsset = (overrides = {}) => ({
    id: "asset-image",
    original_filename: "walkthrough1/room-a.jpg",
    detected_type: "image",
    detected_title: "Room A",
    detected_description: "",
    media_url: "https://media.test/room-a.jpg",
    extracted_text: "",
    suggested_walkthrough_key: "walkthrough1",
    suggested_room_order: 1,
    warnings: [],
    ...overrides,
  });

  const textAsset = (overrides = {}) => ({
    id: "asset-text",
    original_filename: "walkthrough1/room-a.txt",
    detected_type: "document",
    detected_title: "Room A",
    detected_description: "A description of the grand hall artifact.",
    media_url: "",
    extracted_text: "A description of the grand hall artifact. It was donated in 1950.",
    suggested_walkthrough_key: "walkthrough1",
    suggested_room_order: 1,
    warnings: [],
    ...overrides,
  });

  it("does not fabricate facts: missing media is flagged, not invented", () => {
    const inventory = [imageAsset({ media_url: "" })];
    const plan = buildHeuristicMuseumPlan({ inventory, mode: "very_easy", tenant, includedWalkthroughKeys: ["walkthrough1"] });
    const room = plan.walkthroughs[0].rooms[0];
    expect(room.media_url).toBe("");
    expect(room.visibility).toBe("draft");
    expect(plan.warnings.some((w) => w.includes("needs media") || w.includes("no usable media"))).toBe(true);
  });

  it("very_easy mode produces the minimum complete draft", () => {
    const inventory = [imageAsset(), textAsset()];
    const plan = buildHeuristicMuseumPlan({ inventory, mode: "very_easy", tenant, includedWalkthroughKeys: ["walkthrough1"] });
    const room = plan.walkthroughs[0].rooms[0];
    expect(room.title).toBeTruthy();
    expect(room.media_url).toBeTruthy();
    expect(room).not.toHaveProperty("hotspots");
    expect(room).not.toHaveProperty("accessibility");
  });

  it("easy mode adds more structure than very_easy", () => {
    const inventory = [imageAsset(), textAsset()];
    const easy = buildHeuristicMuseumPlan({ inventory, mode: "easy", tenant, includedWalkthroughKeys: ["walkthrough1"] }).walkthroughs[0].rooms[0];
    const veryEasy = buildHeuristicMuseumPlan({ inventory, mode: "very_easy", tenant, includedWalkthroughKeys: ["walkthrough1"] }).walkthroughs[0].rooms[0];

    expect(easy).toHaveProperty("hotspots");
    expect(easy).toHaveProperty("ctas");
    expect(easy.narration).toBeTruthy();
    expect(veryEasy).not.toHaveProperty("hotspots");
  });

  it("expert mode produces richer room fields than easy mode", () => {
    const inventory = [imageAsset(), textAsset()];
    const expert = buildHeuristicMuseumPlan({ inventory, mode: "expert", tenant, includedWalkthroughKeys: ["walkthrough1"] }).walkthroughs[0].rooms[0];
    const easy = buildHeuristicMuseumPlan({ inventory, mode: "easy", tenant, includedWalkthroughKeys: ["walkthrough1"] }).walkthroughs[0].rooms[0];

    expect(expert).toHaveProperty("accessibility");
    expect(expert).toHaveProperty("suggested_learning_outcome");
    expect(expert.ctas.length).toBeGreaterThan(0);
    expect(easy).not.toHaveProperty("accessibility");
    expect(Object.keys(expert).length).toBeGreaterThan(Object.keys(easy).length);
  });

  it("marks unknown facts as unknown instead of inventing them when no related text exists", () => {
    const inventory = [imageAsset()];
    const plan = buildHeuristicMuseumPlan({ inventory, mode: "expert", tenant, includedWalkthroughKeys: ["walkthrough1"] });
    const room = plan.walkthroughs[0].rooms[0];
    expect(room.accessibility.long_description).toMatch(/unknown/i);
    expect(room.suggested_learning_outcome).toMatch(/unknown/i);
  });

  it("marks museum title/description unknown when the tenant has none, never fabricating one", () => {
    const inventory = [imageAsset()];
    const plan = buildHeuristicMuseumPlan({ inventory, mode: "very_easy", tenant: { id: "tenant-2" }, includedWalkthroughKeys: ["walkthrough1"] });
    expect(plan.museum_title).toMatch(/unknown/i);
    expect(plan.museum_description).toMatch(/unknown/i);
  });
});

describe("buildZipImportDraftPayload", () => {
  const plan = buildHeuristicMuseumPlan({
    inventory: [{
      id: "asset-image",
      original_filename: "walkthrough1/room-a.jpg",
      detected_type: "image",
      detected_title: "Room A",
      detected_description: "",
      media_url: "https://media.test/room-a.jpg",
      extracted_text: "",
      suggested_walkthrough_key: "walkthrough1",
      suggested_room_order: 1,
      warnings: [],
    }],
    mode: "very_easy",
    tenant,
    includedWalkthroughKeys: ["walkthrough1"],
  });

  it("produces a draft-only payload with required ZIP-import metadata", () => {
    const payload = buildZipImportDraftPayload({
      existingRecord: null,
      tenant,
      museumId: tenant.id,
      walkthroughKey: "walkthrough1",
      planWalkthrough: plan.walkthroughs[0],
      mode: "very_easy",
      batchId: "batch-1",
      inventory: [],
      planSummary: plan.summary,
      planWarnings: plan.warnings,
      planSource: plan.source,
    });

    expect(payload.status).toBe("draft");
    expect(payload.module_key).toBe("walkthrough");
    expect(payload.walkthrough_config.ai_generated_draft).toBe(true);
    expect(payload.walkthrough_config.zip_import_source).toBe(true);
    expect(payload.walkthrough_config.zip_import_batch_id).toBe("batch-1");
    expect(payload.walkthrough_config.ai_generation_mode).toBe("very_easy");
    expect(Array.isArray(payload.walkthrough_config.ai_generation_warnings)).toBe(true);
    expect(Array.isArray(payload.walkthrough_config.asset_inventory)).toBe(true);
    expect(payload.rooms.length).toBeGreaterThan(0);
  });

  it("never references PublishedExperienceManifest or the tenant publish pointer fields", () => {
    const payload = buildZipImportDraftPayload({
      existingRecord: null,
      tenant,
      museumId: tenant.id,
      walkthroughKey: "walkthrough1",
      planWalkthrough: plan.walkthroughs[0],
      mode: "very_easy",
      batchId: "batch-1",
      inventory: [],
      planSummary: plan.summary,
      planWarnings: plan.warnings,
      planSource: plan.source,
    });

    const serialized = JSON.stringify(payload);
    expect(serialized).not.toMatch(/PublishedExperienceManifest/);
    expect(serialized).not.toMatch(/published_manifest_id/);
    expect(serialized).not.toMatch(/published_manifest_version/);
    expect(payload.status).not.toBe("published");
  });

  it("normalizes rooms via normalizeRooms for compiler compatibility", () => {
    const rooms = buildDraftRoomsFromPlan(plan.walkthroughs[0], "walkthrough1");
    expect(rooms[0]).toHaveProperty("room_key");
    expect(rooms[0]).toHaveProperty("page_type");
    expect(rooms[0].order).toBe(1);
  });
});

describe("zip-import source scan", () => {
  const filesToScan = [
    "lib/zip-import/extract.js",
    "lib/zip-import/plan-builder.js",
    "lib/zip-import/draft-writer.js",
    "components/admin/walkthrough/ImportMuseumZipPanel.jsx",
  ];

  it.each(filesToScan)("%s never calls PublishedExperienceManifest.update/delete or unsplash fallbacks", (relativePath) => {
    const contents = readFileSync(path.join(SRC_ROOT, relativePath), "utf8");
    expect(contents).not.toMatch(/PublishedExperienceManifest\.(update|delete)/);
    expect(contents).not.toMatch(/unsplash\.com/);
    expect(contents).not.toMatch(/published_manifest_id\s*[:=]/);
    expect(contents).not.toMatch(/status:\s*["']published["']/);
  });
});
