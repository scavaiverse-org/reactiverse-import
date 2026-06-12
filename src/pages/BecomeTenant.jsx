import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Image, MonitorPlay, UploadCloud } from "lucide-react";
import { base44 } from "@/api/base44Client";
import PlatformShell from "@/components/platform/PlatformShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { checkSubmitAllowed, honeypotInputProps, isHoneypotTripped, recordSubmit } from "@/lib/form-protection";
import { toast } from "sonner";

export default function BecomeTenant() {
  const [form, setForm] = useState({ organization: "", contact_name: "", email: "", museum_type: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  const { data: configs = [] } = useQuery({
    queryKey: ["become-tenant-page-config"],
    queryFn: () => base44.entities.PlatformPageConfig.filter({ pageKey: "become_a_tenant", ownershipScope: "platform", status: "published" }, "-lastPublishedAt", 1),
    initialData: [],
  });
  const hero = configs[0]?.sections?.find((section) => section.sectionKey === "hero") || {};
  const videoUrl = hero.backgroundVideoUrl || "https://res.cloudinary.com/dwc4hamrl/video/upload/q_auto/f_auto/v1780431698/grok_video_2026-06-03-04-21-15_eo9sqz.mp4";

  const mutation = useMutation({
    mutationFn: (data) => base44.entities.TenantInquiry.create({ ...data, status: "new", submitted_at: new Date().toISOString() }),
    onSuccess: () => {
      recordSubmit("tenant_inquiry");
      setSubmitted(true);
    },
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
          <p className="font-display text-[10px] font-medium uppercase tracking-[0.5em] text-primary/70">{hero.eyebrow || "Become a tenant / franchisee"}</p>
          <h1 className="mt-5 font-heading text-4xl font-semibold leading-[0.95] text-foreground sm:text-6xl">
            {hero.title || "Launch your own virtual museum without building software."}
          </h1>
          <p className="mt-5 font-body text-base font-light leading-relaxed text-muted-foreground">
            {hero.subtitle || "SCAVerse is for museum owners, cultural groups, curators, schools, galleries, heritage operators, and private collectors who want a visitor-ready virtual museum experience."}
          </p>

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
          {submitted ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
              <CheckCircle2 className="mb-4 h-10 w-10 text-primary" />
              <h2 className="font-display text-3xl font-bold">Enquiry received</h2>
              <p className="mt-3 text-sm text-muted-foreground">The platform owner can follow up with your tenant/franchisee request.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <input {...honeypotInputProps()} value={honeypot} onChange={(event) => setHoneypot(event.target.value)} />
              <div>
                <h2 className="font-display text-2xl font-bold">Apply / Enquire</h2>
                <p className="mt-2 text-sm text-muted-foreground">Request a demo or contact the platform owner.</p>
              </div>
              <Input required placeholder="Organization / museum name" value={form.organization} onChange={(e) => update("organization", e.target.value)} />
              <Input required placeholder="Contact name" value={form.contact_name} onChange={(e) => update("contact_name", e.target.value)} />
              <Input required type="email" placeholder="Email" value={form.email} onChange={(e) => update("email", e.target.value)} />
              <Input placeholder="Museum type / collection focus" value={form.museum_type} onChange={(e) => update("museum_type", e.target.value)} />
              <Textarea className="min-h-32" placeholder="Tell us what you want to launch" value={form.message} onChange={(e) => update("message", e.target.value)} />
              <Button type="submit" disabled={mutation.isPending} className="w-full bg-primary text-primary-foreground">
                {mutation.isPending ? "Sending..." : "Request Demo / Contact Platform Owner"}
              </Button>
            </form>
          )}
        </div>
      </section>
    </PlatformShell>
  );
}