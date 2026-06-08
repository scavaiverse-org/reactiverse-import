import { ShieldAlert } from "lucide-react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { canAccessMuseum, canAccessPlatform } from "@/lib/access-control";

export default function DomainAccessGate({ domain, children }) {
  const { user, isLoadingAuth } = useAuth();
  const { tenant, isLoading } = useActiveTenant();
  const location = useLocation();

  if (isLoadingAuth || isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">Checking access…</div>;
  }

  const allowed = domain === "platform" ? canAccessPlatform(user) : canAccessMuseum(user, tenant?.id);

  if (!user && domain === "museum") {
    return <Navigate to="/tenant-login" state={{ from: location.pathname }} replace />;
  }

  if (!allowed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6 text-center">
        <div className="max-w-md rounded-2xl border border-destructive/30 bg-card p-6">
          <ShieldAlert className="mx-auto mb-3 h-8 w-8 text-destructive" />
          <h1 className="font-display text-2xl font-bold text-foreground">Access restricted</h1>
          <p className="mt-2 text-sm text-muted-foreground">This area belongs to the {domain} ownership domain and your role is not allowed to modify it.</p>
        </div>
      </main>
    );
  }

  return children;
}