import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import PremiumOnboardingStage from "./PremiumOnboardingStage";
import { AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Map, Compass, Building2, Globe, KeyRound } from "lucide-react";
import { museumPath } from "@/lib/domain-registry";
import { publicExperienceFilter } from "@/lib/tenant-query";

const AUDIENCE_SELECTOR = {
  id: "choose_audience",
  title: "How would you like to use SCAVers?",
  subtitle: "Choose your path. We will guide you from here.",
  visual: "◇",
  content: "SCAVers connects visitors with immersive experiences, and gives tenants the tools to launch, manage, and grow their own spaces.",
  cta: "Continue",
  animation: "Two large glass cards sit side by side — Consumer carries compass/map/ticket energy, Tenant carries building/dashboard/key energy. The chosen card expands and the background shifts from a neutral platform glow into that pathway's mood.",
  options: [
    { id: "consumer", icon: Compass, label: "I am a Consumer", desc: "I want to discover places, experiences, stories, rewards, and things to do.", route_after_completion: "/" },
    { id: "franchisee", icon: Building2, label: "I am a Franchisee / Tenant", desc: "I want to understand how to list, manage, and grow my own space inside SCAVers.", route_after_completion: "/become-tenant" },
  ],
};

const FALLBACK_CONSUMER_SLIDES = [
  {
    id: "consumer_welcome",
    audience: "consumer",
    title: "Welcome to SCAVers",
    subtitle: "Your entry point into immersive places and experiences.",
    visual: "✦",
    content: "SCAVers helps you discover museums, cultural spaces, pop-ups, shops, events, and interactive experiences in one simple journey.",
    cta: "Start exploring",
    animation: "A dark cinematic city/map grid fades in and glowing pins appear one by one — each pin a place or experience — as the selected Consumer card visually transforms into the map.",
    route: "/",
  },
  {
    id: "consumer_discovery",
    audience: "consumer",
    title: "Discover What Is Around You",
    subtitle: "Find experiences without needing to search everywhere.",
    visual: "◎",
    content: "Browse featured spaces, hidden gems, tenant museums, events, food spots, retail activations, and cultural experiences from one SCAVers gateway.",
    cta: "Show me discovery",
    animation: "Floating cards slide in from the left and right representing Museums, Events, Food, Retail, and Hidden Gems, then settle into a carousel/grid with a soft hover glow on desktop and tap feedback on mobile.",
    route: "/virtual-experience",
  },
  {
    id: "consumer_passport",
    audience: "consumer",
    title: "Collect Stamps and Rewards",
    subtitle: "Your visits can become a journey.",
    visual: "◉",
    content: "SCAVers can turn visits into stamps, missions, rewards, collectibles, discounts, and progress. Every place can become part of your personal trail.",
    cta: "See rewards",
    animation: "A digital passport opens and stamp marks appear one by one while a progress ring fills toward the value below, with a small \"Reward unlocked\" badge appearing near the CTA.",
    progress: 60,
    route: "/",
  },
  {
    id: "consumer_personalisation",
    audience: "consumer",
    title: "Follow Your Interests",
    subtitle: "SCAVers learns what kind of experiences you enjoy.",
    visual: "◆",
    content: "Choose what you like: art, heritage, food, family activities, shopping, nightlife, learning, games, or local discoveries. SCAVers can guide you better from there.",
    cta: "Pick my interests",
    multiSelect: true,
    animation: "Interest bubbles float slowly; selected bubbles glow and drift toward the center.",
    reducedMotion: "With reduced motion enabled, selected interests simply highlight in place without floating.",
    options: [
      { id: "art", label: "Art" },
      { id: "heritage", label: "Heritage" },
      { id: "food", label: "Food" },
      { id: "shopping", label: "Shopping" },
      { id: "family", label: "Family" },
      { id: "learning", label: "Learning" },
      { id: "games", label: "Games" },
      { id: "events", label: "Events" },
      { id: "hidden_gems", label: "Hidden Gems" },
    ],
  },
  {
    id: "consumer_ready",
    audience: "consumer",
    title: "You Are Ready to Explore",
    subtitle: "Enter SCAVers and start your journey.",
    visual: "⬢",
    content: "Start with discovery, explore a tenant space like AOM, collect rewards, or follow a trail built around your interests.",
    cta: "Enter SCAVers",
    optionsOptional: true,
    animation: "The onboarding card zooms into a preview of the SCAVers home/discovery feed; three panels appear for Nearby Experiences, Featured Tenant, and Rewards, then the final CTA glows once before navigating.",
    route: "/",
    options: [
      { id: "explore", icon: Compass, label: "Explore SCAVers", desc: "Go to the main discovery gateway", route: "/" },
      { id: "tenants", icon: Map, label: "View Experiences", desc: "Browse available tenant spaces and experiences", route: "/virtual-experience" },
      { id: "aom", icon: Building2, label: "Visit AOM", desc: "Open the AOM tenant experience", route: "/museum" },
    ],
  },
];

const FALLBACK_FRANCHISEE_SLIDES = [
  {
    id: "tenant_welcome",
    audience: "franchisee",
    title: "Launch Your Space on SCAVers",
    subtitle: "Turn your location, brand, or collection into a discoverable experience.",
    visual: "◇",
    content: "SCAVers gives tenants a platform layer to present their space, attract visitors, manage content, and build interactive journeys.",
    cta: "Build my presence",
    animation: "A plain storefront/gallery card appears, then transforms into a polished SCAVers listing with a glowing outline as it \"goes live\".",
    route: "/platform/overview",
  },
  {
    id: "tenant_profile",
    audience: "franchisee",
    title: "Create Your Tenant Profile",
    subtitle: "Show people who you are and why they should visit.",
    visual: "▣",
    content: "Add your name, category, story, location, images, opening details, visitor information, and featured experiences.",
    cta: "Show profile setup",
    animation: "Profile builder fields fill in one by one — Name, Category, Story, Photos, Location — while image placeholders drop into a gallery grid.",
    route: "/become-tenant",
  },
  {
    id: "tenant_experience_builder",
    audience: "franchisee",
    title: "Build Your Experience",
    subtitle: "Create the journey visitors will follow.",
    visual: "▦",
    content: "Tenants can structure rooms, pages, walkthroughs, exhibits, tickets, vendors, learning moments, and interactive stops.",
    cta: "Show experience tools",
    animation: "A flow map of connected nodes — Home, Tickets, Walkthrough, Guide, Vendors, Rewards — links together with animated lines, and the \"Published path\" line glows once complete.",
    route: "/become-tenant",
  },
  {
    id: "tenant_growth",
    audience: "franchisee",
    title: "Attract and Engage Visitors",
    subtitle: "Use discovery, rewards, and storytelling to bring people in.",
    visual: "◈",
    content: "SCAVers can help tenants appear in discovery feeds, themed trails, featured sections, reward loops, and visitor journeys.",
    cta: "Show growth tools",
    animation: "Map dots move toward the tenant location while a spotlight highlights the tenant card; reward icons and visitor counters rise gently across metric cards for Views, Saves, Visits, and Redemptions.",
    route: "/platform/overview",
  },
  {
    id: "tenant_ready",
    audience: "franchisee",
    title: "Ready to Join SCAVers",
    subtitle: "Start your tenant journey.",
    visual: "⬢",
    content: "Apply to become a tenant, explore the platform overview, or log in if you already manage a tenant space.",
    cta: "Continue",
    optionsOptional: true,
    animation: "The onboarding view fades into a partner dashboard preview; dashboard cards for Profile, Experience Builder, Visitors, and Rewards animate upward, so the final CTA feels like a launch moment rather than an abrupt exit.",
    route: "/become-tenant",
    options: [
      { id: "apply", icon: Building2, label: "Become a Tenant", desc: "Start the application path", route: "/become-tenant" },
      { id: "overview", icon: Globe, label: "View Platform Overview", desc: "Understand how SCAVers works", route: "/platform/overview" },
      { id: "login", icon: KeyRound, label: "Tenant Login", desc: "Access an existing tenant dashboard", route: "/tenant-login" },
    ],
  },
];

const ROUTE_FOR_MAP_KEYS = ["/museum", "/onboarding", "/room-preview", "/guide", "/tickets", "/walkthrough", "/vendors", "/platform/overview", "/become-tenant", "/tenant-login", "/white-label", "/virtual-experience"];

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
export default function OnboardingFlow({ onNavigate, resetKey, showProgressDots = true, className = "", onContextChange, reduceMotion = false }) {
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
      "/museum": museumPath(tenantSlug, "museum"),
      "/onboarding": museumPath(tenantSlug, "onboarding"),
      "/room-preview": museumPath(tenantSlug, "room-preview"),
      "/guide": museumPath(tenantSlug, "guide"),
      "/tickets": museumPath(tenantSlug, "tickets"),
      "/walkthrough": museumPath(tenantSlug, "walkthrough"),
      "/vendors": museumPath(tenantSlug, "vendors"),
      "/platform/overview": "/platform/overview",
      "/become-tenant": "/become-a-tenant",
      "/tenant-login": "/tenant-login",
      "/white-label": "/white-label",
      "/virtual-experience": "/virtual-experience",
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
    if (stage.optionsOptional) return true;
    if (stage.multiSelect) return multiSelections.length > 0;
    return !!selections[stage.id];
  };

  const completionRouteForAudience = (selectedAudience) => {
    const option = audienceSelector.options?.find((opt) => opt.id === selectedAudience);
    if (option?.route_after_completion) return routeFor(option.route_after_completion);
    if (onboardingConfig?.default_completion_route) return routeFor(onboardingConfig.default_completion_route);
    return selectedAudience === "franchisee" ? routeFor("/become-tenant") : routeFor("/");
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
          reduceMotion={reduceMotion}
        />
      </AnimatePresence>
    </div>
  );
}
