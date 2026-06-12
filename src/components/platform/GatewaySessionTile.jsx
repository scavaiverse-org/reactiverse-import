import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, LogOut, UserRound } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { fetchAuthProfile, resolvePostLoginDestination } from "@/lib/post-login";
import PlatformGatewayBadge from "@/components/platform/PlatformGatewayBadge";
import { ACCOUNT_TYPE_RESET_EVENT } from "@/components/auth/AccountTypeGate";

/**
 * Session-aware replacement for the gateway "Login" tile. Logged-out
 * visitors see the regular Login badge; signed-in users get a personal
 * welcome tile that continues to their dashboard plus a sign-out link.
 */
export default function GatewaySessionTile({ badge }) {
  const navigate = useNavigate();
  const [sessionUser, setSessionUser] = useState(null);
  const [destination, setDestination] = useState("/platform/overview");

  useEffect(() => {
    let cancelled = false;

    const resolveDestination = async (user) => {
      let profile = null;
      try {
        profile = await fetchAuthProfile(user.id);
      } catch {
        profile = null;
      }
      const dest = await resolvePostLoginDestination(profile).catch(() => "/platform/overview");
      // "/" is this very page — send public users to the consumer platform instead.
      if (!cancelled) setDestination(dest === "/" ? "/platform/overview" : dest);
    };

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      const user = data?.session?.user || null;
      setSessionUser(user);
      if (user) resolveDestination(user);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      const user = session?.user || null;
      setSessionUser(user);
      if (user) resolveDestination(user);
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (!sessionUser) {
    return <PlatformGatewayBadge badge={badge} variant="primary" />;
  }

  const displayName = sessionUser.user_metadata?.full_name || sessionUser.email || "Explorer";
  const firstName = String(displayName).trim().split(/\s+/)[0];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSessionUser(null);
  };

  // Clears the consumer/franchisee choice so AccountTypeGate reappears.
  const handleSwitchAccountType = async () => {
    await supabase.from("profiles").update({ account_type: null }).eq("id", sessionUser.id);
    window.dispatchEvent(new Event(ACCOUNT_TYPE_RESET_EVENT));
  };

  return (
    <div className="group block w-full">
      <button
        type="button"
        onClick={() => navigate(destination)}
        aria-label={`Continue as ${displayName}`}
        className="relative flex min-h-16 w-full items-center justify-center gap-3 overflow-hidden rounded-2xl border border-primary/35 bg-card/50 px-7 py-4 font-display text-sm font-semibold uppercase tracking-[0.16em] text-foreground shadow-2xl shadow-primary/10 backdrop-blur-sm transition-all duration-300 before:absolute before:inset-0 before:bg-gradient-to-r before:from-primary/10 before:via-transparent before:to-primary/[0.03] before:opacity-70 hover:-translate-y-1 hover:border-primary/40 hover:bg-card/80 hover:shadow-primary/15"
      >
        <UserRound className="relative h-4 w-4 text-primary" />
        <span className="relative">Welcome back, {firstName}</span>
        <ArrowRight className="relative h-4 w-4 text-primary transition group-hover:translate-x-1" />
      </button>
      <p className="mx-auto mt-3 max-w-lg text-center font-body text-xs font-light leading-6 text-muted-foreground sm:text-sm">
        You&apos;re signed in as {sessionUser.email}. Continue to your space,{" "}
        <button
          type="button"
          onClick={handleSwitchAccountType}
          className="text-primary underline-offset-4 hover:underline"
        >
          switch account type
        </button>
        , or{" "}
        <button
          type="button"
          onClick={handleSignOut}
          className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
        >
          <LogOut className="h-3 w-3" /> sign out
        </button>
        .
      </p>
    </div>
  );
}
