import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Building2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { museumPath } from "@/lib/domain-registry";
import PlatformShell from "@/components/platform/PlatformShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function VirtualExperience() {
  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ["live-tenant-museums"],
    queryFn: () => base44.entities.MuseumTenant.filter({ status: "live" }, "name", 100),
    initialData: [],
  });

  return (
    <PlatformShell>
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="max-w-3xl">
          <p className="font-display text-[10px] font-medium uppercase tracking-[0.5em] text-primary/70">Virtual experience</p>
          <h1 className="mt-5 font-heading text-4xl font-semibold tracking-tight text-foreground sm:text-6xl">Explore available virtual museums.</h1>
          <p className="mt-5 font-body text-base font-light leading-relaxed text-muted-foreground">Browse tenant / franchisee museums and enter their public visitor experience.</p>
        </div>

        {isLoading ? (
          <div className="mt-12 text-sm text-muted-foreground">Loading museums…</div>
        ) : tenants.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-border/50 bg-card/60 p-10 text-center">
            <Building2 className="mx-auto mb-4 h-10 w-10 text-primary" />
            <h2 className="font-display text-2xl font-bold">No museums are live yet.</h2>
            <p className="mt-2 text-sm text-muted-foreground">Please check back soon as new tenant museums are published.</p>
          </div>
        ) : (
          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {tenants.map((tenant) => (
              <Card key={tenant.id} className="overflow-hidden border-border/40 bg-card/50 shadow-xl shadow-black/20 backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:bg-card/80">
                <CardContent className="p-6">
                  <Badge className="mb-4 bg-primary/10 text-primary">Live museum</Badge>
                  <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">{tenant.name}</h2>
                  <p className="mt-3 min-h-20 font-body text-sm font-light leading-6 text-muted-foreground">{tenant.description || "A public virtual museum experience inside this tenant platform."}</p>
                  <div className="mt-4 text-xs text-muted-foreground">{tenant.region}</div>
                  <Button asChild className="mt-6 w-full bg-primary text-primary-foreground">
                    <Link to={museumPath(tenant.slug, "home")}>
                      Enter Museum <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </PlatformShell>
  );
}