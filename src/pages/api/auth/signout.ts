import type { APIRoute } from 'astro';
import { clearAuthCookies } from '../../../lib/auth';

export const GET: APIRoute = async ({ cookies, redirect }) => {
  clearAuthCookies(cookies);
  return redirect('/');
};
