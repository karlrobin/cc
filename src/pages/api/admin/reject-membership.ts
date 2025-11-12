import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { getSession } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const { user, membership } = await getSession(cookies);
  const isAdmin = membership?.role === 'admin' && membership?.status === 'approved';

  if (!isAdmin) {
    return new Response('Unauthorized', { status: 401 });
  }

  const formData = await request.formData();
  const membershipId = formData.get('membership_id')?.toString();

  if (!membershipId) {
    return new Response('Missing membership_id', { status: 400 });
  }

  const { error } = await supabase
    .from('memberships')
    .update({
      status: 'rejected'
    })
    .eq('id', membershipId);

  if (error) {
    return new Response(error.message, { status: 400 });
  }

  return redirect('/admin?success=rejected');
};
