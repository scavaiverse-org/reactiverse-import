import { Download, FileText } from "lucide-react";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";

export default function QASentinelPdfExport({ issues = [] }) {
  const exportPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 36;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const maxWidth = pageWidth - margin * 2;
    let y = margin;

    const addLine = (text, size = 9, isBold = false) => {
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      doc.setFontSize(size);
      const lines = doc.splitTextToSize(String(text || "—"), maxWidth);
      lines.forEach((line) => {
        if (y > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += size + 4;
      });
    };

    addLine("AOM Live QA Sentinel — Verbatim Findings Export", 14, true);
    addLine(`Exported at: ${new Date().toISOString()}`);
    addLine(`Total findings: ${issues.length}`);
    y += 12;

    if (!issues.length) {
      addLine("No findings available.");
    }

    issues.forEach((issue, index) => {
      addLine(`Finding ${index + 1}`, 12, true);
      addLine(JSON.stringify(issue, null, 2), 8);
      y += 14;
    });

    const url = URL.createObjectURL(doc.output("blob"));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "aom-qa-sentinel-verbatim-findings.pdf";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground"><FileText className="h-4 w-4 text-primary" /> Verbatim Findings PDF</p>
          <p className="mt-1 max-w-2xl text-xs text-muted-foreground">Exports every QA Sentinel finding as raw, unedited JSON inside a PDF for audit review.</p>
        </div>
        <Button onClick={exportPdf} className="shrink-0">
          <Download className="h-4 w-4" /> Export all findings PDF
        </Button>
      </div>

      <div className="rounded-xl border border-white/8 bg-black/15 p-4">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Included findings</p>
        <p className="mt-2 font-display text-3xl font-bold text-foreground">{issues.length}</p>
        <p className="mt-1 text-xs text-muted-foreground">Includes open, fixed, ignored, and regressed findings exactly as stored.</p>
      </div>
    </section>
  );
}