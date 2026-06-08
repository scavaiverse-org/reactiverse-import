import { useEffect } from "react";
import { base44 } from "@/api/base44Client";

export default function LoginRedirect() {
  useEffect(() => {
    base44.auth.redirectToLogin(window.location.origin + "/");
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Opening secure login</p>
      </div>
    </main>
  );
}