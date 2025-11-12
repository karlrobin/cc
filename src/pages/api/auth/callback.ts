import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { setAuthCookies } from '../../../lib/auth';

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const token_hash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');

  if (token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any,
    });

    if (!error && data.session) {
      setAuthCookies(cookies, data.session.access_token, data.session.refresh_token);
      return redirect('/');
    }
  }

  return redirect('/signin?error=invalid_link');
};
