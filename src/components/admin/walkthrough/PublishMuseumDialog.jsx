import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, History, RotateCcw, Rocket } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { WALKTHROUGHS, extractRoomsFromConfig, walkthroughLabel } from "@/lib/walkthrough-admin";
import { museumWalkthroughPath } from "@/lib/domain-registry";
import { validateWalkthroughRooms } from "@/lib/walkthrough-validation";
import { compileMuseumManifest } from "@/lib/manifest-compiler";

function visibleRoomCount(config, walkthroughKey) {
  return extractRoomsFromConfig(config, walkthroughKey).filter((room) => room.visibility !== "hidden" && room.visibility !== "draft").length;
}

export default function PublishMuseumDialog({ tenant, museumId }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [included, setIncluded] = useState(() => new Set());
  const [errors, setErrors] = useState([]);

  const { data: allConfigs = [] } = useQuery({
    queryKey: ["tenant-walkthrough-all-configs", tenant?.id, museumId],
    enabled: !!tenant?.id && open,
    queryFn: () => base44.entities.ExperienceConfig.filter({ tenant_id: tenant.id, museum_id: museumId || tenant.id, module_key: "walkthrough" }, "-updated_at", 50),
    initialData: [],
  });

  const { data: history = [] } = useQuery({
    queryKey: ["published-manifest-history", tenant?.id],
    enabled: !!tenant?.id && open,
    queryFn: () => base44.entities.PublishedExperienceManifest.filter({ tenant_id: tenant.id }, "-manifest_version", 25),
    initialData: [],
  });

  const slots = useMemo(() => WALKTHROUGHS.map((key) => {
    const config = allConfigs.find((item) => (item.walkthrough_key || item.walkthrough_config?.walkthrough_key) === key);
    const roomCount = config ? visibleRoomCount(config, key) : 0;
    return { key, config, roomCount };
  }), [allConfigs]);

  useMemo(() => {
    if (open) setIncluded(new Set(slots.filter((slot) => slot.roomCount > 0).map((slot) => slot.key)));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSlot = (key) => setIncluded((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      const includedKeys = WALKTHROUGHS.filter((key) => included.has(key));
      const preErrors = [];
      includedKeys.forEach((key) => {
        const slot = slots.find((item) => item.key === key);
        const rooms = slot?.config ? extractRoomsFromConfig(slot.config, key).filter((room) => room.visibility !== "hidden" && room.visibility !== "draft") : [];
        validateWalkthroughRooms(rooms).forEach((error) => preErrors.push(`${walkthroughLabel(key)}: ${error}`));
      });
      if (preErrors.length) throw { validationErrors: preErrors };

      const me = await base44.auth.me().catch(() => null);
      const { manifest, errors: gateErrors } = compileMuseumManifest({
        tenant,
        experienceConfigs: allConfigs,
        includedWalkthroughKeys: includedKeys,
        previousVersion: tenant?.published_manifest_version || 0,
        publishedBy: me?.email || me?.id || "admin",
      });
      if (gateErrors.length) throw { validationErrors: gateErrors };

      const created = await base44.entities.PublishedExperienceManifest.create(manifest);
      await base44.entities.MuseumTenant.update(tenant.id, { published_manifest_id: created.id, published_manifest_version: manifest.manifest_version });
      await base44.entities.PublishLog.create({
        tenantId: tenant.id,
        targetEntity: "PublishedExperienceManifest",
        targetId: created.id,
        fromState: "draft",
        toState: "published",
        publishedVersionId: created.id,
        publishedBy: me?.email || me?.id || "admin",
        publishedAt: manifest.published_at,
      });
      return created;
    },
    onSuccess: () => {
      setErrors([]);
      queryClient.invalidateQueries({ queryKey: ["live-tenant-museums"] });
      queryClient.invalidateQueries({ queryKey: ["published-manifest"] });
      queryClient.invalidateQueries({ queryKey: ["public-walkthrough-config"] });
      queryClient.invalidateQueries({ queryKey: ["published-manifest-history"] });
      queryClient.invalidateQueries({ queryKey: ["walkthrough-admin-tenants"] });
    },
    onError: (error) => setErrors(error?.validationErrors || [error?.message || "Publish failed."]),
  });

  const rollbackMutation = useMutation({
    mutationFn: async (manifestRow) => {
      const me = await base44.auth.me().catch(() => null);
      await base44.entities.MuseumTenant.update(tenant.id, { published_manifest_id: manifestRow.id, published_manifest_version: manifestRow.manifestVersion ?? manifestRow.manifest_version });
      await base44.entities.PublishLog.create({
        tenantId: tenant.id,
        targetEntity: "PublishedExperienceManifest",
        targetId: manifestRow.id,
        fromState: "published",
        toState: "published",
        publishedVersionId: manifestRow.id,
        publishedBy: me?.email || me?.id || "admin",
        publishedAt: new Date().toISOString(),
        rollbackFromLogId: manifestRow.id,
        notes: `Rollback to manifest version ${manifestRow.manifestVersion ?? manifestRow.manifest_version}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["live-tenant-museums"] });
      queryClient.invalidateQueries({ queryKey: ["published-manifest"] });
      queryClient.invalidateQueries({ queryKey: ["public-walkthrough-config"] });
      queryClient.invalidateQueries({ queryKey: ["walkthrough-admin-tenants"] });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Rocket className="h-4 w-4" /> Publish Museum</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Publish Museum</DialogTitle>
          <DialogDescription>
            Choose which walkthroughs go live. Publishing creates a new immutable snapshot (version {(tenant?.published_manifest_version || 0) + 1}) and atomically points the museum at it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {slots.map((slot) => (
            <label key={slot.key} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm">
              <div className="flex items-center gap-3">
                <Checkbox checked={included.has(slot.key)} onCheckedChange={() => toggleSlot(slot.key)} disabled={slot.roomCount === 0} />
                <div>
                  <div className="font-medium">{walkthroughLabel(slot.key)}</div>
                  <div className="text-xs text-muted-foreground">{museumWalkthroughPath(tenant?.slug, slot.key)}</div>
                </div>
              </div>
              <Badge variant="outline">{slot.roomCount} visible room{slot.roomCount === 1 ? "" : "s"}</Badge>
            </label>
          ))}
        </div>

        {errors.length > 0 && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <div className="mb-1 flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" /> Publish blocked</div>
            <ul className="list-disc space-y-1 pl-5">{errors.map((error) => <li key={error}>{error}</li>)}</ul>
          </div>
        )}

        <DialogFooter>
          <Button onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending || included.size === 0}>
            <Rocket className="h-4 w-4" /> Publish {included.size} walkthrough{included.size === 1 ? "" : "s"}
          </Button>
        </DialogFooter>

        <div className="mt-4 border-t border-white/10 pt-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><History className="h-4 w-4" /> Publish history</div>
          {history.length === 0 ? (
            <p className="text-xs text-muted-foreground">No published versions yet.</p>
          ) : (
            <ul className="space-y-2">
              {history.map((row) => {
                const version = row.manifestVersion ?? row.manifest_version;
                const isCurrent = version === (tenant?.published_manifest_version ?? tenant?.publishedManifestVersion);
                return (
                  <li key={row.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs">
                    <div>
                      <div className="font-medium">Version {version} {isCurrent && <Badge className="ml-2 bg-primary/10 text-primary">Live</Badge>}</div>
                      <div className="text-muted-foreground">{row.publishedAt || row.published_at} · {row.publishedBy || row.published_by}</div>
                    </div>
                    {!isCurrent && (
                      <Button size="sm" variant="outline" onClick={() => rollbackMutation.mutate(row)} disabled={rollbackMutation.isPending}>
                        <RotateCcw className="h-3.5 w-3.5" /> Rollback
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
