import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Image, MonitorPlay, QrCode, Sparkles, UploadCloud } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { supabase } from "@/lib/supabase";
import PlatformShell from "@/components/platform/PlatformShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { checkSubmitAllowed, honeypotInputProps, isHoneypotTripped, recordSubmit } from "@/lib/form-protection";
import { buildPayNowQrDataUrl } from "@/lib/paynow-qr";
import { toast } from "sonner";

// Platform UEN used for the PayNow fallback when Stripe isn't configured.
const PLATFORM_UEN = "201722486D";
const PLAN_PRICE_SGD = 300;
const TRIAL_DAYS = 7;

export default function BecomeTenant() {
  const [searchParams] = useSearchParams();
  const checkoutResult = searchParams.get("checkout");

  const [form, setForm] = useState({ organization: "", contact_name: "", email: "", museum_type: "", message: "" });
  const [honeypot, setHoneypot] = useState("");
  const [step, setStep] = useState("form"); // form | checkout
  const [inquiryId, setInquiryId] = useState(null);
  const [reference, setReference] = useState(null);
  const [payNowQr, setPayNowQr] = useState(null);
  const [checkoutError, setCheckoutError] = useState(null);

  const { data: configs = [] } = useQuery({
    queryKey: ["become-tenant-page-config"],
    queryFn: () => base44.entities.PlatformPageConfig.filter({ pageKey: "become_a_tenant", ownershipScope: "platform", status: "published" }, "-lastPublishedAt", 1),
    initialData: [],
  });
  const hero = configs[0]?.sections?.find((section) => section.sectionKey === "hero") || {};
  const videoUrl = hero.backgroundVideoUrl || "https://res.cloudinary.com/dwc4hamrl/video/upload/q_auto/f_auto/v1780431698/grok_video_2026-06-03-04-21-15_eo9sqz.mp4";

  const mutation = useMutation({
    // Plain insert (no read-back): inquiry reads are admin-only under RLS, so
    // the entity wrapper's insert().select() would fail for visitors. The id
    // is generated client-side so we can carry it into the checkout step.
    mutationFn: async (data) => {
      const id = crypto.randomUUID();
      const { error } = await supabase
        .from("tenant_inquiries")
        .insert({ ...data, id, status: "new", submitted_at: new Date().toISOString() });
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      recordSubmit("tenant_inquiry");
      setInquiryId(id);
      setReference(`SCV-${id.slice(0, 8).toUpperCase()}`);
      setStep("checkout");
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const data = await base44.functions.invoke("franchise-checkout", { inquiry_id: inquiryId, origin: window.location.origin });
      if (!data) throw new Error("Payments are not available right now.");
      if (data.error) throw new Error(data.error);
      if (data.url) {
        window.location.href = data.url;
        return data;
      }
      if (data.stripe_configured === false) {
        const dataUrl = await buildPayNowQrDataUrl({ uen: PLATFORM_UEN, amount: PLAN_PRICE_SGD, reference });
        setPayNowQr(dataUrl);
        return data;
      }
      return data;
    },
    onError: (error) => setCheckoutError(error.message || "Something went wrong starting the payment."),
  });

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const submit = (event) => {
    event.preventDefault();
    if (isHoneypotTripped(honeypot)) return;
    const guard = checkSubmitAllowed("tenant_inquiry");
    if (!guard.allowed) {
      toast.error(guard.message);
      return;
    }
    mutation.mutate(form);
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
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover opacity-35"
          src={videoUrl}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/88 via-background/68 to-background/35" />
        <div className="relative z-10">
          {checkoutResult === "success" && (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
              <CheckCircle2 className="h-4 w-4 shrink-0" /> Payment confirmed — your 7-day trial is active. We'll be in touch to set up your tenant space.
            </div>
          )}
          {checkoutResult === "cancelled" && (
            <div className="mb-6 rounded-xl border border-border/40 bg-card/60 px-4 py-3 text-sm text-muted-foreground">
              Checkout was cancelled — you can restart it any time from your application below.
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
            {TRIAL_DAYS}-day free trial, then SGD ${PLAN_PRICE_SGD} for 6 months — Early Bird price
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

        <div className="relative z-10 rounded-3xl border border-border/40 bg-card/50 p-6 shadow-2xl backdrop-blur-sm">
          {step === "form" && (
            <form onSubmit={submit} className="space-y-4">
              <input {...honeypotInputProps()} value={honeypot} onChange={(event) => setHoneypot(event.target.value)} />
              <div>
                <h2 className="font-display text-2xl font-bold">Apply to become a franchisee</h2>
                <p className="mt-2 text-sm text-muted-foreground">{TRIAL_DAYS}-day free trial, then SGD ${PLAN_PRICE_SGD} for 6 months (early bird). Tell us about your museum to get started.</p>
              </div>
              <Input required placeholder="Organization / museum name" value={form.organization} onChange={(e) => update("organization", e.target.value)} />
              <Input required placeholder="Contact name" value={form.contact_name} onChange={(e) => update("contact_name", e.target.value)} />
              <Input required type="email" placeholder="Email" value={form.email} onChange={(e) => update("email", e.target.value)} />
              <Input placeholder="Museum type / collection focus" value={form.museum_type} onChange={(e) => update("museum_type", e.target.value)} />
              <Textarea className="min-h-32" placeholder="Tell us what you want to launch" value={form.message} onChange={(e) => update("message", e.target.value)} />
              {mutation.isError && (
                <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                  Something went wrong sending your application — please try again.
                </p>
              )}
              <Button type="submit" disabled={mutation.isPending} className="w-full bg-primary text-primary-foreground">
                {mutation.isPending ? "Sending..." : `Continue to ${TRIAL_DAYS}-day trial`}
              </Button>
            </form>
          )}

          {step === "checkout" && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-2xl font-bold">Application received</h2>
                <p className="mt-2 text-sm text-muted-foreground">Reference <span className="font-mono text-foreground">{reference}</span> — start your trial below.</p>
              </div>

              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <p className="font-display text-lg font-bold">Franchisee — Early Bird</p>
                <p className="mt-1 text-sm text-muted-foreground">{TRIAL_DAYS}-day free trial, then <span className="font-semibold text-foreground">SGD ${PLAN_PRICE_SGD}</span> for 6 months.</p>
                <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                  {benefits.map((item) => (
                    <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> {item}</li>
                  ))}
                </ul>
              </div>

              {checkoutError && (
                <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">{checkoutError}</p>
              )}

              {!payNowQr && (
                <Button
                  onClick={() => checkoutMutation.mutate()}
                  disabled={checkoutMutation.isPending}
                  className="w-full bg-primary text-primary-foreground"
                >
                  {checkoutMutation.isPending ? "Starting checkout..." : `Start trial — pay SGD $${PLAN_PRICE_SGD} after ${TRIAL_DAYS} days`}
                </Button>
              )}

              {payNowQr && (
                <div className="space-y-3 rounded-2xl border border-border/40 bg-card/60 p-4 text-center">
                  <p className="flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
                    <QrCode className="h-3.5 w-3.5" /> Pay with PayNow
                  </p>
                  <img src={payNowQr} alt="PayNow QR code" className="mx-auto h-48 w-48 rounded-xl border border-border/40 bg-white p-2" />
                  <p className="text-sm text-foreground">SGD ${PLAN_PRICE_SGD.toFixed(2)} to UEN {PLATFORM_UEN}</p>
                  <p className="text-xs text-muted-foreground">
                    Scan with your banking app, confirm the SGD ${PLAN_PRICE_SGD} amount, and include reference <span className="font-mono text-foreground">{reference}</span>. We'll activate your {TRIAL_DAYS}-day trial and follow up by email once payment is received.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </PlatformShell>
  );
}
