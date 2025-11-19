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
}

interface DirectusSchema {
  albums: Album[];
  photos: Photo[];
  memberships: Membership[];
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
        sort: ['-date_published', '-date_created']
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
        request_message: data.request_message || null
      })
    );
    return membership;
  } catch (error) {
    console.error('Error creating membership:', error);
    throw error;
  }
}
