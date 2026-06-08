import QASentinelIssueTable from "./QASentinelIssueTable";
import QASentinelCoverageMap from "./QASentinelCoverageMap";
import QASentinelLiveFeed from "./QASentinelLiveFeed";

export default function QASentinelOverview({ issues, events, checks, ctas, onSelectIssue }) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <QASentinelIssueTable issues={issues} title="Critical Breakages" filter={(issue) => issue.severity === "critical" && !["fixed", "ignored"].includes(issue.status)} onSelectIssue={onSelectIssue} />
      <QASentinelLiveFeed events={events} />
      <div className="xl:col-span-2"><QASentinelCoverageMap checks={checks} ctas={ctas} /></div>
    </div>
  );
}