import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase';

export const GET: APIRoute = async ({ cookies, redirect }) => {
  const supabase = createSupabaseServerClient(cookies);

  // Sign out and clear session cookies automatically
  await supabase.auth.signOut();

  return redirect('/');
};
