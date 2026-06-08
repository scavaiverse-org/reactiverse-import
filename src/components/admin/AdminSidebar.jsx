import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Ticket, Store, Image, BarChart3, Users, Settings, Compass, Bot } from 'lucide-react';

const menuItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/tickets', label: 'Tickets', icon: Ticket },
  { path: '/admin/vendors', label: 'Vendors', icon: Store },
  { path: '/admin/exhibits', label: 'Exhibits', icon: Image },
  { path: '/admin/tenant/walkthrough', label: 'Walkthrough', icon: Compass },
  { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/admin/modules/ai-guide', label: 'AI Guide', icon: Bot },
  { path: '/admin/users-access', label: 'Users', icon: Users },
  { path: '/admin/platform-services', label: 'Settings', icon: Settings },
];

export default function AdminSidebar() {
  const location = useLocation();

  return (
    <aside className="w-60 min-h-screen bg-card border-r border-border p-4 hidden lg:block">
      <div className="flex items-center gap-2 px-3 mb-8">
        <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
          <span className="font-display text-primary font-bold text-xs">A</span>
        </div>
        <div>
          <span className="font-body text-sm font-semibold text-foreground">AOM Admin</span>
        </div>
      </div>
      <nav className="space-y-1">
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body transition-all ${
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}