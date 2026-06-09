import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  || 'https://golunqdunvmubuprufmp.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvbHVucWR1bnZtdWJ1cHJ1Zm1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NzQ3MjQsImV4cCI6MjA5NjM1MDcyNH0.kBKzO-oQv4ScHPDuyfxAvIHD36KLfKev2Psr2-UI74w';

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

function makeQueryStub() {
  const resolved = Promise.resolve({ data: null, error: null });
  const stub = {
    select: () => makeQueryStub(),
    eq: () => makeQueryStub(),
    neq: () => makeQueryStub(),
    in: () => makeQueryStub(),
    is: () => makeQueryStub(),
    not: () => makeQueryStub(),
    or: () => makeQueryStub(),
    order: () => makeQueryStub(),
    limit: () => makeQueryStub(),
    filter: () => makeQueryStub(),
    insert: () => makeQueryStub(),
    update: () => makeQueryStub(),
    delete: () => makeQueryStub(),
    upsert: () => makeQueryStub(),
    single: () => resolved,
    maybeSingle: () => resolved,
    then: (resolve, reject) => Promise.resolve({ data: [], error: null }).then(resolve, reject),
    catch: (fn) => resolved.catch(fn),
    finally: (fn) => resolved.finally(fn),
  };
  return stub;
}

function makeMissingConfigClient() {
  const message =
    'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the build environment (Cloudflare Pages → Settings → Environment Variables) and redeploy.';
  if (typeof console !== 'undefined') console.error('[supabase]', message);
  const sessionStub = { data: { session: null, user: null }, error: null };
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
    from: () => makeQueryStub(),
    rpc: () => Promise.resolve({ data: null, error: null }),
    channel: () => ({ on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }), subscribe: () => ({ unsubscribe: () => {} }) }),
    functions: { invoke: async () => ({ data: null, error: null }) },
    storage: { from: () => makeQueryStub() },
  };
}

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey)
  : makeMissingConfigClient();
