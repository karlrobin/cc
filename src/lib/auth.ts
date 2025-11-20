import type { AstroCookies } from 'astro';
import { createSupabaseServerClient } from './supabase';
import { getMembershipByUserId } from './directus';

/**
 * Gets the current session including Supabase user and Directus membership
 * Uses @supabase/ssr for automatic session management
 */
export async function getSession(cookies: AstroCookies) {
  const supabase = createSupabaseServerClient(cookies);

  // Get user from Supabase (automatically handles tokens and refresh)
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, membership: null };
  }

  // Get membership from Directus
  const membership = await getMembershipByUserId(user.id);

  return { user, membership };
}
