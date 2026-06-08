import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import CinematicEnvironment from "../components/onboarding/CinematicEnvironment";
import PremiumOnboardingStage from "../components/onboarding/PremiumOnboardingStage";
import { AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Ticket, Map, Store, Brain } from "lucide-react";
import { museumPath } from "@/lib/domain-registry";
import { publicExperienceFilter } from "@/lib/tenant-query";

const stages = [
  {
    id: "enter_museum",
    title: "Enter the Asian Operatic Museum",
    subtitle: "A virtual museum you can visit from home.",
    visual: "✦",
    content: "Explore stories, costumes, music, legends, and cultural memory through a guided digital museum journey.",
    cta: "Start My Visit",
    route: "/",
    quickLinks: [
      { label: "Preview Museum Room", route: "/room-preview" },
      { label: "Ask ARIA", route: "/guide" },
      { label: "View Tickets", route: "/tickets" },
    ],
    sensory: "Calm",
    reducedMotion: "Reduced motion shows a still museum entrance with text narration.",
  },
  {
    id: "what_this_is",
    title: "What This Museum Is",
    subtitle: "A digital museum built for people who cannot always visit in person.",
    visual: "◈",
    content: "The Asian Operatic Museum lets visitors explore cultural stories, exhibits, characters, music, and performances online. It is made for students, families, culture lovers, partners, and future museum visitors.",
    cta: "Show Me How It Works",
    route: "/museum",
    sensory: "Calm",
    reducedMotion: "Static explanation cards replace animated transitions.",
  },
  {
    id: "meet_aria",
    title: "Meet ARIA",
    subtitle: "Your AI cultural guide.",
    visual: "◎",
    content: "ARIA helps explain what you are seeing. You can ask about exhibits, costumes, characters, tickets, vendors, or where to go next. ARIA should only answer from verified museum content.",
    cta: "Meet ARIA",
    route: "/guide",
    sensory: "Calm",
    reducedMotion: "ARIA guidance remains text-first with no required animation.",
  },
  {
    id: "choose_interests",
    title: "Choose What You Like",
    subtitle: "Shape your visit around your interests.",
    visual: "⬡",
    content: "You can explore stories, costumes, music, stagecraft, legends, royal histories, cultural objects, and future digital preservation.",
    cta: "Choose My Interests",
    route: "/museum",
    sensory: "Calm",
    reducedMotion: "Interest choices stay simple, still, and mobile-safe.",
    multiSelect: true,
    options: [
      { id: "opera", label: "Opera traditions" },
      { id: "costumes", label: "Costume symbolism" },
      { id: "music", label: "Music and rhythm" },
      { id: "heroes", label: "Heroes and legends" },
      { id: "stage", label: "Stage design" },
      { id: "market", label: "Cultural marketplace" },
      { id: "preservation", label: "Digital preservation" },
      { id: "learning", label: "School learning" },
    ],
  },
  {
    id: "walkthrough_preview",
    title: "Preview the Virtual Walkthrough",
    subtitle: "Move through the museum one scene at a time.",
    visual: "▣",
    content: "The walkthrough is a guided path through museum scenes. You can tap hotspots, open story panels, ask ARIA questions, and move at your own pace.",
    cta: "Preview Museum Room",
    route: "/room-preview",
    sensory: "Calm",
    reducedMotion: "Reduced motion presents each scene as a still card with clear text.",
  },
  {
    id: "understand_access",
    title: "Understand Access",
    subtitle: "Choose free preview or deeper guided access.",
    visual: "◉",
    content: "Some museum experiences can be previewed for free. Deeper guided access, premium journeys, school packages, and corporate access can be set through the ticketing system.",
    cta: "View Access Options",
    route: "/tickets",
    sensory: "Calm",
    reducedMotion: "Ticket choices remain simple, readable cards.",
  },
  {
    id: "wider_ecosystem",
    title: "Explore the Wider Ecosystem",
    subtitle: "This museum can also support vendors, schools, partners, and future museums.",
    visual: "✧",
    content: "The platform is designed to support cultural vendors, education partners, digital exhibits, marketplace activity, visitor activity reports, and future museum deployments.",
    cta: "See the Ecosystem",
    route: "/platform",
    sensory: "Calm",
    reducedMotion: "Ecosystem options are shown as still cards.",
  },
  {
    id: "begin_journey",
    title: "Begin Your Museum Journey",
    subtitle: "You are ready to enter.",
    visual: "◆",
    content: "Start with the walkthrough, ask ARIA for help, explore ticket options, or learn how this platform can support other museums.",
    cta: "Enter Walkthrough",
    route: "/walkthrough",
    sensory: "Calm",
    reducedMotion: "Final choices remain static and keyboard-friendly.",
    options: [
      { id: "walkthrough", icon: Map, label: "Enter Walkthrough", desc: "Start the guided museum path", route: "/walkthrough" },
      { id: "guide", icon: Brain, label: "Ask ARIA", desc: "Ask the museum guide for help", route: "/guide" },
      { id: "tickets", icon: Ticket, label: "View Tickets", desc: "See free and paid access options", route: "/tickets" },
      { id: "platform", icon: Store, label: "View Platform", desc: "Learn how this supports other museums", route: "/platform" },
    ],
  },
];

export default function Onboarding() {
  const [currentStage, setCurrentStage] = useState(0);
  const [selections, setSelections] = useState({});
  const [multiSelections, setMultiSelections] = useState([]);
  const navigate = useNavigate();
  const { tenant: activeTenant } = useActiveTenant();
  const tenantSlug = activeTenant?.slug || "asian-operatic-museum";
  const routeFor = (route) => {
    const routeMap = {
      "/": museumPath(tenantSlug, "home"),
      "/museum": museumPath(tenantSlug, "museum"),
      "/onboarding": museumPath(tenantSlug, "onboarding"),
      "/room-preview": museumPath(tenantSlug, "room-preview"),
      "/guide": museumPath(tenantSlug, "guide"),
      "/tickets": museumPath(tenantSlug, "tickets"),
      "/walkthrough": museumPath(tenantSlug, "walkthrough"),
      "/platform": "/platform/overview",
    };
    return routeMap[route] || route;
  };
  const { data: experienceConfigs = [] } = useQuery({ queryKey: ["public-onboarding-config", activeTenant?.id], queryFn: () => activeTenant ? base44.entities.ExperienceConfig.filter(publicExperienceFilter(activeTenant.id)) : Promise.resolve([]), enabled: !!activeTenant });
  const onboardingConfig = experienceConfigs[0]?.onboarding_config;
  const rawSlides = Array.isArray(onboardingConfig?.slides) && onboardingConfig.slides.length >= 8
    ? onboardingConfig.slides.map((slide, index) => ({
        ...stages[index % stages.length],
        ...slide,
        content: slide.content || slide.body || stages[index % stages.length].content,
        cta: slide.cta || slide.cta_label || stages[index % stages.length].cta,
        visual: slide.visual || slide.visual_symbol || stages[index % stages.length].visual,
        sensory: slide.sensory || slide.sensory_intensity || stages[index % stages.length].sensory,
        reducedMotion: slide.reducedMotion || slide.reduced_motion_alternative || stages[index % stages.length].reducedMotion,
      }))
    : stages;
  const configuredSlides = rawSlides.map((slide) => ({
    ...slide,
    route: routeFor(slide.route),
    quickLinks: slide.quickLinks?.map((link) => ({ ...link, route: routeFor(link.route) })),
    options: slide.options?.map((option) => ({ ...option, route: routeFor(option.route) })),
  }));

  const stage = configuredSlides[currentStage];
  const isLastStage = currentStage === configuredSlides.length - 1;

  const canProceed = () => {
    if (!stage.options) return true;
    if (stage.multiSelect) return multiSelections.length > 0;
    return !!selections[stage.id];
  };

  const handleSelect = async (optionId) => {
    const selectedOption = stage.options?.find((option) => option.id === optionId);
    if (isLastStage && selectedOption?.route) {
      setSelections((prev) => ({ ...prev, [stage.id]: optionId }));
      await base44.entities.OnboardingProgress.create({
        tenant_id: activeTenant?.id,
        tenant_name: activeTenant?.name,
        stage: "completed",
        completed_steps: configuredSlides.map((s) => s.id),
        preferences: {
          interests: multiSelections,
          visit_type: selections["choose_interests"] || null,
        },
      });
      base44.entities.AnalyticsEvent.create({ tenant_id: activeTenant?.id, tenant_name: activeTenant?.name, event_type: "onboarding_step", event_data: { stage: "completed" }, source_page: "onboarding" }).catch(() => {});
      navigate(selectedOption.route);
      return;
    }
    if (stage.multiSelect) {
      setMultiSelections((prev) =>
        prev.includes(optionId) ? prev.filter((x) => x !== optionId) : [...prev, optionId]
      );
    } else {
      setSelections((prev) => ({ ...prev, [stage.id]: optionId }));
    }
  };

  const handleNext = async () => {
    // Save progress to entity
    const progressData = {
      tenant_id: activeTenant?.id,
      tenant_name: activeTenant?.name,
      stage: stage.id,
      completed_steps: configuredSlides.slice(0, currentStage + 1).map(s => s.id),
      preferences: {
        interests: multiSelections,
        visit_type: selections["choose_interests"] || null,
      },
    };

    await base44.entities.OnboardingProgress.create(isLastStage ? { ...progressData, stage: "completed", completed_steps: configuredSlides.map(s => s.id) } : progressData);
    base44.entities.AnalyticsEvent.create({ tenant_id: activeTenant?.id, tenant_name: activeTenant?.name, event_type: "onboarding_step", event_data: { stage: isLastStage ? "completed" : stage.id }, source_page: "onboarding" }).catch(() => {});

    if (isLastStage) {
      const finalChoice = stage.options?.find((option) => option.id === selections[stage.id]);
      const accessTier = selections["access_pass"];
      if (finalChoice?.route) {
        navigate(finalChoice.route);
      } else if (accessTier === "virtual" || accessTier === "premium" || accessTier === "group") {
        navigate(routeFor("/tickets"));
      } else {
        navigate(stage.route || routeFor(onboardingConfig?.completion_route || "/museum"));
      }
      return;
    }
    setCurrentStage((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <CinematicEnvironment progress={(currentStage + 1) / configuredSlides.length} backgroundUrl={onboardingConfig?.background_url} />

      <div className="relative z-10 w-full max-w-3xl">
        {/* Progress bar */}
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

        <AnimatePresence mode="wait">
          <PremiumOnboardingStage
            key={stage.id}
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
    </div>
  );
}