import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { getSession } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const { user } = await getSession(cookies);

  if (!user) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const formData = await request.formData();
  const message = formData.get('message')?.toString() || '';

  // Check if already has membership record
  const { data: existing } = await supabase
    .from('memberships')
    .select('id, status')
    .eq('user_id', user.id)
    .single();

  if (existing) {
    return redirect('/request-access?error=already_requested');
  }

  // Create membership request
  const { error } = await supabase
    .from('memberships')
    .insert({
      user_id: user.id,
      email: user.email,
      status: 'pending',
      role: 'member',
      request_message: message
    });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return redirect('/request-access?success=true');
};
