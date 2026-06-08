import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { ShoppingBag, Package, Tag, Heart, ArrowRight } from "lucide-react";
import AdminBreadcrumb from "@/components/admin/AdminBreadcrumb";
import StatusBadge from "@/components/admin/StatusBadge";
import TenantSwitcher from "@/components/admin/TenantSwitcher";
import ConfigEditor from "@/components/admin/ConfigEditor";

const PRODUCT_CATEGORIES = [
  { label: "Digital Merchandise", count: 24, revenue: 4820, status: "enabled" },
  { label: "Cultural Products", count: 18, revenue: 3240, status: "enabled" },
  { label: "Premium Content Access", count: 6, revenue: 1860, status: "enabled" },
  { label: "Membership Products", count: 3, revenue: 5400, status: "enabled" },
  { label: "Donations", count: 2, revenue: 980, status: "enabled" },
  { label: "Experience Retail (Upsell)", count: 8, revenue: 2100, status: "warning" },
  { label: "Vendor-linked Products", count: 0, revenue: 0, status: "unconfigured" },
];

export default function ModuleCommerce() {
  const { data: tenants = [] } = useQuery({ queryKey: ["mc-tenants"], queryFn: () => base44.entities.MuseumTenant.list() });
  const [activeTenant, setActiveTenant] = useState(null);
  const selected = tenants.find(t => t.id === activeTenant) || tenants[0];
  const { data: vendors = [] } = useQuery({ queryKey: ["mc-vendors", selected?.id], queryFn: () => selected ? base44.entities.Vendor.filter({ tenant_id: selected.id }) : base44.entities.Vendor.list(), enabled: !!selected });
  const { data: tickets = [] } = useQuery({ queryKey: ["mc-tickets", selected?.id], queryFn: () => selected ? base44.entities.Ticket.filter({ tenant_id: selected.id }) : base44.entities.Ticket.list(), enabled: !!selected });

  const totalRevenue = PRODUCT_CATEGORIES.reduce((s, c) => s + c.revenue, 0);
  const totalProducts = PRODUCT_CATEGORIES.reduce((s, c) => s + c.count, 0);

  return (
    <div className="min-h-screen bg-[#060c18] p-6 lg:p-8">
      <AdminBreadcrumb crumbs={[{ label: "Modules", path: "/admin/modules" }, { label: "Commerce" }]} />

      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[10px] tracking-[0.3em] text-emerald-400 font-semibold mb-1">MODULE 6</p>
          <h1 className="text-2xl font-display font-bold text-foreground">Commerce Module</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage digital store, merchandise, donations, upsells, and vendor-linked products.</p>
        </div>
        <TenantSwitcher activeTenant={activeTenant} onChange={setActiveTenant} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
          <p className="text-2xl font-display font-bold text-emerald-400">{totalProducts}</p>
          <p className="text-xs text-muted-foreground">Configured Product Slots</p>
        </div>
        <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
          <p className="text-xl font-display font-bold text-primary">SGD {totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Demo Revenue Model</p>
        </div>
        <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
          <p className="text-2xl font-display font-bold text-blue-400">{vendors.filter(v => v.status === "active").length}</p>
          <p className="text-xs text-muted-foreground">Active Vendors</p>
        </div>
        <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
          <p className="text-2xl font-display font-bold text-amber-400">{tickets.length}</p>
          <p className="text-xs text-muted-foreground">Ticket Sales</p>
        </div>
      </div>

      <div className="mb-6">
        <ConfigEditor
          tenant={selected}
          configType="module"
          moduleKey="commerce"
          title={`Commerce Config${selected ? ` — ${selected.name}` : ""}`}
          description="Saved to ModuleConfig and controls product categories, upsells, and vendor-linked commerce."
          defaultValue={{ product_categories: PRODUCT_CATEGORIES.map(c => c.label), upsells_enabled: true, vendor_products_enabled: false }}
        >
          {({ draft, setDraft }) => (
            <div className="grid lg:grid-cols-3 gap-3">
              <div className="lg:col-span-2">
                <label className="text-[10px] text-muted-foreground block mb-1">Product Categories</label>
                <textarea value={(draft.product_categories || []).join("\n")} onChange={e => setDraft({ ...draft, product_categories: e.target.value.split("\n").filter(Boolean) })} className="w-full min-h-[96px] bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground" />
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-xs text-foreground"><input type="checkbox" checked={!!draft.upsells_enabled} onChange={e => setDraft({ ...draft, upsells_enabled: e.target.checked })} /> Upsells enabled</label>
                <label className="flex items-center gap-2 text-xs text-foreground"><input type="checkbox" checked={!!draft.vendor_products_enabled} onChange={e => setDraft({ ...draft, vendor_products_enabled: e.target.checked })} /> Vendor products enabled</label>
              </div>
            </div>
          )}
        </ConfigEditor>
      </div>

      {/* Product Categories */}
      <div className="bg-white/[0.03] border border-emerald-400/15 rounded-xl p-5 mb-6">
        <p className="text-xs font-semibold text-foreground mb-4 flex items-center gap-2">
          <Package className="w-3.5 h-3.5 text-emerald-400" />Product Categories
        </p>
        <div className="space-y-2">
          {PRODUCT_CATEGORIES.map(cat => (
            <div key={cat.label} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/6">
              <div className="flex items-center gap-2.5">
                <Tag className="w-3.5 h-3.5 text-emerald-400/60" />
                <div>
                  <p className="text-xs text-foreground">{cat.label}</p>
                  <p className="text-[10px] text-muted-foreground">{cat.count} products</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-emerald-400">SGD {cat.revenue.toLocaleString()}</span>
                <StatusBadge status={cat.status} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Commerce Features */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Upsell Engine", status: "warning", icon: ShoppingBag },
          { label: "Donation Module", status: "enabled", icon: Heart },
          { label: "Vendor Marketplace", status: "unconfigured", icon: Package },
          { label: "Membership Store", status: "enabled", icon: Tag },
        ].map(f => (
          <div key={f.label} className="bg-white/[0.02] border border-white/8 rounded-xl p-4">
            <f.icon className="w-4 h-4 text-emerald-400 mb-2" />
            <p className="text-xs text-foreground mb-2">{f.label}</p>
            <StatusBadge status={f.status} />
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Link to="/commerce" className="flex items-center gap-2 text-xs text-emerald-400 border border-emerald-400/30 px-4 py-2 rounded-lg hover:bg-emerald-400/10 transition-colors">
          <ArrowRight className="w-3.5 h-3.5" />Preview Commerce
        </Link>
        <Link to="/admin/modules/vendors" className="flex items-center gap-2 text-xs text-amber-400 border border-amber-400/30 px-4 py-2 rounded-lg hover:bg-amber-400/10 transition-colors">
          <ArrowRight className="w-3.5 h-3.5" />Vendor Module
        </Link>
        <Link to="/admin/services/payments" className="flex items-center gap-2 text-xs text-blue-400 border border-blue-400/30 px-4 py-2 rounded-lg hover:bg-blue-400/10 transition-colors">
          <ArrowRight className="w-3.5 h-3.5" />Payment Service
        </Link>
      </div>
    </div>
  );
}