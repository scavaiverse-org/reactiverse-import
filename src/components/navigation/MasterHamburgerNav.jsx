import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { ROLES, normalizeRole, isMasterUser, getUserTenantIds } from "@/lib/rbac";
import { DEFAULT_MUSEUM_SLUG } from "@/lib/domain-registry";

// Pages every visitor can reach, signed in or not.
const PLATFORM_LINKS = [
  { label: "Platform Home", path: "/" },
  { label: "Onboarding", path: "/onboarding" },
  { label: "Platform Overview", path: "/platform/overview" },
  { label: "Become a Tenant", path: "/become-a-tenant" },
  { label: "Virtual Experience", path: "/virtual-experience" },
  { label: "Pricing", path: "/pricing" },
  { label: "About", path: "/about" },
  { label: "Marketplace", path: "/marketplace" },
  { label: "Showcase", path: "/showcase" },
  { label: "Documentation", path: "/docs" },
  { label: "Contact", path: "/contact" },
];

// Tenant-operator pages, scoped to the signed-in user's own museum.
function tenantLinks(tenantSlug) {
  const base = `/museum/${tenantSlug}`;
  return [
    { label: "Museum Home", path: `${base}/home` },
    { label: "Tenant Admin Dashboard", path: `${base}/admin` },
    { label: "Experience Builder", path: `${base}/admin/walkthrough` },
    { label: "Tickets", path: `${base}/admin/tickets` },
    { label: "Vendors", path: `${base}/admin/vendors` },
    { label: "Exhibits", path: `${base}/admin/exhibits` },
    { label: "Analytics", path: `${base}/admin/analytics` },
  ];
}

// Platform-owner only pages.
const MASTER_LINKS = [
  { label: "Master Dashboard", path: "/platform/admin" },
  { label: "Tenant Registry", path: "/platform/admin/tenants" },
  { label: "Users & Access", path: "/platform/admin/users-access" },
  { label: "All Modules", path: "/platform/admin/modules" },
  { label: "System Health", path: "/platform/admin/infrastructure" },
  { label: "Architecture Blueprint", path: "/platform/admin/architecture-blueprint" },
];

/**
 * Floating master hamburger navigation. Same icon and position for every
 * visitor — only the menu contents change by role:
 *   - Consumers (signed out / PUBLIC_USER): platform pages only.
 *   - Tenant operators: platform pages + their own museum's tenant pages.
 *   - Platform owners (master/platform admin): platform + tenant + master
 *     admin pages.
 * Rendered once at the app shell so it floats, isolated, on every page.
 */
export default function MasterHamburgerNav() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const role = normalizeRole(user?.role);
  const isMaster = isMasterUser(user);
  const isTenantRole = !isMaster && role !== ROLES.PUBLIC_USER;

  const { data: tenants = [] } = useQuery({
    queryKey: ["master-nav-tenants"],
    queryFn: () => base44.entities.MuseumTenant.list(),
    enabled: isMaster || isTenantRole,
    staleTime: 5 * 60 * 1000,
  });

  const userTenantIds = getUserTenantIds(user);
  const userTenant = tenants.find((tenant) => userTenantIds.includes(tenant.id));
  const tenantSlug = userTenant?.slug || (isMaster ? DEFAULT_MUSEUM_SLUG : null);

  const sections = [{ title: "Platform", links: PLATFORM_LINKS }];
  if ((isTenantRole || isMaster) && tenantSlug) {
    sections.push({ title: "Tenant", links: tenantLinks(tenantSlug) });
  }
  if (isMaster) {
    sections.push({ title: "Master Admin", links: MASTER_LINKS });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="fixed right-3 top-3 z-[70] inline-flex h-10 w-10 items-center justify-center rounded-full border border-primary/35 bg-background/35 text-primary shadow-2xl shadow-black/30 backdrop-blur-xl transition duration-300 hover:border-primary/70 hover:bg-primary/15 sm:right-5 sm:top-5"
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={open}
      >
        {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-[65] bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -8 }}
              transition={{ duration: 0.2 }}
              className="fixed right-3 top-16 z-[70] w-64 max-h-[75vh] overflow-y-auto rounded-2xl border border-primary/25 bg-background/90 p-3 shadow-2xl shadow-primary/10 backdrop-blur-2xl sm:right-5 sm:top-[4.5rem]"
              role="navigation"
              aria-label="Master navigation"
            >
              {sections.map((section) => (
                <div key={section.title} className="mb-3 last:mb-0">
                  <p className="px-2 pb-1 text-[9px] font-semibold uppercase tracking-[0.28em] text-primary/70">
                    {section.title}
                  </p>
                  <div className="space-y-0.5">
                    {section.links.map((link) => (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => setOpen(false)}
                        className="block rounded-lg px-2 py-1.5 text-xs text-foreground/80 transition hover:bg-primary/10 hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
