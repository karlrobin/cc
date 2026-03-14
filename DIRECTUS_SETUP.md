# Directus CMS Setup Guide

This guide walks you through setting up Directus CMS to manage your photo blog's albums, photos, and memberships.

## Quick Start

### Option 1: Directus Cloud (Recommended for Beginners)

1. Sign up at [directus.cloud](https://directus.cloud)
2. Create a new project
3. Copy your project URL (e.g., `https://your-project.directus.app`)
4. Update `.env`:
   ```env
   PUBLIC_DIRECTUS_URL=https://your-project.directus.app
   ```

### Option 2: Self-Hosted (Docker)

1. Create a `docker-compose.yml`:

```yaml
version: '3'
services:
  directus:
    image: directus/directus:latest
    ports:
      - 8055:8055
    volumes:
      - ./directus/database:/directus/database
      - ./directus/uploads:/directus/uploads
      - ./directus/extensions:/directus/extensions
    environment:
      KEY: 'replace-with-random-value'
      SECRET: 'replace-with-random-value'
      ADMIN_EMAIL: 'admin@example.com'
      ADMIN_PASSWORD: 'your-secure-password'
      DB_CLIENT: 'sqlite3'
      DB_FILENAME: '/directus/database/data.db'
      WEBSOCKETS_ENABLED: true
```

2. Run:
   ```bash
   docker-compose up -d
   ```

3. Access Directus at `http://localhost:8055`

## Creating the Data Model

### 1. Albums Collection

Go to **Settings** → **Data Model** → **Create Collection** → name it `albums`.

Add these fields:

| Field Name | Type | Interface | Options |
|------------|------|-----------|---------|
| `slug` | String | Input | Required, Unique. Validation: `^[a-z0-9-]+$` |
| `title` | String | Input | Required |
| `description` | Text | Textarea | Optional |
| `status` | String | Dropdown | Default: `draft`. Choices: `published`, `draft`, `archived` |
| `date_published` | Timestamp | Datetime | Optional |
| `cover_image` | UUID | Image | Optional (File relation). Uses first photo if not set |

### 2. Photos Collection

Create a new collection named `photos` with these fields:

| Field Name | Type | Interface | Options |
|------------|------|-----------|---------|
| `album` | UUID | Many-to-One | Required. Related to `albums`. Display: `{{title}}` |
| `url` | UUID | Image | Required. Related to `directus_files` |
| `caption` | String | Input | Optional |
| `sort` | Integer | Input | Default: 0. Used for ordering |

### 3. Album ↔ Photos Relationship

Go back to the `albums` collection and add a field:
- Name: `photos`, Type: One-to-Many (O2M), Related Collection: `photos`, Foreign Key: `album`, Sort Field: `sort`

### 4. Memberships Collection

Create a new collection named `memberships` with these fields:

| Field Name | Type | Interface | Options |
|------------|------|-----------|---------|
| `user_id` | String | Input | Required, Unique. Stores Supabase user ID |
| `email` | String | Input | Required, Unique |
| `status` | String | Dropdown | Default: `pending`. Choices: `pending`, `approved`, `rejected` |
| `role` | String | Dropdown | Default: `member`. Choices: `member`, `admin` |
| `request_message` | Text | Textarea | Optional |
| `approved_at` | Timestamp | Datetime | Optional |
| `rss_token` | String (UUID) | Input | Optional, Unique. Auto-generated for RSS feeds |
| `newsletter_subscribed` | Boolean | Toggle | Default: `true` |
| `unsubscribe_token` | String (UUID) | Input | Optional, Unique. Auto-generated for unsubscribe links |

### 5. Settings Collection (Singleton)

Create a collection named `settings`. Enable **Treat as a single object** (singleton).

| Field Name | Type | Interface | Options |
|------------|------|-----------|---------|
| `last_newsletter_sent` | Timestamp | Datetime | Optional. Tracks when last newsletter was sent |

After creating, go to **Content** → **Settings** and save the auto-created record.

### 6. Newsletters Collection

Create a collection named `newsletters` with these fields:

| Field Name | Type | Interface | Options |
|------------|------|-----------|---------|
| `subject` | String | Input | Required |
| `preview_text` | String | Input | Optional, max 100 chars |
| `status` | String | Dropdown | Default: `draft`. Choices: `draft`, `send_now`, `sent` |
| `sent_at` | Timestamp | Datetime | Optional, read-only (set by webhook) |
| `recipient_count` | Integer | Input | Optional, read-only (set by webhook) |
| `albums_included` | Integer | Input | Optional, read-only (set by webhook) |
| `error_message` | Text | Textarea | Optional, read-only (set by webhook) |

## Configuring Public Access

### 1. Create a Public Role

Go to **Settings** → **Roles & Permissions** → **Create Role** → name it `Public` and check **Public Role**.

### 2. Set Permissions

| Collection | Create | Read | Update | Delete |
|------------|--------|------|--------|--------|
| `albums` | No | Published only (`status = published`) | No | No |
| `photos` | No | All | No | No |
| `memberships` | All (for requests) | Own only (`user_id = $CURRENT_USER`) | No | No |
| `directus_files` | No | All | No | No |
| `settings` | No | All | No | No |

The admin role (default in Directus) should have full access to all collections.

## Adding Your First Album

1. Go to **Content** → **Albums** → **Create Item**
2. Fill in: slug (`summer-2024`), title, description, status (`published`), date
3. Save, then go to **Content** → **Photos** → **Create Item**
4. Select your album, upload image, add caption, set sort order
5. Repeat for all photos (or add photos from the album detail view)

## Managing Memberships

### Creating Your First Admin

1. Sign in to your photo blog once (creates your Supabase user)
2. In Supabase dashboard → **Authentication** → **Users**, copy your UUID
3. In Directus → **Content** → **Memberships** → **Create Item**:
   - **User ID**: your UUID
   - **Email**: your email
   - **Status**: `approved`
   - **Role**: `admin`
   - **Approved At**: current date
4. Save — you now have full access

### Reviewing Requests

1. Go to **Content** → **Memberships**, filter by status `pending`
2. Click a request → change status to `approved` or `rejected` → save
3. Approved users can immediately access albums

### Making Someone an Admin

Change their membership **Role** to `admin` and ensure **Status** is `approved`.

### Batch Operations

Select multiple memberships for bulk approve/reject, or filter by status/role/email.

## Newsletter Setup (Directus Flows)

### 1. Create the Flow

1. Go to **Settings** → **Flows** → **Create Flow**
2. Name: `Send Newsletter`, Status: `Active`, Type: Event Hook

### 2. Configure Trigger

- Event: `items.update`
- Collections: `newsletters`
- Condition: `status` equals `send_now`

### 3. Add Webhook Operation

- Click `+` after the trigger
- Operation: **Webhook / Request URL**
- Method: `POST`
- URL: `{{$env.PUBLIC_APP_URL}}/api/webhooks/newsletter`
- Body:
  ```json
  {
    "newsletter_id": "{{$trigger.key}}",
    "trigger": "send_now"
  }
  ```

### Sending a Newsletter

1. Go to **Content** → **Newsletters** → **Create Item**
2. Fill in subject and optional preview text, keep status as `draft`, save
3. When ready, change status to `send_now` and save — the Flow triggers automatically
4. Check the record afterward: status changes to `sent` with delivery stats

### Troubleshooting Flows

- **Flow not triggering**: Check Flow status is `Active` and condition filter is correct
- **Webhook failing**: Verify `PUBLIC_APP_URL` is set and Astro app is running
- **Emails not sending**: Check Mailgun credentials in `.env`, verify subscribed members exist, check `error_message` field

## Production Deployment

For production, consider:
- Use PostgreSQL instead of SQLite
- Use object storage (S3, DigitalOcean Spaces, etc.) for uploaded files
- Set strong, unique values for `KEY` and `SECRET` environment variables
- Update `PUBLIC_DIRECTUS_URL` in your Astro app to the production URL

## Troubleshooting

### Albums not showing up
- Check Directus is running and accessible
- Verify Public role can read `albums` and `photos`
- Ensure albums have `status = 'published'`

### Images not loading
- Check Public role has read access to `directus_files`
- If cross-domain, configure CORS: `CORS_ENABLED=true`, `CORS_ORIGIN=http://localhost:4321`
- Verify `PUBLIC_DIRECTUS_URL` in `.env` is correct

## Resources

- [Directus Documentation](https://docs.directus.io/)
- [Directus SDK Documentation](https://docs.directus.io/reference/sdk.html)
- [Directus Cloud](https://directus.cloud/)
- [Directus GitHub](https://github.com/directus/directus)
