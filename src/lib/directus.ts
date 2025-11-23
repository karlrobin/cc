import { createDirectus, rest, readItems, readItem, createItem, updateItem } from '@directus/sdk';

const directusUrl = import.meta.env.PUBLIC_DIRECTUS_URL;

if (!directusUrl) {
  throw new Error('Missing PUBLIC_DIRECTUS_URL environment variable');
}

// Define schema types for type safety
export interface Photo {
  id: string;
  url: string;
  caption?: string;
  sort?: number;
}

export interface Album {
  id: string;
  slug: string;
  title: string;
  description?: string;
  date_created: string;
  date_published?: string;
  status: 'published' | 'draft' | 'archived';
  cover_image?: string;
  photos?: Photo[];
}

export interface Membership {
  id: string;
  user_id: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  role: 'member' | 'admin';
  request_message?: string;
  approved_at?: string;
  date_created: string;
  rss_token?: string;
  newsletter_subscribed?: boolean;
  unsubscribe_token?: string;
}

export interface Settings {
  id: number;
  last_newsletter_sent?: string;
}

export interface Newsletter {
  id: string;
  subject: string;
  preview_text?: string;
  status: 'draft' | 'send_now' | 'sent';
  sent_at?: string;
  recipient_count?: number;
  albums_included?: number;
  error_message?: string;
  date_created: string;
  date_updated: string;
}

interface DirectusSchema {
  albums: Album[];
  photos: Photo[];
  memberships: Membership[];
  settings: Settings[];
  newsletters: Newsletter[];
}

// Create Directus client
export const directus = createDirectus<DirectusSchema>(directusUrl).with(rest());

// Helper functions for fetching albums
export async function getPublishedAlbums() {
  try {
    const albums = await directus.request(
      readItems('albums', {
        filter: {
          status: { _eq: 'published' }
        },
        fields: ['*', { photos: ['*'] }],
        // Sort by date_published (when first published)
        // If you want republished albums to appear at top, use date_updated instead
        sort: ['-date_published']
      })
    );
    return albums;
  } catch (error) {
    console.error('Error fetching albums:', error);
    return [];
  }
}

export async function getAlbumBySlug(slug: string) {
  try {
    const albums = await directus.request(
      readItems('albums', {
        filter: {
          slug: { _eq: slug },
          status: { _eq: 'published' }
        },
        fields: ['*', { photos: ['*'] }],
        limit: 1
      })
    );
    return albums[0] || null;
  } catch (error) {
    console.error('Error fetching album:', error);
    return null;
  }
}

export async function getAlbumById(id: string) {
  try {
    const album = await directus.request(
      readItem('albums', id, {
        fields: ['*', { photos: ['*'] }]
      })
    );
    return album;
  } catch (error) {
    console.error('Error fetching album:', error);
    return null;
  }
}

// Membership functions
export async function getMembershipByUserId(userId: string) {
  try {
    const memberships = await directus.request(
      readItems('memberships', {
        filter: {
          user_id: { _eq: userId }
        },
        limit: 1
      })
    );
    return memberships[0] || null;
  } catch (error) {
    console.error('Error fetching membership:', error);
    return null;
  }
}

export async function createMembership(data: {
  user_id: string;
  email: string;
  request_message?: string;
}) {
  try {
    const membership = await directus.request(
      createItem('memberships', {
        user_id: data.user_id,
        email: data.email,
        status: 'pending',
        role: 'member',
        request_message: data.request_message || null,
        newsletter_subscribed: true, // Subscribe by default
        rss_token: crypto.randomUUID(),
        unsubscribe_token: crypto.randomUUID()
      })
    );
    return membership;
  } catch (error) {
    console.error('Error creating membership:', error);
    throw error;
  }
}

export async function getMembershipByRssToken(token: string) {
  try {
    const memberships = await directus.request(
      readItems('memberships', {
        filter: {
          rss_token: { _eq: token },
          status: { _eq: 'approved' }
        },
        limit: 1
      })
    );
    return memberships[0] || null;
  } catch (error) {
    console.error('Error fetching membership by RSS token:', error);
    return null;
  }
}

export async function getMembershipByUnsubscribeToken(token: string) {
  try {
    const memberships = await directus.request(
      readItems('memberships', {
        filter: {
          unsubscribe_token: { _eq: token }
        },
        limit: 1
      })
    );
    return memberships[0] || null;
  } catch (error) {
    console.error('Error fetching membership by unsubscribe token:', error);
    return null;
  }
}

export async function updateMembership(id: string, data: Partial<Membership>) {
  try {
    const membership = await directus.request(
      updateItem('memberships', id, data)
    );
    return membership;
  } catch (error) {
    console.error('Error updating membership:', error);
    throw error;
  }
}

export async function getSubscribedMembers() {
  try {
    const memberships = await directus.request(
      readItems('memberships', {
        filter: {
          status: { _eq: 'approved' },
          newsletter_subscribed: { _eq: true }
        }
      })
    );
    return memberships;
  } catch (error) {
    console.error('Error fetching subscribed members:', error);
    return [];
  }
}

export async function getAlbumsSince(date: string) {
  try {
    const albums = await directus.request(
      readItems('albums', {
        filter: {
          status: { _eq: 'published' },
          date_published: { _gte: date }
        },
        fields: ['*', { photos: ['*'] }],
        sort: ['-date_published']
      })
    );
    return albums;
  } catch (error) {
    console.error('Error fetching albums since date:', error);
    return [];
  }
}

// Settings functions
export async function getSettings() {
  try {
    const settings = await directus.request(
      readItems('settings', { limit: 1 })
    );
    return settings[0] || null;
  } catch (error) {
    console.error('Error fetching settings:', error);
    return null;
  }
}

export async function updateSettings(data: Partial<Settings>) {
  try {
    // Settings collection should have ID 1 (singleton)
    const settings = await directus.request(
      updateItem('settings', 1, data)
    );
    return settings;
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
}

// Newsletter functions
export async function getNewsletterById(id: string) {
  try {
    const newsletter = await directus.request(
      readItem('newsletters', id)
    );
    return newsletter;
  } catch (error) {
    console.error('Error fetching newsletter:', error);
    return null;
  }
}

export async function updateNewsletter(id: string, data: Partial<Newsletter>) {
  try {
    const newsletter = await directus.request(
      updateItem('newsletters', id, data)
    );
    return newsletter;
  } catch (error) {
    console.error('Error updating newsletter:', error);
    throw error;
  }
}
