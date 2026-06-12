import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Ticket, TrendingUp, Users, DollarSign, ArrowRight } from "lucide-react";
import AdminBreadcrumb from "@/components/admin/AdminBreadcrumb";
import StatusBadge from "@/components/admin/StatusBadge";
import TenantSwitcher from "@/components/admin/TenantSwitcher";
import ConfigEditor from "@/components/admin/ConfigEditor";

const TICKET_TYPES = [
  { type: "standard_pass", label: "Standard Pass", price: "SGD 12", enabled: true },
  { type: "premium_pass", label: "Premium Pass", price: "SGD 18", enabled: true },
  { type: "family_pass", label: "Family Pass (up to 5)", price: "SGD 39", enabled: true },
  { type: "school_block_40", label: "School Block — 40 pax", price: "SGD 280", enabled: true },
  { type: "school_block_100", label: "School Block — 100 pax", price: "SGD 600", enabled: true },
  { type: "corporate_block_50", label: "Corporate Block — 50 pax", price: "SGD 650", enabled: true },
  { type: "event_vip_tour", label: "Event / VIP Private Tour", price: "SGD 1500", enabled: true },
];

export default function ModuleTicketing() {
  const { data: tenants = [] } = useQuery({ queryKey: ["mt-tenants"], queryFn: () => base44.entities.MuseumTenant.list() });
  const [activeTenant, setActiveTenant] = useState(null);
  const selected = tenants.find(t => t.id === activeTenant) || tenants[0];
  const { data: tickets = [] } = useQuery({ queryKey: ["mt-tickets", selected?.id], queryFn: () => selected ? base44.entities.Ticket.filter({ tenant_id: selected.id }) : base44.entities.Ticket.list(), enabled: !!selected });

  const revenue = tickets.reduce((s, t) => s + (t.total_price || 0), 0);
  const confirmed = tickets.filter(t => t.status === "confirmed").length;
  const pending = tickets.filter(t => t.status === "pending").length;

  const byType = TICKET_TYPES.map(tt => ({
    ...tt,
    count: tickets.filter(t => t.ticket_type === tt.type).length,
  }));

  return (
    <div className="min-h-screen bg-[#060c18] p-6 lg:p-8">
      <AdminBreadcrumb crumbs={[{ label: "Modules", path: "/admin/modules" }, { label: "Ticketing" }]} />

      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[10px] tracking-[0.3em] text-blue-400 font-semibold mb-1">MODULE 2</p>
          <h1 className="text-2xl font-display font-bold text-foreground">Ticketing Module</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage ticket types, pricing, sales, and access passes across museum tenants.</p>
        </div>
        <TenantSwitcher activeTenant={activeTenant} onChange={setActiveTenant} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
          <p className="text-2xl font-display font-bold text-primary">{tickets.length}</p>
          <p className="text-xs text-muted-foreground">Total Tickets</p>
        </div>
        <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
          <p className="text-2xl font-display font-bold text-emerald-400">{confirmed}</p>
          <p className="text-xs text-muted-foreground">Confirmed</p>
        </div>
        <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
          <p className="text-2xl font-display font-bold text-amber-400">{pending}</p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </div>
        <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
          <p className="text-xl font-display font-bold text-blue-400">SGD {revenue.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Total Revenue</p>
        </div>
      </div>

      <div className="mb-6">
        <ConfigEditor
          tenant={selected}
          configType="module"
          moduleKey="ticketing"
          title={`Ticketing Config${selected ? ` — ${selected.name}` : ""}`}
          description="Saved to ModuleConfig and used by the public ticketing page."
          defaultValue={{ ticket_types: TICKET_TYPES, promo_codes: [], currency: "SGD" }}
        >
          {({ draft, setDraft }) => (
            <div className="space-y-2">
              {(draft.ticket_types || []).map((ticket, index) => (
                <div key={ticket.type || index} className="grid grid-cols-4 gap-2">
                  <input value={ticket.label || ""} onChange={e => { const next = [...draft.ticket_types]; next[index] = { ...ticket, label: e.target.value }; setDraft({ ...draft, ticket_types: next }); }} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground" />
                  <input value={ticket.type || ""} onChange={e => { const next = [...draft.ticket_types]; next[index] = { ...ticket, type: e.target.value }; setDraft({ ...draft, ticket_types: next }); }} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground" />
                  <input value={ticket.price || ""} onChange={e => { const next = [...draft.ticket_types]; next[index] = { ...ticket, price: e.target.value }; setDraft({ ...draft, ticket_types: next }); }} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground" />
                  <select value={ticket.enabled ? "enabled" : "disabled"} onChange={e => { const next = [...draft.ticket_types]; next[index] = { ...ticket, enabled: e.target.value === "enabled" }; setDraft({ ...draft, ticket_types: next }); }} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground">
                    <option value="enabled">Enabled</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              ))}
            </div>
          )}
        </ConfigEditor>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Ticket Types */}
        <div className="bg-white/[0.03] border border-blue-400/15 rounded-xl p-5">
          <p className="text-xs font-semibold text-foreground mb-4 flex items-center gap-2">
            <Ticket className="w-3.5 h-3.5 text-blue-400" />Ticket Types & Pricing
          </p>
          <div className="space-y-2">
            {byType.map(t => (
              <div key={t.type} className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/6">
                <div>
                  <p className="text-xs text-foreground">{t.label}</p>
                  <p className="text-[10px] text-muted-foreground">{t.count} sold</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-primary font-mono">{t.price}</span>
                  <StatusBadge status={t.enabled ? "enabled" : "disabled"} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Sales */}
        <div className="bg-white/[0.03] border border-blue-400/15 rounded-xl p-5">
          <p className="text-xs font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-blue-400" />Recent Purchases
          </p>
          <div className="space-y-2">
            {tickets.slice(0, 7).map(t => (
              <div key={t.id} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-xs text-foreground">{t.visitor_name}</p>
                  <p className="text-[10px] text-muted-foreground">{t.ticket_type?.replace(/_/g, " ")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-primary">{t.currency} {t.total_price || "—"}</span>
                  <StatusBadge status={t.status} />
                </div>
              </div>
            ))}
            {tickets.length === 0 && <p className="text-xs text-muted-foreground py-4 text-center">No ticket sales yet</p>}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Link to="/admin/users-access" className="flex items-center gap-2 text-xs text-blue-400 border border-blue-400/30 px-4 py-2 rounded-lg hover:bg-blue-400/10 transition-colors">
          <Users className="w-3.5 h-3.5" />Users
        </Link>
        <Link to="/admin/modules/analytics" className="flex items-center gap-2 text-xs text-primary border border-primary/30 px-4 py-2 rounded-lg hover:bg-primary/10 transition-colors">
          <ArrowRight className="w-3.5 h-3.5" />Analytics
        </Link>
        <Link to="/admin/services/payments" className="flex items-center gap-2 text-xs text-emerald-400 border border-emerald-400/30 px-4 py-2 rounded-lg hover:bg-emerald-400/10 transition-colors">
          <DollarSign className="w-3.5 h-3.5" />Payment Service
        </Link>
      </div>
    </div>
  );
}