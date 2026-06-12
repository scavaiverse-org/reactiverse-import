import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { canAccessMuseum } from "@/lib/access-control";
import { isMasterUser } from "@/lib/rbac";
import { legacyTenantFilter } from "@/lib/tenant-query";

// Statuses that unlock tour access — mirrors the Confirmation stage in
// TenantTicketJourney.jsx ("paid"/"confirmed" unlock Begin Tour).
const PAID_STATUSES = ["paid", "confirmed"];

function journeyStorageKey(tenantId) {
  return `scaverse_ticket_journey_${tenantId || "default"}`;
}

export function readTicketJourney(tenantId) {
  try {
    const raw = localStorage.getItem(journeyStorageKey(tenantId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function isPaidTicketStatus(status) {
  return PAID_STATUSES.includes(String(status || "").toLowerCase());
}

// Gate for visitor-facing tour routes. Access is granted when:
//  - the signed-in user is platform staff for this museum (admin preview), or
//  - the visitor's saved reservation is marked paid/confirmed in the DB.
// Always re-checks the ticket row server-side so a stale localStorage copy
// can never unlock access on its own.
export function useTourAccess(tenant) {
  const { user } = useAuth();
  const reservation = readTicketJourney(tenant?.id).reservation || {};
  const staffBypass = !!user && (isMasterUser(user) || canAccessMuseum(user, tenant?.id));

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["tour-access-ticket", tenant?.id, reservation.id],
    // Scope the lookup to this tenant so a reservation id from another
    // museum (stale or forged localStorage) can never unlock this tour.
    queryFn: () => base44.entities.Ticket.filter(legacyTenantFilter(tenant.id, { id: reservation.id })),
    enabled: !!tenant?.id && !!reservation.id && !staffBypass,
    initialData: [],
  });

  const ticket = tickets[0];
  const hasPaidTicket = !!ticket && isPaidTicketStatus(ticket.status);
  const checking = !staffBypass && !!reservation.id && isLoading;

  return { hasAccess: staffBypass || hasPaidTicket, checking, staffBypass, reservation, ticket };
}
