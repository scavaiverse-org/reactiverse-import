import { ImageOff, Landmark } from "lucide-react";

export default function WalkthroughFallbackVisual({
  title = "Room media not configured",
  description = "This room is ready for content and will display media once assets are connected.",
  className = "h-full w-full",
  compact = false,
}) {
  return (
    <div className={`relative overflow-hidden rounded-none bg-gradient-to-br from-slate-950 via-background to-slate-900 ${className}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,hsl(var(--primary)/0.22),transparent_28%),radial-gradient(circle_at_78%_70%,hsl(var(--accent)/0.14),transparent_32%)]" />
      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="relative z-10 flex h-full min-h-32 flex-col items-center justify-center px-6 py-8 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary shadow-2xl shadow-primary/10">
          {compact ? <ImageOff className="h-6 w-6" /> : <Landmark className="h-7 w-7" />}
        </div>
        <p className="font-display text-sm font-semibold uppercase tracking-[0.22em] text-primary/85">{title}</p>
        {!compact && <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}