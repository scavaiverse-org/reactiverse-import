import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, Plus, Eye, Inbox, Palette, LayoutDashboard, Trash2 } from "lucide-react";
import AdminBreadcrumb from "@/components/admin/AdminBreadcrumb";
import StatusBadge from "@/components/admin/StatusBadge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const MODULES_ALL = ["onboarding", "ticketing", "ai_guide", "walkthrough", "vendors", "commerce", "analytics", "gamification"];

const INQUIRY_STATUSES = ["new", "contacted", "qualified", "closed"];

const INQUIRY_STATUS_COLORS = {
  new: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  contacted: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  qualified: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  closed: "text-muted-foreground bg-white/5 border-white/10",
};

export default function Tenants() {
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const selectedTenantId = searchParams.get("tenantId");
  const selectedTenantRef = useRef(null);
  const { data: tenants = [] } = useQuery({ queryKey: ["tenants-list"], queryFn: () => base44.entities.MuseumTenant.list() });
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRegion, setNewRegion] = useState("");
  const [tenantToDelete, setTenantToDelete] = useState(null);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.MuseumTenant.create(data);
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tenants-list"] }); setShowNew(false); setNewName(""); toast.success("Museum created"); }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      await base44.entities.MuseumTenant.update(id, data);
      return { id, data };
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tenants-list"] }); toast.success("Museum updated"); }
  });

  const deleteMutation = useMutation({
    mutationFn: (tenant) => base44.entities.MuseumTenant.delete(tenant.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenants-list"] });
      setTenantToDelete(null);
      toast.success("Museum deleted");
    }
  });

  // Franchise applications submitted via the public Become-a-Tenant form.
  const { data: inquiries = [] } = useQuery({
    queryKey: ["tenant-inquiries"],
    queryFn: () => base44.entities.TenantInquiry.list("-created_at", 200),
  });

  const inquiryStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.TenantInquiry.update(id, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tenant-inquiries"] }); toast.success("Application updated"); },
  });

  const handleCreate = () => {
    if (!newName) return;
    createMutation.mutate({
      name: newName,
      slug: newName.toLowerCase().replace(/\s+/g, "-"),
      status: "draft",
      region: newRegion || "Global",
      enabled_modules: ["onboarding", "ticketing", "walkthrough"],
      launch_readiness: 0,
    });
  };

  useEffect(() => {
    if (selectedTenantId && selectedTenantRef.current) {
      selectedTenantRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedTenantId, tenants.length]);

  const displayedTenants = selectedTenantId
    ? [...tenants].sort((a, b) => (a.id === selectedTenantId ? -1 : b.id === selectedTenantId ? 1 : 0))
    : tenants;

  return (
    <div className="min-h-screen bg-[#060c18] p-6 lg:p-8">
      <AdminBreadcrumb crumbs={[{ label: "Museum Tenants" }]} />

      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[10px] tracking-[0.3em] text-amber-400 font-semibold mb-1">MUSEUM NETWORK</p>
          <h1 className="text-2xl font-display font-bold text-foreground">Museums</h1>
          <p className="text-sm text-muted-foreground mt-1">One platform for many museums, each with its own sections, branding, and content.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/become-a-tenant" className="flex items-center gap-2 border border-white/10 px-4 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
            <Eye className="w-3.5 h-3.5" />Tenant Page
          </Link>
          <button onClick={() => setShowNew(!showNew)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors">
            <Plus className="w-3.5 h-3.5" />New Museum
          </button>
        </div>
      </div>

      {/* Create New */}
      {showNew && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-primary/5 border border-primary/20 rounded-xl p-5 mb-6">
          <p className="text-xs font-semibold text-foreground mb-3">Create New Museum Tenant</p>
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-[10px] text-muted-foreground block mb-1">Museum Name *</label>
              <input value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="e.g. National Heritage Museum"
                className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground block mb-1">Region</label>
              <input value={newRegion} onChange={e => setNewRegion(e.target.value)}
                placeholder="e.g. Singapore"
                className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={!newName || createMutation.isPending}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
              {createMutation.isPending ? "Creating..." : "Create Tenant"}
            </button>
            <button onClick={() => setShowNew(false)} className="px-4 py-2 border border-white/15 rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
          </div>
        </motion.div>
      )}

      {/* Franchise Applications */}
      <div className="bg-white/[0.03] border border-amber-400/15 rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Inbox className="w-4 h-4 text-amber-400" />
          <p className="text-xs font-semibold text-foreground">Franchise Applications</p>
          <span className="text-[10px] text-muted-foreground">({inquiries.length})</span>
        </div>
        <div className="space-y-3">
          {inquiries.map((inquiry) => (
            <div key={inquiry.id} className="rounded-lg border border-white/6 bg-white/[0.02] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{inquiry.organization}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {inquiry.contact_name} · {inquiry.email}
                    {inquiry.museum_type ? ` · ${inquiry.museum_type}` : ""}
                  </p>
                  {inquiry.message && <p className="mt-2 text-xs leading-5 text-foreground/70">{inquiry.message}</p>}
                  <p className="mt-1 text-[10px] text-muted-foreground/70">
                    Applied {new Date(inquiry.submitted_at || inquiry.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={inquiry.status || "new"}
                    onChange={(e) => inquiryStatusMutation.mutate({ id: inquiry.id, status: e.target.value })}
                    disabled={inquiryStatusMutation.isPending}
                    className={`rounded-lg border px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider focus:outline-none ${INQUIRY_STATUS_COLORS[inquiry.status] || INQUIRY_STATUS_COLORS.new} bg-[#060c18]`}
                  >
                    {INQUIRY_STATUSES.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => { setNewName(inquiry.organization); setShowNew(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-[10px] font-medium text-primary transition-colors hover:bg-primary/20"
                  >
                    Create Museum
                  </button>
                </div>
              </div>
            </div>
          ))}
          {inquiries.length === 0 && (
            <p className="py-4 text-center text-xs text-muted-foreground">No franchise applications yet</p>
          )}
        </div>
      </div>

      {/* Tenants Grid */}
      <div className="grid lg:grid-cols-2 gap-4">
        {displayedTenants.map((t, i) => {
          const isSelected = t.id === selectedTenantId;
          return (
          <motion.div key={t.id} ref={isSelected ? selectedTenantRef : null} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`bg-white/[0.03] rounded-xl p-5 ${isSelected ? "border border-primary/60 shadow-[0_0_30px_rgba(255,255,255,0.08)]" : "border border-white/8"}`}>
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-muted-foreground/60" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-[10px] text-muted-foreground">{t.region} · {t.custom_domain || `${t.slug}.scaverse.io`}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {isSelected && <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[9px] uppercase tracking-widest text-primary">Editing</span>}
                <StatusBadge status={t.status} />
              </div>
            </div>

            {/* Theme Color */}
            {t.theme_config?.primary_color && (
              <div className="flex items-center gap-2 mb-3">
                <div className="w-4 h-4 rounded-full border border-white/20" style={{ background: t.theme_config.primary_color }} />
                <span className="text-[10px] text-muted-foreground">{t.theme_config.primary_color}</span>
                <span className="text-[10px] text-muted-foreground">· {t.theme_config.font}</span>
              </div>
            )}

            {/* Module Pills */}
            <div className="flex flex-wrap gap-1 mb-3">
              {MODULES_ALL.map(m => {
                const en = t.enabled_modules?.includes(m);
                return (
                  <span key={m} className={`text-[9px] px-2 py-0.5 rounded-full border font-medium capitalize ${en ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/5" : "text-slate-600 border-slate-600/20"}`}>
                    {m.replace(/_/g, " ")}
                  </span>
                );
              })}
            </div>

            {/* Launch Readiness */}
            <div className="mb-4">
              <div className="flex justify-between mb-1">
                <span className="text-[10px] text-muted-foreground">Launch Readiness</span>
                <span className="text-[10px] text-primary">{t.launch_readiness}%</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-primary/60" style={{ width: `${t.launch_readiness}%` }} />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <select
                value={t.status}
                onChange={e => updateMutation.mutate({ id: t.id, data: { status: e.target.value } })}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary/40"
              >
                <option value="draft">Draft</option>
                <option value="staging">Staging</option>
                <option value="live">Live</option>
                <option value="archived">Archived</option>
              </select>
              <Link to={`/museum/${t.slug}/admin`} className="px-3 py-1.5 border border-primary/25 rounded-lg text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                <LayoutDashboard className="w-3 h-3" />Open Tenant Console
              </Link>
              <Link to="/platform/admin/white-label" className="px-3 py-1.5 border border-white/10 rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                <Palette className="w-3 h-3" />Brand
              </Link>
              <Link to={`/museum/${t.slug}/home`} className="px-3 py-1.5 border border-white/10 rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                <Eye className="w-3 h-3" />View
              </Link>
              <button onClick={() => setTenantToDelete(t)} className="px-3 py-1.5 border border-destructive/25 rounded-lg text-xs text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-1">
                <Trash2 className="w-3 h-3" />Delete
              </button>
            </div>
          </motion.div>
          );
        })}
      </div>

      <AlertDialog open={!!tenantToDelete} onOpenChange={(open) => !open && setTenantToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete museum tenant?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {tenantToDelete?.name || 'this museum tenant'}. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteMutation.mutate(tenantToDelete)}>
              Delete Museum
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}