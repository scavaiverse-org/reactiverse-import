import React from "react";
import { Outlet, NavLink, useLocation, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Ticket, Store, BookOpen, BarChart3,
  Sparkles, ChevronRight, ArrowLeft, Zap, Compass, X
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import DomainAccessGate from "@/components/access/DomainAccessGate";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { useAuth } from "@/lib/AuthContext";
import { canAccessMuseum } from "@/lib/access-control";
import TenantWalkthrough from "@/pages/admin/TenantWalkthrough";

const navItems = [
  { label: "Overview", page: "", icon: LayoutDashboard, exact: true },
  { label: "Home", page: "home", icon: Sparkles },
  { label: "Walkthrough", page: "walkthrough", icon: Compass, overlay: true },
  { label: "Tickets", page: "tickets", icon: Ticket },
  { label: "Vendors", page: "vendors", icon: Store },
  { label: "Exhibits", page: "exhibits", icon: BookOpen },
  { label: "Analytics", page: "analytics", icon: BarChart3 },
];

export default function AdminLayout() {
  const [showWalkthroughEditor, setShowWalkthroughEditor] = React.useState(false);
  const location = useLocation();
  const { tenantSlug = "asian-operatic-museum" } = useParams();
  const adminBase = `/museum/${tenantSlug}/admin`;
  const navWithPaths = navItems.map((item) => ({ ...item, path: item.page ? `${adminBase}/${item.page}` : adminBase }));
  const { tenant } = useActiveTenant();
  const { user } = useAuth();
  const canReadAdmin = canAccessMuseum(user, tenant?.id);

  const { data: tickets = [] } = useQuery({
    queryKey: ["admin-nav-tickets", tenant?.id],
    enabled: !!tenant?.id && canReadAdmin,
    queryFn: () => base44.entities.Ticket.filter({ tenant_id: tenant.id }, "-created_date", 5)
  });
  const { data: vendors = [] } = useQuery({
    queryKey: ["admin-nav-vendors", tenant?.id],
    enabled: !!tenant?.id && canReadAdmin,
    queryFn: () => base44.entities.Vendor.filter({ tenant_id: tenant.id }, "-created_date", 5)
  });

  const pendingVendors = vendors.filter(v => v.status === "pending").length;
  const pendingTickets = tickets.filter(t => t.status === "pending").length;

  const badges = {
    [`${adminBase}/vendors`]: pendingVendors,
    [`${adminBase}/tickets`]: pendingTickets,
  };

  return (
    <DomainAccessGate domain="museum">
      <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 border-r border-border/50 bg-card/20 flex flex-col">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-border/40">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest text-foreground">AOM</p>
              <p className="text-[9px] text-muted-foreground tracking-widest">OPERATIONS</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navWithPaths.map((item) => {
            const Icon = item.icon;
            const badge = badges[item.path];

            if (item.overlay) {
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => setShowWalkthroughEditor(true)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group text-muted-foreground hover:text-foreground hover:bg-secondary"
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="w-3.5 h-3.5" />
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                className={({ isActive: a }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                    a
                      ? "bg-primary/10 text-primary border border-primary/15"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
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

        {/* Status */}
        <div className="px-4 py-4 border-t border-border/40">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-emerald-400 tracking-wider">ALL SYSTEMS LIVE</span>
          </div>
          <button
            type="button"
            onClick={() => { window.location.assign(`${window.location.origin}/museum/${tenantSlug}/home`); }}
            className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3 h-3" /> Back to Site
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top bar */}
        <header className="border-b border-border/50 bg-card/10 px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Admin</span>
            {location.pathname !== adminBase && (
              <>
                <ChevronRight className="w-3 h-3" />
                <span className="text-foreground capitalize">
                  {location.pathname.split(`${adminBase}/`)[1]?.replace(/-/g, " ")}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] text-muted-foreground tracking-wider">AOM ADMIN CONSOLE</span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
      </div>

      {showWalkthroughEditor && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm p-3 sm:p-6">
          <div className="mx-auto flex h-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-primary/20 bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Tenant Admin</p>
                <h2 className="font-display text-xl font-bold text-foreground">Walkthrough Editing Layer</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowWalkthroughEditor(false)}
                className="rounded-lg border border-border/60 p-2 text-muted-foreground hover:text-foreground hover:bg-secondary"
                aria-label="Close walkthrough editor"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 sm:p-6">
              <TenantWalkthrough />
            </div>
          </div>
        </div>
      )}
    </DomainAccessGate>
  );
}