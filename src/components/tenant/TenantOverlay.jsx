import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TenantOverlay({ tenant, pageType }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!tenant?.slug || pageType !== "home") return;
    const key = `tenant-onboarding-seen:${tenant.slug}`;
    setOpen(localStorage.getItem(key) !== "true");
  }, [tenant?.slug, pageType]);

  const close = () => {
    if (tenant?.slug) localStorage.setItem(`tenant-onboarding-seen:${tenant.slug}`, "true");
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4 backdrop-blur-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="relative max-w-2xl rounded-[2rem] border border-white/15 bg-background/82 p-6 text-center shadow-[0_30px_120px_rgba(0,0,0,0.7)] sm:p-9" initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 18, scale: 0.98 }}>
            <button onClick={close} className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/5 p-2 text-foreground/60 hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary/15 text-primary">
              <Sparkles className="h-6 w-6" />
            </div>
            <p className="font-display text-[10px] font-medium uppercase tracking-[0.5em] text-primary/70">Tenant public platform</p>
            <h2 className="mt-4 font-heading text-4xl font-semibold tracking-tight text-foreground">Welcome to {tenant?.name || "this museum"}.</h2>
            <p className="mx-auto mt-4 max-w-xl font-body text-sm font-light leading-7 text-muted-foreground">Enter a branded museum ecosystem with tickets, stories, guided rooms, AI support, immersive transitions, and tenant-owned visitor pathways.</p>
            <Button onClick={close} className="mt-7 bg-primary text-primary-foreground hover:bg-primary/90">Enter Experience</Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}