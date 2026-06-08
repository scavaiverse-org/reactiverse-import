import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

function makeMissingConfigClient() {
  const message =
    'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the build environment (Cloudflare Pages → Settings → Environment Variables) and redeploy.';
  if (typeof console !== 'undefined') console.error('[supabase]', message);
  const stubFn = () => { throw new Error(message); };
  const stubChain = new Proxy(stubFn, { get: () => stubChain, apply: () => stubChain });
  const sessionStub = { data: { session: null, user: null }, error: { message } };
  return {
    auth: {
      getSession: async () => sessionStub,
      getUser: async () => sessionStub,
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signOut: async () => ({ error: null }),
      signInWithPassword: async () => sessionStub,
      signInWithOtp: async () => sessionStub,
      signUp: async () => sessionStub,
    },
    from: () => stubChain,
    rpc: () => stubChain,
    channel: () => ({ on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }), subscribe: () => ({ unsubscribe: () => {} }) }),
    functions: { invoke: async () => ({ data: null, error: { message } }) },
    storage: { from: () => stubChain },
  };
}

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey)
  : makeMissingConfigClient();
