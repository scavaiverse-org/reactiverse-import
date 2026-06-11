import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowLeft, ArrowRight, Bot, Building2, CalendarDays, CheckCircle2, Crown, MapPin, Monitor, Package, School, ShieldCheck, ShoppingBag, Sparkles, Store, Ticket, Users } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import TenantNavbar from "@/components/tenant/TenantNavbar";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { museumPath } from "@/lib/domain-registry";

const fallbackTickets = [
  { id: "virtual_general", label: "Virtual General", price: 18, currency: "SGD", access_mode: "virtual", icon: Monitor, features: ["Virtual walkthrough", "AI support", "Digital access"] },
  { id: "virtual_premium", label: "Virtual Premium", price: 38, currency: "SGD", access_mode: "virtual", icon: Sparkles, features: ["Premium content", "Priority AI docent", "Resource library"] },
  { id: "physical_general", label: "Physical Visit", price: 25, currency: "SGD", access_mode: "physical", icon: MapPin, features: ["Museum entry", "Audio guide", "Digital companion"] },
  { id: "physical_vip", label: "Physical VIP", price: 68, currency: "SGD", access_mode: "physical", icon: Crown, features: ["VIP entry", "Guided tour", "Premium bundle"] },
  { id: "family", label: "Family Pack", price: 88, currency: "SGD", access_mode: "hybrid", icon: Users, features: ["Family access", "Shared activities", "Flexible pacing"] },
  { id: "group", label: "Group / School", price: 15, currency: "SGD", access_mode: "hybrid", icon: School, features: ["10+ visitors", "Coordinator support", "Learning materials"] },
  { id: "corporate", label: "Corporate", price: null, currency: "SGD", access_mode: "hybrid", icon: Building2, features: ["Custom package", "Private briefing", "Invoice-ready enquiry"] },
];

const stages = [
  { key: "tickets", label: "Tickets" },
  { key: "tickets-2", label: "Compare" },
  { key: "tickets-3", label: "Plan" },
  { key: "tickets-4", label: "Add-ons" },
  { key: "tickets-5", label: "Confirm" },
];

const fallbackAddOns = [
  { id: "guided_tour", title: "Guided Tour Upgrade", price: 20, icon: MapPin, desc: "Add a guided route with curated narration." },
  { id: "ai_docent", title: "AI Docent Priority", price: 12, icon: Bot, desc: "Priority support for ticket, access, and exhibit questions." },
  { id: "premium_content", title: "Premium Content Pass", price: 15, icon: Sparkles, desc: "Unlock extended media and digital resources." },
  { id: "family_pack", title: "Family Activity Pack", price: 18, icon: Users, desc: "Family-friendly prompts and shared activities." },
  { id: "merch_bundle", title: "Merchandise Bundle", price: 35, icon: ShoppingBag, desc: "Ticket-linked cultural goods and gifts." },
  { id: "event_access", title: "Event Access", price: 28, icon: CalendarDays, desc: "Add limited cultural event access when available." },
];

function storageKey(tenantId) {
  return `scaverse_ticket_journey_${tenantId || "default"}`;
}

function readJourney(tenantId) {
  const raw = localStorage.getItem(storageKey(tenantId));
  return raw ? JSON.parse(raw) : {};
}

function saveJourney(tenantId, patch) {
  const next = { ...readJourney(tenantId), ...patch, updated_at: new Date().toISOString() };
  localStorage.setItem(storageKey(tenantId), JSON.stringify(next));
  return next;
}

function todayDateInput() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function isValidVisitDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return false;
  const today = new Date(`${todayDateInput()}T00:00:00`);
  const max = new Date(today);
  max.setFullYear(max.getFullYear() + 5);
  return date >= today && date <= max;
}

function hasValidTicketSelection(reservation = {}) {
  const ticketValue = String(reservation.ticket_type || reservation.ticket_id || reservation.ticket_label || "").trim().toLowerCase();
  return !!ticketValue && !["not selected", "none", "null", "undefined", "select ticket"].includes(ticketValue);
}

function isAddonCatalogItem(item = {}) {
  const fields = [item.id, item.type, item.category, item.product_type, item.item_type, item.label, item.title, item.name].join(" ").toLowerCase();
  if (item.is_addon || item.isAddon || item.addon === true || item.upgrade === true) return true;
  return /add[-\s]?on|upgrade|hologram|\bxr\b|workshop|guided tour|premium content|ai docent|merch|bundle|event access|activity pack/.test(fields);
}

function isMainTicketCatalogItem(item = {}) {
  if (!item || item.enabled === false || isAddonCatalogItem(item)) return false;
  if (item.is_ticket || item.isTicket || item.ticket === true || item.main_ticket === true) return true;
  if (["virtual", "physical", "hybrid"].includes(String(item.access_mode || "").toLowerCase())) return true;
  const fields = [item.id, item.type, item.category, item.product_type, item.item_type, item.label, item.title, item.name].join(" ").toLowerCase();
  return /ticket|admission|entry|pass|general|visitor|family|school|corporate|group|vip|virtual access|physical visit/.test(fields);
}

function normalizeAddon(item = {}, index = 0, currency = "SGD") {
  const fallback = fallbackAddOns.find((base) => base.id === item.id || base.id === item.type) || fallbackAddOns[index % fallbackAddOns.length] || fallbackAddOns[0];
  const numericPrice = typeof item.price === "number" ? item.price : Number(String(item.price || "").replace(/[^0-9.]/g, "")) || fallback?.price || 0;
  return {
    ...fallback,
    ...item,
    id: item.id || item.type || item.key || `addon_${index + 1}`,
    title: item.title || item.label || item.name || fallback?.title || `Add-on ${index + 1}`,
    desc: item.desc || item.description || item.body || fallback?.desc || "Optional experience upgrade.",
    price: numericPrice,
    currency: item.currency || currency,
    icon: typeof item.icon === "function" ? item.icon : fallback?.icon || ShoppingBag,
  };
}

function useTickets() {
  const { tenant } = useActiveTenant();
  const { data: moduleConfigs = [], isLoading } = useQuery({
    queryKey: ["tenant-ticket-module-config", tenant?.id],
    queryFn: () => tenant ? base44.entities.ModuleConfig.filter({ tenant_id: tenant.id, module_key: "ticketing" }) : Promise.resolve([]),
    enabled: !!tenant?.id,
    initialData: [],
  });
  const config = moduleConfigs[0]?.config_json || {};
  const currency = config.currency || "SGD";
  const configuredTicketTypes = Array.isArray(config.ticket_types) ? config.ticket_types.filter((item) => item.enabled !== false) : [];
  const mainTicketSource = configuredTicketTypes.length ? configuredTicketTypes.filter(isMainTicketCatalogItem) : fallbackTickets;
  const tickets = (mainTicketSource.length ? mainTicketSource : fallbackTickets).map((item) => {
    const fallback = fallbackTickets.find((base) => base.id === item.id || base.id === item.type) || fallbackTickets[0];
    const numericPrice = typeof item.price === "number" ? item.price : Number(String(item.price || "").replace(/[^0-9.]/g, "")) || null;
    return { ...fallback, ...item, id: item.id || item.type || fallback.id, price: numericPrice, currency: currency || item.currency || fallback.currency || "SGD", features: item.features || fallback.features };
  });
  const configuredAddOns = [
    ...(Array.isArray(config.add_ons) ? config.add_ons : []),
    ...(Array.isArray(config.addons) ? config.addons : []),
    ...(Array.isArray(config.experience_upgrades) ? config.experience_upgrades : []),
    ...(Array.isArray(config.upgrades) ? config.upgrades : []),
    ...configuredTicketTypes.filter(isAddonCatalogItem),
  ].filter((item) => item.enabled !== false).filter((item, index, list) => {
    const key = String(item.id || item.type || item.key || item.title || item.label || item.name || index).toLowerCase();
    return list.findIndex((candidate, candidateIndex) => String(candidate.id || candidate.type || candidate.key || candidate.title || candidate.label || candidate.name || candidateIndex).toLowerCase() === key) === index;
  });
  const addOns = (configuredAddOns.length ? configuredAddOns : fallbackAddOns).map((item, index) => normalizeAddon(item, index, currency));
  return { tenant, tickets, addOns, currency, isLoading };
}

function StageShell({ activeStage, eyebrow, title, body, children }) {
  const { tenantSlug } = useParams();
  const { tenant } = useActiveTenant();
  const slug = tenantSlug || tenant?.slug || "asian-operatic-museum";
  return (
    <main className="min-h-screen bg-background text-foreground">
      <TenantNavbar />
      <section className="mx-auto max-w-7xl px-4 pb-20 pt-32 sm:px-6">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-display text-[10px] font-medium uppercase tracking-[0.5em] text-primary/70">{tenant?.name || "Museum"} · {eyebrow}</p>
            <h1 className="mt-3 font-heading text-4xl font-semibold leading-[0.95] md:text-6xl">{title}</h1>
            <p className="mt-4 max-w-3xl font-body text-sm font-light leading-relaxed text-muted-foreground">{body}</p>
          </div>
          <Button asChild variant="outline"><Link to={museumPath(slug, "home")}><ArrowLeft className="h-4 w-4" /> Museum Home</Link></Button>
        </div>
        <div className="mb-8 grid gap-2 sm:grid-cols-5">
          {stages.map((stage, index) => <div key={stage.key} className={`rounded-full border px-3 py-2 text-center font-display text-xs font-semibold uppercase tracking-[0.08em] ${stage.key === activeStage ? "border-primary bg-primary text-primary-foreground" : "border-border/40 bg-card/40 text-muted-foreground"}`}>{index + 1}. {stage.label}</div>)}
        </div>
        {children}
      </section>
    </main>
  );
}

function ActionLink({ to, children, variant = "default" }) {
  return <Button asChild variant={variant} className="gap-2"><Link to={to}>{children}</Link></Button>;
}

export function TicketGateway() {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { tenant, tickets, isLoading } = useTickets();
  const slug = tenantSlug || tenant?.slug || "asian-operatic-museum";
  const [selectedId, setSelectedId] = useState(tickets[0]?.id || "virtual_general");
  const [form, setForm] = useState({ visitor_name: "", visitor_email: "", quantity: 1, visit_date: "", accessibility_needs: "", group_type: "individual", notes: "" });
  useEffect(() => {
    if (tickets.length && !tickets.some((ticket) => ticket.id === selectedId)) setSelectedId(tickets[0].id);
  }, [tickets, selectedId]);
  const selected = tickets.find((ticket) => ticket.id === selectedId) || tickets[0];
  const total = selected?.price ? selected.price * Number(form.quantity || 1) : null;

  const submitReservation = async () => {
    if (!form.visitor_name || !form.visitor_email) {
      toast.error("Please add your name and email to reserve a ticket.");
      return;
    }
    if (!isValidVisitDate(form.visit_date)) {
      toast.error("Please select a valid visit date.");
      return;
    }
    const payload = {
      tenant_id: tenant?.id,
      tenant_name: tenant?.name,
      ticket_type: selected.id,
      visitor_name: form.visitor_name,
      visitor_email: form.visitor_email,
      quantity: Number(form.quantity || 1),
      total_price: total,
      currency: selected.currency || "SGD",
      status: "pending",
      visit_date: form.visit_date || null,
      notes: form.notes,
      access_mode: selected.access_mode,
      ticket_addons: [],
      accessibility_needs: form.accessibility_needs,
      group_type: form.group_type,
      confirmation_stage: "reservation_created",
      source_step: "tickets",
      commerce_interest: false,
      ai_help_used: false,
    };
    try {
      const created = await base44.entities.Ticket.create(payload);
      saveJourney(tenant?.id, { reservation: { ...payload, id: created?.id, ticket_label: selected.label } });
      base44.entities.AnalyticsEvent.create({ tenant_id: tenant?.id, tenant_name: tenant?.name, event_type: "ticket_reservation_created", source_page: "tickets", event_data: { ticket_type: selected.id, quantity: payload.quantity, source_step: "tickets" } }).catch(() => {});
      navigate(museumPath(slug, "tickets-5"));
    } catch (error) {
      console.error("[tickets] reservation failed:", error);
      toast.error("We couldn't save your reservation. Please try again or contact the museum.");
    }
  };

  return (
    <StageShell activeStage="tickets" eyebrow="Purchase Tickets" title="Choose your museum access." body="Reserve a ticket first, then compare access types, plan your visit, add upgrades, and continue to confirmation.">
      {isLoading && <p className="mb-4 text-xs text-muted-foreground">Loading tenant ticket settings…</p>}
      <div className="mb-4 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
        Select one main ticket type. Choosing another ticket will replace your previous selection.
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="grid gap-4 lg:col-span-2 sm:grid-cols-2">
          {tickets.map((ticket, index) => {
            const Icon = ticket.icon || Ticket;
            const active = selectedId === ticket.id;
            return <motion.button key={ticket.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} onClick={() => setSelectedId(ticket.id)} className={`rounded-3xl border p-5 text-left backdrop-blur-sm transition-all duration-300 ${active ? "border-primary bg-primary/10 ring-1 ring-primary/30" : "border-border/40 bg-card/50 hover:border-primary/40 hover:bg-card/80"}`} aria-pressed={active}><div className="mb-4 flex items-center justify-between gap-3"><Icon className="h-6 w-6 text-primary" /><span className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${active ? "border-primary/30 bg-primary text-primary-foreground" : "border-border/50 text-muted-foreground"}`}>{active ? "Selected" : "Select"}</span></div><h3 className="font-heading text-xl font-semibold">{ticket.label}</h3><p className="mt-2 font-mono text-primary">{ticket.price ? `${ticket.currency} ${ticket.price}` : "Custom quote"}</p><ul className="mt-4 space-y-2 text-xs text-muted-foreground">{(ticket.features || []).map((feature) => <li key={feature} className="flex gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-primary" />{feature}</li>)}</ul></motion.button>;
          })}
        </div>
        <div className="rounded-3xl border border-border/40 bg-card/50 p-6 backdrop-blur-sm">
          <h2 className="font-heading text-2xl font-semibold">Reservation details</h2>
          <div className="mt-5 space-y-4">
            <label className="space-y-2"><Label>Visitor name</Label><Input value={form.visitor_name} onChange={(e) => setForm({ ...form, visitor_name: e.target.value })} /></label>
            <label className="space-y-2"><Label>Email</Label><Input type="email" value={form.visitor_email} onChange={(e) => setForm({ ...form, visitor_email: e.target.value })} /></label>
            <div className="grid grid-cols-2 gap-3"><label className="space-y-2"><Label>Quantity</Label><Input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) || 1 })} /></label><label className="space-y-2"><Label>Visit date</Label><Input type="date" min={todayDateInput()} value={form.visit_date} onChange={(e) => setForm({ ...form, visit_date: e.target.value })} /></label></div>
            <label className="space-y-2"><Label>Group type</Label><select value={form.group_type} onChange={(e) => setForm({ ...form, group_type: e.target.value })} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"><option value="individual">Individual</option><option value="family">Family</option><option value="school">School</option><option value="corporate">Corporate</option></select><p className="text-xs leading-relaxed text-muted-foreground">Some group types may require staff confirmation or custom quote before payment.</p></label>
            <label className="space-y-2"><Label>Accessibility needs</Label><Textarea value={form.accessibility_needs} onChange={(e) => setForm({ ...form, accessibility_needs: e.target.value })} /></label>
            {total && <div className="flex items-center justify-between border-t border-white/10 pt-4"><span className="text-sm text-muted-foreground">Estimated total</span><span className="font-heading text-2xl font-semibold text-primary">{selected.currency} {total.toFixed(2)}</span></div>}
            <Button className="w-full" onClick={submitReservation}>Reserve Ticket <ArrowRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
      <div className="mt-8 flex flex-wrap gap-3"><ActionLink to={museumPath(slug, "tickets-2")} variant="outline">Compare Ticket Types</ActionLink><ActionLink to={museumPath(slug, "tickets-3")} variant="outline">Plan Visit</ActionLink><ActionLink to={museumPath(slug, "guide")} variant="outline">Ask About Tickets</ActionLink></div>
    </StageShell>
  );
}

export function TicketComparison() {
  const { tenantSlug } = useParams();
  const { tenant, tickets } = useTickets();
  const slug = tenantSlug || tenant?.slug || "asian-operatic-museum";
  return <StageShell activeStage="tickets-2" eyebrow="Ticket Comparison" title="Compare every access type." body="Review virtual, premium, physical, VIP, family, group, school, and corporate options before planning your visit."><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{tickets.map((ticket) => <div key={ticket.id} className="rounded-3xl border border-border/40 bg-card/50 p-6"><Badge className="mb-4 bg-primary/10 text-primary">{ticket.access_mode || "museum"}</Badge><h3 className="font-heading text-2xl font-semibold">{ticket.label}</h3><p className="mt-2 font-mono text-primary">{ticket.price ? `${ticket.currency} ${ticket.price}` : "Custom quote"}</p><ul className="mt-5 space-y-2 text-sm text-muted-foreground">{(ticket.features || []).map((feature) => <li key={feature} className="flex gap-2"><ShieldCheck className="h-4 w-4 text-primary" />{feature}</li>)}</ul></div>)}</div><div className="mt-8 flex flex-wrap gap-3"><ActionLink to={museumPath(slug, "tickets-3")}>Continue to Visit Planning <ArrowRight className="h-4 w-4" /></ActionLink><ActionLink to={museumPath(slug, "tickets")} variant="outline"><ArrowLeft className="h-4 w-4" /> Back to Ticket Options</ActionLink></div></StageShell>;
}

export function VisitPlanning() {
  const { tenantSlug } = useParams();
  const { tenant } = useTickets();
  const slug = tenantSlug || tenant?.slug || "asian-operatic-museum";
  const [plan, setPlan] = useState({ visit_date: "", quantity: 1, accessibility_needs: "", group_type: "individual", requirements: "" });
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const savePlan = async () => {
    if (plan.visit_date && !isValidVisitDate(plan.visit_date)) {
      setSaveStatus({ type: "error", message: "Please select a valid visit date." });
      toast.error("Please select a valid visit date.");
      return;
    }
    setSaving(true);
    setSaveStatus(null);
    try {
      saveJourney(tenant?.id, { plan });
      await base44.entities.VisitPlan.create({
        tenant_id: tenant?.id,
        tenant_name: tenant?.name,
        stage: "planning",
        visit_date: plan.visit_date || null,
        quantity: Number(plan.quantity || 1),
        group_type: plan.group_type,
        accessibility_needs: plan.accessibility_needs,
        requirements: plan.requirements,
      });
      setSaveStatus({ type: "success", message: "Planning details saved." });
      toast.success("Planning details saved.");
      setTimeout(() => setSaveStatus(null), 4500);
    } catch {
      setSaveStatus({ type: "error", message: "Could not save planning details. Please try again." });
      toast.error("Could not save planning details. Please try again.");
    } finally {
      setSaving(false);
    }
  };
  return <StageShell activeStage="tickets-3" eyebrow="Visit Planning" title="Plan your visit details." body="Add date, quantity, accessibility needs, and group/school/corporate requirements before choosing upgrades."><div className="grid gap-4 rounded-3xl border border-border/40 bg-card/50 p-6 md:grid-cols-2"><label className="space-y-2"><Label>Preferred date</Label><Input type="date" min={todayDateInput()} value={plan.visit_date} onChange={(e) => setPlan({ ...plan, visit_date: e.target.value })} /></label><label className="space-y-2"><Label>Quantity</Label><Input type="number" min="1" value={plan.quantity} onChange={(e) => setPlan({ ...plan, quantity: Number(e.target.value) || 1 })} /></label><label className="space-y-2"><Label>Group type</Label><select value={plan.group_type} onChange={(e) => setPlan({ ...plan, group_type: e.target.value })} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"><option value="individual">Individual</option><option value="family">Family</option><option value="school">School</option><option value="corporate">Corporate</option></select><p className="text-xs leading-relaxed text-muted-foreground">Some group types may require staff confirmation or custom quote before payment. All group types can choose optional add-ons on the next step.</p></label><label className="space-y-2"><Label>Accessibility needs</Label><Input value={plan.accessibility_needs} onChange={(e) => setPlan({ ...plan, accessibility_needs: e.target.value })} /></label><label className="space-y-2 md:col-span-2"><Label>School / group / corporate requirements</Label><Textarea value={plan.requirements} onChange={(e) => setPlan({ ...plan, requirements: e.target.value })} /></label>{saveStatus && <div className={`rounded-2xl border px-4 py-3 text-sm md:col-span-2 ${saveStatus.type === "success" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-destructive/30 bg-destructive/10 text-destructive-foreground"}`}>{saveStatus.message}</div>}<div className="flex flex-wrap gap-3 md:col-span-2"><Button onClick={savePlan} disabled={saving} variant="outline">{saving ? "Saving…" : saveStatus?.type === "success" ? "Saved" : "Save Planning Details"}</Button><ActionLink to={museumPath(slug, "tickets-4")}>Add Experience Upgrades <ArrowRight className="h-4 w-4" /></ActionLink><ActionLink to={museumPath(slug, "tickets-5")} variant="outline">Skip Add-ons</ActionLink></div></div></StageShell>;
}

export function AddOns() {
  const { tenantSlug } = useParams();
  const { tenant, addOns } = useTickets();
  const slug = tenantSlug || tenant?.slug || "asian-operatic-museum";
  const saved = useMemo(() => readJourney(tenant?.id), [tenant?.id]);
  const [selected, setSelected] = useState(saved.addons || []);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const toggle = (id) => setSelected((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);
  const saveAddons = async () => {
    const commerce_interest = selected.includes("merch_bundle");
    setSaving(true);
    setSaveStatus(null);
    try {
      saveJourney(tenant?.id, { addons: selected, commerce_interest });
      await base44.entities.VisitPlan.create({
        tenant_id: tenant?.id,
        tenant_name: tenant?.name,
        stage: "addons",
        addons: selected,
        commerce_interest,
      });
      setSaveStatus({ type: "success", message: "Add-ons saved." });
      toast.success("Add-ons saved.");
      setTimeout(() => setSaveStatus(null), 4500);
    } catch {
      setSaveStatus({ type: "error", message: "Could not save add-ons. Please try again." });
      toast.error("Could not save add-ons. Please try again.");
    } finally {
      setSaving(false);
    }
  };
  return <StageShell activeStage="tickets-4" eyebrow="Add-ons" title="Add optional experience upgrades." body="Add-ons are optional. All group types can use these add-ons unless staff later confirms a custom arrangement is needed."><div className="mb-4 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">Optional add-ons: select any upgrades you want, then save them before continuing.</div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{addOns.map((addon) => { const Icon = addon.icon; const active = selected.includes(addon.id); return <button key={addon.id} onClick={() => toggle(addon.id)} className={`rounded-3xl border p-6 text-left transition ${active ? "border-primary bg-primary/10 ring-1 ring-primary/30" : "border-border/40 bg-card/50 hover:border-primary/40"}`} aria-pressed={active}><div className="mb-4 flex items-center justify-between gap-3"><Icon className="h-6 w-6 text-primary" /><span className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${active ? "border-primary/30 bg-primary text-primary-foreground" : "border-border/50 text-muted-foreground"}`}>{active ? "Selected" : "Optional"}</span></div><h3 className="font-heading text-xl font-semibold">{addon.title}</h3><p className="mt-2 text-sm text-muted-foreground">{addon.desc}</p><p className="mt-4 font-mono text-primary">{addon.currency || "SGD"} {addon.price}</p></button>; })}</div>{saveStatus && <div className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${saveStatus.type === "success" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-destructive/30 bg-destructive/10 text-destructive-foreground"}`}>{saveStatus.message}</div>}<div className="mt-8 flex flex-wrap gap-3"><Button onClick={saveAddons} disabled={saving} variant="outline">{saving ? "Saving…" : saveStatus?.type === "success" ? "Saved" : "Save Add-ons"}</Button><ActionLink to={museumPath(slug, "commerce")}>Explore Museum Shop <Store className="h-4 w-4" /></ActionLink><ActionLink to={museumPath(slug, "tickets-5")}>Continue to Confirmation <ArrowRight className="h-4 w-4" /></ActionLink></div></StageShell>;
}

export function Confirmation() {
  const { tenantSlug } = useParams();
  const { tenant } = useTickets();
  const slug = tenantSlug || tenant?.slug || "asian-operatic-museum";
  const journey = useMemo(() => readJourney(tenant?.id), [tenant?.id]);
  const savedReservation = journey.reservation || {};
  const [paying, setPaying] = useState(false);
  const justPaid = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("payment") === "success";
  const { data: latestReservations = [] } = useQuery({
    queryKey: ["ticket-confirmation-reservation", savedReservation.id],
    queryFn: () => savedReservation.id ? base44.entities.Ticket.filter({ id: savedReservation.id }) : Promise.resolve([]),
    enabled: !!savedReservation.id,
    initialData: [],
    // After returning from Stripe, poll briefly until the webhook flips status to paid.
    refetchInterval: (query) => {
      const status = String(query.state.data?.[0]?.status || "").toLowerCase();
      return justPaid && !["paid", "confirmed"].includes(status) ? 2500 : false;
    },
  });

  const startPayment = async () => {
    if (!savedReservation.id || paying) return;
    setPaying(true);
    try {
      const data = await base44.functions.invoke("stripe-checkout", { ticket_id: savedReservation.id, origin: window.location.origin });
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      if (data?.already_paid) {
        toast.success("This reservation is already paid.");
        return;
      }
      toast.error(data?.error || "We couldn't start the payment. Please try again or contact the museum.");
    } catch (error) {
      console.error("[tickets] payment start failed:", error);
      toast.error("We couldn't start the payment. Please try again or contact the museum.");
    } finally {
      setPaying(false);
    }
  };
  const reservation = latestReservations[0] ? { ...savedReservation, ...latestReservations[0] } : savedReservation;
  const hasSavedReservation = !!reservation.id || Object.keys(savedReservation).length > 0;
  const hasTicket = hasValidTicketSelection(reservation);
  const hasQuantity = Number.isFinite(Number(reservation.quantity)) && Number(reservation.quantity) > 0;
  const hasValidDate = isValidVisitDate(reservation.visit_date);
  const hasValidReservation = hasSavedReservation && hasTicket && hasQuantity && hasValidDate;

  if (!hasValidReservation) {
    return <StageShell activeStage="tickets-5" eyebrow="Confirmation" title="Reservation needed." body="No reservation found. Please choose a ticket before continuing."><div className="rounded-3xl border border-amber-400/20 bg-amber-400/10 p-8 text-center"><AlertTriangle className="mx-auto mb-4 h-10 w-10 text-amber-300" /><h2 className="font-heading text-3xl font-semibold">No reservation found</h2><p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground">Please choose a ticket before continuing. Your confirmation summary will appear after a valid reservation is saved.</p><div className="mt-6"><ActionLink to={museumPath(slug, "tickets")}>Choose Ticket <ArrowRight className="h-4 w-4" /></ActionLink></div></div></StageShell>;
  }

  const status = String(reservation.status || "pending").toLowerCase();
  const hasConfirmedAccess = ["paid", "confirmed"].includes(status);
  const statusLabel = hasConfirmedAccess ? status : "payment pending";
  const ticketLabel = reservation.ticket_label || reservation.ticket_type || reservation.ticket_id;

  return <StageShell activeStage="tickets-5" eyebrow="Confirmation" title="Reservation summary and next steps." body="Your reservation is saved, but access will only unlock after payment confirmation."><div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]"><div className={`rounded-3xl border p-6 ${hasConfirmedAccess ? "border-emerald-400/20 bg-emerald-400/10" : "border-amber-400/20 bg-amber-400/10"}`}><CheckCircle2 className={`mb-4 h-10 w-10 ${hasConfirmedAccess ? "text-emerald-300" : "text-amber-300"}`} /><h2 className="font-heading text-3xl font-semibold">Reservation received</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">{reservation.visitor_name || "Visitor"}, your {ticketLabel} request is saved. Your reservation is saved, but access will only unlock after payment confirmation.</p>{!hasConfirmedAccess && <div className="mt-4 rounded-2xl border border-amber-300/30 bg-background/30 p-4 text-sm text-amber-100"><p className="font-semibold">{justPaid ? "Payment received — confirming your ticket…" : "Payment Pending"}</p><p className="mt-1 text-xs text-amber-100/80">{justPaid ? "Hang tight, this page will update automatically in a few seconds." : "Pay securely with Stripe below — tour access unlocks the moment payment is confirmed."}</p></div>}</div><div className="rounded-3xl border border-border/40 bg-card/50 p-6 backdrop-blur-sm"><h3 className="font-heading text-2xl font-semibold">Summary</h3><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Ticket</dt><dd>{ticketLabel}</dd></div><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Quantity</dt><dd>{reservation.quantity}</dd></div><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Visit date</dt><dd>{reservation.visit_date}</dd></div><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Status</dt><dd><Badge className={hasConfirmedAccess ? "bg-emerald-400/10 text-emerald-200" : "bg-amber-400/10 text-amber-200"}>{statusLabel}</Badge></dd></div><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Add-ons</dt><dd>{journey.addons?.length || 0}</dd></div></dl></div></div><div className="mt-8 flex flex-wrap gap-3">{hasConfirmedAccess ? <ActionLink to={museumPath(slug, "begin-tour")}>Begin Tour <ArrowRight className="h-4 w-4" /></ActionLink> : <Button onClick={startPayment} disabled={paying || justPaid} className="gap-2">{paying ? "Redirecting to Stripe…" : justPaid ? "Confirming payment…" : "Pay Now"}</Button>}<ActionLink to={museumPath(slug, "about")} variant="outline">Learn About Museum</ActionLink><ActionLink to={museumPath(slug, "tickets")} variant="outline">Reserve Another Ticket</ActionLink></div></StageShell>;
}

export function CommerceBridge() {
  const { tenantSlug } = useParams();
  const { tenant } = useActiveTenant();
  const slug = tenantSlug || tenant?.slug || "asian-operatic-museum";
  return <div className="mt-8 flex flex-wrap justify-center gap-3"><ActionLink to={museumPath(slug, "commerce")} variant="outline"><ShoppingBag className="h-4 w-4" /> Browse Shop Preview</ActionLink><ActionLink to={museumPath(slug, "tickets")}>Reserve Tickets <ArrowRight className="h-4 w-4" /></ActionLink><ActionLink to={museumPath(slug, "vendors")} variant="outline"><Package className="h-4 w-4" /> Vendor Partnership</ActionLink></div>;
}