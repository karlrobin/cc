import type { APIRoute } from 'astro';
import {
  getNewsletterById,
  updateNewsletter,
  getSettings,
  getAlbumsSince,
  getSubscribedMembers,
  updateSettings
} from '../../../lib/directus';
import {
  sendEmail,
  generateNewsletterHtml,
  generateNewsletterText
} from '../../../lib/mailgun';

/**
 * Webhook endpoint for Directus Flows
 * Triggered when a newsletter status changes to "send_now"
 *
 * Expected payload from Directus Flow:
 * {
 *   "newsletter_id": "uuid",
 *   "trigger": "send_now"
 * }
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // Verify request (you could add a secret token here for security)
    const payload = await request.json();
    const { newsletter_id } = payload;

    if (!newsletter_id) {
      return new Response(
        JSON.stringify({ error: 'Missing newsletter_id' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch newsletter from Directus
    const newsletter = await getNewsletterById(newsletter_id);

    if (!newsletter) {
      return new Response(
        JSON.stringify({ error: 'Newsletter not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify status is send_now
    if (newsletter.status !== 'send_now') {
      return new Response(
        JSON.stringify({ error: 'Newsletter status is not send_now' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get settings and albums
    const settings = await getSettings();
    const lastSent = settings?.last_newsletter_sent;
    const sinceDate = lastSent
      ? new Date(lastSent)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    const albums = await getAlbumsSince(sinceDate.toISOString());

    if (albums.length === 0) {
      await updateNewsletter(newsletter_id, {
        status: 'draft',
        error_message: 'No new albums to include in newsletter'
      });

      return new Response(
        JSON.stringify({ error: 'No new albums to send' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get all subscribed members
    const subscribers = await getSubscribedMembers();

    if (subscribers.length === 0) {
      await updateNewsletter(newsletter_id, {
        status: 'draft',
        error_message: 'No subscribers found'
      });

      return new Response(
        JSON.stringify({ error: 'No subscribers' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const appUrl = import.meta.env.PUBLIC_APP_URL || new URL(request.url).origin;

    // Send email to each subscriber
    let successCount = 0;
    let failCount = 0;

    for (const subscriber of subscribers) {
      if (!subscriber.unsubscribe_token) {
        console.error(`Subscriber ${subscriber.email} missing unsubscribe token`);
        failCount++;
        continue;
      }

      const unsubscribeUrl = `${appUrl}/api/newsletter/unsubscribe?token=${subscriber.unsubscribe_token}`;

      const html = generateNewsletterHtml(albums, unsubscribeUrl, appUrl);
      const text = generateNewsletterText(albums, unsubscribeUrl, appUrl);

      const success = await sendEmail({
        to: subscriber.email,
        subject: newsletter.subject,
        html,
        text,
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          ...(newsletter.preview_text && { 'X-Preview-Text': newsletter.preview_text })
        }
      });

      if (success) {
        successCount++;
      } else {
        failCount++;
      }

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Update newsletter record
    const now = new Date().toISOString();
    await updateNewsletter(newsletter_id, {
      status: 'sent',
      sent_at: now,
      recipient_count: successCount,
      albums_included: albums.length,
      error_message: failCount > 0 ? `${failCount} emails failed to send` : undefined
    });

    // Update last newsletter sent date
    await updateSettings({
      last_newsletter_sent: now
    });

    console.log(`Newsletter sent: ${successCount} success, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        failed: failCount,
        albums: albums.length
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending newsletter:', error);

    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
