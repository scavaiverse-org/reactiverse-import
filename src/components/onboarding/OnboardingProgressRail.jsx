import { cn } from "@/lib/utils";

// Premium chapter-style progress rail: a thin glowing track with segment fills.
export default function OnboardingProgressRail({ current, total, chapter }) {
  const pct = total > 1 ? (current / (total - 1)) * 100 : 100;
  return (
    <div className="flex items-center gap-3" aria-label={`Slide ${current + 1} of ${total}`}>
      <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#D6A85A]/70">{chapter}</span>
      <div className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-white/10">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#7A1E25] via-[#B83A32] to-[#D6A85A] shadow-[0_0_14px_rgba(214,168,90,0.55)] transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
        <div className="absolute inset-0 flex">
          {Array.from({ length: total }).map((_, i) => (
            <span key={i} className={cn("flex-1 border-r border-black/40 last:border-0", i <= current ? "opacity-0" : "opacity-30")} />
          ))}
        </div>
      </div>
    </div>
  );
}