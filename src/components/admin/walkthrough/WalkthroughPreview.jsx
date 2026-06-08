import { Eye, MonitorSmartphone } from "lucide-react";
import renderRoomByType from "@/components/walkthrough/renderers/renderRoomByType";
import WalkthroughMediaLayer from "@/components/walkthrough/WalkthroughMediaLayer";
import { PAGE_TYPES } from "@/lib/walkthrough-room-types";

export default function WalkthroughPreview({ room }) {
  if (!room) return null;
  const pageType = room.page_type || "walkthrough_exhibition";
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-sm font-semibold">
        <span className="flex items-center gap-2"><Eye className="h-4 w-4 text-primary" /> Shared live preview · {PAGE_TYPES[pageType]?.label}</span>
        <span className="flex items-center gap-2 text-xs text-muted-foreground"><MonitorSmartphone className="h-4 w-4" /> {room.museum_mode_enabled || room.artifact_placement_enabled ? "Museum Mode active" : room.scrollable_image_enabled ? "Scrollable image active · drag left/right to preview" : "Normal image"}</span>
      </div>
      <div className="relative max-h-[580px] overflow-hidden rounded-2xl border border-white/10 bg-background">
        <div className="absolute inset-0"><WalkthroughMediaLayer room={room} /></div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/65 to-background/25" />
        <div className="relative z-10">
        {renderRoomByType(room, {
          activeHotspot: null,
          hotspotOpen: () => {},
          artifactOpen: () => {},
          next: () => {},
          choice: () => {},
          goToRoom: () => {},
          track: () => {},
          resolveRoute: (route) => route || "#",
        })}
        </div>
      </div>
    </div>
  );
}