import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

export function PublicHeaderLogo({ to = "/", logoUrl, fallback = "S", title = "SCAVerse", subtitle = "PUBLIC PLATFORM", as = "link" }) {
  const inner = (
    <>
      {logoUrl ? (
        <img src={logoUrl} alt="" className="h-10 w-10 rounded-full object-cover ring-1 ring-primary/35" />
      ) : (
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/35 bg-primary/15 text-primary">
          {fallback === "S" ? <Sparkles className="h-5 w-5" /> : <span className="font-display text-sm font-bold">{fallback}</span>}
        </span>
      )}
      <div className="flex flex-col">
        <span className="font-display text-sm font-semibold uppercase leading-none tracking-[0.16em] text-foreground sm:text-base">{title}</span>
        <span className="mt-1 font-display text-[10px] uppercase tracking-[0.28em] text-primary/80">{subtitle}</span>
      </div>
    </>
  );

  if (as === "static") {
    return <div className="flex items-center gap-3">{inner}</div>;
  }
  return <Link to={to} className="flex items-center gap-3 group flex-shrink-0">{inner}</Link>;
}

export default function PublicHeaderShell({ children, className = "" }) {
  return (
    <header className={`fixed inset-x-0 top-0 z-50 border-b border-border/40 bg-background/85 shadow-2xl shadow-black/20 backdrop-blur-2xl ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </header>
  );
}