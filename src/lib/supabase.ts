import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

export async function getUser(accessToken: string) {
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (error) return null;
  return user;
}

export async function getMembershipStatus(userId: string) {
  const { data, error } = await supabase
    .from('memberships')
    .select('status, role')
    .eq('user_id', userId)
    .single();

  if (error) return null;
  return data;
}
