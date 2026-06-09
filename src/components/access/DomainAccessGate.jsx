import { ShieldAlert } from "lucide-react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { canAccessMuseum, canAccessPlatform } from "@/lib/access-control";

export default function DomainAccessGate({ domain, children }) {
  const { user, isLoadingAuth } = useAuth();
  const { tenant, isLoading } = useActiveTenant();
  const location = useLocation();

  // While auth or tenant data is still resolving, render nothing — avoids the
  // "Checking access…" flash and the subsequent re-render snap
  if (isLoadingAuth || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      </div>
    );
  }

  // Not logged in → send to login, preserving the intended destination
  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  const allowed = domain === "platform" ? canAccessPlatform(user) : canAccessMuseum(user, tenant?.id);

  if (!allowed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6 text-center">
        <div className="max-w-md rounded-2xl border border-destructive/30 bg-card p-6">
          <ShieldAlert className="mx-auto mb-3 h-8 w-8 text-destructive" />
          <h1 className="font-display text-2xl font-bold text-foreground">Access restricted</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account does not have permission to access this area. Contact your platform administrator to have your role or museum assignment updated.
          </p>
          <Link to="/" className="mt-4 inline-block text-sm text-primary underline-offset-4 hover:underline">Return home</Link>
        </div>
      </main>
    );
  }

  return children;
}