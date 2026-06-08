import { CheckCircle2, AlertTriangle } from "lucide-react";
import { getMediaWarnings, getPublicMediaSlots } from "@/lib/walkthrough-media-bindings";

function shortUrl(url = "") {
  if (!url) return "Not set";
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}${parsed.pathname}`.slice(0, 54);
  } catch {
    return String(url).slice(0, 54);
  }
}

export default function MediaRenderCheck({ room }) {
  const slots = getPublicMediaSlots(room || {});
  const warnings = getMediaWarnings(room || {});
  const rows = [
    ["Background", slots.background],
    ["Main", slots.main],
    ["Foreground", slots.foreground],
    ["Audio", slots.audio],
    ["Type-specific", slots.typeSpecific],
  ];

  return (
    <section className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-3 text-xs">
      <div className="mb-2 flex items-center gap-2 font-semibold text-emerald-200">
        <CheckCircle2 className="h-4 w-4" /> Public render check · Will appear on visitor experience after publish
      </div>
      <div className="grid gap-2 md:grid-cols-5">
        {rows.map(([label, source]) => (
          <div key={label} className="rounded-xl border border-white/10 bg-background/35 p-2">
            <p className="font-semibold text-foreground/80">{label}</p>
            <p className="mt-1 text-muted-foreground">{source?.type || "—"}</p>
            <p className="mt-1 truncate text-foreground/60" title={source?.url || ""}>{shortUrl(source?.url)}</p>
          </div>
        ))}
      </div>
      {warnings.length > 0 && (
        <div className="mt-3 flex gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 p-2 text-amber-100">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>{warnings.join(" ")}</p>
        </div>
      )}
    </section>
  );
}