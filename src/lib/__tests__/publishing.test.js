import { describe, it, expect } from "vitest";
import { isPublicRenderable, nextPublishState, PUBLISH_STATES } from "../publishing";

describe("isPublicRenderable", () => {
  it("renders published records", () => {
    expect(isPublicRenderable({ publishState: PUBLISH_STATES.PUBLISHED })).toBe(true);
  });

  it("does not render draft, pending, or other non-published states", () => {
    expect(isPublicRenderable({ publishState: PUBLISH_STATES.DRAFT })).toBe(false);
    expect(isPublicRenderable({ publishState: PUBLISH_STATES.PENDING_REVIEW })).toBe(false);
    expect(isPublicRenderable({ publishState: PUBLISH_STATES.HIDDEN })).toBe(false);
    expect(isPublicRenderable({})).toBe(false);
  });

  it("does not render a published record that has been soft-deleted or archived", () => {
    expect(isPublicRenderable({ publishState: PUBLISH_STATES.PUBLISHED, deletedAt: "2026-01-01T00:00:00Z" })).toBe(false);
    expect(isPublicRenderable({ publishState: PUBLISH_STATES.PUBLISHED, archivedAt: "2026-01-01T00:00:00Z" })).toBe(false);
  });
});

describe("nextPublishState", () => {
  it("moves a draft through review to published via publish action", () => {
    expect(nextPublishState(PUBLISH_STATES.DRAFT, "submit_review")).toBe(PUBLISH_STATES.PENDING_REVIEW);
    expect(nextPublishState(PUBLISH_STATES.PENDING_REVIEW, "approve")).toBe(PUBLISH_STATES.APPROVED);
    expect(nextPublishState(PUBLISH_STATES.APPROVED, "publish")).toBe(PUBLISH_STATES.PUBLISHED);
  });

  it("falls back to the current state for an unknown action", () => {
    expect(nextPublishState(PUBLISH_STATES.PUBLISHED, "unknown_action")).toBe(PUBLISH_STATES.PUBLISHED);
  });

  it("falls back to draft when there is no current state and no recognized action", () => {
    expect(nextPublishState(undefined, "unknown_action")).toBe(PUBLISH_STATES.DRAFT);
  });
});
