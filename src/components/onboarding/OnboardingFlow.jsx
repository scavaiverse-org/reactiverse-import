import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import PremiumOnboardingStage from "./PremiumOnboardingStage";
import { AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Ticket, Map, Store, Brain, Compass, Building2, Globe, KeyRound } from "lucide-react";
import { museumPath } from "@/lib/domain-registry";
import { publicExperienceFilter } from "@/lib/tenant-query";

const AUDIENCE_SELECTOR = {
  id: "choose_audience",
  title: "How would you like to experience AOM?",
  subtitle: "Choose the path that fits you.",
  visual: "◈",
  content: "AOM serves two groups: visitors who want to explore the museum, and franchisees or cultural operators who want to run or license a museum experience.",
  cta: "Continue",
  options: [
    { id: "franchisee", icon: Building2, label: "I am a Franchisee / Museum Operator", desc: "I want to understand the platform, revenue model, tenant tools, and deployment possibilities.", route_after_completion: "/become-tenant" },
    { id: "consumer", icon: Compass, label: "I am a Visitor / Consumer", desc: "I want to explore the museum, stories, tickets, ARIA, and the virtual walkthrough.", route_after_completion: "/walkthrough" },
  ],
};

const FALLBACK_CONSUMER_SLIDES = [
  {
    id: "consumer_welcome",
    audience: "consumer",
    title: "Enter the Asian Operatic Museum",
    subtitle: "A virtual museum you can visit from anywhere.",
    visual: "✦",
    content: "Explore stories, costumes, music, characters, stagecraft, and cultural memory through a guided digital museum journey.",
    cta: "Show Me the Museum",
    route: "/museum",
  },
  {
    id: "consumer_walkthrough",
    audience: "consumer",
    title: "Walk Through the Museum",
    subtitle: "Move scene by scene at your own pace.",
    visual: "▣",
    content: "Tap hotspots, open story panels, view exhibits, and follow a guided museum path without needing to be physically there.",
    cta: "Preview the Walkthrough",
    route: "/room-preview",
  },
  {
    id: "consumer_aria",
    audience: "consumer",
    title: "Ask ARIA",
    subtitle: "Your AI cultural guide.",
    visual: "◎",
    content: "ARIA helps explain exhibits, costumes, characters, tickets, vendors, and where to go next using verified museum content.",
    cta: "Meet ARIA",
    route: "/guide",
  },
  {
    id: "consumer_access",
    audience: "consumer",
    title: "Choose Your Access",
    subtitle: "Free previews and deeper guided access.",
    visual: "◉",
    content: "Visitors can preview parts of the museum, explore ticket options, or unlock deeper guided journeys for individuals, schools, and groups.",
    cta: "View Tickets",
    route: "/tickets",
  },
  {
    id: "consumer_begin",
    audience: "consumer",
    title: "Begin Your Visit",
    subtitle: "You are ready to enter.",
    visual: "◆",
    content: "Start with the walkthrough, ask ARIA, view tickets, or explore the museum marketplace.",
    cta: "Enter Walkthrough",
    route: "/walkthrough",
    options: [
      { id: "walkthrough", icon: Map, label: "Enter Walkthrough", desc: "Start the guided museum path", route: "/walkthrough" },
      { id: "guide", icon: Brain, label: "Ask ARIA", desc: "Ask the AI cultural guide", route: "/guide" },
      { id: "tickets", icon: Ticket, label: "View Tickets", desc: "See access options", route: "/tickets" },
      { id: "vendors", icon: Store, label: "Explore Vendors", desc: "Browse cultural marketplace options", route: "/vendors" },
    ],
  },
];

const FALLBACK_FRANCHISEE_SLIDES = [
  {
    id: "franchisee_welcome",
    audience: "franchisee",
    title: "Run a Digital Museum Experience",
    subtitle: "AOM is not only a museum. It is a museum platform.",
    visual: "◇",
    content: "Franchisees, cultural operators, schools, tourism partners, and museum owners can use AOM to launch a branded digital museum experience.",
    cta: "Show Me the Platform",
    route: "/platform/overview",
  },
  {
    id: "franchisee_features",
    audience: "franchisee",
    title: "What You Can Operate",
    subtitle: "Museum, walkthrough, guide, tickets, vendors, and analytics.",
    visual: "▦",
    content: "The platform supports virtual exhibits, AI guide content, ticketing, vendor listings, commerce, tenant pages, walkthroughs, and public-facing museum journeys.",
    cta: "Show Features",
    route: "/platform/overview",
  },
  {
    id: "franchisee_revenue",
    audience: "franchisee",
    title: "Built for Revenue Paths",
    subtitle: "Tickets, vendors, partners, schools, and cultural packages.",
    visual: "$",
    content: "AOM can support paid access, guided packages, school programs, partner showcases, cultural marketplace listings, and future white-label museum deployments.",
    cta: "See Business Path",
    route: "/become-tenant",
  },
  {
    id: "franchisee_admin",
    audience: "franchisee",
    title: "Tenant Control Layer",
    subtitle: "Each operator needs control without breaking the public museum.",
    visual: "▣",
    content: "Tenant tools should manage content, media, tickets, guide behavior, vendor visibility, analytics, and public page configuration in a controlled admin flow.",
    cta: "View Tenant Access",
    route: "/tenant-login",
  },
  {
    id: "franchisee_apply",
    audience: "franchisee",
    title: "Start as a Franchisee or Partner",
    subtitle: "Use AOM as a cultural technology layer.",
    visual: "◆",
    content: "Apply to become a tenant, franchisee, museum partner, school partner, or cultural deployment partner.",
    cta: "Become a Tenant",
    route: "/become-tenant",
    options: [
      { id: "apply", icon: Building2, label: "Become a Tenant", desc: "Start the franchisee/partner path", route: "/become-tenant" },
      { id: "platform", icon: Store, label: "View Platform", desc: "Understand the platform", route: "/platform/overview" },
      { id: "white_label", icon: Globe, label: "White Label", desc: "Explore branded deployments", route: "/white-label" },
      { id: "tenant_login", icon: KeyRound, label: "Tenant Login", desc: "Existing operator access", route: "/tenant-login" },
    ],
  },
];

const ROUTE_FOR_MAP_KEYS = ["/", "/museum", "/onboarding", "/room-preview", "/guide", "/tickets", "/walkthrough", "/vendors", "/platform/overview", "/become-tenant", "/tenant-login", "/white-label"];

// Maps a slide index to one of the constrained generic onboarding_progress
// stages (welcome/discovery/exploration/activation/completed) so the fine-
// grained per-flow slide ids never get written to the DB stage column.
function genericStage(index, total) {
  if (index <= 0) return "welcome";
  if (index >= total - 1) return "activation";
  const ratio = index / (total - 1);
  if (ratio < 0.4) return "discovery";
  if (ratio < 0.8) return "exploration";
  return "activation";
}

/**
 * Shared audience-branching onboarding state machine + slide UI.
 * Renders the audience selector, then either the consumer or franchisee
 * slide flow via PremiumOnboardingStage. Used by both the standalone
 * /onboarding page and the homepage first-visit overlay.
 */
export default function OnboardingFlow({ onNavigate, resetKey, showProgressDots = true, className = "", onContextChange }) {
  const [audience, setAudience] = useState(null);
  const [currentStage, setCurrentStage] = useState(0);
  const [selections, setSelections] = useState({});
  const [multiSelections, setMultiSelections] = useState([]);
  const { tenant: activeTenant } = useActiveTenant();
  const tenantSlug = activeTenant?.slug || "asian-operatic-museum";

  useEffect(() => {
    if (resetKey === undefined) return;
    setAudience(null);
    setCurrentStage(0);
    setSelections({});
    setMultiSelections([]);
  }, [resetKey]);

  const routeFor = (route) => {
    if (!route) return route;
    const routeMap = {
      "/": museumPath(tenantSlug, "home"),
      "/museum": museumPath(tenantSlug, "museum"),
      "/onboarding": museumPath(tenantSlug, "onboarding"),
      "/room-preview": museumPath(tenantSlug, "room-preview"),
      "/guide": museumPath(tenantSlug, "guide"),
      "/tickets": museumPath(tenantSlug, "tickets"),
      "/walkthrough": museumPath(tenantSlug, "walkthrough"),
      "/vendors": museumPath(tenantSlug, "vendors"),
      "/platform/overview": "/platform/overview",
      "/become-tenant": "/become-tenant",
      "/tenant-login": "/tenant-login",
      "/white-label": "/white-label",
    };
    return ROUTE_FOR_MAP_KEYS.includes(route) ? routeMap[route] : route;
  };

  const { data: experienceConfigs = [] } = useQuery({ queryKey: ["public-onboarding-config", activeTenant?.id], queryFn: () => activeTenant ? base44.entities.ExperienceConfig.filter(publicExperienceFilter(activeTenant.id)) : Promise.resolve([]), enabled: !!activeTenant });
  const onboardingConfig = experienceConfigs[0]?.onboarding_config;
  const useConfiguredFlow = onboardingConfig?.version === 2 && onboardingConfig?.mode === "audience_branching" && Array.isArray(onboardingConfig?.flows?.consumer) && Array.isArray(onboardingConfig?.flows?.franchisee) && onboardingConfig.flows.consumer.length > 0 && onboardingConfig.flows.franchisee.length > 0;

  const audienceSelector = useConfiguredFlow && onboardingConfig.audience_selector ? onboardingConfig.audience_selector : AUDIENCE_SELECTOR;
  const consumerSlides = useConfiguredFlow ? onboardingConfig.flows.consumer : FALLBACK_CONSUMER_SLIDES;
  const franchiseeSlides = useConfiguredFlow ? onboardingConfig.flows.franchisee : FALLBACK_FRANCHISEE_SLIDES;

  const isAudienceStage = audience === null;
  const rawSlides = audience === "franchisee" ? franchiseeSlides : audience === "consumer" ? consumerSlides : [audienceSelector];

  const configuredSlides = rawSlides.map((slide) => ({
    ...slide,
    route: routeFor(slide.route),
    quickLinks: slide.quickLinks?.map((link) => ({ ...link, route: routeFor(link.route) })),
    options: slide.options?.map((option) => ({ ...option, route: routeFor(option.route) })),
  }));

  const stage = configuredSlides[currentStage] || configuredSlides[0];
  const isLastStage = currentStage === configuredSlides.length - 1;

  useEffect(() => {
    onContextChange?.({ progress: (currentStage + 1) / configuredSlides.length, backgroundUrl: onboardingConfig?.background_url });
  }, [currentStage, configuredSlides.length, onboardingConfig?.background_url, onContextChange]);

  const canProceed = () => {
    if (!stage.options) return true;
    if (stage.multiSelect) return multiSelections.length > 0;
    return !!selections[stage.id];
  };

  const completionRouteForAudience = (selectedAudience) => {
    const option = audienceSelector.options?.find((opt) => opt.id === selectedAudience);
    if (option?.route_after_completion) return routeFor(option.route_after_completion);
    if (onboardingConfig?.default_completion_route) return routeFor(onboardingConfig.default_completion_route);
    return selectedAudience === "franchisee" ? routeFor("/become-tenant") : routeFor("/walkthrough");
  };

  const handleChangePath = () => {
    setAudience(null);
    setCurrentStage(0);
    setSelections({});
    setMultiSelections([]);
  };

  const handleSelect = async (optionId) => {
    if (isAudienceStage) {
      setAudience(optionId);
      setCurrentStage(0);
      setSelections({});
      setMultiSelections([]);
      base44.entities.AnalyticsEvent.create({ tenant_id: activeTenant?.id, tenant_name: activeTenant?.name, event_type: "onboarding_audience_selected", event_data: { audience: optionId }, source_page: "onboarding" }).catch(() => {});
      return;
    }

    const selectedOption = stage.options?.find((option) => option.id === optionId);
    if (isLastStage && selectedOption?.route) {
      const finalSelections = { ...selections, [stage.id]: optionId };
      setSelections(finalSelections);
      await base44.entities.OnboardingProgress.create({
        tenant_id: activeTenant?.id,
        tenant_name: activeTenant?.name,
        stage: "completed",
        completed_steps: configuredSlides.map((s) => s.id),
        preferences: { audience, interests: multiSelections, selected_options: finalSelections },
      });
      base44.entities.AnalyticsEvent.create({ tenant_id: activeTenant?.id, tenant_name: activeTenant?.name, event_type: "onboarding_step", event_data: { stage: "completed", audience }, source_page: "onboarding" }).catch(() => {});
      onNavigate(selectedOption.route);
      return;
    }
    if (stage.multiSelect) {
      setMultiSelections((prev) => prev.includes(optionId) ? prev.filter((x) => x !== optionId) : [...prev, optionId]);
    } else {
      setSelections((prev) => ({ ...prev, [stage.id]: optionId }));
    }
  };

  const handleNext = async () => {
    const progressData = {
      tenant_id: activeTenant?.id,
      tenant_name: activeTenant?.name,
      stage: genericStage(currentStage, configuredSlides.length),
      completed_steps: configuredSlides.slice(0, currentStage + 1).map((s) => s.id),
      preferences: { audience, interests: multiSelections, selected_options: selections },
    };

    await base44.entities.OnboardingProgress.create(isLastStage ? { ...progressData, stage: "completed", completed_steps: configuredSlides.map((s) => s.id) } : progressData);
    base44.entities.AnalyticsEvent.create({ tenant_id: activeTenant?.id, tenant_name: activeTenant?.name, event_type: "onboarding_step", event_data: { stage: isLastStage ? "completed" : stage.id, audience }, source_page: "onboarding" }).catch(() => {});

    if (isLastStage) {
      const finalChoice = stage.options?.find((option) => option.id === selections[stage.id]);
      onNavigate(finalChoice?.route || completionRouteForAudience(audience));
      return;
    }
    setCurrentStage((prev) => prev + 1);
  };

  return (
    <div className={`relative z-10 w-full ${className}`}>
      {!isAudienceStage && (
        <div className="mb-4 flex justify-center">
          <button type="button" onClick={handleChangePath} className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground">
            Change Path
          </button>
        </div>
      )}

      {showProgressDots && (
        <div className="flex gap-1.5 mb-10 justify-center">
          {configuredSlides.map((s, idx) => (
            <div
              key={s.id}
              className={`h-0.5 rounded-full transition-all duration-500 ${
                idx < currentStage ? "bg-primary w-8" : idx === currentStage ? "bg-primary w-12" : "bg-border/50 w-6"
              }`}
            />
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        <PremiumOnboardingStage
          key={`${audience || "selector"}-${stage.id}`}
          stage={stage}
          currentStage={currentStage}
          totalStages={configuredSlides.length}
          selections={selections}
          multiSelections={multiSelections}
          onSelect={handleSelect}
          onNext={handleNext}
          canProceed={canProceed}
          isLastStage={isLastStage}
        />
      </AnimatePresence>
    </div>
  );
}
