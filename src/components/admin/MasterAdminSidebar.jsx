import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import NotificationBell from "@/components/admin/NotificationBell";
import {
  LayoutDashboard, Users, Layers, Package, Server, Database,
  Activity, Building2, Palette, BarChart3, Rocket,
  ChevronRight, Globe, Brain, Ticket, Store, ShoppingBag,
  Gamepad2, Map, FileText, Image, User, Milestone,
  Tag, GitBranch, CreditCard, Bell, Search, Puzzle, Zap,
  ClipboardCheck, Music, LayoutGrid, Receipt
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DEFAULT_MUSEUM_SLUG } from "@/lib/domain-registry";

const NAV = [
  {
    group: "Command Center",
    items: [
      { label: "Master Dashboard", path: "/platform/admin", icon: LayoutDashboard },
      { label: "Home Gateway", path: "/platform/admin/home", icon: Globe },
      { label: "Pages", path: "/platform/admin/pages", icon: FileText },
    ]
  },
  {
    group: "Users & Access",
    items: [
      { label: "Users & Access", path: "/platform/admin/users-access", icon: Users },
    ]
  },
  {
    group: "Experience",
    items: [
      { label: "Experience Layer", path: "/platform/admin/experience-layer", icon: Layers },
    ]
  },
  {
    group: "Business Modules",
    items: [
      { label: "All Modules", path: "/platform/admin/modules", icon: Package },
      { label: "Walkthrough Policy", path: "/platform/admin/modules/walkthrough", icon: Map },
      { label: "Onboarding", path: "/platform/admin/modules/onboarding", icon: Rocket },
      { label: "Ticketing", path: "/platform/admin/modules/ticketing", icon: Ticket },
      { label: "UEN — Payment Proofs", path: "/platform/admin/uen", icon: Receipt },
      { label: "AI Guide", path: "/platform/admin/modules/ai-guide", icon: Brain },
      { label: "Vendors", path: "/platform/admin/modules/vendors", icon: Store },
      { label: "Commerce", path: "/platform/admin/modules/commerce", icon: ShoppingBag },
      { label: "Analytics", path: "/platform/admin/modules/analytics", icon: BarChart3 },
      { label: "Gamification", path: "/platform/admin/modules/gamification", icon: Gamepad2 },
    ]
  },
  {
    group: "Platform Services",
    items: [
      { label: "All Services", path: "/platform/admin/platform-services", icon: Server },
      { label: "Identity", path: "/platform/admin/services/identity", icon: User },
      { label: "CMS", path: "/platform/admin/services/cms", icon: FileText },
      { label: "AI & Personalization", path: "/platform/admin/services/ai-personalization", icon: Brain },
      { label: "Notifications", path: "/platform/admin/services/notifications", icon: Bell },
      { label: "Search", path: "/platform/admin/services/search", icon: Search },
      { label: "Payments", path: "/platform/admin/services/payments", icon: CreditCard },
      { label: "Integrations", path: "/platform/admin/services/integrations", icon: Puzzle },
    ]
  },
  {
    group: "Content & Data",
    items: [
      { label: "Content Overview", path: "/platform/admin/content-data", icon: Database },
      { label: "Exhibits", path: "/platform/admin/content/exhibits", icon: Milestone },
      { label: "Media Library", path: "/platform/admin/content/media-library", icon: Image },
      { label: "Music Templates", path: "/platform/admin/music", icon: Music },
      { label: "onboardingsong", path: "/platform/admin/onboardingsong", icon: Music },
      { label: "Animations", path: "/platform/admin/content/animations", icon: Zap },
      { label: "Characters", path: "/platform/admin/content/characters", icon: User },
      { label: "Stations", path: "/platform/admin/content/stations", icon: Map },
      { label: "Metadata", path: "/platform/admin/content/metadata", icon: Tag },
      { label: "Version Control", path: "/platform/admin/content/version-control", icon: GitBranch },
    ]
  },
  {
    group: "System",
    items: [
      { label: "System Health", path: "/platform/admin/infrastructure", icon: Activity },
      { label: "Live QA Sentinel", path: "/platform/admin/qa-sentinel", icon: Activity },
      { label: "Testers Feedback", path: "/platform/admin/testers-feedback", icon: ClipboardCheck },
    ]
  },
  {
   group: "Multi-Tenant",
   items: [
     { label: "Tenant Registry", path: "/platform/admin/tenants", icon: Building2 },
     { label: "White Label", path: "/platform/admin/white-label", icon: Palette },
     { label: "Architecture Blueprint", path: "/platform/admin/architecture-blueprint", icon: FileText },
     { label: "Tenant Admin Console", path: `/museum/${DEFAULT_MUSEUM_SLUG}/admin`, icon: LayoutGrid },
   ]
  }
];

const UEN_PATH = "/platform/admin/uen";

export default function MasterAdminSidebar() {
  const { pathname } = useLocation();

  // Live count of payment proofs awaiting review — surfaces as a badge on the
  // UEN nav item so admins notice new pre-sale submissions. Refetches on focus
  // and every minute.
  const { data: pendingProofs = 0 } = useQuery({
    queryKey: ["uen-pending-count"],
    queryFn: async () => {
      const rows = await base44.entities.PaymentProof.filter({ status: "pending" }, "-created_at", 200);
      return rows.length;
    },
    initialData: 0,
    refetchInterval: 60000,
  });

  return (
    <aside className="w-64 min-h-screen bg-[#070d1a] border-r border-white/5 flex flex-col flex-shrink-0">
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between gap-2">
        <Link to="/platform/admin" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-primary/20 border border-primary/40 flex items-center justify-center">
            <Globe className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground leading-tight">Platform Admin</p>
            <p className="text-[9px] text-muted-foreground tracking-widest">MASTER CONTROL</p>
          </div>
        </Link>
        <NotificationBell />
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {NAV.map((section) => (
          <div key={section.group}>
            <p className="text-[9px] text-muted-foreground/50 tracking-[0.2em] font-semibold px-2 mb-1 uppercase">
              {section.group}
            </p>
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2.5 px-2 py-1.5 rounded-md text-xs transition-all",
                    active
                      ? "bg-primary/15 text-primary border border-primary/25"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {item.path === UEN_PATH && pendingProofs > 0 && (
                    <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500/90 px-1 text-[9px] font-bold text-black">{pendingProofs}</span>
                  )}
                  {active && !(item.path === UEN_PATH && pendingProofs > 0) && <ChevronRight className="w-3 h-3 ml-auto text-primary/60" />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-white/5">
        <button
          type="button"
          onClick={() => { window.location.assign(`${window.location.origin}/`); }}
          className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
        >
          <Globe className="w-3 h-3" /> View Homepage
        </button>
      </div>
    </aside>
  );
}