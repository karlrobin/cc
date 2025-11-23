import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase';

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const code = url.searchParams.get('code');
  const token_hash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');

  console.log('Callback received:', {
    code: code ? 'present' : 'missing',
    token_hash: token_hash ? 'present' : 'missing',
    type
  });

  const supabase = createSupabaseServerClient(cookies);

  // Handle PKCE flow (new @supabase/ssr method)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('PKCE auth error:', error.message);
      return redirect('/signin?error=invalid_link');
    }

    console.log('PKCE auth successful');
    return redirect('/');
  }

  // Handle legacy OTP flow (fallback)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any,
    });

    if (error) {
      console.error('OTP auth error:', error.message);
      return redirect('/signin?error=invalid_link');
    }

    console.log('OTP auth successful');
    return redirect('/');
  }

  console.error('No valid auth parameters found');
  return redirect('/signin?error=invalid_link');
};
