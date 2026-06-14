import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link, useLocation } from "react-router-dom";
import { CheckCircle2, Settings, ArrowRight } from "lucide-react";
import AdminBreadcrumb from "@/components/admin/AdminBreadcrumb";
import StatusBadge from "@/components/admin/StatusBadge";

const SERVICE_CONFIGS = {
  identity: {
    key: "moa-auth_flow", title: "User & Identity Service", layer: "Platform Services",
    desc: "Manages authentication, session handling, role-based access, and user registration across all museum tenants.",
    features: ["OAuth / Email Login", "Role Assignment", "Session Management", "Multi-tenant User Isolation", "Onboarding Profile Storage", "Access History Logging"],
    connected: ["/platform/admin/users-access", "/platform/admin/modules/onboarding", "/platform/admin/modules/ticketing"],
    connectedLabels: ["Users & Access", "Onboarding", "Ticketing"],
  },
  cms: {
    key: "moa-media_links", title: "Content Management Service", layer: "Platform Services",
    desc: "Central content delivery engine for all museum assets — exhibits, media, scripts, and cultural narratives.",
    features: ["Asset Upload & Management", "Version Control", "Content Status Workflow", "Tenant Content Isolation", "CDN Integration", "Metadata Tagging"],
    connected: ["/platform/admin/content-data", "/platform/admin/content/exhibits", "/platform/admin/content/media-library"],
    connectedLabels: ["Content Overview", "Exhibits", "Media Library"],
  },
  "experience-config": {
    key: "moa-route_integrity", title: "Experience Config Service", layer: "Platform Services",
    desc: "Manages per-tenant experience configurations, module enable/disable states, and visitor journey flows.",
    features: ["Module Toggle per Tenant", "Experience Mode Config", "Theme Assignment", "CTA Flow Config", "Onboarding Route Config", "Visitor Journey Preview"],
    connected: ["/platform/admin/experience-layer", "/platform/admin/modules", "/platform/admin/tenants"],
    connectedLabels: ["Experience Layer", "Modules", "Tenants"],
  },
  "ai-personalization": {
    key: "moa-analytics", title: "AI & Personalization Service", layer: "Platform Services",
    desc: "Powers ARIA's knowledge base, recommendation engine, anti-hallucination controls, and multilingual AI responses.",
    features: ["Knowledge Base Management", "Anti-Hallucination Rules", "Multilingual Models", "Recommendation Logic", "Fallback Answer Config", "Unanswered Query Logging"],
    connected: ["/platform/admin/modules/ai-guide", "/museum/asian-operatic-museum/guide", "/platform/admin/content-data"],
    connectedLabels: ["AI Guide Module", "Preview Guide", "Content Data"],
  },
  notifications: {
    key: "moa-admin_console", title: "Notification Service", layer: "Platform Services",
    desc: "Email, in-app, and push notification delivery for ticket confirmations, vendor alerts, and onboarding triggers.",
    features: ["Email Delivery (Resend)", "Ticket Confirmation Emails", "Vendor Application Alerts", "Onboarding Welcome Emails", "System Alert Notifications", "Bulk Announcement Engine"],
    connected: ["/platform/admin/modules/ticketing", "/platform/admin/modules/vendors", "/platform/admin/modules/onboarding"],
    connectedLabels: ["Ticketing", "Vendors", "Onboarding"],
  },
  search: {
    key: "moa-performance", title: "Search Service", layer: "Platform Services",
    desc: "Full-text search across exhibits, content, vendors, and cultural narratives. Powers AI guide content retrieval.",
    features: ["Exhibit Search Index", "Vendor Directory Search", "Cultural Content Search", "Multilingual Query Support", "Real-time Index Updates", "Relevance Scoring"],
    connected: ["/platform/admin/content/exhibits", "/platform/admin/modules/ai-guide", "/platform/admin/modules/vendors"],
    connectedLabels: ["Exhibits", "AI Guide", "Vendors"],
  },
  payments: {
    key: "moa-commerce", title: "Payment & Billing Service", layer: "Platform Services",
    desc: "Stripe-integrated payment gateway handling ticket sales, vendor billing, commerce transactions, and revenue reporting.",
    features: ["Stripe Gateway", "Ticket Payment Processing", "Vendor Revenue Split", "Refund Management", "Multi-currency Support", "Revenue Reporting"],
    connected: ["/platform/admin/modules/ticketing", "/platform/admin/modules/commerce", "/platform/admin/modules/vendors"],
    connectedLabels: ["Ticketing", "Commerce", "Vendors"],
  },
  integrations: {
    key: "moa-export", title: "Integration Service", layer: "Platform Services",
    desc: "External API connections including analytics platforms, email providers, AI models, and third-party services.",
    features: ["Email API (Resend)", "LLM Integration (SCAVerse AI)", "Analytics Events Pipeline", "Webhook Endpoints", "OAuth Connectors", "API Rate Limiting"],
    connected: ["/platform/admin/platform-services", "/platform/admin/modules/analytics", "/platform/admin/infrastructure"],
    connectedLabels: ["All Services", "Analytics", "Infrastructure"],
  },
};

export default function ServicePage() {
  const { pathname } = useLocation();
  const serviceKey = pathname.split("/").pop();
  const config = SERVICE_CONFIGS[serviceKey];
  const { data: health = [] } = useQuery({ queryKey: ["svc-health"], queryFn: () => base44.entities.PlatformHealth.list() });
  const h = health.find(h => h.service_key === config?.key);

  if (!config) return (
    <div className="min-h-screen bg-[#060c18] p-8">
      <p className="text-muted-foreground">Service not found.</p>
      <Link to="/platform/admin/platform-services" className="text-primary text-xs mt-2 inline-block">← Back to Services</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#060c18] p-6 lg:p-8">
      <AdminBreadcrumb crumbs={[{ label: "Platform Services", path: "/platform/admin/platform-services" }, { label: config.title }]} />

      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[10px] tracking-[0.3em] text-cyan-400 font-semibold mb-1">{config.layer.toUpperCase()}</p>
          <h1 className="text-2xl font-display font-bold text-foreground">{config.title}</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{config.desc}</p>
        </div>
        {h && <StatusBadge status={h.status} />}
      </div>

      {h && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
            <p className="text-2xl font-display font-bold text-emerald-400">{h.uptime_percent}%</p>
            <p className="text-xs text-muted-foreground">Uptime</p>
          </div>
          <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
            <p className="text-2xl font-display font-bold text-blue-400">{h.response_time_ms}ms</p>
            <p className="text-xs text-muted-foreground">Avg Response</p>
          </div>
          <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
            <p className={`text-2xl font-display font-bold ${h.error_count > 0 ? "text-amber-400" : "text-emerald-400"}`}>{h.error_count}</p>
            <p className="text-xs text-muted-foreground">Errors (24h)</p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white/[0.03] border border-cyan-400/15 rounded-xl p-5">
          <p className="text-xs font-semibold text-foreground mb-4 flex items-center gap-2">
            <Settings className="w-3.5 h-3.5 text-cyan-400" />Service Features
          </p>
          <div className="space-y-2">
            {config.features.map(f => (
              <div key={f} className="flex items-center gap-2.5 py-1.5 border-b border-white/5 last:border-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span className="text-xs text-foreground/80">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/[0.03] border border-cyan-400/15 rounded-xl p-5">
          <p className="text-xs font-semibold text-foreground mb-4">Connected Modules</p>
          <div className="space-y-2">
            {config.connected.map((path, i) => (
              <Link key={path} to={path}
                className="group flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/6 hover:bg-white/[0.05] transition-all">
                <span className="text-xs text-foreground">{config.connectedLabels[i]}</span>
                <ArrowRight className="w-3.5 h-3.5 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>

          {h && (
            <div className="mt-4 pt-4 border-t border-white/5">
              <p className="text-[10px] text-muted-foreground mb-1">Last Status Message</p>
              <p className="text-xs text-foreground/80">{h.message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}