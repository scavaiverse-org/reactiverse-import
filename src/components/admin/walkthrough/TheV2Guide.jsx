import { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp, Rocket, ShieldCheck, History, Layers, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const SECTIONS = [
  {
    icon: Layers,
    title: "1. Draft here, publish separately",
    body: [
      "Everything you edit on this page (rooms, media, narration, layout) is saved as a DRAFT in ExperienceConfig when you click Save.",
      "Saving a draft never makes it visible to visitors. Drafts are your private workspace — experiment freely.",
      "Nothing the public sees changes until you explicitly publish (see step 2).",
    ],
  },
  {
    icon: Rocket,
    title: "2. Publishing creates a snapshot",
    body: [
      "Use the \"Publish\" button (in the toolbar above) to open the Publish dialog.",
      "Pick which walkthrough(s) you want live, then confirm. This compiles your current drafts into a new, immutable PublishedExperienceManifest — a frozen snapshot of titles, rooms, media, and order.",
      "The tenant's public pages (museum home, Explore cards, and every /tour/N walkthrough) are repointed to this new manifest version atomically.",
    ],
  },
  {
    icon: ShieldCheck,
    title: "3. Quality gates must pass",
    body: [
      "Publishing is blocked if any included walkthrough has zero visible rooms, a room with no title, or a room with no valid media (image/video) URL.",
      "It's also blocked if the museum itself has no name/description set for its public card.",
      "Fix the listed issues in the editor, save your draft, and try Publish again.",
    ],
  },
  {
    icon: History,
    title: "4. Versioning and rollback",
    body: [
      "Every successful publish creates a new manifest version (v1, v2, v3, ...) — old versions are never edited or deleted.",
      "The Publish dialog's \"Publish history\" panel lists past versions. Click Rollback on any older version to instantly repoint the live site back to it — no republish needed.",
      "Because old versions are kept forever, rollback is always safe and instant.",
    ],
  },
  {
    icon: AlertTriangle,
    title: "5. What visitors see if nothing is published",
    body: [
      "Until the first successful publish, public routes (museum home, walkthrough tours, Explore cards) show \"This experience has not been published yet.\" instead of placeholder or fabricated content.",
      "There is no fallback content — what you see live is always exactly what was published, or nothing.",
    ],
  },
];

export default function TheV2Guide() {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:p-5">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-3 text-left">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">TheV2 — Guide to Drafting &amp; Publishing</span>
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">Read me first</span>
        </div>
        <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </button>

      {open && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <div key={section.title} className="rounded-xl border border-border/50 bg-card/50 p-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Icon className="h-4 w-4 text-primary" />
                  {section.title}
                </div>
                <ul className="space-y-1.5 text-xs leading-relaxed text-muted-foreground">
                  {section.body.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
