import type { AstroCookies } from 'astro';
import { getUser } from './supabase';
import { getMembershipByUserId } from './directus';

export async function getSession(cookies: AstroCookies) {
  const accessToken = cookies.get('sb-access-token')?.value;
  const refreshToken = cookies.get('sb-refresh-token')?.value;

  if (!accessToken || !refreshToken) {
    return { user: null, membership: null };
  }

  const user = await getUser(accessToken);
  if (!user) {
    return { user: null, membership: null };
  }

  // Get membership from Directus instead of Supabase
  const membership = await getMembershipByUserId(user.id);

  return { user, membership };
}

export function setAuthCookies(cookies: AstroCookies, accessToken: string, refreshToken: string) {
  const maxAge = 60 * 60 * 24 * 365; // 1 year

  cookies.set('sb-access-token', accessToken, {
    path: '/',
    maxAge,
    httpOnly: true,
    secure: true,
    sameSite: 'lax'
  });

  cookies.set('sb-refresh-token', refreshToken, {
    path: '/',
    maxAge,
    httpOnly: true,
    secure: true,
    sameSite: 'lax'
  });
}

export function clearAuthCookies(cookies: AstroCookies) {
  cookies.delete('sb-access-token', { path: '/' });
  cookies.delete('sb-refresh-token', { path: '/' });
}
