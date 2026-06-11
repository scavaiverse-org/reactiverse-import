import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import { Building2, Crown, Home, Network, ShieldCheck, Sparkles, Wand2, X } from "lucide-react";
import { DEFAULT_MUSEUM_SLUG } from "@/lib/domain-registry";

const DESTINATIONS = [
  {
    title: "Home",
    description: "Return to the main SCAVerse entry gateway.",
    route: "/",
    icon: Home,
  },
  {
    title: "Tenant Admin",
    description: "Manage tenant-specific museum operations, content, walkthroughs, tickets, and experiences.",
    route: `/museum/${DEFAULT_MUSEUM_SLUG}/admin`,
    icon: Building2,
  },
  {
    title: "Master Admin",
    description: "Global operational control center for platform-wide governance, intelligence systems, and tenancy orchestration.",
    route: "/platform/admin",
    icon: Crown,
  },
  {
    title: "Architecture Blueprint",
    description: "System-wide architectural visualization layer showing routing, entities, engines, pipelines, and relationships.",
    route: "/platform/admin/architecture-blueprint",
    icon: Network,
  },
  {
    title: "Experience Editor",
    description: "Direct access to the immersive cinematic experience editing environment.",
    route: `/museum/${DEFAULT_MUSEUM_SLUG}/admin/walkthrough`,
    icon: Wand2,
  },
];

const HOLD_TO_DRAG_MS = 1500;

export default function InternalRapidPortalGateway() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [dragEnabled, setDragEnabled] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const holdTimerRef = useRef(null);
  const draggedRef = useRef(false);

  const clearHoldTimer = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const handlePointerDown = () => {
    draggedRef.current = false;
    clearHoldTimer();
    holdTimerRef.current = setTimeout(() => setDragEnabled(true), HOLD_TO_DRAG_MS);
  };

  const handlePointerUpOrLeave = () => {
    clearHoldTimer();
  };

  const handleClick = () => {
    if (draggedRef.current || dragEnabled) {
      draggedRef.current = false;
      return;
    }
    setOpen(true);
  };

  const resetAndClose = () => {
    setOpen(false);
  };

  const goTo = (route) => {
    resetAndClose();
    navigate(route);
  };

  return (
    <>
      <motion.div
        className="fixed left-3 top-3 z-[70] sm:left-5 sm:top-5"
        style={{ x, y, touchAction: dragEnabled ? "none" : "auto" }}
        drag={dragEnabled}
        dragMomentum={false}
        dragElastic={0}
        onDragStart={() => { draggedRef.current = true; }}
        onDragEnd={() => setDragEnabled(false)}
      >
        <button
          type="button"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUpOrLeave}
          onPointerLeave={handlePointerUpOrLeave}
          onPointerCancel={handlePointerUpOrLeave}
          onClick={handleClick}
          className={`inline-flex items-center gap-2 rounded-full border border-primary/35 bg-background/35 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary shadow-2xl shadow-black/30 backdrop-blur-xl transition duration-300 ${dragEnabled ? "scale-105 cursor-grabbing border-primary/70 bg-primary/15" : "cursor-pointer hover:-translate-y-0.5 hover:border-primary/70 hover:bg-primary/15 hover:text-primary"}`}
          aria-label="Open internal rapid portal gateway. Press and hold to move it."
        >
          <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-primary/15">
            <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
            <ShieldCheck className="relative h-3.5 w-3.5" />
          </span>
          Portal
        </button>
      </motion.div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-label="Internal Rapid Portal Gateway"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.32 }}
              className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-primary/25 bg-background/72 p-4 shadow-2xl shadow-primary/10 backdrop-blur-2xl sm:p-5"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.22),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.15),transparent_34%)]" />
              <button
                type="button"
                onClick={resetAndClose}
                className="absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-white/5 p-2 text-foreground/70 transition hover:bg-white/10 hover:text-foreground"
                aria-label="Close portal"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="relative z-10">
                <div className="py-2">
                  <div className="mb-4 pr-8">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.28em] text-primary">
                      <Sparkles className="h-3 w-3" /> Portal Open
                    </div>
                    <h2 className="mt-3 font-display text-xl font-bold text-foreground sm:text-2xl">Portal Dashboard</h2>
                    <p className="mt-1.5 max-w-2xl text-xs leading-5 text-foreground/68">Rapid navigation for internal operators and architecture-level workflows.</p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    {DESTINATIONS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.title}
                          type="button"
                          onClick={() => goTo(item.route)}
                          className="group relative overflow-hidden rounded-2xl border border-white/12 bg-white/[0.055] p-3.5 text-left shadow-xl shadow-black/20 transition duration-300 hover:-translate-y-1 hover:border-primary/45 hover:bg-primary/[0.08] hover:shadow-primary/10"
                        >
                          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent opacity-0 transition group-hover:opacity-100" />
                          <div className="flex items-start gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary transition group-hover:scale-105 group-hover:bg-primary/20">
                              <Icon className="h-4 w-4" />
                            </span>
                            <span>
                              <span className="block font-display text-sm font-semibold text-foreground">{item.title}</span>
                              <span className="mt-1 block text-xs leading-5 text-foreground/66">{item.description}</span>
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}