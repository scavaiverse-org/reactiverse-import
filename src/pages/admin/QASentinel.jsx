import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Radio, ShieldAlert } from "lucide-react";
import { base44 } from "@/api/base44Client";
import QASentinelSeverityCards from "@/components/admin/sentinel/QASentinelSeverityCards";
import QASentinelOverview from "@/components/admin/sentinel/QASentinelOverview";
import QASentinelIssueTable from "@/components/admin/sentinel/QASentinelIssueTable";
import QASentinelIssueDrawer from "@/components/admin/sentinel/QASentinelIssueDrawer";
import QASentinelRunTimeline from "@/components/admin/sentinel/QASentinelRunTimeline";
import QASentinelRouteMatrix from "@/components/admin/sentinel/QASentinelRouteMatrix";
import QASentinelTesterControls from "@/components/admin/sentinel/QASentinelTesterControls";
import QASentinelCoverageMap from "@/components/admin/sentinel/QASentinelCoverageMap";
import QASentinelSemanticTab from "@/components/admin/sentinel/QASentinelSemanticTab";
import QASentinelEventsPanel from "@/components/admin/sentinel/QASentinelEventsPanel";
import QASentinelVerbatimExport from "@/components/admin/sentinel/QASentinelVerbatimExport";
import QASentinelThinkingLayers from "@/components/admin/sentinel/QASentinelThinkingLayers";
import SystemSectionTabs from "@/components/admin/SystemSectionTabs";
import { adminTabDefinitions } from "@/lib/qa-sentinel/registry";
import { sentinelCheckDefinitions } from "@/lib/qa-sentinel/check-definitions";
import { buildStaticCoverageMap, detectVisibleCtas, runInAppSentinelScan } from "@/lib/qa-sentinel/runtime-capture";
import { ignoreIssue, markIssueFixed, recordSentinelEvent } from "@/lib/qa-sentinel/issue-lifecycle";
import { externalRunnerStatus } from "@/lib/qa-sentinel/external-runner-adapter";
import { buildFixIntelligence } from "@/lib/qa-sentinel/fix-intelligence";

const tabs = ["Overview", "Runtime Truth", "Structural Intelligence", "Semantic Impact", "Live Issues", "Route Matrix", "CTA Matrix", "Runs", "Events", "Exports", "Settings"];

export default function QASentinel() {
  const [activeTab, setActiveTab] = useState(() => new URLSearchParams(window.location.search).get("tab") === "exports" ? "Exports" : "Overview");
  const [issues, setIssues] = useState([]);
  const [runs, setRuns] = useState([]);
  const [events, setEvents] = useState([]);
  const [ctas, setCtas] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [realtime, setRealtime] = useState("connecting");
  const [hideFixed, setHideFixed] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [lastLiveRefresh, setLastLiveRefresh] = useState(new Date().toISOString());

  const liveQueryOptions = { refetchInterval: 3000, refetchIntervalInBackground: true };
  const issuesQuery = useQuery({ queryKey: ["qa-sentinel-issues"], queryFn: () => base44.entities.QASentinelIssue.list("-last_seen_at", 500), initialData: [], ...liveQueryOptions });
  const runsQuery = useQuery({ queryKey: ["qa-sentinel-runs"], queryFn: () => base44.entities.QASentinelRun.list("-started_at", 50), initialData: [], ...liveQueryOptions });
  const eventsQuery = useQuery({ queryKey: ["qa-sentinel-events"], queryFn: () => base44.entities.QASentinelEvent.list("-timestamp", 500), initialData: [], ...liveQueryOptions });
  const exportsQuery = useQuery({ queryKey: ["qa-sentinel-exports"], queryFn: () => base44.entities.QASentinelExport.list("-created_at", 20), initialData: [] });

  useEffect(() => setIssues(issuesQuery.data || []), [issuesQuery.data]);
  useEffect(() => {
    const missing = (issuesQuery.data || []).filter((issue) => !issue.root_cause_hypothesis || !(issue.regression_test_steps || []).length).slice(0, 50);
    if (!missing.length) return;
    Promise.all(missing.map((issue) => base44.entities.QASentinelIssue.update(issue.id, buildFixIntelligence(issue)))).then(() => issuesQuery.refetch());
  }, [issuesQuery.data]);
  useEffect(() => setRuns(runsQuery.data || []), [runsQuery.data]);
  useEffect(() => setEvents(eventsQuery.data || []), [eventsQuery.data]);
  useEffect(() => {
    const refreshCtas = () => setCtas(detectVisibleCtas());
    refreshCtas();
    const timer = window.setInterval(() => {
      refreshCtas();
      setLastLiveRefresh(new Date().toISOString());
    }, 3000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const unsubscribers = [];
    try {
      unsubscribers.push(base44.entities.QASentinelIssue.subscribe((event) => {
        setIssues((current) => mergeRealtime(current, event, "last_seen_at", 500));
      }));
      unsubscribers.push(base44.entities.QASentinelRun.subscribe((event) => {
        setRuns((current) => mergeRealtime(current, event, "started_at", 50));
      }));
      unsubscribers.push(base44.entities.QASentinelEvent.subscribe((event) => {
        setEvents((current) => mergeRealtime(current, event, "timestamp", 100));
      }));
      setRealtime("live");
    } catch {
      setRealtime("disconnected");
    }
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe?.());
  }, []);

  const activeIssues = useMemo(() => issues.filter((issue) => !hideFixed || !["fixed", "ignored"].includes(issue.status)), [issues, hideFixed]);
  const counts = useMemo(() => ({
    critical: activeIssues.filter((issue) => issue.severity === "critical" && !["fixed", "ignored"].includes(issue.status)).length,
    major: activeIssues.filter((issue) => issue.severity === "major" && !["fixed", "ignored"].includes(issue.status)).length,
    minor: activeIssues.filter((issue) => issue.severity === "minor" && !["fixed", "ignored"].includes(issue.status)).length,
    warning: activeIssues.filter((issue) => issue.severity === "warning" && !["fixed", "ignored"].includes(issue.status)).length,
    regressed: activeIssues.filter((issue) => issue.status === "regressed").length
  }), [activeIssues]);
  const latestRun = runs[0];
  const routeRows = useMemo(() => buildStaticCoverageMap(activeIssues), [activeIssues]);
  const adminRows = useMemo(() => adminTabDefinitions.map((tab) => {
    const tabIssues = activeIssues.filter((issue) => issue.route === tab.route);
    return { ...tab, path: tab.route, last_status: tabIssues.length ? "failing" : "mapped_only", open_issue_count: tabIssues.length, last_issue_title: tabIssues[0]?.title || "Mapped, not runtime verified" };
  }), [activeIssues]);
  const score = useMemo(() => {
    const untestedCriticalRoutes = routeRows.filter((row) => row.critical && ["mapped_only", "untested"].includes(row.last_status)).length;
    return Math.max(0, Math.min(100, 100 - counts.critical * 15 - counts.major * 6 - counts.minor * 2 - counts.warning - counts.regressed * 10 - untestedCriticalRoutes * 3));
  }, [counts, routeRows]);

  const runScan = async (type) => {
    setIsRunning(true);
    await runInAppSentinelScan(type);
    setIsRunning(false);
  };

  const exportReport = () => {
    setActiveTab("Exports");
  };

  const refreshIssues = async () => {
    const refreshed = await issuesQuery.refetch();
    setIssues(refreshed.data || []);
  };

  const clearFixedIssuesFromView = async () => {
    setHideFixed(true);
    setIssues((current) => current.filter((issue) => !["fixed", "ignored"].includes(issue.status)));
    await refreshIssues();
  };

  const handleMarkFixed = async (issue) => {
    const updated = await markIssueFixed(issue);
    setIssues((current) => current.map((item) => item.id === issue.id ? { ...item, ...updated } : item));
    setSelectedIssue(null);
    await refreshIssues();
  };

  const handleIgnoreIssue = async (issue) => {
    const updated = await ignoreIssue(issue);
    setIssues((current) => current.map((item) => item.id === issue.id ? { ...item, ...updated } : item));
    setSelectedIssue(null);
    await refreshIssues();
  };

  const retestIssue = async (issue) => {
    await recordSentinelEvent({ event_type: "issue_updated", route: issue.route, message: `Retest requested: ${issue.title}`, severity: "info", metadata: { issue_key: issue.issue_key } });
    await runScan("regression");
  };

  const loading = issuesQuery.isLoading || runsQuery.isLoading || eventsQuery.isLoading || exportsQuery.isLoading;

  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto max-w-[96rem] space-y-6">
        <header className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-6 shadow-2xl shadow-black/20">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-primary"><ShieldAlert className="h-4 w-4" /> Master Admin Semantic Layer</p>
              <h1 className="font-display text-4xl font-bold text-foreground">AOM Live QA Sentinel</h1>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Realtime semantic testing layer for routes, CTAs, admin tabs, forms, media, tenant isolation, and runtime failures.</p>
            </div>
            <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs ${realtime === "live" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : "border-red-400/30 bg-red-400/10 text-red-300"}`}>
              <Radio className={`h-3.5 w-3.5 ${realtime === "live" ? "animate-pulse" : ""}`} /> {realtime === "live" ? "LIVE" : realtime === "connecting" ? "Connecting realtime" : "Realtime disconnected"}
            </div>
          </div>
        </header>

        <SystemSectionTabs />

        <QASentinelTesterControls onRun={runScan} onClearFixed={clearFixedIssuesFromView} onExport={exportReport} isRunning={isRunning || loading} />
        <QASentinelThinkingLayers realtime={realtime} issueCount={activeIssues.length} eventCount={events.length} score={score} latestRun={latestRun} lastUpdated={lastLiveRefresh} loading={issuesQuery.isFetching || runsQuery.isFetching || eventsQuery.isFetching} />
        <QASentinelSeverityCards score={score} counts={counts} latestRun={latestRun} routeCount={latestRun?.routes_tested || 0} ctaCount={latestRun?.ctas_tested || ctas.length} formCount={latestRun?.forms_tested || document.querySelectorAll("form").length} livePulse={events.length} />

        <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-2">
          {tabs.map((tab) => <button key={tab} onClick={() => setActiveTab(tab)} className={`rounded-xl px-3 py-2 text-xs transition-colors ${activeTab === tab ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"}`}>{tab}</button>)}
        </div>

        {activeTab === "Overview" && <QASentinelOverview issues={activeIssues} events={events} checks={sentinelCheckDefinitions} ctas={ctas} onSelectIssue={setSelectedIssue} />}
        {activeTab === "Runtime Truth" && <QASentinelSemanticTab tab="Runtime Truth" issues={activeIssues} onSelectIssue={setSelectedIssue} />}
        {activeTab === "Structural Intelligence" && <QASentinelSemanticTab tab="Structural Intelligence" issues={activeIssues} onSelectIssue={setSelectedIssue} />}
        {activeTab === "Semantic Impact" && <QASentinelSemanticTab tab="Semantic Impact" issues={activeIssues} onSelectIssue={setSelectedIssue} />}
        {activeTab === "Live Issues" && <QASentinelIssueTable issues={activeIssues} onSelectIssue={setSelectedIssue} />}
        {activeTab === "Route Matrix" && <div className="space-y-5"><QASentinelRouteMatrix rows={routeRows} /><QASentinelRouteMatrix rows={adminRows} title="Admin Tab Matrix" /></div>}
        {activeTab === "CTA Matrix" && <QASentinelCoverageMap checks={sentinelCheckDefinitions.filter((check) => check.check_type === "cta")} ctas={ctas} />}
        {activeTab === "Runs" && <QASentinelRunTimeline runs={runs} />}
        {activeTab === "Events" && <QASentinelEventsPanel events={events} />}
        {activeTab === "Exports" && <QASentinelVerbatimExport issues={issues} events={events} runs={runs} previousExports={exportsQuery.data || []} onExportCreated={() => exportsQuery.refetch()} />}

        {activeTab === "Settings" && <SettingsPanel />}
      </div>

      <QASentinelIssueDrawer issue={selectedIssue} onClose={() => setSelectedIssue(null)} onRetest={retestIssue} onMarkFixed={handleMarkFixed} onIgnore={handleIgnoreIssue} />
    </div>
  );
}

function SettingsPanel() {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground"><Activity className="h-4 w-4 text-primary" /> Sentinel Settings</p>
      <div className="grid gap-3 md:grid-cols-2">
        <Info label="Runtime Mode" value="Level 1 in-app Sentinel is active: runtime capture, registry coverage, visible CTA detection, and realtime issue lifecycle." />
        <Info label="Semantic Tabs" value="Runtime Truth, Structural Intelligence, and Semantic Impact read from the same issue universe and exclude healthy checks." />
        <Info label="Verbatim Export" value="Exports contain issues only, preserve stored wording and evidence, deduplicate by fingerprint, and mask unsafe secrets." />
        <Info label="External Runner" value={externalRunnerStatus.message} />
        <Info label="No Credit Burn" value="Classification and export generation are deterministic and rule-based. No LLM loop is used." />
        <Info label="Data Safety" value="Emails, tokens, passwords, payment-like strings, API keys, and request bodies are masked or omitted." />
      </div>
    </section>
  );
}

function Info({ label, value }) {
  return <div className="rounded-xl border border-white/8 bg-black/15 p-4"><p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p><p className="mt-2 text-sm text-foreground/80">{value}</p></div>;
}

function mergeRealtime(current, event, sortKey, limit) {
  if (!event?.data && !event?.id) return current;
  if (event.type === "delete") return current.filter((item) => item.id !== event.id);
  const data = event.data || event;
  const next = [data, ...current.filter((item) => item.id !== data.id)];
  return next.sort((a, b) => new Date(b[sortKey] || b.updated_date || b.created_date) - new Date(a[sortKey] || a.updated_date || a.created_date)).slice(0, limit);
}