import { Link } from "react-router-dom";
import { ChevronRight, LayoutDashboard } from "lucide-react";

export default function AdminBreadcrumb({ crumbs = [] }) {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
      <Link to="/admin/master" className="flex items-center gap-1 hover:text-primary transition-colors">
        <LayoutDashboard className="w-3 h-3" />
        <span>Master</span>
      </Link>
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
          {crumb.path ? (
            <Link to={crumb.path} className="hover:text-primary transition-colors">{crumb.label}</Link>
          ) : (
            <span className="text-foreground/80">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}