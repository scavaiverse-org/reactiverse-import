import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { compileMuseumManifest } from "@/lib/manifest-compiler";
import { getWalkthroughByIndex } from "@/lib/manifest-public";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = path.resolve(__dirname, "../..");

const tenant = {
  id: "tenant-1",
  slug: "asian-operatic-museum",
  name: "Asian Operatic Museum",
  description: "A living museum of cultural heritage.",
  region: "Singapore",
};

function makeConfig(walkthroughKey, rooms) {
  return {
    id: `config-${walkthroughKey}`,
    module_key: "walkthrough",
    walkthrough_key: walkthroughKey,
    title: `${walkthroughKey} title`,
    description: `${walkthroughKey} description`,
    rooms,
  };
}

const validRoom = (overrides = {}) => ({
  title: "The Grand Entrance",
  media_url: "https://media.scaverse-test.com/media.jpg",
  visibility: "visible",
  order: 1,
  ...overrides,
});

describe("compileMuseumManifest determinism", () => {
  it("produces identical manifests (excluding published_at) for identical input", () => {
    const experienceConfigs = [makeConfig("walkthrough1", [validRoom()])];
    const a = compileMuseumManifest({ tenant, experienceConfigs, includedWalkthroughKeys: ["walkthrough1"], previousVersion: 0, publishedBy: "tester" });
    const b = compileMuseumManifest({ tenant, experienceConfigs, includedWalkthroughKeys: ["walkthrough1"], previousVersion: 0, publishedBy: "tester" });

    expect(a.errors).toEqual([]);
    expect(b.errors).toEqual([]);
    const { published_at: aTime, ...aRest } = a.manifest;
    const { published_at: bTime, ...bRest } = b.manifest;
    expect(aRest).toEqual(bRest);
    expect(aTime).toBeTruthy();
    expect(bTime).toBeTruthy();
  });

  it("increments manifest_version from previousVersion", () => {
    const experienceConfigs = [makeConfig("walkthrough1", [validRoom()])];
    const { manifest } = compileMuseumManifest({ tenant, experienceConfigs, includedWalkthroughKeys: ["walkthrough1"], previousVersion: 4, publishedBy: "tester" });
    expect(manifest.manifest_version).toBe(5);
  });
});

describe("compileMuseumManifest gate rejection", () => {
  it("rejects when no walkthroughs are included", () => {
    const { manifest, errors } = compileMuseumManifest({ tenant, experienceConfigs: [], includedWalkthroughKeys: [], previousVersion: 0, publishedBy: "tester" });
    expect(manifest).toBeNull();
    expect(errors.length).toBeGreaterThan(0);
  });

  it("rejects a walkthrough with zero visible rooms", () => {
    const experienceConfigs = [makeConfig("walkthrough1", [validRoom({ visibility: "hidden" })])];
    const { manifest, errors } = compileMuseumManifest({ tenant, experienceConfigs, includedWalkthroughKeys: ["walkthrough1"], previousVersion: 0, publishedBy: "tester" });
    expect(manifest).toBeNull();
    expect(errors.some((e) => e.includes("zero visible rooms"))).toBe(true);
  });

  it("rejects a room missing a title", () => {
    const experienceConfigs = [makeConfig("walkthrough1", [validRoom({ title: "" })])];
    const { manifest, errors } = compileMuseumManifest({ tenant, experienceConfigs, includedWalkthroughKeys: ["walkthrough1"], previousVersion: 0, publishedBy: "tester" });
    expect(manifest).toBeNull();
    expect(errors.some((e) => e.includes("missing a title"))).toBe(true);
  });

  it("rejects a room with no valid media url", () => {
    const experienceConfigs = [makeConfig("walkthrough1", [validRoom({ media_url: "", background_media_url: "" })])];
    const { manifest, errors } = compileMuseumManifest({ tenant, experienceConfigs, includedWalkthroughKeys: ["walkthrough1"], previousVersion: 0, publishedBy: "tester" });
    expect(manifest).toBeNull();
    expect(errors.some((e) => e.includes("no valid media_url"))).toBe(true);
  });

  it("rejects a tenant with no name and no description", () => {
    const bareTenant = { id: "tenant-2", slug: "bare-museum" };
    const experienceConfigs = [makeConfig("walkthrough1", [validRoom()])];
    const { manifest, errors } = compileMuseumManifest({ tenant: bareTenant, experienceConfigs, includedWalkthroughKeys: ["walkthrough1"], previousVersion: 0, publishedBy: "tester" });
    expect(manifest).toBeNull();
    expect(errors.some((e) => e.includes("Card:"))).toBe(true);
  });
});

describe("publish parity", () => {
  it("fetchPublishedManifest returns the exact manifest pointed to by published_manifest_id", async () => {
    vi.resetModules();
    const experienceConfigs = [makeConfig("walkthrough1", [validRoom()])];
    const { manifest } = compileMuseumManifest({ tenant, experienceConfigs, includedWalkthroughKeys: ["walkthrough1"], previousVersion: 0, publishedBy: "tester" });
    const storedManifest = { ...manifest, id: "manifest-1" };

    vi.doMock("@/api/base44Client", () => ({
      base44: {
        entities: {
          PublishedExperienceManifest: {
            get: vi.fn(async (id) => (id === "manifest-1" ? storedManifest : null)),
          },
        },
      },
    }));

    const { fetchPublishedManifest } = await import("@/lib/manifest-public");
    const fetched = await fetchPublishedManifest({ ...tenant, published_manifest_id: "manifest-1" });
    expect(fetched).toEqual(storedManifest);
    vi.doUnmock("@/api/base44Client");
    vi.resetModules();
  });
});

describe("draft isolation / snapshot proof", () => {
  it("does not mutate the manifest when the source experienceConfigs are mutated afterwards", () => {
    const experienceConfigs = [makeConfig("walkthrough1", [validRoom({ title: "Original Title" })])];
    const { manifest } = compileMuseumManifest({ tenant, experienceConfigs, includedWalkthroughKeys: ["walkthrough1"], previousVersion: 0, publishedBy: "tester" });

    experienceConfigs[0].rooms[0].title = "Mutated After Publish";

    expect(manifest.walkthroughs[0].rooms[0].title).toBe("Original Title");
  });

  it("strips editor-only fields from rooms", () => {
    const experienceConfigs = [makeConfig("walkthrough1", [validRoom({
      warnings: ["some warning"],
      draft_state: "saved_with_warnings_allowed",
      append_only_editor: { active_mode: "easy" },
      quality_scores: { publish_safety: 50 },
      legacy_backup_before_dynamic_walkthrough_migration: { rooms: [] },
    })])];
    const { manifest } = compileMuseumManifest({ tenant, experienceConfigs, includedWalkthroughKeys: ["walkthrough1"], previousVersion: 0, publishedBy: "tester" });

    const room = manifest.walkthroughs[0].rooms[0];
    expect(room.warnings).toBeUndefined();
    expect(room.draft_state).toBeUndefined();
    expect(room.append_only_editor).toBeUndefined();
    expect(room.quality_scores).toBeUndefined();
    expect(room.legacy_backup_before_dynamic_walkthrough_migration).toBeUndefined();
  });
});

describe("multi-walkthrough support", () => {
  it("compiles multiple walkthroughs and getWalkthroughByIndex returns the right one", () => {
    const experienceConfigs = [
      makeConfig("walkthrough1", [validRoom({ title: "Room 1A" })]),
      makeConfig("walkthrough2", [validRoom({ title: "Room 2A" })]),
    ];
    const { manifest, errors } = compileMuseumManifest({ tenant, experienceConfigs, includedWalkthroughKeys: ["walkthrough1", "walkthrough2"], previousVersion: 0, publishedBy: "tester" });
    expect(errors).toEqual([]);
    expect(manifest.walkthroughs).toHaveLength(2);

    const first = getWalkthroughByIndex(manifest, 1);
    const second = getWalkthroughByIndex(manifest, 2);
    expect(first.walkthrough_key).toBe("walkthrough1");
    expect(first.rooms[0].title).toBe("Room 1A");
    expect(second.walkthrough_key).toBe("walkthrough2");
    expect(second.rooms[0].title).toBe("Room 2A");
    expect(getWalkthroughByIndex(manifest, 3)).toBeNull();
  });
});

describe("no-hardcoding source scan", () => {
  const filesToScan = [
    "pages/Walkthrough.jsx",
    "pages/Museum.jsx",
    "pages/VirtualExperience.jsx",
  ];

  it.each(filesToScan)("%s contains no walkthrough1, unsplash.com, or createFallbackRecord references", (relativePath) => {
    const contents = readFileSync(path.join(SRC_ROOT, relativePath), "utf8");
    expect(contents).not.toMatch(/walkthrough1/);
    expect(contents).not.toMatch(/unsplash\.com/);
    expect(contents).not.toMatch(/createFallbackRecord/);
  });
});

describe("unpublished invisibility", () => {
  it("listPublishedMuseums excludes live tenants without a published manifest", async () => {
    vi.resetModules();
    const tenants = [
      { id: "tenant-published", slug: "published-museum", status: "live", published_manifest_id: "manifest-1" },
      { id: "tenant-unpublished", slug: "unpublished-museum", status: "live", published_manifest_id: null },
    ];
    const manifests = {
      "manifest-1": { tenant_id: "tenant-published", card: { title: "Published Museum", description: "Open", walkthrough_count: 1 }, walkthroughs: [] },
    };

    vi.doMock("@/api/base44Client", () => ({
      base44: {
        entities: {
          MuseumTenant: {
            filter: vi.fn(async () => tenants),
          },
          PublishedExperienceManifest: {
            get: vi.fn(async (id) => manifests[id] || null),
          },
        },
      },
    }));

    const { listPublishedMuseums: listPublishedMuseumsMocked } = await import("@/lib/manifest-public");
    const results = await listPublishedMuseumsMocked();
    expect(results).toHaveLength(1);
    expect(results[0].tenant.slug).toBe("published-museum");
    vi.doUnmock("@/api/base44Client");
    vi.resetModules();
  });
});
