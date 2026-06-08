export default function QASentinelEventsPanel({ events = [] }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-sm font-semibold text-foreground">Runtime Events</p>
      <div className="mt-4 max-h-[36rem] space-y-2 overflow-auto">
        {events.length === 0 && <p className="text-sm text-muted-foreground">No runtime issue events captured.</p>}
        {events.map((event) => (
          <div key={event.id || `${event.timestamp}-${event.message}`} className="rounded-xl border border-white/8 bg-black/15 p-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 text-muted-foreground">
              <span>{event.timestamp}</span>
              <span>{event.event_type}</span>
            </div>
            <p className="mt-2 font-medium text-foreground">{event.message}</p>
            <p className="mt-1 text-muted-foreground">{event.route} {event.target_label ? `• ${event.target_label}` : ""}</p>
          </div>
        ))}
      </div>
    </section>
  );
}