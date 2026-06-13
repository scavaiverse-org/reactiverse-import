// Shared cinematic backdrop for museum gate / notice screens (tour-access,
// pre-launch, confirmed-but-not-open). Keeps these interstitials feeling like
// part of one premiere experience instead of plain system notices.
export default function MuseumGateShell({ children }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-16 text-center text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,hsla(43,100%,56%,0.14),transparent_45%),radial-gradient(circle_at_bottom_right,hsla(190,80%,60%,0.07),transparent_42%)]" />
      <div className="pointer-events-none absolute -top-28 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/20 blur-[130px] animate-pulse" />
      <div className="pointer-events-none absolute bottom-0 right-6 h-80 w-80 rounded-full bg-cyan-400/10 blur-[130px]" />
      <div className="pointer-events-none absolute inset-0 opacity-50">
        {[...Array(24)].map((_, i) => (
          <span
            key={i}
            className="absolute h-1 w-1 animate-pulse rounded-full bg-primary/50"
            style={{ left: `${(i * 41) % 100}%`, top: `${(i * 23) % 100}%`, animationDelay: `${(i % 6) * 0.4}s` }}
          />
        ))}
      </div>
      <div className="relative z-10 w-full max-w-xl">{children}</div>
    </main>
  );
}
