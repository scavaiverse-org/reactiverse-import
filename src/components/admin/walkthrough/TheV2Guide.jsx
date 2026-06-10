import { useState } from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Wand2,
  Map,
  Activity,
  ShieldCheck,
  ArrowUpRightFromCircle,
  History,
  Globe,
  Sparkles,
  FileArchive,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const SECTIONS = [
  {
    icon: LayoutGrid,
    title: "What this page is",
    body: [
      "This is the Experience Builder — the canonical editor for every walkthrough a tenant offers (Walkthrough 1 through 5).",
      "Everything here works on a DRAFT copy of the experience, stored in ExperienceConfig. Visitors never see your draft directly — they only ever see what was published (more on that below).",
      "Use the walkthrough selector and museum filter at the top to choose which experience and which tenant you're editing.",
    ],
  },
  {
    icon: Sparkles,
    title: "Editor modes: Very Easy, Super Easy, and Advanced",
    body: [
      "Very Easy mode is the guided default — it leans on autofill and presets to produce a complete, coherent experience with minimal manual input, and runs a lighter readiness check before publish.",
      "Super Easy mode is a simplified front end over the same data, aimed at fast one-pass setup.",
      "Advanced (manual) mode exposes every field on every room — narration, media, hotspots, CTAs, branching, accessibility, adaptive modes, and per-type configuration (exhibition, archive, AI conversation, performance stage, timeline, gamification, reflection chamber, branching choice, onboarding guide, and more).",
      "You can switch modes at any time; switching doesn't discard your rooms, it just changes which tools and validations are shown.",
    ],
  },
  {
    icon: Map,
    title: "Journey Map, Timeline, and room navigation",
    body: [
      "The Journey Map gives a bird's-eye view of every room in the current walkthrough, its order, and its type — click any room to jump straight to it in the editor.",
      "The Experience Timeline shows pacing: estimated duration per room and the running total, plus per-room intensity metrics (emotional, educational, interaction, sensory).",
      "Rooms can be reordered, duplicated, or added/removed from the room list. Each room has a 'visibility' setting (visible, draft, hidden) — only 'visible' rooms are eligible to appear in a published manifest.",
    ],
  },
  {
    icon: Wand2,
    title: "Autofill, presets, and media tools",
    body: [
      "Museum Preset Autofill can populate an entire walkthrough from a curated starting template — useful for quickly bootstrapping a new museum or walkthrough slot.",
      "Global Experience Autofill offers targeted helpers: fill the active room, fill the whole experience, generate/repair media bindings, generate a cinematic layout, or generate narrative text.",
      "Media bindings (image, video, audio, panorama, 3D model, scrollable images) are normalized automatically — set a primary media URL and the system derives sensible background/foreground/type defaults for you.",
    ],
  },
  {
    icon: Activity,
    title: "Quality scoring, validation, and migration tools",
    body: [
      "The Experience Quality Panel scores the current draft across dimensions like publish safety, pacing, and sensory balance — use it as a guide for polish, not a hard gate.",
      "Validation messages (shown in the amber panel near the top) flag missing titles, missing media, and other issues per room. These are informational while you're drafting — they only become a hard requirement at publish time.",
      "The Migration Readiness Panel and legacy backups help when bringing older scene/slide formats into the current room schema, so older content can be edited safely without losing the original data.",
    ],
  },
  {
    icon: ArrowUpRightFromCircle,
    title: "Publishing: how a draft becomes public",
    body: [
      "The Publish button opens a dialog where you choose which walkthrough(s) to include in the next public release.",
      "Publishing compiles your current drafts into a PublishedExperienceManifest — a complete, self-contained, immutable snapshot of titles, descriptions, room order, media, and the museum's public 'card' (name, description, region, cover image).",
      "Before a manifest is created, the compiler checks: every included walkthrough has at least one visible room, every visible room has a title and a valid media URL, and the museum has a name/description for its public card. If any check fails, publishing stops and the issues are listed so you can fix them in the editor and try again.",
      "A successful publish atomically repoints the tenant's published_manifest_id/version to the new manifest — the change appears everywhere on the public site (museum home, Explore cards, and every /tour/N route) at once.",
    ],
  },
  {
    icon: History,
    title: "Versions, rollback, and history",
    body: [
      "Every publish creates a new manifest version (v1, v2, v3, ...). Past versions are kept forever — they're never edited or deleted, so they're always available as a safe restore point.",
      "The Publish dialog's history panel lists previous versions with their publish time and author. Selecting Rollback on an older version instantly repoints the live site to that version — no recompiling, no waiting.",
      "Because rollback just changes a pointer, it's effectively instant and risk-free. If a new publish introduces a problem, rolling back restores the exact prior public state.",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Drafts and the public site never mix",
    body: [
      "Saving a draft (Save Draft) updates ExperienceConfig only — it never changes what's live, no matter how many times you save.",
      "The public site reads exclusively from the currently pointed-to PublishedExperienceManifest. There's no merging of draft and published content, and no fallback or placeholder content is shown.",
      "If a tenant has never published, public routes for that tenant simply say the experience hasn't been published yet — this is expected for brand-new tenants and is not an error.",
    ],
  },
  {
    icon: FileArchive,
    title: "AI ZIP Import",
    body: [
      "Import Museum ZIP is a planning assistant — it turns an uploaded folder of images, video, audio, and documents into a proposed draft. It creates drafts only and never publishes anything.",
      "It does not change the public museum. Publish Museum is still the only action that updates what visitors see.",
      "Expert Mode creates the richest museum plan (curatorial framing, accessibility text, suggested CTAs and learning outcomes). Easy Mode creates a simpler guided plan with narration and basic structure. Very Easy Mode fills in just the basics — title, description, media, and simple narration — for beginners.",
      "Always review AI-generated rooms before publishing: check media assignment, fix anything marked 'needs media', and verify any factual claims (dates, names, provenance) yourself — the AI marks unknowns instead of inventing facts, but it can still misread a filename or document.",
      "Rollback is still available after publishing an AI-assisted draft, the same as any other publish. The public museum is always controlled by the latest selected PublishedExperienceManifest.",
    ],
  },
  {
    icon: Globe,
    title: "Multi-walkthrough museums",
    body: [
      "A museum can publish one or several walkthroughs at once. Each included walkthrough becomes its own entry in the manifest, in the order you select.",
      "Visitors reach a specific walkthrough via /museum/:tenantSlug/tour/1, /tour/2, etc. (with /begin-tour and the legacy /begin-tour-2..5 aliases continuing to work).",
      "If a museum publishes only one walkthrough, the museum home page shows that walkthrough's rooms as individual stations; with multiple walkthroughs, it shows one card per walkthrough.",
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
          <span className="text-sm font-semibold">TheV2 — Experience Builder Guide</span>
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">Reference</span>
        </div>
        <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </button>

      {open && (
        <div className="mt-4 space-y-3">
          <p className="text-xs leading-relaxed text-muted-foreground">
            A complete walkthrough of how this editor works, from drafting a room to publishing it for visitors and rolling back if needed.
            Nothing on this page is a required step — it's a reference you can open whenever you need a refresher.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
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
        </div>
      )}
    </div>
  );
}
