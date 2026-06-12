import { describe, it, expect } from "vitest";
import {
  tenantFilter,
  legacyTenantFilter,
  publicTenantFilter,
  publicExperienceFilter,
  publicMuseumPageFilter,
  assertTenantId,
} from "../tenant-query";
import { PUBLISH_STATES } from "../publishing";

describe("tenant-query filters", () => {
  it("tenantFilter scopes by tenantId", () => {
    expect(tenantFilter("tenant-1")).toEqual({ tenantId: "tenant-1" });
    expect(tenantFilter("tenant-1", { status: "active" })).toEqual({ tenantId: "tenant-1", status: "active" });
  });

  it("legacyTenantFilter scopes by tenant_id", () => {
    expect(legacyTenantFilter("tenant-1")).toEqual({ tenant_id: "tenant-1" });
    expect(legacyTenantFilter("tenant-1", { id: "ticket-9" })).toEqual({ tenant_id: "tenant-1", id: "ticket-9" });
  });

  it("publicTenantFilter scopes to tenant and published state", () => {
    expect(publicTenantFilter("tenant-1")).toEqual({
      tenantId: "tenant-1",
      publishState: PUBLISH_STATES.PUBLISHED,
    });
  });

  it("publicExperienceFilter scopes to tenant_id and published status", () => {
    expect(publicExperienceFilter("tenant-1")).toEqual({
      tenant_id: "tenant-1",
      status: PUBLISH_STATES.PUBLISHED,
    });
  });

  it("publicMuseumPageFilter scopes to tenant, page, published and public visibility", () => {
    expect(publicMuseumPageFilter("tenant-1", "home")).toEqual({
      tenantId: "tenant-1",
      pageKey: "home",
      publishState: PUBLISH_STATES.PUBLISHED,
      visibilityState: "public",
    });
  });

  it("assertTenantId returns the tenant id when present", () => {
    expect(assertTenantId("tenant-1")).toBe("tenant-1");
  });

  it("assertTenantId throws when tenant id is missing", () => {
    expect(() => assertTenantId(null)).toThrow("Tenant context is required for this operation.");
    expect(() => assertTenantId(undefined)).toThrow();
    expect(() => assertTenantId("")).toThrow();
  });
});
