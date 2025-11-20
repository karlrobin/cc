/**
 * Mailgun email sending integration
 *
 * Uses Mailgun's REST API to send transactional emails.
 * Requires MAILGUN_API_KEY and MAILGUN_DOMAIN environment variables.
 */

const MAILGUN_API_KEY = import.meta.env.MAILGUN_API_KEY;
const MAILGUN_DOMAIN = import.meta.env.MAILGUN_DOMAIN;
const FROM_EMAIL = import.meta.env.MAILGUN_FROM_EMAIL || `noreply@${MAILGUN_DOMAIN}`;

if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
  console.warn('Mailgun not configured. Set MAILGUN_API_KEY and MAILGUN_DOMAIN environment variables.');
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  headers?: Record<string, string>;
}

/**
 * Send an email via Mailgun
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
    console.error('Mailgun not configured');
    return false;
  }

  const url = `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`;

  const formData = new FormData();
  formData.append('from', FROM_EMAIL);
  formData.append('to', options.to);
  formData.append('subject', options.subject);
  formData.append('html', options.html);
  if (options.text) {
    formData.append('text', options.text);
  }

  // Add custom headers
  if (options.headers) {
    for (const [key, value] of Object.entries(options.headers)) {
      formData.append(`h:${key}`, value);
    }
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`api:${MAILGUN_API_KEY}`)}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Mailgun API error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Generate newsletter HTML email
 */
export function generateNewsletterHtml(
  albums: Array<{
    title: string;
    slug: string;
    description?: string;
    date_published?: string;
    date_created: string;
    photos?: Array<{ url: string; caption?: string }>;
  }>,
  unsubscribeUrl: string,
  appUrl: string
): string {
  const directusUrl = import.meta.env.PUBLIC_DIRECTUS_URL;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Photo Albums</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      border-radius: 8px;
      padding: 32px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      color: #0066cc;
      margin-top: 0;
    }
    .album {
      margin: 32px 0;
      padding: 24px;
      border: 1px solid #eee;
      border-radius: 8px;
      background: #fafafa;
    }
    .album img {
      width: 100%;
      height: auto;
      border-radius: 4px;
      margin-bottom: 16px;
    }
    .album h2 {
      margin: 0 0 8px 0;
      font-size: 1.5rem;
    }
    .album p {
      margin: 8px 0;
      color: #666;
    }
    .album .meta {
      font-size: 0.875rem;
      color: #999;
    }
    .btn {
      display: inline-block;
      padding: 12px 24px;
      background: #0066cc;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      margin-top: 16px;
    }
    .footer {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #eee;
      font-size: 0.875rem;
      color: #666;
      text-align: center;
    }
    .footer a {
      color: #0066cc;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📸 New Photo Albums</h1>
    <p>Hello! We've added ${albums.length} new photo album${albums.length !== 1 ? 's' : ''} for you to enjoy.</p>

    ${albums.map(album => {
      const coverPhoto = album.photos?.[0];
      const coverUrl = coverPhoto
        ? `${directusUrl}/assets/${coverPhoto.url}?width=600&quality=80`
        : '';
      const albumUrl = `${appUrl}/albums/${album.slug}`;
      const pubDate = album.date_published || album.date_created;
      const photoCount = album.photos?.length || 0;

      return `
    <div class="album">
      ${coverUrl ? `<img src="${coverUrl}" alt="${album.title}">` : ''}
      <h2>${album.title}</h2>
      <p>${album.description || ''}</p>
      <p class="meta">
        ${photoCount} photo${photoCount !== 1 ? 's' : ''} •
        ${new Date(pubDate).toLocaleDateString()}
      </p>
      <a href="${albumUrl}" class="btn">View Album</a>
    </div>`;
    }).join('')}

    <div class="footer">
      <p>
        You're receiving this because you're a member of our photo blog.<br>
        <a href="${unsubscribeUrl}">Unsubscribe from future newsletters</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate plain text version of newsletter
 */
export function generateNewsletterText(
  albums: Array<{
    title: string;
    slug: string;
    description?: string;
    photos?: Array<any>;
  }>,
  unsubscribeUrl: string,
  appUrl: string
): string {
  return `
NEW PHOTO ALBUMS

Hello! We've added ${albums.length} new photo album${albums.length !== 1 ? 's' : ''} for you to enjoy.

${albums.map(album => {
  const photoCount = album.photos?.length || 0;
  const albumUrl = `${appUrl}/albums/${album.slug}`;
  return `
${album.title}
${album.description || ''}
${photoCount} photo${photoCount !== 1 ? 's' : ''}
View: ${albumUrl}
`;
}).join('\n---\n')}

---

You're receiving this because you're a member of our photo blog.
Unsubscribe: ${unsubscribeUrl}
`;
}
