import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export function getServiceRoleClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SECRET_KEYS')!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export function getUserClient(authHeader: string) {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_PUBLISHABLE_KEYS')!,
    { global: { headers: { Authorization: authHeader } } },
  );
}

// Resolves the authenticated user plus their role from the profiles table.
export async function getAuthUser(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;
  const userClient = getUserClient(authHeader);
  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) return null;
  const service = getServiceRoleClient();
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).maybeSingle();
  return { ...user, role: (profile?.role as string) || 'visitor' };
}
