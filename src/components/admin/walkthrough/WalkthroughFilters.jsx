import { WALKTHROUGHS, walkthroughLabel } from "@/lib/walkthrough-admin";
import { Label } from "@/components/ui/label";

export default function WalkthroughFilters({ tenants, selectedTenantId, onTenantChange, museumFilter, onMuseumFilterChange, walkthroughKey, onWalkthroughChange, hideTenantSelector = false }) {
  return (
    <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:grid-cols-3">
      {!hideTenantSelector && (
        <label className="space-y-2">
          <Label>Tenant filtering</Label>
          <select value={selectedTenantId || ""} onChange={(e) => onTenantChange(e.target.value)} className="w-full rounded-lg border border-white/10 bg-secondary px-3 py-2 text-sm">
            {tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.name}</option>)}
          </select>
        </label>
      )}
      {!hideTenantSelector && (
        <label className="space-y-2">
          <Label>Museum filtering</Label>
          <input value={museumFilter || ""} onChange={(e) => onMuseumFilterChange(e.target.value)} placeholder="museum_id" className="w-full rounded-lg border border-white/10 bg-secondary px-3 py-2 text-sm" />
        </label>
      )}
      <label className="space-y-2">
        <Label>Walkthrough selector</Label>
        <select value={walkthroughKey} onChange={(e) => onWalkthroughChange(e.target.value)} className="w-full rounded-lg border border-white/10 bg-secondary px-3 py-2 text-sm">
          {WALKTHROUGHS.map((key) => <option key={key} value={key}>{walkthroughLabel(key)}</option>)}
        </select>
      </label>
    </div>
  );
}