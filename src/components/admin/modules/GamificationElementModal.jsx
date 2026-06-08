import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import StatusBadge from "@/components/admin/StatusBadge";

export default function GamificationElementModal({ element, tenant, gamEnabled, open, onClose }) {
  if (!element) return null;
  const Icon = element.icon;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#0a1120] border-white/10 text-foreground max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <Icon className="w-5 h-5 text-red-400" />
            {element.label}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="flex items-center justify-between rounded-lg border border-white/8 bg-white/[0.02] p-3">
            <div>
              <p className="text-xs font-medium text-foreground">Status</p>
              <p className="text-[10px] text-muted-foreground">{element.desc}</p>
            </div>
            <StatusBadge status={element.status} />
          </div>

          <div className="rounded-lg border border-white/8 bg-white/[0.02] p-3">
            <p className="text-[10px] tracking-[0.2em] text-muted-foreground mb-1">MUSEUM</p>
            <p className="text-xs text-foreground">{tenant?.name || "No tenant selected"}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Gamification is {gamEnabled ? "ENABLED" : "DISABLED"} for this museum
            </p>
          </div>

          <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-3">
            <p className="text-xs font-semibold text-amber-400 mb-1">Configuration</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {gamEnabled
                ? `Configure ${element.label.toLowerCase()} rules, thresholds, and visibility for this museum. Setup options will appear here as this element is provisioned.`
                : `Enable the Gamification module for ${tenant?.name || "this museum"} before configuring ${element.label.toLowerCase()}.`}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}