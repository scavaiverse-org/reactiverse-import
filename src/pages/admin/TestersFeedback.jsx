import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AdminBreadcrumb from "@/components/admin/AdminBreadcrumb";
import StatusBadge from "@/components/admin/StatusBadge";
import SystemSectionTabs from "@/components/admin/SystemSectionTabs";
import { AlertTriangle, CheckCircle2, Clock, ClipboardCheck, XCircle } from "lucide-react";

const FILTERS = ["All", "Agent A", "Agent B", "Agent C", "Agent D", "Manual QA", "Critical", "High", "Medium", "Low", "Resolved", "Unresolved"];

const TEST_SUITES = [
  { agent: "Agent A", name: "Operational Tester", tests: ["Admin → Public Sync", "CRUD Persistence", "Tenant Isolation", "Analytics Event Creation", "Launch Readiness Changes"] },
  { agent: "Agent B", name: "Visitor Tester", tests: ["Public Route Crawl", "Onboarding Flow", "Walkthrough Flow", "Deterministic CTA Behavior", "Mobile Experience", "Accessibility Controls"] },
  { agent: "Agent C", name: "Accessibility Tester", tests: ["Reduced Motion", "Calm Mode", "Larger Text", "Contrast", "Overlay Close Behavior", "Keyboard Reachability"] },
  { agent: "Agent D", name: "Tenant Isolation Tester", tests: ["Tenant A vs Tenant B", "Tenant B vs Tenant C", "Tenant C vs Tenant D", "Tenant D vs Tenant E", "Tenant-Specific Public Content", "Tenant-Specific Analytics"] },
];

const statusStyles = {
  PASS: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  FAIL: "text-red-400 bg-red-400/10 border-red-400/30",
  WARNING: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  NOT_RUN: "text-slate-400 bg-slate-400/10 border-slate-400/30",
  MANUAL_QA_REQUIRED: "text-blue-400 bg-blue-400/10 border-blue-400/30",
};

const severityStyles = {
  critical: "text-red-300 bg-red-500/15 border-red-500/40",
  high: "text-orange-300 bg-orange-500/15 border-orange-500/40",
  medium: "text-amber-300 bg-amber-500/15 border-amber-500/40",
  low: "text-blue-300 bg-blue-500/15 border-blue-500/40",
  info: "text-slate-300 bg-slate-500/15 border-slate-500/40",
};

function StatCard({ title, value, icon: Icon, tone = "text-primary" }) {
  return (
    <Card className="bg-card/70 border-white/10">
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <Icon className={`w-6 h-6 ${tone}`} />
      </CardContent>
    </Card>
  );
}

function Pill({ children, className }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold ${className}`}>{children}</span>;
}

function mergeRealtimeFeedback(current, event) {
  if (!event?.data && !event?.id) return current;
  if (event.type === "delete") return current.filter((item) => item.id !== event.id);
  const data = event.data || event;
  return [data, ...current.filter((item) => item.id !== data.id)]
    .sort((a, b) => new Date(b.created_date || b.timestamp) - new Date(a.created_date || a.timestamp))
    .slice(0, 300);
}

export default function TestersFeedback() {
  const [activeFilter, setActiveFilter] = useState("All");
  const queryClient = useQueryClient();

  const { data: feedback = [], isLoading } = useQuery({
    queryKey: ["tester-feedback"],
    queryFn: () => base44.entities.TesterFeedback.list("-created_date", 300),
    initialData: [],
  });

  useEffect(() => {
    const unsubscribe = base44.entities.TesterFeedback.subscribe((event) => {
      queryClient.setQueryData(["tester-feedback"], (current = []) => mergeRealtimeFeedback(current, event));
    });
    return unsubscribe;
  }, [queryClient]);

  const stats = useMemo(() => {
    const failed = feedback.filter((item) => item.status === "FAIL").length;
    const warnings = feedback.filter((item) => item.status === "WARNING").length;
    const passed = feedback.filter((item) => item.status === "PASS").length;
    const resolved = feedback.filter((item) => item.resolved).length;
    return {
      total: feedback.length,
      passed,
      failed,
      warnings,
      open: feedback.filter((item) => !item.resolved && item.status !== "PASS").length,
      resolved,
    };
  }, [feedback]);

  const filteredFeedback = useMemo(() => {
    return feedback.filter((item) => {
      if (activeFilter === "All") return true;
      if (activeFilter === "Agent A") return item.agent_name === "Operational Tester";
      if (activeFilter === "Agent B") return item.agent_name === "Visitor Tester";
      if (activeFilter === "Agent C") return item.agent_name === "Accessibility Tester";
      if (activeFilter === "Agent D") return item.agent_name === "Tenant Isolation Tester";
      if (activeFilter === "Manual QA") return item.status === "MANUAL_QA_REQUIRED";
      if (activeFilter === "Resolved") return item.resolved;
      if (activeFilter === "Unresolved") return !item.resolved;
      return item.severity === activeFilter.toLowerCase();
    });
  }, [activeFilter, feedback]);

  const hasBlockingFailures = feedback.some((item) => !item.resolved && item.status === "FAIL" && ["critical", "high"].includes(item.severity));

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <AdminBreadcrumb crumbs={[{ label: "System" }, { label: "Testers Feedback" }]} />
      <SystemSectionTabs />

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-primary" />
            </div>
            <StatusBadge status={hasBlockingFailures ? "error" : "healthy"} />
          </div>
          <h1 className="text-3xl font-bold font-display">Testers Feedback</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Permanent audit repository for tester feedback, QA Sentinel exports, manual test attempts, and historical audit records across operational, visitor, accessibility, and tenant isolation checks.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
        <StatCard title="Total Tests" value={stats.total} icon={ClipboardCheck} />
        <StatCard title="Passed" value={stats.passed} icon={CheckCircle2} tone="text-emerald-400" />
        <StatCard title="Failed" value={stats.failed} icon={XCircle} tone="text-red-400" />
        <StatCard title="Warnings" value={stats.warnings} icon={AlertTriangle} tone="text-amber-400" />
        <StatCard title="Open Issues" value={stats.open} icon={Clock} tone="text-orange-400" />
        <StatCard title="Resolved" value={stats.resolved} icon={CheckCircle2} tone="text-blue-400" />
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {TEST_SUITES.map((suite) => (
          <Card key={suite.agent} className="bg-card/70 border-white/10">
            <CardContent className="p-4">
              <p className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase">{suite.agent}</p>
              <h2 className="font-semibold mt-1">{suite.name}</h2>
              <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                {suite.tests.map((test) => <li key={test}>• {test}</li>)}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card/70 border-white/10 mb-6">
        <CardContent className="p-4 flex flex-wrap gap-2">
          {FILTERS.map((filter) => (
            <Button
              key={filter}
              size="sm"
              variant={activeFilter === filter ? "default" : "outline"}
              onClick={() => setActiveFilter(filter)}
              className="text-xs"
            >
              {filter}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-card/70 border-white/10">
        <div className="p-6 pb-0">
          <h2 className="text-lg font-semibold leading-none tracking-tight">Audit Records</h2>
        </div>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Loading tester feedback...</div>
          ) : filteredFeedback.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-white/10 rounded-xl">
              <ClipboardCheck className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-semibold">No test records yet</p>
              <p className="text-sm text-muted-foreground mt-1">Run Operational Tester or Visitor Tester to create permanent audit records.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFeedback.map((item) => (
                <div key={item.id} className="p-4 rounded-xl border border-white/10 bg-background/40">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Pill className={statusStyles[item.status] || statusStyles.NOT_RUN}>{item.status}</Pill>
                        <Pill className={severityStyles[item.severity] || severityStyles.info}>{item.severity || "info"}</Pill>
                        {item.resolved && <Pill className="text-blue-300 bg-blue-500/15 border-blue-500/40">RESOLVED</Pill>}
                      </div>
                      <h3 className="font-semibold">{item.summary}</h3>
                      <p className="text-sm text-muted-foreground">{item.details}</p>
                      {item.recommended_fix && (
                        <p className="text-sm text-primary/90"><span className="font-semibold">Fix:</span> {item.recommended_fix}</p>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground lg:text-right space-y-1 min-w-48">
                      <p>{item.timestamp ? new Date(item.timestamp).toLocaleString() : "No timestamp"}</p>
                      <p>{item.agent_name}</p>
                      <p>{item.test_category}</p>
                      {(item.page || item.route) && <p>{item.page || item.route}</p>}
                      {item.screenshot_url && <a className="text-primary hover:underline" href={item.screenshot_url} target="_blank" rel="noreferrer">Screenshot</a>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}