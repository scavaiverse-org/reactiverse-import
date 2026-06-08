import { BookOpen, CreditCard, Sparkles, ShoppingBag, Smartphone, Cuboid } from "lucide-react";

const iconMap = { BookOpen, CreditCard, Sparkles, ShoppingBag, Smartphone, Cuboid };

export default function OverviewCommerceSections({ section = {}, benefits = [], capabilities = [] }) {
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {benefits.map((item) => (
            <div key={item.key || item.title} className="rounded-3xl border border-primary/20 bg-primary/[0.045] p-6">
              <h3 className="font-display text-2xl font-bold">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-foreground/72">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="mb-8 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">{section.eyebrow || "Commercial platform foundation"}</p>
          <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">{section.title || "Built for revenue, retention, and future immersion."}</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((item) => {
            const Icon = iconMap[item.icon] || Sparkles;
            return (
              <div key={item.key || item.title} className="rounded-3xl border border-border/60 bg-card/45 p-6">
                <Icon className="mb-5 h-6 w-6 text-primary" />
                <h3 className="font-display text-xl font-bold">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.body}</p>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}