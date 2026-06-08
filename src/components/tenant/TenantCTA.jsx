import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function TenantCTA({ title, body, to, icon: Icon, delay = 0 }) {
  return (
    <div>
      <Link to={to} className="group block h-full rounded-2xl border border-border/40 bg-card/50 p-6 shadow-2xl shadow-black/20 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:bg-card/80 hover:shadow-primary/15">
        <div className="mb-8 flex items-center justify-between">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/25 bg-primary/15 text-primary shadow-[0_0_28px_rgba(210,218,228,0.14)]">
            {Icon ? <Icon className="h-5 w-5" /> : null}
          </span>
          <ArrowRight className="h-5 w-5 text-foreground/35 transition group-hover:translate-x-1 group-hover:text-primary" />
        </div>
        <h3 className="font-heading text-2xl font-semibold tracking-tight text-foreground">{title}</h3>
        <p className="mt-4 font-body text-sm font-light leading-7 text-muted-foreground">{body}</p>
      </Link>
    </div>
  );
}