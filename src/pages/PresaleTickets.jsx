import { useEffect, useState } from "react";
import { Ticket, Rocket, Sparkles, ArrowRight, Check, Clock, ShieldCheck, Wand2, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import PlatformShell from "@/components/platform/PlatformShell";
import PresalePurchaseOverlay from "@/components/presale/PresalePurchaseOverlay";
import {
  PRESALE_TICKET_PACKAGES, TENANT_TRIAL_OFFER, PAYNOW, PURCHASE_INSTRUCTIONS,
  PRESALE_PROMO_ENDS_AT, PRESALE_FAQ,
} from "@/lib/presale-content";

const fmt = (price, currency = "SGD") => (price ? `${currency} ${price}` : "Free");

function useCountdown(targetIso) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const diff = Math.max(0, new Date(targetIso).getTime() - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { days, hours, minutes, seconds, ended: diff === 0 };
}

export default function PresaleTickets() {
  const [overlay, setOverlay] = useState({ open: false, mode: "ticket", packageId: "premium_pass" });
  const countdown = useCountdown(PRESALE_PROMO_ENDS_AT);

  useEffect(() => { document.title = "Pre-Sale Tickets | SCAVerse"; }, []);

  const openTicket = (packageId) => setOverlay({ open: true, mode: "ticket", packageId });
  const openTenant = () => setOverlay({ open: true, mode: "tenant", packageId: "premium_pass" });

  return (
    <PlatformShell>
      {/* HERO */}
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:py-24">
        <video
          autoPlay muted loop playsInline preload="metadata"
          className="absolute inset-0 h-full w-full object-cover opacity-30"
          src="https://res.cloudinary.com/dwc4hamrl/video/upload/q_auto/f_auto/v1780413829/grok_video_2026-06-02-23-23-15_yebvs5.mp4"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/70 to-background" />
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-cyan-400/10 blur-[120px]" />

        <div className="relative mx-auto max-w-5xl text-center">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 font-display text-[10px] font-semibold uppercase tracking-[0.4em] text-primary">
            <Sparkles className="h-3.5 w-3.5" /> 15 June Soft Launch · Pre-Sale Now On
          </p>
          <h1 className="mx-auto max-w-4xl font-heading text-5xl font-bold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
            Be first inside the<br />
            <span className="bg-gradient-to-r from-primary via-amber-300 to-primary bg-clip-text text-transparent">SCAVerse</span> launch.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl font-body text-lg font-light leading-relaxed text-muted-foreground">
            Lock in early-bird pre-sale prices on virtual museum e-tickets — or claim your free 7-day tenant trial and build your own 3D museum. Early-bird pricing ends {new Date(PRESALE_PROMO_ENDS_AT).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}.
          </p>

          {/* Countdown */}
          <div className="mx-auto mt-8 flex max-w-md items-center justify-center gap-2 text-center">
            {[
              { v: countdown.days, l: "days" },
              { v: countdown.hours, l: "hrs" },
              { v: countdown.minutes, l: "min" },
              { v: countdown.seconds, l: "sec" },
            ].map((unit) => (
              <div key={unit.l} className="flex-1 rounded-2xl border border-primary/20 bg-card/50 py-3 backdrop-blur">
                <p className="font-heading text-3xl font-bold text-primary tabular-nums">{String(unit.v).padStart(2, "0")}</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{unit.l}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5" /> until early-bird pricing ends</p>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button size="lg" className="bg-primary text-primary-foreground" onClick={() => openTicket("premium_pass")}>
              <Ticket className="h-4 w-4" /> Buy E-Tickets <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={openTenant}>
              <Rocket className="h-4 w-4" /> Become a Tenant — 1 Week Free
            </Button>
          </div>
        </div>
      </section>

      {/* TICKET PACKAGES */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="mb-8 text-center">
          <h2 className="font-heading text-3xl font-bold sm:text-4xl">E-ticket packages</h2>
          <p className="mt-2 text-sm text-muted-foreground">Early-bird pre-sale pricing. Pay by PayNow — your access is activated by an admin after payment.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {PRESALE_TICKET_PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative flex flex-col rounded-3xl border p-6 backdrop-blur transition hover:-translate-y-1 ${pkg.highlight ? "border-primary/50 bg-primary/[0.07] shadow-2xl shadow-primary/10" : "border-border/40 bg-card/50"}`}
            >
              {pkg.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">Most popular</span>
              )}
              <h3 className="font-heading text-xl font-bold">{pkg.label}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{pkg.tagline}</p>
              <div className="mt-4 flex items-end gap-2">
                <span className="font-heading text-4xl font-bold text-primary">{fmt(pkg.price, pkg.currency)}</span>
                {pkg.regularPrice && <span className="mb-1 text-sm text-muted-foreground line-through">{pkg.currency} {pkg.regularPrice}</span>}
              </div>
              <ul className="mt-5 flex-1 space-y-2">
                {pkg.features.map((feature) => (
                  <li key={feature} className="flex gap-2 text-sm text-foreground/85"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {feature}</li>
                ))}
              </ul>
              <Button className="mt-6 w-full" variant={pkg.highlight ? "default" : "outline"} onClick={() => openTicket(pkg.id)}>
                <Ticket className="h-4 w-4" /> Get this pass
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* TENANT TRIAL */}
      <section className="px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-primary/25 bg-gradient-to-br from-primary/10 via-card/50 to-cyan-400/[0.06] p-8 backdrop-blur sm:p-12">
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
                <Button size="lg" className="bg-primary text-primary-foreground" onClick={openTenant}>
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
        </div>
      </section>

      {/* HOW TO PAY */}
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="rounded-3xl border border-border/40 bg-card/50 p-8 backdrop-blur">
          <h2 className="font-heading text-2xl font-bold sm:text-3xl">How to pay & get access</h2>
          <p className="mt-2 text-sm text-muted-foreground">All payments are by PayNow. There's no automated checkout — an admin verifies your transfer and activates your role.</p>
          <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="flex flex-col justify-center rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 to-transparent p-6 text-center">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">PayNow UEN</p>
              <p className="mt-1 font-mono text-3xl font-bold tracking-wide">{PAYNOW.uen}</p>
              <p className="mt-1 text-xs text-muted-foreground">{PAYNOW.payeeName}</p>
            </div>
            <ol className="space-y-2.5">
              {PURCHASE_INSTRUCTIONS.map((line, index) => (
                <li key={index} className="flex gap-3 text-sm text-foreground/85">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">{index + 1}</span>
                  {line}
                </li>
              ))}
            </ol>
          </div>
          <p className="mt-5 flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-xs text-amber-200">
            <ShieldCheck className="h-4 w-4 shrink-0" /> Important: the email in your PayNow comment must match the email you submit, or we can't match your payment to your access.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <h2 className="mb-6 text-center font-heading text-2xl font-bold sm:text-3xl">Pre-sale FAQ</h2>
        <div className="space-y-3">
          {PRESALE_FAQ.map((item) => (
            <details key={item.q} className="rounded-2xl border border-border/40 bg-card/50 p-4">
              <summary className="cursor-pointer text-sm font-semibold">{item.q}</summary>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <PresalePurchaseOverlay
        open={overlay.open}
        mode={overlay.mode}
        packageId={overlay.packageId}
        onClose={() => setOverlay((current) => ({ ...current, open: false }))}
      />
    </PlatformShell>
  );
}
