import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Store, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { useActiveTenant } from '@/hooks/useActiveTenant';
import { museumPath } from '@/lib/domain-registry';
import { buildVendorPricing } from '@/lib/vendor-pricing';
import { assertTenantId } from '@/lib/tenant-query';
import { checkSubmitAllowed, honeypotInputProps, isHoneypotTripped, recordSubmit } from '@/lib/form-protection';
import { toast } from 'sonner';

export default function VendorRegister() {
  const navigate = useNavigate();
  const { tenantSlug: routeTenantSlug } = useParams();
  const { tenant } = useActiveTenant();
  const tenantSlug = routeTenantSlug || tenant?.slug || 'asian-operatic-museum';
  const { data: moduleConfigs = [] } = useQuery({
    queryKey: ["vendor-register-module-config", tenant?.id],
    queryFn: () => tenant ? base44.entities.ModuleConfig.filter({ tenant_id: tenant.id, module_key: "vendors" }) : Promise.resolve([]),
    enabled: !!tenant?.id,
    initialData: [],
  });
  const { slotTypes, commissionNote } = buildVendorPricing(moduleConfigs[0]?.config_json);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    business_name: '', contact_name: '', email: '', phone: '',
    category: '', description: '', website_url: '', slot_type: 'standard',
  });
  const [honeypot, setHoneypot] = useState('');

  const validate = () => {
    const next = {};
    if (!form.business_name.trim()) next.business_name = 'Business name is required';
    if (!form.contact_name.trim()) next.contact_name = 'Contact name is required';
    if (!form.email.trim()) {
      next.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = 'Enter a valid email address';
    }
    if (!form.phone.trim()) {
      next.phone = 'Phone is required';
    } else if (!/^[+]?[\d\s()-]{7,20}$/.test(form.phone.trim())) {
      next.phone = 'Enter a valid phone number';
    }
    if (!form.category) next.category = 'Please select a category';
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error(Object.values(validationErrors)[0]);
      return;
    }
    if (isHoneypotTripped(honeypot)) return;
    const guard = checkSubmitAllowed('vendor_application');
    if (!guard.allowed) {
      toast.error(guard.message);
      return;
    }
    let tenantId;
    try {
      tenantId = assertTenantId(tenant?.id);
    } catch {
      toast.error('Museum is still loading. Please try again in a moment.');
      return;
    }
    setErrors({});
    setSubmitError('');
    setIsSubmitting(true);
    try {
      base44.entities.AnalyticsEvent.create({ tenant_id: tenantId, tenant_name: tenant?.name, event_type: "vendor_signup", event_data: { slot_type: form.slot_type, category: form.category }, source_page: "vendor_register" }).catch(() => {});
      const created = await base44.entities.Vendor.create({
        ...form,
        tenant_id: tenantId,
        tenant_name: tenant?.name,
        status: 'pending',
      });
      // Fire-and-forget: email the SCAVerse inbox. Never block the flow on it.
      if (created?.id) base44.functions.invoke("notify-inquiry", { kind: "vendor_application", id: created.id }).catch(() => {});
      recordSubmit('vendor_application');
      setSubmitted(true);
      toast.success('Vendor application submitted.');
    } catch (err) {
      setSubmitError('Something went wrong submitting your application. Please try again.');
      toast.error('Something went wrong submitting your application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const submitAnother = () => {
    setSubmitted(false);
    setSubmitError('');
    setErrors({});
    setForm({
      business_name: '', contact_name: '', email: '', phone: '',
      category: '', description: '', website_url: '', slot_type: 'standard',
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-primary/20 bg-card p-8 text-center shadow-lg">
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-3">Vendor application submitted.</h1>
            <p className="text-muted-foreground font-body">Your application has been received and is pending review.</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => navigate(museumPath(tenantSlug, 'vendors'))}>Return to Vendor Marketplace</Button>
              <Button variant="outline" onClick={submitAnother}>Submit Another Application</Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-12">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
              <Store className="w-6 h-6 text-primary" />
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">Vendor Registration</h1>
            <p className="text-muted-foreground font-body">Join the {tenant?.name || "museum"} cultural marketplace ecosystem</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <input {...honeypotInputProps()} value={honeypot} onChange={e => setHoneypot(e.target.value)} />
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h3 className="font-display text-lg font-semibold text-foreground">Business Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="font-body text-sm">Business Name *</Label>
                  <Input value={form.business_name} onChange={e => update('business_name', e.target.value)} className={`mt-1 bg-background ${errors.business_name ? 'border-destructive focus-visible:ring-destructive' : ''}`} />
                  {errors.business_name && <p className="mt-1 text-xs text-destructive">{errors.business_name}</p>}
                </div>
                <div>
                  <Label className="font-body text-sm">Contact Name *</Label>
                  <Input value={form.contact_name} onChange={e => update('contact_name', e.target.value)} className={`mt-1 bg-background ${errors.contact_name ? 'border-destructive focus-visible:ring-destructive' : ''}`} />
                  {errors.contact_name && <p className="mt-1 text-xs text-destructive">{errors.contact_name}</p>}
                </div>
                <div>
                  <Label className="font-body text-sm">Email *</Label>
                  <Input type="email" value={form.email} onChange={e => update('email', e.target.value)} className={`mt-1 bg-background ${errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}`} />
                  {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
                </div>
                <div>
                  <Label className="font-body text-sm">Phone *</Label>
                  <Input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} className={`mt-1 bg-background ${errors.phone ? 'border-destructive focus-visible:ring-destructive' : ''}`} placeholder="+65 1234 5678" />
                  {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone}</p>}
                </div>
              </div>
              <div>
                <Label className="font-body text-sm">Category *</Label>
                <Select value={form.category} onValueChange={v => update('category', v)}>
                  <SelectTrigger className={`mt-1 bg-background ${errors.category ? 'border-destructive focus:ring-destructive' : ''}`}><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {['cultural_arts','food_beverage','merchandise','experiences','education','technology','corporate_sponsor'].map(c => (
                      <SelectItem key={c} value={c}>{c.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && <p className="mt-1 text-xs text-destructive">{errors.category}</p>}
              </div>
              <div>
                <Label className="font-body text-sm">Business Description</Label>
                <Textarea value={form.description} onChange={e => update('description', e.target.value)} className="mt-1 bg-background" rows={3} />
              </div>
              <div>
                <Label className="font-body text-sm">Website URL</Label>
                <Input value={form.website_url} onChange={e => update('website_url', e.target.value)} className="mt-1 bg-background" placeholder="https://" />
              </div>
            </div>

            {/* Slot Selection */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-display text-lg font-semibold text-foreground mb-1">Select Your Listing</h3>
              <p className="text-muted-foreground text-xs font-body mb-4">{commissionNote}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {slotTypes.map(slot => (
                  <button
                    key={slot.value}
                    type="button"
                    onClick={() => update('slot_type', slot.value)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      form.slot_type === slot.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-body font-semibold text-foreground text-sm">{slot.label}</span>
                      {form.slot_type === slot.value && <Check className="w-4 h-4 text-primary" />}
                    </div>
                    <span className="text-primary font-mono text-xs">{slot.price}</span>
                    <p className="text-muted-foreground text-xs font-body mt-1">{slot.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {submitError && <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{submitError}</div>}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-body font-semibold h-12 gap-2"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(museumPath(tenantSlug, 'vendors'))}>Return to Vendor Info</Button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}