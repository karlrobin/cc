# Private Photo Blog with Astro, Supabase & Directus

A beautiful, private photo blog built with Astro, Supabase Auth, and Directus CMS. Features passwordless magic link authentication, membership system, and easy content management.

## Features

- 🔐 **Magic Link Authentication** - Passwordless sign-in via email
- 👥 **Membership System** - Users can request access or receive invitations
- 🎟️ **Invitation System** - Admins can send invitation emails
- ⏰ **Long-lived Sessions** - Stay signed in for up to 1 year
- 📸 **Photo Albums** - Beautiful gallery layouts for photo collections
- 🎨 **CMS Managed** - Directus CMS for easy content management
- 🛡️ **Secure** - Supabase Auth + Row Level Security
- ⚡ **Fast** - Server-rendered Astro with minimal JavaScript
- 📱 **Responsive** - Works beautifully on all devices

## Architecture

- **Framework**: Astro (SSR mode with Node adapter)
- **Authentication**: Supabase Auth (magic links)
- **User Database**: Supabase PostgreSQL with RLS
- **Content CMS**: Directus (albums & photos)
- **Styling**: Vanilla CSS (no framework)
- **Deployment**: Any Node.js host (Netlify, Vercel, Railway, etc.)

## Prerequisites

- Node.js 18+
- A Supabase account (free tier works great)
- A Directus instance (Cloud or self-hosted)
- An SMTP email service (Supabase provides one, or use your own)

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd astro-photo-blog
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)

2. In your Supabase dashboard, go to **SQL Editor** and run the schema from `supabase-schema.sql`

3. Configure email templates:
   - Go to **Authentication** → **Email Templates**
   - Customize the "Magic Link" template if desired
   - Make sure emails are enabled

4. Get your credentials:
   - Go to **Project Settings** → **API**
   - Copy the `URL` and `anon` key

### 3. Set Up Directus CMS

Directus manages your photo albums and content. You can use Directus Cloud or self-host.

**Quick Setup (Directus Cloud):**
1. Sign up at [directus.cloud](https://directus.cloud)
2. Create a new project
3. Note your project URL

**Or Self-Host with Docker:**
See `DIRECTUS_SETUP.md` for detailed instructions.

**Create Collections:**
See the complete guide in `DIRECTUS_SETUP.md` for:
- Creating `albums` and `photos` collections
- Setting up relationships
- Configuring public access permissions
- Adding your first album

### 4. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Supabase (for authentication)
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Directus (for content management)
PUBLIC_DIRECTUS_URL=http://localhost:8055
# Or for Directus Cloud:
# PUBLIC_DIRECTUS_URL=https://your-project.directus.app

# Application URL
PUBLIC_APP_URL=http://localhost:4321
```

### 5. Create Your First Admin

After running the schema, sign in with your email through the app, then run this SQL in Supabase to make yourself an admin:

```sql
insert into public.memberships (user_id, email, status, role, approved_at)
values (
  (select id from auth.users where email = 'your-email@example.com'),
  'your-email@example.com',
  'approved',
  'admin',
  now()
);
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:4321](http://localhost:4321)

**Note**: Make sure both Supabase and Directus are properly configured before running the app. You need at least one published album in Directus to see content.

## How It Works

### Authentication Flow

1. **User Signs In**
   - User enters their email on `/signin`
   - Supabase sends a magic link via email
   - User clicks link, gets authenticated, redirected to homepage

2. **Membership Request**
   - Authenticated user visits `/request-access`
   - Submits request with optional message
   - Request stored in database with `pending` status
   - Admin reviews and approves/rejects

3. **Session Management**
   - Tokens stored in HTTP-only cookies (secure)
   - Sessions last up to 1 year
   - Auto-refresh handled by Supabase

### Authorization

Protected content checks:
```typescript
const { user, membership } = await getSession(Astro.cookies);
const isApproved = membership?.status === 'approved';
```

Only approved members can view albums.

## Project Structure

```
/
├── src/
│   ├── layouts/
│   │   └── Layout.astro         # Base layout with header/footer
│   ├── pages/
│   │   ├── index.astro          # Homepage (album listing)
│   │   ├── signin.astro         # Magic link sign-in
│   │   ├── request-access.astro # Membership request
│   │   ├── albums/
│   │   │   └── [id].astro       # Individual album pages
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── signin.ts    # Send magic link
│   │       │   ├── callback.ts  # Handle magic link
│   │       │   └── signout.ts   # Sign out
│   │       └── membership/
│   │           └── request.ts   # Submit membership request
│   ├── lib/
│   │   ├── supabase.ts          # Supabase client
│   │   ├── directus.ts          # Directus CMS client
│   │   └── auth.ts              # Auth helpers
│   └── styles/
│       └── global.css           # Global styles
├── astro.config.mjs             # Astro configuration
├── supabase-schema.sql          # Database schema (auth/memberships)
├── DIRECTUS_SETUP.md            # Directus CMS setup guide
└── package.json
```

## Managing Albums

Albums are managed through **Directus CMS**, providing a beautiful admin interface for content management.

### Adding a New Album

1. **Log in to Directus**
   - Access your Directus admin panel
   - Default: `http://localhost:8055` or your Directus Cloud URL

2. **Create an Album**
   - Go to **Content** → **Albums**
   - Click **Create Item**
   - Fill in:
     - **Slug**: URL-friendly identifier (e.g., `summer-2024`)
     - **Title**: Display name (e.g., `Summer Adventures 2024`)
     - **Description**: Optional description
     - **Status**: Set to `published` to make it visible
     - **Date Published**: When to show this album
     - **Cover Image**: Optional cover (uses first photo if not set)

3. **Add Photos**
   - Go to **Content** → **Photos**
   - Click **Create Item**
   - Upload image and select the album
   - Add caption and sort order
   - Repeat for all photos

   Or use the relationship field in the album to add photos directly.

4. **Publish**
   - Make sure album status is `published`
   - Photos will automatically be visible when album is published

### Editing Albums

1. Go to **Content** → **Albums** in Directus
2. Click on the album you want to edit
3. Make your changes
4. Save
5. Changes appear immediately on the website (no rebuild needed!)

### Managing Photos

- **Reorder**: Use the `sort` field (lower numbers appear first)
- **Update**: Edit photo details or replace images
- **Delete**: Remove photos from albums
- **Bulk Upload**: Upload multiple photos at once

### Image Management

Directus provides built-in image transformations. Images are served from:
```
{DIRECTUS_URL}/assets/{file-id}
```

You can add transformations:
```
{DIRECTUS_URL}/assets/{file-id}?width=800&quality=80
```

See `DIRECTUS_SETUP.md` for more details on image optimization.

### Content Workflow

- **Draft**: Work on albums before publishing
- **Published**: Visible to approved members
- **Archived**: Hide old albums without deleting

See the complete Directus setup guide in `DIRECTUS_SETUP.md`.

## Admin Features

### Reviewing Membership Requests

Build an admin dashboard by:

1. Create `src/pages/admin/index.astro`
2. Query pending memberships:

```typescript
const { data: requests } = await supabase
  .from('memberships')
  .select('*')
  .eq('status', 'pending')
  .order('created_at', { ascending: false });
```

3. Provide approve/reject buttons that update the membership status

### Sending Invitations

Create an invitation system:

```typescript
// Generate invitation token
const token = crypto.randomUUID();

await supabase
  .from('invitation_tokens')
  .insert({
    email: inviteeEmail,
    token,
    invited_by: adminUserId,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  });

// Send invitation email with link: /invite?token=...
```

## Deployment

### Netlify

```bash
npm run build
netlify deploy --prod
```

Add environment variables in Netlify dashboard.

### Vercel

```bash
npm run build
vercel --prod
```

Add environment variables in Vercel dashboard.

### Railway / Render / Fly.io

All support Node.js apps. Set:
- Build command: `npm run build`
- Start command: `node dist/server/entry.mjs`

### Environment Variables

Remember to set in production:
- `PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `PUBLIC_DIRECTUS_URL` - Your Directus instance URL
- `PUBLIC_APP_URL` - Your production domain (for magic links)

## Security Considerations

### ✅ What's Secure

- **Magic links**: No passwords to steal or leak
- **HTTP-only cookies**: Tokens not accessible to JavaScript
- **Row Level Security**: Database enforces access control
- **Server-side rendering**: Auth checks happen on server
- **Long sessions**: Users stay logged in without UX friction

### 🔒 Production Recommendations

1. **Enable HTTPS** (required for secure cookies)
2. **Configure email rate limiting** in Supabase
3. **Review RLS policies** for your use case
4. **Set up monitoring** for suspicious activity
5. **Regular backups** of both Supabase and Directus databases
6. **Use object storage** (S3, Spaces, etc.) for Directus files in production
7. **Configure CORS** properly if Directus and Astro are on different domains

## Customization

### Styling

All styles are in `src/styles/global.css`. No build tools or preprocessors needed.

### Email Templates

Customize in Supabase Dashboard → Authentication → Email Templates

### Add More Features

Ideas to extend:
- Comments on albums
- Photo uploads (with Supabase Storage)
- Social sharing
- RSS feed for members
- Photo likes/reactions
- Download albums as ZIP

## Troubleshooting

### Magic links not working

- Check Supabase email settings
- Verify `PUBLIC_APP_URL` matches your domain
- Check spam folder
- Review Supabase logs in dashboard

### "Not authenticated" errors

- Clear cookies and sign in again
- Check environment variables are set
- Verify tokens aren't expired

### Database permission errors

- Confirm RLS policies are created
- Check user has membership record
- Verify membership status is 'approved'

## License

MIT

## Support

For issues or questions:
- Check [Astro docs](https://docs.astro.build)
- Check [Supabase docs](https://supabase.com/docs)
- Review the code - it's well-commented!
- Open an issue in this repository

---

Built with ❤️ using Astro and Supabase
