import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { updateMembership } from '../../../lib/directus';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const { user, membership } = await getSession(cookies);

  // Must be authenticated and approved
  if (!user || !membership || membership.status !== 'approved') {
    return redirect('/signin');
  }

  const formData = await request.formData();
  const subscribed = formData.get('subscribed') === 'on';

  try {
    await updateMembership(membership.id, {
      newsletter_subscribed: subscribed
    });

    return redirect('/settings?success=newsletter_updated');
  } catch (error) {
    console.error('Error updating newsletter preference:', error);
    return redirect('/settings?error=update_failed');
  }
};
