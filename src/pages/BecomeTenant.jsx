import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Copy, Check, Image, Loader2, MonitorPlay, Sparkles, UploadCloud } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { supabase } from "@/lib/supabase";
import PlatformShell from "@/components/platform/PlatformShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadPaymentProof } from "@/lib/upload";
import { PAYNOW, PURCHASE_INSTRUCTIONS, TENANT_TRIAL_OFFER } from "@/lib/presale-content";

const TRIAL_DAYS = 7;

export default function BecomeTenant() {
  const [searchParams] = useSearchParams();
  const checkoutResult = searchParams.get("checkout");

  const [form, setForm] = useState({ organization: "", contact_name: "", email: "" });
  const [proofFile, setProofFile] = useState(null);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const { data: configs = [] } = useQuery({
    queryKey: ["become-tenant-page-config"],
    queryFn: () => base44.entities.PlatformPageConfig.filter({ pageKey: "become_a_tenant", ownershipScope: "platform", status: "published" }, "-lastPublishedAt", 1),
    initialData: [],
  });
  const hero = configs[0]?.sections?.find((section) => section.sectionKey === "hero") || {};
  const videoUrl = hero.backgroundVideoUrl || "https://res.cloudinary.com/dwc4hamrl/video/upload/q_auto/f_auto/v1780431698/grok_video_2026-06-03-04-21-15_eo9sqz.mp4";

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const copyUen = async () => {
    try {
      await navigator.clipboard.writeText(PAYNOW.uen);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setErrorMsg("Couldn't copy — the UEN is " + PAYNOW.uen);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
    if (!emailValid) { setErrorMsg("Please enter a valid email address."); return; }
    if (!proofFile) { setErrorMsg("Please upload your PayNow screenshot before submitting."); return; }
    setSubmitting(true);
    try {
      const uploaded = await uploadPaymentProof(proofFile);
      const { error } = await supabase.from("payment_proofs").insert({
        kind: "tenant_trial",
        item_id: "tenant_trial",
        item_label: TENANT_TRIAL_OFFER.label,
        email: form.email.trim(),
        organization: form.organization.trim() || null,
        contact_name: form.contact_name.trim() || null,
        amount: 0,
        currency: "SGD",
        quantity: 1,
        screenshot_path: uploaded.path,
        status: "pending",
        notes: `Tenant trial application via Become a Tenant page. PayNow to UEN ${PAYNOW.uen}. Activate trial role for ${form.email.trim()}.`,
      });
      if (error) throw error;
      setDone(true);
    } catch (err) {
      setErrorMsg(err?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const benefits = [
    "Your own virtual museum space inside SCAVerse.",
    "Upload images, videos, documents, URLs, descriptions, room details, and stories.",
    "Control your public museum from your tenant admin panel.",
    "SCAVerse handles rooms, media display, walkthroughs, and visitor pages.",
  ];

  return (
    <PlatformShell>
      <section className="relative mx-auto grid max-w-7xl gap-10 overflow-hidden px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
        <video autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover opacity-35" src={videoUrl} />
        <div className="absolute inset-0 bg-gradient-to-br from-background/88 via-background/68 to-background/35" />
        <div className="relative z-10">
          {checkoutResult === "success" && (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
              <CheckCircle2 className="h-4 w-4 shrink-0" /> Payment confirmed — your 7-day trial is active. We'll be in touch to set up your tenant space.
            </div>
          )}
          <p className="font-display text-[10px] font-medium uppercase tracking-[0.5em] text-primary/70">{hero.eyebrow || "Be a franchisee"}</p>
          <h1 className="mt-5 font-heading text-4xl font-semibold leading-[0.95] text-foreground sm:text-6xl">
            {hero.title || "Open your own SCAVerse museum, early-bird priced."}
          </h1>
          <p className="mt-5 font-body text-base font-light leading-relaxed text-muted-foreground">
            {hero.subtitle || "SCAVerse is for museum owners, cultural groups, curators, schools, galleries, heritage operators, and private collectors who want a visitor-ready virtual museum experience."}
          </p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {TRIAL_DAYS}-day free trial — then SGD $300 for 6 months (early bird)
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[UploadCloud, Image, MonitorPlay].map((Icon, index) => (
              <div key={index} className="p-0">
                <Icon className="mb-3 h-5 w-5 text-primary" />
                <p className="text-sm text-muted-foreground">{["Upload content", "Display media", "Guide visitors"][index]}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 space-y-3">
            {benefits.map((item) => (
              <div key={item} className="flex gap-3 text-sm text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {item}
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/tenant-login"><Button variant="outline">Already a tenant?</Button></Link>
            <Link to="/virtual-experience"><Button variant="ghost">See live museums <ArrowRight className="h-4 w-4" /></Button></Link>
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="relative z-10 rounded-3xl border border-border/40 bg-card/50 p-6 shadow-2xl backdrop-blur-sm">
          {done ? (
            <div className="flex flex-col items-center py-10 text-center">
              <CheckCircle2 className="mb-4 h-12 w-12 text-emerald-400" />
              <h2 className="font-display text-2xl font-bold">Screenshot received!</h2>
              <p className="mt-3 max-w-xs text-sm text-muted-foreground">
                We'll verify your PayNow transfer and activate your {TRIAL_DAYS}-day trial for <span className="font-semibold text-foreground">{form.email}</span> — usually within 24 hours.
              </p>
              <p className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs text-amber-200">
                Make sure your email address appears in the PayNow comment, or we can't match your payment.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <div>
                <h2 className="font-display text-2xl font-bold">Pay by PayNow to get started</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {TRIAL_DAYS} days free — no payment now. After the trial: SGD $300 for 6 months. Transfer when you're ready to continue.
                </p>
              </div>

              {/* UEN block */}
              <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 to-transparent p-4 space-y-3">
                <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-background/50 px-3 py-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">PayNow UEN</p>
                    <p className="font-mono text-lg font-bold tracking-wide">{PAYNOW.uen}</p>
                    <p className="text-[10px] text-muted-foreground">{PAYNOW.payeeName}</p>
                  </div>
                  <Button type="button" size="sm" variant="outline" onClick={copyUen}>
                    {copied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy UEN</>}
                  </Button>
                </div>
                <ol className="space-y-1.5">
                  {PURCHASE_INSTRUCTIONS.map((line, i) => (
                    <li key={i} className="flex gap-2 text-xs text-foreground/85">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[9px] font-bold text-primary">{i + 1}</span>
                      {line}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Screenshot upload */}
              <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/[0.04] p-4 space-y-2">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <UploadCloud className="h-4 w-4 text-primary" /> Upload your payment screenshot
                </p>
                <p className="text-xs text-muted-foreground">Take a screenshot of your completed PayNow transfer and upload it here.</p>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Button asChild type="button" size="sm" variant="outline">
                    <label className="cursor-pointer">
                      <UploadCloud className="h-3.5 w-3.5" /> {proofFile ? "Change screenshot" : "Choose screenshot"}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => setProofFile(e.target.files?.[0] || null)} />
                    </label>
                  </Button>
                  {proofFile
                    ? <span className="inline-flex items-center gap-1.5 text-xs text-emerald-300"><Check className="h-3.5 w-3.5" /> {proofFile.name}</span>
                    : <span className="text-xs text-amber-300">Required — screenshot of your transfer</span>}
                </div>
              </div>

              {/* Your details */}
              <div className="space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Your details</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input placeholder="Organization / museum name" value={form.organization} onChange={(e) => update("organization", e.target.value)} />
                  <Input placeholder="Your name" value={form.contact_name} onChange={(e) => update("contact_name", e.target.value)} />
                </div>
                <Input required type="email" placeholder="Email (must match your PayNow comment)" value={form.email} onChange={(e) => update("email", e.target.value)} />
              </div>

              {errorMsg && <p className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs text-rose-200">{errorMsg}</p>}

              <Button type="submit" disabled={submitting || !form.email || !proofFile} className="w-full bg-primary text-primary-foreground">
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : <><UploadCloud className="h-4 w-4" /> Submit payment screenshot</>}
              </Button>
            </form>
          )}
        </div>
      </section>
    </PlatformShell>
  );
}
