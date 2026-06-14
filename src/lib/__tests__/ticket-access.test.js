import { describe, it, expect, beforeEach } from "vitest";
import { isPaidTicketStatus, readTicketJourney, resolveTicketForTenant } from "../ticket-access";

function installMemoryLocalStorage() {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, value),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  };
  return globalThis.localStorage;
}

describe("isPaidTicketStatus", () => {
  it("treats 'paid' and 'confirmed' as unlocking access", () => {
    expect(isPaidTicketStatus("paid")).toBe(true);
    expect(isPaidTicketStatus("confirmed")).toBe(true);
    expect(isPaidTicketStatus("PAID")).toBe(true);
  });

  it("treats other statuses as not unlocking access", () => {
    expect(isPaidTicketStatus("pending")).toBe(false);
    expect(isPaidTicketStatus("cancelled")).toBe(false);
    expect(isPaidTicketStatus(undefined)).toBe(false);
    expect(isPaidTicketStatus(null)).toBe(false);
  });
});

describe("readTicketJourney", () => {
  beforeEach(() => {
    installMemoryLocalStorage();
  });

  it("returns an empty object when nothing is stored", () => {
    expect(readTicketJourney("tenant-1")).toEqual({});
  });

  it("returns the parsed journey for the given tenant", () => {
    localStorage.setItem("scaverse_ticket_journey_tenant-1", JSON.stringify({ reservation: { id: "res-1", status: "paid" } }));
    expect(readTicketJourney("tenant-1")).toEqual({ reservation: { id: "res-1", status: "paid" } });
  });

  it("scopes journeys per tenant so one tenant cannot read another's reservation", () => {
    localStorage.setItem("scaverse_ticket_journey_tenant-1", JSON.stringify({ reservation: { id: "res-1" } }));
    localStorage.setItem("scaverse_ticket_journey_tenant-2", JSON.stringify({ reservation: { id: "res-2" } }));
    expect(readTicketJourney("tenant-1").reservation.id).toBe("res-1");
    expect(readTicketJourney("tenant-2").reservation.id).toBe("res-2");
  });

  it("falls back to an empty object on malformed JSON", () => {
    localStorage.setItem("scaverse_ticket_journey_tenant-1", "{not-json");
    expect(readTicketJourney("tenant-1")).toEqual({});
  });
});

describe("resolveTicketForTenant", () => {
  it("returns the reservation_status row when its tenant matches", () => {
    const rows = [{ id: "res-1", status: "confirmed", tenant_id: "tenant-1" }];
    expect(resolveTicketForTenant(rows, "tenant-1")).toEqual(rows[0]);
  });

  it("returns null when the reservation belongs to a different tenant", () => {
    const rows = [{ id: "res-1", status: "confirmed", tenant_id: "tenant-2" }];
    expect(resolveTicketForTenant(rows, "tenant-1")).toBeNull();
  });

  it("returns null when there is no reservation row", () => {
    expect(resolveTicketForTenant([], "tenant-1")).toBeNull();
  });
});

// Walks through the same state transitions as the live system:
// TenantTicketJourney inserts a 'pending' ticket -> stripe-checkout starts
// payment -> stripe-webhook marks it 'confirmed' on checkout.session.completed
// -> reservation_status (queried by useTourAccess) reflects the new status.
describe("checkout -> webhook -> tour access", () => {
  const tenantId = "tenant-1";

  it("does not grant access while the reservation is pending payment", () => {
    const reservationStatusRow = { id: "res-1", tenant_id: tenantId, status: "pending", confirmation_stage: "reservation_created" };
    const ticket = resolveTicketForTenant([reservationStatusRow], tenantId);
    const hasAccess = !!ticket && isPaidTicketStatus(ticket.status);
    expect(hasAccess).toBe(false);
  });

  it("grants access once the webhook marks the ticket confirmed", () => {
    // stripe-webhook sets status: 'confirmed', confirmation_stage: 'payment_confirmed'
    // on checkout.session.completed / async_payment_succeeded.
    const reservationStatusRow = { id: "res-1", tenant_id: tenantId, status: "confirmed", confirmation_stage: "payment_confirmed" };
    const ticket = resolveTicketForTenant([reservationStatusRow], tenantId);
    const hasAccess = !!ticket && isPaidTicketStatus(ticket.status);
    expect(hasAccess).toBe(true);
  });

  it("never grants access using a confirmed reservation id from another tenant", () => {
    const reservationStatusRow = { id: "res-1", tenant_id: "tenant-2", status: "confirmed" };
    const ticket = resolveTicketForTenant([reservationStatusRow], tenantId);
    expect(ticket).toBeNull();
  });
});
