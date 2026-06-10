import { Link } from "react-router-dom";
import { Globe, Sparkles } from "lucide-react";

const footerLinks = [
  {
    title: "Public Flow",
    links: [
      { label: "Consumer Platform", path: "/platform/overview" },
      { label: "View Available Museums", path: "/virtual-experience" },
      { label: "Become a Tenant", path: "/become-a-tenant" },
      { label: "Login", path: "/login" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", path: "/privacy" },
      { label: "Terms", path: "/terms" },
      { label: "Refund Policy", path: "/refund-policy" },
      { label: "Accessibility", path: "/accessibility" },
      { label: "Contact", path: "/contact" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-border/60 bg-card/80 py-14 px-4 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_1fr_1fr] mb-12">
          <div>
            <Link to="/" className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">SCAVerse</p>
                <p className="text-[9px] text-foreground/70 tracking-widest">PUBLIC PLATFORM</p>
              </div>
            </Link>
            <p className="max-w-sm text-xs text-foreground/75 leading-relaxed">
              A focused public entry point for discovering available virtual museums.
            </p>
          </div>

          {footerLinks.map((section) => (
            <div key={section.title}>
              <p className="text-[10px] uppercase tracking-widest text-primary/90 mb-4 font-semibold">{section.title}</p>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.path}>
                    <Link to={link.path} className="text-xs text-foreground/75 hover:text-primary transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border/30 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[10px] text-foreground/70">© 2026 SCAVerse. Public virtual museum platform.</p>
          <div className="flex items-center gap-1.5 text-[10px] text-foreground/65">
            <Globe className="w-3 h-3 text-primary/50" /> Canonical public routes locked
          </div>
        </div>
      </div>
    </footer>
  );
}