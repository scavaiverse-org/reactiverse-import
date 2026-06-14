import { useState } from "react";
import { Outlet, useLocation, useParams } from "react-router-dom";
import { ChevronRight, ShieldCheck, Menu } from "lucide-react";
import DomainAccessGate from "@/components/access/DomainAccessGate";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import TenantAdminSidebar from "./TenantAdminSidebar.jsx";

export default function TenantAdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 1024 : true
  );
  const location = useLocation();
  const { tenantSlug = "" } = useParams();
  const { tenant } = useActiveTenant();
  const adminBase = `/museum/${tenantSlug}/admin`;
  const section = location.pathname === adminBase ? "Dashboard" : location.pathname.split(`${adminBase}/`)[1]?.replace(/-/g, " ");

  return (
    <DomainAccessGate domain="museum">
      <div className="min-h-screen bg-background flex">
        <TenantAdminSidebar open={sidebarOpen} onToggle={() => setSidebarOpen((v) => !v)} />

        <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
          <header className="border-b border-border/50 bg-card/10 px-6 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <button
                type="button"
                onClick={() => setSidebarOpen((v) => !v)}
                className="sm:hidden mr-1 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                title="Toggle sidebar"
              >
                <Menu className="w-4 h-4" />
              </button>
              <span>Museum Administration</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-foreground capitalize">{section}</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] text-muted-foreground tracking-wider">{tenant?.name || "Tenant"} Console</span>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6">
            <div key={location.pathname}>
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </DomainAccessGate>
  );
}