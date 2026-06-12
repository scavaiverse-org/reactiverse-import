import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { fetchAuthProfile, resolvePostLoginDestination, shouldPromptFranchiseIntent } from "@/lib/post-login";
import { Button } from "@/components/ui/button";
import FranchiseIntentModal from "@/components/auth/FranchiseIntentModal";

/**
 * OAuth landing route. Supabase parses the session from the URL after the
 * Google redirect; once it's available we route the user exactly like an
 * email login would (franchise prompt, admin dashboards, or home).
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get("redirect");

  const [error, setError] = useState("");
  const [showFranchisePrompt, setShowFranchisePrompt] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let subscription = null;
    let timeoutId = null;

    const finish = async (session) => {
      if (cancelled) return;

      if (redirectParam) {
        navigate(redirectParam, { replace: true });
        return;
      }

      let profile = null;
      try {
        profile = session?.user ? await fetchAuthProfile(session.user.id) : null;
      } catch {
        profile = null;
      }
      if (cancelled) return;

      if (shouldPromptFranchiseIntent(profile)) {
        setShowFranchisePrompt(true);
        return;
      }

      const destination = await resolvePostLoginDestination(profile).catch(() => "/");
      if (!cancelled) navigate(destination, { replace: true });
    };

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data?.session) {
        finish(data.session);
        return;
      }

      // The session may still be parsing from the redirect URL — wait for it.
      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          listener.subscription.unsubscribe();
          finish(session);
        }
      });
      subscription = listener.subscription;

      timeoutId = setTimeout(() => {
        if (!cancelled) {
          setError("Sign-in didn't complete. Please try again.");
        }
      }, 10000);
    });

    return () => {
      cancelled = true;
      if (subscription) subscription.unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-md rounded-3xl border border-border/50 bg-card/70 p-8 text-center shadow-2xl">
        {error ? (
          <>
            <h1 className="font-display text-2xl font-bold text-foreground">Sign-in failed</h1>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            <Button asChild className="mt-6 w-full bg-primary text-primary-foreground">
              <Link to="/login">Back to sign in</Link>
            </Button>
          </>
        ) : (
          <>
            <span className="mx-auto block h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
            <h1 className="mt-4 font-display text-xl font-bold text-foreground">Signing you in…</h1>
            <p className="mt-2 text-sm text-muted-foreground">Just a moment while we finish setting things up.</p>
          </>
        )}
      </div>

      <FranchiseIntentModal
        open={showFranchisePrompt}
        onApply={() => navigate("/become-a-tenant", { replace: true })}
        onSkip={() => navigate("/", { replace: true })}
      />
    </main>
  );
}
