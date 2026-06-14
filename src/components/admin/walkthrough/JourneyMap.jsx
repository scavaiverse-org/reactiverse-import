import { useState } from "react";
import { GitBranch, Plus, Copy, Trash2, ArrowDown, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PAGE_TYPES } from "@/lib/walkthrough-room-types";
import { findBrokenRoutes, getWalkthroughWarnings } from "@/lib/walkthrough-validation";
import { getRoomConnections } from "@/lib/walkthrough-routing";
import HelpHint from "./HelpHint";

export default function JourneyMap({ rooms, activeIndex, onSelect, onAdd, onDuplicate, onDelete, onMove, onPopupEdit, errorRoomKeys, hasGlobalIssue }) {
  const [confirmIndex, setConfirmIndex] = useState(null);
  const connections = getRoomConnections(rooms);
  const brokenRoutes = findBrokenRoutes(rooms);
  const warnings = getWalkthroughWarnings(rooms);
  const confirmRoom = confirmIndex != null ? rooms[confirmIndex] : null;

  const selectRoom = (index, room) => {
    if (room.page_type === "three_d_world") {
      setConfirmIndex(index);
      return;
    }
    onSelect(index);
  };

  // Defensive wrappers: stop any default/submit/navigation behaviour before
  // delegating to the existing handlers (handlers themselves are unchanged).
  const guard = (handler, ...args) => (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    handler?.(...args);
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-4 shadow-2xl shadow-black/10">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-xl font-bold"><GitBranch className="h-5 w-5 text-primary" /> Journey Map <HelpHint title="Journey Map">The full sequence of rooms in this walkthrough. Click a room to edit it, use the arrows to reorder, copy to duplicate, and the trash icon to delete. "Required" rooms must be completed for the experience to be publish-ready; "Optional" rooms can be skipped or branched around.</HelpHint></h2>
          <p className="text-xs text-muted-foreground">Room states, branches, route health, and sequence.</p>
        </div>
        <Button type="button" size="sm" onClick={guard(onAdd)} className={hasGlobalIssue ? "animate-error-glow ring-1 ring-destructive" : ""}><Plus className="h-4 w-4" /> Add</Button>
      </div>

      {(brokenRoutes.length > 0 || warnings.length > 0) && (
        <div className="mb-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3 text-xs text-amber-100">
          <div className="mb-1 flex items-center gap-2 font-semibold"><AlertTriangle className="h-3.5 w-3.5" /> Route and quality warnings</div>
          {[...brokenRoutes, ...warnings.slice(0, 3)].map((warning) => <p key={warning}>• {warning}</p>)}
        </div>
      )}

      <div className="space-y-3">
        {rooms.map((room, index) => {
          const active = index === activeIndex;
          const hasError = errorRoomKeys?.has(room.room_key);
          return (
            <div key={room.id || room.room_key} className={`rounded-2xl border p-3 transition ${hasError ? "animate-error-glow border-destructive" : active ? "border-primary bg-primary/10" : "border-white/10 bg-background/40"}`}>
              <button type="button" onClick={() => selectRoom(index, room)} className="w-full text-left focus:outline-none focus:ring-2 focus:ring-primary">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-primary">#{room.order || index + 1} · {room.visibility || "draft"}</p>
                    <h3 className="mt-1 text-sm font-semibold text-foreground">{room.title || room.room_key}</h3>
                    <p className="mt-1 text-[11px] text-muted-foreground">{PAGE_TYPES[room.page_type]?.label || room.page_type}</p>
                  </div>
                  <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] text-muted-foreground">{room.branching?.required ? "Required" : "Optional"}</span>
                </div>
              </button>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" size="icon" variant="outline" onClick={guard(onMove, index, -1)} disabled={index === 0}><ArrowDown className="h-3.5 w-3.5 rotate-180" /></Button>
                <Button type="button" size="icon" variant="outline" onClick={guard(onMove, index, 1)} disabled={index === rooms.length - 1}><ArrowDown className="h-3.5 w-3.5" /></Button>
                <Button type="button" size="icon" variant="outline" onClick={guard(onDuplicate, index)}><Copy className="h-3.5 w-3.5" /></Button>
                <Button type="button" size="icon" variant="outline" onClick={guard(onDelete, index)} disabled={rooms.length === 1}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
              {connections.filter((connection) => connection.from === room.id || connection.from === room.room_key).length > 0 && <p className="mt-2 text-[10px] text-primary">Branches: {connections.filter((connection) => connection.from === room.id || connection.from === room.room_key).map((connection) => connection.to).join(", ")}</p>}
            </div>
          );
        })}
      </div>

      <Dialog open={confirmIndex != null} onOpenChange={(open) => { if (!open) setConfirmIndex(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Open in pop-up edit?</DialogTitle>
            <DialogDescription>
              Would you like to edit "{confirmRoom?.title || confirmRoom?.room_key}" in a pop-up preview overlay?
              Choose "No" to edit it inline as usual.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { onSelect(confirmIndex); setConfirmIndex(null); }}>No, edit inline</Button>
            <Button onClick={() => { onPopupEdit?.(confirmIndex); setConfirmIndex(null); }}>Yes, pop-up edit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}