import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext();

async function buildUser(authUser) {
  if (!authUser) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, tenant_ids, avatar_url')
    .eq('id', authUser.id)
    .single();
  if (!profile) return authUser;
  return {
    ...authUser,
    role: profile.role,
    fullName: profile.full_name,
    tenantIds: profile.tenant_ids ?? [],
    avatarUrl: profile.avatar_url,
  };
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState({});

  useEffect(() => {
    let initialised = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const enriched = await buildUser(session?.user ?? null);
      setUser(enriched);
      setIsAuthenticated(!!enriched);
      setIsLoadingAuth(false);
      setAuthChecked(true);
      initialised = true;
    });

    // Fallback: if onAuthStateChange never fires (e.g. no session), resolve after getSession
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (initialised) return;
      const enriched = await buildUser(session?.user ?? null);
      setUser(enriched);
      setIsAuthenticated(!!enriched);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const navigateToLogin = () => {
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      authChecked,
      appPublicSettings,
      logout,
      navigateToLogin,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
