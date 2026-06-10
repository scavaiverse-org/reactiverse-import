import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Building2 } from "lucide-react";
import { museumPath } from "@/lib/domain-registry";
import { listPublishedMuseums } from "@/lib/manifest-public";
import PlatformShell from "@/components/platform/PlatformShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function VirtualExperience() {
  const { data: museums = [], isLoading } = useQuery({
    queryKey: ["live-tenant-museums"],
    queryFn: () => listPublishedMuseums(),
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
        ) : museums.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-border/50 bg-card/60 p-10 text-center">
            <Building2 className="mx-auto mb-4 h-10 w-10 text-primary" />
            <h2 className="font-display text-2xl font-bold">No museums are live yet.</h2>
            <p className="mt-2 text-sm text-muted-foreground">Please check back soon as new tenant museums are published.</p>
          </div>
        ) : (
          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {museums.map(({ tenant, manifest }) => (
              <Card key={tenant.id} className="overflow-hidden border-border/40 bg-card/50 shadow-xl shadow-black/20 backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:bg-card/80">
                {manifest.card.cover_media_url && (
                  <img src={manifest.card.cover_media_url} alt={manifest.card.title} className="h-40 w-full object-cover" />
                )}
                <CardContent className="p-6">
                  <div className="mb-4 flex flex-wrap gap-2">
                    <Badge className="bg-primary/10 text-primary">Live museum</Badge>
                    <Badge variant="outline">{manifest.card.walkthrough_count} walkthrough{manifest.card.walkthrough_count === 1 ? "" : "s"}</Badge>
                  </div>
                  <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">{manifest.card.title}</h2>
                  <p className="mt-3 min-h-20 font-body text-sm font-light leading-6 text-muted-foreground">{manifest.card.description}</p>
                  <div className="mt-4 text-xs text-muted-foreground">{manifest.card.region}</div>
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
