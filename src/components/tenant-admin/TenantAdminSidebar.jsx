import { NavLink, useParams } from "react-router-dom";
import { LayoutDashboard, Sparkles, Compass, Ticket, Store, BookOpen, BarChart3, ArrowLeft, Music } from "lucide-react";
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

export default function TenantAdminSidebar() {
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
    <aside className="w-60 flex-shrink-0 border-r border-border/50 bg-card/20 flex flex-col">
      <div className="px-5 py-5 border-b border-border/40">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-bold tracking-widest text-foreground">{tenant?.name || "Museum"}</p>
            <p className="text-[9px] text-muted-foreground tracking-widest">TENANT CONSOLE</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const path = item.page ? `${adminBase}/${item.page}` : adminBase;
          const badge = badges[path];

          return (
            <NavLink
              key={path}
              to={path}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                  isActive ? "bg-primary/10 text-primary border border-primary/15" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`
              }
            >
              <span className="flex items-center gap-2.5">
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </span>
              {badge > 0 && (
                <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center font-bold">
                  {badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-border/40">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-[10px] text-emerald-400 tracking-wider">TENANT LIVE</span>
        </div>
        <button
          type="button"
          onClick={() => { window.location.assign(`${window.location.origin}/museum/${tenantSlug}/home`); }}
          className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3 h-3" /> Back to Museum
        </button>
      </div>
    </aside>
  );
}