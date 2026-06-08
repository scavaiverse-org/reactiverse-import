import { Link } from "react-router-dom";
import { CheckCircle2, Route, ShieldCheck, AlertTriangle } from "lucide-react";
import { routeGroups, routeRegistry } from "@/lib/route-registry";
import { MIRRORED_MUSEUM_PAGES, MIRRORED_PLATFORM_PAGES } from "@/lib/mirror-architecture";
import { DEFAULT_MUSEUM_SLUG } from "@/lib/domain-registry";

const routeStableKey = (route = {}, index = 0) => `${route.domain || "global"}:${route.pageKey || route.label || "route"}:${route.path}:${index}`;
const resolveRoutePath = (path = "/") => path
  .replace(":tenantSlug", DEFAULT_MUSEUM_SLUG)
  .replace(":tenantId", DEFAULT_MUSEUM_SLUG)
  .replace(":serviceKey", "cms")
  .replace(":contentKey", "exhibits");

export default function RouteIntegrityScanner() {
  const criticalRoutes = routeRegistry.filter(route => route.critical).length;
  const mirrorPages = [...MIRRORED_MUSEUM_PAGES, ...MIRRORED_PLATFORM_PAGES];
  const legacyMirrorAliases = mirrorPages.filter((page) => page.adminPath().startsWith("/admin/")).length;

  return (
    <section className="rounded-xl border border-cyan-400/15 bg-white/[0.03] p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-xs font-semibold text-foreground flex items-center gap-2">
            <Route className="w-3.5 h-3.5 text-cyan-400" /> Route Integrity Scanner
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">Deterministic map of public, admin, service, and content routes. Items are mapped-only until runtime verified by QA Sentinel.</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-display font-bold text-cyan-400">{routeRegistry.length}</p>
          <p className="text-[10px] text-muted-foreground">routes mapped</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="rounded-lg border border-white/8 bg-black/10 p-3">
          <p className="text-lg font-display font-bold text-emerald-400">{criticalRoutes}</p>
          <p className="text-[10px] text-muted-foreground">Critical paths</p>
        </div>
        <div className="rounded-lg border border-white/8 bg-black/10 p-3">
          <p className="text-lg font-display font-bold text-primary">{routeGroups.Platform?.length || 0}</p>
          <p className="text-[10px] text-muted-foreground">Platform routes</p>
        </div>
        <div className="rounded-lg border border-white/8 bg-black/10 p-3">
          <p className="text-lg font-display font-bold text-violet-400">{routeGroups["Master Admin"]?.length || 0}</p>
          <p className="text-[10px] text-muted-foreground">Master routes</p>
        </div>
        <div className="rounded-lg border border-white/8 bg-black/10 p-3">
          <p className="text-lg font-display font-bold text-cyan-400">{mirrorPages.length}</p>
          <p className="text-[10px] text-muted-foreground">Admin mirrors</p>
        </div>
      </div>

      {legacyMirrorAliases > 0 && (
        <div className="mb-4 rounded-lg border border-amber-400/20 bg-amber-400/10 p-3 text-xs text-amber-200">
          <AlertTriangle className="mr-2 inline h-3.5 w-3.5" /> {legacyMirrorAliases} mirror path{legacyMirrorAliases === 1 ? "" : "s"} still use legacy admin aliases and need canonical review.
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-3">
        {Object.entries(routeGroups).map(([group, routes]) => (
          <div key={group} className="rounded-lg border border-white/8 bg-black/10 p-3">
            <p className="text-[10px] uppercase tracking-widest text-cyan-400 mb-2">{group}</p>
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {routes.map((route, index) => (
                <Link key={routeStableKey(route, index)} to={resolveRoutePath(route.path)} className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-white/[0.04] transition-colors">
                  <span className="text-xs text-foreground/80 truncate">{route.label}</span>
                  <span className="flex items-center gap-1 text-[9px] text-cyan-300">
                    {route.critical ? <ShieldCheck className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                    mapped-only
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}