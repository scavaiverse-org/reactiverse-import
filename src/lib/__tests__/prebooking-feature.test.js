import { describe, it, expect } from "vitest";
import { selectPresaleDisplayMuseums, PRESALE_FALLBACK_MUSEUM } from "@/lib/presale-content";

describe("selectPresaleDisplayMuseums", () => {
  it("returns DB museums when the query yields results", () => {
    const dbMuseums = [
      { id: "db-museum-1", name: "Test Museum", slug: "test-museum" },
      { id: "db-museum-2", name: "Another Museum", slug: "another-museum" },
    ];
    const result = selectPresaleDisplayMuseums(dbMuseums);
    expect(result).toBe(dbMuseums);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("db-museum-1");
  });

  it("returns the fallback AOM card when DB returns empty array", () => {
    const result = selectPresaleDisplayMuseums([]);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(PRESALE_FALLBACK_MUSEUM);
    expect(result[0].id).toBe("presale-fallback-aom");
    expect(result[0].name).toBe("Asian Operatic Museum");
    expect(result[0].useFallbackCta).toBe(true);
  });

  it("fallback card has useFallbackCta so CTA routes to /presale", () => {
    const [card] = selectPresaleDisplayMuseums([]);
    expect(card.useFallbackCta).toBe(true);
  });

  it("does not use fallback when DB returns at least one museum", () => {
    const dbMuseums = [{ id: "live-museum", name: "Live Museum", slug: "live" }];
    const result = selectPresaleDisplayMuseums(dbMuseums);
    expect(result.some((m) => m.id === "presale-fallback-aom")).toBe(false);
  });
});

describe("PRESALE_FALLBACK_MUSEUM shape", () => {
  it("has required fields for rendering", () => {
    expect(PRESALE_FALLBACK_MUSEUM.id).toBeTruthy();
    expect(PRESALE_FALLBACK_MUSEUM.name).toBeTruthy();
    expect(PRESALE_FALLBACK_MUSEUM.description).toBeTruthy();
    expect(typeof PRESALE_FALLBACK_MUSEUM.useFallbackCta).toBe("boolean");
  });

  it("description mentions SCAVerse launch", () => {
    expect(PRESALE_FALLBACK_MUSEUM.description).toMatch(/SCAVerse/i);
  });
});

describe("queryFn error-fallback behaviour", () => {
  it("catch(() => []) on a rejected listPresaleMuseums routes to fallback card", async () => {
    const failingQuery = () => Promise.reject(new Error("RLS blocked")).catch(() => []);
    const museums = await failingQuery();
    const display = selectPresaleDisplayMuseums(museums);
    expect(display).toHaveLength(1);
    expect(display[0].useFallbackCta).toBe(true);
  });

  it("catch(() => []) on a network error routes to fallback card", async () => {
    const failingQuery = () => Promise.reject(new Error("Network error")).catch(() => []);
    const museums = await failingQuery();
    const display = selectPresaleDisplayMuseums(museums);
    expect(display[0].id).toBe("presale-fallback-aom");
  });
});
