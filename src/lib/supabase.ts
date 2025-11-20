import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { AstroCookies } from 'astro';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

/**
 * Creates a Supabase server client for SSR with automatic cookie handling
 * This follows the official Astro + Supabase SSR integration pattern
 */
export function createSupabaseServerClient(cookies: AstroCookies) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        cookies.set(name, value, {
          ...options,
          // Ensure cookies work in SSR
          path: '/',
          sameSite: 'lax',
          httpOnly: true,
          secure: true,
        });
      },
      remove(name: string, options: CookieOptions) {
        cookies.delete(name, {
          ...options,
          path: '/',
        });
      },
    },
  });
}
