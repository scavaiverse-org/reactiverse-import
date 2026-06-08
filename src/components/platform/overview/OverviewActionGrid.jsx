import { Link } from "react-router-dom";
import { ArrowRight, Building2 } from "lucide-react";

export default function OverviewActionGrid({ section = {}, actions = [] }) {
  const [action] = actions.length ? actions : [{ title: "View Available Museums", body: "Browse live tenant museums before entering a museum homepage.", cta: "View Available Museums", route: "/virtual-experience" }];

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="rounded-[2rem] border border-white/10 bg-card/55 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl lg:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">{section.eyebrow || "Available museums"}</p>
            <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">{section.title || "Continue to the live museum directory."}</h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">{section.description || action.body}</p>
          </div>
          <Link to={action.route || "/virtual-experience"} className="group inline-flex items-center justify-center gap-3 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">
            <Building2 className="h-4 w-4" /> {action.cta || "View Available Museums"} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}