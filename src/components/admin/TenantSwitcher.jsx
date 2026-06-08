import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Building2, ChevronDown } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { getStoredTenantId, setStoredTenantId } from "@/lib/tenant-state";

export default function TenantSwitcher({ activeTenant, onChange }) {
  const [open, setOpen] = useState(false);
  const { data: tenants = [] } = useQuery({
    queryKey: ["tenants-switcher"],
    queryFn: () => base44.entities.MuseumTenant.list()
  });

  const selected = tenants.find(t => t.id === activeTenant) || tenants.find(t => t.id === getStoredTenantId()) || tenants[0];

  useEffect(() => {
    if (!activeTenant && selected?.id) onChange?.(selected.id);
  }, [selected?.id]);

  const handleSelect = (tenantId) => {
    setStoredTenantId(tenantId);
    onChange?.(tenantId);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-xs"
      >
        <Building2 className="w-3.5 h-3.5 text-primary" />
        <span className="text-foreground max-w-[140px] truncate">{selected?.name || "Select Museum"}</span>
        <ChevronDown className="w-3 h-3 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute top-full mt-1 right-0 w-64 bg-[#0d1626] border border-white/10 rounded-xl shadow-2xl z-50 py-1">
          {tenants.map(t => (
            <button
              key={t.id}
              onClick={() => handleSelect(t.id)}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 transition-colors text-left"
            >
              <span className="text-xs text-foreground truncate">{t.name}</span>
              <StatusBadge status={t.status} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}