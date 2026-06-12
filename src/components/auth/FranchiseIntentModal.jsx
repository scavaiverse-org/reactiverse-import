import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FranchiseIntentModal({ open, onApply, onSkip }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl border border-border/50 bg-card p-8 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-primary/25 bg-primary/10">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <h2 className="font-display text-xl font-bold text-foreground">Ready to apply for a franchise?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          You told us you might be interested in opening a space on SCAVers. Want to apply for a franchise or show us your work now?
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
          <Button onClick={onApply} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
            Yes, apply
          </Button>
          <Button variant="outline" onClick={onSkip} className="flex-1">
            Not now
          </Button>
        </div>
      </div>
    </div>
  );
}
