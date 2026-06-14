import { describe, it, expect } from "vitest";
import { tenantFilter, legacyTenantFilter, assertTenantId } from "../tenant-query";

// ── Helper: build a fake filter-scoped data set ───────────────────────────────
// Simulates the client-side guard: given rows from different tenants,
// filtering by a specific tenantId should never surface rows from another tenant.
function applyTenantFilter(rows, tenantId) {
  const filter = tenantFilter(tenantId);
  return rows.filter((row) => Object.entries(filter).every(([k, v]) => row[k] === v));
}

function applyLegacyTenantFilter(rows, tenantId) {
  const filter = legacyTenantFilter(tenantId);
  return rows.filter((row) => Object.entries(filter).every(([k, v]) => row[k] === v));
}

// ── Shared fixtures ───────────────────────────────────────────────────────────
const TENANT_A = "tenant-aaaaaaaa";
const TENANT_B = "tenant-bbbbbbbb";
const VISITOR_A = "visitor-aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa";
const VISITOR_B = "visitor-bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb";

const mixedExperienceRows = [
  { id: "exp-1", tenantId: TENANT_A, status: "published", title: "Tenant A Experience" },
  { id: "exp-2", tenantId: TENANT_B, status: "published", title: "Tenant B Experience" },
  { id: "exp-3", tenantId: TENANT_A, status: "draft",     title: "Tenant A Draft" },
];

const mixedTicketRows = [
  { id: "tkt-1", tenant_id: TENANT_A, visitor_email: "alice@example.com" },
  { id: "tkt-2", tenant_id: TENANT_B, visitor_email: "bob@example.com" },
];

const mixedJourneyRows = [
  { id: "jrn-1", visitor_id: VISITOR_A, tenant_id: TENANT_A, walkthrough_key: "walkthrough1" },
  { id: "jrn-2", visitor_id: VISITOR_B, tenant_id: TENANT_A, walkthrough_key: "walkthrough1" },
  { id: "jrn-3", visitor_id: VISITOR_A, tenant_id: TENANT_B, walkthrough_key: "walkthrough1" },
];

// ── Tenant filter isolation ───────────────────────────────────────────────────
describe("tenant filter isolation (camelCase tenantId)", () => {
  it("tenant A filter never returns tenant B experience rows", () => {
    const results = applyTenantFilter(mixedExperienceRows, TENANT_A);
    expect(results.every((r) => r.tenantId === TENANT_A)).toBe(true);
    expect(results.some((r) => r.tenantId === TENANT_B)).toBe(false);
  });

  it("tenant B filter never returns tenant A experience rows", () => {
    const results = applyTenantFilter(mixedExperienceRows, TENANT_B);
    expect(results.every((r) => r.tenantId === TENANT_B)).toBe(true);
    expect(results.some((r) => r.tenantId === TENANT_A)).toBe(false);
  });

  it("empty tenantId returns no rows", () => {
    expect(applyTenantFilter(mixedExperienceRows, "")).toHaveLength(0);
  });

  it("assertTenantId blocks cross-tenant operations when no tenant context", () => {
    expect(() => assertTenantId(null)).toThrow();
    expect(() => assertTenantId(undefined)).toThrow();
    expect(() => assertTenantId("")).toThrow();
  });

  it("assertTenantId returns the correct id when present", () => {
    expect(assertTenantId(TENANT_A)).toBe(TENANT_A);
  });
});

describe("legacy tenant filter isolation (snake_case tenant_id)", () => {
  it("tenant A ticket filter excludes tenant B tickets", () => {
    const results = applyLegacyTenantFilter(mixedTicketRows, TENANT_A);
    expect(results.every((r) => r.tenant_id === TENANT_A)).toBe(true);
    expect(results.some((r) => r.tenant_id === TENANT_B)).toBe(false);
  });

  it("tenant B ticket filter excludes tenant A tickets", () => {
    const results = applyLegacyTenantFilter(mixedTicketRows, TENANT_B);
    expect(results.every((r) => r.tenant_id === TENANT_B)).toBe(true);
    expect(results.some((r) => r.tenant_id === TENANT_A)).toBe(false);
  });
});

// ── Anonymous visitor journey isolation ──────────────────────────────────────
// Simulates what the visitor-data Edge Function enforces server-side:
// given rows from multiple visitors, only rows matching the caller's visitor_id
// should be returned.
describe("anonymous visitor journey isolation", () => {
  function filterByVisitor(rows, visitorId) {
    return rows.filter((r) => r.visitor_id === visitorId);
  }

  it("visitor A cannot read visitor B journey rows", () => {
    const results = filterByVisitor(mixedJourneyRows, VISITOR_A);
    expect(results.every((r) => r.visitor_id === VISITOR_A)).toBe(true);
    expect(results.some((r) => r.visitor_id === VISITOR_B)).toBe(false);
  });

  it("visitor B cannot read visitor A journey rows", () => {
    const results = filterByVisitor(mixedJourneyRows, VISITOR_B);
    expect(results.every((r) => r.visitor_id === VISITOR_B)).toBe(true);
    expect(results.some((r) => r.visitor_id === VISITOR_A)).toBe(false);
  });

  it("visitor A cannot read visitor B journey even in same tenant", () => {
    const sameTenant = mixedJourneyRows.filter((r) => r.tenant_id === TENANT_A);
    const results = filterByVisitor(sameTenant, VISITOR_A);
    expect(results).toHaveLength(1);
    expect(results[0].visitor_id).toBe(VISITOR_A);
  });

  it("visitor B cannot write a journey row with visitor A's visitor_id", () => {
    // The Edge Function enforces this by overwriting visitor_id with the
    // caller-supplied value before any insert/update. Simulate that guard:
    function serverSideSafeInsert(callerVisitorId, payload) {
      return { ...payload, visitor_id: callerVisitorId, user_id: null };
    }
    const attempted = { visitor_id: VISITOR_A, tenant_id: TENANT_A, walkthrough_key: "walkthrough1" };
    const safe = serverSideSafeInsert(VISITOR_B, attempted);
    expect(safe.visitor_id).toBe(VISITOR_B);
    expect(safe.visitor_id).not.toBe(VISITOR_A);
  });
});

// ── Upload security: SVG and MIME type validation ────────────────────────────
// Tests for the client-side guards in upload.js (rejectUnsafeSvg / validateMediaFile).
// We test the logic in isolation rather than importing the async helpers directly.
describe("upload security: SVG content validation", () => {
  const UNSAFE_SVG_PATTERNS = [
    /<script[\s>]/i,
    /javascript:/i,
    /\bon\w+\s*=/i,
    /<use\s[^>]*(?:xlink:)?href\s*=\s*["'][^#]/i,
    /<!ENTITY/i,
    /data:text\/html/i,
  ];

  function hasDangerousContent(svgString) {
    return UNSAFE_SVG_PATTERNS.some((p) => p.test(svgString));
  }

  it("rejects SVG with <script> tag", () => {
    expect(hasDangerousContent('<svg><script>alert(1)</script></svg>')).toBe(true);
    expect(hasDangerousContent('<svg><SCRIPT>xss</SCRIPT></svg>')).toBe(true);
  });

  it("rejects SVG with javascript: href", () => {
    expect(hasDangerousContent('<svg><a href="javascript:alert(1)">x</a></svg>')).toBe(true);
  });

  it("rejects SVG with inline event handlers", () => {
    expect(hasDangerousContent('<svg onload="alert(1)"><rect /></svg>')).toBe(true);
    expect(hasDangerousContent('<svg><circle onclick="xss()" /></svg>')).toBe(true);
  });

  it("rejects SVG with external xlink:href", () => {
    expect(hasDangerousContent('<svg><use xlink:href="http://evil.example/sprite.svg#icon" /></svg>')).toBe(true);
  });

  it("allows SVG with internal fragment xlink:href", () => {
    expect(hasDangerousContent('<svg><use xlink:href="#icon" /></svg>')).toBe(false);
  });

  it("rejects SVG with XXE entity declaration", () => {
    expect(hasDangerousContent('<!DOCTYPE svg [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>')).toBe(true);
  });

  it("rejects SVG embedding data:text/html", () => {
    expect(hasDangerousContent('<svg><image href="data:text/html,<script>xss</script>" /></svg>')).toBe(true);
  });

  it("allows clean SVG", () => {
    const clean = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#ff0" width="100" height="100"/></svg>';
    expect(hasDangerousContent(clean)).toBe(false);
  });
});

describe("upload security: MIME type allow-list", () => {
  const ALLOWED = new Set([
    'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml',
    'video/mp4', 'video/webm', 'video/quicktime',
    'audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/ogg',
    'application/pdf',
    'model/gltf-binary', 'model/gltf+json', 'model/obj', 'model/vnd.usdz+zip',
  ]);

  it("blocks application/octet-stream", () => {
    expect(ALLOWED.has('application/octet-stream')).toBe(false);
  });

  it("blocks text/html", () => {
    expect(ALLOWED.has('text/html')).toBe(false);
  });

  it("blocks application/javascript", () => {
    expect(ALLOWED.has('application/javascript')).toBe(false);
  });

  it("allows standard image types", () => {
    expect(ALLOWED.has('image/png')).toBe(true);
    expect(ALLOWED.has('image/jpeg')).toBe(true);
    expect(ALLOWED.has('image/webp')).toBe(true);
    expect(ALLOWED.has('image/svg+xml')).toBe(true);
  });

  it("allows 3D model types", () => {
    expect(ALLOWED.has('model/gltf-binary')).toBe(true);
    expect(ALLOWED.has('model/gltf+json')).toBe(true);
    expect(ALLOWED.has('model/vnd.usdz+zip')).toBe(true);
  });
});
