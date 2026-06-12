import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Circle } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";

function manualStepStorageKey(tenantId, stepId) {
  return `scaverse_setup_checklist_${tenantId || "default"}_${stepId}`;
}

function readManualStep(tenantId, stepId) {
  try {
    return localStorage.getItem(manualStepStorageKey(tenantId, stepId)) === "true";
  } catch {
    return false;
  }
}

// Onboarding checklist for new franchisees: walks through the steps needed
// to take a tenant from "just created" to "published and visitor-ready".
// Most steps are derived from real data; a few (preview, QA) are manual
// confirmations the operator ticks off themselves.
export default function SetupChecklist({ tenant, adminBase, tenantSlug, enabledModules = [], exhibitsCount = 0, ticketsCount = 0 }) {
  const [manualDone, setManualDone] = useState(() => ({
    preview: readManualStep(tenant?.id, "preview"),
    qa: readManualStep(tenant?.id, "qa"),
  }));

  const { data: rooms = [] } = useQuery({
    queryKey: ["setup-checklist-rooms", tenant?.id],
    enabled: !!tenant?.id,
    queryFn: () => base44.entities.ExperienceConfig.filter({ tenant_id: tenant.id, module_key: "walkthrough" }, "-updated_at", 5),
    initialData: [],
  });

  const { data: homeConfigs = [] } = useQuery({
    queryKey: ["setup-checklist-home-config", tenant?.id],
    enabled: !!tenant?.id,
    queryFn: () => base44.entities.MuseumPageConfig.filter({ tenantId: tenant.id, pageKey: "home" }, "-updatedAt", 10),
    initialData: [],
  });

  const toggleManual = (stepId) => {
    setManualDone((current) => {
      const next = !current[stepId];
      try {
        localStorage.setItem(manualStepStorageKey(tenant?.id, stepId), String(next));
      } catch {
        // localStorage unavailable — toggle still reflects in-memory state for this session.
      }
      return { ...current, [stepId]: next };
    });
  };

  const steps = [
    { id: "profile", label: "Profile", description: "Set your museum's name and description.", done: !!tenant?.name && !!tenant?.description, to: `${adminBase}/home` },
    { id: "branding", label: "Branding", description: "Choose a primary color and logo for your space.", done: !!(tenant?.theme_config?.primary_color || tenant?.logo_url), to: `${adminBase}/home` },
    { id: "rooms", label: "Rooms", description: "Build at least one walkthrough room.", done: rooms.length > 0, to: `${adminBase}/walkthrough` },
    { id: "exhibits", label: "Exhibits", description: "Add exhibits visitors can explore.", done: exhibitsCount > 0, to: `${adminBase}/exhibits` },
    { id: "tickets", label: "Tickets", description: "Configure ticket tiers and pricing.", done: enabledModules.includes("ticketing") && ticketsCount > 0, to: `${adminBase}/tickets` },
    { id: "ai_guide", label: "AI Guide", description: "Enable the AI guide for visitor support.", done: enabledModules.includes("ai_guide"), to: `/museum/${tenantSlug}/guide` },
    { id: "preview", label: "Preview", description: "Walk through your museum as a visitor would.", done: manualDone.preview, to: `/museum/${tenantSlug}/home`, manual: true },
    { id: "qa", label: "QA", description: "Run through the publish checklist for any rooms before going live.", done: manualDone.qa, manual: true },
    { id: "publish", label: "Publish", description: "Publish your home page so visitors can find you.", done: homeConfigs.some((config) => config.publishState === "published"), to: `${adminBase}/home` },
  ];

  const completedCount = steps.filter((step) => step.done).length;
  const progress = Math.round((completedCount / steps.length) * 100);

  return (
    <Card className="bg-card/30 border-border/50">
      <CardHeader className="pb-3 flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-foreground">Franchisee Setup Checklist</CardTitle>
        <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">{progress}% complete</Badge>
      </CardHeader>
      <CardContent>
        <div className="w-full bg-secondary rounded-full h-1.5 mb-5">
          <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {steps.map((step) => {
            const Icon = step.done ? CheckCircle2 : Circle;
            const content = (
              <div className="flex items-start gap-2.5 rounded-xl border border-border/40 bg-background/30 p-3 transition-colors hover:border-primary/30">
                <Icon className={`mt-0.5 h-4 w-4 flex-shrink-0 ${step.done ? "text-emerald-400" : "text-muted-foreground/40"}`} />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground/85">{step.label}</p>
                  <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">{step.description}</p>
                </div>
              </div>
            );
            if (step.manual) {
              return (
                <button key={step.id} type="button" onClick={() => toggleManual(step.id)} className="text-left">
                  {content}
                </button>
              );
            }
            return (
              <Link key={step.id} to={step.to}>
                {content}
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
