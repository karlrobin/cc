import type { APIRoute } from 'astro';
import { getMembershipByUnsubscribeToken, updateMembership } from '../../../lib/directus';

/**
 * One-click unsubscribe endpoint
 * Supports both GET (for clicking link) and POST (for RFC 8058 one-click)
 */
export const GET: APIRoute = async ({ url, redirect }) => {
  const token = url.searchParams.get('token');

  if (!token) {
    return new Response('Missing unsubscribe token', { status: 400 });
  }

  const membership = await getMembershipByUnsubscribeToken(token);

  if (!membership) {
    return new Response('Invalid unsubscribe token', { status: 404 });
  }

  // If already unsubscribed, show confirmation
  if (!membership.newsletter_subscribed) {
    return redirect('/unsubscribe-confirm?already=true');
  }

  // Unsubscribe the user
  try {
    await updateMembership(membership.id, {
      newsletter_subscribed: false
    });

    return redirect('/unsubscribe-confirm?success=true');
  } catch (error) {
    console.error('Error unsubscribing:', error);
    return redirect('/unsubscribe-confirm?error=true');
  }
};

/**
 * POST endpoint for RFC 8058 one-click unsubscribe
 * Email clients can automatically unsubscribe without user interaction
 */
export const POST: APIRoute = async ({ url }) => {
  const token = url.searchParams.get('token');

  if (!token) {
    return new Response('Missing token', { status: 400 });
  }

  const membership = await getMembershipByUnsubscribeToken(token);

  if (!membership) {
    return new Response('Invalid token', { status: 404 });
  }

  // Already unsubscribed is still a success
  if (!membership.newsletter_subscribed) {
    return new Response('Already unsubscribed', { status: 200 });
  }

  try {
    await updateMembership(membership.id, {
      newsletter_subscribed: false
    });

    return new Response('Unsubscribed successfully', { status: 200 });
  } catch (error) {
    console.error('Error unsubscribing:', error);
    return new Response('Failed to unsubscribe', { status: 500 });
  }
};
