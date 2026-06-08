import AdminArchitectureBlueprint from "@/components/admin/AdminArchitectureBlueprint";

export default function ArchitectureBlueprint() {
  return (
    <div className="min-h-screen bg-[#060c18] text-foreground p-6 lg:p-8">
      <div className="mb-6">
        <p className="text-[10px] tracking-[0.3em] text-primary font-semibold uppercase">SCAVerse Architecture Standard</p>
        <h1 className="mt-2 text-3xl font-display font-bold text-foreground">Canonical Architecture Blueprint</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View the standardized master, platform, tenant, database, render, media, analytics, and customer-flow architecture.
        </p>
      </div>

      <AdminArchitectureBlueprint />
    </div>
  );
}