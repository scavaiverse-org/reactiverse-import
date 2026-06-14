import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import { canAccessMuseum } from "@/lib/access-control";
import { isMasterUser } from "@/lib/rbac";

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

// Mirrors the tenant-scoping check in useTourAccess: a reservation_status row
// only unlocks access if it belongs to the tenant being viewed, so a stale or
// forged reservation id from another museum can never unlock this tour.
export function resolveTicketForTenant(rows = [], tenantId) {
  const row = rows[0];
  return row && String(row.tenant_id) === String(tenantId) ? row : null;
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
    // Anonymous visitors can't read tickets directly under RLS, so resolve the
    // reservation via the reservation_status RPC (status only, no PII).
    queryFn: async () => {
      const { data } = await supabase.rpc("reservation_status", { p_id: reservation.id });
      return data || [];
    },
    enabled: !!tenant?.id && !!reservation.id && !staffBypass,
    initialData: [],
  });

  const ticket = resolveTicketForTenant(tickets, tenant?.id);
  const hasPaidTicket = !!ticket && isPaidTicketStatus(ticket.status);
  const checking = !staffBypass && !!reservation.id && isLoading;

  return { hasAccess: staffBypass || hasPaidTicket, checking, staffBypass, reservation, ticket };
}
