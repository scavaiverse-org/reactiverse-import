import { useState } from "react";
import { PlusCircle, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import HelpHint from "./HelpHint";
import { FILL_TYPE_SEQUENCE } from "@/lib/experience-append-protection";
import { PAGE_TYPES } from "@/lib/walkthrough-room-types";

const MIN_TARGET = 4;
const MAX_TARGET = 8;

function typeLabel(pageType) {
  return PAGE_TYPES[pageType]?.label || pageType;
}

function previewTypes(fromIndex, targetCount) {
  const types = [];
  for (let i = fromIndex; i < targetCount; i++) {
    const isLast = i === targetCount - 1;
    types.push(isLast ? "finale_room" : (FILL_TYPE_SEQUENCE[i] || "walkthrough_exhibition"));
  }
  return types;
}

// Panel that appears inside Bulk Tools when the active walkthrough has fewer
// rooms than the chosen target. Existing rooms are always preserved — only the
// missing slots are auto-generated and appended.
export default function FillRemainingRoomsPanel({ rooms = [], onFill, disabled }) {
  const current = rooms.length;
  const initialTarget = Math.min(MAX_TARGET, Math.max(MIN_TARGET, current + 1));
  const [targetCount, setTargetCount] = useState(initialTarget);

  const toAdd = Math.max(0, targetCount - current);
  const preview = previewTypes(current, targetCount);

  return (
    <section className="rounded-3xl border border-primary/25 bg-primary/[0.06] p-5 shadow-xl shadow-black/10">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-xl font-bold">
            <PlusCircle className="h-5 w-5 text-primary" />
            Fill Remaining Rooms
            <HelpHint title="Fill Remaining Rooms">
              You have {current} room{current === 1 ? "" : "s"} so far. Choose how many you want in total and click
              Fill — the rooms you already made are kept exactly as they are, and the missing slots are
              auto-generated with appropriate room types (Artifacts, Timeline, Reflection, Finale, etc.).
              Everything is written as a draft; review and publish when ready.
            </HelpHint>
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Preserves your {current} existing room{current === 1 ? "" : "s"} and appends the rest automatically.
          </p>
        </div>
        <Badge className="bg-primary/15 text-primary">{current} of {targetCount} rooms</Badge>
      </div>

      {current === 0 ? (
        <p className="rounded-xl border border-white/10 bg-background/30 p-4 text-sm text-muted-foreground">
          Add at least one room first, then use Fill Remaining to complete the walkthrough.
        </p>
      ) : (
        <>
          <div className="mb-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Target total rooms</p>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: MAX_TARGET - MIN_TARGET + 1 }, (_, i) => MIN_TARGET + i)
                .filter((n) => n > current)
                .map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setTargetCount(n)}
                    className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${
                      targetCount === n
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-white/10 bg-background/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    {n}
                  </button>
                ))}
            </div>
          </div>

          {toAdd > 0 && (
            <div className="mb-5 rounded-xl border border-white/10 bg-background/30 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Will add {toAdd} room{toAdd === 1 ? "" : "s"}</p>
              <div className="flex flex-wrap gap-1.5">
                {preview.map((pageType, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{typeLabel(pageType)}</Badge>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={() => onFill?.(targetCount)}
            disabled={disabled || toAdd === 0}
            className="bg-primary text-primary-foreground"
          >
            <Wand2 className="h-4 w-4" />
            {toAdd === 0 ? "Already at target" : `Fill ${toAdd} Room${toAdd === 1 ? "" : "s"}`}
          </Button>
        </>
      )}
    </section>
  );
}
