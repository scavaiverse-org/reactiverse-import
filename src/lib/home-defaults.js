export const defaultHomeConfig = {
  title: "SCAVerse Home",
  status: "published",
  eyebrow: "Visit From Anywhere",
  hero_title: "SCAVerse",
  hero_subtitle: "A virtual museum experience for culture, stories, tickets, vendors, and guided digital journeys.",
  hero_body: "SCAVerse helps people explore rich cultural and branded experiences from any device, while giving operators the tools to launch, manage, and scale public-ready digital destinations.",
  primary_cta_label: "Enter Public Platform",
  primary_cta_path: "/platform",
  secondary_cta_label: "Become a Tenant",
  secondary_cta_path: "/become-a-tenant",
  tertiary_cta_label: "Log In",
  tertiary_cta_path: "/login",
  background_image_url: "",
  mobile_hero_image_url: "",
  heroDesktopMediaId: "",
  heroTabletMediaId: "",
  heroMobileMediaId: "",
  highlightMediaId: "",
  visitCardMediaId: "",
  ariaCardMediaId: "",
  storiesCardMediaId: "",
  futureCardMediaId: "",
  finalCtaMediaId: "",
  mediaOverlayConfig: {
    overlayOpacity: 0.65,
    overlayColor: "6, 12, 24",
    blur: 0
  },
  heroSection: {
    visible: true,
    badge: "Visit From Anywhere",
    badgeMediaId: "",
    overlay: { overlayOpacity: 0.78, overlayColor: "6, 12, 24", overlayBlur: 0 }
  },
  museumHighlightsSection: {
    visible: true,
    eyebrow: "Platform for the public",
    title: "What SCAVerse Powers",
    description: "Create immersive destinations that combine storytelling, guided rooms, AI assistance, ticketing, vendor commerce, media, and analytics in one visitor-friendly platform.",
    backgroundMediaId: "",
    cardLayout: "single_cta",
    ctaLabel: "Explore the Experience",
    ctaRoute: "/walkthrough",
    overlay: { overlayOpacity: 0.12, overlayColor: "6, 12, 24", overlayBlur: 0 }
  },
  museumHighlightCards: [
    { key: "culture", title: "Virtual Experiences", subtitle: "Built for everyone", description: "Turn collections, venues, brands, and stories into beautiful online journeys that feel simple for any visitor to enter.", badge: "Experience", ctaLabel: "Explore", ctaRoute: "/walkthrough", backgroundMediaId: "", mobileMediaId: "", visible: true, sortOrder: 1, overlay: { overlayOpacity: 0.64, overlayColor: "6, 12, 24", overlayBlur: 1 } },
    { key: "costumes", title: "Content Management", subtitle: "Easy publishing", description: "Organize rooms, media, stories, highlights, and calls to action without needing a technical team for every update.", badge: "Content", ctaLabel: "Explore", ctaRoute: "/walkthrough", backgroundMediaId: "", mobileMediaId: "", visible: true, sortOrder: 2, overlay: { overlayOpacity: 0.64, overlayColor: "6, 12, 24", overlayBlur: 1 } },
    { key: "music", title: "AI Guide", subtitle: "Always available", description: "Give visitors a friendly guide that can answer questions, explain context, and support discovery throughout the experience.", badge: "AI", ctaLabel: "Ask Guide", ctaRoute: "/guide", backgroundMediaId: "", mobileMediaId: "", visible: true, sortOrder: 3, overlay: { overlayOpacity: 0.64, overlayColor: "6, 12, 24", overlayBlur: 1 } },
    { key: "performance", title: "Tickets & Commerce", subtitle: "Revenue ready", description: "Support bookings, paid access, vendors, merchandise, and partner opportunities from the same experience layer.", badge: "Revenue", ctaLabel: "View Tickets", ctaRoute: "/tickets", backgroundMediaId: "", mobileMediaId: "", visible: true, sortOrder: 4, overlay: { overlayOpacity: 0.64, overlayColor: "6, 12, 24", overlayBlur: 1 } },
    { key: "stories", title: "Analytics & Growth", subtitle: "Know your audience", description: "Track engagement, understand visitor behavior, and improve the experience with clear operational insights.", badge: "Growth", ctaLabel: "Learn More", ctaRoute: "/platform/analytics", backgroundMediaId: "", mobileMediaId: "", visible: true, sortOrder: 5, overlay: { overlayOpacity: 0.64, overlayColor: "6, 12, 24", overlayBlur: 1 } }
  ],
  whatYouCanDoSection: {
    visible: true,
    eyebrow: "Mass-market ready",
    title: "Everything needed to launch a digital destination.",
    description: "SCAVerse is designed for visitors, museums, attractions, brands, schools, and operators who need a polished platform that is easy to enter and simple to manage.",
    backgroundMediaId: "",
    overlay: { overlayOpacity: 0.1, overlayColor: "6, 12, 24", overlayBlur: 0 }
  },
  homeCards: [
    { key: "welcome", title: "Visit From Anywhere", subtitle: "Public access", description: "Let audiences enter from mobile, tablet, or desktop and enjoy a guided experience without friction.", badge: "Visit", ctaLabel: "Start Visit", ctaRoute: "/onboarding", backgroundMediaId: "", mobileMediaId: "", visible: true, sortOrder: 1, overlay: { overlayOpacity: 0.68, overlayColor: "6, 12, 24", overlayBlur: 2 } },
    { key: "rooms", title: "Build Your Experience", subtitle: "Rooms and journeys", description: "Create walkthroughs, featured sections, story paths, and media-led rooms that feel premium and clear.", badge: "Build", ctaLabel: "Enter Walkthrough", ctaRoute: "/walkthrough", backgroundMediaId: "", mobileMediaId: "", visible: true, sortOrder: 2, overlay: { overlayOpacity: 0.68, overlayColor: "6, 12, 24", overlayBlur: 2 } },
    { key: "aria", title: "Guide Every Visitor", subtitle: "AI support", description: "Use an AI guide to help people understand exhibits, services, tickets, and next steps in real time.", badge: "Guide", ctaLabel: "Ask SCAVerse Guide", ctaRoute: "/guide", backgroundMediaId: "", mobileMediaId: "", visible: true, sortOrder: 3, overlay: { overlayOpacity: 0.68, overlayColor: "6, 12, 24", overlayBlur: 2 } },
    { key: "tickets", title: "Grow Revenue", subtitle: "Tickets and vendors", description: "Connect experiences to bookings, commerce, vendors, campaigns, and visitor conversion opportunities.", badge: "Growth", ctaLabel: "View Tickets", ctaRoute: "/tickets", backgroundMediaId: "", mobileMediaId: "", visible: true, sortOrder: 4, overlay: { overlayOpacity: 0.68, overlayColor: "6, 12, 24", overlayBlur: 2 } }
  ],
  schoolsPartnersSection: {
    visible: true,
    eyebrow: "For visitors and operators",
    title: "A platform made for everyday audiences and serious operators.",
    description: "SCAVerse keeps the visitor journey simple while giving teams the structure to manage tenants, content, media, ticketing, vendors, analytics, and future expansion.",
    ctaLabel: "Explore Platform",
    route: "/platform/overview",
    showDeploymentSites: false,
    backgroundMediaId: "",
    overlay: { overlayOpacity: 0.1, overlayColor: "6, 12, 24", overlayBlur: 0 }
  },
  platformPreviewSection: {
    visible: false,
    title: "Built for Scale",
    description: "SCAVerse supports multi-tenant operations, branded experiences, public discovery, and admin control from one platform foundation.",
    ctaLabel: "Learn More",
    route: "/platform/overview",
    backgroundMediaId: "",
    overlay: { overlayOpacity: 0.58, overlayColor: "6, 12, 24", overlayBlur: 0 }
  },
  finalCtaSection: {
    visible: true,
    title: "SCAVerse turns digital experiences into public-ready destinations.",
    description: "Launch immersive rooms, AI-guided journeys, ticketing, vendors, analytics, and scalable tenant experiences from one polished platform.",
    buttonLabel: "Start Visit",
    buttonRoute: "/onboarding",
    backgroundMediaId: "",
    overlay: { overlayOpacity: 0.72, overlayColor: "6, 12, 24", overlayBlur: 2 }
  },
  metrics: [
    { value: "Visit", label: "Visit From Anywhere", detail: "Simple public entry from any device" },
    { value: "AI", label: "Guided discovery", detail: "Helpful answers throughout the journey" },
    { value: "Revenue", label: "Tickets and vendors", detail: "Built-in paths for bookings and commerce" },
    { value: "Scale", label: "Tenant-ready", detail: "Designed for many museums and experiences" }
  ],
  modules: [
    { title: "Virtual Rooms", description: "Immersive walkthroughs and story-led destinations.", tag: "01" },
    { title: "AI Guide", description: "Visitor support that explains, recommends, and guides.", tag: "02" },
    { title: "Tickets & Vendors", description: "Revenue-ready flows for bookings and partners.", tag: "03" },
    { title: "Analytics", description: "Clear insight into engagement and growth.", tag: "04" }
  ],
  pathways: [
    { label: "Explore Experiences", description: "Enter polished digital rooms built for public discovery and repeat engagement.", path: "/walkthrough" },
    { label: "Launch a Tenant", description: "Give each museum, attraction, or brand its own managed digital presence.", path: "/become-a-tenant" },
    { label: "Add an AI Guide", description: "Help visitors ask questions and understand the experience in real time.", path: "/guide" },
    { label: "Sell Tickets", description: "Connect interest to bookings, visit planning, groups, and paid access.", path: "/tickets" },
    { label: "Manage Vendors", description: "Support partners, marketplace opportunities, and experience-linked commerce.", path: "/vendors" },
    { label: "Track Growth", description: "Use analytics to understand audiences and improve performance over time.", path: "/platform/analytics" }
  ],
  deployment_sites: [
    { name: "Visitors", status: "Public ready" },
    { name: "Museums and attractions", status: "Tenant ready" },
    { name: "Brands and partners", status: "Growth ready" }
  ],
  final_cta_title: "SCAVerse turns digital experiences into public-ready destinations.",
  final_cta_body: "Launch immersive rooms, AI-guided journeys, ticketing, vendors, analytics, and scalable tenant experiences from one polished platform."
};