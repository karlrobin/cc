# Directus CMS Setup Guide

This guide will walk you through setting up Directus CMS to manage your photo albums.

## What is Directus?

Directus is an open-source headless CMS that provides a beautiful admin interface for managing your content. You can either:
- **Self-host** Directus (free, full control)
- Use **Directus Cloud** (managed hosting, easier setup)

## Quick Start

### Option 1: Directus Cloud (Recommended for Beginners)

1. Sign up at [directus.cloud](https://directus.cloud)
2. Create a new project
3. Copy your project URL (e.g., `https://your-project.directus.app`)
4. Update `.env` with your Directus URL:
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

4. Update `.env`:
   ```env
   PUBLIC_DIRECTUS_URL=http://localhost:8055
   ```

## Creating the Data Model

Once Directus is running, follow these steps:

### 1. Create the "Albums" Collection

1. Go to **Settings** → **Data Model**
2. Click **Create Collection**
3. Name it `albums`
4. Click **Continue**

### 2. Add Fields to Albums Collection

Add these fields to the `albums` collection:

| Field Name | Type | Interface | Options |
|------------|------|-----------|---------|
| `slug` | String | Input | Required, Unique |
| `title` | String | Input | Required |
| `description` | Text | Textarea | Optional |
| `status` | String | Dropdown | Options: `published`, `draft`, `archived` |
| `date_published` | Timestamp | Datetime | Optional |
| `cover_image` | UUID | Image | Optional (File relation) |

#### Detailed Field Setup:

**Slug** (URL-friendly identifier)
- Type: String
- Interface: Input
- Options:
  - Check "Required"
  - Check "Unique"
  - Validation: `^[a-z0-9-]+$` (lowercase letters, numbers, hyphens only)

**Title**
- Type: String
- Interface: Input
- Options:
  - Check "Required"

**Description**
- Type: Text
- Interface: Textarea
- Options:
  - Optional
  - Markdown enabled (if desired)

**Status**
- Type: String
- Interface: Dropdown
- Options:
  - Default Value: `draft`
  - Choices:
    - `published` (Published)
    - `draft` (Draft)
    - `archived` (Archived)

**Date Published**
- Type: Timestamp
- Interface: Datetime
- Options:
  - Optional
  - Can auto-set on status change to published

**Cover Image**
- Type: UUID
- Interface: Image
- Related Collection: `directus_files`
- Options:
  - Optional (will use first photo if not set)

### 3. Create the "Photos" Collection

1. Create a new collection named `photos`
2. Add these fields:

| Field Name | Type | Interface | Options |
|------------|------|-----------|---------|
| `album` | UUID | Many-to-One | Related to `albums` |
| `url` | UUID | Image | Related to `directus_files` |
| `caption` | String | Input | Optional |
| `sort` | Integer | Input | Optional, default to 0 |

#### Detailed Field Setup:

**Album** (Relationship)
- Type: UUID (Many-to-One)
- Interface: Many-to-One
- Related Collection: `albums`
- Options:
  - Required
  - Display Template: `{{title}}`

**URL** (Image File)
- Type: UUID
- Interface: Image
- Related Collection: `directus_files`
- Options:
  - Required

**Caption**
- Type: String
- Interface: Input
- Options:
  - Optional

**Sort**
- Type: Integer
- Interface: Input
- Options:
  - Default: 0
  - Used for ordering photos

### 4. Create Relationship Between Albums and Photos

1. Go back to the `albums` collection
2. Add a new field:
   - Name: `photos`
   - Type: One-to-Many (O2M)
   - Related Collection: `photos`
   - Foreign Key: `album`
   - Sort Field: `sort`

This allows you to see all photos when viewing an album.

### 5. Create the "Memberships" Collection

This collection manages user access to your photo blog.

1. Create a new collection named `memberships`
2. Add these fields:

| Field Name | Type | Interface | Options |
|------------|------|-----------|---------|
| `user_id` | String | Input | Required, Unique |
| `email` | String | Input | Required, Unique |
| `status` | String | Dropdown | Options: `pending`, `approved`, `rejected` |
| `role` | String | Dropdown | Options: `member`, `admin` |
| `request_message` | Text | Textarea | Optional |
| `approved_at` | Timestamp | Datetime | Optional |

#### Detailed Field Setup:

**User ID** (from Supabase Auth)
- Type: String
- Interface: Input
- Options:
  - Required
  - Unique
  - This will store the Supabase user ID

**Email**
- Type: String
- Interface: Input
- Options:
  - Required
  - Unique
  - Validation: Email format

**Status**
- Type: String
- Interface: Dropdown
- Options:
  - Default Value: `pending`
  - Choices:
    - `pending` (Pending Review)
    - `approved` (Approved)
    - `rejected` (Rejected)

**Role**
- Type: String
- Interface: Dropdown
- Options:
  - Default Value: `member`
  - Choices:
    - `member` (Member)
    - `admin` (Admin)

**Request Message**
- Type: Text
- Interface: Textarea
- Options:
  - Optional
  - User's message when requesting access

**Approved At**
- Type: Timestamp
- Interface: Datetime
- Options:
  - Optional
  - Automatically set when status changes to approved

## Configuring Public Access

To allow the Astro app to read albums without authentication:

### 1. Create a Public Role

1. Go to **Settings** → **Roles & Permissions**
2. Click **Create Role**
3. Name: `Public`
4. Check **Public Role**
5. Save

### 2. Set Permissions

For the `Public` role:

**Albums Collection:**
- ✅ Read: Custom Access
  - Filter: Status equals `published`
- ❌ Create, Update, Delete: No access

**Photos Collection:**
- ✅ Read: All Access
- ❌ Create, Update, Delete: No access

**Memberships Collection:**
- ✅ Create: All Access (allows membership requests)
- ✅ Read: Custom Access
  - Filter: User ID equals `$CURRENT_USER` (users can read their own membership)
- ❌ Update, Delete: No access

**Files (directus_files):**
- ✅ Read: All Access
- ❌ Create, Update, Delete: No access

This ensures:
- Public can only read published albums and their photos
- Users can request membership
- Users can check their own membership status
- Only admins can approve/reject memberships (via Directus admin UI)

### 3. Admin Permissions

The admin role (created by default in Directus) should have full access to all collections for managing content and memberships.

## Adding Your First Album

1. Go to **Content** → **Albums**
2. Click **Create Item**
3. Fill in:
   - **Slug**: `summer-2024` (lowercase, no spaces)
   - **Title**: `Summer Adventures 2024`
   - **Description**: `Our amazing summer vacation`
   - **Status**: `published`
   - **Date Published**: Today's date
4. Save the album

5. Go to **Content** → **Photos**
6. Click **Create Item** and add photos:
   - **Album**: Select your album
   - **URL**: Upload an image
   - **Caption**: Describe the photo
   - **Sort**: 1, 2, 3... (for ordering)
7. Repeat for all photos

Alternatively, you can add photos directly from the album detail view using the relationship field.

## Managing Memberships

With the hybrid approach, Directus manages all membership data while Supabase handles authentication.

### Reviewing Membership Requests

1. **View Pending Requests**
   - Go to **Content** → **Memberships**
   - Filter by Status: `pending`
   - You'll see all users who have requested access

2. **Approve a Membership**
   - Click on a membership request
   - Change **Status** to `approved`
   - Optionally set **Approved At** to current date
   - Save
   - User can now access albums!

3. **Reject a Membership**
   - Click on a membership request
   - Change **Status** to `rejected`
   - Save
   - User will see they don't have access

### Making Someone an Admin

1. Go to **Content** → **Memberships**
2. Find the user's membership
3. Change **Role** to `admin`
4. Change **Status** to `approved` (if not already)
5. Save

Admins have the same access as members (they see albums). The `admin` role is mainly used if you want to add admin-specific features later.

### Creating Your First Admin

After setting up Directus:

1. Sign in to your photo blog at least once (this creates your Supabase user)
2. In Directus, go to **Content** → **Memberships** → **Create Item**
3. Fill in:
   - **User ID**: Your Supabase user ID (from Supabase dashboard → Authentication → Users)
   - **Email**: Your email address
   - **Status**: `approved`
   - **Role**: `admin`
   - **Approved At**: Current date
4. Save

Now you have full access to the photo blog!

### Viewing All Members

Go to **Content** → **Memberships** to see:
- All membership requests (pending, approved, rejected)
- Member roles
- When they requested access
- When they were approved

### Batch Operations

You can:
- Select multiple pending requests
- Batch approve/reject them
- Export member lists
- Filter by status or role

## File Uploads Configuration

### Storage Options

Directus supports multiple storage adapters:

1. **Local Storage** (default)
   - Files stored on server
   - Good for development

2. **S3 / DigitalOcean Spaces / Cloudflare R2**
   - Scalable object storage
   - Recommended for production

3. **Cloudinary**
   - Image optimization included
   - Good for image-heavy sites

### Image Transformations

Directus can transform images on the fly. Example URLs:

```
# Original
{DIRECTUS_URL}/assets/{file-id}

# Resized to 800px width
{DIRECTUS_URL}/assets/{file-id}?width=800

# Square thumbnail
{DIRECTUS_URL}/assets/{file-id}?width=400&height=400&fit=cover

# With quality setting
{DIRECTUS_URL}/assets/{file-id}?width=1200&quality=80
```

You can update the Astro code to use these transformations for better performance.

## Environment Variables

Make sure your `.env` file has:

```env
# Directus CMS Configuration
PUBLIC_DIRECTUS_URL=http://localhost:8055
# Or for Directus Cloud:
# PUBLIC_DIRECTUS_URL=https://your-project.directus.app
```

## Testing the Integration

1. Make sure Directus is running
2. Create at least one published album with photos
3. Run your Astro app:
   ```bash
   npm run dev
   ```
4. Sign in and check if albums appear

## Troubleshooting

### Albums not showing up

1. **Check Directus is running**: Visit your Directus URL in a browser
2. **Check permissions**: Ensure Public role can read `albums` and `photos`
3. **Check status**: Albums must have `status = 'published'`
4. **Check console**: Look for errors in browser console and terminal

### Images not loading

1. **Check file permissions**: Public role needs read access to `directus_files`
2. **Check CORS**: If Directus and Astro are on different domains, configure CORS in Directus:
   ```env
   CORS_ENABLED=true
   CORS_ORIGIN=http://localhost:4321
   ```
3. **Check URLs**: Verify `PUBLIC_DIRECTUS_URL` in `.env` is correct

### "Module not found" errors

Run:
```bash
npm install
```

## Production Deployment

### Directus Cloud

1. Deploy to Directus Cloud
2. Note your production URL
3. Update your production environment variables

### Self-Hosted Directus

1. Deploy Directus to your server (Docker recommended)
2. Use a proper database (PostgreSQL recommended over SQLite)
3. Set up file storage (S3, Spaces, etc.)
4. Configure environment variables:
   ```env
   KEY=random-secure-key
   SECRET=random-secure-secret
   DB_CLIENT=postgres
   DB_HOST=your-db-host
   DB_PORT=5432
   DB_DATABASE=directus
   DB_USER=directus
   DB_PASSWORD=secure-password
   ```

5. Update Astro's `PUBLIC_DIRECTUS_URL` to your production URL

## Next Steps

- **Customize Fields**: Add custom fields like photographer, location, tags
- **Webhooks**: Trigger Astro rebuilds when content changes
- **Image Optimization**: Use Directus transforms for responsive images
- **Search**: Add search functionality using Directus filters
- **Backups**: Set up automated backups of your Directus database

## Resources

- [Directus Documentation](https://docs.directus.io/)
- [Directus SDK Documentation](https://docs.directus.io/reference/sdk.html)
- [Directus Cloud](https://directus.cloud/)
- [Directus GitHub](https://github.com/directus/directus)
