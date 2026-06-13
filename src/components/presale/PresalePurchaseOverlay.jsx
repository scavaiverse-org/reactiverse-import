import { useEffect, useState } from "react";
import { Ticket, Rocket, ShieldCheck, Copy, Check, Loader2, CheckCircle2, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import {
  PRESALE_TICKET_PACKAGES, TENANT_TRIAL_OFFER, PAYNOW, PURCHASE_INSTRUCTIONS,
  PRESALE_TENANT_ID, getPresalePackage,
} from "@/lib/presale-content";

const fmt = (price, currency = "SGD") => (price ? `${currency} ${price}` : "Free");

// Glammed-up pop-up overlay that closes the loop on the pre-sale page: buyers
// either purchase an e-ticket package or start the 1-week tenant free trial.
// Both record a request (Ticket / TenantInquiry) so an admin can verify the
// PayNow transfer and grant the role manually.
export default function PresalePurchaseOverlay({ open, onClose, mode = "ticket", packageId = "premium_pass" }) {
  const [tab, setTab] = useState(mode);
  const [selectedId, setSelectedId] = useState(packageId);
  const [quantity, setQuantity] = useState(1);
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [contactName, setContactName] = useState("");
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (open) {
      setTab(mode);
      setSelectedId(packageId || "premium_pass");
      setQuantity(1);
      setEmail("");
      setOrganization("");
      setContactName("");
      setStatus("");
      setSubmitting(false);
      setDone(false);
      setCopied(false);
    }
  }, [open, mode, packageId]);

  if (!open) return null;

  const isTicket = tab === "ticket";
  const pkg = getPresalePackage(selectedId) || PRESALE_TICKET_PACKAGES[0];
  const amount = isTicket ? pkg.price * Math.max(1, Number(quantity) || 1) : TENANT_TRIAL_OFFER.price;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const copyUen = async () => {
    try {
      await navigator.clipboard.writeText(PAYNOW.uen);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setStatus("Couldn't copy — the UEN is " + PAYNOW.uen);
    }
  };

  const submit = async () => {
    if (!emailValid) { setStatus("Please enter a valid email address — it must match your PayNow comment."); return; }
    setSubmitting(true);
    setStatus("");
    try {
      if (isTicket) {
        await base44.entities.Ticket.create({
          tenant_id: PRESALE_TENANT_ID,
          ticket_type: pkg.id,
          visitor_email: email.trim(),
          quantity: Math.max(1, Number(quantity) || 1),
          total_price: amount,
          currency: pkg.currency,
          status: "pending",
          access_mode: pkg.accessMode || "virtual",
          source_step: "presale_15jun",
          notes: `Pre-sale PayNow to UEN ${PAYNOW.uen}. Awaiting admin payment verification before role is granted.`,
        });
      } else {
        await base44.entities.TenantInquiry.create({
          organization: organization.trim() || "(not provided)",
          contact_name: contactName.trim() || "(not provided)",
          email: email.trim(),
          museum_type: "Pre-sale tenant trial",
          message: `Requesting the 1-week free tenant trial (Experience Editor + 3D World Editor) via the 15 June pre-sale. Activate trial role for ${email.trim()}.`,
          status: "new",
          submitted_at: new Date().toISOString(),
        });
      }
      setDone(true);
    } catch (err) {
      setStatus(err?.message || "Something went wrong submitting your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-2 backdrop-blur-sm sm:p-4">
      <div className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-primary/25 bg-background shadow-2xl shadow-primary/10">
        {/* Glam gradient header */}
        <header className="relative overflow-hidden border-b border-white/10 bg-gradient-to-br from-primary/25 via-background to-cyan-400/10 p-5">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <p className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-background/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">
                <Sparkles className="h-3 w-3" /> 15 June Pre-Sale
              </p>
              <h2 className="mt-3 font-heading text-2xl font-bold">{isTicket ? "Get your e-tickets" : "Start your free tenant trial"}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{isTicket ? "Early-bird pricing — pay by PayNow." : "7 days free on the Experience Editor + 3D World Editor."}</p>
            </div>
            <button onClick={onClose} className="rounded-full p-2 text-muted-foreground hover:bg-white/10 hover:text-foreground" aria-label="Close">✕</button>
          </div>

          {!done && (
            <div className="relative mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTab("ticket")}
                className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${isTicket ? "border-primary bg-primary/15 text-foreground" : "border-white/10 bg-background/40 text-muted-foreground hover:border-white/20"}`}
              >
                <Ticket className="h-4 w-4" /> Buy E-Tickets
              </button>
              <button
                type="button"
                onClick={() => setTab("tenant")}
                className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${!isTicket ? "border-primary bg-primary/15 text-foreground" : "border-white/10 bg-background/40 text-muted-foreground hover:border-white/20"}`}
              >
                <Rocket className="h-4 w-4" /> Become a Tenant
              </button>
            </div>
          )}
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {done ? (
            <div className="flex flex-col items-center py-8 text-center">
              <CheckCircle2 className="mb-4 h-12 w-12 text-emerald-400" />
              <h3 className="font-heading text-2xl font-bold">Request received</h3>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                {isTicket
                  ? `We've logged your request for ${pkg.label}. Once your PayNow transfer of ${fmt(amount, pkg.currency)} is verified, an admin will activate your e-ticket for ${email.trim()} — usually within 24 hours.`
                  : `We've logged your free trial request. An admin will activate your tenant trial for ${email.trim()} — usually within 24 hours — giving you the Experience Editor and 3D World Editor for 7 days.`}
              </p>
              <p className="mt-3 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs text-amber-200">
                Make sure you've completed the PayNow transfer with your email in the comment, or we can't match your payment.
              </p>
              <Button className="mt-6" onClick={onClose}>Done</Button>
            </div>
          ) : (
            <>
              {/* Step 1 — choose what you're buying */}
              {isTicket ? (
                <div className="space-y-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">1 · Choose your package</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {PRESALE_TICKET_PACKAGES.map((entry) => (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => setSelectedId(entry.id)}
                        className={`rounded-xl border p-3 text-left transition ${selectedId === entry.id ? "border-primary bg-primary/10" : "border-white/10 bg-background/40 hover:border-white/20"}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold">{entry.label}</span>
                          {entry.highlight && <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary">Popular</span>}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{entry.tagline}</p>
                        <p className="mt-1.5 text-sm font-bold text-primary">
                          {fmt(entry.price, entry.currency)}
                          {entry.regularPrice && <span className="ml-1.5 text-[11px] font-normal text-muted-foreground line-through">{entry.currency} {entry.regularPrice}</span>}
                        </p>
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-muted-foreground">Quantity</label>
                    <Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-24" />
                    <span className="ml-auto text-sm">Total: <strong className="text-primary">{fmt(amount, pkg.currency)}</strong></span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-center gap-2">
                    <Rocket className="h-5 w-5 text-primary" />
                    <p className="font-heading text-lg font-bold">{TENANT_TRIAL_OFFER.label}</p>
                    <span className="ml-auto rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-300">7 days free</span>
                  </div>
                  <ul className="space-y-1.5">
                    {TENANT_TRIAL_OFFER.includes.map((item) => (
                      <li key={item} className="flex gap-2 text-sm text-foreground/85"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" /> {item}</li>
                    ))}
                  </ul>
                  <div className="rounded-xl border border-white/10 bg-background/40 p-3 text-xs text-muted-foreground">
                    <p className="mb-1 font-semibold text-foreground">After the free trial</p>
                    <ul className="space-y-0.5">
                      {TENANT_TRIAL_OFFER.afterTrial.map((item) => <li key={item}>• {item}</li>)}
                    </ul>
                    <p className="mt-2 text-[11px]">{TENANT_TRIAL_OFFER.afterTrialNote}</p>
                  </div>
                </div>
              )}

              {/* Step 2 — payment instructions (tickets) */}
              {isTicket && (
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">2 · Pay by PayNow</p>
                  <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 to-transparent p-4">
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-background/50 px-3 py-2">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">PayNow UEN</p>
                        <p className="font-mono text-lg font-bold tracking-wide">{PAYNOW.uen}</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={copyUen}>
                        {copied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
                      </Button>
                    </div>
                    <ol className="mt-3 space-y-1.5">
                      {PURCHASE_INSTRUCTIONS.map((line, index) => (
                        <li key={index} className="flex gap-2 text-xs text-foreground/85">
                          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[9px] font-bold text-primary">{index + 1}</span>
                          {line}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}

              {/* Step 3 — your details */}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">{isTicket ? "3 · Confirm your details" : "Your details"}</p>
                {!isTicket && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input placeholder="Organization / museum name" value={organization} onChange={(e) => setOrganization(e.target.value)} />
                    <Input placeholder="Your name" value={contactName} onChange={(e) => setContactName(e.target.value)} />
                  </div>
                )}
                <Input
                  type="email"
                  placeholder={isTicket ? "Email (must match your PayNow comment)" : "Email for your trial access"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  Access is granted manually by an admin after {isTicket ? "your payment is verified" : "we review your request"} — usually within 24 hours.
                </p>
              </div>

              {status && <p className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs text-rose-200">{status}</p>}
            </>
          )}
        </div>

        {!done && (
          <footer className="flex items-center justify-between gap-2 border-t border-white/10 p-4">
            <Button variant="ghost" onClick={onClose}><ArrowLeft className="h-4 w-4" /> Cancel</Button>
            <Button onClick={submit} disabled={submitting || !emailValid} className="bg-primary text-primary-foreground">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : isTicket ? <Ticket className="h-4 w-4" /> : <Rocket className="h-4 w-4" />}
              {isTicket ? `I've paid — confirm order` : "Start free trial"}
            </Button>
          </footer>
        )}
      </div>
    </div>
  );
}
