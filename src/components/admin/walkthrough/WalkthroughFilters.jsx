import { WALKTHROUGHS, walkthroughLabel } from "@/lib/walkthrough-admin";
import { Label } from "@/components/ui/label";
import HelpHint from "./HelpHint";

export default function WalkthroughFilters({ tenants, selectedTenantId, onTenantChange, museumFilter, onMuseumFilterChange, walkthroughKey, onWalkthroughChange, hideTenantSelector = false }) {
  return (
    <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:grid-cols-3">
      {!hideTenantSelector && (
        <label className="space-y-2">
          <Label className="flex items-center gap-1.5"><span>Tenant filtering</span><HelpHint title="Tenant filtering">Choose which tenant (museum operator) you're editing the experience for. Everything below applies to this tenant only.</HelpHint></Label>
          <select value={selectedTenantId || ""} onChange={(e) => onTenantChange(e.target.value)} className="w-full rounded-lg border border-white/10 bg-secondary px-3 py-2 text-sm">
            {tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.name}</option>)}
          </select>
        </label>
      )}
      {!hideTenantSelector && (
        <label className="space-y-2">
          <Label className="flex items-center gap-1.5"><span>Museum filtering</span><HelpHint title="Museum filtering">The museum's id, used to scope which museum's content you're editing. Defaults to the tenant's id — only change this if the tenant runs multiple museums.</HelpHint></Label>
          <input value={museumFilter || ""} onChange={(e) => onMuseumFilterChange(e.target.value)} placeholder="museum_id" className="w-full rounded-lg border border-white/10 bg-secondary px-3 py-2 text-sm" />
        </label>
      )}
      <label className="space-y-2">
        <Label className="flex items-center gap-1.5"><span>Walkthrough selector</span><HelpHint title="Walkthrough selector">Pick which walkthrough (immersive experience track) you're editing. A museum can have more than one — each is published to its own URL.</HelpHint></Label>
        <select value={walkthroughKey} onChange={(e) => onWalkthroughChange(e.target.value)} className="w-full rounded-lg border border-white/10 bg-secondary px-3 py-2 text-sm">
          {WALKTHROUGHS.map((key) => <option key={key} value={key}>{walkthroughLabel(key)}</option>)}
        </select>
      </label>
    </div>
  );
}