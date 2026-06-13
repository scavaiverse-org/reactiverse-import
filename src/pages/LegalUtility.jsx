import { Link, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getLegalPage, LEGAL_LAST_UPDATED } from "@/lib/legal-content";

// Renders a section body, turning a referenced contact email into a clickable
// mailto link while keeping the surrounding text intact.
function renderBody(section) {
  const email = section.email;
  if (!email || !section.body.includes(email)) return section.body;
  const [before, after] = section.body.split(email);
  return (
    <>
      {before}
      <a href={`mailto:${email}`} className="text-primary underline-offset-4 hover:underline">{email}</a>
      {after}
    </>
  );
}

export default function LegalUtility() {
  const location = useLocation();
  const page = getLegalPage(location.pathname);

  // Context-aware back navigation: return to the page the visitor came from if
  // it was a museum page, otherwise return to the platform overview.
  const referrer = typeof document !== "undefined" ? document.referrer : "";
  const cameFromMuseum = referrer.includes("/museum/");
  const backLabel = cameFromMuseum ? "Back" : "Back to Platform";
  const backTo = cameFromMuseum ? -1 : "/platform/overview";

  return (
    <main className="min-h-screen bg-background px-4 py-20">
      <Card className="mx-auto max-w-3xl border-border/50 bg-card/60">
        <CardContent className="p-8 sm:p-10">
          <Button
            asChild={typeof backTo === "string"}
            variant="ghost"
            size="sm"
            className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
            onClick={typeof backTo === "number" ? () => window.history.back() : undefined}
          >
            {typeof backTo === "string" ? (
              <Link to={backTo}><ArrowLeft className="h-4 w-4" /> {backLabel}</Link>
            ) : (
              <span><ArrowLeft className="h-4 w-4" /> {backLabel}</span>
            )}
          </Button>

          <h1 className="mb-3 font-display text-4xl font-bold text-foreground">{page.title}</h1>
          <p className="mb-8 text-sm leading-relaxed text-foreground/75">{page.intro}</p>

          <div className="space-y-6">
            {page.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="mb-2 font-display text-lg font-semibold text-foreground">{section.heading}</h2>
                <p className="text-sm leading-relaxed text-foreground/75">{renderBody(section)}</p>
              </section>
            ))}
          </div>

          <p className="mt-10 text-xs text-muted-foreground">Last updated: {LEGAL_LAST_UPDATED}</p>
        </CardContent>
      </Card>
    </main>
  );
}