import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Store, CheckCircle2, XCircle, Clock, ArrowRight } from "lucide-react";
import AdminBreadcrumb from "@/components/admin/AdminBreadcrumb";
import TenantSwitcher from "@/components/admin/TenantSwitcher";
import ConfigEditor from "@/components/admin/ConfigEditor";
import { toast } from "sonner";

export default function ModuleVendors() {
  const qc = useQueryClient();
  const { data: tenants = [] } = useQuery({ queryKey: ["mv-tenants"], queryFn: () => base44.entities.MuseumTenant.list() });
  const [activeTenant, setActiveTenant] = useState(null);
  const selected = tenants.find(t => t.id === activeTenant) || tenants[0];
  const { data: vendors = [] } = useQuery({ queryKey: ["mv-vendors", selected?.id], queryFn: () => selected ? base44.entities.Vendor.filter({ tenant_id: selected.id }) : base44.entities.Vendor.list(), enabled: !!selected });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      await base44.entities.Vendor.update(id, { status });
      return { id, status };
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mv-vendors"] }); toast.success("Vendor status updated"); }
  });

  const pending = vendors.filter(v => v.status === "pending");
  const approved = vendors.filter(v => ["approved", "active"].includes(v.status));
  const rejected = vendors.filter(v => v.status === "rejected");
  const totalRevenue = vendors.reduce((s, v) => s + (v.revenue_total || 0), 0);

  const catCount = vendors.reduce((acc, v) => { acc[v.category] = (acc[v.category] || 0) + 1; return acc; }, {});

  return (
    <div className="min-h-screen bg-[#060c18] p-6 lg:p-8">
      <AdminBreadcrumb crumbs={[{ label: "Modules", path: "/admin/modules" }, { label: "Vendors" }]} />

      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[10px] tracking-[0.3em] text-amber-400 font-semibold mb-1">MODULE 5</p>
          <h1 className="text-2xl font-display font-bold text-foreground">Vendor Onboarding Module</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage vendor applications, approvals, slot types, and revenue tracking.</p>
        </div>
        <TenantSwitcher activeTenant={activeTenant} onChange={setActiveTenant} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
          <p className="text-2xl font-display font-bold text-amber-400">{pending.length}</p>
          <p className="text-xs text-muted-foreground">Pending Review</p>
        </div>
        <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
          <p className="text-2xl font-display font-bold text-emerald-400">{approved.length}</p>
          <p className="text-xs text-muted-foreground">Approved / Active</p>
        </div>
        <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
          <p className="text-2xl font-display font-bold text-red-400">{rejected.length}</p>
          <p className="text-xs text-muted-foreground">Rejected</p>
        </div>
        <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
          <p className="text-xl font-display font-bold text-primary">SGD {totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Vendor Revenue</p>
        </div>
      </div>

      <div className="mb-6">
        <ConfigEditor
          tenant={selected}
          configType="module"
          moduleKey="vendors"
          title={`Vendor Config${selected ? ` — ${selected.name}` : ""}`}
          description="Saved to ModuleConfig and used by vendor registration and approvals."
          defaultValue={{ categories: ["cultural_arts", "food_beverage", "merchandise", "experiences"], slot_types: ["standard", "featured"], approval_workflow: "manual_review" }}
        >
          {({ draft, setDraft }) => (
            <div className="grid lg:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Vendor Categories</label>
                <textarea value={(draft.categories || []).join("\n")} onChange={e => setDraft({ ...draft, categories: e.target.value.split("\n").filter(Boolean) })} className="w-full min-h-[96px] bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Slot Types</label>
                <textarea value={(draft.slot_types || []).join("\n")} onChange={e => setDraft({ ...draft, slot_types: e.target.value.split("\n").filter(Boolean) })} className="w-full min-h-[96px] bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Approval Workflow</label>
                <select value={draft.approval_workflow || "manual_review"} onChange={e => setDraft({ ...draft, approval_workflow: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground">
                  <option value="manual_review">Manual Review</option>
                  <option value="auto_approve">Auto Approve</option>
                  <option value="invite_only">Invite Only</option>
                </select>
              </div>
            </div>
          )}
        </ConfigEditor>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Pending Vendors */}
        <div className="bg-white/[0.03] border border-amber-400/15 rounded-xl p-5">
          <p className="text-xs font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-amber-400" />Pending Applications ({pending.length})
          </p>
          <div className="space-y-2">
            {pending.slice(0, 5).map(v => (
              <div key={v.id} className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/6">
                <div>
                  <p className="text-xs text-foreground">{v.business_name}</p>
                  <p className="text-[10px] text-muted-foreground">{v.category?.replace(/_/g, " ")} · {v.slot_type}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => updateMutation.mutate({ id: v.id, status: "approved" })} className="p-1 text-emerald-400 hover:bg-emerald-400/10 rounded transition-colors">
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => updateMutation.mutate({ id: v.id, status: "rejected" })} className="p-1 text-red-400 hover:bg-red-400/10 rounded transition-colors">
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {pending.length === 0 && <p className="text-xs text-muted-foreground py-4 text-center">No pending applications</p>}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white/[0.03] border border-amber-400/15 rounded-xl p-5">
          <p className="text-xs font-semibold text-foreground mb-4 flex items-center gap-2">
            <Store className="w-3.5 h-3.5 text-amber-400" />Category Breakdown
          </p>
          <div className="space-y-2">
            {Object.entries(catCount).map(([cat, count]) => (
              <div key={cat} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                <span className="text-xs text-foreground capitalize">{cat.replace(/_/g, " ")}</span>
                <span className="text-xs font-mono text-amber-400">{count}</span>
              </div>
            ))}
            {Object.keys(catCount).length === 0 && <p className="text-xs text-muted-foreground py-4 text-center">No vendor data yet</p>}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Link to={`/museum/${selected?.slug}/vendors/register`} className="flex items-center gap-2 text-xs text-amber-400 border border-amber-400/30 px-4 py-2 rounded-lg hover:bg-amber-400/10 transition-colors">
          <Store className="w-3.5 h-3.5" />Vendor Registration
        </Link>
        <Link to="/admin/modules/commerce" className="flex items-center gap-2 text-xs text-emerald-400 border border-emerald-400/30 px-4 py-2 rounded-lg hover:bg-emerald-400/10 transition-colors">
          <ArrowRight className="w-3.5 h-3.5" />Commerce Module
        </Link>
      </div>
    </div>
  );
}