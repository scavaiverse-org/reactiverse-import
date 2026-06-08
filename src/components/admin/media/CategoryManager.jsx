export default function CategoryManager({ categories = [] }) {
  const aom = categories.find((category) => category.categoryCode === "AOM");

  return (
    <div className="rounded-2xl border border-border/50 bg-card/35 p-4">
      <p className="text-sm font-semibold text-foreground">Master Museum Category</p>
      <p className="text-xs text-muted-foreground">Homepage media is locked to one category only: AOM · Asian Operatic Museum.</p>
      <div className="mt-3 inline-flex rounded-full border border-primary bg-primary/10 px-3 py-2 text-sm text-primary">
        {(aom?.categoryCode || "AOM")} · {(aom?.categoryName || "Asian Operatic Museum")} · Default
      </div>
    </div>
  );
}