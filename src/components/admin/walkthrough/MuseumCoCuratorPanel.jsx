import { Sparkles } from "lucide-react";

const PRESETS = [
  "Explain this artifact simply",
  "Shorten this caption",
  "Make this room easier to understand",
  "Check if anything is floating",
  "Suggest a better title",
  "Suggest a guided tour order",
  "Make this child-friendly",
  "Make this elderly-friendly",
  "Create alt text",
  "Flag anything that needs verification",
];

function buildNotes(room = {}, selected = null) {
  const notes = [];
  if (!room.background_media_url && !room.media_url) notes.push("Add a room image before publishing.");
  if (room.room_semantic_layout?.floor_confidence_label) notes.push(room.room_semantic_layout.floor_confidence_label);
  if (selected?.floor_locked && Math.abs(Number(selected.floor_contact_y || 0) - Number(room.room_semantic_layout?.floor_baseline_y || 0)) > 3) notes.push("This artifact may be floating. Use Put on floor.");
  if (selected && !selected.description && !selected.caption) notes.push("Add a short visitor caption for this artifact.");
  notes.push("The museum team should verify cultural facts before publishing.");
  return notes.slice(0, 4);
}

export default function MuseumCoCuratorPanel({ room, selected }) {
  const notes = buildNotes(room, selected);
  return (
    <aside className="rounded-2xl border border-violet-300/20 bg-violet-400/10 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-violet-100"><Sparkles className="h-4 w-4" /> Museum Co-Curator</div>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">Deterministic helper notes only. It does not invent dates, provenance, artists, countries, or cultural meaning.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {PRESETS.slice(0, 5).map((preset) => <span key={preset} className="rounded-full border border-violet-300/20 bg-background/40 px-2 py-1 text-[10px] text-violet-100">{preset}</span>)}
      </div>
      <ul className="mt-3 list-disc space-y-1 pl-4 text-xs leading-5 text-muted-foreground">
        {notes.map((note) => <li key={note}>{note}</li>)}
      </ul>
    </aside>
  );
}