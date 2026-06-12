import { describe, it, expect } from "vitest";
import { isHoneypotTripped, checkSubmitAllowed, recordSubmit, honeypotInputProps, HONEYPOT_FIELD_NAME } from "../form-protection";

function memoryStorage(initial = {}) {
  const store = { ...initial };
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = value;
    },
    _dump: () => store,
  };
}

describe("isHoneypotTripped", () => {
  it("is false for empty/whitespace values", () => {
    expect(isHoneypotTripped("")).toBe(false);
    expect(isHoneypotTripped("   ")).toBe(false);
    expect(isHoneypotTripped(undefined)).toBe(false);
    expect(isHoneypotTripped(null)).toBe(false);
  });

  it("is true when a bot fills the hidden field", () => {
    expect(isHoneypotTripped("http://spam.example")).toBe(true);
  });
});

describe("honeypotInputProps", () => {
  it("renders an off-screen, non-tabbable input", () => {
    const props = honeypotInputProps();
    expect(props.name).toBe(HONEYPOT_FIELD_NAME);
    expect(props.tabIndex).toBe(-1);
    expect(props["aria-hidden"]).toBe("true");
  });
});

describe("checkSubmitAllowed / recordSubmit", () => {
  it("allows the first submission", () => {
    const storage = memoryStorage();
    const result = checkSubmitAllowed("ticket_reservation", { storage, now: 1000 });
    expect(result.allowed).toBe(true);
  });

  it("blocks a second submission within the cooldown window", () => {
    const storage = memoryStorage();
    const now = 1_000_000;
    recordSubmit("ticket_reservation", { storage, now });
    const result = checkSubmitAllowed("ticket_reservation", { storage, now: now + 1000, cooldownMs: 30_000 });
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("cooldown");
  });

  it("allows again after the cooldown elapses", () => {
    const storage = memoryStorage();
    const now = 1_000_000;
    recordSubmit("ticket_reservation", { storage, now });
    const result = checkSubmitAllowed("ticket_reservation", { storage, now: now + 31_000, cooldownMs: 30_000 });
    expect(result.allowed).toBe(true);
  });

  it("blocks once the hourly limit is reached", () => {
    const storage = memoryStorage();
    const now = 1_000_000;
    for (let i = 0; i < 5; i++) {
      recordSubmit("vendor_application", { storage, now: now + i * 40_000 });
    }
    const result = checkSubmitAllowed("vendor_application", { storage, now: now + 5 * 40_000, cooldownMs: 1000, maxPerHour: 5 });
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("hourly_limit");
  });

  it("does not let one form's rate limit affect another", () => {
    const storage = memoryStorage();
    const now = 1_000_000;
    recordSubmit("ticket_reservation", { storage, now });
    const result = checkSubmitAllowed("tenant_inquiry", { storage, now: now + 1 });
    expect(result.allowed).toBe(true);
  });
});
