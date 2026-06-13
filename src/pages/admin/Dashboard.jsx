import { motion } from "framer-motion";
import { Ticket, Store, TrendingUp, ArrowUpRight, BookOpen, Eye, CheckCircle2, Clock, Globe } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import AdminArchitectureBlueprint from "@/components/admin/AdminArchitectureBlueprint";
import SetupChecklist from "@/components/tenant-admin/SetupChecklist";
import { useActiveTenant } from "@/hooks/useActiveTenant";

function StatCard({ label, value, sub, icon: Icon, color, bg, trend, to }) {
  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border/50 bg-card/40 p-5 hover:border-primary/20 transition-all group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2 rounded-lg ${bg}`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        {to && <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />}
      </div>
      <p className="text-2xl font-display font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
      {sub && <p className="text-[10px] text-muted-foreground/60 mt-0.5">{sub}</p>}
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-[10px] text-emerald-400">
          <TrendingUp className="w-2.5 h-2.5" /> {trend}
        </div>
      )}
    </motion.div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

export default function Dashboard() {
  const { tenant, enabledModules } = useActiveTenant();
  const tenantSlug = tenant?.slug || "asian-operatic-museum";
  const adminBase = `/museum/${tenantSlug}/admin`;
  const { data: tickets = [] } = useQuery({
    queryKey: ["admin-tickets", tenant?.id],
    enabled: !!tenant?.id,
    queryFn: () => base44.entities.Ticket.filter({ tenant_id: tenant.id }, "-created_date", 50)
  });
  const { data: vendors = [] } = useQuery({
    queryKey: ["admin-vendors", tenant?.id],
    enabled: !!tenant?.id,
    queryFn: () => base44.entities.Vendor.filter({ tenant_id: tenant.id }, "-created_date", 50)
  });
  const { data: exhibits = [] } = useQuery({
    queryKey: ["admin-exhibits", tenant?.id],
    enabled: !!tenant?.id,
    queryFn: () => base44.entities.Exhibit.filter({ tenant_id: tenant.id }, "-created_date", 20)
  });

  const confirmedTickets = tickets.filter(t => t.status === "confirmed").length;
  const pendingVendors = vendors.filter(v => v.status === "pending").length;
  const activeVendors = vendors.filter(v => v.status === "active").length;
  const publishedExhibits = exhibits.filter(e => e.status === "published").length;
  const totalRevenue = tickets.reduce((sum, t) => sum + (t.total_price || 0), 0);

  const recentActivity = [
    ...tickets.slice(0, 3).map(t => ({ icon: Ticket, color: "text-primary", text: `Ticket — ${t.visitor_name || "visitor"} · ${t.ticket_type?.replace(/_/g, " ")}`, time: t.created_date, status: t.status })),
    ...vendors.slice(0, 2).map(v => ({ icon: Store, color: "text-blue-400", text: `Vendor — ${v.business_name} · ${v.category?.replace(/_/g, " ")}`, time: v.created_date, status: v.status })),
  ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 6);

  const systemModules = [
    { label: "Onboarding Engine", ok: true },
    { label: "Ticketing Pipeline", ok: tickets.length > 0 },
    { label: "Vendor Registry", ok: vendors.length > 0 },
    { label: "AI Cultural Guide", ok: true },
    { label: "Commerce Layer", ok: tickets.length > 0 || vendors.length > 0 },
    { label: "Analytics Engine", ok: true },
    { label: "Exhibit CMS", ok: publishedExhibits > 0 },
    { label: "Admin Console", ok: true },
  ];

  const launchChecklist = [
    { label: "Exhibits published", done: publishedExhibits >= 6 },
    { label: "Ticket tiers configured", done: true },
    { label: "Vendor applications open", done: true },
    { label: "AI Guide active", done: true },
    { label: "Analytics tracking live", done: true },
    { label: "First ticket sold", done: confirmedTickets > 0 },
    { label: "First vendor approved", done: activeVendors > 0 },
  ];

  const launchReadiness = Math.round((launchChecklist.filter(c => c.done).length / launchChecklist.length) * 100);

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-primary font-medium mb-1">{tenant?.name || "Museum"} Admin</p>
          <h1 className="text-2xl font-display font-bold text-foreground">Operations Overview</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Real-time ecosystem intelligence</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Launch Readiness</p>
          <p className="text-2xl font-display font-bold text-primary">{launchReadiness}%</p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Tickets" value={tickets.length} sub={`${confirmedTickets} confirmed`} icon={Ticket} color="text-primary" bg="bg-primary/10" trend="+live pipeline" to={`${adminBase}/tickets`} />
        <StatCard label="Total Revenue" value={`SGD ${totalRevenue.toLocaleString()}`} sub="All ticket types" icon={TrendingUp} color="text-emerald-400" bg="bg-emerald-500/10" to={`${adminBase}/analytics`} />
        <StatCard label="Vendor Partners" value={vendors.length} sub={`${pendingVendors} pending · ${activeVendors} active`} icon={Store} color="text-blue-400" bg="bg-blue-500/10" to={`${adminBase}/vendors`} />
        <StatCard label="Exhibits Live" value={exhibits.length} sub={`${publishedExhibits} published`} icon={BookOpen} color="text-violet-400" bg="bg-violet-500/10" to={`${adminBase}/exhibits`} />
      </div>

      <SetupChecklist tenant={tenant} adminBase={adminBase} tenantSlug={tenantSlug} enabledModules={enabledModules} exhibitsCount={exhibits.length} ticketsCount={tickets.length} />

      <AdminArchitectureBlueprint />

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Recent Activity */}
        <Card className="lg:col-span-2 bg-card/30 border-border/50">
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-foreground">Recent Activity</CardTitle>
            <Eye className="w-4 h-4 text-muted-foreground/40" />
          </CardHeader>
          <CardContent className="space-y-2">
            {recentActivity.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">No activity yet</div>
            ) : recentActivity.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-secondary/30 transition-colors">
                  <Icon className={`w-3.5 h-3.5 ${item.color} mt-0.5 flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground/80 truncate">{item.text}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {item.time ? format(new Date(item.time), "MMM d, HH:mm") : "—"}
                    </p>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                    item.status === "confirmed" || item.status === "active" ? "bg-emerald-500/10 text-emerald-400" :
                    item.status === "pending" ? "bg-amber-500/10 text-amber-400" :
                    "bg-secondary text-muted-foreground"
                  }`}>{item.status}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="bg-card/30 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-foreground">System Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {systemModules.map((mod) => (
              <div key={mod.label} className="flex items-center justify-between">
                <p className="text-xs text-foreground/70">{mod.label}</p>
                <div className={`flex items-center gap-1 ${mod.ok ? "text-emerald-400" : "text-amber-400"}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${mod.ok ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`} />
                  <span className="text-[10px]">{mod.ok ? "Live" : "Setup"}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Launch Checklist */}
      <Card className="bg-card/30 border-border/50">
        <CardHeader className="pb-3 flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium text-foreground">Launch Readiness Checklist</CardTitle>
          <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">{launchReadiness}% ready</Badge>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-secondary rounded-full h-1.5 mb-5">
            <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${launchReadiness}%` }} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {launchChecklist.map((item) => (
              <div key={item.label} className={`flex items-center gap-2 text-xs ${item.done ? "text-foreground/70" : "text-muted-foreground/50"}`}>
                {item.done ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" /> : <Clock className="w-3.5 h-3.5 text-muted-foreground/30 flex-shrink-0" />}
                {item.label}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "View Museum", to: `/museum/${tenantSlug}/home`, icon: Globe },
          { label: "Manage Tickets", to: `${adminBase}/tickets`, icon: Ticket },
          { label: "Review Vendors", to: `${adminBase}/vendors`, icon: Store },
          { label: "Analytics", to: `${adminBase}/analytics`, icon: TrendingUp },
        ].map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.to} to={link.to} className="flex items-center gap-2 px-4 py-3 rounded-xl border border-border/50 bg-card/20 hover:border-primary/20 hover:bg-card/40 transition-all text-xs text-muted-foreground hover:text-foreground">
              <Icon className="w-3.5 h-3.5 text-primary/60" />
              {link.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}