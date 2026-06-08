import { Link } from "react-router-dom";
import { Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { DEFAULT_MUSEUM_SLUG, museumPath } from "@/lib/domain-registry";

export default function ModuleGate({ moduleKey, children }) {
  const { tenant, isLoading, isModuleEnabled } = useActiveTenant();
  const tenantSlug = tenant?.slug || DEFAULT_MUSEUM_SLUG;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs tracking-widest text-muted-foreground">LOADING MODULE</p>
        </div>
      </div>
    );
  }

  if (tenant && !isModuleEnabled(moduleKey)) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <div className="max-w-md text-center rounded-2xl border border-border bg-card/50 p-8">
          <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-4">
            <Lock className="w-5 h-5 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-display font-bold text-foreground mb-2">Module Disabled</h1>
          <p className="text-sm text-muted-foreground mb-6">
            This experience is currently disabled for {tenant.name}. Enable it from the tenant module settings to make this route available.
          </p>
          <Link to={museumPath(tenantSlug, "home")}>
            <Button className="gap-2 bg-primary text-primary-foreground">
              <ArrowLeft className="w-4 h-4" /> Return Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return children;
}