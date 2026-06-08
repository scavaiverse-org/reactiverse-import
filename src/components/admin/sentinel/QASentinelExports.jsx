import { useMemo, useState } from "react";
import { Copy, Download, FileJson, FileText } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { buildCanonicalIssueExport, checksumFor, downloadExport } from "@/lib/qa-sentinel/verbatim-export";

const EMPTY_FILTERS = { severity: "", status: "", route: "", tenant: "", domain: "", tabOrigin: "", component: "", runId: "", dateFrom: "", dateTo: "", criticalOnly: false, regressionOnly: false, openOnly: true };
const EXPORT_TYPES = ["json", "markdown", "txt"];

export default function QASentinelExports({ issues = [], events = [] }) {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [lastExport, setLastExport] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState("");

  const issueOnlyCount = useMemo(() => issues.filter((issue) => issue?.title).length, [issues]);

  const runExport = async (exportType, override = {}) => {
    setError("");
    setIsExporting(true);
    try {
      const started = performance.now();
      const nextFilters = { ...filters, ...override };
      const user = await base44.auth.me();
      const built = buildCanonicalIssueExport({ issues, events, filters: nextFilters, exportType, createdBy: user?.id || "" });
      if (built.byte_size > built.max_size_bytes) {
        setError("Export is larger than the safe download limit. Narrow filters and try again.");
        return;
      }
      const checksum = await checksumFor(built.export_blob);
      const cached = lastExport?.checksum === checksum && lastExport?.export_type === exportType ? lastExport : null;
      const exportBlob = built.export_blob;
      downloadExport(exportBlob, exportType);
      if (!cached) {
        await base44.entities.QASentinelExport.create({
          ...built.payload.export_metadata,
          checksum,
          export_blob: `Export generated locally. Checksum: ${checksum}. Full size: ${built.byte_size} bytes.`
        });
      }
      const record = { ...built.payload.export_metadata, checksum, export_blob: exportBlob, export_type: exportType, export_size: built.byte_size, duration_ms: Math.round(performance.now() - started) };
      setLastExport(record);
    } finally {
      setIsExporting(false);
    }
  };

  const copyExport = async (exportType) => {
    const built = buildCanonicalIssueExport({ issues, events, filters, exportType, createdBy: "" });
    await navigator.clipboard.writeText(built.export_blob);
    const checksum = await checksumFor(built.export_blob);
    setLastExport({ ...built.payload.export_metadata, checksum, export_blob: built.export_blob, export_type: exportType, export_size: built.byte_size });
  };

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground"><FileJson className="h-4 w-4 text-primary" /> Canonical Verbatim Issue Export</p>
            <p className="mt-1 max-w-3xl text-xs text-muted-foreground">Exports issues only. No healthy systems, passing checks, marketing copy, or unrelated metrics are included.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button disabled={isExporting} onClick={() => runExport("json")}><Download className="h-4 w-4" /> Export Verbatim JSON</Button>
            <Button disabled={isExporting} variant="outline" onClick={() => runExport("markdown")}><FileText className="h-4 w-4" /> Export Verbatim Markdown</Button>
            <Button disabled={isExporting} variant="outline" onClick={() => runExport("txt")}><FileText className="h-4 w-4" /> Export Verbatim TXT</Button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl border border-white/10 bg-black/15 p-4 md:grid-cols-3 lg:grid-cols-5">
        <FilterSelect label="Severity" value={filters.severity} onChange={(value) => setFilters({ ...filters, severity: value === "all" ? "" : value })} options={["all", "critical", "major", "minor", "warning", "info"]} />
        <FilterSelect label="Status" value={filters.status} onChange={(value) => setFilters({ ...filters, status: value === "all" ? "" : value })} options={["all", "open", "investigating", "fixed", "ignored", "regressed"]} />
        <FilterSelect label="Domain" value={filters.domain} onChange={(value) => setFilters({ ...filters, domain: value === "all" ? "" : value })} options={["all", "platform", "master_admin", "tenant_admin", "public_museum", "system"]} />
        <FilterSelect label="Tab origin" value={filters.tabOrigin} onChange={(value) => setFilters({ ...filters, tabOrigin: value === "all" ? "" : value })} options={["all", "Runtime Truth", "Structural Intelligence", "Semantic Impact"]} />
        <FilterInput label="Route" value={filters.route} onChange={(route) => setFilters({ ...filters, route })} />
        <FilterInput label="Tenant" value={filters.tenant} onChange={(tenant) => setFilters({ ...filters, tenant })} />
        <FilterInput label="Affected component" value={filters.component} onChange={(component) => setFilters({ ...filters, component })} />
        <FilterInput label="Run ID" value={filters.runId} onChange={(runId) => setFilters({ ...filters, runId })} />
        <FilterInput label="Date from" type="date" value={filters.dateFrom} onChange={(dateFrom) => setFilters({ ...filters, dateFrom })} />
        <FilterInput label="Date to" type="date" value={filters.dateTo} onChange={(dateTo) => setFilters({ ...filters, dateTo })} />
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <Button disabled={isExporting} variant="outline" onClick={() => runExport("json", { criticalOnly: true, openOnly: false })}>Export Critical Only</Button>
        <Button disabled={isExporting} variant="outline" onClick={() => runExport("json", { regressionOnly: true, openOnly: false })}>Export Regressions Only</Button>
        <Button disabled={isExporting} variant="outline" onClick={() => runExport("json", { openOnly: true })}>Export Current Open Issues</Button>
        <Button disabled={isExporting} onClick={() => runExport("json", { openOnly: false })}>Export Full Forensic Dump</Button>
        {EXPORT_TYPES.map((type) => <Button key={type} variant="secondary" onClick={() => copyExport(type)}><Copy className="h-4 w-4" /> Copy {type === "markdown" ? "Markdown" : type.toUpperCase()}</Button>)}
      </div>

      {error && <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Metric label="Last export timestamp" value={lastExport?.created_at || "—"} />
        <Metric label="Issue count" value={lastExport?.issue_count ?? issueOnlyCount} />
        <Metric label="Critical count" value={lastExport?.critical_count ?? "—"} />
        <Metric label="Regression count" value={lastExport?.regression_count ?? "—"} />
        <Metric label="Export checksum" value={lastExport?.checksum || "—"} />
        <Metric label="Export size" value={lastExport?.export_size ? `${lastExport.export_size} bytes` : "—"} />
        <Metric label="Export duration" value={lastExport?.duration_ms ? `${lastExport.duration_ms} ms` : "—"} />
      </div>
    </section>
  );
}

function FilterInput({ label, value, onChange, type = "text" }) {
  return <label className="space-y-1"><span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span><Input type={type} value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function FilterSelect({ label, value, onChange, options }) {
  return <label className="space-y-1"><span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span><Select value={value || "all"} onValueChange={onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{options.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select></label>;
}

function Metric({ label, value }) {
  return <div className="rounded-xl border border-white/8 bg-black/15 p-4"><p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p><p className="mt-2 break-words text-sm font-semibold text-foreground">{value}</p></div>;
}