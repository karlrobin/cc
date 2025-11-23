import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase';

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const code = url.searchParams.get('code');

  console.log('Callback received, code:', code ? 'present' : 'missing');

  if (code) {
    const supabase = createSupabaseServerClient(cookies);

    // The @supabase/ssr client should have the code_verifier in cookies
    // Let's exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Auth error:', error.message);
      console.error('Error details:', error);
      return redirect('/signin?error=invalid_link');
    }

    console.log('Auth successful, user:', data.user?.email);
    return redirect('/');
  }

  console.error('No auth code found in callback');
  return redirect('/signin?error=invalid_link');
};
