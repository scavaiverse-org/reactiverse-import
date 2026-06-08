import { useEffect, useRef, useState } from "react";
import { Accessibility, Eye, Moon, Type, ChevronUp, ChevronDown } from "lucide-react";

const OPTIONS = [
  { key: "reducedMotion", label: "Reduced motion", icon: Eye, className: "scavai-reduced-motion" },
  { key: "calmMode", label: "Calm mode", icon: Moon, className: "scavai-calm-mode" },
  { key: "largeText", label: "Larger text", icon: Type, className: "scavai-large-text" },
];

const LONG_PRESS_MS = 450;
const POSITION_KEY = "scavai_comfort_position";

export default function ExperienceControls() {
  const panelRef = useRef(null);
  const holdTimerRef = useRef(null);
  const draggingRef = useRef(false);
  const blockClickRef = useRef(false);
  const offsetRef = useRef({ x: 0, y: 0 });
  const [settings, setSettings] = useState(() => {
    if (typeof window === "undefined") return {};
    return JSON.parse(window.localStorage.getItem("scavai_accessibility") || "{}");
  });
  const [expanded, setExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(() => {
    if (typeof window === "undefined") return null;
    return JSON.parse(window.localStorage.getItem(POSITION_KEY) || "null");
  });

  useEffect(() => {
    if (typeof document === "undefined") return;
    OPTIONS.forEach((option) => document.documentElement.classList.toggle(option.className, !!settings[option.key]));
    window.localStorage.setItem("scavai_accessibility", JSON.stringify(settings));
    window.dispatchEvent(new Event("scavai-accessibility-change"));
  }, [settings]);

  const keepInViewport = (x, y) => {
    const panel = panelRef.current;
    const width = panel?.offsetWidth || 140;
    const height = panel?.offsetHeight || 48;
    const padding = 8;
    return {
      x: Math.max(padding, Math.min(window.innerWidth - width - padding, x)),
      y: Math.max(padding, Math.min(window.innerHeight - height - padding, y)),
    };
  };

  const handlePointerDown = (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const rect = panelRef.current?.getBoundingClientRect();
    if (!rect) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    offsetRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    holdTimerRef.current = window.setTimeout(() => {
      draggingRef.current = true;
      setIsDragging(true);
      setExpanded(false);
    }, LONG_PRESS_MS);
  };

  const handlePointerMove = (event) => {
    if (!draggingRef.current) return;
    event.preventDefault();
    setPosition(keepInViewport(event.clientX - offsetRef.current.x, event.clientY - offsetRef.current.y));
  };

  const handlePointerUp = () => {
    window.clearTimeout(holdTimerRef.current);
    if (!draggingRef.current) return;

    draggingRef.current = false;
    blockClickRef.current = true;
    setIsDragging(false);
    setPosition((current) => {
      if (current) window.localStorage.setItem(POSITION_KEY, JSON.stringify(current));
      return current;
    });
    window.setTimeout(() => { blockClickRef.current = false; }, 0);
  };

  const panelStyle = position ? { left: position.x, top: position.y, right: "auto", bottom: "auto" } : undefined;

  return (
    <div
      ref={panelRef}
      style={panelStyle}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`fixed bottom-4 right-4 z-50 touch-none rounded-2xl border border-white/10 bg-background/90 shadow-2xl backdrop-blur-xl transition-all ${isDragging ? "cursor-grabbing ring-1 ring-primary" : ""} ${expanded ? "pointer-events-auto" : "pointer-events-none"}`}
      onMouseEnter={() => !isDragging && setExpanded(true)}
      onMouseLeave={() => !isDragging && setExpanded(false)}
    >
      <button
        onPointerDown={handlePointerDown}
        onClick={() => {
          if (blockClickRef.current) return;
          setExpanded(!expanded);
        }}
        className="pointer-events-auto flex w-full touch-none select-none items-center justify-between gap-1.5 px-3 py-2.5 text-[10px] uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
      >
        <div className="flex items-center gap-1.5">
          <Accessibility className="w-3 h-3 text-primary" /> Comfort
        </div>
        {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
      </button>
      {expanded && (
        <div className="flex flex-col gap-1 border-t border-white/10 p-2">
          {OPTIONS.map((option) => {
            const Icon = option.icon;
            const active = !!settings[option.key];
            return (
              <button
                key={option.key}
                onClick={() => setSettings((prev) => ({ ...prev, [option.key]: !prev[option.key] }))}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors ${active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"}`}
              >
                <Icon className="w-3.5 h-3.5" /> {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}