import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import ThreeBackground from "../components/layout/ThreeBackground";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { Bot, Send, Sparkles, Landmark, Ticket, Store, BookOpen, MapPin, ArrowLeft, ShoppingBag } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { DEFAULT_MUSEUM_SLUG, museumPath } from "@/lib/domain-registry";
import { supabaseUrl } from "@/lib/supabase";

const FALLBACK_QUICK_PROMPTS = [
  { label: "Which ticket should I choose?", icon: Ticket },
  { label: "Compare virtual, VIP, family, and group tickets", icon: Ticket },
  { label: "What add-ons are available?", icon: ShoppingBag },
  { label: "How do vendor partnerships work?", icon: Store },
  { label: "What accessibility options can I request?", icon: MapPin },
  { label: "Tell me about the walkthrough", icon: BookOpen },
];

const DEFAULT_ADD_ONS = [
  { id: "guided_tour", title: "Guided Tour Upgrade", price: 20, desc: "Add a guided route with curated narration." },
  { id: "ai_docent", title: "AI Docent Priority", price: 12, desc: "Priority support for ticket, access, and exhibit questions." },
  { id: "premium_content", title: "Premium Content Pass", price: 15, desc: "Unlock extended media and digital resources." },
  { id: "family_pack", title: "Family Activity Pack", price: 18, desc: "Family-friendly prompts and shared activities." },
  { id: "merch_bundle", title: "Merchandise Bundle", price: 35, desc: "Ticket-linked cultural goods and gifts." },
  { id: "event_access", title: "Event Access", price: 28, desc: "Add limited cultural event access when available." },
];

const knowledgeBase = {
  "what is the aom": "The Asian Operatic Museum (AOM) is Southeast Asia's premier digital-first cultural institution, dedicated to the heritage of Asian opera traditions — from Peking Opera and Cantonese opera to Malay, Javanese, and regional performing arts. Located in Singapore, AOM bridges traditional heritage with modern cultural technology.",
  "how do i get tickets": "You can purchase tickets directly on our platform. We offer Virtual General Access (SGD 18), Virtual Premium Experience (SGD 38), Physical Visit (SGD 25), Physical VIP (SGD 68), and Group/Corporate packages.",
  "tell me about the walkthrough": "Our Virtual Walkthrough takes you through immersive stations with cinematic imagery, guided narration, and interactive hotspots.",
  "how can vendors join": "Vendors can register through our Vendor Ecosystem page. We offer Standard, Premium, Featured, and Anchor Sponsor tiers with marketplace placement, AI-powered recommendations, and revenue analytics.",
  "what is chinese opera": "Chinese opera is one of the world's oldest theatrical traditions, dating back over 2,000 years. It combines music, vocal performance, mime, dance, and acrobatics. Key regional styles include Peking Opera, Cantonese Opera, Hokkien Opera, and Teochew Opera.",
  "what makes scaverse unique": "SCAVerse is a cultural technology platform combining AI-guided onboarding, virtual walkthroughs, experiential commerce, vendor ecosystems, and white-label regional deployment capabilities.",
};

const PROMPT_ICONS = { Ticket, ShoppingBag, Store, MapPin, BookOpen, Landmark, Bot, Sparkles };

function getSection(config, keys = []) {
  return (config?.sections || []).find((section) => keys.includes(section.sectionKey) || keys.includes(section.key)) || {};
}

function resolvePromptIcon(iconName) {
  return PROMPT_ICONS[iconName] || Sparkles;
}

function resolveAIGuideCtaPath(cta, tenantSlug) {
  const label = String(cta?.label || cta?.title || cta?.ctaLabel || "").toLowerCase();
  const path = cta?.path || cta?.route || cta?.url || cta?.ctaPath || "";
  const museumHomePath = museumPath(tenantSlug, "home");

  if (label.includes("view museum") || label.includes("museum home") || label === "museum" || path === "/museum" || path === "museum") {
    return museumHomePath;
  }

  if (!path) return museumHomePath;
  if (/^https?:\/\//i.test(path)) return path;
  if (path === "/museum/:tenantSlug" || path === "/museum/:tenantSlug/museum") return museumHomePath;
  if (/^\/museum\/[^/]+\/?$/.test(path) || /^\/museum\/[^/]+\/museum\/?$/.test(path)) return museumHomePath;
  if (path.startsWith("/museum/:tenantSlug")) return path.replace("/museum/:tenantSlug", `/museum/${tenantSlug}`);
  if (path.startsWith("/museum/")) return path;
  return museumPath(tenantSlug, path.replace(/^\//, ""));
}

function resolveAIGuidePageContent(config, tenant, tenantSlug, guideName) {
  const hasConfig = !!config?.id;
  const heroSection = getSection(config, ["hero", "ai_guide_hero", "guide_hero"]);
  const welcomeSection = getSection(config, ["welcome", "intro", "chat_welcome", "ai_guide_intro"]);
  const promptCards = (config?.cards || []).filter((card) => card.sectionKey === "quick_prompts" || card.cardType === "quick_prompt" || card.type === "quick_prompt");
  const ctaSlots = (config?.ctaSlots || []).filter((cta) => !cta.sectionKey || cta.sectionKey === "footer" || cta.sectionKey === "ai_guide_footer");

  if (!hasConfig) {
    return {
      hasConfig,
      headerTitle: `${guideName} — AI Cultural Guide`,
      statusLabel: `Online · ${tenant?.name || "Museum"}`,
      heroEyebrow: "ARIA AI Guide",
      heroTitle: "Ask About Tickets",
      heroBody: "ARIA explains ticket types, access, add-ons, vendor options, and tour next steps. Ask a simple question about tickets, planning, accessibility, shop bundles, or vendor partnerships.",
      welcomeText: `Welcome to ${tenant?.name || "the museum"}. I am ${guideName}, your AI Cultural Guide — here to help you discover heritage collections, plan your visit, explore tickets, or understand Asian opera traditions. How may I assist you today?`,
      promptIntro: "Suggested questions",
      quickPrompts: FALLBACK_QUICK_PROMPTS,
      inputPlaceholder: "Ask about exhibits, tickets, vendors, or Asian opera culture...",
      footerCtas: [
        { label: "Get Tickets", path: museumPath(tenantSlug, "tickets"), icon: Ticket, moduleKey: "ticketing" },
        { label: "Compare Tickets", path: museumPath(tenantSlug, "tickets-2"), icon: MapPin, moduleKey: "walkthrough" },
        { label: "View Museum", path: museumPath(tenantSlug, "home"), icon: Landmark },
      ],
    };
  }

  return {
    hasConfig,
    headerTitle: config.pageTitle || heroSection.title || guideName,
    statusLabel: config.pageName || tenant?.name || "Museum",
    heroEyebrow: heroSection.eyebrow || config.pageName || "AI Guide",
    heroTitle: heroSection.title || config.pageTitle || "",
    heroBody: heroSection.body || heroSection.description || heroSection.subtitle || config.pageContent || "",
    welcomeText: welcomeSection.body || welcomeSection.description || config.pageContent || heroSection.description || heroSection.body || "How may I assist you today?",
    promptIntro: getSection(config, ["quick_prompts"]).title || "",
    quickPrompts: promptCards.map((card) => ({
      label: card.prompt || card.question || card.label || card.title || card.body,
      icon: resolvePromptIcon(card.icon),
    })).filter((prompt) => !!prompt.label),
    inputPlaceholder: getSection(config, ["input", "chat_input"]).placeholder || "Ask your question...",
    footerCtas: (() => {
      const configuredCtas = ctaSlots.map((cta) => ({
        label: cta.label || cta.title || cta.ctaLabel,
        path: resolveAIGuideCtaPath(cta, tenantSlug),
        icon: resolvePromptIcon(cta.icon),
        moduleKey: cta.moduleKey,
      })).filter((cta) => !!cta.label);
      return configuredCtas.length ? configuredCtas : [
        { label: "Get Tickets", path: museumPath(tenantSlug, "tickets"), icon: Ticket, moduleKey: "ticketing" },
        { label: "Begin Tour", path: museumPath(tenantSlug, "begin-tour"), icon: BookOpen, moduleKey: "walkthrough" },
        { label: "View Museum", path: museumPath(tenantSlug, "home"), icon: Landmark },
      ];
    })(),
  };
}

function normalizeAddOns(config = {}) {
  const configured = config.add_ons || config.addons || config.experience_upgrades || config.upgrades;
  const source = Array.isArray(configured) && configured.length ? configured : DEFAULT_ADD_ONS;
  return source.filter((item) => item?.enabled !== false).map((item, index) => ({
    id: item.id || item.key || `addon_${index + 1}`,
    title: item.title || item.label || item.name || `Add-on ${index + 1}`,
    price: item.price,
    desc: item.desc || item.description || item.body || "Experience upgrade available for eligible visits.",
  }));
}

function isFollowUp(message = "") {
  return /^(yes|yeah|yep|sure|continue|tell me more|more|please do|go on|show me)$/i.test(message.trim());
}

function recentTopic(history = []) {
  const explicitTopic = [...history].reverse().find((msg) => msg.role === "assistant" && msg.topic)?.topic;
  if (explicitTopic) return explicitTopic;
  const recentText = history.slice(-6).map((msg) => msg.content || "").join(" ").toLowerCase();
  if (/add-?ons?|upgrades?|premium content|guided tour|ai docent|merchandise bundle|event access/.test(recentText)) return "addons";
  if (/tickets?|pricing|price|reserve|visit date/.test(recentText)) return "tickets";
  if (/walkthrough|tour|begin tour|stations?/.test(recentText)) return "walkthrough";
  return "general";
}

function findAnswer(query) {
  const q = query.toLowerCase();
  for (const [key, answer] of Object.entries(knowledgeBase)) {
    if (q.includes(key) || key.split(" ").some(word => word.length > 4 && q.includes(word))) {
      return answer;
    }
  }
  return null;
}

function createLocalResponse(message, history, addOns, tenantSlug) {
  const q = message.toLowerCase();
  const topic = isFollowUp(message) ? recentTopic(history) : "";
  if (topic === "addons" || /add-?ons?|upgrades?|premium content|guided tour|ai docent|merchandise|event access|bundle/.test(q)) {
    const names = addOns.map((addon) => `${addon.title}${addon.price ? ` (SGD ${addon.price})` : ""}`).join(", ");
    return {
      content: `Available add-ons include ${names}. These upgrades can add guided narration, priority AI docent support, premium content, family activities, merchandise bundles, or event access depending on your visit.`,
      ctas: [{ label: "View Add-ons", path: museumPath(tenantSlug, "tickets-4") }],
      topic: "addons",
    };
  }
  if (topic === "tickets" || /tickets?|pricing|price|reserve|book|visit/.test(q)) {
    return { content: `${knowledgeBase["how do i get tickets"]} You can compare options, plan your visit, and add upgrades from the ticket flow.`, ctas: [{ label: "View Tickets", path: museumPath(tenantSlug, "tickets") }], topic: "tickets" };
  }
  if (topic === "walkthrough" || /walkthrough|begin tour|virtual tour|stations?|experience/.test(q)) {
    return { content: knowledgeBase["tell me about the walkthrough"], ctas: [{ label: "Begin Tour", path: museumPath(tenantSlug, "begin-tour") }], topic: "walkthrough" };
  }
  const known = findAnswer(message);
  return known ? { content: known, ctas: [], topic: "general" } : null;
}

function loadStoredMessages(storageKey) {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) || "[]");
    return Array.isArray(parsed) ? parsed.filter((msg) => ["user", "assistant"].includes(msg.role) && msg.content).slice(-40) : [];
  } catch {
    return [];
  }
}

function saveStoredMessages(storageKey, messages) {
  if (typeof window === "undefined" || !messages.length) return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(messages.slice(-40)));
  } catch {
    // Ignore storage limits so chat still works in-memory.
  }
}

async function getAIResponse(message, guideConfig, tenant, conversationHistory = [], addOns = [], tenantSlug = DEFAULT_MUSEUM_SLUG) {
  const local = createLocalResponse(message, conversationHistory, addOns, tenantSlug);
  if (local) return local;
  const fallback = guideConfig?.fallback_answer || "I don't have that information, but I can connect you with our team.";
  if (!supabaseUrl) {
    return { content: fallback, ctas: [], topic: "general" };
  }
  // The edge function resolves guide identity, personality, fallback copy,
  // approved knowledge, and add-ons server-side from the tenant's published
  // config — only the tenant id, prompt, and conversation history are sent.
  const res = await fetch(`${supabaseUrl}/functions/v1/cultural-guide`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: message,
      tenant_id: tenant?.id || "",
      conversation_history: conversationHistory.slice(-10).map((msg) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      })),
    }),
  });
  const data = res.ok ? await res.json().catch(() => ({})) : {};
  const content = data?.text || fallback;
  return { content, ctas: [], topic: "general" };
}

export default function AIGuide() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tenant, isModuleEnabled } = useActiveTenant();
  const tenantSlug = tenant?.slug || DEFAULT_MUSEUM_SLUG;
  const { data: pageConfigs = [] } = useQuery({
    queryKey: ["public-ai-guide-page-config", tenant?.id],
    queryFn: () => tenant ? base44.entities.MuseumPageConfig.filter({ tenantId: tenant.id, pageKey: "ai_guide", publishState: "published" }, "-lastPublishedAt", 1) : Promise.resolve([]),
    enabled: !!tenant?.id,
    initialData: [],
  });
  const { data: experienceConfigs = [] } = useQuery({
    queryKey: ["public-ai-guide-config", tenant?.id],
    queryFn: () => tenant ? base44.entities.ExperienceConfig.filter({ tenant_id: tenant.id, module_key: "ai_guide", status: "published" }, "-updated_at", 1) : Promise.resolve([]),
    enabled: !!tenant?.id,
    initialData: [],
  });
  const { data: ticketModuleConfigs = [] } = useQuery({
    queryKey: ["ai-guide-ticket-module-config", tenant?.id],
    queryFn: () => tenant ? base44.entities.ModuleConfig.filter({ tenant_id: tenant.id, module_key: "ticketing" }) : Promise.resolve([]),
    enabled: !!tenant?.id,
    initialData: [],
  });
  const guideConfig = experienceConfigs[0]?.ai_guide_config || {};
  const addOns = useMemo(() => normalizeAddOns(ticketModuleConfigs[0]?.config_json || {}), [ticketModuleConfigs]);
  const guideName = guideConfig.guide_name || "ARIA";
  const guideContent = useMemo(() => resolveAIGuidePageContent(pageConfigs[0], tenant, tenantSlug, guideName), [pageConfigs, tenant, tenantSlug, guideName]);
  const initialPrompt = new URLSearchParams(window.location.search).get("prompt");
  const storageKey = useMemo(() => `aria-ai-guide-chat:${tenantSlug}`, [tenantSlug]);
  const welcomeMessage = useMemo(() => initialPrompt
    ? `Welcome back from the walkthrough. I am ${guideName}, and I can help with: “${initialPrompt}”`
    : guideContent.welcomeText, [guideContent.welcomeText, guideName, initialPrompt]);
  const backPath = useMemo(() => {
    const source = new URLSearchParams(location.search).get("source") || new URLSearchParams(location.search).get("from");
    if (source === "platform" || source === "consumer") return "/virtual-experience";
    if (typeof window !== "undefined") {
      const previousPath = window.sessionStorage.getItem("scaverse_previous_path") || window.sessionStorage.getItem("scaverse_current_path") || "";
      if (previousPath && !previousPath.startsWith("/museum/")) return "/virtual-experience";
    }
    if (typeof document !== "undefined") {
      try {
        const referrer = document.referrer ? new URL(document.referrer) : null;
        if (referrer?.origin === window.location.origin && !referrer.pathname.startsWith("/museum/")) return "/virtual-experience";
      } catch {
        // Keep safe tenant fallback.
      }
    }
    return tenant?.slug ? museumPath(tenant.slug, "home") : "/virtual-experience";
  }, [location.search, tenant?.slug]);
  const safeFooterCtas = useMemo(() => guideContent.footerCtas.map((cta) => {
    const isMuseumCta = String(cta.label || "").toLowerCase().includes("museum");
    if (isMuseumCta && !tenant?.slug) return { ...cta, label: "Available Museums", path: "/virtual-experience" };
    return cta;
  }), [guideContent.footerCtas, tenant?.slug]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const requestLockRef = useRef(false);
  const initialPromptSentRef = useRef("");

  useEffect(() => {
    const storedMessages = loadStoredMessages(storageKey);
    setMessages(storedMessages.length ? storedMessages : [{ role: "assistant", content: welcomeMessage }]);
  }, [storageKey, welcomeMessage]);

  useEffect(() => {
    saveStoredMessages(storageKey, messages);
  }, [messages, storageKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    base44.entities.AnalyticsEvent.create({ tenant_id: tenant?.id, tenant_name: tenant?.name, event_type: "ai_guide_interaction", event_data: initialPrompt ? { source: "walkthrough", prompt: initialPrompt } : {}, source_page: "guide" }).catch(() => {});
  }, [tenant?.id]);

  useEffect(() => {
    if (initialPrompt && tenant?.id && messages.length === 1 && initialPromptSentRef.current !== storageKey) {
      initialPromptSentRef.current = storageKey;
      sendMessage(initialPrompt);
    }
  }, [tenant?.id, initialPrompt, messages.length, storageKey]);

  const sendMessage = async (text) => {
    const message = text || input.trim();
    if (!message || requestLockRef.current) return;
    requestLockRef.current = true;
    setInput("");
    setLoading(true);
    const userMessage = { role: "user", content: message };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    base44.entities.AnalyticsEvent.create({ tenant_id: tenant?.id, tenant_name: tenant?.name, event_type: "ai_guide_interaction", event_data: { question: message }, source_page: "guide" }).catch(() => {});
    try {
      const response = await getAIResponse(message, guideConfig, tenant, nextMessages, addOns, tenantSlug);
      setMessages(prev => [...prev, { role: "assistant", content: response.content, ctas: response.ctas || [], topic: response.topic || "general" }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: "assistant", content: guideConfig?.fallback_answer || "I’m having trouble connecting right now, but I can still help with museum tickets, walkthroughs, and vendor guidance. Please try again." }]);
    } finally {
      requestLockRef.current = false;
      setLoading(false);
    }
  };

  const startNewChat = () => {
    if (requestLockRef.current) return;
    window.localStorage.removeItem(storageKey);
    setInput("");
    setMessages([{ role: "assistant", content: welcomeMessage }]);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <ThreeBackground />

      {/* Header */}
      <div className="relative z-10 border-b border-border/50 bg-card/40 backdrop-blur-xl px-4 py-3.5">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Button size="icon" variant="ghost" className="w-9 h-9 flex-shrink-0" onClick={() => navigate(backPath)} aria-label="Go back safely">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="font-display text-sm font-semibold uppercase tracking-[0.12em] text-foreground">{guideContent.headerTitle}</h1>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-xs text-muted-foreground">{guideContent.statusLabel}</p>
            </div>
          </div>
          <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
            <Sparkles className="w-2.5 h-2.5 mr-1" /> SCAVerse
          </Badge>
        </div>
      </div>

      {messages.length <= 1 && (guideContent.heroTitle || guideContent.heroBody) && (
        <section className="relative z-10 border-b border-border/30 px-4 py-10 text-center sm:py-14">
          <div className="mx-auto max-w-3xl">
            {guideContent.heroEyebrow && (
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 font-display text-[10px] font-medium uppercase tracking-[0.5em] text-primary/70 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5" /> {guideContent.heroEyebrow}
              </div>
            )}
            {guideContent.heroTitle && <h2 className="font-heading text-4xl font-semibold tracking-tight text-foreground sm:text-6xl">{guideContent.heroTitle}</h2>}
            {guideContent.heroBody && <p className="mx-auto mt-4 max-w-2xl font-body text-sm font-light leading-7 text-muted-foreground sm:text-base">{guideContent.heroBody}</p>}
          </div>
        </section>
      )}

      {/* Messages */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-card/80 border border-border/50 backdrop-blur-sm text-foreground/90 rounded-tl-sm"
                  }`}
                >
                  {msg.content}
                  {msg.role === "assistant" && msg.ctas?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {msg.ctas.map((cta) => (
                        <Link key={`${cta.label}-${cta.path}`} to={cta.path} className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary transition hover:bg-primary/20">
                          {cta.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-card/80 border border-border/50 backdrop-blur-sm rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                {[0, 0.2, 0.4].map((d, i) => (
                  <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/50"
                    animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 0.8, delay: d }} />
                ))}
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Prompts */}
      {guideContent.quickPrompts.length > 0 && (
        <div className="relative z-10 px-4 pb-2">
          <div className="max-w-3xl mx-auto">
            {guideContent.promptIntro && <p className="text-xs text-muted-foreground mb-3 text-center">{guideContent.promptIntro}</p>}
            <div className="flex flex-wrap gap-2 justify-center">
              {guideContent.quickPrompts.map((p) => {
                const Icon = p.icon;
                return (
                  <button key={p.label} onClick={() => sendMessage(p.label)} disabled={loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/60 border border-border/50 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 backdrop-blur-sm transition-all disabled:cursor-not-allowed disabled:opacity-50">
                    <Icon className="w-3 h-3" />
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="relative z-10 border-t border-border/50 bg-card/40 backdrop-blur-xl px-4 pt-3 pb-2">
        <div className="max-w-3xl mx-auto flex gap-2 mb-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder={guideContent.inputPlaceholder}
            className="bg-secondary/60 border-border/50 text-sm backdrop-blur-sm"
            disabled={loading}
          />
          <Button onClick={() => sendMessage()} disabled={!input.trim() || loading} className="bg-primary text-primary-foreground px-4 flex-shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-center gap-4 pb-1">
          <Button type="button" variant="ghost" size="sm" disabled={loading} onClick={startNewChat} className="h-7 px-2 text-[10px] text-muted-foreground hover:text-primary">
            Start New Chat
          </Button>
          {safeFooterCtas
            .filter((cta) => !cta.moduleKey || isModuleEnabled(cta.moduleKey))
            .map((cta) => {
              const Icon = cta.icon;
              return (
                <Link key={`${cta.label}-${cta.path}`} to={cta.path} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors">
                  <Icon className="w-3 h-3" /> {cta.label}
                </Link>
              );
            })}
        </div>
      </div>
    </div>
  );
}