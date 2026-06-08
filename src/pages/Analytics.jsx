import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Ticket, Store, Brain, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PublicPageHero from "@/components/public/PublicPageHero";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { museumPath } from "@/lib/domain-registry";

const COLORS = ["hsl(38,90%,55%)", "hsl(190,60%,50%)", "hsl(280,60%,55%)", "hsl(150,50%,45%)", "hsl(10,80%,60%)"];

const demoWeeklyData = [
  { day: "Mon", visits: 120, tickets: 14, vendors: 2 },
  { day: "Tue", visits: 180, tickets: 22, vendors: 3 },
  { day: "Wed", visits: 145, tickets: 18, vendors: 1 },
  { day: "Thu", visits: 220, tickets: 31, vendors: 4 },
  { day: "Fri", visits: 310, tickets: 45, vendors: 6 },
  { day: "Sat", visits: 480, tickets: 72, vendors: 8 },
  { day: "Sun", visits: 390, tickets: 58, vendors: 5 },
];

const demoEngagementData = [
  { name: "Page Views", value: 2840 },
  { name: "Walkthrough", value: 640 },
  { name: "Ticket Views", value: 420 },
  { name: "AI Interactions", value: 310 },
  { name: "Vendor Signups", value: 89 },
];

function KPICard({ icon: IconComponent, label, value, sub, color, trend }) {
  const Icon = IconComponent;
  return (
    <Card className="bg-card/50 border-border/50 hover:border-primary/20 transition-all">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <Icon className={`w-5 h-5 ${color}`} />
          {trend && (
            <span className="flex items-center gap-1 text-xs text-emerald-400">
              <ArrowUpRight className="w-3 h-3" />{trend}
            </span>
          )}
        </div>
        <p className={`text-2xl font-display font-bold ${color}`}>{value}</p>
        <p className="text-xs text-foreground/80 mt-0.5">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border/50 rounded-xl p-3 shadow-xl text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }} className="font-medium">
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
};

export default function Analytics() {
  const { tenant } = useActiveTenant();
  const tenantSlug = tenant?.slug || "asian-operatic-museum";
  const { data: tickets = [] } = useQuery({
    queryKey: ["analytics-tickets", tenant?.id],
    queryFn: () => tenant ? base44.entities.Ticket.filter({ tenant_id: tenant.id }) : Promise.resolve([]),
    enabled: !!tenant,
  });
  const { data: vendors = [] } = useQuery({
    queryKey: ["analytics-vendors", tenant?.id],
    queryFn: () => tenant ? base44.entities.Vendor.filter({ tenant_id: tenant.id }) : Promise.resolve([]),
    enabled: !!tenant,
  });
  const { data: events = [] } = useQuery({
    queryKey: ["analytics-events", tenant?.id],
    queryFn: () => tenant ? base44.entities.AnalyticsEvent.filter({ tenant_id: tenant.id }) : Promise.resolve([]),
    enabled: !!tenant,
  });

  const revenue = tickets.reduce((sum, t) => sum + (t.total_price || 0), 0);
  const confirmedTickets = tickets.filter(t => t.status === "confirmed").length;
  const activeVendors = vendors.filter(v => v.status === "active").length;

  const eventCounts = events.reduce((acc, e) => {
    acc[e.event_type] = (acc[e.event_type] || 0) + 1;
    return acc;
  }, {});
  const eventData = Object.entries(eventCounts).map(([name, value]) => ({ name: name.replace(/_/g, " "), value }));

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <PublicPageHero
          pageKey="analytics"
          eyebrow="Impact Dashboard"
          fallback={{
            title: "Museum Impact Dashboard",
            subtitle: "See visits, tickets, guide questions, and marketplace interest.",
            body: "This page helps partners understand how visitors use the museum.",
            cta_label: "View Impact",
            cta_path: "/platform/analytics",
            secondary_cta_label: "Visit Museum",
            secondary_cta_path: museumPath(tenantSlug, "walkthrough"),
          }}
        />

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPICard icon={Ticket} label="Total Tickets Sold" value={tickets.length} sub={`${confirmedTickets} confirmed`} color="text-primary" trend="+18%" />
          <KPICard icon={TrendingUp} label="Revenue Generated" value={`SGD ${revenue.toLocaleString()}`} sub="All ticket types" color="text-emerald-400" trend="+24%" />
          <KPICard icon={Store} label="Active Vendors" value={activeVendors} sub={`${vendors.length} total applications`} color="text-blue-400" trend="+6%" />
          <KPICard icon={Brain} label="AI Guide Queries" value={events.filter(e => e.event_type === "ai_guide_interaction").length || "—"} sub="Visitor interactions" color="text-violet-400" />
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Weekly Visitor & Ticket Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={demoWeeklyData} barGap={4}>
                  <XAxis dataKey="day" tick={{ fill: "hsl(220,15%,55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(220,15%,55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="visits" name="Visits" fill="hsl(38,90%,55%)" fillOpacity={0.3} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="tickets" name="Tickets" fill="hsl(38,90%,55%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Engagement Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie data={demoEngagementData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value">
                    {demoEngagementData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {demoEngagementData.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-xs text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="text-xs font-mono" style={{ color: COLORS[i % COLORS.length] }}>{item.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Vendor Signups */}
        <Card className="bg-card/50 border-border/50 mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Weekly Vendor Signups</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={demoWeeklyData}>
                <XAxis dataKey="day" tick={{ fill: "hsl(220,15%,55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(220,15%,55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="vendors" name="Vendors" stroke="hsl(190,60%,50%)" strokeWidth={2} dot={{ fill: "hsl(190,60%,50%)", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Live Events */}
        {eventData.length > 0 && (
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Live Platform Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {eventData.map((e, i) => (
                  <div key={e.name} className="flex items-center gap-3">
                    <p className="text-xs text-foreground/80 w-40 capitalize">{e.name}</p>
                    <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.min((e.value / (eventData[0]?.value || 1)) * 100, 100)}%`, background: COLORS[i % COLORS.length] }} />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground w-8 text-right">{e.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}