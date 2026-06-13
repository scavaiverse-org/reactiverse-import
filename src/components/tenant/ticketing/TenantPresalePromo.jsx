import { useState } from "react";
import { ArrowRight, Box, Check, Rocket, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import PresalePurchaseOverlay from "@/components/presale/PresalePurchaseOverlay";
import { TENANT_TRIAL_OFFER } from "@/lib/presale-content";

// Pre-launch promo block appended below the ticket gateway: the "Become a
// Tenant" free-trial offer (SGD 300 after the 7-day trial). The trial sign-up
// is recorded in payment_proofs for the master-admin "UEN" tab to verify and
// activate manually.
export default function TenantPresalePromo() {
  const [overlayOpen, setOverlayOpen] = useState(false);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
      <section className="overflow-hidden rounded-[2rem] border border-primary/25 bg-gradient-to-br from-primary/10 via-card/50 to-cyan-400/[0.06] p-8 backdrop-blur sm:p-12">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
              <Sparkles className="h-3 w-3" /> 7 days free
            </p>
            <h2 className="mt-4 font-heading text-3xl font-bold sm:text-4xl">Build your own 3D museum — free for a week.</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{TENANT_TRIAL_OFFER.tagline} Full access to the Experience Editor and the state-of-the-art 3D World Editor. No charge during the trial.</p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {TENANT_TRIAL_OFFER.includes.map((item) => (
                <div key={item} className="flex gap-2 text-sm text-foreground/85"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> {item}</div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button size="lg" className="bg-primary text-primary-foreground" onClick={() => setOverlayOpen(true)}>
                <Rocket className="h-4 w-4" /> Start free trial <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-background/50 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15"><Wand2 className="h-5 w-5 text-primary" /></div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15"><Box className="h-5 w-5 text-primary" /></div>
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">After the free trial</p>
            <ul className="mt-2 space-y-1.5">
              {TENANT_TRIAL_OFFER.afterTrial.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-foreground/85"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> {item}</li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] text-muted-foreground">{TENANT_TRIAL_OFFER.afterTrialNote}</p>
          </div>
        </div>
      </section>

      <PresalePurchaseOverlay open={overlayOpen} mode="tenant" onClose={() => setOverlayOpen(false)} />
    </div>
  );
}
