import { Link, useLocation } from "react-router-dom";
import { Building2, Home, LogIn } from "lucide-react";
import PlatformShell, { usePlatformWorkspace } from "@/components/platform/PlatformShell";
import { Button } from "@/components/ui/button";

export default function TenantLogin() {
  const location = useLocation();
  const { isAuthenticated, tenant, isMaster } = usePlatformWorkspace();
  const tenantAdminPath = tenant?.slug ? `/museum/${tenant.slug}/admin` : "/";

  // Preserve the original destination so login redirects back to where the user came from
  const fromPath = location.state?.from || tenantAdminPath;
  const loginHref = `/login?redirect=${encodeURIComponent(fromPath)}`;

  return (
    <PlatformShell>
      <section className="flex min-h-[70vh] items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg rounded-3xl border border-border/50 bg-card/70 p-8 text-center shadow-2xl">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
            <Building2 className="h-6 w-6" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">Tenant login</p>
          <h1 className="mt-4 font-display text-3xl font-bold text-foreground">Existing tenant / franchisee access</h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Log in to manage your museum, rooms, media, content, and visitor experience. After login, you will be taken directly to your dashboard.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            {isAuthenticated ? (
              <>
                <Link to={isMaster ? "/platform/admin" : tenantAdminPath}><Button className="w-full bg-primary text-primary-foreground"><Home className="h-4 w-4" /> Open Dashboard</Button></Link>
                <Link to="/"><Button variant="outline" className="w-full">Return Home</Button></Link>
              </>
            ) : (
              <Link to={loginHref}><Button className="w-full bg-primary text-primary-foreground"><LogIn className="h-4 w-4" /> Tenant Login</Button></Link>
            )}
            <Link to="/become-a-tenant"><Button variant="ghost" className="w-full">Not a tenant yet?</Button></Link>
          </div>
        </div>
      </section>
    </PlatformShell>
  );
}