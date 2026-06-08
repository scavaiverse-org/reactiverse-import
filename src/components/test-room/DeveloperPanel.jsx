import { Activity, Camera, ChevronUp, Eye, RotateCw, Sparkles, Wand2 } from "lucide-react";
import { useState } from "react";

function ToggleButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors ${
        active
          ? "border-cyan-300/40 bg-cyan-300/15 text-cyan-100"
          : "border-white/10 bg-white/5 text-white/60 hover:text-white"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

export default function DeveloperPanel({ telemetry, settings, onToggle }) {
  const [open, setOpen] = useState(false);

  return (
    <aside className="pointer-events-auto fixed bottom-4 left-4 z-30 w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-black/45 text-white shadow-2xl backdrop-blur-xl">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between p-4 text-left">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-200/80">Developer Panel</p>
          <p className="text-xs text-white/45">{telemetry.zone || "Entrance"} · {telemetry.fps} FPS</p>
        </div>
        <ChevronUp className={`h-4 w-4 text-white/50 transition-transform ${open ? "" : "rotate-180"}`} />
      </button>

      {open && (
        <div className="border-t border-white/10 p-4 pt-3">
          <div className="grid grid-cols-2 gap-2 text-[11px] text-white/70">
            <div className="rounded-lg border border-white/10 bg-white/5 p-2">
              <p className="mb-1 flex items-center gap-1 text-white/40"><Camera className="h-3 w-3" /> Camera</p>
              <p>x {telemetry.position.x.toFixed(1)}</p>
              <p>y {telemetry.position.y.toFixed(1)}</p>
              <p>z {telemetry.position.z.toFixed(1)}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-2">
              <p className="mb-1 flex items-center gap-1 text-white/40"><Eye className="h-3 w-3" /> Rotation</p>
              <p>x {telemetry.rotation.x.toFixed(2)}</p>
              <p>y {telemetry.rotation.y.toFixed(2)}</p>
              <p>z {telemetry.rotation.z.toFixed(2)}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-2">
              <p className="flex items-center gap-1 text-white/40"><Activity className="h-3 w-3" /> View Zone</p>
              <p className="truncate text-cyan-100">{telemetry.zone || "Entrance"}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-2">
              <p className="text-white/40">Selected</p>
              <p className="truncate text-cyan-100">{telemetry.selected || "None"}</p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <ToggleButton active={settings.particles} onClick={() => onToggle("particles")} icon={Sparkles} label="Particles" />
            <ToggleButton active={settings.fog} onClick={() => onToggle("fog")} icon={Eye} label="Fog" />
            <ToggleButton active={settings.hologram} onClick={() => onToggle("hologram")} icon={Wand2} label="Hologram" />
            <ToggleButton active={settings.autoRotate} onClick={() => onToggle("autoRotate")} icon={RotateCw} label="Auto-rotate" />
          </div>
        </div>
      )}
    </aside>
  );
}