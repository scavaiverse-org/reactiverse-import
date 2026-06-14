import { Link, useLocation } from "react-router-dom";
import { DEFAULT_MUSEUM_SLUG } from "@/lib/domain-registry";
import { useAuth } from "@/lib/AuthContext";
import PublicHeaderShell, { PublicHeaderLogo } from "./PublicHeaderShell";

// Legal/contact links live in the footer; keeping the top bar to core
// destinations stops the pill labels being squeezed and clipped on
// smaller desktop widths.
//
// NOTE: this bar deliberately has NO hamburger of its own — the global
// floating MasterHamburgerNav (app shell) occupies the same top-right spot
// on every page, and two stacked hamburgers opened overlapping menus on
// mobile. On narrow screens the pill row scrolls horizontally instead.
const publicNav = [
  { label: "Consumer Platform", path: "/platform/overview" },
  { label: "Available Museums", path: "/virtual-experience" },
  { label: "My Passport", path: "/passport" },
  { label: "Museum Commerce", path: `/museum/${DEFAULT_MUSEUM_SLUG}/commerce` },
  { label: "Walkthrough", path: `/museum/${DEFAULT_MUSEUM_SLUG}/walkthrough` },
  { label: "AI Guide", path: `/museum/${DEFAULT_MUSEUM_SLUG}/guide` },
  { label: "Become Tenant", path: "/become-a-tenant" },
];

const pillClass = (active) =>
  `shrink-0 whitespace-nowrap rounded-full border px-4 py-2 font-ui text-xs font-semibold tracking-[0.08em] transition-colors ${
    active
      ? "border-primary/45 bg-primary/10 text-primary"
      : "border-transparent text-muted-foreground hover:border-border/60 hover:bg-card/50 hover:text-foreground"
  }`;

export default function Navbar() {
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();

  return (
    <PublicHeaderShell className="bg-background/70">
      <div className="flex h-16 items-center justify-between gap-3">
        <PublicHeaderLogo to="/" title="SCAVerse" subtitle="PUBLIC PLATFORM" />

        {/* Swipeable on phones/narrow widths; right-aligned with room to spare. */}
        {/* pr-12 keeps the last pill clear of the floating hamburger button.
            The inner ml-auto wrapper right-aligns the pills when there's room
            but (unlike justify-end) keeps the overflowed start reachable when
            the row scrolls — justify-end clips the leading pills for good. */}
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto pl-2 pr-12 sm:pr-14 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="ml-auto flex items-center gap-1">
            {publicNav.map((link) => (
              <Link key={link.path} to={link.path} className={pillClass(location.pathname === link.path)}>
                {link.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <button type="button" onClick={() => logout(true)} className={pillClass(false)}>
                Logout
              </button>
            ) : (
              <Link to="/login" className={pillClass(location.pathname === "/login")}>
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </PublicHeaderShell>
  );
}
