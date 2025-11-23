import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase';

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const token_hash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');

  console.log('Callback received:', { token_hash: token_hash ? 'present' : 'missing', type });

  if (token_hash && type) {
    const supabase = createSupabaseServerClient(cookies);

    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any,
    });

    if (error) {
      console.error('Auth error:', error.message);
    } else {
      console.log('Auth successful');
    }

    // @supabase/ssr automatically sets cookies if verification succeeds
    if (!error) {
      return redirect('/');
    }
  }

  return redirect('/signin?error=invalid_link');
};
