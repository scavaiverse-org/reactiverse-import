import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Download } from "lucide-react";
import AdminBreadcrumb from "@/components/admin/AdminBreadcrumb";
import TenantSwitcher from "@/components/admin/TenantSwitcher";

const COLORS = ["hsl(38,90%,55%)", "hsl(190,60%,50%)", "hsl(280,60%,55%)", "hsl(150,50%,45%)", "hsl(10,80%,60%)", "hsl(220,80%,60%)", "hsl(340,70%,55%)"];

const WEEKLY = [
  { day: "Mon", visits: 120, tickets: 14, vendors: 2 },
  { day: "Tue", visits: 180, tickets: 22, vendors: 3 },
  { day: "Wed", visits: 145, tickets: 18, vendors: 1 },
  { day: "Thu", visits: 220, tickets: 31, vendors: 4 },
  { day: "Fri", visits: 310, tickets: 45, vendors: 6 },
  { day: "Sat", visits: 480, tickets: 72, vendors: 8 },
  { day: "Sun", visits: 390, tickets: 58, vendors: 5 },
];

export default function ModuleAnalytics() {
  const { data: tickets = [] } = useQuery({ queryKey: ["ma-tickets"], queryFn: () => base44.entities.Ticket.list() });
  const { data: vendors = [] } = useQuery({ queryKey: ["ma-vendors"], queryFn: () => base44.entities.Vendor.list() });
  const { data: events = [] } = useQuery({ queryKey: ["ma-events"], queryFn: () => base44.entities.AnalyticsEvent.list() });
  const [activeTenant, setActiveTenant] = useState(null);

  const revenue = tickets.reduce((s, t) => s + (t.total_price || 0), 0);
  const eventCounts = events.reduce((acc, e) => { acc[e.event_type] = (acc[e.event_type] || 0) + 1; return acc; }, {});
  const pieData = Object.entries(eventCounts).map(([name, value]) => ({ name: name.replace(/_/g, " "), value }));

  const handleExport = () => {
    const exportData = {
      exported_at: new Date().toISOString(),
      summary: {
        total_tickets: tickets.length,
        revenue,
        vendors: vendors.length,
        platform_events: events.length,
      },
      event_breakdown: eventCounts,
      weekly_activity: WEEKLY,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `analytics-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const CustomTooltip = ({ active = false, payload = [], label = "" } = {}) => {
    if (!active || !payload.length) return null;
    return (
      <div className="bg-card border border-border/50 rounded-xl p-3 shadow-xl text-xs">
        <p className="text-muted-foreground mb-1">{label}</p>
        {payload.map((e, i) => (
          <p key={i} style={{ color: e.color }}>{e.name}: {e.value}</p>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#060c18] p-6 lg:p-8">
      <AdminBreadcrumb crumbs={[{ label: "Modules", path: "/admin/modules" }, { label: "Analytics" }]} />

      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[10px] tracking-[0.3em] text-pink-400 font-semibold mb-1">MODULE 7</p>
          <h1 className="text-2xl font-display font-bold text-foreground">Analytics Module</h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time performance metrics across all museums, modules, and visitor journeys.</p>
        </div>
        <div className="flex items-center gap-2">
          <TenantSwitcher activeTenant={activeTenant} onChange={setActiveTenant} />
          <button onClick={handleExport} className="flex items-center gap-1.5 text-xs border border-white/10 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
            <Download className="w-3.5 h-3.5" />Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Tickets", value: tickets.length, color: "text-primary" },
          { label: "Revenue", value: `SGD ${revenue.toLocaleString()}`, color: "text-emerald-400" },
          { label: "Vendors", value: vendors.length, color: "text-amber-400" },
          { label: "Platform Events", value: events.length, color: "text-pink-400" },
        ].map(k => (
          <div key={k.label} className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
            <p className={`text-2xl font-display font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-muted-foreground">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white/[0.03] border border-white/8 rounded-xl p-5">
          <p className="text-xs font-semibold text-foreground mb-4">Weekly Visitor & Ticket Activity</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={WEEKLY} barGap={4}>
              <XAxis dataKey="day" tick={{ fill: "hsl(220,15%,55%)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(220,15%,55%)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="visits" name="Visits" fill="hsl(38,90%,55%)" fillOpacity={0.3} radius={[4,4,0,0]} />
              <Bar dataKey="tickets" name="Tickets" fill="hsl(38,90%,55%)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white/[0.03] border border-white/8 rounded-xl p-5">
          <p className="text-xs font-semibold text-foreground mb-4">Platform Event Breakdown</p>
          {pieData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="45%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5">
                {pieData.slice(0, 6).map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-[10px] text-muted-foreground capitalize truncate max-w-[100px]">{d.name}</span>
                    </div>
                    <span className="text-[10px] font-mono" style={{ color: COLORS[i % COLORS.length] }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-xs">No event data yet — interact with the platform to see analytics.</div>
          )}
        </div>
      </div>

      <div className="bg-white/[0.03] border border-white/8 rounded-xl p-5">
        <p className="text-xs font-semibold text-foreground mb-4">Weekly Vendor Signups</p>
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={WEEKLY}>
            <XAxis dataKey="day" tick={{ fill: "hsl(220,15%,55%)", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "hsl(220,15%,55%)", fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="vendors" name="Vendors" stroke="hsl(190,60%,50%)" strokeWidth={2} dot={{ fill: "hsl(190,60%,50%)", r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}