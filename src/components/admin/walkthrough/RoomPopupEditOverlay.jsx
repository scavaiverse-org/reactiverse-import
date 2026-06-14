import { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import WalkthroughRoomEditor from "./WalkthroughRoomEditor";
import WalkthroughPreview from "./WalkthroughPreview";

/**
 * Centered "pop-up edit" overlay for a single room. Shown after a tenant
 * confirms the "would you like a pop-up edit?" prompt from the Journey Map —
 * gives the same museum preview + full room editor as the main page, but in a
 * focused modal overlay with its own close control.
 */
export default function RoomPopupEditOverlay({ room, rooms = [], activeIndex = 0, tenantSlug, walkthroughKey, onChange, onNavigateRoom, onAddThreeDWorlds, onClose }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => { if (event.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  if (!room) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-200"
      onClick={(event) => { if (event.target === event.currentTarget) onClose?.(); }}
    >
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-background shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/[0.03] px-5 py-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-primary">Pop-up edit</p>
            <h2 className="font-display text-lg font-bold">{room.title || room.room_key}</h2>
          </div>
          <Button size="sm" variant="outline" onClick={onClose}><X className="h-4 w-4" /> Close</Button>
        </div>
        <div className="flex-1 space-y-6 overflow-y-auto p-4">
          <WalkthroughPreview room={room} rooms={rooms} activeIndex={activeIndex} tenantSlug={tenantSlug} walkthroughKey={walkthroughKey} onNavigateRoom={onNavigateRoom} />
          <WalkthroughRoomEditor room={room} onChange={onChange} rooms={rooms} onAddThreeDWorlds={onAddThreeDWorlds} />
        </div>
      </div>
    </div>
  );
}
