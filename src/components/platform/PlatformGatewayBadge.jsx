import { Link } from "react-router-dom";
import { ArrowRight, Compass, KeyRound, Sparkles } from "lucide-react";

const ICONS = {
  public_platform: Compass,
  become_tenant: Sparkles,
  login: KeyRound,
};

export default function PlatformGatewayBadge({ badge, variant = "primary" }) {
  const Icon = ICONS[badge.key] || Sparkles;
  const isPrimary = variant === "primary";

  return (
    <Link
      to={badge.route}
      className="group block w-full"
      aria-label={badge.label || badge.title}
    >
      <div className={`${isPrimary ? "border-primary/35 bg-card/50 text-foreground shadow-primary/10" : "border-border/40 bg-card/40 text-foreground backdrop-blur-sm"} relative flex min-h-16 w-full items-center justify-center gap-3 overflow-hidden rounded-2xl border px-7 py-4 font-display text-sm font-semibold uppercase tracking-[0.16em] shadow-2xl shadow-black/25 backdrop-blur-sm transition-all duration-300 before:absolute before:inset-0 before:bg-gradient-to-r before:from-primary/10 before:via-transparent before:to-primary/[0.03] before:opacity-70 group-hover:-translate-y-1 group-hover:border-primary/40 group-hover:bg-card/80 group-hover:text-foreground group-hover:shadow-primary/15`}>
        <Icon className="relative h-4 w-4 text-primary" />
        <span className="relative">{badge.label || badge.title}</span>
        <ArrowRight className="relative h-4 w-4 text-primary transition group-hover:translate-x-1" />
      </div>
      {badge.description && (
        <p className="mx-auto mt-3 max-w-lg text-center font-body text-xs font-light leading-6 text-muted-foreground sm:text-sm">
          {badge.description}
        </p>
      )}
    </Link>
  );
}