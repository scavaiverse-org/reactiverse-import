import { describe, it, expect, beforeEach } from "vitest";
import { isPaidTicketStatus, readTicketJourney } from "../ticket-access";

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
