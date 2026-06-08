import { Navigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export function TenantAdminRedirect({ section = "" }) {
  const { tenantId } = useParams();
  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ["canonical-tenant-redirects"],
    queryFn: () => base44.entities.MuseumTenant.list(),
    initialData: [],
  });
  const tenant = tenants.find((item) => item.slug === tenantId || item.id === tenantId);

  if (isLoading && !tenant) {
    return <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">Resolving tenant route…</div>;
  }

  const tenantSlug = tenant?.slug || tenantId;
  const suffix = section ? `/${section}` : "";
  return <Navigate to={`/museum/${tenantSlug}/admin${suffix}`} replace />;
}

export function TenantPublicRedirect({ page = "home" }) {
  const { tenantSlug } = useParams();
  return <Navigate to={`/museum/${tenantSlug}/${page}`} replace />;
}