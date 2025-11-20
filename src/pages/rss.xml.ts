import type { APIRoute } from 'astro';
import { getPublishedAlbums, getMembershipByRssToken } from '../lib/directus';

/**
 * RSS feed with per-user token authentication
 * Access via: /rss.xml?token=YOUR_RSS_TOKEN
 *
 * Each member gets a unique RSS token that can be revoked independently.
 */
export const GET: APIRoute = async ({ url, request }) => {
  const token = url.searchParams.get('token');

  // Require RSS token for access
  if (!token) {
    return new Response('RSS token required. Access via: /rss.xml?token=YOUR_TOKEN', {
      status: 401,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  // Validate token and check membership
  const membership = await getMembershipByRssToken(token);
  if (!membership) {
    return new Response('Invalid or expired RSS token', {
      status: 403,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  // Fetch all published albums
  const albums = await getPublishedAlbums();

  // Get app URL from environment or request
  const appUrl = import.meta.env.PUBLIC_APP_URL || new URL(request.url).origin;

  // Generate RSS XML
  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Private Photo Blog</title>
    <link>${appUrl}</link>
    <description>Beautiful photo albums for members</description>
    <language>en-us</language>
    <atom:link href="${appUrl}/rss.xml?token=${token}" rel="self" type="application/rss+xml" />
    ${albums.map(album => {
      const pubDate = album.date_published || album.date_created;
      const albumUrl = `${appUrl}/albums/${album.slug}`;

      // Get cover image or first photo
      const coverPhoto = album.photos?.[0];
      const directusUrl = import.meta.env.PUBLIC_DIRECTUS_URL;
      const coverImageUrl = coverPhoto
        ? `${directusUrl}/assets/${coverPhoto.url}?width=1200&quality=80`
        : '';

      // Generate description with photo count and first photo
      const photoCount = album.photos?.length || 0;
      const description = `${album.description || ''} (${photoCount} photo${photoCount !== 1 ? 's' : ''})`;

      return `
    <item>
      <title>${escapeXml(album.title)}</title>
      <link>${albumUrl}</link>
      <guid isPermaLink="true">${albumUrl}</guid>
      <description>${escapeXml(description)}</description>
      <pubDate>${new Date(pubDate).toUTCString()}</pubDate>
      ${coverImageUrl ? `<media:content url="${coverImageUrl}" medium="image" />` : ''}
    </item>`;
    }).join('')}
  </channel>
</rss>`;

  return new Response(rss, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'max-age=3600' // Cache for 1 hour
    }
  });
};

/**
 * Escape XML special characters
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
