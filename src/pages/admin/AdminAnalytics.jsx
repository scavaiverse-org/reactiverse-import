import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Ticket, Store, Users, TrendingUp } from 'lucide-react';
import { useActiveTenant } from '@/hooks/useActiveTenant';

const COLORS = ['hsl(38, 90%, 55%)', 'hsl(190, 60%, 50%)', 'hsl(150, 50%, 45%)', 'hsl(280, 60%, 55%)', 'hsl(10, 80%, 60%)'];

export default function AdminAnalytics() {
  const { tenant } = useActiveTenant();
  const { data: tickets = [] } = useQuery({
    queryKey: ['analytics-tickets', tenant?.id],
    enabled: !!tenant?.id,
    queryFn: () => base44.entities.Ticket.filter({ tenant_id: tenant.id }, '-created_date', 200),
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ['analytics-vendors', tenant?.id],
    enabled: !!tenant?.id,
    queryFn: () => base44.entities.Vendor.filter({ tenant_id: tenant.id }, '-created_date', 200),
  });

  // Ticket type distribution
  const ticketDist = tickets.reduce((acc, t) => {
    const type = t.ticket_type?.replace(/_/g, ' ') || 'Unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  const ticketChartData = Object.entries(ticketDist).map(([name, value]) => ({ name, value }));


  // Revenue by ticket type
  const revByType = tickets.reduce((acc, t) => {
    const type = t.ticket_type?.replace(/_/g, ' ') || 'Unknown';
    acc[type] = (acc[type] || 0) + (t.total_price || 0);
    return acc;
  }, {});
  const revenueData = Object.entries(revByType).map(([name, revenue]) => ({ name, revenue }));

  const totalRevenue = tickets.reduce((sum, t) => sum + (t.total_price || 0), 0);
  const conversionRate = tickets.length > 0 ? ((tickets.filter(t => t.status === 'confirmed').length / tickets.length) * 100).toFixed(1) : 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground font-body text-sm">Ecosystem performance metrics</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Revenue', value: `SGD ${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-amber-400' },
          { label: 'Total Tickets', value: tickets.length, icon: Ticket, color: 'text-cyan-400' },
          { label: 'Total Vendors', value: vendors.length, icon: Store, color: 'text-emerald-400' },
          { label: 'Conversion Rate', value: `${conversionRate}%`, icon: Users, color: 'text-rose-400' },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
              <Icon className={`w-4 h-4 ${stat.color} mb-2`} />
              <div className="font-display text-xl font-bold text-foreground">{stat.value}</div>
              <div className="text-muted-foreground text-xs font-body">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Type */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-body font-semibold text-foreground text-sm mb-4">Revenue by Ticket Type</h3>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 25%, 16%)" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(220, 15%, 55%)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'hsl(220, 15%, 55%)', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'hsl(222, 40%, 9%)', border: '1px solid hsl(222, 25%, 16%)', borderRadius: 8 }} />
                <Bar dataKey="revenue" fill="hsl(38, 90%, 55%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm font-body">No data yet</div>
          )}
        </div>

        {/* Ticket Distribution */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-body font-semibold text-foreground text-sm mb-4">Ticket Distribution</h3>
          {ticketChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={ticketChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                  {ticketChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(222, 40%, 9%)', border: '1px solid hsl(222, 25%, 16%)', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm font-body">No data yet</div>
          )}
          <div className="flex flex-wrap gap-2 mt-2 justify-center">
            {ticketChartData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs font-body text-muted-foreground">
                <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                {d.name} ({d.value})
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}