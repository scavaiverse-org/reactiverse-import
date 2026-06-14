import {
  PAYNOW,
  PURCHASE_INSTRUCTIONS,
  PRESALE_TICKET_PACKAGES,
  TENANT_TRIAL_OFFER,
} from "@/lib/presale-content";
import { CheckCircle2, Ticket, Rocket, CreditCard, AlertCircle } from "lucide-react";

function PackageCard({ pkg }) {
  return (
    <div className={`rounded-xl border p-4 space-y-2 ${pkg.highlight ? "border-primary/40 bg-primary/5" : "border-border/40 bg-card/50"}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">{pkg.label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{pkg.tagline}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-lg font-bold text-primary">{pkg.currency} {pkg.price}</p>
          {pkg.regularPrice && (
            <p className="text-[10px] text-muted-foreground line-through">regular {pkg.currency} {pkg.regularPrice}</p>
          )}
        </div>
      </div>
      <ul className="space-y-1">
        {pkg.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />
            {f}
          </li>
        ))}
      </ul>
      {pkg.highlight && (
        <span className="inline-flex rounded-full bg-primary/15 border border-primary/30 px-2 py-0.5 text-[10px] font-semibold text-primary tracking-wide">MOST POPULAR</span>
      )}
    </div>
  );
}

export default function TheBackup() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-12">

        {/* Header */}
        <div>
          <p className="text-xs tracking-[0.3em] text-primary font-semibold mb-2">SCAVERSE — INTERNAL REFERENCE</p>
          <h1 className="text-3xl font-display font-bold text-foreground">The Backup</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl">
            Complete purchase instructions and package list for the SCAVerse pre-sale. PayNow to UEN <span className="font-mono text-foreground">{PAYNOW.uen}</span> ({PAYNOW.payeeName}).
          </p>
        </div>

        {/* PayNow Details */}
        <section className="rounded-xl border border-border/50 bg-card/50 p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <CreditCard className="w-4 h-4 text-primary" />
            PayNow Payment Details
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="rounded-lg border border-border/40 bg-background/60 px-4 py-3">
              <p className="text-[10px] text-muted-foreground tracking-widest uppercase mb-1">UEN</p>
              <p className="text-xl font-mono font-bold text-foreground">{PAYNOW.uen}</p>
            </div>
            <div className="rounded-lg border border-border/40 bg-background/60 px-4 py-3">
              <p className="text-[10px] text-muted-foreground tracking-widest uppercase mb-1">Payee Name</p>
              <p className="text-xl font-bold text-foreground">{PAYNOW.payeeName}</p>
            </div>
          </div>
        </section>

        {/* How to Purchase */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertCircle className="w-4 h-4 text-primary" />
            How to Purchase — Step by Step
          </div>
          <ol className="space-y-2">
            {PURCHASE_INSTRUCTIONS.map((step, i) => (
              <li key={i} className="flex gap-3 rounded-lg border border-border/30 bg-card/40 px-4 py-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/15 border border-primary/30 text-[10px] font-bold text-primary flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-foreground leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* E-Ticket Packages */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Ticket className="w-4 h-4 text-primary" />
            E-Ticket Packages
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {PRESALE_TICKET_PACKAGES.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
        </section>

        {/* Tenant Trial Offer */}
        <section className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Rocket className="w-4 h-4 text-cyan-400" />
            {TENANT_TRIAL_OFFER.label}
          </div>
          <p className="text-sm text-muted-foreground">{TENANT_TRIAL_OFFER.tagline}</p>

          <div>
            <p className="text-[10px] text-muted-foreground tracking-widest uppercase mb-1.5">Trial Includes</p>
            <ul className="space-y-1">
              {TENANT_TRIAL_OFFER.includes.map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="w-3 h-3 text-cyan-400 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[10px] text-muted-foreground tracking-widest uppercase mb-1.5">After the 7-Day Trial</p>
            <ul className="space-y-1">
              {TENANT_TRIAL_OFFER.afterTrial.map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="w-3 h-3 flex-shrink-0 mt-0.5 text-muted-foreground">·</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-cyan-300/80 italic">{TENANT_TRIAL_OFFER.afterTrialNote}</p>
        </section>

      </div>
    </div>
  );
}
