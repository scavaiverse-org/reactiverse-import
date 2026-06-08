import { useMemo, useState } from "react";
import { Copy, FileJson, FileText } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { buildVerbatimExport } from "@/lib/qa-sentinel/verbatim-export";

const EMPTY_FILTERS = { severity: "", status: "", route: "", tenant: "", domain: "", tabOrigin: "", component: "", runId: "", dateFrom: "", dateTo: "" };

export default function QASentinelVerbatimExport({ issues = [], events = [], runs = [], previousExports = [], onExportCreated }) {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [lastExport, setLastExport] = useState(previousExports[0] || null);
  const [blobs, setBlobs] = useState({ json: "", markdown: "", txt: "" });
  const [busy, setBusy] = useState(false);

  const issueOnlyCount = useMemo(() => issues.length, [issues]);

  const createExport = async (exportType, quickFilters = {}, download = true) => {
    setBusy(true);
    try {
      const startedFilters = cleanFilters({ ...filters, ...quickFilters });
      const result = buildVerbatimExport({ issues, events, runs, exportType, filters: startedFilters, previousExports });
      const metadata = result.metadata;
      if (download) downloadBlob(result.blob, `qa-sentinel-export.${exportType === "markdown" ? "md" : exportType}`, exportType);

      const compactExportBlob = `Export generated locally. Checksum: ${metadata.checksum}. Full size: ${metadata.export_size} characters.`;
      setLastExport({ ...metadata, export_blob: compactExportBlob, export_size: metadata.export_size, export_duration_ms: metadata.export_duration_ms });
      setBlobs((current) => ({ ...current, [exportType]: result.blob }));

      try {
        const user = await base44.auth.me();
        if (!result.reused) {
          await base44.entities.QASentinelExport.create({
            export_id: metadata.export_id,
            created_at: metadata.created_at,
            created_by: user.id,
            export_type: exportType,
            issue_count: metadata.issue_count,
            critical_count: metadata.critical_count,
            major_count: metadata.major_count,
            minor_count: metadata.minor_count,
            warning_count: metadata.warning_count,
            regression_count: metadata.regression_count,
            included_tabs: metadata.included_tabs,
            filters: startedFilters,
            export_blob: compactExportBlob,
            checksum: metadata.checksum,
            version: metadata.version,
          });
        }
        await base44.entities.TesterFeedback.create({
          timestamp: metadata.created_at,
          agent_name: "Operational Tester",
          test_category: "QA Sentinel Export",
          page: "QA Sentinel",
          route: "/platform/admin/qa-sentinel",
          expected_result: "QA Sentinel export is downloadable and recorded in tester feedback audit history.",
          actual_result: `Exported ${metadata.issue_count} issues as ${exportType.toUpperCase()} with checksum ${metadata.checksum}.`,
          status: metadata.issue_count > 0 ? "WARNING" : "PASS",
          severity: metadata.critical_count > 0 ? "critical" : metadata.major_count > 0 ? "high" : metadata.issue_count > 0 ? "medium" : "info",
          summary: `QA Sentinel ${exportType.toUpperCase()} export created`,
          details: `Export ID: ${metadata.export_id}. Included ${metadata.issue_count} issues, ${metadata.critical_count} critical, ${metadata.major_count} major, and ${metadata.regression_count} regressions.`,
          recommended_fix: metadata.issue_count > 0 ? "Review exported QA Sentinel findings and resolve open issues." : "No action required.",
          resolved: metadata.issue_count === 0,
          resolved_at: metadata.issue_count === 0 ? metadata.created_at : ""
        });
        onExportCreated?.();
      } catch (error) {
        console.warn("QA Sentinel export history save skipped:", error.message);
      }
    } finally {
      setBusy(false);
    }
  };

  const copyBlob = async (type) => {
    const blob = blobs[type] || buildVerbatimExport({ issues, events, runs, exportType: type, filters: cleanFilters(filters), previousExports }).blob;
    await navigator.clipboard.writeText(blob);
    setBlobs((current) => ({ ...current, [type]: blob }));
  };

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground"><FileJson className="h-4 w-4 text-primary" /> Canonical Verbatim Issue Export</p>
            <p className="mt-1 max-w-3xl text-xs text-muted-foreground">Exports only discovered issues. Verbatim issue fields, runtime evidence, semantic perspectives, fix intelligence, timestamps, events, and regressions are preserved while unsafe secrets are masked.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button disabled={busy} onClick={() => createExport("json")}>Export Verbatim JSON</Button>
            <Button disabled={busy} variant="outline" onClick={() => createExport("markdown")}>Export Verbatim Markdown</Button>
            <Button disabled={busy} variant="outline" onClick={() => createExport("txt")}>Export Verbatim TXT</Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <SelectBox label="Severity" value={filters.severity} onChange={(value) => setFilters({ ...filters, severity: value })} options={["critical", "major", "minor", "warning", "info"]} />
          <SelectBox label="Status" value={filters.status} onChange={(value) => setFilters({ ...filters, status: value })} options={["open", "investigating", "fixed", "ignored", "regressed"]} />
          <SelectBox label="Domain" value={filters.domain} onChange={(value) => setFilters({ ...filters, domain: value })} options={["platform", "master_admin", "tenant_admin", "public_museum", "system"]} />
          <SelectBox label="Tab origin" value={filters.tabOrigin} onChange={(value) => setFilters({ ...filters, tabOrigin: value })} options={["Runtime Truth", "Structural Intelligence", "Semantic Impact"]} />
          <FilterInput label="Route" value={filters.route} onChange={(route) => setFilters({ ...filters, route })} />
          <FilterInput label="Tenant" value={filters.tenant} onChange={(tenant) => setFilters({ ...filters, tenant })} />
          <FilterInput label="Affected component" value={filters.component} onChange={(component) => setFilters({ ...filters, component })} />
          <FilterInput label="Run ID" value={filters.runId} onChange={(runId) => setFilters({ ...filters, runId })} />
          <FilterInput label="Date from" value={filters.dateFrom} onChange={(dateFrom) => setFilters({ ...filters, dateFrom })} />
          <FilterInput label="Date to" value={filters.dateTo} onChange={(dateTo) => setFilters({ ...filters, dateTo })} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button disabled={busy} variant="secondary" onClick={() => createExport("json", { criticalOnly: true })}>Export Critical Only</Button>
          <Button disabled={busy} variant="secondary" onClick={() => createExport("json", { regressionOnly: true })}>Export Regressions Only</Button>
          <Button disabled={busy} variant="secondary" onClick={() => createExport("json", { openOnly: true })}>Export Current Open Issues</Button>
          <Button disabled={busy} variant="secondary" onClick={() => createExport("json", {})}>Export Full Forensic Dump</Button>
          <Button variant="outline" onClick={() => setFilters(EMPTY_FILTERS)}>Clear Filters</Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-7">
        <Metric label="Last export timestamp" value={lastExport?.created_at || "—"} />
        <Metric label="Issue count" value={lastExport?.issue_count ?? issueOnlyCount} />
        <Metric label="Critical count" value={lastExport?.critical_count ?? "—"} />
        <Metric label="Regression count" value={lastExport?.regression_count ?? "—"} />
        <Metric label="Checksum" value={lastExport?.checksum || "—"} />
        <Metric label="Export size" value={lastExport?.export_size || lastExport?.export_blob?.length || "—"} />
        <Metric label="Export duration" value={lastExport?.export_duration_ms ? `${lastExport.export_duration_ms}ms` : "—"} />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold"><FileText className="h-4 w-4 text-primary" /> Copy latest generated format</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => copyBlob("json")}><Copy className="h-4 w-4" /> Copy JSON</Button>
          <Button variant="outline" onClick={() => copyBlob("markdown")}><Copy className="h-4 w-4" /> Copy Markdown</Button>
          <Button variant="outline" onClick={() => copyBlob("txt")}><Copy className="h-4 w-4" /> Copy TXT</Button>
        </div>
      </div>
    </section>
  );
}

function SelectBox({ label, value, onChange, options }) {
  return <div className="space-y-1"><p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p><Select value={value || "all"} onValueChange={(next) => onChange(next === "all" ? "" : next)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{options.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>;
}

function FilterInput({ label, value, onChange }) {
  return <div className="space-y-1"><p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p><Input value={value} onChange={(event) => onChange(event.target.value)} placeholder="Any" /></div>;
}

function Metric({ label, value }) {
  return <div className="rounded-xl border border-white/8 bg-black/15 p-4"><p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p><p className="mt-2 break-words text-sm font-semibold text-foreground">{value}</p></div>;
}

function cleanFilters(filters) {
  return Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== "" && value !== false && value != null));
}

function downloadBlob(content, filename, type) {
  const mime = type === "json" ? "application/json" : "text/plain;charset=utf-8";
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}