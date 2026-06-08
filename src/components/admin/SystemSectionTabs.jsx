import { Link, useLocation } from "react-router-dom";

const tabs = [
  { label: "System Health", path: "/platform/admin/infrastructure" },
  { label: "Live QA Sentinel", path: "/platform/admin/qa-sentinel" },
  { label: "Testers Feedback", path: "/platform/admin/testers-feedback" },
  { label: "Exports", path: "/platform/admin/qa-sentinel?tab=exports" },
];

export default function SystemSectionTabs() {
  const location = useLocation();
  const isExports = location.pathname === "/platform/admin/qa-sentinel" && location.search.includes("tab=exports");

  return (
    <nav className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-2">
      {tabs.map((tab) => {
        const active = tab.label === "Exports"
          ? isExports
          : location.pathname === tab.path && !isExports;
        return (
          <Link
            key={tab.label}
            to={tab.path}
            className={`rounded-xl px-3 py-2 text-xs transition-colors ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"}`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}