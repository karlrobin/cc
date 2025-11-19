import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { getMembershipByUserId, createMembership } from '../../../lib/directus';

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

  // Check if already has membership record in Directus
  const existing = await getMembershipByUserId(user.id);

  if (existing) {
    return redirect('/request-access?error=already_requested');
  }

  // Create membership request in Directus
  try {
    await createMembership({
      user_id: user.id,
      email: user.email!,
      request_message: message
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return redirect('/request-access?success=true');
};
