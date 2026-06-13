import { useState } from "react";
import { X, BookOpen, Rocket, ListChecks, Boxes, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SUPERGUIDE_QUICK_START, SUPERGUIDE_SECTIONS, SUPERGUIDE_OBJECT_TYPES } from "@/lib/three-d-world-superguide-content";
import { THREE_D_WORLD_EXAMPLES } from "@/lib/three-d-world-examples";
import { getWorldTemplate } from "@/lib/three-d-world-seed";

const TABS = [
  { id: "quick_start", label: "Quick Start", icon: Rocket },
  { id: "fields", label: "Field Reference", icon: ListChecks },
  { id: "objects", label: "Object Types", icon: Boxes },
  { id: "examples", label: "Example Worlds", icon: Sparkles },
];

// Full-screen reference overlay for the 3D World Builder: a from-scratch
// quick-start guide, a field-by-field reference for every numbered section,
// a reference for every object type, and a gallery of ready-to-load example
// worlds. Purely informational + "load this" actions — it never edits the
// world directly except via onUseExample.
export default function ThreeDWorldSuperguide({ open, onClose, onUseExample }) {
  const [tab, setTab] = useState("quick_start");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-2 backdrop-blur-sm sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-background shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-white/10 p-4 sm:p-5">
          <div className="flex items-center gap-2.5">
            <BookOpen className="h-5 w-5 text-primary" />
            <div>
              <h2 className="font-display text-xl font-bold">3D World Superguide</h2>
              <p className="text-xs text-muted-foreground">A complete, from-scratch guide to building and publishing a 3D world — every field, every object type, and ready-to-load examples.</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex flex-wrap gap-2 border-b border-white/10 p-3">
          {TABS.map((entry) => {
            const Icon = entry.icon;
            return (
              <Button key={entry.id} size="sm" variant={tab === entry.id ? "default" : "outline"} onClick={() => setTab(entry.id)}>
                <Icon className="h-3.5 w-3.5" /> {entry.label}
              </Button>
            );
          })}
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          {tab === "quick_start" && <QuickStartTab />}
          {tab === "fields" && <FieldReferenceTab />}
          {tab === "objects" && <ObjectTypesTab />}
          {tab === "examples" && <ExampleWorldsTab onUseExample={onUseExample} onClose={onClose} />}
        </div>
      </div>
    </div>
  );
}

function QuickStartTab() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Follow these steps in order to go from an empty room to a published 3D world. Each step links to the matching numbered section in the builder below.</p>
      <ol className="space-y-3">
        {SUPERGUIDE_QUICK_START.map((entry) => (
          <li key={entry.step} className="flex gap-3 rounded-2xl border border-white/10 bg-background/40 p-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">{entry.step}</span>
            <div className="space-y-1">
              <p className="text-sm font-semibold">{entry.title}</p>
              <p className="text-xs text-muted-foreground">{entry.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function FieldReferenceTab() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Every field in every numbered section of the 3D World Builder, with what it does and an example value.</p>
      {SUPERGUIDE_SECTIONS.map((section) => (
        <details key={section.index} className="overflow-hidden rounded-2xl border border-white/10 bg-background/30">
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">
            <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">{section.index}</span>
            {section.title}
          </summary>
          <div className="space-y-3 border-t border-white/10 p-4">
            <p className="text-xs text-muted-foreground">{section.purpose}</p>
            <div className="space-y-2">
              {section.fields.map((field) => (
                <div key={field.label} className="rounded-xl border border-white/10 bg-background/40 p-3">
                  <p className="text-sm font-semibold">{field.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{field.what}</p>
                  <p className="mt-1.5 text-xs"><span className="text-muted-foreground">Example: </span><span className="font-mono">{field.example}</span></p>
                </div>
              ))}
            </div>
          </div>
        </details>
      ))}
    </div>
  );
}

function ObjectTypesTab() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Every object type in the Object Library (Section 5), with the fields it has on top of the shared fields in Section 6.</p>
      {SUPERGUIDE_OBJECT_TYPES.map((type) => (
        <details key={type.id} className="overflow-hidden rounded-2xl border border-white/10 bg-background/30">
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">
            {type.name} <span className="ml-2 text-xs font-normal text-muted-foreground">{type.category}</span>
          </summary>
          <div className="space-y-3 border-t border-white/10 p-4">
            <p className="text-xs text-muted-foreground">{type.description}</p>
            <div className="space-y-2">
              {type.fields.map((field) => (
                <div key={field.label} className="rounded-xl border border-white/10 bg-background/40 p-3">
                  <p className="text-sm font-semibold">{field.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{field.what}</p>
                  <p className="mt-1.5 text-xs"><span className="text-muted-foreground">Example: </span><span className="font-mono">{field.example}</span></p>
                </div>
              ))}
            </div>
          </div>
        </details>
      ))}
    </div>
  );
}

function ExampleWorldsTab({ onUseExample, onClose }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Ready-to-load example worlds covering every template and object type. Loading an example replaces the current draft — refine it afterwards in the sections below.</p>
      <div className="grid gap-3 md:grid-cols-2">
        {THREE_D_WORLD_EXAMPLES.map((entry) => {
          const template = getWorldTemplate(entry.templateId);
          return (
            <div key={entry.id} className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-background/40 p-4">
              <div>
                <p className="text-sm font-semibold">{entry.name}</p>
                {template && <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{template.name} · {template.category}</p>}
              </div>
              <p className="flex-1 text-xs text-muted-foreground">{entry.summary}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (typeof window !== "undefined" && !window.confirm(`Load "${entry.name}"? This replaces the current draft world.`)) return;
                  onUseExample(entry.build());
                  onClose();
                }}
              >
                <Sparkles className="h-3.5 w-3.5" /> Use this example
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
