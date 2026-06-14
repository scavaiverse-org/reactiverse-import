import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Ticket, Store, Zap } from "lucide-react";

const COLORS = ["hsl(38,90%,55%)", "hsl(190,60%,50%)", "hsl(280,60%,55%)", "hsl(150,50%,45%)", "hsl(10,80%,60%)"];

export default function AdminAnalytics({ events = [], tickets = [], vendors = [] }) {
  const eventTypeCounts = events.reduce((acc, e) => {
    if (!e.event_type) return acc;
    acc[e.event_type] = (acc[e.event_type] || 0) + 1;
    return acc;
  }, {});

  const eventChartData = Object.entries(eventTypeCounts).map(([name, value]) => ({
    name: name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
    value,
  }));

  const ticketsByType = tickets.reduce((acc, t) => {
    if (!t.ticket_type) return acc;
    acc[t.ticket_type] = (acc[t.ticket_type] || 0) + 1;
    return acc;
  }, {});

  const ticketPieData = Object.entries(ticketsByType).map(([name, value]) => ({
    name: name.replace(/_/g, " "),
    value,
  }));

  const vendorsByCategory = vendors.reduce((acc, v) => {
    if (!v.category) return acc;
    acc[v.category] = (acc[v.category] || 0) + 1;
    return acc;
  }, {});

  const vendorChartData = Object.entries(vendorsByCategory).map(([name, value]) => ({
    name: name.replace(/_/g, " "),
    value,
  }));

  const revenue = tickets.filter(t => t.status === "confirmed").reduce((sum, t) => sum + (t.total_price || 0), 0);

  return (
    <div className="space-y-6">
      {/* KPI Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Events Tracked", value: events.length, icon: Zap, color: "text-yellow-400" },
          { label: "Total Revenue", value: `SGD ${revenue.toLocaleString()}`, icon: TrendingUp, color: "text-emerald-400" },
          { label: "Tickets", value: tickets.length, icon: Ticket, color: "text-blue-400" },
          { label: "Vendors", value: vendors.length, icon: Store, color: "text-purple-400" },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="bg-card/50 border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <Icon className={`w-5 h-5 ${kpi.color}`} />
                <div>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="text-lg font-display font-bold text-foreground">{kpi.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-foreground">Event Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {eventChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={eventChartData} margin={{ top: 5, right: 5, left: -25, bottom: 30 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(220,15%,55%)" }} angle={-35} textAnchor="end" />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(220,15%,55%)" }} />
                  <Tooltip contentStyle={{ background: "hsl(222,40%,9%)", border: "1px solid hsl(222,25%,16%)", borderRadius: 8, fontSize: 11 }} />
                  <Bar dataKey="value" fill="hsl(38,90%,55%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">No events tracked yet</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-foreground">Ticket Types</CardTitle>
          </CardHeader>
          <CardContent>
            {ticketPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={ticketPieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={9}>
                    {ticketPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(222,40%,9%)", border: "1px solid hsl(222,25%,16%)", borderRadius: 8, fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">No tickets yet</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-foreground">Vendors by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {vendorChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={vendorChartData} margin={{ top: 5, right: 5, left: -25, bottom: 20 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(220,15%,55%)" }} angle={-20} textAnchor="end" />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(220,15%,55%)" }} />
                  <Tooltip contentStyle={{ background: "hsl(222,40%,9%)", border: "1px solid hsl(222,25%,16%)", borderRadius: 8, fontSize: 11 }} />
                  <Bar dataKey="value" fill="hsl(190,60%,50%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">No vendor data yet</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}