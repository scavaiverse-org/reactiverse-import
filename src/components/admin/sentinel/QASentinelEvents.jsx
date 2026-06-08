export default function QASentinelEvents({ events = [] }) {
  return (
    <section className="space-y-3">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-primary">Runtime Event History</p>
        <h2 className="mt-2 font-display text-2xl font-bold text-foreground">Events</h2>
        <p className="mt-1 text-sm text-muted-foreground">Raw runtime and issue lifecycle events used by verbatim forensic exports.</p>
      </div>
      {events.map((event) => (
        <article key={event.id || `${event.timestamp}-${event.message}`} className="rounded-2xl border border-white/10 bg-black/15 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{event.timestamp || event.created_date}</p>
              <h3 className="mt-1 text-sm font-semibold text-foreground">{event.event_type}</h3>
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-widest text-primary">{event.severity || "info"}</span>
          </div>
          <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap text-xs text-foreground/80">{JSON.stringify(event, null, 2)}</pre>
        </article>
      ))}
      {!events.length && <div className="rounded-2xl border border-white/10 bg-black/15 p-6 text-sm text-muted-foreground">No runtime events recorded yet.</div>}
    </section>
  );
}