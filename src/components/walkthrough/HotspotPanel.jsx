import React from "react";
import { Button } from "@/components/ui/button";
import { X, MessageCircle, ArrowRight, Ticket, Store, ShoppingBag, Flag } from "lucide-react";

// Deterministic panel-action label -> icon map.
// Labels are standardized in PANEL_ACTION_LIBRARY (Walkthrough.jsx).
const ACTION_ICONS = {
  "Keep Exploring": X,
  "Close": X,
  "Ask ARIA": MessageCircle,
  "Go to Next Station": ArrowRight,
  "Complete Tour": Flag,
  "View Tickets": Ticket,
  "Register Vendor": Store,
  "Explore Marketplace": ShoppingBag,
};

// ZONE B — Hotspot overlay. Renders content + a row of explicit, labeled
// secondary actions. "Keep Exploring" / "Close" only close the panel.
// Scene advancement here is ALWAYS labeled "Go to Next Station".
export default function HotspotPanel({ scene, hotspot, onAction, onClose }) {
  if (!hotspot) return null;
  const actions = hotspot.panel_actions?.length
    ? hotspot.panel_actions
    : [{ label: "Keep Exploring", action_type: "close" }];

  return (
    <div className="fixed inset-x-3 bottom-36 z-30 mx-auto max-h-[55vh] max-w-xl overflow-y-auto rounded-2xl border border-primary/25 bg-background/95 p-4 shadow-2xl backdrop-blur-xl sm:absolute sm:bottom-32 sm:left-0 sm:right-auto sm:mx-0">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-primary">{scene.title}</p>
          <h3 className="mt-1 text-lg font-display font-bold text-foreground">{hotspot.title}</h3>
        </div>
        <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={onClose} aria-label="Close hotspot panel">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <p className="mt-2 text-sm text-foreground/85 leading-relaxed">{hotspot.description}</p>
      <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{hotspot.detail}</p>
      <div className="mt-3 space-y-1 text-[11px] text-muted-foreground/80">
        <p>Sensory note: {hotspot.sensory_note}</p>
        <p>Reduced motion: {hotspot.reduced_motion_text}</p>
      </div>

      {/* Standardized secondary action row */}
      <div className="mt-4 flex flex-wrap gap-2">
        {actions.map((action, idx) => {
          const Icon = ACTION_ICONS[action.label] || ArrowRight;
          const isClose = action.action_type === "close";
          const isAdvance = action.action_type === "next_station" || action.action_type === "complete_tour";
          return (
            <Button
              key={`${action.label}-${idx}`}
              size="sm"
              variant={isClose ? "outline" : isAdvance ? "default" : "secondary"}
              className={isAdvance ? "bg-primary text-primary-foreground gap-1.5" : "gap-1.5"}
              onClick={() => onAction(action, hotspot, scene)}
            >
              <Icon className="w-3.5 h-3.5" />
              {action.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}