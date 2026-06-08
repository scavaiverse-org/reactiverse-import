import { Plus, ArrowUp, ArrowDown, Trash2, UserRound, Archive, Compass, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PAGE_TYPES } from "@/lib/walkthrough-room-types";

const icons = {
  onboarding_guide: UserRound,
  artifact_room: Archive,
  walkthrough_exhibition: Compass,
  gamification_page: Trophy,
};

export default function WalkthroughRoomList({ rooms, activeIndex, onSelect, onAdd, onMove, onDelete }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">Walkthrough Builder</h2>
          <p className="text-xs text-muted-foreground">One ordered journey with mixed room types.</p>
        </div>
        <Button size="sm" onClick={onAdd}><Plus className="h-4 w-4" /> Add room</Button>
      </div>
      <div className="space-y-2">
        {rooms.map((room, index) => {
          const Icon = icons[room.page_type] || Compass;
          return (
            <div key={`${room.id || room.room_key}-${index}`} className={`rounded-xl border p-3 ${activeIndex === index ? "border-primary bg-primary/10" : "border-white/10 bg-background/40"}`}>
              <button type="button" onClick={() => onSelect(index)} className="w-full text-left focus:outline-none focus:ring-2 focus:ring-primary rounded-lg">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-primary">#{room.order || index + 1} · {room.room_key}</p>
                    <p className="mt-1 text-sm text-foreground">{room.title || `Room ${index + 1}`}</p>
                  </div>
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] text-primary">{PAGE_TYPES[room.page_type]?.label || "Walkthrough Exhibition"}</span>
                  <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] text-muted-foreground">{room.visibility || "draft"}</span>
                </div>
              </button>
              <div className="mt-3 flex gap-2">
                <Button size="icon" variant="outline" onClick={() => onMove(index, -1)} disabled={index === 0}><ArrowUp className="h-4 w-4" /></Button>
                <Button size="icon" variant="outline" onClick={() => onMove(index, 1)} disabled={index === rooms.length - 1}><ArrowDown className="h-4 w-4" /></Button>
                <Button size="icon" variant="outline" onClick={() => onDelete(index)} disabled={rooms.length === 1}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}