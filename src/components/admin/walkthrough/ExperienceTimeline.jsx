import { Activity, Clock, Gauge, HeartPulse } from "lucide-react";
import { getWalkthroughWarnings } from "@/lib/walkthrough-validation";

const metricRows = [
  ["emotional_intensity", "Emotion"],
  ["educational_density", "Education"],
  ["interaction_density", "Interaction"],
  ["sensory_intensity", "Sensory"],
];

export default function ExperienceTimeline({ rooms = [] }) {
  const warnings = getWalkthroughWarnings(rooms);
  const totalDuration = rooms.reduce((sum, room) => sum + Number(room.estimated_duration_seconds || 0), 0);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-xl font-bold"><Activity className="h-5 w-5 text-primary" /> Experience Timeline</h2>
          <p className="text-xs text-muted-foreground">Pacing, density, duration, calm zones, and climax zones.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5 text-primary" /> {Math.round(totalDuration / 60)} min</div>
      </div>

      <div className="space-y-4">
        {rooms.map((room) => (
          <div key={room.id || room.room_key} className="rounded-2xl border border-white/10 bg-background/40 p-3">
            <div className="mb-3 flex items-center justify-between gap-3"><p className="text-sm font-semibold">{room.order}. {room.title || room.room_key}</p><span className="text-[10px] text-muted-foreground">{room.estimated_duration_seconds || 60}s</span></div>
            <div className="grid gap-2 md:grid-cols-4">
              {metricRows.map(([key, label]) => {
                const value = Number(room[key] || 0);
                return <div key={key}><div className="mb-1 flex justify-between text-[10px] text-muted-foreground"><span>{label}</span><span>{value}</span></div><div className="h-1.5 rounded-full bg-white/10"><div className="h-1.5 rounded-full bg-primary" style={{ width: `${Math.min(100, value)}%` }} /></div></div>;
              })}
            </div>
          </div>
        ))}
      </div>

      {warnings.length > 0 && <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3 text-xs text-amber-100"><div className="mb-1 flex items-center gap-2 font-semibold"><Gauge className="h-3.5 w-3.5" /> Timeline warnings</div>{warnings.slice(0, 5).map((warning) => <p key={warning}>• {warning}</p>)}</div>}
      {rooms.some((room) => Number(room.sensory_intensity || 0) < 35) && <p className="mt-3 flex items-center gap-2 text-xs text-emerald-300"><HeartPulse className="h-3.5 w-3.5" /> Calm zones detected.</p>}
    </section>
  );
}