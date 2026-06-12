import { useEffect, useMemo, useState } from "react";
import { RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import WalkthroughExperienceRunner from "@/components/walkthrough/WalkthroughExperienceRunner";
import { ensureMediaTypes } from "@/lib/walkthrough-media-bindings";

/**
 * Full-screen "Test Publish" overlay. Simulates the live museum walkthrough
 * start to finish using the current draft rooms (already filtered/ordered the
 * same way a real publish would), so admins can verify the experience before
 * actually publishing — without leaving the editor.
 */
export default function TestPublishOverlay({ rooms = [], tenantSlug, onClose }) {
  const [runKey, setRunKey] = useState(0);
  const [completed, setCompleted] = useState(false);
  const previewRooms = useMemo(() => rooms.map((room) => ensureMediaTypes(room)), [rooms]);

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

  const exitControl = (
    <Button size="sm" variant="outline" className="bg-background/40 backdrop-blur-sm" onClick={onClose}>
      <X className="h-4 w-4" /> Exit Test Preview
    </Button>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-background">
      {previewRooms.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-4 px-4 text-center text-muted-foreground">
          <Badge className="bg-amber-400/15 text-amber-200 border-amber-300/30">Test Preview · Draft</Badge>
          <p className="text-lg font-medium text-foreground">This walkthrough has no visible rooms to preview.</p>
          <p className="max-w-md text-sm">Rooms with visibility set to "hidden" or "draft" are excluded — the same as a real publish. Add or unhide a room to test it.</p>
          <Button variant="outline" onClick={onClose}><X className="h-4 w-4" /> Exit Test Preview</Button>
        </div>
      ) : completed ? (
        <div className="flex h-full flex-col items-center justify-center gap-4 px-4 text-center">
          <Badge className="bg-amber-400/15 text-amber-200 border-amber-300/30">Test Preview · Draft</Badge>
          <h2 className="font-heading text-3xl font-semibold tracking-tight">Tour complete</h2>
          <p className="max-w-md text-sm text-muted-foreground">This is the point where a published walkthrough sends visitors to the completion page. That hand-off isn't simulated here.</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={() => { setCompleted(false); setRunKey((value) => value + 1); }}><RotateCcw className="h-4 w-4" /> Restart Test</Button>
            <Button onClick={onClose}><X className="h-4 w-4" /> Exit Test Preview</Button>
          </div>
        </div>
      ) : (
        <WalkthroughExperienceRunner
          key={runKey}
          rooms={previewRooms}
          tenantSlug={tenantSlug}
          exitLabel="Exit"
          extraControls={<>
            <Badge className="bg-amber-400/15 text-amber-200 border-amber-300/30 backdrop-blur-sm">Test Preview · Draft</Badge>
            {exitControl}
          </>}
          onExitStart={onClose}
          onComplete={() => setCompleted(true)}
        />
      )}
    </div>
  );
}
