import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getStoredTenantId, resolveTenantContext, setStoredTenantId } from "@/lib/tenant-state";

export function useActiveTenant() {
  const { tenantSlug } = useParams();
  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ["active-tenant-source"],
    queryFn: () => base44.entities.MuseumTenant.list(),
  });

  const storedId = getStoredTenantId();
  const { tenant, isolationKey } = resolveTenantContext(tenants, { tenantSlug, storedTenantId: storedId });

  useEffect(() => {
    if (tenant?.id && storedId !== tenant.id) {
      setStoredTenantId(tenant.id);
    }
  }, [tenant?.id, storedId]);

  const enabledModules = tenant?.enabled_modules || [];
  const theme = tenant?.theme_config || {};

  return {
    tenant,
    tenants,
    isLoading,
    enabledModules,
    theme,
    isolationKey,
    isModuleEnabled: (moduleKey) => enabledModules.includes(moduleKey),
  };
}