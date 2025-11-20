import type { APIRoute } from 'astro';
import { getSession } from '../../../../lib/auth';
import {
  getSettings,
  getAlbumsSince,
  getSubscribedMembers,
  updateSettings
} from '../../../../lib/directus';
import {
  sendEmail,
  generateNewsletterHtml,
  generateNewsletterText
} from '../../../../lib/mailgun';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const { user, membership } = await getSession(cookies);

  // Must be admin
  if (!user || !membership || membership.status !== 'approved' || membership.role !== 'admin') {
    return redirect('/');
  }

  const formData = await request.formData();
  const subject = formData.get('subject')?.toString();
  const previewText = formData.get('preview_text')?.toString();

  if (!subject) {
    return redirect('/admin/newsletter?error=missing_subject');
  }

  try {
    // Get settings and albums
    const settings = await getSettings();
    const lastSent = settings?.last_newsletter_sent;
    const sinceDate = lastSent
      ? new Date(lastSent)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const albums = await getAlbumsSince(sinceDate.toISOString());

    if (albums.length === 0) {
      return redirect('/admin/newsletter?error=no_albums');
    }

    // Get all subscribed members
    const subscribers = await getSubscribedMembers();

    if (subscribers.length === 0) {
      return redirect('/admin/newsletter?error=no_subscribers');
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
        subject,
        html,
        text,
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          ...(previewText && { 'X-Preview-Text': previewText })
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

    // Update last newsletter sent date
    await updateSettings({
      last_newsletter_sent: new Date().toISOString()
    });

    console.log(`Newsletter sent: ${successCount} success, ${failCount} failed`);

    return redirect(
      `/admin/newsletter?success=sent&count=${successCount}&failed=${failCount}`
    );
  } catch (error) {
    console.error('Error sending newsletter:', error);
    return redirect('/admin/newsletter?error=send_failed');
  }
};
