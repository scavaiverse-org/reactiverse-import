import { Link, useLocation } from "react-router-dom";

const tabs = [
  { label: "System Health", path: "/platform/admin/infrastructure" },
  { label: "Live QA Sentinel", path: "/platform/admin/qa-sentinel" },
  { label: "Testers Feedback", path: "/platform/admin/testers-feedback" },
  { label: "Chat With QA", path: "/platform/admin/qa-sentinel?tab=chat", queryParam: "chat" },
  { label: "Exports", path: "/platform/admin/qa-sentinel?tab=exports", queryParam: "exports" },
];

export default function SystemSectionTabs() {
  const { pathname, search } = useLocation();
  const activeParam = new URLSearchParams(search).get("tab");

  return (
    <nav className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-2">
      {tabs.map((tab) => {
        let active;
        if (tab.queryParam) {
          active = pathname === "/platform/admin/qa-sentinel" && activeParam === tab.queryParam;
        } else {
          active = pathname === tab.path && !activeParam;
        }
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
