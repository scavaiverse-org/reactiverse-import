import QASentinelIssueTable from "./QASentinelIssueTable";
import { semanticTabIssues } from "@/lib/qa-sentinel/verbatim-export";

const DESCRIPTIONS = {
  "Runtime Truth": "What is happening right now. This shows real errors that users are seeing — like broken buttons, pages that do not load, failed saves, and broken uploads.",
  "Structural Intelligence": "How the app is built. This checks if all pages and links are connected correctly, and if users can only see what they are allowed to see.",
  "Semantic Impact": "How bad are the problems. This shows how each problem affects real users — like broken museum visits, failed payments, or wrong content being shown."
};

const SUBTITLES = {
  "Runtime Truth": "These are live problems happening right now. They are real errors that users can see.",
  "Structural Intelligence": "These are problems with how the app is set up — broken links, wrong page connections, or security gaps.",
  "Semantic Impact": "These are problems that affect the experience — things that make the museum feel broken or wrong to visitors."
};

export default function QASentinelSemanticTab({ tab, issues = [], onSelectIssue }) {
  const rows = semanticTabIssues(issues, tab);
  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">{tab}</p>
        <h2 className="mt-2 font-display text-2xl font-bold text-foreground">{tab}</h2>
        <p className="mt-2 max-w-4xl text-sm text-muted-foreground">{DESCRIPTIONS[tab]}</p>
        <p className="mt-3 text-xs text-muted-foreground">{SUBTITLES[tab] || "Only showing open problems. Fixed and ignored ones are hidden."}</p>
      </div>
      <QASentinelIssueTable issues={rows} onSelectIssue={onSelectIssue} />
    </section>
  );
}
