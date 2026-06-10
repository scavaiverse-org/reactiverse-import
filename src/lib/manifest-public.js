import { base44 } from "@/api/base44Client";

/**
 * PUBLIC READ PATH. Public-facing pages must import museum content only from
 * this module. Importing ExperienceConfig, MuseumPageConfig, or TenantMedia
 * for walkthrough/card rendering in a public page is a determinism violation.
 */

export async function fetchPublishedManifest(tenant) {
  if (!tenant?.published_manifest_id) return null;
  const manifest = await base44.entities.PublishedExperienceManifest.get(tenant.published_manifest_id);
  return manifest || null;
}

export async function listPublishedMuseums() {
  const tenants = await base44.entities.MuseumTenant.filter({ status: "live" }, "name", 100);
  const live = (tenants || []).filter((tenant) => !!tenant.published_manifest_id);
  const results = await Promise.all(live.map(async (tenant) => ({ tenant, manifest: await fetchPublishedManifest(tenant) })));
  return results.filter((entry) => !!entry.manifest);
}

export function getWalkthroughByIndex(manifest, index = 1) {
  if (!manifest?.walkthroughs?.length) return null;
  return manifest.walkthroughs[index - 1] || null;
}
