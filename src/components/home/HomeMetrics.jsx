export default function HomeMetrics({ metrics = [] }) {
  return (
    <section className="border-y border-border/40 bg-card/20 px-4 py-7">
      <div className="mx-auto grid max-w-7xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((item) => (
          <div key={item.label} className="rounded-2xl border border-white/8 bg-black/15 p-5">
            <p className="font-display text-3xl font-bold text-primary">{item.value}</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{item.label}</p>
            <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}