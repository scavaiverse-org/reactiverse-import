import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DEFAULT_MUSEUM_SLUG } from "@/lib/domain-registry";
import PublicHeaderShell, { PublicHeaderLogo } from "./PublicHeaderShell";

const SUPERAGENT_URL = "https://app.base44.com/superagent/6a2544656783af4b6e8309c9";

const publicNav = [
  { label: "Consumer Platform", path: "/platform/overview" },
  { label: "Available Museums", path: "/virtual-experience" },
  { label: "Museum Commerce", path: `/museum/${DEFAULT_MUSEUM_SLUG}/commerce` },
  { label: "Walkthrough", path: `/museum/${DEFAULT_MUSEUM_SLUG}/walkthrough` },
  { label: "AI Guide", path: `/museum/${DEFAULT_MUSEUM_SLUG}/guide` },
  { label: "Become Tenant", path: "/become-a-tenant" },
  { label: "Privacy", path: "/privacy" },
  { label: "Terms", path: "/terms" },
  { label: "Refund Policy", path: "/refund-policy" },
  { label: "Contact", path: "/contact" },
  { label: "Accessibility", path: "/accessibility" },
  { label: "Login", path: "/login" },
];

const mobilePublicNav = [
  ...publicNav,
  { label: "Super", path: SUPERAGENT_URL, external: true },
  { label: "Museum Commerce", path: `/museum/${DEFAULT_MUSEUM_SLUG}/commerce` },
  { label: "Museum Walkthrough", path: `/museum/${DEFAULT_MUSEUM_SLUG}/walkthrough` },
  { label: "AI Guide", path: `/museum/${DEFAULT_MUSEUM_SLUG}/guide` },
  { label: "Privacy", path: "/privacy" },
  { label: "Terms", path: "/terms" },
  { label: "Refund Policy", path: "/refund-policy" },
  { label: "Contact", path: "/contact" },
  { label: "Accessibility", path: "/accessibility" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <PublicHeaderShell className="bg-background/70">
        <div className="flex items-center justify-between h-16">
          <PublicHeaderLogo to="/" title="SCAVerse" subtitle="PUBLIC PLATFORM" />

          <div className="hidden lg:flex items-center gap-1">
            {publicNav.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`rounded-full border px-4 py-2 font-ui text-xs font-semibold tracking-[0.08em] transition-colors ${
                  location.pathname === link.path
                    ? "border-primary/45 bg-primary/10 text-primary"
                                         : "border-transparent text-muted-foreground hover:border-border/60 hover:bg-card/50 hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <button
            className="lg:hidden p-2 text-foreground"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-background/95 backdrop-blur-xl border-b border-border overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {mobilePublicNav.map((link) => {
                const className = `block min-h-11 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === link.path
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`;

                if (link.external) {
                  return (
                    <a key={link.path} href={link.path} target="_blank" rel="noreferrer" onClick={() => setMobileOpen(false)} className={className}>
                      {link.label}
                    </a>
                  );
                }

                return (
                  <Link key={link.path} to={link.path} onClick={() => setMobileOpen(false)} className={className}>
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PublicHeaderShell>
  );
}