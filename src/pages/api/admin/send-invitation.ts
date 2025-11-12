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
  const email = formData.get('email')?.toString();

  if (!email) {
    return new Response('Missing email', { status: 400 });
  }

  // Generate invitation token
  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  const { error } = await supabase
    .from('invitation_tokens')
    .insert({
      email,
      token,
      invited_by: user!.id,
      expires_at: expiresAt.toISOString()
    });

  if (error) {
    return new Response(error.message, { status: 400 });
  }

  // In a real app, you would send an email here with the invitation link
  // For now, just redirect back with the token in the URL for demo purposes
  // const inviteLink = `${new URL(request.url).origin}/invite?token=${token}`;

  // TODO: Send email with invitation link

  return redirect('/admin?success=invitation_sent');
};
