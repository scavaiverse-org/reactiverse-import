import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, Home, Info, Play, Ticket } from "lucide-react";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { museumPath } from "@/lib/domain-registry";
import PublicHeaderShell, { PublicHeaderLogo } from "@/components/layout/PublicHeaderShell";

const primaryItems = [
  { key: "nav_home", label: "Home", page: "home", icon: Home },
  { key: "nav_tickets", label: "Purchase Tickets", page: "tickets", icon: Ticket },
  { key: "nav_about", label: "About Us", page: "about", icon: Info },
  { key: "nav_tour", label: "Begin Tour", page: "begin-tour", icon: Play },
];

export default function TenantNavbar({ ctaSlots = [], tenantOverride = null }) {
  const { tenant: activeTenant } = useActiveTenant();
  const tenant = tenantOverride || activeTenant;
  const location = useLocation();
  const slug = tenant?.slug;
  const navItems = primaryItems.map((item) => ({ ...item, label: ctaSlots.find((cta) => cta.ctaKey === item.key)?.label || item.label, page: ctaSlots.find((cta) => cta.ctaKey === item.key)?.route || item.page }));

  if (!slug) return null;

  return (
    <PublicHeaderShell>
      <nav className="flex flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <PublicHeaderLogo
            to={museumPath(slug, "home")}
            logoUrl={tenant?.logo_url}
            fallback={(tenant?.name || "M").slice(0, 1)}
            title={tenant?.name || "Museum"}
            subtitle={tenant?.theme_config?.tenant_badge || "Tenant Platform"}
          />
          <Link
            to="/virtual-experience"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-display text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/70 transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
          >
            <ArrowLeft className="h-3 w-3" /> Available Museums
          </Link>
        </div>

        <div className="flex flex-wrap gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const to = museumPath(slug, item.page);
            const active = item.page === "tickets" ? location.pathname.startsWith(museumPath(slug, "tickets")) : location.pathname === to;
            return (
              <Link
                key={item.page}
                to={to}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 font-display text-xs font-semibold uppercase tracking-[0.14em] transition ${
                  active
                    ? "border-primary/60 bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "border-white/10 bg-white/5 text-foreground/75 hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {item.label}
              </Link>
            );
            })}
            </div>
            </nav>
            </PublicHeaderShell>
            );
            }