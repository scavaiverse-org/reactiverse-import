import { NavLink, useParams } from "react-router-dom";
import {
  LayoutDashboard,
  Sparkles,
  Compass,
  Ticket,
  Store,
  BookOpen,
  BarChart3,
  ArrowLeft,
  Music,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { useAuth } from "@/lib/AuthContext";
import { canAccessMuseum } from "@/lib/access-control";

const navItems = [
  { label: "Dashboard", page: "", icon: LayoutDashboard, exact: true },
  { label: "Museum Home", page: "home", icon: Sparkles },
  { label: "Experience Builder", page: "walkthrough", icon: Compass },
  { label: "Tickets", page: "tickets", icon: Ticket },
  { label: "Vendors", page: "vendors", icon: Store },
  { label: "Exhibits", page: "exhibits", icon: BookOpen },
  { label: "Music", page: "music", icon: Music },
  { label: "Analytics", page: "analytics", icon: BarChart3 },
];

export default function TenantAdminSidebar({ open = true, onToggle }) {
  const { tenantSlug = "" } = useParams();
  const { tenant } = useActiveTenant();
  const { user } = useAuth();
  const canReadAdmin = canAccessMuseum(user, tenant?.id);
  const adminBase = `/museum/${tenantSlug}/admin`;

  const { data: tickets = [] } = useQuery({
    queryKey: ["tenant-admin-nav-tickets", tenant?.id],
    enabled: !!tenant?.id && canReadAdmin,
    queryFn: () => base44.entities.Ticket.filter({ tenant_id: tenant.id }, "-created_date", 5),
    initialData: [],
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ["tenant-admin-nav-vendors", tenant?.id],
    enabled: !!tenant?.id && canReadAdmin,
    queryFn: () => base44.entities.Vendor.filter({ tenant_id: tenant.id }, "-created_date", 5),
    initialData: [],
  });

  const pendingVendors = vendors.filter((vendor) => vendor.status === "pending").length;
  const pendingTickets = tickets.filter((ticket) => ticket.status === "pending").length;

  const badges = {
    [`${adminBase}/vendors`]: pendingVendors,
    [`${adminBase}/tickets`]: pendingTickets,
  };

  return (
    <aside className={`relative flex-shrink-0 border-r border-border/50 bg-card/20 flex flex-col transition-all duration-200 ${open ? "w-60" : "w-14"}`}>
      {/* Toggle tab — pinned to the right edge, very obvious */}
      <button
        type="button"
        onClick={onToggle}
        title={open ? "Collapse sidebar" : "Expand sidebar"}
        className="absolute -right-3.5 top-5 z-20 flex h-7 w-7 items-center justify-center rounded-full border-2 border-primary/40 bg-primary text-primary-foreground shadow-lg hover:bg-primary/80 transition-colors"
      >
        {open ? <ChevronsLeft className="h-3.5 w-3.5" /> : <ChevronsRight className="h-3.5 w-3.5" />}
      </button>

      {/* Branding */}
      <div className={`border-b border-border/40 ${open ? "px-5 py-5" : "px-2 py-5"}`}>
        <div className={`flex items-center gap-2.5 ${open ? "" : "justify-center"}`}>
          <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
          </div>
          {open && (
            <div className="min-w-0">
              <p className="text-xs font-bold tracking-widest text-foreground truncate">{tenant?.name || "Museum"}</p>
              <p className="text-[9px] text-muted-foreground tracking-widest">TENANT CONSOLE</p>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className={`flex-1 py-4 space-y-0.5 ${open ? "px-3" : "px-2"}`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const path = item.page ? `${adminBase}/${item.page}` : adminBase;
          const badge = badges[path];

          return (
            <NavLink
              key={path}
              to={path}
              end={item.exact}
              title={!open ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center justify-between rounded-lg text-xs font-medium transition-all group ${
                  open ? "px-3 py-2.5" : "px-0 py-2.5 justify-center"
                } ${isActive ? "bg-primary/10 text-primary border border-primary/15" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`
              }
            >
              <span className={`flex items-center ${open ? "gap-2.5" : "justify-center w-full"}`}>
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                {open && item.label}
              </span>
              {open && badge > 0 && (
                <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center font-bold">
                  {badge}
                </span>
              )}
              {!open && badge > 0 && (
                <span className="absolute right-1 top-1 w-2 h-2 rounded-full bg-primary" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className={`border-t border-border/40 ${open ? "px-4 py-4" : "px-2 py-4 flex flex-col items-center gap-3"}`}>
        {open && (
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] text-emerald-400 tracking-wider">TENANT LIVE</span>
          </div>
        )}
        {!open && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Tenant live" />}
        <button
          type="button"
          title={!open ? "Back to Museum" : undefined}
          onClick={() => { window.location.assign(`${window.location.origin}/museum/${tenantSlug}/home`); }}
          className={`flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors ${!open ? "justify-center w-full" : ""}`}
        >
          <ArrowLeft className="w-3 h-3 flex-shrink-0" />
          {open && "Back to Museum"}
        </button>
      </div>
    </aside>
  );
}
