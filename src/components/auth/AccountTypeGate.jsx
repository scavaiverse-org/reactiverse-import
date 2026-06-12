import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Building2, Compass } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ROLES, normalizeRole } from "@/lib/rbac";

// Routes where the chooser must never block (auth flows themselves).
const EXCLUDED_PREFIXES = ["/login", "/signup", "/auth/callback", "/tenant-login"];

// Dispatched (e.g. by the homepage "switch account type" link) to make the
// gate re-check the profile and reappear.
export const ACCOUNT_TYPE_RESET_EVENT = "scaverse:account-type-reset";

const CHOICES = [
  {
    type: "consumer",
    icon: Compass,
    title: "I'm a Consumer",
    description: "Explore virtual museums, book tours, and enjoy cultural experiences.",
  },
  {
    type: "franchisee",
    icon: Building2,
    title: "I'm a Franchisee",
    description: "I want to open my own museum, attraction, or cultural space on SCAVerse.",
  },
];

/**
 * Mandatory one-time onboarding choice. Any signed-in public user who has
 * not yet picked an account type sees this fullscreen overlay on every
 * route (except the auth pages) until they answer. The choice is stored in
 * profiles.account_type and can be re-opened later via the reset event.
 */
export default function AccountTypeGate() {
  const location = useLocation();
  const navigate = useNavigate();
  const [pendingUserId, setPendingUserId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const evaluate = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const user = data?.session?.user;
    if (!user) {
      setPendingUserId(null);
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, account_type")
      .eq("id", user.id)
      .single();
    const needsChoice =
      !!profile && !profile.account_type && normalizeRole(profile.role) === ROLES.PUBLIC_USER;
    setPendingUserId(needsChoice ? user.id : null);
  }, []);

  useEffect(() => {
    evaluate();
    const { data: listener } = supabase.auth.onAuthStateChange(() => evaluate());
    window.addEventListener(ACCOUNT_TYPE_RESET_EVENT, evaluate);
    return () => {
      listener.subscription.unsubscribe();
      window.removeEventListener(ACCOUNT_TYPE_RESET_EVENT, evaluate);
    };
  }, [evaluate]);

  const excluded = EXCLUDED_PREFIXES.some((prefix) => location.pathname.startsWith(prefix));
  if (!pendingUserId || excluded) return null;

  const choose = async (type) => {
    setSaving(true);
    setError("");
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ account_type: type })
      .eq("id", pendingUserId);
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setPendingUserId(null);
    navigate(type === "franchisee" ? "/become-a-tenant" : "/platform/overview");
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-background/90 px-4 py-8 backdrop-blur-md">
      <div className="w-full max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">SCAVerse</p>
        <h2 className="mt-3 font-display text-2xl font-bold text-foreground sm:text-3xl">
          How will you use SCAVerse?
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Pick the option that fits you best — you can change this anytime later.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {CHOICES.map(({ type, icon: Icon, title, description }) => (
            <button
              key={type}
              type="button"
              disabled={saving}
              onClick={() => choose(type)}
              className="group rounded-3xl border border-border/50 bg-card/70 p-7 text-left shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:bg-card disabled:opacity-60"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/25 bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
              <span className="mt-4 inline-block text-xs font-semibold uppercase tracking-[0.16em] text-primary opacity-0 transition group-hover:opacity-100">
                {saving ? "Saving…" : "Choose →"}
              </span>
            </button>
          ))}
        </div>

        {error && (
          <p className="mx-auto mt-4 max-w-md rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
